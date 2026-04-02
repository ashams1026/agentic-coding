# Test Plan: Project-Scoped Navigation (Sprint 30)

## Objective

Verify the project-scoped navigation rewrite end-to-end: sidebar project tree with expand/collapse, project-scoped routes at `/p/:projectId/:page`, ProjectLayout loading/404 states, legacy redirects, dashboard project cards, App Settings vs Project Settings split, command palette project commands, and status bar context display.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded (`pnpm seed` or `pnpm seed:demo`)
- chrome-devtools MCP connected
- Global Workspace project exists with ID `pj-global`
- At least one non-global project exists (e.g., "tictactoe")
- At least one work item and one execution exist for each project

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects -- record both.

---

## Phase 1: Sidebar Tree

### NAV-E2E-001: Global Workspace expanded by default, shows all 8 child links

**Status:** pending

1. **Clear** localStorage key `agentops-sidebar-expanded` (to reset state)
2. **Navigate** to `http://localhost:5173/`
   - Verify: sidebar loads with the project tree visible
   - **Screenshot checkpoint**

3. **Verify** Global Workspace section is expanded
   - Look for: a project header with a Globe icon, text "Global Workspace" (or the global project name), styled in violet (`text-violet-500`)
   - Expected: ChevronDown icon indicating expanded state
   - **Screenshot checkpoint**

4. **Verify** all 8 child links are visible under Global Workspace
   - Expected links in order: "Work Items", "Automations", "Agents", "Agent Monitor", "Activity Feed", "Analytics", "Chat", "Project Settings"
   - Expected: each link has an icon and label text
   - **Screenshot checkpoint**

### NAV-E2E-002: Non-global projects collapsed by default

**Status:** pending

1. **Clear** localStorage key `agentops-sidebar-expanded`
2. **Navigate** to `http://localhost:5173/`
   - **Screenshot checkpoint**

3. **Verify** non-global project sections are collapsed
   - Look for: project headers with FolderOpen icon and ChevronRight (not ChevronDown)
   - Expected: no child links visible under non-global projects
   - **Screenshot checkpoint**

### NAV-E2E-003: Click project header toggles expand/collapse

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - **Screenshot checkpoint**

2. **Click** a non-global project header in the sidebar
   - Target: the project name button for a non-global project
   - Expected: the section expands, ChevronRight becomes ChevronDown, 8 child links appear
   - **Screenshot checkpoint**

3. **Click** the same project header again
   - Expected: the section collapses, ChevronDown becomes ChevronRight, child links disappear
   - **Screenshot checkpoint**

4. **Click** the Global Workspace header
   - Expected: the global section collapses, its 8 child links disappear
   - **Screenshot checkpoint**

5. **Click** the Global Workspace header again
   - Expected: it re-expands, all 8 child links visible again
   - **Screenshot checkpoint**

### NAV-E2E-004: Expand/collapse persists across page reload (localStorage)

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
2. **Expand** a non-global project by clicking its header
3. **Collapse** the Global Workspace by clicking its header
   - **Screenshot checkpoint**

4. **Reload** the page (hard refresh)
   - **Screenshot checkpoint**

5. **Verify** expand/collapse state is preserved
   - Expected: the non-global project is still expanded
   - Expected: the Global Workspace is still collapsed
   - Verify: localStorage key `agentops-sidebar-expanded` contains the correct project IDs

### NAV-E2E-005: Expand/collapse all toggle button works

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - **Screenshot checkpoint**

2. **Locate** the expand/collapse all button in the "Projects" separator area
   - Look for: a small button with a ChevronsUpDown icon next to the "PROJECTS" label
   - **Screenshot checkpoint**

3. **Click** the toggle button when some projects are collapsed
   - Expected: all projects expand (all ChevronDown icons, all child links visible)
   - Expected: tooltip says "Collapse all" after expanding
   - **Screenshot checkpoint**

4. **Click** the toggle button again
   - Expected: all projects collapse (all ChevronRight icons, no child links visible)
   - Expected: tooltip says "Expand all" after collapsing
   - **Screenshot checkpoint**

### NAV-E2E-006: Active child link highlighted when navigating

**Status:** pending

1. **Navigate** to `http://localhost:5173/p/pj-global/items`
   - **Screenshot checkpoint**

2. **Verify** the "Work Items" link under Global Workspace is highlighted
   - Look for: `bg-muted text-foreground font-semibold` styling on the "Work Items" link
   - Expected: other links in the same project are not highlighted (muted-foreground text)
   - **Screenshot checkpoint**

3. **Click** "Agent Monitor" under the same project
   - Expected: URL changes to `/p/pj-global/monitor`
   - Expected: "Agent Monitor" link is now highlighted, "Work Items" is no longer highlighted
   - **Screenshot checkpoint**

### NAV-E2E-007: Auto-expand project when deep-linking to its page

**Status:** pending

1. **Clear** localStorage key `agentops-sidebar-expanded`
2. **Navigate directly** to `http://localhost:5173/p/<non-global-project-id>/items`
   - (Replace `<non-global-project-id>` with an actual non-global project ID from the seeded data)
   - **Screenshot checkpoint**

3. **Verify** the targeted project auto-expands in the sidebar
   - Expected: that project's section is expanded with child links visible
   - Expected: the "Work Items" link under that project is highlighted
   - **Screenshot checkpoint**

### NAV-E2E-008: "+ New Project" button opens dialog

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - **Screenshot checkpoint**

2. **Scroll** to the bottom of the project list in the sidebar
3. **Click** the "+ New Project" button
   - Target: button with Plus icon and text "New Project"
   - Expected: a dialog opens with title "New Project"
   - **Screenshot checkpoint**

4. **Verify** the dialog has correct fields
   - Expected: "Project Name" input field with placeholder "My Project"
   - Expected: "Working Directory" section with "Create new" / "Choose existing" radio buttons
   - Expected: "Create Project" button (disabled when name is empty) and "Cancel" button
   - **Screenshot checkpoint**

### NAV-E2E-009: New project dialog: name + working directory fields

**Status:** pending

1. **Open** the New Project dialog (click "+ New Project")
   - **Screenshot checkpoint**

2. **Type** "Test Nav Project" into the "Project Name" field
   - Expected: working directory auto-fills with `~/woof/test-nav-project/`
   - Expected: "Create Project" button becomes enabled
   - **Screenshot checkpoint**

3. **Click** "Choose existing" radio button
   - Expected: the directory input changes to show `~/` with placeholder "~/path/to/project"
   - **Screenshot checkpoint**

4. **Click** "Create new" radio button
   - Expected: input reverts to showing the generated path
   - **Screenshot checkpoint**

5. **Click** "Cancel"
   - Expected: dialog closes without creating a project

---

## Phase 2: Navigation

### NAV-E2E-010: Each of 8 child links navigates to correct `/p/:projectId/:page` URL

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
2. **Expand** the Global Workspace project

3. **Click** "Work Items"
   - Expected: URL is `/p/pj-global/items`, Work Items page loads
4. **Click** "Automations"
   - Expected: URL is `/p/pj-global/automations`, Automations page loads
5. **Click** "Agents"
   - Expected: URL is `/p/pj-global/agents`, Agent Builder page loads
6. **Click** "Agent Monitor"
   - Expected: URL is `/p/pj-global/monitor`, Agent Monitor page loads
7. **Click** "Activity Feed"
   - Expected: URL is `/p/pj-global/activity`, Activity Feed page loads
8. **Click** "Analytics"
   - Expected: URL is `/p/pj-global/analytics`, Analytics page loads
9. **Click** "Chat"
   - Expected: URL is `/p/pj-global/chat`, Chat page loads
10. **Click** "Project Settings"
    - Expected: URL is `/p/pj-global/settings`, Project Settings page loads
    - **Screenshot checkpoint** after each navigation

### NAV-E2E-011: Dashboard link navigates to `/`

**Status:** pending

1. **Navigate** to `http://localhost:5173/p/pj-global/items`
   - **Screenshot checkpoint**

2. **Click** "Dashboard" link in the sidebar (above the "PROJECTS" separator)
   - Expected: URL changes to `/`
   - Expected: Dashboard page loads with project cards
   - Expected: "Dashboard" link has active styling (`bg-muted`, `border-l-primary`)
   - **Screenshot checkpoint**

### NAV-E2E-012: App Settings link navigates to `/app-settings`

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - **Screenshot checkpoint**

2. **Click** "App Settings" link in the sidebar
   - Expected: URL changes to `/app-settings`
   - Expected: App Settings page loads with sidebar showing "API Keys & Executor Mode", "Appearance", "Service", "Data Management"
   - Expected: "App Settings" link has active styling
   - **Screenshot checkpoint**

### NAV-E2E-013: Browser back/forward works between project pages

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
2. **Click** "Work Items" under Global Workspace
   - Expected: URL is `/p/pj-global/items`
3. **Click** "Agent Monitor" under Global Workspace
   - Expected: URL is `/p/pj-global/monitor`
   - **Screenshot checkpoint**

4. **Press** browser back button
   - Expected: URL returns to `/p/pj-global/items`
   - Expected: Work Items page is visible
   - Expected: "Work Items" link re-highlighted in sidebar
   - **Screenshot checkpoint**

5. **Press** browser forward button
   - Expected: URL returns to `/p/pj-global/monitor`
   - Expected: Agent Monitor page is visible
   - Expected: "Agent Monitor" link re-highlighted in sidebar
   - **Screenshot checkpoint**

### NAV-E2E-014: Multiple projects' pages show different data

**Status:** pending

1. **Navigate** to `http://localhost:5173/p/pj-global/items`
   - Note: the work items shown for Global Workspace
   - **Screenshot checkpoint**

2. **Navigate** to `http://localhost:5173/p/<non-global-project-id>/items`
   - Expected: work items list differs from Global Workspace (project-scoped filtering)
   - **Screenshot checkpoint**

3. **Compare** the two pages
   - Expected: different data loaded, confirming project scoping is applied

---

## Phase 3: URL Structure

### NAV-E2E-015: Direct URL `/p/pj-global/items` loads Work Items for Global Workspace

**Status:** pending

1. **Navigate directly** to `http://localhost:5173/p/pj-global/items`
   - Verify: page loads without errors
   - Expected: Work Items page renders
   - Expected: sidebar shows Global Workspace expanded with "Work Items" highlighted
   - **Screenshot checkpoint**

### NAV-E2E-016: Direct URL `/p/:invalidId/items` shows 404 from ProjectLayout

**Status:** pending

1. **Navigate directly** to `http://localhost:5173/p/pj-nonexistent/items`
   - Verify: page does NOT crash or show a blank screen
   - **Screenshot checkpoint**

2. **Verify** the 404 state renders correctly
   - Look for: AlertTriangle icon
   - Look for: text "Project not found"
   - Look for: text containing `pj-nonexistent` (the invalid ID is shown)
   - Look for: "Go to Dashboard" button
   - **Screenshot checkpoint**

3. **Click** "Go to Dashboard"
   - Expected: navigates to `/`
   - Expected: Dashboard page loads normally
   - **Screenshot checkpoint**

### NAV-E2E-017: URL changes when clicking sidebar links

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - Verify: URL is exactly `/`
2. **Click** "Work Items" under Global Workspace
   - Verify: URL changes to `/p/pj-global/items`
3. **Click** "App Settings" in the sidebar
   - Verify: URL changes to `/app-settings`
4. **Click** "Dashboard" in the sidebar
   - Verify: URL changes back to `/`
   - **Screenshot checkpoint**

---

## Phase 4: Legacy Redirects

### NAV-E2E-018: `/items` redirects to `/p/pj-global/items`

**Status:** pending

1. **Navigate directly** to `http://localhost:5173/items`
   - Expected: URL changes (redirect) to `/p/pj-global/items`
   - Expected: Work Items page loads for Global Workspace
   - **Screenshot checkpoint**

### NAV-E2E-019: `/agents` redirects to `/p/pj-global/monitor`

**Status:** pending

1. **Navigate directly** to `http://localhost:5173/agents`
   - Expected: URL changes (redirect) to `/p/pj-global/monitor`
   - Expected: Agent Monitor page loads for Global Workspace
   - **Screenshot checkpoint**

### NAV-E2E-020: `/settings` redirects to `/app-settings`

**Status:** pending

1. **Navigate directly** to `http://localhost:5173/settings`
   - Expected: URL changes (redirect) to `/app-settings`
   - Expected: App Settings page loads (not Project Settings)
   - **Screenshot checkpoint**

### NAV-E2E-021: `/automations` redirects to `/p/pj-global/automations`

**Status:** pending

1. **Navigate directly** to `http://localhost:5173/automations`
   - Expected: URL changes (redirect) to `/p/pj-global/automations`
   - Expected: Automations page loads for Global Workspace
   - **Screenshot checkpoint**

---

## Phase 5: Dashboard

### NAV-E2E-022: Shows project cards for each project

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - **Screenshot checkpoint**

2. **Verify** project cards are displayed in a grid
   - Expected: at least 2 cards visible (Global Workspace + at least one other project)
   - Expected: cards are laid out in a responsive grid (up to 3 columns on wide screens)
   - **Screenshot checkpoint**

### NAV-E2E-023: Global Workspace card pinned at top with violet accent

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - **Screenshot checkpoint**

2. **Verify** the first project card is the Global Workspace
   - Look for: Globe icon (not FolderOpen) on the first card
   - Look for: violet-tinted border (`border-violet-400/40`)
   - Expected: the Global Workspace card appears before all other project cards
   - **Screenshot checkpoint**

3. **Verify** non-global project cards use FolderOpen icon with no violet border
   - **Screenshot checkpoint**

### NAV-E2E-024: Project cards show work item count, active agents, last activity

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - **Screenshot checkpoint**

2. **Inspect** a project card (e.g., Global Workspace)
   - Look for: ClipboardList icon with a number + "items" text
   - Look for: Bot icon with a number + "active" text
   - Look for: "Last activity: X ago" or "No activity yet" text
   - **Screenshot checkpoint**

3. **Verify** no NaN, undefined, or [object Object] values appear in the stats
   - Expected: all numbers are rendered correctly

### NAV-E2E-025: Quick-link buttons navigate to project-scoped pages

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - **Screenshot checkpoint**

2. **Click** "Work Items" quick-link button on the Global Workspace card
   - Expected: navigates to `/p/pj-global/items`
   - **Screenshot checkpoint**

3. **Navigate back** to `/`

4. **Click** "Agents" quick-link button on the Global Workspace card
   - Expected: navigates to `/p/pj-global/monitor`
   - **Screenshot checkpoint**

5. **Navigate back** to `/`

6. **Click** "Chat" quick-link button on a project card
   - Expected: navigates to `/p/<project-id>/chat`
   - **Screenshot checkpoint**

---

## Phase 6: Settings Split

### NAV-E2E-026: App Settings (`/app-settings`) shows API Keys, Appearance, Service, Data

**Status:** pending

1. **Navigate** to `http://localhost:5173/app-settings`
   - **Screenshot checkpoint**

2. **Verify** the App Settings page has a sidebar with 4 sections
   - Expected: "API Keys & Executor Mode" section
   - Expected: "Appearance" section
   - Expected: "Service" section
   - Expected: "Data Management" section
   - **Screenshot checkpoint**

3. **Verify** the header text says "App Settings"
   - Look for: `<h2>` with text "App Settings" in the settings sidebar
   - **Screenshot checkpoint**

### NAV-E2E-027: Project Settings (`/p/:projectId/settings`) shows Security, Costs, Notifications, Integrations

**Status:** pending

1. **Navigate** to `http://localhost:5173/p/pj-global/settings`
   - **Screenshot checkpoint**

2. **Verify** the Project Settings page has a sidebar with 4 sections
   - Expected: "Security" section
   - Expected: "Costs & Limits" section
   - Expected: "Notifications" section
   - Expected: "Integrations" section
   - **Screenshot checkpoint**

### NAV-E2E-028: Project Settings shows project name in header

**Status:** pending

1. **Navigate** to `http://localhost:5173/p/pj-global/settings`
   - **Screenshot checkpoint**

2. **Verify** the project name is displayed in the settings sidebar header
   - Look for: `<h2>` text "Project Settings" followed by the project name below it
   - Expected: project name (e.g., "Global Workspace") is visible and not "Unknown Project" or "Loading..."
   - **Screenshot checkpoint**

3. **Navigate** to a non-global project's settings: `http://localhost:5173/p/<non-global-id>/settings`
   - Expected: project name shows the non-global project's name
   - **Screenshot checkpoint**

---

## Phase 7: Command Palette

### NAV-E2E-029: Cmd+K opens palette

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - **Screenshot checkpoint**

2. **Press** Cmd+K (or Ctrl+K on non-Mac)
   - Expected: command palette dialog opens
   - Expected: search input is focused with placeholder "Type a command or search..."
   - **Screenshot checkpoint**

3. **Press** Escape
   - Expected: palette closes

### NAV-E2E-030: Shows "Dashboard" and "App Settings" under Navigation

**Status:** pending

1. **Open** command palette (Cmd+K)
   - **Screenshot checkpoint**

2. **Verify** the "NAVIGATION" category is displayed
   - Look for: uppercase header text "NAVIGATION"
   - Expected: "Dashboard" item with LayoutDashboard icon listed under Navigation
   - Expected: "App Settings" item with Cog icon listed under Navigation
   - **Screenshot checkpoint**

### NAV-E2E-031: Shows per-project commands: "[Project] > Work Items" etc.

**Status:** pending

1. **Open** command palette (Cmd+K)
   - **Screenshot checkpoint**

2. **Verify** per-project command groups exist
   - Look for: category headers showing project names (e.g., "Global Workspace", "tictactoe")
   - Under each project: items like "[ProjectName] > Work Items", "[ProjectName] > Automations", etc.
   - Expected: 8 items per project (one for each sub-page)
   - **Screenshot checkpoint**

3. **Click** a project command (e.g., "Global Workspace > Agent Monitor")
   - Expected: palette closes
   - Expected: URL navigates to `/p/pj-global/monitor`
   - **Screenshot checkpoint**

### NAV-E2E-032: Typing project name filters to that project's commands

**Status:** pending

1. **Open** command palette (Cmd+K)

2. **Type** the name of a non-global project (e.g., "tictactoe")
   - Expected: results filter to show only that project's commands
   - Expected: "Dashboard" and "App Settings" disappear (they don't match the filter)
   - Expected: items show "[ProjectName] > Work Items", "[ProjectName] > Automations", etc.
   - **Screenshot checkpoint**

3. **Clear** the search field

4. **Type** "Work Items"
   - Expected: results show "[Project] > Work Items" for every project plus any matching search results
   - **Screenshot checkpoint**

### NAV-E2E-033: Selecting a command navigates to correct URL

**Status:** pending

1. **Open** command palette (Cmd+K)

2. **Type** "Dashboard"
   - Expected: "Dashboard" appears in results
3. **Press** Enter (or click the Dashboard item)
   - Expected: palette closes, URL is `/`
   - **Screenshot checkpoint**

4. **Open** command palette again

5. **Type** "App Settings"
   - Expected: "App Settings" appears in results
6. **Press** Enter
   - Expected: palette closes, URL is `/app-settings`
   - **Screenshot checkpoint**

---

## Phase 8: Status Bar

### NAV-E2E-034: Shows project name when on a project page

**Status:** pending

1. **Navigate** to `http://localhost:5173/p/pj-global/items`
   - **Screenshot checkpoint**

2. **Verify** the status bar at the bottom shows the project name
   - Look for: FolderOpen icon followed by the Global Workspace project name in the footer
   - Expected: project name is displayed in `font-medium text-foreground` styling
   - **Screenshot checkpoint**

3. **Navigate** to a non-global project page
   - Expected: status bar updates to show the non-global project's name
   - **Screenshot checkpoint**

### NAV-E2E-035: Shows "Dashboard" when on `/`

**Status:** pending

1. **Navigate** to `http://localhost:5173/`
   - **Screenshot checkpoint**

2. **Verify** the status bar shows "Dashboard"
   - Look for: text "Dashboard" in the footer (no FolderOpen icon since not project-scoped)
   - **Screenshot checkpoint**

3. **Navigate** to `http://localhost:5173/app-settings`
   - Expected: status bar shows "App Settings"
   - **Screenshot checkpoint**

---

## Expected Results

- Sidebar displays a collapsible project tree with Global Workspace expanded by default and non-global projects collapsed
- All 8 child links (Work Items, Automations, Agents, Agent Monitor, Activity Feed, Analytics, Chat, Project Settings) are shown for each expanded project
- Expand/collapse state persists in localStorage across page reloads
- Expand/collapse all toggle button toggles every project section
- Active child link is highlighted with distinct styling; auto-expand occurs on deep-link
- "+ New Project" button opens a dialog with name and working directory fields
- Each child link navigates to `/p/:projectId/:page` with the correct page
- Dashboard link navigates to `/`, App Settings to `/app-settings`
- Browser back/forward buttons work correctly between project pages
- Direct URL to a valid project/page loads correctly; invalid project ID shows a 404 page with "Go to Dashboard" button
- Legacy routes `/items`, `/agents`, `/settings`, `/automations` redirect to correct new routes
- Dashboard shows project cards in a grid with Global Workspace pinned first (violet accent)
- Project cards display work item count, active agents, and last activity
- Quick-link buttons on project cards navigate to correct project-scoped pages
- App Settings has 4 sections: API Keys, Appearance, Service, Data Management
- Project Settings has 4 sections: Security, Costs & Limits, Notifications, Integrations; shows project name in header
- Command palette opens with Cmd+K, shows global navigation and per-project commands
- Typing a project name filters to that project's commands; selecting a command navigates correctly
- Status bar shows project name on project pages, "Dashboard" on `/`, "App Settings" on `/app-settings`

### Visual Quality

- No layout issues: elements properly aligned, no overlapping or clipping
- Text is readable: correct contrast, no invisible text, no truncation of important content
- Sidebar tree: indentation lines visible, chevron icons aligned, project headers clearly distinguishable from child links
- Active link highlighting: distinct background color, not confused with hover state
- Project cards: grid layout consistent, violet border visible on Global Workspace card, stats properly spaced
- Command palette: category headers uppercase and muted, items properly aligned, selected item highlighted
- Status bar: project name readable, properly aligned with other status bar items
- Responsive: no horizontal scrolling, sidebar does not overflow on smaller viewports
- Dark mode: all text visible, violet accents readable, no broken colors, sufficient contrast

## Failure Criteria

- Sidebar does not show any project sections or shows flat nav instead of project tree
- Global Workspace is not expanded by default on fresh load
- Fewer than 8 child links shown for an expanded project
- Expand/collapse state lost on page reload (localStorage not persisted)
- Expand/collapse all button missing or non-functional
- Active link not highlighted when navigating to a project page
- Project does not auto-expand when deep-linking to one of its pages
- New Project dialog does not open or is missing required fields
- Clicking a child link does not navigate to the correct `/p/:projectId/:page` URL
- Legacy URL does not redirect (stays on old path or shows 404)
- Invalid project ID does not show 404 state (blank page, crash, or navigates elsewhere)
- "Go to Dashboard" button on 404 page does not work
- Dashboard does not show project cards, or shows them in wrong order (Global not first)
- Project card stats show NaN, undefined, or [object Object]
- Quick-link buttons on project cards navigate to wrong URL
- App Settings shows Project Settings sections or vice versa
- Project Settings does not show project name in header
- Command palette does not open with Cmd+K
- Command palette missing "Dashboard" or "App Settings" under Navigation
- Per-project commands not shown or navigate to wrong URL
- Status bar shows wrong context label (e.g., "Dashboard" when on a project page)
- Any JavaScript error or blank screen during navigation

### Visual Failure Criteria

- Any visual defect counts as a visual failure even if the functional test passes
- Sidebar tree indentation lines missing or misaligned
- Chevron icons (expand/collapse) not visible or misaligned with project name
- Child links not indented under their project header
- Active link highlight indistinguishable from inactive links
- Global Workspace not visually distinct (no violet styling)
- Project cards have inconsistent sizing or broken grid layout
- Violet border on Global Workspace card invisible in dark mode
- Command palette items overlap or are clipped
- Status bar text truncated or overlapping other elements
- Expand/collapse all button not visible or too small to click
