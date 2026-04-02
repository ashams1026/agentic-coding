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

**Pluggable Executor + Backlog + Sprint 22 (consolidated):** PLUG.1-10 (executor refactor, core package, registry, e2e 12/14 PASS). AW.1-2 (visual check in WORK/REVIEW). Sprint 22: 35 tasks — 14 UI audits, 10 bug fixes, breadcrumb, test restructure, 2 SDK spikes.

---

**Bug Fixes, Research & UX (FX.WORK.EDIT, FX.PERSONA.SEED, FX.PICO.OVERFLOW/EMPTY.BUBBLE, RES.PLUG.CORE, RES.GLOBAL.DATA/NAV/UX, RES.WORKFLOW.DATA/BUILDER/RUNTIME/EDGE, RES.PROMPTS.DOC/VARS, UX.PICO.MINI.CONTENT/RESIZE/STATUSBAR/FULLPAGE/COLLAPSE, UX.BRAND.WOOF):** 20 tasks. Bug fixes (work item persistence, persona seed, Pico overflow/empty bubble). Research proposals (pluggable core extraction, global agents data/nav/UX, custom workflow data model/builder/runtime/edge cases, persona prompt pipeline/template variables). UX polish (Pico compact content, resize, status line, full-page chat, collapse chevron, Woof rebrand).

---

**Research: Design Proposals (RES.CHAT/LIFECYCLE/NOTIFY/COLLAB/SCHED — 10 tasks, archived 2026-04-02):** Agent chat UX/data model/rich messages, work item lifecycle UX/data model, notifications UX/integrations, agent collaboration context/coordination, scheduling UX. All in `docs/proposals/`.

**Research batch 3 (RES.SCHED.INFRA–RES.SWAP.API — 10 tasks, archived 2026-04-01):** Scheduling infra, rollback UX, templates, analytics metrics/UX, inbound/outbound webhooks, frontend/backend swappability (arch/hosted/API). All in `docs/proposals/`.

**Sprint 23: Foundations (FND.ERR.1-7, FND.WIL.1-8, archived 2026-04-01):** Error Recovery — 7 tasks (PRAGMAs, WS backoff, error boundaries, status indicator, structured errors, orphan recovery, backup). Work Item Lifecycle — 8 tasks (archived_at/deleted_at, soft delete, 409 guard, archive/unarchive/restore, bulk ops, "Show archived", context menus, "Recently deleted").
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
- [x] **FND.TEST.5** — Execute Global Agents Phase 1 e2e tests — 7/7 pass. *(completed 2026-04-02 02:30 PDT)*
- [x] **FND.TEST.6** — Regression checkpoint post-Sprint 23 — 34 suites, 0 regressions. *(completed 2026-04-02 02:55 PDT)*
- [x] **FND.DOC.1** — Document Work Item Lifecycle API endpoints in docs/api.md. *(completed 2026-04-02 03:25 PDT)*
- [x] **FND.DOC.2** — Document Global Agents data model and API changes in docs/api.md. *(completed 2026-04-02 03:40 PDT)*

---

## Sprint 24: Core UX (partial) — archived 2026-04-02

### Agent Chat Phase 1

- [x] **ACH.1** — Schema migration: add persona_id, work_item_id, sdk_session_id to chat_sessions + backfill. *(completed 2026-04-02 04:10 PDT)*
- [x] **ACH.2** — Backend: persist personaId/workItemId, join persona data on session list/messages. *(completed 2026-04-02 04:25 PDT)*
- [x] **ACH.3** — Backend: multi-persona chat — load persona from session, gate Pico-specific behavior. *(completed 2026-04-02 04:40 PDT)*
- [x] **ACH.4** — Frontend: persona selector grid for new chat sessions. *(completed 2026-04-02 05:00 PDT)*
- [x] **ACH.5** — Frontend: session sidebar with persona avatars, date grouping, filter, last message preview. *(completed 2026-04-02 05:35 PDT)*
- [x] **ACH.6** — Frontend: chat header bar with persona info, project badge, editable title, context menu. *(completed 2026-04-02 05:55 PDT)*
- [x] **ACH.7** — Frontend: session management — right-click context menu with rename/delete + confirmation dialog. *(completed 2026-04-02 06:15 PDT)*

### Persona Prompts Phase 1

- [x] **PPR.1** — Backend: resolveVariables() + buildVariableContext() in prompt-variables.ts. *(completed 2026-04-02 06:30 PDT)*
- [x] **PPR.2** — Backend: integrate resolveVariables() into buildSystemPrompt() and Pico chat path. *(completed 2026-04-02 06:45 PDT)*
- [x] **PPR.3** — Frontend: autocomplete popup on {{ in system prompt editor (13 variables, 4 groups). *(completed 2026-04-02 07:05 PDT)*
- [x] **PPR.4** — Frontend: collapsible variables reference panel + resolved preview with highlighting. *(completed 2026-04-02 07:25 PDT)*

### Notifications UX Phase 1

- [x] **NTF.1** — Shared types: NotificationEventType, Notification, NotificationEvent in ws-events.ts. *(completed 2026-04-02 07:40 PDT)*
- [x] **NTF.2** — Backend: broadcastNotification() helper + 4 emission points (completed/errored/proposal/budget). *(completed 2026-04-02 08:00 PDT)*
- [x] **NTF.3** — Frontend: Zustand notification store with localStorage persist, 60s batching, quiet hours. *(completed 2026-04-02 08:15 PDT)*
- [x] **NTF.4** — Frontend: NotificationBell in sidebar footer with unread count badge. *(completed 2026-04-02 08:30 PDT)*
- [x] **NTF.5** — Frontend: NotificationDrawer — 320px sliding panel with date grouping, empty state. *(completed 2026-04-02 08:50 PDT)*
- [x] **NTF.6** — Frontend: NotificationCard with 5 type-specific icons + action buttons. *(completed 2026-04-02 09:05 PDT)*
- [x] **NTF.7** — Frontend: enhanced toasts — critical non-dismiss, overflow +N link, dual dispatch. *(completed 2026-04-02 09:20 PDT)*
- [x] **NTF.8** — Frontend: Notifications tab in Settings — event toggles, quiet hours, scope. *(completed 2026-04-02 09:35 PDT)*

### Testing & Documentation

- [x] **CUX.TEST.1** — E2E test plan for Agent Chat Phase 1 — 7 test cases. *(completed 2026-04-02 09:50 PDT)*
- [x] **CUX.TEST.2** — Execute Agent Chat e2e tests — 7/7 PASS, 10 screenshots. *(completed 2026-04-02 10:15 PDT)*
- [x] **CUX.TEST.3** — E2E test plan for Notifications UX — 7 test cases. *(completed 2026-04-02 10:30 PDT)*
- [x] **CUX.TEST.4** — Execute Notifications UX e2e tests — 7/7 PASS, 6 screenshots. *(completed 2026-04-02 10:50 PDT)*
- [x] **CUX.DOC.1** — Document Agent Chat multi-persona API + template variables in docs/api.md. *(completed 2026-04-02 11:05 PDT)*
- [x] **CUX.DOC.2** — Document Notifications system — WS event, types, preferences in docs/api.md. *(completed 2026-04-02 11:20 PDT)*
- [x] **CUX.TEST.5** — Regression checkpoint post-Sprint 24 — 36 suites, 0 regressions. *(completed 2026-04-02 11:45 PDT)*

---

## Sprint 25: Workflow Engine (partial) — archived 2026-04-02

### Schema & Data Model

- [x] **CWF.1** — Schema: workflows, workflow_states, workflow_transitions tables + migration. *(completed 2026-04-02 12:20 PDT)*
- [x] **CWF.2** — Add workflowId to projects/work_items/executions + workflowStateName on executions. *(completed 2026-04-02 12:40 PDT)*
- [x] **CWF.3** — Seed default workflow from hardcoded WORKFLOW constant + backfill. *(completed 2026-04-02 12:55 PDT)*

### Backend Runtime

- [x] **CWF.4** — workflow-runtime.ts: 6 dynamic query functions with hardcoded fallback. *(completed 2026-04-02 13:10 PDT)*
- [x] **CWF.5** — work-items.ts: dynamic initial state + async transition validation. *(completed 2026-04-02 13:25 PDT)*
- [x] **CWF.6** — dispatch.ts: resolvePersonaForState. execution-manager.ts: track workflow context. *(completed 2026-04-02 13:40 PDT)*
- [x] **CWF.7** — mcp-server.ts: 3 tools updated (route/create/block) for dynamic workflow. *(completed 2026-04-02 13:55 PDT)*
- [x] **CWF.8** — router.ts: dynamic prompt from buildDynamicRouterPrompt(). *(completed 2026-04-02 14:10 PDT)*

### API Routes

- [x] **CWF.9** — Read-only endpoints: list, get (with states+transitions), states, transitions. *(completed 2026-04-02 14:25 PDT)*
- [x] **CWF.10** — Builder CRUD: create, update, publish, delete (409 guard), clone, validate. *(completed 2026-04-02 14:40 PDT)*

### Frontend: Dynamic Views

- [x] **CWF.11** — Frontend: use-workflows.ts hooks + API client functions. *(completed 2026-04-02 15:00 PDT)*
- [x] **CWF.12** — Frontend: flow-view.tsx dynamic workflow states. *(completed 2026-04-02 15:20 PDT)*
- [x] **CWF.13** — Frontend: list-view, filter-bar, detail-panel dynamic workflow. *(completed 2026-04-02 15:40 PDT)*
- [x] **CWF.14** — Frontend: workflow-config-section dynamic states + WorkflowSelector. *(completed 2026-04-02 15:55 PDT)*

### Frontend: Workflow Builder

- [x] **CWF.15** — Frontend: state-card.tsx + transition-row.tsx. *(completed 2026-04-02 16:15 PDT)*
- [x] **CWF.16** — Frontend: workflow-preview.tsx SVG graph. *(completed 2026-04-02 16:30 PDT)*
- [x] **CWF.17** — Frontend: workflow-builder.tsx + validation-panel.tsx + create-workflow-dialog.tsx. *(completed 2026-04-02 16:50 PDT)*
- [x] **CWF.18** — Frontend: /workflows route, sidebar nav, CRUD API wiring. *(completed 2026-04-02 17:20 PDT)*

### Testing

- [x] **CWF.TEST.1** — E2e test plan for Custom Workflows (36 steps, 10 parts). *(completed 2026-04-02 17:35 PDT)*
- [x] **CWF.TEST.2** — Execute Custom Workflows e2e tests (33/36 pass, 1 bug filed). *(completed 2026-04-02 18:00 PDT)*

### Bugs & Remaining

- [x] **FX.CWF.1** — Fix PATCH save with new states/transitions (stateIdMap remapping). *(completed 2026-04-02 18:25 PDT)*
- [x] **CWF.DOC.1** — Document Custom Workflows API (10 endpoints, schemas, migration). *(completed 2026-04-02 18:40 PDT)*
- [x] **CWF.TEST.3** — Regression checkpoint: 37 suites, 0 regressions. *(completed 2026-04-02 19:05 PDT)*

---

## Sprint 26: Intelligence & Discovery — archived 2026-04-02

### Agent Collaboration Phase 1

- [x] **COL.1** — HandoffNote type + handoffNotes column + migration 0014. *(completed 2026-04-02 19:35 PDT)*
- [x] **COL.2** — buildHandoffNote() + persist on execution completion. *(completed 2026-04-02 19:50 PDT)*
- [x] **COL.3** — Inject handoff context via buildAccumulatedContext → SpawnOptions → buildSystemPrompt. *(completed 2026-04-02 20:10 PDT)*
- [x] **COL.4** — Dependency enforcement in dispatch (depends_on edges + terminal state check). *(completed 2026-04-02 20:25 PDT)*
- [x] **COL.5** — Context windowing: buildAccumulatedContext with ~2000 token budget. *(completed 2026-04-02 20:40 PDT)*
- [x] **COL.6** — Frontend handoff notes display in execution timeline. *(completed 2026-04-02 20:55 PDT)*

### Search Phase 1

- [x] **SRC.1** — FTS5 virtual tables + bridging tables (startup setup). *(completed 2026-04-02 21:10 PDT)*
- [x] **SRC.2** — FTS5 sync triggers (12 triggers) + backfill script. *(completed 2026-04-02 21:25 PDT)*
- [x] **SRC.3** — Unified search API: GET /api/search with BM25 ranking. *(completed 2026-04-02 21:40 PDT)*
- [x] **SRC.4** — Server-backed Command Palette with debounced FTS5 search. *(completed 2026-04-02 21:55 PDT)*
