# AgentOps — Autonomous Agent

You are an autonomous agent working on the AgentOps project.
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
  │     YES → go to REVIEW
  │     NO ↓
  │
  ├─── pending_count ([ ] tasks, not [in-progress] or [blocked]) == 0?
  │     YES → go to DECOMPOSE
  │     NO ↓
  │
  ├─── pending_count > 0?
  │     YES → go to WORK
  │     NO ↓
  │
  └─── → STOP (nothing to do)
```

**Priority order:** CLEANUP → REVIEW → DECOMPOSE → WORK

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

## State: REVIEW

> Trigger: tasks marked [review] exist
> Role: Review ONE task's implementation. Do NOT write new features.

```
REVIEW
  │
  ▼
[SELECT TASK]
  Read TASKS.md → find FIRST [review] task
  │
  ▼
[GATHER CONTEXT]
  Read the task description — what was it supposed to do?
  Read WORKLOG.md → find the worker's entry for this task (what they did, files changed)
  Read CLAUDE.md → coding conventions to check against
  │
  ▼
[INSPECT WORK]
  Read the files the worker created/modified (from their WORKLOG entry)
  Check:
    - Does the implementation match the task description?
    - Does it follow conventions in CLAUDE.md?
    - Does the code have obvious bugs, missing imports, or broken logic?
    - Are there hardcoded values that should use mock data?
    - Does it integrate with existing code correctly?
  Run: pnpm build or pnpm dev — does it compile without errors?
  │
  ▼
[DECIDE]
  │
  ├── APPROVE: work is correct and complete
  │     │
  │     ▼
  │   [APPROVE]
  │     Update TASKS.md: change [review] → [x]
  │     Append to WORKLOG.md:
  │       "## YYYY-MM-DD — Review: TASK_ID (approved)"
  │       - What was reviewed
  │       - Verdict: approved
  │     Commit message: "review: approve TASK_ID — short description"
  │     git push origin main
  │     │
  │     ▼
  │   STOP
  │
  └── REJECT: work has issues that need fixing
        │
        ▼
      [REJECT]
        Update TASKS.md: change [review] → [ ]
        Add feedback block directly below the task:
          > [feedback: Clear description of what's wrong and how to fix it.
          >  Be specific — reference file names, line numbers, expected behavior.
          >  Example: "Button component in story-card.tsx is missing onClick handler
          >  for the drag initiation. Add onMouseDown prop wired to dnd-kit."]
        Append to WORKLOG.md:
          "## YYYY-MM-DD — Review: TASK_ID (rejected)"
          - What was reviewed
          - Issues found
          - Feedback given
        Commit message: "review: reject TASK_ID — short description of issues"
        git push origin main
        │
        ▼
      STOP
```

### Reviewer Rules

- **ONE task per review cycle.** Review one task, then STOP.
- **Be specific in feedback.** The worker agent has no memory of its previous run — the feedback block is all it gets. Include file names, what's wrong, and what the fix should be.
- **Don't fix it yourself.** Your job is to identify issues and write clear feedback. The worker will fix it on the next cycle.
- **Build must pass.** If `pnpm build` fails, that's an automatic rejection.
- **Check conventions.** Refer to CLAUDE.md for naming, structure, and patterns.

---

## State: DECOMPOSE

> Trigger: zero pending tasks — current sprint is done
> Role: Planning only. Do NOT write code.

```
DECOMPOSE
  │
  ▼
[IDENTIFY NEXT PHASE]
  Read TASKS_ARCHIVE.md → which sprints are completed?
  Read TASKS.md → confirm current sprint is empty
  Read PLANNING.md → find next phase needing decomposition
  │
  ▼
[GATHER CONTEXT]
  Read WORKLOG.md → recent patterns, decisions, file structure
  Read key source files → understand REAL codebase state
  Note: codebase may differ from PLANNING.md — decompose based on reality
  │
  ▼
[WRITE NEW SPRINT]
  Add to TASKS.md: "## Sprint N: [Phase Name]"
  Break phase into agent-sized tasks (one commit each)
  Each task must include: file paths, component names, acceptance criteria
  Reference PLANNING.md by task ID (e.g., "Implements T3.2")
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

## State: WORK

> Trigger: pending tasks exist
> Role: Implement exactly ONE task, then stop.

```
WORK
  │
  ▼
[SELECT TASK]
  Read TASKS.md → find FIRST [ ] task (not [in-progress] or [blocked])
  If task has a [feedback: ...] block below it → this is a REWORK
    Read the feedback carefully — it tells you exactly what to fix
  │
  ▼
[GATHER CONTEXT]
  Read WORKLOG.md → last 5 entries for recent context
  If needed: read relevant section of PLANNING.md (NOT the whole file)
  Read CLAUDE.md → coding conventions
  │
  ▼
[CLAIM]
  Mark task [in-progress: YYYY-MM-DD] in TASKS.md
  │
  ▼
[IMPLEMENT]
  Do the work following conventions in CLAUDE.md
  If reworking: address ALL points in the [feedback: ...] block
  │
  ├── Blocked? → mark [blocked: reason] in TASKS.md
  │               append blocker note to WORKLOG.md
  │               select NEXT unblocked task → go to [CLAIM]
  │               (still only complete ONE task total)
  │
  ├── Task too large? → split into subtasks in TASKS.md
  │                      complete the first subtask only
  │
  └── Continue ↓
  │
  ▼
[VISUAL CHECK] (conditional — frontend changes only)
  Run: git diff --name-only
  If NO files in packages/frontend/ changed → skip to [VERIFY]
  If frontend files changed:
    1. Ensure dev servers are running (check ports 3001 and 5173/5174, skip if already up)
    2. Use chrome-devtools MCP to open the affected page(s) in a browser
    3. Take a screenshot, visually examine for layout issues / broken styling / clipping / misalignment
    4. Fix any visual defects found, re-screenshot to confirm
  │
  File path → page URL mapping:
    features/work-items/        → /items
    features/dashboard/ or pages/dashboard → /
    features/agent-monitor/     → /agents
    features/activity-feed/     → /activity
    features/persona-manager/   → /personas
    features/settings/          → /settings
    components/sidebar.tsx or layouts/ → / (check any page)
  If multiple feature directories were touched, check each corresponding page.
  │
  ▼
[VERIFY]
  Ensure app builds: pnpm build or pnpm dev — no errors
  Check existing functionality is not broken
  │
  ▼
[COMPLETE]
  Update TASKS.md: mark task [review], remove [in-progress]
  If reworking: remove the [feedback: ...] block
  │
  ▼
[UPDATE WORKLOG]
  Append to WORKLOG.md:
    - Date
    - Task ID (note if rework)
    - What was done
    - Files changed/created
    - Notes for next agent
  │
  ▼
[COMMIT + PUSH]
  Commit all changes (code + TASKS.md + WORKLOG.md) with descriptive message
  git push origin main
  │
  ▼
STOP — do not pick up another task
```

### Worker Rules

- **ONE task per run.** After [COMMIT + PUSH], go to STOP. No exceptions.
- **Never skip ahead** to a later sprint. Complete current sprint first.
- **One task = one commit.** Keep changes atomic.
- **Preserve mock data layer** — components must use mock data, no hardcoded placeholders.
- **Follow established patterns** — check WORKLOG.md and existing code for consistency.
- **Read feedback carefully.** If a task has a `[feedback: ...]` block, address every point before marking [review].
- **If your task modifies frontend code, the visual check is mandatory — do not skip it.**
