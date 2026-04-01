# Agent Personas

Personas are the AI agent configurations in AgentOps. Each persona defines a system prompt, model, tool access, and budget — shaping an agent's behavior for a specific role in the workflow.

## What Is a Persona?

A persona is a reusable agent configuration stored in the database. When a work item enters a workflow state, the persona assigned to that state is dispatched to work on it.

```typescript
interface Persona {
  id: PersonaId;           // "ps-xxxx" prefixed ID
  name: string;            // Display name (e.g., "Engineer")
  description: string;     // What this persona does
  avatar: {
    color: string;         // Hex color for UI display
    icon: string;          // Lucide icon name
  };
  systemPrompt: string;    // Base system prompt
  model: PersonaModel;     // "opus", "sonnet", or "haiku"
  allowedTools: string[];  // Claude Code tools this persona can use
  mcpTools: string[];      // AgentOps MCP tools (post_comment, etc.)
  maxBudgetPerRun: number; // Max API cost per execution in USD (0 = unlimited)
  settings: Record<string, unknown>; // Freeform settings
}
```

## Built-In Personas

AgentOps ships with 5 built-in personas, seeded on first run. Each is optimized for a specific workflow stage.

### Product Manager

| Field | Value |
|---|---|
| **ID** | `ps-pm00001` |
| **Model** | Sonnet |
| **Avatar** | Purple (`#7c3aed`), `clipboard-list` icon |
| **Budget** | $50/run |
| **Workflow State** | Planning |
| **Claude Tools** | `Read`, `Glob`, `Grep`, `WebSearch` |
| **MCP Tools** | `post_comment`, `transition_state` |

**Role:** Reads the work item description and user comments, then writes clear, testable acceptance criteria as a checklist. Defines scope (what's in and what's out), sets priority, and flags open questions.

**System prompt guidelines:**
- Each acceptance criterion must be independently verifiable
- Include edge cases and error scenarios
- Keep criteria behavior-focused ("user can...") not implementation-focused ("use library X")
- Make reasonable assumptions for vague descriptions and document them

### Tech Lead

| Field | Value |
|---|---|
| **ID** | `ps-tl00001` |
| **Model** | Opus |
| **Avatar** | Blue (`#2563eb`), `git-branch` icon |
| **Budget** | $100/run |
| **Workflow State** | Decomposition |
| **Claude Tools** | `Read`, `Glob`, `Grep`, `WebSearch`, `Bash` |
| **MCP Tools** | `create_tasks`, `post_comment`, `request_review` |

**Role:** Reads the work item and its acceptance criteria, analyzes the codebase, then decomposes the work into 2-5 well-scoped child tasks with dependency edges.

**System prompt guidelines:**
- Each child should be completable in a single agent session (one commit)
- Include file paths and component names in child descriptions
- Order children by dependency
- Check CLAUDE.md for existing code patterns and conventions
- Skip decomposition if the work item is already small enough

### Engineer

| Field | Value |
|---|---|
| **ID** | `ps-en00001` |
| **Model** | Sonnet |
| **Avatar** | Green (`#059669`), `code` icon |
| **Budget** | $200/run |
| **Workflow State** | In Progress |
| **Claude Tools** | `Read`, `Edit`, `Write`, `Glob`, `Grep`, `Bash`, `WebFetch` |
| **MCP Tools** | `post_comment`, `flag_blocked`, `transition_state` |

**Role:** Implements the work item by reading the description, acceptance criteria, and parent context. Checks for feedback from previous review cycles and addresses every point. Writes and modifies code following project conventions.

**System prompt guidelines:**
- Follow existing code patterns (check similar files)
- TypeScript strict mode with explicit types at module boundaries
- Use shadcn/ui components and Tailwind CSS for UI work
- Dark mode support required on all new components
- Minimal, focused changes — don't refactor surrounding code
- Verify changes build with `pnpm build`

### Code Reviewer

| Field | Value |
|---|---|
| **ID** | `ps-rv00001` |
| **Model** | Sonnet |
| **Avatar** | Amber (`#d97706`), `eye` icon |
| **Budget** | $50/run |
| **Workflow State** | In Review |
| **Claude Tools** | `Read`, `Glob`, `Grep`, `Bash` |
| **MCP Tools** | `post_comment`, `request_review`, `transition_state` |

**Role:** Reviews code changes for correctness, style, and completeness. Reads all files modified in the most recent execution, verifies against acceptance criteria, and checks for bugs, edge cases, and security issues.

**Review checklist:**
- Does the code match the task description?
- Are there obvious bugs or logic errors?
- Are TypeScript types correct and complete?
- Does it follow naming conventions and file structure?
- Are there hardcoded values that should be configurable?
- Is error handling appropriate?
- Does the build pass?

If issues are found: rejects with specific, actionable feedback (file names, line numbers, what to fix). If code is correct: approves with a summary of what was verified.

### Router

| Field | Value |
|---|---|
| **ID** | `ps-rt00001` |
| **Model** | Haiku |
| **Avatar** | Indigo (`#6366f1`), `route` icon |
| **Budget** | $10/run |
| **Workflow State** | *(automatic — fires after every persona completion)* |
| **Claude Tools** | *(none)* |
| **MCP Tools** | `list_items`, `get_context`, `route_to_state` |

**Role:** A special system persona that decides the next workflow state after any other persona completes execution. Uses read-only tools to understand context, then transitions the work item.

**Routing guidelines:**
- After Planning → "Decomposition" or "Ready" (if no decomposition needed)
- After Decomposition → "Ready"
- After In Progress → "In Review"
- After successful review → "Done"
- After failed review → back to "In Progress" (rejection)
- All children Done → route parent to "In Review"
- Unresolvable issues → "Blocked"

The Router is a **system persona** (`settings: { isSystem: true, isRouter: true }`). The `isRouter` flag enables structured output — the SDK returns a JSON object with `{ nextState, reasoning, confidence }` instead of free-text. This is stored in the `structuredOutput` column and rendered as a Router Decision Card in the UI (color-coded state badge, confidence dot, reasoning text). The Router is created lazily on first use by `getOrCreateRouterPersona()` in `router.ts`, or seeded with the other built-in personas. It uses the Haiku model for cost efficiency since routing decisions are lightweight.

## Creating and Editing Custom Personas

Custom personas are managed through the **Persona Manager** UI or the REST API.

### Via the UI

Navigate to **Personas** in the sidebar. From there you can:

1. **Create** — Click "New Persona", fill in name, description, model, system prompt, and tool selections
2. **Edit** — Click any persona card to open the editor
3. **Configure tools** — Select which Claude Code tools and MCP tools are available
4. **Set budget** — Define max cost per execution run

### Via the API

```bash
# Create a persona
curl -X POST http://localhost:3001/api/personas \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Security Auditor",
    "description": "Reviews code for security vulnerabilities",
    "avatar": { "color": "#dc2626", "icon": "shield" },
    "systemPrompt": "You are a security auditor...",
    "model": "sonnet",
    "allowedTools": ["Read", "Glob", "Grep", "Bash"],
    "mcpTools": ["post_comment", "flag_blocked"],
    "maxBudgetPerRun": 50
  }'

# Update a persona
curl -X PATCH http://localhost:3001/api/personas/ps-xxxx \
  -H "Content-Type: application/json" \
  -d '{ "systemPrompt": "Updated prompt..." }'
```

### Assigning to Workflow States

After creating a persona, assign it to a workflow state for a project in **Settings > Workflow > Persona Assignments**:

```bash
curl -X PUT http://localhost:3001/api/persona-assignments \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "pj-xxxx",
    "stateName": "In Progress",
    "personaId": "ps-xxxx"
  }'
```

Each state can have **one persona per project**. The assignment is stored as a composite key `(projectId, stateName)`.

## System Prompt Layering

When a persona is dispatched, the Claude Agent SDK receives a 4-layer system prompt assembled by `buildSystemPrompt()` in `claude-executor.ts`:

```
┌─────────────────────────────────────────┐
│ (1) Persona Identity                    │
│     The persona's systemPrompt field    │
│     — role, responsibilities, tools     │
├─────────────────────────────────────────┤
│ (2) Project Context                     │
│     Project name, working directory,    │
│     description, key patterns           │
├─────────────────────────────────────────┤
│ (3) Work Item Context                   │
│     Title, ID, current state,           │
│     description, parent chain,          │
│     inherited context                   │
├─────────────────────────────────────────┤
│ (4) Execution History                   │
│     Previous execution outcomes         │
│     and summaries on this work item.    │
│     Includes rejection payloads         │
│     (reason, severity, hint)            │
└─────────────────────────────────────────┘
```

### Layer Details

**Layer 1 — Persona Identity:** The raw `systemPrompt` from the persona record. Defines the agent's role, responsibilities, and behavioral guidelines.

**Layer 2 — Project Context:** Injected automatically from the project record:
- `Project: {name}` and `Working directory: {path}`
- Optional `Description` and `Key patterns` from project settings

**Layer 3 — Work Item Context:** The specific work being done:
- Title, ID, current state, and description
- Parent chain (if the item has ancestors): `"Parent chain: Feature A (wi-xxx) → Epic B (wi-yyy)"`
- Inherited context from parent items

**Layer 4 — Execution History:** All previous agent runs on this work item, giving the current agent visibility into what was already tried:
- Each entry shows outcome (`success`, `failure`, `rejected`) and summary
- Rejection payloads include the reason, severity, and hint for rework

This layering ensures every agent has full context without requiring manual briefing.

## Per-Persona MCP Tool Allowlists

Each persona has two tool lists that control what it can do:

### `allowedTools` — Claude Code Tools

These are the standard Claude Code tools the agent can use during execution:

| Tool | Description | Typical Users |
|---|---|---|
| `Read` | Read files from the filesystem | All personas |
| `Edit` | Edit existing files | Engineer |
| `Write` | Create new files | Engineer |
| `Glob` | Find files by pattern | All personas |
| `Grep` | Search file contents | All personas |
| `Bash` | Run shell commands | Tech Lead, Engineer, Code Reviewer |
| `WebSearch` | Search the web | Product Manager, Tech Lead |
| `WebFetch` | Fetch web pages | Engineer |

### `mcpTools` — AgentOps MCP Tools

These are the 7 tools provided by the AgentOps MCP server (see [MCP Tools](mcp-tools.md)):

| Tool | Description | Used By |
|---|---|---|
| `post_comment` | Post a comment on a work item | PM, Tech Lead, Engineer, Reviewer |
| `create_children` | Create child work items | Tech Lead |
| `route_to_state` | Transition a work item to a new state | Router |
| `list_items` | Query work items with filters | Router |
| `get_context` | Get execution history and project memories | Router |
| `flag_blocked` | Mark a work item as Blocked | Engineer |
| `request_review` | Flag a work item for human review | Tech Lead, Reviewer |

**Enforcement:** Tool access is controlled by passing the `ALLOWED_TOOLS` environment variable to the MCP server process. The persona's `allowedTools` array is joined with commas and passed via `SpawnOptions.tools`. An empty list means all tools are available.

## The Router as a Special Persona

The Router differs from other personas in several ways:

| Aspect | Regular Personas | Router |
|---|---|---|
| **Trigger** | Dispatched when a work item enters their assigned state | Automatically called after any persona completes |
| **Model** | Sonnet or Opus | Haiku (cost-efficient) |
| **Claude tools** | Read, Edit, Write, etc. | None |
| **MCP tools** | Various | Only `list_items`, `get_context`, `route_to_state` |
| **Budget** | $50-200/run | $10/run |
| **Settings** | `{}` | `{ isSystem: true, isRouter: true }` |
| **Output format** | Free text | Structured JSON: `{ nextState, reasoning, confidence }` |
| **Creation** | Manual or seeded | Lazy-created on first auto-routing use |
| **Visible in UI** | Yes, in Persona Manager | Yes, but marked as system persona |

The Router is auto-created by `getOrCreateRouterPersona()` in `router.ts` if it doesn't exist. It can also be pre-seeded. Auto-routing can be toggled on/off per project in Settings.

## Source Files

| File | Purpose |
|---|---|
| `packages/shared/src/entities.ts` | `Persona` interface, `PersonaModel` type |
| `packages/backend/src/db/seed.ts` | 5 built-in persona definitions with system prompts |
| `packages/backend/src/agent/claude-executor.ts` | `buildSystemPrompt()` — 4-layer prompt assembly |
| `packages/backend/src/agent/router.ts` | Router persona creation, routing logic |
| `packages/backend/src/agent/mcp-server.ts` | MCP server with 7 tools, per-persona tool filtering |
| `packages/backend/src/db/schema.ts` | Drizzle schema for `personas` table |
