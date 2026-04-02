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

**FX.SDK1:** Superseded by SDK.V2.2. `GET /api/sdk/capabilities` + `POST /api/sdk/reload` implemented using Query control methods.

**FX.SDK4:** Replaced filesystem skill browser with SDK capabilities picker. Fetches `commands` from capabilities endpoint, searchable list with name/description/argumentHint, manual path fallback.

**SDK.V2.1:** Persistent SDK session manager (`sdk-session.ts`). Lazy singleton via `getSdkSession()`, `unstable_v2_createSession()` with sonnet model, bypassPermissions, core tools. Exponential backoff retry (3 attempts). Reads first stream message to capture sessionId. `closeSdkSession()` in graceful shutdown. `reconnectSdkSession()` tries resume then fallback.

**SDK.V2.2:** SDK capabilities discovery endpoint (`routes/sdk.ts`). `withDiscoveryQuery()` — temporary `query()` subprocess, reads first message, calls control method, interrupts/drains. `initializationResult()` returns commands/agents/models. Cache on first call. `reloadPlugins()` for refresh. Unblocked FX.SDK3-6. Key finding: `initializationResult()` does NOT return built-in tool names — FX.SDK3/SDK5 remain blocked.

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

## Sprint 22: Visual UX Audit (batch 1) — 2026-04-01 22:25 to 2026-04-02 00:45

**Dashboard bugs (FX.UX.DASH.3):** Activity items in dashboard's Recent Activity linked to generic `/items` instead of specific work items. Fixed with `setSelectedItemId` + `navigate("/items")` pattern, added a11y attributes.

**Work Items audits (UX.WORK.LIST, UX.WORK.FLOW, UX.WORK.CREATE, FX.UX.ITEMS.1):** List view audited at 3 viewport sizes + dark mode — 9 screenshots, 1 bug (empty filter state blank). Flow view audited — 8 workflow state nodes with Router edges, click-to-filter interaction, 6 screenshots. Creation uses quick-add pattern (instant Backlog item + edit-in-panel). Empty filter state fixed with `topLevel.length === 0` check + "Clear filters" button in list-view.tsx. Board view marked blocked (not wired into UI).

**Detail panel audit (UX.DETAIL):** All sections verified on data-rich OAuth2 item — title, status, priority, labels, description, 3 children, 6 comments, 3 execution history entries, metadata. Scrolls internally, dark mode clean. 0 bugs.

**Agent Monitor audits (UX.AGENT.MAIN, UX.AGENT.CONTROLS, UX.AGENT.HISTORY):** Main layout — sidebar + terminal + header bar, 3 screenshots, 1 bug (broken Work Item/Parent links → 404). Controls — Stop/Force Stop dialogs, split view, panel components, 2 screenshots, 1 bug (MCP status 404 toast). History — 8 execution entries, summary stats, filters, disabled rewind buttons (existing FX.UX.REWIND), 3 screenshots, 0 new bugs.

**Activity Feed audit (UX.ACTIVITY):** Chronological events grouped by date, colored type icons, filters, scrolling, dark mode. 3 screenshots, 1 bug (same generic `/items` link issue as dashboard).

---

### Sprint 22 batch 2 — Remaining audits, bug fixes, UX improvements, housekeeping, research (2026-04-02 05:15–07:55 PDT)

**Remaining audits:** UX.RESPONSIVE completed (12 screenshots, 0 bugs at 1024px/768px). UX.DARK completed (9 screenshots, 0 bugs). UX.CMD, UX.NAV, UX.PICO, UX.SETTINGS, UX.PERSONA.LIST, UX.PERSONA.TEST all completed and approved.

**Bug fixes:** FX.PICO.EXEC (SDK executable path resolution — added getClaudeCodeExecutablePath() to config.ts, pathToClaudeCodeExecutable to all 4 query() call sites). FX.UX.REWIND (disabled button tooltip — span wrapper for TooltipTrigger). FX.UX.PERSONA.1 (keyboard a11y — role/tabIndex/onKeyDown on PersonaCard). FX.UX.PERSONA.2 (label mismatch — shared BUILT_IN_IDS set). FX.UX.PERSONA.3 (delete 404 toast — onSelect(null) + removeQueries). All approved.

**UX improvements:** UX.AGENT.BREADCRUMB — replaced nav buttons with breadcrumb trail + dismissible side panel overlay in Agent Monitor.

**Housekeeping:** HK.TEST.RESULTS — restructured 269 files from flat tests/e2e/results/ into 46 timestamped directories.

**Research:** RES.SDK.TOOLS — found sdk-tools.d.ts with 21 tools, recommended version-pinned shared manifest. RES.V2.SESSIONS — SDKSessionOptions missing 12+ fields vs query() Options, recommended query() with resume.

---

### Research & bug fixes batch — 2026-04-02 08:15–13:20 PDT

**Research (7 tasks, all approved):** RES.PLUG.CORE — cataloged 25 deps of ExecutionManager/MCP, recommended thin interface extraction (Option B). RES.GLOBAL.DATA — nullable projectId on 4 tables, global_memories table, AgentScope type. RES.GLOBAL.NAV — keep flat nav, add "All Projects" option, scope-aware pages. RES.GLOBAL.UX — Pico scope toggle, `set_project_context` MCP tool, global workspace. RES.WORKFLOW.DATA — 3-table schema (workflows/states/transitions), soft versioning, 2-level persona binding. RES.WORKFLOW.BUILDER — hybrid form+preview editor, 8-rule validation, shared router. RES.WORKFLOW.RUNTIME — dynamic router prompt from DB, per-project/item binding, 3-phase migration.

**Bug fixes (3 tasks, all approved):** FX.WORK.EDIT — stale selectedProjectId in localStorage + silent error swallowing in updateWorkItem(). FX.PERSONA.SEED — extracted idempotent ensureBuiltInPersonas() for server startup. FX.PICO.OVERFLOW — w-0 min-w-full overflow-hidden on ScrollArea container, break-words on bubbles.

---

### Pico UX polish & Woof rebrand — 2026-04-02 13:35–16:10 PDT

**Bug fix + 6 UX tasks (all approved):** FX.PICO.EMPTY.BUBBLE — skip rendering empty message during streaming, TypingIndicator handles the gap. UX.PICO.MINI.CONTENT — compact prop on ChatMessage (thinking=one-liner, tool calls=one-liner). UX.PICO.RESIZE — drag-to-resize on top/left/corner edges (320x400 min, 600x80vh max, persisted in Zustand). UX.PICO.STATUSBAR — consolidated StatusLine component auto-cycling through thinking+tool_use items with counter/expand chevron. UX.PICO.FULLPAGE — `/chat` page with session sidebar, verbose rendering, Maximize2 button in mini panel. UX.PICO.COLLAPSE — ChevronDown replaces X icon on mini panel. UX.BRAND.WOOF — rebranded all user-facing "AgentOps" to "Woof" (title, favicon, sidebar, status bar, mobile header, settings, tool config).

---

### Research proposals batch 1 — 2026-04-02 16:20–17:55 PDT

**6 research docs (all approved):** RES.PROMPTS.DOC — traced 5-section buildSystemPrompt() pipeline (persona→project→work item→sandbox→history) + Pico 4-section variant. RES.PROMPTS.VARS — {{var}} Mustache syntax, 15 built-ins, vars.* user-defined, resolveVariables() regex, 4-phase plan. RES.WORKFLOW.EDGE — 7 edge cases (deletion, cloning, import/export, permissions, global agents, testing, chat interaction). RES.CHAT.UX — session sidebar + main chat, Pico as special case, 5 entry points, 3-phase migration. RES.CHAT.RICH — 8 content types (DiffBlock, ToolCallCard, TerminalBlock, FileTreeSummary, ProposalCard, ThinkingBlock, ImageBlock, MultiStepProgress). RES.CHAT.DATA — hybrid contentBlocks, SSE + control endpoints, execution linking, V2 readiness.

---

### Research proposals batch 2 — 2026-04-02 18:10–20:40 PDT

**8 research docs (all approved):** RES.LIFECYCLE.UX — archive primary, 3-tier confirmation, bulk ops, 30-day soft delete, "Show archived" toggle. RES.LIFECYCLE.DATA — archived_at/deleted_at timestamps, cascade rules per table, API endpoints, canDispatch() guard, 5-step migration. RES.NOTIFY.UX — 10-event catalog with 4 priority levels, bell icon + sliding drawer, toast vs persistent matrix, quiet hours. RES.NOTIFY.INTEGRATIONS — Slack (Block Kit), email (Resend), webhooks (HMAC, retry), NotificationService event bus with channel fan-out. RES.COLLAB.CONTEXT — handoff notes (structured schema), shared scratchpad, 4-tier context windowing, @persona tagging. RES.COLLAB.COORD — parallel execution (advisory file locking), dependency enforcement (edges exist but aren't checked), human-in-loop (create_proposal MCP), escalation chain, fan-out/fan-in completion gates. RES.SCHED.UX — per-persona schedules in Persona Manager, presets/cron with live preview, standalone execution model, silent success notifications. RES.SCHED.INFRA — node-cron + SQLite persistence, missed run catch-up, 14-column schedules table, shared concurrency pool, trigger separation (2 work+review entries, 21:05–21:15).

---

### Research proposals batch 3 + cleanup — 2026-04-01 16:15–16:45 PDT

**6 research docs (all approved) + 1 cleanup:** RES.SWAP.ARCH — frontend/backend decoupling architecture, Zustand connection store, 5 deployment models. RES.SWAP.HOSTED — hosted frontend via Cloudflare Pages, localhost mixed content OK, multi-backend localStorage model. RES.SWAP.API — ~70 endpoints audited, OpenAPI 3.1 code-first, apiVersion + capabilities. RES.SEARCH — FTS5 recommended over Fuse.js/Meilisearch, 8 searchable entities, 3 access surfaces (Cmd+K, filter bar, /search). RES.RECOVERY.AGENTS — 5 modules audited for failure modes, 7 error categories, RetryPolicy, watchdog. RES.RECOVERY.SYSTEM — WS fixed 3s reconnect gap, missing busy_timeout PRAGMA, zero ErrorBoundaries. Cleanup: archived RES.SCHED.INFRA–RES.SWAP.API batch + trimmed worklog.

---

### Research proposals batch 4 + fix — 2026-04-01 19:00–21:00 PDT

**5 research docs (all approved) + 1 fix:** RES.DATA.BACKUP — SQLite backup() API, 4 triggers, ~/.agentops/backups/, 6-step restore flow, full ProjectExport JSON. RES.DATA.GROWTH — execution logs are 80% of DB growth, truncate-not-delete insight, 4-tier retention, dbstat virtual table monitoring. RES.TOKENS.TRACKING — SDK result fields audited, unit inconsistency bug found (cents vs USD), 6 query() sites, 5 data gaps. RES.TOKENS.DASHBOARD — tab within Analytics page, 5 visualizations, on-the-fly SQL aggregation, missing startedAt index. FX.UX.PERSONA.4 — wired TestRunPanel into Persona Manager detail panel.

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

**Dead code fix (FX.DEAD.1, rejected then reworked and approved):** Wired prompt template into webhook execution via standalone execution support in runExecution(). Initial implementation rejected because synthetic task fallback was unreachable (early throw on null workItemId). Rework made all lookups conditional for standalone path.
