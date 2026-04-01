# Agent Analytics: Dashboard UX Design

> Research document for **RES.ANALYTICS.UX**. Design only — no implementation tasks.

---

## 1. Current State Audit

### Existing Analytics Surfaces

AgentOps already displays analytics data in three places, but there is no dedicated analytics view:

| Surface | Location | What It Shows |
|---------|----------|---------------|
| **Dashboard stat cards** | `pages/dashboard.tsx:68-97` | 4 cards: Active Agents, Pending Proposals, Needs Attention, Today's Cost |
| **Dashboard cost widget** | `features/dashboard/cost-summary.tsx` | 7-day sparkline (Recharts AreaChart), today's spend, monthly progress bar with cap |
| **Agent Monitor stats bar** | `features/agent-monitor/agent-history.tsx:143-172` | Runs count, Total Cost, Success %, Avg Duration — computed from loaded executions |
| **Settings > Costs** | `features/settings/costs-section.tsx` | 7-day bar chart (Recharts BarChart), monthly cap editor |

### What's Missing for Analytics

1. **No time range controls** — dashboard shows "today" and "last 7 days" only. No way to see last 30 days, custom ranges, or week-over-week comparison.
2. **No per-persona breakdown** — no view showing which personas cost the most or have the highest success rate.
3. **No per-project comparison** — dashboard is scoped to one project at a time; no cross-project view.
4. **No drill-down** — clicking a metric doesn't navigate to the underlying data.
5. **No export** — no way to download raw data for external analysis.
6. **No visualization variety** — only sparkline/bar charts for cost. No success/failure breakdowns, no heatmaps, no workflow bottleneck views.

### Charting Library

The frontend already uses **Recharts** (`packages/frontend/package.json`). Used in:
- `cost-summary.tsx`: AreaChart (sparkline)
- `costs-section.tsx`: BarChart (7-day)

Recharts supports all the chart types needed for analytics (Line, Bar, Area, Pie, Radar, Scatter, Treemap). No need to introduce a new library.

---

## 2. Where Analytics Live

### Options

| Option | Pros | Cons |
|--------|------|------|
| **A. Dedicated Analytics page** (`/analytics`) | Full-screen space for charts, no compromise with existing layout | Another nav item, users might ignore it |
| **B. Embedded widgets on Dashboard** | Zero-click discovery, always visible | Dashboard gets crowded, limited space per widget |
| **C. Tab in Settings** | Near cost config | Buried in settings, not discoverable |
| **D. Hybrid: Dashboard widgets + dedicated page** | Quick summary on dashboard, deep dive available | Two places to maintain |

### Recommendation: Option D (Hybrid)

**Dashboard** keeps its current 4 stat cards + 3 widgets. Add a "View Analytics" link that navigates to `/analytics`.

**Analytics page** (`/analytics`) is the dedicated deep-dive view. New sidebar nav item between "Activity Feed" and "Chat":

```
  Dashboard
  Work Items
  Agent Monitor
  Activity Feed
  Analytics        ← NEW
  Chat
  Personas
  Settings
```

Icon: `BarChart3` from lucide-react (matches the analytics visual).

### Dashboard Enhancement (Minimal)

Replace the simple "Today's Cost" stat card with a more informative one:

```
┌───────────────────────────────┐
│ Cost & Performance            │
│                               │
│  $12.45 today  ·  87% success │
│  $148.90 this month           │
│                               │
│  [View Analytics →]           │
└───────────────────────────────┘
```

This gives at-a-glance performance data without leaving the dashboard.

---

## 3. Time Range Controls

### Design

A persistent time range selector at the top of the Analytics page:

```
┌─────────────────────────────────────────────────────────────────┐
│ Analytics                                                        │
│                                                                  │
│ [24h] [7d] [30d] [90d] [Custom ▾]          vs Previous Period ☐ │
│                                                                  │
│ ...charts below...                                               │
└─────────────────────────────────────────────────────────────────┘
```

| Preset | Range | Notes |
|--------|-------|-------|
| **24h** | Last 24 hours | Most recent activity |
| **7d** | Last 7 days | Default selection |
| **30d** | Last 30 days | Monthly view |
| **90d** | Last 90 days | Quarterly view |
| **Custom** | Date picker | Start date + end date, max 1 year |

### Comparison Mode

Toggle "vs Previous Period" to show comparison:
- 7d selected → compare with prior 7 days
- 30d selected → compare with prior 30 days
- Charts show both periods overlaid (current as solid, previous as dashed)
- Summary cards show delta arrows (e.g., "Cost: $148.90 ↑12% vs prior period")

### Implementation

Time range is stored as URL query params (`?range=7d`) so the view is shareable/bookmarkable. The Analytics page component manages range state and passes it to all child chart components.

API endpoints already accept `projectId` but need to accept `startDate`/`endDate` parameters. The dashboard.ts endpoints should be extended (or new analytics endpoints created) to support arbitrary time ranges.

---

## 4. Visualizations

### Section Layout

The Analytics page is organized into sections, each with a header and one or more charts:

```
┌─────────────────────────────────────────────────────────────────┐
│ Analytics                                   [24h] [7d] [30d]    │
│                                                                  │
│ ┌─── Summary Cards ──────────────────────────────────────────┐  │
│ │  Total Cost   │  Executions  │  Success Rate  │  Avg Duration │
│ │  $148.90      │  342         │  89%           │  2m 34s       │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌─── Cost Over Time ─────────────────────────────────────────┐  │
│ │  [Line chart — daily cost with optional comparison overlay] │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌─── Execution Outcomes ──────┐  ┌─── By Persona ────────────┐  │
│ │  [Stacked bar — success/    │  │  [Horizontal bar — cost   │  │
│ │   failure/rejected per day] │  │   breakdown by persona]   │  │
│ └─────────────────────────────┘  └────────────────────────────┘  │
│                                                                  │
│ ┌─── Persona Leaderboard ────────────────────────────────────┐  │
│ │  [Table — persona, runs, success%, avg cost, total cost]   │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌─── Activity Heatmap ───────────────────────────────────────┐  │
│ │  [Heatmap — executions by hour-of-day × day-of-week]       │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌─── Workflow Bottlenecks ───────────────────────────────────┐  │
│ │  [Horizontal bar — avg time per workflow state]             │  │
│ └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Chart Specifications

#### 4.1 Summary Cards (Top Row)

Four cards showing aggregate metrics for the selected time range:

| Card | Value | Delta | Click Action |
|------|-------|-------|-------------|
| **Total Cost** | `$148.90` | `↑12%` vs prior | Scrolls to Cost Over Time |
| **Executions** | `342` | `↓5%` | Scrolls to Execution Outcomes |
| **Success Rate** | `89%` | `↑3%` | Scrolls to Persona Leaderboard |
| **Avg Duration** | `2m 34s` | `→ 0%` (no change) | Scrolls to Workflow Bottlenecks |

Delta arrows use color: green for improvement (cost ↓ or success ↑), red for regression, gray for neutral.

#### 4.2 Cost Over Time (Line Chart)

Recharts `LineChart` with:
- X-axis: date (daily for 7d/30d, hourly for 24h)
- Y-axis: cost in USD
- Primary line: current period (solid blue)
- Comparison line: prior period (dashed gray, only when comparison enabled)
- Tooltip: date, cost, delta vs comparison

Data source: `GET /api/analytics/cost-trend?range=7d&projectId=...`

#### 4.3 Execution Outcomes (Stacked Bar Chart)

Recharts `BarChart` with stacked bars:
- X-axis: date
- Y-axis: execution count
- Segments: success (green), failure (red), rejected (amber)
- Tooltip: date, count per outcome type

Data source: `GET /api/analytics/outcomes?range=7d&projectId=...`

#### 4.4 Cost by Persona (Horizontal Bar)

Recharts `BarChart` (layout="vertical"):
- Y-axis: persona name with avatar color dot
- X-axis: cost in USD
- Bar: persona's total cost, colored by persona avatar color
- Tooltip: persona name, total cost, % of total

Data source: `GET /api/analytics/persona-breakdown?range=7d&projectId=...`

#### 4.5 Persona Leaderboard (Table)

shadcn/ui `Table` component — sortable by any column:

| Persona | Runs | Success | Avg Cost | Avg Duration | Total Cost |
|---------|------|---------|----------|--------------|------------|
| Engineer | 145 | 87% | $0.42 | 3m 12s | $60.90 |
| Code Reviewer | 89 | 94% | $0.15 | 1m 05s | $13.35 |

Click a row → navigate to that persona's detail in Persona Manager, or filter all charts to that persona.

Data source: `GET /api/analytics/persona-stats?range=7d&projectId=...`

#### 4.6 Activity Heatmap

A GitHub-contribution-style heatmap showing when agents are most active:

```
         Mon  Tue  Wed  Thu  Fri  Sat  Sun
 0:00    ·    ·    ·    ·    ·    ·    ·
 4:00    ·    ·    ·    ·    ·    ·    ·
 8:00    ██   ███  ██   ███  ██   ·    ·
12:00    ███  ████ ███  ████ ███  ·    ·
16:00    ████ ████ ████ ████ ████ █    ·
20:00    ██   ██   ██   ██   █    ·    ·
```

Intensity: number of executions in that hour-of-day × day-of-week bucket. Helps users understand when their agents are busiest (useful for scheduling — ties into RES.SCHED.UX).

Implementation: custom component using CSS Grid with colored cells. Recharts doesn't have a native heatmap, but a simple div grid with background-color opacity works well.

Data source: `GET /api/analytics/activity-heatmap?range=30d&projectId=...`

#### 4.7 Workflow Bottlenecks (Horizontal Bar)

Recharts `BarChart` (layout="vertical"):
- Y-axis: workflow state name
- X-axis: average time in state (formatted as duration)
- Bar color: gradient from green (fast) to red (slow)
- Additional annotation: rejection rate as a small badge on each bar

Data source: Requires audit log migration to DB (Phase 2 per RES.ANALYTICS.METRICS). For Phase 1, show a placeholder "Available after audit log migration" or derive from execution-level `workflow_state` + `durationMs`.

---

## 5. Drill-Down

### Interaction Pattern

Every chart element is clickable. Clicking drills down to the underlying data:

| Click Target | Drill-Down Action |
|-------------|-------------------|
| Summary card | Scroll to related chart section |
| Cost chart data point | Open day's execution list (filtered by date) |
| Outcome bar segment | Open execution list filtered by that outcome type + date |
| Persona bar | Filter all charts to that persona (chip filter appears at top) |
| Persona leaderboard row | Navigate to `/personas/:id` or filter charts |
| Heatmap cell | Open execution list filtered by that time window |
| Workflow bar | Open execution list filtered by that workflow state |

### Execution List Drill-Down

When the user drills into a specific data point, show a modal or slide-over panel with the matching executions:

```
┌──────────────────────────────────────────────────────────┐
│ Executions — April 1, 2026 (Failed)              [Close] │
│                                                           │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ ex-a8k2f  Engineer  "Add sidebar component"  Failed   │ │
│ │ Duration: 4m 12s  Cost: $0.89  Tokens: 12.4K          │ │
│ │                                          [View Detail] │ │
│ ├───────────────────────────────────────────────────────┤ │
│ │ ex-b9k3g  Engineer  "Fix responsive layout"  Failed   │ │
│ │ Duration: 2m 45s  Cost: $0.52  Tokens: 8.1K           │ │
│ │                                          [View Detail] │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                           │
│ Showing 2 of 2 matching executions                        │
└──────────────────────────────────────────────────────────┘
```

"View Detail" navigates to the execution in Agent Monitor (`/agents?execution=ex-a8k2f`).

### Filter Chips

When drilling down by persona or state, a filter chip appears at the top of the page:

```
Analytics    [Engineer ×]  [7d]  [Custom ▾]
```

Clicking the `×` removes the filter. Multiple filters can stack (persona + workflow state).

---

## 6. Export

### CSV Export

A download button in the page header:

```
Analytics    [24h] [7d] [30d]    [⬇ Export CSV]
```

Exports a CSV file containing raw execution data for the selected time range:

```csv
execution_id,persona,work_item,project,started_at,duration_ms,cost_usd,outcome,model,input_tokens,output_tokens
ex-a8k2f,Engineer,wi-abc,Project Alpha,2026-04-01T14:30:00Z,252000,0.42,success,sonnet,8421,3102
```

### JSON Export

Alternative format for programmatic consumption. Same data, structured as JSON array.

### Dashboard Snapshot (Phase 2)

"Share" button generates a static HTML page with the current chart views rendered as images (SVG snapshots). Useful for reports and team presentations. Deferred — not essential for Phase 1.

---

## 7. Responsive Design

### Breakpoints

| Viewport | Layout |
|----------|--------|
| **≥1280px** (primary) | 2-column grid for paired charts (outcomes + persona breakdown side-by-side) |
| **768-1279px** (tablet) | Single column, charts stack vertically |
| **<768px** (mobile) | Single column, summary cards in 2×2 grid, simplified charts (fewer data points) |

### Chart Responsiveness

All Recharts components wrapped in `<ResponsiveContainer width="100%" height={...}>` (already the pattern in `cost-summary.tsx`). On mobile:
- Reduce X-axis label density (show every other label)
- Hide Y-axis labels, use tooltip only
- Heatmap: switch to scrollable horizontal layout

---

## 8. Implementation Phases

### Phase 1: Analytics Page with Core Charts (Medium Effort)

**Goal:** Dedicated analytics page with time range controls and primary visualizations.

Tasks:
- Add `/analytics` route and sidebar nav item
- Build Analytics page layout with time range selector (24h/7d/30d/90d/custom)
- Summary cards (cost, executions, success rate, avg duration)
- Cost Over Time line chart
- Execution Outcomes stacked bar chart
- Cost by Persona horizontal bar
- Persona Leaderboard table
- CSV export button
- Backend: extend existing dashboard endpoints with `startDate`/`endDate` params

### Phase 2: Drill-Down + Advanced Visualizations (Medium Effort)

**Goal:** Interactive exploration and additional chart types.

Tasks:
- Activity heatmap
- Workflow bottlenecks chart (requires audit log DB migration from RES.ANALYTICS.METRICS Phase 2)
- Drill-down modals (click chart → execution list)
- Filter chips (per-persona, per-state filtering)
- Comparison mode (vs previous period)
- Dashboard "Cost & Performance" enhanced card with link to Analytics

### Phase 3: Sharing + Advanced (Lower Priority)

**Goal:** Export and shareability.

Tasks:
- JSON export
- Dashboard snapshot (static HTML)
- Shareable analytics URLs with embedded filters
- Per-project comparison view (side-by-side analytics for two projects)

---

## 9. Cross-References

| Document | Relationship |
|----------|-------------|
| `docs/proposals/analytics/metrics.md` (RES.ANALYTICS.METRICS) | Defines the data schema and collection strategy; this doc consumes those metrics for display |
| `docs/proposals/token-usage/dashboard-ux.md` (future — RES.TOKENS.DASHBOARD) | Token usage dashboard is a specialized view within or linked from analytics; should share time range controls and visual style |
| `docs/proposals/scheduling/ux-design.md` (RES.SCHED.UX) | Activity heatmap helps users understand when to schedule agents; schedule execution stats should appear in analytics |
| `packages/frontend/src/pages/dashboard.tsx` | Current dashboard page — will gain a "View Analytics" link; stat cards pattern to reuse |
| `packages/frontend/src/features/dashboard/cost-summary.tsx` | Current cost widget using Recharts AreaChart — pattern for new chart components |
| `packages/frontend/src/components/sidebar.tsx` | Navigation — add Analytics nav item at line 43 between Activity Feed and Chat |

---

## 10. Design Decisions

1. **Dedicated page + dashboard link, not embedded-only.** Analytics charts need space — cramming them into dashboard widgets limits usefulness. A dedicated `/analytics` page gives room for 6+ visualizations with proper sizing. The dashboard keeps its summary role with a link to the deep dive.

2. **Recharts for all charts — no new library.** Already used in cost-summary.tsx and costs-section.tsx. Covers line, bar, area, pie. The heatmap is the only chart that needs a custom component (CSS Grid), which is simpler than adding a second library.

3. **Time range in URL query params for shareability.** `?range=7d&persona=ps-abc` makes analytics views bookmarkable and shareable via URL. This is more useful than local state and costs nothing.

4. **Drill-down via modal, not navigation.** Clicking a chart data point opens a modal with matching executions, not a full page navigation. This keeps the user's chart context visible and allows quick back-and-forth. "View Detail" in the modal does navigate to Agent Monitor for the full execution view.

5. **Workflow bottlenecks deferred to Phase 2.** This chart requires the audit log DB migration from RES.ANALYTICS.METRICS Phase 2. The other 5 chart types work with the existing executions table data and can ship in Phase 1.
