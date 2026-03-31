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

---

## Sprint 17 (continued): Settings, UI & Mock Removal — 2026-03-30

**FX.SET3:** Replaced auto-routing ON/OFF toggle with play/pause metaphor across 3 locations (status bar, settings, work items header). Consistent emerald/amber color scheme.

**FX.RST1:** Graceful restart flow — backend `GET /api/service/status` (joins executions+personas+workItems), `POST /api/service/restart` with force flag. Frontend modal with agent list, 3s polling, auto-restart, force restart with double-click confirm.

**FX.FLOW1:** Replaced SVG BFS graph with vertical CSS flex layout — state nodes top-to-bottom, Router pills between states, Blocked branch to the right. Removed ~140 lines of SVG computation.

**FX.NAV1:** Fixed sidebar icon/label stacking (root cause: animated w-0/w-auto CSS on label wrapper). Replaced with conditional render. Added hover/active/border states.

**FX.PM1:** Inline system prompt preview on persona cards — expand/collapse, markdown via MarkdownPreview, MCP/SDK tool badges, model + budget display. One card expanded at a time.

**FX.0:** Fixed MCP tool name mismatches: `transition_state` → `route_to_state` (3 personas), `create_tasks` → `create_children` (TL). Updated seed.ts, default-personas.ts, test/setup.ts.

**FX.P1-P4 (Persona Overhauls):** All 4 workflow personas audited and overhauled:
- PM: mcpTools → post_comment, list_items, get_context, request_review. Prompt: AC template, workflow context, anti-patterns.
- TL: mcpTools → create_children, post_comment, get_context, list_items. Prompt: 3-step decomposition, granularity 2-8, skip-decomposition.
- Engineer: mcpTools → post_comment, flag_blocked, get_context. Prompt: 4-step (read → implement → build → comment), rejection handling, flag_blocked guidance.
- Code Reviewer: mcpTools → post_comment, get_context, list_items, request_review. Prompt: 5-step (context → read files → build → checklist → verdict), severity-tagged rejections.

All personas updated in both seed.ts and default-personas.ts. Key pattern: no persona has route_to_state except Router — all state transitions are Router's responsibility.

---

## Sprint 17 (continued): Persona Panel, Skills, Router Loop Defense, Monitor UX, DB/Executor Env Separation — 2026-03-30

**FX.P5-P6:** Router persona audit — fixed swapped allowedTools/mcpTools (critical: MCP names in SDK field), overhauled systemPrompt with valid transitions map. SDK tool verification — confirmed short names, fixed `tools: []` bug in executor (agents had zero built-in tools), fixed MCP env var.

**FX.PM2-PM3:** Replaced persona card expand with side detail panel (45%/55% split layout). Fixed panel to open read-only by default with explicit Edit button.

**FX.P7-P9:** Added `skills: string[]` to Persona entity + DB + API. Built skill browser modal (filesystem `.md` browser with preview). Skill injection into system prompt (section 5 in `buildSystemPrompt`, 8K char cap).

**FX.1-FX.3 (Router loop defense):** Three-layer system: (1) same-state rejection in `route_to_state` MCP tool, (2) transition history awareness in Router's dynamic system prompt, (3) rate limiter logging with system comment + WS broadcast when chaining is paused.

**FX.4-FX.5:** Transition loop detection (6-entry history, 3-occurrence threshold, auto-Blocked). Cost aggregation audit — fixed cents→dollars in 4 dashboard routes + execution serializer.

**FX.6-FX.8 (Agent Monitor UX):** Persona identity header (avatar, model badge, work item title). Chat thread restructure (grouped text bubbles, collapsible thinking, tool cards, timestamps). Historical log chunk detection (JSON/tool_call/thinking heuristics via `parseLogLine`).

**FX.DB1-DB4 (DB & Executor):** Dev/prod DB separation by NODE_ENV (`agentops-dev.db` local, `~/.agentops/data/agentops.db` prod). MockExecutor (6 events, configurable delay, zero cost). Executor selection by NODE_ENV with health endpoint indicator. Settings toggle for executor mode (runtime swapping, hidden in production).

**FX.DEV1:** Port-check wrapper `scripts/dev.sh` — skips backend/frontend if already running.

**FX.SDK2:** Replaced custom skill file injection with SDK native `skills` param. Skills are now SDK skill names on `AgentDefinition`, not file paths. Key pattern: `agent`/`agents` option in `query()`.

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
