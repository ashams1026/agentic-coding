# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

## Sprint 10: UI Polish & UX Refinements (continued)

> P.1–P.10 completed and archived. Remaining tasks below.

### Tooltips & Micro-Interactions

- [x] **P.11** — Add loading and empty states. Add skeleton loading states to: work items list (5 shimmer rows), detail panel (header + content skeleton), flow view (node placeholders), dashboard cards (number placeholder shimmer). Add empty states with helpful messaging to: work items list when no items exist ("No work items yet. Click + to create one."), filtered list with no matches ("No items match your filters."), detail panel children section ("No children. Click 'Add child' or 'Decompose'."), comment stream when empty ("No comments yet.").

- [x] **P.12** — Polish hover states and transitions. Audit all interactive elements for hover feedback. List view rows: subtle `bg-muted/50` hover with `transition-colors duration-150`. Cards: slight scale or shadow lift on hover. Buttons: ensure all variants have visible hover state change. Badges that are clickable (priority, state in detail panel): add `cursor-pointer` and subtle hover. Active/selected states: use `ring-2 ring-primary/50` consistently. Focus-visible: ensure all interactive elements show focus ring for keyboard navigation.

---

## Sprint 11: End-to-End Integration

> Make the whole system work together. Run real work items through the full pipeline, fix integration seams, verify live updates.
> Prerequisite: Sprint 8 complete (agent engine), Sprint 9 complete (tests catch regressions).

### Frontend ↔ Backend Wiring

- [x] **E.1** — Fix API client response parsing. Audit `packages/frontend/src/api/client.ts`: verify every function's response shape matches what the backend actually returns (field names, casing, nested JSON fields like `labels`, `executionContext`, `settings`). The mock API and real API may have diverged — compare mock fixtures against actual DB seed output. Fix any mismatches. Add error handling for non-200 responses (toast notification on failure).

- [x] **E.2** — Wire TanStack Query cache invalidation to WebSocket events. In `packages/frontend/src/api/ws-client.ts` or a new `packages/frontend/src/hooks/use-ws-invalidation.ts`: subscribe to WebSocket events and invalidate the correct TanStack Query cache keys. `state_change` → invalidate `workItems` + `dashboardStats`. `comment_created` → invalidate `comments`. `agent_started` / `agent_completed` → invalidate `executions` + `dashboardStats`. `proposal_created` → invalidate `proposals`. `cost_update` → invalidate `dashboardStats` + `costSummary`. This replaces polling and makes the UI reactive.

- [x] **E.3** — Wire agent monitor to real WebSocket streaming. In `packages/frontend/src/features/agent-monitor/`: connect the terminal renderer to real `agent_output_chunk` WebSocket events (not mock). Map real event payloads (`{ chunkType, content, toolName, toolInput, toolResult }`) to the existing `DisplayItem` types the renderer expects. Verify live streaming works: start an execution, see output appear in real-time. Handle reconnection — re-fetch active executions on WS reconnect.

- [x] **E.4** — Wire activity feed to real WebSocket events. In `packages/frontend/src/features/activity-feed/`: replace `useBaseActivityEvents()` (which builds from mock data) with a real API call to fetch recent events. Subscribe to all WS event types and convert to activity feed entries using the existing `wsEventToActivity()` converter. Verify live events slide in at the top.

### Pipeline Smoke Test

- [x] **E.5** — Create development seed with realistic pipeline data. Update `packages/backend/src/db/seed.ts`: seed a project with `autoRouting: true`, all 5 personas with real system prompts (Product Manager, Tech Lead, Engineer, Code Reviewer, Router), persona assignments for each workflow state, a mix of work items in various states (some in Backlog ready to start, some in progress, some done with execution history and comments). This seed should represent a realistic in-flight project, not just empty scaffolding.

- [x] **E.6** — Manual pipeline walkthrough and fix. With backend running (`pnpm --filter backend dev`) and frontend in API mode: manually walk a work item through the full lifecycle. Create a top-level item → move to Planning (verify persona dispatches) → move through Decomposition (verify children created) → children to Ready → In Progress (verify engineer persona runs) → In Review (verify reviewer runs) → Done. Fix every integration bug found. Document the walkthrough steps and any fixes in the WORKLOG.

- [x] **E.7** — Fix dispatch trigger on state change. Verify that `PATCH /api/work-items/:id` with a `currentState` change actually calls `dispatchForState()`. Verify the dispatch checks persona assignments, concurrency limits, and cost caps. Verify that when auto-routing is ON, the router fires after each persona completes. Verify that when auto-routing is OFF, items stay in their current state after persona completion. Fix any gaps in the wiring between routes → dispatch → execution-manager → router.

- [review] **E.8** — Fix parent-child coordination in real flow. Test with real DB: create a parent with 3 children, move children to Done one by one. Verify parent auto-advances to "In Review" only when ALL children are Done. Verify that blocking a child posts a system comment on the parent. Verify the detail panel updates reactively (via WS invalidation from E.2).

### Error Handling & Recovery

- [ ] **E.9** — Add execution error handling and UI feedback. When an agent execution fails: verify the execution record is updated to `failed` in DB, verify the failure is broadcast via WS, verify the agent monitor shows the error state, verify the work item does NOT advance state. Add a toast notification on execution failure visible from any page. Add a "retry" button in the detail panel for failed executions.

- [ ] **E.10** — Handle stale execution cleanup on server restart. In `packages/backend/src/index.ts` (after migrations, before server start): query for any executions with status `running` — these are orphaned from a previous crash. Update them to `failed` with summary "Interrupted by server restart". Reset any work items that were mid-transition. Clear the in-memory concurrency tracker. Log the cleanup count.

---

## Sprint 12: System Service & CLI

> Make AgentOps installable and runnable as a background service. Phase 6 from PLANNING.md.
> After this sprint, users can `agentops start` and access the UI without running `pnpm dev`.

### CLI Foundation

- [ ] **S.1** — Create CLI entry point. Create `packages/backend/src/cli.ts` with a simple command parser (no heavy CLI framework needed — use `process.argv` or `commander` if complexity warrants). Commands: `agentops start` (start server as foreground process), `agentops stop` (send SIGTERM to running process), `agentops status` (show running/stopped, uptime, port, active agents count, today's cost), `agentops dev` (alias for current dev mode with watch). Add `"bin": { "agentops": "./dist/cli.js" }` to `packages/backend/package.json`. Add shebang `#!/usr/bin/env node` to cli.ts.

- [ ] **S.2** — Add graceful shutdown handling. In `packages/backend/src/server.ts` or `index.ts`: handle SIGTERM and SIGINT signals. On shutdown: stop accepting new HTTP/WS connections, wait for active agent executions to complete (30s timeout, then force-kill), close database connection, close WebSocket connections with 1001 code, log shutdown reason and duration. Add a `/api/health` endpoint that returns `{ status: "ok", uptime, activeExecutions, version }`.

- [ ] **S.3** — Add crash recovery on startup. In `packages/backend/src/index.ts` (after migrations): check for orphaned state — executions with status `running` (from a previous crash), work items stuck in transient states. Reset orphaned executions to `failed`. For work items that were mid-dispatch: leave them in their current state (the user or auto-routing can re-trigger). Log recovery actions. This overlaps with E.10 but is the permanent, production-grade version.

### pm2 Service Management

- [ ] **S.4** — Create pm2 ecosystem config. Create `ecosystem.config.cjs` at monorepo root: app name "agentops", script points to compiled backend (`packages/backend/dist/index.js`), `cwd` set to monorepo root, env vars (NODE_ENV=production, PORT=3001), log file paths (`~/.agentops/logs/`), restart policy (max 3 restarts in 60s, then stop), `watch: false`. Add `"service:start"`, `"service:stop"`, `"service:status"`, `"service:logs"` scripts to root `package.json` wrapping pm2 commands.

- [ ] **S.5** — Create install/setup script. Create `scripts/setup.sh` (or `packages/backend/src/cli-setup.ts`): check Node >= 22, check pnpm installed, run `pnpm install`, run `pnpm build`, create `~/.agentops/` directory (config, logs, data), initialize SQLite database at `~/.agentops/data/agentops.db`, run migrations, seed with default personas (PM, Tech Lead, Engineer, Reviewer, Router). Print setup summary and next steps. Make the DB path configurable via env var `AGENTOPS_DB_PATH` (default `~/.agentops/data/agentops.db`).

- [ ] **S.6** — Add pm2 startup integration. In the CLI: `agentops install` command that runs `pm2 startup` to register the OS-level boot daemon (launchd on macOS, systemd on Linux). `agentops uninstall` to remove it. `agentops logs` to tail pm2 logs. `agentops restart` to restart the service. Document the commands in a `--help` output.

### Logging & Observability

- [ ] **S.7** — Set up structured logging. Replace all `console.log` in the backend with pino logger (already a Fastify default — expose it globally). Log levels: `info` for lifecycle events (server start, execution start/complete, state transitions), `warn` for rate limits hit and cost cap blocks, `error` for execution failures and unhandled errors. Add request logging via Fastify's built-in pino integration. Write logs to `~/.agentops/logs/agentops.log` with daily rotation (keep 7 days). In dev mode: pretty-print to stdout via `pino-pretty`.

- [ ] **S.8** — Add execution audit trail. Create a lightweight audit log: every state transition, every agent dispatch, every cost event gets a one-line structured log entry with timestamp, workItemId, action, actor (persona or user), and outcome. Store in a separate `~/.agentops/logs/audit.log` file. Add `GET /api/audit?workItemId=&limit=` endpoint for querying. This is the "what happened and when" trail for debugging agent behavior.

### Configuration

- [ ] **S.9** — Implement configuration file. Create `packages/backend/src/config.ts`: load config from `~/.agentops/config.json` (JSON for simplicity, not TOML). Config fields: `port` (default 3001), `dbPath` (default `~/.agentops/data/agentops.db`), `logLevel` (default "info"), `anthropicApiKey` (loaded from config or `ANTHROPIC_API_KEY` env var). Env vars override config file. Add `agentops config` CLI command to print current resolved config. Add `agentops config set <key> <value>` to update config file.

---

## Sprint 13: Settings Wiring

> Connect the existing Settings UI to real backend functionality. Every control should actually do something.
> The settings pages already exist from Sprint 4 — this sprint wires them to real APIs and persistence.

### API Key Management

- [ ] **W.1** — Implement API key storage and validation. Add `POST /api/settings/api-key` route: accepts `{ key: string }`, validates by making a test call to the Anthropic API (e.g., a minimal `messages.create` with 1 token max), stores the key encrypted (or base64 for MVP) in `~/.agentops/config.json`. Add `GET /api/settings/api-key` that returns `{ configured: boolean, maskedKey: "sk-ant-...****" }` (never return the full key). Add `DELETE /api/settings/api-key` to remove. Wire the Settings API Keys section to these endpoints: input field, "Test connection" button (calls POST, shows success/fail), masked display when configured, remove button.

- [ ] **W.2** — Wire API key into agent executor. In `packages/backend/src/agent/claude-executor.ts`: read the API key from config on each execution (don't cache — user might update it). If no key configured, reject dispatch with a clear error: "Anthropic API key not configured. Go to Settings → API Keys." Show this error in the UI as a toast and in the execution record.

### Project Settings Wiring

- [ ] **W.3** — Wire project CRUD in settings. The Projects section in settings currently uses mock data. Wire to real `GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id`. Project creation should validate that the `path` exists on disk (backend checks via `fs.existsSync`). Display validation errors in the form. Wire the project switcher in the sidebar to use real projects.

- [ ] **W.4** — Wire concurrency settings. In the Settings Concurrency section: read current `maxConcurrent` from project settings via API. Slider (1-10) updates via `PATCH /api/projects/:id` with `settings.maxConcurrent`. Change takes effect immediately — the concurrency limiter in `concurrency.ts` reads from project settings on each `canSpawn()` check. Show current active/queued count next to the slider.

- [ ] **W.5** — Wire cost management settings. In the Settings Costs section: read `monthCap` from project settings. Dollar input updates via `PATCH /api/projects/:id` with `settings.monthCap`. Add `warningThreshold` (percentage, default 80%) and `dailyLimit` fields to project settings schema. Wire the cost chart to real `GET /api/dashboard/cost-summary` data. Show real monthly spend vs cap progress bar.

- [ ] **W.6** — Wire auto-routing toggle. In the Settings Workflow section: read `autoRouting` from project settings. Toggle switch updates via `PATCH /api/projects/:id` with `settings.autoRouting`. When toggled OFF: router stops firing after persona completions. When toggled ON: router resumes. Show current state clearly: "Auto-routing: ON — Router agent will automatically transition work items" / "OFF — Manual transitions only".

### Appearance & Data

- [ ] **W.7** — Wire appearance settings. The theme toggle already works (Zustand + localStorage). Add density setting: `comfortable` (current) vs `compact` (tighter padding, smaller text — reduce page padding to `p-4`, card padding to `p-3`, use `text-xs` for body text). Store density preference in Zustand + localStorage. Apply via a CSS class on the root element (`data-density="compact"`) with Tailwind variant or CSS overrides.

- [ ] **W.8** — Wire data management settings. In the Settings Data section: add "Database size" display (query SQLite `page_count * page_size` via a new `GET /api/settings/db-stats` endpoint). Add "Clear execution history" button: `DELETE /api/settings/executions` that deletes all execution records older than 30 days (with confirmation dialog). Add "Export settings" button: `GET /api/settings/export` returns JSON dump of projects, personas, persona-assignments. Add "Import settings": `POST /api/settings/import` accepts the same JSON format.

---

## Sprint 14: Documentation

> Produce comprehensive documentation for the project. Each task covers a distinct aspect.
> All docs go in a `docs/` directory at the monorepo root. Use clear markdown with code examples where relevant.

- [ ] **D.1** — Write project README. Replace the current root `README.md` with a proper project overview: what AgentOps is (one paragraph), key features (bullet list), screenshot or architecture diagram placeholder, quick start (prerequisites, install, run), link to full docs in `docs/`. Keep it concise — this is the first thing someone sees.

- [ ] **D.2** — Write getting started guide. Create `docs/getting-started.md`: prerequisites (Node 22, pnpm), clone + install steps, first run (`pnpm dev`), creating your first project (register a directory), configuring your API key, creating a work item and walking it through states manually, enabling auto-routing for the first time. Step-by-step with expected output at each stage.

- [ ] **D.3** — Document the architecture. Create `docs/architecture.md`: high-level system diagram (monorepo packages, how they connect), frontend stack (React, Vite, Tailwind, shadcn/ui, TanStack Query, Zustand), backend stack (Fastify, SQLite, Drizzle, WebSocket), shared types package, data flow (HTTP requests, WebSocket events, agent execution lifecycle). Include a simple ASCII or mermaid diagram showing the request flow from UI action → API → agent dispatch → execution → WS update → UI refresh.

- [ ] **D.4** — Document the data model. Create `docs/data-model.md`: every entity (WorkItem, Persona, PersonaAssignment, Execution, Comment, Proposal, ProjectMemory, WorkItemEdge) with field descriptions, types, and relationships. Include the WorkItem hierarchy (top-level → child → grandchild), the dependency graph (edges), and how `executionContext` accumulates history. Entity relationship diagram (mermaid or ASCII).

- [ ] **D.5** — Document the workflow system. Create `docs/workflow.md`: the hardcoded state machine (all 8 states, transitions, colors), how items move between states, persona-per-state assignments, the Router agent (what it does, when it fires, how it decides), auto-routing ON vs OFF behavior, parent-child coordination (when parent auto-advances), rejection and retry logic (max retries, structured payloads, escalation to Blocked). Include the state machine diagram with transition arrows.

- [ ] **D.6** — Document the agent personas. Create `docs/personas.md`: what a persona is (system prompt, model, tools, budget), the 5 built-in personas (Product Manager, Tech Lead, Engineer, Code Reviewer, Router) with their roles and default configurations, how to create and edit custom personas, the system prompt layering (persona identity → project context → work item context → execution history), per-persona MCP tool allowlists, the Router as a special persona.

- [ ] **D.7** — Document the API. Create `docs/api.md`: every REST endpoint grouped by resource (projects, work-items, personas, persona-assignments, comments, executions, proposals, dashboard, settings). For each: method, path, request body (with TypeScript type), response body, query parameters, example curl. Document the WebSocket protocol: connection URL, event types and payloads, subscription model.

- [ ] **D.8** — Document the MCP tools. Create `docs/mcp-tools.md`: the AgentOps MCP server and its 7 tools (`post_comment`, `create_children`, `route_to_state`, `list_items`, `get_context`, `flag_blocked`, `request_review`). For each tool: description, input schema (Zod), output format, which personas have access, example usage. Explain how the MCP server is attached to agent sessions.

- [ ] **D.9** — Document configuration and deployment. Create `docs/deployment.md`: the `~/.agentops/` directory structure (config, logs, data), configuration file format and all fields, environment variable overrides, pm2 service management (start/stop/status/logs/install), the CLI commands, log file locations and rotation, database location and backup strategy, how to run in development mode vs production.

- [ ] **D.10** — Document the frontend. Create `docs/frontend.md`: directory structure (`features/`, `pages/`, `components/`, `hooks/`, `stores/`, `mocks/`, `api/`), the feature directory pattern (collocated components + hooks), how views work (List view, Flow view, detail panel), the mock data layer and how to switch between mock/real API mode, state management patterns (TanStack Query for server state, Zustand for UI state), the design system (color tokens, typography scale, component library).
