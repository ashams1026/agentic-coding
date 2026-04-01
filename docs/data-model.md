# Data Model

AgentOps stores all data in SQLite (11 tables, WAL mode). Types are defined in `packages/shared/src/entities.ts` and the Drizzle schema lives in `packages/backend/src/db/schema.ts`.

## Entity Relationship Diagram

```
┌──────────┐       ┌───────────┐       ┌──────────────────┐
│ Project  │──1:N──│ WorkItem  │──1:N──│    Execution     │
│          │       │           │       │                  │
│ id (pj-) │       │ id (wi-)  │       │ id (ex-)         │
│ name     │       │ parentId ─┐       │ workItemId       │
│ path     │       │ projectId │       │ personaId        │
│ settings │       │ title     │       │ status           │
│ createdAt│       │ desc      │       │ costUsd          │
└──────────┘       │ context   │       │ outcome          │
     │             │ state     │       │ rejectionPayload │
     │             │ priority  │       └──────────────────┘
     │             │ labels    │              │
     │             │ personaId │              │ 1:N
     │             │ execCtx[] │              ▼
     │             │ createdAt │       ┌──────────────────┐
     │             │ updatedAt │       │    Proposal      │
     │             └───────────┘       │                  │
     │                │ │ │            │ id (pr-)         │
     │                │ │ │            │ executionId      │
     │          ┌─────┘ │ └─────┐     │ workItemId       │
     │          │       │       │     │ type             │
     │          ▼       ▼       ▼     │ status           │
     │     ┌────────┐ ┌─────┐ ┌───────────────┐         │
     │     │Comment │ │Edge │ │ProjectMemory  │         │
     │     │        │ │     │ │               │         │
     │     │id (cm-)│ │id   │ │ id (pm-)      │         │
     │     │authorTy│ │from │ │ projectId     │         │
     │     │content │ │to   │ │ workItemId    │         │
     │     └────────┘ │type │ │ summary       │         │
     │                └─────┘ │ filesChanged  │         │
     │                        │ keyDecisions  │         │
     │                        └───────────────┘         │
     │                                                   │
     │  1:N    ┌───────────────────┐                     │
     ├────────│ PersonaAssignment │                     │
     │        │                   │                     │
     │        │ projectId (PK)   │                     │
     │        │ stateName (PK)   │                     │
     │        │ personaId        │                     │
     │        └───────────────────┘                     │
     │                 │                                 │
     │                 │ N:1                              │
     │                 ▼                                 │
     │         ┌──────────────┐                          │
     └────────│   Persona    │◄─────────────────────────┘
              │              │         (via Execution)
              │ id (ps-)     │
              │ name         │
              │ systemPrompt │
              │ model        │
              │ allowedTools │
              │ mcpTools     │
              │ maxBudget    │
              └──────────────┘
```

## Entities

### Project

The top-level container. Each project maps to a directory on disk.

| Field | Type | Description |
|---|---|---|
| `id` | `ProjectId` (`pj-xxxx`) | Unique identifier |
| `name` | `string` | Display name |
| `path` | `string` | Absolute path to project directory (validated on create) |
| `settings` | `ProjectSettings` | Typed settings: `maxConcurrent`, `monthCap`, `autoRouting`, `description`, `patterns`, `sandbox` (see `SandboxConfig`) |
| `createdAt` | `string` (ISO 8601) | Creation timestamp |

**Relationships:** has many WorkItems, PersonaAssignments, ProjectMemories.

### WorkItem

The core entity. Represents any unit of work — from high-level features to individual tasks. Supports recursive parent-child hierarchy.

| Field | Type | Description |
|---|---|---|
| `id` | `WorkItemId` (`wi-xxxx`) | Unique identifier |
| `parentId` | `WorkItemId \| null` | Parent work item (null = top-level) |
| `projectId` | `ProjectId` | Owning project |
| `title` | `string` | Short title |
| `description` | `string` | Detailed description (markdown) |
| `context` | `Record<string, unknown>` | Arbitrary context data |
| `currentState` | `string` | Current workflow state (e.g., "Planning", "In Progress") |
| `priority` | `Priority` | `"p0"` (critical) through `"p3"` (low) |
| `labels` | `string[]` | Free-form tags |
| `assignedPersonaId` | `PersonaId \| null` | Currently assigned persona |
| `executionContext` | `ExecutionContextEntry[]` | History of agent executions on this item |
| `createdAt` | `string` (ISO 8601) | Creation timestamp |
| `updatedAt` | `string` (ISO 8601) | Last modification timestamp |

**Relationships:** belongs to Project, has optional parent WorkItem, has many children WorkItems, has many Executions, Comments, Proposals, ProjectMemories, and WorkItemEdges (both directions).

#### WorkItem Hierarchy

Work items form a tree:

```
Top-level WorkItem (parentId: null)
  ├── Child WorkItem (parentId: top-level ID)
  │     ├── Grandchild WorkItem
  │     └── Grandchild WorkItem
  └── Child WorkItem
        └── Grandchild WorkItem
```

- Top-level items represent features or epics
- Children represent decomposed tasks
- Grandchildren represent subtasks
- When **all children** of a parent reach "Done", the parent auto-advances to "In Review"
- If a child becomes "Blocked", a system comment is posted on the parent

#### Execution Context

The `executionContext` array accumulates a history of agent runs on this work item:

```typescript
interface ExecutionContextEntry {
  executionId: ExecutionId;   // Links to the full Execution record
  summary: string;            // Agent's summary of what it did
  outcome: ExecutionOutcome;  // "success" | "failure" | "rejected"
  rejectionPayload: RejectionPayload | null;
}
```

This gives each subsequent agent execution visibility into what previous agents did, enabling iterative refinement. The system prompt includes this history when dispatching a new agent.

### WorkItemEdge

Directed edges forming a dependency graph between work items.

| Field | Type | Description |
|---|---|---|
| `id` | `WorkItemEdgeId` | Unique identifier |
| `fromId` | `WorkItemId` | Source work item |
| `toId` | `WorkItemId` | Target work item |
| `type` | `WorkItemEdgeType` | `"blocks"`, `"depends_on"`, or `"related_to"` |

**Edge types:**
- `blocks` — fromId blocks toId (toId cannot proceed until fromId is Done)
- `depends_on` — fromId depends on toId
- `related_to` — informational link, no enforcement

### PersonaAssignment

Maps a persona to a workflow state within a project. Composite primary key.

| Field | Type | Description |
|---|---|---|
| `projectId` | `ProjectId` | Project this assignment belongs to |
| `stateName` | `string` | Workflow state name (e.g., "Planning", "In Progress") |
| `personaId` | `PersonaId` | Persona to dispatch when items enter this state |

**Primary key:** `(projectId, stateName)` — one persona per state per project.

### Persona

An AI agent configuration. Defines the system prompt, model, and available tools.

| Field | Type | Description |
|---|---|---|
| `id` | `PersonaId` (`ps-xxxx`) | Unique identifier |
| `name` | `string` | Display name (e.g., "Engineer", "Router") |
| `description` | `string` | What this persona does |
| `avatar` | `{ color: string, icon: string }` | UI display: hex color + icon name |
| `systemPrompt` | `string` | Base system prompt for this persona |
| `model` | `PersonaModel` | `"opus"`, `"sonnet"`, or `"haiku"` |
| `allowedTools` | `string[]` | SDK built-in tool names (e.g., "Read", "Bash") |
| `mcpTools` | `string[]` | AgentOps MCP tool names (e.g., "post_comment") |
| `skills` | `string[]` | SDK skill names (e.g., "commit", "review-pr") |
| `subagents` | `string[]` | Preferred subagent persona IDs |
| `maxBudgetPerRun` | `number` | Max cost per execution (0 = unlimited) |
| `settings` | `PersonaSettings` | `isSystem?`, `isAssistant?`, `isRouter?`, `effort?`, `thinking?`, `thinkingBudgetTokens?` |

**Relationships:** has many Executions, has many PersonaAssignments.

### Execution

A single agent run — one persona executing against one work item.

| Field | Type | Description |
|---|---|---|
| `id` | `ExecutionId` (`ex-xxxx`) | Unique identifier |
| `workItemId` | `WorkItemId` | Work item being executed on |
| `personaId` | `PersonaId` | Persona that ran |
| `status` | `ExecutionStatus` | `"pending"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` |
| `startedAt` | `string` (ISO 8601) | When execution started |
| `completedAt` | `string \| null` | When execution ended (null if still running) |
| `costUsd` | `number` | API cost in USD |
| `durationMs` | `number` | Execution duration in milliseconds |
| `summary` | `string` | Agent's summary of what it did |
| `outcome` | `ExecutionOutcome \| null` | `"success"`, `"failure"`, or `"rejected"` (null if not completed) |
| `rejectionPayload` | `RejectionPayload \| null` | Structured rejection details (if outcome is "rejected") |
| `logs` | `string` | Raw agent output logs |
| `checkpointMessageId` | `string \| null` | SDK message ID for file checkpointing rewind |
| `structuredOutput` | `Record<string, unknown> \| null` | Structured JSON output (Router decisions) |
| `parentExecutionId` | `string \| null` | Parent execution ID (for subagent tracking) |

**Relationships:** belongs to WorkItem and Persona, has many Proposals. May have parent Execution (subagent).

#### RejectionPayload

```typescript
interface RejectionPayload {
  reason: string;      // Why the work was rejected
  severity: "low" | "medium" | "high";
  hint: string;        // Suggestion for fixing
  retryCount: number;  // How many times this item has been retried
}
```

After 3 rejections (`retryCount >= 3`), the work item is escalated to "Blocked".

### Comment

Comments on work items — from agents, users, or the system.

| Field | Type | Description |
|---|---|---|
| `id` | `CommentId` (`cm-xxxx`) | Unique identifier |
| `workItemId` | `WorkItemId` | Parent work item |
| `authorType` | `CommentAuthorType` | `"agent"`, `"user"`, or `"system"` |
| `authorId` | `PersonaId \| null` | Persona ID if agent-authored |
| `authorName` | `string` | Display name of the author |
| `content` | `string` | Comment text (markdown) |
| `metadata` | `Record<string, unknown>` | Additional context (e.g., state transition info) |
| `createdAt` | `string` (ISO 8601) | Creation timestamp |

### Proposal

Suggestions created by agents during execution — for human review.

| Field | Type | Description |
|---|---|---|
| `id` | `ProposalId` (`pr-xxxx`) | Unique identifier |
| `executionId` | `ExecutionId` | Execution that created this proposal |
| `workItemId` | `WorkItemId` | Related work item |
| `type` | `ProposalType` | `"task_creation"`, `"state_transition"`, or `"review_request"` |
| `payload` | `Record<string, unknown>` | Type-specific data |
| `status` | `ProposalStatus` | `"pending"`, `"approved"`, `"rejected"`, or `"expired"` |
| `createdAt` | `string` (ISO 8601) | Creation timestamp |

### ProjectMemory

Cumulative knowledge built by agents as they complete work. Used in system prompts to give agents project context.

| Field | Type | Description |
|---|---|---|
| `id` | `ProjectMemoryId` (`pm-xxxx`) | Unique identifier |
| `projectId` | `ProjectId` | Owning project |
| `workItemId` | `WorkItemId` | Work item this memory was created from |
| `summary` | `string` | AI-generated summary of what was accomplished |
| `filesChanged` | `string[]` | List of files created or modified |
| `keyDecisions` | `string[]` | Important decisions made during the work |
| `createdAt` | `string` (ISO 8601) | Creation timestamp |
| `consolidatedInto` | `ProjectMemoryId \| null` | If consolidated, points to the merged memory |

**Consolidation:** When too many memories accumulate, older ones are consolidated into higher-level summaries. The `consolidatedInto` field links to the replacement memory.

### ChatSession

Pico chat sessions — one per conversation thread.

| Field | Type | Description |
|---|---|---|
| `id` | `ChatSessionId` (`cs-xxxx`) | Unique identifier |
| `projectId` | `ProjectId` | Owning project |
| `title` | `string` | Auto-generated or user-renamed title |
| `createdAt` | `string` (ISO 8601) | Creation timestamp |

### ChatMessage

Individual messages within a Pico chat session.

| Field | Type | Description |
|---|---|---|
| `id` | `ChatMessageId` (`cg-xxxx`) | Unique identifier |
| `sessionId` | `ChatSessionId` | Owning chat session |
| `role` | `"user" \| "assistant"` | Message sender |
| `content` | `string` | Message text content |
| `metadata` | `Record<string, unknown>` | Thinking blocks, tool calls, cost, duration |
| `createdAt` | `string` (ISO 8601) | Creation timestamp |

## ID Format

All entity IDs use nanoid-based short hashes with a type prefix:

| Entity | Prefix | Example |
|---|---|---|
| Project | `pj-` | `pj-x7k2m` |
| WorkItem | `wi-` | `wi-p9f3n` |
| WorkItemEdge | `we-` | `we-a2b4c` |
| Persona | `ps-` | `ps-r8d2j` |
| Execution | `ex-` | `ex-m4n7q` |
| Comment | `cm-` | `cm-h5j9k` |
| Proposal | `pr-` | `pr-t6w3x` |
| ProjectMemory | `pm-` | `pm-v8y1z` |

IDs are generated by `createId` from `@agentops/shared`.

## Storage

- **Database:** SQLite with WAL (Write-Ahead Logging) mode and foreign keys enabled
- **Location:** `~/.agentops/data/agentops.db` (configurable via `dbPath` in config)
- **JSON columns:** `settings`, `context`, `labels`, `executionContext`, `avatar`, `allowedTools`, `mcpTools`, `payload`, `metadata`, `filesChanged`, `keyDecisions` are stored as JSON text with Drizzle's `{ mode: "json" }`
- **Timestamps:** Stored as `integer` in milliseconds (`timestamp_ms` mode), serialized as ISO 8601 strings in the API
