# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-25 complete and archived. Sprint 26 partial: Agent Collaboration P1 (COL.1-6), Search P1 (SRC.1-4) archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 26: Intelligence & Discovery

> Agent Collaboration P1, Search P1, Analytics + Token Usage P1.
> Proposal docs: `docs/proposals/agent-collaboration/context-sharing.md`, `docs/proposals/agent-collaboration/coordination.md`, `docs/proposals/search/design.md`, `docs/proposals/analytics/metrics.md`, `docs/proposals/analytics/ux-design.md`, `docs/proposals/token-usage/tracking.md`, `docs/proposals/token-usage/dashboard-ux.md`

### Search Phase 1 (remaining)

- [x] **SRC.5** — Frontend: add full-text search to work items filter bar in `packages/frontend/src/features/work-items/filter-bar.tsx`. Add a search input that calls `GET /api/search?q=...&type=work_item&projectId=...`. Filter the list view to show matching items. Highlight matched terms if feasible. *(completed 2026-04-02 22:15 PDT)*

### Analytics + Token Usage Phase 1

- [x] **ANL.1** — Backend: add `model` (TEXT nullable), `totalTokens` (INTEGER nullable), `toolUses` (INTEGER nullable) columns to `executions` table in `packages/backend/src/db/schema.ts`. Generate migration. Update shared `Execution` entity type. Fix the cents/USD unit inconsistency in `costUsd` column docs (it stores cents, not USD). *(completed 2026-04-02 22:30 PDT)*
- [x] **ANL.2** — Backend: persist token data in `packages/backend/src/agent/execution-manager.ts`. On `ResultEvent`, extract `model` from the persona config and `totalTokens`/`toolUses` from the accumulated progress events. Store on the execution record alongside existing `costUsd`. Also persist in Pico chat route (`packages/backend/src/routes/chat.ts`) for chat-based token tracking. *(completed 2026-04-02 22:45 PDT)*
- [x] **ANL.3** — Backend: create `packages/backend/src/routes/analytics.ts`. Implement 4 aggregate endpoints: `GET /api/analytics/cost-by-persona` (group by personaId, sum costUsd), `GET /api/analytics/cost-by-model` (group by model, sum costUsd), `GET /api/analytics/tokens-over-time?range=7d|30d` (daily token totals), `GET /api/analytics/top-executions?limit=10` (most expensive by costUsd). All accept `projectId` filter. Register in server.ts. *(completed 2026-04-02 23:00 PDT)*
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
