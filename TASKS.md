# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

## Sprint 2: Core UI Screens (Phase 2A-2C)

### Story Detail (continued)

- [x] **T2.3.3** — Build child tasks section. List of tasks belonging to this story. Each task row: checkbox (state), title, state badge, assigned persona avatar, dependency indicator (icon if has deps). Mini dependency graph visualization using a simple node-edge layout (tasks as small boxes, arrows for edges). "Add task" button opens inline form.

- [x] **T2.3.4** — Build proposals section. Only visible when story has pending proposals. Yellow/amber highlight panel at top of detail. Lists proposed tasks from Tech Lead agent. Each: title, description (editable inline), approve button (green), reject button (red). "Approve all" bulk action. Reject shows textarea for feedback. Approved tasks appear in child tasks list.

- [review] **T2.3.5** — Build comment stream component. Reusable for both stories and tasks. Chronological thread. Agent comments: persona avatar (colored circle) + name + timestamp + content. User comments: user avatar + timestamp + content. System comments: muted style, icon, "Story moved to In Review" etc. Agent comments may have metadata chips (files changed, tools used). Input box at bottom — user types and posts comment via mock API. Auto-scroll to bottom on new comments. Scroll up to read history.

- [ ] **T2.3.6** — Build execution history timeline. Vertical timeline on the story detail. Each entry: persona avatar, "Tech Lead ran for 2m 34s", cost badge ("$0.42"), outcome badge (green success / red failure / amber rejected). Click to expand: shows full agent output (reuse terminal renderer from agent monitor). Collapsed by default — shows summary only.

- [ ] **T2.3.7** — Build story metadata sidebar. Right column or collapsible section. Shows: created date, updated date, project name, workflow name, current trigger status ("Waiting for Engineer"), retry count (if in rejection loop). Read-only context info.

---

## Sprint 3: Task Detail & Agent Monitor (Phase 2D-2E)

### Task Detail

- [ ] **T2.4.1** — Build task detail view. Same slide-out pattern as story detail. Header: title, state badge, assigned persona, parent story link (click navigates to story). Tabs or sections for the content areas below.

- [ ] **T2.4.2** — Build inherited context section. Collapsible panel showing context passed from parent story: story description excerpt, acceptance criteria, any notes the Tech Lead left. Clearly labeled "Inherited from [Story Name]".

- [ ] **T2.4.3** — Build dependency info display. "Depends on" list: each dependency shows task title + state badge (green if resolved, yellow if in-progress, gray if pending). "Blocks" list: tasks that depend on this one. Visual indicator if this task is currently blocking something.

- [ ] **T2.4.4** — Build execution context viewer. Shows what context the agent received for this task. Collapsible sections: "Previous run summaries" (from executionContext), "Rejection payloads" (if any), "Project memory injected". Useful for debugging why an agent behaved a certain way.

- [ ] **T2.4.5** — Build rejection history display. Only visible if task has been rejected. Timeline of rejection events: reviewer persona avatar, rejection reason, severity badge, retry hint, retry count ("Attempt 2 of 3"). Current attempt highlighted.

### Agent Monitor — Live View

- [ ] **T2.5.1** — Build agent monitor page layout. Split-pane: left sidebar (~250px) lists active agents, main area shows selected agent output. If no agents active, show empty state with "No agents running" and link to story board.

- [ ] **T2.5.2** — Build active agent sidebar list. Each entry: persona avatar, persona name, task name (truncated), elapsed time (live counter), cost ticker (live), status dot (pulsing green = running). Click selects agent and shows output in main pane. Sort by start time. Badge count in sidebar nav updates.

- [ ] **T2.5.3** — Build terminal-style output renderer. Monospace font display area. Renders agent output as it streams (via mock WebSocket). Text blocks: normal style. Code blocks: syntax highlighted (use a lightweight highlighter). Thinking/reasoning: italic, muted color. Auto-scrolls to bottom. "Scroll lock" toggle: when user scrolls up, pause auto-scroll, show "New output below ↓" indicator.

- [ ] **T2.5.4** — Build tool call display sections. When agent makes tool calls, show as collapsible sections in the output stream. Header: tool icon + tool name + status (running spinner / success check / error x). Collapsed: one-line summary. Expanded: tool input (formatted JSON or code) + tool output (formatted). File edits show mini diff view.

- [ ] **T2.5.5** — Build multi-agent side-by-side view. Toggle button: "Split view". Shows 2-3 agent output panes side-by-side. Each pane has its own agent selector dropdown. Useful when multiple agents work in parallel. Falls back to single pane on narrow screens.

- [ ] **T2.5.6** — Build agent control bar. Below agent info header. Buttons: "Stop" (graceful cancel — confirmation dialog), "Force Stop" (warning dialog), link to task detail, link to story. Show persona name, model badge (opus/sonnet/haiku), elapsed time, running cost.

### Agent Monitor — History View

- [ ] **T2.6.1** — Build agent history list. Tab or toggle: "Live" / "History" on the agent monitor page. Table/list of past executions. Columns: persona avatar + name, task/story title, started time, duration, cost, outcome badge. Sortable columns. Click expands to full output (reuse terminal renderer).

- [ ] **T2.6.2** — Build history filters and aggregate stats. Filter by: persona, outcome (success/failure/rejected), date range, cost range. Stats bar above list: total runs, total cost, success rate %, average duration. Updates reactively as filters change.

---

## Sprint 4: Activity Feed, Workflow Designer, Persona Manager, Settings (Phase 2F-2I)

### Activity Feed

- [ ] **T2.7.1** — Build activity feed page. Full-page chronological stream. Each event entry: timestamp, colored icon by type, persona avatar (if agent-sourced), description text, link to source entity. Types: state transition, agent started, agent completed, agent failed, comment posted, proposal created, proposal approved/rejected, manual override, cost alert.

- [ ] **T2.7.2** — Build activity feed filters and real-time updates. Filter bar: by event type (checkboxes), by persona, by story, by date range. New events animate in at top (slide-down animation, via mock WebSocket). "New events" indicator if user has scrolled down. Unread count badge on Activity Feed nav item.

### Workflow Designer

- [ ] **T2.8.1** — Build workflow list sidebar. Left sidebar showing all workflows. Each entry: name, type badge (story/task), state count. "Create new" button. "Duplicate" and "Delete" actions. Click selects workflow for editing in main canvas.

- [ ] **T2.8.2** — Build state machine canvas. Main area: states rendered as rounded rectangles positioned on a canvas. Each state: name, color, entry/exit indicators. Transitions as directed arrows between states, labeled with transition name. Use a layout algorithm for initial positioning (dagre or similar). States are draggable to rearrange.

- [ ] **T2.8.3** — Build state editing interactions. Click state to select → properties panel on right: edit name, color, set as initial/final. "Add state" button or double-click canvas to create new state. Delete state (with confirmation if transitions exist). Visual indicators: initial state has a filled circle, final states have double border.

- [ ] **T2.8.4** — Build transition creation and editing. Drag from one state's edge to another to create a transition. Click transition arrow to select → properties panel: transition name, trigger configuration. Delete transition via properties panel or keyboard shortcut.

- [ ] **T2.8.5** — Build trigger configuration panel. When a transition is selected, show trigger options in properties panel: assign persona (dropdown of all personas with avatars), dispatch mode (auto/propose/gated radio), max retries (number input), advancement mode (auto/approval/agent). Shows "No trigger" option to leave transition manual-only.

- [ ] **T2.8.6** — Build validation warnings. Real-time validation as user edits: warning badges on orphan states (no incoming transitions except initial), unreachable final states, missing initial state. Warning panel at bottom listing all issues. Prevent save if critical issues exist.

- [ ] **T2.8.7** — Build workflow templates. "Templates" tab in sidebar: "Default Story Workflow" and "Default Task Workflow" pre-built. "Use template" button clones into a new editable workflow. Templates show preview thumbnail.

### Persona Manager

- [ ] **T2.9.1** — Build persona list view. Grid of persona cards. Each card: avatar (colored circle + icon), name, model badge (opus/sonnet/haiku), description snippet (2 lines), tool count pill. Quick actions on hover: Edit, Duplicate, Delete. "Create new persona" card with + icon. Built-in personas have a "Built-in" badge (editable but restorable).

- [ ] **T2.9.2** — Build persona editor. Full-page or large sheet. Sections: Identity (name, description, avatar picker — choose color + icon), Model (selector with cost/capability info per model), System Prompt (large editor), Tools (checklists), Budget (max per run input).

- [ ] **T2.9.3** — Build system prompt editor. Large textarea with monospace font. Markdown preview toggle (side-by-side or switch). Line numbers. Character/token count estimate in footer. Placeholder text showing a good example prompt for the persona type.

- [ ] **T2.9.4** — Build tool configuration section. Two groups: "SDK Tools" (Read, Edit, Glob, Grep, Bash, Write, WebFetch, WebSearch — checkboxes) and "AgentOps Tools" (create_tasks, transition_state, request_review, flag_blocked, post_comment, list_tasks, get_context — checkboxes). Each tool has a tooltip describing what it does. Presets button: "Tech Lead preset", "Engineer preset", etc.

- [ ] **T2.9.5** — Build test run panel. Collapsible section at bottom of persona editor. Text input for a sample prompt. "Test" button runs against mock (simulates agent output with the persona's config). Shows output in mini terminal renderer. Helps user validate the persona before using it in a workflow.

### Settings

- [ ] **T2.10.1** — Build settings page layout. Vertical sections with clear headings, separated by dividers. Sidebar or tab nav for sections: Projects, API Keys, Concurrency, Costs, Appearance, Service, Data.

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
