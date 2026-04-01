# E2E Test Results: Router Structured Output

**Date:** 2026-04-01 00:55 PDT
**Plan:** `tests/e2e/plans/router-structured-output.md`
**Environment:** Backend :3001, Frontend :5173, chrome-devtools MCP

## Summary

| Metric | Count |
|---|---|
| PASS | 5 |
| FAIL | 0 |
| SKIP | 8 |
| Total | 13 |

**SKIP reason:** All 11 seeded executions predate the structured output feature (SDK.SO.1). Router executions have `structuredOutput: null`, so the RouterDecisionCard never renders. Steps requiring visible decision cards, confidence dots, or compact badge display are SKIP. The fallback behavior (showing Router executions as standard `agent_completed` events) was verified to work correctly.

## Per-Step Results

### Part 1: Agent Monitor History — Router Decision Card

| Step | Verdict | Notes |
|---|---|---|
| 1. Navigate to /agents | PASS | Agent monitor page loads with Live/History tabs |
| 2. Switch to History tab | PASS | 11 execution rows visible with filters and stats |
| 3. Find Router execution row | PASS | Two Router rows found: "Set up OAuth2 backend routes" and "User authentication with OAuth2" |
| 4. Expand Router row — verify card | SKIP | Expanded row shows terminal renderer with logs but no RouterDecisionCard (structuredOutput is null for legacy data) |
| 5. Verify state badge color | SKIP | No card rendered to check |

### Part 2: Activity Feed — Router Decision Event

| Step | Verdict | Notes |
|---|---|---|
| 6. Navigate to /activity | PASS | Activity feed loads with chronological events |
| 7. Find Router Decision events | SKIP | Router executions appear as `agent_completed` (no structuredOutput → no router_decision type). Fallback behavior correct. |
| 8. Verify compact card display | SKIP | No router_decision events to render |
| 9. Verify confidence indicator colors | SKIP | No structured output data |
| 10. Compare Router vs non-Router events | PASS | Non-Router agent_completed events (Tech Lead, Engineer, PM) show plain text description — no state badge or confidence indicator. Conditional rendering confirmed. |

### Part 3: Visual Quality

| Step | Verdict | Notes |
|---|---|---|
| 11. Full-page agent monitor screenshot | SKIP | Card not visible to check integration |
| 12. Full-page activity feed screenshot | SKIP | No router_decision events to check layout |
| 13. Verify dark mode styling | SKIP | No card rendered to check dark mode |

## Screenshots

1. `rso-01-agents-page.png` — Agent monitor Live tab, empty state
2. `rso-02-history-router-rows.png` — History tab with Router rows visible
3. `rso-03-router-expanded-no-card.png` — Expanded Router execution: terminal renderer only, no decision card (null structuredOutput)
4. `rso-04-activity-feed.png` — Activity feed with Router executions as standard agent_completed events
5. `rso-05-full-page.png` — Full-page activity feed

## Notes for Re-Testing

Steps 4-5, 7-9, 11-13 (8 SKIP steps) need re-testing after a live Router execution produces structured output. To test:
1. Ensure Router persona has `isRouter: true` in settings (verified in seed.ts)
2. Start backend with real executor (`EXECUTOR_MODE=claude`)
3. Trigger a workflow that reaches the Router (e.g., complete an In Progress work item → Router routes to In Review)
4. Check agent monitor History: expanded Router row should show RouterDecisionCard with state badge + confidence
5. Check activity feed: Router execution should appear as `router_decision` event with compact card

The `RouterDecisionCard` component and `isRouterDecision()` type guard were verified via code review in SDK.SO.2. The e2e test confirms the fallback behavior (null structuredOutput → no card, standard display) works correctly.
