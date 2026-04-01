# Scheduled & Recurring Tasks — UX Design Research

Research into how users configure, manage, and monitor scheduled agent runs. Covers where schedules live, how they're defined, what gets scheduled, management UI, and how scheduled runs appear in the system.

**Current state:** No scheduling exists. All agent executions are triggered by workflow state transitions (persona dispatch) or manual user actions (chat, test runs). The `personaAssignments` table maps personas to workflow states — but there's no time-based trigger. The sidebar has 7 navigation items (Dashboard, Work Items, Agent Monitor, Activity Feed, Chat, Personas, Settings). There is no Trigger entity in the database schema despite being listed as a core entity in PLANNING.md.

---

## 1. Where Users Configure Schedules

### Option analysis

| Location | Pros | Cons | Recommendation |
|---|---|---|---|
| **Dedicated Schedules page** (sidebar nav) | Central hub for all schedules, easy to manage, discoverable | Adds a nav item, might feel empty for users who don't use scheduling | **Phase 2** — add when there are enough scheduling features |
| **Per-persona "Schedule" tab** in Persona Manager | Natural — "I want this persona to run on a schedule" | Schedules are scoped to persona, harder to see all schedules at once | **Primary entry point** — most intuitive |
| **Per-project section** in Settings | Groups project-level automation together | Buried in Settings, not discoverable | **Secondary** — list project schedules in Settings > Automation |
| **Workflow step configuration** | "When entering this state, also run on a schedule" | Conflates state-triggered and time-triggered | Not recommended — keep separate |

### Recommended UX flow

**Primary: Persona Manager > [Persona] > Schedules tab**

```
┌─ Persona: Code Reviewer ────────────────────────────────┐
│                                                           │
│  [Overview] [Prompt] [Tools] [Schedules] [Test Run]      │
│                                                           │
│  ── Active Schedules ──                                   │
│                                                           │
│  📅 Nightly PR Review                                    │
│  Every day at 9:00 AM PDT                                │
│  Project: tictactoe                                      │
│  Prompt: "Review all open PRs and file issues for..."    │
│  Next run: Tomorrow 9:00 AM | Last: Today 9:00 AM ✓     │
│  [● Enabled] [Run Now] [Edit] [Delete]                   │
│                                                           │
│  📅 Weekly Security Audit                                │
│  Every Monday at 8:00 AM PDT                             │
│  Project: All projects                                   │
│  Prompt: "Scan for dependency vulnerabilities..."         │
│  Next run: Monday 8:00 AM | Last: Last Monday 8:00 AM ✓ │
│  [● Enabled] [Run Now] [Edit] [Delete]                   │
│                                                           │
│  [+ Add Schedule]                                         │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Secondary: Settings > Automation**

A project-scoped view showing all schedules across all personas for the current project:

```
┌─ Settings > Automation ──────────────────────────────────┐
│                                                           │
│  ── Schedules ──                                          │
│                                                           │
│  Persona             Schedule          Next Run    Status │
│  ─────────────────────────────────────────────────────── │
│  Code Reviewer       Daily 9:00 AM     Tomorrow    ● On  │
│  Code Reviewer       Weekly Mon 8 AM   Monday      ● On  │
│  Bug Triager         Every 6 hours     In 4h       ● On  │
│  Documentation       Weekly Fri 5 PM   Friday      ○ Off │
│                                                           │
│  [+ Add Schedule]                                         │
│                                                           │
│  ── Recent Scheduled Runs ──                              │
│  (last 10 runs across all schedules)                     │
│  ...                                                      │
└───────────────────────────────────────────────────────────┘
```

**Phase 2: Dedicated Schedules page**

When scheduling becomes a core feature, add a `/schedules` page to the sidebar (between Activity Feed and Personas). This page shows all schedules globally, with filtering by project and persona. Calendar view option showing when agents are scheduled to run.

---

## 2. Schedule Definition

### Input methods (tiered complexity)

**Tier 1: Preset selector (default)**

Simple dropdown with common presets — covers 90% of use cases:

```
┌─ Frequency ──────────────────────────────┐
│  ○ Every hour                             │
│  ○ Every 6 hours                          │
│  ● Every day at [09:00 ▼]                │
│  ○ Every weekday at [09:00 ▼]            │
│  ○ Every week on [Monday ▼] at [09:00 ▼] │
│  ○ Every month on day [1 ▼] at [09:00 ▼] │
│  ○ Custom (cron expression)               │
└───────────────────────────────────────────┘
```

Each preset maps to a cron expression internally:
| Preset | Cron | Human-readable |
|---|---|---|
| Every hour | `0 * * * *` | "Every hour on the hour" |
| Every 6 hours | `0 */6 * * *` | "Every 6 hours (midnight, 6 AM, noon, 6 PM)" |
| Every day at 9:00 AM | `0 9 * * *` | "Daily at 9:00 AM" |
| Every weekday at 9:00 AM | `0 9 * * 1-5` | "Weekdays at 9:00 AM" |
| Every week on Monday at 9:00 AM | `0 9 * * 1` | "Every Monday at 9:00 AM" |
| Every month on day 1 at 9:00 AM | `0 9 1 * *` | "First of every month at 9:00 AM" |

**Tier 2: Custom cron expression (advanced toggle)**

For power users, a raw cron input with live preview:

```
┌─ Custom Schedule ─────────────────────────┐
│  Cron: [0 9 * * 1-5          ]            │
│  Preview: "Every weekday at 9:00 AM"      │
│  Next 5 runs:                             │
│    Mon Apr 3, 9:00 AM                     │
│    Tue Apr 4, 9:00 AM                     │
│    Wed Apr 5, 9:00 AM                     │
│    Thu Apr 6, 9:00 AM                     │
│    Fri Apr 7, 9:00 AM                     │
└───────────────────────────────────────────┘
```

Use a library like `cron-parser` to validate and preview. Show a "next 5 runs" list so the user can verify the schedule is correct before saving.

### Timezone handling

- **Default:** User's local timezone (detected from browser `Intl.DateTimeFormat().resolvedOptions().timeZone`)
- **Override:** Per-schedule timezone selector (dropdown of IANA timezones)
- **Display:** Always show times in the schedule's configured timezone with the timezone abbreviation (e.g., "9:00 AM PDT")
- **Storage:** Store the cron expression + timezone string. The scheduler evaluates the cron in the configured timezone.

```
┌─ Timezone ────────────────────────────────┐
│  [America/Los_Angeles (PDT) ▼]            │
│  ☑ Use my local timezone (default)        │
└───────────────────────────────────────────┘
```

---

## 3. What Gets Scheduled

### Schedule definition

A schedule combines four things:

```typescript
interface ScheduleDefinition {
  name: string;                  // User-friendly name: "Nightly PR Review"
  personaId: PersonaId;          // Which persona runs
  projectId?: ProjectId;         // Optional project scope (null = all projects)
  prompt: string;                // The instruction the persona receives
  cronExpression: string;        // When to run
  timezone: string;              // IANA timezone
  enabled: boolean;
}
```

### The prompt field

The prompt is the critical piece — it tells the agent what to do on each run. This is different from the persona's system prompt (which defines *who* the agent is). The schedule prompt defines *what task to perform*:

```
Schedule: "Nightly PR Review"
Persona: Code Reviewer (system prompt: "You are a thorough code reviewer...")
Prompt: "Review all open PRs in the repository that were opened or updated
         in the last 24 hours. For each PR, check code quality, test coverage,
         and security. Post your review as a comment."
```

### Prompt template with variables

Schedule prompts can use template variables (ties into RES.PROMPTS.VARS):

| Variable | Value | Example |
|---|---|---|
| `{{date}}` | Current date | "2026-04-02" |
| `{{time}}` | Current time | "09:00 PDT" |
| `{{dayOfWeek}}` | Day name | "Wednesday" |
| `{{project.name}}` | Project name | "tictactoe" |
| `{{schedule.name}}` | Schedule name | "Nightly PR Review" |
| `{{schedule.lastRunAt}}` | Last run timestamp | "2026-04-01 09:00 PDT" |
| `{{schedule.lastRunOutcome}}` | Last run result | "success" |

Example prompt with variables:
```
Review all PRs in {{project.name}} opened since {{schedule.lastRunAt}}.
If {{schedule.lastRunOutcome}} was "failure", also re-check the items that
failed in the previous run.
```

### Project scope

| Scope | Behavior | Use case |
|---|---|---|
| **Specific project** | Agent runs with that project's context (path, settings, personas) | "Review PRs in the tictactoe project" |
| **All projects** | Agent runs once per project, sequentially | "Nightly audit across all projects" |
| **No project** | Agent runs without project context (global persona only) | "Check for dependency updates" |

When "All projects" is selected, the scheduler creates one execution per project, running them sequentially (respecting concurrency limits). Each execution gets that project's context.

---

## 4. Schedule Management

### Schedule list (in Persona Manager)

Each schedule card shows:
- **Name** and **frequency** (human-readable)
- **Project scope** (specific project name or "All projects")
- **Prompt** (truncated to 2 lines, expandable)
- **Next run** time with countdown ("in 4 hours")
- **Last run** time with status indicator:
  - Green check: success
  - Red X: failed (click to view execution)
  - Yellow clock: running
  - Gray dash: never run
- **Controls:**
  - Toggle switch: enable/disable (no delete, non-destructive)
  - "Run Now" button: immediately trigger the schedule (outside its normal cadence)
  - Edit: opens the schedule editor
  - Delete: confirmation dialog, then remove

### Create/edit schedule dialog

```
┌─ New Schedule ────────────────────────────────────────────┐
│                                                            │
│  Name: [Nightly PR Review                    ]             │
│                                                            │
│  Persona: [Code Reviewer ▼]                                │
│                                                            │
│  Project: [tictactoe ▼]  (or "All projects" / "None")     │
│                                                            │
│  ── When ──                                                │
│  ● Every day at [09:00 ▼]                                  │
│  ○ Custom cron: [          ]                               │
│  Timezone: [America/Los_Angeles (PDT) ▼]                   │
│                                                            │
│  ── What ──                                                │
│  Prompt:                                                   │
│  ┌──────────────────────────────────────────────┐          │
│  │ Review all open PRs in {{project.name}} that │          │
│  │ were opened or updated since                 │          │
│  │ {{schedule.lastRunAt}}. For each PR, check   │          │
│  │ code quality, test coverage, and security.   │          │
│  └──────────────────────────────────────────────┘          │
│  Insert variable: [{{date}} ▼]                             │
│                                                            │
│  ── Options ──                                             │
│  ☑ Catch up missed runs (if app was offline)              │
│  ☐ Skip if previous run is still in progress              │
│                                                            │
│  [Cancel]                              [Save Schedule]     │
└────────────────────────────────────────────────────────────┘
```

### "Run Now" behavior

When the user clicks "Run Now":
1. The schedule's prompt is executed immediately with the configured persona and project
2. The run is marked as manual in the execution record (`trigger: "manual"` vs `trigger: "scheduled"`)
3. The schedule's `lastRunAt` is NOT updated (it still reflects the last scheduled run)
4. A separate `lastManualRunAt` tracks manual triggers if needed
5. The next scheduled run is unaffected

---

## 5. How Scheduled Runs Appear in the System

### Two models

| Model | Behavior | Pros | Cons |
|---|---|---|---|
| **A: Create work items** | Each scheduled run creates a temporary work item, then executes via normal workflow | Full workflow integration, visible in Work Items | Clutter — dozens of auto-created items |
| **B: Standalone executions** | Scheduled runs create executions directly, visible in Agent Monitor | Clean, no work item clutter | Bypass workflow system, no state transitions |

**Recommendation: Model B (standalone executions)** for Phase 1, with optional work item creation in Phase 2.

### Standalone execution flow

```
Schedule fires → Creates execution record → Spawns persona with prompt
                                          → Streams events to Agent Monitor
                                          → On complete: updates schedule lastRunAt/lastRunOutcome
```

The execution record has a `scheduleId` FK linking it back to the schedule that triggered it:

```sql
-- Extension to executions table
ALTER TABLE executions ADD COLUMN schedule_id TEXT REFERENCES schedules(id);
ALTER TABLE executions ADD COLUMN trigger_type TEXT NOT NULL DEFAULT 'workflow';
  -- "workflow" (normal dispatch), "scheduled" (cron), "manual" (user action), "chat" (Pico/chat)
```

### Agent Monitor integration

Scheduled executions appear in the Agent Monitor alongside workflow-triggered ones, with a visual indicator:

```
┌─ Agent Monitor ──────────────────────────────────────────┐
│                                                           │
│  ● Running: Code Reviewer — "Review PRs"     📅 Scheduled│
│    Started: 2 min ago | Cost: $0.12                      │
│                                                           │
│  ✓ Complete: Engineer — "Fix auth bug"       🔄 Workflow │
│    Duration: 4m 32s | Cost: $0.45                        │
│                                                           │
│  ✓ Complete: Code Reviewer — "Nightly review" 📅 Scheduled│
│    Duration: 8m 15s | Cost: $0.67                        │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

The calendar icon (or "Scheduled" badge) distinguishes scheduled from workflow-triggered runs.

### Activity Feed integration

Scheduled runs appear in the Activity Feed as events:

```
📅 9:00 AM — Scheduled run: "Nightly PR Review" started (Code Reviewer)
✓  9:08 AM — Scheduled run: "Nightly PR Review" completed — 3 PRs reviewed, 1 issue filed
📅 9:00 AM — Scheduled run: "Security Audit" started (Security Scanner)
✗  9:02 AM — Scheduled run: "Security Audit" failed — API rate limit exceeded
```

### Dashboard integration

The Dashboard's "Active Agents" strip includes scheduled runs. The cost summary includes scheduled execution costs. A new "Upcoming Schedules" widget shows the next 3-5 scheduled runs across all personas:

```
┌─ Upcoming Scheduled Runs ─────────────────┐
│  📅 In 4h — Code Reviewer: Nightly review │
│  📅 Tomorrow — Bug Triager: Weekly triage  │
│  📅 Mon — Documentation: API docs update   │
└────────────────────────────────────────────┘
```

---

## 6. Schedule Execution History

### Per-schedule history view

Accessible from the schedule card's "History" link:

```
┌─ Nightly PR Review — History ────────────────────────────┐
│                                                           │
│  Date          Status    Duration  Cost    Details        │
│  ──────────────────────────────────────────────────────── │
│  Apr 2, 9:00   ✓ Success  8m 15s   $0.67  [View]        │
│  Apr 1, 9:00   ✓ Success  6m 42s   $0.52  [View]        │
│  Mar 31, 9:00  ✗ Failed   0m 45s   $0.03  [View]        │
│  Mar 30, 9:00  ✓ Success  7m 30s   $0.61  [View]        │
│  Mar 29, 9:00  ⊘ Skipped  —        —      Offline       │
│                                                           │
│  ── Summary (last 30 days) ──                            │
│  Runs: 28/30 (2 skipped)                                 │
│  Success rate: 96.4%                                     │
│  Avg duration: 7m 12s                                    │
│  Total cost: $17.45                                      │
└───────────────────────────────────────────────────────────┘
```

"View" opens the execution in Agent Monitor, showing the full agent output for that run.

---

## 7. Notification Integration

Scheduled runs integrate with the notification system (RES.NOTIFY.*):

| Event | Priority | Notification |
|---|---|---|
| Scheduled run failed | **High** | Persistent + toast: "Scheduled run 'Nightly Review' failed — [View]" |
| Scheduled run completed with issues | **Low** | Toast only: "Nightly Review found 2 issues" |
| Scheduled run completed successfully | **Info** | Activity feed only (no toast — too noisy for recurring) |
| Schedule disabled (10 consecutive failures) | **Critical** | Persistent + toast: "Schedule 'Nightly Review' auto-disabled" |
| Missed run (app was offline) | **Low** | Toast on next startup: "Missed 2 scheduled runs while offline" |

Key difference from workflow notifications: successful scheduled runs are **silent** (Activity Feed only). Scheduled runs are expected — only failures need attention.

---

## 8. Implementation Phases

### Phase 1: Per-persona scheduling with presets

- "Schedules" tab in Persona Manager
- Preset frequency selector (daily, weekly, hourly, etc.)
- Schedule CRUD (create, edit, enable/disable, delete)
- Standalone execution model (no work item creation)
- `scheduleId` and `trigger_type` columns on executions
- Agent Monitor and Activity Feed show scheduled runs with badge
- "Run Now" button
- Notification on failure only

**Why first:** Covers the core use case (recurring persona tasks) with minimal UI surface. Per-persona scheduling is the most intuitive entry point.

### Phase 2: Project-level schedule management

- Settings > Automation page showing all project schedules
- Custom cron expression input with preview
- Timezone override per schedule
- Template variables in prompts
- "All projects" scope option
- Schedule execution history view
- Dashboard "Upcoming Schedules" widget

**Why second:** Once users have schedules, they need a central view to manage them across personas. Cron expressions and variables are power-user features.

### Phase 3: Dedicated Schedules page

- `/schedules` route added to sidebar
- Calendar view showing when agents are scheduled
- Drag-to-reschedule (calendar interaction)
- Schedule grouping and tagging
- Auto-disable after N consecutive failures
- Catch-up logic for missed runs

**Why last:** Full scheduling page is valuable but not essential until scheduling is heavily used.

---

## 9. Relationship to Other Research

| Topic | Relationship |
|---|---|
| RES.SCHED.INFRA | Backend implementation of the scheduling engine — this doc covers UX, that doc covers cron libraries, missed runs, concurrency |
| RES.PROMPTS.VARS | Template variables in schedule prompts (`{{date}}`, `{{schedule.lastRunAt}}`, etc.) |
| RES.NOTIFY.UX | Notifications for schedule failures, auto-disable events, missed runs |
| RES.ANALYTICS.METRICS | Schedule metrics: success rate, average cost per run, execution count by schedule |
| RES.COLLAB.COORD | Scheduled runs respect concurrency limits — ties into parallel execution coordination |
| RES.WEBHOOKS.INBOUND | Inbound webhooks are external triggers; schedules are time-based triggers — both create executions outside the normal workflow path |

---

## 10. Design Decisions

### Schedules live in Persona Manager, not a separate page (Phase 1)

A schedule is fundamentally "run this persona on a timer." Putting it in the Persona Manager makes the relationship clear and avoids a new top-level nav item for a feature that may not be used by all users. The Settings > Automation view provides a cross-persona overview.

### Standalone executions, not work items (Phase 1)

Creating work items for every scheduled run would clutter the Work Items list with dozens of auto-generated items. Standalone executions keep the Work Items list clean while still being visible in Agent Monitor and Activity Feed. Phase 2 can add optional work item creation for schedules that need workflow integration.

### Presets over raw cron (default)

Most users don't know cron syntax. Presets cover 90%+ of scheduling needs. Raw cron is available as an advanced option for power users, with a live preview to catch mistakes.

### Successful scheduled runs are silent

Unlike workflow completions (which a user is actively waiting for), scheduled runs are expected background tasks. Notifying on every success would cause notification fatigue. Only failures and issues deserve attention.

### "Run Now" doesn't affect the schedule cadence

Manual triggers are separate from the schedule. This prevents confusion: if a daily 9 AM schedule is manually triggered at 3 PM, the next run is still tomorrow at 9 AM, not 24 hours from now.
