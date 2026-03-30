# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

## Sprint 7: UI Refinements & Flow View

- [x] **U.1** — Remove tree view.
- [x] **U.2** — Build Flow view.
- [x] **U.3** — Update view toggle.
- [x] **U.4** — Add inline title editing to detail panel.
- [x] **U.5** — Add description editing to detail panel.
- [x] **U.6** — Add priority and label editing to detail panel.
- [x] **U.7** — Add state transition control to detail panel.
- [x] **U.8** — Soften agent monitor page chrome.
- [x] **U.9** — Fix bottom padding for status bar.

---

## Sprint 8: Agent Execution Engine (Phase 4 + 5)

> Core agent infrastructure. Implements Phase 4 (Workflow & Router) and Phase 5 (Agent Persona & Execution) from PLANNING.md.
> T4.1 (hardcoded workflow) already done in Sprint 6 (O.2). T4.6 (user intervention UI) partially done in Sprint 7 (U.7).
> Order: MCP tools → executor interface → SDK executor → dispatch → router → coordination → rejection → concurrency → memory.

### Agent MCP Server (T5.1)

- [x] **A.1** — Create AgentOps MCP server skeleton. Create `packages/backend/src/agent/mcp-server.ts`. Set up an MCP server using `@modelcontextprotocol/sdk` (or equivalent) that registers tool definitions. Export a `createMcpServer(context)` factory that takes project/workItem context and returns a configured server instance. No tool implementations yet — just the server scaffold and type-safe tool registration pattern.

- [ ] **A.2** — Implement `post_comment` MCP tool. In `mcp-server.ts`: implement the `post_comment` tool that inserts a comment into the database via the existing comments table. Input: `{ workItemId, content, metadata? }`. Auto-sets `authorType: "agent"`, `authorName` from the persona context. Broadcasts `comment_created` WS event via `broadcast()`.

- [ ] **A.3** — Implement `create_children` MCP tool. Input: `{ parentId, children: [{ title, description?, dependsOn[]? }] }`. Creates work items in Backlog state with parent reference. Creates work_item_edges for any dependsOn references. Returns created IDs. Broadcasts `state_change` WS events.

- [ ] **A.4** — Implement `route_to_state` MCP tool. Router-only tool. Input: `{ workItemId, targetState, reasoning }`. Validates against `isValidTransition()`. Updates work item's `currentState`. Posts reasoning as a system comment. Broadcasts `state_change` WS event. Returns success/error.

- [ ] **A.5** — Implement read-only MCP tools. Implement `list_items` (query work items with optional parentId/state filter, verbosity control: "summary" returns id+title+state, "detail" includes description+context), `get_context` (returns work item's executionContext + optional project memories), `flag_blocked` (sets state to Blocked, posts reason as comment), `request_review` (posts a system comment flagging human attention needed).

### Agent Executor (T5.2 + T5.3)

- [ ] **A.6** — Create agent executor interface and types. Create `packages/backend/src/agent/types.ts`. Define `AgentEvent` union type (thinking, tool_use, tool_result, text, error, result). Define `AgentExecutor` interface: `spawn(task, persona, project) → AsyncIterable<AgentEvent>`. Define `AgentTask` (workItemId, context, executionHistory) and `SpawnOptions` (model, maxBudget, tools).

- [ ] **A.7** — Install Claude Agent SDK and create executor. Run `pnpm --filter backend add @anthropic-ai/claude-agent-sdk`. Create `packages/backend/src/agent/claude-executor.ts` implementing `AgentExecutor`. Use `query()` from the SDK. Map persona config to SDK options (model, permissionMode: "bypassPermissions", maxTurns). Set `cwd` to project path. Register AgentOps MCP server with persona-scoped tool allowlist. Return async iterable that yields `AgentEvent` from SDK stream.

- [ ] **A.8** — Implement system prompt assembly. In `claude-executor.ts`: build the layered system prompt: (1) persona.systemPrompt (role identity), (2) project context summary (project name, description, key patterns), (3) work item context (title, description, parent chain, inherited context), (4) execution history from executionContext array (previous attempts, rejections). Export `buildSystemPrompt(persona, workItem, project)` function.

- [ ] **A.9** — Implement execution lifecycle and streaming. Create `packages/backend/src/agent/execution-manager.ts`. `runExecution(workItemId, personaId)`: creates execution record (status: "running"), spawns executor, streams AgentEvent to WebSocket via `broadcast()` (as `agent_output_chunk` events), updates execution on completion (status, costUsd, durationMs, summary, outcome). On error: sets status "failed", preserves partial output in logs.

### Workflow Dispatch & Router (T4.2 + T4.3)

- [ ] **A.10** — Implement persona dispatch on state entry. Create `packages/backend/src/agent/dispatch.ts`. `dispatchForState(workItemId, stateName)`: looks up PersonaAssignment for the state, if found spawns execution via `runExecution()`. Called from the work-items PATCH route when `currentState` changes. No-op for states without assigned personas (Backlog, Done).

- [ ] **A.11** — Implement Router agent. Create `packages/backend/src/agent/router.ts`. `runRouter(workItemId)`: spawns a haiku-model agent with read-only tools + `route_to_state`. System prompt: "You are a routing agent. Given the current state and work item context, decide the next workflow state." Called after any persona execution completes (from execution-manager on success). If auto-routing is disabled (check project settings), skip.

- [ ] **A.12** — Wire dispatch and routing into execution lifecycle. In `execution-manager.ts`: after successful execution completion, call `runRouter(workItemId)`. In `dispatch.ts`: after router changes state, call `dispatchForState()` for the new state. Add guard against infinite loops (max 10 transitions per work item per hour). Wire `dispatchForState` into the PATCH /api/work-items/:id route when currentState changes.

### State Coordination & Rejection (T4.4 + T4.5)

- [ ] **A.13** — Implement parent-child state coordination. In `packages/backend/src/agent/coordination.ts`: after any child work item reaches Done, check if all siblings are also Done. If yes, auto-advance parent to "In Review" state (configurable). If any child enters Blocked, add a visual indicator on parent (flag field or comment). Wire into the state-change handler.

- [ ] **A.14** — Implement rejection and retry logic. In execution-manager: when Router routes from "In Review" back to "In Progress" (rejection), increment a retry counter on the work item. Carry structured rejection payload: `{ decision, reason, severity, retry_hint }`. Append to executionContext. On max retries (default 3): auto-transition to Blocked, broadcast notification. Persona on next run receives rejection context.

### Concurrency & Cost (T5.4)

- [ ] **A.15** — Implement concurrency limiter. Create `packages/backend/src/agent/concurrency.ts`. Track active executions in memory. `canSpawn()`: check against global max (default 3, from project settings). `enqueue(task)`: if at capacity, add to FIFO queue with priority ordering. `onComplete()`: dequeue next task. Wire into dispatch.ts.

- [ ] **A.16** — Implement cost tracking and caps. In execution-manager: accumulate `costUsd` from executor events. In concurrency.ts: before spawning, check monthly cost against project's `monthCap` setting. If exceeded, reject spawn and post system comment. Broadcast `cost_update` WS event after each execution.

### Project Memory (T5.5)

- [ ] **A.17** — Implement project memory creation. After a top-level work item reaches Done: generate a compressed summary (what was done, key decisions, files changed). Insert into `project_memories` table. Use a haiku-model one-shot call for summary generation.

- [ ] **A.18** — Implement memory consolidation and retrieval. Periodic consolidation: when memory count exceeds threshold (e.g., 50), merge oldest entries into higher-level summaries. `get_context` MCP tool serves recent memories capped at ~1000 tokens. Add `getRecentMemories(projectId, tokenBudget)` to a new `packages/backend/src/agent/memory.ts` module.
