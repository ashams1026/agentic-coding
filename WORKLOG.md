# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-30 — AI.5: Write test plans for Work Items — Detail Panel

**Task:** Create test plans for detail panel viewing and editing.

**Done:**
- **`tests/e2e/plans/detail-panel-view.md`** — 16 steps: click work item → detail panel opens, verify title (editable heading), state badge (colored), "Move to…" transition dropdown, priority selector (colored dot), persona avatar, labels row (badges + "+ label" button), Description section ("Edit" button, text or "No description" empty state), Children section (child items with state badges or "No children" + "Add child" button), Comments section (stream + input), Execution History section, Metadata (ID/Created/Updated), close via X button, select different item → panel updates.
- **`tests/e2e/plans/detail-panel-edit.md`** — 17 steps: click title → inline edit → type "Updated Test Title" → Enter saves, Edit description → Write/Preview tabs → type text → Preview tab → Save, change priority via dropdown (e.g. P0 Critical), add label via "+ label" button → type "test-label" → Enter, change state via "Move to…" dropdown (handles Trigger Agent dialog with Skip), full page reload → reopen same item → verify all 5 mutations persisted (title, description, priority, labels, state).

**Files created:** `tests/e2e/plans/detail-panel-view.md`, `tests/e2e/plans/detail-panel-edit.md`

**Notes:** Plans reference actual components from `detail-panel.tsx`: EditableTitle (click→input, Enter saves, Escape cancels), EditableDescription (Write/Preview tabs, Save/Cancel buttons), PrioritySelector (Select with colored dots), LabelEditor (badges + "+ label" inline input), StateTransitionControl ("Move to…" Select), TransitionPrompt dialog (Run/Skip/Cancel), ChildrenList, CommentStream, ExecutionTimeline, MetadataSection. Build: 0 errors.

---

## 2026-03-30 — Review: AI.4 (approved)

**Reviewed:** Work Items flow view test plan.
- `work-items-flow-view.md`: 13 steps — navigates to `/items?view=flow`, verifies all 8 state nodes (correct layout: 7 in row + Blocked below center), item count badges on each node, agent status ("idle"/"N active"), SVG arrows with arrowheads matching all WORKFLOW.transitions (verified all 15 transitions listed correctly), cross-checks node count sum against list view total, click node → filtered items panel (colored dot + state name + count + items with priority/title/persona), item selection → detail panel, toggle deselect, zero-count → "No items in this state." ✓
- Template format (Objective/Prerequisites/Steps/Expected Results/Failure Criteria) ✓
- References UI by visible text, not implementation details ✓
- Build: no code changes ✓
- Verdict: **approved**

---

## 2026-03-30 — AI.4: Write test plans for Work Items — Flow View

**Task:** Create test plan for work items flow view.

**Done:**
- **`tests/e2e/plans/work-items-flow-view.md`** — 13 steps: navigate to `/items?view=flow`, verify all 8 state nodes (Backlog, Planning, Decomposition, Ready, In Progress, In Review, Done, Blocked — 7 in row + Blocked below center), verify item count badges on each node, verify agent status ("idle" or "N active" with green pulsing dot), verify SVG arrows with arrowheads between states following `WORKFLOW.transitions`, cross-check node count sum against list view total, click state node to show filtered items panel (colored dot + state name + count + item rows with priority/title/persona), click item to select and open detail panel, click node again to deselect, click zero-count node to see "No items in this state." message.

**Files created:** `tests/e2e/plans/work-items-flow-view.md`

**Notes:** Plan references actual layout from `flow-view.tsx`: static positions computed from `WORKFLOW.states`, `computeArrowPath` for SVG arrows, `StateNode` component (colored header, count badge, active agents indicator, avatar stack, progress bar), `FilteredItemsList` below graph on node click, toggle filter via `handleNodeClick`. Build: 0 errors.

---

## 2026-03-30 — Review: AI.3 (approved)

**Reviewed:** Work Items list view and creation test plans.
- `work-items-list-view.md`: 14 steps — navigates to `/items`, verifies list view default (List button active), filter bar (search/state/priority/persona/group by/sort), work item rows with state badges (colored) + priority badges (P0-P3) + titles, parent expand/collapse via chevron, indented children, item click → detail panel with title/state/priority/"Move to…"/description/children/comments/execution history/metadata, close panel ✓
- `work-items-create.md`: 9 steps — clicks "Add" button (Plus icon + "Add" text matching source), verifies "New work item" appears (matches `handleQuickAdd` default title), Backlog state (correct default), default priority, detail panel defaults ("No description", "No children") ✓
- Both files follow template format (Objective/Prerequisites/Steps/Expected Results/Failure Criteria) ✓
- References UI by visible text, not implementation details ✓
- Build: no code changes, no impact ✓
- Verdict: **approved**

---

## 2026-03-30 — AI.3: Write test plans for Work Items — List View

**Task:** Create test plans for work items list view and work item creation.

**Done:**
- **`tests/e2e/plans/work-items-list-view.md`** — 14 steps: navigate to `/items`, verify "Work Items" heading, verify list view is default (List button active vs Flow), verify filter bar (search, state, priority, persona, group by, sort), verify work items render with state badges (colored), priority badges (P0-P3), and titles, expand parent item chevron to see indented children, collapse children, click item to open detail panel, verify panel shows title/state/priority/"Move to…"/description/children/comments/execution history/metadata, close panel via X button.
- **`tests/e2e/plans/work-items-create.md`** — 9 steps: click "Add" button (Plus icon + "Add" text in header), verify new "New work item" appears in list, verify state is "Backlog", verify default priority, click to open detail panel, verify panel shows defaults ("No description", "No children", metadata).

**Files created:** `tests/e2e/plans/work-items-list-view.md`, `tests/e2e/plans/work-items-create.md`

**Notes:** Plans reference actual UI elements verified against `work-items.tsx` (page layout, "Add" button with `handleQuickAdd`), `list-view.tsx` (ListRow with state/priority badges, expand/collapse chevron, GroupHeader), `detail-panel.tsx` (EditableTitle, StateTransitionControl, PrioritySelector, LabelEditor, Description, Children, Comments, Execution History, Metadata sections), and `filter-bar.tsx` (search input, state/priority/persona/label filters, group by, sort by). Build: 0 errors.

---

## 2026-03-30 — Review: AI.2 (approved)

**Reviewed:** Dashboard test plans (dashboard-stats.md, dashboard-navigation.md).
- `dashboard-stats.md`: 11 steps — navigates to `/`, verifies all 4 stat cards (Active Agents, Pending Proposals, Needs Attention, Today's Cost) with numeric values, checks "$" prefix on cost, verifies active agents strip, cost summary chart, recent activity + upcoming work widgets ✓
- `dashboard-navigation.md`: 12 steps — clicks each stat card, verifies correct navigation (Active Agents→/agents, Pending Proposals→/items, Needs Attention→/activity, Today's Cost→/settings), back-button restores dashboard, tests "View all" link ✓
- Both files follow template format (Objective/Prerequisites/Steps/Expected Results/Failure Criteria) ✓
- References UI by visible text, not implementation details ✓
- Navigation targets verified against dashboard.tsx StatCard definitions ✓
- Build: no code changes, no impact ✓
- Verdict: **approved**

---

## 2026-03-30 — AI.2: Write test plans for Dashboard

**Task:** Create test plans for dashboard stats verification and dashboard navigation.

**Done:**
- **`tests/e2e/plans/dashboard-stats.md`** — 11 steps: navigate to `/`, verify 4 stat cards (Active Agents, Pending Proposals, Needs Attention, Today's Cost) render with valid numeric values (not NaN/undefined), verify Today's Cost starts with "$", verify active agents strip renders, verify cost summary chart renders, verify recent activity and upcoming work widgets.
- **`tests/e2e/plans/dashboard-navigation.md`** — 12 steps: click each of the 4 stat cards, verify navigation to correct pages (Active Agents→`/agents`, Pending Proposals→`/items`, Needs Attention→`/activity`, Today's Cost→`/settings`), navigate back after each, verify dashboard restores. Also tests "View all" link in Recent Activity widget.

**Files created:** `tests/e2e/plans/dashboard-stats.md`, `tests/e2e/plans/dashboard-navigation.md`

**Notes:** Plans reference actual stat card titles and navigation targets verified against `dashboard.tsx`. Build: 0 errors.

---

## 2026-03-30 — Review: AI.1 (approved)

**Reviewed:** Test plan directory structure and template.
- `tests/e2e/plans/` directory with `_template.md` ✓
- `tests/e2e/results/` directory (empty, ready for output) ✓
- README: framework overview, 5 prerequisites, 6 MCP tools listed, directory structure ✓
- Template: all 5 required sections (Objective, Prerequisites, Steps, Expected Results, Failure Criteria) ✓
- Steps template shows patterns for navigate, verify, click, type, screenshot ✓
- References UI by visible text, aria labels, selectors — not implementation details ✓
- Build: 0 errors ✓
- Verdict: **approved**

---

## 2026-03-30 — AI.1: Create test plan directory structure and template

**Task:** Create test plan directory structure, README, and template file.

**Done:**
- Created `tests/e2e/plans/` and `tests/e2e/results/` directories
- Created `tests/e2e/README.md`: explains the AI-based E2E test framework, prerequisites (backend :3001, frontend :5173, API mode, seeded DB, chrome-devtools MCP), how to run a test plan (6 key MCP tools listed), test plan format overview, directory structure
- Created `tests/e2e/plans/_template.md`: standard format with `## Objective`, `## Prerequisites`, `## Steps` (numbered actions with target/expected patterns for navigate, verify, click, type, screenshot), `## Expected Results`, `## Failure Criteria`. Steps reference UI elements by visible text, aria labels, or semantic selectors.

**Files created:** `tests/e2e/README.md`, `tests/e2e/plans/_template.md`

**Notes:** Build: 0 errors. Non-code files only — no source changes.

---

## 2026-03-30 — Review: PS.9 (approved)

**Reviewed:** Backend routes project scoping audit.
- Independently verified all 8 routes via grep: work-items, executions, comments, proposals, dashboard/* ✓
- Each accepts `?projectId=` in Querystring type and destructures it ✓
- work-items: `eq(workItems.projectId, projectId)` ✓
- executions/comments/proposals: work item membership pattern ✓
- dashboard (4 routes): all filter by projectId ✓
- No code changes needed — verification-only pass is correct ✓
- Verdict: **approved**
- **Sprint 15 complete** — all 10 tasks (PS.1-PS.10) approved.

---

## 2026-03-30 — PS.9: Audit backend routes for project scoping

**Task:** Audit all backend list routes for `?projectId=` query param support.

**Done — Verification pass (no fixes needed):**
All 8 routes already have proper `?projectId=` filtering, implemented in PS.3–PS.5:
- `GET /api/work-items` — filters via `eq(workItems.projectId, projectId)` (PS.3)
- `GET /api/executions` — fetches project work items, filters by ID membership (PS.5)
- `GET /api/comments` — same membership pattern (PS.5)
- `GET /api/proposals` — same membership pattern (PS.5)
- `GET /api/dashboard/stats` — filters work items + executions + proposals (PS.4)
- `GET /api/dashboard/cost-summary` — filters executions by project (PS.4)
- `GET /api/dashboard/execution-stats` — filters executions by project (PS.4)
- `GET /api/dashboard/ready-work` — filters via `eq(workItems.projectId)` + `and()` (PS.4)

**Files modified:** None (audit only — `TASKS.md` and `WORKLOG.md` updated)

**Notes:** `GET /api/audit` (not in task scope) uses file-based JSONL storage and only supports `workItemId` filter. Could be enhanced later if needed.

---

## 2026-03-30 — Review: PS.10 (approved)

**Reviewed:** Folder browser for project creation/edit form.
- Backend: `POST /api/settings/browse-directory` accepts `{ startPath? }`, defaults to `homedir()`, returns `{ currentPath, entries }` ✓
- Uses `readdirSync` with `withFileTypes`, filters directories only, hides dotfiles, sorts alphabetically ✓
- Error handling: catches unreadable directories, returns 400 ✓
- Frontend API: `browseDirectory()`, `DirectoryEntry`, `BrowseDirectoryResult` types ✓
- FolderBrowser modal: Dialog with breadcrumb bar (clickable root + segments), ScrollArea listing, ".." parent nav, loading/error/empty states ✓
- ProjectForm: text input preserved with FolderOpen icon + "Browse..." button ✓
- Dark mode: uses muted-foreground, accent, bg-muted/50 ✓
- Build: 0 errors ✓
- Verdict: **approved**

---

## 2026-03-30 — PS.10: Add folder browser to project creation form

**Task:** Replace text input for project path with a folder picker (text input + "Browse..." button + modal folder browser).

**Done:**
- **Backend**: Added `POST /api/settings/browse-directory` route to `packages/backend/src/routes/settings.ts`. Accepts `{ startPath?: string }`, defaults to `os.homedir()`. Returns `{ currentPath, entries: [{ name, path, isDirectory }] }`. Uses `readdirSync` with `withFileTypes`, filters to directories only, hides dotfiles, sorts alphabetically. Returns 400 on unreadable directories.
- **Frontend API**: Added `browseDirectory()`, `DirectoryEntry`, and `BrowseDirectoryResult` types to `packages/frontend/src/api/client.ts`.
- **Frontend UI**: Rewrote `ProjectForm` in `packages/frontend/src/features/settings/projects-section.tsx`:
  - Text input preserved with FolderOpen icon (for accessibility/direct typing)
  - Added "Browse..." button next to the input
  - Added `FolderBrowser` modal component: Dialog with breadcrumb path bar (clickable segments), scrollable directory listing, ".." parent navigation, "Select" button to confirm. Prepopulates at current path or home directory.
  - Uses shadcn Dialog, ScrollArea, Button components. Dark mode compatible.

**Files modified:** `packages/backend/src/routes/settings.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/features/settings/projects-section.tsx`

**Notes:** Build: 0 errors after removing unused `statSync` import. The `browseDirectory` call is made directly from the component (not through the mock/real pick layer) since it's only meaningful with a real backend — mock mode has no filesystem to browse.

---

## 2026-03-30 — Review: PS.8 (approved)

**Reviewed:** Auto-seed default personas on project creation.
- 5 built-in personas with correct configs (names, colors, icons, models, tools, budgets) matching seed.ts ✓
- Router has `{ isSystem: true }` settings ✓
- Conditional seeding: only inserts personas if none exist in DB ✓
- Falls back to DB lookup if personas already exist ✓
- Default state→persona assignments match seed.ts mapping (5 states) ✓
- Called from POST /api/projects after project insert ✓
- System prompts intentionally empty (user-customizable via Persona Manager) — acceptable ✓
- Build: 0 errors ✓
- Verdict: **approved**

---

## 2026-03-30 — PS.8: Auto-seed default personas on project creation

**Task:** When creating a new project via the API, seed built-in personas if none exist, and create default persona assignments for the new project.

**Done:**
- Created `packages/backend/src/db/default-personas.ts` with:
  - `BUILT_IN_PERSONAS` array: 5 personas (Product Manager, Tech Lead, Engineer, Code Reviewer, Router) with same config as seed.ts
  - `DEFAULT_STATE_ASSIGNMENTS` mapping: Planning→PM, Decomposition→Tech Lead, Ready→Router, In Progress→Engineer, In Review→Code Reviewer
  - `seedDefaultPersonasForProject(projectId)` function: checks if any personas exist; if not, inserts the 5 built-ins. Then creates persona assignments for the given project using the default mapping.
- Updated `packages/backend/src/routes/projects.ts`: POST /api/projects now calls `seedDefaultPersonasForProject(id)` after inserting the project row.

**Files created:** `packages/backend/src/db/default-personas.ts`
**Files modified:** `packages/backend/src/routes/projects.ts`

**Notes:** Persona definitions are intentionally without full system prompts (empty string) — the seed.ts has detailed prompts but those are fixture-specific. The personas table defaults `systemPrompt` to `""`. Build: 0 errors after removing unused `PersonaId` import.

---

## 2026-03-30 — Review: PS.7 (approved)

**Reviewed:** Empty states for new projects.
- Work Items list: `EmptyWorkItemsState` component with icon, heading, description, and "Create work item" button ✓
- Properly distinguishes empty project vs. no filter matches via `hasFilters` check ✓
- Activity feed: "No activity yet" with project-scoped message ✓
- Dashboard recent-activity: "No activity yet" ✓
- Dashboard stats: handles zero gracefully via `?? 0` defaults ✓
- Build: 0 errors ✓
- Verdict: **approved**

---

## 2026-03-30 — PS.7: Show empty state for new projects

**Task:** Show friendly empty states when a project has zero work items.

**Done:**
- **Work Items list view**: Added `EmptyWorkItemsState` component — large icon, "No work items yet" heading, descriptive text, prominent "Create work item" button with Plus icon. Replaces the old plain text empty state (filter empty state kept separate).
- **Activity feed**: Updated empty state text from "Nothing yet" to "No activity yet" with project-scoped message.
- **Dashboard recent-activity widget**: Updated empty text to "No activity yet".
- **Dashboard stats**: Already handles zero gracefully via `?? 0` defaults — shows "0" not NaN/errors.

**Files modified:** `packages/frontend/src/features/work-items/list-view.tsx`, `packages/frontend/src/features/activity-feed/activity-feed.tsx`, `packages/frontend/src/features/dashboard/recent-activity.tsx`

**Notes:** Added `Button`, `Plus`, `ListTodo`, `useCreateWorkItem`, `ProjectId` imports to list-view. Build: 0 errors after type cast fix.

---

## 2026-03-30 — Review: PS.6 (approved)

**Reviewed:** Persona assignment scoping and hardcoded project ID removal.
- Hook: `usePersonaAssignments(ProjectId | null)` with `enabled: !!projectId` guard, non-null assertions safe behind guard ✓
- detail-panel.tsx: passes `projectId` from `useSelectedProject()` ✓
- board-view.tsx: passes `projectId` from `useSelectedProject()` ✓
- workflow-config-section.tsx: removed `PROJECT_ID` constant, uses `useSelectedProject()`, null guard on mutation ✓
- work-items.tsx: quick-add uses dynamic `projectId` with null guard ✓
- Zero `pj-agntops`/`PROJECT_ID` references outside fixtures.ts ✓
- Unused `ProjectId` imports cleaned ✓
- Build: 0 errors ✓
- Verdict: **approved**
- **Sprint 15 Core Wiring complete** — all 6 tasks (PS.1-PS.6) approved.

---

## 2026-03-30 — PS.6: Scope persona assignments to selected project

**Task:** Remove hardcoded `"pj-agntops"` project IDs from all persona assignment call sites, use `useSelectedProject()` instead.

**Done:**
- Updated `usePersonaAssignments` hook to accept `ProjectId | null` with `enabled: !!projectId` guard (same pattern as `useProject`)
- Replaced hardcoded `"pj-agntops" as ProjectId` in `detail-panel.tsx` → uses `projectId` from `useSelectedProject()`
- Replaced hardcoded `"pj-agntops" as ProjectId` in `board-view.tsx` → uses `projectId` from `useSelectedProject()`
- Removed `const PROJECT_ID = "pj-agntops"` from `workflow-config-section.tsx` → uses `projectId` from `useSelectedProject()`
- Fixed `updateAssignment.mutate` in workflow config to use dynamic `projectId` with null guard
- Also fixed hardcoded `projectId` in `work-items.tsx` quick-add handler → uses `projectId` from `useSelectedProject()`
- Removed unused `ProjectId` type imports from `board-view.tsx` and `detail-panel.tsx`

**Files modified:** `packages/frontend/src/hooks/use-persona-assignments.ts`, `packages/frontend/src/features/work-items/detail-panel.tsx`, `packages/frontend/src/features/work-items/board-view.tsx`, `packages/frontend/src/features/settings/workflow-config-section.tsx`, `packages/frontend/src/pages/work-items.tsx`

**Notes:** Zero hardcoded `"pj-agntops"` references remain outside fixtures.ts. Build: 0 errors after removing unused imports.

---

## 2026-03-30 — Review: PS.5 (approved)

**Reviewed:** Scoping executions, comments, and proposals to selected project — full stack.
- Backend: all 3 routes accept `?projectId=`, consistent pattern (`if (projectId && !workItemId)` → filter by workItem membership) ✓
- API client: `getExecutions`/`getProposals` use URLSearchParams, `getRecentComments` appends query param ✓
- Mock API: all 3 functions filter by workItem ID set when projectId provided ✓
- API index: `getRecentComments` fixed from zero-arg to forwarding args ✓
- Query keys: `executions`, `proposals`, `recentComments` include projectId ✓
- Hooks: all 3 accept optional projectId ✓
- Call sites: 0 bare calls remain (grep confirmed) ✓
- Activity feed + recent-activity: all 3 hooks pass projectId ✓
- Agent monitor: layout, sidebar, history, split-view all scoped ✓
- Build: 0 errors ✓
- Verdict: **approved**

---

## 2026-03-30 — PS.5: Scope executions, comments, and proposals to selected project

**Task:** Scope top-level execution, proposal, and comment listings to the selected project.

**Done:**
- **Backend**: Added `?projectId=` support to `GET /api/executions`, `GET /api/proposals`, `GET /api/comments` — filters by workItem membership in project
- **API client** (`client.ts`): `getExecutions`, `getProposals`, `getRecentComments` accept optional `projectId`
- **Mock API** (`mocks/api.ts`): All 3 mock functions filter by project when `projectId` provided
- **API index** (`api/index.ts`): Fixed `getRecentComments` to forward args (was zero-arg)
- **Query keys**: `executions`, `proposals`, `recentComments` updated to include `projectId`
- **Hooks**: `useExecutions`, `useProposals`, `useRecentComments` accept optional `projectId`
- **Call sites** (9 files): sidebar, list-view, flow-view, active-agent-sidebar, split-view, agent-history, agent-monitor-layout, active-agents-strip, recent-activity, activity-feed — all pass `projectId ?? undefined`

**Files modified:** `packages/backend/src/routes/executions.ts`, `packages/backend/src/routes/proposals.ts`, `packages/backend/src/routes/comments.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`, `packages/frontend/src/mocks/api.ts`, `packages/frontend/src/hooks/query-keys.ts`, `packages/frontend/src/hooks/use-executions.ts`, `packages/frontend/src/hooks/use-proposals.ts`, `packages/frontend/src/hooks/use-comments.ts`, `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/features/work-items/list-view.tsx`, `packages/frontend/src/features/work-items/flow-view.tsx`, `packages/frontend/src/features/agent-monitor/active-agent-sidebar.tsx`, `packages/frontend/src/features/agent-monitor/split-view.tsx`, `packages/frontend/src/features/agent-monitor/agent-history.tsx`, `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`, `packages/frontend/src/features/dashboard/recent-activity.tsx`, `packages/frontend/src/features/dashboard/active-agents-strip.tsx`, `packages/frontend/src/features/activity-feed/activity-feed.tsx`

**Notes:** Initial build failure — `getRecentComments` in api/index.ts was a zero-arg wrapper, fixed to forward args. Build: 0 errors after fix.

---

## 2026-03-30 — Review: PS.4 (approved)

**Reviewed:** Dashboard query scoping — full stack from backend to call sites.
- Backend: all 4 routes accept `?projectId=`, filter workItems then scope executions/proposals by workItemId set ✓
- API client: all 4 functions accept `projectId?`, append query param ✓
- Mock API: all 4 mock functions filter by projectId when provided ✓
- Query keys: static→function, returns unscoped when no projectId (TanStack prefix matching for invalidation works) ✓
- Hooks: all 4 accept and pass `projectId?` ✓
- Call sites: grep confirms 0 bare calls — all pass `projectId ?? undefined` ✓
- Invalidation: `use-proposals.ts` fixed to `["dashboardStats"]` raw key, WS sync already uses raw keys ✓
- Build: 0 errors ✓
- Verdict: **approved**

---

## 2026-03-30 — PS.4: Scope dashboard queries to selected project

**Task:** Update dashboard hooks, backend routes, API client, mock API, and call sites to accept and filter by `projectId`.

**Done:**
- **Backend** (`dashboard.ts`): All 4 routes (`/stats`, `/cost-summary`, `/execution-stats`, `/ready-work`) now accept `?projectId=` query param. Filter work items by projectId, then filter executions/proposals by work item membership.
- **API client** (`client.ts`): All 4 dashboard functions accept optional `projectId`, append as query param.
- **Mock API** (`mocks/api.ts`): All 4 mock functions accept `projectId`, filter in-memory data accordingly.
- **Query keys** (`query-keys.ts`): Dashboard keys changed from static arrays to functions accepting `projectId`.
- **Hooks** (`use-dashboard.ts`): All 4 hooks accept optional `projectId`, pass to query key + queryFn.
- **Call sites updated**: sidebar.tsx, status-bar.tsx, dashboard.tsx, cost-summary.tsx, upcoming-work.tsx, costs-section.tsx (2 components)
- **Fixed**: `use-proposals.ts` invalidation used static `queryKeys.dashboardStats` — changed to raw `["dashboardStats"]` for prefix matching.

**Files modified:** `packages/backend/src/routes/dashboard.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/mocks/api.ts`, `packages/frontend/src/hooks/query-keys.ts`, `packages/frontend/src/hooks/use-dashboard.ts`, `packages/frontend/src/hooks/use-proposals.ts`, `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/components/status-bar.tsx`, `packages/frontend/src/pages/dashboard.tsx`, `packages/frontend/src/features/dashboard/cost-summary.tsx`, `packages/frontend/src/features/dashboard/upcoming-work.tsx`, `packages/frontend/src/features/settings/costs-section.tsx`

**Notes:** Build initially failed due to unused `inArray` import — removed. Build: 0 errors after fix.

---

## 2026-03-30 — Review: PS.3 (approved)

**Reviewed:** Scoping all useWorkItems() call sites to selected project.
- Zero bare `useWorkItems()` calls remain — grep confirms all scoped ✓
- 10 files updated: 10 imports + 10 destructures of `useSelectedProject` (20 occurrences) ✓
- Correct pattern: `useWorkItems(undefined, projectId ?? undefined)` — null→undefined conversion for optional param ✓
- Hook chain: `useWorkItems(parentId?, projectId?)` → `queryKeys.workItems` → `getWorkItems` passes projectId through ✓
- All files listed in task description covered (list-view, board-view, flow-view, filter-bar, detail-panel, command-palette, 4 agent-monitor components) ✓
- Build: 0 errors ✓
- Verdict: **approved**

---

## 2026-03-30 — PS.3: Scope work items queries to selected project

**Task:** Update all `useWorkItems()` call sites to pass `projectId` from `useSelectedProject()`.

**Done:**
- Updated 10 files to import `useSelectedProject` and pass `projectId` to `useWorkItems(undefined, projectId ?? undefined)`
- Call sites: list-view, filter-bar, board-view, flow-view, detail-panel, command-palette, active-agent-sidebar, agent-control-bar, split-view, agent-history

**Files modified:**
- `packages/frontend/src/features/work-items/list-view.tsx`
- `packages/frontend/src/features/work-items/filter-bar.tsx`
- `packages/frontend/src/features/work-items/board-view.tsx`
- `packages/frontend/src/features/work-items/flow-view.tsx`
- `packages/frontend/src/features/work-items/detail-panel.tsx`
- `packages/frontend/src/features/command-palette/command-palette.tsx`
- `packages/frontend/src/features/agent-monitor/active-agent-sidebar.tsx`
- `packages/frontend/src/features/agent-monitor/agent-control-bar.tsx`
- `packages/frontend/src/features/agent-monitor/split-view.tsx`
- `packages/frontend/src/features/agent-monitor/agent-history.tsx`

**Notes:** The `useWorkItems` hook already accepted `projectId` as second param — callers just weren't passing it. Used `projectId ?? undefined` to convert null→undefined matching the optional param type. Build: 0 errors.

---

## 2026-03-30 — Review: PS.2 (approved)

**Reviewed:** useSelectedProject hook and useProject null-safety update.
- Hook reads `selectedProjectId` from UI store via selector, casts to `ProjectId | null` ✓
- Fetches full project via `useProject(selectedProjectId)` — passes nullable ID ✓
- Returns `{ project, projectId, isLoading }` — correct shape, `project ?? null` normalizes undefined ✓
- `useProject` updated: `ProjectId | null` param, `enabled: !!id`, non-null assertions safe behind guard ✓
- No existing callers broken: grep confirms only `useSelectedProject` consumes `useProject()` ✓
- Exported from `hooks/index.ts` barrel ✓
- Build: 0 errors ✓
- Verdict: **approved**

---

## 2026-03-30 — PS.2: Create useSelectedProject hook

**Task:** Create `use-selected-project.ts` hook as single source of truth for the selected project.

**Done:**
- Created `packages/frontend/src/hooks/use-selected-project.ts`: reads `selectedProjectId` from `useUIStore`, fetches full project via `useProject(id)`, returns `{ project, projectId, isLoading }`
- Updated `useProject` in `use-projects.ts` to accept `ProjectId | null` with `enabled: !!id` — prevents broken fetch when no project is selected
- Exported `useSelectedProject` from `hooks/index.ts` barrel

**Files created:** `packages/frontend/src/hooks/use-selected-project.ts`
**Files modified:** `packages/frontend/src/hooks/use-projects.ts`, `packages/frontend/src/hooks/index.ts`

**Notes:** `useProject` previously only accepted `ProjectId` (non-null). Updated to accept null with `enabled` guard so downstream hooks like `useSelectedProject` work correctly when no project is selected. Build: 0 errors.
