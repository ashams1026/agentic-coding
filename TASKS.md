# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-21 complete and archived. Sprint 17 has blocked FX.SDK3/SDK5. Backlog FUT.1-2 archived.

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

## Backlog: SDK Future Features

> Lower-priority SDK features that become relevant as the product matures.

- [x] **SDK.FUT.3** — Plugin system integration. Evaluate the SDK's plugin and marketplace system. Use case: allow users to install community-built persona skills and tools from npm/git registries. In Settings: add a "Plugins" section showing installed plugins and a marketplace browser. Use `enabledPlugins` and `extraKnownMarketplaces` in settings. Spike: create a sample plugin that adds a custom MCP tool, install it via the marketplace API, verify it's available to personas.

- [x] **SDK.FUT.4** — HTTP hooks for external integrations. Use the SDK's HTTP hook support to send webhook notifications to external services (Slack, Discord, PagerDuty) on agent events. In Settings → Integrations: configure webhook URLs for events like "execution completed", "agent blocked", "review rejected". Use the `hooks` settings with `type: 'http'` and `url`. This replaces the need for a custom notification system.

- [x] **SDK.FUT.5** — Worktree isolation for agent executions. Use the SDK's `EnterWorktree`/`ExitWorktree` tools and the `worktree` settings to run each agent execution in an isolated git worktree. This prevents agents from interfering with each other's file changes when running concurrently. Configure `worktree: { symlinkDirectories: ['node_modules'], sparsePaths: ['packages/'] }` for efficiency. Evaluate whether this replaces our need for custom file locking.

- [x] **SDK.FUT.6** — Update all documentation for future SDK features. When any of SDK.FUT.1-5 are implemented, update the relevant docs: `docs/architecture.md` for bridge/browser changes, `docs/deployment.md` for remote execution, `docs/personas.md` for plugin-based skills, `docs/getting-started.md` for plugin installation.

---

## Backlog: Pluggable Executor Architecture

> Refactor the executor layer so external projects can swap in custom executors without forking.
> Currently `execution-manager.ts` hard-codes `ClaudeExecutor` and `MockExecutor` imports with a module-level singleton.
> Goal: constructor injection, executor registry, and a clean package boundary so a new project can `npm install @agentops/core` and provide its own executor.

- [x] **PLUG.1** — Refactor ExecutionManager into a class with injected executor factory. Convert `packages/backend/src/agent/execution-manager.ts` from module-level functions + singleton into an `ExecutionManager` class. Constructor accepts an `ExecutorFactory: (mode: string) => AgentExecutor` function. Remove the hard-coded `ClaudeExecutor` and `MockExecutor` imports from this file — they move to the composition root. `getExecutorMode()` and `setExecutorMode()` become instance methods. The class holds its own executor instance, DB handle, and WebSocket broadcaster. All existing call sites (`routes/executions.ts`, `router.ts`, `dispatch.ts`) receive the `ExecutionManager` instance instead of importing module-level functions.

- [x] **PLUG.2** — Create composition root for executor wiring. Create `packages/backend/src/agent/setup.ts`: this is the only file that imports concrete executor implementations. It creates the `ExecutionManager` with a factory: `(mode) => mode === "mock" ? new MockExecutor() : new ClaudeExecutor()`. Export a `createExecutionManager()` function called from `server.ts` during startup. This is the single point where a custom project would swap in their executor — replace this one file or pass a different factory. Update `server.ts` to use the composition root instead of importing execution-manager directly.

- [x] **PLUG.3a** — Create `packages/core/` workspace package and move DB-free modules. Create the new workspace package with `package.json`, `tsconfig.json`, `src/index.ts`. Move `agent/types.ts` (AgentExecutor interface, AgentEvent union, AgentTask, SpawnOptions) and `agent/sandbox.ts` (command validation — no DB deps). Update backend imports to reference `@agentops/core`. These are the only agent modules with zero DB/SDK dependencies.

- [x] **PLUG.3b** — Abstract DB operations into repository interfaces in `@agentops/core`. Define `WorkItemRepository`, `ExecutionRepository`, `CommentRepository`, `PersonaRepository` interfaces with the query methods used by ExecutionManager, dispatch, router, coordination, and mcp-server. Implement them in `@agentops/backend` using Drizzle. This unblocks moving the remaining agent modules to core.

- [blocked: ExecutionManager has 6+ non-DB dependencies beyond repositories (logger, audit, concurrency, runRouter, dispatchForState, drizzle eq operator). Moving to core requires abstracting ALL of these as interfaces — much larger scope than DB repositories alone. Defer until a broader service abstraction layer is designed.] **PLUG.3c** — Move ExecutionManager, dispatch, router, coordination to `@agentops/core`. Refactor these modules to use the repository interfaces from PLUG.3b instead of direct Drizzle imports. Move them to `packages/core/src/`. Update backend to inject concrete repository implementations via the composition root.

- [blocked: same as PLUG.3c — mcp-server.ts depends on SDK MCP factory, logger, audit, coordination, memory modules beyond just DB. Requires broader service abstraction.] **PLUG.3d** — Move MCP server definition to `@agentops/core`. Refactor `mcp-server.ts` to use repository interfaces. The SDK MCP server factory (`createSdkMcpServer`) stays as a peer dependency since it's from the agent SDK.

- [review] **PLUG.4** — Add executor registry with named registration. In `@agentops/core`: add an `ExecutorRegistry` class. `registry.register(name: string, factory: () => AgentExecutor)` adds an executor. `registry.get(name: string): AgentExecutor` returns it. `registry.list(): string[]` returns available names. Wire into `ExecutionManager` — instead of a simple factory function, it takes a registry. The REST API `GET /api/settings/executor-mode` returns available modes from the registry. `PUT /api/settings/executor-mode` switches between registered executors. Default registrations: `"claude"` → `ClaudeExecutor`, `"mock"` → `MockExecutor`. A custom project adds: `registry.register("my-executor", () => new MyExecutor())`.

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


