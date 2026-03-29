# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> Entries older than 7 days are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-29 — T2.4.2: Build inherited context section

**Task:** Collapsible panel showing context from parent story: description excerpt, acceptance criteria, Tech Lead notes. Labeled "Inherited from [Story Name]".

**Done:**
- Created `features/task-detail/inherited-context.tsx`:
  - `InheritedContext` — collapsible panel (open by default) with "Inherited from [Story Name]" header
  - Story name in header is a clickable link to `/stories/:id`
  - Three content sections, each with FileText icon + uppercase label:
    - "Context" — task's `inheritedContext` field (notes from Tech Lead / task creation)
    - "Story Description" — parent story description excerpt (line-clamp-4)
    - "Acceptance Criteria" — parent story acceptance criteria (line-clamp-6)
  - "View full story" link at bottom
  - Returns null when no content available
  - Reuses shadcn Collapsible with same chevron rotation pattern as StoryMetadata
- Created `features/task-detail/` directory for task detail feature components
- Updated `pages/task-detail.tsx`:
  - Replaced inherited context placeholder with `<InheritedContext task={task} story={story} />`

**Files created:**
- `packages/frontend/src/features/task-detail/inherited-context.tsx`

**Files modified:**
- `packages/frontend/src/pages/task-detail.tsx` (replaced placeholder, added import)

**Notes for next agent:**
- T2.4.3 is next: dependency info display
- Task detail feature components live in `features/task-detail/`
- The `story` prop comes from the parent page which already resolves it via `useStories()` + find
- Mock tasks have `inheritedContext` populated (e.g., "Implement OAuth2 login flow...")

---

## 2026-03-29 — Review: T2.4.1 (approved)

**Reviewed:** Task detail page — `task-detail.tsx` rewrite.
- All requirements met: header with title, colored state badge, assigned persona avatar + name, parent story link with ExternalLink icon navigating to `/stories/:id`
- Follows same full-page layout pattern as story detail (`max-w-4xl p-6 space-y-6`)
- Back button with `navigate(-1)`, description section with whitespace-pre-wrap
- Reuses `CommentStream` and `ExecutionTimeline` from story-detail features — validates the generic design
- Placeholder sections for T2.4.2–T2.4.5
- Parent story resolved via `useStories()` + find to avoid optional StoryId TS issue
- Loading/not-found states
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.4.1: Build task detail view

**Task:** Task detail page at `/tasks/:id`. Header with title, state badge, assigned persona, parent story link. Placeholder sections for T2.4.2–T2.4.5. Reuse CommentStream and ExecutionTimeline.

**Done:**
- Rewrote `pages/task-detail.tsx` (replaced placeholder):
  - Header: task title (h1), state badge (colored per state), assigned persona (avatar + name), parent story link (ExternalLink icon, navigates to `/stories/:id`)
  - Back button (ArrowLeft) using `navigate(-1)`
  - Description section (from `task.description`, whitespace-pre-wrap)
  - Placeholder sections for T2.4.2–T2.4.5 (inherited context, dependency info, execution context, rejection history)
  - Reuses `CommentStream` with `targetId={task.id} targetType="task"` — shows task-level comments
  - Reuses `ExecutionTimeline` with `targetId={task.id}` — shows task executions
  - Loading/not-found states
  - `stateColors` map for task workflow states (Pending/Running/Review/Done)
  - Parent story resolved via `useStories()` + find (avoids optional StoryId issue with `useStory`)
  - Persona resolved via `usePersonas()` + find by `task.assignedPersonaId`

**Files modified:**
- `packages/frontend/src/pages/task-detail.tsx` (complete rewrite)

**Notes for next agent:**
- T2.4.2 is next: inherited context section
- Task detail reuses `CommentStream` and `ExecutionTimeline` from `features/story-detail/` — they're generic by design
- Mock data: Task "tk-au01001" has comments and executions; clicking through from Story 1's child tasks section reaches this page
- Placeholder sections follow the same dashed-border pattern for T2.4.2–T2.4.5

---

## 2026-03-29 — Review: T2.3.7 (approved)

**Reviewed:** Story metadata collapsible section — `story-metadata.tsx` and story-detail page integration.
- All requirements met: collapsible section (closed by default, ChevronDown rotation via Radix data-state), MetaRow reusable subcomponent with icon + label + value
- Displays: created/updated dates, project name (resolved via useProjects), workflow name + type, trigger status ("Waiting for [Persona]" with color dot or "No trigger configured"), rejection count (conditional, amber)
- Read-only, clean data resolution via hooks + useMemo lookups
- Added shadcn Collapsible component
- Story Detail section now complete (T2.3.1–T2.3.7): Header, Description, Proposals, Tasks, Comments, Execution History, Metadata
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.3.7: Build story metadata sidebar

**Task:** Collapsible section showing read-only story info: created date, updated date, project name, workflow name, current trigger status, retry count.

**Done:**
- Created `features/story-detail/story-metadata.tsx`:
  - `StoryMetadata` — collapsible section (shadcn Collapsible, closed by default)
  - `MetaRow` — reusable row with icon + label (uppercase 11px) + value
  - Displays:
    - Created date (Calendar icon) — formatted with month, day, year, time
    - Updated date (Clock icon) — same format
    - Project name (FolderOpen icon) — resolved from `useProjects` by `story.projectId`
    - Workflow name + type badge (GitBranch icon) — resolved from `useWorkflows` by `story.workflowId`
    - Trigger status (Bot icon) — finds next trigger matching `story.workflowId` + `story.currentState`, shows "Waiting for [Persona Name]" with persona color dot, or "No trigger configured"
    - Rejection loop count (RefreshCw icon) — counts rejected executions, only shown when >0, amber text
  - Added shadcn Collapsible component
- Updated `pages/story-detail.tsx`:
  - Added `StoryMetadata` import, placed at bottom of content sections
  - Story Detail section is now **complete** (T2.3.1–T2.3.7)

**Files created:**
- `packages/frontend/src/features/story-detail/story-metadata.tsx`
- `packages/frontend/src/components/ui/collapsible.tsx` (shadcn)

**Files modified:**
- `packages/frontend/src/pages/story-detail.tsx` (added StoryMetadata)

**Notes for next agent:**
- Sprint 2 Story Detail section is complete (T2.3.1–T2.3.7)
- Next task in Sprint 3: T2.4.1 (Task Detail view)
- The collapsible pattern could be reused for other sections
- Story detail page section order: Header → Description → Proposals → Tasks → Comments → Execution History → Metadata

---

## 2026-03-29 — Review: T2.3.6 (approved)

**Reviewed:** Execution history timeline — `execution-timeline.tsx` and story-detail page integration.
- All requirements met: vertical timeline with persona avatars + connectors, "[Name] ran for Xm Ys" summary, cost badge ($X.XX), outcome badges (success/failure/rejected/running with appropriate colors), click-to-expand with logs in monospace pre
- Collapsed by default, ChevronRight/Down toggle, summary line-clamped to 1 line
- Sorted most-recent-first (sensible for history), returns null when empty
- Reusable for tasks via `targetId: StoryId | TaskId`
- Uses `<pre>` for logs — correct interim approach since agent monitor terminal renderer (T2.5.3) hasn't been built yet
- Story detail page now has no remaining placeholder sections
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.3.6: Build execution history timeline

**Task:** Vertical timeline on story detail. Each entry: persona avatar, "[Name] ran for Xm Ys", cost badge, outcome badge (success/failure/rejected). Click to expand shows logs. Collapsed by default.

**Done:**
- Created `features/story-detail/execution-timeline.tsx`:
  - `ExecutionTimeline` — fetches executions for target via `useExecutions(targetId)`, sorted most-recent-first, hidden when empty
  - `TimelineEntry` — vertical timeline layout:
    - Persona avatar on timeline track with vertical line connector between entries
    - Clickable summary: "[Persona Name] ran for Xm Ys" with one-line summary below
    - `OutcomeBadge` — green success / red failure / amber rejected / green-animated running
    - Cost badge (DollarSign icon + `$0.42` format)
    - Timestamp (Clock icon + short date/time)
    - Collapsed by default, click ChevronRight/Down to expand
    - Expanded: monospace log output in bordered muted container with `whitespace-pre-wrap`
  - `formatDuration` helper: converts ms to "Xm Ys" or "Xs" format, "running..." for 0
  - `formatCost` helper: `$X.XX` format
  - Returns `null` when no executions (doesn't render empty section)
- Updated `pages/story-detail.tsx`:
  - Added `ExecutionTimeline` import, replaced execution history placeholder
  - All story detail placeholders now replaced — only T2.3.7 (metadata sidebar) remains

**Files created:**
- `packages/frontend/src/features/story-detail/execution-timeline.tsx`

**Files modified:**
- `packages/frontend/src/pages/story-detail.tsx` (replaced placeholder, added import)

**Notes for next agent:**
- T2.3.7 is next: story metadata sidebar
- Mock data: Story 1 has 2 executions (PM + Tech Lead, both completed/success), Story 2 has 2 (PM + Tech Lead)
- The `ExecutionTimeline` is reusable for task detail too (accepts `targetId: StoryId | TaskId`)
- Task spec mentions "reuse terminal renderer from agent monitor" — for now, logs render as `<pre>` in a monospace container. The agent monitor terminal renderer (T2.5.3) will be built later and could replace this.
- Story detail page now has no placeholder sections (except T2.3.7 metadata sidebar which was never added as a placeholder)

---

## 2026-03-29 — Review: T2.3.5 (approved)

**Reviewed:** Comment stream component — `comment-stream.tsx` and story-detail page integration.
- All requirements met: reusable with `targetId`+`targetType` props (works for stories and tasks), chronological sort, three distinct renderers for agent/user/system comments
- Agent comments: persona-colored avatar, name + "agent" badge + timestamp, `whitespace-pre-wrap` content, metadata chips (FileCode with tooltip for files, Wrench for tools)
- User comments: primary-colored User avatar, name + timestamp
- System comments: compact muted inline with Info icon
- Input: Textarea + Send button, Cmd/Ctrl+Enter keyboard shortcut, `useCreateComment` with clear-on-success
- Auto-scroll via `useEffect` on `sorted.length`, max-h-[400px] scroll container
- `formatTime` provides clean relative timestamps
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.3.5: Build comment stream component

**Task:** Reusable comment stream for stories and tasks. Three author types (agent, user, system) with different styling. Agent comments have persona avatars and metadata chips. User input at bottom. Auto-scroll to bottom on new comments.

**Done:**
- Created `features/story-detail/comment-stream.tsx`:
  - `CommentStream` — reusable component accepting `targetId` + `targetType` (works for both stories and tasks)
  - Fetches comments via `useComments(targetId)`, sorted chronologically
  - Three comment renderers:
    - `AgentComment` — persona-colored avatar (Bot icon), name + "agent" badge + timestamp, content with `whitespace-pre-wrap`, metadata chips for filesChanged (monospace, FileCode icon, tooltip with full path) and toolsUsed (Wrench icon)
    - `UserComment` — primary-colored avatar (User icon), name + timestamp, content
    - `SystemComment` — muted inline style with Info icon, content + timestamp (compact row)
  - `CommentInput` — Textarea + Send button, Cmd/Ctrl+Enter submits, creates via `useCreateComment` with `authorType: "user"`, clears on success
  - Auto-scroll: `useEffect` scrolls `scrollRef` to bottom when `sorted.length` changes
  - Max height 400px with overflow-y scroll for long threads
  - `formatTime` helper: relative time (just now, Xm/Xh/Xd ago) or short date
- Updated `pages/story-detail.tsx`:
  - Added `CommentStream` import, replaced comment placeholder with `<CommentStream targetId={story.id} targetType="story" />`

**Files created:**
- `packages/frontend/src/features/story-detail/comment-stream.tsx`

**Files modified:**
- `packages/frontend/src/pages/story-detail.tsx` (replaced placeholder, added import)

**Notes for next agent:**
- T2.3.6 is next: execution history timeline
- `CommentStream` is reusable — task detail page (T2.4.x) can use `<CommentStream targetId={task.id} targetType="task" />`
- Mock data: Story 1 has 5 comments (user, agent PM, agent Tech Lead, system, user), Story 2 has 3 (agent PM, agent Tech Lead, system)
- Agent metadata chips show truncated filenames with full path in tooltip

---

## 2026-03-29 — Review: T2.3.4 (approved)

**Reviewed:** Proposals section — `proposals-section.tsx` and story-detail page integration.
- All core requirements met: only renders when pending proposals exist (returns null otherwise), amber-themed Card with prominent styling, proposed task list with title + description, green approve / red reject buttons, "Approve all" bulk action (shown when >1 pending), reject form with autofocus textarea and Escape cancel
- Placed above ChildTasksSection in story-detail page per spec ("at top of detail")
- Minor gap: task spec mentions "editable inline" for proposed task title/description, but `UpdateProposalRequest` API only supports `status` + `feedback` — inline editing of payload would need API extension. Acceptable for mock phase.
- Uses `useProposals(story.id)` and `useUpdateProposal` hooks correctly
- Build passes
- **Verdict: approved**

---

## 2026-03-28 — T2.3.4: Build proposals section

**Task:** Proposals section for story detail — only visible when pending proposals exist. Yellow/amber panel with proposed tasks, approve/reject per-item, "Approve all" bulk action, reject shows textarea for feedback.

**Done:**
- Created `features/story-detail/proposals-section.tsx`:
  - `ProposalsSection` — fetches proposals for story via `useProposals(story.id)`, filters to pending only, returns `null` when none pending
  - Wrapped in amber-themed `Card` (amber border, subtle amber background) for visual prominence
  - Section header with AlertTriangle icon, pending count, "Approve all" bulk action button (only when >1 pending)
  - `ProposalCard` — individual proposal display:
    - Collapsible (ChevronUp/Down toggle)
    - Shows proposal type label (e.g., "3 proposed tasks") with amber "pending" badge
    - `ProposedTask` renders each proposed task (title + description) from `proposal.payload.tasks`
    - Green "Approve" button → calls `useUpdateProposal` with `status: "approved"`
    - Red outlined "Reject" button → toggles reject form
    - Reject form: autofocus Textarea for feedback, Escape cancels, "Confirm Reject" button (disabled when empty) → calls with `status: "rejected"` + feedback
  - Placed ABOVE child tasks in story-detail page per spec ("at top of detail")
- Updated `pages/story-detail.tsx`:
  - Added `ProposalsSection` import, placed before `ChildTasksSection`
  - Removed proposals placeholder

**Files created:**
- `packages/frontend/src/features/story-detail/proposals-section.tsx`

**Files modified:**
- `packages/frontend/src/pages/story-detail.tsx` (added ProposalsSection, removed placeholder)

**Notes for next agent:**
- T2.3.5 is next: comment stream component
- Mock data: Story 1 has approved proposal (hidden since not pending), Story 2 has pending proposal with 3 proposed tasks — so navigating to Story 2 shows the amber proposals section
- `useUpdateProposal` invalidates both `["proposals"]` and `dashboardStats` query keys
- "Approve all" iterates over pending proposals and mutates each — works for mock data; batch endpoint could optimize later

---

## 2026-03-28 — Review: T2.3.3 (approved)

**Reviewed:** Child tasks section — `child-tasks-section.tsx` and story-detail page integration.
- All requirements met: task list with checkbox toggle (Done/Pending), state icons (animated spinner for Running), title links to `/tasks/:id`, state badges with per-state colors, persona avatars with tooltips, dependency indicators (amber GitBranch)
- Mini dependency graph: SVG-based with topological BFS layering, state-colored left indicator per node, arrow markers. Only renders when story has edges — correct behavior for Story 1 (chain) vs Story 2 (no graph)
- Inline "Add task" form: autofocus, Enter/Escape, auto-detects task workflow ID, creates via `useCreateTask`
- Progress bar with done/total count, empty state with CTA
- Clean TypeScript: `StateConfig` interface with explicit return type avoids TS strict issues
- Build passes
- **Verdict: approved**

---

## 2026-03-28 — T2.3.3: Build child tasks section

**Task:** List of tasks belonging to story, each with checkbox state toggle, title, state badge, persona avatar, dependency indicator. Mini dependency graph. Inline "Add task" form.

**Done:**
- Created `features/story-detail/child-tasks-section.tsx`:
  - `ChildTasksSection` — main component fetching tasks, edges, personas, workflows for the story
  - `TaskRow` — each task: checkbox (toggles Done/Pending via `useUpdateTask`), state icon (animated spinner for Running), title as link to `/tasks/:id`, state badge, persona avatar with tooltip, dependency indicator (amber GitBranch icon)
  - `AddTaskForm` — inline form with autofocus input, Enter/Escape, uses `useCreateTask` with task workflow ID auto-detected from workflows
  - `MiniDepGraph` — SVG-based dependency graph with topological BFS layering, state-colored left indicator per node, arrow markers for edges. Only renders when edges exist between story's tasks
  - Progress bar showing done/total count
  - Added shadcn Checkbox component
- Updated `pages/story-detail.tsx`:
  - Replaced child tasks placeholder with `<ChildTasksSection story={story} />`

**Files created:**
- `packages/frontend/src/features/story-detail/child-tasks-section.tsx`
- `packages/frontend/src/components/ui/checkbox.tsx` (shadcn)

**Files modified:**
- `packages/frontend/src/pages/story-detail.tsx` (replaced placeholder, added import)

**Notes for next agent:**
- T2.3.4 is next: proposals section
- Mock data: Story 1 (Auth) has 3 tasks with 2 edges forming a chain (OAuth routes → Login UI → Session persistence) — the dep graph renders for this story
- Story 2 (Dashboard) has 3 tasks with no edges — no graph shown
- The `getStateConfig` pattern could be extracted to a shared util if needed elsewhere

---

## 2026-03-28 — Review: T2.3.2 (approved)

**Reviewed:** Description and context section for story detail page.
- Implementation matches task description: markdown textarea with preview toggle, acceptance criteria section, inline edit with save/cancel
- MarkdownPreview handles paragraphs, bold, inline code, bullet lists correctly
- EditableSection is cleanly reusable with Write/Preview tabs
- Uses `useUpdateStory` mutation for both description and acceptance criteria
- Build passes with no errors
- Follows conventions (kebab-case file, named exports, feature directory colocation)
- **Verdict: approved**

---

## 2026-03-28 — T2.3.2: Build description and context section

**Task:** Rich text area for story description (markdown textarea + rendered preview) and acceptance criteria section, both editable inline with save/cancel.

**Done:**
- Created `features/story-detail/story-description.tsx`:
  - `StoryDescription` component with two `EditableSection` blocks: Description and Acceptance Criteria
  - `EditableSection` — reusable component with view/edit modes:
    - View mode: renders content via `MarkdownPreview`, "Edit" button
    - Edit mode: Write/Preview tabs, monospace `Textarea`, Save/Cancel buttons
    - Escape cancels editing
  - `MarkdownPreview` — lightweight inline markdown renderer:
    - Paragraphs, bullet lists (`-` and `*` prefixes), empty lines as spacing
    - `formatInline` handles `**bold**` and `` `code` `` formatting
    - "No description yet." italic placeholder for empty content
  - Saves via `useUpdateStory` — description saves to `story.description`, acceptance criteria saves to `story.context.acceptanceCriteria`
- Updated `pages/story-detail.tsx`:
  - Replaced description placeholder with `<StoryDescription story={story} />`

**Files created:**
- `packages/frontend/src/features/story-detail/story-description.tsx`

**Files modified:**
- `packages/frontend/src/pages/story-detail.tsx` (replaced placeholder, added import)

**Notes for next agent:**
- T2.3.3 is next: child tasks section
- The `EditableSection` pattern could be reused if other sections need edit/preview toggle
- Markdown rendering is intentionally minimal — a full markdown lib could replace `MarkdownPreview` later
- Mock data has rich acceptance criteria with bullet lists that render properly

---

## 2026-03-28 — Review: T2.3.1 (approved)

**Reviewed:** Story detail panel — `story-detail-header.tsx` and `story-detail.tsx` page.

**Verdict:** Approved. All requirements met: inline-editable title (click to edit, Enter/Escape, save/cancel buttons), state badge, priority selector with colored styling, editable label pills (comma-separated input, "+ Add labels" empty state). Close button navigates to /board. Full-page layout at /stories/:id with loading/not-found states. Decision to use full-page instead of Sheet is reasonable and documented — header is reusable for Sheet mode later. Feature colocation in `features/story-detail/`. Build clean.

---

## 2026-03-28 — T2.3.1: Build story detail panel

**Task:** Story detail page with editable header (inline title, state badge, priority selector, label pills), close button, full-page layout.

**Done:**
- Created `features/story-detail/story-detail-header.tsx`:
  - `EditableTitle` — click title to edit inline, Enter saves, Escape cancels, uses `useUpdateStory`
  - `EditableLabels` — click labels to edit (comma-separated input), Enter saves, Escape cancels
  - State badge (outline, shows `currentState`)
  - Priority selector — shadcn Select with P0-P3, colored border/text matching `priorityConfig`
  - Close button (X icon) in top-right, calls `onClose`
- Updated `pages/story-detail.tsx`:
  - Full-page view at `/stories/:id` (route already existed)
  - Fetches story via `useStory(id)` with loading + not-found states
  - Close button navigates back to `/board`
  - Max-width 4xl centered layout with scrollable content area
  - Placeholder sections for T2.3.2–T2.3.6 (dashed border boxes)
- Decision: built as full-page view (not Sheet) since the route already exists. Sheet overlay could be added later as a toggle. The full-page approach is cleaner for the amount of content this page will hold.

**Files created:**
- `packages/frontend/src/features/story-detail/story-detail-header.tsx`

**Files modified:**
- `packages/frontend/src/pages/story-detail.tsx` (replaced placeholder with full implementation)

**Notes for next agent:**
- T2.3.2 is next: description and context section (markdown textarea + acceptance criteria)
- Story detail feature components live in `src/features/story-detail/`
- The `StoryDetailHeader` is reusable — could be placed inside a Sheet wrapper for board-overlay mode later
- `priorityConfig` is duplicated between `story-card.tsx` and `story-detail-header.tsx` — consider extracting to shared util if a third usage appears

---

## 2026-03-28 — Review: T2.2.6 (approved)

**Reviewed:** Inline story creation — `inline-story-form.tsx`, updated `kanban-column.tsx` and `kanban-board.tsx`.

**Verdict:** Approved. All requirements met: "+" button only on Backlog (initial state) column, inline form with autofocus title input + priority select (P0-P3, default P2), Enter/Escape keyboard shortcuts, disabled when empty/pending. `useCreateStory` mutation creates in Backlog state automatically. Smooth slide-in animation. Board passes projectId/workflowId from hooks. Build clean. Story Board section complete (T2.2.1–T2.2.6).

---

## 2026-03-28 — T2.2.6: Build inline story creation

**Task:** "+" button in Backlog column header, inline form with title + priority, creates story via mock API, smooth animation.

**Done:**
- Created `features/kanban/inline-story-form.tsx`:
  - Compact card with autofocus title input + priority select (P0-P3, default P2) + Create/Cancel buttons
  - Enter key submits, Escape cancels
  - `useCreateStory` mutation, clears form and closes on success
  - Create button disabled when title empty or mutation pending
  - `animate-in fade-in slide-in-from-top-2 duration-200` for smooth appearance
- Updated `kanban-column.tsx`:
  - `ColumnHeader` now accepts `showAddButton` + `onAddClick` props
  - "+" button (ghost, compact) shown only on initial state column (Backlog)
  - `showForm` state toggles inline form at top of card list
  - Column receives `projectId` and `workflowId` props from board
- Updated `kanban-board.tsx`:
  - Added `useProjects` hook to get first project's ID
  - Passes `projectId` and `workflow.id` to each `KanbanColumn`

**Files created:**
- `packages/frontend/src/features/kanban/inline-story-form.tsx`

**Files modified:**
- `packages/frontend/src/features/kanban/kanban-column.tsx` (add button, form toggle, new props)
- `packages/frontend/src/features/kanban/kanban-board.tsx` (useProjects, pass IDs)

**Notes for next agent:**
- Story Board (Kanban) section is now complete (T2.2.1–T2.2.6)
- Next section is Story Detail, starting with T2.3.1 (slide-out sheet)
- The inline form creates stories in the workflow's `initialState` automatically (mock API handles this)
- `createStory` mutation invalidates `["stories"]` queries, so the board updates automatically

---

## 2026-03-28 — Review: T2.2.5 (approved)

**Reviewed:** Filter bar and sort controls — `kanban-filters.tsx`, updated `kanban-board.tsx` and `story-board.tsx`.

**Verdict:** Approved. All requirements met: multi-select dropdowns for labels (derived from stories), priority (P0-P3), persona (with colored dots). Has-proposals toggle button. Sort by priority/created/updated with dropdown. URL param persistence via `useSearchParams` with `replace: true`. Badge counts on filter buttons. "Clear (N)" button. Board applies filters via `filterAndSortStories()` with correct memo dependency chain. Build clean.

---

## 2026-03-28 — T2.2.5: Build filter bar and sort controls

**Task:** Filter bar above kanban board with multi-select filters (label, priority, persona), has-proposals toggle, sort controls, URL param persistence.

**Done:**
- Created `features/kanban/kanban-filters.tsx`:
  - `KanbanFilterBar` component with shadcn `DropdownMenu` + `DropdownMenuCheckboxItem` for multi-select
  - 4 filters: Labels (derived from stories), Priority (P0-P3), Persona (from usePersonas with colored dots), Has proposals (toggle button)
  - Sort dropdown: Priority (default), Created date, Updated date
  - "Clear (N)" button shows when filters are active
  - Badge counts on each filter button showing active selections
  - `useKanbanFilters()` hook — reads/writes `KanbanFilters` from `useSearchParams`
  - URL params: `labels`, `priorities`, `personas` as comma-separated, `hasProposals` as boolean, `sortBy` (omitted when default)
  - `replace: true` on setSearchParams to avoid polluting browser history
- Updated `kanban-board.tsx`:
  - `KanbanBoard` now accepts `filters: KanbanFilters` prop
  - `filterAndSortStories()` — applies all filters then sorts (priority order, created desc, updated desc)
  - Persona filter matches against active agent persona
  - Reordered useMemo: cardDataMap → filteredStories → grouped (dependency order)
- Updated `story-board.tsx` — renders `KanbanFilterBar` above board, passes filters to `KanbanBoard`

**Files created:**
- `packages/frontend/src/features/kanban/kanban-filters.tsx`

**Files modified:**
- `packages/frontend/src/features/kanban/kanban-board.tsx` (accepts filters, filter/sort logic)
- `packages/frontend/src/pages/story-board.tsx` (added filter bar + filters prop)

**Notes for next agent:**
- T2.2.6 is next: inline story creation in the Backlog column
- Filter state persists in URL params — e.g., `/board?labels=auth,ui&priorities=p0&sortBy=updated`
- `useKanbanFilters()` is a reusable hook exported from `kanban-filters.tsx`

---

## 2026-03-28 — Review: T2.2.4 (approved)

**Reviewed:** Transition prompt modal — `transition-prompt-modal.tsx` and updated `kanban-board.tsx`.

**Verdict:** Approved. All requirements met: modal shows when dropping on a column with a configured trigger, displaying persona avatar with colored circle + name + description. Three buttons (Run trigger/Skip trigger/Cancel) work correctly. `findTrigger()` matches by workflowId + fromState + toState. `PendingDrop` state cleanly defers the mutation. Transitions without triggers still happen silently. Dialog dismissable via overlay/escape. Build clean.

---

## 2026-03-28 — T2.2.4: Build transition prompt modal

**Task:** Modal shown when dropping a story on a column with a configured trigger. Shows persona info, "Run trigger"/"Skip trigger"/"Cancel" buttons.

**Done:**
- Created `features/kanban/transition-prompt-modal.tsx`:
  - `TransitionPromptModal` component with shadcn `Dialog`
  - Shows story title, fromState → toState transition description
  - Persona avatar (colored circle + Bot icon) with name and description
  - Three buttons: "Run trigger" (primary), "Skip trigger" (secondary), "Cancel" (outline)
  - `onOpenChange` wired to cancel for closing via overlay/escape
- Updated `kanban-board.tsx`:
  - Added `useTriggers()` hook + persona map
  - `findTrigger()` helper — matches trigger by workflowId, fromState, toState (or null toState)
  - `PendingDrop` state stores storyId + targetState while modal is open
  - `onDragEnd` now checks for trigger before transitioning:
    - Trigger found + persona resolved → show modal, defer transition
    - No trigger → transition silently (same as before)
  - `handleRunTrigger` — transitions the story (mock: same mutation, real: would also dispatch agent)
  - `handleSkipTrigger` — transitions without running agent
  - `handleCancelDrop` — cancels drop entirely, no state change
- Mock data has 4 triggers on story workflow: Backlog→Defining (PM), Defining→Decomposing (Tech Lead), In Progress→In Review (Reviewer), In Review→QA (QA)

**Files created:**
- `packages/frontend/src/features/kanban/transition-prompt-modal.tsx`

**Files modified:**
- `packages/frontend/src/features/kanban/kanban-board.tsx` (trigger check, modal integration)

**Notes for next agent:**
- T2.2.5 is next: filter bar and sort controls for the kanban board
- Currently "Run trigger" and "Skip trigger" both call the same mutation (updateStory). When the backend is built, "Run trigger" would also dispatch the agent execution.
- Transitions without triggers (e.g., Decomposing→In Progress, QA→Done) still transition silently.

---

## 2026-03-28 — Review: T2.2.3 (approved)

**Reviewed:** Drag-and-drop between kanban columns — `draggable-story-card.tsx`, updated `kanban-board.tsx` and `kanban-column.tsx`.

**Verdict:** Approved. All requirements met: @dnd-kit/core with DndContext, useDraggable, useDroppable, DragOverlay. Smooth animations via CSS.Translate transforms and 200ms drop animation. Column highlight (bg-accent + ring) on hover, "Drop here" text in empty columns. Drop triggers useUpdateStory mutation for state transition, with no-op on same-column drop. PointerSensor 8px activation prevents accidental drags. Original card fades to 0.4 opacity, overlay shows rotated clone. Cancel handler cleans up. Build clean.

---

## 2026-03-28 — T2.2.3: Implement drag-and-drop between columns

**Task:** Drag-and-drop story cards between kanban columns with smooth animations, drop placeholder, and state transition via mock API.

**Done:**
- Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Created `features/kanban/draggable-story-card.tsx`:
  - Wraps `StoryCard` with `useDraggable` hook
  - Passes story ID + data for drag context
  - Card goes semi-transparent (opacity 0.4) while dragging
  - Uses `CSS.Translate.toString(transform)` for smooth movement
- Updated `kanban-column.tsx`:
  - Columns are droppable via `useDroppable` with `id: column:${stateName}`
  - Drop target highlight: `bg-accent/40 ring-2 ring-primary/30` when `isOver`
  - Empty column text changes to "Drop here" when hovering
  - Uses `DraggableStoryCard` instead of `StoryCard`
- Updated `kanban-board.tsx`:
  - `DndContext` wraps the board with `closestCorners` collision detection
  - `PointerSensor` with 8px activation distance (prevents accidental drags on click)
  - `DragOverlay` shows rotated (2deg) semi-transparent card clone during drag
  - `onDragEnd` extracts target column from droppable data, calls `useUpdateStory` mutation with new `currentState`
  - `onDragCancel` cleans up drag state
  - No-op if dropped on same column

**Files created:**
- `packages/frontend/src/features/kanban/draggable-story-card.tsx`

**Files modified:**
- `packages/frontend/src/features/kanban/kanban-board.tsx` (DndContext, DragOverlay, onDragEnd)
- `packages/frontend/src/features/kanban/kanban-column.tsx` (useDroppable, DraggableStoryCard)
- `packages/frontend/package.json` (@dnd-kit dependencies)
- `pnpm-lock.yaml`

**Notes for next agent:**
- T2.2.4 is next: transition prompt modal (when drop triggers a workflow trigger)
- The `onDragEnd` handler currently transitions silently — T2.2.4 should intercept drops that have triggers configured and show a confirmation modal
- `DragOverlay` is at board level with a styled card clone — looks good during drag
- @dnd-kit/sortable was installed but not used yet — could be used for within-column reordering later

---

## 2026-03-28 — Review: T2.2.2 (approved)

**Reviewed:** Story card component — `features/kanban/story-card.tsx`, updated `kanban-board.tsx` and `kanban-column.tsx`.

**Verdict:** Approved. All requirements met: title with line-clamp, P0-P3 priority badges with distinct colors (red/amber/blue/slate), label pills (max 2), task progress bar with green fill + done/total count, amber proposal badge with count, pulsing persona avatar for active agents. Board-level data aggregation via `buildCardDataMap()` avoids N+1 queries with `useMemo` for performance. Proper null safety on activeAgent persona lookup. Build clean.

---

## 2026-03-28 — T2.2.2: Build story card component

**Task:** Compact story card with priority badge (P0-P3 colors), label pills, task progress bar, proposal badge, active agent indicator.

**Done:**
- Created `features/kanban/story-card.tsx`:
  - `StoryCard` component with `StoryCardData` prop for aggregated data
  - Priority badge with per-level colors (P0=red, P1=amber, P2=blue, P3=slate)
  - Label pills (up to 2 shown)
  - `TaskProgressBar` — green fill bar with "done/total" text
  - Proposal badge — amber FileCheck icon + count (only when pending > 0)
  - Active agent indicator — persona-colored avatar with pulsing green dot + persona name
  - Hover state via `hover:bg-accent/50`, links to `/stories/:id`
- Updated `kanban-board.tsx`:
  - Added `useTasks`, `useProposals`, `useExecutions`, `usePersonas` hooks
  - `buildCardDataMap()` — computes per-story aggregates (task progress, pending proposals, active agent) at board level to avoid N+1 queries
  - `useMemo` on grouped stories and card data map for performance
- Updated `kanban-column.tsx` — replaced `StoryCardPlaceholder` with `StoryCard`, passes `cardDataMap` prop
- Fixed TS strict mode error: branded `TaskId` in Set required explicit `Set<string>` typing

**Files created:**
- `packages/frontend/src/features/kanban/story-card.tsx`

**Files modified:**
- `packages/frontend/src/features/kanban/kanban-board.tsx` (added data fetching + aggregation)
- `packages/frontend/src/features/kanban/kanban-column.tsx` (replaced placeholder with StoryCard)

**Notes for next agent:**
- T2.2.3 is next: drag-and-drop between columns using @dnd-kit
- `StoryCardData` interface is exported from `story-card.tsx` — other components can reuse it
- The board fetches ALL tasks/proposals/executions/personas once and computes per-story aggregates. This avoids per-card queries.
- Mock data: Story 1 ("Auth") has 3 tasks (1 Done, 1 Running, 1 Pending) and 1 running execution

---

## 2026-03-28 — Review: T2.2.1 (approved)

**Reviewed:** Kanban board layout — `features/kanban/kanban-board.tsx`, `kanban-column.tsx`, and `story-board.tsx` page.

**Verdict:** Approved. All requirements met: columns generated from default story workflow states (7 columns), headers with colored dot + state name + count badge, horizontal scroll via ScrollArea, board fills viewport height via flex layout chain. Stories grouped correctly by `currentState`. Loading/empty states handled. Placeholder story cards are functional with links, priority badges, and label pills. Clean board/column component separation. Build clean.

---

## 2026-03-28 — T2.2.1: Build kanban board layout

**Task:** Kanban board with columns from story workflow states, column headers with state name/count/color, horizontal scroll, full viewport height.

**Done:**
- Created `features/kanban/` directory with two components:
  - `kanban-board.tsx` — main board: fetches stories + workflows, finds default story workflow, groups stories by `currentState`, renders columns in workflow state order, horizontal `ScrollArea` with `ScrollBar`
  - `kanban-column.tsx` — single column: colored dot + state name + count badge header, vertically scrollable story list, empty state with dashed border placeholder
- Placeholder story card (`StoryCardPlaceholder`) shows title (line-clamped), priority badge, label pills — will be replaced by full `StoryCard` in T2.2.2
- Board fills available viewport height via `h-full flex-col` layout in page, `min-h-0 flex-1` for the board container
- Each column is 280px wide with `shrink-0` for consistent sizing
- Updated `story-board.tsx` page to render `KanbanBoard`
- Loading and empty states handled (workflow loading, no story workflow configured)

**Files created:**
- `packages/frontend/src/features/kanban/kanban-board.tsx`
- `packages/frontend/src/features/kanban/kanban-column.tsx`

**Files modified:**
- `packages/frontend/src/pages/story-board.tsx` (replaced placeholder with KanbanBoard)

**Notes for next agent:**
- T2.2.2 is next: Build the full StoryCard component (priority colors, task progress, proposal badge, agent indicator). It will replace `StoryCardPlaceholder` in `kanban-column.tsx`.
- The kanban feature lives in `src/features/kanban/` — collocate related components there.
- Workflow states from fixtures: Backlog, Defining, Decomposing, In Progress, In Review, QA, Done (7 columns, each with color).
- Mock stories are in: Backlog (1), Decomposing (1), In Progress (1). Other columns are empty.

---

## 2026-03-28 — Review: T2.1.5 (approved)

**Reviewed:** Cost summary widget — `features/dashboard/cost-summary.tsx` and dashboard integration.

**Verdict:** Approved. All requirements met: recharts AreaChart sparkline with gradient fill showing 7-day daily spend, custom tooltip with shadcn styling, today's spend display with graceful $0.00 handling, monthly progress bar with green/amber/red thresholds. Uses `useCostSummary()` mock hook. Proper TypeScript strict mode handling (optional chaining for array access). Dashboard widget grid now complete. Build clean.

---

## 2026-03-28 — T2.1.5: Build cost summary widget

**Task:** Sparkline chart showing daily spend for last 7 days, monthly total vs cap progress bar, today's spend display.

**Done:**
- Installed `recharts` in frontend package
- Created `CostSummary` component in `features/dashboard/cost-summary.tsx`
- Uses `useCostSummary()` hook (returns dailySpend array, monthTotal, monthCap from mock API)
- Today's spend displayed prominently with dollar icon
- Sparkline: recharts `AreaChart` with gradient fill, minimal axes (X shows weekday names, Y hidden), custom tooltip styled with shadcn popover colors
- Progress bar: month total vs cap with color coding (green <80%, amber 80-95%, red ≥95%)
- "$0.00 today" shown gracefully when no data; empty state for chart
- Integrated into dashboard.tsx replacing the Cost Summary placeholder
- Fixed two TS strict mode errors (array indexing possibly undefined)

**Files created:**
- `packages/frontend/src/features/dashboard/cost-summary.tsx`

**Files modified:**
- `packages/frontend/src/pages/dashboard.tsx` (import + replace placeholder)
- `packages/frontend/package.json` (recharts dependency)
- `pnpm-lock.yaml`

**Notes for next agent:**
- recharts adds ~330KB to the bundle (warning about 500KB+ chunk). Consider code-splitting later if needed.
- Dashboard is now complete: 4 stat cards + active agents strip + 3 widgets (RecentActivity, UpcomingWork, CostSummary)
- Next task is T2.2.1: Kanban board layout for story board

---

## 2026-03-28 — Review: T2.1.4 (approved)

**Reviewed:** Upcoming work widget — `features/dashboard/upcoming-work.tsx` and dashboard integration.

**Verdict:** Approved. All task requirements met: shows next 5 ready tasks with title, parent story, persona badge, and dependency status icons. Uses `useReadyWork()` and `useTaskEdges()` hooks backed by mock data. Empty state handled. Follows established patterns from other dashboard widgets (named export, kebab-case, feature colocation, shadcn components, dark mode CSS vars). Build passes clean.

---

## 2026-03-28 — T2.1.4: Build upcoming work widget

**Task:** Dashboard widget showing next 5 tasks ready for dispatch with task title, parent story name, persona, and dependency status.

**Done:**
- Created `UpcomingWork` component in `features/dashboard/upcoming-work.tsx`
- Uses `useReadyWork()` hook (fetches pending tasks from mock API, limited to 5)
- Uses `useTaskEdges()` to determine dependency status per task
- Each row shows: persona avatar (colored if assigned, muted if not), task title, parent story name, persona name badge, dependency icon (amber GitBranch if has deps, green CheckCircle if clear)
- Links each row to `/tasks/:id` for navigation
- "View board" link navigates to `/board`
- Empty state: "No tasks ready for dispatch"
- Integrated into dashboard.tsx replacing the placeholder card
- Follows established pattern from active-agents-strip and recent-activity components

**Files created:**
- `packages/frontend/src/features/dashboard/upcoming-work.tsx`

**Files modified:**
- `packages/frontend/src/pages/dashboard.tsx` (import + replace placeholder)

**Notes for next agent:**
- T2.1.5 is next: Cost summary widget with sparkline chart (recharts or similar)
- The dashboard now has 3 widgets in a 2-col grid: RecentActivity, UpcomingWork, and a Cost Summary placeholder
- All dashboard feature components live in `src/features/dashboard/`

---

## 2026-03-28 — T1.3.1: Define all entity types

**Task:** TypeScript interfaces for all entities + ID prefix types + nanoid generator.

**Done:**
- Installed nanoid in @agentops/shared
- Created `src/ids.ts` — branded template literal ID types (`ProjectId = pj-${string}`, `StoryId = st-${string}`, etc. for all 11 entity types), `EntityId` union, `createId` factory object with methods for each entity type (7-char nanoid)
- Created `src/entities.ts` — all entity interfaces matching PLANNING.md T1.4:
  - Project, Story, Task (with ExecutionContextEntry[], RejectionPayload)
  - TaskEdge (DAG dependency graph)
  - Workflow, WorkflowState, WorkflowTransition
  - Persona (with avatar, model, tools, budget)
  - Trigger (with dispatchMode, advancementMode, possibleTargets for evaluate mode)
  - Execution (with status, outcome, cost, duration, logs)
  - Comment (with targetType, authorType, metadata)
  - ProjectMemory (with filesChanged, keyDecisions, consolidatedInto for decay)
  - Proposal (with type, payload, status)
  - All enum/union types: Priority, DispatchMode, AdvancementMode, ExecutionStatus, ExecutionOutcome, etc.
- Updated `src/index.ts` barrel export
- Verified: shared typecheck clean, full project `tsc --build` clean, lint clean

**Files created:**
- `packages/shared/src/ids.ts`
- `packages/shared/src/entities.ts`

**Files modified:**
- `packages/shared/src/index.ts` (barrel exports)
- `packages/shared/package.json` (nanoid dep)

**Notes for next agent:**
- T1.3.2 is next: API contract types (request/response, WebSocket events, enums)
- Import types from `@agentops/shared` — e.g., `import type { Story, StoryId } from "@agentops/shared"`
- `createId.story()` generates IDs like `st-a8f3k2m`
- `verbatimModuleSyntax` is on — use `import type` for type-only imports
- Story/Task states are `string` (dynamic, defined by workflow) — not fixed enums

---

## 2026-03-28 — Review: T1.3.1 (approved)

**Reviewed:** Shared entity types, ID utilities, and type exports.

**Verdict:** Approved. All 11 entity interfaces match PLANNING.md T1.4 spec precisely. Branded template literal ID types provide type safety. createId factory is clean with consistent 7-char nanoid. Proper use of `import type` for verbatimModuleSyntax. Full project build passes.

---

## 2026-03-28 — T1.3.2: Define API contract types

**Task:** Request/response types for all CRUD endpoints, WebSocket event types, aggregate stat types.

**Done:**
- Created `src/api.ts` — API contract types:
  - Generic wrappers: ApiResponse<T>, ApiListResponse<T>, ApiErrorResponse
  - CRUD request/response types for: Project, Story, Task, TaskEdge, Workflow, Persona, Comment, Proposal
  - Update requests use optional fields (Partial-style)
  - ReadyWorkItem type for ready-work query (task + story + persona)
  - Aggregate types: DashboardStats, CostSummary, ExecutionStats
  - Route param types for all entities
- Created `src/ws-events.ts` — WebSocket event types:
  - 9 event types: state_change, comment_created, agent_output_chunk, agent_started, agent_completed, proposal_created, proposal_updated, cost_update, execution_update
  - Individual event interfaces with typed payloads
  - Discriminated union `WsEvent` for type-safe handling
  - `WsEventMap` for typed subscribe API
  - `WsEventHandler<T>` generic callback type
- Updated barrel export in `src/index.ts`
- Verified: full project `tsc --build` clean, lint clean

**Files created:**
- `packages/shared/src/api.ts`
- `packages/shared/src/ws-events.ts`

**Files modified:**
- `packages/shared/src/index.ts` (added exports)

**Notes for next agent:**
- T1.4.1 is next: create mock data fixtures
- API types can be imported from `@agentops/shared`: `import type { CreateStoryRequest, StoryResponse } from "@agentops/shared"`
- WsEvent is a discriminated union — use `event.type` to narrow: `if (event.type === "agent_output_chunk") { event.chunk }`
- WsEventMap enables typed subscriptions: `subscribe<K extends WsEventType>(type: K, handler: (e: WsEventMap[K]) => void)`
- All Shared Types tasks (T1.3.x) are now complete

---

## 2026-03-28 — Review: T1.3.2 (approved)

**Reviewed:** API contract types and WebSocket event types.

**Verdict:** Approved. Comprehensive CRUD request/response types for all endpoints. WsEvent discriminated union with 9 event types enables type-safe handling. WsEventMap provides typed subscription API. Aggregate stat types (DashboardStats, CostSummary, ExecutionStats) cover UI needs. All types properly reference entities via `import type`. Build passes.

---

## 2026-03-28 — T1.4.1: Create mock data fixtures

**Task:** Realistic dataset with all entity types for mock-driven UI development.

**Done:**
- Created `packages/frontend/src/mocks/fixtures.ts` with:
  - 1 project ("AgentOps")
  - 2 workflows (story: 7 states, task: 5 states — with transitions)
  - 5 personas (PM purple, Tech Lead blue, Engineer green, Reviewer amber, QA red — each with model, tools, budget)
  - 4 triggers (auto/propose dispatch modes on story workflow transitions)
  - 3 stories in different states (In Progress, Decomposing, Backlog)
  - 10 tasks across stories (Done, Running, Pending states)
  - 4 task edges (blocks + depends_on)
  - 6 executions (5 completed, 1 running — with realistic costs and durations)
  - 15 comments (agent, user, system types — across stories and tasks)
  - 2 proposals (1 approved, 1 pending)
  - 2 project memory entries
  - Aggregate `fixtures` export object
- Added `@agentops/shared` as workspace dependency to frontend
- All IDs use branded template literal types (no `as any` casts)
- Verified: typecheck clean, vite build clean, lint clean

**Files created:**
- `packages/frontend/src/mocks/fixtures.ts`

**Files modified:**
- `packages/frontend/package.json` (@agentops/shared workspace dep)

**Notes for next agent:**
- T1.4.2 is next: mock API service layer
- Import fixtures: `import { fixtures } from "@/mocks/fixtures"` or individual arrays
- Fixed IDs at top of file for easy cross-referencing (e.g., STORY_1, PERSONA_PM)
- Story 1 "Auth" has a running execution (EXEC_4) — good for agent monitor testing
- Story 2 "Dashboard" has a pending proposal (pp-prop002) — good for proposals UI testing
- Frontend now depends on @agentops/shared as workspace package

---

## 2026-03-28 — Review: T1.4.1 (approved)

**Reviewed:** Mock data fixtures for all entity types.

**Verdict:** Approved. All requirements met: 1 project, 2 workflows (story 7-state + task 5-state), 5 personas with distinct colors/icons, 3 stories in different states, 10 tasks, 4 dependency edges, 6 executions (including 1 running), 15 comments across entities, 2 proposals (1 approved + 1 pending — good for testing both states), 2 project memories. Strongly typed with no `as any`. Build passes.

---

## 2026-03-28 — T1.4.2: Build mock API service layer

**Task:** Build mock API service layer with in-memory store, simulated latency, and functions matching real API shape.

**Done:**
- Created `packages/frontend/src/mocks/api.ts` with full CRUD mock API
- In-memory store initialized from fixtures (shallow copy of each array)
- `delay()` helper adds 50-150ms random latency for realistic loading states
- CRUD functions for: Projects, Stories, Tasks, TaskEdges, Workflows, Personas, Triggers, Executions, Comments, Proposals, ProjectMemory
- Aggregate query functions: `getDashboardStats()`, `getCostSummary()`, `getExecutionStats()`, `getReadyWork()`
- `resetStore()` utility to restore initial fixture state (for demo/test reset)
- Bundled `mockApi` object that exports all functions as a single namespace
- All functions use shared types from `@agentops/shared` for request/response shapes
- Create functions use `createId` from shared to generate proper prefixed IDs

**Files created:**
- `packages/frontend/src/mocks/api.ts`

**Notes for next agent:**
- T1.4.3 is next: TanStack Query hooks. Each hook should call the corresponding mock API function from this file.
- The `mockApi` export can be imported as a namespace: `import { mockApi } from "@/mocks/api"`
- Individual functions are also exported for direct import: `import { getStories } from "@/mocks/api"`
- Mutations (create/update/delete) mutate the in-memory store directly — TanStack Query hooks should invalidate queries after mutations

---

## 2026-03-28 — Review: T1.4.2 (approved)

**Reviewed:** Mock API service layer in `packages/frontend/src/mocks/api.ts`.

**Verdict:** Approved. All requirements met: in-memory store from fixtures, 50-150ms simulated latency, full CRUD for all 11 entity types, aggregate queries (dashboard stats, cost summary, execution stats, ready work) matching shared contract types, `resetStore()` utility, bundled `mockApi` namespace. Properly typed with `import type` for type-only imports. Build passes clean.

---

## 2026-03-28 — T1.4.3: Build TanStack Query hooks

**Task:** Build TanStack Query hooks backed by mock API, one hook per API call, with optimistic update helpers for mutations.

**Done:**
- Created centralized `query-keys.ts` with typed query key factory for all entities
- Created hook files per domain: `use-projects.ts`, `use-stories.ts`, `use-tasks.ts`, `use-workflows.ts`, `use-personas.ts`, `use-executions.ts`, `use-comments.ts`, `use-proposals.ts`, `use-dashboard.ts`
- Query hooks: `useProjects`, `useProject`, `useStories`, `useStory`, `useTasks`, `useTask`, `useTaskEdges`, `useWorkflows`, `useWorkflow`, `useTriggers`, `usePersonas`, `usePersona`, `useExecutions`, `useExecution`, `useComments`, `useProposals`, `useProposal`, `useProjectMemories`, `useDashboardStats`, `useCostSummary`, `useExecutionStats`, `useReadyWork`
- Mutation hooks: `useCreateStory`, `useUpdateStory`, `useDeleteStory`, `useCreateTask`, `useUpdateTask`, `useDeleteTask`, `useCreateTaskEdge`, `useDeleteTaskEdge`, `useCreateWorkflow`, `useUpdateWorkflow`, `useDeleteWorkflow`, `useCreatePersona`, `useUpdatePersona`, `useDeletePersona`, `useCreateProject`, `useUpdateProject`, `useDeleteProject`, `useCreateComment`, `useUpdateProposal`
- Optimistic updates on `useUpdateStory` and `useUpdateTask` (cancel in-flight, snapshot previous, rollback on error)
- All mutations invalidate relevant queries on success/settle
- Barrel export in `hooks/index.ts`

**Files created:**
- `packages/frontend/src/hooks/query-keys.ts`
- `packages/frontend/src/hooks/use-projects.ts`
- `packages/frontend/src/hooks/use-stories.ts`
- `packages/frontend/src/hooks/use-tasks.ts`
- `packages/frontend/src/hooks/use-workflows.ts`
- `packages/frontend/src/hooks/use-personas.ts`
- `packages/frontend/src/hooks/use-executions.ts`
- `packages/frontend/src/hooks/use-comments.ts`
- `packages/frontend/src/hooks/use-proposals.ts`
- `packages/frontend/src/hooks/use-dashboard.ts`
- `packages/frontend/src/hooks/index.ts`

**Notes for next agent:**
- Import hooks from `@/hooks` (barrel export) or individual files
- Query keys are in `@/hooks/query-keys` — use for manual invalidation or prefetching
- Optimistic updates are on story and task update mutations (the most frequently edited entities)
- T1.4.4 is next: mock WebSocket system

---

## 2026-03-28 — Review: T1.4.3 (approved)

**Reviewed:** TanStack Query hooks in `packages/frontend/src/hooks/`.

**Verdict:** Approved. All requirements met: 22 query hooks + 18 mutation hooks covering every mock API function. Centralized query key factory with proper `as const` typing. Optimistic updates on `useUpdateStory` and `useUpdateTask` with cancel/snapshot/rollback pattern. All mutations invalidate relevant queries. `useUpdateProposal` also invalidates dashboard stats. Barrel export in `hooks/index.ts`. Consistent patterns, proper `import type` usage. Build passes clean.

---

## 2026-03-28 — T1.4.4: Build mock WebSocket system

**Task:** Build mock WebSocket event emitter with subscribe API, simulating agent output streaming, state transitions, comments, proposals, and cost ticker.

**Done:**
- Created `packages/frontend/src/mocks/ws.ts` with `MockWsClient` class
- Typed event emitter using `WsEventMap` from `@agentops/shared` — per-type subscriber sets + wildcard `"*"` for all events
- `subscribe(eventType, handler)` — returns unsubscribe function
- `subscribeAll(handler)` — subscribe to all event types
- `emit(event)` — dispatches to typed + wildcard subscribers
- `emitAfter(event, delayMs)` — scheduled delayed emit with cancel
- Simulation helpers:
  - `simulateAgentOutput()` — streams text chunks at configurable intervals
  - `simulateCostTicker()` — periodic cost_update events with incrementing values
  - `simulateAgentRun()` — full lifecycle: agent_started → output chunks → agent_completed + execution_update
- Timer/interval management: `clearAll()` cancels all pending, `removeAllListeners()` clears subscribers
- Event factory helpers: `createStateChangeEvent()`, `createCommentCreatedEvent()`, etc. — convenience functions that auto-add `type` and `timestamp`
- Singleton export: `mockWs` instance for app-wide use
- Re-exports WsEvent types for consumer convenience

**Files created:**
- `packages/frontend/src/mocks/ws.ts`

**Notes for next agent:**
- T1.4.5 is next: demo mode. Use `mockWs` to emit events in a scripted sequence.
- Import `mockWs` from `@/mocks/ws` — it's a singleton, shared across all components
- Event factories like `createStateChangeEvent()` save boilerplate when constructing events
- `simulateAgentRun()` handles the full started→chunks→completed lifecycle
- `clearAll()` should be called on demo stop/reset to cancel pending timers

---

## 2026-03-28 — Review: T1.4.4 (approved)

**Reviewed:** Mock WebSocket system in `packages/frontend/src/mocks/ws.ts`.

**Verdict:** Approved. All requirements met: typed event emitter using `WsEventMap` with per-type + wildcard subscriptions, `subscribe()` returning unsubscribe function for React cleanup. Simulation helpers cover agent output streaming (chunks at intervals), cost ticker (periodic with rounding), and full agent lifecycle orchestration. Event factory helpers for all event types. Proper timer/interval management with `clearAll()`. Singleton `mockWs` export. Build passes clean.

---

## 2026-03-28 — T1.4.5: Build demo mode

**Task:** Build scripted ~60-second demo replaying a story lifecycle via mock WebSocket events. Toggle via UI button or `?demo=true`.

**Done:**
- Created `packages/frontend/src/mocks/demo.ts` with scripted demo sequence
- Full story lifecycle over ~60 seconds:
  - 0s: Story created → Backlog
  - 2s: Story → Defining, PM agent streams acceptance criteria (~10s)
  - 12s: PM done, comment posted, story → Decomposing
  - 14s: Tech Lead agent streams task decomposition (~12s)
  - 26s: Tech Lead done, proposal created (3 tasks)
  - 29s: Proposal approved, story → In Progress, 3 tasks → Pending
  - 31s: Engineer starts task 1, streams code implementation (~10s)
  - 42s: Engineer done, task → Review, story → In Review
  - 44s: Reviewer agent streams review (~6s)
  - 51s: Review passed, task → Done, story → QA
  - 53s: QA agent streams test results (~5s)
  - 59s: QA passed, story → Done
  - 61s: Demo auto-stops
- Uses `mockWs.simulateAgentRun()` for all agent lifecycles (started→chunks→completed)
- Cost ticker runs throughout the demo at $0.02/2s increments
- Realistic agent output text (PM criteria, TL decomposition, Engineer code, Reviewer checks, QA tests)
- API: `startDemo()`, `stopDemo()`, `isDemoRunning()`, `onDemoStop(callback)`, `checkDemoAutoStart()`
- `checkDemoAutoStart()` reads `?demo=true` from URL params
- All timers tracked and cancellable via `stopDemo()` + `mockWs.clearAll()`

**Files created:**
- `packages/frontend/src/mocks/demo.ts`

**Notes for next agent:**
- Sprint 1 mock data layer is now complete (T1.4.1–T1.4.5)
- Call `checkDemoAutoStart()` in app initialization to support `?demo=true` auto-start
- `startDemo()` can be wired to a "Watch Demo" button on the dashboard
- `onDemoStop(callback)` can reset UI state when demo ends
- Next work is Sprint 2: Core UI Screens (T2.1.1+)

---

## 2026-03-28 — Review: T1.4.5 (approved)

**Reviewed:** Demo mode in `packages/frontend/src/mocks/demo.ts`.

**Verdict:** Approved. Full story lifecycle scripted over ~60 seconds across all 7 workflow states. 5 agent runs (PM, TL, Engineer, Reviewer, QA) with realistic streaming output — including actual TypeScript code from Engineer. All 9 WS event types exercised. Proper timer management: `schedule()` tracks timeouts, `stopDemo()` cancels everything including cost ticker. Control API complete: start/stop/isRunning/onStop/autoStart. Demo IDs properly namespaced to avoid fixture conflicts. Build passes clean. Sprint 1 mock data layer is now fully complete.

---

## 2026-03-28 — T2.1.1: Build dashboard page layout

**Task:** Build dashboard page with status cards row: Active Agents, Pending Proposals, Needs Attention, Today's Cost. Each clickable, navigating to relevant screen.

**Done:**
- Replaced placeholder `DashboardPage` with full layout
- 4 status cards in responsive grid (1 col mobile, 2 col sm, 4 col lg)
- Each card: icon with colored background, title label, large value
  - Active Agents (green Bot icon) → navigates to /agents
  - Pending Proposals (amber FileCheck icon) → navigates to /board
  - Needs Attention (red AlertTriangle icon) → navigates to /activity
  - Today's Cost (blue DollarSign icon) → navigates to /settings
- Cards use `useDashboardStats()` hook from mock API — real data, not hardcoded
- Loading state shows "—" while data fetches
- Dark mode support on all icon backgrounds
- Hover effect on cards (`hover:bg-accent/50`)
- Placeholder cards for upcoming widgets (T2.1.2–T2.1.5) in 2-column grid
- Extracted reusable `StatCard` component within the file

**Files modified:**
- `packages/frontend/src/pages/dashboard.tsx`

**Notes for next agent:**
- T2.1.2 is next: active agents strip component. Replace the "Active Agents" placeholder card in the bottom grid.
- `useDashboardStats()` hook returns `{ activeAgents, pendingProposals, needsAttention, todayCostUsd }`
- Dashboard uses `useNavigate` from react-router for card click navigation
- lucide-react icons are used throughout — import from "lucide-react"

---

## 2026-03-28 — Review: T2.1.1 (approved)

**Reviewed:** Dashboard page layout with status cards in `packages/frontend/src/pages/dashboard.tsx`.

**Verdict:** Approved. All 4 status cards present with correct navigation targets. Data driven by `useDashboardStats()` hook. Responsive grid (1→2→4 cols). Loading state, dark mode, hover effects all correct. Reusable `StatCard` component cleanly extracted. Placeholder cards for upcoming T2.1.2–T2.1.5 widgets. Build passes clean.

---

## 2026-03-28 — T2.1.2: Build active agents strip component

**Task:** Build horizontal scrollable row of active agent cards on the dashboard. Each card shows persona avatar, task name, elapsed time (live-updating), pulsing status dot. Empty state when no agents running.

**Done:**
- Created `packages/frontend/src/features/dashboard/active-agents-strip.tsx`
- `ActiveAgentsStrip` component filters running executions from `useExecutions()` hook
- Persona lookup via `usePersonas()` for avatar color and name
- Each `AgentCard`: persona-colored avatar circle with Bot icon, pulsing green status dot (CSS `animate-ping`), persona name, task summary, live elapsed time (1-second interval via `useState`/`useEffect`)
- Horizontal scroll via shadcn `ScrollArea` with `ScrollBar orientation="horizontal"`
- Fixed card width (w-56) for consistent scrollable layout
- Click navigates to `/agents` (agent monitor)
- Empty state: centered Bot icon with "No active agents" text
- Integrated into dashboard page, replacing the "Active Agents" placeholder card
- First use of `features/` directory convention per CLAUDE.md

**Files created:**
- `packages/frontend/src/features/dashboard/active-agents-strip.tsx`

**Files modified:**
- `packages/frontend/src/pages/dashboard.tsx` (added import + replaced placeholder)

**Notes for next agent:**
- T2.1.3 is next: recent activity feed component for the dashboard
- `features/dashboard/` is now established as the pattern for dashboard sub-components
- The elapsed time updates every second — `formatElapsed()` helper handles s/m/h formatting
- Remaining placeholder cards on dashboard: Recent Activity (T2.1.3), Upcoming Work (T2.1.4), Cost Summary (T2.1.5)

---

## 2026-03-28 — Review: T2.1.2 (approved)

**Reviewed:** Active agents strip in `packages/frontend/src/features/dashboard/active-agents-strip.tsx`.

**Verdict:** Approved. Horizontal scrollable row of agent cards via shadcn ScrollArea. Each card: persona-colored avatar with Bot icon, pulsing green dot (animate-ping), truncated summary, live elapsed time (1s interval with cleanup). Empty state when no running executions. Data from useExecutions() + usePersonas() hooks. Properly integrated into dashboard replacing placeholder. First use of features/dashboard/ convention. Build passes clean.

---

## 2026-03-28 — T2.1.3: Build recent activity feed component

**Task:** Compact list of last ~10 events on dashboard. Each entry: event icon (color-coded), persona avatar, description, relative timestamp. Click navigates to source. "View all" link.

**Done:**
- Created `packages/frontend/src/features/dashboard/recent-activity.tsx`
- Unified `ActivityEvent` type derived from 3 data sources:
  - Completed executions → "agent_completed" events
  - Fixture comments → "comment_posted" (user/agent) or "state_change" (system)
  - Proposals → "proposal_created" events
- Custom `useActivityEvents()` hook aggregates, sorts by timestamp, takes last 10
- 4 event types with color-coded icons:
  - state_change: blue ArrowRightLeft
  - agent_completed: green CheckCircle2
  - comment_posted: violet MessageSquare
  - proposal_created: amber FileCheck
- Persona avatar shown when event has a personaId (colored circle + Bot icon)
- Each row: icon, optional persona avatar, truncated description, relative time
- Click navigates to source entity (story or task detail via Link)
- "View all" link navigates to /activity
- Empty state: "Nothing yet"
- `relativeTime()` helper: "just now", "Xm ago", "Xh ago", "Xd ago"
- Integrated into dashboard, replacing "Recent Activity" placeholder

**Files created:**
- `packages/frontend/src/features/dashboard/recent-activity.tsx`

**Files modified:**
- `packages/frontend/src/pages/dashboard.tsx` (added import + replaced placeholder)

**Notes for next agent:**
- T2.1.4 is next: upcoming work widget
- Remaining dashboard placeholders: Upcoming Work (T2.1.4), Cost Summary (T2.1.5)
- The `useActivityEvents()` pattern can be reused/extended for the full Activity Feed page (T2.7.1)

---

## 2026-03-28 — Review: T2.1.3 (approved)

**Reviewed:** Recent activity feed in `packages/frontend/src/features/dashboard/recent-activity.tsx`.

**Verdict:** Approved. Unified event feed from 3 data sources (executions, comments, proposals) sorted by timestamp, capped at 10. Four color-coded event types with distinct icons. Persona avatars shown for agent events. Truncated descriptions, relative timestamps, click-to-navigate via Link. "View all" link to /activity. Empty state handled. Properly integrated into dashboard. Build passes clean. Completed [x] count now at 10 — next run will trigger CLEANUP.
