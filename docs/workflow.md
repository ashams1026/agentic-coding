# Workflow System

AgentOps uses a **custom workflow engine** to manage work items. Each project can have one or more workflows — user-defined state machines with custom states, transitions, colors, and per-state agent assignments. A visual **Workflow Builder** lets you design workflows in the browser. A default 8-state workflow is seeded on first run.

## Custom Workflows

### Creating and Editing

Workflows are managed from the **Workflows** page (`/workflows`). Each workflow has:

- **Name** and optional description
- **States** — named nodes with a type (`initial`, `intermediate`, or `terminal`), color, optional default agent, and sort order
- **Transitions** — directed edges between states with optional labels and sort order
- **Published** flag — draft workflows are editable; published workflows are active

The **Workflow Builder** provides:
- A state card list where you add/remove/reorder states
- Per-state agent assignment (dropdown)
- Transition editing per state (target state + label)
- A live SVG preview graph showing the state machine visually
- A validation panel (checks for unreachable states, dead-ends, missing initial/terminal)
- Clone and delete operations

### API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/workflows` | List workflows (optional `?projectId=`) |
| `GET` | `/api/workflows/:id` | Get workflow with states and transitions |
| `GET` | `/api/workflows/:id/states` | List states for a workflow |
| `GET` | `/api/workflows/:id/transitions` | List transitions for a workflow |
| `POST` | `/api/workflows` | Create a new draft workflow |
| `PATCH` | `/api/workflows/:id` | Update name, states, transitions (in a single transaction) |
| `POST` | `/api/workflows/:id/publish` | Publish a workflow |
| `POST` | `/api/workflows/:id/clone` | Clone with state/transition ID remapping |
| `POST` | `/api/workflows/:id/validate` | Check for structural issues |
| `DELETE` | `/api/workflows/:id` | Delete (409 if published and in use) |

### Validation Rules

The `POST /api/workflows/:id/validate` endpoint checks:
- At least one `initial` state and one `terminal` state exist
- No unreachable states (all states reachable from initial via transitions)
- No dead-end states (all non-terminal states have at least one outgoing transition)
- Non-empty state names, valid state type enum
- Transition references point to existing states

### Schema

Three tables store workflow data:

- **`workflows`** — `id`, `name`, `description`, `projectId`, `scope`, `isPublished`, `createdAt`, `updatedAt`
- **`workflow_states`** — `id`, `workflowId`, `name`, `type`, `color`, `personaId`, `sortOrder`
- **`workflow_transitions`** — `id`, `workflowId`, `fromStateId`, `toStateId`, `label`, `sortOrder`

Work items and executions reference `workflowId` to track which workflow governs them.

## Default Workflow

A default 8-state workflow is seeded on first run. It provides a typical software development pipeline:

| State | Type | Color | Description |
|---|---|---|---|
| **Backlog** | initial | gray | New items waiting to be planned |
| **Planning** | intermediate | purple | Being planned and scoped |
| **Decomposition** | intermediate | indigo | Being broken into subtasks |
| **Ready** | intermediate | blue | Ready for implementation |
| **In Progress** | intermediate | amber | Actively being worked on |
| **In Review** | intermediate | orange | Work complete, under review |
| **Done** | terminal | green | Completed |
| **Blocked** | intermediate | red | Cannot proceed, needs intervention |

This default workflow can be cloned and modified, or replaced entirely with a custom workflow.

## Dynamic Runtime

The workflow runtime (`workflow-runtime.ts`) queries states and transitions from the database at runtime. When a `workflowId` is present, all operations (validation, routing, dispatch) use the custom workflow's state machine. When `workflowId` is null, the system falls back to the hardcoded `WORKFLOW` constant in `@agentops/shared`.

Key runtime functions:

| Function | Description |
|---|---|
| `getWorkflowStates(workflowId)` | Returns states from DB (or fallback) |
| `getWorkflowTransitions(workflowId)` | Returns transitions with resolved state names |
| `isValidTransitionDynamic(workflowId, from, to)` | Validates a transition against the workflow |
| `getWorkflowInitialState(workflowId)` | Returns the initial state name |
| `resolvePersonaForState(projectId, workflowId, state)` | Resolves agent: workflow state default → persona_assignments fallback |
| `buildDynamicRouterPrompt(workflowId, currentState)` | Builds Router prompt with valid target states |

## How Items Move Between States

Items can be transitioned in two ways:

### 1. Manual Transitions

Users change state via the detail panel's transition dropdown. The UI shows only valid next states for the current workflow.

```
PATCH /api/work-items/:id
{ "currentState": "In Progress" }
```

### 2. Automatic Transitions (Auto-Routing)

When an agent completes execution on a work item, the **Router agent** is dispatched to decide the next state. This creates a fully automated pipeline.

The cycle:
1. Work item enters a state (e.g., "Planning")
2. `dispatchForState()` resolves the agent for this state via `resolvePersonaForState()` — checks the workflow state's default agent first, then falls back to the `persona_assignments` table
3. The assigned agent executes (e.g., Product Manager plans the item)
4. On completion, `runRouter()` is called
5. The Router agent evaluates the work and calls `route_to_state` MCP tool
6. The Router's system prompt is dynamically built from the workflow's transition map via `buildDynamicRouterPrompt()`
7. The item transitions to the next state
8. `dispatchForState()` fires again for the new state
9. Cycle continues until the item reaches a terminal state or "Blocked"

## Agent-Per-State Assignments

Each workflow state can have a default agent assigned directly in the workflow builder. Additionally, the `persona_assignments` table provides per-project overrides with composite key `(projectId, stateName)`.

Resolution priority:
1. Workflow state's `personaId` (set in workflow builder)
2. `persona_assignments` table entry for this project + state name
3. `null` (no agent — manual state)

Configure assignments in the **Workflow Builder** (per-state dropdown) or **Settings > Workflow > Persona Assignments** (per-project overrides).

## The Router Agent

The Router is a special system agent that decides state transitions after each agent completes work.

### How It Works

1. After an agent execution completes, `runRouter(workItemId)` is called
2. The Router receives a dynamically-built prompt listing valid target states from the workflow's transition map
3. It reads the work item's context and execution history via MCP tools (`get_context`, `list_items`)
4. It decides the appropriate next state
5. It calls the `route_to_state` MCP tool to make the transition
6. The transition triggers the next agent dispatch

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
| `confidence` | `"high"` \| `"medium"` \| `"low"` | How confident the Router is |

The structured output is stored in the `structuredOutput` column of the executions table and displayed as a **Router Decision Card**.

### Router Safety Features

Three layers prevent routing loops:

1. **Same-state rejection:** The `route_to_state` MCP tool rejects transitions to the item's current state.

2. **Transition history awareness:** The Router's system prompt includes the last 3 state transitions for the work item.

3. **Loop detection:** An in-memory state history (6 entries) tracks transitions per work item. If a state appears 3+ times, the item is auto-escalated to "Blocked" with a system comment.

### Auto-Routing Toggle

Auto-routing is controlled by the `autoRouting` setting in project settings:

- **ON** (default): Router fires after every agent completion
- **OFF**: Router is skipped; items stay in their current state until manually transitioned

Toggle via the **play/pause button** in the status bar, Settings > Workflow, or the Work Items header.

### Rate Limiting

State transitions are rate-limited to **10 per hour per work item** to prevent infinite loops. Enforced in `execution-manager.ts` via an in-memory timestamp log.

## Parent-Child Coordination

Work items form a hierarchy (parent → children). The system automatically coordinates state changes.

### All Children Done → Parent Auto-Advances

When a child reaches a terminal state:
1. Check if **all** siblings are also in a terminal state
2. If yes, parent auto-advances to **"In Review"** (or equivalent intermediate state)
3. A system comment is posted and `dispatchForState()` fires for the parent

### Child Blocked → Parent Notified

When a child enters **"Blocked"**, a system comment is posted on the parent.

This logic lives in `packages/backend/src/agent/coordination.ts`.

## Rejection and Retry Logic

When a reviewer finds issues, the work item is **rejected** — sent back to an earlier state for rework.

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
- After the 3rd rejection, the item is **escalated to "Blocked"**
- Each rejection is preserved in the work item's `executionContext` array

## Dispatch Checks

Before dispatching an agent, `dispatchForState()` checks:

1. **Agent assigned?** — Is there an agent for this state? (via `resolvePersonaForState()`)
2. **Concurrency limit?** — Is `canSpawn()` true?
3. **Monthly cost cap?** — Is current month's spend under `monthCap`?
4. **Dependencies met?** — Are all upstream dependencies in a terminal state?

## Source Files

| File | Purpose |
|---|---|
| `packages/backend/src/agent/workflow-runtime.ts` | Dynamic workflow queries — states, transitions, validation, persona resolution |
| `packages/backend/src/routes/workflows.ts` | Workflow CRUD API (10 endpoints) |
| `packages/shared/src/workflow.ts` | `WORKFLOW` constant (hardcoded fallback), transition helpers |
| `packages/backend/src/agent/dispatch.ts` | `dispatchForState()` — triggers agent execution on state entry |
| `packages/backend/src/agent/router.ts` | `runRouter()` — Router agent decision logic |
| `packages/backend/src/agent/coordination.ts` | `checkParentCoordination()` — parent-child auto-advance |
| `packages/backend/src/agent/execution-manager.ts` | `handleRejection()` — rejection counting and escalation |
| `packages/frontend/src/features/workflow-builder/` | Workflow Builder UI (state cards, preview, validation) |
| `packages/frontend/src/pages/workflows.tsx` | Workflows page (list + builder routing) |
