# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 07:00 PDT — UX.AGENT.BREADCRUMB: Breadcrumb trail + side panel overlay

**Done:** Replaced "Work Item" and "Parent" ghost buttons in `agent-control-bar.tsx` with inline breadcrumb trail (`Parent Title > Work Item Title`) using `ChevronRight` separators. Clicking a breadcrumb segment calls `onWorkItemClick` callback instead of navigating away. Added side panel overlay to `agent-monitor-layout.tsx` — absolute-positioned panel with close button renders `DetailPanel` from work-items feature. Removed `useNavigate` and `useWorkItemsStore` imports from control bar (moved to layout). Added `handleWorkItemClick` callback that sets `selectedItemId` in store and opens the overlay.
**Files:** `packages/frontend/src/features/agent-monitor/agent-control-bar.tsx`, `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`
**Notes:** Cannot visually test breadcrumb with no running agents, but build passes and page renders clean. Breadcrumb only shows when an agent execution has a work item.

---

## 2026-04-02 06:45 PDT — Review: FX.UX.PERSONA.3 (approved)

**Reviewed:** Delete selected persona 404 toast fix.
- `onSelect` prop widened to `PersonaId | null`, `onSelect(null)` called on delete of selected persona ✓
- `deletingSelected` captured before async mutation (avoids stale closure) ✓
- `removeQueries` evicts deleted persona cache before list invalidation — prevents 404 refetch race ✓
- Parent `setSelectedId` signature compatible ✓
- Visual: no toast, detail panel closes cleanly ✓
- Build passes clean ✓
- **Verdict: approved.**

---

## 2026-04-02 06:40 PDT — FX.UX.PERSONA.3: Fix delete selected persona 404 toast

**Done:** Two-part fix: (1) Widened `onSelect` prop type to `PersonaId | null` and added `onSelect(null)` call in `handleDeleteConfirm` when deleting the selected persona — closes the detail panel. (2) Added `queryClient.removeQueries()` for the deleted persona's individual query key in `useDeletePersona` hook — prevents stale query refetch that triggered the `get()` helper's global error toast (same root cause pattern as FX.UX.AGENT.2).
**Files:** `packages/frontend/src/features/persona-manager/persona-list.tsx`, `packages/frontend/src/hooks/use-personas.ts`
**Notes:** Both changes needed — without removeQueries, the toast still fires from a race between cache invalidation and component unmount.

---

## 2026-04-02 06:30 PDT — Review: FX.UX.PERSONA.2 (approved)

**Reviewed:** Built-in persona label mismatch fix.
- `BUILT_IN_IDS` exported from persona-list.tsx, imported in persona-detail-panel.tsx ✓
- `isBuiltIn` check replaced from `settings.isSystem` to `BUILT_IN_IDS.has()` — consistent with list view ✓
- No circular imports, null-safe ✓
- Visual: Engineer detail panel shows "Built-in persona" + badge ✓
- Build passes clean ✓
- **Verdict: approved.**

---

## 2026-04-02 06:25 PDT — FX.UX.PERSONA.2: Fix built-in persona label mismatch

**Done:** Exported `BUILT_IN_IDS` from `persona-list.tsx` and imported it in `persona-detail-panel.tsx`. Replaced `persona?.settings?.isSystem === true` check with `BUILT_IN_IDS.has(persona.id)` to match the same logic used in the list view. Now all built-in personas (PM, Tech Lead, Engineer, Code Reviewer) consistently show "Built-in persona" label and "Built-in" badge in both the card grid and the detail panel.
**Files:** `packages/frontend/src/features/persona-manager/persona-list.tsx`, `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`
**Notes:** Root cause was that only Router and Pico had `isSystem: true` in backend seed data; the other 4 built-in personas didn't. Using `BUILT_IN_IDS` is the authoritative source.

---

## 2026-04-02 06:15 PDT — Review: FX.UX.PERSONA.1 (approved)

**Reviewed:** Persona cards keyboard accessibility fix.
- `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space with preventDefault), focus-visible ring classes all present ✓
- `CreateCard` already a native `<button>` — correctly left unchanged ✓
- Visual verification: Tab focuses cards, Enter opens detail panel ✓
- Build passes clean ✓
- **Verdict: approved.**

---

## 2026-04-02 06:10 PDT — FX.UX.PERSONA.1: Persona cards keyboard accessibility

**Done:** Added `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space), and `focus-visible:ring-2` classes to `PersonaCard` div in `persona-list.tsx`. Cards are now keyboard-navigable via Tab with visible focus ring and activatable via Enter/Space. `CreateCard` was already a `<button>` element — no change needed.
**Files:** `packages/frontend/src/features/persona-manager/persona-list.tsx`
**Notes:** Verified visually — Tab focuses cards with ring, Enter opens detail panel. Screenshots at `tests/e2e/results/fx-persona-a11y-*.png`.

---

## 2026-04-02 06:00 PDT — Review: FX.UX.REWIND (approved)

**Reviewed:** Disabled rewind button tooltip fix.
- `<span className="inline-flex">` wrapper around disabled `<Button>` inside `TooltipTrigger asChild` ✓
- Tooltip shows correct text for both enabled/disabled states ✓
- Visual verification: tooltip visible on hover over disabled buttons in History tab ✓
- Build passes clean ✓
- **Verdict: approved.**

---

## 2026-04-02 05:55 PDT — FX.UX.REWIND: Fix disabled rewind button tooltip

**Done:** Wrapped the disabled `<Button>` inside `<TooltipTrigger asChild>` with a `<span className="inline-flex">` wrapper so the tooltip trigger receives pointer events even when the button is disabled. Tooltip now shows "No file checkpoint available (legacy execution)" on hover over disabled rewind buttons in Agent Monitor History.
**Files:** `packages/frontend/src/features/agent-monitor/agent-history.tsx`
**Notes:** Verified visually — tooltip appears on hover over disabled buttons. Screenshot at `tests/e2e/results/fx-rewind-tooltip-visible.png`.

---

## 2026-04-02 05:45 PDT — Review: FX.PICO.EXEC (approved)

**Reviewed:** Claude Code executable path resolution fix.
- `getClaudeCodeExecutablePath()` helper in config.ts: env var override, createRequire resolution, caching, fallback ✓
- All 4 `query()` call sites have `pathToClaudeCodeExecutable` option: chat.ts:355, claude-executor.ts:559, memory.ts:187, memory.ts:351 ✓
- Imports correct at all 4 files ✓
- Build passes clean ✓
- **Verdict: approved.**

---

## 2026-04-02 05:30 PDT — FX.PICO.EXEC: Fix Claude Code executable not found

**Done:** Added `getClaudeCodeExecutablePath()` helper to `config.ts` that resolves the SDK's bundled `cli.js` path (or uses `CLAUDE_CLI_PATH` env var override). Added `pathToClaudeCodeExecutable` option to all 4 `query()` call sites: `chat.ts` (Pico chat), `claude-executor.ts` (agent execution), and `memory.ts` (2 calls: summarizer + consolidation). The helper uses `createRequire` to resolve the SDK package path, caches the result, and falls back to `"claude"` if resolution fails.
**Files:** `packages/backend/src/config.ts`, `packages/backend/src/routes/chat.ts`, `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/agent/memory.ts`

---

## 2026-04-02 05:15 PDT — Review: UX.RESPONSIVE (approved)

**Reviewed:** Comprehensive responsive audit at 1024px and 768px.
- 12 screenshots verified (6 pages x 2 viewports) ✓
- No horizontal overflow, clipped content, overlapping elements, or broken layouts ✓
- Agent Monitor header at 768px is cramped but all buttons confirmed in DOM via a11y tree ✓
- Grids adapt correctly: dashboard 4→2x2, personas 3-col→2-col, filter bars wrap ✓
- No bugs found — clean audit
- **Verdict: approved.**

---

## 2026-04-02 05:10 PDT — UX.RESPONSIVE: Comprehensive responsive audit

**Done:** Audited all 6 pages at 1024px and 768px viewports (12 screenshots total). At 1024px: sidebar collapses to icons, dashboard shows 4 stat cards in row + 3-col grid, work items filter bar wraps to 2 rows, agent monitor truncates name but all controls visible, personas 3-col grid. At 768px: dashboard 2x2 stat cards + 2-col grid, work items filter bar 3 rows, agent monitor header cramped but all buttons accessible in DOM, personas 2-col grid. No horizontal overflow, no clipped content, no overlapping elements, no broken layouts. No bugs filed.
**Files:** `TASKS.md`
**Notes:** 12 screenshots in `tests/e2e/results/ux-responsive-{1024,768}-{dashboard,items,agents,activity,personas,settings}.png`.

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
