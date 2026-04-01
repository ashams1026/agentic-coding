# Proposal: Runtime Execution of Custom Workflows

**Task:** RES.WORKFLOW.RUNTIME
**Date:** 2026-04-02
**Depends on:** RES.WORKFLOW.DATA (data model — approved), RES.WORKFLOW.BUILDER (builder UX — approved)
**Related:** RES.WORKFLOW.EDGE (edge cases), RES.GLOBAL.UX (global agent interaction)

## Problem

The current workflow runtime is hardcoded: the router prompt lists fixed states, `isValidTransition()` checks a static map, `dispatchForState()` looks up persona assignments by string state name, and work items store their state as a raw string. With custom workflows (per RES.WORKFLOW.DATA), the entire runtime — routing, dispatching, validation, and UI rendering — must become workflow-aware. This proposal designs the runtime changes needed to execute custom workflows.

## Current State

### Runtime Flow (end-to-end)

```
1. Work item created → currentState = "Backlog" (WORKFLOW.initialState)
2. User/router moves item to state X
   → work-items.ts PATCH validates: isValidTransition(currentState, X) via hardcoded map
   → updates workItems.currentState = X
   → calls dispatchForState(workItemId, X)
3. dispatchForState()
   → looks up personaAssignments WHERE (projectId, stateName = X)
   → checks monthly cost cap, concurrency
   → calls executionManager.runExecution(workItemId, personaId)
4. Execution runs → agent completes
5. runRouter(workItemId) called on completion
   → checks project settings (autoRouting)
   → builds prompt from ROUTER_BASE_PROMPT (hardcoded states list) + recent transitions
   → spawns router execution with route_to_state tool
6. Router agent calls route_to_state(targetState)
   → validates via isValidTransition(from, to) — hardcoded map
   → updates workItem.currentState
   → calls dispatchForState() for next state → cycle continues
```

### Hardcoded Touchpoints

| File | What's hardcoded | Line(s) |
|---|---|---|
| `shared/src/workflow.ts` | `WORKFLOW.states`, `WORKFLOW.transitions`, `WORKFLOW.initialState`, `WORKFLOW.finalStates` | 11-35 |
| `shared/src/workflow.ts` | `isValidTransition()`, `getValidTransitions()`, `getStateByName()` | 43-53 |
| `backend/src/agent/router.ts` | `ROUTER_BASE_PROMPT` lists 8 states | 24-39 |
| `backend/src/agent/dispatch.ts` | `personaAssignments` lookup by `(projectId, stateName)` string | 36-44 |
| `backend/src/agent/mcp-server.ts` | `route_to_state` calls `isValidTransition()` from shared | 283 |
| `backend/src/agent/mcp-server.ts` | `create_children` uses `WORKFLOW.initialState` | 188 |
| `backend/src/agent/mcp-server.ts` | `flag_blocked` hardcodes "Blocked" string | 529 |
| `backend/src/routes/work-items.ts` | `WORKFLOW.initialState` for new items, `isValidTransition()` for PATCH | 99, 132 |
| `frontend/.../flow-view.tsx` | `WORKFLOW.states` for column rendering | 6, 11-12 |
| `frontend/.../filter-bar.tsx` | `WORKFLOW.states` for state filter options | uses shared |
| `frontend/.../board-view.tsx` | `WORKFLOW.states` for kanban columns | uses shared |
| `frontend/.../detail-panel.tsx` | `currentState` display with hardcoded colors | uses shared |
| `frontend/.../list-view.tsx` | State badges using hardcoded workflow | uses shared |
| `frontend/.../workflow-config-section.tsx` | Hardcoded state list for persona assignment | uses shared |
| `frontend/.../dashboard/upcoming-work.tsx` | State references | uses shared |

## Investigation

### 1. Making the Router Workflow-Aware

**Current router:** `ROUTER_BASE_PROMPT` is a static string listing 8 states and general routing guidelines. The prompt is augmented with recent transition history (anti-loop context) and written to the Router persona's `systemPrompt` column before each run.

**Dynamic router design:**

The router prompt must be built from the work item's workflow definition. The key insight: the router already updates its system prompt per-invocation (in `buildRouterSystemPrompt()`). The change is replacing hardcoded state/transition data with a workflow query.

```typescript
// Current (router.ts)
const ROUTER_BASE_PROMPT = `...
Available states: Backlog, Planning, Decomposition, Ready, In Progress, In Review, Done, Blocked.
...`;

// Dynamic version
async function buildDynamicRouterPrompt(
  workflowId: string,
  currentStateName: string,
  transitions: TransitionRecord[],
): Promise<string> {
  // Query workflow states and transitions from DB
  const states = await db.select()
    .from(workflowStates)
    .where(eq(workflowStates.workflowId, workflowId))
    .orderBy(workflowStates.sortOrder);

  const allTransitions = await db.select({
    fromName: fromState.name,
    toName: toState.name,
    label: workflowTransitions.label,
  })
    .from(workflowTransitions)
    .innerJoin(fromState, eq(workflowTransitions.fromStateId, fromState.id))
    .innerJoin(toState, eq(workflowTransitions.toStateId, toState.id))
    .where(eq(workflowTransitions.workflowId, workflowId));

  // Build state descriptions
  const stateDescriptions = states.map(s => {
    const typeLabel = s.type === 'initial' ? ' (initial)'
      : s.type === 'terminal' ? ' (terminal)' : '';
    const personaLabel = s.personaId ? ` — assigned to: ${personaName}` : '';
    return `- ${s.name}${typeLabel}${personaLabel}`;
  });

  // Build valid transitions from current state
  const validFromCurrent = allTransitions
    .filter(t => t.fromName === currentStateName)
    .map(t => `- → ${t.toName}${t.label ? ` (label: "${t.label}")` : ''}`);

  // Build the prompt
  const parts = [
    `You are a routing agent for a custom workflow.`,
    ``,
    `## Workflow States`,
    ...stateDescriptions,
    ``,
    `## Valid Transitions from "${currentStateName}"`,
    ...(validFromCurrent.length > 0
      ? validFromCurrent
      : ['- (none — this is a terminal state)']),
  ];

  // Add transition history (anti-loop)
  if (transitions.length > 0) {
    parts.push(
      ``,
      `## Recent Transitions for This Item`,
      ...transitions.map(t => `- ${t.from} → ${t.to}`),
    );
  }

  parts.push(
    ``,
    `Use route_to_state to transition the work item.`,
    `Do NOT route to a state this item was just in.`,
  );

  return parts.join('\n');
}
```

**Key decisions:**

| Question | Answer | Rationale |
|---|---|---|
| One router per workflow? | No — shared Router persona, workflow-aware prompt | Per RES.WORKFLOW.BUILDER recommendation. Simpler, router already updates prompt per-run |
| Router model per workflow? | Phase 1: shared haiku. Phase 2: workflow can override `router_model` | Cost efficiency; most routing decisions are simple |
| Custom router persona? | Phase 2: `workflows.routerPersonaId` optional FK | Enables domain-specific routing logic (e.g., legal compliance routing) |

**Changes to `runRouter()`:**

```typescript
export async function runRouter(workItemId: string): Promise<boolean> {
  const [item] = await db.select({
    projectId: workItems.projectId,
    currentState: workItems.currentState,
    workflowId: workItems.workflowId,  // NEW
  }).from(workItems).where(eq(workItems.id, workItemId));

  if (!item) return false;

  // Check auto-routing (project settings)
  const [project] = await db.select({ settings: projects.settings })
    .from(projects).where(eq(projects.id, item.projectId));
  if (!project || project.settings.autoRouting === false) return false;

  // Check if current state is terminal — no routing needed
  const [currentState] = await db.select({ type: workflowStates.type })
    .from(workflowStates)
    .where(and(
      eq(workflowStates.workflowId, item.workflowId),
      eq(workflowStates.name, item.currentState),
    ));
  if (currentState?.type === 'terminal') return false;

  // Build workflow-aware prompt
  const transitions = await getRecentTransitions(workItemId);
  const dynamicPrompt = await buildDynamicRouterPrompt(
    item.workflowId,
    item.currentState,
    transitions,
  );

  const routerPersonaId = await getOrCreateRouterPersona();
  await db.update(personas).set({ systemPrompt: dynamicPrompt })
    .where(eq(personas.id, routerPersonaId));

  await executionManager.runExecution(workItemId, routerPersonaId);
  return true;
}
```

### 2. How Work Items Bind to a Workflow

**Question:** Is the workflow binding per-project or per-item?

**Recommended: Per-project with per-item override.**

**Primary binding: per-project.** Each project has a `workflowId` reference to the published workflow version it uses. All new work items in the project inherit this workflow.

```sql
ALTER TABLE projects ADD COLUMN workflow_id TEXT REFERENCES workflows(id) DEFAULT 'wf-default';
```

**Override: per-item (optional).** Individual work items can use a different workflow than their project default. This supports edge cases like migrating a single item to a new workflow version, or running a specialized sub-workflow for a specific item type.

```sql
-- work_items.workflow_id already proposed in RES.WORKFLOW.DATA
-- If NULL, falls back to project's workflow_id
-- If set, overrides project default
```

**Resolution order:**

```
1. work_items.workflowId (if set) → use this workflow
2. projects.workflowId → use project's default workflow
3. 'wf-default' → hardcoded fallback (Default workflow)
```

**Why not per-item only?** Most items in a project use the same workflow. Per-project binding avoids setting `workflowId` on every new work item. It also makes the common case (change a project's workflow) a single update to `projects.workflowId` rather than updating every item.

**Why not per-project only?** Version pinning (from RES.WORKFLOW.DATA) requires items to remember which version they started with. When a project publishes workflow v2, existing items should continue on v1. New items get v2. This means `work_items.workflowId` must exist for version pinning, even though the project provides the default.

**Work item creation flow:**

```typescript
// POST /api/work-items
async function createWorkItem(projectId, data) {
  // Get the project's current published workflow
  const [project] = await db.select({ workflowId: projects.workflowId })
    .from(projects).where(eq(projects.id, projectId));

  const workflowId = project.workflowId ?? 'wf-default';

  // Get the workflow's initial state name
  const [initialState] = await db.select({ name: workflowStates.name })
    .from(workflowStates)
    .where(and(
      eq(workflowStates.workflowId, workflowId),
      eq(workflowStates.type, 'initial'),
    ));

  await db.insert(workItems).values({
    id: createId.workItem(),
    projectId,
    workflowId,               // Pin to current published version
    currentState: initialState.name,  // Dynamic initial state
    ...data,
  });
}
```

**When a project changes its workflow:**
- Existing items keep their `workflowId` (version pinned)
- New items use the project's new `workflowId`
- The UI shows items from multiple workflow versions in the same project (handled in section 4)

### 3. Scope Interaction — Global Workflows + Project-Scoped Items

**From RES.WORKFLOW.DATA:** Workflows have a `scope` column (`'global'` or `'project'`) and an optional `projectId` FK.

**Rules:**

| Workflow scope | Who can use it |
|---|---|
| Global (`projectId = NULL`) | Any project. This is the "template" model — global workflows are shared across all projects. |
| Project-scoped (`projectId = 'proj_x'`) | Only that project. Private workflow for specialized needs. |

**Which workflow a project uses:**

```
projects.workflowId → can point to either a global or project-scoped workflow
```

- A project starts with `workflowId = 'wf-default'` (the seeded global Default workflow).
- Admin changes the project's workflow via Settings → Workflow → select from available workflows.
- Available workflows = all global workflows + this project's project-scoped workflows.

**Can a global agent trigger a workflow execution?**

Per RES.GLOBAL.UX: global agents use `set_project_context(projectId)` to access project workflows. When a global agent calls `route_to_state`, the work item's `workflowId` determines which transitions are valid. The agent's scope (global vs project) is irrelevant to workflow validation — what matters is the work item's bound workflow.

**Can a workflow run without a project?**

Not in Phase 1. Work items require a `projectId` (NOT NULL constraint). Workflows can exist without a project (global scope), but work items always live in a project. This keeps the execution model simple — the agent always has a project context (cwd, MCP server env vars, persona assignments).

Phase 2 consideration: standalone work items with `projectId = NULL` could use the global workspace (`~/.agentops/workspace/` per RES.GLOBAL.UX). This requires relaxing the NOT NULL constraint and updating dispatch/execution to handle missing project context. Defer to RES.WORKFLOW.EDGE.

### 4. How Frontend Views Adapt to Custom States

**Current:** All frontend views import `WORKFLOW` from `@agentops/shared` and use its static `.states` array for rendering columns (flow view, board view), filter options (filter bar), state badges (list view, detail panel), and persona assignment dropdowns (settings).

**Dynamic approach:** Replace the static import with a React Query hook that fetches workflow states from the backend.

#### New hook: `useWorkflowStates`

```typescript
// packages/frontend/src/hooks/use-workflow-states.ts

export function useWorkflowStates(workflowId: string | null) {
  return useQuery({
    queryKey: ['workflow-states', workflowId],
    queryFn: async () => {
      if (!workflowId) return FALLBACK_STATES; // hardcoded Default
      const res = await fetch(`/api/workflows/${workflowId}/states`);
      return res.json() as Promise<WorkflowStateRow[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 min — workflows change infrequently
  });
}

export function useWorkflowTransitions(workflowId: string | null) {
  return useQuery({
    queryKey: ['workflow-transitions', workflowId],
    queryFn: async () => {
      if (!workflowId) return FALLBACK_TRANSITIONS;
      const res = await fetch(`/api/workflows/${workflowId}/transitions`);
      return res.json() as Promise<WorkflowTransitionRow[]>;
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

#### View-by-view changes

**Flow view (`flow-view.tsx`):**
- Currently: `const mainStates = WORKFLOW.states.filter(...)` — static array.
- Dynamic: `const { data: states } = useWorkflowStates(project?.workflowId)`. States fetched from DB, rendered as StateNodeCard components in the same vertical layout.
- Transitions between nodes come from `useWorkflowTransitions()` instead of the static `WORKFLOW.transitions` map.
- The "Blocked" state special-casing (separate branch, connection to blockedSources) needs to generalize. In custom workflows, any state could be a "Blocked"-like branching target. Use the transition data: states with incoming transitions from multiple sources get rendered as special branch targets.

**Board view (`board-view.tsx`):**
- Currently: columns derived from `WORKFLOW.states`.
- Dynamic: columns derived from `useWorkflowStates()`. Column order follows `sort_order`. Column header shows state name and color.
- Items that reference a different workflow version than the project's current version show a subtle version badge: "v1" in muted text.

**List view (`list-view.tsx`):**
- State badge colors come from the workflow state's `color` field instead of the shared constant.
- State column renders `item.currentState` with the color looked up from the item's workflow.

**Filter bar (`filter-bar.tsx`):**
- State filter dropdown populated from `useWorkflowStates()` instead of the hardcoded list.
- When a project has items from multiple workflow versions, the filter shows the union of all state names (deduplicated). A filter chip like "In Progress" matches items in any workflow version's "In Progress" state.

**Detail panel (`detail-panel.tsx`):**
- State display and transition buttons come from the workflow.
- "Move to" dropdown shows valid transitions from the current state, queried from `useWorkflowTransitions()`.
- State badge color from the workflow state definition.

**Workflow config section (`workflow-config-section.tsx`):**
- Persona assignment dropdowns are already per-state. Change: states come from the selected workflow's `workflow_states` instead of the hardcoded list.
- Add workflow selector: dropdown showing available workflows for this project (global + project-scoped). Changing the selection updates `projects.workflowId`.

**Dashboard (`upcoming-work.tsx`):**
- State references in the "upcoming work" widget use the item's workflow for color/label.
- Aggregation (e.g., "5 items in progress") groups by state name across all workflow versions.

**Router decision card (`router-decision-card.tsx`):**
- Currently shows hardcoded state names for the routing decision.
- Dynamic: state names and colors come from the execution's `workflowId` + `workflowStateName`.

#### Handling mixed workflow versions

When a project has items on workflow v1 and v2 (because the workflow was updated between item creation), the views need to handle states that exist in one version but not another.

**Strategy: union display with version context.**

```
Board view columns: union of all state names across active workflow versions.
  - If v1 has "QA" and v2 doesn't → "QA" column appears (for v1 items)
  - Column header can show a version indicator if states differ between versions
  - Empty columns (no items in any version) are hidden

Flow view: shows the CURRENT published workflow version's states.
  - Items pinned to older versions show their state name with a version badge.
  - If an item's state doesn't exist in the current version → show as a
    special "legacy state" node with a migration prompt.
```

### 5. Migration Path — Default Workflow as a Database Record

**From RES.WORKFLOW.DATA:** The migration seeds a "Default" workflow record from the hardcoded `WORKFLOW` constant. Existing items get `workflowId = 'wf-default'`. But the runtime code also needs to migrate.

**Migration phases:**

#### Phase 1: Dual-read (backwards compatible)

During migration, code that reads workflow data checks the database first, then falls back to the hardcoded constant.

```typescript
// packages/shared/src/workflow.ts — updated isValidTransition

export async function isValidTransitionDynamic(
  from: string,
  to: string,
  workflowId?: string,
): Promise<boolean> {
  if (!workflowId) {
    // Fallback to hardcoded map (for code not yet migrated)
    return isValidTransition(from, to);
  }
  
  // Query workflow_transitions
  const [transition] = await db.select({ id: workflowTransitions.id })
    .from(workflowTransitions)
    .innerJoin(fromState, eq(workflowTransitions.fromStateId, fromState.id))
    .innerJoin(toState, eq(workflowTransitions.toStateId, toState.id))
    .where(and(
      eq(workflowTransitions.workflowId, workflowId),
      eq(fromState.name, from),
      eq(toState.name, to),
    ));
  
  return !!transition;
}
```

**Note:** The async version can't live in `packages/shared` (no DB access). Instead:
- `packages/shared/src/workflow.ts` keeps the synchronous `isValidTransition()` as a fallback and exports the hardcoded constant.
- `packages/backend/src/agent/workflow-runtime.ts` (NEW) exports the async `isValidTransitionDynamic()` and all other DB-backed workflow functions.
- Frontend uses the REST API (`GET /api/workflows/:id/transitions`) rather than calling validation directly.

#### Phase 2: Full dynamic (hardcoded removal)

After all runtime code migrates to the dynamic path:
1. `WORKFLOW` constant becomes the seed data source only (used in DB migration, not runtime).
2. `isValidTransition()` (sync, hardcoded) is removed from the shared package.
3. All imports of `WORKFLOW` are replaced with DB queries or API calls.
4. The `WorkflowStateName` type becomes a plain `string` (no longer derived from a const).

#### Phase 3: Cleanup

- Remove `WORKFLOW` constant from shared package (keep in migration script only).
- Remove `WorkflowStateName` derived type.
- Remove sync helper functions that depend on the hardcoded data.

### Changes to Core Runtime Modules

#### `dispatch.ts` — workflow-aware persona lookup

```typescript
export async function dispatchForState(
  workItemId: string,
  stateName: string,
): Promise<void> {
  // Look up work item's project AND workflow
  const [item] = await db.select({
    projectId: workItems.projectId,
    workflowId: workItems.workflowId,
  }).from(workItems).where(eq(workItems.id, workItemId));

  if (!item) return;

  // Resolve persona: project override → workflow default → no-op
  const personaId = await resolvePersonaForState(
    item.projectId,
    item.workflowId,
    stateName,
  );

  if (!personaId) return; // No persona assigned

  // Cost cap + concurrency checks (unchanged)
  const costCheck = await checkMonthlyCost(item.projectId);
  if (!costCheck.allowed) { /* ... post comment, return */ }

  const allowed = await canSpawn(item.projectId);
  if (!allowed) { await enqueue(workItemId, personaId); return; }

  await executionManager.runExecution(workItemId, personaId);
}

/**
 * Resolve which persona handles a given state.
 * Resolution order:
 *   1. Project-level override (persona_assignments for project + workflow state)
 *   2. Workflow-level default (workflow_states.persona_id)
 *   3. null (no persona — manual state)
 */
async function resolvePersonaForState(
  projectId: string,
  workflowId: string,
  stateName: string,
): Promise<string | null> {
  // Get the workflow state record
  const [wsRow] = await db.select({
    id: workflowStates.id,
    personaId: workflowStates.personaId,
  })
    .from(workflowStates)
    .where(and(
      eq(workflowStates.workflowId, workflowId),
      eq(workflowStates.name, stateName),
    ));

  if (!wsRow) return null;

  // Check project-level override
  const [override] = await db.select({ personaId: personaAssignments.personaId })
    .from(personaAssignments)
    .where(and(
      eq(personaAssignments.projectId, projectId),
      eq(personaAssignments.workflowStateId, wsRow.id),
    ));

  if (override) return override.personaId;

  // Fall back to workflow-level default
  return wsRow.personaId;
}
```

#### `mcp-server.ts` — workflow-aware tools

**`route_to_state` changes:**

```typescript
// Instead of: isValidTransition(item.currentState, targetState)
// Use: isValidTransitionDynamic(item.currentState, targetState, item.workflowId)

const [item] = await db.select({
  currentState: workItems.currentState,
  workflowId: workItems.workflowId,  // NEW
}).from(workItems).where(eq(workItems.id, workItemId));

// Validate against workflow transitions
const valid = await isValidTransitionDynamic(
  item.currentState,
  targetState,
  item.workflowId,
);

if (!valid) {
  return { error: `Invalid transition from "${item.currentState}" to "${targetState}" in this workflow` };
}
```

**`create_children` changes:**

```typescript
// Instead of: currentState: WORKFLOW.initialState
// Use: query the parent's workflow for its initial state

const [parent] = await db.select({
  projectId: workItems.projectId,
  workflowId: workItems.workflowId,
}).from(workItems).where(eq(workItems.id, parentId));

const [initialState] = await db.select({ name: workflowStates.name })
  .from(workflowStates)
  .where(and(
    eq(workflowStates.workflowId, parent.workflowId),
    eq(workflowStates.type, 'initial'),
  ));

// Children inherit the parent's workflow
await db.insert(workItems).values({
  currentState: initialState.name,
  workflowId: parent.workflowId,
  ...
});
```

**`flag_blocked` changes:**

```typescript
// Instead of hardcoding "Blocked":
// Find the workflow's "Blocked" equivalent — a state marked as type 'intermediate'
// with a naming convention or a special flag.

// Option A (Recommended): Keep "Blocked" as a convention.
// Every workflow should have a "Blocked" state by convention.
// The builder defaults to including one. If missing, flag_blocked returns an error.
const [blockedState] = await db.select({ name: workflowStates.name })
  .from(workflowStates)
  .where(and(
    eq(workflowStates.workflowId, item.workflowId),
    eq(workflowStates.name, 'Blocked'),
  ));

if (!blockedState) {
  return { error: 'This workflow has no "Blocked" state.' };
}

// Option B: Add a 'blocked' state type alongside initial/intermediate/terminal.
// More flexible but adds complexity to the state type system.
```

**Recommendation:** Option A — "Blocked" is a convention. The workflow builder includes "Blocked" by default in new workflows and shows a validation warning if no state named "Blocked" exists. The `flag_blocked` tool searches by name. This avoids adding a 4th state type.

#### `work-items.ts` route — workflow-aware state transitions

```typescript
// PATCH /api/work-items/:id — manual state change
if (body.currentState && body.currentState !== existing.currentState) {
  const valid = await isValidTransitionDynamic(
    existing.currentState,
    body.currentState,
    existing.workflowId,
  );
  if (!valid) {
    return reply.status(400).send({
      error: { code: 'INVALID_TRANSITION', message: '...' },
    });
  }
}

// POST /api/work-items — new item creation
const workflowId = project.workflowId ?? 'wf-default';
const [initialState] = await db.select({ name: workflowStates.name })
  .from(workflowStates)
  .where(and(
    eq(workflowStates.workflowId, workflowId),
    eq(workflowStates.type, 'initial'),
  ));

await db.insert(workItems).values({
  workflowId,
  currentState: initialState.name,
  ...
});
```

### New Backend API Endpoints

```
GET  /api/workflows                          — list workflows (filtered by scope + project)
GET  /api/workflows/:id                      — get workflow with states + transitions
GET  /api/workflows/:id/states               — list states for a workflow
GET  /api/workflows/:id/transitions          — list transitions for a workflow
POST /api/workflows/:id/validate-transition  — validate a transition (from, to)
```

These are read-only runtime endpoints. CRUD for workflow management (create, edit, publish) is covered by the builder backend (RES.WORKFLOW.BUILDER).

### Execution Record Changes

Per RES.WORKFLOW.DATA, executions gain `workflowId` and `workflowStateName`:

```typescript
// In executionManager.runExecution():
const [item] = await db.select({
  workflowId: workItems.workflowId,
  currentState: workItems.currentState,
}).from(workItems).where(eq(workItems.id, workItemId));

await db.insert(executions).values({
  id: executionId,
  workItemId,
  personaId,
  workflowId: item.workflowId,             // NEW
  workflowStateName: item.currentState,     // NEW
  status: 'pending',
  startedAt: new Date(),
  ...
});
```

This captures the workflow context at execution time, enabling historical queries like "show all executions that ran in the 'Code Review' state of workflow v2."

### Phase 2: Declarative Transition Conditions

Per RES.WORKFLOW.DATA, `workflow_transitions.condition` is a nullable JSON column. Phase 1: always NULL (router decides). Phase 2: conditions enable automatic routing without invoking the router LLM.

**Condition types:**

```typescript
type TransitionCondition =
  | { type: 'outcome'; value: 'completed' | 'rejected' | 'error' }
  | { type: 'childrenComplete'; value: true }
  | { type: 'always' }  // auto-route without conditions
  | null;  // router decides (default)
```

**Evaluation in the post-execution hook:**

```typescript
// After execution completes, before invoking runRouter():
async function evaluateAutoTransitions(
  workItemId: string,
  executionOutcome: string,
): Promise<string | null> {
  const [item] = await db.select({
    currentState: workItems.currentState,
    workflowId: workItems.workflowId,
  }).from(workItems).where(eq(workItems.id, workItemId));

  // Get transitions from current state with conditions
  const transitions = await db.select({
    toStateName: toState.name,
    condition: workflowTransitions.condition,
  })
    .from(workflowTransitions)
    .innerJoin(fromState, ...)
    .innerJoin(toState, ...)
    .where(and(
      eq(workflowTransitions.workflowId, item.workflowId),
      eq(fromState.name, item.currentState),
    ));

  // Evaluate conditions in order
  for (const t of transitions) {
    if (!t.condition) continue; // NULL = router decides

    const cond = t.condition as TransitionCondition;
    if (cond.type === 'always') return t.toStateName;
    if (cond.type === 'outcome' && cond.value === executionOutcome) return t.toStateName;
    if (cond.type === 'childrenComplete') {
      const allDone = await checkAllChildrenComplete(workItemId);
      if (allDone) return t.toStateName;
    }
  }

  return null; // No condition matched — fall through to router
}

// In the post-execution hook:
const autoTarget = await evaluateAutoTransitions(workItemId, outcome);
if (autoTarget) {
  // Auto-route without invoking the router LLM
  await transitionWorkItem(workItemId, autoTarget);
  await dispatchForState(workItemId, autoTarget);
} else {
  // Fall back to router agent
  await runRouter(workItemId);
}
```

This reduces LLM costs for predictable transitions (e.g., "after code review approves, always go to QA") while preserving the router for ambiguous decisions.

## Files to Change

**New files:**
- `packages/backend/src/agent/workflow-runtime.ts` — Dynamic workflow functions: `isValidTransitionDynamic()`, `resolvePersonaForState()`, `getWorkflowInitialState()`, `evaluateAutoTransitions()`, `buildDynamicRouterPrompt()`
- `packages/backend/src/routes/workflows.ts` — Read-only REST endpoints for workflow states/transitions
- `packages/frontend/src/hooks/use-workflow-states.ts` — React Query hooks for workflow states and transitions

**Modified files — Backend:**
- `packages/backend/src/agent/router.ts` — Replace hardcoded `ROUTER_BASE_PROMPT` with `buildDynamicRouterPrompt()`. Update `runRouter()` to query work item's workflow.
- `packages/backend/src/agent/dispatch.ts` — Replace `personaAssignments(projectId, stateName)` lookup with `resolvePersonaForState(projectId, workflowId, stateName)`.
- `packages/backend/src/agent/mcp-server.ts` — Update `route_to_state` (dynamic validation), `create_children` (dynamic initial state + workflow inheritance), `flag_blocked` (workflow-aware "Blocked" lookup).
- `packages/backend/src/agent/execution-manager.ts` — Populate `workflowId` and `workflowStateName` on execution records.
- `packages/backend/src/routes/work-items.ts` — Dynamic initial state on creation, dynamic transition validation on PATCH.
- `packages/backend/src/db/schema.ts` — Add `workflowId` to `projects` table (per-project workflow binding). Add `workflowId` and `workflowStateName` to `executions` table. Add `workflowId` to `workItems`. Evolve `personaAssignments` PK.

**Modified files — Frontend:**
- `packages/frontend/src/features/work-items/flow-view.tsx` — Replace `WORKFLOW.states` with `useWorkflowStates()`
- `packages/frontend/src/features/work-items/board-view.tsx` — Dynamic columns from workflow states
- `packages/frontend/src/features/work-items/list-view.tsx` — Dynamic state badge colors
- `packages/frontend/src/features/work-items/filter-bar.tsx` — Dynamic state filter options
- `packages/frontend/src/features/work-items/detail-panel.tsx` — Dynamic "move to" dropdown from workflow transitions
- `packages/frontend/src/features/settings/workflow-config-section.tsx` — Workflow selector + dynamic persona assignments
- `packages/frontend/src/features/dashboard/upcoming-work.tsx` — Dynamic state colors
- `packages/frontend/src/features/agent-monitor/router-decision-card.tsx` — Dynamic state display

**Modified files — Shared:**
- `packages/shared/src/workflow.ts` — Keep hardcoded constant as fallback seed data. Add dynamic `Workflow`, `WorkflowState`, `WorkflowTransition` type exports (interfaces matching DB schema). Deprecate `WorkflowStateName` derived type.

## Decision Summary

| Decision | Choice | Rationale |
|---|---|---|
| Router awareness | Shared router, workflow-aware dynamic prompt per invocation | Already updates prompt per-run; minimal change. Per-workflow routers deferred to Phase 2. |
| Work item binding | Per-project default + per-item override | Avoids per-item setup for common case; per-item enables version pinning |
| Global workflow + project items | Global workflows usable by any project; items always project-scoped | Keeps execution model simple (agents always have project context) |
| Frontend adaptation | React Query hooks replacing static `WORKFLOW` imports | Caches workflow data (5min stale time), works with existing component patterns |
| Mixed workflow versions | Union display in board/flow views, version badge on items | Handles the inevitable version coexistence during workflow updates |
| "Blocked" state | Convention by name, not a 4th state type | Simpler; builder defaults to including "Blocked"; flag_blocked searches by name |
| Migration approach | 3 phases: dual-read → full dynamic → cleanup | Zero-downtime; each phase is independently deployable and testable |
| Validation location | `workflow-runtime.ts` (backend) for async DB-backed validation; shared keeps sync fallback | Shared package can't access DB; backend owns the authoritative validation |
| Declarative conditions | Phase 2: condition JSON on transitions, evaluated pre-router | Reduces LLM costs for predictable transitions; router remains fallback |
| Initial state resolution | Query `workflow_states WHERE type = 'initial'` | Dynamic; no longer relies on hardcoded string |
