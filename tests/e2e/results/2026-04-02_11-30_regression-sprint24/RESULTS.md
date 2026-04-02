# E2E Regression Sweep — Post Sprint 24 (Core UX)

**Date:** 2026-04-02 11:30 PDT
**Environment:** Backend :3001, Frontend :5173
**Build:** PASS (all 4 packages compile — shared, core, backend, frontend)
**DB state:** 1 project (tictactoe), 3 work items, 7 personas, 3+ executions, 3+ chat sessions

## Summary

| Metric | Value |
|--------|-------|
| Test suites evaluated | 36 |
| UI-verified (e2e) | 26 |
| Code-review only | 10 |
| PASS | 26 |
| FAIL | 0 |
| SKIP | 0 |
| Regressions vs prior runs | 0 |

## Suite-by-Suite Results

### Core UI (Original Sprint 1-18 suites)

| # | Suite | Status | Prior | Notes |
|---|-------|--------|-------|-------|
| 1 | dashboard-stats | PASS | PASS | Stat cards render, cost summary chart |
| 2 | dashboard-navigation | PASS | PASS | Project/global scope switching |
| 3 | work-items-list-view | PASS | PASS | 3 items visible with controls |
| 4 | work-items-create | PASS | PASS | Inline creation via "+ Add" |
| 5 | work-items-flow-view | PASS | PASS | Workflow columns render |
| 6 | detail-panel-view | PASS | PASS | Title, status, priority, description |
| 7 | detail-panel-edit | PASS | PASS | Fields editable |
| 8 | work-items-filtering | PASS | PASS | Filter controls present |
| 9 | work-items-sorting | PASS | PASS | Sort controls functional |
| 10 | agent-monitor-layout | PASS | PASS | Live/History tabs, scope filter, New Run |
| 11 | agent-monitor-history | PASS | PASS | History tab renders |
| 12 | activity-feed | PASS | PASS | Empty state renders |
| 13 | settings-projects | PASS | PASS | Project list with tictactoe |
| 14 | settings-workflow | PASS | PASS | Auto-routing toggle, persona assignments |
| 15 | settings-appearance | PASS | PASS | Theme toggles |
| 16 | persona-manager | PASS | PASS | 7 personas + editor |
| 17 | navigation | PASS | PASS | All 7 sidebar links route |
| 18 | dark-mode | PASS | PASS | Dark theme renders |
| 19 | keyboard-shortcuts | PASS | PASS | Cmd+K command palette |

### Sprint 19-20 Feature Suites

| # | Suite | Status | Prior | Notes |
|---|-------|--------|-------|-------|
| 20 | sandbox-settings | PASS | PASS | Sandbox toggle, domains, paths |
| 21 | persona-effort-thinking | PASS | PASS | Model/budget, effort fields |
| 22 | pico-chat | PASS | PASS | Chat page with welcome, input |

### Sprint 23 Feature Suites (Foundations)

| # | Suite | Status | Prior | Notes |
|---|-------|--------|-------|-------|
| 23 | error-recovery-phase1 | PASS | PASS | PRAGMAs, error boundaries, WS reconnect |
| 24 | work-item-lifecycle | PASS | PASS | Archive/unarchive, soft delete, restore |
| 25 | global-agents-phase1 | PASS | PASS | All Projects scope, New Run modal |

### Sprint 24 Feature Suites (Core UX)

| # | Suite | Status | Prior | Notes |
|---|-------|--------|-------|-------|
| 26 | agent-chat-phase1 | PASS | PASS | Persona selector, sidebar, header, context menu (just verified) |
| 27 | notifications-ux | PASS | PASS | Bell, drawer, cards, Settings tab (just verified) |

### Agent-Dependent Suites (Code Review Only)

| # | Suite | Status | Notes |
|---|-------|--------|-------|
| 28 | agent-monitor-streaming | CODE REVIEW | Requires live token streaming |
| 29 | agent-monitor-files | CODE REVIEW | Requires agent file changes |
| 30 | file-checkpointing | CODE REVIEW | Requires execution with file modifications |
| 31 | executor-switching | CODE REVIEW | Requires running execution |
| 32 | router-structured-output | CODE REVIEW | Requires Router persona with structuredOutput |
| 33 | subagent-nesting | CODE REVIEW | Requires subagent invocation chain |
| 34 | model-switching | CODE REVIEW | Requires running execution |
| 35 | mcp-status | CODE REVIEW | Requires MCP server running with agent |
| 36 | pico-suggestions | CODE REVIEW | Requires API key + Pico response |

## API Endpoint Verification

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| /api/projects | GET | 200 | 1 project |
| /api/personas | GET | 200 | 7 personas |
| /api/work-items | GET | 200 | 3 items |
| /api/work-items?includeArchived=true | GET | 200 | 6 items (includes archived) |
| /api/work-items?deleted=true | GET | 200 | 1 item (soft-deleted) |
| /api/executions | GET | 200 | Executions returned |
| /api/executions/run | POST | 201 | Standalone execution created |
| /api/executions/run (no params) | POST | 400 | Validation works |
| /api/executions/run (bad persona) | POST | 404 | Persona validation works |
| /api/chat/sessions | POST | 201 | Empty body → global session |
| /api/chat/sessions | GET | 200 | Sessions with persona join + lastMessagePreview |
| /api/dashboard/stats | GET | 200 | Stats returned |
| /api/settings/db-stats | GET | 200 | DB stats returned |

## Comparison with Prior Regression Runs

- **vs 2026-04-02 Sprint 23 regression:** All 25 original suites PASS → PASS. No regressions.
- **vs Sprint 24 tests (CUX.TEST.2, CUX.TEST.4):** Agent Chat 7/7 PASS, Notifications 7/7 PASS — confirmed.

## Regressions Found: 0

No new failures compared to any prior regression run.

## Screenshots

7 screenshots saved covering all major UI areas:
- `01_dashboard.png` — Dashboard with stat cards and cost summary
- `02_work-items.png` — Work items list view
- `03_agent-monitor.png` — Agent Monitor with scope filter
- `04_activity-feed.png` — Activity Feed
- `05_chat.png` — Chat page with "Chat" header, "+" button, bell icon in footer
- `06_personas.png` — Persona Manager grid
- `07_settings.png` — Settings Projects tab
