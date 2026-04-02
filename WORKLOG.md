# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

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

## 2026-04-02 13:41 PDT — DES.14: Fix Per-Agent Limits table

**Done:** Added collapsed state to `AgentLimitsSection` when no limits configured. Shows compact CTA ("Configure limits") instead of full empty table. Expands to show table on click. Collapse button available when no limits set.
**Files:** `packages/frontend/src/features/settings/api-keys-section.tsx`

---

## 2026-04-02 13:41 PDT — DES.3, DES.17: Already implemented (no code change)

**Done:** DES.3 (auto-generate chat session names) already implemented in backend `chat.ts:297-309` — title generated from first message. DES.17 (activity feed filter bar) already implemented as `FeedFilterBar` component with event type checkboxes, agent dropdown, and date range selector.
**Files:** (none — already in codebase)

---

## 2026-04-02 14:15 PDT — DES.1: Dashboard onboarding checklist

**Done:** Added `GettingStartedChecklist` component to the Dashboard page. Four-step checklist (register project, configure API key, create work item, watch agent run) with live completion detection from existing hooks plus a direct `useQuery` for API key status. Completed steps show green checkmarks with strikethrough; incomplete steps show numbered circles with arrow navigation. Dismiss button persists to localStorage. Auto-hides 4s after all steps complete. Uses shadcn Card, Button, lucide icons, dark mode compatible.
**Files:** `packages/frontend/src/pages/dashboard.tsx`

---

## 2026-04-02 13:55 PDT — UXO.26: Move workflow settings into builder

**Done:** Added collapsible AgentAssignmentsSection to workflow builder left panel (between state cards and Validation). Shows intermediate states with agent dropdowns and model badges. Uses useAgentAssignments/useUpdateAgentAssignment for persistence. Removed Workflow tab from settings-layout.tsx (GitBranch import, SECTIONS entry, WorkflowConfigSection import/rendering). Deleted dead workflow-config-section.tsx.
**Files:** `packages/frontend/src/features/workflow-builder/workflow-builder.tsx`, `packages/frontend/src/features/settings/settings-layout.tsx`, `packages/frontend/src/features/settings/workflow-config-section.tsx` (deleted)

---

## 2026-04-02 13:55 PDT — DES.8, DES.9, DES.11: Design polish batch

**Done:** (1) DES.8: Removed `uppercase tracking-wide` from Automations page section headers — now Title Case. (2) DES.9: Added search input with magnifying glass icon above agent card grid, filters by name/description via useMemo. (3) DES.11: Rewrote Router agent description from "Routes work items between workflow states based on execution outcomes" to "Automatically moves work items to the next step when an agent finishes" across seed.ts, seed-demo.ts, default-agents.ts.
**Files:** `packages/frontend/src/pages/workflows.tsx`, `packages/frontend/src/features/agent-builder/agent-list.tsx`, `packages/backend/src/db/seed.ts`, `packages/backend/src/db/seed-demo.ts`, `packages/backend/src/db/default-agents.ts`

## 2026-04-02 13:42 PDT — UXO.27: Move Schedules to Automations page

**Done:** Extended ScheduleCard with edit, delete, and run-now action buttons. Renamed NewScheduleDialog → ScheduleDialog with `editingSchedule` prop for edit mode (pre-fills form, uses PATCH). Added `updateScheduleApi`, `deleteScheduleApi`, `runNowApi` helpers. Removed Scheduling tab from settings-layout.tsx (Clock import, SECTIONS entry, SchedulingSection import/rendering). Deleted dead `scheduling-section.tsx`. Reviewer caught missing `res.ok` check in deleteScheduleApi — fixed.
**Files:** `packages/frontend/src/pages/workflows.tsx`, `packages/frontend/src/features/settings/settings-layout.tsx`, `packages/frontend/src/features/settings/scheduling-section.tsx` (deleted)

---

## 2026-04-02 13:42 PDT — DES.4: Reduce chat sidebar width

**Done:** Changed chat session sidebar from `w-64` (256px) to `w-60` (240px). Truncation already in place via existing `truncate` classes.
**Files:** `packages/frontend/src/pages/chat.tsx`

---

