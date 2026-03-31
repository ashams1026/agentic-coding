# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-30 — FX.DB2: Create mock/simulated executor

**Task:** Implement a mock executor matching the `AgentExecutor` interface for test and dev environments.

**Done:**
- Created `packages/backend/src/agent/mock-executor.ts` implementing `AgentExecutor`
- `MockExecutor` class with configurable `delayMs` (default 2000) via constructor options
- `spawn()` yields 6 events in sequence with staggered delays (`delayMs / 5` per step):
  1. **thinking**: analyzes work item title and current state
  2. **text**: announces approach referencing task context
  3. **tool_use**: `post_comment` with `workItemId` and summary content, synthetic `toolCallId`
  4. **tool_result**: success response with mock comment ID
  5. **text**: completion message
  6. **result**: `outcome: "success"`, `costUsd: 0`, `durationMs` matching actual elapsed time
- All events reference the work item title for realistic output
- `sleep()` helper for async delays
- Unused parameters prefixed with `_` to satisfy TS strict mode
- Build passes

**Files created:** `packages/backend/src/agent/mock-executor.ts`

**Notes:** The mock executor exercises the full execution pipeline (DB records, WS streaming, router chain) without API calls. FX.DB3 will wire the executor selection by environment.

---

## 2026-03-30 — Review: FX.DB1 (approved)

**Reviewed:** Dev/prod database separation in `packages/backend/src/db/connection.ts` and related files.
- `resolveDbPath()`: clean priority chain — `AGENTOPS_DB_PATH` → `DATABASE_URL` → NODE_ENV-based. Dev returns `"agentops-dev.db"` (local), prod returns `~/.agentops/data/agentops.db` with `mkdirSync`. Unset NODE_ENV defaults to `"development"` via `??`. Correct.
- `DB_PATH` exported as module-level const — evaluated once at import. Start.ts logs it with `nodeEnv` before migrations. Correct.
- `package.json`: `dev` script sets `NODE_ENV=development`. `db:reset` cleans dev DB + WAL/SHM, re-runs migrate + seed with `NODE_ENV=development`. Correct.
- `drizzle.config.ts`: fallback updated `agentops.db` → `agentops-dev.db` — consistent with dev default.
- `.gitignore`: `*.db` already covers `agentops-dev.db`. `ecosystem.config.cjs`: already has `NODE_ENV: "production"`. Both verified, no changes needed.
- `seed-e2e.ts` / `seed-demo.ts`: set `DATABASE_URL` before import — unaffected by this change.
- Test: uses `:memory:` via `createTestDb()` — separate path, no change needed.
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.DB1: Separate dev, test, and prod databases

**Task:** Select DB path based on NODE_ENV: dev → local file, prod → home directory, with env var override.

**Done:**
- **`connection.ts`**: Replaced hardcoded `DATABASE_URL` fallback with `resolveDbPath()` function. Priority: `AGENTOPS_DB_PATH` env → `DATABASE_URL` env → NODE_ENV-based default. Production → `~/.agentops/data/agentops.db` (with `mkdirSync`), Development/unset → `agentops-dev.db` (local to project). Exported `DB_PATH` for logging.
- **`start.ts`**: Added startup log line: `logger.info({ dbPath: DB_PATH, nodeEnv })` before migrations run.
- **`packages/backend/package.json`**: `dev` script now sets `NODE_ENV=development` explicitly. Added `db:reset` script: deletes dev DB + WAL/SHM files, re-runs migrations, re-seeds with `NODE_ENV=development`.
- **`drizzle.config.ts`**: Fallback changed from `agentops.db` → `agentops-dev.db` (drizzle-kit tools are dev-only).
- **`.gitignore`**: Already has `*.db` — covers `agentops-dev.db`, no change needed.
- **`ecosystem.config.cjs`**: Already has `NODE_ENV: "production"` — no change needed.
- **Test**: Already uses `:memory:` via `createTestDb()` — no change needed.
- Build passes

**Files modified:** `packages/backend/src/db/connection.ts`, `packages/backend/src/start.ts`, `packages/backend/package.json`, `packages/backend/drizzle.config.ts`

**Notes:** The `config.ts` CLI config system (`loadConfig`) is separate from `connection.ts` DB resolution. Both support `AGENTOPS_DB_PATH` override. The `seed-e2e.ts` and `seed-demo.ts` scripts set `DATABASE_URL` explicitly before import, so they're unaffected.

---

## 2026-03-30 — Review: FX.8 (approved)

**Reviewed:** Historical log chunk type detection in `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`.
- `parseLogLine()` with 3 detection layers: JSON with chunkType/ToolCallData shapes, `ToolName({...})` regex pattern against KNOWN_TOOLS set, `<thinking>` tag stripping
- Layer 1: `startsWith("{")` guard before `JSON.parse` — avoids wasteful parsing on non-JSON lines. Checks both `chunkType` field and ToolCallData/ToolResultData shapes. Correct.
- Layer 2: `TOOL_CALL_RE` matches actual `eventToChunk` output format. Null checks on regex groups satisfy strict TS. Reconstructs `ToolCallData` JSON for `ToolCallSection` rendering. `toolCallId: id` uses synthetic chunk ID — tool results won't pair in historical logs, acceptable limitation.
- Layer 3: `<thinking>` detection with tag stripping, empty content guard falls through to text. Correct.
- Missing code block detection (triple backtick) — non-issue: backend `toChunkType()` never returns "code", so no code markers exist in stored logs
- `KNOWN_TOOLS`: 20 entries covering all SDK + MCP tools. `s` flag on regex harmless.
- Integration: clean replacement of hardcoded `chunkType: "text"` in useEffect
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.8: Fix historical log chunk type detection

**Task:** Parse historical log lines to detect chunk types instead of marking all as "text".

**Done:**
- Added `parseLogLine()` function in `terminal-renderer.tsx` with 3 detection layers:
  1. **JSON lines**: If line starts with `{`, try parsing as JSON. If it has a `chunkType` field, use it directly. If it has `toolCallId` + `toolName`, classify as tool_call or tool_result.
  2. **Tool call pattern**: Regex matches `ToolName({...})` format (from `eventToChunk`). Validates against `KNOWN_TOOLS` set (12 SDK tools + 7 MCP tools). Reconstructs proper `ToolCallData` JSON so `ToolCallSection` can render it with icon, name, and collapsible input.
  3. **Thinking tags**: Detects `<thinking>` / `</thinking>` wrapped content, strips tags, returns as thinking chunk.
  4. Default: falls through to `"text"`.
- `KNOWN_TOOLS` set: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Agent, NotebookEdit, TodoWrite, AskUserQuestion, MultiEdit, route_to_state, list_items, get_context, post_comment, get_work_item, update_work_item, create_work_item
- `TOOL_CALL_RE` regex: `/^([A-Za-z_]\w*)\((.+)\)$/s` with `s` flag for multiline JSON
- Updated initial log loading useEffect: replaced hardcoded `chunkType: "text"` with `parseLogLine()` call
- Build passes

**Files modified:** `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`

**Notes:** Tool results in historical logs can't be reliably distinguished from regular text (they're raw output like file contents). They'll render as text bubbles, which is acceptable. The main win is tool calls now render as proper ToolCallSection cards with icon + name + collapsible input, and thinking blocks render as collapsible accordions.

---

## 2026-03-30 — Review: FX.7 (approved)

**Reviewed:** Chat thread restructure in `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`.
- `groupIntoMessages()`: clean state machine — accumulates consecutive text/code chunks into `textGroup`, flushes at thinking/tool boundaries, pairs tool_call+tool_result via `callIndexMap` index. Defensive `[...textGroup]` copy in flush. Orphan tool_results handled gracefully.
- `AgentTextBubble`: rounded-lg container with zinc-900 background, renders mixed text/code within one bubble. Correct.
- `ThinkingAccordion`: `useState(false)` for collapsed default, chevron rotation via `cn()`, "Thinking..." label, italic muted text in collapsible section. Correct.
- `ToolMessage`: thin wrapper around existing `ToolCallSection` + `MessageTimestamp`. Correct.
- `MessageGroupRenderer`: exhaustive switch on `group.kind`. Clean.
- `MODEL_LABELS` moved to module level — addresses prior FX.6 review minor note
- No dead imports, all new imports (`cn`, `ChevronDown`) used
- Persona header, toolbar, scroll lock, WS subscription all preserved
- `space-y-3` on scroll area for visual separation between groups
- "system/user messages" from spec not applicable — current data model has no user/system chunk types, full-width agent bubbles is the correct interpretation
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.7: Render agent output as chat thread

**Task:** Restructure the terminal renderer to display output as a conversation with grouped messages, collapsible thinking, and timestamps.

**Done:**
- Replaced flat `DisplayItem[]` model with `MessageGroup` union type: `agent-text` (grouped text/code bubbles), `thinking` (collapsible accordion), `tool` (paired call+result cards)
- New `groupIntoMessages()` function: walks chunks sequentially, groups consecutive text/code chunks into single agent message bubbles, flushes text group on thinking/tool boundaries, pairs tool_call + tool_result by toolCallId
- `AgentTextBubble`: rounded-lg container with zinc-900 background and zinc-800 border, renders mixed text/code chunks within one bubble
- `ThinkingAccordion`: collapsed by default, "Thinking..." label with chevron toggle, expands to show italic muted text with left border
- `ToolMessage`: wraps existing `ToolCallSection` with timestamp
- `MessageTimestamp`: compact HH:MM:SS timestamp below each message group
- Chat area uses `space-y-3` for visual separation between message groups
- Removed old `ChunkRenderer`, `TextBlock`, `ThinkingBlock`, `processChunks`, `DisplayItem` — all replaced
- Kept persona header, toolbar, scroll lock, and WS subscription unchanged
- Added `cn` utility import, `ChevronDown` from lucide-react
- Build passes

**Files modified:** `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`

**Notes:** The chat thread model groups consecutive text chunks into single message bubbles, which reduces visual noise when agents emit multiple small text chunks. Thinking blocks default to collapsed since they can be very long. Tool calls reuse the existing ToolCallSection for consistency.

---

## 2026-03-30 — Review: FX.6 (approved)

**Reviewed:** Persona identity header in `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`.
- `usePersona(execution?.personaId)` + `useWorkItem(execution?.workItemId)` — correct hook usage, TanStack Query handles undefined gracefully
- Header placement: above toolbar, above terminal output — first thing visible. Correct.
- Colored circular avatar: `persona.avatar.color` background, first letter, white text, `rounded-full` — consistent with persona manager cards
- Model badge: `Badge variant="secondary"` with MODEL_LABELS fallback — correct
- Work item subtext: "working on {title}" with `truncate` — correct, conditional on workItem load
- Conditional rendering `{persona && (...)}` — graceful degradation while loading
- Minor: `MODEL_LABELS` inside render (could be module-level) and duplicate `@agentops/shared` import — cosmetic, not bugs
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.6: Show persona identity in terminal renderer

**Task:** Add a header bar above terminal output showing persona name (colored avatar), model badge, and work item title.

**Done:**
- Added `usePersona(execution?.personaId)` and `useWorkItem(execution?.workItemId)` hooks to `TerminalRenderer`
- Added imports: `usePersona`, `useWorkItem` from hooks, `PersonaId`, `WorkItemId` from shared
- New header bar above the toolbar: colored circular avatar (persona's avatar color, first letter of name), persona name (semibold), model badge (Opus/Sonnet/Haiku), and "working on {work item title}" subtext
- Header conditionally rendered only when persona data is loaded
- Work item title truncated with `truncate` class for long titles
- `MODEL_LABELS` map converts internal model names to display labels
- Build passes

**Files modified:** `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`

**Notes:** The header is the first thing visible — "Product Manager (Sonnet) working on Build TicTacToe App" pattern as specified. Uses persona.avatar.color for the avatar background, consistent with persona cards in the persona manager.

---

## 2026-03-30 — Review: FX.5 (approved)

**Reviewed:** Cost aggregation audit and cents→dollars fix in `dashboard.ts` and `executions.ts`.
- Root cause confirmed: DB stores cents, routes returned cents as if dollars — 100x inflation in frontend display
- `dashboard.ts`: 4 aggregations use clean rename pattern (`todayCostCents`, `costCents`, `monthTotalCents`, `totalCostCents`) with `/ 100` at return — clear intent, consistent
- `executions.ts`: `row.costUsd / 100` with comment in serializer — correct
- WS `cost_update` from `concurrency.ts` was already correct — no change, now consistent across all paths
- `monthCap` is already in dollars (default 50) — progress bar comparison now correct
- Frontend unchanged — API contract now consistently returns dollars, which frontend already expected
- Seed data verified: cents values (22-92) are realistic ($0.22-$0.92), not inflated
- Project scoping verified: all routes accept `projectId`, filter through work item ownership
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.5: Audit cost aggregation and display

**Task:** Verify cents-to-dollars conversion in dashboard routes and frontend display. Check project scoping.

**Audit findings:**
- **Root cause**: DB column `costUsd` stores **cents** (integer). `execution-manager.ts` correctly writes `Math.round(finalCostUsd * 100)`. But all dashboard routes returned raw cent values without dividing by 100, so the frontend displayed costs 100x higher than actual (e.g., 85 cents showed as "$85.00").
- **Affected routes**: `GET /api/dashboard/stats` (`todayCostUsd`), `GET /api/dashboard/cost-summary` (`dailySpend[].costUsd`, `monthTotal`), `GET /api/dashboard/execution-stats` (`totalCostUsd`), execution serializer in `GET /api/executions`.
- **WS `cost_update`**: Already correct — `concurrency.ts` `getProjectCostSummary` divides by 100.
- **Seed data**: Values like `costUsd: 85` are cents ($0.85) — realistic for AI agent runs. Not inflated.
- **Project scoping**: Already in place — all dashboard routes accept `projectId` param and filter.

**Fix:**
- `dashboard.ts`: All 4 cost aggregations now divide by 100 before returning (`todayCostCents / 100`, `costCents / 100`, `monthTotalCents / 100`, `totalCostCents / 100`)
- `executions.ts`: Serializer now returns `row.costUsd / 100` with comment
- Frontend: No changes needed — correctly displays the values from the API with `$` + `.toFixed(2)`
- Build passes

**Files modified:** `packages/backend/src/routes/dashboard.ts`, `packages/backend/src/routes/executions.ts`

**Notes:** The `monthCap` in project settings is already in dollars (default 50), so the progress bar comparison now works correctly: `monthTotal` (dollars) vs `monthCap` (dollars).

---

## 2026-03-30 — Review: FX.4 (approved)

**Reviewed:** Transition loop detection in `packages/backend/src/agent/execution-manager.ts`.
- `LOOP_HISTORY_SIZE = 6` tracks more than the task's "last 3" — better design, 6 entries needed to reliably detect A→B→A→B→A→B (3 occurrences of each state)
- `detectLoop()`: counts occurrences, returns true at >= 3. Early exit on `history.length < 3`. Correct.
- `recordStateForLoop()`: `splice(0, len - LOOP_HISTORY_SIZE)` trims from front — preserves most recent. Correct.
- Placement: inside Router completion path after reading `currentState`, before `dispatchForState()` — right place since only Router changes states
- Loop detected path: `logger.warn`, DB update to Blocked, system comment with exact task spec text, `state_change` + `comment_created` WS broadcasts, no `dispatchForState()` call — chain fully halted
- No-loop path: `dispatchForState()` in `else` branch — existing behavior preserved
- `clearStateHistory()` exported for test cleanup — consistent with `clearTransitionLog()` pattern
- Comment metadata includes `history` array for diagnostics
- No unused imports, all symbols already in scope
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.4: Add transition loop detection

**Task:** Track recent state transitions per work item. If a state appears 3+ times in recent history, halt the chain and transition to Blocked.

**Done:**
- Added `stateHistory` Map (`workItemId → string[]`) to track recent states per work item
- `recordStateForLoop(workItemId, state)`: appends state, keeps last 6 entries (enough to detect A→B→A→B→A→B)
- `detectLoop(workItemId)`: returns true if any state appears 3+ times in the history window
- `clearStateHistory()`: exported for test cleanup
- In `runExecutionStream()`, after Router completes and `currentState` is read: calls `recordStateForLoop()` then `detectLoop()`. If loop detected:
  - Logs `logger.warn` with workItemId and currentState
  - Updates work item to `currentState: "Blocked"` in DB
  - Posts system comment: "Detected routing loop — halting automatic transitions. Manual intervention required." (metadata includes full state history)
  - Broadcasts `state_change` WS event (fromState → Blocked)
  - Broadcasts `comment_created` WS event
  - Does NOT call `dispatchForState()` — chain is halted
- If no loop detected: dispatches normally (existing behavior)
- Build passes

**Files modified:** `packages/backend/src/agent/execution-manager.ts`

**Notes:** This is the third and final layer of routing loop defense: FX.1 (same-state rejection) → FX.2 (transition history in Router prompt) → FX.4 (automatic loop detection with Blocked). The 6-entry window with 3-occurrence threshold catches patterns like In Progress → In Review → In Progress → In Review → In Progress → In Review.

---

## 2026-03-30 — Review: FX.3 (approved)

**Reviewed:** Rate limiter logging in `packages/backend/src/agent/execution-manager.ts`.
- `getTransitionCount()`: clean helper, correctly filters timestamps within last hour
- `else if (finalOutcome === "success")` at line 462: correct placement — fires only when execution succeeded but rate limiter blocked chaining. Failed executions correctly fall through neither branch.
- `logger.warn` includes workItemId, transitionCount, and max — matches task spec
- System comment: follows same pattern as mcp-server.ts (authorType: "system", metadata with coordination key). Content includes count and max with user instructions.
- WS broadcast: `comment_created` event — correct existing event type that frontend already listens for
- `comments` and `CommentId` imports both used — no dead imports
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.3: Log when rate limiter triggers

**Task:** When `canTransition()` returns false, log a warning, post a system comment, and broadcast a WS event.

**Done:**
- Added `comments` to schema import and `CommentId` to shared type imports
- Added `getTransitionCount(workItemId)` helper to expose the current transition count for a work item (filters timestamps within the last hour)
- Added `else if (finalOutcome === "success")` branch in `runExecutionStream()` after the `canTransition()` check — this fires when the execution succeeded but the rate limiter blocked further chaining
- When triggered: (1) logs `logger.warn` with `workItemId`, `transitionCount`, and `max`, (2) inserts a system comment on the work item with details and instructions ("Resume manually or wait for the cooldown"), (3) broadcasts a `comment_created` WS event so the UI updates immediately
- Comment metadata includes `{ coordination: "rate_limit", transitionCount, max }` for easy filtering
- Build passes

**Files modified:** `packages/backend/src/agent/execution-manager.ts`

**Notes:** This makes rate limiting visible to users — previously the chain silently stopped. The system comment appears in the work item's comment stream, and the WS event means the dashboard/activity feed can react in real time.

---

## 2026-03-30 — Review: FX.2 (approved)

**Reviewed:** Router transition history awareness in `packages/backend/src/agent/router.ts`.
- `getRecentTransitions()`: queries comments table for Router comments with `fromState`/`toState` metadata, ordered by `desc(createdAt)`, limit 3 — correct data source and filtering
- `buildRouterSystemPrompt()`: base prompt + optional transition list + mandatory anti-loop instruction — clean assembly, anti-loop instruction always present
- `runRouter()`: updates Router persona's `systemPrompt` in DB before each `runExecution()` call — pragmatic approach
- Minor race condition risk if two `runRouter()` calls for different work items overlap — low risk given sequential execution chain, and FX.1's same-state rejection provides the hard safety net
- Anti-loop instruction matches task spec: "Do NOT route to a state this item was just in. If the persona's work appears incomplete, route to Blocked..."
- `getOrCreateRouterPersona()` uses `buildRouterSystemPrompt([])` for initial creation — consistent
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.2: Add Router transition history awareness

**Task:** Include last 3 state transitions in Router's system prompt to prevent routing loops.

**Done:**
- In `packages/backend/src/agent/router.ts`: renamed `ROUTER_SYSTEM_PROMPT` → `ROUTER_BASE_PROMPT` (base content unchanged)
- Added `getRecentTransitions(workItemId, limit)`: queries the comments table for Router comments with `fromState`/`toState` metadata, returns the last N transitions (default 3)
- Added `buildRouterSystemPrompt(transitions)`: assembles the base prompt + a "Recent State Transitions" section listing each transition + the anti-loop instruction ("Do NOT route to a state this item was just in")
- Modified `runRouter()`: before calling `runExecution`, queries recent transitions and updates the Router persona's `systemPrompt` in the DB with the dynamic prompt
- The anti-loop instruction is always present (even with no transitions): "If the persona's work appears incomplete, route to Blocked with a reason rather than re-triggering the same persona."
- Added imports: `and`, `desc` from drizzle-orm, `comments` from schema
- Build passes

**Files modified:** `packages/backend/src/agent/router.ts`

**Notes:** This is the second layer of loop defense (after FX.1's same-state rejection). The Router now sees recent transition history and has explicit guidance to use Blocked state instead of re-triggering. FX.4 will add the third layer — automatic loop detection that halts chains.

---

## 2026-03-30 — Review: FX.1 (approved)

**Reviewed:** Same-state routing rejection in `route_to_state` tool.
- Check positioned after item lookup, before `isValidTransition` — correct order
- `targetState === item.currentState` — exact equality, correct
- Error response: `isError: true`, JSON with descriptive message including state name — consistent with existing patterns
- Clean early return — no DB writes, no broadcasts on rejection
- Minimal change, single concern
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.1: Prevent Router from re-routing to same state

**Task:** Reject `route_to_state` calls where `targetState === currentState`.

**Done:**
- In `packages/backend/src/agent/mcp-server.ts`, `route_to_state` tool handler: added same-state check immediately after looking up the work item's current state, before the `isValidTransition` validation
- Returns `isError: true` with message `Cannot route to the current state. Work item is already in "{state}".`
- This prevents the Router from triggering a PM→Router→PM loop where it keeps selecting the same state
- Build passes

**Files modified:** `packages/backend/src/agent/mcp-server.ts`

**Notes:** This is the first line of defense against routing loops. FX.2 (transition history awareness) and FX.4 (loop detection) add deeper protection layers.

---

## 2026-03-30 — Review: FX.P9 (approved)

**Reviewed:** Persona skills injection into system prompt.
- Imports: `readFileSync`, `join`, `basename` from node:fs/path, `logger` from logger.js — all correct
- Section placement: (5) between sandbox rules (4) and execution history (6) — good ordering
- File resolution: `join(project.path, skillPath)` — correct relative-to-absolute resolution
- Content cap: 8000 chars (~2000 tokens), remaining tracked per-file, truncation with `...(truncated)` marker
- Missing files: try/catch with `logger.warn({ skillPath, personaId })` — structured logging, graceful skip
- Skills section guard: `skillSections.length > 1` prevents empty `## Skills` header
- Heading style: uses `## Skills` parent with `### {filename}` children — slightly different from task spec (`## Skill: {filename}`) but better hierarchy
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.P9: Inject persona skills into system prompt

**Task:** Read skill files from disk and inject their content into the persona's system prompt at execution time.

**Done:**
- Added `readFileSync`, `join`, `basename` imports from `node:fs` and `node:path`
- Added `logger` import from `../logger.js`
- New section (5) in `buildSystemPrompt()` between sandbox rules and execution history
- For each skill path in `persona.skills`: resolves `path.join(project.path, skillPath)`, reads file content
- Each skill appended as `### {filename}\n\n{content}` under a `## Skills` header
- **Cap**: 8000 chars (~2000 tokens) total across all skills. If cap reached, remaining skills are skipped with a warning log. If a single skill exceeds remaining capacity, it's truncated with `...(truncated)` marker.
- **Missing files**: caught with try/catch, logged as warning with `skillPath` and `personaId`, silently skipped
- Skills section only added if at least one skill was successfully loaded
- Build passes

**Files modified:** `packages/backend/src/agent/claude-executor.ts`

**Notes:** Skills are injected after sandbox rules and before execution history, so they appear in the middle of the system prompt — visible to the agent but not overriding core identity or execution context.

---

## 2026-03-30 — Review: FX.P8 (approved)

**Reviewed:** Skill browser in persona editor.
- Backend: `browse-directory` extended with `includeFiles`/`fileFilter` — backward-compatible, existing FolderBrowser unaffected
- Backend: `read-file` endpoint for preview — proper error handling, `readFileSync` import added
- `skill-browser.tsx`: Modal scoped to project path, `.md` filter, directory navigation, file preview (20 lines), "+" to add, "Added" badge for duplicates, manual path input with Enter support
- `path-utils.ts`: Simple browser-safe `relative()` — handles prefix case correctly, falls back to absolute
- `persona-detail-panel.tsx`: `skills` state synced from persona, included in save mutation, Skills section with removable pills + browse button between Tools and Budget, disabled when no project path
- API client: `browseDirectory()` options, `readFilePreview()`, both exported from index
- Naming: kebab-case, named exports, shadcn/ui components, dark mode classes present
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.P8: Build skill browser in persona editor

**Task:** Add Skills section to persona editor with file browser modal for `.md` files.

**Done:**
- **Backend**: Extended `POST /api/settings/browse-directory` to accept `includeFiles` (boolean) and `fileFilter` (string, e.g. `.md`). Now returns both directories and matching files (dirs first, then files, both sorted). Added `POST /api/settings/read-file` endpoint for previewing file content (first N lines).
- **Frontend API**: Updated `browseDirectory()` to accept options `{ includeFiles, fileFilter }`. Added `readFilePreview()` function and `FilePreview` type. Exported both from `api/index.ts`.
- **`skill-browser.tsx`** (new): Modal dialog with directory/file browser scoped to the project path. Shows `.md` files alongside directories. Click a file to preview (first 20 lines shown in a collapsible pre block). "+" button to add a file as a skill. Already-added files show "Added" badge. Manual path input at top for typing relative paths directly. Breadcrumb navigation, go-up button. Uses `relative()` from new `path-utils.ts` to compute relative paths from project root.
- **`path-utils.ts`** (new): Browser-safe `relative(from, to)` utility for POSIX paths.
- **`persona-detail-panel.tsx`**: Added `skills` state + `skillBrowserOpen` state. Skills synced from persona on load. Skills included in save mutation. New "Skills" section in edit mode between Tools and Budget: shows assigned skills as removable pills (X to remove), "Browse skills..." button opens SkillBrowser modal, disabled with helper text when no project path configured.
- Build passes

**Files created:** `packages/frontend/src/features/persona-manager/skill-browser.tsx`, `packages/frontend/src/lib/path-utils.ts`
**Files modified:** `packages/backend/src/routes/settings.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`, `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`

**Notes:** The SkillBrowser reuses the same browse-directory endpoint pattern as the FolderBrowser in projects-section.tsx but extends it with file listing. The read-file endpoint is minimal — just reads first N lines for preview.

---

## 2026-03-30 — Review: FX.PM3 (approved)

**Reviewed:** Persona detail panel read-only mode fix.
- `editing` state defaults to `false` — panel opens read-only
- Read-only: description text, model colored badge, MarkdownPreview prompt (scrollable, max-h 400px, bordered), MCP tools as secondary badges, SDK tools as outline badges, skills as badge pills, budget with DollarSign
- Edit mode: name Input, description Textarea, avatar picker, model selector cards, SystemPromptEditor, ToolConfiguration, budget Input, Save + Cancel at bottom
- Edit button in header (Pencil + "Edit"), only shown when not editing
- Save: `updateMutation.mutate()` with `onSuccess: () => setEditing(false)`
- Cancel: `syncFromPersona()` then `setEditing(false)`
- `useEffect` keyed on `[persona?.id]` — correct, prevents clearing edits on TanStack Query refetch
- Dark mode, empty state handling, built-in badge all correct
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.PM3: Fix persona side panel read-only mode

**Task:** Panel opens in read-only mode by default, with explicit Edit button to switch to edit mode.

**Done:**
- Added `editing` state (default `false`), resets to `false` when `personaId` changes
- **Read-only mode**: Shows description as text, model as colored badge, system prompt rendered as markdown (scrollable, max-h 400px), MCP tools as secondary badges, SDK tools as outline badges, skills as badge pills, budget with dollar icon. All static display — no inputs.
- **Edit mode**: Name input, description textarea, avatar color/icon pickers, model selector cards, SystemPromptEditor (Write/Preview tabs), ToolConfiguration checkboxes, budget input. Save + Cancel buttons at bottom.
- **Header**: Shows "Edit" button in read-only mode. Save button removed from header (now at bottom of edit content). Close (X) always visible.
- **Save**: Calls `updateMutation.mutate()` with `onSuccess: () => setEditing(false)` — returns to read-only on save.
- **Cancel**: Calls `syncFromPersona()` to reset form state, then `setEditing(false)`.
- Added `MarkdownPreview` import for read-only system prompt rendering.
- Build passes

**Files modified:** `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`

**Notes:** The `useEffect` dependency changed from `[persona]` to `[persona?.id]` to prevent resetting form state on every TanStack Query refetch (which would clear in-progress edits).

---

## 2026-03-30 — Review: FX.P7 (approved)

**Reviewed:** Skills field added to persona schema.
- entities.ts: `skills: string[]` on Persona interface
- api.ts: `skills?: string[]` on Create/Update requests
- schema.ts: JSON text column with `default([])`, consistent with mcpTools pattern
- personas.ts route: serialize, create, update all handle skills
- execution-manager.ts + dashboard.ts: Persona construction includes skills
- Default [] — no migration data issues
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.P7: Add skills field to persona schema

**Task:** Add `skills: string[]` to Persona entity, DB schema, and API contracts.

**Done:**
- **`packages/shared/src/entities.ts`**: Added `skills: string[]` to `Persona` interface (after `mcpTools`)
- **`packages/shared/src/api.ts`**: Added `skills?: string[]` to both `CreatePersonaRequest` and `UpdatePersonaRequest`
- **`packages/backend/src/db/schema.ts`**: Added `skills` column — `text("skills", { mode: "json" }).notNull().$type<string[]>().default([])`
- **`packages/backend/src/routes/personas.ts`**: Added `skills` to serialize, create, and update handlers
- **`packages/backend/src/agent/execution-manager.ts`**: Added `skills` to persona entity construction (line 282)
- **`packages/backend/src/routes/dashboard.ts`**: Added `skills` to serialized persona in active executions response
- **Migration**: Ran `pnpm --filter backend db:push` — schema changes applied
- Build passes (2 TS errors fixed — missing `skills` in Persona object literals)

**Files modified:** `packages/shared/src/entities.ts`, `packages/shared/src/api.ts`, `packages/backend/src/db/schema.ts`, `packages/backend/src/routes/personas.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/routes/dashboard.ts`

**Notes:** Default is `[]` so existing personas get empty skills arrays. No seed changes needed — skills are user-configured per-persona.

---

## 2026-03-30 — Review: FX.PM2 (approved)

**Reviewed:** Persona card expand → side detail panel.
- persona-list.tsx: expand/collapse fully removed, cards clickable with ring selection highlight
- Hover actions use stopPropagation to prevent card selection
- persona-detail-panel.tsx: full editing (identity, avatar, model, prompt, tools, budget), reuses SystemPromptEditor + ToolConfiguration
- Built-in badge via `settings.isSystem`, panel stays open after save
- persona-manager.tsx: split layout 45%/55%, animated transitions, PersonaEditor Sheet removed
- Dark mode, responsive grid (lg:3 cols), proper overflow handling
- Build passes, bundle slightly smaller
- Verdict: **approved**

---

## 2026-03-30 — FX.PM2: Replace persona card expand with side panel

**Task:** Replace inline expand/collapse on persona cards with a click-to-open detail panel.

**Done:**
- **`persona-list.tsx`**: Removed expand/collapse (`isExpanded`, `onToggleExpand`, `expandedId`, `MarkdownPreview` import, `ChevronDown`, `DollarSign`, `Pencil` imports). Cards now clickable for selection (`isSelected` highlight with ring). Removed "View prompt" / "Collapse" button. Removed expanded prompt preview section (~60 lines). Added `selectedId` + `onSelect` props replacing `onEdit`. Cards show: avatar, name, built-in badge, model badge, description (2 lines), tool count. Hover actions: Duplicate + Delete (Edit removed — panel handles it).
- **`persona-detail-panel.tsx`** (new): Right-side panel showing all persona details with inline editing. Sections: Identity (name input, description textarea, avatar picker with color swatches + icon grid), Model (3 selectable cards), System Prompt (Write/Preview tabs via SystemPromptEditor), Tools (ToolConfiguration component), Budget (dollar input). Header: avatar, name, Built-in badge, Save + Close buttons. Scrollable content area with flex layout.
- **`persona-manager.tsx`** (page): Split layout — card grid on left (45% when panel open, 100% when closed), detail panel on right (55%) with border-l separator. Animated width transitions. Removed PersonaEditor Sheet import — panel replaces it entirely.
- Bundle size slightly decreased (1069KB vs 1076KB — unused Sheet/persona-editor no longer imported)
- Build passes

**Files created:** `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`
**Files modified:** `packages/frontend/src/features/persona-manager/persona-list.tsx`, `packages/frontend/src/pages/persona-manager.tsx`

**Notes:** The old `persona-editor.tsx` (Sheet) is still in the codebase but no longer imported by the page. It can be deleted in a cleanup pass. The detail panel reuses SystemPromptEditor and ToolConfiguration from the old editor.

---

## 2026-03-30 — Review: FX.P6 (approved)

**Reviewed:** SDK tool name verification and executor tool wiring fix.
- SDK expects short names (`'Bash'`, `'Read'`, `'Edit'`) — persona arrays already correct
- Critical fix: `tools: []` → `persona.allowedTools` — agents now get SDK built-in tools
- `ALLOWED_TOOLS` env: `options.tools` → `persona.mcpTools` — correct MCP tool names to MCP server
- `router.ts` fallback: `allowedTools: []`, `mcpTools: ROUTER_MCP_TOOLS` with `post_comment`
- SDK tool reference comment: 12 tools documented
- `SpawnOptions.tools` comment clarified
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.P6: Verify SDK tool names and fix executor tool wiring

**Task:** Verify SDK tool name format, fix the executor to pass tools correctly, document available tools.

**Done:**
- **Verified SDK tool names**: The `@anthropic-ai/claude-agent-sdk` `tools` option expects short names (`['Bash', 'Read', 'Edit']`). Our persona `allowedTools` arrays already use the correct format. No renaming needed.
- **Critical bug fixed in `claude-executor.ts`**: SDK's `tools` was hardcoded to `[]` (disables ALL built-in tools). Changed to `persona.allowedTools` so agents actually have Read/Write/Bash/etc. available. This means agents were previously only able to use MCP tools, not SDK built-in tools like file editing.
- **Fixed MCP tools env var**: `ALLOWED_TOOLS` env passed to MCP server was `options.tools` (persona's SDK tool names) instead of `persona.mcpTools` (MCP tool names). Fixed to `persona.mcpTools.join(",")`.
- **Fixed `router.ts` fallback**: Same bug as seed.ts Router — MCP names in `allowedTools`, empty `mcpTools`. Fixed to `allowedTools: []`, `mcpTools: ["route_to_state", "list_items", "get_context", "post_comment"]`.
- **Added SDK tool reference comment**: Documented all available SDK tool names in `claude-executor.ts` (Read, Edit, Write, NotebookEdit, Glob, Grep, Bash, WebFetch, WebSearch, Agent, TodoWrite, AskUserQuestion).
- **Updated `SpawnOptions.tools` comment** to clarify it refers to SDK built-in tools.
- Build passes

**Files modified:** `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/agent/types.ts`, `packages/backend/src/agent/router.ts`

**Notes:** This was a significant functional bug — agents had zero built-in tools available due to `tools: []`. They could only use MCP server tools. Now personas get exactly the SDK tools listed in their `allowedTools` array.

---

## 2026-03-30 — Review: FX.P5 (approved)

**Reviewed:** Router persona audit and overhaul.
- allowedTools: `[]` correct — Router has no SDK tools
- mcpTools: `["route_to_state", "list_items", "get_context", "post_comment"]` — all 4 valid MCP names, `post_comment` added
- Critical bug fixed: allowedTools/mcpTools were swapped (MCP names in SDK field, empty MCP array)
- systemPrompt: 5-step workflow, valid transitions map matching workflow.ts, per-state routing rules
- Correctly deviated from task spec: follows real transition map (Planning → Ready, not Planning → Decomposition)
- Anti-patterns: no code, no loops, no Done without approval
- default-personas.ts updated in sync
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.P5: Audit and overhaul Router persona

**Task:** Fix allowedTools/mcpTools swap, overhaul systemPrompt for Router persona.

**Done:**
- **Critical bug: allowedTools/mcpTools were swapped.** Router had `allowedTools: ["list_items", "get_context", "route_to_state"]` (MCP names in SDK field) and `mcpTools: []` (empty). Fixed to `allowedTools: []` (Router needs no SDK tools) and `mcpTools: ["route_to_state", "list_items", "get_context", "post_comment"]`. Added `post_comment` so Router can explain its decisions.
- **systemPrompt**: Complete overhaul from ~18-line basic guidelines to comprehensive ~60-line prompt. Includes: full valid transitions map from workflow.ts, 5-step workflow (get_context → list_items if children → decide → post_comment → route_to_state), per-state routing rules based on actual transition map, critical rules (never same-state, never skip states, check execution outcome), anti-patterns (no code reading, no long comments, no loops).
- Key difference from task description: the task said "Planning → Decomposition" but the actual transition map has `Planning → [Ready, Blocked]` — Decomposition is reached from Ready. Prompt follows the real transition map.
- Updated both `seed.ts` and `default-personas.ts`
- Build passes

**Files modified:** `packages/backend/src/db/seed.ts`, `packages/backend/src/db/default-personas.ts`

**Notes:** The swapped allowedTools/mcpTools was likely a major contributor to the Router not functioning correctly — it had SDK tool filtering set to MCP tool names, and no MCP tools available at all.

---
