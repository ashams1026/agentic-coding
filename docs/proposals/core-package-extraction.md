# Proposal: Core Package Extraction Strategy

**Task:** RES.PLUG.CORE
**Unblocks:** PLUG.3c (ExecutionManager to core), PLUG.3d (MCP server to core)
**Date:** 2026-04-02

## Problem

PLUG.3c/3d want to move ExecutionManager and MCP server from `packages/backend` to `packages/core`. The core package already has repository interfaces (`repositories.ts`), executor registry, and sandbox config. But both modules have 6+ non-DB dependencies that need abstraction before extraction is viable.

## Current State of `@agentops/core`

```
packages/core/src/
  executor-registry.ts  (65 lines) — ExecutorRegistry class
  repositories.ts       (239 lines) — DB repository interfaces
  sandbox.ts            (177 lines) — Sandbox configuration
  types.ts              (141 lines) — Core domain types
  index.ts              (46 lines) — Re-exports
```

The repository interfaces are already extracted (WorkItemRepository, ExecutionRepository, PersonaRepository, etc.) but ExecutionManager hasn't been migrated to use them yet.

## Dependency Catalog

### ExecutionManager (`execution-manager.ts`) — 11 imports

| Dependency | Category | Extraction Difficulty |
|---|---|---|
| `eq` from drizzle-orm | DB/Drizzle | Easy — replaced by repository methods |
| `executions, workItems, personas, projects, comments` from schema | DB/Drizzle | Easy — replaced by repositories |
| `createId`, types from `@agentops/shared` | Shared | Already portable |
| Agent types from `./types.js` | Internal | Easy — already interface-based |
| `ExecutorRegistry` from `@agentops/core` | Core | Already there |
| `logger` from `../logger.js` | **Infrastructure** | Needs interface |
| `auditAgentDispatch, auditAgentComplete, auditCostEvent` from `../audit.js` | **Infrastructure** | Needs interface |
| `trackExecution, onComplete, getProjectCostSummary` from `./concurrency.js` | **Orchestration** | Needs interface |
| `runRouter` from `./router.js` | **Orchestration** | Needs interface |
| `dispatchForState` from `./dispatch.js` | **Orchestration** | Needs interface |

### MCP Server (`mcp-server.ts`) — 14 imports

| Dependency | Category | Extraction Difficulty |
|---|---|---|
| `McpServer`, `StdioServerTransport` from MCP SDK | External | Peer dependency |
| `z` from zod | External | Peer dependency |
| `createSdkMcpServer, tool` from Claude SDK | External | Peer dependency |
| `eq, and` from drizzle-orm | DB/Drizzle | Easy — repositories |
| `db` from connection, schema tables | DB/Drizzle | Easy — repositories |
| `createId`, `WORKFLOW`, `isValidTransition`, types from shared | Shared | Already portable |
| `broadcast` from `../ws.js` | **Infrastructure** | Needs interface |
| `checkParentCoordination` from `./coordination.js` | **Orchestration** | Needs interface |
| `checkMemoryGeneration, getRecentMemories` from `./memory.js` | **Orchestration** | Needs interface |
| `executionManager` from `./setup.js` | **Orchestration** | Circular — manager references MCP, MCP references manager |
| `logger` from `../logger.js` | **Infrastructure** | Needs interface |
| `auditStateTransition` from `../audit.js` | **Infrastructure** | Needs interface |

## Analysis of Non-DB Dependencies

### Infrastructure Dependencies (3 unique)

1. **Logger** — Used by both modules. Simple interface: `{ info, warn, error, debug }` with structured logging (key-value context).

2. **Audit** — 4 functions used: `auditAgentDispatch`, `auditAgentComplete`, `auditCostEvent`, `auditStateTransition`. These write audit events to DB + broadcast via WebSocket. Need an `AuditService` interface.

3. **Broadcast (WebSocket)** — Used by MCP server to emit real-time events. Simple interface: `broadcast(event: WsEvent): void`.

### Orchestration Dependencies (5 unique)

4. **Concurrency** — `trackExecution` (reserves slot), `onComplete` (releases slot), `getProjectCostSummary` (reads cost data). Manages concurrent agent execution limits.

5. **Router** — `runRouter` invokes the Router persona to determine next state. Calls back into the executor system.

6. **Dispatch** — `dispatchForState` finds the persona assigned to a workflow state and creates an execution. Also calls back into the executor system.

7. **Coordination** — `checkParentCoordination` checks if all child tasks are done and transitions the parent. Calls dispatch/router.

8. **Memory** — `checkMemoryGeneration` generates project memories when work items complete. `getRecentMemories` retrieves them for agent context.

### Key Insight: Circular Dependencies

The orchestration dependencies form a cycle:
```
ExecutionManager → dispatch → creates execution → ExecutionManager
ExecutionManager → router → transitions state → dispatch → ExecutionManager
MCP server → coordination → dispatch → ExecutionManager
MCP server → executionManager (direct import)
```

This cycle makes a clean extraction to core very difficult unless the entire orchestration layer moves together.

## Options Evaluated

### Option A: Full Extraction (Original PLUG.3c/3d intent)

Move ExecutionManager, dispatch, router, coordination, memory, concurrency all to core. Abstract logger, audit, broadcast as interfaces.

**Pros:** True separation, core is self-contained
**Cons:** 8+ new interfaces needed, 6 tightly coupled modules to extract, circular dependency resolution required (dependency inversion throughout), massive scope — essentially rewriting the agent orchestration layer

**Effort:** Very high (15-20 tasks). Not worth it unless we're building multiple backends.

### Option B: Thin Interface Extraction (Recommended)

Keep ExecutionManager and MCP server in backend. Extract only the **contracts** (interfaces + types) to core:

1. **`ExecutionManagerInterface`** — the public API that other modules call
2. **`MpcToolDefinitions`** — the tool schemas/handlers as data (not the server itself)
3. **`OrchestratorInterface`** — dispatch, router, coordination as a single facade

Then backend implements these interfaces, and any future plugin/extension can depend on the contracts without importing the backend.

```typescript
// packages/core/src/orchestrator.ts
export interface Orchestrator {
  /** Dispatch an agent for a work item in a given state */
  dispatchForState(workItemId: string, state: string, projectId: string): Promise<void>;
  
  /** Run the router to determine next state after execution */
  runRouter(executionId: string, outcome: ExecutionOutcome): Promise<void>;
  
  /** Check if parent work item should transition */
  checkParentCoordination(workItemId: string): Promise<void>;
  
  /** Generate memory when work item completes */
  checkMemoryGeneration(workItemId: string, newState: string): Promise<void>;
}

export interface ExecutionManagerPort {
  /** Start an execution for a work item */
  startExecution(workItemId: string, personaId: string, opts?: { parentExecutionId?: string }): Promise<string>;
  
  /** Get execution status */
  getExecution(id: string): Promise<ExecutionRow | null>;
  
  /** Cancel a running execution */
  cancelExecution(id: string): Promise<void>;
}
```

**Pros:** Low effort, breaks the right seams, doesn't require moving code
**Cons:** ExecutionManager stays in backend (but that's fine — it's backend-specific)

**Effort:** Low (3-5 tasks)

### Option C: Service Locator / DI Container

Introduce a DI container (like `tsyringe`, `inversify`, or a simple manual container) that all modules resolve dependencies from at runtime.

**Pros:** Clean dependency management, testable
**Cons:** Adds complexity, unfamiliar pattern in this codebase, runtime overhead. Other TS monorepos (tRPC, Effect) use functional composition rather than DI containers.

**Effort:** Medium, but high ongoing complexity cost.

### Option D: Effect-style Service Pattern

Use the Effect TS library's `Layer`/`Service` pattern where each dependency is a typed service that gets provided at the composition root.

**Pros:** Elegant, composable, great for testing
**Cons:** Requires adopting Effect as a core dependency — massive paradigm shift for a small team. The codebase is currently vanilla async/await.

**Effort:** Very high. Wrong tool for this project's scale.

## Recommendation

**Go with Option B: Thin Interface Extraction.**

The key insight is that `@agentops/core` doesn't need to contain the *implementations* — it needs to contain the *contracts*. The purpose of core is to let plugins and extensions interact with the system without depending on backend internals. Interfaces in core + implementations in backend achieves this.

### Concrete Next Steps

1. **Add `Orchestrator` interface to core** — facade for dispatch, router, coordination, memory
2. **Add `ExecutionManagerPort` interface to core** — public API for execution management  
3. **Add infrastructure interfaces to core** — `Logger`, `AuditService`, `EventBroadcaster`
4. **Backend implements all interfaces** — wire them in the composition root (`setup.ts`)
5. **Update MCP server** to accept interfaces via constructor/factory rather than direct imports

This unblocks PLUG.3c/3d by redefining them: instead of "move code to core", they become "depend on core interfaces" — the code stays in backend but the contracts are shareable.

### Impact on Blocked Tasks

- **PLUG.3c** can be redefined as: "Create Orchestrator + ExecutionManagerPort interfaces in core, update ExecutionManager to implement ExecutionManagerPort"
- **PLUG.3d** can be redefined as: "Refactor MCP server to accept Orchestrator + repos via factory function instead of direct imports"

### Reference: How Other TS Monorepos Handle This

- **tRPC**: Defines router/procedure types in `@trpc/server`, implementations in app code. Clean interface boundary.
- **Prisma**: Schema lives in one place, client is generated. Strong contract-first approach.
- **Effect**: Layer/Service pattern with explicit dependency declarations. Elegant but heavy.

Our situation is closest to tRPC's pattern: define the shapes in core, implement in backend.

## Files to Change

- `packages/core/src/orchestrator.ts` — new: Orchestrator interface
- `packages/core/src/execution-manager-port.ts` — new: ExecutionManagerPort interface
- `packages/core/src/infrastructure.ts` — new: Logger, AuditService, EventBroadcaster interfaces
- `packages/core/src/index.ts` — re-export new interfaces
- `packages/backend/src/agent/execution-manager.ts` — implement ExecutionManagerPort
- `packages/backend/src/agent/mcp-server.ts` — accept interfaces via factory
- `packages/backend/src/agent/setup.ts` — wire implementations
