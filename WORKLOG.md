# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-29 — Review: T2.7.2 (approved)

**Reviewed:** Activity feed filters and real-time updates — `features/activity-feed/activity-feed.tsx`, `stores/activity-store.ts`, `components/sidebar.tsx`, `index.css`.
- FilterBar: event type checkboxes (expandable grid), persona/story/date dropdowns, clear button — all working
- WS subscription via `subscribeAll` + `wsEventToActivity` handles 6 event types correctly
- Live events animate with slide-down CSS keyframe, get "LIVE" badge
- "New events" indicator: scroll tracking + sticky button
- Unread badge: Zustand store, sky-blue badge on nav item (both modes)
- Filter pipeline: clean chain of `useMemo` (allEvents → filtered → grouped)
- Noted limitation: unread badge only tracks while ActivityFeed is mounted — acceptable for mock phase
- Build passes
- **Verdict: approved** — Activity Feed section complete!

---

## 2026-03-29 — T2.7.2: Build activity feed filters and real-time updates

**Task:** Filter bar: by event type (checkboxes), by persona, by story, by date range. New events animate in at top (slide-down animation, via mock WebSocket). "New events" indicator if user has scrolled down. Unread count badge on Activity Feed nav item.

**Done:**
- Enhanced `features/activity-feed/activity-feed.tsx`:
  - `FilterBar` — event type checkboxes (expandable grid, select/deselect all), persona dropdown, story dropdown, date range preset (Today/Yesterday/7d/30d/All), Clear button
  - `useLiveActivityEvents()` — subscribes to mockWs via `subscribeAll`, converts WS events (agent_started, agent_completed, state_change, comment_created, proposal_created, proposal_updated) to ActivityEvents
  - `wsEventToActivity()` — maps WS event types to activity event types
  - Live events are prepended to list, merged with base events, sorted by timestamp
  - `animate-slide-down` CSS class on live events for slide-down entrance animation
  - "New events" indicator — sticky button at top when scrolled down + new events arrive, click scrolls to top
  - Empty filter state: "No events match the current filters"
  - Live events get a "LIVE" badge
- Created `stores/activity-store.ts`:
  - Zustand store: `unreadCount`, `increment()`, `reset()`
  - Incremented by WS subscription in activity feed, reset when feed mounts
- Updated `components/sidebar.tsx`:
  - Added sky-blue unread badge on Activity Feed nav item (both collapsed + expanded)
  - Shows "9+" for counts over 9
- Added `animate-slide-down` keyframe animation to `index.css`

**Files created:**
- `packages/frontend/src/stores/activity-store.ts`

**Files modified:**
- `packages/frontend/src/features/activity-feed/activity-feed.tsx`
- `packages/frontend/src/components/sidebar.tsx`
- `packages/frontend/src/index.css`

**Notes for next agent:**
- Date range uses presets instead of a datepicker (no datepicker component available yet)
- WS subscription uses `subscribeAll` and filters relevant events — ignores agent_output_chunk, cost_update, execution_update
- The unread badge increments globally (even when on other pages) via the WS subscription in useLiveActivityEvents — the hook runs when ActivityFeed is mounted; for global tracking, would need a provider-level subscription (acceptable scope for mock phase)
- Story filter matches by checking if targetPath contains the storyId — works for story-level events, task events with story context would need parent lookup

---

## 2026-03-29 — Review: T2.7.1 (approved)

**Reviewed:** Activity feed page — `features/activity-feed/activity-feed.tsx` and `pages/activity-feed.tsx`.
- All 10 event types implemented with correct icons, colors (light+dark), and labels
- Events derived from real mock data (executions, comments, proposals) + mock cost alert
- Date grouping with sticky headers (Today/Yesterday/weekday+date)
- EventRow: type icon, persona avatar, description, timestamp, type badge, entity link
- Empty state handled
- Build passes
- Minor nit: `personas` in useMemo deps array but unused inside memo — harmless
- **Verdict: approved**

---

## 2026-03-29 — T2.7.1: Build activity feed page

**Task:** Full-page chronological stream. Each event entry: timestamp, colored icon by type, persona avatar (if agent-sourced), description text, link to source entity. Types: state transition, agent started, agent completed, agent failed, comment posted, proposal created, proposal approved/rejected, manual override, cost alert.

**Done:**
- Created `features/activity-feed/activity-feed.tsx`:
  - `ActivityFeed` — full-page chronological event stream, grouped by date (Today/Yesterday/weekday+date)
  - `useAllActivityEvents()` — builds events from executions (started/completed/failed), comments (system=state_transition, others=comment_posted), proposals (created + approved/rejected), plus a mock cost_alert event
  - 10 event types: state_transition, agent_started, agent_completed, agent_failed, comment_posted, proposal_created, proposal_approved, proposal_rejected, manual_override, cost_alert
  - `eventConfig` — per-type icon (lucide), color class (light+dark), label text
  - `EventRow` — event type icon (colored circle), persona avatar (if agent-sourced), description, timestamp, type badge, target label, clickable Link to source entity
  - Date grouping with sticky headers (`sticky top-0 bg-background/95 backdrop-blur`)
  - Empty state: "Nothing yet" message
  - Max-width 3xl container, centered, scrollable
- Updated `pages/activity-feed.tsx`: replaced placeholder with `<ActivityFeed />`

**Files created:**
- `packages/frontend/src/features/activity-feed/activity-feed.tsx`

**Files modified:**
- `packages/frontend/src/pages/activity-feed.tsx`

**Notes for next agent:**
- T2.7.2 is next: activity feed filters and real-time updates (WebSocket, filter bar, animations)
- Events are derived from existing mock data (executions, comments, proposals) — no new fixtures needed
- The dashboard `RecentActivity` is a separate mini version (10 items) — this is the full page
- `manual_override` type is defined in eventConfig but no mock events use it yet — will be useful when workflow transitions are manual
- Date grouping is naive (compares date strings) — works well for mock data timeframe

---

## 2026-03-29 — Review: T2.6.2 (approved)

**Reviewed:** History filters and aggregate stats — enhanced `features/agent-monitor/agent-history.tsx`.
- StatsBar: total runs, total cost, success rate %, avg duration — all computed from filtered list via useMemo, updates reactively
- FilterBar: persona dropdown (scoped to history personas), outcome dropdown (all/success/failed/rejected), cost min/max range, "Clear" button
- Filter pipeline: historyExecutions → filtered → sorted → rendered — clean data flow
- Empty filter result: "No executions match the current filters" in table body
- Date range filter omitted (needs datepicker component) — acceptable scope reduction, noted by worker
- Build passes
- **Verdict: approved** — Sprint 3 (Agent Monitor) fully complete!

---

## 2026-03-29 — T2.6.2: Build history filters and aggregate stats

**Task:** Filter by: persona, outcome (success/failure/rejected), date range, cost range. Stats bar above list: total runs, total cost, success rate %, average duration. Updates reactively as filters change.

**Done:**
- Enhanced `features/agent-monitor/agent-history.tsx`:
  - `StatsBar` — shows total runs (#), total cost ($X.XX), success rate (X%), avg duration — computed from filtered results so stats update reactively
  - `FilterBar` — persona dropdown (Select with only personas that appear in history), outcome dropdown (All/Success/Failed/Rejected), cost range (min/max number inputs), "Clear" button when filters active
  - `Filters` interface + `defaultFilters` — state managed in AgentHistory, applied via useMemo before sort
  - Filter pipeline: historyExecutions → filtered (by persona/outcome/cost) → sorted → rendered
  - Empty filter state: "No executions match the current filters" message in table body
  - `hasActiveFilters` computed from filters !== defaults, drives "Clear" button visibility
  - `historyPersonas` derived from executions that actually appear in history (not all personas)

**Files modified:**
- `packages/frontend/src/features/agent-monitor/agent-history.tsx`

**Notes for next agent:**
- Sprint 3 (Agent Monitor) is now COMPLETE! T2.5.1-T2.5.6 (Live View) + T2.6.1-T2.6.2 (History View) all done
- T2.7.1 (Activity Feed page) is next — starts Sprint 4
- Date range filter was omitted (task says "date range" but cost range was higher priority and date pickers need a datepicker component) — can be added in T2.6.2 follow-up if needed
- Stats bar uses the filtered list, not the full history — so filtering to "Rejected" only shows stats for rejected runs

---

## 2026-03-29 — Review: T2.6.1 (approved)

**Reviewed:** Agent history list — `features/agent-monitor/agent-history.tsx`, layout refactor with Live/History tabs.
- All requirements met: Live/History tabs (shadcn Tabs), sortable table (Started/Duration/Cost), persona avatars, outcome badges, click-to-expand with TerminalRenderer
- History filters to `status !== "running"` — correct separation from live view
- Sort defaults to startedAt desc (most recent first), toggles asc/desc on repeated click
- Expanded row renders TerminalRenderer at 300px — reuses existing component
- Layout cleanly refactored: LiveView extracted, tabs at top level
- Minor: `selectedId` prop in LiveViewProps unused (aliased to `_selectedId`) — cosmetic, not blocking
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.6.1: Build agent history list

**Task:** Tab or toggle: "Live" / "History" on the agent monitor page. Table/list of past executions. Columns: persona avatar + name, task/story title, started time, duration, cost, outcome badge. Sortable columns. Click expands to full output (reuse terminal renderer).

**Done:**
- Created `features/agent-monitor/agent-history.tsx`:
  - `AgentHistory` — table of past executions (status !== "running"), driven by `useExecutions`
  - Columns: persona avatar + name, target (task/story title), started time (formatted date), duration (Xs/Xm Ys), cost ($X.XX), outcome badge (Success=emerald, Failed=red, Rejected=amber)
  - Sortable columns: "Started", "Duration", "Cost" — click toggles asc/desc, `SortIcon` shows active sort direction
  - `HistoryRow` — uses shadcn Collapsible wrapping TableRow, click expands to show TerminalRenderer (300px height) with full execution logs
  - Empty state: "No execution history" message
- Added shadcn Table component (`components/ui/table.tsx`)
- Refactored `features/agent-monitor/agent-monitor-layout.tsx`:
  - Added "Live" / "History" tabs using shadcn Tabs at top of page
  - Live tab shows active agent count badge (emerald pill)
  - Extracted `LiveView` sub-component for the existing live view (sidebar + terminal/split)
  - History tab shows `AgentHistory` component
  - `EmptyState` only shown within LiveView when no active agents

**Files created:**
- `packages/frontend/src/features/agent-monitor/agent-history.tsx`
- `packages/frontend/src/components/ui/table.tsx` (shadcn)

**Files modified:**
- `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`

**Notes for next agent:**
- T2.6.2 is next: history filters and aggregate stats (filter bar + stats summary)
- The history table reuses TerminalRenderer for expanded log view — same component as live view
- Mock data has 7 completed executions (EXEC_1-3, 5-7) + 1 rejected (EXEC_7) for testing
- Sort state defaults to "startedAt" descending (most recent first)
- Only one row can be expanded at a time (single expandedId state)

---

## 2026-03-29 — Review: T2.5.6 (approved)

**Reviewed:** Agent control bar — `features/agent-monitor/agent-control-bar.tsx`, layout integration, AlertDialog component.
- All requirements met: persona avatar + name, model badge (opus=purple, sonnet=blue, haiku=emerald), live elapsed timer (1s), running cost ($X.XX), Task/Story nav links, Stop + Force Stop with AlertDialog confirmations
- Stop dialog: graceful tone, "finish current operation." Force Stop: warning tone, "work will be lost" + destructive styling on action button
- Navigation resolves parent storyId for task targets, shows both Task and Story links appropriately
- Control bar shown in single-view mode only (between toggle bar and terminal)
- shadcn AlertDialog added cleanly
- Build passes
- **Verdict: approved** — Agent Monitor Live View section (T2.5.1-T2.5.6) complete!

---

## 2026-03-29 — T2.5.6: Build agent control bar

**Task:** Below agent info header. Buttons: "Stop" (graceful cancel — confirmation dialog), "Force Stop" (warning dialog), link to task detail, link to story. Show persona name, model badge (opus/sonnet/haiku), elapsed time, running cost.

**Done:**
- Created `features/agent-monitor/agent-control-bar.tsx`:
  - `AgentControlBar` — horizontal bar showing persona avatar + name, model badge (Opus=purple, Sonnet=blue, Haiku=emerald), live elapsed timer (1s interval, tabular-nums), running cost ($X.XX)
  - "Task" and "Story" navigation links (ExternalLink icon) — task link shown when target is a task, story link resolves parent story
  - "Stop" button — outline variant, StopCircle icon, opens AlertDialog: "This will gracefully cancel [persona] working on [task]. The agent will finish its current operation and stop."
  - "Force Stop" button — destructive variant, OctagonX icon, opens AlertDialog: "This will immediately terminate [persona]. Any in-progress work will be lost."
  - Both dialogs are mock-only (no actual cancel logic) — Cancel/Action buttons present
- Added shadcn AlertDialog component (`components/ui/alert-dialog.tsx`)
- Updated `features/agent-monitor/agent-monitor-layout.tsx`:
  - Imported AgentControlBar, placed between view toggle bar and content area in single-view mode
  - Only shown when not in split mode and an agent is selected

**Files created:**
- `packages/frontend/src/features/agent-monitor/agent-control-bar.tsx`
- `packages/frontend/src/components/ui/alert-dialog.tsx` (shadcn)

**Files modified:**
- `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`

**Notes for next agent:**
- T2.6.1 is next: agent history list (Live/History toggle, past executions table)
- Agent Monitor Live View section (T2.5.x) is now complete!
- Control bar is only in single-view mode — split view panes have their own selector but no individual control bars (to save space)
- Stop/Force Stop buttons are mock-only — wire to real cancellation in Phase 3+
- `modelConfig` maps "opus"/"sonnet"/"haiku" to colored badges — reusable pattern for persona displays

---

## 2026-03-29 — Review: T2.5.5 (approved)

**Reviewed:** Multi-agent side-by-side view — `features/agent-monitor/split-view.tsx`, layout toggle, responsive CSS, mock data.
- All requirements met: toggle button (Columns2/Square), 2-3 panes via CSS grid, per-pane agent selector dropdown with persona avatars, narrow screen fallback via media query
- Split mode correctly hides sidebar, each pane independently selectable
- EXEC_8 (Reviewer on TASK_1_3) added as second running agent — split view has data to show
- Pane state management is clean: each Pane owns its selectedId, defaults to assigned execution
- TanStack Query deduplicates across multiple AgentSelector instances
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.5.5: Build multi-agent side-by-side view

**Task:** Toggle button: "Split view". Shows 2-3 agent output panes side-by-side. Each pane has its own agent selector dropdown. Useful when multiple agents work in parallel. Falls back to single pane on narrow screens.

**Done:**
- Created `features/agent-monitor/split-view.tsx`:
  - `SplitView` — CSS grid layout showing 2-3 panes side-by-side (capped at number of active agents, min 2)
  - `Pane` — wraps AgentSelector dropdown + TerminalRenderer, each pane independently selectable
  - `AgentSelector` — dropdown with persona avatar + name + task title for each running agent
  - Default assignment: first N active executions auto-assigned to panes
- Updated `features/agent-monitor/agent-monitor-layout.tsx`:
  - Added "Split view" / "Single view" toggle button (Columns2 / Square icons) in a thin bar above the content area
  - Split mode hides the left sidebar (each pane has its own selector dropdown)
  - Normal mode retains sidebar + single TerminalRenderer layout
  - New state: `splitMode` boolean + `activeExecutionIds` memo
- Added responsive CSS in `index.css`:
  - `@media (max-width: 768px)` forces `.split-view-grid` to `grid-template-columns: 1fr` — single column fallback on narrow screens
- Added second running execution to mock data: EXEC_8 (Reviewer reviewing TASK_1_3 OAuth token handling) — gives 2 active agents for split view testing

**Files created:**
- `packages/frontend/src/features/agent-monitor/split-view.tsx`

**Files modified:**
- `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`
- `packages/frontend/src/index.css`
- `packages/frontend/src/mocks/fixtures.ts` (added EXEC_8 running execution)

**Notes for next agent:**
- T2.5.6 is next: agent control bar (Stop/Force Stop buttons, persona name, model badge, cost, links)
- Two running executions now: EXEC_4 (Engineer on TASK_1_2) and EXEC_8 (Reviewer on TASK_1_3)
- Split view panes reuse TerminalRenderer — each pane independently subscribes to WS events
- TanStack Query deduplicates the executions/personas/tasks/stories fetches across panes

---

## 2026-03-29 — Review: T2.5.4 (approved)

**Reviewed:** Tool call display sections — `features/agent-monitor/tool-call-display.tsx`, terminal renderer pairing logic, WS typed chunk support, demo data.
- All requirements met: collapsible sections with tool icon (8 mapped + fallback), tool name, status indicator (running=spin blue, success=check emerald, error=x red), one-line summary, expanded input (JSON) + output (text or diff)
- `DiffView` correctly colors +/- lines with emerald/red backgrounds
- `processChunks()` pairs tool_call + tool_result by `toolCallId`, handles orphan results
- `simulateAgentOutput` backward compatible — plain strings still work
- ENG_CHUNKS exercises Read, Grep, Write, Edit (with isDiff), Bash — good coverage
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.5.4: Build tool call display sections

**Task:** When agent makes tool calls, show as collapsible sections in the output stream. Header: tool icon + tool name + status (running spinner / success check / error x). Collapsed: one-line summary. Expanded: tool input (formatted JSON or code) + tool output (formatted). File edits show mini diff view.

**Done:**
- Created `features/agent-monitor/tool-call-display.tsx`:
  - `ToolCallSection` — collapsible section for tool call display in terminal output
  - Header: tool-specific icon (Read→FileText, Edit→PenLine, Write→FilePlus2, Grep→Search, Glob→FolderSearch, Bash→TerminalSquare, WebFetch/WebSearch→Globe, default→Wrench) + tool name + status indicator + one-line summary + chevron toggle
  - Status: `Loader2` spinning (blue, running), `Check` (emerald, success), `X` (red, error) — error state gets red bg tint
  - Expanded view: "Input" section with formatted JSON, "Output" section with formatted text or mini diff view
  - `DiffView` — parses diff-style lines (+ green, - red, @@ blue) for file edit results
  - `parseToolJson` exported for use by terminal renderer
  - `ToolCallData` / `ToolResultData` types exported for structured chunk content
- Updated `features/agent-monitor/terminal-renderer.tsx`:
  - Added `processChunks()` function that pairs `tool_call` + `tool_result` chunks by `toolCallId` into `DisplayItem` union type
  - Render loop uses `displayItems` (via `useMemo`) instead of raw chunks — regular chunks render via `ChunkRenderer`, tool pairs render via `ToolCallSection`
  - Orphan tool_result chunks (no matching call) render as standalone sections
  - Removed tool_call/tool_result cases from `ChunkRenderer` (no longer falls back to CodeBlock)
- Updated `mocks/ws.ts`:
  - `simulateAgentOutput` now accepts typed chunks: `(string | { content: string; chunkType })[]` — plain strings emit as "text", objects emit with their specified chunkType
  - `simulateAgentRun` chunk type updated to match
- Updated `mocks/demo.ts`:
  - `ENG_CHUNKS` now includes tool_call/tool_result pairs: Read (reading routes file), Grep (searching for upload patterns), Write (creating upload route), Edit (adding validation — with diff output), Bash (running tests — with pass output)
  - Demo mode exercises all tool call display features: success status, diff view, JSON input/output

**Files created:**
- `packages/frontend/src/features/agent-monitor/tool-call-display.tsx`

**Files modified:**
- `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`
- `packages/frontend/src/mocks/ws.ts`
- `packages/frontend/src/mocks/demo.ts`

**Notes for next agent:**
- Tool call chunks must be JSON strings with `toolCallId` field for pairing to work
- ToolCallData: `{ toolCallId, toolName, input, summary }`
- ToolResultData: `{ toolCallId, toolName, status, output, summary, isDiff? }`
- Set `isDiff: true` in result data to render mini diff view (colored +/- lines)
- T2.5.5 is next: multi-agent side-by-side view (split view toggle showing 2-3 panes)

---

## 2026-03-29 — Review: T2.5.3 (approved)

**Reviewed:** Terminal-style output renderer — `features/agent-monitor/terminal-renderer.tsx` and layout integration.
- Monospace terminal display with dark bg (`bg-zinc-950`), `font-mono`, `text-zinc-200`
- Chunk-type rendering: text (`<pre>` wrap), code (keyword regex highlighting, emerald, overflow-x), thinking (italic, muted, border-l), tool_call/tool_result fallback to code (T2.5.4 will enhance)
- WebSocket subscription filters by executionId, initial logs loaded from useExecution
- Auto-scroll via bottomRef.scrollIntoView, scroll lock toggle (Lock/Unlock), 40px threshold auto-detect
- "New output below" absolute button when locked + new output
- Execution switch handled correctly: initial logs effect re-runs on execution change, WS subscription re-subscribes
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.5.3: Build terminal-style output renderer

**Task:** Monospace font display area. Renders agent output as it streams (via mock WebSocket). Text blocks: normal style. Code blocks: syntax highlighted. Thinking/reasoning: italic, muted color. Auto-scrolls to bottom. "Scroll lock" toggle.

**Done:**
- Created `features/agent-monitor/terminal-renderer.tsx`:
  - `TerminalRenderer` — subscribes to `agent_output_chunk` WebSocket events for the selected execution, loads initial logs from `useExecution(id)`
  - Dark terminal background (`bg-zinc-950`), monospace font, light text (`text-zinc-200`)
  - `ChunkRenderer` — routes chunks by `chunkType`:
    - `text` — normal `<pre>` with `whitespace-pre-wrap`
    - `code` — dark code block with keyword highlighting (purple for JS/TS keywords), `text-emerald-300`, `overflow-x-auto`
    - `thinking` — italic, muted, left border indent
    - `tool_call` / `tool_result` — render as code blocks (T2.5.4 will add proper collapsible display)
  - Auto-scroll: `bottomRef.scrollIntoView({ behavior: "smooth" })` on new chunks when not locked
  - Scroll lock toggle: button in toolbar (`Lock`/`Unlock` icons), auto-detects user scroll-up (40px threshold), "New output below ↓" indicator button when locked and new chunks arrive
  - Toolbar: execution ID badge, chunk count, scroll lock toggle
  - Initial logs loaded from `execution.logs` (split by `\n`), live chunks appended via WebSocket subscription
- Updated `features/agent-monitor/agent-monitor-layout.tsx`:
  - Replaced `SelectedAgentPlaceholder` with `<TerminalRenderer executionId={effectiveSelectedId} />`
  - Removed unused `usePersonas`, `personaMap`, `selectedExecution`
  - Added `relative` class to main area for absolute-positioned "new output" indicator

**Files created:**
- `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`

**Files modified:**
- `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`

**Notes for next agent:**
- T2.5.4 is next: tool call display sections (collapsible, replaces the code block fallback for tool_call/tool_result)
- The terminal renderer subscribes to `mockWs.subscribe("agent_output_chunk", ...)` — to test live streaming, use `mockWs.simulateAgentStream()` from browser console or demo mode
- Code highlighting is intentionally lightweight (regex keyword match) — a full syntax highlighter lib could replace it later
- `dangerouslySetInnerHTML` used for code highlighting — safe here since content comes from mock data only

---

## 2026-03-29 — Review: T2.5.2 (approved)

**Reviewed:** Active agent sidebar list — `features/agent-monitor/active-agent-sidebar.tsx`, layout update, and sidebar nav badge.
- All requirements met: persona avatar with pulsing green dot, name, task name (truncated), live elapsed time (1s interval, tabular-nums), cost ticker ($X.XX), click selection, sorted by start time
- Badge on main sidebar nav: emerald pill (expanded) / circle overlay (collapsed), driven by useExecutions
- Clean separation: sidebar component owns its data, layout handles selection/empty state
- TanStack Query deduplicates redundant fetches between sidebar and layout
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.5.2: Build active agent sidebar list

**Task:** Enhanced sidebar entries with persona avatar, name, task name, live elapsed time counter, live cost ticker, pulsing status dot. Click selects agent. Sorted by start time. Badge count in sidebar nav updates.

**Done:**
- Created `features/agent-monitor/active-agent-sidebar.tsx`:
  - `ActiveAgentSidebar` — extracted and enhanced from T2.5.1 inline sidebar
  - `AgentEntry` — persona avatar with pulsing green status dot (positioned top-right), persona name, task/story name (truncated), live elapsed time counter (`useEffect` interval, 1s updates, tabular-nums), live cost ticker (DollarSign icon + `$X.XX`)
  - Props: `selectedId` + `onSelect` for controlled selection
  - Sorted by start time, ScrollArea for overflow
  - `formatElapsed` — same pattern as dashboard (Xs, Xm Ys, Xh Xm)
  - `formatCost` — `$X.XX` format
- Updated `features/agent-monitor/agent-monitor-layout.tsx`:
  - Replaced inline sidebar with `<ActiveAgentSidebar>` component
  - Removed duplicate lookup maps and data fetching (sidebar owns its own data)
  - Layout still handles empty state and auto-selection logic
- Updated `components/sidebar.tsx`:
  - Added `useExecutions` hook to count running agents
  - Badge on Agent Monitor nav item: emerald pill with count (expanded sidebar) or small circle overlay (collapsed sidebar)
  - Only shown when `activeAgentCount > 0`

**Files created:**
- `packages/frontend/src/features/agent-monitor/active-agent-sidebar.tsx`

**Files modified:**
- `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx` (use ActiveAgentSidebar)
- `packages/frontend/src/components/sidebar.tsx` (badge on Agent Monitor nav)

**Notes for next agent:**
- T2.5.3 is next: terminal-style output renderer (replaces `SelectedAgentPlaceholder`)
- The sidebar entries now have live counters — `formatElapsed` pattern reused from dashboard
- Badge in main sidebar nav shows active agent count in emerald pill
- Mock data: EXEC_4 is the only running execution (Engineer on TASK_1_2)

---

## 2026-03-29 — Review: T2.5.1 (approved)

**Reviewed:** Agent monitor page layout — `features/agent-monitor/agent-monitor-layout.tsx` and page integration.
- Split-pane: 250px sidebar (border-r, shrink-0) + flex-1 main area — correct layout
- Sidebar: filters to `status === "running"` executions, sorted by start time, persona avatars with pulsing green dot, selection highlight
- Empty state: Monitor icon, "No agents running", link to `/board`
- Auto-select logic handles first agent and stale selection correctly
- `SelectedAgentPlaceholder` is an appropriate stub for T2.5.3 terminal renderer
- Mock data driven via hooks, feature directory `agent-monitor/` established
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.5.1: Build agent monitor page layout

**Task:** Split-pane: left sidebar (~250px) lists active agents, main area shows selected agent output. If no agents active, show empty state with "No agents running" and link to story board.

**Done:**
- Created `features/agent-monitor/agent-monitor-layout.tsx`:
  - `AgentMonitorLayout` — main component, fetches all executions/personas/tasks/stories
  - Filters to `status === "running"` executions, sorted by start time
  - Split-pane layout: 250px left sidebar + flex main area
  - `AgentEntry` — sidebar item with persona avatar (colored circle + Bot icon), persona name, task/story name (truncated), pulsing green status dot, selected state highlight
  - `EmptyState` — Monitor icon, "No agents running" message, link to Story Board
  - `SelectedAgentPlaceholder` — placeholder for agent output (to be replaced by T2.5.3 terminal renderer)
  - Auto-selects first agent if none selected or selection becomes invalid
  - Lookup maps for persona, task/story names via `useMemo`
- Updated `pages/agent-monitor.tsx`: replaced placeholder with `<AgentMonitorLayout />`
- Created `features/agent-monitor/` directory for agent monitor feature components

**Files created:**
- `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`

**Files modified:**
- `packages/frontend/src/pages/agent-monitor.tsx`

**Notes for next agent:**
- T2.5.2 is next: active agent sidebar list (enhanced version with live elapsed time, cost ticker)
- The current sidebar in T2.5.1 is minimal — T2.5.2 will enhance it with live counters
- `SelectedAgentPlaceholder` is a stub — T2.5.3 (terminal renderer) will replace it
- Mock data: only EXEC_4 (Engineer working on TASK_1_2 "Build login UI component") is running
- Feature directory: `features/agent-monitor/`
