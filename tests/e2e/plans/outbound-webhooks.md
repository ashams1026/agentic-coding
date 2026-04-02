# Test Plan: Outbound Webhooks Phase 1

## Objective

Verify outbound webhook subscription CRUD, event delivery with HMAC signing, retry logic, auto-disable on failures, delivery log, and Settings Integrations UI.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- chrome-devtools MCP connected
- No existing webhook subscriptions (clean state)

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Subscription CRUD via API

1. **Create** a webhook subscription
   - Call `POST /api/webhooks` with `{ "url": "https://httpbin.org/post", "events": ["execution.completed"] }`
   - Expected: 201 response with `{ data: { id, url, secret, events, isActive: true, failureCount: 0 } }`
   - Verify: `id` starts with `wh-`, `secret` starts with `whsec_`

2. **List** webhook subscriptions
   - Call `GET /api/webhooks`
   - Expected: `{ data: [...], total: 1 }` — the subscription just created
   - Verify: `secret` is NOT in the list response (security)

3. **Update** the subscription
   - Call `PATCH /api/webhooks/:id` with `{ "events": ["execution.completed", "execution.failed"] }`
   - Expected: 200 with updated events array

4. **Disable** the subscription
   - Call `PATCH /api/webhooks/:id` with `{ "isActive": false }`
   - Expected: `isActive: false`

5. **Re-enable** the subscription
   - Call `PATCH /api/webhooks/:id` with `{ "isActive": true }`
   - Expected: `isActive: true`, `failureCount: 0` (reset on re-enable)

6. **View delivery log** (empty)
   - Call `GET /api/webhooks/:id/deliveries`
   - Expected: `{ data: [], total: 0 }`

7. **Delete** the subscription
   - Call `DELETE /api/webhooks/:id`
   - Expected: 204 No Content

### Part 2: Settings Integrations UI

8. **Navigate** to `http://localhost:5173/settings`
   - Click "Integrations" in left nav
   - Verify: "Outbound Webhooks" section visible with "Add Webhook" button
   - **Screenshot checkpoint**

9. **Click** "Add Webhook" button
   - Expected: form appears with URL input, event checkboxes, Create/Cancel buttons
   - **Screenshot checkpoint**

10. **Create** a webhook via the UI
    - Enter URL, select event checkboxes, click Create
    - Expected: webhook appears in list, secret shown with show/hide/copy buttons
    - **Screenshot checkpoint**

11. **Toggle** the active switch
    - Expected: webhook toggles active/disabled state

12. **Click** "Log" button on a webhook
    - Expected: delivery log table appears (empty — "No deliveries yet")
    - **Screenshot checkpoint**

13. **Delete** a webhook via trash icon
    - Expected: webhook removed from list

### Part 3: Event Bus + Delivery (Code Review)

14. **Verify** event bus emissions
    - Check `packages/backend/src/events/event-bus.ts`: TypedEventBus with 4 event types
    - Check `packages/backend/src/agent/execution-manager.ts`: emissions at started/completed/failed
    - Check `packages/backend/src/routes/work-items.ts`: emission at state_changed

15. **Verify** webhook bridge
    - Check `packages/backend/src/events/webhook-bridge.ts`: `onAny` listener creates delivery records
    - Check: filters active subscriptions by event type match

16. **Verify** delivery worker
    - Check `packages/backend/src/events/webhook-delivery.ts`: 2s polling, HMAC signing, retry logic
    - Check: exponential backoff (30s/2m/8m/30m), max 5 attempts
    - Check: auto-disable after 10 consecutive failures

17. **Take final screenshot** of Integrations page

## Expected Results

- Webhook CRUD: create (201 with secret), list (no secret), update, toggle, delete (204)
- UI: add form with URL + events, webhook list with toggle/log/delete, delivery log table
- Event bus: 4 typed events emitted from execution lifecycle + work item state changes
- Bridge: creates delivery records for matching subscriptions
- Worker: HMAC signing, retry with backoff, auto-disable

### Visual Quality

- Integrations section: proper layout in Settings nav
- Webhook list: URL in mono, event badges, failure count badge
- Toggle button: emerald (active) / muted (disabled) states
- Delivery log table: 5 columns, status icons

## Failure Criteria

- CRUD endpoints return wrong status codes
- Secret exposed in GET list response
- UI form doesn't create webhook
- Toggle doesn't change active state
- Event bus doesn't emit events
- Delivery worker doesn't poll or deliver

### Visual Failure Criteria

- Form elements misaligned
- Secret display broken (not toggling)
- Delivery log table overflow
