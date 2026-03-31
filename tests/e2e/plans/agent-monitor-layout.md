# Test Plan: Agent Monitor — Layout

## Objective

Verify the Agent Monitor page renders with Live/History tabs, and shows the correct empty state message when no agents are running.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (no currently running executions preferred for empty state testing)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/agents`
   - Verify: the Agent Monitor page loads without errors
   - **Screenshot checkpoint:** Take screenshot. Examine: page layout, tab bar rendering, sidebar active state highlighting for Agent Monitor, overall page structure.

2. **Verify** the tab bar is present with Live and History tabs
   - Look for: a tab strip with two tabs labeled "Live" and "History"
   - Expected: both tabs are visible and clickable
   - The "Live" tab should be active by default (selected styling)
   - **Screenshot checkpoint:** Take screenshot. Examine: tab bar alignment, active tab styling (underline/highlight), tab text readability, tab bar positioned correctly relative to page header.

3. **Verify** the Live tab shows an active agent count badge (if agents are running)
   - Look for: a green badge with a number next to the "Live" tab text
   - Expected: if running agents exist, the badge shows the count (e.g., "2"); if no agents are running, no badge is shown

4. **Verify** the empty state when no agents are running
   - Look for: a centered message with a monitor icon
   - Expected: text "No agents running" as the heading
   - Expected: subtext "Agents start when stories move through workflow states."
   - Expected: a button or link labeled "Go to Story Board" that links to `/board`
   - **Screenshot checkpoint:** Take screenshot. Examine: empty state centered vertically and horizontally, icon properly sized, heading/subtext readable, button styled correctly, no broken layout.

5. **Click** the "History" tab
   - Target: the "History" tab trigger
   - Expected: the tab becomes active and the history view content replaces the live view
   - **Screenshot checkpoint:** Take screenshot. Examine: tab switch rendered cleanly, History tab now has active styling, Live tab deactivated, content area updated.

6. **Click** the "Live" tab to switch back
   - Target: the "Live" tab trigger
   - Expected: the live view content is restored (empty state or active agents)

7. **Verify** the "Go to Story Board" link works (if empty state is shown)
   - Click the "Go to Story Board" button in the empty state
   - Expected: navigates to `/board` or the work items page

8. **Navigate back** to `/agents`
   - Verify: the Agent Monitor page is restored

9. **Take final screenshot** of the Agent Monitor layout for evidence (full page)

## Expected Results

- The Agent Monitor page loads with a tab bar showing "Live" and "History" tabs
- "Live" tab is active by default
- When no agents are running, the Live tab shows an empty state with "No agents running" message, explanatory text, and a link to the Story Board
- If agents are running, the "Live" tab shows an active count badge
- Switching between tabs works correctly
- The "Go to Story Board" link navigates to the correct page

### Visual Quality

- Tab bar: tabs evenly sized, active tab clearly distinguished, no clipping of tab labels
- Active tab badge: green badge properly positioned, count readable, badge doesn't overlap tab text
- Empty state: centered in content area, icon properly sized, heading hierarchy clear, button styled as link/button
- Tab switching: content area transitions smoothly, no flash of blank content between tabs
- Sidebar: Agent Monitor nav item highlighted as active
- Overall: consistent page structure with other pages, proper spacing

## Failure Criteria

- The Agent Monitor page does not load or shows a white screen
- The tab bar is missing or does not show "Live" and "History" tabs
- "Live" tab is not the default active tab
- No empty state message is shown when no agents are running
- The empty state message text does not match expected content
- Clicking "History" tab does not switch the view
- The page shows a JavaScript error

### Visual Failure Criteria

- Tab bar misaligned or tabs different sizes
- Active tab indistinguishable from inactive tab (no visual difference)
- Agent count badge overlaps tab text or is cut off
- Empty state not centered or icon/text misaligned
- Tab switch shows blank flash or broken intermediate state
- "Go to Story Board" button invisible or unstyled
