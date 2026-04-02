# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-03 14:15 PDT — Review: FX.TYPE.1 (approved)

**Reviewed:** Double type cast removal in chat routes.
- Both `as unknown as Project` and `as unknown as Persona` casts removed from chat.ts ✓
- `VariableContextOptions` widened to minimal structural shapes matching actual field access ✓
- claude-executor.ts (other caller) passes shared types — still compiles as supersets ✓
- Unused `import type { Persona, Project }` removed from prompt-variables.ts ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 14:10 PDT — FX.TYPE.1: Fix unsafe double type casts in chat routes

**Done:** Widened `VariableContextOptions` in `prompt-variables.ts` to accept minimal shapes (`{ name, path, settings }` for project, `{ name, description, model }` for persona) instead of requiring the full shared `Project`/`Persona` types. Removed the `import type { Persona, Project }` from prompt-variables.ts. Removed the double casts (`as unknown as Project`, `as unknown as Persona`) from `chat.ts` — Drizzle rows now satisfy the interface directly.
**Files:** `packages/backend/src/agent/prompt-variables.ts`, `packages/backend/src/routes/chat.ts`

---

## 2026-04-03 14:00 PDT — Review: FX.HIST.1 (approved)

**Reviewed:** Agent Monitor history table row fix.
- `<Collapsible>` removed, no remaining references ✓
- `<>` fragment returns `<TableRow>` (main) + conditional `<TableRow>` (expanded) — valid HTML ✓
- Raw `<tr>/<td>` replaced with `<TableRow>/<TableCell colSpan={7}>` ✓
- `onClick={onToggle}` on main row replaces CollapsibleTrigger ✓
- Expanded content (RouterDecisionCard, TerminalRenderer, SubagentCard) preserved ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 13:55 PDT — FX.HIST.1: Fix Agent Monitor history table row misalignment

**Done:** Replaced Radix `<Collapsible>` wrapper in `HistoryRow` with plain conditional rendering. The Collapsible rendered a `<div>` inside `<tbody>` (invalid HTML), breaking table column alignment. Now: `<TableRow onClick={onToggle}>` for the main row + `{isExpanded && <TableRow>...</TableRow>}` for the expanded content. Replaced raw `<tr>/<td>` with `<TableRow>/<TableCell>`. Removed unused Collapsible imports.
**Files:** `packages/frontend/src/features/agent-monitor/agent-history.tsx`

---

## 2026-04-03 13:40 PDT — Review: FX.DOC.1 (approved)

**Reviewed:** Workflow documentation update.
- "Hardcoded" / "not user-configurable" language replaced with custom workflow engine description ✓
- Custom Workflows section: Builder, 10 API endpoints, validation rules, 3-table schema ✓
- Dynamic runtime: 6 key functions documented with descriptions ✓
- Agent resolution priority chain documented ✓
- Router, rejection, parent-child, dispatch sections preserved and updated ✓
- All 9 source files verified to exist ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 13:35 PDT — FX.DOC.1: Update docs/workflow.md for custom workflows

**Done:** Rewrote `docs/workflow.md` to document the Sprint 25 custom workflow engine. Replaced "hardcoded" and "not user-configurable" language. Added: custom workflow creation/editing via Workflow Builder, 10 API endpoints table, validation rules, 3-table schema, dynamic runtime functions table, `resolvePersonaForState()` priority chain, `buildDynamicRouterPrompt()`, updated source files table. Kept existing sections (Router, rejection, parent-child, dispatch) with updated terminology (persona → agent where contextually appropriate) and workflow-aware descriptions.
**Files:** `docs/workflow.md`

---

## 2026-04-03 13:20 PDT — Review: FX.WF.4 (approved)

**Reviewed:** Transition sortOrder in workflow save payload.
- `sortOrder: i` added to both `handleSave` and `handlePublish` transition mappings ✓
- Index `i` gives per-state ordering (0, 1, 2...) matching backend `sortOrder` convention ✓
- Backend expects `sortOrder: number` on transitions, previously defaulted to `?? 0` ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 13:15 PDT — FX.WF.4: Include transition sortOrder in workflow save payload

**Done:** Added `sortOrder: i` (array index) to the transition mapping in both `handleSave` and `handlePublish` in `workflows.tsx`. Previously all transitions were saved with `sortOrder: 0` (backend default). Now preserves transition ordering within each state.
**Files:** `packages/frontend/src/pages/workflows.tsx`

---

## 2026-04-03 12:55 PDT — Review: FX.NAV.1 (approved)

**Reviewed:** Command palette navigation items update.
- All 9 sidebar pages now present in NAV_ITEMS — exact match of labels, paths, and icons ✓
- `BarChart3`, `GitBranch` icons correctly imported; `MessageSquare` already present ✓
- "Persona Manager" → "Personas" label consistency fix ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 12:50 PDT — FX.NAV.1: Update command palette navigation items

**Done:** Added Analytics, Chat, and Workflows to NAV_ITEMS in command-palette.tsx. Now matches sidebar exactly (9 items). Added `BarChart3` and `GitBranch` icon imports. Also renamed "Persona Manager" to "Personas" for consistency with sidebar label.
**Files:** `packages/frontend/src/features/command-palette/command-palette.tsx`

---

## 2026-04-03 12:40 PDT — Review: FX.CHAT.1 (approved)

**Reviewed:** Project name display in chat header badge.
- `useProjects()` fetches project list, `useMemo` builds name lookup map ✓
- `projectNameMap.get(cs.projectId) ?? cs.projectId` — graceful fallback to raw ID ✓
- Only one display location updated, no missed references ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 12:35 PDT — FX.CHAT.1: Show project name in chat header

**Done:** Replaced raw `projectId` display in chat header badge with resolved project name. Added `useProjects()` hook call and a `useMemo`-based name lookup map (`projectNameMap`). Falls back to raw ID if project not yet loaded.
**Files:** `packages/frontend/src/pages/chat.tsx`

---

## 2026-04-03 12:15 PDT — Review: FX.WF.3 (approved)

**Reviewed:** Workflow CRUD input validation.
- POST: non-empty name, valid scope enum ✓
- PATCH: non-empty name if provided, states array non-empty, state name non-empty, valid type enum ✓
- Transition references validated against provided state IDs (only when both provided) ✓
- All validation before DB operations, 400 with specific error messages ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 12:10 PDT — FX.WF.3: Add input validation to workflow CRUD

**Done:** Added input validation to POST and PATCH workflow handlers in `workflows.ts`. POST: validates non-empty name after trim, validates scope enum (global/project). PATCH: validates non-empty name if provided, validates states array non-empty if provided, validates each state has non-empty name and valid type enum (initial/intermediate/terminal), validates transition fromStateId/toStateId reference existing states when both states and transitions are provided. All validation returns 400 with specific error messages.
**Files:** `packages/backend/src/routes/workflows.ts`

---

## 2026-04-03 12:05 PDT — Review: FX.WF.2 (approved)

**Reviewed:** Workflow CRUD transaction wrapping.
- PATCH: `db.transaction((tx) => ...)` wraps update + delete/insert states + delete/insert transitions ✓
- DELETE: `db.transaction((tx) => ...)` wraps delete transitions + states + workflow ✓
- All ops use `tx` not `db`, `.run()` for sync execution ✓
- `stateIdMap` closured correctly in synchronous callback ✓
- DELETE uses `.returning().all()` for 404 check ✓
- Automatic rollback on exception ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 12:00 PDT — FX.WF.2: Wrap workflow CRUD mutations in DB transactions

**Done:** Wrapped PATCH and DELETE workflow handlers in `db.transaction()`. PATCH handler: update metadata + delete/insert states + delete/insert transitions now atomic — crash between delete and insert won't lose data. DELETE handler: delete transitions + states + workflow now atomic. Used synchronous Drizzle better-sqlite3 transaction API with `.run()` for mutations and `.all()` for returning queries inside the transaction callback.
**Files:** `packages/backend/src/routes/workflows.ts`

---

## 2026-04-03 11:55 PDT — Review: FX.WF.1 (approved)

**Reviewed:** Workflow publish race condition fix.
- `async` + `await updateWorkflow.mutateAsync()` ensures save completes before publish ✓
- `mutateAsync` returns Promise (correct for await), `mutate` for fire-and-forget publish ✓
- Inlined payload matches `handleSave` exactly (states + transitions) ✓
- If save throws, publish never fires — correct fail-safe ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 11:50 PDT — FX.WF.1: Fix race condition in workflow publish

**Done:** Fixed `handlePublish` in `workflows.tsx` to await save before publishing. Previously called `handleSave()` (which uses fire-and-forget `mutate()`) then immediately called `publishWorkflow.mutate(id)` — publish could race ahead of save. Changed to inline the save logic using `updateWorkflow.mutateAsync()` with `await`, then fire publish only after save completes.
**Files:** `packages/frontend/src/pages/workflows.tsx`

---

## 2026-04-03 11:45 PDT — Review: FX.NTF.2 (approved)

**Reviewed:** Notification batching double-count fix.
- `flushBatch` now uses `batchState.count - 1` to exclude the individually-shown first notification ✓
- Scenario traces: 1 completion (no batch), 2 (1 more), 5 (4 more) — all correct ✓
- State cleanup before early return — no stale timer/count ✓
- Plural handling and "N more" wording clear ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 11:40 PDT — FX.NTF.2: Fix notification batching double-count

**Done:** Fixed `flushBatch()` in `notification-store.ts` to exclude the first `agent_completed` notification from the batch summary count. The first notification is added immediately (with its specific details), so the batch should only summarize additional ones. Changed count to `batchState.count - 1`, early-returns if 0 additional. Batch title now says "N more agent(s) completed" instead of double-counting. Example: 3 completions → user sees individual first + "2 more agents completed" summary.
**Files:** `packages/frontend/src/stores/notification-store.ts`

---

## 2026-04-03 11:35 PDT — Review: FX.NTF.1 (approved)

**Reviewed:** Toast overflow count decrement fix.
- Inverted ternary `? 0 : 1` → `? 1 : 0` correctly fixes the decrement logic ✓
- Visible toast removed → overflow decrements by 1; already-gone toast → no change ✓
- `Math.max(0, ...)` prevents negative overflow ✓
- Minimal single-character fix, no side effects ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 11:30 PDT — FX.NTF.1: Fix toast overflow count decrement

**Done:** Fixed inverted ternary condition in `toast-store.ts:55`. The `overflowCount` decrement used `? 0 : 1` — subtracting 0 when the toast was visible (found in array) and 1 when not visible. Flipped to `? 1 : 0` so removing a visible toast correctly decrements the overflow count, clearing stale "+N more" badges.
**Files:** `packages/frontend/src/stores/toast-store.ts`

---

## 2026-04-03 11:25 PDT — Review: FX.WHK.1 (approved)

**Reviewed:** HMAC verification raw body fix in webhook triggers.
- Route-level `preParsing` hook buffers raw payload, stores as `request.rawBody` ✓
- Hook scoped to trigger POST endpoint only (not global) ✓
- `Readable.from(rawBuffer)` preserves Fastify JSON parsing ✓
- Non-null assertion on `request.rawBody!` safe (preParsing guarantees lifecycle) ✓
- `timingSafeEqual` for constant-time HMAC comparison unchanged ✓
- No new dependencies — uses built-in `node:stream` ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 11:20 PDT — FX.WHK.1: Fix HMAC verification to use raw request bytes

**Done:** Replaced `JSON.stringify(request.body)` with actual raw request bytes for HMAC verification. Added a route-level `preParsing` hook to the webhook trigger POST endpoint that buffers the raw payload stream, stores it as `request.rawBody`, and returns a new `Readable` stream so Fastify can still parse JSON normally. Added Fastify module augmentation for the `rawBody` property. No new dependencies — uses `node:stream` Readable. Previously, re-serialized JSON could differ from the sender's original payload (key ordering, whitespace), causing all HMAC checks to silently fail.
**Files:** `packages/backend/src/routes/webhook-triggers.ts`

---

## 2026-04-03 11:10 PDT — Review: FX.DEAD.3 (approved)

**Reviewed:** Proposal approve/reject wiring in notification cards.
- `metadata?: Record<string, string>` added to `Notification` interface ✓
- Backend passes `proposalId` in metadata when broadcasting `proposal_needs_approval` ✓
- Frontend `handleProposalAction` calls `updateProposal()` via real PATCH API, not stub navigation ✓
- Loading state (Loader2 spinner), toast feedback, markRead on success, missing-ID guard ✓
- `updateProposal` in API client sends PATCH `/api/proposals/:id` correctly ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 11:00 PDT — FX.DEAD.3: Wire proposal approve/reject into notification actions

**Done:** Added `metadata` field (optional `Record<string, string>`) to `Notification` interface in `ws-events.ts`. Backend now passes `proposalId` in metadata when broadcasting `proposal_needs_approval` notifications (`proposals.ts` + `ws.ts`). Frontend Approve/Reject buttons now call `updateProposal(proposalId, { status })` via API client instead of navigating to `/items`. Added loading state with Loader2 spinner, toast on success/error, marks notification read on success.
**Files:** `packages/shared/src/ws-events.ts`, `packages/backend/src/ws.ts`, `packages/backend/src/routes/proposals.ts`, `packages/frontend/src/features/notifications/notification-card.tsx`

---

## 2026-04-03 10:50 PDT — Review: FX.DEAD.2 (approved)

**Reviewed:** Removal of dead `execution_stuck` notification type.
- Removed from shared type, notification store, card, settings, docs ✓
- Unused `Clock` import cleaned up ✓
- One stale reference in `tests/e2e/plans/notifications-ux.md` (historical doc, not code) — acceptable
- Never emitted by backend, removal cannot cause regressions ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 10:45 PDT — FX.DEAD.2: Remove dead `execution_stuck` notification type

**Done:** Removed `execution_stuck` from `NotificationEventType` union in `ws-events.ts`. Removed from default preferences (enabledEvents + soundEvents) in `notification-store.ts`. Removed from `TYPE_CONFIG` map + action button in `notification-card.tsx`, cleaned up unused `Clock` import. Removed settings toggle from `notifications-section.tsx`. Removed from docs/api.md notification types table. Chose removal over implementation — no backend code ever emitted this type.
**Files:** `packages/shared/src/ws-events.ts`, `packages/frontend/src/stores/notification-store.ts`, `packages/frontend/src/features/notifications/notification-card.tsx`, `packages/frontend/src/features/settings/notifications-section.tsx`, `docs/api.md`

---
