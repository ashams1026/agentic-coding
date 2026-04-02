# Test Plan: Agent Collaboration Phase 1

## Objective

Verify handoff notes display in execution history, dependency enforcement blocking in dispatch, and context windowing for accumulated handoff notes.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with at least one project and work items
- chrome-devtools MCP connected
- At least one completed execution with handoff notes (requires agent run, or manually seeded data)

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Handoff Notes Display in Execution History

1. **Navigate** to `http://localhost:5173/items`
   - Verify: work items page loads
   - **Screenshot checkpoint**

2. **Click** a work item that has completed executions
   - Expected: detail panel opens with Execution History section
   - **Screenshot checkpoint**

3. **Expand** an execution entry in the timeline (click the chevron)
   - Expected: expanded view shows logs
   - If execution has handoff notes: verify "Handoff Notes" card appears above logs
   - **Screenshot checkpoint**

4. **Verify** handoff notes card content (if present)
   - Look for: GitBranch icon + "Handoff Notes" header with state transition (fromState -> targetState)
   - Expected: summary text visible
   - Check: decisions list with Lightbulb icon (if any decisions extracted)
   - Check: files changed as mono badges with FileText icon and count (if any files extracted)
   - Check: open questions in amber text with HelpCircle icon (if any questions extracted)
   - **Screenshot checkpoint**

5. **Verify** handoff notes card is absent for executions without notes
   - Collapse and expand a different execution (if available)
   - Expected: no handoff notes card if execution.handoffNotes is null

### Part 2: Dependency Enforcement in Dispatch

6. **Verify** dependency blocking behavior via API
   - Create a work item edge: `POST /api/work-item-edges` with `type: "depends_on"` where the target item depends on an incomplete upstream item
   - Trigger dispatch for the dependent item (move it to a state with an assigned persona)
   - Expected: dispatch is blocked — a system comment is created saying "Dispatch blocked: N upstream dependencies not complete"
   - **Screenshot checkpoint** (check comments section of the work item)

7. **Verify** dispatch proceeds when dependencies are met
   - Move the upstream work item to a terminal state (e.g., "Done")
   - Re-trigger dispatch for the dependent item
   - Expected: dispatch is no longer blocked (no new blocking comment)

### Part 3: Context Windowing

8. **Verify** context windowing via code review
   - Check `packages/backend/src/agent/handoff-notes.ts`: `buildAccumulatedContext()` function exists
   - Verify: queries all completed executions ordered by completedAt desc
   - Verify: most recent note gets full formatting via `formatHandoffForPrompt()`
   - Verify: older notes compressed to one-line summaries `[fromState -> targetState] summary(120)`
   - Verify: stops when character budget (~8000 chars) exceeded

9. **Verify** context injection via code review
   - Check `packages/backend/src/agent/execution-manager.ts`: `buildAccumulatedContext()` called before spawn
   - Check `packages/backend/src/agent/claude-executor.ts`: `buildSystemPrompt()` accepts `opts.handoffContext`
   - Verify: handoff context appended as section (6) in system prompt

10. **Take final screenshot** of a work item with execution history for evidence

## Expected Results

- Handoff notes card renders in expanded execution timeline entries (when handoffNotes is non-null)
- Card shows: state transition, summary, decisions, files changed, open questions
- Card is absent for executions without handoff notes
- Dispatch is blocked when upstream depends_on items are not in terminal state
- System comment created explaining which dependencies are pending
- Dispatch proceeds normally when all dependencies are in terminal states
- buildAccumulatedContext() collects notes with token budget windowing
- Handoff context is injected into system prompt as section (6)

### Visual Quality

- Handoff notes card: properly aligned within timeline, border visible, sections spaced
- GitBranch/Lightbulb/FileText/HelpCircle icons render at correct sizes
- Mono badges for file paths: consistent sizing, readable
- Open questions in amber: distinct from other text, visible in both light/dark mode
- No clipping or overflow in the card content

## Failure Criteria

- Handoff notes card doesn't render when execution has handoffNotes data
- Card content is empty or shows undefined/null values
- Dispatch is not blocked when upstream dependencies are incomplete
- No system comment created for blocked dispatch
- buildAccumulatedContext() doesn't respect token budget
- Handoff context not injected into system prompt

### Visual Failure Criteria

- Card overlaps timeline track or other elements
- Icons missing or wrong size
- Text invisible or unreadable
- Amber open questions not distinguishable from regular text
