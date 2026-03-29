# AgentOps

A local-first, workflow-driven application that orchestrates AI coding agents. React/Vite/Tailwind frontend, Fastify backend, SQLite storage, Claude Agent SDK for agent execution.

## Architecture Quick Reference

Full architecture: see `PLANNING.md`

- **Monorepo**: pnpm workspaces — `packages/frontend`, `packages/backend`, `packages/shared`
- **Frontend**: React 19, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query + Zustand
- **Backend**: Fastify, better-sqlite3 + Drizzle ORM, WebSocket (@fastify/websocket)
- **Agent SDK**: @anthropic-ai/claude-agent-sdk (TypeScript)
- **Service**: pm2
- **IDs**: nanoid-based short hashes with type prefix (`st-x7k2m`, `tk-p9f3n`, `ps-r8d2j`)

## Development Approach

**UI-first.** All screens are built against mock data before backend implementation. The mock layer simulates agent behavior, WebSocket events, and state transitions. Phase 2 (UI) is the highest priority.

## Coding Conventions

- TypeScript strict mode across all packages
- Shared types live in `packages/shared` — frontend and backend import from there
- shadcn/ui for all UI components (copy-paste, not dependency — Tailwind-native)
- Dark mode support on every component from day one
- All components should be responsive (1280px+ primary, graceful degradation smaller)
- Use `cn()` utility (from shadcn) for conditional class merging
- File naming: kebab-case for files (`story-board.tsx`), PascalCase for components (`StoryBoard`)
- Collocate component, types, and hooks in feature directories (`features/kanban/`, `features/agent-monitor/`)
- Prefer named exports over default exports
- Tests are NOT required during Phase 1-2 (scaffolding + UI mocks) — we'll add them when connecting real data

## Key UI Screens

1. **Dashboard** — at-a-glance status, active agents, pending proposals, cost
2. **Story Board** — kanban columns by workflow state, drag-and-drop
3. **Story Detail** — description, child tasks, proposals, comment stream, execution timeline
4. **Task Detail** — inherited context, dependencies, execution context, rejection history
5. **Agent Monitor** — live terminal output, multi-agent view, history
6. **Activity Feed** — chronological event stream
7. **Workflow Designer** — visual state machine editor
8. **Persona Manager** — prompt editor, tool config, test run
9. **Settings** — projects, API keys, concurrency, costs, appearance

## Core Entities (see PLANNING.md T1.4 for full schemas)

Project, Story, Task, TaskEdge, Workflow, Persona, Trigger, Execution, Comment, ProjectMemory, Proposal

---

## Autonomous Agent Work Protocol

Scheduled agents follow this protocol when picking up development tasks.

### Worker Agent Protocol

1. **Read `TASKS.md`** — find the first unchecked task with no `[in-progress]` or `[blocked]` tag
2. **Read `WORKLOG.md`** — scan the last 5 entries for recent context (what was just built, patterns established)
3. **If you need architecture detail**, read the relevant section of `PLANNING.md` — do NOT read the whole file
4. **Claim the task**: mark it `[in-progress: YYYY-MM-DD]` in `TASKS.md` and commit this change
5. **Do the work**: implement the task following conventions above
6. **Verify**: ensure the app builds (`pnpm build` or `pnpm dev` — no errors), check that existing functionality isn't broken
7. **Update `TASKS.md`**: mark the task `[x]`, remove `[in-progress]`
8. **Append to `WORKLOG.md`**: add an entry with date, task ID, what was done, files changed/created, any notes for the next agent
9. **Commit all changes** including `TASKS.md` and `WORKLOG.md` updates in the same commit as the implementation
10. **Push** to origin/main
11. **STOP.** Do not pick up another task. One task per run.

### Rules

- **Never skip ahead to a later sprint/phase.** Complete the current sprint first.
- **One task = one commit.** Keep changes atomic and reviewable.
- **If blocked**, mark the task `[blocked: reason]` in `TASKS.md`, append a note to `WORKLOG.md`, and move to the next unblocked task.
- **If a task is too large** to complete in one session, split it into subtasks in `TASKS.md` and complete the first subtask.
- **Preserve mock data layer** — even as you build new components, ensure mock data drives them. No hardcoded placeholder text.
- **Follow established patterns** — check `WORKLOG.md` and existing code to see how previous agents structured things. Be consistent.

### Cleanup Agent Protocol

This agent's ONLY job is maintenance. It does NOT pick up implementation tasks.

**Short-circuit check:** Count `[x]` tasks in `TASKS.md`. If fewer than 10, exit immediately — nothing to clean yet.

1. **Archive completed tasks from `TASKS.md`**:
   - Move all `[x]` tasks from `TASKS.md` to `TASKS_ARCHIVE.md`
   - In `TASKS_ARCHIVE.md`, group by sprint/phase, include completion date
   - Keep `TASKS.md` lean — only pending, in-progress, and blocked tasks remain

2. **Summarize old worklog entries**:
   - If `WORKLOG.md` has more than 20 entries, archive the oldest ones
   - Keep the 20 most recent entries in `WORKLOG.md`
   - Write archived entries as a summary block to `WORKLOG_ARCHIVE.md` (group by sprint, highlight key decisions and patterns established)
   - Remove the archived entries from `WORKLOG.md`

3. **Commit the cleanup** with message: "chore: archive completed tasks and summarize worklog"

4. **Validate file sizes**: if `TASKS_ARCHIVE.md` or `WORKLOG_ARCHIVE.md` exceed ~200 lines, consolidate older sections into higher-level summaries (same decay pattern)

### Decomposer Agent Protocol

This agent's ONLY job is planning the next sprint. It does NOT implement code.

**Short-circuit check:** Count unchecked `[ ]` tasks (excluding `[blocked]`) in `TASKS.md`. If there are pending tasks remaining, exit immediately — current sprint isn't done yet.

1. **Identify the next phase**:
   - Read `TASKS_ARCHIVE.md` to see which sprints are completed
   - Read `TASKS.md` to confirm current sprint is empty (all done or blocked)
   - Read `PLANNING.md` to find the next phase that needs decomposition

2. **Gather context from what was actually built**:
   - Read `WORKLOG.md` — recent entries show patterns, decisions, file structure established
   - Read key source files to understand the real codebase state (don't assume — verify)
   - Note: the codebase may differ from what PLANNING.md envisioned. Decompose based on reality, not the plan.

3. **Write the new sprint into `TASKS.md`**:
   - Add a new sprint header: `## Sprint N: [Phase Name]`
   - Break the phase into agent-sized tasks (one commit each, completable in a single session)
   - Each task must be specific and actionable — include file paths, component names, and acceptance criteria
   - Reference relevant PLANNING.md sections by task ID (e.g., "Implements T3.2 from PLANNING.md")
   - Order tasks by dependency — earlier tasks should be prerequisites for later ones
   - Aim for 15-30 tasks per sprint (fewer if tasks are complex)

4. **Append a planning entry to `WORKLOG.md`**:
   - Note which phase was decomposed, how many tasks created, key decisions made during decomposition

5. **Commit** with message: "plan: decompose Sprint N — [Phase Name]"

### Agent Scheduling Summary

| Agent | Job | Runs when | Short-circuits if |
|---|---|---|---|
| **Worker** | Implement next task | Frequent (every 30-60min) | No pending tasks in TASKS.md |
| **Cleanup** | Archive done tasks + summarize worklog | Frequent (every 30-60min) | Fewer than 10 completed tasks |
| **Decomposer** | Break next phase into tasks | Frequent (every 30-60min) | Pending tasks still exist |

All three can run on the same schedule. On any given run, typically only one has actual work to do:
- While a sprint is active: **Worker** runs, others short-circuit
- After ~10 tasks complete: **Cleanup** runs, archives them
- When sprint is done: **Decomposer** runs, plans the next sprint
- Cycle repeats
