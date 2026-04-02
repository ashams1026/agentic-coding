# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-27 complete and archived. Sprint 29 fully archived. Sprint 30 Phases 1-5 archived (NAV.1-16, NAV.19-20). Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 29: UX Overhaul (Priority)

> Major UX rework based on user feedback. **Prioritized ahead of remaining Sprint 28 and future roadmap work.** Themes: global-as-project foundation, persona→agent rename, chat UX fixes, workflow rework with label triggers, scope clarity.
> Bug Fixes (Sprints 24-27), Phases 1-6, 9 complete and archived. Phases 4, 8 partially complete.

### Remaining Sprint 29

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

### Phase 4: Settings Split (remaining)

- [x] **NAV.17** — Frontend: Create Project Settings page at `/p/:projectId/settings`. 4 sections: Security, Costs & Limits, Notifications, Integrations. *(completed 2026-04-02 14:56 PDT)*
- [x] **NAV.18** — N/A: `workflow-config-section.tsx` already deleted in UXO.26, agent assignments already in workflow builder. *(completed 2026-04-02 14:52 PDT)*

### Phase 6: Cleanup + Polish

- [x] **NAV.21** — Frontend: Update command palette with project-scoped commands. "[Project] > [Page]" for all 8 pages per project. Search matches project names. *(completed 2026-04-02 14:56 PDT)*
- [x] **NAV.22** — Frontend: Update status bar. Shows current project name on project pages. Removed old automations indicator. Preserved WS/agent/cost indicators. *(completed 2026-04-02 14:56 PDT)*
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
