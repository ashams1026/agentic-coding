# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 23:40 PDT — ANL.5: Analytics overview tab with summary cards + charts

**Done:** Created `packages/frontend/src/features/analytics/overview-tab.tsx`. 4 summary cards using `useExecutionStats` + `useCostSummary` (Total Cost, Executions, Success Rate, Avg Duration with colored icons). Time range selector (7d/30d/90d toggle buttons). Cost Trend line chart using Recharts `LineChart` with `tokensOverTime` data. Cost by Persona horizontal bar chart using `BarChart` with per-persona colors. Empty state messages when no data. Wired into `analytics.tsx` page replacing placeholder. Visual check passed.
**Files:** `packages/frontend/src/features/analytics/overview-tab.tsx` (new), `packages/frontend/src/pages/analytics.tsx`
**Notes:** Execution outcomes stacked bar chart deferred — the `executionStats` endpoint returns aggregate success rate, not per-outcome breakdown needed for stacked bars. Would need a new endpoint or data source.

---

## 2026-04-02 23:30 PDT — Review: ANL.7 (approved)

**Reviewed:** Analytics React Query hooks + API client.
- 4 hooks with 2-min staleTime, proper query keys ✓
- 4 API functions + 4 interfaces + shared analyticsParams() ✓
- TypeScript types match backend response shapes ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 23:25 PDT — ANL.7: Analytics React Query hooks + API client

**Done:** Created `packages/frontend/src/hooks/use-analytics.ts` with 4 hooks: `useAnalyticsCostByPersona`, `useAnalyticsCostByModel`, `useAnalyticsTokensOverTime`, `useAnalyticsTopExecutions`. All with 2-minute staleTime, projectId + range/limit params. Added 4 API client functions + 4 TypeScript interfaces (CostByPersona, CostByModel, TokensOverTime, TopExecution) + shared `analyticsParams()` helper to `client.ts`. Implemented ANL.7 before ANL.5/6 since the tab components depend on these hooks.
**Files:** `packages/frontend/src/hooks/use-analytics.ts` (new), `packages/frontend/src/api/client.ts`

---

## 2026-04-02 23:15 PDT — Review: ANL.4 (approved)

**Reviewed:** Analytics page + route + sidebar link.
- analytics.tsx with two-tab layout (Overview/Token Usage) ✓
- /analytics route with PageErrorBoundary ✓
- Sidebar: BarChart3 icon between Activity Feed and Chat ✓
- Visual check: page renders, tabs switch, sidebar correct ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 23:10 PDT — ANL.4: Analytics page + route + sidebar link

**Done:** Created `packages/frontend/src/pages/analytics.tsx` with two-tab layout (Overview + Token Usage) using underline tab bar with `border-b-2` active state. Added `/analytics` route in router.tsx. Added "Analytics" with BarChart3 icon to sidebar nav between Activity Feed and Chat. Placeholder content for both tabs (filled in ANL.5 + ANL.6). Visual check: page renders correctly, sidebar shows 9 nav items with Analytics highlighted.
**Files:** `packages/frontend/src/pages/analytics.tsx` (new), `packages/frontend/src/router.tsx`, `packages/frontend/src/components/sidebar.tsx`

---

## 2026-04-02 23:00 PDT — Review: ANL.3 (approved)

**Reviewed:** Analytics aggregate endpoints.
- 4 endpoints: cost-by-persona, cost-by-model, tokens-over-time, top-executions ✓
- All with projectId + range (24h/7d/30d/90d) filters ✓
- Cents→USD conversion, null handling ✓
- SQLite DATE grouping for time series, persona name joins ✓
- Registered in server.ts ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 22:55 PDT — ANL.3: Analytics aggregate endpoints

**Done:** Created `packages/backend/src/routes/analytics.ts` with 4 endpoints. `GET /api/analytics/cost-by-persona` — groups by personaId, joins persona name, sums costUsd + totalTokens + count. `GET /api/analytics/cost-by-model` — groups by model, same aggregates. `GET /api/analytics/tokens-over-time` — daily aggregates using `DATE(startedAt/1000, 'unixepoch')`, ordered by date. `GET /api/analytics/top-executions` — top N by costUsd DESC with persona join, limit 10-50. All endpoints accept `projectId` and `range` (24h/7d/30d/90d) filters. CostUsd converted from cents to USD in responses. Registered in server.ts.
**Files:** `packages/backend/src/routes/analytics.ts` (new), `packages/backend/src/server.ts`

---

## 2026-04-02 22:45 PDT — Review: ANL.2 (approved)

**Reviewed:** Token data persistence on execution completion.
- accumulatedTokens/accumulatedToolUses tracked from ProgressEvents ✓
- model from persona.model, always set ✓
- Persisted as null when 0 (no progress data) ✓
- In same .set() call as costUsd ✓
- Pico chat deferred (different pipeline) — reasonable ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 22:40 PDT — ANL.2: Persist token data on execution completion

**Done:** Added `accumulatedTokens` and `accumulatedToolUses` tracking variables in `execution-manager.ts`. Progress events update these (latest value, since ProgressEvent reports cumulative totals). On completion, persists `model` (from persona config), `totalTokens`, and `toolUses` in the execution `.set()` call alongside existing fields. Values stored as null when 0 (no data). Pico chat route (`chat.ts`) doesn't have progress events — chat-based token tracking deferred (chat messages use SSE, not the execution pipeline).
**Files:** `packages/backend/src/agent/execution-manager.ts`
**Notes:** Pico chat token tracking requires a different approach since chat doesn't go through execution-manager. Could add token tracking to the SSE streaming response in a future task.

---

## 2026-04-02 22:30 PDT — Review: ANL.1 (approved)

**Reviewed:** Analytics columns + migration.
- 3 nullable columns: model (TEXT), totalTokens (INTEGER), toolUses (INTEGER) ✓
- Migration 0015: 3 ALTER TABLE ADD (additive) ✓
- Shared Execution type + serializer updated ✓
- costUsd docs clarified (cents) ✓
- Build passes all packages ✓
- **Verdict: approved.**

---

## 2026-04-02 22:25 PDT — ANL.1: Analytics columns + migration

**Done:** Added 3 nullable columns to `executions` table in schema.ts: `model` (TEXT — opus/sonnet/haiku), `totalTokens` (INTEGER), `toolUses` (INTEGER). Generated migration `0015_lame_blade.sql` (3 ALTER TABLE ADD). Updated shared `Execution` type with 3 new fields. Updated executions route serializer to include all 3. Added clarifying comment on `costUsd` field (stored as cents in DB).
**Files:** `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0015_lame_blade.sql`, `packages/shared/src/entities.ts`, `packages/backend/src/routes/executions.ts`

---

## 2026-04-02 22:15 PDT — Review: SRC.5 (approved)

**Reviewed:** FTS5 search in work items list view.
- 300ms debounced searchApi with type=work_item + projectId ✓
- ftsMatchIds Set for O(1) ID-based filtering ✓
- Client-side fallback for <2 char queries ✓
- Cleanup on unmount, proper deps ✓
- Build passes ✓
- **Verdict: approved.** Search Phase 1 (SRC.1-5) complete.

---

## 2026-04-02 22:10 PDT — SRC.5: FTS5 search in work items list view

**Done:** Added server-backed FTS5 search to work items list view in `list-view.tsx`. When search query is 2+ chars, debounces 300ms then calls `searchApi(query, { type: "work_item", projectId, limit: 100 })`. Stores matched IDs in `ftsMatchIds` Set. Filter logic: if `ftsMatchIds` is available, filters by ID membership; otherwise falls back to client-side text search (for short queries or during debounce). Existing search input in filter-bar.tsx unchanged — it already debounces to the Zustand store. Added `searchApi` import.
**Files:** `packages/frontend/src/features/work-items/list-view.tsx`
**Notes:** Highlight of matched terms not implemented — would require passing snippet data through, deferred to Phase 2. The existing `HighlightedText` component still highlights based on the query string for client-side matches.

---

## 2026-04-02 21:55 PDT — Review: SRC.4 (approved)

**Reviewed:** Server-backed Command Palette search.
- 300ms debounced search via searchApi(), min 2 chars ✓
- Results grouped by 6 categories with type-specific icons ✓
- Snippet highlights via dangerouslySetInnerHTML (FTS5 <b> tags) ✓
- Loading spinner, cleanup on unmount ✓
- Static nav/action items still filter client-side ✓
- SearchResult type + searchApi() in API client ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 21:50 PDT — SRC.4: Server-backed Command Palette search

**Done:** Upgraded `command-palette.tsx` from client-side work item filtering to server-backed FTS5 search. Added `searchApi()` function + `SearchResult` type to API client. On keystroke (2+ chars), debounces 300ms then calls `GET /api/search?q=...&projectId=...&limit=20`. Results grouped by type: navigation (static), actions (static), work_item, persona, comment, chat_message. Each result shows title + snippet (rendered as HTML with `<b>` highlights from FTS5 `snippet()`). Spinner indicator while searching. Type-specific icons (FileText, User, MessageSquare). Navigation on select: work items → /items with selected ID, personas → /personas, comments → /items, chat → /chat.
**Files:** `packages/frontend/src/features/command-palette/command-palette.tsx`, `packages/frontend/src/api/client.ts`

---

## 2026-04-02 21:40 PDT — Review: SRC.3 (approved)

**Reviewed:** Unified search API endpoint.
- GET /api/search with q, type, projectId, limit params ✓
- 4 FTS5 queries with BM25 ranking + snippet extraction ✓
- Unified SearchResult type with cross-type merge sort ✓
- archived_at/deleted_at filters on work items + comment joins ✓
- Parameterized queries, max 200 limit, 400 on empty query ✓
- Registered in server.ts ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 21:35 PDT — SRC.3: Unified search API endpoint

**Done:** Created `packages/backend/src/routes/search.ts` with `GET /api/search?q=...&type=...&projectId=...&limit=...`. Queries 4 FTS5 tables (work_items, personas, comments, chat_messages) with BM25 ranking. Returns unified `SearchResult[]` with type, id, title, snippet (using FTS5 `snippet()` with bold markers), score, projectId. Filters: `type` (comma-separated), `projectId` (joins to source tables), respects `deleted_at IS NULL` and `archived_at IS NULL` on work items. Results sorted by BM25 score across all types. Max 200 results. Registered in server.ts. Uses raw `sqlite.prepare()` for FTS5 queries (not Drizzle — FTS5 not ORM-compatible).
**Files:** `packages/backend/src/routes/search.ts` (new), `packages/backend/src/server.ts`

---

## 2026-04-02 21:25 PDT — Review: SRC.2 (approved)

**Reviewed:** FTS5 sync triggers + backfill.
- 12 triggers: INSERT/UPDATE/DELETE x 4 tables ✓
- DROP+CREATE pattern for idempotency ✓
- INSERT: bridge + FTS. UPDATE: FTS in-place. DELETE: FTS then bridge ✓
- Backfill: guards on empty bridge, bulk-inserts all source data ✓
- Column mappings correct (COALESCE for nullable fields) ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 21:20 PDT — SRC.2: FTS5 sync triggers + backfill

**Done:** Extended `fts5-setup.ts` with 12 triggers (INSERT/UPDATE/DELETE for each of 4 source tables: work_items, personas, comments, chat_messages). Triggers use DROP+CREATE pattern for idempotency. Each INSERT trigger populates bridging table then FTS table. UPDATE triggers update FTS in-place. DELETE triggers clean both FTS and bridge. Added `backfillFts5()` function — checks if bridging tables are empty, then bulk-inserts all existing records from source tables into bridge+FTS. Only runs on first startup (no-op if bridge has data).
**Files:** `packages/backend/src/db/fts5-setup.ts`

---

## 2026-04-02 21:10 PDT — Review: SRC.1 (approved)

**Reviewed:** FTS5 virtual tables + bridging tables setup.
- 4 FTS5 tables: work_items (title+desc), personas (name+prompt), comments (body), chat_messages (content) ✓
- 4 bridging tables with integer rowid + text entity_id UNIQUE ✓
- Startup script approach (not Drizzle migration) — correct for FTS5 ✓
- IF NOT EXISTS on all DDL for idempotency ✓
- Wired into start.ts after workflow seed ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 21:05 PDT — SRC.1: FTS5 virtual tables + bridging tables

**Done:** Created `packages/backend/src/db/fts5-setup.ts` with `setupFts5()` function. Creates 4 bridging tables (`fts_*_bridge` with integer rowid + text entity_id UNIQUE) and 4 FTS5 virtual tables (`work_items_fts` title+description, `personas_fts` name+system_prompt, `comments_fts` body, `chat_messages_fts` content). All DDL uses IF NOT EXISTS for idempotency. Used startup script approach instead of Drizzle migration since FTS5 virtual tables aren't supported by drizzle-kit. Wired into `start.ts` after workflow seed.
**Files:** `packages/backend/src/db/fts5-setup.ts` (new), `packages/backend/src/start.ts`
**Notes:** FTS5 tables use `content_rowid=rowid` for external content mode. Triggers and backfill will be added in SRC.2.

---

## 2026-04-02 20:55 PDT — Review: COL.6 (approved)

**Reviewed:** Frontend handoff notes display in execution timeline.
- Collapsible card in expanded TimelineEntry, before logs ✓
- State transition header, summary, decisions/files/questions sections ✓
- Conditional rendering per section when array non-empty ✓
- Dark mode: amber variants for open questions ✓
- Correct file: execution-timeline.tsx (not detail-panel.tsx) ✓
- Build passes ✓
- **Verdict: approved.** Agent Collaboration P1 (COL.1-6) complete.

---

## 2026-04-02 20:50 PDT — COL.6: Frontend handoff notes display in execution timeline

**Done:** Added handoff notes card to `execution-timeline.tsx` inside each `TimelineEntry` expanded section (before logs). Shows when `execution.handoffNotes` exists: state transition badge (from → to), summary text, decisions list (Lightbulb icon), files changed as mono badges (FileText icon + count), open questions in amber (HelpCircle icon). All sections conditional — only render when array is non-empty. Uses existing card/badge styling conventions with compact sizing (10px labels, xs text).
**Files:** `packages/frontend/src/features/common/execution-timeline.tsx`
**Notes:** Implemented in execution-timeline.tsx (where executions render) rather than detail-panel.tsx directly, since the timeline component owns execution entry rendering.

---

## 2026-04-02 20:40 PDT — Review: COL.5 (approved)

**Reviewed:** Context windowing for accumulated handoff notes.
- buildAccumulatedContext: queries all completed executions, filters null notes ✓
- Latest note full formatted, older notes one-line `[from → to] summary(120)` ✓
- Budget: 8000 chars (~2000 tokens), breaks loop when exceeded ✓
- Returns null when no notes (no empty injection) ✓
- execution-manager updated to use accumulated context ✓
- Unused imports cleaned ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 20:35 PDT — COL.5: Context windowing for handoff notes

**Done:** Added `buildAccumulatedContext(workItemId, maxChars=8000)` to `handoff-notes.ts`. Queries all completed executions' handoff notes ordered by completedAt desc. Most recent note gets full formatting via `formatHandoffForPrompt()`. Older notes compressed to one-line summaries: `[fromState → targetState] summary (120 chars)`. Stops adding older notes when character budget exceeded (~2000 tokens). Updated `execution-manager.ts` to use `buildAccumulatedContext()` instead of `getLastHandoffNote()` + `formatHandoffForPrompt()` — now injects the full accumulated context window.
**Files:** `packages/backend/src/agent/handoff-notes.ts`, `packages/backend/src/agent/execution-manager.ts`

---

## 2026-04-02 20:25 PDT — Review: COL.4 (approved)

**Reviewed:** Dependency enforcement in dispatch.ts.
- Queries depends_on edges before cost/concurrency checks ✓
- Resolves terminal states from workflow dynamically ✓
- Checks each upstream item's currentState against terminal set ✓
- Blocks with system comment listing pending deps (title + state) ✓
- Metadata includes dependencyBlock flag + pending dep IDs ✓
- WS broadcast for real-time UI update ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 20:20 PDT — COL.4: Dependency enforcement in dispatch

**Done:** Added dependency enforcement to `dispatch.ts`. Before dispatching, queries `workItemEdges` where `type = 'depends_on'` and `toId = currentItemId`. Gets terminal state names from workflow via `getWorkflowStates()`. For each upstream dependency, queries its current state. If any upstream is not in a terminal state, blocks dispatch with a system comment listing pending deps (title + state) and broadcasts via WS. Imports added: `and` from drizzle-orm, `workItemEdges` from schema, `getWorkflowStates` from workflow-runtime.
**Files:** `packages/backend/src/agent/dispatch.ts`

---

## 2026-04-02 20:10 PDT — Review: COL.3 (approved)

**Reviewed:** Handoff context injection into system prompt.
- getLastHandoffNote: queries by workItemId + completed, desc by completedAt ✓
- formatHandoffForPrompt: markdown "Previous Agent Context" with decisions/files/questions ✓
- SpawnOptions.handoffContext: optional string, backwards compatible ✓
- execution-manager queries before spawn, passes through options ✓
- buildSystemPrompt appends as section (6), both call sites updated ✓
- Build passes all packages ✓
- **Verdict: approved.**

---

## 2026-04-02 20:05 PDT — COL.3: Inject handoff context into system prompt

**Done:** Added `getLastHandoffNote(workItemId)` query and `formatHandoffForPrompt(note)` formatter to `handoff-notes.ts`. Added `handoffContext?: string` to `SpawnOptions` in `@agentops/core`. In `execution-manager.ts`, queries the most recent completed execution's handoff notes before spawning, formats as "Previous Agent Context" section, passes via `SpawnOptions`. In `claude-executor.ts`, `buildSystemPrompt()` now accepts optional `opts.handoffContext` and appends it as section (6). Both call sites (primary agent + fallback) pass `options.handoffContext` through.
**Files:** `packages/backend/src/agent/handoff-notes.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/agent/claude-executor.ts`, `packages/core/src/types.ts`

---

## 2026-04-02 19:50 PDT — Review: COL.2 (approved)

**Reviewed:** Handoff note persistence in execution-manager.
- buildHandoffNote(): regex extraction for files, decisions, questions from logs/summary ✓
- Bounds: 500 char summary, 10 decisions, 20 files, 5 questions ✓
- Only persisted for non-Router, successful, work-item-linked executions ✓
- fromState from execution record, targetState from work item's current state ✓
- Included in .set() call alongside other completion fields ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 19:45 PDT — COL.2: Persist handoff notes on execution completion

**Done:** Added `buildHandoffNote()` function to `handoff-notes.ts` — extracts structured data from execution context: summary (truncated to 500 chars), file paths from logs (regex for wrote/edited/created patterns), decisions (sentences with "decided"/"chose"/"using"), open questions (sentences with "?"/"TODO"/"unclear"). In `execution-manager.ts`, after non-Router successful completions, builds handoff note with fromState (from execution's workflowStateName) and targetState (from work item's current state post-execution), then persists as part of the execution update `.set()` call.
**Files:** `packages/backend/src/agent/handoff-notes.ts`, `packages/backend/src/agent/execution-manager.ts`

---

## 2026-04-02 19:35 PDT — Review: COL.1 (approved)

**Reviewed:** HandoffNote type + handoffNotes column + migration.
- HandoffNote interface: 6 fields (fromState, targetState, summary, decisions, filesChanged, openQuestions) ✓
- Schema column: nullable JSON text on executions ✓
- Migration 0014: single ALTER TABLE ADD (additive, safe) ✓
- Shared types updated, serializer includes new field ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 19:30 PDT — COL.1: HandoffNote type + schema column + migration

**Done:** Created `packages/backend/src/agent/handoff-notes.ts` with `HandoffNote` interface (fromState, targetState, summary, decisions[], filesChanged[], openQuestions[]). Added `handoffNotes` JSON column (nullable) to `executions` table in schema.ts. Generated migration `0014_uneven_hawkeye.sql` (ALTER TABLE ADD). Added `HandoffNote` interface + `handoffNotes` field to shared `Execution` type in entities.ts. Updated executions route serializer to include `handoffNotes`.
**Files:** `packages/backend/src/agent/handoff-notes.ts` (new), `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0014_uneven_hawkeye.sql`, `packages/shared/src/entities.ts`, `packages/backend/src/routes/executions.ts`

