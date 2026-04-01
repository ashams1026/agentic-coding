# Dedicated Agent Chat Page — UX Design Research

Design research for a full-page chat experience that supports conversing with any persona, not just Pico.

**Current state:** The `/chat` page (`pages/chat.tsx`) and mini overlay panel (`features/pico/chat-panel.tsx`) are hardcoded to Pico. Sessions are project-scoped but persona-agnostic — the backend finds Pico via `settings.isAssistant === true`. No `personaId` FK on `chat_sessions`. The chat hook (`use-pico-chat.ts`) has no persona selection.

---

## 1. Page Structure

### Layout: Sidebar + Main Chat Area

```
+------------------+------------------------------------------------+
| Session Sidebar  |  Chat Area                                     |
| (280px)          |                                                |
|                  |  [Persona Avatar] Engineer — project-x          |
| [+ New Chat]     |  Session: "Fix auth bug"                       |
| [Persona Filter] |                                                |
|                  |  +-----------------------------------------+    |
| -- Today --      |  | Message bubbles                         |    |
| > Fix auth bug   |  | ...                                     |    |
|   (Engineer)     |  | ...                                     |    |
| > Review PR #42  |  +-----------------------------------------+    |
|   (Code Reviewer)|                                                |
|                  |  [Input area]                                   |
| -- Yesterday --  |  ⌘+Enter to send                              |
| > Plan sprint    |                                                |
|   (Tech Lead)    |                                                |
+------------------+------------------------------------------------+
```

### Session sidebar

- **New Chat button** at top — opens persona selector (see below)
- **Persona filter** — dropdown or toggle pills to filter sessions by persona (All, Pico, Engineer, etc.)
- **Session list** grouped by date (Today, Yesterday, This Week, Older)
- Each session row shows:
  - Session title (editable on double-click, as today)
  - Persona name and avatar color dot (small, next to title)
  - Timestamp (relative: "2h ago", "Yesterday")
- **Active session** highlighted with muted background
- **Context menu** (right-click or `...` button): Rename, Archive, Delete

### Main chat area

- **Header bar**: Persona avatar (colored circle + icon) + persona name + project scope badge + session title
- **Message area**: Scrollable, auto-scroll on new messages, typing indicator
- **Input area**: Textarea with `Cmd+Enter` to send. Persona-aware placeholder: "Ask [Persona Name] anything..."

### Persona selector (New Chat flow)

When clicking "New Chat":
1. Show a modal/popover with persona grid:
   - Each persona card: avatar (colored circle + icon), name, one-line description, model badge
   - Pico highlighted as "Quick Assistant" at the top
   - Workflow personas below: Engineer, Code Reviewer, Tech Lead, Product Manager
   - User-created personas at the bottom
2. Clicking a persona creates a new session with that persona and navigates to it
3. Optionally, user types a message directly — first message becomes the session title

**Alternative: Per-persona channels (rejected)**

Giving each persona its own "channel" (like Slack DMs) was considered but rejected:
- Too rigid — users want ad-hoc conversations, not permanent channels
- A user might want 5 different conversations with the Engineer for different tasks
- Session-based model (like ChatGPT) is more flexible and familiar

---

## 2. Relationship to Pico

### Recommendation: Pico is a special case of agent chat

Pico is the default assistant persona. The chat page subsumes Pico's role:
- Pico sessions appear in the chat page sidebar alongside other persona sessions
- Pico retains its special status: quick-access via the mini overlay panel + floating bubble
- The mini panel remains for quick questions — clicking "Expand" navigates to `/chat` with that session

### What changes vs. what stays

| Feature | Mini panel (Pico) | Full chat page |
|---------|------------------|----------------|
| Persona | Pico only | Any persona |
| Sessions | Dropdown (10 recent) | Full sidebar with filter |
| Message rendering | Compact (StatusLine) | Rich (expandable blocks, full tool cards) |
| Navigation | Overlay on any page | Dedicated `/chat` route |
| Quick access | Floating bubble | Sidebar nav link |
| New session | Auto-creates | Persona selector |

### Migration path

1. **Phase 1:** Add `personaId` to sessions. `/chat` page shows all sessions (Pico + others). Mini panel still Pico-only.
2. **Phase 2:** Add persona selector to `/chat`. Users can start conversations with any persona.
3. **Phase 3:** Mini panel gets optional persona switching (stretch goal — may add complexity without clear value).

---

## 3. Scoping — Project vs. Global Context

### Rules

| Scenario | Context injected | How user knows |
|----------|-----------------|----------------|
| Chatting with a persona while a project is selected | Project context (name, path, description) injected into system prompt. Agent has access to project files via tools. | Project name badge in chat header: "[project-x]" |
| Chatting with a persona with no project selected | No project context. Agent has no file access. General knowledge only. | Header shows "Global" or no project badge. |
| Switching projects mid-conversation | New messages get new project context. Old messages retain their original context. | Project badge updates. System message: "Context switched to [project-y]" |

### UI indicators

- **Project badge** in the chat header, next to persona name: `[tictactoe]` in muted style
- **System message** when project context changes mid-conversation
- **Persona description** visible in header tooltip — helps user understand what this persona can do
- **Tool availability** implied by persona config — the Engineer has file tools, the PM doesn't. No need to show this explicitly.

### Who can be chatted with?

All personas are available for chat, but some are more useful than others:
- **Pico** — general assistant, always available
- **Engineer, Tech Lead, Code Reviewer, Product Manager** — workflow personas, useful for ad-hoc work outside the workflow
- **Router** — system persona, hidden from chat (no value in chatting with the routing logic)
- **User-created personas** — available if they have a `systemPrompt`

Filter: Hide personas with `settings.isRouter === true` from the chat persona picker.

---

## 4. Session Management

### Creating sessions

- **Explicit:** Click "New Chat" → select persona → optionally type first message
- **Implicit:** If the user navigates to `/chat` with no active session, show the persona selector as the main content (empty state)
- **From persona manager:** Each persona card/detail gets a "Chat" button that navigates to `/chat` and creates a new session with that persona
- **From command palette:** `Cmd+K` → "Chat with [Persona Name]" → creates session and navigates

### Resuming sessions

- Click any session in the sidebar to load its history
- Sessions persist across browser refreshes (stored in DB, loaded via API)
- Session list sorted by `updatedAt` (most recently active first)

### Naming sessions

- **Auto-title:** First user message, truncated to 40 chars + "..."
- **Manual rename:** Double-click session title in sidebar (existing behavior)
- **AI-generated title (future):** After first exchange, ask the model to generate a concise title

### Archiving / Deleting

- **Archive:** Hides from sidebar but preserves data. Accessible via "Show archived" toggle.
- **Delete:** Permanent removal with confirmation dialog. Cascades to all messages.
- **Bulk operations:** "Clear all sessions" button (existing). Could add "Archive all" for persona.

---

## 5. Navigation — How Users Get Here

### Entry points

| Entry point | Action | Notes |
|-------------|--------|-------|
| **Sidebar nav** | Click "Chat" link | Already exists — navigates to `/chat` |
| **Mini panel expand** | Click `Maximize2` button | Already exists — navigates to `/chat` with current session |
| **Command palette** | `Cmd+K` → "New chat" or "Chat with [name]" | New — creates session and navigates |
| **Persona manager** | "Chat" button on persona card | New — creates session with that persona |
| **Work item detail** | "Discuss with [persona]" action | Future — creates session with context from work item |

### URL structure

```
/chat                    — chat page, shows last active session or empty state
/chat?session=<id>       — chat page with specific session selected
```

No need for persona in the URL — the persona is a property of the session, not the page.

### Back navigation

- Clicking "Minimize" in the chat header returns to the previous page and reopens the mini panel (existing behavior)
- Standard browser back button works
- Session state is preserved — returning to `/chat` resumes where the user left off

---

## 6. Empty States

### No sessions at all

Show a welcome screen:
- Large persona grid (same as the "New Chat" flow)
- Headline: "Start a conversation"
- Subtitle: "Pick a persona to chat with, or start with Pico for quick assistance"
- Pico card is prominent / highlighted

### Session selected but no messages

Show the persona's identity and prompt:
- Persona avatar (large), name, description
- Suggested prompts based on persona role:
  - Pico: "What's the project status?", "Show recent activity"
  - Engineer: "Write a function that...", "Fix the bug in..."
  - Code Reviewer: "Review the changes in...", "Check this PR"

### Session with messages but persona was deleted

Show messages read-only with a warning banner: "This persona no longer exists. Messages are preserved but you cannot send new ones."

---

## 7. Design Decisions

### Session-based, not channel-based

Users create conversations as needed, like ChatGPT. Each session has one persona. This is simpler and more flexible than permanent per-persona channels.

### Persona immutable per session

Once a session is created with a persona, that persona is fixed for the session. No switching personas mid-conversation — that would invalidate the system prompt and confuse the context. To talk to a different persona, create a new session.

### Mini panel stays Pico-only

The mini overlay is for quick, lightweight interactions. Adding persona switching to it increases complexity without clear benefit. Users who want to chat with other personas use the full page.

### Project scope comes from global state, not per-session

The project context injected into the prompt comes from the currently-selected project in the sidebar selector. This matches the existing pattern and avoids per-session project tracking (which would complicate the schema).

Exception: If a session is created from a work item context, the project is fixed for that session (future feature, not in Phase 1).

---

## 8. Schema Changes Required

| Change | Details |
|--------|---------|
| Add `personaId` to `chat_sessions` | Optional FK to personas table. NULL = Pico (backwards compat). |
| Add persona info to session API responses | Include persona name, avatar, description in GET /api/chat/sessions |
| Update `POST /api/chat/sessions` | Accept optional `personaId` parameter |
| Update message endpoint | Load persona from session instead of hardcoding Pico lookup |

See RES.CHAT.DATA for full data model research.

---

## 9. Relationship to Other Research

| Topic | Relationship |
|-------|-------------|
| RES.CHAT.RICH | Rich message rendering is the content layer — this doc is the page/navigation layer |
| RES.CHAT.DATA | Data model underpins session/persona binding designed here |
| RES.WORKFLOW.EDGE §7 | Chat interaction with workflows — proposals for decisions, notes for context |
| RES.GLOBAL.UX | Global agent chat entry points — Pico scope toggle, command palette |
| UX.PICO.FULLPAGE | Already built — this extends it from Pico-only to multi-persona |
