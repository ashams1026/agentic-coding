# Outbound Event Webhooks

> Research document for **RES.WEBHOOKS.OUTBOUND**. Design only — no implementation tasks.

---

## 1. Current State Audit

### How Events Are Emitted Today

AgentOps has two event systems, both internal-only:

**1. WebSocket broadcast** (`ws.ts:12`) — real-time push to connected frontend clients:
- 14 event types defined in `packages/shared/src/ws-events.ts:16-30`
- Broadcast sites across 5 files: `work-items.ts`, `mcp-server.ts`, `coordination.ts`, `dispatch.ts`, `claude-executor.ts`
- Simple `Set<WebSocket>` — no topic filtering, no per-client subscription, no persistence
- Events lost if no frontend client is connected

**2. File-based audit log** (`audit.ts:14-15`) — NDJSON at `~/.agentops/logs/audit.log`:
- 7 event types: `state_transition`, `agent_dispatch`, `agent_complete`, `cost_event`, `tool_use`, `session_start`, `session_end`
- Append-only, queryable via `GET /api/audit`
- No external delivery — file is local only

### What's Missing

1. **No external event delivery** — events only reach the frontend WebSocket and audit log file
2. **No subscription mechanism** — external systems cannot register to receive events
3. **No delivery guarantees** — WebSocket is fire-and-forget, audit log is file-based
4. **No filtering** — all WS clients receive all events, no per-subscription event type filtering
5. **No retry or dead letter** — if delivery fails, the event is lost

---

## 2. Subscribable Events

### Event Catalog

Which internal events should be exposed as outbound webhooks:

| Event | Source | Priority | Rationale |
|-------|--------|----------|-----------|
| **Execution started** | `dispatch.ts:63` broadcast `agent_started` | P0 | Track when agents begin work |
| **Execution completed** | `claude-executor.ts:304` broadcast `agent_completed` | P0 | Know when work is done, get outcome |
| **Execution failed** | `claude-executor.ts:343` broadcast `agent_completed` (outcome=error) | P0 | Alert external monitoring systems |
| **Work item state changed** | `work-items.ts:166` / `mcp-server.ts:93` broadcast `state_change` | P1 | Sync state with external project trackers |
| **Proposal created** | `mcp-server.ts:313` broadcast `proposal_created` | P1 | Notify humans of pending approvals |
| **Proposal resolved** | `mcp-server.ts:344` broadcast `proposal_updated` | P1 | Track approval/rejection flow |
| **Cost threshold reached** | New — derived from `cost_event` audit entries | P2 | Budget alerting |
| **Comment created** | `mcp-server.ts:704` broadcast `comment_created` | P2 | External discussion sync |

### Mapping: Internal WsEvent → Outbound Webhook Event

Internal WsEvents are fine-grained (14 types including streaming chunks). Outbound webhooks should be coarser — external consumers don't need `agent_output_chunk` or `context_usage`. The outbound event set is a curated subset:

```typescript
type OutboundEventType =
  | "execution.started"      // from agent_started
  | "execution.completed"    // from agent_completed (outcome=success/partial)
  | "execution.failed"       // from agent_completed (outcome=error/timeout)
  | "work_item.state_changed"// from state_change
  | "proposal.created"       // from proposal_created
  | "proposal.resolved"      // from proposal_updated (status != pending)
  | "budget.threshold"       // new — computed from cost tracking
  | "comment.created";       // from comment_created
```

Dotted naming convention (e.g., `execution.started`) matches industry standard (Stripe, GitHub) and enables wildcard subscriptions (`execution.*`).

---

## 3. Webhook Configuration

### Subscription Model

Each outbound webhook subscription defines:

```typescript
interface WebhookSubscription {
  id: string;                        // "whs-a8k2f"
  name: string;                      // "Slack alerts"
  url: string;                       // "https://hooks.slack.com/services/..."
  secret: string;                    // HMAC signing secret
  
  // Filtering
  eventTypes: OutboundEventType[];   // ["execution.completed", "execution.failed"]
  projectId: string | null;          // null = all projects
  
  // State
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Health tracking
  lastDeliveryAt: string | null;
  consecutiveFailures: number;       // 0 = healthy
  disabledReason: string | null;     // auto-disabled reason if applicable
}
```

### Scope Options

- **Global** — receives events from all projects (`projectId: null`)
- **Per-project** — only events related to a specific project
- Future: per-persona or per-work-item filtering (deferred — adds complexity without clear initial demand)

### Configuration UI

In **Settings > Integrations > Outbound Webhooks** (sibling to the inbound triggers from RES.WEBHOOKS.INBOUND):

```
Settings
  ├── Projects
  ├── Workflows
  ├── Costs & Budgets
  ├── Integrations
  │     ├── GitHub            (inbound)
  │     ├── Slack             (inbound)
  │     ├── Custom Webhooks   (inbound)
  │     └── Outbound Webhooks ← NEW
  └── Appearance
```

### Subscription List View

```
┌─────────────────────────────────────────────────────────────┐
│ Integrations > Outbound Webhooks                             │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Slack Alerts              Healthy ● Last: 5m ago         │ │
│ │ https://hooks.slack.co... execution.*, proposal.*        │ │
│ │ All projects · 342 deliveries  [Edit] [Logs] [Delete]    │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ PagerDuty Errors          Healthy ● Last: 2h ago         │ │
│ │ https://events.pagerdu... execution.failed               │ │
│ │ Project Alpha · 18 deliveries  [Edit] [Logs] [Delete]    │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ CI Webhook               ⚠ Failing (3 consecutive)       │ │
│ │ https://ci.internal/ho... work_item.state_changed         │ │
│ │ All projects · 89 deliveries   [Edit] [Logs] [Delete]    │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [+ Create Webhook]                                           │
└─────────────────────────────────────────────────────────────┘
```

### Create/Edit Dialog

```
┌──────────────────────────────────────────────────────────┐
│ Create Outbound Webhook                                   │
│                                                           │
│ Name:     [____________________________]                  │
│ URL:      [https://____________________ ]                 │
│ Project:  [All Projects ▾]  or [Select Project]           │
│                                                           │
│ Secret:   [auto-generated]  [Regenerate]  [Copy]          │
│                                                           │
│ Events:                                                   │
│   ☑ execution.started                                     │
│   ☑ execution.completed                                   │
│   ☑ execution.failed                                      │
│   ☐ work_item.state_changed                               │
│   ☐ proposal.created                                      │
│   ☐ proposal.resolved                                     │
│   ☐ budget.threshold                                      │
│   ☐ comment.created                                       │
│                                                           │
│ [Test / Ping]  (sends a test event to the URL)            │
│                                                           │
│              [Cancel]  [Create Webhook]                    │
└──────────────────────────────────────────────────────────┘
```

### Test/Ping Button

Sends a synthetic `ping` event to the configured URL:

```json
{
  "event": "ping",
  "webhookId": "whs-a8k2f",
  "timestamp": "2026-04-03T07:00:00.000Z",
  "data": {
    "message": "Webhook configured successfully"
  }
}
```

The UI shows the response status code and latency. If the endpoint returns a non-2xx status, show the error.

---

## 4. Payload Format

### Standardized Envelope

Every outbound webhook delivery uses a consistent JSON envelope:

```json
{
  "event": "execution.completed",
  "webhookId": "whs-a8k2f",
  "deliveryId": "whd-p9f3n",
  "timestamp": "2026-04-03T07:30:00.000Z",
  "data": {
    // event-specific payload
  }
}
```

Fields:
- `event` — the event type (dotted notation)
- `webhookId` — which subscription triggered this delivery
- `deliveryId` — unique ID for this delivery attempt (for deduplication)
- `timestamp` — ISO 8601, when the event occurred
- `data` — event-specific payload (see below)

### Event-Specific Payloads

**`execution.started`**

```json
{
  "executionId": "ex-a8k2f",
  "workItemId": "wi-p9f3n",
  "workItemTitle": "Fix auth bug",
  "personaId": "ps-r8d2j",
  "personaName": "Engineer",
  "projectId": "pj-x7k2m",
  "projectName": "tictactoe"
}
```

**`execution.completed`**

```json
{
  "executionId": "ex-a8k2f",
  "workItemId": "wi-p9f3n",
  "workItemTitle": "Fix auth bug",
  "personaId": "ps-r8d2j",
  "personaName": "Engineer",
  "projectId": "pj-x7k2m",
  "projectName": "tictactoe",
  "outcome": "success",
  "durationMs": 45000,
  "costUsd": 0.12,
  "summary": "Fixed the authentication token validation..."
}
```

**`execution.failed`**

```json
{
  "executionId": "ex-a8k2f",
  "workItemId": "wi-p9f3n",
  "workItemTitle": "Fix auth bug",
  "personaId": "ps-r8d2j",
  "personaName": "Engineer",
  "projectId": "pj-x7k2m",
  "projectName": "tictactoe",
  "outcome": "error",
  "durationMs": 5000,
  "costUsd": 0.02,
  "error": "Rate limit exceeded"
}
```

**`work_item.state_changed`**

```json
{
  "workItemId": "wi-p9f3n",
  "workItemTitle": "Fix auth bug",
  "projectId": "pj-x7k2m",
  "fromState": "in_progress",
  "toState": "review",
  "triggeredBy": "Engineer"
}
```

**`proposal.created`**

```json
{
  "proposalId": "pr-k3m8n",
  "executionId": "ex-a8k2f",
  "workItemId": "wi-p9f3n",
  "workItemTitle": "Fix auth bug",
  "proposalType": "state_transition",
  "projectId": "pj-x7k2m"
}
```

**`proposal.resolved`**

```json
{
  "proposalId": "pr-k3m8n",
  "status": "approved",
  "resolvedBy": "user",
  "workItemId": "wi-p9f3n",
  "projectId": "pj-x7k2m"
}
```

**`budget.threshold`**

```json
{
  "projectId": "pj-x7k2m",
  "projectName": "tictactoe",
  "threshold": "daily",
  "currentSpend": 4.50,
  "limit": 5.00,
  "percentUsed": 90
}
```

**`comment.created`**

```json
{
  "commentId": "cm-j2k8f",
  "workItemId": "wi-p9f3n",
  "workItemTitle": "Fix auth bug",
  "authorName": "Engineer",
  "contentPreview": "Completed the token validation fix...",
  "projectId": "pj-x7k2m"
}
```

### What's Excluded from Payloads

To avoid leaking sensitive information:
- **No API keys or secrets** — never include project settings, persona system prompts, or webhook secrets
- **No full execution logs** — only summary and outcome; consumers can query the API for details
- **No file contents** — file paths are acceptable (in `file_changed` events, if added later), but not content
- **No full prompt text** — persona prompts and execution prompts stay internal

Consumers who need more detail can call back to the AgentOps API using the IDs in the payload.

---

## 5. Delivery Infrastructure

### Async Dispatch Architecture

Webhook delivery must not block the main event flow. When a subscribable event fires:

```
Internal event (broadcast/audit)
  │
  ▼
[Event interceptor] — checks registered subscriptions
  │
  ├── No matching subscriptions → nothing
  │
  └── Matching subscriptions found
        │
        ▼
      [Enqueue delivery] — insert into webhook_delivery_queue table
        │
        ▼
      [Delivery worker] — processes queue asynchronously
        │
        ├── POST to subscriber URL with HMAC signature
        │
        ├── 2xx response → mark delivered, log success
        │
        └── Non-2xx or timeout → schedule retry
```

### Retry Strategy

Exponential backoff with jitter:

| Attempt | Delay | Cumulative |
|---------|-------|------------|
| 1 (immediate) | 0s | 0s |
| 2 | ~30s | 30s |
| 3 | ~2min | 2.5min |
| 4 | ~8min | 10.5min |
| 5 | ~30min | 40.5min |

Formula: `delay = min(baseDelay * 2^(attempt-1), maxDelay) + random(0, jitter)`
- `baseDelay` = 30 seconds
- `maxDelay` = 30 minutes
- `jitter` = 0-5 seconds
- `maxRetries` = 5

After 5 failed attempts, the delivery is marked as `failed` (dead letter).

### Timeout

- HTTP request timeout: 10 seconds
- If the endpoint doesn't respond within 10s, treat as a failure and retry

### HMAC Signing

Every delivery is signed using the subscription's secret:

```
X-Webhook-Signature: sha256=<hmac-of-body>
X-Webhook-Delivery-Id: whd-p9f3n
X-Webhook-Event: execution.completed
Content-Type: application/json
```

Signature computation:
```typescript
const signature = "sha256=" + crypto
  .createHmac("sha256", subscription.secret)
  .update(JSON.stringify(payload))
  .digest("hex");
```

Consumers verify using `crypto.timingSafeEqual` — same pattern as inbound webhook verification (RES.WEBHOOKS.INBOUND section 6).

### Implementation: In-Process vs Separate Worker

For a local-first app with moderate event volume:

| Approach | Pros | Cons |
|----------|------|------|
| **In-process async** (setTimeout/setImmediate) | Zero infrastructure, simple | Retries lost on restart, blocks event loop if many deliveries |
| **SQLite queue + polling worker** | Durable, survives restarts | Polling adds latency (1-5s), more complex |
| **BullMQ / external queue** | Robust, battle-tested | Adds Redis dependency — violates local-first |

**Recommended: SQLite queue + in-process polling worker.**

The delivery queue is a SQLite table. A lightweight in-process worker polls every 2 seconds for pending deliveries. This gives:
- Durability — deliveries survive backend restarts
- No external dependencies — stays local-first
- Retry support — failed deliveries stay in the queue with a `nextRetryAt` timestamp
- Acceptable latency — 0-2 second delay from event to delivery attempt

### Delivery Queue Table

```sql
CREATE TABLE webhook_delivery_queue (
  id TEXT PRIMARY KEY,                          -- "whd-p9f3n"
  subscription_id TEXT NOT NULL REFERENCES webhook_subscriptions(id),
  event_type TEXT NOT NULL,                     -- "execution.completed"
  payload TEXT NOT NULL,                        -- JSON string
  status TEXT NOT NULL DEFAULT 'pending',       -- "pending" | "delivered" | "failed"
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_retry_at INTEGER NOT NULL,              -- timestamp_ms
  created_at INTEGER NOT NULL,                 -- timestamp_ms
  delivered_at INTEGER,                        -- timestamp_ms (when successfully delivered)
  last_error TEXT,                             -- last failure reason
  last_status_code INTEGER,                    -- HTTP status code of last attempt
  last_response_body TEXT                      -- truncated response body (first 1KB)
);
CREATE INDEX idx_delivery_queue_status ON webhook_delivery_queue(status, next_retry_at);
CREATE INDEX idx_delivery_queue_subscription ON webhook_delivery_queue(subscription_id);
```

### Auto-Disable on Persistent Failure

If a subscription accumulates 10+ consecutive failed deliveries (all retries exhausted), auto-disable the subscription:
- Set `enabled = false`, `disabledReason = "Auto-disabled: 10+ consecutive delivery failures"`
- Log an audit event
- Show a warning in the Settings UI: "This webhook was auto-disabled due to persistent delivery failures. Fix the endpoint and re-enable."
- Do NOT delete queued events — they'll be retried when re-enabled

---

## 6. Delivery Log

### Visible in Settings

Each subscription has a delivery log showing recent attempts:

```
┌─────────────────────────────────────────────────────────────┐
│ Webhook: Slack Alerts — Delivery Log                         │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ whd-001  execution.completed  200 OK   5m ago   32ms    │ │
│ │ whd-002  execution.started    200 OK   12m ago  45ms    │ │
│ │ whd-003  execution.failed     200 OK   1h ago   28ms    │ │
│ │ whd-004  proposal.created     502 ⚠    2h ago   10012ms │ │
│ │          Retried 3x → delivered on attempt 4             │ │
│ │ whd-005  execution.completed  200 OK   3h ago   31ms    │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Showing 50 of 342 deliveries  [Load More]                    │
│                                                              │
│ Filter: [All Events ▾]  [All Statuses ▾]                     │
└─────────────────────────────────────────────────────────────┘
```

Each row shows:
- Delivery ID
- Event type
- HTTP status code (color-coded: green 2xx, amber 4xx, red 5xx/timeout)
- Time ago
- Response latency
- Retry history (if retried)

Clicking a row expands to show the full payload sent, response body (truncated to 1KB), and all attempt timestamps.

### Retention

Keep delivery log entries for 30 days, then auto-purge. This prevents the table from growing unbounded. Configurable in Settings > Integrations > Outbound Webhooks.

---

## 7. Relationship to Notifications (RES.NOTIFY.*)

### Are Webhooks a Notification Channel?

The notifications system (RES.NOTIFY.UX, RES.NOTIFY.INTEGRATIONS) and outbound webhooks serve different audiences:

| Aspect | Notifications | Outbound Webhooks |
|--------|--------------|-------------------|
| **Audience** | End users (project owners, team members) | Developers, external systems |
| **Channels** | In-app, Slack bot messages, email | HTTP POST to arbitrary URLs |
| **Content** | Human-readable, formatted (Block Kit, HTML) | Machine-readable JSON envelopes |
| **Filtering** | Per-user preference (critical/warning/info severity) | Per-subscription event type list |
| **Actions** | Approve/reject buttons, deep links | Consumer handles actions externally |
| **Delivery** | Best-effort (Slack API, email SMTP) | Guaranteed (retry + dead letter) |

### Shared Infrastructure

Despite different audiences, they share the same event source. The recommended architecture:

```
Internal event (broadcast/audit)
  │
  ▼
[Event bus / interceptor]
  │
  ├── Webhook dispatcher → HTTP POST with retry
  │
  └── Notification dispatcher → Slack bot, email, in-app
```

Both dispatchers:
1. Listen to the same internal events
2. Check their respective subscriptions/preferences
3. Dispatch independently

The event bus is the shared piece. It can be a simple in-process pub/sub (Node.js EventEmitter or a typed event emitter library) that both dispatchers subscribe to:

```typescript
// Shared event bus
const eventBus = new TypedEventEmitter<OutboundEventMap>();

// Webhook dispatcher subscribes
eventBus.on("execution.completed", (data) => {
  webhookDispatcher.enqueueMatchingSubscriptions("execution.completed", data);
});

// Notification dispatcher subscribes
eventBus.on("execution.completed", (data) => {
  notificationDispatcher.sendToSubscribedUsers("execution.completed", data);
});
```

### Can Notifications Be Built on Webhooks?

Technically, Slack notifications could be implemented as a built-in outbound webhook pointed at Slack's incoming webhook URL. But this conflates two concerns:
- Notifications need user-facing formatting (Block Kit), severity-based filtering, and interactive actions
- Webhooks are raw JSON for machine consumption

**Recommendation:** Keep them separate but share the event bus. Notifications may use the delivery queue infrastructure (retry logic, logging) but have their own formatting and routing layer.

---

## 8. Implementation Phases

### Phase 1: Core Webhook Delivery (Medium Effort)

**Goal:** Outbound webhook subscriptions with reliable delivery for execution events.

Tasks:
- Add `webhook_subscriptions` table with migration
- Add `webhook_delivery_queue` table
- Implement in-process event bus (TypedEventEmitter)
- Hook broadcast sites to emit to event bus (execution started/completed/failed)
- Implement SQLite queue + polling delivery worker
- HMAC signing on outbound requests
- Retry logic with exponential backoff (5 attempts)
- CRUD endpoints for subscriptions (`/api/webhook-subscriptions`)
- Settings > Integrations > Outbound Webhooks UI (list, create, edit, delete)
- Test/ping functionality
- Delivery log view per subscription

### Phase 2: Extended Events + Health (Medium Effort)

**Goal:** More event types, auto-disable, and operational visibility.

Tasks:
- Add remaining event types: `work_item.state_changed`, `proposal.created`, `proposal.resolved`, `comment.created`
- Budget threshold event (requires cost tracking — ties to RES.ANALYTICS.METRICS)
- Auto-disable subscriptions after 10+ consecutive failures
- Health indicator in subscription list (healthy/degraded/failing)
- Delivery log filtering by event type and status
- Delivery log retention (auto-purge after 30 days)
- Wildcard event subscriptions (`execution.*`)

### Phase 3: Shared Event Bus + Notification Foundation (Higher Effort)

**Goal:** Extract the event bus as shared infrastructure for both webhooks and notifications.

Tasks:
- Extract event bus into reusable module (`packages/backend/src/events/event-bus.ts`)
- Migrate webhook dispatcher to use event bus
- Define notification dispatcher interface (for RES.NOTIFY.* implementation)
- Event replay capability — re-deliver failed events on demand
- Batch delivery option — aggregate multiple events into one webhook call (configurable window)

---

## 9. Cross-References

| Document | Relationship |
|----------|-------------|
| `docs/proposals/webhooks/inbound-triggers.md` (RES.WEBHOOKS.INBOUND) | Inbound triggers share the Settings > Integrations UI; webhook_deliveries table is similar to outbound delivery_queue; HMAC signing/verification patterns are shared |
| `docs/proposals/notifications/integrations.md` (RES.NOTIFY.INTEGRATIONS) | Notifications and outbound webhooks share the same event source; both need a dispatch pipeline but with different formatting (human vs machine) |
| `docs/proposals/notifications/ux-design.md` (RES.NOTIFY.UX) | Notification preferences UI is a sibling to webhook subscription UI in Settings |
| `docs/proposals/analytics/metrics.md` (RES.ANALYTICS.METRICS) | Budget threshold event requires cost tracking infrastructure; analytics and webhooks both consume execution events |
| `packages/shared/src/ws-events.ts` | 14 WsEvent types are the source events; outbound webhooks expose a curated subset (8 types) |
| `packages/backend/src/audit.ts` | 7 audit event types overlap with webhook events; both systems capture execution lifecycle events |

---

## 10. Design Decisions

1. **Curated event subset, not raw WsEvent forwarding.** Internal WsEvents include streaming chunks (`agent_output_chunk`), context usage, and sub-agent details that external consumers don't need. The outbound event catalog is intentionally smaller (8 types) with stable, well-documented payloads. This avoids coupling external integrations to internal event structure.

2. **SQLite queue over in-memory queue for delivery.** A local-first app may restart at any time. An in-memory queue loses pending deliveries on restart. The SQLite delivery queue survives restarts, supports retry scheduling via `next_retry_at`, and adds minimal overhead (~2s polling interval).

3. **Separate from notifications, shared event bus.** Outbound webhooks (machine-readable JSON, developer audience) and notifications (human-readable, Slack/email) serve different purposes. Forcing notifications through webhooks would require consumers to format messages themselves. A shared event bus lets both systems subscribe to the same events independently, with their own formatting and delivery logic.

4. **Auto-disable after persistent failures.** A broken webhook endpoint that fails repeatedly wastes resources (retry attempts, queue entries) and can mask real delivery issues for other subscriptions. Auto-disabling after 10 consecutive failures (50 total attempts including retries) with a clear UI warning balances protection with recoverability.

5. **No payload customization in Phase 1.** Unlike inbound triggers (which have Handlebars templates for prompt building), outbound webhooks use a fixed payload format per event type. This simplifies implementation and ensures all consumers see the same data structure. If payload customization is needed later (field selection, renaming), it can be added as a Phase 3 feature without breaking existing subscriptions.
