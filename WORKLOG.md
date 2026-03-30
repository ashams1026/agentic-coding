# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-30 — Review: S.9 (approved)

**Reviewed:** Configuration file — `config.ts` and CLI commands in `cli.ts`.
- `AgentOpsConfig` interface: 4 fields (port, dbPath, logLevel, anthropicApiKey) with sensible defaults ✓
- `loadConfig()`: correct precedence defaults <- file <- env vars. Reads PORT, AGENTOPS_DB_PATH/DATABASE_URL, LOG_LEVEL, ANTHROPIC_API_KEY ✓
- `setConfigValue()`: validates port (1-65535), logLevel (6 pino levels), unknown keys. Merge-writes (reads before writing) ✓
- `readConfigFile()`: handles missing file and parse errors gracefully ✓
- `writeConfigFile()`: lazy mkdirSync, pretty-printed JSON ✓
- CLI `config`: prints resolved config, masks API key (last 4 chars or "(not set)") ✓
- CLI `config set`: validates, saves, masks API key in output, dynamic ESM import ✓
- Switch dispatch: `process.argv[3] === "set"` subcommand ✓
- `--help` updated with both commands ✓
- Build: 0 errors, Tests: 159/159
- Verdict: **approved** — Sprint 12 complete!

---

## 2026-03-30 — S.9: Implement configuration file

**Task:** Create config loader from `~/.agentops/config.json` with env var overrides. Add `agentops config` and `agentops config set` CLI commands.

**Done:**
- **`packages/backend/src/config.ts`** (new) — Configuration module:
  - `loadConfig()` — resolves config with precedence: defaults <- config file <- env vars
  - `setConfigValue(key, value)` — validates and persists a single key to config.json
  - `getConfigPath()` — returns `~/.agentops/config.json` path
  - Config fields: `port` (1-65535), `dbPath`, `logLevel` (trace/debug/info/warn/error/fatal), `anthropicApiKey`
  - Env var mappings: `PORT`, `AGENTOPS_DB_PATH`/`DATABASE_URL`, `LOG_LEVEL`, `ANTHROPIC_API_KEY`
  - Validation on set: port range, log level enum, key existence check
- **`packages/backend/src/cli.ts`** — Added 2 new commands:
  - `config` — prints resolved config (masks API key to last 4 chars)
  - `config set <key> <value>` — validates and saves to config.json, masks API key in output
  - Uses dynamic `import("./config.js")` (ESM-compatible)
  - `--help` updated with both config commands

**Files created:** `packages/backend/src/config.ts`
**Files modified:** `packages/backend/src/cli.ts`

**Notes:** Build: 0 errors. Tests: 159/159. Config file created lazily on first `set` (mkdirSync + writeFileSync). Existing `DATABASE_URL` env var support in `connection.ts` is preserved — `loadConfig()` also reads `DATABASE_URL` as a fallback for `dbPath`.

---

## 2026-03-30 — Review: S.8 (approved)

**Reviewed:** Execution audit trail — `audit.ts`, `routes/audit.ts`, and all consumer files.
- `audit.ts`: separate pino instance with `base: null` + ISO timestamps writing to `~/.agentops/logs/audit.log` ✓
- 4 typed emitters: `auditStateTransition`, `auditAgentDispatch`, `auditAgentComplete`, `auditCostEvent` ✓
- `queryAuditLog()`: reads file, parses JSON lines, filters by workItemId, newest-first, limit ✓
- `routes/audit.ts`: `GET /api/audit?workItemId=&limit=`, max 500, default 50 ✓
- Wired in execution-manager (dispatch + completion + cost), mcp-server (route_to_state + flag_blocked), coordination (parent auto-advance), work-items route (user-driven) ✓
- All 3 actor types covered: persona, system, user ✓
- Cost event only emitted when finalCostUsd > 0 ✓
- Build: 0 errors, Tests: 159/159
- Verdict: **approved**

---

## 2026-03-30 — S.8: Add execution audit trail

**Task:** Create audit log for state transitions, agent dispatches, and cost events. Store in `~/.agentops/logs/audit.log`. Add `GET /api/audit` endpoint.

**Done:**
- **`packages/backend/src/audit.ts`** (new) — Audit module with:
  - Separate pino instance writing to `~/.agentops/logs/audit.log` (ISO timestamps, no base fields)
  - 4 typed emitters: `auditStateTransition()`, `auditAgentDispatch()`, `auditAgentComplete()`, `auditCostEvent()`
  - `queryAuditLog()` — reads file, parses JSON lines, filters by workItemId, returns newest-first with limit
- **`packages/backend/src/routes/audit.ts`** (new) — `GET /api/audit?workItemId=&limit=` endpoint. Max limit 500, default 50.
- **`packages/backend/src/server.ts`** — Registered `auditRoutes`
- **`packages/backend/src/agent/execution-manager.ts`** — Added `auditAgentDispatch` (on dispatch), `auditAgentComplete` + `auditCostEvent` (on completion)
- **`packages/backend/src/agent/mcp-server.ts`** — Added `auditStateTransition` in `route_to_state` and `flag_blocked` tools
- **`packages/backend/src/agent/coordination.ts`** — Added `auditStateTransition` for parent auto-advance
- **`packages/backend/src/routes/work-items.ts`** — Added `auditStateTransition` for user-driven state changes

**Files created:** `audit.ts`, `routes/audit.ts`
**Files modified:** `server.ts`, `agent/execution-manager.ts`, `agent/mcp-server.ts`, `agent/coordination.ts`, `routes/work-items.ts`

**Notes:** Build: 0 errors. Tests: 159/159. Audit log uses `pino.destination()` (not transport worker thread) for simplicity. Each audit entry is one JSON line with: timestamp, workItemId, action, actor, outcome, plus event-specific fields.

---

## 2026-03-30 — Review: S.7 (approved)

**Reviewed:** Structured logging — `logger.ts` and all consumer files.
- `logger.ts`: clean dual-export (`logger` + `loggerConfig`), dev/prod transport split via `NODE_ENV` ✓
- Dev: pino-pretty to stdout. Prod: pino-roll daily rotation + stdout ✓
- `server.ts`: uses `loggerConfig` (not `loggerInstance`) — avoids Fastify type incompatibility ✓
- `start.ts`: 5 console calls → structured `logger.info/error` with context objects ✓
- `execution-manager.ts`: 5 error calls replaced with structured logger ✓
- `memory.ts`: 4 error calls replaced ✓
- `mcp-server.ts`: 3 error calls replaced ✓
- `coordination.ts`: 1 error call replaced ✓
- Remaining `console.log` only in CLI scripts (cli.ts, seed.ts, migrate.ts) — correct ✓
- pino + pino-roll installed as direct dependencies ✓
- Build: 0 errors, Tests: 159/159
- Verdict: **approved**

---

## 2026-03-30 — S.7: Set up structured logging

**Task:** Replace all `console.log/error` in the backend server code with pino structured logger. Daily rotation to file in production, pino-pretty to stdout in dev.

**Done:**
- **`packages/backend/src/logger.ts`** (new) — Global logger module. Exports:
  - `logger` — standalone pino instance for application code (start.ts, agent modules)
  - `loggerConfig` — Fastify-compatible config object (avoids `loggerInstance` type issues)
  - Dev: `pino-pretty` to stdout. Production: `pino-roll` to `~/.agentops/logs/agentops.log` (daily rotation, 7-day retention) + stdout.
- **`packages/backend/src/server.ts`** — Replaced inline logger config with `loggerConfig` from logger.ts.
- **`packages/backend/src/start.ts`** — Replaced 5 `console.log/error` calls with structured `logger.info/error` (includes context objects: executionId, workItemId, etc.)
- **`packages/backend/src/agent/execution-manager.ts`** — Replaced 5 `console.error` calls with `logger.error`
- **`packages/backend/src/agent/memory.ts`** — Replaced 4 `console.error` calls with `logger.error`
- **`packages/backend/src/agent/mcp-server.ts`** — Replaced 3 `console.error` calls with `logger.error`
- **`packages/backend/src/agent/coordination.ts`** — Replaced 1 `console.error` call with `logger.error`
- Installed `pino` (direct dependency) and `pino-roll` (file rotation transport)
- Kept `console.log` in CLI scripts (`cli.ts`, `db/seed.ts`, `db/migrate.ts`) — user-facing terminal output, not structured logging.

**Files created:** `packages/backend/src/logger.ts`
**Files modified:** `server.ts`, `start.ts`, `agent/execution-manager.ts`, `agent/memory.ts`, `agent/mcp-server.ts`, `agent/coordination.ts`, `packages/backend/package.json`

**Notes:** Build: 0 errors. Tests: 159/159. Used `loggerConfig` (not `loggerInstance`) for Fastify to avoid type incompatibility between pino's `Logger` type and Fastify's `FastifyBaseLogger`. Structured log calls include context objects (e.g., `{ err, workItemId }`) for better searchability.

---

## 2026-03-30 — Review: S.6 (approved)

**Reviewed:** pm2 startup integration — `cli.ts`.
- `install`: start → save → startup sequence correct, sudo note ✓
- `uninstall`: stop → delete → unstartup → save sequence correct ✓
- `logs`: spawn with inherited stdio for streaming ✓
- `restart`: execSync with ecosystem config path ✓
- `getEcosystemConfig()` validates file exists, clear error message ✓
- `runPm2()` wraps execSync, exits 1 on failure ✓
- `MONOREPO_ROOT` derivation correct (packages/backend/..) ✓
- `--help` shows all 8 commands with aligned descriptions ✓
- Build: 0 errors, Tests: 159/159
- Verdict: **approved**

---

## 2026-03-30 — S.6: Add pm2 startup integration

**Task:** Add `agentops install`, `uninstall`, `logs`, `restart` commands to the CLI for pm2 service management.

**Done:**
- **`cli.ts`** — Added 4 new commands:
  - `install` — starts pm2 with ecosystem.config.cjs, runs `pm2 save` + `pm2 startup`. Notes that startup may need sudo.
  - `uninstall` — stops + deletes agentops from pm2, runs `pm2 unstartup`, saves. Notes sudo requirement.
  - `logs` — spawns `pm2 logs agentops --lines 100` with inherited stdio (streams live).
  - `restart` — runs `pm2 restart` with ecosystem config.
- Helper `getEcosystemConfig()` resolves `ecosystem.config.cjs` from `MONOREPO_ROOT` (two levels up from `dist/`), fails with clear error if not found.
- Helper `runPm2()` wraps `execSync` with `npx pm2` for sync commands.
- Updated `--help` output to show all 8 commands with aligned descriptions.
- Added `execSync` import from `node:child_process`.

**Files modified:** `packages/backend/src/cli.ts`

**Notes:** Build: 0 errors. Tests: 159/159. CLI help verified manually. `MONOREPO_ROOT` = `PACKAGE_ROOT/..` which resolves `packages/backend/..` = monorepo root.

---

## 2026-03-30 — Review: S.5 (approved)

**Reviewed:** Install/setup script — `scripts/setup.sh`.
- Executable with correct shebang and strict mode (`set -euo pipefail`) ✓
- Node >= 22 check with version parsing ✓
- pnpm check with install instruction on failure ✓
- `pnpm install --frozen-lockfile` + `pnpm build` ✓
- Creates `~/.agentops/{config,logs,data}` directories ✓
- `AGENTOPS_DB_PATH` env var configurable (default `~/.agentops/data/agentops.db`) ✓
- `DATABASE_URL` bridge correct — maps to what `connection.ts` reads ✓
- Migrations + seed run with correct env var ✓
- Clear summary with next steps and CLI commands ✓
- Build: 0 errors, Tests: 159/159
- Verdict: **approved**

---

## 2026-03-30 — S.5: Create install/setup script

**Task:** Create setup script that checks prereqs, installs, builds, creates data dirs, runs migrations, seeds personas.

**Done:**
- **`scripts/setup.sh`** — Bash script with 7 steps:
  1. Check Node >= 22 (parses `node -v`, compares major version)
  2. Check pnpm installed
  3. `pnpm install --frozen-lockfile`
  4. `pnpm build`
  5. Create `~/.agentops/{config,logs,data}` directories
  6. Run migrations against `AGENTOPS_DB_PATH` (sets `DATABASE_URL` env var, which `connection.ts` reads)
  7. Seed default personas via `db:seed`
  8. Print setup summary with next steps
- DB path configurable via `AGENTOPS_DB_PATH` env var (default `~/.agentops/data/agentops.db`)
- Colored output with info/ok/warn/fail helpers
- `set -euo pipefail` for strict error handling
- Made executable (`chmod +x`)

**Files created:** `scripts/setup.sh`

**Notes:** Build: 0 errors. Tests: 159/159. Shell syntax verified via `bash -n`. Uses `DATABASE_URL` env var to point `connection.ts` at the custom path. Seed runs the full seed (includes demo data) — gives new users something to see in the UI.

---

## 2026-03-30 — Review: S.4 (approved)

**Reviewed:** pm2 ecosystem config — `ecosystem.config.cjs`, `package.json`.
- CJS format correct (pm2 doesn't support ESM configs) ✓
- App name, script path, cwd, env vars all correct ✓
- Log paths to `~/.agentops/logs/` with date format and merge_logs ✓
- Restart policy: max_restarts 3, min_uptime 60s, restart_delay 1s ✓
- kill_timeout 35s aligned with 30s graceful shutdown + 5s buffer ✓
- watch: false ✓
- 5 service:* scripts in package.json wrapping pm2 commands ✓
- Build: 0 errors, Tests: 159/159
- Verdict: **approved**

---

## 2026-03-30 — S.4: Create pm2 ecosystem config

**Task:** Create `ecosystem.config.cjs` with pm2 app config and add service management scripts to root package.json.

**Done:**
- **`ecosystem.config.cjs`** — CJS format (pm2 requires it). App name "agentops", script `packages/backend/dist/index.js`, cwd set to monorepo root via `__dirname`. Env: NODE_ENV=production, PORT=3001. Logs to `~/.agentops/logs/agentops-{out,error}.log` with date format. Restart policy: max 3 restarts, min 60s uptime, 1s delay, autorestart true. `kill_timeout: 35000` (30s graceful shutdown + 5s buffer). `watch: false`.
- **`package.json`** — Added 5 service scripts: `service:start` (pm2 start), `service:stop` (pm2 stop), `service:restart` (pm2 restart), `service:status` (pm2 show), `service:logs` (pm2 logs --lines 100).

**Files created:** `ecosystem.config.cjs`
**Files modified:** `package.json`

**Notes:** Build: 0 errors. Tests: 159/159. Config validated via Node require(). Using CJS because pm2 doesn't support ESM config files. The `kill_timeout` of 35s aligns with the 30s graceful shutdown timeout in `start.ts`.

---

## 2026-03-30 — Review: S.3 (approved)

**Reviewed:** Production-grade crash recovery — `start.ts`, `startup-cleanup.test.ts`.
- Exported `recoverOrphanedState()` with typed `RecoveryReport` ✓
- Recovers both "running" and "pending" orphaned executions via `or()` ✓
- Per-execution logging with ID, status, workItemId, personaId ✓
- Affected work items logged with current state (informational, no changes) ✓
- Error resilience: try/catch wraps DB ops, in-memory clear always runs ✓
- 6 tests: orphaned reset, pending recovery, work items unchanged, empty report, clearAll, clearTransitionLog ✓
- Build: 0 errors, Tests: 159/159
- Verdict: **approved**

---

## 2026-03-30 — S.3: Add crash recovery on startup (production-grade)

**Task:** Upgrade the E.10 orphan cleanup to a production-grade recovery system with structured reporting, per-execution logging, pending execution recovery, and error resilience.

**Done:**
- **`start.ts`** — Replaced `cleanupOrphanedState()` with exported `recoverOrphanedState()` returning a typed `RecoveryReport` (`{ executionsReset, affectedWorkItems, errors }`). Now also recovers "pending" executions (crash between insert and start). Logs each orphaned execution with ID, work item, persona. Logs affected work items with their current state (informational, no changes). Entire recovery wrapped in try/catch — DB errors logged to report but don't prevent server start. In-memory state (concurrency, transition log) always cleared, even if DB recovery fails.
- **`startup-cleanup.test.ts`** — Rewrote to use exported `recoverOrphanedState()` directly. Added mock for `sqlite` and `closeAllClients`. New tests:
  - Recovers running executions with correct report fields
  - Also recovers pending executions (new)
  - Leaves work items in their current state (new)
  - Returns empty report when no orphans (new)
  - Existing clearAll and clearTransitionLog tests preserved

**Files modified:** `packages/backend/src/start.ts`, `packages/backend/src/__tests__/startup-cleanup.test.ts`

**Notes:** Build: 0 errors. Tests: 159/159 (was 156, +3 new). The `or()` from drizzle-orm handles the combined running/pending query. RecoveryReport type is exported for potential use by health/status endpoints.

---

## 2026-03-30 — Review: S.2 (approved)

**Reviewed:** Graceful shutdown + health endpoint — `start.ts`, `ws.ts`, `server.ts`, `cli.ts`.
- Shutdown sequence correct: server.close() → closeAllClients(1001) → waitForExecutions(30s) → sqlite.close() → exit ✓
- Double-shutdown guard via `shuttingDown` flag ✓
- `waitForExecutions()` polls getActiveCount() at 500ms intervals with deadline ✓
- Timeout logs warning, continues shutdown (force-kill) ✓
- `closeAllClients()` iterates clients, try/catch per client, clears set ✓
- `/api/health` returns { status, uptime, activeExecutions, version } ✓
- Legacy `/health` kept for backwards compat ✓
- CLI signal handlers removed, `exit` handler retained for PID cleanup ✓
- Build: 0 errors, Tests: 156/156
- Verdict: **approved**

---

## 2026-03-30 — S.2: Add graceful shutdown handling

**Task:** Handle SIGTERM/SIGINT with graceful shutdown (drain executions, close WS/DB), add enhanced `/api/health` endpoint.

**Done:**
- **`start.ts`** — Added `gracefulShutdown()` function: closes server (stop accepting connections), closes all WS clients with 1001, waits for active executions to drain (30s timeout, 500ms poll interval), closes SQLite database, logs shutdown reason and duration. Double-shutdown guard via `shuttingDown` flag. Signal handlers registered after server build, before listen.
- **`ws.ts`** — Added `closeAllClients()` export: iterates all connected clients, calls `client.close(1001, "Server shutting down")`, clears the set.
- **`server.ts`** — Enhanced health endpoint at `/api/health` returning `{ status, uptime, activeExecutions, version }`. Kept legacy `/health` with same response for backwards compat. Imported `getActiveCount` from concurrency module.
- **`cli.ts`** — Removed SIGINT/SIGTERM handlers from `startCommand` (start.ts handles signals now for graceful shutdown). CLI keeps only `process.on("exit")` for PID cleanup. Updated status command to hit `/api/health`.

**Files modified:** `packages/backend/src/start.ts`, `packages/backend/src/ws.ts`, `packages/backend/src/server.ts`, `packages/backend/src/cli.ts`

**Notes:** Build: 0 errors. Tests: 156/156. The `waitForExecutions()` helper polls `getActiveCount()` every 500ms until 0 or 30s timeout. On timeout, logs a warning and continues shutdown (force-kill). Version is hardcoded as "0.0.1" — can be made dynamic later.

---

## 2026-03-30 — Review: S.1 (approved)

**Reviewed:** CLI entry point — `cli.ts`, `start.ts`, `index.ts`, `package.json`.
- All 4 commands implemented: start (PID + startServer), stop (SIGTERM), status (PID + health/dashboard fetch), dev (tsx watch) ✓
- `start.ts` cleanly extracted from `index.ts` — reusable `startServer(options)` with orphan cleanup ✓
- `index.ts` simplified to one-liner ✓
- PID file lifecycle correct: write on start, cleanup on exit/SIGINT/SIGTERM, stale detection ✓
- ESM-compatible path resolution via `import.meta.url` ✓
- `bin` entry and shebang present ✓
- Status command degrades gracefully when enhanced endpoints aren't available yet ✓
- Build: 0 errors, Tests: 156/156
- Verdict: **approved**

---

## 2026-03-30 — S.1: Create CLI entry point

**Task:** Create `packages/backend/src/cli.ts` with command parser, 4 commands (start, stop, status, dev), bin entry, shebang.

**Done:**
- **`start.ts`** — Extracted startup logic from `index.ts` into reusable `startServer(options)` export. Contains orphaned state cleanup, migrations, server build+listen. Both `index.ts` and `cli.ts` import from here.
- **`index.ts`** — Simplified to one-liner: `import { startServer } from "./start.js"; startServer();`
- **`cli.ts`** — CLI entry point with `#!/usr/bin/env node` shebang. Parses `process.argv[2]` via switch. Commands:
  - `start` — writes PID to `~/.agentops/agentops.pid`, registers SIGINT/SIGTERM cleanup, imports `startServer()`. Detects already-running instance.
  - `stop` — reads PID file, sends SIGTERM, removes PID file. Handles "not running" gracefully.
  - `status` — checks PID liveness, hits `/health` and `/api/dashboard/stats` for live metrics (uptime, active agents, cost). Degrades gracefully if endpoints aren't enhanced yet.
  - `dev` — spawns `npx tsx watch src/index.ts` with inherited stdio. Resolves paths from `import.meta.url`.
  - `--help` / no args — prints usage summary.
- **`package.json`** — Added `"bin": { "agentops": "./dist/cli.js" }`.

**Files created:** `packages/backend/src/start.ts`, `packages/backend/src/cli.ts`
**Files modified:** `packages/backend/src/index.ts`, `packages/backend/package.json`

**Notes:** Build: 0 errors. Tests: 156/156 passing. CLI verified manually (`--help`, `status`). The status command will show richer data once S.2 adds the enhanced `/api/health` endpoint.

---

## 2026-03-30 — Review: E.10 (approved)

**Reviewed:** Startup cleanup — `index.ts`, `concurrency.ts`, `startup-cleanup.test.ts`.
- `cleanupOrphanedState()` runs after migrations, before server start ✓
- Bulk update `running`→`failed` with completedAt/summary/outcome ✓
- `clearAll()` clears both activeExecutions Set and queue array ✓
- `clearTransitionLog()` reused from execution-manager ✓
- Work items intentionally NOT reset — correct design (avoid state ambiguity) ✓
- Logs only when cleanedUp > 0 ✓
- 3 tests: orphaned reset, clearAll, clearTransitionLog ✓
- Build: 0 errors, Tests: 156/156
- Verdict: **approved** — Sprint 11 complete!

---

## 2026-03-30 — E.10: Handle stale execution cleanup on server restart

**Task:** On server startup, reset orphaned `running` executions to `failed`, clear in-memory concurrency/transition state.

**Done:**
- **`cleanupOrphanedState()` in `index.ts`** — Runs after migrations, before server start. Queries all executions with `status: "running"`, updates them to `failed` with `summary: "Interrupted by server restart"` and `outcome: "failure"`. Clears in-memory concurrency tracker and transition rate-limiter. Logs cleanup count.
- **`clearAll()` in `concurrency.ts`** — New export that clears `activeExecutions` Set and `queue` array. Used by startup cleanup.
- **3 new tests** in `startup-cleanup.test.ts`:
  - Resets orphaned running execution (EXEC_3 from seed) to failed with correct summary
  - `clearAll()` resets concurrency tracker and queue
  - `clearTransitionLog()` resets rate limiter

**Files modified:** `packages/backend/src/index.ts`, `packages/backend/src/agent/concurrency.ts`, `packages/backend/src/__tests__/startup-cleanup.test.ts` (new)

**Notes:** Build: 0 errors. Tests: 156/156 passing (was 153). Work items are intentionally NOT reset — they stay in their current state and can be re-triggered by the user or auto-routing. This avoids state machine ambiguity about what state they "should" be in.

---

## 2026-03-30 — Review: E.9 (approved)

**Reviewed:** Execution error handling and retry button — `work-items.ts`, `work-items.test.ts`, `execution-timeline.tsx`, `client.ts`, `api.ts`, `index.ts`.
- Retry route: POST `/api/work-items/:id/retry` — lookup + 404 + fire-and-forget dispatch ✓
- `retryWorkItem()` wired through client → mock → unified index ✓
- Retry button: RotateCcw icon, `outcome === "failure"` guard, toast feedback ✓
- Existing error pipeline verified: DB update, WS broadcast, toast, no state advance ✓
- Tests: 2 new retry route tests (200, 404) ✓
- Build: 0 errors, Tests: 153/153
- Verdict: **approved**

---

## 2026-03-30 — E.9: Add execution error handling and UI feedback

**Task:** Verify error handling pipeline, add toast on failure, add retry button in detail panel.

**Verification (already working):**
1. Execution record updated to `failed` in DB — execution-manager.ts catch block sets `status: "failed"`, `outcome: "failure"`, error in summary/logs ✓
2. Failure broadcast via WS — catch block broadcasts `agent_completed` with `outcome: "failure"` ✓
3. Agent monitor shows error — terminal renderer streams all chunks including `FATAL:` error messages. Execution hook shows `status: "failed"` ✓
4. Work item does NOT advance state — routing chain only fires on `finalOutcome === "success"` ✓
5. Toast on failure — `use-toast-events.ts` already handles `agent_completed` with failure: shows error toast with "Agent failed" title and "View" action ✓

**New features added:**
- **`POST /api/work-items/:id/retry` route** — Re-dispatches the persona for the work item's current state. Returns 404 if work item doesn't exist. Fire-and-forget dispatch.
- **`retryWorkItem()` API client** — Added to real client, mock API, and unified API index.
- **Retry button in ExecutionTimeline** — Shows a "Retry" button (RotateCcw icon) below the badges row for failed executions. Calls `retryWorkItem()`, shows info/error toast on success/failure.
- **2 new tests** — retry dispatch for existing item (200), retry for non-existent (404).

**Files modified:** `packages/backend/src/routes/work-items.ts`, `packages/backend/src/routes/__tests__/work-items.test.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/mocks/api.ts`, `packages/frontend/src/api/index.ts`, `packages/frontend/src/features/common/execution-timeline.tsx`

**Notes:** Build: 0 errors. Tests: 153/153 passing (was 151). Most of E.9 was already working — the execution-manager and toast system were properly handling failures. The retry button was the main new UI feature.

---
