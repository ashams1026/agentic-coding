# Proposal: Workflow Builder UX

**Task:** RES.WORKFLOW.BUILDER
**Date:** 2026-04-02
**Depends on:** RES.WORKFLOW.DATA (data model — approved)
**Related:** RES.WORKFLOW.RUNTIME (runtime), RES.WORKFLOW.EDGE (edge cases)

## Problem

Users need to create and edit workflows — define states, assign personas, and configure transitions between states. The current system has no UI for this; the workflow is hardcoded. The builder must support both simple linear pipelines and complex branching/looping flows, while preventing users from creating invalid state machines.

## Current State

### Existing Visual Components

**Flow view** (`features/work-items/flow-view.tsx`):
- Custom vertical pipeline visualization (no graph library — hand-built with CSS)
- Renders `WORKFLOW.states` as cards in a vertical column, connected by arrows and "Router" pills
- Shows work item counts, active agents, and assigned personas per state
- Read-only — no editing, no drag-and-drop, no node repositioning

**Workflow config** (`features/settings/workflow-config-section.tsx`):
- Auto-routing toggle (play/pause)
- Persona assignment dropdowns per state (from hardcoded `WORKFLOW.states`)
- Read-only state list — can only change which persona is assigned, not add/remove/reorder states

**No graph library** in `package.json` — no React Flow, dagre, elkjs, or similar.

### What the Builder Needs to Do

1. Create new workflows with custom states
2. Add/remove/rename states
3. Define transitions between states (edges)
4. Assign personas to states
5. Set state types (initial, intermediate, terminal)
6. Validate the state machine (no orphans, exactly one initial state, etc.)
7. Publish workflows (per versioning model in RES.WORKFLOW.DATA)

## Investigation

### 1. Visual Node/Edge Editor vs Form-Based List vs Hybrid

**Option A: Visual node/edge editor** (e.g., React Flow)
- Canvas with draggable state nodes and connectable edges
- Users visually construct the graph by drawing connections
- Familiar pattern from tools like Figma's prototyping mode, n8n, Retool workflows
- **Pros:** Intuitive for complex branching, visual validation of the graph structure
- **Cons:** Requires a graph library (React Flow, ~50KB gzipped), higher implementation effort, harder to use on small screens/mobile

**Option B: Form-based step list**
- Ordered list of states with inline configuration (name, persona, color)
- Transitions defined as dropdowns: "After this step: [next step ▼]"
- **Pros:** Simple, works on any screen size, low implementation effort
- **Cons:** Hard to visualize branching, loops, and complex flows. Linear-only.

**Option C: Hybrid — list + visual preview** (Recommended)
- Primary editor is a form-based list of states (left panel)
- Right panel shows a live visual preview of the graph (read-only, auto-laid-out)
- Transitions are configured in the list: each state has an "Outgoing transitions" section with target state dropdowns
- The visual preview updates in real-time as the user adds/removes states and transitions
- For Phase 2: the preview becomes interactive (drag to reposition, click nodes to select/edit)

**Verdict: Option C (Hybrid)** — gets the benefits of visual feedback without the complexity of a full graph editor. The form-based list is the primary interaction model, which is simpler and more accessible. The visual preview is built with the existing hand-built CSS approach (similar to flow-view.tsx) for Phase 1, potentially upgraded to React Flow for Phase 2.

### Builder Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Workflow Builder — "Code Review Pipeline" (Draft v3)   [Publish]│
├────────────────────────────┬─────────────────────────────────────┤
│  States                    │  Preview                            │
│  ─────────                 │                                     │
│  ┌──────────────────────┐  │    ┌─────────┐                     │
│  │ 1. Backlog ●         │  │    │ Backlog  │ (initial)          │
│  │    Type: Initial      │  │    └────┬────┘                     │
│  │    Persona: —         │  │         │                          │
│  │    → Planning         │  │    ┌────▼────┐                     │
│  └──────────────────────┘  │    │ Planning │ ← PM               │
│  ┌──────────────────────┐  │    └──┬────┬──┘                     │
│  │ 2. Planning ●        │  │       │    │                        │
│  │    Type: Intermediate │  │  ┌────▼──┐ └────▼─────┐            │
│  │    Persona: PM        │  │  │ Ready │   │Blocked │            │
│  │    → Ready, Blocked   │  │  └───┬──┘   └─────────┘            │
│  └──────────────────────┘  │      │                              │
│  ┌──────────────────────┐  │  ┌───▼────────┐                     │
│  │ 3. Ready ●           │  │  │In Progress │ ← Engineer         │
│  │    Type: Intermediate │  │  └───┬────────┘                     │
│  │    Persona: —         │  │      │                              │
│  │    → In Progress      │  │  ┌───▼──────┐                      │
│  └──────────────────────┘  │  │In Review  │ ← Code Reviewer     │
│  ...                       │  └───┬───────┘                      │
│                            │      │                              │
│  [+ Add State]             │  ┌───▼──┐                           │
│                            │  │ Done │ (terminal)               │
│  ─────────                 │  └──────┘                           │
│  Validation                │                                     │
│  ✓ Exactly 1 initial state │                                     │
│  ✓ At least 1 terminal     │                                     │
│  ✓ All states reachable    │                                     │
│  ✗ "Blocked" has no        │                                     │
│    outgoing transitions    │                                     │
├────────────────────────────┴─────────────────────────────────────┤
│  [Save Draft]                                         [Publish]  │
└──────────────────────────────────────────────────────────────────┘
```

### 2. Adding a Step

**Interaction flow:**

1. User clicks **[+ Add State]** button at the bottom of the state list.
2. A new state card appears with default values:
   - Name: "New State" (editable inline, auto-focused)
   - Type: "Intermediate" (dropdown: Initial / Intermediate / Terminal)
   - Color: next available color from a preset palette
   - Persona: "None" (dropdown showing all personas)
   - Outgoing transitions: empty
3. User names the state, assigns a persona, and defines transitions.
4. The visual preview updates in real-time.

**Transition definition:**

Each state card has an "Outgoing transitions" section:

```
┌──────────────────────────────────────┐
│ 3. In Progress                       │
│    Type: Intermediate                │
│    Persona: [Engineer ▼]             │
│    Color: [■ #d97706]                │
│                                      │
│    Transitions:                      │
│    ┌──────────────────────────┐      │
│    │ → [In Review ▼] "approve"│ [×]  │
│    │ → [Blocked ▼]   "block"  │ [×]  │
│    └──────────────────────────┘      │
│    [+ Add transition]                │
└──────────────────────────────────────┘
```

- Each transition row has: target state (dropdown), label (text input), and a remove button.
- The target state dropdown excludes the current state (no self-loops) and shows all other states in the workflow.
- Labels default to empty but common presets appear as suggestions: "approve", "reject", "escalate", "block", "auto".

### 3. Deleting a Step

**When the user clicks delete on a state:**

1. **Check for active work items** in this state:
   - If work items exist → show confirmation dialog: "3 work items are currently in 'In Review'. Deleting this state will move them to: [select fallback state ▼]. This action cannot be undone."
   - If no work items → standard confirmation: "Delete state 'In Review'? All transitions to and from this state will be removed."

2. **Cascade transitions:** All transitions referencing this state (both incoming and outgoing) are automatically removed. The affected states' transition lists update immediately.

3. **Validation runs** after deletion. If the removal creates orphan states or removes the only initial/terminal state, validation warnings appear.

**Alternative considered: Block deletion until transitions are manually removed.**
- Rejected — too tedious for a common operation. Auto-cascade with confirmation is more user-friendly.

**Handling the initial state:** Cannot delete the initial state while other states exist. The user must first reassign the "Initial" type to another state. Error message: "Cannot delete the initial state. Change another state to 'Initial' first."

### 4. Reordering Steps

**The visual layout does NOT imply execution order.** Transitions are the only structure.

However, the **list order** in the left panel affects:
- The default sort order in the Work Items flow view
- The `sort_order` column in `workflow_states` (per RES.WORKFLOW.DATA)
- The visual preview layout (auto-layout uses sort order as a hint for vertical position)

**Reordering interaction:**
- Drag handle on each state card (grip icon on the left)
- Drag-and-drop reorders the list
- Visual preview re-lays out after reorder

**Important:** Reordering does NOT change transitions. If state A transitions to state C and the user reorders C above A in the list, the transition is unchanged — only the visual representation shifts.

### 5. Edge Cases and Validation

The builder runs continuous validation and shows results in a panel below the state list.

**Validation rules:**

| Rule | Severity | Message |
|---|---|---|
| Exactly 1 initial state | Error | "Workflow must have exactly one initial state" |
| At least 1 terminal state | Error | "Workflow must have at least one terminal state (where work items complete)" |
| All states reachable from initial | Warning | "State 'X' is unreachable — no path from the initial state" |
| No dead-end intermediate states | Warning | "State 'X' has no outgoing transitions and is not a terminal state" |
| Terminal states have no outgoing transitions | Info | "Terminal state 'Done' has outgoing transitions — these will never be used" |
| Initial state has no incoming transitions | Info | "Initial state 'Backlog' has incoming transitions — items can be sent back to start" |
| Circular transitions | OK | Allowed — loops like A → B → A are valid (rejection cycles) |
| Duplicate transition | Error | "Duplicate transition from 'In Review' to 'In Progress' — remove one" |

**Circular transitions (A → B → A)** are explicitly allowed. This is how rejection cycles work: "In Progress" → "In Review" → "In Progress" (reject back). The router handles loop detection at runtime (see `router.ts` — it already has anti-loop logic using recent transition history).

**Orphan state detection:** Uses BFS from the initial state. Any state not visited is flagged as unreachable.

**Validation timing:** Runs on every change (add/remove state, add/remove transition, change type). Results update in real-time. Errors block publishing; warnings and info are advisory.

### 6. The Router Concept

**Question:** Does each workflow get its own router persona, or is routing logic declarative?

**Recommendation: Shared router with workflow-aware prompt** (Phase 1)

- The built-in Router persona is shared across all workflows.
- When the router runs, its system prompt is dynamically built from the **workflow's states and transitions** (this is already proposed in RES.WORKFLOW.DATA).
- The router prompt includes:
  - Available states and their descriptions
  - Valid transitions from the current state (with labels)
  - Recent transition history (anti-loop context, already implemented in `router.ts`)

```
Router prompt (dynamic):

"You are routing work items through the 'Code Review Pipeline' workflow.

Available states:
- Backlog (initial): Where new items land
- Implementation (intermediate, assigned to: Engineer): Active development
- Code Review (intermediate, assigned to: Code Reviewer): Review of changes
- QA (intermediate, assigned to: QA Engineer): Testing
- Done (terminal): Complete

From the current state 'Code Review', valid transitions:
- → Implementation (label: 'reject') — send back for changes
- → QA (label: 'approve') — forward to testing
- → Blocked (label: 'block') — flag as stuck

Recent transitions for this item:
- Implementation → Code Review
- Backlog → Implementation

Use route_to_state to transition the item."
```

**Phase 2: Declarative routing conditions**

Transition `condition` field (from RES.WORKFLOW.DATA) can encode rules:
- `{ "outcome": "approved" }` — auto-route if execution outcome matches
- `{ "childTasksComplete": true }` — auto-route when all children are done
- `null` — router decides (fallback to AI routing)

This eliminates the need for a separate router execution in many cases — the system can auto-route based on the condition without invoking an LLM.

**Per-workflow router personas (Phase 2+):**
- A workflow could optionally specify a custom router persona with a specialized prompt (e.g., a legal-review workflow with routing rules specific to compliance steps).
- Stored as `router_persona_id` on the `workflows` table.
- Falls back to the built-in Router if not specified.

## Interaction Flows

### Flow 1: Creating a New Workflow

```
1. User navigates to Settings > Workflows (or a new Workflows page)
2. Clicks [+ New Workflow]
3. Modal: "Create Workflow"
   - Name: [________________]
   - Scope: [○ Global  ● Project-scoped]
   - Project: [AgentOps ▼] (only if project-scoped)
   - Start from: [○ Blank  ● Default template]
4. Clicks [Create]
5. Builder opens with:
   - If blank: one "Start" state (initial) and one "Done" state (terminal)
   - If from template: full copy of the Default workflow states/transitions
6. User edits states, assigns personas, configures transitions
7. Clicks [Save Draft] → saves without publishing
8. Clicks [Publish] → validation runs:
   - If errors: block publish, highlight errors
   - If clean: publish, create new draft for future edits
```

### Flow 2: Editing an Existing Workflow

```
1. User navigates to Settings > Workflows
2. Clicks on a workflow → builder opens with the current draft
3. If no draft exists (just published): auto-creates a draft from the published version
4. User makes changes → saves as draft
5. Banner: "You have unpublished changes. [Publish] [Discard draft]"
6. User publishes → new version live, new work items use it
7. Existing in-flight items continue on the old version
```

### Flow 3: Assigning Personas to States

```
1. In the builder, each state card has a "Persona" dropdown
2. Dropdown shows all available personas grouped:
   - "Built-in" — PM, Engineer, Code Reviewer, etc.
   - "Custom" — user-created personas
3. User selects a persona → this sets the workflow-level default
4. Note below: "Projects can override this assignment in Settings > Workflow"
5. If no persona is assigned: state is "manual" — items pause here until 
   a user manually transitions them or a persona is assigned later
```

## Files to Change

**New page/components:**
- `packages/frontend/src/features/workflow-builder/workflow-builder.tsx` — Main builder component (left panel list + right panel preview)
- `packages/frontend/src/features/workflow-builder/state-card.tsx` — Editable state card with name, type, persona, transitions
- `packages/frontend/src/features/workflow-builder/workflow-preview.tsx` — Visual graph preview (auto-laid-out, initially read-only)
- `packages/frontend/src/features/workflow-builder/validation-panel.tsx` — Validation results display
- `packages/frontend/src/features/workflow-builder/create-workflow-dialog.tsx` — New workflow modal

**Settings page:**
- `packages/frontend/src/features/settings/workflow-config-section.tsx` — Replace current hardcoded state list with link to workflow builder. Add workflow list with [Edit] / [+ New] buttons.

**Routing:**
- `packages/frontend/src/router.tsx` — Add `/workflows/:id` route for the builder page

**Hooks:**
- `packages/frontend/src/hooks/use-workflows.ts` — CRUD hooks for workflows, states, transitions (TanStack Query)

**Backend:**
- `packages/backend/src/routes/workflows.ts` — New route file: CRUD for workflows, states, transitions. Publish endpoint. Validation endpoint.

**Shared:**
- `packages/shared/src/workflow.ts` — Export validation logic (reachability check, initial/terminal state rules) so it runs both client-side (real-time feedback) and server-side (publish gate)

## Decision Summary

| Decision | Choice | Rationale |
|---|---|---|
| Editor model | Hybrid: form list + visual preview | Form is accessible and simple; preview gives visual feedback without graph editor complexity |
| Graph library (Phase 1) | None — hand-built CSS like flow-view.tsx | Avoid adding a 50KB dependency for a read-only preview; upgrade to React Flow in Phase 2 if needed |
| Step deletion | Auto-cascade transitions + confirmation dialog | Less tedious than requiring manual transition cleanup; confirmation prevents accidents |
| Transition structure | Transitions are the only ordering; list sort is visual only | Avoids confusion between visual order and execution order |
| Circular transitions | Allowed | Rejection cycles (A → B → A) are a core workflow pattern; router has anti-loop logic |
| Router model | Shared router with workflow-aware dynamic prompt (Phase 1) | Simpler than per-workflow routers; router already reads states dynamically |
| Validation | Real-time, continuous, blocks publish on errors | Prevents invalid workflows from being published; warnings are advisory |
| Starting point | Blank (2 states) or copy of Default template | Blank for power users; template for quick setup |
