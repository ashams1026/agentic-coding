# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 12:28 PDT — UXO.20: Redesign Automations page

**Done:** Replaced old workflow list with unified Automations overview. Workflow cards show name, autoRouting status (play/pause), published/draft badge, state pipeline colored pills, and edit button. Schedule cards show name, active toggle, agent avatar, human-readable cron, next run time, last run status. "New Automation" dropdown with workflow/schedule creation dialogs. Empty states for both sections.
**Files:** `packages/frontend/src/pages/workflows.tsx`

---

## 2026-04-02 12:28 PDT — UXO.21: Agent overrides in workflow builder

**Done:** Added collapsible "Agent Overrides" section to state-card.tsx below the agent selector. Collapsed view shows override chips ("label → agent name" with agent color). Expanded view shows editable rows with label input + agent dropdown + delete button. "Add override" button. Data flows to parent via onChange callback. Added agentOverrides: [] to addState() in workflow-builder.tsx.
**Files:** `packages/frontend/src/features/workflow-builder/state-card.tsx`, `packages/frontend/src/features/workflow-builder/workflow-builder.tsx`

---

## 2026-04-02 12:28 PDT — UXO.31: Status bar automations indicator

**Done:** Removed old autoRouting play/pause toggle and all project.settings.autoRouting references. Replaced with read-only "Automations active" indicator showing count of workflows with autoRouting enabled. Zap icon + count, green for active, muted for zero. Clicking navigates to /automations via Link. Added useWorkflows to hooks barrel export.
**Files:** `packages/frontend/src/components/status-bar.tsx`, `packages/frontend/src/hooks/index.ts`

---

## 2026-04-02 12:17 PDT — UXO.13: Improved chat header

**Done:** Enlarged agent avatar (h-10 w-10 with colored ring halo), promoted agent name to text-base font-semibold, added resolved project name below agent name, made session title editable (single-click with pencil icon), added context menu (rename, delete), tinted header border with agent color. Applied to both chat.tsx and chat-panel.tsx with consistent styling.
**Files:** `packages/frontend/src/pages/chat.tsx`, `packages/frontend/src/features/pico/chat-panel.tsx`

---

## 2026-04-02 12:17 PDT — UXO.15: Per-workflow router system prompt

**Done:** Rewrote `buildDynamicRouterPrompt()` in workflow-runtime.ts to generate a structured 3-section system prompt: (1) all workflow states with types and assigned agent names, (2) complete transition map with labels, (3) current state context with valid next states. Agent names resolved via deduplicated parallel queries. Terminal state guard prevents routing further.
**Files:** `packages/backend/src/agent/workflow-runtime.ts`

---

## 2026-04-02 12:17 PDT — UXO.16: Label-based agent resolution

**Done:** Updated `resolveAgentForState()` with new `workItemLabels` parameter implementing 3-tier priority: (1) first matching agentOverrides entry via case-insensitive label match, (2) state default agentId, (3) agent_assignments fallback. Updated `dispatchForState()` in dispatch.ts to fetch and pass work item labels.
**Files:** `packages/backend/src/agent/workflow-runtime.ts`, `packages/backend/src/agent/dispatch.ts`

---

## 2026-04-02 12:17 PDT — UXO.DOC.1: UX Overhaul documentation update

**Done:** Renamed persona → agent across 10 doc files. Created docs/agents.md (replacing personas.md). Documented global project model, agent scope, agentOverrides with label-match priority, per-workflow autoRouting, flow view removal. Updated docs/api.md with /api/agents endpoints and new workflow/state fields. Fixed CSS token names and stale references.
**Files:** `docs/agents.md` (new), `docs/api.md`, `docs/data-model.md`, `docs/workflow.md`, `docs/architecture.md`, `docs/mcp-tools.md`, `docs/getting-started.md`, `docs/frontend.md`, `docs/deployment.md`, `docs/roadmap.md`, `docs/personas.md`

---

## 2026-04-02 11:56 PDT — UXO.14: Schema autoRouting + agentOverrides migration

**Done:** Added `autoRouting` boolean (default false) to workflows table, `agentOverrides` JSON column to workflow_states. Created migration 0002. Updated shared types: moved autoRouting from ProjectSettings to Workflow, added agentOverrides to WorkflowStateEntity. Updated workflow routes (serialize, POST/PATCH), router.ts (reads workflow.autoRouting instead of project.settings), and seed files. Fixed router regression: work items without workflowId now default to no-routing.
**Files:** `packages/backend/src/db/schema.ts`, `packages/shared/src/entities.ts`, `packages/backend/drizzle/0002_add_workflow_auto_routing.sql` (new), `packages/backend/drizzle/meta/0002_snapshot.json` (new), `packages/backend/drizzle/meta/_journal.json`, `packages/backend/src/routes/workflows.ts`, `packages/backend/src/agent/router.ts`, `packages/backend/src/db/seed.ts`, `packages/backend/src/db/seed-demo.ts`, `packages/backend/src/agent/__tests__/router.test.ts`
**Notes:** Frontend files still reference project.settings.autoRouting (dead controls) — will be addressed by UXO.22 and UXO.31.

---

## 2026-04-02 11:44 PDT — UXO.12: Agent-grouped chat sessions

**Done:** Replaced date-based session grouping with agent-based collapsible groups in `chat.tsx`. Each group shows agent avatar (colored circle with icon), agent name, session count, and expand/collapse chevron. Sessions sorted by recency within groups. All groups default expanded. Removed redundant agent filter dropdown.
**Files:** `packages/frontend/src/pages/chat.tsx`

---

## 2026-04-02 11:44 PDT — UXO.17: Enforce Backlog/Done immutable states

**Done:** Auto-creates "Backlog" (initial) and "Done" (terminal) states on `POST /api/workflows`. PATCH handler prevents renaming, type-changing, or removing built-in states (400 errors). Added canonical ID anchoring — built-in states always keep their original DB IDs regardless of client-submitted IDs, preventing immutability bypass.
**Files:** `packages/backend/src/routes/workflows.ts`

---

## 2026-04-02 11:44 PDT — UXO.23: Enable global scope work items

**Done:** Removed sidebar nav dimming for Work Items when global project selected — no more `isDimmed`, `opacity-40`, or `cursor-not-allowed`. Created migration `0001_seed_global_workflow.sql` seeding a 3-state workflow (Backlog → In Progress → Done) for `pj-global` with transitions and no agents assigned. Added corresponding Drizzle snapshot.
**Files:** `packages/frontend/src/components/sidebar.tsx`, `packages/backend/drizzle/0001_seed_global_workflow.sql` (new), `packages/backend/drizzle/meta/0001_snapshot.json` (new), `packages/backend/drizzle/meta/_journal.json`

---

## 2026-04-02 11:44 PDT — UXO.TEST.1: UX Overhaul e2e test plan

**Done:** Wrote comprehensive e2e test plan with 37 test cases (UXO-E2E-001 through UXO-E2E-037) covering all 8 UX Overhaul phases. Implemented features marked `pending`, unimplemented marked `skip` with UXO task references. Follows project test plan template with visual inspection protocol and screenshot checkpoints.
**Files:** `tests/e2e/plans/ux-overhaul.md` (new)

---

## 2026-04-02 11:23 PDT — UXO.11: Dynamic empty chat state

**Done:** Replaced hardcoded "Woof! I'm Pico" empty state in `chat.tsx` and `chat-panel.tsx` with dynamic agent-aware rendering. When a non-Pico agent is selected, shows that agent's avatar icon, color, name, and description. Pico greeting preserved when Pico is selected. Textarea placeholder also dynamic ("Ask [agent name] anything...").
**Files:** `packages/frontend/src/pages/chat.tsx`, `packages/frontend/src/features/pico/chat-panel.tsx`

---

## 2026-04-02 11:23 PDT — UXO.19: Rename Workflows → Automations

**Done:** Renamed sidebar nav label "Workflows" → "Automations", moved it below Work Items. Changed route path `/workflows` → `/automations` (builder route `/workflows/:id` preserved). Updated command palette label and path. Updated nav item ordering in sidebar and command palette.
**Files:** `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/router.tsx`, `packages/frontend/src/features/command-palette/command-palette.tsx`

---

## 2026-04-02 11:23 PDT — UXO.25: Queue tab in Agent Monitor

**Done:** Created `queue-view.tsx` component with TanStack Query polling (5s). Shows position, agent name, work item title, priority badge (color-coded p0-p3), and relative wait time. Empty state: "No queued agents". Added Queue tab to agent-monitor-layout with badge count. Added `getExecutionQueue` API client function and types.
**Files:** `packages/frontend/src/features/agent-monitor/queue-view.tsx` (new), `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`

---

## 2026-04-02 11:23 PDT — UXO.30: Fix Recently Deleted scope

**Done:** Updated `getDeletedWorkItems()` to accept optional projectId parameter. RecentlyDeleted component now uses `useSelectedProject()` and passes projectId to the API call. Added scope badge next to title showing "All Projects" (globe icon) for global or project name (folder icon) for project scope. Re-fetches on project switch.
**Files:** `packages/frontend/src/api/client.ts`, `packages/frontend/src/features/settings/recently-deleted.tsx`

---

## 2026-04-02 11:13 PDT — UXO.9: Fix chat session loading on /chat page

**Done:** Added a mount-time `useEffect` in `use-pico-chat.ts` that calls `refreshSessions()` independent of `isOpen` panel state. Sessions now load on the full `/chat` page, not just when the sidebar panel opens.
**Files:** `packages/frontend/src/hooks/use-pico-chat.ts`

---

## 2026-04-02 11:13 PDT — UXO.10: Remove click-outside-to-close from chat panel

**Done:** Deleted the click-outside `useEffect` handler (lines 131-146) from `chat-panel.tsx`. Panel now only closes via the minimize button — no more accidental dismissals from dropdown interactions or outside clicks.
**Files:** `packages/frontend/src/features/pico/chat-panel.tsx`

---

## 2026-04-02 11:13 PDT — UXO.18: Remove flow view from work items

**Done:** Deleted `flow-view.tsx` component. Removed List/Flow view toggle, `viewOptions` array, `handleViewChange`, and URL param sync for view from `work-items.tsx`. Work items page is now list-only. Updated `WorkItemView` type to just `"list"` in the store.
**Files:** `packages/frontend/src/features/work-items/flow-view.tsx` (deleted), `packages/frontend/src/pages/work-items.tsx`, `packages/frontend/src/stores/work-items-store.ts`

---

## 2026-04-02 11:13 PDT — UXO.24: Add queue endpoint

**Done:** Added `GET /api/executions/queue` endpoint. Exported `getQueueEntries()` and `getMaxConcurrentForProject()` from `concurrency.ts`. Route batch-resolves workItemTitle and agentName via DB joins. Returns queue entries with 1-indexed positions plus `activeCount`, `maxConcurrent`, `queueLength` metadata.
**Files:** `packages/backend/src/agent/concurrency.ts`, `packages/backend/src/routes/executions.ts`

---

## 2026-04-02 11:07 PDT — UXO.8: Add project scope to agents

**Done:** Added `scope` ('global'|'project') and `projectId` (nullable FK) to agents across the full stack. Shared types: added fields to Agent interface, CreateAgentRequest, UpdateAgentRequest. Schema: two new columns on agents table with project relation. Migration 0023. Backend routes: GET filters by projectId (global + matching project), POST validates projectId required for project scope, PATCH handles scope↔projectId transitions correctly. Core: updated AgentRow interface and toAgentRow mapper. Frontend: scope badge (Globe/purple for global, FolderOpen/emerald for project) on agent cards, scope Select dropdown in agent editor auto-sets projectId. Updated useAgents hook and query keys to pass projectId filter.
**Files:** `packages/shared/src/entities.ts`, `packages/shared/src/api.ts`, `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0023_add_agent_scope.sql`, `packages/backend/drizzle/meta/_journal.json`, `packages/backend/src/routes/agents.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/routes/dashboard.ts`, `packages/backend/src/db/repositories.ts`, `packages/core/src/repositories.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/hooks/use-agents.ts`, `packages/frontend/src/hooks/query-keys.ts`, `packages/frontend/src/features/agent-builder/agent-list.tsx`, `packages/frontend/src/features/agent-builder/agent-editor.tsx`

---

## 2026-04-02 10:49 PDT — Review: UXO.7 (approved)

**Done:** Reviewed frontend persona→agent rename. Code review: all 54 files verified, zero remaining persona references, correct renames across hooks/API client/router/sidebar/command palette/CSS vars. Build check: all 4 packages compile clean. Visual check: Agent Builder page (/agent-builder), Chat page (/chat), Dashboard (/) all render correctly with updated labels. Fixed minor grammar: "Choose a agent" → "Choose an agent" in agent-selector.tsx:88.
**Files:** `packages/frontend/src/features/pico/agent-selector.tsx` (grammar fix)

---

## 2026-04-03 17:15 PDT — UXO.7: Frontend persona→agent rename

**Done:** Renamed all persona references → agent across 54 frontend files. Renamed `features/persona-manager/` → `features/agent-builder/` (3 files within: persona-list→agent-list, persona-editor→agent-editor, persona-detail-panel→agent-detail-panel). Renamed hooks: `use-personas.ts`→`use-agents.ts`, `use-persona-assignments.ts`→`use-agent-assignments.ts`. Renamed page `persona-manager.tsx`→`agent-builder.tsx`. Renamed `pico/persona-selector.tsx`→`agent-selector.tsx`. Updated API client: function names (getPersonas→getAgents, etc.), paths (`/api/personas`→`/api/agents`), types. Updated query keys, hooks index, router (path `/personas`→`/agent-builder`), sidebar label "Agent Builder", command palette. Updated all imports and variable names across 54 files. CSS vars `--color-persona-*`→`--color-agent-*`. Frontend builds clean.
**Files:** 54 frontend files (renamed 8 via git mv, updated contents in all 54)
**Notes:** Zero remaining persona code references in frontend (grep confirmed). "Personality" strings in prompt content preserved.

---

## 2026-04-03 16:45 PDT — Review: UXO.6 (approved)

**Reviewed:** Schema + Backend persona→agent rename.
- Schema: `personas` → `agents`, `persona_assignments` → `agent_assignments` table renames ✓
- All 7 `persona_id` → `agent_id` column renames + `assigned_persona_id` → `assigned_agent_id` ✓
- Migration `0022`: 10 valid `ALTER TABLE RENAME` statements (SQLite 3.25+) ✓
- Zero remaining persona code references in backend/core/shared (grep confirmed) ✓
- 3 "persona" hits are "Personality" in prompt content — correct ✓
- Route files renamed, re-registered in server.ts, API paths `/api/agents` ✓
- `default-agents.ts` exports `BUILT_IN_AGENTS` ✓
- Shared + core + backend all build clean ✓
- **Verdict: approved.**

---

## 2026-04-03 16:30 PDT — UXO.6: Schema + Backend persona→agent rename

**Done:** Renamed `personas` table → `agents`, `persona_assignments` → `agent_assignments` in schema. Renamed all `persona_id` columns → `agent_id` across 7 tables. Renamed `assigned_persona_id` → `assigned_agent_id` in work_items. Wrote manual migration `0022_rename_persona_to_agent.sql` (10 ALTER TABLE statements). Renamed 5 files via `git mv` (routes/personas→agents, persona-assignments→agent-assignments, default-personas→default-agents, 2 test files). Updated 53 backend + 3 core source files: all imports, function names, variable names, API paths (`/api/personas`→`/api/agents`), FTS5 tables/triggers/bridge tables. Shared+core+backend all build clean.
**Files:** 56+ backend/core files, `packages/backend/drizzle/0022_rename_persona_to_agent.sql` (new)
**Notes:** Frontend still references old names — addressed by UXO.7.

---

## 2026-04-03 16:15 PDT — Review: UXO.5 (approved)

**Reviewed:** Persona → Agent rename in shared types.
- All 4 shared files updated: ids.ts, entities.ts, api.ts, ws-events.ts ✓
- Type renames: PersonaId→AgentId, Persona→Agent, PersonaSettings→AgentSettings, PersonaAssignment→AgentAssignment, PersonaModel→AgentModel ✓
- Field renames: personaId→agentId, assignedPersonaId→assignedAgentId, persona→agent ✓
- API types renamed (Create/Update requests, Response/ListResponse) ✓
- createId.persona→createId.agent ✓
- AgentId keeps `ps-` prefix for DB compatibility ✓
- Zero remaining persona references (grep confirmed) ✓
- Shared package builds clean ✓
- **Verdict: approved.**

---

## 2026-04-03 16:05 PDT — UXO.5: Rename Persona → Agent in shared types

**Done:** Renamed all Persona references to Agent across 4 shared files. `PersonaId` → `AgentId`, `PersonaModel` → `AgentModel`, `PersonaSettings` → `AgentSettings`, `PersonaAssignment` → `AgentAssignment`, `Persona` → `Agent` interface. Renamed all `personaId` fields → `agentId`, `assignedPersonaId` → `assignedAgentId`, `persona` field → `agent`. Updated `createId.persona` → `createId.agent`. Renamed API types: `CreatePersonaRequest` → `CreateAgentRequest`, `UpdatePersonaRequest` → `UpdateAgentRequest`, `PersonaResponse` → `AgentResponse`, `PersonaListResponse` → `AgentListResponse`. Updated ws-events.ts imports and fields. Shared package builds clean.
**Files:** `packages/shared/src/ids.ts`, `packages/shared/src/entities.ts`, `packages/shared/src/api.ts`, `packages/shared/src/ws-events.ts`
**Notes:** Backend/frontend will have build errors — those are addressed by UXO.6 and UXO.7 respectively.

---

## 2026-04-03 15:55 PDT — Review: UXO.4 (approved)

**Reviewed:** Scope breadcrumb indicator component.
- Clean component with collapsed/expanded states ✓
- Collapsed: 3px colored accent strip on left edge ✓
- Expanded: colored dot + truncated project name ✓
- Violet for global, emerald for regular projects ✓
- Mounted in sidebar between project switcher and navigation ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 15:50 PDT — UXO.4: Add scope breadcrumb indicator

**Done:** Created `scope-indicator.tsx` component showing current project name with colored dot (violet for global, emerald for regular projects). When sidebar is collapsed, renders a thin 3px colored accent strip on the left edge. When expanded, shows dot + project name in `text-xs text-muted-foreground`. Mounted in sidebar between project switcher and navigation. Uses `useSelectedProject` hook for project data and `isGlobal` flag.
**Files:** `packages/frontend/src/components/scope-indicator.tsx` (new), `packages/frontend/src/components/sidebar.tsx`

---

## 2026-04-03 15:45 PDT — Review: UXO.3 (approved)

**Reviewed:** __all__ sentinel removal and global project integration.
- `useSelectedProject` returns real `projectId` (never null) + `isGlobal` flag ✓
- Auto-select defaults to global project via `isGlobal` lookup ✓
- Sidebar: `"__all__"` SelectItem removed, sorted (global first), violet bold styling ✓
- `effectiveProjectId` preserves "no filter" for global scope ✓
- Dashboard and analytics tabs use `isGlobal` from hook ✓
- Zero `__all__` or `isGlobalScope` references remain (grep confirmed) ✓
- Build passes (all 4 packages) ✓
- **Verdict: approved.**

---

## 2026-04-03 15:35 PDT — UXO.3: Replace __all__ sentinel with global project

**Done:** Rewrote `useSelectedProject` to return `"pj-global"` as `projectId` (never null) and `isGlobal` flag from project data. Defaults to global project when no project selected. Removed `"__all__"` sentinel from sidebar — global project now comes from API, sorted first with violet bold styling. Replaced all `isGlobalScope === "__all__"` checks with `isGlobal` from hook (sidebar, dashboard, analytics tabs). Zero remaining `__all__` or `isGlobalScope` references.
**Files:** `packages/frontend/src/hooks/use-selected-project.ts`, `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/pages/dashboard.tsx`, `packages/frontend/src/features/analytics/overview-tab.tsx`, `packages/frontend/src/features/analytics/token-usage-tab.tsx`

---

## 2026-04-03 15:25 PDT — Review: UXO.2 (approved)

**Reviewed:** Nullable projectId migration to pj-global.
- Schema: all 5 previously-nullable projectId columns now `.notNull()` ✓
- Migration 0021: backfill UPDATEs before table recreation — correct ordering ✓
- Workflow routes: `isNull` → `eq(..., "pj-global")`, POST defaults to `"pj-global"` ✓
- Dashboard: `isGlobalProject()` helper, `shouldFilter` logic on all 4 endpoints ✓
- All route handlers use `?? "pj-global"` instead of `?? null` ✓
- Seed/test files: `projectId` added to all execution inserts ✓
- Core interface updated ✓
- Build passes (all 4 packages) ✓
- **Verdict: approved.**

---
