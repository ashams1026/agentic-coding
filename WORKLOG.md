# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-01 20:58 PDT — Review: FND.WIL.2 (approved)

**Reviewed:** Soft delete and 409 guard for work items.
- 409 guard at :239-257: checks `executions.status = "running"` for all descendant IDs via `inArray` ✓
- Cascade-delete at :260-264: hard-deletes edges (both directions), comments, proposals, memories — prevents orphans ✓
- Soft delete at :267-271: `update().set({ deletedAt: now })` on all IDs ✓
- Default GET filters at :43-46: `isNull(deletedAt)` + `isNull(archivedAt)` always applied ✓
- GET by ID intentionally unfiltered — needed for restore (FND.WIL.3) ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 20:57 PDT — FND.WIL.2: Soft delete and 409 guard for work items

**Done:** Replaced hard-delete in `DELETE /api/work-items/:id` with soft delete. Added 409 guard that blocks deletion when any execution is `"running"` for the item or its descendants. Cascade-deletes `work_item_edges` (both directions), `comments`, `proposals`, `project_memories` for all descendant IDs before setting `deleted_at = now()`. Added `isNull(workItems.deletedAt)` and `isNull(workItems.archivedAt)` default filters to `GET /api/work-items` so deleted/archived items are hidden by default.
**Files:** `packages/backend/src/routes/work-items.ts`

---

## 2026-04-01 20:55 PDT — Review: FND.WIL.1 (approved)

**Reviewed:** Schema additions for work item lifecycle (archived_at, deleted_at).
- Schema columns in schema.ts:46-47: `integer("archived_at"/"deleted_at", { mode: "timestamp_ms" })` — nullable, correct type ✓
- Entity type in entities.ts:73-74: `archivedAt/deletedAt: string | null` — matches ✓
- Migration 0008: two clean ALTER TABLE ADD statements ✓
- Dashboard.ts:155-156: explicit WorkItem construction includes new fields with toIso() conversion ✓
- `serializeWorkItem()` uses spread — new columns flow through automatically ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 20:53 PDT — FND.WIL.1: Add archived_at and deleted_at columns to work_items

**Done:** Added `archivedAt` (integer, timestamp_ms) and `deletedAt` (integer, timestamp_ms) nullable columns to `workItems` table in schema.ts. Added matching `archivedAt: string | null` and `deletedAt: string | null` fields to `WorkItem` interface in entities.ts. Generated Drizzle migration `0008_glamorous_young_avengers.sql`. Fixed type error in dashboard.ts where explicit `WorkItem` construction needed the new fields.
**Files:** `packages/backend/src/db/schema.ts`, `packages/shared/src/entities.ts`, `packages/backend/drizzle/0008_glamorous_young_avengers.sql` (new), `packages/backend/drizzle/meta/*`, `packages/backend/src/routes/dashboard.ts`
**Notes:** `serializeWorkItem()` in work-items.ts uses `...row` spread so new columns flow through automatically. `WorkItemRow` in core package not updated (separate concern for FND.WIL.2+).

---

## 2026-04-01 20:50 PDT — Review: FND.ERR.7 (approved)

**Reviewed:** Pre-migration SQLite backup in migrate.ts.
- `sqlite.backup()` creates `${DB_PATH}.pre-migration-${timestamp}.bak` before `migrate()` — matches spec ✓
- `pruneOldBackups()` keeps only 3 most recent, runs after migration (not inside backup try/catch) — correct failure semantics ✓
- `existsSync(DB_PATH)` guard skips backup on first startup ✓
- `start.ts` awaits the now-async `runMigrations()`, CLI entry uses `.then()` ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 20:49 PDT — FND.ERR.7: Pre-migration SQLite backup

**Done:** Made `runMigrations()` async and added a pre-migration backup step using `sqlite.backup()`. Creates `${DB_PATH}.pre-migration-${timestamp}.bak` before running Drizzle migrations. After migration succeeds, prunes old backups keeping only the 3 most recent. Skips backup on first startup (DB doesn't exist yet). Updated `start.ts` to `await runMigrations()`.
**Files:** `packages/backend/src/db/migrate.ts`, `packages/backend/src/start.ts`

---

## 2026-04-01 20:44 PDT — Review: FND.ERR.6 (approved)

**Reviewed:** Interrupted execution status for orphan recovery.
- `ExecutionStatus` in entities.ts:20 now includes `"interrupted"` — correct file (task spec said types.ts but type lives in entities.ts) ✓
- `recoverOrphanedState()` in start.ts:74-89: `status: "interrupted"`, `error: { category: "interrupted", message: "Server restarted during execution" }`, keeps `outcome: "failure"` and `completedAt` — all correct ✓
- WHERE clause unchanged (still finds `"running"` or `"pending"` orphans) ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 20:43 PDT — FND.ERR.6: Add interrupted execution status for orphan recovery

**Done:** Added `"interrupted"` to `ExecutionStatus` union type in `packages/shared/src/entities.ts`. Updated `recoverOrphanedState()` in `start.ts` to set `status: "interrupted"` (instead of `"failed"`), with structured `error: { category: "interrupted", message: "Server restarted during execution" }`. Existing frontend code that checks `"completed" || "failed"` is unaffected — `"interrupted"` is a distinct terminal state.
**Files:** `packages/shared/src/entities.ts`, `packages/backend/src/start.ts`

---

## 2026-04-01 20:42 PDT — Review: FND.ERR.5 (approved)

**Reviewed:** Structured error JSON column on executions.
- Schema column at schema.ts:159: `text("error", { mode: "json" }).$type<{ category, message, details? } | null>()` — matches spec, nullable for existing rows ✓
- Migration `0007_purple_songbird.sql`: `ALTER TABLE executions ADD error text` + chat_sessions FK drift fix (data-preserving) ✓
- Catch block at execution-manager.ts:682-696: classifies `sdk_error`/`configuration_error`/`unknown`, sets `error: { category, message }` ✓
- Work item not found path at :361 also sets structured error — both failure paths covered ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 20:41 PDT — FND.ERR.5: Structured error JSON column on executions

**Done:** Added `error` JSON column to `executions` table in schema.ts (type: `{ category: string; message: string; details?: Record<string, unknown> } | null`). Generated Drizzle migration `0007_purple_songbird.sql`. Updated catch block in execution-manager.ts to classify errors into `sdk_error`, `configuration_error`, or `unknown` and set the `error` column. Also updated the "work item not found" failure path to use `configuration_error` category.
**Files:** `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0007_purple_songbird.sql` (new), `packages/backend/drizzle/meta/*`, `packages/backend/src/agent/execution-manager.ts`
**Notes:** Migration also reconciles a chat_sessions FK drift (onDelete cascade) — safe, data-preserving recreation.

---

## 2026-04-01 20:38 PDT — Review: FND.ERR.4 (approved)

**Reviewed:** WS connection state indicator in status bar and Agent Monitor.
- `ws-client.ts`: `_status`/`statusListeners`/`setStatus()` with deduplication (:124-128); status set in `onopen` (:66), `onclose` (:87/:90), `disconnect()` (:110) — all transitions correct
- `use-ws-status.ts`: `useSyncExternalStore(onWsStatusChange, getWsStatus)` — correct React external store pattern, stable subscribe reference
- `status-bar.tsx`: tri-state dot (green/amber-pulse/red) at :77-93; removed unused `isHealthy`, kept `useHealth` for `executorMode` ✓
- `terminal-renderer.tsx`: amber banner at :609-617 when `wsStatus !== "connected"` — matches existing progress bar styling
- No memory leaks: unsubscribe returned from `onStatusChange`, `useSyncExternalStore` handles cleanup
- Build passes; visual check confirmed by worker
- **Verdict: approved.**

---

## 2026-04-01 20:36 PDT — FND.ERR.4: WS connection state indicator

**Done:** Added tri-state WS connection indicator. Added `_status`/`statusListeners`/`setStatus()` to `RealWsClient` — tracks `connected`/`reconnecting`/`disconnected` via `onopen`/`onclose`/`disconnect()`. Exposed via `ws.ts` facade (`getWsStatus`, `onWsStatusChange`). Created `useWsStatus()` hook using `useSyncExternalStore`. Updated status bar: replaced static Healthy/Unhealthy with green dot (connected), amber pulsing dot (reconnecting), red dot (disconnected). Added amber "Connection lost — reconnecting" banner in `TerminalRenderer` when WS is not connected. Visual check: status bar shows "Disconnected" correctly; Agent Monitor layout clean.
**Files:** `packages/frontend/src/api/ws-client.ts`, `packages/frontend/src/api/ws.ts`, `packages/frontend/src/hooks/use-ws-status.ts` (new), `packages/frontend/src/hooks/index.ts`, `packages/frontend/src/components/status-bar.tsx`, `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`

---

## 2026-04-01 20:33 PDT — Review: FND.ERR.3 (approved)

**Reviewed:** React error boundaries at app and page level.
- `error-boundary.tsx`: two class components with `componentDidCatch` + `getDerivedStateFromError` — correct React pattern
- `AppErrorBoundary`: wraps full tree (QueryClientProvider + RouterProvider) in app.tsx:9-13; fallback: "Something went wrong." + [Reload] ✓
- `PageErrorBoundary`: wraps all 7 pages individually in router.tsx:16-22; fallback: "Page error." + [Go to Dashboard] (raw `<a>` — correct for error state) + [Retry] (resets error state) ✓
- Uses shadcn Button, Tailwind dark-mode classes (`bg-background`, `text-foreground`) — follows conventions
- Build passes; visual check by worker confirms dashboard renders normally
- **Verdict: approved.**

---

## 2026-04-01 20:31 PDT — FND.ERR.3: Add React error boundaries at app and page level

**Done:** Created `error-boundary.tsx` with two class components: `AppErrorBoundary` (wraps full tree in app.tsx, fallback: "Something went wrong. [Reload]") and `PageErrorBoundary` (wraps each page in router.tsx, fallback: "Page error. [Go to Dashboard] [Retry]"). Both use `componentDidCatch` for error logging. AppErrorBoundary wraps QueryClientProvider+RouterProvider. Each of the 7 page routes wrapped individually with PageErrorBoundary. Visual check confirms dashboard renders normally with boundaries in place.
**Files:** `packages/frontend/src/components/error-boundary.tsx` (new), `packages/frontend/src/app.tsx`, `packages/frontend/src/router.tsx`

---

## 2026-04-01 20:28 PDT — Review: FND.ERR.2 (approved)

**Reviewed:** WS reconnect exponential backoff + jitter in ws-client.ts.
- `reconnectAttempt` counter at :45, reset in `onopen` at :61, incremented after delay computation at :143
- Formula `Math.min(1000 * 2^attempt, 30_000) + 20% jitter` at :140-142 — correct exponential curve
- Timing verified: attempt 1 ≥2s, attempt 3 ≥8s, cap at 30s — matches acceptance criteria
- `disconnect()` correctly clears timer; counter resets on next successful open
- Build passes cleanly
- **Verdict: approved.**

---

## 2026-04-01 20:27 PDT — FND.ERR.2: WS reconnect exponential backoff + jitter

**Done:** Replaced fixed 3s WS reconnect with exponential backoff + jitter. Added `reconnectAttempt` counter, reset on successful connection in `onopen`. Formula: `Math.min(1000 * 2^attempt, 30_000) + 20% jitter`. Delays: 1s → 2s → 4s → 8s → 16s → 30s cap.
**Files:** `packages/frontend/src/api/ws-client.ts`

---

## 2026-04-01 20:26 PDT — Review: FND.ERR.1 (approved)

**Reviewed:** busy_timeout and synchronous PRAGMAs added to SQLite connection.
- Lines 31-32 in connection.ts: `busy_timeout = 5000` and `synchronous = NORMAL` added after existing WAL/FK pragmas — correct position, correct syntax
- No extraneous changes; follows existing pragma pattern exactly
- Build passes cleanly (tsc + vite)
- **Verdict: approved.**

---

## 2026-04-01 20:24 PDT — FND.ERR.1: Add busy_timeout and synchronous PRAGMAs

**Done:** Added `busy_timeout = 5000` and `synchronous = NORMAL` PRAGMAs to SQLite connection after existing WAL/FK pragmas. These improve reliability under concurrent access (5s wait before SQLITE_BUSY) and balance durability with performance (NORMAL sync is safe with WAL mode).
**Files:** `packages/backend/src/db/connection.ts`

---

## 2026-04-01 21:00 PDT — Review: FX.UX.PERSONA.4 (approved)

**Reviewed:** TestRunPanel wired into Persona Manager detail panel.
- Import added at persona-detail-panel.tsx:37, component placed at bottom of read-only view :710-714
- Props correctly match interface: `personaName: string` and `model: PersonaModel` (test-run-panel.tsx:59-62)
- Separator + section wrapping follows the existing pattern used by all other sections in the panel
- Build passes cleanly (tsc + vite, no errors)
- Visual check on two personas (Engineer, Code Reviewer): collapsible renders correctly, expands to show prompt input + test button + terminal output, no layout issues
- **Verdict: approved.**

---

## 2026-04-01 20:50 PDT — FX.UX.PERSONA.4: Wire TestRunPanel into Persona Manager UI

**Done:** Added TestRunPanel to the read-only view of PersonaDetailPanel. Imported TestRunPanel component and added it as a collapsible section at the bottom of the read-only mode, after the Tools/Skills/Subagents sections. Passes `persona.name` and `persona.model` as props. Visual check confirmed: collapsible trigger renders correctly, expands to show prompt input + test button + terminal output area, no layout issues.
**Files:** `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`

---

## 2026-04-01 20:40 PDT — Review: RES.TOKENS.DASHBOARD (approved)

**Reviewed:** Aggregated token usage dashboard UX research doc.
- All 6 areas covered: dashboard location (tab within Analytics at /analytics?tab=usage, avoids 8th sidebar item — sidebar.tsx:38-46 confirmed 7 items), key views (5 visualizations with wireframes: usage over time dual-axis LineChart, model PieChart, persona/project horizontal BarCharts, top N sortable Table), time range controls (shared with analytics page, URL params, comparison mode), summary cards (4 cards with delta arrows, K/M formatting), real-time vs batch (on-the-fly SQL aggregation — 10K rows in <10ms; missing startedAt index identified; 6 API endpoints proposed), export (server-side CSV streaming, JSON Phase 2)
- Source code claims verified: sidebar 7 nav items :38-46, dashboard 4 stat cards :68-97 + 3 widgets :102-105, schema.ts executions table :142-159 (no indexes — gap confirmed), costUsd cents :149, dashboard.ts loads all executions in memory :35, RES.ANALYTICS.UX Section 9 forward reference :401, agent-history.tsx StatsBar :138-177, cost-summary.tsx AreaChart, costs-section.tsx BarChart
- All 9 cross-reference files exist (4 proposals + 5 source files)
- Data dependency matrix correctly separates Phase 1 (existing columns) from Phase 1.5 (new columns from RES.TOKENS.TRACKING)
- **Verdict: approved.**

---

## 2026-04-01 20:30 PDT — RES.TOKENS.DASHBOARD: Research aggregated token usage dashboard UX

**Done:** Researched aggregated token usage dashboard UX. Doc covers all 6 investigation areas: (1) dashboard location — recommended Tab within Analytics page (`/analytics?tab=usage`) over separate page, shares time range controls and avoids 8th sidebar nav item; relationship to RES.ANALYTICS.UX forward reference confirmed. (2) key views — 5 visualizations: usage over time (dual-axis LineChart, tokens + cost), breakdown by model (PieChart with cost/tokens toggle), breakdown by persona (horizontal BarChart with 3-metric toggle), breakdown by project (same pattern, JOIN via workItems), top N most expensive executions (sortable/paginated Table). (3) time range controls — shared with analytics page (24h/7d/30d/90d/custom), URL query params for shareability, comparison mode with delta arrows. (4) summary cards — 4 cards: total cost, total tokens, avg cost/exec, execution count; delta calculation vs prior period; K/M token formatting. (5) real-time vs batch — recommended on-the-fly SQL aggregation, no pre-computed tables; SQLite handles 10K rows in <10ms; identified missing index on startedAt; proposed 6 new API endpoints using SQL-level aggregation (improvement over current in-memory filter pattern at dashboard.ts:28-117). (6) export — server-side CSV streaming with Content-Disposition, JSON export Phase 2. Also: component architecture tree, responsive breakpoints, data dependency matrix (Phase 1 vs Phase 1.5), graceful degradation for missing columns, 9 cross-references, 6 design decisions.
**Files:** `docs/proposals/token-usage/dashboard-ux.md` (new)

---

## 2026-04-01 20:15 PDT — Review: RES.TOKENS.TRACKING (approved)

**Reviewed:** Per-execution token usage collection and storage research doc.
- All 5 areas covered: what data to capture (SDK result fields at claude-executor.ts:174-191, progress events at :153-163, recommended P0 fields), storage schema (additional columns on executions over new table, unit consistency fix cents vs USD), collection points (6 query() sites audited — executor:556 and chat:352 capture cost, memory:184/:348 and executions:238 do not), per-turn granularity (execution-total for Phase 1, per-turn deferred), existing data audit (6 captured, 5 gaps)
- Source code claims verified: total_cost_usd at :180, duration_ms at :181, totalTokens at :160, toolUses at :161, Math.round(finalCostUsd*100) at execution-manager.ts:520, metadata.costUsd=msg.total_cost_usd at chat.ts:418 (unit inconsistency confirmed), query() at memory.ts:184/:348 and executions.ts:238 (no cost capture — gap confirmed), schema.ts:149 costUsd as cents
- All cross-reference files exist (4 proposal docs + 3 source files)
- Unit inconsistency finding is a real bug — executions store cents, chat stores USD
- **Verdict: approved.**

---

## 2026-04-01 20:05 PDT — RES.TOKENS.TRACKING: Research per-execution token usage collection and storage

**Done:** Researched token usage collection and storage. Doc covers all 5 investigation areas: (1) what data to capture — audited SDK result message (total_cost_usd, duration_ms at claude-executor.ts:174-191; NO per-category token breakdown in result), progress events (total_tokens at :155-163 broadcast but not persisted); recommended P0 fields: costUsd (fix unit), totalTokens, model, toolUses. (2) storage schema — recommended additional columns on executions table (model, total_tokens, tool_uses) over separate table; unit consistency fix (executions store cents :520, chat stores USD :418 — standardize on cents). (3) collection points — audited 6 query() call sites: claude-executor :556 and chat :352 capture cost, memory.ts :184/:348 and executions.ts :238 do NOT (gap); proposed persist lastTotalTokens from progress events, track background operation costs. (4) per-turn granularity — execution-total sufficient for Phase 1 dashboards; per-turn deferred (SDK doesn't expose per-message hooks); per-API-call even more complex. (5) relationship to existing data — 6 data points already captured (cost, duration, streaming tokens), 5 gaps identified (no token columns, no model on executions, invisible background costs, chat costs in JSON not queryable, no direct projectId on executions). 3-phase implementation plan, 8 cross-references, 6 design decisions.
**Files:** `docs/proposals/token-usage/tracking.md` (new)

---

## 2026-04-01 19:40 PDT — Review: RES.DATA.GROWTH (approved)

**Reviewed:** Data growth and retention strategy research doc.
- All 5 areas covered: what grows fast (8-table storage audit, logs at execution-manager.ts:489 are primary driver ~80%), retention policies (4-tier hot/warm/cold/ephemeral, truncate logs insight, per-project settings, cascade rules), SQLite scaling (6-metric comparison all within limits, PostgreSQL path estimated 2-3 days), cleanup tools (Settings wireframe, dbstat for per-table sizes, VACUUM as manual action), monitoring (4 health metrics, dev-mode slow query logging at 50ms)
- Source code claims verified: `logs += chunk + "\n"` at :489, FATAL at :680. db-stats at settings.ts:116-135 (page_count :118, page_size :119). Execution cleanup at :137-142 (lt cutoff, no cascade — confirmed gap). onDelete cascade on chat_messages :262 and chatSessions :244. WAL at connection.ts:29.
- All 5 cross-reference files exist (backup-restore.md, system-resilience.md, metrics.md, search/design.md, hosted-frontend.md)
- "Truncate logs, don't delete executions" is a valuable non-obvious insight — saves 95% storage while preserving all analytics metrics
- **Verdict: approved.**

---

## 2026-04-01 19:30 PDT — RES.DATA.GROWTH: Research data growth and retention strategy

**Done:** Researched data growth and retention strategy. Doc covers all 5 investigation areas: (1) what grows fast — 8-table storage audit with per-column analysis; execution logs are primary growth driver (~80% of DB, 100-500KB per real execution, accumulated line-by-line at execution-manager.ts:489); projected 1.5-3.5GB after 1 year at 20 executions/day. (2) retention policies — 4 retention tiers (hot/warm/cold/ephemeral); key insight: truncate logs don't delete executions (save 95% storage, keep all metrics); per-project retention settings in projects.settings; cascade rules for cleanup (keep user comments, delete system comments). (3) SQLite scaling — 6-metric comparison (DB size, row count, query perf, writes, memory) all well within SQLite limits; PostgreSQL migration path estimated at 2-3 days via Drizzle ORM but not needed yet; WAL performance analysis under concurrent load. (4) cleanup tools — Settings > Data Management wireframe with storage breakdown visualization (dbstat virtual table for per-table sizes), retention config dropdowns, manual cleanup buttons, VACUUM with size estimation; fixed existing cleanup cascade gap. (5) monitoring — 4 health metrics with warning/critical thresholds, DB size in status bar, slow query logging (dev mode only, 50ms threshold). 3-phase implementation plan, 7 cross-references, 6 design decisions.
**Files:** `docs/proposals/data-management/growth-strategy.md` (new)

---

## 2026-04-01 19:10 PDT — Review: RES.DATA.BACKUP (approved)

**Reviewed:** Backup, restore, and data export research doc.
- All 5 areas covered: backup strategy (SQLite backup() API, 4 triggers, ~/.agentops/backups/ with 7+4 retention), restore flow (6-step process with pre-restore safety backup, schema migration, integrity check), export/import (audited existing partial export at settings.ts:148-160, proposed full ProjectExport JSON with 3 import strategies), data portability (6-item inventory, migration guide, cross-machine sync explicitly unsupported), disaster recovery (6 scenarios with recovery times, external backup recommendations)
- Source code claims verified: connection.ts DB paths (AGENTOPS_DB_PATH :11, DATABASE_URL :12, ~/.agentops/data :17, agentops-dev.db :23, WAL :29). settings.ts export :148-160 (projects/personas/personaAssignments), import :229-236 with onConflictDoNothing :254/:273/:285, db-stats :116-117, execution cleanup :137
- All 4 cross-reference files exist (system-resilience.md, templates/design.md, scheduling/infrastructure.md, hosted-frontend.md)
- backup() API correctly identified as only safe approach (vs file copy with WAL)
- **Verdict: approved.**

---

## 2026-04-01 19:00 PDT — RES.DATA.BACKUP: Research backup, restore, and data export

**Done:** Researched backup, restore, and data export. Doc covers all 5 investigation areas: (1) backup strategy — audited current state (zero backups), DB at `~/.agentops/data/agentops.db` (connection.ts:17) with WAL sidecar files; recommended SQLite `backup()` API (atomic, non-blocking, ~50ms for 100MB); 4 backup triggers (pre-migration, daily, manual, pre-destructive); retention: 7 daily + 4 weekly in `~/.agentops/backups/`. (2) restore — full restore flow (interrupt executions, backup current, copy+migrate+verify), schema version compatibility via Drizzle migration replay, pre-restore safety backup. (3) export/import — audited existing partial export (settings.ts:148-160 — projects/personas/assignments only); proposed full project export as JSON (ProjectExport interface with all entities, configurable execution/chat inclusion); 3 import strategies (skip/overwrite/new project with ID remapping); relationship to RES.TEMPLATES (export is superset of template). (4) data portability — 6-item inventory (DB, config, backups portable; project paths, checkpoints, app binary not); migration guide for same-machine and new-machine; cross-machine sync explicitly not supported (SQLite WAL incompatible). (5) disaster recovery — 6 failure scenarios with recovery times (1-30min) and steps; external backup recommendations (Time Machine, rsync); WARNING not to cloud-sync live DB. Also: 6 API endpoints, Settings > Data Management wireframe, 3-phase implementation plan, 7 cross-references, 6 design decisions.
**Files:** `docs/proposals/data-management/backup-restore.md` (new)

---

## 2026-04-01 18:35 PDT — Review: RES.RECOVERY.SYSTEM (approved)

**Reviewed:** System-level resilience and data integrity research doc.
- All 4 areas covered: WebSocket disconnection (ws-client.ts fixed 3s reconnect :141, shouldReconnect :44, reconnectCallbacks :61; ws.ts broadcast Set :6, close/error :53-61, welcome :64; terminal-renderer agent_output_chunk :406), concurrent write safety (connection.ts WAL :29, foreign_keys :30, missing busy_timeout — critical gap), database integrity (Drizzle migrator no rollback, proposed pre-migration backup + integrity checks), frontend resilience (zero ErrorBoundaries confirmed, useHealth refetchInterval 30s :8, TanStack staleTime 30s/retry 1 :6-8, showErrorToast :53)
- Source code claims verified: ws-client.ts scheduleReconnect :136, 3000ms :141, shouldReconnect :44. ws.ts Set<WebSocket> :6, broadcast :12, close :53, error :58, welcome :64. query-client.ts staleTime :6, refetchOnWindowFocus :7, retry :8. useWsQuerySync in root-layout :19 with invalidation in use-ws-sync :14-39.
- All 4 cross-reference files exist (agent-recovery.md, coordination.md, architecture.md, ux-design.md)
- busy_timeout PRAGMA correctly identified as highest-priority one-line fix
- 4-tier degradation (connected/degraded/disconnected/offline) well-designed
- **Verdict: approved.**

---

## 2026-04-01 18:25 PDT — RES.RECOVERY.SYSTEM: Research system-level resilience and data integrity

**Done:** Researched system-level resilience across 4 investigation areas. (1) WebSocket disconnection — audited ws-client.ts (fixed 3s reconnect at line 141, no backoff, listeners survive in memory, events during disconnect lost), ws.ts (broadcast-only, no replay), terminal-renderer.tsx (no reconnect recovery, output stalls silently); proposed exponential backoff with jitter, connection state indicator, event replay (Phase 3), Agent Monitor HTTP gap-fill. (2) Concurrent write safety — audited connection.ts (WAL mode line 29, foreign_keys line 30, missing busy_timeout and synchronous PRAGMAs); better-sqlite3 serializes writes via Node.js single-thread; no file-level locking between agents; recommended busy_timeout=5000 as highest-priority one-line fix. (3) Database integrity — Drizzle migrator has no rollback support, 7 migration files; proposed pre-migration db.backup(), integrity_check on startup, corruption recovery. (4) Frontend resilience — zero ErrorBoundary components (component crash = white screen), useHealth() polls /api/health every 30s (use-health.ts:8), TanStack Query staleTime=30s/retry=1, no offline degradation; proposed 3-tier error boundaries (App/Page/Panel), 4-tier connection state (connected/degraded/disconnected/offline) with read-only mode. 3-phase implementation plan, 7 cross-references, 6 design decisions.
**Files:** `docs/proposals/error-recovery/system-resilience.md` (new)

---

## 2026-04-01 18:00 PDT — Review: RES.RECOVERY.AGENTS (approved)

**Reviewed:** Agent error handling and recovery patterns research doc.
- All 6 areas covered: current failure modes (5 modules audited with specific line numbers — execution-manager try-catch/rejections/loop detection/rate limiter, claude-executor SDK errors/sandbox/checkpointing, start.ts orphan recovery/shutdown, concurrency slot leak, dispatch no-try-catch), automatic retry (7 error categories classified retryable/terminal, RetryPolicy interface, per-persona config, 3 new execution statuses), graceful shutdown (current flow adequate, proposed interrupt+checkpoint, orphan detection enhanced), stuck detection (watchdog with per-persona thresholds, warn/timeout actions), partial results (keep+warn default, auto-rollback opt-in via existing rewind API), error reporting (10-category ExecutionError schema, JSON column, UI badges, aggregate trends)
- Source code claims verified: execution-manager.ts constants (MAX_REJECTIONS=3 :75, LOOP_HISTORY_SIZE=6 :76, MAX_TRANSITIONS_PER_HOUR=10 :74), try-catch :678, FATAL :680, onComplete :579. claude-executor.ts catch :672, api_retry :164, buildSandboxHook :199-220 (exact), no-API-key :477-481, enableFileCheckpointing :564, checkpointMessageId :655-661. start.ts recoverOrphanedState :38, SHUTDOWN_TIMEOUT_MS=30000 :15. concurrency.ts canSpawn :46, DEFAULT_MAX_CONCURRENT=3 :12, enqueue :76, checkMonthlyCost :143. dispatch.ts dispatchForState :23. schema.ts parentExecutionId :158. POST rewind :171. RewindButton :275.
- All 5 cross-reference files exist (rollback, analytics, notifications, scheduling, collaboration)
- Minor note: handleRejection() is at line 212, doc says 227 — off by 15 lines. Content correct.
- **Verdict: approved.**

---

## 2026-04-01 17:50 PDT — RES.RECOVERY.AGENTS: Research agent error handling and recovery

**Done:** Researched agent error handling and recovery patterns. Doc covers all 6 investigation areas: (1) current failure modes — audited 5 backend modules (execution-manager.ts: outer try-catch at line 678, MAX_REJECTIONS=3, LOOP_HISTORY_SIZE=6, MAX_TRANSITIONS_PER_HOUR=10; claude-executor.ts: SDK api_retry events, sandbox hooks, enableFileCheckpointing; start.ts: recoverOrphanedState() at line 38 marks running/pending as failed, SHUTDOWN_TIMEOUT_MS=30000; concurrency.ts: DEFAULT_MAX_CONCURRENT=3, slot leak on crash; dispatch.ts: no try-catch). Key finding: error handling is defensive but non-resilient — no retries, no circuit breakers. (2) automatic retry — classified 7 error categories (timeout/process_crash retryable, config_error/permission terminal), RetryPolicy interface (maxRetries, backoffMs, upgradeModel), retry in onComplete(), per-persona config, proposed new statuses (retrying, timed_out, interrupted). (3) graceful shutdown — current flow adequate; proposed interrupt+checkpoint enhancement using AbortController + SDK checkpoints, distinguish interrupted vs crashed orphans, auto-retry orphans. (4) stuck detection — watchdog design with per-persona thresholds (Router 2min, Engineer 10min), warn vs timeout actions, WS event for "possibly stuck." (5) partial results — keep+warn default, auto-rollback opt-in via existing rewindFiles/checkpointMessageId, conflict detection before retry. (6) error reporting — ExecutionError schema with 10 error categories, JSON error column on executions, UI badges/callouts, aggregate trends for analytics. 3-phase implementation plan, 7 cross-references, 6 design decisions.
**Files:** `docs/proposals/error-recovery/agent-recovery.md` (new)

---

## 2026-04-01 17:30 PDT — Review: RES.SEARCH (approved)

**Reviewed:** Search infrastructure and UX research doc.
- All 6 areas covered: what's searchable (8 entities priority-ordered, current state audit — zero server-side search), search UX (3 surfaces: enhanced Cmd+K, filter bar, dedicated /search page with wireframe), implementation (9-criteria comparison table FTS5/Fuse.js/Meilisearch, FTS5 recommended — zero deps, BM25, atomic), indexing (write-time triggers, initial rebuild, execution logs deferred), filtering (6 filter types, project-scoped default, faceted counts), performance (52K rows/10.5MB projection, <50ms command palette, <200ms full search)
- Source code claims verified: command-palette.tsx is 287 lines, `label.toLowerCase().includes(q)` at :145, HighlightedText at list-view.tsx:232, schema fields match (title/description, system_prompt, content/author_name, summary/logs, etc.)
- Cross-references valid: analytics/ux-design.md and api-contract.md both exist
- FTS5 SQL syntax correct (virtual tables, content=, triggers, snippet(), bm25())
- API design (SearchResponse/SearchResult types) clean and well-typed
- Minor notes: debounce is 200ms not 300ms (filter-bar.tsx:90); filter bar already searches title+description (list-view.tsx:362), not title-only as implied. Neither affects conclusions.
- **Verdict: approved.**

---

## 2026-04-01 17:15 PDT — RES.SEARCH: Research search infrastructure and UX

**Done:** Researched search infrastructure and UX. Doc covers all 6 investigation areas: (1) what's searchable — audited current state (zero server-side search, all client-side includes() on titles), prioritized 8 entity types (P0: work items + personas, P1: comments + chat, P2: executions + memories, P3: proposals + activity events); (2) search UX — 3 access points: enhanced Command Palette (Cmd+K, server-side with entity type badges), enhanced work items filter bar (debounced FTS), dedicated /search page (Phase 2, filter sidebar + entity tabs + pagination); result display with type badges, snippets, metadata; (3) search implementation — compared SQLite FTS5 vs Fuse.js vs Meilisearch on 9 criteria; recommended FTS5 (zero deps, built into better-sqlite3, BM25 ranking, atomic updates, handles 100K+ rows); Fuse.js fallback for Command Palette static lists only; (4) indexing — write-time via FTS5 triggers (15 triggers, 5 entities x 3 ops), contentless external content tables, porter unicode61 tokenizer, initial rebuild via `VALUES('rebuild')`, execution logs deferred to Phase 2 (summary only in Phase 1); (5) filtering and facets — project-scoped by default with global opt-in, 6 filter types (entity type, project, date range, status, priority, author), faceted counts via COUNT(*) FTS queries; (6) performance — estimated 52K rows / 10.5MB FTS index after 1 year, <50ms Command Palette, <200ms dedicated search page. Also: unified `/api/search` endpoint design, 3-phase implementation plan, 6 cross-references, 6 design decisions.
**Files:** `docs/proposals/search/design.md` (new)

---

## 2026-04-01 16:45 PDT — Cleanup: Archive 10 research tasks + trim worklog

**Done:** Archived 10 completed research tasks (RES.SCHED.INFRA, RES.ROLLBACK, RES.TEMPLATES, RES.ANALYTICS.METRICS/UX, RES.WEBHOOKS.INBOUND/OUTBOUND, RES.SWAP.ARCH/HOSTED/API) from TASKS.md to TASKS_ARCHIVE.md. Removed 6 now-empty research section headers. Archived 22 oldest worklog entries (already summarized in batches 1-2, added RES.SCHED.INFRA to batch 2). WORKLOG.md trimmed to 20 entries.
**Files:** `TASKS.md`, `TASKS_ARCHIVE.md`, `WORKLOG.md`, `WORKLOG_ARCHIVE.md`

---

## 2026-04-01 16:30 PDT — Review: RES.SWAP.API (approved)

**Reviewed:** API contract and versioning research doc.
- All 5 areas covered: API contract definition (audited ~70 endpoints across 13 route files via grep — 68 in routes + 2 in server.ts, 14 WS events, shared package breakdown; OpenAPI 3.1 code-first via @fastify/swagger recommended; WS stays TypeScript/AsyncAPI deferred), versioning strategy (single apiVersion integer + semver + capabilities object for additive features; feature flags vs capabilities distinction), shared package evolution (4-phase migration from private monorepo to published npm; workflow.ts and createId() stay internal), mock backend (3 options compared: Prism/MSW/lightweight server; MSW for tests, Prism for CI contract validation), frontend API impact (6 changes: dynamic URL, auth headers, error handling, WS switching, HealthResponse to shared, TanStack Query key namespacing)
- Source code claims verified: endpoint count 68+2=~70 via grep, 5 helpers at client.ts:61-115, inline fetch at 293/417/460/522-524/537/560/638 (7 sites, doc says 6 — minor inherited from ARCH), HealthResponse at client.ts:551-557, showErrorToast at :53-59, shared package private:true, ws-events.ts 14 types
- Cross-references all valid: architecture.md, hosted-frontend.md, inbound-triggers.md, outbound-events.md exist
- 4-phase implementation approach logically ordered, 6 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-01 16:25 PDT — RES.SWAP.API: Research API contract and versioning

**Done:** Researched API contract and versioning for backend swappability. Doc covers all 5 investigation areas: (1) API contract definition — audited current implicit contract: ~70 HTTP endpoints across 13 route files, 14 WS event types, 15 entity interfaces, 25+ request/response types in shared package; recommended OpenAPI 3.1 with code-first generation via @fastify/swagger (annotate existing routes, generate spec from code), WebSocket contract stays as TypeScript types (AsyncAPI deferred); (2) versioning strategy — single integer apiVersion in health response for breaking changes, semver for packages, capability negotiation via capabilities object for additive features, feature flags vs capabilities distinction; (3) what shared package becomes — current @agentops/shared (private, monorepo-internal) evolves to published @woof/api-types with 4-phase migration (keep → add OpenAPI → publish → generate types); entity types, workflow logic, and ID generation stay internal; (4) mock backend — MSW for component tests (in-browser), Prism for contract validation (auto-generated from OpenAPI spec), lightweight mock server deferred; current mock data layer transitions to MSW handlers; (5) impact on frontend API layer — 6 changes: dynamic base URL via getBaseUrl(), auth header injection via getAuthHeaders(), connection-aware error handling, WS URL switching with reconnectTo(), HealthResponse moved to shared, TanStack Query key namespacing by connection ID. Also: 4-phase implementation approach, 10 cross-references, 6 design decisions.
**Files:** `docs/proposals/frontend-backend-swappability/api-contract.md` (new)

---

## 2026-04-01 16:20 PDT — Review: RES.SWAP.HOSTED (approved)

**Reviewed:** Hosted frontend deployment model research doc.
- All 6 areas covered: onboarding flow (3-step wireframe, friction mitigation, returning user flow), local backend discovery (browser mixed content matrix for Chrome/Firefox/Safari/Edge — localhost is special-cased in all modern browsers, silent probe approach with tradeoffs), tunnel/remote access (3 tools compared: ngrok/Cloudflare/Tailscale with free tier/auth/persistence comparison, security implications of tunnel exposure, CORS analysis), multi-backend management (localStorage model, workspace switcher wireframe, independent instances, cross-device export/import + URL params), hosted infrastructure (actual build output analyzed — 1.1MB JS + 92KB CSS, 5 CDN platforms compared, Cloudflare Pages recommended, CI/CD pipeline, versioning/compatibility matrix), business model (free CDN ~$0 cost, value in backend+execution, 3-tier future model, local-first always fully functional, Apache-2.0 compatible)
- Source code claims verified: bin.agentops at package.json:7-9 (content correct, doc says 8-10 — minor), CORS at server.ts:27-30, health at server.ts:33-41 with version "0.0.1" and executor field, listen 0.0.0.0 at start.ts:212
- Cross-references checked: architecture.md exists, inbound-triggers.md exists, future docs correctly noted
- Implementation approach correctly depends on RES.SWAP.ARCH phases 1-2, 3-phase plan logically ordered
- 6 design decisions well-reasoned and consistent with local-first principles
- **Verdict: approved.**

---

## 2026-04-01 16:15 PDT — RES.SWAP.HOSTED: Research hosted frontend deployment model

**Done:** Researched hosted frontend deployment model. Doc covers all 6 investigation areas: (1) onboarding flow — step-by-step first visit experience with install/start/connect instructions, auto-polling "Test Connection" button, returning user reconnection banner; (2) local backend discovery — mixed content analysis confirms all modern browsers allow HTTP localhost from HTTPS origins, silent localhost:3001 probe for auto-detection, documented what doesn't work (LAN IPs, mDNS from HTTPS); (3) tunnel/remote access — compared ngrok, Cloudflare Tunnel, Tailscale for user-managed tunnels with free tier/auth/URL persistence comparison, security implications (mandatory auth, rate limiting), CORS requirements for tunnel URLs, deferred built-in tunnel; (4) multi-backend management — localStorage-based connection storage, workspace switcher dropdown in sidebar, independent backend instances (no data merging), online/offline status polling, cross-device via export/import + URL params; (5) hosted frontend infrastructure — current build output analysis (1.2MB/300KB gzipped), CDN platform comparison (5 options), recommended Cloudflare Pages (unlimited free bandwidth), CI/CD pipeline via GitHub Actions, versioning/compatibility matrix with apiVersion check, cache busting, canary deployments; (6) business model — free frontend on CDN (~$0 cost), value in backend+agent execution, 3-tier future model (free local/team managed/enterprise), local-first always fully functional, open source compatible. Also: 3-phase implementation approach with prerequisites, 7 cross-references, 6 design decisions.
**Files:** `docs/proposals/frontend-backend-swappability/hosted-frontend.md` (new)

---

## 2026-04-03 01:45 PDT — Review: RES.SWAP.ARCH (approved)

**Reviewed:** Frontend/backend decoupling architecture research doc.
- All 7 areas covered: current state audit (API_BASE_URL at client.ts:48, 5 helpers + 6 inline fetch at specific lines, WS at ws-client.ts:53, CORS at server.ts:27-30, health at :33-41), backend selector UX (3 access points, connection model, list/add wireframes, sidebar indicator), connection validation (health check flow with 4 error paths, enhanced response with apiVersion + capabilities, 30s polling), auth (bearer token scheme, header injection, localStorage, security note), WebSocket reconnection (5-step switch flow, handler survival, Agent Monitor stream clearing), offline/disconnected (3 detection signals, 4-tier degradation table, TanStack Query cache, polling backoff), deployment models (5 models with architecture diagrams, enabled vs additional work table)
- Source code claims verified: client.ts:48-49 (API_BASE_URL/BASE_URL), ws-client.ts:23/53/77-81/90/122-128/136 (class/URL/onclose/disconnect/onReconnect/scheduleReconnect), server.ts:27-28 (CORS origins), server.ts:33/39 (health/version)
- Implementation approach pragmatic: Zustand connection store, Phase 1 single-file change
- 6 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-03 01:30 PDT — RES.SWAP.ARCH: Research frontend/backend decoupling architecture

**Done:** Researched frontend/backend decoupling architecture. Doc covers all 7 investigation areas: (1) current state audit — hardcoded `API_BASE_URL = "http://localhost:3001"` at client.ts:48, 30+ API functions using `BASE_URL` through 5 helpers + 6 inline fetch calls, WebSocket URL derived from same constant at ws-client.ts:53, CORS hardcoded to localhost ports at server.ts:27-30, health endpoint at server.ts:33-41 with version; (2) backend selector UX — Settings > Connection page, connection list with status indicators, add/edit dialog with test, sidebar footer status indicator, first-run screen if no connection; (3) connection validation — health check flow with version comparison, enhanced health response with apiVersion + capabilities, periodic 30s health polling with 3-strike disconnect detection; (4) auth — bearer token (API key) scheme, header injection per connection, localStorage storage with security note, OAuth/SSO deferred; (5) WebSocket reconnection — 5-step switch flow (disconnect → update store → connect new → invalidate cache → refetch), handler survival across reconnects, Agent Monitor stream clearing; (6) offline/disconnected — 3 detection signals, 4-tier degradation (connected/recent/extended/no-backend), TanStack Query stale cache serving, reconnection polling with backoff; (7) deployment models — 5 models enabled (local, SPA+local, SPA+tunnel, team server, desktop app), what's enabled vs what needs additional work. Also: implementation approach (Zustand connection store replacing constant), 3-phase migration, backend CORS change, 6 cross-references, 5 design decisions.
**Files:** `docs/proposals/frontend-backend-swappability/architecture.md` (new)

---

## 2026-04-03 01:00 PDT — Review: RES.WEBHOOKS.OUTBOUND (approved after rework)

**Reviewed:** Outbound event webhooks research doc — rework review.
- All 7 feedback points addressed: agent_started at execution-manager.ts:341 ✓, agent_completed at :539 ✓, agent_completed (failure) at :693 ✓, state_change at work-items.ts:166 / mcp-server.ts:197 ✓, proposal_created/proposal_updated correctly noted as unused types (defined in ws-events.ts:22-23 but never broadcast in backend), comment_created at mcp-server.ts:704 ✓, file list updated to 6 files with execution-manager.ts ✓
- Implementation gap note for proposal events clearly states Phase 2 prerequisite
- Core design unchanged and remains solid: delivery infrastructure, payload format, retry, event bus, auto-disable
- **Verdict: approved.**

---

## 2026-04-03 00:50 PDT — RES.WEBHOOKS.OUTBOUND (rework): Fix event source references

**Done:** Addressed all 7 feedback points from review. Fixed event catalog table in section 2: (1) agent_started source → execution-manager.ts:341, (2) agent_completed source → execution-manager.ts:539, (3) agent_completed failure source → execution-manager.ts:693, (4) state_change source → work-items.ts:166 / mcp-server.ts:197. For proposal_created and proposal_updated: explicitly noted these types exist in ws-events.ts but are NOT currently broadcast anywhere — added implementation gap note explaining broadcast calls need to be added as a Phase 2 prerequisite. Updated section 1 file list from 5 to 6 files, adding execution-manager.ts as primary broadcast site for agent lifecycle events.
**Files:** `docs/proposals/webhooks/outbound-events.md` (modified)

---

## 2026-04-03 00:30 PDT — Review: RES.WEBHOOKS.OUTBOUND (rejected)

**Reviewed:** Outbound event webhooks research doc.
- Core design is solid: delivery infrastructure (SQLite queue + polling), payload format (JSON envelope), retry strategy (exponential backoff, 5 attempts), shared event bus, auto-disable, delivery log, HMAC signing, notification relationship analysis — all well-designed.
- **Issue: Event catalog source references are wrong.** 6 of 8 events in section 2 table reference incorrect files/lines: agent_started is at execution-manager.ts:341 (not dispatch.ts:63), agent_completed at execution-manager.ts:539/:693 (not claude-executor.ts:304/:343), state_change at mcp-server.ts:198 (not :93). proposal_created and proposal_updated types exist in ws-events.ts but are never actually broadcast anywhere — doc claims they fire from mcp-server.ts:313/:344 (those lines broadcast comment_created and state_change respectively).
- Section 1 file list misses execution-manager.ts which is a major broadcast site.
- **Verdict: rejected.** Feedback added to TASKS.md with specific corrections needed.

---

## 2026-04-03 00:15 PDT — RES.WEBHOOKS.OUTBOUND: Research outbound event webhooks

**Done:** Researched outbound event webhooks. Doc covers all 5 investigation areas: (1) subscribable events — 8-event catalog mapped from internal WsEvent types (14) and audit events (7) to curated outbound subset: execution.started/completed/failed, work_item.state_changed, proposal.created/resolved, budget.threshold, comment.created; dotted naming for wildcard support; (2) webhook configuration — WebhookSubscription interface (12 fields), event type checkboxes, per-project or global scope, test/ping button, subscription list + create/edit wireframes in Settings > Integrations > Outbound Webhooks; (3) payload format — standardized JSON envelope (event, webhookId, deliveryId, timestamp, data), 8 event-specific payloads with full field specs, security exclusions (no API keys, full logs, prompts, file content); (4) delivery — async dispatch via SQLite queue + in-process polling worker (2s interval), exponential backoff retry (5 attempts, 30s-30min), 10s HTTP timeout, HMAC signing (X-Webhook-Signature), auto-disable after 10 consecutive failures, delivery log with status/latency/retry history, 30-day retention; (5) relationship to notifications — compared audiences/channels/content/filtering, shared event bus architecture (TypedEventEmitter) with separate webhook + notification dispatchers, recommendation to keep separate but share event source. Also: delivery queue table schema, 3-phase plan, 6 cross-references, 5 design decisions.
**Files:** `docs/proposals/webhooks/outbound-events.md` (new)

---

## 2026-04-02 23:45 PDT — Review: RES.WEBHOOKS.INBOUND (approved)

**Reviewed:** Inbound triggers from external systems research doc.
- All 5 areas covered: GitHub integration (5 events, App approach, HMAC, payload mapping, setup wireframe, tunnel challenge), generic webhook receiver (POST /api/webhooks/:triggerId, WebhookTrigger interface, Handlebars templates, CI example), Slack triggers (slash commands, bot mentions, 3-sec async, thread-aware, channel scoping), trigger config UX (Settings > Integrations, list/create/edit wireframes, test panel), security (HMAC timingSafeEqual, 3-tier rate limiting, IP allowlisting, replay protection, malformed handling)
- Source code claims verified: dispatchForState() at dispatch.ts:23, canSpawn() at concurrency.ts:46, enqueue() at concurrency.ts:76, no trigger/webhook tables in schema.ts, no webhook routes exist
- Cross-reference to scheduling infrastructure doc (docs/proposals/scheduling/infrastructure.md) confirmed to exist
- Data model well-designed: webhook_triggers + webhook_deliveries tables with trigger_id/trigger_type on executions aligning with scheduling proposal
- 3-phase plan correctly ordered (generic → GitHub → Slack), 6 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-02 23:30 PDT — RES.WEBHOOKS.INBOUND: Research inbound triggers

**Done:** Researched inbound triggers from external systems. Doc covers all 5 investigation areas: (1) GitHub integration — 5 event use cases (PR opened, issue created, CI failed, review requested, push), GitHub App vs raw webhooks (App preferred for permissions + per-repo install), webhook receiver at POST /api/webhooks/github with X-Hub-Signature-256, 4 event types with extracted variable mappings, setup flow wireframe, local-first tunnel challenge noted; (2) generic webhook receiver — POST /api/webhooks/:triggerId endpoint, WebhookTrigger interface (12 fields), Handlebars-style prompt template with {{payload.*}} variables, custom CI integration example; (3) Slack triggers — slash commands (/woof) + bot mentions + reactions, Slack App with signature verification, 3-second response requirement (async dispatch + later posting), thread-aware responses, channel scoping, setup flow wireframe; (4) trigger configuration UX — Settings > Integrations section (GitHub/Slack/Custom Webhooks), trigger list view wireframe, create/edit dialog wireframe with endpoint URL, secret, event filter, prompt template editor, "Test with Sample Payload" preview panel; (5) security — HMAC verification (timingSafeEqual), 3-tier rate limiting (10/min burst, 60/hr sustained, 100/min global), optional IP allowlisting with GitHub published ranges, replay protection (timestamp + delivery ID dedup), malformed payload handling (4 cases). Also: data model (webhook_triggers + webhook_deliveries tables, trigger_id/trigger_type on executions), 3-phase plan, 6 cross-references, 5 design decisions.
**Files:** `docs/proposals/webhooks/inbound-triggers.md` (new)

---

## 2026-04-02 23:15 PDT — Review: RES.ANALYTICS.UX (approved)

**Reviewed:** Analytics dashboard UX design research.
- All 5 areas covered: where analytics live (4 options compared, hybrid recommended — dedicated /analytics page + dashboard link; nav item between Activity Feed and Chat; dashboard enhancement wireframe), time range controls (5 presets with default 7d, comparison mode with dashed overlay, URL query params for shareability), visualizations (7 chart types: summary cards with deltas, cost LineChart, outcomes stacked BarChart, cost-by-persona horizontal BarChart, persona leaderboard Table, activity heatmap via CSS Grid, workflow bottlenecks; full-page wireframe; each chart with specific Recharts component and API endpoint), drill-down (7 click targets → actions mapped, execution list modal wireframe with "View Detail" link to Agent Monitor, filter chips for persona/state), export (CSV with 11-column spec, JSON alternative, dashboard snapshot deferred)
- Source code claims verified: dashboard.tsx stat cards grid at :68, cost-summary.tsx Recharts AreaChart at :4/:129, agent-history.tsx stats at :141-167, costs-section.tsx BarChart at :3/:236, sidebar.tsx 7 nav items at :38-46 with correct insertion point
- Responsive design well-considered (3 breakpoints, ResponsiveContainer pattern from cost-summary.tsx)
- 3-phase plan correctly defers workflow bottlenecks to Phase 2 (audit log dependency)
- 6 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-02 23:00 PDT — RES.ANALYTICS.UX: Research analytics dashboard UX

**Done:** Researched analytics dashboard UX design. Doc covers all 5 investigation areas: (1) where analytics live — 4 options compared (dedicated page/embedded/settings tab/hybrid), audited 4 existing surfaces (dashboard stat cards at dashboard.tsx:68-97, cost widget with Recharts AreaChart in cost-summary.tsx, agent-history stats bar at :143-172, settings costs with BarChart in costs-section.tsx), recommended hybrid — dedicated /analytics page + dashboard link, new nav item between Activity Feed and Chat; (2) time range controls — 5 presets (24h/7d/30d/90d/custom), comparison mode (vs previous period with dashed overlay), URL query params for shareability, backend endpoint extension needed; (3) visualizations — 7 chart types (summary cards with deltas, cost line chart, outcomes stacked bar, cost-by-persona horizontal bar, persona leaderboard table, activity heatmap via CSS Grid, workflow bottlenecks bar), full-page wireframe, each chart with data source API endpoint, Recharts for all except custom heatmap; (4) drill-down — click targets mapped to actions (7 interactions), execution list modal design, filter chips for persona/state, "View Detail" to Agent Monitor; (5) export — CSV with column spec, JSON alternative, dashboard snapshot deferred to Phase 3. Also: responsive breakpoints (3 tiers), 3-phase implementation plan, 6 cross-references, 5 design decisions.
**Files:** `docs/proposals/analytics/ux-design.md` (new)

---

## 2026-04-02 22:45 PDT — Review: RES.ANALYTICS.METRICS (approved)

**Reviewed:** Agent analytics metrics collection and storage research.
- All 5 areas covered: per-execution (10 existing columns audited, 8 missing metrics identified with priority P0-P2, SDK result fields mapped — costUsd/durationMs captured at executor:180-181, token fields on msg.usage not captured; 8 ALTER TABLE columns proposed), per-persona (7 derived metrics via SQL GROUP BY, persona leaderboard table design), per-project (5 metrics via workItems join, burn-down deferred to Phase 2), per-workflow (step timing via paired audit state_transitions, bottleneck identification, workflow_state column on executions for per-state analytics), collection strategy (3 options compared with pros/cons; SQLite perf at 1K/10K/50K/100K rows; typical instance 3.6K-18K executions/year; hybrid recommended)
- Source code claims verified: executions table at schema.ts:142-159 (all 10 columns match), audit.ts:14-15 (LOG_DIR + AUDIT_FILE paths), executor costUsd/durationMs at claude-executor.ts:180-181, FileChanged hook at :603, retry extraction at :170-173, dashboard.ts 3 endpoints with in-memory aggregation, chat.ts:418 metadata.costUsd
- SDK types verified: SDKResultSuccess has usage:NonNullableUsage (→BetaUsage with input_tokens/output_tokens/cache fields) and num_turns. Note: doc's code block shows token fields as direct properties of result message — actually nested under msg.usage. Minor presentation simplification; core claim (fields exist, not captured) is correct.
- Audit log DB migration plan well-designed (audit_events table with 3 indexes)
- 5 SQL indexes for common query patterns appropriate
- 3-phase plan correctly ordered, 6 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-02 22:30 PDT — RES.ANALYTICS.METRICS: Research metrics collection

**Done:** Researched agent analytics metrics collection and storage. Doc covers all 5 investigation areas: (1) per-execution metrics — audited executions table (10 existing columns), identified 8 missing metrics (input/output/cache tokens, model, num_turns, tool_call_count, files_modified_count, workflow_state), mapped SDK result message fields showing 4 token fields not captured at claude-executor.ts:180-181, recommended extending executions table with 8 new columns; (2) per-persona metrics — 7 derived metrics via SQL GROUP BY personaId, persona leaderboard table design (runs, success rate, avg cost, avg duration, total cost); (3) per-project metrics — 5 metrics via join through workItems.projectId, backlog burn-down deferred to Phase 2 (requires snapshots or event replay); (4) per-workflow metrics — workflow step timing via paired state_transition audit entries, bottleneck identification with rejection rate per step, recommended adding `workflow_state` column to executions for per-state analytics; (5) collection strategy — 3 options compared (query-time/rollup tables/hybrid), SQLite performance analysis (<10ms at 1K rows, ~500ms at 100K), estimated 3.6K-18K executions/year for typical instance, recommended hybrid (Phase 1 query-time, Phase 2 rollup). Also: audit log DB migration plan, 7 SQL indexes for common query patterns, 3-phase implementation plan.
**Files:** `docs/proposals/analytics/metrics.md` (new)

---

## 2026-04-02 22:15 PDT — Review: RES.TEMPLATES (approved)

**Reviewed:** Templates and presets system research.
- All 5 areas covered: work item templates (WorkItemTemplate interface, 5 built-in templates with pre-filled fields, "New from Template" dropdown + command palette, custom templates via "Save as Template", storage in `work_item_templates` table), workflow templates (WorkflowTemplate with states + transitions + persona mapping, 5 built-in workflows, template selector in project creation, export/import as JSON), project templates (ProjectTemplate bundles workflow + personas + starter items, 4 built-in project templates, "Create from Template" dialog wireframe with "Customize" expansion), persona presets (current state audit — 6 built-ins with empty systemPrompt, duplicate button exists; 6 additional presets with model/tools/budget, "Browse Presets" library wireframe, "Reset to Default"), storage and sharing (4 options compared; hybrid DB + JSON export recommended; single `templates` table with type discriminator; `.woof.json` format; community gallery deferred to Phase 3+)
- Source code claims verified: BUILT_IN_PERSONAS at default-personas.ts:17, DEFAULT_STATE_ASSIGNMENTS at :75-81, systemPrompt:"" at :103, Duplicate button at persona-list.tsx:118-121, handleDuplicate at :231, currentState text at schema.ts:29, workflow-config-section.tsx exists, seedDefaultPersonasForProject at projects.ts:85
- Settings integration well-designed with per-type primary/secondary locations
- 3-phase plan correctly ordered (work items + personas first, workflows + projects second, sharing third)
- 6 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-02 22:00 PDT — RES.TEMPLATES: Research templates and presets system

**Done:** Researched templates and presets system design. Doc covers all 5 investigation areas: (1) work item templates — WorkItemTemplate interface, 5 built-in templates (Bug Report, Feature Request, Spike, Documentation, Refactor) with pre-filled fields, "New from Template" dropdown UX + command palette integration, custom templates via "Save as Template" on existing items, (2) workflow templates — WorkflowTemplate/WorkflowStateTemplate/WorkflowTransitionTemplate interfaces, 5 built-in workflow templates (Default Linear, Simple Kanban, Code Review Pipeline, Documentation Pipeline, Bug Triage), template selector in project creation dialog, export/import via JSON, (3) project templates — ProjectTemplate bundles workflow + personas + optional starter items, 4 built-in project templates (Standard, Lightweight, Code Review Focused, Documentation Project), "Create Project from Template" dialog wireframe with "Customize" inline expansion, (4) persona presets — audited current state (6 built-ins with empty systemPrompt in default-personas.ts:103, duplicate button at persona-list.tsx:231), 6 additional presets (Bug Triager, Documentation Writer, Test Engineer, Security Reviewer, Dependency Updater, Release Manager), "Browse Presets" library UI wireframe, "Reset to Default" for built-ins, (5) storage and sharing — 4 options compared (DB/JSON files in project/JSON in app data/hybrid), recommended hybrid DB + JSON export with `.woof.json` format, single `templates` table with type discriminator, community gallery as Phase 3+. 3-phase implementation plan, 6 cross-references, 5 design decisions.
**Files:** `docs/proposals/templates/design.md` (new)

---

## 2026-04-02 21:45 PDT — Review: RES.ROLLBACK (approved)

**Reviewed:** Rollback UX and implementation research.
- All 6 areas covered: rollback scope (3-scope comparison table — per-execution/per-message/per-tool-call with SDK support, complexity, user value; per-execution as Phase 1, per-message Phase 2, per-tool-call not recommended), UX (4-surface analysis with priority — Agent Monitor P0 exists, execution detail panel P1 with wireframe, work item timeline P2, activity feed P3; 3 confirmation dialog enhancements: diff preview, conflict warning, time-elapsed), partial rollback (SDK is all-or-nothing; 3 approaches: git-based selective revert with race condition identified, pre-rewind snapshot recommended for Phase 3, SDK feature request; honest tradeoff analysis), safety (4 detection strategies compared; 2-tier recommendation: mtime + execution history; conflict UI wireframe; warning-only approach with running-execution exception), git integration (4 options: working tree/auto-commit/staged/user choice; recommended Option D user choice with default-on commit; auto-generated message with editable text), SDK limitations (9-feature audit table; 5 custom implementations needed; checkpoint retention analysis ~5MB/day; cross-session validity confirmed as critical architectural enabler)
- Source code claims verified: enableFileCheckpointing at claude-executor.ts:564, checkpointEmitted at :655-661, checkpointMessageId at execution-manager.ts:431/445/525, schema.ts:156, rewind API at executions.ts:167-322, client.ts:280-283, RewindButton at agent-history.tsx:275-395, rewind_execution MCP tool at mcp-server.ts:628-671, running block at executions.ts:196-203
- BUG-1 reference verified at e2e results :47
- SDK RewindFilesResult type matches exactly (canRewind/error/filesChanged/insertions/deletions)
- 3-phase plan correctly ordered by effort and value
- 6 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-02 21:30 PDT — RES.ROLLBACK: Research rollback UX and implementation

**Done:** Researched rollback UX and implementation design. Doc covers all 6 investigation areas: (1) rollback scope — per-execution (current, sufficient for Phase 1), per-message (Phase 2, requires capturing all assistant message IDs), per-tool-call (not recommended — SDK doesn't support, git is better); (2) UX — 4-surface analysis (Agent Monitor history P0 exists, execution detail panel P1, work item timeline P2, activity feed P3); enhanced confirmation dialog with time-elapsed indicator + conflict warnings + per-file diffs; (3) partial rollback — SDK is all-or-nothing; 3 approaches compared (git-based selective revert, pre-rewind snapshot recommended for Phase 3, SDK feature request); checkbox per file in dialog; (4) safety — 2-tier conflict detection (mtime comparison + execution history cross-reference); warning-only approach (never block); conflict UI wireframe showing which files modified and by whom; (5) git integration — 4 options compared (working tree only, auto-commit, staged changes, user choice); recommended: opt-in git commit creation (default on) with auto-generated message; (6) SDK limitations — 9-feature audit table; 5 custom implementations needed (conflict detection, git commits, per-file diffs, multiple checkpoints, partial rollback); checkpoint storage analysis (~5MB/day at 100 executions, not a near-term concern). 3-phase implementation plan, 6 cross-references, 5 design decisions.
**Files:** `docs/proposals/rollback/design.md` (new)

