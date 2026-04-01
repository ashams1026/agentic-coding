# Workflow System

AgentOps uses a hardcoded 8-state workflow to manage work items. The state machine, transitions, and routing logic are defined in code — not user-configurable.

## State Machine

### States

| State | Color | Description |
|---|---|---|
| **Backlog** | `#6b7280` (gray) | New items waiting to be planned |
| **Planning** | `#7c3aed` (purple) | Being planned and scoped |
| **Decomposition** | `#4f46e5` (indigo) | Being broken into subtasks |
| **Ready** | `#2563eb` (blue) | Ready for implementation |
| **In Progress** | `#d97706` (amber) | Actively being worked on |
| **In Review** | `#ea580c` (orange) | Work complete, under review |
| **Done** | `#16a34a` (green) | Completed (final state) |
| **Blocked** | `#dc2626` (red) | Cannot proceed, needs intervention |

### Transition Map

```
Backlog ──────────► Planning
                      │
                      ├──► Ready ──────► In Progress ──► In Review ──► Done
                      │      │              │
                      │      ▼              │
                      │   Decomposition ──► In Progress
                      │      │
                      │      ▼
                      │   Blocked ◄──── (any state except Done)
                      │      │
                      ▼      ▼
                   Blocked   Planning / Decomposition / Ready / In Progress
```

### Valid Transitions (exact)

| From | To |
|---|---|
| Backlog | Planning |
| Planning | Ready, Blocked |
| Decomposition | In Progress, Blocked |
| Ready | In Progress, Decomposition, Blocked |
| In Progress | In Review, Blocked |
| In Review | Done, In Progress |
| Blocked | Planning, Decomposition, Ready, In Progress |
| Done | *(none — final state)* |

Transitions are enforced server-side by `isValidTransition()` from `@agentops/shared`. Invalid transitions return HTTP 400.

### Rate Limiting

State transitions are rate-limited to **10 per hour per work item** to prevent infinite loops from auto-routing. This is enforced in `execution-manager.ts` via an in-memory timestamp log.

## How Items Move Between States

Items can be transitioned in two ways:

### 1. Manual Transitions

Users change state via the detail panel's transition dropdown. The UI shows only valid next states.

```
PATCH /api/work-items/:id
{ "currentState": "In Progress" }
```

### 2. Automatic Transitions (Auto-Routing)

When a persona completes execution on a work item, the **Router agent** is dispatched to decide the next state. This creates a fully automated pipeline.

The cycle:
1. Work item enters a state (e.g., "Planning")
2. `dispatchForState()` checks if a persona is assigned to this state
3. The assigned persona executes (e.g., Product Manager plans the item)
4. On completion, `runRouter()` is called
5. The Router agent evaluates the work and calls `route_to_state` MCP tool
6. The item transitions to the next state
7. `dispatchForState()` fires again for the new state
8. Cycle continues until the item reaches "Done" or "Blocked"

## Persona-Per-State Assignments

Each workflow state can have one persona assigned per project. Assignments are stored in the `persona_assignments` table with composite key `(projectId, stateName)`.

| State | Typical Persona | Role |
|---|---|---|
| Planning | Product Manager | Define requirements, scope, acceptance criteria |
| Decomposition | Tech Lead | Break into subtasks, define architecture |
| Ready | *(none)* | Waiting for implementation slot |
| In Progress | Engineer | Implement the work |
| In Review | Code Reviewer | Review implementation quality |

**Backlog**, **Done**, and **Blocked** have no persona assignments — they are manual or system-triggered states.

Configure assignments in **Settings > Workflow > Persona Assignments**.

## The Router Agent

The Router is a special system persona that decides state transitions after each persona completes work.

### How It Works

1. After a persona execution completes successfully, `runRouter(workItemId)` is called
2. The Router reads the work item's context and execution history via MCP tools (`get_context`, `list_items`)
3. It decides the appropriate next state
4. It calls the `route_to_state` MCP tool to make the transition
5. The transition triggers the next persona dispatch

### Structured Output

The Router uses the SDK's `outputFormat` option to return machine-readable decisions. When `persona.settings.isRouter` is true, the executor passes a JSON schema to `query()`:

```json
{
  "nextState": "In Review",
  "reasoning": "Implementation complete, all acceptance criteria met. Build passes.",
  "confidence": "high"
}
```

| Field | Type | Description |
|---|---|---|
| `nextState` | string | Target workflow state name |
| `reasoning` | string | Explanation for the routing decision |
| `confidence` | `"high"` \| `"medium"` \| `"low"` | How confident the Router is in this decision |

The structured output is stored in the `structuredOutput` column of the executions table and displayed in the UI as a **Router Decision Card** (state badge + confidence indicator + reasoning text).

### Router Configuration

- **Model:** haiku (for cost efficiency)
- **Tools:** `list_items`, `get_context`, `route_to_state`
- **Settings:** `{ isSystem: true, isRouter: true }` — the `isRouter` flag enables structured output
- **System prompt:** Guidelines for state decisions (e.g., after "In Progress" → "In Review", after successful review → "Done", issues found → back to "In Progress")
- **Created lazily:** The Router persona is auto-created in the database on first use

### Router Safety Features

Three layers prevent routing loops:

1. **Same-state rejection:** The `route_to_state` MCP tool rejects transitions to the item's current state, preventing infinite self-loops.

2. **Transition history awareness:** Before routing, the Router's system prompt is dynamically updated with the last 3 state transitions for the work item (from Router comments). This context helps avoid re-triggering the same persona.

3. **Loop detection:** An in-memory state history (6 entries) tracks transitions per work item. If a state appears 3+ times, the item is auto-escalated to "Blocked" with a system comment explaining the loop.

Additionally, the rate limiter logs all pauses with `logger.warn`, posts system comments, and broadcasts WS events so the UI can show rate-limit status.

### Auto-Routing Toggle

Auto-routing is controlled by the `autoRouting` setting in project settings:

- **ON** (default): Router fires after every persona completion
- **OFF**: Router is skipped; items stay in their current state until manually transitioned

Toggle via the **play/pause button** in the status bar, Settings > Workflow, or the Work Items header. The UI uses a play/pause metaphor with emerald (running) and amber (paused) colors.

The backend checks `project.settings.autoRouting` in `router.ts`:
```typescript
const autoRouting = project.settings.autoRouting;
if (autoRouting === false) return false; // Explicitly disabled
```

## Parent-Child Coordination

Work items form a hierarchy (parent → children → grandchildren). The system automatically coordinates state changes between parents and children.

### All Children Done → Parent Auto-Advances

When a child work item reaches **"Done"**:
1. The system checks if **all** siblings are also "Done"
2. If yes, the parent auto-advances to **"In Review"**
3. A system comment is posted: *"All N child work items are Done. Auto-advancing to In Review."*
4. `dispatchForState()` fires for the parent's new state (dispatches the reviewer persona)

The parent is NOT advanced if it's already in "Done" or "In Review".

### Child Blocked → Parent Notified

When a child work item enters **"Blocked"**:
1. A system comment is posted on the parent: *'Child work item "title" (id) is now Blocked.'*
2. The parent is NOT automatically blocked — it's just flagged via comment

This coordination logic lives in `packages/backend/src/agent/coordination.ts`.

## Rejection and Retry Logic

When a reviewer (In Review state) finds issues, the work item is **rejected** — sent back to "In Progress" for rework.

### How Rejection Works

1. The reviewing persona calls `route_to_state` with target "In Progress" (an allowed transition from "In Review")
2. `handleRejection()` is called, which:
   - Counts existing rejections in the `executionContext` array
   - Appends a structured `RejectionPayload` to the execution context
   - Returns the target state

### Structured Rejection Payload

```typescript
interface RejectionPayload {
  reason: string;       // Why the work was rejected
  severity: "low" | "medium" | "high";
  hint: string;         // Suggestion for what to fix
  retryCount: number;   // How many times this item has been rejected
}
```

### Max Retries and Escalation

- **Max rejections:** 3 (`MAX_REJECTIONS` constant)
- After the 3rd rejection, the item is **automatically escalated to "Blocked"** instead of returning to "In Progress"
- The `retryCount` is calculated from the number of rejection entries in `executionContext`

```
1st rejection: In Review → In Progress (retryCount: 1)
2nd rejection: In Review → In Progress (retryCount: 2)
3rd rejection: In Review → Blocked     (retryCount: 3, escalated)
```

### Retry Visibility

Each rejection is preserved in the work item's `executionContext` array, visible in the detail panel's execution timeline. The next agent dispatched to "In Progress" sees the full rejection history in its system prompt, including the reason, severity, and hint from each rejection.

## Dispatch Checks

Before dispatching a persona, `dispatchForState()` performs several checks:

1. **Persona assigned?** — Is there a persona assigned to this state for this project?
2. **Concurrency limit?** — Is `canSpawn()` true? (under `maxConcurrent` from project settings)
3. **Monthly cost cap?** — Is current month's spend under `monthCap`?

If any check fails, the dispatch is skipped or queued (concurrency limiter has a priority FIFO queue).

## Source Files

| File | Purpose |
|---|---|
| `packages/shared/src/workflow.ts` | `WORKFLOW` constant, transition map, validation helpers |
| `packages/backend/src/agent/dispatch.ts` | `dispatchForState()` — triggers persona execution on state entry |
| `packages/backend/src/agent/router.ts` | `runRouter()` — Router agent decision logic |
| `packages/backend/src/agent/coordination.ts` | `checkParentCoordination()` — parent-child auto-advance |
| `packages/backend/src/agent/execution-manager.ts` | `handleRejection()` — rejection counting and escalation |
