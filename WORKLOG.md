# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-29 — Review: T3.2.9 (approved)

**Reviewed:** Proposal CRUD routes — `routes/proposals.ts`, `server.ts`, `shared/src/api.ts`.
- 5 routes: GET list (?workItemId filter), GET by id, POST create, PATCH status, DELETE
- Added CreateProposalRequest to shared api.ts with ProposalType import
- Serializer correctly converts Date→ISO for createdAt, casts all branded IDs
- POST defaults: status=pending, payload={}, createdAt=now
- PATCH: only updates status (feedback field intentionally not stored — no DB column)
- 404/400 error handling, correct HTTP status codes (201/204)
- Registered in server.ts
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.2.9: Implement proposal API routes

**Task:** Create proposal CRUD routes with workItemId filtering.

**Done:**
- Added `CreateProposalRequest` to `packages/shared/src/api.ts` (executionId, workItemId, type, payload?)
- Added `ProposalType` import to api.ts
- Created `routes/proposals.ts`: 5 routes
  - `GET /api/proposals?workItemId=` — list (optional filter by workItemId)
  - `GET /api/proposals/:id` — get single proposal
  - `POST /api/proposals` — create (defaults: status=pending, payload={}, createdAt=now)
  - `PATCH /api/proposals/:id` — update status (UpdateProposalRequest — status field only, feedback field not stored as DB has no column for it)
  - `DELETE /api/proposals/:id` — delete
- Serializer converts Date→ISO for createdAt, casts ProposalId/ExecutionId/WorkItemId
- Registered in `server.ts`

**Files created:** `packages/backend/src/routes/proposals.ts`
**Files modified:** `packages/backend/src/server.ts`, `packages/shared/src/api.ts`

**Notes:** Backend typecheck: 0 errors. UpdateProposalRequest has `feedback?` field but proposals table has no feedback column — PATCH only updates `status`. Feedback could be added to payload in a future iteration if needed.

---

## 2026-03-29 — Review: T3.2.8 (approved)

**Reviewed:** Execution CRUD routes — `routes/executions.ts`, `server.ts`, `shared/src/api.ts`.
- 5 routes: GET list (?workItemId filter), GET by id, POST create, PATCH update, DELETE
- Added CreateExecutionRequest/UpdateExecutionRequest to shared api.ts with correct entity type imports
- Serializer correctly converts Date→ISO for startedAt/completedAt, handles null completedAt, casts branded IDs
- POST defaults sensible: status=pending, startedAt=now, zeros/empty/null for remaining fields
- PATCH completedAt: accepts ISO string, converts to Date; handles null correctly
- JSON.stringify pattern on rejectionPayload consistent with established codebase pattern
- 404/400 error handling, correct HTTP status codes (201/204)
- Registered in server.ts
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.2.8: Implement execution API routes

**Task:** Create execution CRUD routes with workItemId filtering.

**Done:**
- Added `CreateExecutionRequest` and `UpdateExecutionRequest` to `packages/shared/src/api.ts`
  - CreateExecutionRequest: workItemId, personaId (required)
  - UpdateExecutionRequest: status?, completedAt?, costUsd?, durationMs?, summary?, outcome?, rejectionPayload?, logs?
- Created `routes/executions.ts`: 5 routes
  - `GET /api/executions?workItemId=` — list (optional filter by workItemId)
  - `GET /api/executions/:id` — get single execution
  - `POST /api/executions` — create (defaults: status=pending, startedAt=now, zeros/empty for cost/duration/summary/logs)
  - `PATCH /api/executions/:id` — partial update (all UpdateExecutionRequest fields, 400 if empty)
  - `DELETE /api/executions/:id` — delete
- Serializer converts Date→ISO for startedAt/completedAt, casts branded IDs
- completedAt in PATCH: accepts ISO string, converts to Date for DB storage
- Registered in `server.ts`

**Files created:** `packages/backend/src/routes/executions.ts`
**Files modified:** `packages/backend/src/server.ts`, `packages/shared/src/api.ts`

**Notes:** Backend typecheck: 0 errors. Added missing ExecutionStatus, ExecutionOutcome, RejectionPayload imports to api.ts for the request types.

---

## 2026-03-29 — Review: T3.2.7 (approved)

**Reviewed:** Persona CRUD routes — `routes/personas.ts`, `server.ts`.
- 5 routes: GET list, GET by id, POST create, PATCH update, DELETE
- Serializer correctly casts PersonaId, passes through all persona fields
- Uses CreatePersonaRequest/UpdatePersonaRequest from shared, createId.persona() for ID generation
- All UpdatePersonaRequest fields handled in PATCH (8 fields)
- Proper defaults on POST (avatar, allowedTools, mcpTools, maxBudgetPerRun, settings, description)
- 404 handling, correct HTTP status codes (201/204/400)
- JSON.stringify pattern in PATCH consistent with approved work-items.ts
- Registered in server.ts
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.2.7: Implement persona API routes

**Task:** Create persona CRUD routes.

**Done:**
- Created `routes/personas.ts`: 5 routes
  - `GET /api/personas` — list all
  - `GET /api/personas/:id` — get single
  - `POST /api/personas` — create (CreatePersonaRequest, defaults for avatar/tools/budget)
  - `PATCH /api/personas/:id` — partial update (UpdatePersonaRequest, 400 if no fields)
  - `DELETE /api/personas/:id` — delete
- Registered in `server.ts`
- Serializer casts PersonaId, passes through all persona fields

**Files created:** `routes/personas.ts`
**Files modified:** `server.ts`

**Notes:** Backend typecheck: 0 errors. No timestamp fields on personas — simpler serializer than other routes.

---

## 2026-03-29 — Review: T3.2.5 (approved)

**Reviewed:** Comment routes — `routes/comments.ts`, `server.ts`.
- 4 routes: GET list (?workItemId filter), GET by id, POST create, DELETE
- Serializer correctly converts Date→ISO and casts branded IDs
- Uses CreateCommentRequest from shared, createId.comment() for ID generation
- 404 handling, correct HTTP status codes (201/204)
- Registered in server.ts
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.2.5: Implement comment API routes

**Task:** Create comment CRUD routes with workItemId filtering.

**Done:**
- Created `routes/comments.ts`: 4 routes
  - `GET /api/comments?workItemId=` — list (optional filter by workItemId)
  - `GET /api/comments/:id` — get single comment
  - `POST /api/comments` — create (uses CreateCommentRequest from shared, auto-generates ID + timestamp)
  - `DELETE /api/comments/:id` — delete
- Registered in `server.ts`
- Serializer converts Date→ISO, casts branded IDs (CommentId, WorkItemId, PersonaId)
- Follows same patterns as work-items routes (404 handling, 201/204 status codes)

**Files created:** `routes/comments.ts`
**Files modified:** `server.ts`

**Notes:** Backend typecheck: 0 errors.

---

## 2026-03-29 — Review: T3.1.3 (approved)

**Reviewed:** Drizzle migrations setup — `drizzle.config.ts`, `src/db/migrate.ts`, `src/index.ts`, `src/db/seed.ts`, `package.json`, `drizzle/0000_secret_magneto.sql`.
- Config: correct SQLite dialect, schema path, output dir
- Migrator: `runMigrations()` exported, standalone mode via import.meta.url
- Server startup: migrations run before server starts
- Seed: inline SQL removed, uses `runMigrations()` instead
- Generated migration: all 9 tables with columns, PKs, FKs matching schema.ts
- 5 npm scripts present (db:generate, db:migrate, db:push, db:seed, db:studio)
- End-to-end verified: in-memory seed succeeds
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — T3.1.3: Set up Drizzle migrations and seed script

**Task:** Configure drizzle-kit for migration generation, create runtime migration runner, wire into server startup and seed.

**Done:**
- Created `drizzle.config.ts`: SQLite dialect, schema from `src/db/schema.ts`, output to `drizzle/`
- Created `src/db/migrate.ts`: `runMigrations()` using `drizzle-orm/better-sqlite3/migrator`, also runnable standalone
- Generated initial migration `drizzle/0000_secret_magneto.sql`: all 9 tables with correct columns, PKs, FKs, defaults
- Updated `src/index.ts`: runs `runMigrations()` before server start
- Updated `src/db/seed.ts`: replaced 90-line inline CREATE TABLE SQL with `runMigrations()` call
- Added 5 npm scripts to `package.json`: `db:generate`, `db:migrate`, `db:push`, `db:seed`, `db:studio`
- Tested: `DATABASE_URL=":memory:" pnpm db:seed` succeeds end-to-end (migrations + seed)

**Files created:** `drizzle.config.ts`, `src/db/migrate.ts`, `drizzle/0000_secret_magneto.sql`, `drizzle/meta/`
**Files modified:** `src/index.ts`, `src/db/seed.ts`, `package.json`

**Notes:** Backend typecheck: 0 errors. Full monorepo build: passes. Migration + seed verified working with in-memory DB.

---

## 2026-03-29 — Review: O.20 (approved after rework)

**Reviewed:** Reworked DELETE handler in `routes/work-items.ts`.
- `and()` correctly replaced with `inArray(workItems.parentId, frontier)`
- `inArray` properly imported from drizzle-orm
- Ternary simplified — single `inArray()` handles both single and multi-item frontiers
- All 10 routes across 3 files still correct (verified in prior review)
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — O.20 (rework): Fix recursive delete bug

**Task:** Address review feedback — replace `and()` with `inArray()` in DELETE handler.

**Done:**
- Imported `inArray` from "drizzle-orm" in `routes/work-items.ts`
- Replaced the broken ternary `frontier.length === 1 ? eq(...) : and(...)` with simple `inArray(workItems.parentId, frontier)`
- `inArray` correctly handles both single and multi-item arrays, so the ternary was removed entirely

**Files modified:** `routes/work-items.ts` (2 lines changed)

**Notes:** Backend typecheck: 0 errors. The fix ensures recursive delete correctly finds all descendants at every level, not just direct children.

---

## 2026-03-29 — Review: O.20 (rejected)

**Reviewed:** CRUD routes — `routes/work-items.ts`, `routes/persona-assignments.ts`, `routes/work-item-edges.ts`, `server.ts`.
- 10 routes present, correct HTTP verbs and status codes, serializers working, build passes
- **Bug found**: Recursive DELETE in work-items.ts uses `and()` instead of `inArray()` for multi-child frontier. When frontier has >1 items, `and(eq(parentId, "a"), eq(parentId, "b"))` returns 0 results (impossible condition), orphaning grandchildren.
- Feedback: use `inArray(workItems.parentId, frontier)` from drizzle-orm
- Verdict: **rejected**

---

## 2026-03-29 — O.20: Rewrite CRUD API routes for WorkItem

**Task:** Create routes/work-items.ts, routes/persona-assignments.ts, routes/work-item-edges.ts. Register in server.ts.

**Done:**
- Created `routes/work-items.ts`: 5 routes
  - `GET /api/work-items` — list with optional `?parentId=` and `?projectId=` filters
  - `GET /api/work-items/:id` — get single item
  - `POST /api/work-items` — create (uses WORKFLOW.initialState, createId.workItem())
  - `PATCH /api/work-items/:id` — partial update (only provided fields, auto-sets updatedAt)
  - `DELETE /api/work-items/:id` — recursive delete (collects all descendant IDs, deletes deepest first)
- Created `routes/persona-assignments.ts`: 2 routes
  - `GET /api/persona-assignments?projectId=` — list
  - `PUT /api/persona-assignments` — upsert (onConflictDoUpdate on composite PK)
- Created `routes/work-item-edges.ts`: 3 routes
  - `GET /api/work-item-edges?workItemId=` — list (matches both fromId and toId)
  - `POST /api/work-item-edges` — create
  - `DELETE /api/work-item-edges/:id` — delete
- Updated `server.ts`: registered all 3 route modules, added PUT to CORS methods
- Added `@agentops/shared` as workspace dependency to backend package.json
- Serializer functions convert DB types (Date → ISO string, branded IDs)

**Files created:** `routes/work-items.ts`, `routes/persona-assignments.ts`, `routes/work-item-edges.ts`
**Files modified:** `server.ts`, `package.json`

**Notes:** All routes return `{ data, total }` list format or `{ data }` single format matching shared API types. Backend typecheck: 0 errors. Full monorepo build: passes.

---

## 2026-03-29 — Review: O.19 (approved)

**Reviewed:** Seed script and DB connection — `packages/backend/src/db/seed.ts`, `packages/backend/src/db/connection.ts`.
- All 9 entity types seeded matching frontend fixtures exactly (1 project, 5 personas, 16 work items, 4 edges, 4 assignments, 8 executions, 15 comments, 2 proposals, 2 memories)
- All IDs match frontend fixtures for cross-system consistency
- Dependency-ordered inserts (projects → personas → workItems → ...) and reverse-order deletes
- Idempotent: CREATE TABLE IF NOT EXISTS + delete-before-insert
- connection.ts: WAL mode, FK enforcement, proper type annotation
- Note: costUsd/maxBudgetPerRun stored as cents (integer) vs fixtures' dollars — correct for SQLite integer column, API layer will convert
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — O.19: Update seed script for WorkItem model

**Task:** Create `packages/backend/src/db/seed.ts` with seed data matching frontend fixtures.

**Done:**
- Created `packages/backend/src/db/connection.ts`: DB connection module using better-sqlite3 + drizzle-orm, WAL mode, FK enforcement, exports `db` and `sqlite`
- Created `packages/backend/src/db/seed.ts`: Full seed script inserting all data matching `packages/frontend/src/mocks/fixtures.ts`:
  - 1 project (AgentOps)
  - 5 personas (PM, Tech Lead, Engineer, Reviewer, QA)
  - 16 work items (3 top-level, 7 children, 3 grandchildren, 3 more children)
  - 4 work item edges (2 blocks, 2 depends_on)
  - 4 persona assignments (Planning, Decomposition, In Progress, In Review)
  - 8 executions (including 2 running, 1 rejected)
  - 15 comments (user, agent, system types)
  - 2 proposals (1 approved, 1 pending)
  - 2 project memories
- Creates tables via raw SQL (IF NOT EXISTS) then inserts via Drizzle ORM
- Clears existing data before inserting (idempotent)
- Cost values stored as cents (integer), timestamps as Date objects for timestamp_ms mode

**Files created:** `packages/backend/src/db/connection.ts`, `packages/backend/src/db/seed.ts`

**Notes:** Backend typecheck: 0 errors. Full monorepo build: passes. IDs match frontend fixtures exactly for consistency.

---

## 2026-03-29 — Review: O.18 (approved)

**Reviewed:** Drizzle schema — `packages/backend/src/db/schema.ts`.
- All 9 entity tables present matching shared/entities.ts (projects, work_items, work_item_edges, persona_assignments, personas, executions, comments, proposals, project_memories)
- No workflows or triggers tables — correct per WorkItem model
- work_items table has all 13 columns from task spec including self-referencing parentId
- persona_assignments uses composite PK (projectId + stateName) — correct
- All cross-table FKs defined (comments/executions/proposals/memories → workItemId)
- JSON columns use $type<> for type safety
- Relations correctly defined including self-referencing parent/child
- Backend typecheck: 0 errors
- Verdict: **approved**

---

## 2026-03-29 — O.18: Rewrite Drizzle schema for WorkItem model

**Task:** Create `packages/backend/src/db/schema.ts` with Drizzle ORM schema matching the WorkItem-based entity model from `@agentops/shared`.

**Done:**
- Created `packages/backend/src/db/schema.ts` with 9 tables:
  - `projects` — id, name, path, settings (JSON), createdAt
  - `work_items` — id, parentId (self-referencing), projectId FK, title, description, context (JSON), currentState, priority, labels (JSON), assignedPersonaId FK, executionContext (JSON array), createdAt, updatedAt
  - `work_item_edges` — id, fromId FK, toId FK, type (blocks/depends_on/related_to)
  - `persona_assignments` — composite PK (projectId + stateName), personaId FK
  - `personas` — id, name, description, avatar (JSON), systemPrompt, model, allowedTools (JSON), mcpTools (JSON), maxBudgetPerRun, settings (JSON)
  - `executions` — id, workItemId FK, personaId FK, status, startedAt, completedAt, costUsd, durationMs, summary, outcome, rejectionPayload (JSON), logs
  - `comments` — id, workItemId FK, authorType, authorId, authorName, content, metadata (JSON), createdAt
  - `proposals` — id, executionId FK, workItemId FK, type, payload (JSON), status, createdAt
  - `project_memories` — id, projectId FK, workItemId FK, summary, filesChanged (JSON), keyDecisions (JSON), createdAt, consolidatedInto
- All relations defined (parent/child self-referencing on work_items, FKs for all cross-table refs)
- No `workflows` or `triggers` tables — hardcoded WORKFLOW from shared replaces them
- JSON columns use `$type<>()` for type safety matching shared entity interfaces
- Timestamps use `integer("...", { mode: "timestamp_ms" })` for SQLite compatibility

**Files created:** `packages/backend/src/db/schema.ts`
**Files modified:** none (new file only)

**Notes:** Backend typecheck + build: 0 errors. Full monorepo build: passes. Schema aligns 1:1 with entities in `packages/shared/src/entities.ts`.

---

## 2026-03-29 — Review: O.17 (approved)

**Reviewed:** Old code removal — 26 files deleted, 7 files fixed.
- All 5 directories deleted: kanban/, story-detail/, task-detail/, workflow-designer/, story-list/
- All 4 old pages deleted: story-board, story-detail, task-detail, workflow-designer
- features/common/ preserved with 4 files
- 7 remaining files fixed for WorkItem types (agent-monitor, command-palette, mocks)
- Frontend typecheck: 0 errors confirmed
- Frontend build: passes
- Verdict: **approved**

---

## 2026-03-29 — O.17: Remove old story/task/workflow code

**Task:** Delete old feature directories and pages, fix remaining type errors to achieve clean build.

**Done:**
- Deleted directories: `features/kanban/` (7 files), `features/story-detail/` (5 files), `features/task-detail/` (4 files), `features/workflow-designer/` (6 files), `features/story-list/` (4 files)
- Deleted pages: `pages/story-board.tsx`, `pages/story-detail.tsx`, `pages/task-detail.tsx`, `pages/workflow-designer.tsx`
- Kept: `features/common/` (CommentStream, ExecutionTimeline, empty-states, loading-skeletons)
- Fixed remaining type errors in 7 files that still used old Story/Task types:
  - `features/agent-monitor/active-agent-sidebar.tsx`: useTasks/useStories → useWorkItems, exec.targetId → exec.workItemId
  - `features/agent-monitor/agent-control-bar.tsx`: same pattern + navigation links to /work-items/
  - `features/agent-monitor/agent-history.tsx`: same pattern
  - `features/agent-monitor/split-view.tsx`: same pattern
  - `features/command-palette/command-palette.tsx`: merged stories/tasks into single work-items category
  - `mocks/demo.ts`: StoryId/TaskId → WorkItemId, all WS events use workItemId/workItemTitle
  - `mocks/ws.ts`: StoryId/TaskId → WorkItemId in simulateAgentRun

**Result:** Frontend typecheck: 0 errors. Full `pnpm build`: passes (1,119 KB bundle).

**Files deleted:** 26 files across 5 directories + 4 pages
**Files modified:** 7 files (agent-monitor, command-palette, mocks)

---

## 2026-03-29 — Review: O.16 (approved)

**Reviewed:** Workflow configuration — `workflow-config-section.tsx`, `settings-layout.tsx`, `projects-section.tsx`.
- All 6 requirements met: workflow config panel in settings, auto-routing toggle, persona-per-state table (5 states, dropdown + model badge), SVG state machine diagram, old workflow refs removed from projects
- PersonaStateTable correctly filters out Backlog/Done/Blocked (non-configurable per PLANNING.md)
- WorkflowDiagram renders all states with transitions, Blocked positioned below
- projects-section fully cleaned — zero workflow/WorkflowId references remain
- No type errors
- Verdict: **approved**

---

## 2026-03-29 — O.16: Build workflow configuration in settings

**Task:** Add per-project workflow config panel with auto-routing toggle, persona-per-state table, state machine diagram.

**Done:**
- Created `features/settings/workflow-config-section.tsx`:
  - AutoRoutingToggle: ON/OFF switch with description
  - PersonaStateTable: grid of configurable states (Planning, Decomposition, Ready, In Progress, In Review) with persona dropdown (from usePersonas) and model badge (opus/sonnet/haiku with colors). Note about Backlog/Done/Blocked being non-configurable
  - WorkflowDiagram: read-only SVG rendering of WORKFLOW states and transitions. Horizontal layout for main states, Blocked below. Arrow markers, colored node fills from WORKFLOW.states
  - Uses usePersonaAssignments/useUpdatePersonaAssignment for live updates
- Updated `features/settings/settings-layout.tsx`: added "Workflow" section with GitBranch icon between Projects and API Keys
- Updated `features/settings/projects-section.tsx`: removed all workflow references (workflowId form field, defaultWorkflowId, workflow name badge, useWorkflows import, WorkflowId type)

**Files created:** `features/settings/workflow-config-section.tsx`
**Files modified:** `features/settings/settings-layout.tsx`, `features/settings/projects-section.tsx`

**Notes:** All settings files compile clean. Workflow config is read-only for state machine — only persona assignments are editable.

---

## 2026-03-29 — Review: O.15 (approved)

**Reviewed:** Activity feed — `activity-feed.tsx`.
- All 5 requirements met: story/task language replaced, router_decision event added with reasoning, trigger refs removed, WS events use new fields
- Only remaining "trigger" reference is `triggeredBy` on StateChangeEvent — correct field name
- Router decision event has Route icon + indigo color + descriptive reasoning text
- Story filter removed from FilterBar (simplified to persona + date + type)
- No type errors
- Verdict: **approved**

---

## 2026-03-29 — O.15: Update activity feed for WorkItem model

**Task:** Replace story/task language with work item, add Router decision events, remove trigger-related types.

**Done:**
- Rewrote `features/activity-feed/activity-feed.tsx`:
  - Replaced all `exec.targetType`/`exec.targetId`, `comment.targetType`/`comment.targetId`, `proposal.parentType`/`proposal.parentId` with workItemId-based logic
  - All target paths → `/items`, all target labels → "work item"
  - Replaced "story/task" language with "work item" in all event descriptions
  - Added `router_decision` event type with Route icon and indigo color
  - Added mock Router decision event ("Router: Moved to Ready")
  - Removed story filter from FilterBar (was `storyId` filter — replaced by simpler persona + date + type filters)
  - Updated WS event handlers to use new field names (workItemId, workItemTitle)
  - Renamed internal FilterBar → FeedFilterBar to avoid conflict with work-items filter-bar
  - Replaced `useStories` import with clean hooks (useExecutions, useProposals, usePersonas)

**Files modified:** `features/activity-feed/activity-feed.tsx`

**Notes:** Compiles clean. Grid columns for event type checkboxes changed from 5 to 4 (now 11 types with router_decision added).

---

## 2026-03-29 — Review: O.14 (approved)

**Reviewed:** Dashboard components — `upcoming-work.tsx`, `recent-activity.tsx`, `active-agents-strip.tsx`.
- All 5 requirements met: story/task refs removed, stats hook works, upcoming work uses ReadyWorkItem.workItem, activity feed uses workItemId, all compile
- Confirmed zero remaining Story/Task/targetType/targetId references in dashboard features
- WS event handlers correctly use new field names (workItemId, workItemTitle)
- No type errors
- Verdict: **approved**

---

## 2026-03-29 — O.14: Update dashboard for WorkItem model

**Task:** Replace story/task references in dashboard with work item, update upcoming work and activity feed.

**Done:**
- Rewrote `features/dashboard/upcoming-work.tsx`: replaced `useTaskEdges`/`TaskEdge` with simple ReadyWorkItem, `item.task` → `item.workItem`, `item.story` removed, links point to `/items`, removed dependency status helper
- Rewrote `features/dashboard/recent-activity.tsx`: replaced all `exec.targetType`/`exec.targetId` with workItemId-based logic, removed `targetType` from WS event handlers, all target paths → `/items`, replaced "story/task" language with "work item" in descriptions
- Fixed `features/dashboard/active-agents-strip.tsx`: replaced `execution.targetType` with static "work item" text

**Files modified:** `features/dashboard/upcoming-work.tsx`, `features/dashboard/recent-activity.tsx`, `features/dashboard/active-agents-strip.tsx`

**Notes:** All dashboard components compile clean. useDashboardStats hook already works with WorkItem model (updated in O.5). WS event mapping uses new field names (workItemId, workItemTitle).

---

## 2026-03-29 — Review: O.13 (approved)

**Reviewed:** Router cleanup — `router.tsx`, `dashboard.tsx`, `upcoming-work.tsx`.
- All 5 requirements met: old routes removed, /items present, workflow designer import removed, dashboard links updated
- Clean 6-route router with no legacy references
- Dashboard links correctly point to /items
- No new type errors in changed files
- Verdict: **approved**

---

## 2026-03-29 — O.13: Update router

**Task:** Remove old routes, remove workflow designer import, update dashboard links.

**Done:**
- Rewrote `packages/frontend/src/router.tsx`: removed `/board`, `/stories/:id`, `/tasks/:id`, `/workflows` routes and their imports (StoryBoardPage, StoryDetailPage, TaskDetailPage, WorkflowDesignerPage). Kept: dashboard, /items, /agents, /activity, /personas, /settings (6 routes)
- Updated `packages/frontend/src/pages/dashboard.tsx`: changed "Pending Proposals" click from `/board` to `/items`
- Updated `packages/frontend/src/features/dashboard/upcoming-work.tsx`: changed "View board" link to "View items" at `/items`

**Files modified:** `router.tsx`, `pages/dashboard.tsx`, `features/dashboard/upcoming-work.tsx`

**Notes:** router.tsx and dashboard.tsx compile clean. upcoming-work.tsx has pre-existing type errors from the data model refactor (uses old TaskEdge/ReadyWorkItem.task) — O.14 will fix those.

---

## 2026-03-29 — Review: O.12 (approved)

**Reviewed:** Sidebar navigation — `sidebar.tsx`.
- All 4 requirements met: "Story Board" → "Work Items" with ListTodo icon, "Workflows" removed, proposals badge on /items, all old route references gone
- Confirmed no remaining references to /board, /workflows, Kanban, GitBranch, or "Story Board"
- 6 nav items (down from 7)
- No type errors
- Verdict: **approved**

---

## 2026-03-29 — O.12: Update sidebar navigation

**Task:** Replace "Story Board" with "Work Items", remove "Workflows", update badges and routes.

**Done:**
- Updated `packages/frontend/src/components/sidebar.tsx`:
  - Replaced "Story Board" (`/board`, Kanban icon) with "Work Items" (`/items`, ListTodo icon)
  - Removed "Workflows" nav item entirely (no workflow designer page)
  - Updated pending proposals badge from `/board` to `/items` (both collapsed and expanded badges)
  - Replaced `Kanban` and `GitBranch` lucide imports with `ListTodo`

**Files modified:** `components/sidebar.tsx`

**Notes:** sidebar.tsx compiles clean. Nav now has 6 items (Dashboard, Work Items, Agent Monitor, Activity Feed, Personas, Settings) instead of 7.

---

