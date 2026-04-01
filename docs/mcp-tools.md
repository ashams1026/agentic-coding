# MCP Tools

AgentOps provides an MCP (Model Context Protocol) server that gives AI agent personas tools to interact with the system — posting comments, creating child work items, transitioning states, querying data, and flagging issues.

## Overview

The MCP server is defined in `packages/backend/src/agent/mcp-server.ts` and registers 8 tools:

| Tool | Description |
|---|---|
| `post_comment` | Post a comment on a work item |
| `create_children` | Create child work items under a parent |
| `route_to_state` | Transition a work item to a new workflow state |
| `list_items` | Query work items with filters |
| `get_context` | Retrieve execution history and project memories |
| `flag_blocked` | Mark a work item as Blocked |
| `request_review` | Request human attention on a work item |
| `rewind_execution` | Revert file changes from a specific execution |

## How the MCP Server Attaches to Agent Sessions

When a persona is dispatched via `ClaudeExecutor.spawn()`, the MCP server is launched as a child process and connected to the Claude Agent SDK session:

```typescript
mcpServers: {
  agentops: {
    command: "node",
    args: ["--import", "tsx", "mcp-server.ts"],
    env: {
      PERSONA_NAME: persona.name,
      PERSONA_ID: persona.id,
      PROJECT_ID: project.id,
      ALLOWED_TOOLS: options.tools.join(","),
    },
  },
}
```

**Environment variables** passed to the MCP server process:

| Variable | Purpose |
|---|---|
| `PERSONA_NAME` | Used as the comment author name |
| `PERSONA_ID` | Identifies the persona in DB records |
| `PROJECT_ID` | Scopes `list_items` queries to the project |
| `ALLOWED_TOOLS` | Comma-separated tool names this persona can use (empty = all) |

The MCP server runs as a standalone process using **stdio transport** (`StdioServerTransport`). It connects directly to the database and broadcasts WebSocket events for real-time UI updates.

### McpContext

```typescript
interface McpContext {
  personaName: string;    // comment author
  personaId: string;      // persona ID for DB records
  projectId: string;      // scopes queries
  allowedTools: string[]; // tool access control (empty = all)
}
```

## Tool Reference

### `post_comment`

Post a comment to a work item's comment stream. Used to communicate progress, decisions, or questions.

**Input schema (Zod):**

```typescript
z.object({
  workItemId: z.string(),   // The work item ID to comment on
  content: z.string(),      // Comment text content
  metadata: z.record(z.string(), z.unknown()).optional(),  // Optional metadata
})
```

**Output:**

```json
{ "id": "cm-xxxx", "workItemId": "wi-xxxx", "authorName": "Engineer", "createdAt": "..." }
```

**Side effects:**
- Inserts a comment record with `authorType: "agent"`
- Broadcasts `comment_created` WebSocket event

**Persona access:** Product Manager, Tech Lead, Engineer, Code Reviewer

**Example usage:**
```
Agent calls post_comment with:
  workItemId: "wi-auth001"
  content: "Acceptance criteria defined:\n- Google OAuth login works\n- Session persists across reloads"
```

---

### `create_children`

Create child work items under a parent. Used to decompose a work item into smaller tasks.

**Input schema (Zod):**

```typescript
z.object({
  parentId: z.string(),    // Parent work item ID
  children: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      dependsOn: z.array(z.string()).optional(),
        // IDs of siblings this child depends on
        // Can be index references ("0", "1") for siblings in this batch
        // or existing work item IDs
    })
  ),
})
```

**Output:**

```json
{ "createdIds": ["wi-aaa", "wi-bbb", "wi-ccc"], "parentId": "wi-xxxx" }
```

**Side effects:**
- Creates child work items in `Backlog` state (the initial workflow state)
- Creates `depends_on` edges in `work_item_edges` for `dependsOn` references
- Broadcasts `state_change` event for each new child
- Looks up parent's `projectId` to assign to children

**Persona access:** Tech Lead

**Example usage:**
```
Agent calls create_children with:
  parentId: "wi-auth001"
  children: [
    { title: "Set up OAuth providers", description: "Configure Google and GitHub OAuth apps" },
    { title: "Implement login flow", description: "Add login page and callback handlers", dependsOn: ["0"] },
    { title: "Add session persistence", description: "Store sessions in database", dependsOn: ["1"] }
  ]
```

The `dependsOn: ["0"]` means the second child depends on the first child (index 0 in the batch).

---

### `route_to_state`

Route a work item to a new workflow state. The target state must be a valid transition from the current state.

**Input schema (Zod):**

```typescript
z.object({
  workItemId: z.string(),    // The work item ID to transition
  targetState: z.string(),   // Target state (must be valid transition)
  reasoning: z.string(),     // Why this transition was chosen
})
```

**Output:**

```json
{ "workItemId": "wi-xxxx", "fromState": "In Progress", "toState": "In Review" }
```

**Side effects:**
- Validates the transition via `isValidTransition()`
- Detects rejections ("In Review" to "In Progress") and calls `handleRejection()` — may escalate to "Blocked" after 3 rejections
- Updates the work item's `currentState`
- Posts reasoning as a system comment (author: "Router")
- Broadcasts `state_change` WebSocket event
- Logs audit trail entry via `auditStateTransition()`
- Triggers `checkParentCoordination()` (non-blocking) — auto-advances parent when all children are Done
- Triggers `checkMemoryGeneration()` (non-blocking) — generates project memory on completion

**Error cases:**
- Work item not found → error response
- Invalid transition → error response with message `"Invalid transition from X to Y"`

**Persona access:** Router

**Example usage:**
```
Agent calls route_to_state with:
  workItemId: "wi-auth001"
  targetState: "In Review"
  reasoning: "Implementation is complete. All acceptance criteria addressed. Build passes."
```

---

### `list_items`

Query work items with optional filters. Scoped to the current project.

**Input schema (Zod):**

```typescript
z.object({
  parentId: z.string().optional(),     // Filter by parent work item ID
  state: z.string().optional(),        // Filter by workflow state name
  verbosity: z.enum(["summary", "detail"]).default("summary"),
    // summary: id + title + state only
    // detail: includes description, context, priority, labels, parentId
})
```

**Output (summary):**

```json
{ "items": [{ "id": "wi-xxxx", "title": "...", "state": "In Progress" }], "total": 3 }
```

**Output (detail):**

```json
{
  "items": [{
    "id": "wi-xxxx", "title": "...", "state": "In Progress",
    "description": "...", "context": {}, "priority": "p1",
    "labels": ["auth"], "parentId": "wi-yyyy"
  }],
  "total": 1
}
```

**Side effects:** None (read-only).

**Persona access:** Router

**Example usage:**
```
Agent calls list_items with:
  parentId: "wi-auth001"
  verbosity: "summary"
// Returns all children of wi-auth001 with their states
```

---

### `get_context`

Retrieve execution history and optional project memories for a work item. Used to understand what has been done before.

**Input schema (Zod):**

```typescript
z.object({
  workItemId: z.string(),           // The work item ID
  includeMemory: z.boolean().default(false),  // Include project-level memories
})
```

**Output:**

```json
{
  "workItem": {
    "id": "wi-xxxx", "title": "...", "description": "...",
    "currentState": "In Review", "executionContext": [...],
    "context": {}, "parentId": null, "projectId": "pj-xxxx"
  },
  "executionContext": [
    { "executionId": "ex-xxxx", "summary": "...", "outcome": "success", "rejectionPayload": null }
  ],
  "memories": [...]  // only if includeMemory: true
}
```

**Side effects:** None (read-only). When `includeMemory` is true, calls `getRecentMemories()` with a 1000-token budget.

**Persona access:** Router

**Example usage:**
```
Agent calls get_context with:
  workItemId: "wi-auth001"
  includeMemory: true
// Returns full work item context, execution history, and project memories
```

---

### `flag_blocked`

Mark a work item as Blocked with a reason. Posts a system comment explaining the blocker.

**Input schema (Zod):**

```typescript
z.object({
  workItemId: z.string(),   // The work item ID to block
  reason: z.string(),       // Why this work item is blocked
})
```

**Output:**

```json
{ "workItemId": "wi-xxxx", "fromState": "In Progress", "toState": "Blocked" }
```

**Side effects:**
- Updates the work item's state to "Blocked"
- Posts a system comment: `"Blocked: {reason}"`
- Broadcasts `state_change` WebSocket event
- Logs audit trail entry
- Triggers `checkParentCoordination()` — posts a notification comment on the parent

**Persona access:** Engineer

**Example usage:**
```
Agent calls flag_blocked with:
  workItemId: "wi-auth002"
  reason: "Missing Google OAuth client ID. Need credentials from the user before proceeding."
```

---

### `request_review`

Request human attention on a work item. Posts a system comment flagging it for review.

**Input schema (Zod):**

```typescript
z.object({
  workItemId: z.string(),    // The work item ID
  message: z.string(),       // What the human should review or decide
})
```

**Output:**

```json
{ "workItemId": "wi-xxxx", "commentId": "cm-xxxx", "message": "Review requested" }
```

**Side effects:**
- Posts a system comment: `"Review requested: {message}"`
- Broadcasts `comment_created` WebSocket event

**Persona access:** Tech Lead, Code Reviewer

**Example usage:**
```
Agent calls request_review with:
  workItemId: "wi-auth001"
  message: "Architecture decision needed: should we use passport.js or implement OAuth directly?"
```

---

### `rewind_execution`

Reverts all file changes from a specific execution back to their pre-execution state. Calls the rewind API endpoint internally (`POST /api/executions/:id/rewind`).

**Used by:** Code Reviewer (after rejecting a review to give the Engineer a clean slate)

**Input:**

| Field | Type | Description |
|---|---|---|
| `executionId` | `string` | The execution ID whose file changes should be reverted |
| `dryRun` | `boolean` | If true, returns preview without actually reverting (default: false) |

**Output:** `{ canRewind, filesChanged, insertions, deletions, dryRun }` on success; `{ error }` on failure.

**When to use:** Only when an implementation is fundamentally wrong and the Engineer should start fresh. Do NOT rewind for minor issues — let the Engineer iterate on the existing code.

**Example flow:**

```
1. Reviewer calls get_context(workItemId) → gets executionId from execution history
2. Reviewer calls rewind_execution(executionId, dryRun: true) → sees 5 files would revert
3. Reviewer calls rewind_execution(executionId, dryRun: false) → files reverted
4. Reviewer posts rejection comment with feedback
5. Router sends item back to In Progress
```

## Tool Access by Persona

| Tool | Product Manager | Tech Lead | Engineer | Code Reviewer | Router |
|---|---|---|---|---|---|
| `post_comment` | yes | yes | yes | yes | |
| `create_children` | | yes | | | |
| `route_to_state` | | | | | yes |
| `list_items` | | | | | yes |
| `get_context` | | | | | yes |
| `flag_blocked` | | | yes | | |
| `request_review` | | yes | | yes | |
| `rewind_execution` | | | | yes | |

Note: The actual tool names registered in the MCP server are the 8 listed in `TOOL_NAMES`. Access is controlled by the `ALLOWED_TOOLS` environment variable passed to the MCP server process.

## Dynamic MCP Management

During a running execution, MCP servers can be managed at runtime via API endpoints. This is useful when an MCP server crashes during a long agent run — the user can reconnect without restarting the entire execution.

### API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/executions/:id/mcp/status` | GET | Get status of all MCP servers for a running execution |
| `/api/executions/:id/mcp/toggle` | POST | Enable or disable an MCP server by name |
| `/api/executions/:id/mcp/reconnect` | POST | Reconnect a failed MCP server |

All endpoints return 404 if the execution is not currently running (query object no longer active).

### Status Response

```json
[
  {
    "name": "agentops",
    "status": "connected",
    "tools": [{ "name": "post_comment" }, { "name": "route_to_state" }]
  }
]
```

**Status values:** `connected` (green), `failed` (red), `needs-auth` (amber), `pending` (amber), `disabled` (gray).

### Agent Monitor UI

During running executions, the terminal renderer toolbar shows colored dots for each MCP server:
- **Green dot** — connected and operational
- **Red dot** — failed (click to reconnect)
- **Amber dot** — pending connection or needs authentication
- **Gray dot** — disabled

Hover over a dot to see: server name, status, error message (if failed), tool count. Click a failed server's dot to trigger reconnection.

Status is polled every 30 seconds via `GET /api/executions/:id/mcp/status`.

### Recovering from MCP Failures

1. Agent monitor shows a red dot for the failed MCP server
2. User clicks the red dot → triggers `POST /api/executions/:id/mcp/reconnect`
3. The SDK reconnects the MCP server subprocess
4. Dot turns green when connection is re-established
5. The agent can resume using MCP tools

Alternatively, use `POST /api/executions/:id/mcp/toggle` to disable a problematic server entirely (the agent continues without those tools).

### Implementation

Runtime MCP management uses the SDK's control methods on the active query object:
- `query.mcpServerStatus()` — returns array of `McpServerStatus`
- `query.toggleMcpServer(serverName, enabled)` — enable/disable a server
- `query.reconnectMcpServer(serverName)` — reconnect a failed server

Active query references are stored in a module-level `runningQueries` Map in `claude-executor.ts`, keyed by execution ID. The map is cleaned up when executions complete.

## Source Files

| File | Purpose |
|---|---|
| `packages/backend/src/agent/mcp-server.ts` | MCP server factory with 8 tool registrations + in-process server |
| `packages/backend/src/agent/claude-executor.ts` | Attaches MCP server to agent sessions via `mcpServers` config |
| `packages/backend/src/agent/coordination.ts` | `checkParentCoordination()` called by `route_to_state` and `flag_blocked` |
| `packages/backend/src/agent/memory.ts` | `getRecentMemories()` called by `get_context`, `checkMemoryGeneration()` called by `route_to_state` |
| `packages/backend/src/agent/execution-manager.ts` | `handleRejection()` called by `route_to_state` for rejection detection |
| `packages/backend/src/db/seed.ts` | Built-in persona MCP tool assignments |
