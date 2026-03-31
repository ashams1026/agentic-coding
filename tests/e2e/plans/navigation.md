# Test Plan: Sidebar Navigation

## Objective

Verify the sidebar navigation links to correct pages, highlights the active item, supports collapsed icon-only mode, and provides a mobile hamburger menu.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (at least one project, work items, executions)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/`
   - Verify: the Dashboard page loads and the sidebar is visible on the left
   - **Screenshot checkpoint:** Take screenshot. Examine: sidebar layout, icon + label alignment, active item highlighting for Dashboard, project switcher rendering, overall sidebar structure.

2. **Verify** the sidebar shows 6 navigation items
   - Look for: a vertical nav list with items "Dashboard", "Work Items", "Agent Monitor", "Activity Feed", "Personas", "Settings"
   - Expected: all 6 items are visible with an icon and label text for each

3. **Verify** "Dashboard" is the active nav item
   - Look for: the "Dashboard" nav item with a highlighted background (accent color)
   - Expected: "Dashboard" has a visually distinct background; all other items are muted/gray text

4. **Click** "Work Items" in the sidebar
   - Target: the nav link labeled "Work Items"
   - Expected: navigates to `/items`, page shows the Work Items heading, "Work Items" nav item is now highlighted
   - **Screenshot checkpoint:** Take screenshot. Examine: active state switched to Work Items, previous item deactivated, page content loaded correctly, no flash or layout shift during navigation.

5. **Click** "Agent Monitor" in the sidebar
   - Target: the nav link labeled "Agent Monitor"
   - Expected: navigates to `/agents`, Agent Monitor page loads, "Agent Monitor" nav item is now highlighted

6. **Click** "Activity Feed" in the sidebar
   - Target: the nav link labeled "Activity Feed"
   - Expected: navigates to `/activity`, Activity Feed page loads, "Activity Feed" nav item is now highlighted

7. **Click** "Personas" in the sidebar
   - Target: the nav link labeled "Personas"
   - Expected: navigates to `/personas`, Persona Manager page loads, "Personas" nav item is now highlighted

8. **Click** "Settings" in the sidebar
   - Target: the nav link labeled "Settings"
   - Expected: navigates to `/settings`, Settings page loads, "Settings" nav item is now highlighted

9. **Click** "Dashboard" to return
   - Target: the nav link labeled "Dashboard"
   - Expected: navigates back to `/`, Dashboard page loads, "Dashboard" is highlighted again

10. **Verify** the project switcher is visible at the top of the sidebar
    - Look for: a dropdown/select at the top of the sidebar showing a project name
    - Expected: a project name is displayed (from seeded data)

11. **Click** the collapse button at the bottom of the sidebar
    - Target: the button with a panel-collapse icon (tooltip "Collapse sidebar")
    - Expected: the sidebar narrows to icon-only mode — nav labels disappear, only icons remain visible

12. **Verify** collapsed sidebar shows only icons
    - Look for: the 6 nav icons without any label text
    - Expected: icons are centered, no text labels visible, project switcher shows only a folder icon
    - **Screenshot checkpoint:** Take screenshot. Examine: collapsed sidebar width narrow, icons centered vertically in nav items, no label text leaking, active item still distinguishable, content area expanded to fill space.

13. **Hover** over a nav icon in collapsed mode
    - Target: hover over the "Work Items" icon
    - Expected: a tooltip appears to the right showing "Work Items"

14. **Click** the expand button to restore the sidebar
    - Target: the button with a panel-expand icon (tooltip "Expand sidebar")
    - Expected: the sidebar expands back to full width with icons and labels

15. **Emulate** a mobile viewport (e.g., 375×812)
    - Expected: the sidebar is hidden, a top bar appears with a hamburger menu icon (☰) and "AgentOps" text

16. **Click** the hamburger menu icon
    - Target: the menu button in the mobile top bar
    - Expected: the sidebar slides in from the left as an overlay with a dark backdrop
    - **Screenshot checkpoint:** Take screenshot. Examine: mobile sidebar overlay renders cleanly, dark backdrop visible behind, nav items readable, sidebar doesn't overflow viewport width, close/dismiss affordance visible.

17. **Click** a nav item in the mobile sidebar (e.g., "Settings")
    - Target: the "Settings" nav link in the overlay sidebar
    - Expected: navigates to `/settings`, the sidebar overlay closes automatically

18. **Click** the dark backdrop to dismiss the mobile sidebar
    - Target: the semi-transparent overlay behind the sidebar
    - Expected: the sidebar slides back off-screen to the left

19. **Take screenshot** of the sidebar in expanded, collapsed, and mobile states

## Expected Results

- The sidebar displays 6 navigation items: Dashboard, Work Items, Agent Monitor, Activity Feed, Personas, Settings
- Each nav item links to the correct page (`/`, `/items`, `/agents`, `/activity`, `/personas`, `/settings`)
- The active nav item is visually highlighted with an accent background
- The project switcher dropdown is visible at the top of the sidebar
- Collapsing the sidebar hides labels and shows icon-only mode with tooltips
- Expanding restores the full sidebar with labels
- On mobile viewports, a hamburger menu opens the sidebar as an overlay
- Clicking a nav item on mobile navigates and closes the overlay
- Clicking the backdrop dismisses the mobile sidebar

### Visual Quality

- Sidebar expanded: icon and label on same row, consistent spacing between nav items, active item clearly highlighted with accent background, project switcher aligned at top
- Active state: distinct background color, other items muted, active state switches instantly on navigation with no flash
- Collapsed mode: sidebar narrow, icons centered, no label text visible, active icon still distinguishable, content area expands to fill
- Tooltips: appear on hover in collapsed mode, positioned to the right of icon, readable text, no clipping
- Mobile: hamburger icon visible in top bar, sidebar overlay slides in smoothly, dark backdrop behind, nav items full-width and tappable
- Transitions: sidebar collapse/expand animates smoothly, mobile overlay slide-in/out clean, no layout jump during navigation

## Failure Criteria

- Any nav item links to the wrong page or causes a navigation error
- The active nav item is not visually distinguished from inactive items
- Fewer than 6 nav items are displayed
- Collapsing the sidebar does not hide the labels or shows broken layout
- Tooltips do not appear on hover in collapsed mode
- The hamburger menu does not appear on mobile viewports
- The mobile sidebar does not slide in or the backdrop is missing
- Navigating on mobile does not close the sidebar overlay
- Any action causes a JavaScript error or blank screen

### Visual Failure Criteria

- Nav items icon and label stacked vertically instead of inline (horizontal)
- Active item indistinguishable from inactive items (no visual highlight)
- Collapsed sidebar shows partial label text or icons misaligned
- Tooltips clipped at viewport edge or positioned incorrectly
- Mobile sidebar overlay doesn't cover full height or backdrop missing
- Sidebar collapse/expand causes content area to jump or flash
- Project switcher text truncated or overlapping nav items
