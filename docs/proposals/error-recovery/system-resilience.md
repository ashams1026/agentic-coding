# System-Level Resilience and Data Integrity

> Research proposal for WebSocket resilience, concurrent write safety, database integrity, and frontend fault tolerance in Woof.

---

## 1. WebSocket Disconnection

### Current State Audit

#### WS Client (`ws-client.ts`)

| Aspect | Current Behavior | Location |
|--------|-----------------|----------|
| Reconnection delay | Fixed 3000ms | `scheduleReconnect()`, line 141 |
| Backoff strategy | None — same 3s every time | Line 136-142 |
| Max retries | Unlimited (reconnects forever) | `shouldReconnect` flag, line 44 |
| Subscription survival | Listeners stay in memory across reconnects | Set-based storage, lines 24-40 |
| Missed event recovery | None — events during disconnect are lost | No replay mechanism |
| Reconnect notification | Fires `reconnectCallbacks` (line 60-62), which triggers TanStack Query invalidation | `useWsQuerySync()` hook |

#### WS Server (`ws.ts`)

| Aspect | Current Behavior | Location |
|--------|-----------------|----------|
| Client tracking | `Set<WebSocket>` | Line 6 |
| Disconnect cleanup | Removes client from Set on `close`/`error` | Lines 53-61 |
| Subscription model | Broadcast-only — all events to all clients | `broadcast()`, lines 12-19 |
| Event replay | None | No event history stored |
| Welcome message | Sent on connect | Line 64 |

#### Agent Monitor (`terminal-renderer.tsx`)

- Subscribes to `agent_output_chunk` events (line 406)
- Initial logs loaded via HTTP (lines 367-378)
- **If WS disconnects mid-execution:** New chunks stop arriving. Terminal appears frozen. No disconnection indicator.
- **On reconnect:** TanStack Query invalidation refetches execution data, but streaming chunks received during the gap are lost permanently.

### Proposed Improvements

#### 1a. Exponential Backoff with Jitter

Replace fixed 3s delay with exponential backoff:

```typescript
private reconnectAttempt = 0;

private scheduleReconnect(): void {
  const baseDelay = 1000;
  const maxDelay = 30_000;
  const delay = Math.min(baseDelay * 2 ** this.reconnectAttempt, maxDelay);
  const jitter = delay * 0.2 * Math.random(); // 0-20% jitter
  this.reconnectTimer = setTimeout(() => {
    this.reconnectAttempt++;
    this.connect();
  }, delay + jitter);
}

// Reset on successful connection
private onOpen(): void {
  this.reconnectAttempt = 0;
}
```

This prevents reconnect storms when the backend restarts (all clients reconnecting simultaneously at 3s).

#### 1b. Connection State Indicator

Add a visible connection status to the UI:

- **Status bar:** Already has health indicator (`status-bar.tsx:16`). Extend with WS connection state: "Connected" (green dot), "Reconnecting..." (amber pulse), "Disconnected" (red dot with retry countdown).
- **Agent Monitor:** Banner at top of terminal when WS is disconnected: "Connection lost — reconnecting in Xs. Live output paused."

#### 1c. Event Replay (Phase 2)

Server-side event buffer for reconnection recovery:

1. Server stores last N events per client (or per execution) in a ring buffer (in-memory, 1000 events max)
2. Each event gets a monotonic sequence number
3. On reconnect, client sends `lastSeenSeq` in the WS handshake
4. Server replays events from `lastSeenSeq + 1` to current

**Trade-off:** This adds memory overhead (~100KB per active execution). Acceptable for a local-first app with 3 concurrent agents. For Phase 1, the existing "refetch on reconnect" via TanStack Query is sufficient for data correctness — event replay is a UX improvement for streaming output.

#### 1d. Agent Monitor Recovery

On WS reconnect during an active execution:

1. Refetch execution data via HTTP (`GET /api/executions/:id`)
2. Compare last known log position with server's current log length
3. If gap exists: fetch missing log content and append to terminal
4. Resume WS subscription for live chunks

This requires the backend to persist execution logs incrementally (the `logs` column on `executions` is already appended to during execution).

---

## 2. Concurrent Write Safety

### SQLite Configuration (`connection.ts`)

Current PRAGMA settings (lines 29-30):

```sql
PRAGMA journal_mode = WAL;   -- Write-Ahead Logging: concurrent reads during writes
PRAGMA foreign_keys = ON;    -- Enforce FK constraints
```

**Missing PRAGMAs:**

| PRAGMA | Recommended Value | Why |
|--------|-------------------|-----|
| `busy_timeout` | `5000` (5 seconds) | Without this, concurrent writes that hit SQLite's lock immediately get `SQLITE_BUSY`. With it, SQLite waits up to 5s for the lock to release. Critical with 3 concurrent agents. |
| `synchronous` | `NORMAL` (current default is `FULL`) | `FULL` fsync's every transaction. `NORMAL` with WAL is crash-safe and ~2x faster. SQLite docs recommend `NORMAL` for WAL mode. |
| `wal_autocheckpoint` | `1000` (default, confirm) | Auto-checkpoint every 1000 pages. Prevents WAL file from growing unbounded. |

**Recommendation:** Add `busy_timeout = 5000` as Phase 1 — this is the most impactful missing PRAGMA. Without it, `SQLITE_BUSY` errors will occur under concurrent agent load.

### Write Serialization

better-sqlite3 is **synchronous** — all operations run on the main Node.js thread. This means:

1. **DB writes are already serialized** — Node.js single-threaded execution guarantees no two Drizzle queries run simultaneously within the same process.
2. **WAL mode** allows concurrent reads from other connections (e.g., if a second process reads the DB).
3. **No explicit locking needed** for DB operations in the backend — the single-process architecture handles this.

**Caveat:** If Woof ever moves to a multi-process architecture (e.g., worker threads for agent execution), write serialization breaks. The `busy_timeout` PRAGMA becomes essential in that scenario.

### File System Conflicts (Agent-to-Agent)

When two agents modify the same file on disk (not DB), there is **no protection**:

1. No file-level locking in the executor
2. No conflict detection between concurrent executions
3. Agent A's writes can be silently overwritten by Agent B

**Current mitigation:** `DEFAULT_MAX_CONCURRENT = 3` limits parallelism. The workflow router typically assigns agents to different work items, which usually touch different files. But this is not guaranteed.

**Proposed approach:** See RES.COLLAB.COORD (`docs/proposals/agent-collaboration/coordination.md`) — advisory file-level locking and branch-per-agent strategies. For this proposal: add a warning in the Agent Monitor if two concurrent executions modify the same file (detect via `file_changed` WS events, compare paths).

---

## 3. Database Integrity

### Migration Handling (`migrate.ts`)

```typescript
migrate(db, { migrationsFolder: "./drizzle" });
```

- 7 migration files (0000-0006) in `packages/backend/drizzle/`
- `_journal.json` tracks applied migrations with timestamps
- **No rollback support** — Drizzle's SQLite migrator doesn't support automatic rollback on failure
- **Partial failure:** If a migration SQL statement fails mid-file, the transaction aborts. The migration is not marked as applied, so it will re-run on next startup. However, if the failure is due to a schema conflict (e.g., table already exists from a partial run), manual intervention is needed.

### Proposed Improvements

#### 3a. Pre-Migration Backup

Before running migrations, automatically backup the DB:

```typescript
async function migrateWithBackup(): Promise<void> {
  const dbPath = getDbPath();
  const backupPath = `${dbPath}.pre-migration-${Date.now()}`;
  
  // SQLite .backup command via better-sqlite3
  db.backup(backupPath);
  
  try {
    migrate(db, { migrationsFolder: "./drizzle" });
  } catch (err) {
    logger.error("Migration failed — backup at:", backupPath);
    throw err;
  }
  
  // Clean up old backups (keep last 3)
  cleanupOldBackups(dbPath, 3);
}
```

better-sqlite3's `.backup()` method creates a consistent snapshot even while the DB is in use (it uses SQLite's online backup API). This is the safest approach for a local-first app.

#### 3b. Integrity Checks

Run periodic PRAGMA checks:

```sql
PRAGMA integrity_check;      -- Full B-tree validation (slow, ~seconds for large DBs)
PRAGMA quick_check;           -- Lighter check (skips row data verification)
PRAGMA foreign_key_check;     -- Verify all FK references are valid
```

**When to run:**
- `integrity_check`: On first startup after update (migration context)
- `quick_check`: On every startup (fast, catches most corruption)
- `foreign_key_check`: After every migration (catches orphaned records)

#### 3c. Recovery from Corruption

If `quick_check` fails on startup:

1. Log the error with specific page/table information
2. Attempt `PRAGMA integrity_check` for full diagnosis
3. If the DB is unrecoverable: check for the most recent `.pre-migration-*` backup. If found, offer to restore.
4. If no backup: create a fresh DB and log a warning. The user loses data but can start working.

**UI surface:** Settings > Data Management (future) should show DB health status and available backups.

---

## 4. Frontend Resilience

### React Error Boundaries

**Current state: None.** Zero ErrorBoundary components exist in the frontend. A component crash (e.g., bad data in Agent Monitor, rendering error in a chart) crashes the entire React tree — the user sees a white screen.

### Proposed Error Boundaries

Add granular error boundaries per feature area:

| Boundary | Wraps | Fallback UI |
|----------|-------|-------------|
| `AppErrorBoundary` | Entire app (outermost) | "Something went wrong. [Reload]" with error details in dev mode |
| `PageErrorBoundary` | Each page component (Dashboard, Work Items, etc.) | "This page encountered an error. [Go to Dashboard] [Retry]" |
| `PanelErrorBoundary` | Detail panel, Agent Monitor terminal, Pico chat | "This panel encountered an error. [Close panel] [Retry]" |

**Implementation:** React's `componentDidCatch` / `ErrorBoundary` class, or the `react-error-boundary` package (2KB, well-maintained). Each boundary:
1. Catches the error
2. Logs to console with component stack
3. Shows a styled fallback (not a raw error)
4. Offers a "Retry" button that resets the boundary state

**Key principle:** Agent Monitor crash should not take down Work Items. Pico crash should not affect the main app. Each feature area is isolated.

### Offline Detection and Graceful Degradation

**Current state:**
- `useHealth()` hook polls `/api/health` every 30s (use-health.ts:8)
- Status bar shows "Healthy"/"Unhealthy" badge (status-bar.tsx:16)
- Error toasts on API failures (`showErrorToast()` at client.ts:53-59)
- **No operation blocking** — users can attempt writes on unreachable backend (they'll get error toasts)

**Proposed degradation tiers:**

| Tier | Condition | UI Behavior |
|------|-----------|-------------|
| **Connected** | Health check passes, WS connected | Full functionality |
| **Degraded** | Health check passes, WS disconnected | Banner: "Real-time updates paused." Data visible but not live. Manual refresh button. |
| **Disconnected** | Health check fails | Banner: "Backend unreachable." Read-only mode: cached data visible, write operations disabled (buttons grayed out with tooltip "Backend offline"). Reconnect polling every 10s. |
| **Offline** | Navigator.onLine === false | Banner: "You're offline." Same as Disconnected. Resume on `online` event. |

### Stale Cache Handling

**Current TanStack Query config** (`query-client.ts`):
- `staleTime: 30_000` (30 seconds)
- `refetchOnWindowFocus: false`
- `retry: 1`

**On WS reconnect:** `useWsQuerySync()` invalidates all queries, forcing a refetch. This is the primary cache freshness mechanism.

**Gap:** If the backend changes data while the frontend is disconnected for > 30s, the UI shows stale data until the next WS reconnect triggers invalidation. For the disconnected/offline tiers above, add a "Data may be stale" indicator on cached results older than 60s.

---

## 5. Implementation Approach

### Phase 1: Critical Resilience (3-4 tasks)

1. **SQLite PRAGMA:** Add `busy_timeout = 5000` and `synchronous = NORMAL` to `connection.ts`
2. **WS exponential backoff:** Replace fixed 3s with exponential backoff + jitter in `ws-client.ts`
3. **App ErrorBoundary:** Add top-level `AppErrorBoundary` + per-page `PageErrorBoundary` wrappers
4. **Connection status indicator:** WS state in status bar, "Reconnecting..." banner in Agent Monitor

### Phase 2: Data Safety (3-4 tasks)

5. **Pre-migration backup:** `db.backup()` before migrations, keep last 3 backups
6. **Integrity checks:** `quick_check` on startup, `integrity_check` after migration
7. **Offline degradation:** 4-tier connection state with read-only mode when disconnected
8. **Agent file conflict warning:** Detect overlapping file_changed events from concurrent executions

### Phase 3: Event Replay + Recovery (2-3 tasks)

9. **Server event buffer:** Ring buffer with sequence numbers, replay on reconnect
10. **Agent Monitor recovery:** HTTP log gap-fill on WS reconnect during active execution
11. **Corruption recovery:** Auto-detect and offer backup restore on startup

---

## 6. Cross-References

- **RES.RECOVERY.AGENTS** (`docs/proposals/error-recovery/agent-recovery.md`) — Agent-level error handling; execution manager retry policy; orphan detection. This doc covers system-level; AGENTS covers agent-level.
- **RES.COLLAB.COORD** (`docs/proposals/agent-collaboration/coordination.md`) — File-level locking for concurrent agents; advisory locking; branch-per-agent
- **RES.SWAP.ARCH** (`docs/proposals/frontend-backend-swappability/architecture.md`) — WS reconnection on backend switch; offline/disconnected state; 4-tier degradation
- **RES.DATA.BACKUP** (pending) — Backup/restore strategy; pre-migration backup is Phase 1 here, full backup system is that proposal
- **RES.NOTIFY.UX** (`docs/proposals/notifications/ux-design.md`) — Connection loss notifications; "backend unreachable" as a critical notification event
- **WS Client** (`packages/frontend/src/api/ws-client.ts`) — Fixed 3s reconnect, no backoff, broadcast listeners
- **DB Connection** (`packages/backend/src/db/connection.ts`) — WAL mode, foreign_keys, missing busy_timeout

---

## 7. Design Decisions

1. **Exponential backoff over fixed delay for WS reconnection.** The current fixed 3s delay causes all clients to reconnect simultaneously after a server restart (thundering herd). Exponential backoff with jitter spreads reconnections over time. Max delay of 30s balances responsiveness with server load.

2. **`busy_timeout` PRAGMA as the highest-priority fix.** Without it, concurrent agent DB writes fail immediately with `SQLITE_BUSY` instead of waiting for the lock. This is a latent bug that manifests under load — adding the timeout is a one-line fix with significant reliability improvement.

3. **Pre-migration backup over transaction rollback.** SQLite supports transactional DDL (migrations can roll back), but Drizzle's migrator doesn't expose this. A file-level backup before migration is simpler, more reliable, and works even for catastrophic failures (process crash during migration).

4. **Granular error boundaries over a single top-level catch.** A single AppErrorBoundary prevents white-screen crashes but loses all UI state on any error. Per-page/per-panel boundaries contain failures — Agent Monitor can crash without affecting Work Items or Pico.

5. **Event replay deferred to Phase 3.** The existing "refetch on reconnect" via TanStack Query handles data correctness for most cases. Event replay is only needed for live streaming UX (Agent Monitor mid-execution). The workaround (HTTP log gap-fill) is simpler than a full event buffer system and covers the primary use case.

6. **Read-only mode over full offline support.** True offline support (optimistic mutations, sync queue) is complex and unlikely for a dev tool that requires a running backend to do useful work. Read-only degradation (show cached data, disable writes) gives the user feedback about the connection state without the complexity of an offline-first architecture.
