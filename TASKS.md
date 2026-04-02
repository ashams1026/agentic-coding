# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-27 complete and archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Bug Fixes: Post-Sprint Review (Sprints 24-27)

> Critical bugs, dead code, and unimplemented stubs found during deep review of autonomous agent work. Prioritized by severity. **Fix these before continuing Sprint 28 feature work.**

### Critical — Dead Code & Unimplemented Stubs

- [x] **FX.DEAD.2** — Implement or remove `execution_stuck` notification type. Backend never emits `execution_stuck` — the type is defined in `packages/shared/src/ws-events.ts`, UI handles it in notification cards, and Settings has a toggle for it, but no backend code ever fires it. Either implement a periodic check for stalled executions (e.g., no progress events for >10min) or remove the type, UI, and settings toggle entirely. *(completed 2026-04-03 10:50 PDT)*
- [x] **FX.DEAD.3** — Replace stub navigation on proposal notification actions. `packages/frontend/src/features/notifications/notification-card.tsx:107-108` — Approve/Reject buttons just navigate to `/items` without passing proposal ID. Wire them to actually call `PATCH /api/proposals/:id` with the approve/reject action, then mark notification as read. *(completed 2026-04-03 11:10 PDT)*

### Critical — HMAC & Webhook Integrity

- [review] **FX.WHK.1** — Fix HMAC verification to use raw request bytes. `packages/backend/src/routes/webhook-triggers.ts:70` uses `JSON.stringify(request.body)` for HMAC verification instead of raw request body bytes. Re-serialized JSON may differ from the original payload (key ordering, whitespace), causing all HMAC checks to fail. Use Fastify's `rawBody` or `request.rawBody` instead.

### Warning — Logic Bugs

- [ ] **FX.NTF.1** — Fix toast overflow count decrement. `packages/frontend/src/stores/toast-store.ts:55` — the `overflowCount` decrement condition is inverted. When a visible toast is auto-dismissed, the overflow count doesn't decrement correctly, leaving stale "+N more" badges.
- [ ] **FX.NTF.2** — Fix notification batching double-count. `packages/frontend/src/stores/notification-store.ts:117-128` — first `agent_completed` notification is added immediately, then the batch summary also counts it, so users see both the individual notification AND a summary that includes it. Either suppress the first individual notification or exclude it from the batch count.
- [ ] **FX.WF.1** — Fix race condition in workflow publish. `packages/frontend/src/pages/workflows.tsx:51-56` — save and publish fire concurrently. Publish must wait for save to complete. Make them sequential (await save, then publish).
- [ ] **FX.WF.2** — Wrap workflow CRUD mutations in DB transactions. `packages/backend/src/routes/workflows.ts:209-244` — PATCH and DELETE handlers do delete-then-insert for states/transitions without a transaction. Server crash between delete and insert loses data. Wrap in `db.transaction()`.
- [ ] **FX.WF.3** — Add input validation to workflow CRUD. `packages/backend/src/routes/workflows.ts` POST/PATCH handlers accept empty names, invalid state types, garbage data. Add validation: require non-empty name, valid state type enum, at least one state, valid transition references.

### Warning — Missing Data & Stale UI

- [ ] **FX.CHAT.1** — Show project name instead of raw ID in chat header. `packages/frontend/src/pages/chat.tsx:374-379` — the project badge shows the raw `projectId` string (e.g., `pj-x7k2m`) instead of the project's display name. Fetch and display the project name.
- [ ] **FX.NAV.1** — Update command palette navigation items. `packages/frontend/src/features/command-palette/command-palette.tsx:39-46` — NAV_ITEMS is stale, missing Analytics, Chat, and Workflows pages. Add all current sidebar pages.
- [ ] **FX.WF.4** — Include transition sortOrder in workflow save payload. `packages/frontend/src/pages/workflows.tsx:28-35` — `sortOrder` is omitted from transitions when saving, so all transitions get `sortOrder: 0`. Preserve the correct order.
- [ ] **FX.DOC.1** — Update `docs/workflow.md` to reflect custom workflows. Still says "hardcoded" and "not user-configurable" — needs to document the Sprint 25 workflow engine.

### Warning — Code Quality

- [ ] **FX.TYPE.1** — Fix unsafe double type casts in chat routes. `packages/backend/src/routes/chat.ts:367-369` — `project as unknown as Project` and `chatAgent as unknown as Persona` are fragile double casts. Create proper mapping functions or use the correct types directly.
- [ ] **FX.TYPE.2** — Import HandoffNote from shared instead of duplicating. `packages/backend/src/agent/handoff-notes.ts:11` — `HandoffNote` type is duplicated instead of imported from `@agentops/shared`. Remove the local definition and import from shared.
- [ ] **FX.PERF.1** — Fix N+1 query in dependency check. `packages/backend/src/agent/dispatch.ts:56-63` — dependency check runs one query per upstream dependency. Batch into a single query with `IN (...)` clause.

---

## Sprint 28: Scheduling, Templates & Notification Channels

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
