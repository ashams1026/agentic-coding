# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-16 complete and archived. Sprint 17 partially archived (FX.SEC1, FX.MOCK1-4, FX.SET1-3, FX.RST1, FX.FLOW1, FX.NAV1, FX.PM1, FX.0, FX.P1-P4).

---

## Sprint 17: Agent Pipeline Fixes & Monitor UX

> Critical fixes from first real-world test run. Router loop, cost display, agent monitor readability, activity feed descriptions.
> Also includes persona audit, skills system, security, and UX improvements.

### Persona Audit & Prompt Overhaul (remaining)

- [x] **FX.P5** — Audit and overhaul Router persona. In seed.ts Router entry: (1) Verify `allowedTools` — Router uses MCP tools only, not SDK tools. Should be empty array `[]` for `allowedTools`. (2) Verify `mcpTools` — should be: `route_to_state`, `list_items`, `get_context`, `post_comment`. Router needs `post_comment` to explain its routing decision. (3) Overhaul `systemPrompt` — make routing rules explicit and unambiguous: after Planning → route to Decomposition (if item needs children) or Ready (if small enough), after Decomposition → route to Ready, after Ready → no action (dispatch handles In Progress), after In Progress → route to In Review, after In Review with approval → route to Done, after In Review with rejection → route to In Progress (include rejection context), if stuck or unclear → route to Blocked with reason. Add: NEVER route to the current state, NEVER route backwards more than one step, check execution outcome and summary before deciding, post a one-line comment explaining the routing decision. Include the valid transitions map from the workflow so the Router has it in context.

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

### Dev Server Deduplication

- [ ] **FX.DEV1** — Skip server start if already running. In the agent's build/verify workflow and any dev scripts: before starting the backend (`pnpm --filter backend dev`), check if port 3001 is already responding (`curl -s http://localhost:3001/api/health`). If it responds with `status: "ok"`, skip starting — the existing server has hot reload via `tsx watch` and will pick up code changes automatically. Same for the frontend: check if port 5173 or 5174 is already serving before running `pnpm --filter frontend dev` — Vite HMR handles file changes. Implement as a wrapper script `scripts/dev.sh` (or update existing `pnpm dev`): check ports first, only start what's not already running. This prevents agents from spawning duplicate servers across sessions.

### E2E Triage Bugs

- [ ] **FX.CMD1** — Fix command palette work item navigation route. In `packages/frontend/src/features/command-palette/` (or wherever the command palette component lives): clicking a work item navigates to `/work-items/:id` which is a 404. The route doesn't exist in the React Router config. Fix: change the navigation target to `/items` with the work item selected (e.g., via URL search param `?selected=:id` or by setting the selected item in the Zustand store before navigating to `/items`). Verify that clicking a work item in the palette opens the detail panel for that item.

- [ ] **FX.EDIT1** — Fix list row not updating when title edited in detail panel. In the Work Items list view: when a title is edited in the detail panel, the list row on the left still shows the old title. The panel heading updates but the list doesn't reactively sync. Fix: ensure the list query data is invalidated or updated when a work item mutation completes, so the list row reflects the new title immediately.

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

## Backlog: Agent Workflow Improvements

- [ ] **AW.1** — Add conditional visual UI check to agent WORK state. Update `AGENT_PROMPT.md`: add a `[VISUAL CHECK]` step between `[IMPLEMENT]` and `[VERIFY]` in the WORK state. The step is conditional: after implementing, run `git diff --name-only` and check if any files in `packages/frontend/` were modified. If NO frontend files changed → skip to [VERIFY]. If frontend files changed → ensure dev servers are running (check ports 3001 and 5173/5174, skip starting if already up), use chrome-devtools MCP to open the affected page(s) in a browser, take a screenshot, visually examine it for layout issues / broken styling / clipping / misalignment, fix any visual defects found, re-screenshot to confirm. Include a file path → page URL mapping in the prompt so the agent knows which pages to check: `features/work-items/` → `/items`, `features/dashboard/` or `pages/dashboard` → `/`, `features/agent-monitor/` → `/agents`, `features/activity-feed/` → `/activity`, `features/persona-manager/` → `/personas`, `features/settings/` → `/settings`, `components/sidebar.tsx` or `layouts/` → `/` (check any page). If multiple feature directories were touched, check each corresponding page. Add to the Worker Rules section: "If your task modifies frontend code, the visual check is mandatory — do not skip it."

- [ ] **AW.2** — Add visual check to REVIEW state. Update `AGENT_PROMPT.md`: in the REVIEW state's `[INSPECT WORK]` step, add: if the worker's WORKLOG entry lists frontend files, open the affected pages in a browser via chrome-devtools MCP and visually verify the UI looks correct. This gives the reviewer a second pair of eyes on visual quality. Add a review checklist item: "If UI was changed: does it look correct visually? No broken layout, clipping, or styling issues?"

