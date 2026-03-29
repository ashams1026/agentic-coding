# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

## Refinements: UI Polish & UX Improvements

> Priority: complete these before continuing with Sprint 4 remaining tasks.

### Sidebar Fixes

- [x] **R.1** — Fix sidebar spacing and alignment. Normalize padding/gaps between collapsed and expanded states. Fix badge sizing consistency (currently different sizes: `h-3.5 w-3.5` collapsed vs `h-5 min-w-5` expanded). Adjust project switcher vertical alignment within `h-14` container. Normalize nav item padding so collapsed items don't look unbalanced (`px-0 py-2` → adjust vertical padding too). Files: `packages/frontend/src/components/sidebar.tsx`.

- [x] **R.2** — Improve sidebar transitions. Change from `transition-all duration-200` to `duration-300 ease-in-out`. Smooth badge transitions between collapsed/expanded instead of popping in/out. Consider animating label opacity separately from width. File: `packages/frontend/src/components/sidebar.tsx`.

- [x] **R.3** — Add sidebar mobile responsiveness. On screens < 768px: hide sidebar by default, add hamburger menu button in the status bar or top bar to toggle sidebar as an overlay with backdrop. Sidebar should slide in from left with animation. Close on backdrop click or navigation. Files: `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/layouts/root-layout.tsx`.

### Story/Task UX Overhaul

- [x] **R.4** — Extract shared detail components. Move `CommentStream` and `ExecutionTimeline` from `features/story-detail/` to `features/common/` since they're reused by both story and task detail views. Update all imports. Files: `packages/frontend/src/features/story-detail/comment-stream.tsx`, `packages/frontend/src/features/story-detail/execution-timeline.tsx`, and all consumers.

- [x] **R.5** — Build story list view with master-detail panels. New layout for `/board` (or new `/stories` route): left panel is a filterable/sortable story list (compact rows: title, state badge, priority, task progress). Clicking a story opens its detail in a right side-panel (~50-60% width). Reuse existing story detail components (StoryDetailHeader, StoryDescription, ChildTasksSection, ProposalsSection, CommentStream, ExecutionTimeline, StoryMetadata). Add a toggle to switch between list view and kanban board view. Keep both views available. Files: create `packages/frontend/src/features/story-list/` directory with new components, update router.

- [review] **R.6** — Build nested task detail panel. When a task is clicked in the story detail side-panel, open the task detail in a second nested panel (pushing the story panel narrower, or replacing it with breadcrumb navigation back). Reuse existing task detail components (InheritedContext, DependencyInfo, ExecutionContextViewer, RejectionHistory, CommentStream, ExecutionTimeline). Task panel should show parent story link as breadcrumb at top. Files: extend the master-detail layout from R.5.

---

## Sprint 4: Activity Feed, Workflow Designer, Persona Manager, Settings (Phase 2F-2I)

### Persona Manager

- [x] **T2.9.4** — Build tool configuration section. Two groups: "SDK Tools" (Read, Edit, Glob, Grep, Bash, Write, WebFetch, WebSearch — checkboxes) and "AgentOps Tools" (create_tasks, transition_state, request_review, flag_blocked, post_comment, list_tasks, get_context — checkboxes). Each tool has a tooltip describing what it does. Presets button: "Tech Lead preset", "Engineer preset", etc.

- [x] **T2.9.5** — Build test run panel. Collapsible section at bottom of persona editor. Text input for a sample prompt. "Test" button runs against mock (simulates agent output with the persona's config). Shows output in mini terminal renderer. Helps user validate the persona before using it in a workflow.

### Settings

- [x] **T2.10.1** — Build settings page layout. Vertical sections with clear headings, separated by dividers. Sidebar or tab nav for sections: Projects, API Keys, Concurrency, Costs, Appearance, Service, Data.

- [ ] **T2.10.2** — Build projects section. List of registered projects: name, path, default workflow. "Add project" form: name input, path input (with folder picker or paste), workflow selector. Edit/remove actions. Validate path exists indicator.

- [ ] **T2.10.3** — Build API keys and concurrency section. Anthropic API key: masked input, "Test connection" button (mock success). Max concurrent agents: slider (1-10) with current value. Per-persona limits: optional table of persona → max concurrent.

- [ ] **T2.10.4** — Build cost management section. Monthly cost cap: dollar input with progress bar showing current spend. Warning threshold: percentage input. Daily spend limit: optional dollar input. Cost history: simple bar chart of last 30 days.

- [ ] **T2.10.5** — Build appearance and service section. Theme toggle: light/dark/system. Density: comfortable/compact. Service status: mock pm2 status (uptime, memory, restarts). Restart button (mock). Data section: database size display, "Export settings" and "Clear execution history" buttons (mock actions).

### Global Components

- [ ] **T2.11.1** — Build command palette (Cmd+K). Modal overlay with search input. Quick navigation: type screen name to jump. Search stories/tasks by title. Quick actions: "Create story", "View active agents". Results grouped by category. Keyboard navigable (arrow keys + enter). Dismiss with Escape.

- [ ] **T2.11.2** — Build toast notification system. Non-blocking toasts in bottom-right corner. Types: success (green), error (red), info (blue), warning (amber). Auto-dismiss after 5s. Stack up to 3. Action button support (e.g., "View" on "Agent completed task"). Wire up to mock WebSocket events.

- [ ] **T2.11.3** — Build loading skeletons and empty states. Skeleton components matching each screen's layout (shimmer animation). Empty states for: no stories ("Create your first story"), no agents running ("All quiet"), no activity ("Nothing yet"), no personas ("Set up your team"). Each empty state has an icon/illustration, description, and CTA button.

- [ ] **T2.11.4** — Build nav badges and status bar. Story Board nav item: badge showing pending proposal count. Agent Monitor nav item: badge showing active agent count. Status bar (bottom): current project name, active agents count with pulsing dot, today's cost, system health dot (green/red). All driven by mock data.

### Demo Mode & WebSocket Integration

- [ ] **T2.12.1** — Wire up mock WebSocket to all UI components. Dashboard: active agents strip updates live, activity feed gets new entries. Kanban: cards animate between columns on state change events. Story detail: new comments appear, execution timeline updates. Agent monitor: output streams in real-time. Toast notifications fire on key events. Ensure all screens feel alive and reactive.

- [ ] **T2.12.2** — Build demo mode. "Watch Demo" button on dashboard (or `?demo=true`). Scripted sequence: creates a story, PM agent runs (streaming output visible in agent monitor), story gets criteria, Tech Lead decomposes (proposals appear with badge), user auto-approves, Engineers work in parallel (multi-agent monitor), Reviewer reviews, QA tests, story completes. Toast notifications and activity feed update throughout. ~60 second replay. Can be paused/stopped.
