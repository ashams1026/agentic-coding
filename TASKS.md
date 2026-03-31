# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-16 complete and archived. Sprint 17 fully archived except blocked SDK tasks (FX.SDK1, FX.SDK3-6). Sprint 18 partially archived (PICO.1-4).

---

## Sprint 17: Agent Pipeline Fixes & Monitor UX (remaining)

> Critical fixes from first real-world test run. Router loop, cost display, agent monitor readability, activity feed descriptions.
> Also includes persona audit, skills system, security, UX improvements, and SDK-native tool/skill discovery.

### SDK-Native Skills & Tool Discovery

- [blocked: SDK discovery APIs (initializationResult, supportedAgents, reloadPlugins) are Query control methods requiring a live streaming session + API key — can't call standalone. Need persistent SDK session or standalone discovery API.] **FX.SDK1** — Create SDK discovery endpoint. Add `GET /api/sdk/capabilities` route in `packages/backend/src/routes/sdk.ts`. On startup (or first call, cached), spin up a minimal `query()` instance and call `initializationResult()` to get: available built-in tools (with names/descriptions), available skills/commands (with names/descriptions/argument hints), available subagents (with names/descriptions). Return the combined result as JSON. Cache for the lifetime of the server process. Also expose `POST /api/sdk/reload` that calls `reloadPlugins()` and refreshes the cache.


- [blocked: depends on FX.SDK1 — GET /api/sdk/capabilities endpoint not yet available] **FX.SDK3** — Replace hardcoded tool list with SDK discovery in persona editor. In the persona editor UI (`packages/frontend/src/features/persona-manager/`): replace any freeform text input or hardcoded tool checkboxes for `allowedTools` with a multi-select populated from `GET /api/sdk/capabilities`. Show each tool with its name and description. Group by category: File tools, Search tools, Execution, Web, Agent, Other. Same for `mcpTools` — show available MCP tools from the discovery response. Validate on save: warn if a selected tool isn't in the available set.

- [blocked: depends on FX.SDK1 — GET /api/sdk/capabilities endpoint not yet available] **FX.SDK4** — Replace file browser skill picker with SDK skill picker. Rewrite `packages/frontend/src/features/persona-manager/skill-browser.tsx`: instead of browsing the filesystem for `.md` files, fetch available skills from `GET /api/sdk/capabilities`. Render as a searchable list with skill name, description, and argument hint. Each skill has an "Add" button. Preview panel shows the skill's description (no file content preview needed). Keep the manual path input as a fallback for custom skills not yet discovered. Update the persona detail panel to show skill names with descriptions instead of raw file paths.

- [blocked: depends on FX.SDK1 — SDK capabilities cache not yet available] **FX.SDK5** — Add startup tool validation. In `packages/backend/src/agent/execution-manager.ts`: on first dispatch (or server start), fetch the SDK capabilities and validate all persona `allowedTools` and `skills` against the actual available set. Log warnings for any mismatches: "Persona 'Engineer' references unknown tool 'FooBar' — will be ignored by SDK." This catches stale tool names early (like the `transition_state` vs `route_to_state` incident).

- [blocked: depends on FX.SDK1 — SDK discovery (supportedAgents) not yet available] **FX.SDK6** — Expose available subagents in persona config. The SDK provides `supportedAgents()` returning agent name, description, and model. In the persona editor: add a "Subagents" section showing available agents from the SDK discovery. Allow personas to reference specific subagents (e.g., the Engineer persona might use the `code-reviewer` subagent). Store as `subagents: string[]` on the Persona entity. Pass via query options if the SDK supports it, otherwise inject as guidance in the system prompt.

---

## Sprint 18: Pico — Project Assistant

> Pico is a friendly dog-persona AI assistant built into AgentOps. Named after the creator's dog.
> Pico is always available via a floating chat bubble, can answer questions about the project, help manage work items, and search documentation.
> Pico is a special built-in persona: not editable, not triggered by workflow state changes, only invoked by user chat.
> Pico's chat supports rich rendering: markdown, collapsible thinking, tool call cards, and a warm conversational tone.

### Frontend: Chat Interface

- [x] **PICO.5** — Build floating chat bubble. Create `packages/frontend/src/features/pico/chat-bubble.tsx`: a circular button (56px) fixed to the bottom-right corner of the viewport (`bottom-6 right-6`), showing a dog icon (or paw print) with Pico's amber color. Subtle bounce animation on first load. Unread message indicator (small dot) when Pico has responded and chat is closed. Click toggles the chat panel open/closed. Render in `root-layout.tsx` so it's available on every page.

- [x] **PICO.6** — Build chat panel. Create `packages/frontend/src/features/pico/chat-panel.tsx`: a panel that appears above the chat bubble (400px wide, 500px tall, rounded corners, shadow-lg). Header: "Pico" with dog icon, session title, minimize button, new session button. Message area: scrollable, auto-scroll to bottom on new messages. Input area: textarea with send button, Cmd+Enter to send, disabled while Pico is responding. Show a typing indicator (three bouncing dots) while streaming. Panel is dismissible by clicking outside or the minimize button. Animate open/close with scale + opacity transition.

- [ ] **PICO.7** — Build chat message components. Create `packages/frontend/src/features/pico/chat-message.tsx`: user messages render as right-aligned bubbles (primary color background, white text). Pico messages render as left-aligned bubbles (muted background) with Pico's avatar. Pico message content supports: **markdown rendering** (paragraphs, bold, code, lists, links — reuse or extend the existing MarkdownPreview component), **thinking blocks** (collapsible accordion, "Pico is thinking..." label, muted italic text, collapsed by default), **tool call cards** (compact card showing tool icon + name + status, collapsible input/output — reuse ToolCallSection patterns from agent monitor), **code blocks** with syntax highlighting and copy button. Timestamps shown on hover. Group consecutive messages from same role.

- [ ] **PICO.8** — Wire chat panel to streaming API. Create `packages/frontend/src/hooks/use-pico-chat.ts`: manages chat state — current session, message history, streaming state. `sendMessage(content)`: POST to `/api/chat/sessions/:id/messages`, read SSE stream, incrementally update the assistant message as chunks arrive (text appends, thinking blocks build up, tool calls show as in-progress then complete). `createSession()`: POST to create new session. `loadHistory()`: GET messages for current session. Store current session ID in Zustand (persisted to localStorage). On app load: if a session exists, load its history. Handle errors: if streaming fails, show error message in chat with retry button.

- [ ] **PICO.9** — Add session management. In the chat panel header: dropdown showing recent sessions (last 10, sorted by most recent). Click to switch sessions and load that history. "New chat" button clears the panel and creates a fresh session. Session titles auto-generated from the first user message (truncated to 40 chars). "Clear all" option in the dropdown to delete all sessions. Show the current session title in the header (editable on click).

### Pico Personality & Polish

- [ ] **PICO.10** — Polish Pico's personality and onboarding. First-time experience: when the user opens the chat for the first time (no sessions exist), show a welcome message from Pico: "Woof! I'm Pico, your project assistant. I know everything about this project — the architecture, the workflow, all the agents. Ask me anything, or I can help you manage work items. What can I help with?" Add 3-4 suggested quick-action buttons below the welcome message: "What's the project status?", "Explain the workflow", "Show recent activity", "Help me create a work item". Clicking a suggestion sends it as a message. Pico's tone: enthusiastic but not annoying, technically accurate, occasionally uses dog puns ("let me dig into that", "I'll fetch that for you", "good boy status: all tests passing").

---

## Sprint 19: SDK Deep Integration — Core

> Leverage the full Claude Agent SDK surface. Priority-ordered: infrastructure first (unblocks everything), then agent quality, then safety.
> V2 Sessions unblock SDK discovery (FX.SDK1) and simplify Pico (Sprint 18).
> Each feature with UI changes includes a test plan update + visual verification task.

### Part 1: Infrastructure — V2 Persistent Sessions

- [ ] **SDK.V2.1** — Create persistent SDK session manager. Create `packages/backend/src/agent/sdk-session.ts`: on server startup, call `unstable_v2_createSession()` with a lightweight config (sonnet model, minimal tools). Keep the session alive for the server's lifetime. Expose `getSdkSession()` singleton. This session serves two purposes: (a) SDK discovery — call `initializationResult()`, `supportedCommands()`, `supportedAgents()`, `supportedModels()` to populate the capabilities cache, unblocking FX.SDK1. (b) Pico backbone — Pico chat can use `unstable_v2_prompt()` or `session.send()` instead of spinning up a new `query()` per message. Handle session cleanup on server shutdown via `session.close()`. Handle reconnection if the session dies (exponential backoff, max 3 retries). Log session ID and status on startup.

- [ ] **SDK.V2.2** — Unblock FX.SDK1 with V2 session. Refactor `GET /api/sdk/capabilities` (from FX.SDK1, currently blocked): instead of trying to spin up a standalone `query()`, use the persistent session from SDK.V2.1. Call `initializationResult()` on the existing session to get tools, skills, agents, models. Cache the result. `POST /api/sdk/reload` calls `reloadPlugins()` on the session and refreshes the cache. Remove the `[blocked]` tag from FX.SDK1 and mark it as superseded by this task.

- [ ] **SDK.V2.3** — Refactor Pico to use V2 sessions. Update PICO.2 and PICO.3 design: instead of a custom `chat_sessions`/`chat_messages` DB table + manual conversation history assembly, use the SDK's native session management. `POST /api/chat/sessions` → calls `unstable_v2_createSession()` and stores the SDK session ID. `POST /api/chat/sessions/:id/messages` → calls `session.send(message)` and streams from `session.stream()`. `GET /api/chat/sessions` → calls `listSessions()` from the SDK. `GET /api/chat/sessions/:id/messages` → calls `getSessionMessages(sessionId)`. This eliminates our custom chat persistence layer entirely — the SDK handles conversation history, context compaction, and session storage. Keep the `chat_sessions` table only as a lightweight index (sessionId, projectId, title, createdAt) for the UI list. Remove `chat_messages` table from the schema design.

- [ ] **SDK.V2.4** — Update `docs/architecture.md` with V2 session architecture. Document: the persistent SDK session singleton, its role in discovery and Pico, session lifecycle (startup → ready → reconnect → shutdown), how it relates to per-execution `query()` calls for workflow agents.

### Part 2: Infrastructure — File Checkpointing

- [ ] **SDK.FC.1** — Enable file checkpointing in executor. In `packages/backend/src/agent/claude-executor.ts`: add `enableFileCheckpointing: true` to the `query()` options. This makes `rewindFiles(messageId)` available on every agent execution. Store the initial message ID (first assistant message) in the execution record so we can rewind to pre-execution state. Add a `checkpointMessageId` column to the executions table (nullable string). Populate it from the first `SDKAssistantMessage` received during streaming.

- [ ] **SDK.FC.2** — Add rewind API endpoint. Add `POST /api/executions/:id/rewind` route in `packages/backend/src/routes/executions.ts`. Accepts `{ dryRun?: boolean }`. Looks up the execution's `checkpointMessageId`, creates a temporary `query()` session pointed at the same project directory, calls `rewindFiles(checkpointMessageId, { dryRun })`. Returns `{ files: RewindFilesResult[] }` — list of files that were/would be restored. If not a dry run, post a system comment on the work item: "Files reverted to pre-execution state by [user]." Log the rewind in the audit trail.

- [ ] **SDK.FC.3** — Add rewind button to agent monitor UI. In `packages/frontend/src/features/agent-monitor/`: add a "Rewind" button (undo icon) to the execution header bar, next to the existing controls. Only visible on completed executions (not running ones). Click flow: (1) call rewind with `dryRun: true`, (2) show a confirmation modal listing files that will be reverted, (3) on confirm, call rewind without dryRun, (4) show success toast. Disable the button if `checkpointMessageId` is null (legacy executions without checkpointing). Add tooltip: "Revert all file changes made by this agent run."

- [ ] **SDK.FC.4** — Add rewind to REVIEW state workflow. Update the Code Reviewer persona's system prompt: after reviewing an agent's work, if the review outcome is REJECT, the reviewer can call the rewind API to automatically restore files before re-routing to a previous state. Add `rewind_execution` as a new MCP tool in the agentops MCP server: takes `executionId`, calls the rewind endpoint internally. Add to the reviewer's `mcpTools` allowlist.

- [ ] **SDK.FC.5** — E2E test plan: file checkpointing. Create `tests/e2e/plans/file-checkpointing.md`: test the rewind button in agent monitor — verify dry run shows file list, confirm rewind restores files, verify button state (disabled for legacy executions, hidden for running ones). Include visual verification of the confirmation modal and success state.

- [ ] **SDK.FC.6** — Run file checkpointing e2e test. Execute the test plan from SDK.FC.5 using chrome-devtools MCP. Record results to `tests/e2e/results/file-checkpointing.md`. Take screenshots at: rewind button visible, dry run modal, post-rewind success state.

- [ ] **SDK.FC.7** — Update `docs/architecture.md` and `docs/api.md` with file checkpointing. Document: the rewind API endpoint (request/response), how checkpointing works (message IDs, file restoration), the rewind MCP tool for the reviewer persona, limitations (only works for executions with checkpointing enabled).

### Part 3: Infrastructure — Hooks System

- [ ] **SDK.HK.1** — Replace custom sandbox with PreToolUse hook. In `packages/backend/src/agent/claude-executor.ts`: remove the manual `validateCommand()` check from the streaming loop (lines 273-286). Instead, pass a `hooks` option to `query()` with a `PreToolUse` handler that runs for `Bash` tool calls. The hook calls `validateCommand(input.command, projectPath)` and returns `{ continue: false, stopReason: "[SANDBOX] Blocked: ..." }` if the command is disallowed. This is cleaner — the SDK handles the interruption natively instead of us aborting the controller. Keep the `sandbox.ts` module for the validation logic itself.

- [ ] **SDK.HK.2** — Add PostToolUse audit logging hook. Add a `PostToolUse` hook to the `query()` options: after every tool execution, log `{ executionId, toolName, durationMs, success }` to the audit trail (`packages/backend/src/audit.ts`). For Bash tools, also log the command string (sanitized — redact anything after `ANTHROPIC_API_KEY=` or similar patterns). This gives us a complete tool-by-tool audit trail for every agent execution without polluting the main execution logs.

- [ ] **SDK.HK.3** — Add SessionStart/SessionEnd hooks for execution lifecycle. Add hooks: `SessionStart` → log execution start with persona, model, work item ID to audit trail + emit a WebSocket event so the frontend agent monitor updates immediately. `SessionEnd` → log completion reason, final cost, duration. This replaces our manual "execution started/completed" event emission — the SDK tells us exactly when sessions begin and end.

- [ ] **SDK.HK.4** — Add FileChanged hook for live file tracking. Add a `FileChanged` hook: when an agent modifies a file, emit a WebSocket event `{ type: "file_changed", executionId, filePath, changeType }`. In the agent monitor UI: show a real-time "Files modified" badge/counter on the execution card. Click to expand and see the list of changed files. This gives users live visibility into what an agent is doing to their codebase.

- [ ] **SDK.HK.5** — Agent monitor: file changes panel UI. In `packages/frontend/src/features/agent-monitor/`: add a "Files" tab or collapsible section showing files modified by the current execution. Each entry shows: file path (relative to project), change type (created/modified/deleted), timestamp. Badge on the tab shows count. For completed executions, show the final file list. For running executions, update in real-time via WebSocket events from SDK.HK.4.

- [ ] **SDK.HK.6** — E2E test plan: agent monitor file tracking. Create `tests/e2e/plans/agent-monitor-files.md`: test the files panel — verify it shows modified files during/after execution, badge count updates, file paths are correct. Visual verification of the panel layout.

- [ ] **SDK.HK.7** — Run agent monitor file tracking e2e test. Execute SDK.HK.6 test plan. Record results. Screenshots of files panel in both running and completed states.

- [ ] **SDK.HK.8** — Update `docs/architecture.md` with hooks architecture. Document: which hooks are registered (PreToolUse, PostToolUse, SessionStart, SessionEnd, FileChanged), what each does, how they replace the previous custom implementations, audit trail integration.

### Part 4: Agent Quality — Structured Output

- [ ] **SDK.SO.1** — Add structured output for Router persona. In `packages/backend/src/agent/claude-executor.ts`: when the persona is the Router (check `persona.name === "Router"` or a `persona.settings.isRouter` flag), pass `outputFormat` to `query()` with a JSON schema: `{ nextState: string, reasoning: string, confidence: "high" | "medium" | "low" }`. Parse the structured response in `execution-manager.ts` instead of extracting state from free-text tool calls. This eliminates parsing failures and makes Router decisions machine-readable. Add `isRouter?: boolean` to Persona settings type.

- [ ] **SDK.SO.2** — Display structured Router decisions in UI. In the agent monitor and activity feed: when showing a Router execution result, render the structured JSON as a formatted card: state badge (color-coded), reasoning text, confidence indicator (green/yellow/red dot). This replaces the current raw text display of Router output.

- [ ] **SDK.SO.3** — E2E test plan: Router structured output. Create `tests/e2e/plans/router-structured-output.md`: verify Router decision cards display correctly in agent monitor and activity feed. Visual check of the state badge, reasoning, and confidence indicator.

- [ ] **SDK.SO.4** — Run Router structured output e2e test. Execute SDK.SO.3. Record results with screenshots of Router decision cards.

- [ ] **SDK.SO.5** — Update `docs/workflow.md` and `docs/personas.md` with structured Router output. Document: the JSON schema, how Router decisions are parsed, the confidence field and its meaning.

### Part 5: Agent Quality — Custom Subagent Definitions

- [ ] **SDK.SA.1** — Define personas as SDK subagents. In `packages/backend/src/agent/claude-executor.ts`: when spawning an execution, pass all project personas as `agents` in the `query()` options. Map each Persona to an `AgentDefinition`: `{ description: persona.description, prompt: persona.systemPrompt, model: resolveModel(persona.model), tools: persona.allowedTools, skills: persona.skills, mcpServers: [...], maxTurns: 30 }`. This means any agent can invoke another persona as a subagent via the `Agent` tool — e.g., the Engineer can spawn the Code Reviewer for a quick review before committing. The Router no longer needs custom dispatch logic — it can directly invoke the next persona as a subagent.

- [ ] **SDK.SA.2** — Add subagent invocation tracking. When an agent spawns a subagent (detected via `SubagentStart`/`SubagentStop` hooks), create a child execution record linked to the parent. In the agent monitor: show subagent executions as nested cards under the parent. Activity feed: "Engineer spawned Code Reviewer as subagent for [Work Item]". Track subagent costs as part of the parent execution's total.

- [ ] **SDK.SA.3** — Agent monitor: nested subagent view UI. In `packages/frontend/src/features/agent-monitor/`: when an execution has child subagent executions, render them as indented/nested cards with a tree connector line. Each subagent card shows: persona avatar, model, status, cost. Expandable to see the subagent's full output. Collapse by default to keep the view clean.

- [ ] **SDK.SA.4** — E2E test plan: subagent nesting. Create `tests/e2e/plans/subagent-nesting.md`: verify nested subagent cards in agent monitor, tree connector rendering, expand/collapse, cost rollup.

- [ ] **SDK.SA.5** — Run subagent nesting e2e test. Execute SDK.SA.4. Record results with screenshots of nested view.

- [ ] **SDK.SA.6** — Update `docs/personas.md` and `docs/architecture.md` with subagent system. Document: how personas map to AgentDefinitions, subagent invocation flow, cost tracking, when to use subagents vs. state transitions.

### Part 6: Agent Quality — Effort & Thinking

- [ ] **SDK.ET.1** — Add effort level to Persona entity. In `packages/shared/src/entities.ts`: add `effort?: 'low' | 'medium' | 'high' | 'max'` and `thinking?: 'adaptive' | 'enabled' | 'disabled'` to Persona settings. In `packages/backend/src/agent/claude-executor.ts`: pass `effort: persona.settings.effort ?? 'high'` and `thinking: { type: persona.settings.thinking ?? 'adaptive' }` to `query()` options. Defaults: Router = `low` effort + `disabled` thinking, PM = `medium` + `adaptive`, Tech Lead = `high` + `adaptive`, Engineer = `max` + `enabled` (with budget), Code Reviewer = `high` + `adaptive`. Update seed data with these defaults.

- [ ] **SDK.ET.2** — Add effort & thinking controls to persona editor UI. In the persona editor form: add an "Effort Level" dropdown (low/medium/high/max) with descriptions — low: "Fast, minimal reasoning", medium: "Balanced", high: "Thorough", max: "Maximum depth, highest cost". Add a "Thinking Mode" dropdown (adaptive/enabled/disabled) — adaptive: "Claude decides when to think deeply", enabled: "Always show reasoning chain", disabled: "No extended thinking". Show estimated relative cost indicator next to effort selection.

- [ ] **SDK.ET.3** — E2E test plan: persona effort & thinking settings. Create `tests/e2e/plans/persona-effort-thinking.md`: verify dropdowns render correctly in persona editor, values save and persist, descriptions display. Visual check of the effort/thinking controls.

- [ ] **SDK.ET.4** — Run persona effort & thinking e2e test. Execute SDK.ET.3. Record results with screenshots.

- [ ] **SDK.ET.5** — Update `docs/personas.md` with effort and thinking configuration. Document: effort levels and their effect on cost/quality, thinking modes, recommended defaults per persona type.

---

## Sprint 20: SDK Deep Integration — Observability & Polish

> Real-time streaming, progress tracking, rate limit handling, context usage monitoring.
> Safety improvements: SDK-native sandbox, permission callbacks, dynamic MCP management.
> UX enhancements: prompt suggestions, model switching.

### Part 1: Real-Time Streaming

- [ ] **SDK.ST.1** — Enable partial message streaming. In `packages/backend/src/agent/claude-executor.ts`: add `includePartialMessages: true` to `query()` options. Handle `SDKPartialAssistantMessage` in the `mapMessage()` function: emit partial events as `{ type: "partial", content: string, index: number }`. Stream these over WebSocket to the frontend. This replaces our current chunk-by-chunk display with true token-by-token streaming.

- [ ] **SDK.ST.2** — Agent monitor: live token streaming UI. In `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`: handle partial message events. Instead of waiting for complete text chunks, append tokens to the current message bubble in real-time (like a typing animation). Use `requestAnimationFrame` batching to avoid excessive re-renders. Show a blinking cursor at the end of the current streaming message. This makes the agent monitor feel alive — users see text appear character by character.

- [ ] **SDK.ST.3** — Enable agent progress summaries. Add `agentProgressSummaries: true` to `query()` options. Handle `SDKTaskProgressMessage` events: extract the AI-generated summary (generated ~every 30s for long-running agents). Emit as a WebSocket event. In the agent monitor: show a progress summary bar below the execution header — "Currently: analyzing test coverage for payment module..." Updates every 30s. In the activity feed: show progress updates for long-running executions.

- [ ] **SDK.ST.4** — Handle rate limit events in agent monitor. Handle `SDKRateLimitEvent` in `mapMessage()`: emit as `{ type: "rate_limit", retryAfterMs: number, attempt: number }`. In the agent monitor: show an inline banner "Rate limited — retrying in Xs..." with a countdown timer. In the execution card header: show a small yellow warning icon while rate-limited. This replaces mysterious pauses with clear feedback.

- [ ] **SDK.ST.5** — Add context usage display to agent monitor. Call `getContextUsage()` periodically (every 60s) during active executions via the query object. Emit as WebSocket event. In the agent monitor: show a context usage bar in the execution header — e.g., "Context: 45% used" with a fill bar. Color: green (<60%), yellow (60-80%), red (>80%). Tooltip shows breakdown: system prompt, tools, messages, MCP tools, memory. This warns users when an agent is approaching context limits.

- [ ] **SDK.ST.6** — E2E test plan: agent monitor streaming & observability. Create `tests/e2e/plans/agent-monitor-streaming.md`: test live streaming appearance, progress summary bar, rate limit banner (mock a rate limit scenario), context usage bar. Visual verification of all new UI elements.

- [ ] **SDK.ST.7** — Run agent monitor streaming e2e test. Execute SDK.ST.6. Record results with screenshots of streaming, progress summary, context bar.

- [ ] **SDK.ST.8** — Update `docs/frontend.md` with streaming and observability features. Document: partial message handling, progress summaries, rate limit display, context usage monitoring, WebSocket event types.

### Part 2: Safety — SDK Native Sandbox

- [ ] **SDK.SB.1** — Migrate to SDK native sandbox. In `packages/backend/src/agent/claude-executor.ts`: replace our custom `validateCommand()` + `PreToolUse` hook approach with the SDK's native `sandbox` option. Configure: `sandbox: { enabled: true, filesystem: { allowWrite: [projectPath], denyWrite: ['/', '/etc', '/usr', '~/.ssh', '~/.aws'] }, network: { allowedDomains: ['api.anthropic.com', 'registry.npmjs.org', 'github.com'] } }`. Build the sandbox config from project settings. Remove `packages/backend/src/agent/sandbox.ts` custom validation (keep as fallback for non-sandboxed environments). The SDK sandbox is more comprehensive — it handles filesystem isolation, network restrictions, and process sandboxing at the OS level.

- [ ] **SDK.SB.2** — Add sandbox configuration to project settings. In `packages/shared/src/entities.ts`: add `sandbox?: { allowedDomains?: string[], allowedWritePaths?: string[], denyWritePaths?: string[] }` to Project settings. In the Settings → Security page: add a "Sandbox" section with editable lists for allowed domains, allowed write paths, and denied write paths. Defaults pre-populated from SDK.SB.1. Toggle for "Enable OS-level sandboxing" (with note: requires macOS sandbox or Linux namespaces).

- [ ] **SDK.SB.3** — Add permission callback for sensitive operations. In `packages/backend/src/agent/claude-executor.ts`: pass a `canUseTool` callback to `query()` options. The callback checks: if the tool is `Bash` and the command contains `rm -rf`, `git push --force`, `DROP TABLE`, or other destructive patterns → return `{ behavior: 'deny', message: 'Destructive command blocked by policy' }`. If the tool is `WebFetch` and the URL is not in the allowed domains → deny. For all other tools → allow. This is a defense-in-depth layer on top of the sandbox. Log all deny decisions to the audit trail.

- [ ] **SDK.SB.4** — E2E test plan: sandbox settings UI. Create `tests/e2e/plans/sandbox-settings.md`: verify sandbox configuration renders in Settings → Security, allowed domains list is editable, toggle works. Visual check of the sandbox settings section.

- [ ] **SDK.SB.5** — Run sandbox settings e2e test. Execute SDK.SB.4. Record results with screenshots.

- [ ] **SDK.SB.6** — Update `docs/deployment.md` and `docs/architecture.md` with sandbox documentation. Document: SDK sandbox configuration, filesystem/network rules, canUseTool callback, how to customize per-project, OS-level sandbox requirements.

### Part 3: Safety — Dynamic MCP Management

- [ ] **SDK.MCP.1** — Add runtime MCP server management. In `packages/backend/src/agent/claude-executor.ts`: store the `query` object reference during execution. Expose `POST /api/executions/:id/mcp/toggle` route: calls `toggleMcpServer(serverName, enabled)` on the running query to enable/disable an MCP server mid-execution. Expose `POST /api/executions/:id/mcp/reconnect` route: calls `reconnectMcpServer(serverName)` to recover a failed connection. These are useful when an MCP server crashes during a long agent run — the user can reconnect without restarting the entire execution.

- [ ] **SDK.MCP.2** — Show MCP server status in agent monitor. During execution, call `mcpServerStatus()` periodically (every 30s). In the agent monitor: show a small "MCP" status section in the execution header. Each configured server shows as a colored dot: green (connected), red (failed), yellow (pending), gray (disabled). Click a failed server to trigger reconnection. Click a connected server to see its available tools. This gives users visibility into MCP health.

- [ ] **SDK.MCP.3** — E2E test plan: MCP status display. Create `tests/e2e/plans/mcp-status.md`: verify MCP server dots render in agent monitor, colors are correct, click interactions work. Visual verification.

- [ ] **SDK.MCP.4** — Run MCP status e2e test. Execute SDK.MCP.3. Record results with screenshots.

- [ ] **SDK.MCP.5** — Update `docs/mcp-tools.md` with dynamic MCP management. Document: runtime toggle/reconnect APIs, status monitoring, how to recover from MCP failures.

### Part 4: UX — Prompt Suggestions & Model Switching

- [ ] **SDK.UX.1** — Enable prompt suggestions for Pico. In the Pico executor config: add `promptSuggestions: true` to `query()` options. Handle `SDKPromptSuggestionMessage` in the streaming response: extract the predicted next prompts. In the Pico chat panel: after each Pico response, show 2-3 suggested follow-up buttons below the message (similar to the welcome message quick actions from PICO.10). Clicking a suggestion sends it as the next message. Suggestions fade out once the user starts typing.

- [ ] **SDK.UX.2** — Add model switching for long-running agents. In the agent monitor: add a "Model" dropdown in the execution header (only visible for running executions). Shows available models from `supportedModels()`. Selecting a different model calls `setModel(newModel)` on the running query. Use case: an agent started on Haiku but the task is complex — user can upgrade to Sonnet mid-run without restarting. Show the current model as a badge that updates when switched. Confirm before switching: "Switch from Haiku to Sonnet? This may increase costs."

- [ ] **SDK.UX.3** — In-process MCP server. In `packages/backend/src/agent/mcp-server.ts`: instead of spawning the agentops MCP server as a child process (stdio), use `createSdkMcpServer({ type: 'sdk' })` to run it in-process. Register all MCP tools via `server.tool(name, description, schema, handler)`. This eliminates the child process overhead, reduces latency on MCP tool calls, and simplifies debugging (all in one process, shared memory). Update the `mcpServers` config in `claude-executor.ts` to use `{ type: 'sdk', name: 'agentops', instance: server }`.

- [ ] **SDK.UX.4** — E2E test plan: Pico prompt suggestions. Create `tests/e2e/plans/pico-suggestions.md`: verify suggestion buttons appear after Pico responses, clicking sends the suggestion, buttons fade on typing. Visual check.

- [ ] **SDK.UX.5** — Run Pico prompt suggestions e2e test. Execute SDK.UX.4. Record results with screenshots.

- [ ] **SDK.UX.6** — E2E test plan: model switching. Create `tests/e2e/plans/model-switching.md`: verify model dropdown appears on running executions, model badge updates, confirmation dialog. Visual check.

- [ ] **SDK.UX.7** — Run model switching e2e test. Execute SDK.UX.6. Record results with screenshots.

- [ ] **SDK.UX.8** — Update `docs/frontend.md` with prompt suggestions and model switching. Document: how prompt suggestions work in Pico, model switching in agent monitor, in-process MCP server architecture change.

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

## Backlog: Agent Workflow Improvements

- [ ] **AW.1** — Add conditional visual UI check to agent WORK state. Update `AGENT_PROMPT.md`: add a `[VISUAL CHECK]` step between `[IMPLEMENT]` and `[VERIFY]` in the WORK state. The step is conditional: after implementing, run `git diff --name-only` and check if any files in `packages/frontend/` were modified. If NO frontend files changed → skip to [VERIFY]. If frontend files changed → ensure dev servers are running (check ports 3001 and 5173/5174, skip starting if already up), use chrome-devtools MCP to open the affected page(s) in a browser, take a screenshot, visually examine it for layout issues / broken styling / clipping / misalignment, fix any visual defects found, re-screenshot to confirm. Include a file path → page URL mapping in the prompt so the agent knows which pages to check: `features/work-items/` → `/items`, `features/dashboard/` or `pages/dashboard` → `/`, `features/agent-monitor/` → `/agents`, `features/activity-feed/` → `/activity`, `features/persona-manager/` → `/personas`, `features/settings/` → `/settings`, `components/sidebar.tsx` or `layouts/` → `/` (check any page). If multiple feature directories were touched, check each corresponding page. Add to the Worker Rules section: "If your task modifies frontend code, the visual check is mandatory — do not skip it."

- [ ] **AW.2** — Add visual check to REVIEW state. Update `AGENT_PROMPT.md`: in the REVIEW state's `[INSPECT WORK]` step, add: if the worker's WORKLOG entry lists frontend files, open the affected pages in a browser via chrome-devtools MCP and visually verify the UI looks correct. This gives the reviewer a second pair of eyes on visual quality. Add a review checklist item: "If UI was changed: does it look correct visually? No broken layout, clipping, or styling issues?"

---

## Backlog: Documentation Refresh

> All docs were written on 2026-03-30 and haven't been updated since. 153+ commits have landed since then.
> Each task: run `git log --oneline --since="<last_edit_date>" -- <relevant_source_paths>` to find what changed, read the current doc, update it to reflect the new state of the code. Don't rewrite from scratch — update what's stale, add what's missing, remove what's been deleted.

- [ ] **DOC.1** — Update `docs/getting-started.md`. Check commits touching `packages/backend/src/index.ts`, `packages/backend/src/cli.ts`, `packages/backend/src/db/seed.ts`, `package.json`, `scripts/`. Update: install steps, first-run commands, any new CLI commands, seed script changes, new prerequisites. The mock mode instructions should be removed (mock layer was deleted). Add the `pnpm db:seed:demo` command if it exists.

- [ ] **DOC.2** — Update `docs/architecture.md`. Check commits touching `packages/backend/src/agent/`, `packages/backend/src/routes/`, `packages/frontend/src/api/`, `packages/frontend/src/features/`. Update: system diagram if new components were added (Pico chat, sandbox, audit trail), data flow if the execution chain changed (router loop fixes, rate limiter logging), any new backend services or routes.

- [ ] **DOC.3** — Update `docs/data-model.md`. Check commits touching `packages/shared/src/entities.ts`, `packages/backend/src/db/schema.ts`. Update: any new fields added to entities (skills on Persona, isAssistant flag, chat_sessions/chat_messages tables), any changed field names or types, update the ER diagram if relationships changed.

- [ ] **DOC.4** — Update `docs/workflow.md`. Check commits touching `packages/shared/src/workflow.ts`, `packages/backend/src/agent/router.ts`, `packages/backend/src/agent/dispatch.ts`, `packages/backend/src/agent/coordination.ts`, `packages/backend/src/agent/execution-manager.ts`. Update: router behavior changes (same-state blocking, loop detection, transition history), rate limiter logging, any new states or transition rules, play/pause auto-routing UX.

- [ ] **DOC.5** — Update `docs/personas.md`. Check commits touching `packages/backend/src/db/seed.ts` persona entries, `packages/backend/src/agent/claude-executor.ts`. Update: any persona prompt changes from the FX.P1-P5 overhaul, corrected tool names, new skills system, SDK tool name verification results, Pico as a new built-in persona (if implemented). Document the full list of correct MCP and SDK tool names per persona.

- [ ] **DOC.6** — Update `docs/api.md`. Check commits touching `packages/backend/src/routes/`, `packages/backend/src/server.ts`. Update: any new routes (chat sessions, service status, browse-directory, audit), any changed request/response shapes, any removed routes. Add curl examples for new endpoints.

- [ ] **DOC.7** — Update `docs/mcp-tools.md`. Check commits touching `packages/backend/src/agent/mcp-server.ts`. Update: any tool schema changes, new tools added, tool name corrections, per-persona allowlist changes from the audit.

- [ ] **DOC.8** — Update `docs/deployment.md`. Check commits touching `packages/backend/src/cli.ts`, `ecosystem.config.cjs`, `packages/backend/src/config.ts`, `packages/backend/src/logger.ts`, `packages/backend/src/audit.ts`, `scripts/`. Update: any new CLI commands, config file changes, log file paths, pm2 config changes, new scripts (test-e2e, dev wrapper).

- [ ] **DOC.9** — Update `docs/frontend.md`. Check commits touching `packages/frontend/src/`. Update: mock layer removal, new features (Pico chat, resizable panels, flow view redesign, play/pause control), deleted directories (mocks/), new stores or hooks, design system changes from the polish sprint.

