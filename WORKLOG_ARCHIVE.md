# AgentOps — Work Log Archive

> Summarized entries from `WORKLOG.md`. Grouped by sprint/phase.
> Older sections may be consolidated into higher-level summaries as this file grows.

---

## Sprint 1: Monorepo & Tooling (T1.1.1–T1.1.3) — 2026-03-28

**Summary:** Set up pnpm monorepo with 3 packages (frontend, backend, shared). TypeScript strict mode with project references, bundler moduleResolution, `verbatimModuleSyntax`. ESLint 9 flat config with React plugins for frontend. Prettier with double quotes, trailing commas, 100 width.

**Key decisions:**
- Node 22 LTS, pnpm 10
- Shared package exports `.ts` source directly (not compiled)
- Root `"type": "module"` for ESM throughout
- `verbatimModuleSyntax` requires `import type` for type-only imports

**Patterns established:**
- `@/` path alias in frontend (tsconfig + vite.config)
- Composite project references: shared → frontend, shared → backend
- `pnpm build` runs all packages, `pnpm typecheck` for type checks

---

## Sprint 1: Frontend Foundation (T1.2.1–T1.2.7) — 2026-03-28

**Summary:** Scaffolded React 19 + Vite 8 + Tailwind v4 frontend. Installed shadcn/ui (new-york style, 14 components). React Router v7 with 9 route stubs. TanStack Query + Zustand with persist. Full app shell with collapsible sidebar, project switcher, status bar. Dark mode with system/light/dark cycle.

**Key decisions:**
- Tailwind v4 CSS-first — `@theme` blocks in index.css, no tailwind.config.ts
- shadcn/ui `@theme inline` block maps CSS vars to Tailwind utilities
- Dark mode via `.dark` class on `<html>`, HSL CSS variables
- Zustand `persist` middleware stores sidebar + theme to localStorage (`agentops-ui` key)
- `tslib` added as direct dep to fix pnpm strict mode issue with react-remove-scroll

**Patterns established:**
- `cn()` utility from `@/lib/utils` for class merging
- Named exports, kebab-case files, PascalCase components
- `useThemeSync()` hook in RootLayout for theme class management
- NavLink with active state in sidebar, conditional tooltips when collapsed
- `TooltipProvider` wraps entire app at RootLayout level

**Files of note:**
- `src/index.css` — theme tokens, dark mode vars, shadcn inline theme
- `src/stores/ui-store.ts` — Zustand with persist
- `src/hooks/use-theme.ts` — theme sync hook
- `src/components/sidebar.tsx` — full sidebar with nav, project switcher, theme toggle
- `src/layouts/root-layout.tsx` — app shell layout

---

## Sprint 1: Shared Types & Mock Data (T1.3.1–T1.4.5) — 2026-03-28

**Summary:** Defined all entity types (Project, Story, Task, TaskEdge, Workflow, Persona, Trigger, Execution, Comment, ProjectMemory, Proposal) with branded ID types (nanoid-based prefixes). API contract types (request/response) and WebSocket event types. Created comprehensive mock fixtures with cross-referenced data. Built in-memory mock API with full CRUD and simulated latency. TanStack Query hooks for all API calls with optimistic updates. Mock WebSocket system with typed event emitter. Demo mode with 60-second scripted lifecycle replay.

**Key decisions:**
- Branded ID types: `StoryId = \`st-\${string}\``, `TaskId = \`tk-\${string}\`` — require `as string` casts for Map/Set ops
- Mock API returns copies (not references) to simulate real API behavior
- Query keys follow `["entity", id?]` pattern with helper factory
- WebSocket mock uses singleton EventEmitter pattern

**Patterns established:**
- Entity types in `packages/shared/src/entities.ts`, IDs in `ids.ts`, API types in `api-types.ts`, WS events in `ws-events.ts`
- Mock fixtures in `mocks/fixtures.ts`, API in `mocks/api.ts`, WS in `mocks/ws.ts`, demo in `mocks/demo.ts`
- Query hooks in `hooks/use-*.ts`, re-exported from `hooks/index.ts`
- `queryKeys` factory in `hooks/query-keys.ts`

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
