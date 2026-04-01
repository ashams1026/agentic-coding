# Test Plan: Agent Monitor Streaming & Observability

## Objective

Verify the new streaming and observability features in the agent monitor: live token streaming with blinking cursor, progress summary bar, rate limit banner, and context usage bar.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- Database seeded with test data
- chrome-devtools MCP connected
- An active agent execution is required for live streaming features (progress bar, streaming cursor, context usage bar are real-time only)

**Note:** The streaming features (SDK.ST.1-ST.5) require a live agent execution to produce WebSocket events. If no agents are running, most steps will be SKIP. The rate limit banner requires an actual API rate limit event which cannot be reliably triggered in test environments.

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Live Token Streaming (4 steps)

1. **Navigate** to `http://localhost:5173/agents` — Live tab
   - Verify: Agent monitor loads
   - **Screenshot checkpoint:** Take screenshot

2. **If an agent is running:** observe the terminal renderer output
   - Look for: text appearing token-by-token (smooth typing effect, not chunk-by-chunk)
   - Expected: streaming text appends to the current message bubble, not creating separate bubbles per token
   - **Screenshot checkpoint:** Take screenshot (SKIP if no active agent)

3. **Verify blinking cursor** while streaming
   - Look for: emerald colored block (`bg-emerald-400 animate-pulse`) at the bottom of the output
   - Expected: cursor visible during active streaming, disappears after ~500ms of no tokens
   - **Screenshot checkpoint:** Take screenshot (SKIP if no active agent)

4. **Verify cursor disappears** when streaming stops
   - After a tool call or pause in output, the cursor should vanish
   - Expected: no blinking cursor when agent is between messages or using tools
   - (SKIP if no active agent)

### Part 2: Progress Summary Bar (3 steps)

5. **Verify progress summary bar visibility** during a long-running execution
   - Look for: emerald bar below toolbar with pulsing dot and summary text
   - Expected: "Currently: [AI-generated description]..." appears during execution
   - **Screenshot checkpoint:** Take screenshot (SKIP if no active agent or execution too short for progress events)

6. **Verify progress bar updates** (~every 30s)
   - Expected: text changes as the agent works on different aspects of the task
   - (SKIP if execution is too short)

7. **Verify progress bar clears** when execution completes
   - Expected: bar disappears when execution status changes to completed/failed
   - (SKIP if no active agent)

### Part 3: Rate Limit Banner (2 steps)

8. **Verify rate limit message format** (if a rate limit event occurs)
   - Look for: inline text with hourglass emoji: "Rate limited — retrying in Xs (attempt N/M)"
   - Expected: appears in the terminal output stream as a text message
   - (SKIP — rate limits cannot be reliably triggered in test environments)

9. **Verify rate limit message does NOT appear in execution logs**
   - After execution completes, check the logs field — should not contain rate limit messages
   - (SKIP — requires rate limit event)

### Part 4: Context Usage Bar (3 steps)

10. **Verify context usage bar visibility** in toolbar during active execution
    - Look for: small fill bar (16px wide) next to chunk count in toolbar
    - Expected: percentage label with color coding (green <60%, amber 60-80%, red >80%)
    - **Screenshot checkpoint:** Take screenshot (SKIP if no active agent — polling starts after 60s)

11. **Verify token count tooltip** on context usage bar
    - Hover over the bar
    - Expected: tooltip shows "X / Y tokens" (total / max)
    - (SKIP if bar not visible)

12. **Verify context bar is absent** for completed/non-running executions
    - Switch to History tab, expand a completed execution
    - Expected: no context usage bar in toolbar (only shows for live executions receiving WS events)

### Part 5: Visual Quality (2 steps)

13. **Take full-page screenshot** of agent monitor with all streaming elements visible
    - Verify: progress bar, context bar, and streaming cursor integrate cleanly
    - Check: no overlapping elements, proper spacing, dark theme support

14. **Verify dark mode appearance** of new elements
    - Check: emerald cursor visible, progress bar text readable (dark:text-emerald-400), context bar colors correct
    - Expected: all elements have dark mode variants

## Expected Results

- Token streaming: text appends smoothly to current bubble (not separate bubbles per token)
- Blinking cursor: emerald block visible during streaming, gone when idle
- Progress bar: shows AI summary below toolbar, updates periodically, clears on completion
- Rate limit: inline text message with retry countdown (if triggered)
- Context bar: fill bar with color coding and percentage, tooltip shows token counts
- All elements absent when no active execution/data

### Visual Quality

- Streaming cursor: emerald, properly sized (w-2 h-4), animate-pulse smooth
- Progress bar: bg-emerald-500/10 background, pulsing dot, truncated text
- Context bar: 16px rounded, smooth color transitions, tabular-nums percentage
- No overlap between progress bar and toolbar or chat output
- Dark mode: all text readable, colors adapted

## Failure Criteria

- Streaming creates separate bubbles per token instead of appending
- Cursor stays visible permanently (doesn't timeout)
- Progress bar text overflows or clips
- Context bar shows wrong color for percentage range
- Rate limit message logged to execution logs (should be skipped)

### Visual Failure Criteria

- Cursor invisible or wrong color
- Progress bar overlaps toolbar or chat output
- Context bar percentage misaligned with fill bar
- Dark mode: elements invisible or unreadable
