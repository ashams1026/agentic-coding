# Inbound Triggers from External Systems

> Research document for **RES.WEBHOOKS.INBOUND**. Design only — no implementation tasks.

---

## 1. Current State Audit

### How Executions Are Triggered Today

AgentOps has exactly one trigger mechanism: **workflow-driven dispatch**.

When a work item's state changes (via `route_to_state` MCP tool or manual update in the UI), `dispatchForState()` at `dispatch.ts:23` looks up the persona assignment for the new state and spawns an execution:

```
Work item state change → dispatchForState(workItemId, stateName)
  → personaAssignments lookup (projectId + stateName)
  → canSpawn() / enqueue() in concurrency.ts
  → executionManager.startExecution()
```

There is **no trigger table** in the schema — `schema.ts` has no trigger-related tables. The scheduling research (`docs/proposals/scheduling/infrastructure.md`) proposed a `schedules` table, but that's for recurring cron-based triggers, not event-driven inbound triggers.

### What's Missing

1. **No webhook receiver** — no endpoint accepts incoming HTTP requests from external systems
2. **No trigger configuration** — no way to define "when X happens externally, do Y"
3. **No payload mapping** — no way to transform an incoming GitHub/Slack payload into an agent prompt
4. **No external source authentication** — no HMAC verification, no API key validation for inbound requests

---

## 2. GitHub Integration

### Use Cases

| Event | Agent Action | Example |
|-------|-------------|---------|
| PR opened | Code review | "Review this PR: [title], [diff URL]" |
| Issue created | Bug triage | "Triage this issue: [title], [body]" |
| CI failed | Fix investigation | "CI failed on branch [name]: [log URL]. Investigate." |
| Review requested | Targeted review | "Review requested by [user] on PR #[num]" |
| Push to branch | Automated testing | "Run tests for changes in [commit range]" |

### Implementation Approach: GitHub App

A GitHub App is preferable to raw webhooks because:
- Fine-grained permissions (read code, write comments, read PRs)
- Per-repository installation (user controls which repos trigger)
- Webhook secret rotation built-in
- Can post review comments back to GitHub via API

### Webhook Receiver

```
POST /api/webhooks/github
Headers:
  X-GitHub-Event: pull_request
  X-Hub-Signature-256: sha256=<hmac>
  X-GitHub-Delivery: <uuid>
Body: GitHub event payload (JSON)
```

Processing flow:
1. Verify HMAC signature against stored webhook secret
2. Parse `X-GitHub-Event` header to determine event type
3. Match against configured trigger rules (see section 5)
4. Extract relevant fields from payload (PR title, diff URL, issue body, etc.)
5. Build agent prompt from template with extracted variables
6. Dispatch execution via existing concurrency system

### GitHub-Specific Payload Mapping

| Event Type | Extracted Variables |
|-----------|-------------------|
| `pull_request` (opened/synchronize) | `pr.title`, `pr.number`, `pr.html_url`, `pr.diff_url`, `pr.body`, `pr.user.login`, `pr.base.ref`, `pr.head.ref` |
| `issues` (opened) | `issue.title`, `issue.number`, `issue.html_url`, `issue.body`, `issue.user.login`, `issue.labels[].name` |
| `check_suite` (completed, conclusion=failure) | `check_suite.head_branch`, `check_suite.head_sha`, `check_suite.app.name`, `repository.html_url` |
| `pull_request_review` (submitted) | `review.user.login`, `review.body`, `pull_request.title`, `pull_request.number` |

### GitHub App Setup Flow

In Settings > Integrations > GitHub:

```
┌─────────────────────────────────────────────────────────┐
│ GitHub Integration                                       │
│                                                          │
│ Status: Not connected                                    │
│                                                          │
│ [Connect GitHub App]                                     │
│                                                          │
│ This will:                                               │
│ 1. Create a GitHub App for your AgentOps instance        │
│ 2. Ask you to install it on selected repositories        │
│ 3. Configure webhook delivery to this server             │
│                                                          │
│ Your server must be accessible from the internet         │
│ (see Tunnel section below)                               │
└─────────────────────────────────────────────────────────┘
```

**Challenge for local-first:** GitHub webhooks require a publicly accessible URL. For local development:
- Suggest ngrok, Cloudflare Tunnel, or Tailscale Funnel
- Display the webhook URL with a "copy" button after tunnel is configured
- Phase 2: built-in tunnel support (backend starts a tunnel automatically)

---

## 3. Generic Webhook Receiver

### Design

A universal webhook endpoint that accepts any HTTP POST and maps it to an agent execution:

```
POST /api/webhooks/:triggerId
Headers:
  Content-Type: application/json
  X-Webhook-Secret: <secret> (optional — per-trigger HMAC)
Body: arbitrary JSON payload
```

Each trigger has a unique ID and configuration stored in the DB:

```typescript
interface WebhookTrigger {
  id: string;               // "trg-a8k2f"
  name: string;             // "Deploy Notification"
  projectId: string;        // Target project
  personaId: string;        // Which persona handles this
  enabled: boolean;
  
  // Authentication
  secret: string;           // HMAC secret for signature verification
  
  // Payload → prompt mapping
  promptTemplate: string;   // Handlebars-style template
  payloadMapping: Record<string, string>;  // JSONPath expressions
  
  // Filtering
  eventFilter?: string;     // Optional: only trigger on matching events
  
  createdAt: string;
  lastTriggeredAt: string | null;
  triggerCount: number;
}
```

### Prompt Template System

Users define a prompt template with variables extracted from the payload:

```handlebars
Review the pull request "{{payload.title}}" (#{{payload.number}}).

PR URL: {{payload.html_url}}
Author: {{payload.user.login}}
Description: {{payload.body}}

Focus on: correctness, security issues, and code style.
```

Variables are resolved using dot-notation JSONPath on the incoming payload. Unresolved variables are replaced with `[missing: variable.name]` and a warning is logged.

### Example: Custom CI Integration

```
Trigger: "CI Failure Alert"
Endpoint: POST /api/webhooks/trg-ci-fail
Secret: "sk-webhook-abc123"
Persona: Engineer
Template:
  "CI pipeline failed on branch {{payload.branch}}.
   Build URL: {{payload.build_url}}
   Error: {{payload.error_message}}
   Investigate and fix the issue."
```

---

## 4. Slack Triggers

### Use Cases

| Trigger | Example |
|---------|---------|
| Slash command | `/woof review https://github.com/org/repo/pull/123` |
| Bot mention | `@woof please triage this issue` |
| Reaction | Add specific emoji to a message → agent processes it |

### Implementation: Slack App

A Slack App with:
- **Slash commands** — `/woof <action> <args>` registered in the Slack App config
- **Event subscriptions** — `app_mention` event for @woof mentions
- **Interactive messages** — buttons for approve/reject agent proposals

### Slack Webhook Receiver

```
POST /api/webhooks/slack
Headers:
  X-Slack-Signature: v0=<hmac>
  X-Slack-Request-Timestamp: <unix-timestamp>
Body: Slack event payload or slash command payload
```

Processing:
1. Verify request signature using Slack signing secret + request timestamp (replay protection)
2. Handle `url_verification` challenge (Slack setup requirement)
3. Parse event type (slash command, app_mention, etc.)
4. Extract relevant text and metadata
5. Build prompt and dispatch execution
6. Respond to Slack with acknowledgment (200 OK within 3 seconds — Slack requirement)
7. Post execution results back to the Slack channel when done

### Slack-Specific Considerations

- **3-second response requirement** — Slack expects a 200 OK within 3 seconds. The agent execution is async, so immediately acknowledge, then post results via `chat.postMessage` when the execution completes.
- **Thread replies** — when triggered from a thread, post results in the same thread.
- **Channel scoping** — allow configuration of which channels the bot responds in (don't trigger on every mention in #general).

### Setup Flow

In Settings > Integrations > Slack:

```
┌─────────────────────────────────────────────────────────┐
│ Slack Integration                                        │
│                                                          │
│ Status: Not connected                                    │
│                                                          │
│ 1. Create a Slack App at api.slack.com/apps              │
│ 2. Add slash command: /woof                              │
│    Request URL: https://your-server/api/webhooks/slack   │
│ 3. Add bot scope: chat:write, app_mentions:read          │
│ 4. Install to workspace                                  │
│ 5. Paste Bot Token and Signing Secret below:             │
│                                                          │
│ Bot Token:       [xoxb-__________________________]       │
│ Signing Secret:  [________________________________]      │
│                                                          │
│               [Save]  [Test Connection]                   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Trigger Configuration UX

### Where Triggers Are Managed

**Settings > Integrations** — a new settings section for all external connections:

```
Settings
  ├── Projects
  ├── Workflows
  ├── Costs & Budgets
  ├── Integrations        ← NEW
  │     ├── GitHub
  │     ├── Slack
  │     └── Custom Webhooks
  └── Appearance
```

### Trigger List View

```
┌─────────────────────────────────────────────────────────────┐
│ Integrations > Custom Webhooks                               │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Deploy Notification          Enabled ●  Last: 2h ago     │ │
│ │ POST /api/webhooks/trg-abc   Engineer  ·  Project Alpha  │ │
│ │ Triggered 47 times                     [Edit] [Delete]   │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ PR Review Trigger            Enabled ●  Last: 15m ago    │ │
│ │ POST /api/webhooks/trg-def   Code Reviewer · All Projects│ │
│ │ Triggered 189 times                    [Edit] [Delete]   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [+ Create Webhook Trigger]                                   │
└─────────────────────────────────────────────────────────────┘
```

### Create/Edit Trigger Dialog

```
┌──────────────────────────────────────────────────────────┐
│ Create Webhook Trigger                                    │
│                                                           │
│ Name:     [____________________________]                  │
│ Project:  [Project Alpha ▾]  or ☐ All projects           │
│ Persona:  [Code Reviewer ▾]                               │
│                                                           │
│ Endpoint: POST /api/webhooks/trg-<auto>                   │
│           [Copy URL]                                      │
│                                                           │
│ Secret:   [auto-generated]  [Regenerate]  [Copy]          │
│                                                           │
│ Event Filter (optional):                                  │
│   [payload.action == "opened" ▾]                          │
│                                                           │
│ Prompt Template:                                          │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Review the changes described below:                     ││
│ │                                                         ││
│ │ Title: {{payload.title}}                                ││
│ │ URL: {{payload.url}}                                    ││
│ │ Description: {{payload.description}}                    ││
│ └────────────────────────────────────────────────────────┘│
│                                                           │
│ Available variables: {{payload.*}}, {{headers.*}},        │
│   {{trigger.name}}, {{trigger.id}}, {{project.name}}     │
│                                                           │
│ [Test with Sample Payload]                                │
│                                                           │
│              [Cancel]  [Create Trigger]                    │
└──────────────────────────────────────────────────────────┘
```

### "Test with Sample Payload"

A test panel that lets users paste a JSON payload and see the resolved prompt:

```
┌────────────────────────────────────────────────────────────┐
│ Test Trigger                                                │
│                                                             │
│ Sample Payload (JSON):                                      │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ {                                                         ││
│ │   "title": "Add dark mode",                               ││
│ │   "url": "https://github.com/org/repo/pull/42",           ││
│ │   "description": "Implements dark mode toggle"             ││
│ │ }                                                         ││
│ └──────────────────────────────────────────────────────────┘│
│                                                             │
│ Resolved Prompt:                                            │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Review the changes described below:                       ││
│ │                                                           ││
│ │ Title: Add dark mode                                      ││
│ │ URL: https://github.com/org/repo/pull/42                  ││
│ │ Description: Implements dark mode toggle                  ││
│ └──────────────────────────────────────────────────────────┘│
│                                                             │
│ [Send Test Execution]  (runs the agent with this prompt)    │
└────────────────────────────────────────────────────────────┘
```

---

## 6. Security

### Webhook Secret Verification (HMAC)

Every webhook trigger has a unique secret. Incoming requests must include a signature:

```
X-Webhook-Signature: sha256=<hmac-of-body>
```

Verification:
```typescript
function verifySignature(body: Buffer, secret: string, signature: string): boolean {
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```

GitHub uses `X-Hub-Signature-256`, Slack uses `X-Slack-Signature` with a different scheme. The generic endpoint uses `X-Webhook-Signature`. Each source type has its own verification function.

### Rate Limiting

Per-trigger rate limits to prevent abuse:

| Limit | Value | Rationale |
|-------|-------|-----------|
| **Per-trigger burst** | 10 req/minute | Prevent runaway CI hooks |
| **Per-trigger sustained** | 60 req/hour | Normal use shouldn't exceed this |
| **Global** | 100 req/minute | Protect the server overall |

Exceeding the limit returns `429 Too Many Requests` with `Retry-After` header.

Implementation: in-memory rate limiter using a sliding window counter per trigger ID. No external dependencies needed (Redis, etc.) — this is a local-first app.

### IP Allowlisting (Optional)

Per-trigger optional IP allowlist:
- GitHub webhook IPs: `140.82.112.0/20`, `185.199.108.0/22` (published at `api.github.com/meta`)
- Slack webhook IPs: not published, but signature verification is sufficient
- Custom triggers: user-configurable list

Default: no IP filtering (rely on HMAC). IP allowlisting is an optional extra layer.

### Replay Protection

Prevent replay attacks by checking:
1. **Timestamp** — reject requests with timestamps older than 5 minutes (GitHub includes `X-GitHub-Delivery`, Slack includes `X-Slack-Request-Timestamp`)
2. **Deduplication** — store the last N delivery IDs per trigger; reject duplicates. GitHub provides `X-GitHub-Delivery` UUID; for generic webhooks, hash the body + timestamp.

### Malformed Payload Handling

- Invalid JSON → 400 Bad Request, log warning
- Missing required fields for prompt template → execute with `[missing: field]` placeholders, log warning
- Oversized payload (>1MB) → 413 Payload Too Large, reject
- Missing signature → 401 Unauthorized (if secret is configured)

---

## 7. Data Model

### Triggers Table

```sql
CREATE TABLE webhook_triggers (
  id TEXT PRIMARY KEY,                    -- "trg-a8k2f"
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,              -- "github" | "slack" | "generic"
  project_id TEXT REFERENCES projects(id),-- null = all projects
  persona_id TEXT NOT NULL REFERENCES personas(id),
  enabled INTEGER NOT NULL DEFAULT 1,
  secret TEXT NOT NULL,                   -- HMAC secret
  prompt_template TEXT NOT NULL,
  event_filter TEXT,                      -- optional filter expression
  ip_allowlist TEXT,                      -- JSON array of CIDR ranges
  rate_limit_per_minute INTEGER DEFAULT 10,
  last_triggered_at INTEGER,              -- timestamp_ms
  trigger_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,            -- timestamp_ms
  updated_at INTEGER NOT NULL             -- timestamp_ms
);
```

### Trigger Executions

When a webhook fires, the resulting execution record should link back to the trigger:

```sql
ALTER TABLE executions ADD COLUMN trigger_id TEXT REFERENCES webhook_triggers(id);
ALTER TABLE executions ADD COLUMN trigger_type TEXT;  -- "webhook" | "schedule" | "workflow" | "manual"
```

This aligns with the `trigger_type` extension proposed in `docs/proposals/scheduling/infrastructure.md` for scheduled executions.

### Delivery Log

Track every incoming webhook attempt (successful or not):

```sql
CREATE TABLE webhook_deliveries (
  id TEXT PRIMARY KEY,
  trigger_id TEXT NOT NULL REFERENCES webhook_triggers(id),
  received_at INTEGER NOT NULL,           -- timestamp_ms
  status INTEGER NOT NULL,                -- HTTP status code returned
  source_ip TEXT,
  event_type TEXT,                        -- e.g., "pull_request", "issues"
  delivery_id TEXT,                       -- X-GitHub-Delivery or similar
  execution_id TEXT REFERENCES executions(id),  -- null if rejected
  error TEXT,                             -- null if success
  payload_size INTEGER
);
CREATE INDEX idx_deliveries_trigger ON webhook_deliveries(trigger_id);
```

This enables a delivery history view in the trigger detail panel — showing each attempt, whether it was accepted or rejected, and linking to the resulting execution.

---

## 8. Implementation Phases

### Phase 1: Generic Webhook Receiver (Medium Effort)

**Goal:** Basic webhook-to-execution pipeline with prompt templates.

Tasks:
- Add `webhook_triggers` table with migration
- Add `webhook_deliveries` table
- Add `trigger_id` and `trigger_type` columns to executions
- Implement `POST /api/webhooks/:triggerId` endpoint with HMAC verification
- Implement prompt template resolution (Handlebars-style `{{payload.*}}`)
- CRUD endpoints for triggers (`/api/triggers`)
- Settings > Integrations > Custom Webhooks UI (list, create, edit, delete)
- Rate limiting (in-memory sliding window)
- Test panel with sample payload

### Phase 2: GitHub Integration (Medium Effort)

**Goal:** First-class GitHub support with event-specific parsing.

Tasks:
- GitHub-specific webhook receiver at `/api/webhooks/github`
- GitHub HMAC verification (`X-Hub-Signature-256`)
- Event type routing (pull_request, issues, check_suite, etc.)
- Pre-built payload mappings for common GitHub events
- GitHub App setup wizard in Settings > Integrations > GitHub
- Post execution results back to GitHub (PR comments, check runs)

### Phase 3: Slack Integration + Advanced (Higher Effort)

**Goal:** Slack commands and interactive responses.

Tasks:
- Slack webhook receiver with signature verification
- Slash command handler (`/woof`)
- `app_mention` event handler
- Async response posting via Slack API
- Thread-aware responses
- Channel scoping configuration
- IP allowlisting option for all trigger types

---

## 9. Cross-References

| Document | Relationship |
|----------|-------------|
| `docs/proposals/webhooks/outbound-events.md` (future — RES.WEBHOOKS.OUTBOUND) | Outbound webhooks share delivery infrastructure; inbound triggers may fire outbound events (execution started/completed) |
| `docs/proposals/scheduling/infrastructure.md` (RES.SCHED.INFRA) | Schedules and triggers are separate concepts but share `trigger_type` on executions; both bypass the workflow dispatch path |
| `docs/proposals/scheduling/ux-design.md` (RES.SCHED.UX) | Settings > Integrations is a sibling of the scheduling UI in Persona Manager |
| `docs/proposals/notifications/` | Notification channels (Slack/email) could reuse the Slack integration configured for inbound triggers |
| `packages/backend/src/agent/dispatch.ts` | Current dispatch mechanism — webhook triggers bypass `dispatchForState()` and call `executionManager.startExecution()` directly |
| `packages/backend/src/agent/concurrency.ts` | Webhook-triggered executions must respect the same concurrency pool (`canSpawn`/`enqueue`) |

---

## 10. Design Decisions

1. **Generic webhook receiver first, then GitHub/Slack.** The generic endpoint handles any HTTP source, making it immediately useful for CI/CD, monitoring systems, and custom integrations. GitHub and Slack add convenience (pre-built mappings, dedicated setup wizards) but aren't strictly necessary.

2. **Prompt templates with `{{payload.*}}` syntax over code-based transformations.** Handlebars-style templates are readable, testable (sample payload preview), and don't require users to write JavaScript/code. For complex transformations, the generic template is sufficient — advanced users can pre-process payloads with middleware.

3. **Webhook triggers bypass workflow dispatch, but respect concurrency.** A webhook-triggered execution doesn't need a work item or workflow state — it creates a standalone execution (like scheduled runs in RES.SCHED.INFRA). But it must go through `canSpawn()/enqueue()` to avoid overloading the system.

4. **Delivery log for debuggability.** Webhooks fail silently by nature (the sender doesn't know if the receiver processed correctly). A delivery log with status codes and error messages makes debugging straightforward — "why didn't my GitHub PR trigger a review?"

5. **HMAC verification required for all triggers.** Even for internal use, every trigger has a secret. This prevents accidental triggers from scanners, bots, or misconfigured systems hitting the endpoint. The secret is auto-generated on trigger creation.
