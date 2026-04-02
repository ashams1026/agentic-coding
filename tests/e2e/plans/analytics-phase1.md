# Test Plan: Analytics + Token Usage Phase 1

## Objective

Verify the Analytics page with Overview and Token Usage tabs, summary cards, Recharts charts, time range selector, and per-persona/model breakdowns.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with at least one project
- chrome-devtools MCP connected
- Analytics API endpoints registered (`/api/analytics/*`)

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Analytics Page Navigation + Tabs

1. **Navigate** to `http://localhost:5173/analytics`
   - Verify: page loads with "Analytics" heading and subtitle
   - Verify: sidebar shows "Analytics" with BarChart3 icon, active highlight
   - **Screenshot checkpoint**

2. **Verify** Overview tab is active by default
   - Expected: "Overview" tab has underline/active styling, "Token Usage" does not
   - **Screenshot checkpoint**

3. **Click** "Token Usage" tab
   - Expected: tab switches, Token Usage content visible, Overview hidden
   - "Token Usage" tab now has active styling
   - **Screenshot checkpoint**

4. **Click** "Overview" tab to switch back
   - Expected: Overview content visible again

### Part 2: Overview Tab — Summary Cards

5. **Verify** 4 summary cards render on Overview tab
   - Look for: "Total Cost" with DollarSign icon (blue)
   - Look for: "Total Executions" with Zap icon (purple)
   - Look for: "Success Rate" with CheckCircle2 icon (green)
   - Look for: "Avg Duration" with Clock icon (amber)
   - Check: values are numbers (not "undefined" or "NaN")
   - **Screenshot checkpoint**

### Part 3: Overview Tab — Time Range Selector

6. **Verify** time range selector is visible
   - Expected: 3 buttons: "7 days" (active/primary), "30 days", "90 days"
   - **Screenshot checkpoint**

7. **Click** "30 days" button
   - Expected: "30 days" becomes active, "7 days" becomes inactive
   - Charts should update (may show same data if range doesn't affect results)
   - **Screenshot checkpoint**

8. **Click** "90 days" button
   - Expected: "90 days" becomes active

### Part 4: Overview Tab — Charts

9. **Verify** "Cost Trend" chart section
   - Look for: "Cost Trend" heading
   - Expected: either a Recharts LineChart with data OR "No data for this time range" empty state
   - If data present: X-axis with dates, Y-axis with dollar amounts, line with dots
   - **Screenshot checkpoint**

10. **Verify** "Cost by Persona" chart section
    - Look for: "Cost by Persona" heading
    - Expected: either a horizontal BarChart with persona names OR "No data for this time range"
    - If data present: Y-axis with persona names, X-axis with dollar amounts, colored bars
    - **Screenshot checkpoint**

### Part 5: Token Usage Tab — Charts

11. **Click** "Token Usage" tab
    - **Screenshot checkpoint**

12. **Verify** "Token Usage Over Time" chart
    - Look for: chart heading
    - Expected: ComposedChart with bars (tokens, left Y-axis) and line (cost, right Y-axis) OR empty state
    - **Screenshot checkpoint**

13. **Verify** "Breakdown by Model" pie chart
    - Look for: chart heading in left column
    - Expected: PieChart with model segments (opus=purple, sonnet=blue, haiku=green) OR "No data"
    - If data present: labels with model name + percentage, legend below with cost totals
    - **Screenshot checkpoint**

14. **Verify** "Most Expensive Executions" table
    - Look for: table heading in right column
    - Expected: table with columns: Date, Persona, Model, Tokens, Cost, Duration OR "No executions" empty state
    - If data present: rows sorted by cost descending, model dots with colors, mono font for numerics
    - **Screenshot checkpoint**

### Part 6: Analytics API Verification

15. **Verify** analytics API endpoints
    - Call `GET /api/analytics/cost-by-persona` — expected: `{ data: [...] }` with personaId, personaName, costUsd, totalTokens, executionCount
    - Call `GET /api/analytics/cost-by-model` — expected: `{ data: [...] }` with model, costUsd, totalTokens
    - Call `GET /api/analytics/tokens-over-time?range=7d` — expected: `{ data: [...] }` with date, totalTokens, costUsd
    - Call `GET /api/analytics/top-executions?limit=5` — expected: `{ data: [...] }` with id, personaName, model, costUsd, totalTokens

16. **Verify** range parameter works
    - Call `GET /api/analytics/tokens-over-time?range=30d`
    - Expected: date range spans 30 days (more entries than 7d)

17. **Take final screenshot** for evidence

## Expected Results

- Analytics page loads with two tabs (Overview active by default)
- 4 summary cards with correct icons, colors, and numeric values
- Time range selector toggles between 7d/30d/90d
- Cost Trend line chart renders (or shows empty state)
- Cost by Persona horizontal bar chart renders (or shows empty state)
- Token Usage Over Time dual-axis chart renders (or shows empty state)
- Model breakdown pie chart with color-coded segments renders (or shows empty state)
- Top executions table with 6 columns renders (or shows empty state)
- Analytics API returns correct JSON shapes with range/projectId filtering
- Sidebar shows Analytics link with BarChart3 icon

### Visual Quality

- Summary cards: consistent sizing, icons colored correctly, values readable
- Charts: proper axis labels, tooltips on hover, responsive sizing
- Time range buttons: active state clearly distinguished
- Pie chart: labels readable, color legend below chart
- Table: proper column alignment, mono font for numbers
- Two-column grid layout for pie + table on Token Usage tab

## Failure Criteria

- Analytics page doesn't load or shows error
- Tabs don't switch content
- Summary cards show undefined/NaN values
- Charts fail to render (no SVG elements)
- Time range selector doesn't affect chart data
- API endpoints return 500 or wrong shape
- Sidebar Analytics link missing or wrong icon

### Visual Failure Criteria

- Charts overflow their containers
- Summary cards misaligned or inconsistent sizing
- Pie chart labels overlap or are unreadable
- Table columns misaligned
- Time range buttons visually identical (no active state)
