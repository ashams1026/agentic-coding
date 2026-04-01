# Test Plan: Agent Monitor — File Changes Panel

## Objective

Verify the file changes panel in the agent monitor shows modified files with correct change types, badge count, and collapsible behavior.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- Database seeded with test data (at least one completed execution)
- chrome-devtools MCP connected
- An active or recently completed agent execution that modified files (the panel only appears when `file_changed` WS events are received)

**Note:** The file changes panel subscribes to real-time `file_changed` WebSocket events. If no agent is currently running or has recently run with the FileChanged hook active, the panel will not appear (it auto-hides when empty). Steps that require a running agent may be SKIP if no live execution is available.

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Panel Visibility and Auto-Hide (4 steps)

1. **Navigate** to `http://localhost:5173/agents`
   - Verify: Agent monitor page loads with Live/History tabs
   - **Screenshot checkpoint:** Take screenshot, verify page layout

2. **Switch to Live tab** if not already active
   - Verify: Live view shows either active agents or empty state ("No agents running")
   - **Screenshot checkpoint:** Take screenshot

3. **Verify file changes panel is NOT visible** when no file_changed events have been received
   - Look for: absence of "Files" label with a badge at the bottom of the terminal renderer
   - Expected: Panel auto-hides when file list is empty (component returns null)
   - **Screenshot checkpoint:** Take screenshot confirming no files panel

4. **If an agent execution is active:** wait for file modifications and verify the panel appears
   - Look for: "Files" label with a numeric badge appearing below the chat output area
   - Expected: Panel slides in with a border-t separator when first file_changed event arrives
   - **Screenshot checkpoint:** Take screenshot of panel appearing (SKIP if no active agent)

### Part 2: Panel Content and File Entries (5 steps)

5. **Verify file entry structure** (requires active panel with at least one file)
   - Look for: each row showing an icon, file path, change type label, and timestamp
   - Expected: monospace font (`font-mono`), file path truncated with ellipsis if too long
   - **Screenshot checkpoint:** Take screenshot of file entries (SKIP if panel not visible)

6. **Verify change type icons and colors**
   - Look for: FilePlus icon (green/emerald) for "Created", FileText icon (amber) for "Modified", FileX icon (red) for "Deleted"
   - Expected: icon color matches the change type label color
   - **Screenshot checkpoint:** Take screenshot (SKIP if insufficient change types visible)

7. **Verify badge count matches file list length**
   - Count the number of file entries in the expanded panel
   - Compare with the numeric badge next to "Files" label
   - Expected: badge number equals the count of visible file entries

8. **Verify timestamp format**
   - Look for: HH:MM:SS format on each file entry (right-aligned, smaller text)
   - Expected: timestamps are valid times, displayed in zinc-600 color

9. **Verify file path deduplication** (if same file modified multiple times)
   - If an agent modifies the same file twice, verify only one entry appears (updated, not duplicated)
   - Expected: file list shows unique paths only; change type reflects the latest modification
   - (SKIP if cannot verify — requires observing multiple events for same file)

### Part 3: Collapse/Expand Behavior (3 steps)

10. **Click the "Files" header** to collapse the panel
    - Target: button with text "Files" and chevron icon
    - Expected: file list hides, chevron rotates to point right (-rotate-90), badge still visible
    - **Screenshot checkpoint:** Take screenshot of collapsed state

11. **Click the "Files" header again** to expand
    - Expected: file list reappears, chevron points down, all entries visible
    - **Screenshot checkpoint:** Take screenshot of re-expanded state

12. **Verify panel starts expanded** by default
    - Navigate away and back to `/agents`, or switch execution
    - Expected: panel is expanded (showing file list) when it first appears

### Part 4: Execution Switching (2 steps)

13. **Switch to a different execution** (if multiple active agents or via History tab)
    - Expected: file list clears and resets for the new execution
    - **Screenshot checkpoint:** Take screenshot after switching

14. **Switch back to original execution**
    - Expected: file list is empty (WS events are real-time only, not persisted)
    - This confirms state cleanup on execution change

### Part 5: Visual Quality (2 steps)

15. **Take full-page screenshot** of agent monitor with file changes panel visible
    - Verify: panel integrates cleanly between chat output and bottom of terminal renderer
    - Check: border-t separator visible, consistent dark theme (zinc-800/900), no clipping

16. **Verify dark mode appearance**
    - Check: all text readable against dark background, icons colored correctly, badge styled
    - Expected: zinc-300 text for paths, colored labels for change types, zinc-600 timestamps

## Expected Results

- File changes panel auto-hides when no files have been modified
- Panel appears below chat output when file_changed WS events arrive
- Each file entry shows: icon (change-type colored), file path (mono, truncated), change type label, timestamp
- Badge count matches number of file entries
- Panel is collapsible via chevron toggle; starts expanded
- File list clears when switching executions
- Same file modified twice shows one entry (deduplicated)
- Dark theme styling consistent with terminal renderer

### Visual Quality

- Panel border separates it from chat output cleanly
- Icons are properly colored (emerald/amber/red) matching their labels
- File paths use monospace font and truncate gracefully
- Badge is compact and aligned with "Files" label
- Chevron animation is smooth on collapse/expand
- No overlap with the "New output below" floating button

## Failure Criteria

- Panel appears when no files have been modified (should auto-hide)
- File entries missing any of: icon, path, change type, timestamp
- Badge count doesn't match actual file entry count
- Collapse/expand toggle doesn't work
- File list doesn't clear when switching executions
- Duplicate file paths shown for the same file

### Visual Failure Criteria

- Text invisible against dark background
- Icons missing or wrong color for change type
- File paths overflow container instead of truncating
- Badge overlaps or clips against "Files" label
- Panel pushes content off-screen or overlaps with other elements
