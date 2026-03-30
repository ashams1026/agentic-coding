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

## 2026-03-29 — Review: O.20 (approved after rework)

**Reviewed:** Reworked DELETE handler in `routes/work-items.ts`.
- `and()` correctly replaced with `inArray(workItems.parentId, frontier)`
- `inArray` properly imported from drizzle-orm
- Ternary simplified — single `inArray()` handles both single and multi-item frontiers
- All 10 routes across 3 files still correct (verified in prior review)
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — O.20 (rework): Fix recursive delete bug

**Task:** Address review feedback — replace `and()` with `inArray()` in DELETE handler.

**Done:**
- Imported `inArray` from "drizzle-orm" in `routes/work-items.ts`
- Replaced the broken ternary `frontier.length === 1 ? eq(...) : and(...)` with simple `inArray(workItems.parentId, frontier)`
- `inArray` correctly handles both single and multi-item arrays, so the ternary was removed entirely

**Files modified:** `routes/work-items.ts` (2 lines changed)

**Notes:** Backend typecheck: 0 errors. The fix ensures recursive delete correctly finds all descendants at every level, not just direct children.

---

## 2026-03-29 — Review: O.20 (rejected)

**Reviewed:** CRUD routes — `routes/work-items.ts`, `routes/persona-assignments.ts`, `routes/work-item-edges.ts`, `server.ts`.
- 10 routes present, correct HTTP verbs and status codes, serializers working, build passes
- **Bug found**: Recursive DELETE in work-items.ts uses `and()` instead of `inArray()` for multi-child frontier. When frontier has >1 items, `and(eq(parentId, "a"), eq(parentId, "b"))` returns 0 results (impossible condition), orphaning grandchildren.
- Feedback: use `inArray(workItems.parentId, frontier)` from drizzle-orm
- Verdict: **rejected**

---

## 2026-03-29 — O.20: Rewrite CRUD API routes for WorkItem

**Task:** Create routes/work-items.ts, routes/persona-assignments.ts, routes/work-item-edges.ts. Register in server.ts.

**Done:**
- Created `routes/work-items.ts`: 5 routes
  - `GET /api/work-items` — list with optional `?parentId=` and `?projectId=` filters
  - `GET /api/work-items/:id` — get single item
  - `POST /api/work-items` — create (uses WORKFLOW.initialState, createId.workItem())
  - `PATCH /api/work-items/:id` — partial update (only provided fields, auto-sets updatedAt)
  - `DELETE /api/work-items/:id` — recursive delete (collects all descendant IDs, deletes deepest first)
- Created `routes/persona-assignments.ts`: 2 routes
  - `GET /api/persona-assignments?projectId=` — list
  - `PUT /api/persona-assignments` — upsert (onConflictDoUpdate on composite PK)
- Created `routes/work-item-edges.ts`: 3 routes
  - `GET /api/work-item-edges?workItemId=` — list (matches both fromId and toId)
  - `POST /api/work-item-edges` — create
  - `DELETE /api/work-item-edges/:id` — delete
- Updated `server.ts`: registered all 3 route modules, added PUT to CORS methods
- Added `@agentops/shared` as workspace dependency to backend package.json
- Serializer functions convert DB types (Date → ISO string, branded IDs)

**Files created:** `routes/work-items.ts`, `routes/persona-assignments.ts`, `routes/work-item-edges.ts`
**Files modified:** `server.ts`, `package.json`

**Notes:** All routes return `{ data, total }` list format or `{ data }` single format matching shared API types. Backend typecheck: 0 errors. Full monorepo build: passes.

---

## 2026-03-29 — Review: O.19 (approved)

**Reviewed:** Seed script and DB connection — `packages/backend/src/db/seed.ts`, `packages/backend/src/db/connection.ts`.
- All 9 entity types seeded matching frontend fixtures exactly (1 project, 5 personas, 16 work items, 4 edges, 4 assignments, 8 executions, 15 comments, 2 proposals, 2 memories)
- All IDs match frontend fixtures for cross-system consistency
- Dependency-ordered inserts (projects → personas → workItems → ...) and reverse-order deletes
- Idempotent: CREATE TABLE IF NOT EXISTS + delete-before-insert
- connection.ts: WAL mode, FK enforcement, proper type annotation
- Note: costUsd/maxBudgetPerRun stored as cents (integer) vs fixtures' dollars — correct for SQLite integer column, API layer will convert
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — O.19: Update seed script for WorkItem model

**Task:** Create `packages/backend/src/db/seed.ts` with seed data matching frontend fixtures.

**Done:**
- Created `packages/backend/src/db/connection.ts`: DB connection module using better-sqlite3 + drizzle-orm, WAL mode, FK enforcement, exports `db` and `sqlite`
- Created `packages/backend/src/db/seed.ts`: Full seed script inserting all data matching `packages/frontend/src/mocks/fixtures.ts`:
  - 1 project (AgentOps)
  - 5 personas (PM, Tech Lead, Engineer, Reviewer, QA)
  - 16 work items (3 top-level, 7 children, 3 grandchildren, 3 more children)
  - 4 work item edges (2 blocks, 2 depends_on)
  - 4 persona assignments (Planning, Decomposition, In Progress, In Review)
  - 8 executions (including 2 running, 1 rejected)
  - 15 comments (user, agent, system types)
  - 2 proposals (1 approved, 1 pending)
  - 2 project memories
- Creates tables via raw SQL (IF NOT EXISTS) then inserts via Drizzle ORM
- Clears existing data before inserting (idempotent)
- Cost values stored as cents (integer), timestamps as Date objects for timestamp_ms mode

**Files created:** `packages/backend/src/db/connection.ts`, `packages/backend/src/db/seed.ts`

**Notes:** Backend typecheck: 0 errors. Full monorepo build: passes. IDs match frontend fixtures exactly for consistency.

---

## 2026-03-29 — Review: O.18 (approved)

**Reviewed:** Drizzle schema — `packages/backend/src/db/schema.ts`.
- All 9 entity tables present matching shared/entities.ts (projects, work_items, work_item_edges, persona_assignments, personas, executions, comments, proposals, project_memories)
- No workflows or triggers tables — correct per WorkItem model
- work_items table has all 13 columns from task spec including self-referencing parentId
- persona_assignments uses composite PK (projectId + stateName) — correct
- All cross-table FKs defined (comments/executions/proposals/memories → workItemId)
- JSON columns use $type<> for type safety
- Relations correctly defined including self-referencing parent/child
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — O.18: Rewrite Drizzle schema for WorkItem model

**Task:** Create `packages/backend/src/db/schema.ts` with Drizzle ORM schema matching the WorkItem-based entity model from `@agentops/shared`.

**Done:**
- Created `packages/backend/src/db/schema.ts` with 9 tables:
  - `projects` — id, name, path, settings (JSON), createdAt
  - `work_items` — id, parentId (self-referencing), projectId FK, title, description, context (JSON), currentState, priority, labels (JSON), assignedPersonaId FK, executionContext (JSON array), createdAt, updatedAt
  - `work_item_edges` — id, fromId FK, toId FK, type (blocks/depends_on/related_to)
  - `persona_assignments` — composite PK (projectId + stateName), personaId FK
  - `personas` — id, name, description, avatar (JSON), systemPrompt, model, allowedTools (JSON), mcpTools (JSON), maxBudgetPerRun, settings (JSON)
  - `executions` — id, workItemId FK, personaId FK, status, startedAt, completedAt, costUsd, durationMs, summary, outcome, rejectionPayload (JSON), logs
  - `comments` — id, workItemId FK, authorType, authorId, authorName, content, metadata (JSON), createdAt
  - `proposals` — id, executionId FK, workItemId FK, type, payload (JSON), status, createdAt
  - `project_memories` — id, projectId FK, workItemId FK, summary, filesChanged (JSON), keyDecisions (JSON), createdAt, consolidatedInto
- All relations defined (parent/child self-referencing on work_items, FKs for all cross-table refs)
- No `workflows` or `triggers` tables — hardcoded WORKFLOW from shared replaces them
- JSON columns use `$type<>()` for type safety matching shared entity interfaces
- Timestamps use `integer("...", { mode: "timestamp_ms" })` for SQLite compatibility

**Files created:** `packages/backend/src/db/schema.ts`
**Files modified:** none (new file only)

**Notes:** Backend typecheck + build: 0 errors. Full monorepo build: passes. Schema aligns 1:1 with entities in `packages/shared/src/entities.ts`.

---

## 2026-03-29 — Review: O.17 (approved)

**Reviewed:** Old code removal — 26 files deleted, 7 files fixed.
- All 5 directories deleted: kanban/, story-detail/, task-detail/, workflow-designer/, story-list/
- All 4 old pages deleted: story-board, story-detail, task-detail, workflow-designer
- features/common/ preserved with 4 files
- 7 remaining files fixed for WorkItem types (agent-monitor, command-palette, mocks)
- Frontend typecheck: 0 errors confirmed
- Frontend build: passes
- Verdict: **approved**

---

## 2026-03-29 — O.17: Remove old story/task/workflow code

**Task:** Delete old feature directories and pages, fix remaining type errors to achieve clean build.

**Done:**
- Deleted directories: `features/kanban/` (7 files), `features/story-detail/` (5 files), `features/task-detail/` (4 files), `features/workflow-designer/` (6 files), `features/story-list/` (4 files)
- Deleted pages: `pages/story-board.tsx`, `pages/story-detail.tsx`, `pages/task-detail.tsx`, `pages/workflow-designer.tsx`
- Kept: `features/common/` (CommentStream, ExecutionTimeline, empty-states, loading-skeletons)
- Fixed remaining type errors in 7 files that still used old Story/Task types:
  - `features/agent-monitor/active-agent-sidebar.tsx`: useTasks/useStories → useWorkItems, exec.targetId → exec.workItemId
  - `features/agent-monitor/agent-control-bar.tsx`: same pattern + navigation links to /work-items/
  - `features/agent-monitor/agent-history.tsx`: same pattern
  - `features/agent-monitor/split-view.tsx`: same pattern
  - `features/command-palette/command-palette.tsx`: merged stories/tasks into single work-items category
  - `mocks/demo.ts`: StoryId/TaskId → WorkItemId, all WS events use workItemId/workItemTitle
  - `mocks/ws.ts`: StoryId/TaskId → WorkItemId in simulateAgentRun

**Result:** Frontend typecheck: 0 errors. Full `pnpm build`: passes (1,119 KB bundle).

**Files deleted:** 26 files across 5 directories + 4 pages
**Files modified:** 7 files (agent-monitor, command-palette, mocks)

---

## 2026-03-29 — Review: O.16 (approved)

**Reviewed:** Workflow configuration — `workflow-config-section.tsx`, `settings-layout.tsx`, `projects-section.tsx`.
- All 6 requirements met: workflow config panel in settings, auto-routing toggle, persona-per-state table (5 states, dropdown + model badge), SVG state machine diagram, old workflow refs removed from projects
- PersonaStateTable correctly filters out Backlog/Done/Blocked (non-configurable per PLANNING.md)
- WorkflowDiagram renders all states with transitions, Blocked positioned below
- projects-section fully cleaned — zero workflow/WorkflowId references remain
- No type errors
- Verdict: **approved**

---

## 2026-03-29 — O.16: Build workflow configuration in settings

**Task:** Add per-project workflow config panel with auto-routing toggle, persona-per-state table, state machine diagram.

**Done:**
- Created `features/settings/workflow-config-section.tsx`:
  - AutoRoutingToggle: ON/OFF switch with description
  - PersonaStateTable: grid of configurable states (Planning, Decomposition, Ready, In Progress, In Review) with persona dropdown (from usePersonas) and model badge (opus/sonnet/haiku with colors). Note about Backlog/Done/Blocked being non-configurable
  - WorkflowDiagram: read-only SVG rendering of WORKFLOW states and transitions. Horizontal layout for main states, Blocked below. Arrow markers, colored node fills from WORKFLOW.states
  - Uses usePersonaAssignments/useUpdatePersonaAssignment for live updates
- Updated `features/settings/settings-layout.tsx`: added "Workflow" section with GitBranch icon between Projects and API Keys
- Updated `features/settings/projects-section.tsx`: removed all workflow references (workflowId form field, defaultWorkflowId, workflow name badge, useWorkflows import, WorkflowId type)

**Files created:** `features/settings/workflow-config-section.tsx`
**Files modified:** `features/settings/settings-layout.tsx`, `features/settings/projects-section.tsx`

**Notes:** All settings files compile clean. Workflow config is read-only for state machine — only persona assignments are editable.

---

## 2026-03-29 — Review: O.15 (approved)

**Reviewed:** Activity feed — `activity-feed.tsx`.
- All 5 requirements met: story/task language replaced, router_decision event added with reasoning, trigger refs removed, WS events use new fields
- Only remaining "trigger" reference is `triggeredBy` on StateChangeEvent — correct field name
- Router decision event has Route icon + indigo color + descriptive reasoning text
- Story filter removed from FilterBar (simplified to persona + date + type)
- No type errors
- Verdict: **approved**

---

## 2026-03-29 — O.15: Update activity feed for WorkItem model

**Task:** Replace story/task language with work item, add Router decision events, remove trigger-related types.

**Done:**
- Rewrote `features/activity-feed/activity-feed.tsx`:
  - Replaced all `exec.targetType`/`exec.targetId`, `comment.targetType`/`comment.targetId`, `proposal.parentType`/`proposal.parentId` with workItemId-based logic
  - All target paths → `/items`, all target labels → "work item"
  - Replaced "story/task" language with "work item" in all event descriptions
  - Added `router_decision` event type with Route icon and indigo color
  - Added mock Router decision event ("Router: Moved to Ready")
  - Removed story filter from FilterBar (was `storyId` filter — replaced by simpler persona + date + type filters)
  - Updated WS event handlers to use new field names (workItemId, workItemTitle)
  - Renamed internal FilterBar → FeedFilterBar to avoid conflict with work-items filter-bar
  - Replaced `useStories` import with clean hooks (useExecutions, useProposals, usePersonas)

**Files modified:** `features/activity-feed/activity-feed.tsx`

**Notes:** Compiles clean. Grid columns for event type checkboxes changed from 5 to 4 (now 11 types with router_decision added).

---

## 2026-03-29 — Review: O.14 (approved)

**Reviewed:** Dashboard components — `upcoming-work.tsx`, `recent-activity.tsx`, `active-agents-strip.tsx`.
- All 5 requirements met: story/task refs removed, stats hook works, upcoming work uses ReadyWorkItem.workItem, activity feed uses workItemId, all compile
- Confirmed zero remaining Story/Task/targetType/targetId references in dashboard features
- WS event handlers correctly use new field names (workItemId, workItemTitle)
- No type errors
- Verdict: **approved**

---

## 2026-03-29 — O.14: Update dashboard for WorkItem model

**Task:** Replace story/task references in dashboard with work item, update upcoming work and activity feed.

**Done:**
- Rewrote `features/dashboard/upcoming-work.tsx`: replaced `useTaskEdges`/`TaskEdge` with simple ReadyWorkItem, `item.task` → `item.workItem`, `item.story` removed, links point to `/items`, removed dependency status helper
- Rewrote `features/dashboard/recent-activity.tsx`: replaced all `exec.targetType`/`exec.targetId` with workItemId-based logic, removed `targetType` from WS event handlers, all target paths → `/items`, replaced "story/task" language with "work item" in descriptions
- Fixed `features/dashboard/active-agents-strip.tsx`: replaced `execution.targetType` with static "work item" text

**Files modified:** `features/dashboard/upcoming-work.tsx`, `features/dashboard/recent-activity.tsx`, `features/dashboard/active-agents-strip.tsx`

**Notes:** All dashboard components compile clean. useDashboardStats hook already works with WorkItem model (updated in O.5). WS event mapping uses new field names (workItemId, workItemTitle).

---

## 2026-03-29 — Review: O.13 (approved)

**Reviewed:** Router cleanup — `router.tsx`, `dashboard.tsx`, `upcoming-work.tsx`.
- All 5 requirements met: old routes removed, /items present, workflow designer import removed, dashboard links updated
- Clean 6-route router with no legacy references
- Dashboard links correctly point to /items
- No new type errors in changed files
- Verdict: **approved**

---

## 2026-03-29 — O.13: Update router

**Task:** Remove old routes, remove workflow designer import, update dashboard links.

**Done:**
- Rewrote `packages/frontend/src/router.tsx`: removed `/board`, `/stories/:id`, `/tasks/:id`, `/workflows` routes and their imports (StoryBoardPage, StoryDetailPage, TaskDetailPage, WorkflowDesignerPage). Kept: dashboard, /items, /agents, /activity, /personas, /settings (6 routes)
- Updated `packages/frontend/src/pages/dashboard.tsx`: changed "Pending Proposals" click from `/board` to `/items`
- Updated `packages/frontend/src/features/dashboard/upcoming-work.tsx`: changed "View board" link to "View items" at `/items`

**Files modified:** `router.tsx`, `pages/dashboard.tsx`, `features/dashboard/upcoming-work.tsx`

**Notes:** router.tsx and dashboard.tsx compile clean. upcoming-work.tsx has pre-existing type errors from the data model refactor (uses old TaskEdge/ReadyWorkItem.task) — O.14 will fix those.

---

## 2026-03-29 — Review: O.12 (approved)

**Reviewed:** Sidebar navigation — `sidebar.tsx`.
- All 4 requirements met: "Story Board" → "Work Items" with ListTodo icon, "Workflows" removed, proposals badge on /items, all old route references gone
- Confirmed no remaining references to /board, /workflows, Kanban, GitBranch, or "Story Board"
- 6 nav items (down from 7)
- No type errors
- Verdict: **approved**

---

## 2026-03-29 — O.12: Update sidebar navigation

**Task:** Replace "Story Board" with "Work Items", remove "Workflows", update badges and routes.

**Done:**
- Updated `packages/frontend/src/components/sidebar.tsx`:
  - Replaced "Story Board" (`/board`, Kanban icon) with "Work Items" (`/items`, ListTodo icon)
  - Removed "Workflows" nav item entirely (no workflow designer page)
  - Updated pending proposals badge from `/board` to `/items` (both collapsed and expanded badges)
  - Replaced `Kanban` and `GitBranch` lucide imports with `ListTodo`

**Files modified:** `components/sidebar.tsx`

**Notes:** sidebar.tsx compiles clean. Nav now has 6 items (Dashboard, Work Items, Agent Monitor, Activity Feed, Personas, Settings) instead of 7.

---

