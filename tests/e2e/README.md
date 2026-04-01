# AI-Based E2E Testing

AI-driven end-to-end testing for AgentOps via browser automation. An AI agent reads a test plan, interacts with the real running application through the browser, and reports pass/fail results.

## How It Works

Each **test plan** is a markdown file in `tests/e2e/plans/` containing step-by-step instructions that an AI agent can follow using browser DevTools (via chrome-devtools MCP). Plans reference UI elements by visible text, aria labels, or semantic selectors — not implementation details.

**Test results** are written to `tests/e2e/results/YYYY-MM-DD_HHMM_<test-name>/` — each run gets a timestamped directory containing the report `.md` and its screenshots.

## Prerequisites

Before running any test plan, ensure:

1. **Backend running** on `http://localhost:3001`
   ```bash
   cd packages/backend && pnpm dev
   ```

2. **Frontend running** on `http://localhost:5173` (or `:5174`)
   ```bash
   cd packages/frontend && pnpm dev
   ```

3. **API mode set to "api"** — In the app's Settings, ensure the data source is set to "API" (not "Mock"). Alternatively, the UI store should have `apiMode: "api"`.

4. **Database seeded** — Run the seed script to populate test data:
   ```bash
   cd packages/backend && pnpm seed
   ```

5. **chrome-devtools MCP connected** — The AI agent needs access to the chrome-devtools MCP server to interact with the browser. Ensure it is configured and connected.

## Running a Test Plan

1. Open a browser and navigate to `http://localhost:5173`
2. Read the test plan file (e.g., `tests/e2e/plans/dashboard-stats.md`)
3. Follow each step using the chrome-devtools MCP tools:
   - `navigate_page` — go to a URL
   - `click` — click an element by selector or text
   - `type_text` — type into an input
   - `take_screenshot` — capture current state
   - `evaluate_script` — run JS to check DOM state
   - `wait_for` — wait for an element to appear
4. Record pass/fail for each step
5. Write results to `tests/e2e/results/YYYY-MM-DD_HHMM_{plan-name}/{plan-name}.md`

## Test Plan Format

See `tests/e2e/plans/_template.md` for the standard format. Each plan includes:

- **Objective** — What the test verifies
- **Prerequisites** — App state needed before the test
- **Steps** — Numbered actions (navigate, click, type, verify)
- **Expected Results** — What a passing test looks like
- **Failure Criteria** — What constitutes a failure

## Directory Structure

```
tests/e2e/
  README.md          ← This file
  plans/
    _template.md     ← Standard test plan format
    dashboard-stats.md
    work-items-list-view.md
    ...
  results/
    2026-03-30_1607_dashboard-stats/
      dashboard-stats.md
      dashboard-stats-full.png
    2026-03-30_1616_work-items-list-view/
      work-items-list-view.md
      ...
    ...
```
