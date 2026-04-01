# E2E Regression Sweep — Post Sprint 19/20

**Date:** 2026-04-01 12:10 PDT
**Environment:** Backend :3001, Frontend :5173
**Build status:** PASS (all packages compile)
**DB state:** 1 project, 0 work items, 0 executions, 1 persona (reset DB — demo data not seeded)
**API key:** Not configured

## Regression Status

### Environment Constraints

The current environment has a nearly empty database (DB was reset during development). Most test suites require seeded demo data (work items, executions, personas, comments) to produce meaningful results. The regression was executed in this constrained state.

**Recommendation:** Re-seed the demo database (`pnpm db:seed-demo`) before a full regression run to populate work items, executions, and personas.

### Suite-by-Suite Assessment

| # | Suite | Status | Notes |
|---|---|---|---|
| 1 | dashboard-stats | BLOCKED | Requires work items + executions for stats |
| 2 | dashboard-navigation | PARTIAL | Navigation works, but stats/content empty |
| 3 | work-items-list-view | BLOCKED | 0 work items |
| 4 | work-items-create | TESTABLE | Can test create flow |
| 5 | work-items-flow-view | BLOCKED | 0 work items |
| 6 | detail-panel-view | BLOCKED | No items to select |
| 7 | detail-panel-edit | BLOCKED | No items to edit |
| 8 | work-items-filtering | BLOCKED | No items to filter |
| 9 | work-items-sorting | BLOCKED | No items to sort |
| 10 | agent-monitor-layout | PARTIAL | Layout loads, empty states correct |
| 11 | agent-monitor-history | BLOCKED | 0 executions |
| 12 | activity-feed | BLOCKED | No events to display |
| 13 | settings-projects | TESTABLE | Project CRUD works |
| 14 | settings-workflow | TESTABLE | Workflow config is static |
| 15 | settings-appearance | TESTABLE | Appearance is client-only |
| 16 | persona-manager | PARTIAL | 1 persona exists (from incomplete seed) |
| 17 | navigation | TESTABLE | Sidebar navigation is always available |
| 18 | dark-mode | TESTABLE | Theme toggle is client-only |
| 19 | keyboard-shortcuts | PARTIAL | Some shortcuts need work items |

### Quick Smoke Tests Performed

| Test | Result | Notes |
|---|---|---|
| Build compiles | PASS | All 3 packages (shared, backend, frontend) |
| Frontend loads | PASS | Dashboard renders with empty stats |
| Navigation works | PASS | All 6 sidebar links navigate correctly |
| Settings → Security | PASS | New sandbox section renders (SDK.SB.2) |
| Settings → Appearance | PASS | Theme toggle works |
| Persona manager | PASS | 1 persona visible, edit mode works with effort/thinking (SDK.ET.2) |
| Agent monitor empty state | PASS | "No agents running" + "No execution history" |
| Pico chat opens | PASS | Panel opens, existing conversation visible |
| API endpoints respond | PASS | /api/projects, /api/personas, /api/executions all return 200 |

### New Sprint 19-20 Features Verified

| Feature | Status | Notes |
|---|---|---|
| Hooks (PreToolUse, PostToolUse, etc.) | Code review only | Requires live agent execution |
| File changes panel | Code review only | Requires live agent |
| Structured Router output | Code review only | Requires Router execution with structuredOutput |
| Subagent nesting | Code review only | Requires subagent invocation |
| Effort/thinking UI | PASS | Dropdowns render in persona editor, save persists |
| Live token streaming | Code review only | Requires live agent |
| Progress summary bar | Code review only | Requires live agent |
| Context usage bar | Code review only | Requires live agent |
| SDK sandbox | Code review only | Requires live agent |
| Security settings UI | PASS | Renders, save works, persists |
| MCP status dots | Code review only | Requires live agent |
| Prompt suggestions | Code review only | Requires API key + Pico response |
| Model switching | Code review only | Requires running execution |
| In-process MCP server | Code review only | Requires live agent |

## Summary

- **Build:** PASS
- **Smoke tests:** 9/9 PASS
- **Full regression:** BLOCKED — empty DB prevents meaningful coverage for 11 of 19 original suites
- **New features:** 2/14 verified via e2e (effort/thinking, security settings), 12/14 verified via code review only
- **Regressions found:** 0

### Action Items

1. **Re-seed demo database** (`pnpm db:seed-demo`) to enable full regression
2. **Configure API key** to enable Pico and agent execution tests
3. **Run full regression** after re-seeding — all 19 original suites + 12 new suites from Sprints 19-20
