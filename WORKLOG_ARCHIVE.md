# AgentOps — Work Log Archive

> Summarized entries from `WORKLOG.md`. Grouped by sprint/phase.
> Older sections may be consolidated into higher-level summaries as this file grows.

---

## Sprints 1-4 (consolidated) — 2026-03-28 to 2026-03-29

**Sprint 1:** Monorepo setup (pnpm/TS/ESLint/Prettier), React 19 + Vite 8 + Tailwind v4 + shadcn/ui + React Router v7 + TanStack Query + Zustand. App shell with sidebar, dark mode. Entity types with branded IDs. Mock data layer (fixtures, API, hooks, WebSocket, demo mode).

**Sprint 2:** Dashboard (stat cards, agent strip, activity feed, upcoming work, cost chart), kanban board (dnd-kit columns, filters, transition prompts), story detail (all sections), task detail (context, deps, execution, rejections), agent monitor (xterm.js terminal, split view, control bar), activity feed, workflow designer (canvas + panels), persona manager (editor, prompt, tools, test run).

**Sprint 3 (partial):** Settings page (5 sections), global components (command palette, toasts, skeletons, nav badges), WebSocket integration (useWsQuerySync centralized invalidation), demo mode (floating controls overlay).

**Sprint 4 (R.1-R.6):** Sidebar refinements (spacing, transitions, mobile responsive), shared component extraction (CommentStream, ExecutionTimeline → features/common/), story list master-detail view, nested task detail panel.

**Sprint 5 (T3.1.1 only):** Fastify backend scaffold — buildServer() factory with CORS, health check, pino-pretty, port 3001.

**Key patterns:** `cn()` utility, named exports, kebab-case files, `@/` alias, query hooks in `hooks/use-*.ts`, mock data in `mocks/`, Zustand persist, branded IDs, `verbatimModuleSyntax`, `features/common/` for shared UI, mobile sidebar overlay pattern, master-detail with `w-2/5` panels.

---

## Sprint 6: O.1–O.10 — archived 2026-03-29

*Data layer (O.1–O.6):* Replaced Story/Task/Workflow/Trigger types with WorkItem/PersonaAssignment across shared types, mock fixtures (3 top-level + 10 children + 3 grandchildren), mock API (WorkItem CRUD, persona assignments), TanStack Query hooks (use-work-items.ts, use-persona-assignments.ts). Added WORKFLOW constant (8 states, transitions, helpers). All IDs use wi- prefix.

*Multi-view UI (O.7–O.10):* Work items page at /items with 3-mode view toggle, filter bar, Zustand store. List view: tree-indented rows with state/priority badges, progress bars, persona avatars, state grouping. Board view: WORKFLOW columns with dnd-kit drag-and-drop, scope selector, persona trigger prompt. Tree view: pure hierarchy with indent guide lines.

*Detail panel + nav cleanup (O.11–O.17):* O.11: detail-panel.tsx (~280 lines) with header/breadcrumb/children/proposals/comments/executions/metadata, master-detail layout (w-2/5 + w-3/5). O.12: sidebar nav updated ("Work Items" replaces "Story Board", "Workflows" removed). O.13: router cleaned (6 routes, /items added, old routes removed). O.14: dashboard updated for WorkItem model. O.15: activity feed updated with router_decision event type. O.16: workflow-config-section.tsx with auto-routing toggle, persona-per-state table, SVG state machine diagram. O.17: deleted 26 files + 4 old pages, fixed 7 remaining files for WorkItem types — 0 errors.

**Key patterns:** State badges use `${color}20` bg / `${color}40` border from WORKFLOW. priorityConfig record reused across views. WorkItemsStore: view/groupBy/sortBy persisted, filters ephemeral. childStats Map for progress. assignmentMap from personaAssignments + personaMap for triggers.

---

## Sprint 6: O.12–O.20 (nav, routes, backend schema) — archived 2026-03-29

*Navigation & routing (O.12–O.13):* Sidebar "Story Board" → "Work Items" with ListTodo icon, "Workflows" removed, proposals badge on /items. Router: removed 4 old routes, kept 6 clean routes, dashboard links updated to /items.

*Dashboard & activity feed (O.14–O.15):* All story/task references replaced with work item across dashboard (upcoming-work, recent-activity, active-agents-strip) and activity feed. Added router_decision event type. WS events use workItemId/workItemTitle fields.

*Settings & cleanup (O.16–O.17):* Workflow configuration section added to settings (auto-routing toggle, persona-per-state table, SVG state machine diagram). Old code removed: 26 files across 5 directories + 4 pages deleted, 7 remaining files fixed. Frontend typecheck: 0 errors.

*Backend schema & seed (O.18–O.19):* Drizzle schema with 9 tables matching shared entities. Seed script: all 9 entity types matching frontend fixtures (1 project, 5 personas, 16 work items, 4 edges, 4 assignments, 8 executions, 15 comments, 2 proposals, 2 memories). DB connection: WAL mode, FK enforcement.

*Backend CRUD routes (O.20):* 3 route files with 10 routes total: work-items (5 routes with recursive delete), persona-assignments (2 routes with upsert), work-item-edges (3 routes). One review rejection for recursive delete bug (`and()` → `inArray()`), fixed on rework. All routes return `{ data, total }` list / `{ data }` single format.

**Key patterns:** Serializer functions for DB→entity (Date→ISO, branded ID casts). JSON.stringify for JSON-mode columns in PATCH. `createId.*()` for ID generation. PUT to CORS methods for upsert. Dependency-ordered seed inserts.

---

## Sprint 7: U.1–U.9 + Sprint 5 backend + Sprint 8 A.1 — archived 2026-03-29

*Sprint 5 backend (T3.1.3–T3.3.4):* Drizzle migrations/seed script, comment/persona/execution/proposal/dashboard API routes (24 routes total), real WebSocket server, API client for frontend (32 functions), API mode toggle (Zustand apiMode, unified API layer), WebSocket client connection to real server.

*Sprint 7 UI refinements (U.1–U.9):* Removed tree view, built Flow view (state machine graph with bezier arrows, colored nodes, click-to-filter, ~497 lines), updated view toggle (Board→Flow, GitBranch icon), inline title editing (click-to-edit), description editing (Write/Preview tabs), priority dropdown + label pill editor, state transition control (valid-next-state dropdown, persona trigger prompt), softened agent monitor chrome (zinc→app tokens), fixed bottom padding (pb-8).

*Sprint 8 decomposition + A.1:* Decomposed Phase 4+5 into 18 tasks (A.1–A.18). Created MCP server skeleton (mcp-server.ts, createMcpServer factory, 7 tool stubs with Zod v4 schemas, stdio entry point). Installed @modelcontextprotocol/sdk@1.28.0 + zod@4.3.6.

**Key patterns:** MCP server uses `@modelcontextprotocol/sdk/server/mcp.js` subpath import. Zod v4 requires 2-arg `z.record()`. CallToolResult with isError for stubs. Standalone stdio entry point reads context from env vars.

---

## Sprint 8: A.2–A.12 (MCP tools, executor, dispatch, router, wiring) — archived 2026-03-30

*MCP tools (A.2–A.5):* post_comment (DB insert + WS broadcast, agent authorType), create_children (child items in Backlog, depends_on edges with index/ID refs), route_to_state (isValidTransition check, system comment with Router authorName, state_change broadcast), list_items (project-scoped, parentId/state filters, summary/detail verbosity), get_context (work item + executionContext + optional project memories), flag_blocked (state→Blocked + system comment), request_review (system comment, no state change). All 7 tools complete.

*Executor types + SDK (A.6–A.7):* AgentEvent 6-variant union (thinking, tool_use, tool_result, text, error, result), AgentTask/SpawnOptions/AgentExecutor interface. ClaudeExecutor: model alias map (opus/sonnet/haiku), SDK query() with MCP subprocess, permissionMode bypassPermissions, tools:[] (MCP only), SDKMessage→AgentEvent mapping.

*System prompt + lifecycle (A.8–A.9):* 4-layer buildSystemPrompt (persona, project, work item, execution history with rejection details). execution-manager.ts: runExecution creates DB record + WS broadcast, buildAgentTask walks parent chain, runExecutionStream iterates events with WS streaming, completion updates DB (cost as cents, duration, summary, outcome), error handling preserves partial logs.

*Dispatch + router (A.10–A.11):* dispatch.ts: dispatchForState looks up persona assignment, spawns execution, fire-and-forget. router.ts: runRouter checks autoRouting, lazy-creates __router__ persona (haiku, isSystem:true), 3 tools (list_items, get_context, route_to_state).

*Wiring (A.12):* Execution chain: persona→runRouter→dispatchForState. Transition rate limiter: in-memory Map, max 10/hour/workItem, self-cleaning. Both router and dispatch paths gated by canTransition().

**Key patterns:** Non-blocking execution via `.catch()`. Cost as cents in DB. `__router__` persona name as discriminator. authorType "system" for routing comments. broadcast() for all WS events. Serializer functions for DB→entity conversion.
