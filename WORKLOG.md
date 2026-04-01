# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-31 23:20 PDT — SDK.HK.6: E2E test plan for file changes panel

**Done:** Created `tests/e2e/plans/agent-monitor-files.md` — 16 steps across 5 parts: panel visibility/auto-hide (4), content/file entries (5), collapse/expand (3), execution switching (2), visual quality (2). Notes real-time WS dependency — panel only appears during active executions with FileChanged hook. Covers deduplication, badge count, icon coloring, dark theme.
**Files:** `tests/e2e/plans/agent-monitor-files.md`

---

## 2026-03-31 23:10 PDT — Review: FX.PROJ1 (approved)

**Reviewed:** Stale project ID fallback in `use-selected-project.ts` and `use-projects.ts`.
- `retry: false` on `useProject` — fails fast on 404 instead of 3 retries
- `useEffect` detects `isError` + auto-selects first available project — no infinite loop risk
- Also handles null `selectedProjectId` (first-load with empty store) — auto-selects
- Zustand `setSelectedProjectId` persists fix to localStorage — durable across reloads
- Build passes
- **Verdict: approved.**

---

## 2026-03-31 23:05 PDT — FX.PROJ1: Fix stale project ID fallback

**Done:** Updated `use-selected-project.ts` to detect stale project IDs and auto-fallback. Added `useProjects()` to get available projects and `useEffect` that resets to first available project when: (a) no project selected and projects exist, or (b) selected project returns error (404) and projects exist. Added `retry: false` to `useProject` query in `use-projects.ts` so stale IDs fail fast instead of retrying 3 times.
**Files:** `packages/frontend/src/hooks/use-selected-project.ts`, `packages/frontend/src/hooks/use-projects.ts`

---

## 2026-03-31 22:50 PDT — Review: SDK.HK.5 (approved)

**Reviewed:** File changes panel UI in `file-changes-panel.tsx` and integration in `terminal-renderer.tsx`.
- Collapsible section with badge count, auto-hides when empty, clears state on execution switch
- Each entry: icon (FilePlus/FileText/FileX), file path (monospace, truncated), change type label (color-coded), timestamp
- Real-time via `file_changed` WS subscription with deduplication by path
- Follows conventions: named export, shadcn Badge, cn(), lucide-react icons, dark theme
- Build passes
- **Verdict: approved.**

---

## 2026-03-31 22:40 PDT — SDK.HK.5: Agent monitor file changes panel

**Done:** Created `file-changes-panel.tsx` component in agent-monitor feature. Subscribes to `file_changed` WS events, deduplicates by file path (updates existing entries on re-modification). Shows collapsible panel at bottom of terminal renderer with badge count. Each entry shows: icon (FilePlus/FileText/FileX with green/amber/red coloring), file path, change type label, timestamp. Panel auto-hides when no files changed. Integrated into `terminal-renderer.tsx` between chat output and new-output indicator.
**Files:** `packages/frontend/src/features/agent-monitor/file-changes-panel.tsx` (new), `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`

---

## 2026-03-31 22:25 PDT — Review: SDK.HK.4 (approved)

**Reviewed:** FileChanged hook and `file_changed` WS event type across shared, backend, frontend.
- `FileChangedEvent` added to all four shared type locations (WsEventType, interface, WsEvent union, WsEventMap)
- Hook maps SDK events (`add`/`change`/`unlink`) to user-friendly types via `FILE_EVENT_MAP` with safe fallback
- Frontend `ws-client.ts` listener initialized to satisfy exhaustive type
- UI work (badge/counter) correctly deferred to SDK.HK.5
- Build passes
- **Verdict: approved.**

---

## 2026-03-31 22:15 PDT — SDK.HK.4: FileChanged hook for live file tracking

**Done:** Added `FileChanged` SDK hook that broadcasts `file_changed` WS events when agents modify files. New `FileChangedEvent` type in `packages/shared/src/ws-events.ts` with `{ executionId, filePath, changeType: "created"|"modified"|"deleted" }`. Hook maps SDK's `event` field (`add`/`change`/`unlink`) to user-friendly change types. Added `file_changed` to `WsEventType`, `WsEvent` union, `WsEventMap`, and frontend `ws-client.ts` listener initialization.
**Files:** `packages/backend/src/agent/claude-executor.ts`, `packages/shared/src/ws-events.ts`, `packages/frontend/src/api/ws-client.ts`

---

## 2026-03-31 22:00 PDT — Review: SDK.HK.3 (approved)

**Reviewed:** SessionStart/SessionEnd lifecycle hooks in `claude-executor.ts` and `audit.ts`.
- SessionStart: audit logs persona/model/workItemId + broadcasts `execution_update` WS event (status: "running")
- SessionEnd: audit logs exit reason + computed duration via closure
- Cost not logged in SessionEnd — SDK's `SessionEndHookInput` doesn't expose it; already logged by `auditAgentComplete` in execution-manager
- Existing `agent_started`/`agent_completed` broadcasts correctly preserved (carry different payloads)
- Build passes
- **Verdict: approved.**

---

## 2026-03-31 21:50 PDT — SDK.HK.3: SessionStart/SessionEnd hooks

**Done:** Added session lifecycle hooks for execution audit trail and real-time updates. Created `auditSessionStart()` (logs persona, model, workItemId) and `auditSessionEnd()` (logs reason, durationMs) in `audit.ts`. Added `buildSessionHooks()` factory in `claude-executor.ts` — SessionStart records start time + audit logs + broadcasts `execution_update` (status: "running") WS event; SessionEnd computes duration from start + audit logs. Duration tracked via closure. Existing `agent_started`/`agent_completed` broadcasts in execution-manager preserved (they carry different payload data).
**Files:** `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/audit.ts`

---

## 2026-03-31 21:30 PDT — Review: SDK.HK.2 (approved)

**Reviewed:** PostToolUse audit logging hook across `claude-executor.ts`, `audit.ts`, `types.ts`, `execution-manager.ts`.
- `auditToolUse()` follows existing audit function patterns, logs all required fields
- `buildAuditHooks()` factory uses closures for shared state (startTimes Map + executionId) — clean design
- Three hooks cover full lifecycle: PreToolUse (timing), PostToolUse (success), PostToolUseFailure (failure)
- Bash command sanitization regex covers API_KEY/SECRET/TOKEN/PASSWORD (case-insensitive), preserves key names
- `executionId` correctly plumbed through SpawnOptions to execution-manager call site
- Build passes
- **Verdict: approved.**

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

**Done:** Updated three doc files with file checkpointing coverage. `docs/api.md`: added full "Rewind Execution Files" section with request/response schemas, error codes table, side effects, curl examples. `docs/architecture.md`: updated MCP tool count 7->8, added "File Checkpointing" section with how-it-works steps, rewind flow diagram, limitations. `docs/mcp-tools.md`: updated tool count 7->8, added `rewind_execution` tool reference with input/output/example flow, updated persona access table.
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
- System prompt: clear 3-step rewind workflow (get executionId -> dry run -> confirm), guidance on when to/not to rewind, anti-pattern added
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
- Panel layout: explicit height container -> flex-col -> header (auto) + ScrollArea (flex-1 min-h-0) + input (auto) — scroll now constrained properly
- Auto-scroll `useEffect` with `messagesEndRef` untouched — still works
- Build passes
- **Verdict: approved.**

---

## 2026-03-31 — FX.PICO5: Fix Pico chat panel scroll overflow

**Done:** Added `min-h-0 overflow-hidden` to the ScrollArea in `chat-panel.tsx`. The root cause was CSS flex's default `min-height: auto` preventing the ScrollArea from shrinking below its content height — messages overflowed instead of scrolling. With `min-h-0`, the flex child respects the parent's height constraint and scrolls properly.
**Files:** `packages/frontend/src/features/pico/chat-panel.tsx`

---
