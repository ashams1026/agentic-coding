# Scheduling Infrastructure & Backend Design — Design Research

Research into the backend implementation of scheduled agent runs: scheduler library choice, missed run handling, data model, concurrency control, and interaction with the existing trigger/workflow system.

**Current state:** No scheduling infrastructure exists. The backend is a Fastify server managed by pm2 (`ecosystem.config.cjs`), with crash recovery on startup (`start.ts:recoverOrphanedState()`). The concurrency system (`concurrency.ts`) manages parallel execution limits (default 3) with an in-memory `Set<string>` and priority queue. Persona dispatch (`dispatch.ts:dispatchForState()`) is event-driven — triggered by workflow state transitions. There is no cron library, no schedules table, and no time-based trigger mechanism. The PLANNING.md lists Trigger as a core entity but no schema exists for it.

---

## 1. Scheduler Implementation

### Options analysis

| Library | Type | Pros | Cons | Recommendation |
|---|---|---|---|---|
| **node-cron** | In-process timer | Simple, zero deps, widely used, evaluates cron in Node.js | In-memory only — schedules lost on restart; no persistence, no missed-run recovery; no job queue | **Phase 1 — with DB persistence layer** |
| **cron** (npm) | In-process timer | Timezone support, lighter than node-cron | Same limitations as node-cron | Alternative to node-cron |
| **System crontab** | OS-level | Survives process crashes, runs even if app is down | Hard to manage from UI, OS-dependent, no access to app context (DB, personas) | Not recommended for local-first app |
| **pm2 cron_restart** | pm2 feature | Already have pm2 | Only restarts the process — can't trigger individual schedules | Not applicable |
| **BullMQ** | Redis job queue | Robust, persistent, retries, delayed jobs, concurrency control | Requires Redis — heavy dependency for a local-first app | **Phase 3 — if scaling needed** |
| **Agenda** | MongoDB job queue | Persistent, mature | Requires MongoDB — even heavier dependency | Not recommended |
| **bree** | Worker thread scheduler | Persistent, cron support, worker isolation | Complex, overkill for this use case | Not recommended |

### Recommended architecture: node-cron + SQLite persistence

```
┌─ Backend startup ─────────────────────────────────────────┐
│                                                            │
│  1. Run migrations                                         │
│  2. Recover orphaned executions (existing)                 │
│  3. Load schedules from DB                                 │
│  4. Register active schedules with node-cron               │
│  5. Check for missed runs → catch up if configured         │
│  6. Start Fastify server                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

The scheduler is a singleton module that bridges the `schedules` DB table and node-cron:

```typescript
// packages/backend/src/scheduler/scheduler.ts

import cron from "node-cron";

interface SchedulerState {
  tasks: Map<string, cron.ScheduledTask>;  // scheduleId → cron task
}

const state: SchedulerState = { tasks: new Map() };

/** Load all enabled schedules from DB and register with node-cron */
export async function initializeScheduler(): Promise<void> {
  const schedules = await db.select().from(schedulesTable)
    .where(eq(schedulesTable.enabled, true));

  for (const schedule of schedules) {
    registerSchedule(schedule);
  }

  // Check for missed runs
  await catchUpMissedRuns(schedules);
}

/** Register a single schedule with node-cron */
function registerSchedule(schedule: Schedule): void {
  // Validate cron expression
  if (!cron.validate(schedule.cronExpression)) {
    logger.error({ scheduleId: schedule.id }, "Invalid cron expression");
    return;
  }

  const task = cron.schedule(
    schedule.cronExpression,
    () => executeSchedule(schedule.id),
    { timezone: schedule.timezone },
  );

  state.tasks.set(schedule.id, task);
}

/** Execute a scheduled run */
async function executeSchedule(scheduleId: string): Promise<void> {
  const schedule = await db.select().from(schedulesTable)
    .where(eq(schedulesTable.id, scheduleId)).get();

  if (!schedule || !schedule.enabled) return;

  // Check overlap policy
  if (schedule.skipIfRunning) {
    const activeRun = await getActiveRunForSchedule(scheduleId);
    if (activeRun) {
      logger.info({ scheduleId }, "Skipping — previous run still in progress");
      return;
    }
  }

  // Create execution record
  const executionId = await createScheduledExecution(schedule);

  // Update schedule metadata
  await db.update(schedulesTable).set({
    lastRunAt: Date.now(),
    nextRunAt: computeNextRun(schedule.cronExpression, schedule.timezone),
  }).where(eq(schedulesTable.id, scheduleId));

  // Spawn the persona with the schedule's prompt
  await executionManager.runScheduledExecution(
    executionId,
    schedule.personaId,
    schedule.projectId,
    schedule.prompt,
  );
}

/** Stop all scheduled tasks (for graceful shutdown) */
export function stopAllSchedules(): void {
  for (const [id, task] of state.tasks) {
    task.stop();
  }
  state.tasks.clear();
}
```

### Lifecycle integration

The scheduler hooks into the existing server lifecycle:

```typescript
// In start.ts
export async function startServer(): Promise<FastifyInstance> {
  await runMigrations();
  await recoverOrphanedState();
  await initializeScheduler();          // NEW
  const app = await buildServer();
  // ... listen
  return app;
}

// Graceful shutdown
async function shutdown(app: FastifyInstance): Promise<void> {
  stopAllSchedules();                    // NEW
  await waitForExecutions(SHUTDOWN_TIMEOUT_MS);
  // ...
}
```

---

## 2. Missed Runs

### Problem

The app may not be running when a schedule is due (laptop closed, server restarted, backend crashed). When the app starts up, it needs to decide what to do about missed runs.

### Detection

On startup, compare each schedule's `nextRunAt` with the current time:

```typescript
async function catchUpMissedRuns(schedules: Schedule[]): Promise<void> {
  const now = Date.now();

  for (const schedule of schedules) {
    if (!schedule.enabled || !schedule.nextRunAt) continue;

    if (schedule.nextRunAt < now) {
      const missedBy = now - schedule.nextRunAt;
      logger.info({
        scheduleId: schedule.id,
        name: schedule.name,
        missedByMs: missedBy,
      }, "Detected missed scheduled run");

      if (schedule.catchUpMissed) {
        // Execute now (one catch-up run, not N missed runs)
        await executeSchedule(schedule.id);
      } else {
        // Skip — just update nextRunAt to the next future occurrence
        await db.update(schedulesTable).set({
          nextRunAt: computeNextRun(schedule.cronExpression, schedule.timezone),
        }).where(eq(schedulesTable.id, schedule.id));
      }
    }
  }
}
```

### Catch-up policy (per-schedule)

| Policy | Behavior | Default | Use case |
|---|---|---|---|
| **Catch up (run once)** | Execute immediately on startup. Only one catch-up run regardless of how many were missed. | Yes | "Nightly review" — missed last night, run now |
| **Skip** | Don't execute. Advance `nextRunAt` to the next future occurrence. | No | "Hourly stats" — stale data, wait for next window |

**Why "run once" not "run N times":** If the app was down for 3 days and a daily schedule missed 3 runs, running all 3 on startup would be wasteful. One catch-up run with the latest context is sufficient.

### Notification on missed runs

On startup, if any schedules were missed:
- Log each missed schedule with details
- Fire a low-priority notification: "Missed 2 scheduled runs while offline" (ties into RES.NOTIFY.UX)
- Show missed runs in the schedule execution history with status "skipped" or "caught up"

---

## 3. Data Model

### `schedules` table

```sql
CREATE TABLE schedules (
  id TEXT PRIMARY KEY,                          -- ScheduleId (sc-xxxxx)
  name TEXT NOT NULL,                           -- User-friendly name
  persona_id TEXT NOT NULL REFERENCES personas(id),
  project_id TEXT REFERENCES projects(id),      -- NULL = no project scope
  prompt TEXT NOT NULL,                         -- Instruction for the agent
  cron_expression TEXT NOT NULL,                -- Standard 5-field cron
  timezone TEXT NOT NULL DEFAULT 'UTC',         -- IANA timezone
  enabled BOOLEAN NOT NULL DEFAULT true,
  catch_up_missed BOOLEAN NOT NULL DEFAULT true,
  skip_if_running BOOLEAN NOT NULL DEFAULT false,
  last_run_at INTEGER,                          -- Timestamp (ms)
  last_run_outcome TEXT,                        -- "success" | "failure" | null
  next_run_at INTEGER,                          -- Computed on create/update/run
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_schedules_persona ON schedules(persona_id);
CREATE INDEX idx_schedules_project ON schedules(project_id);
CREATE INDEX idx_schedules_next_run ON schedules(next_run_at) WHERE enabled = true;
```

### Extensions to `executions` table

```sql
ALTER TABLE executions ADD COLUMN schedule_id TEXT REFERENCES schedules(id);
ALTER TABLE executions ADD COLUMN trigger_type TEXT NOT NULL DEFAULT 'workflow';
  -- Values: "workflow", "scheduled", "manual", "chat"
```

### `nextRunAt` computation

Computed when a schedule is created, updated, or after a run completes. Uses `cron-parser` to find the next occurrence:

```typescript
import { parseExpression } from "cron-parser";

function computeNextRun(cronExpression: string, timezone: string): number {
  const interval = parseExpression(cronExpression, {
    tz: timezone,
    currentDate: new Date(),
  });
  return interval.next().getTime();
}
```

### Relationship to executions

Each scheduled run creates one execution record with `trigger_type = "scheduled"` and `schedule_id` set. The execution flows through the normal execution pipeline (streaming events to WebSocket, cost tracking, completion callbacks).

```
Schedule → creates Execution (scheduleId, trigger_type="scheduled")
                           → spawns Persona with prompt
                           → streams events to Agent Monitor
                           → on complete: updates schedule.lastRunAt, lastRunOutcome, consecutiveFailures
```

### Auto-disable on repeated failures

If `consecutive_failures >= 10`, the scheduler automatically disables the schedule:

```typescript
async function onScheduledRunComplete(
  scheduleId: string,
  outcome: "success" | "failure",
): Promise<void> {
  if (outcome === "success") {
    await db.update(schedulesTable).set({
      lastRunOutcome: "success",
      consecutiveFailures: 0,
    }).where(eq(schedulesTable.id, scheduleId));
  } else {
    const [schedule] = await db.select({ consecutiveFailures: schedulesTable.consecutiveFailures })
      .from(schedulesTable).where(eq(schedulesTable.id, scheduleId));

    const newCount = (schedule?.consecutiveFailures ?? 0) + 1;
    const shouldDisable = newCount >= 10;

    await db.update(schedulesTable).set({
      lastRunOutcome: "failure",
      consecutiveFailures: newCount,
      enabled: shouldDisable ? false : undefined,
    }).where(eq(schedulesTable.id, scheduleId));

    if (shouldDisable) {
      // Unregister from node-cron
      state.tasks.get(scheduleId)?.stop();
      state.tasks.delete(scheduleId);

      // Fire critical notification
      // (ties into RES.NOTIFY.UX)
      logger.warn({ scheduleId }, "Schedule auto-disabled after 10 consecutive failures");
    }
  }
}
```

---

## 4. Concurrency

### Scheduled runs share the existing concurrency pool

Scheduled executions use the same `canSpawn()` / `enqueue()` system from `concurrency.ts`. They count against the project's `maxConcurrent` limit alongside workflow-triggered executions.

This means: if 3 workflow agents are running and a scheduled run fires, the scheduled run is enqueued and waits for a slot. No separate pool.

### Per-schedule overlap handling

What happens if a schedule fires while its previous run is still active?

| Policy | Behavior | Config field |
|---|---|---|
| **Skip** | Don't start a new run. Log "skipped — previous run in progress." | `skipIfRunning: true` |
| **Queue** | Enqueue the new run. It starts when the previous one finishes. | `skipIfRunning: false` (default) |
| **Parallel** | Start a new run alongside the previous one. | Not supported — too risky for same-persona same-project runs |

**Default: Queue.** Most schedules run fast enough that overlap is rare. If a daily 9 AM run is still going at 10 AM, queuing the next day's run is fine. If overlap happens frequently, the user should either increase the interval or switch to "skip."

### Priority

Scheduled runs get `p2` priority by default (same as normal work items). They don't preempt workflow-triggered runs. If the queue is full, scheduled runs wait.

### "All projects" scope

When a schedule has `projectId = null` (all projects), the scheduler creates one execution per project, submitted sequentially:

```typescript
async function executeAllProjectsSchedule(schedule: Schedule): Promise<void> {
  const allProjects = await db.select({ id: projects.id }).from(projects);

  for (const project of allProjects) {
    // Check concurrency per project
    const allowed = await canSpawn(project.id);
    if (allowed) {
      await createScheduledExecution({ ...schedule, projectId: project.id });
    } else {
      await enqueue(/* ... */);
    }
  }
}
```

---

## 5. Interaction with Triggers and Workflows

### Current trigger system

PLANNING.md lists Trigger as a core entity, but **no triggers table exists in the schema**. The only "trigger" mechanism today is `dispatchForState()` — event-driven dispatch when a work item enters a state with an assigned persona.

### Are schedules a type of trigger?

**No — schedules and triggers are separate concepts.**

| Concept | What fires it | What it does | Scope |
|---|---|---|---|
| **Workflow dispatch** | Work item enters a state | Runs the assigned persona on that work item | Per-work-item |
| **Schedule** | Time (cron) | Runs a persona with a prompt, optionally scoped to a project | Per-persona + project |
| **Trigger** (future) | External event (webhook, GitHub, Slack) | Creates a work item or runs a persona | Per-event-source |

Schedules create **standalone executions** (no work item, per RES.SCHED.UX Phase 1). Triggers (future, RES.WEBHOOKS.INBOUND) may create work items that flow through the workflow. They share infrastructure (execution creation, concurrency, notifications) but have different semantics.

### How schedules interact with custom workflows

Schedules bypass the workflow system — they don't create work items or trigger state transitions. A scheduled run is a direct persona execution with a prompt.

In Phase 2, optional work item creation could bridge the two:
```
Schedule fires → Creates work item in "Ready" state → Normal workflow dispatch takes over
```

This would allow scheduled work to flow through review, approval, and routing — but adds complexity. Phase 1 keeps it simple with standalone executions.

### Potential future: unified trigger table

If both schedules and inbound webhooks are implemented, a unified trigger abstraction could emerge:

```sql
CREATE TABLE triggers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,           -- "schedule" | "webhook" | "github" | "slack"
  config TEXT NOT NULL,         -- JSON: type-specific config (cron, URL, events, etc.)
  persona_id TEXT REFERENCES personas(id),
  project_id TEXT REFERENCES projects(id),
  prompt TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at INTEGER NOT NULL
);
```

This is a Phase 3 consideration. For Phase 1, a dedicated `schedules` table is simpler and clearer.

---

## 6. API Endpoints

### CRUD for schedules

```
POST /api/schedules
  Body: { name, personaId, projectId?, prompt, cronExpression, timezone?, catchUpMissed?, skipIfRunning? }
  Response: { data: Schedule }
  Side effect: registers with node-cron

GET /api/schedules
  Query: ?projectId=xxx&personaId=yyy&enabled=true
  Response: { data: Schedule[], total: number }

GET /api/schedules/:id
  Response: { data: Schedule }

PATCH /api/schedules/:id
  Body: { name?, prompt?, cronExpression?, timezone?, enabled?, catchUpMissed?, skipIfRunning? }
  Response: { data: Schedule }
  Side effect: re-registers with node-cron if cron/timezone/enabled changed

DELETE /api/schedules/:id
  Response: { success: true }
  Side effect: stops cron task, removes from registry

POST /api/schedules/:id/run
  Response: { executionId: string }
  Side effect: immediate execution (trigger_type = "manual")

GET /api/schedules/:id/history
  Query: ?limit=20&offset=0
  Response: { data: Execution[], total: number }
  Note: filters executions where schedule_id = :id
```

### Validation

- `cronExpression` must be valid (checked via `cron.validate()`)
- `personaId` must reference an existing persona
- `projectId` (if provided) must reference an existing project
- `timezone` must be a valid IANA timezone
- `name` must be non-empty, max 100 chars

---

## 7. Implementation Phases

### Phase 1: node-cron + schedules table

- `schedules` table with Drizzle schema + migration
- `schedule_id` and `trigger_type` columns on executions
- Scheduler module with `initializeScheduler()`, `registerSchedule()`, `executeSchedule()`
- Crash recovery: `catchUpMissedRuns()` on startup
- CRUD API endpoints
- `POST /api/schedules/:id/run` for manual trigger
- Integrate with `start.ts` lifecycle (init on start, stop on shutdown)
- Auto-disable after 10 consecutive failures

**Why first:** Core scheduling works end-to-end. Users can create schedules via API (frontend from RES.SCHED.UX Phase 1).

### Phase 2: Overlap handling + "all projects" scope

- `skipIfRunning` check before execution
- "All projects" fan-out (one execution per project)
- Schedule execution history endpoint
- `nextRunAt` computation with `cron-parser`
- Notification integration for failures and missed runs

**Why second:** Overlap and multi-project are edge cases that most users won't hit immediately.

### Phase 3: Unified trigger abstraction

- Evaluate whether schedules and inbound webhooks should share a `triggers` table
- If yes: migrate `schedules` → `triggers` with `type = "schedule"`
- If no: keep separate tables with shared execution infrastructure

**Why last:** Depends on RES.WEBHOOKS.INBOUND being designed first. Premature unification adds complexity without value.

---

## 8. Relationship to Other Research

| Topic | Relationship |
|---|---|
| RES.SCHED.UX | Frontend UX — this doc covers the backend that powers it. ScheduleDefinition interface from UX maps to the schedules table here. |
| RES.COLLAB.COORD | Scheduled runs share the concurrency pool. Fan-out ("all projects") parallels the fan-out/fan-in coordination patterns. |
| RES.NOTIFY.UX | Notifications for schedule failures, auto-disable, and missed runs. |
| RES.NOTIFY.INTEGRATIONS | External notification channels for schedule events (Slack, email). |
| RES.WEBHOOKS.INBOUND | Inbound triggers share execution infrastructure. Potential future unification into a `triggers` table. |
| RES.RECOVERY.AGENTS | Crash recovery for scheduled executions — same `recoverOrphanedState()` handles them since they're regular executions. |
| RES.PROMPTS.VARS | Template variables in schedule prompts ({{date}}, {{schedule.lastRunAt}}) resolved at execution time. |

---

## 9. Design Decisions

### node-cron over external job queues

BullMQ and Agenda require Redis or MongoDB — heavy dependencies for a local-first app. node-cron is zero-dependency and runs in-process. The limitation (schedules lost on restart) is solved by persisting to SQLite and re-registering on startup. This approach has no external service requirements.

### Schedules share the concurrency pool

A separate concurrency pool for scheduled runs would be complex and confusing (users would need to configure two limits). Sharing the pool means scheduled runs compete fairly with workflow runs. If a user wants to guarantee slots for schedules, they can increase `maxConcurrent`.

### Catch-up runs once, not N times

If the app was down for a week and a daily schedule missed 7 runs, executing all 7 on startup would be wasteful and potentially harmful (7 identical reviews running at once). One catch-up run with fresh context is more useful.

### Standalone executions in Phase 1

Scheduled runs bypass the workflow system (no work item creation, no state transitions). This keeps Phase 1 simple and avoids cluttering Work Items with auto-generated entries. Work item creation can be added as an opt-in Phase 2 feature.

### Per-schedule timezone, not global

Users may want different schedules in different timezones (a team-wide schedule in UTC, a personal review in the user's local time). Storing timezone per schedule is more flexible than a global setting.
