# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-21 complete and archived. Sprint 17 has blocked FX.SDK3/SDK5. Backlog FUT.1-6, PLUG.1-10, AW.1-2 archived. Sprint 22 partial (UX.DASH, FX.UX.DASH.1-2) archived.

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

> PLUG.1-10 archived (except PLUG.3c/3d blocked).

- [blocked: ExecutionManager has 6+ non-DB dependencies beyond repositories (logger, audit, concurrency, runRouter, dispatchForState, drizzle eq operator). Moving to core requires abstracting ALL of these as interfaces — much larger scope than DB repositories alone. Defer until a broader service abstraction layer is designed.] **PLUG.3c** — Move ExecutionManager, dispatch, router, coordination to `@agentops/core`. Refactor these modules to use the repository interfaces from PLUG.3b instead of direct Drizzle imports. Move them to `packages/core/src/`. Update backend to inject concrete repository implementations via the composition root.

- [blocked: same as PLUG.3c — mcp-server.ts depends on SDK MCP factory, logger, audit, coordination, memory modules beyond just DB. Requires broader service abstraction.] **PLUG.3d** — Move MCP server definition to `@agentops/core`. Refactor `mcp-server.ts` to use repository interfaces. The SDK MCP server factory (`createSdkMcpServer`) stays as a peer dependency since it's from the agent SDK.

---

## Sprint 22: Visual UX Audit

> Exploratory testing sprint. Each task: start dev servers (ports 3001 + 5173), open the page via chrome-devtools MCP, interact with every feature, screenshot each state, and file bugs as new `FX.UX.*` tasks in TASKS.md. Bugs should include: page, what's broken, expected behavior, and a screenshot path if possible.

### Dashboard Bugs

- [x] **FX.UX.DASH.3** — Activity items all link to generic `/items` instead of specific work item. Page `/`. All Recent Activity events in `recent-activity.tsx` set `targetPath: "/items"` regardless of which work item they relate to. Clicking any event navigates to the work items list page, not the specific work item detail. Expected: link to `/items?selected={workItemId}` or a route that opens the relevant work item's detail panel.

### Work Items (`/items`)

- [x] **UX.WORK.LIST** — Audit Work Items list view. Open `/items`, verify list view is the default or switch to it. Check: items render with correct status badges, sorting controls work (click each sort option), filter bar filters by status/assignee/priority, empty state shows when filters match nothing. Click an item to open detail panel. Scroll a long list — verify no layout jank. Screenshot each state. File bugs.

- [blocked: Board view component exists (board-view.tsx) but is not exposed in the UI — WorkItemView type is "list" | "flow" only, viewOptions array has no board entry. Cannot audit what users can't access.] **UX.WORK.BOARD** — Audit Work Items board view. Switch to board/kanban view. Verify: columns render by workflow state, cards show title/status/assignee, drag-and-drop works (attempt to move a card between columns). Check empty columns display correctly. Screenshot. File bugs.

- [x] **UX.WORK.FLOW** — Audit Work Items flow view. Switch to flow view. Verify: flow diagram renders, nodes and edges are visible and labeled, zoom/pan works if supported. Screenshot at different zoom levels. File bugs.

- [x] **UX.WORK.CREATE** — Audit Work Item creation. Click the create/add button. Verify: form opens, all fields are present (title, description, status, assignee, priority), validation works (submit empty form), successful creation adds item to the list. File bugs.

### Work Items Bugs

- [x] **FX.UX.ITEMS.1** — No empty state message when filters match no items. Page `/items`. When filtering by a state with no items (e.g. "Done"), the list area is completely blank — no message like "No items match your filters" or prompt to clear filters. Expected: show a centered empty state with a message and a "Clear filters" button. Screenshot: `tests/e2e/results/ux-work-list-empty-nodetail.png`.

### Work Item Detail Panel

- [review] **UX.DETAIL** — Audit detail panel. Open a work item's detail panel. Verify: all sections render (description, child tasks, proposals, comments, execution timeline), each section has correct data or appropriate empty state. Test editing fields (title, description, status). Check comment input and submission. Scroll within the panel if content overflows. Toggle dark mode. Screenshot each section. File bugs.

### Agent Monitor (`/agents`)

- [ ] **UX.AGENT.MAIN** — Audit Agent Monitor main layout. Open `/agents`. Verify: layout renders (sidebar + main area), active agent sidebar shows agents or empty state with correct CTA button (should link to `/items`, not storyboard). Test terminal renderer output area. Check split view toggle if present. Screenshot. File bugs.

- [ ] **UX.AGENT.CONTROLS** — Audit Agent Monitor controls and panels. Test: agent control bar buttons (pause, resume, cancel), file changes panel renders diffs or empty state, router decision cards display correctly, MCP status panel shows server status, model switcher dropdown works. Verify subagent cards render for nested agents. Screenshot each panel. File bugs.

- [ ] **UX.AGENT.HISTORY** — Audit Agent Monitor history view. Navigate to agent history. Verify: past executions list populates, clicking an entry shows execution details, terminal output replays or displays correctly. Check filtering/pagination if present. Screenshot. File bugs.

### Activity Feed (`/activity`)

- [ ] **UX.ACTIVITY** — Audit Activity Feed page. Open `/activity`. Verify: events render chronologically with timestamps, event types are visually distinct (icons/colors), scrolling loads more events or shows end-of-list. Click an event to navigate to the related entity. Check empty state. Toggle dark mode. Screenshot. File bugs.

### Persona Manager (`/personas`)

- [ ] **UX.PERSONA.LIST** — Audit Persona Manager list and editor. Open `/personas`. Verify: persona list renders with names and avatars, clicking a persona opens the detail/edit panel. Check: system prompt editor loads and is editable, tool configuration checkboxes/multi-select work, skill browser shows SDK skills with search, subagent browser displays available agents. Screenshot each section. File bugs.

- [ ] **UX.PERSONA.TEST** — Audit Persona Manager test run and creation. Test the test-run panel: submit a prompt and verify output area shows results or loading state. Test creating a new persona: fill all fields, save, verify it appears in the list. Test deleting a persona. Check validation (empty name, missing required fields). Screenshot. File bugs.

### Settings (`/settings`)

- [ ] **UX.SETTINGS** — Audit Settings page (all sections). Open `/settings`. Navigate each section tab/panel: Projects (CRUD operations, project switching), API Keys (add/remove/mask), Workflow Config, Appearance (theme toggle, layout options), Costs, Security, Executor mode (if visible in dev). Verify: forms save correctly, validation messages appear, toasts confirm actions. Screenshot each section. File bugs.

### Pico Chat

- [ ] **UX.PICO** — Audit Pico Chat panel. Open the Pico chat panel (floating button or keyboard shortcut). Verify: panel opens with correct styling, previous session loads or empty state shows, message input is functional, sending a message shows it in the chat with loading indicator, responses render with proper formatting (markdown, code blocks). Test creating a new session. Check panel resize/close behavior. Toggle dark mode. Screenshot. File bugs.

### Cross-Cutting

- [ ] **UX.NAV** — Audit navigation and sidebar. Verify: sidebar renders with all page links (Dashboard, Work Items, Agents, Activity, Personas, Settings), active page is highlighted, clicking each link navigates correctly without full reload, project selector in sidebar/header works (switch projects, shows current project name). Test keyboard shortcut for command palette. Check responsive sidebar collapse on narrow viewport. Screenshot. File bugs.

- [ ] **UX.CMD** — Audit Command Palette. Open command palette (Cmd+K or shortcut). Verify: overlay appears, search input is focused, typing filters commands/pages, selecting a command navigates or executes the action, Escape closes the palette. Check that all registered commands appear. Screenshot. File bugs.

- [ ] **UX.DARK** — Comprehensive dark mode audit. Switch to dark mode. Visit every page in sequence (`/`, `/items`, `/agents`, `/activity`, `/personas`, `/settings`), plus open Pico and command palette. For each: screenshot and check for invisible text, low-contrast elements, missing dark backgrounds, broken borders, white flashes on navigation. File all visual issues as individual bugs with page and element identified.

- [ ] **UX.RESPONSIVE** — Comprehensive responsive audit. Set viewport to 1024px width, then 768px. Visit every page in sequence. For each: screenshot and check for horizontal overflow, clipped content, overlapping elements, unreadable text, broken layouts, inaccessible buttons. File all layout issues as individual bugs.

---

## Bug Fixes

- [ ] **FX.UX.REWIND** — Fix disabled rewind button tooltip in Agent Monitor history. In `packages/frontend/src/features/agent-monitor/agent-history.tsx` (~line 329): disabled `<Button>` elements don't fire pointer events, so Radix UI `TooltipTrigger asChild` never activates. Wrap the `<Button>` in a `<span>` so the tooltip trigger remains interactive even when the button is disabled. The tooltip should explain why rewind is unavailable. Found in `tests/e2e/results/file-checkpointing.md` BUG-1.

---

## Housekeeping

- [ ] **HK.TEST.RESULTS** — Restructure `tests/e2e/results/` directory by run date and test name. Current state: all screenshots and report `.md` files are dumped flat into `tests/e2e/results/`. Restructure to `tests/e2e/results/YYYY-MM-DD_HHMMSS/<test-name>/` — each run gets a timestamped directory containing the report `.md` and its screenshots. Move existing results into appropriately dated subdirectories (use git log dates for the original run timestamps). Update the e2e test plan template (`tests/e2e/plans/_template.md`) and any agent instructions that reference result paths to use the new structure. This makes it easy to identify and delete old test runs.

---

## Research: Proposals for Blocked Tasks

> For each blocked issue, research the current SDK/architecture state, explore workarounds or alternative approaches, and write a proposal doc to `docs/proposals/`. Do NOT add tasks to TASKS.md or implement anything — just commit the proposal doc.

- [ ] **RES.SDK.TOOLS** — Research SDK tool discovery alternatives (unblocks FX.SDK3 + FX.SDK5). Investigate: (1) check if newer versions of `@anthropic-ai/claude-agent-sdk` have added tool discovery APIs since the block was filed, (2) examine the SDK source/types for any undocumented way to list built-in tools, (3) evaluate whether the `canUseTool` callback or `PreToolUse` hook can be used to dynamically discover tools at runtime, (4) consider maintaining a version-pinned tool manifest that's auto-verified on SDK upgrade. Write findings and recommended approach to `docs/proposals/sdk-tool-discovery.md`. Commit the doc only.

- [ ] **RES.V2.SESSIONS** — Research V2 session configuration for Pico (unblocks SDK.V2.3). Investigate: (1) check if `SDKSessionOptions` in the latest SDK version now supports `agent`/`agents`, `mcpServers`, `cwd`, `skills`, or `maxBudgetUsd`, (2) examine whether `session.send()` accepts per-message options that could configure these at send-time instead of session-creation time, (3) evaluate a hybrid approach — V2 session for conversation persistence but `query()` with full options for actual execution, (4) check SDK changelog/issues for planned V2 improvements. Write findings and recommended approach to `docs/proposals/v2-session-pico.md`. Commit the doc only.

- [ ] **RES.PLUG.CORE** — Research core package extraction strategy (unblocks PLUG.3c + PLUG.3d). Investigate: (1) catalog all non-DB dependencies of ExecutionManager (logger, audit, concurrency, runRouter, dispatchForState, drizzle operators, etc.) and MCP server module, (2) evaluate a service-locator or dependency container pattern that would let core define interfaces for all deps (not just repositories), (3) consider whether a thinner extraction is viable — move only the executor interface, registry, and workflow engine to core, leaving ExecutionManager in backend, (4) look at how other TS monorepos (e.g., tRPC, Effect) handle this boundary. Write findings and recommended approach to `docs/proposals/core-package-extraction.md`. Commit the doc only.

