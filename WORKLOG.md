# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> Entries older than 7 days are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-28 — T2.2.2: Build story card component

**Task:** Compact story card with priority badge (P0-P3 colors), label pills, task progress bar, proposal badge, active agent indicator.

**Done:**
- Created `features/kanban/story-card.tsx`:
  - `StoryCard` component with `StoryCardData` prop for aggregated data
  - Priority badge with per-level colors (P0=red, P1=amber, P2=blue, P3=slate)
  - Label pills (up to 2 shown)
  - `TaskProgressBar` — green fill bar with "done/total" text
  - Proposal badge — amber FileCheck icon + count (only when pending > 0)
  - Active agent indicator — persona-colored avatar with pulsing green dot + persona name
  - Hover state via `hover:bg-accent/50`, links to `/stories/:id`
- Updated `kanban-board.tsx`:
  - Added `useTasks`, `useProposals`, `useExecutions`, `usePersonas` hooks
  - `buildCardDataMap()` — computes per-story aggregates (task progress, pending proposals, active agent) at board level to avoid N+1 queries
  - `useMemo` on grouped stories and card data map for performance
- Updated `kanban-column.tsx` — replaced `StoryCardPlaceholder` with `StoryCard`, passes `cardDataMap` prop
- Fixed TS strict mode error: branded `TaskId` in Set required explicit `Set<string>` typing

**Files created:**
- `packages/frontend/src/features/kanban/story-card.tsx`

**Files modified:**
- `packages/frontend/src/features/kanban/kanban-board.tsx` (added data fetching + aggregation)
- `packages/frontend/src/features/kanban/kanban-column.tsx` (replaced placeholder with StoryCard)

**Notes for next agent:**
- T2.2.3 is next: drag-and-drop between columns using @dnd-kit
- `StoryCardData` interface is exported from `story-card.tsx` — other components can reuse it
- The board fetches ALL tasks/proposals/executions/personas once and computes per-story aggregates. This avoids per-card queries.
- Mock data: Story 1 ("Auth") has 3 tasks (1 Done, 1 Running, 1 Pending) and 1 running execution

---

## 2026-03-28 — Review: T2.2.1 (approved)

**Reviewed:** Kanban board layout — `features/kanban/kanban-board.tsx`, `kanban-column.tsx`, and `story-board.tsx` page.

**Verdict:** Approved. All requirements met: columns generated from default story workflow states (7 columns), headers with colored dot + state name + count badge, horizontal scroll via ScrollArea, board fills viewport height via flex layout chain. Stories grouped correctly by `currentState`. Loading/empty states handled. Placeholder story cards are functional with links, priority badges, and label pills. Clean board/column component separation. Build clean.

---

## 2026-03-28 — T2.2.1: Build kanban board layout

**Task:** Kanban board with columns from story workflow states, column headers with state name/count/color, horizontal scroll, full viewport height.

**Done:**
- Created `features/kanban/` directory with two components:
  - `kanban-board.tsx` — main board: fetches stories + workflows, finds default story workflow, groups stories by `currentState`, renders columns in workflow state order, horizontal `ScrollArea` with `ScrollBar`
  - `kanban-column.tsx` — single column: colored dot + state name + count badge header, vertically scrollable story list, empty state with dashed border placeholder
- Placeholder story card (`StoryCardPlaceholder`) shows title (line-clamped), priority badge, label pills — will be replaced by full `StoryCard` in T2.2.2
- Board fills available viewport height via `h-full flex-col` layout in page, `min-h-0 flex-1` for the board container
- Each column is 280px wide with `shrink-0` for consistent sizing
- Updated `story-board.tsx` page to render `KanbanBoard`
- Loading and empty states handled (workflow loading, no story workflow configured)

**Files created:**
- `packages/frontend/src/features/kanban/kanban-board.tsx`
- `packages/frontend/src/features/kanban/kanban-column.tsx`

**Files modified:**
- `packages/frontend/src/pages/story-board.tsx` (replaced placeholder with KanbanBoard)

**Notes for next agent:**
- T2.2.2 is next: Build the full StoryCard component (priority colors, task progress, proposal badge, agent indicator). It will replace `StoryCardPlaceholder` in `kanban-column.tsx`.
- The kanban feature lives in `src/features/kanban/` — collocate related components there.
- Workflow states from fixtures: Backlog, Defining, Decomposing, In Progress, In Review, QA, Done (7 columns, each with color).
- Mock stories are in: Backlog (1), Decomposing (1), In Progress (1). Other columns are empty.

---

## 2026-03-28 — Review: T2.1.5 (approved)

**Reviewed:** Cost summary widget — `features/dashboard/cost-summary.tsx` and dashboard integration.

**Verdict:** Approved. All requirements met: recharts AreaChart sparkline with gradient fill showing 7-day daily spend, custom tooltip with shadcn styling, today's spend display with graceful $0.00 handling, monthly progress bar with green/amber/red thresholds. Uses `useCostSummary()` mock hook. Proper TypeScript strict mode handling (optional chaining for array access). Dashboard widget grid now complete. Build clean.

---

## 2026-03-28 — T2.1.5: Build cost summary widget

**Task:** Sparkline chart showing daily spend for last 7 days, monthly total vs cap progress bar, today's spend display.

**Done:**
- Installed `recharts` in frontend package
- Created `CostSummary` component in `features/dashboard/cost-summary.tsx`
- Uses `useCostSummary()` hook (returns dailySpend array, monthTotal, monthCap from mock API)
- Today's spend displayed prominently with dollar icon
- Sparkline: recharts `AreaChart` with gradient fill, minimal axes (X shows weekday names, Y hidden), custom tooltip styled with shadcn popover colors
- Progress bar: month total vs cap with color coding (green <80%, amber 80-95%, red ≥95%)
- "$0.00 today" shown gracefully when no data; empty state for chart
- Integrated into dashboard.tsx replacing the Cost Summary placeholder
- Fixed two TS strict mode errors (array indexing possibly undefined)

**Files created:**
- `packages/frontend/src/features/dashboard/cost-summary.tsx`

**Files modified:**
- `packages/frontend/src/pages/dashboard.tsx` (import + replace placeholder)
- `packages/frontend/package.json` (recharts dependency)
- `pnpm-lock.yaml`

**Notes for next agent:**
- recharts adds ~330KB to the bundle (warning about 500KB+ chunk). Consider code-splitting later if needed.
- Dashboard is now complete: 4 stat cards + active agents strip + 3 widgets (RecentActivity, UpcomingWork, CostSummary)
- Next task is T2.2.1: Kanban board layout for story board

---

## 2026-03-28 — Review: T2.1.4 (approved)

**Reviewed:** Upcoming work widget — `features/dashboard/upcoming-work.tsx` and dashboard integration.

**Verdict:** Approved. All task requirements met: shows next 5 ready tasks with title, parent story, persona badge, and dependency status icons. Uses `useReadyWork()` and `useTaskEdges()` hooks backed by mock data. Empty state handled. Follows established patterns from other dashboard widgets (named export, kebab-case, feature colocation, shadcn components, dark mode CSS vars). Build passes clean.

---

## 2026-03-28 — T2.1.4: Build upcoming work widget

**Task:** Dashboard widget showing next 5 tasks ready for dispatch with task title, parent story name, persona, and dependency status.

**Done:**
- Created `UpcomingWork` component in `features/dashboard/upcoming-work.tsx`
- Uses `useReadyWork()` hook (fetches pending tasks from mock API, limited to 5)
- Uses `useTaskEdges()` to determine dependency status per task
- Each row shows: persona avatar (colored if assigned, muted if not), task title, parent story name, persona name badge, dependency icon (amber GitBranch if has deps, green CheckCircle if clear)
- Links each row to `/tasks/:id` for navigation
- "View board" link navigates to `/board`
- Empty state: "No tasks ready for dispatch"
- Integrated into dashboard.tsx replacing the placeholder card
- Follows established pattern from active-agents-strip and recent-activity components

**Files created:**
- `packages/frontend/src/features/dashboard/upcoming-work.tsx`

**Files modified:**
- `packages/frontend/src/pages/dashboard.tsx` (import + replace placeholder)

**Notes for next agent:**
- T2.1.5 is next: Cost summary widget with sparkline chart (recharts or similar)
- The dashboard now has 3 widgets in a 2-col grid: RecentActivity, UpcomingWork, and a Cost Summary placeholder
- All dashboard feature components live in `src/features/dashboard/`

---

## 2026-03-28 — T1.3.1: Define all entity types

**Task:** TypeScript interfaces for all entities + ID prefix types + nanoid generator.

**Done:**
- Installed nanoid in @agentops/shared
- Created `src/ids.ts` — branded template literal ID types (`ProjectId = pj-${string}`, `StoryId = st-${string}`, etc. for all 11 entity types), `EntityId` union, `createId` factory object with methods for each entity type (7-char nanoid)
- Created `src/entities.ts` — all entity interfaces matching PLANNING.md T1.4:
  - Project, Story, Task (with ExecutionContextEntry[], RejectionPayload)
  - TaskEdge (DAG dependency graph)
  - Workflow, WorkflowState, WorkflowTransition
  - Persona (with avatar, model, tools, budget)
  - Trigger (with dispatchMode, advancementMode, possibleTargets for evaluate mode)
  - Execution (with status, outcome, cost, duration, logs)
  - Comment (with targetType, authorType, metadata)
  - ProjectMemory (with filesChanged, keyDecisions, consolidatedInto for decay)
  - Proposal (with type, payload, status)
  - All enum/union types: Priority, DispatchMode, AdvancementMode, ExecutionStatus, ExecutionOutcome, etc.
- Updated `src/index.ts` barrel export
- Verified: shared typecheck clean, full project `tsc --build` clean, lint clean

**Files created:**
- `packages/shared/src/ids.ts`
- `packages/shared/src/entities.ts`

**Files modified:**
- `packages/shared/src/index.ts` (barrel exports)
- `packages/shared/package.json` (nanoid dep)

**Notes for next agent:**
- T1.3.2 is next: API contract types (request/response, WebSocket events, enums)
- Import types from `@agentops/shared` — e.g., `import type { Story, StoryId } from "@agentops/shared"`
- `createId.story()` generates IDs like `st-a8f3k2m`
- `verbatimModuleSyntax` is on — use `import type` for type-only imports
- Story/Task states are `string` (dynamic, defined by workflow) — not fixed enums

---

## 2026-03-28 — Review: T1.3.1 (approved)

**Reviewed:** Shared entity types, ID utilities, and type exports.

**Verdict:** Approved. All 11 entity interfaces match PLANNING.md T1.4 spec precisely. Branded template literal ID types provide type safety. createId factory is clean with consistent 7-char nanoid. Proper use of `import type` for verbatimModuleSyntax. Full project build passes.

---

## 2026-03-28 — T1.3.2: Define API contract types

**Task:** Request/response types for all CRUD endpoints, WebSocket event types, aggregate stat types.

**Done:**
- Created `src/api.ts` — API contract types:
  - Generic wrappers: ApiResponse<T>, ApiListResponse<T>, ApiErrorResponse
  - CRUD request/response types for: Project, Story, Task, TaskEdge, Workflow, Persona, Comment, Proposal
  - Update requests use optional fields (Partial-style)
  - ReadyWorkItem type for ready-work query (task + story + persona)
  - Aggregate types: DashboardStats, CostSummary, ExecutionStats
  - Route param types for all entities
- Created `src/ws-events.ts` — WebSocket event types:
  - 9 event types: state_change, comment_created, agent_output_chunk, agent_started, agent_completed, proposal_created, proposal_updated, cost_update, execution_update
  - Individual event interfaces with typed payloads
  - Discriminated union `WsEvent` for type-safe handling
  - `WsEventMap` for typed subscribe API
  - `WsEventHandler<T>` generic callback type
- Updated barrel export in `src/index.ts`
- Verified: full project `tsc --build` clean, lint clean

**Files created:**
- `packages/shared/src/api.ts`
- `packages/shared/src/ws-events.ts`

**Files modified:**
- `packages/shared/src/index.ts` (added exports)

**Notes for next agent:**
- T1.4.1 is next: create mock data fixtures
- API types can be imported from `@agentops/shared`: `import type { CreateStoryRequest, StoryResponse } from "@agentops/shared"`
- WsEvent is a discriminated union — use `event.type` to narrow: `if (event.type === "agent_output_chunk") { event.chunk }`
- WsEventMap enables typed subscriptions: `subscribe<K extends WsEventType>(type: K, handler: (e: WsEventMap[K]) => void)`
- All Shared Types tasks (T1.3.x) are now complete

---

## 2026-03-28 — Review: T1.3.2 (approved)

**Reviewed:** API contract types and WebSocket event types.

**Verdict:** Approved. Comprehensive CRUD request/response types for all endpoints. WsEvent discriminated union with 9 event types enables type-safe handling. WsEventMap provides typed subscription API. Aggregate stat types (DashboardStats, CostSummary, ExecutionStats) cover UI needs. All types properly reference entities via `import type`. Build passes.

---

## 2026-03-28 — T1.4.1: Create mock data fixtures

**Task:** Realistic dataset with all entity types for mock-driven UI development.

**Done:**
- Created `packages/frontend/src/mocks/fixtures.ts` with:
  - 1 project ("AgentOps")
  - 2 workflows (story: 7 states, task: 5 states — with transitions)
  - 5 personas (PM purple, Tech Lead blue, Engineer green, Reviewer amber, QA red — each with model, tools, budget)
  - 4 triggers (auto/propose dispatch modes on story workflow transitions)
  - 3 stories in different states (In Progress, Decomposing, Backlog)
  - 10 tasks across stories (Done, Running, Pending states)
  - 4 task edges (blocks + depends_on)
  - 6 executions (5 completed, 1 running — with realistic costs and durations)
  - 15 comments (agent, user, system types — across stories and tasks)
  - 2 proposals (1 approved, 1 pending)
  - 2 project memory entries
  - Aggregate `fixtures` export object
- Added `@agentops/shared` as workspace dependency to frontend
- All IDs use branded template literal types (no `as any` casts)
- Verified: typecheck clean, vite build clean, lint clean

**Files created:**
- `packages/frontend/src/mocks/fixtures.ts`

**Files modified:**
- `packages/frontend/package.json` (@agentops/shared workspace dep)

**Notes for next agent:**
- T1.4.2 is next: mock API service layer
- Import fixtures: `import { fixtures } from "@/mocks/fixtures"` or individual arrays
- Fixed IDs at top of file for easy cross-referencing (e.g., STORY_1, PERSONA_PM)
- Story 1 "Auth" has a running execution (EXEC_4) — good for agent monitor testing
- Story 2 "Dashboard" has a pending proposal (pp-prop002) — good for proposals UI testing
- Frontend now depends on @agentops/shared as workspace package

---

## 2026-03-28 — Review: T1.4.1 (approved)

**Reviewed:** Mock data fixtures for all entity types.

**Verdict:** Approved. All requirements met: 1 project, 2 workflows (story 7-state + task 5-state), 5 personas with distinct colors/icons, 3 stories in different states, 10 tasks, 4 dependency edges, 6 executions (including 1 running), 15 comments across entities, 2 proposals (1 approved + 1 pending — good for testing both states), 2 project memories. Strongly typed with no `as any`. Build passes.

---

## 2026-03-28 — T1.4.2: Build mock API service layer

**Task:** Build mock API service layer with in-memory store, simulated latency, and functions matching real API shape.

**Done:**
- Created `packages/frontend/src/mocks/api.ts` with full CRUD mock API
- In-memory store initialized from fixtures (shallow copy of each array)
- `delay()` helper adds 50-150ms random latency for realistic loading states
- CRUD functions for: Projects, Stories, Tasks, TaskEdges, Workflows, Personas, Triggers, Executions, Comments, Proposals, ProjectMemory
- Aggregate query functions: `getDashboardStats()`, `getCostSummary()`, `getExecutionStats()`, `getReadyWork()`
- `resetStore()` utility to restore initial fixture state (for demo/test reset)
- Bundled `mockApi` object that exports all functions as a single namespace
- All functions use shared types from `@agentops/shared` for request/response shapes
- Create functions use `createId` from shared to generate proper prefixed IDs

**Files created:**
- `packages/frontend/src/mocks/api.ts`

**Notes for next agent:**
- T1.4.3 is next: TanStack Query hooks. Each hook should call the corresponding mock API function from this file.
- The `mockApi` export can be imported as a namespace: `import { mockApi } from "@/mocks/api"`
- Individual functions are also exported for direct import: `import { getStories } from "@/mocks/api"`
- Mutations (create/update/delete) mutate the in-memory store directly — TanStack Query hooks should invalidate queries after mutations

---

## 2026-03-28 — Review: T1.4.2 (approved)

**Reviewed:** Mock API service layer in `packages/frontend/src/mocks/api.ts`.

**Verdict:** Approved. All requirements met: in-memory store from fixtures, 50-150ms simulated latency, full CRUD for all 11 entity types, aggregate queries (dashboard stats, cost summary, execution stats, ready work) matching shared contract types, `resetStore()` utility, bundled `mockApi` namespace. Properly typed with `import type` for type-only imports. Build passes clean.

---

## 2026-03-28 — T1.4.3: Build TanStack Query hooks

**Task:** Build TanStack Query hooks backed by mock API, one hook per API call, with optimistic update helpers for mutations.

**Done:**
- Created centralized `query-keys.ts` with typed query key factory for all entities
- Created hook files per domain: `use-projects.ts`, `use-stories.ts`, `use-tasks.ts`, `use-workflows.ts`, `use-personas.ts`, `use-executions.ts`, `use-comments.ts`, `use-proposals.ts`, `use-dashboard.ts`
- Query hooks: `useProjects`, `useProject`, `useStories`, `useStory`, `useTasks`, `useTask`, `useTaskEdges`, `useWorkflows`, `useWorkflow`, `useTriggers`, `usePersonas`, `usePersona`, `useExecutions`, `useExecution`, `useComments`, `useProposals`, `useProposal`, `useProjectMemories`, `useDashboardStats`, `useCostSummary`, `useExecutionStats`, `useReadyWork`
- Mutation hooks: `useCreateStory`, `useUpdateStory`, `useDeleteStory`, `useCreateTask`, `useUpdateTask`, `useDeleteTask`, `useCreateTaskEdge`, `useDeleteTaskEdge`, `useCreateWorkflow`, `useUpdateWorkflow`, `useDeleteWorkflow`, `useCreatePersona`, `useUpdatePersona`, `useDeletePersona`, `useCreateProject`, `useUpdateProject`, `useDeleteProject`, `useCreateComment`, `useUpdateProposal`
- Optimistic updates on `useUpdateStory` and `useUpdateTask` (cancel in-flight, snapshot previous, rollback on error)
- All mutations invalidate relevant queries on success/settle
- Barrel export in `hooks/index.ts`

**Files created:**
- `packages/frontend/src/hooks/query-keys.ts`
- `packages/frontend/src/hooks/use-projects.ts`
- `packages/frontend/src/hooks/use-stories.ts`
- `packages/frontend/src/hooks/use-tasks.ts`
- `packages/frontend/src/hooks/use-workflows.ts`
- `packages/frontend/src/hooks/use-personas.ts`
- `packages/frontend/src/hooks/use-executions.ts`
- `packages/frontend/src/hooks/use-comments.ts`
- `packages/frontend/src/hooks/use-proposals.ts`
- `packages/frontend/src/hooks/use-dashboard.ts`
- `packages/frontend/src/hooks/index.ts`

**Notes for next agent:**
- Import hooks from `@/hooks` (barrel export) or individual files
- Query keys are in `@/hooks/query-keys` — use for manual invalidation or prefetching
- Optimistic updates are on story and task update mutations (the most frequently edited entities)
- T1.4.4 is next: mock WebSocket system

---

## 2026-03-28 — Review: T1.4.3 (approved)

**Reviewed:** TanStack Query hooks in `packages/frontend/src/hooks/`.

**Verdict:** Approved. All requirements met: 22 query hooks + 18 mutation hooks covering every mock API function. Centralized query key factory with proper `as const` typing. Optimistic updates on `useUpdateStory` and `useUpdateTask` with cancel/snapshot/rollback pattern. All mutations invalidate relevant queries. `useUpdateProposal` also invalidates dashboard stats. Barrel export in `hooks/index.ts`. Consistent patterns, proper `import type` usage. Build passes clean.

---

## 2026-03-28 — T1.4.4: Build mock WebSocket system

**Task:** Build mock WebSocket event emitter with subscribe API, simulating agent output streaming, state transitions, comments, proposals, and cost ticker.

**Done:**
- Created `packages/frontend/src/mocks/ws.ts` with `MockWsClient` class
- Typed event emitter using `WsEventMap` from `@agentops/shared` — per-type subscriber sets + wildcard `"*"` for all events
- `subscribe(eventType, handler)` — returns unsubscribe function
- `subscribeAll(handler)` — subscribe to all event types
- `emit(event)` — dispatches to typed + wildcard subscribers
- `emitAfter(event, delayMs)` — scheduled delayed emit with cancel
- Simulation helpers:
  - `simulateAgentOutput()` — streams text chunks at configurable intervals
  - `simulateCostTicker()` — periodic cost_update events with incrementing values
  - `simulateAgentRun()` — full lifecycle: agent_started → output chunks → agent_completed + execution_update
- Timer/interval management: `clearAll()` cancels all pending, `removeAllListeners()` clears subscribers
- Event factory helpers: `createStateChangeEvent()`, `createCommentCreatedEvent()`, etc. — convenience functions that auto-add `type` and `timestamp`
- Singleton export: `mockWs` instance for app-wide use
- Re-exports WsEvent types for consumer convenience

**Files created:**
- `packages/frontend/src/mocks/ws.ts`

**Notes for next agent:**
- T1.4.5 is next: demo mode. Use `mockWs` to emit events in a scripted sequence.
- Import `mockWs` from `@/mocks/ws` — it's a singleton, shared across all components
- Event factories like `createStateChangeEvent()` save boilerplate when constructing events
- `simulateAgentRun()` handles the full started→chunks→completed lifecycle
- `clearAll()` should be called on demo stop/reset to cancel pending timers

---

## 2026-03-28 — Review: T1.4.4 (approved)

**Reviewed:** Mock WebSocket system in `packages/frontend/src/mocks/ws.ts`.

**Verdict:** Approved. All requirements met: typed event emitter using `WsEventMap` with per-type + wildcard subscriptions, `subscribe()` returning unsubscribe function for React cleanup. Simulation helpers cover agent output streaming (chunks at intervals), cost ticker (periodic with rounding), and full agent lifecycle orchestration. Event factory helpers for all event types. Proper timer/interval management with `clearAll()`. Singleton `mockWs` export. Build passes clean.

---

## 2026-03-28 — T1.4.5: Build demo mode

**Task:** Build scripted ~60-second demo replaying a story lifecycle via mock WebSocket events. Toggle via UI button or `?demo=true`.

**Done:**
- Created `packages/frontend/src/mocks/demo.ts` with scripted demo sequence
- Full story lifecycle over ~60 seconds:
  - 0s: Story created → Backlog
  - 2s: Story → Defining, PM agent streams acceptance criteria (~10s)
  - 12s: PM done, comment posted, story → Decomposing
  - 14s: Tech Lead agent streams task decomposition (~12s)
  - 26s: Tech Lead done, proposal created (3 tasks)
  - 29s: Proposal approved, story → In Progress, 3 tasks → Pending
  - 31s: Engineer starts task 1, streams code implementation (~10s)
  - 42s: Engineer done, task → Review, story → In Review
  - 44s: Reviewer agent streams review (~6s)
  - 51s: Review passed, task → Done, story → QA
  - 53s: QA agent streams test results (~5s)
  - 59s: QA passed, story → Done
  - 61s: Demo auto-stops
- Uses `mockWs.simulateAgentRun()` for all agent lifecycles (started→chunks→completed)
- Cost ticker runs throughout the demo at $0.02/2s increments
- Realistic agent output text (PM criteria, TL decomposition, Engineer code, Reviewer checks, QA tests)
- API: `startDemo()`, `stopDemo()`, `isDemoRunning()`, `onDemoStop(callback)`, `checkDemoAutoStart()`
- `checkDemoAutoStart()` reads `?demo=true` from URL params
- All timers tracked and cancellable via `stopDemo()` + `mockWs.clearAll()`

**Files created:**
- `packages/frontend/src/mocks/demo.ts`

**Notes for next agent:**
- Sprint 1 mock data layer is now complete (T1.4.1–T1.4.5)
- Call `checkDemoAutoStart()` in app initialization to support `?demo=true` auto-start
- `startDemo()` can be wired to a "Watch Demo" button on the dashboard
- `onDemoStop(callback)` can reset UI state when demo ends
- Next work is Sprint 2: Core UI Screens (T2.1.1+)

---

## 2026-03-28 — Review: T1.4.5 (approved)

**Reviewed:** Demo mode in `packages/frontend/src/mocks/demo.ts`.

**Verdict:** Approved. Full story lifecycle scripted over ~60 seconds across all 7 workflow states. 5 agent runs (PM, TL, Engineer, Reviewer, QA) with realistic streaming output — including actual TypeScript code from Engineer. All 9 WS event types exercised. Proper timer management: `schedule()` tracks timeouts, `stopDemo()` cancels everything including cost ticker. Control API complete: start/stop/isRunning/onStop/autoStart. Demo IDs properly namespaced to avoid fixture conflicts. Build passes clean. Sprint 1 mock data layer is now fully complete.

---

## 2026-03-28 — T2.1.1: Build dashboard page layout

**Task:** Build dashboard page with status cards row: Active Agents, Pending Proposals, Needs Attention, Today's Cost. Each clickable, navigating to relevant screen.

**Done:**
- Replaced placeholder `DashboardPage` with full layout
- 4 status cards in responsive grid (1 col mobile, 2 col sm, 4 col lg)
- Each card: icon with colored background, title label, large value
  - Active Agents (green Bot icon) → navigates to /agents
  - Pending Proposals (amber FileCheck icon) → navigates to /board
  - Needs Attention (red AlertTriangle icon) → navigates to /activity
  - Today's Cost (blue DollarSign icon) → navigates to /settings
- Cards use `useDashboardStats()` hook from mock API — real data, not hardcoded
- Loading state shows "—" while data fetches
- Dark mode support on all icon backgrounds
- Hover effect on cards (`hover:bg-accent/50`)
- Placeholder cards for upcoming widgets (T2.1.2–T2.1.5) in 2-column grid
- Extracted reusable `StatCard` component within the file

**Files modified:**
- `packages/frontend/src/pages/dashboard.tsx`

**Notes for next agent:**
- T2.1.2 is next: active agents strip component. Replace the "Active Agents" placeholder card in the bottom grid.
- `useDashboardStats()` hook returns `{ activeAgents, pendingProposals, needsAttention, todayCostUsd }`
- Dashboard uses `useNavigate` from react-router for card click navigation
- lucide-react icons are used throughout — import from "lucide-react"

---

## 2026-03-28 — Review: T2.1.1 (approved)

**Reviewed:** Dashboard page layout with status cards in `packages/frontend/src/pages/dashboard.tsx`.

**Verdict:** Approved. All 4 status cards present with correct navigation targets. Data driven by `useDashboardStats()` hook. Responsive grid (1→2→4 cols). Loading state, dark mode, hover effects all correct. Reusable `StatCard` component cleanly extracted. Placeholder cards for upcoming T2.1.2–T2.1.5 widgets. Build passes clean.

---

## 2026-03-28 — T2.1.2: Build active agents strip component

**Task:** Build horizontal scrollable row of active agent cards on the dashboard. Each card shows persona avatar, task name, elapsed time (live-updating), pulsing status dot. Empty state when no agents running.

**Done:**
- Created `packages/frontend/src/features/dashboard/active-agents-strip.tsx`
- `ActiveAgentsStrip` component filters running executions from `useExecutions()` hook
- Persona lookup via `usePersonas()` for avatar color and name
- Each `AgentCard`: persona-colored avatar circle with Bot icon, pulsing green status dot (CSS `animate-ping`), persona name, task summary, live elapsed time (1-second interval via `useState`/`useEffect`)
- Horizontal scroll via shadcn `ScrollArea` with `ScrollBar orientation="horizontal"`
- Fixed card width (w-56) for consistent scrollable layout
- Click navigates to `/agents` (agent monitor)
- Empty state: centered Bot icon with "No active agents" text
- Integrated into dashboard page, replacing the "Active Agents" placeholder card
- First use of `features/` directory convention per CLAUDE.md

**Files created:**
- `packages/frontend/src/features/dashboard/active-agents-strip.tsx`

**Files modified:**
- `packages/frontend/src/pages/dashboard.tsx` (added import + replaced placeholder)

**Notes for next agent:**
- T2.1.3 is next: recent activity feed component for the dashboard
- `features/dashboard/` is now established as the pattern for dashboard sub-components
- The elapsed time updates every second — `formatElapsed()` helper handles s/m/h formatting
- Remaining placeholder cards on dashboard: Recent Activity (T2.1.3), Upcoming Work (T2.1.4), Cost Summary (T2.1.5)

---

## 2026-03-28 — Review: T2.1.2 (approved)

**Reviewed:** Active agents strip in `packages/frontend/src/features/dashboard/active-agents-strip.tsx`.

**Verdict:** Approved. Horizontal scrollable row of agent cards via shadcn ScrollArea. Each card: persona-colored avatar with Bot icon, pulsing green dot (animate-ping), truncated summary, live elapsed time (1s interval with cleanup). Empty state when no running executions. Data from useExecutions() + usePersonas() hooks. Properly integrated into dashboard replacing placeholder. First use of features/dashboard/ convention. Build passes clean.

---

## 2026-03-28 — T2.1.3: Build recent activity feed component

**Task:** Compact list of last ~10 events on dashboard. Each entry: event icon (color-coded), persona avatar, description, relative timestamp. Click navigates to source. "View all" link.

**Done:**
- Created `packages/frontend/src/features/dashboard/recent-activity.tsx`
- Unified `ActivityEvent` type derived from 3 data sources:
  - Completed executions → "agent_completed" events
  - Fixture comments → "comment_posted" (user/agent) or "state_change" (system)
  - Proposals → "proposal_created" events
- Custom `useActivityEvents()` hook aggregates, sorts by timestamp, takes last 10
- 4 event types with color-coded icons:
  - state_change: blue ArrowRightLeft
  - agent_completed: green CheckCircle2
  - comment_posted: violet MessageSquare
  - proposal_created: amber FileCheck
- Persona avatar shown when event has a personaId (colored circle + Bot icon)
- Each row: icon, optional persona avatar, truncated description, relative time
- Click navigates to source entity (story or task detail via Link)
- "View all" link navigates to /activity
- Empty state: "Nothing yet"
- `relativeTime()` helper: "just now", "Xm ago", "Xh ago", "Xd ago"
- Integrated into dashboard, replacing "Recent Activity" placeholder

**Files created:**
- `packages/frontend/src/features/dashboard/recent-activity.tsx`

**Files modified:**
- `packages/frontend/src/pages/dashboard.tsx` (added import + replaced placeholder)

**Notes for next agent:**
- T2.1.4 is next: upcoming work widget
- Remaining dashboard placeholders: Upcoming Work (T2.1.4), Cost Summary (T2.1.5)
- The `useActivityEvents()` pattern can be reused/extended for the full Activity Feed page (T2.7.1)

---

## 2026-03-28 — Review: T2.1.3 (approved)

**Reviewed:** Recent activity feed in `packages/frontend/src/features/dashboard/recent-activity.tsx`.

**Verdict:** Approved. Unified event feed from 3 data sources (executions, comments, proposals) sorted by timestamp, capped at 10. Four color-coded event types with distinct icons. Persona avatars shown for agent events. Truncated descriptions, relative timestamps, click-to-navigate via Link. "View all" link to /activity. Empty state handled. Properly integrated into dashboard. Build passes clean. Completed [x] count now at 10 — next run will trigger CLEANUP.
