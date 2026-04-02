# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-27 complete and archived. Sprint 29 Bug Fixes/Phase 4/Design Polish archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 29: UX Overhaul (Priority)

> Major UX rework based on user feedback. **Prioritized ahead of remaining Sprint 28 and future roadmap work.** Themes: global-as-project foundation, persona→agent rename, chat UX fixes, workflow rework with label triggers, scope clarity.
> Bug Fixes (Sprints 24-27), Phases 1-6, 9 complete and archived. Phases 4, 8 partially complete.

### Remaining Sprint 29 (not superseded by Sprint 30)

> These tasks are independent of the navigation rewrite. UXO.28-29, GW.*, DES.2, DES.15 are superseded by Sprint 30.

- [x] **DES.13** — Settings: Fix grammar in terminal states note. N/A — target file `workflow-config-section.tsx` was deleted in UXO.26. *(completed 2026-04-02 13:50 PDT)*
- [x] **DES.19** — Empty states: Audit all pages for consistent empty states (icon + heading + description + CTA). *(completed 2026-04-02 13:55 PDT)*
- [x] **FX.UXO24** — Info: `AgentId` type uses `ps-` prefix. Tech debt — track-only, requires future migration. *(completed 2026-04-02 13:50 PDT)*
- [x] **DX.1** — Add split dev scripts. `pnpm dev:frontend` runs only Vite dev server (no backend). `pnpm dev:backend` runs only backend with mock executor. Keep `pnpm dev` as full-stack. No mock API layer needed — frontend just fails gracefully on API errors when backend isn't running. Update root `package.json` scripts. *(completed 2026-04-02 14:10 PDT)*
- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **UXO.TEST.2** — Execute UX Overhaul e2e tests. Screenshot each case. Record results. File bugs as `FX.*`.
- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **UXO.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans. File bugs as `FX.REG.*`.

---

## Sprint 30: Project-Scoped Navigation (Priority)

> **Fundamental navigation rewrite.** Replace the global project dropdown with a sidebar tree where each project has its own nested pages. Eliminates scope confusion at the root. Supersedes GW.*, UXO.28-29, DES.2/15, scope badges/breadcrumbs.
>
> **Target sidebar structure:**
> ```
> ─── Woof ─────────────────
> Dashboard                  ← cross-project overview
> App Settings               ← API keys, appearance, service, data
>
> ─── Projects ─────────────
> ▼ Global Workspace    🌐
>     Work Items
>     Automations
>     Agents
>     Agent Monitor
>     Activity Feed
>     Analytics
>     Chat
>     Project Settings
>
> ▼ my-react-app        📁
>     (same pages)
>
> ▶ another-project     📁  ← collapsed
> ```

### Phase 1: Router + Project Context

- [x] **NAV.1** — Frontend: Create `useProjectFromUrl()` hook. Reads `projectId` from URL params via React Router `useParams()`. Returns `{ projectId, project, isGlobal }` by looking up the project. Replaces `useSelectedProject()`. File: `packages/frontend/src/hooks/use-project-from-url.ts`. *(completed 2026-04-02 14:20 PDT)*
- [x] **NAV.2** — Frontend: Refactor router for project-scoped routes. New structure: `{ path: "p/:projectId", element: <ProjectLayout />, children: [ { path: "items" }, { path: "automations" }, { path: "automations/:workflowId" }, { path: "agents" }, { path: "monitor" }, { path: "activity" }, { path: "analytics" }, { path: "chat" }, { path: "settings" } ] }`. Keep top-level: Dashboard (`/`) and App Settings (`/app-settings`). Update `router.tsx`. *(completed 2026-04-02 14:21 PDT)*
- [x] **NAV.3** — Frontend: Create `ProjectLayout` wrapper component at `layouts/project-layout.tsx`. Reads `projectId` from URL, validates project exists (404 if not), provides project context to children via `<Outlet />`. *(completed 2026-04-02 14:18 PDT)*

### Phase 2: Sidebar Redesign

- [x] **NAV.4** — Frontend: Redesign sidebar as project tree. *(completed 2026-04-02 14:26 PDT)* Replace flat nav + project dropdown with: (1) Global section at top: Dashboard + App Settings, (2) "Projects" separator, (3) Collapsible project sections — each with globe/folder icon, project name, nested child links (Work Items, Automations, Agents, Agent Monitor, Activity Feed, Analytics, Chat, Project Settings). Global Workspace pinned at top with globe icon + violet accent. Child links navigate to `/p/:projectId/:page`.
- [x] **NAV.5** — Frontend: Sidebar state persistence. Store expanded/collapsed per project in localStorage. Auto-expand the project matching current URL. Highlight active child link. Add expand/collapse all toggle. *(completed 2026-04-02 14:29 PDT)*
- [x] **NAV.6** — Frontend: Remove old project selector dropdown, scope breadcrumb (`scope-indicator.tsx`), and `selectedProjectId` from `useUIStore`. All replaced by sidebar tree + URL params. *(completed 2026-04-02 14:29 PDT)*
- [ ] **NAV.7** — Frontend + Backend: Add "New Project" button at bottom of Projects section. Dialog has: project name input, working directory with two options: (1) "Choose existing directory" with browse starting from `~/` (user's home dir), (2) "Create new" which auto-generates `~/woof/<slugified-name>/` from the project name (user can override). Backend `mkdir -p`'s the directory on project creation if it doesn't exist. Label as "Working Directory — where agents will operate."

### Phase 3: Migrate Pages to URL-based Project Context

> Each page currently calls `useSelectedProject()` (32 files). Migrate each to `useProjectFromUrl()`. Pages render inside `ProjectLayout` which guarantees `projectId` in URL.

- [ ] **NAV.8** — Frontend: Migrate Work Items page. Replace `useSelectedProject()` with `useProjectFromUrl()`. Update all query keys and API calls. Verify `/p/pj-global/items` and `/p/pj-xyz/items` show different data.
- [ ] **NAV.9** — Frontend: Migrate Automations page + Workflow Builder. Replace project context. Update `navigate()` calls to include project prefix (`/p/:projectId/automations/:workflowId`).
- [ ] **NAV.10** — Frontend: Migrate Agents page (rename from Agent Builder). Replace `useSelectedProject()`. Show project-scoped agents + inherited global agents. Rename route from `agent-builder` to `agents`. Update page title.
- [ ] **NAV.11** — Frontend: Migrate Agent Monitor page. Replace project context. Filter agents/executions by project from URL.
- [ ] **NAV.12** — Frontend: Migrate Activity Feed page. Replace project context. Filter events by project from URL.
- [ ] **NAV.13** — Frontend: Migrate Analytics page. Replace project context. Show per-project cost/usage.
- [ ] **NAV.14** — Frontend: Migrate Chat page. Replace project context. Sessions scoped to project from URL. Agent selector shows project + global agents.
- [ ] **NAV.15** — Frontend: Migrate Pico chat panel (overlay). Use current project from URL context. Default to Global Workspace when on Dashboard/App Settings (no project in URL).

### Phase 4: Settings Split

- [ ] **NAV.16** — Frontend: Create App Settings page at `/app-settings`. Move from current Settings: API Keys & Executor Mode, Appearance, Service, Data Management. Simple sidebar with 4 sections. No project context.
- [ ] **NAV.17** — Frontend: Create Project Settings page at `/p/:projectId/settings`. Move from current Settings: Security, Costs & Limits (include max concurrent agents), Notifications, Integrations. Read projectId from URL. Break up "Agent Configuration" — API key → App Settings, concurrency → Costs & Limits, drop Per-Agent Limits table.
- [ ] **NAV.18** — Frontend: Move workflow settings into workflow builder. Remove `workflow-config-section.tsx`. Move agent-state assignment table into builder as "State Agents" tab. Workflow/Scheduling tabs gone from settings.

### Phase 5: Dashboard + Global

- [ ] **NAV.19** — Frontend: Redesign Dashboard as cross-project overview. Project cards showing: name, work item counts by state, active agents, last activity, quick-links into `/p/:projectId/items`. Global Workspace card pinned at top.
- [ ] **NAV.20** — Backend + Seed: Rename global project from "All Projects" to "Global Workspace" in `ensure-global-project.ts` and seed data.

### Phase 6: Cleanup + Polish

- [ ] **NAV.21** — Frontend: Update command palette. Commands include project context: "Go to [Project] > Work Items". Search matches project names.
- [ ] **NAV.22** — Frontend: Update status bar. Remove old auto-routing toggle. Show current project name when on a project page. Keep WS connection, agent count, cost indicators.
- [ ] **NAV.23** — Frontend: Remove all scope badges, scope indicators, and "Global" vs "All Projects" labeling. Sidebar tree makes scope self-evident. Clean up `scope-indicator.tsx`, scope badges on agent cards, work item badges, chat headers.
- [ ] **NAV.24** — Frontend: Handle navigation edge cases. Old flat URLs (`/items`, `/agents`, `/automations`) redirect to `/p/pj-global/items` etc. 404 page for invalid projectId. Browser back/forward works.
- [ ] **NAV.25** — Frontend: Delete dead code from old nav model. Remove: `useSelectedProject()` hook, `selectedProjectId` from UI store, project selector component, scope breadcrumb component. Verify no remaining imports.

### Testing & Documentation

- [ ] **NAV.TEST.1** — Write e2e test plan: `tests/e2e/plans/project-nav.md`. Cover: sidebar tree, project expand/collapse, navigation to each project page, URL structure, old URL redirects, dashboard project cards, App Settings vs Project Settings, command palette.
- [ ] **NAV.TEST.2** — Execute project navigation e2e tests. Screenshot each case. File bugs as `FX.NAV.*`.
- [ ] **NAV.DOC.1** — Update docs for navigation rewrite. New URL structure, sidebar tree, settings split, project context hook. Update `docs/architecture.md`, `docs/api.md`.
- [ ] **NAV.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans. File bugs as `FX.REG.*`.

---

## Sprint 28: Scheduling, Templates & Notification Channels (Deprioritized)

> Tier 3 features: Scheduling (cron agent runs), Templates P1 (work item templates), Notification External Channels (webhook channel wrapping outbound infra).
> Proposal docs: `docs/proposals/scheduling/ux-design.md`, `docs/proposals/scheduling/infrastructure.md`, `docs/proposals/templates/design.md`, `docs/proposals/notifications/integrations.md`

### Templates Phase 1

- [ ] **TPL.3** — Frontend: add template selector to work item creation flow. When clicking "+ Add" in work items, show template picker dialog (grid of template cards with name + description). Selecting a template pre-fills title, description, priority, labels.

### Notification External Channels

- [ ] **NEC.1** — Backend: create `packages/backend/src/notifications/webhook-channel.ts`. Wrap outbound webhook infrastructure — when `broadcastNotification()` fires, also create a webhook delivery for subscriptions listening to `notification.*` events. Add `notification.agent_completed`, `notification.agent_errored`, `notification.budget_threshold` to the event catalog in event-bus.ts.
- [ ] **NEC.2** — Frontend: add notification channel configuration in Settings > Notifications. "Webhook Channel" toggle — when enabled, shows which webhook subscriptions receive notification events. Link to Integrations tab for webhook management.

### Testing & Documentation

- [ ] **S28.TEST.1** — Write e2e test plan for Scheduling + Templates: `tests/e2e/plans/scheduling-templates.md`.
- [ ] **S28.TEST.2** — Execute Scheduling + Templates e2e tests. Screenshot each case. Record results. File bugs as `FX.*`.
- [ ] **S28.DOC.1** — Document Sprint 28 APIs. Update `docs/api.md` with: schedule CRUD, cron validation, template CRUD + apply, notification webhook channel.
- [ ] **S28.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans against current build. Compare against Sprint 27 baseline (44 suites, 0 regressions). File bugs as `FX.REG.*`.

---

> **Remaining Tier 3 backlog defined in `docs/roadmap.md`:** Agent Chat P2 (Rich Messages), Rollback Enhancements, Error Recovery P2, Analytics P2, Custom Workflows P2, Agent Collaboration P2, Frontend/Backend Swappability.
