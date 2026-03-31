# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

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

---

## 2026-03-31 — Review: PICO.3 (approved)

**Reviewed:** Chat streaming endpoint — SSE-based Pico chat via Claude SDK.
- Route: `POST /api/chat/sessions/:id/messages` accepts `{ content }`, validates session + API key.
- User message saved to DB before streaming. Session title auto-generated from first message (40 char truncation).
- Pico persona loaded by `isAssistant` flag — consistent with PICO.1 pattern.
- System prompt: 3 sections (personality + project context + chat instructions). Conversation history assembled from all messages.
- SDK integration: `query()` with `agents`/`agent` pattern matching `claude-executor.ts`. MCP server path `../agent/mcp-server.ts` resolves correctly from `routes/`.
- SSE: correct headers (`text/event-stream`, `no-cache`, `keep-alive`), 6 event types (text, thinking, tool_use, tool_result, error, done).
- Assistant message saved with metadata (thinking blocks, tool calls, cost/duration) on completion.
- `maxBudgetPerRun` passed as dollars (correct — matches executor, not stored as cents).
- Build passes.
- Verdict: **approved**

---

## 2026-03-31 — PICO.3: Create chat streaming endpoint

**Task:** Add `POST /api/chat/sessions/:id/messages` — streaming endpoint for Pico chat.

**Done:**
- Added streaming endpoint to `packages/backend/src/routes/chat.ts`:
  - Accepts `{ content: string }`, validates session exists and API key is configured
  - Saves user message to DB immediately
  - Auto-generates session title from first user message (truncated to 40 chars)
  - Loads Pico persona (found by `isAssistant` flag) and project context
  - Assembles full conversation history as prompt for the SDK
  - Builds Pico system prompt: personality + project context + chat instructions
  - Spawns Claude via `query()` with Pico's tools (Read, Glob, Grep, WebSearch) and MCP server (list_items, get_context, post_comment)
  - Streams response via SSE: `text`, `thinking`, `tool_use`, `tool_result`, `error`, `done` event types
  - On completion, saves full assistant message with metadata (thinking blocks, tool calls, cost, duration) to DB
  - Sends final `done` event with `messageId` for the frontend to reference
- SDK integration: uses `AgentDefinition` + `query()` with `agents` pattern matching existing executor pattern
- Model mapping reused (opus/sonnet/haiku → full model IDs)

**Files modified:** `packages/backend/src/routes/chat.ts`

**Notes for next agent:** The SSE format is: `data: {"type":"text","content":"..."}\n\n`. Frontend (PICO.8) should use `EventSource` or fetch with streaming to consume these events. The `done` event signals stream completion. Error events include the error message in `content`. Session title auto-update happens on first message only.

---

## 2026-03-31 — Review: PICO.2 (approved)

**Reviewed:** Chat session API — routes, schema, shared types, server registration.
- 4 endpoints match spec: create, list (desc by updatedAt), get messages (asc by createdAt), delete (manual cascade + session delete).
- Schema: `chat_sessions` (5 cols, FK to projects), `chat_messages` (6 cols, FK with onDelete cascade, JSON metadata). Relations defined.
- Shared: `ChatSessionId` (`cs-`), `ChatMessageId` (`msg-`), entities + role type. Barrel exported.
- Serializers follow established pattern (toIso timestamps, typed IDs).
- Title defaults to "New chat" — auto-generation from first message deferred to PICO.3 (reasonable separation).
- Migration generated. Build passes.
- Verdict: **approved**

---

## 2026-03-31 — PICO.2: Create chat session API

**Task:** Add chat session DB tables and CRUD routes for Pico chat.

**Done:**
- `shared/ids.ts`: Added `ChatSessionId` (`cs-` prefix) and `ChatMessageId` (`msg-` prefix) types + `createId.chatSession()` / `createId.chatMessage()` factories.
- `shared/entities.ts`: Added `ChatSession` and `ChatMessage` interfaces, `ChatMessageRole` type.
- `backend/db/schema.ts`: Added `chatSessions` table (id, projectId, title, createdAt, updatedAt) and `chatMessages` table (id, sessionId, role, content, metadata JSON, createdAt). Messages cascade delete with session. Relations defined.
- `backend/routes/chat.ts`: Four endpoints:
  - `POST /api/chat/sessions` — create session with projectId
  - `GET /api/chat/sessions?projectId=` — list sessions (most recent first)
  - `GET /api/chat/sessions/:id/messages` — get message history
  - `DELETE /api/chat/sessions/:id` — delete session + messages
- `backend/server.ts`: Registered `chatRoutes`.
- Drizzle migration generated (`0002_military_shotgun.sql`).

**Files created:** `packages/backend/src/routes/chat.ts`, `packages/backend/drizzle/0002_military_shotgun.sql`
**Files modified:** `packages/shared/src/ids.ts`, `packages/shared/src/entities.ts`, `packages/backend/src/db/schema.ts`, `packages/backend/src/server.ts`

---

## 2026-03-31 — Review: PICO.1 (approved)

**Reviewed:** Pico built-in assistant persona across 6 files.
- `PersonaSettings` interface: `isSystem?`, `isAssistant?`, plus index signature for backward compat. `Persona.settings` typed to `PersonaSettings`. Clean.
- Seed data: `id: "ps-pico"`, amber `#f59e0b`, dog icon, sonnet, $5 budget, `{ isSystem: true, isAssistant: true }`. System prompt covers personality, knowledge, capabilities, and guidelines — good tone, not overdone.
- Default personas: Pico added to array, settings ternary `Router → isSystem` / `Pico → isSystem+isAssistant` / else `{}`. Correct.
- Detail panel: "Built-in assistant" subtitle, amber "Assistant" badge (distinct from blue "Built-in"), Edit button hidden via `!isAssistant`. Correct.
- Persona list: `isAssistant` prop, delete/duplicate conditionally hidden. Correct.
- Workflow config: `personas.filter((p) => !p.settings?.isAssistant)` — Pico excluded from assignment dropdowns. Correct.
- Build passes.
- Verdict: **approved**

---

## 2026-03-31 — PICO.1: Add Pico as built-in system persona

**Task:** Add Pico (dog-persona AI assistant) as a built-in, non-editable, non-deletable persona with `isAssistant` flag.

**Done:**
- `entities.ts`: Added `PersonaSettings` interface with `isSystem?` and `isAssistant?` fields. Changed `Persona.settings` from `Record<string, unknown>` to `PersonaSettings`.
- `seed.ts`: Added Pico persona (`id: "ps-pico"`, amber color, dog icon, sonnet model, $5 budget). Full system prompt establishing personality (friendly, dog-themed, technically accurate), knowledge (AgentOps architecture, workflow, personas), and capabilities (Read/Glob/Grep + MCP tools).
- `default-personas.ts`: Added Pico to `BUILT_IN_PERSONAS` array with `{ isSystem: true, isAssistant: true }` settings.
- `persona-detail-panel.tsx`: Assistant personas show "Built-in assistant" subtitle + amber "Assistant" badge. Edit button hidden for assistants.
- `persona-list.tsx`: Added `isAssistant` prop to `PersonaCard`. Delete/duplicate buttons hidden for assistant personas.
- `workflow-config-section.tsx`: Filtered assistant personas from state assignment dropdowns.

**Files modified:** `packages/shared/src/entities.ts`, `packages/backend/src/db/seed.ts`, `packages/backend/src/db/default-personas.ts`, `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`, `packages/frontend/src/features/persona-manager/persona-list.tsx`, `packages/frontend/src/features/settings/workflow-config-section.tsx`

---

## 2026-03-31 — Review: FX.9 (approved)

**Reviewed:** Activity feed enrichment in `activity-feed.tsx`.
- Base events: lookup maps from `useWorkItems`/`usePersonas` resolve persona names and work item titles. Graceful fallbacks (`"Agent"`, `"work item"`) when data not yet loaded. `targetLabel` also enriched.
- WS events: `wsEventToActivity` accepts `LookupMaps`, consistent format. `AgentStartedEvent` prefers `e.workItemTitle` then falls back to map lookup — good.
- Ref pattern in `useLiveActivityEvents`: `mapsRef.current = maps` avoids WS resubscription. Correct.
- Duplicate `useWorkItems`/`usePersonas` between `useBaseActivityEvents` and `ActivityFeed` is fine — TanStack Query deduplicates.
- All 5 event formats match task spec. Build passes.
- Verdict: **approved**

---

## 2026-03-31 — FX.9: Enrich activity feed event descriptions

**Task:** Replace generic "Agent started working on work item" descriptions with enriched ones using persona names and work item titles.

**Done:**
- `useBaseActivityEvents()`: Added `useWorkItems` and `usePersonas` queries. Built lookup maps (`itemMap`, `personaMap`) for name resolution. All event descriptions now use `[Persona Name] started work on [Work Item Title]` format. `targetLabel` also enriched from "work item" to actual title.
- `wsEventToActivity()`: Refactored to accept `LookupMaps` param. All live WS events now use same enriched format: `"Engineer started work on Implement auth"`, `"Router moved Login Feature from Triage to Implementing"`, etc.
- `useLiveActivityEvents()`: Accepts maps param, uses ref to avoid re-subscribing on map changes.
- `ActivityFeed()`: Builds shared `personaMap` and `itemTitleMap`, passes to both base and live event hooks.

**Enriched formats:**
- Agent started: `"[Persona] started work on [Title]"`
- Agent completed: `"[Persona] completed work on [Title] ($X.XX)"`
- Agent failed: `"[Persona] work rejected on [Title]"`
- State change: `"[Title] moved from [Old] to [New]"`
- Proposal: `"New [type] proposal for [Title]"`

**Files modified:** `packages/frontend/src/features/activity-feed/activity-feed.tsx`

---

## 2026-03-31 — Review: FX.EDIT1 (approved)

**Reviewed:** Optimistic list cache update in `use-work-items.ts`.
- `setQueriesData<WorkItem[]>({ queryKey: ["workItems"] }, ...)`: correctly updates all list query variants (any parentId/projectId combo) via prefix matching. The `old?.map()` callback safely maps over arrays and returns undefined for non-array entries (single-item queries also matched by prefix — harmless, TanQuery treats undefined as no-op).
- List queries cancelled before optimistic update — prevents stale refetch from overwriting.
- Error rollback: single-item reverted from context, lists invalidated to refetch truth. Correct approach.
- `onSettled` still invalidates both — ensures server data replaces optimistic data after mutation completes.
- Build passes.
- Verdict: **approved**

---

## 2026-03-31 — FX.EDIT1: Fix list row not updating when title edited

**Task:** List row showed old title after editing in detail panel. Panel updated immediately (optimistic) but list waited for refetch.

**Root cause:** `useUpdateWorkItem()`'s `onMutate` only optimistically updated the single-item cache (`["workItems", id]`). The list query (`["workItems", { parentId, projectId }]`) was only invalidated in `onSettled`, requiring a full refetch before updating.

**Fix:** In `onMutate`, added `queryClient.setQueriesData<WorkItem[]>({ queryKey: ["workItems"] }, ...)` to optimistically update ALL list queries containing the modified item. Also cancel list queries before optimistic update. On error, revert by invalidating list queries (forces refetch of server state).

**Files modified:** `packages/frontend/src/hooks/use-work-items.ts`

**Notes:** This pattern (optimistically updating both single-item and list caches) should be used for any mutation that affects items visible in list views. The `setQueriesData` with prefix `["workItems"]` matches all list variants regardless of filter params.

---

## 2026-03-31 — Review: FX.CMD1 (approved)

**Reviewed:** Command palette navigation fixes in `command-palette.tsx`.
- Work item selection: `setSelectedItemId(wi.id)` → `navigate("/items")` — correct pattern matching how the work items page reads selection from Zustand store. Detail panel will open for the selected item.
- `useWorkItemsStore` selector `(s) => s.setSelectedItemId` — stable ref, no unnecessary re-renders.
- NAV_ITEMS: all paths match actual routes. Stale "Story Board"/"/board" and non-existent "Workflow Designer" removed.
- ACTION_ITEMS: "Create work item" → "/items" — correct.
- Icons: `ListTodo` matches sidebar for Work Items. Unused imports removed.
- Build passes.
- Verdict: **approved**

---

## 2026-03-31 — FX.CMD1: Fix command palette work item navigation

**Task:** Clicking a work item in command palette navigated to `/work-items/:id` (404). Also had stale "Story Board" / `/board` references.

**Done:**
- Work item `onSelect`: now calls `setSelectedItemId(wi.id)` on the Zustand store before navigating to `/items` — opens the detail panel for that item
- NAV_ITEMS: "Story Board" → "Work Items", `/board` → `/items`, removed stale "Workflow Designer" entry
- ACTION_ITEMS: "Create story" → "Create work item", `/board` → `/items`
- Icons: `Kanban` → `ListTodo` for Work Items (matches sidebar), removed unused `GitBranch`/`Kanban` imports
- Added `useWorkItemsStore` import and `setSelectedItemId` to useMemo deps

**Files modified:** `packages/frontend/src/features/command-palette/command-palette.tsx`

**Notes:** There are still stale `/board` references in `empty-states.tsx` (3) and `use-toast-events.ts` (1). These are separate from the command palette and should get their own cleanup task.

---

## 2026-03-31 — Review: FX.AM1 (approved)

**Reviewed:** Agent monitor empty state button fix in `agent-monitor-layout.tsx`.
- Link target: `/board` → `/items` — correct route for Work Items page.
- Button text: "Go to Story Board" → "Go to Work Items" — matches the rename.
- Minimal 2-line change, no side effects. Build passes.
- Verdict: **approved**

---

## 2026-03-31 — FX.AM1: Fix agent monitor empty state button

**Task:** Change stale "Go to Story Board" button (links to `/board` — 404) to "Go to Work Items" linking to `/items`.

**Done:** Updated `agent-monitor-layout.tsx` line 30-31: `to="/board"` → `to="/items"`, "Go to Story Board" → "Go to Work Items".

**Files modified:** `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`

**Notes:** Found additional stale `/board` and "Story Board" references in: `command-palette.tsx` (2 entries), `empty-states.tsx` (3 entries), `use-toast-events.ts` (1 entry). These are separate bugs — not part of this task. The command palette is partially covered by FX.CMD1 but that task focuses on `/work-items/:id` navigation, not the `/board` reference. Consider adding a sweep task for remaining `/board` routes.

---

## 2026-03-31 — Review: FX.NAV2 (approved)

**Reviewed:** Sidebar navigation ground-up fix in `sidebar.tsx` and `index.css`.
- NavLink→Link swap with manual `isActive`: correct fix for Radix `asChild` incompatibility. `location.pathname === "/"` for exact match on Dashboard, `startsWith(to)` for all others — matches React Router's NavLink `end` behavior.
- `@layer base` wrapper on global `* { border-color }`: correct fix. Un-layered styles beat all `@layer` rules in CSS cascade. Wrapping in `@layer base` lets `@layer utilities` override it. No side effects — other borders still get the default from base, utilities still override when needed.
- `flex flex-col gap-1` on nav: better than `space-y-1` for explicit vertical stacking. `w-full` on links ensures no horizontal wrapping.
- All 8 task requirements met (20px icons, 224px width, hover/active states, rounded-md, badges, spacing, screenshot verification).
- Build passes.
- Verdict: **approved**

---

## 2026-03-31 — FX.NAV2: Redo sidebar navigation fix

**Task:** Ground-up fix for sidebar nav — icons stacked above labels, no hover/active states due to Radix `asChild` incompatibility with React Router's function-based `className`.

**Root causes found & fixed:**
1. **NavLink + Radix `asChild` incompatibility**: Radix's `Slot` component stringified React Router NavLink's function-based `className` prop instead of calling it, resulting in the literal function source code as the CSS class. Fix: replaced `NavLink` with `Link` + manual `isActive` computation using `useLocation()`.
2. **Global `* { border-color }` outside `@layer`**: Un-layered `* { border-color: hsl(var(--border)) }` in `index.css` had higher cascade priority than all `@layer utilities` rules, preventing any Tailwind border-color utility from working. Fix: wrapped in `@layer base {}`.
3. **Nav items not stacking**: Changed `<nav>` from `space-y-1` to `flex flex-col gap-1` with `w-full` on each link.
4. **Sidebar width**: Changed from 16rem (256px) to 14rem (224px) per task spec.
5. **Visual polish**: `rounded-md`, `hover:bg-muted`, `transition-colors duration-150`, 3px primary left border on active, `h-5 w-5` icons (20px).

**Files modified:** `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/index.css`

**Also in this commit:** Marked FX.SDK3-6 as blocked (depend on FX.SDK1's GET /api/sdk/capabilities endpoint).

**Verified:** Screenshots confirm icons inline with labels, active state (muted bg + dark left border + bold), hover state, collapsed mode, navigation switching active state correctly. Build passes.

---

## 2026-03-30 — Review: FX.SDK2 (approved)

**Reviewed:** SDK-native skill injection in `packages/backend/src/agent/claude-executor.ts`.
- `buildSystemPrompt()`: Section (5) "Persona skills" cleanly removed, sections renumbered (5→execution history). No dead code.
- Removed imports: `readFileSync`, `join`/`basename`, `logger` — all only used in removed section. Clean.
- `AgentDefinition` type imported from SDK — correct named export.
- Agent/agents pattern: `persona.id` as agent name, `AgentDefinition` includes `description`, `prompt`, `tools`, `model`, `maxTurns: 30`. Skills conditional spread: only added when non-empty. Clean.
- Top-level `query()` options: `agent` + `agents` properly wired. No duplication of `systemPrompt`/`model`/`tools` between levels. Process-level options (`permissionMode`, `mcpServers`, etc.) stay top-level. Correct.
- SDK's `skills` is on `AgentDefinition`, not top-level `Options` — `agent`/`agents` pattern is the correct approach.
- No migration needed: all existing skill values are `[]`.
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.SDK2: Replace custom skill injection with SDK native skills

**Task:** Remove manual skill file reading from `buildSystemPrompt()` and use the SDK's native `AgentDefinition.skills` field instead.

**Done:**
- **`claude-executor.ts`**: Removed section (5) "Persona skills" from `buildSystemPrompt()` — the manual `readFileSync` + 8K char cap logic that read `.md` files from disk and injected them into the system prompt
- Removed unused imports: `readFileSync` from `node:fs`, `join`/`basename` from `node:path`, `logger` from `../logger.js`
- Restructured `query()` call to use the `agent`/`agents` pattern: persona is defined as a named `AgentDefinition` with `description`, `prompt`, `tools`, `model`, `maxTurns`, and `skills`. The top-level `agent` option tells the SDK to use this definition as the main thread agent.
- When `persona.skills` is non-empty, the skill names are passed via `AgentDefinition.skills` — the SDK handles loading, tokenization, and context management natively
- Added `AgentDefinition` type import from the SDK
- No DB migration needed — all existing persona `skills` values are already `[]` (empty arrays)
- Build passes

**Files modified:** `packages/backend/src/agent/claude-executor.ts`

**Notes:** The SDK's `skills` field is on `AgentDefinition`, not top-level `Options`. Using the `agent`/`agents` pattern is the correct way to pass skills. Skills are now expected to be SDK skill names (e.g., `"commit"`, `"review-pr"`) not file paths. The frontend skill browser (FX.SDK4) will need updating to reflect this — currently it's a file browser for `.md` files. MCP servers remain at the top-level `Options` since they're process-wide configuration.

---

