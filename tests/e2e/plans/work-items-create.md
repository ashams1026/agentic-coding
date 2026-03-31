# Test Plan: Work Items — Create

## Objective

Verify that clicking the "Add" button on the Work Items page creates a new work item that appears in the list and starts in the Backlog state.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (at least 1 project selected)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/items`
   - Verify: "Work Items" heading is visible
   - Verify: list view is active
   - **Screenshot checkpoint:** Take screenshot. Examine: page layout, list rendering, heading alignment.

2. **Note** the current number of work items in the list
   - Count the visible work item rows
   - Expected: at least 0 items (could be empty state with "No work items yet")

3. **Click** the "Add" button in the page header
   - Target: button with text "Add" and a plus (+) icon, located in the top-right area next to the view toggle
   - Expected: a new work item is created and appears in the list
   - **Screenshot checkpoint:** Take screenshot. Examine: new item appeared in list, row styling consistent with existing items, no layout shift or broken rendering.

4. **Verify** the new work item appears in the list
   - Look for: a new row with the title "New work item"
   - Expected: the item count has increased by one compared to step 2

5. **Verify** the new work item starts in Backlog state
   - Look for: the state badge on the "New work item" row
   - Expected: the badge shows "Backlog" with a gray-tinted color (#6b7280)

6. **Verify** the new work item has a default priority
   - Look for: the priority badge on the "New work item" row
   - Expected: a priority badge is displayed (P2 or default priority)

7. **Click** the "New work item" row to open the detail panel
   - Expected: the detail panel opens showing "New work item" as the title
   - **Screenshot checkpoint:** Take screenshot. Examine: panel opened cleanly, panel and list share space, new item row highlighted, panel content renders without clipping.

8. **Verify** the detail panel shows the new item's data
   - Look for: title "New work item" as a heading
   - Look for: state badge showing "Backlog"
   - Look for: a "Move to…" dropdown (Backlog can transition to "Planning")
   - Look for: description section showing "No description. Click Edit to add one."
   - Look for: children section showing "No children"
   - Look for: metadata section with ID, Created, and Updated timestamps

9. **Take final screenshot** of the list with the new work item and open detail panel for evidence (full page)

## Expected Results

- The "Add" button is visible and clickable in the page header
- Clicking "Add" creates a new work item immediately (no modal or form required)
- The new work item appears in the list with title "New work item"
- The new work item has state "Backlog"
- The new work item is visible in the detail panel with correct default values
- No error messages or console errors during creation

### Visual Quality

- New item row: consistent styling with existing rows, same badge sizes, aligned text
- No layout shift: adding item doesn't cause existing items to jump or re-render broken
- Detail panel: smooth transition, all default fields render cleanly, empty states readable
- Backlog badge: correct gray color, readable text, properly sized
- Priority badge: P2 default visible, colored border consistent with other P2 badges

## Failure Criteria

- The "Add" button is not visible or not clickable
- Clicking "Add" does not create a new item (no change in the list)
- The new item does not have the title "New work item"
- The new item's state is not "Backlog" (starts in wrong state)
- The creation causes a JavaScript error or API error
- The page shows a loading spinner that never resolves after clicking "Add"
- The new item appears but clicking it does not open the detail panel

### Visual Failure Criteria

- New item row has different height or badge sizing than existing rows
- Adding item causes visible layout shift or flicker in existing rows
- Detail panel content clipped or overflowing its container
- Empty state text ("No description", "No children") invisible or misaligned
- Backlog badge has wrong color or missing background
