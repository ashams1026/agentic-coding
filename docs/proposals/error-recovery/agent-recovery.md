# Agent Error Handling and Recovery Patterns

> Research proposal for systematic agent error handling, retry policies, and graceful recovery in Woof.

---

## 1. Current Failure Modes

### Audit of Existing Error Handling

The backend has **defensive** error handling (fail-safe DB updates, graceful shutdown) but is **non-resilient** (no application-level retries, no circuit breakers, no fallback behaviors).

#### Execution Manager (`execution-manager.ts`)

| Mechanism | Location | Behavior |
|-----------|----------|----------|
| Outer try-catch | Line 678 | Wraps `runExecutionStream()`. On any error: status → "failed", outcome → "failure", logs appended with "FATAL:" message |
| Max rejections | Line 75, `MAX_REJECTIONS = 3` | After 3 rejections, work item forced to "Blocked" state via `handleRejection()` (line 227) |
| Loop detection | Line 76, `LOOP_HISTORY_SIZE = 6` | Tracks last 6 states per work item; 3+ repeated states → forces "Blocked" (line 597) |
| Rate limiter | Line 74, `MAX_TRANSITIONS_PER_HOUR = 10` | Blocks further routing if 10+ transitions in 1 hour (line 649); posts system comment explaining cooldown |
| Dequeue on complete | Line 579, `onComplete()` | Processes queued tasks; failures in dequeue logged but don't block the queue |

**What happens when an agent crashes mid-execution:**
1. SDK `query()` async generator throws an exception
2. Caught by outer try-catch (line 678)
3. Execution status set to "failed", outcome "failure"
4. `agent_completed` WS event broadcast with `outcome: "failure"`
5. Work item state is **unchanged** — it stays in whatever workflow state it was in (e.g., "InProgress")
6. Concurrency slot freed via `onComplete()` dequeue
7. No automatic retry — the work item sits in its current state until manually re-triggered or the next dispatch cycle

**Gap: Work item left in limbo.** A failed execution leaves the work item in "InProgress" (or wherever the agent was working). There's no automatic state rollback to the previous state, and no indication to the user that re-dispatch is needed unless they check execution history.

#### Claude Executor (`claude-executor.ts`)

| Error Source | Handling |
|-------------|----------|
| SDK `query()` crash | Top-level try-catch (line 672) yields error event; no retry |
| Rate limit (`api_retry`) | SDK retries internally; emits `rate_limit` event with `attempt`, `max_retries`, `retry_delay_ms`, `error_status` (lines 164-173) |
| No API key | Yields error event immediately (lines 477-481) |
| Sandbox violation | Pre-tool-use hook denies the call (lines 199-220); execution continues |
| File checkpointing | Enabled (`enableFileCheckpointing: true`, line 564); first assistant message captures `checkpointMessageId` (lines 655-661) |
| Process death | Async generator throws; caught by manager's outer try-catch |

**Key insight:** The SDK handles its own retries for transient API errors (rate limits, 5xx). Application-level retry should only handle failures that survive SDK retries (crashes, persistent errors, budget exhaustion).

#### Startup Recovery (`start.ts`)

| Function | Line | Behavior |
|----------|------|----------|
| `recoverOrphanedState()` | 38 | Finds executions with status "running" or "pending" (line 49); bulk-updates to "failed" with summary "Interrupted by server restart" (line 74-88) |
| Shutdown | 156-197 | Calls `server.close()`, `closeAllClients()`, waits up to `SHUTDOWN_TIMEOUT_MS = 30000` (line 15) for active executions to drain |

**Gap: No resume.** Orphaned executions are marked failed, never retried. The user must manually re-dispatch. No notification is sent about recovered orphans (only a log message).

#### Concurrency (`concurrency.ts`)

- `canSpawn()` (line 46): checks active count vs `DEFAULT_MAX_CONCURRENT = 3` (line 12)
- `enqueue()` (line 76): priority-ordered FIFO queue
- `checkMonthlyCost()` (line 143): blocks execution if monthly cost cap exceeded
- **Gap:** If executor crashes before calling `onComplete()`, the concurrency slot is never freed. Only fixed by server restart (orphan recovery clears in-memory state).

#### Dispatch/Router

- `dispatchForState()` (`dispatch.ts`, line 23): No try-catch — errors propagate to the route handler
- `runRouter()` (`router.ts`): Calls `executionManager.runExecution()`. If router execution fails, no retry. Falls through silently if auto-routing disabled.
- **Gap:** Dispatch errors are not caught or reported systematically. A DB error in dispatch silently prevents the work item from progressing.

---

## 2. Automatic Retry

### Failure Classification

| Category | Examples | Retryable? | Strategy |
|----------|----------|------------|----------|
| **Transient API** | Rate limit (429), server error (500/502/503) | Yes — SDK handles | SDK internal retry with exponential backoff. No application action needed. |
| **Timeout** | Execution exceeds persona budget, SDK process hangs | Yes (once) | Application retry with same persona, increased budget or timeout. Mark as `timed_out` not `failed`. |
| **Budget exceeded** | Monthly cost cap hit | No — wait for reset | Block dispatch, notify user. `checkMonthlyCost()` already handles this. |
| **Configuration error** | Invalid prompt, unknown tool, missing API key | No — terminal | Mark `failed` with clear error category. Require user fix before retry. |
| **Process crash** | SDK child process dies, OOM, SIGKILL | Yes (once) | Application retry with same config. If crashes twice, mark as terminal. |
| **Permission denied** | Sandbox blocks required tool | No — terminal | Mark `failed`. Show which tool was blocked and suggest persona/sandbox config change. |
| **Rejection loop** | Agent output rejected 3+ times | No — escalate | Current `MAX_REJECTIONS = 3` → Blocked. Correct behavior. |

### Retry Policy Design

```typescript
interface RetryPolicy {
  maxRetries: number;          // 0 = no retry, 1 = one retry, etc.
  retryableErrors: ErrorCategory[];  // which categories trigger retry
  backoffMs: number;           // delay before retry (fixed, not exponential — we're retrying whole executions)
  upgradeModel: boolean;       // try a more capable model on retry (e.g., sonnet → opus)
  notifyOnRetry: boolean;      // send notification on retry attempt
}

type ErrorCategory =
  | "timeout"
  | "process_crash"
  | "rate_limit_exhausted"  // SDK retries exhausted, still failing
  | "transient_error";       // 5xx that survived SDK retries

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 1,
  retryableErrors: ["timeout", "process_crash", "transient_error"],
  backoffMs: 5000,
  upgradeModel: false,
  notifyOnRetry: true,
};
```

**Where retry lives:** In `ExecutionManager.onComplete()` (line 579). After an execution fails:
1. Check if the error category is retryable
2. Check if retry count < `maxRetries`
3. If yes: schedule retry after `backoffMs` delay, increment retry count on the execution
4. If no: mark as terminal failure, broadcast `agent_completed` with final outcome

**Configuration scope:** Retry policy is per-persona (stored in `PersonaSettings`) with a project-level default. Allows aggressive retries for cheap personas (Haiku) and conservative for expensive ones (Opus).

**Model upgrade on retry:** Optional. If `upgradeModel: true` and the persona uses sonnet, retry with opus. This handles cases where the task is too complex for the assigned model. Only applies to the retry — the persona's default model is restored after.

### Execution Status Extension

Current statuses: `pending`, `running`, `completed`, `failed`.

Proposed additions:

| Status | Meaning |
|--------|---------|
| `retrying` | Retry scheduled, waiting for backoff delay |
| `timed_out` | Distinguished from `failed` — was running too long |
| `interrupted` | Server shutdown during execution (currently lumped into `failed`) |

And a new `retryCount` column on the `executions` table (integer, default 0). Links to the original execution via `parentExecutionId` (already exists on the schema for subagents — reuse for retries).

---

## 3. Graceful Shutdown

### Current Behavior (Adequate)

The existing shutdown flow (`start.ts:156-197`) is well-designed:
1. Stop accepting new connections (`server.close()`)
2. Close all WS clients (`closeAllClients()`)
3. Wait up to 30s for active executions to drain
4. Close SDK session, close DB
5. On timeout: log warning, exit anyway

### Proposed Enhancement: Interrupt + Checkpoint

Instead of waiting for executions to complete (which may take minutes for complex agent tasks):

1. **Signal interruption:** Call SDK's interrupt mechanism on all active executions. The SDK supports aborting `query()` via AbortController — add this to the executor.
2. **Preserve checkpoint:** Since `enableFileCheckpointing: true` is already active, the execution has a `checkpointMessageId`. On interrupt, save this to the execution record before marking it `interrupted`.
3. **Resume on restart:** After `recoverOrphanedState()`, check interrupted executions that have a `checkpointMessageId`. Offer to resume from checkpoint (Phase 2 — requires SDK resume support from `rewindFiles()`).

### Orphan Detection Enhancement

Current `recoverOrphanedState()` marks all "running"/"pending" executions as "failed". Enhance:

1. **Distinguish interrupted vs crashed:** If the execution has a recent event (within the last 30s of shutdown), mark as `interrupted` (clean shutdown). If the last event was much older, mark as `failed` (crash).
2. **Notify user:** After recovery, if any executions were reset, create a system notification (ties into RES.NOTIFY.UX): "3 executions were interrupted by server restart. [View details]"
3. **Auto-retry orphans:** If the interrupted execution's persona has retry enabled, automatically schedule a retry instead of just marking failed.

---

## 4. Stuck Execution Detection

### Watchdog Design

A periodic check that identifies executions with no activity:

```typescript
interface WatchdogConfig {
  checkIntervalMs: number;     // how often to check (default: 60_000 — every minute)
  stuckThresholdMs: number;    // no events for this long = stuck (default: 300_000 — 5 minutes)
  action: "warn" | "timeout";  // warn = notify user, timeout = force-stop
}
```

**Implementation:** A `setInterval` in the execution manager that:
1. Iterates all "running" executions
2. Checks the timestamp of the most recent event (from WS broadcast log or a `lastActivityAt` field)
3. If `now - lastActivityAt > stuckThresholdMs`:
   - If action = "warn": broadcast a `execution_update` WS event with status "possibly_stuck", create a system comment, send notification
   - If action = "timeout": interrupt the execution, mark as `timed_out`, run retry policy

**Per-persona thresholds:** Different personas have different expected execution times. The Router makes quick decisions (threshold: 2 minutes). The Engineer may run long builds (threshold: 10 minutes). Store threshold in `PersonaSettings`.

**What a "stuck" execution looks like today:** The SDK process is alive but not producing events — e.g., waiting for a hung API call, an infinite loop in a tool, or a network partition. The user sees a frozen Agent Monitor with no new output. There's no indication that anything is wrong.

---

## 5. Partial Results

### What Happens Today

When an agent fails partway through:
1. Files the agent already modified are **left in place** on disk — no rollback
2. The execution is marked "failed" in the DB
3. The work item stays in its current workflow state
4. The `checkpointMessageId` is saved (if the agent produced at least one message)
5. No diff preview showing what changed

### Proposed Approach: Keep + Warn (Default), Rollback Optional

| Strategy | When to Use | Implementation |
|----------|-------------|---------------|
| **Keep partial changes** (default) | Most cases — partial work is valuable. An agent that wrote 3 of 5 files saved real work. | Current behavior. Add a "Partial changes" badge on the execution detail. |
| **Auto-rollback** | Destructive failures (agent deleted critical files, wrote corrupted output). User opt-in per persona. | Use `rewindFiles(checkpointMessageId)` from the SDK. Already implemented as `POST /api/executions/:id/rewind`. |
| **User decides** | When partial changes are ambiguous. Show the changed files and let the user cherry-pick. | Dry-run rewind to get file list, show dialog (already exists in Agent Monitor's RewindButton component). |

**Connection to RES.ROLLBACK:** The rollback proposal (`docs/proposals/rollback/design.md`) covers the UI for this. The error recovery system's role is to:
1. Detect that partial changes exist (check if `checkpointMessageId` is set)
2. Surface a "Partial changes — review or rewind?" prompt in the execution detail
3. If auto-rollback is enabled for the persona, call rewind automatically before marking as failed

### File Conflict Detection

If a user (or another agent) modifies files between the failed execution and a retry:

1. Before retry: check if any files in the checkpoint's diff have been modified since the execution started (compare mtimes)
2. If conflicts exist: warn user, don't auto-retry. Show conflicting files in a dialog.
3. If no conflicts: safe to retry or rollback.

This reuses the conflict detection proposed in RES.ROLLBACK (mtime comparison + execution history cross-reference).

---

## 6. Error Reporting

### Structured Error Categories

Replace the current generic "failed" outcome with structured error data:

```typescript
interface ExecutionError {
  category: ErrorCategory;
  message: string;           // human-readable description
  details?: {
    sdkError?: string;       // raw SDK error message
    toolName?: string;       // which tool caused the failure
    httpStatus?: number;     // API status code if applicable
    retryAttempt?: number;   // which retry this was
    filesModified?: string[]; // files changed before failure
  };
}

type ErrorCategory =
  | "timeout"              // execution exceeded time/budget limit
  | "rate_limit"           // API rate limit (survived SDK retries)
  | "sdk_error"            // SDK process crash or unexpected error
  | "permission_denied"    // sandbox blocked a required operation
  | "budget_exceeded"      // per-execution or monthly budget hit
  | "configuration_error"  // invalid prompt, missing API key, unknown tool
  | "rejection_limit"      // MAX_REJECTIONS reached
  | "loop_detected"        // repeated state transitions detected
  | "interrupted"          // server shutdown during execution
  | "unknown";             // catch-all
```

**Storage:** Add an `error` column (JSON) to the `executions` table, populated on failure. The existing `outcome` column ("success" | "failure" | "rejected") stays for quick filtering; `error` provides detail.

### UI Error Display

**Execution Detail Panel:**
- Error category badge (color-coded: red for terminal, amber for retryable)
- Error message in a callout/alert component
- "Details" expandable section with SDK error, tool name, modified files
- "Retry" button (if retryable and retry policy allows)
- "Rewind changes" button (if `checkpointMessageId` exists)

**Agent Monitor:**
- Error events render as red-bordered terminal blocks with the category icon
- Stuck execution warning renders as amber banner: "No activity for 5 minutes. [Force stop] [Keep waiting]"

**Dashboard:**
- Error trend widget: failures per day/week, grouped by category
- Top failing personas (ties into RES.ANALYTICS.METRICS)

### Aggregate Error Trends

For RES.ANALYTICS integration, track error data over time:

| Metric | Query | Value |
|--------|-------|-------|
| Failure rate | `COUNT(failed) / COUNT(*)` per time period | % |
| Failures by category | `GROUP BY error->>'category'` | count per category |
| Mean time to failure | `AVG(completedAt - startedAt) WHERE outcome = 'failure'` | ms |
| Retry success rate | `COUNT(retried AND succeeded) / COUNT(retried)` | % |
| Top failing personas | `GROUP BY personaId WHERE outcome = 'failure'` | ranked list |

These can be computed ad-hoc from the `executions` table — no pre-aggregation needed at projected volumes (see RES.ANALYTICS.METRICS for scaling analysis).

---

## 7. Implementation Approach

### Phase 1: Error Classification + Reporting (3-4 tasks)

1. **Schema:** Add `error` (JSON) and `retryCount` (integer) columns to `executions`. Add `timed_out` and `interrupted` to execution status enum.
2. **Error classification:** In `ExecutionManager`'s catch block, classify errors into `ErrorCategory`. Populate the `error` column.
3. **Orphan enhancement:** Distinguish `interrupted` vs `failed` in `recoverOrphanedState()`. Add system notification for recovered orphans.
4. **UI:** Error category badges in execution detail, Agent Monitor error rendering.

### Phase 2: Retry + Watchdog (3-4 tasks)

5. **Retry policy:** `RetryPolicy` on `PersonaSettings`. Retry logic in `onComplete()` with backoff delay.
6. **Watchdog:** `setInterval` stuck detection with per-persona thresholds. WS event for "possibly stuck."
7. **Partial results:** "Review partial changes" prompt on failed executions with checkpoints.

### Phase 3: Advanced Recovery (2-3 tasks)

8. **Interrupt on shutdown:** AbortController integration for clean execution interruption.
9. **Auto-rollback:** Per-persona option to rewind on failure. Conflict detection before retry.
10. **Resume from checkpoint:** If SDK adds resume support, auto-resume interrupted executions.

---

## 8. Cross-References

- **RES.ROLLBACK** (`docs/proposals/rollback/design.md`) — File rewind on failure; conflict detection; `POST /api/executions/:id/rewind` endpoint already exists
- **RES.ANALYTICS.METRICS** (`docs/proposals/analytics/metrics.md`) — Error trend tracking; failure rate per persona/project; MTBF
- **RES.NOTIFY.UX** (`docs/proposals/notifications/ux-design.md`) — Notifications for: execution failure (high priority), stuck detection (high), orphan recovery (medium), retry attempt (low)
- **RES.SCHED.INFRA** (`docs/proposals/scheduling/infrastructure.md`) — Scheduled executions need the same retry policy; `consecutiveFailures` auto-disable concept aligns with circuit breaker
- **RES.COLLAB.COORD** (`docs/proposals/agent-collaboration/coordination.md`) — Escalation policy (retry chain: same → upgrade model → different persona → human) overlaps with retry's `upgradeModel`
- **Concurrency Manager** (`packages/backend/src/agent/concurrency.ts`) — Slot cleanup on crash; queue management after retry
- **Claude Executor** (`packages/backend/src/agent/claude-executor.ts`) — SDK error types, `enableFileCheckpointing`, `checkpointMessageId` capture

---

## 9. Design Decisions

1. **Application-level retry only for failures that survive SDK retries.** The SDK already handles transient API errors (429, 5xx) with exponential backoff. Adding another retry layer on top would cause redundant retries. Application retry targets: process crashes, timeouts, and errors the SDK considers terminal.

2. **One retry by default, configurable per persona.** A single retry catches transient failures (process crash, network glitch) without burning budget on persistent errors. Expensive personas (Opus) may want `maxRetries: 0` to avoid double-cost. Cheap personas (Haiku) can afford `maxRetries: 2`.

3. **Keep partial changes by default, rollback opt-in.** Most partial work is valuable — an agent that wrote 3 of 5 files saved real work. Automatic rollback risks destroying useful output. The user should review partial changes and decide. Auto-rollback is available as a per-persona opt-in for cases where partial output is always harmful (e.g., database migrations).

4. **Watchdog over hard timeouts.** A hard timeout kills the execution at N minutes regardless of progress. A watchdog checks for *inactivity* — an execution that's actively producing events is healthy even if slow. This avoids killing legitimate long-running tasks while catching truly stuck ones.

5. **Structured error categories over generic "failed".** The current binary outcome ("success" | "failure") doesn't tell the user what went wrong or whether retry will help. Error categories enable: automatic retry decisions, meaningful UI display, aggregate analytics, and targeted user guidance ("your API key is missing" vs "try again later").

6. **Interrupted as a distinct status from failed.** A clean shutdown that interrupted a running execution is fundamentally different from a crash. The execution may have been healthy; the user just restarted the server. Marking these as "interrupted" (vs "failed") enables: auto-resume, accurate failure metrics (don't count planned restarts as failures), and clearer UX ("Interrupted by restart" vs "Failed").
