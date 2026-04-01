# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 04:45 PDT — Review: UX.DARK (approved)

**Reviewed:** Comprehensive dark mode audit.
- 9 screenshots verified covering all 8 views (6 pages + Pico + Command Palette + item detail) ✓
- All pages have proper dark backgrounds, readable text, colored badges visible ✓
- No invisible text, low-contrast elements, missing backgrounds, broken borders, or white flashes ✓
- No bugs found — clean audit
- **Verdict: approved.**

---

## 2026-04-02 04:35 PDT — UX.DARK: Comprehensive dark mode audit

**Done:** Switched to dark mode via Settings > Appearance. Visited all 8 views: Dashboard, Work Items (list + detail panel), Agent Monitor, Activity Feed, Persona Manager, Settings, Pico Chat, and Command Palette. Each page screenshotted and inspected for invisible text, low-contrast elements, missing dark backgrounds, broken borders, and white flashes on navigation. All pages render correctly in dark mode — proper dark backgrounds, readable text, colored badges/labels visible, no white flash between navigations. No bugs found.
**Files:** `TASKS.md`
**Notes:** 9 screenshots in `tests/e2e/results/ux-dark-*.png` (settings, dashboard, items, agents, activity, personas, pico, cmdpalette, item-detail).

---

## 2026-04-02 04:15 PDT — UX.CMD: Audit Command Palette

**Done:** Audited command palette (Cmd+K). Overlay opens as dialog with auto-focused search input. Typing filters — "dash" narrows to 2 results, "Settings" to 2 results, gibberish shows "No results found." empty state. Enter on filtered "Settings" navigates to `/settings`. Clicking work item "User authentication with OAuth2" navigates to `/items` with detail panel open. ArrowDown moves highlight with "Enter" badge. Escape closes palette. All 24 registered commands present: 6 navigation + 2 quick actions + 16 work items. Footer shows keyboard hints (↑↓, ↵, esc). No bugs found.
**Files:** `TASKS.md`
**Notes:** Screenshots in `tests/e2e/results/ux-cmd-*.png` (4 screenshots: open, filtered, workitem-nav, keyboard-nav).

---

## 2026-04-02 04:00 PDT — Review: UX.NAV (approved)

**Reviewed:** Navigation and sidebar audit.
- 5 screenshots verified: dashboard, items, project-selector, 768px responsive, collapsed sidebar ✓
- All 6 page links present and active state highlighted ✓
- SPA navigation confirmed (sidebar UIDs persist across clicks) ✓
- Project selector shows "AgentOps" ✓
- Responsive at 768px + collapsed icon-only mode ✓
- Minor gap: command palette shortcut not explicitly tested, but covered by UX.CMD task
- **Verdict: approved.**

---

## 2026-04-02 03:45 PDT — UX.NAV: Audit navigation and sidebar

**Done:** Audited sidebar navigation. All 6 page links present (Dashboard, Work Items, Agents, Activity, Personas, Settings) with correct URLs. Active page highlighted. Clicked all 6 links — SPA navigation (no full reload, sidebar UIDs persist). Project selector shows "AgentOps" as combobox. Sidebar collapse button works — collapses to icon-only mode, content area expands. Responsive at 768px — sidebar remains visible with labels, content adapts to narrower width. No bugs found.
**Files:** `TASKS.md`
**Notes:** Screenshots in `tests/e2e/results/ux-nav-*.png` (5 screenshots: dashboard, items, project-selector, 768px, collapsed).

---

## 2026-04-02 03:35 PDT — Review: UX.PICO (approved)

**Reviewed:** Pico Chat panel audit.
- 6 screenshots covering all checklist items: open, typing, response, new session, minimized, dark mode ✓
- All features tested: open/close, message send, error display, new session, session switching, dark mode ✓
- SDK error correctly classified as config issue, not UI bug ✓
- No bugs — clean audit
- **Verdict: approved.**

---

## 2026-04-02 03:30 PDT — UX.PICO: Audit Pico Chat panel

**Done:** Audited Pico chat panel. Floating button opens panel with correct styling. Previous session loads with messages and timestamps. Message input functional — typed and sent "What is this project about?" via ⌘Enter. Response shows SDK error (executable not found — expected in dev, not a UI bug) with red error styling and Retry button. New session creates fresh chat with "Woof! I'm Pico" welcome and 4 suggested prompt chips. Session selector dropdown works. Minimize closes panel cleanly. Dark mode verified — proper contrast, readable text. No UI bugs found.
**Files:** `TASKS.md`
**Notes:** Screenshots in `tests/e2e/results/ux-pico-*.png` (6 screenshots). The SDK error on send is a config issue (pathToClaudeCodeExecutable), not a UI bug.

---

## 2026-04-02 03:15 PDT — Review: UX.SETTINGS (approved)

**Reviewed:** Settings page audit — all 8 sections.
- 9 screenshots covering all sections + dark mode ✓
- All sections have real content (not placeholders) ✓
- API key/executor mode covered under Agent Configuration ✓
- Dark mode verified clean ✓
- No bugs found — clean audit
- **Verdict: approved.**

---

## 2026-04-02 03:05 PDT — UX.SETTINGS: Audit Settings page (all sections)

**Done:** Audited all 8 settings sections: Projects (project list + add button), Workflow (auto-routing status, persona assignments per state), Agent Configuration (API key, executor mode toggle, concurrency slider, per-persona limits), Security (sandbox checkbox, allowed domains, denied paths, save button), Costs (monthly cap, warning threshold, daily limit, cost history chart), Appearance (theme Light/Dark/System, density Comfortable/Compact), Service (status, uptime, memory, restarts, restart button), Data (database info, export/import/clear actions). Dark mode verified — all sections render correctly. No bugs found.
**Files:** `TASKS.md`
**Notes:** Screenshots in `tests/e2e/results/ux-settings-*.png` (9 screenshots covering all sections + dark mode).

---

## 2026-04-02 02:50 PDT — Review: UX.PERSONA.TEST (approved)

**Reviewed:** Persona Manager test run and creation audit.
- Create persona: screenshot confirms new card appears with defaults ✓
- Delete persona: real bug found and well-documented (FX.UX.PERSONA.3) ✓
- Validation: code verified at persona-detail-panel.tsx:560 ✓
- Test-run: correctly identified as not wired into UI, filed FX.UX.PERSONA.4 as blocked ✓
- 4 screenshots present, 2 bugs filed with root cause and fix suggestions
- **Verdict: approved.**

---

## 2026-04-02 02:40 PDT — UX.PERSONA.TEST: Audit Persona Manager test run and creation

**Done:** Audited persona creation, deletion, validation, and test-run accessibility. Create: clicking "Create new persona" creates "New Persona" with Sonnet/3 tools defaults, opens detail panel — works correctly. Delete: confirmation dialog shows, persona removed from grid — but leaves detail panel stuck on "Loading..." with 404 error toast (bug filed as FX.UX.PERSONA.3). Validation: code has `disabled={!name.trim()}` on Save button — present. Test-run: `TestRunPanel` exists in `persona-editor.tsx` but page uses `PersonaDetailPanel` — feature not accessible (filed as FX.UX.PERSONA.4 blocked).
**Files:** `TASKS.md` (2 new bugs filed: FX.UX.PERSONA.3, FX.UX.PERSONA.4)
**Notes:** Screenshots in `tests/e2e/results/ux-persona-*.png`.

---

## 2026-04-02 02:25 PDT — Review: UX.PERSONA.LIST (approved)

**Reviewed:** Persona Manager list and editor audit.
- 10 screenshots covering all checklist items: list view, detail panel, edit mode, system prompt editor, tool config, skill browser, subagent browser, dark mode, assistant persona (Pico)
- 2 bugs filed with specific file paths, line numbers, and fix guidance (FX.UX.PERSONA.1 a11y, FX.UX.PERSONA.2 label mismatch)
- Build verified passing
- **Verdict: approved.**

---

## 2026-04-02 02:15 PDT — UX.PERSONA.LIST: Audit Persona Manager list and editor

**Done:** Full audit of `/personas` page. Tested: persona list rendering (6 personas + create card), clicking persona opens detail panel, detail panel read-only mode (description, model, budget, effort, system prompt with markdown, tools, skills, subagents), edit mode (identity fields, avatar picker, model selector, system prompt editor with line numbers and Edit/Preview tabs, tool checkboxes with presets, skill browser dialog with search, subagent browser dialog with search, budget input, effort/thinking dropdowns, save/cancel), assistant persona (Pico) correctly hides edit button and shows "Assistant" badge, dark mode renders correctly. Filed 2 bugs: FX.UX.PERSONA.1 (keyboard a11y on persona cards) and FX.UX.PERSONA.2 (built-in label mismatch between list and detail panel).
**Files:** `TASKS.md` (2 new bugs filed)
**Notes:** Screenshots in `tests/e2e/results/ux-persona-*.png`.

---

## 2026-04-02 02:00 PDT — Review: FX.UX.ACTIVITY.1 (approved)

**Reviewed:** Activity feed events linking to specific work items instead of generic `/items`.
- All 15 `targetPath` instances replaced with `workItemId` from data sources (executions, comments, proposals, WS events)
- `EventRow` changed from `<Link>` to `<div role="button">` with `setSelectedItemId` + `navigate` pattern
- `ProposalUpdatedEvent` correctly handles missing `workItemId` (set to `null`)
- A11y attributes present (role, tabIndex, onKeyDown, focus-visible ring)
- Build passes clean, visual check confirms clicking events navigates to correct work item detail panel
- **Verdict: approved.**

---

## 2026-04-02 01:30 PDT — FX.UX.ACTIVITY.1: Activity feed events link to specific work items

**Done:** Replaced `targetPath: "/items"` with `workItemId` from all data sources (15 instances) in `activity-feed.tsx`. Executions use `exec.workItemId`, comments use `comment.workItemId`, proposals use `proposal.workItemId`, WS events use `e.workItemId`. `ProposalUpdatedEvent` has no workItemId — set to `null`. Changed `EventRow` from `<Link to="/items">` to `<div role="button">` with `setSelectedItemId` + `navigate` pattern. Added a11y (role, tabIndex, onKeyDown, focus-visible). Verified: clicking an event navigates to `/items` and opens correct detail panel.
**Files:** `packages/frontend/src/features/activity-feed/activity-feed.tsx`

---

## 2026-04-02 01:20 PDT — Review: FX.UX.AGENT.2 (approved)

**Reviewed:** MCP status 404 error toast fix.
- Root cause correct: `get()` helper fires `showErrorToast` before throwing
- Fix uses raw `fetch()` returning `[]` on failure — clean, targeted, no global side effects
- McpStatus already handles empty array (renders nothing at line 59)
- Verified: 0 toasts after navigating to `/agents`
- Build passes clean
- **Verdict: approved.** Both agent monitor bugs (FX.UX.AGENT.1-2) resolved.

---

## 2026-04-02 01:15 PDT — FX.UX.AGENT.2: Fix MCP status 404 error toast

**Done:** Root cause: `getMcpStatus` used the `get()` helper which calls `showErrorToast` before throwing — so even though `McpStatus` component catches the error, the toast fires first. Fix: replaced `get()` with raw `fetch()` that returns empty array on non-ok response, bypassing the global error toast. The McpStatus component already handles empty arrays (renders nothing). Verified: navigated to `/agents`, waited 2 seconds — no error toast, 0 toast elements in DOM.
**Files:** `packages/frontend/src/api/client.ts`

---

## 2026-04-02 01:05 PDT — Review: FX.UX.AGENT.1 (approved)

**Reviewed:** Agent monitor Work Item/Parent link fix.
- Both links changed from `<Link to="/work-items/:id">` to `setSelectedItemId` + `navigate("/items")`
- Imports clean: `Link` removed, `useNavigate` + `useWorkItemsStore` + `WorkItemId` added
- Screenshot confirms: "Work Item" click → `/items` with correct detail panel (was 404)
- Matches established pattern (command palette, dashboard activity)
- Build passes clean
- **Verdict: approved.**

---

## 2026-04-02 01:00 PDT — FX.UX.AGENT.1: Fix Work Item/Parent links in agent header

**Done:** Replaced broken `<Link to="/work-items/:id">` with `setSelectedItemId(id)` + `navigate("/items")` in `agent-control-bar.tsx` for both "Work Item" and "Parent" buttons. Changed import from `Link` to `useNavigate`, added `useWorkItemsStore` import. Removed `asChild` prop (no longer wrapping a Link). Verified: clicking "Work Item" on Engineer agent navigates to `/items` and opens "Build login UI component" detail panel. No more 404.
**Files:** `packages/frontend/src/features/agent-monitor/agent-control-bar.tsx`

---

## 2026-04-02 00:50 PDT — Review: UX.ACTIVITY (approved)

**Reviewed:** Activity Feed page audit — 3 screenshots, 1 bug filed.
- Events chronological, grouped by date, distinct colored icons per type
- Filters (Types, personas, time) present
- Scrolling reveals full history (scrollHeight 2487)
- Dark mode: good contrast
- Bug FX.UX.ACTIVITY.1 well-described: same generic `/items` link issue as FX.UX.DASH.3 but in different component
- **Verdict: approved.**

---

## 2026-04-02 00:45 PDT — UX.ACTIVITY: Audit Activity Feed page

**Done:** Audited `/activity` at 1440x900 and dark mode. Events render chronologically grouped by date (Fri Mar 27 through Sat Mar 21). Event types visually distinct with colored icons: Comment (violet), Agent Started/Completed (green), State Change (blue), Proposal Created (amber), Agent Failed (red), Approved (green). Filters: Types dropdown, All personas dropdown, All time dropdown. Scrolling reveals full history (scrollHeight 2487). Dark mode: good contrast, all badges/text readable. Filed 1 bug: FX.UX.ACTIVITY.1 — all event links go to generic `/items` instead of specific work item (same issue as fixed FX.UX.DASH.3 but different component).
**Files:** `tests/e2e/results/ux-activity-initial.png`, `tests/e2e/results/ux-activity-scrolled.png`, `tests/e2e/results/ux-activity-dark.png`

---

## 2026-04-02 00:35 PDT — Review: UX.AGENT.HISTORY (approved)

**Reviewed:** Agent Monitor history view audit — 3 screenshots, 0 new bugs.
- 8 execution entries with all columns (agent, target, started, duration, cost, outcome)
- Summary stats correct (8 runs, $2.77, 88%, 3m 5s)
- Filters present (agent, outcome, duration range)
- Disabled rewind buttons noted — existing FX.UX.REWIND tracks tooltip fix
- Dark mode: good contrast on all badges and text
- **Verdict: approved.**

---

## 2026-04-02 00:30 PDT — UX.AGENT.HISTORY: Audit Agent Monitor history view

**Done:** Audited History tab on `/agents`. Summary stats bar shows: Runs 8, Total Cost $2.77, Success 88%, Avg Duration 3m 5s. Filter controls: All agents dropdown, All outcomes dropdown, Min/Max duration inputs. Table with 6 columns: Agent (with avatar), Target (work item), Started, Duration, Cost, Outcome (Success green / Rejected red badges). 8 execution entries render correctly. Each row has a disabled rewind button (no checkpoints in seed data — existing bug FX.UX.REWIND tracks tooltip fix). Rows are flat display (not expandable). Dark mode: good contrast, all badges and text readable. No new bugs filed.
**Files:** `tests/e2e/results/ux-agent-history-initial.png`, `tests/e2e/results/ux-agent-history-detail.png`, `tests/e2e/results/ux-agent-history-dark.png`

---

## 2026-04-02 00:20 PDT — Review: UX.AGENT.CONTROLS (approved)

**Reviewed:** Agent Monitor controls audit — 2 screenshots, 1 bug filed.
- Stop dialog verified: confirmation with agent name + work item, Cancel/Stop Agent buttons
- Split view: both agents side-by-side with independent terminals
- All panel components correctly traced: ModelSwitcher (line 525), McpStatus (line 570), FileChangesPanel (line 630) in terminal-renderer; RouterDecisionCard + SubagentCard in agent-history
- Conditional rendering in simulated mode correctly documented
- Bug FX.UX.AGENT.2 well-described: MCP 404 → error toast
- **Verdict: approved.**

---

## 2026-04-02 00:15 PDT — UX.AGENT.CONTROLS: Audit Agent Monitor controls and panels

**Done:** Audited agent monitor control panels on `/agents`. Stop button opens confirmation dialog ("Stop agent?" with agent name and work item, Cancel/Stop Agent buttons). Force Stop button also has dialog. Split view shows both agents side-by-side with independent terminals. All panel components are wired into `terminal-renderer.tsx`: ModelSwitcher (line 525, renders as "Sonnet" badge), McpStatus (line 570), FileChangesPanel (line 630). RouterDecisionCard and SubagentCard are in `agent-history.tsx` (history view only). McpStatus and FileChangesPanel render empty in simulated mode (no data). Filed 1 bug: FX.UX.AGENT.2 — McpStatus triggers error toast on 404 response in simulated mode.
**Files:** `tests/e2e/results/ux-agent-controls-split.png`, `tests/e2e/results/ux-agent-controls-stop.png`

---

## 2026-04-02 00:05 PDT — Review: UX.AGENT.MAIN (approved)

**Reviewed:** Agent Monitor main layout audit — 3 screenshots, 1 bug filed.
- Layout verified: sidebar (2 active agents with green dots, descriptions, time, cost) + main area (header + terminal)
- Terminal renderer shows output with auto-scroll toggle
- Split view toggle present, Live/History tabs work
- Bug FX.UX.AGENT.1 well-described: "Work Item"/"Parent" links use `/work-items/:id` → 404 (confirmed in screenshot)
- Dark mode verified: good contrast
- **Verdict: approved.**

---

## 2026-04-02 00:00 PDT — UX.AGENT.MAIN: Audit Agent Monitor main layout

**Done:** Audited `/agents` at 1440x900 and dark mode. Layout renders correctly: left sidebar shows 2 active agents (Engineer, Code Reviewer) with green dots, work item descriptions, elapsed time, cost. Main area shows header bar (agent name, model, time, cost, Work Item/Parent links, Stop/Force Stop buttons) + terminal with output lines. Live/History tabs work. Split view toggle present. Dark mode: good contrast, terminal green-on-dark readable. Filed 1 bug: FX.UX.AGENT.1 — "Work Item" and "Parent" links use non-existent `/work-items/:id` route → 404 error.
**Files:** `tests/e2e/results/ux-agent-main-initial.png`, `tests/e2e/results/ux-agent-main-workitem-link.png`, `tests/e2e/results/ux-agent-main-dark.png`

---

## 2026-04-01 23:50 PDT — Review: UX.DETAIL (approved)

**Reviewed:** Work item detail panel audit — 3 screenshots, 0 bugs.
- All sections verified: title (editable h2), status/priority/labels, description + Edit, children (3 with status + Add child), comments (6 with agent attribution), comment input, execution history (3 entries with success/cost/time), metadata
- Data-rich item chosen (OAuth2) — exercises all panel features
- Scrolling verified (scrollHeight 1484), dark mode good contrast
- **Verdict: approved.**

---

## 2026-04-01 23:45 PDT — UX.DETAIL: Audit detail panel

**Done:** Audited work item detail panel using "User authentication with OAuth2" (data-rich item). All sections render: title (h2, "Click to edit"), status badge (In Progress), Move to/priority dropdowns, labels (auth, security + add), description with Edit button, 3 children with status badges + Add child, 6 comments with agent/user avatars and timestamps, comment input with send button, 3 execution history entries (Router/Tech Lead/Product Manager with success badges, cost, timestamps), ID/Created/Updated metadata. Panel scrolls internally (scrollHeight 1484). Dark mode: good contrast throughout, no broken elements. No bugs filed.
**Files:** `tests/e2e/results/ux-detail-initial.png`, `tests/e2e/results/ux-detail-scrolled.png`, `tests/e2e/results/ux-detail-dark.png`

---

## 2026-04-01 23:35 PDT — Review: FX.UX.ITEMS.1 (approved)

**Reviewed:** Empty state fix for grouped list when all filtered items are children.
- Root cause correct: grouped rendering filters to `parentId === null`, skipping empty state when children exist
- Fix adds `topLevel.length === 0` check in grouped path with "No items match your filters." + "Clear filters" button
- Verified live: "Done" filter now shows message + button (was blank before)
- "Clear filters" button resets to "All states" and restores all items
- Both empty state paths (line 464 and 486) consistently have button
- Build passes clean
- **Verdict: approved.**

---

## 2026-04-01 23:30 PDT — FX.UX.ITEMS.1: Fix empty state when filters match no items

**Done:** Root cause: grouped rendering filters to `parentId === null` top-level items, but the existing empty state only checked `filteredItems.length === 0`. When all matching items are children (e.g. "Done" filter), `filteredItems` is non-empty but `topLevel` is empty — no groups render, no message shown. Fix: added `topLevel.length === 0` check in the grouped rendering path with the same "No items match your filters." message + "Clear filters" button. Also added the "Clear filters" button to the existing empty state (was missing). Both paths call `clearFilters()` + `setFilterState(null)`.
**Files:** `packages/frontend/src/features/work-items/list-view.tsx`

---

## 2026-04-01 23:20 PDT — Review: UX.WORK.CREATE (approved)

**Reviewed:** Work item creation audit — 3 screenshots, 0 bugs.
- Quick-add pattern confirmed: "+ Add" instantly creates "New work item" in Backlog with P2
- Detail panel shows all editable fields: title, status, priority, labels, description, children, comments
- Before/after screenshots show item count 3→4 — creation successful
- Design choice correctly documented (quick-add + edit-in-panel, not form-based)
- **Verdict: approved.**

---

## 2026-04-01 23:15 PDT — UX.WORK.CREATE: Audit Work Item creation

**Done:** Audited work item creation via the "+ Add" button on `/items`. The button is a quick-add — it instantly creates a "New work item" in Backlog with P2 priority (no form). Clicking the new item opens the detail panel where title, description, status, priority, labels, children, and comments are all editable. This is a valid design pattern (quick-add + edit-in-panel) rather than a form-based creation flow. Item appeared correctly in the list under Backlog (count 1→2). Also found UX.WORK.BOARD is blocked (board-view.tsx not wired into UI). No bugs filed.
**Files:** `tests/e2e/results/ux-work-create-before.png`, `tests/e2e/results/ux-work-create-after.png`, `tests/e2e/results/ux-work-create-detail.png`

---

## 2026-04-01 23:05 PDT — Review: UX.WORK.FLOW (approved)

**Reviewed:** Work Items flow view audit — 6 screenshots, 0 bugs.
- All 8 workflow states + Blocked render as nodes with Router edge labels
- Nodes show state name, count, active/idle, items, progress — verified in screenshots
- Click interaction works: filters state dropdown and highlights node
- Scrolling reveals bottom states (In Review, Done) — full diagram accessible
- Dark mode: good contrast, 768px: narrower nodes but functional
- UX.WORK.BOARD correctly blocked (board-view.tsx not wired into UI)
- **Verdict: approved.**

---

## 2026-04-01 23:00 PDT — UX.WORK.FLOW: Audit Work Items flow view

**Done:** Audited `/items?view=flow` at 1440x900, 768px, and dark mode. Flow diagram renders all 8 workflow states + Blocked as nodes connected by "Router" edges. Each node shows state name, count, active/idle status, child items, and progress bar. Clicking a node filters the state dropdown and highlights the node. Scrolling reveals bottom states (In Review, Done). Dark mode: good contrast, all elements visible. 768px: nodes narrower with text squeezed but functional. Also marked UX.WORK.BOARD as blocked (board-view.tsx exists but not wired into UI — WorkItemView type is "list" | "flow" only). No bugs filed.
**Files:** `tests/e2e/results/ux-work-flow-initial.png`, `tests/e2e/results/ux-work-flow-full.png`, `tests/e2e/results/ux-work-flow-scrolled.png`, `tests/e2e/results/ux-work-flow-clicked.png`, `tests/e2e/results/ux-work-flow-dark.png`, `tests/e2e/results/ux-work-flow-768.png`

---

## 2026-04-01 22:50 PDT — Review: UX.WORK.LIST (approved)

**Reviewed:** Work Items list view audit — 9 screenshots, 1 bug filed.
- All task requirements verified: default view, status badges, sort (3 options), state filter (8 states), detail panel, responsive (1024/768), dark mode
- Bug FX.UX.ITEMS.1 well-described: empty filter state is blank with no message — correct finding
- Screenshots cover all required states including edge case (empty filter result)
- **Verdict: approved.**

---

## 2026-04-01 22:45 PDT — UX.WORK.LIST: Audit Work Items list view

**Done:** Audited `/items` list view at 1440x900, 1024x768, 768x900, and dark mode. List view is the default. 3 items render grouped by state (Backlog, Decomposition, In Progress) with correct status badges, priority pills, and progress bars. Clicking an item opens detail panel with description, children, comments. Sort dropdown shows 3 options (priority/created/updated). State filter shows all 8 workflow states with colored dots. Responsive: filter bar wraps gracefully at 1024px (2 rows) and 768px (3 rows). Dark mode: good contrast, all elements visible. Filed 1 bug: FX.UX.ITEMS.1 (no empty state when filters match nothing).
**Files:** `tests/e2e/results/ux-work-list-initial.png`, `tests/e2e/results/ux-work-list-detail.png`, `tests/e2e/results/ux-work-list-sort.png`, `tests/e2e/results/ux-work-list-filter-state.png`, `tests/e2e/results/ux-work-list-empty.png`, `tests/e2e/results/ux-work-list-empty-nodetail.png`, `tests/e2e/results/ux-work-list-1024.png`, `tests/e2e/results/ux-work-list-768.png`, `tests/e2e/results/ux-work-list-dark.png`

---

## 2026-04-01 22:30 PDT — Review: FX.UX.DASH.3 (approved)

**Reviewed:** Activity items now link to specific work items instead of generic `/items`.
- `workItemId` populated from all 5 data sources (executions, comments, proposals) and all 5 WS event types
- `ActivityRow` uses `setSelectedItemId()` + `navigate("/items")` — matches command palette pattern
- Verified live: clicked "Work item started" row → navigated to `/items` with "Build login UI component" detail panel open
- Graceful fallback: if `workItemId` is null, still navigates to `/items` list
- Bonus: activity rows now have a11y attributes (role, tabIndex, keyboard, focus ring)
- Build passes clean
- **Verdict: approved.** All 3 dashboard bugs (FX.UX.DASH.1-3) now resolved.

---

## 2026-04-01 22:25 PDT — FX.UX.DASH.3: Activity items link to specific work item

**Done:** Replaced generic `targetPath: "/items"` with `workItemId` on all `ActivityEvent` objects in `recent-activity.tsx`. Data sources: executions (`exec.workItemId`), comments (`comment.workItemId`), proposals (`proposal.workItemId`), WS events (`e.workItemId`). Changed `ActivityRow` from `<Link to="/items">` to a `<div role="button">` with onClick that calls `setSelectedItemId(workItemId)` then `navigate("/items")` — matching the command palette pattern. Added a11y: `role="button"`, `tabIndex`, `onKeyDown`, `focus-visible` ring. Verified: clicking an activity row navigates to `/items` and opens the correct work item detail panel.
**Files:** `packages/frontend/src/features/dashboard/recent-activity.tsx`
