# AgentOps — Work Log Archive

> Summarized entries from `WORKLOG.md`. Grouped by sprint/phase.
> Older sections may be consolidated into higher-level summaries as this file grows.

---

## Sprints 1-4 (consolidated) — 2026-03-28 to 2026-03-29

**Sprint 1:** Monorepo setup (pnpm/TS/ESLint/Prettier), React 19 + Vite 8 + Tailwind v4 + shadcn/ui + React Router v7 + TanStack Query + Zustand. App shell with sidebar, dark mode. Entity types with branded IDs. Mock data layer (fixtures, API, hooks, WebSocket, demo mode).

**Sprint 2:** Dashboard (stat cards, agent strip, activity feed, upcoming work, cost chart), kanban board (dnd-kit columns, filters, transition prompts), story detail (all sections), task detail (context, deps, execution, rejections), agent monitor (xterm.js terminal, split view, control bar), activity feed, workflow designer (canvas + panels), persona manager (editor, prompt, tools, test run).

**Sprint 3 (partial):** Settings page (5 sections), global components (command palette, toasts, skeletons, nav badges), WebSocket integration (useWsQuerySync centralized invalidation), demo mode (floating controls overlay).

**Sprint 4 (R.1-R.6):** Sidebar refinements (spacing, transitions, mobile responsive), shared component extraction (CommentStream, ExecutionTimeline → features/common/), story list master-detail view, nested task detail panel.

**Sprint 5 (T3.1.1 only):** Fastify backend scaffold — buildServer() factory with CORS, health check, pino-pretty, port 3001.

**Key patterns:** `cn()` utility, named exports, kebab-case files, `@/` alias, query hooks in `hooks/use-*.ts`, mock data in `mocks/`, Zustand persist, branded IDs, `verbatimModuleSyntax`, `features/common/` for shared UI, mobile sidebar overlay pattern, master-detail with `w-2/5` panels.

---

## Sprint 6: O.1–O.10 — archived 2026-03-29

*Data layer (O.1–O.6):* Replaced Story/Task/Workflow/Trigger types with WorkItem/PersonaAssignment across shared types, mock fixtures (3 top-level + 10 children + 3 grandchildren), mock API (WorkItem CRUD, persona assignments), TanStack Query hooks (use-work-items.ts, use-persona-assignments.ts). Added WORKFLOW constant (8 states, transitions, helpers). All IDs use wi- prefix.

*Multi-view UI (O.7–O.10):* Work items page at /items with 3-mode view toggle, filter bar, Zustand store. List view: tree-indented rows with state/priority badges, progress bars, persona avatars, state grouping. Board view: WORKFLOW columns with dnd-kit drag-and-drop, scope selector, persona trigger prompt. Tree view: pure hierarchy with indent guide lines.

*Detail panel + nav cleanup (O.11–O.17):* O.11: detail-panel.tsx (~280 lines) with header/breadcrumb/children/proposals/comments/executions/metadata, master-detail layout (w-2/5 + w-3/5). O.12: sidebar nav updated ("Work Items" replaces "Story Board", "Workflows" removed). O.13: router cleaned (6 routes, /items added, old routes removed). O.14: dashboard updated for WorkItem model. O.15: activity feed updated with router_decision event type. O.16: workflow-config-section.tsx with auto-routing toggle, persona-per-state table, SVG state machine diagram. O.17: deleted 26 files + 4 old pages, fixed 7 remaining files for WorkItem types — 0 errors.

**Key patterns:** State badges use `${color}20` bg / `${color}40` border from WORKFLOW. priorityConfig record reused across views. WorkItemsStore: view/groupBy/sortBy persisted, filters ephemeral. childStats Map for progress. assignmentMap from personaAssignments + personaMap for triggers.
