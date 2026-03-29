import type {
  Project,
  Story,
  Task,
  TaskEdge,
  Workflow,
  Persona,
  Trigger,
  Execution,
  Comment,
  ProjectMemory,
  Proposal,
  ProjectId,
  StoryId,
  TaskId,
  WorkflowId,
  PersonaId,
  ExecutionId,
} from "@agentops/shared";

// ── Fixed IDs for cross-referencing ────────────────────────────────

const PROJECT_ID = "pj-agntops" as ProjectId;
const STORY_WF_ID = "wf-strywf1" as WorkflowId;
const TASK_WF_ID = "wf-tskwf01" as WorkflowId;

const PERSONA_PM = "ps-pm00001" as PersonaId;
const PERSONA_TECH_LEAD = "ps-tl00001" as PersonaId;
const PERSONA_ENGINEER = "ps-en00001" as PersonaId;
const PERSONA_REVIEWER = "ps-rv00001" as PersonaId;
const PERSONA_QA = "ps-qa00001" as PersonaId;

const STORY_1 = "st-auth001" as StoryId;
const STORY_2 = "st-dash002" as StoryId;
const STORY_3 = "st-noti003" as StoryId;

const TASK_1_1 = "tk-au01001" as TaskId;
const TASK_1_2 = "tk-au01002" as TaskId;
const TASK_1_3 = "tk-au01003" as TaskId;
const TASK_2_1 = "tk-da02001" as TaskId;
const TASK_2_2 = "tk-da02002" as TaskId;
const TASK_2_3 = "tk-da02003" as TaskId;
const TASK_3_1 = "tk-no03001" as TaskId;
const TASK_3_2 = "tk-no03002" as TaskId;
const TASK_3_3 = "tk-no03003" as TaskId;
const TASK_3_4 = "tk-no03004" as TaskId;

const EXEC_1 = "ex-exec001" as ExecutionId;
const EXEC_2 = "ex-exec002" as ExecutionId;
const EXEC_3 = "ex-exec003" as ExecutionId;
const EXEC_4 = "ex-exec004" as ExecutionId;
const EXEC_5 = "ex-exec005" as ExecutionId;
const EXEC_6 = "ex-exec006" as ExecutionId;
const EXEC_7 = "ex-exec007" as ExecutionId;

// ── Workflows ──────────────────────────────────────────────────────

export const workflows: Workflow[] = [
  {
    id: STORY_WF_ID,
    name: "Default Story Workflow",
    type: "story",
    states: [
      { name: "Backlog", color: "#94a3b8", isInitial: true, isFinal: false },
      { name: "Defining", color: "#8b5cf6", isInitial: false, isFinal: false },
      { name: "Decomposing", color: "#3b82f6", isInitial: false, isFinal: false },
      { name: "In Progress", color: "#10b981", isInitial: false, isFinal: false },
      { name: "In Review", color: "#f59e0b", isInitial: false, isFinal: false },
      { name: "QA", color: "#ef4444", isInitial: false, isFinal: false },
      { name: "Done", color: "#22c55e", isInitial: false, isFinal: true },
    ],
    transitions: [
      { from: "Backlog", to: "Defining", name: "Start defining" },
      { from: "Defining", to: "Decomposing", name: "Define complete" },
      { from: "Decomposing", to: "In Progress", name: "Tasks approved" },
      { from: "In Progress", to: "In Review", name: "Submit for review" },
      { from: "In Review", to: "QA", name: "Review passed" },
      { from: "In Review", to: "In Progress", name: "Review rejected" },
      { from: "QA", to: "Done", name: "QA passed" },
      { from: "QA", to: "In Progress", name: "QA failed" },
    ],
    initialState: "Backlog",
    finalStates: ["Done"],
    isDefault: true,
  },
  {
    id: TASK_WF_ID,
    name: "Default Task Workflow",
    type: "task",
    states: [
      { name: "Pending", color: "#94a3b8", isInitial: true, isFinal: false },
      { name: "Running", color: "#10b981", isInitial: false, isFinal: false },
      { name: "Review", color: "#f59e0b", isInitial: false, isFinal: false },
      { name: "Done", color: "#22c55e", isInitial: false, isFinal: true },
      { name: "Failed", color: "#ef4444", isInitial: false, isFinal: true },
    ],
    transitions: [
      { from: "Pending", to: "Running", name: "Start" },
      { from: "Running", to: "Review", name: "Complete" },
      { from: "Running", to: "Failed", name: "Fail" },
      { from: "Review", to: "Done", name: "Approve" },
      { from: "Review", to: "Pending", name: "Reject" },
    ],
    initialState: "Pending",
    finalStates: ["Done", "Failed"],
    isDefault: true,
  },
];

// ── Personas ───────────────────────────────────────────────────────

export const personas: Persona[] = [
  {
    id: PERSONA_PM,
    name: "PM",
    description: "Writes acceptance criteria and defines story scope.",
    avatar: { color: "#8b5cf6", icon: "clipboard-list" },
    systemPrompt: "You are a product manager. Write clear acceptance criteria and define story scope.",
    model: "sonnet",
    allowedTools: ["Read", "Glob", "Grep", "WebSearch"],
    mcpTools: ["post_comment", "transition_state"],
    maxBudgetPerRun: 0.5,
    settings: {},
  },
  {
    id: PERSONA_TECH_LEAD,
    name: "Tech Lead",
    description: "Decomposes stories into tasks with dependency graphs.",
    avatar: { color: "#3b82f6", icon: "git-branch" },
    systemPrompt: "You are a tech lead. Break stories into well-scoped tasks with clear dependencies.",
    model: "opus",
    allowedTools: ["Read", "Glob", "Grep", "WebSearch", "Bash"],
    mcpTools: ["create_tasks", "post_comment", "request_review"],
    maxBudgetPerRun: 1.0,
    settings: {},
  },
  {
    id: PERSONA_ENGINEER,
    name: "Engineer",
    description: "Implements tasks by writing and modifying code.",
    avatar: { color: "#10b981", icon: "code" },
    systemPrompt: "You are a software engineer. Implement the assigned task following project conventions.",
    model: "sonnet",
    allowedTools: ["Read", "Edit", "Write", "Glob", "Grep", "Bash", "WebFetch"],
    mcpTools: ["post_comment", "flag_blocked", "transition_state"],
    maxBudgetPerRun: 2.0,
    settings: {},
  },
  {
    id: PERSONA_REVIEWER,
    name: "Reviewer",
    description: "Reviews code changes and provides feedback.",
    avatar: { color: "#f59e0b", icon: "eye" },
    systemPrompt: "You are a code reviewer. Check for bugs, style issues, and correctness.",
    model: "sonnet",
    allowedTools: ["Read", "Glob", "Grep", "Bash"],
    mcpTools: ["post_comment", "request_review", "transition_state"],
    maxBudgetPerRun: 0.5,
    settings: {},
  },
  {
    id: PERSONA_QA,
    name: "QA",
    description: "Tests functionality and verifies acceptance criteria.",
    avatar: { color: "#ef4444", icon: "test-tube" },
    systemPrompt: "You are a QA tester. Verify that acceptance criteria are met and there are no regressions.",
    model: "haiku",
    allowedTools: ["Read", "Bash", "Glob", "Grep"],
    mcpTools: ["post_comment", "transition_state"],
    maxBudgetPerRun: 0.3,
    settings: {},
  },
];

// ── Project ────────────────────────────────────────────────────────

export const projects: Project[] = [
  {
    id: PROJECT_ID,
    name: "AgentOps",
    path: "/Users/dev/projects/agentops",
    defaultWorkflowId: STORY_WF_ID,
    settings: { maxConcurrentAgents: 3, monthlyCostCap: 50 },
    createdAt: "2026-03-20T10:00:00Z",
  },
];

// ── Stories ─────────────────────────────────────────────────────────

export const stories: Story[] = [
  {
    id: STORY_1,
    projectId: PROJECT_ID,
    title: "User authentication with OAuth2",
    description: "Implement OAuth2 login flow with Google and GitHub providers. Users should be able to sign in, sign out, and have their session persisted.",
    workflowId: STORY_WF_ID,
    currentState: "In Progress",
    priority: "p0",
    labels: ["auth", "security"],
    context: {
      acceptanceCriteria: "- Google OAuth login works\n- GitHub OAuth login works\n- Session persists across page reloads\n- Logout clears session\n- Protected routes redirect to login",
      notes: "Use passport.js for the backend implementation.",
    },
    createdAt: "2026-03-21T09:00:00Z",
    updatedAt: "2026-03-27T14:30:00Z",
  },
  {
    id: STORY_2,
    projectId: PROJECT_ID,
    title: "Dashboard analytics widgets",
    description: "Build the main dashboard with cost tracking, agent activity charts, and project health indicators.",
    workflowId: STORY_WF_ID,
    currentState: "Decomposing",
    priority: "p1",
    labels: ["dashboard", "ui"],
    context: {
      acceptanceCriteria: "- Cost chart shows last 7 days\n- Active agent count is live\n- Project health shows red/green indicators\n- Responsive layout",
      notes: "Use recharts for charts. Mock data for now.",
    },
    createdAt: "2026-03-22T11:00:00Z",
    updatedAt: "2026-03-26T16:00:00Z",
  },
  {
    id: STORY_3,
    projectId: PROJECT_ID,
    title: "Real-time notification system",
    description: "Implement toast notifications and an activity feed that update in real-time via WebSocket.",
    workflowId: STORY_WF_ID,
    currentState: "Backlog",
    priority: "p2",
    labels: ["notifications", "websocket"],
    context: {
      acceptanceCriteria: "- Toast notifications appear for key events\n- Activity feed updates without refresh\n- Unread count badge on nav\n- Notification preferences in settings",
      notes: "",
    },
    createdAt: "2026-03-23T08:30:00Z",
    updatedAt: "2026-03-23T08:30:00Z",
  },
];

// ── Tasks ───────────────────────────────────────────────────────────

export const tasks: Task[] = [
  // Story 1: Auth — 3 tasks, various states
  {
    id: TASK_1_1,
    storyId: STORY_1,
    title: "Set up OAuth2 backend routes",
    description: "Create /auth/google and /auth/github routes with passport strategies.",
    workflowId: TASK_WF_ID,
    currentState: "Done",
    assignedPersonaId: PERSONA_ENGINEER,
    parentTaskId: null,
    inheritedContext: "Implement OAuth2 login flow with Google and GitHub providers.",
    executionContext: [
      { executionId: EXEC_4, summary: "Initial attempt at OAuth routes — used express-session directly without passport.", outcome: "rejected", rejectionPayload: { reason: "Session handling bypasses passport.js integration. Routes lack CSRF protection.", severity: "high", hint: "Use passport.js strategies for OAuth providers. Add csurf middleware.", retryCount: 1 } },
      { executionId: EXEC_1, summary: "Implemented OAuth routes with passport.js. Added CSRF protection via csurf middleware. Google and GitHub strategies configured.", outcome: "success", rejectionPayload: null },
    ],
    createdAt: "2026-03-24T10:00:00Z",
    updatedAt: "2026-03-25T11:30:00Z",
  },
  {
    id: TASK_1_2,
    storyId: STORY_1,
    title: "Build login UI component",
    description: "Create login page with Google and GitHub sign-in buttons.",
    workflowId: TASK_WF_ID,
    currentState: "Running",
    assignedPersonaId: PERSONA_ENGINEER,
    parentTaskId: null,
    inheritedContext: "Implement OAuth2 login flow with Google and GitHub providers.",
    executionContext: [
      { executionId: EXEC_5, summary: "Building login page with social sign-in buttons. Implementing Google and GitHub OAuth flows.", outcome: "success", rejectionPayload: null },
    ],
    createdAt: "2026-03-24T10:05:00Z",
    updatedAt: "2026-03-27T14:30:00Z",
  },
  {
    id: TASK_1_3,
    storyId: STORY_1,
    title: "Add session persistence and protected routes",
    description: "Implement session storage and route guards for authenticated pages.",
    workflowId: TASK_WF_ID,
    currentState: "Pending",
    assignedPersonaId: PERSONA_ENGINEER,
    parentTaskId: null,
    inheritedContext: "Implement OAuth2 login flow with Google and GitHub providers.",
    executionContext: [],
    createdAt: "2026-03-24T10:10:00Z",
    updatedAt: "2026-03-24T10:10:00Z",
  },
  // Story 2: Dashboard — 3 tasks, all pending/early
  {
    id: TASK_2_1,
    storyId: STORY_2,
    title: "Create cost tracking chart component",
    description: "Build a recharts-based sparkline chart showing 7-day cost history.",
    workflowId: TASK_WF_ID,
    currentState: "Pending",
    assignedPersonaId: PERSONA_ENGINEER,
    parentTaskId: null,
    inheritedContext: "Build the main dashboard with cost tracking widgets.",
    executionContext: [],
    createdAt: "2026-03-25T09:00:00Z",
    updatedAt: "2026-03-25T09:00:00Z",
  },
  {
    id: TASK_2_2,
    storyId: STORY_2,
    title: "Build active agents display strip",
    description: "Horizontal scrollable row of agent cards with live status indicators.",
    workflowId: TASK_WF_ID,
    currentState: "Pending",
    assignedPersonaId: PERSONA_ENGINEER,
    parentTaskId: null,
    inheritedContext: "Build the main dashboard with agent activity charts.",
    executionContext: [],
    createdAt: "2026-03-25T09:05:00Z",
    updatedAt: "2026-03-25T09:05:00Z",
  },
  {
    id: TASK_2_3,
    storyId: STORY_2,
    title: "Build project health indicator widget",
    description: "Red/green health indicators for build status, test coverage, and uptime.",
    workflowId: TASK_WF_ID,
    currentState: "Pending",
    assignedPersonaId: null,
    parentTaskId: null,
    inheritedContext: "Build the main dashboard with project health indicators.",
    executionContext: [],
    createdAt: "2026-03-25T09:10:00Z",
    updatedAt: "2026-03-25T09:10:00Z",
  },
  // Story 3: Notifications — 4 tasks, all backlog
  {
    id: TASK_3_1,
    storyId: STORY_3,
    title: "Create toast notification component",
    description: "Non-blocking toast notifications with success/error/info/warning variants.",
    workflowId: TASK_WF_ID,
    currentState: "Pending",
    assignedPersonaId: null,
    parentTaskId: null,
    inheritedContext: "Implement toast notifications that update in real-time.",
    executionContext: [],
    createdAt: "2026-03-26T08:00:00Z",
    updatedAt: "2026-03-26T08:00:00Z",
  },
  {
    id: TASK_3_2,
    storyId: STORY_3,
    title: "Build activity feed component",
    description: "Chronological event stream with filtering and real-time updates.",
    workflowId: TASK_WF_ID,
    currentState: "Pending",
    assignedPersonaId: null,
    parentTaskId: null,
    inheritedContext: "Implement an activity feed that updates in real-time via WebSocket.",
    executionContext: [],
    createdAt: "2026-03-26T08:05:00Z",
    updatedAt: "2026-03-26T08:05:00Z",
  },
  {
    id: TASK_3_3,
    storyId: STORY_3,
    title: "Wire WebSocket events to notifications",
    description: "Connect WS events to toast triggers and activity feed updates.",
    workflowId: TASK_WF_ID,
    currentState: "Pending",
    assignedPersonaId: null,
    parentTaskId: null,
    inheritedContext: "Implement real-time notification system.",
    executionContext: [],
    createdAt: "2026-03-26T08:10:00Z",
    updatedAt: "2026-03-26T08:10:00Z",
  },
  {
    id: TASK_3_4,
    storyId: STORY_3,
    title: "Add notification preferences to settings",
    description: "Settings panel for enabling/disabling notification types and sounds.",
    workflowId: TASK_WF_ID,
    currentState: "Pending",
    assignedPersonaId: null,
    parentTaskId: null,
    inheritedContext: "Notification preferences in settings.",
    executionContext: [],
    createdAt: "2026-03-26T08:15:00Z",
    updatedAt: "2026-03-26T08:15:00Z",
  },
];

// ── Task Edges (Dependencies) ──────────────────────────────────────

export const taskEdges: TaskEdge[] = [
  { id: "te-edge001", fromId: TASK_1_1, toId: TASK_1_2, type: "blocks" },
  { id: "te-edge002", fromId: TASK_1_2, toId: TASK_1_3, type: "blocks" },
  { id: "te-edge003", fromId: TASK_3_1, toId: TASK_3_3, type: "depends_on" },
  { id: "te-edge004", fromId: TASK_3_2, toId: TASK_3_3, type: "depends_on" },
];

// ── Triggers ───────────────────────────────────────────────────────

export const triggers: Trigger[] = [
  {
    id: "tr-trig001",
    workflowId: STORY_WF_ID,
    fromState: "Backlog",
    toState: "Defining",
    personaId: PERSONA_PM,
    dispatchMode: "auto",
    advancementMode: "auto",
    possibleTargets: [],
    maxRetries: 3,
    config: {},
  },
  {
    id: "tr-trig002",
    workflowId: STORY_WF_ID,
    fromState: "Defining",
    toState: "Decomposing",
    personaId: PERSONA_TECH_LEAD,
    dispatchMode: "propose",
    advancementMode: "approval",
    possibleTargets: [],
    maxRetries: 3,
    config: {},
  },
  {
    id: "tr-trig003",
    workflowId: STORY_WF_ID,
    fromState: "In Progress",
    toState: "In Review",
    personaId: PERSONA_REVIEWER,
    dispatchMode: "auto",
    advancementMode: "agent",
    possibleTargets: [],
    maxRetries: 2,
    config: {},
  },
  {
    id: "tr-trig004",
    workflowId: STORY_WF_ID,
    fromState: "In Review",
    toState: "QA",
    personaId: PERSONA_QA,
    dispatchMode: "auto",
    advancementMode: "auto",
    possibleTargets: [],
    maxRetries: 2,
    config: {},
  },
];

// ── Executions ─────────────────────────────────────────────────────

export const executions: Execution[] = [
  {
    id: EXEC_7,
    targetId: TASK_1_1,
    targetType: "task",
    personaId: PERSONA_REVIEWER,
    status: "completed",
    startedAt: "2026-03-25T08:00:00Z",
    completedAt: "2026-03-25T08:03:15Z",
    costUsd: 0.22,
    durationMs: 195000,
    summary: "Reviewed initial OAuth implementation. Found session handling bypasses passport.js and routes lack CSRF protection.",
    outcome: "rejected",
    rejectionPayload: { reason: "Session handling bypasses passport.js integration. Routes lack CSRF protection.", severity: "high", hint: "Use passport.js strategies for OAuth providers. Add csurf middleware.", retryCount: 1 },
    logs: "Reading auth routes...\nChecking session handling...\nFound: express-session used directly without passport serialize/deserialize.\nChecking CSRF protection...\nNo csurf middleware found.\nRejecting with high severity.",
  },
  {
    id: EXEC_1,
    targetId: TASK_1_1,
    targetType: "task",
    personaId: PERSONA_ENGINEER,
    status: "completed",
    startedAt: "2026-03-25T10:00:00Z",
    completedAt: "2026-03-25T10:04:32Z",
    costUsd: 0.42,
    durationMs: 272000,
    summary: "Implemented OAuth2 routes for Google and GitHub using passport.js strategies.",
    outcome: "success",
    rejectionPayload: null,
    logs: "Reading project structure...\nCreating auth routes...\nAdding passport strategies...\nTesting OAuth flow...\nAll tests passing.",
  },
  {
    id: EXEC_2,
    targetId: STORY_1,
    targetType: "story",
    personaId: PERSONA_PM,
    status: "completed",
    startedAt: "2026-03-24T09:15:00Z",
    completedAt: "2026-03-24T09:17:45Z",
    costUsd: 0.18,
    durationMs: 165000,
    summary: "Wrote acceptance criteria for OAuth2 authentication story.",
    outcome: "success",
    rejectionPayload: null,
    logs: "Analyzing story requirements...\nWriting acceptance criteria...\nPosting criteria as comment.",
  },
  {
    id: EXEC_3,
    targetId: STORY_1,
    targetType: "story",
    personaId: PERSONA_TECH_LEAD,
    status: "completed",
    startedAt: "2026-03-24T09:30:00Z",
    completedAt: "2026-03-24T09:35:12Z",
    costUsd: 0.85,
    durationMs: 312000,
    summary: "Decomposed auth story into 3 tasks with dependency graph.",
    outcome: "success",
    rejectionPayload: null,
    logs: "Reading story and acceptance criteria...\nDesigning task breakdown...\nCreating 3 tasks...\nSetting up dependency edges.",
  },
  {
    id: EXEC_4,
    targetId: TASK_1_2,
    targetType: "task",
    personaId: PERSONA_ENGINEER,
    status: "running",
    startedAt: "2026-03-27T14:25:00Z",
    completedAt: null,
    costUsd: 0.31,
    durationMs: 0,
    summary: "",
    outcome: null,
    rejectionPayload: null,
    logs: "Reading task context...\nScanning existing components...\nCreating login page component...",
  },
  {
    id: EXEC_5,
    targetId: STORY_2,
    targetType: "story",
    personaId: PERSONA_PM,
    status: "completed",
    startedAt: "2026-03-25T11:00:00Z",
    completedAt: "2026-03-25T11:02:30Z",
    costUsd: 0.15,
    durationMs: 150000,
    summary: "Wrote acceptance criteria for dashboard analytics story.",
    outcome: "success",
    rejectionPayload: null,
    logs: "Analyzing dashboard requirements...\nWriting acceptance criteria...\nDone.",
  },
  {
    id: EXEC_6,
    targetId: STORY_2,
    targetType: "story",
    personaId: PERSONA_TECH_LEAD,
    status: "completed",
    startedAt: "2026-03-26T10:00:00Z",
    completedAt: "2026-03-26T10:06:15Z",
    costUsd: 0.92,
    durationMs: 375000,
    summary: "Decomposed dashboard story into 3 tasks.",
    outcome: "success",
    rejectionPayload: null,
    logs: "Reading story...\nDesigning component breakdown...\nCreating tasks with descriptions...\nDone.",
  },
];

// ── Comments ───────────────────────────────────────────────────────

export const comments: Comment[] = [
  // Story 1 comments
  {
    id: "cm-cmt0001",
    targetId: STORY_1,
    targetType: "story",
    authorType: "user",
    authorId: null,
    authorName: "Amin",
    content: "This is our highest priority. We need auth before we can build any user-facing features.",
    metadata: {},
    createdAt: "2026-03-21T09:05:00Z",
  },
  {
    id: "cm-cmt0002",
    targetId: STORY_1,
    targetType: "story",
    authorType: "agent",
    authorId: PERSONA_PM,
    authorName: "PM",
    content: "I've written the acceptance criteria. Key requirements: Google + GitHub OAuth, session persistence, protected routes, and clean logout flow.",
    metadata: { filesReferenced: ["src/routes/auth.ts"] },
    createdAt: "2026-03-24T09:17:45Z",
  },
  {
    id: "cm-cmt0003",
    targetId: STORY_1,
    targetType: "story",
    authorType: "agent",
    authorId: PERSONA_TECH_LEAD,
    authorName: "Tech Lead",
    content: "Decomposed into 3 tasks:\n1. OAuth backend routes (passport.js)\n2. Login UI component\n3. Session persistence + protected routes\n\nTasks are ordered by dependency — each blocks the next.",
    metadata: { tasksCreated: 3, toolsUsed: ["create_tasks"] },
    createdAt: "2026-03-24T09:35:12Z",
  },
  {
    id: "cm-cmt0004",
    targetId: TASK_1_1,
    targetType: "task",
    authorType: "agent",
    authorId: PERSONA_ENGINEER,
    authorName: "Engineer",
    content: "OAuth routes implemented. Created `/auth/google` and `/auth/github` endpoints with passport strategies. Added callback handlers and session middleware.",
    metadata: { filesChanged: ["src/routes/auth.ts", "src/middleware/session.ts", "src/config/passport.ts"], toolsUsed: ["Edit", "Write", "Bash"] },
    createdAt: "2026-03-25T10:04:32Z",
  },
  {
    id: "cm-cmt0005",
    targetId: TASK_1_1,
    targetType: "task",
    authorType: "system",
    authorId: null,
    authorName: "System",
    content: "Task moved to Done",
    metadata: {},
    createdAt: "2026-03-25T11:30:00Z",
  },
  // Story 2 comments
  {
    id: "cm-cmt0006",
    targetId: STORY_2,
    targetType: "story",
    authorType: "agent",
    authorId: PERSONA_PM,
    authorName: "PM",
    content: "Acceptance criteria defined. Focus on cost chart (recharts sparkline), live agent count, and project health indicators.",
    metadata: {},
    createdAt: "2026-03-25T11:02:30Z",
  },
  {
    id: "cm-cmt0007",
    targetId: STORY_2,
    targetType: "story",
    authorType: "agent",
    authorId: PERSONA_TECH_LEAD,
    authorName: "Tech Lead",
    content: "Decomposed into 3 tasks: cost chart, agents strip, health widget. No hard dependencies between them — can be worked in parallel.",
    metadata: { tasksCreated: 3, toolsUsed: ["create_tasks"] },
    createdAt: "2026-03-26T10:06:15Z",
  },
  // Story 3 comments
  {
    id: "cm-cmt0008",
    targetId: STORY_3,
    targetType: "story",
    authorType: "user",
    authorId: null,
    authorName: "Amin",
    content: "Let's tackle this after the dashboard is done. Good to have the tasks scoped though.",
    metadata: {},
    createdAt: "2026-03-23T09:00:00Z",
  },
  // Task-level comments
  {
    id: "cm-cmt0009",
    targetId: TASK_1_2,
    targetType: "task",
    authorType: "system",
    authorId: null,
    authorName: "System",
    content: "Task started — Engineer agent running",
    metadata: {},
    createdAt: "2026-03-27T14:25:00Z",
  },
  {
    id: "cm-cmt0010",
    targetId: TASK_2_1,
    targetType: "task",
    authorType: "user",
    authorId: null,
    authorName: "Amin",
    content: "Use recharts for consistency with the rest of the app. Sparkline style — no axes, just the line.",
    metadata: {},
    createdAt: "2026-03-25T09:30:00Z",
  },
  // More story-level
  {
    id: "cm-cmt0011",
    targetId: STORY_1,
    targetType: "story",
    authorType: "system",
    authorId: null,
    authorName: "System",
    content: "Story moved to In Progress",
    metadata: {},
    createdAt: "2026-03-25T10:00:00Z",
  },
  {
    id: "cm-cmt0012",
    targetId: STORY_2,
    targetType: "story",
    authorType: "system",
    authorId: null,
    authorName: "System",
    content: "Story moved to Decomposing",
    metadata: {},
    createdAt: "2026-03-26T10:00:00Z",
  },
  {
    id: "cm-cmt0013",
    targetId: TASK_1_2,
    targetType: "task",
    authorType: "agent",
    authorId: PERSONA_ENGINEER,
    authorName: "Engineer",
    content: "Starting work on the login UI. Will create a clean login page with social sign-in buttons matching our design system.",
    metadata: { toolsUsed: ["Read", "Glob"] },
    createdAt: "2026-03-27T14:26:00Z",
  },
  {
    id: "cm-cmt0014",
    targetId: STORY_1,
    targetType: "story",
    authorType: "user",
    authorId: null,
    authorName: "Amin",
    content: "Looking good so far. Make sure the login page has a nice loading state while OAuth redirects.",
    metadata: {},
    createdAt: "2026-03-27T15:00:00Z",
  },
  {
    id: "cm-cmt0015",
    targetId: TASK_3_1,
    targetType: "task",
    authorType: "user",
    authorId: null,
    authorName: "Amin",
    content: "For the toast component, use shadcn/ui's Sonner integration.",
    metadata: {},
    createdAt: "2026-03-26T08:30:00Z",
  },
];

// ── Proposals ──────────────────────────────────────────────────────

export const proposals: Proposal[] = [
  {
    id: "pp-prop001",
    executionId: EXEC_3,
    parentId: STORY_1,
    parentType: "story",
    type: "task_creation",
    payload: {
      tasks: [
        { title: "Set up OAuth2 backend routes", description: "Create /auth/google and /auth/github routes" },
        { title: "Build login UI component", description: "Login page with social buttons" },
        { title: "Add session persistence", description: "Session storage and route guards" },
      ],
    },
    status: "approved",
    createdAt: "2026-03-24T09:35:12Z",
  },
  {
    id: "pp-prop002",
    executionId: EXEC_6,
    parentId: STORY_2,
    parentType: "story",
    type: "task_creation",
    payload: {
      tasks: [
        { title: "Create cost tracking chart", description: "Recharts sparkline for 7-day history" },
        { title: "Build active agents strip", description: "Horizontal agent cards with status" },
        { title: "Build health indicator widget", description: "Red/green project health" },
      ],
    },
    status: "pending",
    createdAt: "2026-03-26T10:06:15Z",
  },
];

// ── Project Memory ─────────────────────────────────────────────────

export const projectMemories: ProjectMemory[] = [
  {
    id: "pm-mem0001",
    projectId: PROJECT_ID,
    storyId: STORY_1,
    summary: "OAuth2 authentication implemented with passport.js. Backend routes created for Google and GitHub providers.",
    filesChanged: ["src/routes/auth.ts", "src/middleware/session.ts", "src/config/passport.ts"],
    keyDecisions: ["Used passport.js over custom OAuth implementation", "Session stored in SQLite via better-sqlite3-session-store"],
    createdAt: "2026-03-25T11:30:00Z",
    consolidatedInto: null,
  },
  {
    id: "pm-mem0002",
    projectId: PROJECT_ID,
    storyId: STORY_2,
    summary: "Dashboard story decomposed into 3 parallel tasks: cost chart, agent strip, health widget.",
    filesChanged: [],
    keyDecisions: ["Tasks can be worked in parallel — no dependencies", "Using recharts for chart components"],
    createdAt: "2026-03-26T10:06:15Z",
    consolidatedInto: null,
  },
];

// ── Aggregate fixture export ───────────────────────────────────────

export const fixtures = {
  projects,
  workflows,
  personas,
  stories,
  tasks,
  taskEdges,
  triggers,
  executions,
  comments,
  proposals,
  projectMemories,
};
