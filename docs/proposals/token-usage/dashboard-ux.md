# Aggregated Token Usage Dashboard UX

> Research proposal for **RES.TOKENS.DASHBOARD**. Design only — no implementation tasks.

---

## 1. Dashboard Location

### Options

| Option | Pros | Cons |
|--------|------|------|
| **A. Dedicated "Usage" page** (`/usage`) | Full space, clear purpose | Yet another nav item (sidebar already has 7 items at sidebar.tsx:38-46) |
| **B. Tab within Analytics** (`/analytics?tab=usage`) | Shares time range controls, consistent with analytics UX, single nav item | Must wait for `/analytics` page to be built (RES.ANALYTICS.UX) |
| **C. Section within Settings** | Near cost cap config (costs-section.tsx) | Buried, not discoverable, Settings is for configuration not analysis |
| **D. Widgets on main Dashboard** | Zero-click discovery | Dashboard is already crowded (4 stat cards + 3 widgets at dashboard.tsx:68-105) |

### Recommendation: Option B (Tab within Analytics)

**Primary:** Token usage is a specialized view within the broader analytics surface. RES.ANALYTICS.UX already proposes a dedicated `/analytics` page (sidebar nav item between Activity Feed and Chat) with time range controls, summary cards, and Recharts charts. Token usage should be a **tab** within that page:

```
Analytics   [Overview] [Token Usage]     [24h] [7d] [30d] [90d] [Custom]
```

The "Overview" tab shows the general analytics (cost over time, execution outcomes, persona leaderboard — as designed in RES.ANALYTICS.UX). The "Token Usage" tab shows the token-specific views designed in this document.

**Why not a separate page:**
1. Avoids adding an 8th sidebar nav item (sidebar.tsx:38-46 already has 7)
2. Shares the time range selector component — no duplicate implementation
3. Token usage is a lens on the same execution data that analytics displays
4. URL-based tab state (`?tab=usage`) is bookmarkable and shareable

**Relationship to RES.ANALYTICS.UX:** The analytics UX proposal (Section 9) already anticipates this: "Token usage dashboard is a specialized view within or linked from analytics; should share time range controls and visual style." This proposal delivers on that forward reference.

**Fallback if Analytics page is delayed:** If the `/analytics` page hasn't been built yet, implement the token usage dashboard as a standalone page at `/usage` with its own time range controls. When `/analytics` ships, migrate it as a tab. The chart components will be identical either way.

---

## 2. Key Views

### 2.1 Usage Over Time (Line Chart)

Recharts `LineChart` showing daily token consumption and cost:

```
┌─────────────────────────────────────────────────────────────────┐
│ Usage Over Time                                                  │
│                                                                  │
│ Tokens ▲                                                         │
│  80K   │        ╭─╮                                              │
│  60K   │   ╭─╮  │ │  ╭─╮                                        │
│  40K   │╭─╮│ │╭─╯ ╰─╮│ │╭─╮                                    │
│  20K   ││ ╰╯ ╰╯     ╰╯ ╰╯ │                                    │
│   0K   │╰───────────────────╯                                    │
│         Mon  Tue  Wed  Thu  Fri  Sat  Sun                        │
│                                                                  │
│ ── Tokens (left axis)   -- Cost (right axis)                     │
└─────────────────────────────────────────────────────────────────┘
```

- **X-axis:** Date (hourly for 24h, daily for 7d/30d, weekly for 90d)
- **Left Y-axis:** Total tokens (integer, K/M formatting)
- **Right Y-axis:** Cost in USD (dual-axis via Recharts `YAxis yAxisId`)
- **Two lines:** Tokens (solid blue), Cost (dashed green)
- **Tooltip:** Date, tokens, cost, executions count
- **Data source:** `totalTokens` and `costUsd` columns on `executions` table (from RES.TOKENS.TRACKING Phase 1)

**Limitation:** Until RES.TOKENS.TRACKING Phase 1 adds the `totalTokens` column, only cost is available. Show cost-only with a note: "Token counts available after schema migration."

### 2.2 Breakdown by Model (Pie/Donut Chart)

Recharts `PieChart` showing cost and token distribution by model:

```
┌─────────────────────────────────────┐
│ Cost by Model                        │
│                                      │
│         ╭────────╮                   │
│        ╱ Opus 4  ╲                   │
│       │  $98.50   │  ● Opus 4 — 66% │
│       │  (66%)    │  ● Sonnet — 28% │
│        ╲ ╱───╲   ╱  ● Haiku — 6%   │
│         ╰─────╰─╯                    │
│                                      │
│ [Cost ▾]  Switch: Cost / Tokens      │
└─────────────────────────────────────┘
```

- **Segments:** One per model (Opus, Sonnet, Haiku — potentially others)
- **Toggle:** Switch between cost view and token count view
- **Tooltip:** Model name, cost in USD, token count, percentage of total
- **Legend:** Colored dots with model name and percentage
- **Data source:** `model` column on executions (from RES.TOKENS.TRACKING Phase 1). Requires `model` to be persisted — without it, this chart cannot render. Show placeholder: "Model tracking not yet enabled."

### 2.3 Breakdown by Persona (Horizontal Bar Chart)

Recharts `BarChart` (layout="vertical") — same component style as RES.ANALYTICS.UX Section 4.4:

```
┌─────────────────────────────────────────────────────────┐
│ Usage by Persona                                         │
│                                                          │
│ Engineer     ████████████████████████████  $60.90 (41%)  │
│ Code Review  ████████████                 $28.50 (19%)  │
│ Router       ██████████                   $22.30 (15%)  │
│ Planner      ████████                     $18.70 (13%)  │
│ Tester       █████                        $12.40  (8%)  │
│ Other        ██                            $6.10  (4%)  │
│                                                          │
│ [Cost ▾]  Switch: Cost / Tokens / Executions             │
└─────────────────────────────────────────────────────────┘
```

- **Y-axis:** Persona name (via `executions.personaId` FK → `personas.name`)
- **X-axis:** Cost or tokens (switchable)
- **Toggle:** Cost (USD), Tokens (count), Executions (count)
- **Tooltip:** Persona name, value, percentage, execution count, avg cost per execution
- **Click:** Filter all charts to that persona (filter chip pattern from RES.ANALYTICS.UX Section 5)
- **Data source:** JOIN `executions` to `personas` on `personaId`, GROUP BY persona

### 2.4 Breakdown by Project (Horizontal Bar Chart)

Same component pattern as 2.3 but grouped by project:

```
┌─────────────────────────────────────────────────────────┐
│ Usage by Project                                         │
│                                                          │
│ AgentOps     ████████████████████████████  $98.20 (66%)  │
│ Side Project ████████████                 $32.50 (22%)  │
│ Playground   █████                        $18.20 (12%)  │
│                                                          │
│ [Cost ▾]  Switch: Cost / Tokens / Executions             │
└─────────────────────────────────────────────────────────┘
```

- **Data source:** `executions` → `workItems.projectId` → `projects.name`. This requires a JOIN through `workItems`. Note from RES.TOKENS.TRACKING Section 5: "No direct `projectId` on executions for efficient queries." The JOIN via `workItemId` → `projectId` works but is slightly less efficient. For projected volumes (<10K executions), this is acceptable.

### 2.5 Top N Most Expensive Executions (Table)

shadcn/ui `Table` — sortable, paginated, matching the Persona Leaderboard pattern from RES.ANALYTICS.UX Section 4.5:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Most Expensive Executions                                [Top 10 ▾]   │
│                                                                        │
│ ID        │ Persona    │ Work Item            │ Cost    │ Tokens  │ Duration │
│ ex-a8k2f  │ Engineer   │ Add sidebar comp...  │ $2.89   │ 42.3K   │ 8m 12s   │
│ ex-b9k3g  │ Engineer   │ Fix responsive...    │ $1.52   │ 28.1K   │ 5m 45s   │
│ ex-c7m2p  │ Planner    │ Decompose Sprint 8   │ $1.21   │ 22.4K   │ 4m 30s   │
│ ex-d4n1q  │ Code Review│ Review PR #42        │ $0.98   │ 18.9K   │ 3m 15s   │
│ ...                                                                    │
│                                                                        │
│ Showing 1-10 of 342 executions                    [< Prev] [Next >]   │
└────────────────────────────────────────────────────────────────────────┘
```

- **Columns:** Execution ID (link to Agent Monitor), Persona, Work Item (title, link to detail), Cost (USD), Tokens (formatted with K/M), Duration, Model, Outcome
- **Sorting:** Default by cost descending. Click column header to sort by any column.
- **Pagination:** 10 rows per page (configurable: 10/25/50)
- **Top N selector:** Quick filter for Top 10 / Top 25 / All
- **Row click:** Navigate to execution detail in Agent Monitor (`/agents?execution=:id`)
- **Data source:** `SELECT * FROM executions WHERE startedAt >= ? ORDER BY costUsd DESC LIMIT ?`

---

## 3. Time Range Controls

### Shared with Analytics Page

The token usage tab inherits the time range selector from the analytics page header (RES.ANALYTICS.UX Section 3):

```
Analytics   [Overview] [Token Usage]     [24h] [7d] [30d] [90d] [Custom ▾]     vs Previous Period ☐
```

| Preset | Range | Aggregation Granularity |
|--------|-------|------------------------|
| **24h** | Last 24 hours | Hourly buckets |
| **7d** | Last 7 days | Daily buckets (default) |
| **30d** | Last 30 days | Daily buckets |
| **90d** | Last 90 days | Weekly buckets |
| **Custom** | User-picked start + end dates | Auto-select based on span |

### Time Range State

Stored as URL query params for shareability: `?tab=usage&range=7d` or `?tab=usage&start=2026-03-01&end=2026-03-31`.

The analytics page manages `range` state and passes it down to all tab content components. The token usage tab receives `{ startDate: Date, endDate: Date }` as props and uses them for all queries.

### Comparison Mode

When "vs Previous Period" is toggled on:
- Summary cards show delta arrows (e.g., "42.3K tokens ↑18% vs prior 7 days")
- Usage Over Time chart overlays the comparison period as a dashed line
- Model/persona/project breakdowns show change indicators

**Implementation:** API endpoints accept `compareStartDate`/`compareEndDate` as optional params. The frontend renders both datasets on the same chart.

---

## 4. Summary Cards

Four cards at the top of the token usage tab:

```
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│ Total Cost          │ │ Total Tokens        │ │ Avg Cost / Exec    │ │ Executions          │
│                     │ │                     │ │                     │ │                     │
│ $148.90             │ │ 842.3K              │ │ $0.44               │ │ 342                 │
│ ↑12% vs prior       │ │ ↑18% vs prior       │ │ ↓3% vs prior        │ │ ↑8% vs prior        │
└────────────────────┘ └────────────────────┘ └────────────────────┘ └────────────────────┘
```

| Card | Value | Source | Notes |
|------|-------|--------|-------|
| **Total Cost** | `$148.90` | `SUM(costUsd) / 100` from executions | Already available today |
| **Total Tokens** | `842.3K` | `SUM(totalTokens)` from executions | Requires RES.TOKENS.TRACKING Phase 1 `totalTokens` column |
| **Avg Cost / Exec** | `$0.44` | Total cost / execution count | Already available |
| **Executions** | `342` | `COUNT(*)` from executions in range | Already available |

### Delta Calculation

Delta compares the selected range to the immediately prior period of equal length:
- 7d selected → compare with prior 7 days
- 30d selected → compare with prior 30 days
- Custom range (10 days) → compare with the 10 days before the start date

Delta arrows: green for cost ↓ or tokens ↓ (efficiency improvement), red for ↑, gray for < 1% change.

### Formatting

| Value Range | Format | Example |
|-------------|--------|---------|
| < 1,000 tokens | Plain number | `842` |
| 1,000 - 999,999 | K with 1 decimal | `842.3K` |
| ≥ 1,000,000 | M with 1 decimal | `1.2M` |
| Cost < $0.01 | `< $0.01` | |
| Cost < $1 | 2 decimal places | `$0.44` |
| Cost ≥ $1 | 2 decimal places | `$148.90` |

---

## 5. Real-Time vs Batch Aggregation

### Query Performance Analysis

All token usage queries aggregate from the `executions` table. Per RES.DATA.GROWTH projections:

| Time Period | Executions (est.) | Query Type | Expected Performance |
|-------------|-------------------|------------|---------------------|
| 1 month | 600 | `SUM/COUNT/GROUP BY` | < 1ms |
| 3 months | 1,800 | `SUM/COUNT/GROUP BY` | < 5ms |
| 1 year | 7,300 | `SUM/COUNT/GROUP BY` | < 10ms |
| 3 years | 22,000 | `SUM/COUNT/GROUP BY` | < 30ms |

**SQLite aggregate performance:** better-sqlite3 is synchronous and runs in the Node.js thread. For the projected volumes, a single `SELECT SUM(costUsd), SUM(totalTokens), COUNT(*) FROM executions WHERE startedAt >= ? AND startedAt <= ?` query with an index on `startedAt` returns in under 10ms for 10K rows. Adding `GROUP BY model` or `GROUP BY personaId` for breakdown charts adds negligible overhead.

### Recommendation: On-the-Fly Aggregation (No Pre-Computed Tables)

**Phase 1: On-the-fly aggregation from the executions table.**

Rationale:
1. **Projected volumes are small.** 7,300 executions/year — SQLite can aggregate these in <10ms, well under the 100ms target for interactive dashboards.
2. **No write overhead.** Pre-computed summary tables require triggers or background jobs to update on every execution completion. This adds complexity for no user-visible benefit.
3. **Simpler queries.** Direct aggregation from the source table is easy to understand, debug, and extend.
4. **Consistent with existing pattern.** The current dashboard endpoints (dashboard.ts:28-117) already aggregate on-the-fly, loading all executions and filtering in JavaScript. SQL-level aggregation with WHERE clauses will be **faster** than the current approach.

**When to add pre-computed summaries (not recommended for Phase 1):**
- If the executions table exceeds 100K rows (unlikely for local-first, ~14 years at current projection)
- If aggregate queries exceed 100ms (would require performance monitoring — see RES.DATA.GROWTH slow query logging)
- If the dashboard needs sub-second real-time updates during active executions (current polling at 30s is sufficient)

### Required Index

The `executions` table needs an index on `startedAt` for efficient time-range queries:

```sql
CREATE INDEX idx_executions_started_at ON executions(started_at);
```

Current state: no index exists on `startedAt` (schema.ts:142-159 defines columns but no indexes on this table). Without this index, every time-range query does a full table scan. At 7K rows this is <50ms, but adding the index makes it <1ms.

**Optional composite index** for model/persona breakdowns:

```sql
CREATE INDEX idx_executions_started_model ON executions(started_at, model);
CREATE INDEX idx_executions_started_persona ON executions(started_at, persona_id);
```

These are optional for Phase 1 — the single `startedAt` index is sufficient. Add composite indexes if breakdown queries become slow.

### API Endpoints

Token usage queries should be new endpoints (not modifications to existing dashboard endpoints, to avoid breaking the dashboard):

| Endpoint | Returns | Query |
|----------|---------|-------|
| `GET /api/analytics/usage-summary` | `{ totalCost, totalTokens, avgCost, executionCount, deltas }` | `SUM/COUNT/AVG` on executions in range |
| `GET /api/analytics/usage-trend` | `[{ date, cost, tokens, executions }]` | `GROUP BY date(startedAt)` |
| `GET /api/analytics/usage-by-model` | `[{ model, cost, tokens, executions }]` | `GROUP BY model` |
| `GET /api/analytics/usage-by-persona` | `[{ personaId, personaName, cost, tokens, executions }]` | `JOIN personas, GROUP BY personaId` |
| `GET /api/analytics/usage-by-project` | `[{ projectId, projectName, cost, tokens, executions }]` | `JOIN workItems → projects, GROUP BY projectId` |
| `GET /api/analytics/top-executions` | `[{ id, persona, workItem, cost, tokens, duration, model, outcome }]` | `ORDER BY costUsd DESC LIMIT N` |

All endpoints accept: `projectId?`, `startDate`, `endDate`, `compareStartDate?`, `compareEndDate?`.

### Improvement Over Current Pattern

The existing dashboard endpoints (dashboard.ts:28-117) load ALL executions into memory and filter in JavaScript:

```typescript
// Current pattern — loads everything
let allExecutions = await db.select().from(executions);
allExecutions = allExecutions.filter((e) => workItemIds.has(e.workItemId));
```

The new analytics endpoints should use SQL-level filtering and aggregation:

```typescript
// Proposed pattern — aggregates in SQL
const result = await db.select({
  totalCost: sql`SUM(cost_usd)`,
  totalTokens: sql`SUM(total_tokens)`,
  count: sql`COUNT(*)`,
}).from(executions)
  .where(and(
    gte(executions.startedAt, startDate),
    lte(executions.startedAt, endDate),
    projectId ? eq(workItems.projectId, projectId) : undefined,
  ));
```

This is both faster (SQL does the aggregation) and uses less memory (returns a single row, not all execution objects).

---

## 6. Export

### CSV Export

Download button in the token usage tab header:

```
Token Usage                                          [⬇ Export CSV]
```

#### CSV Format

```csv
execution_id,persona,work_item,project,model,started_at,duration_ms,cost_usd,total_tokens,tool_uses,outcome
ex-a8k2f,Engineer,wi-abc123,AgentOps,claude-sonnet-4-5-20250514,2026-04-01T14:30:00Z,252000,0.42,12340,8,success
ex-b9k3g,Code Reviewer,wi-def456,AgentOps,claude-haiku-4-5-20251001,2026-04-01T15:10:00Z,65000,0.08,3210,3,success
```

**Columns:**
| Column | Source | Notes |
|--------|--------|-------|
| `execution_id` | `executions.id` | |
| `persona` | `personas.name` via FK | Human-readable name, not ID |
| `work_item` | `executions.workItemId` | |
| `project` | `projects.name` via FK chain | |
| `model` | `executions.model` | Requires RES.TOKENS.TRACKING |
| `started_at` | `executions.startedAt` | ISO 8601 format |
| `duration_ms` | `executions.durationMs` | |
| `cost_usd` | `executions.costUsd / 100` | Converted from cents to USD |
| `total_tokens` | `executions.totalTokens` | Requires RES.TOKENS.TRACKING |
| `tool_uses` | `executions.toolUses` | Requires RES.TOKENS.TRACKING |
| `outcome` | `executions.outcome` | success/failure/rejected |

#### Export Behavior

- Exports all executions matching the current time range and any active filters (persona, project)
- Filename: `agentops-usage-{range}-{date}.csv` (e.g., `agentops-usage-7d-2026-04-01.csv`)
- Generated server-side via `GET /api/analytics/export?format=csv&startDate=...&endDate=...`
- Server streams the response with `Content-Type: text/csv` and `Content-Disposition: attachment`
- **No pagination** — exports the full dataset for the range (at 7K executions/year, the CSV is ~500KB)

#### JSON Export (Phase 2)

Same data as CSV but as a JSON array. Useful for programmatic consumption:

```json
[
  {
    "executionId": "ex-a8k2f",
    "persona": "Engineer",
    "model": "claude-sonnet-4-5-20250514",
    "startedAt": "2026-04-01T14:30:00Z",
    "costUsd": 0.42,
    "totalTokens": 12340,
    "outcome": "success"
  }
]
```

Endpoint: `GET /api/analytics/export?format=json&startDate=...&endDate=...`

---

## 7. Component Architecture

### Component Tree

```
AnalyticsPage
├── TimeRangeSelector              (shared — from RES.ANALYTICS.UX)
├── TabBar [Overview | Token Usage]
│
└── TokenUsageTab
    ├── UsageSummaryCards           (4 stat cards with deltas)
    ├── UsageOverTimeChart          (Recharts LineChart, dual Y-axis)
    ├── div.grid.grid-cols-2
    │   ├── ModelBreakdownChart     (Recharts PieChart/donut)
    │   └── PersonaBreakdownChart   (Recharts BarChart vertical)
    ├── ProjectBreakdownChart       (Recharts BarChart vertical)
    └── TopExecutionsTable          (shadcn/ui Table, sortable + paginated)
```

### Responsive Layout

| Viewport | Layout |
|----------|--------|
| **≥1280px** | 2-column grid: model pie + persona bar side-by-side |
| **768-1279px** | Single column, all charts stack |
| **<768px** | Summary cards in 2x2 grid, simplified charts (fewer data points, no dual axis) |

### Reusable Components

Several components from the token usage tab are reusable across the analytics Overview tab:

| Component | Reused In |
|-----------|-----------|
| `UsageSummaryCards` | Analytics Overview (different metrics, same card pattern) |
| `PersonaBreakdownChart` | Analytics "Cost by Persona" (Section 4.4 of RES.ANALYTICS.UX) |
| `TopExecutionsTable` | Analytics drill-down modal (Section 5 of RES.ANALYTICS.UX) |
| `TimeRangeSelector` | Both tabs |

These should be built as generic, configurable components in `features/analytics/components/` rather than token-usage-specific.

---

## 8. Data Dependencies

### Phase 1 (Available Today)

These views work with existing `executions` table columns:

| View | Data Source | Available? |
|------|-----------|------------|
| Summary: Total Cost | `SUM(costUsd)` | Yes — costUsd exists (schema.ts:149) |
| Summary: Avg Cost | `SUM(costUsd) / COUNT(*)` | Yes |
| Summary: Execution Count | `COUNT(*)` | Yes |
| Usage Over Time (cost only) | `GROUP BY date(startedAt)` | Yes |
| By Persona (cost only) | `GROUP BY personaId` | Yes |
| By Project (cost only) | `JOIN workItems, GROUP BY projectId` | Yes |
| Top N Executions | `ORDER BY costUsd DESC` | Yes |

### Phase 1.5 (After RES.TOKENS.TRACKING Phase 1)

These require the 3 new columns (`model`, `totalTokens`, `toolUses`):

| View | Data Source | Requires |
|------|-----------|----------|
| Summary: Total Tokens | `SUM(totalTokens)` | `totalTokens` column |
| Usage Over Time (tokens) | `GROUP BY date(startedAt)` | `totalTokens` column |
| By Model | `GROUP BY model` | `model` column |
| By Persona (tokens) | `GROUP BY personaId` | `totalTokens` column |
| By Project (tokens) | `GROUP BY projectId` | `totalTokens` column |
| Export: tokens + model columns | Raw select | `totalTokens`, `model`, `toolUses` columns |

### Graceful Degradation

Charts that require unavailable data should show a placeholder rather than being hidden:

```
┌─────────────────────────────────────┐
│ Cost by Model                        │
│                                      │
│   ℹ Model tracking not yet enabled.  │
│   Run the schema migration to see    │
│   cost breakdown by model.           │
│                                      │
└─────────────────────────────────────┘
```

This approach:
- Communicates what's possible (motivates running the migration)
- Doesn't break the layout (placeholder maintains the chart's grid position)
- Doesn't confuse users (clear explanation, not an error state)

---

## 9. Cross-References

| Document | Relationship |
|----------|-------------|
| `docs/proposals/token-usage/tracking.md` (RES.TOKENS.TRACKING) | Defines the data collection and storage schema this dashboard consumes. Phase 1 adds `model`, `totalTokens`, `toolUses` columns. Unit standardization (cents) affects how we display cost. |
| `docs/proposals/analytics/ux-design.md` (RES.ANALYTICS.UX) | Defines the `/analytics` page where token usage lives as a tab. Shares time range controls, chart style, component patterns (summary cards, horizontal bars, tables). |
| `docs/proposals/analytics/metrics.md` (RES.ANALYTICS.METRICS) | Defines the broader metrics collection strategy. Token usage is a subset of analytics metrics. Execution table schema at :142-159. |
| `docs/proposals/data-management/growth-strategy.md` (RES.DATA.GROWTH) | SQLite scaling analysis confirms on-the-fly aggregation is viable at projected volumes (<10K executions, <50ms queries). |
| `packages/backend/src/routes/dashboard.ts` | Existing dashboard endpoints (lines 28-117) that load all executions in memory. New analytics endpoints should use SQL-level aggregation instead. |
| `packages/frontend/src/features/dashboard/cost-summary.tsx` | Existing Recharts AreaChart pattern for cost visualization. Token usage charts follow the same Recharts + ResponsiveContainer + custom Tooltip pattern. |
| `packages/frontend/src/features/settings/costs-section.tsx` | Existing Recharts BarChart for 7-day cost. Token usage extends this with time range controls and model/persona breakdowns. |
| `packages/frontend/src/features/agent-monitor/agent-history.tsx` | StatsBar component (lines 138-177) with Runs/Cost/Success%/Duration pattern. Token usage summary cards follow the same stat-card pattern. |
| `packages/frontend/src/components/sidebar.tsx` | Navigation items (lines 38-46). Analytics page adds one nav item; token usage is a tab within it, not a separate item. |

---

## 10. Design Decisions

1. **Tab within Analytics, not a separate page.** Token usage is one lens on execution data — the same data that Analytics visualizes for outcomes, durations, and personas. A separate `/usage` page would duplicate time range controls, create a navigation decision ("is my cost question an analytics question or a usage question?"), and add a sidebar item to an already 7-item nav. A tab within `/analytics` shares infrastructure and keeps the mental model simple.

2. **On-the-fly SQL aggregation, not pre-computed summaries.** SQLite handles `SUM/COUNT/GROUP BY` on 10K rows in <10ms. Pre-computed summary tables add write-time overhead (triggers or background jobs), schema complexity, and consistency concerns — all for zero user-visible benefit at projected volumes. The existing dashboard pattern of loading all executions into JavaScript and filtering in memory is actually the performance bottleneck to fix; SQL-level aggregation is the improvement, not materialized views.

3. **Dual-axis line chart for tokens + cost over time.** Tokens and cost correlate but have different scales (thousands of tokens vs dollars). A dual-axis chart lets users see both trends together. The alternative — two separate line charts — wastes vertical space and makes correlation harder to spot. Recharts supports dual Y-axes via `yAxisId`.

4. **Cost/Tokens/Executions toggle on breakdown charts rather than separate charts.** Three charts (one per metric) would triple the page length for minimal insight. A toggle lets users switch views on the same chart, comparing the same personas/models across different metrics. This is the common pattern in analytics dashboards (e.g., Google Analytics).

5. **Graceful degradation for missing columns rather than hiding charts.** When `totalTokens` or `model` columns don't exist yet, showing a placeholder with explanation is better than hiding the chart entirely. Users who haven't run the schema migration won't know what they're missing if the chart is hidden. A placeholder both communicates the capability and motivates upgrading.

6. **Server-side CSV export, not client-side generation.** The server has direct DB access and can stream large result sets efficiently. Client-side export would require loading all execution objects into memory, then converting to CSV in the browser — wasteful and slow for large datasets. Server streaming with `Content-Disposition: attachment` is the standard pattern and handles 10K+ rows without memory issues.
