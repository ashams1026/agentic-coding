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

## Sprint 17: Agent Pipeline Fixes (consolidated) — completed 2026-03-31

**Sprint 17 (FX.SEC1-FX.DB4, FX.DEV1, FX.SDK2, FX.NAV2, FX.AM1, FX.CMD1, FX.EDIT1, FX.9):** 40 tasks. Command sandbox, mock layer removal (-2283 lines), demo seed, settings fixes, auto-routing play/pause, graceful restart, Flow view redesign, sidebar fix, persona overhauls (all 5 personas), persona detail panel, skills system (entity+DB+browser+injection), router loop defense (3 layers), cost audit, agent monitor UX (identity header, chat thread, log parsing), DB/executor env separation, dev server port-check, SDK native skills, sidebar/e2e bug fixes, activity feed enrichment.

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

---

## Sprint 19: SDK Deep Integration — Hooks & File Checkpointing — archived 2026-03-31

### Sprint 17 Bug Fix — archived 2026-03-31
- [x] **FX.PICO5** — Fixed Pico chat panel scroll overflow (`min-h-0 overflow-hidden` on ScrollArea). *(completed 2026-03-31)*

### Part 2: File Checkpointing — archived 2026-03-31
- [x] **SDK.FC.4** — Added `rewind_execution` MCP tool for Code Reviewer (HTTP delegation to rewind API). *(completed 2026-03-31)*
- [x] **SDK.FC.5** — E2E test plan for file checkpointing rewind (17 steps, 5 parts). *(completed 2026-03-31)*
- [x] **SDK.FC.6** — Executed file checkpointing e2e test (7/17 PASS, 10 SKIP — legacy data). *(completed 2026-03-31)*
- [x] **SDK.FC.7** — Updated docs/architecture.md, docs/api.md, docs/mcp-tools.md with file checkpointing. *(completed 2026-03-31 20:30 PDT)*

### Part 3: Hooks System — archived 2026-03-31
- [x] **SDK.HK.1** — Replaced manual sandbox with PreToolUse hook (`permissionDecision: "deny"`). *(completed 2026-03-31)*
- [x] **SDK.HK.2** — Added PostToolUse audit logging hook (timing, sanitized Bash commands). *(completed 2026-03-31)*
- [x] **SDK.HK.3** — Added SessionStart/SessionEnd hooks (audit trail + `execution_update` WS event). *(completed 2026-03-31)*
- [x] **SDK.HK.4** — Added FileChanged hook broadcasting `file_changed` WS events. *(completed 2026-03-31)*
- [x] **SDK.HK.5** — Agent monitor file changes panel UI (collapsible, real-time via WS). *(completed 2026-03-31)*
- [x] **SDK.HK.6** — E2E test plan: agent monitor file tracking (16 steps, 5 parts). *(completed 2026-04-01)*
- [x] **SDK.HK.7** — Executed file tracking e2e test (4/16 PASS, 12 SKIP — no live agents). *(completed 2026-04-01)*
- [x] **SDK.HK.8** — Updated docs/architecture.md with hooks architecture (7 hooks table, diagram, audit trail). *(completed 2026-04-01)*

### Sprint 17 Bug Fix — archived 2026-04-01
- [x] **FX.PROJ1** — Fixed stale project ID fallback (`retry: false` + auto-select first available project). *(completed 2026-04-01)*

### Part 4: Structured Output — archived 2026-04-01
- [x] **SDK.SO.1** — Added structured output for Router persona (`isRouter` flag, `outputFormat` JSON schema). *(completed 2026-04-01)*
- [x] **SDK.SO.2** — Router decision cards in agent monitor + activity feed (state badge, confidence dot, reasoning). *(completed 2026-04-01)*
- [x] **SDK.SO.3** — E2E test plan: Router structured output (13 steps, 3 parts). *(completed 2026-04-01)*
- [x] **SDK.SO.4** — Executed Router structured output e2e test (5/13 PASS, 8 SKIP — no structured data). *(completed 2026-04-01)*
- [x] **SDK.SO.5** — Updated docs/workflow.md and docs/personas.md with structured Router output. *(completed 2026-04-01)*

### Part 5: Subagent Definitions — archived 2026-04-01
- [x] **SDK.SA.1** — All personas registered as SDK subagents in `query()` options (primary 30 turns, subagents 15). *(completed 2026-04-01)*
- [x] **SDK.SA.2** — SubagentStart/SubagentStop hooks, `parentExecutionId` column, `subagent_started`/`subagent_completed` WS events. *(completed 2026-04-01)*
- [x] **SDK.SA.3** — Nested SubagentCard UI in agent monitor (tree connector, collapsible, child grouping). *(completed 2026-04-01)*
- [x] **SDK.SA.4** — E2E test plan: subagent nesting (12 steps, 4 parts). *(completed 2026-04-01)*
- [x] **SDK.SA.5** — Executed subagent nesting e2e test (1/12 PASS, 11 SKIP — empty DB). *(completed 2026-04-01)*
- [x] **SDK.SA.6** — Updated docs/architecture.md and docs/personas.md with subagent system. *(completed 2026-04-01)*

### Part 6: Effort & Thinking — archived 2026-04-01
- [x] **SDK.ET.1** — Added effort/thinking to PersonaSettings, passed to `query()` options, per-persona defaults in seed. *(completed 2026-04-01)*
- [x] **SDK.ET.2** — Effort & thinking dropdowns in persona editor (Select components, settings merge on save). *(completed 2026-04-01)*
- [x] **SDK.ET.3** — E2E test plan: persona effort & thinking settings (13 steps, 4 parts). *(completed 2026-04-01)*
- [x] **SDK.ET.4** — Executed effort & thinking e2e test (11/13 PASS — full save-persist cycle verified). *(completed 2026-04-01)*
- [x] **SDK.ET.5** — Updated docs/personas.md with effort levels, thinking modes, recommended defaults. *(completed 2026-04-01)*
