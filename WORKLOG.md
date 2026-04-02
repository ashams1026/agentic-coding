# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 15:45 PDT — RICH.8, RICH.DOC.1: Integration + docs

**Done:** (1) RICH.8: Updated ContentBlockRenderer in `chat-message.tsx` to dispatch to new enhanced components. Full-page view (compact=false) now uses EnhancedThinkingBlock, EnhancedToolCallCard, and FileTreeSummary. Mini panel (compact=true) keeps compact variants. Added FullPageMessageBody component that renders FileTreeSummary at top when 2+ Edit/Write tool calls. Removed dead inline ThinkingBlock and ToolCallCard. (2) RICH.DOC.1: Updated `docs/frontend.md` with new "Chat — Rich Message Components" section: component hierarchy, ContentBlockRenderer dispatch table, all 5 components + 2 utilities documented, directory structure and source files table updated.
**Files:** `features/pico/chat-message.tsx`, `docs/frontend.md`

---

## 2026-04-02 15:35 PDT — RICH.5, RICH.6, RICH.7, RICH.TEST.1: Specialized renderers + test plan

**Done:** (1) RICH.5: TerminalBlock at `features/chat/terminal-block.tsx`. Dark bg-zinc-900, `$ command` header, ANSI-colored output via parseAnsi(), 300px max-height scroll, copy strips ANSI, exit code in green/red, >500 lines truncation with expand. (2) RICH.6: DiffBlock at `features/chat/diff-block.tsx`. File path header with basename, red/green line highlighting with dual-column line numbers, handles Edit (old→new diff), Write (all adds), copy produces unified diff via formatDiffText(), useMemo for diff computation. (3) RICH.7: FileTreeSummary at `features/chat/file-tree-summary.tsx`. Aggregates Edit/Write tool calls into directory tree, amber Pencil for edits, green Plus for writes, +N/-M line counts, collapses single-child directories, collapsed by default if >10 files, click-to-scroll via scrollIntoView. Also added `id={block.toolCallId}` to ToolCallCard root div for scroll targeting. (4) RICH.TEST.1: 29-case e2e test plan (47 steps, 30+ screenshots) covering all 5 rich message components + integration.
**Files:** `features/chat/terminal-block.tsx` (new), `features/chat/diff-block.tsx` (new), `features/chat/file-tree-summary.tsx` (new), `features/chat/tool-call-card.tsx` (id attr), `tests/e2e/plans/rich-messages.md` (new)

---

## 2026-04-02 15:23 PDT — RICH.3, RICH.4: ThinkingBlock + ToolCallCard

**Done:** (1) RICH.3: Enhanced ThinkingBlock at `features/chat/thinking-block.tsx`. Purple left border accent, expand/collapse with Brain icon, muted text, self-contained markdown renderer, truncation at 2000 chars with "Show more" link. (2) RICH.4: Enhanced ToolCallCard at `features/chat/tool-call-card.tsx`. Tool-specific icons (9 mappings), rich description, status badge (blue pulse/green/red), collapsible input key-values, placeholder output section (monospace pre). Expand defaults: Edit/Write/Bash expanded, Read/Grep/Glob collapsed.
**Files:** `packages/frontend/src/features/chat/thinking-block.tsx` (new), `packages/frontend/src/features/chat/tool-call-card.tsx` (new)

---

## 2026-04-02 15:22 PDT — RICH.2: Diff parser utility

**Done:** Created `diff-parser.ts` exporting `computeDiff(oldString, newString)` and `formatDiffText(result)`. Implements Myers' diff algorithm (O(ND)) for optimal shortest-edit-script diffs. Returns typed `DiffLine[]` with `add/remove/context` types and separate old/new line numbers. Handles edge cases: empty/undefined inputs, identical strings, new file (all adds), deletion (all removes). Zero external dependencies.
**Files:** `packages/frontend/src/lib/diff-parser.ts`

---

## 2026-04-02 15:25 PDT — RICH.1: ANSI color parser utility

**Done:** Created `ansi-parser.tsx` exporting `parseAnsi(text)` and `stripAnsi(text)`. Supports standard foreground (30-37), bright foreground (90-97), 256-color mode (38;5;N), bold/dim/italic, combined codes, and reset. Maps to Tailwind classes. Uses `React.createElement` with proper keys. Fast path returns plain string when no ANSI codes present.
**Files:** `packages/frontend/src/lib/ansi-parser.tsx`

---

## 2026-04-02 15:20 PDT — Plan: Decompose Sprint 31 — Agent Chat P2 (Rich Messages)

**Done:** Planned Sprint 31 from `docs/proposals/agent-chat/rich-messages.md`. 13 tasks across 4 phases + testing/docs: (1) Utilities — ANSI parser, diff parser. (2) Core P0 — enhanced ThinkingBlock, enhanced ToolCallCard. (3) Specialized P1 — TerminalBlock, DiffBlock, FileTreeSummary. (4) Integration — ContentBlockRenderer dispatch update, expand/collapse state. ProposalCard, ImageBlock, MultiStepProgress deferred as P2/P3.
**Files:** `TASKS.md`

---

## 2026-04-02 15:16 PDT — S28.DOC.1: Document Sprint 28 APIs

**Done:** Updated `docs/api.md` with 3 new sections: Schedules (5 endpoints with cron validation, request/response shapes, curl examples), Templates (5 endpoints + built-in template table for frontend picker), Notification Webhook Channel (3 event types with payload schemas, flow diagram, subscription instructions). Added 3 notification events to webhook event catalog. Added 4 source file entries.
**Files:** `docs/api.md`

---

## 2026-04-02 15:10 PDT — TPL.3, NEC.1, NEC.2, S28.TEST.1: Templates, webhook channel, test plan

**Done:** (1) TPL.3: Template picker dialog with 5 hardcoded templates (Blank, Bug Report, Feature Request, Task, Research Spike). "+ Add" button opens dialog, selecting a template pre-fills work item. New file `template-picker-dialog.tsx`. (2) NEC.1: Created `webhook-channel.ts` mapping notification types to event bus events. Added 3 new event types (`notification.agent_completed/errored/budget_threshold`). `broadcastNotification()` now emits to event bus, webhook bridge delivers. (3) NEC.2: Webhook Channel toggle in Notifications settings with Active/Inactive badge, event type list, "Manage webhooks in Integrations" link. (4) S28.TEST.1: 17-case test plan for scheduling, templates, notification channels.
**Files:** `features/work-items/template-picker-dialog.tsx` (new), `pages/work-items.tsx`, `backend/src/notifications/webhook-channel.ts` (new), `backend/src/events/event-bus.ts`, `backend/src/ws.ts`, `backend/src/start.ts`, `features/settings/notifications-section.tsx`, `features/settings/settings-layout.tsx`, `tests/e2e/plans/scheduling-templates.md` (new)

---

## 2026-04-02 15:02 PDT — NAV.23, NAV.25, NAV.TEST.1, NAV.DOC.1: Cleanup, dead code, test plan, docs

**Done:** (1) NAV.23: Removed scope badges from agent-list, active-agent-sidebar, chat-panel, recently-deleted. (2) NAV.25: Deleted 5 dead files (4 dashboard sub-components + use-selected-project.ts), migrated 5 files from useSelectedProject to useProjectFromUrl (use-agents, recently-deleted, security-section, costs-section, command-palette), removed selectedProjectId from ui-store. (3) NAV.TEST.1: 35-case e2e test plan across 8 phases. (4) NAV.DOC.1: Updated frontend.md (routes, sidebar, project context, settings split), architecture.md, api.md, data-model.md, roadmap.md.
**Files:** 15 frontend files modified/deleted, `tests/e2e/plans/project-nav.md` (new), 5 doc files updated

---

## 2026-04-02 14:56 PDT — NAV.17, NAV.21, NAV.22: Project settings, command palette, status bar

**Done:** (1) NAV.17: Created ProjectSettingsPage at `/p/:projectId/settings` with 4 sections (Security, Costs & Limits, Notifications, Integrations). Shows project name in sidebar header. Router updated. (2) NAV.21: Command palette updated with project-scoped commands — "[Project] > [Page]" for all 8 pages per project. Search matches project names. Grouped by Navigation + per-project. (3) NAV.22: Status bar shows current project name on project pages, "Dashboard"/"App Settings" on top-level pages. Removed old automations Zap indicator. Preserved WS/agent/cost indicators.
**Files:** `pages/project-settings.tsx` (new), `router.tsx`, `features/command-palette/command-palette.tsx`, `components/status-bar.tsx`

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

