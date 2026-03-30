# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-29 — Review: T3.3.4 (approved)

**Reviewed:** Real WebSocket client — `api/ws-client.ts`, `api/ws.ts`, 5 consumer files.
- RealWsClient: same subscribe/subscribeAll interface as MockWsClient
- Connects to ws://localhost:3001/ws, auto-reconnect 3s on close
- Guards against duplicate connections, proper disconnect lifecycle
- Filters "connected" welcome message from dispatch
- Unified ws.ts delegates to mock/real via apiMode, exports initWsConnection()
- All 5 consumers updated: use-ws-sync, use-toast-events, activity-feed, recent-activity, terminal-renderer
- No stale mockWs imports outside mocks/ and api/ws.ts
- Frontend typecheck: 0 errors
- **Sprint 5 is now complete** — all 10 tasks approved
- Verdict: **approved**

---

## 2026-03-29 — T3.3.4: Connect WebSocket client to real server

**Task:** Create real WS client, unified WS module, update all consumers.

**Done:**
- Created `src/api/ws-client.ts` — `RealWsClient` class:
  - Connects to `ws://localhost:3001/ws` (derived from API_BASE_URL)
  - Same `subscribe(eventType, handler)` and `subscribeAll(handler)` interface as MockWsClient
  - Auto-reconnect with 3s backoff on disconnect
  - Filters out "connected" welcome message from dispatch
  - `connect()` / `disconnect()` lifecycle methods
- Created `src/api/ws.ts` — unified WS module:
  - Exports `subscribe()` and `subscribeAll()` that delegate to mock or real based on apiMode
  - Exports `initWsConnection()` to start/stop real WS based on mode
- Updated 5 consumers from `mockWs` to unified WS:
  - `hooks/use-ws-sync.ts` — `subscribeAll`
  - `features/toasts/use-toast-events.ts` — `subscribeAll`
  - `features/activity-feed/activity-feed.tsx` — `subscribeAll`
  - `features/dashboard/recent-activity.tsx` — `subscribeAll`
  - `features/agent-monitor/terminal-renderer.tsx` — `subscribe("agent_output_chunk")`
- `mockWs` only referenced in `mocks/` and the unified `api/ws.ts` layer

**Files created:** `src/api/ws-client.ts`, `src/api/ws.ts`
**Files modified:** 5 consumer files (import path + usage changes)

**Notes:** Frontend typecheck: 0 errors. The `demo.ts` mock simulation still uses `mockWs` directly — this is intentional as it's mock-only functionality. Sprint 5 is now complete with this task.

---

## 2026-03-29 — Review: T3.3.3 (approved)

**Reviewed:** API mode toggle — `src/api/index.ts`, `stores/ui-store.ts`, 8 hook files.
- `apiMode` added to Zustand UI store with persistence, default "mock"
- `ApiMode` type exported for reuse
- Unified API layer uses `pick()` to delegate per-call based on store state
- All 32 functions wrapped with proper Parameters<typeof> typing
- All 8 hook files updated from `@/mocks/api` to `@/api`
- Zero stale `@/mocks/api` imports in hooks
- Frontend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.3.3: Add API mode toggle to frontend

**Task:** Wire up mock/real API switching so hooks can use either backend.

**Done:**
- Added `apiMode: "mock" | "api"` to `stores/ui-store.ts` (persisted to localStorage via `partialize`)
- Added `setApiMode` action to UI store
- Created `src/api/index.ts` — unified API layer that delegates to mock or real based on `apiMode`
  - Uses `useUIStore.getState().apiMode` to read mode (non-reactive, read at call time)
  - Each function wraps both mock and real implementations with `pick()` helper
  - 32 functions matching same signatures as mock API and real client
- Updated all 8 hook files to import from `@/api` instead of `@/mocks/api`:
  - use-projects.ts, use-work-items.ts, use-personas.ts, use-persona-assignments.ts
  - use-executions.ts, use-comments.ts, use-proposals.ts, use-dashboard.ts
- Default mode: `"mock"` (no change in behavior until user toggles)

**Files created:** `packages/frontend/src/api/index.ts`
**Files modified:** `packages/frontend/src/stores/ui-store.ts`, 8 hook files (import path change)

**Notes:** Frontend typecheck: 0 errors. The toggle UI itself (a button/switch in settings or status bar) can be added as a polish task — the store and wiring are ready. When `setApiMode("api")` is called, all subsequent query function calls will hit the real backend. TanStack Query caches should be invalidated on mode switch (can be done by the component that calls `setApiMode`).

---

## 2026-03-29 — Review: T3.3.2 (approved)

**Reviewed:** Frontend API client — `src/api/client.ts`.
- 32 functions matching mock API signatures exactly (same params, same return types)
- Unwraps backend `{ data }` / `{ data, total }` response envelopes
- try/catch returns null for 404s on get-by-id (matches mock behavior)
- Clean generic HTTP helpers (get/post/patch/put/del) with Content-Type headers
- Query string construction for list filters (parentId, projectId, workItemId)
- Dashboard routes return unwrapped types directly
- `getProjectMemories` returns [] gracefully (route not yet implemented)
- `apiClient` bundle matches `mockApi` shape (minus mock-only `resetStore`)
- `API_BASE_URL` exported as configurable constant
- Frontend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.3.2: Create API client for frontend

**Task:** Create a real HTTP API client that mirrors the mock API function signatures.

**Done:**
- Created `packages/frontend/src/api/client.ts`:
  - fetch-based HTTP helpers: `get`, `post`, `patch`, `put`, `del`
  - All functions match mock API signatures exactly (same params, same return types)
  - Unwraps backend's `{ data }` / `{ data, total }` response envelopes
  - 404s return `null` for get-by-id functions (matching mock behavior)
  - Deletes return `boolean` (matching mock behavior)
  - Query string construction for list filters (parentId, projectId, workItemId)
  - Dashboard aggregate routes return unwrapped types directly
  - `getProjectMemories` returns `[]` (backend route not yet implemented)
  - `apiClient` bundled export mirrors `mockApi` shape exactly
  - `API_BASE_URL` exported as constant (default: `http://localhost:3001`)

**Files created:** `packages/frontend/src/api/client.ts`

**Notes:** Frontend typecheck: 0 errors. The hooks currently import from `@/mocks/api`. T3.3.3 (API mode toggle) will add the switching logic. Project CRUD routes (`/api/projects`) don't exist in the backend yet — the client includes them for completeness but they'll 404 until project routes are added.

---

## 2026-03-29 — Review: T3.3.1 (approved)

**Reviewed:** WebSocket server — `ws.ts`, `server.ts`.
- @fastify/websocket plugin registered correctly with async pattern
- `/ws` route with `{ websocket: true }` option per docs
- Module-level Set<WebSocket> for client tracking — add on connect, delete on close/error
- `broadcast(WsEvent)` typed with shared WsEvent, checks readyState before send
- `getClientCount()` utility exported for monitoring
- Welcome message on connect for client handshake
- Registered before API routes in server.ts
- @types/ws added as devDep
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.3.1: Implement real WebSocket server

**Task:** Set up @fastify/websocket with broadcast capability for real-time events.

**Done:**
- Created `packages/backend/src/ws.ts`:
  - `registerWebSocket(app)` — registers @fastify/websocket plugin and `/ws` route
  - Tracks connected clients in a module-level `Set<WebSocket>`
  - `broadcast(event: WsEvent)` — sends JSON-serialized WsEvent to all connected clients (readyState === OPEN)
  - `getClientCount()` — returns number of connected clients
  - Connection lifecycle: logs connect/disconnect with client count, handles errors
  - Sends `{ type: "connected", timestamp }` welcome message on connect
- Registered in `server.ts` before API routes
- Added `@types/ws` as dev dependency

**Files created:** `packages/backend/src/ws.ts`
**Files modified:** `packages/backend/src/server.ts`, `packages/backend/package.json`

**Notes:** Backend typecheck: 0 errors. The `broadcast()` function is exported for use by route handlers — when a mutation occurs (state change, comment created, etc.), the route can call `broadcast(event)` to push it to all connected clients. The frontend's T3.3.4 task will connect to this `/ws` endpoint.

---

## 2026-03-29 — Review: T3.2.10 (approved)

**Reviewed:** Dashboard aggregate routes — `routes/dashboard.ts`, `server.ts`.
- 4 read-only endpoints: stats, cost-summary, execution-stats, ready-work
- All computations match frontend mock implementations exactly
- Stats: activeAgents, pendingProposals, needsAttention (blocked+pending), todayCostUsd
- Cost summary: 7-day dailySpend, monthTotal, monthCap from project settings
- Execution stats: totalRuns, totalCostUsd, successRate, averageDurationMs
- Ready work: workItems in "Ready" state joined with personas, limit 5, full entity serialization
- Proper type casting for all branded/union types in ready-work response
- Registered in server.ts
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.2.10: Implement aggregate/dashboard API routes

**Task:** Create read-only aggregate endpoints mirroring the frontend mock functions.

**Done:**
- Created `routes/dashboard.ts`: 4 routes
  - `GET /api/dashboard/stats` → DashboardStats (activeAgents, pendingProposals, needsAttention, todayCostUsd)
  - `GET /api/dashboard/cost-summary` → CostSummary (7-day dailySpend, monthTotal, monthCap from project settings)
  - `GET /api/dashboard/execution-stats` → ExecutionStats (totalRuns, totalCostUsd, successRate, averageDurationMs)
  - `GET /api/dashboard/ready-work` → ReadyWorkItem[] (work items in "Ready" state, joined with persona, limit 5)
- All routes compute aggregates in JS matching the mock implementations exactly
- Ready-work route serializes full WorkItem and Persona entities with proper branded ID casts
- Required type casts for DB→entity: Priority, PersonaModel, ExecutionId, ExecutionOutcome, RejectionPayload
- Registered in `server.ts`

**Files created:** `packages/backend/src/routes/dashboard.ts`
**Files modified:** `packages/backend/src/server.ts`

**Notes:** Backend typecheck: 0 errors. These are read-only aggregate routes — no create/update/delete. The ready-work route needed extensive type casting because the compound WorkItem+Persona response has many branded/union types that the DB returns as plain strings.

---

## 2026-03-29 — Review: T3.2.9 (approved)

**Reviewed:** Proposal CRUD routes — `routes/proposals.ts`, `server.ts`, `shared/src/api.ts`.
- 5 routes: GET list (?workItemId filter), GET by id, POST create, PATCH status, DELETE
- Added CreateProposalRequest to shared api.ts with ProposalType import
- Serializer correctly converts Date→ISO for createdAt, casts all branded IDs
- POST defaults: status=pending, payload={}, createdAt=now
- PATCH: only updates status (feedback field intentionally not stored — no DB column)
- 404/400 error handling, correct HTTP status codes (201/204)
- Registered in server.ts
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.2.9: Implement proposal API routes

**Task:** Create proposal CRUD routes with workItemId filtering.

**Done:**
- Added `CreateProposalRequest` to `packages/shared/src/api.ts` (executionId, workItemId, type, payload?)
- Added `ProposalType` import to api.ts
- Created `routes/proposals.ts`: 5 routes
  - `GET /api/proposals?workItemId=` — list (optional filter by workItemId)
  - `GET /api/proposals/:id` — get single proposal
  - `POST /api/proposals` — create (defaults: status=pending, payload={}, createdAt=now)
  - `PATCH /api/proposals/:id` — update status (UpdateProposalRequest — status field only, feedback field not stored as DB has no column for it)
  - `DELETE /api/proposals/:id` — delete
- Serializer converts Date→ISO for createdAt, casts ProposalId/ExecutionId/WorkItemId
- Registered in `server.ts`

**Files created:** `packages/backend/src/routes/proposals.ts`
**Files modified:** `packages/backend/src/server.ts`, `packages/shared/src/api.ts`

**Notes:** Backend typecheck: 0 errors. UpdateProposalRequest has `feedback?` field but proposals table has no feedback column — PATCH only updates `status`. Feedback could be added to payload in a future iteration if needed.

---

## 2026-03-29 — Review: T3.2.8 (approved)

**Reviewed:** Execution CRUD routes — `routes/executions.ts`, `server.ts`, `shared/src/api.ts`.
- 5 routes: GET list (?workItemId filter), GET by id, POST create, PATCH update, DELETE
- Added CreateExecutionRequest/UpdateExecutionRequest to shared api.ts with correct entity type imports
- Serializer correctly converts Date→ISO for startedAt/completedAt, handles null completedAt, casts branded IDs
- POST defaults sensible: status=pending, startedAt=now, zeros/empty/null for remaining fields
- PATCH completedAt: accepts ISO string, converts to Date; handles null correctly
- JSON.stringify pattern on rejectionPayload consistent with established codebase pattern
- 404/400 error handling, correct HTTP status codes (201/204)
- Registered in server.ts
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.2.8: Implement execution API routes

**Task:** Create execution CRUD routes with workItemId filtering.

**Done:**
- Added `CreateExecutionRequest` and `UpdateExecutionRequest` to `packages/shared/src/api.ts`
  - CreateExecutionRequest: workItemId, personaId (required)
  - UpdateExecutionRequest: status?, completedAt?, costUsd?, durationMs?, summary?, outcome?, rejectionPayload?, logs?
- Created `routes/executions.ts`: 5 routes
  - `GET /api/executions?workItemId=` — list (optional filter by workItemId)
  - `GET /api/executions/:id` — get single execution
  - `POST /api/executions` — create (defaults: status=pending, startedAt=now, zeros/empty for cost/duration/summary/logs)
  - `PATCH /api/executions/:id` — partial update (all UpdateExecutionRequest fields, 400 if empty)
  - `DELETE /api/executions/:id` — delete
- Serializer converts Date→ISO for startedAt/completedAt, casts branded IDs
- completedAt in PATCH: accepts ISO string, converts to Date for DB storage
- Registered in `server.ts`

**Files created:** `packages/backend/src/routes/executions.ts`
**Files modified:** `packages/backend/src/server.ts`, `packages/shared/src/api.ts`

**Notes:** Backend typecheck: 0 errors. Added missing ExecutionStatus, ExecutionOutcome, RejectionPayload imports to api.ts for the request types.

---

## 2026-03-29 — Review: T3.2.7 (approved)

**Reviewed:** Persona CRUD routes — `routes/personas.ts`, `server.ts`.
- 5 routes: GET list, GET by id, POST create, PATCH update, DELETE
- Serializer correctly casts PersonaId, passes through all persona fields
- Uses CreatePersonaRequest/UpdatePersonaRequest from shared, createId.persona() for ID generation
- All UpdatePersonaRequest fields handled in PATCH (8 fields)
- Proper defaults on POST (avatar, allowedTools, mcpTools, maxBudgetPerRun, settings, description)
- 404 handling, correct HTTP status codes (201/204/400)
- JSON.stringify pattern in PATCH consistent with approved work-items.ts
- Registered in server.ts
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.2.7: Implement persona API routes

**Task:** Create persona CRUD routes.

**Done:**
- Created `routes/personas.ts`: 5 routes
  - `GET /api/personas` — list all
  - `GET /api/personas/:id` — get single
  - `POST /api/personas` — create (CreatePersonaRequest, defaults for avatar/tools/budget)
  - `PATCH /api/personas/:id` — partial update (UpdatePersonaRequest, 400 if no fields)
  - `DELETE /api/personas/:id` — delete
- Registered in `server.ts`
- Serializer casts PersonaId, passes through all persona fields

**Files created:** `routes/personas.ts`
**Files modified:** `server.ts`

**Notes:** Backend typecheck: 0 errors. No timestamp fields on personas — simpler serializer than other routes.

---

## 2026-03-29 — Review: T3.2.5 (approved)

**Reviewed:** Comment routes — `routes/comments.ts`, `server.ts`.
- 4 routes: GET list (?workItemId filter), GET by id, POST create, DELETE
- Serializer correctly converts Date→ISO and casts branded IDs
- Uses CreateCommentRequest from shared, createId.comment() for ID generation
- 404 handling, correct HTTP status codes (201/204)
- Registered in server.ts
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.2.5: Implement comment API routes

**Task:** Create comment CRUD routes with workItemId filtering.

**Done:**
- Created `routes/comments.ts`: 4 routes
  - `GET /api/comments?workItemId=` — list (optional filter by workItemId)
  - `GET /api/comments/:id` — get single comment
  - `POST /api/comments` — create (uses CreateCommentRequest from shared, auto-generates ID + timestamp)
  - `DELETE /api/comments/:id` — delete
- Registered in `server.ts`
- Serializer converts Date→ISO, casts branded IDs (CommentId, WorkItemId, PersonaId)
- Follows same patterns as work-items routes (404 handling, 201/204 status codes)

**Files created:** `routes/comments.ts`
**Files modified:** `server.ts`

**Notes:** Backend typecheck: 0 errors.

---

## 2026-03-29 — Review: T3.1.3 (approved)

**Reviewed:** Drizzle migrations setup — `drizzle.config.ts`, `src/db/migrate.ts`, `src/index.ts`, `src/db/seed.ts`, `package.json`, `drizzle/0000_secret_magneto.sql`.
- Config: correct SQLite dialect, schema path, output dir
- Migrator: `runMigrations()` exported, standalone mode via import.meta.url
- Server startup: migrations run before server starts
- Seed: inline SQL removed, uses `runMigrations()` instead
- Generated migration: all 9 tables with columns, PKs, FKs matching schema.ts
- 5 npm scripts present (db:generate, db:migrate, db:push, db:seed, db:studio)
- End-to-end verified: in-memory seed succeeds
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.1.3: Set up Drizzle migrations and seed script

**Task:** Configure drizzle-kit for migration generation, create runtime migration runner, wire into server startup and seed.

**Done:**
- Created `drizzle.config.ts`: SQLite dialect, schema from `src/db/schema.ts`, output to `drizzle/`
- Created `src/db/migrate.ts`: `runMigrations()` using `drizzle-orm/better-sqlite3/migrator`, also runnable standalone
- Generated initial migration `drizzle/0000_secret_magneto.sql`: all 9 tables with correct columns, PKs, FKs, defaults
- Updated `src/index.ts`: runs `runMigrations()` before server start
- Updated `src/db/seed.ts`: replaced 90-line inline CREATE TABLE SQL with `runMigrations()` call
- Added 5 npm scripts to `package.json`: `db:generate`, `db:migrate`, `db:push`, `db:seed`, `db:studio`
- Tested: `DATABASE_URL=":memory:" pnpm db:seed` succeeds end-to-end (migrations + seed)

**Files created:** `drizzle.config.ts`, `src/db/migrate.ts`, `drizzle/0000_secret_magneto.sql`, `drizzle/meta/`
**Files modified:** `src/index.ts`, `src/db/seed.ts`, `package.json`

**Notes:** Backend typecheck: 0 errors. Full monorepo build: passes. Migration + seed verified working with in-memory DB.

---

