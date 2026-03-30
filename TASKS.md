# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-13 complete and archived.

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
