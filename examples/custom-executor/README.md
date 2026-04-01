# Custom Executor Example

This example shows how to implement a custom `AgentExecutor` for AgentOps. Instead of calling Claude, this executor simply echoes back the task description — useful for testing and as a starting template.

## How It Works

### 1. Implement the `AgentExecutor` interface

Your executor must implement `spawn()`, which returns an `AsyncIterable<AgentEvent>`. The events are streamed to the UI in real time.

```typescript
import type { AgentExecutor, AgentTask, AgentEvent, SpawnOptions } from "@agentops/core";
import type { Persona, Project } from "@agentops/shared";

export class MyExecutor implements AgentExecutor {
  async *spawn(
    task: AgentTask,
    persona: Persona,
    project: Project,
    options: SpawnOptions,
  ): AsyncIterable<AgentEvent> {
    // Emit events as the agent works...
    yield { type: "text", content: "Working on it..." };
    yield { type: "result", summary: "Done", outcome: "success", costUsd: 0, durationMs: 100 };
  }
}
```

### 2. Register it in the executor registry

```typescript
import { ExecutorRegistry } from "@agentops/core";
import { MyExecutor } from "./my-executor.js";

const registry = new ExecutorRegistry();
registry.register("my-executor", () => new MyExecutor());
registry.register("claude", () => new ClaudeExecutor()); // keep the default
registry.register("mock", () => new MockExecutor());      // keep the mock
```

### 3. Wire it into the ExecutionManager

In your project's `setup.ts` (the composition root), pass your registry:

```typescript
import { createExecutionManager } from "@agentops/backend/agent/setup";

const manager = createExecutionManager(registry);
```

### 4. Select it at runtime

Switch to your executor via the REST API or Settings UI:

```bash
# Via API
curl -X PUT http://localhost:3001/api/settings/executor-mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "my-executor"}'

# Check available executors
curl http://localhost:3001/api/settings/executor-mode
# → { "mode": "my-executor", "available": ["claude", "mock", "my-executor"], ... }
```

Or set the environment variable: `AGENTOPS_EXECUTOR=my-executor`

## Event Types

Your executor can yield these events:

| Event | Required Fields | Purpose |
|-------|----------------|---------|
| `thinking` | `content: string` | Show reasoning (collapsible in UI) |
| `text` | `content: string` | Main output text |
| `tool_use` | `toolName, input, toolCallId` | Tool invocation |
| `tool_result` | `toolCallId, output, isError` | Tool response |
| `error` | `message: string` | Error message |
| `result` | `summary, outcome, costUsd, durationMs` | **Must be last** — signals completion |

The `result` event is required and must be the last event yielded. Set `outcome` to `"success"` or `"failure"`.

## Files

- `echo-executor.ts` — The custom executor implementation
- `setup.ts` — Example composition root showing how to register it
