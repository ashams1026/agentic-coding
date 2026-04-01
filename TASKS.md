# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-21 complete and archived. Sprint 17 has blocked FX.SDK3/SDK5. Backlog FUT.1-6, PLUG.1-2/3a-3b/4-5 archived.

---

## Sprint 17: Agent Pipeline Fixes & Monitor UX (remaining)

> Blocked and remaining tasks.

### SDK-Native Skills & Tool Discovery

- [blocked: SDK initializationResult() does not return built-in tool names/descriptions — only commands (skills), agents, and models. No tool discovery API exists in the SDK. The hardcoded SDK_TOOLS list in tool-configuration.tsx is actually correct since built-in tools are a fixed set.]  **FX.SDK3** — Replace hardcoded tool list with SDK discovery in persona editor. In the persona editor UI (`packages/frontend/src/features/persona-manager/`): replace any freeform text input or hardcoded tool checkboxes for `allowedTools` with a multi-select populated from `GET /api/sdk/capabilities`. Show each tool with its name and description. Group by category: File tools, Search tools, Execution, Web, Agent, Other. Same for `mcpTools` — show available MCP tools from the discovery response. Validate on save: warn if a selected tool isn't in the available set.

- [blocked: same as FX.SDK3 — no tool discovery API in SDK. Can validate skills (commands) and agents from capabilities, but not built-in tools.] **FX.SDK5** — Add startup tool validation. In `packages/backend/src/agent/execution-manager.ts`: on first dispatch (or server start), fetch the SDK capabilities and validate all persona `allowedTools` and `skills` against the actual available set. Log warnings for any mismatches: "Persona 'Engineer' references unknown tool 'FooBar' — will be ignored by SDK." This catches stale tool names early (like the `transition_state` vs `route_to_state` incident).

---

## Sprint 19: SDK Deep Integration — Core

> Leverage the full Claude Agent SDK surface. Priority-ordered: infrastructure first (unblocks everything), then agent quality, then safety.
> V2 Sessions unblock SDK discovery (FX.SDK1) and simplify Pico (Sprint 18).
> Each feature with UI changes includes a test plan update + visual verification task.

### Part 1: Infrastructure — V2 Persistent Sessions

- [blocked: SDKSessionOptions does not support agent/agents, mcpServers, cwd, skills, or maxBudgetUsd — only query() Options does. V2 sessions can't be configured as Pico (custom personality, MCP server, project cwd). Need SDK to add these fields to SDKSessionOptions first.] **SDK.V2.3** — Refactor Pico to use V2 sessions. Update PICO.2 and PICO.3 design: instead of a custom `chat_sessions`/`chat_messages` DB table + manual conversation history assembly, use the SDK's native session management. `POST /api/chat/sessions` → calls `unstable_v2_createSession()` and stores the SDK session ID. `POST /api/chat/sessions/:id/messages` → calls `session.send(message)` and streams from `session.stream()`. `GET /api/chat/sessions` → calls `listSessions()` from the SDK. `GET /api/chat/sessions/:id/messages` → calls `getSessionMessages(sessionId)`. This eliminates our custom chat persistence layer entirely — the SDK handles conversation history, context compaction, and session storage. Keep the `chat_sessions` table only as a lightweight index (sessionId, projectId, title, createdAt) for the UI list. Remove `chat_messages` table from the schema design.

---

## Backlog: Pluggable Executor Architecture (remaining)

> PLUG.1-2, PLUG.3a-3b, PLUG.4-5 archived. Blocked: PLUG.3c/3d. Remaining: PLUG.6-10.

- [blocked: ExecutionManager has 6+ non-DB dependencies beyond repositories (logger, audit, concurrency, runRouter, dispatchForState, drizzle eq operator). Moving to core requires abstracting ALL of these as interfaces — much larger scope than DB repositories alone. Defer until a broader service abstraction layer is designed.] **PLUG.3c** — Move ExecutionManager, dispatch, router, coordination to `@agentops/core`. Refactor these modules to use the repository interfaces from PLUG.3b instead of direct Drizzle imports. Move them to `packages/core/src/`. Update backend to inject concrete repository implementations via the composition root.

- [blocked: same as PLUG.3c — mcp-server.ts depends on SDK MCP factory, logger, audit, coordination, memory modules beyond just DB. Requires broader service abstraction.] **PLUG.3d** — Move MCP server definition to `@agentops/core`. Refactor `mcp-server.ts` to use repository interfaces. The SDK MCP server factory (`createSdkMcpServer`) stays as a peer dependency since it's from the agent SDK.

- [x] **PLUG.6** — Create example custom executor template. Create `examples/custom-executor/` at the repo root: a minimal standalone project that depends on `@agentops/shared` and `@agentops/core`, implements a trivial `AgentExecutor` (echoes back the task description as a text event), registers it, and starts the AgentOps server with the custom executor active. Include a `README.md` explaining: how to implement the interface, how to register, how to configure which executor runs. This serves as documentation-by-example for anyone building on top of AgentOps.

- [x] **PLUG.7** — Update `docs/architecture.md` with pluggable executor documentation. Document: the executor interface contract, how to implement a custom executor, the registry pattern, the composition root, the `@agentops/core` package boundary, and a diagram showing which packages depend on what. Include a "Building on AgentOps" section for external developers.

- [review] **PLUG.8** — Integration tests for executor registry. Create `packages/backend/tests/executor-registry.test.ts`: test registering multiple executors, switching between them at runtime, verifying the correct executor is selected by environment (test/dev/prod). Test that an unregistered executor name throws a clear error. Test that the REST API (`GET/PUT /api/settings/executor-mode`) reflects registry state. Use the real `ExecutionManager` class with `MockExecutor` instances — no mocking the system under test.

- [ ] **PLUG.9** — E2E test plan: executor switching UI. Create `tests/e2e/plans/executor-switching.md`: test the Settings executor toggle (only visible in dev mode), verify switching between mock and claude modes, verify the status bar shows current executor mode, verify the health endpoint reflects the change. Visual verification of the settings UI.

- [ ] **PLUG.10** — Run executor switching e2e test. Execute PLUG.9 test plan. Record results with screenshots.

---

## Backlog: Agent Workflow Improvements

- [ ] **AW.1** — Add conditional visual UI check to agent WORK state. Update `AGENT_PROMPT.md`: add a `[VISUAL CHECK]` step between `[IMPLEMENT]` and `[VERIFY]` in the WORK state. The step is conditional: after implementing, run `git diff --name-only` and check if any files in `packages/frontend/` were modified. If NO frontend files changed → skip to [VERIFY]. If frontend files changed → ensure dev servers are running (check ports 3001 and 5173/5174, skip starting if already up), use chrome-devtools MCP to open the affected page(s) in a browser, take a screenshot, visually examine it for layout issues / broken styling / clipping / misalignment, fix any visual defects found, re-screenshot to confirm. Include a file path → page URL mapping in the prompt so the agent knows which pages to check: `features/work-items/` → `/items`, `features/dashboard/` or `pages/dashboard` → `/`, `features/agent-monitor/` → `/agents`, `features/activity-feed/` → `/activity`, `features/persona-manager/` → `/personas`, `features/settings/` → `/settings`, `components/sidebar.tsx` or `layouts/` → `/` (check any page). If multiple feature directories were touched, check each corresponding page. Add to the Worker Rules section: "If your task modifies frontend code, the visual check is mandatory — do not skip it."

- [ ] **AW.2** — Add visual check to REVIEW state. Update `AGENT_PROMPT.md`: in the REVIEW state's `[INSPECT WORK]` step, add: if the worker's WORKLOG entry lists frontend files, open the affected pages in a browser via chrome-devtools MCP and visually verify the UI looks correct. This gives the reviewer a second pair of eyes on visual quality. Add a review checklist item: "If UI was changed: does it look correct visually? No broken layout, clipping, or styling issues?"


