# Test Plan: Executor Switching UI

## Objective

Verify that the executor mode toggle in Settings switches between mock and claude modes, the status bar reflects the current mode, and the health endpoint returns the correct state.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- Database seeded with demo data (`pnpm db:seed-demo`)
- chrome-devtools MCP connected
- Development mode (NOT production — executor toggle is hidden in production)

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in results alongside the functional pass/fail.

### Part 1: Health Endpoint Baseline

1. **Fetch** health endpoint: `curl http://localhost:3001/health`
   - Expected: JSON with `status: "ok"`, `executor` field showing current mode (likely "claude" in dev)
   - Record the initial `executor` value

2. **Fetch** executor mode endpoint: `curl http://localhost:3001/api/settings/executor-mode`
   - Expected: JSON with `mode`, `available` (array including "mock" and "claude"), `isProduction: false`
   - Verify: `available` contains at least "mock" and "claude"

### Part 2: Settings Page — Executor Toggle

3. **Navigate** to `http://localhost:5173/settings`
   - Verify: Settings page loads without errors
   - **Screenshot checkpoint:** Take screenshot, examine layout

4. **Locate** the "Agent Executor" section
   - Look for: heading text "Agent Executor"
   - Expected: visible within the Agent Configuration section, with a toggle or radio buttons for "Mock" and "Claude"
   - **Screenshot checkpoint:** Take screenshot, verify toggle is visible and properly styled

5. **Verify** current mode indicator
   - Check: which option is currently selected (highlighted/active)
   - Expected: matches the `mode` from step 2

### Part 3: Switch to Mock Mode

6. **Click** the "Mock" option in the executor toggle
   - Target: button or radio with text "Mock" or "Simulated"
   - Expected: toggle switches to mock, brief loading indicator may appear
   - **Screenshot checkpoint:** Take screenshot, verify toggle updated

7. **Verify** status bar shows "Simulated" badge
   - Look for: amber-colored "Simulated" badge in the bottom status bar
   - Expected: badge appears after switching to mock mode
   - **Screenshot checkpoint:** Take screenshot, verify badge styling (amber background, readable text)

8. **Fetch** health endpoint again: `curl http://localhost:3001/health`
   - Expected: `executor: "mock"`

9. **Fetch** executor mode endpoint: `curl http://localhost:3001/api/settings/executor-mode`
   - Expected: `mode: "mock"`, `available` unchanged

### Part 4: Switch Back to Claude Mode

10. **Click** the "Claude" option in the executor toggle
    - Expected: toggle switches to claude
    - **Screenshot checkpoint:** Take screenshot

11. **Verify** status bar "Simulated" badge disappears
    - Expected: no amber "Simulated" badge visible in status bar
    - **Screenshot checkpoint:** Take screenshot, verify clean status bar

12. **Fetch** health endpoint: `curl http://localhost:3001/health`
    - Expected: `executor: "claude"`

### Part 5: API Validation

13. **Attempt** to set invalid mode via API:
    ```
    curl -X PUT http://localhost:3001/api/settings/executor-mode \
      -H "Content-Type: application/json" \
      -d '{"mode": "nonexistent"}'
    ```
    - Expected: 400 error with message mentioning "Unknown executor mode" and listing available modes

14. **Take final screenshot** of Settings page for evidence

## Expected Results

- Health endpoint `executor` field matches the selected mode
- `GET /api/settings/executor-mode` returns `mode` + `available` array
- Settings toggle shows current mode and switches on click
- Status bar shows "Simulated" badge only in mock mode
- Invalid mode names are rejected with descriptive error
- Toggle is visible in development mode

### Visual Quality

- Executor toggle section has clear heading "Agent Executor"
- Toggle buttons are properly aligned with consistent sizing
- Selected option has visible active state (distinct from unselected)
- "Simulated" badge in status bar has amber background, readable text, consistent padding
- No layout shifts when toggling between modes

## Failure Criteria

- Health endpoint returns wrong executor mode after switching
- `available` array is empty or missing expected modes
- Toggle does not update UI after clicking
- Status bar does not reflect current mode
- Invalid mode accepted (no 400 error)
- Toggle visible in production mode (should be hidden)

### Visual Failure Criteria

- Toggle buttons overlap or misalign
- Selected state indistinguishable from unselected
- "Simulated" badge text unreadable or clipped
- Layout breaks when switching modes
