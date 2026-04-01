# Backup, Restore, and Data Export

> Research proposal for data safety, portability, and disaster recovery in Woof.

---

## 1. Backup Strategy

### Current State

**No backup mechanism exists.** The SQLite DB is a single file that grows unbounded. If it's corrupted or deleted, all data is lost.

**Database location** (`connection.ts`, lines 11-23):
- Production: `~/.agentops/data/agentops.db` (line 17)
- Development: `agentops-dev.db` (project root, line 23)
- Configurable via `AGENTOPS_DB_PATH` (line 11) or `DATABASE_URL` (line 12) env vars

**Sidecar files:** WAL mode (enabled at `connection.ts:29`) creates `agentops.db-wal` and `agentops.db-shm` alongside the main DB file. All three must be backed up together for a consistent snapshot.

### Proposed Backup Approaches

#### 1a. SQLite Online Backup API (Recommended)

better-sqlite3 exposes SQLite's `backup()` method, which creates a consistent point-in-time copy even while the DB is in use:

```typescript
const backupPath = `${dbPath}.backup-${Date.now()}`;
await db.backup(backupPath);
```

**Advantages:**
- Atomic: captures a consistent snapshot (no partial writes)
- Non-blocking: reads continue during backup; writes are briefly paused (WAL checkpoint)
- Fast: ~50ms for a 100MB DB
- Produces a single standalone `.db` file (no WAL/SHM sidecar needed in the backup)

This is the only correct approach for SQLite backup. File copy (`cp`) of the DB while it's open risks corruption if a write is in progress.

#### 1b. When to Back Up

| Trigger | Why | Implementation |
|---------|-----|---------------|
| **Before migration** | Protects against migration failures | `db.backup()` in `migrate.ts` before `migrate()` call. Already proposed in RES.RECOVERY.SYSTEM. |
| **Daily automatic** | Ongoing protection | `setInterval` or node-cron (if scheduling is implemented per RES.SCHED.INFRA) running `db.backup()` at a configurable time (default: 2am local) |
| **Manual (user-initiated)** | Before risky changes | "Back up now" button in Settings > Data Management |
| **Before destructive operations** | Before bulk delete, import, or clear | `db.backup()` before `DELETE /api/settings/executions` and `POST /api/settings/import` |

#### 1c. Backup Storage and Retention

**Location:** `~/.agentops/backups/` directory (sibling to `data/`).

**Naming convention:** `agentops-YYYY-MM-DD-HHmmss.db` (e.g., `agentops-2026-04-01-140000.db`)

**Retention policy:**
- Keep last 7 daily backups
- Keep last 4 weekly backups (Sunday)
- Total max: ~11 backup files
- At 100MB per backup (generous estimate), this is ~1.1GB — acceptable for local storage
- Configurable: `maxBackups` in `config.json` (default: 7)

**Cleanup:** After each successful backup, delete backups exceeding the retention limit (oldest first).

---

## 2. Restore

### Restore Flow

```
User clicks "Restore from backup" in Settings > Data Management
  │
  ▼
[SELECT BACKUP]
  Show list of available backups: name, date, size, schema version
  │
  ▼
[CONFIRM]
  Warning: "This will replace ALL current data. In-flight executions will be interrupted."
  Show current DB stats vs backup stats (row counts, size)
  Checkbox: "I understand this cannot be undone"
  │
  ▼
[PRE-RESTORE]
  1. Stop all active executions (interrupt + mark interrupted)
  2. Close all WS connections (clients will reconnect after restore)
  3. Create a backup of the CURRENT DB (safety net: "pre-restore-TIMESTAMP.db")
  │
  ▼
[RESTORE]
  1. Close the current DB connection
  2. Copy backup file over the current DB path
  3. Re-open the DB connection
  4. Run pending migrations (backup may be from an older schema version)
  5. Verify with PRAGMA quick_check
  │
  ▼
[POST-RESTORE]
  1. Re-seed built-in personas if missing (idempotent upsert)
  2. Broadcast "data_refreshed" WS event — all connected clients invalidate caches
  3. Log restore event to audit trail
  4. Show success toast: "Restored from backup (2026-04-01 14:00)"
```

### Schema Version Compatibility

The backup may be from an older schema version (fewer migration files applied). On restore:

1. Check the backup's `_journal.json` (Drizzle migration tracker) against current migrations
2. If the backup is behind: run pending migrations after restore. This should work because Drizzle migrations are additive (new tables/columns, not destructive changes).
3. If the backup is ahead of the current code (user downgraded): warn that the backup may contain data for tables/columns that don't exist in the current version. Proceed anyway — SQLite ignores unknown columns.

### In-Flight Execution Handling

If executions are running when restore is triggered:

1. The pre-restore step interrupts all active executions (reuses the graceful shutdown pattern from `start.ts`)
2. After restore, those executions won't exist in the restored DB — they're simply gone
3. The pre-restore backup captures the interrupted state if the user needs to recover

---

## 3. Export / Import

### Current State

**Partial export exists** (`settings.ts`, lines 148-160):
- `GET /api/settings/export` exports only: projects, personas, personaAssignments
- `POST /api/settings/import` (lines 229-297) imports the same 3 entities with `onConflictDoNothing()`
- **Missing:** work items, executions, comments, proposals, chat sessions, project memories

### Proposed Full Export

#### 3a. Project Export (Portable Archive)

Export a single project as a self-contained JSON archive:

```
POST /api/projects/:id/export
```

Response: JSON file download containing:

```typescript
interface ProjectExport {
  version: 1;
  exportedAt: string;
  project: Project;
  personas: Persona[];                    // personas assigned to this project
  personaAssignments: PersonaAssignment[];
  workItems: WorkItem[];
  workItemEdges: WorkItemEdge[];
  comments: Comment[];
  proposals: Proposal[];
  executions: Execution[];                // optional — can be very large
  projectMemories: ProjectMemory[];
  chatSessions: ChatSession[];
  chatMessages: ChatMessage[];            // optional — can be large
}
```

**Options query params:**
- `includeExecutions=true|false` (default: false — executions are often very large due to the `logs` column)
- `includeChat=true|false` (default: true)
- `since=YYYY-MM-DD` (export only data created after this date)

**File size estimate:** A project with 200 work items, 50 executions (without logs), 500 comments = ~2-5MB JSON. With execution logs: 50-200MB.

#### 3b. Selective Export

For sharing specific data between instances:

| Export Type | Entities | Use Case |
|-------------|----------|----------|
| Project (full) | All entities for one project | Move a project to another machine |
| Personas only | Personas + assignments | Share persona configs (extends existing export) |
| Work items only | Work items + edges + comments | Migrate task backlog |
| Workflow template | Workflow definition (future) | Share workflow designs (ties into RES.TEMPLATES) |

#### 3c. Import Flow

```
POST /api/projects/import
```

**Conflict resolution strategies:**

| Strategy | Behavior | When to Use |
|----------|----------|-------------|
| **Skip existing** (default) | `onConflictDoNothing()` — skip rows with matching IDs | Safe merge into existing data |
| **Overwrite** | `onConflictDoUpdate()` — replace matching rows | Sync from a newer export |
| **New project** | Assign fresh IDs to all entities; create a new project | Import as a copy alongside existing data |

**"New project" import:** The most useful for sharing between instances. All entity IDs are regenerated (using `createId()` from `@agentops/shared`), internal FKs are remapped (e.g., `workItem.projectId` → new project ID), and the result is a completely independent project.

### Relationship to RES.TEMPLATES

Templates (RES.TEMPLATES proposal at `docs/proposals/templates/design.md`) are a subset of export: a project template is a project export without execution history, comments, or chat. The export format should be a superset that templates can derive from:

```
ProjectExport (full) → strip executions/comments/chat → ProjectTemplate
```

---

## 4. Data Portability

### What Needs to Move

| Component | Location | Portable? |
|-----------|----------|-----------|
| SQLite DB | `~/.agentops/data/agentops.db` + WAL/SHM | Yes — copy the file (or use backup API) |
| Config file | `~/.agentops/config.json` | Yes — copy the file |
| Backup files | `~/.agentops/backups/*.db` | Yes — copy the directory |
| Project source code | User's code directories (referenced by `projects.path`) | **No** — must exist at the same paths on the new machine, or user updates project paths after move |
| Agent checkpoints | Claude SDK message IDs (stored in DB `checkpointMessageId`) | **No** — message IDs are API-specific; checkpoints are not transferable between machines |
| Node modules / app binary | Installed separately | No — user re-installs Woof on the new machine |

### Migration Guide

**Same machine (upgrade or reinstall):**
1. Data persists automatically — `~/.agentops/` is not deleted on uninstall
2. Run `woof start` — migrations auto-apply, data intact

**New machine:**
1. Install Woof on the new machine
2. Copy `~/.agentops/` directory from old machine (rsync, USB, cloud sync)
3. Run `woof start` — picks up existing DB and config
4. Update project paths if code directories are at different locations: Settings > Projects > edit path

**Alternative (project-level):**
1. On old machine: export each project via `POST /api/projects/:id/export`
2. On new machine: import via `POST /api/projects/import` with "New project" strategy
3. Personas come with the export; config must be re-entered (API key, port)

### Cross-Machine Sync (Not Recommended)

Woof is designed as a **single-user, single-machine** tool. Syncing the DB between machines (e.g., via Dropbox, iCloud) is not supported because:
- SQLite WAL mode requires exclusive file access
- Concurrent writes from two machines would corrupt the DB
- Agent checkpoints and project paths are machine-specific

For multi-machine use, the recommended approach is the hosted frontend model (RES.SWAP.HOSTED) with a centralized backend.

---

## 5. Disaster Recovery

### Failure Scenarios

| Scenario | Data Lost | Recovery Time | Recovery Steps |
|----------|-----------|---------------|---------------|
| **DB corrupted** (partial write, disk error) | Depends on corruption extent | 1-5 minutes | Restore from most recent backup. If no backup: `PRAGMA integrity_check` to assess; may need fresh DB. |
| **DB deleted** (accidental `rm`) | All data | 1-2 minutes if backup exists; total loss otherwise | Restore from backup or re-import from exports |
| **WAL file deleted** (partial) | Recent uncommitted writes | < 1 minute | SQLite auto-recovers on next open; WAL is rebuilt |
| **Config deleted** | API key, port settings | < 1 minute | Re-enter in Settings (config is lightweight) |
| **Machine lost** (stolen, hardware failure) | Everything unless backed up externally | 5-30 minutes | Reinstall Woof, restore from external backup (Time Machine, cloud) or re-import from project exports |
| **Accidental bulk delete** (user clears executions) | Execution history | 2-5 minutes | Restore from pre-operation backup (auto-created before destructive ops) |

### External Backup Recommendations

For users who want additional safety beyond Woof's built-in backups:

| Tool | Setup | Protects Against |
|------|-------|-----------------|
| **Time Machine** (macOS) | Automatic — already backs up `~/.agentops/` | Hardware failure, accidental deletion |
| **rsync to external drive** | `rsync -av ~/.agentops/ /Volumes/backup/agentops/` | Hardware failure |
| **Cloud sync** (git-ignored) | Add `~/.agentops/backups/` to cloud sync (NOT the live DB) | Machine loss |

**Important:** Do NOT sync the live `agentops.db` file via cloud services (Dropbox, iCloud). Only sync the `backups/` directory, which contains standalone snapshots safe for copying.

---

## 6. API Design

### Backup Endpoints

```
POST /api/settings/backup                  — Create a backup now
GET  /api/settings/backups                 — List available backups (name, date, size, schema version)
POST /api/settings/restore/:backupName     — Restore from a specific backup
DELETE /api/settings/backups/:backupName   — Delete a specific backup
```

### Export/Import Endpoints

```
POST /api/projects/:id/export?includeExecutions=false&includeChat=true
POST /api/projects/import                  — Import a project export
GET  /api/settings/export                  — (existing) Export personas/projects/assignments
POST /api/settings/import                  — (existing) Import personas/projects/assignments
```

### Settings UI

Settings > Data Management section:

```
┌─────────────────────────────────────────────────┐
│ Data Management                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│ Database                                         │
│   Size: 45.2 MB  |  Projects: 3  |  Executions: │
│   847  |  Work Items: 234                        │
│   Path: ~/.agentops/data/agentops.db             │
│                                                  │
│ Backups                                          │
│   Last backup: 2026-04-01 02:00 (42.1 MB)       │
│   [Back up now]  |  Auto-backup: Daily at 2am ▾  │
│                                                  │
│   Available backups:                             │
│   ┌──────────────────────────────────────────┐   │
│   │ 2026-04-01 02:00   42.1 MB   [Restore]  │   │
│   │ 2026-03-31 02:00   41.8 MB   [Restore]  │   │
│   │ 2026-03-30 02:00   40.5 MB   [Restore]  │   │
│   └──────────────────────────────────────────┘   │
│                                                  │
│ Export / Import                                  │
│   [Export all data]  [Import from file]           │
│   [Export project: ▾ My App  ]                   │
│                                                  │
│ Danger Zone                                      │
│   [Clear execution history (>30 days)]           │
│   [Compact database (VACUUM)]                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 7. Implementation Approach

### Phase 1: Core Backup/Restore (3-4 tasks)

1. **Backup API:** `POST /api/settings/backup`, `GET /api/settings/backups`, storage in `~/.agentops/backups/`
2. **Pre-migration backup:** Auto-backup before `migrate()` call (one-line addition to `migrate.ts`)
3. **Restore API:** `POST /api/settings/restore/:name` with execution interruption, schema migration, verification
4. **Settings UI:** "Data Management" section with backup list, "Back up now", restore buttons

### Phase 2: Export/Import + Scheduling (3-4 tasks)

5. **Project export:** `POST /api/projects/:id/export` with configurable entity inclusion
6. **Project import:** `POST /api/projects/import` with 3 conflict strategies (skip/overwrite/new project)
7. **Scheduled backups:** Daily auto-backup via `setInterval` or node-cron (if available from RES.SCHED.INFRA)
8. **Retention cleanup:** Auto-delete old backups beyond retention limit

### Phase 3: Portability + Safety (2-3 tasks)

9. **Pre-destructive backups:** Auto-backup before bulk delete and import operations
10. **Migration guide:** Documentation for moving Woof between machines
11. **Integrity check on restore:** `PRAGMA quick_check` after restore, with rollback to pre-restore backup on failure

---

## 8. Cross-References

- **RES.RECOVERY.SYSTEM** (`docs/proposals/error-recovery/system-resilience.md`) — Pre-migration backup (proposed as Phase 1 in both docs; deduplicate implementation), integrity checks, corruption recovery
- **RES.TEMPLATES** (`docs/proposals/templates/design.md`) — Project export as a superset of project templates; share export format
- **RES.DATA.GROWTH** (pending) — Retention policies affect backup size; cleanup tools in the same Settings UI section
- **RES.SCHED.INFRA** (`docs/proposals/scheduling/infrastructure.md`) — Scheduled backups could use the same scheduling infrastructure as agent schedules
- **RES.SWAP.HOSTED** (`docs/proposals/frontend-backend-swappability/hosted-frontend.md`) — Backend distribution (`npm install -g @woof/backend`) includes backup as part of the data story
- **Settings routes** (`packages/backend/src/routes/settings.ts`) — Existing export (lines 148-160), import (lines 229-297), db-stats (lines 116-135), execution cleanup (lines 137-146)
- **DB connection** (`packages/backend/src/db/connection.ts`) — DB path resolution (lines 11-23), WAL mode (line 29)

---

## 9. Design Decisions

1. **SQLite `backup()` API over file copy.** File-copying a live SQLite DB with WAL mode risks capturing an inconsistent state (main DB + partially-written WAL). The `backup()` API atomically snapshots the DB into a single standalone file. It's the only safe approach.

2. **Backup files as standalone `.db` snapshots, not incremental diffs.** Incremental backups (WAL replay, binary diffs) are complex and fragile. Full snapshots are simple, portable, and each backup is independently restorable. At ~100MB per backup with 11 retained, the storage cost (~1.1GB) is negligible for a local dev tool.

3. **Project export as JSON, not SQLite.** JSON is human-readable, inspectable, and tool-agnostic. A SQLite backup is better for full-instance restore, but JSON is better for sharing between instances (different IDs, different schemas, selective inclusion). The two serve different use cases.

4. **"New project" import strategy as the primary use case.** Most imports are about moving data between independent instances. Generating fresh IDs and remapping FKs creates a clean, conflict-free import. "Skip existing" and "Overwrite" are available for advanced users who know what they're doing.

5. **No cross-machine sync.** SQLite is not designed for concurrent access from multiple machines. Rather than building a fragile sync layer, we recommend the hosted frontend model for multi-machine access. This keeps the local-first architecture simple and reliable.

6. **External backups recommended but not managed.** Woof manages its own backup directory, but serious disaster recovery (hardware failure, theft) requires external backups. We document Time Machine/rsync as recommendations rather than building our own cloud backup feature — users already have these tools and trust them.
