# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-30 — P.11: Add loading and empty states

**Task:** Add skeleton loading states and empty state messaging across the app.

**Done:**
- **List view**: Improved loading skeleton from plain bars to badge+text+avatar shimmer pattern (5 rows). Added empty states: "No work items yet. Click + to create one." when no items, "No items match your filters." when filters active.
- **Detail panel**: Added loading skeleton (title bar + badges + content placeholders) when item is selected but data not yet loaded. Children section now shows "No children. Click 'Add child' or 'Decompose'." instead of hiding entirely.
- **Dashboard**: Stat card values show shimmer placeholder (`h-8 w-12 animate-pulse`) when loading instead of "—" text.
- **Flow view**: Already had node placeholder skeletons — no changes needed.
- **Comment stream**: Already had "No comments yet." empty state — no changes needed.

**Files modified:** `list-view.tsx`, `detail-panel.tsx`, `dashboard.tsx`

**Notes:** Build: 0 errors. Used `&apos;` for HTML entity in JSX string. Empty state detection checks all filter types (search, state, priority, personas, labels).

---

## 2026-03-30 — Review: P.10 (approved)

**Reviewed:** Tooltips across the app — `tooltip.tsx`, `root-layout.tsx`, `list-view.tsx`, `work-items.tsx`, `detail-panel.tsx`, `filter-bar.tsx`.
- Global: sideOffset default 4, delayDuration 300ms ✓
- List view: state badge, priority badge (with fullName), truncated titles, progress bars, persona avatars ✓
- Work items page: view toggle buttons ("List view"/"Flow view"), quick add ("Create new work item") ✓
- Detail panel: close button ("Close panel") ✓
- Filter bar: sort direction toggle (dynamic), clear filters ✓
- All use `asChild` pattern, `key` correctly on Tooltip in map ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — P.10: Add tooltips across the app

**Task:** Add tooltips to truncated titles, priority/state badges, persona avatars, progress bars, view toggles, and icon buttons. Consistent sideOffset={4}, delay 300ms.

**Done:**
- **Global config**: Updated `TooltipProvider` in `root-layout.tsx` from `delayDuration={0}` to `delayDuration={300}`. Updated tooltip default `sideOffset` from 0 to 4 in `tooltip.tsx`.
- **List view**: Added tooltips to state badge ("State: X"), priority badge ("Priority: Critical/High/Medium/Low"), truncated titles (full title text), progress bars ("N of M children done"), persona avatars ("Name (model)"). Added `fullName` to `priorityConfig`.
- **Work items page**: Added tooltips to view toggle buttons ("List view" / "Flow view") and quick add button ("Create new work item").
- **Detail panel**: Added tooltip to close panel button ("Close panel").
- **Filter bar**: Added tooltip to sort direction toggle ("Ascending"/"Descending") — replaced `title` attribute with proper Tooltip component. Added tooltip to clear filters button ("Clear all filters").

**Files modified:** `root-layout.tsx`, `tooltip.tsx`, `list-view.tsx`, `work-items.tsx`, `detail-panel.tsx`, `filter-bar.tsx`

**Notes:** Build: 0 errors. All tooltips use `asChild` pattern for proper event forwarding. Persona tooltip shows model name (e.g. "Engineer (claude-sonnet-4-6)").

---

## 2026-03-30 — Review: P.9 (approved)

**Reviewed:** Visual divider and panel transition — `work-items.tsx`.
- Divider: `border-l border-border` on resize handle, `border-l-0` when closed ✓
- Transition: `transition-all duration-200` on list pane, handle, and panel ✓
- Jank prevention: transitions gated by `!isResizing` on list and panel, not applied during drag ✓
- Always-rendered: handle and panel wrapper always in DOM for CSS transitions, `DetailPanel` conditionally rendered inside ✓
- Open: list shrinks + panel expands simultaneously. Close: panel collapses + list expands ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — P.9: Add visual divider and panel transition

**Task:** Add border-l between list pane and detail panel. Animate panel open/close with slide-in transition. Smooth expand-back on close.

**Done:**
- **Divider**: Already present from P.8 (`border-l border-border` on resize handle). Now animates open/close — handle transitions from `w-0 opacity-0 border-l-0` to `w-1 opacity-100` with `transition-all duration-200`.
- **Panel transition**: Detail panel and list pane both get `transition-all duration-200` for smooth width animation on open/close. Panel animates from `width: 0%` to `width: N%`.
- **Resize drag optimization**: Transitions are disabled during active resize (`!isResizing` guard) to prevent jank — only applied when user is not dragging.
- **Always-rendered pattern**: Resize handle and panel container are always in the DOM (not conditionally rendered), enabling CSS transitions. `DetailPanel` component still conditionally renders inside the container.

**Files modified:** `work-items.tsx`

**Notes:** Build: 0 errors. Key insight: CSS transitions require elements to exist in the DOM — conditional rendering (React unmount/mount) can't animate. Solved by keeping wrappers always mounted with animated width.

---

## 2026-03-30 — Review: P.8 (approved)

**Reviewed:** Resizable detail panel — `work-items-store.ts`, `work-items.tsx`.
- Store: `detailPanelWidth` (default 60) with 30-70% clamping, persisted in `partialize` ✓
- Resize handle: `w-1 cursor-col-resize` with hover/active highlights, 3-dot grip indicator ✓
- Mouse logic: `onMouseDown` → document `mousemove`/`mouseup` listeners, calculates % from right edge ✓
- Body style overrides (`cursor`, `userSelect`) during drag, cleaned up on mouseup ✓
- Layout: percentage-based widths, list takes full width when no selection ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — P.8: Make detail panel resizable

**Task:** Replace fixed w-2/5 / w-3/5 split with a draggable divider. Track panel width in Zustand (persist to localStorage). Clamp between 30% and 70%.

**Done:**
- **Store**: Added `detailPanelWidth: number` (percentage, default 60) + `setDetailPanelWidth` action with clamping (30-70%). Persisted in `partialize`.
- **Work items page**: Replaced fixed `w-2/5`/`w-3/5` classes with percentage-based `style={{ width }}` driven by store. Added 4px resize handle (`w-1 cursor-col-resize`) between list and detail panel.
- **Resize handle**: `onMouseDown` sets resizing state → `mousemove` on document calculates percentage from mouse position relative to container right edge → `mouseup` stops. Sets `cursor: col-resize` and `user-select: none` on body during drag.
- **Grip indicator**: Three dots centered on handle, visible on hover via group-hover opacity transition.
- **Visual feedback**: Handle highlights with `border-primary/50 bg-primary/10` on hover and during active resize.

**Files modified:** `work-items-store.ts`, `work-items.tsx`

**Notes:** Build: 0 errors. Using `containerRef` + `getBoundingClientRect()` for accurate percentage calculation. Cleanup removes listeners and resets body styles on mouseup or unmount.

---

## 2026-03-30 — Review: P.7 (approved)

**Reviewed:** Sort direction toggle and secondary sort — `work-items-store.ts`, `filter-bar.tsx`, `list-view.tsx`, `work-items.tsx`.
- Store: `SortDir` type, `sortDir` state with default "asc", `setSortDir` + `toggleSortDir` actions ✓
- Persisted in `partialize` for localStorage ✓
- Filter bar: ArrowUp/ArrowDown ghost button grouped with sort dropdown, title attribute for accessibility ✓
- List view: direction multiplier pattern, natural ascending sort with `* dir`, secondary sort (priority→created, dates→priority) ✓
- URL params: bidirectional sync, writes `?sortDir=desc` only when non-default ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — P.7: Add sort direction toggle and secondary sort

**Task:** Add ascending/descending toggle button next to sort dropdown. Add secondary sort. Persist sort direction in URL params.

**Done:**
- **Store**: Added `sortDir: SortDir` ("asc" | "desc"), `setSortDir`, and `toggleSortDir` actions. Persisted `sortDir` in `partialize`.
- **Filter bar**: Added ArrowUp/ArrowDown toggle button next to sort dropdown. Uses `toggleSortDir` on click.
- **List view**: Updated `sortItems` to apply direction multiplier. Changed date sorts to ascending-natural (a.localeCompare(b)) with direction applied on top. Added secondary sort: priority→created date, date sorts→priority.
- **URL params**: Added `?sortDir=desc` sync (omits param when "asc" since that's the default). Reads on mount.

**Files modified:** `work-items-store.ts`, `filter-bar.tsx`, `list-view.tsx`, `work-items.tsx`

**Notes:** Build: 0 errors. Removed unused `SortDir` type import from filter-bar (only used in store). Default sort direction is "asc" — for priority that means P0 first, for dates that means oldest first.

---

## 2026-03-30 — Review: P.6 (approved)

**Reviewed:** Persona and label multi-select filters — `work-items-store.ts`, `filter-bar.tsx`, `list-view.tsx`, `work-items.tsx`.
- Store: array-based `filterPersonas`/`filterLabels` with toggle actions, correctly excluded from localStorage ✓
- Filter bar: DropdownMenu + CheckboxItem pattern for both persona and label dropdowns ✓
- Persona dropdown shows avatar color dots + names from mock data ✓
- Label dropdown uses deterministic hash-based coloring over 10-color palette ✓
- Badge count indicators when filters active ✓
- List view filtering: persona filter AND with other filters, label filter OR within labels ✓
- URL param sync: bidirectional `?personas=` and `?labels=` (comma-separated) ✓
- clearFilters resets both arrays ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — P.6: Add persona and label filters

**Task:** Add multi-select persona and label filter dropdowns to the filter bar. Filter additively (AND) with other filters. Update URL params.

**Done:**
- **Store**: Changed `filterPersona: string | null` → `filterPersonas: string[]` and `filterLabel: string | null` → `filterLabels: string[]`. Added `toggleFilterPersona` and `toggleFilterLabel` toggle actions. Included both in `clearFilters`.
- **Filter bar**: Added persona dropdown (DropdownMenu + CheckboxItems) showing avatar color dot + name from mock personas. Added label dropdown showing color dots (deterministic hash-based coloring) + label text from all unique labels across work items. Both show Badge count when active.
- **List view**: Added `filterPersonas` and `filterLabels` to `filteredItems` memo. Persona filter matches `assignedPersonaId`. Label filter uses OR within labels (item matches if it has ANY selected label).
- **URL params**: Synced `?personas=id1,id2` and `?labels=auth,ui` (comma-separated). Reads on mount, writes on change. Single unified sync effect replaces the separate search-only effect.

**Files modified:** `work-items-store.ts`, `filter-bar.tsx`, `list-view.tsx`, `work-items.tsx`

**Notes:** Build: 0 errors, 145 tests pass. Label colors use a deterministic hash function over 10 colors from the 600-level palette. Personas and labels are not persisted to localStorage (excluded from `partialize`).

---

## 2026-03-30 — Review: P.5 (approved)

**Reviewed:** Text search for work items — `filter-bar.tsx`, `list-view.tsx`, `work-items-store.ts`, `work-items.tsx`.
- Search input at left-most position with Search icon ✓
- 200ms debounce via local state + setTimeout pattern ✓
- Filters by title and description (case-insensitive) ✓
- HighlightedText component with regex split + mark tags, special chars escaped ✓
- URL param sync (`?q=`): reads on mount, writes on change, clears `?q=` when empty ✓
- Clear search via X button (refocuses) and "Clear filters" button ✓
- `handleViewChange` preserves existing URL params ✓
- `searchQuery` correctly excluded from localStorage persistence ✓
- Build: 0 errors, 145 tests pass
- Verdict: **approved**

---

## 2026-03-30 — P.5: Add text search to work items

**Task:** Add search input to filter bar, filter by title/description, debounce at 200ms, highlight matches, sync with URL `?q=` param.

**Done:**
- Added `searchQuery` field + `setSearchQuery` to Zustand store, included in `clearFilters`
- Added search input to filter bar: left-most position, Search icon, X clear button, 200ms debounce via local state + useEffect
- Added text filtering in list-view's `filteredItems` memo: matches against `title` and `description` (case-insensitive)
- Added `HighlightedText` component: regex-based text highlighting with `<mark>` tags (yellow-200 light / yellow-800/60 dark), escapes special regex chars
- Synced `searchQuery` to URL params (`?q=`) in work-items page: reads on mount, updates on change (replace mode)
- Updated `handleViewChange` to preserve existing URL params when switching views

**Files modified:** `work-items-store.ts`, `filter-bar.tsx`, `list-view.tsx`, `work-items.tsx`

**Notes:** Build: 0 errors, 145 tests pass. Debounce uses local state pattern (no external dependency). The `HighlightedText` component is defined inline in list-view.tsx, not extracted to a shared util — keep it local until another consumer needs it.

---

## 2026-03-30 — Review: P.4 (approved)

**Reviewed:** Color palette refinement — `index.css`, `workflow.ts`, + 6 data/component files.
- Light mode card distinct from background (`220 10% 98.5%` vs pure white) ✓
- Dark mode 5-layer surface depth (3.9% → 6% → 14% → 16% → 20%) ✓
- Ring focus token softened for both modes ✓
- All 7 workflow state colors shifted to 600-level in `workflow.ts` ✓
- Theme tokens (status, persona, priority, proposal) all updated in `index.css` ✓
- Mock data updated across frontend fixtures, backend seed, backend test setup ✓
- Hardcoded colors updated in flow-view, detail-panel, persona-editor ✓
- Minor note: `router.ts` internal persona still uses `#6366f1` (indigo-500) — non-blocking, 4:1 contrast
- Build: 0 errors, 145 tests pass
- Verdict: **approved**

---

## 2026-03-30 — P.4: Refine color palette for modern feel

**Task:** Improve card/surface layering, darken badge colors for WCAG AA contrast, add softer ring focus token.

**Done:**
- **Light mode**: Card now `220 10% 98.5%` (subtle off-white, distinct from pure white background). Ring softened from near-black to medium gray-blue (`240 5% 65%`).
- **Dark mode**: Full surface layering — background 3.9% → card 6% → secondary/accent 14% → muted/input 16% → border 20%. Popover 8% for dropdown elevation. Ring softened to `240 5% 45%`.
- **State badge colors**: All workflow states shifted from 500-level → 600-level Tailwind colors for WCAG AA Large Text compliance on light card backgrounds:
  - Planning: `#8b5cf6` → `#7c3aed` (violet)
  - Decomposition: `#6366f1` → `#4f46e5` (indigo)
  - Ready: `#3b82f6` → `#2563eb` (blue)
  - In Progress: `#f59e0b` → `#d97706` (amber)
  - In Review: `#f97316` → `#ea580c` (orange)
  - Done: `#22c55e` → `#16a34a` (green)
  - Blocked: `#ef4444` → `#dc2626` (red)
- **Theme tokens** in index.css: status, persona, priority, and proposal colors all updated to 600-level variants
- **Mock data**: persona avatar colors updated in frontend fixtures, backend seed, and backend test setup
- **Hardcoded colors**: updated in flow-view progress bars, detail-panel priority dots, persona-editor color picker

**Files modified:** `index.css`, `workflow.ts`, `fixtures.ts`, `seed.ts`, `setup.ts`, `flow-view.tsx`, `detail-panel.tsx`, `persona-editor.tsx`

**Notes:** Build: 0 errors, 145 tests pass. Zero old 500-level colors remain in codebase (verified via grep). Colors are still recognizably the same hue family, just one step darker for better readability.

---

## 2026-03-30 — Review: P.3 (approved)

**Reviewed:** Spacing alignment standardization — `card.tsx` + 9 consumer files.
- Card component: `py-4/px-4/gap-4` (was py-6/px-6/gap-6) ✓
- All pages use `p-6` outer padding (Activity Feed fixed from py-4 px-4) ✓
- Dashboard: all redundant CardContent pt/pb overrides removed ✓
- Board view: `p-3` override removed, now uses standard `p-4` ✓
- Work Items header: `mb-6` matches Persona Manager/Settings ✓
- Filter bar gaps: `gap-3` in both filter bars ✓
- Build: 0 errors, 145 tests pass
- Verdict: **approved**

---

## 2026-03-30 — P.3: Audit and fix spacing alignment

**Task:** Standardize page padding, section spacing, card padding, filter bar gaps, and header-to-content spacing across all pages.

**Done:**
- Card component (`card.tsx`): standardized from `py-6/px-6/gap-6` → `py-4/px-4/gap-4` for consistent `p-4` card padding
- Dashboard StatCard: removed redundant `pt-6` from CardContent (Card py-4 handles it)
- Dashboard widgets (RecentActivity, UpcomingWork, CostSummary, ActiveAgentsStrip): removed redundant `pt-4 pb-4` from CardContent
- Board view kanban cards: removed `p-3` override from CardContent (now gets standard p-4)
- Activity Feed page: fixed page padding from `py-4 px-4` → `py-6 px-6` to match all other pages
- Work Items page: header-to-content spacing `mb-4` → `mb-6` for consistency with Dashboard/Persona Manager
- Filter bar gap: `gap-2` → `gap-3` in both work items filter bar and activity feed filter bar

**Files modified:** `card.tsx`, `dashboard.tsx`, `recent-activity.tsx`, `upcoming-work.tsx`, `cost-summary.tsx`, `active-agents-strip.tsx`, `board-view.tsx`, `activity-feed.tsx`, `work-items.tsx`, `filter-bar.tsx`

**Notes:** Build: 0 errors, 145 tests pass. Dashboard uses `p-6 space-y-6` ✓, Work Items `p-6` ✓, Persona Manager `p-6` ✓, Settings content `p-6` ✓, Activity Feed `p-6` ✓. Agent Monitor stays full-bleed (terminal UI, by design). All Card components now default to p-4 padding via CardContent px-4 + Card py-4.

---

## 2026-03-30 — Review: P.2 (approved)

**Reviewed:** Button and badge sizing standardization — `button.tsx`, `badge.tsx` + 8 consumer files.
- Button sizes match spec: default h-8 text-sm, sm h-7 text-xs ✓
- Badge size variant added: default (px-2 py-0.5), sm (px-1.5 py-0.5) ✓
- Icon sizes proportional: icon size-8, icon-sm size-7 ✓
- Redundant overrides cleaned: zero `size="sm" className="h-7"` patterns remaining ✓
- Build: 0 errors, 145 tests pass
- Verdict: **approved**

---

## 2026-03-30 — P.2: Standardize button and badge sizing

**Task:** Converge on two button sizes (sm h-7, default h-8) and two badge sizes (sm, default). Clean up redundant overrides.

**Done:**
- Updated `button.tsx`: default h-9→h-8, sm h-8→h-7 + text-xs, icon size-9→size-8, icon-sm size-8→size-7
- Updated `badge.tsx`: added `size` variant with `default` (px-2 py-0.5) and `sm` (px-1.5 py-0.5)
- Cleaned up redundant className overrides across 8 files:
  - Removed `h-7` overrides from sm buttons (now native)
  - Changed `h-6 text-xs` overrides to `size="xs"`
  - Changed `h-7 w-7` icon overrides to `size="icon-sm"`
  - Changed `h-8 w-8` icon overrides to just `size="icon"` (now native)
  - Removed redundant `text-xs` from sm button classNames

**Files modified:** `button.tsx`, `badge.tsx`, `work-items.tsx`, `detail-panel.tsx`, `agent-control-bar.tsx`, `terminal-renderer.tsx`, `tool-configuration.tsx`, `projects-section.tsx`, `sidebar.tsx`, `activity-feed.tsx`

**Notes:** Build: 0 errors, 145 tests pass. Badge `size="sm"` available for inline badges — existing inline `px-1.5 py-0` overrides still work alongside it.

---

## 2026-03-30 — Review: P.1 (approved)

**Reviewed:** Typography scale standardization — `index.css` + 29 component files.
- 5 `@utility` definitions match task spec exactly (page-title, section-title, body, label, caption) ✓
- Comment block documents the full scale with pixel equivalents and usage guidance ✓
- All 78 arbitrary pixel text sizes (text-[8-11px]) replaced with text-xs ✓
- Zero arbitrary pixel sizes remain in code (verified via grep) ✓
- Build: 0 errors, 145 tests pass
- Verdict: **approved**

---

## 2026-03-30 — P.1: Standardize typography scale

**Task:** Define semantic typography tokens and eliminate arbitrary pixel text sizes.

**Done:**
- Added typography scale documentation and 5 `@utility` definitions to `index.css`:
  - `text-page-title` (text-2xl font-bold), `text-section-title` (text-lg font-semibold)
  - `text-body` (text-sm), `text-label` (text-xs font-medium), `text-caption` (text-xs text-muted-foreground)
- Replaced all arbitrary text sizes across 29 frontend files:
  - `text-[10px]` → `text-xs` (~60 occurrences)
  - `text-[11px]` → `text-xs` (5 occurrences)
  - `text-[9px]` → `text-xs` (11 occurrences)
  - `text-[8px]` → `text-xs` (2 occurrences)
- Zero arbitrary pixel text sizes remain in code (only in index.css documentation comments)

**Files modified:** `packages/frontend/src/index.css` + 29 component files across features/work-items, features/dashboard, features/agent-monitor, features/persona-manager, features/activity-feed, features/settings, features/common, features/demo, features/command-palette, components/sidebar

**Notes:** Build: 0 errors, 145 tests pass. All sizes converge on `text-xs` (12px). The 5 semantic utility classes (`text-page-title`, `text-section-title`, `text-body`, `text-label`, `text-caption`) are defined via Tailwind v4 `@utility` directive and available for new code.
