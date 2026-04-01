# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-19 complete and archived. Sprint 17 has blocked FX.SDK3/SDK5. Sprint 20 ST.1-ST.8, SB.1-SB.2 archived.

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

## Sprint 20: SDK Deep Integration — Observability & Polish

> Real-time streaming, progress tracking, rate limit handling, context usage monitoring.
> Safety improvements: SDK-native sandbox, permission callbacks, dynamic MCP management.
> UX enhancements: prompt suggestions, model switching.
> **Runs in parallel with Sprint 21 (Documentation Refresh)** — agents should alternate between implementation and docs.

### Regression Testing Checkpoint

- [ ] **SDK.REG.2** — Full e2e regression sweep after Sprint 20. Re-run all e2e test suites (including new ones from Sprints 19-20) against the current app state. Record results to `tests/e2e/results/regression-post-sprint20.md`. Compare against Sprint 19 regression baseline. File new FX tasks for any regressions. This is the final quality gate before moving to backlog work.

### Part 2: Safety — SDK Native Sandbox (remaining)

- [x] **SDK.SB.3** — Add permission callback for sensitive operations. In `packages/backend/src/agent/claude-executor.ts`: pass a `canUseTool` callback to `query()` options. The callback checks: if the tool is `Bash` and the command contains `rm -rf`, `git push --force`, `DROP TABLE`, or other destructive patterns → return `{ behavior: 'deny', message: 'Destructive command blocked by policy' }`. If the tool is `WebFetch` and the URL is not in the allowed domains → deny. For all other tools → allow. This is a defense-in-depth layer on top of the sandbox. Log all deny decisions to the audit trail.

- [x] **SDK.SB.4** — E2E test plan: sandbox settings UI. Create `tests/e2e/plans/sandbox-settings.md`: verify sandbox configuration renders in Settings → Security, allowed domains list is editable, toggle works. Visual check of the sandbox settings section.

- [x] **SDK.SB.5** — Run sandbox settings e2e test. Execute SDK.SB.4. Record results with screenshots.

- [x] **SDK.SB.6** — Update `docs/deployment.md` and `docs/architecture.md` with sandbox documentation. Document: SDK sandbox configuration, filesystem/network rules, canUseTool callback, how to customize per-project, OS-level sandbox requirements.

### Part 3: Safety — Dynamic MCP Management

- [x] **SDK.MCP.1** — Add runtime MCP server management. In `packages/backend/src/agent/claude-executor.ts`: store the `query` object reference during execution. Expose `POST /api/executions/:id/mcp/toggle` route: calls `toggleMcpServer(serverName, enabled)` on the running query to enable/disable an MCP server mid-execution. Expose `POST /api/executions/:id/mcp/reconnect` route: calls `reconnectMcpServer(serverName)` to recover a failed connection. These are useful when an MCP server crashes during a long agent run — the user can reconnect without restarting the entire execution.

- [x] **SDK.MCP.2** — Show MCP server status in agent monitor. During execution, call `mcpServerStatus()` periodically (every 30s). In the agent monitor: show a small "MCP" status section in the execution header. Each configured server shows as a colored dot: green (connected), red (failed), yellow (pending), gray (disabled). Click a failed server to trigger reconnection. Click a connected server to see its available tools. This gives users visibility into MCP health.

- [x] **SDK.MCP.3** — E2E test plan: MCP status display. Create `tests/e2e/plans/mcp-status.md`: verify MCP server dots render in agent monitor, colors are correct, click interactions work. Visual verification.

- [x] **SDK.MCP.4** — Run MCP status e2e test. Execute SDK.MCP.3. Record results with screenshots.

- [review] **SDK.MCP.5** — Update `docs/mcp-tools.md` with dynamic MCP management. Document: runtime toggle/reconnect APIs, status monitoring, how to recover from MCP failures.

### Part 4: UX — Prompt Suggestions & Model Switching

- [ ] **SDK.UX.1** — Enable prompt suggestions for Pico. In the Pico executor config: add `promptSuggestions: true` to `query()` options. Handle `SDKPromptSuggestionMessage` in the streaming response: extract the predicted next prompts. In the Pico chat panel: after each Pico response, show 2-3 suggested follow-up buttons below the message (similar to the welcome message quick actions from PICO.10). Clicking a suggestion sends it as the next message. Suggestions fade out once the user starts typing.

- [ ] **SDK.UX.2** — Add model switching for long-running agents. In the agent monitor: add a "Model" dropdown in the execution header (only visible for running executions). Shows available models from `supportedModels()`. Selecting a different model calls `setModel(newModel)` on the running query. Use case: an agent started on Haiku but the task is complex — user can upgrade to Sonnet mid-run without restarting. Show the current model as a badge that updates when switched. Confirm before switching: "Switch from Haiku to Sonnet? This may increase costs."

- [ ] **SDK.UX.3** — In-process MCP server. In `packages/backend/src/agent/mcp-server.ts`: instead of spawning the agentops MCP server as a child process (stdio), use `createSdkMcpServer({ type: 'sdk' })` to run it in-process. Register all MCP tools via `server.tool(name, description, schema, handler)`. This eliminates the child process overhead, reduces latency on MCP tool calls, and simplifies debugging (all in one process, shared memory). Update the `mcpServers` config in `claude-executor.ts` to use `{ type: 'sdk', name: 'agentops', instance: server }`.

- [ ] **SDK.UX.4** — E2E test plan: Pico prompt suggestions. Create `tests/e2e/plans/pico-suggestions.md`: verify suggestion buttons appear after Pico responses, clicking sends the suggestion, buttons fade on typing. Visual check.

- [ ] **SDK.UX.5** — Run Pico prompt suggestions e2e test. Execute SDK.UX.4. Record results with screenshots.

- [ ] **SDK.UX.6** — E2E test plan: model switching. Create `tests/e2e/plans/model-switching.md`: verify model dropdown appears on running executions, model badge updates, confirmation dialog. Visual check.

- [ ] **SDK.UX.7** — Run model switching e2e test. Execute SDK.UX.6. Record results with screenshots.

- [ ] **SDK.UX.8** — Update `docs/frontend.md` with prompt suggestions and model switching. Document: how prompt suggestions work in Pico, model switching in agent monitor, in-process MCP server architecture change.

### Regression Testing Checkpoint

- [ ] **SDK.REG.1** — Full e2e regression sweep after Sprint 19. Re-run all 19 original e2e test suites from `tests/e2e/plans/` against the current app state. Record results to `tests/e2e/results/regression-post-sprint19.md`. Compare pass rates against the previous run (97.3% baseline from Sprint 16). File new FX tasks for any regressions introduced by Sprint 19 changes. This catches breakage from hooks migration, rewind button, structured output, subagent nesting, and effort/thinking UI changes.

---

## Sprint 21: Documentation Refresh

> All docs were written on 2026-03-30 and haven't been updated since. 200+ commits have landed since then.
> Each task: run `git log --oneline --since="<last_edit_date>" -- <relevant_source_paths>` to find what changed, read the current doc, update it to reflect the new state of the code. Don't rewrite from scratch — update what's stale, add what's missing, remove what's been deleted.
> **This sprint runs in parallel with Sprint 20** — agents should alternate between implementation and docs to keep documentation current.

- [ ] **DOC.1** — Update `docs/getting-started.md`. Check commits touching `packages/backend/src/index.ts`, `packages/backend/src/cli.ts`, `packages/backend/src/db/seed.ts`, `package.json`, `scripts/`. Update: install steps, first-run commands, any new CLI commands, seed script changes, new prerequisites. The mock mode instructions should be removed (mock layer was deleted). Add the `pnpm db:seed:demo` command if it exists.

- [ ] **DOC.2** — Update `docs/architecture.md`. Check commits touching `packages/backend/src/agent/`, `packages/backend/src/routes/`, `packages/frontend/src/api/`, `packages/frontend/src/features/`. Update: system diagram if new components were added (Pico chat, sandbox, audit trail), data flow if the execution chain changed (router loop fixes, rate limiter logging), any new backend services or routes.

- [ ] **DOC.3** — Update `docs/data-model.md`. Check commits touching `packages/shared/src/entities.ts`, `packages/backend/src/db/schema.ts`. Update: any new fields added to entities (skills on Persona, isAssistant flag, chat_sessions/chat_messages tables), any changed field names or types, update the ER diagram if relationships changed.

- [ ] **DOC.4** — Update `docs/workflow.md`. Check commits touching `packages/shared/src/workflow.ts`, `packages/backend/src/agent/router.ts`, `packages/backend/src/agent/dispatch.ts`, `packages/backend/src/agent/coordination.ts`, `packages/backend/src/agent/execution-manager.ts`. Update: router behavior changes (same-state blocking, loop detection, transition history), rate limiter logging, any new states or transition rules, play/pause auto-routing UX.

- [ ] **DOC.5** — Update `docs/personas.md`. Check commits touching `packages/backend/src/db/seed.ts` persona entries, `packages/backend/src/agent/claude-executor.ts`. Update: any persona prompt changes from the FX.P1-P5 overhaul, corrected tool names, new skills system, SDK tool name verification results, Pico as a new built-in persona (if implemented). Document the full list of correct MCP and SDK tool names per persona.

- [ ] **DOC.6** — Update `docs/api.md`. Check commits touching `packages/backend/src/routes/`, `packages/backend/src/server.ts`. Update: any new routes (chat sessions, service status, browse-directory, audit), any changed request/response shapes, any removed routes. Add curl examples for new endpoints.

- [ ] **DOC.7** — Update `docs/mcp-tools.md`. Check commits touching `packages/backend/src/agent/mcp-server.ts`. Update: any tool schema changes, new tools added, tool name corrections, per-persona allowlist changes from the audit.

- [ ] **DOC.8** — Update `docs/deployment.md`. Check commits touching `packages/backend/src/cli.ts`, `ecosystem.config.cjs`, `packages/backend/src/config.ts`, `packages/backend/src/logger.ts`, `packages/backend/src/audit.ts`, `scripts/`. Update: any new CLI commands, config file changes, log file paths, pm2 config changes, new scripts (test-e2e, dev wrapper).

- [ ] **DOC.9** — Update `docs/frontend.md`. Check commits touching `packages/frontend/src/`. Update: mock layer removal, new features (Pico chat, resizable panels, flow view redesign, play/pause control), deleted directories (mocks/), new stores or hooks, design system changes from the polish sprint.

---

## Backlog: SDK Future Features

> Lower-priority SDK features that become relevant as the product matures.

- [ ] **SDK.FUT.1** — Browser SDK for client-side Pico. Evaluate using `@anthropic-ai/claude-agent-sdk/browser` to run Pico directly in the browser via WebSocket. This would eliminate the backend SSE proxy for chat — messages stream directly from the SDK to the browser. Requires: WebSocket relay server, OAuth token management, CORS configuration. Spike: build a proof-of-concept Pico chat that connects via the browser SDK and compare latency/complexity with the server-side approach.

- [ ] **SDK.FUT.2** — Bridge API for remote agent execution. Evaluate the SDK's `attachBridgeSession()` and `createCodeSession()` for running agents on remote machines or in cloud environments. Use case: offload heavy Engineering persona executions to a cloud VM with more compute. Spike: establish a bridge session from AgentOps backend to a remote Claude Code instance, run a simple task, verify event streaming works end-to-end.

- [ ] **SDK.FUT.3** — Plugin system integration. Evaluate the SDK's plugin and marketplace system. Use case: allow users to install community-built persona skills and tools from npm/git registries. In Settings: add a "Plugins" section showing installed plugins and a marketplace browser. Use `enabledPlugins` and `extraKnownMarketplaces` in settings. Spike: create a sample plugin that adds a custom MCP tool, install it via the marketplace API, verify it's available to personas.

- [ ] **SDK.FUT.4** — HTTP hooks for external integrations. Use the SDK's HTTP hook support to send webhook notifications to external services (Slack, Discord, PagerDuty) on agent events. In Settings → Integrations: configure webhook URLs for events like "execution completed", "agent blocked", "review rejected". Use the `hooks` settings with `type: 'http'` and `url`. This replaces the need for a custom notification system.

- [ ] **SDK.FUT.5** — Worktree isolation for agent executions. Use the SDK's `EnterWorktree`/`ExitWorktree` tools and the `worktree` settings to run each agent execution in an isolated git worktree. This prevents agents from interfering with each other's file changes when running concurrently. Configure `worktree: { symlinkDirectories: ['node_modules'], sparsePaths: ['packages/'] }` for efficiency. Evaluate whether this replaces our need for custom file locking.

- [ ] **SDK.FUT.6** — Update all documentation for future SDK features. When any of SDK.FUT.1-5 are implemented, update the relevant docs: `docs/architecture.md` for bridge/browser changes, `docs/deployment.md` for remote execution, `docs/personas.md` for plugin-based skills, `docs/getting-started.md` for plugin installation.

---

## Backlog: Pluggable Executor Architecture

> Refactor the executor layer so external projects can swap in custom executors without forking.
> Currently `execution-manager.ts` hard-codes `ClaudeExecutor` and `MockExecutor` imports with a module-level singleton.
> Goal: constructor injection, executor registry, and a clean package boundary so a new project can `npm install @agentops/core` and provide its own executor.

- [ ] **PLUG.1** — Refactor ExecutionManager into a class with injected executor factory. Convert `packages/backend/src/agent/execution-manager.ts` from module-level functions + singleton into an `ExecutionManager` class. Constructor accepts an `ExecutorFactory: (mode: string) => AgentExecutor` function. Remove the hard-coded `ClaudeExecutor` and `MockExecutor` imports from this file — they move to the composition root. `getExecutorMode()` and `setExecutorMode()` become instance methods. The class holds its own executor instance, DB handle, and WebSocket broadcaster. All existing call sites (`routes/executions.ts`, `router.ts`, `dispatch.ts`) receive the `ExecutionManager` instance instead of importing module-level functions.

- [ ] **PLUG.2** — Create composition root for executor wiring. Create `packages/backend/src/agent/setup.ts`: this is the only file that imports concrete executor implementations. It creates the `ExecutionManager` with a factory: `(mode) => mode === "mock" ? new MockExecutor() : new ClaudeExecutor()`. Export a `createExecutionManager()` function called from `server.ts` during startup. This is the single point where a custom project would swap in their executor — replace this one file or pass a different factory. Update `server.ts` to use the composition root instead of importing execution-manager directly.

- [ ] **PLUG.3** — Extract `@agentops/core` package. Create `packages/core/` as a new workspace package. Move into it: `AgentExecutor` interface + all types from `agent/types.ts`, the `ExecutionManager` class (from PLUG.1), workflow engine (`dispatch.ts`, `router.ts`, `coordination.ts`), MCP server definition (`mcp-server.ts`), and the sandbox module (`sandbox.ts`). `@agentops/core` depends only on `@agentops/shared` — no DB, no routes, no SDK imports. The backend package (`@agentops/backend`) depends on `@agentops/core` and provides the concrete executors + Fastify routes + DB layer.

- [ ] **PLUG.4** — Add executor registry with named registration. In `@agentops/core`: add an `ExecutorRegistry` class. `registry.register(name: string, factory: () => AgentExecutor)` adds an executor. `registry.get(name: string): AgentExecutor` returns it. `registry.list(): string[]` returns available names. Wire into `ExecutionManager` — instead of a simple factory function, it takes a registry. The REST API `GET /api/settings/executor-mode` returns available modes from the registry. `PUT /api/settings/executor-mode` switches between registered executors. Default registrations: `"claude"` → `ClaudeExecutor`, `"mock"` → `MockExecutor`. A custom project adds: `registry.register("my-executor", () => new MyExecutor())`.

- [ ] **PLUG.5** — Publish-ready package.json for shared and core. Update `packages/shared/package.json` and `packages/core/package.json` (from PLUG.3): add proper `main`, `types`, `exports` fields, `files` whitelist, `peerDependencies` where needed. Add `tsconfig.build.json` for declaration-only builds. Ensure `pnpm pack` produces clean tarballs with no dev dependencies. These don't need to be published to npm yet — just structured so they *could* be, and so a sibling project in a monorepo can depend on them cleanly.

- [ ] **PLUG.6** — Create example custom executor template. Create `examples/custom-executor/` at the repo root: a minimal standalone project that depends on `@agentops/shared` and `@agentops/core`, implements a trivial `AgentExecutor` (echoes back the task description as a text event), registers it, and starts the AgentOps server with the custom executor active. Include a `README.md` explaining: how to implement the interface, how to register, how to configure which executor runs. This serves as documentation-by-example for anyone building on top of AgentOps.

- [ ] **PLUG.7** — Update `docs/architecture.md` with pluggable executor documentation. Document: the executor interface contract, how to implement a custom executor, the registry pattern, the composition root, the `@agentops/core` package boundary, and a diagram showing which packages depend on what. Include a "Building on AgentOps" section for external developers.

- [ ] **PLUG.8** — Integration tests for executor registry. Create `packages/backend/tests/executor-registry.test.ts`: test registering multiple executors, switching between them at runtime, verifying the correct executor is selected by environment (test/dev/prod). Test that an unregistered executor name throws a clear error. Test that the REST API (`GET/PUT /api/settings/executor-mode`) reflects registry state. Use the real `ExecutionManager` class with `MockExecutor` instances — no mocking the system under test.

- [ ] **PLUG.9** — E2E test plan: executor switching UI. Create `tests/e2e/plans/executor-switching.md`: test the Settings executor toggle (only visible in dev mode), verify switching between mock and claude modes, verify the status bar shows current executor mode, verify the health endpoint reflects the change. Visual verification of the settings UI.

- [ ] **PLUG.10** — Run executor switching e2e test. Execute PLUG.9 test plan. Record results with screenshots.

---

## Backlog: Agent Workflow Improvements

- [ ] **AW.1** — Add conditional visual UI check to agent WORK state. Update `AGENT_PROMPT.md`: add a `[VISUAL CHECK]` step between `[IMPLEMENT]` and `[VERIFY]` in the WORK state. The step is conditional: after implementing, run `git diff --name-only` and check if any files in `packages/frontend/` were modified. If NO frontend files changed → skip to [VERIFY]. If frontend files changed → ensure dev servers are running (check ports 3001 and 5173/5174, skip starting if already up), use chrome-devtools MCP to open the affected page(s) in a browser, take a screenshot, visually examine it for layout issues / broken styling / clipping / misalignment, fix any visual defects found, re-screenshot to confirm. Include a file path → page URL mapping in the prompt so the agent knows which pages to check: `features/work-items/` → `/items`, `features/dashboard/` or `pages/dashboard` → `/`, `features/agent-monitor/` → `/agents`, `features/activity-feed/` → `/activity`, `features/persona-manager/` → `/personas`, `features/settings/` → `/settings`, `components/sidebar.tsx` or `layouts/` → `/` (check any page). If multiple feature directories were touched, check each corresponding page. Add to the Worker Rules section: "If your task modifies frontend code, the visual check is mandatory — do not skip it."

- [ ] **AW.2** — Add visual check to REVIEW state. Update `AGENT_PROMPT.md`: in the REVIEW state's `[INSPECT WORK]` step, add: if the worker's WORKLOG entry lists frontend files, open the affected pages in a browser via chrome-devtools MCP and visually verify the UI looks correct. This gives the reviewer a second pair of eyes on visual quality. Add a review checklist item: "If UI was changed: does it look correct visually? No broken layout, clipping, or styling issues?"


