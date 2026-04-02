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

### Task Format Reference

Tasks in `TASKS.md` use a strict line format. The task ID and description always stay on one line.

```markdown
## Sprint N: Sprint Name

### Section Name

- [ ] **TASK.ID** — One-line description. Extended detail sentences on the same line.
- [in-progress: 2026-03-31 14:30 PDT] **TASK.ID** — One-line description. Extended detail.
- [blocked: reason here] **TASK.ID** — One-line description. Extended detail.
- [x] **TASK.ID** — One-line description. Extended detail. *(completed 2026-03-31 14:30 PDT)*
```

Rules:
- One task = one line (no multi-line task descriptions)
- Task ID is always bold: `**PREFIX.ID**`
- Description follows `—` (em dash) after the ID
- `[in-progress]` and `[x]` tags include date+time in PDT
- `[blocked]` includes a brief reason inside the brackets
- Completed tasks append `*(completed YYYY-MM-DD HH:MM PDT)*` at the end
- Section headers (`### Name`) group related tasks — keep them even if some tasks are archived

### Worklog Entry Format

Each entry in `WORKLOG.md` follows this template. Keep entries **under 10 lines** — be concise.

```markdown
---

## YYYY-MM-DD HH:MM PDT — TASK.ID: Short title

**Done:** 1-3 sentences summarizing what was implemented or fixed.
**Files:** `path/to/file1.ts`, `path/to/file2.tsx`
**Notes:** One sentence for the next agent (optional — only if there's something non-obvious).
```

Rules:
- All timestamps in PDT (America/Los_Angeles)
- Use the `## date — TASK.ID: title` header format exactly — the cleanup agent uses this to identify entry boundaries
- `**Done:**` is required, `**Files:**` is required, `**Notes:**` is optional
- No bullet-point essays — if it takes more than 10 lines, you're over-explaining
- The `---` separator before each entry is required — the cleanup agent splits on it

### Worker Agent Protocol

1. **Read `TASKS.md`** — find the first unchecked task with no `[in-progress]` or `[blocked]` tag
2. **Read `WORKLOG.md`** — scan the last 5 entries for recent context (what was just built, patterns established)
3. **If you need architecture detail**, read the relevant section of `PLANNING.md` — do NOT read the whole file
4. **Claim the task**: mark it `[in-progress: YYYY-MM-DD HH:MM PDT]` in `TASKS.md` and commit this change
5. **Do the work**: implement the task following conventions above
6. **Verify**: ensure the app builds (`pnpm build` or `pnpm dev` — no errors), check that existing functionality isn't broken
7. **Update `TASKS.md`**: mark the task `[x]`, append `*(completed YYYY-MM-DD HH:MM PDT)*` to the end of the line
8. **Append to `WORKLOG.md`**: add an entry following the Worklog Entry Format above
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
- **Don't skip test and doc tasks.** Pick them up in order like any other task. If you see 3+ consecutive implementation tasks completed without a test or doc task between them, prioritize the next available test/doc task instead of the next implementation task.

### Cleanup Agent Protocol

This agent's ONLY job is maintenance. It does NOT pick up implementation tasks.

**Short-circuit check:** Count `[x]` tasks in `TASKS.md`. If fewer than 10, exit immediately — nothing to clean yet.

#### Step 1: Archive completed tasks

For each `[x]` task in `TASKS.md`:
- Find (or create) the matching sprint section in `TASKS_ARCHIVE.md`
- Append the task as a single line: `- [x] **TASK.ID** — Short description. *(completed YYYY-MM-DD HH:MM PDT)*`
- Remove the line from `TASKS.md`
- If a `### Section Name` header in `TASKS.md` has NO remaining tasks under it (no `[ ]`, `[in-progress]`, or `[blocked]` lines), remove the header too
- If a `## Sprint N` header has NO remaining tasks or section headers, remove it and update the archive summary line at the top of `TASKS.md`

**How to identify entries:** Tasks are lines starting with `- [x] **`. Section headers are `### `. Sprint headers are `## Sprint`. The `---` separators and `>` blockquotes are structural — preserve them.

**Archive format in `TASKS_ARCHIVE.md`:**
```markdown
## Sprint N: Sprint Name — archived YYYY-MM-DD

- [x] **TASK.ID** — Short description. *(completed 2026-03-31 14:30 PDT)*
- [x] **TASK.ID** — Short description. *(completed 2026-03-31 15:00 PDT)*
```

Keep the full one-line description from `TASKS.md`. Do NOT truncate or rewrite — copy the line as-is.

#### Step 2: Summarize old worklog entries

If `WORKLOG.md` has more than 20 entries:
- Count entries by looking for `## YYYY-MM-DD` headers (each header = one entry)
- Keep the 20 most recent entries in `WORKLOG.md`
- For the older entries: write a summary block to `WORKLOG_ARCHIVE.md`, grouped by sprint. Each sprint summary is 2-3 sentences covering key decisions and patterns established
- Remove the archived entries from `WORKLOG.md` (remove everything from the `---` separator before the entry through the end of the entry)

#### Step 3: Commit and validate

- Commit with message: "chore: archive completed tasks and summarize worklog"
- If `TASKS_ARCHIVE.md` exceeds ~200 lines, consolidate older sprint sections into one-line summaries: `**Sprint N (TASK.1-TASK.N):** X tasks. One-sentence summary.`

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
   - **Testing & docs are mandatory in every sprint.** For each feature with UI changes, add: (a) an e2e test plan task (write `tests/e2e/plans/<feature>.md`), (b) an e2e test execution task (run the plan, record to `tests/e2e/results/`). For each feature that changes backend APIs, schemas, or architecture, add a doc update task targeting the relevant file in `docs/`. At the end of every sprint, add a regression test checkpoint task that re-runs all existing e2e suites and files bugs for regressions. Target ratio: ~80% implementation, ~10% testing, ~10% documentation.

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
