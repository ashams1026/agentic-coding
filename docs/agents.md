# Agents

Agents are the AI agent configurations in AgentOps. Each agent defines a system prompt, model, tool access, budget, and scope — shaping an agent's behavior for a specific role in the workflow.

## What Is an Agent?

An agent is a reusable agent configuration stored in the database. When a work item enters a workflow state, the agent assigned to that state is dispatched to work on it.

```typescript
interface Agent {
  id: AgentId;            // "ag-xxxx" prefixed ID
  name: string;           // Display name (e.g., "Engineer")
  description: string;    // What this agent does
  avatar: {
    color: string;        // Hex color for UI display
    icon: string;         // Lucide icon name
  };
  systemPrompt: string;   // Base system prompt
  model: AgentModel;      // "opus", "sonnet", or "haiku"
  allowedTools: string[]; // Claude Code tools this agent can use
  mcpTools: string[];     // AgentOps MCP tools (post_comment, etc.)
  maxBudgetPerRun: number; // Max API cost per execution in USD (0 = unlimited)
  settings: AgentSettings; // isSystem?, isAssistant?, isRouter?, effort?, thinking?
  scope: "global" | "project"; // Visibility scope
  projectId: string | null; // Non-null only when scope === "project"
}
```

## Agent Scope

Agents have a `scope` field that controls their visibility:

| Scope | Description | `projectId` |
|---|---|---|
| `"global"` | Visible across all projects | `null` |
| `"project"` | Only visible within the specified project | Set to owning project ID |

When filtering agents for a project, the API returns all global agents **plus** any project-scoped agents that belong to that project. Use `GET /api/agents?projectId=pj-xxxx` to retrieve this merged list.

Built-in agents (Product Manager, Tech Lead, Engineer, Code Reviewer, Router, Pico) are always global.

## Built-In Agents

AgentOps ships with 5 built-in agents, seeded on first run. Each is optimized for a specific workflow stage.

### Product Manager

| Field | Value |
|---|---|
| **ID** | `ag-pm00001` |
| **Model** | Sonnet |
| **Scope** | Global |
| **Avatar** | Purple (`#7c3aed`), `clipboard-list` icon |
| **Budget** | $50/run |
| **Workflow State** | Planning |
| **Claude Tools** | `Read`, `Glob`, `Grep`, `WebSearch` |
| **MCP Tools** | `post_comment`, `list_items`, `get_context`, `request_review` |

**Role:** Reads the work item description and user comments, then writes clear, testable acceptance criteria as a checklist. Defines scope (what's in and what's out), sets priority, and flags open questions.

**System prompt guidelines:**
- Each acceptance criterion must be independently verifiable
- Include edge cases and error scenarios
- Keep criteria behavior-focused ("user can...") not implementation-focused ("use library X")
- Make reasonable assumptions for vague descriptions and document them

### Tech Lead

| Field | Value |
|---|---|
| **ID** | `ag-tl00001` |
| **Model** | Opus |
| **Scope** | Global |
| **Avatar** | Blue (`#2563eb`), `git-branch` icon |
| **Budget** | $100/run |
| **Workflow State** | Decomposition |
| **Claude Tools** | `Read`, `Glob`, `Grep`, `WebSearch`, `Bash` |
| **MCP Tools** | `create_children`, `post_comment`, `get_context`, `list_items` |

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
| **ID** | `ag-en00001` |
| **Model** | Sonnet |
| **Scope** | Global |
| **Avatar** | Green (`#059669`), `code` icon |
| **Budget** | $200/run |
| **Workflow State** | In Progress |
| **Claude Tools** | `Read`, `Edit`, `Write`, `Glob`, `Grep`, `Bash`, `WebFetch` |
| **MCP Tools** | `post_comment`, `flag_blocked`, `get_context` |

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
| **ID** | `ag-rv00001` |
| **Model** | Sonnet |
| **Scope** | Global |
| **Avatar** | Amber (`#d97706`), `eye` icon |
| **Budget** | $50/run |
| **Workflow State** | In Review |
| **Claude Tools** | `Read`, `Glob`, `Grep`, `Bash` |
| **MCP Tools** | `post_comment`, `get_context`, `list_items`, `request_review`, `rewind_execution` |

**Role:** Reviews code changes for correctness, style, and completeness. Reads all files modified in the most recent execution, verifies against acceptance criteria, and checks for bugs, edge cases, and security issues. Can rewind file changes via `rewind_execution` when an implementation is fundamentally wrong.

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
| **ID** | `ag-rt00001` |
| **Model** | Haiku |
| **Scope** | Global |
| **Avatar** | Indigo (`#6366f1`), `route` icon |
| **Budget** | $10/run |
| **Workflow State** | *(automatic — fires after every agent completion when `workflow.autoRouting === true`)* |
| **Claude Tools** | *(none)* |
| **MCP Tools** | `list_items`, `get_context`, `route_to_state` |

**Role:** A special system agent that decides the next workflow state after any other agent completes execution. Uses read-only tools to understand context, then transitions the work item.

**Routing guidelines:**
- After Planning → "Decomposition" or "Ready" (if no decomposition needed)
- After Decomposition → "Ready"
- After In Progress → "In Review"
- After successful review → "Done"
- After failed review → back to "In Progress" (rejection)
- All children Done → route parent to "In Review"
- Unresolvable issues → "Blocked"

The Router is a **system agent** (`settings: { isSystem: true, isRouter: true }`). The `isRouter` flag enables structured output — the SDK returns a JSON object with `{ nextState, reasoning, confidence }` instead of free-text. This is stored in the `structuredOutput` column and rendered as a Router Decision Card in the UI (color-coded state badge, confidence dot, reasoning text). The Router is created lazily on first use by `getOrCreateRouterAgent()` in `router.ts`, or seeded with the other built-in agents. It uses the Haiku model for cost efficiency since routing decisions are lightweight.

### Pico (Project Assistant)

| Field | Value |
|---|---|
| **ID** | `ag-pico` |
| **Model** | Sonnet |
| **Scope** | Global |
| **Avatar** | Amber (`#f59e0b`), `dog` icon |
| **Budget** | $5/run |
| **Workflow State** | *(none — chat assistant, not workflow)* |
| **Claude Tools** | *(none)* |
| **MCP Tools** | `list_items`, `get_context`, `post_comment` |

**Role:** A conversational project assistant accessible via the floating chat bubble (bottom-right). Answers questions about the project, codebase, workflow, and agents. Has access to project knowledge via a custom skill (`pico-skill.md`).

Pico is a **system agent** (`settings: { isSystem: true, isAssistant: true }`). It is non-editable and non-deletable in the Agent Manager UI. Chat sessions are stored in `chat_sessions`/`chat_messages` tables.

## Creating and Editing Custom Agents

Custom agents are managed through the **Agent Manager** UI or the REST API.

### Via the UI

Navigate to **Agents** in the sidebar. From there you can:

1. **Create** — Click "New Agent", fill in name, description, model, system prompt, and tool selections
2. **Edit** — Click any agent card to open the editor
3. **Configure tools** — Select which Claude Code tools and MCP tools are available
4. **Set budget** — Define max cost per execution run
5. **Set scope** — Choose global or project-scoped visibility

### Via the API

```bash
# Create a global agent
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Security Auditor",
    "description": "Reviews code for security vulnerabilities",
    "avatar": { "color": "#dc2626", "icon": "shield" },
    "systemPrompt": "You are a security auditor...",
    "model": "sonnet",
    "allowedTools": ["Read", "Glob", "Grep", "Bash"],
    "mcpTools": ["post_comment", "flag_blocked"],
    "maxBudgetPerRun": 50,
    "scope": "global"
  }'

# Create a project-scoped agent
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile Engineer",
    "systemPrompt": "You are a mobile engineer...",
    "model": "sonnet",
    "scope": "project",
    "projectId": "pj-xxxx"
  }'

# Update an agent
curl -X PATCH http://localhost:3001/api/agents/ag-xxxx \
  -H "Content-Type: application/json" \
  -d '{ "systemPrompt": "Updated prompt..." }'
```

### Assigning to Workflow States

After creating an agent, assign it to a workflow state for a project in **Settings > Workflow > Agent Assignments**:

```bash
curl -X PUT http://localhost:3001/api/agent-assignments \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "pj-xxxx",
    "stateName": "In Progress",
    "agentId": "ag-xxxx"
  }'
```

Each state can have **one agent per project**. The assignment is stored as a composite key `(projectId, stateName)`.

For label-based routing within a state, configure `agentOverrides` directly in the **Workflow Builder** — these take priority over both the state default and assignment table.

## System Prompt Layering

When an agent is dispatched, the Claude Agent SDK receives a 4-layer system prompt assembled by `buildSystemPrompt()` in `claude-executor.ts`:

```
┌─────────────────────────────────────────┐
│ (1) Agent Identity                      │
│     The agent's systemPrompt field      │
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

**Layer 1 — Agent Identity:** The raw `systemPrompt` from the agent record. Defines the agent's role, responsibilities, and behavioral guidelines.

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

## Per-Agent MCP Tool Allowlists

Each agent has two tool lists that control what it can do:

### `allowedTools` — Claude Code Tools

These are the standard Claude Code tools the agent can use during execution:

| Tool | Description | Typical Users |
|---|---|---|
| `Read` | Read files from the filesystem | All agents |
| `Edit` | Edit existing files | Engineer |
| `Write` | Create new files | Engineer |
| `Glob` | Find files by pattern | All agents |
| `Grep` | Search file contents | All agents |
| `Bash` | Run shell commands | Tech Lead, Engineer, Code Reviewer |
| `WebSearch` | Search the web | Product Manager, Tech Lead |
| `WebFetch` | Fetch web pages | Engineer |

### `mcpTools` — AgentOps MCP Tools

These are the tools provided by the AgentOps MCP server (see [MCP Tools](mcp-tools.md)):

| Tool | Description | Used By |
|---|---|---|
| `post_comment` | Post a comment on a work item | PM, Tech Lead, Engineer, Reviewer |
| `create_children` | Create child work items | Tech Lead |
| `route_to_state` | Transition a work item to a new state | Router |
| `list_items` | Query work items with filters | Router |
| `get_context` | Get execution history and project memories | Router |
| `flag_blocked` | Mark a work item as Blocked | Engineer |
| `request_review` | Flag a work item for human review | Tech Lead, Reviewer |

**Enforcement:** Tool access is controlled by passing the `ALLOWED_TOOLS` environment variable to the MCP server process. The agent's `allowedTools` array is joined with commas and passed via `SpawnOptions.tools`. An empty list means all tools are available.

## Agents as Subagents

All project agents are registered as SDK subagents in every execution. This means any agent can invoke another agent as a subagent using the SDK's `Agent` tool.

### How It Works

When an execution starts, `ClaudeExecutor.spawn()` maps all agents to `AgentDefinition` entries and passes them via the `agents` option in `query()`. The primary agent runs the execution (30 max turns, full system prompt with work item context). All other agents are available as subagents (15 max turns, their own system prompt).

### Example

The Engineer agent, while implementing a feature, can spawn the Code Reviewer as a subagent for a quick pre-commit review:

```
Engineer: "Let me get a quick review before committing..."
→ Agent tool invokes Code Reviewer (agent ID)
→ Code Reviewer runs with its own tools, model, and review prompt
→ Returns feedback to Engineer
→ Engineer incorporates feedback and continues
```

### Configuration

The `subagents` field on the Agent entity stores preferred subagent agent IDs. However, all agents are available regardless — the `subagents` field is informational, not restrictive.

### Tracking

- `SubagentStart`/`SubagentStop` SDK hooks broadcast `subagent_started`/`subagent_completed` WebSocket events
- `parentExecutionId` column on executions table links child records to parent
- Agent monitor renders subagent executions as nested cards under the parent

## Effort & Thinking Configuration

Each agent can be configured with an **effort level** and **thinking mode** that control how much reasoning Claude applies during execution. These are set in `agent.settings` and passed to the SDK's `query()` options.

### Effort Levels

| Level | Description | Cost Impact | Best For |
|---|---|---|---|
| `low` | Fast, minimal reasoning | Lowest | Simple routing decisions, lightweight tasks |
| `medium` | Balanced speed and quality | Moderate | Acceptance criteria, planning |
| `high` | Thorough reasoning (default) | Higher | Code review, decomposition |
| `max` | Maximum depth | Highest | Complex implementation, deep analysis |

### Thinking Modes

| Mode | Description | Behavior |
|---|---|---|
| `adaptive` | Claude decides when to think deeply (default) | SDK manages thinking automatically based on task complexity |
| `enabled` | Always show reasoning chain | Extended thinking with a token budget (`thinkingBudgetTokens`, default 10000) |
| `disabled` | No extended thinking | Fastest responses, no reasoning chain |

### Recommended Defaults

| Agent | Effort | Thinking | Rationale |
|---|---|---|---|
| Product Manager | `medium` | `adaptive` | AC writing doesn't need deep reasoning |
| Tech Lead | `high` | `adaptive` | Decomposition benefits from thorough analysis |
| Engineer | `max` | `enabled` (16K budget) | Implementation needs maximum depth and visible reasoning |
| Code Reviewer | `high` | `adaptive` | Reviews need thoroughness but not maximum cost |
| Router | `low` | `disabled` | Routing decisions are lightweight — cost efficiency |
| Pico | `high` | `adaptive` | General assistant — balanced (inherits defaults) |

### Configuring in the UI

In the **Agent Manager**, click an agent and select **Edit**. The "Effort & Thinking" section appears below Budget with two dropdowns:
- **Effort Level** — low/medium/high/max with descriptions
- **Thinking Mode** — adaptive/enabled/disabled with descriptions

Values are saved to `agent.settings` and merged with existing settings (system flags like `isSystem` and `isRouter` are preserved).

## The Router as a Special Agent

The Router differs from other agents in several ways:

| Aspect | Regular Agents | Router |
|---|---|---|
| **Trigger** | Dispatched when a work item enters their assigned state | Automatically called after any agent completes (when `workflow.autoRouting === true`) |
| **Model** | Sonnet or Opus | Haiku (cost-efficient) |
| **Claude tools** | Read, Edit, Write, etc. | None |
| **MCP tools** | Various | Only `list_items`, `get_context`, `route_to_state` |
| **Budget** | $50-200/run | $10/run |
| **Settings** | `{}` | `{ isSystem: true, isRouter: true }` |
| **Output format** | Free text | Structured JSON: `{ nextState, reasoning, confidence }` |
| **Creation** | Manual or seeded | Lazy-created on first auto-routing use |
| **Visible in UI** | Yes, in Agent Manager | Yes, but marked as system agent |

The Router is auto-created by `getOrCreateRouterAgent()` in `router.ts` if it doesn't exist. It can also be pre-seeded. Auto-routing is controlled per-workflow via `workflow.autoRouting` (not per-project settings).

## Evaluated Future Capabilities

### Plugin-Based Skills

The SDK supports a plugin system for extending agent capabilities with custom commands, agents, MCP servers, and hooks. Local plugins work now:

```typescript
query({ prompt, options: {
  plugins: [{ type: 'local', path: './my-plugin' }]
}});
```

Marketplace plugins are settings-based via `enabledPlugins` and `extraKnownMarketplaces`. This enables community-built agent skills installable from registries. See [plugin system spike](spikes/plugin-system.md).

### Worktree Isolation for Concurrent Agents

When multiple agents run concurrently (e.g., two Engineers on sibling tasks), the SDK's `isolation: "worktree"` parameter on Agent spawning gives each agent an independent git worktree. The SDK manages creation and cleanup automatically. Not needed yet — AgentOps currently runs agents sequentially. See [worktree isolation spike](spikes/worktree-isolation.md).

## Source Files

| File | Purpose |
|---|---|
| `packages/shared/src/entities.ts` | `Agent` interface, `AgentModel` type |
| `packages/backend/src/db/seed.ts` | 5 built-in agent definitions with system prompts |
| `packages/backend/src/agent/claude-executor.ts` | `buildSystemPrompt()` — 4-layer prompt assembly |
| `packages/backend/src/agent/router.ts` | Router agent creation, routing logic |
| `packages/backend/src/agent/mcp-server.ts` | MCP server with 7 tools, per-agent tool filtering |
| `packages/backend/src/db/schema.ts` | Drizzle schema for `agents` table |
