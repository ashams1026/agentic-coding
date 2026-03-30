# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

## Sprint 12: System Service & CLI (continued)

> Sprints 1-11 complete and archived. S.1-S.8 complete and archived. Remaining task below.

### Configuration

- [x] **S.9** — Implement configuration file. Create `packages/backend/src/config.ts`: load config from `~/.agentops/config.json` (JSON for simplicity, not TOML). Config fields: `port` (default 3001), `dbPath` (default `~/.agentops/data/agentops.db`), `logLevel` (default "info"), `anthropicApiKey` (loaded from config or `ANTHROPIC_API_KEY` env var). Env vars override config file. Add `agentops config` CLI command to print current resolved config. Add `agentops config set <key> <value>` to update config file.

---

## Sprint 13: Settings Wiring

> Connect the existing Settings UI to real backend functionality. Every control should actually do something.
> The settings pages already exist from Sprint 4 — this sprint wires them to real APIs and persistence.

### API Key Management

- [x] **W.1** — Implement API key storage and validation. Add `POST /api/settings/api-key` route: accepts `{ key: string }`, validates by making a test call to the Anthropic API (e.g., a minimal `messages.create` with 1 token max), stores the key encrypted (or base64 for MVP) in `~/.agentops/config.json`. Add `GET /api/settings/api-key` that returns `{ configured: boolean, maskedKey: "sk-ant-...****" }` (never return the full key). Add `DELETE /api/settings/api-key` to remove. Wire the Settings API Keys section to these endpoints: input field, "Test connection" button (calls POST, shows success/fail), masked display when configured, remove button.

- [review] **W.2** — Wire API key into agent executor. In `packages/backend/src/agent/claude-executor.ts`: read the API key from config on each execution (don't cache — user might update it). If no key configured, reject dispatch with a clear error: "Anthropic API key not configured. Go to Settings → API Keys." Show this error in the UI as a toast and in the execution record.

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
