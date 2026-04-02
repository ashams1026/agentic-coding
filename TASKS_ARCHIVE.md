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

**Sprints 16-22 (consolidated):** 201 tasks. AI E2E testing 97.3% pass (Sprint 16). Agent pipeline/mock/Pico/SDK (Sprint 17-18). V2 sessions/file checkpointing/structured output (Sprint 19). Streaming/sandbox/MCP/model switching (Sprint 20). Docs refresh (Sprint 21). Pluggable executor/UI audits/bug fixes (Sprint 22). Research proposals (20), UX polish (20), backlog spikes (6).

**Sprint 23 (28 tasks):** Error Recovery, Work Item Lifecycle (soft delete/archive/bulk ops), Global Agents P1, 3 test plans + executions, 34 suites 0 regressions.

**Sprint 24 (26 tasks):** Agent Chat P1, Persona Prompts P1, Notifications UX P1, 4 e2e suites 14/14 pass, 36 suites 0 regressions.

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

**Bug Fixes (Sprints 24-27, FX.SEC.1-3 + FX.DEAD.1-3 + FX.WHK.1 + FX.NTF.1-2 + FX.WF.1-3 + FX.CHAT.1 + FX.NAV.1):** 13 tasks. Path traversal fix, FTS5 crash fix, XSS sanitization, webhook prompt wiring, dead notification type, proposal actions, HMAC raw bytes, toast overflow, batch double-count, workflow publish race, DB transactions, input validation, project name in chat, command palette nav.

**Sprint 28 (SCH.1-4, TPL.1-2, FX.WF.4, FX.DOC.1, FX.HIST.1, FX.TYPE.1-2, FX.PERF.1):** 12 tasks. Schedules (cron scheduler, CRUD API, Settings UI). Templates (table + seed, CRUD + apply). Bug fixes (sortOrder, workflow docs, history alignment, type casts, deduplicate import, N+1 batch).

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

**Remaining Sprint 29 (DES.13, DES.19, FX.UXO24, DX.1):** 4 tasks. DES.13 N/A (target file deleted). Empty states audit across 14 files (DES.19). AgentId ps-prefix tracked (FX.UXO24). Split dev scripts: pnpm dev:frontend with mock API, pnpm dev:backend (DX.1).

---

## Sprint 30: Project-Scoped Navigation — archived 2026-04-02

**Phase 1 (NAV.1-3):** 3 tasks. `useProjectFromUrl()` hook reading projectId from URL params (NAV.1). Router refactored with project-scoped routes under `/p/:projectId`, legacy redirects, App Settings at `/app-settings` (NAV.2). ProjectLayout wrapper with loading/404/Outlet (NAV.3).

**Phase 2 (NAV.4-7):** 4 tasks. Full sidebar redesign as collapsible project tree (NAV.4). localStorage persistence + expand/collapse all (NAV.5). Deleted orphaned scope-indicator.tsx (NAV.6). New Project button + dialog with working directory + backend mkdir (NAV.7).

**Phase 3 (NAV.8-15):** 8 tasks. Migrated all pages from `useSelectedProject()` to `useProjectFromUrl()`: Work Items (NAV.8), Automations + navigate() updates (NAV.9), Agents page title rename (NAV.10), Agent Monitor 6 files + Links (NAV.11), Activity Feed + EventRow route (NAV.12), Analytics (NAV.13), Chat page from UIStore (NAV.14), Pico chat panel with pj-global fallback (NAV.15).

**Phase 4 (NAV.16-18):** 3 tasks. AppSettingsPage at /app-settings (NAV.16). ProjectSettingsPage at /p/:projectId/settings with Security, Costs, Notifications, Integrations (NAV.17). NAV.18 N/A (already done in UXO.26).

**Phase 5 (NAV.19-20):** 2 tasks. Dashboard cross-project overview with project cards (NAV.19). Global project renamed "All Projects" → "Global Workspace" (NAV.20).

**Phase 6 (NAV.21-25):** 5 tasks. Command palette with project-scoped commands (NAV.21). Status bar shows project name (NAV.22). Scope badges removed (NAV.23). NAV.24 N/A (redirects/404 already done). Dead code deleted: 5 files removed, 5 migrated to useProjectFromUrl, selectedProjectId removed from UI store (NAV.25).

**Testing/Docs (NAV.TEST.1, NAV.DOC.1):** 35-case e2e test plan. 5 doc files updated for navigation rewrite.

---

## Sprint 28: Scheduling, Templates & Notification Channels — archived 2026-04-02

**Templates (TPL.3):** Template picker dialog with 5 templates (Blank, Bug, Feature, Task, Research) pre-filling work item fields.

**Notification Channels (NEC.1-2):** Backend webhook-channel.ts mapping 3 notification event types to event bus for webhook delivery. Frontend toggle in Notifications settings.

**Testing (S28.TEST.1):** 17-case e2e test plan for scheduling, templates, notification channels.

**Documentation (S28.DOC.1):** Schedule CRUD (5 endpoints), templates (5 endpoints + built-in list), notification webhook channel (3 event types + flow). *(completed 2026-04-02 15:16 PDT)*

---

## Sprint 31: Agent Chat P2 — Rich Messages — archived 2026-04-02

- [x] **RICH.1** — ANSI color parser utility (`lib/ansi-parser.tsx`). parseAnsi() + stripAnsi(), standard/bright/256 colors, bold/dim/italic, Tailwind classes. *(completed 2026-04-02 15:25 PDT)*
- [x] **RICH.2** — Diff parser utility (`lib/diff-parser.ts`). Myers' O(ND) algorithm, computeDiff() + formatDiffText(), DiffLine types. *(completed 2026-04-02 15:22 PDT)*
- [x] **RICH.3** — Enhanced ThinkingBlock (`features/chat/thinking-block.tsx`). Purple border, expand/collapse, markdown, 2000-char truncation. *(completed 2026-04-02 15:23 PDT)*
- [x] **RICH.4** — Enhanced ToolCallCard (`features/chat/tool-call-card.tsx`). Tool icons, status badges, collapsible I/O, expand defaults. *(completed 2026-04-02 15:23 PDT)*
- [x] **RICH.5** — TerminalBlock (`features/chat/terminal-block.tsx`). Dark bg, ANSI colors, copy, exit code, 500-line truncation. *(completed 2026-04-02 15:35 PDT)*
- [x] **RICH.6** — DiffBlock (`features/chat/diff-block.tsx`). Red/green line highlighting, line numbers, unified diff copy. *(completed 2026-04-02 15:35 PDT)*
- [x] **RICH.7** — FileTreeSummary (`features/chat/file-tree-summary.tsx`). Directory tree, M/A indicators, line counts, click-to-scroll. *(completed 2026-04-02 15:35 PDT)*
- [x] **RICH.8** — ContentBlockRenderer integration. Dispatch to enhanced components, FileTreeSummary at message top, dead code removed. *(completed 2026-04-02 15:45 PDT)*
- [x] **RICH.TEST.1** — 29-case e2e test plan covering all 5 rich message components + integration. *(completed 2026-04-02 15:35 PDT)*
- [x] **RICH.DOC.1** — Frontend docs updated with component hierarchy, dispatch logic, utilities. *(completed 2026-04-02 15:45 PDT)*
