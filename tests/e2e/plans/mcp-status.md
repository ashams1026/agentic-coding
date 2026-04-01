# Test Plan: MCP Server Status Display

## Objective

Verify that MCP server status dots render correctly in the agent monitor toolbar, colors match server state, and click interactions work (reconnect on failed, tooltip on hover).

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- Database seeded with at least one project
- chrome-devtools MCP connected
- An active agent execution is required for MCP status display (dots only show during running executions)

**Note:** The MCP status component polls `GET /api/executions/:id/mcp/status` every 30s during running executions. If no agents are running, the component returns null and dots are hidden. Most steps will be SKIP if no active execution exists.

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Status Dot Visibility (3 steps)

1. **Navigate** to `http://localhost:5173/agents` — Live tab
   - Verify: Agent monitor loads
   - **Screenshot checkpoint:** Take screenshot

2. **Verify MCP dots visible** during a running execution
   - Look for: "MCP" label with colored dots in the toolbar area
   - Expected: at least one dot (the agentops MCP server should show as connected/green)
   - **Screenshot checkpoint:** Take screenshot (SKIP if no active agent)

3. **Verify MCP dots hidden** when no execution is running
   - Switch to History tab or when Live tab shows "No agents running"
   - Expected: no "MCP" label or dots visible
   - **Screenshot checkpoint:** Take screenshot

### Part 2: Dot Colors (3 steps)

4. **Verify green dot** for connected MCP server
   - Look for: emerald colored dot (`bg-emerald-500`)
   - Expected: the agentops MCP server should be green when running
   - (SKIP if no active agent)

5. **Verify tooltip on hover** over a connected dot
   - Hover over the green dot
   - Expected: tooltip showing server name, "connected" status, tool count
   - **Screenshot checkpoint:** Take screenshot (SKIP if no active agent)

6. **Verify red dot styling** for failed server (if any)
   - Look for: red dot with `cursor-pointer` and hover ring
   - Expected: failed servers show red with "Click to reconnect" in tooltip
   - (SKIP — requires MCP server failure, which can't be reliably triggered)

### Part 3: Click Interactions (2 steps)

7. **Click a failed MCP server dot** to reconnect
   - Expected: dot shows `animate-spin` during reconnect, status refreshes after
   - (SKIP — requires failed server)

8. **Click a connected dot** — verify no action
   - Expected: no reconnect triggered for connected servers (only tooltip shown)
   - (SKIP if no active agent)

### Part 4: API Endpoints (3 steps)

9. **Test `GET /api/executions/:id/mcp/status`** for a running execution
   - Call via evaluate_script or curl
   - Expected: returns array of server status objects with name, status fields
   - (SKIP if no running execution)

10. **Test `GET /api/executions/:id/mcp/status`** for a non-existent execution
    - Expected: returns 404 with "No running execution with this ID"

11. **Test `POST /api/executions/:id/mcp/toggle`** with a non-running execution
    - Expected: returns 404

### Part 5: Visual Quality (2 steps)

12. **Take full-page screenshot** with MCP dots visible
    - Verify: dots properly sized (h-2 w-2), aligned in toolbar next to context bar
    - Check: "MCP" label readable, dots spaced correctly

13. **Verify dark mode** appearance
    - Check: dot colors visible against dark toolbar background
    - Expected: emerald/red/amber dots have sufficient contrast

## Expected Results

- MCP dots visible in toolbar only during running executions
- Dot colors: green (connected), red (failed), amber (pending), gray (disabled)
- Tooltip shows: server name, status, error (if failed), tool count (if connected)
- Click failed dot → reconnect with spin animation
- Dots hidden when no execution running
- API returns 404 for non-running executions

### Visual Quality

- Dots properly sized (2x2px circles), rounded-full
- "MCP" label small and muted
- Tooltip positioned below dots
- No overlap with context usage bar or scroll toggle
- Dark mode: dots visible, tooltip readable

## Failure Criteria

- Dots visible when no execution is running
- Wrong color for server status
- Click connected server triggers reconnect
- Tooltip missing server name or status
- API returns 200 for non-existent execution

### Visual Failure Criteria

- Dots too large or overlapping
- "MCP" label invisible
- Tooltip clips off screen
- Dots invisible against toolbar background in dark mode
