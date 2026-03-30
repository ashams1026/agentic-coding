# Test Plan: Settings — Workflow

## Objective

Verify the Settings Workflow section renders the persona-per-state assignment table for all configurable workflow states and that the auto-routing toggle works.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173`
- API mode set to "api"
- Database seeded with test data (project with persona assignments)

## Steps

1. **Navigate** to `http://localhost:5173/settings`
   - Verify: the Settings page loads

2. **Click** the "Workflow" section in the sidebar
   - Target: the "Workflow" nav item with a git-branch icon in the settings sidebar
   - Expected: the heading changes to "Workflow" and the workflow config content appears

3. **Verify** the auto-routing toggle is present
   - Look for: a bordered card with "Auto-routing" heading
   - Expected: description text shows either "Auto-routing: ON — Router agent will automatically transition work items" or "Auto-routing: OFF — Manual transitions only"
   - A toggle switch (role="switch") should be visible, colored green if ON or gray if OFF

4. **Toggle** auto-routing
   - Click the toggle switch
   - Expected: the toggle flips state (ON→OFF or OFF→ON)
   - The description text updates to reflect the new state
   - The toggle color changes (green↔gray)

5. **Toggle** auto-routing back to its original state
   - Click the toggle switch again
   - Expected: it returns to the original state

6. **Verify** the persona-per-state table renders
   - Look for: a heading "Persona Assignments" with description "Assign a persona to each workflow state..."
   - Look for: a table with column headers "State", "Persona", "Model"
   - Expected: the table is visible below the auto-routing toggle

7. **Verify** the table shows 5 configurable states
   - Look for: rows for "Planning", "Decomposition", "Ready", "In Progress", and "In Review"
   - Expected: each row shows a colored dot matching the state color, the state name, a persona dropdown, and a model badge
   - Note: "Backlog", "Done", and "Blocked" should NOT appear as rows — they are excluded

8. **Verify** the non-configurable states note
   - Look for: a footer note at the bottom of the table
   - Expected: text "Backlog, Done, and Blocked have no assigned personas — they are manual or auto-triggered states."

9. **Verify** persona dropdowns show assigned personas
   - Look for: in each state row, the persona dropdown should show either a persona name (e.g., "Product Manager", "Tech Lead", "Engineer") or "Not assigned"
   - Expected: at least some states have personas assigned from seeded data

10. **Verify** model badges display correctly
    - Look for: in rows with assigned personas, a colored badge showing the model (e.g., "opus" in purple, "sonnet" in blue, "haiku" in green)
    - For unassigned rows: a dash "—" should appear instead

11. **Verify** the workflow state machine diagram renders
    - Look for: an SVG diagram below the table labeled "Workflow State Machine"
    - Expected: node rectangles for all 8 states with lines/arrows between them

12. **Take screenshot** of the workflow settings for evidence

## Expected Results

- The Workflow section shows the auto-routing toggle with correct state indication
- Toggling auto-routing updates the description text and toggle color
- The persona-per-state table renders with 5 configurable states (Planning, Decomposition, Ready, In Progress, In Review)
- Each row shows a state name with colored dot, persona dropdown, and model badge
- The note about Backlog/Done/Blocked excluded states is visible
- The workflow state machine diagram renders with all 8 states

## Failure Criteria

- The Workflow section does not load or shows a white screen
- The auto-routing toggle is missing or does not toggle
- The persona-per-state table is missing
- Fewer or more than 5 state rows appear (should exclude Backlog, Done, Blocked)
- Persona dropdowns are missing or do not show persona names
- Model badges show wrong colors or are missing for assigned personas
- The non-configurable states note is missing
- Any action causes a JavaScript error
