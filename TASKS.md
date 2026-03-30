# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

## Sprint 6: Data Model & UI Overhaul

> Major refactor: unified WorkItem model, multi-view UI, hardcoded workflow, Router agent.
> See PLANNING.md "Core Concepts" for the full design.
> The existing frontend code uses Story + Task entities — these must be unified into WorkItem.

### Multi-View UI (continued)

- [x] **O.11** — Build work item detail panel. Create `packages/frontend/src/features/work-items/detail-panel.tsx`. Right-side panel (~50-60% width). Refactor and reuse existing story-detail and task-detail components. Sections: header (title editable, state badge, priority, labels, parent breadcrumb), description (editable), children list (if has children — with state badges, progress, "Add child" button, "Decompose" button), proposals (if pending), comment stream (reuse from features/common), execution timeline (reuse from features/common), flow history (new — chronological state changes for this item), dependency info, execution context viewer, metadata. This is the same panel regardless of depth level — works for stories, tasks, and sub-tasks.

### Sidebar & Navigation Cleanup

- [x] **O.12** — Update sidebar navigation. In `packages/frontend/src/components/sidebar.tsx`: replace "Story Board" nav item with "Work Items". Remove "Workflows" nav item (no workflow designer page). Update badge to show pending proposals count on Work Items. Update all route references.

- [x] **O.13** — Update router. In `packages/frontend/src/router.tsx`: remove `/board`, `/stories/:id`, `/tasks/:id` routes. Add `/items` route pointing to new work items page. Remove workflow designer page import. Update dashboard links.

### Dashboard & Activity Feed Updates

- [x] **O.14** — Update dashboard for WorkItem model. In dashboard components: replace story/task references with work item. Update `useDashboardStats()` hook to count work items. Update "Upcoming work" widget to show ready work items. Update activity feed events to reference work items.

- [x] **O.15** — Update activity feed for WorkItem model. Replace "story/task" language with "work item" in event descriptions. Add Router decision events (with reasoning). Remove trigger-related event types.

### Settings: Workflow Configuration

- [x] **O.16** — Build workflow configuration in settings. In the settings page (projects section): add per-project workflow config panel. Auto-routing toggle (ON/OFF switch). Persona-per-state table: rows for each state (from WORKFLOW.states), columns: state name (read-only), persona dropdown (from personas list), model badge. Read-only state machine diagram below the table showing states and transitions visually (simple SVG or canvas rendering of the hardcoded workflow). Remove old workflow-related settings.

### Remove Old Code

- [x] **O.17** — Remove old story/task/workflow code. Delete: `packages/frontend/src/features/kanban/` (old kanban board), `packages/frontend/src/features/story-detail/` (replaced by detail-panel), `packages/frontend/src/features/task-detail/` (replaced by detail-panel), `packages/frontend/src/features/workflow-designer/` (no longer needed), `packages/frontend/src/pages/story-board.tsx`, `packages/frontend/src/pages/story-detail.tsx`, `packages/frontend/src/pages/task-detail.tsx`, `packages/frontend/src/pages/workflow-designer.tsx`. Keep `packages/frontend/src/features/common/` (CommentStream, ExecutionTimeline — shared components). Keep `packages/frontend/src/features/story-list/` only if parts are reusable for the new list view.

### Backend Schema (Resume with Correct Model)

- [x] **O.18** — Rewrite Drizzle schema for WorkItem model. In `packages/backend/src/db/schema.ts`: replace `stories` and `tasks` tables with single `work_items` table (id text PK, parentId text nullable FK self-referencing, projectId text FK, title text, description text, context text JSON, currentState text, priority text, labels text JSON, assignedPersonaId text, executionContext text JSON, createdAt integer, updatedAt integer). Replace `task_edges` with `work_item_edges`. Add `persona_assignments` table (projectId text, stateName text, personaId text, PK on projectId+stateName). Remove `workflows` and `triggers` tables. Update `comments`, `executions`, `proposals`, `project_memories` to reference `workItemId`.

- [x] **O.19** — Update seed script for WorkItem model. In `packages/backend/src/db/seed.ts`: update to insert work items (not stories/tasks), persona assignments, and all related data matching the refactored frontend fixtures.

- [ ] **O.20** — Rewrite CRUD API routes for WorkItem. Replace `routes/stories.ts` and `routes/tasks.ts` with `routes/work-items.ts`. Routes: `GET /api/work-items` (list, optional `?parentId=` and `?projectId=` filters), `GET /api/work-items/:id`, `POST /api/work-items`, `PATCH /api/work-items/:id`, `DELETE /api/work-items/:id`. Add `routes/persona-assignments.ts`: `GET /api/persona-assignments?projectId=`, `PUT /api/persona-assignments` (upsert). Remove `routes/workflows.ts`. Update `routes/task-edges.ts` → `routes/work-item-edges.ts`.
  > [feedback: Bug in `routes/work-items.ts` DELETE handler (line ~148-156).
  > The recursive delete uses `and()` to combine multiple parentId conditions
  > when frontier has >1 items: `and(...frontier.map((fid) => eq(workItems.parentId, fid)))`.
  > This is logically wrong — `and(eq(parentId, "a"), eq(parentId, "b"))` requires parentId
  > to equal BOTH values simultaneously, which is impossible for a single column.
  > Fix: replace `and()` with `inArray(workItems.parentId, frontier)` from drizzle-orm.
  > Import `inArray` from "drizzle-orm" and change the where clause to:
  > `.where(inArray(workItems.parentId, frontier))`
  > This handles both single and multi-item frontiers, so the ternary can be simplified too.]

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
