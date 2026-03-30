# Test Plan: Work Items — Filtering and Search

## Objective

Verify that the Work Items filter bar supports text search, state filtering, priority filtering, combined filters, and clearing all filters to restore the full list.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173`
- API mode set to "api"
- Database seeded with test data (work items across multiple states and priorities, with varied titles)

## Steps

1. **Navigate** to `http://localhost:5173/items`
   - Verify: "Work Items" heading is visible
   - Verify: work items are listed in list view

2. **Note** the total number of work items visible in the list
   - Count all visible rows (including any grouped headers if grouping is active)
   - This is the baseline count for comparison after filtering

3. **Type** a search query in the search box
   - Target: the input with placeholder "Search items..."
   - Action: type a partial title that matches some but not all items (e.g., the first word of a known work item title)
   - Expected: the list filters in real-time (after a brief debounce) to show only items whose title or description contains the search text
   - Verify: the number of visible items is less than the baseline count from step 2

4. **Verify** search highlighting
   - Look for: the matching text in item titles highlighted with a yellow/amber background
   - Expected: the search query text is visually highlighted within matching titles

5. **Clear** the search box
   - Action: click the X icon inside the search input, or select all text and delete it
   - Expected: all work items return to the list (count matches baseline from step 2)

6. **Select** a state filter
   - Target: the state dropdown showing "All states"
   - Click it and select a specific state (e.g., "In Progress")
   - Expected: the list now shows only items in the "In Progress" state
   - Verify: every visible item has the "In Progress" state badge

7. **Verify** the filter is working correctly
   - Look for: no items with a different state badge (e.g., "Backlog", "Ready") should be visible
   - Expected: all displayed items share the same selected state

8. **Select** a priority filter on top of the state filter
   - Target: the priority dropdown showing "All priorities"
   - Click it and select a priority (e.g., "P1 — High")
   - Expected: the list narrows further — only items that are BOTH "In Progress" AND "P1" are shown
   - The visible count should be equal to or less than the state-only filtered count

9. **Verify** combined filters are applied
   - Look for: every visible item must have both the selected state badge AND the selected priority badge
   - Expected: no items that don't match both criteria

10. **Click** the "Clear" button to remove all filters
    - Target: the "Clear" button with an X icon (appears when filters are active)
    - Expected: the state dropdown resets to "All states", the priority dropdown resets to "All priorities", and all work items return to the list
    - Verify: the item count matches the baseline from step 2

11. **Verify** the "Clear" button disappears when no filters are active
    - Look for: the "Clear" button should no longer be visible after clearing
    - Expected: the button is hidden when all filters are at their default values

12. **Select** a state filter for a state with zero items
    - Target: select a state that has no work items (if available)
    - Expected: the list shows the empty state message "No items match your filters."

13. **Click** "Clear" to restore the full list
    - Expected: all items return

14. **Take screenshot** of the filter bar and filtered results for evidence

## Expected Results

- Typing in the search box filters the list in real-time to matching items
- Matching text is highlighted in item titles
- Clearing the search restores all items
- Selecting a state filter shows only items in that state
- Selecting a priority filter further narrows the results
- Combined filters (state + priority) show only items matching both criteria
- The "Clear" button removes all active filters and restores the full list
- The "Clear" button is hidden when no filters are active
- Filtering to zero results shows "No items match your filters."

## Failure Criteria

- Typing in the search box does not filter the list
- Search results include items that do not match the query
- State filter shows items from other states
- Priority filter does not narrow results when combined with state filter
- The "Clear" button does not reset all filters
- The "Clear" button remains visible when no filters are active
- Filtering causes a JavaScript error or white screen
- The list does not update after filter changes (stuck on previous results)
