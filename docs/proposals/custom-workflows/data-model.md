# Proposal: Data Model for Custom Workflows

**Task:** RES.WORKFLOW.DATA
**Date:** 2026-04-02
**Related:** RES.GLOBAL.DATA (global agents), RES.GLOBAL.UX (global UX), RES.WORKFLOW.BUILDER/RUNTIME/EDGE (sibling proposals)

## Problem

The current workflow is hardcoded in `packages/shared/src/workflow.ts` as a static object with 8 states and a fixed transition map. Persona assignments are stored per-project in the `personaAssignments` table (composite PK: projectId × stateName). Users cannot create, edit, or customize workflows — every project uses the same state machine. Custom workflows require a database-backed state machine representation, versioning for in-flight executions, and a rethink of how personas bind to workflow states.

## Current State

### Hardcoded Workflow (`packages/shared/src/workflow.ts`)

```typescript
export const WORKFLOW = {
  states: [
    { name: "Backlog", color: "#6b7280" },
    { name: "Planning", color: "#7c3aed" },
    { name: "Decomposition", color: "#4f46e5" },
    { name: "Ready", color: "#2563eb" },
    { name: "In Progress", color: "#d97706" },
    { name: "In Review", color: "#ea580c" },
    { name: "Done", color: "#16a34a" },
    { name: "Blocked", color: "#dc2626" },
  ],
  transitions: {
    "Backlog": ["Planning"],
    "Planning": ["Ready", "Blocked"],
    // ...
  },
  initialState: "Backlog",
  finalStates: ["Done"],
};
```

### Persona Assignments (`personaAssignments` table)

```sql
CREATE TABLE persona_assignments (
  project_id TEXT NOT NULL REFERENCES projects(id),
  state_name TEXT NOT NULL,     -- references hardcoded WorkflowStateName
  persona_id TEXT NOT NULL REFERENCES personas(id),
  PRIMARY KEY (project_id, state_name)
);
```

Each project maps workflow states to personas. The composite PK means one persona per state per project. The `stateName` column references the hardcoded `WorkflowStateName` type — there's no FK to a workflows table because none exists.

### Router (`packages/backend/src/agent/router.ts`)

- Uses a hardcoded prompt listing "Available states: Backlog, Planning, Decomposition, Ready, In Progress, In Review, Done, Blocked"
- Calls `executionManager.runExecution(workItemId, routerPersonaId)` to spawn the router agent
- Router uses `route_to_state` MCP tool which calls `isValidTransition(from, to)` — this checks the hardcoded `WORKFLOW.transitions` map

### Dispatch (`packages/backend/src/agent/dispatch.ts`)

- `dispatchForState(workItemId, stateName)` looks up `personaAssignments` to find which persona handles a given state
- Called after `route_to_state` transitions a work item to a new state
- If no persona is assigned to the target state, it's a no-op (e.g., Backlog, Done)

### What Needs to Become Dynamic

| Component | Currently | Dynamic Version |
|---|---|---|
| State definitions | `WORKFLOW.states` array | `workflow_states` table rows |
| Transition map | `WORKFLOW.transitions` object | `workflow_transitions` table rows |
| Initial/final states | `WORKFLOW.initialState`, `WORKFLOW.finalStates` | State type column (`initial`, `intermediate`, `terminal`) |
| Validation | `isValidTransition()` checks hardcoded map | Query `workflow_transitions` for `(workflow_id, from_state_id, to_state_id)` |
| Router prompt | Hardcoded state list | Dynamically built from workflow's states |
| Persona assignments | `personaAssignments` keyed by `stateName` string | FK to `workflow_states.id` instead of raw string |
| Work item state | `currentState: text` (raw string) | FK to `workflow_states.id` or keep string with `workflowId` context |

## Investigation

### 1. Representing a Workflow State Machine in the DB

**Recommended schema:**

#### `workflows` table

```sql
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,              -- WorkflowId (e.g., "wf-x7k2m")
  name TEXT NOT NULL,               -- "Default", "Code Review Pipeline", "Documentation"
  description TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL DEFAULT 'global',  -- 'global' | 'project'
  project_id TEXT REFERENCES projects(id),  -- NULL for global workflows, set for project-scoped
  version INTEGER NOT NULL DEFAULT 1,
  is_published INTEGER NOT NULL DEFAULT 0,  -- 0=draft, 1=published (immutable once published)
  created_at INTEGER NOT NULL,      -- timestamp_ms
  updated_at INTEGER NOT NULL,      -- timestamp_ms
);
```

- **Scope:** Workflows can be global (available to all projects) or project-scoped (only for one project). Global workflows have `projectId = NULL`.
- **Version:** Integer that increments on each publish. Drafts have `isPublished = 0`.
- **Published flag:** Once published, a workflow version is immutable. Edits create a new draft version.

#### `workflow_states` table

```sql
CREATE TABLE workflow_states (
  id TEXT PRIMARY KEY,              -- WorkflowStateId (e.g., "ws-p9f3n")
  workflow_id TEXT NOT NULL REFERENCES workflows(id),
  name TEXT NOT NULL,               -- "Backlog", "In Progress", "Custom Step"
  type TEXT NOT NULL DEFAULT 'intermediate',  -- 'initial' | 'intermediate' | 'terminal'
  color TEXT NOT NULL DEFAULT '#6b7280',
  position_x REAL NOT NULL DEFAULT 0,  -- for visual editor layout
  position_y REAL NOT NULL DEFAULT 0,
  persona_id TEXT REFERENCES personas(id),  -- default persona for this state (optional)
  sort_order INTEGER NOT NULL DEFAULT 0,    -- for list views
  UNIQUE(workflow_id, name)         -- no duplicate state names within a workflow
);
```

- **Type:** `initial` (exactly one per workflow, where new items start), `intermediate` (agent works here), `terminal` (workflow complete — no outgoing transitions). `Blocked` is a special intermediate state.
- **Persona binding:** Each state can have a default persona (`personaId`). This replaces the `personaAssignments` table for workflow-scoped assignments. Project-level overrides are handled separately (see section 5).
- **Position:** For the visual workflow builder (RES.WORKFLOW.BUILDER). Stored here rather than in a separate layout table for simplicity.

#### `workflow_transitions` table

```sql
CREATE TABLE workflow_transitions (
  id TEXT PRIMARY KEY,              -- WorkflowTransitionId
  workflow_id TEXT NOT NULL REFERENCES workflows(id),
  from_state_id TEXT NOT NULL REFERENCES workflow_states(id),
  to_state_id TEXT NOT NULL REFERENCES workflow_states(id),
  label TEXT NOT NULL DEFAULT '',   -- "approve", "reject", "escalate", "auto"
  condition TEXT,                   -- optional: JSON condition expression or NULL (always valid)
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(workflow_id, from_state_id, to_state_id)
);
```

- **Label:** Human-readable transition name shown in the workflow builder and router decisions. Common labels: "approve" (move forward), "reject" (send back), "escalate" (skip to later stage), "auto" (automatic routing).
- **Condition:** Optional JSON expression for conditional transitions. Phase 1: NULL (router decides). Phase 2: declarative conditions like `{ "outcome": "approved" }` or `{ "childTasksComplete": true }`.

### 2. How the Current Hardcoded Workflow Works — What Becomes Dynamic

**Current flow:**

```
Work item created → currentState = "Backlog"
User moves to "Planning" → dispatchForState("Planning")
  → personaAssignments lookup → PM persona assigned → execution spawns
  → PM completes → runRouter(workItemId)
    → Router reads hardcoded states, calls route_to_state("Ready")
      → isValidTransition("Planning", "Ready") → true
      → workItem.currentState = "Ready"
      → dispatchForState("Ready") → cycle continues
```

**Dynamic flow:**

```
Work item created → workflowId = project's workflow, currentState = workflow's initial state
User moves to next state → dispatchForState(workItemId, stateId)
  → workflow_states lookup (by stateId) → persona for this state → execution spawns
  → persona completes → runRouter(workItemId)
    → Router reads workflow's states + transitions dynamically
    → calls route_to_state(targetStateId)
      → query workflow_transitions(workflowId, fromStateId, toStateId) → valid?
      → workItem.currentStateId = targetStateId
      → dispatchForState(workItemId, targetStateId) → cycle continues
```

**Key changes:**

1. **`workItems.currentState`** — changes from a raw string to either:
   - **Option A:** Keep as string but add `workflowId` column. State name is looked up via `workflow_states WHERE workflow_id AND name`.
   - **Option B (Recommended):** Add `workflowId` column, keep `currentState` as string for readability. The string matches `workflow_states.name` within the workflow context. This avoids FK complexity and keeps the DB queryable without joins.

2. **`isValidTransition()`** — currently checks hardcoded map. Dynamic version queries `workflow_transitions WHERE workflow_id = ? AND from_state_id = ? AND to_state_id = ?`.

3. **Router prompt** — currently hardcodes "Available states: Backlog, Planning, ...". Dynamic version: query `workflow_states WHERE workflow_id = ?` and `workflow_transitions WHERE workflow_id = ?`, inject into prompt as structured data.

4. **`route_to_state` MCP tool** — currently validates against `isValidTransition()`. Dynamic version: validate against the work item's workflow's transitions.

5. **`dispatchForState()`** — currently looks up `personaAssignments(projectId, stateName)`. Dynamic version: look up `workflow_states(workflowId, stateName).personaId`, with optional project-level override.

### 3. How Workflow Definitions Relate to Executions

**Current:** Executions reference `workItemId` and `personaId`. The workflow state is implicit — it's whatever `workItem.currentState` was when the execution was created.

**Proposed changes to `executions` table:**

```sql
ALTER TABLE executions ADD COLUMN workflow_id TEXT REFERENCES workflows(id);
ALTER TABLE executions ADD COLUMN workflow_state_name TEXT;  -- state at time of execution
```

- `workflowId` — which workflow was active for this execution. Enables historical queries: "show all executions that ran under workflow v3."
- `workflowStateName` — the state the work item was in when this execution started. Captures the workflow context even if the workflow is later edited.

**Why not FK to `workflow_states`?** Because states can be renamed or deleted in future versions. Storing the state name as a string preserves the historical record.

**Query patterns:**

```sql
-- All executions for a work item, with workflow context
SELECT e.*, e.workflow_state_name as state_name
FROM executions e
WHERE e.work_item_id = ?
ORDER BY e.started_at DESC;

-- All executions in "In Review" state across a workflow
SELECT e.*
FROM executions e
WHERE e.workflow_id = ? AND e.workflow_state_name = 'In Review';
```

### 4. Versioning — What Happens to In-Flight Executions

**Problem:** A user edits a workflow while work items are actively flowing through it. Possible issues:
- A state is deleted that has work items in it
- A transition is removed that an in-flight router would have used
- A persona assignment changes mid-execution

**Recommended approach: Version pinning with snapshot**

1. **Workflows have a `version` integer** that increments on each publish.
2. **Publishing creates an immutable snapshot.** The published workflow's states and transitions cannot be edited. To modify, the user creates a new draft version.
3. **Work items pin to a workflow version.** When a work item enters a workflow, its `workflowId` references the published version.
4. **In-flight items continue on their pinned version.** Even if a new version is published, existing work items use the version they started with.
5. **New items use the latest published version.**

**Schema support:**

```sql
-- Add to work_items table:
ALTER TABLE work_items ADD COLUMN workflow_id TEXT REFERENCES workflows(id);
-- The workflow_id points to the specific published version the item is using

-- Workflow versions are separate rows:
-- wf-abc (version 1, published) ← old items use this
-- wf-abc-v2 (version 2, published) ← new items use this
-- wf-abc-v3 (version 3, draft) ← being edited
```

**Alternative considered: Copy-on-edit**
- Each edit creates a full copy of the workflow (states + transitions) with a new version ID.
- Simpler conceptually but creates a lot of data for frequent edits.
- **Rejected** — too many rows for workflows with 10+ states.

**Recommended alternative: Soft versioning**

Rather than creating full copies, store the version inline:

```sql
-- workflows table already has: version INTEGER
-- When publishing:
--   1. Mark current draft as published (is_published = 1)
--   2. Create a new row for the next draft (version + 1, is_published = 0)
--   3. Copy all states and transitions to the new draft

-- work_items.workflow_id points to the specific version row
```

This means each version is a separate workflow row with its own set of `workflow_states` and `workflow_transitions`. The `workflows` table acts as both the version history and the state machine definition.

**Migration path for edits:**
1. User opens workflow editor → sees the current draft (latest unpublished version)
2. User makes changes → saves as draft
3. User clicks "Publish" → draft becomes published, new draft created
4. Existing work items continue using their pinned version
5. New work items use the newly published version

### 5. How Workflows Relate to Personas

**Current:** `personaAssignments` maps `(projectId, stateName) → personaId`. This is a project-level assignment — each project can assign different personas to the same workflow states.

**With custom workflows, three levels of persona binding:**

#### Level 1: Workflow-level defaults

Each `workflow_states` row has an optional `personaId`. This is the default persona for that state across all projects using this workflow.

```
Workflow: "Code Review Pipeline"
  State: "Implementation" → default persona: "Engineer"
  State: "Code Review" → default persona: "Code Reviewer"
  State: "QA" → default persona: "QA Engineer"
```

#### Level 2: Project-level overrides

Projects can override the default persona for specific states. The `personaAssignments` table evolves:

```sql
-- Updated persona_assignments table
CREATE TABLE persona_assignments (
  project_id TEXT NOT NULL REFERENCES projects(id),
  workflow_state_id TEXT NOT NULL REFERENCES workflow_states(id),
  persona_id TEXT NOT NULL REFERENCES personas(id),
  PRIMARY KEY (project_id, workflow_state_id)
);
```

The composite PK changes from `(projectId, stateName)` to `(projectId, workflowStateId)`. This supports multiple workflows with states that have the same name (e.g., two workflows both have an "In Progress" state).

#### Level 3: Work-item-level overrides (future)

Individual work items could override the persona for their current state. This is a future enhancement — not needed for Phase 1.

**Resolution order:** When dispatching for a state:
1. Check project-level override (`persona_assignments` for this project + state)
2. Fall back to workflow-level default (`workflow_states.persona_id`)
3. If neither → no-op (no persona assigned, state is manual)

### Migration from Current Schema

**What changes:**

```sql
-- 1. Create workflow tables
CREATE TABLE workflows (...);
CREATE TABLE workflow_states (...);
CREATE TABLE workflow_transitions (...);

-- 2. Seed the "Default" workflow from hardcoded WORKFLOW constant
INSERT INTO workflows (id, name, description, scope, version, is_published, ...)
  VALUES ('wf-default', 'Default', 'Standard AgentOps workflow', 'global', 1, 1, ...);

INSERT INTO workflow_states (id, workflow_id, name, type, color, sort_order)
  VALUES 
    ('ws-backlog', 'wf-default', 'Backlog', 'initial', '#6b7280', 0),
    ('ws-planning', 'wf-default', 'Planning', 'intermediate', '#7c3aed', 1),
    ('ws-decomposition', 'wf-default', 'Decomposition', 'intermediate', '#4f46e5', 2),
    ('ws-ready', 'wf-default', 'Ready', 'intermediate', '#2563eb', 3),
    ('ws-inprogress', 'wf-default', 'In Progress', 'intermediate', '#d97706', 4),
    ('ws-inreview', 'wf-default', 'In Review', 'intermediate', '#ea580c', 5),
    ('ws-done', 'wf-default', 'Done', 'terminal', '#16a34a', 6),
    ('ws-blocked', 'wf-default', 'Blocked', 'intermediate', '#dc2626', 7);

INSERT INTO workflow_transitions (id, workflow_id, from_state_id, to_state_id, label)
  VALUES
    ('wt-1', 'wf-default', 'ws-backlog', 'ws-planning', 'auto'),
    ('wt-2', 'wf-default', 'ws-planning', 'ws-ready', 'approve'),
    ('wt-3', 'wf-default', 'ws-planning', 'ws-blocked', 'block'),
    -- ... (all transitions from WORKFLOW.transitions)
    ;

-- 3. Add workflowId to work_items
ALTER TABLE work_items ADD COLUMN workflow_id TEXT REFERENCES workflows(id) DEFAULT 'wf-default';
-- Backfill: all existing items get the default workflow

-- 4. Add workflow context to executions
ALTER TABLE executions ADD COLUMN workflow_id TEXT REFERENCES workflows(id);
ALTER TABLE executions ADD COLUMN workflow_state_name TEXT;
-- Backfill from work item's currentState at execution time (approximation)

-- 5. Migrate persona_assignments
-- Old: (project_id, state_name, persona_id) 
-- New: (project_id, workflow_state_id, persona_id)
-- Migration: look up workflow_states.id by name for the default workflow
ALTER TABLE persona_assignments ADD COLUMN workflow_state_id TEXT REFERENCES workflow_states(id);
UPDATE persona_assignments SET workflow_state_id = (
  SELECT ws.id FROM workflow_states ws 
  WHERE ws.workflow_id = 'wf-default' AND ws.name = persona_assignments.state_name
);
-- Then drop the old state_name column and update the PK
```

**Backwards compatibility:**
- The hardcoded `WORKFLOW` object in `packages/shared/src/workflow.ts` remains as a fallback during migration.
- `isValidTransition()` gains a `workflowId` parameter. If omitted, falls back to the hardcoded map (for code that hasn't been updated yet).
- The "Default" workflow is seeded on first migration, matching the hardcoded states exactly.

## Files to Change

**New tables (schema + migration):**
- `packages/backend/src/db/schema.ts` — Add `workflows`, `workflowStates`, `workflowTransitions` tables with relations
- `packages/backend/src/db/migrations/` — Migration files for new tables + existing table modifications

**Modified tables:**
- `packages/backend/src/db/schema.ts` — Add `workflowId` to `workItems`, add `workflowId` + `workflowStateName` to `executions`, modify `personaAssignments` PK

**Shared types:**
- `packages/shared/src/workflow.ts` — Add dynamic workflow types alongside hardcoded constant. Export `Workflow`, `WorkflowState`, `WorkflowTransition` interfaces. Update `isValidTransition()` to accept optional `workflowId`.
- `packages/shared/src/types.ts` — Add `WorkflowId`, `WorkflowStateId`, `WorkflowTransitionId` branded types

**Backend runtime:**
- `packages/backend/src/agent/router.ts` — Build prompt dynamically from workflow states/transitions
- `packages/backend/src/agent/dispatch.ts` — Look up persona from workflow state + project override
- `packages/backend/src/agent/mcp-server.ts` — `route_to_state` validates against workflow transitions

**Seed data:**
- `packages/backend/src/db/seed.ts` — Seed the "Default" workflow from `WORKFLOW` constant

## Decision Summary

| Decision | Choice | Rationale |
|---|---|---|
| State machine storage | 3 tables: `workflows`, `workflow_states`, `workflow_transitions` | Normalized, queryable, supports visual editor position data |
| State reference in work items | String name + `workflowId` column | Readable, avoids FK complexity, works with versioning |
| Versioning strategy | Soft versioning: each published version is a separate workflow row with its own states/transitions | Balances data efficiency with immutability guarantees |
| In-flight behavior | Work items pin to workflow version at creation | Prevents broken workflows for in-progress items |
| Persona binding | 2-level: workflow defaults + project overrides | Flexible without per-item complexity |
| Migration approach | Seed "Default" workflow from hardcoded constant, backfill all items | Zero-downtime migration, existing behavior preserved |
| Transition conditions | Phase 1: NULL (router decides). Phase 2: declarative JSON | Avoid over-engineering; router already works well |
