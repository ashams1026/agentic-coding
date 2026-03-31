import { db } from "./connection.js";
import { runMigrations } from "./migrate.js";
import {
  projects,
  personas,
  workItems,
  workItemEdges,
  personaAssignments,
  executions,
  comments,
  proposals,
  projectMemories,
} from "./schema.js";

// ── Fixed IDs (matching frontend fixtures) ────────────────────────

const PROJECT_ID = "pj-agntops";

const PERSONA_PM = "ps-pm00001";
const PERSONA_TECH_LEAD = "ps-tl00001";
const PERSONA_ENGINEER = "ps-en00001";
const PERSONA_REVIEWER = "ps-rv00001";
const PERSONA_ROUTER = "ps-rt00001";

const WI_AUTH = "wi-auth001";
const WI_DASH = "wi-dash002";
const WI_NOTI = "wi-noti003";

const WI_AUTH_1 = "wi-au01001";
const WI_AUTH_2 = "wi-au01002";
const WI_AUTH_3 = "wi-au01003";

const WI_DASH_1 = "wi-da02001";
const WI_DASH_2 = "wi-da02002";
const WI_DASH_3 = "wi-da02003";

const WI_NOTI_1 = "wi-no03001";
const WI_NOTI_2 = "wi-no03002";
const WI_NOTI_3 = "wi-no03003";
const WI_NOTI_4 = "wi-no03004";

const WI_AUTH_1_A = "wi-au1a001";
const WI_AUTH_1_B = "wi-au1b001";
const WI_AUTH_2_A = "wi-au2a001";

const EXEC_1 = "ex-exec001";
const EXEC_2 = "ex-exec002";
const EXEC_3 = "ex-exec003";
const EXEC_4 = "ex-exec004";
const EXEC_5 = "ex-exec005";
const EXEC_6 = "ex-exec006";
const EXEC_7 = "ex-exec007";
const EXEC_8 = "ex-exec008";
const EXEC_9 = "ex-exec009";
const EXEC_10 = "ex-exec010";

// ── Helper ────────────────────────────────────────────────────────

function d(iso: string): Date {
  return new Date(iso);
}

// ── Seed ──────────────────────────────────────────────────────────

export async function seed() {
  // Ensure tables exist via migrations
  runMigrations();

  // Clear existing data (reverse dependency order)
  await db.delete(projectMemories);
  await db.delete(proposals);
  await db.delete(comments);
  await db.delete(executions);
  await db.delete(personaAssignments);
  await db.delete(workItemEdges);
  await db.delete(workItems);
  await db.delete(personas);
  await db.delete(projects);

  // ── Projects ──────────────────────────────────────────────────────
  await db.insert(projects).values({
    id: PROJECT_ID,
    name: "AgentOps",
    path: "/Users/dev/projects/agentops",
    settings: { maxConcurrent: 3, monthCap: 50, autoRouting: true },
    createdAt: d("2026-03-20T10:00:00Z"),
  });

  // ── Personas ──────────────────────────────────────────────────────
  await db.insert(personas).values([
    {
      id: PERSONA_PM,
      name: "Product Manager",
      description: "Writes acceptance criteria, defines scope, and prioritizes work items.",
      avatar: { color: "#7c3aed", icon: "clipboard-list" },
      systemPrompt: `You are the **Product Manager** agent for the AgentOps project.

## When You Run
You are triggered when a work item enters the **Planning** state. The Router agent decides when to send items to you — you do NOT control state transitions.

## What You Receive
- The work item's title and description
- Any existing comments (including user comments with context or requirements)
- Access to the codebase via Read, Glob, Grep tools to understand the project

## Your Job
Write structured acceptance criteria and post them as a comment on the work item. This is your ONLY output.

### Acceptance Criteria Format
Post a comment with this structure:

\`\`\`
## Acceptance Criteria

**Scope:** [One-sentence summary of what this work item delivers]

**In scope:**
- [ ] [Criterion 1 — specific, testable behavior]
- [ ] [Criterion 2 — include edge cases]
- [ ] [Criterion 3 — error handling if relevant]

**Out of scope:**
- [Thing that might be assumed but is NOT part of this work item]

**Priority recommendation:** [p0/p1/p2/p3 with brief justification]

**Open questions:**
- [Any ambiguity that needs user input before engineering starts]
\`\`\`

### Guidelines
- Each criterion must be independently verifiable — "user can..." not "use library X"
- Include edge cases and error scenarios
- If the description is vague, make reasonable assumptions and document them explicitly
- Read the codebase (use Glob/Grep) to understand existing patterns before writing criteria
- Use \`list_items\` to check for related or duplicate work items
- Use \`get_context\` to understand the project's architecture and conventions

## What "Done" Looks Like
- You have posted exactly ONE comment with structured acceptance criteria
- You have flagged any open questions
- That's it. The Router agent handles the state transition after you.

## What NOT To Do
- Do NOT try to write code or implement anything
- Do NOT decompose the work item into subtasks (that's the Tech Lead's job)
- Do NOT call \`route_to_state\` — you don't have this tool, and transitions are the Router's job
- Do NOT post multiple comments — consolidate everything into one structured comment
- Do NOT skip reading the codebase — your criteria must be grounded in reality`,
      model: "sonnet",
      allowedTools: ["Read", "Glob", "Grep", "WebSearch"],
      mcpTools: ["post_comment", "list_items", "get_context", "request_review"],
      maxBudgetPerRun: 50,
      settings: {},
    },
    {
      id: PERSONA_TECH_LEAD,
      name: "Tech Lead",
      description: "Decomposes work items into children with dependency graphs.",
      avatar: { color: "#2563eb", icon: "git-branch" },
      systemPrompt: `You are the **Tech Lead** agent for the AgentOps project.

## When You Run
You are triggered when a work item enters the **Decomposition** state. The PM has already defined acceptance criteria — they will be attached as comments on the work item.

## What You Receive
- The work item with title, description, and acceptance criteria (as comments)
- Access to the full codebase via Read, Glob, Grep, Bash tools

## Your Job
Decompose the work item into child tasks using the \`create_children\` tool, then post an architectural rationale comment.

### Step 1: Read the Codebase
Before decomposing, you MUST understand the current architecture:
- Use \`get_context\` to understand project conventions and architecture
- Use Glob/Grep to find relevant files, patterns, and existing implementations
- Use \`list_items\` to check for related work items or prior art
- Read CLAUDE.md if it exists for project conventions
- Never guess at file paths or component names — verify they exist

### Step 2: Decompose via \`create_children\`
Call \`create_children\` with an array of child work items. Each child must include:
- **Clear title** — what specifically will be built/changed
- **Detailed description** — file paths, component names, acceptance criteria for this subtask
- **Dependency edges** — which children block which (earlier items are prerequisites)

### Granularity Guidelines
- **2-8 children** is typical. Fewer than 2 means decomposition wasn't needed. More than 8 means the parent is too large.
- Each child = **one commit, one agent session**. If a child needs multiple commits, it's too big — split it further.
- Include file paths like: "In \`packages/frontend/src/features/kanban/\`: create KanbanColumn component..."
- Children should be ordered by dependency — the first child should have no blockers.

### Step 3: Post Architectural Comment
After creating children, post a comment explaining:
- Your decomposition rationale (why this breakdown, what alternatives you considered)
- Key architectural decisions (which patterns to follow, which libraries to use)
- Any risks or open questions for the Engineer agents

### When to Skip Decomposition
If the work item is already small enough for a single agent session:
- Post a comment explaining: "This item is small enough to implement directly — no decomposition needed."
- The Router will handle moving it to Ready.

## What "Done" Looks Like
- Children created via \`create_children\` with clear descriptions and dependency edges
- One architectural rationale comment posted
- That's it. The Router handles the state transition.

## What NOT To Do
- Do NOT write code or implement anything — you only plan
- Do NOT call \`route_to_state\` — transitions are the Router's job
- Do NOT guess at file paths — use Glob/Grep to verify
- Do NOT create children without reading the codebase first
- Do NOT create more than 8 children — if you need more, the parent is too large`,
      model: "opus",
      allowedTools: ["Read", "Glob", "Grep", "WebSearch", "Bash"],
      mcpTools: ["create_children", "post_comment", "get_context", "list_items"],
      maxBudgetPerRun: 100,
      settings: {},
    },
    {
      id: PERSONA_ENGINEER,
      name: "Engineer",
      description: "Implements work items by writing and modifying code.",
      avatar: { color: "#059669", icon: "code" },
      systemPrompt: `You are the **Engineer** agent for the AgentOps project.

## When You Run
You are triggered when a work item enters the **In Progress** state. You may be working on a fresh item or re-working one that was rejected in review.

## What You Receive
- The work item's title, description, and acceptance criteria (posted by the PM as comments)
- Parent context if this is a child task (the Tech Lead's decomposition comment)
- Rejection feedback if this is a rework (the Reviewer's comment with specific issues)
- Access to the full codebase via Read, Edit, Write, Glob, Grep, Bash tools

## Your Job
Implement the work item, verify the build passes, and post a completion comment.

### Step 1: Read Before Writing
Before writing ANY code:
- Use \`get_context\` to understand project conventions
- Use Glob/Grep to find similar implementations and established patterns
- Read the files you plan to modify to understand their current state
- If CLAUDE.md exists, read it for coding conventions
- Understand the acceptance criteria — every criterion must be addressed

### Step 2: Implement
Follow these conventions:
- **TypeScript strict mode** across all packages
- **shadcn/ui** components and **Tailwind CSS** for UI work
- **Dark mode** support on every new component
- **Named exports** over default exports
- **kebab-case** file names, **PascalCase** component names
- Use \`cn()\` utility for conditional class merging
- Prefer editing existing files over creating new ones
- One work item = one focused set of changes. Do NOT refactor surrounding code.

### Step 3: Verify Build
Run \`pnpm build\` and ensure zero errors. This is mandatory — do not skip it.
If the build fails, fix the errors before posting your completion comment.

### Step 4: Post Completion Comment
Use \`post_comment\` to summarize:
- What was implemented
- Files created or modified
- Any notes for the reviewer (trade-offs, decisions, areas to pay attention to)

## Handling Rejection Feedback
If your work item has rejection feedback from a previous review cycle:
- Read the feedback comment carefully — it lists specific issues
- Address **EVERY** point in the feedback. Do not skip any.
- If you disagree with a point, address it anyway and explain your reasoning in the completion comment
- The reviewer will check that all feedback was addressed

## When to Use \`flag_blocked\`
Call \`flag_blocked\` when you genuinely cannot proceed:
- A dependency (another work item) must be completed first
- The requirements are unclear and you cannot make a reasonable assumption
- A test or build failure you cannot fix (infrastructure issue, not your bug)
Do NOT flag as blocked just because a task is difficult.

## What NOT To Do
- Do NOT refactor surrounding code beyond what the task requires
- Do NOT add features beyond the acceptance criteria scope
- Do NOT skip build verification (\`pnpm build\` must pass)
- Do NOT call \`route_to_state\` — you don't have this tool; the Router handles transitions
- Do NOT add unnecessary comments, docstrings, or type annotations to code you didn't change
- Do NOT create new files when editing an existing file would suffice`,
      model: "sonnet",
      allowedTools: ["Read", "Edit", "Write", "Glob", "Grep", "Bash", "WebFetch"],
      mcpTools: ["post_comment", "flag_blocked", "get_context"],
      maxBudgetPerRun: 200,
      settings: {},
    },
    {
      id: PERSONA_REVIEWER,
      name: "Code Reviewer",
      description: "Reviews code changes for correctness, style, and completeness.",
      avatar: { color: "#d97706", icon: "eye" },
      systemPrompt: `You are the Code Reviewer agent for the AgentOps project.
You run when a work item enters the "In Review" state.

## What you receive
- The work item title, description, and acceptance criteria (from PM comments).
- Full execution history via get_context (prior executions, comments, rejection history).
- The Engineer's completion comment listing files changed and what was done.

## Your workflow

### Step 1 — Gather context
1. Call get_context(workItemId, includeMemory: false) to get execution history and comments.
2. Identify which files were changed from the Engineer's completion comment.
3. Read the acceptance criteria from the PM's comments (look for checkbox lists).

### Step 2 — Read every modified file
Use Read, Glob, and Grep to inspect every file the Engineer changed.
Do NOT skip files — review them all.

### Step 3 — Verify the build
Run \`pnpm build\` via Bash. If the build fails, that is an automatic rejection.

### Step 4 — Review against checklist
For each acceptance criterion, verify the implementation satisfies it:
- [ ] Implementation matches each acceptance criterion (check them off one by one)
- [ ] No obvious bugs, logic errors, or missing edge cases
- [ ] TypeScript types correct (no \`any\` unless justified, strict mode compatible)
- [ ] Naming conventions followed (kebab-case files, PascalCase components, named exports)
- [ ] No hardcoded values — uses mock data, constants, or config
- [ ] Error handling appropriate at system boundaries
- [ ] Dark mode supported (UI components use Tailwind dark: variants or CSS variables)
- [ ] Responsive layout (1280px+ primary, graceful degradation)
- [ ] No security vulnerabilities (XSS, injection, exposed secrets)
- [ ] Follows existing patterns in the codebase (check similar files for consistency)
- [ ] Build passes with zero errors

### Step 5 — Post verdict
Use post_comment to post a structured review comment:

**If approving:**
\`\`\`
## Review: Approved ✓
- [x] Criterion 1 — verified: [what you checked]
- [x] Criterion 2 — verified: [what you checked]
- Build: passes
- Files reviewed: [list]
Summary: [one sentence]
\`\`\`

**If rejecting:**
\`\`\`
## Review: Changes Requested
### Issues (by severity)
**HIGH** — [file:line] Description of the problem. Fix: [specific instruction].
**MEDIUM** — [file:line] Description. Fix: [instruction].
**LOW** — [file:line] Description. Fix: [instruction].
### What passed
- [x] Criterion that was met
- [ ] Criterion that was NOT met — [why]
Build: passes/fails
\`\`\`

## Important rules
- You do NOT transition state. The Router handles that based on your verdict.
- If you need human input on an ambiguous decision, use request_review to flag it.
- Use list_items if you need to check sibling/child work items for context.
- Address the CURRENT implementation — don't request changes beyond the task scope.
- Be specific in rejections: file names, line numbers, exact fix instructions.
- The Engineer has no memory of their previous run. Your rejection comment is ALL they get.

## Anti-patterns
- Do NOT approve without reading every changed file.
- Do NOT reject for style preferences not in CLAUDE.md conventions.
- Do NOT request additional features beyond the acceptance criteria.
- Do NOT try to fix code yourself — describe the issue and let the Engineer fix it.
- Do NOT use route_to_state — you are not the Router.`,
      model: "sonnet",
      allowedTools: ["Read", "Glob", "Grep", "Bash"],
      mcpTools: ["post_comment", "get_context", "list_items", "request_review"],
      maxBudgetPerRun: 50,
      settings: {},
    },
    {
      id: PERSONA_ROUTER,
      name: "Router",
      description: "Routes work items between workflow states based on execution outcomes.",
      avatar: { color: "#6366f1", icon: "route" },
      systemPrompt: `You are the Router agent for the AgentOps workflow system.
You run after every persona completes work on a work item. Your ONLY job is to decide
the next workflow state and execute the transition.

## Valid transitions map
\`\`\`
Backlog       → [Planning]
Planning      → [Ready, Blocked]
Ready         → [In Progress, Decomposition, Blocked]
Decomposition → [In Progress, Blocked]
In Progress   → [In Review, Blocked]
In Review     → [Done, In Progress]
Blocked       → [Planning, Decomposition, Ready, In Progress]
Done          → [] (terminal)
\`\`\`

## Your workflow

### Step 1 — Gather context
Call get_context(workItemId, includeMemory: false) to get:
- The work item's current state
- Execution history (what persona just ran, what they did)
- Comments (acceptance criteria, review verdicts, blocker reasons)

### Step 2 — Check children if relevant
If the work item has children (was decomposed), call list_items(parentId: workItemId)
to check their states. This matters for parent coordination.

### Step 3 — Decide the next state
Based on current state and what just happened:

**Planning → Ready**: PM has posted acceptance criteria. Always route to Ready.
**Planning → Blocked**: PM flagged an issue or requirements are unclear.

**Ready → Decomposition**: Item needs to be broken into children by Tech Lead.
**Ready → In Progress**: Item is small enough to implement directly (no children needed).
**Ready → Blocked**: Something is preventing work from starting.

**Decomposition → In Progress**: Tech Lead has created children. Route parent so dispatch can assign children.
**Decomposition → Blocked**: Tech Lead could not decompose (missing info, unclear scope).

**In Progress → In Review**: Engineer posted a completion comment. Route to review.
**In Progress → Blocked**: Engineer flagged a blocker via flag_blocked.

**In Review → Done**: Reviewer approved. Work is complete.
**In Review → In Progress**: Reviewer rejected with feedback. Include the rejection context so the Engineer knows what to fix.

**Blocked → [varies]**: A blocker was resolved. Route back to the appropriate state based on what was blocked and what needs to happen next.

### Step 4 — Post a routing comment
Call post_comment to explain your decision in ONE line:
"Routing to [State]: [brief reason]"

### Step 5 — Execute the transition
Call route_to_state with the workItemId, targetState, and reasoning.

## Critical rules
- NEVER route to the current state. If work appears incomplete, route to Blocked with a reason.
- NEVER route backwards more than one step (e.g., don't go from In Review back to Planning).
- ALWAYS check the execution outcome before deciding — read the persona's summary comment.
- If the previous persona's work seems incomplete or unclear, route to Blocked rather than guessing.
- You make exactly ONE routing decision per invocation, then stop.

## Anti-patterns
- Do NOT read or write code. You have no SDK tools — only MCP tools.
- Do NOT post long comments. One line explaining the routing decision is sufficient.
- Do NOT route to a state the item was just in (creates loops).
- Do NOT route to Done unless the Reviewer explicitly approved.
- Do NOT skip states (e.g., Planning directly to In Progress — go through Ready first).`,
      model: "haiku",
      allowedTools: [],
      mcpTools: ["route_to_state", "list_items", "get_context", "post_comment"],
      maxBudgetPerRun: 10,
      settings: { isSystem: true },
    },
  ]);

  // ── Work Items ────────────────────────────────────────────────────
  // Top-level
  await db.insert(workItems).values([
    {
      id: WI_AUTH, parentId: null, projectId: PROJECT_ID,
      title: "User authentication with OAuth2",
      description: "Implement OAuth2 login flow with Google and GitHub providers. Users should be able to sign in, sign out, and have their session persisted.",
      context: { acceptanceCriteria: "- Google OAuth login works\n- GitHub OAuth login works\n- Session persists across page reloads\n- Logout clears session\n- Protected routes redirect to login", notes: "Use passport.js for the backend implementation." },
      currentState: "In Progress", priority: "p0", labels: ["auth", "security"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-21T09:00:00Z"), updatedAt: d("2026-03-27T14:30:00Z"),
    },
    {
      id: WI_DASH, parentId: null, projectId: PROJECT_ID,
      title: "Dashboard analytics widgets",
      description: "Build the main dashboard with cost tracking, agent activity charts, and project health indicators.",
      context: { acceptanceCriteria: "- Cost chart shows last 7 days\n- Active agent count is live\n- Project health shows red/green indicators\n- Responsive layout", notes: "Use recharts for charts. Mock data for now." },
      currentState: "Decomposition", priority: "p1", labels: ["dashboard", "ui"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-22T11:00:00Z"), updatedAt: d("2026-03-26T16:00:00Z"),
    },
    {
      id: WI_NOTI, parentId: null, projectId: PROJECT_ID,
      title: "Real-time notification system",
      description: "Implement toast notifications and an activity feed that update in real-time via WebSocket.",
      context: { acceptanceCriteria: "- Toast notifications appear for key events\n- Activity feed updates without refresh\n- Unread count badge on nav\n- Notification preferences in settings", notes: "" },
      currentState: "Backlog", priority: "p2", labels: ["notifications", "websocket"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-23T08:30:00Z"), updatedAt: d("2026-03-23T08:30:00Z"),
    },
  ]);

  // Children of WI_AUTH
  await db.insert(workItems).values([
    {
      id: WI_AUTH_1, parentId: WI_AUTH, projectId: PROJECT_ID,
      title: "Set up OAuth2 backend routes",
      description: "Create /auth/google and /auth/github routes with passport strategies.",
      context: { inheritedContext: "Implement OAuth2 login flow with Google and GitHub providers." },
      currentState: "Done", priority: "p0", labels: ["auth"],
      assignedPersonaId: PERSONA_ENGINEER,
      executionContext: [
        { executionId: EXEC_4, summary: "Initial attempt at OAuth routes — used express-session directly without passport.", outcome: "rejected", rejectionPayload: { reason: "Session handling bypasses passport.js integration. Routes lack CSRF protection.", severity: "high", hint: "Use passport.js strategies for OAuth providers. Add csurf middleware.", retryCount: 1 } },
        { executionId: EXEC_1, summary: "Implemented OAuth routes with passport.js. Added CSRF protection via csurf middleware. Google and GitHub strategies configured.", outcome: "success", rejectionPayload: null },
      ],
      createdAt: d("2026-03-24T10:00:00Z"), updatedAt: d("2026-03-25T11:30:00Z"),
    },
    {
      id: WI_AUTH_2, parentId: WI_AUTH, projectId: PROJECT_ID,
      title: "Build login UI component",
      description: "Create login page with Google and GitHub sign-in buttons.",
      context: { inheritedContext: "Implement OAuth2 login flow with Google and GitHub providers." },
      currentState: "In Progress", priority: "p0", labels: ["auth", "ui"],
      assignedPersonaId: PERSONA_ENGINEER,
      executionContext: [
        { executionId: EXEC_5, summary: "Building login page with social sign-in buttons. Implementing Google and GitHub OAuth flows.", outcome: "success", rejectionPayload: null },
      ],
      createdAt: d("2026-03-24T10:05:00Z"), updatedAt: d("2026-03-27T14:30:00Z"),
    },
    {
      id: WI_AUTH_3, parentId: WI_AUTH, projectId: PROJECT_ID,
      title: "Add session persistence and protected routes",
      description: "Implement session storage and route guards for authenticated pages.",
      context: { inheritedContext: "Implement OAuth2 login flow with Google and GitHub providers." },
      currentState: "Ready", priority: "p0", labels: ["auth"],
      assignedPersonaId: PERSONA_ENGINEER, executionContext: [],
      createdAt: d("2026-03-24T10:10:00Z"), updatedAt: d("2026-03-24T10:10:00Z"),
    },
  ]);

  // Children of WI_DASH
  await db.insert(workItems).values([
    {
      id: WI_DASH_1, parentId: WI_DASH, projectId: PROJECT_ID,
      title: "Create cost tracking chart component",
      description: "Build a recharts-based sparkline chart showing 7-day cost history.",
      context: { inheritedContext: "Build the main dashboard with cost tracking widgets." },
      currentState: "Backlog", priority: "p1", labels: ["dashboard"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-25T09:00:00Z"), updatedAt: d("2026-03-25T09:00:00Z"),
    },
    {
      id: WI_DASH_2, parentId: WI_DASH, projectId: PROJECT_ID,
      title: "Build active agents display strip",
      description: "Horizontal scrollable row of agent cards with live status indicators.",
      context: { inheritedContext: "Build the main dashboard with agent activity charts." },
      currentState: "Backlog", priority: "p1", labels: ["dashboard"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-25T09:05:00Z"), updatedAt: d("2026-03-25T09:05:00Z"),
    },
    {
      id: WI_DASH_3, parentId: WI_DASH, projectId: PROJECT_ID,
      title: "Build project health indicator widget",
      description: "Red/green health indicators for build status, test coverage, and uptime.",
      context: { inheritedContext: "Build the main dashboard with project health indicators." },
      currentState: "Backlog", priority: "p1", labels: ["dashboard"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-25T09:10:00Z"), updatedAt: d("2026-03-25T09:10:00Z"),
    },
  ]);

  // Children of WI_NOTI
  await db.insert(workItems).values([
    {
      id: WI_NOTI_1, parentId: WI_NOTI, projectId: PROJECT_ID,
      title: "Create toast notification component",
      description: "Non-blocking toast notifications with success/error/info/warning variants.",
      context: { inheritedContext: "Implement toast notifications that update in real-time." },
      currentState: "Backlog", priority: "p2", labels: ["notifications"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-26T08:00:00Z"), updatedAt: d("2026-03-26T08:00:00Z"),
    },
    {
      id: WI_NOTI_2, parentId: WI_NOTI, projectId: PROJECT_ID,
      title: "Build activity feed component",
      description: "Chronological event stream with filtering and real-time updates.",
      context: { inheritedContext: "Implement an activity feed that updates in real-time via WebSocket." },
      currentState: "Backlog", priority: "p2", labels: ["notifications"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-26T08:05:00Z"), updatedAt: d("2026-03-26T08:05:00Z"),
    },
    {
      id: WI_NOTI_3, parentId: WI_NOTI, projectId: PROJECT_ID,
      title: "Wire WebSocket events to notifications",
      description: "Connect WS events to toast triggers and activity feed updates.",
      context: { inheritedContext: "Implement real-time notification system." },
      currentState: "Backlog", priority: "p2", labels: ["notifications", "websocket"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-26T08:10:00Z"), updatedAt: d("2026-03-26T08:10:00Z"),
    },
    {
      id: WI_NOTI_4, parentId: WI_NOTI, projectId: PROJECT_ID,
      title: "Add notification preferences to settings",
      description: "Settings panel for enabling/disabling notification types and sounds.",
      context: { inheritedContext: "Notification preferences in settings." },
      currentState: "Backlog", priority: "p2", labels: ["notifications", "settings"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-26T08:15:00Z"), updatedAt: d("2026-03-26T08:15:00Z"),
    },
  ]);

  // Grandchildren
  await db.insert(workItems).values([
    {
      id: WI_AUTH_1_A, parentId: WI_AUTH_1, projectId: PROJECT_ID,
      title: "Configure Google OAuth strategy",
      description: "Set up passport-google-oauth20 strategy with client credentials and callback handler.",
      context: { inheritedContext: "Set up OAuth2 backend routes with passport strategies." },
      currentState: "Done", priority: "p0", labels: ["auth"],
      assignedPersonaId: PERSONA_ENGINEER, executionContext: [],
      createdAt: d("2026-03-24T10:15:00Z"), updatedAt: d("2026-03-25T10:00:00Z"),
    },
    {
      id: WI_AUTH_1_B, parentId: WI_AUTH_1, projectId: PROJECT_ID,
      title: "Configure GitHub OAuth strategy",
      description: "Set up passport-github2 strategy with client credentials and callback handler.",
      context: { inheritedContext: "Set up OAuth2 backend routes with passport strategies." },
      currentState: "Done", priority: "p0", labels: ["auth"],
      assignedPersonaId: PERSONA_ENGINEER, executionContext: [],
      createdAt: d("2026-03-24T10:20:00Z"), updatedAt: d("2026-03-25T10:30:00Z"),
    },
    {
      id: WI_AUTH_2_A, parentId: WI_AUTH_2, projectId: PROJECT_ID,
      title: "Design login page layout",
      description: "Create responsive login page layout with centered card and social button placement.",
      context: { inheritedContext: "Build login UI component with social sign-in buttons." },
      currentState: "Done", priority: "p0", labels: ["auth", "ui"],
      assignedPersonaId: PERSONA_ENGINEER, executionContext: [],
      createdAt: d("2026-03-27T14:00:00Z"), updatedAt: d("2026-03-27T14:20:00Z"),
    },
  ]);

  // ── Work Item Edges ───────────────────────────────────────────────
  await db.insert(workItemEdges).values([
    { id: "we-edge001", fromId: WI_AUTH_1, toId: WI_AUTH_2, type: "blocks" },
    { id: "we-edge002", fromId: WI_AUTH_2, toId: WI_AUTH_3, type: "blocks" },
    { id: "we-edge003", fromId: WI_NOTI_1, toId: WI_NOTI_3, type: "depends_on" },
    { id: "we-edge004", fromId: WI_NOTI_2, toId: WI_NOTI_3, type: "depends_on" },
  ]);

  // ── Persona Assignments ───────────────────────────────────────────
  await db.insert(personaAssignments).values([
    { projectId: PROJECT_ID, stateName: "Planning", personaId: PERSONA_PM },
    { projectId: PROJECT_ID, stateName: "Decomposition", personaId: PERSONA_TECH_LEAD },
    { projectId: PROJECT_ID, stateName: "Ready", personaId: PERSONA_ROUTER },
    { projectId: PROJECT_ID, stateName: "In Progress", personaId: PERSONA_ENGINEER },
    { projectId: PROJECT_ID, stateName: "In Review", personaId: PERSONA_REVIEWER },
  ]);

  // ── Executions ────────────────────────────────────────────────────
  await db.insert(executions).values([
    {
      id: EXEC_7, workItemId: WI_AUTH_1, personaId: PERSONA_REVIEWER,
      status: "completed", startedAt: d("2026-03-25T08:00:00Z"), completedAt: d("2026-03-25T08:03:15Z"),
      costUsd: 22, durationMs: 195000,
      summary: "Reviewed initial OAuth implementation. Found session handling bypasses passport.js and routes lack CSRF protection.",
      outcome: "rejected",
      rejectionPayload: { reason: "Session handling bypasses passport.js integration. Routes lack CSRF protection.", severity: "high", hint: "Use passport.js strategies for OAuth providers. Add csurf middleware.", retryCount: 1 },
      logs: "Reading auth routes...\nChecking session handling...\nFound: express-session used directly without passport serialize/deserialize.\nChecking CSRF protection...\nNo csurf middleware found.\nRejecting with high severity.",
    },
    {
      id: EXEC_1, workItemId: WI_AUTH_1, personaId: PERSONA_ENGINEER,
      status: "completed", startedAt: d("2026-03-25T10:00:00Z"), completedAt: d("2026-03-25T10:04:32Z"),
      costUsd: 42, durationMs: 272000,
      summary: "Implemented OAuth2 routes for Google and GitHub using passport.js strategies.",
      outcome: "success", rejectionPayload: null,
      logs: "Reading project structure...\nCreating auth routes...\nAdding passport strategies...\nTesting OAuth flow...\nAll tests passing.",
    },
    {
      id: EXEC_2, workItemId: WI_AUTH, personaId: PERSONA_PM,
      status: "completed", startedAt: d("2026-03-24T09:15:00Z"), completedAt: d("2026-03-24T09:17:45Z"),
      costUsd: 18, durationMs: 165000,
      summary: "Wrote acceptance criteria for OAuth2 authentication.",
      outcome: "success", rejectionPayload: null,
      logs: "Analyzing requirements...\nWriting acceptance criteria...\nPosting criteria as comment.",
    },
    {
      id: EXEC_3, workItemId: WI_AUTH, personaId: PERSONA_TECH_LEAD,
      status: "completed", startedAt: d("2026-03-24T09:30:00Z"), completedAt: d("2026-03-24T09:35:12Z"),
      costUsd: 85, durationMs: 312000,
      summary: "Decomposed auth item into 3 children with dependency graph.",
      outcome: "success", rejectionPayload: null,
      logs: "Reading item and acceptance criteria...\nDesigning breakdown...\nCreating 3 children...\nSetting up dependency edges.",
    },
    {
      id: EXEC_4, workItemId: WI_AUTH_2, personaId: PERSONA_ENGINEER,
      status: "running", startedAt: d("2026-03-27T14:25:00Z"), completedAt: null,
      costUsd: 31, durationMs: 0,
      summary: "", outcome: null, rejectionPayload: null,
      logs: "Reading context...\nScanning existing components...\nCreating login page component...",
    },
    {
      id: EXEC_5, workItemId: WI_DASH, personaId: PERSONA_PM,
      status: "completed", startedAt: d("2026-03-25T11:00:00Z"), completedAt: d("2026-03-25T11:02:30Z"),
      costUsd: 15, durationMs: 150000,
      summary: "Wrote acceptance criteria for dashboard analytics.",
      outcome: "success", rejectionPayload: null,
      logs: "Analyzing dashboard requirements...\nWriting acceptance criteria...\nDone.",
    },
    {
      id: EXEC_6, workItemId: WI_DASH, personaId: PERSONA_TECH_LEAD,
      status: "completed", startedAt: d("2026-03-26T10:00:00Z"), completedAt: d("2026-03-26T10:06:15Z"),
      costUsd: 92, durationMs: 375000,
      summary: "Decomposed dashboard item into 3 children.",
      outcome: "success", rejectionPayload: null,
      logs: "Reading item...\nDesigning component breakdown...\nCreating children with descriptions...\nDone.",
    },
    {
      id: EXEC_8, workItemId: WI_AUTH_3, personaId: PERSONA_REVIEWER,
      status: "running", startedAt: d("2026-03-27T14:30:00Z"), completedAt: null,
      costUsd: 12, durationMs: 0,
      summary: "", outcome: null, rejectionPayload: null,
      logs: "Reading submitted code changes...\nChecking OAuth token handling...\nVerifying CSRF middleware integration...",
    },
    {
      id: EXEC_9, workItemId: WI_AUTH_1, personaId: PERSONA_ROUTER,
      status: "completed", startedAt: d("2026-03-25T10:05:00Z"), completedAt: d("2026-03-25T10:05:08Z"),
      costUsd: 2, durationMs: 8000,
      summary: "Routed wi-au01001 from In Review → Done after successful review.",
      outcome: "success", rejectionPayload: null,
      logs: "Reading work item context...\nExecution outcome: success. Review passed.\nRouting to Done.",
    },
    {
      id: EXEC_10, workItemId: WI_AUTH, personaId: PERSONA_ROUTER,
      status: "completed", startedAt: d("2026-03-24T09:36:00Z"), completedAt: d("2026-03-24T09:36:05Z"),
      costUsd: 1, durationMs: 5000,
      summary: "Routed wi-auth001 from Planning → Decomposition after PM wrote criteria.",
      outcome: "success", rejectionPayload: null,
      logs: "Reading work item context...\nPM completed planning. Acceptance criteria written.\nRouting to Decomposition.",
    },
  ]);

  // ── Comments ──────────────────────────────────────────────────────
  await db.insert(comments).values([
    { id: "cm-cmt0001", workItemId: WI_AUTH, authorType: "user", authorId: null, authorName: "Amin", content: "This is our highest priority. We need auth before we can build any user-facing features.", metadata: {}, createdAt: d("2026-03-21T09:05:00Z") },
    { id: "cm-cmt0002", workItemId: WI_AUTH, authorType: "agent", authorId: PERSONA_PM, authorName: "Product Manager", content: "I've written the acceptance criteria. Key requirements: Google + GitHub OAuth, session persistence, protected routes, and clean logout flow.", metadata: { filesReferenced: ["src/routes/auth.ts"] }, createdAt: d("2026-03-24T09:17:45Z") },
    { id: "cm-cmt0003", workItemId: WI_AUTH, authorType: "agent", authorId: PERSONA_TECH_LEAD, authorName: "Tech Lead", content: "Decomposed into 3 children:\n1. OAuth backend routes (passport.js)\n2. Login UI component\n3. Session persistence + protected routes\n\nItems are ordered by dependency — each blocks the next.", metadata: { childrenCreated: 3, toolsUsed: ["create_children"] }, createdAt: d("2026-03-24T09:35:12Z") },
    { id: "cm-cmt0004", workItemId: WI_AUTH_1, authorType: "agent", authorId: PERSONA_ENGINEER, authorName: "Engineer", content: "OAuth routes implemented. Created `/auth/google` and `/auth/github` endpoints with passport strategies. Added callback handlers and session middleware.", metadata: { filesChanged: ["src/routes/auth.ts", "src/middleware/session.ts", "src/config/passport.ts"], toolsUsed: ["Edit", "Write", "Bash"] }, createdAt: d("2026-03-25T10:04:32Z") },
    { id: "cm-cmt0005", workItemId: WI_AUTH_1, authorType: "system", authorId: null, authorName: "System", content: "Work item moved to Done", metadata: {}, createdAt: d("2026-03-25T11:30:00Z") },
    { id: "cm-cmt0006", workItemId: WI_DASH, authorType: "agent", authorId: PERSONA_PM, authorName: "Product Manager", content: "Acceptance criteria defined. Focus on cost chart (recharts sparkline), live agent count, and project health indicators.", metadata: {}, createdAt: d("2026-03-25T11:02:30Z") },
    { id: "cm-cmt0007", workItemId: WI_DASH, authorType: "agent", authorId: PERSONA_TECH_LEAD, authorName: "Tech Lead", content: "Decomposed into 3 children: cost chart, agents strip, health widget. No hard dependencies between them — can be worked in parallel.", metadata: { childrenCreated: 3, toolsUsed: ["create_children"] }, createdAt: d("2026-03-26T10:06:15Z") },
    { id: "cm-cmt0008", workItemId: WI_NOTI, authorType: "user", authorId: null, authorName: "Amin", content: "Let's tackle this after the dashboard is done. Good to have the items scoped though.", metadata: {}, createdAt: d("2026-03-23T09:00:00Z") },
    { id: "cm-cmt0009", workItemId: WI_AUTH_2, authorType: "system", authorId: null, authorName: "System", content: "Work item started — Engineer agent running", metadata: {}, createdAt: d("2026-03-27T14:25:00Z") },
    { id: "cm-cmt0010", workItemId: WI_DASH_1, authorType: "user", authorId: null, authorName: "Amin", content: "Use recharts for consistency with the rest of the app. Sparkline style — no axes, just the line.", metadata: {}, createdAt: d("2026-03-25T09:30:00Z") },
    { id: "cm-cmt0011", workItemId: WI_AUTH, authorType: "system", authorId: null, authorName: "System", content: "Work item moved to In Progress", metadata: {}, createdAt: d("2026-03-25T10:00:00Z") },
    { id: "cm-cmt0012", workItemId: WI_DASH, authorType: "system", authorId: null, authorName: "System", content: "Work item moved to Decomposition", metadata: {}, createdAt: d("2026-03-26T10:00:00Z") },
    { id: "cm-cmt0013", workItemId: WI_AUTH_2, authorType: "agent", authorId: PERSONA_ENGINEER, authorName: "Engineer", content: "Starting work on the login UI. Will create a clean login page with social sign-in buttons matching our design system.", metadata: { toolsUsed: ["Read", "Glob"] }, createdAt: d("2026-03-27T14:26:00Z") },
    { id: "cm-cmt0014", workItemId: WI_AUTH, authorType: "user", authorId: null, authorName: "Amin", content: "Looking good so far. Make sure the login page has a nice loading state while OAuth redirects.", metadata: {}, createdAt: d("2026-03-27T15:00:00Z") },
    { id: "cm-cmt0015", workItemId: WI_NOTI_1, authorType: "user", authorId: null, authorName: "Amin", content: "For the toast component, use shadcn/ui's Sonner integration.", metadata: {}, createdAt: d("2026-03-26T08:30:00Z") },
    { id: "cm-cmt0016", workItemId: WI_AUTH_1, authorType: "agent", authorId: PERSONA_REVIEWER, authorName: "Code Reviewer", content: "Review passed. OAuth routes are correctly implemented with passport strategies. CSRF protection via csurf middleware is in place. Session handling uses passport serialize/deserialize.", metadata: { filesReviewed: ["src/routes/auth.ts", "src/middleware/session.ts", "src/config/passport.ts"] }, createdAt: d("2026-03-25T10:04:00Z") },
    { id: "cm-cmt0017", workItemId: WI_AUTH, authorType: "agent", authorId: PERSONA_ROUTER, authorName: "Router", content: "State transition: Planning → Decomposition\n\nPM has completed acceptance criteria. Moving to Decomposition for Tech Lead breakdown.", metadata: {}, createdAt: d("2026-03-24T09:36:05Z") },
  ]);

  // ── Proposals ─────────────────────────────────────────────────────
  await db.insert(proposals).values([
    {
      id: "pp-prop001", executionId: EXEC_3, workItemId: WI_AUTH, type: "task_creation",
      payload: { children: [
        { title: "Set up OAuth2 backend routes", description: "Create /auth/google and /auth/github routes" },
        { title: "Build login UI component", description: "Login page with social buttons" },
        { title: "Add session persistence", description: "Session storage and route guards" },
      ] },
      status: "approved", createdAt: d("2026-03-24T09:35:12Z"),
    },
    {
      id: "pp-prop002", executionId: EXEC_6, workItemId: WI_DASH, type: "task_creation",
      payload: { children: [
        { title: "Create cost tracking chart", description: "Recharts sparkline for 7-day history" },
        { title: "Build active agents strip", description: "Horizontal agent cards with status" },
        { title: "Build health indicator widget", description: "Red/green project health" },
      ] },
      status: "pending", createdAt: d("2026-03-26T10:06:15Z"),
    },
  ]);

  // ── Project Memories ──────────────────────────────────────────────
  await db.insert(projectMemories).values([
    {
      id: "pm-mem0001", projectId: PROJECT_ID, workItemId: WI_AUTH,
      summary: "OAuth2 authentication implemented with passport.js. Backend routes created for Google and GitHub providers.",
      filesChanged: ["src/routes/auth.ts", "src/middleware/session.ts", "src/config/passport.ts"],
      keyDecisions: ["Used passport.js over custom OAuth implementation", "Session stored in SQLite via better-sqlite3-session-store"],
      createdAt: d("2026-03-25T11:30:00Z"), consolidatedInto: null,
    },
    {
      id: "pm-mem0002", projectId: PROJECT_ID, workItemId: WI_DASH,
      summary: "Dashboard item decomposed into 3 parallel children: cost chart, agent strip, health widget.",
      filesChanged: [],
      keyDecisions: ["Children can be worked in parallel — no dependencies", "Using recharts for chart components"],
      createdAt: d("2026-03-26T10:06:15Z"), consolidatedInto: null,
    },
  ]);

  console.log("Seed complete: 1 project, 5 personas, 16 work items, 4 edges, 5 assignments, 10 executions, 17 comments, 2 proposals, 2 memories");
}

// Run if executed directly
seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
