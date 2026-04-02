# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-23 complete and archived. Sprint 24 partial: Agent Chat (ACH.1-7), Persona Prompts (PPR.1-4), Notifications (NTF.1-4) archived. All research proposals (RES.*) complete and archived. Blocked tasks (FX.SDK3, FX.SDK5, SDK.V2.3) moved to `BLOCKED_TASKS.md`. Full roadmap for Sprints 24-27 and Tier 3 backlog in `docs/roadmap.md`.

---

## Sprint 24: Core UX

> Agent Chat, Persona Prompts, Notifications. Frontend-first per user preference.
> Proposal docs: `docs/proposals/agent-chat/`, `docs/proposals/persona-prompts/`, `docs/proposals/notifications/`

### Notifications UX Phase 1

- [x] **NTF.5** — Frontend: create `NotificationDrawer` component at `packages/frontend/src/features/notifications/notification-drawer.tsx`. 320px sliding panel from right (overlay, z-50). Header: "Notifications" title + "Mark all read" button. Group by date (Today, Yesterday, This Week, Older). Each notification rendered as a `NotificationCard` with: type icon (color-coded), title, description (1-2 lines), relative time, action button. Empty state: "All caught up!". *(completed 2026-04-02 08:50 PDT)*
- [x] **NTF.6** — Frontend: create `NotificationCard` component at `packages/frontend/src/features/notifications/notification-card.tsx`. Render icon per type: proposal=Lightbulb/amber, error=AlertCircle/red, budget=AlertTriangle/yellow, stuck=Clock/orange, completed=CheckCircle/green. Include inline action buttons: proposals show [Approve] [Reject] (call `PATCH /api/proposals/:id`), errors show [View execution] (navigate to /agents), completed show [View result]. Mark as read on click. *(completed 2026-04-02 09:05 PDT)*
- [x] **NTF.7** — Frontend: enhance existing toasts in `packages/frontend/src/features/toasts/`. Critical toasts (proposal_needs_approval, agent_errored, budget_threshold) should NOT auto-dismiss — require manual close. Add action buttons to toasts (View, Approve, Reject). Max 3 visible; overflow shows "+N more" link that opens the notification drawer. Update `use-toast-events.ts` to dispatch to both toast store and notification store when WS events arrive. *(completed 2026-04-02 09:20 PDT)*
- [x] **NTF.8** — Frontend: add "Notifications" tab to Settings page (`packages/frontend/src/features/settings/`). Per-event-type toggles for in-app and sound. Quiet hours toggle with from/to time pickers. Scope: "All projects" vs "Current project only". Save to notification store preferences (persisted via localStorage). *(completed 2026-04-02 09:35 PDT)*

### Testing & Documentation

- [x] **CUX.TEST.1** — Write e2e test plan for Agent Chat Phase 1: `tests/e2e/plans/agent-chat-phase1.md`. Cover: persona selector grid, new session with non-Pico persona, session sidebar with persona avatars/date grouping/filter, chat header with persona info/project badge, session rename/delete, message streaming with selected persona. *(completed 2026-04-02 09:50 PDT)*
- [x] **CUX.TEST.2** — Execute Agent Chat Phase 1 e2e tests. Run the test plan from `tests/e2e/plans/agent-chat-phase1.md` via chrome-devtools MCP. Screenshot each test case. Record results to `tests/e2e/results/`. File bugs as `FX.*` tasks for any failures. *(completed 2026-04-02 10:15 PDT)*
- [x] **CUX.TEST.3** — Write e2e test plan for Notifications UX: `tests/e2e/plans/notifications-ux.md`. Cover: bell icon with badge, drawer open/close, notification grouping by date, notification card actions, mark all read, enhanced toasts (critical non-dismissable), notification preferences in Settings, quiet hours. *(completed 2026-04-02 10:30 PDT)*
- [ ] **CUX.TEST.4** — Execute Notifications UX e2e tests. Run the test plan via chrome-devtools MCP. Screenshot each test case. Record results to `tests/e2e/results/`. File bugs as `FX.*` tasks for any failures.
- [ ] **CUX.DOC.1** — Document Agent Chat and Persona Prompts API changes. Update `docs/api.md` with: updated `POST /api/chat/sessions` (personaId, workItemId params), updated session response shape (persona info), template variable resolution behavior. Document built-in variable namespaces and resolution rules.
- [ ] **CUX.DOC.2** — Document Notifications system. Update `docs/api.md` with: `notification` WebSocket event type and payload shape, NotificationEventType enum, notification priority levels. Document frontend notification preferences schema.
- [ ] **CUX.TEST.5** — Regression checkpoint: re-run all existing e2e test suites in `tests/e2e/plans/` against the current build. Record results to `tests/e2e/results/`. Compare against Sprint 23 regression baseline. File bugs as `FX.REG.*` tasks for any new failures.

---

> **Future sprints (25-27) and Tier 3 backlog are defined in `docs/roadmap.md`.** When Sprint 24 is complete, the Decomposer agent should read the roadmap and decompose Sprint 25 into tasks.
