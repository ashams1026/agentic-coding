# Test Plan: Dashboard Navigation

## Objective

Verify that clicking each stat card and widget link on the dashboard navigates to the correct page, and that navigating back restores the dashboard.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/`
   - Verify: "Dashboard" heading is visible
   - **Screenshot checkpoint:** Take screenshot. Examine: dashboard layout, stat card grid, sidebar alignment, overall page structure.

2. **Click** the "Active Agents" stat card
   - Target: the card containing text "Active Agents"
   - Expected: navigates to the Agent Monitor page (`/agents`)
   - Verify: the URL contains `/agents` and the Agent Monitor page content is visible (e.g., "Live" or "History" tabs)
   - **Screenshot checkpoint:** Take screenshot. Examine: Agent Monitor page layout, tab rendering, sidebar active state highlighting, page transition (no broken/partial render).

3. **Navigate back** to the dashboard
   - Action: click browser back button or navigate to `http://localhost:5173/`
   - Verify: "Dashboard" heading is visible again, all 4 stat cards are present
   - **Screenshot checkpoint:** Take screenshot. Examine: dashboard fully restored, no stale data, stat cards re-rendered cleanly, no layout shift.

4. **Click** the "Pending Proposals" stat card
   - Target: the card containing text "Pending Proposals"
   - Expected: navigates to the Work Items page (`/items`)
   - Verify: the URL contains `/items` and work items content is visible
   - **Screenshot checkpoint:** Take screenshot. Examine: Work Items page layout, list/flow view rendering, filter bar alignment.

5. **Navigate back** to the dashboard
   - Verify: dashboard is fully restored with all widgets

6. **Click** the "Needs Attention" stat card
   - Target: the card containing text "Needs Attention"
   - Expected: navigates to the Activity Feed page (`/activity`)
   - Verify: the URL contains `/activity` and activity feed content is visible
   - **Screenshot checkpoint:** Take screenshot. Examine: Activity Feed page layout, event rows rendering, filter bar, date grouping headers.

7. **Navigate back** to the dashboard
   - Verify: dashboard is fully restored

8. **Click** the "Today's Cost" stat card
   - Target: the card containing text "Today's Cost"
   - Expected: navigates to the Settings page (`/settings`)
   - Verify: the URL contains `/settings` and settings content is visible
   - **Screenshot checkpoint:** Take screenshot. Examine: Settings page layout, sidebar/section rendering, form elements visible.

9. **Navigate back** to the dashboard
   - Verify: dashboard is fully restored

10. **Click** the "View all" link in the Recent Activity widget
    - Target: link with text "View all" near the "Recent Activity" heading
    - Expected: navigates to the Activity Feed page (`/activity`)
    - Verify: the URL contains `/activity`

11. **Navigate back** to the dashboard
    - Verify: dashboard is fully restored
    - **Screenshot checkpoint:** Take screenshot. Examine: final dashboard state after all navigations — all widgets intact, no visual degradation from repeated navigation.

12. **Take final screenshot** of the restored dashboard for evidence (full page)

## Expected Results

- "Active Agents" card navigates to `/agents`
- "Pending Proposals" card navigates to `/items`
- "Needs Attention" card navigates to `/activity`
- "Today's Cost" card navigates to `/settings`
- "View all" link navigates to `/activity`
- After each navigation, clicking back returns to the dashboard with all content intact
- No navigation results in a blank page or error

### Visual Quality

- Each target page renders fully (not a blank shell or partial load)
- Sidebar active state updates correctly on each navigation (highlighted nav item matches current page)
- Dashboard restores cleanly after each back-navigation: no layout shift, no missing widgets, no stale data
- Page transitions are smooth: no flash of unstyled content, no broken intermediate states
- All target pages have consistent sidebar rendering and page structure

## Failure Criteria

- Any stat card click does not navigate (page stays on dashboard)
- Navigation goes to the wrong page (e.g., "Active Agents" goes to `/items` instead of `/agents`)
- Navigating back does not restore the dashboard (blank page, missing cards, or stale data)
- Any navigation results in a JavaScript error or white screen
- The "View all" link is missing or does not navigate

### Visual Failure Criteria

- Target page renders as blank or partially loaded after navigation
- Sidebar active state does not update (wrong nav item highlighted)
- Dashboard shows layout shift or missing widgets after back-navigation
- Any page transition shows a flash of broken/unstyled content
- Stat cards or widgets re-render in a different layout after returning to dashboard
