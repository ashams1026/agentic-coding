# REST API & WebSocket Protocol

AgentOps exposes a REST API on port **3001** and a WebSocket endpoint for real-time updates. All endpoints return JSON.

**Base URL:** `http://localhost:3001`

## Response Format

All responses follow a consistent wrapper:

```typescript
// Single entity
{ "data": { ... } }

// List
{ "data": [ ... ], "total": number }

// Error
{ "error": { "code": string, "message": string } }
```

---

## Projects

### List Projects

```
GET /api/projects
```

**Response:** `{ data: Project[], total: number }`

```bash
curl http://localhost:3001/api/projects
```

### Get Project

```
GET /api/projects/:id
```

**Response:** `{ data: Project }` | 404

```bash
curl http://localhost:3001/api/projects/pj-xxxx
```

### Create Project

```
POST /api/projects
```

**Request body** (`CreateProjectRequest`):

```typescript
{
  name: string;           // required — display name
  path: string;           // required — absolute path (validated with existsSync)
  settings?: Record<string, unknown>;
}
```

**Response:** 201 `{ data: Project }` | 400

```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{ "name": "My Project", "path": "/home/user/project" }'
```

### Update Project

```
PATCH /api/projects/:id
```

**Request body** (`UpdateProjectRequest`):

```typescript
{
  name?: string;
  path?: string;          // validated with existsSync if provided
  settings?: Record<string, unknown>;
}
```

**Response:** `{ data: Project }` | 400 | 404

```bash
curl -X PATCH http://localhost:3001/api/projects/pj-xxxx \
  -H "Content-Type: application/json" \
  -d '{ "settings": { "maxConcurrent": 5, "monthCap": 100 } }'
```

### Delete Project

```
DELETE /api/projects/:id
```

**Response:** 204 | 404

```bash
curl -X DELETE http://localhost:3001/api/projects/pj-xxxx
```

---

## Work Items

### List Work Items

```
GET /api/work-items
```

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `projectId` | `string` | Filter by project |
| `parentId` | `string` | Filter by parent work item |

**Response:** `{ data: WorkItem[], total: number }`

```bash
curl "http://localhost:3001/api/work-items?projectId=pj-xxxx"
```

### Get Work Item

```
GET /api/work-items/:id
```

**Response:** `{ data: WorkItem }` | 404

### Create Work Item

```
POST /api/work-items
```

**Request body** (`CreateWorkItemRequest`):

```typescript
{
  projectId: ProjectId;               // required
  parentId?: WorkItemId;              // optional parent
  title: string;                      // required
  description?: string;               // defaults to ""
  priority?: Priority;                // "p0"-"p3", defaults to "p2"
  labels?: string[];                  // defaults to []
  context?: Record<string, unknown>;  // defaults to {}
}
```

New items start in `Backlog` state (`WORKFLOW.initialState`).

**Response:** 201 `{ data: WorkItem }`

```bash
curl -X POST http://localhost:3001/api/work-items \
  -H "Content-Type: application/json" \
  -d '{ "projectId": "pj-xxxx", "title": "Add login page", "priority": "p1" }'
```

### Update Work Item

```
PATCH /api/work-items/:id
```

**Request body** (`UpdateWorkItemRequest`):

```typescript
{
  title?: string;
  description?: string;
  priority?: Priority;
  labels?: string[];
  currentState?: string;              // must be a valid transition
  context?: Record<string, unknown>;
  assignedPersonaId?: PersonaId | null;
}
```

If `currentState` is provided, the transition is validated server-side via `isValidTransition()`. Invalid transitions return 400 with code `INVALID_TRANSITION`. A valid state change triggers:
- `state_change` WebSocket broadcast
- Audit trail entry
- `dispatchForState()` — persona execution
- `checkParentCoordination()` — parent auto-advance
- `checkMemoryGeneration()` — project memory

**Response:** `{ data: WorkItem }` | 400 | 404

```bash
curl -X PATCH http://localhost:3001/api/work-items/wi-xxxx \
  -H "Content-Type: application/json" \
  -d '{ "currentState": "In Progress" }'
```

### Retry Dispatch

```
POST /api/work-items/:id/retry
```

Re-dispatches the persona assigned to the work item's current state. Fire-and-forget.

**Response:** `{ data: { workItemId, state, dispatched: true } }` | 404

```bash
curl -X POST http://localhost:3001/api/work-items/wi-xxxx/retry
```

### Delete Work Item

```
DELETE /api/work-items/:id
```

Recursively deletes the work item and all descendants (children, grandchildren).

**Response:** 204

---

## Work Item Edges

### List Edges

```
GET /api/work-item-edges
```

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `workItemId` | `string` | Filter edges where item is `fromId` or `toId` |

**Response:** `{ data: WorkItemEdge[], total: number }`

### Create Edge

```
POST /api/work-item-edges
```

**Request body** (`CreateWorkItemEdgeRequest`):

```typescript
{
  fromId: WorkItemId;
  toId: WorkItemId;
  type: "blocks" | "depends_on" | "related_to";
}
```

**Response:** 201 `{ data: WorkItemEdge }`

```bash
curl -X POST http://localhost:3001/api/work-item-edges \
  -H "Content-Type: application/json" \
  -d '{ "fromId": "wi-aaa", "toId": "wi-bbb", "type": "blocks" }'
```

### Delete Edge

```
DELETE /api/work-item-edges/:id
```

**Response:** 204 | 404

---

## Personas

### List Personas

```
GET /api/personas
```

**Response:** `{ data: Persona[], total: number }`

### Get Persona

```
GET /api/personas/:id
```

**Response:** `{ data: Persona }` | 404

### Create Persona

```
POST /api/personas
```

**Request body** (`CreatePersonaRequest`):

```typescript
{
  name: string;                          // required
  description?: string;                  // defaults to ""
  avatar?: { color: string; icon: string }; // defaults to gray user icon
  systemPrompt: string;                  // required
  model: "opus" | "sonnet" | "haiku";    // required
  allowedTools?: string[];               // defaults to []
  mcpTools?: string[];                   // defaults to []
  maxBudgetPerRun?: number;              // defaults to 0 (unlimited)
}
```

**Response:** 201 `{ data: Persona }`

```bash
curl -X POST http://localhost:3001/api/personas \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Security Auditor",
    "systemPrompt": "You are a security auditor...",
    "model": "sonnet"
  }'
```

### Update Persona

```
PATCH /api/personas/:id
```

**Request body** (`UpdatePersonaRequest`):

```typescript
{
  name?: string;
  description?: string;
  avatar?: { color: string; icon: string };
  systemPrompt?: string;
  model?: "opus" | "sonnet" | "haiku";
  allowedTools?: string[];
  mcpTools?: string[];
  maxBudgetPerRun?: number;
}
```

**Response:** `{ data: Persona }` | 400 | 404

### Delete Persona

```
DELETE /api/personas/:id
```

**Response:** 204 | 404

---

## Persona Assignments

### List Assignments

```
GET /api/persona-assignments
```

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `projectId` | `string` | Filter by project |

**Response:** `{ data: PersonaAssignment[], total: number }`

```bash
curl "http://localhost:3001/api/persona-assignments?projectId=pj-xxxx"
```

### Upsert Assignment

```
PUT /api/persona-assignments
```

Creates or updates a persona assignment. Uses composite key `(projectId, stateName)` — if an assignment already exists for that project+state, the persona is replaced.

**Request body** (`UpsertPersonaAssignmentRequest`):

```typescript
{
  projectId: ProjectId;
  stateName: string;    // workflow state name (e.g., "Planning")
  personaId: PersonaId;
}
```

**Response:** `{ data: PersonaAssignment }`

```bash
curl -X PUT http://localhost:3001/api/persona-assignments \
  -H "Content-Type: application/json" \
  -d '{ "projectId": "pj-xxxx", "stateName": "In Progress", "personaId": "ps-xxxx" }'
```

---

## Comments

### List Comments

```
GET /api/comments
```

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `workItemId` | `string` | Filter by work item |

**Response:** `{ data: Comment[], total: number }`

```bash
curl "http://localhost:3001/api/comments?workItemId=wi-xxxx"
```

### Get Comment

```
GET /api/comments/:id
```

**Response:** `{ data: Comment }` | 404

### Create Comment

```
POST /api/comments
```

**Request body** (`CreateCommentRequest`):

```typescript
{
  workItemId: WorkItemId;
  authorType: "agent" | "user" | "system";
  authorId?: PersonaId;                // persona ID if agent-authored
  authorName: string;
  content: string;
  metadata?: Record<string, unknown>;
}
```

**Response:** 201 `{ data: Comment }`

```bash
curl -X POST http://localhost:3001/api/comments \
  -H "Content-Type: application/json" \
  -d '{ "workItemId": "wi-xxxx", "authorType": "user", "authorName": "Alice", "content": "Looks good!" }'
```

### Delete Comment

```
DELETE /api/comments/:id
```

**Response:** 204 | 404

---

## Executions

### List Executions

```
GET /api/executions
```

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `workItemId` | `string` | Filter by work item |

**Response:** `{ data: Execution[], total: number }`

### Get Execution

```
GET /api/executions/:id
```

**Response:** `{ data: Execution }` | 404

### Create Execution

```
POST /api/executions
```

**Request body** (`CreateExecutionRequest`):

```typescript
{
  workItemId: WorkItemId;
  personaId: PersonaId;
}
```

Creates an execution record with status `"pending"`, zero cost/duration, and empty summary/logs.

**Response:** 201 `{ data: Execution }`

### Update Execution

```
PATCH /api/executions/:id
```

**Request body** (`UpdateExecutionRequest`):

```typescript
{
  status?: "pending" | "running" | "completed" | "failed" | "cancelled";
  completedAt?: string;               // ISO 8601
  costUsd?: number;
  durationMs?: number;
  summary?: string;
  outcome?: "success" | "failure" | "rejected" | null;
  rejectionPayload?: RejectionPayload | null;
  logs?: string;
}
```

**Response:** `{ data: Execution }` | 400 | 404

### Delete Execution

```
DELETE /api/executions/:id
```

**Response:** 204 | 404

### Rewind Execution Files

```
POST /api/executions/:id/rewind
```

Reverts all file changes made by an execution back to their pre-execution state using the SDK's `rewindFiles()` API. Requires the execution to have `checkpointMessageId` set (enabled via `enableFileCheckpointing: true` in query options).

**Request body:**

```typescript
{
  dryRun?: boolean;  // default: false — if true, returns preview without reverting
}
```

**Response (success):** `{ data: RewindResult }`

```typescript
{
  canRewind: true;
  filesChanged: string[];   // list of file paths that were/would be reverted
  insertions: number;       // total lines added
  deletions: number;        // total lines removed
  dryRun: boolean;
}
```

**Error codes:**

| Status | Code | When |
|---|---|---|
| 400 | `NO_CHECKPOINT` | Execution has no `checkpointMessageId` (legacy or checkpointing not enabled) |
| 400 | `CANNOT_REWIND` | SDK reports files cannot be rewound |
| 404 | `NOT_FOUND` | Execution, work item, or project not found |
| 409 | `EXECUTION_RUNNING` | Cannot rewind a currently running execution |
| 500 | `REWIND_FAILED` | SDK rewind call threw an error |
| 503 | `NO_API_KEY` | Anthropic API key not configured |

**Side effects (non-dry-run only):**
- System comment posted on the work item with file change summary
- Audit trail entry logged (`fromState: "rewind"`, `toState: "reverted"`)

```bash
# Dry run — preview files that would be reverted
curl -X POST http://localhost:3001/api/executions/ex-xxxx/rewind \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'

# Actual rewind
curl -X POST http://localhost:3001/api/executions/ex-xxxx/rewind \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

---

## Proposals

### List Proposals

```
GET /api/proposals
```

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `workItemId` | `string` | Filter by work item |

**Response:** `{ data: Proposal[], total: number }`

### Get Proposal

```
GET /api/proposals/:id
```

**Response:** `{ data: Proposal }` | 404

### Create Proposal

```
POST /api/proposals
```

**Request body** (`CreateProposalRequest`):

```typescript
{
  executionId: ExecutionId;
  workItemId: WorkItemId;
  type: "task_creation" | "state_transition" | "review_request";
  payload?: Record<string, unknown>;
}
```

Created with status `"pending"`.

**Response:** 201 `{ data: Proposal }`

### Update Proposal

```
PATCH /api/proposals/:id
```

**Request body** (`UpdateProposalRequest`):

```typescript
{
  status: "pending" | "approved" | "rejected" | "expired";
  feedback?: string;
}
```

**Response:** `{ data: Proposal }` | 400 | 404

### Delete Proposal

```
DELETE /api/proposals/:id
```

**Response:** 204 | 404

---

## Dashboard

### Dashboard Stats

```
GET /api/dashboard/stats
```

Returns at-a-glance metrics for the dashboard.

**Response** (`DashboardStats`):

```typescript
{
  activeAgents: number;      // executions with status "running"
  pendingProposals: number;  // proposals with status "pending"
  needsAttention: number;    // blocked items + pending proposals
  todayCostUsd: number;      // sum of execution costs started today
}
```

```bash
curl http://localhost:3001/api/dashboard/stats
```

### Cost Summary

```
GET /api/dashboard/cost-summary
```

Returns 7-day cost history and monthly totals.

**Response** (`CostSummary`):

```typescript
{
  dailySpend: { date: string; costUsd: number }[]; // last 7 days
  monthTotal: number;   // total cost this calendar month
  monthCap: number;     // from first project's settings (default 50)
}
```

```bash
curl http://localhost:3001/api/dashboard/cost-summary
```

### Execution Stats

```
GET /api/dashboard/execution-stats
```

Returns aggregate execution metrics.

**Response** (`ExecutionStats`):

```typescript
{
  totalRuns: number;        // completed executions
  totalCostUsd: number;     // sum of all completed costs
  successRate: number;      // ratio (0-1) of successful outcomes
  averageDurationMs: number; // mean duration of completed runs
}
```

### Ready Work

```
GET /api/dashboard/ready-work
```

Returns up to 5 work items in "Ready" state with their assigned personas.

**Response** (`ReadyWorkResponse`):

```typescript
{
  data: { workItem: WorkItem; persona: Persona | null }[];
  total: number;
}
```

---

## Settings

### API Key — Check Status

```
GET /api/settings/api-key
```

**Response:**

```typescript
{ configured: boolean; maskedKey: string | null }
```

### API Key — Validate and Store

```
POST /api/settings/api-key
```

Validates the key by making a test call to the Anthropic API, then stores it in `~/.agentops/config.json`.

**Request body:**

```typescript
{ key: string }
```

**Response:** `{ valid: true, configured: true, maskedKey: string }` | 400

### API Key — Remove

```
DELETE /api/settings/api-key
```

**Response:** `{ configured: false, maskedKey: null }`

### Concurrency Stats

```
GET /api/settings/concurrency
```

Returns current agent concurrency from the in-memory tracker.

**Response:**

```typescript
{ active: number; queued: number }
```

### Database Stats

```
GET /api/settings/db-stats
```

**Response:**

```typescript
{
  sizeBytes: number;
  sizeMB: number;
  executionCount: number;
  projectCount: number;
  personaCount: number;
}
```

### Clear Old Executions

```
DELETE /api/settings/executions
```

Deletes execution records older than 30 days.

**Response:** `{ deleted: number }`

### Export Settings

```
GET /api/settings/export
```

Returns a JSON dump of projects, personas, and persona assignments for backup.

**Response:**

```typescript
{
  exportedAt: string;
  projects: Project[];
  personas: Persona[];
  personaAssignments: PersonaAssignment[];
}
```

### Import Settings

```
POST /api/settings/import
```

Imports projects, personas, and persona assignments. Uses `onConflictDoNothing()` for safe re-imports.

**Request body:**

```typescript
{
  projects?: Project[];
  personas?: Persona[];
  personaAssignments?: PersonaAssignment[];
}
```

**Response:** `{ imported: { projects: number, personas: number, personaAssignments: number } }` | 400

---

## Audit

### Query Audit Log

```
GET /api/audit
```

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `workItemId` | `string` | Filter by work item |
| `limit` | `string` | Max entries (default 50, max 500) |

**Response:** `{ data: AuditEntry[], total: number }`

```bash
curl "http://localhost:3001/api/audit?workItemId=wi-xxxx&limit=20"
```

---

## WebSocket Protocol

### Connection

```
ws://localhost:3001/ws
```

On connect, the server sends a welcome message:

```json
{ "type": "connected", "timestamp": "2026-03-30T10:00:00.000Z" }
```

All connected clients receive every event (broadcast model — no subscription filtering).

### Event Types

All events are JSON with a `type` discriminator field.

#### `state_change`

Fired when a work item transitions between workflow states.

```typescript
{
  type: "state_change";
  workItemId: WorkItemId;
  fromState: string;
  toState: string;
  triggeredBy: PersonaId | "user" | "system";
  timestamp: string;
}
```

#### `comment_created`

Fired when a comment is posted on a work item.

```typescript
{
  type: "comment_created";
  commentId: CommentId;
  workItemId: WorkItemId;
  authorName: string;
  contentPreview: string;  // first 100 chars
  timestamp: string;
}
```

#### `agent_started`

Fired when an agent execution begins.

```typescript
{
  type: "agent_started";
  executionId: ExecutionId;
  personaId: PersonaId;
  workItemId: WorkItemId;
  workItemTitle: string;
  timestamp: string;
}
```

#### `agent_completed`

Fired when an agent execution finishes.

```typescript
{
  type: "agent_completed";
  executionId: ExecutionId;
  personaId: PersonaId;
  workItemId: WorkItemId;
  outcome: "success" | "failure" | "rejected";
  durationMs: number;
  costUsd: number;
  timestamp: string;
}
```

#### `agent_output_chunk`

Streamed during agent execution — real-time output for the agent monitor.

```typescript
{
  type: "agent_output_chunk";
  executionId: ExecutionId;
  personaId: PersonaId;
  chunk: string;
  chunkType: "text" | "code" | "thinking" | "tool_call" | "tool_result";
  timestamp: string;
}
```

#### `proposal_created`

Fired when an agent creates a proposal.

```typescript
{
  type: "proposal_created";
  proposalId: ProposalId;
  executionId: ExecutionId;
  workItemId: WorkItemId;
  proposalType: "task_creation" | "state_transition" | "review_request";
  timestamp: string;
}
```

#### `proposal_updated`

Fired when a proposal status changes.

```typescript
{
  type: "proposal_updated";
  proposalId: ProposalId;
  status: "pending" | "approved" | "rejected" | "expired";
  timestamp: string;
}
```

#### `cost_update`

Fired when execution costs are tracked.

```typescript
{
  type: "cost_update";
  todayCostUsd: number;
  monthCostUsd: number;
  timestamp: string;
}
```

#### `execution_update`

Fired when an execution status changes.

```typescript
{
  type: "execution_update";
  executionId: ExecutionId;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  timestamp: string;
}
```

## Source Files

| File | Purpose |
|---|---|
| `packages/backend/src/routes/projects.ts` | Project CRUD routes |
| `packages/backend/src/routes/work-items.ts` | Work item CRUD + retry + recursive delete |
| `packages/backend/src/routes/work-item-edges.ts` | Dependency edge routes |
| `packages/backend/src/routes/personas.ts` | Persona CRUD routes |
| `packages/backend/src/routes/persona-assignments.ts` | Persona assignment upsert |
| `packages/backend/src/routes/comments.ts` | Comment CRUD routes |
| `packages/backend/src/routes/executions.ts` | Execution CRUD routes |
| `packages/backend/src/routes/proposals.ts` | Proposal CRUD routes |
| `packages/backend/src/routes/dashboard.ts` | Dashboard aggregate queries |
| `packages/backend/src/routes/settings.ts` | API key, concurrency, DB stats, export/import |
| `packages/backend/src/routes/audit.ts` | Audit log query |
| `packages/backend/src/ws.ts` | WebSocket registration and broadcast |
| `packages/shared/src/api.ts` | Request/response TypeScript types |
| `packages/shared/src/ws-events.ts` | WebSocket event type definitions |
