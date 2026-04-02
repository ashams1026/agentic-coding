# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-27 complete and archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 29: UX Overhaul (Priority)

> Major UX rework based on user feedback. **Prioritized ahead of remaining Sprint 28 and future roadmap work.** Themes: global-as-project foundation, persona→agent rename, chat UX fixes, workflow rework with label triggers, scope clarity.
> Bug Fixes (Sprints 24-27), Phase 1 (Global as Project), Phase 2 (Agent Rename), and Phase 5 (Agent Monitor Queue) complete and archived. Phases 3, 4, 8 partially complete.

### Phase 3: Chat UX Fixes

- [ ] **UXO.12** — Frontend: Group chat sessions by agent name. Replace date-based grouping in session sidebar with agent-based collapsible groups. Each group header: agent avatar + name + session count + expand/collapse caret. Sessions within each group sorted by recency. Default all expanded.
- [ ] **UXO.13** — Frontend: Improve chat header. Show agent avatar + name prominently (larger, left-aligned). Show resolved project name. Editable session title. Context menu (rename, delete). Clear visual identity of which agent you're talking to.

### Phase 4: Workflow Rework

- [ ] **UXO.14** — Schema: Add `autoRouting` boolean (default false) to `workflows` table. Add `agentOverrides` JSON column to `workflow_states`: `[{ labelMatch: string, agentId: string }]` for label-based agent selection. Generate migration. Remove `autoRouting` from project `settings` JSON.
- [ ] **UXO.15** — Backend: Per-workflow auto-routing. Update `runRouter()` to read `workflow.autoRouting` instead of `project.settings.autoRouting`. Build Router system prompt from the specific workflow's state machine via `workflowId`.
- [ ] **UXO.16** — Backend: Label-based agent resolution. Update `resolveAgentForState()` to check work item labels against `workflowStates.agentOverrides`. Priority: label match override → state default agent → null.
- [ ] **UXO.17** — Backend: Enforce Backlog/Done as immutable built-in states. Every workflow must have exactly one initial state ("Backlog") and at least one terminal state ("Done"). These names cannot be changed or deleted. Auto-create them on `POST /api/workflows`.
- [ ] **UXO.20** — Frontend: Redesign Automations page as unified live overview. Two card types side by side: **Workflow cards** (name, auto-routing play/pause, live state pipeline with item counts per state and active agents, edit button) and **Schedule cards** (name, agent avatar+name, cron expression in human-readable form, next run time, active play/pause toggle, last run status). "New Automation" button offers choice: Workflow or Schedule. Extract flow-view metrics logic for workflow cards.
- [ ] **UXO.27** — Frontend: Move Schedules out of Settings onto Automations page. Remove the schedules section from Settings. Schedule cards on the Automations page link to an edit view (inline dialog or dedicated page) for cron expression, agent selection, prompt template, and project scope. Active/disabled toggle directly on the card.
- [ ] **UXO.21** — Frontend: Update workflow builder for label-based agent overrides. In state card, add collapsible "Agent Overrides" section below default agent selector. Each row: label match input + agent dropdown. "Add override" button. Show overrides as chips on the state card.
- [ ] **UXO.22** — Frontend: Per-workflow auto-routing toggle on overview page and in builder header. Calls `PATCH /api/workflows/:id { autoRouting }`. Label: "Auto-routing OFF" / "Auto-routing ON".
- [ ] **UXO.26** — Frontend: Move workflow settings from Settings page into workflow builder. Remove `workflow-config-section.tsx` from Settings. Move the agent-state assignment table (PersonaStateTable → AgentStateTable) into the workflow builder as a "State Agents" tab or section alongside the state cards. The auto-routing toggle is already on the workflow (UXO.22). The workflow selector dropdown in Settings is no longer needed since each workflow is managed from its own builder page. Clean up any orphaned Settings references.

### Phase 6: Global Work Items

- [ ] **UXO.23** — Enable work items for global scope. Remove sidebar nav dimming when global project selected. Seed a simple 3-state workflow for the global project: Backlog → In Progress → Done (autoRouting: false, no agents assigned).

### Phase 8: Settings Reorganization

- [ ] **UXO.28** — Frontend: Reorganize Settings page into Global and Project sections. Split the settings sidebar into two labeled groups with headers: "Global" (API Keys & Executor, Appearance, Notifications, Service, Data) and "Project: {name}" (Security, Costs & Limits, Integrations). Project section shows current project name and scope badge. When global project is selected, project section shows "All Projects" settings. Remove the "Workflow" and "Scheduling" tabs (moved to Automations in UXO.26/UXO.27).
- [ ] **UXO.29** — Frontend: Break up "Agent Configuration" section. Move API Key and Executor Mode into a new "API Keys & Executor" global section. Move Max Concurrent Agents into "Costs & Limits" project section (alongside monthly cap, warning threshold, daily limit). Remove the empty "Agent Configuration" tab. Drop the unpersisted "Per-Persona Limits" table (local-only state that does nothing).

### Phase 9: Status Bar Update

- [ ] **UXO.31** — Frontend: Rework status bar auto-routing indicator. The current play/pause button for auto-routing no longer makes sense with per-workflow/per-schedule toggles. Replace it with a read-only "Automations active" indicator showing count of active automations (workflows with `autoRouting: true` + schedules with `isActive: true`). Move it to the right side with the other status indicators (WS connection, agent count). Not clickable — clicking navigates to the Automations page instead. Remove the old `project.settings.autoRouting` toggle from the status bar.

### Testing & Documentation

- [ ] **UXO.TEST.1** — Write e2e test plan: `tests/e2e/plans/ux-overhaul.md`. Cover: global project, scope breadcrumb, agent rename in UI, chat fixes, agent-grouped sessions, Automations page (workflow + schedule cards, play/pause, new automation flow), per-workflow auto-routing, label overrides, global work items, Settings reorganization (global vs project sections, scope badges).
- [ ] **UXO.TEST.2** — Execute UX Overhaul e2e tests. Screenshot each case. Record results. File bugs as `FX.*`.
- [ ] **UXO.DOC.1** — Update all docs for UX Overhaul. Rename persona → agent throughout `docs/`. Document: global project model, agent scope, `agentOverrides`, per-workflow `autoRouting`, flow view removal. Update `docs/api.md` with renamed endpoints.
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
