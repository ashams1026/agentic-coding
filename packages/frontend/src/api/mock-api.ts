/**
 * Lightweight mock API layer for frontend-only development.
 *
 * Active only when VITE_MOCK_API=true (set by `pnpm dev:frontend`).
 * Provides in-memory data that persists for the browser session.
 * No external dependencies — just a fetch interceptor with route matching.
 *
 * Tree-shaken out of production builds since it's gated behind
 * an import.meta.env check at the call site.
 */

import type {
  Project,
  WorkItem,
  Agent,
  Execution,
  Comment,
  Proposal,
  Workflow,
  WorkflowStateEntity,
  WorkflowTransitionEntity,
  AgentAssignment,
  DashboardStats,
  CostSummary,
  ExecutionStats,
  ReadyWorkItem,
  ProjectId,
  WorkItemId,
  WorkItemEdgeId,
  AgentId,
  ExecutionId,
  CommentId,
  ChatSessionId,
} from "@agentops/shared";

// ── Helpers ──────────────────────────────────────────────────────

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function list<T>(items: T[]): Response {
  return json({ data: items, total: items.length });
}

function single<T>(item: T | undefined): Response {
  if (!item) return json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404);
  return json({ data: item });
}

function nanoid<T extends string = string>(prefix: string): T {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = prefix + "-";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)] ?? "x";
  return id as T;
}

function isoNow(): string {
  return new Date().toISOString();
}

// ── Seed Data ───────────────────────────────────────────────────

const projects: Project[] = [
  {
    id: "pj-demo001",
    name: "Demo App",
    path: "/Users/dev/projects/demo-app",
    isGlobal: false,
    settings: { maxConcurrent: 2, monthCap: 50 },
    workflowId: "wf-default",
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "pj-blogap1",
    name: "Blog API",
    path: "/Users/dev/projects/blog-api",
    isGlobal: false,
    settings: { maxConcurrent: 3, monthCap: 75 },
    workflowId: "wf-default",
    createdAt: "2026-03-10T09:00:00Z",
  },
  {
    id: "pj-global",
    name: "Global Workspace",
    path: "/",
    isGlobal: true,
    settings: { maxConcurrent: 4, monthCap: 100 },
    workflowId: null,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const agents: Agent[] = [
  {
    id: "ps-pm0001",
    name: "Product Manager",
    description: "Writes acceptance criteria, defines scope, and prioritizes work items.",
    avatar: { color: "#7c3aed", icon: "clipboard-list" },
    systemPrompt: "You are a Product Manager.",
    model: "sonnet",
    allowedTools: ["Read", "Glob", "Grep"],
    mcpTools: ["post_comment", "list_items"],
    skills: [],
    subagents: [],
    maxBudgetPerRun: 50,
    settings: {},
    scope: "global",
    projectId: null,
  },
  {
    id: "ps-eng001",
    name: "Engineer",
    description: "Implements work items by writing and modifying code.",
    avatar: { color: "#059669", icon: "code" },
    systemPrompt: "You are a Software Engineer.",
    model: "sonnet",
    allowedTools: ["Read", "Edit", "Write", "Glob", "Grep", "Bash"],
    mcpTools: ["post_comment", "flag_blocked"],
    skills: [],
    subagents: [],
    maxBudgetPerRun: 200,
    settings: {},
    scope: "global",
    projectId: null,
  },
  {
    id: "ps-rev001",
    name: "Code Reviewer",
    description: "Reviews code changes for correctness, style, and completeness.",
    avatar: { color: "#d97706", icon: "eye" },
    systemPrompt: "You are a Code Reviewer.",
    model: "sonnet",
    allowedTools: ["Read", "Glob", "Grep", "Bash"],
    mcpTools: ["post_comment", "request_review"],
    skills: [],
    subagents: [],
    maxBudgetPerRun: 50,
    settings: {},
    scope: "global",
    projectId: null,
  },
  {
    id: "ps-pico01",
    name: "Pico",
    description: "Your friendly project assistant. Woof!",
    avatar: { color: "#f59e0b", icon: "dog" },
    systemPrompt: "You are Pico, a friendly project assistant.",
    model: "sonnet",
    allowedTools: ["Read", "Glob", "Grep"],
    mcpTools: ["list_items", "get_context"],
    skills: [],
    subagents: [],
    maxBudgetPerRun: 5,
    settings: { isSystem: true, isAssistant: true },
    scope: "global",
    projectId: null,
  },
];

const workItems: WorkItem[] = [
  {
    id: "wi-mock001",
    parentId: null,
    projectId: "pj-demo001",
    title: "Build landing page",
    description: "Create a responsive landing page with hero section, features grid, and CTA.",
    context: { acceptanceCriteria: "- Hero section with title\n- Features grid\n- CTA button" },
    currentState: "In Progress",
    workflowId: "wf-default",
    priority: "p0",
    labels: ["ui", "landing"],
    assignedAgentId: "ps-eng001",
    executionContext: [],
    createdAt: "2026-03-15T10:00:00Z",
    updatedAt: "2026-03-28T14:00:00Z",
    archivedAt: null,
    deletedAt: null,
  },
  {
    id: "wi-mock002",
    parentId: null,
    projectId: "pj-demo001",
    title: "Add user authentication",
    description: "Implement JWT-based auth with login/register forms.",
    context: {},
    currentState: "Planning",
    workflowId: "wf-default",
    priority: "p0",
    labels: ["auth", "security"],
    assignedAgentId: "ps-pm0001",
    executionContext: [],
    createdAt: "2026-03-16T09:00:00Z",
    updatedAt: "2026-03-27T11:00:00Z",
    archivedAt: null,
    deletedAt: null,
  },
  {
    id: "wi-mock003",
    parentId: "wi-mock001",
    projectId: "pj-demo001",
    title: "Hero section component",
    description: "Full-width hero with gradient background, title, subtitle, and CTA button.",
    context: {},
    currentState: "In Review",
    workflowId: "wf-default",
    priority: "p1",
    labels: ["ui"],
    assignedAgentId: "ps-rev001",
    executionContext: [],
    createdAt: "2026-03-20T10:00:00Z",
    updatedAt: "2026-03-28T09:00:00Z",
    archivedAt: null,
    deletedAt: null,
  },
  {
    id: "wi-mock004",
    parentId: "wi-mock001",
    projectId: "pj-demo001",
    title: "Features grid component",
    description: "Responsive 3-column grid with icon, title, and description per feature.",
    context: {},
    currentState: "Ready",
    workflowId: "wf-default",
    priority: "p1",
    labels: ["ui"],
    assignedAgentId: "ps-eng001",
    executionContext: [],
    createdAt: "2026-03-20T10:05:00Z",
    updatedAt: "2026-03-20T10:05:00Z",
    archivedAt: null,
    deletedAt: null,
  },
  {
    id: "wi-mock005",
    parentId: null,
    projectId: "pj-blogap1",
    title: "REST API for blog posts",
    description: "CRUD endpoints with validation and pagination.",
    context: {},
    currentState: "Done",
    workflowId: "wf-default",
    priority: "p0",
    labels: ["api", "crud"],
    assignedAgentId: null,
    executionContext: [],
    createdAt: "2026-03-10T09:00:00Z",
    updatedAt: "2026-03-25T16:00:00Z",
    archivedAt: null,
    deletedAt: null,
  },
  {
    id: "wi-mock006",
    parentId: null,
    projectId: "pj-blogap1",
    title: "Add rate limiting",
    description: "Per-route rate limiting to prevent API abuse.",
    context: {},
    currentState: "Backlog",
    workflowId: "wf-default",
    priority: "p2",
    labels: ["security"],
    assignedAgentId: null,
    executionContext: [],
    createdAt: "2026-03-20T14:00:00Z",
    updatedAt: "2026-03-20T14:00:00Z",
    archivedAt: null,
    deletedAt: null,
  },
];

const executions: Execution[] = [
  {
    id: "ex-mock001",
    workItemId: "wi-mock001",
    agentId: "ps-pm0001",
    status: "completed",
    startedAt: "2026-03-15T10:05:00Z",
    completedAt: "2026-03-15T10:07:00Z",
    costUsd: 12,
    durationMs: 120000,
    summary: "Wrote acceptance criteria for landing page.",
    outcome: "success",
    rejectionPayload: null,
    logs: "Analyzing requirements...\nWriting criteria...\nDone.",
    checkpointMessageId: null,
    structuredOutput: null,
    parentExecutionId: null,
    workflowId: null,
    workflowStateName: null,
    handoffNotes: null,
    model: "sonnet",
    totalTokens: 4500,
    toolUses: 3,
  },
  {
    id: "ex-mock002",
    workItemId: "wi-mock003",
    agentId: "ps-eng001",
    status: "completed",
    startedAt: "2026-03-25T09:00:00Z",
    completedAt: "2026-03-25T09:08:00Z",
    costUsd: 65,
    durationMs: 480000,
    summary: "Built hero section with gradient and CTA.",
    outcome: "success",
    rejectionPayload: null,
    logs: "Creating HeroSection component...\nAdding gradient...\nStyling CTA...\nBuild passes.",
    checkpointMessageId: null,
    structuredOutput: null,
    parentExecutionId: null,
    workflowId: null,
    workflowStateName: null,
    handoffNotes: null,
    model: "sonnet",
    totalTokens: 8200,
    toolUses: 12,
  },
  {
    id: "ex-mock003",
    workItemId: "wi-mock001",
    agentId: "ps-eng001",
    status: "running",
    startedAt: "2026-03-28T10:00:00Z",
    completedAt: null,
    costUsd: 22,
    durationMs: 0,
    summary: "",
    outcome: null,
    rejectionPayload: null,
    logs: "Reading component structure...\nImplementing features grid...",
    checkpointMessageId: null,
    structuredOutput: null,
    parentExecutionId: null,
    workflowId: null,
    workflowStateName: null,
    handoffNotes: null,
    model: "sonnet",
    totalTokens: 3100,
    toolUses: 5,
  },
];

const comments: Comment[] = [
  {
    id: "cm-mock001",
    workItemId: "wi-mock001",
    authorType: "user",
    authorId: null,
    authorName: "Dev",
    content: "Priority landing page. Keep it simple and clean.",
    metadata: {},
    createdAt: "2026-03-15T10:01:00Z",
  },
  {
    id: "cm-mock002",
    workItemId: "wi-mock001",
    authorType: "agent",
    authorId: "ps-pm0001",
    authorName: "Product Manager",
    content: "Acceptance criteria defined: hero, features grid, CTA.",
    metadata: {},
    createdAt: "2026-03-15T10:07:00Z",
  },
  {
    id: "cm-mock003",
    workItemId: "wi-mock003",
    authorType: "agent",
    authorId: "ps-eng001",
    authorName: "Engineer",
    content: "Hero section built with Tailwind gradient. Responsive on mobile.",
    metadata: { filesChanged: ["src/components/HeroSection.tsx"] },
    createdAt: "2026-03-25T09:08:00Z",
  },
];

const proposals: Proposal[] = [
  {
    id: "pp-mock001",
    executionId: "ex-mock001",
    workItemId: "wi-mock001",
    type: "task_creation",
    payload: {
      children: [
        { title: "Hero section component", description: "Full-width hero" },
        { title: "Features grid component", description: "3-column grid" },
        { title: "CTA section", description: "Bottom CTA with email capture" },
      ],
    },
    status: "approved",
    createdAt: "2026-03-15T10:07:00Z",
  },
  {
    id: "pp-mock002",
    executionId: "ex-mock002",
    workItemId: "wi-mock003",
    type: "review_request",
    payload: { summary: "Hero section ready for review" },
    status: "pending",
    createdAt: "2026-03-25T09:08:00Z",
  },
];

const workflows: Workflow[] = [
  {
    id: "wf-default",
    name: "Default Pipeline",
    description: "Standard 6-state development pipeline.",
    scope: "global",
    projectId: null,
    version: 1,
    isPublished: true,
    autoRouting: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
  },
];

const workflowStates: WorkflowStateEntity[] = [
  { id: "ws-backlog", workflowId: "wf-default", name: "Backlog", type: "initial", color: "#6b7280", agentId: null, agentOverrides: [], sortOrder: 0 },
  { id: "ws-planning", workflowId: "wf-default", name: "Planning", type: "intermediate", color: "#7c3aed", agentId: "ps-pm0001", agentOverrides: [], sortOrder: 1 },
  { id: "ws-ready", workflowId: "wf-default", name: "Ready", type: "intermediate", color: "#2563eb", agentId: null, agentOverrides: [], sortOrder: 2 },
  { id: "ws-inprog", workflowId: "wf-default", name: "In Progress", type: "intermediate", color: "#059669", agentId: "ps-eng001", agentOverrides: [], sortOrder: 3 },
  { id: "ws-review", workflowId: "wf-default", name: "In Review", type: "intermediate", color: "#d97706", agentId: "ps-rev001", agentOverrides: [], sortOrder: 4 },
  { id: "ws-done", workflowId: "wf-default", name: "Done", type: "terminal", color: "#10b981", agentId: null, agentOverrides: [], sortOrder: 5 },
];

const workflowTransitions: WorkflowTransitionEntity[] = [
  { id: "wt-01", workflowId: "wf-default", fromStateId: "ws-backlog", toStateId: "ws-planning", label: "Start Planning", sortOrder: 0 },
  { id: "wt-02", workflowId: "wf-default", fromStateId: "ws-planning", toStateId: "ws-ready", label: "Ready for Dev", sortOrder: 1 },
  { id: "wt-03", workflowId: "wf-default", fromStateId: "ws-ready", toStateId: "ws-inprog", label: "Start Work", sortOrder: 2 },
  { id: "wt-04", workflowId: "wf-default", fromStateId: "ws-inprog", toStateId: "ws-review", label: "Submit for Review", sortOrder: 3 },
  { id: "wt-05", workflowId: "wf-default", fromStateId: "ws-review", toStateId: "ws-done", label: "Approve", sortOrder: 4 },
  { id: "wt-06", workflowId: "wf-default", fromStateId: "ws-review", toStateId: "ws-inprog", label: "Request Changes", sortOrder: 5 },
];

const agentAssignments: AgentAssignment[] = [
  { projectId: "pj-demo001", stateName: "Planning", agentId: "ps-pm0001" },
  { projectId: "pj-demo001", stateName: "In Progress", agentId: "ps-eng001" },
  { projectId: "pj-demo001", stateName: "In Review", agentId: "ps-rev001" },
  { projectId: "pj-blogap1", stateName: "Planning", agentId: "ps-pm0001" },
  { projectId: "pj-blogap1", stateName: "In Progress", agentId: "ps-eng001" },
  { projectId: "pj-blogap1", stateName: "In Review", agentId: "ps-rev001" },
];

// ── Route matching ──────────────────────────────────────────────

interface RouteMatch {
  params: Record<string, string>;
}

function matchRoute(pattern: string, path: string): RouteMatch | null {
  const patternParts = pattern.split("/");
  const pathParts = path.split("/");

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i] ?? "";
    const pathP = pathParts[i] ?? "";
    if (pp.startsWith(":")) {
      params[pp.slice(1)] = pathP;
    } else if (pp !== pathP) {
      return null;
    }
  }
  return { params };
}

// ── Mock fetch handler ──────────────────────────────────────────

type MockHandler = (
  url: URL,
  params: Record<string, string>,
  init?: RequestInit,
) => Response | Promise<Response>;

interface MockRoute {
  method: string;
  pattern: string;
  handler: MockHandler;
}

const routes: MockRoute[] = [
  // ── Health ──
  {
    method: "GET",
    pattern: "/api/health",
    handler: () =>
      json({
        status: "ok",
        uptime: 86400,
        activeExecutions: executions.filter((e) => e.status === "running").length,
        executor: "mock",
        version: "0.0.1-mock",
      }),
  },

  // ── Projects ──
  {
    method: "GET",
    pattern: "/api/projects",
    handler: () => list(projects),
  },
  {
    method: "GET",
    pattern: "/api/projects/:id",
    handler: (_url, p) => single(projects.find((x) => x.id === p.id)),
  },
  {
    method: "POST",
    pattern: "/api/projects",
    handler: async (_url, _p, init) => {
      const body = JSON.parse((init?.body as string) ?? "{}");
      const proj: Project = {
        id: nanoid<ProjectId>("pj"),
        name: body.name ?? "New Project",
        path: body.path ?? "/tmp/project",
        isGlobal: false,
        settings: body.settings ?? {},
        workflowId: null,
        createdAt: isoNow(),
      };
      projects.push(proj);
      return json({ data: proj }, 201);
    },
  },
  {
    method: "PATCH",
    pattern: "/api/projects/:id",
    handler: async (_url, p, init) => {
      const proj = projects.find((x) => x.id === p.id);
      if (!proj) return json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404);
      const body = JSON.parse((init?.body as string) ?? "{}");
      Object.assign(proj, body);
      return json({ data: proj });
    },
  },
  {
    method: "DELETE",
    pattern: "/api/projects/:id",
    handler: (_url, p) => {
      const idx = projects.findIndex((x) => x.id === p.id);
      if (idx >= 0) projects.splice(idx, 1);
      return json({ success: true });
    },
  },

  // ── Work Items ──
  {
    method: "GET",
    pattern: "/api/work-items",
    handler: (url) => {
      let items = [...workItems];
      const projectId = url.searchParams.get("projectId");
      const parentId = url.searchParams.get("parentId");
      const deleted = url.searchParams.get("deleted");
      if (projectId) items = items.filter((i) => i.projectId === projectId);
      if (parentId) items = items.filter((i) => i.parentId === parentId);
      if (deleted === "true") {
        items = items.filter((i) => i.deletedAt !== null);
      } else {
        items = items.filter((i) => i.deletedAt === null);
      }
      return list(items);
    },
  },
  {
    method: "GET",
    pattern: "/api/work-items/:id",
    handler: (_url, p) => single(workItems.find((x) => x.id === p.id)),
  },
  {
    method: "POST",
    pattern: "/api/work-items",
    handler: async (_url, _p, init) => {
      const body = JSON.parse((init?.body as string) ?? "{}");
      const item: WorkItem = {
        id: nanoid<WorkItemId>("wi"),
        parentId: body.parentId ?? null,
        projectId: body.projectId ?? "pj-demo001",
        title: body.title ?? "New Work Item",
        description: body.description ?? "",
        context: body.context ?? {},
        currentState: "Backlog",
        workflowId: "wf-default",
        priority: body.priority ?? "p1",
        labels: body.labels ?? [],
        assignedAgentId: null,
        executionContext: [],
        createdAt: isoNow(),
        updatedAt: isoNow(),
        archivedAt: null,
        deletedAt: null,
      };
      workItems.push(item);
      return json({ data: item }, 201);
    },
  },
  {
    method: "PATCH",
    pattern: "/api/work-items/:id",
    handler: async (_url, p, init) => {
      const item = workItems.find((x) => x.id === p.id);
      if (!item) return json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404);
      const body = JSON.parse((init?.body as string) ?? "{}");
      Object.assign(item, body, { updatedAt: isoNow() });
      return json({ data: item });
    },
  },
  {
    method: "DELETE",
    pattern: "/api/work-items/:id",
    handler: (_url, p) => {
      const idx = workItems.findIndex((x) => x.id === p.id);
      if (idx >= 0) workItems.splice(idx, 1);
      return json({ success: true });
    },
  },
  {
    method: "POST",
    pattern: "/api/work-items/:id/retry",
    handler: (_url, p) => {
      const item = workItems.find((x) => x.id === p.id);
      if (item) item.updatedAt = isoNow();
      return json({ success: true });
    },
  },
  {
    method: "POST",
    pattern: "/api/work-items/:id/archive",
    handler: (_url, p) => {
      const item = workItems.find((x) => x.id === p.id);
      if (item) item.archivedAt = isoNow();
      return json({ data: { archivedCount: 1 } });
    },
  },
  {
    method: "POST",
    pattern: "/api/work-items/:id/unarchive",
    handler: (_url, p) => {
      const item = workItems.find((x) => x.id === p.id);
      if (item) {
        item.archivedAt = null;
        return json({ data: item });
      }
      return json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404);
    },
  },
  {
    method: "POST",
    pattern: "/api/work-items/:id/restore",
    handler: (_url, p) => {
      const item = workItems.find((x) => x.id === p.id);
      if (item) {
        item.deletedAt = null;
        return json({ data: item });
      }
      return json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404);
    },
  },
  {
    method: "POST",
    pattern: "/api/work-items/bulk/archive",
    handler: async (_url, _p, init) => {
      const body = JSON.parse((init?.body as string) ?? "{}");
      const ids: string[] = body.ids ?? [];
      let count = 0;
      for (const id of ids) {
        const item = workItems.find((x) => x.id === id);
        if (item) {
          item.archivedAt = isoNow();
          count++;
        }
      }
      return json({ data: { archivedCount: count } });
    },
  },
  {
    method: "DELETE",
    pattern: "/api/work-items/bulk",
    handler: async (_url, _p, init) => {
      const body = JSON.parse((init?.body as string) ?? "{}");
      const ids: string[] = body.ids ?? [];
      for (const id of ids) {
        const idx = workItems.findIndex((x) => x.id === id);
        if (idx >= 0) workItems.splice(idx, 1);
      }
      return json({ success: true });
    },
  },

  // ── Work Item Edges ──
  {
    method: "GET",
    pattern: "/api/work-item-edges",
    handler: () => list([]),
  },
  {
    method: "POST",
    pattern: "/api/work-item-edges",
    handler: async (_url, _p, init) => {
      const body = JSON.parse((init?.body as string) ?? "{}");
      return json({ data: { id: nanoid<WorkItemEdgeId>("we"), ...body } }, 201);
    },
  },
  {
    method: "DELETE",
    pattern: "/api/work-item-edges/:id",
    handler: () => json({ success: true }),
  },

  // ── Agent Assignments ──
  {
    method: "GET",
    pattern: "/api/agent-assignments",
    handler: (url) => {
      const projectId = url.searchParams.get("projectId");
      const filtered = projectId
        ? agentAssignments.filter((a) => a.projectId === projectId)
        : agentAssignments;
      return list(filtered);
    },
  },
  {
    method: "PUT",
    pattern: "/api/agent-assignments",
    handler: async (_url, _p, init) => {
      const body = JSON.parse((init?.body as string) ?? "{}");
      const existing = agentAssignments.find(
        (a) => a.projectId === body.projectId && a.stateName === body.stateName,
      );
      if (existing) {
        existing.agentId = body.agentId;
        return json({ data: existing });
      }
      const aa: AgentAssignment = {
        projectId: body.projectId,
        stateName: body.stateName,
        agentId: body.agentId,
      };
      agentAssignments.push(aa);
      return json({ data: aa }, 201);
    },
  },

  // ── Agents ──
  {
    method: "GET",
    pattern: "/api/agents",
    handler: () => list(agents),
  },
  {
    method: "GET",
    pattern: "/api/agents/:id",
    handler: (_url, p) => single(agents.find((x) => x.id === p.id)),
  },
  {
    method: "POST",
    pattern: "/api/agents",
    handler: async (_url, _p, init) => {
      const body = JSON.parse((init?.body as string) ?? "{}");
      const agent: Agent = {
        id: nanoid<AgentId>("ps"),
        name: body.name ?? "New Agent",
        description: body.description ?? "",
        avatar: body.avatar ?? { color: "#6b7280", icon: "bot" },
        systemPrompt: body.systemPrompt ?? "",
        model: body.model ?? "sonnet",
        allowedTools: body.allowedTools ?? [],
        mcpTools: body.mcpTools ?? [],
        skills: body.skills ?? [],
        subagents: body.subagents ?? [],
        maxBudgetPerRun: body.maxBudgetPerRun ?? 100,
        settings: body.settings ?? {},
        scope: body.scope ?? "global",
        projectId: body.projectId ?? null,
      };
      agents.push(agent);
      return json({ data: agent }, 201);
    },
  },
  {
    method: "PATCH",
    pattern: "/api/agents/:id",
    handler: async (_url, p, init) => {
      const agent = agents.find((x) => x.id === p.id);
      if (!agent) return json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404);
      const body = JSON.parse((init?.body as string) ?? "{}");
      Object.assign(agent, body);
      return json({ data: agent });
    },
  },
  {
    method: "DELETE",
    pattern: "/api/agents/:id",
    handler: (_url, p) => {
      const idx = agents.findIndex((x) => x.id === p.id);
      if (idx >= 0) agents.splice(idx, 1);
      return json({ success: true });
    },
  },

  // ── Executions ──
  {
    method: "GET",
    pattern: "/api/executions",
    handler: (url) => {
      let items = [...executions];
      const workItemId = url.searchParams.get("workItemId");
      const projectId = url.searchParams.get("projectId");
      if (workItemId) items = items.filter((e) => e.workItemId === workItemId);
      if (projectId) {
        const projectWorkItemIds = new Set(
          workItems.filter((wi) => wi.projectId === projectId).map((wi) => wi.id),
        );
        items = items.filter((e) => e.workItemId && projectWorkItemIds.has(e.workItemId));
      }
      return list(items);
    },
  },
  {
    method: "GET",
    pattern: "/api/executions/:id",
    handler: (_url, p) => single(executions.find((x) => x.id === p.id)),
  },
  {
    method: "POST",
    pattern: "/api/executions/:id/rewind",
    handler: () =>
      json({
        data: {
          canRewind: true,
          filesChanged: ["src/example.ts"],
          insertions: 10,
          deletions: 5,
          dryRun: true,
        },
      }),
  },
  {
    method: "POST",
    pattern: "/api/executions/run",
    handler: () => json({ id: nanoid<ExecutionId>("ex") }),
  },
  {
    method: "GET",
    pattern: "/api/executions/queue",
    handler: () =>
      json({
        data: {
          queue: [],
          activeCount: executions.filter((e) => e.status === "running").length,
          maxConcurrent: 4,
          queueLength: 0,
        },
      }),
  },
  {
    method: "GET",
    pattern: "/api/executions/:id/mcp/status",
    handler: () => json({ data: [] }),
  },
  {
    method: "POST",
    pattern: "/api/executions/:id/mcp/reconnect",
    handler: () => json({ success: true }),
  },
  {
    method: "GET",
    pattern: "/api/executions/:id/models",
    handler: () =>
      json({
        data: [
          { value: "opus", displayName: "Claude Opus", description: "Most capable" },
          { value: "sonnet", displayName: "Claude Sonnet", description: "Fast & smart" },
          { value: "haiku", displayName: "Claude Haiku", description: "Fastest" },
        ],
      }),
  },
  {
    method: "POST",
    pattern: "/api/executions/:id/model",
    handler: () => json({ success: true }),
  },

  // ── Comments ──
  {
    method: "GET",
    pattern: "/api/comments",
    handler: (url) => {
      const workItemId = url.searchParams.get("workItemId");
      const filtered = workItemId
        ? comments.filter((c) => c.workItemId === workItemId)
        : comments;
      return list(filtered);
    },
  },
  {
    method: "POST",
    pattern: "/api/comments",
    handler: async (_url, _p, init) => {
      const body = JSON.parse((init?.body as string) ?? "{}");
      const comment: Comment = {
        id: nanoid<CommentId>("cm"),
        workItemId: body.workItemId,
        authorType: body.authorType ?? "user",
        authorId: body.authorId ?? null,
        authorName: body.authorName ?? "User",
        content: body.content ?? "",
        metadata: body.metadata ?? {},
        createdAt: isoNow(),
      };
      comments.push(comment);
      return json({ data: comment }, 201);
    },
  },

  // ── Proposals ──
  {
    method: "GET",
    pattern: "/api/proposals",
    handler: (url) => {
      let items = [...proposals];
      const workItemId = url.searchParams.get("workItemId");
      const projectId = url.searchParams.get("projectId");
      if (workItemId) items = items.filter((p) => p.workItemId === workItemId);
      if (projectId) {
        const projectWorkItemIds = new Set(
          workItems.filter((wi) => wi.projectId === projectId).map((wi) => wi.id),
        );
        items = items.filter((p) => projectWorkItemIds.has(p.workItemId));
      }
      return list(items);
    },
  },
  {
    method: "GET",
    pattern: "/api/proposals/:id",
    handler: (_url, p) => single(proposals.find((x) => x.id === p.id)),
  },
  {
    method: "PATCH",
    pattern: "/api/proposals/:id",
    handler: async (_url, p, init) => {
      const proposal = proposals.find((x) => x.id === p.id);
      if (!proposal) return json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404);
      const body = JSON.parse((init?.body as string) ?? "{}");
      Object.assign(proposal, body);
      return json({ data: proposal });
    },
  },

  // ── Dashboard / Aggregates ──
  {
    method: "GET",
    pattern: "/api/dashboard/stats",
    handler: (): Response => {
      const stats: DashboardStats = {
        activeAgents: executions.filter((e) => e.status === "running").length,
        pendingProposals: proposals.filter((p) => p.status === "pending").length,
        needsAttention: workItems.filter((w) => w.currentState === "Blocked").length,
        todayCostUsd: 45,
      };
      return json(stats);
    },
  },
  {
    method: "GET",
    pattern: "/api/dashboard/cost-summary",
    handler: (): Response => {
      const summary: CostSummary = {
        dailySpend: [
          { date: "2026-03-25", costUsd: 35 },
          { date: "2026-03-26", costUsd: 88 },
          { date: "2026-03-27", costUsd: 28 },
          { date: "2026-03-28", costUsd: 45 },
        ],
        monthTotal: 196,
        monthCap: 500,
      };
      return json(summary);
    },
  },
  {
    method: "GET",
    pattern: "/api/dashboard/execution-stats",
    handler: (): Response => {
      const stats: ExecutionStats = {
        totalRuns: executions.length,
        totalCostUsd: executions.reduce((sum, e) => sum + e.costUsd, 0),
        successRate: 0.85,
        averageDurationMs: 300000,
      };
      return json(stats);
    },
  },
  {
    method: "GET",
    pattern: "/api/dashboard/ready-work",
    handler: (): Response => {
      const ready: ReadyWorkItem[] = workItems
        .filter((w) => w.currentState === "Ready")
        .map((w) => ({
          workItem: w,
          agent: agents.find((a) => a.id === w.assignedAgentId) ?? null,
        }));
      return list(ready);
    },
  },

  // ── Settings ──
  {
    method: "GET",
    pattern: "/api/settings/api-key",
    handler: () => json({ configured: true, maskedKey: "sk-...mock" }),
  },
  {
    method: "POST",
    pattern: "/api/settings/api-key",
    handler: () => json({ valid: true, configured: true, maskedKey: "sk-...mock" }),
  },
  {
    method: "DELETE",
    pattern: "/api/settings/api-key",
    handler: () => json({ configured: false, maskedKey: null }),
  },
  {
    method: "GET",
    pattern: "/api/settings/concurrency",
    handler: () => json({ active: 1, queued: 0 }),
  },
  {
    method: "GET",
    pattern: "/api/settings/executor-mode",
    handler: () => json({ mode: "mock", isProduction: false }),
  },
  {
    method: "PUT",
    pattern: "/api/settings/executor-mode",
    handler: async (_url, _p, init) => {
      const body = JSON.parse((init?.body as string) ?? "{}");
      return json({ mode: body.mode ?? "mock" });
    },
  },
  {
    method: "GET",
    pattern: "/api/settings/db-stats",
    handler: () =>
      json({
        sizeBytes: 524288,
        sizeMB: 0.5,
        executionCount: executions.length,
        projectCount: projects.length,
        agentCount: agents.length,
      }),
  },
  {
    method: "DELETE",
    pattern: "/api/settings/executions",
    handler: () => {
      executions.length = 0;
      return json({ deleted: 3 });
    },
  },
  {
    method: "POST",
    pattern: "/api/settings/browse-directory",
    handler: () =>
      json({
        currentPath: "/Users/dev",
        entries: [
          { name: "projects", path: "/Users/dev/projects", isDirectory: true },
          { name: "documents", path: "/Users/dev/documents", isDirectory: true },
        ],
      }),
  },
  {
    method: "POST",
    pattern: "/api/settings/read-file",
    handler: () =>
      json({
        filePath: "/example.ts",
        content: "// Mock file content\nexport const hello = 'world';",
        totalLines: 2,
      }),
  },
  {
    method: "GET",
    pattern: "/api/settings/export",
    handler: () => json({ projects: projects.length, agents: agents.length }),
  },
  {
    method: "POST",
    pattern: "/api/settings/import",
    handler: () => json({ imported: { projects: 0, agents: 0 } }),
  },

  // ── Service ──
  {
    method: "GET",
    pattern: "/api/service/status",
    handler: () => json({ activeExecutions: [] }),
  },
  {
    method: "POST",
    pattern: "/api/service/restart",
    handler: () => json({ restarting: true, force: false }),
  },

  // ── SDK Capabilities ──
  {
    method: "GET",
    pattern: "/api/sdk/capabilities",
    handler: () =>
      json({
        data: {
          commands: [],
          agents: [],
          models: [
            { value: "opus", displayName: "Claude Opus", description: "Most capable" },
            { value: "sonnet", displayName: "Claude Sonnet", description: "Fast & smart" },
            { value: "haiku", displayName: "Claude Haiku", description: "Fastest" },
          ],
          cachedAt: isoNow(),
        },
      }),
  },
  {
    method: "POST",
    pattern: "/api/sdk/reload",
    handler: () =>
      json({
        data: { commands: [], agents: [], models: [], cachedAt: isoNow() },
      }),
  },

  // ── Chat ──
  {
    method: "GET",
    pattern: "/api/chat/sessions",
    handler: () => list([]),
  },
  {
    method: "POST",
    pattern: "/api/chat/sessions",
    handler: async (_url, _p, init) => {
      const body = JSON.parse((init?.body as string) ?? "{}");
      return json({
        data: {
          id: nanoid<ChatSessionId>("cs"),
          projectId: body.projectId ?? null,
          agentId: body.agentId ?? null,
          workItemId: null,
          sdkSessionId: null,
          title: "New Chat",
          createdAt: isoNow(),
          updatedAt: isoNow(),
        },
      }, 201);
    },
  },
  {
    method: "PATCH",
    pattern: "/api/chat/sessions/:id",
    handler: async (_url, _p, init) => {
      const body = JSON.parse((init?.body as string) ?? "{}");
      return json({
        data: {
          id: "cs-mock",
          projectId: null,
          agentId: null,
          workItemId: null,
          sdkSessionId: null,
          title: body.title ?? "Chat",
          createdAt: isoNow(),
          updatedAt: isoNow(),
        },
      });
    },
  },
  {
    method: "DELETE",
    pattern: "/api/chat/sessions/:id",
    handler: () => json({ success: true }),
  },
  {
    method: "GET",
    pattern: "/api/chat/sessions/:id/messages",
    handler: () => list([]),
  },
  {
    method: "POST",
    pattern: "/api/chat/sessions/:id/messages",
    handler: () => {
      // Return a streaming-like response for SSE compatibility
      const text = "data: {\"type\":\"text\",\"content\":\"Hello from mock mode! The backend is not running.\"}\n\ndata: {\"type\":\"done\"}\n\n";
      return new Response(text, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    },
  },

  // ── Workflows ──
  {
    method: "GET",
    pattern: "/api/workflows",
    handler: () => list(workflows),
  },
  {
    method: "GET",
    pattern: "/api/workflows/:id",
    handler: (_url, p) => {
      const wf = workflows.find((w) => w.id === p.id);
      if (!wf) return json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404);
      return json({
        data: {
          ...wf,
          states: workflowStates.filter((s) => s.workflowId === p.id),
          transitions: workflowTransitions.filter((t) => t.workflowId === p.id),
        },
      });
    },
  },
  {
    method: "GET",
    pattern: "/api/workflows/:id/states",
    handler: (_url, p) => list(workflowStates.filter((s) => s.workflowId === p.id)),
  },
  {
    method: "GET",
    pattern: "/api/workflows/:id/transitions",
    handler: (_url, p) => list(workflowTransitions.filter((t) => t.workflowId === p.id)),
  },
  {
    method: "POST",
    pattern: "/api/workflows",
    handler: async (_url, _p, init) => {
      const body = JSON.parse((init?.body as string) ?? "{}");
      const wf: Workflow = {
        id: nanoid("wf"),
        name: body.name ?? "New Workflow",
        description: "",
        scope: "global",
        projectId: body.projectId ?? null,
        version: 1,
        isPublished: false,
        autoRouting: false,
        createdAt: isoNow(),
        updatedAt: isoNow(),
      };
      workflows.push(wf);
      return json({ data: wf }, 201);
    },
  },
  {
    method: "PATCH",
    pattern: "/api/workflows/:id",
    handler: async (_url, p, init) => {
      const wf = workflows.find((w) => w.id === p.id);
      if (!wf) return json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404);
      const body = JSON.parse((init?.body as string) ?? "{}");
      Object.assign(wf, { name: body.name ?? wf.name, description: body.description ?? wf.description, updatedAt: isoNow() });
      return json({ data: wf });
    },
  },
  {
    method: "POST",
    pattern: "/api/workflows/:id/publish",
    handler: (_url, p) => {
      const wf = workflows.find((w) => w.id === p.id);
      if (!wf) return json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404);
      wf.isPublished = true;
      return json({ data: wf });
    },
  },
  {
    method: "POST",
    pattern: "/api/workflows/:id/validate",
    handler: () => json({ data: { valid: true, errors: [] } }),
  },
  {
    method: "DELETE",
    pattern: "/api/workflows/:id",
    handler: (_url, p) => {
      const idx = workflows.findIndex((w) => w.id === p.id);
      if (idx >= 0) workflows.splice(idx, 1);
      return json({ success: true });
    },
  },

  // ── Search ──
  {
    method: "GET",
    pattern: "/api/search",
    handler: (url) => {
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      const results = workItems
        .filter((wi) => wi.title.toLowerCase().includes(q) || wi.description.toLowerCase().includes(q))
        .slice(0, 10)
        .map((wi, i) => ({
          type: "work_item" as const,
          id: wi.id,
          title: wi.title,
          snippet: wi.description.slice(0, 100),
          score: 1 - i * 0.1,
          projectId: wi.projectId,
        }));
      return list(results);
    },
  },

  // ── Analytics ──
  {
    method: "GET",
    pattern: "/api/analytics/cost-by-agent",
    handler: () =>
      json({
        data: agents.slice(0, 3).map((a) => ({
          agentId: a.id,
          agentName: a.name,
          costUsd: Math.round(Math.random() * 100),
          totalTokens: Math.round(Math.random() * 50000),
          executionCount: Math.round(Math.random() * 10),
        })),
      }),
  },
  {
    method: "GET",
    pattern: "/api/analytics/cost-by-model",
    handler: () =>
      json({
        data: [
          { model: "sonnet", costUsd: 120, totalTokens: 45000, executionCount: 8 },
          { model: "opus", costUsd: 88, totalTokens: 22000, executionCount: 2 },
          { model: "haiku", costUsd: 5, totalTokens: 8000, executionCount: 4 },
        ],
      }),
  },
  {
    method: "GET",
    pattern: "/api/analytics/tokens-over-time",
    handler: () =>
      json({
        data: [
          { date: "2026-03-25", totalTokens: 15000, costUsd: 35, executionCount: 3 },
          { date: "2026-03-26", totalTokens: 22000, costUsd: 88, executionCount: 2 },
          { date: "2026-03-27", totalTokens: 8000, costUsd: 28, executionCount: 2 },
          { date: "2026-03-28", totalTokens: 11000, costUsd: 45, executionCount: 2 },
        ],
      }),
  },
  {
    method: "GET",
    pattern: "/api/analytics/top-executions",
    handler: () =>
      json({
        data: executions.slice(0, 3).map((e) => ({
          id: e.id,
          agentId: e.agentId,
          agentName: agents.find((a) => a.id === e.agentId)?.name ?? "Unknown",
          model: e.model ?? "sonnet",
          costUsd: e.costUsd,
          totalTokens: e.totalTokens ?? 0,
          toolUses: e.toolUses ?? 0,
          durationMs: e.durationMs,
          startedAt: e.startedAt,
        })),
      }),
  },
];

// ── Fetch interceptor ───────────────────────────────────────────

const originalFetch = globalThis.fetch;

function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = input instanceof Request ? input : null;
  const urlStr = request ? request.url : String(input);
  const method = (init?.method ?? request?.method ?? "GET").toUpperCase();

  // Only intercept requests to our API base URL
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    // Not a full URL — pass through
    return originalFetch(input, init);
  }

  // Only intercept localhost:3001 requests (our API)
  if (url.hostname !== "localhost" || url.port !== "3001") {
    return originalFetch(input, init);
  }

  const path = url.pathname;

  // Try to match a route, checking most specific (longer) patterns first
  // Sort routes with more segments first for correct matching
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = matchRoute(route.pattern, path);
    if (match) {
      // Small delay to simulate network latency
      return new Promise((resolve) => {
        setTimeout(async () => {
          try {
            const response = await route.handler(url, match.params, init);
            resolve(response);
          } catch (err) {
            resolve(
              json({ error: { code: "INTERNAL_ERROR", message: String(err) } }, 500),
            );
          }
        }, 50 + Math.random() * 100);
      });
    }
  }

  // No match — return 404
  console.warn(`[mock-api] No handler for ${method} ${path}`);
  return Promise.resolve(
    json({ error: { code: "NOT_FOUND", message: `No mock handler for ${method} ${path}` } }, 404),
  );
}

// ── Public API ──────────────────────────────────────────────────

export function enableMockApi(): void {
  globalThis.fetch = mockFetch as typeof globalThis.fetch;
  console.log(
    "%c[mock-api] Mock API enabled — all requests to localhost:3001 are intercepted",
    "color: #f59e0b; font-weight: bold",
  );
}

/** Check if mock mode is active. */
export function isMockMode(): boolean {
  return import.meta.env.VITE_MOCK_API === "true";
}
