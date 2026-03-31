# AgentOps — Project Knowledge

AgentOps is a local-first application that orchestrates AI coding agents through a workflow pipeline. It has a React/Vite frontend, Fastify backend, SQLite storage, and uses the Claude Agent SDK for agent execution.

## Workflow States

Work items flow through these states:

- **Backlog** — New items, not yet planned. Entry point for all work.
- **Planning** — Product Manager writes acceptance criteria and scope.
- **Decomposition** — Tech Lead breaks the item into child tasks with dependencies.
- **Ready** — Fully specified, waiting to be picked up by an engineer.
- **In Progress** — Engineer is actively implementing the work.
- **In Review** — Code Reviewer checks the implementation for correctness.
- **Done** — Approved and complete. Final state.
- **Blocked** — Cannot proceed. Can return to any earlier state once unblocked.

Transitions: Backlog > Planning > Ready > In Progress > In Review > Done. The Router can also send items to Decomposition or Blocked from several states.

## Personas (AI Agents)

Five workflow personas handle work automatically:

| Persona | Role | Model |
|---|---|---|
| **Product Manager** | Writes criteria, prioritizes | Sonnet |
| **Tech Lead** | Decomposes into subtasks | Opus |
| **Engineer** | Writes and modifies code | Sonnet |
| **Code Reviewer** | Reviews for correctness | Sonnet |
| **Router** | Decides state transitions | Haiku |

Each persona has allowed SDK tools (Read, Edit, Bash, etc.) and MCP tools (post_comment, route_to_state, etc.).

## How Work Items Flow

1. User creates a work item (lands in Backlog)
2. Router moves it to Planning; PM writes acceptance criteria
3. Router moves to Decomposition; Tech Lead creates child tasks
4. Children move to Ready, then In Progress for the Engineer
5. Engineer completes work; Router moves to In Review
6. Code Reviewer approves (Done) or rejects (back to In Progress)
7. If rejected 3+ times, auto-moved to Blocked

Parent items auto-complete when all children are Done.

## Execution History

Each time a persona works on an item, an execution record is created with: status, duration, cost, summary, and outcome (success/failure/rejected). Comments are posted during execution to track decisions and progress.

## Common Questions

**How do I create a work item?** Use the Work Items page — click "New Item", fill in title and description, it starts in Backlog.

**How do I trigger an agent?** Agents run automatically when the Router moves items to states with assigned personas. You can also use the play/pause control in the dashboard.

**Why is my item stuck?** Check: Is it Blocked? (read the blocker comment) Is there no persona assigned to its state? Has the Router not picked it up yet? Check the execution history for errors.

**What does Blocked mean?** The item can't proceed — either flagged by an agent, or auto-blocked after 3 rejection cycles. Read the comments for the specific reason.

**How do I change the assigned persona?** Go to Settings > Workflow, where each state has a persona dropdown.

## Finding More Information

For architecture, API, or deployment details, search the `docs/` directory using Read and Glob tools. Key files: `docs/architecture.md`, `docs/api.md`, `docs/workflow.md`, `docs/personas.md`, `docs/data-model.md`.
