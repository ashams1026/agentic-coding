# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-24 complete and archived. Sprint 25 partial: Schema (CWF.1-3), Backend Runtime (CWF.4-8), API Routes (CWF.9-10) archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 25: Workflow Engine

> Custom Workflows — the biggest single effort. Dedicated sprint, no interleaving.
> Proposal docs: `docs/proposals/custom-workflows/data-model.md`, `docs/proposals/custom-workflows/builder-ux.md`, `docs/proposals/custom-workflows/runtime-execution.md`, `docs/proposals/custom-workflows/edge-cases.md`

### Frontend: Dynamic Views

- [x] **CWF.11** — Frontend: create `packages/frontend/src/hooks/use-workflows.ts` with React Query hooks: `useWorkflows(projectId?)`, `useWorkflow(id)`, `useWorkflowStates(workflowId)`, `useWorkflowTransitions(workflowId)`. Add API client functions in `packages/frontend/src/api/client.ts`. Cache with 5-minute staleTime. *(completed 2026-04-02 15:00 PDT)*
- [x] **CWF.12** — Frontend: update `packages/frontend/src/features/work-items/flow-view.tsx` to use `useWorkflowStates()` instead of importing hardcoded `WORKFLOW.states`. Render columns dynamically from the project's workflow. Use state colors from DB. *(completed 2026-04-02 15:20 PDT)*
- [x] **CWF.13** — Frontend: update `packages/frontend/src/features/work-items/list-view.tsx` and `filter-bar.tsx` to use dynamic workflow states. State badges use colors from workflow. Filter dropdown options populated from `useWorkflowStates()`. Update `detail-panel.tsx` "Move to" dropdown to show valid transitions from `useWorkflowTransitions()`. *(completed 2026-04-02 15:40 PDT)*
- [x] **CWF.14** — Frontend: update `packages/frontend/src/features/settings/workflow-config-section.tsx`. Replace hardcoded state list with dynamic states from `useWorkflowStates()`. Add workflow selector dropdown if multiple workflows exist. Persona assignment uses workflow state IDs. *(completed 2026-04-02 15:55 PDT)*

### Frontend: Workflow Builder

- [x] **CWF.15** — Frontend: create `packages/frontend/src/features/workflow-builder/state-card.tsx` — editable state component with name input, type selector (initial/intermediate/terminal), color picker, optional persona selector, delete button. Create `transition-row.tsx` — target state dropdown + label input. *(completed 2026-04-02 16:15 PDT)*
- [x] **CWF.16** — Frontend: create `packages/frontend/src/features/workflow-builder/workflow-preview.tsx` — read-only visual graph of states and transitions. Auto-layout states in a horizontal flow (CSS grid, no graph library in Phase 1). Color-coded state nodes, arrow connections for transitions. *(completed 2026-04-02 16:30 PDT)*
- [review] **CWF.17** — Frontend: create `packages/frontend/src/features/workflow-builder/workflow-builder.tsx` — main layout: left panel (state list with add/remove/reorder), right panel (workflow-preview). Header with workflow name, publish button, validation status. Create `validation-panel.tsx` showing errors (missing initial state, unreachable states, dead-ends). Create `create-workflow-dialog.tsx` for new workflow modal.
- [ ] **CWF.18** — Frontend: add `/workflows/:id` route in `packages/frontend/src/router.tsx`. Add "Workflows" link in sidebar navigation. Wire builder to CRUD API endpoints (create, update, publish, validate). Add workflow selector in Settings > Workflow section.

### Testing & Documentation

- [ ] **CWF.TEST.1** — Write e2e test plan for Custom Workflows: `tests/e2e/plans/custom-workflows.md`. Cover: default workflow seeded on startup, dynamic flow view columns, dynamic state filters, dynamic move-to transitions, workflow builder (create/edit states/transitions), publish workflow, validation errors.
- [ ] **CWF.TEST.2** — Execute Custom Workflows e2e tests. Run the test plan via chrome-devtools MCP. Screenshot each test case. Record results to `tests/e2e/results/`. File bugs as `FX.*` tasks for any failures.
- [ ] **CWF.DOC.1** — Document Custom Workflows API. Update `docs/api.md` with: workflow CRUD endpoints, state/transition schemas, validation endpoint, dynamic state resolution in work items. Document migration from hardcoded to dynamic workflows.
- [ ] **CWF.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans in `tests/e2e/plans/` against the current build. This is critical — workflow changes touch 15+ backend files and 8+ frontend views. Compare against Sprint 24 regression baseline. File bugs as `FX.REG.*` for any new failures.

---

> **Future sprints (26-27) and Tier 3 backlog are defined in `docs/roadmap.md`.** When Sprint 25 is complete, the Decomposer agent should read the roadmap and decompose Sprint 26 into tasks.
