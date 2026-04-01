# Getting Started

This guide walks you through setting up AgentOps, creating your first project, and running your first automated workflow.

## Prerequisites

- **Node.js** >= 22 ([download](https://nodejs.org/))
- **pnpm** >= 9 ([install](https://pnpm.io/installation))

Verify your environment:

```bash
node --version   # v22.x.x
pnpm --version   # 9.x.x or higher
```

## Installation

```bash
# Clone the repository
git clone https://github.com/ashams1026/agentic-coding.git
cd agentic-coding

# Install all dependencies
pnpm install
```

This installs dependencies for all three packages (`frontend`, `backend`, `shared`) via pnpm workspaces.

## First Run

Start both the frontend and backend in development mode:

```bash
pnpm dev
```

You should see output like:

```
packages/backend dev$ tsx watch src/start.ts
packages/frontend dev$ vite
  VITE v8.x.x  ready in XXXms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser. You'll see the AgentOps dashboard.

> **Tip:** To populate the UI with demo data (projects, work items, personas, executions), run `pnpm db:seed-demo` in a separate terminal. This seeds 3 projects with 14 work items across all workflow states.

## Configure Your API Key

Agents need an Anthropic API key to run. You can set it in the UI or via CLI.

### Via the UI

1. Click **Settings** in the sidebar
2. Go to the **Agent Configuration** section
3. Paste your key (`sk-ant-api03-...`) into the input field
4. Click **Test connection** — you'll see a green checkmark if valid
5. The key is stored at `~/.agentops/config.json`

### Via the CLI

```bash
npx agentops config set anthropicApiKey sk-ant-api03-...
```

Verify your configuration:

```bash
npx agentops config
```

Output:

```
AgentOps Configuration:
  port:            3001
  dbPath:          ~/.agentops/data/agentops.db
  logLevel:        info
  anthropicApiKey: ****...xxxx
```

## Create Your First Project

Projects tell AgentOps which directory to work in.

1. Go to **Settings > Projects**
2. Click **Add Project**
3. Enter a name (e.g., "My App") and the absolute path to your project directory
4. Click **Create** — the backend validates that the path exists on disk

> You can also create projects via the API:
> ```bash
> curl -X POST http://localhost:3001/api/projects \
>   -H "Content-Type: application/json" \
>   -d '{"name": "My App", "path": "/Users/you/projects/my-app"}'
> ```

## Create a Work Item

Work items are the unit of work in AgentOps. They flow through the workflow states.

1. Go to the **Work Items** page (click in the sidebar)
2. Click **Create** or use the inline form
3. Enter a title and description, then submit

Your new work item appears in the **Backlog** column.

## Walk a Work Item Through States Manually

With auto-routing OFF (the default when no personas are assigned), you move items manually:

1. Click on your work item to open the detail panel
2. In the detail panel header, find the **state transition** dropdown
3. Select the next valid state (e.g., Backlog → **Planning**)
4. The item moves to the Planning column

Valid transitions follow the workflow:

```
Backlog → Planning → Decomposition → Ready → In Progress → In Review → Done
                                                                    ↘ Blocked
```

Any state can transition to **Blocked**, and Blocked items can return to their previous state.

Continue advancing your work item through each state to see how the workflow feels.

## Enable Auto-Routing

When auto-routing is ON, the Router agent automatically decides the next state after each persona completes work.

1. Go to **Settings > Workflow**
2. Toggle **Auto-routing** to ON
3. You'll see: *"Auto-routing: ON — Router agent will automatically transition work items"*

### Assign Personas to States

For auto-routing to do anything, you need personas assigned to workflow states:

1. In **Settings > Workflow**, scroll to the **Persona Assignments** table
2. For each state (Planning, Decomposition, Ready, In Progress, In Review), select a persona from the dropdown
3. When a work item enters a state, the assigned persona is automatically dispatched

The seed data includes 6 built-in personas:
- **Product Manager** — Planning and requirements
- **Tech Lead** — Decomposition and architecture
- **Engineer** — Implementation (In Progress)
- **Code Reviewer** — Review (In Review)
- **Router** — Automatic state transitions (system persona)
- **Pico** — Project assistant chatbot (click the chat bubble in the bottom-right corner)

### Watch the Pipeline

With personas assigned and auto-routing ON:

1. Create a new work item in Backlog
2. Manually move it to **Planning** (the first persona-assigned state)
3. The Product Manager persona is dispatched automatically
4. When it completes, the Router decides the next state
5. The next persona is dispatched, and so on

Watch the **Agent Monitor** page for live terminal output, and the **Activity Feed** for a chronological event stream.

## Development Tips

- **Dev server port check:** `pnpm dev` uses `scripts/dev.sh` which skips starting a service if its port is already in use. Safe to run multiple times.
- **Database reset:** `pnpm db:reset` drops and re-creates the development database.
- **Demo seed:** `pnpm db:seed-demo` populates with realistic demo data.
- **Separate databases:** Development uses `agentops-dev.db` (local), production uses `~/.agentops/data/agentops.db`.

## What's Next

- [Architecture](architecture.md) — understand how the system is built
- [Workflow](workflow.md) — deep dive into the state machine and routing
- [Personas](personas.md) — create custom personas with your own prompts
- [MCP Tools](mcp-tools.md) — tools available to AI agents
- [API Reference](api.md) — integrate with the REST API and WebSocket
- [Deployment](deployment.md) — run AgentOps as a production service

### Evaluated SDK Features

These SDK capabilities have been evaluated and documented for future use:

- **[Plugins](spikes/plugin-system.md)** — extend personas with custom skills from local directories or marketplace registries
- **[HTTP Hooks](spikes/http-hooks.md)** — send webhook notifications to Slack, PagerDuty, etc. on agent events (zero code — settings only)
- **[Worktree Isolation](spikes/worktree-isolation.md)** — isolate concurrent agent executions in separate git worktrees
- **[Remote Execution](spikes/bridge-api-remote.md)** — run agent processes on remote hosts via SSH, Docker, or cloud
- **[Browser SDK](spikes/browser-sdk-pico.md)** — client-side Pico chat via WebSocket transport
