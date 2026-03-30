# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-30 — S.2: Add graceful shutdown handling

**Task:** Handle SIGTERM/SIGINT with graceful shutdown (drain executions, close WS/DB), add enhanced `/api/health` endpoint.

**Done:**
- **`start.ts`** — Added `gracefulShutdown()` function: closes server (stop accepting connections), closes all WS clients with 1001, waits for active executions to drain (30s timeout, 500ms poll interval), closes SQLite database, logs shutdown reason and duration. Double-shutdown guard via `shuttingDown` flag. Signal handlers registered after server build, before listen.
- **`ws.ts`** — Added `closeAllClients()` export: iterates all connected clients, calls `client.close(1001, "Server shutting down")`, clears the set.
- **`server.ts`** — Enhanced health endpoint at `/api/health` returning `{ status, uptime, activeExecutions, version }`. Kept legacy `/health` with same response for backwards compat. Imported `getActiveCount` from concurrency module.
- **`cli.ts`** — Removed SIGINT/SIGTERM handlers from `startCommand` (start.ts handles signals now for graceful shutdown). CLI keeps only `process.on("exit")` for PID cleanup. Updated status command to hit `/api/health`.

**Files modified:** `packages/backend/src/start.ts`, `packages/backend/src/ws.ts`, `packages/backend/src/server.ts`, `packages/backend/src/cli.ts`

**Notes:** Build: 0 errors. Tests: 156/156. The `waitForExecutions()` helper polls `getActiveCount()` every 500ms until 0 or 30s timeout. On timeout, logs a warning and continues shutdown (force-kill). Version is hardcoded as "0.0.1" — can be made dynamic later.

---

## 2026-03-30 — Review: S.1 (approved)

**Reviewed:** CLI entry point — `cli.ts`, `start.ts`, `index.ts`, `package.json`.
- All 4 commands implemented: start (PID + startServer), stop (SIGTERM), status (PID + health/dashboard fetch), dev (tsx watch) ✓
- `start.ts` cleanly extracted from `index.ts` — reusable `startServer(options)` with orphan cleanup ✓
- `index.ts` simplified to one-liner ✓
- PID file lifecycle correct: write on start, cleanup on exit/SIGINT/SIGTERM, stale detection ✓
- ESM-compatible path resolution via `import.meta.url` ✓
- `bin` entry and shebang present ✓
- Status command degrades gracefully when enhanced endpoints aren't available yet ✓
- Build: 0 errors, Tests: 156/156
- Verdict: **approved**

---

## 2026-03-30 — S.1: Create CLI entry point

**Task:** Create `packages/backend/src/cli.ts` with command parser, 4 commands (start, stop, status, dev), bin entry, shebang.

**Done:**
- **`start.ts`** — Extracted startup logic from `index.ts` into reusable `startServer(options)` export. Contains orphaned state cleanup, migrations, server build+listen. Both `index.ts` and `cli.ts` import from here.
- **`index.ts`** — Simplified to one-liner: `import { startServer } from "./start.js"; startServer();`
- **`cli.ts`** — CLI entry point with `#!/usr/bin/env node` shebang. Parses `process.argv[2]` via switch. Commands:
  - `start` — writes PID to `~/.agentops/agentops.pid`, registers SIGINT/SIGTERM cleanup, imports `startServer()`. Detects already-running instance.
  - `stop` — reads PID file, sends SIGTERM, removes PID file. Handles "not running" gracefully.
  - `status` — checks PID liveness, hits `/health` and `/api/dashboard/stats` for live metrics (uptime, active agents, cost). Degrades gracefully if endpoints aren't enhanced yet.
  - `dev` — spawns `npx tsx watch src/index.ts` with inherited stdio. Resolves paths from `import.meta.url`.
  - `--help` / no args — prints usage summary.
- **`package.json`** — Added `"bin": { "agentops": "./dist/cli.js" }`.

**Files created:** `packages/backend/src/start.ts`, `packages/backend/src/cli.ts`
**Files modified:** `packages/backend/src/index.ts`, `packages/backend/package.json`

**Notes:** Build: 0 errors. Tests: 156/156 passing. CLI verified manually (`--help`, `status`). The status command will show richer data once S.2 adds the enhanced `/api/health` endpoint.

---

## 2026-03-30 — Review: E.10 (approved)

**Reviewed:** Startup cleanup — `index.ts`, `concurrency.ts`, `startup-cleanup.test.ts`.
- `cleanupOrphanedState()` runs after migrations, before server start ✓
- Bulk update `running`→`failed` with completedAt/summary/outcome ✓
- `clearAll()` clears both activeExecutions Set and queue array ✓
- `clearTransitionLog()` reused from execution-manager ✓
- Work items intentionally NOT reset — correct design (avoid state ambiguity) ✓
- Logs only when cleanedUp > 0 ✓
- 3 tests: orphaned reset, clearAll, clearTransitionLog ✓
- Build: 0 errors, Tests: 156/156
- Verdict: **approved** — Sprint 11 complete!

---

## 2026-03-30 — E.10: Handle stale execution cleanup on server restart

**Task:** On server startup, reset orphaned `running` executions to `failed`, clear in-memory concurrency/transition state.

**Done:**
- **`cleanupOrphanedState()` in `index.ts`** — Runs after migrations, before server start. Queries all executions with `status: "running"`, updates them to `failed` with `summary: "Interrupted by server restart"` and `outcome: "failure"`. Clears in-memory concurrency tracker and transition rate-limiter. Logs cleanup count.
- **`clearAll()` in `concurrency.ts`** — New export that clears `activeExecutions` Set and `queue` array. Used by startup cleanup.
- **3 new tests** in `startup-cleanup.test.ts`:
  - Resets orphaned running execution (EXEC_3 from seed) to failed with correct summary
  - `clearAll()` resets concurrency tracker and queue
  - `clearTransitionLog()` resets rate limiter

**Files modified:** `packages/backend/src/index.ts`, `packages/backend/src/agent/concurrency.ts`, `packages/backend/src/__tests__/startup-cleanup.test.ts` (new)

**Notes:** Build: 0 errors. Tests: 156/156 passing (was 153). Work items are intentionally NOT reset — they stay in their current state and can be re-triggered by the user or auto-routing. This avoids state machine ambiguity about what state they "should" be in.

---

## 2026-03-30 — Review: E.9 (approved)

**Reviewed:** Execution error handling and retry button — `work-items.ts`, `work-items.test.ts`, `execution-timeline.tsx`, `client.ts`, `api.ts`, `index.ts`.
- Retry route: POST `/api/work-items/:id/retry` — lookup + 404 + fire-and-forget dispatch ✓
- `retryWorkItem()` wired through client → mock → unified index ✓
- Retry button: RotateCcw icon, `outcome === "failure"` guard, toast feedback ✓
- Existing error pipeline verified: DB update, WS broadcast, toast, no state advance ✓
- Tests: 2 new retry route tests (200, 404) ✓
- Build: 0 errors, Tests: 153/153
- Verdict: **approved**

---

## 2026-03-30 — E.9: Add execution error handling and UI feedback

**Task:** Verify error handling pipeline, add toast on failure, add retry button in detail panel.

**Verification (already working):**
1. Execution record updated to `failed` in DB — execution-manager.ts catch block sets `status: "failed"`, `outcome: "failure"`, error in summary/logs ✓
2. Failure broadcast via WS — catch block broadcasts `agent_completed` with `outcome: "failure"` ✓
3. Agent monitor shows error — terminal renderer streams all chunks including `FATAL:` error messages. Execution hook shows `status: "failed"` ✓
4. Work item does NOT advance state — routing chain only fires on `finalOutcome === "success"` ✓
5. Toast on failure — `use-toast-events.ts` already handles `agent_completed` with failure: shows error toast with "Agent failed" title and "View" action ✓

**New features added:**
- **`POST /api/work-items/:id/retry` route** — Re-dispatches the persona for the work item's current state. Returns 404 if work item doesn't exist. Fire-and-forget dispatch.
- **`retryWorkItem()` API client** — Added to real client, mock API, and unified API index.
- **Retry button in ExecutionTimeline** — Shows a "Retry" button (RotateCcw icon) below the badges row for failed executions. Calls `retryWorkItem()`, shows info/error toast on success/failure.
- **2 new tests** — retry dispatch for existing item (200), retry for non-existent (404).

**Files modified:** `packages/backend/src/routes/work-items.ts`, `packages/backend/src/routes/__tests__/work-items.test.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/mocks/api.ts`, `packages/frontend/src/api/index.ts`, `packages/frontend/src/features/common/execution-timeline.tsx`

**Notes:** Build: 0 errors. Tests: 153/153 passing (was 151). Most of E.9 was already working — the execution-manager and toast system were properly handling failures. The retry button was the main new UI feature.

---

## 2026-03-30 — Review: E.8 (approved)

**Reviewed:** Parent-child coordination dispatch fix — `coordination.ts`, `coordination.test.ts`.
- `dispatchForState(parentId, "In Review")` called after DB update + WS broadcast ✓
- Fire-and-forget with `.catch()` — consistent with dispatch pattern elsewhere ✓
- No circular dependency: coordination→dispatch→execution-manager chain verified ✓
- Test: dispatch called with correct args on all-children-Done ✓
- Test: dispatch NOT called on partial-done and already-in-target-state ✓
- Existing tests (blocked comment, top-level no-op) still pass ✓
- Build: 0 errors, Tests: 151/151
- Verdict: **approved**

---

## 2026-03-30 — E.8: Fix parent-child coordination in real flow

**Task:** Verify and fix parent-child coordination: auto-advance parent when all children Done, system comment on child Blocked, frontend reactive updates.

**Bug found and fixed:**

- **Bug: No dispatch after parent auto-advance** — When `coordination.ts` auto-advanced a parent to "In Review" (all children Done), it updated the DB and broadcast WS events but **never called `dispatchForState()`**. This meant no reviewer persona was dispatched to actually review the parent work item. Fixed by importing `dispatchForState` and calling it after the parent state update.

**Verification:**
1. All children Done → parent auto-advances to "In Review" ✓ (existing test)
2. Auto-advance now triggers `dispatchForState(parentId, "In Review")` → reviewer persona dispatched ✓ (new assertion)
3. Partial children Done → parent stays put, no dispatch ✓ (new assertion)
4. Parent already "In Review" → no redundant advance or dispatch ✓ (new assertion)
5. Child Blocked → system comment posted on parent ✓ (existing test)
6. Top-level items → no-op ✓ (existing test)
7. Frontend WS sync: `state_change` → invalidates `workItems`+`dashboardStats`, `comment_created` → invalidates `comments` ✓
8. No circular dependency: coordination→dispatch→execution-manager (dispatch doesn't import coordination) ✓

**Files modified:** `packages/backend/src/agent/coordination.ts`, `packages/backend/src/agent/__tests__/coordination.test.ts`

**Notes:** Build: 0 errors. Tests: 151/151 passing. The fix is small but critical — without it, the parent would sit in "In Review" with no persona ever running to review it.

---

## 2026-03-30 — Review: E.7 (approved)

**Reviewed:** Settings field name standardization and dispatch pipeline verification.
- `maxConcurrentAgents`→`maxConcurrent`, `monthlyCostCap`→`monthCap` in seed, dashboard, fixtures, mock API ✓
- No stale references to old field names remain ✓
- Critical bug: monthly cost cap was silently never enforced (returned 0 = no cap) ✓
- Pipeline trace: route → dispatch → cost cap → concurrency → execution → router chain verified ✓
- Auto-routing ON/OFF: router.ts `autoRouting === false` guard tested with 3 cases ✓
- 6 new tests (cost cap block/allow, routing on/off/default/nonexistent) ✓
- Coordination gap correctly scoped to E.8 ✓
- Build: 0 errors, Tests: 151/151
- Verdict: **approved**

---

## 2026-03-30 — E.7: Fix dispatch trigger on state change

**Task:** Verify and fix the full dispatch pipeline: routes → dispatch → execution-manager → router.

**Bugs found and fixed:**

- **Bug: Settings field name mismatch** — The seed (`seed.ts`) and frontend fixtures used `maxConcurrentAgents` and `monthlyCostCap`, but the runtime code (`concurrency.ts`) reads `maxConcurrent` and `monthCap`. This meant the monthly cost cap was **never enforced** (returned 0 = no cap). Concurrency limit coincidentally worked because both the fallback default and the seed value were 3.
- **Fixed in seed.ts**: `{ maxConcurrentAgents: 3, monthlyCostCap: 50 }` → `{ maxConcurrent: 3, monthCap: 50 }`
- **Fixed in dashboard.ts**: `settings.monthlyCostCap` → `settings.monthCap`
- **Fixed in frontend fixtures.ts**: Same field name fix + added `autoRouting: true`
- **Fixed in frontend mocks/api.ts**: `settings.monthlyCostCap` → `settings.monthCap`

**Verification (pipeline trace):**
1. PATCH `/api/work-items/:id` with `currentState` → validates transition → calls `dispatchForState()` ✓
2. `dispatchForState()` → looks up persona assignment → checks monthly cost cap → checks concurrency → calls `runExecution()` ✓
3. `runExecution()` → creates DB record → streams execution → on success calls `runRouter()` (for non-Router personas) ✓
4. `runRouter()` → checks `autoRouting === false` → if OFF, returns false (no routing) ✓
5. Router completes → `dispatchForState()` for new state → next persona fires ✓
6. Rate limiter (`canTransition`, 10/hr per item) prevents infinite loops ✓

**New tests added:**
- `dispatch.test.ts`: "blocks dispatch when monthly cost cap is exceeded" — sets monthCap to $0.01, verifies execution blocked and system comment posted
- `dispatch.test.ts`: "allows dispatch when cost is under monthly cap" — verifies normal dispatch works
- `router.test.ts`: "routes when autoRouting is true" — verifies router spawns
- `router.test.ts`: "skips routing when autoRouting is false" — verifies no execution
- `router.test.ts`: "routes by default when autoRouting is not set" — verifies default ON behavior
- `router.test.ts`: "returns false for non-existent work item"

**Files modified:** `packages/backend/src/db/seed.ts`, `packages/backend/src/routes/dashboard.ts`, `packages/frontend/src/mocks/fixtures.ts`, `packages/frontend/src/mocks/api.ts`, `packages/backend/src/agent/__tests__/dispatch.test.ts`, `packages/backend/src/agent/__tests__/router.test.ts` (new)

**Notes:** Build: 0 errors. Tests: 151/151 passing (was 145). The one gap not fixed here: `coordination.ts` auto-advances parent to "In Review" but doesn't call `dispatchForState()` — that's E.8's scope.

---

## 2026-03-30 — Review: E.6 (approved)

**Reviewed:** Pipeline walkthrough fixes — `work-items.ts`, `work-items.test.ts`.
- State transition validation: `isValidTransition()` check before DB update, 400 for invalid ✓
- `previousState` scoping: `let` declaration outside block, assigned inside, guarded in dispatch ✓
- WS broadcast: `state_change` event with correct fields, fires after DB update, before dispatch ✓
- Test updated: expects 400 + `INVALID_TRANSITION` for Backlog→Done ✓
- Walkthrough: 7 steps documented, 2 bugs found and fixed ✓
- Build: 0 errors, Tests: 145/145
- Verdict: **approved**

---

## 2026-03-30 — E.6: Manual pipeline walkthrough and fix

**Task:** Walk a work item through the full lifecycle via API, fix integration bugs found.

**Walkthrough results:**
1. **Seed runs**: 1 project, 5 personas, 16 items, 5 assignments — all data loads correctly via API
2. **Create work item**: `POST /api/work-items` → created in Backlog ✓
3. **Move to Planning**: `PATCH` with `currentState: "Planning"` → dispatch fires, PM persona execution created (status: completed/failure — expected, no Claude SDK configured) ✓
4. **Move Ready → In Progress**: Engineer persona dispatched correctly ✓
5. **Work item stays in state after failed execution**: Execution failure doesn't advance state ✓
6. **Dashboard stats**: Returns correct counts from seeded data ✓
7. **Persona assignments**: All 5 state→persona mappings return correctly ✓

**Bugs found and fixed:**
- **Bug #1: No state transition validation** — PATCH route accepted any `currentState` value (e.g., Backlog → Done). Fixed by adding `isValidTransition()` check before update. Returns 400 `INVALID_TRANSITION` for invalid transitions.
- **Bug #2: No `state_change` WS broadcast** — PATCH route didn't broadcast `state_change` events when state changed. Frontend WS sync (E.2) relies on this to invalidate queries. Fixed by adding `broadcast({ type: "state_change", ... })` after successful state update.
- **Test updated**: Changed `"allows invalid state transition"` test to `"rejects invalid state transition"` — now expects 400 with INVALID_TRANSITION code.

**Files modified:** `packages/backend/src/routes/work-items.ts`, `packages/backend/src/routes/__tests__/work-items.test.ts`

**Notes:** Build: 0 errors. Tests: 145/145 passing. The Claude executor fails without a real API key — expected. The dispatch pipeline (route → dispatch → concurrency check → execution record creation) works end-to-end.

---

## 2026-03-30 — Review: E.5 (approved)

**Reviewed:** Realistic pipeline seed — `seed.ts`, `router.ts`, `execution-manager.ts`.
- Project has `autoRouting: true` ✓
- 5 personas with detailed system prompts (PM, Tech Lead, Engineer, Code Reviewer, Router) ✓
- Persona assignments for 5 workflow states ✓
- Router persona matches `getOrCreateRouterPersona` fallback (color, icon, isSystem) ✓
- Router executions (EXEC_9, EXEC_10) show routing decisions ✓
- `__router__` → `"Router"` rename consistent across all files ✓
- Comment authorNames match new persona names ✓
- Build: 0 errors, Tests: 145/145
- Verdict: **approved**

---

## 2026-03-30 — E.5: Create development seed with realistic pipeline data

**Task:** Update seed.ts with autoRouting, 5 personas with real system prompts, persona assignments for all workflow states, and realistic pipeline data.

**Done:**
- **Project settings**: Added `autoRouting: true` to project settings
- **Replaced QA with Router persona**: New `ps-rt00001` persona named "Router" with proper system prompt matching the router agent's behavior. Removed QA persona.
- **Real system prompts**: All 5 personas (Product Manager, Tech Lead, Engineer, Code Reviewer, Router) now have detailed, multi-paragraph system prompts with responsibilities, guidelines, and available tools
- **Persona assignments for 5 states**: Planning→PM, Decomposition→Tech Lead, Ready→Router, In Progress→Engineer, In Review→Code Reviewer
- **Router executions seeded**: Added EXEC_9 (router routes auth task to Done) and EXEC_10 (router routes auth from Planning→Decomposition) to show routing in action
- **Router comments seeded**: Added cm-cmt0016 (reviewer comment) and cm-cmt0017 (router state transition comment)
- **Backend router name fix**: Changed `"__router__"` → `"Router"` in `router.ts` and `execution-manager.ts` so the seeded persona is recognized by the backend
- **Persona names updated**: "PM" → "Product Manager", "Reviewer" → "Code Reviewer" in seed comments

**Files modified:** `packages/backend/src/db/seed.ts`, `packages/backend/src/agent/router.ts`, `packages/backend/src/agent/execution-manager.ts`

**Notes:** Build: 0 errors. Tests: 145/145 passing. Seed now has: 1 project, 5 personas, 16 work items, 4 edges, 5 assignments, 10 executions, 17 comments, 2 proposals, 2 memories. Frontend mock fixtures (QA persona) left unchanged — they're independent mock-mode data.

---

## 2026-03-30 — Review: E.4 (approved)

**Reviewed:** Wire activity feed to real WebSocket events — `activity-feed.tsx`, `recent-activity.tsx`, `client.ts`, `mocks/api.ts`, `api/index.ts`, `query-keys.ts`, `use-comments.ts`, `hooks/index.ts`.
- `fixtures` import fully removed from both activity components ✓
- `getRecentComments()` added to real client, mock API, and unified index ✓
- `useRecentComments()` hook with `["comments", "recent"]` query key ✓
- Both components null-guard comments data and include in `useMemo` deps ✓
- Hardcoded mock events (router decision, cost alert) removed ✓
- Live WS events (`useLiveActivityEvents` + `wsEventToActivity`) unchanged ✓
- WS invalidation: `["comments"]` prefix covers `["comments", "recent"]` ✓
- Minor: stale comment "Build events from mock data" at line 191 — cosmetic only
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — E.4: Wire activity feed to real WebSocket events

**Task:** Replace mock data (`fixtures.comments`, hardcoded events) in activity feed and dashboard recent activity with real API calls. Keep live WS event streaming.

**Done:**
- **Added `getRecentComments()`** to both real API client (`/api/comments` without workItemId) and mock API (returns all `store.comments` sorted by date)
- **Wired through unified API index** (`api/index.ts`) with mock/real delegation
- **Added `recentComments` query key** to `query-keys.ts` — `["comments", "recent"]`, inherits invalidation from `["comments"]` prefix match
- **Added `useRecentComments()` hook** in `use-comments.ts`, exported from hooks index
- **Updated `activity-feed.tsx`**: replaced `fixtures.comments` with `useRecentComments()` data, removed hardcoded router decision and cost alert mock events, removed `fixtures` import
- **Updated `recent-activity.tsx`**: same fix — replaced `fixtures.comments` with `useRecentComments()`, removed `fixtures` import, wrapped in `useMemo` since it now depends on query data
- **Live WS events unchanged**: `useLiveActivityEvents()` and `wsEventToActivity()` already work correctly — they subscribe to all WS event types and prepend live events with `isLive: true` flag

**Files modified:** `api/client.ts`, `mocks/api.ts`, `api/index.ts`, `hooks/query-keys.ts`, `hooks/use-comments.ts`, `hooks/index.ts`, `features/activity-feed/activity-feed.tsx`, `features/dashboard/recent-activity.tsx`

**Notes:** Build: 0 errors. The `["comments"]` prefix in WS sync already invalidates both `["comments", { workItemId }]` and `["comments", "recent"]`, so live comment events refresh the activity feed automatically.

---

## 2026-03-30 — Review: E.3 (approved)

**Reviewed:** Wire agent monitor to real WebSocket streaming — `terminal-renderer.tsx`, `ws-client.ts`, `ws.ts`, `use-ws-sync.ts`.
- Terminal renderer already correctly subscribed to `agent_output_chunk` events and maps `event.chunk`/`event.chunkType` to `OutputChunk` — no changes needed ✓
- `onReconnect(callback)` method added to `RealWsClient` with `reconnectCallbacks` Set ✓
- Exposed through unified `ws.ts` module ✓
- `useWsQuerySync` registers reconnect handler invalidating `["executions"]`, `["workItems"]`, `["dashboardStats"]` ✓
- Cleanup returns both `unsub()` and `unsubReconnect()` ✓
- Minor note: `isReconnect` heuristic on line 52 of ws-client.ts is fragile (can false-positive on first connect) but practical impact is negligible
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — Review: E.2 (approved)

**Reviewed:** WS→Query cache invalidation — `use-ws-sync.ts`.
- `state_change` → `["workItems"]` + `["dashboardStats"]` (fixes stale `["stories"]`/`["tasks"]`) ✓
- `comment_created` → `["comments"]` ✓
- `agent_started`/`agent_completed`/`execution_update` → `["executions"]` + `["dashboardStats"]` ✓
- `proposal_created`/`proposal_updated` → `["proposals"]` + `["dashboardStats"]` ✓
- `cost_update` → `["dashboardStats"]` + `["costSummary"]` ✓
- All keys cross-checked against `query-keys.ts` — prefix matching covers all variants ✓
- 8 of 9 event types handled (`agent_output_chunk` correctly omitted — streaming, not cache) ✓
- Hook wired in RootLayout, cleanup via `return unsub` ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — E.3: Wire agent monitor to real WebSocket streaming

**Task:** Connect terminal renderer to real `agent_output_chunk` WS events. Handle reconnection with re-fetch of active executions.

**Done:**
- **Terminal renderer already wired**: `subscribe("agent_output_chunk", ...)` was already mapping `event.chunk` + `event.chunkType` to `OutputChunk` type. The `processChunks` function pairs `tool_call`/`tool_result` via `toolCallId`. No changes needed to terminal-renderer.tsx.
- **Backend event shape verified**: `execution-manager.ts` broadcasts `{ type, executionId, personaId, chunk, chunkType, timestamp }` — matches `AgentOutputChunkEvent` interface exactly.
- **Reconnection callback**: Added `onReconnect(callback)` method to `RealWsClient` class. Fires registered callbacks when WS connection reopens after a disconnect. Exposed via unified `ws.ts` module.
- **Re-fetch on reconnect**: In `useWsQuerySync`, registered a reconnect handler that invalidates `["executions"]`, `["workItems"]`, and `["dashboardStats"]` — so split-view's active execution list refreshes automatically.

**Files modified:** `ws-client.ts`, `ws.ts`, `use-ws-sync.ts`

**Notes:** Build: 0 errors. The `isReconnect` heuristic checks if listeners exist (meaning the app has been running). Terminal renderer didn't need changes — it was already correctly subscribing and mapping events from Sprint 5.

---

## 2026-03-30 — E.2: Wire TanStack Query cache invalidation to WebSocket events

**Task:** Subscribe to WS events and invalidate the correct TanStack Query cache keys for reactive UI updates.

**Done:**
- **Fixed stale query keys**: `state_change` was invalidating `["stories"]` and `["tasks"]` (old Sprint 1 names) — replaced with `["workItems"]` to match current query-keys.ts.
- **Verified all event→key mappings** against query-keys.ts:
  - `state_change` → `["workItems"]` + `["dashboardStats"]`
  - `comment_created` → `["comments"]`
  - `agent_started` / `agent_completed` / `execution_update` → `["executions"]` + `["dashboardStats"]`
  - `proposal_created` / `proposal_updated` → `["proposals"]` + `["dashboardStats"]`
  - `cost_update` → `["dashboardStats"]` + `["costSummary"]`
- **Cleaned up comments**: Removed stale references to "stories/tasks" and "mock WebSocket".
- **Already wired**: Hook is called once in RootLayout via `useWsQuerySync()` — no additional wiring needed.

**Files modified:** `use-ws-sync.ts`

**Notes:** Build: 0 errors. The `subscribeAll` function from `@/api/ws` works with both mock and real WS clients (unified module). TanStack Query's prefix matching ensures `["workItems"]` invalidates all workItem queries (list, single, filtered).

---

## 2026-03-30 — Review: E.1 (approved)

**Reviewed:** API client response parsing and error handling — `client.ts`.
- Response shape audit: all list endpoints `{ data, total }` unwrapped correctly ✓
- Single-entity endpoints `{ data }` unwrapped correctly ✓
- Dashboard flat endpoints (stats, cost-summary, execution-stats) read directly ✓
- JSON columns auto-deserialized by Drizzle, no manual parsing needed ✓
- `showErrorToast()` via `useToastStore.getState().addToast()` — correct external Zustand access ✓
- All 5 helpers (get/post/patch/put/del) fire toast before throwing ✓
- `del` fires toast but returns `res.ok` (no throw) — consistent with existing contract ✓
- Build: 0 errors, 145 tests pass
- Verdict: **approved**

---

## 2026-03-30 — E.1: Fix API client response parsing

**Task:** Audit API client response shapes vs backend routes. Add error handling with toast notifications on failure.

**Done:**
- **Audit results**: All response shapes match between frontend client and backend routes:
  - List endpoints return `{ data, total }` — client unwraps `res.data` ✓
  - Single-entity endpoints return `{ data }` — client unwraps `res.data` ✓
  - Dashboard stats/cost-summary/execution-stats return flat objects — client reads directly ✓
  - Dashboard ready-work returns `{ data, total }` — client unwraps ✓
  - JSON columns (`labels`, `executionContext`, `context`, `settings`) auto-deserialized by Drizzle — no manual parsing needed ✓
  - Serializers convert dates to ISO strings, cast branded IDs — matches shared types ✓
- **Error handling**: Added `showErrorToast()` helper using `useToastStore.getState().addToast()` (Zustand external access). All 5 HTTP helpers (get, post, patch, put, del) now show error toasts with method, path, and status code before throwing.
- **No response shape fixes needed**: The API client was already correctly aligned with backend routes. The double-encoding bugs were fixed in Sprint 9 (Q.4-Q.6).

**Files modified:** `client.ts`

**Notes:** Build: 0 errors, 145 tests pass. Used Zustand's `getState()` for external store access from non-React code. Toast shows "API request failed" with "GET /api/... returned 404" description.

---

## 2026-03-30 — Review: P.12 (approved)

**Reviewed:** Hover states and transitions — `list-view.tsx`, `card.tsx`, `detail-panel.tsx`.
- List rows: `hover:bg-muted/50` + `duration-150`, selected `ring-2 ring-primary/50`, `focus-visible:ring-2` ✓
- Group headers: `duration-150`, `rounded-md`, `focus-visible:ring-2` ✓
- Expand chevron: `transition-colors duration-150`, `focus-visible:ring-2` ✓
- Card: `transition-shadow duration-150 hover:shadow-md` applied globally ✓
- Detail panel children: `hover:bg-muted/50 duration-150 focus-visible:ring-2` ✓
- Buttons correctly left unchanged (CVA already handles hover+focus) ✓
- Consistent `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` pattern on all non-button interactive elements ✓
- Build: 0 errors
- Verdict: **approved** — Sprint 10 complete!

---

## 2026-03-30 — P.12: Polish hover states and transitions

**Task:** Audit all interactive elements for hover feedback, add consistent transitions, focus-visible rings, and selected state styling.

**Done:**
- **List view rows**: Changed hover from `bg-accent/50` → `bg-muted/50` (subtler). Added `duration-150` for faster transition. Selected state now uses `ring-2 ring-primary/50` alongside `bg-accent`. Added `focus-visible:ring-2 focus-visible:ring-ring`.
- **List view group headers**: Added `duration-150`, `rounded-md`, and `focus-visible:ring-2 focus-visible:ring-ring`.
- **List view expand chevron**: Added `transition-colors duration-150` and `focus-visible:ring-2 focus-visible:ring-ring`.
- **Card component**: Added `transition-shadow duration-150 hover:shadow-md` for subtle lift effect on all cards.
- **Detail panel children rows**: Changed hover from `bg-accent/50` → `bg-muted/50`, added `duration-150` and `focus-visible:ring-2 focus-visible:ring-ring`.
- **Buttons**: Already have comprehensive hover states via CVA variants and `focus-visible:ring-[3px]` — no changes needed.

**Files modified:** `list-view.tsx`, `card.tsx`, `detail-panel.tsx`

**Notes:** Build: 0 errors. Buttons already had good hover+focus via shadcn CVA config. PrioritySelector and StateTransitionControl use shadcn Select (already interactive with proper states). The `ring-primary/50` selected ring provides a consistent active indicator.

---

## 2026-03-30 — Review: P.11 (approved)

**Reviewed:** Loading skeletons and empty states — `list-view.tsx`, `detail-panel.tsx`, `dashboard.tsx`.
- List view: 5-row skeleton with badge+text+avatar shimmer pattern ✓
- Empty states: filter-aware messaging ("No items match" vs "No work items yet") ✓
- Detail panel: loading skeleton (title+badges+content), children empty message ✓
- Dashboard: shimmer placeholder replaces "—" text during loading ✓
- Flow view + comment stream correctly identified as already handled ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — P.11: Add loading and empty states

**Task:** Add skeleton loading states and empty state messaging across the app.

**Done:**
- **List view**: Improved loading skeleton from plain bars to badge+text+avatar shimmer pattern (5 rows). Added empty states: "No work items yet. Click + to create one." when no items, "No items match your filters." when filters active.
- **Detail panel**: Added loading skeleton (title bar + badges + content placeholders) when item is selected but data not yet loaded. Children section now shows "No children. Click 'Add child' or 'Decompose'." instead of hiding entirely.
- **Dashboard**: Stat card values show shimmer placeholder (`h-8 w-12 animate-pulse`) when loading instead of "—" text.
- **Flow view**: Already had node placeholder skeletons — no changes needed.
- **Comment stream**: Already had "No comments yet." empty state — no changes needed.

**Files modified:** `list-view.tsx`, `detail-panel.tsx`, `dashboard.tsx`

**Notes:** Build: 0 errors. Used `&apos;` for HTML entity in JSX string. Empty state detection checks all filter types (search, state, priority, personas, labels).
