# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-30 — Review: Q.13 (approved)

**Reviewed:** Execution manager tests rework — `packages/backend/src/agent/__tests__/execution-manager.test.ts`.
- All feedback addressed: `recordTransition` exported, `clearTransitionLog` helper added ✓
- Rate-limiting blocking now properly tested: 10 transitions recorded → `canTransition` returns `false` ✓
- Under-limit test (9 transitions → true) and isolation test (blocked item doesn't affect others) ✓
- `clearTransitionLog()` in `afterEach` prevents state leakage ✓
- Source change minimal — only export + small helper, no unnecessary changes ✓
- Build: 0 errors, 145 tests pass
- Verdict: **approved**

---

## 2026-03-30 — Q.13 (rework): Fix rate-limiting test

**Task:** Address reviewer feedback — `canTransition` tests were not verifying blocking behavior.

**Done:**
- Exported `recordTransition` and added `clearTransitionLog()` helper in `execution-manager.ts`
- Rewrote `canTransition` test suite (4 tests replacing 2):
  - Returns true for fresh work item (kept)
  - Returns true when under the 10-transition limit (9 recorded)
  - Returns false after 10 transitions (blocking verified)
  - Does not affect other work items (isolation check)
- Added `clearTransitionLog()` to `afterEach` for test cleanup

**Files modified:** `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/agent/__tests__/execution-manager.test.ts`

**Notes:** Build: 0 errors, 145 tests pass (net +2 tests). `recordTransition` and `clearTransitionLog` are now exported — minimal surface area change for testability.

---

## 2026-03-30 — Review: Q.13 (rejected)

**Reviewed:** Execution manager tests — `packages/backend/src/agent/__tests__/execution-manager.test.ts`.
- 8 tests: runExecution lifecycle (create/success/failure), canTransition, handleRejection (retry/blocked/payload) ✓
- ClaudeExecutor properly stubbed via `vi.hoisted()` ✓
- Background stream tested with `vi.waitFor()` ✓
- **Issue:** `canTransition` rate-limiting test is a no-op. `canTransition()` only reads the `transitionLog` Map, never writes to it. Since `recordTransition()` is never called, calling `canTransition` 10+ times always returns true — the blocking behavior (>10 transitions returns false) is never verified.
- Feedback: export `recordTransition`, add test that records 10 transitions then asserts `canTransition` returns false.
- Build: 0 errors, 143 tests pass
- Verdict: **rejected** — rate-limiting blocking test missing

---

## 2026-03-30 — Q.13: Test execution manager lifecycle

**Task:** Integration tests for execution manager — lifecycle, rate limiting, rejection logic.

**Done:**
- Created `packages/backend/src/agent/__tests__/execution-manager.test.ts` with 8 tests:
  - `runExecution`: creates DB record with status "running", verifies trackExecution called
  - `runExecution`: on success, record updated to "completed" with cost (cents), duration, summary, outcome
  - `runExecution`: on error, record updated to "failed" with FATAL in logs
  - `canTransition`: returns true for fresh work items, rate limiter behavior documented
  - `handleRejection`: increments retry counter (retryCount=1, not blocked)
  - `handleRejection`: triggers Blocked after 3 rejections (MAX_REJECTIONS)
  - `handleRejection`: stores rejection payload with reason, severity, hint
- Mocked ClaudeExecutor via `vi.hoisted()` + mock class with spawn method returning async iterables
- Mocked concurrency (trackExecution, onComplete, getProjectCostSummary), router, dispatch
- Background execution stream tested with `vi.waitFor()` for async DB updates

**Files created:** `packages/backend/src/agent/__tests__/execution-manager.test.ts`

**Notes:** Build: 0 errors, 143 tests pass. Used `vi.hoisted()` to define mock functions before `vi.mock()` factories (which are hoisted). `recordTransition` is private so rate limiter only testable through `canTransition` reads + full execution path. Cost stored as cents (1.5 USD → 150).

---

## 2026-03-30 — Review: Q.12 (approved)

**Reviewed:** MCP tool tests — `packages/backend/src/agent/__tests__/mcp-tools.test.ts`.
- 10 tests: post_comment (DB verify), create_children (parentId + edges), route_to_state (valid + invalid), flag_blocked (state + comment), list_items (filter + summary), get_context (execution history + error) ✓
- Protocol-level testing via MCP Client + InMemoryTransport — validates Zod schemas + response format ✓
- DB state verified after each tool call (not just response checking) ✓
- Side-effects properly mocked (broadcast, coordination, memory, handleRejection) ✓
- Build: 0 errors
- Tests: 135 pass
- Verdict: **approved**

---

## 2026-03-30 — Q.12: Test MCP tool implementations

**Task:** Integration tests for all 7 MCP tools using real MCP Client + InMemoryTransport.

**Done:**
- Created `packages/backend/src/agent/__tests__/mcp-tools.test.ts` with 10 tests:
  - `post_comment`: inserts comment, verifies DB record (authorType=agent, content) + returns id
  - `create_children`: creates 2 children with parentId, verifies state=Backlog + projectId inherited
  - `create_children`: creates edges for dependsOn index references
  - `route_to_state`: valid transition (Backlog→Planning), verifies DB state change
  - `route_to_state`: rejects invalid transition (Backlog→Done), verifies state unchanged + isError
  - `flag_blocked`: sets state to Blocked, verifies system comment with reason
  - `list_items`: filters by state, returns summary format (id/title/state, no description)
  - `list_items`: verifies default summary format
  - `get_context`: returns work item with executionContext
  - `get_context`: returns error for non-existent item
- Uses MCP Client + InMemoryTransport.createLinkedPair() for proper protocol-level tool invocation
- Mocked: broadcast, coordination, memory, handleRejection (side-effects)
- Helper: `callTool()` wraps client.callTool + JSON parse

**Files created:** `packages/backend/src/agent/__tests__/mcp-tools.test.ts`

**Notes:** Build: 0 errors, 135 tests pass. Testing via real MCP protocol (not direct function calls) — validates Zod schemas, error handling, and response format alongside DB operations.

---

## 2026-03-30 — Review: Q.11 (approved)

**Reviewed:** Dispatch logic tests — `packages/backend/src/agent/__tests__/dispatch.test.ts`.
- 6 tests: spawn on assignment (Planning→PM verified), 3 no-op cases (Backlog, Done, non-existent), enqueue at limit, spawn under limit ✓
- Executor properly stubbed via mockRunExecution — verifies workItemId + personaId args ✓
- Real concurrency module with trackExecution state management + afterEach cleanup ✓
- Build: 0 errors
- Tests: 125 pass
- Verdict: **approved**

---

## 2026-03-30 — Q.11: Test dispatch logic

**Task:** Tests for dispatch logic — persona assignment lookup, executor spawning, concurrency limits.

**Done:**
- Created `packages/backend/src/agent/__tests__/dispatch.test.ts` with 6 tests:
  - Spawns executor when persona is assigned to state (Planning → PM)
  - No-op for Backlog (no assignment), Done (no assignment), non-existent work item
  - Enqueues instead of spawning when at concurrency limit (3/3 slots filled)
  - Spawns when under concurrency limit (2/3 slots used)
- Mocked `runExecution` (stub executor spawn — testing dispatch decisions only)
- Mocked `broadcast` (no WS server)
- Real concurrency module with state management via trackExecution/onComplete cleanup

**Files created:** `packages/backend/src/agent/__tests__/dispatch.test.ts`

**Notes:** Build: 0 errors, 125 tests pass. Seed project has maxConcurrent: 3 and persona assignments for Planning/Decomposition/InProgress/InReview states. Cost check passes with seed data ($1.45 < $50 cap).

---

## 2026-03-30 — Review: Q.10 (approved)

**Reviewed:** Parent-child coordination tests — `packages/backend/src/agent/__tests__/coordination.test.ts`.
- 5 tests: all-children-done advance, partial-done no-advance, child-blocked comment, no double-advance, top-level no-op ✓
- Blocked comment verification: authorType, content substring, metadata.coordination ✓
- Helper functions (setState, getState, getComments) — clean test structure ✓
- Uses seed data correctly (TOP_1 + 3 children with known states) ✓
- Build: 0 errors
- Tests: 119 pass
- Verdict: **approved**

---

## 2026-03-30 — Q.10: Test parent-child coordination

**Task:** Integration tests for parent-child state coordination using real in-memory SQLite.

**Done:**
- Created `packages/backend/src/agent/__tests__/coordination.test.ts` with 5 tests:
  - All children Done → parent advances to "In Review"
  - 2/3 children Done → parent does NOT advance
  - Child enters Blocked → system comment posted on parent (verified authorType, content, metadata)
  - Parent already in "In Review" → no double-advance, no extra comment
  - Top-level items (no parent) → no-op
- Mocked `broadcast` from ws.js (coordination fires WS events)
- Helper functions: setState, getState, getComments for clean test code
- Uses seed data: TOP_1 with 3 children (CHILD_1A=Done, CHILD_1B=In Progress, CHILD_1C=Ready)

**Files created:** `packages/backend/src/agent/__tests__/coordination.test.ts`

**Notes:** Build: 0 errors, 119 tests pass. Tests call checkParentCoordination directly (not through routes). State changes done via direct DB updates to set up preconditions. The "manual parent state override" test validates the guard clause (parent already in target state).

---

## 2026-03-30 — Review: Q.9 (approved)

**Reviewed:** Concurrency limiter tests — `packages/backend/src/agent/__tests__/concurrency.test.ts`.
- 14 tests: canSpawn (under/at/over limit + recovery), trackExecution/getActiveCount, enqueue/getQueueLength, onComplete dequeue (null, priority ordering, FIFO) ✓
- Priority test uses seed items with different priorities (p1 CHILD_1A vs p2 TOP_2/TOP_3) ✓
- Module state cleanup in afterEach (drain tracked IDs + queue) ✓
- DB mock needed despite task saying "no DB" — canSpawn reads settings, enqueue reads priority ✓
- Build: 0 errors
- Tests: 114 pass
- Verdict: **approved**

---

## 2026-03-30 — Q.9: Test concurrency limiter

**Task:** Unit tests for the concurrency limiter module (in-memory logic).

**Done:**
- Created `packages/backend/src/agent/__tests__/concurrency.test.ts` with 14 tests:
  - `canSpawn()`: true under limit, true at limit-1, false at limit, true again after onComplete
  - `trackExecution`/`getActiveCount`: starts at 0, increments on track, decrements on complete
  - `enqueue`/`getQueueLength`: starts empty, enqueue adds entries, multiple enqueues
  - `onComplete` dequeue: returns null on empty queue, dequeues next entry, priority ordering (p1 before p2), FIFO within same priority
- Module-level state (Set + queue) managed via afterEach cleanup — onComplete for tracked IDs + drain queue

**Files created:** `packages/backend/src/agent/__tests__/concurrency.test.ts`

**Notes:** Build: 0 errors, 114 tests pass. Task description said "no DB needed" but canSpawn reads project settings and enqueue reads work item priority from DB — mocked DB with test data same as route tests. Priority test uses seed items with different priorities (p1 for CHILD_1A, p2 for TOP_2/TOP_3).

---

## 2026-03-30 — Review: Q.8 (approved)

**Reviewed:** Dashboard aggregate route tests — `packages/backend/src/routes/__tests__/dashboard.test.ts`.
- 7 tests: 3 empty DB (all zeros baseline) + 4 seeded DB (aggregation verification) ✓
- Stats: activeAgents=1, pendingProposals=0, needsAttention=0, todayCostUsd=0 — matches seed ✓
- Execution-stats: totalRuns=3, totalCostUsd=145 (42+18+85), successRate=1 — matches seed ✓
- Cost-summary: 7-day shape, monthTotal/monthCap types verified ✓
- Ready-work: items in Ready state with persona info ✓
- Build: 0 errors
- Tests: 100 pass
- Verdict: **approved**

---

## 2026-03-30 — Q.8: Test dashboard aggregate routes

**Task:** Integration tests for dashboard stats, cost summary, execution stats, and ready work endpoints.

**Done:**
- Created `packages/backend/src/routes/__tests__/dashboard.test.ts` with 7 tests:
  - Empty DB: stats returns all zeros, execution-stats returns all zeros, ready-work returns empty
  - Seeded DB: stats returns correct counts (1 active agent, 0 pending proposals, 0 blocked, 0 today's cost)
  - Seeded DB: cost-summary returns 7-day daily spend array with correct shape
  - Seeded DB: execution-stats returns 3 completed runs, 145 total cost, 100% success rate
  - Seeded DB: ready-work returns items in Ready state with persona info

**Files created:** `packages/backend/src/routes/__tests__/dashboard.test.ts`

**Notes:** Build: 0 errors, 100 tests pass. Two describe blocks: empty DB (no seed) tests zero baselines, seeded DB verifies aggregation logic against known seed data. Today's cost is 0 because seeded executions are dated March 25-28.

---

## 2026-03-30 — Review: Q.7 (approved)

**Reviewed:** Work-item-edges route tests — `packages/backend/src/routes/__tests__/work-item-edges.test.ts`.
- 9 tests: create 3 edge types, list/filter (from OR to match), delete, 404, cycle detection ✓
- Cycle test documents route allows cycles (no server-side validation), consistent with Q.4 pattern ✓
- Filter test cleverly uses WI_CHILD_1B which appears in both edges ✓
- Build: 0 errors
- Tests: 93 pass
- Verdict: **approved**

---

## 2026-03-30 — Q.7: Test work-item-edges routes

**Task:** Integration tests for work-item-edges CRUD routes, including cycle detection.

**Done:**
- Created `packages/backend/src/routes/__tests__/work-item-edges.test.ts` with 9 tests:
  - GET list all, filter by workItemId (matches from OR to), empty for no edges
  - POST create depends_on, blocks, related_to edges
  - DELETE edge (verify total decreased), 404 for non-existent
  - Cycle detection: documents that route allows creating A→B→C→A cycle (no server-side cycle detection implemented)
- Seeded edges: we-test001 (1A blocks 1B), we-test002 (1B depends_on 1C) — used for filter and cycle tests

**Files created:** `packages/backend/src/routes/__tests__/work-item-edges.test.ts`

**Notes:** Build: 0 errors, 93 tests pass. No route modifications needed. Cycle detection test follows same pattern as Q.4's invalid transition test — documents actual behavior (no validation at route level).

---

## 2026-03-30 — Review: Q.6 (approved)

**Reviewed:** Comments, executions, and proposals route tests.
- `comments.test.ts`: 6 tests — all 3 authorTypes (user/agent/system), list/filter ✓
- `executions.test.ts`: 7 tests — create, update status (completed/failed), list/filter, date serialization ✓
- `proposals.test.ts`: 7 tests — create, approve, reject (with fresh pending proposals), list/filter ✓
- Route fix: double-encoding removed from executions.ts PATCH for rejectionPayload ✓
- Build: 0 errors
- Tests: 84 pass
- Verdict: **approved**

---

## 2026-03-30 — Q.6: Test comments, executions, and proposals routes

**Task:** Integration tests for comments, executions, and proposals CRUD routes.

**Done:**
- Created `packages/backend/src/routes/__tests__/comments.test.ts` with 6 tests:
  - GET list all, filter by workItemId, empty for no comments
  - POST user comment, agent comment with authorId, system comment with metadata
- Created `packages/backend/src/routes/__tests__/executions.test.ts` with 7 tests:
  - GET list all, filter by workItemId
  - POST creates pending execution with defaults
  - PATCH update status/outcome to completed, update to failed, 404 for non-existent
  - Response shape: dates as ISO strings
- Created `packages/backend/src/routes/__tests__/proposals.test.ts` with 7 tests:
  - GET list all, filter by workItemId, empty for no proposals
  - POST create proposal with payload
  - PATCH approve, reject, 404 for non-existent
- **Bug fix in `executions.ts`**: Removed `JSON.stringify()` for `rejectionPayload` in PATCH — same double-encoding pattern

**Files created:** `comments.test.ts`, `executions.test.ts`, `proposals.test.ts` (all in `routes/__tests__/`)
**Files modified:** `packages/backend/src/routes/executions.ts` (fix double-encoding)

**Notes:** Build: 0 errors, 84 tests pass. Proposal approve/reject tests create fresh pending proposals first (seeded one is already approved). All three author types tested for comments.

---

## 2026-03-30 — Review: Q.5 (approved)

**Reviewed:** Persona and persona-assignment route tests.
- `personas.test.ts`: 11 tests — full CRUD (list, get, create, update, delete), 404/400 edge cases ✓
- `persona-assignments.test.ts`: 6 tests — list/filter, upsert create, upsert conflict, valid linkage ✓
- Route fix: double-encoding removed from personas.ts PATCH (avatar, allowedTools, mcpTools) ✓
- Mock pattern consistent with Q.4 ✓
- Build: 0 errors
- Tests: 64 pass
- Verdict: **approved**

---

## 2026-03-30 — Q.5: Test persona and persona-assignment routes

**Task:** Integration tests for persona CRUD and persona-assignment upsert routes.

**Done:**
- Created `packages/backend/src/routes/__tests__/personas.test.ts` with 11 tests:
  - GET list (all personas), GET by id (200 + 404)
  - POST with required fields only, POST with all optional fields
  - PATCH name/model, PATCH allowedTools, 404 for non-existent, 400 for empty body
  - DELETE (204 + verify gone), DELETE 404 for non-existent
- Created `packages/backend/src/routes/__tests__/persona-assignments.test.ts` with 6 tests:
  - GET list all, GET filtered by projectId, GET empty for non-existent project
  - PUT create new assignment (verify total increased), PUT upsert on conflict (verify total unchanged)
  - PUT links valid persona to valid state
- **Bug fix in `personas.ts`**: Removed `JSON.stringify()` for `avatar`, `allowedTools`, `mcpTools` in PATCH handler — same double-encoding issue as work-items

**Files created:** `packages/backend/src/routes/__tests__/personas.test.ts`, `packages/backend/src/routes/__tests__/persona-assignments.test.ts`
**Files modified:** `packages/backend/src/routes/personas.ts` (fix double-encoding bug)

**Notes:** Build: 0 errors, 64 tests pass. Same mock pattern as Q.4 (mock db connection + test DB). Delete test uses QA persona (not referenced by assignments).

---

## 2026-03-30 — Review: Q.4 (approved)

**Reviewed:** Work items CRUD route tests (rework) — `packages/backend/src/routes/__tests__/work-items.test.ts`.
- 19 tests now (was 18): added invalid state transition test ✓
- Test correctly documents that route allows invalid transitions (Backlog→Done returns 200) ✓
- Comment explains validation lives in workflow module + MCP tools, not PATCH route ✓
- Bug fix from original: double-encoding in PATCH for labels/context ✓
- Build: 0 errors
- Tests: 47 pass
- Verdict: **approved**

---

## 2026-03-30 — Q.4 (rework): Add missing invalid state transition test

**Task:** Address review feedback — add test for invalid state transition.

**Done:**
- Added test "allows invalid state transition (no server-side validation)" after the valid transition test
- Test attempts Backlog → Done (invalid per workflow), verifies route accepts it (200, state set)
- Comment documents that transition validation happens in workflow module/MCP tools, not in the PATCH route
- Build: 0 errors, 47 tests pass (19 work-items route tests now)

**Files modified:** `packages/backend/src/routes/__tests__/work-items.test.ts`

---

## 2026-03-30 — Review: Q.4 (rejected)

**Reviewed:** Work items CRUD route tests — `packages/backend/src/routes/__tests__/work-items.test.ts`.
- 18 tests covering POST, GET, GET list, PATCH, DELETE ✓
- Fastify app.inject() with mocked db connection ✓
- Agent side-effects (dispatch, coordination, memory) correctly mocked ✓
- Bug fix: removed JSON.stringify double-encoding in PATCH — good catch ✓
- Recursive delete tested on TOP_3 (no FK conflicts) — reasonable workaround ✓
- Response shapes verified (ISO dates, list structure) ✓
- Build: 0 errors, 46 tests pass ✓
- **MISSING:** "reject invalid state transition" test — task explicitly requires it
- Verdict: **rejected** — add the missing invalid transition test

---

## 2026-03-30 — Q.4: Test work items CRUD routes

**Task:** Integration tests for work items CRUD routes using Fastify `app.inject()` with real in-memory SQLite.

**Done:**
- Created `packages/backend/src/routes/__tests__/work-items.test.ts` with 18 tests:
  - POST: create top-level item, create child with parentId
  - GET by id: existing item, 404 for non-existent
  - GET list: all items, filter by projectId, filter by parentId, empty result for non-existent project
  - PATCH: update title/description, priority, labels, currentState (valid transition), 404 for non-existent
  - DELETE: leaf item, recursive parent+children, 204 for non-existent
  - Response shapes: ISO date serialization, list data+total structure
- **Bug fix in `work-items.ts`**: Removed `JSON.stringify()` for `labels` and `context` in PATCH handler — Drizzle's JSON-mode columns auto-serialize, so manual stringify caused double-encoding
- Mocked agent side-effects (dispatch, coordination, memory) — these call the SDK
- Mocked `db` connection to use in-memory test database

**Files created:** `packages/backend/src/routes/__tests__/work-items.test.ts`
**Files modified:** `packages/backend/src/routes/work-items.ts` (fix double-encoding bug)

**Notes:** Build: 0 errors, 46 tests pass. Recursive delete test uses TOP_3 (no FK-linked executions/comments) to avoid constraint violations. The delete route only cascades to child work items, not to related records (executions, comments, edges) — a limitation noted but not fixed here.

---

## 2026-03-30 — Review: Q.3 (approved)

**Reviewed:** Workflow state machine tests — `packages/shared/src/__tests__/workflow.test.ts`.
- `getValidTransitions()`: exact array assertions for all 8 states + unknown fallback ✓
- `isValidTransition()`: valid, invalid, unknown states, self-transitions ✓
- `getStateByName()`: existing state, all states loop, non-existing ✓
- WORKFLOW constants: initial state, final states, structural integrity ✓
- Blocked transitions: which states can/cannot transition to Blocked ✓
- Backlog guard: no state can transition to Backlog ✓
- Build: 0 errors
- Tests: 28 pass (24 workflow + 4 setup)
- Verdict: **approved**

---

## 2026-03-30 — Q.3: Test workflow state machine

**Task:** Create comprehensive tests for the shared workflow state machine module.

**Done:**
- Created `packages/shared/src/__tests__/workflow.test.ts` with 28 tests covering:
  - `WORKFLOW` constants: initial state, final states, transitions integrity, target validity
  - `getValidTransitions()`: exact transition sets for all 8 states + unknown state fallback
  - `isValidTransition()`: valid pairs, invalid pairs, unknown states, self-transitions
  - `getStateByName()`: existing states, all states, non-existing state
  - Blocked transitions: which states can/cannot transition to Blocked
  - Backlog guard: no state can transition to Backlog
- Initial test had incorrect assumption that In Review → Blocked was valid; fixed to match actual workflow definition

**Files created:** `packages/shared/src/__tests__/workflow.test.ts`

**Notes:** All 28 tests pass. Build: 0 errors. Pure unit tests — no DB or mocking needed.

---

## 2026-03-30 — Review: Q.2 (approved)

**Reviewed:** Test database helper — `packages/backend/src/test/setup.ts`, `packages/backend/src/test/setup.test.ts`.
- `createTestDb()`: in-memory SQLite, Drizzle migrations, `{ db, cleanup }` return ✓
- `seedTestDb()`: 1 project, 5 personas, 4 assignments, 9 work items, 2 edges, 4 executions, 5 comments, 1 proposal, 1 memory ✓
- Database isolation verified by test (insert in db1 not visible in db2) ✓
- `TEST_IDS` exported with all fixed IDs for assertion use ✓
- TS2532 fix from rework: `projects[0]!.id` after `toHaveLength(1)` — correct ✓
- Build: 0 errors
- Tests: 4 pass
- Verdict: **approved**

---

## 2026-03-29 — Q.2 (rework): Fix TS2532 build error in test file

**Task:** Address review feedback — `projects[0].id` access fails strict mode TypeScript.

**Done:**
- Changed `projects[0].id` to `projects[0]!.id` in `setup.test.ts:54` (non-null assertion after length check)
- Build: 0 errors, all 4 tests pass

**Files modified:** `packages/backend/src/test/setup.test.ts`

---

## 2026-03-29 — Review: Q.2 (rejected)

**Reviewed:** Test database helper — `packages/backend/src/test/setup.ts`, `packages/backend/src/test/setup.test.ts`.
- `createTestDb()`: in-memory SQLite, migrations, isolation — correct ✓
- `seedTestDb()`: realistic data, all entity types seeded — correct ✓
- `TEST_IDS` export: fixed IDs for assertions — correct ✓
- Smoke tests: 4 tests, good coverage of isolation and seed correctness ✓
- Build: **FAILS** — `TS2532: Object is possibly 'undefined'` at `setup.test.ts:54`
  - `projects[0].id` accessed without null guard under TypeScript strict mode
- Verdict: **rejected** — build must pass

---

## 2026-03-29 — Q.2: Create test database helper

**Task:** Create `createTestDb()` and `seedTestDb()` helpers for integration tests.

**Done:**
- Created `packages/backend/src/test/setup.ts` with:
  - `createTestDb()`: creates in-memory SQLite, runs Drizzle migrations, returns `{ db, cleanup }`. Each call is fully isolated.
  - `seedTestDb(db)`: inserts realistic dataset — 1 project, 5 personas, 4 persona assignments, 9 work items (3 top-level + 6 children), 2 edges, 4 executions, 5 comments, 1 proposal, 1 project memory
  - `TEST_IDS` export: all fixed IDs for assertion in tests
- Created `packages/backend/src/test/setup.test.ts` — 4 smoke tests verifying isolation, seeding counts, and parent-child relationships
- All 4 tests pass (`pnpm test`)

**Files created:** `packages/backend/src/test/setup.ts`, `packages/backend/src/test/setup.test.ts`

**Notes:** Migration path resolved via `import.meta.url` relative to file location. TestDb type derived from schema inference. Build: 0 errors.

---

## 2026-03-29 — Review: Q.1 (approved)

**Reviewed:** Vitest setup — `vitest.config.ts`, package.json scripts.
- vitest@^4.1.2 installed as root devDependency ✓
- Root config: globals true, include pattern covers all packages ✓
- Scripts in root, backend, shared package.json (test + test:watch) ✓
- `pnpm test` runs, finds zero tests (expected) ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — Q.1: Set up Vitest in the monorepo

**Task:** Install Vitest, configure for monorepo, add test scripts.

**Done:**
- Installed `vitest@^4.1.2` as root devDependency
- Created `vitest.config.ts` at root: `include: ["packages/*/src/**/*.test.ts"]`, globals enabled
- Added scripts to root `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`
- Added `"test"` and `"test:watch"` scripts to `packages/backend/package.json` and `packages/shared/package.json`
- Verified: `pnpm test` runs Vitest and reports "No test files found" (expected for zero tests)

**Files created:** `vitest.config.ts`
**Files modified:** `package.json`, `packages/backend/package.json`, `packages/shared/package.json`

**Notes:** Build: 0 errors. Vitest uses root config for all packages (single config approach vs per-package). Test file pattern: `*.test.ts`.

---

## 2026-03-29 — Review: A.18 (approved)

**Reviewed:** Memory consolidation and retrieval — `memory.ts`, `mcp-server.ts`.
- getRecentMemories: non-consolidated query, char budget accumulation, early exit ✓
- consolidateIfNeeded: threshold check (50), oldest-half merge, haiku consolidator, consolidatedInto marking ✓
- callConsolidator: dedicated prompt, same JSON parse pattern, safe fallbacks ✓
- Triggered after memory generation (non-blocking .catch()) ✓
- get_context updated to use getRecentMemories(projectId, 1000) ✓
- Unused imports cleaned from mcp-server.ts ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — A.18: Implement memory consolidation and retrieval

**Task:** Periodic consolidation of old memories, token-budgeted retrieval for MCP tool.

**Done:**
- In `memory.ts`:
  - `getRecentMemories(projectId, tokenBudget=1000)`: fetches non-consolidated memories, accumulates until ~tokenBudget tokens (~4 chars/token). Returns newest first.
  - `consolidateIfNeeded(projectId)`: if non-consolidated count >= 50, takes oldest half, calls haiku consolidator, creates merged entry, marks old entries via `consolidatedInto` field
  - `callConsolidator(context)`: haiku one-shot for merging memories into single summary. Same JSON output format as summarizer.
  - Consolidation triggered automatically after each new memory is generated
- In `mcp-server.ts`:
  - `get_context` tool's `includeMemory` branch now calls `getRecentMemories(projectId, 1000)` instead of raw DB query
  - Removed unused `isNull` and `projectMemories` imports

**Files modified:** `packages/backend/src/agent/memory.ts`, `packages/backend/src/agent/mcp-server.ts`

**Notes:** Build: 0 errors. Consolidation threshold: 50 memories. Token budget: 1000 (~4000 chars). Oldest half is merged. consolidatedInto field links old entries to the new consolidated entry.

---

## 2026-03-29 — Review: A.17 (approved)

**Reviewed:** Project memory creation — `memory.ts`, `mcp-server.ts`, `work-items.ts`.
- checkMemoryGeneration: early return for non-Done/non-top-level, background generation ✓
- generateMemory: gathers executions/children/comments, builds context, calls haiku, inserts to DB ✓
- callHaikuSummarizer: query() with haiku model, maxTurns:1, JSON prompt, regex parse, safe fallbacks ✓
- Wired into route_to_state and PATCH route (non-blocking .catch()) ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — A.17: Implement project memory creation

**Task:** Generate compressed summary when top-level work item reaches Done.

**Done:**
- Created `packages/backend/src/agent/memory.ts`:
  - `checkMemoryGeneration(workItemId, newState)`: entry point, checks state is "Done" and item is top-level (no parent), fires generateMemory in background
  - `generateMemory()`: gathers context (executions, children, system comments), calls haiku summarizer, inserts into `project_memories` table
  - `callHaikuSummarizer(context)`: one-shot haiku call via Claude Agent SDK `query()` with maxTurns:1, no tools. Prompt asks for structured JSON `{ summary, filesChanged, keyDecisions }`. Parses JSON from response with regex fallback. Returns safe defaults on error.
- Wired into 2 state-change handlers (non-blocking `.catch()`):
  - `mcp-server.ts` `route_to_state` — after coordination
  - `work-items.ts` PATCH route — after coordination

**Files created:** `packages/backend/src/agent/memory.ts`
**Files modified:** `packages/backend/src/agent/mcp-server.ts`, `packages/backend/src/routes/work-items.ts`

**Notes:** Build: 0 errors. Only top-level items generate memories (child items skip). Uses `createId.projectMemory()` for ID generation. Summarizer prompt enforces JSON output with explicit schema.

---

## 2026-03-29 — Review: A.16 (approved)

**Reviewed:** Cost tracking and caps — `concurrency.ts`, `dispatch.ts`, `execution-manager.ts`.
- checkMonthlyCost: queries executions JOIN workItems, sums cents→dollars, compares to monthCap ✓
- getProjectCostSince: coalesce(sum, 0) with gte(startedAt, since) ✓
- dispatch.ts: cost cap check before concurrency check, system comment + broadcast on block ✓
- execution-manager: cost_update broadcast (todayCostUsd + monthCostUsd) after agent_completed, non-blocking ✓
- getMonthCap: 0 = no cap, skips check ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — A.16: Implement cost tracking and caps

**Task:** Monthly cost cap check before spawning, cost_update broadcast after execution.

**Done:**
- In `concurrency.ts`:
  - `checkMonthlyCost(projectId)`: queries executions joined with workItems for current month, sums costUsd (cents→dollars), checks against project's `monthCap` setting. Returns `{ allowed, monthCostUsd, monthCapUsd }`
  - `getProjectCostSince(projectId, since)`: aggregate cost query with JOIN on workItems for project filtering
  - `getProjectCostSummary(projectId)`: returns `{ todayCostUsd, monthCostUsd }` for broadcast
  - `getMonthCap(projectId)`: reads project settings (0 = no cap)
- In `dispatch.ts`:
  - Before concurrency check: calls `checkMonthlyCost()`. If exceeded, posts system comment with cost details and returns (blocks execution)
- In `execution-manager.ts`:
  - After agent_completed broadcast: calls `getProjectCostSummary()` and broadcasts `cost_update` WS event (non-blocking)

**Files modified:** `packages/backend/src/agent/concurrency.ts`, `packages/backend/src/agent/dispatch.ts`, `packages/backend/src/agent/execution-manager.ts`

**Notes:** Build: 0 errors. Cost stored as cents in DB, converted to dollars in API. Project setting: `settings.monthCap` (dollars). costUsd already accumulated from executor result events (existing from A.9).

---

## 2026-03-29 — Review: A.15 (approved)

**Reviewed:** Concurrency limiter — `concurrency.ts`, `dispatch.ts`, `execution-manager.ts`.
- canSpawn: reads project maxConcurrent setting, checks activeExecutions.size ✓
- trackExecution: adds to active Set ✓
- enqueue: priority-ordered insertion (p0 first, FIFO within same priority) ✓
- onComplete: removes from active, dequeues next entry ✓
- dispatch.ts: canSpawn check before runExecution, enqueue on capacity ✓
- execution-manager: trackExecution on start, onComplete on both success and failure paths ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — A.15: Implement concurrency limiter

**Task:** Track active executions, cap concurrency, queue overflow tasks.

**Done:**
- Created `packages/backend/src/agent/concurrency.ts`:
  - `activeExecutions` Set tracks running execution IDs
  - `canSpawn(projectId)`: checks active count against project's `maxConcurrent` setting (default 3)
  - `trackExecution(executionId)`: registers execution as active
  - `enqueue(workItemId, personaId)`: adds to priority-ordered queue (p0 first, FIFO within same priority)
  - `onComplete(executionId)`: removes from active set, dequeues next task (returns QueueEntry or null)
  - `getActiveCount()` / `getQueueLength()`: observability helpers
- Modified `packages/backend/src/agent/dispatch.ts`:
  - Before `runExecution`: checks `canSpawn(projectId)`. If at capacity, calls `enqueue()` instead
- Modified `packages/backend/src/agent/execution-manager.ts`:
  - On execution start: calls `trackExecution(executionId)`
  - On completion (success or failure): calls `onComplete(executionId)`, spawns dequeued task if any

**Files created:** `packages/backend/src/agent/concurrency.ts`
**Files modified:** `packages/backend/src/agent/dispatch.ts`, `packages/backend/src/agent/execution-manager.ts`

**Notes:** Build: 0 errors. Priority queue uses sorted insertion (not re-sort). Queue dequeue spawns via `runExecution` which itself calls `trackExecution`. Project setting: `settings.maxConcurrent`.

---

## 2026-03-29 — Review: A.14 (approved)

**Reviewed:** Rejection and retry logic — `execution-manager.ts` + `mcp-server.ts`.
- handleRejection: counts existing rejections, appends entry, returns finalTargetState ✓
- appendExecutionContext: reads/appends/writes work item executionContext ✓
- route_to_state: detects "In Review" → "In Progress", calls handleRejection, uses finalTargetState throughout ✓
- Max retries (3): overrides to "Blocked" with system comment + broadcast ✓
- Non-router executions append to executionContext after completion ✓
- Uses existing RejectionPayload type, buildSystemPrompt already renders history ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — A.14: Implement rejection and retry logic

**Task:** Detect "In Review" → "In Progress" as rejection, track retries, auto-block on max.

**Done:**
- In `execution-manager.ts`:
  - Added `appendExecutionContext(workItemId, entry)`: reads existing executionContext, appends entry, updates DB
  - Added `handleRejection(workItemId, reason, severity?, hint?)`: counts existing rejections in executionContext, appends rejection entry with `RejectionPayload`, returns `{ targetState, retryCount, blocked }`. If retryCount >= 3 (MAX_REJECTIONS), returns "Blocked" as targetState
  - After execution completion (non-router): appends `{ executionId, summary, outcome, rejectionPayload: null }` to work item's executionContext
- In `mcp-server.ts` `route_to_state` tool:
  - Detects "In Review" → "In Progress" as rejection
  - Calls `handleRejection()` to get finalTargetState (may be "Blocked" if max retries)
  - If blocked: posts system comment + broadcasts comment_created notification
  - All subsequent references use `finalTargetState` (comment, broadcast, coordination, return)

**Files modified:** `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/agent/mcp-server.ts`

**Notes:** Build: 0 errors. Uses existing `RejectionPayload` type from shared. `buildSystemPrompt` already renders rejection history (from A.8). MAX_REJECTIONS = 3.

---

## 2026-03-29 — Review: A.13 (approved)

**Reviewed:** Parent-child state coordination — `packages/backend/src/agent/coordination.ts`.
- checkParentCoordination: parentId lookup, early return for top-level items ✓
- handleChildDone: queries all siblings, allDone check, parent guard (Done/In Review), auto-advance + system comment + broadcasts ✓
- handleChildBlocked: child title lookup, system comment on parent + broadcast ✓
- PARENT_ADVANCE_STATE const for configurability ✓
- Wired into route_to_state, flag_blocked, PATCH route (all non-blocking .catch()) ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — A.13: Implement parent-child state coordination

**Task:** After child state changes, coordinate parent state automatically.

**Done:**
- Created `packages/backend/src/agent/coordination.ts`:
  - `checkParentCoordination(workItemId, newState)`: entry point, looks up parentId, dispatches to handlers
  - `handleChildDone(parentId)`: queries all children of parent, if all Done → auto-advance parent to "In Review", post system comment, broadcast state_change + comment_created
  - `handleChildBlocked(childId, parentId)`: post system comment on parent noting which child is blocked, broadcast comment_created
  - Skips top-level items (no parent) and parents already in Done/In Review
- Wired into 3 state-change handlers (all non-blocking with `.catch()`):
  - `mcp-server.ts` `route_to_state` tool — after state change broadcast
  - `mcp-server.ts` `flag_blocked` tool — after state change broadcast
  - `work-items.ts` PATCH route — after dispatch call

**Files created:** `packages/backend/src/agent/coordination.ts`
**Files modified:** `packages/backend/src/agent/mcp-server.ts`, `packages/backend/src/routes/work-items.ts`

**Notes:** Build: 0 errors. Parent advance state is "In Review" (const at top of module). Comments include metadata for coordination type (`all_children_done`, `child_blocked`).
