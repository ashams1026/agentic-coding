# Templates & Presets System Design

> Research document for **RES.TEMPLATES**. Design only — no implementation tasks.

---

## 1. Current State Audit

### What Exists Today

AgentOps has several forms of "presets" that are hardcoded or seeded, but no user-facing template system:

| Concept | Current Implementation | Customizable? |
|---------|----------------------|---------------|
| **Personas** | 6 built-in personas in `default-personas.ts:17-72` (Product Manager, Tech Lead, Engineer, Code Reviewer, Router, Pico) | Yes — users can edit any persona's fields. Duplicate button exists (`persona-list.tsx:231-234`) that creates a copy with `(copy)` suffix. |
| **Persona assignments** | `DEFAULT_STATE_ASSIGNMENTS` in `default-personas.ts:75-81` — hardcoded mapping of workflow states to persona names | No — auto-applied on project creation (`seedDefaultPersonasForProject()`), not user-configurable |
| **Workflow states** | Implicit from seed data — Planning, Decomposition, Ready, In Progress, In Review | No workflow table in schema — states are strings on work items (`currentState: text`). No workflow template or editor. |
| **Work items** | Created via `POST /api/work-items` with title, description, priority, labels | No templates — every work item starts blank |
| **Projects** | Created with name + path + optional settings | No project templates — each project bootstrapped with the same default personas/assignments |

### Key Insight

The "Duplicate" button on personas (`persona-list.tsx:118-121`) is the closest thing to a template action today. It copies all fields (name, description, model, tools, budget) and lets the user modify them. This pattern could extend to other entities.

---

## 2. Work Item Templates

### The Need

Users repeatedly create similar work items (bug reports, feature requests, research spikes). Each type has a predictable structure but unique details. Templates eliminate boilerplate and enforce consistency.

### Template Definition

```typescript
interface WorkItemTemplate {
  id: string;              // e.g., "tmpl-bug-report"
  name: string;            // "Bug Report"
  description: string;     // "Report a bug with reproduction steps"
  icon: string;            // lucide icon name
  category: "built-in" | "custom";
  
  // Pre-filled fields
  fields: {
    title: string;         // e.g., "Bug: [brief description]"
    description: string;   // Markdown template with placeholders
    priority: Priority;    // Default priority
    labels: string[];      // Default labels, e.g., ["bug"]
    personaId?: PersonaId; // Suggested assignee persona
  };
}
```

### Built-In Templates

| Template | Title Pattern | Description Outline | Default Priority | Labels |
|----------|--------------|--------------------|--------------------|--------|
| **Bug Report** | `Bug: [description]` | Steps to reproduce, expected behavior, actual behavior, environment | p1 | `["bug"]` |
| **Feature Request** | `Feature: [description]` | User story, acceptance criteria, design notes | p2 | `["feature"]` |
| **Research / Spike** | `Spike: [topic]` | Question to answer, time-box, output format, success criteria | p2 | `["research"]` |
| **Documentation** | `Docs: [topic]` | What to document, target audience, output location | p3 | `["docs"]` |
| **Refactor** | `Refactor: [area]` | Current state, desired state, files affected, risk assessment | p2 | `["tech-debt"]` |

### UX: "New from Template"

Two entry points:

1. **Work Items page — "+" button dropdown:**
   ```
   [+ New Work Item ▾]
     ├── Blank
     ├── ──────────
     ├── Bug Report
     ├── Feature Request
     ├── Research / Spike
     ├── Documentation
     ├── Refactor
     ├── ──────────
     └── Manage Templates...
   ```

2. **Command palette (Cmd+K):**
   Type "new bug" → shows "New Work Item: Bug Report" as a suggestion.

Selecting a template opens the create dialog pre-filled with the template's fields. The user can modify anything before saving. The template name is NOT stored on the work item — it's just a starting point.

### Custom Templates

Users create custom templates from:
- **Settings > Templates** — dedicated template editor (create from scratch)
- **"Save as Template"** on any existing work item — extracts current fields (with title generalized) into a new template

Storage: `work_item_templates` table in the DB. Fields: id, name, description, icon, category ("custom"), fields (JSON), projectId (null = global, set = project-scoped), createdAt.

---

## 3. Workflow Templates

### Current Workflow System

There is no explicit workflow table in the schema. Workflow states are implicit:
- `workItems.currentState` is a free-text string
- `personaAssignments` maps `(projectId, stateName)` → `personaId`
- `DEFAULT_STATE_ASSIGNMENTS` in `default-personas.ts:75-81` defines the hardcoded default: Planning → PM, Decomposition → Tech Lead, Ready → Router, In Progress → Engineer, In Review → Code Reviewer

The Settings page has a `workflow-config-section.tsx` for visual editing, but the underlying model is just persona assignments to state name strings.

### Workflow Template Definition

```typescript
interface WorkflowTemplate {
  id: string;
  name: string;              // "Code Review Pipeline"
  description: string;
  category: "built-in" | "custom";
  
  states: WorkflowStateTemplate[];
  transitions: WorkflowTransitionTemplate[];
  personaMapping: Record<string, string>;  // stateName → persona name
}

interface WorkflowStateTemplate {
  name: string;              // "In Review"
  type: "start" | "middle" | "end";
  color?: string;
}

interface WorkflowTransitionTemplate {
  from: string;
  to: string;
  condition?: string;        // e.g., "on_approval", "on_rejection"
}
```

### Built-In Workflow Templates

| Template | States | Key Flow |
|----------|--------|----------|
| **Default Linear** (current) | Planning → Decomposition → Ready → In Progress → In Review → Done | Full product workflow with PM, decomposition, engineering, review |
| **Simple Kanban** | To Do → In Progress → Done | Minimal 3-state workflow for small projects |
| **Code Review Pipeline** | Draft → In Review → Approved → Merged | Focus on review process with Code Reviewer persona |
| **Documentation Pipeline** | Outline → Draft → Review → Published | Documentation-focused with writing and review stages |
| **Bug Triage** | Reported → Triaged → Fixing → Verification → Closed | Bug lifecycle with triage and verification steps |

### Applying a Workflow Template

When creating a new project, the user selects a workflow template:

```
Create New Project
  Name: [____________]
  Path: [____________]
  Workflow: [Default Linear ▾]
            ├── Default Linear
            ├── Simple Kanban
            ├── Code Review Pipeline
            ├── Documentation Pipeline
            ├── Bug Triage
            └── Custom...
```

Selecting a template pre-populates:
1. Workflow states and transitions (stored as project settings or a dedicated workflow table)
2. Persona assignments for each state
3. The user can customize before creating

### Export / Import

"Export as Template" on a project's workflow config:
1. Captures current states, transitions, and persona assignment names (not IDs)
2. Exports as JSON file: `{ name, description, states, transitions, personaMapping }`
3. "Import Template" reads the JSON, resolves persona names to IDs (or creates them if missing)

---

## 4. Project Templates

### The Need

Bootstrapping a new project requires configuring workflow, personas, assignments, and potentially starter work items. Project templates bundle all of this.

### Template Definition

```typescript
interface ProjectTemplate {
  id: string;
  name: string;               // "Full Product Pipeline"
  description: string;
  category: "built-in" | "custom";
  
  workflow: WorkflowTemplate;
  personas: PersonaTemplate[];          // Persona configs (names, tools, models — not IDs)
  starterWorkItems?: WorkItemTemplate[];  // Optional initial backlog
  settings?: Partial<ProjectSettings>;    // Default project settings
}

interface PersonaTemplate {
  name: string;
  description: string;
  avatar: { color: string; icon: string };
  model: PersonaModel;
  allowedTools: string[];
  mcpTools: string[];
  maxBudgetPerRun: number;
  systemPrompt?: string;
}
```

### Built-In Project Templates

| Template | Workflow | Personas | Starter Items |
|----------|----------|----------|---------------|
| **Standard** (current default) | Default Linear (5 states) | All 6 built-in | None |
| **Lightweight** | Simple Kanban (3 states) | Engineer + Router only | None |
| **Code Review Focused** | Code Review Pipeline | Engineer + Code Reviewer + Router | "Setup CI pipeline" starter item |
| **Documentation Project** | Documentation Pipeline | Tech Lead + Engineer (writing) + Code Reviewer (editing) | "Create documentation index" starter item |

### "Create Project from Template" Flow

```
┌─────────────────────────────────────────────────┐
│ Create New Project                               │
│                                                  │
│ Template: [Standard ▾]                           │
│                                                  │
│ Name:  [__________________________]              │
│ Path:  [__________________________]  [Browse]    │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ Includes:                                    │ │
│ │   Workflow: Default Linear (5 states)        │ │
│ │   Personas: PM, Tech Lead, Engineer,         │ │
│ │     Code Reviewer, Router, Pico              │ │
│ │   Starter items: None                        │ │
│ │                                    [Customize]│ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│              [Cancel]  [Create Project]           │
└─────────────────────────────────────────────────┘
```

"Customize" expands inline editors for workflow, personas, and starter items — allowing modifications before creation.

---

## 5. Persona Presets

### Current State

The 6 built-in personas in `default-personas.ts` serve as de facto presets. The duplicate button (`persona-list.tsx:231`) lets users copy one as a starting point. But:

1. **No system prompts on built-ins** — `systemPrompt: ""` at `default-personas.ts:103`. Built-in personas rely on the `buildSystemPrompt()` assembly in `claude-executor.ts` which injects project context dynamically. The seed data (`seed.ts`) has detailed prompts, but `default-personas.ts` does not.
2. **No "reset to default"** — if a user modifies a built-in persona, there's no way to revert to the original configuration.
3. **No community presets** — users can't discover or share persona configs.

### Curated Persona Presets

Expand beyond the current 6 built-ins with role-specific presets:

| Preset | Model | Key Tools | MCP Tools | Budget | Use Case |
|--------|-------|-----------|-----------|--------|----------|
| **Bug Triager** | haiku | Read, Grep, Glob | list_items, post_comment, get_context | $5 | Categorize and prioritize incoming bugs |
| **Documentation Writer** | sonnet | Read, Write, Edit, Glob, WebSearch | post_comment, get_context | $50 | Write and update documentation |
| **Test Engineer** | sonnet | Read, Write, Edit, Bash, Glob, Grep | post_comment, get_context, flag_blocked | $100 | Write and run tests |
| **Security Reviewer** | opus | Read, Grep, Glob, Bash | post_comment, get_context, request_review | $50 | Audit code for security vulnerabilities |
| **Dependency Updater** | haiku | Read, Edit, Bash, Glob | post_comment, get_context | $20 | Update dependencies and fix breakage |
| **Release Manager** | sonnet | Read, Bash, Glob, Grep | list_items, post_comment, get_context | $30 | Prepare releases, changelogs, version bumps |

### Preset Library UX

In the Persona Manager, add a "Browse Presets" action:

```
┌──────────────────────────────────────────────────┐
│ Personas                          [+ New] [Browse]│
│                                                   │
│ ┌───────────────────────────────────────────────┐ │
│ │ Browse Persona Presets                         │ │
│ │                                                │ │
│ │ Built-in                                       │ │
│ │   ○ Bug Triager — Categorize incoming bugs     │ │
│ │   ○ Documentation Writer — Write/update docs   │ │
│ │   ○ Test Engineer — Write and run tests        │ │
│ │   ○ Security Reviewer — Security audits        │ │
│ │   ○ Dependency Updater — Update deps           │ │
│ │   ○ Release Manager — Prepare releases         │ │
│ │                                                │ │
│ │ Custom (saved from this instance)              │ │
│ │   ○ My Custom Persona — ...                    │ │
│ │                                                │ │
│ │                     [Cancel] [Add Selected]    │ │
│ └───────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

"Add Selected" creates a new persona from the preset. The user can then customize it.

### "Reset to Default"

For built-in personas, add a "Reset to Default" option in the persona detail panel context menu. This restores all fields to their `default-personas.ts` values. Custom personas don't have this option.

---

## 6. Storage & Sharing

### Storage Options

| Storage | Pros | Cons |
|---------|------|------|
| **DB tables** | Queryable, relationships to projects, part of backup/restore | Migration needed; tied to this instance |
| **JSON files** (in project directory) | Portable, git-trackable, human-readable | No cross-project discovery; fragile file paths |
| **JSON files** (in app data directory) | Cross-project, portable | Not git-tracked; separate backup needed |
| **Hybrid: DB + export as JSON** | Best of both — DB for active use, JSON for sharing | Slightly more complex |

### Recommendation: Hybrid (DB + JSON Export/Import)

**Active templates** live in the DB (fast queries, relationships, backup with the rest of the app):
- `templates` table: id, name, description, type ("work_item" | "workflow" | "project" | "persona"), category ("built-in" | "custom"), content (JSON), projectId (null = global), createdAt, updatedAt
- Single table with a `type` discriminator instead of separate tables per template type

**Sharing** via JSON export/import:
- "Export" serializes a template to a JSON file with a standardized envelope:
  ```json
  {
    "woofTemplate": "1.0",
    "type": "persona",
    "name": "Security Reviewer",
    "description": "...",
    "content": { ... }
  }
  ```
- "Import" reads the JSON, validates the schema, and inserts into the DB
- File extension: `.woof.json` (recognizable, avoids conflicts)

### Community Template Gallery (Future — Phase 3+)

Not for initial implementation, but the JSON format enables a future community gallery:
- GitHub repository of `.woof.json` files
- In-app "Browse Community Templates" that fetches from a curated list
- One-click install from the gallery
- User submissions via PR to the gallery repo

This is purely future speculation — Phase 1 is local DB + export/import only.

---

## 7. Settings Integration

### Where Templates Are Managed

| Template Type | Primary Location | Secondary Location |
|---------------|------------------|--------------------|
| **Work Item** | Settings > Templates | "New from Template" dropdown on Work Items page |
| **Workflow** | Settings > Workflows | Project creation dialog |
| **Project** | Project creation dialog | Settings > Templates |
| **Persona** | Persona Manager > Browse Presets | Settings > Templates |

### Settings > Templates Page

A unified template management page:

```
┌─────────────────────────────────────────────────────┐
│ Settings > Templates                                 │
│                                                      │
│ [Work Items] [Workflows] [Projects] [Personas]       │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Work Item Templates                              │ │
│ │                                                  │ │
│ │ Built-in (5)                                     │ │
│ │   Bug Report · Feature Request · Spike ·         │ │
│ │   Documentation · Refactor                       │ │
│ │                                                  │ │
│ │ Custom (2)                                       │ │
│ │   Sprint Retrospective · API Integration Task    │ │
│ │                                                  │ │
│ │ [+ Create Template]  [Import .woof.json]         │ │
│ └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

Built-in templates are read-only (can be duplicated but not edited/deleted). Custom templates are fully editable.

---

## 8. Implementation Phases

### Phase 1: Work Item Templates + Persona Presets (Medium Effort)

**Goal:** Eliminate the most common repetitive setup tasks.

Tasks:
- Add `templates` DB table with type discriminator
- Seed 5 built-in work item templates
- Add "New from Template" dropdown to Work Items page
- Seed 6 additional persona presets (beyond the current built-ins)
- Add "Browse Presets" to Persona Manager
- Add "Save as Template" on work item detail panel

### Phase 2: Workflow Templates + Project Templates (Medium Effort)

**Goal:** Streamline project creation with workflow and project bundled templates.

Tasks:
- Seed 5 built-in workflow templates
- Add workflow template selector to project creation dialog
- Create project template bundles (workflow + personas + optional starter items)
- Add "Export as Template" to workflow config
- Add "Import Template" in Settings

### Phase 3: Sharing + Community (Lower Priority)

**Goal:** Enable template portability and discovery.

Tasks:
- JSON export/import with `.woof.json` format
- "Reset to Default" for built-in personas
- Settings > Templates unified management page
- Template versioning (for built-in updates)
- Community gallery integration (fetch from curated GitHub repo)

---

## 9. Cross-References

| Document | Relationship |
|----------|-------------|
| `docs/proposals/scheduling/ux-design.md` | Scheduled personas could reference persona presets — "schedule the Bug Triager preset to run daily" |
| `docs/proposals/data-management/backup-restore.md` (future) | Export/import relates to templates — project export could include custom templates; backup must include the templates table |
| `docs/proposals/agent-collaboration/context-sharing.md` | Handoff note templates could be a future extension — standardized formats for what agents pass between workflow steps |
| `packages/backend/src/db/default-personas.ts` | Current source of built-in persona definitions; would need to reference the templates table for additional presets |
| `packages/frontend/src/features/persona-manager/persona-list.tsx` | Existing "Duplicate" button at :231 — pattern to extend for "Add from Preset" |
| `packages/frontend/src/features/settings/workflow-config-section.tsx` | Current workflow editor — would gain a "Load Template" action |

---

## 10. Design Decisions

1. **Single `templates` table with type discriminator over separate tables per type.** Simpler schema, unified CRUD API, easier Settings UI. The `content` JSON field holds type-specific data. Trade-off: no type-specific DB constraints, but the JSON schema validation happens at the application level.

2. **Built-in templates are immutable but duplicatable.** Users can't edit or delete built-ins (prevents accidental breakage), but can duplicate to create a custom version. This matches the current persona pattern where built-in personas can be modified — but for templates, immutability is safer since templates are shared reference points.

3. **Templates are instance-local by default, shareable via JSON export.** No cloud sync, no accounts, no dependency on external services. This aligns with the local-first philosophy. The `.woof.json` format is the portability mechanism.

4. **Work item templates don't create "types" — they're just starting points.** A bug report template fills in fields, but the created work item has no `templateId` or type field. This avoids rigidity — templates are suggestions, not constraints.

5. **Persona presets expand the built-in set, they don't replace it.** The 6 current built-ins remain as-is. New presets are additional options in the "Browse Presets" library. This is additive, not breaking.
