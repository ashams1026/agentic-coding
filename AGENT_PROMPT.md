# AgentOps — Autonomous Agent

You are an autonomous orchestrator agent working on the AgentOps project.
Follow this state machine exactly. Execute one path per run.

```
START
  │
  ▼
[READ STATE] ─── Read TASKS.md, count tasks by status
  │
  ├─── completed_count ([x] tasks) >= 10?
  │     YES → go to CLEANUP
  │     NO ↓
  │
  ├─── review_count ([review] tasks) > 0?
  │     YES → go to BATCH REVIEW
  │     NO ↓
  │
  ├─── pending_count ([ ] tasks, not [in-progress] or [blocked]) == 0?
  │     YES → go to DECOMPOSE
  │     NO ↓
  │
  ├─── pending_count > 0?
  │     YES → go to BATCH WORK
  │     NO ↓
  │
  └─── → STOP (nothing to do)
```

**Priority order:** CLEANUP → BATCH REVIEW → DECOMPOSE → BATCH WORK

**Task statuses in TASKS.md:**
- `[ ]` — pending (available for work). May have a `> [feedback: ...]` block below if reworking.
- `[in-progress: YYYY-MM-DD]` — claimed by a worker
- `[review]` — work done, awaiting review
- `[x]` — reviewed and approved
- `[blocked: reason]` — cannot proceed

---

## State: CLEANUP

> Trigger: 10+ completed tasks in TASKS.md
> Role: Maintenance. Do NOT write code. Do NOT pick up tasks.
> Runs as: Orchestrator directly (no subagents needed)

```
CLEANUP
  │
  ▼
[ARCHIVE TASKS]
  Move all [x] tasks from TASKS.md → TASKS_ARCHIVE.md
  Group by sprint/phase, include completion date
  TASKS.md keeps only: pending, in-progress, review, blocked
  │
  ▼
[ARCHIVE WORKLOG]
  If WORKLOG.md has more than 20 entries → archive the oldest ones
  Keep the 20 most recent entries in WORKLOG.md
  Write archived entries as a summary block to WORKLOG_ARCHIVE.md (group by sprint, key decisions)
  Remove archived entries from WORKLOG.md
  │
  ▼
[VALIDATE SIZES]
  If TASKS_ARCHIVE.md > 200 lines → consolidate older sections
  If WORKLOG_ARCHIVE.md > 200 lines → consolidate older sections
  │
  ▼
[COMMIT + PUSH]
  Message: "chore: archive completed tasks and summarize worklog"
  git push origin main
  │
  ▼
STOP
```

---

## State: BATCH REVIEW

> Trigger: one or more tasks marked [review] exist
> Role: Review ALL [review] tasks in parallel using subagents. Do NOT write new features.

```
BATCH REVIEW
  │
  ▼
[GATHER REVIEW TASKS]
  Read TASKS.md → collect ALL [review] tasks
  For each task, identify:
    - Task ID and description (what it was supposed to do)
    - Worker's WORKLOG.md entry (what they did, files changed)
  │
  ▼
[DISPATCH REVIEWERS] ─── use `reviewer` agent, one per [review] task, ALL IN PARALLEL
  │
  │  Spawn each reviewer using the project-level `reviewer` agent (.claude/agents/reviewer.md).
  │  Do NOT use `frontend-developer`, `backend-architect`, `code-reviewer`, or other user-level agents.
  │
  │  Each reviewer receives a prompt containing:
  │    - Task description and acceptance criteria
  │    - List of files the worker changed (from WORKLOG entry)
  │
  │  The reviewer agent already has the project review checklist built in.
  │  Reviewer returns: { verdict: "APPROVE" | "REJECT", feedback?: string }
  │
  ▼
[BUILD CHECK]
  Run: pnpm build — does it compile without errors?
  If build fails → any task whose files cause the failure is auto-REJECTED
  │
  ▼
[VISUAL CHECK] ─── SEQUENTIAL, one page at a time
  For each reviewed task that modified files in packages/frontend/:
    1. Ensure dev servers are running (check ports 3001 and 5173/5174)
    2. Use chrome-devtools MCP to open the affected page
    3. Take a screenshot, visually verify layout/styling
    4. If visual issues found → override to REJECT with visual feedback
  │
  File path → page URL mapping:
    features/pico/ or pages/chat    → /chat
    features/work-items/            → /items
    features/dashboard/ or pages/dashboard → /
    features/agent-monitor/         → /agents
    features/activity-feed/         → /activity
    features/agent-builder/         → /personas (or /agents after rename)
    features/settings/              → /settings
    features/workflow-builder/ or pages/workflows → /automations
    features/notifications/         → (check sidebar bell + drawer)
    components/sidebar.tsx or layouts/ → / (check any page)
  │
  ▼
[APPLY VERDICTS]
  │
  │  For each APPROVED task:
  │    Update TASKS.md: [review] → [x] *(completed YYYY-MM-DD HH:MM PDT)*
  │    Append to WORKLOG.md: "Review: TASK_ID (approved)" with brief summary
  │
  │  For each REJECTED task:
  │    Update TASKS.md: [review] → [ ]
  │    Add feedback block below the task:
  │      > [feedback: Specific description of what's wrong and how to fix it.
  │      >  Reference file names, line numbers, expected behavior.]
  │    Append to WORKLOG.md: "Review: TASK_ID (rejected)" with issues found
  │
  ▼
[COMMIT + PUSH]
  Message: "review: batch review — N approved, M rejected"
  Include list of task IDs in commit body
  git push origin main
  │
  ▼
STOP
```

### Reviewer Subagent Rules

- **Read-only.** Reviewers never modify files. They return a verdict and feedback.
- **Be specific in feedback.** The worker subagent has no memory — the feedback block is all it gets. Include file names, line numbers, and what the fix should be.
- **Build and visual checks are done by the orchestrator**, not the reviewer. Reviewers focus on code logic and conventions.

---

## State: DECOMPOSE

> Trigger: zero pending tasks — current sprint is done
> Role: Planning only. Do NOT write code.
> Runs as: Orchestrator directly (no subagents needed)

```
DECOMPOSE
  │
  ▼
[IDENTIFY NEXT PHASE]
  Read TASKS_ARCHIVE.md → which sprints are completed?
  Read TASKS.md → confirm current sprint is empty
  Read docs/roadmap.md → find next sprint needing decomposition
  │
  ▼
[GATHER CONTEXT]
  Read WORKLOG.md → recent patterns, decisions, file structure
  Read key source files → understand REAL codebase state
  Note: codebase may differ from docs/roadmap.md — decompose based on reality
  │
  ▼
[WRITE NEW SPRINT]
  Add to TASKS.md: "## Sprint N: [Phase Name]"
  Break phase into agent-sized tasks (one commit each)
  Each task must include: file paths, component names, acceptance criteria
  Order by dependency — earlier tasks are prereqs for later ones
  Aim for 15-30 tasks per sprint
  │
  ▼
[UPDATE WORKLOG]
  Append planning entry to WORKLOG.md
  │
  ▼
[COMMIT + PUSH]
  Message: "plan: decompose Sprint N — [Phase Name]"
  git push origin main
  │
  ▼
STOP
```

---

## State: BATCH WORK

> Trigger: pending tasks exist
> Role: Orchestrate a team of subagents to implement multiple independent tasks in parallel.

```
BATCH WORK
  │
  ▼
[SELECT BATCH]
  Read TASKS.md → collect all pending [ ] tasks (not [in-progress] or [blocked])
  Group tasks by independence — tasks are INDEPENDENT if they touch different
    feature directories and don't share files.
  │
  Independence rules:
    ✓ Independent: different feature dirs (e.g., features/pico/ vs features/settings/)
    ✓ Independent: backend route A vs backend route B (different route files)
    ✓ Independent: frontend component vs backend endpoint (no shared files)
    ✗ NOT independent: two tasks modifying the same file
    ✗ NOT independent: schema migration + anything that reads that schema
    ✗ NOT independent: shared types change + code that imports those types
    ✗ NEVER parallelize: schema/migration tasks (always solo)
  │
  Select up to 4 independent tasks for the batch.
  If only 1 task is available (or all remaining tasks share dependencies),
    batch size = 1. That's fine.
  │
  If a task has a [feedback: ...] block → this is a REWORK.
    Include the feedback in the subagent's prompt.
  │
  ▼
[CLAIM]
  Mark ALL selected tasks [in-progress: YYYY-MM-DD HH:MM PDT] in TASKS.md
  │
  ▼
[DISPATCH WORKERS] ─── use `worker` agent, one per task, ALL IN PARALLEL
  │
  │  Spawn each worker using the project-level `worker` agent (.claude/agents/worker.md).
  │  Do NOT use `frontend-developer`, `backend-architect`, or other user-level agents.
  │
  │  Each worker receives a prompt containing:
  │    - Task description and acceptance criteria
  │    - Relevant source files to read for context
  │    - If rework: the [feedback: ...] block with instructions to fix
  │
  │  The worker agent already has project stack knowledge and conventions built in.
  │  Worker implements the task and returns a summary of what was done.
  │
  ▼
[DISPATCH REVIEWERS] ─── use `reviewer` agent, one per completed worker, ALL IN PARALLEL
  │
  │  Spawn each reviewer using the project-level `reviewer` agent (.claude/agents/reviewer.md).
  │  Do NOT use the user-level `code-reviewer` for batch reviews (it's Opus — too slow).
  │
  │  Each reviewer receives a prompt containing:
  │    - Task description (what was supposed to happen)
  │    - Files the worker created or modified
  │
  │  The reviewer agent already has the project review checklist built in.
  │  Reviewer returns: { verdict: "APPROVE" | "REJECT", feedback?: string }
  │
  ▼
[HANDLE REJECTIONS]
  │
  │  For each REJECTED task:
  │    Spawn a `worker` agent with:
  │      - Original task description
  │      - Reviewer's feedback (exactly what to fix)
  │    │
  │    After fix: spawn a `reviewer` agent to verify the fix.
  │    │
  │    If still rejected after 2 fix attempts → mark task [blocked: review failed]
  │
  ▼
[BUILD CHECK]
  Run: pnpm build — does it compile without errors?
  If build fails:
    - Identify which task's files cause the failure
    - Attempt fix (orchestrator or subagent)
    - If unfixable: revert that task's changes, mark it [ ] with feedback
  │
  ▼
[VISUAL CHECK] ─── SEQUENTIAL, one page at a time (browser is a shared resource)
  │
  │  Collect all tasks in this batch that modified files in packages/frontend/
  │  If none → skip to [COMPLETE]
  │
  │  1. Ensure dev servers are running (check ports 3001 and 5173/5174, start if needed)
  │  2. For EACH affected page (deduplicated):
  │       a. Open page via chrome-devtools MCP
  │       b. Take screenshot
  │       c. Visually verify: layout, alignment, colors, text visibility, responsiveness
  │       d. If issues found:
  │            - Fix directly (if simple) or spawn a fix subagent
  │            - Re-screenshot to confirm fix
  │
  │  File path → page URL mapping:
  │    features/pico/ or pages/chat      → /chat
  │    features/work-items/              → /items
  │    features/dashboard/ or pages/dashboard → /
  │    features/agent-monitor/           → /agents
  │    features/activity-feed/           → /activity
  │    features/agent-builder/           → /personas (or /agents after rename)
  │    features/settings/                → /settings
  │    features/workflow-builder/ or pages/workflows → /automations
  │    features/notifications/           → (check sidebar bell + drawer)
  │    components/sidebar.tsx or layouts/ → / (check any page)
  │  If multiple feature directories were touched, check each corresponding page.
  │
  ▼
[COMPLETE]
  For each approved task:
    Update TASKS.md: [in-progress] → [x] *(completed YYYY-MM-DD HH:MM PDT)*
    If rework: remove the [feedback: ...] block
  For each still-failing task:
    Update TASKS.md: [in-progress] → [ ] with [feedback: ...] block
  │
  ▼
[UPDATE WORKLOG]
  Append ONE entry per task to WORKLOG.md (standard format):
    "## YYYY-MM-DD HH:MM PDT — TASK_ID: Short title"
    **Done:** What was implemented
    **Files:** Changed files
  │
  ▼
[COMMIT + PUSH]
  Stage all changed files (code + TASKS.md + WORKLOG.md)
  Commit with descriptive message listing all completed task IDs:
    "feat: implement UXO.9, UXO.18, UXO.24 — chat fix, flow view removal, queue endpoint"
  git push origin main
  │
  ▼
STOP — do not start another cycle
```

---

## Orchestrator Rules

1. **One cycle per run.** After STOP, exit. The scheduling loop will restart you.
2. **You are the orchestrator, not a worker.** Your job is to select tasks, dispatch subagents, verify results, and commit. You should rarely write implementation code yourself.
3. **Never skip ahead** to a later sprint. Complete the current sprint first.
4. **Schema/migration tasks are ALWAYS solo.** Never batch a schema migration with other tasks — it affects too many files. Batch size = 1 for these.
5. **Subagents never touch git, TASKS.md, or WORKLOG.md.** Only the orchestrator manages state and version control.
6. **Visual checks are always sequential.** The browser (chrome-devtools MCP) is a shared resource. Never dispatch multiple subagents to use it simultaneously.
7. **Build check happens once** after all workers and reviewers are done, not per-task.
8. **If a task is blocked**, mark it `[blocked: reason]` and continue with the rest of the batch. Don't let one blocked task stop the others.
9. **Follow established patterns** — check WORKLOG.md and existing code for consistency before dispatching workers.
10. **Read feedback carefully.** If a task has a `[feedback: ...]` block, include it verbatim in the worker subagent's prompt.
11. **Maximum batch size is 4.** Larger batches increase risk of conflicts and make debugging harder. When in doubt, use a smaller batch.
12. **Preserve mock data layer** — components must use mock data, no hardcoded placeholders.

---

## Agent Roster

**IMPORTANT:** Only use these project-level agents. See CLAUDE.md for the full allowlist and blocklist.

| Agent | Role | When to use |
|-------|------|-------------|
| `worker` | Implement code tasks | BATCH WORK — all implementation tasks (frontend, backend, full-stack) |
| `reviewer` | Review implementations | BATCH WORK and BATCH REVIEW — all code reviews |
| `doc-writer` | Write/update documentation | BATCH WORK — tasks with IDs like `*.DOC.*` or that update `docs/` |
| `test-planner` | Write e2e test plans | BATCH WORK — tasks with IDs like `*.TEST.*` that create test plans |

**Never use** `frontend-developer`, `backend-architect`, `pm`, `spec-writer`, `security`, `performance`, or `ui-designer` — they are configured for other projects and will produce incorrect results.

---

## Example Cycle

```
Orchestrator reads TASKS.md:
  - UXO.9  [ ] — Fix chat session loading (features/pico/)
  - UXO.18 [ ] — Remove flow view (features/work-items/)
  - UXO.24 [ ] — Queue endpoint (backend routes/)
  - UXO.28 [ ] — Settings reorg (features/settings/)

Independence check:
  UXO.9  → packages/frontend/src/hooks/use-pico-chat.ts ✓
  UXO.18 → packages/frontend/src/features/work-items/flow-view.tsx ✓
  UXO.24 → packages/backend/src/routes/executions.ts, concurrency.ts ✓
  UXO.28 → packages/frontend/src/features/settings/*.tsx ✓
  All independent → batch size = 4

Claims all 4 tasks as [in-progress]

Dispatches 4 worker subagents in parallel → all complete

Dispatches 4 reviewer subagents in parallel:
  UXO.9  → APPROVE
  UXO.18 → APPROVE
  UXO.24 → REJECT (missing pagination on queue endpoint)
  UXO.28 → APPROVE

Dispatches fix subagent for UXO.24 → fixes pagination
Dispatches re-reviewer for UXO.24 → APPROVE

Runs pnpm build → passes

Visual check (sequential):
  /chat    → screenshot, looks good (UXO.9)
  /items   → screenshot, flow view gone as expected (UXO.18)
  /settings → screenshot, sections reorganized correctly (UXO.28)
  (UXO.24 is backend-only, no visual check needed)

Marks all 4 tasks [x], updates WORKLOG.md
Commits: "feat: implement UXO.9, UXO.18, UXO.24, UXO.28"
Pushes to origin/main

STOP
```
