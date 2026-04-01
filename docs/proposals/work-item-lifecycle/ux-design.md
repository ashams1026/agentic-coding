# Work Item Delete & Archive — UX Design Research

Research into UX for deleting and archiving work items, including bulk operations and undo behavior.

**Current state:** No delete or archive functionality exists. Work items are created and persist indefinitely. The list view (`list-view.tsx`) has multi-select checkboxes but no bulk actions. The detail panel (`detail-panel.tsx`) has no delete button. Work items accumulate with no cleanup mechanism.

---

## 1. Delete vs. Archive Semantics

### Archive

**Purpose:** Remove from active views without losing data. The item and all its history (executions, comments, proposals, agent work) are preserved for reference.

**Behavior:**
- Item is hidden from default list/board/flow views
- Item excluded from dashboard counts (active agents, pending proposals, cost)
- Item excluded from activity feed (unless explicitly filtered)
- Item still visible in: search results (grayed out), execution history, parent item's child list (with "archived" badge)
- Persona assignments and workflow state are frozen — no further transitions
- If the item has active executions, they finish normally but no new ones are dispatched

### Delete

**Purpose:** Permanently remove an item and optionally its associated data. Destructive, irreversible (after grace period).

**Behavior:**
- Item and its data are removed from the database
- Child items: user chooses cascade behavior (see §2)
- Executions: preserved as orphan records (for cost accounting) or cascade deleted
- Comments and proposals: cascade deleted
- Not recoverable after the operation completes

### When to offer which

| Context | Archive | Delete |
|---------|---------|--------|
| List view (single item) | Context menu | Context menu (secondary, behind "Danger zone") |
| List view (bulk) | "Archive N items" button | "Delete N items" button (with confirmation) |
| Detail panel | "Archive" button in header actions | "Delete" in overflow menu (...) |
| Board view (card) | Right-click context menu | Right-click context menu |
| Keyboard shortcut | `Backspace` or `A` when item focused | `Shift+Backspace` or `D` |

**Archive is the default/prominent action. Delete is secondary and requires extra intent.**

---

## 2. Confirmation UX

### Archive confirmation

**Simple items (no children, no active executions):**
- No confirmation dialog needed — archive is reversible (unarchive)
- Show a toast: "Item archived" with [Undo] button (5-second window)

**Items with children:**
- Dialog: "Archive '[title]' and N child tasks?"
- Options: "Archive all" (default) or "Archive parent only" (children become top-level)
- If children have active executions: note in dialog "2 child tasks have active executions — they will finish before archiving"

**Items with active executions:**
- Dialog: "This item has N active executions. Archive anyway?"
- Note: "Active executions will finish. No new executions will be dispatched."
- No option to force-stop — the agent finishes its current work

### Delete confirmation

**Always show a confirmation dialog for delete:**

```
┌─ Delete work item ──────────────────────────────────────┐
│                                                          │
│  Are you sure you want to permanently delete             │
│  "Fix authentication bug"?                               │
│                                                          │
│  This item has:                                          │
│  • 3 child tasks                                         │
│  • 5 executions ($0.42 total)                           │
│  • 12 comments                                           │
│                                                          │
│  ○ Delete item and all children                          │
│  ○ Delete item only (promote children to top-level)      │
│                                                          │
│  ⚠️ This action cannot be undone.                        │
│                                                          │
│            [Cancel]  [Delete permanently]                 │
└──────────────────────────────────────────────────────────┘
```

**Blocked deletion:**
- If the item has an active execution (agent currently running): block delete entirely
- Show: "Cannot delete — agent is currently working on this item. Wait for it to finish or cancel the execution first."
- Provide a "Cancel execution" button that stops the agent, then allows deletion

### Bulk confirmation

For multi-select operations:
- "Archive N items?" — single confirmation, no per-item dialogs
- "Delete N items?" — confirmation with summary (total children, executions, comments across all selected items)
- If any selected item has active executions: list them and block until resolved

---

## 3. Bulk Operations

### Multi-select in list view

The list view already has checkboxes for multi-select. Enhance with a bulk action bar:

```
┌─ 3 items selected ────────────── [Archive] [Delete] [× Clear] ─┐
```

**Action bar behavior:**
- Appears when 1+ items are selected (sticky at the top of the list, replacing the filter bar)
- "Archive" button: archives all selected items (with confirmation if any have children/executions)
- "Delete" button: deletes all selected items (always shows confirmation dialog)
- "Clear" button (or Escape key): deselects all
- Item count updates as selection changes

### Multi-select in board view

- Click to select a card (blue border highlight)
- `Cmd+Click` for multi-select
- Same action bar appears at the top of the board
- Drag-selected cards can also be dragged to an "Archive" drop zone at the bottom of the board

### Select all / filter interaction

- "Select all" checkbox selects all visible items (respects current filters)
- If filtering by status "In Progress", "Archive selected" only archives the visible In Progress items
- After archiving, the archived items disappear from the filtered view

---

## 4. Undo / Reversibility

### Archive is fully reversible

**Unarchive button:** Available on archived items in:
- Search results (when showing archived items)
- Parent item's child list (archived children show unarchive action)
- Dedicated "Archived items" view (see §5)

**Undo toast:** When archiving, show a toast for 5 seconds:
```
"3 items archived"  [Undo]
```
Clicking Undo immediately restores the items to their previous state.

### Delete uses soft delete with grace period

**Implementation:** Instead of immediately removing from DB, set `deletedAt` timestamp. Items with `deletedAt` are hidden from all views.

**Grace period:** 30 days. After 30 days, a background job hard-deletes the record and cascaded data.

**Recovery during grace period:**
- Settings > Data > "Recently deleted" section shows items deleted in the last 30 days
- Each item has a "Restore" button
- After 30 days, items are listed as "Permanently deleted on [date]" (no restore)

**Why soft delete + grace period:**
- Accidental deletion happens. In a local-first app, there's no admin to restore from backup.
- 30 days gives the user time to realize the mistake without storing deleted data indefinitely.
- Background job can run on server start or hourly (check `deletedAt < now - 30 days`).

---

## 5. How Archived Items Appear

### Default views (list, board, flow)

- **Archived items are hidden** from all default views
- Dashboard counts exclude archived items
- Activity feed excludes events from archived items (unless filtered)

### "Show archived" toggle

Each view gets a toggle in the filter bar:

```
[Status: All ▼] [Priority: All ▼] [□ Show archived]
```

When enabled:
- Archived items appear in the list with a muted/grayed-out style
- Badge: "Archived" in muted text next to the status
- Click to open detail panel (read-only — no state transitions, no new comments)
- Unarchive button in the detail panel header

### Search results

- Archived items appear in search results by default (they're still relevant data)
- Styled differently: muted text, "Archived" badge
- Click navigates to detail panel in read-only mode

### Execution history / Agent Monitor

- Executions for archived items remain visible in Agent Monitor
- Execution detail panel shows "Work item archived" note
- No new executions can be dispatched for archived items

### Parent-child relationships

- If a parent is archived but children are not: children show a warning "Parent item is archived"
- If a child is archived but parent is not: parent's child list shows the archived child with badge, muted style
- Unarchiving a parent does NOT automatically unarchive children (user decides)

---

## 6. Interaction with Active Agents

### Agent is working on the item being archived

1. Archive proceeds immediately
2. Active execution finishes normally (not interrupted)
3. After execution completes, the result is saved but no new routing/dispatch occurs
4. If the router tries to transition the item: it sees the archived flag and skips

### Agent is working on the item being deleted

1. Delete is **blocked** while execution is active
2. User sees: "Cannot delete — active execution. Cancel it first or wait."
3. "Cancel execution" button available — stops the agent, marks execution as "cancelled"
4. After cancellation, delete proceeds normally

### Agent is working on a child of the item being archived/deleted

Same rules apply recursively. If cascade archiving children:
- Active executions on children finish, then children are archived
- Alternatively: block the cascade until all child executions complete

---

## 7. Entry Points Summary

| Entry Point | Archive | Delete | Bulk |
|-------------|---------|--------|------|
| List view context menu (right-click row) | Yes | Yes (secondary) | N/A |
| List view bulk action bar | Yes | Yes | Yes |
| Board view context menu (right-click card) | Yes | Yes (secondary) | N/A |
| Board view bulk action bar | Yes | Yes | Yes |
| Detail panel header actions | Yes (button) | Yes (overflow menu) | N/A |
| Keyboard shortcut | `A` / `Backspace` | `D` / `Shift+Backspace` | Works on selection |
| Command palette | "Archive [item]" | "Delete [item]" | N/A |

---

## 8. Design Decisions

### Archive over delete as the primary action

Users are more likely to want to hide items than permanently destroy them. Archive preserves history for auditing and reference. Making archive the prominent action reduces accidental data loss.

### No "trash" view — use "recently deleted" in Settings

A dedicated Trash page adds navigation clutter. Since delete should be rare and recovery is an exception case, the "Recently deleted" list lives in Settings > Data, not as a top-level nav item.

### Soft delete with background cleanup

Immediate hard delete is risky in a local-first app with no backup infrastructure. The 30-day soft delete window is a safety net. The background job keeps the DB clean automatically.

### Block delete on active executions, but not archive

Archiving is safe — the agent finishes and the item just stops being routed. Deleting while an agent is running could leave orphaned state (agent writes results to a deleted item). Blocking delete until execution completes is the safest approach.
