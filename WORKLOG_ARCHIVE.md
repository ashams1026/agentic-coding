# AgentOps — Work Log Archive

> Summarized entries from `WORKLOG.md`. Grouped by sprint/phase.

---

## Sprints 1-15 (consolidated) — 2026-03-28 to 2026-03-30

**Sprints 1-4:** Monorepo scaffold, 9 UI screens, mock data, Fastify backend. **Sprints 5-7:** Drizzle schema (9 tables), 10 CRUD routes, WebSocket, API client, WorkItem model. **Sprint 8:** MCP server (7 tools), ClaudeExecutor, dispatch/router, rate limiter, cost tracking. **Sprint 9:** 145 tests (Vitest). **Sprint 10:** Design system, filtering, skeletons. **Sprint 11:** API wiring, WS invalidation, pipeline fixes. **Sprint 12:** CLI + pm2 + logging. **Sprint 13:** API keys, settings, data export. **Sprint 14:** 10 doc files. **Sprint 15:** Project scoping, empty states, auto-seed.

---

## Sprint 16: AI-Based E2E Testing (consolidated) — 2026-03-30

**Phase 1 (AI.1-AI.11):** 17 test plan files + template + README. All reviewed and approved.

**Phase 1.5 (AI.V1-AI.V11):** Visual inspection protocol added to all plans. Screenshot checkpoints, Visual Quality/Failure criteria.

**Phase 2 (AI.12-AI.28):** 17 test suites executed via chrome-devtools MCP. 243/253 PASS, 2 FAIL (detail-panel-edit: list reactivity + mock persistence), 4 N/A. All reviewed and approved.

**Phase 2 (AI.29-AI.30):** dark-mode 19/19 PASS, keyboard-shortcuts 16/17 PASS (1 FAIL: work item route 404).

**Phase 3 (AI.31):** Triage — 263 total steps, 256 PASS, 3 FAIL, 4 N/A (97.3%). Filed FX.CMD1, FX.EDIT1.

---

## Sprint 17 (consolidated): Agent Pipeline Fixes — 2026-03-30 to 2026-03-31

Command sandbox, mock removal (-2283 lines), demo seed, settings fixes, auto-routing play/pause, graceful restart, Flow view redesign, sidebar fixes, all 5 persona overhauls (MCP tools + system prompts), persona detail panel (45/55 split), skills system (entity+DB+browser+injection), router loop defense (3 layers), cost audit, agent monitor UX (identity header, chat thread, log parsing), DB/executor env separation, SDK native skills. E2E tests AI.19-AI.28 all passed.

---

## Sprint 17 (final): Sidebar, E2E Bugs, Activity Feed — 2026-03-31

**FX.NAV2:** Ground-up sidebar redo — Radix `asChild` + NavLink incompatibility (stringified className function). Fixed with `Link` + manual `isActive`. CSS cascade: global `*` border-color outside `@layer` beat utilities — moved to `@layer base`. Sidebar 224px, `flex flex-col gap-1`, 3px primary left border active state.

**FX.AM1:** Agent monitor empty state: "Go to Story Board" → "Go to Work Items", `/board` → `/items`.

**FX.CMD1:** Command palette: `setSelectedItemId(wi.id); navigate("/items")` instead of 404 route. NAV_ITEMS updated (removed Story Board, Workflow Designer; added Work Items). `Kanban` → `ListTodo` icon.

**FX.EDIT1:** List row reactivity: `setQueriesData<WorkItem[]>({ queryKey: ["workItems"] }, ...)` for optimistic updates across all cached list variants.

**FX.9:** Activity feed enrichment: `personaMap`/`itemTitleMap` lookup maps, `wsEventToActivity(event, maps)` with enriched formats like "[Persona] started work on [Title]", "[Title] moved from [Old] to [New]".

---

## Sprint 18 (partial): Pico Backend — 2026-03-31

**PICO.1:** Pico as built-in assistant persona. `PersonaSettings` interface with `isAssistant?` flag. Seed: `ps-pico`, amber #f59e0b, dog icon, sonnet, $5 budget. System prompt: personality + knowledge + capabilities + guidelines. Excluded from workflow assignments, non-editable/deletable in UI.

**PICO.2:** Chat session API. `chat_sessions` + `chat_messages` tables (Drizzle migration). 4 endpoints: create session, list sessions, get messages, delete session. `ChatSessionId`/`ChatMessageId` shared types.

**PICO.3:** Chat streaming endpoint. `POST /api/chat/sessions/:id/messages` — saves user message, assembles conversation history, spawns Claude SDK `query()` with Pico config, streams SSE (text/thinking/tool_use/tool_result/error/done). Saves assistant message with metadata on completion. Auto-generates session title from first message.

**PICO.4:** Project knowledge skill. `pico-skill.md` (~700 tokens): AgentOps description, 8 workflow states, 5 personas, work item lifecycle, execution history, 5 common Q&A, docs/ directory pointer. Loaded at module level in chat.ts, injected into system prompt. Also fixed seed prompt: "Triage" → "Backlog", added docs/ instruction.

---

## Sprint 18 (continued): Pico Frontend — 2026-03-31

**PICO.5:** Floating chat bubble — 56px circle, bottom-right, dog icon, bounce animation, unread indicator. Render in root-layout.

**PICO.6:** Chat panel — 400x500px, header (title/session switch/new/minimize), scrollable messages with auto-scroll, textarea input (Cmd+Enter), typing indicator, click-outside dismiss, scale+opacity animation.

**PICO.7:** Chat message components — user (right-aligned primary bubble), assistant (left-aligned muted + avatar). Markdown rendering, collapsible thinking blocks, tool call cards with expand/collapse, code blocks with syntax highlighting. Timestamps on hover, consecutive grouping.

**PICO.8:** Streaming chat hook (`use-pico-chat.ts`) — `sendMessage()` with SSE parser (async generator, buffer management), `ensureSession()` lazy creation, optimistic user messages, incremental assistant updates (text/thinking/tool_use). Zustand-persisted `currentSessionId`.

**PICO.9:** Session management — DropdownMenu for recent 10 sessions, switch/rename/clear-all. Inline title editing (Input with Enter/Escape/blur). `refreshSessions()`, `switchSession()`, `renameSession()`, `clearAllSessions()`. PATCH route for title updates.

**PICO.10:** Personality & onboarding — welcome message ("Woof! I'm Pico..."), 4 quick-action buttons (BarChart3/GitBranch/Activity/PenLine icons). Backend personality guidelines in system prompt (dog puns, concise, technically accurate).

---

## Sprint 17 (final SDK) + Sprint 19 (V2 Sessions) — 2026-03-31

**FX.SDK1:** Superseded by SDK.V2.2. `GET /api/sdk/capabilities` + `POST /api/sdk/reload` implemented using Query control methods.

**FX.SDK4:** Replaced filesystem skill browser with SDK capabilities picker. Fetches `commands` from capabilities endpoint, searchable list with name/description/argumentHint, manual path fallback.

**SDK.V2.1:** Persistent SDK session manager (`sdk-session.ts`). Lazy singleton via `getSdkSession()`, `unstable_v2_createSession()` with sonnet model, bypassPermissions, core tools. Exponential backoff retry (3 attempts). Reads first stream message to capture sessionId. `closeSdkSession()` in graceful shutdown. `reconnectSdkSession()` tries resume then fallback.

**SDK.V2.2:** SDK capabilities discovery endpoint (`routes/sdk.ts`). `withDiscoveryQuery()` — temporary `query()` subprocess, reads first message, calls control method, interrupts/drains. `initializationResult()` returns commands/agents/models. Cache on first call. `reloadPlugins()` for refresh. Unblocked FX.SDK3-6. Key finding: `initializationResult()` does NOT return built-in tool names — FX.SDK3/SDK5 remain blocked.

---

## Sprint 19 (File Checkpointing) + Sprint 17 (Bug Fixes, Testing, License) — 2026-03-31

**SDK.V2.4:** Updated `docs/architecture.md` with V2 session architecture — singleton lifecycle, discovery, Pico integration, relationship to per-execution `query()` calls.

**SDK.FC.1:** Enabled file checkpointing in executor — `enableFileCheckpointing: true` in `query()` options, `CheckpointEvent` type in AgentEvent union (internal, not broadcast), `checkpointMessageId` column on executions table (nullable), populated from first `SDKAssistantMessage`.

**SDK.FC.2:** Rewind API endpoint — `POST /api/executions/:id/rewind` with dry-run support. Creates temporary `query()` session at project cwd, calls `rewindFiles(messageId, { dryRun })`, interrupt+drain. Posts system comment and audit trail on non-dry-run. Validates: execution exists, has checkpoint, not running.

**SDK.FC.3:** Rewind button in agent monitor — `RewindButton` component (~120 lines) in `agent-history.tsx`. Undo2 icon, disabled for legacy executions (no checkpoint), hidden for running. Click: dry-run preview → AlertDialog modal showing file list (scrollable, mono font, insertions/deletions) → confirm → success toast.

**FX.PICO1:** Verified "Pico persona not found" error already fixed — seed.ts creates Pico with `isAssistant: true`, chat.ts looks up by that flag. Issue was stale dev DB.

**FX.PICO4:** Fixed CORS headers on Pico SSE endpoint — replaced `reply.raw.writeHead(200, { SSE headers })` with `reply.header()` + `reply.raw.writeHead(200, reply.getHeaders())`. This preserves CORS headers from `@fastify/cors` plugin without duplicating config.

**FX.LIC1:** Added Apache 2.0 LICENSE file (191 lines) and `"license": "Apache-2.0"` to all 4 package.json files.

**FX.PICO2:** Wrote Pico e2e test plan — 38 steps across 11 parts in `tests/e2e/plans/pico-chat.md`. Covers bubble visibility, panel open/close, quick actions, manual input, markdown rendering, session management, title editing, persistence, mobile viewport, error state, clear sessions.

**FX.PICO3:** Executed Pico e2e test — 30/38 PASS, 4 FAIL, 4 SKIP. All failures from CORS bug on SSE endpoint. 8 screenshots captured. Bug filed as FX.PICO4 (HIGH severity).

**FX.SDK6:** Exposed available subagents in persona config via SDK `supportedAgents()` — agents array from capabilities endpoint, multi-select in persona editor.

---

## Sprint 19 (Hooks + File Checkpointing Docs) + Sprint 17 (FX.PICO5) — 2026-03-31

**FX.PICO5:** Fixed Pico chat scroll overflow — `min-h-0 overflow-hidden` on ScrollArea in chat-panel.tsx.

**SDK.FC.4-FC.7:** MCP rewind tool for Code Reviewer (HTTP delegation), e2e test plan (17 steps), test execution (7/17 PASS, 10 SKIP), documentation updates across architecture/API/MCP docs.

**SDK.HK.1-HK.5:** Replaced manual sandbox with PreToolUse hook, added PostToolUse audit logging (timing + sanitized commands), SessionStart/SessionEnd lifecycle hooks (audit + WS), FileChanged hook (file_changed WS events), file changes panel UI (collapsible, real-time, deduplication).

---

## Sprint 19 (Hooks docs, Structured Output, Subagents, Effort) — 2026-03-31 to 2026-04-01

**SDK.HK.6-HK.8:** File tracking e2e test plan + execution (4/16 PASS, 12 SKIP — no live agents), hooks architecture documentation (7 hooks table, diagram, audit trail).

**FX.PROJ1:** Fixed stale project ID fallback — `retry: false` on useProject, auto-select first available project.

**SDK.SO.1-SO.5:** Structured output for Router (isRouter flag, JSON schema), RouterDecisionCard UI (full + compact variants), structuredOutput column + migration, e2e test (5/13 PASS), docs updated.

**SDK.SA.1-SA.6:** All personas as SDK subagents (AgentDefinition mapping), SubagentStart/SubagentStop hooks + WS events, parentExecutionId column, nested SubagentCard UI, e2e test (1/12 PASS — empty DB), docs updated.

**SDK.ET.1-ET.5:** Effort/thinking on PersonaSettings, passed to query() options, per-persona defaults (Router=low/disabled, Engineer=max/enabled), persona editor dropdowns, e2e test (11/13 PASS — full save-persist), docs updated.

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
