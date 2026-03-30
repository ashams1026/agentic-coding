# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-15 complete and archived.

---

## Sprint 16: AI-Based E2E Testing

> AI-driven end-to-end testing via browser automation. Two phases:
> Phase 1: Generate test plan files — each is a self-contained prompt an AI agent can follow using browser DevTools (chrome-devtools MCP).
> Phase 2: Execute each test plan, interact with the real app in a browser, and report results.
> All test plans live in `tests/e2e/plans/`. Each plan is a markdown file with step-by-step instructions, expected outcomes, and pass/fail criteria.
> Test execution requires: backend running on :3001, frontend on :5173/:5174, API mode set to "api", chrome-devtools MCP connected.

### Phase 1: Generate Test Plans

- [x] **AI.1** — Create test plan directory structure and template. Create `tests/e2e/plans/` directory. Create `tests/e2e/README.md` explaining the test framework: what a test plan is, how to run them, prerequisites (backend + frontend running, API mode, chrome-devtools MCP). Create `tests/e2e/plans/_template.md` with the standard format: `## Objective`, `## Prerequisites` (app state needed before test), `## Steps` (numbered actions: navigate to URL, click element, type text, verify element exists/contains text, wait for state change), `## Expected Results` (what pass looks like), `## Failure Criteria` (what constitutes a fail). Each step should reference UI elements by visible text, aria labels, or test-friendly selectors — not implementation details.

- [ ] **AI.2** — Write test plans for Dashboard. Create `tests/e2e/plans/dashboard-stats.md`: navigate to `/`, verify 4 stat cards render with numeric values (not NaN/undefined), verify active agents strip renders, verify cost summary widget shows chart. Create `tests/e2e/plans/dashboard-navigation.md`: click each stat card or widget link, verify it navigates to the correct page (Work Items, Agent Monitor, etc.), click back, verify dashboard is restored.

- [ ] **AI.3** — Write test plans for Work Items — List View. Create `tests/e2e/plans/work-items-list-view.md`: navigate to `/items`, verify list view is default, verify work items render with titles/state badges/priority badges, expand a parent item to see children, click a work item to open detail panel, verify detail panel shows correct item data. Create `tests/e2e/plans/work-items-create.md`: click the "+" button, verify a new work item appears in the list, verify it starts in Backlog state.

- [ ] **AI.4** — Write test plans for Work Items — Flow View. Create `tests/e2e/plans/work-items-flow-view.md`: navigate to `/items?view=flow`, verify state machine nodes render for all 8 workflow states, verify arrows between states, verify item counts on each node match the list view counts, click a state node and verify items in that state are highlighted or filtered.

- [ ] **AI.5** — Write test plans for Work Items — Detail Panel. Create `tests/e2e/plans/detail-panel-view.md`: select a work item, verify detail panel opens with title, state, priority, description, children list, comments, execution history. Create `tests/e2e/plans/detail-panel-edit.md`: click title to edit, change it, verify save works, edit description via Write/Preview tabs, change priority via dropdown, add a label, change state via transition dropdown — verify each mutation persists after page reload.

- [ ] **AI.6** — Write test plans for Work Items — Filtering and Search. Create `tests/e2e/plans/work-items-filtering.md`: type in the search box, verify list filters to matching items, select a state filter, verify only items in that state appear, select a priority filter, combine multiple filters, click "Clear filters" and verify all items return. Create `tests/e2e/plans/work-items-sorting.md`: change sort to "Created date", verify order changes, toggle sort direction, verify order reverses.

- [ ] **AI.7** — Write test plans for Agent Monitor. Create `tests/e2e/plans/agent-monitor-layout.md`: navigate to `/agents`, verify Live/History tabs exist, verify empty state message when no agents running. Create `tests/e2e/plans/agent-monitor-history.md`: click History tab, verify past executions table renders with persona, duration, cost, outcome columns, click a row to expand output, verify terminal renderer displays content.

- [ ] **AI.8** — Write test plans for Activity Feed. Create `tests/e2e/plans/activity-feed.md`: navigate to `/activity`, verify events render with icons, timestamps, descriptions, verify date grouping headers, apply a filter (e.g., by event type), verify list updates, clear filters.

- [ ] **AI.9** — Write test plans for Settings. Create `tests/e2e/plans/settings-projects.md`: navigate to `/settings`, verify Projects section shows project list, create a new project with a valid path, verify it appears, delete it. Create `tests/e2e/plans/settings-workflow.md`: verify persona-per-state table renders all 8 states, verify auto-routing toggle works. Create `tests/e2e/plans/settings-appearance.md`: toggle dark/light mode, verify theme changes, toggle compact/comfortable density, verify layout adjusts.

- [ ] **AI.10** — Write test plans for Persona Manager. Create `tests/e2e/plans/persona-manager.md`: navigate to `/personas`, verify persona cards render (5 built-in), click a persona to open editor, verify name/description/model/tools fields render, edit a field and save, verify change persists.

- [ ] **AI.11** — Write test plans for cross-cutting concerns. Create `tests/e2e/plans/navigation.md`: verify sidebar nav items link to correct pages, verify active nav item is highlighted, collapse sidebar and verify icon-only mode, test mobile hamburger menu. Create `tests/e2e/plans/dark-mode.md`: toggle theme in each page, verify no broken colors or invisible text. Create `tests/e2e/plans/keyboard-shortcuts.md`: open command palette with Cmd+K, search for a work item, navigate to it.

### Phase 2: Execute Test Plans

> One test plan per task. Agent reads the plan, launches the app in a browser via chrome-devtools MCP, follows every step, takes screenshots, records pass/fail.
> Prerequisites for every execution task: backend running on :3001, frontend on :5173 or :5174, API mode set to "api", seeded data, chrome-devtools MCP connected.
> Results go to `tests/e2e/results/{plan-name}.md` — same name as the plan file.

- [ ] **AI.12** — Execute `dashboard-stats.md`. Read `tests/e2e/plans/dashboard-stats.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/dashboard-stats.md`.

- [ ] **AI.13** — Execute `dashboard-navigation.md`. Read `tests/e2e/plans/dashboard-navigation.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/dashboard-navigation.md`.

- [ ] **AI.14** — Execute `work-items-list-view.md`. Read `tests/e2e/plans/work-items-list-view.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/work-items-list-view.md`.

- [ ] **AI.15** — Execute `work-items-create.md`. Read `tests/e2e/plans/work-items-create.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/work-items-create.md`.

- [ ] **AI.16** — Execute `work-items-flow-view.md`. Read `tests/e2e/plans/work-items-flow-view.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/work-items-flow-view.md`.

- [ ] **AI.17** — Execute `detail-panel-view.md`. Read `tests/e2e/plans/detail-panel-view.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/detail-panel-view.md`.

- [ ] **AI.18** — Execute `detail-panel-edit.md`. Read `tests/e2e/plans/detail-panel-edit.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/detail-panel-edit.md`.

- [ ] **AI.19** — Execute `work-items-filtering.md`. Read `tests/e2e/plans/work-items-filtering.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/work-items-filtering.md`.

- [ ] **AI.20** — Execute `work-items-sorting.md`. Read `tests/e2e/plans/work-items-sorting.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/work-items-sorting.md`.

- [ ] **AI.21** — Execute `agent-monitor-layout.md`. Read `tests/e2e/plans/agent-monitor-layout.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/agent-monitor-layout.md`.

- [ ] **AI.22** — Execute `agent-monitor-history.md`. Read `tests/e2e/plans/agent-monitor-history.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/agent-monitor-history.md`.

- [ ] **AI.23** — Execute `activity-feed.md`. Read `tests/e2e/plans/activity-feed.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/activity-feed.md`.

- [ ] **AI.24** — Execute `settings-projects.md`. Read `tests/e2e/plans/settings-projects.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/settings-projects.md`.

- [ ] **AI.25** — Execute `settings-workflow.md`. Read `tests/e2e/plans/settings-workflow.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/settings-workflow.md`.

- [ ] **AI.26** — Execute `settings-appearance.md`. Read `tests/e2e/plans/settings-appearance.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/settings-appearance.md`.

- [ ] **AI.27** — Execute `persona-manager.md`. Read `tests/e2e/plans/persona-manager.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/persona-manager.md`.

- [ ] **AI.28** — Execute `navigation.md`. Read `tests/e2e/plans/navigation.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/navigation.md`.

- [ ] **AI.29** — Execute `dark-mode.md`. Read `tests/e2e/plans/dark-mode.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/dark-mode.md`.

- [ ] **AI.30** — Execute `keyboard-shortcuts.md`. Read `tests/e2e/plans/keyboard-shortcuts.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/keyboard-shortcuts.md`.

### Phase 3: Triage

- [ ] **AI.31** — Triage and file bugs from test results. Read all files in `tests/e2e/results/`. For each failure: assess severity (critical, major, minor), categorize (UI bug, data bug, integration bug, missing feature). Write a summary to `tests/e2e/results/SUMMARY.md` with a table of all failures sorted by severity. Add any critical/major bugs as new tasks to TASKS.md for the next sprint.
