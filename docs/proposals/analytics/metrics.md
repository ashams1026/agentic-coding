# Agent Analytics: Metrics Collection & Storage

> Research document for **RES.ANALYTICS.METRICS**. Design only — no implementation tasks.

---

## 1. Current State Audit

### What Data Exists Today

AgentOps already captures significant execution data, but it's spread across different storage mechanisms with no unified analytics layer.

#### Executions Table (`schema.ts:142-159`)

Each execution records:

| Column | Type | Analytics Use |
|--------|------|---------------|
| `costUsd` | integer (cents) | Cost tracking — stored as cents, divide by 100 for USD |
| `durationMs` | integer | Performance tracking |
| `outcome` | text ("success" / "failure" / "rejected") | Success rate |
| `status` | text ("pending" / "running" / "completed" / "failed" / "cancelled") | Execution lifecycle |
| `personaId` | text (FK) | Per-persona breakdown |
| `workItemId` | text (FK → workItems → projectId) | Per-project breakdown |
| `startedAt` | timestamp_ms | Time-range queries |
| `completedAt` | timestamp_ms | Duration calculation |
| `summary` | text | Result classification |
| `parentExecutionId` | text | Subagent tracking |

#### Audit Log (`audit.ts:14-15`)

File-based NDJSON log at `~/.agentops/logs/audit.log`. Events:

| Action | Fields | Analytics Use |
|--------|--------|---------------|
| `state_transition` | workItemId, fromState, toState, actor, actorType | Workflow step timing, bottleneck detection |
| `agent_dispatch` | workItemId, executionId, personaId, personaName | Dispatch frequency |
| `agent_complete` | workItemId, executionId, personaName, outcome, costUsd, durationMs | Redundant with executions table — completion stats |
| `cost_event` | workItemId, executionId, costUsd, actor | Incremental cost tracking |
| `tool_use` | executionId, toolName, durationMs, success, command | Tool call frequency and performance |
| `session_start` | executionId, personaName, model, workItemId | Model usage tracking |
| `session_end` | executionId, reason, durationMs | Session lifecycle |

#### Dashboard API (`dashboard.ts:28-177`)

Three existing endpoints that compute metrics on-the-fly:

| Endpoint | Returns | Computation |
|----------|---------|-------------|
| `GET /api/dashboard/stats` | activeAgents, pendingProposals, needsAttention, todayCostUsd | Loads ALL executions + work items + proposals, filters in memory |
| `GET /api/dashboard/cost-summary` | dailySpend (7 days), monthTotal, monthCap | Loads ALL executions, groups by date in memory |
| `GET /api/dashboard/execution-stats` | totalRuns, totalCostUsd, successRate, averageDurationMs | Loads ALL completed executions, aggregates in memory |

#### Chat Messages (`chat.ts:418-419`)

Pico chat messages store `costUsd` and `durationMs` in their `metadata` JSON column. This is per-message, not per-session.

### What's Missing

1. **No token counts** — the executions table stores cost and duration but NOT input/output/cache token counts. The SDK `result` message provides `total_cost_usd` and `duration_ms` but the executor only maps these two fields (`claude-executor.ts:180-181`). Token counts from the SDK (`input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_write_tokens`) are not captured.

2. **No per-execution tool call counts** — tool usage is logged to the audit file but not aggregated per-execution. The `tool_use` audit entry has executionId, but to get "this execution made 47 tool calls", you'd have to parse the entire audit log.

3. **No files-modified count** — the `FileChanged` hook exists (`claude-executor.ts:603`) but the count isn't stored on the execution record.

4. **No retry count per execution** — retry events are logged (`claude-executor.ts:170-173`) but the count isn't persisted.

5. **No workflow step timing** — state transitions are in the audit log but there's no easy way to compute "average time in 'In Progress' state."

6. **Dashboard queries are O(n)** — every dashboard request loads ALL rows and aggregates in JavaScript. This will degrade at scale.

---

## 2. Per-Execution Metrics

### What to Capture

| Metric | Source | Storage | Priority |
|--------|--------|---------|----------|
| **Duration** | `result.duration_ms` | Already on executions table (`durationMs`) | Exists |
| **Cost (USD)** | `result.total_cost_usd` | Already on executions table (`costUsd`, in cents) | Exists |
| **Outcome** | Success/failure/rejected | Already on executions table (`outcome`) | Exists |
| **Input tokens** | `result.input_tokens` (SDK) | **New**: add column or token_usage table | P0 |
| **Output tokens** | `result.output_tokens` (SDK) | **New**: add column or token_usage table | P0 |
| **Cache read tokens** | `result.cache_read_input_tokens` (SDK) | **New** | P1 |
| **Cache write tokens** | `result.cache_creation_input_tokens` (SDK) | **New** | P1 |
| **Model** | `persona.model` at dispatch time | **New**: add `model` column to executions (the persona's model may change after execution) | P0 |
| **Tool calls count** | Count of `tool_use` audit entries per execution | **New**: increment counter per execution in memory, persist on completion | P1 |
| **Files modified** | Count of `FileChanged` hook invocations | **New**: increment counter per execution in memory, persist on completion | P2 |
| **Retry count** | Count of `retry` events per execution | **New**: increment counter, persist | P2 |

### SDK Result Message Fields

The SDK's `result` message (type `"result"`, subtype `"success"`) includes these fields that we currently ignore:

```typescript
// From the SDK — msg.type === "result" && msg.subtype === "success"
{
  total_cost_usd: number;      // ✅ Already captured
  duration_ms: number;         // ✅ Already captured
  result: string;              // ✅ Already captured (as summary)
  structured_output: unknown;  // ✅ Already captured
  // Token fields — NOT currently captured:
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
  num_turns: number;
}
```

### Recommendation: Extend Executions Table

Add columns directly to the `executions` table rather than creating a separate `token_usage` table:

```sql
ALTER TABLE executions ADD COLUMN model TEXT;
ALTER TABLE executions ADD COLUMN input_tokens INTEGER DEFAULT 0;
ALTER TABLE executions ADD COLUMN output_tokens INTEGER DEFAULT 0;
ALTER TABLE executions ADD COLUMN cache_read_tokens INTEGER DEFAULT 0;
ALTER TABLE executions ADD COLUMN cache_write_tokens INTEGER DEFAULT 0;
ALTER TABLE executions ADD COLUMN num_turns INTEGER DEFAULT 0;
ALTER TABLE executions ADD COLUMN tool_call_count INTEGER DEFAULT 0;
ALTER TABLE executions ADD COLUMN files_modified_count INTEGER DEFAULT 0;
```

Rationale: one row per execution, no joins needed for analytics queries. The executions table is the natural home for per-execution metrics. A separate table adds join overhead and complexity for minimal benefit.

---

## 3. Per-Persona Metrics

### Derived Metrics

All per-persona metrics are derived from the executions table grouped by `personaId`:

| Metric | SQL | Notes |
|--------|-----|-------|
| **Success rate** | `COUNT(outcome='success') / COUNT(*)` | Only count completed executions |
| **Average cost** | `AVG(costUsd)` | In cents, divide by 100 for display |
| **Average duration** | `AVG(durationMs)` | Format as human-readable |
| **Total cost** | `SUM(costUsd)` | Over a time range |
| **Tasks completed** | `COUNT(DISTINCT workItemId) WHERE outcome='success'` | Unique work items, not execution count |
| **Failure rate by type** | Group by `outcome` | success/failure/rejected breakdown |
| **Average tool calls** | `AVG(tool_call_count)` | After adding the column |
| **Most common failure modes** | Parse `summary` or `rejectionPayload.reason` for patterns | Requires text analysis — defer |

### Persona Leaderboard

A "leaderboard" view showing personas ranked by effectiveness:

| Persona | Runs | Success | Avg Cost | Avg Duration | Total Cost |
|---------|------|---------|----------|--------------|------------|
| Engineer | 145 | 87% | $0.42 | 3m 12s | $60.90 |
| Code Reviewer | 89 | 94% | $0.15 | 1m 05s | $13.35 |
| Tech Lead | 32 | 91% | $0.68 | 4m 30s | $21.76 |
| Router | 198 | 99% | $0.02 | 8s | $3.96 |

This is pure SQL aggregation — no materialization needed for small-to-medium datasets.

---

## 4. Per-Project Metrics

### Derived Metrics

Per-project metrics join executions → workItems → projects:

| Metric | Derivation | Notes |
|--------|------------|-------|
| **Total spend** | `SUM(executions.costUsd) WHERE workItems.projectId = ?` | Already computed in dashboard.ts cost-summary |
| **Active agents** | `COUNT(executions WHERE status='running')` | Already in dashboard.ts stats |
| **Throughput** | `COUNT(DISTINCT workItemId WHERE outcome='success')` per day/week | Work items completed over time |
| **Backlog burn-down** | Track `COUNT(workItems WHERE currentState != 'Done')` over time | Requires snapshot or event-sourced approach — complex |
| **Cost per work item** | `SUM(costUsd) / COUNT(DISTINCT workItemId)` | Average cost to resolve a work item (may span multiple executions) |

### Backlog Burn-Down Challenge

Burn-down requires point-in-time snapshots of "how many items were open." Two approaches:

1. **Event-sourced** — derive from `state_transition` audit entries. Replay transitions to reconstruct historical counts. Accurate but requires parsing the entire audit log.

2. **Periodic snapshots** — a scheduled task records `{ date, projectId, openCount, doneCount }` daily. Simple, fast to query, but only as granular as the snapshot frequency.

**Recommendation:** Defer burn-down to Phase 2. The other metrics are directly queryable from existing tables.

---

## 5. Per-Workflow Metrics

### Step Timing

To compute "average time spent in each workflow state", we need to track when a work item enters and exits each state.

**Current state:** The audit log has `state_transition` events with timestamps, `fromState`, and `toState`. By pairing consecutive transitions for the same workItemId, we can compute time-in-state:

```
state_transition: wi-abc, Planning → Decomposition, 2026-04-01T10:00Z
state_transition: wi-abc, Decomposition → Ready, 2026-04-01T10:15Z
→ Time in Decomposition = 15 minutes
```

**Problem:** The audit log is a flat file parsed line-by-line. Computing averages across thousands of work items requires parsing the entire log. This is not suitable for a real-time dashboard.

### Bottleneck Identification

Which workflow step takes the longest on average? Which step has the highest rejection rate?

| Step | Avg Time | Rejection Rate | Throughput |
|------|----------|---------------|------------|
| Planning | 2h 15m | 5% | 12/week |
| Decomposition | 45m | 3% | 11/week |
| In Progress | 4h 30m | 18% | 10/week |
| In Review | 1h 10m | 25% | 9/week |

**Rejection rate per step:** Computed from executions where `outcome = 'rejected'` joined with the work item's `currentState` at the time of execution. But the current schema doesn't record which state the work item was in when the execution ran — only the current state.

### Recommendation: Add `workflowState` to Executions

Add a column to record which workflow state the work item was in when this execution was dispatched:

```sql
ALTER TABLE executions ADD COLUMN workflow_state TEXT;
```

Populated at dispatch time from `workItem.currentState`. This enables:
- Per-state execution stats (success rate, cost, duration)
- Per-state rejection rate
- Workflow bottleneck identification

For time-in-state, migrate audit log data to a DB table (see section 6).

---

## 6. Collection Strategy

### Option A: Derive at Query Time (Current Approach)

The dashboard already does this — load rows, aggregate in JavaScript.

| Pros | Cons |
|------|------|
| No new tables or migration | O(n) per query — scans all rows |
| Always up-to-date | Gets slow at scale |
| Simple | Can't do complex cross-table analytics |

### Option B: Dedicated Metrics/Summary Tables

Pre-compute and store aggregated metrics:

```typescript
// Daily rollup — one row per (date, projectId, personaId)
interface DailyMetrics {
  date: string;           // "2026-04-01"
  projectId: string;
  personaId: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  rejectedCount: number;
  totalCostCents: number;
  totalDurationMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalToolCalls: number;
}
```

Populated by a background rollup task that runs after each execution completes (or on a timer).

| Pros | Cons |
|------|------|
| O(1) per dashboard query (read pre-computed row) | Extra table, migration, rollup logic |
| Scales to millions of executions | Slight delay between execution and metrics |
| Enables time-series charts easily | Must handle rollup failures gracefully |

### Option C: Hybrid — Query Time Now, Rollup Later

Start with Option A (extend current approach with new columns), add Option B rollup tables when performance degrades.

| Pros | Cons |
|------|------|
| No premature optimization | Must refactor later |
| Ships faster | Performance ceiling |

### Performance Threshold Analysis

SQLite aggregation performance on a typical machine:

| Row Count | `SELECT COUNT, SUM, AVG GROUP BY` | Acceptable? |
|-----------|-----------------------------------|-------------|
| 1,000 | <10ms | Yes |
| 10,000 | ~50ms | Yes |
| 50,000 | ~200ms | Marginal |
| 100,000 | ~500ms | No — UI feels sluggish |

A typical AgentOps instance might generate:
- 10-50 executions/day (active development)
- ~300-1,500/month
- At 1 year: ~3,600-18,000 executions

**Verdict:** On-the-fly aggregation will be fine for 1-2 years for most users. Rollup tables are a Phase 2 optimization.

### Recommendation: Option C (Hybrid)

**Phase 1:** Extend the executions table with new metric columns (tokens, model, tool_call_count). Modify the existing dashboard.ts queries to use SQL aggregation instead of JavaScript in-memory aggregation. Add indexed columns for common query patterns.

**Phase 2:** If performance degrades (>200ms for dashboard queries), add a `daily_metrics` rollup table populated after each execution completes.

### Migrating Audit Log to DB

The file-based audit log should eventually move to a DB table for analytics:

```sql
CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,  -- timestamp_ms
  action TEXT NOT NULL,        -- state_transition, tool_use, etc.
  executionId TEXT,
  workItemId TEXT,
  personaId TEXT,
  data TEXT NOT NULL,          -- JSON payload
  FOREIGN KEY (executionId) REFERENCES executions(id)
);
CREATE INDEX idx_audit_execution ON audit_events(executionId);
CREATE INDEX idx_audit_action ON audit_events(action);
CREATE INDEX idx_audit_timestamp ON audit_events(timestamp);
```

This enables:
- SQL-based tool call analytics (`SELECT toolName, COUNT(*) FROM audit_events WHERE action='tool_use' GROUP BY toolName`)
- Workflow step timing (pair `state_transition` events by workItemId)
- Per-execution event timeline

**Phase:** This is a Phase 2 migration. Phase 1 keeps the file-based audit log but adds the new columns to the executions table.

---

## 7. Indexing Strategy

### Current Indexes

The executions table has only the primary key index (`id`). For analytics queries, add:

```sql
-- Time-range queries (cost summary, trend charts)
CREATE INDEX idx_exec_started ON executions(started_at);

-- Per-project filtering (dashboard queries)
CREATE INDEX idx_exec_work_item ON executions(work_item_id);

-- Per-persona grouping
CREATE INDEX idx_exec_persona ON executions(persona_id);

-- Status filtering (active agents count)
CREATE INDEX idx_exec_status ON executions(status);

-- Composite: time-range + status (most common dashboard query pattern)
CREATE INDEX idx_exec_started_status ON executions(started_at, status);
```

These indexes will significantly improve the dashboard queries that currently do full table scans.

---

## 8. Implementation Phases

### Phase 1: Extend Existing Data (Low-Medium Effort)

**Goal:** Capture missing metrics and improve query performance.

Tasks:
- Add columns to executions: `model`, `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_write_tokens`, `num_turns`, `tool_call_count`, `files_modified_count`, `workflow_state`
- Modify `claude-executor.ts` to extract token counts from SDK `result` message
- Track tool_call_count and files_modified_count as in-memory counters during execution, persist on completion
- Populate `workflow_state` from work item's `currentState` at dispatch time
- Populate `model` from persona's model at dispatch time
- Add SQL indexes for common query patterns
- Refactor dashboard.ts to use SQL aggregation instead of in-memory

### Phase 2: Rollup Tables + Audit Migration (Medium Effort)

**Goal:** Scale analytics and enable complex queries.

Tasks:
- Create `daily_metrics` rollup table
- Background task to compute daily rollups after each execution
- Migrate audit log to `audit_events` DB table
- Add workflow step timing queries (pair state transitions)
- Add backlog burn-down snapshots

### Phase 3: Advanced Analytics (Higher Effort)

**Goal:** Predictive and comparative analytics.

Tasks:
- Failure pattern classification (parse rejection reasons, group common failure modes)
- Cost prediction (estimate cost before execution based on historical data)
- A/B comparison (compare persona A vs persona B on similar tasks)
- Anomaly detection (flag executions with unusual cost/duration)

---

## 9. Cross-References

| Document | Relationship |
|----------|-------------|
| `docs/proposals/analytics/ux-design.md` (future — RES.ANALYTICS.UX) | This doc defines what metrics to collect; the UX doc defines how to display them |
| `docs/proposals/token-usage/tracking.md` (future — RES.TOKENS.TRACKING) | Token tracking is a subset of the metrics defined here; the two docs should align on storage schema |
| `docs/proposals/token-usage/dashboard-ux.md` (future — RES.TOKENS.DASHBOARD) | Token dashboard is a specialized view of the metrics collected here |
| `docs/proposals/scheduling/infrastructure.md` | Scheduled executions generate metrics too — ensure scheduleId is queryable for schedule-specific analytics |
| `packages/backend/src/routes/dashboard.ts` | Current dashboard API — will be the primary consumer of analytics data; needs refactoring from in-memory to SQL aggregation |
| `packages/backend/src/audit.ts` | Current file-based audit log — Phase 2 migration target |

---

## 10. Design Decisions

1. **Extend executions table, don't create a separate token_usage table.** One row per execution keeps queries simple (no joins). The 8 new columns add negligible storage overhead per row. A separate table is warranted only if we need per-turn granularity — deferred to RES.TOKENS.TRACKING.

2. **On-the-fly aggregation for Phase 1, rollup tables for Phase 2.** At <20,000 executions, SQLite aggregation is fast enough. Premature optimization with rollup tables adds complexity for no visible benefit. Add rollup when dashboard queries exceed 200ms.

3. **Capture `model` and `workflow_state` at execution time, not from current persona/work item state.** Personas and work items change over time. The model used for execution #42 should be the model configured when #42 ran, not the current persona config. Same for workflow state.

4. **File-based audit log stays for Phase 1.** Moving to a DB table is desirable but not blocking for Phase 1 analytics. The new execution-level columns capture the most important metrics. Audit log migration is Phase 2.

5. **No per-turn token tracking in Phase 1.** Tracking tokens per assistant turn within an execution would require a child table with one row per turn. The storage overhead and query complexity aren't justified until users specifically ask for "where in this execution did the cost come from?" — that's a drill-down feature for RES.TOKENS.TRACKING.
