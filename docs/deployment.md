# Configuration & Deployment

AgentOps stores all configuration, data, and logs under `~/.agentops/`. It can run in development mode (with hot reload) or production (managed by pm2).

## Directory Structure

```
~/.agentops/
  config.json              # Configuration file
  agentops.pid             # PID file (when running via CLI start)
  data/
    agentops.db            # SQLite database (WAL mode)
    agentops.db-wal        # WAL journal
    agentops.db-shm        # Shared memory file
  logs/
    agentops.log           # Application log (pino, daily rotation)
    agentops-out.log       # pm2 stdout log
    agentops-error.log     # pm2 stderr log
```

The `~/.agentops/` directory is created automatically on first run.

## Configuration

### Config File

Location: `~/.agentops/config.json`

```json
{
  "port": 3001,
  "dbPath": "/Users/you/.agentops/data/agentops.db",
  "logLevel": "info",
  "anthropicApiKey": "sk-ant-..."
}
```

### Config Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `port` | `number` | `3001` | HTTP server port |
| `dbPath` | `string` | `~/.agentops/data/agentops.db` | SQLite database file path |
| `logLevel` | `string` | `"info"` | Log level: `trace`, `debug`, `info`, `warn`, `error`, `fatal` |
| `anthropicApiKey` | `string` | `""` | Anthropic API key for agent execution |

### Resolution Order

Configuration values are resolved in priority order:

```
Environment variables  (highest priority — always win)
        ↓
Config file            (~/.agentops/config.json)
        ↓
Built-in defaults      (lowest priority)
```

### Environment Variable Overrides

| Env Variable | Overrides | Notes |
|---|---|---|
| `PORT` | `port` | Parsed as integer |
| `AGENTOPS_DB_PATH` | `dbPath` | Absolute path to SQLite file |
| `DATABASE_URL` | `dbPath` | Alternative to AGENTOPS_DB_PATH |
| `LOG_LEVEL` | `logLevel` | One of: trace, debug, info, warn, error, fatal |
| `ANTHROPIC_API_KEY` | `anthropicApiKey` | API key for Claude |

Environment variables always take precedence over the config file.

## CLI Commands

The AgentOps CLI is available as `npx agentops` from the monorepo root.

```
agentops <command>

Commands:
  start              Start the server (foreground)
  stop               Stop the running server
  status             Show server status
  dev                Start in development mode (with watch)
  config             Show resolved configuration
  config set <k> <v> Set a configuration value
  restart            Restart the pm2 service
  logs               Tail pm2 service logs
  install            Register as a boot service (pm2 startup)
  uninstall          Remove the boot service
```

### Command Details

#### `agentops start`

Starts the server in the foreground. Writes a PID file to `~/.agentops/agentops.pid`. If a server is already running (PID file exists and process is alive), exits with an error.

Startup sequence:
1. Run database migrations
2. Crash recovery — reset orphaned executions (status "running" or "pending") to "failed"
3. Clear in-memory state (concurrency tracker, rate limiter)
4. Build Fastify server, register routes and WebSocket
5. Listen on configured port (default 3001)
6. Register SIGTERM/SIGINT handlers for graceful shutdown

#### `agentops stop`

Sends SIGTERM to the running server (reads PID from `~/.agentops/agentops.pid`), removes the PID file.

#### `agentops status`

Shows whether the server is running, its PID, port, and live stats (uptime, active agents, today's cost) if reachable.

#### `agentops dev`

Starts the backend in development mode using `tsx watch` for hot reload. Does not use pm2.

#### `agentops config`

Displays the resolved configuration (after applying defaults, config file, and env var overrides). Masks the API key.

```
Config file: /Users/you/.agentops/config.json

Resolved configuration (defaults <- file <- env vars):

  port             3001
  dbPath           /Users/you/.agentops/data/agentops.db
  logLevel         info
  anthropicApiKey  ****xxxx
```

#### `agentops config set <key> <value>`

Sets a configuration value in `~/.agentops/config.json`.

```bash
agentops config set port 3002
agentops config set logLevel debug
agentops config set anthropicApiKey sk-ant-api03-...
```

Valid keys: `port` (1-65535), `dbPath`, `logLevel` (trace/debug/info/warn/error/fatal), `anthropicApiKey`.

## pm2 Service Management

For production, AgentOps uses pm2 for process management with automatic restarts and boot persistence.

### Ecosystem Config

The pm2 configuration lives in `ecosystem.config.cjs` at the monorepo root:

```javascript
{
  name: "agentops",
  script: "packages/backend/dist/index.js",
  env: {
    NODE_ENV: "production",
    PORT: 3001,
  },
  // Logs → ~/.agentops/logs/
  out_file: "~/.agentops/logs/agentops-out.log",
  error_file: "~/.agentops/logs/agentops-error.log",
  // Restart: max 3 restarts in 60s, then stop
  max_restarts: 3,
  min_uptime: "60s",
  restart_delay: 1000,
  autorestart: true,
  // Graceful shutdown: 35s (30s drain + 5s buffer)
  kill_timeout: 35000,
  listen_timeout: 10000,
}
```

### pm2 Commands

| Command | Action |
|---|---|
| `agentops install` | Register as boot service: `pm2 start`, `pm2 save`, `pm2 startup` |
| `agentops uninstall` | Remove boot service: `pm2 stop`, `pm2 delete`, `pm2 unstartup`, `pm2 save` |
| `agentops restart` | Restart the pm2 service |
| `agentops logs` | Tail the last 100 lines of pm2 logs |

### Manual pm2 Usage

```bash
# Start
npx pm2 start ecosystem.config.cjs

# View status
npx pm2 status

# View logs
npx pm2 logs agentops

# Restart
npx pm2 restart ecosystem.config.cjs

# Stop
npx pm2 stop agentops

# Remove
npx pm2 delete agentops
```

## Logging

### Development Mode

In development (`NODE_ENV !== "production"`), logs are pretty-printed to stdout using `pino-pretty`:

```
[10:30:45] INFO: AgentOps backend listening on 0.0.0.0:3001
[10:30:46] INFO: WebSocket client connected (total: 1)
```

### Production Mode

In production (`NODE_ENV=production`), logs are written to two destinations:

1. **File**: `~/.agentops/logs/agentops.log` — daily rotation, 7-day retention (via `pino-roll`)
2. **Stdout**: also logged to stdout (captured by pm2 into `agentops-out.log`)

Logs are structured JSON (pino format):

```json
{"level":30,"time":1711800000000,"msg":"AgentOps backend listening on 0.0.0.0:3001"}
```

### Log Levels

| Level | Value | Usage |
|---|---|---|
| `trace` | 10 | Very detailed debugging |
| `debug` | 20 | Debug information |
| `info` | 30 | Normal operations (default) |
| `warn` | 40 | Warnings |
| `error` | 50 | Errors |
| `fatal` | 60 | Fatal errors |

Set via config: `agentops config set logLevel debug`
Set via env: `LOG_LEVEL=debug agentops start`

### pm2 Log Files

| File | Contents |
|---|---|
| `~/.agentops/logs/agentops-out.log` | pm2-captured stdout |
| `~/.agentops/logs/agentops-error.log` | pm2-captured stderr |
| `~/.agentops/logs/agentops.log` | Application log (pino, daily rotation) |

## Database

### Location

Default: `~/.agentops/data/agentops.db`

Override via config: `agentops config set dbPath /path/to/agentops.db`
Override via env: `AGENTOPS_DB_PATH=/path/to/agentops.db`

### Storage Details

- **Engine**: SQLite with WAL (Write-Ahead Logging) mode and foreign keys enabled
- **Driver**: better-sqlite3
- **ORM**: Drizzle ORM with type-safe schema
- **Tables**: 9 (projects, work_items, work_item_edges, personas, persona_assignments, executions, comments, proposals, project_memories)
- **Migrations**: run automatically on startup via `runMigrations()`

### Backup Strategy

SQLite with WAL mode allows safe backup while the server is running:

```bash
# Copy the database file (safe with WAL mode)
cp ~/.agentops/data/agentops.db ~/.agentops/data/agentops.db.bak

# Or use the export endpoint for settings
curl http://localhost:3001/api/settings/export > agentops-settings.json
```

The export endpoint (`GET /api/settings/export`) dumps projects, personas, and persona assignments as JSON. Import with `POST /api/settings/import`.

### Cleanup

Old execution records can be purged via the API:

```bash
# Delete executions older than 30 days
curl -X DELETE http://localhost:3001/api/settings/executions
```

Or via the UI: **Settings > Data > Clear Execution History**.

## Development Mode vs Production

| Aspect | Development | Production |
|---|---|---|
| **Start command** | `pnpm dev` or `agentops dev` | `agentops install` (pm2) |
| **Frontend** | Vite dev server on port 5173 | Built static files served separately |
| **Backend** | `tsx watch` with hot reload | Compiled JS via pm2 |
| **Logging** | Pretty-printed to stdout | JSON to file (daily rotation) + stdout |
| **Process mgmt** | Manual (foreground) | pm2 with auto-restart and boot persistence |
| **Crash recovery** | Runs on each restart | Runs on each restart |
| **Database** | Same SQLite file | Same SQLite file |

### Running in Development

```bash
# Start both frontend and backend
pnpm dev

# Or start backend only
cd packages/backend && pnpm dev

# Or use the CLI
npx agentops dev
```

### Running in Production

```bash
# Build all packages
pnpm build

# Register as boot service
npx agentops install

# Check status
npx agentops status

# View logs
npx agentops logs
```

## Graceful Shutdown

When the server receives SIGTERM or SIGINT:

1. Stop accepting new HTTP connections
2. Close all WebSocket connections (code 1001 "Going Away")
3. Wait up to 30 seconds for active agent executions to complete
4. If timeout: force-kill remaining executions
5. Close the SQLite database connection
6. Exit

The pm2 `kill_timeout` is set to 35 seconds (30s drain + 5s buffer) to allow the graceful shutdown to complete before pm2 sends SIGKILL.

## Crash Recovery

On every startup, before the server accepts connections:

1. Find all executions with status "running" or "pending" (orphaned from a previous crash)
2. Reset them to "failed" with summary "Interrupted by server restart"
3. Log each recovered execution and affected work items
4. Clear in-memory concurrency tracker and rate limiter

Work items are left in their current state — the user or auto-routing can re-trigger dispatch.

## Source Files

| File | Purpose |
|---|---|
| `packages/backend/src/config.ts` | Configuration loader, defaults, env var overrides, `setConfigValue()` |
| `packages/backend/src/cli.ts` | CLI commands: start, stop, status, dev, config, pm2 management |
| `packages/backend/src/logger.ts` | Pino logger: dev (pretty) vs prod (file rotation + stdout) |
| `packages/backend/src/start.ts` | Server startup, crash recovery, graceful shutdown |
| `ecosystem.config.cjs` | pm2 process configuration |
