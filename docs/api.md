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
| `includeArchived` | `"true"` | Include archived items (default: excluded) |
| `deleted` | `"true"` | Show only soft-deleted items (for "Recently Deleted" view) |

By default, both archived and deleted items are excluded. Use `includeArchived=true` to include archived items alongside active ones. Use `deleted=true` to show *only* soft-deleted items (overrides archive filter).

**Response:** `{ data: WorkItem[], total: number }`

WorkItem objects include `archivedAt` and `deletedAt` fields (ISO 8601 string or `null`):

```typescript
{
  id: WorkItemId;
  projectId: ProjectId;
  parentId: WorkItemId | null;
  title: string;
  description: string;
  currentState: string;
  priority: string;
  labels: string[];
  assignedPersonaId: PersonaId | null;
  context: Record<string, unknown>;
  executionContext: unknown[];
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
  archivedAt: string | null;  // ISO 8601 — set when archived
  deletedAt: string | null;   // ISO 8601 — set when soft-deleted
}
```

```bash
# Active items only (default)
curl "http://localhost:3001/api/work-items?projectId=pj-xxxx"

# Include archived items
curl "http://localhost:3001/api/work-items?projectId=pj-xxxx&includeArchived=true"

# Recently deleted items only
curl "http://localhost:3001/api/work-items?projectId=pj-xxxx&deleted=true"
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

### Delete Work Item (Soft Delete)

```
DELETE /api/work-items/:id
```

Soft-deletes the work item by setting `deleted_at`. Recursively collects all descendants (BFS) and applies the same treatment. Related data (edges, comments, proposals, project memories) is hard-deleted for all affected items.

**409 guard:** If any execution with status `"running"` is associated with the item or its descendants, the request is rejected.

**Response:** 204 | 409

```bash
curl -X DELETE http://localhost:3001/api/work-items/wi-xxxx
```

**Error (409 — active execution):**

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Cannot delete work item with active executions",
    "activeExecutions": 1
  }
}
```

### Archive Work Item

```
POST /api/work-items/:id/archive
```

Sets `archived_at` on the work item. Archived items are excluded from the default list query but can be included with `?includeArchived=true`.

**Request body:**

```typescript
{
  cascade?: boolean;  // default: false — if true, archives all descendants too
}
```

**Response:** `{ data: { archivedCount: number } }` | 404

```bash
# Archive single item
curl -X POST http://localhost:3001/api/work-items/wi-xxxx/archive \
  -H "Content-Type: application/json" \
  -d '{}'

# Archive with all children
curl -X POST http://localhost:3001/api/work-items/wi-xxxx/archive \
  -H "Content-Type: application/json" \
  -d '{"cascade": true}'
```

### Unarchive Work Item

```
POST /api/work-items/:id/unarchive
```

Clears `archived_at`, restoring the item to the active list.

**Response:** `{ data: WorkItem }` | 404

```bash
curl -X POST http://localhost:3001/api/work-items/wi-xxxx/unarchive
```

### Restore Deleted Work Item

```
POST /api/work-items/:id/restore
```

Restores a soft-deleted work item by clearing `deleted_at`. Subject to a **30-day grace period** — items deleted more than 30 days ago cannot be restored.

**Response:** `{ data: WorkItem }` | 400 | 404 | 410

| Status | Code | When |
|--------|------|------|
| 200 | — | Successfully restored |
| 400 | `BAD_REQUEST` | Item is not deleted |
| 404 | `NOT_FOUND` | Item does not exist |
| 410 | `GONE` | Restore period expired (30 days) |

```bash
curl -X POST http://localhost:3001/api/work-items/wi-xxxx/restore
```

### Bulk Archive

```
POST /api/work-items/bulk/archive
```

Archives multiple work items in a single request.

**Request body:**

```typescript
{
  ids: string[];       // required — array of work item IDs
  cascade?: boolean;   // default: false — if true, archives descendants of each item
}
```

**Response:** `{ data: { archivedCount: number } }` | 400

IDs are deduplicated before processing. Returns 400 if `ids` is empty.

```bash
curl -X POST http://localhost:3001/api/work-items/bulk/archive \
  -H "Content-Type: application/json" \
  -d '{"ids": ["wi-aaa", "wi-bbb"], "cascade": true}'
```

### Bulk Unarchive

```
POST /api/work-items/bulk/unarchive
```

Unarchives multiple work items in a single request.

**Request body:**

```typescript
{
  ids: string[];  // required — array of work item IDs
}
```

**Response:** `{ data: { unarchivedCount: number } }` | 400

```bash
curl -X POST http://localhost:3001/api/work-items/bulk/unarchive \
  -H "Content-Type: application/json" \
  -d '{"ids": ["wi-aaa", "wi-bbb"]}'
```

### Bulk Delete (Soft Delete)

```
DELETE /api/work-items/bulk
```

Soft-deletes multiple work items. Same cascade and 409 guard behavior as single delete.

**Request body:**

```typescript
{
  ids: string[];       // required — array of work item IDs
  cascade?: boolean;   // default: false — if true, includes descendants
}
```

**Response:** 204 | 400 | 409

Returns 400 if `ids` is empty. Returns 409 if any associated execution is running.

```bash
curl -X DELETE http://localhost:3001/api/work-items/bulk \
  -H "Content-Type: application/json" \
  -d '{"ids": ["wi-aaa", "wi-bbb"]}'
```

---

## Schema Additions: `archived_at` / `deleted_at`

The `work_items` table has two nullable timestamp columns supporting the lifecycle:

```sql
archived_at  INTEGER  -- timestamp_ms, NULL = not archived
deleted_at   INTEGER  -- timestamp_ms, NULL = not deleted
```

- **`archived_at`**: Set by archive endpoints. Items with non-null `archived_at` are hidden from default queries but remain in the database. Clearing this field (unarchive) restores visibility.
- **`deleted_at`**: Set by delete endpoints (soft delete). Items with non-null `deleted_at` are only visible via `?deleted=true`. Related data (edges, comments, proposals, memories) is hard-deleted at deletion time. The item itself can be restored within 30 days via the restore endpoint; after 30 days, the restore endpoint returns 410 GONE.

**Cascade rules:**
- Archive with `cascade: true`: BFS collects all descendants, sets `archived_at` on all.
- Delete (single or bulk): BFS collects all descendants. Hard-deletes edges, comments, proposals, and memories for all items. Soft-deletes (sets `deleted_at`) on all work items.
- 409 guard applies to delete only — blocks if any execution is running for the items or their descendants.

---

## Global Agents Data Model

Global Agents allow personas to operate across all projects or without any project context. This section documents the data model changes that support this capability.

### `AgentScope` Type

Defined in `packages/shared/src/entities.ts`:

```typescript
type AgentScope =
  | { type: "project"; projectId: ProjectId; path: string }
  | { type: "global"; workspacePath: string };
```

Used by the frontend to determine whether a session or execution is project-scoped or global. The sidebar "All Projects" selector sets scope to `{ type: "global" }`.

### Nullable `projectId` on Executions and Chat Sessions

Both `executions` and `chat_sessions` tables have nullable `project_id` columns:

```sql
-- executions table
project_id  TEXT  REFERENCES projects(id)  -- NULL for standalone/global executions
work_item_id TEXT REFERENCES work_items(id) -- NULL for standalone/global executions

-- chat_sessions table
project_id  TEXT  REFERENCES projects(id)  -- NULL for global sessions
```

- **Executions**: When created via `POST /api/executions/run`, both `workItemId` and `projectId` may be null (global execution). When created via `POST /api/executions` (work-item-driven), `workItemId` is required.
- **Chat sessions**: When created via `POST /api/chat/sessions` with no `projectId`, the session is global — Pico operates without project context.

### `global_memories` Table

Cross-project memory for personas operating in global scope:

```sql
CREATE TABLE global_memories (
  id                TEXT PRIMARY KEY,       -- GlobalMemoryId
  persona_id        TEXT NOT NULL REFERENCES personas(id),
  summary           TEXT NOT NULL DEFAULT '',
  key_decisions     TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings
  created_at        INTEGER NOT NULL,       -- timestamp_ms
  consolidated_into TEXT                    -- self-referencing FK (GlobalMemoryId | null)
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | `text` | Primary key (GlobalMemoryId) |
| `persona_id` | `text` | Persona that generated this memory |
| `summary` | `text` | Free-text summary of cross-project observations |
| `key_decisions` | `json (string[])` | List of notable decisions or patterns |
| `created_at` | `integer` | Creation timestamp (ms since epoch) |
| `consolidated_into` | `text \| null` | Points to a newer consolidated memory, or null if current |

### Scope-Awareness Rules

**Dashboard:**
- Project scope: shows stats for a single project (work items, executions, costs filtered by `projectId`).
- Global scope ("All Projects"): shows aggregated stats across all projects. Displays a "Projects Overview" table listing each project.

**Agent Monitor:**
- Project scope: shows executions filtered to the selected project's work items.
- Global scope: shows all executions across all projects. Scope badges indicate origin.
- "New Run" button opens a dialog with Persona, Scope (project or global), Prompt, and Budget fields.

**Work Items:**
- Disabled in global scope (`aria-disabled` on the sidebar link). Work items always belong to a single project.

**Pico Chat:**
- Follows sidebar scope by default. A scope dropdown allows switching.
- Global sessions have no project context — Pico operates across all projects.

**Activity Feed:**
- Global scope: aggregates events from all projects.

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
| `projectId` | `string` | Filter by project (returns executions whose work item belongs to this project) |

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

### Run Standalone Execution

```
POST /api/executions/run
```

Creates a standalone execution not tied to any work item. Used for ad-hoc agent runs from the Agent Monitor "New Run" dialog or global-scope operations.

**Request body:**

```typescript
{
  personaId: string;    // required — persona to execute with
  prompt: string;       // required — instruction for the agent
  projectId?: string;   // optional — scope to a project (null for global)
  budgetUsd?: number;   // optional — max budget in USD
}
```

**Validation:**
- `personaId` and `prompt` are both required — 400 if missing
- `personaId` must reference an existing persona — 404 if not found
- `projectId` (if provided) must reference an existing project — 404 if not found

**Response:** 201 `{ id: ExecutionId }`

The created execution has `workItemId: null`, `status: "pending"`, and `summary` set to the prompt text.

```bash
# Global standalone execution
curl -X POST http://localhost:3001/api/executions/run \
  -H "Content-Type: application/json" \
  -d '{"personaId": "ps-pico", "prompt": "Analyze cross-project patterns"}'

# Project-scoped standalone execution
curl -X POST http://localhost:3001/api/executions/run \
  -H "Content-Type: application/json" \
  -d '{"personaId": "ps-xxxx", "prompt": "Run security audit", "projectId": "pj-xxxx", "budgetUsd": 5.00}'
```

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

#### `notification`

Fired when a notification-worthy event occurs. Delivered to the frontend notification store and toast system.

```typescript
{
  type: "notification";
  notification: Notification;
  timestamp: string;
}
```

**Notification object:**

```typescript
{
  id: string;                        // unique ID (ntf-<hex>)
  type: NotificationEventType;       // event classification
  priority: NotificationPriority;    // determines toast behavior
  title: string;                     // short display title
  description?: string;              // optional detail (1-2 lines)
  projectId?: ProjectId;             // scoping
  workItemId?: WorkItemId;           // context link
  executionId?: ExecutionId;         // context link
  read: boolean;                     // always false on emission
  createdAt: string;                 // ISO 8601
}
```

**`NotificationEventType`:**

| Type | Priority | Trigger |
|------|----------|---------|
| `proposal_needs_approval` | critical | Proposal created with type `review_request` |
| `agent_errored` | critical | Execution failed with error |
| `budget_threshold` | high | Monthly spend >= 80% of cap |
| `execution_stuck` | high | Agent inactive for 10+ minutes |
| `agent_completed` | low | Execution completed successfully |

**`NotificationPriority`:** `"critical" | "high" | "low" | "info"`

- **Critical**: toast does NOT auto-dismiss, requires manual close
- **High/Low/Info**: toast auto-dismisses after 5 seconds

**Backend emission points:**

| File | Event | Priority |
|------|-------|----------|
| `execution-manager.ts` | Agent completed | low |
| `execution-manager.ts` | Agent errored | critical |
| `execution-manager.ts` | Budget >= 80% | high |
| `proposals.ts` | Review request created | critical |

**Frontend handling:**

The `use-toast-events.ts` hook listens for `notification` WebSocket events and dispatches to both:
1. **Notification store** (`addNotification`) — persistent, displayed in drawer
2. **Toast store** (`addToast`) — transient popup with action buttons

---

## Notification Preferences

Stored in frontend localStorage under `woof-notifications` via Zustand persist.

```typescript
interface NotificationPreferences {
  enabledEvents: Record<NotificationEventType, boolean>;  // per-type in-app toggle
  soundEvents: Record<NotificationEventType, boolean>;    // per-type sound toggle
  quietHours: {
    enabled: boolean;
    from: string;   // "HH:MM" (e.g., "22:00")
    to: string;     // "HH:MM" (e.g., "08:00")
  };
  scope: "all" | "current-project";
}
```

**Defaults:** All in-app events enabled. Sound enabled only for `proposal_needs_approval` and `agent_errored`. Quiet hours disabled. Scope: all projects.

**Quiet hours behavior:** Non-critical notifications suppressed during the time window. Critical notifications (`proposal_needs_approval`, `agent_errored`) always come through.

**Batching:** Multiple `agent_completed` notifications within a 60-second window are batched into a single "N agents completed" summary notification.

## Chat (Multi-Persona)

Chat sessions support any persona, not just Pico. Each session is linked to a persona via `personaId`.

### Create Chat Session

```
POST /api/chat/sessions
```

**Body:**

```typescript
{
  projectId?: string;    // optional — null for global sessions
  personaId?: string;    // optional — persona for this session (null defaults to Pico)
  workItemId?: string;   // optional — link session to a work item for context
}
```

Body may be empty (`{}`) or omitted entirely to create a global session with the default Pico persona. Validates `projectId` and `personaId` if provided — 404 if not found.

**Response:** 201 `{ data: ChatSession }`

```typescript
{
  id: ChatSessionId;
  projectId: ProjectId | null;
  personaId: PersonaId | null;   // null = default Pico
  workItemId: WorkItemId | null; // null = no work item context
  sdkSessionId: string | null;   // reserved for future SDK session tracking
  title: string;
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}
```

### List Chat Sessions

```
GET /api/chat/sessions
```

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `projectId` | `string` | Filter by project. Omit to list all sessions (global + project-scoped). |

**Response:** `{ data: ChatSessionWithPersona[], total: number }`

Each session includes joined persona data and last message preview:

```typescript
{
  ...ChatSession,
  persona: { name: string; avatar: { color: string; icon: string } | null } | null;
  lastMessagePreview: string | null;  // first 60 chars of most recent message
}
```

### Get Chat Messages

```
GET /api/chat/sessions/:id/messages
```

**Response:**

```typescript
{
  data: ChatMessage[];
  total: number;
  session: {
    ...ChatSession;
    persona: { name: string; avatar: { color: string; icon: string } | null } | null;
  };
}
```

The `session` object includes persona info for the chat header display.

### Send Chat Message (SSE)

```
POST /api/chat/sessions/:id/messages
```

**Body:** `{ content: string; personaId?: string }`

The persona is loaded from the session's `personaId`. If the persona is not Pico (`settings.isAssistant !== true`), the Pico-specific skill file and personality instructions are not injected — the persona's own `systemPrompt` is used with generic chat instructions.

**Response:** Server-Sent Events stream with event types: `text`, `thinking`, `tool_use`, `tool_result`, `suggestion`, `error`, `done`.

### Update Session Title

```
PATCH /api/chat/sessions/:id
```

**Body:** `{ title: string }`

### Delete Chat Session

```
DELETE /api/chat/sessions/:id
```

---

## Persona Prompt Template Variables

Persona system prompts support `{{variable.name}}` template variables that are resolved at prompt-build time. Undefined variables are left as literal text.

### Built-in Variables

| Variable | Available in | Description |
|----------|-------------|-------------|
| `{{project.name}}` | Executor + Chat | Project display name |
| `{{project.path}}` | Executor + Chat | Project working directory |
| `{{project.description}}` | Executor + Chat | Project description from settings |
| `{{persona.name}}` | Executor + Chat | Current persona name |
| `{{persona.description}}` | Executor + Chat | Persona description |
| `{{persona.model}}` | Executor + Chat | Model (opus/sonnet/haiku) |
| `{{date.now}}` | Executor + Chat | Current ISO 8601 timestamp |
| `{{date.today}}` | Executor + Chat | Today's date (YYYY-MM-DD) |
| `{{date.dayOfWeek}}` | Executor + Chat | Day name (e.g., Monday) |
| `{{workItem.id}}` | Executor only | Work item ID |
| `{{workItem.title}}` | Executor only | Work item title |
| `{{workItem.state}}` | Executor only | Current workflow state |
| `{{workItem.description}}` | Executor only | Work item description |

### Resolution

Variables are resolved via `resolveVariables()` in `packages/backend/src/agent/prompt-variables.ts`. The regex `{{variable.name}}` matches Mustache-style placeholders with optional whitespace. Escaped `\{{` is not matched.

Resolution happens in two paths:
- **Executor path** (`buildSystemPrompt()` in `claude-executor.ts`): all 13 variables available
- **Chat path** (`chat.ts`): project + persona + date variables only (no workItem in chat context)

## SDK Capabilities

### Get Capabilities

```
GET /api/sdk/capabilities
```

**Response:** `{ data: { commands, agents, models, cachedAt } }`

Returns available SDK commands (skills), agents, and models. Cached after first call.

### Reload Plugins

```
POST /api/sdk/reload
```

Refreshes SDK plugins and returns updated capabilities.

## Runtime Execution Control

### MCP Server Status

```
GET /api/executions/:id/mcp/status
```

Returns MCP server status for a running execution. 404 if not running.

### Toggle MCP Server

```
POST /api/executions/:id/mcp/toggle
```

**Body:** `{ serverName: string, enabled: boolean }`

### Reconnect MCP Server

```
POST /api/executions/:id/mcp/reconnect
```

**Body:** `{ serverName: string }`

### Get Available Models

```
GET /api/executions/:id/models
```

Returns available models for a running execution. 404 if not running.

### Switch Model

```
POST /api/executions/:id/model
```

**Body:** `{ model: string }`

Switches the model mid-execution. Returns 404 if not running.

## Source Files

| File | Purpose |
|---|---|
| `packages/backend/src/routes/projects.ts` | Project CRUD routes |
| `packages/backend/src/routes/work-items.ts` | Work item CRUD + retry + archive/unarchive/restore + bulk ops + soft delete |
| `packages/backend/src/routes/work-item-edges.ts` | Dependency edge routes |
| `packages/backend/src/routes/personas.ts` | Persona CRUD routes |
| `packages/backend/src/routes/persona-assignments.ts` | Persona assignment upsert |
| `packages/backend/src/routes/comments.ts` | Comment CRUD routes |
| `packages/backend/src/routes/executions.ts` | Execution CRUD + standalone run + rewind |
| `packages/backend/src/routes/proposals.ts` | Proposal CRUD routes |
| `packages/backend/src/routes/dashboard.ts` | Dashboard aggregate queries |
| `packages/backend/src/routes/settings.ts` | API key, concurrency, DB stats, export/import |
| `packages/backend/src/routes/audit.ts` | Audit log query |
| `packages/backend/src/ws.ts` | WebSocket registration and broadcast |
| `packages/backend/src/routes/chat.ts` | Pico chat sessions + SSE messaging |
| `packages/shared/src/api.ts` | Request/response TypeScript types |
| `packages/shared/src/entities.ts` | Entity types including AgentScope |
| `packages/shared/src/ws-events.ts` | WebSocket event type definitions |
