# Custom Workflows — Edge Cases & Lifecycle Management

Research into edge cases, lifecycle operations, and safety concerns for user-defined custom workflows.

**Current state:** Workflows are hardcoded in `packages/shared/src/workflow.ts` as a global constant (`WORKFLOW`). 8 fixed states (Backlog → Done), fixed transitions, no per-project customization beyond persona assignments and auto-routing toggle. Custom workflows would allow users to define their own states, transitions, and routing rules.

---

## 1. Deleting a Workflow with Active Work Items

### The problem

A workflow defines the state machine that work items move through. If a user deletes a workflow, what happens to work items currently in states that no longer exist?

### Options

| Approach | Behavior | Risk |
|----------|----------|------|
| **Block deletion** | Refuse to delete if any work item references this workflow. User must migrate or delete items first. | Safe but frustrating — user can't clean up stale workflows without migrating every item. |
| **Archive-only** | Mark workflow as `archived`. Hide from UI pickers but keep the state definitions readable. Items remain valid but can't transition further. | Low risk. Stale items are frozen but visible. No data loss. |
| **Force-migrate** | Prompt user to select a target workflow. Map old states to new states (user-guided mapping). Bulk-update all items. | Most user-friendly but complex. Mapping between different state machines may not be 1:1. |
| **Soft delete + grace period** | Mark as deleted, items become "orphaned" with a warning badge. After 30 days, cascade delete or force-archive items. | Gives user time to react. But orphaned items in a broken state machine are confusing. |

### Recommendation: Archive-only with optional migration

1. **Default action: archive.** Workflow is hidden from creation/selection UIs but retains its state definitions.
2. Items in archived workflows show a warning: "This workflow has been archived — items cannot transition."
3. **Optional migration wizard** (available when archiving or later):
   - Shows all items in the archived workflow, grouped by state
   - User selects a target workflow and maps each old state → new state
   - Bulk-updates items with a single confirmation
   - Logs a system comment on each migrated item: "Migrated from [old workflow] state [old state] → [new workflow] state [new state]"
4. **Hard delete** only available on archived workflows with zero items remaining.

### Active executions during deletion

If an agent is mid-execution on a work item in the workflow being deleted/archived:
- **Do not interrupt the execution.** Let it finish.
- Block the archive action if active executions exist. Show: "Cannot archive — N active executions. Wait for them to finish or cancel them first."
- Alternative: archive immediately but let in-flight executions complete. The next router call will see the archived state and skip auto-routing.

---

## 2. Cloning / Templating

### Use cases

- "I want a workflow like the default one but with an extra QA step"
- "I built a good workflow for project A, I want the same thing for project B"
- "I want to try modifying this workflow without breaking the live one"

### Design

**Clone workflow:**
- New entry in workflows table with `name: "Copy of [original]"`, `projectId: null` (global) or same project
- Deep-copies: states array, transitions map, state colors/descriptions
- Does NOT copy: persona assignments (those are per-project, user must configure)
- Does NOT copy: work items (clone is a blank workflow definition)

**Built-in starter templates:**
Ship a set of read-only template workflows:

| Template | States | Use case |
|----------|--------|----------|
| Default Linear | Backlog → Planning → Ready → In Progress → In Review → Done | Current hardcoded workflow |
| Simple Kanban | To Do → In Progress → Done | Quick projects without planning phase |
| Code Review Pipeline | Draft → Review → Revise → Approved → Merged | PR-focused workflow |
| Documentation Pipeline | Outline → Draft → Review → Published | Doc-focused workflow |
| Bug Triage | Reported → Triaged → In Progress → Verified → Closed | Bug tracking |

Templates are read-only — users clone them to customize.

**UI flow:**
1. Settings > Workflow > "New Workflow" button opens a dialog
2. Options: "Blank workflow" or "Clone from template" (dropdown of templates + existing workflows)
3. Opens the workflow designer with the cloned definition, user can edit states/transitions

---

## 3. Import / Export

### Use cases

- Share workflow definitions between Woof instances
- Version control workflow definitions (store in git alongside code)
- Backup/restore workflows

### Format: JSON

```json
{
  "version": 1,
  "name": "Code Review Pipeline",
  "description": "PR-focused workflow with review and revision cycles",
  "states": [
    { "name": "Draft", "color": "#6b7280", "description": "Initial draft" },
    { "name": "Review", "color": "#3b82f6", "description": "Under review" },
    { "name": "Revise", "color": "#f59e0b", "description": "Changes requested" },
    { "name": "Approved", "color": "#10b981", "description": "Approved, ready to merge" },
    { "name": "Merged", "color": "#8b5cf6", "description": "Merged and complete", "isFinal": true }
  ],
  "transitions": {
    "Draft": ["Review"],
    "Review": ["Approved", "Revise"],
    "Revise": ["Review"],
    "Approved": ["Merged"]
  },
  "initialState": "Draft"
}
```

### Export

- Settings > Workflow > select workflow > "Export" button
- Downloads a `.woof-workflow.json` file
- Excludes: persona assignments, project bindings, work item data (these are instance-specific)

### Import

- Settings > Workflow > "Import" button > file picker
- Validates JSON structure and state machine integrity (no orphan states, initial state exists, all transition targets exist)
- Creates a new workflow — does NOT overwrite any existing workflow
- Name collision: append " (imported)" suffix
- User reviews the imported workflow in the designer before activating it

### Potential issues

- **Forward/backward compatibility:** The `version` field allows schema evolution. Old exports on new versions should still parse (with defaults for new fields).
- **State name conflicts:** If importing into a project that already has a workflow with similarly-named states, the import is independent — each workflow has its own namespace.
- **No persona mappings in export:** Persona assignments are instance-specific. After importing, the user must configure persona assignments.

---

## 4. Permissions

### Current state

No RBAC exists. Any user (in a local-first single-user app) can do anything. However, custom workflows introduce structures that benefit from permission controls, especially if the app eventually supports multiple users.

### Proposed permission model

| Action | Permission level | Rationale |
|--------|-----------------|-----------|
| View workflow definition | All users | Everyone needs to understand the state machine |
| Edit workflow states/transitions | Workflow owner or admin | Prevents accidental breakage of active pipelines |
| Delete/archive workflow | Workflow owner or admin | Destructive action |
| Assign personas to states | Project admin | Affects execution behavior for all items in the project |
| Transition work items | All users (respecting workflow rules) | Day-to-day operation |
| Override invalid transition | Admin only | Escape hatch for stuck items |

### Locking / Publishing

A workflow can be in one of two modes:

| Mode | Behavior |
|------|----------|
| **Draft** | Editable. Can add/remove/rename states and transitions. Cannot be assigned to a project. |
| **Published** | Locked. States and transitions are frozen. Can be assigned to projects. Can be cloned to create a new draft. |

**Why:** Editing a workflow that has active work items in it is dangerous — renaming a state could orphan items, removing a transition could strand them. Publishing locks the definition while still allowing persona assignment changes.

**Unpublishing:** Only if no work items are currently using this workflow. Otherwise, clone-and-modify is the safe path.

### Single-user simplification

For the current local-first model, permissions can be simplified:
- No RBAC enforcement (single user)
- Draft/Published toggle is the primary safety mechanism
- "Are you sure?" confirmation for editing a published workflow with active items

---

## 5. Interaction with Global Agents

### Current state

Personas can be global (no project binding) or project-scoped. The execution manager always requires a `projectId` to dispatch.

### Where do work items live for global agents?

If a global agent runs a workflow, the work items must still belong to a project (DB constraint: `workItems.projectId` is NOT NULL). Options:

| Approach | Behavior | Tradeoff |
|----------|----------|----------|
| **Require project context** | Global agents can only run workflows within an explicit project scope. The user selects a project when creating a work item, even if using a global agent. | Simple. No schema changes. But limits "project-less" use cases. |
| **Auto-create ephemeral project** | If a global agent spawns work without a project, create a temporary project (e.g., "Untitled — 2026-04-02"). Items live there. | Works but creates clutter. Naming/cleanup is messy. |
| **Allow null project** | Make `projectId` nullable. Global work items exist outside any project. Dashboard shows them in a "Global" section. | Most flexible but largest schema change. Breaks many queries that assume non-null projectId. |

### Recommendation: Require project context

Global agents are about reusable prompt/tool configurations, not about operating outside projects. A global "Code Reviewer" persona should still run within a specific project's codebase. The project provides:
- Working directory (`project.path`)
- Persona assignments (which persona handles which state)
- Auto-routing configuration
- Project memories

Making work items project-less would require rethinking sandbox rules, file access, and context injection — significant effort with limited benefit for the current use case.

---

## 6. Testing Custom Workflows

### The problem

A user designs a new workflow with custom states and transitions. How do they verify it works correctly before routing real work items through it?

### Options

| Approach | Description | Complexity |
|----------|-------------|------------|
| **Dry-run mode** | "Simulate" a work item flowing through the workflow. Show the transitions it would take based on routing rules, without executing agents. | Medium. Requires a simulation engine that mimics router decisions. |
| **Test project** | Create a dedicated test project, assign the new workflow, create test items, run agents, observe. User-driven manual testing. | Low. Uses existing infrastructure. Relies on user diligence. |
| **Sandbox execution** | Run agents in a sandboxed environment (separate directory, no git commits, limited tools). Real agent execution but contained blast radius. | High. Requires execution environment isolation beyond current sandbox. |
| **Workflow validator** | Static analysis: check for unreachable states, dead-end states (non-final with no outbound transitions), missing initial state, disconnected subgraphs. No runtime execution needed. | Low. Pure graph analysis. Catches structural bugs but not behavioral ones. |

### Recommendation: Validator + Test project

**Phase 1: Static validator (built into the workflow designer)**
- Run on every edit. Show warnings inline:
  - Unreachable states (no inbound transitions and not the initial state)
  - Dead-end states (non-final states with no outbound transitions)
  - Missing initial state
  - Missing final state (no state marked as terminal)
  - Disconnected subgraphs
  - Self-transitions (state → same state)
- Block publishing if critical errors exist (unreachable, dead-end, no initial/final)

**Phase 2: Test project approach**
- "Test this workflow" button in the designer
- Creates a temporary project with the draft workflow assigned
- Pre-populates with 2-3 sample work items in different states
- User can trigger transitions and observe routing behavior
- Cleanup: "Delete test project" button removes all test data

**Phase 3 (future): Dry-run simulation**
- Given a work item description, simulate the full path through the workflow
- Show predicted state transitions, which persona would run at each step, estimated cost
- Does not execute agents — uses router persona's logic with a "predict only" flag

---

## 7. Agent Chat Interaction with Workflow Execution

### Can a user chat with an agent mid-workflow and influence routing?

This is the intersection of RES.CHAT.* and custom workflows. Scenarios:

**Scenario A: User overrides routing via chat**
User is watching an agent execute on a work item. Via chat, they say "Skip the review step and mark this as Done." 

- **Current behavior:** Not possible. Chat (Pico) and execution are separate. Pico can't modify work item state.
- **With chat integration:** The agent chat could expose a `transition_state` tool to the user's chat persona. This is dangerous — it bypasses the workflow's transition rules.
- **Recommendation:** Allow chat to *suggest* transitions (show a button: "Move to Done?") but validate against the workflow's allowed transitions. Block invalid transitions even from chat. Log the override as a system comment.

**Scenario B: User provides context mid-execution**
Agent is reviewing code. User chats: "Focus on the auth module, ignore the test files."

- **Current behavior:** Not possible. Execution and chat don't share context.
- **With V2 sessions:** If both execution and chat use the same SDK session, the user's message would appear in the agent's conversation. This blurs the line between autonomous execution and interactive chat.
- **Recommendation:** Keep execution and chat separate but allow a "send note to agent" action that injects a user message into the next execution turn. The agent sees it as additional context, not a conversation.

**Scenario C: Agent asks for clarification during workflow**
Agent encounters ambiguity and wants to ask the user before proceeding.

- **Current behavior:** Agent can create a proposal (via MCP tool) that the user approves/rejects.
- **With chat:** Agent could send a chat message and wait for a response. This requires the execution to pause, which the SDK supports via human-in-the-loop patterns.
- **Recommendation:** Use the existing proposal system for workflow decisions. Reserve chat for non-blocking informational exchanges. Don't block workflow execution waiting for a chat response — that creates bottlenecks.

---

## 8. Summary of Recommendations

| Edge case | Recommendation | Priority |
|-----------|---------------|----------|
| Workflow deletion | Archive-only with optional migration wizard | High — needed before custom workflows ship |
| Cloning | Clone button + built-in starter templates | High — essential for UX |
| Import/export | JSON format, validate on import | Medium — nice-to-have for collaboration |
| Permissions | Draft/Published toggle (no RBAC for single-user) | High — safety mechanism |
| Global agents | Require project context (no project-less items) | Low — current design is correct |
| Testing | Static validator + test project approach | High — prevents broken workflows |
| Chat interaction | Keep separate; proposals for decisions, notes for context | Medium — depends on RES.CHAT.* progress |
