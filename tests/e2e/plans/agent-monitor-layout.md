# Test Plan: Agent Monitor — Layout

## Objective

Verify the Agent Monitor page renders with Live/History tabs, and shows the correct empty state message when no agents are running.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173`
- API mode set to "api"
- Database seeded with test data (no currently running executions preferred for empty state testing)

## Steps

1. **Navigate** to `http://localhost:5173/agents`
   - Verify: the Agent Monitor page loads without errors

2. **Verify** the tab bar is present with Live and History tabs
   - Look for: a tab strip with two tabs labeled "Live" and "History"
   - Expected: both tabs are visible and clickable
   - The "Live" tab should be active by default (selected styling)

3. **Verify** the Live tab shows an active agent count badge (if agents are running)
   - Look for: a green badge with a number next to the "Live" tab text
   - Expected: if running agents exist, the badge shows the count (e.g., "2"); if no agents are running, no badge is shown

4. **Verify** the empty state when no agents are running
   - Look for: a centered message with a monitor icon
   - Expected: text "No agents running" as the heading
   - Expected: subtext "Agents start when stories move through workflow states."
   - Expected: a button or link labeled "Go to Story Board" that links to `/board`

5. **Click** the "History" tab
   - Target: the "History" tab trigger
   - Expected: the tab becomes active and the history view content replaces the live view

6. **Click** the "Live" tab to switch back
   - Target: the "Live" tab trigger
   - Expected: the live view content is restored (empty state or active agents)

7. **Verify** the "Go to Story Board" link works (if empty state is shown)
   - Click the "Go to Story Board" button in the empty state
   - Expected: navigates to `/board` or the work items page

8. **Navigate back** to `/agents`
   - Verify: the Agent Monitor page is restored

9. **Take screenshot** of the Agent Monitor layout for evidence

## Expected Results

- The Agent Monitor page loads with a tab bar showing "Live" and "History" tabs
- "Live" tab is active by default
- When no agents are running, the Live tab shows an empty state with "No agents running" message, explanatory text, and a link to the Story Board
- If agents are running, the "Live" tab shows an active count badge
- Switching between tabs works correctly
- The "Go to Story Board" link navigates to the correct page

## Failure Criteria

- The Agent Monitor page does not load or shows a white screen
- The tab bar is missing or does not show "Live" and "History" tabs
- "Live" tab is not the default active tab
- No empty state message is shown when no agents are running
- The empty state message text does not match expected content
- Clicking "History" tab does not switch the view
- The page shows a JavaScript error
