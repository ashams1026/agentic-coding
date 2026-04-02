# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-26 complete and archived. Sprint 27 partial: Outbound Webhooks P1 (OWH.1-6), Inbound Webhooks P1 (IWH.1-3), Data Management P1 partial (DM.1) archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 27: Integration & Maintenance

> Outbound Webhooks, Inbound Webhooks, Data Management.

### Data Management Phase 1 (remaining)

- [x] **DM.2** — Backend: add pre-migration backup hook. In `packages/backend/src/db/migrate.ts`, call `createBackup()` before `runMigrations()`. Log backup path. Skip if no migrations pending. *(completed 2026-04-03 05:00 PDT)*
- [x] **DM.3** — Backend: add backup/restore API endpoints in `packages/backend/src/routes/settings.ts`. `POST /api/settings/backup` (trigger manual backup, return path), `GET /api/settings/backups` (list available backups with date/size), `POST /api/settings/restore` (restore from backup path). Add log truncation endpoint: `POST /api/settings/truncate-logs?olderThanDays=30` (UPDATE executions SET logs='' WHERE completedAt < threshold). *(completed 2026-04-03 05:15 PDT)*
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
