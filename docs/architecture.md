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
│   │ REST API │  │WebSocket │  │  Mock Layer  │                 │
│   │  client  │  │  client  │  │  (dev mode)  │                 │
│   └────┬─────┘  └────┬─────┘  └──────────────┘                │
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
| `api/` | Unified API layer — `client.ts` (real HTTP), `index.ts` (delegates to mock or real based on `apiMode`) |
| `mocks/` | Mock API and fixtures — full in-browser simulation of all endpoints |
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
| `routes/` | REST API routes — projects, work-items, personas, executions, comments, proposals, dashboard, settings, audit |
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
| `mcp-server.ts` | MCP server factory — 7 tools agents use to interact with the system |

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
