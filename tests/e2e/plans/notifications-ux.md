# Test Plan: Notifications UX Phase 1

## Objective

Verify the in-app notification system: bell icon with badge, notification drawer, notification cards with actions, mark all read, enhanced toasts, and notification preferences in Settings.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with at least one project
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### TC-NTF-1: Bell icon in sidebar footer

1. **Navigate** to `http://localhost:5173/`
   - Verify: sidebar footer shows three buttons: theme toggle, notification bell, collapse toggle
   - Verify: bell icon is present between theme and collapse buttons
   - **Screenshot checkpoint**

2. **Verify badge behavior** (no unread)
   - Verify: no red badge visible on bell when no unread notifications exist

3. **Hover** over the bell icon
   - Verify: tooltip shows "Notifications"

### TC-NTF-2: Notification drawer open/close

1. **Click** the bell icon in sidebar footer
   - Verify: notification drawer slides in from the right (320px width)
   - Verify: backdrop overlay appears behind drawer
   - Verify: header shows "Notifications" title and close (X) button
   - **Screenshot checkpoint**

2. **Verify empty state**
   - Verify: bell icon with "All caught up!" text and "No notifications yet" subtitle
   - **Screenshot checkpoint**

3. **Click** the X button to close
   - Verify: drawer closes, backdrop removed

4. **Click** bell to reopen, then press **Escape**
   - Verify: drawer closes on Escape key

5. **Click** bell to reopen, then click the **backdrop**
   - Verify: drawer closes on click outside

### TC-NTF-3: Notification store and badge (via JavaScript injection)

1. **Inject a test notification** via browser console:
   ```javascript
   // Access the Zustand store and add a notification
   window.__NOTIFICATION_TEST__ = true;
   ```
   Use `evaluate_script` to call the notification store's `addNotification` directly with a test notification object.

2. **Verify badge appears**
   - Verify: red badge with "1" appears on the bell icon
   - **Screenshot checkpoint**

3. **Add 10+ notifications**
   - Verify: badge shows "9+" when count exceeds 9

4. **Open drawer**
   - Verify: notifications appear grouped under "Today"
   - Verify: each notification shows title, description, relative time
   - **Screenshot checkpoint**

5. **Click** "Mark all read" button
   - Verify: all notifications lose bold styling (marked as read)
   - Verify: bell badge disappears (0 unread)

### TC-NTF-4: Notification card types and actions

1. **Inject notifications of each type** via evaluate_script:
   - `proposal_needs_approval` (critical) — verify: Lightbulb icon, amber color, [Approve] [Reject] buttons
   - `agent_errored` (critical) — verify: AlertCircle icon, red color, [View execution] button
   - `budget_threshold` (high) — verify: AlertTriangle icon, yellow color, [View settings] button
   - `execution_stuck` (high) — verify: Clock icon, orange color, [View agent] button
   - `agent_completed` (low) — verify: CheckCircle icon, green color, [View result] button
   - **Screenshot checkpoint**

2. **Click** an action button (e.g., "View execution" on an error notification)
   - Verify: drawer closes
   - Verify: navigated to `/agents`
   - Verify: notification marked as read

### TC-NTF-5: Enhanced toasts (code review)

> Toast behavior requires live WS events or direct store manipulation. Verify via code review.

1. **Verify** in `toast-store.ts`:
   - `critical` field on Toast interface
   - Critical toasts skip `setTimeout` auto-dismiss
   - `overflowCount` state tracked
   - `MAX_VISIBLE = 3`

2. **Verify** in `toast-renderer.tsx`:
   - `overflowCount > 0` shows "+N more" link
   - Link calls `setDrawerOpen(true)` to open notification drawer

3. **Verify** in `use-toast-events.ts`:
   - `notification` WS event dispatches to both `addNotification` and `addToast`
   - `CRITICAL_TYPES` set: `proposal_needs_approval`, `agent_errored`, `budget_threshold`
   - Critical types get `critical: true` on toasts
   - Action buttons mapped per notification type

### TC-NTF-6: Notification preferences in Settings

1. **Navigate** to `http://localhost:5173/settings`
   - **Screenshot checkpoint**

2. **Click** "Notifications" in the settings sidebar
   - Verify: Notifications section loads with three subsections: Event Types, Quiet Hours, Scope
   - **Screenshot checkpoint**

3. **Verify Event Types grid**
   - Verify: 5 event types listed (Agent needs approval, Agent errored, Budget threshold, Execution stuck, Agent completed)
   - Verify: each row has "In-App" and "Sound" toggle columns
   - Verify: all In-App toggles default ON
   - Verify: only Agent needs approval and Agent errored Sound toggles default ON

4. **Toggle** an event type OFF (e.g., Agent completed In-App)
   - Verify: toggle visually switches to OFF state
   - Verify: preference persists (reload page and check)

5. **Verify Quiet Hours section**
   - Verify: "Enable quiet hours" toggle (default OFF)
   - Toggle ON
   - Verify: from/to time pickers appear (default 22:00 / 08:00)
   - **Screenshot checkpoint**

6. **Verify Scope section**
   - Verify: radio buttons for "All projects" (default) and "Current project only"
   - Select "Current project only"
   - Verify: selection persists

### TC-NTF-7: WebSocket notification event type (code review)

1. **Verify** in `packages/shared/src/ws-events.ts`:
   - `NotificationEventType` with 5 types
   - `NotificationPriority` with 4 levels
   - `Notification` interface with all required fields
   - `NotificationEvent` in `WsEventType` union, `WsEvent` union, `WsEventMap`

2. **Verify** in `packages/backend/src/ws.ts`:
   - `broadcastNotification()` helper creates Notification + broadcasts NotificationEvent

3. **Verify** backend emission points:
   - `execution-manager.ts`: agent completed (low), agent errored (critical), budget threshold (high)
   - `proposals.ts`: review_request → proposal_needs_approval (critical)

## Visual Quality

- Bell icon: properly sized, aligned with theme/collapse buttons
- Badge: red circle, "9+" overflow, positioned top-right of bell
- Drawer: 320px width, right-aligned, backdrop visible, no content clipping
- Notification cards: icon circles with correct colors, action buttons visible and clickable
- Settings: toggle switches functional, time pickers accessible, radio buttons clickable
- Dark mode: all notification elements maintain contrast

## Failure Criteria

- Bell icon missing from sidebar footer → FAIL
- Drawer not opening/closing on click/Escape/backdrop → FAIL
- Notifications not grouped by date → FAIL
- Notification card missing icon or action buttons for any type → FAIL
- Mark all read not clearing unread state → FAIL
- Settings toggles not persisting to localStorage → FAIL
- Critical toasts auto-dismissing → FAIL (code review)
