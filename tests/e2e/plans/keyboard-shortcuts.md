# Test Plan: Keyboard Shortcuts / Command Palette

## Objective

Verify the command palette opens with Cmd+K (or Ctrl+K), allows searching for navigation targets and work items, supports keyboard navigation, and navigates to the selected item.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (work items with distinct titles for search testing)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/`
   - Verify: the Dashboard page loads without errors

2. **Press** Cmd+K (or Ctrl+K on non-Mac)
   - Expected: a command palette dialog opens as a centered modal overlay

3. **Verify** the command palette search input
   - Look for: a search input with placeholder text "Type a command or search..."
   - Expected: the input is auto-focused and ready for typing, an "ESC" badge is visible to the right of the input
   - **Screenshot checkpoint:** Take screenshot. Examine: command palette centered as modal overlay, backdrop dimming visible, search input rendered with placeholder text, ESC badge positioned correctly, category headers and items listed below, overall palette sizing and spacing.

4. **Verify** the command palette shows default categories
   - Look for: category headers in uppercase: "NAVIGATION", "QUICK ACTIONS", "WORK ITEMS"
   - Expected: "NAVIGATION" lists 7 items (Dashboard, Story Board, Agent Monitor, Activity Feed, Workflow Designer, Persona Manager, Settings), "QUICK ACTIONS" lists items like "Create story" and "View active agents", "WORK ITEMS" lists seeded work item titles

5. **Verify** the first item is highlighted by default
   - Look for: the first item in the list (under "NAVIGATION") with an accent background
   - Expected: the first item is highlighted and shows an "Enter" badge on the right

6. **Verify** the footer shows keyboard hints
   - Look for: a footer bar at the bottom of the dialog
   - Expected: shows "↑↓ navigate", "↵ select", "esc close"

7. **Type** a work item title (or partial match) into the search input
   - Target: type a few characters that match a seeded work item title (e.g., "Tic" if a TicTacToe item exists)
   - Expected: the list filters to show only matching items, non-matching items disappear

8. **Verify** the filtered results
   - Look for: only items whose labels contain the typed text
   - Expected: navigation items, actions, and work items all filter by the query
   - **Screenshot checkpoint:** Take screenshot. Examine: filtered results shown correctly, non-matching items removed, search text visible in input, result items readable, highlight on first match, no layout shift during filter.

9. **Type** a query with no matches (e.g., "xyznonexistent")
   - Expected: the list shows "No results found." centered in the results area

10. **Clear** the search input and type "Dashboard"
    - Expected: the "Dashboard" navigation item appears in the filtered results

11. **Press** ArrowDown to move the selection
    - Expected: the highlight moves to the next item in the list
    - **Screenshot checkpoint:** Take screenshot. Examine: selection highlight moved to next item, previous item deselected, "Enter" badge follows highlighted item, scroll behavior if item is below visible area.

12. **Press** ArrowUp to move the selection back
    - Expected: the highlight moves back to the previous item

13. **Press** Enter to select "Dashboard"
    - Target: ensure "Dashboard" is highlighted, then press Enter
    - Expected: the command palette closes and the page navigates to `/` (Dashboard)

14. **Press** Cmd+K again to reopen the command palette
    - Expected: the dialog reopens with an empty search input and all items listed (query reset)

15. **Click** a work item in the results list
    - Target: click on any work item title in the "WORK ITEMS" category
    - Expected: the command palette closes and the page navigates to the work item detail page

16. **Press** Cmd+K to reopen, then press Escape
    - Expected: the command palette closes without navigating

17. **Take screenshot** of the command palette with default items and with filtered results

## Expected Results

- Cmd+K (or Ctrl+K) opens the command palette as a dialog overlay
- The search input is auto-focused with placeholder "Type a command or search..."
- Default view shows 3 categories: Navigation (7 items), Quick Actions (2 items), Work Items (from seeded data)
- Typing filters results across all categories in real-time
- "No results found." appears for non-matching queries
- Arrow keys navigate the selection up and down
- Enter selects the highlighted item and navigates to it
- Clicking an item navigates to it
- Escape closes the palette without navigation
- Reopening resets the search query to empty

### Visual Quality

- Palette modal: centered on screen, appropriate width (~600px), rounded corners, shadow for depth, backdrop dimming behind
- Search input: full width of palette, placeholder text readable, ESC badge right-aligned, auto-focused cursor visible
- Category headers: uppercase, small, bold, clearly separated from items
- Result items: consistent row heights, icons aligned, labels readable, "Enter" badge on highlighted item
- Selection highlight: clear accent background on highlighted item, moves smoothly with arrow keys
- Footer: keyboard hints evenly spaced, text readable, positioned at bottom of palette
- Empty state: "No results found." centered, readable, not too large or small
- Overall: palette doesn't overflow viewport, scrollable if many results, no clipping of item labels

## Failure Criteria

- Cmd+K does not open the command palette
- The search input is not auto-focused
- Categories or items are missing from the default view
- Typing does not filter results
- Arrow key navigation does not move the selection highlight
- Enter does not navigate to the selected item
- Escape does not close the palette
- Work items from the database are not listed
- Any action causes a JavaScript error or blank screen

### Visual Failure Criteria

- Palette modal not centered or overflows viewport edges
- Backdrop missing or not dimming behind palette
- Search input not full width or placeholder text invisible
- Category headers misaligned or indistinguishable from items
- Selection highlight invisible or wrong color
- Result items different heights or icons misaligned with labels
- Footer keyboard hints clipped or overlapping
- Empty state text mispositioned or invisible
