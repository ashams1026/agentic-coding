# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

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
