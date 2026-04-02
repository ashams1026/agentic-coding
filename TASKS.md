# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-26 complete and archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 27: Integration & Maintenance

> Outbound Webhooks, Inbound Webhooks, Data Management.
> Proposal docs: `docs/proposals/webhooks/outbound-events.md`, `docs/proposals/webhooks/inbound-triggers.md`, `docs/proposals/data-management/backup-restore.md`, `docs/proposals/data-management/growth-strategy.md`

### Outbound Webhooks Phase 1

- [x] **OWH.1** — Backend: create `packages/backend/src/events/event-bus.ts`. Implement `TypedEventEmitter` class with typed event catalog: `execution.started`, `execution.completed`, `execution.failed`, `work_item.state_changed`. Emit events from existing WebSocket broadcast points (execution-manager.ts, work-items.ts route PATCH). This becomes the canonical event source for webhooks and future notification integrations. *(completed 2026-04-03 02:35 PDT)*
- [x] **OWH.2** — Backend: add webhook schema to `packages/backend/src/db/schema.ts`. Create `webhook_subscriptions` table (id, url, secret, events JSON array, isActive, failureCount, createdAt, updatedAt) and `webhook_deliveries` table (id, subscriptionId, event, payload JSON, status, statusCode, latencyMs, attempt, nextRetryAt, createdAt). Generate migration. *(completed 2026-04-03 02:50 PDT)*
- [x] **OWH.3** — Backend: create `packages/backend/src/events/webhook-delivery.ts`. Implement delivery worker: 2-second polling loop, fetch pending deliveries, HTTP POST with JSON payload + `X-Webhook-Signature` (HMAC-SHA256), exponential backoff retry (5 attempts, 30s→30min), 10s timeout, auto-disable subscription after 10 consecutive failures. Log status/latency/attempt to deliveries table. *(completed 2026-04-03 03:05 PDT)*
- [x] **OWH.4** — Backend: create `packages/backend/src/routes/webhooks.ts`. CRUD endpoints: `GET /api/webhooks` (list subscriptions), `POST /api/webhooks` (create), `PATCH /api/webhooks/:id` (update url/events/active), `DELETE /api/webhooks/:id`. `GET /api/webhooks/:id/deliveries` (delivery log with status/latency). Register in server.ts. *(completed 2026-04-03 03:20 PDT)*
- [review] **OWH.5** — Frontend: create `packages/frontend/src/features/settings/integrations-section.tsx`. Add "Integrations" tab in Settings. Outbound webhooks list with add/edit/delete. Subscription form: URL input, event checkboxes, secret display. Delivery log table (date, event, status, latency, retry count). Active/disabled toggle.
- [ ] **OWH.6** — Backend: wire event bus → webhook delivery. When EventBus emits, query matching active subscriptions, create delivery records, trigger worker. Start delivery worker on server startup.

### Inbound Webhooks Phase 1

- [ ] **IWH.1** — Backend: add `webhook_triggers` table to schema (id, name, secret, personaId, projectId, promptTemplate TEXT, isActive, createdAt). Add `triggerType` (TEXT nullable) and `triggerId` (TEXT nullable) columns to executions table. Generate migration.
- [ ] **IWH.2** — Backend: create `packages/backend/src/routes/webhook-triggers.ts`. Generic receiver: `POST /api/webhooks/trigger/:triggerId` — validate HMAC, extract payload, resolve prompt template (Handlebars-style `{{payload.field}}`), spawn execution with trigger context. CRUD: `GET/POST/PATCH/DELETE /api/webhook-triggers`. Delivery log for inbound. Register in server.ts.
- [ ] **IWH.3** — Frontend: add inbound webhook triggers to `integrations-section.tsx`. Trigger list with add/edit/delete. Form: name, persona selector, project selector, prompt template editor with `{{payload.*}}` autocomplete hint, secret display + copy button.

### Data Management Phase 1

- [ ] **DM.1** — Backend: create `packages/backend/src/db/backup.ts`. Implement `createBackup()` using SQLite `backup()` API (safe for WAL mode). Store in `~/.agentops/backups/` with timestamped filenames. Implement retention: keep 7 daily + 4 weekly, delete older. Add `restoreBackup(path)` function (stop server, copy file, restart).
- [ ] **DM.2** — Backend: add pre-migration backup hook. In `packages/backend/src/db/migrate.ts`, call `createBackup()` before `runMigrations()`. Log backup path. Skip if no migrations pending.
- [ ] **DM.3** — Backend: add backup/restore API endpoints in `packages/backend/src/routes/settings.ts`. `POST /api/settings/backup` (trigger manual backup, return path), `GET /api/settings/backups` (list available backups with date/size), `POST /api/settings/restore` (restore from backup path). Add log truncation endpoint: `POST /api/settings/truncate-logs?olderThanDays=30` (UPDATE executions SET logs='' WHERE completedAt < threshold).
- [ ] **DM.4** — Backend: add per-table storage stats using `dbstat` virtual table. `GET /api/settings/storage-stats` returns `{ tables: [{ name, rowCount, sizeBytes }], totalSizeBytes }`. Fix existing cascade bug: `DELETE /api/settings/executions` should cascade to proposals/comments.
- [ ] **DM.5** — Frontend: create `packages/frontend/src/features/settings/data-management-section.tsx`. Add "Data" tab content in Settings. Backup section: "Create Backup" button, backup list with date/size/restore button. Log truncation: "Truncate old logs" button with day selector. Storage stats: per-table breakdown bar chart or table.

### Testing & Documentation

- [ ] **S27.TEST.1** — Write e2e test plan for Outbound Webhooks: `tests/e2e/plans/outbound-webhooks.md`. Cover: subscription CRUD, event delivery, HMAC signing, retry logic, auto-disable, delivery log.
- [ ] **S27.TEST.2** — Write e2e test plan for Inbound Webhooks + Data Management: `tests/e2e/plans/inbound-webhooks-data-mgmt.md`. Cover: trigger CRUD, prompt template, inbound delivery, backup/restore, log truncation, storage stats.
- [ ] **S27.TEST.3** — Execute Outbound Webhooks e2e tests. Screenshot each case. Record results. File bugs as `FX.*`.
- [ ] **S27.TEST.4** — Execute Inbound Webhooks + Data Management e2e tests. Screenshot each case. Record results. File bugs as `FX.*`.
- [ ] **S27.DOC.1** — Document Sprint 27 APIs. Update `docs/api.md` with: webhook subscription CRUD, delivery log, event catalog, inbound trigger endpoints, backup/restore, storage stats, log truncation.
- [ ] **S27.TEST.5** — Regression checkpoint: re-run ALL existing e2e test plans against current build. Compare against Sprint 26 baseline (40 suites, 0 regressions). File bugs as `FX.REG.*`.

---

> **Future sprints and Tier 3 backlog are defined in `docs/roadmap.md`.** When Sprint 27 is complete, the Decomposer agent should read the roadmap and decompose the next sprint into tasks.
