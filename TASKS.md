# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

## Sprint 8: Agent Execution Engine (Phase 4 + 5)

> Core agent infrastructure. Implements Phase 4 (Workflow & Router) and Phase 5 (Agent Persona & Execution) from PLANNING.md.
> T4.1 (hardcoded workflow) already done in Sprint 6 (O.2). T4.6 (user intervention UI) partially done in Sprint 7 (U.7).
> Order: MCP tools → executor interface → SDK executor → dispatch → router → coordination → rejection → concurrency → memory.

### Workflow Dispatch & Router (T4.2 + T4.3)

- [x] **A.12** — Wire dispatch and routing into execution lifecycle. In `execution-manager.ts`: after successful execution completion, call `runRouter(workItemId)`. In `dispatch.ts`: after router changes state, call `dispatchForState()` for the new state. Add guard against infinite loops (max 10 transitions per work item per hour). Wire `dispatchForState` into the PATCH /api/work-items/:id route when currentState changes.

### State Coordination & Rejection (T4.4 + T4.5)

- [x] **A.13** — Implement parent-child state coordination. In `packages/backend/src/agent/coordination.ts`: after any child work item reaches Done, check if all siblings are also Done. If yes, auto-advance parent to "In Review" state (configurable). If any child enters Blocked, add a visual indicator on parent (flag field or comment). Wire into the state-change handler.

- [x] **A.14** — Implement rejection and retry logic. In execution-manager: when Router routes from "In Review" back to "In Progress" (rejection), increment a retry counter on the work item. Carry structured rejection payload: `{ decision, reason, severity, retry_hint }`. Append to executionContext. On max retries (default 3): auto-transition to Blocked, broadcast notification. Persona on next run receives rejection context.

### Concurrency & Cost (T5.4)

- [x] **A.15** — Implement concurrency limiter. Create `packages/backend/src/agent/concurrency.ts`. Track active executions in memory. `canSpawn()`: check against global max (default 3, from project settings). `enqueue(task)`: if at capacity, add to FIFO queue with priority ordering. `onComplete()`: dequeue next task. Wire into dispatch.ts.

- [ ] **A.16** — Implement cost tracking and caps. In execution-manager: accumulate `costUsd` from executor events. In concurrency.ts: before spawning, check monthly cost against project's `monthCap` setting. If exceeded, reject spawn and post system comment. Broadcast `cost_update` WS event after each execution.

### Project Memory (T5.5)

- [ ] **A.17** — Implement project memory creation. After a top-level work item reaches Done: generate a compressed summary (what was done, key decisions, files changed). Insert into `project_memories` table. Use a haiku-model one-shot call for summary generation.

- [ ] **A.18** — Implement memory consolidation and retrieval. Periodic consolidation: when memory count exceeds threshold (e.g., 50), merge oldest entries into higher-level summaries. `get_context` MCP tool serves recent memories capped at ~1000 tokens. Add `getRecentMemories(projectId, tokenBudget)` to a new `packages/backend/src/agent/memory.ts` module.
