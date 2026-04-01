# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-31 — SDK.FC.2: Add rewind API endpoint

**Task:** Add `POST /api/executions/:id/rewind` route for file rewind via SDK.

**Done:**
- Added `POST /api/executions/:id/rewind` route in `packages/backend/src/routes/executions.ts`
- Accepts `{ dryRun?: boolean }` body
- Validates: execution exists, has checkpointMessageId, is not running
- Looks up project path via workItem → project chain
- Creates temporary query() session with `enableFileCheckpointing: true` in the project's cwd
- Calls `q.rewindFiles(checkpointMessageId, { dryRun })` using the withDiscoveryQuery pattern (start subprocess, call control method, interrupt+drain)
- Returns `{ canRewind, filesChanged, insertions, deletions, dryRun }`
- On non-dry-run: posts system comment on work item with file change summary, logs audit trail entry
- Error handling: 404 (execution/workItem/project not found), 400 (no checkpoint, cannot rewind), 409 (running execution), 503 (no API key), 500 (rewind failure)

**Files modified:** `packages/backend/src/routes/executions.ts`

**Notes for next agent:** The rewind endpoint is ready for SDK.FC.3 (UI rewind button). Frontend needs: `POST /api/executions/:id/rewind` with `{ dryRun: true }` first for preview, then `{ dryRun: false }` for actual rewind. Response shape: `{ data: { canRewind, filesChanged: string[], insertions, deletions, dryRun } }`. Note: `auditStateTransition` is reused for rewind audit logging with fromState="rewind", toState="reverted" — a dedicated audit function could be added later.

---

## 2026-03-31 — Review: SDK.FC.1 (approved)

**Reviewed:** File checkpointing enablement across executor, types, schema, and routes.
- `enableFileCheckpointing: true` correctly added to query() options
- `CheckpointEvent` properly added to `AgentEvent` union, handled with `continue` in stream loop (not broadcast — correct, internal-only signal)
- `checkpointMessageId` nullable column added via migration `0004`, backward-compatible
- Shared `Execution` entity and route serializer both include the new field with `?? null` fallback
- `eventToChunk` handles exhaustive switch with empty string for checkpoint type
- Build passes clean
- **Verdict: approved.**

---

## 2026-03-31 — SDK.FC.1: Enable file checkpointing in executor

**Task:** Add `enableFileCheckpointing: true` to query() options and store the checkpoint message ID.

**Done:**
- Added `CheckpointEvent` type to `AgentEvent` union in `packages/backend/src/agent/types.ts`
- Added `checkpointMessageId: string | null` to `Execution` entity in `packages/shared/src/entities.ts`
- Added `checkpoint_message_id` column to `executions` table in `packages/backend/src/db/schema.ts`
- Generated Drizzle migration `0004_sloppy_juggernaut.sql`
- In `packages/backend/src/agent/claude-executor.ts`: added `enableFileCheckpointing: true` to query() options, emits a `checkpoint` event with the first assistant message's ID
- In `packages/backend/src/agent/execution-manager.ts`: captures checkpoint events, stores `checkpointMessageId` in DB on completion, handles new event type in `eventToChunk`
- In `packages/backend/src/routes/executions.ts`: serializer now includes `checkpointMessageId`

**Files modified:** `packages/backend/src/agent/types.ts`, `packages/shared/src/entities.ts`, `packages/backend/src/db/schema.ts`, `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/routes/executions.ts`
**Files created:** `packages/backend/drizzle/0004_sloppy_juggernaut.sql`, `packages/backend/drizzle/meta/0004_snapshot.json`

**Notes for next agent:** File checkpointing is now enabled on all agent executions. The `checkpointMessageId` is captured from the first SDK assistant message and stored in the executions table. This unblocks SDK.FC.2 (rewind API endpoint) which will use `rewindFiles(checkpointMessageId)` to restore files. Existing executions will have `null` for this field — SDK.FC.3's UI should handle that (disable rewind button).

---

## 2026-03-31 — Review: SDK.V2.4 (approved)

**Reviewed:** V2 session architecture documentation in `docs/architecture.md`.
- Session types table clearly distinguishes all 4 session types (discovery, per-execution, Pico chat, persistent V2)
- Persistent V2 session lifecycle diagram is thorough: lazy init → sessionId capture → caching → reconnect with exponential backoff → shutdown
- SDK Capabilities Discovery flow accurately documents the withDiscoveryQuery pattern
- Critical "why not" explanations included: V2 can't replace query() for discovery (control methods on Query only) or Pico (SDKSessionOptions lacks agent/agents/mcpServers/cwd/skills)
- Stale references updated: Mock Layer → Pico Chat, sdk-session.ts and sandbox.ts added to agent engine table, chat/sdk added to routes
- Build passes clean
- **Verdict: approved.**

---

## 2026-03-31 — SDK.V2.4: Update architecture docs with V2 session

**Task:** Document V2 session architecture, discovery flow, and limitations.

**Done:**
- Added "SDK V2 Session Architecture" section to `docs/architecture.md`:
  - Session types table: discovery, per-execution, Pico chat, persistent V2
  - Persistent V2 session lifecycle diagram (lazy init → ready → reconnect → shutdown)
  - SDK capabilities discovery flow diagram (cache check → withDiscoveryQuery → initializationResult)
  - Documented WHY V2 sessions can't replace query() for discovery (control methods on Query only) or Pico (SDKSessionOptions lacks agent/agents, mcpServers, cwd, skills)
- Updated stale references:
  - Removed "Mock Layer (dev mode)" from high-level diagram → replaced with "Pico Chat (SSE)"
  - Frontend api/ description: removed mock delegation mention
  - Backend routes: added "chat, sdk" to route list
  - Agent engine table: added `sdk-session.ts` and `sandbox.ts`
- Also marked SDK.V2.3 as blocked (SDKSessionOptions limitation)

**Files modified:** `docs/architecture.md`

**Notes for next agent:** The architecture doc now reflects the current state of SDK integration. Key finding documented: V2 sessions (SDKSessionOptions) can't replace query() for Pico because they lack agent/agents, mcpServers, cwd, and skills options. This limitation blocks SDK.V2.3 until the SDK adds these fields. Next Sprint 19 tasks are SDK.FC.1+ (file checkpointing).

---

## 2026-03-31 — Review: FX.SDK6 (approved)

**Reviewed:** Subagents field added to Persona entity with SDK discovery browser.
- Full stack implementation: shared types, DB schema (migration `0003`), API contracts, routes (serializer + create + update), persona editor (edit + read-only), SubagentBrowser component.
- SubagentBrowser follows SkillBrowser pattern exactly: fetch agents from capabilities on open, searchable list, model badge, description panel, Add/Added state.
- Migration is backward-compatible: `DEFAULT '[]' NOT NULL`.
- All Persona construction sites fixed with `?? []` fallback for existing rows.
- Subagents stored but not yet wired to executor — correctly deferred to SDK.SA.1.
- Build passes.
- **Verdict: approved.**

---

## 2026-03-31 — FX.SDK6: Expose available subagents in persona config

**Task:** Add subagents field to Persona entity and create a subagent browser in the persona editor using SDK capabilities.

**Done:**
- Added `subagents: string[]` to `Persona` interface in `packages/shared/src/entities.ts`
- Added `subagents?: string[]` to `CreatePersonaRequest` and `UpdatePersonaRequest` in `packages/shared/src/api.ts`
- Added `subagents` column to personas table in `packages/backend/src/db/schema.ts` (JSON text, default `[]`)
- Generated Drizzle migration `0003_strong_kingpin.sql`
- Updated `packages/backend/src/routes/personas.ts`: serializer, create handler, update handler all include `subagents`
- Fixed `packages/backend/src/agent/execution-manager.ts` and `packages/backend/src/routes/dashboard.ts`: added `subagents` to Persona construction (with `?? []` fallback for existing rows)
- Created `packages/frontend/src/features/persona-manager/subagent-browser.tsx`: dialog fetching `agents` from `GET /api/sdk/capabilities`, searchable list with name/description/model badge, click for description panel, Add button
- Updated `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`:
  - Edit mode: `subagents` state, sync, save, Subagents section with pills + browse button + SubagentBrowser dialog
  - Read-only mode: shows subagent names as outline badges when populated

**Files created:** `packages/frontend/src/features/persona-manager/subagent-browser.tsx`, `packages/backend/drizzle/0003_strong_kingpin.sql`
**Files modified:** `packages/shared/src/entities.ts`, `packages/shared/src/api.ts`, `packages/backend/src/db/schema.ts`, `packages/backend/src/routes/personas.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/routes/dashboard.ts`, `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`

**Notes for next agent:** Subagents are stored as `string[]` on the Persona entity — the values are SDK agent names (e.g., "Explore", "code-reviewer"). Currently they're stored but NOT yet passed to `query()` options. SDK.SA.1 in Sprint 19 should wire these into the executor as `AgentDefinition` entries in the `agents` option. The SubagentBrowser component follows the same pattern as SkillBrowser — fetches from capabilities on dialog open.

---

## 2026-03-31 — Review: FX.SDK4 (approved)

**Reviewed:** Replaced filesystem skill browser with SDK capabilities-driven skill picker.
- Correctly fetches `commands` from `GET /api/sdk/capabilities` on dialog open. Searchable list with name, description, argument hint — matches task spec.
- Clean component architecture: loading/error/empty states, retry button, `useMemo` for filtered results, `stopPropagation` on Add button.
- Manual path input preserved as fallback for custom skills — task requirement met.
- Persona detail panel: `isSlashCommand` heuristic (`!includes("/") && !includes(".")`) is reasonable for distinguishing SDK commands from file paths.
- Removed `useSelectedProject` dependency and `projectPath` prop — skill browsing no longer requires project context.
- API types (`SdkSkill`, `SdkCapabilities`) match backend response shape.
- Build passes.
- **Verdict: approved.**

---

## 2026-03-31 — FX.SDK4: Replace file browser skill picker with SDK skill picker

**Task:** Replace filesystem-based skill browser with SDK capabilities-driven skill picker.

**Done:**
- Added `getSdkCapabilities()` and `reloadSdkCapabilities()` to `packages/frontend/src/api/client.ts` with `SdkSkill`, `SdkAgent`, `SdkModel`, `SdkCapabilities` types
- Re-exported both functions in `packages/frontend/src/api/index.ts`
- Rewrote `packages/frontend/src/features/persona-manager/skill-browser.tsx`:
  - Now fetches `GET /api/sdk/capabilities` on dialog open instead of browsing filesystem
  - Searchable list of SDK skills with name, description, and argument hint
  - Click a skill to see its description in a detail panel
  - "Add" button on each skill (shows "Added" badge if already in the list)
  - Manual path input kept as fallback for custom skills not yet discovered
  - Retry button on error
  - No longer requires `projectPath` prop
- Updated `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`:
  - Removed `useSelectedProject` dependency and `FolderSearch` import
  - Skills browse button no longer requires project path (always enabled)
  - Read-only skills display: SDK skill names shown with `/` prefix (e.g., `/commit`), file paths shown as-is
- Also marked FX.SDK3 and FX.SDK5 as blocked (SDK doesn't expose built-in tool names via discovery API)

**Files modified:** `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`, `packages/frontend/src/features/persona-manager/skill-browser.tsx`, `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`

**Notes for next agent:** FX.SDK6 (subagent config) should follow same pattern — fetch `agents` from `GET /api/sdk/capabilities`. The `SdkCapabilities` type is already in the API client with the `agents` array. FX.SDK3 and FX.SDK5 remain blocked because the SDK doesn't return built-in tool names in `initializationResult()`.

---

## 2026-03-31 — Review: SDK.V2.2 (approved)

**Reviewed:** SDK capabilities discovery endpoint — `GET /api/sdk/capabilities` and `POST /api/sdk/reload`.
- Correct use of `initializationResult()` and `reloadPlugins()` Query control methods. These are on the `Query` interface, not `SDKSession`, so the worker correctly used temporary `query()` instances instead of the V2 persistent session — valid deviation from task description.
- `withDiscoveryQuery()` lifecycle is clean: API key guard → create minimal query → read first message (ensures subprocess running) → control method → interrupt → drain. Error path has proper cleanup.
- Cache-on-first-call pattern avoids unnecessary subprocess creation. Reload handler's fallback for models is slightly heavy but correct.
- Route registration follows existing patterns. Import types verified against SDK d.ts.
- FX.SDK1 correctly marked superseded. FX.SDK3-6 unblocked.
- Build passes.
- **Verdict: approved.**

---

## 2026-03-31 — SDK.V2.2: Unblock FX.SDK1 with SDK capabilities endpoint

**Task:** Create `GET /api/sdk/capabilities` and `POST /api/sdk/reload` routes using Query control methods.

**Done:**
- Created `packages/backend/src/routes/sdk.ts`:
  - `GET /api/sdk/capabilities`: lazy-fetches SDK capabilities on first call, caches for server lifetime. Returns `{ commands: SlashCommand[], agents: AgentInfo[], models: ModelInfo[], cachedAt: string }`.
  - `POST /api/sdk/reload`: calls `reloadPlugins()` control method, refreshes cache. Returns updated capabilities + reload error count.
  - `withDiscoveryQuery()` helper: spins up a lightweight `query()` with minimal prompt, reads first message to ensure subprocess is running, calls the control method, then interrupts and drains. Proper cleanup on error.
  - Uses `initializationResult()` for initial fetch (returns commands, agents, models) and `reloadPlugins()` for reload (returns commands, agents, plugins, MCP status).
- Updated `packages/backend/src/server.ts`: registered `sdkRoutes`.
- Updated `TASKS.md`:
  - Marked FX.SDK1 as `[x]` (superseded by SDK.V2.2)
  - Unblocked FX.SDK3, FX.SDK4, FX.SDK5, FX.SDK6 (removed `[blocked]` tags)

**Files created:** `packages/backend/src/routes/sdk.ts`
**Files modified:** `packages/backend/src/server.ts`, `TASKS.md`

**Notes for next agent:** The discovery query approach spins up a temporary query subprocess per call (cached after first call, so it only happens once per server lifetime unless reload is called). FX.SDK3-6 are now unblocked and can use `GET /api/sdk/capabilities` to populate tool/skill/agent selectors. Note that `initializationResult()` does NOT return tools — it returns commands (skills), agents, and models. Built-in tools (Read, Write, Bash, etc.) are a fixed SDK set, not discoverable via this API. Frontend may need a hardcoded tool list or a different approach for FX.SDK3.

---

## 2026-03-31 — Review: SDK.V2.1 (approved)

**Reviewed:** Persistent SDK session manager — lazy singleton with retry and shutdown integration.
- SDK API usage verified: `unstable_v2_createSession`, `unstable_v2_resumeSession`, `SDKSession` all exist in SDK v0.2.87 type declarations. `SDKSessionOptions` accepts `model`, `permissionMode: 'bypassPermissions'`, `allowedTools`, `env` — all used correctly.
- Lazy singleton pattern is a good deviation from "on startup" spec — avoids blocking boot when no one needs discovery or Pico. Concurrent init deduplication via `initPromise` is correct.
- Exponential backoff retry (1s/2s/4s, 3 max) is sound. First-message read from `session.stream()` correctly initializes session ID.
- `reconnectSdkSession()` properly tries resume before fallback to new session.
- Shutdown integration: `closeSdkSession()` called before DB close in `start.ts` graceful shutdown handler.
- Build passes cleanly across all packages.
- **Verdict: approved.**

---

## 2026-03-31 — SDK.V2.1: Create persistent SDK session manager

**Task:** Create a long-lived V2 SDK session singleton for discovery and Pico backbone.

**Done:**
- Created `packages/backend/src/agent/sdk-session.ts`:
  - `getSdkSession()`: lazy singleton — creates session on first call, returns cached instance thereafter
  - Uses `unstable_v2_createSession()` with sonnet model, bypassPermissions mode, core tools (Read, Glob, Grep, Bash, WebSearch)
  - Deduplicates concurrent init calls via `initPromise`
  - `createSessionWithRetry()`: exponential backoff (1s, 2s, 4s), max 3 retries
  - Reads first message from `session.stream()` to initialize and capture `sessionId`
  - `closeSdkSession()`: closes session cleanly, called during shutdown
  - `reconnectSdkSession()`: tries to resume existing session via `unstable_v2_resumeSession()`, falls back to new session
  - `getSdkSessionId()`, `isSdkSessionReady()`: read-only state accessors
  - API key check: skips session creation if no key configured (logs warning)
  - All lifecycle events logged with session ID and attempt number
- Updated `packages/backend/src/start.ts`:
  - Added `closeSdkSession()` to graceful shutdown handler (before DB close)
  - Imported from new sdk-session module

**Files created:** `packages/backend/src/agent/sdk-session.ts`
**Files modified:** `packages/backend/src/start.ts`

**Notes for next agent:** SDK.V2.2 should use `getSdkSession()` to implement the capabilities discovery endpoint. The session is lazy — it's NOT created on server startup but on first access. This means no startup delay if no one calls discovery or Pico. SDK.V2.3 should refactor Pico's chat route to use `session.send()` + `session.stream()` instead of spinning up a new `query()` per message. The session's `sessionId` can be retrieved via `getSdkSessionId()` for logging.

---

## 2026-03-31 — Review: PICO.10 (approved)

**Reviewed:** Pico personality polish and onboarding — welcome message, quick-action buttons, backend personality guidelines.
- Welcome message matches spec: "Woof! I'm Pico" + full description of project knowledge and assistance capabilities.
- 4 quick-action buttons exactly matching spec: "What's the project status?", "Explain the workflow", "Show recent activity", "Help me create a work item". Each with appropriate Lucide icon.
- Clicking a button calls `sendMessage(action.label)` which correctly triggers `ensureSession()` → session creation → SSE stream — works even on fresh state with no existing session.
- Buttons disabled during streaming via `disabled={isStreaming}`.
- `QUICK_ACTIONS` constant is clean and extensible.
- Backend personality: warm tone, dog puns limited ("once or twice per response at most"), technically accurate, honest when uncertain — matches spec.
- Personality injected as Chat Instructions alongside existing pico-skill.md — properly layered system prompt.
- Conventions followed: named exports, cn(), theme tokens, Lucide icons.
- Both frontend and backend builds pass cleanly.
- Verdict: **approved**
- **Sprint 18 (Pico) complete!** All PICO.5-10 reviewed and approved.

---

## 2026-03-31 — PICO.10: Polish Pico's personality and onboarding

**Task:** First-time welcome experience, quick-action suggestion buttons, personality guidelines.

**Done:**
- Updated `packages/frontend/src/features/pico/chat-panel.tsx`:
  - Enhanced empty state welcome message: "Woof! I'm Pico" + full welcome text from spec ("I know everything about this project — the architecture, the workflow, all the agents...")
  - Added 4 quick-action buttons below welcome: "What's the project status?" (BarChart3), "Explain the workflow" (GitBranch), "Show recent activity" (Activity), "Help me create a work item" (PenLine)
  - Each button: bordered, bg-background/50, hover to muted, icon + label, disabled during streaming
  - Clicking a suggestion calls `sendMessage(action.label)` — triggers real chat interaction
  - `QUICK_ACTIONS` constant with label + icon — easy to extend
  - Added lucide imports: BarChart3, GitBranch, Activity, PenLine
- Updated `packages/backend/src/routes/chat.ts`:
  - Expanded Chat Instructions with Pico personality guidelines
  - Warm, enthusiastic but not annoying tone
  - Occasional dog puns ("let me dig into that", "I'll fetch that for you", "sniffing through the codebase") — once or twice per response max
  - Technically accurate, uses real project data
  - Honest when uncertain

**Files modified:** `packages/frontend/src/features/pico/chat-panel.tsx`, `packages/backend/src/routes/chat.ts`

**Notes for next agent:** Sprint 18 (Pico) is now complete! All PICO.5-10 tasks done. The next sprint is Sprint 19: SDK Deep Integration. The Pico personality is injected via the chat route's system prompt sections — `pico-skill.md` for project knowledge, then Chat Instructions for personality. The quick-action buttons are in the `QUICK_ACTIONS` array in chat-panel.tsx — easy to add more.

---

## 2026-03-31 — Review: PICO.9 (approved)

**Reviewed:** Session management — dropdown, switching, title editing, clear all, backend PATCH route.
- All spec requirements met: dropdown shows last 10 sessions (sorted by most recent via backend `orderBy(desc(updatedAt))`), click to switch sessions triggers history load, "New chat" creates fresh session, "Clear all sessions" deletes all with red styling.
- Session title editable: "Rename current chat" opens inline input, Enter/Escape/blur all handled. Minor note: Enter+blur can double-fire renameSession (same title sent twice) — cosmetic, not a bug.
- Backend PATCH route: validates existence, trims title to 100 chars, returns serialized session, follows existing route patterns.
- `refreshSessions()` called at correct points: panel open, after new session, after sendMessage completes (picks up auto-generated title).
- `currentSession` derived from sessions list — properly null when no match.
- Click-outside handler updated to exclude dropdown via `data-slot` selector — prevents panel dismiss during dropdown interaction.
- `formatSessionDate()` handles all time ranges (now/m/h/d/date) correctly.
- Uses shadcn DropdownMenu (existing component), cn(), theme tokens — conventions followed.
- Both frontend and backend builds pass cleanly.
- Verdict: **approved**

---

## 2026-03-31 — PICO.9: Add session management

**Task:** Session dropdown, switching, title editing, clear all.

**Done:**
- Updated `packages/frontend/src/hooks/use-pico-chat.ts`:
  - Added `sessions` state (list of `ChatSession[]`), populated via `refreshSessions()`
  - `refreshSessions()`: fetches session list from `getChatSessions()`, called on panel open and after creating/completing messages
  - `switchSession(sessionId)`: switches to an existing session, triggers history load via existing `currentSessionId` effect
  - `renameSession(sessionId, title)`: calls `updateChatSessionTitle()`, updates local sessions list optimistically
  - `clearAllSessions()`: deletes all sessions, clears state
  - `currentSession`: derived from sessions list, exposes title/metadata for header
  - `newSession()` now also refreshes session list after creation
  - `sendMessage()` refreshes sessions after streaming completes (picks up auto-generated title from first message)
- Updated `packages/frontend/src/features/pico/chat-panel.tsx`:
  - Session dropdown in header using shadcn `DropdownMenu` — shows last 10 sessions sorted by most recent
  - Each session item: `MessageSquare` icon, truncated title, relative time (now/5m/2h/3d/Mar 5)
  - Active session highlighted with `bg-accent`
  - "Rename current chat" option opens inline title editor (input with check button, Enter to save, Escape to cancel, blur to save)
  - "Clear all sessions" with red styling + Trash2 icon
  - Click-outside handler updated: dropdown menu content excluded from panel dismiss via `data-slot` selector
  - Session title shown as dropdown trigger (chevron down icon), editable on click
  - `formatSessionDate()` helper for relative timestamps
- Added `PATCH /api/chat/sessions/:id` route in `packages/backend/src/routes/chat.ts`:
  - Accepts `{ title?: string }`, trims and caps at 100 chars
  - Returns serialized updated session
- Added `updateChatSessionTitle()` to `packages/frontend/src/api/client.ts` and re-exported from `api/index.ts`

**Files modified:** `packages/frontend/src/features/pico/chat-panel.tsx`, `packages/frontend/src/hooks/use-pico-chat.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`, `packages/backend/src/routes/chat.ts`

**Notes for next agent:** PICO.10 (personality polish) should add quick-action suggestion buttons to the empty state in `chat-panel.tsx`. The session management is complete — session titles auto-generate from first user message (backend logic), can be renamed via dropdown → "Rename current chat", and sessions can be switched or cleared. The `formatSessionDate()` helper is already in chat-panel.tsx for relative time display.

---

## 2026-03-31 — Review: PICO.8 (approved)

**Reviewed:** Streaming chat hook, pico-store session state, chat panel wiring, API client chat functions.
- All spec requirements met: `use-pico-chat.ts` manages session lifecycle, SSE streaming, message state, error handling with retry.
- `sendMessage()` correctly: creates session on-demand via `ensureSession()`, adds user message optimistically, POSTs to SSE endpoint, incrementally builds ContentBlock array from events (text, thinking, tool_use, tool_result).
- SSE parser: async generator with buffer handling, correctly processes partial chunks and remaining buffer.
- `dbMessageToPico()`: reconstructs ContentBlock array from DB metadata (thinking blocks, tool calls, text) for history loading.
- Session restored on panel open via `getChatSessions()`, persisted via Zustand `currentSessionId`.
- Chat panel: empty state with Pico avatar/welcome, loading spinner, error banner with retry, typing indicator when streaming + empty content.
- API client functions follow existing patterns (get/post/del helpers, typed responses). `sendChatMessageSSE()` returns abort-capable fetch.
- Minor note: `toolCallMap` in sendMessage is declared but unused (pairing uses `lastToolCallIndex` instead) — dead code, not a bug.
- Conventions followed: named exports, kebab-case, cn(), theme tokens, TypeScript strict.
- Build passes cleanly.
- Verdict: **approved**

---

## 2026-03-31 — PICO.8: Wire chat panel to streaming API

**Task:** Replace mock data with real API-driven chat — SSE streaming, session management, error handling.

**Done:**
- Created `packages/frontend/src/hooks/use-pico-chat.ts`:
  - `usePicoChat()` hook managing: messages state, streaming state, error state, session lifecycle
  - `sendMessage(content)`: creates session on-demand, adds user message optimistically, POSTs to `/api/chat/sessions/:id/messages`, consumes SSE stream, incrementally builds assistant message content blocks (text, thinking, tool_use, tool_result)
  - `newSession()`: creates fresh session, clears messages
  - `retry()`: resends last user message after error, removes failed assistant response
  - SSE parser: async generator consuming `ReadableStream` byte-by-byte, yielding typed events
  - `dbMessageToPico()`: converts DB ChatMessage (with metadata) back to `PicoChatMessage` with reconstructed ContentBlock array (thinking blocks, tool calls, text)
  - Auto-loads history when `currentSessionId` changes
  - Auto-restores last session when panel opens (from getChatSessions)
  - Unread notification: sets `hasUnread` when response arrives while panel is closed
- Updated `packages/frontend/src/features/pico/pico-store.ts`:
  - Added `currentSessionId: ChatSessionId | null` to persisted state
  - Added `setCurrentSessionId()` action
- Updated `packages/frontend/src/features/pico/chat-panel.tsx`:
  - Replaced `MOCK_MESSAGES` + `useState` with `usePicoChat()` hook
  - Added empty state (Pico avatar + welcome text) when no messages
  - Added loading spinner for history loading
  - Added error banner with retry button (red border, AlertCircle icon)
  - Typing indicator now only shows when streaming and assistant content is empty
  - Wired "New session" button to `newSession()`
  - Header shows "Chat" when messages exist, "New conversation" when empty
- Added chat API functions to `packages/frontend/src/api/client.ts`:
  - `getChatSessions()`, `createChatSession()`, `deleteChatSession()`, `getChatMessages()`
  - `sendChatMessageSSE()`: returns `{ response: Promise<Response>, abort: () => void }` for SSE streaming with abort support
- Re-exported from `packages/frontend/src/api/index.ts` and `packages/frontend/src/hooks/index.ts`

**Files created:** `packages/frontend/src/hooks/use-pico-chat.ts`
**Files modified:** `packages/frontend/src/features/pico/chat-panel.tsx`, `packages/frontend/src/features/pico/pico-store.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`, `packages/frontend/src/hooks/index.ts`

**Notes for next agent:** The SSE event types match the backend's `sendSSE()` calls in `packages/backend/src/routes/chat.ts`: `text`, `thinking`, `tool_use`, `tool_result`, `error`, `done`. The `tool_result` event is paired with the most recent `tool_use` by order (not by ID) since the backend doesn't include the tool call ID in the result event. PICO.9 will add session switching dropdown in the header — `getChatSessions()` and `deleteChatSession()` are already exported. PICO.10 should add suggested quick-action buttons to the empty state.

---

## 2026-03-31 — Review: PICO.7 (approved)

**Reviewed:** Chat message components — chat-message.tsx, chat-panel.tsx updates.
- All spec requirements met: user bubbles (right, primary), assistant bubbles (left, muted + avatar), markdown, thinking blocks, tool cards, code blocks with copy, timestamps on hover, grouping.
- `PicoMarkdown` extends MarkdownPreview patterns with chat-appropriate styling: paragraphs, bold, inline code, lists, headers, links, code blocks with language label and copy button.
- `ThinkingBlock`: collapsible with Brain icon, collapsed by default, muted italic text — correct.
- `ToolCallCard`: reuses icon map from agent-monitor, status indicators (running/success/error), collapsible input/output — theme tokens used (not hardcoded zinc colors).
- Grouping logic in chat-panel: `showAvatar` based on previous message role, `mt-1` vs `mt-3` spacing, `pl-9` indent for grouped messages.
- Rich mock data demonstrates all content types: plain text, thinking + tool_use + markdown with embedded code block.
- Conventions followed: named exports, kebab-case, cn(), theme tokens, feature collocation.
- Build passes cleanly.
- Verdict: **approved**

---

## 2026-03-31 — PICO.7: Build chat message components

**Task:** Create rich chat message components with markdown, thinking blocks, tool call cards, and grouping.

**Done:**
- Created `packages/frontend/src/features/pico/chat-message.tsx`:
  - `PicoChatMessage` type with `ContentBlock` union: `text`, `thinking`, `tool_use`
  - `ChatMessage` component: user messages (right-aligned, primary bg), assistant messages (left-aligned, muted bg with Pico avatar)
  - `showAvatar` prop for consecutive message grouping — only first in group shows avatar
  - Timestamp shown on hover via group-hover opacity transition
  - `PicoMarkdown` renderer (extends MarkdownPreview patterns): paragraphs, bold, inline code, bullet lists, headers, links, code blocks with copy button and language label
  - `ThinkingBlock`: collapsible accordion with Brain icon, "Pico is thinking..." label, collapsed by default
  - `ToolCallCard`: compact collapsible card with tool icon (reuses icon map from agent-monitor), status indicator (running/success/error), expandable input/output — uses theme tokens for chat context
  - `CodeBlock`: copy-to-clipboard button, language label, monospace rendering
  - `MOCK_MESSAGES` export: 3 messages demonstrating all content types (plain text, thinking + tool_use + rich markdown with code block)
- Updated `packages/frontend/src/features/pico/chat-panel.tsx`:
  - Replaced inline message rendering with `ChatMessage` component
  - Added grouping logic: consecutive same-role messages get `mt-1` gap, different-role get `mt-3`
  - Imported `PicoChatMessage` type and `MOCK_MESSAGES` from chat-message

**Files created:** `packages/frontend/src/features/pico/chat-message.tsx`
**Files modified:** `packages/frontend/src/features/pico/chat-panel.tsx`

**Notes for next agent:** PICO.8 will replace `MOCK_MESSAGES` with real API data. The `ContentBlock` type maps to SSE event types from the backend streaming endpoint (text, thinking, tool_use). The `PicoChatMessage` interface should align with what `use-pico-chat.ts` builds from streamed events. PICO.9 needs session management in the panel header.

---

## 2026-03-31 — Review: PICO.6 (approved)

**Reviewed:** Chat panel — chat-panel.tsx, root-layout.tsx, index.css.
- All spec requirements met: 400px x 500px panel, rounded-xl + shadow-lg, header with Pico avatar/title/minimize/new-session, scrollable messages with auto-scroll, textarea + Send + Cmd+Enter, typing indicator, click-outside dismiss, scale+opacity animation.
- Good responsive handling: width/height caps prevent overflow on small screens.
- Mock data layer correctly drives the UI (3 messages, proper roles).
- Conventions followed: named exports, kebab-case, cn(), theme tokens for dark mode, feature collocation.
- Click-outside handler correctly excludes chat bubble via aria-label selector.
- Focus management: textarea focuses on open with cleanup timer.
- Streaming stubs in place for PICO.8 (isStreaming state, disabled input, typing indicator).
- Build passes cleanly.
- Verdict: **approved**

---

## 2026-03-31 — PICO.6: Build chat panel

**Task:** Create the Pico chat panel that opens above the floating bubble.

**Done:**
- Created `packages/frontend/src/features/pico/chat-panel.tsx`:
  - 400px wide, 500px tall panel fixed at `bottom-24 right-6` (above the bubble), `z-50`
  - Responsive: `max-w-[calc(100vw-3rem)]`, height capped at `calc(100vh-8rem)`
  - Header: Pico avatar (amber circle + Dog icon), "Pico" label, session title ("New conversation" placeholder), Plus (new session stub for PICO.9), X (minimize)
  - Message area: `ScrollArea` with auto-scroll to bottom on new messages
  - Mock messages (3): Pico greeting, user question, Pico response — drives UI during development
  - User messages: right-aligned, primary color bg. Pico messages: left-aligned, muted bg
  - Input area: textarea (1 row, resizable-none) + Send button, Cmd+Enter to send
  - Disabled state when `isStreaming` (controlled by PICO.8 later)
  - Keyboard hint: ⌘ ↵ to send
  - Typing indicator: three bouncing dots component (ready for streaming state)
  - Click-outside-to-dismiss with chat bubble exclusion
  - Focus textarea on panel open (200ms delay for animation)
  - Reads `isOpen` from `usePicoStore`, returns null when closed
- Added CSS animations to `index.css`:
  - `@keyframes pico-panel-in`: scale(0.95)+translateY(8px) → scale(1)+translateY(0), 0.2s ease-out
  - `@keyframes pico-dot`: bouncing dot opacity 0.3→1, translateY(0)→-4px, 1.2s infinite with staggered delays
- Added `<ChatPanel />` to `root-layout.tsx` before `<ChatBubble />`

**Files created:** `packages/frontend/src/features/pico/chat-panel.tsx`
**Files modified:** `packages/frontend/src/layouts/root-layout.tsx`, `packages/frontend/src/index.css`

**Notes for next agent:** The panel uses mock messages. PICO.7 will create proper message components (markdown, thinking, tool cards). PICO.8 will wire `sendMessage` to the streaming API and control `isStreaming`. PICO.9 will implement the new session button and session title dropdown. The `ChatMessage` interface is defined locally — PICO.7/8 may want to move it to a shared location.

---

## 2026-03-31 — Review: PICO.5 (approved)

**Reviewed:** Floating chat bubble — chat-bubble.tsx, pico-store.ts, root-layout.tsx, index.css.
- All spec requirements met: 56px amber circle, Dog icon, fixed bottom-right, bounce animation, unread dot, toggle open/closed.
- Zustand + persist store correctly clears `hasUnread` on open, exposes `setHasUnread` for future PICO.8 wiring.
- Conventions followed: named exports, kebab-case files, feature collocation, TypeScript interface, aria-label accessibility.
- Keyframe animation added consistently alongside existing `animate-slide-down`.
- ChatBubble rendered in root-layout after ToastRenderer — correct placement.
- Build passes cleanly.
- Verdict: **approved**

---

## 2026-03-31 — PICO.5: Build floating chat bubble

**Task:** Create a floating chat bubble for Pico, available on every page.

**Done:**
- Created `packages/frontend/src/features/pico/chat-bubble.tsx`:
  - 56px circular button fixed at `bottom-6 right-6` with `z-50`
  - Amber `#f59e0b` background (Pico's avatar color), white Dog icon (lucide-react)
  - `hover:scale-110` / `active:scale-95` for interaction feedback
  - Unread dot indicator (destructive color, 3.5px) visible when `hasUnread && !isOpen`
  - Bounce-in animation on first load via custom `animate-pico-bounce-in`
  - Toggles chat open/closed via `usePicoStore().toggleOpen`
- Created `packages/frontend/src/features/pico/pico-store.ts`:
  - Zustand + persist store (key: `pico-chat`)
  - `isOpen`, `hasUnread` state
  - `setOpen` clears unread when opening, `toggleOpen` does the same
- Added `@keyframes pico-bounce-in` to `index.css`: scale 0.3→1.1→0.9→1 over 0.5s
- Added `<ChatBubble />` to `root-layout.tsx` after `<ToastRenderer />`

**Files created:** `packages/frontend/src/features/pico/chat-bubble.tsx`, `packages/frontend/src/features/pico/pico-store.ts`
**Files modified:** `packages/frontend/src/layouts/root-layout.tsx`, `packages/frontend/src/index.css`

**Notes for next agent:** The bubble toggles `isOpen` in the store. PICO.6 (chat panel) should read `isOpen` from `usePicoStore()` to show/hide itself. The `hasUnread` flag should be set by the streaming hook (PICO.8) when Pico responds and the panel is closed.

---

## 2026-03-31 — Review: PICO.4 (approved)

**Reviewed:** Pico project knowledge skill file + injection into system prompt.
- Skill file at correct path (`agent/pico-skill.md`), ~526 words / ~700 tokens — well under 1500 limit.
- Content covers all spec requirements: AgentOps description, 8 workflow states (verified against `workflow.ts`), 5 personas (matches `default-personas.ts`), 7-step lifecycle, execution history, 5 Q&A pairs, docs/ pointer.
- Transition description accurate: happy path (Backlog > Planning > Ready > In Progress > In Review > Done) + side paths (Decomposition, Blocked).
- Injected at module level in chat.ts via `readFileSync` — loaded once, cached. Graceful fallback if file missing.
- Seed prompt fixes: "Triage" → "Backlog" corrected, docs/ directory instruction added.
- Build passes.
- Verdict: **approved**

---

## 2026-03-31 — PICO.4: Author Pico's project knowledge skill

**Task:** Create skill file teaching Pico about AgentOps, inject into system prompt.

**Done:**
- Created `packages/backend/src/agent/pico-skill.md` (~526 words, ~700 tokens — well under 1500 limit):
  - What AgentOps is (1 paragraph)
  - All 8 workflow states with descriptions and transition flow
  - 5 workflow personas table (name, role, model)
  - Work item lifecycle (7 steps from creation to completion)
  - Execution history explanation
  - Common user questions (5 Q&A pairs: create item, trigger agent, stuck item, blocked meaning, change persona)
  - Pointer to `docs/` directory for deeper questions
- Updated `packages/backend/src/routes/chat.ts`:
  - Reads `pico-skill.md` at module load time (single read, cached)
  - Injects skill content into Pico's system prompt between personality and project context sections
  - Graceful fallback if skill file missing
- Updated `packages/backend/src/db/seed.ts`:
  - Fixed Pico system prompt: "Triage" → "Backlog" (correct state name)
  - Added docs/ directory instruction to Guidelines section

**Files created:** `packages/backend/src/agent/pico-skill.md`
**Files modified:** `packages/backend/src/routes/chat.ts`, `packages/backend/src/db/seed.ts`

**Notes for next agent:** The skill file is loaded once at module level — no file I/O per request. The `docs/` directory instruction is in both the seed system prompt and the skill file, giving Pico clear guidance to look there.

