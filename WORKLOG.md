# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 13:42 PDT — UXO.27: Move Schedules to Automations page

**Done:** Extended ScheduleCard with edit, delete, and run-now action buttons. Renamed NewScheduleDialog → ScheduleDialog with `editingSchedule` prop for edit mode (pre-fills form, uses PATCH). Added `updateScheduleApi`, `deleteScheduleApi`, `runNowApi` helpers. Removed Scheduling tab from settings-layout.tsx (Clock import, SECTIONS entry, SchedulingSection import/rendering). Deleted dead `scheduling-section.tsx`. Reviewer caught missing `res.ok` check in deleteScheduleApi — fixed.
**Files:** `packages/frontend/src/pages/workflows.tsx`, `packages/frontend/src/features/settings/settings-layout.tsx`, `packages/frontend/src/features/settings/scheduling-section.tsx` (deleted)

---

## 2026-04-02 13:42 PDT — DES.4: Reduce chat sidebar width

**Done:** Changed chat session sidebar from `w-64` (256px) to `w-60` (240px). Truncation already in place via existing `truncate` classes.
**Files:** `packages/frontend/src/pages/chat.tsx`

---

## 2026-04-02 13:42 PDT — DES.6: Agent Monitor filter label

**Done:** Added "Scope:" label before the filter dropdown in Agent Monitor Live tab. Changed "All" option text to "All Projects" for clarity.
**Files:** `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`

---

## 2026-04-02 13:42 PDT — DES.18: Status bar height increase

**Done:** Increased status bar height from `h-8` (32px) to `h-9` (36px) for better readability. Font size (`text-xs` = 12px) already meets minimum.
**Files:** `packages/frontend/src/components/status-bar.tsx`

## 2026-04-02 13:28 PDT — FX.UXO13: Chat empty state for no project

**Done:** Added early-return guard in ChatPage when `selectedProjectId` is null. Renders centered empty state with FolderOpen icon, "No project selected" heading, and "Select a project from the sidebar" description. Guard placed after all hooks to respect rules of hooks.
**Files:** `packages/frontend/src/pages/chat.tsx`

---

## 2026-04-02 13:28 PDT — FX.UXO20: Remove dead toolCallMap

**Done:** Removed unused `toolCallMap` Map declaration and its `.set()` call from `sendMessage` in use-pico-chat.ts. The active `lastToolCallIndex` code path for tool result pairing is preserved.
**Files:** `packages/frontend/src/hooks/use-pico-chat.ts`

---

## 2026-04-02 13:28 PDT — UXO.22: Per-workflow auto-routing toggle

**Done:** Converted read-only auto-routing indicator in WorkflowCard to a clickable toggle button that PATCHes `{ autoRouting }` via useUpdateWorkflow. Added matching toggle button in workflow builder header (between badge and Save/Publish buttons). WorkflowsPage passes autoRouting state and handler to builder. Emerald green for ON, muted for OFF, with Play/Pause icons.
**Files:** `packages/frontend/src/pages/workflows.tsx`, `packages/frontend/src/features/workflow-builder/workflow-builder.tsx`

---

## 2026-04-02 13:28 PDT — DES.12: Settings header Title Case

**Done:** Removed `uppercase` and `tracking-wider` CSS classes from Settings sidebar h2 header. "Settings" now renders in natural Title Case instead of "SETTINGS".
**Files:** `packages/frontend/src/features/settings/settings-layout.tsx`

## 2026-04-02 13:14 PDT — FX.UXO12: Fix stale closure in deleteSession

**Done:** Computed `remaining` from `sessions.filter()` before calling `setSessions(remaining)`, eliminating the stale closure where `sessions` was read after the state update. Same `remaining` array now used for both state update and fallback session selection.
**Files:** `packages/frontend/src/hooks/use-pico-chat.ts`

---

## 2026-04-02 13:14 PDT — FX.UXO14: Chat header context menu → DropdownMenu

**Done:** Migrated the chat header's manual div-based context menu to shadcn/ui `DropdownMenu` for keyboard accessibility (arrow keys, Escape, Enter/Space). Removed `showHeaderMenu` state. Added `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`. Sidebar right-click menu left untouched.
**Files:** `packages/frontend/src/pages/chat.tsx`

---

## 2026-04-02 13:14 PDT — FX.UXO23: Fix BUILT_IN_IDS wrong agent ID

**Done:** Replaced `"ps-qa00001"` (nonexistent) with `"ps-rt00001"` (Router agent) in `BUILT_IN_IDS` set. Added `"ps-pico"` (Pico assistant). Set now has 6 entries matching all seed agent IDs.
**Files:** `packages/frontend/src/features/agent-builder/agent-list.tsx`

---

## 2026-04-02 13:14 PDT — DES.5: Fix "stories" terminology in Agent Monitor

**Done:** Changed "Agents start when stories move through workflow states" to "Agents start when work items move through workflow states" in the Live tab empty state.
**Files:** `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx`

---

## 2026-04-02 13:14 PDT — FX.UXO24: Track AgentId ps- prefix tech debt

**Done:** Marked as completed — track-only task, no code change needed. The `ps-` prefix on AgentId is legacy tech debt to address in a future cleanup sprint.
**Files:** (none)

## 2026-04-02 12:58 PDT — FX.UXO8, FX.UXO9, FX.UXO17, FX.UXO22: Bug fix + dead code batch

**Done:** (1) FX.UXO8: Added agent-based session grouping to chat-panel.tsx dropdown (compact headers with avatars, collapsible groups). (2) FX.UXO9: Globe icon now shows for `pj-global` projectId, not just null. (3) FX.UXO17: Deleted dead `agent-editor.tsx`. (4) FX.UXO22: Removed dead `AgentScope` discriminated union from shared entities.
**Files:** `chat-panel.tsx`, `chat.tsx`, `agent-editor.tsx` (deleted), `shared/src/entities.ts`

---

## 2026-04-02 12:53 PDT — FX.UXO6, FX.UXO7, FX.UXO11, FX.UXO16: Bug fix batch

**Done:** (1) FX.UXO6: Recently Deleted now passes `undefined` when `isGlobal` instead of `"pj-global"`, returning all projects' items. (2) FX.UXO7: Queue endpoint filters entries by projectId via work item lookup, queueLength reflects filtered count. (3) FX.UXO11: Removed `avatar.icon === "dog"` from isPico check in chat.tsx and chat-panel.tsx — now name-only match. (4) FX.UXO16: Agent create now passes scope/projectId from useSelectedProject — project-scoped agents when project selected.
**Files:** `recently-deleted.tsx`, `routes/executions.ts`, `chat.tsx`, `chat-panel.tsx`, `agent-list.tsx`

---

## 2026-04-02 12:47 PDT — FX.UXO5: Fix global project workflow reference

**Done:** Added `ne(projects.isGlobal, true)` to backfillWorkflowReferences WHERE clause in seed-workflow.ts. Global project now keeps `wf-global` instead of being overwritten with `wf-default` on every startup.
**Files:** `packages/backend/src/db/seed-workflow.ts`

---

## 2026-04-02 12:47 PDT — FX.UXO10, FX.UXO18, FX.UXO21: Rename strings, agent validation, dead code

**Done:** (1) Renamed 3 user-visible "Workflows" → "Automations" strings in workflows.tsx (subtitle, section header, empty state). (2) Added FK constraint try/catch to POST and PATCH in agents route — invalid projectId now returns 400 instead of 500. PATCH scope validation was already correct. (3) Deleted dead board-view.tsx and removed vestigial WorkItemView type, view state, setView action from work-items-store.ts. Also resolved FX.UXO2 (dead code) and FX.UXO19 (FK validation).
**Files:** `packages/frontend/src/pages/workflows.tsx`, `packages/backend/src/routes/agents.ts`, `packages/frontend/src/features/work-items/board-view.tsx` (deleted), `packages/frontend/src/stores/work-items-store.ts`

---

## 2026-04-02 12:42 PDT — FX.UXO1: Fix router paths to /automations

**Done:** Changed workflow builder route from `workflows/:id` to `automations/:id` in router.tsx. Updated two navigate() calls in workflows.tsx from `/workflows/` to `/automations/`. Sidebar and command palette were already correct.
**Files:** `packages/frontend/src/router.tsx`, `packages/frontend/src/pages/workflows.tsx`

---

## 2026-04-02 12:42 PDT — FX.UXO3: Fix auto-routing toggle to use workflow

**Done:** Rewrote AutoRoutingToggle in workflow-config-section.tsx to read `workflow.autoRouting` and write via `PATCH /api/workflows/:id { autoRouting }` instead of dead `project.settings.autoRouting`. Uses useWorkflows + useUpdateWorkflow hooks. Added `autoRouting` to updateWorkflow API client type.
**Files:** `packages/frontend/src/features/settings/workflow-config-section.tsx`, `packages/frontend/src/api/client.ts`

---

## 2026-04-02 12:42 PDT — FX.UXO4: Lock built-in Backlog/Done states

**Done:** Added BUILT_IN_STATE_NAMES set and isBuiltIn check to state-card.tsx. Disables name input, type dropdown, and delete button for Backlog/Done. Shows "Built-in" badge with Lock icon. Color, agent, overrides, and transitions remain editable.
**Files:** `packages/frontend/src/features/workflow-builder/state-card.tsx`

---

## 2026-04-02 12:42 PDT — FX.UXO15: Add scope UI to agent detail panel

**Done:** Added scope display and editing to agent-detail-panel.tsx. Read mode shows Globe/violet badge for global, FolderOpen/emerald badge with project name for project scope. Edit mode has scope Select (Global/Project) and conditional project dropdown. Save includes scope and projectId in update payload.
**Files:** `packages/frontend/src/features/agent-builder/agent-detail-panel.tsx`

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

