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

## Sprint 6: O.1–O.20 (data model overhaul + backend) — archived 2026-03-29

*Data layer + UI (O.1–O.10):* Story/Task → WorkItem model. 3-mode view toggle (list/board/flow), filter bar, Zustand store. List view with tree-indent, board with dnd-kit, detail panel.

*Nav + dashboard + cleanup (O.11–O.17):* Sidebar/router/dashboard/activity feed updated for WorkItem model. Workflow config section. 26 old files deleted.

*Backend (O.18–O.20):* Drizzle schema (9 tables), seed script (all entity types), 10 CRUD routes across 3 files. Recursive delete bug fixed on rework.

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

---

## Sprint 8: A.13–A.18 (coordination, concurrency, memory) reviews — archived 2026-03-30

*A.13–A.14 (reviews approved):* Parent-child state coordination (all-children-done→"In Review", child-blocked→system comment). Rejection/retry logic (structured payload, max 3→Blocked). Both reviewed and approved.

*A.15–A.16 (reviews approved):* Concurrency limiter (in-memory Set, canSpawn, FIFO queue with priority). Cost tracking (costUsd accumulation, monthly cap check, cost_update WS broadcast). Both reviewed and approved.

*A.17–A.18 (reviews approved):* Project memory creation (haiku summary on top-level Done, insert project_memories). Memory consolidation/retrieval (threshold-based, getRecentMemories with token budget). Both reviewed and approved.

---

## Sprint 9: Q.1–Q.4 (test infra + early route tests) — archived 2026-03-30

*Q.1 (work + review approved):* Vitest setup — vitest@^4.1.2, root config with `include: ["packages/*/src/**/*.test.ts"]`, test scripts in root/backend/shared.

*Q.2 (work + rejected + rework + approved):* Test DB helper — createTestDb() (in-memory SQLite + Drizzle migrations), seedTestDb() (1 project, 5 personas, 9 work items, etc.), TEST_IDS export. Rejected for TS2532 (`projects[0].id` strict mode), fixed with `!` assertion.

*Q.3 (work + review approved):* Workflow state machine tests — 24 tests covering getValidTransitions (all 8 states), isValidTransition (valid/invalid/unknown), getStateByName, WORKFLOW constants, Blocked transitions, Backlog guard.

*Q.4 (work + rejected + rework + approved):* Work items CRUD route tests — 19 tests via Fastify app.inject(). Found & fixed JSON double-encoding bug in PATCH route (labels, context). Rejected for missing invalid-state-transition test, fixed by adding test documenting route allows Backlog→Done (validation at MCP/workflow level, not route level).

**Key patterns established:** DB mock via getter (`vi.mock("../../db/connection.js", () => ({ get db() { return mockDb.db; } }))`). Agent side-effects mocked (dispatch, coordination, memory). Test DB isolated per test (in-memory SQLite). `vi.hoisted()` for mock functions used in vi.mock factories. `vi.waitFor()` for background async operations. JSON double-encoding bug: Drizzle JSON columns auto-serialize, so manual `JSON.stringify()` causes double-encoding — removed from work-items.ts, personas.ts, executions.ts.

---

## Sprint 9: Q.5–Q.13 (remaining tests) — archived 2026-03-30

*Q.5 (work + review approved):* Persona + persona-assignment route tests — 11 persona tests (CRUD, edge cases), 6 assignment tests (list/filter, upsert). Fixed double-encoding in personas.ts PATCH. 64 tests pass.

*Q.6 (work + review approved):* Comments/executions/proposals route tests — 6 + 7 + 7 = 20 tests. Fixed double-encoding in executions.ts PATCH. 84 tests pass.

*Q.7 (work + review approved):* Work-item-edges route tests — 9 tests (create 3 edge types, list/filter, delete, cycle detection documents no server-side validation). 93 tests pass.

*Q.8 (work + review approved):* Dashboard aggregate route tests — 7 tests (3 empty DB zero baselines + 4 seeded aggregation). 100 tests pass.

*Q.9 (work + review approved):* Concurrency limiter unit tests — 14 tests (canSpawn limits, trackExecution, enqueue, onComplete dequeue with priority + FIFO ordering). 114 tests pass.

*Q.10 (work + review approved):* Parent-child coordination tests — 5 tests (all-done advance, partial no-advance, blocked comment, no double-advance, top-level no-op). 119 tests pass.

*Q.11 (work + review approved):* Dispatch logic tests — 6 tests (spawn on assignment, 3 no-ops, enqueue at limit, spawn under limit). 125 tests pass.

*Q.12 (work + review approved):* MCP tool tests — 10 tests via MCP Client + InMemoryTransport (post_comment, create_children, route_to_state, flag_blocked, list_items, get_context). 135 tests pass.

*Q.13 (work + rejected + rework + approved):* Execution manager lifecycle tests — 10 tests (runExecution create/success/failure, canTransition rate limiting, handleRejection retry/blocked/payload). Initially rejected for no-op rate-limiting test; fixed by exporting `recordTransition` + `clearTransitionLog`. 145 tests pass.

---

## Sprint 10: P.1–P.10 (UI polish, design system, filtering, detail panel) — archived 2026-03-30

*Design system (P.1–P.4, all approved):* P.1: Semantic typography scale via Tailwind `@utility` (text-page-title, text-section-title, text-body, text-label, text-caption). P.2: Button/badge sizing convergence (sm/default), CVA sm variant for badge. P.3: Spacing alignment (p-6 pages, p-4 cards, gap-3 filters, mb-6 headers). P.4: 5-layer dark mode surface depth, WCAG AA 600-level colors, card/bg distinction in light mode.

*Filtering & sorting (P.5–P.7, all approved):* P.5: Debounced text search (200ms), regex highlight, URL sync (?q=). P.6: Multi-select persona and label filters (DropdownMenu with toggles), deterministic label coloring, URL sync. P.7: Sort direction toggle (ArrowUp/Down), secondary sort logic, URL sync (?sortDir=).

*Detail panel (P.8–P.9, all approved):* P.8: Draggable resize handle (4px), percentage-based width (30-70%), persisted to localStorage via Zustand. P.9: transition-all duration-200 on open/close, disabled during resize, always-rendered DOM for CSS transitions.

*Tooltips (P.10, approved):* Radix tooltips on state/priority badges, truncated titles, persona avatars, progress bars, view toggles, icon buttons. Global delay 300ms, sideOffset 4.

**Key patterns:** Tailwind `@utility` for semantic scales. CVA for component variants. Zustand persist for UI preferences (panel width, density). URL params for filter state. DropdownMenuCheckboxItem for multi-select. Transition-disable during resize via ref flag.

---

## Sprint 10: P.11–P.12 + Sprint 11: E.1–E.8 (reviews + work) — archived 2026-03-30

*P.11–P.12 (work + reviews approved):* Loading skeletons (list view 5-row shimmer, detail panel, dashboard cards) and empty states (filter-aware messaging). Hover polish: `hover:bg-muted/50 duration-150`, `focus-visible:ring-2` on all non-button interactive elements, card `hover:shadow-md`. Sprint 10 completed.

*E.1 (work + review approved):* API client response audit — all shapes match backend. Added `showErrorToast()` via Zustand `getState()` to all HTTP helpers. No shape fixes needed (double-encoding fixed in Sprint 9).

*E.2 (review approved):* WS→Query cache invalidation — fixed stale `["stories"]`/`["tasks"]` keys → `["workItems"]`. 8 of 9 event types mapped. Hook wired in RootLayout.

*E.3 (work + review approved):* Agent monitor already wired to real WS events. Added `onReconnect()` callback to RealWsClient, wired `useWsQuerySync` to invalidate queries on reconnect.

*E.4 (work + review approved):* Activity feed wired to real API — `getRecentComments()` added to client/mock/hooks, removed hardcoded mock events. `["comments"]` prefix covers `["comments", "recent"]`.

*E.5 (work + review approved):* Realistic seed — 5 personas with detailed system prompts, persona assignments for 5 states, `autoRouting: true`, Router persona. `"__router__"` → `"Router"` rename.

*E.6 (work + review approved):* Pipeline walkthrough — found 2 bugs: no state transition validation (added `isValidTransition()` check, 400 on invalid), no WS `state_change` broadcast (added after state update). 7-step walkthrough documented.

*E.7 (work + review approved):* Settings field name fix — `maxConcurrentAgents`→`maxConcurrent`, `monthlyCostCap`→`monthCap`. Monthly cost cap was silently never enforced. 6 new tests (cost cap, auto-routing). Pipeline trace verified.

*E.8 (work + review approved):* Parent-child coordination fix — `dispatchForState()` call added after parent auto-advances to "In Review". Without it, reviewer persona was never dispatched. 3 new test assertions.

---

## Sprint 12 (S.9) + Sprint 13 (W.1–W.8) — archived 2026-03-30

*S.9 (work + review approved):* Configuration file `config.ts` — `loadConfig()` with precedence (defaults ← file ← env vars), `setConfigValue()` with validation, `getConfigPath()`. 4 fields: port, dbPath, logLevel, anthropicApiKey. CLI `config` and `config set` commands added to `cli.ts`. Dynamic ESM import. Sprint 12 completed.

*W.1 (work + review approved):* API key management — 3 backend routes in `settings.ts` (GET/POST/DELETE `/api/settings/api-key`). POST validates via real Anthropic API call (401 = invalid). Frontend `ApiKeySection` rewired: masked key display, "Test connection" button, remove button. API client/mock/index layers added.

*W.2 (work + review approved):* API key in executor — `claude-executor.ts` reads key from config on each `spawn()`, rejects with "Go to Settings → API Keys" error if not configured. Sets `process.env["ANTHROPIC_API_KEY"]` for Claude SDK.

*W.3 (work + review approved):* Project CRUD — 5 routes in `projects.ts` (GET list, GET single, POST, PATCH, DELETE) with `existsSync()` path validation. Settings form `formError` state with `AlertCircle`. Sidebar project switcher wired to `useProjects()`.

*W.4 (work + review approved):* Concurrency settings — `ConcurrencySection` reads `maxConcurrent` from project settings via `useProjects()`, slider (1-10) updates via PATCH. `GET /api/settings/concurrency` returns live active/queued counts from concurrency tracker. Polls every 5s.

*W.5 (work + review approved):* Cost management — `monthCap`, `warningThreshold` (default 80%), `dailyLimit` in project settings. Progress bar from real `useCostSummary()`. Cost chart wired to `GET /api/dashboard/cost-summary` (7-day real data replacing 30-day mock). No backend changes needed.

*W.6 (work + review approved):* Auto-routing toggle — `autoRouting` read/written to project settings. Backend `router.ts` already checked `if (autoRouting === false) return false`. Descriptive state text (ON/OFF). Toggle visual: emerald ON, muted OFF.

*W.7 (work + review approved):* Density setting — `Density` type ("comfortable" | "compact") in Zustand store + localStorage. `data-density` attribute synced on root via `useThemeSync`. CSS `[data-density="compact"]` overrides: page padding 1rem, card padding 0.75rem, font-size 0.75rem, reduced gaps, compact table rows.

*W.8 (work + review approved):* Data management — 4 backend endpoints: `GET /api/settings/db-stats` (SQLite pragma), `DELETE /api/settings/executions` (>30 days), `GET /api/settings/export`, `POST /api/settings/import` (onConflictDoNothing). Frontend: real DB size display, export JSON download, import JSON upload, 2-click clear confirmation. Sprint 13 completed.

**Key patterns established:** All settings follow the same frontend pattern: `useProjects()` + `useUpdateProject()` for project settings fields, with `settings` stored as freeform `Record<string, unknown>` JSON. API layer consistently wired across `client.ts`, `mocks/api.ts`, `api/index.ts` with unified `pick()` delegation.

---

## Sprint 14: Documentation D.1–D.10 (work + reviews) — archived 2026-03-30

*D.1 (approved):* README.md — overview, 8 features, package tree, quick start, config, 9-doc table.

*D.2 (approved):* `docs/getting-started.md` — 8 sections: prerequisites, install, first run, API key, project setup, work items, state walk, auto-routing.

*D.3 (approved):* `docs/architecture.md` — ASCII system diagram, 3 package tables, agent engine 9 modules, request/agent lifecycles, 9 WS events.

*D.4 (approved):* `docs/data-model.md` — ASCII ER diagram, 9 entity tables, WorkItem hierarchy, executionContext, dependency graph, IDs, storage.

*D.5 (approved):* `docs/workflow.md` — 8 states, transitions, rate limiting, Router agent, coordination, rejection/retry, dispatch checks.

*D.6 (approved):* `docs/personas.md` — 5 built-in personas (PM/TL/Eng/Rev/Router), 4-layer prompt assembly, tool allowlists, Router comparison.

*D.7 (approved):* `docs/api.md` — 48 REST endpoints across 11 route files, 9 WS event types, TypeScript interfaces, curl examples.

*D.8 (approved):* `docs/mcp-tools.md` — 7 tools (post_comment, create_children, route_to_state, list_items, get_context, flag_blocked, request_review), Zod schemas, side effects, persona access matrix.

*D.9 (approved):* `docs/deployment.md` — ~/.agentops/ structure, config file, 5 env vars, 10 CLI commands, pm2 ecosystem, logging, graceful shutdown, crash recovery.

*D.10 (approved):* `docs/frontend.md` — directory structure, 6 routes, feature pattern, mock layer, TanStack Query + Zustand state, design system (colors, typography, 18 shadcn/ui components, dark mode, density).

---

## Sprint 15: Project Scoping (PS.1–PS.10) — archived 2026-03-30

*PS.1:* Wire project switcher — Select in sidebar wired to useUIStore. *PS.2:* useSelectedProject hook + useProject null-safety. *PS.3:* Scope useWorkItems() to selected project (10 call sites). *PS.4:* Scope dashboard queries (4 backend routes + hooks + call sites). *PS.5:* Scope executions/comments/proposals (3 backend routes + hooks + 9 call sites). *PS.6:* Scope persona assignments, remove hardcoded project IDs. *PS.7:* Empty states for new projects. *PS.8:* Auto-seed 5 default personas on project creation. *PS.9:* Audit all 8 backend routes — all had projectId filtering, no fixes needed. *PS.10:* Folder browser modal for project path. All 10 approved.

---

## Sprint 16: E2E Test Plans — QF.1 + AI.1–AI.9 (work + reviews) — archived 2026-03-30

*QF.1 (work + approved):* API mode toggle — Mock/Live button in status bar (amber/green dots), Settings → Appearance card selector, health check on Live switch, toast + revert on failure. Files: `status-bar.tsx`, `appearance-section.tsx`.

*AI.1 (work + approved):* Test plan infrastructure — `tests/e2e/plans/` + `tests/e2e/results/` directories, README (framework overview, 5 prerequisites, 6 MCP tools), `_template.md` (5 sections: Objective, Prerequisites, Steps, Expected Results, Failure Criteria).

*AI.2 (work + approved):* Dashboard test plans — `dashboard-stats.md` (11 steps: 4 stat cards, agent strip, cost chart, activity, upcoming work), `dashboard-navigation.md` (12 steps: card clicks → target pages, back-nav, "View all" link).

*AI.3 (work + approved):* Work Items test plans — `work-items-list-view.md` (14 steps: list view, filter bar, badges, expand/collapse, detail panel), `work-items-create.md` (9 steps: "Add" button, defaults, detail panel).

*AI.4 (work + approved):* Flow View test plan — `work-items-flow-view.md` (13 steps: 8 state nodes, SVG arrows, counts, node click filtering, empty state).

*AI.5 (work + approved):* Detail Panel test plans — `detail-panel-view.md` (16 steps: all 11 sections), `detail-panel-edit.md` (17 steps: 5 edit types + persistence).

*AI.6 (work + approved):* Filtering test plans — `work-items-filtering.md` (14 steps: search, highlight, state/priority filters, clear), `work-items-sorting.md` (12 steps: sort field/direction).

*AI.7 (work + approved):* Agent Monitor test plans — `agent-monitor-layout.md` (9 steps: tabs, empty state), `agent-monitor-history.md` (14 steps: stats, filters, table, expand).

*AI.8 (work + approved):* Activity Feed test plan — `activity-feed.md` (14 steps: events, date groups, 11-type filter, persona/date filters).

*AI.9 (work + approved):* Settings test plans — `settings-projects.md` (11 steps), `settings-workflow.md` (12 steps), `settings-appearance.md` (11 steps).

---

## Sprint 16 (continued): AI.10–AI.V2 — Test Plans, Execution, Visual Inspection (2026-03-30)

**Test plan writing (AI.10–AI.11):**
*AI.10 (work + approved):* Persona Manager test plan — `persona-manager.md` (19 steps: card grid, editor, 6 field sections, edit+save, persistence).
*AI.11 (work + approved):* Cross-cutting test plans — `navigation.md` (19 steps: 6 nav items, collapse/expand, mobile hamburger), `dark-mode.md` (19 steps: System/Light/Dark toggle, 5-page dark mode check, Settings sync), `keyboard-shortcuts.md` (17 steps: Cmd+K palette, search, arrow nav, enter select, escape).

**Test execution (AI.12–AI.17, all approved):**
*AI.12:* `dashboard-stats.md` — 11/11 PASS. All stat cards, agent strip, cost chart, recent activity, upcoming work.
*AI.13:* `dashboard-navigation.md` — 12/12 PASS. All 6 nav items link correctly, back navigation works.
*AI.14:* `work-items-list-view.md` — 14/14 PASS. Group headers, expand/collapse children, detail panel open.
*AI.15:* `work-items-create.md` — 9/9 PASS. Add item form, validation, new item appears in list.
*AI.16:* `work-items-flow-view.md` — 13/13 PASS. 8 state nodes, 16 SVG arrows, count match, node click filtering.
*AI.17:* `detail-panel-view.md` — 16/16 PASS. All 11 panel sections + bonus "Pending Proposals".

**Visual inspection template (AI.V1–AI.V2, both approved):**
*AI.V1:* Updated `_template.md` with visual inspection protocol: blockquote, screenshot checkpoint annotations, Visual Quality subsection (7 criteria), Visual Failure Criteria subsection (7 defects).
*AI.V2:* Updated `dashboard-stats.md` (6 checkpoints) and `dashboard-navigation.md` (7 checkpoints) with visual inspection steps, Visual Quality/Failure sections.
