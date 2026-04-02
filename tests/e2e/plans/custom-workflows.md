# Test Plan: Custom Workflows

## Objective

Verify the Custom Workflows feature end-to-end: default workflow seeding, dynamic views using workflow data, workflow builder CRUD, publish flow, and validation errors.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with default workflow (`wf-default`)
- chrome-devtools MCP connected
- At least one project exists with `workflowId` set

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail.

### Part 1: Default Workflow Seeded on Startup

1. **Navigate** to `http://localhost:5173/workflows`
   - Verify: page loads, "Workflows" heading visible
   - **Screenshot checkpoint**

2. **Verify** default workflow card is visible
   - Look for: card with text "Default" and "Published" badge
   - Expected: at least one workflow card, showing the built-in 8-state workflow description
   - **Screenshot checkpoint**

3. **Click** the "Default" workflow card
   - Expected: navigates to `/workflows/wf-default`, loads the workflow builder
   - **Screenshot checkpoint**

4. **Verify** builder loads with 8 states
   - Look for: "STATES (8)" header in left panel
   - Expected: Backlog (initial), Planning, Decomposition, Ready, In Progress, In Review (intermediate), Done, Blocked (terminal) — all with color dots
   - Check: SVG preview panel shows nodes and arrow connections
   - **Screenshot checkpoint**

### Part 2: Dynamic Flow View Columns

5. **Navigate** to `http://localhost:5173/items`
   - Verify: page loads, work items view visible
   - **Screenshot checkpoint**

6. **Switch to Flow View** (if not default)
   - Click the flow/board view toggle if visible
   - Expected: kanban-style columns appear

7. **Verify** columns match workflow states
   - Expected: columns for each non-blocked state from the default workflow (Backlog, Planning, Decomposition, Ready, In Progress, In Review, Done)
   - Check: column headers have correct state colors (colored dots or borders)
   - **Screenshot checkpoint**

### Part 3: Dynamic State Filters

8. **Verify** filter bar has state dropdown
   - Look for: filter controls at top of work items view
   - Click the state filter dropdown
   - Expected: dropdown options match the default workflow states (not hardcoded)
   - **Screenshot checkpoint**

9. **Select a state filter** (e.g., "In Progress")
   - Expected: work items list filters to show only items in that state
   - **Screenshot checkpoint**

10. **Clear the filter**
    - Expected: all work items visible again

### Part 4: Dynamic Move-to Transitions

11. **Navigate** to a work item detail (click any work item, or create one if none exist)
    - If no work items exist: create one via the UI or API
    - **Screenshot checkpoint**

12. **Verify** "Move to" dropdown shows valid transitions
    - Look for: state transition control in the detail panel
    - Click the state/move dropdown
    - Expected: only valid target states appear (based on workflow transitions, not all states)
    - **Screenshot checkpoint**

### Part 5: Workflow Builder — Create New Workflow

13. **Navigate** to `http://localhost:5173/workflows`
    - **Screenshot checkpoint**

14. **Click** "+ New Workflow" button
    - Expected: dialog opens with name input
    - **Screenshot checkpoint**

15. **Type** "Test Workflow" into the name input
    - Expected: text appears in input, "Create" button becomes enabled

16. **Click** "Create" button
    - Expected: dialog closes, navigates to the new workflow's builder page
    - Verify: URL is `/workflows/<new-id>`, builder shows empty state list
    - **Screenshot checkpoint**

### Part 6: Workflow Builder — Add/Edit States

17. **Click** "Add State" button
    - Expected: new state card appears in left panel with empty name, type "Intermediate"
    - **Screenshot checkpoint**

18. **Type** "New" into the state name input
    - Expected: state card header updates to show "New"

19. **Change state type** to "Initial" via the type dropdown
    - Expected: type dropdown shows "Initial"

20. **Click a color** in the color picker (pick a different color)
    - Expected: state card header color changes, preview node updates

21. **Add a second state**: click "Add State" again
    - Type name "Done", set type to "Terminal"
    - **Screenshot checkpoint**

22. **Add a transition**: on the "New" state card, click "+ Add" in Transitions section
    - Expected: transition row appears with target state dropdown and label input
    - Select "Done" as target state
    - Type "complete" as label
    - **Screenshot checkpoint**

23. **Verify SVG preview** updates
    - Expected: preview shows two nodes ("New" and "Done") with an arrow from New → Done
    - **Screenshot checkpoint**

### Part 7: Workflow Builder — Validation

24. **Verify validation panel** shows "Workflow is valid" (green)
    - Expected: green success indicator since we have 1 initial, 1 terminal, and a transition
    - **Screenshot checkpoint**

25. **Delete the "New" state** (click trash icon on its card)
    - Expected: state removed from list, preview updates
    - Verify: validation now shows errors (missing initial state)
    - **Screenshot checkpoint**

26. **Undo**: add back an initial state and a transition to restore validity
    - Expected: validation returns to green

### Part 8: Workflow Builder — Save and Publish

27. **Click "Save" button** in the header
    - Expected: save completes (no error toast/banner)
    - **Screenshot checkpoint**

28. **Verify** the workflow name in the header input matches what was typed

29. **Click "Publish" button**
    - Expected: badge changes from "Draft" to "Published"
    - **Screenshot checkpoint**

30. **Navigate back** to `/workflows`
    - Expected: the new workflow card shows "Published" badge
    - **Screenshot checkpoint**

### Part 9: Workflow Builder — Delete Transition

31. **Click** the new workflow card to re-enter builder
    - **Screenshot checkpoint**

32. **Delete a transition** (click trash icon on a transition row)
    - Expected: transition row removed, preview arrow disappears
    - **Screenshot checkpoint**

### Part 10: Settings — Workflow Selector

33. **Navigate** to `http://localhost:5173/settings`
    - **Screenshot checkpoint**

34. **Verify** workflow section is visible
    - Look for: "Active Workflow" dropdown (only if 2+ workflows exist)
    - If 2+ workflows: dropdown should list all workflows with draft/published indicator
    - **Screenshot checkpoint**

35. **Verify** persona assignment table
    - Expected: shows intermediate states from the active workflow
    - State names and colors match the workflow
    - **Screenshot checkpoint**

36. **Take final screenshot** for evidence (full page)

## Expected Results

- Default workflow ("Default") seeded and visible in workflow list with "Published" badge
- Workflow builder loads all 8 states with correct types, colors, and transitions
- Flow view columns are dynamically generated from workflow states
- State filter dropdown options match workflow states
- Move-to transitions in detail panel only show valid targets
- New workflow can be created via dialog, states/transitions added in builder
- Validation panel correctly identifies: missing initial state, missing terminal state, unreachable states, dead-ends
- Save persists changes, Publish changes badge to "Published"
- Settings shows workflow selector (when 2+) and persona assignments for intermediate states

### Visual Quality

- No layout issues: state cards properly aligned in left panel, preview SVG scales correctly
- Color picker dots are round, evenly spaced, selected color has visible border
- Transition rows: dropdowns and inputs aligned horizontally, trash icon visible
- SVG preview: nodes have readable text, arrows connect correctly, no overlapping
- Builder header: name input, badge, and buttons aligned horizontally
- Workflow list cards: consistent sizing, hover effect visible
- Validation messages: error (red) and warning (amber) backgrounds distinct

## Failure Criteria

- Default workflow not found in `/workflows` list
- Builder fails to load states/transitions from API
- Flow view columns don't match workflow states (still hardcoded)
- State filter shows hardcoded states instead of workflow states
- Move-to dropdown shows all states instead of valid transitions
- Creating a new workflow errors or doesn't navigate to builder
- Adding/removing states doesn't update the preview
- Validation panel doesn't detect missing initial/terminal state
- Save or Publish fails with error
- Settings doesn't show workflow selector when 2+ workflows exist

### Visual Failure Criteria

- Any visual defect counts as a visual failure even if the functional test passes
- Elements overlap or clip outside their containers
- Text is invisible or unreadable (wrong color, too small, clipped)
- Layout breaks: state cards overflow panel, preview SVG clips, broken grid
- Inconsistent spacing: some elements cramped while others have excessive gaps
- Broken colors: wrong state colors, color picker dots misshapen
- SVG arrows point to wrong positions or don't render
- Content truncation: state names cut off without ellipsis
