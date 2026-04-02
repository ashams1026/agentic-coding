# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 15:20 PDT — Review: CWF.12 (approved)

**Reviewed:** flow-view.tsx dynamic workflow states.
- WORKFLOW import fully replaced with useWorkflowStates(project.workflowId) ✓
- mainStates + blockedState computed dynamically ✓
- State colors from DB, no hardcoded references remain ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 15:15 PDT — CWF.12: Update flow-view.tsx to use dynamic workflow states

**Done:** Updated `packages/frontend/src/features/work-items/flow-view.tsx`. Replaced `WORKFLOW` import with `useWorkflowStates(workflowId)` hook. Gets `workflowId` from `project.workflowId`. `mainStates` and `blockedState` computed via useMemo from dynamic data. State colors come from DB. `stateData` map initialized from `workflowStatesData`. Blocked branch index dynamically calculated from mainStates length. Filter panel color lookup uses `workflowStatesData`. Blocked card uses dynamic `blockedState.name` and `blockedState.color`.
**Files:** `packages/frontend/src/features/work-items/flow-view.tsx`

---

## 2026-04-02 15:00 PDT — Review: CWF.11 (approved)

**Reviewed:** Frontend workflow hooks + API client.
- 4 hooks: useWorkflows, useWorkflow, useWorkflowStates, useWorkflowTransitions ✓
- All with 5-minute staleTime, enabled guards for nullable params ✓
- 4 API client functions matching backend endpoints ✓
- Exported from api/index.ts ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 14:55 PDT — CWF.11: Frontend workflow hooks and API client

**Done:** Created `packages/frontend/src/hooks/use-workflows.ts` with 4 React Query hooks: `useWorkflows(projectId?)`, `useWorkflow(id)`, `useWorkflowStates(workflowId)`, `useWorkflowTransitions(workflowId)`. All with 5-minute staleTime. Added 4 API client functions in `client.ts`: `getWorkflows()`, `getWorkflow()` (returns workflow + states + transitions), `getWorkflowStates()`, `getWorkflowTransitions()`. Exported from api/index.ts. Imported shared types (`Workflow`, `WorkflowStateEntity`, `WorkflowTransitionEntity`).
**Files:** `packages/frontend/src/hooks/use-workflows.ts` (new), `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`

---

## 2026-04-02 14:40 PDT — Review: CWF.10 (approved)

**Reviewed:** Builder CRUD endpoints in workflows.ts.
- POST create: draft with isPublished=false ✓
- PATCH: bulk replace states + transitions ✓
- POST publish: sets isPublished=true ✓
- DELETE: 409 guard for work items, cascade delete ✓
- POST clone: deep copy with state ID remapping ✓
- POST validate: initial/terminal checks, unreachable/dead-end warnings ✓
- ID generators in shared ids.ts ✓
- Build passes ✓
- **Verdict: approved.** API Routes phase (CWF.9-10) complete.

---

## 2026-04-02 14:35 PDT — CWF.10: Builder CRUD endpoints for workflows

**Done:** Added 6 builder endpoints to `packages/backend/src/routes/workflows.ts`. `POST /api/workflows` — create draft with name/description/scope. `PATCH /api/workflows/:id` — bulk replace states + transitions (delete all, re-insert). `POST /api/workflows/:id/publish` — set isPublished=true. `DELETE /api/workflows/:id` — delete with 409 guard if work items use it, cascades states+transitions. `POST /api/workflows/:id/clone` — deep copy with state ID remapping for transitions. `POST /api/workflows/:id/validate` — static analysis for missing initial/terminal, unreachable states, dead-end states. Added `createId.workflow/workflowState/workflowTransition` to shared ids.ts.
**Files:** `packages/backend/src/routes/workflows.ts`, `packages/shared/src/ids.ts`
**Notes:** API Routes phase (CWF.9-10) complete. 10 total workflow endpoints.

---

## 2026-04-02 14:25 PDT — Review: CWF.9 (approved)

**Reviewed:** Read-only workflow API endpoints.
- GET /api/workflows: list with projectId/scope filters ✓
- GET /api/workflows/:id: full workflow with nested states + transitions ✓
- GET /api/workflows/:id/states + /transitions: ordered lists with 404 checks ✓
- Serializers for all 3 entity types ✓
- Shared types: Workflow, WorkflowStateEntity, WorkflowTransitionEntity ✓
- Registered in server.ts ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 14:20 PDT — CWF.9: Read-only workflow API endpoints

**Done:** Created `packages/backend/src/routes/workflows.ts` with 4 read-only endpoints. `GET /api/workflows` — list with optional projectId/scope filters (returns global + project-scoped). `GET /api/workflows/:id` — full workflow with nested states + transitions arrays. `GET /api/workflows/:id/states` — list states ordered by sortOrder. `GET /api/workflows/:id/transitions` — list transitions. Added serialization functions for workflow, state, transition. Registered in server.ts. Added shared types: `Workflow`, `WorkflowStateEntity`, `WorkflowTransitionEntity` to entities.ts.
**Files:** `packages/backend/src/routes/workflows.ts` (new), `packages/backend/src/server.ts`, `packages/shared/src/entities.ts`

---

## 2026-04-02 14:10 PDT — Review: CWF.8 (approved)

**Reviewed:** Dynamic router prompt in router.ts.
- buildDynamicRouterPrompt() imported from workflow-runtime ✓
- Hardcoded state list removed from ROUTER_BASE_PROMPT ✓
- buildRouterSystemPrompt() now async, injects "Workflow Context" from dynamic transitions ✓
- runRouter() selects workflowId + currentState, passes to prompt builder ✓
- Persona creation uses base prompt (dynamic context per-run) ✓
- Build passes ✓
- **Verdict: approved.** Backend Runtime phase (CWF.4-8) complete.

---

## 2026-04-02 14:05 PDT — CWF.8: Dynamic router prompt from workflow

**Done:** Updated `packages/backend/src/agent/router.ts`. Replaced hardcoded state list in `ROUTER_BASE_PROMPT` with generic guidelines. `buildRouterSystemPrompt()` now async — calls `buildDynamicRouterPrompt(workflowId, currentState)` to inject "Workflow Context" section with valid target states from the work item's workflow. `runRouter()` now selects `workflowId` + `currentState` from work item and passes to prompt builder. Router persona creation uses base prompt (dynamic context added per-run).
**Files:** `packages/backend/src/agent/router.ts`
**Notes:** Backend Runtime phase (CWF.4-8) complete. All 5 backend files now use dynamic workflow functions.

---

## 2026-04-02 13:55 PDT — Review: CWF.7 (approved)

**Reviewed:** MCP server tools dynamic workflow integration.
- route_to_state: selects workflowId, isValidTransitionDynamic() ✓
- create_children: inherits workflowId, dynamic initial state ✓
- flag_blocked: getWorkflowStates() lookup, dynamic "Blocked" name ✓
- No hardcoded WORKFLOW/isValidTransition imports remain ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 13:50 PDT — CWF.7: Update MCP server tools for dynamic workflow

**Done:** Updated 3 MCP tools in `packages/backend/src/agent/mcp-server.ts`. `route_to_state`: selects workflowId, validates via `isValidTransitionDynamic()` instead of sync `isValidTransition()`. `create_children`: selects parent's workflowId, resolves initial state via `getWorkflowInitialState()`, inherits `workflowId` on child items. `flag_blocked`: queries workflow states via `getWorkflowStates()` to find "Blocked" state by name (case-insensitive), uses dynamic name in update and broadcast. Replaced `WORKFLOW` and `isValidTransition` imports with workflow-runtime functions.
**Files:** `packages/backend/src/agent/mcp-server.ts`

---

## 2026-04-02 13:40 PDT — Review: CWF.6 (approved)

**Reviewed:** dispatch.ts + execution-manager.ts workflow integration.
- dispatch: resolvePersonaForState() with workflowId from item, removed direct persona_assignments query ✓
- execution-manager: selects workflowId + currentState, sets both on execution insert ✓
- Unused imports cleaned up ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 13:35 PDT — CWF.6: Update dispatch.ts and execution-manager.ts for dynamic workflow

**Done:** Updated `dispatch.ts`: replaced direct persona_assignments query with `resolvePersonaForState(projectId, workflowId, stateName)` from workflow-runtime. Now selects `workflowId` from work item alongside `projectId`. Removed `personaAssignments` schema import and unused `and` import. Updated `execution-manager.ts`: selects `workflowId` and `currentState` from work item. Sets `workflowId` and `workflowStateName` on execution records when inserting.
**Files:** `packages/backend/src/agent/dispatch.ts`, `packages/backend/src/agent/execution-manager.ts`

---

## 2026-04-02 13:25 PDT — Review: CWF.5 (approved)

**Reviewed:** Work-items routes dynamic workflow integration.
- POST: project workflowId lookup → getWorkflowInitialState() → sets workflowId on item ✓
- PATCH: selects workflowId, validates via isValidTransitionDynamic() ✓
- Imports replaced: workflow-runtime functions instead of hardcoded WORKFLOW ✓
- projects added to schema import ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 13:20 PDT — CWF.5: Update work-items routes to use dynamic workflow

**Done:** Updated `packages/backend/src/routes/work-items.ts`. POST: looks up project's `workflowId`, resolves initial state via `getWorkflowInitialState()`, sets `workflowId` on created items. PATCH: selects `workflowId` alongside `currentState`, validates transitions via `isValidTransitionDynamic()` instead of sync `isValidTransition()`. Replaced `WORKFLOW` and `isValidTransition` imports with `getWorkflowInitialState` and `isValidTransitionDynamic` from workflow-runtime. Added `projects` to schema import for project lookup.
**Files:** `packages/backend/src/routes/work-items.ts`

---

## 2026-04-02 13:10 PDT — Review: CWF.4 (approved)

**Reviewed:** workflow-runtime.ts dynamic query functions.
- 6 functions: getWorkflowStates, getWorkflowTransitions, isValidTransitionDynamic, getWorkflowInitialState, resolvePersonaForState, buildDynamicRouterPrompt ✓
- All fall back to hardcoded WORKFLOW when workflowId is null ✓
- resolvePersonaForState: priority chain (workflow state → persona_assignments) ✓
- Clean exported types: DynamicWorkflowState, DynamicWorkflowTransition ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 13:05 PDT — CWF.4: workflow-runtime.ts with dynamic query functions

**Done:** Created `packages/backend/src/agent/workflow-runtime.ts` with 6 exported functions. `getWorkflowStates(workflowId)`: queries DB, returns typed states with fallback to WORKFLOW constant. `getWorkflowTransitions(workflowId)`: queries transitions + resolves state names. `isValidTransitionDynamic(workflowId, from, to)`: async validation. `getWorkflowInitialState(workflowId)`: finds "initial" type state. `resolvePersonaForState(projectId, workflowId, stateName)`: priority chain — workflow state persona → persona_assignments fallback. `buildDynamicRouterPrompt(workflowId, currentState)`: lists valid target states from transitions. All functions fall back to hardcoded WORKFLOW when workflowId is null.
**Files:** `packages/backend/src/agent/workflow-runtime.ts` (new)

---

## 2026-04-02 12:55 PDT — Review: CWF.3 (approved)

**Reviewed:** Default workflow seed in seed-workflow.ts + startup wiring.
- Idempotent: checks for existing wf-default before inserting ✓
- 8 states from WORKFLOW constant with type classification ✓
- All valid transitions created from WORKFLOW.transitions ✓
- Deterministic IDs (wf-default, ws-default-*, wt-default-*) ✓
- Backfills projects.workflowId + work_items.workflowId where null ✓
- Startup: runs after migrations + personas ✓
- Build passes ✓
- **Verdict: approved.** Schema & Data Model phase (CWF.1-3) complete.

---

## 2026-04-02 12:50 PDT — CWF.3: Seed default workflow

**Done:** Created `packages/backend/src/db/seed-workflow.ts` with `seedDefaultWorkflow()`. Uses fixed ID `wf-default` for idempotency. Inserts default workflow (8 states from WORKFLOW constant with type classification: Backlog=initial, Done=terminal, rest=intermediate). Creates all valid transitions from WORKFLOW.transitions. Deterministic state IDs (`ws-default-backlog`, etc.) and transition IDs. Backfills `projects.workflowId` and `work_items.workflowId` where null. Wired into startup in `start.ts` after migrations + personas via dynamic import.
**Files:** `packages/backend/src/db/seed-workflow.ts` (new), `packages/backend/src/start.ts`

---

## 2026-04-02 12:40 PDT — Review: CWF.2 (approved)

**Reviewed:** workflowId columns + migration + shared types + serialization.
- workflowId on projects/work_items/executions, workflowStateName on executions ✓
- Migration 0013: 4 ALTER TABLE ADD ✓
- Shared types: all 3 entities + Execution extra field ✓
- Serialization: projects, executions updated; work_items uses spread ✓
- 2 downstream TS fixes (execution-manager, dashboard) ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 12:35 PDT — CWF.2: Add workflowId columns to projects, work_items, executions

**Done:** Added `workflowId` (TEXT nullable) to projects, work_items, and executions tables in schema.ts. Added `workflowStateName` (TEXT nullable) to executions. Generated migration `0013_classy_giant_man.sql` (4 ALTER TABLE ADD). Updated shared entity types: Project, WorkItem, Execution all include workflowId. Updated serialization: projects route adds workflowId, executions route adds workflowId + workflowStateName, work_items already uses spread. Fixed 2 downstream TS errors: execution-manager.ts projectEntity + dashboard.ts WorkItem literal.
**Files:** `packages/backend/src/db/schema.ts`, `packages/shared/src/entities.ts`, `packages/backend/src/routes/projects.ts`, `packages/backend/src/routes/executions.ts`, `packages/backend/src/routes/dashboard.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/drizzle/0013_classy_giant_man.sql`

---

## 2026-04-02 12:20 PDT — Review: CWF.1 (approved)

**Reviewed:** Workflow schema in schema.ts + migration 0012.
- workflows: 9 columns with scope, versioning, publishing ✓
- workflow_states: 7 columns with type/color/persona/sortOrder ✓
- workflow_transitions: 6 columns with from/to state FKs + label ✓
- Relations: workflows→states/transitions, states→workflow/persona, transitions→fromState/toState (named) ✓
- Migration CREATE TABLE correct ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 12:15 PDT — CWF.1: Schema for workflows, workflow_states, workflow_transitions

**Done:** Added 3 new tables to `packages/backend/src/db/schema.ts`. `workflows`: id, name, description, scope (global/project), projectId (nullable FK), version, isPublished (boolean), timestamps. `workflow_states`: id, workflowId (FK notNull), name, type (initial/intermediate/terminal), color, personaId (nullable FK), sortOrder. `workflow_transitions`: id, workflowId (FK notNull), fromStateId (FK notNull), toStateId (FK notNull), label, sortOrder. Added Drizzle relations: workflow → states/transitions, state → workflow/persona, transition → workflow/fromState/toState. Generated migration `0012_bright_jack_flag.sql`.
**Files:** `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0012_bright_jack_flag.sql`, `packages/backend/drizzle/meta/0012_snapshot.json`, `packages/backend/drizzle/meta/_journal.json`



