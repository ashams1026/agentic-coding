# AgentOps - Agentic Coding Application

## Vision

A local-first, workflow-driven application that orchestrates AI coding agents. Runs as a system service on the user's machine with a web-based UI for managing stories, designing workflows, configuring agent personas, and monitoring execution. Users define story lifecycles as state machines — each state transition can trigger a specialized agent persona to autonomously perform its role (planning, coding, reviewing, testing, etc.).

**The UI is the product.** A clear, intuitive, modern interface is what makes autonomous agents trustworthy. Every feature exists to give the user visibility into what agents are doing, what they did, what's upcoming, and what needs their input.

---

## Core Concepts

### Stories & Tasks (Two-Tier Work Items)
- **Story** — a top-level work item (feature, bug, refactor) that moves through a user-defined workflow
- **Task** — a smaller unit of work decomposed from a story, also moves through its own workflow
- Stories contain tasks. A story's progression can depend on its child tasks completing.
- Tasks inherit context from their parent story (acceptance criteria, relevant files, architectural notes)

### Dependency Graph (DAG)
- Work items (stories and tasks) form a **directed acyclic graph** via explicit dependency edges
- Dependencies are first-class: `task_edges` table with typed relationships (`blocks`, `depends_on`, `related_to`)
- **Ready work detection**: a task is "ready" when it's in a triggerable state AND all upstream dependencies are resolved
- The trigger dispatcher uses DAG-awareness — triggers only fire when dependency constraints are satisfied

### Workflows (State Machines)
- A **workflow** defines the states a story or task can be in, and the valid transitions between them
- Workflows are user-configurable — not hardcoded
- Custom-built workflow engine (~80-120 lines), designed for xstate upgrade path if needed later
- Example story workflow: `Backlog → Planning → Ready → In Progress → In Review → Testing → Done`
- Example task workflow: `Queued → In Progress → In Review → Done | Failed`

### Agent Personas
- A **persona** is a named agent configuration: system prompt, model, allowed tools, behavior constraints
- Examples: "Tech Lead", "Engineer", "Code Reviewer", "QA Engineer", "Product Manager", "Router"
- **Router** personas are a lightweight archetype: fast model (haiku), read-only tools + `route_to_state`, designed for quick evaluation at decision points
- Personas are reusable across workflows and projects
- Each persona has a scoped set of custom MCP tools (e.g., Tech Lead gets `create_tasks`, Engineer gets `flag_blocked`)

### Triggers
- A **trigger** binds a workflow state transition to an agent persona
- "When story enters `Ready for Implementation`, spawn the `Tech Lead` persona"
- "When task enters `In Progress`, spawn the `Engineer` persona"
- Triggers are the core automation primitive — they replace simple cron-based scheduling
- Four dispatch modes per trigger: `auto` | `propose` | `gated` | `evaluate`
- Two-phase dispatch: (1) state transition matches trigger, (2) dependency graph check confirms all upstream resolved

### Evaluate Transitions (Adaptive Routing)
- At certain workflow nodes, instead of a fixed next state, an **evaluator agent** decides the path
- Evaluator triggers bind to **multiple possible target states** — the agent picks which one
- Evaluator agents are a lightweight persona archetype: fast model (haiku), read-only tools, plus `route_to_state` MCP tool
- The evaluator reads task/story context, codebase state, and decides: needs more planning? ready for work? should be split? blocked?
- Routing reasoning is stored as a comment on the task (audit trail for why the router chose that path)
- In the workflow designer, evaluate nodes appear as diamond-shaped decision points with fan-out edges
- Example:
  ```
  Task enters [Ready] → Evaluate trigger fires → Router agent spawns
    → "Task is clear and small" → routes to [In Progress] → Engineer
    → "Task is too vague" → routes to [Needs Planning] → Tech Lead
    → "Task should be split" → routes to [Decomposition] → Tech Lead
    → "Missing info" → routes to [Blocked] → User notified
  ```

### Comment Stream
- Every story and task has a chronological **comment stream**
- Agents post comments noting work done, questions, messages for other agents, blockers
- Users post comments for guidance, feedback, or context
- Each comment has a timestamp, author (persona name or user), and content
- Comments persist across agent sessions — a running conversation trail on every work item

### Projects
- A **project** is a registered working directory on the local filesystem
- Stories and tasks are scoped to a project
- Agents are spawned with `cwd` set to the project directory
- Each project has an `agentops.md` context file (like CLAUDE.md) that all personas inherit

### Project Memory
- As stories complete, a compressed summary is generated (what was done, key decisions, files changed)
- Stored in `project_memory` table — recent memories injected into agent context at spawn time
- **Memory decay**: older memories are periodically consolidated into higher-level summaries to save context window
- Distinct from `agentops.md` (static project description) — project memory captures "what's been done recently"

### Execution Context (Per-Task Agent Memory)
- Each execution appends a structured summary to the task: what the agent did, tools used, outcome, rejection reason
- When a task is retried (e.g., after code review rejection), the next agent gets the previous execution history
- Bounded: last 3 full executions retained, older ones summarized (same decay pattern as project memory)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                   React/Vite/Tailwind                    │
│                 (Frontend Dashboard UI)                  │
│                                                          │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────────┐ │
│  │Dashboard │ │Story Board│ │ Workflow │ │  Agent     │ │
│  │ (Home)   │ │ (Kanban)  │ │ Designer │ │  Monitor   │ │
│  ├──────────┤ ├───────────┤ ├──────────┤ ├────────────┤ │
│  │Activity  │ │ Story     │ │ Persona  │ │  Settings  │ │
│  │  Feed    │ │  Detail   │ │ Manager  │ │            │ │
│  └──────────┘ └───────────┘ └──────────┘ └────────────┘ │
└───────────────────────┬──────────────────────────────────┘
                        │ REST / WebSocket
┌───────────────────────┴──────────────────────────────────┐
│                 Backend Service (Fastify)                 │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Story/Task   │  │ Workflow     │  │ Trigger        │  │
│  │ Manager      │  │ Engine       │  │ Dispatcher     │  │
│  │ (DAG-aware)  │  │ (custom)     │  │ (2-phase)      │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                   │           │
│  ┌──────┴─────────────────┴───────────────────┴────────┐  │
│  │              Persona Registry                        │  │
│  │  (Tech Lead, Engineer, Reviewer, QA, custom...)     │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                 │
│  ┌──────────────────────┴──────────────────────────────┐  │
│  │           Agent Executor (pluggable)                 │  │
│  │  ┌─────────────────┐  ┌──────────────────────────┐  │  │
│  │  │ ClaudeAgent     │  │ Future: Antigravity,     │  │  │
│  │  │ Executor        │  │ OpenAI, etc.             │  │  │
│  │  └─────────────────┘  └──────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────┐  ┌─────────────────────────────────┐  │
│  │ AgentOps MCP   │  │ Project Memory                  │  │
│  │ Server         │  │ (context decay + summarization) │  │
│  │ (custom tools) │  │                                 │  │
│  └────────────────┘  └─────────────────────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           SQLite (via better-sqlite3 + Drizzle)     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────────────────────────┐  │
│  │ Scheduler    │  │ Concurrency Manager              │  │
│  │ (node-cron)  │  │ (max agents, cost caps)          │  │
│  └──────────────┘  └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Data flow for a story lifecycle:**

```
User creates Story ("Add OAuth2 login")
  → Story enters [Backlog] state
  → User moves to [Planning] (manual transition)
  → Trigger fires: spawn "Product Manager" persona
  → PM agent posts comment: "Writing acceptance criteria..."
  → PM agent writes acceptance criteria, transitions story to [Ready]
  → Trigger fires: spawn "Tech Lead" persona
  → TL agent decomposes into Tasks (via create_tasks MCP tool) → tasks enter [Proposed]
  → TL agent posts comment: "Broke this into 3 tasks, OAuth callback needs to land first"
  → User reviews proposed tasks, approves/edits → tasks enter [Queued]
  → Trigger dispatcher checks each task: in triggerable state + deps resolved? → "ready work"
  → Trigger fires per ready task: spawn "Engineer" persona
  → Engineer agents work in parallel (respecting concurrency limits)
  → Engineer posts comment: "Implemented OAuth callback, added 2 new endpoints"
  → Each task completes → enters [In Review]
  → Trigger fires: spawn "Code Reviewer" persona
  → Reviewer approves → task advances
  → Reviewer rejects → posts comment with reason → task returns to [In Progress] → Engineer retries (max 3)
  → All tasks done → Story auto-transitions to [Testing]
  → Trigger fires: spawn "QA Engineer" persona
  → QA runs tests, posts comment: "All 12 tests passing, 94% coverage"
  → Story → [Done]
  → Project memory updated with story summary
```

---

## Research & Planning Tasklist

### Phase 0: Research & Decision-Making

- [x] **R0.1 — Evaluate agent SDKs** → Decided: Claude Agent SDK (TypeScript)
- [x] **R0.2 — Evaluate Google Antigravity** → Decided: Deferred, design executor as pluggable
- [x] **R0.3 — Evaluate local data storage** → Decided: better-sqlite3 + Drizzle ORM
- [x] **R0.4 — Evaluate system service approach** → Decided: pm2
- [x] **R0.5 — Evaluate backend framework** → Decided: Fastify
- [x] **R0.6 — Design workflow engine** → Decided: Custom engine (~80-120 lines), JSON schema in SQLite, xstate upgrade path
- [x] **R0.7 — Design persona system** → Decided: Layered system prompt (persona identity + project context via `agentops.md` + cached project summary), per-persona MCP tool allowlists
- [x] **R0.8 — Design story-to-task decomposition** → Decided: Via `create_tasks` custom MCP tool, propose-by-default (user reviews before queuing)
- [x] **R0.9 — Design state transition rules** → Decided: System auto-advances by default, configurable per trigger (`auto` | `propose` | `gated`). Workflow owns rejection flows with bounded retries (max 3).
- [x] **R0.10 — Evaluate Beads task system** → Decided: Build our own, adopt key patterns (DAG dependencies, hash IDs, memory decay, context-window-aware output, execution context)

---

### Phase 1: Project Scaffolding

- [ ] **T1.1 — Initialize monorepo structure**
  - `packages/frontend` — React/Vite/Tailwind app
  - `packages/backend` — Fastify service (minimal initially — serves mock data)
  - `packages/shared` — Shared types, schemas, workflow definitions
  - Tooling: TypeScript, pnpm workspaces, ESLint, Prettier

- [ ] **T1.2 — Set up frontend skeleton**
  - Vite + React + TypeScript + Tailwind CSS
  - React Router for routing
  - TanStack Query + Zustand for state
  - Component library setup (shadcn/ui or similar for polished, accessible components)
  - Base layout: sidebar nav, main content area, status bar
  - Dark mode support from day one

- [ ] **T1.3 — Set up mock data layer**
  - Mock data fixtures representing a realistic project state:
    - 1 project with `agentops.md`
    - 2 workflows (story + task)
    - 5 personas (PM, Tech Lead, Engineer, Reviewer, QA)
    - 3 stories in various states with child tasks
    - Dependency edges between tasks
    - Execution history with cost data
    - Comment streams with agent and user entries
    - Pending proposals
    - Active/completed agent runs
  - Mock API layer (MSW or simple in-memory store) that mimics real API contracts
  - Mock WebSocket events for live agent streaming simulation
  - Toggle: "demo mode" replays a scripted agent session for testing UI reactivity

- [ ] **T1.4 — Define shared types and schemas**
  - **ID convention**: short nanoid-style hash IDs (e.g., `st-x7k2m` for stories, `tk-p9f3n` for tasks, `ps-r8d2j` for personas). Collision-resistant, URL-safe, readable.
  - **Project**: id, name, path, defaultWorkflowId, settings, createdAt
  - **Story**: id, projectId, title, description, workflowId, currentState, priority, labels[], context (acceptance criteria, notes), createdAt, updatedAt
  - **Task**: id, storyId, title, description, workflowId, currentState, assignedPersonaId, parentTaskId (for sub-decomposition), inheritedContext (from parent story), executionContext[] (bounded history from previous runs), createdAt, updatedAt
  - **TaskEdge**: id, fromId, toId, type (`blocks` | `depends_on` | `related_to`) — DAG dependency graph
  - **Workflow**: id, name, type (`story` | `task`), states[], transitions[], initialState, finalStates[], isDefault
  - **Persona**: id, name, description, avatar (color + icon), systemPrompt, model (`opus` | `sonnet` | `haiku`), allowedTools[], mcpTools[] (custom tools this persona can call), maxBudgetPerRun, settings
  - **Trigger**: id, workflowId, fromState, toState (single state for auto/propose/gated, null for evaluate), personaId, dispatchMode (`auto` | `propose` | `gated` | `evaluate`), possibleTargets[] (for evaluate mode — list of valid target states the router can pick), maxRetries (default 3), config
  - **Execution**: id, taskId|storyId, personaId, status, startedAt, completedAt, costUsd, durationMs, summary (compressed), outcome (`success` | `failure` | `rejected`), rejectionPayload (reason, severity, hint), logs
  - **Comment**: id, targetId (storyId or taskId), targetType (`story` | `task`), authorType (`agent` | `user` | `system`), authorId (personaId or null), authorName, content, metadata (JSON — files referenced, tools used, etc.), createdAt
  - **ProjectMemory**: id, projectId, storyId (source), summary, filesChanged[], keyDecisions[], createdAt, consolidatedInto (for decay)
  - **Proposal**: id, executionId, parentStoryId|parentTaskId, type (`task_creation` | `state_transition` | `review_request`), payload (JSON), status (`pending` | `approved` | `rejected` | `expired`), createdAt

---

### Phase 2: UI Design & Build (Mocked)

> **This is the highest priority phase.** All screens are built against mock data to validate the UX before any backend logic is implemented. Every interaction, animation, and data flow should feel real — the mock layer simulates agent behavior, WebSocket events, and state transitions so we can experience the full product before writing backend code.

#### 2A: Dashboard (Home Screen)

- [ ] **T2.1 — Build dashboard layout**
  - At-a-glance overview — the first thing the user sees
  - **Status cards row**: Active agents (count + persona names), Pending proposals (count), Items needing attention (count), Today's cost
  - **Active agents strip**: horizontal cards showing each running agent — persona avatar, task name, elapsed time, live status indicator (pulsing dot), click to jump to agent monitor
  - **Recent activity feed** (compact): last ~10 events — state changes, agent completions, comments, proposals. Each entry: icon + persona avatar + description + timestamp. Click to navigate to source.
  - **Upcoming work**: next tasks ready for dispatch (from DAG ready-work query), showing what will fire next and which persona
  - **Cost summary widget**: sparkline chart of daily spend for the last 7 days, current month total vs cap
  - Responsive: works on wide and narrow viewports

#### 2B: Story Board (Kanban)

- [ ] **T2.2 — Build kanban board**
  - Columns per workflow state, populated from the active project's story workflow
  - Story cards: title, priority badge, label pills, task progress bar (3/5 tasks done), proposal badge (amber dot), active agent indicator (pulsing persona avatar)
  - **Drag-and-drop** between columns for manual state transitions
  - On drop: if trigger exists for that transition, show prompt — "This will trigger [Persona]. Run trigger / Skip trigger / Cancel"
  - Column header shows count of items
  - Filter bar: filter by label, priority, persona, has-proposals
  - Sort: by priority, created date, updated date
  - Quick-add: "+" button at top of Backlog column to create new story inline

- [ ] **T2.3 — Build story detail panel**
  - Slide-out panel (or full-page view) when clicking a story card
  - **Header**: story title (editable inline), priority selector, label pills (editable), current state badge, workflow name
  - **Description section**: rich text description, acceptance criteria, editable
  - **Child tasks section**:
    - Task list showing each task's state, assigned persona, dependency status
    - Mini dependency graph visualization (nodes = tasks, edges = dependencies)
    - Inline task state badges with progress
    - "Add task" button for manual task creation
  - **Proposals section** (if pending):
    - List of proposed tasks from Tech Lead agent
    - Each proposal: title, description, edit inline, approve/reject buttons
    - Bulk approve all / reject all with feedback
  - **Comment stream**:
    - Chronological thread of all comments on this story
    - Agent comments: persona avatar + name + timestamp + content
    - User comments: user avatar + timestamp + content
    - System comments: state changes, trigger fires, auto-transitions (muted style)
    - Comment input box at bottom — user can type replies
    - Comments from agents may include metadata: files changed, tools used (shown as subtle chips)
  - **Execution history timeline**:
    - Visual timeline of all agent executions on this story
    - Each entry: persona avatar, duration, cost, outcome badge (success/failure/rejected)
    - Click to expand: full agent output log
  - **Sidebar metadata**: created date, updated date, project, workflow, trigger status

#### 2C: Task Detail

- [ ] **T2.4 — Build task detail view**
  - Similar structure to story detail but scoped to a single task
  - **Header**: task title, state badge, assigned persona, parent story link
  - **Inherited context**: collapsible section showing context from parent story
  - **Dependency info**: what this task depends on (with state), what depends on this task
  - **Comment stream**: same as story but task-scoped
  - **Execution history**: per-task timeline with agent output, cost, duration
  - **Execution context viewer**: show what context the agent received (previous run summaries, rejection payloads) — useful for debugging agent behavior
  - **Rejection history** (if any): structured view of rejection payloads — decision, reason, severity, hint, retry count

#### 2D: Agent Monitor

- [ ] **T2.5 — Build agent monitor — live view**
  - **Split-pane layout**: left sidebar lists all active agents, main area shows selected agent's output
  - Agent list entries: persona avatar + name, task being worked on, elapsed time, cost ticker, status indicator
  - **Terminal-style output display**:
    - Streams agent output in real-time (via mock WebSocket)
    - Syntax highlighting for code blocks
    - Tool calls shown as collapsible sections: tool name, input, output
    - Thinking/reasoning shown in a muted/italic style
    - Auto-scroll with "scroll lock" toggle when user scrolls up to review
  - **Multi-agent view**: option to show 2-3 agent outputs side-by-side (split panes)
  - **Agent controls**: Stop (graceful cancel), Force stop, Pause/resume (if supported)
  - **Agent info header**: persona name, model being used, allowed tools, task link, story link

- [ ] **T2.6 — Build agent monitor — history view**
  - Searchable/filterable list of past agent executions
  - Columns: persona, task/story, started, duration, cost, outcome
  - Click to expand: full output log (same terminal-style renderer)
  - Aggregate stats: total cost, total runs, success rate, average duration
  - Filter by: persona, outcome, date range, cost range

#### 2E: Activity Feed

- [ ] **T2.7 — Build activity feed**
  - Full-page chronological stream of all system events
  - Event types (each with distinct icon + color):
    - State transitions (story/task moved to X)
    - Agent started / completed / failed
    - Comments posted (by agent or user)
    - Proposals created / approved / rejected
    - Triggers fired / queued / waiting on deps
    - User manual overrides
    - Cost alerts (approaching cap)
  - Each entry: timestamp, icon, persona avatar (if agent), description, link to source entity
  - Filters: by event type, persona, story, date range
  - Real-time: new events animate in at the top (via WebSocket)
  - Unread indicator: mark events since last visit

#### 2F: Workflow Designer

- [ ] **T2.8 — Build workflow designer**
  - **Visual state machine editor**:
    - Canvas area with states as rounded rectangles (nodes) and transitions as directed arrows (edges)
    - Add state: click canvas or "Add state" button → name, color, is-initial, is-final
    - Add transition: drag from one state to another → name the transition event
    - Select state/transition to configure in a right-side properties panel
  - **Trigger configuration** (on transitions):
    - Assign persona from dropdown
    - Set dispatch mode: auto / propose / gated / evaluate
    - For `evaluate` mode: select multiple possible target states (fan-out), assign router persona
    - Set max retries (for rejection loops)
    - Set advancement mode: auto / approval / agent
  - **Decision nodes**: evaluate triggers render as diamond shapes in the canvas with fan-out edges to each possible target state. Each edge labeled with the target state name.
  - **Validation**: real-time warnings — orphan states, unreachable end states, missing initial state
  - **Workflow templates**: "Default Story Workflow", "Default Task Workflow" — clone and customize
  - **Preview mode**: step through the workflow with mock data to see how triggers would fire
  - **Workflow list**: sidebar showing all workflows, create new, duplicate, delete

#### 2G: Persona Manager

- [ ] **T2.9 — Build persona manager**
  - **Persona list**: card grid or list view of all personas
    - Each card: avatar (color + icon), name, model badge, description snippet, tool count
    - Quick actions: edit, duplicate, delete, test
  - **Persona editor** (full-page or large modal):
    - Name, description, avatar picker (color + icon)
    - **System prompt editor**: large textarea with markdown preview, syntax highlighting
    - Model selector: opus / sonnet / haiku with cost/capability indicators
    - **Tool configuration**:
      - SDK tools checklist (Read, Edit, Glob, Grep, Bash, Write, WebFetch, WebSearch)
      - MCP tools checklist (create_tasks, transition_state, request_review, flag_blocked, post_comment, list_tasks, get_context)
    - Max budget per run (USD input)
    - **Test run panel**: enter a sample prompt, run against mock, see simulated output — validates the persona behaves as expected
  - **Built-in personas** (shipped with app): clearly marked, editable but restorable to defaults

#### 2H: Settings

- [ ] **T2.10 — Build settings page**
  - **Projects**: registered projects list, add/remove, edit path, set default workflow
  - **API Keys**: Anthropic API key input (masked), connection test button
  - **Concurrency**: max concurrent agents slider (1-10), per-persona limits
  - **Cost management**: monthly cost cap input, warning threshold, daily spend limit
  - **Appearance**: dark/light mode toggle, compact/comfortable density
  - **Service status**: pm2 status, uptime, restart button
  - **Data**: export/import settings, clear execution history, database size

#### 2I: Global UI Components

- [ ] **T2.11 — Build global layout and navigation**
  - **Sidebar navigation**: collapsible, icons + labels
    - Dashboard, Story Board, Agent Monitor, Activity Feed, Workflows, Personas, Settings
    - Project switcher at top of sidebar (dropdown)
    - Active agents count badge on Agent Monitor nav item
    - Pending proposals count badge on Story Board nav item
  - **Status bar** (bottom or top): current project name, active agents count, today's cost, system health indicator
  - **Command palette** (Cmd+K): quick navigation, search stories/tasks, quick actions
  - **Toast notifications**: non-blocking alerts for agent completions, proposal arrivals, errors
  - **Loading states**: skeleton screens for every view, optimistic updates
  - **Empty states**: helpful illustrations/text when no data exists (first-run experience)
  - **Responsive design**: works on 1280px+ screens, graceful degradation on smaller

- [ ] **T2.12 — Implement WebSocket mock for live updates**
  - Mock WebSocket that simulates:
    - Agent output streaming (text chunks, tool calls, results)
    - State transition events (story/task moved)
    - New comments arriving
    - Proposal creation events
    - Cost ticker updates
  - **Demo mode**: scripted replay of a full story lifecycle (agent decomposes → engineers work → reviewer reviews → QA tests → done) — plays out over ~60 seconds so you can watch the entire system in action
  - All UI views react to these events in real-time (kanban cards move, comments appear, agent monitor updates)

---

### Phase 3: Backend API & Data Layer

> Connect the mocked UI to real data. The API shape is defined by what the UI already needs.

- [ ] **T3.1 — Set up SQLite database with Drizzle**
  - Schema from T1.4 implemented as Drizzle tables
  - Migration system (Drizzle Kit)
  - Seed script that populates the same mock data from Phase 2

- [ ] **T3.2 — Implement project API**
  - `GET /projects`, `POST /projects`, `PATCH /projects/:id`, `DELETE /projects/:id`
  - Project registration validates path exists on disk

- [ ] **T3.3 — Implement story and task API**
  - Full CRUD for stories (scoped to project) and tasks (scoped to story)
  - Hash-based nanoid generation for all entity IDs
  - Context inheritance: tasks auto-populate `inheritedContext` from parent story
  - Optimistic locking for concurrent state transitions

- [ ] **T3.4 — Implement dependency graph API**
  - `POST /edges`, `DELETE /edges/:id`, `GET /stories/:id/graph`
  - Cycle detection on edge creation
  - **Ready work query**: `GET /projects/:id/ready-work` — items in triggerable state with all deps resolved

- [ ] **T3.5 — Implement comment API**
  - `GET /stories/:id/comments`, `GET /tasks/:id/comments`, `POST /comments`
  - Support for agent, user, and system comment types
  - WebSocket broadcast on new comment

- [ ] **T3.6 — Implement workflow API**
  - Workflow CRUD with JSON storage
  - Validation endpoint: checks for orphan states, reachable end states
  - Default workflow seeding on first run

- [ ] **T3.7 — Implement persona API**
  - Persona CRUD
  - Built-in starter persona seeding
  - Persona duplication

- [ ] **T3.8 — Implement execution and proposal APIs**
  - Execution log CRUD (mostly read — writes come from agent executor)
  - Proposal CRUD with approve/reject actions
  - Proposal approval creates tasks and/or transitions state

- [ ] **T3.9 — Implement real WebSocket server**
  - Replace mock WebSocket with Fastify WebSocket plugin
  - Event types match what the mock layer defined
  - TanStack Query cache invalidation on WebSocket events

- [ ] **T3.10 — Connect frontend to real API**
  - Replace mock data layer with TanStack Query hooks hitting real endpoints
  - Verify all screens work identically with real data
  - Keep mock/demo mode as a toggle for showcasing

---

### Phase 4: Workflow Engine & Trigger System

- [ ] **T4.1 — Implement workflow engine**
  - Custom state machine: states array, transitions map, validate + advance (~80-120 lines)
  - Transition execution: validate allowed → fire associated triggers
  - Store as JSON in SQLite, deserialize on use
  - Default workflows shipped with the app (one for stories, one for tasks)
  - Design for xstate swap-in: `advance()` function is the only integration point

- [ ] **T4.2 — Implement trigger system**
  - Trigger registry: bind persona + dispatch mode to workflow transition
  - **Two-phase trigger dispatcher:**
    1. State transition fires → match trigger
    2. Check dependency graph → all upstream resolved?
    3. If ready → dispatch per mode:
       - `auto`: spawn immediately
       - `propose`: stage for review
       - `gated`: wait for user start
       - `evaluate`: spawn router agent → router picks target state from `possibleTargets` → system transitions to chosen state → downstream triggers fire
    4. If deps unresolved → register as "waiting" → auto-fire when deps clear
  - Concurrency-aware: respect max agent limit before dispatching
  - Dispatch queue: FIFO with priority when at capacity

- [ ] **T4.2b — Implement evaluate/router dispatch**
  - Router agent spawns with read-only tools + `route_to_state` MCP tool
  - `route_to_state`: `{itemId, targetState, reasoning}` — targetState must be in trigger's `possibleTargets[]`
  - Routing reasoning auto-posted as comment on the task/story (audit trail)
  - After routing: system transitions to chosen state, which may fire its own downstream triggers
  - Fast execution: router personas use haiku model, read-only tools, budget-capped low

- [ ] **T4.3 — Implement parent-child state coordination**
  - When all tasks in a story reach a target state, auto-advance the parent story
  - Configurable rules: "all tasks must be Done" vs "all tasks must be in Review or later"
  - Handle partial failure: if one task fails, story enters a "partially failed" state, user decides

- [ ] **T4.4 — Implement rejection and retry logic**
  - Workflow defines rejection transitions (e.g., `in_review` → reject → `in_progress`)
  - Max retry count per trigger (default 3)
  - Each rejection carries structured payload: `{ decision, reason, severity, retry_hint }`
  - Rejection context appended to task's `executionContext` for next agent
  - On max retries exhausted: escalate to user (task enters `needs_attention` state)

- [ ] **T4.5 — Implement user intervention controls**
  - Manual state override: user can drag to any state
  - Override prompt: "Skip triggers / Run triggers anyway / Cancel"
  - **Agent cancellation**: graceful shutdown (30s cleanup window) then force-terminate
  - Partial output preserved on cancellation, not discarded

---

### Phase 5: Agent Persona & Execution System

- [ ] **T5.1 — Implement AgentOps MCP server (custom tools)**
  - Register custom MCP server `agentops` with tools:
    - `create_tasks` — create subtasks under a story `{storyId, tasks: [{title, description, dependsOn[]}]}`
    - `transition_state` — advance/reject with reason `{itemId, targetState, reason}`
    - `route_to_state` — evaluator-only: pick target from allowed options `{itemId, targetState, reasoning}` (targetState validated against trigger's `possibleTargets[]`)
    - `request_review` — request user attention `{itemId, message}`
    - `flag_blocked` — mark as blocked `{itemId, reason}`
    - `post_comment` — post to comment stream `{targetId, content, metadata?}`
    - `list_tasks` — query tasks with verbosity control `{storyId, status?, verbosity: "summary"|"detail"}`
    - `get_context` — retrieve project memory + task execution history `{taskId, includeMemory: boolean}`
  - **Per-persona tool allowlists**:
    - Tech Lead: `create_tasks` + `transition_state` + `post_comment`
    - Engineer: `transition_state` + `flag_blocked` + `post_comment`
    - Reviewer: `transition_state` + `request_review` + `post_comment`
    - **Router**: `route_to_state` + `list_tasks` + `get_context` + `post_comment` (read-only + routing)
  - All personas get `post_comment` by default
  - All responses are compact, structured JSON — context-window-aware

- [ ] **T5.2 — Implement agent executor interface (pluggable)**
  - `AgentExecutor` interface: `spawn(task, persona, project) → AsyncIterable<AgentEvent>`
  - `AgentEvent` types: `thinking`, `tool_use`, `tool_result`, `text`, `error`, `result`
  - Executor manages lifecycle: start → stream → complete/fail
  - Capture cost, duration, full message log

- [ ] **T5.3 — Implement Claude Agent SDK executor**
  - Wraps `query()` from `@anthropic-ai/claude-agent-sdk`
  - Maps persona config to SDK options (allowedTools, permissionMode, model)
  - **Layered system prompt assembly:**
    1. Persona `systemPrompt` (role identity)
    2. `appendSystemPrompt`: project context from `agentops.md` + cached project summary
    3. Task-specific context: inherited story context + execution history from previous runs
    4. Recent project memory (last N entries, token-budget-aware)
  - Sets `cwd` to project directory
  - Registers AgentOps MCP server with persona-scoped tool allowlist
  - Streams output to WebSocket for live UI updates
  - Persists execution log and comments to SQLite
  - **On completion**: generate execution summary → append to task's `executionContext` → executor auto-transitions state
  - **On failure**: transition to failure state, preserve partial output

- [ ] **T5.4 — Implement concurrency and cost management**
  - Global max concurrent agents (default 3, configurable in UI)
  - Per-persona concurrency limits (optional)
  - Monthly cost cap — halt new dispatches when exceeded, show warning in UI
  - Queue: when at capacity, triggers wait in a dispatch queue (FIFO with priority)

- [ ] **T5.5 — Implement project memory system**
  - On story completion: generate compressed summary (what was done, key decisions, files changed)
  - Store in `project_memory` table linked to project and source story
  - **Memory decay**: periodic job consolidates old memories into higher-level summaries
  - `get_context` MCP tool serves recent memory to agents at query time
  - Token budget awareness: cap memory injection at ~1000 tokens, prioritize recency

---

### Phase 6: System Service & Operations

- [ ] **T6.1 — Implement process management**
  - Graceful startup/shutdown
  - Signal handling (SIGTERM, SIGINT)
  - Crash recovery: re-queue interrupted tasks, reset stale "in progress" states
  - Process health monitoring

- [ ] **T6.2 — Create service installation**
  - pm2 ecosystem config file
  - `pm2 startup` integration for OS-level boot
  - Install/uninstall/update scripts
  - CLI commands: `agentops start`, `agentops stop`, `agentops status`

- [ ] **T6.3 — Implement logging and observability**
  - Structured logging (pino)
  - Log rotation for long-running service
  - Agent execution audit trail (who did what, when, at what cost)
  - Export logs for debugging

- [ ] **T6.4 — Configuration management**
  - Config file (`~/.agentops/config.toml` or similar)
  - API key management (Anthropic key stored securely)
  - Global settings: default model, concurrency limits, cost caps
  - Settings page already built in Phase 2 — just connect to real config

---

### Phase 7: Polish & Advanced Features

- [ ] **T7.1 — Git integration**
  - Auto-create branches per story or task
  - Agents commit their changes with descriptive messages
  - PR creation after story/task completion
  - Diff review in UI before merging

- [ ] **T7.2 — Notification system**
  - Desktop notifications on story/task state changes
  - Notifications when proposals need user review (proposal badge)
  - Notifications when agents need user approval (gated triggers)
  - Optional webhook/Slack integration
  - Daily digest of agent activity and costs

- [ ] **T7.3 — Security hardening**
  - Server binds to 127.0.0.1 only (localhost)
  - Sandboxed agent execution (restrict filesystem paths, network access)
  - API key encryption at rest
  - Audit log for all agent actions
  - Per-persona and global cost caps enforced

- [ ] **T7.4 — Advanced workflow features**
  - Conditional transitions (transition only if condition met, e.g., "all tests pass")
  - Parallel states (story can be in multiple states simultaneously for different concerns)
  - Workflow versioning (update workflow without breaking in-flight stories)
  - Workflow analytics: average time per state, bottleneck identification

- [ ] **T7.5 — Additional executor providers**
  - Antigravity executor (when/if programmatic API becomes available)
  - OpenAI executor (would require custom tool execution layer)
  - Provider-agnostic persona configs with provider-specific overrides

---

## Key Technical Decisions (Resolved)

| # | Decision | Options | Choice | Status |
|---|----------|---------|--------|--------|
| D1 | Primary agent SDK | Claude Agent SDK vs Claude Code JS | **Claude Agent SDK (TypeScript)** — official, streaming, subagents, hooks, cost tracking | Decided |
| D2 | Antigravity support | Include now vs defer | **Deferred** — IDE platform, no headless API; design executor layer as pluggable | Decided |
| D3 | Data storage | SQLite vs PGlite vs Turso | **better-sqlite3 + Drizzle ORM** — sync API, zero-config, type-safe schemas shared with frontend | Decided |
| D4 | Backend framework | Fastify vs Express vs Hono | **Fastify** — plugin system fits our architecture, built-in validation, mature WebSocket support | Decided |
| D5 | Service manager | launchd/systemd vs pm2 | **pm2** — cross-platform, generates native launchd/systemd configs via `pm2 startup` | Decided |
| D6 | Frontend routing | React Router vs TanStack Router | **React Router** — sufficient for ~6 routes, battle-tested, lower complexity | Decided |
| D7 | State management | TanStack Query + Zustand | **TanStack Query + Zustand** — Query for server state, Zustand for client UI state, WebSocket invalidates Query cache | Decided |
| D8 | Monorepo tool | pnpm workspaces vs turborepo | **pnpm workspaces** — zero overhead for 3 packages, Turborepo layerable later if needed | Decided |
| D9 | Workflow engine | xstate vs custom | **Custom engine** — ~80-120 lines, JSON schema in SQLite, xstate upgrade path via swappable `advance()` | Decided |
| D10 | Agent-system communication | Custom tools vs text parsing vs structured output | **Custom MCP tools** — `agentops` MCP server with per-persona scoped tools, executor handles auto-transitions | Decided |
| D11 | ID strategy | Auto-increment vs UUID vs nanoid | **Short nanoid hashes** — e.g., `st-x7k2m`, collision-resistant, URL-safe, merge-safe (inspired by Beads) | Decided |
| D12 | Task dependencies | Simple blocked_by field vs DAG | **DAG** — `task_edges` table with typed relationships, enables ready-work detection (inspired by Beads) | Decided |
| D13 | Agent context strategy | Tool discovery vs system prompt injection | **Layered injection** — persona prompt + `agentops.md` + project summary + task context + execution history | Decided |
| D14 | Approval gates | Auto-fire vs require approval | **Three-mode enum per trigger** — `auto` / `propose` (default for decomposition) / `gated` | Decided |
| D15 | State advancement | Agent-driven vs system-driven | **System auto-advances** by default, configurable per trigger (`auto` / `approval` / `agent`) | Decided |
| D16 | Failure handling | Ad-hoc vs workflow-defined | **Workflow-defined** rejection transitions with bounded retries (max 3), structured rejection payloads, escalation on exhaustion | Decided |
| D17 | User intervention | Restricted vs unrestricted | **Unrestricted** manual overrides with prompt (skip/run triggers), graceful agent cancellation (30s cleanup) | Decided |
| D18 | Agent memory | None vs execution context | **Execution context per task** — bounded history (last 3 runs), older summarized. Plus project-level memory with decay (inspired by Beads) | Decided |
| D19 | Development approach | Backend-first vs UI-first | **UI-first with mocked data** — build and validate all screens against mock data/WebSocket before backend implementation | Decided |
| D20 | UI component library | Custom vs shadcn/ui | **shadcn/ui** — polished, accessible, Tailwind-native, copy-paste ownership (no dependency lock-in) | Decided |
| D21 | Adaptive routing | Static transitions vs agent-evaluated | **Evaluate mode** — 4th trigger dispatch mode where a router agent picks the next state from multiple options. Diamond decision nodes in workflow designer. | Decided |

---

## Resolved Questions

1. ~~Should agents operate on the same repo as the app, or target external project directories?~~
   → **External project directories.** Each project registers a path. Agents spawn with `cwd` set there. App repo is never a target.

2. ~~What's the maximum number of concurrent agents we want to support?~~
   → **Default 3, configurable up to 10 in UI.** Scheduler respects limit; excess triggers queue.

3. ~~Should we support multiple AI providers (OpenAI, Gemini) or stay Claude-only initially?~~
   → **Claude-only, pluggable executor interface.** `AgentExecutor` abstraction allows future providers.

4. ~~Do we need multi-user support or is this strictly single-user?~~
   → **Single-user, no auth.** Server binds to 127.0.0.1. No user table, no sessions.

5. ~~How should we handle long-running tasks that exceed agent context windows?~~
   → **Workflow-driven decomposition.** Tech Lead persona breaks stories into right-sized tasks. Opus context handles most individual tasks.

6. ~~Who advances the state?~~
   → **System auto-advances by default.** Configurable per trigger: `auto` (system advances on success), `approval` (held for user), `agent` (agent gets `advance_state` tool). Follows Temporal/GH Actions pattern — orchestrator owns state.

7. ~~What happens on failure?~~
   → **Workflow-defined rejection with bounded retries.** Personas declare outcomes, workflow maps them to transitions. Max 3 retries with structured rejection payloads passed to next agent. Escalate to user on exhaustion.

8. ~~Can the user intervene mid-flow?~~
   → **Yes, always.** Users can drag to any state. Manual overrides prompt: skip triggers / run triggers / cancel. Running agents can be cancelled gracefully (30s cleanup). Partial output preserved.

9. ~~Workflow engine: build vs buy?~~
   → **Build custom.** ~80-120 lines. JSON schema in SQLite. Swappable `advance()` function as xstate upgrade path. We don't need parallel states or history states yet.

10. ~~How should personas reference project context?~~
    → **Layered system prompt injection.** Persona identity → `agentops.md` project context → cached project summary → task-specific context → execution history. ~2500 tokens for persona + project, actual code via tools.

11. ~~Should task decomposition require user approval?~~
    → **Propose-by-default.** Three-mode trigger dispatch: `auto` / `propose` / `gated`. Decomposition uses `propose` — tasks staged for review, user approves/edits/rejects inline on story card. Progressive trust model.

12. ~~How do agents communicate structured actions?~~
    → **Custom MCP tools.** `agentops` MCP server with per-persona scoped tools (`create_tasks`, `transition_state`, `request_review`, `flag_blocked`, `post_comment`). Tool calls are structurally typed — no text parsing. Executor handles auto-transitions on completion/failure separately.
