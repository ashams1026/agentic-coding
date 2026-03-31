# Test Plan: Detail Panel — Edit

## Objective

Verify that work item fields can be edited through the detail panel: title, description (with Write/Preview tabs), priority, labels, and state transitions — and that each mutation persists after page reload.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (at least one work item in a non-Done state)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/items`
   - Verify: "Work Items" heading is visible

2. **Click** a work item to open the detail panel
   - Target: click any work item row in the list
   - Expected: the detail panel opens showing the item's data

3. **Note** the current title text for later comparison

4. **Click** the title text to enter edit mode
   - Target: the title heading in the panel header (shows cursor change on hover)
   - Expected: the title transforms into a text input field, pre-filled with the current title, and the text is selected
   - **Screenshot checkpoint:** Take screenshot. Examine: title input field rendering — full width, text selected, input border/focus ring visible, no layout shift in header area.

5. **Change the title** to a new value
   - Action: clear the input and type "Updated Test Title"
   - Press Enter to save
   - Expected: the input reverts to a heading displaying "Updated Test Title"

6. **Verify** the title change is reflected in the list
   - Look for: the same work item row in the list now showing "Updated Test Title"
   - Expected: the list row title matches the panel title

7. **Edit the description** using Write/Preview tabs
   - Look for: the "Description" section with an "Edit" button
   - Click the "Edit" button
   - Expected: a text area appears with "Write" and "Preview" tabs above it
   - **Screenshot checkpoint:** Take screenshot. Examine: description editor layout — textarea sizing, Write/Preview tab styling, Save/Cancel button placement, no overlap with adjacent sections.

8. **Type** a description in the Write tab
   - Action: type "This is a test description for verification."
   - Verify: the text appears in the text area

9. **Switch** to the Preview tab
   - Click the "Preview" tab
   - Expected: the tab becomes active and the typed text is displayed as rendered content below
   - **Screenshot checkpoint:** Take screenshot. Examine: markdown preview rendering — text readable, tab active state visible, preview area properly sized, no raw markdown leaking through.

10. **Save** the description
    - Click the "Save" button below the text area
    - Expected: the description section now shows "This is a test description for verification." as static text, the edit mode is dismissed

11. **Change the priority** via the dropdown
    - Look for: the priority selector in the header (showing current priority like "P2")
    - Click it to open the dropdown
    - Select a different priority (e.g., "P0 — Critical")
    - Expected: the selector updates to show the new priority with the correct colored dot (red for P0)
    - **Screenshot checkpoint:** Take screenshot. Examine: priority dropdown rendering — options list aligned, colored dots visible, selected option highlighted, dropdown dismisses cleanly.

12. **Add a label**
    - Look for: the "+ label" button in the labels row
    - Click it
    - Expected: a small text input appears
    - Type "test-label" and press Enter
    - Expected: a new badge "test-label" appears in the labels row
    - **Screenshot checkpoint:** Take screenshot. Examine: new label badge styling — consistent with existing badges, properly sized, remove button visible, labels row not overflowing.

13. **Change the state** via the transition dropdown
    - Look for: the "Move to…" dropdown next to the state badge
    - Click it and select a valid transition state (e.g., if current state is "Backlog", select "Planning")
    - Expected: either the state badge updates immediately, or a "Trigger Agent" dialog appears
    - If the dialog appears: click "Skip" to transition without running an agent
    - Verify: the state badge now shows the new state with the correct color
    - **Screenshot checkpoint:** Take screenshot. Examine: state badge updated with new color, transition dialog (if shown) properly centered and styled, state badge color matches new state.

14. **Reload** the page to verify persistence
    - Action: navigate to `http://localhost:5173/items` (full page reload)
    - Verify: the work items list loads

15. **Click** the same work item to reopen the detail panel
    - Look for: the item with title "Updated Test Title" in the list
    - Click it to open the detail panel

16. **Verify** all edits persisted after reload
    - Title: shows "Updated Test Title"
    - Description: shows "This is a test description for verification."
    - Priority: shows the changed priority (e.g., "P0 — Critical" with red dot)
    - Labels: the "test-label" badge is present
    - State: shows the new state (e.g., "Planning" with purple color)
    - **Screenshot checkpoint:** Take screenshot. Examine: all 5 mutations visible and correctly rendered after reload — title, description text, priority color, label badge, state badge color.

17. **Take final screenshot** of the detail panel showing persisted edits for evidence (full page)

## Expected Results

- Clicking the title enters inline edit mode with pre-filled, selected text
- Pressing Enter saves the new title; it updates in both the panel and the list
- Clicking "Edit" on description shows Write/Preview tabs and a text area
- The Preview tab renders the typed description text
- Clicking "Save" persists the description
- The priority dropdown changes the priority with correct color indicator
- The "+ label" button opens inline input; typing and pressing Enter adds a label badge
- The "Move to…" dropdown transitions the state (with optional agent prompt dialog)
- After a full page reload, all mutations are persisted: title, description, priority, labels, and state

### Visual Quality

- Title edit: input field same width as heading, no layout jump on enter/exit edit mode
- Description editor: textarea properly sized, Write/Preview tabs clearly distinguished, Save/Cancel buttons visible
- Markdown preview: rendered text matches expected formatting, readable, properly contained
- Priority dropdown: options aligned, colored dots visible, selected state highlighted
- Label input: inline input same size as label badges, new badge appears without layout shift
- State transition: dialog (if shown) centered, properly shadowed, buttons clickable
- Post-reload: all edits rendered identically to pre-reload state

## Failure Criteria

- Clicking the title does not enter edit mode
- Pressing Enter does not save the title (it reverts to the old value)
- The "Edit" button for description is missing or does not open the editor
- Write/Preview tabs are missing or non-functional
- The "Save" button does not persist the description
- The priority dropdown does not change the displayed priority
- The "+ label" button does not open an input or adding a label fails
- The "Move to…" dropdown shows no options for a non-Done state
- State transition does not update the state badge
- After page reload, any of the edits are lost (title, description, priority, labels, or state revert to old values)
- Any edit action causes a JavaScript error or API error

### Visual Failure Criteria

- Title input field overflows panel width or causes header layout to break
- Description textarea clips text or doesn't resize for content
- Write/Preview tabs overlap or have broken active state styling
- Priority dropdown options misaligned or colored dots invisible
- Label input appears outside the labels row or causes badges to wrap unexpectedly
- Transition dialog (if shown) obscures important content without proper backdrop
- After reload, any field renders with different styling than before reload
