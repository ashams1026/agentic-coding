# AgentOps — Completed Tasks Archive

> Completed tasks moved from `TASKS.md` by the cleanup agent. Grouped by sprint/phase.

---

## Sprints 1-3: Scaffolding + UI Screens (consolidated) — completed 2026-03-29

**Sprint 1 (T1.x):** 16 tasks. Monorepo setup (pnpm workspaces, TS strict, ESLint/Prettier), frontend foundation (Vite+React 19, Tailwind CSS, shadcn/ui, React Router, TanStack Query+Zustand, app shell, dark mode), shared types (entities, API contracts), mock data layer (fixtures, API service, hooks, WebSocket, demo mode).

**Sprint 2 (T2.x):** 23 tasks. Dashboard (stat cards, cost chart, agent strip, health indicators, upcoming work), kanban board (columns, drag-and-drop, filters, inline form, transition prompt), story detail (header, description, child tasks, proposals, metadata), task detail (inherited context, dependencies, execution context, rejection history), agent monitor (terminal renderer, split view, active sidebar, history, control bar), activity feed, workflow designer (canvas, state/transition panels, validation, sidebar), persona manager (list, editor, prompt editor, tool config, test run).

**Sprint 3 (T2.9-T2.12 + R.1-R.6):** 11 tasks. Settings page (layout, projects, API keys, cost management, appearance), global components (command palette, toast notifications, loading skeletons, nav badges), WebSocket integration, demo mode, sidebar refinements (spacing, transitions, mobile responsiveness), shared component extraction, story list master-detail view, nested task detail panel.

**Sprint 4 (T3.1.1):** 1 task. Fastify backend scaffold — `buildServer()` factory with CORS, health check, pino-pretty. Port 3001.

---

## Sprint 6: Data Model & UI Overhaul (O.1–O.20) — completed 2026-03-29

**Types & data (O.1–O.6):** 6 tasks. Replaced Story+Task with unified WorkItem, WORKFLOW constant (8 states), mock fixtures (16 items), mock API (WorkItem CRUD), refactored hooks.

**Multi-view UI (O.7–O.11):** 5 tasks. Work items page with List/Board/Tree toggle, list view (tree-indented rows, badges, progress), board view (dnd-kit columns), tree view (hierarchy), detail panel (header, breadcrumb, children, proposals, comments, executions, metadata).

**Nav, dashboard, settings (O.12–O.16):** 5 tasks. Sidebar/router cleanup ("Story Board"→"Work Items"), dashboard updated for WorkItem model, activity feed with router_decision events, workflow configuration section (auto-routing toggle, persona-per-state table, SVG diagram).

**Cleanup & backend (O.17–O.20):** 4 tasks. Deleted 26 old files, Drizzle schema (9 tables), seed script (16 work items, 5 personas), CRUD routes (10 routes across 3 files).

---

## Sprint 5: Backend API Completion — completed 2026-03-29

- [x] **T3.1.3** — Set up Drizzle migrations and seed script (drizzle.config.ts, migrate.ts, generated SQL, 5 npm scripts). *(completed 2026-03-29)*
- [x] **T3.2.5** — Implement comment API routes (4 routes: GET list, GET by id, POST, DELETE). *(completed 2026-03-29)*
- [x] **T3.2.7** — Implement persona API routes (5 routes: GET list, GET by id, POST, PATCH, DELETE). *(completed 2026-03-29)*
- [x] **T3.2.8** — Implement execution API routes (5 routes: GET list, GET by id, POST, PATCH, DELETE). *(completed 2026-03-29)*
- [x] **T3.2.9** — Implement proposal API routes (5 routes: GET list, GET by id, POST, PATCH, DELETE). *(completed 2026-03-29)*
- [x] **T3.2.10** — Implement aggregate/dashboard API routes (4 routes: stats, cost-summary, execution-stats, ready-work). *(completed 2026-03-29)*
- [x] **T3.3.1** — Implement real WebSocket server (@fastify/websocket, broadcast, client tracking). *(completed 2026-03-29)*
- [x] **T3.3.2** — Create API client for frontend (32 functions mirroring mock API, fetch-based). *(completed 2026-03-29)*
- [x] **T3.3.3** — Add API mode toggle to frontend (Zustand apiMode, unified API layer, 8 hooks updated). *(completed 2026-03-29)*
- [x] **T3.3.4** — Connect WebSocket client to real server (RealWsClient, unified WS module, 5 consumers updated). *(completed 2026-03-29)*

---

## Sprint 7: UI Refinements & Flow View — completed 2026-03-29

- [x] **U.1** — Remove tree view. Deleted tree-view.tsx, removed from page/store. *(completed 2026-03-29)*
- [x] **U.2** — Build Flow view. State machine graph with colored nodes, bezier arrows, click-to-filter, avatar stacks, progress bars (~497 lines). *(completed 2026-03-29)*
- [x] **U.3** — Update view toggle. Board→Flow swap, GitBranch icon, URL params, store type. *(completed 2026-03-29)*
- [x] **U.4** — Add inline title editing to detail panel. Click-to-edit h2→input, Enter/blur save, Escape cancel. *(completed 2026-03-29)*
- [x] **U.5** — Add description editing to detail panel. Write/Preview tabs, textarea, Save/Cancel. *(completed 2026-03-29)*
- [x] **U.6** — Add priority and label editing to detail panel. shadcn Select dropdown, pill editor with inline input. *(completed 2026-03-29)*
- [x] **U.7** — Add state transition control to detail panel. Valid-next-state dropdown, persona trigger prompt dialog. *(completed 2026-03-29)*
- [x] **U.8** — Soften agent monitor page chrome. Replaced zinc colors with app tokens in split-view, control-bar, history. *(completed 2026-03-29)*
- [x] **U.9** — Fix bottom padding for status bar. Added pb-8 to main element. *(completed 2026-03-29)*

---

## Sprint 8: Agent Execution Engine (Phase 4 + 5) — completed 2026-03-30

### Agent MCP Server (T5.1)

- [x] **A.1** — Create AgentOps MCP server skeleton. mcp-server.ts with createMcpServer factory, 7 tool stubs with Zod v4 schemas, standalone stdio entry point. *(completed 2026-03-29)*
- [x] **A.2** — Implement post_comment MCP tool. DB insert with agent authorType, WS broadcast. *(completed 2026-03-29)*
- [x] **A.3** — Implement create_children MCP tool. Child work items in Backlog, depends_on edges. *(completed 2026-03-29)*
- [x] **A.4** — Implement route_to_state MCP tool. Transition validation, state update, system comment. *(completed 2026-03-29)*
- [x] **A.5** — Implement read-only MCP tools. list_items, get_context, flag_blocked, request_review. *(completed 2026-03-29)*

### Agent Executor (T5.2 + T5.3)

- [x] **A.6** — Create agent executor interface and types. AgentEvent union (6 variants), AgentTask, SpawnOptions, AgentExecutor interface. *(completed 2026-03-29)*
- [x] **A.7** — Install Claude Agent SDK and create executor. ClaudeExecutor with model mapping, MCP subprocess, SDKMessage→AgentEvent mapping. *(completed 2026-03-29)*
- [x] **A.8** — Implement system prompt assembly. 4-layer buildSystemPrompt (persona, project, work item, execution history). *(completed 2026-03-29)*
- [x] **A.9** — Implement execution lifecycle and streaming. execution-manager.ts with runExecution, DB records, WS streaming, completion/failure handling. *(completed 2026-03-29)*

### Workflow Dispatch & Router (T4.2 + T4.3)

- [x] **A.10** — Implement persona dispatch on state entry. dispatch.ts with dispatchForState, wired into PATCH route. *(completed 2026-03-29)*
- [x] **A.11** — Implement Router agent. router.ts with runRouter, haiku model, lazy __router__ persona, autoRouting check. *(completed 2026-03-29)*
- [x] **A.12** — Wire dispatch and routing into execution lifecycle. Transition rate limiter (10/hour), execution chain: persona→runRouter→dispatchForState. *(completed 2026-03-29)*

### State Coordination & Rejection (T4.4 + T4.5)

- [x] **A.13** — Implement parent-child state coordination. All-children-done→parent "In Review", child blocked→system comment on parent. *(completed 2026-03-29)*
- [x] **A.14** — Implement rejection and retry logic. Retry counter, structured rejection payload, max 3 retries→Blocked. *(completed 2026-03-29)*

### Concurrency & Cost (T5.4)

- [x] **A.15** — Implement concurrency limiter. In-memory tracking, canSpawn(), FIFO queue with priority, wired into dispatch. *(completed 2026-03-29)*
- [x] **A.16** — Implement cost tracking and caps. costUsd accumulation, monthly cap check, cost_update WS broadcast. *(completed 2026-03-29)*

### Project Memory (T5.5)

- [x] **A.17** — Implement project memory creation. Haiku summary on top-level Done, insert into project_memories. *(completed 2026-03-29)*
- [x] **A.18** — Implement memory consolidation and retrieval. Threshold-based consolidation, getRecentMemories with token budget. *(completed 2026-03-29)*

---

## Sprint 9: Testing — completed 2026-03-30

### Test Infrastructure

- [x] **Q.1** — Set up Vitest in the monorepo. vitest@^4.1.2, root config, test scripts in root/backend/shared. *(completed 2026-03-29)*
- [x] **Q.2** — Create test database helper. createTestDb() (in-memory SQLite + migrations), seedTestDb() (realistic fixtures), TEST_IDS. *(completed 2026-03-30)*
- [x] **Q.3** — Test workflow state machine. 24 tests for getValidTransitions, isValidTransition, getStateByName, constants, edge cases. *(completed 2026-03-30)*

### Backend API Integration Tests

- [x] **Q.4** — Test work items CRUD routes. 19 tests: POST (top-level + child), GET (by id, list with filters), PATCH (fields, state transitions), DELETE (leaf + recursive). Found & fixed double-encoding bug in PATCH. *(completed 2026-03-30)*
- [x] **Q.5** — Test persona and persona-assignment routes. 11 persona tests (full CRUD + edge cases), 6 assignment tests (list/filter, upsert). Fixed double-encoding in personas.ts. *(completed 2026-03-30)*
- [x] **Q.6** — Test comments, executions, and proposals routes. 6 comments tests, 7 executions tests, 7 proposals tests. Fixed double-encoding in executions.ts. *(completed 2026-03-30)*
- [x] **Q.7** — Test work-item-edges routes. 9 tests: create 3 edge types, list/filter, delete, cycle detection. *(completed 2026-03-30)*
- [x] **Q.8** — Test dashboard aggregate routes. 7 tests: empty DB baselines, seeded aggregation (stats, cost-summary, execution-stats, ready-work). *(completed 2026-03-30)*

### Agent Logic Unit Tests

- [x] **Q.9** — Test concurrency limiter. 14 tests: canSpawn (under/at/over limit), trackExecution, enqueue, onComplete dequeue (priority + FIFO). *(completed 2026-03-30)*
- [x] **Q.10** — Test parent-child coordination. 5 tests: all-children-done advance, partial no-advance, child blocked comment, no double-advance, top-level no-op. *(completed 2026-03-30)*
- [x] **Q.11** — Test dispatch logic. 6 tests: spawn on assignment, no-op cases (Backlog/Done/non-existent), concurrency limit enqueue, under-limit spawn. *(completed 2026-03-30)*
- [x] **Q.12** — Test MCP tool implementations. 10 tests via MCP Client + InMemoryTransport: post_comment, create_children, route_to_state, flag_blocked, list_items, get_context. *(completed 2026-03-30)*
- [x] **Q.13** — Test execution manager lifecycle. 10 tests: runExecution lifecycle (create/success/failure), canTransition rate limiting (under/at limit, blocking, isolation), handleRejection (retry/blocked/payload). *(completed 2026-03-30)*

---

## Sprint 10: UI Polish & UX Refinements (partial) — completed 2026-03-30

### Design System Tightening

- [x] **P.1** — Standardize typography scale. Semantic text size utilities (`text-page-title`, `text-section-title`, `text-body`, `text-label`, `text-caption`) via Tailwind `@utility` directives. Audited and replaced all `text-[10px]`/`text-[11px]`. *(completed 2026-03-30)*
- [x] **P.2** — Standardize button and badge sizing. Converged to `sm`/`default` for both. Added CVA `sm` size variant to badge. Removed all `text-[10px]` badge variants. *(completed 2026-03-30)*
- [x] **P.3** — Audit and fix spacing alignment. Unified page padding `p-6`, card padding `p-4`, filter bar `gap-3`, header spacing `mb-6` across all pages. *(completed 2026-03-30)*
- [x] **P.4** — Refine color palette for modern feel. 5-layer dark mode surface depth, all colors shifted to 600-level for WCAG AA. Card distinct from background in light mode. *(completed 2026-03-30)*

### Filtering & Sorting Enhancements

- [x] **P.5** — Add text search to work items. Debounced search input (200ms), regex-based highlight, URL param sync (`?q=`). *(completed 2026-03-30)*
- [x] **P.6** — Add persona and label filters. Multi-select DropdownMenu dropdowns with toggle actions, deterministic label coloring, URL sync (`?personas=`, `?labels=`). *(completed 2026-03-30)*
- [x] **P.7** — Add sort direction toggle and secondary sort. ArrowUp/ArrowDown toggle, direction multiplier, secondary sort (priority→created, dates→priority), URL sync (`?sortDir=`). *(completed 2026-03-30)*

### Detail Panel Improvements

- [x] **P.8** — Make detail panel resizable. Draggable 4px resize handle, percentage-based width (30-70%), persisted to localStorage via Zustand. *(completed 2026-03-30)*
- [x] **P.9** — Add visual divider and panel transition. `transition-all duration-200` on open/close, disabled during active resize. Always-rendered DOM pattern for CSS transitions. *(completed 2026-03-30)*

### Tooltips & Micro-Interactions

- [x] **P.10** — Add tooltips across the app. Radix tooltips on state/priority badges, truncated titles, persona avatars, progress bars, view toggles, icon buttons. Global delay 300ms, sideOffset 4. *(completed 2026-03-30)*
- [x] **P.11** — Add loading and empty states. Skeleton loading states (work items list, detail panel, flow view, dashboard cards) and empty states with helpful messaging. *(completed 2026-03-30)*
- [x] **P.12** — Polish hover states and transitions. Audited all interactive elements for hover feedback, active/selected states, focus-visible rings. *(completed 2026-03-30)*

---

## Sprint 11: End-to-End Integration — completed 2026-03-30

### Frontend ↔ Backend Wiring

- [x] **E.1** — Fix API client response parsing. Audited client.ts response shapes, fixed mismatches with backend, added error handling with toast notifications. *(completed 2026-03-30)*
- [x] **E.2** — Wire TanStack Query cache invalidation to WebSocket events. state_change→workItems+dashboardStats, comment_created→comments, agent events→executions+dashboardStats. *(completed 2026-03-30)*
- [x] **E.3** — Wire agent monitor to real WebSocket streaming. Connected terminal renderer to real agent_output_chunk events, mapped payloads to DisplayItem types. *(completed 2026-03-30)*
- [x] **E.4** — Wire activity feed to real WebSocket events. Replaced mock-based useBaseActivityEvents() with real API call + WS event conversion. *(completed 2026-03-30)*

### Pipeline Smoke Test

- [x] **E.5** — Create development seed with realistic pipeline data. 5 personas with real system prompts, persona assignments for all workflow states, autoRouting:true, Router persona. *(completed 2026-03-30)*
- [x] **E.6** — Manual pipeline walkthrough and fix. Fixed state transition validation (isValidTransition) and WS state_change broadcast in PATCH route. *(completed 2026-03-30)*
- [x] **E.7** — Fix dispatch trigger on state change. Fixed settings field name mismatch (maxConcurrentAgents→maxConcurrent, monthlyCostCap→monthCap). Monthly cost cap was never enforced. Added router auto-routing tests. *(completed 2026-03-30)*
- [x] **E.8** — Fix parent-child coordination in real flow. Added dispatchForState() call after parent auto-advances to "In Review" so reviewer persona actually gets dispatched. *(completed 2026-03-30)*
