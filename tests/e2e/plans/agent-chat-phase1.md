# Test Plan: Agent Chat Phase 1

## Objective

Verify the multi-persona chat system: persona selector, session management, sidebar enhancements, chat header, and persona-specific messaging.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with at least one project and multiple personas (including Pico)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail.

### TC-ACH-1: Persona selector grid on New Chat

1. **Navigate** to `http://localhost:5173/chat`
   - Verify: chat page loads with sidebar and message area
   - **Screenshot checkpoint**

2. **Click** the "+" (New Chat) button in the sidebar header
   - Verify: persona selector modal appears with overlay backdrop
   - Verify: personas displayed as cards in a grid (2-3 columns)
   - Verify: each card shows avatar (colored circle + icon), name, description, model badge
   - **Screenshot checkpoint**

3. **Verify Pico is highlighted** as default
   - Verify: Pico card has amber ring (`ring-2 ring-amber-500/30`) and "default" label
   - Verify: Router persona is NOT shown (system-only, filtered out)
   - Verify: cards sorted with Pico first, then alphabetically

4. **Click** a non-Pico persona card (e.g., "Engineer")
   - Verify: modal closes
   - Verify: new session created and selected in sidebar
   - Verify: session sidebar shows the selected persona's avatar next to the session title

5. **Press Escape** or click backdrop to close without selecting
   - Click "+" again, then press Escape
   - Verify: modal closes, no new session created

### TC-ACH-2: Session sidebar with persona avatars and date grouping

1. **Create** 2-3 chat sessions with different personas (use the "+" button)
   - Verify: each session appears in sidebar with persona avatar (colored circle + icon)
   - **Screenshot checkpoint**

2. **Verify date grouping**
   - Verify: sessions are grouped under "Today" header (since just created)
   - Verify: header text is uppercase, small, muted (text-[10px])

3. **Verify last message preview**
   - If a session has messages, verify a second line of truncated text appears below the title
   - If empty session, verify no preview line shown

### TC-ACH-3: Persona filter in sidebar

1. **Create sessions** with at least 2 different personas

2. **Locate** the persona filter dropdown (appears when 2+ personas used)
   - Verify: shows "All personas" by default
   - **Screenshot checkpoint**

3. **Click** the filter and select a specific persona
   - Verify: only sessions with that persona are shown
   - Verify: filter button shows the selected persona name

4. **Select** "All personas" again
   - Verify: all sessions reappear

### TC-ACH-4: Chat header bar

1. **Select** a chat session in the sidebar

2. **Verify header bar** appears above the message area
   - Verify: persona avatar (colored circle + icon) + persona name displayed
   - Verify: project badge shown (project ID or "Global" with globe icon)
   - Verify: session title displayed
   - **Screenshot checkpoint**

3. **Double-click** the session title in the header
   - Verify: title becomes an editable input field
   - Type a new name and press Enter
   - Verify: title updates in both header and sidebar

4. **Click** the three-dot menu (MoreVertical icon) in the header
   - Verify: dropdown appears with "Rename" and "Delete" options
   - **Screenshot checkpoint**

5. **Click** "Rename" from the menu
   - Verify: title becomes editable (same as double-click)

### TC-ACH-5: Session delete from header menu

1. **Click** the three-dot menu and select "Delete"
   - Verify: session is deleted immediately (no confirmation from header menu)
   - Verify: if it was the active session, another session is auto-selected (or empty state shown)
   - **Screenshot checkpoint**

### TC-ACH-6: Right-click context menu on sidebar sessions

1. **Right-click** a session in the sidebar
   - Verify: context menu appears at cursor position with "Rename" and "Delete" options
   - **Screenshot checkpoint**

2. **Click** "Rename"
   - Verify: session title becomes editable inline in the sidebar
   - Edit and press Enter to confirm

3. **Right-click** another session and select "Delete"
   - Verify: confirmation dialog appears with "Delete session?" title and warning text
   - Verify: Cancel and Delete buttons present
   - **Screenshot checkpoint**

4. **Click** "Delete" in the confirmation dialog
   - Verify: session removed from sidebar
   - Verify: if active session deleted, most recent remaining session auto-selected

5. **Click** "Cancel" in a new delete confirmation
   - Verify: dialog closes, session remains

### TC-ACH-7: Chat with non-Pico persona (API verification)

1. **Create** a new session with a non-Pico persona via the API:
   ```
   POST /api/chat/sessions
   Body: { "personaId": "<non-pico-persona-id>" }
   ```
   - Verify: 201 response with `personaId` set in the session

2. **Verify** session list includes persona data:
   ```
   GET /api/chat/sessions
   ```
   - Verify: response includes `persona: { name, avatar }` for each session
   - Verify: `lastMessagePreview` field present (null for empty sessions)

3. **Verify** messages endpoint includes session info:
   ```
   GET /api/chat/sessions/:id/messages
   ```
   - Verify: response includes `session` object with persona info

## Visual Quality

- Persona selector cards: consistent sizing, no overflow, model badges readable
- Sidebar avatars: properly sized (h-5 w-5), aligned with title text
- Date group headers: visually distinct from session items
- Chat header: persona avatar, name, badge, title all aligned, not overlapping
- Context menus: positioned at cursor, no clipping at screen edges
- Dark mode: all elements maintain contrast and readability

## Failure Criteria

- Any persona selector card with broken avatar or missing data → FAIL
- Sessions not grouped by date → FAIL
- Persona filter not filtering correctly → FAIL
- Chat header missing persona info or project badge → FAIL
- Delete not removing session from sidebar → FAIL
- Active session not auto-switching after delete → FAIL
