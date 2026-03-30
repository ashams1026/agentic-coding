# AgentOps

A local-first application that orchestrates AI coding agents through a workflow-driven pipeline. Runs as a system service on your machine with a web-based UI for managing work items, monitoring agent activity, and reviewing results. A Router agent automatically transitions work items between workflow states, creating a fully autonomous development pipeline that you can toggle on or off.

## Key Features

- **Workflow Engine** — 8-state machine (Backlog → Planning → Decomposition → Ready → In Progress → In Review → Done / Blocked) with automatic transitions
- **Agent Personas** — Configurable AI personas (Product Manager, Tech Lead, Engineer, Code Reviewer, Router) assigned per workflow state
- **Work Item Hierarchy** — Recursive parent-child work items with dependency graph and automatic parent coordination
- **Real-time Monitoring** — Live agent terminal output, execution timeline, cost tracking, and activity feed via WebSocket
- **MCP Tool System** — 7 built-in tools agents use to interact with the system (post comments, create children, route state, etc.)
- **Cost Management** — Monthly/daily spend caps, warning thresholds, per-execution cost tracking
- **Project Memory** — Agents build cumulative project context from completed work
- **Local-first** — SQLite storage, runs on your machine, no cloud dependency

## Architecture

```
packages/
  frontend/    React 19 + Vite + Tailwind + shadcn/ui + TanStack Query + Zustand
  backend/     Fastify + better-sqlite3 + Drizzle ORM + WebSocket + Claude Agent SDK
  shared/      TypeScript types and constants shared between packages
```

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 9

### Install & Run

```bash
# Clone the repository
git clone https://github.com/ashams1026/agentic-coding.git
cd agentic-coding

# Install dependencies
pnpm install

# Start development servers (frontend + backend)
pnpm dev
```

The frontend runs at `http://localhost:5173` and the backend API at `http://localhost:3001`.

### Production (pm2)

```bash
# Build all packages
pnpm build

# Start as a background service
pnpm service:start

# Check status
pnpm service:status

# View logs
pnpm service:logs
```

### Configuration

Configuration lives at `~/.agentops/config.json`. Set your Anthropic API key in the Settings UI or via CLI:

```bash
npx agentops config set anthropicApiKey sk-ant-...
```

See [docs/deployment.md](docs/deployment.md) for all configuration options.

## Documentation

| Document | Description |
|---|---|
| [Getting Started](docs/getting-started.md) | Step-by-step setup and first workflow |
| [Architecture](docs/architecture.md) | System design, packages, data flow |
| [Data Model](docs/data-model.md) | Entities, relationships, schemas |
| [Workflow](docs/workflow.md) | State machine, transitions, routing |
| [Personas](docs/personas.md) | Agent roles, prompts, configuration |
| [API Reference](docs/api.md) | REST endpoints, WebSocket protocol |
| [MCP Tools](docs/mcp-tools.md) | Agent tool descriptions and schemas |
| [Deployment](docs/deployment.md) | Configuration, service management, CLI |
| [Frontend](docs/frontend.md) | UI architecture, components, patterns |

## Development

```bash
pnpm dev          # Start all packages in dev mode
pnpm build        # Build all packages
pnpm test         # Run tests
pnpm lint         # Lint source files
pnpm typecheck    # Type-check all packages
```

## License

Private — not open source.
