# Test Plan: Work Item Lifecycle

## Objective

Verify the full work item lifecycle: archive, unarchive, soft delete, bulk operations, "Recently deleted" recovery, 409 guard for running executions, context menus, and detail panel actions.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with at least 3-4 work items in a project
- A specific project selected in sidebar (not "All Projects")
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues alongside the functional pass/fail.

### TC-WIL-1: Archive a work item — disappears from default list

1. **Navigate** to `http://localhost:5173/items`
   - Verify: work items list loads with items visible
   - Note the title of the first item for later verification
   - **Screenshot checkpoint**

2. **Right-click** on a work item row to open context menu
   - Verify: context menu appears with "Archive" option
   - **Screenshot checkpoint**

3. **Click** "Archive" in the context menu
   - Verify: item disappears from the list
   - Verify: success toast appears (may include [Undo] action)
   - **Screenshot checkpoint**

4. **Verify** item is gone from default view
   - Check: the archived item's title is no longer visible in the list
   - Expected: list count reduced by one

### TC-WIL-2: "Show archived" toggle reveals archived items with muted styling

1. **Ensure** at least one item has been archived (from TC-WIL-1)

2. **Locate** the filter bar on the Work Items page
   - Look for an "Archived" toggle button (Archive icon)
   - **Screenshot checkpoint**

3. **Click** the "Archived" toggle to enable it
   - Verify: toggle changes to active/secondary variant
   - Verify: archived items appear in the list
   - **Screenshot checkpoint**

4. **Verify** archived item styling
   - Check: archived items have reduced opacity (muted/faded appearance)
   - Check: archived items show an "Archived" badge
   - Expected: visually distinct from non-archived items
   - **Screenshot checkpoint**

5. **Click** the "Archived" toggle again to disable
   - Verify: archived items disappear from the list again

### TC-WIL-3: Unarchive restores item to normal view

1. **Enable** the "Show archived" toggle (from TC-WIL-2)

2. **Right-click** on an archived item
   - Verify: context menu shows "Unarchive" (not "Archive")
   - **Screenshot checkpoint**

3. **Click** "Unarchive"
   - Verify: item loses its muted styling and "Archived" badge
   - Verify: success toast appears

4. **Disable** the "Show archived" toggle
   - Verify: the unarchived item is still visible in the default list (it's now a normal item)

### TC-WIL-4: Delete a work item — confirmation dialog shown, item soft-deleted

1. **Right-click** on a work item
   - Verify: context menu shows "Delete" option (typically in red)
   - **Screenshot checkpoint**

2. **Click** "Delete"
   - Verify: confirmation dialog (AlertDialog) appears
   - Check: dialog has warning text and "Delete" + "Cancel" buttons
   - **Screenshot checkpoint**

3. **Click** "Delete" in the confirmation dialog
   - Verify: item disappears from the list
   - Verify: item is soft-deleted (not permanently gone — recoverable in Settings)

4. **Click** "Cancel" on a different item's delete dialog
   - Verify: dialog closes, item remains in list

### TC-WIL-5: Bulk select and archive multiple items

1. **Navigate** to `http://localhost:5173/items`
   - Verify: items have checkboxes
   - **Screenshot checkpoint**

2. **Select** 2-3 items by clicking their checkboxes
   - Verify: sticky action bar appears at bottom with "N items selected"
   - Check: [Archive], [Delete], [Clear] buttons visible
   - **Screenshot checkpoint**

3. **Click** [Archive] in the bulk action bar
   - Verify: all selected items disappear from the list
   - Verify: success toast appears
   - Verify: action bar disappears (selection cleared)
   - **Screenshot checkpoint**

### TC-WIL-6: Bulk delete with confirmation

1. **Select** 2+ items via checkboxes

2. **Click** [Delete] in the bulk action bar
   - Verify: confirmation dialog appears (AlertDialog)
   - Check: mentions the number of items being deleted
   - **Screenshot checkpoint**

3. **Click** "Delete" to confirm
   - Verify: items disappear from list
   - Verify: action bar disappears

### TC-WIL-7: "Recently deleted" in Settings shows soft-deleted items with [Restore]

1. **Navigate** to `http://localhost:5173/settings`
   - **Screenshot checkpoint**

2. **Scroll** to the "Data" section
   - Verify: "Recently Deleted" section is visible
   - **Screenshot checkpoint**

3. **Verify** deleted items appear
   - Check: table shows title, delete date, and days remaining badge
   - Check: [Restore] button on each row
   - If no deleted items: verify empty state message
   - **Screenshot checkpoint**

4. **Click** [Restore] on a deleted item
   - Verify: item disappears from the "Recently deleted" list
   - Verify: success toast appears

5. **Navigate** back to `/items`
   - Verify: restored item reappears in the work items list

### TC-WIL-8: Delete blocked (409) when execution is running

1. **Prerequisite**: requires a work item with a running execution
   - If no running execution exists: verify code inspection instead
   - Read `packages/backend/src/routes/work-items.ts` — look for 409 guard checking `executions.status = "running"`

2. **Attempt** to delete a work item with running execution (if available)
   - Expected: 409 error response
   - Verify: error toast shown to user

3. **Code verification** (alternative if no running execution)
   - Read the DELETE handler in `work-items.ts`
   - Verify: checks `inArray` for running executions across item + descendants
   - Verify: returns 409 with error message when blocked

### TC-WIL-9: Context menu shows archive/delete actions

1. **Navigate** to `http://localhost:5173/items`

2. **Right-click** on a non-archived work item
   - Verify: context menu appears
   - Check: "Archive" action present
   - Check: "Delete" action present (typically in red)
   - **Screenshot checkpoint**

3. **Enable** "Show archived" toggle, right-click an archived item
   - Verify: "Unarchive" shown instead of "Archive"
   - Check: "Delete" still present
   - **Screenshot checkpoint**

4. **Dismiss** context menu by clicking away
   - Verify: menu closes cleanly

### TC-WIL-10: Detail panel shows archive/unarchive button

1. **Click** on a work item to open detail panel
   - Verify: detail panel opens on the right side
   - **Screenshot checkpoint**

2. **Verify** Archive button in header
   - Check: Archive icon button visible in the detail panel header
   - **Screenshot checkpoint**

3. **Click** the overflow menu (three dots) in detail panel header
   - Verify: "Delete" option present in the overflow menu
   - **Screenshot checkpoint**

4. **Click** Archive button
   - Verify: item gets archived, button changes to "Unarchive"
   - Verify: success toast with [Undo]

5. **Click** Unarchive button
   - Verify: item restored, button changes back to "Archive"

## Expected Results

- Archive removes item from default list; "Show archived" reveals it with muted styling
- Unarchive restores item to default view
- Delete shows confirmation dialog, then soft-deletes
- Bulk operations (archive/delete) work on multiple selected items
- "Recently deleted" in Settings shows deleted items with Restore capability
- 409 blocks deletion when execution is running
- Context menu has Archive/Unarchive + Delete actions
- Detail panel has Archive button in header and Delete in overflow menu

### Visual Quality

- Archived items: reduced opacity, "Archived" badge visible and readable
- Bulk action bar: sticky at bottom, buttons properly aligned
- Context menu: positioned correctly near the right-click location
- Confirmation dialogs: centered, readable text, buttons clearly labeled
- "Recently deleted" table: columns aligned, badges sized correctly
- Toast notifications: visible, auto-dismiss, [Undo] clickable

## Failure Criteria

- Archive does not remove item from default list
- "Show archived" toggle does not reveal archived items
- Archived items not visually distinct (no opacity change or badge)
- Delete does not show confirmation dialog
- Bulk actions do not clear selection after completion
- "Recently deleted" does not show soft-deleted items
- Restore does not return item to the active list
- 409 guard does not block deletion of items with running executions
- Context menu missing Archive/Delete actions
- Detail panel missing archive/delete controls
- Any visual defect: broken layout, invisible text, misaligned elements
