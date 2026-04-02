# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-27 complete and archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Bug Fixes: Post-Sprint Review (Sprints 24-27)

> Critical bugs, dead code, and unimplemented stubs found during deep review of autonomous agent work. Prioritized by severity. **Fix these before continuing Sprint 28 feature work.**

### Warning — Missing Data & Stale UI

- [x] **FX.WF.4** — Include transition sortOrder in workflow save payload. `packages/frontend/src/pages/workflows.tsx:28-35` — `sortOrder` is omitted from transitions when saving, so all transitions get `sortOrder: 0`. Preserve the correct order. *(completed 2026-04-03 13:20 PDT)*
- [ ] **FX.DOC.1** — Update `docs/workflow.md` to reflect custom workflows. Still says "hardcoded" and "not user-configurable" — needs to document the Sprint 25 workflow engine.

### Warning — Layout Bugs

- [ ] **FX.HIST.1** — Fix Agent Monitor history table row width misalignment. `packages/frontend/src/features/agent-monitor/agent-history.tsx:424-517` — `HistoryRow` wraps content in a Radix `<Collapsible>` which renders a `<div>` inside `<tbody>`, breaking table layout (invalid HTML). Rows don't respect header column widths. Fix: replace `<Collapsible>` with conditional rendering using the `isExpanded` prop directly, keeping `<TableRow>` elements as direct children of `<TableBody>`. Also replace the raw `<tr>` on line 485 with `<TableRow>`.

### Warning — Code Quality

- [ ] **FX.TYPE.1** — Fix unsafe double type casts in chat routes. `packages/backend/src/routes/chat.ts:367-369` — `project as unknown as Project` and `chatAgent as unknown as Persona` are fragile double casts. Create proper mapping functions or use the correct types directly.
- [ ] **FX.TYPE.2** — Import HandoffNote from shared instead of duplicating. `packages/backend/src/agent/handoff-notes.ts:11` — `HandoffNote` type is duplicated instead of imported from `@agentops/shared`. Remove the local definition and import from shared.
- [ ] **FX.PERF.1** — Fix N+1 query in dependency check. `packages/backend/src/agent/dispatch.ts:56-63` — dependency check runs one query per upstream dependency. Batch into a single query with `IN (...)` clause.

---

## Sprint 29: UX Overhaul (Priority)

> Major UX rework based on user feedback. **Prioritized ahead of remaining Sprint 28 and future roadmap work.** Themes: global-as-project foundation, persona→agent rename, chat UX fixes, workflow rework with label triggers, scope clarity.

### Phase 1: Global as Project

- [ ] **UXO.1** — Schema: Add `isGlobal` boolean (default false) to `projects` table. Generate migration. Update seed to create a permanent global project (`id: "pj-global"`, `name: "All Projects"`, `isGlobal: true`, no path). Add delete guard to `DELETE /api/projects/:id` — reject with 409 if `isGlobal`.
- [ ] **UXO.2** — Backend: Migrate all nullable `projectId` references to use `pj-global`. Backfill `chat_sessions`, `executions`, `global_memories` where `projectId IS NULL` → set to `pj-global`. Make `projectId` NOT NULL on all tables. Update API endpoints to stop treating null as "global" — filter by projectId like normal. Dashboard: when `project.isGlobal`, aggregate stats across all projects.
- [ ] **UXO.3** — Frontend: Replace `"__all__"` sentinel with global project ID. Update `useSelectedProject()` to return `"pj-global"` instead of null. Remove `isGlobalScope === "__all__"` checks — use `project.isGlobal` instead. Update sidebar selector to always show global project first with distinct styling.
- [ ] **UXO.4** — Frontend: Add persistent scope breadcrumb. Create `scope-indicator.tsx` below the sidebar header showing current project name with colored dot (violet for global, project color otherwise). Always visible even when sidebar is collapsed (colored accent strip on left edge). Mount in root layout.

### Phase 2: Agent Rename (Persona → Agent)

- [ ] **UXO.5** — Shared types: Rename `Persona` → `Agent`, `PersonaId` → `AgentId`, `PersonaSettings` → `AgentSettings` across `packages/shared/src/entities.ts`, `ws-events.ts`, and all shared exports. Rename `PersonaAssignment` → `AgentAssignment`.
- [ ] **UXO.6** — Schema + Backend: Rename `personas` table → `agents`, all `personaId` columns → `agentId` (chat_sessions, executions, workflow_states, persona_assignments → agent_assignments, schedules, etc.). Generate migration. Rename `routes/personas.ts` → `routes/agents.ts`, API paths `/api/personas` → `/api/agents`. Update all backend imports and queries.
- [ ] **UXO.7** — Frontend: Rename all persona references → agent. Rename `features/persona-manager/` → `features/agent-builder/`. Update sidebar label to "Agent Builder". Rename hooks (`usePersonas` → `useAgents`), API client functions, stores, route paths. Update all imports.
- [ ] **UXO.8** — Add project scope to agents. Add `scope` field (global/project) and nullable `projectId` FK to agents schema. Generate migration. Project-scoped agents only appear in that project's agent lists, chat selectors, workflow assignments. Global agents (default) available everywhere. Add scope badge on agent cards in Agent Builder. Update agent creation form with scope dropdown.

### Phase 3: Chat UX Fixes

- [ ] **UXO.9** — Fix: Chat session list doesn't load on `/chat` page mount. `use-pico-chat.ts:215` gates session loading on `isOpen` (panel state), which is `false` on the full page. Add a separate `useEffect` that calls `refreshSessions()` on page mount independent of panel state.
- [ ] **UXO.10** — Fix: Chat panel minimizes on dropdown interaction and outside clicks. `chat-panel.tsx:131-146` click-outside handler only excludes `dropdown-menu-content` but misses `select-content`. Remove the click-outside-to-close behavior entirely — panel should ONLY close via the minimize button.
- [ ] **UXO.11** — Fix: Empty chat state always shows "Woof I'm Pico". Update empty state in `chat.tsx` and `chat-panel.tsx` to dynamically show the selected agent's name, avatar, and description. Pico greeting only when Pico is selected. Other agents show their own description.
- [ ] **UXO.12** — Frontend: Group chat sessions by agent name. Replace date-based grouping in session sidebar with agent-based collapsible groups. Each group header: agent avatar + name + session count + expand/collapse caret. Sessions within each group sorted by recency. Default all expanded.
- [ ] **UXO.13** — Frontend: Improve chat header. Show agent avatar + name prominently (larger, left-aligned). Show resolved project name. Editable session title. Context menu (rename, delete). Clear visual identity of which agent you're talking to.

### Phase 4: Workflow Rework

- [ ] **UXO.14** — Schema: Add `autoRouting` boolean (default false) to `workflows` table. Add `agentOverrides` JSON column to `workflow_states`: `[{ labelMatch: string, agentId: string }]` for label-based agent selection. Generate migration. Remove `autoRouting` from project `settings` JSON.
- [ ] **UXO.15** — Backend: Per-workflow auto-routing. Update `runRouter()` to read `workflow.autoRouting` instead of `project.settings.autoRouting`. Build Router system prompt from the specific workflow's state machine via `workflowId`.
- [ ] **UXO.16** — Backend: Label-based agent resolution. Update `resolveAgentForState()` to check work item labels against `workflowStates.agentOverrides`. Priority: label match override → state default agent → null.
- [ ] **UXO.17** — Backend: Enforce Backlog/Done as immutable built-in states. Every workflow must have exactly one initial state ("Backlog") and at least one terminal state ("Done"). These names cannot be changed or deleted. Auto-create them on `POST /api/workflows`.
- [ ] **UXO.18** — Frontend: Remove flow view from work items page. Delete `flow-view.tsx` and the list/flow view toggle. Work items page is list-only.
- [ ] **UXO.19** — Frontend: Move Workflows below Work Items in sidebar nav order.
- [ ] **UXO.20** — Frontend: Redesign workflows page as live overview. Full-width workflow cards showing: name, auto-routing play/pause toggle, live state pipeline with item counts per state and active agents (extract metrics logic from deleted flow-view), edit button. One card per workflow in current scope.
- [ ] **UXO.21** — Frontend: Update workflow builder for label-based agent overrides. In state card, add collapsible "Agent Overrides" section below default agent selector. Each row: label match input + agent dropdown. "Add override" button. Show overrides as chips on the state card.
- [ ] **UXO.22** — Frontend: Per-workflow auto-routing toggle on overview page and in builder header. Calls `PATCH /api/workflows/:id { autoRouting }`. Label: "Auto-routing OFF" / "Auto-routing ON".

### Phase 5: Agent Monitor Queue

- [ ] **UXO.24** — Backend: Add `GET /api/executions/queue` endpoint. Expose the in-memory concurrency queue from `concurrency.ts`. Return array of `{ workItemId, workItemTitle, agentId, agentName, priority, enqueuedAt, position }`. Resolve workItemId and personaId (→ agentId) to display names via DB joins. Also return `{ activeCount, maxConcurrent, queueLength }` metadata.
- [ ] **UXO.25** — Frontend: Add "Queue" tab to Agent Monitor alongside Live and History. Show queued executions as a list: position number, agent avatar + name, work item title, priority badge (p0=red, p1=orange, p2=blue, p3=gray), time waiting (relative). Show empty state "No queued agents" when queue is empty. Show active/max count in tab badge: "Queue (3)". Auto-refresh via polling or WS event when queue changes.

### Phase 6: Global Work Items

- [ ] **UXO.23** — Enable work items for global scope. Remove sidebar nav dimming when global project selected. Seed a simple 3-state workflow for the global project: Backlog → In Progress → Done (autoRouting: false, no agents assigned).

### Testing & Documentation

- [ ] **UXO.TEST.1** — Write e2e test plan: `tests/e2e/plans/ux-overhaul.md`. Cover: global project, scope breadcrumb, agent rename in UI, chat fixes, agent-grouped sessions, workflow live overview, per-workflow auto-routing, label overrides, global work items.
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
