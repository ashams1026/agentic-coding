# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

## Sprint 6: Data Model & UI Overhaul

> Major refactor: unified WorkItem model, multi-view UI, hardcoded workflow, Router agent.
> See PLANNING.md "Core Concepts" for the full design.
> The existing frontend code uses Story + Task entities — these must be unified into WorkItem.

### Shared Types Refactor

- [x] **O.1** — Refactor shared entity types. In `packages/shared/src/entities.ts`: replace `Story` and `Task` interfaces with a single `WorkItem` interface (`id`, `parentId`, `projectId`, `title`, `description`, `context`, `currentState`, `priority`, `labels[]`, `assignedPersonaId`, `executionContext[]`, `createdAt`, `updatedAt`). Replace `TaskEdge` with `WorkItemEdge`. Remove `Workflow` type (now a hardcoded constant). Remove `Trigger` type (replaced by `PersonaAssignment`). Add `PersonaAssignment` type (`projectId`, `stateName`, `personaId`). Update `Comment`, `Execution`, `Proposal`, `ProjectMemory` to reference `workItemId` instead of `storyId`/`taskId`. Update ID prefix to `wi-` for work items.

- [x] **O.2** — Add hardcoded workflow constant. Create `packages/shared/src/workflow.ts`: export `WORKFLOW` constant with `states[]` (Backlog, Planning, Decomposition, Ready, In Progress, In Review, Done, Blocked — each with name and color) and `transitions` map (state → valid next states array). Export helper functions: `getValidTransitions(state)`, `isValidTransition(from, to)`, `getStateByName(name)`. Export `WorkflowState` type.

- [x] **O.3** — Update API contract types. In `packages/shared/src/api-types.ts` (or equivalent): replace all Story/Task request/response types with WorkItem equivalents. Update WebSocket event types to use `workItemId`. Add `PersonaAssignment` CRUD types. Remove workflow CRUD types.

### Mock Data Refactor

- [x] **O.4** — Refactor mock data fixtures. In `packages/frontend/src/mocks/fixtures.ts`: replace `mockStories` and `mockTasks` arrays with a single `mockWorkItems` array. Top-level items have `parentId: null`, children reference parent IDs. Update all cross-references (comments, executions, proposals, edges) to use `workItemId`. Remove mock workflows array — import `WORKFLOW` from shared. Add `mockPersonaAssignments` array mapping states to personas. Ensure fixture data covers: 2-3 top-level items, 5-8 children, 2-3 grandchildren (sub-tasks), items in various states.

- [x] **O.5** — Refactor mock API layer. In `packages/frontend/src/mocks/api.ts`: replace `getStories()`, `getTasks()` etc. with `getWorkItems(parentId?)`, `getWorkItem(id)`, `createWorkItem()`, `updateWorkItem()`, `deleteWorkItem()`. Add `getPersonaAssignments(projectId)`, `updatePersonaAssignment()`. Remove workflow CRUD functions. Update all other API functions (comments, executions, proposals) to reference workItemId.

- [x] **O.6** — Refactor TanStack Query hooks. In `packages/frontend/src/hooks/`: replace `useStories()`, `useStory()`, `useTasks()`, `useTask()` with `useWorkItems(parentId?)`, `useWorkItem(id)`. Add `usePersonaAssignments(projectId)`. Remove `useWorkflows()`, `useTriggers()`. Update all consumers of old hooks throughout the frontend.

### Multi-View UI

- [x] **O.7** — Build work items page with view toggle. Create `packages/frontend/src/pages/work-items.tsx` and `packages/frontend/src/features/work-items/` directory. Page layout: top bar with `[List] [Board] [Tree]` toggle buttons, filter/group/sort controls. View state persisted in URL params (`?view=list`) and Zustand. Shared filter bar: filter by state, priority, persona, labels, parent. Group by: state, parent, priority. Sort by: priority, created, updated. Quick-add "+" button for new top-level work item. Update router: replace `/board` and `/stories` routes with `/items` route.

- [x] **O.8** — Build list view (primary). Create `packages/frontend/src/features/work-items/list-view.tsx`. Tree-indented rows showing WorkItem hierarchy via parentId. Each row: expand/collapse chevron, title, state badge (colored from WORKFLOW), priority badge, progress bar (if has children — count children in Done / total children), assigned persona avatar, active agent pulsing indicator. Collapsible groups when grouped by state/priority. "Done" group collapsed by default. Click row to select → updates selected item in Zustand → detail panel opens. Reuse existing components where possible (badges, avatars).

- [x] **O.9** — Build board view. Create `packages/frontend/src/features/work-items/board-view.tsx`. Columns generated from `WORKFLOW.states`. Flat cards — scope selector at top: "Top-level items" or "Children of [item name]" (breadcrumb). Cards show: title, priority badge, progress pill (if has children), persona avatar. Drag-and-drop between columns using existing dnd-kit setup. On drop to state with assigned persona: show prompt "This will trigger [Persona]. Run / Skip / Cancel". Reuse `StoryCard` component as base, refactored to `WorkItemCard`.

- [ ] **O.10** — Build tree view. Create `packages/frontend/src/features/work-items/tree-view.tsx`. Pure hierarchy display — no state grouping. Each node: expand/collapse, title, state badge, priority, progress bar (if has children). Indent levels visually with lines/guides. Click to select → detail panel.

- [ ] **O.11** — Build work item detail panel. Create `packages/frontend/src/features/work-items/detail-panel.tsx`. Right-side panel (~50-60% width). Refactor and reuse existing story-detail and task-detail components. Sections: header (title editable, state badge, priority, labels, parent breadcrumb), description (editable), children list (if has children — with state badges, progress, "Add child" button, "Decompose" button), proposals (if pending), comment stream (reuse from features/common), execution timeline (reuse from features/common), flow history (new — chronological state changes for this item), dependency info, execution context viewer, metadata. This is the same panel regardless of depth level — works for stories, tasks, and sub-tasks.

### Sidebar & Navigation Cleanup

- [ ] **O.12** — Update sidebar navigation. In `packages/frontend/src/components/sidebar.tsx`: replace "Story Board" nav item with "Work Items". Remove "Workflows" nav item (no workflow designer page). Update badge to show pending proposals count on Work Items. Update all route references.

- [ ] **O.13** — Update router. In `packages/frontend/src/router.tsx`: remove `/board`, `/stories/:id`, `/tasks/:id` routes. Add `/items` route pointing to new work items page. Remove workflow designer page import. Update dashboard links.

### Dashboard & Activity Feed Updates

- [ ] **O.14** — Update dashboard for WorkItem model. In dashboard components: replace story/task references with work item. Update `useDashboardStats()` hook to count work items. Update "Upcoming work" widget to show ready work items. Update activity feed events to reference work items.

- [ ] **O.15** — Update activity feed for WorkItem model. Replace "story/task" language with "work item" in event descriptions. Add Router decision events (with reasoning). Remove trigger-related event types.

### Settings: Workflow Configuration

- [ ] **O.16** — Build workflow configuration in settings. In the settings page (projects section): add per-project workflow config panel. Auto-routing toggle (ON/OFF switch). Persona-per-state table: rows for each state (from WORKFLOW.states), columns: state name (read-only), persona dropdown (from personas list), model badge. Read-only state machine diagram below the table showing states and transitions visually (simple SVG or canvas rendering of the hardcoded workflow). Remove old workflow-related settings.

### Remove Old Code

- [ ] **O.17** — Remove old story/task/workflow code. Delete: `packages/frontend/src/features/kanban/` (old kanban board), `packages/frontend/src/features/story-detail/` (replaced by detail-panel), `packages/frontend/src/features/task-detail/` (replaced by detail-panel), `packages/frontend/src/features/workflow-designer/` (no longer needed), `packages/frontend/src/pages/story-board.tsx`, `packages/frontend/src/pages/story-detail.tsx`, `packages/frontend/src/pages/task-detail.tsx`, `packages/frontend/src/pages/workflow-designer.tsx`. Keep `packages/frontend/src/features/common/` (CommentStream, ExecutionTimeline — shared components). Keep `packages/frontend/src/features/story-list/` only if parts are reusable for the new list view.

### Backend Schema (Resume with Correct Model)

- [ ] **O.18** — Rewrite Drizzle schema for WorkItem model. In `packages/backend/src/db/schema.ts`: replace `stories` and `tasks` tables with single `work_items` table (id text PK, parentId text nullable FK self-referencing, projectId text FK, title text, description text, context text JSON, currentState text, priority text, labels text JSON, assignedPersonaId text, executionContext text JSON, createdAt integer, updatedAt integer). Replace `task_edges` with `work_item_edges`. Add `persona_assignments` table (projectId text, stateName text, personaId text, PK on projectId+stateName). Remove `workflows` and `triggers` tables. Update `comments`, `executions`, `proposals`, `project_memories` to reference `workItemId`.

- [ ] **O.19** — Update seed script for WorkItem model. In `packages/backend/src/db/seed.ts`: update to insert work items (not stories/tasks), persona assignments, and all related data matching the refactored frontend fixtures.

- [ ] **O.20** — Rewrite CRUD API routes for WorkItem. Replace `routes/stories.ts` and `routes/tasks.ts` with `routes/work-items.ts`. Routes: `GET /api/work-items` (list, optional `?parentId=` and `?projectId=` filters), `GET /api/work-items/:id`, `POST /api/work-items`, `PATCH /api/work-items/:id`, `DELETE /api/work-items/:id`. Add `routes/persona-assignments.ts`: `GET /api/persona-assignments?projectId=`, `PUT /api/persona-assignments` (upsert). Remove `routes/workflows.ts`. Update `routes/task-edges.ts` → `routes/work-item-edges.ts`.

---

## Sprint 5 (remaining): Backend API Completion

> Resume from T3.1.3 onwards, but with the corrected WorkItem-based schema from Sprint 6.
> These tasks only make sense AFTER Sprint 6 is complete.

- [ ] **T3.1.3** — Set up Drizzle migrations and seed script (using new WorkItem schema from O.18/O.19)
- [ ] **T3.2.5** — Implement comment API routes (updated for workItemId)
- [ ] **T3.2.7** — Implement persona API routes
- [ ] **T3.2.8** — Implement execution API routes (updated for workItemId)
- [ ] **T3.2.9** — Implement proposal API routes (updated for parentWorkItemId)
- [ ] **T3.2.10** — Implement aggregate/dashboard API routes (updated for work items)
- [ ] **T3.3.1** — Implement real WebSocket server
- [ ] **T3.3.2** — Create API client for frontend (updated for work item endpoints)
- [ ] **T3.3.3** — Add API mode toggle to frontend
- [ ] **T3.3.4** — Connect WebSocket client to real server
