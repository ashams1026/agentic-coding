# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-30 — D.9: Document configuration and deployment

**Task:** Create `docs/deployment.md` with directory structure, config file, env vars, pm2, CLI commands, logging, database, dev vs prod.

**Done:**
- **`docs/deployment.md`** (new) — Configuration and deployment documentation with:
  - `~/.agentops/` directory structure (config.json, PID file, data/, logs/)
  - Config file format: 4 fields (port, dbPath, logLevel, anthropicApiKey) with types and defaults
  - Resolution order: env vars > config file > defaults
  - 5 environment variable overrides (PORT, AGENTOPS_DB_PATH, DATABASE_URL, LOG_LEVEL, ANTHROPIC_API_KEY)
  - CLI commands: 10 commands (start, stop, status, dev, config, config set, restart, logs, install, uninstall) with details
  - pm2 ecosystem config: script, env, log files, restart policy (max 3 in 60s), kill_timeout (35s)
  - Logging: dev (pino-pretty) vs prod (pino-roll daily rotation, 7-day retention + stdout), 6 log levels
  - Database: location, WAL mode, better-sqlite3 + Drizzle, 9 tables, auto-migrations, backup strategy
  - Cleanup: API endpoint for 30-day old executions + UI path
  - Dev vs prod comparison table (6 aspects)
  - Graceful shutdown sequence (5 steps, 30s drain)
  - Crash recovery (4 steps: find orphaned, reset to failed, log, clear in-memory state)
  - Source files table (5 files)

**Files created:** `docs/deployment.md`

**Notes:** Build: 0 errors. All config fields and defaults verified against `config.ts`. CLI commands verified against `cli.ts`. Logging config verified against `logger.ts`. pm2 config verified against `ecosystem.config.cjs`. Crash recovery verified against `start.ts`.

---

## 2026-03-30 — Review: D.8 (approved)

**Reviewed:** MCP tools documentation — 7 tools, Zod schemas, side effects, persona access, attachment mechanism.
- 7 tool names match `TOOL_NAMES` array in mcp-server.ts ✓
- `post_comment`: Zod schema (workItemId, content, metadata?), output (id, workItemId, authorName, createdAt), side effects (insert agent comment, broadcast comment_created) — all match ✓
- `create_children`: Zod schema (parentId, children[{title, description?, dependsOn?}]), batch index reference via regex, creates in WORKFLOW.initialState, creates depends_on edges, broadcasts state_change per child — all match ✓
- `route_to_state`: Zod schema (workItemId, targetState, reasoning), validates transition, rejection detection (In Review→In Progress→handleRejection), escalation to Blocked after 3, Router comment, audit, coordination, memory — all match ✓
- `list_items`: Zod schema (parentId?, state?, verbosity default "summary"), scoped to project, summary vs detail output fields — match ✓
- `get_context`: Zod schema (workItemId, includeMemory default false), 1000-token memory budget — match ✓
- `flag_blocked`: Zod schema (workItemId, reason), "Blocked: {reason}" comment, state_change broadcast, audit, coordination — match ✓
- `request_review`: Zod schema (workItemId, message), "Review requested: {message}" comment, comment_created broadcast — match ✓
- McpContext: 4 fields match mcp-server.ts:28-37 ✓
- MCP attachment: mcpServers.agentops config with 4 env vars in claude-executor.ts — match ✓
- Tool access matrix: matches seed.ts mcpTools arrays ✓
- Seed name discrepancy note: correctly documents transition_state/create_tasks vs TOOL_NAMES ✓
- Source files: 6 files, all correct ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — D.8: Document the MCP tools

**Task:** Create `docs/mcp-tools.md` with the AgentOps MCP server and its 7 tools, Zod schemas, output formats, persona access, examples.

**Done:**
- **`docs/mcp-tools.md`** (new) — MCP tools documentation with:
  - Overview table of all 7 tools
  - How MCP server attaches to agent sessions: child process via `mcpServers` config in `claude-executor.ts`, env vars (PERSONA_NAME, PERSONA_ID, PROJECT_ID, ALLOWED_TOOLS), stdio transport
  - McpContext interface
  - 7 tool sections, each with: description, Zod input schema, JSON output format, side effects, persona access, example usage
    - `post_comment`: inserts comment, broadcasts WS event
    - `create_children`: creates children in Backlog, creates dependency edges, supports batch index references
    - `route_to_state`: validates transition, detects rejections (escalates after 3), updates state, posts reasoning comment, audit trail, parent coordination, memory generation
    - `list_items`: read-only query with summary/detail verbosity, scoped to project
    - `get_context`: returns work item + execution history + optional project memories (1000-token budget)
    - `flag_blocked`: sets Blocked state, posts reason comment, audit, parent coordination
    - `request_review`: posts review request comment, broadcasts WS event
  - Tool access matrix table (persona x tool)
  - Note about seed data MCP tool name differences vs actual TOOL_NAMES
  - Source files table (6 files)

**Files created:** `docs/mcp-tools.md`

**Notes:** Build: 0 errors. All Zod schemas verified against `mcp-server.ts` tool registrations. Side effects verified against tool handler implementations. Persona access verified against `seed.ts` mcpTools arrays.

---

## 2026-03-30 — Review: D.7 (approved)

**Reviewed:** REST API and WebSocket protocol documentation — 48 endpoints, 9 WS events.
- Endpoint count: 48 total across 11 route files — verified by grep ✓
- Projects (5): CRUD + path validation (existsSync), matches `projects.ts` ✓
- Work Items (6): CRUD + retry + recursive delete, state transition validation + 5 side effects, matches `work-items.ts` ✓
- Work Item Edges (3): GET (or-filter fromId/toId), POST, DELETE, matches `work-item-edges.ts` ✓
- Personas (5): CRUD with defaults (gray icon, 0 budget), matches `personas.ts` ✓
- Persona Assignments (2): GET + PUT upsert (onConflictDoUpdate), matches `persona-assignments.ts` ✓
- Comments (4): CRUD, matches `comments.ts` ✓
- Executions (5): CRUD with 8 updatable fields, matches `executions.ts` ✓
- Proposals (5): CRUD, status-only PATCH, matches `proposals.ts` ✓
- Dashboard (4): stats/cost-summary/execution-stats/ready-work, response types match `api.ts` ✓
- Settings (8): API key CRUD, concurrency, db-stats, clear executions, export, import, matches `settings.ts` ✓
- Audit (1): workItemId + limit (default 50, max 500), matches `audit.ts` ✓
- All 13 request types match `packages/shared/src/api.ts` exactly ✓
- All 4 dashboard response types match `api.ts` ✓
- WebSocket: 9 event types match `ws-events.ts` field-by-field ✓
- WS connection URL `/ws`, welcome message, broadcast model match `ws.ts` ✓
- Source files: 14 files ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — D.7: Document the API

**Task:** Create `docs/api.md` with every REST endpoint, request/response types, curl examples, and WebSocket protocol.

**Done:**
- **`docs/api.md`** (new) — API documentation with:
  - Response format convention (data wrapper, error format)
  - **Projects** (5 endpoints): GET list, GET by ID, POST create with path validation, PATCH update, DELETE
  - **Work Items** (6 endpoints): GET list with parentId/projectId filters, GET by ID, POST create (starts in Backlog), PATCH update with state transition validation + side effects (WS broadcast, dispatch, coordination, memory), POST retry dispatch, DELETE recursive
  - **Work Item Edges** (3 endpoints): GET list with workItemId filter, POST create, DELETE
  - **Personas** (5 endpoints): GET list, GET by ID, POST create, PATCH update, DELETE
  - **Persona Assignments** (2 endpoints): GET list with projectId filter, PUT upsert (onConflictDoUpdate)
  - **Comments** (4 endpoints): GET list with workItemId filter, GET by ID, POST create, DELETE
  - **Executions** (5 endpoints): GET list with workItemId filter, GET by ID, POST create, PATCH update, DELETE
  - **Proposals** (5 endpoints): GET list with workItemId filter, GET by ID, POST create, PATCH update (status), DELETE
  - **Dashboard** (4 endpoints): stats, cost-summary (7-day), execution-stats, ready-work (top 5)
  - **Settings** (8 endpoints): API key CRUD, concurrency stats, DB stats, clear old executions, export, import
  - **Audit** (1 endpoint): query with workItemId filter and limit
  - **WebSocket**: connection URL, welcome message, broadcast model, 9 event types with full TypeScript payloads
  - Source files table (14 files)
  - All request/response types shown as TypeScript interfaces matching `api.ts`

**Files created:** `docs/api.md`

**Notes:** Build: 0 errors. All 48 endpoints verified against route files. Request/response types match `packages/shared/src/api.ts`. WebSocket events match `packages/shared/src/ws-events.ts` (9 event types). Curl examples included for key endpoints.

---

## 2026-03-30 — Review: D.6 (approved)

**Reviewed:** Agent personas documentation — definition, 5 built-in personas, custom personas, prompt layering, tool allowlists, Router.
- Persona interface: all 10 fields match `entities.ts:83-97` ✓
- Product Manager: ID `ps-pm00001`, sonnet, `#7c3aed`, $50, 4 Claude tools, 2 MCP tools — all match seed.ts ✓
- Tech Lead: ID `ps-tl00001`, opus, `#2563eb`, $100, 5 Claude tools, 3 MCP tools — all match seed.ts ✓
- Engineer: ID `ps-en00001`, sonnet, `#059669`, $200, 7 Claude tools, 3 MCP tools — all match seed.ts ✓
- Code Reviewer: ID `ps-rv00001`, sonnet, `#d97706`, $50, 4 Claude tools, 3 MCP tools — all match seed.ts ✓
- Router: ID `ps-rt00001`, haiku, `#6366f1`, $10, 3 MCP tools (as allowedTools), `isSystem: true` — all match seed.ts ✓
- System prompt layering: 4 layers match `buildSystemPrompt()` in claude-executor.ts exactly ✓
- Layer details: project name/path/description/patterns, work item title/id/state/description/parentChain/inheritedContext, execution history with outcome+summary+rejectionPayload ✓
- Router tools: `ROUTER_TOOLS` in router.ts = `["list_items","get_context","route_to_state"]` ✓
- Router lazy creation: `getOrCreateRouterPersona()` described correctly ✓
- MCP tool names: all 7 from `TOOL_NAMES` in mcp-server.ts present ✓
- ALLOWED_TOOLS env var enforcement documented ✓
- Router comparison table: trigger, model, tools, budget, settings, creation all accurate ✓
- Custom persona CRUD: UI and API examples ✓
- Persona assignment: composite key `(projectId, stateName)` ✓
- Source files table: 6 files, all correct ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — D.6: Document the agent personas

**Task:** Create `docs/personas.md` with persona definition, 5 built-in personas, custom personas, prompt layering, MCP allowlists, Router as special persona.

**Done:**
- **`docs/personas.md`** (new) — Persona documentation with:
  - Persona TypeScript interface with field descriptions
  - 5 built-in personas with full detail tables: Product Manager (sonnet, $50, Planning), Tech Lead (opus, $100, Decomposition), Engineer (sonnet, $200, In Progress), Code Reviewer (sonnet, $50, In Review), Router (haiku, $10, automatic)
  - Each persona includes: ID, model, avatar (color+icon), budget, workflow state, Claude tools, MCP tools, role description, system prompt guidelines
  - Creating/editing custom personas (UI and API with curl examples)
  - Persona assignment to workflow states (composite key `projectId, stateName`)
  - 4-layer system prompt assembly: persona identity → project context → work item context → execution history, with ASCII layer diagram
  - Per-persona tool allowlists: `allowedTools` (Claude Code tools) and `mcpTools` (AgentOps MCP tools) with tables showing which personas use which tools
  - Router as special persona: comparison table (trigger, model, tools, budget, settings, creation), lazy creation via `getOrCreateRouterPersona()`
  - Source files table (6 files)

**Files created:** `docs/personas.md`

**Notes:** Build: 0 errors. All persona details verified against `seed.ts` (IDs, models, budgets, tools, system prompts). Prompt layering verified against `buildSystemPrompt()` in `claude-executor.ts`. Router configuration verified against `router.ts`. MCP tool names verified against `TOOL_NAMES` in `mcp-server.ts`.

---

## 2026-03-30 — Review: D.5 (approved)

**Reviewed:** Workflow system documentation — state machine, routing, coordination, rejection.
- 8 states: all colors match `workflow.ts` hex values exactly ✓
- Transition table: all 8 from→to mappings verified against `WORKFLOW.transitions` ✓
- ASCII transition diagram ✓
- Rate limiting: 10/hour verified against `MAX_TRANSITIONS_PER_HOUR` in execution-manager.ts ✓
- Manual + automatic transition modes ✓
- Auto-routing cycle: 8-step sequence ✓
- Persona assignments table with typical roles ✓
- Router: haiku model, 3 tools, lazy creation, autoRouting toggle with code snippet ✓
- Parent-child: all-children-Done auto-advance to "In Review", child-Blocked comment ✓
- Rejection: RejectionPayload matches entities.ts, MAX_REJECTIONS=3 verified, escalation diagram ✓
- Dispatch checks: persona, concurrency, cost cap ✓
- Source files table ✓
- Verdict: **approved**

---

## 2026-03-30 — D.5: Document the workflow system

**Task:** Create `docs/workflow.md` with state machine, transitions, routing, coordination, rejection logic.

**Done:**
- **`docs/workflow.md`** (new) — Workflow documentation with:
  - 8 states table with colors and descriptions
  - ASCII transition diagram + exact transition map table
  - Rate limiting (10/hour per work item)
  - Manual vs automatic transitions explanation
  - Auto-routing cycle (8-step sequence)
  - Persona-per-state assignments table with typical personas
  - Router agent: how it works (5-step), configuration (haiku model, 3 tools), auto-routing toggle
  - Parent-child coordination: all-children-Done auto-advance, child-Blocked notification
  - Rejection/retry: structured RejectionPayload, 3-retry max, escalation to Blocked, retry visibility
  - Dispatch checks (persona assigned, concurrency, cost cap)
  - Source files table (5 files)

**Files created:** `docs/workflow.md`

**Notes:** Build: 0 errors. All transitions verified against `workflow.ts`. MAX_REJECTIONS=3 and rate limit=10/hour verified against `execution-manager.ts`. Coordination logic verified against `coordination.ts`.

---

## 2026-03-30 — Review: D.4 (approved)

**Reviewed:** Data model documentation — entities, relationships, hierarchy, edges, executionContext.
- ASCII ER diagram: all 9 entities with relationship cardinality ✓
- 9 entity sections: Project, WorkItem, WorkItemEdge, PersonaAssignment, Persona, Execution, Comment, Proposal, ProjectMemory ✓
- Every field documented with type and description ✓
- WorkItem hierarchy: tree diagram, auto-advance on all-children-Done, blocked notification ✓
- Execution context: TypeScript interface, iterative refinement explanation, system prompt integration ✓
- Dependency graph: 3 edge types (blocks, depends_on, related_to) with semantics ✓
- RejectionPayload: structure + 3-retry escalation to Blocked ✓
- PersonaAssignment composite PK `(projectId, stateName)` ✓
- ProjectMemory consolidation mechanism ✓
- ID format table: 8 prefixes ✓
- Storage: WAL, JSON columns, timestamp format ✓
- All verified against `entities.ts` and `schema.ts` ✓
- Verdict: **approved**

---

## 2026-03-30 — D.4: Document the data model

**Task:** Create `docs/data-model.md` with all entities, fields, relationships, hierarchy, edges, executionContext.

**Done:**
- **`docs/data-model.md`** (new) — Data model documentation with:
  - ASCII entity relationship diagram showing all 9 entities and their relationships
  - 9 entity sections with complete field tables (type, description for every field)
  - WorkItem hierarchy explanation (top-level → child → grandchild, auto-advance, blocked notification)
  - Execution context accumulation pattern (ExecutionContextEntry array, how it feeds system prompts)
  - Dependency graph (3 edge types: blocks, depends_on, related_to)
  - RejectionPayload structure (reason, severity, hint, retryCount, 3-retry escalation)
  - PersonaAssignment composite PK explanation
  - ProjectMemory consolidation mechanism
  - ID format table (8 prefixes with examples)
  - Storage section (SQLite WAL, JSON columns, timestamp format)

**Files created:** `docs/data-model.md`

**Notes:** Build: 0 errors. All field names, types, and relationships verified against both `entities.ts` (shared types) and `schema.ts` (Drizzle schema).

---

## 2026-03-30 — Review: D.3 (approved)

**Reviewed:** Architecture documentation — system diagram, packages, data flow, agent lifecycle.
- ASCII system diagram: browser (5173) ↔ backend (3001) with REST/WS, SQLite, Claude SDK, MCP, shared package ✓
- Shared package: 5 files (entities, api, workflow, ws-events, ids) with contents ✓
- Frontend: 8 directories + 9 key libraries (React 19, Vite, Tailwind v4, shadcn/ui, TanStack Query, Zustand, React Router, Recharts, dnd-kit) ✓
- Backend: 10 files/dirs + 7 key libraries (Fastify, better-sqlite3, Drizzle, WS, Claude SDK, pino, pm2) ✓
- Agent engine: 9 modules table (types, executor, manager, dispatch, router, coordination, concurrency, memory, mcp-server) ✓
- Request lifecycle flow: UI → Query → REST → Drizzle → SQLite → broadcast → WS → invalidation → re-render ✓
- Agent execution lifecycle: state change → dispatch checks → runExecution → spawn → MCP → completion → router → next dispatch ✓
- WebSocket events: 9 types with triggers and cache invalidation targets ✓
- Verdict: **approved**

---

## 2026-03-30 — D.3: Document the architecture

**Task:** Create `docs/architecture.md` with system diagram, package details, data flow, agent lifecycle.

**Done:**
- **`docs/architecture.md`** (new) — Architecture documentation with:
  - ASCII system diagram showing browser ↔ backend ↔ SQLite/Claude/MCP, plus shared package
  - Package breakdown: shared (5 files), frontend (8 directories with key libraries), backend (10 files/dirs with key libraries)
  - Agent execution engine table: 9 files in `agent/` with roles
  - Request lifecycle diagram: UI → TanStack Query → REST → Drizzle → SQLite → broadcast → WS → Query invalidation → re-render
  - Agent execution lifecycle diagram: state change → dispatch checks → runExecution → ClaudeExecutor.spawn → MCP tools → completion → runRouter → next dispatch
  - WebSocket events table: 9 event types with triggers and query cache invalidation targets

**Files created:** `docs/architecture.md`

**Notes:** Build: 0 errors. All file paths, library names, and port numbers verified against actual codebase. Diagrams use ASCII art (not mermaid) for maximum compatibility.

---

## 2026-03-30 — Review: D.2 (approved)

**Reviewed:** Getting started guide — 8-section walkthrough from install to auto-routing.
- Prerequisites: Node 22, pnpm 9 with verify commands ✓
- Installation: clone + pnpm install with workspace note ✓
- First run: pnpm dev, expected output, mock mode explanation ✓
- API key config: both UI (Settings > API Keys, 5 steps) and CLI paths, verify output ✓
- Create project: UI form + curl API example, path validation note ✓
- Create work item: Board view, inline form, Backlog column ✓
- Manual state walk: detail panel dropdown, workflow transition diagram ✓
- Auto-routing: toggle, persona assignments, 5 built-in personas, pipeline watch ✓
- "What's Next" links to 5 other docs ✓
- All UI paths, CLI commands, ports, persona names verified against codebase ✓
- Verdict: **approved**

---

## 2026-03-30 — D.2: Write getting started guide

**Task:** Create `docs/getting-started.md` with step-by-step setup, first project, manual workflow, and auto-routing.

**Done:**
- **`docs/getting-started.md`** (new) — Getting started guide with 8 sections:
  1. Prerequisites (Node 22, pnpm 9 with verify commands)
  2. Installation (clone, pnpm install)
  3. First Run (pnpm dev, expected output, mock mode note)
  4. Configure API Key (UI path: Settings > API Keys + CLI path: npx agentops config)
  5. Create First Project (Settings > Projects form, curl example)
  6. Create a Work Item (Board view, inline form)
  7. Walk Through States Manually (detail panel transition dropdown, valid transitions diagram)
  8. Enable Auto-Routing (toggle, persona assignments table, 5 built-in personas, watch the pipeline)
  - "What's Next" links to other docs

**Files created:** `docs/getting-started.md` (also created `docs/` directory)

**Notes:** Build: 0 errors. All UI paths, CLI commands, and API endpoints verified against actual codebase. Mock mode note explains why data appears without a running backend.

---

## 2026-03-30 — Review: D.1 (approved)

**Reviewed:** Project README — overview, features, quick start, docs links.
- One-paragraph overview: clear, concise, covers local-first + workflow + autonomous pipeline ✓
- 8 key features with bold labels: workflow, personas, hierarchy, monitoring, MCP, cost, memory, local-first ✓
- Architecture: ASCII package tree with tech stacks per package ✓
- Quick start: prerequisites (Node 22, pnpm 9), dev + production sections with correct commands ✓
- Configuration: correct path (`~/.agentops/config.json`), CLI syntax matches `cli.ts` ✓
- Docs table: all 9 docs/* links matching D.2-D.10 filenames ✓
- Development commands: 5 standard scripts ✓
- Concise: 101 lines, no bloat ✓
- Verdict: **approved**

---

## 2026-03-30 — D.1: Write project README

**Task:** Create root README.md with project overview, key features, quick start, docs links.

**Done:**
- **`README.md`** (new) — Project README with:
  - One-paragraph overview (local-first, workflow-driven, autonomous pipeline)
  - 8 key features (workflow engine, personas, hierarchy, monitoring, MCP tools, cost management, project memory, local-first)
  - Architecture diagram (3 packages: frontend/backend/shared with tech stacks)
  - Quick start: prerequisites (Node 22, pnpm 9), install + dev, production pm2 commands
  - Configuration section (config.json path, API key via CLI)
  - Documentation table linking to all 9 docs/* files (D.2-D.10)
  - Development commands section

**Files created:** `README.md`

**Notes:** Build: 0 errors. Kept concise per task spec. Links to docs/ files that will be created by D.2-D.10. No docs/ directory created yet — each doc task will create its own file.

---

## 2026-03-30 — Review: W.8 (approved)

**Reviewed:** Data management settings — DB stats, execution cleanup, settings export/import.
- Backend: `GET /api/settings/db-stats` queries SQLite pragma page_count * page_size, returns sizeMB + entity counts ✓
- Backend: `DELETE /api/settings/executions` uses `lt(startedAt, cutoff)` for 30-day cleanup ✓
- Backend: `GET /api/settings/export` returns JSON of projects, personas, personaAssignments ✓
- Backend: `POST /api/settings/import` iterates arrays with `onConflictDoNothing()` — safe re-imports ✓
- Frontend: `DatabaseInfo` fetches stats on mount with loading skeleton ✓
- Frontend: Export downloads dated JSON file via blob URL ✓
- Frontend: Import uses file input for `.json` with result/error feedback ✓
- Frontend: Clear has 2-click confirmation with 5s auto-dismiss ✓
- API layer: client, mock, and unified wrapper all added consistently ✓
- Build: 0 errors
- Verdict: **approved**
- **Sprint 13 (Settings Wiring) complete** — all 8 tasks (W.1-W.8) approved.

---

## 2026-03-30 — W.8: Wire data management settings

**Task:** Wire the Settings Data section with real backend endpoints for DB stats, execution cleanup, settings export/import.

**Done:**
- **Backend `packages/backend/src/routes/settings.ts`** — Added 4 new endpoints:
  - `GET /api/settings/db-stats` — queries SQLite `page_count * page_size` for DB size, counts executions/projects/personas
  - `DELETE /api/settings/executions` — deletes executions older than 30 days using `lt(executions.startedAt, cutoff)`
  - `GET /api/settings/export` — returns JSON dump of projects, personas, persona-assignments
  - `POST /api/settings/import` — accepts same JSON format, inserts with `onConflictDoNothing()`
- **Frontend `packages/frontend/src/api/client.ts`** — Added `getDbStats()`, `clearExecutionHistory()`, `exportSettings()`, `importSettings()` with typed interfaces
- **Frontend `packages/frontend/src/mocks/api.ts`** — Added mock implementations for all 4 functions
- **Frontend `packages/frontend/src/api/index.ts`** — Added unified wrappers for all 4 functions
- **Frontend `packages/frontend/src/features/settings/appearance-section.tsx`** — Rewired `DataSection`:
  - `DatabaseInfo`: fetches real DB stats on mount, shows size + counts with loading skeleton
  - `DataActionsSection`: Export downloads JSON file via blob URL, Import uses file input for `.json` upload, Clear has 2-click confirmation dialog with 5s timeout
  - Import shows result message (success with counts or error)

**Files modified:** `settings.ts` (backend), `client.ts`, `mocks/api.ts`, `api/index.ts`, `appearance-section.tsx`, `TASKS.md`, `WORKLOG.md`

**Notes:** Build: 0 errors. Import uses `onConflictDoNothing()` so re-importing the same data is safe. Clear only deletes executions > 30 days old (not all). Confirmation dialog auto-dismisses after 5 seconds.

---

## 2026-03-30 — Review: W.7 (approved)

**Reviewed:** Density setting wiring — Zustand store, localStorage persistence, CSS overrides.
- `Density` type ("comfortable" | "compact") added to store with `setDensity` action ✓
- Persisted to localStorage via `partialize` ✓
- `data-density` attribute synced on `documentElement` via `useEffect` in `use-theme.ts` ✓
- CSS `[data-density="compact"]` overrides: page padding 1rem (p-4), card padding 0.75rem (p-3), font-size 0.75rem (text-xs), reduced space-y gaps, compact table rows ✓
- `DensitySection` wired to store (replaces local useState) ✓
- Theme toggle unchanged and still functional ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — W.7: Wire appearance settings

**Task:** Add density setting (comfortable/compact) to Zustand store, persist to localStorage, apply via `data-density` CSS attribute on root element with compact overrides.

**Done:**
- **`packages/frontend/src/stores/ui-store.ts`** — Added `density: Density` state ("comfortable" | "compact"), `setDensity` action, persisted to localStorage via `partialize`
- **`packages/frontend/src/hooks/use-theme.ts`** — Added density sync: `useEffect` sets `data-density` attribute on `document.documentElement` when density changes
- **`packages/frontend/src/index.css`** — Added `[data-density="compact"]` CSS overrides: reduced page padding (`1rem`), tighter card padding (`0.75rem`), smaller body text (`0.75rem`), reduced `space-y-6`/`space-y-4` gaps, compact table row padding
- **`packages/frontend/src/features/settings/appearance-section.tsx`** — Rewired `DensitySection`: reads/writes from Zustand store instead of local `useState`. Imported `Density` type from store.

**Files modified:** `ui-store.ts`, `use-theme.ts`, `index.css`, `appearance-section.tsx`, `TASKS.md`, `WORKLOG.md`

**Notes:** Build: 0 errors. Theme toggle already worked (unchanged). Density follows same pattern as theme: Zustand + localStorage + DOM sync hook. The `data-density` attribute approach allows CSS-only overrides without JS class toggling on individual components.

---

## 2026-03-30 — Review: W.6 (approved)

**Reviewed:** Auto-routing toggle wiring in workflow settings.
- Reads `autoRouting` from project settings, defaults ON (`!== false`) — matches backend `router.ts` line 64 ✓
- Toggle persists via `PATCH /api/projects/:id` with `settings.autoRouting` ✓
- Descriptive state text: ON message / OFF message per spec ✓
- Visual toggle: emerald-500 ON, muted OFF, knob translate-x, `aria-checked` ✓
- Disabled when no project configured ✓
- No backend changes needed — `router.ts` already checks this setting ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — W.6: Wire auto-routing toggle

**Task:** Wire the Settings Workflow auto-routing toggle to read/write `autoRouting` from project settings. Show current state clearly with descriptive text.

**Done:**
- **`packages/frontend/src/features/settings/workflow-config-section.tsx`** — Rewired `AutoRoutingToggle`:
  - Reads `autoRouting` from first project's settings via `useProjects()` (defaults to ON when not set, matching backend behavior in `router.ts` line 64: `if (autoRouting === false) return false`)
  - Toggle switch calls `useUpdateProject()` with `settings.autoRouting` — persists via `PATCH /api/projects/:id`
  - Descriptive text changes based on state: "Auto-routing: ON — Router agent will automatically transition work items" / "Auto-routing: OFF — Manual transitions only"
  - Toggle visually reflects state: emerald-500 when ON, muted when OFF, translate-x for knob position
  - Disabled state when no project configured
  - Added `useProjects`, `useUpdateProject` imports

**No backend changes needed** — `router.ts` already reads `autoRouting` from project settings and skips when `false`.

**Files modified:** `workflow-config-section.tsx`, `TASKS.md`, `WORKLOG.md`

**Notes:** Build: 0 errors. The toggle default is `true` (ON) to match the backend's behavior where `autoRouting` is only disabled when explicitly set to `false`.

---

## 2026-03-30 — Review: W.5 (approved)

**Reviewed:** Cost management settings wiring — monthCap, warningThreshold, dailyLimit, cost chart, progress bar.
- Reads `monthCap` (default 50), `warningThreshold` (default 80%), `dailyLimit` (default 0) from project settings ✓
- All three fields persist via `PATCH /api/projects/:id` through `useUpdateProject()` ✓
- Progress bar uses real `monthTotal` from `useCostSummary()` (→ `GET /api/dashboard/cost-summary`) ✓
- Warning threshold triggers amber alert when spend % exceeds it, danger at 95% ✓
- Daily limit enable/disable toggle (0 ↔ 10) with dollar input ✓
- Cost chart uses real 7-day `dailySpend` data, loading skeleton, empty state ✓
- Disabled inputs when no project configured ✓
- No backend changes needed — `settings` JSON column already supports arbitrary fields ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — W.5: Wire cost management settings

**Task:** Wire the Settings Costs section to read/write `monthCap`, `warningThreshold`, `dailyLimit` from project settings. Wire cost chart to real `GET /api/dashboard/cost-summary` data. Show real monthly spend vs cap progress bar.

**Done:**
- **`packages/frontend/src/features/settings/costs-section.tsx`** — Rewired completely:
  - `CostCapSection`: reads `monthCap` (default 50), `warningThreshold` (default 80%), `dailyLimit` (default 0) from first project's settings via `useProjects()`
  - All three fields update via `useUpdateProject()` with `PATCH /api/projects/:id` — immediate effect
  - Progress bar uses real `monthTotal` from `useCostSummary()` hook (backed by `GET /api/dashboard/cost-summary`)
  - Daily limit enable/disable toggles between 0 and 10
  - Disabled state when no project configured
  - `CostHistoryChart`: replaced 30-day mock `generate30DayData()` with real 7-day data from `useCostSummary()`
  - Loading skeleton while data fetches, empty state when no cost data
  - Removed all local `useState` for settings — all values are now derived from project settings API

**No backend changes needed** — `GET /api/dashboard/cost-summary` already reads `monthCap` from project settings. `warningThreshold` and `dailyLimit` are stored in the freeform `settings` JSON column (no schema migration required).

**Files modified:** `costs-section.tsx`, `TASKS.md`, `WORKLOG.md`

**Notes:** Build: 0 errors. The `useMemo` import and `generate30DayData` mock function were removed. Recharts chart now shows 7 days (matching backend's `cost-summary` response) instead of 30 days of fake data.

---

## 2026-03-30 — Review: W.4 (approved)

**Reviewed:** Concurrency settings wiring — backend endpoint, frontend slider, live stats polling.
- Backend: `GET /api/settings/concurrency` returns `{ active, queued }` from concurrency tracker ✓
- Frontend: `ConcurrencySection` reads `maxConcurrent` from project settings via `useProjects()` ✓
- Slider (1-10) updates via `PATCH /api/projects/:id` with `settings.maxConcurrent` ✓
- Change takes effect immediately — `canSpawn()` reads project settings on each call ✓
- Polls stats every 5s, displays "Active: N / Queued: N" below slider ✓
- Disabled state when no project configured ✓
- API client, mock, and unified wrapper all added consistently ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — W.4: Wire concurrency settings

**Task:** Wire the Settings Concurrency section to read/write `maxConcurrent` from project settings. Show active/queued counts.

**Done:**
- **`packages/backend/src/routes/settings.ts`** — Added `GET /api/settings/concurrency` returning `{ active, queued }` from in-memory concurrency tracker
- **`packages/frontend/src/api/client.ts`** — Added `getConcurrencyStats()` with `ConcurrencyStats` interface
- **`packages/frontend/src/mocks/api.ts`** — Added mock `getConcurrencyStats()` returning `{ active: 1, queued: 0 }`
- **`packages/frontend/src/api/index.ts`** — Added unified wrapper
- **`packages/frontend/src/features/settings/api-keys-section.tsx`** — Rewired `ConcurrencySection`:
  - Reads `maxConcurrent` from first project's settings via `useProjects()`
  - Slider change calls `useUpdateProject()` with `settings.maxConcurrent` — takes effect immediately (backend reads on each `canSpawn()`)
  - Polls `GET /api/settings/concurrency` every 5s for live active/queued counts
  - Shows "Active: N / Queued: N" below the slider
  - Disabled state when no project configured

**Files modified:** `settings.ts`, `client.ts`, `mocks/api.ts`, `api/index.ts`, `api-keys-section.tsx`

**Notes:** Build: 0 errors. Tests: 159/159. Backend concurrency limiter already reads `maxConcurrent` from project settings on each `canSpawn()` call — no backend changes needed for the setting to take effect.

---

## 2026-03-30 — Review: W.3 (approved)

**Reviewed:** Project CRUD routes, settings UI wiring, sidebar project switcher.
- Backend: 5 CRUD routes with proper serialization, error codes, 201/204/400/404 ✓
- POST/PATCH: `existsSync()` path validation, 400 with descriptive message ✓
- POST: validates name/path non-empty ✓
- Sidebar: `useProjects()` populates Select, collapsed tooltip, "No projects" fallback ✓
- Settings form: `formError` state, `onSuccess`/`onError` mutation callbacks, inline error with icon ✓
- Error cleared on cancel and new submission ✓
- Build: 0 errors, Tests: 159/159
- Verdict: **approved**

---

## 2026-03-30 — W.3: Wire project CRUD in settings

**Task:** Create backend project CRUD routes with path validation. Wire settings Projects section and sidebar project switcher to real API.

**Done:**
- **`packages/backend/src/routes/projects.ts`** (new) — 5 CRUD routes:
  - `GET /api/projects` — list all projects
  - `GET /api/projects/:id` — get single project
  - `POST /api/projects` — create with `fs.existsSync()` path validation, returns 400 on invalid path
  - `PATCH /api/projects/:id` — update with path validation if path field provided
  - `DELETE /api/projects/:id` — delete project
  - Serializer: dates to ISO, branded ProjectId cast
- **`packages/backend/src/server.ts`** — Registered `projectRoutes`
- **`packages/frontend/src/components/sidebar.tsx`** — Wired project switcher to real data:
  - Uses `useProjects()` hook to fetch project list
  - Select dropdown populated with real projects (name + id)
  - Collapsed tooltip shows first project name
  - Fallback to "No projects" when none exist
- **`packages/frontend/src/features/settings/projects-section.tsx`** — Added validation error display:
  - `formError` state captures mutation errors
  - Inline error message with AlertCircle icon shown below form on create/update failure
  - Error cleared on cancel or new submission
  - Mutations use `onSuccess`/`onError` callbacks instead of fire-and-forget

**Files created:** `packages/backend/src/routes/projects.ts`
**Files modified:** `server.ts`, `sidebar.tsx`, `projects-section.tsx`

**Notes:** Build: 0 errors. Tests: 159/159. Frontend API layer (client, mock, hooks, unified index) already had project functions — only needed backend routes. Path validation: backend checks `existsSync`, frontend checks starts-with-`/`.

---

## 2026-03-30 — Review: W.2 (approved)

**Reviewed:** API key wiring in `claude-executor.ts`.
- `loadConfig()` called fresh at start of every `spawn()` — not cached ✓
- Empty key guard: yields error event with "Anthropic API key not configured. Go to Settings → API Keys." and returns ✓
- Error code `"no_api_key"` — specific, identifiable ✓
- `process.env["ANTHROPIC_API_KEY"]` set before `query()` call ✓
- Error flows through existing pipeline: execution → failed → WS broadcast → toast ✓
- Minimal, focused change — import + 11 lines in spawn() ✓
- Build: 0 errors, Tests: 159/159
- Verdict: **approved**

---

## 2026-03-30 — W.2: Wire API key into agent executor

**Task:** Read API key from config on each execution. Reject with clear error if not configured.

**Done:**
- **`packages/backend/src/agent/claude-executor.ts`** — Added at the start of `spawn()`:
  1. `loadConfig()` call to read API key fresh on every execution (user might update between runs)
  2. If no key: yields `{ type: "error", message: "Anthropic API key not configured. Go to Settings → API Keys.", code: "no_api_key" }` and returns early
  3. Sets `process.env["ANTHROPIC_API_KEY"]` for the SDK before calling `query()`
- Error flows through existing pipeline: `runExecutionStream` catch → DB update to failed → WS broadcast `agent_completed(failure)` → frontend toast via `use-toast-events.ts`

**Files modified:** `packages/backend/src/agent/claude-executor.ts`

**Notes:** Build: 0 errors. Tests: 159/159. The error message includes a unicode arrow (→) pointing to Settings. Setting `process.env` is safe because all executions use the same configured key. The key is read fresh on each `spawn()` call, not cached.

---

## 2026-03-30 — Review: W.1 (approved)

**Reviewed:** API key storage, validation, and Settings UI wiring — `settings.ts`, `api-keys-section.tsx`, API layer.
- Backend: GET (status check), POST (validate via real Anthropic API + store), DELETE (clear) ✓
- `validateAnthropicKey()`: real POST to Anthropic, 401=invalid, else valid, network errors caught ✓
- `maskKey()`: first 12 chars + "...****", short key fallback ✓
- Frontend: fetches status on mount with loading skeleton ✓
- Configured: masked key + green checkmark + Remove button (X icon, destructive) ✓
- Unconfigured: password input + Test connection button ✓
- Test connection = validate + store in one round trip, transitions to configured view on success ✓
- Error messages from backend displayed ✓
- API layer: client + mock + unified index, all 3 functions, typed interfaces ✓
- Build: 0 errors, Tests: 159/159
- Verdict: **approved**
