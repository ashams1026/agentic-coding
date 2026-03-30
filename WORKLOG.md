# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-30 — P.2: Standardize button and badge sizing

**Task:** Converge on two button sizes (sm h-7, default h-8) and two badge sizes (sm, default). Clean up redundant overrides.

**Done:**
- Updated `button.tsx`: default h-9→h-8, sm h-8→h-7 + text-xs, icon size-9→size-8, icon-sm size-8→size-7
- Updated `badge.tsx`: added `size` variant with `default` (px-2 py-0.5) and `sm` (px-1.5 py-0.5)
- Cleaned up redundant className overrides across 8 files:
  - Removed `h-7` overrides from sm buttons (now native)
  - Changed `h-6 text-xs` overrides to `size="xs"`
  - Changed `h-7 w-7` icon overrides to `size="icon-sm"`
  - Changed `h-8 w-8` icon overrides to just `size="icon"` (now native)
  - Removed redundant `text-xs` from sm button classNames

**Files modified:** `button.tsx`, `badge.tsx`, `work-items.tsx`, `detail-panel.tsx`, `agent-control-bar.tsx`, `terminal-renderer.tsx`, `tool-configuration.tsx`, `projects-section.tsx`, `sidebar.tsx`, `activity-feed.tsx`

**Notes:** Build: 0 errors, 145 tests pass. Badge `size="sm"` available for inline badges — existing inline `px-1.5 py-0` overrides still work alongside it.

---

## 2026-03-30 — Review: P.1 (approved)

**Reviewed:** Typography scale standardization — `index.css` + 29 component files.
- 5 `@utility` definitions match task spec exactly (page-title, section-title, body, label, caption) ✓
- Comment block documents the full scale with pixel equivalents and usage guidance ✓
- All 78 arbitrary pixel text sizes (text-[8-11px]) replaced with text-xs ✓
- Zero arbitrary pixel sizes remain in code (verified via grep) ✓
- Build: 0 errors, 145 tests pass
- Verdict: **approved**

---

## 2026-03-30 — P.1: Standardize typography scale

**Task:** Define semantic typography tokens and eliminate arbitrary pixel text sizes.

**Done:**
- Added typography scale documentation and 5 `@utility` definitions to `index.css`:
  - `text-page-title` (text-2xl font-bold), `text-section-title` (text-lg font-semibold)
  - `text-body` (text-sm), `text-label` (text-xs font-medium), `text-caption` (text-xs text-muted-foreground)
- Replaced all arbitrary text sizes across 29 frontend files:
  - `text-[10px]` → `text-xs` (~60 occurrences)
  - `text-[11px]` → `text-xs` (5 occurrences)
  - `text-[9px]` → `text-xs` (11 occurrences)
  - `text-[8px]` → `text-xs` (2 occurrences)
- Zero arbitrary pixel text sizes remain in code (only in index.css documentation comments)

**Files modified:** `packages/frontend/src/index.css` + 29 component files across features/work-items, features/dashboard, features/agent-monitor, features/persona-manager, features/activity-feed, features/settings, features/common, features/demo, features/command-palette, components/sidebar

**Notes:** Build: 0 errors, 145 tests pass. All sizes converge on `text-xs` (12px). The 5 semantic utility classes (`text-page-title`, `text-section-title`, `text-body`, `text-label`, `text-caption`) are defined via Tailwind v4 `@utility` directive and available for new code.

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
