# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 00:55 PDT — FND.GA.10: E2E test plan for Global Agents Phase 1

**Done:** Wrote `tests/e2e/plans/global-agents-phase1.md` with 7 test cases covering all Global Agents Phase 1 features: TC-GA-1 (selector persistence across navigations), TC-GA-2 (dashboard aggregated view with Global badge and Projects Overview table), TC-GA-3 (Work Items disabled in global scope with tooltip), TC-GA-4 (Agent Monitor scope badges and filter dropdown), TC-GA-5 (New Run modal with persona picker and form validation), TC-GA-6 (Pico scope toggle and persona picker creating fresh sessions), TC-GA-7 (standalone execution endpoint returning 201 with validation). Follows existing test plan template format with screenshot checkpoints and visual quality criteria.
**Files:** `tests/e2e/plans/global-agents-phase1.md` (new)

---

## 2026-04-02 00:45 PDT — Review: FND.GA.9 (approved)

**Reviewed:** Backend nullable projectId in chat sessions + persona override.
- `POST /api/chat/sessions`: both `projectId` and `personaId` optional, empty body → 201 ✓
- Validates project/persona when provided (404) ✓
- `projectId: null` stored for global scope ✓
- `POST /api/chat/sessions/:id/messages`: optional `personaId` overrides default Pico ✓
- Falls back to `isAssistant === true` persona when no override ✓
- `serializeSession` handles nullable projectId ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-02 00:40 PDT — FND.GA.9: Backend nullable projectId in chat sessions + persona override

**Done:** Updated `POST /api/chat/sessions` to accept optional `projectId` and `personaId`. Removed 400 guard for missing projectId — now creates session with `projectId: null` for global scope. Validates project/persona exist when provided (404). Returns 201 instead of 200. Updated `POST /api/chat/sessions/:id/messages` to accept optional `personaId` in body — when provided, loads that persona instead of default Pico for the chat response. Fixed `serializeSession` to handle nullable `projectId` with null coalescing.
**Files:** `packages/backend/src/routes/chat.ts`

---

## 2026-04-02 00:30 PDT — Review: FND.GA.8 (approved)

**Reviewed:** Pico scope toggle and persona picker in chat panel header.
- `scopeOverride` and `selectedPersonaId` in pico-store with proper types and persistence ✓
- Scope dropdown: Follows sidebar / Global / per-project with `__follow__` ↔ null mapping ✓
- Persona dropdown: Pico (default) / other personas with `__pico__` ↔ null mapping ✓
- Both call `newSession()` on change ✓
- Active scope badge when non-default values selected ✓
- Compact 11px styling fits the small panel ✓
- Build passes; visual check confirmed
- **Verdict: approved.**

---

## 2026-04-02 00:25 PDT — FND.GA.8: Pico scope toggle and persona picker

**Done:** Added `scopeOverride` (null = follows sidebar, `"__global__"` = global, or projectId) and `selectedPersonaId` (null = Pico default) to `pico-store.ts`, persisted via zustand. In `chat-panel.tsx` added a compact bar below the header with two Select dropdowns: scope (Follows sidebar / Global / per-project) and persona (Pico / other personas). When either changes, `newSession()` is called to create a fresh session. Active scope badge shown when non-default values are selected. Both dropdowns use 11px text and borderless style to stay compact in the small panel.
**Files:** `packages/frontend/src/features/pico/pico-store.ts`, `packages/frontend/src/features/pico/chat-panel.tsx`

---

## 2026-04-02 00:15 PDT — Review: FND.GA.7 (approved)

**Reviewed:** Backend POST /api/executions/run standalone endpoint.
- Route accepts `{ personaId, prompt, projectId?, budgetUsd? }` with proper validation ✓
- 400 for missing fields, 404 for invalid persona/project ✓
- Creates execution with `workItemId: null`, `status: "pending"`, returns 201 ✓
- Route placement before `:id` routes avoids collision ✓
- Schema: only executions.workItemId made nullable; comments/proposals/memories remain notNull ✓
- Migration `0010_puzzling_micromax.sql`: standard table recreation ✓
- 8 downstream TS fixes: null guards in dashboard, executions, start.ts — all correct ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-02 00:10 PDT — FND.GA.7: Backend POST /api/executions/run endpoint

**Done:** Added `POST /api/executions/run` route to `executions.ts` accepting `{ personaId, prompt, projectId?, budgetUsd? }`. Validates persona and optional project exist (404 if not). Creates execution with `workItemId = null`, `status: "pending"`, stores prompt in summary. Returns 201 with execution id. Also made `workItemId` nullable in DB schema (removed `.notNull()`) and generated migration `0010_puzzling_micromax.sql`. Fixed 8 downstream TypeScript errors from nullable `workItemId`: dashboard.ts (3 filter guards), executions.ts (filter guard + rewind null check + non-null assertions), start.ts (filter null workItemIds for orphan recovery).
**Files:** `packages/backend/src/routes/executions.ts`, `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0010_puzzling_micromax.sql` (new), `packages/backend/drizzle/meta/*`, `packages/backend/src/routes/dashboard.ts`, `packages/backend/src/start.ts`

---

## 2026-04-02 00:00 PDT — Review: FND.GA.6 (approved)

**Reviewed:** Agent Monitor "New Run" modal.
- Persona picker from `usePersonas()` with real personas list ✓
- Scope selector: Global / Project with conditional project picker ✓
- Prompt textarea + budget input with validation ✓
- `canSubmit` guards: personaId + prompt + valid scope ✓
- Submit calls `runExecution()` via centralized `post()` helper ✓
- Success/error toasts via `useToastStore` ✓
- Form resets on close; `submitting` state prevents double-submit ✓
- Button in tab bar next to scope filter, Live tab only ✓
- Build passes; visual check confirmed modal with all fields + real persona data
- **Verdict: approved.**

---

## 2026-04-01 23:55 PDT — FND.GA.6: Agent Monitor "New Run" modal

**Done:** Created `new-run-modal.tsx` with Dialog containing: persona picker (populated from `usePersonas()`), scope selector (Global / Project with conditional project picker), prompt textarea, budget input. "Start Run" disabled until persona + prompt + valid scope filled. On submit calls `POST /api/executions/run` via new `runExecution()` API function. Shows success/error toast via `useToastStore`. Added `runExecution` + `RunExecutionRequest` type to API client + exports. Wired "+ New Run" button into `agent-monitor-layout.tsx` tab bar next to scope filter (Live tab only).
**Files:** `packages/frontend/src/features/agent-monitor/new-run-modal.tsx` (new), `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`

---

## 2026-04-01 23:40 PDT — Review: FND.GA.5 (approved)

**Reviewed:** Agent Monitor scope badges and filter.
- Scope badge per execution row: violet "Global" for no workItemId, secondary with project name otherwise ✓
- Scope resolved via workItemId → projectId → projectName chain with proper memoization ✓
- Scope filter dropdown in tab bar: All / Global Only / per-project ✓
- Filter hidden on History tab ✓
- `totalRunning` separate from filtered count for accurate badge ✓
- Build passes; visual check confirmed dropdown with all options
- **Verdict: approved.**

---

## 2026-04-01 23:35 PDT — FND.GA.5: Agent Monitor scope badges and filter

**Done:** Added scope badge to each execution row in `active-agent-sidebar.tsx` — shows project name (secondary badge) or "Global" (violet badge) based on whether execution has a workItemId. Added scope filter dropdown in `agent-monitor-layout.tsx` tab bar (right side, Live tab only) with options: All / Global Only / per-project. Filter narrows active executions list. Uses workItemId → projectId lookup via work items for scope determination. Badge and filter hidden on History tab.
**Files:** `packages/frontend/src/features/agent-monitor/active-agent-sidebar.tsx`, `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`

---

## 2026-04-01 23:25 PDT — Review: FND.GA.4 (approved)

**Reviewed:** Dashboard scope-awareness with global aggregated view.
- "All Projects" heading with "Global" badge when `projectId === null` ✓
- Aggregated stats via `useDashboardStats(undefined)` ✓
- `AllProjectsSummary` component: project table with name/path/created + empty state ✓
- Project-scoped widgets replaced by summary table in global scope ✓
- Sidebar Work Items dimmed: `opacity-40`, `cursor-not-allowed`, `preventDefault`, `aria-disabled` ✓
- Tooltip "Select a project to view work items" on hover ✓
- Build passes; visual check confirmed both scopes render correctly
- **Verdict: approved.**

---

## 2026-04-01 23:20 PDT — FND.GA.4: Dashboard scope-awareness

**Done:** When `projectId` is null (global scope), dashboard shows "All Projects" heading with "Global" badge, "Aggregated status across all projects." subtitle, and per-project summary table (Projects Overview card with name, path, created date). Stat cards show aggregated data across all projects (backend already supports this). Normal project-scoped widgets (ActiveAgentsStrip, RecentActivity, UpcomingWork, CostSummary) replaced by the summary table. Sidebar Work Items link dimmed with `opacity-40 cursor-not-allowed` when global scope active; tooltip shows "Select a project to view work items"; click is prevented via `preventDefault`.
**Files:** `packages/frontend/src/pages/dashboard.tsx`, `packages/frontend/src/components/sidebar.tsx`

---

## 2026-04-01 23:10 PDT — Review: FND.GA.3 (approved)

**Reviewed:** "All Projects" option in sidebar project selector.
- `SelectItem value="__all__"` at top of dropdown ✓
- Auto-select effects guarded with `isGlobalScope` in both sidebar and use-selected-project ✓
- API calls use `effectiveProjectId` mapping `"__all__"` → `undefined` ✓
- `useSelectedProject` returns `projectId: null` for global scope ✓
- Worker used `"__all__"` sentinel instead of `null` — sound decision to avoid ambiguity with initial state
- Build passes; visual check confirmed dropdown works and persists across navigation
- **Verdict: approved.**

---

## 2026-04-01 23:05 PDT — FND.GA.3: Add "All Projects" option to sidebar project selector

**Done:** Added "All Projects" `SelectItem` with value `"__all__"` at the top of the sidebar project dropdown. When selected, `selectedProjectId` stores `"__all__"` (not null) to distinguish from uninitialized state. Updated auto-select `useEffect` in both `sidebar.tsx` and `use-selected-project.ts` to skip when `"__all__"` is set. API calls in sidebar use `effectiveProjectId` that maps `"__all__"` to `undefined`. `useSelectedProject` hook returns `projectId: null` when global scope is active. Collapsed sidebar tooltip shows "All Projects" correctly.
**Files:** `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/hooks/use-selected-project.ts`
**Notes:** Used `"__all__"` sentinel string in store (persisted via zustand) rather than null — this avoids ambiguity with initial null state that triggers auto-select.

---

## 2026-04-01 22:46 PDT — Review: FND.GA.2 (approved)

**Reviewed:** AgentScope type and nullable entity fields in shared package.
- `AgentScope` discriminated union with project/global variants ✓
- `Execution.workItemId` → `WorkItemId | null` ✓
- `ChatSession.projectId` → `ProjectId | null` ✓
- 4 downstream TS fixes: null-safe patterns in agent-monitor + work-items ✓
- Other interfaces unchanged (WorkItem, Comment, etc. remain non-null) ✓
- Full build passes
- **Verdict: approved.**

---

## 2026-04-01 22:42 PDT — FND.GA.2: Add AgentScope type and update entity types

**Done:** Added `AgentScope` discriminated union type to `entities.ts`. Made `Execution.workItemId` nullable (`WorkItemId | null`) and `ChatSession.projectId` nullable (`ProjectId | null`). Fixed 4 downstream TypeScript errors: `active-agent-sidebar.tsx` and `agent-history.tsx` (show "Standalone" for null workItemId), `flow-view.tsx` (null-guard on map lookup), `list-view.tsx` (null-guard on Set.add). All packages build.
**Files:** `packages/shared/src/entities.ts`, `packages/frontend/src/features/agent-monitor/active-agent-sidebar.tsx`, `packages/frontend/src/features/agent-monitor/agent-history.tsx`, `packages/frontend/src/features/work-items/flow-view.tsx`, `packages/frontend/src/features/work-items/list-view.tsx`

---

## 2026-04-01 22:36 PDT — Review: FND.GA.1 (approved)

**Reviewed:** Schema migration for Global Agents Phase 1.
- `chatSessions.projectId`: nullable, no cascade ✓
- `executions.projectId`: new nullable column with FK ✓
- `global_memories` table: all required columns with proper types/defaults ✓
- Migration SQL correct (table create, chat_sessions rebuild, ALTER TABLE) ✓
- chat.ts: null-safe project lookup and env var spread ✓
- Build passes; backend starts; table verified
- **Verdict: approved.**

---

## 2026-04-01 22:32 PDT — FND.GA.1: Schema migration for Global Agents

**Done:** Made `chatSessions.projectId` nullable (removed `.notNull()` and `onDelete: "cascade"`). Added nullable `projectId` column to `executions` with FK to `projects.id`. Created `global_memories` table with `id`, `personaId` (NOT NULL), `summary`, `keyDecisions` (JSON), `createdAt`, `consolidatedInto`. Generated Drizzle migration `0009_sudden_mathemanic.sql`. Fixed two TypeScript errors in `chat.ts` where code assumed `session.projectId` was non-null (project lookup + MCP env var). Backend starts without errors; all three schema changes verified via sqlite3.
**Files:** `packages/backend/src/db/schema.ts`, `packages/backend/src/routes/chat.ts`, `packages/backend/drizzle/0009_sudden_mathemanic.sql` (new), `packages/backend/drizzle/meta/_journal.json`

---

## 2026-04-01 22:24 PDT — Review: FND.WIL.8 (approved)

**Reviewed:** "Recently deleted" recovery view in Settings > Data.
- `recently-deleted.tsx`: fetches deleted items, renders title/date/days-left/[Restore], empty state, loading skeleton ✓
- `getDeletedWorkItems`/`restoreWorkItem` API functions use centralized helpers with error handling ✓
- Backend `serializeWorkItem` fix: `archivedAt`/`deletedAt` now explicitly serialized via `toIso()` ✓
- Wired into `DataSection` between Database and Actions with proper separators ✓
- Build passes; visual check clean (empty state + item row with Restore verified by worker)
- **Verdict: approved.**

---

## 2026-04-01 22:18 PDT — FND.WIL.8: Settings "Recently deleted" recovery view

**Done:** Created `recently-deleted.tsx` with a component that fetches `GET /api/work-items?deleted=true` and renders a table showing title, delete date, days remaining, and [Restore] button. Items past 30-day grace show "Permanently deleted" badge instead. Wired into `DataSection` in `appearance-section.tsx` between Database and Actions. Added `getDeletedWorkItems` and `restoreWorkItem` to API client + exports. Fixed `serializeWorkItem` in backend to explicitly serialize `archivedAt`/`deletedAt` fields (were missing from JSON responses). Visual check: delete date, countdown badge, Restore button all render correctly; restore removes item and shows success toast.
**Files:** `packages/frontend/src/features/settings/recently-deleted.tsx` (new), `packages/frontend/src/features/settings/appearance-section.tsx`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`, `packages/backend/src/routes/work-items.ts`

---

## 2026-04-01 22:08 PDT — Review: FND.WIL.7 (approved after rework)

**Reviewed:** Rework of `bulkDeleteWorkItems` error handling in client.ts.
- `!res.ok` guard added with `showErrorToast()` + `throw new Error()` ✓
- Pattern matches `del()` helper (lines 109-115) ✓
- React Query will now correctly see rejection on 409/500, preventing false `onSuccess` ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-01 22:05 PDT — FND.WIL.7 (rework): Fix bulkDeleteWorkItems error handling

**Done:** Added `!res.ok` guard to `bulkDeleteWorkItems` in client.ts — now calls `showErrorToast()` and throws on failure, matching the `del()` helper pattern. On 409/500, React Query will now correctly trigger `onError` instead of `onSuccess`.
**Files:** `packages/frontend/src/api/client.ts`

---

## 2026-04-01 22:00 PDT — Review: FND.WIL.7 (rejected)

**Reviewed:** Bulk action bar for multi-select — store, API, hooks, list-view UI.
- Store: `selectedIds`, `toggleSelectId`, `clearSelection` correct, not persisted ✓
- Hooks: `useBulkArchiveWorkItems`, `useBulkDeleteWorkItems` invalidate `["workItems"]` ✓
- list-view.tsx: Checkbox, bulk bar, bulk delete dialog, both render paths wired ✓
- Visual check: checkbox renders, Archived badge shows, layout clean ✓
- **Issue:** `bulkDeleteWorkItems` in client.ts:205-212 bypasses centralized error handling — raw `fetch()` without `showErrorToast` or `throw`. On 409/500, React Query treats resolved promise as success, so `onSuccess` clears selection and closes dialog even though delete failed. User sees no error.
- **Verdict: rejected.** Fix: add `!res.ok` guard with `showErrorToast` + throw, matching `del()` pattern.

---

## 2026-04-01 21:50 PDT — FND.WIL.7: Frontend bulk action bar for multi-select

**Done:** Added `selectedIds`, `toggleSelectId`, `clearSelection` to work-items-store.ts. Created `bulkArchiveWorkItems`/`bulkDeleteWorkItems` API functions in client.ts (bulk delete uses direct fetch since `del()` doesn't support body). Created `useBulkArchiveWorkItems`/`useBulkDeleteWorkItems` hooks. Added Checkbox to each `ListRow` for multi-select. When items are selected, a sticky bottom bar shows "N items selected" with [Archive], [Delete], [Clear] buttons. Bulk archive shows success toast; bulk delete opens confirmation AlertDialog. Both tree and grouped render paths pass `isMultiSelected`/`onToggleMultiSelect`. Visual check: checkbox toggles selection, bulk bar appears with correct count and buttons.
**Files:** `packages/frontend/src/stores/work-items-store.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`, `packages/frontend/src/hooks/use-work-items.ts`, `packages/frontend/src/hooks/index.ts`, `packages/frontend/src/features/work-items/list-view.tsx`

---

## 2026-04-01 21:43 PDT — Review: FND.WIL.6 (approved)

**Reviewed:** Archive/delete actions in context menus and detail panel.
- `archiveWorkItem`/`unarchiveWorkItem` API functions with correct paths and return types ✓
- `useArchiveWorkItem`/`useUnarchiveWorkItem` hooks invalidate workItems on success ✓
- list-view.tsx: both tree (:488) and grouped (:657) paths wrapped in ContextMenu with Archive/Unarchive + Delete ✓
- `handleArchive` shows toast with Undo (calls unarchive); `handleDeleteConfirm` clears selection ✓
- `deleteDialog` defined once before grouped rendering (no "used before declaration") ✓
- detail-panel.tsx: Archive/Unarchive button conditional on `archivedAt`, overflow menu with Delete, AlertDialog ✓
- Build passes; visual check clean
- **Verdict: approved.**

---

## 2026-04-01 21:38 PDT — FND.WIL.6: Archive/delete actions in context menus and detail panel

**Done:** Added shadcn context-menu component. Created `archiveWorkItem`/`unarchiveWorkItem` API functions in client.ts and exported from index.ts. Created `useArchiveWorkItem`/`useUnarchiveWorkItem` hooks in use-work-items.ts. In list-view.tsx: wrapped all `ListRow` renders (both tree and grouped paths) with `ContextMenu` — shows Archive/Unarchive (based on archived state) and Delete. Delete triggers `AlertDialog` confirmation. Archive shows success toast with [Undo] action. In detail-panel.tsx: added Archive/Unarchive icon button and overflow menu with Delete in the header. Delete opens confirmation dialog. Both use the shared toast store for undo. Visual check confirmed: overflow menu shows Delete in red; detail panel buttons render correctly.
**Files:** `packages/frontend/src/components/ui/context-menu.tsx` (new), `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`, `packages/frontend/src/hooks/use-work-items.ts`, `packages/frontend/src/hooks/index.ts`, `packages/frontend/src/features/work-items/list-view.tsx`, `packages/frontend/src/features/work-items/detail-panel.tsx`

---

## 2026-04-01 21:28 PDT — Review: FND.WIL.5 (approved)

**Reviewed:** "Show archived" toggle and archived item styling.
- Store: `showArchived` with setter, default false, in clearFilters(), not persisted ✓
- API: `getWorkItems` passes `includeArchived` param; query key includes it for cache separation ✓
- Filter bar: Archive toggle button with secondary/outline variants, tooltip, hasFilters check ✓
- List view: `isArchived` prop, `opacity-50`, "Archived" badge with icon; both renderTree and grouped paths pass it ✓
- Build passes; visual check clean
- **Verdict: approved.**

---

## 2026-04-01 21:25 PDT — FND.WIL.5: Frontend "Show archived" toggle and archived item styling

**Done:** Added `showArchived` state to `work-items-store.ts` with setter and inclusion in `clearFilters()`. Updated `getWorkItems` API client to accept `includeArchived` param. Updated `query-keys.ts` and `useWorkItems` hook to include `includeArchived` in query key and API call. Added "Archived" toggle button (with Archive icon) to `filter-bar.tsx` — uses `variant="secondary"` when active. Updated `ListRow` in `list-view.tsx`: accepts `isArchived` prop, renders with `opacity-50` and an "Archived" badge (outline variant with Archive icon) when item has `archivedAt` set. Both tree and grouped render paths pass the new prop. Visual check: toggle button renders correctly, archived items show badge with muted styling.
**Files:** `packages/frontend/src/stores/work-items-store.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/hooks/query-keys.ts`, `packages/frontend/src/hooks/use-work-items.ts`, `packages/frontend/src/features/work-items/filter-bar.tsx`, `packages/frontend/src/features/work-items/list-view.tsx`
