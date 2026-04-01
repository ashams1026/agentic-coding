# Test Plan: Model Switching in Agent Monitor

## Objective

Verify that the model dropdown appears on running executions in the agent monitor, the confirmation dialog works, and the model badge updates after switching.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- Database seeded with at least one project
- chrome-devtools MCP connected
- An active agent execution is required for the model dropdown (only visible for running executions)

**Note:** The `ModelSwitcher` component shows a Select dropdown only for running executions. For completed/non-running executions, it falls back to a static Badge. The dropdown fetches models from `GET /api/executions/:id/models` which requires a running query.

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Static Badge for Non-Running (3 steps)

1. **Navigate** to `http://localhost:5173/agents` — History tab
   - Verify: Agent monitor loads
   - **Screenshot checkpoint:** Take screenshot

2. **Expand a completed execution**
   - Look for: persona identity header with model badge
   - Expected: static Badge showing model name (e.g., "Sonnet", "Haiku") — NOT a dropdown
   - **Screenshot checkpoint:** Take screenshot (SKIP if no executions)

3. **Verify badge is NOT a dropdown** for completed executions
   - Expected: no Select trigger, just a `<Badge>` with text
   - Click the badge — should have no interaction

### Part 2: Dropdown for Running Execution (4 steps)

4. **Switch to Live tab** with a running execution
   - Look for: persona header with model Select dropdown instead of static badge
   - Expected: small dropdown with current model name, border-0 bg-secondary/50 styling
   - **Screenshot checkpoint:** Take screenshot (SKIP if no active agent)

5. **Open the model dropdown**
   - Click the model selector
   - Expected: list of available models from `supportedModels()` API
   - **Screenshot checkpoint:** Take screenshot (SKIP if no active agent)

6. **Select a different model**
   - Expected: AlertDialog confirmation appears: "Switch model? Switch from X to Y? This may increase costs."
   - **Screenshot checkpoint:** Take screenshot (SKIP if no active agent)

7. **Cancel the switch**
   - Click "Cancel" in the confirmation dialog
   - Expected: dialog closes, model remains unchanged

### Part 3: Confirm Model Switch (2 steps)

8. **Select a different model again** and click "Switch"
   - Expected: model switches, badge updates to new model name
   - Button shows "Switching..." during the API call
   - **Screenshot checkpoint:** Take screenshot (SKIP if no active agent)

9. **Verify model API endpoint**
   - Test `POST /api/executions/:id/model` for a non-running execution
   - Expected: returns 404

### Part 4: Visual Quality (2 steps)

10. **Take screenshot** of persona header with model dropdown visible
    - Verify: dropdown compact (h-6, text-[10px]), aligned with persona name
    - Check: no overlap with other header elements

11. **Verify dark mode** appearance
    - Check: dropdown trigger readable, options visible, confirmation dialog styled
    - Expected: bg-secondary/50 backdrop, proper contrast

## Expected Results

- Static Badge for completed/non-running executions (no dropdown)
- Select dropdown for running executions with available models
- Clicking different model opens AlertDialog confirmation with cost warning
- "Cancel" dismisses dialog without switching
- "Switch" calls API and updates badge
- API returns 404 for non-running executions

### Visual Quality

- Dropdown compact and aligned in persona header
- AlertDialog properly centered with title, description, Cancel/Switch buttons
- Badge text updates immediately after switch
- Dark mode: all elements readable

## Failure Criteria

- Dropdown appears for completed executions (should be static badge)
- No confirmation dialog before switching
- Model doesn't actually change after confirming
- API returns 200 for non-running execution

### Visual Failure Criteria

- Dropdown too large for persona header
- AlertDialog clips off screen
- Badge text invisible after switch
- Dropdown overlaps persona name or avatar
