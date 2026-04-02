# Test Plan: Error Recovery Phase 1

## Objective

Verify the reliability improvements from Error Recovery Phase 1: SQLite PRAGMAs, WebSocket reconnection, error boundaries, connection indicators, structured errors, orphan recovery, and pre-migration backups.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (at least one project, some work items)
- chrome-devtools MCP connected
- Terminal access for backend restart tests (TC-ERR-7, TC-ERR-8)

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues alongside the functional pass/fail.

### TC-ERR-1: Backend starts with busy_timeout PRAGMA active

1. **Query** the SQLite database PRAGMAs via the backend
   - Run: `curl http://localhost:3001/api/health` to verify backend is running
   - Read file: `packages/backend/src/db/connection.ts`
   - Verify: `PRAGMA busy_timeout = 5000` is present after WAL/FK pragmas
   - Verify: `PRAGMA synchronous = NORMAL` is present

2. **Verify** via evaluate_script or backend log
   - Expected: busy_timeout is set to 5000ms
   - Expected: synchronous mode is NORMAL (not FULL or OFF)

3. **Verify** backend starts without SQLite errors
   - Check backend logs (stdout/stderr) for any PRAGMA-related errors
   - Expected: no errors; backend starts cleanly

### TC-ERR-2: WS reconnection uses exponential backoff

1. **Navigate** to `http://localhost:5173/`
   - Verify: status bar shows connection state
   - **Screenshot checkpoint**

2. **Read** `packages/frontend/src/api/ws-client.ts`
   - Verify: `reconnectAttempt` counter exists, reset in `onopen`
   - Verify: delay formula is `Math.min(1000 * 2^attempt, 30_000)` with jitter
   - Expected delays: ~1s → ~2s → ~4s → ~8s → ~16s → ~30s cap

3. **Verify** reconnection timing (code inspection)
   - Check: `reconnectAttempt` incremented after delay computation
   - Check: jitter is ~20% of base delay
   - Check: cap at 30 seconds (`30_000`)
   - Check: `disconnect()` clears reconnection timer

### TC-ERR-3: Page-level error boundary catches thrown error and shows fallback

1. **Navigate** to `http://localhost:5173/`
   - Verify: dashboard loads normally
   - **Screenshot checkpoint**

2. **Read** `packages/frontend/src/components/error-boundary.tsx`
   - Verify: `AppErrorBoundary` class component with `componentDidCatch` exists
   - Verify: `PageErrorBoundary` class component exists
   - Verify: `AppErrorBoundary` fallback shows "Something went wrong." + [Reload]
   - Verify: `PageErrorBoundary` fallback shows "Page error." + [Go to Dashboard] + [Retry]

3. **Read** `packages/frontend/src/app.tsx`
   - Verify: `AppErrorBoundary` wraps the top-level tree (QueryClientProvider + RouterProvider)

4. **Read** `packages/frontend/src/router.tsx`
   - Verify: each page route is individually wrapped with `PageErrorBoundary`
   - Expected: all 7 pages (Dashboard, Work Items, Agent Monitor, Activity, Chat, Personas, Settings) wrapped

5. **Verify** fallback does not show during normal operation
   - Navigate to each main page: `/`, `/items`, `/agents`, `/activity`, `/personas`, `/settings`
   - Expected: no error boundary fallback visible; pages render normally

### TC-ERR-4: Status bar reflects WS connection state

1. **Navigate** to `http://localhost:5173/`
   - **Screenshot checkpoint**

2. **Verify** status bar shows connection indicator
   - Check: bottom status bar has a colored dot + text indicating connection state
   - Expected states: "Connected" (green dot), "Reconnecting" (amber pulsing dot), "Disconnected" (red dot)
   - **Screenshot checkpoint**

3. **Read** `packages/frontend/src/components/status-bar.tsx`
   - Verify: `useWsStatus()` hook is used
   - Verify: tri-state rendering (connected/reconnecting/disconnected) with appropriate colors

4. **Read** `packages/frontend/src/hooks/use-ws-status.ts`
   - Verify: uses `useSyncExternalStore` with `onWsStatusChange` and `getWsStatus`
   - Expected: correct React external store pattern

5. **Verify** current state matches UI
   - If backend WS is running: expect green "Connected"
   - If backend is down: expect red "Disconnected"
   - **Screenshot checkpoint** showing current state

### TC-ERR-5: Agent Monitor shows "Connection lost" banner on disconnect

1. **Navigate** to `http://localhost:5173/agents`
   - **Screenshot checkpoint**

2. **Read** `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`
   - Verify: amber "Connection lost" banner rendered when `wsStatus !== "connected"`
   - Check: banner uses amber color scheme matching existing progress bar styling

3. **Verify** banner visibility
   - If WS is disconnected: amber banner with "Connection lost — reconnecting" should be visible
   - If WS is connected: banner should NOT be visible
   - **Screenshot checkpoint**

### TC-ERR-6: Failed execution has structured `error` JSON with category

1. **Read** `packages/backend/src/db/schema.ts`
   - Verify: `executions` table has `error` column with type `text("error", { mode: "json" })`
   - Verify: type is `{ category: string; message: string; details?: Record<string, unknown> } | null`

2. **Read** `packages/backend/src/agent/execution-manager.ts`
   - Verify: catch block classifies errors into categories: `sdk_error`, `configuration_error`, `unknown`
   - Verify: error object `{ category, message }` is set on the execution row
   - Verify: "work item not found" path also sets `configuration_error` category

3. **Read** migration file `packages/backend/drizzle/0007_purple_songbird.sql`
   - Verify: `ALTER TABLE executions ADD error text` is present
   - Expected: column is nullable (existing rows have null)

4. **Verify** via API (if a failed execution exists)
   - `GET /api/executions` — find any execution with `status: "failed"` or `status: "interrupted"`
   - Check: `error` field is either null (pre-migration) or `{ category, message }` object

### TC-ERR-7: Orphaned executions show `interrupted` status after server restart

1. **Read** `packages/shared/src/entities.ts`
   - Verify: `ExecutionStatus` type includes `"interrupted"`

2. **Read** `packages/backend/src/start.ts`
   - Verify: `recoverOrphanedState()` function exists
   - Verify: sets `status: "interrupted"` (not `"failed"`) for orphaned executions
   - Verify: sets structured error `{ category: "interrupted", message: "Server restarted during execution" }`
   - Verify: WHERE clause finds `status = "running"` or `status = "pending"` executions

3. **Verify** recovery runs at startup
   - Check: `recoverOrphanedState()` is called during backend startup in `start.ts`
   - Expected: any executions left in "running"/"pending" state from a previous crash get set to "interrupted"

### TC-ERR-8: Pre-migration backup file is created on startup

1. **Read** `packages/backend/src/db/migrate.ts`
   - Verify: `runMigrations()` is async
   - Verify: calls `sqlite.backup()` to create `${DB_PATH}.pre-migration-${timestamp}.bak` before running migrations
   - Verify: `existsSync(DB_PATH)` guard skips backup on first startup (no DB yet)
   - Verify: `pruneOldBackups()` keeps only 3 most recent backups

2. **Read** `packages/backend/src/start.ts`
   - Verify: `await runMigrations()` is called during startup

3. **Check** for backup files
   - List files in `packages/backend/` matching `*.pre-migration-*.bak`
   - Expected: 0-3 backup files (pruned to max 3)
   - If any exist: verify they are valid SQLite databases (non-zero size)

## Expected Results

- busy_timeout PRAGMA is 5000ms and synchronous is NORMAL in connection.ts
- WS reconnection uses exponential backoff (1s → 2s → 4s → ... → 30s cap) with ~20% jitter
- Error boundaries wrap all pages individually + entire app tree
- Status bar shows tri-state WS indicator (green/amber/red)
- Agent Monitor has amber "Connection lost" banner when WS disconnected
- Executions `error` column stores `{ category, message }` JSON
- Orphaned executions get `interrupted` status with structured error on restart
- Pre-migration backup created before Drizzle migrations, pruned to max 3

### Visual Quality

- Status bar connection indicator: correct color, proper alignment, readable text
- Error boundary fallbacks (if triggered): centered, readable, buttons functional
- Agent Monitor banner: amber color, does not overlap content

## Failure Criteria

- busy_timeout PRAGMA missing or wrong value
- WS reconnect uses fixed delay instead of exponential backoff
- Error boundary missing from any page route or app root
- Status bar does not reflect WS connection state changes
- Connection lost banner does not appear when WS disconnected
- Failed execution has no structured error (raw string instead of JSON object)
- Orphaned executions not recovered to "interrupted" status
- No backup file created before migration (or backup exceeds 3-file limit)
