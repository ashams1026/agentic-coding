# Data Growth and Retention Strategy

> Research proposal for understanding data growth patterns, retention policies, cleanup tools, and SQLite scaling in Woof.

---

## 1. What Grows Fast

### Storage Audit by Table

| Table | Key Large Columns | Growth Rate | Est. per 100 Entries |
|-------|-------------------|-------------|---------------------|
| **executions** | `logs` (text, unbounded), `summary` (text), `rejectionPayload` (JSON), `structuredOutput` (JSON) | Fastest — one per agent run | **10-50 MB** (logs are 100KB-500KB each for real agent runs) |
| **chat_messages** | `content` (text), `metadata` (JSON with tool details) | Fast — every Pico message | **1-5 MB** |
| **comments** | `content` (text), `metadata` (JSON) | Moderate — system + user comments per execution | **200-500 KB** |
| **work_items** | `description` (text), `context` (JSON), `executionContext` (JSON array) | Moderate — grows with each execution via context array | **500 KB-1 MB** |
| **proposals** | `payload` (JSON with child definitions, diffs) | Low — one per approval cycle | **100-300 KB** |
| **project_memories** | `summary` (text), `filesChanged` (JSON), `keyDecisions` (JSON) | Low — one per completed execution | **50-100 KB** |
| **personas** | `systemPrompt` (text) | Negligible — rarely changes | < 50 KB total |
| **projects** | `settings` (JSON) | Negligible | < 10 KB total |

### Growth Projections

**Assumptions:** 1 active project, 20 agent executions/day, 50 Pico chat messages/day, moderate tool call verbosity.

| Time Period | Executions | Chat Messages | DB Size Estimate |
|-------------|------------|---------------|-----------------|
| 1 week | 140 | 350 | 30-70 MB |
| 1 month | 600 | 1,500 | 120-300 MB |
| 3 months | 1,800 | 4,500 | 350-900 MB |
| 1 year | 7,300 | 18,250 | 1.5-3.5 GB |

**Primary growth driver: `executions.logs`.** The `logs` column stores the complete agent terminal output (every tool call, every text chunk, thinking blocks). Accumulated line-by-line in `execution-manager.ts:489` (`logs += chunk + "\n"`). A single complex execution (Engineer writing code across 10+ files) can produce 100-500KB of log text. This single column accounts for ~80% of DB growth.

### What's NOT in the DB

- **Agent checkpoint files** — stored as Claude API message IDs (`checkpointMessageId`), not on disk
- **Screenshots** — e2e test screenshots are in `tests/e2e/results/` (filesystem, not DB)
- **Project source code** — referenced by path (`projects.path`), not stored
- **WAL file** — `agentops.db-wal` grows temporarily during write bursts, auto-checkpointed back to main DB

---

## 2. Retention Policies

### Current State

**One cleanup mechanism exists** (`settings.ts:137-146`):
- `DELETE /api/settings/executions` — deletes executions older than 30 days
- Hardcoded 30-day threshold, no UI configuration
- **Does not cascade** — linked comments, proposals, and project memories are orphaned
- No automatic scheduling — user must manually trigger

### Proposed Retention Tiers

| Tier | Data | Default Retention | Configurable? | Cleanup Action |
|------|------|-------------------|---------------|---------------|
| **Hot** | Execution logs (verbose terminal output) | 30 days | Yes, per project | Truncate `logs` column to summary (keep first 500 chars + metadata). Don't delete the execution row. |
| **Warm** | Full execution records, chat messages | 90 days | Yes, per project | Delete execution rows + cascade to proposals/comments. Archive chat sessions. |
| **Cold** | Work items, personas, project memories | Never auto-delete | No | Manual delete via UI only. These are the user's project history. |
| **Ephemeral** | WS events, activity feed (in-memory) | Session lifetime | No | Already ephemeral — not stored in DB. |

### Key Insight: Truncate Logs, Don't Delete Executions

The `logs` column is the storage bottleneck (~80% of growth). But deleting entire execution rows loses valuable metadata (cost, duration, outcome, persona, timestamps). The better approach:

1. **After 30 days:** Replace `logs` with a truncated version: first 500 chars (the initial summary) + `[logs truncated — originally NNN bytes]`
2. **Keep:** `summary`, `outcome`, `costUsd`, `durationMs`, `startedAt`, `completedAt`, `personaId`, `workItemId`, `checkpointMessageId`
3. **Storage savings:** ~95% per execution (100KB log → 500 bytes)
4. **No data loss for analytics:** All cost/performance metrics remain queryable

### Retention Configuration

Store per-project in `projects.settings`:

```typescript
interface RetentionSettings {
  logRetentionDays: number;      // default: 30 — truncate logs after this
  executionRetentionDays: number; // default: 90 — delete executions after this
  chatRetentionDays: number;     // default: 90 — delete chat sessions after this
  autoCleanupEnabled: boolean;   // default: true
}
```

**Cleanup schedule:** Run on server startup (after recovery, before accepting connections) and daily via `setInterval`. Cleanup is idempotent — safe to run multiple times.

### Cascade Rules on Cleanup

When deleting old executions:

| Parent | Children | Action |
|--------|----------|--------|
| Execution deleted | Proposals | Delete (proposals are execution-specific) |
| Execution deleted | Comments (system-generated) | Delete (system comments like "Rate limit triggered" are execution-specific) |
| Execution deleted | Comments (user-written) | **Keep** — user comments on the work item are valuable even without the execution |
| Chat session deleted | Chat messages | Delete (cascade via `onDelete: "cascade"` already on schema) |
| Execution deleted | Project memories | **Keep** — memories are project-level summaries, not execution-specific |

---

## 3. SQLite Scaling

### Practical Limits

| Metric | SQLite Limit | Woof Expected (1 year) | Concern? |
|--------|-------------|----------------------|----------|
| **DB file size** | 281 TB (theoretical) | 1.5-3.5 GB | No — well within limits |
| **Row count per table** | 2^64 | ~7K executions, ~18K chat messages | No |
| **Query performance** (indexed) | < 1ms for 10M rows | < 1ms for 10K rows | No |
| **Query performance** (full scan) | Degrades linearly | 10-50ms for 10K rows | Acceptable |
| **Concurrent reads** (WAL mode) | Unlimited | 1-3 frontend clients | No |
| **Write throughput** (WAL mode) | ~100K inserts/sec | < 10 inserts/sec during execution | No |
| **Memory usage** | Page cache (configurable) | Default 2000 pages = ~8MB | No |

**Bottom line:** SQLite will not be a bottleneck for Woof at projected volumes. The DB size concern is storage cost (a 3GB file on a laptop), not performance.

### When SQLite Becomes Insufficient

SQLite is the right choice until:

1. **Multi-process writes** — if agents move to worker threads or separate processes, WAL's single-writer limitation becomes a bottleneck. Mitigation: `busy_timeout` PRAGMA (proposed in RES.RECOVERY.SYSTEM).
2. **Multi-user access** — if multiple users share a backend (hosted model), concurrent write contention increases. Mitigation: move to PostgreSQL.
3. **DB size > 10 GB** — at this point, backup time exceeds acceptable limits (backup of 10GB ≈ 5-10 seconds). Mitigation: aggressive log retention.

**PostgreSQL migration path:** Not recommended for Phase 1. Drizzle ORM supports both SQLite and PostgreSQL — a migration would require: (a) adding a `drizzle-orm/pg-core` schema variant, (b) a data migration script, (c) connection pool config. Estimated effort: 2-3 days of work. Keep as an option for the hosted/team tier (RES.SWAP.HOSTED).

### WAL Mode Performance

Current config: WAL enabled (`connection.ts:29`), no `busy_timeout`.

**Under concurrent agent load (3 agents):**
- Reads: non-blocking (WAL allows concurrent reads)
- Writes: serialized by Node.js single-thread (better-sqlite3 is synchronous)
- WAL file growth: temporary, auto-checkpointed at 1000 pages (default)
- **Risk:** Without `busy_timeout`, any external process (backup, monitoring tool) reading the DB could cause `SQLITE_BUSY` on writes. Already flagged in RES.RECOVERY.SYSTEM.

---

## 4. Cleanup Tools

### Settings > Data Management UI

Extend the existing `GET /api/settings/db-stats` endpoint (settings.ts:116-135) with per-table breakdown and add cleanup actions:

```
┌─────────────────────────────────────────────────────┐
│ Data Management                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Storage Breakdown                                    │
│ ┌─────────────────────────────────────────────────┐  │
│ │ ████████████████████░░░░░  312 MB total          │  │
│ │                                                  │  │
│ │ Execution logs   ████████████████  248 MB (80%)  │  │
│ │ Chat messages    ███                32 MB (10%)  │  │
│ │ Comments         █                 16 MB  (5%)   │  │
│ │ Work items       ░                  8 MB  (3%)   │  │
│ │ Other            ░                  8 MB  (2%)   │  │
│ └─────────────────────────────────────────────────┘  │
│                                                      │
│ Row Counts                                           │
│   Executions: 847  |  Chat: 2,340  |  Comments: 456 │
│   Work Items: 234  |  Proposals: 89  |  Memories: 67│
│                                                      │
│ Retention Settings                                   │
│   Log truncation:      [30 days ▾]                   │
│   Execution cleanup:   [90 days ▾]                   │
│   Chat cleanup:        [90 days ▾]                   │
│   Auto-cleanup:        [✓ Enabled]                   │
│                                                      │
│ Manual Cleanup                                       │
│   [Truncate old logs]  248 MB → ~5 MB estimated      │
│   [Clear old executions]  Remove 312 executions      │
│   [Clear old chat]  Remove 14 sessions               │
│   [Compact database (VACUUM)]  Reclaim ~45 MB        │
│                                                      │
│ ⚠ Danger Zone                                        │
│   [Delete ALL execution history]                     │
│   [Reset database]  Deletes everything, keeps config │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Per-Table Size Query

SQLite doesn't have a built-in per-table size function. Approximate via:

```sql
-- Estimate table size via page count
SELECT
  name,
  SUM(pgsize) as size_bytes
FROM dbstat
WHERE name IN ('executions', 'chat_messages', 'comments', 'work_items', 'proposals', 'project_memories')
GROUP BY name
ORDER BY size_bytes DESC;
```

**Note:** `dbstat` virtual table requires SQLite compiled with `SQLITE_ENABLE_DBSTAT_VTAB`. better-sqlite3 includes this by default.

### VACUUM

After large cleanup operations, run `VACUUM` to reclaim disk space:

```sql
VACUUM;
```

- Rewrites the entire DB file, removing free pages
- Can reduce file size by 30-50% after large deletions
- **Blocking:** Takes a write lock for the duration (seconds for a 300MB DB)
- **When to offer:** After cleanup removes > 20% of DB size, show "Compact database" button with estimated savings

---

## 5. Monitoring

### DB Health in Dashboard/Settings

Surface in the status bar or Settings:

| Metric | Warning Threshold | Critical Threshold | Display |
|--------|-------------------|-------------------|---------|
| DB size | > 500 MB | > 1 GB | Status bar tooltip: "Database: 312 MB" |
| WAL file size | > 100 MB | > 500 MB | Only show if abnormal (indicates checkpoint issues) |
| Execution count (30 days) | > 5,000 | > 10,000 | Settings only |
| Oldest un-truncated log | > 60 days | > 90 days | Settings: "312 logs older than 60 days — [Clean up]" |

### Slow Query Logging (Dev Mode Only)

In development, log queries that exceed a threshold:

```typescript
if (process.env.NODE_ENV === "development") {
  const start = performance.now();
  const result = stmt.all(...args);
  const elapsed = performance.now() - start;
  if (elapsed > 50) {
    logger.warn({ query: sql, elapsed: Math.round(elapsed) }, "Slow query detected");
  }
  return result;
}
```

**Threshold:** 50ms in dev mode. This catches unindexed full-table scans before they become production problems.

**Not in production:** better-sqlite3 is synchronous — timing every query adds overhead. In production, rely on the DB size monitoring instead.

---

## 6. Implementation Approach

### Phase 1: Visibility + Basic Cleanup (3-4 tasks)

1. **Enhanced db-stats:** Per-table size breakdown via `dbstat`, row counts per table
2. **Log truncation:** `POST /api/settings/cleanup/logs?olderThanDays=30` — truncate `logs` column, keep metadata
3. **Settings UI:** Storage breakdown visualization, retention settings, manual cleanup buttons
4. **Fix existing cleanup:** Add cascade to `DELETE /api/settings/executions` for proposals/comments

### Phase 2: Automatic Retention + VACUUM (2-3 tasks)

5. **Auto-cleanup:** Scheduled cleanup on startup + daily interval, per-project retention settings
6. **VACUUM button:** "Compact database" with size estimation, progress indicator
7. **Monitoring:** DB size in status bar tooltip, warning thresholds

### Phase 3: Advanced (2 tasks)

8. **Slow query logging:** Dev-mode query timing with 50ms threshold
9. **Export before cleanup:** Auto-export old data as JSON archive before deletion (ties into RES.DATA.BACKUP)

---

## 7. Cross-References

- **RES.DATA.BACKUP** (`docs/proposals/data-management/backup-restore.md`) — Backup size affected by retention; cleanup tools share the Settings > Data Management UI; pre-cleanup export
- **RES.RECOVERY.SYSTEM** (`docs/proposals/error-recovery/system-resilience.md`) — `busy_timeout` PRAGMA for concurrent access; `PRAGMA quick_check` for integrity; pre-migration backup
- **RES.ANALYTICS.METRICS** (`docs/proposals/analytics/metrics.md`) — Execution metrics (cost, duration, outcome) must survive log truncation; per-execution/persona aggregation queries
- **RES.SEARCH** (`docs/proposals/search/design.md`) — FTS5 index size is part of storage budget (~10.5 MB projected); retention should also clean FTS indexes
- **RES.SWAP.HOSTED** (`docs/proposals/frontend-backend-swappability/hosted-frontend.md`) — PostgreSQL migration path for team/hosted tier
- **Settings routes** (`packages/backend/src/routes/settings.ts`) — Existing db-stats (lines 116-135), execution cleanup (lines 137-146)
- **DB connection** (`packages/backend/src/db/connection.ts`) — WAL mode (line 29), no auto_vacuum

---

## 8. Design Decisions

1. **Truncate logs rather than delete executions.** Execution metadata (cost, duration, outcome, persona) is valuable for analytics and history even after the verbose logs are gone. Truncating `logs` to 500 chars saves ~95% of storage while preserving all queryable metrics. Full deletion is a separate, more aggressive tier.

2. **Per-project retention settings over global.** Different projects have different needs. A production project may want 90-day retention for audit trails. A scratch/experimental project may want 7-day retention to save space. Storing retention in `projects.settings` is the natural extension of existing per-project configuration.

3. **No automatic PostgreSQL migration path.** SQLite handles projected volumes easily (3.5GB after 1 year, 100K+ row queries in < 50ms). Building a PostgreSQL adapter adds complexity for a use case (multi-user hosted) that doesn't exist yet. Drizzle ORM makes this feasible when needed — estimated 2-3 days of work.

4. **VACUUM as manual action, not automatic.** VACUUM rewrites the entire DB file and takes a write lock. On a 1GB DB, this is 2-5 seconds of blocked writes. Running it automatically risks interrupting active agent executions. Better as a user-initiated action with a progress indicator and warning.

5. **`dbstat` for per-table sizes over manual page counting.** SQLite's `dbstat` virtual table gives accurate per-table page usage without needing to scan tables manually. better-sqlite3 includes the required `SQLITE_ENABLE_DBSTAT_VTAB` compile flag. This is the standard approach for SQLite storage analysis.

6. **Dev-mode slow query logging over production profiling.** better-sqlite3 is synchronous — wrapping every query in a timer adds measurable overhead. In development, where query patterns are being established, 50ms logging catches problems early. In production, DB size monitoring is sufficient.
