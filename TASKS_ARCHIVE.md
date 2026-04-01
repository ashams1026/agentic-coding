# AgentOps — Completed Tasks Archive

> Completed tasks moved from `TASKS.md` by the cleanup agent. Grouped by sprint/phase.

---

## Sprints 1-3: Scaffolding + UI Screens (consolidated) — completed 2026-03-29

**Sprint 1 (T1.x):** 16 tasks. Monorepo setup (pnpm workspaces, TS strict, ESLint/Prettier), frontend foundation (Vite+React 19, Tailwind CSS, shadcn/ui, React Router, TanStack Query+Zustand, app shell, dark mode), shared types (entities, API contracts), mock data layer (fixtures, API service, hooks, WebSocket, demo mode).

**Sprint 2 (T2.x):** 23 tasks. Dashboard, kanban board, story/task detail, agent monitor, activity feed, workflow designer, persona manager.

**Sprint 3 (T2.9-T2.12 + R.1-R.6):** 11 tasks. Settings page, global components (command palette, toasts, skeletons, badges), WebSocket, sidebar refinements.

**Sprint 4 (T3.1.1):** 1 task. Fastify backend scaffold.

---

## Sprints 5-10: Backend + UI Polish (consolidated) — completed 2026-03-30

**Sprint 5 (T3.x):** 10 tasks. Drizzle migrations/seed, 5 resource route sets, WebSocket server, API client (32 functions), API mode toggle.

**Sprint 6 (O.1-O.20):** 20 tasks. Replaced Story+Task with WorkItem, 8-state workflow, multi-view UI (list/board/tree), detail panel, sidebar/router cleanup, Drizzle schema (9 tables), seed (16 items), CRUD routes.

**Sprint 7 (U.x):** 9 tasks. Flow view (state machine graph), inline editing, state transitions, agent monitor polish.

**Sprint 8 (A.1-A.18):** 18 tasks. MCP server (7 tools), ClaudeExecutor, dispatch/router, rate limiter, concurrency, cost tracking, project memory.

**Sprint 9 (Q.1-Q.13):** 13 tasks. 118 tests — workflow state machine (24), API integration (49), agent logic unit tests (45).

**Sprint 10 (P.1-P.12):** 12 tasks. Design system, filtering/search, resizable detail panel, micro-interactions.

---

## Sprints 11-15: Integration + Docs + Settings (consolidated) — completed 2026-03-30

**Sprint 11 (E.1-E.10):** 10 tasks. API client fixes, TanStack cache invalidation, agent monitor WS, activity feed, dev seed, pipeline walkthrough, dispatch trigger fix, parent-child coordination, error handling, stale execution cleanup.

**Sprint 12 (S.1-S.9):** 9 tasks. CLI (start/stop/status/dev), pm2 ecosystem, setup.sh, logging (pino + audit trail), config file.

**Sprint 13 (W.1-W.8):** 8 tasks. API key management, concurrency slider, cost settings, auto-routing toggle, density, data export/import.

**Sprint 14 (D.1-D.10):** 10 docs. README, getting started, architecture, data model, workflow, personas, REST API (48 endpoints), MCP tools, deployment, frontend.

**Sprint 15 (PS.1-PS.10):** 10 tasks. Project scoping (all queries scoped to selected project), empty states, auto-seed personas, folder browser. + QF.1 (API mode toggle).

---

## Sprint 16: AI-Based E2E Testing — completed 2026-03-30

**Phase 1 (AI.1-AI.11):** 11 tasks. Test plan directory + template, 17 test plan files covering all UI screens.

**Phase 1.5 (AI.V1-AI.V11):** 11 tasks. Visual inspection protocol added to all test plans (screenshot checkpoints, Visual Quality/Failure criteria).

**Phase 2 (AI.12-AI.28):** 17 tasks. Executed all test plans via chrome-devtools MCP. 243/253 PASS, 2 FAIL, 4 N/A across 17 suites.

**Phase 2 (AI.29-AI.30):** 2 tasks. dark-mode (19/19 PASS), keyboard-shortcuts (16/17 PASS, 1 FAIL — work item route 404).

**Phase 3 (AI.31):** 1 task. Triage — 263 total steps, 256 PASS, 3 FAIL, 4 N/A (97.3%). Filed FX.CMD1 (Major), FX.EDIT1 (Minor). FX.MOCK1 already tracked.

---

## Sprint 17: Agent Pipeline Fixes (partial) — archived 2026-03-30

### Security & Mock Layer Removal
- [x] **FX.SEC1** — Command sandbox (`sandbox.ts`): validates Bash commands against project directory escapes. *(completed 2026-03-30)*
- [x] **FX.MOCK1** — Removed mock API mode from frontend (apiMode, pick(), status bar toggle, demo controls). *(completed 2026-03-30)*
- [x] **FX.MOCK2** — Deleted mock data layer (mocks/ directory, use-demo.ts, demo-controls.tsx — 2283 lines). *(completed 2026-03-30)*
- [x] **FX.MOCK3** — E2E test database script (seed-e2e.ts, test-e2e.sh, pnpm scripts). *(completed 2026-03-30)*
- [x] **FX.MOCK4** — Demo seed (3 projects, 14 work items, all 8 states, 14 executions). *(completed 2026-03-30)*

### Settings Fixes
- [x] **FX.SET1** — Removed duplicate "Concurrency" nav, renamed "API Keys" → "Agent Configuration". *(completed 2026-03-30)*
- [x] **FX.SET2** — Removed workflow state machine diagram from settings (~135 lines SVG). *(completed 2026-03-30)*

### Settings, UI, Bug Fixes & Persona Overhaul
- [x] **FX.SET3** — Replaced auto-routing toggle with play/pause button (status bar, settings, work items header). *(completed 2026-03-30)*
- [x] **FX.RST1** — Added graceful restart flow with active agent modal, polling, force restart. *(completed 2026-03-30)*
- [x] **FX.FLOW1** — Redesigned Flow view as vertical state machine (CSS flex, Router pills, Blocked branch). *(completed 2026-03-30)*
- [x] **FX.NAV1** — Fixed sidebar nav icon/label stacking, added hover/active states, rounded corners. *(completed 2026-03-30)*
- [x] **FX.PM1** — Added inline system prompt preview to persona cards (expand/collapse, markdown, tool badges). *(completed 2026-03-30)*
- [x] **FX.0** — Fixed `transition_state` → `route_to_state` and `create_tasks` → `create_children` mismatch in all seed files. *(completed 2026-03-30)*
- [x] **FX.P1** — PM persona overhaul: mcpTools fixed, systemPrompt with AC template and anti-patterns. *(completed 2026-03-30)*
- [x] **FX.P2** — TL persona overhaul: mcpTools fixed, systemPrompt with 3-step decomposition workflow. *(completed 2026-03-30)*
- [x] **FX.P3** — Engineer persona overhaul: mcpTools fixed, systemPrompt with 4-step implementation workflow. *(completed 2026-03-30)*
- [x] **FX.P4** — Code Reviewer persona overhaul: mcpTools fixed, systemPrompt with 5-step review workflow. *(completed 2026-03-30)*

### Persona Detail Panel, Skills System & Router Fixes — archived 2026-03-30
- [x] **FX.P5** — Router persona audit: fixed swapped allowedTools/mcpTools, overhauled systemPrompt with valid transitions map. *(completed 2026-03-30)*
- [x] **FX.P6** — SDK tool name verification: confirmed short names, fixed executor `tools: []` bug, fixed MCP env var. *(completed 2026-03-30)*
- [x] **FX.PM2** — Replaced persona card expand with side detail panel (45%/55% split layout). *(completed 2026-03-30)*
- [x] **FX.PM3** — Fixed persona panel to open read-only by default with explicit Edit button. *(completed 2026-03-30)*
- [x] **FX.P7** — Added `skills: string[]` to Persona entity, DB schema, and API contracts. *(completed 2026-03-30)*
- [x] **FX.P8** — Built skill browser modal in persona editor (`.md` file browser, preview, relative paths). *(completed 2026-03-30)*
- [x] **FX.P9** — Skill injection into system prompt (`buildSystemPrompt` section 5, 8000 char cap). *(completed 2026-03-30)*
- [x] **FX.1** — Same-state routing rejection in `route_to_state` MCP tool. *(completed 2026-03-30)*
- [x] **FX.2** — Router transition history awareness (last 3 transitions in dynamic system prompt). *(completed 2026-03-30)*
- [x] **FX.3** — Rate limiter logging: `logger.warn` + system comment + `comment_created` WS broadcast. *(completed 2026-03-30)*

### Router Loop Defense, Cost Fixes & Monitor UX — archived 2026-03-30
- [x] **FX.4** — Transition loop detection: in-memory state history (6 entries, 3-occurrence threshold), auto-Blocked + system comment. *(completed 2026-03-30)*
- [x] **FX.5** — Cost aggregation audit: fixed cents→dollars conversion in 4 dashboard routes + execution serializer. *(completed 2026-03-30)*
- [x] **FX.6** — Persona identity header in terminal renderer (colored avatar, model badge, work item title). *(completed 2026-03-30)*
- [x] **FX.7** — Chat thread restructure: grouped text bubbles, collapsible thinking, tool cards, timestamps. *(completed 2026-03-30)*
- [x] **FX.8** — Historical log chunk type detection: `parseLogLine()` with JSON/tool_call/thinking heuristics. *(completed 2026-03-30)*

### Database & Executor Environment Separation — archived 2026-03-30
- [x] **FX.DB1** — Dev/prod DB separation: `resolveDbPath()` by NODE_ENV, `db:reset` script, startup logging. *(completed 2026-03-30)*
- [x] **FX.DB2** — MockExecutor: simulates agent runs (6 events, configurable delay, costUsd: 0). *(completed 2026-03-30)*
- [x] **FX.DB3** — Executor selection by NODE_ENV: test→mock, prod→claude, dev→env override. Health endpoint + status bar badge. *(completed 2026-03-30)*
- [x] **FX.DB4** — Executor toggle in Settings: two-button UI, runtime swapping via `setExecutorMode()`, hidden in production. *(completed 2026-03-30)*

### Dev Server — archived 2026-03-30
- [x] **FX.DEV1** — Port-check wrapper `scripts/dev.sh`: skips backend/frontend if already running. *(completed 2026-03-30)*

### SDK Skills — archived 2026-03-31
- [x] **FX.SDK2** — Replaced custom skill file injection with SDK native `skills` param in `query()` options. Skills are now SDK skill names, not file paths. *(completed 2026-03-30)*

### Sidebar & E2E Bug Fixes — archived 2026-03-31
- [x] **FX.NAV2** — Ground-up sidebar navigation fix: horizontal layout, hover/active states, 3px primary left border, fixed 224px width. *(completed 2026-03-31)*
- [x] **FX.AM1** — Agent monitor empty state: "Go to Story Board" → "Go to Work Items", link target `/board` → `/items`. *(completed 2026-03-31)*
- [x] **FX.CMD1** — Command palette: work item navigation via Zustand `setSelectedItemId` + navigate to `/items`. *(completed 2026-03-31)*
- [x] **FX.EDIT1** — List row reactivity: optimistic update via `setQueriesData` with prefix key matching. *(completed 2026-03-31)*

### Activity Feed — archived 2026-03-31
- [x] **FX.9** — Enriched event descriptions: persona names, work item titles, state change details via lookup maps. *(completed 2026-03-31)*

---

## Sprint 18: Pico — Project Assistant (partial) — archived 2026-03-31

### Backend: Pico Persona & Chat API — archived 2026-03-31
- [x] **PICO.1** — Added Pico as built-in system persona: `isAssistant` flag, seed data, non-editable/non-deletable in UI. *(completed 2026-03-31)*
- [x] **PICO.2** — Chat session API: `chat_sessions`/`chat_messages` tables, 4 CRUD endpoints, Drizzle migration. *(completed 2026-03-31)*
- [x] **PICO.3** — Chat streaming endpoint: `POST /api/chat/sessions/:id/messages`, SSE streaming via Claude SDK `query()`, 6 event types. *(completed 2026-03-31)*
- [x] **PICO.4** — Pico project knowledge skill: `pico-skill.md` (~700 tokens), injected into system prompt, docs/ directory guidance. *(completed 2026-03-31)*

### Frontend: Chat Interface — archived 2026-03-31
- [x] **PICO.5** — Floating chat bubble: 56px circle, bottom-right, dog icon, bounce animation, unread indicator. *(completed 2026-03-31)*
- [x] **PICO.6** — Chat panel: 400x500px, header/messages/input, typing indicator, animate open/close. *(completed 2026-03-31)*
- [x] **PICO.7** — Chat message components: user/assistant bubbles, markdown, thinking blocks, tool cards, code blocks. *(completed 2026-03-31)*
- [x] **PICO.8** — Wired chat panel to streaming API: `use-pico-chat.ts` hook, SSE parser, session persistence in Zustand. *(completed 2026-03-31)*
- [x] **PICO.9** — Session management: dropdown, switch, rename, clear all, auto-generated titles. *(completed 2026-03-31)*

### Pico Personality & Polish — archived 2026-03-31
- [x] **PICO.10** — Personality polish: welcome message, 4 quick-action buttons, dog-pun personality guidelines. *(completed 2026-03-31)*

---

## Sprint 17: Agent Pipeline Fixes (remaining SDK tasks) — archived 2026-03-31

### SDK-Native Skills & Tool Discovery — archived 2026-03-31
- [x] **FX.SDK1** — ~~Create SDK discovery endpoint.~~ Superseded by SDK.V2.2. *(completed 2026-03-31)*
- [x] **FX.SDK4** — Replaced filesystem skill browser with SDK capabilities picker (`GET /api/sdk/capabilities`). *(completed 2026-03-31)*

---

## Sprint 19: SDK Deep Integration — Core (partial) — archived 2026-03-31

### Part 1: Infrastructure — V2 Persistent Sessions — archived 2026-03-31
- [x] **SDK.V2.1** — Persistent SDK session manager: lazy singleton, `unstable_v2_createSession()`, retry with backoff, shutdown integration. *(completed 2026-03-31)*
- [x] **SDK.V2.2** — SDK capabilities endpoint: `GET /api/sdk/capabilities` + `POST /api/sdk/reload` using `initializationResult()` Query control method. Unblocked FX.SDK3-6. *(completed 2026-03-31)*
- [x] **SDK.V2.4** — Updated `docs/architecture.md` with V2 session architecture (singleton lifecycle, discovery, Pico integration). *(completed 2026-03-31)*

### Part 2: Infrastructure — File Checkpointing — archived 2026-03-31
- [x] **SDK.FC.1** — Enabled file checkpointing in executor: `enableFileCheckpointing: true`, `checkpointMessageId` column, `CheckpointEvent` type. *(completed 2026-03-31)*
- [x] **SDK.FC.2** — Rewind API endpoint: `POST /api/executions/:id/rewind` with dry-run support, temporary `query()` session, audit trail. *(completed 2026-03-31)*
- [x] **SDK.FC.3** — Rewind button in agent monitor: Undo2 icon, dry-run preview modal, success toast, disabled for legacy executions. *(completed 2026-03-31)*

---

## Sprint 17: Bug Fixes, Testing & License — archived 2026-03-31

### Bug Fixes — archived 2026-03-31
- [x] **FX.PICO1** — Fixed "Pico persona not found" error (stale dev DB, confirmed seed.ts creates Pico correctly). *(completed 2026-03-31)*
- [x] **FX.PICO4** — Fixed CORS headers on Pico SSE endpoint: `reply.header()` + `reply.getHeaders()` instead of raw `writeHead()`. *(completed 2026-03-31)*
- [x] **FX.LIC1** — Added Apache 2.0 LICENSE file and `"license": "Apache-2.0"` to all 4 package.json files. *(completed 2026-03-31)*

### Pico UX Testing — archived 2026-03-31
- [x] **FX.PICO2** — Wrote Pico e2e test plan: 38 steps across 11 parts in `tests/e2e/plans/pico-chat.md`. *(completed 2026-03-31)*
- [x] **FX.PICO3** — Executed Pico e2e test: 30/38 PASS, 4 FAIL (CORS), 4 SKIP. Results in `tests/e2e/results/pico-chat.md`, 8 screenshots. *(completed 2026-03-31)*

### SDK-Native Skills — archived 2026-03-31
- [x] **FX.SDK6** — Exposed available subagents in persona config via SDK `supportedAgents()`. *(completed 2026-03-31)*
