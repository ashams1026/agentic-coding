# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-25 complete and archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 26: Intelligence & Discovery

> Agent Collaboration P1, Search P1, Analytics + Token Usage P1.
> Proposal docs: `docs/proposals/agent-collaboration/context-sharing.md`, `docs/proposals/agent-collaboration/coordination.md`, `docs/proposals/search/design.md`, `docs/proposals/analytics/metrics.md`, `docs/proposals/analytics/ux-design.md`, `docs/proposals/token-usage/tracking.md`, `docs/proposals/token-usage/dashboard-ux.md`

### Agent Collaboration Phase 1

- [x] **COL.1** — Backend: create `packages/backend/src/agent/handoff-notes.ts`. Define `HandoffNote` schema type: `{ fromState, targetState, summary, decisions: string[], filesChanged: string[], openQuestions: string[] }`. Add `handoffNotes` JSON column to `executions` table (nullable). Generate migration. Update shared entity types. *(completed 2026-04-02 19:35 PDT)*
- [x] **COL.2** — Backend: update `packages/backend/src/agent/execution-manager.ts` to persist handoff notes. On execution completion (status=completed), extract structured summary from agent's final output and store as `handoffNotes` JSON. Add `buildHandoffNote()` helper that constructs the note from execution context (persona, state, summary, files from logs). *(completed 2026-04-02 19:50 PDT)*
- [x] **COL.3** — Backend: update `packages/backend/src/agent/dispatch.ts` to inject handoff context. Before spawning an execution, query the work item's most recent completed execution's `handoffNotes`. Inject as a "Previous Agent Context" section in the system prompt via `buildSystemPrompt()`. Skip if no prior execution exists. *(completed 2026-04-02 20:10 PDT)*
- [review] **COL.4** — Backend: add dependency enforcement in `packages/backend/src/agent/dispatch.ts`. Before dispatching, query `workItemEdges` where `type = 'depends_on'` and `toId = currentItemId`. Check that all upstream items (fromId) have `currentState` in a terminal workflow state. If any upstream is incomplete, block dispatch with a system comment explaining which dependencies are pending.
- [ ] **COL.5** — Backend: add context windowing in `packages/backend/src/agent/handoff-notes.ts`. Create `buildAccumulatedContext(workItemId)` that collects all handoff notes for a work item's execution history, then summarizes older notes to fit within a token budget (e.g., 2000 tokens). Most recent note is full; older notes are compressed to one-line summaries.
- [ ] **COL.6** — Frontend: update `packages/frontend/src/features/work-items/detail-panel.tsx` to display handoff notes. In the Execution History section, show a collapsible "Handoff Notes" card for each execution that has them. Display: decisions list, files changed, open questions. Use existing card/badge styling.

### Search Phase 1

- [ ] **SRC.1** — Backend: create FTS5 virtual tables in `packages/backend/src/db/schema.ts`. Add `work_items_fts` (title + description), `personas_fts` (name + system_prompt), `comments_fts` (body), `chat_messages_fts` (content). Create migration with FTS5 CREATE VIRTUAL TABLE statements. Add rowid bridging tables for text-ID join.
- [ ] **SRC.2** — Backend: create FTS5 sync triggers in a new migration. INSERT/UPDATE/DELETE triggers on each source table that keep the FTS5 tables in sync. Add a one-time backfill script that populates FTS5 from existing data (run at startup if FTS tables are empty).
- [ ] **SRC.3** — Backend: create `packages/backend/src/routes/search.ts`. Implement `GET /api/search?q=...&type=...&projectId=...`. Query across FTS5 tables with BM25 ranking. Return unified results: `{ data: SearchResult[], total }` where `SearchResult = { type, id, title, snippet, score, projectId }`. Respect `archived_at`/`deleted_at` filters. Register in server.ts.
- [ ] **SRC.4** — Frontend: upgrade Command Palette (`packages/frontend/src/components/command-palette.tsx` or equivalent) from client-side filtering to server-backed search. On keystroke, debounce 300ms then call `GET /api/search?q=...`. Show results grouped by type (work items, personas, comments, messages) with snippet highlights.
- [ ] **SRC.5** — Frontend: add full-text search to work items filter bar in `packages/frontend/src/features/work-items/filter-bar.tsx`. Add a search input that calls `GET /api/search?q=...&type=work_item&projectId=...`. Filter the list view to show matching items. Highlight matched terms if feasible.

### Analytics + Token Usage Phase 1

- [ ] **ANL.1** — Backend: add `model` (TEXT nullable), `totalTokens` (INTEGER nullable), `toolUses` (INTEGER nullable) columns to `executions` table in `packages/backend/src/db/schema.ts`. Generate migration. Update shared `Execution` entity type. Fix the cents/USD unit inconsistency in `costUsd` column docs (it stores cents, not USD).
- [ ] **ANL.2** — Backend: persist token data in `packages/backend/src/agent/execution-manager.ts`. On `ResultEvent`, extract `model` from the persona config and `totalTokens`/`toolUses` from the accumulated progress events. Store on the execution record alongside existing `costUsd`. Also persist in Pico chat route (`packages/backend/src/routes/chat.ts`) for chat-based token tracking.
- [ ] **ANL.3** — Backend: create `packages/backend/src/routes/analytics.ts`. Implement 4 aggregate endpoints: `GET /api/analytics/cost-by-persona` (group by personaId, sum costUsd), `GET /api/analytics/cost-by-model` (group by model, sum costUsd), `GET /api/analytics/tokens-over-time?range=7d|30d` (daily token totals), `GET /api/analytics/top-executions?limit=10` (most expensive by costUsd). All accept `projectId` filter. Register in server.ts.
- [ ] **ANL.4** — Frontend: create `packages/frontend/src/pages/analytics.tsx` page. Add `/analytics` route in router.tsx. Add "Analytics" link with BarChart3 icon in sidebar between Activity Feed and Chat. Page has two tabs: "Overview" and "Token Usage".
- [ ] **ANL.5** — Frontend: create `packages/frontend/src/features/analytics/overview-tab.tsx`. Render 4 summary cards (total cost, total executions, success rate, avg duration — reuse existing dashboard stats hook). Add cost trend line chart (7d/30d toggle) using Recharts `LineChart`. Add execution outcomes stacked bar chart using `BarChart`. Add cost-by-persona horizontal bar chart.
- [ ] **ANL.6** — Frontend: create `packages/frontend/src/features/analytics/token-usage-tab.tsx`. Render token usage over time (dual-axis: tokens + cost) using Recharts `ComposedChart`. Add breakdown by model pie chart using `PieChart`. Add top N expensive executions table with columns: date, persona, model, tokens, cost, duration.
- [ ] **ANL.7** — Frontend: create React Query hooks in `packages/frontend/src/hooks/use-analytics.ts`. Add `useAnalyticsCostByPersona(projectId, range)`, `useAnalyticsCostByModel(projectId, range)`, `useAnalyticsTokensOverTime(projectId, range)`, `useAnalyticsTopExecutions(projectId, limit)`. Add API client functions in `client.ts`.

### Testing & Documentation

- [ ] **S26.TEST.1** — Write e2e test plan for Agent Collaboration: `tests/e2e/plans/agent-collaboration-phase1.md`. Cover: handoff notes display in execution history, dependency blocking in dispatch, context windowing summary.
- [ ] **S26.TEST.2** — Write e2e test plan for Search: `tests/e2e/plans/search-phase1.md`. Cover: command palette search, work items filter bar search, result ranking, type filtering, empty results.
- [ ] **S26.TEST.3** — Write e2e test plan for Analytics: `tests/e2e/plans/analytics-phase1.md`. Cover: analytics page tabs, summary cards, cost charts, token usage charts, time range selector, per-persona/model breakdowns.
- [ ] **S26.TEST.4** — Execute Agent Collaboration e2e tests. Run test plan via chrome-devtools MCP. Screenshot each case. Record to `tests/e2e/results/`. File bugs as `FX.*`.
- [ ] **S26.TEST.5** — Execute Search e2e tests. Run test plan via chrome-devtools MCP. Screenshot each case. Record to `tests/e2e/results/`. File bugs as `FX.*`.
- [ ] **S26.TEST.6** — Execute Analytics e2e tests. Run test plan via chrome-devtools MCP. Screenshot each case. Record to `tests/e2e/results/`. File bugs as `FX.*`.
- [ ] **S26.DOC.1** — Document Sprint 26 APIs. Update `docs/api.md` with: handoff notes schema + injection, dependency enforcement behavior, search endpoint + FTS5, analytics endpoints + token tracking. Update `docs/architecture.md` with context windowing design.
- [ ] **S26.TEST.7** — Regression checkpoint: re-run ALL existing e2e test plans against current build. Compare against Sprint 25 baseline (37 suites, 0 regressions). File bugs as `FX.REG.*`.

---

> **Future sprints (27+) and Tier 3 backlog are defined in `docs/roadmap.md`.** When Sprint 26 is complete, the Decomposer agent should read the roadmap and decompose Sprint 27 into tasks.
