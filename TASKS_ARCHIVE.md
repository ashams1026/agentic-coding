# AgentOps — Completed Tasks Archive

> Completed tasks moved from `TASKS.md` by the cleanup agent. Grouped by sprint/phase.

---

## Sprints 1-3: Scaffolding + UI Screens (consolidated) — completed 2026-03-29

**Sprint 1 (T1.x):** 16 tasks. Monorepo setup (pnpm workspaces, TS strict, ESLint/Prettier), frontend foundation (Vite+React 19, Tailwind CSS, shadcn/ui, React Router, TanStack Query+Zustand, app shell, dark mode), shared types (entities, API contracts), mock data layer (fixtures, API service, hooks, WebSocket, demo mode).

**Sprint 2 (T2.x):** 23 tasks. Dashboard (stat cards, cost chart, agent strip, health indicators, upcoming work), kanban board (columns, drag-and-drop, filters, inline form, transition prompt), story detail (header, description, child tasks, proposals, metadata), task detail (inherited context, dependencies, execution context, rejection history), agent monitor (terminal renderer, split view, active sidebar, history, control bar), activity feed, workflow designer (canvas, state/transition panels, validation, sidebar), persona manager (list, editor, prompt editor, tool config, test run).

**Sprint 3 (T2.9-T2.12 + R.1-R.6):** 11 tasks. Settings page (layout, projects, API keys, cost management, appearance), global components (command palette, toast notifications, loading skeletons, nav badges), WebSocket integration, demo mode, sidebar refinements (spacing, transitions, mobile responsiveness), shared component extraction, story list master-detail view, nested task detail panel.

**Sprint 4 (T3.1.1):** 1 task. Fastify backend scaffold — `buildServer()` factory with CORS, health check, pino-pretty. Port 3001.

---

## Sprint 6: Data Model & UI Overhaul (partial) — completed 2026-03-29

### Shared Types Refactor

- [x] **O.1** — Refactor shared entity types. Replaced Story+Task with unified WorkItem, added PersonaAssignment, updated all cross-references to workItemId. *(completed 2026-03-29)*
- [x] **O.2** — Add hardcoded workflow constant. WORKFLOW with 8 states, transitions, helpers in workflow.ts. *(completed 2026-03-29)*
- [x] **O.3** — Update API contract types. Already done by O.1 (api.ts + ws-events.ts updated). *(completed 2026-03-29)*

### Mock Data Refactor

- [x] **O.4** — Refactor mock data fixtures. 3 top-level + 10 children + 3 grandchildren, personaAssignments, all workItemId refs. *(completed 2026-03-29)*
- [x] **O.5** — Refactor mock API layer. WorkItem CRUD, persona assignments, removed workflow/trigger functions. *(completed 2026-03-29)*
- [x] **O.6** — Refactor TanStack Query hooks. use-work-items.ts, use-persona-assignments.ts, deleted old story/task/workflow hooks. *(completed 2026-03-29)*

### Multi-View UI

- [x] **O.7** — Build work items page with view toggle. List/Board/Tree toggle, filter bar, Zustand store, /items route. *(completed 2026-03-29)*
- [x] **O.8** — Build list view. Tree-indented rows, state/priority badges, progress bars, persona avatars, state grouping. *(completed 2026-03-29)*
- [x] **O.9** — Build board view. WORKFLOW columns, drag-and-drop, scope selector, persona trigger prompt. *(completed 2026-03-29)*
- [x] **O.10** — Build tree view. Pure hierarchy with indent lines/guides, no state grouping. *(completed 2026-03-29)*

### Multi-View UI (continued)

- [x] **O.11** — Build work item detail panel. Right-side panel with header, breadcrumb, children list, proposals, comment stream, execution timeline, metadata. *(completed 2026-03-29)*

### Sidebar & Navigation Cleanup

- [x] **O.12** — Update sidebar navigation. "Story Board" → "Work Items", removed "Workflows", proposals badge on /items. *(completed 2026-03-29)*
- [x] **O.13** — Update router. Removed old routes, added /items, updated dashboard links. *(completed 2026-03-29)*

### Dashboard & Activity Feed Updates

- [x] **O.14** — Update dashboard for WorkItem model. Replaced story/task refs with work item across all dashboard components. *(completed 2026-03-29)*
- [x] **O.15** — Update activity feed for WorkItem model. Replaced story/task language, added Router decision events, removed trigger types. *(completed 2026-03-29)*

### Settings: Workflow Configuration

- [x] **O.16** — Build workflow configuration in settings. Auto-routing toggle, persona-per-state table, SVG state machine diagram. *(completed 2026-03-29)*

### Remove Old Code

- [x] **O.17** — Remove old story/task/workflow code. Deleted 26 files across 5 directories + 4 pages, fixed 7 remaining files. *(completed 2026-03-29)*

### Backend Schema

- [x] **O.18** — Rewrite Drizzle schema for WorkItem model. 9 tables in schema.ts matching shared entities. *(completed 2026-03-29)*
- [x] **O.19** — Update seed script for WorkItem model. Full seed with all fixture data (16 work items, 5 personas, etc). *(completed 2026-03-29)*
- [x] **O.20** — Rewrite CRUD API routes for WorkItem. 10 routes across 3 files (work-items, persona-assignments, work-item-edges). *(completed 2026-03-29)*

---

## Sprint 5: Backend API Completion — completed 2026-03-29

- [x] **T3.1.3** — Set up Drizzle migrations and seed script (drizzle.config.ts, migrate.ts, generated SQL, 5 npm scripts). *(completed 2026-03-29)*
- [x] **T3.2.5** — Implement comment API routes (4 routes: GET list, GET by id, POST, DELETE). *(completed 2026-03-29)*
- [x] **T3.2.7** — Implement persona API routes (5 routes: GET list, GET by id, POST, PATCH, DELETE). *(completed 2026-03-29)*
- [x] **T3.2.8** — Implement execution API routes (5 routes: GET list, GET by id, POST, PATCH, DELETE). *(completed 2026-03-29)*
- [x] **T3.2.9** — Implement proposal API routes (5 routes: GET list, GET by id, POST, PATCH, DELETE). *(completed 2026-03-29)*
- [x] **T3.2.10** — Implement aggregate/dashboard API routes (4 routes: stats, cost-summary, execution-stats, ready-work). *(completed 2026-03-29)*
- [x] **T3.3.1** — Implement real WebSocket server (@fastify/websocket, broadcast, client tracking). *(completed 2026-03-29)*
- [x] **T3.3.2** — Create API client for frontend (32 functions mirroring mock API, fetch-based). *(completed 2026-03-29)*
- [x] **T3.3.3** — Add API mode toggle to frontend (Zustand apiMode, unified API layer, 8 hooks updated). *(completed 2026-03-29)*
- [x] **T3.3.4** — Connect WebSocket client to real server (RealWsClient, unified WS module, 5 consumers updated). *(completed 2026-03-29)*
