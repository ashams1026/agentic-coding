# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-27 complete and archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 28: Scheduling, Templates & Notification Channels

> Tier 3 features: Scheduling (cron agent runs), Templates P1 (work item templates), Notification External Channels (webhook channel wrapping outbound infra).
> Proposal docs: `docs/proposals/scheduling/ux-design.md`, `docs/proposals/scheduling/infrastructure.md`, `docs/proposals/templates/design.md`, `docs/proposals/notifications/integrations.md`

### Scheduling

- [x] **SCH.1** — Backend: add `schedules` table to schema (id, name, personaId, projectId, cron expression, promptTemplate, isActive, lastRunAt, nextRunAt, consecutiveFailures, createdAt). Generate migration. *(completed 2026-04-03 07:40 PDT)*
- [x] **SCH.2** — Backend: create `packages/backend/src/scheduling/scheduler.ts`. Implement cron scheduler using `node-cron`. On tick: check for due schedules, spawn execution via `executionManager.runExecution()`, update lastRunAt/nextRunAt. Missed-run catch-up on startup. Auto-disable after 5 consecutive failures. *(completed 2026-04-03 08:00 PDT)*
- [x] **SCH.3** — Backend: create `packages/backend/src/routes/schedules.ts`. CRUD endpoints: `GET /api/schedules`, `POST /api/schedules` (create with cron validation), `PATCH /api/schedules/:id`, `DELETE /api/schedules/:id`. `POST /api/schedules/:id/run-now` (manual trigger). Register in server.ts. Start scheduler on startup. *(completed 2026-04-03 08:20 PDT)*
- [x] **SCH.4** — Frontend: add Schedules UI in Persona Manager or Settings. Schedule list with name, persona, cron (human-readable), next run, status. Add/edit form with cron preset selector (every 30min, hourly, daily, custom) + live preview of next runs. Active/disabled toggle. *(completed 2026-04-03 08:45 PDT)*

### Templates Phase 1

- [x] **TPL.1** — Backend: add `templates` table to schema (id, name, type work_item/persona, content JSON, isBuiltIn boolean, createdAt). Seed 3 built-in work item templates (Bug Report, Feature Request, Spike). Generate migration. *(completed 2026-04-03 09:00 PDT)*
- [x] **TPL.2** — Backend: create `packages/backend/src/routes/templates.ts`. CRUD: `GET /api/templates?type=work_item`, `POST /api/templates`, `PATCH /api/templates/:id`, `DELETE /api/templates/:id` (guard built-in). `POST /api/templates/:id/apply` (create work item from template). Register in server.ts. *(completed 2026-04-03 09:15 PDT)*
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
