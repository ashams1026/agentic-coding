# AgentOps — Work Log Archive

> Summarized entries from `WORKLOG.md`. Grouped by sprint/phase.

---

## Sprints 1-15 (consolidated) — 2026-03-28 to 2026-03-30

**Sprints 1-4:** Monorepo scaffold, 9 UI screens, mock data, Fastify backend. **Sprints 5-7:** Drizzle schema (9 tables), 10 CRUD routes, WebSocket, API client, WorkItem model. **Sprint 8:** MCP server (7 tools), ClaudeExecutor, dispatch/router, rate limiter, cost tracking. **Sprint 9:** 145 tests (Vitest). **Sprint 10:** Design system, filtering, skeletons. **Sprint 11:** API wiring, WS invalidation, pipeline fixes. **Sprint 12:** CLI + pm2 + logging. **Sprint 13:** API keys, settings, data export. **Sprint 14:** 10 doc files. **Sprint 15:** Project scoping, empty states, auto-seed.

---

**Sprint 16 (consolidated):** 42 tasks. 17 test plans + visual inspection protocol, executed all suites (263 steps, 97.3% PASS). Filed FX.CMD1, FX.EDIT1.

**Sprint 17 (consolidated):** 48 tasks. Command sandbox, mock removal, persona overhauls, skills system, sidebar redo, activity feed enrichment, agent monitor fixes.

**Sprint 18 (consolidated):** Pico assistant — backend (persona, chat API, SSE streaming, knowledge skill, session management) + frontend (bubble, panel, messages, streaming hook, personality).

---

## Sprint 17 (final SDK) + Sprint 19 (V2 Sessions) — 2026-03-31

**SDK work (FX.SDK1, FX.SDK4, SDK.V2.1-2):** Persistent SDK session manager with lazy singleton, exponential backoff retry. SDK capabilities discovery endpoint via `withDiscoveryQuery()`. Replaced filesystem skill browser with SDK capabilities picker. Key finding: `initializationResult()` does NOT return built-in tool names.

---

## Sprint 19 (consolidated) — 2026-03-31 to 2026-04-01

**File Checkpointing (SDK.FC.1-7):** Checkpoint in executor, rewind API + dry-run, RewindButton UI, MCP rewind tool, e2e tests (7/17 PASS). **Hooks (SDK.HK.1-8):** PreToolUse sandbox, PostToolUse audit, SessionStart/End lifecycle, FileChanged events + UI panel, e2e test plan + execution, docs. **Structured Output (SDK.SO.1-5):** Router JSON schema, RouterDecisionCard UI, column + migration, e2e test (5/13 PASS). **Subagents (SDK.SA.1-6):** AgentDefinition mapping, hooks + WS events, parentExecutionId, nested UI, e2e test (1/12 PASS). **Effort (SDK.ET.1-5):** PersonaSettings effort/thinking, per-persona defaults, editor dropdowns, e2e test (11/13 PASS). **Bug Fixes:** Pico CORS (FX.PICO4), scroll overflow (FX.PICO5), stale project (FX.PROJ1), Pico e2e (30/38 PASS), Apache 2.0 license, subagents in persona config (FX.SDK6).

---

## Sprint 20 (Streaming + Sandbox + MCP + UX) + Sprint 21 (Docs) + Backlog (Spikes + PLUG) — 2026-04-01

**Sprint 20 (SDK.ST/SB/MCP/UX):** Streaming (partial messages, progress summaries, rate limit events, context usage polling), sandbox (SDK native + canUseTool + per-project config UI), dynamic MCP management (toggle/reconnect/status API + status dots UI), Pico prompt suggestions (pill buttons), model switching (AlertDialog confirmation), in-process MCP server. Regression sweep REG.1+REG.2 both PASS.

**Sprint 21 (DOC.1-DOC.9):** Full documentation refresh — all 9 doc files updated. getting-started (mock removal, demo seed), architecture (tool count, audit, WS events), data-model (11 tables, new fields), workflow (Router safety, play/pause), personas (fixed MCP tools, Pico), api (12 new endpoints), mcp-tools (source files), deployment (dev scripts, sandbox), frontend (streaming, mock removal, Pico).

**Backlog Spikes (SDK.FUT.1-6):** 5 evaluation spikes: browser SDK (deferred — needs relay), bridge API (deferred — SSH/Docker), plugin system (ready — local plugins work), HTTP hooks (ready — zero code), worktree isolation (deferred — needs parallel execution). Doc updates across 4 files referencing all spikes.

**Backlog PLUG (PLUG.1-5):** ExecutionManager class refactoring (constructor injection, 6 call sites), composition root `setup.ts` (sole file importing concrete executors), `@agentops/core` package (types + sandbox), repository interfaces (6 interfaces + Drizzle implementations), executor registry (register/get/has/list + REST API), publish-ready package.json (dist exports, files whitelist).

---

## Sprint 22 + Research Proposals (consolidated) — 2026-04-01 to 2026-04-02

**Sprint 22 (35 tasks):** Visual UX audit across all screens (dashboard, work items, detail panel, agent monitor, activity feed, settings, command palette, responsive, dark mode). 14 audits, 10 bug fixes (SDK paths, keyboard a11y, label mismatches, link targets), breadcrumb UX, test restructuring, 2 SDK research spikes.

**Research Proposals (25 docs):** Prompt pipeline + template variables. Workflow edge cases + builder + runtime. Chat UX + rich messages + data model. Lifecycle UX + data model. Notifications UX + integrations. Collaboration context + coordination. Scheduling UX + infra. Swappability arch + hosted + API. Search. Recovery agents + system. Data backup + growth. Token tracking + dashboard. Pico UX polish (6 tasks) + Woof rebrand.

---

### Sprint 23 Foundations batches 1-3 (consolidated) — 2026-04-01 20:24–23:25 PDT

**Error Recovery (FND.ERR.1-7):** PRAGMAs, WS backoff, error boundaries, status indicator, structured errors, orphan recovery, backup rotation. **Work Item Lifecycle (FND.WIL.1-8):** archived_at/deleted_at, soft delete + 409 guard, archive/unarchive/restore API, bulk ops, "Show archived" toggle, context menus, bulk action bar, "Recently deleted" in Settings.

### Sprint 23 Foundations batch 3 — 2026-04-01 22:32–23:25 PDT

**Global Agents early (FND.GA.1-4, all approved):** Schema migration — chatSessions.projectId nullable, executions.projectId added, global_memories table (migration 0009, chat.ts null-safety fixes). AgentScope discriminated union type + nullable workItemId/projectId on shared entities (4 downstream TS fixes). "All Projects" sidebar selector with "__all__" sentinel in zustand store, auto-select guards in sidebar + use-selected-project. Dashboard scope-awareness — "All Projects" heading with Global badge, Projects Overview table, dimmed Work Items link with tooltip.

---

### Sprint 23 Foundations batch 4 — Global Agents late + Testing (2026-04-01 23:35 – 2026-04-02 02:50 PDT)

**Global Agents late (FND.GA.5-10, all approved):** Agent Monitor scope badges (violet "Global" / project name) + scope filter dropdown. "New Run" modal (persona picker, scope selector, prompt, budget, POST /api/executions/run). Backend standalone execution endpoint (nullable workItemId, migration 0010, 8 downstream TS fixes). Pico scope toggle + persona picker (scopeOverride/selectedPersonaId in Zustand, compact dropdowns). Backend nullable projectId + persona override in chat sessions (201 for empty body, optional personaId). E2E test plan for Global Agents (7 test cases).

**Sprint 23 Testing (FND.TEST.1-6, all approved):** E2E test plans for Error Recovery (8 cases) and Work Item Lifecycle (10 cases). Executed Error Recovery tests — 8/8 PASS. Executed Work Item Lifecycle tests — 9/10 PASS, 1 SKIP. Executed Global Agents tests — 7/7 PASS. Full regression checkpoint — 34 suites, 24 UI-verified, 0 regressions.

---

### Sprint 23 completion + Sprint 24 early — 2026-04-02 03:10–05:35 PDT

**Sprint 23 docs (FND.DOC.1-2, both approved):** Work Item Lifecycle API documentation (6 new endpoints, query params, 409 guard, cascade rules, schema additions). Global Agents data model documentation (AgentScope type, nullable projectId, global_memories table, scope-awareness rules, standalone execution endpoint).

**Sprint 24 decomposition:** 26 tasks across Agent Chat (ACH.1-7), Persona Prompts (PPR.1-4), Notifications (NTF.1-8), Testing/Docs (CUX.TEST/DOC.1-5).

**Agent Chat Phase 1 (ACH.1-7, all approved):** Schema migration (persona_id, work_item_id, sdk_session_id + backfill). Session creation persists personaId/workItemId, list joins persona name+avatar. Multi-persona message endpoint (isPico gating, persona-specific agent config). PersonaSelector grid modal (avatar cards, Pico default). Session sidebar (persona avatars, date grouping, persona filter, last message preview via batched SQLite). Chat header bar (persona info, project badge, editable title, context menu). Session management (right-click rename/delete with confirmation). ACH.5 rejected once for missing last message preview, reworked and approved.

**Persona Prompts Phase 1 (PPR.1-4, all approved):** resolveVariables() + buildVariableContext() with 13 built-in variables in 4 namespaces (project/persona/date/workItem). Integrated into both buildSystemPrompt() executor path and Pico chat path. Frontend: autocomplete popup on {{ in SystemPromptEditor (grouped dropdown, type-ahead, keyboard nav). Collapsible variables reference panel with live current values + resolved preview with green/amber highlighting.

**Notifications UX Phase 1 (NTF.1-8, all approved):** Shared types (NotificationEventType, Notification, NotificationEvent). Backend emission via broadcastNotification() at 4 points (completed/errored/proposal/budget). Zustand notification store with localStorage persist, 60s batching, quiet hours. NotificationBell in sidebar footer with red unread badge. NotificationDrawer (320px sliding panel, date grouping, empty state). NotificationCard with 5 type-specific icons + action buttons. Enhanced toasts (critical non-dismiss, overflow link, dual dispatch). Settings Notifications tab (event toggles, quiet hours, scope).

**Testing & Docs (CUX.TEST.1-5, CUX.DOC.1-2, all approved):** Agent Chat e2e test plan (7 cases) + execution (7/7 PASS, 10 screenshots). Notifications UX e2e test plan (7 cases) + execution (7/7 PASS, 6 screenshots). API docs: Chat multi-persona + template variables + Notifications system WS events + preferences. Regression checkpoint post-Sprint 24: 36 suites, 0 regressions.

---

### Sprint 25 Workflow Engine — Schema + Backend + API (2026-04-02 12:00–14:40 PDT)

**Sprint 25 decomposition:** 22 tasks across Schema (CWF.1-3), Backend Runtime (CWF.4-8), API Routes (CWF.9-10), Frontend Dynamic Views (CWF.11-14), Workflow Builder (CWF.15-18), Testing/Docs (CWF.TEST.1-3, CWF.DOC.1). Read all 4 proposal docs.

**Schema (CWF.1-3, all approved):** 3 new tables (workflows/workflow_states/workflow_transitions) with versioning, types, colors. workflowId columns on projects/work_items/executions + workflowStateName. Seed default 8-state workflow from WORKFLOW constant, backfill references.

**Backend Runtime (CWF.4-8, all approved):** workflow-runtime.ts with 6 dynamic query functions (all fall back to hardcoded WORKFLOW). work-items.ts uses getWorkflowInitialState + isValidTransitionDynamic. dispatch.ts uses resolvePersonaForState. execution-manager.ts tracks workflowId+workflowStateName. mcp-server.ts 3 tools updated (route/create/block). router.ts uses buildDynamicRouterPrompt for valid target states.

**API Routes (CWF.9-10, all approved):** 4 read-only endpoints (list, get with states+transitions, states, transitions). 6 builder CRUD endpoints (create draft, bulk update states/transitions, publish, delete with 409 guard, clone with state ID remapping, validate for unreachable/dead-end/missing initial-terminal).

### Sprint 25 Workflow Engine — Frontend + Testing + Completion (2026-04-02 14:55–19:05 PDT)

**Frontend Dynamic Views (CWF.11-14, all approved):** use-workflows.ts hooks + API client (4 queries, 5min staleTime). flow-view, list-view, filter-bar, detail-panel all switched from hardcoded WORKFLOW to useWorkflowStates/useWorkflowTransitions. Settings workflow-config-section dynamic states + WorkflowSelector.

**Frontend Workflow Builder (CWF.15-18, all approved):** state-card + transition-row (editable components). workflow-preview SVG graph (auto-layout, Bezier arrows). workflow-builder main layout (state list + preview + validation panel + create dialog). /workflows routes, sidebar nav, CRUD API wiring (5 mutation hooks).

**Testing & Bugs (CWF.TEST.1-3, FX.CWF.1, CWF.DOC.1, all approved):** E2e test plan (36 steps, 10 parts). Test execution (33/36 pass, save bug found). FX.CWF.1 fix (stateIdMap remapping for temporary IDs). API documentation (10 endpoints, schemas, migration). Regression checkpoint (37 suites, 0 regressions). Sprint 25 complete.

---

### Sprint 26 Intelligence & Discovery — Collaboration + Search (2026-04-02 19:30–22:15 PDT)

**Agent Collaboration P1 (COL.1-6, all approved):** HandoffNote type + handoffNotes column (migration 0014). buildHandoffNote() with regex extraction (files, decisions, questions). getLastHandoffNote() + formatHandoffForPrompt() + buildAccumulatedContext() with ~2000 token windowing. Dependency enforcement in dispatch (depends_on edges + terminal state check, system comment on block). Handoff context injected into buildSystemPrompt() via SpawnOptions.handoffContext. Frontend display: collapsible card in execution-timeline with icons (GitBranch, Lightbulb, FileText, HelpCircle).

**Search P1 (SRC.1-4, all approved):** FTS5 virtual tables + bridging tables (startup setup, not Drizzle migration). 12 sync triggers (INSERT/UPDATE/DELETE x 4 tables) + backfill script. Unified search API (GET /api/search) with BM25 ranking, snippet extraction, type/project/archived filters. Server-backed Command Palette with 300ms debounce, type grouping, snippet highlights.

### Sprint 26 completion + Sprint 27 early — 2026-04-02 22:10–2026-04-03 02:20 PDT

**Sprint 26 remaining (SRC.5, ANL.1-7, S26.TEST.1-7, S26.DOC.1, all approved):** FTS5 search in filter bar. Analytics schema (model/totalTokens/toolUses migration 0015), token persistence from ProgressEvents, 4 aggregate endpoints (cost-by-persona/model, tokens-over-time, top-executions). Analytics page with Overview (4 stat cards, cost trend LineChart, persona BarChart) + Token Usage (ComposedChart dual-axis, model PieChart, top executions table) tabs. 4 React Query hooks + API client. 3 test plans + 3 test executions + API docs + regression checkpoint (40 suites, 0 regressions). Sprint 26 complete.

**Sprint 27 decomposition:** 20 tasks across Outbound Webhooks P1 (OWH.1-6), Inbound Webhooks P1 (IWH.1-3), Data Management P1 (DM.1-5), Testing/Docs (S27.TEST.1-5, S27.DOC.1).

### Sprint 27 completion + Sprint 28 early — 2026-04-03 04:58–07:50 PDT

**Data Management P1 (DM.2-5, all approved):** Pre-migration backup hook via centralized createBackup(). 4 API endpoints (backup, backups list, restore, truncate-logs). Storage stats + cascade fix for execution delete. Data management UI (backup list, truncation controls, storage table). Sprint 27 testing: 2 test plans (outbound webhooks, inbound+data mgmt), 2 test executions (14/17 + 15/20 pass), API docs, regression checkpoint (44 suites, 0 regressions). Sprint 27 complete.

**Sprint 28 decomposition:** 14 tasks across Scheduling (SCH.1-4), Templates P1 (TPL.1-3), Notification External Channels (NEC.1-2), Testing/Docs (S28.TEST.1-3, S28.DOC.1). SCH.1 (schedules table + migration 0018) completed and approved.

---

### Sprint 28 continued + Bug fixes early — 2026-04-03 07:50–10:30 PDT

**Scheduling (SCH.2-4, all approved):** Cron scheduler with built-in matcher, polling, catch-up, auto-disable after 5 failures. CRUD API (5 endpoints) with cron validation, persona check, nextRunAt recompute. Frontend Schedules UI in Settings (list, add/edit dialog with 8 presets + custom cron, live next-runs preview, toggle, Run Now).

**Templates (TPL.1-2, all approved):** Templates table (7 columns, migration 0019), 3 built-in seed templates (Bug Report, Feature Request, Spike). CRUD route + apply endpoint (5 endpoints, built-in guard, type validation, workflow initial state resolution).

**Security fixes (FX.SEC.1-3, all approved):** Path traversal fix in backup restore (resolve + startsWith guard). FTS5 MATCH crash fix (sanitizeFts5Query + try-catch on all 4 MATCH blocks). FTS snippet XSS sanitization (placeholder-based sanitizer preserving only `<b>` tags).

---

### Bug fixes batch 2 + Sprint 29 Phase 1 — 2026-04-03 10:45–15:55 PDT

**Bug fixes (FX.DEAD.2-3, FX.WHK.1, FX.NTF.1-2, FX.WF.1-3, FX.CHAT.1, FX.NAV.1, all approved):** Removed dead `execution_stuck` notification type. Wired proposal approve/reject into notification card actions (PATCH API + loading state). Fixed HMAC verification to use raw request bytes via preParsing hook. Fixed toast overflow count decrement (inverted ternary). Fixed notification batching double-count (excluded first individual from batch). Fixed workflow publish race condition (await mutateAsync). Wrapped workflow CRUD in DB transactions. Added workflow input validation (name, state types, transition refs). Resolved project names in chat header. Updated command palette nav items to match sidebar.

**Sprint 29 Phase 1 — Global as Project (UXO.1-4, all approved):** Added `isGlobal` boolean to projects schema + `pj-global` seed + 409 delete guard (migration 0020). Made projectId NOT NULL on 5 tables with backfill migration 0021, updated all route handlers and dashboard aggregation. Replaced `"__all__"` frontend sentinel with real global project from API, `useSelectedProject` returns `isGlobal` flag. Added scope breadcrumb indicator (colored dot + accent strip in sidebar).

**Dead code fix (FX.DEAD.1, rejected then reworked and approved):** Wired prompt template into webhook execution via standalone execution support in runExecution(). Initial implementation rejected because synthetic task fallback was unreachable (early throw on null workItemId). Rework made all lookups conditional for standalone path.

---

### Sprint 29 Phase 1 continued + Phase 2 start — 2026-04-03 15:15–16:45 PDT

**Phase 1 completion (UXO.1-2 implementations + reviews):** Migrated nullable projectId → pj-global with NOT NULL on 5 tables (migration 0021). Updated all route handlers, dashboard aggregation, seed/test files. Replaced `__all__` frontend sentinel with real global project. Added scope breadcrumb indicator.

**Bug fixes batch 3 (FX.NAV.1, FX.WF.4, FX.DOC.1, FX.HIST.1, FX.TYPE.1, FX.TYPE.2, FX.PERF.1, all approved):** Updated command palette nav items to match sidebar (9 items). Added transition sortOrder to workflow save payload. Rewrote docs/workflow.md for custom workflow engine. Fixed Agent Monitor history table row misalignment (Collapsible → conditional rendering). Widened VariableContextOptions to remove unsafe double casts in chat routes. Deduplicated HandoffNote import from shared. Batched N+1 dependency check query with inArray.

---

### Sprint 29 Phases 2-9 + Testing/Docs — 2026-04-02 10:49–12:28 PDT

**Phase 2 — Agent Rename (UXO.5-8):** Persona→Agent rename across shared types (4 files), backend schema+routes (56 files, migration 0022), frontend (54 files, 8 git mv). Agent scope (global/project) with projectId FK, migration 0023. All reviewed and approved.

**Phase 3 — Chat UX (UXO.9-13):** Session loading on /chat mount, removed click-outside-close, dynamic empty state per agent, agent-grouped sessions (collapsible headers with avatars), improved header (enlarged avatar, project name, editable title, context menu with rename/delete).

**Phase 4 — Workflow Rework (UXO.14-21):** autoRouting + agentOverrides schema migration (0002), per-workflow router prompt (3-section structured), label-based agent resolution (3-tier priority), Backlog/Done immutable states, flow view removal, Workflows→Automations rename, Automations page redesign (workflow + schedule cards), agent overrides in workflow builder (collapsible with chips).

**Phase 5-9 + Testing:** Queue endpoint + tab (UXO.24-25), global work items + seeded workflow (UXO.23), recently deleted scope (UXO.30), status bar automations indicator (UXO.31). E2e test plan with 37 cases (UXO.TEST.1). Full docs update — persona→agent rename across 10 files, global model, autoRouting, agentOverrides (UXO.DOC.1).

### Sprint 29 Implementation Detail — 2026-04-02 11:44–11:56 PDT

**UXO.14 (Schema):** autoRouting boolean + agentOverrides JSON column, migration 0002, shared types update, workflow routes + router.ts updated, router regression fix for null workflowId.
**UXO.12 (Chat):** Agent-grouped sessions with collapsible headers, avatars, session counts, recency sorting.
**UXO.17 (Workflow):** Backlog/Done auto-create on POST, immutable guards on PATCH, canonical ID anchoring.
**UXO.23 (Global):** Sidebar dimming removed, migration 0001 seeding 3-state workflow for pj-global.
**UXO.TEST.1:** 37 e2e test cases across all 8 UX Overhaul phases.

### Sprint 29 Bug Fixes + Remaining Phases — 2026-04-02 12:17–13:14 PDT

**Bug Fixes (FX.UXO1-24):** 16 entries covering router paths /automations (FX.UXO1), auto-routing toggle wired to workflow (FX.UXO3), built-in Backlog/Done state locks (FX.UXO4), global project workflow backfill (FX.UXO5), Recently Deleted scope (FX.UXO6), queue endpoint projectId filter (FX.UXO7), agent-grouped sessions (FX.UXO8), globe icon for pj-global (FX.UXO9), Automations string rename (FX.UXO10), isPico name-only match (FX.UXO11), scope UI in agent detail (FX.UXO15), agent create passes scope/projectId (FX.UXO16), dead agent-editor deleted (FX.UXO17), agent route FK validation (FX.UXO18/19), dead board-view/AgentScope removed (FX.UXO21/22), AgentId ps- prefix tracked (FX.UXO24).

**Phase 4 Completion (UXO.20-21, UXO.31):** Automations page redesign with workflow + schedule cards, agent overrides in workflow builder (collapsible chips), status bar automations indicator replacing old toggle.

**Phase 8-9 + Docs (UXO.13, UXO.15-16, UXO.DOC.1):** Improved chat header (avatar ring, editable title, context menu), per-workflow router system prompt (3-section structured), label-based agent resolution (3-tier priority), full documentation update (persona→agent across 10 doc files).

### Sprint 29 Design Polish + Bug Fixes Continued — 2026-04-02 13:14–13:42 PDT

**Design (DES.4-6, DES.12, DES.18):** Chat sidebar width reduced to 240px (DES.4), Agent Monitor "Scope:" label + "All Projects" text (DES.6), settings header Title Case (DES.12), status bar height 36px (DES.18).

**Bug Fixes (FX.UXO12-14, FX.UXO20-23, UXO.22):** Stale closure in deleteSession (FX.UXO12), chat header DropdownMenu accessibility (FX.UXO14), chat empty state for no project (FX.UXO13), dead toolCallMap removed (FX.UXO20), BUILT_IN_IDS wrong agent ID fixed (FX.UXO23), per-workflow auto-routing toggle (UXO.22). "Stories"→"work items" terminology (DES.5).
