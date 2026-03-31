# Test Plan: Work Items — Flow View

## Objective

Verify the Flow View renders state machine nodes for all 8 workflow states with item counts, displays arrows between states representing valid transitions, and supports clicking a state node to filter and display items in that state.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (work items spread across multiple workflow states)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/items?view=flow`
   - Verify: "Work Items" heading is visible
   - Verify: the "Flow" button in the view toggle has active styling (solid background with shadow)
   - **Screenshot checkpoint:** Take screenshot. Examine: overall flow view layout, node positioning, arrow rendering, sidebar alignment, no clipping or overflow of the graph area.

2. **Verify** all 8 workflow state nodes are rendered
   - Look for: nodes labeled "Backlog", "Planning", "Decomposition", "Ready", "In Progress", "In Review", "Done", and "Blocked"
   - Expected: 7 nodes in a horizontal row (Backlog through Done), with "Blocked" positioned below the center
   - Each node should have a colored header bar with a colored dot and the state name
   - **Screenshot checkpoint:** Take screenshot. Examine: node layout symmetry, consistent node sizes, colored headers visible and distinct, state labels readable, Blocked node clearly separated.

3. **Verify** each state node displays an item count
   - Look for: a small badge inside each node's header showing a number
   - Expected: each node shows a numeric count (e.g., "0", "3", "5") — not blank, NaN, or undefined
   - The count represents the number of work items currently in that state

4. **Verify** each state node shows an agent status indicator
   - Look for: inside each node's body, either a green pulsing dot with text like "1 active" or "2 active", or the text "idle"
   - Expected: nodes with running agents show the green active indicator; nodes without show "idle"

5. **Verify** arrows between states are rendered
   - Look for: curved lines (SVG paths) connecting the state nodes with arrowheads
   - Expected: arrows follow the valid transitions:
     - Backlog → Planning
     - Planning → Ready, Planning → Blocked
     - Decomposition → In Progress, Decomposition → Blocked
     - Ready → In Progress, Ready → Decomposition, Ready → Blocked
     - In Progress → In Review, In Progress → Blocked
     - In Review → Done, In Review → In Progress
     - Blocked → Planning, Blocked → Decomposition, Blocked → Ready, Blocked → In Progress
   - Verify at least several visible arrow paths with arrowhead markers
   - **Screenshot checkpoint:** Take screenshot. Examine: arrow path rendering (smooth curves, no jagged lines), arrowheads visible, arrows don't overlap node content, no stray paths or visual artifacts.

6. **Verify** item counts across nodes are consistent
   - Add up the item count badges from all 8 state nodes
   - Switch to list view (`http://localhost:5173/items?view=list`) and count total items
   - Expected: the sum of all flow view node counts equals the total number of items in the list view

7. **Navigate back** to flow view (`http://localhost:5173/items?view=flow`)
   - Verify: flow view is restored with all 8 nodes

8. **Click** a state node that has items (count > 0)
   - Target: click on a node like "In Progress" or "Ready" that shows a non-zero count
   - Expected: the node gets a highlighted ring/border (selected styling), and a filtered items panel appears below the state machine graph
   - **Screenshot checkpoint:** Take screenshot. Examine: selected node highlight styling, filtered panel layout below graph, panel header alignment, item rows rendering, no overlap between graph and panel.

9. **Verify** the filtered items panel content
   - Look for: a header with a colored dot, the state name, and an item count badge
   - Look for: a list of work items, each showing a priority label (P0/P1/P2/P3), a title, and optionally a persona avatar
   - Expected: the number of items in the list matches the count shown on the clicked node

10. **Click** an item in the filtered items list
    - Target: any work item row in the filtered list
    - Expected: the item becomes highlighted (selected) and the detail panel opens on the right side of the page showing that item's data

11. **Click** the same state node again to deselect it
    - Target: click the same highlighted state node from step 8
    - Expected: the node loses its highlighted styling, and the filtered items panel disappears

12. **Click** a state node with zero items
    - Target: click a node showing count "0"
    - Expected: the filtered items panel appears with the message "No items in this state."

13. **Take final screenshot** of the flow view with all nodes visible for evidence (full page)

## Expected Results

- All 8 workflow state nodes are rendered (7 in a row, Blocked below)
- Each node shows a state name, colored header, item count badge, and agent status ("idle" or "N active")
- Arrows with arrowheads connect states according to the workflow transition rules
- The sum of all node item counts matches the total work items in list view
- Clicking a state node highlights it and shows a filtered items panel below
- The filtered items panel shows items with priority, title, and persona
- Clicking a filtered item selects it and opens the detail panel
- Clicking the same state node again deselects it and hides the filtered panel
- Clicking a node with zero items shows "No items in this state."

### Visual Quality

- Node layout: all 7 main nodes evenly spaced in a row, consistent widths and heights
- Node styling: colored headers distinct per state, state labels readable, count badges visible
- Blocked node: clearly offset below the main row, visually connected via dashed or distinct arrows
- Arrows: smooth SVG paths, arrowheads visible, no overlapping node content or labels
- Agent indicators: green pulsing dots visible, "idle" text readable, consistent placement within nodes
- Filtered panel: appears below graph without overlapping, header aligned, item rows evenly spaced
- Overall: graph centered in content area, no horizontal scrolling, no clipping at edges

## Failure Criteria

- Fewer than 8 state nodes are rendered
- Any node is missing its state name or item count badge
- No arrows are visible between nodes
- Item count badges show NaN, undefined, or are blank
- The sum of node counts does not match the list view total
- Clicking a state node does not show the filtered items panel
- The filtered items panel shows incorrect items (wrong state)
- Clicking a node with zero items causes an error instead of showing the empty message
- The page shows a JavaScript error or white screen

### Visual Failure Criteria

- Nodes have inconsistent sizes or are unevenly spaced in the row
- State labels or count badges clipped or invisible against node background
- Arrows overlap node content, labels, or count badges
- Arrow paths are jagged, broken, or missing arrowheads
- Blocked node overlaps the main row or is not visually distinguished
- Filtered panel overlaps the state machine graph
- Node colors are wrong or indistinguishable from each other
