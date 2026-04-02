# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-27 complete and archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 29: UX Overhaul (Priority)

> Major UX rework based on user feedback. **Prioritized ahead of remaining Sprint 28 and future roadmap work.** Themes: global-as-project foundation, persona→agent rename, chat UX fixes, workflow rework with label triggers, scope clarity.
> Bug Fixes (Sprints 24-27), Phases 1-6, 9 complete and archived. Phases 4, 8 partially complete.

### Bug Fixes (Sprint 29 Review)

- [x] **FX.UXO1** — Critical: Router path `workflows/:id` not renamed to `automations/:id` in `router.tsx:26`. Internal navigation in `workflows.tsx:552,631` still uses `/workflows/` paths. Both must use `/automations/`. *(completed 2026-04-02 12:42 PDT)*
- [x] **FX.UXO2** — Critical: Board view (`board-view.tsx`) hardcoded to 8-state `WORKFLOW` constant from shared. Must fetch workflow states dynamically from backend based on selected project's workflowId. Global project has 3 states but board renders 8 columns. *(resolved by FX.UXO21 — dead code removed, 2026-04-02 12:47 PDT)*
- [x] **FX.UXO3** — Critical: Frontend auto-routing toggle in `workflow-config-section.tsx` reads/writes `project.settings.autoRouting` but backend now reads `workflow.autoRouting`. Toggle has zero effect. Must read/write via `PATCH /api/workflows/:id { autoRouting }`. *(completed 2026-04-02 12:42 PDT)*
- [x] **FX.UXO4** — Critical: Workflow builder `state-card.tsx` allows renaming/deleting Backlog/Done states. Backend rejects with 400, but frontend has no guards. Disable name input, type dropdown, and delete button for built-in states. Show lock icon or "Built-in" badge. *(completed 2026-04-02 12:42 PDT)*
- [x] **FX.UXO5** — Warning: Global project gets wrong workflow. `seed-workflow.ts:backfillWorkflowReferences` overwrites `pj-global.workflowId` with `wf-default` instead of `wf-global`. Fix: skip global project in backfill, or set workflowId explicitly in `ensure-global-project.ts`. *(completed 2026-04-02 12:47 PDT)*
- [ ] **FX.UXO6** — Warning: "All Projects" scope in `recently-deleted.tsx` passes `projectId="pj-global"` to API, which filters to only global-project items. When `isGlobal` is true, should pass `undefined` to return items from ALL projects.
- [ ] **FX.UXO7** — Warning: Queue endpoint (`routes/executions.ts`) accepts `projectId` param but doesn't filter queue entries by it. Returns all projects' data. Either filter by project or remove the misleading param.
- [ ] **FX.UXO8** — Warning: Chat panel overlay (`chat-panel.tsx`) has no agent-based session grouping — only the full `/chat` page got it (UXO.12). Apply same `groupSessionsByAgent` pattern for consistent UX.
- [ ] **FX.UXO9** — Warning: Chat header Globe icon (`chat.tsx:400`) checks `cs.projectId === null` but projectId is notNull in schema. Should also check for `"pj-global"` to show Globe for global project.
- [x] **FX.UXO10** — Warning: `workflows.tsx:568,607` page subtitle and section header still say "Workflows" instead of "Automations". Complete the rename for all user-visible strings. *(completed 2026-04-02 12:47 PDT)*
- [ ] **FX.UXO11** — Warning: `isPico` heuristic in `chat.tsx:128` and `chat-panel.tsx:105` matches `avatar.icon === "dog"`. Any custom agent with dog icon gets Pico's greeting. Remove icon check, match on name or dedicated flag only.
- [ ] **FX.UXO12** — Warning: `use-pico-chat.ts:440-455` stale closure in `deleteSession` — `remaining` computed from pre-update sessions array. Compute `remaining` first, pass to `setSessions`, then use for `setCurrentSessionId`.
- [ ] **FX.UXO13** — Warning: Chat page shows empty state with no feedback when no project is selected (`use-pico-chat.ts:167`). Should show "Select a project to start chatting" message.
- [ ] **FX.UXO14** — Warning: Chat header context menu (`chat.tsx:449`) lacks keyboard accessibility — no Escape to close. Migrate to proper `DropdownMenu` component.
- [x] **FX.UXO15** — Critical: `agent-detail-panel.tsx` (the primary agent editor) has NO scope display or editing UI. The scope feature from UXO.8 is invisible to users. Add scope state, display in read mode, scope/projectId selector in edit mode, and include in save payload. *(completed 2026-04-02 12:42 PDT)*
- [ ] **FX.UXO16** — Warning: `agent-list.tsx:handleCreate` creates agents without `scope` or `projectId`. New agents always default to global regardless of selected project context. Pass `scope`/`projectId` based on `useSelectedProject()`.
- [ ] **FX.UXO17** — Warning: `agent-editor.tsx` is dead code — exported but never imported or rendered. It has scope editing that the active `agent-detail-panel.tsx` lacks. Delete it and port scope UI to the active panel.
- [x] **FX.UXO18** — Warning: Backend `routes/agents.ts:135-144` PATCH allows changing scope to `"project"` without providing `projectId`, creating inconsistent state. Add validation: if `scope === "project"` and no projectId provided (in body or existing record), return 400. *(completed 2026-04-02 12:47 PDT)*
- [x] **FX.UXO19** — Warning: Backend `routes/agents.ts:83` agent creation with invalid `projectId` gives unhelpful 500 (FK constraint). Add project existence check or catch FK error and return 400. *(resolved by FX.UXO18 — FK validation added, 2026-04-02 12:47 PDT)*
- [ ] **FX.UXO20** — Info: Dead code — `toolCallMap` in `use-pico-chat.ts:304` is populated but never read. `lastToolCallIndex` is the actual pairing mechanism. Remove.
- [x] **FX.UXO21** — Info: Dead code — `board-view.tsx` exists but is unreachable (flow view removed). Vestigial `view` state, `setView`, and `WorkItemView` type in `work-items-store.ts`. Remove all. *(completed 2026-04-02 12:47 PDT)*
- [ ] **FX.UXO22** — Info: Dead `AgentScope` type in `shared/src/entities.ts:34-36` — discriminated union that doesn't match actual `scope` field. Remove to avoid confusion.
- [ ] **FX.UXO23** — Info: `BUILT_IN_IDS` in `agent-list.tsx:82-88` contains `"ps-qa00001"` which doesn't exist in seed data. Seed has `"ps-rt00001"` (Router). Router agent shows delete button incorrectly. Fix IDs or use `agent.settings.isSystem` flag instead.
- [ ] **FX.UXO24** — Info: `AgentId` type in `shared/src/ids.ts:6` still uses `ps-` prefix. `createId.agent()` generates `ps-` IDs. Semantically wrong post-rename. Track as tech debt — requires migration + seed updates to change.

### Phase 4: Workflow Rework (remaining)

- [ ] **UXO.27** — Frontend: Move Schedules out of Settings onto Automations page. Remove the schedules section from Settings. Schedule cards on the Automations page link to an edit view (inline dialog or dedicated page) for cron expression, agent selection, prompt template, and project scope. Active/disabled toggle directly on the card.
- [ ] **UXO.22** — Frontend: Per-workflow auto-routing toggle on overview page and in builder header. Calls `PATCH /api/workflows/:id { autoRouting }`. Label: "Auto-routing OFF" / "Auto-routing ON".
- [ ] **UXO.26** — Frontend: Move workflow settings from Settings page into workflow builder. Remove `workflow-config-section.tsx` from Settings. Move the agent-state assignment table (PersonaStateTable → AgentStateTable) into the workflow builder as a "State Agents" tab or section alongside the state cards. The auto-routing toggle is already on the workflow (UXO.22). The workflow selector dropdown in Settings is no longer needed since each workflow is managed from its own builder page. Clean up any orphaned Settings references.

### Phase 8: Settings Reorganization

- [ ] **UXO.28** — Frontend: Reorganize Settings page into Global and Project sections. Split the settings sidebar into two labeled groups with headers: "Global" (API Keys & Executor, Appearance, Notifications, Service, Data) and "Project: {name}" (Security, Costs & Limits, Integrations). Project section shows current project name and scope badge. When global project is selected, project section shows "All Projects" settings. Remove the "Workflow" and "Scheduling" tabs (moved to Automations in UXO.26/UXO.27).
- [ ] **UXO.29** — Frontend: Break up "Agent Configuration" section. Move API Key and Executor Mode into a new "API Keys & Executor" global section. Move Max Concurrent Agents into "Costs & Limits" project section (alongside monthly cap, warning threshold, daily limit). Remove the empty "Agent Configuration" tab. Drop the unpersisted "Per-Persona Limits" table (local-only state that does nothing).

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
