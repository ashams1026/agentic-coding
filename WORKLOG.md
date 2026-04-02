# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-01 21:25 PDT — FND.WIL.5: Frontend "Show archived" toggle and archived item styling

**Done:** Added `showArchived` state to `work-items-store.ts` with setter and inclusion in `clearFilters()`. Updated `getWorkItems` API client to accept `includeArchived` param. Updated `query-keys.ts` and `useWorkItems` hook to include `includeArchived` in query key and API call. Added "Archived" toggle button (with Archive icon) to `filter-bar.tsx` — uses `variant="secondary"` when active. Updated `ListRow` in `list-view.tsx`: accepts `isArchived` prop, renders with `opacity-50` and an "Archived" badge (outline variant with Archive icon) when item has `archivedAt` set. Both tree and grouped render paths pass the new prop. Visual check: toggle button renders correctly, archived items show badge with muted styling.
**Files:** `packages/frontend/src/stores/work-items-store.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/hooks/query-keys.ts`, `packages/frontend/src/hooks/use-work-items.ts`, `packages/frontend/src/features/work-items/filter-bar.tsx`, `packages/frontend/src/features/work-items/list-view.tsx`

---

## 2026-04-01 21:20 PDT — Review: FND.WIL.4 (approved)

**Reviewed:** Bulk operations API and background hard-delete job.
- `POST /bulk/archive` at :382-417: 400 guard, BFS cascade with dedup, sets `archivedAt` ✓
- `POST /bulk/unarchive` at :419-434: 400 guard, clears `archivedAt` ✓
- `DELETE /bulk` at :436-498: 400 guard, cascade BFS, 409 guard for running execs, cascade-deletes related data, soft-deletes ✓
- `lifecycle.ts`: `cleanupExpiredWorkItems()` with `lt(deletedAt, cutoff)`, cascades all related data + orphan executions, hard-deletes items ✓
- `startLifecycleCleanup()` at boot + every 6h; `stopLifecycleCleanup()` in graceful shutdown ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 21:17 PDT — FND.WIL.4: Bulk operations API and background hard-delete job

**Done:** Added three bulk endpoints to work-items.ts: `POST /api/work-items/bulk/archive` (with optional BFS cascade), `POST /api/work-items/bulk/unarchive`, `DELETE /api/work-items/bulk` (with 409 guard for running executions, cascade-deletes related data, soft-deletes items). Created `packages/backend/src/agent/lifecycle.ts` with `cleanupExpiredWorkItems()` that hard-deletes items where `deleted_at < now - 30 days` (cascades edges, comments, proposals, memories, executions). Registered `startLifecycleCleanup()` in start.ts to run at boot + every 6 hours; `stopLifecycleCleanup()` in graceful shutdown. Added `BulkWorkItemRequest` type to shared/api.ts.
**Files:** `packages/backend/src/routes/work-items.ts`, `packages/backend/src/agent/lifecycle.ts` (new), `packages/backend/src/start.ts`, `packages/shared/src/api.ts`

---

## 2026-04-01 21:03 PDT — Review: FND.WIL.3 (approved)

**Reviewed:** Archive/unarchive/restore API endpoints.
- `POST /archive` at :227-268: 404 guard, BFS cascade, batch `archivedAt = now` ✓
- `POST /unarchive` at :270-287: clears `archivedAt`, 404 guard ✓
- `POST /restore` at :289-321: 400 if not deleted, 410 if 30-day grace expired, clears `deletedAt` ✓
- GET query params at :39-55: `deleted=true` → only deleted; `includeArchived=true` → includes archived; default excludes both ✓
- Shared types `ArchiveWorkItemRequest` and `WorkItemListQuery` in api.ts ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 21:01 PDT — FND.WIL.3: Archive/unarchive/restore API endpoints

**Done:** Added three new endpoints to work-items.ts: `POST /archive` (BFS cascade when `cascade=true`, sets `archived_at`), `POST /unarchive` (clears `archived_at`), `POST /restore` (clears `deleted_at` with 30-day grace period, 410 if expired). Updated GET endpoint with `includeArchived` and `deleted` query params — `deleted=true` shows only soft-deleted items, `includeArchived=true` includes archived. Added `ArchiveWorkItemRequest` and `WorkItemListQuery` types to shared/api.ts.
**Files:** `packages/backend/src/routes/work-items.ts`, `packages/shared/src/api.ts`

---

## 2026-04-01 20:58 PDT — Review: FND.WIL.2 (approved)

**Reviewed:** Soft delete and 409 guard for work items.
- 409 guard at :239-257: checks `executions.status = "running"` for all descendant IDs via `inArray` ✓
- Cascade-delete at :260-264: hard-deletes edges (both directions), comments, proposals, memories — prevents orphans ✓
- Soft delete at :267-271: `update().set({ deletedAt: now })` on all IDs ✓
- Default GET filters at :43-46: `isNull(deletedAt)` + `isNull(archivedAt)` always applied ✓
- GET by ID intentionally unfiltered — needed for restore (FND.WIL.3) ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 20:57 PDT — FND.WIL.2: Soft delete and 409 guard for work items

**Done:** Replaced hard-delete in `DELETE /api/work-items/:id` with soft delete. Added 409 guard that blocks deletion when any execution is `"running"` for the item or its descendants. Cascade-deletes `work_item_edges` (both directions), `comments`, `proposals`, `project_memories` for all descendant IDs before setting `deleted_at = now()`. Added `isNull(workItems.deletedAt)` and `isNull(workItems.archivedAt)` default filters to `GET /api/work-items` so deleted/archived items are hidden by default.
**Files:** `packages/backend/src/routes/work-items.ts`

---

## 2026-04-01 20:55 PDT — Review: FND.WIL.1 (approved)

**Reviewed:** Schema additions for work item lifecycle (archived_at, deleted_at).
- Schema columns in schema.ts:46-47: `integer("archived_at"/"deleted_at", { mode: "timestamp_ms" })` — nullable, correct type ✓
- Entity type in entities.ts:73-74: `archivedAt/deletedAt: string | null` — matches ✓
- Migration 0008: two clean ALTER TABLE ADD statements ✓
- Dashboard.ts:155-156: explicit WorkItem construction includes new fields with toIso() conversion ✓
- `serializeWorkItem()` uses spread — new columns flow through automatically ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 20:53 PDT — FND.WIL.1: Add archived_at and deleted_at columns to work_items

**Done:** Added `archivedAt` (integer, timestamp_ms) and `deletedAt` (integer, timestamp_ms) nullable columns to `workItems` table in schema.ts. Added matching `archivedAt: string | null` and `deletedAt: string | null` fields to `WorkItem` interface in entities.ts. Generated Drizzle migration `0008_glamorous_young_avengers.sql`. Fixed type error in dashboard.ts where explicit `WorkItem` construction needed the new fields.
**Files:** `packages/backend/src/db/schema.ts`, `packages/shared/src/entities.ts`, `packages/backend/drizzle/0008_glamorous_young_avengers.sql` (new), `packages/backend/drizzle/meta/*`, `packages/backend/src/routes/dashboard.ts`
**Notes:** `serializeWorkItem()` in work-items.ts uses `...row` spread so new columns flow through automatically. `WorkItemRow` in core package not updated (separate concern for FND.WIL.2+).

---

## 2026-04-01 20:50 PDT — Review: FND.ERR.7 (approved)

**Reviewed:** Pre-migration SQLite backup in migrate.ts.
- `sqlite.backup()` creates `${DB_PATH}.pre-migration-${timestamp}.bak` before `migrate()` — matches spec ✓
- `pruneOldBackups()` keeps only 3 most recent, runs after migration (not inside backup try/catch) — correct failure semantics ✓
- `existsSync(DB_PATH)` guard skips backup on first startup ✓
- `start.ts` awaits the now-async `runMigrations()`, CLI entry uses `.then()` ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 20:49 PDT — FND.ERR.7: Pre-migration SQLite backup

**Done:** Made `runMigrations()` async and added a pre-migration backup step using `sqlite.backup()`. Creates `${DB_PATH}.pre-migration-${timestamp}.bak` before running Drizzle migrations. After migration succeeds, prunes old backups keeping only the 3 most recent. Skips backup on first startup (DB doesn't exist yet). Updated `start.ts` to `await runMigrations()`.
**Files:** `packages/backend/src/db/migrate.ts`, `packages/backend/src/start.ts`

---

## 2026-04-01 20:44 PDT — Review: FND.ERR.6 (approved)

**Reviewed:** Interrupted execution status for orphan recovery.
- `ExecutionStatus` in entities.ts:20 now includes `"interrupted"` — correct file (task spec said types.ts but type lives in entities.ts) ✓
- `recoverOrphanedState()` in start.ts:74-89: `status: "interrupted"`, `error: { category: "interrupted", message: "Server restarted during execution" }`, keeps `outcome: "failure"` and `completedAt` — all correct ✓
- WHERE clause unchanged (still finds `"running"` or `"pending"` orphans) ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 20:43 PDT — FND.ERR.6: Add interrupted execution status for orphan recovery

**Done:** Added `"interrupted"` to `ExecutionStatus` union type in `packages/shared/src/entities.ts`. Updated `recoverOrphanedState()` in `start.ts` to set `status: "interrupted"` (instead of `"failed"`), with structured `error: { category: "interrupted", message: "Server restarted during execution" }`. Existing frontend code that checks `"completed" || "failed"` is unaffected — `"interrupted"` is a distinct terminal state.
**Files:** `packages/shared/src/entities.ts`, `packages/backend/src/start.ts`

---

## 2026-04-01 20:42 PDT — Review: FND.ERR.5 (approved)

**Reviewed:** Structured error JSON column on executions.
- Schema column at schema.ts:159: `text("error", { mode: "json" }).$type<{ category, message, details? } | null>()` — matches spec, nullable for existing rows ✓
- Migration `0007_purple_songbird.sql`: `ALTER TABLE executions ADD error text` + chat_sessions FK drift fix (data-preserving) ✓
- Catch block at execution-manager.ts:682-696: classifies `sdk_error`/`configuration_error`/`unknown`, sets `error: { category, message }` ✓
- Work item not found path at :361 also sets structured error — both failure paths covered ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 20:41 PDT — FND.ERR.5: Structured error JSON column on executions

**Done:** Added `error` JSON column to `executions` table in schema.ts (type: `{ category: string; message: string; details?: Record<string, unknown> } | null`). Generated Drizzle migration `0007_purple_songbird.sql`. Updated catch block in execution-manager.ts to classify errors into `sdk_error`, `configuration_error`, or `unknown` and set the `error` column. Also updated the "work item not found" failure path to use `configuration_error` category.
**Files:** `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0007_purple_songbird.sql` (new), `packages/backend/drizzle/meta/*`, `packages/backend/src/agent/execution-manager.ts`
**Notes:** Migration also reconciles a chat_sessions FK drift (onDelete cascade) — safe, data-preserving recreation.

---

## 2026-04-01 20:38 PDT — Review: FND.ERR.4 (approved)

**Reviewed:** WS connection state indicator in status bar and Agent Monitor.
- `ws-client.ts`: `_status`/`statusListeners`/`setStatus()` with deduplication (:124-128); status set in `onopen` (:66), `onclose` (:87/:90), `disconnect()` (:110) — all transitions correct
- `use-ws-status.ts`: `useSyncExternalStore(onWsStatusChange, getWsStatus)` — correct React external store pattern, stable subscribe reference
- `status-bar.tsx`: tri-state dot (green/amber-pulse/red) at :77-93; removed unused `isHealthy`, kept `useHealth` for `executorMode` ✓
- `terminal-renderer.tsx`: amber banner at :609-617 when `wsStatus !== "connected"` — matches existing progress bar styling
- No memory leaks: unsubscribe returned from `onStatusChange`, `useSyncExternalStore` handles cleanup
- Build passes; visual check confirmed by worker
- **Verdict: approved.**

---

## 2026-04-01 20:36 PDT — FND.ERR.4: WS connection state indicator

**Done:** Added tri-state WS connection indicator. Added `_status`/`statusListeners`/`setStatus()` to `RealWsClient` — tracks `connected`/`reconnecting`/`disconnected` via `onopen`/`onclose`/`disconnect()`. Exposed via `ws.ts` facade (`getWsStatus`, `onWsStatusChange`). Created `useWsStatus()` hook using `useSyncExternalStore`. Updated status bar: replaced static Healthy/Unhealthy with green dot (connected), amber pulsing dot (reconnecting), red dot (disconnected). Added amber "Connection lost — reconnecting" banner in `TerminalRenderer` when WS is not connected. Visual check: status bar shows "Disconnected" correctly; Agent Monitor layout clean.
**Files:** `packages/frontend/src/api/ws-client.ts`, `packages/frontend/src/api/ws.ts`, `packages/frontend/src/hooks/use-ws-status.ts` (new), `packages/frontend/src/hooks/index.ts`, `packages/frontend/src/components/status-bar.tsx`, `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`

---

## 2026-04-01 20:33 PDT — Review: FND.ERR.3 (approved)

**Reviewed:** React error boundaries at app and page level.
- `error-boundary.tsx`: two class components with `componentDidCatch` + `getDerivedStateFromError` — correct React pattern
- `AppErrorBoundary`: wraps full tree (QueryClientProvider + RouterProvider) in app.tsx:9-13; fallback: "Something went wrong." + [Reload] ✓
- `PageErrorBoundary`: wraps all 7 pages individually in router.tsx:16-22; fallback: "Page error." + [Go to Dashboard] (raw `<a>` — correct for error state) + [Retry] (resets error state) ✓
- Uses shadcn Button, Tailwind dark-mode classes (`bg-background`, `text-foreground`) — follows conventions
- Build passes; visual check by worker confirms dashboard renders normally
- **Verdict: approved.**

---

## 2026-04-01 20:31 PDT — FND.ERR.3: Add React error boundaries at app and page level

**Done:** Created `error-boundary.tsx` with two class components: `AppErrorBoundary` (wraps full tree in app.tsx, fallback: "Something went wrong. [Reload]") and `PageErrorBoundary` (wraps each page in router.tsx, fallback: "Page error. [Go to Dashboard] [Retry]"). Both use `componentDidCatch` for error logging. AppErrorBoundary wraps QueryClientProvider+RouterProvider. Each of the 7 page routes wrapped individually with PageErrorBoundary. Visual check confirms dashboard renders normally with boundaries in place.
**Files:** `packages/frontend/src/components/error-boundary.tsx` (new), `packages/frontend/src/app.tsx`, `packages/frontend/src/router.tsx`

---

## 2026-04-01 20:28 PDT — Review: FND.ERR.2 (approved)

**Reviewed:** WS reconnect exponential backoff + jitter in ws-client.ts.
- `reconnectAttempt` counter at :45, reset in `onopen` at :61, incremented after delay computation at :143
- Formula `Math.min(1000 * 2^attempt, 30_000) + 20% jitter` at :140-142 — correct exponential curve
- Timing verified: attempt 1 ≥2s, attempt 3 ≥8s, cap at 30s — matches acceptance criteria
- `disconnect()` correctly clears timer; counter resets on next successful open
- Build passes cleanly
- **Verdict: approved.**

---

## 2026-04-01 20:27 PDT — FND.ERR.2: WS reconnect exponential backoff + jitter

**Done:** Replaced fixed 3s WS reconnect with exponential backoff + jitter. Added `reconnectAttempt` counter, reset on successful connection in `onopen`. Formula: `Math.min(1000 * 2^attempt, 30_000) + 20% jitter`. Delays: 1s → 2s → 4s → 8s → 16s → 30s cap.
**Files:** `packages/frontend/src/api/ws-client.ts`

---

## 2026-04-01 20:26 PDT — Review: FND.ERR.1 (approved)

**Reviewed:** busy_timeout and synchronous PRAGMAs added to SQLite connection.
- Lines 31-32 in connection.ts: `busy_timeout = 5000` and `synchronous = NORMAL` added after existing WAL/FK pragmas — correct position, correct syntax
- No extraneous changes; follows existing pragma pattern exactly
- Build passes cleanly (tsc + vite)
- **Verdict: approved.**

---

## 2026-04-01 20:24 PDT — FND.ERR.1: Add busy_timeout and synchronous PRAGMAs

**Done:** Added `busy_timeout = 5000` and `synchronous = NORMAL` PRAGMAs to SQLite connection after existing WAL/FK pragmas. These improve reliability under concurrent access (5s wait before SQLITE_BUSY) and balance durability with performance (NORMAL sync is safe with WAL mode).
**Files:** `packages/backend/src/db/connection.ts`
