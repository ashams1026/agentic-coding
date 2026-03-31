# Test Plan: Detail Panel — View

## Objective

Verify that selecting a work item opens the detail panel displaying the correct title, state, priority, description, children list, comments, and execution history.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (work items with descriptions, children, comments, and execution history)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/items`
   - Verify: "Work Items" heading is visible
   - Verify: work items are listed

2. **Click** a work item row that has rich data (description, children, etc.)
   - Target: click on the title text of a work item in the list
   - Expected: a detail panel slides in from the right side of the page
   - **Screenshot checkpoint:** Take screenshot. Examine: panel slide-in rendered cleanly, panel width proportional, list narrowed without clipping, panel header visible.

3. **Verify** the detail panel header shows the item's title
   - Look for: the work item's title displayed as a heading text in the panel header
   - Expected: the title matches exactly what was shown in the list row
   - The title should appear as clickable text (cursor changes on hover, indicating it is editable)

4. **Verify** the state badge is displayed
   - Look for: a colored badge in the header area showing the item's current state (e.g., "Backlog", "In Progress", "Ready")
   - Expected: the badge has a colored background tint matching the workflow state color

5. **Verify** the state transition dropdown is present
   - Look for: a dropdown labeled "Move to…" next to the state badge
   - Expected: the dropdown is clickable and shows valid transition states for the current state

6. **Verify** the priority selector is displayed
   - Look for: a small dropdown showing the item's priority (e.g., "P0 — Critical", "P1 — High", "P2 — Medium", "P3 — Low")
   - Expected: the selector shows a colored dot and the priority level
   - **Screenshot checkpoint:** Take screenshot. Examine: header area layout — title, state badge, Move to dropdown, priority selector all visible, properly spaced, no overlapping or clipping.

7. **Verify** the persona assignment is displayed (if assigned)
   - Look for: a circular avatar with a letter and the persona name in the header area
   - Expected: if the item has an assigned persona, the avatar and name are visible

8. **Verify** the labels section is present
   - Look for: a row of label badges below the header, or a "+ label" button if no labels exist
   - Expected: existing labels appear as small badges; a dashed "+ label" button is always available to add new ones

9. **Verify** the Description section
   - Look for: a heading "Description" with an "Edit" button
   - Expected: if the item has a description, the text is displayed below the heading
   - If no description exists, the text "No description. Click Edit to add one." should appear in italics
   - **Screenshot checkpoint:** Take screenshot. Examine: description text rendering, paragraph spacing, Edit button alignment, section heading styling, empty state italic text readability.

10. **Verify** the Children section
    - Look for: a heading "Children" followed by child work items or empty state
    - If children exist: each child shows a state badge and title, with a count like "2/5 done" in the header
    - If no children: the text "No children. Click 'Add child' or 'Decompose'." should appear
    - Look for: an "Add child" button below the children list

11. **Verify** the Comments section
    - Look for: a heading "Comments" followed by the comment stream
    - Expected: if comments exist, they appear with author info and timestamps
    - A text input or area for adding new comments should be present
    - **Screenshot checkpoint:** Take screenshot. Examine: comment layout, author avatars/names alignment, timestamp placement, comment text wrapping, input area styling, section spacing.

12. **Verify** the Execution History section
    - Look for: a heading "Execution History" followed by execution entries
    - Expected: if executions exist, they show persona, status, duration, and cost information
    - If no executions exist, an empty state message should be displayed

13. **Verify** the Metadata section at the bottom
    - Look for: rows showing "ID", "Created", and "Updated"
    - Expected: ID shows a value like "wi-xxxxx" (work item ID format)
    - Created and Updated show date/time strings (not "Invalid Date" or blank)
    - **Screenshot checkpoint:** Take screenshot. Examine: metadata label/value alignment, date formatting, section bottom spacing, overall panel scroll behavior.

14. **Verify** the close button works
    - Look for: an X button in the top-right corner of the panel header
    - Click it
    - Expected: the detail panel closes and the work item row in the list loses its highlighted styling

15. **Select** a different work item
    - Click a different work item in the list
    - Expected: the detail panel updates to show the new item's data (different title, possibly different state/priority)

16. **Take final screenshot** of the detail panel showing all sections for evidence (full page)

## Expected Results

- Clicking a work item opens the detail panel on the right side
- The panel shows the item's title as an editable heading
- State badge with correct color and "Move to…" transition dropdown are present
- Priority selector shows the correct level with a colored dot
- Labels section shows existing labels or "+ label" button
- Description section shows text or "No description" empty state with Edit button
- Children section shows child items with state badges or empty state with "Add child" button
- Comments section renders with existing comments and input for new ones
- Execution History section renders with past executions or empty state
- Metadata shows ID, Created, and Updated with valid values
- Close button dismisses the panel
- Selecting a different item updates the panel content

### Visual Quality

- Panel sizing: proper width proportion with list, no content clipping at edges
- Header layout: title, state badge, dropdown, priority all on same line or wrapped cleanly
- Section spacing: consistent gaps between Description, Children, Comments, Execution History, Metadata
- Labels: badge sizing consistent, "+ label" button aligned with existing badges
- Children list: state badges aligned, child rows evenly spaced, progress count readable
- Comments: author info and timestamps aligned, comment text wraps properly, input area full-width
- Execution history: persona/status/duration/cost aligned in columns, entries evenly spaced
- Metadata: label-value pairs aligned, no clipping of long IDs or dates
- Scrolling: panel scrolls smoothly when content exceeds viewport height

## Failure Criteria

- Clicking a work item does not open the detail panel
- The title in the panel does not match the item clicked in the list
- State badge is missing or shows wrong state
- "Move to…" dropdown is missing or shows no transition options for a non-Done item
- Priority selector is missing
- Description section is completely absent
- Children section is completely absent
- Comments section is completely absent
- Execution History section is completely absent
- Metadata shows "Invalid Date" or blank values
- The panel does not update when a different item is selected
- The page shows a JavaScript error or white screen

### Visual Failure Criteria

- Panel clips content at right edge or bottom
- Header elements overlap (title runs into state badge or priority selector)
- Section headings misaligned or inconsistent styling between sections
- Labels row overflows its container or badges stack vertically unintentionally
- Comment text overflows its container without wrapping
- Execution history entries are cramped with no spacing between rows
- Metadata values truncated or illegible
- Panel doesn't scroll when content exceeds height (content cut off at bottom)
