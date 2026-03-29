# AgentOps — Completed Tasks Archive

> Completed tasks moved from `TASKS.md` by the cleanup agent. Grouped by sprint/phase.

---

## Sprint 1: Project Scaffolding (Phase 1) — completed 2026-03-28

### Monorepo & Tooling

- [x] **T1.1.1** — Initialize pnpm workspace with `packages/frontend`, `packages/backend`, `packages/shared`. Create root `package.json` with workspace config, `pnpm-workspace.yaml`, root `.gitignore`, and root `.nvmrc` (Node 22 LTS).

- [x] **T1.1.2** — Set up TypeScript config. Root `tsconfig.base.json` with strict mode, per-package `tsconfig.json` files extending base. Ensure cross-package imports work.

- [x] **T1.1.3** — Set up ESLint + Prettier. Root config, TypeScript-aware rules, React plugin for frontend. Add `lint` and `format` scripts to root `package.json`.

### Frontend Foundation

- [x] **T1.2.1** — Scaffold Vite + React + TypeScript in `packages/frontend`. Create `vite.config.ts`, install React 19, configure path aliases (`@/` → `src/`). Verify `pnpm dev` runs and shows a blank page.

- [x] **T1.2.2** — Install and configure Tailwind CSS. Set up `tailwind.config.ts` with custom theme tokens (colors for agent personas, status badges, priorities). Add base CSS with CSS variables for dark mode.

- [x] **T1.2.3** — Install and configure shadcn/ui. Run init, add foundational components: Button, Card, Badge, Input, Textarea, Select, Dialog, Sheet, Tabs, Tooltip, DropdownMenu, ScrollArea, Separator, Skeleton. Set up `cn()` utility.

- [x] **T1.2.4** — Set up React Router with route stubs. Create routes for all 9 screens: `/` (dashboard), `/board` (kanban), `/stories/:id` (story detail), `/tasks/:id` (task detail), `/agents` (agent monitor), `/activity` (feed), `/workflows` (designer), `/personas` (manager), `/settings`. Each route renders a placeholder page component.

- [x] **T1.2.5** — Install TanStack Query + Zustand. Configure QueryClient with defaults (stale time, refetch). Create a base Zustand store for UI state (sidebar collapsed, selected project, theme). Wrap app in QueryClientProvider.

- [x] **T1.2.6** — Build app shell layout. Sidebar navigation (collapsible) with icons + labels for all 9 routes. Project switcher dropdown at top. Status bar at bottom (placeholder content). Main content area with `<Outlet />`. Responsive: sidebar collapses to icons on narrow screens.

- [x] **T1.2.7** — Implement dark mode. Toggle in sidebar footer or status bar. Use Tailwind `dark:` variant. Persist preference in Zustand + localStorage. Default to system preference.

### Shared Types

- [x] **T1.3.1** — Define all entity types in `packages/shared`. TypeScript interfaces for: Project, Story, Task, TaskEdge, Workflow, WorkflowState, WorkflowTransition, Persona, Trigger, Execution, Comment, ProjectMemory, Proposal. Include ID prefix types and nanoid generator utility.

- [x] **T1.3.2** — Define API contract types in `packages/shared`. Request/response types for all CRUD endpoints. WebSocket event types (state change, new comment, agent output chunk, proposal created, cost update). Enum types for all status fields.

### Mock Data Layer

- [x] **T1.4.1** — Create mock data fixtures in `packages/frontend/src/mocks/`. Realistic dataset covering all entity types with cross-references.

- [x] **T1.4.2** — Build mock API service layer in `packages/frontend/src/mocks/api.ts`. In-memory store, full CRUD, simulated latency.

- [x] **T1.4.3** — Build TanStack Query hooks in `packages/frontend/src/hooks/`. One hook per API call with optimistic update helpers.

- [x] **T1.4.4** — Build mock WebSocket system in `packages/frontend/src/mocks/ws.ts`. Typed event emitter with simulation helpers.

- [x] **T1.4.5** — Build demo mode in `packages/frontend/src/mocks/demo.ts`. 60-second scripted story lifecycle replay.

---

## Sprint 2: Core UI Screens (Phase 2A-2C) — started 2026-03-28

### Dashboard (Home)

- [x] **T2.1.1** — Build dashboard page layout. 4 status cards (Active Agents, Pending Proposals, Needs Attention, Today's Cost) driven by useDashboardStats() hook.

- [x] **T2.1.2** — Build active agents strip component. Horizontal scrollable row with live elapsed time, pulsing status dots.

- [x] **T2.1.3** — Build recent activity feed component. Unified event feed from executions, comments, proposals with color-coded icons.

- [x] **T2.1.4** — Build upcoming work widget. Shows next 5 tasks ready for dispatch (from mock ready-work data). Each entry: task title, parent story name, persona that would handle it, dependency status. Helps user see what will fire next. *(completed 2026-03-28)*

- [x] **T2.1.5** — Build cost summary widget. Sparkline chart (small inline chart) showing daily spend for last 7 days. Current month total vs configured cap (progress bar). Use a lightweight chart lib (recharts or similar). Shows "$0.00 today" gracefully when no data. *(completed 2026-03-28)*

### Story Board (Kanban)

- [x] **T2.2.1** — Build kanban board layout. Columns generated from story workflow states. Column headers with state name, item count, and color indicator. Horizontally scrollable when many columns. Board fills available viewport height. *(completed 2026-03-28)*

- [x] **T2.2.2** — Build story card component. Compact card showing: title (truncated), priority badge (P0-P3 with colors), label pills, task progress bar ("3/5 tasks"), proposal badge (amber dot with count if pending), active agent indicator (pulsing persona avatar if agent running). Card has subtle hover state and click handler. *(completed 2026-03-28)*

- [x] **T2.2.3** — Implement drag-and-drop between columns. Use @dnd-kit or react-beautiful-dnd. Smooth animations on drag. Card placeholder shows in target column during drag. Drop triggers state transition via mock API. *(completed 2026-03-28)*

- [x] **T2.2.4** — Build transition prompt modal. When dropping a story on a column that has a trigger configured: show modal with "This will trigger [Persona Name] agent." Three buttons: "Run trigger", "Skip trigger", "Cancel". If no trigger, transition happens silently. Show persona avatar in the modal. *(completed 2026-03-28)*

- [x] **T2.2.5** — Build filter bar and sort controls. Above the kanban board. Filter by: label (multi-select), priority (multi-select), persona (multi-select), has proposals (toggle). Sort by: priority, created date, updated date. Persist filter state in URL params. *(completed 2026-03-28)*

- [x] **T2.2.6** — Build inline story creation. "+" button in the Backlog column header. Clicking shows an inline form (title input + priority select + create button). Creates story in Backlog state via mock API. Smooth animation as card appears. *(completed 2026-03-28)*

### Story Detail

- [x] **T2.3.1** — Build story detail panel. Slide-out sheet (shadcn Sheet) from the right, ~60% viewport width. Or full-page view (toggle). Header: title (click to edit inline), state badge, priority selector, label pills (editable). Close button returns to board. *(completed 2026-03-28)*

- [x] **T2.3.2** — Build description and context section. Rich text area for story description (markdown support via textarea, rendered preview). Acceptance criteria section below. Both editable inline with save/cancel. *(completed 2026-03-28)*
