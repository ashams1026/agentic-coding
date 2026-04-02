# Test Plan: Rollback Enhancements

## Objective

Verify the Sprint 32 rollback enhancements: time-elapsed indicators, file conflict detection/warnings, multi-surface rewind access (execution timeline, agent monitor split-view), git commit integration, and per-file diff previews in the rewind confirmation dialog.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (`pnpm seed` or `pnpm seed:demo`)
- chrome-devtools MCP connected
- At least one completed execution with `checkpointMessageId` set (modern execution)
- At least one completed execution with `checkpointMessageId = null` (legacy execution)
- The project associated with the test execution has a valid `path` that is inside a git repository
- At least one file tracked by a completed execution has been modified after `execution.completedAt` (to trigger conflict detection)

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

### Part 1: Time-Elapsed Indicator

1. **Navigate** to `http://localhost:5173/p/pj-global/monitor`
   - Verify: Agent Monitor page loads with history tab visible
   - **Screenshot checkpoint:** Take screenshot, verify page layout

2. **Identify a completed execution** with checkpoint (`checkpointMessageId` set)
   - Look for: a row with status "completed" or "success" and an enabled rewind button (Undo2 icon)
   - Expected: at least one qualifying execution in the history table
   - **Screenshot checkpoint:** Take screenshot, note which execution will be used

3. **Click the rewind button** on the completed execution
   - Target: Undo2 icon button in the execution row
   - Expected: AlertDialog modal opens with title "Rewind file changes?"
   - **Screenshot checkpoint:** Take screenshot of the modal

4. **Verify time-elapsed text** in the dialog body
   - Look for: text like "This execution ran X minutes/hours/days ago" or "completed X hours ago"
   - Expected: relative time is accurate (e.g., if execution completed 2 hours ago, text says "2 hours ago")
   - Expected: text is below the description and above the file list
   - **Screenshot checkpoint:** Take screenshot showing the time-elapsed indicator

5. **Click "Cancel"** to dismiss the dialog
   - Expected: dialog closes, no side effects
   - **Screenshot checkpoint:** Take screenshot confirming dismissal

### Part 2: Conflict Detection & Warning Banner

6. **Identify a file tracked by the execution** that was modified after `execution.completedAt`
   - If no such file exists: manually modify one of the files listed in a completed execution's `filesChanged` (e.g., add a comment line), then proceed
   - Note: this may require preparation before the test — record whether you created the conflict artificially

7. **Click the rewind button** on the execution whose files have post-execution modifications
   - Target: Undo2 icon button for that execution
   - Expected: loading state appears briefly, then the rewind dialog opens
   - **Screenshot checkpoint:** Take screenshot of the loading state if visible

8. **Verify conflict warning banner** in the rewind dialog
   - Look for: a yellow/amber warning box inside the dialog
   - Expected: banner lists the conflicted file(s) with their path and modification time
   - Expected: message like "Reverting will overwrite these changes" or similar warning text
   - Expected: "Rewind Files" button remains enabled (warning only, does not block rewind)
   - **Screenshot checkpoint:** Take screenshot showing the full conflict warning banner

9. **Verify conflicted files are marked** in the file list
   - Look for: warning icon (triangle or similar) next to conflicted file paths
   - Expected: conflicted files visually distinct from non-conflicted files
   - **Screenshot checkpoint:** Take screenshot showing file list with conflict markers

10. **Test rewind with 0 conflicts**
    - Find (or create) a completed execution whose tracked files have NOT been modified since completion
    - Click its rewind button
    - Expected: dialog opens with NO yellow warning banner — just the standard file list and description
    - **Screenshot checkpoint:** Take screenshot confirming no conflict warning

11. **Click "Cancel"** to dismiss the dialog
    - Expected: dialog closes cleanly

### Part 3: Multi-Surface — Execution Timeline (Work Item Detail)

12. **Navigate** to `http://localhost:5173/p/pj-global/items`
    - Verify: Work Items page loads with item list
    - **Screenshot checkpoint:** Take screenshot, verify page layout

13. **Select a work item** that has at least one completed execution with checkpoint
    - Click on the work item row to open the detail panel
    - Expected: detail panel opens with tabs or sections including an execution timeline
    - **Screenshot checkpoint:** Take screenshot of the detail panel

14. **Locate the execution timeline** in the detail panel
    - Look for: a section showing execution entries (persona name, status, timing)
    - Expected: timeline section is visible, shows at least one completed execution
    - **Screenshot checkpoint:** Take screenshot of the execution timeline section

15. **Verify "Revert Changes" button** on a completed execution timeline entry
    - Look for: a "Revert Changes" button or Undo2 icon button on the execution row
    - Expected: button visible for completed executions with `checkpointMessageId`
    - Expected: button NOT visible (or disabled) for executions without checkpoint
    - **Screenshot checkpoint:** Take screenshot showing the rewind button in the timeline

16. **Click the "Revert Changes" button** in the execution timeline
    - Expected: the same rewind confirmation dialog opens (with time-elapsed, file list, conflict warnings if applicable)
    - Expected: dialog behavior is identical to the Agent Monitor history rewind
    - **Screenshot checkpoint:** Take screenshot of the dialog opened from execution timeline

17. **Click "Cancel"** to dismiss
    - Expected: dialog closes, execution timeline unchanged

### Part 4: Multi-Surface — Agent Monitor Split-View

18. **Navigate** to `http://localhost:5173/p/pj-global/monitor`
    - Verify: Agent Monitor page loads
    - **Screenshot checkpoint:** Take screenshot

19. **Expand an execution** to open the split-view / detail pane
    - Click on a completed execution row to expand or open its detail view
    - Expected: execution detail panel or expanded view appears showing execution info, terminal output, etc.
    - **Screenshot checkpoint:** Take screenshot of the expanded execution view

20. **Verify "Revert Changes" button** in the execution header or toolbar
    - Look for: a "Revert Changes" button in the execution detail header/toolbar area
    - Expected: button visible for completed executions with `checkpointMessageId`
    - Expected: uses the shared RewindButton component (same styling as other surfaces)
    - **Screenshot checkpoint:** Take screenshot showing the rewind button in the toolbar

21. **Click the "Revert Changes" button** in the split-view
    - Expected: rewind confirmation dialog opens with full dialog (time-elapsed, file list, conflicts)
    - **Screenshot checkpoint:** Take screenshot of the dialog

22. **Click "Cancel"** to dismiss
    - Expected: dialog closes, split-view remains open and unchanged

### Part 5: Git Commit Integration

23. **Open the rewind dialog** from any surface (Agent Monitor history, execution timeline, or split-view)
    - Target: click the rewind button on a completed execution with checkpoint, in a project with a valid git repo path
    - **Screenshot checkpoint:** Take screenshot of the dialog

24. **Verify "Create revert commit" checkbox** is present and checked by default
    - Look for: a checkbox with label like "Create revert commit" or "Create git commit"
    - Expected: checkbox is visible in the dialog, checked by default
    - **Screenshot checkpoint:** Take screenshot showing the checkbox in checked state

25. **Uncheck the "Create revert commit" checkbox**
    - Click the checkbox to uncheck it
    - Expected: checkbox visually unchecks, no other dialog changes
    - **Screenshot checkpoint:** Take screenshot showing unchecked state

26. **Re-check the checkbox** and click "Rewind Files" to confirm
    - Expected: button shows loading state ("Rewinding...")
    - Expected: rewind completes, dialog closes
    - Expected: success toast includes the commit SHA (e.g., "Files rewound — N files reverted. Commit: abc1234")
    - **Screenshot checkpoint:** Take screenshot showing the success toast with commit SHA

27. **Verify the git commit was created**
    - If possible, check git log via terminal or the UI for the revert commit
    - Expected: commit message matches pattern like `revert: undo execution {id} ({agentName})`
    - Note: this may require manual git log verification outside the UI

28. **Test rewind with commit checkbox unchecked**
    - Open rewind dialog on another execution, uncheck "Create revert commit", click "Rewind Files"
    - Expected: rewind succeeds, success toast does NOT show a commit SHA
    - **Screenshot checkpoint:** Take screenshot of the success toast without SHA

29. **Test on a non-git project** (if available)
    - Open the rewind dialog for an execution in a project whose `path` is NOT inside a git repo
    - Expected: the "Create revert commit" checkbox is hidden/not rendered
    - Expected: rewind dialog otherwise functions normally (file list, time-elapsed, etc.)
    - If no non-git project is available: note as SKIP
    - **Screenshot checkpoint:** Take screenshot if applicable

### Part 6: Per-File Diff Preview

30. **Open the rewind dialog** on a completed execution with checkpoint (preferably one with multiple files changed)
    - Target: click the rewind button from any surface
    - **Screenshot checkpoint:** Take screenshot of the dialog

31. **Verify per-file expandable rows** replace the flat file list
    - Look for: each file shown as a collapsible row with file path and `+N/-M` line summary
    - Expected: files are collapsed by default (diffs not visible)
    - Expected: each row has a click target or chevron to expand
    - **Screenshot checkpoint:** Take screenshot showing collapsed file rows with line counts

32. **Click to expand a file** to view its diff
    - Click on a file row or its expand chevron
    - Expected: diff hunks appear below the file path
    - Expected: diff uses red/green line highlighting (DiffBlock-style rendering)
    - Expected: additions shown in green, deletions shown in red
    - **Screenshot checkpoint:** Take screenshot showing the expanded diff view

33. **Collapse the expanded file**
    - Click the same file row or chevron again
    - Expected: diff hides, row returns to collapsed state
    - **Screenshot checkpoint:** Take screenshot confirming collapse

34. **Expand multiple files** simultaneously
    - Expand 2-3 files at once
    - Expected: all expanded files show their diffs, scroll area accommodates the content
    - Expected: scroll behavior works correctly if content exceeds max-height
    - **Screenshot checkpoint:** Take screenshot showing multiple expanded diffs

35. **Verify scroll area** for large file lists
    - If the execution has many files (8+): check that a scroll area with max-height is active
    - Expected: file list scrollable without overflowing the dialog
    - If fewer than 8 files: note as SKIP (cannot verify scroll behavior)
    - **Screenshot checkpoint:** Take screenshot if applicable

### Part 7: Edge Cases & Disabled States

36. **Test rewind button on execution without checkpoint**
    - Find a completed execution with `checkpointMessageId = null` (legacy execution)
    - Expected: rewind button is disabled (grayed out)
    - Hover over the disabled button
    - Expected: tooltip explains why rewind is unavailable (e.g., "No file checkpoint available")
    - **Screenshot checkpoint:** Take screenshot showing disabled button and tooltip

37. **Test rewind button on running execution**
    - If a running execution exists: verify the rewind button is NOT rendered on its row
    - If no running execution: note as SKIP
    - **Screenshot checkpoint:** Take screenshot if applicable

38. **Verify click does not propagate** from rewind button
    - Click the rewind button — the execution row should NOT expand/collapse
    - Expected: only the rewind dialog opens, row state unchanged
    - **Screenshot checkpoint:** Take screenshot confirming row did not toggle

### Part 8: Dark Mode / Light Mode

39. **Switch to dark mode** (via Settings > Appearance or toggle)
    - Navigate to settings and toggle dark mode, or use system preference
    - **Screenshot checkpoint:** Take screenshot of settings

40. **Navigate** to `http://localhost:5173/p/pj-global/monitor` in dark mode
    - **Screenshot checkpoint:** Take screenshot of Agent Monitor in dark mode

41. **Open the rewind dialog** in dark mode
    - Click rewind button on a completed execution
    - Verify: dialog background, text, file list, conflict warning banner, checkbox, buttons all render correctly in dark mode
    - Expected: sufficient contrast on all text, no invisible elements, yellow warning still readable
    - **Screenshot checkpoint:** Take screenshot of the rewind dialog in dark mode

42. **Expand a file diff** in dark mode
    - Click to expand a file in the diff preview
    - Expected: red/green diff lines have proper contrast in dark mode
    - Expected: DiffBlock rendering adapts to dark theme
    - **Screenshot checkpoint:** Take screenshot of expanded diff in dark mode

43. **Switch back to light mode** and verify the dialog renders correctly
    - Toggle back to light mode
    - Open the rewind dialog again
    - Expected: all elements render correctly in light mode
    - **Screenshot checkpoint:** Take screenshot for comparison

44. **Take final screenshot** for evidence (full page, light mode)

## Expected Results

- Time-elapsed indicator visible in rewind dialog showing accurate relative time since execution completion
- Conflict warning banner appears (yellow/amber) when files have been modified after execution, listing affected files
- No conflict warning when files are unmodified since execution
- Conflicted files marked with warning icon in the file list
- "Rewind Files" button stays enabled even when conflicts exist (warning only)
- RewindButton component appears in Agent Monitor history, execution timeline (work item detail), and agent monitor split-view
- All three surfaces open the same rewind confirmation dialog with identical behavior
- "Create revert commit" checkbox visible and checked by default in git-backed projects
- Checkbox hidden when project is not a git repo
- Success toast shows commit SHA when git commit is created
- Success toast omits SHA when checkbox is unchecked
- Per-file expandable rows with `+N/-M` line summaries replace flat file list
- Expanding a file shows red/green diff hunks (DiffBlock rendering)
- Files can be expanded/collapsed independently
- Scroll area handles large file lists without dialog overflow
- Rewind button disabled with tooltip on executions without checkpoint
- Rewind button not rendered on running executions
- Click on rewind button does not propagate to row expansion
- No console errors during the entire flow

### Visual Quality

- Time-elapsed text properly styled (muted color, readable, not clipped)
- Conflict warning banner has correct yellow/amber background with readable dark text
- Warning icons on conflicted files are aligned and properly sized
- RewindButton consistent across all three surfaces (same icon, size, tooltip)
- Checkbox and label properly aligned, with readable text
- Diff rendering: red/green lines clearly distinguishable, monospace font, proper padding
- Expandable rows have smooth expand/collapse transitions
- Scroll area does not clip content unexpectedly
- Modal properly sized to accommodate diff content without overflow
- Dark mode: all dialog elements have sufficient contrast, diff colors adapted
- Button states (enabled/disabled/loading) visually distinct across all surfaces
- Toast notification includes commit SHA in readable monospace font

## Failure Criteria

- Time-elapsed text missing, shows "NaN", "undefined", or incorrect relative time
- Conflict warning does not appear when files have been modified post-execution
- Conflict warning appears when files have NOT been modified (false positive)
- "Rewind Files" button disabled or hidden due to conflicts (should be warning only)
- Rewind button missing from execution timeline or agent monitor split-view
- Clicking rewind on execution timeline or split-view does nothing or throws error
- "Create revert commit" checkbox missing in a git-backed project
- Checkbox visible when project is not a git repo
- Git commit not created when checkbox is checked and rewind succeeds
- Commit SHA missing from success toast when git commit was created
- Per-file diffs not rendering — flat file list shown instead of expandable rows
- DiffBlock rendering broken — no red/green highlighting, raw text instead of formatted diff
- Expand/collapse does not work on file rows
- Dialog overflows or clips content with many files expanded
- Rewind button enabled on execution without checkpoint
- Rewind button visible on running execution
- Click on rewind button also toggles row expansion
- Console errors during any step
- Any step takes more than 10 seconds without visual loading feedback

### Visual Failure Criteria

- Any visual defect counts as a visual failure even if the functional test passes
- Time-elapsed text invisible, truncated, or overlapping other content
- Conflict warning banner has wrong color (not yellow/amber) or unreadable text
- Warning icons misaligned or missing on conflicted files
- RewindButton inconsistent styling across different surfaces
- Checkbox misaligned with label text
- Diff lines lack color — additions and deletions indistinguishable
- Diff content overflows its container or clips outside the modal
- Expand/collapse chevron missing or misaligned on file rows
- Scroll area not working — content overflows beyond max-height
- Dark mode: text invisible, diff colors washed out, insufficient contrast on warning banner
- Layout breaks: elements stacked incorrectly, overlapping, or misaligned in the dialog
- Toast notification truncates commit SHA or has broken formatting
