# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

## Sprint 4: Activity Feed, Workflow Designer, Persona Manager, Settings (Phase 2F-2I)

### Persona Manager

- [x] **T2.9.4** — Build tool configuration section. Two groups: "SDK Tools" (Read, Edit, Glob, Grep, Bash, Write, WebFetch, WebSearch — checkboxes) and "AgentOps Tools" (create_tasks, transition_state, request_review, flag_blocked, post_comment, list_tasks, get_context — checkboxes). Each tool has a tooltip describing what it does. Presets button: "Tech Lead preset", "Engineer preset", etc.

- [review] **T2.9.5** — Build test run panel. Collapsible section at bottom of persona editor. Text input for a sample prompt. "Test" button runs against mock (simulates agent output with the persona's config). Shows output in mini terminal renderer. Helps user validate the persona before using it in a workflow.

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
