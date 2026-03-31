# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-15 complete and archived.

---

## Sprint 17: Agent Pipeline Fixes & Monitor UX

> Critical fixes from first real-world test run. Router loop, cost display, agent monitor readability, activity feed descriptions.
> Also includes persona audit, skills system, and UX improvements.

### Remove Mock Layer & E2E Test DB

- [ ] **FX.MOCK1** — Remove mock API mode from frontend. Delete the `apiMode` field from `useUIStore` (and its localStorage persistence). Remove the mock/real branching in `packages/frontend/src/api/index.ts` — all exports should point directly to the real API client. Remove the `initWsConnection` mode check — always connect to the real WebSocket. Remove the QF.1 status bar mock/live toggle. Remove the demo controls that rely on mock WS (`features/demo/demo-controls.tsx`). The frontend now always talks to the real backend. Keep the `mocks/` directory for now (next task deletes it).

- [ ] **FX.MOCK2** — Delete mock data layer. Delete `packages/frontend/src/mocks/` directory entirely (api.ts, fixtures.ts, ws.ts, demo.ts). Remove any imports of mock functions throughout the codebase. Clean up any dead code that only existed to support the mock layer (mock WS event simulation, demo mode hooks, etc.).

- [ ] **FX.MOCK3** — Create E2E test database script. Create `scripts/test-e2e.sh` (and/or `packages/backend/src/db/seed-e2e.ts`): starts the backend with `AGENTOPS_DB_PATH=/tmp/agentops-e2e-test.db` (or a configurable temp path), runs migrations on the test DB, seeds it with E2E test fixtures (same data the mock fixtures had — projects, personas, work items in various states, executions, comments), starts the frontend pointing at this backend, prints the URLs. Add `"test:e2e:setup"` and `"test:e2e:teardown"` scripts to root `package.json`. E2E test plan prerequisites should reference this script. On teardown: delete the temp DB file.

- [ ] **FX.MOCK4** — Create demo seed snapshot. For showcasing the app without running real agents: create `packages/backend/src/db/seed-demo.ts` with a rich dataset (multiple projects, work items in all states, realistic execution history with comments, cost data, proposals). Add `"db:seed:demo"` script. Users can run `pnpm db:seed:demo` to populate their local DB with demo data. This replaces the old in-memory mock "Watch Demo" feature with persistent real data.

### Settings Navigation Fix

- [ ] **FX.SET1** — Remove duplicate settings nav item and rename section. In `packages/frontend/src/features/settings/settings-layout.tsx`: the "API Keys" and "Concurrency" sidebar links both render the same `ApiKeysSection` component (which contains both the API key input and the concurrency slider). Remove the "Concurrency" nav entry. Rename the remaining section from "API Keys" to "API & Execution" (or "Agent Configuration") to better reflect that it covers both API key management and concurrency/execution settings. Update the section `id` and any references. Verify only one link appears in the settings sidebar and it renders the combined content.

- [ ] **FX.SET2** — Remove workflow state machine diagram from settings. In the Settings → Workflow section: remove the SVG state machine diagram. It's redundant with the Flow view on the Work Items page and doesn't look good. The Workflow settings section should only contain the auto-routing toggle and the persona-per-state assignment table. Delete the diagram component and any related layout code.

- [ ] **FX.SET3** — Replace auto-routing toggle with play/pause button. Replace the current ON/OFF toggle switch for auto-routing with a prominent play/pause button. In the **status bar** (bottom of the app): add a play/pause icon button next to the project name — Play (triangle) when auto-routing is active (green tint), Pause (two bars) when paused (amber tint). Tooltip: "Auto-routing: active — agents automatically transition work items" or "Auto-routing: paused — manual transitions only". Clicking toggles `autoRouting` via `PATCH /api/projects/:id`. In **Settings → Workflow**: replace the toggle switch with the same play/pause button (larger, with descriptive text beside it). In the **Work Items page header**: show a small play/pause indicator next to the page title so the user always knows the current mode. The play/pause metaphor should feel like controlling a pipeline — play means work flows automatically, pause means you're driving manually.

### Graceful Restart Modal

- [ ] **FX.RST1** — Add graceful restart flow with active agent modal. In Settings → Service section (or wherever the restart button lives): when the user clicks "Restart Service", hit `GET /api/settings/concurrency` (or a new `GET /api/service/status`) to check for active executions. If zero active agents: restart immediately (existing behavior). If one or more active agents: show a modal dialog with: "Waiting for N agent(s) to finish..." header, a list of active executions (persona name, work item title, elapsed time for each), a live countdown/spinner that polls every 3 seconds and auto-closes when all agents complete, a "Force Restart" button (red, with confirmation: "This will kill N running agent(s). Their work will be lost."), a "Cancel" button to abort the restart. On force restart: hit `POST /api/service/restart?force=true` which sends SIGTERM to active executions immediately then restarts. On graceful completion: hit `POST /api/service/restart` after all agents finish. Backend routes needed: `GET /api/service/status` returns `{ activeExecutions: [{ executionId, personaName, workItemTitle, elapsedMs }] }`, `POST /api/service/restart` with optional `?force=true` query param.

### Flow View Redesign

- [ ] **FX.FLOW1** — Redesign Flow view as a vertical state machine. Replace the current horizontal BFS-layout SVG graph in `packages/frontend/src/features/work-items/flow-view.tsx` with a clean vertical layout. No charting library needed — this is static HTML/CSS with Tailwind, not an interactive graph. Structure: a vertical column of state nodes connected by arrows, flowing top to bottom in workflow order (Backlog → Planning → Decomposition → Ready → In Progress → In Review → Done, with Blocked branching off to the side). Between each state pair, show a small Router node (diamond or pill shape, Pico-sized, with the Router's indigo color) indicating that the Router agent decides this transition. Each state node is a card showing: state name with colored dot, item count badge, active agent count + pulsing indicator, persona avatar stack (who's assigned to this state), progress indicator (items done / total). Arrows are simple CSS borders or SVG lines (straight down, no bezier curves needed). Blocked state branches off to the right from any state that can transition to it, connected with a dashed line. The whole layout should be centered in the content area, scrollable vertically if needed. Click a state node to filter the detail panel to items in that state (existing behavior). Remove the old `computeLayout` and `computeArrowPath` SVG logic — replace entirely with flex/grid CSS layout.

### Sidebar Navigation Fix

- [ ] **FX.NAV1** — Fix sidebar nav item layout and interaction states. In `packages/frontend/src/components/sidebar.tsx`: the nav items currently render with icon stacked above the label instead of inline beside it (visible in e2e test screenshots). Fix the layout so icon and label are on the same row (`flex items-center gap-3`) in expanded mode. Investigate what's causing the vertical stacking — likely a CSS conflict, missing width constraint, or the collapsed-mode styles leaking into expanded mode. Also fix interaction states: add a visible `hover:bg-accent` background on hover (currently not appearing), add a distinct active/selected state with a left border accent or stronger background (`bg-accent/80` + `font-semibold`), add `rounded-lg` for softer corners, ensure the active page is clearly distinguishable at a glance. Reference modern sidebar patterns (e.g., Linear, Notion) — icon left, label right, subtle hover, bold active.

### Persona Manager UX

- [ ] **FX.PM1** — Add inline system prompt preview to persona cards. In `packages/frontend/src/features/persona-manager/`: add an expand/collapse interaction to each persona card in the grid. At the bottom of each card, add a "View prompt" button with a chevron icon. Clicking it expands the card inline (spans the full grid width, pushes cards below it down) to reveal the persona's system prompt rendered as markdown (reuse MarkdownPreview component). The expanded view shows: rendered system prompt (scrollable, max-height ~400px), MCP tools list as badges, SDK tools list as badges, skills list (if any) as file path pills, model badge, budget. A "Collapse" button or clicking the chevron again closes it. Only one card can be expanded at a time — expanding another collapses the current one. Smooth height animation with `transition-all duration-200`.

### Bug: MCP Tool Name Mismatch

- [ ] **FX.0** — Fix `transition_state` → `route_to_state` mismatch in seed personas. In `packages/backend/src/db/seed.ts`: the Product Manager, Engineer, and Code Reviewer personas list `"transition_state"` in their `mcpTools` array, but the MCP server tool is actually called `"route_to_state"`. This means these personas silently fail when trying to signal state transitions, which likely caused the PM to never properly signal "planning is done" — leading to the Router re-routing back to Planning in a loop. Fix: replace `"transition_state"` with `"route_to_state"` in all persona seed data. Also audit `packages/backend/src/agent/mcp-server.ts` to confirm the tool allowlist filtering uses these exact names — if a persona's `mcpTools` doesn't match the registered tool name, the tool is silently unavailable.

### Persona Audit & Prompt Overhaul

> Each persona needs a full audit: correct MCP tool names (cross-reference `mcp-server.ts`), correct SDK tool names, complete tool sets for their role, and a detailed system prompt that reflects how we actually build software (task tracking, worklog updates, review cycles, one-commit-per-task, build verification). Reference the AGENT_PROMPT.md and CLAUDE.md patterns we've been using successfully.

- [ ] **FX.P1** — Audit and overhaul Product Manager persona. In `packages/backend/src/db/seed.ts` PM entry: (1) Fix `mcpTools` — cross-reference every name against the 7 registered tools in `mcp-server.ts` (`post_comment`, `create_children`, `route_to_state`, `list_items`, `get_context`, `flag_blocked`, `request_review`). PM should have: `post_comment`, `list_items`, `get_context`, `request_review`. PM should NOT have `route_to_state` (that's Router's job) or `create_children` (that's Tech Lead's). (2) Fix `allowedTools` — verify these are valid Claude SDK tool names. (3) Overhaul `systemPrompt` — make it much more detailed: explain the full workflow context (PM runs when item enters Planning state), what the PM receives (work item title + description + any user comments), exactly what output is expected (structured acceptance criteria as a comment with checkboxes, scope definition, priority recommendation, open questions flagged), what "done" looks like (criteria posted, no further action needed — the Router handles transition), common pitfalls to avoid (don't try to write code, don't decompose into tasks, don't transition state yourself). Include an example of good acceptance criteria output.

- [ ] **FX.P2** — Audit and overhaul Tech Lead persona. In seed.ts Tech Lead entry: (1) Fix `mcpTools` — should have: `create_children`, `post_comment`, `get_context`, `list_items`. Remove `request_review` (not Tech Lead's job) and `create_tasks` (wrong name — the tool is `create_children`). (2) Overhaul `systemPrompt` — explain: Tech Lead runs when item enters Decomposition state, receives the work item with PM's acceptance criteria already attached as comments, must read the actual codebase (not guess) to understand architecture before decomposing, output is child work items via `create_children` tool (not proposals), each child must include: clear title, detailed description with file paths and component names, dependency edges. Explain the one-task-one-commit principle — each child should be completable in a single agent session. Include guidance on granularity (2-8 children typical), when to skip decomposition (item is already small enough — flag as Ready), and how to document architectural decisions as a comment.

- [ ] **FX.P3** — Audit and overhaul Engineer persona. In seed.ts Engineer entry: (1) Fix `mcpTools` — should have: `post_comment`, `flag_blocked`, `get_context`. Remove `transition_state` (wrong name, and Engineers shouldn't transition state — Router handles that). (2) Fix `allowedTools` — ensure Write and Edit are both present for file creation/modification. (3) Overhaul `systemPrompt` — explain: Engineer runs when item enters In Progress state, receives work item with description + acceptance criteria + parent context + any rejection feedback from previous review cycles, must read relevant code first (use Glob/Grep to find patterns), implement following project conventions, verify build passes (`pnpm build`), post a completion comment summarizing what was done and files changed. Include: how to handle rejection feedback (address EVERY point, don't skip any), when to use `flag_blocked` (missing dependency, unclear requirement, failing test they can't fix), what NOT to do (don't refactor surrounding code, don't add features beyond scope, don't skip build verification). Emphasize reading existing patterns before writing new code.

- [ ] **FX.P4** — Audit and overhaul Code Reviewer persona. In seed.ts Reviewer entry: (1) Fix `mcpTools` — should have: `post_comment`, `get_context`, `list_items`, `request_review`. Remove `transition_state` (wrong name, Router handles transitions). (2) Overhaul `systemPrompt` — explain: Reviewer runs when item enters In Review state, receives work item + all execution history + the engineer's completion comment listing files changed, must read every modified file, run `pnpm build` to verify zero errors. Provide a detailed review checklist: does implementation match acceptance criteria (check each criterion), are there obvious bugs or logic errors, TypeScript types correct, naming conventions followed, no hardcoded values, error handling appropriate, dark mode supported (for UI), responsive (for UI), no security vulnerabilities (XSS, injection). Output: structured comment with verdict (approve/reject), specific issues with file names and line numbers if rejecting, summary of what was verified if approving. Explain rejection payloads: include severity (low/medium/high), specific fix instructions, retry hints.

- [ ] **FX.P5** — Audit and overhaul Router persona. In seed.ts Router entry: (1) Verify `allowedTools` — Router uses MCP tools only, not SDK tools. Should be empty array `[]` for `allowedTools`. (2) Verify `mcpTools` — should be: `route_to_state`, `list_items`, `get_context`, `post_comment`. Router needs `post_comment` to explain its routing decision. (3) Overhaul `systemPrompt` — make routing rules explicit and unambiguous: after Planning → route to Decomposition (if item needs children) or Ready (if small enough), after Decomposition → route to Ready, after Ready → no action (dispatch handles In Progress), after In Progress → route to In Review, after In Review with approval → route to Done, after In Review with rejection → route to In Progress (include rejection context), if stuck or unclear → route to Blocked with reason. Add: NEVER route to the current state, NEVER route backwards more than one step, check execution outcome and summary before deciding, post a one-line comment explaining the routing decision. Include the valid transitions map from the workflow so the Router has it in context.

- [ ] **FX.P6** — Verify SDK tool names match what the SDK expects. In `packages/backend/src/agent/claude-executor.ts`: the SDK type definitions show tool input types like `FileReadInput`, `FileEditInput`, `FileWriteInput`, `BashInput`, `GlobInput`, `GrepInput`, `WebFetchInput`, `WebSearchInput`, `AgentInput`, `NotebookEditInput`, `TodoWriteInput`, `AskUserQuestionInput`. Verify whether the SDK's `allowedTools` option expects the short names (`Read`, `Edit`, `Write`) or the full type names (`FileRead`, `FileEdit`, `FileWrite`). Test by spawning a minimal executor with a known tool list and checking if the agent actually has access. Fix all persona `allowedTools` arrays to use the correct names. Document the full list of available SDK tools as a comment in `claude-executor.ts` for reference.

### Persona Skills System

- [ ] **FX.P7** — Add skills field to persona schema. In `packages/shared/src/entities.ts`: add `skills: string[]` to the `Persona` interface — an array of skill file paths (relative to the project directory, e.g., `skills/review-checklist.md`, `skills/coding-standards.md`). In `packages/backend/src/db/schema.ts`: add `skills` column to personas table (text, JSON serialized array, default `[]`). Run migration.

- [ ] **FX.P8** — Build skill browser in persona editor. In the Persona Editor UI (`packages/frontend/src/features/persona-manager/`): add a "Skills" section below the Tools section. Show currently assigned skills as removable pills. Add a "Browse skills..." button that opens a modal: the modal uses the `POST /api/settings/browse-directory` endpoint (from PS.10) scoped to the project directory, filtered to show only `.md` files. User can navigate folders, select files, and add them. Also allow typing a path directly. Show a preview of the skill file content when selected (first 20 lines). Skills are saved as relative paths in the persona's `skills` array.

- [ ] **FX.P9** — Inject persona skills into system prompt. In `packages/backend/src/agent/claude-executor.ts` `buildSystemPrompt()`: after the persona's base system prompt, append a "Skills" section. For each skill path in `persona.skills`: read the file from the project directory (`path.join(project.path, skillPath)`), append its content wrapped in a header: `\n\n## Skill: {filename}\n\n{content}`. Cap total injected skill content at ~2000 tokens to avoid blowing the context. If a skill file doesn't exist, skip it and log a warning. This gives each persona custom reference material (coding standards, review checklists, architecture guides, etc.) that the user curates per-persona.

### Router & Dispatch Fixes

- [ ] **FX.1** — Prevent Router from re-routing to the same state. In `packages/backend/src/agent/mcp-server.ts` `route_to_state` tool: reject transitions where `targetState === currentState` with an error message "Cannot route to the current state." This prevents the PM→Router→PM loop where the Router keeps picking the same state.

- [ ] **FX.2** — Add Router transition history awareness. In `packages/backend/src/agent/router.ts`: when building the Router's system prompt, include the last 3 state transitions for this work item (from DB or audit log). Add an explicit instruction: "Do NOT route to a state this item was just in. If the persona's work appears incomplete, route to Blocked with a reason rather than re-triggering the same persona." This gives the Router enough context to break cycles.

- [ ] **FX.3** — Log when rate limiter triggers. In `packages/backend/src/agent/execution-manager.ts`: when `canTransition()` returns false, log a warning with the workItemId, current transition count, and a message: "Rate limiter triggered — max transitions per hour reached." Post a system comment on the work item so the user can see it in the UI. Broadcast a WS event so the dashboard can reflect it.

- [ ] **FX.4** — Add transition loop detection. In `execution-manager.ts` or `dispatch.ts`: track the last 3 state transitions per work item in memory. If the same state appears 3 times in the recent history (A→B→A→B pattern), halt the chain and post a system comment: "Detected routing loop — halting automatic transitions. Manual intervention required." Transition the item to Blocked.

### Cost Display Fixes

- [ ] **FX.5** — Audit cost aggregation and display. Check the dashboard stats route (`GET /api/dashboard/stats`) and cost summary route: verify that `costUsd` is correctly converted from cents (DB storage) to dollars (display). Verify the frontend dashboard cost widgets are dividing by 100 where needed. Check if seeded execution data has inflated fake costs that pollute the real project's totals. Ensure cost queries are scoped to the selected project (may overlap with PS.4 from Sprint 15).

### Agent Monitor UX Overhaul

- [ ] **FX.6** — Show persona identity in terminal renderer. In `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`: add a header bar above the output showing persona name (with colored avatar), persona model badge, and the work item title being worked on. Look up persona details from the execution's `personaId`. This should be the first thing the user sees — "Product Manager (Sonnet) working on Build TicTacToe App".

- [ ] **FX.7** — Render agent output as a chat thread. Restructure the terminal renderer to display output as a conversation: system/user messages appear as chat bubbles (left-aligned, muted background), agent text responses appear as chat bubbles (right-aligned or full-width), thinking blocks are collapsible accordion sections (collapsed by default, italic muted text, "Thinking..." label), tool calls are custom UI cards (tool icon + name + collapsible input/output, reuse existing ToolCallSection). Group consecutive text chunks into single message bubbles. Show timestamps on each message group.

- [ ] **FX.8** — Fix historical log chunk type detection. In `terminal-renderer.tsx` where `execution.logs` is split into chunks: instead of marking all lines as `"text"`, parse the log content to detect chunk types. Look for JSON-parseable lines that contain `chunkType` fields, or use heuristics: lines starting with `Tool:` or containing `tool_call`/`tool_result` → tool type, lines wrapped in `<thinking>` tags or prefixed with thinking indicators → thinking type, code blocks between triple backticks → code type. This restores structure to historical execution replays.

### Activity Feed Improvements

- [ ] **FX.9** — Enrich activity feed event descriptions. In `packages/frontend/src/features/activity-feed/activity-feed.tsx`: for base (historical) events, look up the persona name and work item title from the available query data. Replace generic descriptions: "Agent started working on work item" → "[Persona Name] started work on [Work Item Title]", "Agent completed" → "[Persona Name] completed work on [Work Item Title] (success/failed)", "State changed" → "[Work Item Title] moved from [Old State] to [New State]", "Router decision" → "Router moved [Work Item Title] to [New State]: [reasoning excerpt]". Ensure live WS events use the same enriched format (some already do — make it consistent).

---

## Sprint 18: Pico — Project Assistant

> Pico is a friendly dog-persona AI assistant built into AgentOps. Named after the creator's dog.
> Pico is always available via a floating chat bubble, can answer questions about the project, help manage work items, and search documentation.
> Pico is a special built-in persona: not editable, not triggered by workflow state changes, only invoked by user chat.
> Pico's chat supports rich rendering: markdown, collapsible thinking, tool call cards, and a warm conversational tone.

### Backend: Pico Persona & Chat API

- [ ] **PICO.1** — Add Pico as a built-in system persona. In `packages/backend/src/db/seed.ts`: add a Pico persona with `id: "ps-pico"`, `name: "Pico"`, `description: "Your friendly project assistant. Woof!"`, `avatar: { color: "#f59e0b", icon: "dog" }`, `model: "sonnet"`, `settings: { isSystem: true, isAssistant: true }`. The `isAssistant` flag distinguishes Pico from workflow personas. System prompt should establish Pico's personality: friendly, enthusiastic, helpful dog who loves the project. Pico uses casual language, occasionally says "woof" or dog-related expressions, but stays professional and accurate about technical content. Pico knows the project deeply — its architecture, workflow states, personas, and codebase. In `packages/shared/src/entities.ts`: add `isAssistant?: boolean` to Persona settings type. Pico should NOT appear in persona-per-state assignment dropdowns. Pico should NOT be editable or deletable in the Persona Manager (show a "Built-in assistant" badge, disable edit/delete).

- [ ] **PICO.2** — Create chat session API. Add `packages/backend/src/routes/chat.ts` with routes: `POST /api/chat/sessions` — create a new chat session `{ projectId }`, returns `{ sessionId }`. `GET /api/chat/sessions?projectId=` — list sessions (most recent first). `GET /api/chat/sessions/:id/messages` — get message history. `DELETE /api/chat/sessions/:id` — delete session. Add a `chat_sessions` table to schema: `id`, `projectId`, `title` (auto-generated from first message), `createdAt`, `updatedAt`. Add a `chat_messages` table: `id`, `sessionId`, `role` ("user" | "assistant"), `content` (text), `metadata` (JSON — tool calls, thinking blocks, timestamps), `createdAt`.

- [ ] **PICO.3** — Create chat streaming endpoint. Add `POST /api/chat/sessions/:id/messages` route: accepts `{ content: string }`, saves the user message to DB, spawns Pico via the Claude executor with the full conversation history as context, streams the response via Server-Sent Events (SSE) — each chunk includes `{ type: "text" | "thinking" | "tool_use" | "tool_result", content }`. On completion, saves the assistant message (with metadata for thinking/tool calls) to DB. Pico's system prompt is assembled from: base personality + project context (from `get_context`) + conversation history. Pico has access to SDK tools: Read, Glob, Grep, WebSearch, and MCP tools: `list_items`, `get_context`, `post_comment`.

- [ ] **PICO.4** — Author Pico's project knowledge skill. Create `packages/backend/src/agent/pico-skill.md`: a comprehensive skill file that teaches Pico about AgentOps. Include: what AgentOps is (one paragraph), the workflow states and what each means, the 5 workflow personas and their roles, how work items flow through the pipeline, how to interpret execution history and comments, common user questions (how do I create a work item? how do I trigger an agent? why is my item stuck? what does Blocked mean? how do I change the assigned persona?). This file is injected into Pico's system prompt on every chat. Keep it under 1500 tokens. Also give Pico access to the `docs/` directory — the system prompt should instruct Pico to use Read/Glob to search docs when answering architecture or API questions.

### Frontend: Chat Interface

- [ ] **PICO.5** — Build floating chat bubble. Create `packages/frontend/src/features/pico/chat-bubble.tsx`: a circular button (56px) fixed to the bottom-right corner of the viewport (`bottom-6 right-6`), showing a dog icon (or paw print) with Pico's amber color. Subtle bounce animation on first load. Unread message indicator (small dot) when Pico has responded and chat is closed. Click toggles the chat panel open/closed. Render in `root-layout.tsx` so it's available on every page.

- [ ] **PICO.6** — Build chat panel. Create `packages/frontend/src/features/pico/chat-panel.tsx`: a panel that appears above the chat bubble (400px wide, 500px tall, rounded corners, shadow-lg). Header: "Pico" with dog icon, session title, minimize button, new session button. Message area: scrollable, auto-scroll to bottom on new messages. Input area: textarea with send button, Cmd+Enter to send, disabled while Pico is responding. Show a typing indicator (three bouncing dots) while streaming. Panel is dismissible by clicking outside or the minimize button. Animate open/close with scale + opacity transition.

- [ ] **PICO.7** — Build chat message components. Create `packages/frontend/src/features/pico/chat-message.tsx`: user messages render as right-aligned bubbles (primary color background, white text). Pico messages render as left-aligned bubbles (muted background) with Pico's avatar. Pico message content supports: **markdown rendering** (paragraphs, bold, code, lists, links — reuse or extend the existing MarkdownPreview component), **thinking blocks** (collapsible accordion, "Pico is thinking..." label, muted italic text, collapsed by default), **tool call cards** (compact card showing tool icon + name + status, collapsible input/output — reuse ToolCallSection patterns from agent monitor), **code blocks** with syntax highlighting and copy button. Timestamps shown on hover. Group consecutive messages from same role.

- [ ] **PICO.8** — Wire chat panel to streaming API. Create `packages/frontend/src/hooks/use-pico-chat.ts`: manages chat state — current session, message history, streaming state. `sendMessage(content)`: POST to `/api/chat/sessions/:id/messages`, read SSE stream, incrementally update the assistant message as chunks arrive (text appends, thinking blocks build up, tool calls show as in-progress then complete). `createSession()`: POST to create new session. `loadHistory()`: GET messages for current session. Store current session ID in Zustand (persisted to localStorage). On app load: if a session exists, load its history. Handle errors: if streaming fails, show error message in chat with retry button.

- [ ] **PICO.9** — Add session management. In the chat panel header: dropdown showing recent sessions (last 10, sorted by most recent). Click to switch sessions and load that history. "New chat" button clears the panel and creates a fresh session. Session titles auto-generated from the first user message (truncated to 40 chars). "Clear all" option in the dropdown to delete all sessions. Show the current session title in the header (editable on click).

### Pico Personality & Polish

- [ ] **PICO.10** — Polish Pico's personality and onboarding. First-time experience: when the user opens the chat for the first time (no sessions exist), show a welcome message from Pico: "Woof! I'm Pico, your project assistant. I know everything about this project — the architecture, the workflow, all the agents. Ask me anything, or I can help you manage work items. What can I help with?" Add 3-4 suggested quick-action buttons below the welcome message: "What's the project status?", "Explain the workflow", "Show recent activity", "Help me create a work item". Clicking a suggestion sends it as a message. Pico's tone: enthusiastic but not annoying, technically accurate, occasionally uses dog puns ("let me dig into that", "I'll fetch that for you", "good boy status: all tests passing").

---

## Sprint 16: AI-Based E2E Testing

> AI-driven end-to-end testing via browser automation. Two phases:
> Phase 1: Generate test plan files — each is a self-contained prompt an AI agent can follow using browser DevTools (chrome-devtools MCP).
> Phase 2: Execute each test plan, interact with the real app in a browser, and report results.
> All test plans live in `tests/e2e/plans/`. Each plan is a markdown file with step-by-step instructions, expected outcomes, and pass/fail criteria.
> Test execution requires: backend running on :3001, frontend on :5173/:5174, API mode set to "api", chrome-devtools MCP connected.

> QF.1, AI.1–AI.9, AI.10–AI.11, AI.V1–AI.V2, AI.12–AI.17 complete and archived.

### Phase 1.5: Update Test Plans for Visual Inspection

> Update remaining test plans with visual inspection protocol (screenshot checkpoints, visual quality/failure criteria).

- [x] **AI.V3** — Update `work-items-list-view.md` and `work-items-create.md` with visual inspection steps. Add screenshot + examine after: list renders, expanding a parent, opening detail panel, creating a new item. Check: row alignment, badge sizing, indentation, panel transition.

- [review] **AI.V4** — Update `work-items-flow-view.md` with visual inspection steps. Add screenshot + examine after: flow view renders, clicking a state node. Check: node layout, arrow rendering, label readability, no clipping or overflow.

- [ ] **AI.V5** — Update `detail-panel-view.md` and `detail-panel-edit.md` with visual inspection steps. Add screenshot + examine after: panel opens, each section renders, each edit interaction (title edit, description edit, priority change, label add, state change). Check: panel sizing, input alignment, button placement, markdown preview rendering.

- [ ] **AI.V6** — Update `work-items-filtering.md` and `work-items-sorting.md` with visual inspection steps. Add screenshot + examine after: search input, each filter applied, filter cleared, sort changed, sort direction toggled. Check: filter bar layout, dropdown rendering, result list updates.

- [ ] **AI.V7** — Update `agent-monitor-layout.md` and `agent-monitor-history.md` with visual inspection steps. Add screenshot + examine after: page load, tab switch, selecting an agent, expanding a history row. Check: terminal rendering, sidebar layout, table alignment, control bar.

- [ ] **AI.V8** — Update `activity-feed.md` with visual inspection steps. Add screenshot + examine after: feed loads, filter applied, filter cleared. Check: event card layout, icon alignment, date grouping headers, spacing.

- [ ] **AI.V9** — Update `settings-projects.md`, `settings-workflow.md`, and `settings-appearance.md` with visual inspection steps. Add screenshot + examine after: settings page loads, each section renders, form interactions. Check: form alignment, toggle rendering, table layout, section spacing.

- [ ] **AI.V10** — Update `persona-manager.md` with visual inspection steps. Add screenshot + examine after: persona grid loads, opening editor, each field section. Check: card grid alignment, editor layout, field spacing.

- [ ] **AI.V11** — Update `navigation.md`, `dark-mode.md`, and `keyboard-shortcuts.md` with visual inspection steps. Add screenshot + examine after: each nav click, sidebar collapse/expand, theme toggle on each page, command palette open. Check: sidebar layout, active state highlighting, theme color transitions, palette rendering.

### Phase 2: Execute Test Plans

> One test plan per task. Agent reads the plan, launches the app in a browser via chrome-devtools MCP, follows every step, takes screenshots, records pass/fail.
> Prerequisites for every execution task: backend running on :3001, frontend on :5173 or :5174, API mode set to "api", seeded data, chrome-devtools MCP connected.
> Results go to `tests/e2e/results/{plan-name}.md` — same name as the plan file.

- [ ] **AI.18** — Execute `detail-panel-edit.md`. Read `tests/e2e/plans/detail-panel-edit.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/detail-panel-edit.md`.

- [ ] **AI.19** — Execute `work-items-filtering.md`. Read `tests/e2e/plans/work-items-filtering.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/work-items-filtering.md`.

- [ ] **AI.20** — Execute `work-items-sorting.md`. Read `tests/e2e/plans/work-items-sorting.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/work-items-sorting.md`.

- [ ] **AI.21** — Execute `agent-monitor-layout.md`. Read `tests/e2e/plans/agent-monitor-layout.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/agent-monitor-layout.md`.

- [ ] **AI.22** — Execute `agent-monitor-history.md`. Read `tests/e2e/plans/agent-monitor-history.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/agent-monitor-history.md`.

- [ ] **AI.23** — Execute `activity-feed.md`. Read `tests/e2e/plans/activity-feed.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/activity-feed.md`.

- [ ] **AI.24** — Execute `settings-projects.md`. Read `tests/e2e/plans/settings-projects.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/settings-projects.md`.

- [ ] **AI.25** — Execute `settings-workflow.md`. Read `tests/e2e/plans/settings-workflow.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/settings-workflow.md`.

- [ ] **AI.26** — Execute `settings-appearance.md`. Read `tests/e2e/plans/settings-appearance.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/settings-appearance.md`.

- [ ] **AI.27** — Execute `persona-manager.md`. Read `tests/e2e/plans/persona-manager.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/persona-manager.md`.

- [ ] **AI.28** — Execute `navigation.md`. Read `tests/e2e/plans/navigation.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/navigation.md`.

- [ ] **AI.29** — Execute `dark-mode.md`. Read `tests/e2e/plans/dark-mode.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/dark-mode.md`.

- [ ] **AI.30** — Execute `keyboard-shortcuts.md`. Read `tests/e2e/plans/keyboard-shortcuts.md`, follow all steps in browser, take screenshots, write results to `tests/e2e/results/keyboard-shortcuts.md`.

### Phase 3: Triage

- [ ] **AI.31** — Triage and file bugs from test results. Read all files in `tests/e2e/results/`. For each failure: assess severity (critical, major, minor), categorize (UI bug, data bug, integration bug, missing feature). Write a summary to `tests/e2e/results/SUMMARY.md` with a table of all failures sorted by severity. Add any critical/major bugs as new tasks to TASKS.md for the next sprint.
