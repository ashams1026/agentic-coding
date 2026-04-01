# Test Results: Pico Chat

**Date:** 2026-03-31
**Tester:** Autonomous Agent
**Environment:** Backend :3001, Frontend :5173, Desktop 1280x800

## Summary

| Category | Pass | Fail | Skip |
|---|---|---|---|
| Part 1: Bubble Visibility | 5/5 | 0 | 0 |
| Part 2: Panel Open/Close | 5/5 | 0 | 0 |
| Part 3: Quick Action Messaging | 1/3 | 2 | 0 |
| Part 4: Manual Message Input | 2/4 | 2 | 0 |
| Part 5: Markdown & Content Rendering | 0/3 | 0 | 3 |
| Part 6: Session Management | 4/5 | 0 | 1 |
| Part 7: Session Title Editing | 2/2 | 0 | 0 |
| Part 8: Panel State Persistence | 3/3 | 0 | 0 |
| Part 9: Mobile Viewport | 3/3 | 0 | 0 |
| Part 10: Error State | 2/2 | 0 | 0 |
| Part 11: Clear All Sessions | 3/3 | 0 | 0 |
| **Total** | **30/38** | **4** | **4** |

## Detailed Results

### Part 1: Chat Bubble Visibility — ALL PASS

| Step | Result | Notes |
|---|---|---|
| 1. Navigate to Dashboard | PASS | Page loads, no errors |
| 2. Verify bubble visible | PASS | `button[aria-label="Open Pico chat"]` visible bottom-right, amber circle with Dog icon, shadow present |
| 3. Navigate to /items | PASS | Bubble persists |
| 4. Navigate to /agents | PASS | Bubble persists |
| 5. Navigate to /personas | PASS | Bubble persists |

**Visual:** Bubble properly positioned, consistent size, no overlap with page content.

### Part 2: Panel Open/Close — ALL PASS

| Step | Result | Notes |
|---|---|---|
| 6. Click bubble | PASS | Panel appears, fixed position bottom-right, rounded corners, border, shadow |
| 7. Verify panel structure | PASS | Header: Pico avatar (amber), session title dropdown, +New session, Minimize buttons |
| 8. Verify empty state | PASS | (Tested via New Session) Welcome "Woof! I'm Pico" + 4 quick action buttons with icons |
| 9. Click close (Minimize) | PASS | Panel disappears, bubble shows "Open Pico chat" |
| 10. Reopen bubble | PASS | Panel reopens with same state |

**Visual:** Panel well-positioned, clean header layout, quick actions centered with proper icons. No visual defects.

**Screenshot:** `pico-02-panel-open.png`, `pico-03-empty-state.png`

### Part 3: Quick Action Messaging — 1 PASS, 2 FAIL

| Step | Result | Notes |
|---|---|---|
| 11. Click quick action | PASS | "What's the project status?" sent, user bubble appears right-aligned, quick actions disappear |
| 12. Verify streaming | **FAIL** | No streaming response — "Failed to fetch" error (CORS) |
| 13. Wait for response | **FAIL** | Error persists on retry |

**Root Cause:** CORS error. Console shows: `Access to fetch at 'http://localhost:3001/api/chat/sessions/.../messages' from origin 'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`

The SSE endpoint writes headers manually via `reply.raw.writeHead()` which bypasses Fastify's CORS plugin. The curl test confirms the backend works fine — this is browser-only.

**Screenshot:** `pico-04-error-state.png`

### Part 4: Manual Message Input — 2 PASS, 2 FAIL

| Step | Result | Notes |
|---|---|---|
| 14. Verify textarea | PASS | Textarea with placeholder "Ask Pico anything...", Cmd+Enter hint, Send button |
| 15-16. Type and send | PASS | "Hello Pico" typed, sent via Cmd+Enter, user bubble appears, textarea clears and disables |
| 17. Wait for response | **FAIL** | Same CORS error — "Failed to fetch" |
| (streaming) | **FAIL** | Cannot test streaming/markdown due to CORS block |

### Part 5: Markdown & Content Rendering — ALL SKIP

| Step | Result | Notes |
|---|---|---|
| 18. Markdown rendering | SKIP | Cannot test — no successful response due to CORS |
| 19. Thinking blocks | SKIP | Cannot test |
| 20. Tool call cards | SKIP | Cannot test |

### Part 6: Session Management — 4 PASS, 1 SKIP

| Step | Result | Notes |
|---|---|---|
| 21. New session (+) | PASS | New empty conversation, quick actions reappear |
| 22. Send message, title auto-update | SKIP | Title update requires successful response; message sent but title may only update on successful round-trip |
| 23. Session switcher | PASS | Dropdown shows multiple sessions with relative timestamps (now, 20m, 26m) |
| 24. Switch to previous | PASS | Previous "hi" session loads with full message history |
| 25. Switch back | PASS | Correctly loads selected session |

**Screenshot:** `pico-05-session-dropdown.png`

### Part 7: Session Title Editing — ALL PASS

| Step | Result | Notes |
|---|---|---|
| 26. Click Rename | PASS | Title becomes editable inline input, focused, current value pre-filled |
| 27. Type + Enter | PASS | "Test Session" saved, input returns to display mode, dropdown button shows new title |

### Part 8: Panel State Persistence — ALL PASS

| Step | Result | Notes |
|---|---|---|
| 28. Close panel | PASS | Panel closes |
| 29. Navigate to /items | PASS | Bubble visible on new page |
| 30. Reopen panel | PASS | "Test Session" title preserved, conversation history intact |

### Part 9: Mobile Viewport — ALL PASS

| Step | Result | Notes |
|---|---|---|
| 31. Resize to 375x667 | PASS | Page responsive, sidebar collapses to icons, bubble visible |
| 32. Open panel | PASS | Panel fits within viewport (`max-w-[calc(100vw-3rem)]`), messages readable, input usable |
| 33. Restore desktop | PASS | Layout restored |

**Screenshot:** `pico-06-mobile-closed.png`, `pico-07-mobile-panel.png`

### Part 10: Error State — ALL PASS (tested organically)

| Step | Result | Notes |
|---|---|---|
| 34. Error display | PASS | "Failed to fetch" shown in red with error icon, doesn't crash the panel |
| 35. Retry button | PASS | RotateCcw "Retry" button visible and clickable (though retry also fails due to same CORS issue) |

**Screenshot:** `pico-04-error-state.png`

### Part 11: Clear All Sessions — ALL PASS

| Step | Result | Notes |
|---|---|---|
| 36. Open dropdown | PASS | "Clear all sessions" option visible at bottom |
| 37. Click Clear all | PASS | All sessions deleted, returns to empty state with "New conversation" and quick actions |
| 38. Final screenshot | PASS | Clean empty state |

**Screenshot:** `pico-08-final-cleared.png`

## Bugs Found

### BUG-1: CORS headers missing on Pico SSE endpoint (Severity: HIGH)

**Summary:** `POST /api/chat/sessions/:id/messages` SSE endpoint doesn't include CORS headers, blocking all browser requests.

**Root Cause:** The chat route writes headers manually via `reply.raw.writeHead(200, { "Content-Type": "text/event-stream", ... })` which bypasses Fastify's `@fastify/cors` plugin. The CORS headers (`Access-Control-Allow-Origin`, etc.) are not included in the manual `writeHead()` call.

**Reproduction:**
1. Open Pico chat panel in browser
2. Send any message (quick action or typed)
3. Console error: `Access to fetch... blocked by CORS policy: No 'Access-Control-Allow-Origin' header`

**Expected:** SSE response should include CORS headers so the browser allows the cross-origin streaming connection.

**Fix:** In `packages/backend/src/routes/chat.ts`, add CORS headers to the `reply.raw.writeHead()` call:
```typescript
reply.raw.writeHead(200, {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive",
  "X-Accel-Buffering": "no",
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Credentials": "true",
});
```
Or better: call `reply.header()` before `reply.raw.writeHead()` so Fastify's CORS plugin injects its headers first.

**Impact:** Pico chat is completely non-functional in the browser. All messages fail with "Failed to fetch". The backend works correctly (verified via curl).

## Visual Quality Assessment

- **Bubble:** Consistent amber circle, proper shadow, smooth position — no issues
- **Panel:** Clean rounded corners, proper border/shadow, well-positioned — no issues
- **Header:** Pico icon, session dropdown, action buttons properly aligned — no issues
- **Messages:** Clear user/assistant distinction (right/left alignment), timestamps visible — no issues
- **Quick actions:** Icons aligned with text, proper spacing, centered layout — no issues
- **Input area:** Textarea full-width, Send button positioned correctly, Cmd+Enter hint visible — no issues
- **Session dropdown:** Clean list with timestamps, separator before rename/clear options — no issues
- **Mobile:** Panel respects max-width, no overflow, content readable — no issues
- **Error state:** Red icon + text, retry button, doesn't crash — acceptable design
- **Dark mode:** Not tested (not in scope for this run)

## Screenshots

| File | Description |
|---|---|
| `pico-01-dashboard-bubble.png` | Dashboard with Pico bubble visible |
| `pico-02-panel-open.png` | Panel open with existing conversation |
| `pico-03-empty-state.png` | Empty state with welcome message and quick actions |
| `pico-04-error-state.png` | Error state after "Failed to fetch" |
| `pico-05-session-dropdown.png` | Session switcher dropdown |
| `pico-06-mobile-closed.png` | Mobile viewport (375x667) with bubble |
| `pico-07-mobile-panel.png` | Mobile viewport with panel open |
| `pico-08-final-cleared.png` | Final state after clearing all sessions |
