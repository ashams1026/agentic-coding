# Test Plan: File Checkpointing & Rewind

## Objective

Verify the rewind button in Agent Monitor — button visibility states, dry-run preview modal, and file rewind confirmation flow.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (`pnpm seed` or `pnpm seed:demo`)
- chrome-devtools MCP connected
- At least one completed execution with `checkpointMessageId` set (modern execution)
- At least one completed execution with `checkpointMessageId = null` (legacy execution, or an older seeded one)
- Optionally, a currently running execution (or simulate with status = "running")

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

### Part 1: Rewind Button Visibility

1. **Navigate** to `http://localhost:5173/agents`
   - Verify: Agent Monitor page loads with history tab
   - **Screenshot checkpoint:** Take screenshot, verify page layout

2. **Verify** the execution history table is visible
   - Look for: table rows with execution data (persona name, work item, status, timing, cost)
   - Expected: at least 2-3 execution rows visible
   - **Screenshot checkpoint:** Take screenshot, examine table layout

3. **Identify a completed execution** with checkpoint (modern execution)
   - Look for: a row with status "completed" or "success" (not "running")
   - Expected: an Undo2 icon button (rewind) visible in the last column, before the expand chevron
   - **Screenshot checkpoint:** Take screenshot, highlight the rewind button location

4. **Hover over the rewind button** on a completed execution with checkpoint
   - Expected: tooltip appears with text "Revert all file changes made by this agent run"
   - **Screenshot checkpoint:** Take screenshot showing tooltip

5. **Identify a completed execution without checkpoint** (legacy execution)
   - Look for: a completed row where the rewind button is disabled (grayed out)
   - Expected: button present but visually disabled, tooltip explains "No file checkpoint available — this execution ran before checkpointing was enabled" or similar
   - **Screenshot checkpoint:** Take screenshot showing disabled state

6. **Verify running executions** have no rewind button
   - If a running execution exists: check its row — the rewind button should not be rendered at all (returns null)
   - If no running execution: note as SKIP (cannot verify without active execution)
   - **Screenshot checkpoint:** Take screenshot if applicable

### Part 2: Dry-Run Preview Modal

7. **Click the rewind button** on a completed execution with checkpoint
   - Target: the Undo2 icon button in the execution row
   - Expected: a loading state appears briefly, then an AlertDialog modal opens
   - **Screenshot checkpoint:** Take screenshot of the modal immediately after it opens

8. **Verify modal title and description**
   - Expected title: "Rewind file changes?"
   - Expected description: "This will revert all file changes made by this agent execution to their pre-execution state."
   - Look for: file list in a bordered box showing file paths in monospace font

9. **Verify file list in dry-run preview**
   - Expected: a count like "N files will be reverted (+X/-Y lines)"
   - Expected: each file path listed in `font-mono` style
   - Expected: list scrollable if more than ~8-10 files (`max-h-[200px] overflow-auto`)
   - **Screenshot checkpoint:** Take screenshot showing file list details

10. **Verify modal footer buttons**
    - Expected: "Cancel" button (left) and "Rewind Files" button (right)
    - Both should be enabled (not disabled)
    - **Screenshot checkpoint:** Take screenshot of footer area

11. **Click "Cancel"** to dismiss the modal
    - Expected: modal closes, no changes made, no toast notification
    - **Screenshot checkpoint:** Take screenshot confirming modal is dismissed

### Part 3: Confirm Rewind

12. **Click the rewind button** again on the same execution
    - Expected: dry-run preview modal opens again with same file list
    - **Screenshot checkpoint:** Take screenshot

13. **Click "Rewind Files"** to confirm
    - Expected: button text changes to "Rewinding..." while processing
    - Expected: modal closes after rewind completes
    - Expected: success toast appears with message like "Files rewound — N files reverted (+X/-Y lines)"
    - **Screenshot checkpoint:** Take screenshot showing the success toast

14. **Verify post-rewind state**
    - The rewind button should still be visible on the same execution row (rewind is idempotent)
    - No errors in the UI
    - **Screenshot checkpoint:** Take screenshot of the agent monitor after rewind

### Part 4: Error Handling

15. **Attempt rewind on an execution with no checkpoint** (if possible via API)
    - If the disabled button cannot be clicked: note as EXPECTED BEHAVIOR (button prevents invalid action)
    - If testing via direct API call: `POST /api/executions/:id/rewind` should return 400 with code "NO_CHECKPOINT"
    - **Screenshot checkpoint:** Take screenshot if applicable

16. **Verify click does not propagate**
    - Click the rewind button — the execution row should NOT expand/collapse
    - Expected: `e.stopPropagation()` prevents the row toggle
    - **Screenshot checkpoint:** Take screenshot showing row state unchanged

### Part 5: Visual Quality

17. **Take a full-page screenshot** of the Agent Monitor with rewind buttons visible
    - Check: rewind button aligned with expand chevron
    - Check: button size consistent (h-7 w-7)
    - Check: disabled state visually distinct from enabled
    - Check: no layout shift when clicking rewind button
    - **Screenshot checkpoint:** Final screenshot

## Expected Results

- Rewind button visible on all completed executions (enabled if checkpoint exists, disabled if not)
- Rewind button NOT rendered on running executions
- Tooltip correctly describes the button's purpose or disabled reason
- Dry-run modal shows accurate file list with count, insertions/deletions stats
- File paths displayed in monospace font, scrollable list
- Cancel dismisses modal without side effects
- Confirm rewind shows loading state, then success toast
- Click on rewind button does not toggle row expansion
- No console errors during the entire flow

### Visual Quality

- Rewind button (Undo2 icon) properly sized and aligned within the table cell
- Modal centered, properly sized, with readable text
- File list box has border, muted background, proper padding
- Button states (enabled/disabled/loading) visually distinct
- Toast notification appears in expected position with correct styling
- Dark mode: all elements have proper contrast and visibility

## Failure Criteria

- Rewind button visible on a running execution
- Rewind button enabled when `checkpointMessageId` is null
- Modal does not open when clicking an enabled rewind button
- File list empty or shows wrong data in dry-run preview
- Confirm rewind fails with an error (API error, network error)
- Click on rewind button also toggles row expansion
- No success toast after confirmed rewind
- Console errors during any step

### Visual Failure Criteria

- Rewind button overlaps with expand chevron or other content
- Modal content truncated or clipped
- File paths not in monospace font
- Tooltip not appearing on hover
- Loading state not visible (instant transition without feedback)
- Toast notification missing or incorrectly styled
