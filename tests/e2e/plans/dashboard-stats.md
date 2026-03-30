# Test Plan: Dashboard Stats

## Objective

Verify the dashboard page renders all stat cards with valid numeric values, the active agents strip, and the cost summary chart.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173`
- API mode set to "api"
- Database seeded with test data (at least 1 project with work items and executions)

## Steps

1. **Navigate** to `http://localhost:5173/`
   - Verify: page loads, heading "Dashboard" is visible
   - Verify: subheading "At-a-glance status for your project." is visible

2. **Verify** 4 stat cards are rendered
   - Look for: 4 card elements in a grid layout
   - Each card should have a title and a numeric value

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

8. **Verify** Cost Summary widget renders
   - Look for: a card containing a chart (bar chart or line chart showing daily cost data)
   - Expected: chart renders with axis labels and data bars/lines, not a blank area or error

9. **Verify** Recent Activity widget renders
   - Look for: text "Recent Activity" with a "View all" link
   - Expected: either activity event rows with icons and timestamps, or "No activity yet" empty state

10. **Verify** Upcoming Work widget renders
    - Look for: a card showing ready work items
    - Expected: either work item rows with titles and personas, or an empty state

11. **Take screenshot** of the full dashboard for evidence

## Expected Results

- Dashboard heading and subheading are visible
- All 4 stat cards display valid numeric values (no NaN, undefined, loading spinners stuck)
- "Today's Cost" shows a dollar-formatted value starting with "$"
- Active agents strip is present (with agents or empty state)
- Cost summary chart renders with visual data representation
- Recent activity and upcoming work widgets are present

## Failure Criteria

- Any stat card shows "NaN", "undefined", or remains in a loading shimmer state for more than 5 seconds
- "Today's Cost" does not start with "$" or shows non-numeric content
- Fewer than 4 stat cards are rendered
- The cost summary chart area is blank or shows an error
- The page shows a JavaScript error or white screen
- Dashboard heading is not visible after page load
