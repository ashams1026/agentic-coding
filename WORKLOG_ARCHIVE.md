# AgentOps — Work Log Archive

> Summarized entries from `WORKLOG.md`. Grouped by sprint/phase.

---

## Sprints 1-10 (consolidated) — 2026-03-28 to 2026-03-30

**Sprints 1-4:** Monorepo setup, React 19/Vite/Tailwind/shadcn/ui/TanStack/Zustand foundation, 9 full UI screens (dashboard, kanban, story/task detail, agent monitor, activity feed, workflow designer, persona manager, settings), mock data layer, command palette, toasts, Fastify backend scaffold.

**Sprints 5-7:** Drizzle schema (9 tables), seed script, 10 CRUD route sets, WebSocket server, API client (32 functions), API mode toggle. Story→WorkItem model overhaul, Flow view (state machine graph), inline editing, state transitions.

**Sprint 8 (A.1-A.18):** MCP server (7 tools), ClaudeExecutor with SDK, 4-layer system prompt, dispatch/router, rate limiter, concurrency, cost tracking, project memory.

**Sprint 9 (Q.1-Q.13):** 145 tests — Vitest setup, test DB helper, workflow (24), API routes (49), agent logic (45). Fixed JSON double-encoding bugs.

**Sprint 10 (P.1-P.12):** Design system (typography, buttons, spacing, dark mode surfaces), filtering/search with URL sync, resizable detail panel, tooltips, skeletons/empty states.

---

## Sprints 11-15 (consolidated) — 2026-03-30

**Sprint 11 (E.1-E.10):** API client fixes, WS→Query cache invalidation, agent monitor/activity feed wired, realistic seed, pipeline walkthrough (found state validation + WS broadcast bugs), dispatch trigger fix, parent-child coordination fix, error handling, stale execution cleanup.

**Sprint 12 (S.1-S.9):** CLI (start/stop/status/dev), pm2 ecosystem, setup.sh, pino logging + audit trail, config file (~/.agentops/config.json).

**Sprint 13 (W.1-W.8):** API key management (store + validate + wire to executor), project CRUD with path validation, concurrency slider, cost management, auto-routing toggle, density setting, data export/import.

**Sprint 14 (D.1-D.10):** 10 documentation files — README, getting started, architecture, data model, workflow, personas, REST API (48 endpoints), MCP tools, deployment, frontend.

**Sprint 15 (PS.1-PS.10):** Project scoping (all queries scoped to selected project), empty states, auto-seed personas, folder browser.

---

## Sprint 16: AI-Based E2E Testing (consolidated) — 2026-03-30

**Phase 1 (AI.1-AI.11):** 17 test plan files + template + README. All reviewed and approved.

**Phase 1.5 (AI.V1-AI.V11):** Visual inspection protocol added to all plans. Screenshot checkpoints, Visual Quality/Failure criteria.

**Phase 2 (AI.12-AI.28):** 17 test suites executed via chrome-devtools MCP. 243/253 PASS, 2 FAIL (detail-panel-edit: list reactivity + mock persistence), 4 N/A. All reviewed and approved.

**Phase 2 (AI.29-AI.30):** dark-mode 19/19 PASS, keyboard-shortcuts 16/17 PASS (1 FAIL: work item route 404).

**Phase 3 (AI.31):** Triage — 263 total steps, 256 PASS, 3 FAIL, 4 N/A (97.3%). Filed FX.CMD1, FX.EDIT1.

---

## Sprint 17 (partial): Security + Mock Removal + Settings — 2026-03-30

**FX.SEC1:** Command sandbox (sandbox.ts) — validates Bash commands against project directory escapes. Wired into executor system prompt + event stream.

**FX.MOCK1:** Removed mock API mode — deleted apiMode from store, rewrote api/index.ts as re-exports, ws.ts always uses realWs, removed status bar toggle + Settings Data Source + DemoButton/DemoControls. Bundle -43KB.

**FX.MOCK2:** Deleted mocks/ directory + use-demo.ts + demo-controls.tsx. -2283 lines.

**FX.MOCK3:** E2E test database script — seed-e2e.ts (reuses seed with temp DB), test-e2e.sh (setup/teardown/seed), 3 pnpm scripts.

**FX.MOCK4:** Demo seed — 3 projects, 14 work items across all 8 states, 14 executions, 13 comments, realistic cost data.

**FX.SET1:** Removed duplicate "Concurrency" nav, renamed "API Keys" → "Agent Configuration".

**FX.SET2:** Removed workflow SVG state machine diagram from settings (~135 lines).

**E2E test execution details (AI.19-AI.28):**
AI.19: filtering 14/14 PASS. AI.20: sorting 12/12 PASS. AI.21: agent-monitor-layout 7/9 PASS, 2 N/A. AI.22: agent-monitor-history 14/14 PASS. AI.23: activity-feed 14/14 PASS. AI.24: settings-projects 11/11 PASS. AI.25: settings-workflow 12/12 PASS. AI.26: settings-appearance 11/11 PASS. AI.27: persona-manager 19/19 PASS. AI.28: navigation 17/19 PASS, 2 N/A.
