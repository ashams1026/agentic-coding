# Test Plan: Agent Monitor — History

## Objective

Verify the Agent Monitor History tab renders a table of past executions with persona, duration, cost, and outcome columns, and that clicking a row expands it to show terminal output.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (at least 3 completed executions with varied outcomes)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/agents`
   - Verify: the Agent Monitor page loads

2. **Click** the "History" tab
   - Target: the "History" tab in the tab bar
   - Expected: the history view replaces the live view
   - **Screenshot checkpoint:** Take screenshot. Examine: history view layout, stats bar rendering, filter bar alignment, table structure visible.

3. **Verify** the stats bar is present
   - Look for: a bar at the top showing summary statistics
   - Expected: shows "Runs" with a number, "Total Cost" with a dollar amount, "Success" with a percentage, and "Avg Duration" with a time value
   - None of the values should be NaN, undefined, or blank
   - **Screenshot checkpoint:** Take screenshot. Examine: stats bar card alignment, consistent card sizes, values readable, no clipping of dollar amounts or percentages.

4. **Verify** the filter bar is present
   - Look for: a filter icon followed by dropdown controls
   - Expected: an "All agents" persona dropdown, an "All outcomes" outcome dropdown, and cost range inputs (Min/Max)

5. **Verify** the executions table renders with correct columns
   - Look for: a table with column headers: "Agent", "Target", "Started", "Duration", "Cost", "Outcome"
   - Expected: at least 1 row of execution data is visible
   - **Screenshot checkpoint:** Take screenshot. Examine: table column alignment, header text readable, column widths proportional, table fits within content area without horizontal scroll.

6. **Verify** table row data
   - Look for: in each row:
     - "Agent" column: a colored persona avatar circle and persona name
     - "Target" column: a work item title
     - "Started" column: a date/time string (e.g., "Mar 15, 02:30 PM")
     - "Duration" column: a time value (e.g., "45s", "2m 30s")
     - "Cost" column: a dollar amount with $ icon (e.g., "$0.15")
     - "Outcome" column: a badge showing "Success" (green), "Failed" (red), or "Rejected" (amber)
   - Expected: no cells show NaN, undefined, "Invalid Date", or are blank

7. **Click** a table row to expand it
   - Target: click any execution row in the table
   - Expected: the row expands to reveal a terminal output area below it, and a chevron icon flips from down to up
   - **Screenshot checkpoint:** Take screenshot. Examine: expanded row renders cleanly, terminal area bordered and sized correctly (~300px), terminal text readable, chevron icon flipped, no overlap with adjacent rows.

8. **Verify** the terminal renderer displays content
   - Look for: a bordered area (~300px tall) below the expanded row
   - Expected: terminal-style output is visible (text content from the execution), not a blank area or loading spinner stuck for more than 5 seconds

9. **Click** the same row again to collapse it
   - Expected: the terminal output area closes and the chevron flips back to down

10. **Filter** by outcome
    - Target: the outcome dropdown showing "All outcomes"
    - Click it and select "Success"
    - Expected: the table filters to show only rows with the "Success" outcome badge
    - The stats bar updates to reflect the filtered subset
    - **Screenshot checkpoint:** Take screenshot. Examine: filtered table shows only Success rows, dropdown shows "Success", stats bar updated, "Clear" button visible.

11. **Verify** the "Clear" button appears and works
    - Look for: a "Clear" button with an X icon in the filter bar
    - Click it
    - Expected: the outcome filter resets to "All outcomes" and all executions return

12. **Sort** by Cost column
    - Click the "Cost" column header
    - Expected: the table reorders by cost, and a sort direction arrow appears on the column header

13. **Click** the "Cost" header again to reverse sort direction
    - Expected: the sort arrow flips and the order reverses

14. **Take final screenshot** of the history table with data for evidence (full page)

## Expected Results

- History tab shows a stats bar with Runs, Total Cost, Success %, and Avg Duration
- Filter bar renders with persona, outcome, and cost range filters
- Executions table renders with Agent, Target, Started, Duration, Cost, Outcome columns
- Each row shows valid data (persona avatar + name, date, duration, dollar amount, outcome badge)
- Clicking a row expands it to show terminal output in a bordered area
- Clicking again collapses the expanded row
- Filtering by outcome narrows the table and updates the stats bar
- The "Clear" button resets all filters
- Sortable columns (Started, Duration, Cost) reorder the table on click

### Visual Quality

- Stats bar: cards evenly spaced, values readable, consistent card heights, no clipping of values
- Filter bar: controls aligned, dropdowns same height, cost range inputs properly sized
- Table: columns properly proportioned, headers aligned with data cells, consistent row heights
- Persona avatars: properly sized circles, colored backgrounds, letter centered
- Outcome badges: correct colors (green/red/amber), readable text, consistent badge sizing
- Expanded row: terminal area properly bordered, text monospaced and readable, smooth expand/collapse
- Sort indicators: arrow icons visible on sorted column, clear direction indication
- Overall: table responsive within content area, no horizontal overflow

## Failure Criteria

- The History tab shows no table when executions exist in the database
- Table columns are missing (fewer than 6 data columns)
- Any cell shows NaN, undefined, "Invalid Date", or is completely blank
- Outcome badges are missing or show wrong colors
- Clicking a row does not expand it
- The expanded area is blank (no terminal output)
- Filtering has no effect on the displayed rows
- Sorting does not change the row order
- The page shows a JavaScript error or white screen
- If no executions exist, the empty state "No execution history" with "Past agent runs will appear here once completed." should be shown instead

### Visual Failure Criteria

- Stats bar cards have inconsistent sizes or values overflow card boundaries
- Table columns misaligned with headers (data doesn't line up under correct header)
- Persona avatars different sizes or broken rendering (no color, no letter)
- Outcome badges wrong color or text invisible against badge background
- Expanded terminal area overlaps adjacent rows or clips at edges
- Sort arrow invisible or misaligned with column header text
- Filter dropdowns overlap each other or cost inputs too narrow for values
