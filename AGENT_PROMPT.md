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
  TASKS.md keeps only: pending, in-progress, blocked
  │
  ▼
[ARCHIVE WORKLOG]
  Entries older than 7 days in WORKLOG.md → summarize
  Write summary to WORKLOG_ARCHIVE.md (group by sprint, key decisions)
  Remove summarized entries from WORKLOG.md
  Keep at most 20 recent entries
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
[VERIFY]
  Ensure app builds: pnpm build or pnpm dev — no errors
  Check existing functionality is not broken
  │
  ▼
[COMPLETE]
  Update TASKS.md: mark task [x], remove [in-progress]
  │
  ▼
[UPDATE WORKLOG]
  Append to WORKLOG.md:
    - Date
    - Task ID
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
