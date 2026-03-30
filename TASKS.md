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

- [x] **A.16** — Implement cost tracking and caps. In execution-manager: accumulate `costUsd` from executor events. In concurrency.ts: before spawning, check monthly cost against project's `monthCap` setting. If exceeded, reject spawn and post system comment. Broadcast `cost_update` WS event after each execution.

### Project Memory (T5.5)

- [x] **A.17** — Implement project memory creation. After a top-level work item reaches Done: generate a compressed summary (what was done, key decisions, files changed). Insert into `project_memories` table. Use a haiku-model one-shot call for summary generation.

- [ ] **A.18** — Implement memory consolidation and retrieval. Periodic consolidation: when memory count exceeds threshold (e.g., 50), merge oldest entries into higher-level summaries. `get_context` MCP tool serves recent memories capped at ~1000 tokens. Add `getRecentMemories(projectId, tokenBudget)` to a new `packages/backend/src/agent/memory.ts` module.

---

## Sprint 9: Testing

> First testing sprint. Sets up Vitest, then covers the highest-value backend logic.
> Principle: never mock the core logic under test. Integration tests use real SQLite. Unit tests cover pure functions.
> Agent SDK calls are the one thing we stub — everything else is real.

### Test Infrastructure

- [ ] **Q.1** — Set up Vitest in the monorepo. Install `vitest` as a root devDependency. Create `vitest.config.ts` at root (or per-package configs if needed) with TypeScript support, path aliases matching tsconfig. Add `"test"` script to root `package.json` (`vitest run`) and `"test:watch"` (`vitest`). Add `"test"` scripts to `packages/backend/package.json` and `packages/shared/package.json`. Verify `pnpm test` runs and finds zero tests.

- [ ] **Q.2** — Create test database helper. In `packages/backend/src/test/setup.ts`: helper that creates a fresh in-memory SQLite database (`:memory:`), runs Drizzle migrations, and optionally seeds with fixture data. Export `createTestDb()` that returns `{ db, cleanup }`. Export `seedTestDb(db)` that inserts a minimal but realistic dataset (1 project, 5 personas, persona assignments, 3 top-level work items with children, comments, executions). Each test file gets its own database — no shared state between tests.

### Shared Package Tests (Pure Logic)

- [ ] **Q.3** — Test workflow state machine. In `packages/shared/src/__tests__/workflow.test.ts`: test `getValidTransitions()` for every state (verify exact transition sets), test `isValidTransition()` for valid and invalid pairs, test `getStateByName()` for existing and non-existing states, verify initial state is Backlog, verify Done is a final state, verify Blocked can transition back, verify no state can transition to Backlog (except as defined).

### Backend API Integration Tests

- [ ] **Q.4** — Test work items CRUD routes. In `packages/backend/src/routes/__tests__/work-items.test.ts`: spin up Fastify with test DB via `app.inject()`. Test: create top-level item, create child item with parentId, get item by id, list items with `?parentId=` filter, list items with `?projectId=` filter, update item fields (title, description, priority), update `currentState` (valid transition), reject invalid state transition, delete item. Verify response shapes and status codes.

- [ ] **Q.5** — Test persona and persona-assignment routes. In `packages/backend/src/routes/__tests__/personas.test.ts`: test persona CRUD (create, get, list, update, delete). In `packages/backend/src/routes/__tests__/persona-assignments.test.ts`: test upsert assignment, get assignments by project, verify assignment links valid persona to valid state.

- [ ] **Q.6** — Test comments, executions, and proposals routes. In `packages/backend/src/routes/__tests__/comments.test.ts`: test create comment with different authorTypes (agent, user, system), list comments filtered by workItemId. In `packages/backend/src/routes/__tests__/executions.test.ts`: test create execution, update status/outcome, list by workItemId. In `packages/backend/src/routes/__tests__/proposals.test.ts`: test create proposal, update status (approve/reject), list by workItemId.

- [ ] **Q.7** — Test work-item-edges routes. In `packages/backend/src/routes/__tests__/work-item-edges.test.ts`: test create edge (depends_on, blocks, related_to), list edges for a work item, delete edge. Test cycle detection — creating A→B→C→A should fail.

- [ ] **Q.8** — Test dashboard aggregate routes. In `packages/backend/src/routes/__tests__/dashboard.test.ts`: test stats endpoint returns correct counts (active agents, pending proposals, blocked items, today's cost). Test with empty DB (all zeros). Test with seeded data (verify aggregation logic).

### Agent Logic Unit Tests

- [ ] **Q.9** — Test concurrency limiter. In `packages/backend/src/agent/__tests__/concurrency.test.ts`: test `canSpawn()` returns true when under limit, false when at limit. Test `enqueue()` adds to queue, `onComplete()` dequeues by priority (P0 before P3). Test queue ordering is FIFO within same priority. Test `getActiveCount()` and `getQueueLength()`. No DB needed — this is in-memory logic.

- [ ] **Q.10** — Test parent-child coordination. In `packages/backend/src/agent/__tests__/coordination.test.ts`: use test DB with a parent + 3 children. Test: when all children are Done, parent advances to "In Review". Test: when 2/3 children are Done, parent does NOT advance. Test: when a child enters Blocked, system comment is posted on parent. Test: manual parent state override is not blocked by children state.

- [ ] **Q.11** — Test dispatch logic. In `packages/backend/src/agent/__tests__/dispatch.test.ts`: use test DB with persona assignments. Test: `dispatchForState()` spawns executor when persona is assigned. Test: no-op when no persona assigned (Backlog, Done). Test: respects concurrency limit (enqueues instead of spawning). Stub the actual executor spawn — we're testing dispatch decisions, not agent execution.

- [ ] **Q.12** — Test MCP tool implementations. In `packages/backend/src/agent/__tests__/mcp-tools.test.ts`: use test DB. Test `post_comment` inserts a comment and returns success. Test `create_children` creates child work items with correct parentId and edges. Test `route_to_state` validates transition and updates state. Test `route_to_state` rejects invalid transition. Test `flag_blocked` sets state to Blocked. Test `list_items` returns filtered results. Test `get_context` returns work item with execution history.

- [ ] **Q.13** — Test execution manager lifecycle. In `packages/backend/src/agent/__tests__/execution-manager.test.ts`: use test DB, stub ClaudeExecutor. Test: `runExecution()` creates DB record with status "running". Test: on executor success, record updated to "completed" with cost/duration. Test: on executor failure, record updated to "failed". Test: transition rate limiting — more than 10 transitions per item per hour is blocked. Test: rejection increments retry counter, max retries triggers Blocked state.
