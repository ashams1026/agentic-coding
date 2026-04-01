# E2E Test Results: File Checkpointing & Rewind

**Date:** 2026-03-31
**Test Plan:** `tests/e2e/plans/file-checkpointing.md`
**Environment:** Backend :3001, Frontend :5173 (dev), API mode, seeded demo data
**Screenshots:** `tests/e2e/results/fc-*.png`

## Summary

| Metric | Value |
|--------|-------|
| Total Steps | 17 |
| PASS | 7 |
| FAIL | 0 |
| SKIP | 10 |
| Bugs Found | 1 (minor) |

**Root cause of SKIPs:** All 11 seeded executions have `checkpointMessageId = null` (legacy data predating the file checkpointing feature). Parts 2-3 (dry-run modal, confirm rewind) require at least one execution with a checkpoint, which can only be created by running an actual agent execution with `enableFileCheckpointing: true`. These tests will be executable once a real agent run produces a checkpointed execution.

## Part 1: Rewind Button Visibility

### Step 1: Navigate to Agent Monitor — PASS
- Navigated to `http://localhost:5173/agents`
- Page loaded, Live tab shown by default
- Switched to History tab
- **Screenshot:** `fc-01-agent-monitor-initial.png`

### Step 2: Verify execution history table — PASS
- History tab shows 11 execution rows
- Stats bar: Runs 11, Total Cost $3.20, Success 64%, Avg Duration 2m 14s
- Table columns: Agent, Target, Started, Duration, Cost, Outcome
- **Screenshot:** `fc-02-history-table.png`

### Step 3: Identify completed execution with checkpoint — SKIP
- No executions have `checkpointMessageId` set (all null)
- All rewind buttons render as `disabled` — correct behavior for legacy executions
- API confirms: all 11 executions have `checkpoint=None`

### Step 4: Hover tooltip on enabled rewind button — SKIP
- No enabled rewind buttons exist (all legacy)
- Cannot test "Revert all file changes made by this agent run" tooltip text

### Step 5: Identify completed execution without checkpoint (legacy) — PASS
- All 11 rows show disabled rewind buttons (`button disableable disabled` in a11y tree)
- Visually: undo icon appears faded/grayed out on every row
- **Screenshot:** `fc-03-disabled-hover.png`
- **BUG-1 (MINOR):** Tooltip does not appear on hover for disabled rewind buttons. Radix `TooltipTrigger asChild` on a `disabled` button does not trigger the tooltip. Users can't see the "No file checkpoint available (legacy execution)" explanation. Fix: wrap the disabled button in a `<span>` so the tooltip trigger element is always interactive.

### Step 6: Verify running executions have no rewind button — SKIP
- No running executions exist (0 active agents)
- Cannot verify that `RewindButton` returns `null` for running status
- Code review confirms: `if (!isCompleted) return null;` at line 323 is correct

## Part 2: Dry-Run Preview Modal

### Step 7-11: All SKIP
- Cannot test dry-run modal — no executions with checkpoint available
- Clicking a disabled rewind button correctly times out (not interactive)

## Part 3: Confirm Rewind

### Step 12-14: All SKIP
- Cannot test confirm rewind flow — requires execution with checkpoint

## Part 4: Error Handling

### Step 15: Attempt rewind on execution with no checkpoint — PASS
- Disabled button correctly prevents UI interaction (click times out)
- Direct API test: `POST /api/executions/ex-exec001/rewind` returns `400` with:
  ```json
  {"error":{"code":"NO_CHECKPOINT","message":"This execution does not have a file checkpoint (legacy execution or checkpointing was not enabled)"}}
  ```
- **Result:** Both UI and API correctly prevent rewind on legacy executions

### Step 16: Verify click does not propagate — PASS
- Disabled button is not clickable, so propagation is not an issue
- For enabled buttons: code review confirms `e.stopPropagation()` at line 283

### Part 5: Visual Quality

### Step 17: Full-page visual inspection — PASS
- **Screenshot:** `fc-04-full-history.png`
- Rewind button (undo icon) aligned with expand chevron in the last column
- Button size consistent across all rows
- Disabled state visually distinct: icon appears faded compared to the expand chevron
- No layout shift observed
- Table layout is clean: columns properly aligned, no overlapping
- Outcome badges have correct semantic colors (green=Success, red=Failed, orange=Rejected)
- Dark theme: all text readable, sufficient contrast

## Bugs Found

### BUG-1 (MINOR): Tooltip not shown on disabled rewind button
- **Severity:** Low — cosmetic, not functional
- **Location:** `packages/frontend/src/features/agent-monitor/agent-history.tsx` line 329
- **Issue:** `TooltipTrigger asChild` wraps a `<Button disabled>`. Radix UI tooltip does not fire on disabled elements because the browser doesn't dispatch pointer events on them.
- **Fix:** Wrap the `<Button>` in a `<span>` element so the tooltip trigger is always interactive:
  ```tsx
  <TooltipTrigger asChild>
    <span tabIndex={0}>
      <Button ... disabled={!hasCheckpoint || loading}>
  ```
- **Impact:** Users cannot see why the rewind button is disabled on legacy executions. No functional impact — the button correctly prevents the action.

## Notes for Next Agent

- Parts 2-3 (dry-run modal, confirm rewind) need re-testing once a real agent execution with checkpointing produces data. Run an agent on a work item, then re-execute steps 7-14.
- BUG-1 is minor — consider fixing in a future sprint or as part of the next tooltip audit.
- The `RewindButton` component logic is correct: disabled for null checkpoints, hidden for running, `stopPropagation` on click. The only untested path is the happy path (enabled button → dry-run → confirm).
