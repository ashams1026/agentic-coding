# Test Plan: Settings — Projects

## Objective

Verify the Settings Projects section displays the project list, supports creating a new project with a valid path, and supports deleting a project.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173`
- API mode set to "api"
- Database seeded with test data (at least 1 existing project)

## Steps

1. **Navigate** to `http://localhost:5173/settings`
   - Verify: the Settings page loads with a sidebar navigation on the left
   - Verify: "Projects" is the default active section (highlighted in sidebar)
   - Verify: the heading "Projects" is displayed in the content area

2. **Verify** the project list renders
   - Look for: one or more project rows, each showing a project name (bold text) and a project path (smaller, muted text) below it
   - Expected: at least 1 project is visible from seeded data
   - Look for: the description text "Registered projects that agents can work on."

3. **Verify** each project row has edit and delete buttons
   - Hover over a project row
   - Look for: a pencil (edit) icon button and a red trash (delete) icon button appearing on hover
   - Expected: both buttons become visible on hover

4. **Click** the "Add project" button
   - Target: button with text "Add project" and a plus (+) icon in the top-right area
   - Expected: a form appears with "Project name" and "Project path" input fields

5. **Fill in** the new project form
   - Type "Test E2E Project" in the "Project name" input (placeholder "My Project")
   - Type "/tmp/test-e2e-project" in the "Project path" input (placeholder shows a path example)
   - Verify: a green "Valid path format" message appears below the path input (since path starts with "/")

6. **Verify** the "Browse..." button is present
   - Look for: a "Browse..." button next to the path input
   - Expected: the button is clickable (opens a folder browser modal — do not need to fully test the modal here)

7. **Submit** the form
   - Click the "Add project" button inside the form
   - Expected: the form closes and the new project "Test E2E Project" appears in the project list with path "/tmp/test-e2e-project"

8. **Verify** the new project is in the list
   - Look for: a project row showing name "Test E2E Project" and path "/tmp/test-e2e-project"
   - Expected: the project count has increased by one

9. **Delete** the newly created project
   - Hover over the "Test E2E Project" row
   - Click the red trash (delete) icon button
   - Expected: the project disappears from the list

10. **Verify** the project was removed
    - Look for: "Test E2E Project" should no longer appear in the list
    - Expected: the project count has decreased by one

11. **Take screenshot** of the projects section for evidence

## Expected Results

- The Settings page shows a sidebar with "Projects" as the default section
- The project list displays existing projects with name and path
- Each project row shows edit/delete buttons on hover
- The "Add project" button opens a form with name and path fields
- Typing a valid path (starting with "/") shows a green validation message
- Submitting the form creates the project and adds it to the list
- The delete button removes the project from the list
- The "Browse..." button is present next to the path input

## Failure Criteria

- The Settings page does not load or shows a white screen
- "Projects" is not the default section
- No project list is visible when seeded data exists
- The "Add project" button does not open the form
- Submitting the form does not create a new project
- The new project does not appear in the list after creation
- The delete button does not remove the project
- Path validation does not show for valid/invalid paths
- Any action causes a JavaScript error or API error
