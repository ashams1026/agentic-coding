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
- [x] **PLUG.6** — Create example custom executor template. `examples/custom-executor/` with EchoExecutor, setup.ts, README. *(completed 2026-04-01)*
- [x] **PLUG.7** — Update `docs/architecture.md` with pluggable executor documentation. *(completed 2026-04-01)*
- [x] **PLUG.8** — Integration tests for executor registry. 15 tests in `executor-registry.test.ts`. *(completed 2026-04-01)*
- [x] **PLUG.9** — E2E test plan: executor switching UI. 14 steps across 5 parts. *(completed 2026-04-01)*
- [x] **PLUG.10** — Run executor switching e2e test. 12/14 PASS, 0 FAIL, 2 SKIP. *(completed 2026-04-01)*

---

## Backlog: Agent Workflow Improvements — archived 2026-04-01

- [x] **AW.1** — Add conditional visual UI check to agent WORK state. `[VISUAL CHECK]` step between `[IMPLEMENT]` and `[VERIFY]` in AGENT_PROMPT.md. *(completed 2026-04-01)*
- [x] **AW.2** — Add visual check to REVIEW state. Visual verification in `[INSPECT WORK]` step of AGENT_PROMPT.md. *(completed 2026-04-01)*

---

## Sprint 22: Visual UX Audit (partial) — archived 2026-04-01

- [x] **UX.DASH** — Audit Dashboard page. 7 screenshots, 3 bugs filed (FX.UX.DASH.1-3). *(completed 2026-04-01)*
- [x] **FX.UX.DASH.1** — Cost Summary widget below fold. Fixed: `lg:grid-cols-2` → `md:grid-cols-2 lg:grid-cols-3` in dashboard.tsx. *(completed 2026-04-01)*
- [x] **FX.UX.DASH.2** — Stat cards and agent cards not accessible. Fixed: added `role="button"`, `tabIndex={0}`, `onKeyDown`, focus-visible ring. *(completed 2026-04-01)*
- [x] **FX.UX.DASH.3** — Activity items link to generic `/items`. Fixed: `setSelectedItemId` + `navigate("/items")` pattern. *(completed 2026-04-01)*
- [x] **UX.WORK.LIST** — Audit Work Items list view. 9 screenshots, 1 bug (FX.UX.ITEMS.1). *(completed 2026-04-01)*
- [x] **UX.WORK.FLOW** — Audit Work Items flow view. 6 screenshots, 0 bugs. *(completed 2026-04-01)*
- [x] **UX.WORK.CREATE** — Audit Work Item creation. Quick-add pattern, 0 bugs. *(completed 2026-04-01)*
- [x] **FX.UX.ITEMS.1** — Empty state for grouped filter results. Fixed: `topLevel.length === 0` check + "Clear filters" button. *(completed 2026-04-01)*
- [x] **UX.DETAIL** — Audit detail panel. 3 screenshots, 0 bugs. *(completed 2026-04-01)*
- [x] **UX.AGENT.MAIN** — Audit Agent Monitor main layout. 3 screenshots, 1 bug (FX.UX.AGENT.1). *(completed 2026-04-02)*
- [x] **UX.AGENT.CONTROLS** — Audit Agent Monitor controls. 2 screenshots, 1 bug (FX.UX.AGENT.2). *(completed 2026-04-02)*
- [x] **UX.AGENT.HISTORY** — Audit Agent Monitor history. 3 screenshots, 0 bugs. *(completed 2026-04-02)*
- [x] **UX.ACTIVITY** — Audit Activity Feed. 3 screenshots, 1 bug (FX.UX.ACTIVITY.1). *(completed 2026-04-02)*
- [x] **FX.UX.AGENT.1** — "Work Item" and "Parent" links in agent header bar navigate to 404. *(completed 2026-04-02)*
- [x] **FX.UX.AGENT.2** — MCP status panel triggers error toast on 404. *(completed 2026-04-02)*
- [x] **FX.UX.ACTIVITY.1** — Activity feed events all link to generic `/items` instead of specific work item. *(completed 2026-04-02 02:00 PDT)*
- [x] **UX.PERSONA.LIST** — Audit Persona Manager list and editor. 10 screenshots, 2 bugs (FX.UX.PERSONA.1-2). *(completed 2026-04-02)*
- [x] **UX.PERSONA.TEST** — Audit Persona Manager test run and creation. 4 screenshots, 2 bugs (FX.UX.PERSONA.3-4). *(completed 2026-04-02)*
- [x] **UX.SETTINGS** — Audit Settings page (all sections). 9 screenshots, 0 bugs. *(completed 2026-04-02)*
- [x] **UX.PICO** — Audit Pico Chat panel. 6 screenshots, 0 bugs. *(completed 2026-04-02)*
- [x] **UX.NAV** — Audit navigation and sidebar. 5 screenshots, 0 bugs. *(completed 2026-04-02 04:00 PDT)*
- [x] **UX.CMD** — Audit Command Palette. 4 screenshots, 0 bugs. *(completed 2026-04-02 04:15 PDT)*
- [x] **UX.DARK** — Comprehensive dark mode audit. 9 screenshots, 0 bugs. *(completed 2026-04-02 04:35 PDT)*
- [x] **UX.RESPONSIVE** — Comprehensive responsive audit at 1024px and 768px. 12 screenshots, 0 bugs. *(completed 2026-04-02 05:15 PDT)*
- [x] **FX.PICO.EXEC** — Fix "Claude Code executable not found" — added getClaudeCodeExecutablePath() to config.ts, pathToClaudeCodeExecutable to all 4 query() call sites. *(completed 2026-04-02 05:45 PDT)*
- [x] **FX.UX.REWIND** — Fix disabled rewind button tooltip — wrapped Button in span for TooltipTrigger activation. *(completed 2026-04-02 06:00 PDT)*
- [x] **FX.UX.PERSONA.1** — Persona cards keyboard accessibility — added role="button", tabIndex, onKeyDown, focus-visible ring. *(completed 2026-04-02 06:15 PDT)*
- [x] **FX.UX.PERSONA.2** — Built-in persona label mismatch — exported BUILT_IN_IDS, used in both list and detail panel. *(completed 2026-04-02 06:30 PDT)*
- [x] **FX.UX.PERSONA.3** — Delete selected persona 404 toast — clear selection + removeQueries on delete. *(completed 2026-04-02 06:45 PDT)*
- [x] **UX.AGENT.BREADCRUMB** — Breadcrumb trail + side panel overlay replacing nav buttons in Agent Monitor. *(completed 2026-04-02 07:05 PDT)*
- [x] **HK.TEST.RESULTS** — Restructured tests/e2e/results/ into 46 timestamped directories. *(completed 2026-04-02 07:25 PDT)*
- [x] **RES.SDK.TOOLS** — Research SDK tool discovery — found sdk-tools.d.ts with 21 tools, recommended version-pinned shared manifest. *(completed 2026-04-02 07:40 PDT)*
- [x] **RES.V2.SESSIONS** — Research V2 sessions for Pico — SDKSessionOptions missing 12+ fields, recommended query() with resume. *(completed 2026-04-02 07:55 PDT)*

---

**Bug Fixes, Research & UX (FX.WORK.EDIT, FX.PERSONA.SEED, FX.PICO.OVERFLOW/EMPTY.BUBBLE, RES.PLUG.CORE, RES.GLOBAL.DATA/NAV/UX, RES.WORKFLOW.DATA/BUILDER/RUNTIME/EDGE, RES.PROMPTS.DOC/VARS, UX.PICO.MINI.CONTENT/RESIZE/STATUSBAR/FULLPAGE/COLLAPSE, UX.BRAND.WOOF):** 20 tasks. Bug fixes (work item persistence, persona seed, Pico overflow/empty bubble). Research proposals (pluggable core extraction, global agents data/nav/UX, custom workflow data model/builder/runtime/edge cases, persona prompt pipeline/template variables). UX polish (Pico compact content, resize, status line, full-page chat, collapse chevron, Woof rebrand).

---

## Research: Design Proposals — archived 2026-04-02

- [x] **RES.CHAT.UX** — Research dedicated agent chat page UX — session sidebar, persona selector, Pico relationship, scoping, navigation. *(completed 2026-04-02 17:10 PDT)*
- [x] **RES.CHAT.RICH** — Research rich message rendering — 8 content types (diffs, tool calls, terminal, file trees, proposals, thinking, images, progress). *(completed 2026-04-02 17:30 PDT)*
- [x] **RES.CHAT.DATA** — Research chat data model — hybrid contentBlocks, SSE + control endpoints, execution linking, V2 readiness. *(completed 2026-04-02 17:50 PDT)*
- [x] **RES.LIFECYCLE.UX** — Research work item delete & archive UX — archive primary, 3-tier confirmation, bulk ops, 30-day soft delete. *(completed 2026-04-02 18:10 PDT)*
- [x] **RES.LIFECYCLE.DATA** — Research work item lifecycle data model — archived_at/deleted_at timestamps, cascade rules, API design, agent guards. *(completed 2026-04-02 18:30 PDT)*
- [x] **RES.NOTIFY.UX** — Research notifications UX — 10-event catalog, bell icon + drawer, toast vs persistent, quiet hours, Agent Monitor suppression. *(completed 2026-04-02 18:50 PDT)*
- [x] **RES.NOTIFY.INTEGRATIONS** — Research notification channels — Slack/email/webhooks, NotificationService event bus, rate limiting, delivery log. *(completed 2026-04-02 19:10 PDT)*
- [x] **RES.COLLAB.CONTEXT** — Research agent context passing — handoff notes, shared scratchpad, context windowing, agent-to-agent tagging. *(completed 2026-04-02 19:45 PDT)*
- [x] **RES.COLLAB.COORD** — Research multi-agent coordination — parallel execution, dependency enforcement, human-in-loop, escalation, fan-out/fan-in. *(completed 2026-04-02 20:15 PDT)*
- [x] **RES.SCHED.UX** — Research scheduling UX — per-persona schedules, presets/cron, standalone executions, schedule management, notification integration. *(completed 2026-04-02 20:40 PDT)*
