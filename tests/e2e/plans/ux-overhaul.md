# Test Plan: UX Overhaul (Sprint 29)

## Objective

Verify the Sprint 29 UX Overhaul end-to-end: global project foundation, agent rename throughout the UI, chat UX fixes (session loading, agent-grouped sidebar, dynamic empty states, improved header), Automations page with workflow and schedule cards, per-workflow auto-routing, label-based agent overrides, global work items, Settings reorganization, and status bar update.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded (`pnpm seed` or `pnpm seed:demo`)
- chrome-devtools MCP connected
- At least one non-global project exists (e.g., "tictactoe")
- At least one agent exists with global scope and one with project scope
- At least one chat session exists for a non-Pico agent
- At least one schedule exists

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

---

## Phase 1: Global Project Foundation

### UXO-E2E-001: Global project exists in the database

**Status:** pending

1. **Send** GET request to `http://localhost:3001/api/projects`
   - Expected: response array contains a project with `id: "pj-global"`
   - Expected: that project has `name: "Global"` or equivalent and `isGlobal: true` (or equivalent marker)

2. **Verify** no null projectId rows remain in the database
   - Send: `GET /api/executions` — verify all items have a non-null `projectId`
   - Send: `GET /api/workflows` — verify all workflows have a non-null `projectId`
   - Expected: no item returns `"projectId": null`

### UXO-E2E-002: Sidebar shows global project and selects it by default

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - Verify: page loads without errors
   - **Screenshot checkpoint**

2. **Open** the project selector dropdown in the sidebar
   - Expected: "Global" (or "All Projects") appears at the top of the list
   - Expected: global project is styled differently — violet/purple text, bold, or labeled distinctly
   - **Screenshot checkpoint**

3. **Verify** global project is selected by default (or first launch behavior)
   - Expected: sidebar shows the global project as the active selection
   - Expected: no `__all__` or sentinel value appears anywhere in the DOM

### UXO-E2E-003: Scope breadcrumb shows correct color per scope

**Status:** pending

1. **Navigate** to `http://localhost:5173/`

2. **Select** the global project in the sidebar dropdown
   - Expected: scope indicator (between project switcher and navigation) shows a **violet** dot/accent
   - Expected: when sidebar is collapsed, a 3px violet accent strip appears on the left edge
   - **Screenshot checkpoint**

3. **Select** a non-global project (e.g., "tictactoe")
   - Expected: scope indicator changes to **emerald** dot/accent
   - Expected: collapsed sidebar shows 3px emerald strip
   - **Screenshot checkpoint**

4. **Verify** project name is shown in the expanded scope indicator
   - Look for: `text-xs text-muted-foreground` label with project name next to the colored dot
   - **Screenshot checkpoint**

---

## Phase 2: Agent Rename

### UXO-E2E-004: All "Persona" references replaced with "Agent" in the UI

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - Verify: no text "Persona" or "Personas" appears in the sidebar nav, headers, or visible UI labels
   - **Screenshot checkpoint**

2. **Open** the sidebar and look for navigation items
   - Expected: item labeled "Agent Builder" (not "Persona Manager")
   - Expected: route is `/agent-builder` (not `/personas`)
   - **Screenshot checkpoint**

3. **Navigate** to `http://localhost:5173/agent-builder`
   - Verify: page loads with heading "Agent Builder" (not "Persona Manager")
   - Verify: no "persona" text visible in headings, card labels, or buttons
   - **Screenshot checkpoint**

4. **Inspect** the Agent Monitor at `http://localhost:5173/agents`
   - Verify: any dropdowns that previously said "Persona" now say "Agent"
   - Verify: column/field labels say "Agent" not "Persona"
   - **Screenshot checkpoint**

5. **Inspect** command palette (Cmd+K or Ctrl+K)
   - Verify: "Agent Builder" appears as a command, not "Persona Manager"
   - **Screenshot checkpoint**

### UXO-E2E-005: Agent API paths use /api/agents

**Status:** pending

1. **Send** GET request to `http://localhost:3001/api/agents`
   - Expected: 200 response with an array of agent objects
   - Expected: `/api/personas` returns 404 or redirect

2. **Send** GET request to `http://localhost:3001/api/personas`
   - Expected: 404 (old path no longer valid)

3. **Verify** agent list response schema
   - Expected: each item has `id`, `name`, `description`, `scope` (`"global"` or `"project"`), `projectId` (nullable)
   - **Screenshot checkpoint** of request/response in network tab

### UXO-E2E-006: Agent scope badges on agent cards

**Status:** pending

1. **Navigate** to `http://localhost:5173/agent-builder`
   - Verify: agent cards are visible
   - **Screenshot checkpoint**

2. **Verify** global-scope agent card
   - Look for: globe icon + "Global" badge in **violet/purple**
   - Expected: badge clearly visible on the card
   - **Screenshot checkpoint**

3. **Verify** project-scope agent card
   - Look for: folder icon + project name badge in **emerald/green**
   - Expected: badge shows correct project name, not "Global"
   - **Screenshot checkpoint**

### UXO-E2E-007: Agent editor scope dropdown

**Status:** pending

1. **Navigate** to `http://localhost:5173/agent-builder`

2. **Click** to open or create an agent

3. **Verify** scope dropdown is present in the agent editor
   - Look for: dropdown with label "Scope" offering "Global" and "Project" options
   - **Screenshot checkpoint**

4. **Select** "Project" scope
   - Expected: a project selector dropdown appears below scope
   - Expected: `projectId` field is now required
   - **Screenshot checkpoint**

5. **Select** "Global" scope
   - Expected: project selector disappears
   - Expected: `projectId` will be null on save
   - **Screenshot checkpoint**

---

## Phase 3: Chat UX Fixes

### UXO-E2E-008: Chat sessions load on /chat page (not just panel)

**Status:** pending

1. **Navigate directly** to `http://localhost:5173/chat`
   - Do NOT open the chat panel first
   - Verify: page loads and session list is visible without requiring panel interaction
   - **Screenshot checkpoint**

2. **Verify** sessions appear in the sidebar
   - Expected: existing chat sessions listed (not an empty state, if sessions exist in DB)
   - Expected: sessions are visible on mount without any user interaction
   - **Screenshot checkpoint**

### UXO-E2E-009: Click-outside does NOT close chat panel

**Status:** pending

1. **Open** the Pico chat bubble (bottom-right corner)
   - Verify: chat panel opens
   - **Screenshot checkpoint**

2. **Click** somewhere outside the chat panel (e.g., main content area)
   - Expected: panel remains open — does NOT close
   - **Screenshot checkpoint**

3. **Open** a dropdown or other overlay on the page
   - Expected: panel still remains open — dropdown interaction does not dismiss the panel

4. **Close** the panel using the minimize/X button
   - Expected: panel closes only via the explicit close button
   - **Screenshot checkpoint**

### UXO-E2E-010: Dynamic empty chat state per agent

**Status:** pending

1. **Navigate** to `http://localhost:5173/chat`

2. **Select** the Pico agent (default)
   - Verify: empty state shows Pico's avatar (amber dog icon), name "Pico", and Pico-specific greeting
   - **Screenshot checkpoint**

3. **Select** a non-Pico agent (e.g., "Engineer" or another custom agent)
   - Verify: empty state updates to show that agent's avatar icon and color (not the amber dog)
   - Verify: agent's **name** is displayed (not "Pico")
   - Verify: agent's **description** is shown in the empty state
   - Verify: textarea placeholder says "Ask [agent name] anything..." (not a hardcoded Pico greeting)
   - **Screenshot checkpoint**

4. **Verify** empty state renders cleanly at various viewport sizes
   - Check: avatar centered, name/description readable, no overflow
   - **Screenshot checkpoint**

### UXO-E2E-011: Agent-grouped session sidebar

**Status:** pending

1. **Navigate** to `http://localhost:5173/chat`
   - Ensure multiple sessions exist (different agents)
   - **Screenshot checkpoint**

2. **Verify** sessions are grouped by agent name (not by date)
   - Look for: collapsible group headers showing agent avatar + name + session count
   - Expected: sessions under each group header, sorted by recency
   - **Screenshot checkpoint**

3. **Click** a group header to collapse it
   - Expected: sessions under that agent collapse (accordion behavior)
   - Expected: caret/chevron icon indicates expanded/collapsed state
   - **Screenshot checkpoint**

4. **Click** the same group header again to expand
   - Expected: sessions reappear
   - **Screenshot checkpoint**

5. **Verify** all groups expanded by default
   - On initial load: all agent groups are expanded (not collapsed)
   - **Screenshot checkpoint**

### UXO-E2E-012: Improved chat header

**Status:** skip

> **Skip reason:** UXO.13 (chat header improvements) is not yet implemented as of Sprint 29.

---

## Phase 4: Workflow Rework

### UXO-E2E-013: Per-workflow autoRouting field in schema

**Status:** skip

> **Skip reason:** UXO.14 (schema migration for per-workflow autoRouting and agentOverrides) is not yet implemented.

### UXO-E2E-014: Per-workflow auto-routing backend reads from workflow

**Status:** skip

> **Skip reason:** UXO.15 (backend router reads workflow.autoRouting) is not yet implemented.

### UXO-E2E-015: Label-based agent resolution via agentOverrides

**Status:** skip

> **Skip reason:** UXO.16 (label-based agent resolution) is not yet implemented.

### UXO-E2E-016: Backlog and Done are immutable built-in states

**Status:** pending

1. **Send** POST to `http://localhost:3001/api/workflows` with body `{ "name": "Test Workflow", "projectId": "<valid>" }`
   - Expected: 201 response
   - Expected: returned workflow has at least two states: one named "Backlog" (initial) and one named "Done" (terminal)
   - **Screenshot checkpoint** of response body

2. **Attempt** to rename the "Backlog" state via the workflow builder UI
   - Navigate to the workflow builder for the newly created workflow
   - Try to edit the "Backlog" state name field
   - Expected: field is disabled or name cannot be changed (enforced immutability)
   - **Screenshot checkpoint**

3. **Attempt** to delete the "Backlog" or "Done" state
   - Look for: delete button on the Backlog state card
   - Expected: delete button is hidden or disabled for these built-in states
   - **Screenshot checkpoint**

### UXO-E2E-017: Automations page — workflow and schedule cards

**Status:** skip

> **Skip reason:** UXO.20 (Automations page redesign with workflow + schedule cards) is not yet implemented.

### UXO-E2E-018: Schedules moved to Automations page

**Status:** skip

> **Skip reason:** UXO.27 (move Schedules out of Settings onto Automations page) is not yet implemented.

### UXO-E2E-019: Per-workflow auto-routing toggle in UI

**Status:** skip

> **Skip reason:** UXO.22 (frontend auto-routing toggle per workflow) is not yet implemented.

### UXO-E2E-020: Label override UI in workflow builder

**Status:** skip

> **Skip reason:** UXO.21 (agent overrides UI in workflow builder) is not yet implemented.

### UXO-E2E-021: Workflow settings moved out of Settings page

**Status:** skip

> **Skip reason:** UXO.26 (workflow settings moved to workflow builder) is not yet implemented.

### UXO-E2E-022: Automations page — "New Automation" flow

**Status:** skip

> **Skip reason:** UXO.20 / UXO.27 (Automations page with new automation dialog) is not yet implemented.

### UXO-E2E-023: Automations page — play/pause toggles on cards

**Status:** skip

> **Skip reason:** UXO.20 / UXO.22 (play/pause toggles per workflow and schedule) not yet implemented.

---

## Phase 5: Agent Monitor Queue

### UXO-E2E-024: Queue tab visible in Agent Monitor

**Status:** pending

1. **Navigate** to `http://localhost:5173/agents`
   - Verify: Agent Monitor loads
   - **Screenshot checkpoint**

2. **Verify** "Queue" tab is present in the tab bar
   - Look for: tab labeled "Queue" alongside Live, History, Files tabs
   - **Screenshot checkpoint**

3. **Click** the Queue tab
   - Verify: Queue view loads without errors
   - Expected: either a list of queued agents or an empty state ("No queued agents")
   - **Screenshot checkpoint**

### UXO-E2E-025: Queue tab shows queued entries with priority badges

**Status:** pending

1. **Navigate** to `http://localhost:5173/agents` → Queue tab

2. **If queue entries exist**, verify each row shows:
   - Position number (1-indexed)
   - Agent name
   - Work item title (linked or plain text)
   - Priority badge (p0, p1, p2, or p3)
   - Relative wait time ("waiting X min")
   - **Screenshot checkpoint**

3. **Verify** priority badge colors
   - p0: red/destructive
   - p1: orange/warning
   - p2: blue/default
   - p3: gray/muted
   - **Screenshot checkpoint**

4. **Verify** empty state when queue is empty
   - Expected: "No queued agents" message with appropriate icon/description
   - **Screenshot checkpoint**

### UXO-E2E-026: Queue tab badge count

**Status:** pending

1. **Navigate** to `http://localhost:5173/agents`

2. **Verify** Queue tab has a count badge when there are queued items
   - Expected: number badge overlaid on the tab label showing the queue length
   - If queue is empty: badge should show "0" or be absent
   - **Screenshot checkpoint**

### UXO-E2E-027: Queue polling updates every 5 seconds

**Status:** pending

1. **Navigate** to `http://localhost:5173/agents` → Queue tab

2. **Open** browser network tab (or observe via `list_network_requests`)
   - Expected: `GET /api/executions/queue` fires automatically every 5 seconds
   - Verify: requests are made on a 5-second interval without user interaction

3. **Verify** API endpoint responds correctly
   - Send: `GET http://localhost:3001/api/executions/queue`
   - Expected: 200 with body `{ queue: [...], activeCount: N, maxConcurrent: N, queueLength: N }`
   - **Screenshot checkpoint**

---

## Phase 6: Global Work Items

### UXO-E2E-028: Work Items accessible in global scope (not dimmed)

**Status:** pending

1. **Select** the global project in the sidebar

2. **Observe** the Work Items sidebar link
   - Expected: link is NOT dimmed or disabled — it is fully clickable
   - Expected: no "Select a project" tooltip appears on hover
   - **Screenshot checkpoint**

3. **Click** the Work Items link
   - Expected: navigation occurs to `/items`
   - Expected: work items list loads (even if empty)
   - **Screenshot checkpoint**

### UXO-E2E-029: Global project has seeded workflow (Backlog → In Progress → Done)

**Status:** pending

1. **Send** GET to `http://localhost:3001/api/workflows?projectId=pj-global`
   - Expected: at least one workflow returned for the global project
   - Expected: workflow has states including "Backlog", "In Progress", "Done"

2. **Navigate** to `http://localhost:5173/items` with global project selected
   - Expected: work items list loads and is not blocked
   - **Screenshot checkpoint**

3. **Verify** the global project workflow is a simple 3-state workflow
   - Expected: `autoRouting: false`, no agents assigned by default
   - **Screenshot checkpoint** of API response

---

## Phase 8: Settings Reorganization

### UXO-E2E-030: Settings split into Global and Project sections

**Status:** skip

> **Skip reason:** UXO.28 (Settings page reorganization into Global/Project sections) is not yet implemented.

### UXO-E2E-031: Settings sidebar shows scope badges

**Status:** skip

> **Skip reason:** UXO.28 (scope badges in Settings sidebar) is not yet implemented.

### UXO-E2E-032: API Keys & Executor moved to Global section

**Status:** skip

> **Skip reason:** UXO.29 (break up Agent Configuration into global/project sections) is not yet implemented.

### UXO-E2E-033: Max Concurrent Agents in Costs & Limits (project section)

**Status:** skip

> **Skip reason:** UXO.29 is not yet implemented.

### UXO-E2E-034: Workflow and Scheduling tabs removed from Settings

**Status:** skip

> **Skip reason:** UXO.26 / UXO.27 (move workflow/scheduling tabs to Automations) are not yet implemented.

---

## Phase 9: Status Bar Update

### UXO-E2E-035: Status bar shows "Automations active" count (read-only)

**Status:** skip

> **Skip reason:** UXO.31 (replace auto-routing play/pause in status bar with read-only Automations count) is not yet implemented.

### UXO-E2E-036: Status bar Automations indicator navigates to /automations on click

**Status:** skip

> **Skip reason:** UXO.31 is not yet implemented.

---

## Sidebar Nav: Automations Renamed and Repositioned

### UXO-E2E-037: Sidebar shows "Automations" (not "Workflows") below Work Items

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - **Screenshot checkpoint**

2. **Verify** sidebar navigation order and labels
   - Expected: nav item labeled "Automations" (not "Workflows")
   - Expected: "Automations" appears below "Work Items" in the nav order
   - **Screenshot checkpoint**

3. **Click** "Automations" in the sidebar
   - Expected: navigates to `/automations`
   - Expected: page loads (even if not yet redesigned with card layout)
   - **Screenshot checkpoint**

4. **Verify** command palette reflects the rename
   - Open command palette (Cmd+K or Ctrl+K)
   - Expected: "Automations" appears as a command, not "Workflows"
   - **Screenshot checkpoint**

---

## Expected Results

- Global project with ID "pj-global" exists and is the default selection
- Scope breadcrumb shows violet for global scope, emerald for project scope
- All UI text shows "Agent" not "Persona"; route is `/agent-builder`, API is `/api/agents`
- Agent cards show scope badges (globe/violet for global, folder/emerald for project)
- Agent editor scope dropdown correctly toggles projectId requirement
- Chat sessions load on `/chat` page on mount without panel interaction
- Chat panel does NOT close on click-outside; only closes via minimize button
- Dynamic empty chat state shows correct agent avatar, name, description, and placeholder
- Session sidebar groups sessions by agent with collapsible groups, all expanded by default
- Backlog and Done states are auto-created on new workflow and are immutable
- Agent Monitor has a Queue tab with priority-colored badges and 5-second polling
- Work Items is accessible (not dimmed) in global scope
- Global project has a seeded 3-state workflow (Backlog → In Progress → Done)
- Sidebar nav shows "Automations" below Work Items, route `/automations`
- Features marked **skip** are not implemented yet and should be verified in a follow-up run after their tasks complete

### Visual Quality

- No layout issues: elements properly aligned, no overlapping or clipping
- Text is readable: correct contrast, no invisible text, no truncation of important content
- Elements properly sized: badges, buttons, inputs have consistent sizing
- Spacing is consistent: margins and padding follow a coherent pattern
- Colors are correct: violet for global scope, emerald for project scope, priority badge colors match semantic meaning (red=p0, orange=p1, blue=p2, gray=p3)
- Responsive: no horizontal scrolling, content fits within viewport width
- Dark mode: all text visible, no broken colors, sufficient contrast

## Failure Criteria

- No project with `id: "pj-global"` in the API response
- Any `__all__` sentinel value visible in the DOM or API responses
- Scope breadcrumb missing, or shows wrong color (violet when project, emerald when global)
- Any UI element shows "Persona" instead of "Agent"
- `/api/personas` returns 200 (old path still active)
- Agent cards missing scope badge or showing wrong scope color
- Chat sessions do not load on `/chat` without opening the panel first
- Chat panel closes on click-outside
- Empty chat state shows Pico's content for non-Pico agents
- Session sidebar groups by date instead of agent
- New workflow is created without "Backlog" or "Done" states
- Backlog/Done states can be renamed or deleted
- Queue tab is missing from Agent Monitor
- Queue badge count is not shown or not updating
- Work Items link is dimmed/disabled when global project is selected
- Global project has no workflow seeded
- Sidebar still shows "Workflows" instead of "Automations"
- Any NaN, undefined, or [object Object] visible in the UI

### Visual Failure Criteria

- Any visual defect counts as a visual failure even if the functional test passes
- Scope indicator missing or invisible in sidebar
- Colored dot/accent strip does not match scope (violet vs emerald)
- Agent scope badges misaligned or clipped on agent cards
- Chat session groups not visually distinct from individual session rows
- Queue priority badges have incorrect or missing background colors
- Status bar elements misaligned after changes
- Settings sidebar (when implemented) missing section headers or scope badges
