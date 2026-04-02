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

