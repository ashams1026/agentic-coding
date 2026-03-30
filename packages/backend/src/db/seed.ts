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
const PERSONA_QA = "ps-qa00001";

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

// ── Helper ────────────────────────────────────────────────────────

function d(iso: string): Date {
  return new Date(iso);
}

// ── Seed ─────────���────────────────────────────────────────────────

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

  // ── Projects ���─────────────────────────────────────────────────────
  await db.insert(projects).values({
    id: PROJECT_ID,
    name: "AgentOps",
    path: "/Users/dev/projects/agentops",
    settings: { maxConcurrentAgents: 3, monthlyCostCap: 50 },
    createdAt: d("2026-03-20T10:00:00Z"),
  });

  // ��─ Personas ───────────────────���───────────────────────────────���──
  await db.insert(personas).values([
    {
      id: PERSONA_PM,
      name: "PM",
      description: "Writes acceptance criteria and defines scope.",
      avatar: { color: "#7c3aed", icon: "clipboard-list" },
      systemPrompt: "You are a product manager. Write clear acceptance criteria and define scope.",
      model: "sonnet",
      allowedTools: ["Read", "Glob", "Grep", "WebSearch"],
      mcpTools: ["post_comment", "transition_state"],
      maxBudgetPerRun: 50, // cents
      settings: {},
    },
    {
      id: PERSONA_TECH_LEAD,
      name: "Tech Lead",
      description: "Decomposes work items into children with dependency graphs.",
      avatar: { color: "#2563eb", icon: "git-branch" },
      systemPrompt: "You are a tech lead. Break work items into well-scoped children with clear dependencies.",
      model: "opus",
      allowedTools: ["Read", "Glob", "Grep", "WebSearch", "Bash"],
      mcpTools: ["create_tasks", "post_comment", "request_review"],
      maxBudgetPerRun: 100,
      settings: {},
    },
    {
      id: PERSONA_ENGINEER,
      name: "Engineer",
      description: "Implements work items by writing and modifying code.",
      avatar: { color: "#059669", icon: "code" },
      systemPrompt: "You are a software engineer. Implement the assigned work item following project conventions.",
      model: "sonnet",
      allowedTools: ["Read", "Edit", "Write", "Glob", "Grep", "Bash", "WebFetch"],
      mcpTools: ["post_comment", "flag_blocked", "transition_state"],
      maxBudgetPerRun: 200,
      settings: {},
    },
    {
      id: PERSONA_REVIEWER,
      name: "Reviewer",
      description: "Reviews code changes and provides feedback.",
      avatar: { color: "#d97706", icon: "eye" },
      systemPrompt: "You are a code reviewer. Check for bugs, style issues, and correctness.",
      model: "sonnet",
      allowedTools: ["Read", "Glob", "Grep", "Bash"],
      mcpTools: ["post_comment", "request_review", "transition_state"],
      maxBudgetPerRun: 50,
      settings: {},
    },
    {
      id: PERSONA_QA,
      name: "QA",
      description: "Tests functionality and verifies acceptance criteria.",
      avatar: { color: "#dc2626", icon: "test-tube" },
      systemPrompt: "You are a QA tester. Verify that acceptance criteria are met and there are no regressions.",
      model: "haiku",
      allowedTools: ["Read", "Bash", "Glob", "Grep"],
      mcpTools: ["post_comment", "transition_state"],
      maxBudgetPerRun: 30,
      settings: {},
    },
  ]);

  // ── Work Items ──────────���─────────────────────────────────────────
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

  // ── Persona Assignments ───────���───────────────────────────────────
  await db.insert(personaAssignments).values([
    { projectId: PROJECT_ID, stateName: "Planning", personaId: PERSONA_PM },
    { projectId: PROJECT_ID, stateName: "Decomposition", personaId: PERSONA_TECH_LEAD },
    { projectId: PROJECT_ID, stateName: "In Progress", personaId: PERSONA_ENGINEER },
    { projectId: PROJECT_ID, stateName: "In Review", personaId: PERSONA_REVIEWER },
  ]);

  // ── Executions ──────────────────────────────────────���─────────────
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
  ]);

  // ── Comments ───────��────────────────────────────────���─────────────
  await db.insert(comments).values([
    { id: "cm-cmt0001", workItemId: WI_AUTH, authorType: "user", authorId: null, authorName: "Amin", content: "This is our highest priority. We need auth before we can build any user-facing features.", metadata: {}, createdAt: d("2026-03-21T09:05:00Z") },
    { id: "cm-cmt0002", workItemId: WI_AUTH, authorType: "agent", authorId: PERSONA_PM, authorName: "PM", content: "I've written the acceptance criteria. Key requirements: Google + GitHub OAuth, session persistence, protected routes, and clean logout flow.", metadata: { filesReferenced: ["src/routes/auth.ts"] }, createdAt: d("2026-03-24T09:17:45Z") },
    { id: "cm-cmt0003", workItemId: WI_AUTH, authorType: "agent", authorId: PERSONA_TECH_LEAD, authorName: "Tech Lead", content: "Decomposed into 3 children:\n1. OAuth backend routes (passport.js)\n2. Login UI component\n3. Session persistence + protected routes\n\nItems are ordered by dependency — each blocks the next.", metadata: { childrenCreated: 3, toolsUsed: ["create_tasks"] }, createdAt: d("2026-03-24T09:35:12Z") },
    { id: "cm-cmt0004", workItemId: WI_AUTH_1, authorType: "agent", authorId: PERSONA_ENGINEER, authorName: "Engineer", content: "OAuth routes implemented. Created `/auth/google` and `/auth/github` endpoints with passport strategies. Added callback handlers and session middleware.", metadata: { filesChanged: ["src/routes/auth.ts", "src/middleware/session.ts", "src/config/passport.ts"], toolsUsed: ["Edit", "Write", "Bash"] }, createdAt: d("2026-03-25T10:04:32Z") },
    { id: "cm-cmt0005", workItemId: WI_AUTH_1, authorType: "system", authorId: null, authorName: "System", content: "Work item moved to Done", metadata: {}, createdAt: d("2026-03-25T11:30:00Z") },
    { id: "cm-cmt0006", workItemId: WI_DASH, authorType: "agent", authorId: PERSONA_PM, authorName: "PM", content: "Acceptance criteria defined. Focus on cost chart (recharts sparkline), live agent count, and project health indicators.", metadata: {}, createdAt: d("2026-03-25T11:02:30Z") },
    { id: "cm-cmt0007", workItemId: WI_DASH, authorType: "agent", authorId: PERSONA_TECH_LEAD, authorName: "Tech Lead", content: "Decomposed into 3 children: cost chart, agents strip, health widget. No hard dependencies between them — can be worked in parallel.", metadata: { childrenCreated: 3, toolsUsed: ["create_tasks"] }, createdAt: d("2026-03-26T10:06:15Z") },
    { id: "cm-cmt0008", workItemId: WI_NOTI, authorType: "user", authorId: null, authorName: "Amin", content: "Let's tackle this after the dashboard is done. Good to have the items scoped though.", metadata: {}, createdAt: d("2026-03-23T09:00:00Z") },
    { id: "cm-cmt0009", workItemId: WI_AUTH_2, authorType: "system", authorId: null, authorName: "System", content: "Work item started — Engineer agent running", metadata: {}, createdAt: d("2026-03-27T14:25:00Z") },
    { id: "cm-cmt0010", workItemId: WI_DASH_1, authorType: "user", authorId: null, authorName: "Amin", content: "Use recharts for consistency with the rest of the app. Sparkline style — no axes, just the line.", metadata: {}, createdAt: d("2026-03-25T09:30:00Z") },
    { id: "cm-cmt0011", workItemId: WI_AUTH, authorType: "system", authorId: null, authorName: "System", content: "Work item moved to In Progress", metadata: {}, createdAt: d("2026-03-25T10:00:00Z") },
    { id: "cm-cmt0012", workItemId: WI_DASH, authorType: "system", authorId: null, authorName: "System", content: "Work item moved to Decomposition", metadata: {}, createdAt: d("2026-03-26T10:00:00Z") },
    { id: "cm-cmt0013", workItemId: WI_AUTH_2, authorType: "agent", authorId: PERSONA_ENGINEER, authorName: "Engineer", content: "Starting work on the login UI. Will create a clean login page with social sign-in buttons matching our design system.", metadata: { toolsUsed: ["Read", "Glob"] }, createdAt: d("2026-03-27T14:26:00Z") },
    { id: "cm-cmt0014", workItemId: WI_AUTH, authorType: "user", authorId: null, authorName: "Amin", content: "Looking good so far. Make sure the login page has a nice loading state while OAuth redirects.", metadata: {}, createdAt: d("2026-03-27T15:00:00Z") },
    { id: "cm-cmt0015", workItemId: WI_NOTI_1, authorType: "user", authorId: null, authorName: "Amin", content: "For the toast component, use shadcn/ui's Sonner integration.", metadata: {}, createdAt: d("2026-03-26T08:30:00Z") },
  ]);

  // ── Proposals ──��───────────────────────────────��──────────────────
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

  // ── Project Memories ─────────��────────────────────────────────────
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

  console.log("Seed complete: 1 project, 5 personas, 16 work items, 4 edges, 4 assignments, 8 executions, 15 comments, 2 proposals, 2 memories");
}

// Run if executed directly
seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
