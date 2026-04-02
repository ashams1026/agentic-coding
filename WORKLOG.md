# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 14:10 PDT — DX.1: Frontend-only dev mode with mock API

**Done:** Added `pnpm dev:frontend` (frontend-only with mock API), `pnpm dev:backend` (backend-only), kept `pnpm dev` as full-stack. Created lightweight fetch interceptor at `packages/frontend/src/api/mock-api.ts` with in-memory data for all API endpoints (projects, work items, agents, executions, comments, proposals, workflows, dashboard stats, settings, chat, analytics, search). WebSocket connection is skipped in mock mode. Mock layer is tree-shaken from production builds.
**Files:** `package.json`, `packages/frontend/package.json`, `packages/frontend/src/api/mock-api.ts`, `packages/frontend/src/api/ws.ts`, `packages/frontend/src/main.tsx`, `packages/frontend/src/env.d.ts`

---

## 2026-04-02 13:55 PDT — DES.19: Empty states audit

**Done:** Audited all pages and sub-components for consistent empty states. Added missing icons, descriptions, and CTA buttons across 15 empty states. Normalized styling to use consistent pattern: muted icon (h-10 w-10), font-medium heading, muted/60 description, outline CTA button.
**Files:** `features/activity-feed/activity-feed.tsx`, `features/agent-monitor/agent-history.tsx`, `features/agent-monitor/agent-monitor-layout.tsx`, `features/agent-monitor/queue-view.tsx`, `features/agent-builder/agent-list.tsx`, `features/work-items/list-view.tsx`, `features/dashboard/recent-activity.tsx`, `features/dashboard/upcoming-work.tsx`, `features/dashboard/cost-summary.tsx`, `features/analytics/overview-tab.tsx`, `features/analytics/token-usage-tab.tsx`, `pages/dashboard.tsx`, `pages/chat.tsx`, `pages/workflows.tsx`

---

## 2026-04-02 13:41 PDT — FX.WI1: Fix work item edit revert bug

**Done:** Removed `onSettled` from `useUpdateWorkItem` that was always invalidating queries (overwriting optimistic updates). Replaced with `onSuccess` that sets server response directly into query cache. Added `mutationKey: ["workItems"]` and guarded WebSocket `state_change` handler with `isMutating` check to prevent stale refetches during active mutations.
**Files:** `packages/frontend/src/hooks/use-work-items.ts`, `packages/frontend/src/hooks/use-ws-sync.ts`

---

## 2026-04-02 13:41 PDT — DES.1: Dashboard onboarding checklist

**Done:** Added `GettingStartedChecklist` component to Dashboard with 4 steps: register project, configure API key, create work item, watch agent run. Steps auto-detect completion from real data. Dismissible via localStorage. Auto-hides with celebration when all steps complete.
**Files:** `packages/frontend/src/pages/dashboard.tsx`

---

## 2026-04-02 13:41 PDT — DES.7: Normalize workflow card heights

**Done:** Added `min-h-[180px]` to WorkflowCard for uniform card heights. Replaced "No states defined" italic text with centered "Configure States" CTA button that opens the workflow builder.
**Files:** `packages/frontend/src/pages/workflows.tsx`

---

## 2026-04-02 13:41 PDT — DES.14: Fix Per-Agent Limits table

**Done:** Added collapsed state to `AgentLimitsSection` when no limits configured. Shows compact CTA ("Configure limits") instead of full empty table. Expands to show table on click. Collapse button available when no limits set.
**Files:** `packages/frontend/src/features/settings/api-keys-section.tsx`

---

## 2026-04-02 13:41 PDT — DES.3, DES.17: Already implemented (no code change)

**Done:** DES.3 (auto-generate chat session names) already implemented in backend `chat.ts:297-309` — title generated from first message. DES.17 (activity feed filter bar) already implemented as `FeedFilterBar` component with event type checkboxes, agent dropdown, and date range selector.
**Files:** (none — already in codebase)

---

## 2026-04-02 14:15 PDT — DES.1: Dashboard onboarding checklist

**Done:** Added `GettingStartedChecklist` component to the Dashboard page. Four-step checklist (register project, configure API key, create work item, watch agent run) with live completion detection from existing hooks plus a direct `useQuery` for API key status. Completed steps show green checkmarks with strikethrough; incomplete steps show numbered circles with arrow navigation. Dismiss button persists to localStorage. Auto-hides 4s after all steps complete. Uses shadcn Card, Button, lucide icons, dark mode compatible.
**Files:** `packages/frontend/src/pages/dashboard.tsx`

---

## 2026-04-02 13:55 PDT — UXO.26: Move workflow settings into builder

**Done:** Added collapsible AgentAssignmentsSection to workflow builder left panel (between state cards and Validation). Shows intermediate states with agent dropdowns and model badges. Uses useAgentAssignments/useUpdateAgentAssignment for persistence. Removed Workflow tab from settings-layout.tsx (GitBranch import, SECTIONS entry, WorkflowConfigSection import/rendering). Deleted dead workflow-config-section.tsx.
**Files:** `packages/frontend/src/features/workflow-builder/workflow-builder.tsx`, `packages/frontend/src/features/settings/settings-layout.tsx`, `packages/frontend/src/features/settings/workflow-config-section.tsx` (deleted)

---

## 2026-04-02 13:55 PDT — DES.8, DES.9, DES.11: Design polish batch

**Done:** (1) DES.8: Removed `uppercase tracking-wide` from Automations page section headers — now Title Case. (2) DES.9: Added search input with magnifying glass icon above agent card grid, filters by name/description via useMemo. (3) DES.11: Rewrote Router agent description from "Routes work items between workflow states based on execution outcomes" to "Automatically moves work items to the next step when an agent finishes" across seed.ts, seed-demo.ts, default-agents.ts.
**Files:** `packages/frontend/src/pages/workflows.tsx`, `packages/frontend/src/features/agent-builder/agent-list.tsx`, `packages/backend/src/db/seed.ts`, `packages/backend/src/db/seed-demo.ts`, `packages/backend/src/db/default-agents.ts`

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

