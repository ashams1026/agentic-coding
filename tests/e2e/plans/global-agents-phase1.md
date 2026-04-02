# Test Plan: Global Agents Phase 1

## Objective

Verify the "All Projects" global scope feature works across navigation, dashboard, agent monitor, Pico chat, and the standalone execution endpoint.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with at least one project (e.g., "tictactoe")
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail.

### TC-GA-1: "All Projects" selector persists across navigations

1. **Navigate** to `http://localhost:5173/`
   - Verify: dashboard loads with a specific project selected
   - **Screenshot checkpoint**

2. **Click** the project selector dropdown in the sidebar
   - Verify: "All Projects" option appears at the top of the dropdown
   - **Screenshot checkpoint**

3. **Select** "All Projects"
   - Verify: dropdown shows "All Projects" as the selected value
   - **Screenshot checkpoint**

4. **Navigate** to Agent Monitor (`/agents`)
   - Verify: sidebar still shows "All Projects" selected (not auto-reverted to a project)
   - **Screenshot checkpoint**

5. **Navigate** to Activity Feed (`/activity`)
   - Verify: sidebar still shows "All Projects" selected
   - **Screenshot checkpoint**

6. **Navigate** back to Dashboard (`/`)
   - Verify: sidebar still shows "All Projects" selected
   - Verify: dashboard shows "All Projects" heading (not "Dashboard")

### TC-GA-2: Dashboard aggregated view in global scope

1. **Ensure** "All Projects" is selected in sidebar

2. **Navigate** to `http://localhost:5173/`
   - Verify: heading shows "All Projects" with a "Global" badge
   - Verify: subtitle says "Aggregated status across all projects."
   - **Screenshot checkpoint**

3. **Verify** stat cards are present
   - Check: Active Agents, Pending Proposals, Needs Attention, Today's Cost cards visible
   - Expected: values are numbers (may be 0), not "—" or "NaN"

4. **Verify** Projects Overview table
   - Check: table with "Project", "Path", "Created" columns
   - Expected: at least one project row (e.g., "tictactoe")
   - **Screenshot checkpoint**

5. **Verify** project-scoped widgets are NOT shown
   - Check: "Recent Activity", "Upcoming Work", "Cost Summary" widgets should NOT be visible
   - Expected: only the Projects Overview table below stat cards

6. **Switch** to a specific project via sidebar dropdown
   - Verify: heading changes back to "Dashboard"
   - Verify: subtitle says "At-a-glance status for your project."
   - Verify: Recent Activity, Upcoming Work, Cost Summary widgets reappear
   - **Screenshot checkpoint**

### TC-GA-3: Work Items disabled in global scope

1. **Ensure** "All Projects" is selected in sidebar

2. **Observe** the Work Items sidebar link
   - Verify: link appears dimmed/faded (reduced opacity)
   - Verify: cursor shows as not-allowed on hover
   - **Screenshot checkpoint**

3. **Hover** over the Work Items link
   - Verify: tooltip shows "Select a project to view work items"
   - **Screenshot checkpoint**

4. **Click** the Work Items link
   - Verify: navigation does NOT occur — URL stays on current page
   - Expected: link click is prevented

5. **Switch** to a specific project
   - Verify: Work Items link is no longer dimmed
   - Verify: clicking navigates to `/items`

### TC-GA-4: Agent Monitor scope badges

1. **Navigate** to `http://localhost:5173/agents`
   - Verify: Agent Monitor Live tab loads
   - **Screenshot checkpoint**

2. **Verify** scope filter dropdown exists
   - Check: dropdown in the tab bar (right side) with value "All"
   - **Screenshot checkpoint**

3. **Click** the scope filter dropdown
   - Verify: options include "All", "Global Only", and project name(s) (e.g., "tictactoe")
   - **Screenshot checkpoint**

4. **Select** "Global Only"
   - Verify: dropdown now shows "Global Only"
   - Expected: execution list filters to only show global (standalone) executions

5. **Select** "All" to reset filter
   - Verify: all executions are shown again

6. **Switch** to History tab
   - Verify: scope filter dropdown is NOT visible on History tab
   - **Screenshot checkpoint**

### TC-GA-5: "New Run" modal

1. **Navigate** to `http://localhost:5173/agents` (Live tab)

2. **Verify** "+ New Run" button exists in the tab bar
   - Check: button with text "New Run" and play icon, right side of tab bar
   - **Screenshot checkpoint**

3. **Click** "+ New Run" button
   - Verify: dialog opens with title "New Agent Run"
   - **Screenshot checkpoint**

4. **Verify** modal form fields
   - Check: "Persona" dropdown with placeholder "Select a persona..."
   - Check: "Scope" dropdown defaulting to "Global"
   - Check: "Prompt" textarea with placeholder "What should the agent do?"
   - Check: "Budget (USD)" number input defaulting to "5.00"
   - Check: "Cancel" and "Start Run" buttons

5. **Open** Persona dropdown
   - Verify: real persona names appear (e.g., "Pico", "Engineer", "Tech Lead")
   - **Screenshot checkpoint**

6. **Select** a persona, type a prompt
   - Select: any persona (e.g., "Engineer")
   - Type: "Hello world test" in prompt textarea
   - Verify: "Start Run" button becomes enabled (no longer disabled)

7. **Change** scope to "Project"
   - Verify: project selector dropdown appears below scope
   - Select: a project (e.g., "tictactoe")
   - **Screenshot checkpoint**

8. **Click** "Start Run"
   - Expected: either success toast ("Execution started") or error toast ("Failed to start execution") depending on backend connectivity
   - Verify: dialog closes on success

9. **Click** "Cancel" (re-open dialog first if needed)
   - Verify: dialog closes, form resets

### TC-GA-6: Pico scope toggle creates new session

1. **Click** the Pico chat bubble (bottom-right corner)
   - Verify: chat panel opens
   - **Screenshot checkpoint**

2. **Verify** scope and persona controls exist below header
   - Check: scope dropdown showing "Follows sidebar"
   - Check: persona dropdown showing "Pico"
   - **Screenshot checkpoint**

3. **Open** scope dropdown
   - Verify: options include "Follows sidebar", "Global", and project name(s)
   - **Screenshot checkpoint**

4. **Select** "Global" scope
   - Verify: scope dropdown now shows "Global"
   - Expected: a fresh session is created (messages cleared or new conversation started)

5. **Verify** active scope badge appears
   - Check: small badge visible when non-default scope is selected
   - **Screenshot checkpoint**

6. **Open** persona dropdown
   - Verify: lists "Pico" plus other personas (e.g., "Engineer", "Tech Lead")
   - **Screenshot checkpoint**

7. **Select** a different persona (e.g., "Engineer")
   - Verify: persona dropdown shows the selected persona name
   - Expected: a fresh session is created

8. **Reset** to defaults: select "Follows sidebar" scope and "Pico" persona
   - Verify: badge disappears when both are at default values

### TC-GA-7: Standalone execution endpoint returns 201

1. **Send** POST request to `http://localhost:3001/api/executions/run`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body: `{ "personaId": "<valid persona ID>", "prompt": "Test execution" }`
   - Note: get a valid persona ID from `GET /api/personas` first

2. **Verify** response
   - Expected status: 201
   - Expected body: `{ "id": "<execution ID string>" }`

3. **Verify** execution was created
   - Send: `GET /api/executions/<returned ID>`
   - Expected: execution with `status: "pending"`, `workItemId: null`, `summary: "Test execution"`

4. **Test** with projectId
   - Body: `{ "personaId": "<valid>", "prompt": "Project test", "projectId": "<valid project ID>" }`
   - Expected: 201, execution created with projectId set

5. **Test** validation — missing persona
   - Body: `{ "personaId": "nonexistent", "prompt": "Test" }`
   - Expected: 404 with error message

6. **Test** validation — missing prompt
   - Body: `{ "personaId": "<valid>" }`
   - Expected: 400 with error message

## Expected Results

- "All Projects" selection persists across all page navigations
- Dashboard shows aggregated view with "Global" badge and Projects Overview table in global scope
- Work Items link is visually disabled (dimmed, tooltip, click prevented) in global scope
- Agent Monitor shows scope filter dropdown with All / Global Only / per-project options
- "New Run" modal opens with real personas, validates form, submits to backend
- Pico chat panel has scope and persona dropdowns that create fresh sessions on change
- `POST /api/executions/run` returns 201 with execution ID and validates inputs

### Visual Quality

- No layout issues: elements properly aligned, no overlapping or clipping
- Text is readable: correct contrast, no invisible text, no truncation of important content
- Elements properly sized: badges, buttons, inputs have consistent sizing
- Spacing is consistent: margins and padding follow a coherent pattern
- Colors are correct: "Global" badge uses correct variant, dimmed link has reduced opacity
- Responsive: no horizontal scrolling, content fits within viewport width

## Failure Criteria

- "All Projects" selection reverts to a specific project after navigation
- Dashboard does not show "All Projects" heading or "Global" badge in global scope
- Work Items link is clickable/navigable in global scope
- Scope filter dropdown missing or non-functional on Agent Monitor Live tab
- "New Run" modal fails to open, shows no personas, or has broken form validation
- Pico scope/persona dropdowns missing or don't trigger new session creation
- `POST /api/executions/run` returns non-201 status for valid input
- Any visual defect: broken layout, invisible text, misaligned elements
