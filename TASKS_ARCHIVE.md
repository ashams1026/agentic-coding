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
