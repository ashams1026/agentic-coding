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

**Sprint 16 (AI.1-AI.31):** 42 tasks. AI-based E2E testing — 17 test plans + visual inspection protocol, executed all suites (263 steps, 256 PASS, 3 FAIL, 4 N/A = 97.3%).

**Sprint 17 (FX.*/PICO.*/FX.SDK*):** 48 tasks. Agent pipeline fixes, mock removal, persona overhauls, skills system, Pico assistant, SDK discovery.

**Sprint 18 (PICO.1-10):** 10 tasks. Pico project assistant (chat API, SSE streaming, knowledge skill, frontend panel).

**Sprint 19 (V2/FC/SDK.FC-ET):** 36 tasks. V2 sessions, file checkpointing, SDK hooks, structured output, subagent definitions, effort & thinking.

**Sprint 20 (SDK.ST/SB/MCP/UX/REG):** 30 tasks. Streaming, sandbox, dynamic MCP management, Pico suggestions, model switching, 6 e2e suites. REG.1+REG.2 PASS.

**Sprint 21 (DOC.1-9):** 9 tasks. Full refresh of all 9 doc files.

**Backlog Spikes (SDK.FUT.1-6):** 6 tasks. Browser SDK, Bridge API, plugin system, HTTP hooks, worktree isolation, doc updates.

**Pluggable Executor (PLUG.1-10):** 10 tasks. ExecutorFactory refactor, core package, registry, example executor, integration tests, e2e (12/14 PASS).
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

---

## Research proposals batch 3 (RES.SCHED.INFRA–RES.SWAP.API): 10 tasks — archived 2026-04-01

Scheduling infrastructure, rollback UX, templates, analytics metrics/UX, inbound/outbound webhooks, frontend/backend swappability (architecture, hosted, API contract). All design docs in `docs/proposals/`.

- [x] **RES.SCHED.INFRA** — Research scheduling infrastructure — node-cron + SQLite persistence, missed run catch-up, 14-column schedules table, shared concurrency pool. *(completed 2026-04-02 21:15 PDT)*
- [x] **RES.ROLLBACK** — Research rollback UX — per-execution scope, confirmation dialog with diff preview, conflict detection, opt-in git commits, SDK limitations. *(completed 2026-04-02 21:45 PDT)*
- [x] **RES.TEMPLATES** — Research templates and presets — work item/workflow/project/persona templates, DB vs JSON storage, community gallery. *(completed 2026-04-02 22:15 PDT)*
- [x] **RES.ANALYTICS.METRICS** — Research metrics collection — per-execution/persona/project/workflow metrics, SQLite aggregation tradeoffs. *(completed 2026-04-02 22:45 PDT)*
- [x] **RES.ANALYTICS.UX** — Research analytics dashboard UX — time ranges, visualizations, drill-down, export. *(completed 2026-04-02 23:15 PDT)*
- [x] **RES.WEBHOOKS.INBOUND** — Research inbound triggers — GitHub/Slack/generic webhook receiver, payload-to-prompt mapping, HMAC security. *(completed 2026-04-02 23:45 PDT)*
- [x] **RES.WEBHOOKS.OUTBOUND** — Research outbound event webhooks — event subscriptions, HMAC signing, retry with backoff, delivery log. *(completed 2026-04-03 01:00 PDT)*
- [x] **RES.SWAP.ARCH** — Research frontend/backend decoupling — backend selector UX, connection validation, auth, WS reconnection, 5 deployment models. *(completed 2026-04-03 01:45 PDT)*
- [x] **RES.SWAP.HOSTED** — Research hosted frontend — localhost mixed content OK, Cloudflare Pages CDN, tunnel options, multi-backend localStorage. *(completed 2026-04-01 16:20 PDT)*
- [x] **RES.SWAP.API** — Research API contract and versioning — ~70 endpoints audited, OpenAPI 3.1 code-first, apiVersion + capabilities, shared package evolution. *(completed 2026-04-01 16:30 PDT)*

---

## Sprint 23: Foundations (partial) — archived 2026-04-01

### Error Recovery Phase 1

- [x] **FND.ERR.1** — Add `busy_timeout` and `synchronous` PRAGMAs to SQLite connection. *(completed 2026-04-01 20:30 PDT)*
- [x] **FND.ERR.2** — Replace fixed 3s WS reconnect with exponential backoff + jitter. *(completed 2026-04-01 20:33 PDT)*
- [x] **FND.ERR.3** — Add React error boundaries at app and page level. *(completed 2026-04-01 20:35 PDT)*
- [x] **FND.ERR.4** — Add WS connection state indicator to status bar and Agent Monitor. *(completed 2026-04-01 20:38 PDT)*
- [x] **FND.ERR.5** — Add structured `error` JSON column to executions schema. *(completed 2026-04-01 20:42 PDT)*
- [x] **FND.ERR.6** — Add `interrupted` execution status for orphan recovery. *(completed 2026-04-01 20:44 PDT)*
- [x] **FND.ERR.7** — Wrap migrations in a pre-migration SQLite backup. *(completed 2026-04-01 20:50 PDT)*

### Work Item Lifecycle

- [x] **FND.WIL.1** — Schema: add `archived_at` and `deleted_at` nullable timestamp columns to `work_items`. *(completed 2026-04-01 20:55 PDT)*
- [x] **FND.WIL.2** — Fix DELETE orphan bug and convert to soft delete. *(completed 2026-04-01 20:58 PDT)*
- [x] **FND.WIL.3** — Archive/unarchive/restore API endpoints. *(completed 2026-04-01 21:03 PDT)*
- [x] **FND.WIL.4** — Bulk operations API and background hard-delete job. *(completed 2026-04-01 21:20 PDT)*
- [x] **FND.WIL.5** — Frontend: "Show archived" toggle and archived item styling. *(completed 2026-04-01 21:28 PDT)*
- [x] **FND.WIL.6** — Frontend: archive/delete actions in context menus and detail panel. *(completed 2026-04-01 21:43 PDT)*
- [x] **FND.WIL.7** — Frontend: bulk action bar for multi-select. *(completed 2026-04-01 22:08 PDT)*
- [x] **FND.WIL.8** — Settings: "Recently deleted" recovery view. *(completed 2026-04-01 22:24 PDT)*

### Global Agents Phase 1

- [x] **FND.GA.1** — Schema migration: make chatSessions.projectId nullable, add projectId to executions, create global_memories table. *(completed 2026-04-01 22:36 PDT)*
- [x] **FND.GA.2** — Add AgentScope type and update entity types in shared package. *(completed 2026-04-01 22:46 PDT)*
- [x] **FND.GA.3** — Navigation: add "All Projects" option to sidebar project selector. *(completed 2026-04-01 23:10 PDT)*
- [x] **FND.GA.4** — Dashboard scope-awareness: aggregated stats when no project selected. *(completed 2026-04-01 23:25 PDT)*
- [x] **FND.GA.5** — Agent Monitor scope-awareness: scope badges and filter. *(completed 2026-04-01 23:40 PDT)*
- [x] **FND.GA.6** — Agent Monitor "New Run" modal. *(completed 2026-04-02 00:00 PDT)*
- [x] **FND.GA.7** — Backend: POST /api/executions/run standalone execution endpoint. *(completed 2026-04-02 00:15 PDT)*
- [x] **FND.GA.8** — Pico scope toggle and persona picker in chat panel header. *(completed 2026-04-02 00:30 PDT)*
- [x] **FND.GA.9** — Backend: support nullable projectId in chat sessions and persona override. *(completed 2026-04-02 00:45 PDT)*
- [x] **FND.GA.10** — E2E test plan for Global Agents Phase 1. *(completed 2026-04-02 01:00 PDT)*

### Testing & Documentation (partial)

- [x] **FND.TEST.1** — E2E test plan for Error Recovery Phase 1. *(completed 2026-04-02 01:15 PDT)*
- [x] **FND.TEST.2** — E2E test plan for Work Item Lifecycle. *(completed 2026-04-02 01:30 PDT)*
- [x] **FND.TEST.3** — Execute Error Recovery e2e tests — 8/8 pass. *(completed 2026-04-02 01:45 PDT)*
- [x] **FND.TEST.4** — Execute Work Item Lifecycle e2e tests — 9/10 pass, 1 skip. *(completed 2026-04-02 02:05 PDT)*
