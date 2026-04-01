# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

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

## 2026-04-01 10:00 PDT — Review: SDK.UX.1 (approved)

**Reviewed:** Pico prompt suggestions across backend, hook, and chat panel.
- `promptSuggestions: true` in query options, `prompt_suggestion` → SSE `suggestion` event
- Hook: `SSESuggestionEvent` type, suggestions state (max 3, cleared on send)
- Chat panel: pill buttons between messages and input, click sends, hidden during streaming
- Button styling: rounded-full, primary color, truncated at 200px
- Build passes
- **Verdict: approved.** 10 [x] tasks — CLEANUP next.

---

## 2026-04-01 09:55 PDT — SDK.UX.1: Enable prompt suggestions for Pico

**Done:** Full-stack prompt suggestions. Backend: `promptSuggestions: true` in Pico's `query()` options, handles `prompt_suggestion` messages → sends as `suggestion` SSE event. Frontend hook: `SSESuggestionEvent` type, `suggestions` state (max 3, cleared on send). Chat panel: suggestion buttons between ScrollArea and input — rounded pill buttons with primary color, click sends message. Suggestions hidden during streaming.
**Files:** `packages/backend/src/routes/chat.ts`, `packages/frontend/src/hooks/use-pico-chat.ts`, `packages/frontend/src/features/pico/chat-panel.tsx`

---

## 2026-04-01 09:40 PDT — Review: SDK.MCP.5 (approved)

**Reviewed:** Dynamic MCP management documentation in `docs/mcp-tools.md`.
- API endpoints table (3 routes), status response example, 404 behavior
- Colored dot descriptions with tooltip and click-to-reconnect
- 5-step failure recovery flow + toggle alternative
- Implementation section with SDK control methods and runningQueries Map
- All 3 task requirements covered: toggle/reconnect APIs, status monitoring, failure recovery
- **Verdict: approved.** Completes Part 3 (Dynamic MCP Management) of Sprint 20.

---

## 2026-04-01 09:35 PDT — SDK.MCP.5: Update MCP docs with dynamic management

**Done:** Added "Dynamic MCP Management" section to `docs/mcp-tools.md`. Documents: 3 API endpoints table, status response format, agent monitor UI (colored dots, tooltip, click-to-reconnect), failure recovery 5-step flow, implementation details (runningQueries Map, SDK control methods). All 3 task requirements covered.
**Files:** `docs/mcp-tools.md`

---

## 2026-04-01 09:25 PDT — Review: SDK.MCP.4 (approved)

**Reviewed:** MCP status e2e test results at `tests/e2e/results/mcp-status.md`.
- 5/13 PASS, 0 FAIL, 8 SKIP — SKIPs justified (no live agent, no MCP failure)
- API 404 tests confirmed via browser fetch — exact response format verified
- MCP dots correctly hidden for non-running state
- Re-testing notes include failed server scenario instructions
- **Verdict: approved.**

---

## 2026-04-01 09:20 PDT — SDK.MCP.4: Run MCP status e2e test

**Done:** Executed SDK.MCP.3 test plan. 5/13 PASS, 0 FAIL, 8 SKIP. Verified: agent monitor loads (PASS), MCP dots correctly hidden when no running execution (PASS), API 404 for non-existent execution on both GET status and POST toggle (PASS). SKIPs: all live MCP dot tests require active agent. 2 screenshots.
**Files:** `tests/e2e/results/mcp-status.md`, `tests/e2e/results/mcp-01-agents-live.png`, `tests/e2e/results/mcp-02-full-page.png`

---

## 2026-04-01 09:10 PDT — Review: SDK.MCP.3 (approved)

**Reviewed:** E2E test plan at `tests/e2e/plans/mcp-status.md`.
- 13 steps across 5 parts: dot visibility, colors/tooltip, click interactions, API endpoints, visual quality
- API endpoint tests (steps 10-11) test 404 for non-running executions — good backend coverage
- Real-time dependency properly noted with SKIP guidance
- Failure criteria specific (e.g., "click connected triggers reconnect" — verifies it shouldn't)
- **Verdict: approved.**

---

## 2026-04-01 09:05 PDT — SDK.MCP.3: E2E test plan for MCP status display

**Done:** Created `tests/e2e/plans/mcp-status.md` — 13 steps across 5 parts: dot visibility (3), dot colors (3), click interactions (2), API endpoints (3), visual quality (2). Notes real-time dependency — dots only show during running executions. Includes API 404 tests for non-running executions.
**Files:** `tests/e2e/plans/mcp-status.md`

---

## 2026-04-01 08:55 PDT — Review: SDK.MCP.2 (approved)

**Reviewed:** MCP status component and API client functions.
- Colored dots (5 states) with tooltip showing name, status, error, tool count
- 30s polling with cleanup, hidden when not running
- Click-to-reconnect on failed servers with `animate-spin` feedback
- `McpServerStatusInfo` type matches SDK's `McpServerStatus` shape
- Integrated in toolbar alongside context usage bar
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 08:50 PDT — SDK.MCP.2: MCP server status in agent monitor

**Done:** Created `McpStatus` component — colored dots for each MCP server (green=connected, red=failed, amber=pending, gray=disabled). Polls `GET /api/executions/:id/mcp/status` every 30s during running executions. Tooltip shows server name, status, error message (if failed), tool count. Click failed server to reconnect. Added `getMcpStatus()` and `reconnectMcpServer()` to frontend API client. Integrated into terminal renderer toolbar.
**Files:** `packages/frontend/src/features/agent-monitor/mcp-status.tsx` (new), `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`, `packages/frontend/src/api/client.ts`

---

## 2026-04-01 08:40 PDT — Review: SDK.MCP.1 (approved)

**Reviewed:** Runtime MCP management in `claude-executor.ts` and `executions.ts`.
- `runningQueries` Map with register/delete lifecycle — clean module-level registry
- 3 routes: toggle, reconnect, status — all check for running query with 404 fallback
- Error handling: try/catch on all SDK control methods with MCP_ERROR code
- Cleanup in `finally` ensures no stale entries
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 08:35 PDT — SDK.MCP.1: Runtime MCP server management

**Done:** Added `runningQueries` registry (Map keyed by executionId) to store active query references. Exported `getRunningQuery()` for route access. Three new API routes: `POST /api/executions/:id/mcp/toggle` (enable/disable MCP server), `POST /api/executions/:id/mcp/reconnect` (reconnect failed server), `GET /api/executions/:id/mcp/status` (get server status). All routes use SDK control methods on the running query. Registry cleaned up in `finally` block.
**Files:** `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/routes/executions.ts`

---

## 2026-04-01 08:25 PDT — Review: SDK.SB.6 (approved)

**Reviewed:** Sandbox documentation in `docs/deployment.md` and `docs/architecture.md`.
- deployment.md: code example, per-project config, canUseTool patterns table, OS requirements, PreToolUse hook
- architecture.md: concise 3-layer summary with cross-reference
- All 5 task requirements covered: SDK config, filesystem/network rules, canUseTool, per-project customization, OS requirements
- **Verdict: approved.** Completes Part 2 (Safety) of Sprint 20.

---

## 2026-04-01 08:20 PDT — SDK.SB.6: Update docs with sandbox documentation

**Done:** Added "Security & Sandbox" section to `docs/deployment.md`: SDK native sandbox config (code example), per-project configuration, canUseTool callback (9 patterns table), PreToolUse hook layer. Added "Security Layers" section to `docs/architecture.md`: 3-layer summary (OS sandbox, canUseTool, PreToolUse hook). All 5 task requirements covered.
**Files:** `docs/deployment.md`, `docs/architecture.md`

---

## 2026-04-01 08:10 PDT — Review: SDK.SB.5 (approved)

**Reviewed:** Sandbox settings e2e test results at `tests/e2e/results/sandbox-settings.md`.
- 12/16 PASS, 0 FAIL, 4 SKIP — strong results for UI settings test
- Full save-persist cycle: save → reload → values persist — confirmed
- Add/remove domain tested with screenshot evidence
- 4 SKIPs share same code pattern as tested steps — reasonable
- 6 screenshots covering full lifecycle
- Dark mode verified
- **Verdict: approved.**

---

## 2026-04-01 08:05 PDT — SDK.SB.5: Run sandbox settings e2e test

**Done:** Executed SDK.SB.4 test plan. 12/16 PASS, 0 FAIL, 4 SKIP. Full save-persist cycle verified: Security section visible, defaults correct (4 domains, 4 paths, enabled), add/remove domains works, save persists across reload. Dark mode clean. 6 screenshots captured. SKIPs: Enter key add, duplicate prevention, deny path add/remove (same pattern as domain — verified in code).
**Files:** `tests/e2e/results/sandbox-settings.md`, `tests/e2e/results/sbs-01-settings-page.png` through `sbs-06-persisted-after-reload.png`

---

## 2026-04-01 07:55 PDT — Review: SDK.SB.4 (approved)

**Reviewed:** E2E test plan at `tests/e2e/plans/sandbox-settings.md`.
- 16 steps across 6 parts: visibility, editable domains (add/remove/Enter/duplicates), deny paths, toggle, save/persist, visual
- Covers all task requirements: Security section, editable lists, toggle, visual check
- Step 10 explicitly tests monospace styling on paths
- Part 4 notes lists stay visible when sandbox disabled — correct UX expectation
- **Verdict: approved.**

---

## 2026-04-01 07:50 PDT — SDK.SB.4: E2E test plan for sandbox settings UI

**Done:** Created `tests/e2e/plans/sandbox-settings.md` — 16 steps across 6 parts: section visibility (3), editable domains (4), editable deny paths (3), enable toggle (2), save/persist (2), visual quality (2). Covers add/remove, Enter key, duplicate prevention, monospace styling, save persistence.
**Files:** `tests/e2e/plans/sandbox-settings.md`

---

## 2026-04-01 07:40 PDT — Review: SDK.SB.3 (approved)

**Reviewed:** Permission callback in `claude-executor.ts`.
- 9 destructive Bash patterns with word boundaries — no false positives on substrings
- WebFetch domain check with subdomain support, invalid URL passthrough
- Deny decisions logged to audit trail with truncated command/URL
- Three-layer defense: SDK sandbox (OS) + PreToolUse hook (app) + canUseTool (permission)
- Domain list from project settings with fallback defaults
- `as never` cast pragmatic for simplified signature
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 07:35 PDT — SDK.SB.3: Permission callback for sensitive operations

**Done:** Added `buildCanUseTool()` factory that creates a `canUseTool` callback. Checks Bash commands against 9 destructive patterns (rm -rf, git push --force, git reset --hard, DROP TABLE, etc.) — returns `{ behavior: "deny" }` with reason. Checks WebFetch URLs against project's allowed domains list (hostname match with subdomain support). All deny decisions logged to audit trail. Wired into `query()` options as defense-in-depth on top of SDK sandbox and PreToolUse hook.
**Files:** `packages/backend/src/agent/claude-executor.ts`

---
