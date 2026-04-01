# AgentOps — Completed Tasks Archive

> Completed tasks moved from `TASKS.md` by the cleanup agent. Grouped by sprint/phase.

---

## Sprints 1-3: Scaffolding + UI Screens (consolidated) — completed 2026-03-29

**Sprint 1 (T1.x):** 16 tasks. Monorepo setup (pnpm workspaces, TS strict, ESLint/Prettier), frontend foundation (Vite+React 19, Tailwind CSS, shadcn/ui, React Router, TanStack Query+Zustand, app shell, dark mode), shared types (entities, API contracts), mock data layer (fixtures, API service, hooks, WebSocket, demo mode).

**Sprint 2 (T2.x):** 23 tasks. Dashboard, kanban board, story/task detail, agent monitor, activity feed, workflow designer, persona manager.

**Sprint 3 (T2.9-T2.12 + R.1-R.6):** 11 tasks. Settings page, global components (command palette, toasts, skeletons, badges), WebSocket, sidebar refinements.

**Sprint 4 (T3.1.1):** 1 task. Fastify backend scaffold.

---

## Sprints 5-10: Backend + UI Polish (consolidated) — completed 2026-03-30

**Sprint 5 (T3.x):** 10 tasks. Drizzle migrations/seed, 5 resource route sets, WebSocket server, API client (32 functions), API mode toggle.

**Sprint 6 (O.1-O.20):** 20 tasks. Replaced Story+Task with WorkItem, 8-state workflow, multi-view UI (list/board/tree), detail panel, sidebar/router cleanup, Drizzle schema (9 tables), seed (16 items), CRUD routes.

**Sprint 7 (U.x):** 9 tasks. Flow view (state machine graph), inline editing, state transitions, agent monitor polish.

**Sprint 8 (A.1-A.18):** 18 tasks. MCP server (7 tools), ClaudeExecutor, dispatch/router, rate limiter, concurrency, cost tracking, project memory.

**Sprint 9 (Q.1-Q.13):** 13 tasks. 118 tests — workflow state machine (24), API integration (49), agent logic unit tests (45).

**Sprint 10 (P.1-P.12):** 12 tasks. Design system, filtering/search, resizable detail panel, micro-interactions.

---

## Sprints 11-15: Integration + Docs + Settings (consolidated) — completed 2026-03-30

**Sprint 11 (E.1-E.10):** 10 tasks. API client fixes, TanStack cache invalidation, agent monitor WS, activity feed, dev seed, pipeline walkthrough, dispatch trigger fix, parent-child coordination, error handling, stale execution cleanup.

**Sprint 12 (S.1-S.9):** 9 tasks. CLI (start/stop/status/dev), pm2 ecosystem, setup.sh, logging (pino + audit trail), config file.

**Sprint 13 (W.1-W.8):** 8 tasks. API key management, concurrency slider, cost settings, auto-routing toggle, density, data export/import.

**Sprint 14 (D.1-D.10):** 10 docs. README, getting started, architecture, data model, workflow, personas, REST API (48 endpoints), MCP tools, deployment, frontend.

**Sprint 15 (PS.1-PS.10):** 10 tasks. Project scoping (all queries scoped to selected project), empty states, auto-seed personas, folder browser. + QF.1 (API mode toggle).

---

## Sprint 16: AI-Based E2E Testing — completed 2026-03-30

**Phase 1 (AI.1-AI.11):** 11 tasks. Test plan directory + template, 17 test plan files covering all UI screens.

**Phase 1.5 (AI.V1-AI.V11):** 11 tasks. Visual inspection protocol added to all test plans (screenshot checkpoints, Visual Quality/Failure criteria).

**Phase 2 (AI.12-AI.28):** 17 tasks. Executed all test plans via chrome-devtools MCP. 243/253 PASS, 2 FAIL, 4 N/A across 17 suites.

**Phase 2 (AI.29-AI.30):** 2 tasks. dark-mode (19/19 PASS), keyboard-shortcuts (16/17 PASS, 1 FAIL — work item route 404).

**Phase 3 (AI.31):** 1 task. Triage — 263 total steps, 256 PASS, 3 FAIL, 4 N/A (97.3%). Filed FX.CMD1 (Major), FX.EDIT1 (Minor). FX.MOCK1 already tracked.

---

## Sprint 17: Agent Pipeline Fixes (consolidated) — completed 2026-03-31

**Sprint 17 (FX.SEC1-FX.DB4, FX.DEV1, FX.SDK2, FX.NAV2, FX.AM1, FX.CMD1, FX.EDIT1, FX.9):** 40 tasks. Command sandbox, mock layer removal (-2283 lines), demo seed, settings fixes, auto-routing play/pause, graceful restart, Flow view redesign, sidebar fix, persona overhauls (all 5 personas), persona detail panel, skills system (entity+DB+browser+injection), router loop defense (3 layers), cost audit, agent monitor UX (identity header, chat thread, log parsing), DB/executor env separation, dev server port-check, SDK native skills, sidebar/e2e bug fixes, activity feed enrichment.

---

**Sprint 18 (PICO.1-PICO.10):** 10 tasks. Pico project assistant — backend (persona, chat API, SSE streaming, knowledge skill), frontend (bubble, panel, messages, SSE hook, session management), personality polish.

**Sprint 17 (remaining, FX.SDK1, FX.SDK4):** 2 tasks. SDK discovery endpoint (superseded by V2), capabilities picker.

**Sprint 19 (V2.1-V2.2, V2.4, FC.1-FC.3):** 6 tasks. V2 persistent session manager, capabilities discovery, architecture docs, file checkpointing (executor, rewind API, rewind button UI).

---

**Sprint 17 (bug fixes, FX.PICO1, FX.PICO4, FX.LIC1, FX.PICO2-3, FX.SDK6):** 6 tasks. Pico fixes (persona seed, CORS), Apache license, Pico e2e test (30/38 PASS), subagent browser.

---

## Sprint 19 (SDK.FC/HK/SO/SA/ET, FX.PICO5/PROJ1): SDK Hooks & File Checkpointing — 30 tasks — archived 2026-04-01

File checkpointing (rewind MCP tool, e2e test, docs), 8 SDK hooks (PreToolUse sandbox, PostToolUse audit, SessionStart/End, FileChanged + UI), structured Router output (JSON schema, decision cards, e2e), subagent definitions (all personas as subagents, hooks + WS events, nested UI), effort & thinking (persona settings, editor dropdowns, e2e 11/13 PASS), plus FX.PICO5 (scroll fix) and FX.PROJ1 (stale project ID).

---

## Sprint 20 (SDK.ST/SB/MCP/UX/REG): Observability & Safety — 30 tasks — archived 2026-04-01

Streaming (partial messages, progress summaries, rate limits, context usage), sandbox (SDK native + canUseTool + per-project UI), dynamic MCP management (toggle/reconnect/status API + dots UI), Pico suggestions (pill buttons), model switching (AlertDialog), in-process MCP server, 6 e2e test suites. Regression sweeps REG.1 + REG.2 both PASS.

---

## Sprint 21 (DOC.1-9): Documentation Refresh — 9 tasks — archived 2026-04-01

Full refresh of all 9 doc files: getting-started, architecture, data-model, workflow, personas, api, mcp-tools, deployment, frontend.

### Backlog Spikes (SDK.FUT.1-2) — archived 2026-04-01
- [x] **SDK.FUT.1** — Browser SDK spike (feasible, not recommended — needs WebSocket relay). *(completed 2026-04-01)*
- [x] **SDK.FUT.2** — Bridge API spike (`spawnClaudeCodeProcess`, SSH/Docker/Cloud paths). *(completed 2026-04-01)*
- [x] **SDK.FUT.3** — Plugin system spike (local plugins work, marketplace via settings). *(completed 2026-04-01)*
- [x] **SDK.FUT.4** — HTTP hooks spike (zero code — settings-only webhooks). *(completed 2026-04-01)*
- [x] **SDK.FUT.5** — Worktree isolation spike (5 mechanisms, replaces file locking). *(completed 2026-04-01)*
- [x] **SDK.FUT.6** — Updated docs/architecture, deployment, personas, getting-started for FUT.1-5. *(completed 2026-04-01)*

---

## Backlog: Pluggable Executor Architecture — archived 2026-04-01

- [x] **PLUG.1** — Refactored ExecutionManager into class with injected ExecutorFactory, updated 6 call sites. *(completed 2026-04-01)*
- [x] **PLUG.2** — Created composition root `setup.ts` — sole file importing concrete executors. *(completed 2026-04-01)*
- [x] **PLUG.3a** — Created `@agentops/core` package, moved types.ts and sandbox.ts. *(completed 2026-04-01)*
- [x] **PLUG.3b** — Defined 6 repository interfaces in core + Drizzle implementations in backend. *(completed 2026-04-01)*
- [x] **PLUG.4** — Added ExecutorRegistry class to core, wired into ExecutionManager and REST API. *(completed 2026-04-01)*
- [x] **PLUG.5** — Publish-ready package.json for shared and core (dist exports, files whitelist, tsconfig.build). *(completed 2026-04-01)*
