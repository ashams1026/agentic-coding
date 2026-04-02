# Per-Execution Token Usage Collection and Storage

> Research proposal for capturing, storing, and surfacing token usage data across all SDK query sites in Woof.

---

## 1. What Data to Capture

### SDK Result Message Fields

The Claude Agent SDK `result` message (mapped at `claude-executor.ts:174-191`) currently provides:

| Field | Type | Currently Captured? | Where Stored |
|-------|------|--------------------|--------------| 
| `total_cost_usd` | number (USD) | Yes | `executions.costUsd` (cents, line 520), `chatMessages.metadata.costUsd` (USD, line 418) |
| `duration_ms` | number | Yes | `executions.durationMs` (line 521), `chatMessages.metadata.durationMs` (line 419) |
| `structured_output` | object | Yes | `executions.structuredOutput` (line 526) |

### SDK Progress Events (Streaming)

Progress events (`task_progress` subtype, mapped at `claude-executor.ts:153-163`) provide mid-execution usage:

| Field | Type | Currently Captured? | Where |
|-------|------|--------------------|----|
| `usage.total_tokens` | number | Yes — broadcast as WS event | `progress.totalTokens` (line 160), not persisted to DB |
| `usage.tool_uses` | number | Yes — broadcast as WS event | `progress.toolUses` (line 161), not persisted to DB |
| `usage.duration_ms` | number | Yes — broadcast as WS event | `progress.durationMs` (line 162), not persisted to DB |

### What's Missing

The SDK result message provides `total_cost_usd` but does **not** expose a granular token breakdown (input_tokens, output_tokens, cache_read_tokens, cache_write_tokens) in the final result. The progress events provide `total_tokens` but not the per-category split.

**Token breakdown availability:**
- The Anthropic Messages API returns `usage.input_tokens`, `usage.output_tokens`, `usage.cache_creation_input_tokens`, `usage.cache_read_input_tokens` per response
- The Claude Agent SDK aggregates these internally and exposes only `total_cost_usd` in the result and `total_tokens` in progress events
- **To get per-category tokens:** We would need to either (a) sum token counts from individual API responses via a hook, or (b) derive them from `total_cost_usd` and model pricing (lossy approximation)

### Recommended Data to Capture

| Field | Source | Priority | Notes |
|-------|--------|----------|-------|
| `costUsd` | SDK result `total_cost_usd` | P0 — already captured | Fix unit inconsistency (cents vs USD) |
| `durationMs` | SDK result `duration_ms` | P0 — already captured | |
| `totalTokens` | SDK progress `usage.total_tokens` | P0 — capture from last progress event | Currently broadcast but not persisted |
| `toolUses` | SDK progress `usage.tool_uses` | P1 | Currently broadcast but not persisted |
| `model` | Persona config at execution time | P0 | Not currently stored on execution |
| `inputTokens` | Derive from hook or API if available | P2 — deferred | SDK doesn't expose in result |
| `outputTokens` | Derive from hook or API if available | P2 — deferred | SDK doesn't expose in result |
| `cacheReadTokens` | Derive from hook if available | P3 — deferred | Requires SDK enhancement |
| `cacheWriteTokens` | Derive from hook if available | P3 — deferred | Requires SDK enhancement |

---

## 2. Storage Schema

### Option A: Additional Columns on `executions` Table (Recommended)

Add columns to the existing `executions` table:

```sql
ALTER TABLE executions ADD COLUMN model TEXT;           -- persona model at execution time
ALTER TABLE executions ADD COLUMN total_tokens INTEGER; -- from last progress event
ALTER TABLE executions ADD COLUMN tool_uses INTEGER;    -- from last progress event
```

**Why additional columns, not a new table:**
1. **1:1 relationship** — every execution has exactly one token usage record. A separate table adds a JOIN for no benefit.
2. **Query simplicity** — cost/token queries already filter on `executions` (by project, persona, date). Adding columns keeps these as single-table queries.
3. **Existing pattern** — `costUsd` and `durationMs` are already on the executions table. Adding `totalTokens`, `toolUses`, `model` is the natural extension.

### Option B: Dedicated `execution_token_usage` Table (Deferred)

If per-category token data becomes available (SDK enhancement):

```sql
CREATE TABLE execution_token_usage (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES executions(id),
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd INTEGER NOT NULL DEFAULT 0,    -- in cents, consistent with executions
  created_at INTEGER NOT NULL             -- timestamp_ms
);

CREATE INDEX idx_token_usage_execution ON execution_token_usage(execution_id);
CREATE INDEX idx_token_usage_date ON execution_token_usage(created_at);
```

**When to use:** Only if we need per-turn granularity (multiple rows per execution) or per-category token splits. For now, Option A is sufficient.

### Unit Consistency Fix

**Current inconsistency:**
- `executions.costUsd` — stored in **cents** (`Math.round(finalCostUsd * 100)`, execution-manager.ts:520)
- `chatMessages.metadata.costUsd` — stored in **USD** (`metadata.costUsd = msg.total_cost_usd`, chat.ts:418)
- Dashboard endpoint — converts cents → USD before returning (dashboard.ts:75, :93)

**Fix:** Standardize on **cents** everywhere:
1. `executions.costUsd` — already cents ✓
2. `chatMessages.metadata.costUsd` — change to `Math.round(msg.total_cost_usd * 100)` in chat.ts
3. Dashboard — already converts correctly ✓
4. Document the convention: "All cost values in the DB are in cents (integer). Divide by 100 for display."

---

## 3. Collection Points

### Audit of All `query()` Call Sites

| File | Line | Purpose | Captures Cost? | Captures Tokens? | Gap |
|------|------|---------|---------------|-------------------|-----|
| `claude-executor.ts` | 556 | Agent execution | Yes (costUsd, durationMs) | No (totalTokens from progress events broadcast but not persisted) | **Persist totalTokens and model** |
| `chat.ts` | 352 | Pico chat message | Yes (metadata.costUsd, USD not cents) | No | **Fix unit, persist totalTokens** |
| `memory.ts` | 184 | Haiku summarizer (consolidation) | No | No | **Add cost tracking** |
| `memory.ts` | 348 | Haiku summarizer (generation) | No | No | **Add cost tracking** |
| `executions.ts` | 238 | File rewind (temporary session) | No | No | **Add cost tracking** (minor — rewind is cheap) |
| `sdk.ts` | (discovery) | Capability discovery | No | No | OK — discovery is one-time, negligible cost |

### Gaps to Fix

**High priority:**
1. **Persist `totalTokens` from progress events.** The execution manager already receives progress events (line 153-163 in executor). Track the last `totalTokens` value and persist it alongside `costUsd` in the final DB update.
2. **Persist `model` on executions.** The persona's model is known at dispatch time but not stored on the execution row. Add `model` column — essential for cost-by-model analysis.
3. **Fix chat cost units.** Change `metadata.costUsd` in chat.ts to store cents, consistent with executions.

**Medium priority:**
4. **Track memory.ts costs.** The Haiku summarizer runs `query()` twice per memory operation. These costs are invisible today. Add a utility function `trackBackgroundCost(costUsd, model, source)` that accumulates background operation costs into a project-level counter or dedicated table.

**Low priority:**
5. **Track rewind cost.** The file rewind operation creates a temporary query session. The cost is small (a single API call) but should be tracked for completeness.

### Collection Implementation

For the primary path (agent execution), capture tokens from the last progress event:

```typescript
// In execution-manager.ts, track during event loop
let lastTotalTokens = 0;
let lastToolUses = 0;

for await (const event of stream) {
  if (event.type === "progress") {
    lastTotalTokens = event.totalTokens;
    lastToolUses = event.toolUses;
  }
  // ... existing event handling
}

// In the final DB update (line 515-526)
await db.update(executions).set({
  // ... existing fields
  model: persona.model,        // NEW
  totalTokens: lastTotalTokens, // NEW
  toolUses: lastToolUses,       // NEW
});
```

For background operations (memory.ts), wrap the `query()` call to capture cost:

```typescript
// After draining the query() stream, extract cost from result event
// Accumulate into a project-level background_costs counter
```

---

## 4. Per-Turn Granularity

### Trade-off Analysis

| Approach | Storage per Execution | Query Complexity | Use Case |
|----------|----------------------|-----------------|----------|
| **Execution total only** | 3 integers (totalTokens, toolUses, model) | Simple — one row per execution | Sufficient for: cost-per-execution, cost-per-persona, daily/monthly totals |
| **Per-turn (per assistant message)** | ~10 rows per execution (one per SDK turn) | JOIN to execution_token_usage table | Needed for: understanding which turn was expensive, debugging context growth |
| **Per-API-call** | ~50+ rows per execution | Complex — requires SDK hook | Needed for: cache hit analysis, prompt optimization |

### Recommendation: Execution Total (Phase 1), Per-Turn (Phase 2 if needed)

**Phase 1:** Store only the execution total. This covers all the dashboard use cases:
- Total spend per day/week/month
- Cost breakdown by model, persona, project
- Top N most expensive executions
- Average cost per execution

**Phase 2 (if needed):** If users need per-turn insight (e.g., "why did this execution cost $2 when most cost $0.50?"), add a `execution_token_usage` table with one row per SDK turn. Each turn would need a PostToolUse or PostMessage hook to capture the incremental usage. This is complex and high-storage — only implement if Phase 1 analytics surface demand.

**Decision driver:** The SDK's progress events already provide running `total_tokens` — the final value is the execution total. Per-turn data would require intercepting every assistant message, which the SDK doesn't currently expose as a clean hook point.

---

## 5. Relationship to Existing Data

### What's Already Captured

| Data Point | Where | Format | Accessible? |
|-----------|-------|--------|-------------|
| Execution cost | `executions.costUsd` (schema.ts:149) | Integer (cents) | Yes — used by dashboard cost summary |
| Execution duration | `executions.durationMs` (schema.ts:150) | Integer (ms) | Yes — used by execution detail |
| Chat message cost | `chatMessages.metadata.costUsd` (chat.ts:418) | Float (USD) | Partially — stored in JSON, not easily queryable |
| Chat message duration | `chatMessages.metadata.durationMs` (chat.ts:419) | Integer (ms) | Partially — stored in JSON |
| Streaming token count | WS `progress` events (executor.ts:160) | Integer | No — ephemeral, not persisted |
| Streaming tool uses | WS `progress` events (executor.ts:161) | Integer | No — ephemeral, not persisted |
| Cost summary | `/api/dashboard/cost-summary` endpoint | Aggregated USD | Yes — powers dashboard |
| DB stats | `/api/settings/db-stats` (settings.ts:117) | Size, counts | Yes — powers settings |

### Gaps Summary

1. **No token counts persisted** — only cost in USD/cents. Can't answer "how many tokens did my agents use?"
2. **No model stored on executions** — can't break down cost by model without joining to personas (which may have changed since the execution)
3. **Background operation costs invisible** — memory.ts Haiku calls (~$0.001-0.01 each) are untracked
4. **Chat costs not queryable** — stored in JSON `metadata`, can't aggregate without parsing every row
5. **No cost-per-project breakdown** — executions have `workItemId` → `projectId` FK chain, but no direct `projectId` on executions for efficient queries

---

## 6. Implementation Approach

### Phase 1: Core Token Tracking (3-4 tasks)

1. **Schema migration:** Add `model` (text), `total_tokens` (integer), `tool_uses` (integer) columns to `executions` table
2. **Executor capture:** Persist `lastTotalTokens`, `lastToolUses`, `persona.model` in execution-manager.ts final DB update
3. **Chat cost fix:** Standardize chat metadata to cents; add totalTokens to chat metadata
4. **Cost summary enhancement:** Update `/api/dashboard/cost-summary` to include token counts and model breakdown

### Phase 2: Background Cost Tracking (2-3 tasks)

5. **Memory cost tracking:** Wrap memory.ts `query()` calls to capture and accumulate cost
6. **Background costs table/counter:** Store non-execution costs (summarization, rewind) with source attribution
7. **Rewind cost tracking:** Capture cost from executions.ts rewind session

### Phase 3: Per-Turn Granularity (2-3 tasks, if needed)

8. **execution_token_usage table:** Per-turn token data if SDK exposes per-message hooks
9. **Turn-level UI:** Cost breakdown per turn in execution detail view
10. **Cache analysis:** Input/output/cache token splits (requires SDK enhancement)

---

## 7. Cross-References

- **RES.ANALYTICS.METRICS** (`docs/proposals/analytics/metrics.md`) — Per-execution/persona/project metrics rely on the token data captured here; cost trend queries
- **RES.ANALYTICS.UX** (`docs/proposals/analytics/ux-design.md`) — Analytics dashboard visualizations consume the data stored by this system
- **RES.TOKENS.DASHBOARD** (pending) — The aggregated dashboard UX proposal depends on the storage schema designed here
- **RES.DATA.GROWTH** (`docs/proposals/data-management/growth-strategy.md`) — Token columns add minimal storage (~12 bytes per execution); log truncation must preserve cost/token data
- **RES.RECOVERY.AGENTS** (`docs/proposals/error-recovery/agent-recovery.md`) — Structured ExecutionError includes cost tracking for failed executions; partial cost for crashed runs
- **Claude Executor** (`packages/backend/src/agent/claude-executor.ts`) — Result mapping at lines 174-191, progress events at lines 153-163
- **Execution Manager** (`packages/backend/src/agent/execution-manager.ts`) — Cost persistence at lines 520-521, event loop at lines 496-508
- **Chat routes** (`packages/backend/src/routes/chat.ts`) — Cost in metadata at lines 418-419 (USD, inconsistent)

---

## 8. Design Decisions

1. **Additional columns on `executions` over a new table.** Token usage is 1:1 with executions. A separate table adds a JOIN for zero benefit. The existing pattern (costUsd, durationMs already on executions) makes adding totalTokens, toolUses, model the natural extension.

2. **Execution-total granularity over per-turn.** The SDK exposes `total_tokens` in progress events but not per-turn token splits. Capturing the final total covers all dashboard use cases (spend by model, persona, project, time). Per-turn data would require SDK hooks that don't exist yet and adds significant storage overhead (~10x rows).

3. **Cents as the canonical unit.** Floating-point USD causes rounding errors in aggregation. Integer cents are precise, sortable, and summing 10,000 cent values is exact. The inconsistency between executions (cents) and chat (USD) must be fixed — standardize on cents everywhere.

4. **Background cost tracking as a separate concern.** Memory summarization and file rewind are background operations with small, predictable costs. Rather than overcomplicating the execution tracking path, accumulate these into a dedicated counter or table. They're important for total spend accuracy but not for per-execution analysis.

5. **Model stored at execution time, not derived from persona.** A persona's model can be changed by the user after an execution completes. Storing the model on the execution row captures the actual model used, not the current persona config. Essential for accurate cost-by-model analysis.

6. **Token data survives log truncation.** Per RES.DATA.GROWTH, old execution logs should be truncated but metadata preserved. The token/cost columns (totalTokens, toolUses, costUsd, durationMs, model) are explicitly in the "keep" set — they're only 12 bytes per row vs 100KB+ of logs.
