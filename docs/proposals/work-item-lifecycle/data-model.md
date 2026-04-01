# Work Item Delete & Archive — Data Model Research

Research into schema changes, cascade behavior, and API design for work item deletion and archival.

**Current state:** The DELETE endpoint (`DELETE /api/work-items/:id`) exists but only cascades to child work items via application-level BFS. It does NOT delete related records: executions, comments, proposals, project_memories, or work_item_edges are orphaned. No archive functionality exists. No FK in the schema has `onDelete: "cascade"` pointing to work_items.

---

## 1. Current Schema Relationships

### Tables referencing work_items

| Table | Column | FK | onDelete | Records per item (est.) |
|-------|--------|----|----------|------------------------|
| `work_items` | `parentId` | `workItems.id` | None | 0-10 children |
| `work_item_edges` | `fromId` | `workItems.id` | None | 0-5 edges |
| `work_item_edges` | `toId` | `workItems.id` | None | 0-5 edges |
| `executions` | `workItemId` | `workItems.id` | None | 0-20 executions |
| `comments` | `workItemId` | `workItems.id` | None | 0-50 comments |
| `proposals` | `workItemId` | `workItems.id` | None | 0-10 proposals |
| `project_memories` | `workItemId` | `workItems.id` | None | 0-5 memories |
| `chat_sessions` | `workItemId` | `workItems.id` | None | 0-3 sessions (future, per RES.CHAT.DATA) |

### Current DELETE behavior (application-level)

```
DELETE /api/work-items/:id
  1. BFS to collect all descendant IDs via parentId
  2. Delete work_items rows in reverse depth order
  3. ❌ Does NOT delete edges, executions, comments, proposals, memories
  → Orphaned records remain in all related tables
```

This is a **bug** regardless of the archive/delete feature — orphaned records should be cleaned up.

---

## 2. Soft Delete Approach

### Recommendation: Timestamp columns on work_items

Add two nullable timestamp columns to `work_items`:

```sql
ALTER TABLE work_items ADD COLUMN archived_at INTEGER;  -- timestamp_ms, NULL = active
ALTER TABLE work_items ADD COLUMN deleted_at INTEGER;    -- timestamp_ms, NULL = not deleted
```

### Why timestamps over separate archive table

| Approach | Pros | Cons |
|----------|------|------|
| **Timestamp columns** (recommended) | No data migration needed. Query filter is simple (`WHERE archived_at IS NULL AND deleted_at IS NULL`). Restore is just nulling the column. | Every query must include the filter. |
| **Separate archive table** | Clean separation. Active table stays lean. | Data migration on archive/restore. Schema duplication. Queries spanning both tables (search) need UNION. |
| **Status column** (`status: "active" | "archived" | "deleted"`) | Single column. | Can't have both archived_at and deleted_at timestamps. Loses "when was it archived/deleted" info. |

**Chosen: Timestamp columns** — simplest implementation, most flexibility, no data migration.

### Query filter pattern

All existing queries that list work items must add a default filter:

```typescript
// Helper
function activeWorkItems() {
  return and(
    isNull(workItems.archivedAt),
    isNull(workItems.deletedAt),
  );
}

// Usage in routes
const items = await db.select().from(workItems)
  .where(and(eq(workItems.projectId, projectId), activeWorkItems()));
```

The "Show archived" toggle in the UI sends a query parameter:
```
GET /api/work-items?projectId=xxx&includeArchived=true
```

Deleted items (soft-deleted, within 30-day grace) are only visible via:
```
GET /api/work-items?deleted=true  // Settings > Data recovery view
```

---

## 3. Cascade Rules

### On Archive

**Archive is non-destructive — no cascading deletes.** Related records are untouched:

| Related table | On archive | Rationale |
|---------------|-----------|-----------|
| Child work_items | **Archive recursively** (user choice: cascade or parent-only) | Per RES.LIFECYCLE.UX §2 |
| work_item_edges | Keep as-is | Edges remain valid; archived items can be unarchived |
| executions | Keep as-is | Execution history is preserved for reference |
| comments | Keep as-is | Comment history preserved |
| proposals | Keep as-is | Proposal history preserved |
| project_memories | Keep as-is | Memory records preserved |

**Router/dispatch check:** Before dispatching a new execution, check `archivedAt IS NULL`. If archived, skip dispatch silently.

### On Delete (soft delete)

Soft delete sets `deleted_at` timestamp. During the 30-day grace period, all related records remain intact (for potential restore).

### On Hard Delete (after 30-day grace period)

Hard delete must clean up ALL related records. Two strategies:

**Option A: Add onDelete CASCADE to schema (recommended for new tables)**

```typescript
// Future schema — add cascade to FKs
executions: {
  workItemId: text("work_item_id").references(() => workItems.id, { onDelete: "cascade" }),
}
comments: {
  workItemId: text("work_item_id").references(() => workItems.id, { onDelete: "cascade" }),
}
// ... same for proposals, project_memories, work_item_edges
```

**Option B: Application-level cascade (for existing schema without migration)**

```typescript
async function hardDeleteWorkItem(id: string) {
  const idsToDelete = await collectDescendantIds(id); // BFS

  for (const deleteId of idsToDelete) {
    await db.delete(workItemEdges).where(
      or(eq(workItemEdges.fromId, deleteId), eq(workItemEdges.toId, deleteId))
    );
    await db.delete(comments).where(eq(comments.workItemId, deleteId));
    await db.delete(proposals).where(eq(proposals.workItemId, deleteId));
    await db.delete(projectMemories).where(eq(projectMemories.workItemId, deleteId));
    // Executions: preserve or delete based on config (see below)
    await db.delete(workItems).where(eq(workItems.id, deleteId));
  }
}
```

### Special case: Executions

Executions contain cost data. Two options:

| Approach | Behavior | Recommendation |
|----------|----------|---------------|
| **Cascade delete** | Remove execution records when work item is hard-deleted | Loses cost history. Bad for accounting. |
| **Orphan (set null)** | Set `workItemId = NULL` on executions. Records remain for cost tracking. | **Recommended.** Preserves cost data. Execution list shows "(deleted work item)". |

```sql
-- On hard delete, orphan executions
UPDATE executions SET work_item_id = NULL WHERE work_item_id = ?;
-- Then delete the work item
DELETE FROM work_items WHERE id = ?;
```

This requires making `executions.workItemId` nullable:
```sql
-- Migration: allow null workItemId on executions
-- SQLite doesn't support ALTER COLUMN, so this needs a table rebuild
-- OR: just handle NULL in application code (execution rows with NULL workItemId are orphans)
```

**Pragmatic approach:** Since SQLite doesn't support `ALTER COLUMN`, don't change the column type. Instead, on hard delete:
1. Delete work_item_edges, comments, proposals, project_memories (cascade)
2. Keep executions as-is (they point to a deleted work_items row that no longer exists — orphaned but queryable by other columns)
3. Accept that some queries may need a LEFT JOIN to handle missing work items

---

## 4. API Design

### Archive endpoints

```
POST /api/work-items/:id/archive
  Body: { cascade?: boolean }  // default: true (archive children too)
  Response: { archivedCount: number }

POST /api/work-items/:id/unarchive
  Body: { cascade?: boolean }  // default: false (unarchive this item only)
  Response: { unarchivedCount: number }

POST /api/work-items/bulk/archive
  Body: { ids: string[], cascade?: boolean }
  Response: { archivedCount: number }

POST /api/work-items/bulk/unarchive
  Body: { ids: string[] }
  Response: { unarchivedCount: number }
```

**Why POST and not PATCH?** Archive is a named action with side effects (recursive cascading, dispatch blocking), not a simple field update. A dedicated endpoint makes the intent clear and allows for richer response (count of affected items).

### Delete endpoints

```
DELETE /api/work-items/:id
  Query: ?cascade=children|promote  // default: children (delete all descendants)
  Response: { deletedCount: number, willHardDeleteAt: string }
  Behavior: Sets deleted_at timestamp (soft delete)

DELETE /api/work-items/bulk
  Body: { ids: string[], cascade?: "children" | "promote" }
  Response: { deletedCount: number }

POST /api/work-items/:id/restore
  Response: { restoredCount: number }
  Behavior: Clears deleted_at timestamp (only during 30-day grace period)
```

### Hard delete (background job, no API)

A background job runs on server start and periodically:

```typescript
async function cleanupDeletedWorkItems() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const expired = await db.select({ id: workItems.id })
    .from(workItems)
    .where(and(isNotNull(workItems.deletedAt), lt(workItems.deletedAt, cutoff)));

  for (const item of expired) {
    await hardDeleteWorkItem(item.id);
  }
}
```

### List endpoint changes

```
GET /api/work-items?projectId=xxx
  Default: returns only active items (archived_at IS NULL AND deleted_at IS NULL)

GET /api/work-items?projectId=xxx&includeArchived=true
  Returns active + archived items (deleted_at IS NULL)

GET /api/work-items?deleted=true
  Returns only soft-deleted items (for recovery UI in Settings)
```

---

## 5. Impact on Agents

### Execution Manager checks

Before dispatching a new execution for a work item, the execution manager must check:

```typescript
async function canDispatch(workItemId: string): Promise<boolean> {
  const item = await db.select().from(workItems)
    .where(eq(workItems.id, workItemId))
    .get();

  if (!item) return false;                    // deleted
  if (item.archivedAt) return false;          // archived
  if (item.deletedAt) return false;           // soft-deleted
  return true;
}
```

This check goes in `dispatchForState()` in `packages/backend/src/agent/dispatch.ts`, before the persona lookup.

### Router behavior

When the router (`runRouter()`) evaluates a work item for auto-routing:
- If `archivedAt` is set: skip routing silently (item is frozen)
- If `deletedAt` is set: skip routing silently (item is pending deletion)

### Active execution during archive

Per RES.LIFECYCLE.UX §6:
1. Archive proceeds immediately (sets `archivedAt`)
2. Active execution finishes normally
3. After execution completes, `dispatchForState()` sees `archivedAt` and skips further dispatch
4. The execution result is saved to the `executions` table (not lost)

### Active execution during delete

Per RES.LIFECYCLE.UX §6:
1. API checks for active executions before allowing delete
2. If active: return `409 Conflict` with `{ activeExecutions: [...] }`
3. User must cancel or wait, then retry delete

```typescript
// In DELETE /api/work-items/:id handler
const activeExecs = await db.select().from(executions)
  .where(and(
    eq(executions.workItemId, id),
    eq(executions.status, "running"),
  ));

if (activeExecs.length > 0) {
  return reply.code(409).send({
    error: "Cannot delete — active executions",
    activeExecutions: activeExecs.map(e => ({ id: e.id, personaId: e.personaId })),
  });
}
```

---

## 6. Migration Plan

### Step 1: Schema changes

```sql
ALTER TABLE work_items ADD COLUMN archived_at INTEGER;
ALTER TABLE work_items ADD COLUMN deleted_at INTEGER;
```

### Step 2: Fix existing DELETE endpoint

Update `DELETE /api/work-items/:id` to:
- Set `deleted_at` instead of hard deleting
- Clean up orphaned edges (application-level cascade for edges, comments, proposals, memories)
- Check for active executions before allowing delete

### Step 3: Add archive endpoints

- `POST /api/work-items/:id/archive` and `/unarchive`
- Bulk variants
- Add `archivedAt`/`deletedAt` filter to all list queries

### Step 4: Add background cleanup job

- Register in `start.ts` alongside existing startup tasks
- Run on server start + every 6 hours
- Hard-delete work items where `deleted_at < now - 30 days`
- Cascade to edges, comments, proposals, memories
- Orphan execution records (keep for cost tracking)

### Step 5: Frontend integration

- "Show archived" toggle sends `?includeArchived=true`
- Settings > Data > "Recently deleted" calls `?deleted=true`
- Bulk action bar calls bulk archive/delete endpoints

---

## 7. Schema Summary

### work_items table additions

```sql
-- New columns
archived_at INTEGER,  -- NULL = active, non-NULL = archived (timestamp_ms)
deleted_at INTEGER,   -- NULL = active, non-NULL = soft-deleted (timestamp_ms)
```

### New indexes

```sql
CREATE INDEX idx_work_items_archived ON work_items(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_work_items_deleted ON work_items(deleted_at) WHERE deleted_at IS NOT NULL;
```

### Cascade behavior summary

| Related table | On archive | On soft delete | On hard delete (30-day) |
|---------------|-----------|----------------|------------------------|
| Child work_items | Recursive archive (user choice) | Recursive soft delete | Recursive hard delete |
| work_item_edges | Keep | Keep | **Delete** (both directions) |
| executions | Keep | Keep | **Orphan** (keep records, item reference becomes stale) |
| comments | Keep | Keep | **Delete** |
| proposals | Keep | Keep | **Delete** |
| project_memories | Keep | Keep | **Delete** |
| chat_sessions | Keep | Keep | **Set workItemId = NULL** |
