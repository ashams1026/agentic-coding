# Test Plan: Dashboard Navigation

## Objective

Verify that clicking each stat card and widget link on the dashboard navigates to the correct page, and that navigating back restores the dashboard.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173`
- API mode set to "api"
- Database seeded with test data

## Steps

1. **Navigate** to `http://localhost:5173/`
   - Verify: "Dashboard" heading is visible

2. **Click** the "Active Agents" stat card
   - Target: the card containing text "Active Agents"
   - Expected: navigates to the Agent Monitor page (`/agents`)
   - Verify: the URL contains `/agents` and the Agent Monitor page content is visible (e.g., "Live" or "History" tabs)

3. **Navigate back** to the dashboard
   - Action: click browser back button or navigate to `http://localhost:5173/`
   - Verify: "Dashboard" heading is visible again, all 4 stat cards are present

4. **Click** the "Pending Proposals" stat card
   - Target: the card containing text "Pending Proposals"
   - Expected: navigates to the Work Items page (`/items`)
   - Verify: the URL contains `/items` and work items content is visible

5. **Navigate back** to the dashboard
   - Verify: dashboard is fully restored with all widgets

6. **Click** the "Needs Attention" stat card
   - Target: the card containing text "Needs Attention"
   - Expected: navigates to the Activity Feed page (`/activity`)
   - Verify: the URL contains `/activity` and activity feed content is visible

7. **Navigate back** to the dashboard
   - Verify: dashboard is fully restored

8. **Click** the "Today's Cost" stat card
   - Target: the card containing text "Today's Cost"
   - Expected: navigates to the Settings page (`/settings`)
   - Verify: the URL contains `/settings` and settings content is visible

9. **Navigate back** to the dashboard
   - Verify: dashboard is fully restored

10. **Click** the "View all" link in the Recent Activity widget
    - Target: link with text "View all" near the "Recent Activity" heading
    - Expected: navigates to the Activity Feed page (`/activity`)
    - Verify: the URL contains `/activity`

11. **Navigate back** to the dashboard
    - Verify: dashboard is fully restored

12. **Take screenshot** of the restored dashboard for evidence

## Expected Results

- "Active Agents" card navigates to `/agents`
- "Pending Proposals" card navigates to `/items`
- "Needs Attention" card navigates to `/activity`
- "Today's Cost" card navigates to `/settings`
- "View all" link navigates to `/activity`
- After each navigation, clicking back returns to the dashboard with all content intact
- No navigation results in a blank page or error

## Failure Criteria

- Any stat card click does not navigate (page stays on dashboard)
- Navigation goes to the wrong page (e.g., "Active Agents" goes to `/items` instead of `/agents`)
- Navigating back does not restore the dashboard (blank page, missing cards, or stale data)
- Any navigation results in a JavaScript error or white screen
- The "View all" link is missing or does not navigate
