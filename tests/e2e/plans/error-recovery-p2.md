# Test Plan: Error Recovery Phase 2

## Objective

Verify Sprint 33 error recovery features end-to-end: structured error classification with UI badges, automatic retry with backoff and linking, stuck execution watchdog with force-stop, and retry policy configuration in agent settings.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (`pnpm seed` or `pnpm seed:demo`)
- chrome-devtools MCP connected
- At least one completed execution with `status: "failed"` and a populated `error` JSON field
- At least one agent with `retryPolicy` configured (non-null)
- At least one execution with `retryCount > 0` (retry chain visible in history)
- Terminal access for backend restart tests (TC-ER2-10)

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

### Part 1: Error Classification — Schema & Data (ER.1-ER.3)

#### TC-ER2-1: Error and retryCount columns exist in executions table

1. **Read** `packages/backend/src/db/schema.ts`
   - Verify: `executions` table has `error` column with type `text("error", { mode: "json" })`
   - Verify: `executions` table has `retryCount` column with type `integer("retryCount").default(0)`
   - **Screenshot checkpoint:** N/A (code inspection)

2. **Read** `packages/shared/src/entities.ts`
   - Verify: `Execution` type includes `error: ExecutionError | null`
   - Verify: `Execution` type includes `retryCount: number`
   - Verify: `ErrorCategory` union type has all 10 categories: `timeout`, `rate_limit`, `sdk_error`, `permission_denied`, `budget_exceeded`, `configuration_error`, `rejection_limit`, `loop_detected`, `interrupted`, `unknown`
   - Verify: `ExecutionError` has `category`, `message`, optional `details` with `sdkError`, `toolName`, `raw`

3. **Verify migration** exists
   - Check: migration SQL file adds `error` and `retryCount` columns to `executions`
   - Expected: both columns are nullable/have defaults (existing rows unaffected)

#### TC-ER2-2: Failed execution has structured error JSON via API

1. **Query** `GET http://localhost:3001/api/executions?status=failed`
   - Verify: response contains at least one failed execution
   - Check: `error` field is a JSON object `{ category: "...", message: "..." }` (not a raw string)
   - Check: `category` is one of the 10 valid `ErrorCategory` values
   - Check: `retryCount` is a number (0 or higher)
   - **Screenshot checkpoint:** N/A (API inspection)

2. **Verify** error classification in execution-manager
   - Read: `packages/backend/src/agent/execution-manager.ts`
   - Verify: catch block parses errors into `ErrorCategory` (timeout, sdk_error, permission_denied, configuration_error, etc.)
   - Verify: `ExecutionError` object `{ category, message }` written to the `error` column

#### TC-ER2-3: Error category badge in Agent Monitor history

1. **Navigate** to `http://localhost:5173/p/pj-global/monitor`
   - Verify: Agent Monitor page loads with history tab visible
   - **Screenshot checkpoint:** Take screenshot, verify page layout

2. **Locate a failed execution** in the history table
   - Look for: a row with status "failed" and an error badge
   - Expected: error category badge visible next to or below the status indicator
   - **Screenshot checkpoint:** Take screenshot showing the error badge

3. **Verify badge color coding**
   - Red badge: terminal errors (`permission_denied`, `configuration_error`, `budget_exceeded`, `rejection_limit`, `loop_detected`, `unknown`)
   - Amber badge: retryable errors (`timeout`, `rate_limit`, `sdk_error`, `interrupted`)
   - Expected: badge text matches the error category (e.g., "timeout", "sdk_error")
   - **Screenshot checkpoint:** Take screenshot showing badge color

4. **Verify expandable error details**
   - Click on the error badge or an expand control on the failed execution row
   - Expected: error details section expands, showing:
     - Error message text
     - SDK error string (if present in `details.sdkError`)
     - Tool name (if present in `details.toolName`)
   - **Screenshot checkpoint:** Take screenshot of expanded error details

5. **Collapse error details**
   - Click the expand control again
   - Expected: details section collapses cleanly
   - **Screenshot checkpoint:** Take screenshot confirming collapse

### Part 2: Retry Logic (ER.4-ER.6)

#### TC-ER2-4: Agent retryPolicy field persisted

1. **Query** `GET http://localhost:3001/api/agents`
   - Find an agent with a non-null `retryPolicy` field
   - Verify: `retryPolicy` is a JSON object with shape `{ maxRetries: number, retryableErrors: string[], backoffMs: number, notifyOnRetry: boolean }`
   - Expected defaults: `maxRetries: 1`, `retryableErrors` includes `"timeout"`, `"sdk_error"`, `backoffMs: 5000`, `notifyOnRetry: true`
   - **Screenshot checkpoint:** N/A (API inspection)

2. **Verify schema migration** for agents table
   - Read: migration SQL file adding `retryPolicy` column to agents table
   - Expected: `retryPolicy` column is TEXT (JSON), nullable, with a sensible default

#### TC-ER2-5: Failed execution auto-retries with correct linking

1. **Identify** a failed execution that was auto-retried
   - Query: `GET http://localhost:3001/api/executions` — look for an execution with `retryCount > 0`
   - Or: look for an execution whose `parentExecutionId` matches another execution's ID
   - **Screenshot checkpoint:** N/A (API inspection)

2. **Verify retry chain**
   - Original execution: `retryCount: 0`, status `"failed"`, has structured `error`
   - Retry execution: `parentExecutionId` equals original's ID, `retryCount: 1`
   - If maxRetries > 1 and second retry exists: `retryCount: 2`, `parentExecutionId` equals original's ID
   - Expected: chain is traceable from retry back to original

3. **Navigate** to `http://localhost:5173/p/pj-global/monitor`
   - Locate the retry execution in history
   - Verify: retry count is visible in the execution row (e.g., "Retry 1/3" or similar indicator)
   - **Screenshot checkpoint:** Take screenshot showing retry count in history

#### TC-ER2-6: execution_retry WebSocket event broadcast

1. **Open browser DevTools** (Network > WS tab or Console)
   - Navigate to `http://localhost:5173/p/pj-global/monitor`
   - Verify: WebSocket connection established to backend

2. **Trigger a retry** (if possible via API or by creating a failing execution)
   - Alternative: Read `packages/backend/src/agent/execution-manager.ts` to verify `execution_retry` event is broadcast
   - Verify: event payload includes `{ executionId, parentExecutionId, retryCount, agentId }`
   - **Screenshot checkpoint:** Take screenshot of WS message if captured live

#### TC-ER2-7: Retry stops after maxRetries reached

1. **Read** `packages/backend/src/agent/execution-manager.ts`
   - Verify: retry logic checks `retryCount < agent.retryPolicy.maxRetries` before scheduling retry
   - Verify: when `retryCount >= maxRetries`, no retry is scheduled and execution stays failed
   - Expected: final failed execution has `retryCount === maxRetries`

2. **Verify via API** (if retry chain exists)
   - Find the last execution in a retry chain
   - Expected: `status: "failed"`, `retryCount` equals `maxRetries`, no child execution with higher retryCount

#### TC-ER2-8: Non-retryable errors skip retry

1. **Read** `packages/backend/src/agent/execution-manager.ts`
   - Verify: retry logic checks `agent.retryPolicy.retryableErrors.includes(error.category)`
   - Verify: errors like `permission_denied`, `configuration_error`, `budget_exceeded` are NOT in the default retryableErrors list
   - Expected: a failed execution with `category: "permission_denied"` has `retryCount: 0` and no child retry

2. **Verify via API** (if such an execution exists)
   - Query: `GET http://localhost:3001/api/executions?status=failed`
   - Find an execution with `error.category` NOT in the agent's `retryableErrors`
   - Expected: no retry execution linked via `parentExecutionId`

#### TC-ER2-9: Retry button on retryable failed executions

1. **Navigate** to `http://localhost:5173/p/pj-global/monitor`
   - Locate a failed execution with a retryable error category (e.g., `timeout`, `sdk_error`)
   - **Screenshot checkpoint:** Take screenshot

2. **Verify "Retry" button** is visible
   - Look for: a "Retry" button (or retry icon) on the failed execution row
   - Expected: button visible for retryable errors
   - Expected: button NOT visible (or hidden) for non-retryable errors (`permission_denied`, `configuration_error`)
   - **Screenshot checkpoint:** Take screenshot showing the retry button

3. **Click "Retry" button**
   - Expected: new execution is created (or queued) for the same work item and agent
   - Expected: UI updates to show new pending/running execution
   - Expected: toast notification confirms retry initiated
   - **Screenshot checkpoint:** Take screenshot after retry triggered

#### TC-ER2-10: Orphan recovery with auto-retry on restart

1. **Read** `packages/backend/src/start.ts`
   - Verify: `recoverOrphanedState()` distinguishes between interrupted (clean) and failed (crash)
   - Verify: for interrupted executions whose agent has retry enabled, auto-retry is scheduled
   - Verify: system notification created for recovered orphans

2. **Verify recovery behavior** (code inspection)
   - Check: orphaned "running"/"pending" executions are set to "interrupted" with structured error
   - Check: if agent's `retryPolicy.retryableErrors` includes "interrupted", a retry execution is scheduled
   - Check: notification text includes execution ID and recovery action taken

### Part 3: Watchdog (ER.7-ER.8)

#### TC-ER2-11: Stuck execution detection via watchdog

1. **Read** `packages/backend/src/agent/execution-manager.ts`
   - Verify: `setInterval` (60s) polls running executions for inactivity
   - Verify: `lastActivityAt` timestamp tracked per execution, updated on every WS event broadcast
   - Verify: threshold defaults to 5 minutes (300,000ms), per-agent override via `retryPolicy`
   - Verify: `execution_stuck` WS event broadcast when threshold exceeded

2. **Verify `execution_stuck` event shape**
   - Expected payload: `{ executionId, agentId, inactiveSince, thresholdMs }`
   - Check: event is only sent once per stuck detection (not repeated every 60s poll)

#### TC-ER2-12: Stuck execution amber banner in Agent Monitor

1. **Navigate** to `http://localhost:5173/p/pj-global/monitor`
   - **Screenshot checkpoint:** Take screenshot

2. **Verify stuck banner behavior** (if a stuck execution exists or can be simulated)
   - Read: `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`
   - Verify: `execution_stuck` WS event triggers an amber warning banner
   - Expected banner text: "No activity for X minutes" (with actual elapsed time)
   - Expected: two buttons in banner — "Force stop" and "Keep waiting"
   - **Screenshot checkpoint:** Take screenshot showing the stuck banner (if visible)

3. **Test "Force stop" button** (if stuck execution available)
   - Click "Force stop" button in the banner
   - Expected: execution cancel endpoint called, execution transitions to "failed" or "interrupted"
   - Expected: banner disappears after force stop
   - Expected: execution row in history shows updated status
   - **Screenshot checkpoint:** Take screenshot after force stop

4. **Test "Keep waiting" button** (if stuck execution available)
   - Trigger (or simulate) another stuck warning
   - Click "Keep waiting" button
   - Expected: banner dismisses, execution continues running
   - Expected: banner does NOT reappear for the same stuck detection cycle
   - **Screenshot checkpoint:** Take screenshot after dismissal

### Part 4: Error UX — Agent Settings (ER.10)

#### TC-ER2-13: Retry policy editor in agent settings

1. **Navigate** to `http://localhost:5173/p/pj-global/agents`
   - Verify: Agent Builder / Agent Manager page loads
   - **Screenshot checkpoint:** Take screenshot, verify page layout

2. **Select an agent** to edit
   - Click on an agent card or row to open the agent editor
   - **Screenshot checkpoint:** Take screenshot of the agent editor

3. **Locate "Error Recovery" section**
   - Look for: a collapsible section labeled "Error Recovery" or "Retry Policy"
   - Click to expand if collapsed
   - **Screenshot checkpoint:** Take screenshot of the expanded error recovery section

4. **Verify retry policy controls**
   - Max retries slider: range 0-3, current value displayed
   - Retryable error checkboxes: one per retryable category (`timeout`, `rate_limit`, `sdk_error`, `interrupted`, etc.)
   - Backoff delay input: numeric input for milliseconds (default 5000)
   - Notify on retry toggle: boolean toggle
   - **Screenshot checkpoint:** Take screenshot showing all controls

5. **Modify the retry policy**
   - Change max retries to 2 (drag slider or click)
   - Uncheck one error category checkbox
   - Change backoff delay to 10000
   - Toggle notify on retry
   - **Screenshot checkpoint:** Take screenshot showing modified values

6. **Save the agent**
   - Click "Save" or equivalent submit button
   - Expected: success toast confirms agent saved
   - **Screenshot checkpoint:** Take screenshot showing success toast

7. **Verify persistence**
   - Refresh the page or re-open the agent editor
   - Expected: all modified retry policy values are retained
   - Query: `GET http://localhost:3001/api/agents/{id}` to confirm `retryPolicy` JSON matches
   - **Screenshot checkpoint:** Take screenshot confirming persisted values

#### TC-ER2-14: Retry policy default for new agent

1. **Create a new agent** (or navigate to a new agent form)
   - Open the "Error Recovery" section
   - Expected defaults: maxRetries = 1, backoffMs = 5000, notifyOnRetry = true
   - Expected: `timeout`, `sdk_error` checked by default; `permission_denied`, `configuration_error` unchecked
   - **Screenshot checkpoint:** Take screenshot showing default values

#### TC-ER2-15: Max retries set to 0 disables retry entirely

1. **Edit an agent** and set max retries slider to 0
   - Expected: retryable error checkboxes become disabled/grayed out (no point configuring if retries disabled)
   - Save the agent
   - **Screenshot checkpoint:** Take screenshot showing disabled checkboxes

2. **Verify via API**
   - Query: `GET http://localhost:3001/api/agents/{id}`
   - Expected: `retryPolicy.maxRetries === 0`
   - Trigger a failure for this agent
   - Expected: no retry execution created

### Part 5: Error UX — Work Items Surface (ER.9)

#### TC-ER2-16: Error badge in execution timeline (Work Items detail)

1. **Navigate** to `http://localhost:5173/p/pj-global/items`
   - Select a work item that has a failed execution
   - **Screenshot checkpoint:** Take screenshot of the work item detail panel

2. **Locate the execution timeline** in the detail panel
   - Find the failed execution entry
   - Verify: error category badge visible on the failed execution (same color coding as Agent Monitor)
   - **Screenshot checkpoint:** Take screenshot showing the badge in timeline

3. **Expand error details** in the timeline entry
   - Click the error badge or expand control
   - Expected: same error detail section as Agent Monitor — message, SDK error, tool name
   - **Screenshot checkpoint:** Take screenshot of expanded details

### Part 6: Dark Mode

#### TC-ER2-17: Error badges and retry UI in dark mode

1. **Switch to dark mode** (via Settings > Appearance)
   - **Screenshot checkpoint:** Take screenshot of settings

2. **Navigate** to `http://localhost:5173/p/pj-global/monitor` in dark mode
   - **Screenshot checkpoint:** Take screenshot of Agent Monitor in dark mode

3. **Verify error badge contrast** in dark mode
   - Locate a failed execution with error badge
   - Expected: red badge has sufficient contrast against dark background
   - Expected: amber badge readable against dark background
   - **Screenshot checkpoint:** Take screenshot showing badges in dark mode

4. **Expand error details** in dark mode
   - Click to expand error details on a failed execution
   - Expected: text readable, SDK error and tool name have correct contrast
   - **Screenshot checkpoint:** Take screenshot of expanded error details in dark mode

5. **Open retry policy editor** in dark mode
   - Navigate to `http://localhost:5173/p/pj-global/agents`, open an agent
   - Expand "Error Recovery" section
   - Expected: slider, checkboxes, input, toggle all visible with correct contrast
   - **Screenshot checkpoint:** Take screenshot of retry policy editor in dark mode

6. **Switch back to light mode** and verify
   - Toggle back to light mode
   - Verify: all error recovery UI renders correctly
   - **Screenshot checkpoint:** Take screenshot for comparison

### Part 7: Edge Cases

#### TC-ER2-18: Execution with null error (pre-migration data)

1. **Query** `GET http://localhost:3001/api/executions`
   - Find an execution with `error: null` (pre-migration or successful execution)
   - Expected: no error badge rendered, no expand control for error details
   - **Screenshot checkpoint:** Take screenshot showing clean execution row without error badge

#### TC-ER2-19: Successful execution has no retry button

1. **Navigate** to `http://localhost:5173/p/pj-global/monitor`
   - Locate a completed (successful) execution
   - Expected: no "Retry" button visible on successful executions
   - Expected: no error badge visible
   - **Screenshot checkpoint:** Take screenshot confirming no retry button on success

#### TC-ER2-20: Running execution not affected by retry UI

1. **Locate a running execution** (if available)
   - Expected: no error badge, no retry button, no stuck banner (unless actually stuck)
   - If no running execution: note as SKIP
   - **Screenshot checkpoint:** Take screenshot if applicable

7. **Take final screenshot** for evidence (full page, light mode)

## Expected Results

- `executions` table has `error` (JSON) and `retryCount` (integer) columns via migration
- `agents` table has `retryPolicy` (JSON) column via migration
- Failed executions store structured `{ category, message, details? }` in the `error` field
- Error category badges visible in Agent Monitor history and execution timeline (work item detail)
- Badge color coding: red for terminal errors, amber for retryable errors
- Expandable error details show message, SDK error, and tool name when available
- "Retry" button visible on failed executions with retryable error categories
- "Retry" button hidden on successful executions and non-retryable failures
- Retry creates a new execution linked via `parentExecutionId` with incremented `retryCount`
- `execution_retry` WS event broadcast on retry creation
- Retry stops after `maxRetries` reached — final execution stays failed
- Non-retryable error categories (`permission_denied`, `configuration_error`, `budget_exceeded`) never trigger automatic retry
- Stuck execution watchdog fires `execution_stuck` WS event after 5 minutes of inactivity
- Amber "stuck" banner appears in Agent Monitor with "Force stop" and "Keep waiting" buttons
- Force stop cancels the execution; keep waiting dismisses the banner
- Retry policy editor in agent settings: max retries slider, error checkboxes, backoff input, notify toggle
- Retry policy changes persist after save and page refresh
- Setting max retries to 0 disables retry and grays out error checkboxes
- Orphan recovery on restart auto-retries interrupted executions for retry-enabled agents
- No console errors during the entire flow

### Visual Quality

- Error category badges: correct color (red/amber), readable text, consistent sizing across surfaces
- Badge text not truncated or clipped within badge container
- Expanded error details: monospace for SDK errors, proper padding, readable contrast
- Retry button: consistent styling with other action buttons in execution rows
- Stuck banner: amber background, readable text, buttons properly aligned within banner
- Stuck banner does not overlap terminal content or other execution rows
- Retry policy editor: slider has tick marks and value label, checkboxes aligned in grid
- Backoff input accepts only numeric values, shows "ms" unit label
- Dark mode: all badges, banners, form controls have sufficient contrast
- Execution rows with retry indicators do not break row alignment or overflow
- Toast notifications for retry and force stop are properly styled

## Failure Criteria

- `error` column missing from executions table or stores raw string instead of JSON object
- `retryCount` column missing or not incremented on retry
- `retryPolicy` column missing from agents table
- Error classification produces wrong category (e.g., timeout classified as unknown)
- Error badge not rendered on failed executions with populated `error` field
- Badge shows wrong color (amber for terminal error, red for retryable error)
- Error details section does not expand or shows "undefined"/"null" for fields
- "Retry" button visible on non-retryable errors or successful executions
- "Retry" button missing on retryable failed executions
- Clicking "Retry" does not create a new execution or throws an error
- Retry execution not linked to original via `parentExecutionId`
- `retryCount` not incremented in retry execution
- `execution_retry` WS event not broadcast
- Retry continues past `maxRetries` (infinite retry loop)
- Non-retryable error (`permission_denied`) triggers automatic retry
- Watchdog does not detect stuck execution after 5+ minutes of inactivity
- `execution_stuck` WS event not broadcast or has wrong payload
- Stuck banner does not appear in Agent Monitor when event received
- "Force stop" does not cancel the execution
- "Keep waiting" does not dismiss the banner
- Retry policy editor missing from agent settings
- Slider, checkboxes, or inputs do not update the retryPolicy JSON
- Retry policy changes not persisted after save
- Setting maxRetries to 0 still allows automatic retries
- Orphan recovery does not auto-retry for retry-enabled agents
- Console errors during any step
- Any step takes more than 10 seconds without visual loading feedback

### Visual Failure Criteria

- Any visual defect counts as a visual failure even if the functional test passes
- Error badge text invisible, clipped, or wrong color for the category
- Expanded error details overflow their container or have unreadable text
- Retry button misaligned with other row actions
- Stuck banner overlaps content, has unreadable text, or buttons are clipped
- Retry policy slider has no value label or tick marks
- Checkboxes misaligned in the error recovery section
- Backoff input allows non-numeric text or is too narrow to show "10000"
- Dark mode: badges wash out, banner contrast insufficient, form controls invisible
- Layout breaks: elements stacked incorrectly, overlapping, or misaligned
- Toast notification truncates retry or force stop confirmation text
