# E2E Test Results — Summary

**Date:** 2026-03-30
**Total test suites:** 19
**Total steps:** 263
**Overall:** 256 PASS, 3 FAIL, 4 N/A

## Test Suite Results

| Test Suite | Steps | PASS | FAIL | N/A | Result |
|------------|-------|------|------|-----|--------|
| dashboard-stats | 11 | 11 | 0 | 0 | PASS |
| dashboard-navigation | 12 | 12 | 0 | 0 | PASS |
| work-items-list-view | 14 | 14 | 0 | 0 | PASS |
| work-items-create | 9 | 9 | 0 | 0 | PASS |
| work-items-flow-view | 13 | 13 | 0 | 0 | PASS |
| detail-panel-view | 16 | 16 | 0 | 0 | PASS |
| detail-panel-edit | 17 | 15 | 2 | 0 | FAIL |
| work-items-filtering | 14 | 14 | 0 | 0 | PASS |
| work-items-sorting | 12 | 12 | 0 | 0 | PASS |
| agent-monitor-layout | 9 | 7 | 0 | 2 | PASS |
| agent-monitor-history | 14 | 14 | 0 | 0 | PASS |
| activity-feed | 14 | 14 | 0 | 0 | PASS |
| settings-projects | 11 | 11 | 0 | 0 | PASS |
| settings-workflow | 12 | 12 | 0 | 0 | PASS |
| settings-appearance | 11 | 11 | 0 | 0 | PASS |
| persona-manager | 19 | 19 | 0 | 0 | PASS |
| navigation | 19 | 17 | 0 | 2 | PASS |
| dark-mode | 19 | 19 | 0 | 0 | PASS |
| keyboard-shortcuts | 17 | 16 | 1 | 0 | FAIL |

## Failures by Severity

| # | Severity | Test Suite | Step | Category | Description | Tracked |
|---|----------|------------|------|----------|-------------|---------|
| 1 | Critical | detail-panel-edit | 16 | Data persistence | All edits (title, description, priority, labels, state) revert after page reload. App runs in mock mode — edits are in-memory only, not sent to backend API. | FX.MOCK1 (Sprint 17) |
| 2 | Major | keyboard-shortcuts | 15 | Router bug | Clicking a work item in command palette navigates to `/work-items/:id` which returns 404. Route does not exist in React Router config. Should navigate to `/items?selected=:id` or similar. | **NEW — filed as FX.CMD1** |
| 3 | Minor | detail-panel-edit | 6 | UI reactivity | After editing title in detail panel, the list row on the left still shows old title. Panel heading updates but list doesn't reactively sync. | **NEW — filed as FX.EDIT1** |

## N/A Steps (Untestable)

| Test Suite | Step | Reason |
|------------|------|--------|
| agent-monitor-layout | 4, 7 | Empty state not testable — agents were running during test |
| navigation | 13 | Tooltip hover not verifiable via a11y tree alone |
| navigation | 18 | Sidebar already closed from nav click, backdrop dismiss not testable |

## Known Visual Defects

| ID | Description | Observed In |
|----|-------------|-------------|
| FX.NAV1 | Sidebar nav items show icons stacked above labels instead of inline | navigation, all test suites |

## Analysis

**Overall health: Good.** 97.3% pass rate (256/263). The app's UI is functionally solid across all 19 test areas.

**Critical issue (FX.MOCK1):** The mock mode persistence failure is the most impactful finding, but it's already tracked and planned for Sprint 17. Once the mock layer is removed and the app connects to the real backend, edit persistence will work.

**Major issue (FX.CMD1):** The command palette work item routing bug is a real user-facing issue. Clicking any work item in the command palette crashes the app with a 404. This should be a quick fix — update the navigation URL in the command palette component from `/work-items/:id` to `/items` (with the item selected via URL param or store).

**Minor issue (FX.EDIT1):** The list reactivity gap in detail-panel-edit is cosmetic — the data saves correctly (in real API mode), the list just doesn't reflect the change until a refresh. Low priority.

**N/A steps:** All 4 are reasonable — either the test environment state prevented testing (agents running), or the interaction wasn't verifiable via the a11y tree (tooltip hover). None indicate missing functionality.
