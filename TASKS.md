# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-22 complete and archived. Sprint 23: Error Recovery (FND.ERR.1-7), Work Item Lifecycle (FND.WIL.1-8), Global Agents (FND.GA.1-10), Testing partial (FND.TEST.1-4) archived. All research proposals (RES.*) complete and archived. Blocked tasks (FX.SDK3, FX.SDK5, SDK.V2.3) moved to `BLOCKED_TASKS.md`. Full roadmap for Sprints 24-27 and Tier 3 backlog in `docs/roadmap.md`.

---

## Sprint 23: Foundations

> Reliability fixes + data hygiene + the keystone feature (Global Agents). See `docs/roadmap.md` for full context.
> Proposal docs: `docs/proposals/error-recovery/`, `docs/proposals/work-item-lifecycle/`, `docs/proposals/global-agents/`

### Testing & Documentation

- [x] **FND.TEST.5** — Execute Global Agents Phase 1 e2e tests. Run the test plan from `tests/e2e/plans/global-agents-phase1.md` via chrome-devtools MCP. Screenshot each test case. Record results to `tests/e2e/results/`. File bugs as `FX.*` tasks for any failures. *(completed 2026-04-02 02:30 PDT)*
- [x] **FND.TEST.6** — Regression checkpoint: re-run all existing e2e test suites. Run every test plan in `tests/e2e/plans/` against the current build. Record results to `tests/e2e/results/`. Compare against previous results to identify regressions. File bugs as `FX.REG.*` tasks for any new failures not present in prior runs. *(completed 2026-04-02 02:55 PDT)*
- [x] **FND.DOC.1** — Document new Work Item Lifecycle API endpoints. Update `docs/` with the new endpoints: `POST /api/work-items/:id/archive`, `POST /api/work-items/:id/unarchive`, `POST /api/work-items/:id/restore`, `POST /api/work-items/bulk/archive`, `POST /api/work-items/bulk/unarchive`, `DELETE /api/work-items/bulk`. Include request/response shapes, 409 guard behavior, 30-day grace period, and cascade rules. Also document the `archived_at`/`deleted_at` schema additions. *(completed 2026-04-02 03:25 PDT)*
- [x] **FND.DOC.2** — Document Global Agents data model and API changes. Update `docs/` with: nullable `projectId` on chat sessions and executions, `global_memories` table schema, `AgentScope` type, `POST /api/executions/run` standalone execution endpoint (request/response shape, validation rules). Document the "All Projects" navigation behavior and scope-awareness rules for Dashboard and Agent Monitor. *(completed 2026-04-02 03:40 PDT)*

---

## Sprint 24: Core UX

> Agent Chat, Persona Prompts, Notifications. Frontend-first per user preference.
> Proposal docs: `docs/proposals/agent-chat/`, `docs/proposals/persona-prompts/`, `docs/proposals/notifications/`

### Agent Chat Phase 1

- [ ] **ACH.1** — Schema migration: add `persona_id` (TEXT FK nullable), `work_item_id` (TEXT FK nullable), `sdk_session_id` (TEXT nullable) columns to `chat_sessions` table in `packages/backend/src/db/schema.ts`. Update `serializeSession()` in `packages/backend/src/routes/chat.ts` to include new fields. Backfill existing sessions: set `persona_id` to the Pico persona's ID (query personas where `settings.isAssistant = true`).
- [ ] **ACH.2** — Backend: update `POST /api/chat/sessions` to persist `personaId` and `workItemId` from request body into the new columns. Update `GET /api/chat/sessions` to join persona data (name, avatar) and return it alongside each session. Update `GET /api/chat/sessions/:id/messages` response to include the session's persona info.
- [ ] **ACH.3** — Backend: update `POST /api/chat/sessions/:id/messages` to load the persona from the session's `persona_id` instead of always looking up the default Pico persona. Build the system prompt using the loaded persona's `systemPrompt`. If the persona is not Pico, skip injecting pico-skill.md and the Pico personality instructions. Keep Pico-specific behavior only when `persona.settings.isAssistant` is true.
- [ ] **ACH.4** — Frontend: create persona selector grid component at `packages/frontend/src/features/pico/persona-selector.tsx`. Display all personas as cards (avatar, name, description, model badge). Highlight Pico as default. On selection, create a new chat session with the chosen `personaId`. Wire into the "New Chat" button on the `/chat` page. If in project scope, pass `projectId`.
- [ ] **ACH.5** — Frontend: enhance session sidebar on `/chat` page to show persona avatar next to each session title. Group sessions by date (Today, Yesterday, This Week, Older). Add a persona filter dropdown to filter sessions by persona. Show last message preview (truncated to 60 chars) under each session title.
- [ ] **ACH.6** — Frontend: add chat header bar to the `/chat` page message area. Show persona avatar + name, project badge (or "Global" if no projectId), and editable session title. Double-click title to rename (calls `PATCH /api/chat/sessions/:id`). Add a context menu (three-dot) with: Rename, Delete session.
- [ ] **ACH.7** — Frontend: add session management actions. Right-click context menu on session sidebar items: Rename, Delete (with confirmation dialog). Wire Delete to `DELETE /api/chat/sessions/:id` and refresh session list. When the active session is deleted, auto-select the most recent remaining session or show empty state.

### Persona Prompts Phase 1

- [ ] **PPR.1** — Backend: create `resolveVariables(template: string, context: Record<string, string | undefined>): string` function in a new file `packages/backend/src/agent/prompt-variables.ts`. Use regex `{{variable.name}}` substitution. Undefined variables are left as literal text. Also create `buildVariableContext()` that assembles the built-in variable map: `project.*` (name, path, description), `persona.*` (name, description, model), `date.*` (now as ISO, today as YYYY-MM-DD, dayOfWeek). Export both functions.
- [ ] **PPR.2** — Backend: integrate `resolveVariables()` into `buildSystemPrompt()` in `packages/backend/src/agent/claude-executor.ts`. Call it on the persona's `systemPrompt` before joining prompt sections, passing the built-in variable context (project + persona + date + workItem fields: title, id, state, description). Also integrate into the Pico chat path in `packages/backend/src/routes/chat.ts` — resolve variables in the persona's systemPrompt before building the chat prompt, passing project + persona + date context (no workItem in chat path).
- [ ] **PPR.3** — Frontend: add autocomplete popup to `packages/frontend/src/features/persona-manager/system-prompt-editor.tsx`. Trigger on typing `{{` — show a dropdown of available variables grouped by namespace (project, persona, date, workItem). On selection, insert `{{variable.name}}` at cursor. Dismiss on Escape or clicking outside. Use a simple popover positioned at the cursor.
- [ ] **PPR.4** — Frontend: add a collapsible "Variables" reference panel below the system prompt textarea in the persona editor. Show all available variables with their current values (use the selected project's data for preview). Add a "Preview" toggle button that switches the textarea to read-only mode showing the fully resolved prompt with variable values highlighted in a distinct color.

### Notifications UX Phase 1

- [ ] **NTF.1** — Shared types: add `NotificationEventType` and `Notification` interface to `packages/shared/src/ws-events.ts`. Types: `proposal_needs_approval`, `agent_errored`, `budget_threshold`, `execution_stuck`, `agent_completed`. Add `notification` to the WsEventType union. Each notification has: id, type, priority (critical/high/low/info), title, description, projectId?, workItemId?, executionId?, read, createdAt.
- [ ] **NTF.2** — Backend: emit `notification` WebSocket events from key points. In execution manager (`packages/backend/src/agent/claude-executor.ts` or execution routes): emit on agent error (critical), agent completed (low). In proposal routes: emit on proposal created with type `review_request` (critical). In dashboard routes or cost tracking: emit when `todayCostUsd` exceeds 80% of `monthCap` (high). Use the existing `broadcast()` from `packages/backend/src/ws.ts`.
- [ ] **NTF.3** — Frontend: create Zustand notification store at `packages/frontend/src/stores/notification-store.ts`. State: `notifications: Notification[]`, `preferences: NotificationPreferences` (enabledEvents map, soundEvents map, quietHours, scope). Actions: addNotification, markRead, markAllRead, removeNotification, updatePreferences. Persist to localStorage. Add 60-second batching: group multiple `agent_completed` notifications within the window into a single "N agents completed" notification.
- [ ] **NTF.4** — Frontend: create `NotificationBell` component at `packages/frontend/src/features/notifications/notification-bell.tsx`. Bell icon with unread count badge (red circle, "9+" for >9). Place in sidebar footer between theme toggle and collapse button. On click, toggle the notification drawer. Wire to notification store's unread count.
- [ ] **NTF.5** — Frontend: create `NotificationDrawer` component at `packages/frontend/src/features/notifications/notification-drawer.tsx`. 320px sliding panel from right (overlay, z-50). Header: "Notifications" title + "Mark all read" button. Group by date (Today, Yesterday, This Week, Older). Each notification rendered as a `NotificationCard` with: type icon (color-coded), title, description (1-2 lines), relative time, action button. Empty state: "All caught up!".
- [ ] **NTF.6** — Frontend: create `NotificationCard` component at `packages/frontend/src/features/notifications/notification-card.tsx`. Render icon per type: proposal=Lightbulb/amber, error=AlertCircle/red, budget=AlertTriangle/yellow, stuck=Clock/orange, completed=CheckCircle/green. Include inline action buttons: proposals show [Approve] [Reject] (call `PATCH /api/proposals/:id`), errors show [View execution] (navigate to /agents), completed show [View result]. Mark as read on click.
- [ ] **NTF.7** — Frontend: enhance existing toasts in `packages/frontend/src/features/toasts/`. Critical toasts (proposal_needs_approval, agent_errored, budget_threshold) should NOT auto-dismiss — require manual close. Add action buttons to toasts (View, Approve, Reject). Max 3 visible; overflow shows "+N more" link that opens the notification drawer. Update `use-toast-events.ts` to dispatch to both toast store and notification store when WS events arrive.
- [ ] **NTF.8** — Frontend: add "Notifications" tab to Settings page (`packages/frontend/src/features/settings/`). Per-event-type toggles for in-app and sound. Quiet hours toggle with from/to time pickers. Scope: "All projects" vs "Current project only". Save to notification store preferences (persisted via localStorage).

### Testing & Documentation

- [ ] **CUX.TEST.1** — Write e2e test plan for Agent Chat Phase 1: `tests/e2e/plans/agent-chat-phase1.md`. Cover: persona selector grid, new session with non-Pico persona, session sidebar with persona avatars/date grouping/filter, chat header with persona info/project badge, session rename/delete, message streaming with selected persona.
- [ ] **CUX.TEST.2** — Execute Agent Chat Phase 1 e2e tests. Run the test plan from `tests/e2e/plans/agent-chat-phase1.md` via chrome-devtools MCP. Screenshot each test case. Record results to `tests/e2e/results/`. File bugs as `FX.*` tasks for any failures.
- [ ] **CUX.TEST.3** — Write e2e test plan for Notifications UX: `tests/e2e/plans/notifications-ux.md`. Cover: bell icon with badge, drawer open/close, notification grouping by date, notification card actions, mark all read, enhanced toasts (critical non-dismissable), notification preferences in Settings, quiet hours.
- [ ] **CUX.TEST.4** — Execute Notifications UX e2e tests. Run the test plan via chrome-devtools MCP. Screenshot each test case. Record results to `tests/e2e/results/`. File bugs as `FX.*` tasks for any failures.
- [ ] **CUX.DOC.1** — Document Agent Chat and Persona Prompts API changes. Update `docs/api.md` with: updated `POST /api/chat/sessions` (personaId, workItemId params), updated session response shape (persona info), template variable resolution behavior. Document built-in variable namespaces and resolution rules.
- [ ] **CUX.DOC.2** — Document Notifications system. Update `docs/api.md` with: `notification` WebSocket event type and payload shape, NotificationEventType enum, notification priority levels. Document frontend notification preferences schema.
- [ ] **CUX.TEST.5** — Regression checkpoint: re-run all existing e2e test suites in `tests/e2e/plans/` against the current build. Record results to `tests/e2e/results/`. Compare against Sprint 23 regression baseline. File bugs as `FX.REG.*` tasks for any new failures.

---

> **Future sprints (25-27) and Tier 3 backlog are defined in `docs/roadmap.md`.** When Sprint 24 is complete, the Decomposer agent should read the roadmap and decompose Sprint 25 into tasks.
