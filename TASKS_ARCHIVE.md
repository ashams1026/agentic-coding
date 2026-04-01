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

**Sprint 18 (PICO.1-PICO.10):** 10 tasks. Pico project assistant — backend (persona, chat API, SSE streaming, knowledge skill), frontend (bubble, panel, messages, SSE hook, session management), personality polish.

**Sprint 17 (remaining, FX.SDK1, FX.SDK4):** 2 tasks. SDK discovery endpoint (superseded by V2), capabilities picker.

**Sprint 19 (V2.1-V2.2, V2.4, FC.1-FC.3):** 6 tasks. V2 persistent session manager, capabilities discovery, architecture docs, file checkpointing (executor, rewind API, rewind button UI).

---

**Sprint 17 (bug fixes, FX.PICO1, FX.PICO4, FX.LIC1, FX.PICO2-3, FX.SDK6):** 6 tasks. Pico fixes (persona seed, CORS), Apache license, Pico e2e test (30/38 PASS), subagent browser.

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

---

## Sprint 20: SDK Deep Integration — Observability & Safety (partial) — archived 2026-04-01

### Part 1: Real-Time Streaming — archived 2026-04-01
- [x] **SDK.ST.1** — Enabled partial message streaming (`includePartialMessages`, `stream_event` handling, `PartialEvent`). *(completed 2026-04-01)*
- [x] **SDK.ST.2** — Live token streaming UI (rAF batching, streamBuffer, blinking emerald cursor). *(completed 2026-04-01)*
- [x] **SDK.ST.3** — Agent progress summaries (`agentProgressSummaries`, `agent_progress` WS event, emerald bar). *(completed 2026-04-01)*
- [x] **SDK.ST.4** — Rate limit event handling (`api_retry` → inline retry countdown text). *(completed 2026-04-01)*
- [x] **SDK.ST.5** — Context usage display (60s `getContextUsage()` polling, color-coded fill bar). *(completed 2026-04-01)*
- [x] **SDK.ST.6** — E2E test plan: streaming & observability (14 steps, 5 parts). *(completed 2026-04-01)*
- [x] **SDK.ST.7** — Executed streaming e2e test (2/14 PASS, 12 SKIP — no live agents). *(completed 2026-04-01)*
- [x] **SDK.ST.8** — Updated docs/frontend.md with streaming & observability section. *(completed 2026-04-01)*

### Part 2: Safety — SDK Native Sandbox — archived 2026-04-01
- [x] **SDK.SB.1** — SDK native sandbox (`sandbox.enabled`, filesystem/network restrictions, PreToolUse fallback). *(completed 2026-04-01)*
- [x] **SDK.SB.2** — Sandbox config in project settings (`SandboxConfig`/`ProjectSettings` types, Security section UI). *(completed 2026-04-01)*
- [x] **SDK.SB.3** — `canUseTool` permission callback (9 destructive patterns, WebFetch domain check, audit logging). *(completed 2026-04-01)*
- [x] **SDK.SB.4** — E2E test plan: sandbox settings UI (16 steps, 6 parts). *(completed 2026-04-01)*
- [x] **SDK.SB.5** — Executed sandbox settings e2e test (12/16 PASS — full save-persist cycle). *(completed 2026-04-01)*
- [x] **SDK.SB.6** — Updated docs/deployment.md and docs/architecture.md with sandbox docs. *(completed 2026-04-01)*

### Part 3: Dynamic MCP Management — archived 2026-04-01
- [x] **SDK.MCP.1** — Runtime MCP management (`runningQueries` registry, toggle/reconnect/status API routes). *(completed 2026-04-01)*
- [x] **SDK.MCP.2** — MCP status dots in agent monitor (colored dots, tooltip, click-to-reconnect, 30s polling). *(completed 2026-04-01)*
- [x] **SDK.MCP.3** — E2E test plan: MCP status display (13 steps, 5 parts). *(completed 2026-04-01)*
- [x] **SDK.MCP.4** — Executed MCP status e2e test (5/13 PASS, 8 SKIP — API 404s confirmed). *(completed 2026-04-01)*
- [x] **SDK.MCP.5** — Updated docs/mcp-tools.md with dynamic MCP management. *(completed 2026-04-01)*

### Part 4: UX — Prompt Suggestions — archived 2026-04-01
- [x] **SDK.UX.1** — Pico prompt suggestions (`promptSuggestions: true`, SSE suggestion events, pill buttons in chat). *(completed 2026-04-01)*
- [x] **SDK.UX.2** — Model switching for long-running agents (ModelSwitcher component, AlertDialog confirmation). *(completed 2026-04-01)*
- [x] **SDK.UX.3** — In-process MCP server (`createSdkMcpServer`, `tool()` helper, dual server config). *(completed 2026-04-01)*
- [x] **SDK.UX.4** — E2E test plan: Pico suggestions (9 steps, 3 parts). *(completed 2026-04-01)*
- [x] **SDK.UX.5** — Executed Pico suggestions e2e test (1/9 PASS — no API key). *(completed 2026-04-01)*
- [x] **SDK.UX.6** — E2E test plan: model switching (11 steps, 4 parts). *(completed 2026-04-01)*
- [x] **SDK.UX.7** — Executed model switching e2e test (2/11 PASS — empty DB). *(completed 2026-04-01)*
- [x] **SDK.UX.8** — Updated docs/frontend.md with suggestions, model switching, in-process MCP. *(completed 2026-04-01)*

### Regression Testing — archived 2026-04-01
- [x] **SDK.REG.1** — Post-Sprint 19/20 regression sweep (build PASS, 9 smoke tests PASS, 0 regressions). *(completed 2026-04-01)*

---

## Sprint 21: Documentation Refresh (partial) — archived 2026-04-01

- [x] **DOC.1** — Updated getting-started.md (removed mock mode, added demo seed, Pico, dev tips). *(completed 2026-04-01)*
- [x] **DOC.2** — Updated architecture.md (tool count 7→8, audit description, 6 new WS events). *(completed 2026-04-01)*

### Sprint 20 Regression — archived 2026-04-01
- [x] **SDK.REG.2** — Post-Sprint 20 regression (build PASS, 0 regressions, references REG.1). *(completed 2026-04-01)*

### Sprint 21 Documentation (continued) — archived 2026-04-01
- [x] **DOC.3** — Updated data-model.md (table count 9→11, new fields, chat tables, typed settings). *(completed 2026-04-01)*
- [x] **DOC.4** — Updated workflow.md (Router safety features, play/pause UX). *(completed 2026-04-01)*
- [x] **DOC.5** — Updated personas.md (fixed MCP tool names, added Pico persona). *(completed 2026-04-01)*
- [x] **DOC.6** — Updated api.md (12 new endpoints: chat, SDK, MCP, model switching). *(completed 2026-04-01)*
- [x] **DOC.7** — Updated mcp-tools.md (source files table fix). *(completed 2026-04-01)*
- [x] **DOC.8** — Updated deployment.md (dev scripts, seed-demo, audit log). *(completed 2026-04-01)*
- [x] **DOC.9** — Updated frontend.md (mock removal, Pico, directory updates). *(completed 2026-04-01)*

### Backlog Spikes — archived 2026-04-01
- [x] **SDK.FUT.1** — Browser SDK spike (feasible, not recommended — needs WebSocket relay). *(completed 2026-04-01)*
- [x] **SDK.FUT.2** — Bridge API spike (`spawnClaudeCodeProcess`, SSH/Docker/Cloud paths). *(completed 2026-04-01)*
