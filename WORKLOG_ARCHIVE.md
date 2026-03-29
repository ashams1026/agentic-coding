# AgentOps — Work Log Archive

> Summarized entries from `WORKLOG.md`. Grouped by sprint/phase.
> Older sections may be consolidated into higher-level summaries as this file grows.

---

## Sprint 1: Project Scaffolding (T1.1–T1.4) — 2026-03-28

**Summary:** Set up pnpm monorepo (frontend/backend/shared), TypeScript strict mode, ESLint 9, Prettier. React 19 + Vite 8 + Tailwind v4 (CSS-first) + shadcn/ui (new-york, 14 components). React Router v7 (9 routes), TanStack Query + Zustand. Full app shell with collapsible sidebar, dark mode. Defined all entity/API/WS types with branded IDs. Built mock data layer: fixtures, in-memory CRUD API with latency, TanStack Query hooks, mock WebSocket, 60s demo mode.

**Key decisions:** Node 22/pnpm 10, ESM throughout, `verbatimModuleSyntax`, Tailwind v4 `@theme` blocks, dark mode via `.dark` class + HSL vars, branded IDs (`StoryId = \`st-\${string}\``), mock API returns copies, singleton WS EventEmitter.

**Core patterns:** `cn()` utility, named exports, kebab-case files, `@/` path alias, query hooks in `hooks/use-*.ts`, mock data in `mocks/`, Zustand persist to localStorage.

---

## Sprint 2: Dashboard (T2.1.1–T2.1.5) — 2026-03-28

**Summary:** Built dashboard with 4 stat cards (active agents, pending proposals, needs attention, today's cost), active agents strip (horizontal scroll, live elapsed time, pulsing dots), recent activity feed (unified from executions/comments/proposals, color-coded icons, persona avatars), upcoming work widget (next 5 dispatchable tasks), cost summary widget (recharts sparkline, monthly cap progress bar).

**Key decisions:**
- `useDashboardStats()` aggregates across stories, executions, proposals in one hook
- Activity feed uses `useActivityEvents()` which merges 3 data sources by timestamp
- Recharts for chart components (cost sparkline)

**Patterns established:**
- Dashboard features in `features/dashboard/` directory
- Status card pattern: icon + label + value + trend indicator
- Elapsed time with `useEffect` interval for live counters

---

## Sprint 2: Story Board / Kanban (T2.2.1–T2.2.6) — 2026-03-28

**Summary:** Built kanban board with columns from workflow states, story cards (title, priority badge, labels, task progress, proposal badge, active agent indicator), drag-and-drop via @dnd-kit, transition prompt modal (shows trigger persona + run/skip/cancel), filter bar (label/priority/persona/proposals multi-select, sort options, URL params), inline story creation ("+" in Backlog column).

**Key decisions:**
- @dnd-kit over react-beautiful-dnd (better maintained, more flexible)
- Filters persisted in URL search params via `useSearchParams`
- Transition modal only appears when target column has a trigger configured
- Inline creation form only on initial (Backlog) state column

**Patterns established:**
- Kanban features in `features/kanban/` directory
- `StoryCard` reusable component with `priorityConfig` color mapping
- DndContext wraps the board, each column is a Droppable, cards are Draggable

---

## Sprint 2: Story Detail (T2.3.1–T2.3.2) — 2026-03-28

**Summary:** Built story detail as full-page view at `/stories/:id`. Header with inline-editable title (click to edit, Enter/Escape), state badge, priority selector (P0-P3 colored), editable label pills. Description section with markdown textarea + preview toggle (Write/Preview tabs), acceptance criteria section. Both editable inline with save/cancel via `useUpdateStory`.

**Key decisions:**
- Full-page layout over Sheet (route already existed, more room for content)
- Lightweight inline markdown renderer (`MarkdownPreview`) — paragraphs, bold, code, bullets
- `EditableSection` reusable for both description and acceptance criteria

**Patterns established:**
- Story detail features in `features/story-detail/` directory
- Inline edit pattern: view mode → click "Edit" → Write/Preview tabs → Save/Cancel
- `priorityConfig` maps P0-P3 to colors (duplicated from story-card.tsx — extract if reused again)

---

## Sprint 2: Story Detail continued (T2.3.3–T2.3.7) — 2026-03-28 to 2026-03-29

**Summary:** Completed Story Detail with child tasks section (task rows + mini SVG dep graph + inline add form), proposals section (amber-themed approve/reject/bulk), comment stream (reusable for stories+tasks, 3 author types, Cmd+Enter), execution timeline (vertical timeline with persona avatars, expandable logs, cost/outcome badges), and story metadata sidebar (collapsible with dates, workflow, trigger status, rejection count). Added shadcn Checkbox and Collapsible components.

**Key decisions:**
- `CommentStream` and `ExecutionTimeline` designed as reusable components via `targetId` prop — shared between story detail and task detail
- Mini dep graph uses SVG with topological sort layout
- Collapsible pattern: shadcn Collapsible with ChevronDown rotation, used across many components

**Patterns established:**
- Reusable components: `CommentStream`, `ExecutionTimeline` (used in both story + task detail)
- Collapsible sections: open/closed by default varies by importance
- Persona avatar pattern: `persona.avatar.color + "20"` for transparent bg, Bot icon with inline color

---

## Sprint 3: Task Detail (T2.4.1–T2.4.5) — 2026-03-29

**Summary:** Built Task Detail with full-page view (header with title/state/persona/story link), inherited context (collapsible panel with parent story context), dependency info ("Depends on"/"Blocks" lists with state-colored badges), execution context viewer (3 collapsible sections: previous runs, rejection payloads, project memory), and rejection history (vertical timeline with severity badges, attempt counters, current attempt highlighted). Added mock data: EXEC_7 rejected execution for TASK_1_1.

**Key decisions:**
- Task detail reuses `CommentStream` and `ExecutionTimeline` from story-detail
- Execution context shows what the agent received — useful for debugging agent behavior
- Rejection history only renders when rejections exist (returns null otherwise)

**Patterns established:**
- Task detail features in `features/task-detail/` directory
- Severity badge pattern: low=yellow, medium=amber, high=red
- "Current attempt" highlighting with ring + colored bg + badge

---

## Sprint 3: Agent Monitor (T2.5.1–T2.6.2) — 2026-03-29

**Summary:** Built Agent Monitor with split-pane layout (sidebar + terminal), active agent sidebar list (persona avatar, live elapsed time, cost ticker, pulsing status dot), terminal-style output renderer (typed chunks: text/code/thinking, auto-scroll + scroll lock), tool call display (collapsible sections with tool icons, status indicators, formatted JSON I/O, mini diff view), multi-agent split view (CSS grid 2-3 panes, independent selectors, responsive fallback), agent control bar (stop/force stop with dialogs, model badges, live counters), agent history list (sortable table, expandable rows with terminal renderer), and history filters with aggregate stats (persona/outcome/cost filters, stats bar). Enhanced mock WS to support typed chunks. Added second running execution (EXEC_8) for split view testing.

**Key decisions:**
- `processChunks()` pairs tool_call + tool_result by `toolCallId` into `DisplayItem` union type
- Mock WS `simulateAgentOutput` accepts typed chunks: plain strings → "text", objects with `chunkType`
- Agent monitor uses Live/History tabs (shadcn Tabs)
- History omitted date range filter (needs datepicker component) — acceptable scope reduction

**Patterns established:**
- Agent monitor features in `features/agent-monitor/` directory
- Tool icon mapping: Read→FileText, Edit→PenLine, Write→FilePlus2, Grep→Search, Glob→FolderSearch, Bash→TerminalSquare, WebFetch/WebSearch→Globe
- Model badge pattern: `modelConfig` maps opus→purple, sonnet→blue, haiku→emerald
- Live counter: `useState` + `useEffect` with `setInterval(1000)` and `tabular-nums` CSS
- StatusIndicator: Loader2 spinning blue (running), Check emerald (success), X red (error)

---

## Sprint 4: Activity Feed (T2.7.1–T2.7.2) — 2026-03-29

**Summary:** Built activity feed page with full chronological event stream (10 event types: state_change, comment_added, agent_started/completed/failed, task_created, proposal_created/approved/rejected, cost_alert), date grouping with sticky headers, persona avatars, entity links. Filter bar with event type checkboxes (expandable grid), persona/story/date dropdowns, clear all. Live WS subscription via `mockWs.subscribeAll()` with `wsEventToActivity()` converter, slide-down animation for new events, "new events" indicator when scrolled. Zustand activity store for unread nav badge (sky-blue, "9+" cap).

**Key decisions:**
- `useBaseActivityEvents()` builds from executions/comments/proposals mock data
- `useLiveActivityEvents()` subscribes to all WS events, converts via mapping function
- Activity store: simple `{unreadCount, increment, reset}` — reset on mount, increment on WS
- CSS `@keyframes slide-down` animation for live events entering the feed

**Patterns established:**
- Activity feed features in `features/activity-feed/` directory
- `useActivityStore` Zustand store in `stores/activity-store.ts`
- Sidebar badge pattern: conditional Badge with count, "9+" overflow

---

## Sprint 4: Workflow Designer early (T2.8.1–T2.8.3) — 2026-03-29

**Summary:** Built workflow designer with 3-column layout (260px sidebar + flex canvas + 280px right panel). Sidebar: workflow list with type badges (violet=story, blue=task), state count, Default badge, hover actions (Duplicate, Delete with AlertDialog), "Create new" button. Canvas: SVG-based state machine with BFS layout algorithm (level-based horizontal positioning from initial state), cubic bezier arrows (forward right→left, backward bottom→bottom), arrowhead rotation, grid dot pattern, drag support with SVG coordinate transform and 5px click-vs-drag threshold. State editing: click-to-select with properties panel (name, 12-color swatch + hex input, initial/final checkboxes), add state via button/double-click, delete with transition cleanup confirmation.

**Key decisions:**
- SVG-based canvas (no external graph library) — custom BFS layout + bezier paths
- `transitionKey()` = "from→to→name" for unique transition identification
- `resolvedTransition` derived from workflow data (not separate state) to stay in sync after mutations
- Click vs drag: 5px mouse movement threshold
- `key={selectedStateName}` resets properties panel on selection change

**Patterns established:**
- Workflow designer features in `features/workflow-designer/` directory
- `computeLayout()` — BFS from initial state, assigns levels, horizontal positioning with vertical centering
- `computeArrowPath()` — cubic bezier, forward vs backward paths
- `ConnectionHandle` on right edge for drag-to-connect
- State/transition selection mutually exclusive in layout
