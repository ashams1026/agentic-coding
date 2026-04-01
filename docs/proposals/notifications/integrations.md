# Notification Integrations & Delivery Infrastructure — Design Research

Research into external notification channels (Slack, email, webhooks) and the backend architecture to dispatch notifications across multiple channels.

**Current state:** WebSocket broadcast (`ws.ts`) sends events to all connected frontend clients. No external notification channels exist. The WS layer is a simple `Set<WebSocket>` with `broadcast()` — no topic/channel separation, no per-client filtering, no persistence.

---

## 1. Slack Integration

### Delivery model: Bot posting to channels or DMs

A Slack bot (Woof Bot) posts formatted messages to a configured channel or DMs the user.

### Message format

```
🔴 Agent Error: Code Reviewer failed on "Fix auth bug"

Project: tictactoe
Error: TypeError: Cannot read property 'token' of undefined
Duration: 2.1s | Cost: $0.03

[View Execution ↗]  [Retry ↗]
```

**Rich formatting:**
- Use Slack Block Kit for structured messages (sections, dividers, buttons)
- Color-coded attachment sidebar: red for errors, amber for proposals, green for completions
- Action buttons that deep-link back to Woof (e.g., `https://localhost:5173/agents?exec=ex-abc`)
- For proposals: interactive buttons (Approve/Reject) that call back to Woof's API

### Interactive actions (Approve/Reject from Slack)

When a proposal notification has Approve/Reject buttons in Slack:
1. User clicks "Approve" in Slack
2. Slack sends an interaction payload to Woof's callback URL
3. Woof backend processes the approval (same logic as in-app)
4. Woof updates the Slack message to show "Approved by [user]"

**Requirement:** Woof backend must be reachable from Slack's servers. For local-first deployments, this requires a tunnel (ngrok, Cloudflare Tunnel) or is simply unavailable — interactive buttons are a Phase 2 feature for hosted deployments.

### Setup flow

Settings > Notifications > Slack:

1. **OAuth flow:** "Connect Slack" button → Slack OAuth consent screen → redirects back with auth code → Woof stores bot token
2. **Channel selection:** Dropdown populated from Slack API (`conversations.list`) — user picks a channel
3. **Event filter:** Checkboxes for which events post to Slack (default: critical + high only)
4. **Test button:** "Send test notification" → posts a test message to the selected channel

**Credentials storage:** Bot token and channel ID stored in `projects.settings.slack` JSON or a dedicated `integrations` table.

### Complexity assessment

| Component | Effort | Notes |
|-----------|--------|-------|
| OAuth flow | Medium | Redirect-based, requires Slack app registration |
| Posting messages | Low | Single API call per notification (`chat.postMessage`) |
| Block Kit formatting | Low | Template per event type |
| Interactive buttons | High | Requires public URL, callback handler, state management |
| Channel selection UI | Low | Dropdown from API |

**Phase 1:** Post-only (no interactive buttons). OAuth + channel selection + formatted messages.
**Phase 2:** Interactive buttons for hosted deployments with public URLs.

---

## 2. Email

### Delivery model: Transactional emails for critical events

Email is the "never miss it" channel — for events that can't wait until the user opens the app.

### When to send email

| Event | Send email? | Rationale |
|-------|------------|-----------|
| Agent errored | Yes | User may not be at the app |
| Budget exceeded | Yes | Financial impact, needs immediate attention |
| Agent needs approval (proposal) | Optional | Low urgency, can wait for in-app |
| Execution stuck (>30 min) | Yes | Prolonged issue |
| Agent completed | No | Too noisy for email |

### Email format

Simple, text-focused emails. No heavy HTML templates — these are operational alerts, not marketing:

```
Subject: [Woof] Agent Error: Code Reviewer failed on "Fix auth bug"

Agent: Code Reviewer
Work Item: Fix auth bug (wi-abc123)
Project: tictactoe
Error: TypeError: Cannot read property 'token' of undefined
Time: 2026-04-02 18:30 PDT

View execution: http://localhost:5173/agents?exec=ex-abc

---
Woof — Agent Orchestration
Manage notification preferences: http://localhost:5173/settings
```

### Digest mode

Instead of per-event emails, offer a daily digest:
- **Frequency:** Daily at user-configured time (default: 9:00 AM)
- **Content:** Summary of all agent activity in the last 24 hours:
  - Completed: N items, $X.XX total cost
  - Errors: N failures (list top 3)
  - Pending proposals: N awaiting review
  - Budget status: $X.XX / $Y.YY used
- **Skip if empty:** Don't send the digest if there was no agent activity

### Email service recommendation

| Service | Pros | Cons | Recommendation |
|---------|------|------|---------------|
| **Resend** | Modern API, great DX, generous free tier (100/day) | Newer, smaller company | **Phase 1 — best DX for local-first app** |
| **SendGrid** | Industry standard, reliable, rich analytics | Complex setup, heavy SDK | Phase 2 if scale needed |
| **SES** | Cheapest at scale ($0.10/1000 emails) | AWS dependency, complex setup | Only if already on AWS |
| **Self-hosted SMTP** | No external dependency | User must configure SMTP server, deliverability issues | Offer as advanced option |

**Phase 1:** Resend (simple API key, single `fetch()` call per email, no SDK needed).
**Advanced option:** Let users configure custom SMTP (host, port, user, pass) in Settings for self-hosted setups.

### Setup flow

Settings > Notifications > Email:
1. **Resend API key** input field (or SMTP config toggle for advanced)
2. **Recipient email** input
3. **Mode:** Immediate alerts / Daily digest / Both
4. **Event filter:** Checkboxes (same as Slack)
5. **Test button:** "Send test email"

---

## 3. Webhooks

### Delivery model: HTTP POST to user-configured endpoints

Outbound webhooks let users pipe notifications to any service (PagerDuty, Discord, custom dashboards).

### Configuration

Settings > Notifications > Webhooks:

```
┌─ Webhooks ────────────────────────────────────────────────┐
│                                                            │
│  Endpoint 1: Production Alerts                             │
│  URL: https://hooks.slack.com/services/T.../B.../xxx       │
│  Events: [✓] Errors  [✓] Budget  [ ] Completions          │
│  Status: ● Active (last delivery: 2 min ago, 200 OK)      │
│  [Test] [Edit] [Delete]                                    │
│                                                            │
│  Endpoint 2: PagerDuty                                     │
│  URL: https://events.pagerduty.com/v2/enqueue              │
│  Events: [✓] Errors  [✓] Stuck executions                 │
│  Status: ● Active                                          │
│  [Test] [Edit] [Delete]                                    │
│                                                            │
│  [+ Add webhook endpoint]                                  │
└────────────────────────────────────────────────────────────┘
```

### Payload format

Standardized JSON envelope:

```json
{
  "id": "evt_abc123",
  "type": "execution.errored",
  "timestamp": "2026-04-02T18:30:00.000Z",
  "project": {
    "id": "pj-xyz",
    "name": "tictactoe"
  },
  "data": {
    "executionId": "ex-abc",
    "workItemId": "wi-def",
    "workItemTitle": "Fix auth bug",
    "personaName": "Code Reviewer",
    "error": "TypeError: Cannot read property 'token' of undefined",
    "duration_ms": 2100,
    "cost_usd": 0.03
  }
}
```

**Design principles:**
- Consistent envelope: `id`, `type`, `timestamp`, `project`, `data`
- Include enough context to be useful without requiring a callback to Woof
- **No sensitive data:** Don't include API keys, full prompts, or file contents in payloads
- `type` follows `entity.action` convention: `execution.completed`, `execution.errored`, `proposal.created`, `budget.threshold`, `budget.exceeded`

### Security

| Measure | Implementation |
|---------|---------------|
| **HMAC signing** | Each webhook endpoint has a secret. Payload is signed with `HMAC-SHA256(secret, body)`. Signature sent in `X-Woof-Signature` header. Receiver verifies. |
| **Replay protection** | Include `X-Woof-Timestamp` header. Receiver rejects events older than 5 minutes. |
| **TLS only** | Require HTTPS URLs (warn on HTTP, block in production). |
| **Secret rotation** | "Regenerate secret" button in endpoint settings. |

### Retry policy

| Attempt | Delay | Total time |
|---------|-------|-----------|
| 1st retry | 30 seconds | 30s |
| 2nd retry | 2 minutes | 2.5 min |
| 3rd retry | 10 minutes | 12.5 min |
| 4th retry | 1 hour | ~1 hour |
| 5th retry (final) | 4 hours | ~5 hours |

- **Retry on:** 5xx, timeout (10 seconds), network error
- **Don't retry on:** 4xx (client error — configuration issue)
- **Dead letter:** After 5 failed attempts, mark the event as "failed" in delivery log. Don't retry further.
- **Auto-disable:** If 10 consecutive deliveries fail, disable the endpoint and notify via in-app notification: "Webhook endpoint [name] disabled after repeated failures"

### Delivery log

Visible in Settings > Notifications > Webhooks > [endpoint] > Delivery log:

| Time | Event | Status | Response | Duration |
|------|-------|--------|----------|----------|
| 2 min ago | execution.errored | 200 OK | — | 120ms |
| 15 min ago | budget.threshold | 200 OK | — | 85ms |
| 1 hour ago | execution.completed | 500 Error | Retry 1/5 | 10s (timeout) |

---

## 4. Backend Architecture — Event Bus

### Design: In-process event emitter with channel fan-out

```
Execution Manager / Router / Budget Checker
              │
              ▼
      NotificationService.emit(event)
              │
              ├──→ In-app: WebSocket broadcast + notification store
              ├──→ Slack: HTTP POST to Slack API (if configured)
              ├──→ Email: HTTP POST to Resend/SMTP (if configured)
              └──→ Webhooks: HTTP POST per endpoint (if configured)
```

### NotificationService

```typescript
class NotificationService {
  private channels: NotificationChannel[] = [];

  register(channel: NotificationChannel) {
    this.channels.push(channel);
  }

  async emit(event: NotificationEvent) {
    // Check user preferences
    const prefs = getNotificationPreferences();
    if (!prefs.enabledEvents[event.type]) return;

    // Check quiet hours
    if (isQuietHours(prefs) && event.priority !== "critical") return;

    // Fan-out to all registered channels
    await Promise.allSettled(
      this.channels
        .filter(ch => ch.isConfigured() && ch.accepts(event))
        .map(ch => ch.deliver(event))
    );
  }
}
```

### Channel interface

```typescript
interface NotificationChannel {
  name: string;
  isConfigured(): boolean;
  accepts(event: NotificationEvent): boolean;
  deliver(event: NotificationEvent): Promise<void>;
}
```

Built-in channels:
- `InAppChannel` — broadcasts via WebSocket, adds to notification store
- `SlackChannel` — posts to Slack API
- `EmailChannel` — sends via Resend/SMTP
- `WebhookChannel` — POSTs to each configured endpoint

### Rate limiting

To prevent notification storms during bulk operations (e.g., archiving 50 items triggers 50 state changes):

- **Deduplication window:** 5 seconds. If the same event type fires for the same entity within 5 seconds, batch into one notification.
- **Throttle per channel:** Max 10 notifications per minute to Slack, 5 per minute to email. Excess events are queued and delivered after the window.
- **Burst detection:** If >20 events fire within 10 seconds, switch to digest mode for that burst: "20 agents completed in the last 10 seconds" (single notification).

---

## 5. WebSocket Infrastructure Interaction

### Current WS: sufficient for in-app, no changes needed

The existing `broadcast()` in `ws.ts` sends events to all connected clients. For in-app notifications:

```typescript
// In NotificationService.InAppChannel.deliver()
broadcast({
  type: "notification",
  event: notificationEvent.type,
  data: notificationEvent,
});
```

The frontend `useWsQuerySync` hook already listens for WS events and can dispatch to the notification store.

### Do notifications need a separate WS channel?

**No.** The current single-channel broadcast is sufficient because:
- All notification events are small (< 1KB JSON)
- Frequency is low (agents don't fire hundreds of events per second)
- The frontend already filters WS events by `type` field
- No per-user filtering needed (single-user app)

If multi-user support is added later, WS channels/rooms (via Socket.IO or per-user connections) would be needed. But for the current architecture, `broadcast()` works.

### WS vs SSE for notifications

Notifications should use WS (not SSE) because:
- WS is already established for query cache invalidation
- SSE would require a separate connection per page
- WS supports bidirectional communication (future: acknowledge notification from frontend)

---

## 6. Data Model

### Integrations table

```sql
CREATE TABLE integrations (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,              -- "slack" | "email" | "webhook"
  name TEXT NOT NULL,              -- user-friendly name
  config TEXT NOT NULL DEFAULT '{}', -- JSON: channel-specific config
  enabled BOOLEAN NOT NULL DEFAULT true,
  event_filter TEXT NOT NULL DEFAULT '[]', -- JSON: NotificationEventType[]
  last_delivery_at INTEGER,       -- timestamp
  last_delivery_status TEXT,      -- "success" | "error"
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**Config JSON by type:**
- Slack: `{ botToken, channelId, channelName }`
- Email: `{ provider: "resend" | "smtp", apiKey?, smtpHost?, smtpPort?, recipientEmail, mode: "immediate" | "digest" | "both" }`
- Webhook: `{ url, secret, retryPolicy: "default" | "aggressive" | "none" }`

### Delivery log table

```sql
CREATE TABLE notification_deliveries (
  id TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL,        -- JSON: full event payload
  status TEXT NOT NULL,            -- "pending" | "delivered" | "failed" | "retrying"
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at INTEGER,
  last_response_status INTEGER,    -- HTTP status code
  last_response_body TEXT,         -- truncated response
  next_retry_at INTEGER,           -- NULL if delivered or exhausted
  created_at INTEGER NOT NULL
);
```

**Cleanup:** Delivery log entries older than 30 days are pruned by the background cleanup job (same as work item hard delete).

---

## 7. Implementation Phases

### Phase 1: Webhooks (simplest external channel)
- `integrations` table + CRUD API
- `WebhookChannel` with HMAC signing, retry policy, delivery log
- Settings UI for webhook management
- No OAuth, no third-party SDK

### Phase 2: Email via Resend
- `EmailChannel` with Resend API integration
- Immediate alerts + daily digest scheduler
- Settings UI for email configuration
- SMTP option for advanced users

### Phase 3: Slack
- Slack App registration + OAuth flow
- `SlackChannel` with Block Kit formatting
- Channel selection UI
- Interactive buttons (requires public URL — hosted deployments only)

### Phase 4: Event bus hardening
- Rate limiting and deduplication
- Burst detection and digest mode
- Per-channel throttling
- Integration health monitoring (auto-disable on repeated failures)

---

## 8. Relationship to Other Research

| Topic | Relationship |
|-------|-------------|
| RES.NOTIFY.UX | In-app notification UX — this doc covers external channels that extend it |
| RES.WEBHOOKS.OUTBOUND | Significant overlap — outbound webhooks designed here are the same system. RES.WEBHOOKS.OUTBOUND can reference this doc and focus on advanced features (filtering, transformation) |
| RES.WEBHOOKS.INBOUND | Separate concern (inbound triggers FROM external systems TO Woof) — no overlap |
| RES.SWAP.HOSTED | Hosted frontend enables Slack interactive buttons and public webhook callbacks |
| RES.RECOVERY.AGENTS | Stuck execution detection is a notification event source |
