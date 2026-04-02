# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

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

## 2026-04-03 15:15 PDT — UXO.2: Migrate nullable projectId to pj-global

**Done:** Made `projectId` NOT NULL on 5 tables: `executions`, `chat_sessions`, `workflows`, `webhook_triggers`, `schedules`. Migration `0021` backfills NULL → `pj-global` before table recreation. Updated all route handlers to use `?? "pj-global"` instead of `?? null`. Replaced `isNull(workflows.projectId)` with `eq(workflows.projectId, "pj-global")` in workflow list query. Updated dashboard to skip filtering when global project selected (`isGlobalProject()` helper). Fixed all seed/test files to include `projectId` in execution inserts. Updated `ExecutionRepository.create` interface in core package. `global_memories` table has no `projectId` column — skipped (already implicitly global).
**Files:** `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0021_fluffy_multiple_man.sql`, `packages/backend/src/routes/chat.ts`, `packages/backend/src/routes/workflows.ts`, `packages/backend/src/routes/executions.ts`, `packages/backend/src/routes/dashboard.ts`, `packages/backend/src/routes/webhook-triggers.ts`, `packages/backend/src/routes/schedules.ts`, `packages/backend/src/db/seed.ts`, `packages/backend/src/db/seed-demo.ts`, `packages/backend/src/db/seed-workflow.ts`, `packages/backend/src/db/repositories.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/__tests__/startup-cleanup.test.ts`, `packages/backend/src/test/setup.ts`, `packages/core/src/repositories.ts`

---

## 2026-04-03 14:55 PDT — Review: UXO.1 (approved)

**Reviewed:** isGlobal column addition to projects.
- Schema uses `integer("is_global", { mode: "boolean" })` — matches existing boolean pattern ✓
- Migration `0020` correct DDL ✓
- Shared `Project` type includes `isGlobal: boolean` ✓
- `serializeProject` includes `isGlobal` ✓
- Seed creates `pj-global` with `isGlobal: true`, empty path ✓
- Delete guard: 404 not found, 409 if global, then delete — correct ✓
- `execution-manager.ts` both branches include `isGlobal` ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 14:45 PDT — UXO.1: Add isGlobal to projects schema

**Done:** Added `isGlobal` boolean column (default false) to `projects` table in schema. Added `isGlobal` to shared `Project` interface. Generated migration `0020_gigantic_cable.sql`. Updated seed to create permanent global project (`id: "pj-global"`, `name: "All Projects"`, `isGlobal: true`, empty path). Added delete guard in `DELETE /api/projects/:id` — returns 409 if `isGlobal`. Updated `serializeProject` to include `isGlobal`. Fixed `execution-manager.ts` project entity construction to include `isGlobal`.
**Files:** `packages/backend/src/db/schema.ts`, `packages/shared/src/entities.ts`, `packages/backend/src/routes/projects.ts`, `packages/backend/src/db/seed.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/drizzle/0020_gigantic_cable.sql`

---

## 2026-04-03 14:40 PDT — Review: FX.PERF.1 (approved)

**Reviewed:** N+1 dependency check batch query fix.
- `inArray` imported from drizzle-orm ✓
- Loop replaced with single `inArray(workItems.id, depIds)` query ✓
- JS-side `.filter()` preserves same terminal-state check logic ✓
- `pendingDeps` shape unchanged — downstream code (depList, comment) unaffected ✓
- Empty `depIds` guarded by `if (dependencies.length > 0)` ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 14:35 PDT — FX.PERF.1: Fix N+1 query in dependency check

**Done:** Replaced per-dependency loop query (N queries for N upstream deps) with a single `inArray(workItems.id, depIds)` query. Collect all `fromId` values first, fetch all upstream items in one batch, then filter for non-terminal states in JS. Added `inArray` import from drizzle-orm.
**Files:** `packages/backend/src/agent/dispatch.ts`

---

## 2026-04-03 14:30 PDT — Review: FX.TYPE.2 (approved)

**Reviewed:** HandoffNote import deduplication.
- Local `HandoffNote` interface removed, replaced with import from `@agentops/shared` ✓
- Shared definition identical (6 fields, same types) ✓
- Re-export preserves module's public API ✓
- Only consumer (`execution-manager.ts`) imports functions, not the type — unaffected ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-03 14:25 PDT — FX.TYPE.2: Import HandoffNote from shared

**Done:** Removed the duplicated `HandoffNote` interface from `handoff-notes.ts` and replaced it with `import type { HandoffNote } from "@agentops/shared"`. Added `export type { HandoffNote }` re-export so the module's public API is unchanged. The shared definition in `entities.ts` is identical — no behavioral change.
**Files:** `packages/backend/src/agent/handoff-notes.ts`

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
