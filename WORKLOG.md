# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 10:30 PDT — Review: RES.WORKFLOW.DATA (approved)

**Reviewed:** Custom workflow data model and state machine storage proposal.
- All 5 investigation points addressed: 3-table schema with DDL (workflows, workflow_states, workflow_transitions), current→dynamic comparison table with 7 components mapped, execution workflow context (workflowId + workflowStateName), soft versioning with publish/draft lifecycle, 3-level persona binding with resolution order ✓
- Current state accurately documented (verified: isValidTransition in mcp-server.ts, WORKFLOW constant, personaAssignments composite PK) ✓
- Migration SQL detailed with seed data, backfill, and personaAssignments PK migration ✓
- Backwards compatibility via hardcoded fallback during migration ✓
- Minor: "copy-on-edit" rejected then essentially re-recommended as "soft versioning" — cosmetic contradiction, final design is sound ✓
- **Verdict: approved.**

---

## 2026-04-02 10:15 PDT — RES.WORKFLOW.DATA: Custom workflow data model research

**Done:** Analyzed current hardcoded workflow system (8 states in `workflow.ts`, `personaAssignments` table, router with hardcoded prompt, `route_to_state` MCP tool, `dispatch.ts` state→persona lookup). Designed 3-table schema: `workflows` (versioned, scoped), `workflow_states` (typed as initial/intermediate/terminal, with position data for visual editor, optional default persona), `workflow_transitions` (labeled edges with optional conditions). Proposed soft versioning: each published version is a separate row, work items pin to their version. 2-level persona binding (workflow defaults + project overrides). Migration seeds "Default" workflow from hardcoded constant, backfills existing items. Detailed SQL for all new tables, modified columns on `workItems` and `executions`, and migration path for `personaAssignments`.
**Files:** `docs/proposals/custom-workflows/data-model.md`

---

## 2026-04-02 09:55 PDT — Review: RES.GLOBAL.UX (approved)

**Reviewed:** Global agent chat and scheduling UX design proposal.
- All 5 investigation points addressed: global chat entry (Pico scope toggle + persona picker, Phase 1/2 split), scheduling (new execution endpoint + 4 entry points), Agent Monitor display (scope badges + filter), mid-conversation context switch (MCP tool + UI fallback with flow diagram), artifact storage (global workspace with per-execution dirs) ✓
- Custom workflow interaction addressed with 3 intersection points ✓
- Entry points summary table (8 entry points, Phase 1/2) ✓
- Files-to-change list with specific components ✓
- Consistent with RES.GLOBAL.DATA and RES.GLOBAL.NAV ✓
- Correctly defers scheduling to RES.SCHED.UX and full-page chat to RES.CHAT.UX ✓
- **Verdict: approved.**

---

## 2026-04-02 09:45 PDT — RES.GLOBAL.UX: Global agent chat and scheduling UX

**Done:** Designed UX flows for 5 investigation points. (1) Global chat entry: Pico panel with scope toggle + persona picker in header, supplemented by command palette quick actions; full-page chat deferred to RES.CHAT.UX. (2) Scheduling: built on new `POST /api/executions/run` endpoint for ad-hoc dispatch; Agent Monitor "New Run" button with modal (persona, scope, prompt, budget). (3) Agent Monitor: scope badges on execution rows, filter dropdown (All/Project/Global), clicking badge navigates to context. (4) Mid-conversation context switch: `set_project_context` MCP tool + UI dropdown fallback; flow diagram with multi-project switching. (5) Artifacts: global workspace `~/.agentops/workspace/runs/<execution>/` with per-execution isolation. Also addressed workflow interaction: global agents use `set_project_context` to access project workflows.
**Files:** `docs/proposals/global-agents/ux-design.md`

---

## 2026-04-02 09:25 PDT — Review: RES.GLOBAL.NAV (approved)

**Reviewed:** Navigation restructure research proposal for project vs global scope.
- All 4 investigation points addressed: similar tools (5 analyzed with comparison table), Dashboard/Activity Feed scope (scope-aware recommended), project selector interaction (3 options, Option A recommended), single/no-project UX (3 scenarios covered) ✓
- 4 ASCII wireframe descriptions covering all key states ✓
- Phase 1/Phase 2 navigation trees with migration path ✓
- Files-to-change list with specific components ✓
- URL scheme decision correct (no change, state-based scoping for local-first app) ✓
- Consistent with RES.GLOBAL.DATA (nullable projectId, scope badges, Pico toggle) ✓
- **Verdict: approved.**

---

## 2026-04-02 09:15 PDT — RES.GLOBAL.NAV: Navigation restructure research

**Done:** Researched navigation patterns from Linear, Jira, Notion, VS Code, and GitHub. Analyzed current sidebar (flat 6-link nav with project selector dropdown). Recommended Option A: keep flat nav, add "All Projects" option to selector, make pages scope-aware. Dashboard and Agent Monitor show aggregated data in global scope; Work Items prompts for project selection; Activity Feed gets filter pills. No URL scheme changes needed — state-based scoping via Zustand. Produced wireframe descriptions for all 4 key states (global dashboard, project work items, global work items prompt, global agent monitor with scope badges). Defined 3-phase migration path and files-to-change list.
**Files:** `docs/proposals/global-agents/navigation-redesign.md`

---

## 2026-04-02 08:40 PDT — Review: RES.GLOBAL.DATA (approved)

**Reviewed:** Data model changes for global agents research proposal.
- All 4 investigation points addressed: table audit (9 tables, nullable analysis), system prompt assembly (executor + chat), execution history (unified recommended), Pico global mode (5 aspects) ✓
- Schema changes minimal and correct: nullable chatSessions.projectId, optional executions.projectId, new global_memories table ✓
- AgentScope discriminated union type is clean ✓
- 4-phase migration plan with 12 steps ✓
- **Verdict: approved.**

---

## 2026-04-02 08:35 PDT — RES.GLOBAL.DATA: Research data model changes for global agents

**Done:** Audited all 9 tables for projectId FKs. 4 have explicit projectId (workItems, personaAssignments, projectMemories, chatSessions). Personas already global (no projectId). Recommended: make chatSessions.projectId nullable, add optional projectId to executions (unified history), create global_memories table. Analyzed system prompt assembly in claude-executor.ts and chat.ts — defined AgentScope type for conditional project context injection. Designed Pico global mode: nullable projectId sessions, scope toggle, adjusted system prompt. 4-phase migration plan.
**Files:** `docs/proposals/global-agents/data-model.md`

---

## 2026-04-02 08:20 PDT — Review: RES.PLUG.CORE (approved)

**Reviewed:** Core package extraction strategy research proposal.
- All 4 investigation points addressed: dependency catalog (25 total, 12 internal), DI container (dismissed), thin extraction (recommended), TS monorepo patterns (tRPC/Prisma/Effect) ✓
- Circular dependency cycle correctly identified (ExecutionManager ↔ dispatch ↔ router) ✓
- 4 options evaluated with effort estimates ✓
- Option B (thin interface extraction) is pragmatic — 3-5 tasks, contracts in core, implementations in backend ✓
- Concrete interface examples and redefined PLUG.3c/3d scope ✓
- **Verdict: approved.**

---

## 2026-04-02 08:15 PDT — RES.PLUG.CORE: Research core package extraction strategy

**Done:** Cataloged all dependencies of ExecutionManager (11 imports: 2 DB, 6 internal, 2 shared, 1 core) and MCP server (14 imports: 3 DB, 6 internal, 2 shared, 3 external). Identified circular dependency cycle between ExecutionManager/dispatch/router/coordination. Evaluated 4 approaches: full extraction (too large), thin interface extraction (recommended), DI container (overcomplicated), Effect pattern (wrong scale). Recommended Option B: extract contracts (Orchestrator, ExecutionManagerPort, infrastructure interfaces) to core while keeping implementations in backend. Referenced tRPC's pattern as closest analog.
**Files:** `docs/proposals/core-package-extraction.md`

---

## 2026-04-02 07:55 PDT — Review: RES.V2.SESSIONS (approved)

**Reviewed:** V2 session configuration research proposal.
- All 4 investigation points addressed: SDKSessionOptions gap (12+ missing fields), session.send() (no config), hybrid workarounds (fragile), SDK roadmap (no timeline) ✓
- Comparison table of 16+ features is clear ✓
- 4 options evaluated, Option C (query with resume) correctly recommended ✓
- Concrete migration plan and files-to-change ✓
- Minor: Option B header says "Recommended" but verdict says fragile — cosmetic issue only
- **Verdict: approved.**

---

## 2026-04-02 07:50 PDT — RES.V2.SESSIONS: Research V2 session configuration for Pico

**Done:** Compared `SDKSessionOptions` vs `query() Options` — found 12+ missing fields (agent, agents, mcpServers, cwd, systemPrompt, maxBudgetUsd, tools, thinking, effort, etc.). V2 sessions can't be configured as Pico. `session.send()` has no per-message options either. Evaluated 4 approaches: wait for SDK (no timeline), hybrid with workarounds (fragile), `query()` with `resume` (recommended), V2+query fallback (complex). Recommended Option C: use `query()` with `resume` for full config control + SDK-managed conversation history.
**Files:** `docs/proposals/v2-session-pico.md`

---

## 2026-04-02 07:40 PDT — Review: RES.SDK.TOOLS (approved)

**Reviewed:** SDK tool discovery research proposal.
- All 4 investigation points addressed: initializationResult() (no tools), sdk-tools.d.ts (21 tools found), canUseTool/PreToolUse (reactive only), version-pinned manifest ✓
- 21 built-in tools enumerated with correct name mappings ✓
- User-facing vs internal categorization sensible ✓
- Option A recommendation is pragmatic with concrete code example ✓
- Clear unblock paths for FX.SDK3 and FX.SDK5 ✓
- **Verdict: approved.**

---

## 2026-04-02 07:35 PDT — RES.SDK.TOOLS: Research SDK tool discovery alternatives

**Done:** Investigated SDK v0.2.87 for tool discovery APIs. Confirmed `initializationResult()` has no `tools` field. Discovered `sdk-tools.d.ts` exports `ToolInputSchemas` type union listing all 21 built-in tools (vs. 8 currently hardcoded). Evaluated `canUseTool` callback and `PreToolUse` hook (both reactive, not suitable for upfront discovery). Recommended Option A: version-pinned shared manifest with user-facing/internal categorization and build-time drift detection. Proposal includes concrete unblock paths for FX.SDK3 and FX.SDK5.
**Files:** `docs/proposals/sdk-tool-discovery.md`

---

## 2026-04-02 07:25 PDT — Review: HK.TEST.RESULTS (approved)

**Reviewed:** Restructure e2e results directory.
- 46 timestamped directories, 0 orphaned files at root ✓
- Spot checks: dashboard-stats, pico-chat, ux-responsive all have correct contents ✓
- README updated: result path format, step 5, directory structure example ✓
- Template unchanged (doesn't reference specific paths) ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 07:20 PDT — HK.TEST.RESULTS: Restructure e2e results directory

**Done:** Reorganized 269 files from flat `tests/e2e/results/` into 46 timestamped directories (`YYYY-MM-DD_HHMM_<test-name>/`). Used git log dates for original run timestamps. Grouped Sprint 22 UX audit and bug fix screenshots into appropriate directories. Updated `tests/e2e/README.md` with new directory structure and result path format. No orphaned files remain.
**Files:** `tests/e2e/results/**` (269 files moved), `tests/e2e/README.md`

---

## 2026-04-02 07:05 PDT — Review: UX.AGENT.BREADCRUMB (approved)

**Reviewed:** Breadcrumb trail + side panel overlay for Agent Monitor.
- Breadcrumb `Parent > Work Item` with ChevronRight replaces ghost buttons ✓
- `onWorkItemClick` callback prop, optional for backwards compat ✓
- Side panel: absolute positioned overlay with X close, renders DetailPanel ✓
- `useNavigate`/`useWorkItemsStore` moved from control bar to layout ✓
- No unused imports, build clean ✓
- **Verdict: approved.**

---

## 2026-04-02 07:00 PDT — UX.AGENT.BREADCRUMB: Breadcrumb trail + side panel overlay

**Done:** Replaced "Work Item" and "Parent" ghost buttons in `agent-control-bar.tsx` with inline breadcrumb trail (`Parent Title > Work Item Title`) using `ChevronRight` separators. Clicking a breadcrumb segment calls `onWorkItemClick` callback instead of navigating away. Added side panel overlay to `agent-monitor-layout.tsx` — absolute-positioned panel with close button renders `DetailPanel` from work-items feature. Removed `useNavigate` and `useWorkItemsStore` imports from control bar (moved to layout). Added `handleWorkItemClick` callback that sets `selectedItemId` in store and opens the overlay.
**Files:** `packages/frontend/src/features/agent-monitor/agent-control-bar.tsx`, `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`
**Notes:** Cannot visually test breadcrumb with no running agents, but build passes and page renders clean. Breadcrumb only shows when an agent execution has a work item.

---

## 2026-04-02 06:45 PDT — Review: FX.UX.PERSONA.3 (approved)

**Reviewed:** Delete selected persona 404 toast fix.
- `onSelect` prop widened to `PersonaId | null`, `onSelect(null)` called on delete of selected persona ✓
- `deletingSelected` captured before async mutation (avoids stale closure) ✓
- `removeQueries` evicts deleted persona cache before list invalidation — prevents 404 refetch race ✓
- Parent `setSelectedId` signature compatible ✓
- Visual: no toast, detail panel closes cleanly ✓
- Build passes clean ✓
- **Verdict: approved.**

---

## 2026-04-02 06:40 PDT — FX.UX.PERSONA.3: Fix delete selected persona 404 toast

**Done:** Two-part fix: (1) Widened `onSelect` prop type to `PersonaId | null` and added `onSelect(null)` call in `handleDeleteConfirm` when deleting the selected persona — closes the detail panel. (2) Added `queryClient.removeQueries()` for the deleted persona's individual query key in `useDeletePersona` hook — prevents stale query refetch that triggered the `get()` helper's global error toast (same root cause pattern as FX.UX.AGENT.2).
**Files:** `packages/frontend/src/features/persona-manager/persona-list.tsx`, `packages/frontend/src/hooks/use-personas.ts`
**Notes:** Both changes needed — without removeQueries, the toast still fires from a race between cache invalidation and component unmount.

---

## 2026-04-02 06:30 PDT — Review: FX.UX.PERSONA.2 (approved)

**Reviewed:** Built-in persona label mismatch fix.
- `BUILT_IN_IDS` exported from persona-list.tsx, imported in persona-detail-panel.tsx ✓
- `isBuiltIn` check replaced from `settings.isSystem` to `BUILT_IN_IDS.has()` — consistent with list view ✓
- No circular imports, null-safe ✓
- Visual: Engineer detail panel shows "Built-in persona" + badge ✓
- Build passes clean ✓
- **Verdict: approved.**

---

## 2026-04-02 06:25 PDT — FX.UX.PERSONA.2: Fix built-in persona label mismatch

**Done:** Exported `BUILT_IN_IDS` from `persona-list.tsx` and imported it in `persona-detail-panel.tsx`. Replaced `persona?.settings?.isSystem === true` check with `BUILT_IN_IDS.has(persona.id)` to match the same logic used in the list view. Now all built-in personas (PM, Tech Lead, Engineer, Code Reviewer) consistently show "Built-in persona" label and "Built-in" badge in both the card grid and the detail panel.
**Files:** `packages/frontend/src/features/persona-manager/persona-list.tsx`, `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`
**Notes:** Root cause was that only Router and Pico had `isSystem: true` in backend seed data; the other 4 built-in personas didn't. Using `BUILT_IN_IDS` is the authoritative source.

---

## 2026-04-02 06:15 PDT — Review: FX.UX.PERSONA.1 (approved)

**Reviewed:** Persona cards keyboard accessibility fix.
- `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space with preventDefault), focus-visible ring classes all present ✓
- `CreateCard` already a native `<button>` — correctly left unchanged ✓
- Visual verification: Tab focuses cards, Enter opens detail panel ✓
- Build passes clean ✓
- **Verdict: approved.**

---

## 2026-04-02 06:10 PDT — FX.UX.PERSONA.1: Persona cards keyboard accessibility

**Done:** Added `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space), and `focus-visible:ring-2` classes to `PersonaCard` div in `persona-list.tsx`. Cards are now keyboard-navigable via Tab with visible focus ring and activatable via Enter/Space. `CreateCard` was already a `<button>` element — no change needed.
**Files:** `packages/frontend/src/features/persona-manager/persona-list.tsx`
**Notes:** Verified visually — Tab focuses cards with ring, Enter opens detail panel. Screenshots at `tests/e2e/results/fx-persona-a11y-*.png`.

---

## 2026-04-02 06:00 PDT — Review: FX.UX.REWIND (approved)

**Reviewed:** Disabled rewind button tooltip fix.
- `<span className="inline-flex">` wrapper around disabled `<Button>` inside `TooltipTrigger asChild` ✓
- Tooltip shows correct text for both enabled/disabled states ✓
- Visual verification: tooltip visible on hover over disabled buttons in History tab ✓
- Build passes clean ✓
- **Verdict: approved.**

---

## 2026-04-02 05:55 PDT — FX.UX.REWIND: Fix disabled rewind button tooltip

**Done:** Wrapped the disabled `<Button>` inside `<TooltipTrigger asChild>` with a `<span className="inline-flex">` wrapper so the tooltip trigger receives pointer events even when the button is disabled. Tooltip now shows "No file checkpoint available (legacy execution)" on hover over disabled rewind buttons in Agent Monitor History.
**Files:** `packages/frontend/src/features/agent-monitor/agent-history.tsx`
**Notes:** Verified visually — tooltip appears on hover over disabled buttons. Screenshot at `tests/e2e/results/fx-rewind-tooltip-visible.png`.

---

## 2026-04-02 05:45 PDT — Review: FX.PICO.EXEC (approved)

**Reviewed:** Claude Code executable path resolution fix.
- `getClaudeCodeExecutablePath()` helper in config.ts: env var override, createRequire resolution, caching, fallback ✓
- All 4 `query()` call sites have `pathToClaudeCodeExecutable` option: chat.ts:355, claude-executor.ts:559, memory.ts:187, memory.ts:351 ✓
- Imports correct at all 4 files ✓
- Build passes clean ✓
- **Verdict: approved.**

---

## 2026-04-02 05:30 PDT — FX.PICO.EXEC: Fix Claude Code executable not found

**Done:** Added `getClaudeCodeExecutablePath()` helper to `config.ts` that resolves the SDK's bundled `cli.js` path (or uses `CLAUDE_CLI_PATH` env var override). Added `pathToClaudeCodeExecutable` option to all 4 `query()` call sites: `chat.ts` (Pico chat), `claude-executor.ts` (agent execution), and `memory.ts` (2 calls: summarizer + consolidation). The helper uses `createRequire` to resolve the SDK package path, caches the result, and falls back to `"claude"` if resolution fails.
**Files:** `packages/backend/src/config.ts`, `packages/backend/src/routes/chat.ts`, `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/agent/memory.ts`
