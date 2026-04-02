# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 14:48 PDT — NAV.19: Redesign Dashboard as cross-project overview

**Done:** Rewrote `dashboard.tsx` from a project-specific dashboard to a cross-project overview. Removed old `StatCard`, `AllProjectsSummary`, and imports of `ActiveAgentsStrip`, `RecentActivity`, `UpcomingWork`, `CostSummary`, `useSelectedProject`, `Badge`, `Table*`. Added `ProjectCard` component showing: project name with globe/folder icon, work item count, active agents count (via `useDashboardStats`), last activity (relative time from work item updates), and quick-link buttons to Work Items / Agents / Chat. Global Workspace pinned first with violet accent border. Responsive grid (1/2/3 cols). Updated `GettingStartedChecklist` routes to project-scoped URLs (`/app-settings`, `/p/pj-global/items`). Loading skeleton and empty state preserved.
**Files:** `packages/frontend/src/pages/dashboard.tsx`
**Notes:** Old dashboard sub-components (`active-agents-strip.tsx`, `recent-activity.tsx`, `upcoming-work.tsx`, `cost-summary.tsx`) are now dead code — no remaining imports. Can be deleted in NAV.25 cleanup.

---

## 2026-04-02 14:45 PDT — NAV.20: Rename global project to "Global Workspace"

**Done:** Renamed the global project from "All Projects" to "Global Workspace" across 6 files: backend `ensure-global-project.ts`, `seed.ts`, SQL migration `0001_seed_global_workflow.sql`, and frontend `dashboard.tsx`, `agent-monitor-layout.tsx`, `recently-deleted.tsx`. ID (`pj-global`) unchanged.
**Files:** `packages/backend/src/db/ensure-global-project.ts`, `packages/backend/src/db/seed.ts`, `packages/backend/drizzle/0001_seed_global_workflow.sql`, `packages/frontend/src/pages/dashboard.tsx`, `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`, `packages/frontend/src/features/settings/recently-deleted.tsx`

---

## 2026-04-02 15:00 PDT — NAV.15: Migrate Pico chat panel to URL-based project context

**Done:** Replaced `useUIStore(selectedProjectId)` in `use-pico-chat.ts` and `useSelectedProject()` in `chat-panel.tsx` with `useProjectFromUrl()`. Both now fall back to `"pj-global"` on non-project pages (Dashboard, App Settings). `chat-bubble.tsx` and `pico-store.ts` needed no changes (no project context usage).
**Files:** `packages/frontend/src/hooks/use-pico-chat.ts`, `packages/frontend/src/features/pico/chat-panel.tsx`

---

## 2026-04-02 15:01 PDT — NAV.16: App Settings page

**Done:** Created new `AppSettingsPage` at `/app-settings` with 4 sections: API Keys & Executor Mode, Appearance, Service, Data Management. Uses the same sidebar+content layout pattern as `SettingsLayout` but scoped to app-level settings only. Updated router to use `AppSettingsPage` instead of `SettingsPage` for the `/app-settings` route. Old `SettingsLayout` left intact for project settings (NAV.17).
**Files:** `packages/frontend/src/pages/app-settings.tsx` (new), `packages/frontend/src/router.tsx`

---

## 2026-04-02 14:42 PDT — NAV.11-14: Page migrations (Agent Monitor, Activity Feed, Analytics, Chat)

**Done:** Migrated 4 more page groups from `useSelectedProject()` to `useProjectFromUrl()`: (1) Agent Monitor — 6 feature files, Links updated to `/p/:projectId/items`. (2) Activity Feed — activity-feed.tsx, EventRow navigates to project-scoped route. (3) Analytics — overview-tab.tsx, token-usage-tab.tsx. (4) Chat — replaced `useUIStore` selectedProjectId with URL-based projectId, updated guard and navigate to `/app-settings`.
**Files:** `features/agent-monitor/{split-view,active-agent-sidebar,queue-view,agent-control-bar,agent-history,agent-monitor-layout}.tsx`, `features/activity-feed/activity-feed.tsx`, `features/analytics/{overview-tab,token-usage-tab}.tsx`, `pages/chat.tsx`

---

## 2026-04-02 14:38 PDT — NAV.7: New Project button + backend mkdir

**Done:** Added "+ New Project" button to sidebar with dialog: project name input, working directory with "Create new" (auto-generates `~/woof/<slug>/`) and "Choose existing" modes. Backend `mkdir -p` on project creation with tilde expansion via `os.homedir()`. Navigates to `/p/:newProjectId/items` on success.
**Files:** `packages/frontend/src/components/sidebar.tsx`, `packages/backend/src/routes/projects.ts`

---

## 2026-04-02 14:38 PDT — NAV.8, NAV.9, NAV.10: Page migrations to useProjectFromUrl

**Done:** Migrated 3 page groups from `useSelectedProject()` to `useProjectFromUrl()`: (1) Work Items — `work-items.tsx`, `filter-bar.tsx`, `list-view.tsx`, `detail-panel.tsx`. (2) Automations — `workflows.tsx` + `workflow-builder.tsx`, updated `navigate()` to project-scoped `/p/:projectId/automations/:workflowId`. (3) Agents — `agent-builder.tsx`, `agent-list.tsx`, `agent-detail-panel.tsx`, page title changed to "Agents".
**Files:** `pages/work-items.tsx`, `features/work-items/{filter-bar,list-view,detail-panel}.tsx`, `pages/workflows.tsx`, `features/workflow-builder/workflow-builder.tsx`, `pages/agent-builder.tsx`, `features/agent-builder/{agent-list,agent-detail-panel}.tsx`

---

## 2026-04-02 14:29 PDT — NAV.5: Sidebar state persistence

**Done:** Added localStorage persistence for sidebar expanded/collapsed state using key `agentops-sidebar-expanded`. Initializer reads from localStorage on mount, falls back to `["pj-global"]`. A `useEffect` writes to localStorage on every state change. Added expand/collapse all toggle button (ChevronsUpDown icon) next to "Projects" separator label — expands all if any collapsed, collapses all if all expanded. All localStorage calls wrapped in try/catch. Auto-expand on URL navigation still works (adds to persisted set).
**Files:** `packages/frontend/src/components/sidebar.tsx`

---

## 2026-04-02 14:29 PDT — NAV.6: Remove orphaned scope-indicator component

**Done:** Deleted `scope-indicator.tsx` — the old scope breadcrumb component replaced by the sidebar project tree in NAV.4. Verified no remaining imports across the codebase. No separate project selector/switcher component existed. `useSelectedProject()` and `selectedProjectId` in `useUIStore` intentionally left intact (deferred to NAV.25 after page migrations).
**Files:** `packages/frontend/src/components/scope-indicator.tsx` (deleted)

---

## 2026-04-02 14:26 PDT — NAV.4: Redesign sidebar as project tree

**Done:** Full rewrite of sidebar. Replaced flat nav + project dropdown with: (1) Global section — Dashboard + App Settings top-level links, (2) "Projects" separator, (3) Collapsible project tree — each project expandable with chevron, child links to `/p/:projectId/:page` for all 8 pages. Global Workspace pinned first with violet accent, expanded by default. Auto-expands project on URL navigation. Badge counters on Work Items/Agent Monitor/Activity Feed. Collapsed sidebar mode with icon tooltips and badge indicators. Removed project dropdown and ScopeIndicator. Preserved theme toggle, notification bell, collapse button, mobile overlay.
**Files:** `packages/frontend/src/components/sidebar.tsx`

---

## 2026-04-02 14:21 PDT — NAV.2: Refactor router for project-scoped routes

**Done:** Rewrote `router.tsx` with 3 route groups: top-level (Dashboard `/`, App Settings `/app-settings`), project-scoped under `/p/:projectId` (9 pages wrapped in ProjectLayout), and legacy redirects from old flat routes to `/p/pj-global/...`. Updated `useParams` in workflows.tsx from `:id` to `:workflowId` with destructuring alias for backward compatibility.
**Files:** `packages/frontend/src/router.tsx`, `packages/frontend/src/pages/workflows.tsx`

---

## 2026-04-02 14:18 PDT — NAV.3: Create ProjectLayout wrapper component

**Done:** Created `ProjectLayout` at `layouts/project-layout.tsx`. Uses `useProjectFromUrl()` to read project context from URL. Shows spinner while loading, 404 with "Go to Dashboard" CTA when project not found, and renders `<Outlet />` for valid projects. No Context Provider needed — children call `useProjectFromUrl()` directly.
**Files:** `packages/frontend/src/layouts/project-layout.tsx`

---

## 2026-04-02 14:20 PDT — NAV.1: Create useProjectFromUrl() hook

**Done:** Created `useProjectFromUrl()` hook that reads `projectId` from React Router `useParams()` and returns `{ projectId, project, isGlobal, isLoading }`. When no `projectId` is in the URL (Dashboard, App Settings), returns null values. Passes `null` to `useProject()` which disables the query via its `enabled: !!id` guard. Exported from hooks barrel.
**Files:** `packages/frontend/src/hooks/use-project-from-url.ts`, `packages/frontend/src/hooks/index.ts`

---

## 2026-04-02 14:10 PDT — DX.1: Frontend-only dev mode with mock API

**Done:** Added `pnpm dev:frontend` (frontend-only with mock API), `pnpm dev:backend` (backend-only), kept `pnpm dev` as full-stack. Created lightweight fetch interceptor at `packages/frontend/src/api/mock-api.ts` with in-memory data for all API endpoints (projects, work items, agents, executions, comments, proposals, workflows, dashboard stats, settings, chat, analytics, search). WebSocket connection is skipped in mock mode. Mock layer is tree-shaken from production builds.
**Files:** `package.json`, `packages/frontend/package.json`, `packages/frontend/src/api/mock-api.ts`, `packages/frontend/src/api/ws.ts`, `packages/frontend/src/main.tsx`, `packages/frontend/src/env.d.ts`

---

## 2026-04-02 13:55 PDT — DES.19: Empty states audit

**Done:** Audited all pages and sub-components for consistent empty states. Added missing icons, descriptions, and CTA buttons across 15 empty states. Normalized styling to use consistent pattern: muted icon (h-10 w-10), font-medium heading, muted/60 description, outline CTA button.
**Files:** `features/activity-feed/activity-feed.tsx`, `features/agent-monitor/agent-history.tsx`, `features/agent-monitor/agent-monitor-layout.tsx`, `features/agent-monitor/queue-view.tsx`, `features/agent-builder/agent-list.tsx`, `features/work-items/list-view.tsx`, `features/dashboard/recent-activity.tsx`, `features/dashboard/upcoming-work.tsx`, `features/dashboard/cost-summary.tsx`, `features/analytics/overview-tab.tsx`, `features/analytics/token-usage-tab.tsx`, `pages/dashboard.tsx`, `pages/chat.tsx`, `pages/workflows.tsx`

---

## 2026-04-02 13:41 PDT — FX.WI1: Fix work item edit revert bug

**Done:** Removed `onSettled` from `useUpdateWorkItem` that was always invalidating queries (overwriting optimistic updates). Replaced with `onSuccess` that sets server response directly into query cache. Added `mutationKey: ["workItems"]` and guarded WebSocket `state_change` handler with `isMutating` check to prevent stale refetches during active mutations.
**Files:** `packages/frontend/src/hooks/use-work-items.ts`, `packages/frontend/src/hooks/use-ws-sync.ts`

---

## 2026-04-02 13:41 PDT — DES.1: Dashboard onboarding checklist

**Done:** Added `GettingStartedChecklist` component to Dashboard with 4 steps: register project, configure API key, create work item, watch agent run. Steps auto-detect completion from real data. Dismissible via localStorage. Auto-hides with celebration when all steps complete.
**Files:** `packages/frontend/src/pages/dashboard.tsx`

---

## 2026-04-02 13:41 PDT — DES.7: Normalize workflow card heights

**Done:** Added `min-h-[180px]` to WorkflowCard for uniform card heights. Replaced "No states defined" italic text with centered "Configure States" CTA button that opens the workflow builder.
**Files:** `packages/frontend/src/pages/workflows.tsx`

---

