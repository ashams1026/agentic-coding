# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 16:40 PDT — Review: RES.PROMPTS.VARS (approved)

**Reviewed:** Template variable research doc for persona prompts.
- All 5 investigation areas covered: syntax ({{var}} with comparison table), built-in vars (15 total, split by availability), user-defined vars (vars.* namespace, schema, UI), resolution (when/where/undefined behavior), UI support (autocomplete, reference panel, preview)
- Design decisions well-reasoned: substitution-only (no template language), namespace separation, one-time resolution at prompt-build time
- resolveVariables() regex correct (negative lookbehind for escaping, whitespace trimming)
- Architecture integration point accurately identified (between DB read and sections push)
- 4-phase implementation plan is practical and incremental
- Written to correct output path
- **Verdict: approved.**

---

## 2026-04-02 16:35 PDT — RES.PROMPTS.VARS: Research template variables for prompts

**Done:** Researched and documented template variable support for persona prompts. Doc covers all 5 investigation areas: (1) syntax — recommends `{{variable.name}}` (Mustache-style), with comparison table vs `${var}`, `{var}`, etc., (2) built-in variables — 10 prompt-time vars (project.*, persona.*, date.*) + 5 execution-time vars (workItem.*, workflow.*), with table of what's NOT available as variables and why, (3) user-defined variables — `vars.*` namespace, `project_variables` table schema, Settings UI location, (4) resolution — `resolveVariables()` in `buildSystemPrompt()`, undefined vars left as-is with warning, no logic/conditionals, (5) UI — autocomplete on `{{`, variable reference panel, enhanced preview with resolved values. Includes 4-phase implementation plan and architecture relationship.
**Files:** `docs/proposals/persona-prompts/template-variables.md` (new)

---

## 2026-04-02 16:25 PDT — Review: RES.PROMPTS.DOC (approved)

**Reviewed:** Persona prompt pipeline documentation.
- All 5 task requirements covered (storage, assembly, Pico path, SDK delivery, user vs system control)
- Verified `buildSystemPrompt()` assembly order against source (lines 25-97) — exact match
- Verified Pico chat assembly against `chat.ts` (lines 274-313) — exact match
- Verified SDK delivery and subagent prompt fallback (line 517) — accurate
- Architecture diagrams, section format details, and comparison tables all correct
- Written to correct output path `docs/proposals/persona-prompts/current-architecture.md`
- **Verdict: approved.**

---

## 2026-04-02 16:20 PDT — RES.PROMPTS.DOC: Document persona prompt pipeline

**Done:** Traced and documented the full persona prompt storage and assembly pipeline. Doc covers: (1) persona DB schema (`systemPrompt` TEXT field), (2) editor UI (textarea, no structured fields), (3) `buildSystemPrompt()` in claude-executor.ts — 5-section assembly with `\n\n` separators (user prompt → project context → work item → sandbox → history), (4) Pico chat assembly — 4-section variant (user prompt → skill file → project context → personality), (5) SDK delivery via `AgentDefinition.prompt` in `query()`, (6) user-controlled vs system-injected table, (7) project memories are on-demand via MCP tool only. Includes architecture diagrams.
**Files:** `docs/proposals/persona-prompts/current-architecture.md` (new)
**Notes:** Key finding: subagents only get raw `systemPrompt` or `description` — no project/task/sandbox injection. Memories are never auto-injected.

---

## 2026-04-02 16:10 PDT — Review: UX.BRAND.WOOF (approved)

**Reviewed:** Rebrand all user-visible "AgentOps" references to "Woof".
- Page title "Woof" in index.html with favicon.svg link tag
- SVG paw-print favicon (amber bg, white paw, 3 toes + main pad) — well-formed
- Sidebar brand: Dog icon + "Woof" text above project switcher, collapses to icon only
- Status bar, mobile header, settings, tool-config all say "Woof"
- Only remaining "AgentOps" in frontend is a CSS comment (developer-facing) — correct per spec
- Build passes, visual check on dashboard, chat, and settings pages confirms correct layout
- **Verdict: approved.**

---

## 2026-04-02 16:05 PDT — UX.BRAND.WOOF: Rebrand app as Woof

**Done:** Rebranded all user-visible "AgentOps" references to "Woof". Changes: (1) page title in index.html → "Woof", (2) new SVG paw-print favicon (amber background, white paw) in `public/favicon.svg` with link tag in index.html, (3) sidebar header — added Woof brand row with amber Dog icon + "Woof" text above the project switcher, (4) status bar "AgentOps" → "Woof", (5) mobile top bar "AgentOps" → "Woof", (6) settings appearance "AgentOps background service" → "Woof background service", (7) tool-configuration "AgentOps Tools" → "Woof Tools". Pico's avatar already uses Dog icon with amber theme — no changes needed. No login/splash screen exists. Code/package names and developer-facing docs left as "AgentOps".
**Files:** `packages/frontend/index.html`, `packages/frontend/public/favicon.svg` (new), `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/components/status-bar.tsx`, `packages/frontend/src/layouts/root-layout.tsx`, `packages/frontend/src/features/settings/appearance-section.tsx`, `packages/frontend/src/features/persona-manager/tool-configuration.tsx`

---

## 2026-04-02 15:45 PDT — Review: UX.PICO.COLLAPSE (approved)

**Reviewed:** Replace X icon with ChevronDown on mini chat panel.
- ChevronDown icon at line 330 replaces X ✓
- Tooltip says "Minimize" (not "Close") ✓
- Unused X import removed from lucide-react ✓
- Build passes, visual check confirms chevron visible in header ✓
- **Verdict: approved.**

---

## 2026-04-02 15:40 PDT — UX.PICO.COLLAPSE: Replace X with collapse chevron

**Done:** Replaced the close (X) button in the Pico mini chat panel header with a downward ChevronDown icon to indicate minimize/collapse behavior instead of close/end. Tooltip already said "Minimize" from prior work. Removed unused `X` import from lucide-react. `ChevronDown` was already imported.
**Files:** `packages/frontend/src/features/pico/chat-panel.tsx`

---

## 2026-04-02 15:30 PDT — Review: UX.PICO.FULLPAGE (approved)

**Reviewed:** Full-page chat view with session sidebar and verbose rendering.
- New `/chat` page with session sidebar, click-to-switch, double-click-to-rename ✓
- `compact={false}` renders expandable thinking blocks, full tool call cards with chevrons ✓
- Centered max-w-3xl layout, spacious typography ✓
- Maximize2 expand button in mini panel header navigates to `/chat` ✓
- MessageSquare "Chat" nav item in sidebar ✓
- Mini panel + bubble hidden on `/chat` via useLocation check ✓
- Minimize button returns to previous page and reopens mini panel ✓
- Build passes, visual check on both `/chat` and dashboard confirms correct behavior ✓
- **Verdict: approved.**

---

## 2026-04-02 15:20 PDT — UX.PICO.FULLPAGE: Full-page chat view

**Done:** Created `/chat` full-page view with session sidebar and verbose message rendering. New `pages/chat.tsx` with: (1) session sidebar (256px) showing all conversations with click-to-switch, double-click-to-rename, clear all; (2) main chat area using `ChatMessage` with `compact={false}` — expandable thinking blocks, full tool call cards with chevrons, rich markdown; (3) centered max-w-3xl layout with spacious typography. Added `Maximize2` expand button to mini panel header (navigates to `/chat`, closes overlay). Added `MessageSquare` "Chat" nav item in sidebar. Hid mini panel and chat bubble on `/chat` route via `useLocation` check in `root-layout.tsx`. Minimize button in full-page view navigates back and reopens mini panel.
**Files:** `packages/frontend/src/pages/chat.tsx` (new), `packages/frontend/src/router.tsx`, `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/features/pico/chat-panel.tsx`, `packages/frontend/src/layouts/root-layout.tsx`

---

## 2026-04-02 15:05 PDT — Review: UX.PICO.STATUSBAR (approved)

**Reviewed:** Consolidated status line for thinking/tool calls in compact mode.
- Single StatusLine replaces separate one-liners — timer-based cycling with 1.5s min display ✓
- Counter + expandable chevron with border-left styled list ✓
- Rich labels via getToolDescription (file paths, commands, patterns, queries) ✓
- History fix: useState lazy init skips to last item on mount — no cycling for loaded history ✓
- CompactMessageBody separates status/text blocks cleanly ✓
- Full non-compact rendering unchanged ✓
- Build passes, visual check confirms layout, expand, and history behavior ✓
- **Verdict: approved.** Includes post-review history fix (no-delay for non-streaming).

---

## 2026-04-02 14:55 PDT — UX.PICO.STATUSBAR: Consolidated status line for thinking/tool calls

**Done:** Replaced separate compact thinking/tool_use one-liners with a single animated `StatusLine` component. In compact mode, all thinking and tool_use blocks are collected into status items and rendered as one updating line that auto-advances through items with 1.5s minimum display time. Shows a counter (e.g. "3/3") and an expand chevron to reveal the full list with left-border styling. Added `getToolDescription()` for rich labels — extracts file paths from Read/Edit/Write (`pathBasename`), commands from Bash (`truncStr`), patterns from Grep/Glob, queries from WebSearch, descriptions from Agent tool. `CompactMessageBody` separates status blocks from text blocks, rendering StatusLine + PicoMarkdown. Updated mock data to use Read tool for better demo labels. Full (non-compact) rendering unchanged.
**Files:** `packages/frontend/src/features/pico/chat-message.tsx`
**Notes:** The `CompactThinking` and `CompactToolCall` components are still present for potential reuse in the expanded list but are currently unused — StatusLine renders its own inline items.

---

## 2026-04-02 14:40 PDT — Review: UX.PICO.RESIZE (approved)

**Reviewed:** Drag-to-resize on Pico chat panel — top, left, and corner handles.
- Resize handles correctly positioned with appropriate cursors (ns, ew, nwse) ✓
- Min/max constraints enforced: 320x400 min, 600x80vh max, CSS `min()` safety net ✓
- Delta calculation correct: dragging left/up grows panel (anchored bottom-right) ✓
- Event listeners cleaned up on mouseup, preventDefault blocks text selection ✓
- Animation suppressed during resize, content reflows responsively ✓
- Size persisted in Zustand store with localStorage persistence ✓
- Build passes, visual check confirms no layout issues ✓
- **Verdict: approved.**

---

## 2026-04-02 14:25 PDT — UX.PICO.RESIZE: Drag-to-resize on Pico chat panel

**Done:** Added drag-to-resize on top edge (ns-resize), left edge (ew-resize), and top-left corner (nwse-resize) of the Pico chat panel. Constraints: min 320x400, max 600x80vh. Dimensions persisted via Zustand `persist` middleware in `pico-store.ts` (`panelWidth`, `panelHeight`, `setPanelSize`). Panel style uses dynamic `width`/`height` from store instead of hardcoded `w-[400px]`. Resize handles are invisible 2px-wide zones on edges with appropriate cursors. Animation class suppressed during resize to prevent jank. Content reflows responsively — wider panel means longer message lines. Verified: drag left edge → panel widens, size persists across reload.
**Files:** `packages/frontend/src/features/pico/chat-panel.tsx`, `packages/frontend/src/features/pico/pico-store.ts`

---

## 2026-04-02 14:10 PDT — Review: UX.PICO.MINI.CONTENT (approved)

**Reviewed:** Compact thinking and tool call rendering in mini chat panel.
- Thinking: single italic "Thinking..." line with brain icon, not expandable ✓
- Tool calls: "Used Bash — summary..." one-liners with icon + status, no card/expand ✓
- Markdown text rendering unchanged — paragraphs, bullets, bold, code all correct ✓
- `compact` prop (default true) flows ChatMessage → ContentBlockRenderer → compact/full variants ✓
- Full verbose rendering preserved for `compact={false}` (future UX.PICO.FULLPAGE) ✓
- TOOL_ICONS correctly moved above compact components to avoid reference-before-definition ✓
- Build passes, visual verification confirms all three requirements met ✓
- **Verdict: approved.**

---

## 2026-04-02 14:00 PDT — UX.PICO.MINI.CONTENT: Compact thinking and tool calls in mini panel

**Done:** Added `compact` prop (default `true`) to `ChatMessage` and `ContentBlockRenderer`. In compact mode: (1) thinking blocks render as a single italic "Thinking..." line with Brain icon — no expandable card, no border, (2) tool calls render as "Used Bash — summary..." one-liners with tool icon + status indicator — no expandable card, no input/output details. Full verbose rendering (expandable `ThinkingBlock` and `ToolCallCard`) is preserved for `compact={false}` (future full-page view). Moved `TOOL_ICONS` map above compact components to avoid reference-before-definition. Verified visually: thinking block is now a single line, tool calls are compact one-liners, markdown text rendering unchanged.
**Files:** `packages/frontend/src/features/pico/chat-message.tsx`

---

## 2026-04-02 13:45 PDT — Review: FX.PICO.EMPTY.BUBBLE (approved)

**Reviewed:** Fix for empty chat bubble appearing before streaming content.
- `isEmptyStreaming` guard correctly checks 3 conditions (isStreaming, last message, empty content) — won't affect non-streaming or populated messages ✓
- TypingIndicator guard condition unchanged, still shows only when content is empty ✓
- Margin changed from `mt-1` to `mt-3` compensates for removed empty bubble spacing ✓
- Single file change, minimal and focused ✓
- Build passes, visual verification confirms no regressions ✓
- **Verdict: approved.**

---

## 2026-04-02 13:35 PDT — FX.PICO.EMPTY.BUBBLE: Hide empty bubble during streaming

**Done:** When Pico starts streaming, a message with empty `content: []` was added to the messages array. `ChatMessage` rendered this as an empty bubble (avatar + muted background + padding, no text) before the TypingIndicator below it. Fix: in `chat-panel.tsx`, skip rendering the last message during streaming if its content array is empty (`return null` from the map). The TypingIndicator already handles this state — changed its margin from `mt-1` to `mt-3` to provide proper spacing since the empty bubble no longer precedes it. Verified: panel renders correctly with existing messages, no regressions.
**Files:** `packages/frontend/src/features/pico/chat-panel.tsx`

---

## 2026-04-02 13:20 PDT — Review: FX.PICO.OVERFLOW (approved)

**Reviewed:** Fix for Pico chat content overflowing out of the panel.
- `w-0 min-w-full` on inner ScrollArea container is correct pattern for preventing Radix viewport content expansion ✓
- `overflow-hidden break-words min-w-0` on bubble ensures text wraps and flex item shrinks ✓
- `overflow-hidden` on message row and PicoMarkdown root prevents child-driven expansion ✓
- Visual verification: text wraps properly, long paths break, all content within panel borders ✓
- Build passes clean, minimal two-file CSS-only change ✓
- **Verdict: approved.**

---

## 2026-04-02 13:10 PDT — FX.PICO.OVERFLOW: Fix chat content overflow

**Done:** Content in Pico chat panel was overflowing past the panel's right edge. Three CSS fixes: (1) Inner messages container inside ScrollArea uses `w-0 min-w-full overflow-hidden` to prevent content from expanding beyond the Radix ScrollArea viewport width, (2) message bubble gets `min-w-0 overflow-hidden break-words` to clip and wrap long content, (3) message row gets `overflow-hidden` to prevent children from pushing the flex row wider. Also added `overflow-hidden` on PicoMarkdown root div. Verified visually: text now wraps properly, long paths break correctly, all content stays within panel borders.
**Files:** `packages/frontend/src/features/pico/chat-panel.tsx`, `packages/frontend/src/features/pico/chat-message.tsx`

---

## 2026-04-02 12:50 PDT — Review: FX.PERSONA.SEED (approved)

**Reviewed:** Fix for built-in personas missing — only Pico visible.
- Root cause correctly identified: old `existing.length === 0` check meant Pico's existence blocked all other persona seeding ✓
- `ensureBuiltInPersonas()` is idempotent: queries by name, inserts only missing personas ✓
- Settings mapping correct: Router/Pico get system flags, others get empty settings ✓
- Startup call in `start.ts:219` placed after migrations and before crash recovery — correct ordering ✓
- `seedDefaultPersonasForProject()` calls `ensureBuiltInPersonas()` first, no regression in project creation ✓
- Build passes clean, minimal two-file change ✓
- **Verdict: approved.**

---

## 2026-04-02 12:30 PDT — FX.PERSONA.SEED: Fix built-in personas not seeding

**Done:** Root cause: `seedDefaultPersonasForProject()` checked `existing.length === 0` — if even one persona existed (Pico), it skipped seeding the other 5 built-in personas. Fix: extracted `ensureBuiltInPersonas()` that checks each built-in persona by name and inserts any missing ones. Made it idempotent. Also added startup call in `start.ts` so personas are ensured on every server boot, not just on project creation. Verified: all 6 personas (Pico, PM, Tech Lead, Engineer, Code Reviewer, Router) now appear on `/personas` page.
**Files:** `packages/backend/src/db/default-personas.ts`, `packages/backend/src/start.ts`

---

## 2026-04-02 12:10 PDT — Review: FX.WORK.EDIT (approved)

**Reviewed:** Fix for work item mutations not persisting.
- Root cause correctly identified: stale `selectedProjectId` in localStorage pointing to nonexistent `pj-agntops` ✓
- Fix 1 (sidebar.tsx): auto-selection validates persisted ID against projects list, falls back to first real project. Handles edge cases (null, stale, valid, empty list) correctly ✓
- Fix 2 (client.ts): removed silent `try/catch` in `updateWorkItem()` — errors now propagate to TanStack Query `onError` for proper optimistic rollback + error toast ✓
- Return type correctly updated from `WorkItem | null` to `WorkItem` ✓
- Build passes, visual verification via chrome-devtools confirmed fix (items visible, no 404 toast, PATCH 200 OK) ✓
- Minimal change, no unnecessary refactoring ✓
- **Verdict: approved.**

---

## 2026-04-02 12:00 PDT — FX.WORK.EDIT: Fix work item mutations not persisting

**Done:** Root cause: stale `selectedProjectId` in localStorage. The UI store persists `selectedProjectId` via Zustand `persist` middleware. The value `pj-agntops` (from old seed data) was persisted, but that project no longer exists in the DB — the only real project is `pj-vjZvl1m`. The sidebar's auto-selection logic only fired when `selectedProjectId` was null, not when it pointed to a nonexistent project. Fix 1: Updated sidebar auto-selection in `sidebar.tsx` to validate the persisted selection against the actual projects list — if the selected project doesn't exist, auto-select the first real project. Fix 2: Removed silent error swallowing in `updateWorkItem()` in `client.ts` — errors now propagate to TanStack Query's `onError` handler, which properly reverts optimistic updates and shows the error toast. Verified via chrome-devtools: backend PATCH works correctly (200 OK), work items now display and are editable.
**Files:** `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/api/client.ts`

---

## 2026-04-02 11:35 PDT — Review: RES.WORKFLOW.RUNTIME (approved)

**Reviewed:** Custom workflow runtime execution proposal.
- All 5 investigation points addressed: router workflow-awareness (dynamic prompt from DB, terminal short-circuit, Phase 2 custom router), work item binding (per-project default + per-item override, 3-level resolution), scope interaction (global workflows usable by any project, projectless deferred), frontend adaptation (8 view-by-view changes, React Query hooks, mixed version strategy), migration path (3-phase dual-read → full dynamic → cleanup) ✓
- Hardcoded touchpoints table (16 entries) verified against actual source files ✓
- Correct identification that async validation can't live in shared package → new `workflow-runtime.ts` backend module ✓
- "Blocked" convention (Option A: search by name, not 4th state type) is pragmatic ✓
- Consistent with RES.WORKFLOW.DATA (3-table schema, version pinning, persona binding) ✓
- Consistent with RES.WORKFLOW.BUILDER (shared router, builder validation) ✓
- Consistent with RES.GLOBAL.UX (`set_project_context` for global agent interaction) ✓
- Files-to-change comprehensive: 3 new + 6 backend + 8 frontend + 1 shared ✓
- Phase 2 declarative conditions well-designed (outcome, childrenComplete, always, null fallback) ✓
- **Verdict: approved.**

---

## 2026-04-02 11:20 PDT — RES.WORKFLOW.RUNTIME: Custom workflow runtime execution research

**Done:** Investigated all 5 areas for making the workflow runtime dynamic. (1) Router: shared Router persona with workflow-aware dynamic prompt built from DB-backed states/transitions (replaces hardcoded ROUTER_BASE_PROMPT); terminal state short-circuit; Phase 2 per-workflow router persona. (2) Work item binding: per-project default (projects.workflowId) + per-item override (workItems.workflowId) for version pinning; resolution order: item → project → 'wf-default'. (3) Scope: global workflows usable by any project; items always project-scoped (Phase 1); projectless items deferred. (4) Frontend: React Query hooks (useWorkflowStates/useWorkflowTransitions) replace WORKFLOW constant in flow-view, board-view, list-view, filter-bar, detail-panel, settings; mixed version strategy with union display + version badges. (5) Migration: 3-phase approach (dual-read fallback → full dynamic → cleanup). Also designed: resolvePersonaForState() with 2-level resolution, workflow-aware MCP tools (route_to_state, create_children, flag_blocked), execution record enrichment, Phase 2 declarative transition conditions, new workflow-runtime.ts backend module.
**Files:** `docs/proposals/custom-workflows/runtime-execution.md`

---

## 2026-04-02 11:00 PDT — Review: RES.WORKFLOW.BUILDER (approved)

**Reviewed:** Workflow builder UX design proposal.
- All 6 investigation points addressed: hybrid editor (form + preview), add step (4-step flow with defaults + transition definition), delete step (auto-cascade + confirmation + fallback state), reorder (visual only, transitions unchanged), validation (8 rules, real-time, errors block publish), router (shared with dynamic prompt, Phase 2 declarative conditions) ✓
- Current state accurately documented (flow-view.tsx hand-built CSS, no graph library, workflow-config-section.tsx) ✓
- 3 interaction flows (create, edit, assign personas) ✓
- Circular transitions correctly allowed (rejection cycles) with router anti-loop reference ✓
- Files-to-change list comprehensive (5 new components + backend + hooks + shared validation) ✓
- Consistent with RES.WORKFLOW.DATA (sort_order, versioning, persona binding) ✓
- **Verdict: approved.**

---

## 2026-04-02 10:50 PDT — RES.WORKFLOW.BUILDER: Workflow builder UX research

**Done:** Evaluated 3 editor models (visual node/edge, form list, hybrid). Recommended hybrid: form-based state list in left panel + auto-laid-out visual preview in right panel. No graph library for Phase 1 — hand-built CSS like existing flow-view.tsx. Designed: add step flow (inline defaults, transition definition with target dropdown + label), delete step (auto-cascade transitions + confirmation with fallback state for active work items), reorder (drag handle, visual only — doesn't affect transitions). 8-rule validation system (errors block publish, warnings advisory). Router: shared router with workflow-aware dynamic prompt (Phase 1), declarative conditions (Phase 2). 3 interaction flows (create, edit, assign personas). ASCII wireframe of full builder layout with validation panel.
**Files:** `docs/proposals/custom-workflows/builder-ux.md`

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
