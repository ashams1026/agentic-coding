# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 05:50 PDT — ACH.6: Chat header bar with persona info and context menu

**Done:** Added chat header bar to `/chat` page between sidebar and messages. Shows persona avatar (color+icon), persona name, project badge (projectId or "Global" with globe icon), and editable session title (double-click to rename). Three-dot context menu with Rename and Delete actions. Added `deleteSession()` function to `usePicoChat` hook — deletes session via API, removes from local state, auto-selects most recent remaining session. Imported MoreVertical, Globe, Pencil icons.
**Files:** `packages/frontend/src/pages/chat.tsx`, `packages/frontend/src/hooks/use-pico-chat.ts`

---

## 2026-04-02 05:35 PDT — Review: ACH.5 (approved)

**Reviewed:** Session sidebar enhancements (rework) in chat.tsx + backend chat.ts.
- Persona avatar next to each session ✓
- Date grouping (Today/Yesterday/This Week/Older) ✓
- Persona filter dropdown ✓
- Last message preview: batched SQLite query, 60-char truncation, displayed as second line ✓
- ChatSessionWithPersona type includes lastMessagePreview ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 05:30 PDT — ACH.5 (rework): Add last message preview to session sidebar

**Done:** Addressed review feedback — added `lastMessagePreview` to session list response. Backend: raw SQLite query fetches last message per session in a single batched query (correlated subquery with MAX(created_at)), truncates to 60 chars + "...". Added `sqlite` import from connection.ts. Frontend: added `lastMessagePreview: string | null` to `ChatSessionWithPersona` type. Display preview as second line under session title in sidebar (text-[10px], muted color). Removed unused `inArray` import.
**Files:** `packages/backend/src/routes/chat.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/pages/chat.tsx`

---

## 2026-04-02 05:20 PDT — Review: ACH.5 (rejected)

**Reviewed:** Session sidebar enhancements in `packages/frontend/src/pages/chat.tsx`.
- Persona avatar next to session title ✓
- Date grouping (Today/Yesterday/This Week/Older) ✓
- Persona filter dropdown ✓
- Last message preview (truncated to 60 chars) — **MISSING**
- **Verdict: rejected.** Task explicitly requires showing last message preview under each session title. Feedback provided with implementation approach (backend `lastMessagePreview` field + frontend display).

---

## 2026-04-02 05:15 PDT — ACH.5: Session sidebar enhancements

**Done:** Enhanced `/chat` session sidebar: persona avatar (color+icon) shown next to each session title. Sessions grouped by date (Today, Yesterday, This Week, Older) with section headers. Added persona filter dropdown (shown when 2+ personas used) to filter sessions by persona. Created `ChatSessionWithPersona` extended type in API client to capture persona join data from backend. Updated `usePicoChat` hook to use the extended type. Changed sidebar header from "Pico Chat" to "Chat" for multi-persona consistency. Added icon map and date grouping utilities to chat page.
**Files:** `packages/frontend/src/pages/chat.tsx`, `packages/frontend/src/hooks/use-pico-chat.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`

---

## 2026-04-02 05:00 PDT — Review: ACH.4 (approved)

**Reviewed:** Persona selector grid component and chat page wiring.
- PersonaSelector: avatar cards with color+icon, name, description, model badge ✓
- Pico highlighted (amber ring + "default" label), Router filtered out ✓
- Sorted: Pico first, then alphabetical ✓
- createChatSession() accepts optional personaId ✓
- newSession(personaId?) passes through correctly ✓
- Plus button → modal → onSelect → newSession(personaId) flow ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 04:55 PDT — ACH.4: Persona selector grid for chat

**Done:** Created `packages/frontend/src/features/pico/persona-selector.tsx` — modal grid showing all personas as cards with avatar (color+icon), name, description, and model badge. Pico highlighted as default with amber ring. Router (system-only) persona filtered out. Updated `createChatSession()` API client to accept optional `personaId`. Updated `usePicoChat.newSession()` to accept optional `personaId` and pass it through. Wired Plus button on `/chat` page to open persona selector modal; on selection creates new session with chosen persona.
**Files:** `packages/frontend/src/features/pico/persona-selector.tsx` (new), `packages/frontend/src/pages/chat.tsx`, `packages/frontend/src/hooks/use-pico-chat.ts`, `packages/frontend/src/api/client.ts`

---

## 2026-04-02 04:40 PDT — Review: ACH.3 (approved)

**Reviewed:** Multi-persona chat message endpoint in `packages/backend/src/routes/chat.ts`.
- Persona loading: override → session.personaId → Pico fallback chain ✓
- isPico flag gates pico-skill.md injection and dog-pun personality ✓
- Non-Pico personas get generic chat instructions with their name ✓
- Agent key, model, tools, budget, MCP env all use loaded persona ✓
- Conversation history uses persona name dynamically ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 04:35 PDT — ACH.3: Multi-persona chat message endpoint

**Done:** Updated `POST /api/chat/sessions/:id/messages` to load persona from session's `persona_id` column (fallback chain: override personaId → session personaId → default Pico). Added `isPico` flag based on `settings.isAssistant`. Pico-skill.md and dog-pun personality instructions only injected when `isPico` is true. Non-Pico personas get generic chat instructions with their name. Agent key derived from persona name (lowercased, hyphenated). Conversation history uses persona name instead of hardcoded "Pico". SDK agent definition uses persona's own model, tools, budget, and description.
**Files:** `packages/backend/src/routes/chat.ts`

---

## 2026-04-02 04:25 PDT — Review: ACH.2 (approved)

**Reviewed:** Chat session API updates in `packages/backend/src/routes/chat.ts`.
- POST persists personaId + workItemId into new columns ✓
- GET sessions LEFT JOINs personas, returns `persona: { name, avatar }` per session ✓
- GET messages includes `session` object with persona info alongside data/total ✓
- `and` import added for conditional query building ✓
- Backwards compatible — existing response fields preserved ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 04:20 PDT — ACH.2: Backend chat session API updates

**Done:** Updated `POST /api/chat/sessions` to accept and persist `workItemId` alongside existing `personaId` into the new schema columns. Updated `GET /api/chat/sessions` to LEFT JOIN personas table and return `persona: { name, avatar }` alongside each session. Updated `GET /api/chat/sessions/:id/messages` to include `session` object with persona info in the response. Added `and` to drizzle-orm imports for conditional query building.
**Files:** `packages/backend/src/routes/chat.ts`

---

## 2026-04-02 04:10 PDT — Review: ACH.1 (approved)

**Reviewed:** Chat sessions schema migration.
- 3 new nullable columns (persona_id FK, work_item_id FK, sdk_session_id) in schema.ts ✓
- Drizzle relations for persona + workItem added alongside existing project + messages ✓
- Shared ChatSession interface updated with PersonaId|null, WorkItemId|null, string|null ✓
- serializeSession() casts and null-falls all 3 fields, imports added ✓
- Migration 0011: ALTERs + backfill UPDATE using LIKE '%"isAssistant":true%' ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 04:00 PDT — ACH.1: Schema migration for chat_sessions

**Done:** Added `persona_id` (TEXT FK nullable → personas), `work_item_id` (TEXT FK nullable → work_items), `sdk_session_id` (TEXT nullable) columns to `chat_sessions` table. Updated shared `ChatSession` interface to include new fields. Updated `serializeSession()` in chat routes to serialize new fields. Added Drizzle relations for persona and workItem on chatSessions. Generated migration `0011_tricky_blacklash.sql` with ALTER TABLE statements + backfill UPDATE that sets `persona_id` to the Pico persona for existing sessions.
**Files:** `packages/backend/src/db/schema.ts`, `packages/shared/src/entities.ts`, `packages/backend/src/routes/chat.ts`, `packages/backend/drizzle/0011_tricky_blacklash.sql`, `packages/backend/drizzle/meta/0011_snapshot.json`, `packages/backend/drizzle/meta/_journal.json`

---

## 2026-04-02 03:50 PDT — DECOMPOSE: Sprint 24 — Core UX

**Done:** Decomposed Sprint 24 into 26 tasks across 4 sections: Agent Chat Phase 1 (ACH.1-7), Persona Prompts Phase 1 (PPR.1-4), Notifications UX Phase 1 (NTF.1-8), Testing & Documentation (CUX.TEST.1-5, CUX.DOC.1-2). Read all 6 proposal docs and explored current codebase state (chat, persona editor, notifications, sidebar, WS client, schema). Key findings: chat_sessions lacks persona_id column (API accepts it but doesn't persist), no resolveVariables() exists, no notification bell/drawer exists, toast system exists but is basic. Tasks ordered by dependency: schema first, backend API, then frontend. Rich messages deferred to Phase 2 per roadmap.
**Files:** `TASKS.md`

---

## 2026-04-02 03:40 PDT — Review: FND.DOC.2 (approved)

**Reviewed:** Global Agents data model and API documentation in `docs/api.md`.
- `POST /api/executions/run` — request body, validation rules (400/404), response shape match implementation ✓
- `AgentScope` type matches `entities.ts:34-36` exactly ✓
- Nullable `projectId` on executions + chat_sessions tables correctly documented ✓
- `global_memories` schema — all 6 columns match `schema.ts:282-289` ✓
- Chat session creation updated to show optional `projectId` with nullable ChatSession type ✓
- Scope-awareness rules for Dashboard, Agent Monitor, Work Items, Pico, Activity Feed — corroborated by e2e tests (TC-GA-1-7) ✓
- **Verdict: approved.**

---

## 2026-04-02 03:35 PDT — FND.DOC.2: Document Global Agents data model and API changes

**Done:** Updated `docs/api.md` with Global Agents documentation: added `projectId` query param to List Executions, added full `POST /api/executions/run` standalone execution endpoint (request/response shape, validation rules, curl examples). Updated Chat Create Session to show `projectId` as optional with nullable ChatSession type. Added "Global Agents Data Model" section documenting `AgentScope` type, nullable `projectId` on executions/chat_sessions tables, `global_memories` table schema, and scope-awareness rules for Dashboard, Agent Monitor, Work Items, Pico Chat, and Activity Feed. Updated source files table.
**Files:** `docs/api.md`

---

## 2026-04-02 03:25 PDT — Review: FND.DOC.1 (approved)

**Reviewed:** Work Item Lifecycle API documentation in `docs/api.md`.
- All 6 new endpoints documented with accurate request/response shapes ✓
- List Work Items updated with `includeArchived`/`deleted` query params matching implementation ✓
- 409 guard, 30-day grace period (410 GONE), cascade BFS rules all accurate ✓
- Schema Additions section correctly describes `archived_at`/`deleted_at` columns ✓
- Source files table updated ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 03:10 PDT — FND.DOC.1: Document Work Item Lifecycle API endpoints

**Done:** Updated `docs/api.md` with all Work Item Lifecycle endpoints: archive (single + bulk with cascade), unarchive (single + bulk), restore (with 30-day grace period + 410 GONE), bulk delete (soft delete + 409 guard). Updated List Work Items to document `includeArchived` and `deleted` query params. Updated Delete to reflect soft-delete behavior with 409 guard and cascade rules. Added "Schema Additions" section documenting `archived_at`/`deleted_at` columns and cascade rules. Updated source files table.
**Files:** `docs/api.md`

---

## 2026-04-02 02:55 PDT — Review: FND.TEST.6 (approved)

**Reviewed:** Post-Sprint 23 regression checkpoint results.
- 34/34 test plans evaluated, 24 UI-verified, 10 code-review only ✓
- 19 screenshots with descriptive names covering all major UI areas ✓
- 10 API endpoints verified with correct status codes ✓
- 0 regressions vs 3 prior baselines (Sprint 18, Sprint 19/20, Sprint 23) ✓
- **Verdict: approved.**

---

## 2026-04-02 02:50 PDT — FND.TEST.6: Regression checkpoint post-Sprint 23

**Done:** Executed full regression sweep across all 34 test plans. 24 suites UI-verified via chrome-devtools MCP, 10 code-review only (require live agent). **0 regressions found.** All original Sprint 1-18 suites PASS, Sprint 19-20 features PASS, Sprint 23 features (error recovery, work-item lifecycle, global agents) confirmed. Build compiles clean. 10 API endpoints verified (projects, personas, work-items, executions, executions/run, archive/unarchive, chat sessions). 19 screenshots saved.
**Files:** `tests/e2e/results/2026-04-02_02-35_regression-sprint23/RESULTS.md`, 19 screenshot PNGs

---

## 2026-04-02 02:30 PDT — Review: FND.TEST.5 (approved)

**Reviewed:** Global Agents Phase 1 e2e test execution results.
- 7/7 PASS, no bugs filed ✓
- RESULTS.md with summary table, per-test evidence, API test evidence ✓
- 3 screenshots saved (persistence, new-run modal, Pico scope) ✓
- API validation includes 201 success, 404 bad persona, 400 missing prompt ✓
- **Verdict: approved.**

---

## 2026-04-02 02:20 PDT — FND.TEST.5: Execute Global Agents Phase 1 e2e tests

**Done:** Executed all 7 test cases from `global-agents-phase1.md`. Results: **7/7 PASS**, no bugs filed. TC-GA-1: "All Projects" persists across 3 page navigations. TC-GA-2: aggregated dashboard with Global badge + Projects Overview table. TC-GA-3: Work Items disabled. TC-GA-4: scope filter + New Run button. TC-GA-5: New Run modal with all fields. TC-GA-6: Pico scope/persona dropdowns. TC-GA-7: POST /api/executions/run returns 201, validation 404/400 confirmed.
**Files:** `tests/e2e/results/2026-04-02_02-15_global-agents-phase1/RESULTS.md`, 3 screenshot PNGs

---

## 2026-04-02 02:05 PDT — Review: FND.TEST.4 (approved)

**Reviewed:** Work Item Lifecycle e2e test execution results.
- 9/10 PASS, 1 SKIP (bulk delete — insufficient items, same code path) ✓
- 9 screenshots saved with clear evidence ✓
- Priority validation gap documented honestly as setup issue ✓
- All lifecycle workflows verified: archive, unarchive, delete, bulk, restore, 409, context menu, detail panel ✓
- **Verdict: approved.**

---

## 2026-04-02 02:00 PDT — FND.TEST.4: Execute Work Item Lifecycle e2e tests

**Done:** Executed 10 test cases from `work-item-lifecycle.md`. Results: **9/10 PASS, 1 SKIP** (TC-WIL-6 bulk delete skipped — insufficient items, same code path as TC-WIL-4). No lifecycle bugs filed. Found priority validation gap: API accepts free-text priorities like "high" instead of "p1", causing `ListRow` crash on `priorityConfig` lookup — noted in results but not filed as lifecycle bug. All UI workflows verified: archive/unarchive via context menu, show archived toggle with muted styling, delete with confirmation, bulk archive, recently deleted with restore, detail panel archive/delete.
**Files:** `tests/e2e/results/2026-04-02_01-50_work-item-lifecycle/RESULTS.md`, 9 screenshot PNGs

---

## 2026-04-02 01:45 PDT — Review: FND.TEST.3 (approved)

**Reviewed:** Error Recovery e2e test execution results.
- 8/8 PASS, no bugs filed ✓
- RESULTS.md with summary table, per-test evidence (file+line refs) ✓
- 2 screenshots saved (status bar, agent monitor) ✓
- Limitations documented honestly (connection banner only visible with running agent) ✓
- **Verdict: approved.**

---

## 2026-04-02 01:40 PDT — FND.TEST.3: Execute Error Recovery e2e tests

**Done:** Executed all 8 test cases from `error-recovery-phase1.md`. Results: **8/8 PASS**, no bugs filed. TC-ERR-1: PRAGMAs verified in connection.ts. TC-ERR-2: exponential backoff formula verified in ws-client.ts. TC-ERR-3: error boundaries wrap all 7 pages + app tree. TC-ERR-4: status bar shows "Disconnected" (screenshot saved). TC-ERR-5: connection lost banner code verified in terminal-renderer.tsx. TC-ERR-6: structured error classification in execution-manager.ts. TC-ERR-7: orphan recovery sets "interrupted" status. TC-ERR-8: 3 backup files exist (126KB each, correctly pruned).
**Files:** `tests/e2e/results/2026-04-02_01-35_error-recovery-phase1/RESULTS.md`, `tests/e2e/results/2026-04-02_01-35_error-recovery-phase1/TC-ERR-4_status-bar.png`, `tests/e2e/results/2026-04-02_01-35_error-recovery-phase1/TC-ERR-5_agent-monitor.png`

---

## 2026-04-02 01:30 PDT — Review: FND.TEST.2 (approved)

**Reviewed:** E2E test plan for Work Item Lifecycle.
- All 10 required scenarios present: TC-WIL-1 through TC-WIL-10 ✓
- Logical flow: archive → show archived → unarchive → delete → bulk → settings recovery ✓
- TC-WIL-8 includes code fallback for 409 guard when no running execution available ✓
- Template-compliant with screenshot checkpoints, visual quality, failure criteria ✓
- **Verdict: approved.**

---

## 2026-04-02 01:25 PDT — FND.TEST.2: E2E test plan for Work Item Lifecycle

**Done:** Wrote `tests/e2e/plans/work-item-lifecycle.md` with 10 test cases: TC-WIL-1 (archive disappears from list), TC-WIL-2 (show archived toggle + muted styling), TC-WIL-3 (unarchive restores), TC-WIL-4 (delete with confirmation dialog), TC-WIL-5 (bulk archive), TC-WIL-6 (bulk delete with confirmation), TC-WIL-7 (Recently deleted in Settings with Restore), TC-WIL-8 (409 guard for running executions), TC-WIL-9 (context menu actions), TC-WIL-10 (detail panel archive/delete). All scenarios follow template format with screenshot checkpoints.
**Files:** `tests/e2e/plans/work-item-lifecycle.md` (new)

---

## 2026-04-02 01:15 PDT — Review: FND.TEST.1 (approved)

**Reviewed:** E2E test plan for Error Recovery Phase 1.
- All 8 required scenarios present: TC-ERR-1 through TC-ERR-8 ✓
- Follows template format with screenshot checkpoints ✓
- Backend-internal features (PRAGMA, orphan recovery, backup) tested via code inspection — reasonable approach ✓
- Visual features (status bar, error boundary, connection banner) include screenshot verification ✓
- **Verdict: approved.**

---

## 2026-04-02 01:10 PDT — FND.TEST.1: E2E test plan for Error Recovery Phase 1

**Done:** Wrote `tests/e2e/plans/error-recovery-phase1.md` with 8 test cases: TC-ERR-1 (busy_timeout PRAGMA active), TC-ERR-2 (WS exponential backoff with jitter), TC-ERR-3 (page-level error boundary fallbacks), TC-ERR-4 (status bar tri-state WS indicator), TC-ERR-5 (Agent Monitor "Connection lost" banner), TC-ERR-6 (structured error JSON on failed executions), TC-ERR-7 (orphaned executions → "interrupted" status on restart), TC-ERR-8 (pre-migration SQLite backup with 3-file pruning). Mix of code inspection (backend features hard to trigger in browser) and visual verification steps.
**Files:** `tests/e2e/plans/error-recovery-phase1.md` (new)

---

## 2026-04-02 01:00 PDT — Review: FND.GA.10 (approved)

**Reviewed:** E2E test plan for Global Agents Phase 1.
- All 7 required scenarios present: TC-GA-1 through TC-GA-7 ✓
- Follows template format with screenshot checkpoints ✓
- Steps are specific and actionable with expected values ✓
- TC-GA-7 includes positive + negative validation cases ✓
- Visual Quality and Failure Criteria sections present ✓
- **Verdict: approved.**

---

## 2026-04-02 00:55 PDT — FND.GA.10: E2E test plan for Global Agents Phase 1

**Done:** Wrote `tests/e2e/plans/global-agents-phase1.md` with 7 test cases covering all Global Agents Phase 1 features: TC-GA-1 (selector persistence across navigations), TC-GA-2 (dashboard aggregated view with Global badge and Projects Overview table), TC-GA-3 (Work Items disabled in global scope with tooltip), TC-GA-4 (Agent Monitor scope badges and filter dropdown), TC-GA-5 (New Run modal with persona picker and form validation), TC-GA-6 (Pico scope toggle and persona picker creating fresh sessions), TC-GA-7 (standalone execution endpoint returning 201 with validation). Follows existing test plan template format with screenshot checkpoints and visual quality criteria.
**Files:** `tests/e2e/plans/global-agents-phase1.md` (new)

---

## 2026-04-02 00:45 PDT — Review: FND.GA.9 (approved)

**Reviewed:** Backend nullable projectId in chat sessions + persona override.
- `POST /api/chat/sessions`: both `projectId` and `personaId` optional, empty body → 201 ✓
- Validates project/persona when provided (404) ✓
- `projectId: null` stored for global scope ✓
- `POST /api/chat/sessions/:id/messages`: optional `personaId` overrides default Pico ✓
- Falls back to `isAssistant === true` persona when no override ✓
- `serializeSession` handles nullable projectId ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-02 00:40 PDT — FND.GA.9: Backend nullable projectId in chat sessions + persona override

**Done:** Updated `POST /api/chat/sessions` to accept optional `projectId` and `personaId`. Removed 400 guard for missing projectId — now creates session with `projectId: null` for global scope. Validates project/persona exist when provided (404). Returns 201 instead of 200. Updated `POST /api/chat/sessions/:id/messages` to accept optional `personaId` in body — when provided, loads that persona instead of default Pico for the chat response. Fixed `serializeSession` to handle nullable `projectId` with null coalescing.
**Files:** `packages/backend/src/routes/chat.ts`

---

## 2026-04-02 00:30 PDT — Review: FND.GA.8 (approved)

**Reviewed:** Pico scope toggle and persona picker in chat panel header.
- `scopeOverride` and `selectedPersonaId` in pico-store with proper types and persistence ✓
- Scope dropdown: Follows sidebar / Global / per-project with `__follow__` ↔ null mapping ✓
- Persona dropdown: Pico (default) / other personas with `__pico__` ↔ null mapping ✓
- Both call `newSession()` on change ✓
- Active scope badge when non-default values selected ✓
- Compact 11px styling fits the small panel ✓
- Build passes; visual check confirmed
- **Verdict: approved.**

---

## 2026-04-02 00:25 PDT — FND.GA.8: Pico scope toggle and persona picker

**Done:** Added `scopeOverride` (null = follows sidebar, `"__global__"` = global, or projectId) and `selectedPersonaId` (null = Pico default) to `pico-store.ts`, persisted via zustand. In `chat-panel.tsx` added a compact bar below the header with two Select dropdowns: scope (Follows sidebar / Global / per-project) and persona (Pico / other personas). When either changes, `newSession()` is called to create a fresh session. Active scope badge shown when non-default values are selected. Both dropdowns use 11px text and borderless style to stay compact in the small panel.
**Files:** `packages/frontend/src/features/pico/pico-store.ts`, `packages/frontend/src/features/pico/chat-panel.tsx`

---

## 2026-04-02 00:15 PDT — Review: FND.GA.7 (approved)

**Reviewed:** Backend POST /api/executions/run standalone endpoint.
- Route accepts `{ personaId, prompt, projectId?, budgetUsd? }` with proper validation ✓
- 400 for missing fields, 404 for invalid persona/project ✓
- Creates execution with `workItemId: null`, `status: "pending"`, returns 201 ✓
- Route placement before `:id` routes avoids collision ✓
- Schema: only executions.workItemId made nullable; comments/proposals/memories remain notNull ✓
- Migration `0010_puzzling_micromax.sql`: standard table recreation ✓
- 8 downstream TS fixes: null guards in dashboard, executions, start.ts — all correct ✓
- Build passes
- **Verdict: approved.**

---

## 2026-04-02 00:10 PDT — FND.GA.7: Backend POST /api/executions/run endpoint

**Done:** Added `POST /api/executions/run` route to `executions.ts` accepting `{ personaId, prompt, projectId?, budgetUsd? }`. Validates persona and optional project exist (404 if not). Creates execution with `workItemId = null`, `status: "pending"`, stores prompt in summary. Returns 201 with execution id. Also made `workItemId` nullable in DB schema (removed `.notNull()`) and generated migration `0010_puzzling_micromax.sql`. Fixed 8 downstream TypeScript errors from nullable `workItemId`: dashboard.ts (3 filter guards), executions.ts (filter guard + rewind null check + non-null assertions), start.ts (filter null workItemIds for orphan recovery).
**Files:** `packages/backend/src/routes/executions.ts`, `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0010_puzzling_micromax.sql` (new), `packages/backend/drizzle/meta/*`, `packages/backend/src/routes/dashboard.ts`, `packages/backend/src/start.ts`

---

## 2026-04-02 00:00 PDT — Review: FND.GA.6 (approved)

**Reviewed:** Agent Monitor "New Run" modal.
- Persona picker from `usePersonas()` with real personas list ✓
- Scope selector: Global / Project with conditional project picker ✓
- Prompt textarea + budget input with validation ✓
- `canSubmit` guards: personaId + prompt + valid scope ✓
- Submit calls `runExecution()` via centralized `post()` helper ✓
- Success/error toasts via `useToastStore` ✓
- Form resets on close; `submitting` state prevents double-submit ✓
- Button in tab bar next to scope filter, Live tab only ✓
- Build passes; visual check confirmed modal with all fields + real persona data
- **Verdict: approved.**

---

## 2026-04-01 23:55 PDT — FND.GA.6: Agent Monitor "New Run" modal

**Done:** Created `new-run-modal.tsx` with Dialog containing: persona picker (populated from `usePersonas()`), scope selector (Global / Project with conditional project picker), prompt textarea, budget input. "Start Run" disabled until persona + prompt + valid scope filled. On submit calls `POST /api/executions/run` via new `runExecution()` API function. Shows success/error toast via `useToastStore`. Added `runExecution` + `RunExecutionRequest` type to API client + exports. Wired "+ New Run" button into `agent-monitor-layout.tsx` tab bar next to scope filter (Live tab only).
**Files:** `packages/frontend/src/features/agent-monitor/new-run-modal.tsx` (new), `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`

---

## 2026-04-01 23:40 PDT — Review: FND.GA.5 (approved)

**Reviewed:** Agent Monitor scope badges and filter.
- Scope badge per execution row: violet "Global" for no workItemId, secondary with project name otherwise ✓
- Scope resolved via workItemId → projectId → projectName chain with proper memoization ✓
- Scope filter dropdown in tab bar: All / Global Only / per-project ✓
- Filter hidden on History tab ✓
- `totalRunning` separate from filtered count for accurate badge ✓
- Build passes; visual check confirmed dropdown with all options
- **Verdict: approved.**

---

## 2026-04-01 23:35 PDT — FND.GA.5: Agent Monitor scope badges and filter

**Done:** Added scope badge to each execution row in `active-agent-sidebar.tsx` — shows project name (secondary badge) or "Global" (violet badge) based on whether execution has a workItemId. Added scope filter dropdown in `agent-monitor-layout.tsx` tab bar (right side, Live tab only) with options: All / Global Only / per-project. Filter narrows active executions list. Uses workItemId → projectId lookup via work items for scope determination. Badge and filter hidden on History tab.
**Files:** `packages/frontend/src/features/agent-monitor/active-agent-sidebar.tsx`, `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`
