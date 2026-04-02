# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-24 complete and archived. Blocked tasks (FX.SDK3, FX.SDK5, SDK.V2.3) in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 25: Workflow Engine

> Custom Workflows — the biggest single effort. Dedicated sprint, no interleaving.
> Proposal docs: `docs/proposals/custom-workflows/data-model.md`, `docs/proposals/custom-workflows/builder-ux.md`, `docs/proposals/custom-workflows/runtime-execution.md`, `docs/proposals/custom-workflows/edge-cases.md`

### Schema & Data Model

- [ ] **CWF.1** — Schema: create `workflows`, `workflow_states`, `workflow_transitions` tables in `packages/backend/src/db/schema.ts`. Workflows have id, name, description, scope (global/project), projectId (nullable FK), version, isPublished, timestamps. States have workflowId FK, name, type (initial/intermediate/terminal), color, personaId (nullable FK), sortOrder. Transitions have workflowId FK, fromStateId FK, toStateId FK, label, sortOrder. Generate Drizzle migration.
- [ ] **CWF.2** — Schema: add `workflowId` (TEXT FK nullable) column to `projects`, `work_items`, and `executions` tables. Add `workflowStateName` (TEXT nullable) to executions. Generate migration. Update serialization functions in routes to include new fields. Update shared entity types.
- [ ] **CWF.3** — Seed: create `seedDefaultWorkflow()` function in `packages/backend/src/db/seed.ts` (or new file). Insert a "Default" workflow with the 6 states from the hardcoded `WORKFLOW_STATES` constant and all valid transitions. Set `projects.workflowId` to the default workflow ID. Run on startup after migrations (idempotent). Backfill existing `work_items.workflowId` to the default workflow.

### Backend Runtime

- [ ] **CWF.4** — Backend: create `packages/backend/src/agent/workflow-runtime.ts` with functions: `isValidTransitionDynamic(workflowId, fromState, toState): Promise<boolean>`, `getWorkflowInitialState(workflowId): Promise<string>`, `resolvePersonaForState(projectId, workflowId, stateName): Promise<PersonaId | null>`, `getWorkflowStates(workflowId): Promise<WorkflowState[]>`, `getWorkflowTransitions(workflowId): Promise<WorkflowTransition[]>`. Query from DB. Fall back to hardcoded `WORKFLOW` if workflowId is null.
- [ ] **CWF.5** — Backend: update `packages/backend/src/routes/work-items.ts`. POST: resolve initial state via `getWorkflowInitialState(project.workflowId)` instead of `WORKFLOW.initialState`. Set `workflowId` on created items. PATCH: validate state transitions via `isValidTransitionDynamic()` instead of sync `isValidTransition()`. Import and use the new runtime functions.
- [ ] **CWF.6** — Backend: update `packages/backend/src/agent/dispatch.ts` to use `resolvePersonaForState(projectId, workflowId, stateName)` with fallback to current `persona_assignments` lookup. Update `packages/backend/src/agent/execution-manager.ts` to set `workflowId` and `workflowStateName` on execution records when creating/updating.
- [ ] **CWF.7** — Backend: update `packages/backend/src/agent/mcp-server.ts`. `route_to_state` tool: validate via `isValidTransitionDynamic()`. `create_children` tool: use `getWorkflowInitialState()` + inherit parent's workflowId. `flag_blocked` tool: look up "Blocked" state by name in the work item's workflow states.
- [ ] **CWF.8** — Backend: update `packages/backend/src/agent/router.ts` to build dynamic router prompt. Replace static `ROUTER_BASE_PROMPT` with `buildDynamicRouterPrompt(workflowId, currentState)` that queries the workflow's transitions for the current state and lists valid target states. Query the work item's workflow before building the prompt.

### API Routes

- [ ] **CWF.9** — Backend: create `packages/backend/src/routes/workflows.ts` with read-only endpoints: `GET /api/workflows` (list, filter by projectId/scope), `GET /api/workflows/:id` (full workflow with states + transitions), `GET /api/workflows/:id/states`, `GET /api/workflows/:id/transitions`. Register in server. Add shared types (`Workflow`, `WorkflowState`, `WorkflowTransition`) to `packages/shared/src/entities.ts`.
- [ ] **CWF.10** — Backend: add builder CRUD endpoints to `workflows.ts`: `POST /api/workflows` (create draft), `PATCH /api/workflows/:id` (update states/transitions), `POST /api/workflows/:id/publish` (mark published, create version snapshot), `DELETE /api/workflows/:id` (archive — only if no work items use it), `POST /api/workflows/:id/clone` (deep copy). Add `POST /api/workflows/:id/validate` (check for unreachable states, missing initial/terminal, dead-end transitions).

### Frontend: Dynamic Views

- [ ] **CWF.11** — Frontend: create `packages/frontend/src/hooks/use-workflows.ts` with React Query hooks: `useWorkflows(projectId?)`, `useWorkflow(id)`, `useWorkflowStates(workflowId)`, `useWorkflowTransitions(workflowId)`. Add API client functions in `packages/frontend/src/api/client.ts`. Cache with 5-minute staleTime.
- [ ] **CWF.12** — Frontend: update `packages/frontend/src/features/work-items/flow-view.tsx` to use `useWorkflowStates()` instead of importing hardcoded `WORKFLOW.states`. Render columns dynamically from the project's workflow. Use state colors from DB.
- [ ] **CWF.13** — Frontend: update `packages/frontend/src/features/work-items/list-view.tsx` and `filter-bar.tsx` to use dynamic workflow states. State badges use colors from workflow. Filter dropdown options populated from `useWorkflowStates()`. Update `detail-panel.tsx` "Move to" dropdown to show valid transitions from `useWorkflowTransitions()`.
- [ ] **CWF.14** — Frontend: update `packages/frontend/src/features/settings/workflow-config-section.tsx`. Replace hardcoded state list with dynamic states from `useWorkflowStates()`. Add workflow selector dropdown if multiple workflows exist. Persona assignment uses workflow state IDs.

### Frontend: Workflow Builder

- [ ] **CWF.15** — Frontend: create `packages/frontend/src/features/workflow-builder/state-card.tsx` — editable state component with name input, type selector (initial/intermediate/terminal), color picker, optional persona selector, delete button. Create `transition-row.tsx` — target state dropdown + label input.
- [ ] **CWF.16** — Frontend: create `packages/frontend/src/features/workflow-builder/workflow-preview.tsx` — read-only visual graph of states and transitions. Auto-layout states in a horizontal flow (CSS grid, no graph library in Phase 1). Color-coded state nodes, arrow connections for transitions.
- [ ] **CWF.17** — Frontend: create `packages/frontend/src/features/workflow-builder/workflow-builder.tsx` — main layout: left panel (state list with add/remove/reorder), right panel (workflow-preview). Header with workflow name, publish button, validation status. Create `validation-panel.tsx` showing errors (missing initial state, unreachable states, dead-ends). Create `create-workflow-dialog.tsx` for new workflow modal.
- [ ] **CWF.18** — Frontend: add `/workflows/:id` route in `packages/frontend/src/router.tsx`. Add "Workflows" link in sidebar navigation. Wire builder to CRUD API endpoints (create, update, publish, validate). Add workflow selector in Settings > Workflow section.

### Testing & Documentation

- [ ] **CWF.TEST.1** — Write e2e test plan for Custom Workflows: `tests/e2e/plans/custom-workflows.md`. Cover: default workflow seeded on startup, dynamic flow view columns, dynamic state filters, dynamic move-to transitions, workflow builder (create/edit states/transitions), publish workflow, validation errors.
- [ ] **CWF.TEST.2** — Execute Custom Workflows e2e tests. Run the test plan via chrome-devtools MCP. Screenshot each test case. Record results to `tests/e2e/results/`. File bugs as `FX.*` tasks for any failures.
- [ ] **CWF.DOC.1** — Document Custom Workflows API. Update `docs/api.md` with: workflow CRUD endpoints, state/transition schemas, validation endpoint, dynamic state resolution in work items. Document migration from hardcoded to dynamic workflows.
- [ ] **CWF.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans in `tests/e2e/plans/` against the current build. This is critical — workflow changes touch 15+ backend files and 8+ frontend views. Compare against Sprint 24 regression baseline. File bugs as `FX.REG.*` for any new failures.

---

> **Future sprints (26-27) and Tier 3 backlog are defined in `docs/roadmap.md`.** When Sprint 25 is complete, the Decomposer agent should read the roadmap and decompose Sprint 26 into tasks.
