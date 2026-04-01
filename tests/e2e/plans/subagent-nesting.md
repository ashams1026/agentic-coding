# Test Plan: Subagent Nesting in Agent Monitor

## Objective

Verify that subagent executions appear as nested cards under their parent execution in the agent monitor history, with tree connector rendering, expand/collapse, and correct metadata display.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- Database seeded with test data
- chrome-devtools MCP connected
- At least one execution with `parentExecutionId` set (requires a real agent invocation of a subagent via the `Agent` tool, or manually seeded data)

**Note:** The `parentExecutionId` field is only populated when an agent spawns a subagent via the SDK's Agent tool (SDK.SA.1-SA.2). Existing seeded executions predate this feature and have `parentExecutionId: null`. Steps requiring visible nested cards may be SKIP if no parent-child execution data exists.

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Top-Level Filtering (3 steps)

1. **Navigate** to `http://localhost:5173/agents` and switch to **History** tab
   - Verify: Execution history table loads with rows
   - **Screenshot checkpoint:** Take screenshot

2. **Verify child executions are NOT shown** in the top-level table
   - If any executions have `parentExecutionId`, they should be absent from the main table
   - Expected: only top-level (parent) executions visible in sorted list
   - (SKIP if no child executions exist — all rows are top-level by default)

3. **Verify execution count** in stats bar
   - Expected: stats "Runs" count reflects top-level executions only, not inflated by children
   - **Screenshot checkpoint:** Take screenshot

### Part 2: Nested Subagent Cards (5 steps)

4. **Expand a parent execution** that has child subagent executions
   - Click on the row to expand
   - Look for: "Subagents (N)" section below the terminal renderer
   - Expected: section appears with count badge and nested SubagentCards
   - **Screenshot checkpoint:** Take screenshot (SKIP if no parent-child data)

5. **Verify SubagentCard structure**
   - Look for each card showing: persona avatar (colored circle), persona name, "subagent" label, outcome badge, duration, cost
   - Expected: all metadata fields present and formatted correctly
   - (SKIP if no subagent cards visible)

6. **Verify tree connector styling**
   - Look for: left border line (`border-l-2`) connecting cards to parent, indentation (`ml-6`)
   - Expected: visual tree connector from parent to each child card
   - **Screenshot checkpoint:** Take screenshot (SKIP if no cards)

7. **Click a SubagentCard** to expand it
   - Expected: 200px terminal renderer appears showing the subagent's output
   - Chevron rotates to indicate expanded state
   - **Screenshot checkpoint:** Take screenshot of expanded subagent (SKIP if no cards)

8. **Click the same SubagentCard** again to collapse
   - Expected: terminal renderer hides, chevron returns to default
   - Confirms toggle behavior works

### Part 3: Parent Without Children (2 steps)

9. **Expand a regular execution** (one without subagent children)
   - Expected: terminal renderer visible, NO "Subagents" section
   - Confirms conditional rendering — subagent section only appears when children exist

10. **Verify non-Router, non-subagent execution** displays normally
    - Expected: standard expanded view with terminal renderer (and optionally RouterDecisionCard)
    - No subagent artifacts when `childExecutions` is empty

### Part 4: Visual Quality (2 steps)

11. **Take full-page screenshot** of agent monitor with nested subagent view expanded
    - Verify: nested cards sit cleanly below terminal renderer, tree connector visible
    - Check: `bg-muted/20` background on subagent section, border-b separation, consistent spacing

12. **Verify dark mode** appearance
    - Check: tree connector line visible, avatar colors correct, outcome badges readable
    - Expected: muted background adapts to dark theme

## Expected Results

- Child executions with `parentExecutionId` are hidden from top-level history table
- Expanding a parent execution shows "Subagents (N)" section with nested cards
- Each SubagentCard displays: persona avatar, name, "subagent" label, outcome, duration, cost
- Tree connector line (left border) visually links cards to parent
- SubagentCards are collapsed by default, expandable to show 200px terminal output
- Executions without children show no subagent section

### Visual Quality

- Tree connector (`border-l-2 border-muted`) is visible and properly indented
- SubagentCard hover state works (`hover:bg-accent/50`)
- Chevron rotates smoothly on expand/collapse
- Avatar colors match persona configuration
- Outcome badges use correct colors (emerald/red/amber)
- Dark mode: all elements visible with proper contrast

## Failure Criteria

- Child executions appear in the top-level history table
- "Subagents" section appears for executions without children
- SubagentCard missing persona name, outcome, duration, or cost
- Expand/collapse doesn't work on SubagentCards
- Tree connector not visible or misaligned

### Visual Failure Criteria

- Tree connector invisible against background
- Avatar colors wrong or missing
- SubagentCard overlaps with parent terminal renderer
- Expanded subagent terminal overflows its container
- Dark mode: text or borders invisible
