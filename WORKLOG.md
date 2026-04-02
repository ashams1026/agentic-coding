# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 14:25 PDT — Review: CWF.9 (approved)

**Reviewed:** Read-only workflow API endpoints.
- GET /api/workflows: list with projectId/scope filters ✓
- GET /api/workflows/:id: full workflow with nested states + transitions ✓
- GET /api/workflows/:id/states + /transitions: ordered lists with 404 checks ✓
- Serializers for all 3 entity types ✓
- Shared types: Workflow, WorkflowStateEntity, WorkflowTransitionEntity ✓
- Registered in server.ts ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 14:20 PDT — CWF.9: Read-only workflow API endpoints

**Done:** Created `packages/backend/src/routes/workflows.ts` with 4 read-only endpoints. `GET /api/workflows` — list with optional projectId/scope filters (returns global + project-scoped). `GET /api/workflows/:id` — full workflow with nested states + transitions arrays. `GET /api/workflows/:id/states` — list states ordered by sortOrder. `GET /api/workflows/:id/transitions` — list transitions. Added serialization functions for workflow, state, transition. Registered in server.ts. Added shared types: `Workflow`, `WorkflowStateEntity`, `WorkflowTransitionEntity` to entities.ts.
**Files:** `packages/backend/src/routes/workflows.ts` (new), `packages/backend/src/server.ts`, `packages/shared/src/entities.ts`

---

## 2026-04-02 14:10 PDT — Review: CWF.8 (approved)

**Reviewed:** Dynamic router prompt in router.ts.
- buildDynamicRouterPrompt() imported from workflow-runtime ✓
- Hardcoded state list removed from ROUTER_BASE_PROMPT ✓
- buildRouterSystemPrompt() now async, injects "Workflow Context" from dynamic transitions ✓
- runRouter() selects workflowId + currentState, passes to prompt builder ✓
- Persona creation uses base prompt (dynamic context per-run) ✓
- Build passes ✓
- **Verdict: approved.** Backend Runtime phase (CWF.4-8) complete.

---

## 2026-04-02 14:05 PDT — CWF.8: Dynamic router prompt from workflow

**Done:** Updated `packages/backend/src/agent/router.ts`. Replaced hardcoded state list in `ROUTER_BASE_PROMPT` with generic guidelines. `buildRouterSystemPrompt()` now async — calls `buildDynamicRouterPrompt(workflowId, currentState)` to inject "Workflow Context" section with valid target states from the work item's workflow. `runRouter()` now selects `workflowId` + `currentState` from work item and passes to prompt builder. Router persona creation uses base prompt (dynamic context added per-run).
**Files:** `packages/backend/src/agent/router.ts`
**Notes:** Backend Runtime phase (CWF.4-8) complete. All 5 backend files now use dynamic workflow functions.

---

## 2026-04-02 13:55 PDT — Review: CWF.7 (approved)

**Reviewed:** MCP server tools dynamic workflow integration.
- route_to_state: selects workflowId, isValidTransitionDynamic() ✓
- create_children: inherits workflowId, dynamic initial state ✓
- flag_blocked: getWorkflowStates() lookup, dynamic "Blocked" name ✓
- No hardcoded WORKFLOW/isValidTransition imports remain ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 13:50 PDT — CWF.7: Update MCP server tools for dynamic workflow

**Done:** Updated 3 MCP tools in `packages/backend/src/agent/mcp-server.ts`. `route_to_state`: selects workflowId, validates via `isValidTransitionDynamic()` instead of sync `isValidTransition()`. `create_children`: selects parent's workflowId, resolves initial state via `getWorkflowInitialState()`, inherits `workflowId` on child items. `flag_blocked`: queries workflow states via `getWorkflowStates()` to find "Blocked" state by name (case-insensitive), uses dynamic name in update and broadcast. Replaced `WORKFLOW` and `isValidTransition` imports with workflow-runtime functions.
**Files:** `packages/backend/src/agent/mcp-server.ts`

---

## 2026-04-02 13:40 PDT — Review: CWF.6 (approved)

**Reviewed:** dispatch.ts + execution-manager.ts workflow integration.
- dispatch: resolvePersonaForState() with workflowId from item, removed direct persona_assignments query ✓
- execution-manager: selects workflowId + currentState, sets both on execution insert ✓
- Unused imports cleaned up ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 13:35 PDT — CWF.6: Update dispatch.ts and execution-manager.ts for dynamic workflow

**Done:** Updated `dispatch.ts`: replaced direct persona_assignments query with `resolvePersonaForState(projectId, workflowId, stateName)` from workflow-runtime. Now selects `workflowId` from work item alongside `projectId`. Removed `personaAssignments` schema import and unused `and` import. Updated `execution-manager.ts`: selects `workflowId` and `currentState` from work item. Sets `workflowId` and `workflowStateName` on execution records when inserting.
**Files:** `packages/backend/src/agent/dispatch.ts`, `packages/backend/src/agent/execution-manager.ts`

---

## 2026-04-02 13:25 PDT — Review: CWF.5 (approved)

**Reviewed:** Work-items routes dynamic workflow integration.
- POST: project workflowId lookup → getWorkflowInitialState() → sets workflowId on item ✓
- PATCH: selects workflowId, validates via isValidTransitionDynamic() ✓
- Imports replaced: workflow-runtime functions instead of hardcoded WORKFLOW ✓
- projects added to schema import ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 13:20 PDT — CWF.5: Update work-items routes to use dynamic workflow

**Done:** Updated `packages/backend/src/routes/work-items.ts`. POST: looks up project's `workflowId`, resolves initial state via `getWorkflowInitialState()`, sets `workflowId` on created items. PATCH: selects `workflowId` alongside `currentState`, validates transitions via `isValidTransitionDynamic()` instead of sync `isValidTransition()`. Replaced `WORKFLOW` and `isValidTransition` imports with `getWorkflowInitialState` and `isValidTransitionDynamic` from workflow-runtime. Added `projects` to schema import for project lookup.
**Files:** `packages/backend/src/routes/work-items.ts`

---

## 2026-04-02 13:10 PDT — Review: CWF.4 (approved)

**Reviewed:** workflow-runtime.ts dynamic query functions.
- 6 functions: getWorkflowStates, getWorkflowTransitions, isValidTransitionDynamic, getWorkflowInitialState, resolvePersonaForState, buildDynamicRouterPrompt ✓
- All fall back to hardcoded WORKFLOW when workflowId is null ✓
- resolvePersonaForState: priority chain (workflow state → persona_assignments) ✓
- Clean exported types: DynamicWorkflowState, DynamicWorkflowTransition ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 13:05 PDT — CWF.4: workflow-runtime.ts with dynamic query functions

**Done:** Created `packages/backend/src/agent/workflow-runtime.ts` with 6 exported functions. `getWorkflowStates(workflowId)`: queries DB, returns typed states with fallback to WORKFLOW constant. `getWorkflowTransitions(workflowId)`: queries transitions + resolves state names. `isValidTransitionDynamic(workflowId, from, to)`: async validation. `getWorkflowInitialState(workflowId)`: finds "initial" type state. `resolvePersonaForState(projectId, workflowId, stateName)`: priority chain — workflow state persona → persona_assignments fallback. `buildDynamicRouterPrompt(workflowId, currentState)`: lists valid target states from transitions. All functions fall back to hardcoded WORKFLOW when workflowId is null.
**Files:** `packages/backend/src/agent/workflow-runtime.ts` (new)

---

## 2026-04-02 12:55 PDT — Review: CWF.3 (approved)

**Reviewed:** Default workflow seed in seed-workflow.ts + startup wiring.
- Idempotent: checks for existing wf-default before inserting ✓
- 8 states from WORKFLOW constant with type classification ✓
- All valid transitions created from WORKFLOW.transitions ✓
- Deterministic IDs (wf-default, ws-default-*, wt-default-*) ✓
- Backfills projects.workflowId + work_items.workflowId where null ✓
- Startup: runs after migrations + personas ✓
- Build passes ✓
- **Verdict: approved.** Schema & Data Model phase (CWF.1-3) complete.

---

## 2026-04-02 12:50 PDT — CWF.3: Seed default workflow

**Done:** Created `packages/backend/src/db/seed-workflow.ts` with `seedDefaultWorkflow()`. Uses fixed ID `wf-default` for idempotency. Inserts default workflow (8 states from WORKFLOW constant with type classification: Backlog=initial, Done=terminal, rest=intermediate). Creates all valid transitions from WORKFLOW.transitions. Deterministic state IDs (`ws-default-backlog`, etc.) and transition IDs. Backfills `projects.workflowId` and `work_items.workflowId` where null. Wired into startup in `start.ts` after migrations + personas via dynamic import.
**Files:** `packages/backend/src/db/seed-workflow.ts` (new), `packages/backend/src/start.ts`

---

## 2026-04-02 12:40 PDT — Review: CWF.2 (approved)

**Reviewed:** workflowId columns + migration + shared types + serialization.
- workflowId on projects/work_items/executions, workflowStateName on executions ✓
- Migration 0013: 4 ALTER TABLE ADD ✓
- Shared types: all 3 entities + Execution extra field ✓
- Serialization: projects, executions updated; work_items uses spread ✓
- 2 downstream TS fixes (execution-manager, dashboard) ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 12:35 PDT — CWF.2: Add workflowId columns to projects, work_items, executions

**Done:** Added `workflowId` (TEXT nullable) to projects, work_items, and executions tables in schema.ts. Added `workflowStateName` (TEXT nullable) to executions. Generated migration `0013_classy_giant_man.sql` (4 ALTER TABLE ADD). Updated shared entity types: Project, WorkItem, Execution all include workflowId. Updated serialization: projects route adds workflowId, executions route adds workflowId + workflowStateName, work_items already uses spread. Fixed 2 downstream TS errors: execution-manager.ts projectEntity + dashboard.ts WorkItem literal.
**Files:** `packages/backend/src/db/schema.ts`, `packages/shared/src/entities.ts`, `packages/backend/src/routes/projects.ts`, `packages/backend/src/routes/executions.ts`, `packages/backend/src/routes/dashboard.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/drizzle/0013_classy_giant_man.sql`

---

## 2026-04-02 12:20 PDT — Review: CWF.1 (approved)

**Reviewed:** Workflow schema in schema.ts + migration 0012.
- workflows: 9 columns with scope, versioning, publishing ✓
- workflow_states: 7 columns with type/color/persona/sortOrder ✓
- workflow_transitions: 6 columns with from/to state FKs + label ✓
- Relations: workflows→states/transitions, states→workflow/persona, transitions→fromState/toState (named) ✓
- Migration CREATE TABLE correct ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 12:15 PDT — CWF.1: Schema for workflows, workflow_states, workflow_transitions

**Done:** Added 3 new tables to `packages/backend/src/db/schema.ts`. `workflows`: id, name, description, scope (global/project), projectId (nullable FK), version, isPublished (boolean), timestamps. `workflow_states`: id, workflowId (FK notNull), name, type (initial/intermediate/terminal), color, personaId (nullable FK), sortOrder. `workflow_transitions`: id, workflowId (FK notNull), fromStateId (FK notNull), toStateId (FK notNull), label, sortOrder. Added Drizzle relations: workflow → states/transitions, state → workflow/persona, transition → workflow/fromState/toState. Generated migration `0012_bright_jack_flag.sql`.
**Files:** `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0012_bright_jack_flag.sql`, `packages/backend/drizzle/meta/0012_snapshot.json`, `packages/backend/drizzle/meta/_journal.json`

---

## 2026-04-02 12:00 PDT — DECOMPOSE: Sprint 25 — Workflow Engine

**Done:** Decomposed Sprint 25 into 22 tasks across 6 sections: Schema & Data Model (CWF.1-3), Backend Runtime (CWF.4-8), API Routes (CWF.9-10), Frontend Dynamic Views (CWF.11-14), Frontend Workflow Builder (CWF.15-18), Testing & Docs (CWF.TEST.1-3, CWF.DOC.1). Read all 4 proposal docs + explored current codebase (26 files import WORKFLOW, isValidTransition used in 2 backend files). Key decisions: 3 new tables (workflows/states/transitions), seed default from hardcoded constant, dual-read fallback during migration, Phase 1 form-list builder (no graph editor), regression checkpoint critical after runtime replacement.
**Files:** `TASKS.md`

---

## 2026-04-02 11:45 PDT — Review: CUX.TEST.5 (approved)

**Reviewed:** Post-Sprint 24 regression checkpoint results.
- 36/36 test plans evaluated, 26 UI-verified, 10 code-review only ✓
- 0 regressions vs Sprint 23 baseline ✓
- 13 API endpoints verified (including new Sprint 24 endpoints) ✓
- 7 screenshots covering all major UI areas ✓
- Build passes ✓
- **Verdict: approved. Sprint 24: Core UX is complete.**

---

## 2026-04-02 11:40 PDT — CUX.TEST.5: Regression checkpoint post-Sprint 24

**Done:** Full regression sweep across all 36 test plans. 26 UI-verified, 10 code-review only. **0 regressions found.** All Sprint 1-18 suites PASS, Sprint 19-20 PASS, Sprint 23 (error recovery, lifecycle, global agents) PASS, Sprint 24 (agent chat, notifications) PASS. 13 API endpoints verified including new chat session persona join, lastMessagePreview, lifecycle filters, standalone execution validation. 7 screenshots covering all major UI pages. Build compiles clean.
**Files:** `tests/e2e/results/2026-04-02_11-30_regression-sprint24/RESULTS.md`, 7 screenshot PNGs

---

## 2026-04-02 11:20 PDT — Review: CUX.DOC.2 (approved)

**Reviewed:** Notifications system documentation in docs/api.md.
- notification WS event with full Notification object shape ✓
- NotificationEventType: 5 types with priority/trigger table ✓
- NotificationPriority: 4 levels, critical = no auto-dismiss ✓
- Backend emission points: 4 entries matching implementation ✓
- NotificationPreferences schema: enabledEvents, soundEvents, quietHours, scope ✓
- Defaults, quiet hours behavior, 60s batching documented ✓
- **Verdict: approved.**

---

## 2026-04-02 11:15 PDT — CUX.DOC.2: Document Notifications system

**Done:** Updated `docs/api.md` with Notifications documentation. Added `notification` WebSocket event type with full Notification object shape. Documented `NotificationEventType` enum (5 types) with priority levels and trigger descriptions in a table. Documented `NotificationPriority` (4 levels) with toast behavior (critical = no auto-dismiss). Added backend emission points table (4 files/events). Documented frontend handling (dual dispatch to notification store + toast store). Added "Notification Preferences" section with full `NotificationPreferences` schema, defaults, quiet hours behavior, and 60-second batching rules.
**Files:** `docs/api.md`

---

## 2026-04-02 11:05 PDT — Review: CUX.DOC.1 (approved)

**Reviewed:** Agent Chat and Persona Prompts API documentation in docs/api.md.
- Create Session: personaId + workItemId params, full ChatSession response ✓
- List Sessions: ChatSessionWithPersona with persona join + lastMessagePreview ✓
- Get Messages: session object with persona info ✓
- Send Message: persona-specific prompt behavior (isPico gating) ✓
- Template Variables: 13 variables in 4 namespaces, resolution rules, 2 paths ✓
- All matches actual implementation ✓
- **Verdict: approved.**

---

## 2026-04-02 11:00 PDT — CUX.DOC.1: Document Agent Chat and Persona Prompts API changes

**Done:** Updated `docs/api.md` Chat section: renamed "Chat (Pico)" to "Chat (Multi-Persona)". Updated Create Session to show `personaId` and `workItemId` params with full ChatSession response including new fields. Updated List Sessions response to show `ChatSessionWithPersona` with persona join data and `lastMessagePreview`. Updated Get Messages to return `session` object with persona info. Updated Send Message to document persona-specific prompt behavior. Added new "Persona Prompt Template Variables" section documenting all 13 built-in variables across 4 namespaces, resolution rules, and the two resolution paths (executor vs chat).
**Files:** `docs/api.md`

---

## 2026-04-02 10:50 PDT — Review: CUX.TEST.4 (approved)

**Reviewed:** Notifications UX e2e test execution results.
- 7/7 PASS, no bugs filed ✓
- 6 screenshots covering bell, drawer, badge, cards, mark-all-read, Settings ✓
- Drawer screenshot confirms all 5 card types with correct icons/colors/actions ✓
- Code review evidence for 7 files (toast store, renderer, events, WS types, backend) ✓
- **Verdict: approved.**

---

## 2026-04-02 10:45 PDT — CUX.TEST.4: Execute Notifications UX e2e tests

**Done:** Executed all 7 test cases from `notifications-ux.md`. Results: **7/7 PASS**, no bugs filed. TC-NTF-1: bell icon between theme+collapse, no badge when 0 unread. TC-NTF-2: drawer open/close (click/X/Escape), empty state "All caught up!". TC-NTF-3: injected 5 notifications via localStorage, badge shows count, "Mark all read" clears unread. TC-NTF-4: all 5 card types with correct icons/colors/action buttons. TC-NTF-5: code review — critical skip auto-dismiss, overflow link, dual dispatch. TC-NTF-6: Settings tab with event toggles, quiet hours, scope. TC-NTF-7: code review — WS types + emission points.
**Files:** `tests/e2e/results/2026-04-02_10-35_notifications-ux/RESULTS.md`, 6 screenshot PNGs

---

## 2026-04-02 10:30 PDT — Review: CUX.TEST.3 (approved)

**Reviewed:** E2E test plan for Notifications UX.
- 7 test cases covering all required features ✓
- Bell icon + badge (TC-NTF-1), drawer open/close (TC-NTF-2), store + badge injection (TC-NTF-3) ✓
- Card types with 5 icon/color/action configs (TC-NTF-4) ✓
- Enhanced toasts as code review (TC-NTF-5) — reasonable for WS-dependent features ✓
- Settings: event toggles, quiet hours, scope (TC-NTF-6) ✓
- WS types + backend emission as code review (TC-NTF-7) ✓
- Template compliant ✓
- **Verdict: approved.**

---

## 2026-04-02 10:25 PDT — CUX.TEST.3: E2E test plan for Notifications UX

**Done:** Wrote `tests/e2e/plans/notifications-ux.md` with 7 test cases: TC-NTF-1 (bell icon in sidebar footer), TC-NTF-2 (drawer open/close/empty state/Escape/backdrop), TC-NTF-3 (notification store + badge via JS injection, mark all read), TC-NTF-4 (card types with 5 icon/color configs + action buttons), TC-NTF-5 (enhanced toasts — code review for critical non-dismiss, overflow, dual dispatch), TC-NTF-6 (Settings Notifications tab — event toggles, quiet hours, scope), TC-NTF-7 (WS event types + backend emission — code review). Follows template with screenshot checkpoints, visual quality, failure criteria.
**Files:** `tests/e2e/plans/notifications-ux.md` (new)

---

## 2026-04-02 10:15 PDT — Review: CUX.TEST.2 (approved)

**Reviewed:** Agent Chat Phase 1 e2e test execution results.
- 7/7 PASS, no bugs filed ✓
- 10 screenshots with descriptive names covering all test cases ✓
- RESULTS.md with summary table, screenshots list, API evidence ✓
- Screenshots verified: persona selector (6 cards, Pico default), delete confirmation dialog ✓
- API evidence: 3 endpoints verified (session create, list, messages) ✓
- **Verdict: approved.**

---

## 2026-04-02 10:10 PDT — CUX.TEST.2: Execute Agent Chat Phase 1 e2e tests

**Done:** Executed all 7 test cases from `agent-chat-phase1.md`. Results: **7/7 PASS**, no bugs filed. TC-ACH-1: persona selector modal with 6 cards (Router filtered), Pico default, Engineer session created. TC-ACH-2: sidebar avatars + TODAY date grouping. TC-ACH-3: persona filter dropdown filters correctly. TC-ACH-4: header bar with persona info, project badge, three-dot menu. TC-ACH-5: delete from header, auto-switch. TC-ACH-6: right-click context menu with delete confirmation dialog. TC-ACH-7: API verification — personaId persisted, persona join data, session in messages response.
**Files:** `tests/e2e/results/2026-04-02_09-55_agent-chat-phase1/RESULTS.md`, 10 screenshot PNGs

---

## 2026-04-02 09:50 PDT — Review: CUX.TEST.1 (approved)

**Reviewed:** E2E test plan for Agent Chat Phase 1.
- 7 test cases (TC-ACH-1 through TC-ACH-7) covering all required features ✓
- Persona selector: modal, cards, Pico default, Router filtered, Escape dismiss ✓
- Sidebar: avatars, date grouping, last message preview, persona filter ✓
- Chat header: avatar, name, badge, editable title, three-dot menu ✓
- Session management: rename (double-click + menu), delete (header + right-click with confirmation) ✓
- API verification: personaId, persona join, messages session info ✓
- Template compliant: screenshot checkpoints, visual quality, failure criteria ✓
- **Verdict: approved.**

---

## 2026-04-02 09:45 PDT — CUX.TEST.1: E2E test plan for Agent Chat Phase 1

**Done:** Wrote `tests/e2e/plans/agent-chat-phase1.md` with 7 test cases: TC-ACH-1 (persona selector grid — modal, cards, Pico default, Router filtered), TC-ACH-2 (sidebar avatars + date grouping + last message preview), TC-ACH-3 (persona filter dropdown), TC-ACH-4 (chat header bar — avatar, name, project badge, editable title, three-dot menu), TC-ACH-5 (delete from header menu), TC-ACH-6 (right-click context menu with rename/delete confirmation), TC-ACH-7 (API verification — session creation with personaId, persona join data, messages endpoint). Follows template with screenshot checkpoints, visual quality section, failure criteria.
**Files:** `tests/e2e/plans/agent-chat-phase1.md` (new)

---

## 2026-04-02 09:35 PDT — Review: NTF.8 (approved)

**Reviewed:** Notifications tab in Settings.
- 5 event types with In-App/Sound toggle grid ✓
- Quiet hours: enable toggle + from/to time pickers, conditionally shown ✓
- Scope: radio buttons (All projects / Current project only) ✓
- All saved to notification store preferences (localStorage persistence) ✓
- Bell icon + entry in settings sidebar nav ✓
- Build passes ✓
- **Verdict: approved.** Notifications UX Phase 1 (NTF.1-8) complete.

---

## 2026-04-02 09:30 PDT — NTF.8: Notifications tab in Settings

**Done:** Created `packages/frontend/src/features/settings/notifications-section.tsx`. Three sections: (1) Event Types — grid with In-App and Sound toggle columns for all 5 notification types, each with label and description. (2) Quiet Hours — enable toggle + time pickers (from/to) for suppressing non-critical during set hours. (3) Scope — radio buttons for "All projects" vs "Current project only". All settings saved to notification store preferences (persisted via localStorage). Added Bell icon + "Notifications" entry to settings sidebar nav and content switch in settings-layout.tsx.
**Files:** `packages/frontend/src/features/settings/notifications-section.tsx` (new), `packages/frontend/src/features/settings/settings-layout.tsx`

---

## 2026-04-02 09:20 PDT — Review: NTF.7 (approved)

**Reviewed:** Enhanced toasts across 3 files.
- Critical toasts skip auto-dismiss (toast-store `!toast.critical` gate) ✓
- Max 3 visible, overflow "+N more" link opens notification drawer ✓
- `notification` WS events dispatched to both notification store + toast store ✓
- CRITICAL_TYPES set (proposal/error/budget), action buttons per type ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 09:15 PDT — NTF.7: Enhanced toasts with critical flag and notification dispatch

**Done:** Updated toast store: added `critical` flag to Toast interface — critical toasts skip auto-dismiss timer. Added `overflowCount` state tracking. Updated toast renderer: shows "+N more" link above toasts when overflow > 0, clicking opens notification drawer. Updated `use-toast-events.ts`: handles `notification` WS event type — dispatches to both notification store (`addNotification`) and toast store (`addToast`). Critical notification types (proposal_needs_approval, agent_errored, budget_threshold) get `critical: true` on their toasts. Existing proposal_created toast also marked critical. Action buttons on toasts (View, Review, Settings) based on notification type.
**Files:** `packages/frontend/src/stores/toast-store.ts`, `packages/frontend/src/features/toasts/toast-renderer.tsx`, `packages/frontend/src/features/toasts/use-toast-events.ts`

---

## 2026-04-02 09:05 PDT — Review: NTF.6 (approved)

**Reviewed:** NotificationCard in notification-card.tsx.
- 5 type-specific icons with correct colors (Lightbulb/amber, AlertCircle/red, AlertTriangle/yellow, Clock/orange, CheckCircle/green) ✓
- Inline actions: Approve/Reject for proposals, View execution/result/settings/agent for others ✓
- Actions: stopPropagation + markRead + close drawer + navigate ✓
- Click marks as read ✓
- Drawer uses NotificationCard component ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 09:00 PDT — NTF.6: NotificationCard with type icons and action buttons

**Done:** Created `packages/frontend/src/features/notifications/notification-card.tsx`. Type-specific icons: proposal=Lightbulb/amber, error=AlertCircle/red, budget=AlertTriangle/yellow, stuck=Clock/orange, completed=CheckCircle/green — each with colored background circle. Inline action buttons per type: proposals get [Approve] [Reject], errors get [View execution] → /agents, completed get [View result] → /agents, budget get [View settings] → /settings, stuck get [View agent] → /agents. Actions close drawer + navigate. Click marks as read. Updated drawer to use NotificationCard, removed inline rendering and unused imports.
**Files:** `packages/frontend/src/features/notifications/notification-card.tsx` (new), `packages/frontend/src/features/notifications/notification-drawer.tsx`

---

## 2026-04-02 08:50 PDT — Review: NTF.5 (approved)

**Reviewed:** NotificationDrawer in notification-drawer.tsx + root-layout integration.
- 320px panel (w-80), fixed right, z-50, backdrop overlay ✓
- Header: "Notifications" + "Mark all read" (conditional) + close ✓
- Date grouping (Today/Yesterday/This Week/Older) ✓
- Notification items: priority dot, title (bold if unread), description (2-line), relative time ✓
- Click marks as read, empty state with bell icon ✓
- Dismisses on Escape + click outside (delayed handler) ✓
- Rendered in root-layout.tsx ✓
- Build passes ✓
- **Verdict: approved.** NTF.6 will extract NotificationCard into standalone component with type-specific icons and actions.

---

## 2026-04-02 08:45 PDT — NTF.5: NotificationDrawer component

**Done:** Created `packages/frontend/src/features/notifications/notification-drawer.tsx` — 320px sliding panel from right with backdrop overlay (z-50). Header: "Notifications" title + "Mark all read" button (only shown when unread exist) + close button. Notifications grouped by date (Today/Yesterday/This Week/Older). Each notification shows priority dot (color-coded), title (bold if unread), description (2-line clamp), relative time. Click marks as read. Empty state: Bell icon + "All caught up!". Dismisses on click outside (delayed to avoid bell re-trigger) or Escape key. Rendered in root-layout.tsx alongside other global components.
**Files:** `packages/frontend/src/features/notifications/notification-drawer.tsx` (new), `packages/frontend/src/layouts/root-layout.tsx`

---

## 2026-04-02 08:30 PDT — Review: NTF.4 (approved)

**Reviewed:** NotificationBell component + sidebar integration.
- Bell icon with red unread badge ("9+" overflow) ✓
- Placed between theme toggle and collapse button in sidebar footer ✓
- Click toggles drawerOpen in notification store ✓
- Wired to selectUnreadCount selector ✓
- Tooltip with count or "Notifications" ✓
- Build passes ✓
- **Verdict: approved.**


