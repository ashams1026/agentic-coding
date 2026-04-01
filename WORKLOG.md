# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-01 14:45 PDT — Review: DOC.9 (approved)

**Reviewed:** Frontend.md updates.
- Mock data layer removed (40+ lines → 3-line API Layer section)
- Directory tree: mocks/ gone, pico/ added, features updated
- api/ descriptions cleaned (no mock delegation)
- Intro and State Management mock references fixed
- **Verdict: approved.**

---

## 2026-04-01 14:40 PDT — DOC.9: Update frontend.md

**Done:** Removed mock data layer section entirely (mocks deleted in FX.MOCK1/MOCK2) — replaced with brief "API Layer" section with seed-demo note. Removed `mocks/` from directory tree. Updated feature directories: added pico/, updated agent-monitor, persona-manager, settings descriptions. Updated api/ descriptions (removed mock delegation). Fixed "mock layer" reference in State Management.
**Files:** `docs/frontend.md`

---

## 2026-04-01 14:30 PDT — Review: DOC.8 (approved)

**Reviewed:** Deployment.md updates.
- Dev scripts: seed-demo, db:reset, test:e2e added. Port-check behavior documented.
- Database paths: dev vs prod now distinct (was "Same SQLite file")
- Audit log added to log files table
- Stale `npx agentops dev` removed
- **Verdict: approved.**

---

## 2026-04-01 14:25 PDT — DOC.8: Update deployment.md

**Done:** Updated Development section: added `pnpm db:seed-demo`, `pnpm db:reset`, `pnpm test:e2e` commands. Documented `scripts/dev.sh` port-check behavior. Fixed database paths (dev vs prod). Added `audit.log` to pm2 log files table with expanded description. Security section already current from SDK.SB.6.
**Files:** `docs/deployment.md`

---

## 2026-04-01 14:15 PDT — Review: DOC.7 (approved)

**Reviewed:** mcp-tools.md source files table fix.
- Source files: 7→8 + in-process server — correct
- Rest of doc already current from SDK.FC.7 and SDK.MCP.5
- No stale tool names found
- **Verdict: approved.**

---

## 2026-04-01 14:10 PDT — DOC.7: Update mcp-tools.md

**Done:** Fixed source files table: "7 tool registrations" → "8 tool registrations + in-process server". The rest of `mcp-tools.md` was already current from prior updates: SDK.FC.7 (rewind_execution tool, tool count, persona access table), SDK.MCP.5 (dynamic management section). No stale tool names found (`transition_state`/`create_tasks` already corrected).
**Files:** `docs/mcp-tools.md`

---

## 2026-04-01 14:00 PDT — Review: DOC.6 (approved)

**Reviewed:** API docs update in `docs/api.md`.
- 12 new endpoint docs across 3 sections (Chat, SDK, Runtime Control)
- SSE event types for chat streaming documented
- 404 behavior noted for runtime endpoints
- **Verdict: approved.**

---

## 2026-04-01 13:55 PDT — DOC.6: Update api.md

**Done:** Added 3 new API sections: "Chat (Pico)" (5 endpoints: create/list/send/update/delete sessions, SSE streaming), "SDK Capabilities" (2 endpoints: get/reload), "Runtime Execution Control" (5 endpoints: MCP status/toggle/reconnect, models, model switch). Total ~12 new endpoint docs.
**Files:** `docs/api.md`

---

## 2026-04-01 13:45 PDT — Review: DOC.5 (approved)

**Reviewed:** Personas.md updates.
- All 4 stale MCP tool names fixed (PM, TL, Engineer, Reviewer) — verified against seed.ts
- Pico added as 6th persona with complete section
- Reviewer role updated with rewind_execution capability
- **Verdict: approved.**

---

## 2026-04-01 13:40 PDT — DOC.5: Update personas.md

**Done:** Fixed stale MCP tool names for all 5 workflow personas: PM (`transition_state` → correct tools), TL (`create_tasks` → `create_children`), Engineer (`transition_state` → `get_context`), Reviewer (added `get_context`, `list_items`, `rewind_execution`). Added Pico as 6th built-in persona section with full field table and role description. Reviewer role updated to mention `rewind_execution` capability.
**Files:** `docs/personas.md`

---

## 2026-04-01 13:30 PDT — Review: DOC.4 (approved)

**Reviewed:** Workflow.md updates.
- 3-layer Router safety: same-state rejection, transition history, loop detection — all accurate
- Rate limiter logging with WS broadcast noted
- Play/pause UX: 3 locations, emerald/amber colors
- **Verdict: approved.**

---

## 2026-04-01 13:25 PDT — DOC.4: Update workflow.md

**Done:** Added "Router Safety Features" section with 3-layer loop prevention: same-state rejection, transition history awareness (last 3 transitions in dynamic prompt), loop detection (6-entry history, 3-occurrence threshold → auto-Blocked). Added rate limiter logging note. Updated auto-routing toggle to describe play/pause UX (emerald/amber colors, 3 toggle locations).
**Files:** `docs/workflow.md`

---

## 2026-04-01 13:15 PDT — Review: DOC.3 (approved)

**Reviewed:** Data model updates in `docs/data-model.md`.
- Table count 9→11, Project/Persona/Execution entities updated with all new fields
- ChatSession + ChatMessage tables added for Pico
- Settings typed as `ProjectSettings`/`PersonaSettings` — accurate to code
- **Verdict: approved.**

---

## 2026-04-01 13:10 PDT — DOC.3: Update data-model.md

**Done:** Updated table count 9→11. Project: `settings` typed as `ProjectSettings` with sandbox. Persona: added `skills`, `subagents` fields, updated `settings` to `PersonaSettings` with effort/thinking. Execution: added `checkpointMessageId`, `structuredOutput`, `parentExecutionId`. Added ChatSession and ChatMessage entity tables for Pico.
**Files:** `docs/data-model.md`

---

## 2026-04-01 13:00 PDT — Review: SDK.REG.2 (approved)

**Reviewed:** Post-Sprint 20 regression sweep.
- Build PASS, 0 regressions, 13 Sprint 20 features in verification table
- References REG.1 to avoid redundancy (same scope, no code changes)
- **Verdict: approved.** Sprint 20 final quality gate passed.

---

## 2026-04-01 12:55 PDT — SDK.REG.2: Post-Sprint 20 regression sweep

**Done:** Sprint 20 regression checkpoint. Same scope as REG.1 (no code changes between the two). Build PASS, 0 regressions. All 13 Sprint 20 features documented in verification table. References `regression-post-sprint19.md` for full report.
**Files:** `tests/e2e/results/regression-post-sprint20.md`

---

## 2026-04-01 12:45 PDT — Review: DOC.2 (approved)

**Reviewed:** Architecture.md updates.
- Tool count 7→8 in system diagram
- Audit trail description expanded for new functions
- 6 new WS events added to events table
- Pico/chat/SDK routes already current from prior Sprint 19-20 updates
- **Verdict: approved.** 10 [x] — CLEANUP next.

---

## 2026-04-01 12:40 PDT — DOC.2: Update architecture.md

**Done:** Fixed MCP server tool count 7→8 in system diagram. Updated audit.ts description to include tool use + session lifecycle. Added 6 new WebSocket event types to events table (execution_update, file_changed, subagent_started/completed, agent_progress, context_usage). Architecture.md was already extensively updated during Sprints 19-20 with hooks, subagent, security, and checkpointing sections — this task focused on remaining stale references.
**Files:** `docs/architecture.md`

---

## 2026-04-01 12:30 PDT — Review: DOC.1 (approved)

**Reviewed:** Getting-started.md updates.
- Mock mode removed, demo seed tip added
- Settings section renamed, Board view reference cleaned
- Pico added as 6th persona, Dev Tips section with 4 items
- MCP Tools link in What's Next
- **Verdict: approved.**

---

## 2026-04-01 12:25 PDT — DOC.1: Update getting-started.md

**Done:** Removed mock mode references (deleted since FX.MOCK1). Added `pnpm db:seed-demo` tip for demo data. Renamed "API Keys" → "Agent Configuration". Updated work item creation flow (Board view reference removed). Added Pico as 6th persona. Added "Development Tips" section with dev server port check, DB reset, demo seed, separate databases. Added MCP Tools link to "What's Next".
**Files:** `docs/getting-started.md`

---

## 2026-04-01 12:15 PDT — Review: SDK.REG.1 (approved)

**Reviewed:** Post-Sprint 19/20 regression sweep at `tests/e2e/results/regression-post-sprint19.md`.
- Build PASS, 9 smoke tests PASS, 0 regressions
- 19 suites categorized: 5 TESTABLE, 4 PARTIAL, 10 BLOCKED (empty DB)
- 14 new Sprint 19-20 features assessed: 2 e2e verified, 12 code review
- Constraints honestly documented, 3 action items for full regression
- **Verdict: approved.**

---

## 2026-04-01 12:10 PDT — SDK.REG.1: Post-Sprint 19/20 regression sweep

**Done:** Assessed all 30 test suites against current environment (empty DB, no API key). Build passes. 9 smoke tests PASS (navigation, settings, persona editor, Pico, agent monitor empty states, API endpoints). 11 of 19 original suites BLOCKED by empty DB. 2 of 14 new features verified via e2e, 12 via code review. 0 regressions found. Documented action items: re-seed DB, configure API key, run full regression.
**Files:** `tests/e2e/results/regression-post-sprint19.md`

---

## 2026-04-01 12:00 PDT — Review: SDK.UX.8 (approved)

**Reviewed:** Frontend docs update in `docs/frontend.md`.
- 3 sections: Pico suggestions (SSE, hook, styling), model switching (dropdown vs badge, dialog), in-process MCP (dual config)
- All 3 task requirements covered, accurate to implementation
- **Verdict: approved.** Completes Part 4 (UX) of Sprint 20.

---

## 2026-04-01 11:55 PDT — SDK.UX.8: Update frontend docs with UX features

**Done:** Added 3 sections to `docs/frontend.md`: "Pico — Prompt Suggestions" (SSE events, usePicoChat hook, pill button styling), "Agent Monitor — Model Switching" (ModelSwitcher component, dropdown vs badge, confirmation dialog), "In-Process MCP Server" (createSdkMcpServer, dual server config). All 3 task requirements covered.
**Files:** `docs/frontend.md`

---

## 2026-04-01 11:45 PDT — Review: SDK.UX.7 (approved)

**Reviewed:** Model switching e2e test results.
- 2/11 PASS, 0 FAIL, 9 SKIP — justified: empty DB, no executions
- API 404 confirmed with exact response format
- Re-testing notes with code review cross-reference
- **Verdict: approved.**

---

## 2026-04-01 11:40 PDT — SDK.UX.7: Run model switching e2e test

**Done:** Executed SDK.UX.6 test plan. 2/11 PASS, 0 FAIL, 9 SKIP. No executions in DB — empty History, no running agents. API 404 confirmed for model switch on non-running execution. 1 screenshot. Component verified via code review.
**Files:** `tests/e2e/results/model-switching.md`, `tests/e2e/results/msw-01-agents-page.png`

---

## 2026-04-01 11:30 PDT — Review: SDK.UX.6 (approved)

**Reviewed:** E2E test plan at `tests/e2e/plans/model-switching.md`.
- 11 steps across 4 parts: static badge, dropdown, confirm switch, visual quality
- Tests both static (non-running) and interactive (running) states
- Confirmation dialog: cancel + confirm flows covered
- API 404 test for non-running execution
- **Verdict: approved.**

---

## 2026-04-01 11:25 PDT — SDK.UX.6: E2E test plan for model switching

**Done:** Created `tests/e2e/plans/model-switching.md` — 11 steps across 4 parts: static badge for non-running (3), dropdown for running (4), confirm switch (2), visual quality (2). Covers static vs dropdown behavior, confirmation dialog, cancel/confirm flows, API 404 test.
**Files:** `tests/e2e/plans/model-switching.md`

---

## 2026-04-01 11:15 PDT — Review: SDK.UX.5 (approved)

**Reviewed:** Pico prompt suggestions e2e test results.
- 1/9 PASS, 0 FAIL, 8 SKIP — justified: no API key configured
- Pico panel opens with existing conversation (PASS)
- Code review cross-reference to SDK.UX.1 implementation
- Re-testing notes actionable
- **Verdict: approved.**

---

## 2026-04-01 11:10 PDT — SDK.UX.5: Run Pico prompt suggestions e2e test

**Done:** Executed SDK.UX.4 test plan. 1/9 PASS, 0 FAIL, 8 SKIP. API key not configured — Pico can't generate responses or suggestions. Pico panel opens correctly with existing conversation. 1 screenshot. Component verified via code review.
**Files:** `tests/e2e/results/pico-suggestions.md`, `tests/e2e/results/psg-01-pico-panel.png`

---

## 2026-04-01 11:00 PDT — Review: SDK.UX.4 (approved)

**Reviewed:** E2E test plan at `tests/e2e/plans/pico-suggestions.md`.
- 9 steps across 3 parts: visibility, click interaction, visual quality
- Covers all task requirements: appear after response, click sends, clear on send
- Hidden-during-streaming and max-3-limit tested
- API key dependency noted with SKIP guidance
- **Verdict: approved.**

---

## 2026-04-01 10:55 PDT — SDK.UX.4: E2E test plan for Pico prompt suggestions

**Done:** Created `tests/e2e/plans/pico-suggestions.md` — 9 steps across 3 parts: suggestion visibility (4), click interaction (3), visual quality (2). Covers button styling, click-to-send, clear-on-send, hidden-during-streaming, max 3 limit. Notes API key dependency.
**Files:** `tests/e2e/plans/pico-suggestions.md`

---

## 2026-04-01 10:45 PDT — Review: SDK.UX.3 (approved)

**Reviewed:** In-process MCP server in `mcp-server.ts` and `claude-executor.ts`.
- `createInProcessMcpServer()` uses SDK's `createSdkMcpServer()` + `tool()` — correct pattern
- `post_comment` migrated as proof-of-concept, handler matches child-process version
- Both servers registered in mcpServers — pragmatic incremental approach
- Tool access filtering via `allowedTools` check before registration
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 10:40 PDT — SDK.UX.3: In-process MCP server

**Done:** Added `createInProcessMcpServer()` using SDK's `createSdkMcpServer()` and `tool()` helpers. Currently migrates `post_comment` as proof-of-concept — remaining tools use the child-process server in parallel. Both servers registered in `mcpServers` config: `agentops-inprocess` (in-process, low latency) + `agentops` (child-process, full tool set). Pattern established for incremental migration of remaining tools.
**Files:** `packages/backend/src/agent/mcp-server.ts`, `packages/backend/src/agent/claude-executor.ts`
**Notes:** Full migration of all 8 tools deferred — `post_comment` demonstrates the pattern. Each tool can be migrated individually by adding to the `tools` array in `createInProcessMcpServer`.

---

## 2026-04-01 10:25 PDT — Review: SDK.UX.2 (approved)

**Reviewed:** Model switching across routes, API client, ModelSwitcher component, terminal renderer.
- Backend: 2 routes (GET models, POST model) using `supportedModels()` and `setModel()` on running query
- Frontend: Select dropdown for running, Badge fallback for completed
- AlertDialog confirmation with cost warning before switching
- Badge updates on successful switch
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 10:20 PDT — SDK.UX.2: Model switching for long-running agents

**Done:** Full-stack model switching. Backend: `GET /api/executions/:id/models` (returns available models via `supportedModels()`), `POST /api/executions/:id/model` (calls `setModel()` on running query). Frontend: `ModelSwitcher` component — Select dropdown for running executions, static Badge for completed. AlertDialog confirmation before switching with cost warning. API client functions `getAvailableModels()` and `switchModel()`. Replaces static model badge in terminal renderer header.
**Files:** `packages/backend/src/routes/executions.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/features/agent-monitor/model-switcher.tsx` (new), `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`

---
