# AgentOps - Agentic Coding Application

## Vision

A local-first application that orchestrates AI coding agents through a unified work item model with a hardcoded workflow. Runs as a system service on the user's machine with a web-based UI for managing work items, monitoring agent activity, and reviewing results. A Router agent automatically transitions work items between states after each persona completes, creating a fully autonomous development pipeline that can be toggled on or off.

**The UI is the product.** A clear, intuitive, modern interface is what makes autonomous agents trustworthy. Every feature exists to give the user visibility into what agents are doing, what they did, what's upcoming, and what needs their input.

---

## Core Concepts

### Work Items (Unified Recursive Model)
- **WorkItem** — the single entity for all work: what was previously "story", "task", and "sub-task"
- **Recursive hierarchy** via `parentId`: top-level items (stories) have no parent, children (tasks) reference their parent, sub-tasks reference a task, etc.
- **All work items move through the same workflow** — both leaf items and parent items have a real `currentState`
- **Leaf items** (no children): move through the workflow via agents or manual drag
- **Parent items** (have children): also move through the workflow, but some transitions auto-trigger when children complete (e.g., all children Done → parent advances to In Review)
- **Decomposition is recursive**: any work item can be decomposed into children at any level
- **UI depth limit**: 3 levels (story → task → sub-task) for visual clarity

### Hardcoded Workflow (State Machine)
- One workflow per project — **hardcoded, not user-configurable** (simplifies everything, can be made editable in a future version)
- The workflow defines states and valid transitions (a DAG). The Router uses transitions to narrow its decision space.
- **Fixed anchors**: initial state (Backlog) and final state (Done) cannot be deleted, only renamed
- States: `Backlog → Planning → Decomposition → Ready → In Progress → In Review → Done` plus `Blocked`
- Transitions define which states can flow to which:
  ```
  Backlog        → [Planning]
  Planning       → [Ready, Blocked]
  Decomposition  → [In Progress, Blocked]
  Ready          → [In Progress, Decomposition, Blocked]
  In Progress    → [In Review, Blocked]
  In Review      → [Done, In Progress]  (approve or reject)
  Blocked        → [previous state]
  ```

### Router (Automatic State Transitions)
- After any persona completes work on a work item, the **Router agent** decides the next state
- The Router is a lightweight agent (haiku model, read-only tools + `route_to_state` MCP tool)
- Router receives: current state, valid transitions from the state machine, work item context, persona output
- Router picks from the valid transitions — the state machine narrows the decision space to 1-3 options
- Router posts its reasoning as a comment (audit trail)
- **Auto-routing is a project-level toggle:**
  - **ON**: Router fires automatically after each persona completes → fully autonomous pipeline
  - **OFF**: user manually moves items between states → agents only fire when items land in their state

### Persona-Per-State Configuration
- Each workflow state has an assigned persona that fires when a work item enters that state
- This is the **only user configuration** for the workflow — a simple table in project settings:
  ```
  State           │ Persona            │ Model
  ────────────────┼────────────────────┼────────
  Planning        │ Product Manager    │ Sonnet
  Decomposition   │ Tech Lead          │ Sonnet
  Ready           │ Router             │ Haiku
  In Progress     │ Engineer           │ Sonnet
  In Review       │ Code Reviewer      │ Sonnet
  ```
- Backlog, Done, and Blocked have no personas — they're manual or auto-triggered states

### Agent Personas
- A **persona** is a named agent configuration: system prompt, model, allowed tools, behavior constraints
- Built-in personas: Product Manager, Tech Lead, Engineer, Code Reviewer, QA Engineer, Router
- Each persona has a scoped set of custom MCP tools (e.g., Tech Lead gets `create_children`, Engineer gets `flag_blocked`)
- The **Router** is a special lightweight persona: haiku model, read-only tools + `route_to_state`, runs after every other persona completes

### Parent-Child State Coordination
- When all children of a parent reach Done → parent auto-advances to the next state (configurable target, default: In Review)
- Parent entering In Review triggers a reviewer to check the **integrated whole** (not just individual children)
- If any child enters Blocked → parent shows a "blocked children" indicator (doesn't auto-change state)
- User can always manually drag a parent to any state, overriding auto-advancement

### Dependency Graph (DAG)
- Work items form a **directed acyclic graph** via explicit dependency edges
- Dependencies are first-class: `work_item_edges` table with typed relationships (`blocks`, `depends_on`, `related_to`)
- **Ready work detection**: an item is "ready" when it's in a triggerable state AND all upstream dependencies are resolved
- Cycle detection on edge creation

### Comment Stream
- Every work item has a chronological **comment stream**
- Agents post comments noting work done, questions, messages for other agents, blockers
- Users post comments for guidance, feedback, or context
- Router posts routing reasoning as comments (audit trail)
- Each comment has a timestamp, author (persona name or user), and content
- Comments persist across agent sessions — a running conversation trail

### Projects
- A **project** is a registered working directory on the local filesystem
- Work items are scoped to a project
- Agents are spawned with `cwd` set to the project directory
- Each project has an `agentops.md` context file (like CLAUDE.md) that all personas inherit
- **Auto-routing toggle** is per-project

### Project Memory
- As top-level work items complete, a compressed summary is generated (what was done, key decisions, files changed)
- Stored in `project_memory` table — recent memories injected into agent context at spawn time
- **Memory decay**: older memories are periodically consolidated into higher-level summaries to save context window
- Distinct from `agentops.md` (static project description) — project memory captures "what's been done recently"

### Execution Context (Per-Item Agent Memory)
- Each execution appends a structured summary to the work item: what the agent did, tools used, outcome, rejection reason
- When an item is retried (e.g., after code review rejection), the next agent gets the previous execution history
- Bounded: last 3 full executions retained, older ones summarized (same decay pattern as project memory)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                   React/Vite/Tailwind                    │
│                 (Frontend Dashboard UI)                  │
│                                                          │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────────┐ │
│  │Dashboard │ │Work Items │ │ Persona  │ │  Agent     │ │
│  │ (Home)   │ │ (Multi-   │ │ Manager  │ │  Monitor   │ │
│  ├──────────┤ │  View)    │ ├──────────┤ ├────────────┤ │
│  │Activity  │ │ List/Board│ │          │ │  Settings  │ │
│  │  Feed    │ │ /Tree     │ │          │ │            │ │
│  └──────────┘ └───────────┘ └──────────┘ └────────────┘ │
└───────────────────────┬──────────────────────────────────┘
                        │ REST / WebSocket
┌───────────────────────┴──────────────────────────────────┐
│                 Backend Service (Fastify)                 │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ WorkItem     │  │ Hardcoded    │  │ Router         │  │
│  │ Manager      │  │ Workflow     │  │ Agent          │  │
│  │ (DAG-aware)  │  │ (state      │  │ (auto-routing) │  │
│  │              │  │  machine)    │  │                │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                   │           │
│  ┌──────┴─────────────────┴───────────────────┴────────┐  │
│  │              Persona Registry                        │  │
│  │  (PM, Tech Lead, Engineer, Reviewer, Router, ...)   │  │
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
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Concurrency Manager (max agents, cost caps)│  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Data flow for a work item lifecycle (auto-routing ON):**

```
User creates work item ("Add OAuth2 login") → enters [Backlog]
  │
  User drags to [Planning]
  │ PM persona fires → writes acceptance criteria → completes
  │ Router evaluates: transitions = [Ready, Blocked] → picks "Ready"
  │
  [Ready]
  │ Router fires immediately (this IS the evaluation state)
  │ Router evaluates: transitions = [In Progress, Decomposition, Blocked]
  │ Router decides: "Too large, needs breakdown" → picks "Decomposition"
  │
  [Decomposition]
  │ Tech Lead fires → creates 3 child work items → completes
  │ Children enter [Backlog]
  │ Router evaluates: transitions = [In Progress, Blocked] → picks "In Progress"
  │
  [In Progress] — parent waits here while children work
  │
  │  Each child goes through the same workflow:
  │  [Backlog] → [Planning] → [Ready] → [In Progress] → [In Review] → [Done]
  │  (same states, same personas, same Router decisions)
  │
  │  If Router decides a child is too large at [Ready]:
  │    → [Decomposition] → Tech Lead creates sub-tasks → same pattern recursively
  │
  │  All children reach [Done] → parent auto-advances to [In Review]
  │
  [In Review]
  │ Code Reviewer fires → reviews integrated whole → completes
  │ Router evaluates: transitions = [Done, In Progress]
  │ Router decides: "Approved" → picks "Done"
  │  (or "Rejected" → picks "In Progress" with rejection feedback)
  │
  [Done] ✓
  │ Project memory updated with work item summary
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
  - **ID convention**: short nanoid-style hash IDs (e.g., `wi-x7k2m` for work items, `ps-r8d2j` for personas). Collision-resistant, URL-safe, readable.
  - **Project**: id, name, path, autoRoutingEnabled (boolean, default true), settings, createdAt
  - **WorkItem**: id, parentId (nullable — null = top-level, non-null = child), projectId, title, description, context (acceptance criteria, notes), currentState (workflow state name), priority, labels[], assignedPersonaId, executionContext[] (bounded history from previous runs), createdAt, updatedAt
  - **WorkItemEdge**: id, fromId, toId, type (`blocks` | `depends_on` | `related_to`) — DAG dependency graph
  - **Persona**: id, name, description, avatar (color + icon), systemPrompt, model (`opus` | `sonnet` | `haiku`), allowedTools[], mcpTools[] (custom tools this persona can call), maxBudgetPerRun, settings
  - **PersonaAssignment**: projectId, stateName, personaId — maps workflow states to personas (the only workflow config)
  - **Execution**: id, workItemId, personaId, status, startedAt, completedAt, costUsd, durationMs, summary (compressed), outcome (`success` | `failure` | `rejected`), rejectionPayload (reason, severity, hint), logs
  - **Comment**: id, workItemId, authorType (`agent` | `user` | `system`), authorId (personaId or null), authorName, content, metadata (JSON — files referenced, tools used, routing reasoning, etc.), createdAt
  - **ProjectMemory**: id, projectId, workItemId (source), summary, filesChanged[], keyDecisions[], createdAt, consolidatedInto (for decay)
  - **Proposal**: id, executionId, parentWorkItemId, type (`child_creation` | `review_request`), payload (JSON), status (`pending` | `approved` | `rejected` | `expired`), createdAt
  - **Workflow**: hardcoded constant in code (not a database entity) — states[], transitions{} as described in Core Concepts

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

#### 2B: Work Items — Multi-View

- [ ] **T2.2 — Build work items page with view toggle**
  - Page layout: top bar with `[List] [Board] [Tree]` view toggle, filter/group/sort controls, detail panel on right
  - View toggle persists in URL params and Zustand
  - Filter bar: filter by state, priority, persona, labels, parent, has-proposals
  - Group by: state, parent, priority, persona
  - Sort: priority, created date, updated date, state
  - Quick-add: "+" button to create new top-level work item

- [ ] **T2.3 — Build list view (primary)**
  - Tree-indented rows showing work item hierarchy (parent → child → sub-task)
  - Each row: expand/collapse toggle, title, state badge, priority badge, progress bar (if has children), assigned persona avatar, active agent indicator
  - Collapsible groups when grouped by state/priority/etc.
  - Collapse "Done" group by default to reduce noise
  - Click a row to select → opens detail in right panel

- [ ] **T2.4 — Build board view (optional)**
  - Columns = hardcoded workflow states
  - Flat cards — filter to one scope: "top-level items" or "children of [selected item]"
  - Cards show: title, priority, progress pill (if has children), persona avatar
  - Drag-and-drop to move items between states (manual transition)
  - When dragging to a state with an assigned persona: show prompt "This will trigger [Persona]. Run / Skip / Cancel"
  - Scope selector: breadcrumb at top showing which level you're viewing

- [ ] **T2.5 — Build tree view (hierarchy)**
  - Pure parent-child tree display, no state grouping
  - Each node: title, state badge, priority, progress bar
  - Expand/collapse at any level
  - Useful for understanding decomposition scope
  - Click to select → detail panel

- [ ] **T2.6 — Build work item detail panel**
  - Right-side panel (~50-60% width) showing selected work item
  - **Header**: title (editable inline), state badge, priority selector, labels (editable), parent link (breadcrumb if nested)
  - **Description section**: rich text, acceptance criteria, editable
  - **Children section** (if has children):
    - List of child items with state badges, persona avatars, dependency indicators
    - Progress bar summary
    - "Add child" button, "Decompose" button (triggers Tech Lead)
  - **Proposals section** (if pending): proposed children from Tech Lead, approve/edit/reject inline
  - **Comment stream**: chronological thread (agent + user + system comments), input box at bottom
  - **Execution history timeline**: persona avatar, duration, cost, outcome badge, expandable for full output
  - **Flow history**: the actual path this item took through states (branches, back-flows, retries)
  - **Dependency info**: "depends on" and "blocks" lists with state badges
  - **Execution context viewer**: what context the agent received (previous runs, rejections)
  - **Metadata**: created date, updated date, project, current persona, retry count

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

#### 2D: Activity Feed

- [ ] **T2.7 — Build activity feed**
  - Full-page chronological stream of all system events
  - Event types (each with distinct icon + color):
    - State transitions (work item moved to X)
    - Agent started / completed / failed
    - Comments posted (by agent or user)
    - Router decisions (with reasoning)
    - Proposals created / approved / rejected
    - User manual overrides
    - Cost alerts (approaching cap)
  - Each entry: timestamp, icon, persona avatar (if agent), description, link to source entity
  - Filters: by event type, persona, work item, date range
  - Real-time: new events animate in at the top (via WebSocket)
  - Unread indicator: mark events since last visit

#### 2E: Persona Manager

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
      - MCP tools checklist (create_children, transition_state, route_to_state, request_review, flag_blocked, post_comment, list_items, get_context)
    - Max budget per run (USD input)
    - **Test run panel**: enter a sample prompt, run against mock, see simulated output
  - **Built-in personas** (shipped with app): clearly marked, editable but restorable to defaults

#### 2F: Settings

- [ ] **T2.10 — Build settings page**
  - **Projects**: registered projects list, add/remove, edit path
  - **Workflow configuration** (per project):
    - Auto-routing toggle (ON/OFF)
    - Persona-per-state table: state → persona → model (the only workflow config)
    - Visual diagram of the hardcoded state machine (read-only, shows states and transitions)
  - **API Keys**: Anthropic API key input (masked), connection test button
  - **Concurrency**: max concurrent agents slider (1-10), per-persona limits
  - **Cost management**: monthly cost cap input, warning threshold, daily spend limit
  - **Appearance**: dark/light mode toggle, compact/comfortable density
  - **Service status**: pm2 status, uptime, restart button
  - **Data**: export/import settings, clear execution history, database size

#### 2G: Global UI Components

- [ ] **T2.11 — Build global layout and navigation**
  - **Sidebar navigation**: collapsible, icons + labels
    - Dashboard, Work Items, Agent Monitor, Activity Feed, Personas, Settings
    - Project switcher at top of sidebar (dropdown)
    - Active agents count badge on Agent Monitor nav item
    - Pending proposals count badge on Work Items nav item
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

### Phase 4: Workflow & Router System

- [ ] **T4.1 — Implement hardcoded workflow**
  - Export workflow constant: states array, transitions map (state → valid next states[])
  - `getValidTransitions(currentState)` function returns allowed next states
  - `isValidTransition(from, to)` validation function
  - No database storage — pure code constant
  - States: Backlog, Planning, Decomposition, Ready, In Progress, In Review, Done, Blocked

- [ ] **T4.2 — Implement Router agent**
  - After any persona completes work → if auto-routing enabled → spawn Router
  - Router receives: current state, valid transitions, work item context, persona output summary
  - Router uses `route_to_state` MCP tool: `{workItemId, targetState, reasoning}`
  - `targetState` validated against `getValidTransitions(currentState)`
  - Routing reasoning auto-posted as comment (audit trail)
  - Router uses haiku model, read-only tools + `route_to_state`, budget-capped low
  - If auto-routing disabled: skip Router, item stays in current state

- [ ] **T4.3 — Implement persona dispatch on state entry**
  - When a work item enters a state → look up PersonaAssignment for that state
  - If persona assigned → check concurrency limits → spawn agent executor
  - If no persona assigned → no-op (manual states like Backlog, Done)
  - Dispatch queue: FIFO with priority when at concurrency cap

- [ ] **T4.4 — Implement parent-child state coordination**
  - When all children of a parent reach Done → auto-advance parent to next state (configurable target, default: In Review)
  - Reviewer checks integrated whole at parent level
  - If any child enters Blocked → parent shows indicator (no auto-change)
  - User can always manually override parent state

- [ ] **T4.5 — Implement rejection and retry logic**
  - Router decides "In Progress" (rejection) from In Review → item goes back with feedback
  - Max retry count (default 3) tracked per work item
  - Each rejection carries structured payload: `{ decision, reason, severity, retry_hint }`
  - Rejection context appended to work item's `executionContext` for next agent
  - On max retries exhausted: item enters Blocked, user notified

- [ ] **T4.6 — Implement user intervention controls**
  - Manual state override: user can drag/move item to any state
  - If target state has a persona: prompt "This will trigger [Persona]. Run / Skip / Cancel"
  - **Agent cancellation**: graceful shutdown (30s cleanup window) then force-terminate
  - Partial output preserved on cancellation, not discarded

---

### Phase 5: Agent Persona & Execution System

- [ ] **T5.1 — Implement AgentOps MCP server (custom tools)**
  - Register custom MCP server `agentops` with tools:
    - `create_children` — create child work items `{parentId, children: [{title, description, dependsOn[]}]}`
    - `route_to_state` — Router-only: pick next state `{workItemId, targetState, reasoning}` (validated against workflow transitions)
    - `request_review` — request user attention `{workItemId, message}`
    - `flag_blocked` — mark as blocked `{workItemId, reason}`
    - `post_comment` — post to comment stream `{workItemId, content, metadata?}`
    - `list_items` — query work items with verbosity control `{parentId?, state?, verbosity: "summary"|"detail"}`
    - `get_context` — retrieve project memory + execution history `{workItemId, includeMemory: boolean}`
  - **Per-persona tool allowlists**:
    - Tech Lead: `create_children` + `post_comment`
    - Engineer: `flag_blocked` + `post_comment`
    - Reviewer: `request_review` + `post_comment`
    - **Router**: `route_to_state` + `list_items` + `get_context` + `post_comment` (read-only + routing)
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
| D9 | Workflow engine | xstate vs custom vs hardcoded | **Hardcoded workflow** — states and transitions as code constants, not user-configurable. Simplifies everything, editable workflow deferred to future version. | Decided (revised) |
| D10 | Agent-system communication | Custom tools vs text parsing vs structured output | **Custom MCP tools** — `agentops` MCP server with per-persona scoped tools, Router handles transitions | Decided |
| D11 | ID strategy | Auto-increment vs UUID vs nanoid | **Short nanoid hashes** — e.g., `st-x7k2m`, collision-resistant, URL-safe, merge-safe (inspired by Beads) | Decided |
| D12 | Task dependencies | Simple blocked_by field vs DAG | **DAG** — `task_edges` table with typed relationships, enables ready-work detection (inspired by Beads) | Decided |
| D13 | Agent context strategy | Tool discovery vs system prompt injection | **Layered injection** — persona prompt + `agentops.md` + project summary + task context + execution history | Decided |
| D14 | Approval gates | Auto-fire vs require approval | **Superseded by D22 (Router)** — Router handles all transition decisions | Decided (revised) |
| D15 | State advancement | Agent-driven vs system-driven | **Superseded by D22 (Router)** — Router decides all transitions when auto-routing is ON | Decided (revised) |
| D16 | Failure handling | Ad-hoc vs workflow-defined | **Router-driven** — Router decides "In Progress" (reject) or "Done" (approve) from In Review. Bounded retries (max 3), structured rejection payloads. | Decided (revised) |
| D17 | User intervention | Restricted vs unrestricted | **Unrestricted** manual overrides with prompt (skip/run triggers), graceful agent cancellation (30s cleanup) | Decided |
| D18 | Agent memory | None vs execution context | **Execution context per task** — bounded history (last 3 runs), older summarized. Plus project-level memory with decay (inspired by Beads) | Decided |
| D19 | Development approach | Backend-first vs UI-first | **UI-first with mocked data** — build and validate all screens against mock data/WebSocket before backend implementation | Decided |
| D20 | UI component library | Custom vs shadcn/ui | **shadcn/ui** — polished, accessible, Tailwind-native, copy-paste ownership (no dependency lock-in) | Decided |
| D21 | Adaptive routing | Static transitions vs agent-evaluated | **Superseded by D22** — Router is now the only transition mechanism, not a special mode | Decided (revised) |
| D22 | Data model | Separate Story + Task vs unified WorkItem | **Unified WorkItem** — single recursive entity with parentId. Stories are top-level, tasks are children, sub-tasks are grandchildren. | Decided |
| D23 | Workflow configurability | User-configurable vs hardcoded | **Hardcoded** — states and transitions as code constants. One persona-per-state table is the only config. Editable workflows deferred. | Decided |
| D24 | State transitions | Dispatch modes vs Router agent | **Router agent** — single mechanism for all transitions. Haiku model, picks from valid transitions. Togglable via auto-routing ON/OFF per project. | Decided |
| D25 | Work item visualization | Kanban-only vs multi-view | **Multi-view** — List (primary), Board (optional), Tree (hierarchy). Detail panel shared across views. Replaces separate kanban + workflow designer. | Decided |
| D26 | Workflow editing | Standalone designer vs inline | **Inline settings** — persona-per-state table in project settings. Read-only state machine diagram. No standalone workflow designer page. | Decided |

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
   → **Router agent.** After any persona completes, the Router picks the next state from valid transitions. Togglable: auto-routing ON = Router decides, OFF = user manually moves items.

7. ~~What happens on failure?~~
   → **Workflow-defined rejection with bounded retries.** Personas declare outcomes, workflow maps them to transitions. Max 3 retries with structured rejection payloads passed to next agent. Escalate to user on exhaustion.

8. ~~Can the user intervene mid-flow?~~
   → **Yes, always.** Users can drag to any state. Manual overrides prompt: skip triggers / run triggers / cancel. Running agents can be cancelled gracefully (30s cleanup). Partial output preserved.

9. ~~Workflow engine: build vs buy?~~
   → **Hardcoded.** States and transitions as a code constant. No database storage, no user configuration. Persona-per-state table is the only config. Editable workflows deferred to future version.

10. ~~How should personas reference project context?~~
    → **Layered system prompt injection.** Persona identity → `agentops.md` project context → cached project summary → task-specific context → execution history. ~2500 tokens for persona + project, actual code via tools.

11. ~~Should task decomposition require user approval?~~
    → **Decomposition is a workflow state.** Any work item entering "Decomposition" triggers a Tech Lead who creates children. Children appear as proposals in the detail panel — user can approve/edit/reject before they enter Backlog.

12. ~~How do agents communicate structured actions?~~
    → **Custom MCP tools.** `agentops` MCP server with per-persona scoped tools (`create_children`, `route_to_state`, `request_review`, `flag_blocked`, `post_comment`). Tool calls are structurally typed — no text parsing. Router handles all state transitions.
