# Test Plan: Work Items — Sorting

## Objective

Verify that the Work Items list can be sorted by different criteria (priority, created date, updated date) and that the sort direction can be toggled between ascending and descending.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (work items with varied priorities and different creation/update dates)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/items`
   - Verify: "Work Items" heading is visible
   - Verify: work items are listed

2. **Verify** the default sort is "Sort by priority"
   - Look for: the sort dropdown in the filter bar
   - Expected: it shows "Sort by priority" as the selected value
   - **Screenshot checkpoint:** Take screenshot. Examine: sort dropdown shows selected value, direction arrow button visible and aligned, both controls same height, no clipping.

3. **Note** the current order of items
   - Record the titles (or priority badges) of the first 3-5 items in the list
   - Expected: items are sorted by priority (P0 first, then P1, P2, P3 in ascending order by default)

4. **Change** the sort to "Sort by created"
   - Target: the sort dropdown (currently showing "Sort by priority")
   - Click it and select "Sort by created"
   - Expected: the list reorders based on creation date
   - **Screenshot checkpoint:** Take screenshot. Examine: dropdown shows "Sort by created", list order changed, no layout jump or flicker, items render cleanly in new order.

5. **Verify** the order has changed
   - Compare the first 3-5 items to the order noted in step 3
   - Expected: the order is different (unless all items happen to have the same creation date order as priority order, which is unlikely with seeded data)

6. **Verify** the sort direction button shows the current direction
   - Look for: an arrow icon button next to the sort dropdown
   - Expected: the button shows either an up arrow (ascending) or down arrow (descending)

7. **Click** the sort direction toggle button
   - Target: the arrow button next to the sort dropdown
   - Expected: the arrow icon flips direction (up→down or down→up)
   - **Screenshot checkpoint:** Take screenshot. Examine: arrow icon updated, list order reversed, items re-rendered smoothly, no missing or duplicate items.

8. **Verify** the list order has reversed
   - Compare the first item to the last item from before the toggle
   - Expected: the order is reversed — items that were at the bottom are now at the top

9. **Change** the sort to "Sort by updated"
   - Target: the sort dropdown
   - Click it and select "Sort by updated"
   - Expected: the list reorders based on the last updated date

10. **Toggle** sort direction back
    - Click the arrow button again
    - Expected: the arrow flips and the order reverses again

11. **Change** back to "Sort by priority"
    - Select "Sort by priority" from the dropdown
    - Expected: the list returns to priority-based ordering

12. **Take final screenshot** of the sorted list for evidence (full page)

## Expected Results

- The sort dropdown shows the current sort criterion
- Changing the sort criterion reorders the list
- The sort direction button shows an arrow indicating current direction
- Clicking the direction button reverses the list order
- "Sort by created" orders by creation date
- "Sort by updated" orders by last modified date
- "Sort by priority" orders by priority level (P0 first in ascending)
- Each sort change is immediately reflected in the visible list

### Visual Quality

- Sort dropdown: selected value readable, dropdown aligned with other filter controls
- Direction button: arrow icon clearly visible, aligned vertically with dropdown, same height
- List reorder: items re-render smoothly without flicker, no layout shift during transition
- Item consistency: badge sizes, row heights, and spacing unchanged regardless of sort order
- Group headers: if grouping active, headers update correctly when sort changes

## Failure Criteria

- The sort dropdown does not change the list order
- Clicking the sort direction button does not reverse the order
- The arrow icon does not update when toggling direction
- Changing sort criterion has no visible effect on the list
- Sorting causes items to disappear or duplicates to appear
- Sorting causes a JavaScript error

### Visual Failure Criteria

- Sort dropdown text truncated or selected value invisible
- Direction arrow icon invisible or misaligned with dropdown
- List flickers or shows layout shift during sort change
- Items temporarily disappear or show in wrong positions during re-render
- Row heights or badge sizes change based on sort order
