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

**Research Proposals (20 tasks, archived 2026-04-01 to 2026-04-02):** Chat UX/data model/rich messages, lifecycle UX/data model, notifications UX/integrations, collaboration context/coordination, scheduling UX/infra, rollback, templates, analytics, webhooks, frontend/backend swappability. All in `docs/proposals/`.

**Sprint 23 (FND.ERR.1-7, FND.WIL.1-8, FND.GA.1-10, FND.TEST.1-6, FND.DOC.1-2):** 28 tasks. Error Recovery (PRAGMAs, WS backoff, error boundaries, structured errors, orphan recovery, backup). Work Item Lifecycle (soft delete, archive/restore, bulk ops, context menus, "Recently deleted"). Global Agents P1 (nullable projectId, AgentScope type, "All Projects" selector, dashboard/monitor scope-awareness, New Run modal, standalone execution endpoint, Pico scope toggle). Testing (3 test plans, 3 executions, regression 34 suites 0 regressions). 2 doc updates.

---

**Sprint 24 (ACH.1-7, PPR.1-4, NTF.1-8, CUX.TEST.1-5, CUX.DOC.1-2):** 26 tasks. Agent Chat P1 (schema migration + multi-persona sessions + selector grid + sidebar + header + context menu). Persona Prompts P1 (resolveVariables + buildSystemPrompt + autocomplete + preview). Notifications UX P1 (shared types + broadcastNotification + Zustand store + bell + drawer + card + toasts + Settings tab). Testing: 4 e2e suites (14/14 pass), 2 doc updates, regression 36 suites 0 regressions.

---

## Sprint 25: Workflow Engine — archived 2026-04-02

**Schema (CWF.1-3):** 3 tables + workflowId columns + seed. **Backend (CWF.4-8):** 6 runtime functions, 5 backend files updated. **API (CWF.9-10):** 10 endpoints (4 read + 6 CRUD).
**Frontend Views (CWF.11-14):** Dynamic workflow hooks + 4 views updated. **Builder (CWF.15-18):** state-card, preview SVG, builder layout, /workflows route. **Testing (CWF.TEST.1-3, FX.CWF.1, CWF.DOC.1):** 36-step test plan, 33/36 pass, save bug fix, API docs, regression 37 suites 0 regressions.

---

## Sprint 26: Intelligence & Discovery — archived 2026-04-02

**Agent Collaboration P1 (COL.1-6):** HandoffNote schema + persistence + context injection + dependency enforcement + windowing + frontend display. **Search P1 (SRC.1-5):** FTS5 tables + triggers + search API + Command Palette + filter bar. **Analytics P1 (ANL.1-7):** Token tracking schema + persistence + 4 aggregate endpoints + analytics page (Overview + Token Usage tabs). **Testing (S26.TEST.1-7, S26.DOC.1):** 3 test plans, 3 executions, API docs, regression (40 suites, 0 regressions).

---

## Sprint 27: Integration & Maintenance — archived 2026-04-03

**Outbound Webhooks P1 (OWH.1-6):** TypedEventBus, webhook schema (migration 0016), HMAC delivery worker with retry/auto-disable, CRUD + delivery log, Settings UI, bridge. **Inbound Webhooks P1 (IWH.1-3):** Triggers schema (migration 0017), generic receiver with HMAC + template, UI. **Data Management P1 (DM.1-5):** SQLite backup API + retention, pre-migration hook, backup/restore/truncate endpoints, storage stats + cascade fix, data management UI. **Testing (S27.TEST.1-5, S27.DOC.1):** 2 test plans, 2 executions, API docs, regression (44 suites, 0 regressions).

---

## Bug Fixes: Post-Sprint Review (Sprints 24-27) — archived 2026-04-03

### Security & Data Loss

- [x] **FX.SEC.1** — Fix path traversal in backup restore. *(completed 2026-04-03 09:30 PDT)*
- [x] **FX.SEC.2** — Fix FTS5 MATCH crash on special characters. *(completed 2026-04-03 09:45 PDT)*
- [x] **FX.SEC.3** — Sanitize FTS snippets before rendering. *(completed 2026-04-03 10:00 PDT)*

### Dead Code & Unimplemented Stubs

- [x] **FX.DEAD.1** — Wire prompt template into inbound webhook execution. *(completed 2026-04-03 10:30 PDT)*
- [x] **FX.DEAD.2** — Implement or remove `execution_stuck` notification type. Backend never emits `execution_stuck` — the type is defined in `packages/shared/src/ws-events.ts`, UI handles it in notification cards, and Settings has a toggle for it, but no backend code ever fires it. Either implement a periodic check for stalled executions (e.g., no progress events for >10min) or remove the type, UI, and settings toggle entirely. *(completed 2026-04-03 10:50 PDT)*
- [x] **FX.DEAD.3** — Replace stub navigation on proposal notification actions. `packages/frontend/src/features/notifications/notification-card.tsx:107-108` — Approve/Reject buttons just navigate to `/items` without passing proposal ID. Wire them to actually call `PATCH /api/proposals/:id` with the approve/reject action, then mark notification as read. *(completed 2026-04-03 11:10 PDT)*

### HMAC & Webhook Integrity

- [x] **FX.WHK.1** — Fix HMAC verification to use raw request bytes. `packages/backend/src/routes/webhook-triggers.ts:70` uses `JSON.stringify(request.body)` for HMAC verification instead of raw request body bytes. Re-serialized JSON may differ from the original payload (key ordering, whitespace), causing all HMAC checks to fail. Use Fastify's `rawBody` or `request.rawBody` instead. *(completed 2026-04-03 11:25 PDT)*

### Logic Bugs

- [x] **FX.NTF.1** — Fix toast overflow count decrement. `packages/frontend/src/stores/toast-store.ts:55` — the `overflowCount` decrement condition is inverted. When a visible toast is auto-dismissed, the overflow count doesn't decrement correctly, leaving stale "+N more" badges. *(completed 2026-04-03 11:35 PDT)*
- [x] **FX.NTF.2** — Fix notification batching double-count. `packages/frontend/src/stores/notification-store.ts:117-128` — first `agent_completed` notification is added immediately, then the batch summary also counts it, so users see both the individual notification AND a summary that includes it. Either suppress the first individual notification or exclude it from the batch count. *(completed 2026-04-03 11:45 PDT)*
- [x] **FX.WF.1** — Fix race condition in workflow publish. `packages/frontend/src/pages/workflows.tsx:51-56` — save and publish fire concurrently. Publish must wait for save to complete. Make them sequential (await save, then publish). *(completed 2026-04-03 11:55 PDT)*
- [x] **FX.WF.2** — Wrap workflow CRUD mutations in DB transactions. `packages/backend/src/routes/workflows.ts:209-244` — PATCH and DELETE handlers do delete-then-insert for states/transitions without a transaction. Server crash between delete and insert loses data. Wrap in `db.transaction()`. *(completed 2026-04-03 12:05 PDT)*
- [x] **FX.WF.3** — Add input validation to workflow CRUD. `packages/backend/src/routes/workflows.ts` POST/PATCH handlers accept empty names, invalid state types, garbage data. Add validation: require non-empty name, valid state type enum, at least one state, valid transition references. *(completed 2026-04-03 12:15 PDT)*

### Missing Data & Stale UI

- [x] **FX.CHAT.1** — Show project name instead of raw ID in chat header. `packages/frontend/src/pages/chat.tsx:374-379` — the project badge shows the raw `projectId` string (e.g., `pj-x7k2m`) instead of the project's display name. Fetch and display the project name. *(completed 2026-04-03 12:40 PDT)*
- [x] **FX.NAV.1** — Update command palette navigation items. `packages/frontend/src/features/command-palette/command-palette.tsx:39-46` — NAV_ITEMS is stale, missing Analytics, Chat, and Workflows pages. Add all current sidebar pages. *(completed 2026-04-03 12:55 PDT)*

---

## Sprint 28: Scheduling, Templates & Notification Channels — archived 2026-04-03

### Scheduling

- [x] **SCH.1** — Schedules table + migration. *(completed 2026-04-03 07:40 PDT)*
- [x] **SCH.2** — Cron scheduler with polling + catch-up. *(completed 2026-04-03 08:00 PDT)*
- [x] **SCH.3** — Schedules CRUD API + startup integration. *(completed 2026-04-03 08:20 PDT)*
- [x] **SCH.4** — Frontend Schedules UI in Settings. *(completed 2026-04-03 08:45 PDT)*

### Templates Phase 1

- [x] **TPL.1** — Templates table + seed 3 built-in templates + migration. *(completed 2026-04-03 09:00 PDT)*
- [x] **TPL.2** — Templates CRUD API + apply endpoint. *(completed 2026-04-03 09:15 PDT)*

### Bug Fixes Continued (Sprints 24-27)

- [x] **FX.WF.4** — Include transition sortOrder in workflow save payload. *(completed 2026-04-03 13:20 PDT)*
- [x] **FX.DOC.1** — Update docs/workflow.md to reflect custom workflows. *(completed 2026-04-03 13:40 PDT)*
- [x] **FX.HIST.1** — Fix Agent Monitor history table row width misalignment (Collapsible → conditional rendering). *(completed 2026-04-03 14:00 PDT)*
- [x] **FX.TYPE.1** — Fix unsafe double type casts in chat routes. *(completed 2026-04-03 14:15 PDT)*
- [x] **FX.TYPE.2** — Import HandoffNote from shared instead of duplicating. *(completed 2026-04-03 14:30 PDT)*
- [x] **FX.PERF.1** — Fix N+1 query in dependency check (batched with inArray). *(completed 2026-04-03 14:40 PDT)*

---

## Sprint 29: UX Overhaul — archived 2026-04-02

**Phase 1 (UXO.1-4):** 4 tasks. Global project model — isGlobal flag, pj-global sentinel, nullable→notNull migration, scope breadcrumb indicator.

**Phase 2 (UXO.5-8):** 4 tasks. Persona→Agent rename across shared/backend/frontend (54 files), agent scope (global/project) with projectId FK.

**Phase 3 (UXO.9-13):** 5 tasks. Chat fixes — session load on mount, remove click-outside-close, dynamic empty state, agent-grouped sessions, improved header (avatar, project name, editable title, context menu).

**Phase 4 (UXO.14-21, UXO.18-20):** 8 tasks. autoRouting + agentOverrides schema migration, per-workflow router prompt, label-based agent resolution, Backlog/Done immutable states, flow view removal, Workflows→Automations rename, Automations page redesign (workflow + schedule cards), agent overrides in workflow builder.

**Phase 5 (UXO.24-25):** 2 tasks. Queue endpoint + Queue tab in Agent Monitor.

**Phase 6 (UXO.23):** 1 task. Global work items — sidebar dimming removed, seeded 3-state workflow.

**Phase 8 (UXO.30):** 1 task. Recently Deleted scope filter.

**Phase 9 (UXO.31):** 1 task. Status bar "Automations active" indicator replacing old toggle.

**Testing (UXO.TEST.1, UXO.DOC.1):** 2 tasks. E2e test plan (37 cases), full docs update (persona→agent, global model, autoRouting, agentOverrides).

**Bug Fixes (FX.UXO1-21):** 10 tasks. Router paths /automations (FX.UXO1), dead board view removed (FX.UXO2/21), auto-routing toggle fixed to use workflow (FX.UXO3), built-in state guards in builder (FX.UXO4), global project workflow backfill fix (FX.UXO5), Automations page strings (FX.UXO10), agent scope UI in detail panel (FX.UXO15), agent route FK validation (FX.UXO18/19).

**Bug Fixes Continued (FX.UXO13, FX.UXO20, FX.WI1):** 3 tasks. Chat empty state for no project (FX.UXO13), dead toolCallMap removed (FX.UXO20), work item edit revert bug fixed — removed onSettled, added onSuccess with direct cache set, guarded WS invalidation with isMutating (FX.WI1).

**Phase 4 Completion (UXO.22, UXO.26, UXO.27):** 3 tasks. Per-workflow auto-routing toggle on overview + builder (UXO.22), workflow settings moved into builder with AgentAssignmentsSection (UXO.26), schedules moved from Settings to Automations page with edit/delete/run-now (UXO.27).

**Design Polish (DES.1, DES.3, DES.7, DES.14, DES.17):** 5 tasks. Dashboard onboarding checklist (DES.1), chat auto-generate session names — already implemented (DES.3), workflow card min-height + Configure States CTA (DES.7), Per-Agent Limits table collapsed when empty (DES.14), activity feed filter bar — already implemented (DES.17).

**Bug Fixes Continued (FX.UXO6-24, DES.5):** 13 tasks. All Projects scope fix in recently-deleted (FX.UXO6), queue endpoint projectId filter (FX.UXO7), chat panel agent grouping (FX.UXO8), Globe icon pj-global check (FX.UXO9), isPico name-only match (FX.UXO11), stale closure in deleteSession (FX.UXO12), chat header DropdownMenu a11y (FX.UXO14), agent create scope/projectId (FX.UXO16), dead agent-editor.tsx deleted (FX.UXO17), dead AgentScope type removed (FX.UXO22), BUILT_IN_IDS wrong ID fixed (FX.UXO23), ps- prefix tech debt tracked (FX.UXO24). Design: "stories"→"work items" in agent monitor (DES.5).
