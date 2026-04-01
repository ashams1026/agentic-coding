# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-21 complete and archived. Sprint 17 has blocked FX.SDK3/SDK5. Backlog FUT.1-6, PLUG.1-10, AW.1-2 archived. Sprint 22 partial (UX.DASH-ACTIVITY audits + FX.UX.DASH.1-3 + FX.UX.ITEMS.1) archived.

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

### Work Items (`/items`)

- [blocked: Board view component exists (board-view.tsx) but is not exposed in the UI — WorkItemView type is "list" | "flow" only, viewOptions array has no board entry. Cannot audit what users can't access.] **UX.WORK.BOARD** — Audit Work Items board view. Switch to board/kanban view. Verify: columns render by workflow state, cards show title/status/assignee, drag-and-drop works (attempt to move a card between columns). Check empty columns display correctly. Screenshot. File bugs.

### Agent Monitor Bugs

- [x] **FX.UX.AGENT.1** — "Work Item" and "Parent" links in agent header bar navigate to 404.

- [x] **FX.UX.AGENT.2** — MCP status panel triggers error toast on 404. Page `/agents`. The `McpStatus` component in `terminal-renderer.tsx` (line 570) fetches `GET /api/executions/:id/mcp/status` which returns 404 in simulated mode, causing an "API request failed" error toast. Expected: suppress the error gracefully when the endpoint is unavailable (e.g. catch 404 and show nothing, or show "MCP: unavailable" without an error toast). Page `/agents`. The header bar links use `/work-items/:id` route (e.g. `/work-items/wi-au01002`) which doesn't exist — the actual route is `/items`. Clicking either link shows "404 Not Found — Unexpected Application Error". Expected: link to `/items` and call `setSelectedItemId(workItemId)` to open the detail panel, matching the pattern used by the command palette and dashboard activity items. Screenshot: `tests/e2e/results/ux-agent-main-workitem-link.png`.

### Activity Feed Bugs

- [x] **FX.UX.ACTIVITY.1** — Activity feed events all link to generic `/items` instead of specific work item. Page `/activity`. All event links in the Activity Feed use `<Link to="/items">` regardless of which work item the event relates to. Same issue as FX.UX.DASH.3 (fixed for dashboard Recent Activity) but the Activity Feed page (`/activity`) has its own implementation. Expected: use `setSelectedItemId(workItemId)` + `navigate("/items")` pattern matching the dashboard fix. The work item ID is available in the event data (shown as "User Authentication With OAuth2" etc. in each row). *(completed 2026-04-02 02:00 PDT)*

### Persona Manager (`/personas`)

- [x] **UX.PERSONA.LIST** — Audit Persona Manager list and editor. Open `/personas`. Verify: persona list renders with names and avatars, clicking a persona opens the detail/edit panel. Check: system prompt editor loads and is editable, tool configuration checkboxes/multi-select work, skill browser shows SDK skills with search, subagent browser displays available agents. Screenshot each section. File bugs.

- [x] **UX.PERSONA.TEST** — Audit Persona Manager test run and creation. Test the test-run panel: submit a prompt and verify output area shows results or loading state. Test creating a new persona: fill all fields, save, verify it appears in the list. Test deleting a persona. Check validation (empty name, missing required fields). Screenshot. File bugs.

### Settings (`/settings`)

- [x] **UX.SETTINGS** — Audit Settings page (all sections). Open `/settings`. Navigate each section tab/panel: Projects (CRUD operations, project switching), API Keys (add/remove/mask), Workflow Config, Appearance (theme toggle, layout options), Costs, Security, Executor mode (if visible in dev). Verify: forms save correctly, validation messages appear, toasts confirm actions. Screenshot each section. File bugs.

### Pico Chat

- [review] **UX.PICO** — Audit Pico Chat panel. Open the Pico chat panel (floating button or keyboard shortcut). Verify: panel opens with correct styling, previous session loads or empty state shows, message input is functional, sending a message shows it in the chat with loading indicator, responses render with proper formatting (markdown, code blocks). Test creating a new session. Check panel resize/close behavior. Toggle dark mode. Screenshot. File bugs.

### Cross-Cutting

- [ ] **UX.NAV** — Audit navigation and sidebar. Verify: sidebar renders with all page links (Dashboard, Work Items, Agents, Activity, Personas, Settings), active page is highlighted, clicking each link navigates correctly without full reload, project selector in sidebar/header works (switch projects, shows current project name). Test keyboard shortcut for command palette. Check responsive sidebar collapse on narrow viewport. Screenshot. File bugs.

- [ ] **UX.CMD** — Audit Command Palette. Open command palette (Cmd+K or shortcut). Verify: overlay appears, search input is focused, typing filters commands/pages, selecting a command navigates or executes the action, Escape closes the palette. Check that all registered commands appear. Screenshot. File bugs.

- [ ] **UX.DARK** — Comprehensive dark mode audit. Switch to dark mode. Visit every page in sequence (`/`, `/items`, `/agents`, `/activity`, `/personas`, `/settings`), plus open Pico and command palette. For each: screenshot and check for invisible text, low-contrast elements, missing dark backgrounds, broken borders, white flashes on navigation. File all visual issues as individual bugs with page and element identified.

- [ ] **UX.RESPONSIVE** — Comprehensive responsive audit. Set viewport to 1024px width, then 768px. Visit every page in sequence. For each: screenshot and check for horizontal overflow, clipped content, overlapping elements, unreadable text, broken layouts, inaccessible buttons. File all layout issues as individual bugs.

---

## Bug Fixes

- [ ] **FX.UX.REWIND** — Fix disabled rewind button tooltip in Agent Monitor history. In `packages/frontend/src/features/agent-monitor/agent-history.tsx` (~line 329): disabled `<Button>` elements don't fire pointer events, so Radix UI `TooltipTrigger asChild` never activates. Wrap the `<Button>` in a `<span>` so the tooltip trigger remains interactive even when the button is disabled. The tooltip should explain why rewind is unavailable. Found in `tests/e2e/results/file-checkpointing.md` BUG-1.

- [ ] **FX.UX.PERSONA.1** — Persona cards lack keyboard accessibility. In `packages/frontend/src/features/persona-manager/persona-list.tsx` (~line 98): `PersonaCard` uses `<div onClick={onSelect}>` without `role="button"`, `tabIndex={0}`, or `onKeyDown` handler. Cards are not keyboard-navigable. Same pattern as FX.UX.DASH.2 (fixed for dashboard StatCards). Fix: add `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space), and `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` class. Also apply to `CreateCard` component (~line 182).

- [ ] **FX.UX.PERSONA.2** — Built-in persona label mismatch between list and detail panel. Page `/personas`. `PersonaList` (persona-list.tsx line 291) uses `BUILT_IN_IDS.has(p.id)` to show "Built-in" badge, but `PersonaDetailPanel` (persona-detail-panel.tsx line 212) uses `persona.settings?.isSystem === true`. Result: Engineer shows "Built-in" badge in the card grid but "Custom persona" in the detail panel header. Fix: use the same `BUILT_IN_IDS` set in both components, or ensure mock data sets `settings.isSystem = true` for all built-in personas. Screenshots: `tests/e2e/results/ux-persona-list-light.png`, `tests/e2e/results/ux-persona-detail-engineer.png`.

- [ ] **FX.UX.PERSONA.3** — Delete selected persona causes 404 error toast. Page `/personas`. After deleting a persona that is currently selected in the detail panel, the detail panel still tries to fetch the deleted persona's data, resulting in an "API request failed" error toast and a stuck "Loading..." state. Root cause: `handleDeleteConfirm` in `persona-list.tsx` (~line 247) calls `setDeleteTarget(null)` on success but does NOT clear the parent's `selectedId`. Fix: accept an `onDeselect` callback prop (or extend `onSelect` to accept `null`) and call it when the deleted persona matches `selectedId`. Screenshot: `tests/e2e/results/ux-persona-after-delete.png`.

- [blocked: TestRunPanel component exists in persona-editor.tsx but PersonaManagerPage uses PersonaDetailPanel instead. The test-run feature is not accessible from the UI — no route or button leads to persona-editor.tsx. Cannot audit what users can't reach.] **FX.UX.PERSONA.4** — Wire TestRunPanel into Persona Manager UI. The `TestRunPanel` component (`packages/frontend/src/features/persona-manager/test-run-panel.tsx`) exists and is imported in `persona-editor.tsx`, but the page (`pages/persona-manager.tsx` line 38) uses `PersonaDetailPanel` which does not include it. Users cannot test-run a persona. Fix: either add a collapsible TestRunPanel to `PersonaDetailPanel` (at the bottom of the read-only view), or replace `PersonaDetailPanel` with `PersonaEditor` in the page layout.

---

## Housekeeping

- [ ] **HK.TEST.RESULTS** — Restructure `tests/e2e/results/` directory by run date and test name. Current state: all screenshots and report `.md` files are dumped flat into `tests/e2e/results/`. Restructure to `tests/e2e/results/YYYY-MM-DD_HHMMSS/<test-name>/` — each run gets a timestamped directory containing the report `.md` and its screenshots. Move existing results into appropriately dated subdirectories (use git log dates for the original run timestamps). Update the e2e test plan template (`tests/e2e/plans/_template.md`) and any agent instructions that reference result paths to use the new structure. This makes it easy to identify and delete old test runs.

---

## Research: Proposals for Blocked Tasks

> For each blocked issue, research the current SDK/architecture state, explore workarounds or alternative approaches, and write a proposal doc to `docs/proposals/`. Do NOT add tasks to TASKS.md or implement anything — just commit the proposal doc.

- [ ] **RES.SDK.TOOLS** — Research SDK tool discovery alternatives (unblocks FX.SDK3 + FX.SDK5). Investigate: (1) check if newer versions of `@anthropic-ai/claude-agent-sdk` have added tool discovery APIs since the block was filed, (2) examine the SDK source/types for any undocumented way to list built-in tools, (3) evaluate whether the `canUseTool` callback or `PreToolUse` hook can be used to dynamically discover tools at runtime, (4) consider maintaining a version-pinned tool manifest that's auto-verified on SDK upgrade. Write findings and recommended approach to `docs/proposals/sdk-tool-discovery.md`. Commit the doc only.

- [ ] **RES.V2.SESSIONS** — Research V2 session configuration for Pico (unblocks SDK.V2.3). Investigate: (1) check if `SDKSessionOptions` in the latest SDK version now supports `agent`/`agents`, `mcpServers`, `cwd`, `skills`, or `maxBudgetUsd`, (2) examine whether `session.send()` accepts per-message options that could configure these at send-time instead of session-creation time, (3) evaluate a hybrid approach — V2 session for conversation persistence but `query()` with full options for actual execution, (4) check SDK changelog/issues for planned V2 improvements. Write findings and recommended approach to `docs/proposals/v2-session-pico.md`. Commit the doc only.

- [ ] **RES.PLUG.CORE** — Research core package extraction strategy (unblocks PLUG.3c + PLUG.3d). Investigate: (1) catalog all non-DB dependencies of ExecutionManager (logger, audit, concurrency, runRouter, dispatchForState, drizzle operators, etc.) and MCP server module, (2) evaluate a service-locator or dependency container pattern that would let core define interfaces for all deps (not just repositories), (3) consider whether a thinner extraction is viable — move only the executor interface, registry, and workflow engine to core, leaving ExecutionManager in backend, (4) look at how other TS monorepos (e.g., tRPC, Effect) handle this boundary. Write findings and recommended approach to `docs/proposals/core-package-extraction.md`. Commit the doc only.

