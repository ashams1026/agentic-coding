# Test Plan: Router Structured Output

## Objective

Verify that Router decision cards display correctly in the agent monitor history and activity feed, showing state badge, reasoning, and confidence indicator.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- Database seeded with test data
- chrome-devtools MCP connected
- At least one Router execution with `structuredOutput` populated (requires a real Router execution with `isRouter: true` and `outputFormat` enabled, or manually seeded test data)

**Note:** The `structuredOutput` field is only populated when the Router persona runs with `outputFormat: { type: "json_schema" }` enabled (SDK.SO.1). Existing seeded executions predate this feature and will have `structuredOutput: null`. Steps requiring visible Router decision cards may be SKIP if no executions have structured output data.

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Agent Monitor History — Router Decision Card (5 steps)

1. **Navigate** to `http://localhost:5173/agents`
   - Verify: Agent monitor page loads
   - **Screenshot checkpoint:** Take screenshot

2. **Switch to History tab**
   - Verify: Execution history table visible with rows
   - **Screenshot checkpoint:** Take screenshot

3. **Find a Router execution row** in the history table
   - Look for: row with "Router" persona name
   - Expected: Router rows present (seeded data includes Router executions)
   - **Screenshot checkpoint:** Take screenshot

4. **Expand a Router execution row** by clicking it
   - If Router execution has `structuredOutput`: verify RouterDecisionCard appears above the terminal renderer
   - Expected card contents: state badge (color matching workflow state), "Router Decision" label, confidence indicator (dot + label), reasoning text
   - **Screenshot checkpoint:** Take screenshot of expanded card (SKIP if no structured output data)

5. **Verify state badge color** matches the WORKFLOW states config
   - Look for: badge with state name (e.g., "In Review", "Done") colored to match `WORKFLOW.states[].color`
   - Expected: border and text color from the workflow state (e.g., green for "Done", orange for "In Review")
   - (SKIP if no structured output data)

### Part 2: Activity Feed — Router Decision Event (5 steps)

6. **Navigate** to `http://localhost:5173/activity`
   - Verify: Activity feed page loads with event list
   - **Screenshot checkpoint:** Take screenshot

7. **Look for Router Decision events** in the feed
   - Look for: events with "Router Decision" badge (indigo color) and Route icon
   - If Router executions have `structuredOutput`: these appear as `router_decision` type events
   - If no structured output: Router executions appear as generic `agent_completed` events
   - **Screenshot checkpoint:** Take screenshot

8. **Verify compact Router decision display** in activity feed
   - Look for: inline state badge (color-coded) + confidence dot (green/amber/red) + reasoning text below
   - Expected: compact variant of RouterDecisionCard renders inline with event metadata
   - **Screenshot checkpoint:** Take screenshot (SKIP if no router_decision events)

9. **Verify confidence indicator colors**
   - Look for: emerald dot for "high", amber dot for "medium", red dot for "low"
   - Expected: dot color matches confidence label text color
   - (SKIP if no structured output data to verify)

10. **Compare Router vs non-Router events** in the feed
    - Find a regular `agent_completed` event (non-Router)
    - Expected: shows plain text description, no state badge or confidence indicator
    - This confirms the conditional rendering works — only Router decisions get the card treatment

### Part 3: Visual Quality (3 steps)

11. **Take full-page screenshot** of agent monitor with expanded Router decision card
    - Verify: card sits cleanly between row and terminal renderer, no overlap, proper border-b separation
    - Check: bg-card background, rounded-lg border, consistent spacing

12. **Take full-page screenshot** of activity feed with Router decision events
    - Verify: compact badge + dot renders inline without breaking event row layout
    - Check: reasoning text below doesn't overflow or clip

13. **Verify dark mode** styling of Router decision elements
    - Check: state badge border/text visible, confidence dot visible, reasoning text readable
    - Expected: bg-card adapts to dark theme, muted-foreground text for labels

## Expected Results

- Router executions with `structuredOutput` show decision cards in agent history (expanded view)
- Decision cards display: state badge (color from WORKFLOW), reasoning text, confidence dot (green/amber/red)
- Activity feed shows `router_decision` events for Router executions with structured output
- Compact card renders inline in activity feed with badge + dot
- Router executions without `structuredOutput` fall back to standard display (no card)
- Non-Router executions never show decision cards

### Visual Quality

- State badge uses correct workflow state color (border + text)
- Confidence dot is visible and correctly colored (emerald/amber/red)
- Card layout: clean border, proper padding, reasoning text wraps naturally
- Compact variant: badge and dot align inline, no layout breaks
- Dark mode: all elements visible with proper contrast

## Failure Criteria

- Decision card shows for non-Router executions
- Decision card shows when `structuredOutput` is null
- State badge has wrong color (doesn't match workflow state)
- Confidence dot missing or wrong color
- Reasoning text truncated or not displayed
- Card overlaps with terminal renderer or table rows

### Visual Failure Criteria

- State badge text invisible (same color as background)
- Confidence dot too small to see or missing
- Card breaks table layout when expanded
- Compact variant overflows activity feed event row
- Dark mode: elements invisible or unreadable
