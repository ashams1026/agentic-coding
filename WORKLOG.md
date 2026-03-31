# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-31 — PICO.4: Author Pico's project knowledge skill

**Task:** Create skill file teaching Pico about AgentOps, inject into system prompt.

**Done:**
- Created `packages/backend/src/agent/pico-skill.md` (~526 words, ~700 tokens — well under 1500 limit):
  - What AgentOps is (1 paragraph)
  - All 8 workflow states with descriptions and transition flow
  - 5 workflow personas table (name, role, model)
  - Work item lifecycle (7 steps from creation to completion)
  - Execution history explanation
  - Common user questions (5 Q&A pairs: create item, trigger agent, stuck item, blocked meaning, change persona)
  - Pointer to `docs/` directory for deeper questions
- Updated `packages/backend/src/routes/chat.ts`:
  - Reads `pico-skill.md` at module load time (single read, cached)
  - Injects skill content into Pico's system prompt between personality and project context sections
  - Graceful fallback if skill file missing
- Updated `packages/backend/src/db/seed.ts`:
  - Fixed Pico system prompt: "Triage" → "Backlog" (correct state name)
  - Added docs/ directory instruction to Guidelines section

**Files created:** `packages/backend/src/agent/pico-skill.md`
**Files modified:** `packages/backend/src/routes/chat.ts`, `packages/backend/src/db/seed.ts`

**Notes for next agent:** The skill file is loaded once at module level — no file I/O per request. The `docs/` directory instruction is in both the seed system prompt and the skill file, giving Pico clear guidance to look there.

---

## 2026-03-31 — Review: PICO.3 (approved)

**Reviewed:** Chat streaming endpoint — SSE-based Pico chat via Claude SDK.
- Route: `POST /api/chat/sessions/:id/messages` accepts `{ content }`, validates session + API key.
- User message saved to DB before streaming. Session title auto-generated from first message (40 char truncation).
- Pico persona loaded by `isAssistant` flag — consistent with PICO.1 pattern.
- System prompt: 3 sections (personality + project context + chat instructions). Conversation history assembled from all messages.
- SDK integration: `query()` with `agents`/`agent` pattern matching `claude-executor.ts`. MCP server path `../agent/mcp-server.ts` resolves correctly from `routes/`.
- SSE: correct headers (`text/event-stream`, `no-cache`, `keep-alive`), 6 event types (text, thinking, tool_use, tool_result, error, done).
- Assistant message saved with metadata (thinking blocks, tool calls, cost/duration) on completion.
- `maxBudgetPerRun` passed as dollars (correct — matches executor, not stored as cents).
- Build passes.
- Verdict: **approved**

---

## 2026-03-31 — PICO.3: Create chat streaming endpoint

**Task:** Add `POST /api/chat/sessions/:id/messages` — streaming endpoint for Pico chat.

**Done:**
- Added streaming endpoint to `packages/backend/src/routes/chat.ts`:
  - Accepts `{ content: string }`, validates session exists and API key is configured
  - Saves user message to DB immediately
  - Auto-generates session title from first user message (truncated to 40 chars)
  - Loads Pico persona (found by `isAssistant` flag) and project context
  - Assembles full conversation history as prompt for the SDK
  - Builds Pico system prompt: personality + project context + chat instructions
  - Spawns Claude via `query()` with Pico's tools (Read, Glob, Grep, WebSearch) and MCP server (list_items, get_context, post_comment)
  - Streams response via SSE: `text`, `thinking`, `tool_use`, `tool_result`, `error`, `done` event types
  - On completion, saves full assistant message with metadata (thinking blocks, tool calls, cost, duration) to DB
  - Sends final `done` event with `messageId` for the frontend to reference
- SDK integration: uses `AgentDefinition` + `query()` with `agents` pattern matching existing executor pattern
- Model mapping reused (opus/sonnet/haiku → full model IDs)

**Files modified:** `packages/backend/src/routes/chat.ts`

**Notes for next agent:** The SSE format is: `data: {"type":"text","content":"..."}\n\n`. Frontend (PICO.8) should use `EventSource` or fetch with streaming to consume these events. The `done` event signals stream completion. Error events include the error message in `content`. Session title auto-update happens on first message only.

---

## 2026-03-31 — Review: PICO.2 (approved)

**Reviewed:** Chat session API — routes, schema, shared types, server registration.
- 4 endpoints match spec: create, list (desc by updatedAt), get messages (asc by createdAt), delete (manual cascade + session delete).
- Schema: `chat_sessions` (5 cols, FK to projects), `chat_messages` (6 cols, FK with onDelete cascade, JSON metadata). Relations defined.
- Shared: `ChatSessionId` (`cs-`), `ChatMessageId` (`msg-`), entities + role type. Barrel exported.
- Serializers follow established pattern (toIso timestamps, typed IDs).
- Title defaults to "New chat" — auto-generation from first message deferred to PICO.3 (reasonable separation).
- Migration generated. Build passes.
- Verdict: **approved**

---

## 2026-03-31 — PICO.2: Create chat session API

**Task:** Add chat session DB tables and CRUD routes for Pico chat.

**Done:**
- `shared/ids.ts`: Added `ChatSessionId` (`cs-` prefix) and `ChatMessageId` (`msg-` prefix) types + `createId.chatSession()` / `createId.chatMessage()` factories.
- `shared/entities.ts`: Added `ChatSession` and `ChatMessage` interfaces, `ChatMessageRole` type.
- `backend/db/schema.ts`: Added `chatSessions` table (id, projectId, title, createdAt, updatedAt) and `chatMessages` table (id, sessionId, role, content, metadata JSON, createdAt). Messages cascade delete with session. Relations defined.
- `backend/routes/chat.ts`: Four endpoints:
  - `POST /api/chat/sessions` — create session with projectId
  - `GET /api/chat/sessions?projectId=` — list sessions (most recent first)
  - `GET /api/chat/sessions/:id/messages` — get message history
  - `DELETE /api/chat/sessions/:id` — delete session + messages
- `backend/server.ts`: Registered `chatRoutes`.
- Drizzle migration generated (`0002_military_shotgun.sql`).

**Files created:** `packages/backend/src/routes/chat.ts`, `packages/backend/drizzle/0002_military_shotgun.sql`
**Files modified:** `packages/shared/src/ids.ts`, `packages/shared/src/entities.ts`, `packages/backend/src/db/schema.ts`, `packages/backend/src/server.ts`

---

## 2026-03-31 — Review: PICO.1 (approved)

**Reviewed:** Pico built-in assistant persona across 6 files.
- `PersonaSettings` interface: `isSystem?`, `isAssistant?`, plus index signature for backward compat. `Persona.settings` typed to `PersonaSettings`. Clean.
- Seed data: `id: "ps-pico"`, amber `#f59e0b`, dog icon, sonnet, $5 budget, `{ isSystem: true, isAssistant: true }`. System prompt covers personality, knowledge, capabilities, and guidelines — good tone, not overdone.
- Default personas: Pico added to array, settings ternary `Router → isSystem` / `Pico → isSystem+isAssistant` / else `{}`. Correct.
- Detail panel: "Built-in assistant" subtitle, amber "Assistant" badge (distinct from blue "Built-in"), Edit button hidden via `!isAssistant`. Correct.
- Persona list: `isAssistant` prop, delete/duplicate conditionally hidden. Correct.
- Workflow config: `personas.filter((p) => !p.settings?.isAssistant)` — Pico excluded from assignment dropdowns. Correct.
- Build passes.
- Verdict: **approved**

---

## 2026-03-31 — PICO.1: Add Pico as built-in system persona

**Task:** Add Pico (dog-persona AI assistant) as a built-in, non-editable, non-deletable persona with `isAssistant` flag.

**Done:**
- `entities.ts`: Added `PersonaSettings` interface with `isSystem?` and `isAssistant?` fields. Changed `Persona.settings` from `Record<string, unknown>` to `PersonaSettings`.
- `seed.ts`: Added Pico persona (`id: "ps-pico"`, amber color, dog icon, sonnet model, $5 budget). Full system prompt establishing personality (friendly, dog-themed, technically accurate), knowledge (AgentOps architecture, workflow, personas), and capabilities (Read/Glob/Grep + MCP tools).
- `default-personas.ts`: Added Pico to `BUILT_IN_PERSONAS` array with `{ isSystem: true, isAssistant: true }` settings.
- `persona-detail-panel.tsx`: Assistant personas show "Built-in assistant" subtitle + amber "Assistant" badge. Edit button hidden for assistants.
- `persona-list.tsx`: Added `isAssistant` prop to `PersonaCard`. Delete/duplicate buttons hidden for assistant personas.
- `workflow-config-section.tsx`: Filtered assistant personas from state assignment dropdowns.

**Files modified:** `packages/shared/src/entities.ts`, `packages/backend/src/db/seed.ts`, `packages/backend/src/db/default-personas.ts`, `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`, `packages/frontend/src/features/persona-manager/persona-list.tsx`, `packages/frontend/src/features/settings/workflow-config-section.tsx`

---

## 2026-03-31 — Review: FX.9 (approved)

**Reviewed:** Activity feed enrichment in `activity-feed.tsx`.
- Base events: lookup maps from `useWorkItems`/`usePersonas` resolve persona names and work item titles. Graceful fallbacks (`"Agent"`, `"work item"`) when data not yet loaded. `targetLabel` also enriched.
- WS events: `wsEventToActivity` accepts `LookupMaps`, consistent format. `AgentStartedEvent` prefers `e.workItemTitle` then falls back to map lookup — good.
- Ref pattern in `useLiveActivityEvents`: `mapsRef.current = maps` avoids WS resubscription. Correct.
- Duplicate `useWorkItems`/`usePersonas` between `useBaseActivityEvents` and `ActivityFeed` is fine — TanStack Query deduplicates.
- All 5 event formats match task spec. Build passes.
- Verdict: **approved**

---

## 2026-03-31 — FX.9: Enrich activity feed event descriptions

**Task:** Replace generic "Agent started working on work item" descriptions with enriched ones using persona names and work item titles.

**Done:**
- `useBaseActivityEvents()`: Added `useWorkItems` and `usePersonas` queries. Built lookup maps (`itemMap`, `personaMap`) for name resolution. All event descriptions now use `[Persona Name] started work on [Work Item Title]` format. `targetLabel` also enriched from "work item" to actual title.
- `wsEventToActivity()`: Refactored to accept `LookupMaps` param. All live WS events now use same enriched format: `"Engineer started work on Implement auth"`, `"Router moved Login Feature from Triage to Implementing"`, etc.
- `useLiveActivityEvents()`: Accepts maps param, uses ref to avoid re-subscribing on map changes.
- `ActivityFeed()`: Builds shared `personaMap` and `itemTitleMap`, passes to both base and live event hooks.

**Enriched formats:**
- Agent started: `"[Persona] started work on [Title]"`
- Agent completed: `"[Persona] completed work on [Title] ($X.XX)"`
- Agent failed: `"[Persona] work rejected on [Title]"`
- State change: `"[Title] moved from [Old] to [New]"`
- Proposal: `"New [type] proposal for [Title]"`

**Files modified:** `packages/frontend/src/features/activity-feed/activity-feed.tsx`

---

## 2026-03-31 — Review: FX.EDIT1 (approved)

**Reviewed:** Optimistic list cache update in `use-work-items.ts`.
- `setQueriesData<WorkItem[]>({ queryKey: ["workItems"] }, ...)`: correctly updates all list query variants (any parentId/projectId combo) via prefix matching. The `old?.map()` callback safely maps over arrays and returns undefined for non-array entries (single-item queries also matched by prefix — harmless, TanQuery treats undefined as no-op).
- List queries cancelled before optimistic update — prevents stale refetch from overwriting.
- Error rollback: single-item reverted from context, lists invalidated to refetch truth. Correct approach.
- `onSettled` still invalidates both — ensures server data replaces optimistic data after mutation completes.
- Build passes.
- Verdict: **approved**

---

## 2026-03-31 — FX.EDIT1: Fix list row not updating when title edited

**Task:** List row showed old title after editing in detail panel. Panel updated immediately (optimistic) but list waited for refetch.

**Root cause:** `useUpdateWorkItem()`'s `onMutate` only optimistically updated the single-item cache (`["workItems", id]`). The list query (`["workItems", { parentId, projectId }]`) was only invalidated in `onSettled`, requiring a full refetch before updating.

**Fix:** In `onMutate`, added `queryClient.setQueriesData<WorkItem[]>({ queryKey: ["workItems"] }, ...)` to optimistically update ALL list queries containing the modified item. Also cancel list queries before optimistic update. On error, revert by invalidating list queries (forces refetch of server state).

**Files modified:** `packages/frontend/src/hooks/use-work-items.ts`

**Notes:** This pattern (optimistically updating both single-item and list caches) should be used for any mutation that affects items visible in list views. The `setQueriesData` with prefix `["workItems"]` matches all list variants regardless of filter params.

---

## 2026-03-31 — Review: FX.CMD1 (approved)

**Reviewed:** Command palette navigation fixes in `command-palette.tsx`.
- Work item selection: `setSelectedItemId(wi.id)` → `navigate("/items")` — correct pattern matching how the work items page reads selection from Zustand store. Detail panel will open for the selected item.
- `useWorkItemsStore` selector `(s) => s.setSelectedItemId` — stable ref, no unnecessary re-renders.
- NAV_ITEMS: all paths match actual routes. Stale "Story Board"/"/board" and non-existent "Workflow Designer" removed.
- ACTION_ITEMS: "Create work item" → "/items" — correct.
- Icons: `ListTodo` matches sidebar for Work Items. Unused imports removed.
- Build passes.
- Verdict: **approved**

---

## 2026-03-31 — FX.CMD1: Fix command palette work item navigation

**Task:** Clicking a work item in command palette navigated to `/work-items/:id` (404). Also had stale "Story Board" / `/board` references.

**Done:**
- Work item `onSelect`: now calls `setSelectedItemId(wi.id)` on the Zustand store before navigating to `/items` — opens the detail panel for that item
- NAV_ITEMS: "Story Board" → "Work Items", `/board` → `/items`, removed stale "Workflow Designer" entry
- ACTION_ITEMS: "Create story" → "Create work item", `/board` → `/items`
- Icons: `Kanban` → `ListTodo` for Work Items (matches sidebar), removed unused `GitBranch`/`Kanban` imports
- Added `useWorkItemsStore` import and `setSelectedItemId` to useMemo deps

**Files modified:** `packages/frontend/src/features/command-palette/command-palette.tsx`

**Notes:** There are still stale `/board` references in `empty-states.tsx` (3) and `use-toast-events.ts` (1). These are separate from the command palette and should get their own cleanup task.

---

## 2026-03-31 — Review: FX.AM1 (approved)

**Reviewed:** Agent monitor empty state button fix in `agent-monitor-layout.tsx`.
- Link target: `/board` → `/items` — correct route for Work Items page.
- Button text: "Go to Story Board" → "Go to Work Items" — matches the rename.
- Minimal 2-line change, no side effects. Build passes.
- Verdict: **approved**

---

## 2026-03-31 — FX.AM1: Fix agent monitor empty state button

**Task:** Change stale "Go to Story Board" button (links to `/board` — 404) to "Go to Work Items" linking to `/items`.

**Done:** Updated `agent-monitor-layout.tsx` line 30-31: `to="/board"` → `to="/items"`, "Go to Story Board" → "Go to Work Items".

**Files modified:** `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`

**Notes:** Found additional stale `/board` and "Story Board" references in: `command-palette.tsx` (2 entries), `empty-states.tsx` (3 entries), `use-toast-events.ts` (1 entry). These are separate bugs — not part of this task. The command palette is partially covered by FX.CMD1 but that task focuses on `/work-items/:id` navigation, not the `/board` reference. Consider adding a sweep task for remaining `/board` routes.

---

## 2026-03-31 — Review: FX.NAV2 (approved)

**Reviewed:** Sidebar navigation ground-up fix in `sidebar.tsx` and `index.css`.
- NavLink→Link swap with manual `isActive`: correct fix for Radix `asChild` incompatibility. `location.pathname === "/"` for exact match on Dashboard, `startsWith(to)` for all others — matches React Router's NavLink `end` behavior.
- `@layer base` wrapper on global `* { border-color }`: correct fix. Un-layered styles beat all `@layer` rules in CSS cascade. Wrapping in `@layer base` lets `@layer utilities` override it. No side effects — other borders still get the default from base, utilities still override when needed.
- `flex flex-col gap-1` on nav: better than `space-y-1` for explicit vertical stacking. `w-full` on links ensures no horizontal wrapping.
- All 8 task requirements met (20px icons, 224px width, hover/active states, rounded-md, badges, spacing, screenshot verification).
- Build passes.
- Verdict: **approved**

---

## 2026-03-31 — FX.NAV2: Redo sidebar navigation fix

**Task:** Ground-up fix for sidebar nav — icons stacked above labels, no hover/active states due to Radix `asChild` incompatibility with React Router's function-based `className`.

**Root causes found & fixed:**
1. **NavLink + Radix `asChild` incompatibility**: Radix's `Slot` component stringified React Router NavLink's function-based `className` prop instead of calling it, resulting in the literal function source code as the CSS class. Fix: replaced `NavLink` with `Link` + manual `isActive` computation using `useLocation()`.
2. **Global `* { border-color }` outside `@layer`**: Un-layered `* { border-color: hsl(var(--border)) }` in `index.css` had higher cascade priority than all `@layer utilities` rules, preventing any Tailwind border-color utility from working. Fix: wrapped in `@layer base {}`.
3. **Nav items not stacking**: Changed `<nav>` from `space-y-1` to `flex flex-col gap-1` with `w-full` on each link.
4. **Sidebar width**: Changed from 16rem (256px) to 14rem (224px) per task spec.
5. **Visual polish**: `rounded-md`, `hover:bg-muted`, `transition-colors duration-150`, 3px primary left border on active, `h-5 w-5` icons (20px).

**Files modified:** `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/index.css`

**Also in this commit:** Marked FX.SDK3-6 as blocked (depend on FX.SDK1's GET /api/sdk/capabilities endpoint).

**Verified:** Screenshots confirm icons inline with labels, active state (muted bg + dark left border + bold), hover state, collapsed mode, navigation switching active state correctly. Build passes.

---

## 2026-03-30 — Review: FX.SDK2 (approved)

**Reviewed:** SDK-native skill injection in `packages/backend/src/agent/claude-executor.ts`.
- `buildSystemPrompt()`: Section (5) "Persona skills" cleanly removed, sections renumbered (5→execution history). No dead code.
- Removed imports: `readFileSync`, `join`/`basename`, `logger` — all only used in removed section. Clean.
- `AgentDefinition` type imported from SDK — correct named export.
- Agent/agents pattern: `persona.id` as agent name, `AgentDefinition` includes `description`, `prompt`, `tools`, `model`, `maxTurns: 30`. Skills conditional spread: only added when non-empty. Clean.
- Top-level `query()` options: `agent` + `agents` properly wired. No duplication of `systemPrompt`/`model`/`tools` between levels. Process-level options (`permissionMode`, `mcpServers`, etc.) stay top-level. Correct.
- SDK's `skills` is on `AgentDefinition`, not top-level `Options` — `agent`/`agents` pattern is the correct approach.
- No migration needed: all existing skill values are `[]`.
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.SDK2: Replace custom skill injection with SDK native skills

**Task:** Remove manual skill file reading from `buildSystemPrompt()` and use the SDK's native `AgentDefinition.skills` field instead.

**Done:**
- **`claude-executor.ts`**: Removed section (5) "Persona skills" from `buildSystemPrompt()` — the manual `readFileSync` + 8K char cap logic that read `.md` files from disk and injected them into the system prompt
- Removed unused imports: `readFileSync` from `node:fs`, `join`/`basename` from `node:path`, `logger` from `../logger.js`
- Restructured `query()` call to use the `agent`/`agents` pattern: persona is defined as a named `AgentDefinition` with `description`, `prompt`, `tools`, `model`, `maxTurns`, and `skills`. The top-level `agent` option tells the SDK to use this definition as the main thread agent.
- When `persona.skills` is non-empty, the skill names are passed via `AgentDefinition.skills` — the SDK handles loading, tokenization, and context management natively
- Added `AgentDefinition` type import from the SDK
- No DB migration needed — all existing persona `skills` values are already `[]` (empty arrays)
- Build passes

**Files modified:** `packages/backend/src/agent/claude-executor.ts`

**Notes:** The SDK's `skills` field is on `AgentDefinition`, not top-level `Options`. Using the `agent`/`agents` pattern is the correct way to pass skills. Skills are now expected to be SDK skill names (e.g., `"commit"`, `"review-pr"`) not file paths. The frontend skill browser (FX.SDK4) will need updating to reflect this — currently it's a file browser for `.md` files. MCP servers remain at the top-level `Options` since they're process-wide configuration.

---

## 2026-03-30 — Review: FX.DEV1 (approved)

**Reviewed:** Dev server deduplication script `scripts/dev.sh` and root `package.json` changes.
- `check_backend()`: `curl -sf` to `/api/health` — silent, fails on HTTP errors, `/dev/null` redirect. Correct.
- `check_frontend()`: checks both 5173 and 5174 with `||` — handles Vite port fallback. Correct.
- Four-branch logic: both need starting (parallel `pnpm -r dev`), backend-only, frontend-only, none (exit 0). All cases covered.
- `pnpm --filter backend dev` / `pnpm --filter frontend dev` — correct pnpm filter syntax for individual starts.
- Script is executable (`-rwxr-xr-x`). `set -e` for fail-fast. Clear user messages with checkmarks.
- Root `package.json`: `"dev"` → `./scripts/dev.sh`, `"dev:force"` → unconditional parallel start. Good escape hatch.
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.DEV1: Skip server start if already running

**Task:** Create a wrapper script that checks ports before starting dev servers to prevent duplicates.

**Done:**
- Created `scripts/dev.sh`: checks backend (port 3001 via `/api/health`) and frontend (ports 5173/5174 via curl) before starting. Skips services already running. Only starts what's needed.
- `check_backend()`: curls `http://localhost:3001/api/health` — `tsx watch` has hot reload, no restart needed
- `check_frontend()`: curls 5173 or 5174 — Vite HMR handles file changes, no restart needed
- Four cases: both need starting (parallel `pnpm -r dev`), backend only, frontend only, none (exit 0)
- Updated root `package.json`: `"dev"` now runs `./scripts/dev.sh`. Added `"dev:force"` for unconditional parallel start.
- `chmod +x` on the script
- Build passes

**Files created:** `scripts/dev.sh`
**Files modified:** `package.json`

**Notes:** Also marked FX.SDK1 as blocked — SDK discovery APIs (`initializationResult`, `supportedAgents`, `reloadPlugins`) are control methods on the `Query` interface requiring a live streaming session + API key. Can't be called standalone.

---

## 2026-03-30 — Review: FX.DB4 (approved)

**Reviewed:** Executor toggle in Settings across backend and frontend.
- `execution-manager.ts`: `runtimeOverride` + `setExecutorMode()` — guards against production, recreates executor singleton. Priority chain: test→mock, prod→claude, dev→runtime→env→default. `let executor` allows reassignment. Clean.
- `settings.ts`: GET returns `{ mode, isProduction }`. PUT validates mode, returns 403 in prod, calls `setExecutorMode()`. Correct REST patterns.
- `api/client.ts`: `ExecutorModeResponse` interface, `getExecutorMode()` and `setExecutorMode()` functions. Correctly typed.
- `api/index.ts`: Both functions exported.
- `api-keys-section.tsx`: `ExecutorModeSection` placed between API Key and Concurrency. Two-button toggle: "Claude API (real)" (primary highlight) / "Simulated (no API calls)" (amber highlight). Hidden when `isProduction`. Loading skeleton. Disabled while saving. Amber warning when mock active. `useHealth` sync keeps toggle consistent with status bar badge.
- Description matches task spec verbatim: "Simulated mode runs fake agent executions..."
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.DB4: Add executor toggle to Settings

**Task:** Add an executor mode toggle in the Settings page, hidden in production.

**Done:**
- **`execution-manager.ts`**: Added `runtimeOverride` variable + `setExecutorMode(mode)` export. When called, updates the override and recreates the executor singleton. No-op in production. `getExecutorMode()` now checks: test→mock, prod→claude, dev→runtime override → env var → default.
- **`settings.ts`**: Added `GET /api/settings/executor-mode` (returns `{ mode, isProduction }`) and `PUT /api/settings/executor-mode` (accepts `{ mode }`, returns 403 in production, validates mode string).
- **`api/client.ts`**: Added `ExecutorModeResponse` interface, `getExecutorMode()` and `setExecutorMode()` API functions.
- **`api/index.ts`**: Exported `getExecutorMode` and `setExecutorMode`.
- **`api-keys-section.tsx`**: Added `ExecutorModeSection` component between API Key and Concurrency. Two toggle buttons: "Claude API (real)" with primary highlight and "Simulated (no API calls)" with amber highlight. Hidden in production (`isProduction` from backend). Shows amber warning text when mock mode is active. Syncs state from health check. Loading skeleton while fetching.
- Build passes

**Files modified:** `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/routes/settings.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`, `packages/frontend/src/features/settings/api-keys-section.tsx`

**Notes:** The executor is swappable at runtime in dev mode — `setExecutorMode()` recreates the singleton. The toggle syncs with the health endpoint's `executor` field so status bar badge stays consistent. Production mode returns 403 on the PUT route and hides the toggle UI.

---

## 2026-03-30 — Review: FX.DB3 (approved)

**Reviewed:** Executor selection by environment across backend and frontend.
- `getExecutorMode()`: clean priority chain — test→"mock", production→"claude", dev→`AGENTOPS_EXECUTOR` override or default "claude". Pure function, safe for re-use in server.ts.
- `createExecutor()`: factory creates singleton, logs choice. Pattern preserved from original.
- `/api/health` response: `executor` field added alongside existing fields. Correct.
- `fetchHealth()`: separate from shared `get()` helper — no toast on health failures, appropriate.
- `useHealth()`: 30s refetch, `retry: false` — correct, avoids hammering a down server.
- `HealthResponse` interface: matches backend shape exactly (status, uptime, activeExecutions, executor, version).
- Status bar: `isHealthy = health?.status === "ok"` replaces `true` TODO. `executorMode === "mock"` shows amber "Simulated" badge. Consistent amber styling with auto-routing paused state.
- Minor cosmetic: line 110 has `/ Dev:` instead of `// Dev:` — missing slash in comment, not a bug.
- All imports clean, no dead code.
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.DB3: Wire executor selection by environment

**Task:** Select executor (Claude vs Mock) based on NODE_ENV and config. Add executor mode to health endpoint. Show "Simulated" badge in frontend.

**Done:**
- **`execution-manager.ts`**: Replaced `const executor = new ClaudeExecutor()` with `createExecutor()` function. Added `getExecutorMode()` (exported): test → "mock", production → "claude", dev → checks `AGENTOPS_EXECUTOR` env var ("mock" or default "claude"). Logs which executor is selected at startup.
- **`server.ts`**: Added `executor: getExecutorMode()` to `/api/health` response. Imported `getExecutorMode` from execution-manager.
- **`api/client.ts`**: Added `HealthResponse` interface and `fetchHealth()` function hitting `/api/health`.
- **`hooks/use-health.ts`** (new): `useHealth()` TanStack Query hook with 30s refetch interval, `retry: false`.
- **`hooks/index.ts`**: Exported `useHealth`.
- **`status-bar.tsx`**: Wired real health check (replaced `isHealthy = true` TODO). Added "Simulated" badge (amber background) shown only when `executorMode === "mock"`. Badge appears next to the health indicator so users know agents aren't real.
- Build passes

**Files created:** `packages/frontend/src/hooks/use-health.ts`
**Files modified:** `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/server.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/hooks/index.ts`, `packages/frontend/src/components/status-bar.tsx`

**Notes:** The `AGENTOPS_EXECUTOR=mock` env var override only works in dev mode. Production always uses Claude. Test always uses mock. The status bar health check also wires up the previously TODO'd `isHealthy` state.

---

## 2026-03-30 — Review: FX.DB2 (approved)

**Reviewed:** Mock executor in `packages/backend/src/agent/mock-executor.ts`.
- `implements AgentExecutor` — correct interface, `spawn()` returns `AsyncIterable<AgentEvent>` with matching signature
- 6 events in sequence: thinking → text → tool_use (post_comment) → tool_result → text → result. All match discriminated union types from `types.ts`.
- `post_comment` tool_use includes `workItemId` and descriptive content — will trigger MCP handler, exercises full pipeline
- `costUsd: 0`, `durationMs` tracks real elapsed time. `outcome: "success"`. Correct.
- `stepDelay = max(200, delayMs / 5)` — 200ms floor prevents zero delays. Default 2000ms → ~2s total. Correct.
- `MockExecutorOptions` with optional `delayMs` — clean API for tests to override
- Unused params `_persona`, `_project`, `_options` — TS strict satisfied
- No external dependencies beyond types. No API calls. Clean.
- Build passes
- Verdict: **approved**

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
