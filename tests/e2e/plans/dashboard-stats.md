# Test Plan: Dashboard Stats

## Objective

Verify the dashboard page renders all stat cards with valid numeric values, the active agents strip, and the cost summary chart.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (at least 1 project with work items and executions)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/`
   - Verify: page loads, heading "Dashboard" is visible
   - Verify: subheading "At-a-glance status for your project." is visible
   - **Screenshot checkpoint:** Take screenshot. Examine: overall dashboard layout, heading alignment, sidebar rendering, page structure. Note any layout issues on initial load.

2. **Verify** 4 stat cards are rendered
   - Look for: 4 card elements in a grid layout
   - Each card should have a title and a numeric value
   - **Screenshot checkpoint:** Take screenshot. Examine: card grid alignment (equal widths, consistent heights), card spacing/gaps, text sizing within cards, border/shadow rendering.

3. **Verify** "Active Agents" stat card
   - Look for: text "Active Agents"
   - Expected: a numeric value (e.g., "0", "1", "3") — not "NaN", "undefined", or blank
   - The value should be a non-negative integer displayed in large bold text

4. **Verify** "Pending Proposals" stat card
   - Look for: text "Pending Proposals"
   - Expected: a numeric value — not "NaN", "undefined", or blank

5. **Verify** "Needs Attention" stat card
   - Look for: text "Needs Attention"
   - Expected: a numeric value — not "NaN", "undefined", or blank

6. **Verify** "Today's Cost" stat card
   - Look for: text "Today's Cost"
   - Expected: a dollar amount (e.g., "$0.00", "$1.50") — starts with "$", not "NaN" or "undefined"

7. **Verify** Active Agents strip renders
   - Look for: the active agents section below the stat cards
   - Expected: either shows agent cards with persona names/colors, or an empty state message if no agents are running
   - **Screenshot checkpoint:** Take screenshot. Examine: agent strip layout, persona avatar sizing, card alignment within strip, text readability of persona names.

8. **Verify** Cost Summary widget renders
   - Look for: a card containing a chart (bar chart or line chart showing daily cost data)
   - Expected: chart renders with axis labels and data bars/lines, not a blank area or error
   - **Screenshot checkpoint:** Take screenshot. Examine: chart rendering quality, axis label readability, bar/line visibility, widget card borders/padding, no clipping of chart elements.

9. **Verify** Recent Activity widget renders
   - Look for: text "Recent Activity" with a "View all" link
   - Expected: either activity event rows with icons and timestamps, or "No activity yet" empty state
   - **Screenshot checkpoint:** Take screenshot. Examine: activity row alignment, icon sizing, timestamp placement, "View all" link visibility, row spacing consistency.

10. **Verify** Upcoming Work widget renders
    - Look for: a card showing ready work items
    - Expected: either work item rows with titles and personas, or an empty state
    - **Screenshot checkpoint:** Take screenshot. Examine: work item row layout, title truncation behavior, persona avatar alignment, widget card consistency with other widgets.

11. **Take final screenshot** of the full dashboard for evidence (full page)

## Expected Results

- Dashboard heading and subheading are visible
- All 4 stat cards display valid numeric values (no NaN, undefined, loading spinners stuck)
- "Today's Cost" shows a dollar-formatted value starting with "$"
- Active agents strip is present (with agents or empty state)
- Cost summary chart renders with visual data representation
- Recent activity and upcoming work widgets are present

### Visual Quality

- Stat cards: equal widths in grid, consistent heights, aligned text, readable values
- Active agents strip: persona avatars properly sized, names not truncated, cards evenly spaced
- Cost chart: bars/lines visible, axis labels readable, no clipping at edges
- Recent activity: event rows aligned, icons consistent size, timestamps right-aligned
- Upcoming work: item rows properly spaced, no overlapping elements
- Overall: consistent spacing between sections, no horizontal scrolling, sidebar properly rendered

## Failure Criteria

- Any stat card shows "NaN", "undefined", or remains in a loading shimmer state for more than 5 seconds
- "Today's Cost" does not start with "$" or shows non-numeric content
- Fewer than 4 stat cards are rendered
- The cost summary chart area is blank or shows an error
- The page shows a JavaScript error or white screen
- Dashboard heading is not visible after page load

### Visual Failure Criteria

- Stat cards have inconsistent heights or widths within the grid
- Text in stat cards is clipped, invisible, or overflows the card boundary
- Chart elements overlap axis labels or clip outside the widget container
- Active agents strip shows broken avatar rendering or misaligned cards
- Sections overlap or have no spacing between them
- Any widget card has broken borders, missing backgrounds, or shadow artifacts
