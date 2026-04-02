# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-03 05:40 PDT — DM.5: Frontend data management section

**Done:** Created `packages/frontend/src/features/settings/data-management-section.tsx`. Three sections: (1) Database Backups — "Create Backup" button with spinner, backup list (filename, date, size MB, restore button with confirm dialog). (2) Log Truncation — day selector dropdown (7/14/30/60/90), "Truncate Old Logs" button with confirm dialog + truncated count toast. (3) Storage — HardDrive icon, total size badge, per-table row count table with mono font. Wired into existing DataSection in appearance-section.tsx above RecentlyDeleted.
**Files:** `packages/frontend/src/features/settings/data-management-section.tsx` (new), `packages/frontend/src/features/settings/appearance-section.tsx`
**Notes:** Data Management P1 (DM.1-5) complete.

---

## 2026-04-03 05:30 PDT — Review: DM.4 (approved)

**Reviewed:** Storage stats + cascade fix.
- GET /api/settings/storage-stats: per-table row counts + total DB size ✓
- Cascade fix: proposals deleted before executions via inArray ✓
- Filters out internal/FTS tables ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 05:25 PDT — DM.4: Storage stats + cascade fix

**Done:** Added `GET /api/settings/storage-stats` to `settings.ts`. Queries `sqlite_master` for table names (excluding internal/FTS tables), counts rows per table, calculates total DB size via `page_size * page_count`. Returns `{ tables: [{ name, rowCount }], totalSizeBytes, totalSizeMb }`. Fixed cascade bug: `DELETE /api/settings/executions` now queries execution IDs first, deletes linked proposals via `inArray`, then deletes executions. Added proposals import.
**Files:** `packages/backend/src/routes/settings.ts`

---

## 2026-04-03 05:15 PDT — Review: DM.3 (approved)

**Reviewed:** Backup/restore API + log truncation endpoints.
- POST backup, GET backups (with sizeMb), POST restore, POST truncate-logs ✓
- Restore: error handling + restart instruction ✓
- Truncation: completed_at guard, logs != '' guard, returns count ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 05:10 PDT — DM.3: Backup/restore API + log truncation endpoints

**Done:** Added 4 endpoints to `settings.ts`: `POST /api/settings/backup` (triggers `createBackup()`, returns path), `GET /api/settings/backups` (lists with filename/path/sizeBytes/sizeMb/createdAt), `POST /api/settings/restore` (calls `restoreBackup(path)` with error handling), `POST /api/settings/truncate-logs?olderThanDays=30` (UPDATE executions SET logs='' WHERE completed_at < threshold, returns truncated count). Log truncation uses raw `sqlite.prepare()` for direct UPDATE (preserves all metadata, only clears logs text).
**Files:** `packages/backend/src/routes/settings.ts`

---

## 2026-04-03 05:00 PDT — Review: DM.2 (approved)

**Reviewed:** Pre-migration backup hook.
- createBackup() called before migrate() ✓
- Skip on first startup (no DB) ✓
- Error handling: log + continue ✓
- Replaced ad-hoc .bak with centralized system ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 04:58 PDT — DM.2: Pre-migration backup hook

**Done:** Replaced the existing ad-hoc pre-migration backup in `migrate.ts` with centralized `createBackup()` from `backup.ts`. Removed old `.pre-migration-{timestamp}.bak` pattern + `pruneOldBackups()` function — now uses `~/.agentops/backups/` with 7d+4w retention from DM.1. Simplified from 52 lines to 19 lines. Still skips backup if DB doesn't exist (first startup). Error logging continues migration even if backup fails.
**Files:** `packages/backend/src/db/migrate.ts`

---

## 2026-04-03 04:50 PDT — Review: DM.1 (approved)

**Reviewed:** SQLite backup with retention.
- createBackup via sqlite.backup() (WAL-safe) ✓
- ~/.agentops/backups/ with timestamped filenames ✓
- Retention: 7 daily + 4 weekly cleanup ✓
- restoreBackup with safety pre-copy ✓
- listBackups with metadata ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 04:45 PDT — DM.1: SQLite backup with retention

**Done:** Created `packages/backend/src/db/backup.ts`. `createBackup()`: uses `sqlite.backup()` API (safe for WAL mode), stores in `~/.agentops/backups/` with `woof-backup-YYYY-MM-DDTHH-MM-SS.db` filenames. `listBackups()`: reads backup dir, returns sorted list with filename/path/sizeBytes/createdAt. `restoreBackup(path)`: creates safety backup first, then copies backup over DB_PATH. Retention `cleanupOldBackups()`: categorizes by age (daily <7d, weekly <28d, older), keeps MAX_DAILY=7 + MAX_WEEKLY=4, deletes rest. Runs after each successful backup.
**Files:** `packages/backend/src/db/backup.ts` (new)

---

## 2026-04-03 04:35 PDT — Review: IWH.3 (approved)

**Reviewed:** Frontend inbound triggers in integrations section.
- Trigger list: name, persona, template preview, active badge, delete ✓
- Add form: name, persona ID, template textarea, secret + URL display ✓
- Separated from outbound section with divider ✓
- Build passes ✓
- **Verdict: approved.** Inbound Webhooks P1 (IWH.1-3) complete.

---

## 2026-04-03 04:30 PDT — IWH.3: Frontend inbound triggers in integrations section

**Done:** Added `InboundTriggersSection` component to `integrations-section.tsx`. Trigger list with name, persona name, project scope, template preview, active badge, delete button. Add form: name input, persona ID input, prompt template textarea with `{{payload.field}}` hint, secret display (show/hide/copy), trigger URL display + copy. Separated from outbound webhooks with border-top divider. Empty state for no triggers.
**Files:** `packages/frontend/src/features/settings/integrations-section.tsx`
**Notes:** Persona selector uses text input for persona ID (not dropdown) — acceptable for Phase 1. Full persona picker dropdown would need usePersonas() hook integration.

---

## 2026-04-03 04:20 PDT — Review: IWH.2 (approved)

**Reviewed:** Webhook triggers route with receiver + CRUD.
- Generic receiver: HMAC validation (timingSafeEqual), template resolution, execution spawn ✓
- Template: nested dot-path `{{payload.field}}` with undefined fallback ✓
- CRUD: list (persona join), create (auto-secret, triggerUrl), update, delete ✓
- 401/403/404 error handling ✓
- Registered in server.ts ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 04:15 PDT — IWH.2: Webhook triggers route with receiver + CRUD

**Done:** Created `packages/backend/src/routes/webhook-triggers.ts`. Generic receiver `POST /api/webhooks/trigger/:triggerId`: validates HMAC via `timingSafeEqual`, resolves Handlebars-style `{{payload.field}}` template with nested dot-path support, spawns standalone execution. CRUD: `GET /api/webhook-triggers` (list with persona name join), `POST` (create with auto `whtsec_` secret + `wht-` ID, returns triggerUrl), `PATCH` (update name/persona/project/template/active), `DELETE` (404 guard). Registered in server.ts.
**Files:** `packages/backend/src/routes/webhook-triggers.ts` (new), `packages/backend/src/server.ts`

---

## 2026-04-03 04:05 PDT — Review: IWH.1 (approved)

**Reviewed:** Webhook triggers schema + execution columns.
- webhook_triggers: 8 columns with persona FK (NOT NULL) + project FK (nullable) ✓
- triggerType + triggerId on executions (both nullable) ✓
- Migration 0017: CREATE TABLE + 2 ALTER TABLE ADD ✓
- Relations defined ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 04:00 PDT — IWH.1: Webhook triggers schema + execution columns

**Done:** Added `webhook_triggers` table to schema.ts: id, name, secret, personaId (FK), projectId (FK nullable), promptTemplate, isActive, createdAt. Added relations to persona + project. Added `triggerType` (TEXT nullable — manual/webhook/schedule) and `triggerId` (TEXT nullable) columns to executions table. Generated migration `0017_mute_tenebrous.sql` (CREATE TABLE + 2 ALTER TABLE ADD).
**Files:** `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0017_mute_tenebrous.sql`

---

## 2026-04-03 03:50 PDT — Review: OWH.6 (approved)

**Reviewed:** Wire event bus → webhook delivery + startup.
- webhook-bridge: onAny listener, queries active subs, filters by event type, creates deliveries ✓
- Startup: initWebhookBridge + startWebhookWorker ✓
- Shutdown: stopWebhookWorker before DB close ✓
- Error handling, early return on no matches ✓
- Build passes ✓
- **Verdict: approved.** Outbound Webhooks P1 (OWH.1-6) complete.

---

## 2026-04-03 03:45 PDT — OWH.6: Wire event bus → webhook delivery + startup

**Done:** Created `packages/backend/src/events/webhook-bridge.ts` with `initWebhookBridge()`. Subscribes to all events via `eventBus.onAny()`. On each event, queries active webhook subscriptions, filters by matching event type in events JSON array, creates delivery records (status=pending, attempt=0) for each match. Wired into `start.ts`: `initWebhookBridge()` + `startWebhookWorker()` after lifecycle cleanup. Added `stopWebhookWorker()` to graceful shutdown before DB close. Outbound Webhooks P1 (OWH.1-6) complete.
**Files:** `packages/backend/src/events/webhook-bridge.ts` (new), `packages/backend/src/start.ts`

---

## 2026-04-03 03:35 PDT — Review: OWH.5 (approved)

**Reviewed:** Frontend integrations section.
- Integrations tab with Webhook icon in Settings ✓
- Add form: URL + event pills + secret show/hide/copy ✓
- Webhook list: toggle, events, failures, delivery log, delete ✓
- Delivery log table: 5 columns with status icons ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 03:30 PDT — OWH.5: Frontend integrations section in Settings

**Done:** Created `packages/frontend/src/features/settings/integrations-section.tsx`. Add Webhook form with URL input + event checkbox pills + secret display (show/hide/copy). Webhook list with toggle (custom switch button), URL, event badges, failure count badge, delivery log button, delete. Delivery log table: date, event, status (delivered/failed/pending with icons), latency, attempt. Added "Integrations" with Webhook icon to settings-layout.tsx sections + wired component. Uses direct fetch() calls to /api/webhooks endpoints.
**Files:** `packages/frontend/src/features/settings/integrations-section.tsx` (new), `packages/frontend/src/features/settings/settings-layout.tsx`

---

## 2026-04-03 03:20 PDT — Review: OWH.4 (approved)

**Reviewed:** Webhook CRUD endpoints.
- 5 endpoints: list, create (auto-secret), update, delete (cascade), delivery log ✓
- Secret only returned on create, not in list ✓
- Re-enable resets failureCount ✓
- 404 handling, 204 on delete ✓
- Registered in server.ts ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 03:15 PDT — OWH.4: Webhook CRUD endpoints

**Done:** Created `packages/backend/src/routes/webhooks.ts` with 5 endpoints: `GET /api/webhooks` (list subscriptions desc by createdAt), `POST /api/webhooks` (create with auto-generated `whsec_` secret + `wh-` ID), `PATCH /api/webhooks/:id` (update url/events/isActive, resets failureCount on re-enable), `DELETE /api/webhooks/:id` (cascade deletes deliveries via FK), `GET /api/webhooks/:id/deliveries` (delivery log desc by createdAt, limit 50-200). POST returns secret in response for user to copy. Registered in server.ts.
**Files:** `packages/backend/src/routes/webhooks.ts` (new), `packages/backend/src/server.ts`

---

## 2026-04-03 03:05 PDT — Review: OWH.3 (approved)

**Reviewed:** Webhook delivery worker.
- 2s polling, 10s HTTP timeout, HMAC-SHA256 signing ✓
- 5 attempts, exponential backoff (30s/2m/8m/30m) ✓
- Auto-disable after 10 consecutive failures ✓
- Success resets failureCount, failure increments + schedules retry ✓
- Poll: max 10 pending, retry-aware query ✓
- start/stop lifecycle functions ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 03:00 PDT — OWH.3: Webhook delivery worker

**Done:** Created `packages/backend/src/events/webhook-delivery.ts`. `deliverWebhook()`: fetches delivery + subscription, sends HTTP POST with JSON payload + `X-Webhook-Signature: sha256=<hmac>` header, 10s timeout via AbortController. On success: marks delivered, resets subscription failureCount. On failure: `handleFailure()` with exponential backoff (30s/2m/8m/30m), max 5 attempts. Auto-disables subscription after 10 consecutive failures. `pollPendingDeliveries()`: queries pending deliveries where nextRetryAt <= now or attempt=0, processes up to 10 per poll. `startWebhookWorker()`/`stopWebhookWorker()` with 2s setInterval. Custom headers: X-Webhook-Event, X-Webhook-Delivery.
**Files:** `packages/backend/src/events/webhook-delivery.ts` (new)

---

## 2026-04-03 02:50 PDT — Review: OWH.2 (approved)

**Reviewed:** Webhook subscriptions + deliveries schema.
- webhook_subscriptions: 8 columns with events JSON, isActive boolean ✓
- webhook_deliveries: 10 columns with cascade FK, status/attempt/nextRetryAt ✓
- Relations defined ✓
- Migration 0016 ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 02:45 PDT — OWH.2: Webhook subscriptions + deliveries schema

**Done:** Added 2 tables to schema.ts: `webhook_subscriptions` (id, url, secret, events JSON array, isActive boolean, failureCount, timestamps) and `webhook_deliveries` (id, subscriptionId FK with cascade delete, event, payload JSON, status pending/delivered/failed, statusCode, latencyMs, attempt, nextRetryAt, createdAt). Added Drizzle relations (subscription → deliveries). Generated migration `0016_natural_dragon_lord.sql` (2 CREATE TABLE).
**Files:** `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0016_natural_dragon_lord.sql`

---

## 2026-04-03 02:35 PDT — Review: OWH.1 (approved)

**Reviewed:** TypedEventBus + event emissions.
- 4 typed event interfaces + AppEvent union ✓
- Singleton eventBus with per-type + wildcard listeners ✓
- 4 emission points: started/completed/failed in execution-manager, state_changed in work-items ✓
- Debug logging, setMaxListeners(50), off() for cleanup ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 02:30 PDT — OWH.1: TypedEventBus + event emissions

**Done:** Created `packages/backend/src/events/event-bus.ts` with `TypedEventBus` class wrapping Node.js EventEmitter. 4 typed event interfaces: `ExecutionStartedEvent`, `ExecutionCompletedEvent`, `ExecutionFailedEvent`, `WorkItemStateChangedEvent`. Union type `AppEvent` + `AppEventType`. Singleton `eventBus` export. Supports per-type and wildcard (*) listeners. Wired emissions into: execution-manager.ts (started at spawn, completed at success, failed at error handler) and work-items.ts (state_changed on PATCH currentState). Added projectId to existing query in work-items.ts validation block.
**Files:** `packages/backend/src/events/event-bus.ts` (new), `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/routes/work-items.ts`

---

