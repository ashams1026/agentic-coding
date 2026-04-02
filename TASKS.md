# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-22 complete and archived. Sprint 23: Error Recovery (FND.ERR.1-7), Work Item Lifecycle (FND.WIL.1-8), Global Agents partial (FND.GA.1-5) archived. All research proposals (RES.*) complete and archived. Blocked tasks (FX.SDK3, FX.SDK5, SDK.V2.3) moved to `BLOCKED_TASKS.md`. Full roadmap for Sprints 24-27 and Tier 3 backlog in `docs/roadmap.md`.

---

## Sprint 23: Foundations

> Reliability fixes + data hygiene + the keystone feature (Global Agents). See `docs/roadmap.md` for full context.
> Proposal docs: `docs/proposals/error-recovery/`, `docs/proposals/work-item-lifecycle/`, `docs/proposals/global-agents/`

### Global Agents Phase 1

- [x] **FND.GA.6** — Agent Monitor "New Run" modal. *(completed 2026-04-02 00:00 PDT)* In `agent-monitor-layout.tsx` add a "+ New Run" button that opens a dialog with: persona picker (from `usePersonas()`), scope radio (Global / Project with project selector), prompt textarea, budget input. On submit call `POST /api/executions/run`. Acceptance: modal opens with real personas list; form submits (404 acceptable until backend is wired).
- [x] **FND.GA.7** — Backend: add `POST /api/executions/run` *(completed 2026-04-02 00:15 PDT)* standalone execution endpoint. In `packages/backend/src/routes/executions.ts` add route accepting `{ personaId, prompt, projectId?, budgetUsd? }`. Validate personaId exists. Create execution row with `workItemId = null`, status `pending`. Return 201. No agent dispatch yet — just DB record creation. Acceptance: POST returns 201 with execution id.
- [x] **FND.GA.8** — Pico scope toggle and persona picker *(completed 2026-04-02 00:30 PDT)* in chat panel header. In `packages/frontend/src/features/pico/pico-store.ts` add `scopeOverride` and `selectedPersonaId` fields. In `chat-panel.tsx` add scope dropdown (Follows sidebar / Global / each project) and persona picker in the header. When either changes, create a fresh session. Display active scope as a badge. Acceptance: user can switch scope and persona; store updates reflected in badge.
- [x] **FND.GA.9** — Backend: support nullable `projectId` in chat sessions *(completed 2026-04-02 00:45 PDT)* and persona override. In `packages/backend/src/routes/chat.ts` change `POST /api/chat/sessions` to accept optional `projectId` and `personaId`. Remove the 400 guard for missing projectId. When `personaId` is provided, use that persona's system prompt instead of default Pico. Acceptance: `POST /api/chat/sessions` with empty body returns 201; chat streams for both scoped and global sessions.
- [x] **FND.GA.10** — E2E test plan for Global Agents Phase 1. *(completed 2026-04-02 01:00 PDT)* Write `tests/e2e/plans/global-agents-phase1.md` covering: (1) "All Projects" selector persists across navigations, (2) Dashboard aggregated view in global scope, (3) Work Items disabled in global scope, (4) Agent Monitor scope badges, (5) "New Run" modal, (6) Pico scope toggle creates new session, (7) standalone execution endpoint returns 201. Acceptance: test plan file exists with all 7 scenarios.

### Testing & Documentation

- [ ] **FND.TEST.1** — E2E test plan for Error Recovery Phase 1. Write `tests/e2e/plans/error-recovery-phase1.md` covering: (1) backend starts with busy_timeout PRAGMA active, (2) WS reconnection uses exponential backoff (disconnect and observe timing), (3) page-level error boundary catches thrown error and shows fallback (not white screen), (4) status bar reflects WS connection state (connected/reconnecting/disconnected), (5) Agent Monitor shows "Connection lost" banner on disconnect, (6) failed execution has structured `error` JSON with category, (7) orphaned executions show `interrupted` status after server restart, (8) pre-migration backup file is created on startup. Acceptance: test plan file exists with all 8 scenarios.
- [ ] **FND.TEST.2** — E2E test plan for Work Item Lifecycle. Write `tests/e2e/plans/work-item-lifecycle.md` covering: (1) archive a work item — disappears from default list, (2) "Show archived" toggle reveals archived items with muted styling, (3) unarchive restores item to normal view, (4) delete a work item — confirmation dialog shown, item soft-deleted, (5) bulk select and archive multiple items, (6) bulk delete with confirmation, (7) "Recently deleted" in Settings shows soft-deleted items with [Restore], (8) delete blocked (409) when execution is running, (9) context menu shows archive/delete actions, (10) detail panel shows archive/unarchive button. Acceptance: test plan file exists with all 10 scenarios.
- [ ] **FND.TEST.3** — Execute Error Recovery e2e tests. Run the test plan from `tests/e2e/plans/error-recovery-phase1.md` via chrome-devtools MCP. Screenshot each test case. Record results to `tests/e2e/results/`. File bugs as `FX.*` tasks in TASKS.md for any failures.
- [ ] **FND.TEST.4** — Execute Work Item Lifecycle e2e tests. Run the test plan from `tests/e2e/plans/work-item-lifecycle.md` via chrome-devtools MCP. Screenshot each test case. Record results to `tests/e2e/results/`. File bugs as `FX.*` tasks for any failures.
- [ ] **FND.TEST.5** — Execute Global Agents Phase 1 e2e tests. Run the test plan from `tests/e2e/plans/global-agents-phase1.md` via chrome-devtools MCP. Screenshot each test case. Record results to `tests/e2e/results/`. File bugs as `FX.*` tasks for any failures.
- [ ] **FND.TEST.6** — Regression checkpoint: re-run all existing e2e test suites. Run every test plan in `tests/e2e/plans/` against the current build. Record results to `tests/e2e/results/`. Compare against previous results to identify regressions. File bugs as `FX.REG.*` tasks for any new failures not present in prior runs.
- [ ] **FND.DOC.1** — Document new Work Item Lifecycle API endpoints. Update `docs/` with the new endpoints: `POST /api/work-items/:id/archive`, `POST /api/work-items/:id/unarchive`, `POST /api/work-items/:id/restore`, `POST /api/work-items/bulk/archive`, `POST /api/work-items/bulk/unarchive`, `DELETE /api/work-items/bulk`. Include request/response shapes, 409 guard behavior, 30-day grace period, and cascade rules. Also document the `archived_at`/`deleted_at` schema additions.
- [ ] **FND.DOC.2** — Document Global Agents data model and API changes. Update `docs/` with: nullable `projectId` on chat sessions and executions, `global_memories` table schema, `AgentScope` type, `POST /api/executions/run` standalone execution endpoint (request/response shape, validation rules). Document the "All Projects" navigation behavior and scope-awareness rules for Dashboard and Agent Monitor.

---

> **Future sprints (24-27) and Tier 3 backlog are defined in `docs/roadmap.md`.** When Sprint 23 is complete, the Decomposer agent should read the roadmap and decompose Sprint 24 into tasks.
