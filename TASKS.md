# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-27 complete and archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 29: UX Overhaul (Priority)

> Major UX rework based on user feedback. **Prioritized ahead of remaining Sprint 28 and future roadmap work.** Themes: global-as-project foundation, persona→agent rename, chat UX fixes, workflow rework with label triggers, scope clarity.
> Bug Fixes (Sprints 24-27), Phases 1-6, 9 complete and archived. Phases 4, 8 partially complete.

### Bug Fixes (Sprint 29 Review — remaining)

- [x] **FX.UXO6** — Warning: "All Projects" scope in `recently-deleted.tsx` passes `projectId="pj-global"` to API. When `isGlobal` is true, should pass `undefined` to return items from ALL projects. *(completed 2026-04-02 12:53 PDT)*
- [x] **FX.UXO7** — Warning: Queue endpoint (`routes/executions.ts`) accepts `projectId` param but doesn't filter by it. Either filter or remove the param. *(completed 2026-04-02 12:53 PDT)*
- [x] **FX.UXO8** — Warning: Chat panel overlay (`chat-panel.tsx`) has no agent-based session grouping — only the full `/chat` page got it. Apply same `groupSessionsByAgent` pattern. *(completed 2026-04-02 12:58 PDT)*
- [x] **FX.UXO9** — Warning: Chat header Globe icon (`chat.tsx`) checks `projectId === null` but projectId is notNull in schema. Should also check for `"pj-global"`. *(completed 2026-04-02 12:58 PDT)*
- [x] **FX.UXO11** — Warning: `isPico` heuristic in `chat.tsx` and `chat-panel.tsx` matches `avatar.icon === "dog"`. Remove icon check, match on name only. *(completed 2026-04-02 12:53 PDT)*
- [x] **FX.UXO12** — Warning: `use-pico-chat.ts` stale closure in `deleteSession`. Compute `remaining` before updating sessions array. *(completed 2026-04-02 13:14 PDT)*
- [ ] **FX.UXO13** — Warning: Chat page shows empty state with no feedback when no project selected. Show "Select a project" message.
- [x] **FX.UXO14** — Warning: Chat header context menu (`chat.tsx`) lacks keyboard accessibility. Migrate to `DropdownMenu` component. *(completed 2026-04-02 13:14 PDT)*
- [x] **FX.UXO16** — Warning: `agent-list.tsx:handleCreate` creates agents without `scope`/`projectId`. Pass based on `useSelectedProject()`. *(completed 2026-04-02 12:53 PDT)*
- [x] **FX.UXO17** — Warning: `agent-editor.tsx` is dead code. Delete it. *(completed 2026-04-02 12:58 PDT)*
- [ ] **FX.UXO20** — Info: Dead `toolCallMap` in `use-pico-chat.ts`. Remove.
- [x] **FX.UXO22** — Info: Dead `AgentScope` type in `shared/src/entities.ts`. Remove. *(completed 2026-04-02 12:58 PDT)*
- [x] **FX.UXO23** — Info: `BUILT_IN_IDS` in `agent-list.tsx` has wrong ID `"ps-qa00001"`. Fix to match seed data. *(completed 2026-04-02 13:14 PDT)*
- [x] **FX.UXO24** — Info: `AgentId` type uses `ps-` prefix. Tech debt — track only. *(completed 2026-04-02 13:10 PDT)*

### Phase 4: Workflow Rework (remaining)

- [ ] **UXO.27** — Frontend: Move Schedules out of Settings onto Automations page. Remove the schedules section from Settings. Schedule cards on the Automations page link to an edit view (inline dialog or dedicated page) for cron expression, agent selection, prompt template, and project scope. Active/disabled toggle directly on the card.
- [ ] **UXO.22** — Frontend: Per-workflow auto-routing toggle on overview page and in builder header. Calls `PATCH /api/workflows/:id { autoRouting }`. Label: "Auto-routing OFF" / "Auto-routing ON".
- [ ] **UXO.26** — Frontend: Move workflow settings from Settings page into workflow builder. Remove `workflow-config-section.tsx` from Settings. Move the agent-state assignment table (PersonaStateTable → AgentStateTable) into the workflow builder as a "State Agents" tab or section alongside the state cards. The auto-routing toggle is already on the workflow (UXO.22). The workflow selector dropdown in Settings is no longer needed since each workflow is managed from its own builder page. Clean up any orphaned Settings references.

### Phase 8: Settings Reorganization

- [ ] **UXO.28** — Frontend: Reorganize Settings page into Global and Project sections. Split the settings sidebar into two labeled groups with headers: "Global" (API Keys & Executor, Appearance, Notifications, Service, Data) and "Project: {name}" (Security, Costs & Limits, Integrations). Project section shows current project name and scope badge. When global project is selected, project section shows "All Projects" settings. Remove the "Workflow" and "Scheduling" tabs (moved to Automations in UXO.26/UXO.27).
- [ ] **UXO.29** — Frontend: Break up "Agent Configuration" section. Move API Key and Executor Mode into a new "API Keys & Executor" global section. Move Max Concurrent Agents into "Costs & Limits" project section (alongside monthly cap, warning threshold, daily limit). Remove the empty "Agent Configuration" tab. Drop the unpersisted "Per-Persona Limits" table (local-only state that does nothing).

### Design Polish

> Visual and UX quality issues found during full-app design audit. These are polish, not bugs — the features work but look rough, have poor labeling, or lack expected affordances.

- [ ] **DES.1** — Dashboard: Add onboarding/getting-started section for fresh installs. When no work items exist, show a guided checklist: (1) Register a project, (2) Configure API key, (3) Create a work item, (4) Watch an agent run. Replace the empty stat cards + empty table with this flow. Hide once first work item is created.
- [ ] **DES.2** — Dashboard: Improve Projects Overview table. Add columns: work item count, active agents, workflow name, last activity. Currently just shows name + date — not useful.
- [ ] **DES.3** — Chat: Auto-generate session names from first user message (first 40 chars). "New chat" repeated 15+ times makes the session sidebar unusable. Fall back to timestamp if no message yet.
- [ ] **DES.4** — Chat: Reduce session sidebar width. Currently takes disproportionate horizontal space. Cap at ~240px and truncate long session names with ellipsis.
- [x] **DES.5** — Agent Monitor: Fix "stories" terminology in Live empty state. "Agents start when stories move through workflow states" should say "work items" not "stories". *(completed 2026-04-02 13:14 PDT)*
- [ ] **DES.6** — Agent Monitor: Add label to the filter dropdown next to the tabs. Currently just shows "All" with no context of what it filters (agents? projects?).
- [ ] **DES.7** — Automations: Normalize workflow card heights. Default card (with state chips) is taller than cards with no states. Add min-height so cards align in a grid. Cards with no states should show a "Configure states" CTA instead of just "No states defined".
- [ ] **DES.8** — Automations: Change ALL CAPS section headers ("WORKFLOWS", "SCHEDULES") to Title Case ("Workflows", "Schedules"). Reduce visual heaviness. Apply consistent icon sizing on section headers.
- [ ] **DES.9** — Agent Builder: Add search/filter input above agent card grid. As agent count grows, users need to find agents by name or scope. Simple text filter is sufficient for v1.
- [ ] **DES.10** — Agent Builder: Truncate long agent descriptions to 2 lines with ellipsis on cards. Some cards have long descriptions that push card heights inconsistent.
- [ ] **DES.11** — Agent Builder: Rewrite "Router" agent description from developer jargon ("Routes work items between workflow states based on execution outcomes") to user-friendly language ("Automatically moves work items to the next step when an agent finishes").
- [ ] **DES.12** — Settings: Change "SETTINGS" header from ALL CAPS to Title Case. Consistent with the rest of the app's heading style.
- [ ] **DES.13** — Settings > Workflow: Fix grammar in note below agent assignments table. "Ended at terminal states have no assignable agents" is confusing — rewrite to "Terminal states (like Done) don't need assigned agents."
- [ ] **DES.14** — Settings > Agent Configuration: Fix Per-Agent Limits table — "Max Concurrent" column is empty for all agents. Either populate with default values from project settings, or hide the table when no per-agent limits are configured, showing "Per-agent limits not configured" with an enable button.
- [ ] **DES.15** — Settings > Projects: Add useful columns to projects table — work item count, active agents, workflow name, path. Currently just name + date.
- [ ] **DES.16** — Work Items: Add tooltip or label explaining the "Auto" badge next to the page title. Users have no context for what this means.
- [ ] **DES.17** — Activity Feed: Add filter bar with time range selector and event type filter. Currently completely bare — just empty state text. Even in empty state, show the filter controls so users understand what the page will look like.
- [ ] **DES.18** — Global: Increase status bar font size slightly — current text is hard to read at small size. Consider 12px minimum.
- [ ] **DES.19** — Empty states: Audit all empty states across the app for consistency. Every empty state should have: (1) an icon, (2) a heading, (3) a one-line description, (4) a primary CTA button. Pages missing CTAs: Dashboard, Activity Feed. Pages with good empty states to use as template: Agent Monitor, Scheduling.

### Testing & Documentation

- [ ] **UXO.TEST.2** — Execute UX Overhaul e2e tests. Screenshot each case. Record results. File bugs as `FX.*`.
- [ ] **UXO.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans. File bugs as `FX.REG.*`.

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
