/**
 * Demo seed — rich dataset for showcasing AgentOps without running real agents.
 *
 * Includes multiple projects, work items in every workflow state, realistic
 * execution history with comments, cost data, and proposals.
 *
 * Usage:
 *   pnpm db:seed:demo
 *   # or directly:
 *   DATABASE_URL=agentops.db tsx src/db/seed-demo.ts
 */

export {};  // Make this a module (prevents TS global scope conflicts)

const DB_PATH = process.env["DATABASE_URL"] ?? "agentops.db";
process.env["DATABASE_URL"] = DB_PATH;

async function main() {
  console.log(`Demo seed: using database at ${DB_PATH}`);

  const { db } = await import("./connection.js");
  const { runMigrations } = await import("./migrate.js");
  const {
    projects,
    personas,
    workItems,
    workItemEdges,
    personaAssignments,
    executions,
    comments,
    proposals,
    projectMemories,
    chatMessages,
    chatSessions,
  } = await import("./schema.js");

  runMigrations();

  // Clear existing data (reverse dependency order — chat tables reference projects)
  await db.delete(chatMessages);
  await db.delete(chatSessions);
  await db.delete(projectMemories);
  await db.delete(proposals);
  await db.delete(comments);
  await db.delete(executions);
  await db.delete(personaAssignments);
  await db.delete(workItemEdges);
  await db.delete(workItems);
  await db.delete(personas);
  await db.delete(projects);

  const d = (iso: string) => new Date(iso);

  // ── Projects ──────────────────────────────────────────────────────

  await db.insert(projects).values([
    {
      id: "pj-tictacto",
      name: "TicTacToe App",
      path: "/Users/dev/projects/tictactoe",
      settings: { maxConcurrent: 2, monthCap: 30, autoRouting: true },
      createdAt: d("2026-03-01T10:00:00Z"),
    },
    {
      id: "pj-blogapi0",
      name: "Blog API",
      path: "/Users/dev/projects/blog-api",
      settings: { maxConcurrent: 3, monthCap: 75, autoRouting: true },
      createdAt: d("2026-03-10T09:00:00Z"),
    },
    {
      id: "pj-dashbrd0",
      name: "Analytics Dashboard",
      path: "/Users/dev/projects/analytics-dashboard",
      settings: { maxConcurrent: 4, monthCap: 100, autoRouting: false },
      createdAt: d("2026-03-15T14:00:00Z"),
    },
  ]);

  // ── Personas ──────────────────────────────────────────────────────

  const PS_PM = "ps-pm00001";
  const PS_TL = "ps-tl00001";
  const PS_EN = "ps-en00001";
  const PS_RV = "ps-rv00001";
  const PS_RT = "ps-rt00001";

  await db.insert(personas).values([
    {
      id: PS_PM, name: "Product Manager",
      description: "Writes acceptance criteria, defines scope, and prioritizes work items.",
      avatar: { color: "#7c3aed", icon: "clipboard-list" },
      systemPrompt: "You are a Product Manager. Write acceptance criteria and define scope.",
      model: "sonnet", allowedTools: ["Read", "Glob", "Grep", "WebSearch"],
      mcpTools: ["post_comment", "list_items", "get_context", "request_review"],
      maxBudgetPerRun: 50, settings: {},
    },
    {
      id: PS_TL, name: "Tech Lead",
      description: "Decomposes work items into children with dependency graphs.",
      avatar: { color: "#2563eb", icon: "git-branch" },
      systemPrompt: "You are a Tech Lead. Decompose work items into well-scoped children.",
      model: "opus", allowedTools: ["Read", "Glob", "Grep", "WebSearch", "Bash"],
      mcpTools: ["create_children", "post_comment", "get_context", "list_items"],
      maxBudgetPerRun: 100, settings: {},
    },
    {
      id: PS_EN, name: "Engineer",
      description: "Implements work items by writing and modifying code.",
      avatar: { color: "#059669", icon: "code" },
      systemPrompt: "You are a Software Engineer. Implement work items following project conventions.",
      model: "sonnet", allowedTools: ["Read", "Edit", "Write", "Glob", "Grep", "Bash", "WebFetch"],
      mcpTools: ["post_comment", "flag_blocked", "get_context"],
      maxBudgetPerRun: 200, settings: {},
    },
    {
      id: PS_RV, name: "Code Reviewer",
      description: "Reviews code changes for correctness, style, and completeness.",
      avatar: { color: "#d97706", icon: "eye" },
      systemPrompt: "You are a Code Reviewer. Review code for correctness and conventions.",
      model: "sonnet", allowedTools: ["Read", "Glob", "Grep", "Bash"],
      mcpTools: ["post_comment", "get_context", "list_items", "request_review", "rewind_execution"],
      maxBudgetPerRun: 50, settings: {},
    },
    {
      id: PS_RT, name: "Router",
      description: "Routes work items between workflow states based on execution outcomes.",
      avatar: { color: "#6366f1", icon: "arrow-right-left" },
      systemPrompt: "You are a Router. Route work items to the correct next state.",
      model: "haiku", allowedTools: [],
      mcpTools: ["route_to_state", "list_items", "get_context", "post_comment"],
      maxBudgetPerRun: 5, settings: { isSystem: true, isRouter: true },
    },
    {
      id: "ps-pico", name: "Pico",
      description: "Your friendly project assistant. Woof!",
      avatar: { color: "#f59e0b", icon: "dog" },
      systemPrompt: `You are Pico, a friendly and enthusiastic project assistant built into AgentOps. You're named after a beloved dog, and you bring that same loyal, eager-to-help energy to every conversation.

## Personality
- Warm, enthusiastic, and professional
- Use casual but technically accurate language
- Occasionally use dog-related expressions ("let me dig into that", "I'll fetch that for you", "sniffing around the codebase") — but don't overdo it
- Say "woof" sparingly — only when genuinely excited about something

## What you know
- The AgentOps project architecture, workflow states, personas, and codebase
- How work items flow through the pipeline (Backlog → Planning → Ready → In Progress → In Review → Done)
- The 5 workflow personas (PM, Tech Lead, Engineer, Code Reviewer, Router) and their roles
- How to read execution history, comments, and state transitions

## What you can do
- Answer questions about the project, its architecture, and its workflow
- Help users understand work item status and history
- Search the codebase using Read, Glob, and Grep tools
- Look up work items and their context using list_items and get_context MCP tools
- Post comments on work items using post_comment

## Guidelines
- When asked about code or architecture, use your tools to look it up — don't guess
- For architecture, API, or deployment questions, search the docs/ directory
- Keep responses concise but helpful
- If you don't know something, say so honestly
- Always be accurate about technical content, even while being friendly`,
      model: "sonnet", allowedTools: ["Read", "Glob", "Grep", "WebSearch"],
      mcpTools: ["list_items", "get_context", "post_comment"],
      maxBudgetPerRun: 5, settings: { isSystem: true, isAssistant: true },
    },
  ]);

  // ── TicTacToe Work Items (project 1 — fully completed) ────────────

  await db.insert(workItems).values([
    {
      id: "wi-ttt0001", parentId: null, projectId: "pj-tictacto",
      title: "Build TicTacToe game",
      description: "Create a complete TicTacToe game with React. Include game board, turn tracking, win detection, and reset functionality.",
      context: { acceptanceCriteria: "- 3x3 game board renders\n- Players alternate X and O\n- Win detection works (rows, cols, diagonals)\n- Draw detection works\n- Reset button clears the board" },
      currentState: "Done", priority: "p1", labels: ["game", "react"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-01T10:00:00Z"), updatedAt: d("2026-03-05T16:00:00Z"),
    },
    {
      id: "wi-ttt0002", parentId: "wi-ttt0001", projectId: "pj-tictacto",
      title: "Create game board component",
      description: "3x3 CSS grid of clickable cells. Each cell shows X, O, or empty.",
      context: {},
      currentState: "Done", priority: "p1", labels: ["game", "ui"],
      assignedPersonaId: PS_EN, executionContext: [],
      createdAt: d("2026-03-02T09:00:00Z"), updatedAt: d("2026-03-03T11:00:00Z"),
    },
    {
      id: "wi-ttt0003", parentId: "wi-ttt0001", projectId: "pj-tictacto",
      title: "Add win and draw detection",
      description: "Check all rows, columns, and diagonals after each move. Detect draw when board is full.",
      context: {},
      currentState: "Done", priority: "p1", labels: ["game", "logic"],
      assignedPersonaId: PS_EN, executionContext: [],
      createdAt: d("2026-03-02T09:05:00Z"), updatedAt: d("2026-03-04T14:00:00Z"),
    },
    {
      id: "wi-ttt0004", parentId: "wi-ttt0001", projectId: "pj-tictacto",
      title: "Add game reset and status display",
      description: "Show current player turn, winner announcement, and a reset button.",
      context: {},
      currentState: "Done", priority: "p1", labels: ["game", "ui"],
      assignedPersonaId: PS_EN, executionContext: [],
      createdAt: d("2026-03-02T09:10:00Z"), updatedAt: d("2026-03-05T16:00:00Z"),
    },
  ]);

  // ── Blog API Work Items (project 2 — active pipeline) ─────────────

  await db.insert(workItems).values([
    {
      id: "wi-blg0001", parentId: null, projectId: "pj-blogapi0",
      title: "REST API for blog posts",
      description: "CRUD endpoints for blog posts with validation, pagination, and search.",
      context: { acceptanceCriteria: "- GET /posts returns paginated list\n- POST /posts creates with validation\n- PUT /posts/:id updates\n- DELETE /posts/:id removes\n- GET /posts?q= searches title/body" },
      currentState: "In Progress", priority: "p0", labels: ["api", "crud"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-10T09:00:00Z"), updatedAt: d("2026-03-28T10:00:00Z"),
    },
    {
      id: "wi-blg0002", parentId: "wi-blg0001", projectId: "pj-blogapi0",
      title: "Create posts table and Drizzle schema",
      description: "Define posts table with id, title, body, authorId, tags, createdAt, updatedAt.",
      context: {},
      currentState: "Done", priority: "p0", labels: ["api", "db"],
      assignedPersonaId: PS_EN, executionContext: [],
      createdAt: d("2026-03-11T10:00:00Z"), updatedAt: d("2026-03-12T15:00:00Z"),
    },
    {
      id: "wi-blg0003", parentId: "wi-blg0001", projectId: "pj-blogapi0",
      title: "Implement GET /posts with pagination",
      description: "List endpoint with page/limit params, total count header, sorted by createdAt desc.",
      context: {},
      currentState: "In Review", priority: "p0", labels: ["api"],
      assignedPersonaId: PS_RV, executionContext: [],
      createdAt: d("2026-03-11T10:05:00Z"), updatedAt: d("2026-03-28T09:00:00Z"),
    },
    {
      id: "wi-blg0004", parentId: "wi-blg0001", projectId: "pj-blogapi0",
      title: "Implement POST /posts with validation",
      description: "Create endpoint with zod validation for title (required, max 200), body (required), tags (optional array).",
      context: {},
      currentState: "In Progress", priority: "p0", labels: ["api", "validation"],
      assignedPersonaId: PS_EN, executionContext: [],
      createdAt: d("2026-03-11T10:10:00Z"), updatedAt: d("2026-03-28T10:00:00Z"),
    },
    {
      id: "wi-blg0005", parentId: "wi-blg0001", projectId: "pj-blogapi0",
      title: "Implement PUT and DELETE endpoints",
      description: "Update and delete with proper 404 handling and authorization check.",
      context: {},
      currentState: "Ready", priority: "p0", labels: ["api"],
      assignedPersonaId: PS_EN, executionContext: [],
      createdAt: d("2026-03-11T10:15:00Z"), updatedAt: d("2026-03-11T10:15:00Z"),
    },
    {
      id: "wi-blg0006", parentId: "wi-blg0001", projectId: "pj-blogapi0",
      title: "Add search endpoint",
      description: "GET /posts?q= with full-text search on title and body using SQLite FTS.",
      context: {},
      currentState: "Backlog", priority: "p1", labels: ["api", "search"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-11T10:20:00Z"), updatedAt: d("2026-03-11T10:20:00Z"),
    },
    {
      id: "wi-blg0007", parentId: null, projectId: "pj-blogapi0",
      title: "User authentication with JWT",
      description: "Register/login endpoints, JWT token issuance, middleware for protected routes.",
      context: {},
      currentState: "Planning", priority: "p0", labels: ["auth", "security"],
      assignedPersonaId: PS_PM, executionContext: [],
      createdAt: d("2026-03-15T09:00:00Z"), updatedAt: d("2026-03-27T11:00:00Z"),
    },
    {
      id: "wi-blg0008", parentId: null, projectId: "pj-blogapi0",
      title: "Rate limiting middleware",
      description: "Add rate limiting to prevent API abuse. Configure per-route limits.",
      context: {},
      currentState: "Blocked", priority: "p2", labels: ["security", "middleware"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-20T14:00:00Z"), updatedAt: d("2026-03-25T09:00:00Z"),
    },
  ]);

  // ── Analytics Dashboard Work Items (project 3 — early stage) ──────

  await db.insert(workItems).values([
    {
      id: "wi-ana0001", parentId: null, projectId: "pj-dashbrd0",
      title: "Interactive chart dashboard",
      description: "Build a dashboard with multiple chart types: line, bar, pie. Support date range filtering and data export.",
      context: {},
      currentState: "Decomposition", priority: "p1", labels: ["dashboard", "charts"],
      assignedPersonaId: PS_TL, executionContext: [],
      createdAt: d("2026-03-15T14:00:00Z"), updatedAt: d("2026-03-26T10:00:00Z"),
    },
    {
      id: "wi-ana0002", parentId: null, projectId: "pj-dashbrd0",
      title: "Data ingestion pipeline",
      description: "CSV/JSON file upload with parsing, validation, and storage in SQLite.",
      context: {},
      currentState: "Backlog", priority: "p1", labels: ["data", "pipeline"],
      assignedPersonaId: null, executionContext: [],
      createdAt: d("2026-03-16T10:00:00Z"), updatedAt: d("2026-03-16T10:00:00Z"),
    },
  ]);

  // ── Edges ─────────────────────────────────────────────────────────

  await db.insert(workItemEdges).values([
    { id: "we-dem0001", fromId: "wi-ttt0002", toId: "wi-ttt0003", type: "blocks" },
    { id: "we-dem0002", fromId: "wi-ttt0003", toId: "wi-ttt0004", type: "blocks" },
    { id: "we-dem0003", fromId: "wi-blg0002", toId: "wi-blg0003", type: "blocks" },
    { id: "we-dem0004", fromId: "wi-blg0002", toId: "wi-blg0004", type: "blocks" },
    { id: "we-dem0005", fromId: "wi-blg0003", toId: "wi-blg0005", type: "depends_on" },
    { id: "we-dem0006", fromId: "wi-blg0004", toId: "wi-blg0005", type: "depends_on" },
  ]);

  // ── Persona Assignments ───────────────────────────────────────────

  for (const projId of ["pj-tictacto", "pj-blogapi0", "pj-dashbrd0"]) {
    await db.insert(personaAssignments).values([
      { projectId: projId, stateName: "Planning", personaId: PS_PM },
      { projectId: projId, stateName: "Decomposition", personaId: PS_TL },
      { projectId: projId, stateName: "Ready", personaId: PS_RT },
      { projectId: projId, stateName: "In Progress", personaId: PS_EN },
      { projectId: projId, stateName: "In Review", personaId: PS_RV },
    ]);
  }

  // ── Executions (rich history) ─────────────────────────────────────

  await db.insert(executions).values([
    // TicTacToe — completed pipeline
    {
      id: "ex-dem0001", workItemId: "wi-ttt0001", personaId: PS_PM, projectId: "pj-tictacto",
      status: "completed", startedAt: d("2026-03-01T10:05:00Z"), completedAt: d("2026-03-01T10:07:00Z"),
      costUsd: 12, durationMs: 120000, summary: "Wrote acceptance criteria for TicTacToe game.", outcome: "success",
      rejectionPayload: null, logs: "Analyzing game requirements...\nWriting criteria...\nDone.",
    },
    {
      id: "ex-dem0002", workItemId: "wi-ttt0001", personaId: PS_TL, projectId: "pj-tictacto",
      status: "completed", startedAt: d("2026-03-01T10:10:00Z"), completedAt: d("2026-03-01T10:15:00Z"),
      costUsd: 45, durationMs: 300000, summary: "Decomposed into 3 children: board, win detection, reset/status.", outcome: "success",
      rejectionPayload: null, logs: "Reading codebase...\nDesigning component structure...\nCreating 3 children.",
    },
    {
      id: "ex-dem0003", workItemId: "wi-ttt0002", personaId: PS_EN, projectId: "pj-tictacto",
      status: "completed", startedAt: d("2026-03-02T09:30:00Z"), completedAt: d("2026-03-02T09:38:00Z"),
      costUsd: 65, durationMs: 480000, summary: "Built 3x3 game board with CSS grid and click handlers.", outcome: "success",
      rejectionPayload: null, logs: "Creating Board component...\nAdding CSS grid layout...\nImplementing cell click handler...\nBuild passes.",
    },
    {
      id: "ex-dem0004", workItemId: "wi-ttt0003", personaId: PS_EN, projectId: "pj-tictacto",
      status: "completed", startedAt: d("2026-03-03T14:00:00Z"), completedAt: d("2026-03-03T14:06:00Z"),
      costUsd: 55, durationMs: 360000, summary: "Implemented win detection for rows, columns, and diagonals.", outcome: "success",
      rejectionPayload: null, logs: "Adding checkWinner function...\nTesting all win conditions...\nAdding draw detection...\nBuild passes.",
    },
    {
      id: "ex-dem0005", workItemId: "wi-ttt0004", personaId: PS_EN, projectId: "pj-tictacto",
      status: "completed", startedAt: d("2026-03-04T10:00:00Z"), completedAt: d("2026-03-04T10:05:00Z"),
      costUsd: 40, durationMs: 300000, summary: "Added status display and reset button.", outcome: "success",
      rejectionPayload: null, logs: "Adding status bar...\nImplementing reset handler...\nStyling with Tailwind...\nBuild passes.",
    },
    // Blog API — active pipeline with rejections
    {
      id: "ex-dem0006", workItemId: "wi-blg0001", personaId: PS_PM, projectId: "pj-blogapi0",
      status: "completed", startedAt: d("2026-03-10T09:05:00Z"), completedAt: d("2026-03-10T09:08:00Z"),
      costUsd: 15, durationMs: 180000, summary: "Wrote acceptance criteria for Blog API CRUD.", outcome: "success",
      rejectionPayload: null, logs: "Analyzing REST API requirements...\nDefining endpoints...\nDone.",
    },
    {
      id: "ex-dem0007", workItemId: "wi-blg0001", personaId: PS_TL, projectId: "pj-blogapi0",
      status: "completed", startedAt: d("2026-03-10T09:15:00Z"), completedAt: d("2026-03-10T09:22:00Z"),
      costUsd: 78, durationMs: 420000, summary: "Decomposed into 5 children: schema, GET list, POST create, PUT/DELETE, search.", outcome: "success",
      rejectionPayload: null, logs: "Designing API layer...\nCreating 5 children with dependencies...\nDone.",
    },
    {
      id: "ex-dem0008", workItemId: "wi-blg0002", personaId: PS_EN, projectId: "pj-blogapi0",
      status: "completed", startedAt: d("2026-03-11T10:30:00Z"), completedAt: d("2026-03-11T10:35:00Z"),
      costUsd: 35, durationMs: 300000, summary: "Created posts table schema with Drizzle ORM.", outcome: "success",
      rejectionPayload: null, logs: "Defining posts table...\nRunning migrations...\nBuild passes.",
    },
    {
      id: "ex-dem0009", workItemId: "wi-blg0003", personaId: PS_EN, projectId: "pj-blogapi0",
      status: "completed", startedAt: d("2026-03-25T09:00:00Z"), completedAt: d("2026-03-25T09:08:00Z"),
      costUsd: 72, durationMs: 480000, summary: "Implemented GET /posts with pagination. First attempt had off-by-one in page calculation.", outcome: "rejected",
      rejectionPayload: { reason: "Pagination offset calculation is wrong: page 2 shows same results as page 1.", severity: "high", hint: "Use (page - 1) * limit for offset, not page * limit.", retryCount: 1 },
      logs: "Creating GET route...\nAdding pagination...\nBuild passes.",
    },
    {
      id: "ex-dem0010", workItemId: "wi-blg0003", personaId: PS_EN, projectId: "pj-blogapi0",
      status: "completed", startedAt: d("2026-03-27T14:00:00Z"), completedAt: d("2026-03-27T14:05:00Z"),
      costUsd: 28, durationMs: 300000, summary: "Fixed pagination offset: (page-1)*limit. Added total count header.", outcome: "success",
      rejectionPayload: null, logs: "Fixing pagination offset...\nAdding X-Total-Count header...\nBuild passes.",
    },
    {
      id: "ex-dem0011", workItemId: "wi-blg0004", personaId: PS_EN, projectId: "pj-blogapi0",
      status: "running", startedAt: d("2026-03-28T10:00:00Z"), completedAt: null,
      costUsd: 18, durationMs: 0, summary: "", outcome: null,
      rejectionPayload: null, logs: "Reading zod docs...\nDefining post creation schema...\nImplementing validation middleware...",
    },
    {
      id: "ex-dem0012", workItemId: "wi-blg0007", personaId: PS_PM, projectId: "pj-blogapi0",
      status: "running", startedAt: d("2026-03-27T11:00:00Z"), completedAt: null,
      costUsd: 8, durationMs: 0, summary: "", outcome: null,
      rejectionPayload: null, logs: "Analyzing JWT authentication requirements...\nResearching best practices...",
    },
    // Analytics Dashboard
    {
      id: "ex-dem0013", workItemId: "wi-ana0001", personaId: PS_PM, projectId: "pj-dashbrd0",
      status: "completed", startedAt: d("2026-03-15T14:05:00Z"), completedAt: d("2026-03-15T14:08:00Z"),
      costUsd: 14, durationMs: 180000, summary: "Wrote acceptance criteria for chart dashboard.", outcome: "success",
      rejectionPayload: null, logs: "Analyzing dashboard requirements...\nDefining chart types...\nDone.",
    },
    {
      id: "ex-dem0014", workItemId: "wi-ana0001", personaId: PS_TL, projectId: "pj-dashbrd0",
      status: "completed", startedAt: d("2026-03-26T10:00:00Z"), completedAt: d("2026-03-26T10:08:00Z"),
      costUsd: 88, durationMs: 480000, summary: "Decomposing dashboard into chart components and data layer.", outcome: "success",
      rejectionPayload: null, logs: "Reading existing codebase...\nDesigning chart architecture...\nCreating children...",
    },
  ]);

  // ── Comments ──────────────────────────────────────────────────────

  await db.insert(comments).values([
    // TicTacToe
    { id: "cm-dem0001", workItemId: "wi-ttt0001", authorType: "user", authorId: null, authorName: "Amin", content: "Simple project to test the pipeline. Should be quick!", metadata: {}, createdAt: d("2026-03-01T10:01:00Z") },
    { id: "cm-dem0002", workItemId: "wi-ttt0001", authorType: "agent", authorId: PS_PM, authorName: "Product Manager", content: "Acceptance criteria defined. Key: 3x3 board, alternating X/O, win/draw detection, reset.", metadata: {}, createdAt: d("2026-03-01T10:07:00Z") },
    { id: "cm-dem0003", workItemId: "wi-ttt0001", authorType: "agent", authorId: PS_TL, authorName: "Tech Lead", content: "Decomposed into 3 sequential children: board → win detection → reset/status.", metadata: { childrenCreated: 3 }, createdAt: d("2026-03-01T10:15:00Z") },
    { id: "cm-dem0004", workItemId: "wi-ttt0002", authorType: "agent", authorId: PS_EN, authorName: "Engineer", content: "Board component built with CSS grid. Each cell is a button with X/O/empty state.", metadata: { filesChanged: ["src/components/Board.tsx", "src/components/Cell.tsx"] }, createdAt: d("2026-03-02T09:38:00Z") },
    { id: "cm-dem0005", workItemId: "wi-ttt0004", authorType: "agent", authorId: PS_RV, authorName: "Code Reviewer", content: "All TicTacToe components reviewed. Clean implementation, good separation of concerns. Approved.", metadata: {}, createdAt: d("2026-03-05T15:00:00Z") },
    // Blog API
    { id: "cm-dem0006", workItemId: "wi-blg0001", authorType: "user", authorId: null, authorName: "Amin", content: "This is our main project. Prioritize the CRUD endpoints, then auth.", metadata: {}, createdAt: d("2026-03-10T09:02:00Z") },
    { id: "cm-dem0007", workItemId: "wi-blg0001", authorType: "agent", authorId: PS_TL, authorName: "Tech Lead", content: "Decomposed into 5 children. Schema first, then GET/POST in parallel, then PUT/DELETE, search last.", metadata: { childrenCreated: 5 }, createdAt: d("2026-03-10T09:22:00Z") },
    { id: "cm-dem0008", workItemId: "wi-blg0003", authorType: "agent", authorId: PS_RV, authorName: "Code Reviewer", content: "Pagination offset is wrong. Page 2 returns same data as page 1. Fix: use (page-1)*limit.", metadata: {}, createdAt: d("2026-03-25T09:30:00Z") },
    { id: "cm-dem0009", workItemId: "wi-blg0003", authorType: "agent", authorId: PS_EN, authorName: "Engineer", content: "Fixed pagination offset. Also added X-Total-Count response header.", metadata: { filesChanged: ["src/routes/posts.ts"] }, createdAt: d("2026-03-27T14:05:00Z") },
    { id: "cm-dem0010", workItemId: "wi-blg0008", authorType: "system", authorId: null, authorName: "System", content: "Blocked: depends on authentication (wi-blg0007) being completed first.", metadata: {}, createdAt: d("2026-03-25T09:00:00Z") },
    { id: "cm-dem0011", workItemId: "wi-blg0004", authorType: "agent", authorId: PS_EN, authorName: "Engineer", content: "Starting POST /posts implementation with zod validation.", metadata: {}, createdAt: d("2026-03-28T10:01:00Z") },
    // Analytics
    { id: "cm-dem0012", workItemId: "wi-ana0001", authorType: "user", authorId: null, authorName: "Amin", content: "Use recharts for all charts. Keep it simple — line and bar charts only for v1.", metadata: {}, createdAt: d("2026-03-15T14:02:00Z") },
    { id: "cm-dem0013", workItemId: "wi-ana0001", authorType: "agent", authorId: PS_TL, authorName: "Tech Lead", content: "Decomposing into chart components. Will create separate children for line chart, bar chart, and date range filter.", metadata: {}, createdAt: d("2026-03-26T10:08:00Z") },
  ]);

  // ── Proposals ─────────────────────────────────────────────────────

  await db.insert(proposals).values([
    {
      id: "pp-dem0001", executionId: "ex-dem0002", workItemId: "wi-ttt0001", type: "task_creation",
      payload: { children: [
        { title: "Create game board component", description: "3x3 CSS grid" },
        { title: "Add win and draw detection", description: "Check rows/cols/diags" },
        { title: "Add game reset and status", description: "Status display + reset button" },
      ] },
      status: "approved", createdAt: d("2026-03-01T10:15:00Z"),
    },
    {
      id: "pp-dem0002", executionId: "ex-dem0007", workItemId: "wi-blg0001", type: "task_creation",
      payload: { children: [
        { title: "Create posts table schema", description: "Drizzle ORM schema + migration" },
        { title: "GET /posts with pagination", description: "List endpoint with page/limit" },
        { title: "POST /posts with validation", description: "Create with zod validation" },
        { title: "PUT and DELETE endpoints", description: "Update and delete with 404 handling" },
        { title: "Search endpoint", description: "FTS on title and body" },
      ] },
      status: "approved", createdAt: d("2026-03-10T09:22:00Z"),
    },
    {
      id: "pp-dem0003", executionId: "ex-dem0014", workItemId: "wi-ana0001", type: "task_creation",
      payload: { children: [
        { title: "Line chart component", description: "Recharts line chart with tooltips" },
        { title: "Bar chart component", description: "Recharts bar chart with labels" },
        { title: "Date range filter", description: "Date picker for filtering chart data" },
      ] },
      status: "pending", createdAt: d("2026-03-26T10:08:00Z"),
    },
  ]);

  // ── Project Memories ──────────────────────────────────────────────

  await db.insert(projectMemories).values([
    {
      id: "pm-dem0001", projectId: "pj-tictacto", workItemId: "wi-ttt0001",
      summary: "TicTacToe game completed. React components with CSS grid, win/draw detection, and reset.",
      filesChanged: ["src/components/Board.tsx", "src/components/Cell.tsx", "src/hooks/useGame.ts"],
      keyDecisions: ["Used CSS grid for board layout", "Win detection in custom hook", "State managed in useGame hook"],
      createdAt: d("2026-03-05T16:00:00Z"), consolidatedInto: null,
    },
    {
      id: "pm-dem0002", projectId: "pj-blogapi0", workItemId: "wi-blg0001",
      summary: "Blog API CRUD in progress. Posts schema created, GET pagination working (after fix), POST in progress.",
      filesChanged: ["src/db/schema.ts", "src/routes/posts.ts"],
      keyDecisions: ["Using Drizzle ORM for type-safe queries", "Zod for request validation", "SQLite FTS5 for search"],
      createdAt: d("2026-03-27T14:05:00Z"), consolidatedInto: null,
    },
  ]);

  const totalWI = 4 + 8 + 2;  // tictactoe + blog + analytics
  const totalExec = 14;
  const totalComments = 13;
  console.log(`Demo seed complete: 3 projects, 6 personas, ${totalWI} work items, 6 edges, 15 assignments, ${totalExec} executions, ${totalComments} comments, 3 proposals, 2 memories`);
}

main().catch((err) => {
  console.error("Demo seed failed:", err);
  process.exit(1);
});
