# Architecture

AgentOps is a monorepo with three packages that communicate via HTTP REST, WebSocket, and shared TypeScript types.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (port 5173)                      │
│                                                                 │
│   React 19 + Vite + Tailwind + shadcn/ui                       │
│   TanStack Query (server state) + Zustand (UI state)           │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────────┐                │
│   │ REST API │  │WebSocket │  │  Pico Chat   │                 │
│   │  client  │  │  client  │  │  (SSE)       │                 │
│   └────┬─────┘  └────┬─────┘  └──────┬───────┘                │
│        │              │                                         │
└────────┼──────────────┼─────────────────────────────────────────┘
         │              │
    HTTP │         WS   │
         │              │
┌────────┼──────────────┼─────────────────────────────────────────┐
│        ▼              ▼           Backend (port 3001)           │
│                                                                 │
│   Fastify + @fastify/websocket                                  │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────────┐                │
│   │  Routes  │  │    WS    │  │    Agent     │                 │
│   │ (REST)   │  │broadcast │  │   Engine     │                 │
│   └────┬─────┘  └────┬─────┘  └──────┬───────┘                │
│        │              │               │                         │
│        ▼              │               ▼                         │
│   ┌──────────┐        │        ┌──────────────┐                │
│   │  Drizzle │        │        │ Claude Agent │                │
│   │   ORM    │◄───────┘        │     SDK      │                │
│   └────┬─────┘                 └──────┬───────┘                │
│        ▼                              │                         │
│   ┌──────────┐                 ┌──────┴───────┐                │
│   │  SQLite  │                 │  MCP Server  │                │
│   │  (WAL)   │                 │  (7 tools)   │                │
│   └──────────┘                 └──────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     @agentops/shared                            │
│                                                                 │
│   TypeScript types, entity interfaces, workflow constants,      │
│   ID generators, WebSocket event types, API contracts           │
└─────────────────────────────────────────────────────────────────┘
```

## Packages

### `packages/shared`

Shared TypeScript types and constants imported by both frontend and backend.

| File | Contents |
|---|---|
| `entities.ts` | Entity interfaces: `WorkItem`, `Persona`, `Execution`, `Comment`, `Proposal`, `ProjectMemory`, `WorkItemEdge`, `Project` |
| `api.ts` | API response types: `DashboardStats`, `CostSummary`, `ExecutionStats`, `ReadyWorkItem` |
| `workflow.ts` | `WORKFLOW` constant — 8 states with colors and transition map, validation helpers |
| `ws-events.ts` | `WsEvent` union type — 9 event types for real-time updates |
| `ids.ts` | `createId` factory — nanoid-based with type prefixes (`pj-`, `wi-`, `ps-`, `ex-`, etc.) |

### `packages/frontend`

React single-page application served by Vite in development.

| Directory | Purpose |
|---|---|
| `api/` | Unified API layer — `client.ts` (real HTTP), `index.ts` (re-exports) |
| `features/` | Feature modules — collocated components, hooks, and types per feature |
| `pages/` | Route-level page components |
| `components/` | Shared UI components (sidebar, status bar, shadcn/ui primitives) |
| `hooks/` | TanStack Query hooks wrapping the API layer |
| `stores/` | Zustand stores for UI state (theme, density, sidebar, selected project) |
| `layouts/` | Root layout with sidebar, mobile nav, status bar |

**Key libraries:**
- **React 19** — UI framework
- **Vite** — Build tool and dev server (port 5173)
- **Tailwind CSS v4** — Utility-first CSS with CSS-first configuration
- **shadcn/ui** — Component library (copy-paste, Tailwind-native)
- **TanStack Query** — Server state management (caching, invalidation, refetch)
- **Zustand** — Client UI state (persisted to localStorage)
- **React Router** — Client-side routing
- **Recharts** — Cost charts and data visualization
- **dnd-kit** — Drag-and-drop for kanban board

### `packages/backend`

Fastify HTTP server with SQLite storage and agent execution engine.

| Directory/File | Purpose |
|---|---|
| `server.ts` | Fastify app factory — registers all routes, CORS, WebSocket |
| `start.ts` | Server entry point — starts listening, crash recovery |
| `cli.ts` | CLI entry point — start/stop/status/dev/config commands |
| `config.ts` | Configuration loader — `~/.agentops/config.json` with env var overrides |
| `logger.ts` | Structured logging — pino with dev pretty-print, prod file rotation |
| `audit.ts` | Audit trail — state transitions, dispatches, completions, costs |
| `ws.ts` | WebSocket — `broadcast()` to all connected clients |
| `routes/` | REST API routes — projects, work-items, personas, executions, comments, proposals, dashboard, settings, audit, chat, sdk |
| `db/` | Database — Drizzle schema (9 tables), connection (better-sqlite3), seed script, migrations |
| `agent/` | Agent execution engine (see below) |

**Key libraries:**
- **Fastify** — HTTP framework
- **better-sqlite3** — SQLite driver (WAL mode, foreign keys)
- **Drizzle ORM** — Type-safe SQL query builder
- **@fastify/websocket** — WebSocket support
- **@anthropic-ai/claude-agent-sdk** — Claude Agent SDK for agent execution
- **pino** — Structured logging (pino-pretty dev, pino-roll prod)
- **pm2** — Process management for production

## Agent Execution Engine

The agent subsystem lives in `packages/backend/src/agent/`:

| File | Role |
|---|---|
| `types.ts` | `AgentEvent` union (6 variants), `AgentTask`, `SpawnOptions`, `AgentExecutor` interface |
| `claude-executor.ts` | Claude Agent SDK integration — spawns agent sessions with MCP tools |
| `execution-manager.ts` | Orchestrates execution lifecycle: create DB record → stream events → update on completion/failure |
| `dispatch.ts` | Triggers persona execution when work items enter a state |
| `router.ts` | Router agent — haiku model, decides next state after persona completes |
| `coordination.ts` | Parent-child coordination — auto-advances parent when all children complete |
| `concurrency.ts` | Concurrency limiter — in-memory tracking, priority FIFO queue |
| `memory.ts` | Project memory — haiku summary on completion, token-budgeted retrieval |
| `mcp-server.ts` | MCP server factory — 8 tools agents use to interact with the system |
| `sdk-session.ts` | Persistent V2 SDK session — lazy singleton for capabilities discovery |
| `sandbox.ts` | Command sandbox — validates Bash commands against project directory escapes |

## SDK Hooks

Every agent execution registers SDK hooks via the `hooks` option in `query()`. These are programmatic `HookCallback` functions (not shell command hooks) that fire during the SDK's agent loop.

### Registered Hooks

| Hook Event | Matcher | Purpose | Replaces |
|---|---|---|---|
| `PreToolUse` | `Bash` | **Sandbox validation** — calls `validateCommand()` from `sandbox.ts`, returns `permissionDecision: "deny"` if the command escapes the project directory | Manual `validateCommand()` check in the streaming loop + `abortController.abort()` |
| `PreToolUse` | (all) | **Audit timing** — records `Date.now()` keyed by `tool_use_id` for duration calculation | N/A (new) |
| `PostToolUse` | (all) | **Audit logging** — logs `{ executionId, toolName, durationMs, success: true }` to audit trail. For Bash tools, also logs the sanitized command string | N/A (new) |
| `PostToolUseFailure` | (all) | **Failure audit** — same as PostToolUse but with `success: false` | N/A (new) |
| `SessionStart` | (all) | **Lifecycle audit** — logs `{ executionId, personaName, model, workItemId }` to audit trail + broadcasts `execution_update` WS event (status: "running") | Manual `agent_started` broadcast timing (still preserved for different payload) |
| `SessionEnd` | (all) | **Lifecycle audit** — logs `{ executionId, reason, durationMs }` to audit trail. Duration computed from SessionStart timestamp | Manual `agent_completed` broadcast timing (still preserved for cost/outcome payload) |
| `FileChanged` | (all) | **Live file tracking** — broadcasts `file_changed` WS event with `{ executionId, filePath, changeType }`. Maps SDK events (`add`/`change`/`unlink`) to `created`/`modified`/`deleted` | N/A (new) |

### Hook Architecture

```
ClaudeExecutor.spawn()
    │
    ├── buildSandboxHook(projectPath)     → PreToolUse [Bash only]
    ├── buildAuditHooks(executionId)       → PreToolUse + PostToolUse + PostToolUseFailure
    ├── buildSessionHooks(ctx)             → SessionStart + SessionEnd
    └── buildFileChangedHook(executionId)  → FileChanged
    │
    ▼
query({
  options: {
    hooks: {
      PreToolUse:        [{ matcher: "Bash", hooks: [sandbox] }, { hooks: [auditTiming] }],
      PostToolUse:       [{ hooks: [auditSuccess] }],
      PostToolUseFailure:[{ hooks: [auditFailure] }],
      SessionStart:      [{ hooks: [sessionStart] }],
      SessionEnd:        [{ hooks: [sessionEnd] }],
      FileChanged:       [{ hooks: [fileChanged] }],
    }
  }
})
```

### Audit Trail Integration

Tool-level and session-level audit events are written to `~/.agentops/logs/audit.log` via dedicated functions in `audit.ts`:

| Function | Action | Fields |
|---|---|---|
| `auditToolUse()` | `tool_use` | executionId, toolName, durationMs, success, command? |
| `auditSessionStart()` | `session_start` | executionId, personaName, model, workItemId |
| `auditSessionEnd()` | `session_end` | executionId, reason, durationMs |

Bash commands are sanitized before logging — secrets matching `ANTHROPIC_API_KEY`, `API_KEY`, `SECRET`, `TOKEN`, or `PASSWORD` patterns have their values replaced with `***`.

## Subagent System

Every agent execution registers all project personas as SDK subagents via the `agents` option in `query()`. This allows any persona to invoke another persona as a subagent using the SDK's `Agent` tool.

### How Personas Map to AgentDefinitions

When `ClaudeExecutor.spawn()` runs, it builds a map of `AgentDefinition` entries from all personas:

| Field | Primary Persona | Subagent Personas |
|---|---|---|
| `prompt` | Full system prompt via `buildSystemPrompt()` (persona identity + project context + work item + sandbox + execution history) | Persona's own `systemPrompt` |
| `model` | Persona's configured model | Each persona's own model |
| `tools` | Persona's `allowedTools` | Each persona's own `allowedTools` |
| `skills` | Persona's `skills` | Each persona's own `skills` |
| `maxTurns` | 30 | 15 (reduced for subagent scope) |

The primary persona is set as the `agent` option; all others are available as subagents keyed by persona ID.

### Subagent Invocation Flow

```
Primary Agent (e.g., Engineer)
    │
    ├── Uses Agent tool to invoke Code Reviewer (persona ID)
    │     │
    │     ├── SubagentStart hook fires → broadcasts subagent_started WS event
    │     ├── Subagent runs with its own tools, model, and prompt
    │     └── SubagentStop hook fires → broadcasts subagent_completed WS event
    │
    └── Continues with subagent's response
```

### Tracking and Cost

- **`parentExecutionId`** column on executions table links child executions to their parent
- **SubagentStart/SubagentStop hooks** broadcast `subagent_started`/`subagent_completed` WS events for real-time UI updates
- **Agent monitor** renders child executions as nested `SubagentCard` components under the parent (tree connector, collapsible)
- Subagent costs are tracked within the parent execution's SDK `query()` session (included in `total_cost_usd`)

### When to Use Subagents vs. State Transitions

| Approach | Use When | Example |
|---|---|---|
| **Subagent** | Quick, focused task within the current execution; result feeds back to the caller | Engineer asks Code Reviewer for a quick review before committing |
| **State transition** | Work item moves to a new workflow phase; different persona takes over fully | Router moves item from "In Progress" to "In Review" after Engineer completes |

Subagents are lightweight (15 turns, no separate execution record in the workflow) while state transitions are the primary orchestration mechanism for the workflow pipeline.

## File Checkpointing

Every agent execution runs with `enableFileCheckpointing: true` in the `query()` options. The SDK creates a checkpoint of the project's file state before the agent makes any changes.

### How it works

1. **Checkpoint creation:** When `ClaudeExecutor.spawn()` starts an execution, `enableFileCheckpointing: true` is passed to `query()`. The SDK snapshots file state internally.
2. **Message ID capture:** The executor captures the first assistant message's `id` and emits a `checkpoint` event. The execution manager stores this as `checkpointMessageId` in the `executions` table.
3. **Rewind:** `POST /api/executions/:id/rewind` creates a temporary `query()` session and calls `q.rewindFiles(checkpointMessageId, { dryRun })` to restore files to their pre-execution state.

### Rewind flow

```
User clicks Rewind → Frontend calls POST /api/executions/:id/rewind
                      │
                      ├── dryRun: true  → returns file list preview
                      └── dryRun: false → reverts files, posts comment, logs audit
```

### Limitations

- Only works for executions created after checkpointing was enabled (`checkpointMessageId != null`). Legacy executions have this field as `null`.
- Cannot rewind running executions (409 EXECUTION_RUNNING).
- Requires the Anthropic API key to be configured (creates a temporary SDK session for the rewind call).
- The rewind operation is idempotent — rewinding an already-rewound execution is a no-op (0 files changed).

### MCP tool: `rewind_execution`

The Code Reviewer persona has access to `rewind_execution` via the agentops MCP server. This tool calls the rewind API endpoint internally (`http://localhost:PORT/api/executions/:id/rewind`). The reviewer's system prompt includes guidance on when to use it: only for fundamentally wrong implementations that need a complete redo, not for minor issues.

## SDK V2 Session Architecture

The backend maintains a persistent V2 SDK session for capabilities discovery. This is separate from per-execution `query()` calls used by workflow agents.

### Session Types

| Type | Purpose | Lifecycle |
|---|---|---|
| **Discovery session** | Temporary `query()` to call `initializationResult()` and `reloadPlugins()` control methods | Created on first `GET /api/sdk/capabilities` call, cached for server lifetime |
| **Per-execution session** | `query()` spawned by `ClaudeExecutor` for each agent run | Created per dispatch, destroyed on completion/failure |
| **Pico chat session** | `query()` per message with full conversation history | Created per user message, SSE streaming, destroyed on response complete |
| **Persistent V2 session** | `unstable_v2_createSession()` singleton in `sdk-session.ts` | Lazy-created on first access, kept alive, closed on shutdown |

### Persistent V2 Session (`sdk-session.ts`)

```
Server Start
    │
    ▼
[NOT created at startup — lazy initialization]
    │
    ▼
First call to getSdkSession()
    │
    ▼
unstable_v2_createSession()
    ├── model: claude-sonnet-4-6
    ├── permissionMode: bypassPermissions
    ├── allowedTools: [Read, Glob, Grep, Bash, WebSearch]
    │
    ▼
Read first message from stream() → captures sessionId
    │
    ▼
Session ready (cached as singleton)
    │
    ├── getSdkSession() → returns cached session
    ├── getSdkSessionId() → returns session ID
    ├── isSdkSessionReady() → true
    │
    ▼
On session failure → reconnectSdkSession()
    ├── Try unstable_v2_resumeSession(oldId)
    ├── Fallback: create new session
    ├── Exponential backoff: 1s, 2s, 4s (max 3 retries)
    │
    ▼
Server Shutdown (SIGTERM/SIGINT)
    │
    ▼
closeSdkSession() → session.close()
```

### SDK Capabilities Discovery (`routes/sdk.ts`)

```
GET /api/sdk/capabilities
    │
    ▼
Cache hit? → return cached result
    │ (miss)
    ▼
withDiscoveryQuery()
    ├── Create lightweight query("Respond with exactly: OK")
    ├── Read first message (ensures subprocess running)
    ├── Call initializationResult()
    ├── Interrupt and drain query
    │
    ▼
Cache result: { commands, agents, models, cachedAt }
    │
    ▼
Return to client

POST /api/sdk/reload
    │
    ▼
withDiscoveryQuery() → reloadPlugins()
    │
    ▼
Refresh cache with new commands + agents
```

**Why not use the V2 session for discovery?** The discovery APIs (`initializationResult()`, `reloadPlugins()`) are control methods on the `Query` interface, not on `SDKSession`. V2 sessions only expose `send()`, `stream()`, and `close()`.

**Why not use V2 sessions for Pico?** `SDKSessionOptions` does not support `agent`/`agents`, `mcpServers`, `cwd`, `skills`, or `maxBudgetUsd` — only `query()` `Options` does. Pico requires a custom personality (system prompt), MCP server access, and project-scoped working directory, so it continues to use `query()` per message.

## Data Flow

### Request Lifecycle

```
User Action (UI)
    │
    ▼
TanStack Query ──► REST API (Fastify)
    │                    │
    │                    ▼
    │               Drizzle ORM ──► SQLite
    │                    │
    │                    ▼
    │               broadcast(WsEvent)
    │                    │
    ▼                    ▼
WebSocket Client ◄── WebSocket Server
    │
    ▼
Query Invalidation ──► UI Re-render
```

### Agent Execution Lifecycle

```
State Change (PATCH /api/work-items/:id)
    │
    ▼
dispatchForState()
    │
    ├── Check: persona assigned to this state?
    ├── Check: concurrency limit (canSpawn)?
    ├── Check: monthly cost cap?
    │
    ▼
runExecution()
    │
    ├── Create execution DB record (status: running)
    ├── Broadcast: agent_started WsEvent
    │
    ▼
ClaudeExecutor.spawn()
    │
    ├── Build 4-layer system prompt
    ├── Attach MCP server (7 tools)
    ├── Stream agent events
    │     ├── agent_output_chunk → broadcast to UI
    │     ├── tool_call → MCP tool execution
    │     └── completion/error
    │
    ▼
On Completion:
    ├── Update execution DB record (status: completed)
    ├── Update cost tracking
    ├── Broadcast: agent_completed WsEvent
    ├── Audit log entry
    │
    ▼
runRouter() (if autoRouting ON)
    │
    ├── Router agent decides next state
    ├── route_to_state MCP tool → state change
    │
    ▼
dispatchForState() (next persona)
    │
    └── Cycle continues...
```

### WebSocket Events

The backend broadcasts `WsEvent` messages to all connected clients. The frontend's `useWsQuerySync` hook listens for these events and invalidates the relevant TanStack Query caches, triggering automatic UI updates.

| Event | Trigger | Invalidates |
|---|---|---|
| `state_change` | Work item state transition | `workItems`, `dashboardStats` |
| `comment_created` | New comment posted | `comments` |
| `agent_started` | Execution begins | `executions`, `dashboardStats` |
| `agent_completed` | Execution finishes | `executions`, `dashboardStats`, `workItems` |
| `agent_output_chunk` | Streaming agent output | Agent monitor (direct) |
| `agent_error` | Execution error | `executions` |
| `cost_update` | Cost tracking update | `dashboardStats`, `costSummary` |
| `proposal_created` | New proposal | `proposals` |
| `router_decision` | Router state transition | `workItems`, `activityFeed` |
