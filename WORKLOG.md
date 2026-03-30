# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-30 — PS.2: Create useSelectedProject hook

**Task:** Create `use-selected-project.ts` hook as single source of truth for the selected project.

**Done:**
- Created `packages/frontend/src/hooks/use-selected-project.ts`: reads `selectedProjectId` from `useUIStore`, fetches full project via `useProject(id)`, returns `{ project, projectId, isLoading }`
- Updated `useProject` in `use-projects.ts` to accept `ProjectId | null` with `enabled: !!id` — prevents broken fetch when no project is selected
- Exported `useSelectedProject` from `hooks/index.ts` barrel

**Files created:** `packages/frontend/src/hooks/use-selected-project.ts`
**Files modified:** `packages/frontend/src/hooks/use-projects.ts`, `packages/frontend/src/hooks/index.ts`

**Notes:** `useProject` previously only accepted `ProjectId` (non-null). Updated to accept null with `enabled` guard so downstream hooks like `useSelectedProject` work correctly when no project is selected. Build: 0 errors.

---

## 2026-03-30 — Review: PS.1 (approved)

**Reviewed:** Sidebar project switcher wiring to selectedProjectId.
- Controlled Select: `value={selectedProjectId ?? undefined}` + `onValueChange` → `setSelectedProjectId` ✓
- Auto-select useEffect: correct guard (`!selectedProjectId && projectsList?.length > 0`), non-null assertion safe after length check ✓
- Collapsed tooltip: `.find()` lookup by selectedProjectId with fallback ✓
- Persistence: `selectedProjectId` already in Zustand `partialize` (ui-store.ts:47) ✓
- Conventions: named export, cn(), shadcn/ui Select, no hardcoded text ✓
- Build: 0 errors ✓
- Verdict: **approved**

---

## 2026-03-30 — PS.1: Wire project switcher to selectedProjectId

**Task:** Wire the sidebar project switcher to read/write `selectedProjectId` from the UI store, auto-select first project on load, persist selection.

**Done:**
- Changed `<Select>` in sidebar from uncontrolled (`defaultValue`) to controlled (`value` + `onValueChange`) wired to `selectedProjectId`/`setSelectedProjectId` from `useUIStore`
- Added `useEffect` to auto-select the first project on initial load when `selectedProjectId` is null
- Updated collapsed sidebar tooltip to show the selected project name instead of hardcoded first project
- Selection persists via existing Zustand `persist` config (already in `partialize`)

**Files modified:** `packages/frontend/src/components/sidebar.tsx`

**Notes:** The UI store already had `selectedProjectId` and `setSelectedProjectId` — just needed wiring. Build: 0 errors.

---

## 2026-03-30 — Review: D.10 (approved)

**Reviewed:** Frontend documentation — directory structure, views, mock layer, state management, design system.
- Directory structure: all files/dirs verified against filesystem (api/4, mocks/4, features/10, pages/6, components/3+ui/18, hooks/13, stores/4) ✓
- Routes: 6 routes match `router.tsx` exactly (/, /items, /agents, /activity, /personas, /settings) ✓
- Feature directories: work-items (5 files), agent-monitor (7 files) verified against filesystem ✓
- View modes: "list" and "flow" match viewOptions in `work-items.tsx:15-18`, URL sync via searchParams ✓
- Mock layer: pick(mockFn, realFn) reading apiMode from UI store, delegates to mocks/api or api/client — match `api/index.ts` ✓
- Fixtures: 772 lines (~800 documented) ✓
- UI store: 6 fields with correct types, defaults, and 5 persisted fields (excluding mobileSidebarOpen) — match `ui-store.ts` ✓
- Persona colors: 5 tokens match `index.css:60-64` ✓
- Status colors: 7 tokens match `index.css:67-73` ✓
- Priority colors: 4 tokens match `index.css:76-79` ✓
- Typography: 5 utilities match `index.css:25-52` ✓
- shadcn/ui: 18 components match `components/ui/` filesystem listing ✓
- Dark mode: .dark class + HSL overrides ✓; Density: data-density compact overrides ✓
- Source files: 9 files ✓
- Build: 0 errors
- Verdict: **approved**
- **Sprint 14 (Documentation) complete** — all 10 tasks (D.1-D.10) approved.

---

## 2026-03-30 — D.10: Document the frontend

**Task:** Create `docs/frontend.md` with directory structure, feature pattern, views, mock layer, state management, design system.

**Done:**
- **`docs/frontend.md`** (new) — Frontend documentation with:
  - Full directory tree (14 directories/files in src/ with descriptions)
  - Route table (6 routes: /, /items, /agents, /activity, /personas, /settings)
  - Feature directory pattern: collocated components with examples (work-items: 5 files, agent-monitor: 7 files)
  - Work items views: List View (table with sorting/filtering) and Flow View (dependency graph), URL-synced view state
  - Detail panel: resizable side panel with work item info, children, timeline, comments, proposals, transitions
  - Mock data layer architecture: api/index.ts → pick(mockFn, realFn) → mocks/api.ts or api/client.ts
  - Mock/API mode switching via Settings UI, localStorage persistence, fixture data (~800 lines)
  - State management: TanStack Query for server state (query keys factory, mutations with invalidation, WS sync), Zustand for UI state (4 stores: ui, work-items, toast, activity)
  - ui-store fields table: 6 persisted state fields with types and defaults
  - Design system: persona colors (5), status colors (7), priority colors (4), shadcn/ui semantic colors (light+dark)
  - Typography scale: 5 custom utilities (page-title, section-title, body, label, caption)
  - Component library: 18 shadcn/ui components listed
  - Dark mode: light/dark/system via .dark class
  - Density: comfortable/compact via data-density attribute
  - Source files table (9 files)

**Files created:** `docs/frontend.md`

**Notes:** Build: 0 errors. Directory structure verified by listing actual filesystem. Routes verified against `router.tsx`. UI store fields verified against `ui-store.ts`. Color tokens verified against `index.css` @theme blocks. shadcn/ui components verified by listing `components/ui/`.

---

## 2026-03-30 — Review: D.9 (approved)

**Reviewed:** Configuration and deployment documentation — config, CLI, pm2, logging, database, shutdown, recovery.
- AgentOpsConfig: 4 fields match `config.ts:17-22` ✓
- Defaults: port=3001, dbPath=~/.agentops/data/agentops.db, logLevel="info", anthropicApiKey="" match `config.ts:24-29` ✓
- Resolution order: env → file → defaults, null coalescing chain in loadConfig() ✓
- 5 env vars: PORT, AGENTOPS_DB_PATH, DATABASE_URL, LOG_LEVEL, ANTHROPIC_API_KEY match `config.ts:59-74` ✓
- 10 CLI commands: all match switch statement in `cli.ts:285-326` ✓
- start: PID write, duplicate check, startServer ✓; stop: SIGTERM + removePid ✓; status: health + dashboard stats ✓
- dev: tsx watch ✓; config: loadConfig + masked key ✓; config set: setConfigValue ✓
- install: pm2 start+save+startup ✓; uninstall: stop+delete+unstartup+save ✓; logs: --lines 100 ✓; restart ✓
- pm2 ecosystem: name, script, env, log paths, max_restarts=3, min_uptime=60s, kill_timeout=35000 match `ecosystem.config.cjs` ✓
- Logging: dev pino-pretty (NODE_ENV !== production), prod pino-roll daily 7-day + stdout match `logger.ts` ✓
- Graceful shutdown: 5 steps, SHUTDOWN_TIMEOUT_MS=30000 match `start.ts:154-192` ✓
- Crash recovery: find running/pending → failed "Interrupted by server restart" → clear concurrency match `start.ts:36-126` ✓
- Source files: 5 files ✓
- Build: 0 errors
- Verdict: **approved**

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
