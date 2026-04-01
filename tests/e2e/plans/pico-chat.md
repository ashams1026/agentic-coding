# Test Plan: Pico Chat

## Objective

Verify the full Pico chat UX — bubble, panel, messaging, streaming, session management, and error states.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api" (real backend)
- Database seeded with test data (including Pico persona with `isAssistant: true`)
- Anthropic API key configured in settings
- chrome-devtools MCP connected
- At least one project exists

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

### Part 1: Chat Bubble Visibility

1. **Navigate** to `http://localhost:5173/` (Dashboard)
   - Verify: page loads without errors
   - **Screenshot checkpoint:** Take screenshot, check layout

2. **Verify** Pico chat bubble is visible
   - Look for: circular amber/yellow button with Dog icon, fixed position bottom-right
   - Expected: `button[aria-label="Open Pico chat"]` visible at bottom-right corner
   - **Screenshot checkpoint:** Verify bubble does not overlap page content, has shadow, proper size (h-14 w-14)

3. **Navigate** to `http://localhost:5173/items` (Work Items)
   - Verify: chat bubble is still visible on this page
   - **Screenshot checkpoint:** Bubble persists across navigation

4. **Navigate** to `http://localhost:5173/agents` (Agent Monitor)
   - Verify: chat bubble is still visible
   - **Screenshot checkpoint:** Bubble visible on agent monitor page

5. **Navigate** to `http://localhost:5173/personas` (Persona Manager)
   - Verify: chat bubble is still visible
   - **Screenshot checkpoint:** Bubble visible on persona manager page

### Part 2: Panel Open/Close

6. **Click** the Pico chat bubble
   - Target: `button[aria-label="Open Pico chat"]`
   - Expected: chat panel slides in from bottom-right, below the bubble
   - **Screenshot checkpoint:** Panel is visible, properly positioned (fixed bottom-24 right-6), rounded corners, border, shadow

7. **Verify** panel structure
   - Look for: header with Pico avatar (amber), session title, close button (X icon), new chat button (+)
   - Expected: header bar with Dog icon, "New conversation" or session title, action buttons
   - **Screenshot checkpoint:** Header layout, icon alignment, button sizing

8. **Verify** empty state with quick actions
   - Look for: 4 quick action buttons when no messages exist: "What's the project status?", "Explain the workflow", "Show recent activity", "Help me create a work item"
   - Expected: centered quick action buttons with icons (BarChart3, GitBranch, Activity, PenLine)
   - **Screenshot checkpoint:** Quick action layout, icon alignment, text readability

9. **Click** the close button (X)
   - Target: close button in panel header
   - Expected: panel disappears, bubble remains visible
   - **Screenshot checkpoint:** Panel closed, bubble still at bottom-right

10. **Click** the bubble again to reopen
    - Expected: panel reopens with same state (empty conversation)
    - **Screenshot checkpoint:** Panel reopens correctly

### Part 3: Quick Action Messaging

11. **Click** a quick action button — "What's the project status?"
    - Target: quick action button with text "What's the project status?"
    - Expected: message sends immediately, quick actions disappear, user message appears as a right-aligned bubble
    - **Screenshot checkpoint:** User message bubble styling, alignment

12. **Verify** streaming response
    - Look for: typing indicator (three bouncing dots) appears while Pico responds
    - Expected: dots animation visible, then text starts streaming in
    - **Screenshot checkpoint:** Capture during streaming if possible, or after first text appears

13. **Wait** for Pico response to complete
    - Expected: assistant message appears as left-aligned bubble, typing indicator disappears
    - **Screenshot checkpoint:** Full response visible, markdown renders correctly, message alignment

### Part 4: Manual Message Input

14. **Verify** textarea is present and focused
    - Look for: textarea at bottom of panel with send button
    - Expected: textarea with placeholder, Cmd+Enter hint, Send button (arrow icon)
    - **Screenshot checkpoint:** Input area layout, send button positioning

15. **Type** "How many work items are in the Ready state?" into the textarea
    - Target: textarea in the chat input area
    - Expected: text appears in textarea, Send button becomes active

16. **Press** Cmd+Enter to send
    - Expected: message sends, textarea clears, user message appears in conversation
    - **Screenshot checkpoint:** New user message added to conversation thread

17. **Wait** for Pico response
    - Expected: typing indicator → streaming text → complete response
    - **Screenshot checkpoint:** Response with any markdown formatting, code blocks, lists

### Part 5: Markdown & Content Rendering

18. **Verify** markdown rendering in Pico responses
    - Check: any bold text, code blocks, bullet lists, or links render with proper formatting
    - Expected: markdown is not displayed as raw text — `**bold**` shows as **bold**, code blocks have syntax highlighting or monospace font
    - **Screenshot checkpoint:** Markdown rendering quality

19. **Verify** thinking blocks (if present)
    - Look for: collapsible thinking block sections in responses
    - Expected: if Pico used extended thinking, blocks are collapsed by default with a toggle to expand
    - Note: thinking blocks may not appear depending on Pico's model config — skip if not present

20. **Verify** tool call cards (if present)
    - Look for: tool use indicators in the response (e.g., "Read", "Grep" tool calls)
    - Expected: tool calls render as distinct cards/sections showing tool name and input
    - Note: tool calls may not appear for simple questions — skip if not present

### Part 6: Session Management

21. **Click** the "+" (new session) button
    - Target: Plus icon button in panel header
    - Expected: new empty conversation created, quick actions reappear, previous session preserved
    - **Screenshot checkpoint:** Clean empty state in new session

22. **Type** "Hello Pico" and send
    - Expected: message sends, session title auto-updates to "Hello Pico" (first message becomes title)
    - **Screenshot checkpoint:** Session title changed from "New conversation"

23. **Verify** session switcher
    - Look for: session dropdown or history list showing multiple sessions
    - Target: click the session title area or dropdown trigger with ChevronDown icon
    - Expected: dropdown shows at least 2 sessions — current "Hello Pico" and previous session
    - **Screenshot checkpoint:** Session list layout, timestamps, truncated titles

24. **Switch** to the previous session
    - Target: click the other session in the dropdown
    - Expected: conversation history loads for the previous session with earlier messages intact
    - **Screenshot checkpoint:** Previous messages visible, correct sender alignment

25. **Switch** back to "Hello Pico" session
    - Expected: the "Hello Pico" conversation reloads with its history
    - **Screenshot checkpoint:** Correct session loaded

### Part 7: Session Title Editing

26. **Double-click** (or click) the session title
    - Expected: title becomes editable (inline input replaces text)
    - **Screenshot checkpoint:** Editable title input

27. **Type** "Test Session" and press Enter
    - Expected: title saves, input returns to display mode showing "Test Session"
    - **Screenshot checkpoint:** Updated title displayed

### Part 8: Panel State Persistence

28. **Close** the panel (click X or click outside)
    - Expected: panel closes

29. **Navigate** to a different page (`http://localhost:5173/items`)
    - Expected: different page loads, bubble still visible

30. **Reopen** the panel by clicking the bubble
    - Expected: panel opens with the same session ("Test Session") and conversation history intact
    - **Screenshot checkpoint:** State persisted across close/reopen and navigation

### Part 9: Mobile Viewport

31. **Resize** viewport to 375x667 (iPhone SE)
    - Use: `resize_page` with width=375, height=667
    - **Screenshot checkpoint:** Full page layout at mobile size

32. **Click** the Pico bubble
    - Expected: panel opens and is usable at mobile width
    - Check: panel width adjusts (`max-w-[calc(100vw-3rem)]`), no horizontal overflow, input area usable
    - **Screenshot checkpoint:** Mobile panel layout — no overflow, readable text, usable input

33. **Close** panel and **resize** back to desktop (1280x800)
    - **Screenshot checkpoint:** Restored to normal desktop layout

### Part 10: Error State

34. **Simulate** error state (if API key were missing or backend down)
    - Note: may not be easily testable without stopping the backend. Check for:
    - If backend returns 503 → error message appears in chat panel (not a crash)
    - If already visible in a previous step, verify the error state renders clearly
    - **Screenshot checkpoint:** Error rendering if encountered, otherwise skip

35. **Verify** error retry
    - Look for: retry button or mechanism in the error state
    - Expected: RotateCcw icon button allows retrying the last failed message
    - Note: skip if no error was triggered

### Part 11: Clear All Sessions

36. **Open** the session dropdown
    - Look for: "Clear all" or trash icon option at the bottom of the session list
    - **Screenshot checkpoint:** Clear all option visible

37. **Click** "Clear all" (if available)
    - Expected: all sessions deleted, returns to empty state with quick actions
    - **Screenshot checkpoint:** Clean empty state after clearing

38. **Take final screenshot** for evidence (full page with panel open in empty state)

## Expected Results

- Chat bubble visible on every page (dashboard, work items, agents, personas)
- Panel opens/closes smoothly with proper animation
- Quick action buttons visible in empty state, send messages on click
- Messages render with correct alignment (user right, assistant left)
- Streaming works: typing indicator → progressive text → complete response
- Markdown renders correctly (bold, code, lists)
- Session management: create, switch, rename, clear all
- State persists across panel close/reopen and page navigation
- Mobile viewport: panel usable without overflow
- Error states show clear messages with retry option

### Visual Quality

- No layout issues: panel properly positioned, not overlapping content
- Text is readable: correct contrast in both message bubbles
- Bubble: consistent size, proper shadow, smooth hover animation
- Panel: rounded corners, proper border, shadow, header aligned
- Messages: clear visual distinction between user and assistant
- Quick actions: icons aligned with text, proper spacing
- Input area: textarea and send button properly sized and positioned
- Dark mode (if tested): all text visible, proper contrast in message bubbles

## Failure Criteria

- Chat bubble not visible on any tested page
- Panel fails to open or close
- Messages don't send (no user bubble appears)
- Streaming doesn't work (no response appears after 30 seconds)
- Markdown renders as raw text
- Session switching loses messages
- Panel state doesn't persist across close/reopen
- Mobile layout: panel overflows viewport or is unusable
- Error causes panel to crash instead of showing error message
- Any NaN, undefined, or [object Object] visible in the UI

### Visual Failure Criteria

- Any visual defect counts as a visual failure even if the functional test passes
- Message bubbles overlap or clip outside panel bounds
- Text is invisible or unreadable in message bubbles
- Panel extends beyond viewport bounds
- Quick action buttons misaligned or overlapping
- Typing indicator animation broken or missing
- Session dropdown clips or overflows
- Input textarea too small to type in at mobile size
