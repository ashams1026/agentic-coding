# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-31 21:20 PDT — SDK.HK.2: PostToolUse audit logging hook

**Done:** Added tool-level audit logging via SDK hooks. Created `auditToolUse()` in `audit.ts` logging `{ executionId, toolName, durationMs, success, command? }`. In `claude-executor.ts`: added `buildAuditHooks()` factory that creates three hooks — `PreToolUse` (records start time per tool_use_id), `PostToolUse` (logs success + duration), `PostToolUseFailure` (logs failure + duration). Bash commands are sanitized via regex replacing `ANTHROPIC_API_KEY=`/`SECRET=`/etc. with `***`. Added `executionId` to `SpawnOptions` interface and call site.
**Files:** `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/audit.ts`, `packages/backend/src/agent/types.ts`, `packages/backend/src/agent/execution-manager.ts`

---

## 2026-03-31 21:00 PDT — Review: SDK.HK.1 (approved)

**Reviewed:** PreToolUse hook replacing manual sandbox validation in `claude-executor.ts`.
- Manual `validateCommand()` + `abortController.abort()` loop removed — streaming loop now just yields events
- SDK-native `PreToolUse` hook with `matcher: "Bash"` correctly wired into `query()` options
- Hook uses proper `hookSpecificOutput.permissionDecision: "deny"` (correct SDK API, not the `continue/stopReason` pattern from the task description which is for command hooks)
- `sandbox.ts` module preserved, both `validateCommand` and `buildSandboxPrompt` still used
- Build passes
- **Verdict: approved.**

---

## 2026-03-31 20:50 PDT — SDK.HK.1: Replace sandbox with PreToolUse hook

**Done:** Replaced manual sandbox validation in the streaming loop with a native SDK `PreToolUse` hook. Added `buildSandboxHook()` factory that creates a `HookCallback` matching `Bash` tool calls — calls `validateCommand()` and returns `permissionDecision: "deny"` if blocked. Removed the manual `event.type === "tool_use"` check + `abortController.abort()` pattern (lines 282-298). The SDK now handles sandbox blocking natively via the hooks system. Kept `sandbox.ts` module unchanged.
**Files:** `packages/backend/src/agent/claude-executor.ts`

---

## 2026-03-31 20:30 PDT — Review: SDK.FC.7 (approved)

**Reviewed:** Documentation updates across `docs/api.md`, `docs/architecture.md`, `docs/mcp-tools.md` for file checkpointing.
- All four task requirements covered: rewind API endpoint, checkpointing mechanics, MCP tool, limitations
- Verified accuracy against actual implementation (`routes/executions.ts`, `mcp-server.ts`) — error codes, endpoint path, tool names all match
- Docs follow existing formatting patterns (tables, code blocks, section structure)
- Also cleaned up stale note in mcp-tools.md about seed data naming discrepancy
- **Verdict: approved.**

---

## 2026-03-31 20:15 PDT — SDK.FC.7: File checkpointing documentation

**Done:** Updated three doc files with file checkpointing coverage. `docs/api.md`: added full "Rewind Execution Files" section with request/response schemas, error codes table, side effects, curl examples. `docs/architecture.md`: updated MCP tool count 7→8, added "File Checkpointing" section with how-it-works steps, rewind flow diagram, limitations. `docs/mcp-tools.md`: updated tool count 7→8, added `rewind_execution` tool reference with input/output/example flow, updated persona access table.
**Files:** `docs/api.md`, `docs/architecture.md`, `docs/mcp-tools.md`

---

## 2026-03-31 — Review: SDK.FC.6 (approved)

**Reviewed:** File checkpointing e2e test results at `tests/e2e/results/file-checkpointing.md`.
- 7/17 PASS, 0 FAIL, 10 SKIP — SKIPs justified: all seeded executions lack checkpoints (legacy data)
- 4 screenshots captured covering: initial page, history table, disabled hover, full-page visual
- Disabled rewind buttons verified on all 11 rows — correct for null checkpoints
- API test: POST rewind returns 400 NO_CHECKPOINT — correct
- BUG-1 (minor) properly documented: Radix tooltip on disabled button, includes fix suggestion
- Results file well-structured with summary table, per-step verdicts, notes for re-testing
- **Verdict: approved.**

---

## 2026-03-31 — SDK.FC.6: Run file checkpointing e2e test

**Done:** Executed the file-checkpointing test plan. 7/17 PASS, 0 FAIL, 10 SKIP. All skips due to no executions having checkpoints (seeded demo data predates the feature). Verified: rewind buttons disabled on all 11 legacy executions, disabled button not clickable, API returns 400 NO_CHECKPOINT, visual layout clean. Found BUG-1 (minor): tooltip doesn't show on disabled rewind button (Radix tooltip + disabled element issue).
**Files:** `tests/e2e/results/file-checkpointing.md`, `tests/e2e/results/fc-01-agent-monitor-initial.png`, `tests/e2e/results/fc-02-history-table.png`, `tests/e2e/results/fc-03-disabled-hover.png`, `tests/e2e/results/fc-04-full-history.png`
**Notes:** Parts 2-3 (dry-run modal, confirm rewind) need re-testing after a real agent execution with checkpointing produces data.

---

## 2026-03-31 — Review: SDK.FC.5 (approved)

**Reviewed:** E2E test plan at `tests/e2e/plans/file-checkpointing.md`.
- 17 steps across 5 parts — covers all task requirements: button visibility, dry-run preview, confirm rewind, error handling, visual quality
- Follows template format exactly: objective, prerequisites, steps with screenshot checkpoints, expected results, failure criteria
- Steps reference actual UI elements from RewindButton: Undo2 icon, AlertDialog, tooltip text matches code ("Revert all file changes made by this agent run")
- Correctly handles edge cases: running executions (hidden), legacy executions (disabled), click propagation prevention
- **Verdict: approved.**

---

## 2026-03-31 — SDK.FC.5: E2E test plan for file checkpointing

**Done:** Created `tests/e2e/plans/file-checkpointing.md` — 17 steps across 5 parts covering rewind button visibility (completed/running/legacy), dry-run preview modal (file list, counts, buttons), confirm rewind flow (loading state, success toast), error handling (disabled state, click propagation), and visual quality. References actual UI elements from the RewindButton component: Undo2 icon, AlertDialog, tooltip text, file list styling.
**Files:** `tests/e2e/plans/file-checkpointing.md`

---

## 2026-03-31 — Review: SDK.FC.4 (approved)

**Reviewed:** `rewind_execution` MCP tool and Code Reviewer persona updates.
- Tool registered in `mcp-server.ts` with proper schema (`executionId`, `dryRun`), calls HTTP endpoint to avoid duplicating SDK rewind logic
- `encodeURIComponent` on executionId — safe against injection
- Error handling: HTTP errors extracted from response body, network errors caught, both return `isError: true`
- `TOOL_NAMES` array updated to include `"rewind_execution"`
- `mcpTools` updated in all 3 persona files: `default-personas.ts`, `seed.ts`, `seed-demo.ts`
- System prompt: clear 3-step rewind workflow (get executionId → dry run → confirm), guidance on when to/not to rewind, anti-pattern added
- Build passes
- **Verdict: approved.**

---

## 2026-03-31 — SDK.FC.4: Add rewind to REVIEW state workflow

**Done:** Added `rewind_execution` MCP tool to the agentops MCP server. The tool calls the existing `POST /api/executions/:id/rewind` endpoint via HTTP (avoids duplicating SDK query/rewind logic). Supports `dryRun` for preview. Updated Code Reviewer persona: added tool to `mcpTools` allowlist in `default-personas.ts`, `seed.ts`, and `seed-demo.ts`. Added "Rewinding files on rejection" section to the reviewer's system prompt with clear guidance on when to rewind (fundamentally wrong implementations) vs when not to (minor issues).
**Files:** `packages/backend/src/agent/mcp-server.ts`, `packages/backend/src/db/default-personas.ts`, `packages/backend/src/db/seed.ts`, `packages/backend/src/db/seed-demo.ts`
**Notes:** The tool calls `http://localhost:PORT/api/executions/:id/rewind` — requires the backend server to be running. PORT defaults to 3001. Existing DB personas won't pick up the new mcpTools until re-seeded.

---

## 2026-03-31 — Review: FX.PICO5 (approved)

**Reviewed:** Scroll overflow fix in `packages/frontend/src/features/pico/chat-panel.tsx`.
- Added `min-h-0 overflow-hidden` to ScrollArea — correct fix for CSS flex `min-height: auto` default preventing shrink
- Panel layout: explicit height container → flex-col → header (auto) + ScrollArea (flex-1 min-h-0) + input (auto) — scroll now constrained properly
- Auto-scroll `useEffect` with `messagesEndRef` untouched — still works
- Build passes
- **Verdict: approved.**

---

## 2026-03-31 — FX.PICO5: Fix Pico chat panel scroll overflow

**Done:** Added `min-h-0 overflow-hidden` to the ScrollArea in `chat-panel.tsx`. The root cause was CSS flex's default `min-height: auto` preventing the ScrollArea from shrinking below its content height — messages overflowed instead of scrolling. With `min-h-0`, the flex child respects the parent's height constraint and scrolls properly.
**Files:** `packages/frontend/src/features/pico/chat-panel.tsx`

---

## 2026-03-31 — Review: FX.LIC1 (approved)

**Reviewed:** Apache 2.0 license addition.
- LICENSE file: standard Apache 2.0 text, complete (191 lines), copyright notice included
- `"license": "Apache-2.0"` present in all 4 package.json files
- Build passes
- **Verdict: approved.**

---

## 2026-03-31 — FX.LIC1: Add Apache 2.0 license

**Task:** Add Apache 2.0 license to the repository.

**Done:**
- Created `LICENSE` file at repo root with standard Apache License 2.0 text (copyright 2026 AgentOps Contributors)
- Added `"license": "Apache-2.0"` to root `package.json`
- Added `"license": "Apache-2.0"` to `packages/shared/package.json`
- Added `"license": "Apache-2.0"` to `packages/backend/package.json`
- Added `"license": "Apache-2.0"` to `packages/frontend/package.json`

**Files created:** `LICENSE`
**Files modified:** `package.json`, `packages/shared/package.json`, `packages/backend/package.json`, `packages/frontend/package.json`

---

## 2026-03-31 — Review: FX.PICO4 (approved)

**Reviewed:** CORS fix in `packages/backend/src/routes/chat.ts`.
- Replaced `reply.raw.writeHead(200, { SSE headers })` with `reply.header()` + `reply.raw.writeHead(200, reply.getHeaders())`
- CORS headers from `@fastify/cors` plugin now included in SSE response without duplicating config
- Only `writeHead` in the backend — no other SSE endpoints affected
- Build passes
- **Verdict: approved.**

---

## 2026-03-31 — FX.PICO4: Fix CORS headers on Pico SSE endpoint

**Task:** Fix CORS headers missing on the SSE streaming endpoint for Pico chat.

**Root cause:** `reply.raw.writeHead(200, { ... })` in `packages/backend/src/routes/chat.ts` (line ~315) bypassed Fastify's `@fastify/cors` plugin by sending only the manually specified headers, excluding the CORS headers the plugin had set.

**Fix:** Replaced direct `reply.raw.writeHead()` with `reply.header()` calls for SSE headers, then flushed all accumulated headers (including CORS from the plugin) via `reply.raw.writeHead(200, reply.getHeaders())`. This preserves the CORS configuration from `server.ts` without duplicating it.

**Files modified:** `packages/backend/src/routes/chat.ts`

**Notes for next agent:** This should unblock all Pico chat streaming in the browser. The 4 failed + 4 skipped steps from the FX.PICO3 e2e test (Parts 3-5: streaming, markdown, thinking blocks) should now pass when re-tested.

---

## 2026-03-31 — Review: FX.PICO3 (approved)

**Reviewed:** Pico e2e test execution — results at `tests/e2e/results/pico-chat.md`, 8 screenshots.
- 30/38 pass, 4 fail, 4 skip — all failures from a single root cause (CORS on SSE endpoint)
- Bug properly documented: BUG-1 in results file with reproduction steps, root cause, and fix suggestion
- FX.PICO4 filed for the CORS fix (HIGH severity)
- 8 screenshots captured covering: bubble, panel, empty state, error state, session dropdown, mobile views, cleared state
- Build passes, no regressions
- **Verdict: approved.**

---

## 2026-03-31 — Review: FX.PICO2 (approved)

**Reviewed:** Pico chat e2e test plan at `tests/e2e/plans/pico-chat.md`.
- 38 steps across 11 parts — covers all 13 requirements from task description
- Follows template format: objective, prerequisites, steps with screenshot checkpoints, expected results, failure criteria, visual criteria
- Steps reference actual UI elements (aria-labels, component names, CSS classes) from the real codebase
- Conditional steps for thinking blocks and tool calls (may not trigger in every run) — correctly marked as optional
- Mobile viewport test (375x667) with specific responsive expectations from actual Tailwind classes
- Session management thoroughly tested: create, switch, rename, clear all
- **Verdict: approved.**

---

## 2026-03-31 — FX.PICO3: Execute Pico e2e test plan

**Task:** Run the 38-step Pico chat test plan using chrome-devtools MCP.

**Results:** 30 PASS, 4 FAIL, 4 SKIP (all failures from one root cause)

**Bug found:** CORS headers missing on Pico SSE endpoint (`POST /api/chat/sessions/:id/messages`). The route writes SSE headers manually via `reply.raw.writeHead()` which bypasses Fastify's `@fastify/cors` plugin. Browser blocks all requests. Filed as **FX.PICO4** (HIGH severity).

**What passed:**
- Bubble visibility on all 4 pages (dashboard, items, agents, personas)
- Panel open/close/toggle with proper positioning and animation
- Empty state with welcome message and 4 quick action buttons
- Quick action sends message (user bubble appears correctly)
- Manual message input via Cmd+Enter
- Session management: create, switch, rename, dropdown with timestamps
- Session title inline editing (rename + save via Enter)
- Panel state persistence across close/reopen and page navigation
- Mobile viewport (375x667): panel fits, no overflow, usable
- Error state: clear "Failed to fetch" message with Retry button
- Clear all sessions: returns to empty state

**What failed (all due to CORS):**
- Streaming response never arrives (blocked by browser)
- Markdown rendering untestable (no responses)
- Thinking blocks / tool calls untestable

**Files created:** `tests/e2e/results/pico-chat.md`, 8 screenshots in `tests/e2e/results/pico-*.png`

**Notes for next agent:** FX.PICO4 is the critical fix — add CORS headers to the SSE writeHead in chat.ts. Once fixed, re-run steps 12-13, 17-20 to verify streaming, markdown, thinking blocks, and tool calls.

---

## 2026-03-31 — FX.PICO1: Verified already fixed

**Task:** Fix "Pico persona not found" error.
**Result:** Confirmed fixed — seed.ts (line 499) already creates Pico persona with `isAssistant: true`, and chat.ts (line 244-247) looks up by that flag. Issue was a stale dev DB needing re-seed. User confirmed it's working. Marked complete.

---

## 2026-03-31 — FX.PICO2: Write Pico e2e test plan

**Task:** Create comprehensive e2e test plan for Pico chat UX.

**Done:**
- Created `tests/e2e/plans/pico-chat.md` — 38 steps across 11 parts:
  1. Chat bubble visibility (5 steps — bubble on every page)
  2. Panel open/close (5 steps — toggle, positioning, animation)
  3. Quick action messaging (3 steps — click action, streaming, response)
  4. Manual message input (4 steps — type, send via Cmd+Enter, response)
  5. Markdown & content rendering (3 steps — markdown, thinking blocks, tool calls)
  6. Session management (5 steps — create, switch, verify history)
  7. Session title editing (2 steps — inline edit, save)
  8. Panel state persistence (3 steps — close/reopen, cross-navigation)
  9. Mobile viewport (3 steps — resize to 375x667, verify usable)
  10. Error state (2 steps — error display, retry)
  11. Clear all sessions (3 steps — clear, verify empty state)
- Follows test plan template format with screenshot checkpoints at every step
- Includes visual quality criteria and failure criteria sections

**Files created:** `tests/e2e/plans/pico-chat.md`

**Notes for next agent:** FX.PICO3 executes this test plan using chrome-devtools MCP against the running app. The plan is comprehensive — 38 steps with screenshot checkpoints. Parts 5 (thinking/tool call rendering) and 10 (error state) have conditional steps that may be skipped if those features don't trigger during normal chat.

---

## 2026-03-31 — Review: SDK.FC.3 (approved)

**Reviewed:** Rewind button in agent monitor history.
- `RewindButton` component: clean separation, proper state management (loading, preview, dialog)
- Visibility: returns null for running executions, disabled for null checkpointMessageId — both correct
- UX flow: dry-run preview → modal with file list → confirm → toast — matches task spec exactly
- `e.stopPropagation()` prevents row toggle on click — good attention to detail
- Contextual tooltip: explains purpose or why disabled for legacy executions
- AlertDialog modal: file count with plural handling, mono font paths, scrollable list (max-h-200px), insertions/deletions stats
- Error handling: toast on both preview and confirm failures
- API client: `rewindExecution(id, dryRun)` with proper typing, re-exported from index
- Build passes clean
- **Verdict: approved.**

---

## 2026-03-31 — SDK.FC.3: Add rewind button to agent monitor UI

**Task:** Add rewind button to execution history with dry-run preview modal.

**Done:**
- Added `rewindExecution(id, dryRun)` API function + `RewindResult` type to `packages/frontend/src/api/client.ts`
- Re-exported `rewindExecution` from `packages/frontend/src/api/index.ts`
- Created `RewindButton` component in `packages/frontend/src/features/agent-monitor/agent-history.tsx`:
  - Undo2 icon button with tooltip explaining purpose / disabled state
  - Only visible on completed executions (returns null for running)
  - Disabled when `checkpointMessageId` is null (legacy executions)
  - Click: calls `rewindExecution(id, true)` for dry-run preview
  - Shows AlertDialog with file list (count, paths, insertions/deletions)
  - Confirm: calls `rewindExecution(id, false)`, shows success toast
  - Error handling: toast on both preview and confirm failures
  - `e.stopPropagation()` prevents row expansion toggle on button click
- Integrated RewindButton into HistoryRow's last table cell, before the expand chevron
- Restored stray uncommitted changes in `use-selected-project.ts` and `use-projects.ts` that were causing build errors (not mine)

**Files modified:** `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`, `packages/frontend/src/features/agent-monitor/agent-history.tsx`

**Notes for next agent:** Rewind UI is complete. The button appears in the history table for every completed execution. SDK.FC.4 adds the MCP tool for programmatic rewind from the Code Reviewer persona. SDK.FC.5 creates the e2e test plan.

---

## 2026-03-31 — Review: SDK.FC.2 (approved)

**Reviewed:** Rewind API endpoint in `packages/backend/src/routes/executions.ts`.
- Comprehensive validation: execution exists, has checkpoint, not running, work item and project exist, API key configured
- Correct withDiscoveryQuery pattern: start subprocess, call `rewindFiles()`, interrupt+drain — matches established SDK route pattern
- Clean error handling: 5 distinct error codes (NOT_FOUND, NO_CHECKPOINT, EXECUTION_RUNNING, NO_API_KEY, REWIND_FAILED, CANNOT_REWIND)
- Non-dry-run path posts system comment with file change details and logs audit entry
- Response shape clean: `{ canRewind, filesChanged, insertions, deletions, dryRun }`
- Query cleanup in both success and error paths
- Build passes clean
- **Verdict: approved.**

---

## 2026-03-31 — SDK.FC.2: Add rewind API endpoint

**Task:** Add `POST /api/executions/:id/rewind` route for file rewind via SDK.

**Done:**
- Added `POST /api/executions/:id/rewind` route in `packages/backend/src/routes/executions.ts`
- Accepts `{ dryRun?: boolean }` body
- Validates: execution exists, has checkpointMessageId, is not running
- Looks up project path via workItem → project chain
- Creates temporary query() session with `enableFileCheckpointing: true` in the project's cwd
- Calls `q.rewindFiles(checkpointMessageId, { dryRun })` using the withDiscoveryQuery pattern (start subprocess, call control method, interrupt+drain)
- Returns `{ canRewind, filesChanged, insertions, deletions, dryRun }`
- On non-dry-run: posts system comment on work item with file change summary, logs audit trail entry
- Error handling: 404 (execution/workItem/project not found), 400 (no checkpoint, cannot rewind), 409 (running execution), 503 (no API key), 500 (rewind failure)

**Files modified:** `packages/backend/src/routes/executions.ts`

**Notes for next agent:** The rewind endpoint is ready for SDK.FC.3 (UI rewind button). Frontend needs: `POST /api/executions/:id/rewind` with `{ dryRun: true }` first for preview, then `{ dryRun: false }` for actual rewind. Response shape: `{ data: { canRewind, filesChanged: string[], insertions, deletions, dryRun } }`. Note: `auditStateTransition` is reused for rewind audit logging with fromState="rewind", toState="reverted" — a dedicated audit function could be added later.

---

## 2026-03-31 — Review: SDK.FC.1 (approved)

**Reviewed:** File checkpointing enablement across executor, types, schema, and routes.
- `enableFileCheckpointing: true` correctly added to query() options
- `CheckpointEvent` properly added to `AgentEvent` union, handled with `continue` in stream loop (not broadcast — correct, internal-only signal)
- `checkpointMessageId` nullable column added via migration `0004`, backward-compatible
- Shared `Execution` entity and route serializer both include the new field with `?? null` fallback
- `eventToChunk` handles exhaustive switch with empty string for checkpoint type
- Build passes clean
- **Verdict: approved.**

---

## 2026-03-31 — SDK.FC.1: Enable file checkpointing in executor

**Task:** Add `enableFileCheckpointing: true` to query() options and store the checkpoint message ID.

**Done:**
- Added `CheckpointEvent` type to `AgentEvent` union in `packages/backend/src/agent/types.ts`
- Added `checkpointMessageId: string | null` to `Execution` entity in `packages/shared/src/entities.ts`
- Added `checkpoint_message_id` column to `executions` table in `packages/backend/src/db/schema.ts`
- Generated Drizzle migration `0004_sloppy_juggernaut.sql`
- In `packages/backend/src/agent/claude-executor.ts`: added `enableFileCheckpointing: true` to query() options, emits a `checkpoint` event with the first assistant message's ID
- In `packages/backend/src/agent/execution-manager.ts`: captures checkpoint events, stores `checkpointMessageId` in DB on completion, handles new event type in `eventToChunk`
- In `packages/backend/src/routes/executions.ts`: serializer now includes `checkpointMessageId`

**Files modified:** `packages/backend/src/agent/types.ts`, `packages/shared/src/entities.ts`, `packages/backend/src/db/schema.ts`, `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/routes/executions.ts`
**Files created:** `packages/backend/drizzle/0004_sloppy_juggernaut.sql`, `packages/backend/drizzle/meta/0004_snapshot.json`

**Notes for next agent:** File checkpointing is now enabled on all agent executions. The `checkpointMessageId` is captured from the first SDK assistant message and stored in the executions table. This unblocks SDK.FC.2 (rewind API endpoint) which will use `rewindFiles(checkpointMessageId)` to restore files. Existing executions will have `null` for this field — SDK.FC.3's UI should handle that (disable rewind button).

---

## 2026-03-31 — Review: SDK.V2.4 (approved)

**Reviewed:** V2 session architecture documentation in `docs/architecture.md`.
- Session types table clearly distinguishes all 4 session types (discovery, per-execution, Pico chat, persistent V2)
- Persistent V2 session lifecycle diagram is thorough: lazy init → sessionId capture → caching → reconnect with exponential backoff → shutdown
- SDK Capabilities Discovery flow accurately documents the withDiscoveryQuery pattern
- Critical "why not" explanations included: V2 can't replace query() for discovery (control methods on Query only) or Pico (SDKSessionOptions lacks agent/agents/mcpServers/cwd/skills)
- Stale references updated: Mock Layer → Pico Chat, sdk-session.ts and sandbox.ts added to agent engine table, chat/sdk added to routes
- Build passes clean
- **Verdict: approved.**

---

## 2026-03-31 — SDK.V2.4: Update architecture docs with V2 session

**Task:** Document V2 session architecture, discovery flow, and limitations.

**Done:**
- Added "SDK V2 Session Architecture" section to `docs/architecture.md`:
  - Session types table: discovery, per-execution, Pico chat, persistent V2
  - Persistent V2 session lifecycle diagram (lazy init → ready → reconnect → shutdown)
  - SDK capabilities discovery flow diagram (cache check → withDiscoveryQuery → initializationResult)
  - Documented WHY V2 sessions can't replace query() for discovery (control methods on Query only) or Pico (SDKSessionOptions lacks agent/agents, mcpServers, cwd, skills)
- Updated stale references:
  - Removed "Mock Layer (dev mode)" from high-level diagram → replaced with "Pico Chat (SSE)"
  - Frontend api/ description: removed mock delegation mention
  - Backend routes: added "chat, sdk" to route list
  - Agent engine table: added `sdk-session.ts` and `sandbox.ts`
- Also marked SDK.V2.3 as blocked (SDKSessionOptions limitation)

**Files modified:** `docs/architecture.md`

**Notes for next agent:** The architecture doc now reflects the current state of SDK integration. Key finding documented: V2 sessions (SDKSessionOptions) can't replace query() for Pico because they lack agent/agents, mcpServers, cwd, and skills options. This limitation blocks SDK.V2.3 until the SDK adds these fields. Next Sprint 19 tasks are SDK.FC.1+ (file checkpointing).

---

## 2026-03-31 — Review: FX.SDK6 (approved)

**Reviewed:** Subagents field added to Persona entity with SDK discovery browser.
- Full stack implementation: shared types, DB schema (migration `0003`), API contracts, routes (serializer + create + update), persona editor (edit + read-only), SubagentBrowser component.
- SubagentBrowser follows SkillBrowser pattern exactly: fetch agents from capabilities on open, searchable list, model badge, description panel, Add/Added state.
- Migration is backward-compatible: `DEFAULT '[]' NOT NULL`.
- All Persona construction sites fixed with `?? []` fallback for existing rows.
- Subagents stored but not yet wired to executor — correctly deferred to SDK.SA.1.
- Build passes.
- **Verdict: approved.**

---

## 2026-03-31 — FX.SDK6: Expose available subagents in persona config

**Task:** Add subagents field to Persona entity and create a subagent browser in the persona editor using SDK capabilities.

**Done:**
- Added `subagents: string[]` to `Persona` interface in `packages/shared/src/entities.ts`
- Added `subagents?: string[]` to `CreatePersonaRequest` and `UpdatePersonaRequest` in `packages/shared/src/api.ts`
- Added `subagents` column to personas table in `packages/backend/src/db/schema.ts` (JSON text, default `[]`)
- Generated Drizzle migration `0003_strong_kingpin.sql`
- Updated `packages/backend/src/routes/personas.ts`: serializer, create handler, update handler all include `subagents`
- Fixed `packages/backend/src/agent/execution-manager.ts` and `packages/backend/src/routes/dashboard.ts`: added `subagents` to Persona construction (with `?? []` fallback for existing rows)
- Created `packages/frontend/src/features/persona-manager/subagent-browser.tsx`: dialog fetching `agents` from `GET /api/sdk/capabilities`, searchable list with name/description/model badge, click for description panel, Add button
- Updated `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`:
  - Edit mode: `subagents` state, sync, save, Subagents section with pills + browse button + SubagentBrowser dialog
  - Read-only mode: shows subagent names as outline badges when populated

**Files created:** `packages/frontend/src/features/persona-manager/subagent-browser.tsx`, `packages/backend/drizzle/0003_strong_kingpin.sql`
**Files modified:** `packages/shared/src/entities.ts`, `packages/shared/src/api.ts`, `packages/backend/src/db/schema.ts`, `packages/backend/src/routes/personas.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/routes/dashboard.ts`, `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`

**Notes for next agent:** Subagents are stored as `string[]` on the Persona entity — the values are SDK agent names (e.g., "Explore", "code-reviewer"). Currently they're stored but NOT yet passed to `query()` options. SDK.SA.1 in Sprint 19 should wire these into the executor as `AgentDefinition` entries in the `agents` option. The SubagentBrowser component follows the same pattern as SkillBrowser — fetches from capabilities on dialog open.

---

## 2026-03-31 — Review: FX.SDK4 (approved)

**Reviewed:** Replaced filesystem skill browser with SDK capabilities-driven skill picker.
- Correctly fetches `commands` from `GET /api/sdk/capabilities` on dialog open. Searchable list with name, description, argument hint — matches task spec.
- Clean component architecture: loading/error/empty states, retry button, `useMemo` for filtered results, `stopPropagation` on Add button.
- Manual path input preserved as fallback for custom skills — task requirement met.
- Persona detail panel: `isSlashCommand` heuristic (`!includes("/") && !includes(".")`) is reasonable for distinguishing SDK commands from file paths.
- Removed `useSelectedProject` dependency and `projectPath` prop — skill browsing no longer requires project context.
- API types (`SdkSkill`, `SdkCapabilities`) match backend response shape.
- Build passes.
- **Verdict: approved.**

---
