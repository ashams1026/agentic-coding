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
