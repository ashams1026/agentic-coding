# Test Plan: Work Items — List View

## Objective

Verify the Work Items page renders in list view by default, displays work items with titles/state badges/priority badges, supports parent-child expansion, and opens the detail panel on item click.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173`
- API mode set to "api"
- Database seeded with test data (work items including at least one parent with children)

## Steps

1. **Navigate** to `http://localhost:5173/items`
   - Verify: "Work Items" heading is visible
   - Verify: subheading "Manage and track all work across your project." is visible

2. **Verify** list view is the default active view
   - Look for: the view toggle bar with "List" and "Flow" buttons
   - Expected: the "List" button has active styling (solid background with shadow) while "Flow" does not

3. **Verify** the filter bar is present
   - Look for: a search input with placeholder "Search items..."
   - Look for: a "State" dropdown showing "All states"
   - Look for: a "Priority" dropdown showing "All priorities"
   - Look for: a "Persona" button
   - Look for: a "Group by" dropdown
   - Look for: a "Sort by" dropdown with a sort direction toggle button (arrow icon)

4. **Verify** work items render in the list
   - Look for: multiple rows, each containing a state badge, priority badge, and title text
   - Expected: at least 3 work items visible (seeded data should include multiple items)

5. **Verify** state badges are present and colored
   - Look for: badges showing state names such as "Backlog", "Planning", "Ready", "In Progress", "In Review", or "Done"
   - Expected: each badge has a colored background tint (not plain gray) matching the workflow state color

6. **Verify** priority badges are present
   - Look for: badges showing "P0", "P1", "P2", or "P3"
   - Expected: each badge has a colored border (red for P0, amber for P1, blue for P2, gray for P3)

7. **Identify** a parent work item that has children
   - Look for: a row that shows a chevron (▶) icon on the left side and a progress indicator (e.g., "2/5") on the right side
   - Expected: the chevron indicates this item can be expanded

8. **Click** the chevron icon on the parent item to expand it
   - Target: the chevron (▶) button on the left of the parent row
   - Expected: the chevron rotates 90° to point downward, and child items appear indented below the parent

9. **Verify** child items render indented under the parent
   - Look for: items appearing below the parent with extra left padding
   - Expected: child items have the same structure (state badge, priority badge, title) as top-level items

10. **Click** the chevron again to collapse the children
    - Expected: child items disappear and the chevron rotates back to its original position

11. **Click** a work item row (not the chevron) to open the detail panel
    - Target: click on the title text of any work item
    - Expected: a detail panel slides in from the right side of the page, and the clicked item's row gets highlighted (accent background with ring)

12. **Verify** the detail panel shows correct item data
    - Look for: the item's title displayed as a heading in the panel
    - Look for: a state badge matching the item's state in the list
    - Look for: a priority selector showing the item's priority (P0/P1/P2/P3)
    - Look for: a "Move to…" dropdown for state transitions
    - Look for: a "Description" section
    - Look for: a "Children" section
    - Look for: a "Comments" section
    - Look for: an "Execution History" section
    - Look for: metadata showing ID, Created, and Updated timestamps

13. **Verify** the detail panel can be closed
    - Look for: an X button in the top-right corner of the panel
    - Click it
    - Expected: the detail panel closes and the item row loses its highlighted styling

14. **Take screenshot** of the list view with items visible for evidence

## Expected Results

- "Work Items" heading and subheading are visible
- List view is the default (List button active, not Flow)
- Filter bar renders with search, state, priority, persona, group by, and sort controls
- Work items render as rows with state badges (colored), priority badges (P0-P3), and titles
- Parent items have an expand/collapse chevron and progress indicator
- Clicking the chevron expands children indented below the parent
- Clicking a work item row opens the detail panel with title, state, priority, description, children, comments, execution history, and metadata
- The detail panel can be closed via the X button

## Failure Criteria

- "Work Items" heading is not visible after page load
- List view is not the default (Flow view shows instead)
- No work items appear in the list (blank area or loading spinner stuck for more than 5 seconds)
- Work item rows are missing state badges or priority badges
- Parent item chevron does not expand/collapse children
- Clicking a work item does not open the detail panel
- Detail panel is missing any of: title, state badge, priority, description section, children section, comments section, execution history section
- The page shows a JavaScript error or white screen
