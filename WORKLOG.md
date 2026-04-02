# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 19:30 PDT — COL.1: HandoffNote type + schema column + migration

**Done:** Created `packages/backend/src/agent/handoff-notes.ts` with `HandoffNote` interface (fromState, targetState, summary, decisions[], filesChanged[], openQuestions[]). Added `handoffNotes` JSON column (nullable) to `executions` table in schema.ts. Generated migration `0014_uneven_hawkeye.sql` (ALTER TABLE ADD). Added `HandoffNote` interface + `handoffNotes` field to shared `Execution` type in entities.ts. Updated executions route serializer to include `handoffNotes`.
**Files:** `packages/backend/src/agent/handoff-notes.ts` (new), `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0014_uneven_hawkeye.sql`, `packages/shared/src/entities.ts`, `packages/backend/src/routes/executions.ts`

---

## 2026-04-02 19:20 PDT — Decompose Sprint 26: Intelligence & Discovery

**Done:** Decomposed Sprint 26 into 26 tasks across 4 sections: Agent Collaboration P1 (COL.1-6: handoff notes schema+persistence+injection, dependency enforcement in dispatch, context windowing, frontend display), Search P1 (SRC.1-5: FTS5 virtual tables+triggers, unified search API, command palette upgrade, filter bar search), Analytics + Token Usage P1 (ANL.1-7: model/tokens/toolUses columns, persist from execution events, 4 aggregate endpoints, analytics page with overview+token tabs, Recharts charts, React Query hooks), Testing & Docs (S26.TEST.1-7 + S26.DOC.1: 3 test plans, 3 test executions, API docs, regression checkpoint). Key finding: ProgressEvent already emits totalTokens/toolUses but never persists — ANL.1-2 fix this. Task edges exist but dispatch ignores them — COL.4 enforces.
**Files:** `TASKS.md`

---

## 2026-04-02 19:05 PDT — Review: CWF.TEST.3 (approved)

**Reviewed:** Post-Sprint 25 regression checkpoint.
- 37 suites: 27 UI-verified, 10 code-review, 0 regressions ✓
- 8 API endpoints verified ✓
- 8 screenshots covering all major pages ✓
- Workflow-specific regression checks (8 items) all pass ✓
- Sprint 24 baseline comparison: all prior PASS suites still PASS ✓
- **Verdict: approved. Sprint 25 (Workflow Engine) is complete.**

---

## 2026-04-02 19:00 PDT — CWF.TEST.3: Regression checkpoint post-Sprint 25

**Done:** Full regression sweep: 37 suites, 27 UI-verified, 10 code-review, 0 regressions vs Sprint 24 baseline. Verified 8 API endpoints (projects, personas, work-items, workflows, dashboard, executions, chat). Screenshot-verified all 8 major UI pages (dashboard, work items list/flow, settings, agent monitor, personas, chat, activity). Workflow-specific checks: dynamic columns, filters, move-to transitions, settings persona table, sidebar nav, routes, API, FX.CWF.1 fix. 8 screenshots saved. Sprint 25 is complete with 0 regressions.
**Files:** `tests/e2e/results/2026-04-02_18-45_regression-sprint25/RESULTS.md`, `tests/e2e/results/2026-04-02_18-45_regression-sprint25/*.png` (8 screenshots)

---

## 2026-04-02 18:40 PDT — Review: CWF.DOC.1 (approved)

**Reviewed:** Custom Workflows API documentation in docs/api.md.
- 3 schema types with field-level comments ✓
- 10 endpoints documented: list, get, states, transitions, create, bulk update, publish, delete (409), clone, validate ✓
- Temporary ID mapping in PATCH documented ✓
- Dynamic state resolution + migration from hardcoded workflow ✓
- Source files table updated ✓
- Follows existing doc format ✓
- **Verdict: approved.**

---

## 2026-04-02 18:35 PDT — CWF.DOC.1: Document Custom Workflows API

**Done:** Added "## Workflows" section to `docs/api.md`. Covers: 3 schema types (Workflow, WorkflowState, WorkflowTransition), 10 endpoints (list, get, states, transitions, create, update/bulk-replace, publish, delete with 409 guard, clone, validate), dynamic state resolution in work items (initial state + transition validation), migration from hardcoded workflow (seed, backfill, fallback). Added 3 source files to Source Files table (workflows.ts, workflow-runtime.ts, seed-workflow.ts).
**Files:** `docs/api.md`

---

## 2026-04-02 18:25 PDT — Review: FX.CWF.1 (approved)

**Reviewed:** Workflow PATCH save bug fix.
- Root cause correct: client ID stripping + FK violation from stale references ✓
- Backend stateIdMap remaps s-new-* → server IDs for transitions ✓
- Frontend simplified: sends IDs as-is, no stripping logic ✓
- Handles t-new-* transition IDs + sortOrder default ✓
- Verified: screenshot shows successful save, no error toast ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 18:20 PDT — FX.CWF.1: Fix workflow PATCH save with new states/transitions

**Done:** Root cause: frontend stripped temporary `s-new-*` IDs from states (sent `undefined`) but transitions still referenced `s-new-*` IDs for `fromStateId`/`toStateId`. Backend inserted states with server-generated IDs but transitions referenced non-existent client IDs → FK violation. Fix: (1) Backend PATCH handler now builds `stateIdMap` mapping client IDs (including `s-new-*`) to server-generated IDs, then remaps transition `fromStateId`/`toStateId` through the map. Also handles `t-new-*` transition IDs and defaults `sortOrder` to 0. (2) Frontend `handleSave` now sends client IDs as-is (no stripping) — backend handles all ID mapping. Verified: created new workflow with new states + transition, Save succeeds without error toast.
**Files:** `packages/backend/src/routes/workflows.ts`, `packages/frontend/src/pages/workflows.tsx`

---

## 2026-04-02 18:00 PDT — Review: CWF.TEST.2 (approved)

**Reviewed:** Custom Workflows e2e test execution results.
- 33/36 pass, 1 fail (PATCH 206), 2 justified skips ✓
- 16 screenshots in `tests/e2e/results/custom-workflows/` ✓
- Results file with per-part breakdown, bug report, visual quality ✓
- FX.CWF.1 bug filed in TASKS.md with clear repro steps ✓
- All 10 test plan parts exercised ✓
- **Verdict: approved.**

---

## 2026-04-02 17:55 PDT — CWF.TEST.2: Execute Custom Workflows e2e tests

**Done:** Executed 36-step e2e test plan via chrome-devtools MCP. 33 pass, 1 fail, 2 skipped. All 10 parts tested: default workflow seeding, dynamic flow view columns, state filters, move-to transitions, workflow builder (create/add states/transitions/validation/save/publish), settings workflow selector. Filed bug FX.CWF.1 — PATCH API returns 206 when saving workflow with new states (temporary IDs). 16 screenshots saved.
**Files:** `tests/e2e/results/custom-workflows/results.md`, `tests/e2e/results/custom-workflows/*.png` (16 screenshots)
**Notes:** The save bug (FX.CWF.1) is in the backend PATCH handler — likely issue with bulk state/transition replacement when IDs are undefined/new. Publish endpoint works fine.

---

## 2026-04-02 17:35 PDT — Review: CWF.TEST.1 (approved)

**Reviewed:** Custom Workflows e2e test plan.
- 36 steps across 10 parts covering all CWF.11-18 features ✓
- Follows template format: objective, prerequisites, steps with screenshot checkpoints ✓
- Covers: seeding, dynamic views, filters, transitions, builder CRUD, validation, publish, settings ✓
- Expected results, visual quality, and failure criteria sections complete ✓
- **Verdict: approved.**

---

## 2026-04-02 17:30 PDT — CWF.TEST.1: Custom Workflows e2e test plan

**Done:** Wrote comprehensive e2e test plan at `tests/e2e/plans/custom-workflows.md`. 36 steps across 10 parts: default workflow seeding, dynamic flow view columns, dynamic state filters, dynamic move-to transitions, workflow builder create/edit/delete states and transitions, validation panel (missing initial/terminal, unreachable, dead-ends), save/publish flow, and Settings workflow selector + persona assignments. Follows template format with screenshot checkpoints and visual/functional failure criteria.
**Files:** `tests/e2e/plans/custom-workflows.md`

---

## 2026-04-02 17:20 PDT — Review: CWF.18 (approved)

**Reviewed:** workflows page, router, sidebar, API client, mutation hooks.
- `/workflows` list view: workflow cards with published badge, "New Workflow" dialog ✓
- `/workflows/:id` builder: loads states/transitions from API, converts to StateCardData[] ✓
- Sidebar: "Workflows" with GitBranch icon between Personas and Settings ✓
- CRUD client: create, update, publish, validate, delete functions ✓
- Mutation hooks: proper query invalidation on success ✓
- handleSave strips `s-new-`/`t-new-` prefixes for new entities ✓
- Visual check: list + builder both render correctly ✓
- Build passes ✓
- **Verdict: approved.** Frontend Workflow Builder phase (CWF.15-18) complete.

---

## 2026-04-02 17:10 PDT — CWF.18: Workflow route, sidebar, API wiring

**Done:** Added `/workflows` and `/workflows/:id` routes in router.tsx. Created `pages/workflows.tsx` — list view with workflow cards + "New Workflow" button, builder view loading data from `useWorkflow()` and converting to `StateCardData[]`. Added "Workflows" (GitBranch icon) to sidebar nav. Added CRUD API client functions: `createWorkflow`, `updateWorkflow`, `publishWorkflow`, `validateWorkflowApi`, `deleteWorkflow`. Added mutation hooks: `useCreateWorkflow`, `useUpdateWorkflow`, `usePublishWorkflow`, `useDeleteWorkflow` with query invalidation. Settings workflow selector already existed from CWF.14.
**Files:** `packages/frontend/src/pages/workflows.tsx`, `packages/frontend/src/router.tsx`, `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/hooks/use-workflows.ts`
**Notes:** Visual check passed — workflows list shows default workflow card, builder loads with all 8 states + SVG preview.

---

## 2026-04-02 16:50 PDT — Review: CWF.17 (approved)

**Reviewed:** workflow-builder.tsx, validation-panel.tsx, create-workflow-dialog.tsx.
- Main split layout: left state list + right preview ✓
- State CRUD: add/update/delete/reorder with sortOrder update ✓
- Delete cascades: removes transitions pointing to deleted state ✓
- Header: name input, draft/published badge, save/publish buttons ✓
- Publish disabled when validation errors ✓
- Validation: exactly 1 initial, >=1 terminal, unreachable, dead-ends, broken transitions ✓
- Create dialog: controlled Dialog, name input, Enter key, Create/Cancel ✓
- Conventions: named exports, cn(), dark mode, shadcn/ui, TypeScript ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 16:45 PDT — CWF.17: Workflow builder main layout + validation + create dialog

**Done:** Created 3 files: `workflow-builder.tsx` — main split layout with left panel (state list with add/remove/reorder via move up/down, StateCard per state) and right panel (WorkflowPreview). Header has workflow name input, draft/published badge, Save + Publish buttons (publish disabled if validation errors). `validation-panel.tsx` — validates: exactly 1 initial state, >=1 terminal state, unreachable states, dead-ends, broken transitions. Green "valid" or red/amber error list. Exports `validateWorkflow` for reuse. `create-workflow-dialog.tsx` — Dialog with name input, Create/Cancel buttons, Enter key support.
**Files:** `packages/frontend/src/features/workflow-builder/workflow-builder.tsx`, `packages/frontend/src/features/workflow-builder/validation-panel.tsx`, `packages/frontend/src/features/workflow-builder/create-workflow-dialog.tsx`
**Notes:** Components not routed yet — CWF.18 adds the route, sidebar link, and API wiring.

---

## 2026-04-02 16:30 PDT — Review: CWF.16 (approved)

**Reviewed:** workflow-preview.tsx visual graph component.
- Read-only SVG graph with auto-layout by state type ✓
- Color-coded nodes with name + type badge ✓
- Bezier curve arrows with arrowhead markers and labels ✓
- No graph library — pure SVG ✓
- Uses SVG instead of task's "CSS grid" — correct choice since CSS grid can't draw arrows
- Empty state handled, useMemo for performance ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 16:25 PDT — CWF.16: Workflow preview component

**Done:** Created `workflow-preview.tsx` — read-only SVG-based visual graph of workflow states and transitions. States auto-layout horizontally by type (initial → intermediate → terminal) using computed positions. Color-coded nodes with name + type badge. Curved Bezier arrows for transitions with optional labels and arrowhead markers. Empty state placeholder when no states defined. All SVG, no graph library.
**Files:** `packages/frontend/src/features/workflow-builder/workflow-preview.tsx`
**Notes:** Component not yet routable — CWF.18 will add the `/workflows/:id` route. Visual check deferred until then.

---

## 2026-04-02 16:15 PDT — CWF.15: Workflow builder state-card and transition-row

**Done:** Created `state-card.tsx` with editable StateCard component (name input, type selector, 12-color picker, persona selector via usePersonas(), transitions list with add/remove) and `transition-row.tsx` with target state dropdown + label input + delete button. Both components use shadcn/ui primitives and match compact sizing conventions.
**Files:** `packages/frontend/src/features/workflow-builder/state-card.tsx`, `packages/frontend/src/features/workflow-builder/transition-row.tsx`

---

## 2026-04-02 15:55 PDT — Review: CWF.14 (approved)

**Reviewed:** workflow-config-section dynamic workflow.
- No WORKFLOW import, useWorkflowStates() for dynamic states ✓
- configurableStates filters by type=intermediate ✓
- WorkflowSelector shown when 2+ workflows ✓
- Build passes ✓
- **Verdict: approved.** Frontend Dynamic Views phase (CWF.11-14) complete.

---

## 2026-04-02 15:50 PDT — CWF.14: Update workflow-config-section for dynamic workflow

**Done:** Updated `packages/frontend/src/features/settings/workflow-config-section.tsx`. Replaced `WORKFLOW.states` import with `useWorkflowStates(project.workflowId)`. `configurableStates` now filters by `type === "intermediate"` instead of hardcoded names. Added `WorkflowSelector` component — dropdown shown when 2+ workflows exist, allows changing project's active workflow. Updated note text to reference initial/terminal states generically. Imported `useWorkflowStates` + `useWorkflows` from hooks.
**Files:** `packages/frontend/src/features/settings/workflow-config-section.tsx`
**Notes:** Frontend Dynamic Views phase (CWF.11-14) complete. All work-items + settings views now use dynamic workflow data.

---

## 2026-04-02 15:40 PDT — Review: CWF.13 (approved)

**Reviewed:** list-view, filter-bar, detail-panel dynamic workflow.
- filter-bar: state dropdown from useWorkflowStates(), no WORKFLOW ✓
- list-view: stateColorMap + getStateColor, group ordering dynamic, stateColor prop on ListRow ✓
- detail-panel: "Move to" from useWorkflowTransitions(), ChildrenList stateColorMap ✓
- No hardcoded WORKFLOW/getStateByName/getValidTransitions in any of the 3 files ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 15:35 PDT — CWF.13: Update list-view, filter-bar, detail-panel for dynamic workflow

**Done:** Updated 3 frontend files. `filter-bar.tsx`: replaced `WORKFLOW.states` import with `useWorkflowStates()` for state filter dropdown options. `list-view.tsx`: replaced `WORKFLOW` and `getStateByName` with `useWorkflowStates()` + `stateColorMap`/`getStateColor` helper. State group ordering uses dynamic `workflowStatesData`. Added `stateColor` prop to `ListRow`. `detail-panel.tsx`: replaced `getStateByName`/`getValidTransitions` with `useWorkflowStates()`/`useWorkflowTransitions()`. `StateTransitionControl` receives workflow data as props for "Move to" dropdown. `ChildrenList` receives `stateColorMap` for child state colors.
**Files:** `packages/frontend/src/features/work-items/filter-bar.tsx`, `packages/frontend/src/features/work-items/list-view.tsx`, `packages/frontend/src/features/work-items/detail-panel.tsx`

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

