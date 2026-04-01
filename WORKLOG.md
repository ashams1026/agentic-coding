# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-01 21:50 PDT — FX.UX.DASH.1: Fix Cost Summary below fold

**Done:** Changed dashboard widget grid from `lg:grid-cols-2` to `md:grid-cols-2 lg:grid-cols-3` so all three widgets (Recent Activity, Upcoming Work, Cost Summary) display in a single row at 1024px+. At 768px, falls back to 2 columns with CostSummary wrapping to row 2. Verified at 1440x900, 1024x768, 768x900, and dark mode — all widgets visible without scrolling at default viewport.
**Files:** `packages/frontend/src/pages/dashboard.tsx`

---

## 2026-04-01 21:35 PDT — Review: UX.DASH (approved)

**Reviewed:** Dashboard UX audit — 7 screenshots, 3 bug filings.
- All task requirements met: initial screenshot, active agents strip, cost summary, recent activity, upcoming work, interactive clicks, 1024px, 768px, dark mode
- 3 bugs well-described with specific file paths, measurements, and fix suggestions
- Screenshots valid across all viewport sizes and dark/light modes
- **Verdict: approved.**

---

## 2026-04-01 21:25 PDT — UX.DASH: Audit Dashboard page

**Done:** Audited Dashboard (`/`) at default viewport (1440x900), 1024px, and 768px, plus dark mode. All 4 stat cards render with correct data and icons. Active agents strip shows 2 running agents with green pulse indicators. Recent Activity populates 10 events with correct icons/colors and live WS support. Upcoming Work shows 1 ready item. Cost Summary renders sparkline chart and monthly progress bar. Dark mode has good contrast throughout. All navigation links verified (stat cards → /agents, /items, /activity, /settings; View all → /activity; activity rows → /items; View items → /items; Settings → /settings). Filed 3 bugs: FX.UX.DASH.1 (Cost Summary below fold), FX.UX.DASH.2 (stat/agent cards not accessible), FX.UX.DASH.3 (activity items link to generic /items).
**Files:** `tests/e2e/results/ux-dash-initial.png`, `tests/e2e/results/ux-dash-fullpage.png`, `tests/e2e/results/ux-dash-scrolled-cost.png`, `tests/e2e/results/ux-dash-1024.png`, `tests/e2e/results/ux-dash-768.png`, `tests/e2e/results/ux-dash-dark.png`, `tests/e2e/results/ux-dash-dark-cost.png`

---

## 2026-04-01 20:45 PDT — Review: AW.2 (approved)

**Reviewed:** Visual check addition to REVIEW state in AGENT_PROMPT.md.
- Checklist item added verbatim: "If UI was changed: does it look correct visually?"
- Conditional block: if WORKLOG lists frontend files → 4-step visual verification
- Integrates cleanly within [INSPECT WORK] before [DECIDE]
- **Verdict: approved.** Agent Workflow Improvements backlog complete (AW.1-2 done).

---

## 2026-04-01 20:40 PDT — AW.2: Add visual check to REVIEW state

**Done:** Updated AGENT_PROMPT.md REVIEW state's `[INSPECT WORK]` step. Added review checklist item: "If UI was changed: does it look correct visually? No broken layout, clipping, or styling issues?" Added conditional visual verification block: if worker's WORKLOG lists frontend files, open affected pages via chrome-devtools MCP, screenshot, and check for broken layout/clipping/misalignment/invisible text/wrong colors.
**Files:** `AGENT_PROMPT.md`

---

## 2026-04-01 20:30 PDT — Review: AW.1 (approved)

**Reviewed:** Visual UI check addition to AGENT_PROMPT.md WORK state.
- [VISUAL CHECK] step placed correctly between [IMPLEMENT] and [VERIFY]
- Conditional: `git diff --name-only` → skip if no frontend changes
- 4-step procedure: dev server check, chrome-devtools screenshot, inspect, fix loop
- All 7 file path → page URL mappings present
- Mandatory rule added to Worker Rules
- **Verdict: approved.**

---

## 2026-04-01 20:25 PDT — AW.1: Add visual UI check to WORK state

**Done:** Added `[VISUAL CHECK]` step to AGENT_PROMPT.md between `[IMPLEMENT]` and `[VERIFY]`. Conditional on frontend changes: runs `git diff --name-only`, skips if no `packages/frontend/` files changed. Includes: dev server check, chrome-devtools MCP screenshot, visual inspection, fix loop. File path → page URL mapping for 7 feature directories. Added mandatory rule to Worker Rules section.
**Files:** `AGENT_PROMPT.md`

---

## 2026-04-01 20:15 PDT — Review: PLUG.10 (approved)

**Reviewed:** E2E test execution results at `tests/e2e/results/executor-switching.md`.
- 12/14 PASS, 0 FAIL, 2 SKIP — all core functionality verified
- Toggle switches modes, API reflects, badge appears/disappears, invalid mode rejected
- 7 screenshots confirm visual quality (aligned toggles, distinct states, readable badge)
- SKIPs justified: endpoint naming correction + poll timing (cosmetic)
- **Verdict: approved.** Pluggable Executor Architecture backlog complete (PLUG.6-10 done, PLUG.3c/3d blocked).

---

## 2026-04-01 20:10 PDT — PLUG.10: Execute executor switching e2e test

**Done:** Ran PLUG.9 test plan against live dev servers. 12/14 PASS, 0 FAIL, 2 SKIP. All core functionality verified: toggle switches modes, API reflects changes, status bar badge appears/disappears, invalid mode rejected with 400. Two notes: test plan referenced `/health` but `executor` field is on `/api/health`; status bar "Simulated" badge requires health poll cycle (cosmetic delay). 7 screenshots captured.
**Files:** `tests/e2e/results/executor-switching.md` (new), 7 screenshots in `tests/e2e/results/`

---

## 2026-04-01 19:55 PDT — Review: PLUG.9 (approved)

**Reviewed:** E2E test plan at `tests/e2e/plans/executor-switching.md`.
- 14 steps across 5 parts: baseline → toggle → mock verify → claude verify → error handling
- UI button labels verified against actual code ("Claude API (real)" / "Simulated (no API calls)")
- Status bar "Simulated" badge check matches `executorMode === "mock"` code
- Production hide check (`isProduction → return null`) noted in prerequisites
- Template format followed: screenshot checkpoints, visual quality, failure criteria
- **Verdict: approved.**

---

## 2026-04-01 19:50 PDT — PLUG.9: E2E test plan for executor switching

**Done:** Created `tests/e2e/plans/executor-switching.md` with 14 steps across 5 parts: health endpoint baseline (2 API checks), Settings toggle location (3 UI steps), switch to mock mode (4 steps — UI + API + status bar badge), switch back to claude (3 steps — UI + badge disappears + API), API validation (invalid mode → 400 error). Visual quality and failure criteria included.
**Files:** `tests/e2e/plans/executor-switching.md` (new)

---

## 2026-04-01 19:40 PDT — Review: PLUG.8 (approved)

**Reviewed:** Integration tests for executor registry.
- 15 tests: 7 for ExecutorRegistry, 8 for ExecutionManager+Registry integration
- Real classes with TestExecutor stubs — no mocking system under test
- Covers: register/get/list/has, overwrite, instance-per-call, mode switching, env vars, production lock, error messages
- Environment variables properly isolated with try/finally
- 171/174 pass (3 pre-existing)
- **Verdict: approved.**

---

## 2026-04-01 19:35 PDT — PLUG.8: Integration tests for executor registry

**Done:** Created 15 integration tests in `executor-registry.test.ts`. ExecutorRegistry tests (7): register/get, list, has, unknown name error, empty registry error, overwrite, new instance per get. ExecutionManager+Registry tests (8): mode selection in test/dev/prod, listExecutorModes, getRegistry, runtime switching (dev mode), unknown mode throw, production lock, AGENTOPS_EXECUTOR env var. Uses real classes with TestExecutor stubs — no mocking the system under test. Tests: 171/174 pass (3 pre-existing failures).
**Files:** `packages/backend/src/agent/__tests__/executor-registry.test.ts` (new)

---

## 2026-04-01 19:25 PDT — Review: PLUG.7 (approved)

**Reviewed:** Pluggable executor architecture documentation in `docs/architecture.md`.
- 3-package dependency diagram (shared → core → backend) — accurate
- Executor interface, registry API, composition root — all documented with code examples
- REST API table for mode switching, "Building on AgentOps" 3-step guide
- File table updated with setup.ts, mock-executor, core re-export notes
- **Verdict: approved.**

---

## 2026-04-01 19:20 PDT — PLUG.7: Architecture docs for pluggable executors

**Done:** Added "Pluggable Executor Architecture" section to `docs/architecture.md`: 3-package dependency diagram (shared → core → backend), executor interface contract, ExecutorRegistry API, composition root pattern, REST API for mode switching, "Building on AgentOps" 3-step guide. Updated agent file table with setup.ts, mock-executor.ts, and core re-export notes.
**Files:** `docs/architecture.md`

---

## 2026-04-01 19:10 PDT — Review: PLUG.6 (approved)

**Reviewed:** Example custom executor at `examples/custom-executor/`.
- EchoExecutor implements full AgentExecutor contract (thinking → text → result)
- setup.ts shows registry.register pattern
- README: 4-step guide, code snippets, event types table, runtime switching
- Imports from @agentops/core and @agentops/shared — correct
- **Verdict: approved.**

---

## 2026-04-01 19:05 PDT — PLUG.6: Example custom executor template

**Done:** Created `examples/custom-executor/` with 3 files: `echo-executor.ts` (trivial AgentExecutor that echoes task description as text events), `setup.ts` (example composition root showing registry.register), `README.md` (step-by-step guide: implement interface, register, wire, select at runtime, event types table).
**Files:** `examples/custom-executor/echo-executor.ts`, `examples/custom-executor/setup.ts`, `examples/custom-executor/README.md` (all new)

---

## 2026-04-01 18:35 PDT — Review: PLUG.5 (approved)

**Reviewed:** Publish-ready package.json for shared and core.
- Both: `main`/`types` → dist, conditional exports with types+import, `./src/*` escape hatch
- `files` whitelist: dist + src + package.json, no leaks
- Shared: `tsconfig.build.json` excludes `__tests__` from dist
- `prepublishOnly: pnpm build` on both
- `pnpm pack` dry-run: clean tarballs, no node_modules/env/creds
- Backend `Parameters<>` → explicit types fix verified
- **Verdict: approved.**

---

## 2026-04-01 18:30 PDT — PLUG.5: Publish-ready package.json for shared and core

**Done:** Updated both `@agentops/shared` and `@agentops/core` package.json with proper `main`/`types` pointing to `dist/`, conditional `exports` (`types` + `import` + source via `./src/*`), `files` whitelist (`dist`, `src`, `package.json`), `prepublishOnly` scripts. Added `tsconfig.build.json` for shared to exclude `__tests__` from dist output. Fixed backend `repositories.ts` — replaced `Parameters<>` type inference (broke with dist-based resolution) with explicit inline types. Cleaned stale `.tsbuildinfo` files that prevented rebuilds.
**Files:** `packages/shared/package.json`, `packages/shared/tsconfig.build.json` (new), `packages/core/package.json`, `packages/backend/src/db/repositories.ts`

---

## 2026-04-01 18:15 PDT — Review: PLUG.4 (approved)

**Reviewed:** Executor registry implementation.
- `ExecutorRegistry` class in core: register/get/has/list, clear error messages
- ExecutionManager constructor takes registry instead of factory
- `setExecutorMode()` validates against registry, `listExecutorModes()` delegates
- `createDefaultRegistry()` in setup.ts with "claude" + "mock"
- REST GET returns `available` array, PUT validates against it
- **Verdict: approved.**

---

## 2026-04-01 18:10 PDT — PLUG.4: Executor registry with named registration

**Done:** Added `ExecutorRegistry` class to `@agentops/core` with `register()`, `get()`, `has()`, `list()` methods. Refactored `ExecutionManager` to accept registry instead of plain factory. Updated `setup.ts` to use `createDefaultRegistry()` with "claude" and "mock" registered. REST API `GET /api/settings/executor-mode` now returns `available` array from registry. `PUT` validates against registered names. Marked PLUG.3c/3d as blocked (non-DB dependencies need broader abstraction).
**Files:** `packages/core/src/executor-registry.ts` (new), `packages/core/src/index.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/agent/setup.ts`, `packages/backend/src/routes/settings.ts`, `TASKS.md` (PLUG.3c/3d blocked)

---

## 2026-04-01 17:50 PDT — Review: PLUG.3b (approved)

**Reviewed:** Repository interfaces in `@agentops/core` + Drizzle implementations.
- 6 interfaces designed from actual DB query analysis across 5 agent modules
- No ORM types leak — plain TS + @agentops/shared types only
- Row types (WorkItemRow, PersonaRow, ProjectRow) provide clean contracts
- `Repositories` aggregate type ready for DI in PLUG.3c
- Drizzle implementations: 6 classes + createDrizzleRepositories() factory
- **Verdict: approved.**

---

## 2026-04-01 17:45 PDT — PLUG.3b: Repository interfaces + Drizzle implementations

**Done:** Defined 6 repository interfaces in `@agentops/core/src/repositories.ts`: WorkItemRepository, ExecutionRepository, PersonaRepository, CommentRepository, ProjectRepository, WorkItemEdgeRepository + `Repositories` aggregate type. Created Drizzle implementations in `packages/backend/src/db/repositories.ts` with `createDrizzleRepositories()` factory. Interfaces designed from actual DB query analysis across 5 agent modules (execution-manager, dispatch, router, coordination, mcp-server).
**Files:** `packages/core/src/repositories.ts` (new), `packages/core/src/index.ts`, `packages/backend/src/db/repositories.ts` (new)

---

## 2026-04-01 17:30 PDT — Review: PLUG.3a (approved)

**Reviewed:** New `@agentops/core` package at `packages/core/`.
- Zero DB/SDK deps confirmed — only `@agentops/shared` + `@types/node`
- `types.ts` and `sandbox.ts` moved with all exports intact
- Backend re-exports from `@agentops/core` — zero broken import paths
- Barrel index.ts exports all types and functions
- Task split 3a-3d correctly ordered (DB abstraction first)
- **Verdict: approved.**

---

## 2026-04-01 17:20 PDT — PLUG.3a: Create @agentops/core package

**Done:** Created `packages/core/` as new workspace package. Moved `types.ts` (AgentExecutor interface, AgentEvent union, AgentTask, SpawnOptions) and `sandbox.ts` (command validation) to core — these are the only agent modules with zero DB/SDK dependencies. Backend's `types.ts` and `sandbox.ts` now re-export from `@agentops/core`. Split PLUG.3 into 4 subtasks (3a-3d) since remaining modules (ExecutionManager, dispatch, router, coordination, mcp-server) all have heavy Drizzle DB dependencies that need abstraction first (PLUG.3b).
**Files:** `packages/core/` (new package), `packages/core/src/types.ts`, `packages/core/src/sandbox.ts`, `packages/core/src/index.ts`, `packages/backend/src/agent/types.ts`, `packages/backend/src/agent/sandbox.ts`, `packages/backend/package.json`, `packages/backend/tsconfig.json`

---

## 2026-04-01 17:10 PDT — Review: PLUG.2 (approved)

**Reviewed:** Composition root at `packages/backend/src/agent/setup.ts`.
- Only file importing ClaudeExecutor/MockExecutor — verified via grep
- `execution-manager.ts` has zero concrete executor references
- `createExecutionManager()` exported with default params for easy customization
- All 8 import sites updated to `setup.js`, test mocks updated
- Clear JSDoc for custom project swap-in
- **Verdict: approved.**

---

## 2026-04-01 17:05 PDT — PLUG.2: Create composition root for executor wiring

**Done:** Created `setup.ts` as the sole file importing concrete executors (ClaudeExecutor, MockExecutor). Exports `createExecutionManager()` factory and lazy `executionManager` singleton. Removed default instance section + concrete imports from `execution-manager.ts` — it now exports only the class and types. Updated all 8 import sites (6 source + 2 test) to import from `setup.js`. Test mocks updated to mock `setup.js` instead of `execution-manager.js`.
**Files:** `packages/backend/src/agent/setup.ts` (new), `packages/backend/src/agent/execution-manager.ts`, 6 source files, 4 test files

---

## 2026-04-01 16:55 PDT — Review: PLUG.1 (approved)

**Reviewed:** ExecutionManager class refactoring in `execution-manager.ts`.
- Class with constructor injection: ExecutorFactory, DbHandle, BroadcastFn
- All module-level state → instance fields (executor, transitionLog, stateHistory, runtimeOverride)
- 6 call sites updated to `executionManager.method()` pattern
- Concrete imports isolated in default factory section (PLUG.2 extraction point)
- Lazy Proxy defers construction for test compatibility, with _resetExecutionManager for cleanup
- 5 test files fixed with `vi.hoisted()` for mockDb
- Build passes, 156/159 tests pass (3 pre-existing failures)
- **Verdict: approved.**

---

## 2026-04-01 16:45 PDT — PLUG.1: Refactor ExecutionManager into class

**Done:** Converted `execution-manager.ts` from module-level functions + singleton into an `ExecutionManager` class with constructor injection (`ExecutorFactory`, `DbHandle`, `BroadcastFn`). All state (executor, runtimeOverride, transitionLog, stateHistory) is now instance state. Default instance uses lazy Proxy for test compatibility. Updated 6 call sites (server.ts, settings.ts, start.ts, router.ts, dispatch.ts, mcp-server.ts) to use `executionManager.method()`. Fixed 5 test files to use `vi.hoisted()` for mockDb and updated mock exports. Tests: 156/159 pass (3 pre-existing failures).
**Files:** `packages/backend/src/agent/execution-manager.ts` (rewritten), `packages/backend/src/server.ts`, `packages/backend/src/start.ts`, `packages/backend/src/routes/settings.ts`, `packages/backend/src/agent/router.ts`, `packages/backend/src/agent/dispatch.ts`, `packages/backend/src/agent/mcp-server.ts`, 5 test files

---

## 2026-04-01 16:25 PDT — Review: SDK.FUT.6 (approved)

**Reviewed:** Doc updates across 4 files for SDK.FUT.1-5 spike references.
- architecture.md: 5-feature table with spike links and status — accurate
- deployment.md: HTTP hooks config, remote execution, worktree settings — practical examples
- personas.md: plugin-based skills with code example, worktree isolation — correct
- getting-started.md: bullet list with all 5 spike links in What's Next
- All spike links verified, content matches spike conclusions
- **Verdict: approved.**

---

## 2026-04-01 16:20 PDT — SDK.FUT.6: Update docs for future SDK features

**Done:** Updated 4 docs to reference evaluated SDK capabilities from FUT.1-5 spikes. architecture.md: added "Evaluated SDK Capabilities" table (5 features with spike links and status). deployment.md: added "Evaluated Future Capabilities" section (HTTP hooks config, remote execution, worktree settings). personas.md: added plugin-based skills and worktree isolation sections. getting-started.md: added "Evaluated SDK Features" links in What's Next.
**Files:** `docs/architecture.md`, `docs/deployment.md`, `docs/personas.md`, `docs/getting-started.md`

---

## 2026-04-01 16:10 PDT — Review: SDK.FUT.5 (approved)

**Reviewed:** Worktree isolation spike at `docs/spikes/worktree-isolation.md`.
- All 5 SDK worktree mechanisms documented (settings, tools, agent isolation, hooks, sessions)
- Types verified against actual `sdk.d.ts` and `sdk-tools.d.ts` declarations
- Honest caveat: `isolation` is on Agent tool, not AgentDefinition
- File locking replacement analysis thorough — yes for git, no for external resources
- Recommendation sound: defer until parallel execution is implemented
- **Verdict: approved.**

---

## 2026-04-01 16:05 PDT — SDK.FUT.5: Worktree isolation spike

**Done:** Evaluated SDK worktree isolation for concurrent agent executions. SDK supports 3 mechanisms: `EnterWorktree`/`ExitWorktree` tools, `isolation: "worktree"` on Agent spawning, and `worktree` settings config (`symlinkDirectories`, `sparsePaths`). Also has `WorktreeCreate`/`WorktreeRemove` hook events. Recommendation: use subagent isolation (Option A) when parallel execution is added — not needed yet since agents run sequentially. Replaces need for custom file locking.
**Files:** `docs/spikes/worktree-isolation.md` (new)

---

## 2026-04-01 15:50 PDT — Review: SDK.FUT.4 (approved)

**Reviewed:** HTTP hooks spike at `docs/spikes/http-hooks.md`.
- HTTP hook API documented: `type: 'http'`, `url`, `headers` with env var interpolation
- Security controls: `allowedHttpHookUrls`, `httpHookAllowedEnvVars`
- 2 integration options with complexity estimates
- Recommendation: settings file first (zero code), UI later
- **Verdict: approved.**

---

## 2026-04-01 15:45 PDT — SDK.FUT.4: HTTP hooks spike

**Done:** Evaluated SDK HTTP hooks for external integrations. HTTP hooks work natively via settings (`type: 'http'`, `url`, `headers` with env var interpolation). Documented security controls (`allowedHttpHookUrls`, `httpHookAllowedEnvVars`). 2 integration options: settings file (zero code) vs UI-configured webhooks. Recommendation: start with settings file — already works.
**Files:** `docs/spikes/http-hooks.md` (new)

---

## 2026-04-01 15:35 PDT — Review: SDK.FUT.3 (approved)

**Reviewed:** Plugin system spike at `docs/spikes/plugin-system.md`.
- Local plugins documented from actual `SdkPluginConfig` type
- Marketplace config (enabledPlugins, extraKnownMarketplaces) with examples
- 3 integration options with complexity estimates
- Recommendation: local first, marketplace later
- **Verdict: approved.**

---

## 2026-04-01 15:30 PDT — SDK.FUT.3: Plugin system spike

**Done:** Evaluated SDK plugin system. Local plugins (`type: 'local'`) work now via `plugins` option. Marketplace uses `enabledPlugins`/`extraKnownMarketplaces` in settings. 3 options: local (low), marketplace (medium), UI browser (high). Recommendation: start with local plugins.
**Files:** `docs/spikes/plugin-system.md` (new)
