# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-15 complete and archived.

---

## Sprint 17: Agent Pipeline Fixes & Monitor UX

> Critical fixes from first real-world test run. Router loop, cost display, agent monitor readability, activity feed descriptions.

### Router & Dispatch Fixes

- [ ] **FX.1** — Prevent Router from re-routing to the same state. In `packages/backend/src/agent/mcp-server.ts` `route_to_state` tool: reject transitions where `targetState === currentState` with an error message "Cannot route to the current state." This prevents the PM→Router→PM loop where the Router keeps picking the same state.

- [ ] **FX.2** — Add Router transition history awareness. In `packages/backend/src/agent/router.ts`: when building the Router's system prompt, include the last 3 state transitions for this work item (from DB or audit log). Add an explicit instruction: "Do NOT route to a state this item was just in. If the persona's work appears incomplete, route to Blocked with a reason rather than re-triggering the same persona." This gives the Router enough context to break cycles.

- [ ] **FX.3** — Log when rate limiter triggers. In `packages/backend/src/agent/execution-manager.ts`: when `canTransition()` returns false, log a warning with the workItemId, current transition count, and a message: "Rate limiter triggered — max transitions per hour reached." Post a system comment on the work item so the user can see it in the UI. Broadcast a WS event so the dashboard can reflect it.

- [ ] **FX.4** — Add transition loop detection. In `execution-manager.ts` or `dispatch.ts`: track the last 3 state transitions per work item in memory. If the same state appears 3 times in the recent history (A→B→A→B pattern), halt the chain and post a system comment: "Detected routing loop — halting automatic transitions. Manual intervention required." Transition the item to Blocked.

### Cost Display Fixes

- [ ] **FX.5** — Audit cost aggregation and display. Check the dashboard stats route (`GET /api/dashboard/stats`) and cost summary route: verify that `costUsd` is correctly converted from cents (DB storage) to dollars (display). Verify the frontend dashboard cost widgets are dividing by 100 where needed. Check if seeded execution data has inflated fake costs that pollute the real project's totals. Ensure cost queries are scoped to the selected project (may overlap with PS.4 from Sprint 15).

### Agent Monitor UX Overhaul

- [ ] **FX.6** — Show persona identity in terminal renderer. In `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`: add a header bar above the output showing persona name (with colored avatar), persona model badge, and the work item title being worked on. Look up persona details from the execution's `personaId`. This should be the first thing the user sees — "Product Manager (Sonnet) working on Build TicTacToe App".

- [ ] **FX.7** — Render agent output as a chat thread. Restructure the terminal renderer to display output as a conversation: system/user messages appear as chat bubbles (left-aligned, muted background), agent text responses appear as chat bubbles (right-aligned or full-width), thinking blocks are collapsible accordion sections (collapsed by default, italic muted text, "Thinking..." label), tool calls are custom UI cards (tool icon + name + collapsible input/output, reuse existing ToolCallSection). Group consecutive text chunks into single message bubbles. Show timestamps on each message group.

- [ ] **FX.8** — Fix historical log chunk type detection. In `terminal-renderer.tsx` where `execution.logs` is split into chunks: instead of marking all lines as `"text"`, parse the log content to detect chunk types. Look for JSON-parseable lines that contain `chunkType` fields, or use heuristics: lines starting with `Tool:` or containing `tool_call`/`tool_result` → tool type, lines wrapped in `<thinking>` tags or prefixed with thinking indicators → thinking type, code blocks between triple backticks → code type. This restores structure to historical execution replays.

### Activity Feed Improvements

- [ ] **FX.9** — Enrich activity feed event descriptions. In `packages/frontend/src/features/activity-feed/activity-feed.tsx`: for base (historical) events, look up the persona name and work item title from the available query data. Replace generic descriptions: "Agent started working on work item" → "[Persona Name] started work on [Work Item Title]", "Agent completed" → "[Persona Name] completed work on [Work Item Title] (success/failed)", "State changed" → "[Work Item Title] moved from [Old State] to [New State]", "Router decision" → "Router moved [Work Item Title] to [New State]: [reasoning excerpt]". Ensure live WS events use the same enriched format (some already do — make it consistent).

---

## Sprint 16: AI-Based E2E Testing

> AI-driven end-to-end testing via browser automation. Two phases:
> Phase 1: Generate test plan files — each is a self-contained prompt an AI agent can follow using browser DevTools (chrome-devtools MCP).
> Phase 2: Execute each test plan, interact with the real app in a browser, and report results.
> All test plans live in `tests/e2e/plans/`. Each plan is a markdown file with step-by-step instructions, expected outcomes, and pass/fail criteria.
> Test execution requires: backend running on :3001, frontend on :5173/:5174, API mode set to "api", chrome-devtools MCP connected.

> QF.1 and AI.1–AI.9 complete and archived.

### Phase 1: Generate Test Plans (continued)

- [x] **AI.10** — Write test plans for Persona Manager. Create `tests/e2e/plans/persona-manager.md`: navigate to `/personas`, verify persona cards render (5 built-in), click a persona to open editor, verify name/description/model/tools fields render, edit a field and save, verify change persists.

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
