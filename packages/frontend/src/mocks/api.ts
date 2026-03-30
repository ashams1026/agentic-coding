import type {
  Project,
  WorkItem,
  WorkItemEdge,
  Persona,
  PersonaAssignment,
  Execution,
  Comment,
  ProjectMemory,
  Proposal,
  ProjectId,
  WorkItemId,
  WorkItemEdgeId,
  PersonaId,
  ExecutionId,
  ProposalId,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateWorkItemRequest,
  UpdateWorkItemRequest,
  CreateWorkItemEdgeRequest,
  UpsertPersonaAssignmentRequest,
  CreatePersonaRequest,
  UpdatePersonaRequest,
  CreateCommentRequest,
  UpdateProposalRequest,
  DashboardStats,
  CostSummary,
  ExecutionStats,
  ReadyWorkItem,
} from "@agentops/shared";
import { createId, WORKFLOW } from "@agentops/shared";
import { fixtures } from "./fixtures";

// ── Simulated latency ─────────────────────────────────────────────

function delay(): Promise<void> {
  const ms = 50 + Math.random() * 100; // 50-150ms
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── In-memory store ───────────────────────────────────────────────

interface Store {
  projects: Project[];
  workItems: WorkItem[];
  workItemEdges: WorkItemEdge[];
  personas: Persona[];
  personaAssignments: PersonaAssignment[];
  executions: Execution[];
  comments: Comment[];
  projectMemories: ProjectMemory[];
  proposals: Proposal[];
}

const store: Store = {
  projects: [...fixtures.projects],
  workItems: [...fixtures.workItems],
  workItemEdges: [...fixtures.workItemEdges],
  personas: [...fixtures.personas],
  personaAssignments: [...fixtures.personaAssignments],
  executions: [...fixtures.executions],
  comments: [...fixtures.comments],
  projectMemories: [...fixtures.projectMemories],
  proposals: [...fixtures.proposals],
};

/** Reset store to initial fixture state (useful for tests / demo reset) */
export function resetStore(): void {
  store.projects = [...fixtures.projects];
  store.workItems = [...fixtures.workItems];
  store.workItemEdges = [...fixtures.workItemEdges];
  store.personas = [...fixtures.personas];
  store.personaAssignments = [...fixtures.personaAssignments];
  store.executions = [...fixtures.executions];
  store.comments = [...fixtures.comments];
  store.projectMemories = [...fixtures.projectMemories];
  store.proposals = [...fixtures.proposals];
}

// ── Projects ──────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  await delay();
  return store.projects;
}

export async function getProject(id: ProjectId): Promise<Project | null> {
  await delay();
  return store.projects.find((p) => p.id === id) ?? null;
}

export async function createProject(req: CreateProjectRequest): Promise<Project> {
  await delay();
  const project: Project = {
    id: createId.project(),
    name: req.name,
    path: req.path,
    settings: req.settings ?? {},
    createdAt: new Date().toISOString(),
  };
  store.projects.push(project);
  return project;
}

export async function updateProject(
  id: ProjectId,
  req: UpdateProjectRequest,
): Promise<Project | null> {
  await delay();
  const project = store.projects.find((p) => p.id === id);
  if (!project) return null;
  if (req.name !== undefined) project.name = req.name;
  if (req.path !== undefined) project.path = req.path;
  if (req.settings !== undefined) project.settings = req.settings;
  return project;
}

export async function deleteProject(id: ProjectId): Promise<boolean> {
  await delay();
  const idx = store.projects.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  store.projects.splice(idx, 1);
  return true;
}

// ── Work Items ───────────────────────────────────────────────────

export async function getWorkItems(parentId?: WorkItemId | null, projectId?: ProjectId): Promise<WorkItem[]> {
  await delay();
  let items = store.workItems;
  if (parentId !== undefined) items = items.filter((w) => w.parentId === parentId);
  if (projectId) items = items.filter((w) => w.projectId === projectId);
  return items;
}

export async function getWorkItem(id: WorkItemId): Promise<WorkItem | null> {
  await delay();
  return store.workItems.find((w) => w.id === id) ?? null;
}

export async function createWorkItem(req: CreateWorkItemRequest): Promise<WorkItem> {
  await delay();
  const workItem: WorkItem = {
    id: createId.workItem(),
    parentId: req.parentId ?? null,
    projectId: req.projectId,
    title: req.title,
    description: req.description ?? "",
    context: req.context ?? {},
    currentState: WORKFLOW.initialState,
    priority: req.priority ?? "p2",
    labels: req.labels ?? [],
    assignedPersonaId: null,
    executionContext: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.workItems.push(workItem);
  return workItem;
}

export async function updateWorkItem(
  id: WorkItemId,
  req: UpdateWorkItemRequest,
): Promise<WorkItem | null> {
  await delay();
  const workItem = store.workItems.find((w) => w.id === id);
  if (!workItem) return null;
  if (req.title !== undefined) workItem.title = req.title;
  if (req.description !== undefined) workItem.description = req.description;
  if (req.priority !== undefined) workItem.priority = req.priority;
  if (req.labels !== undefined) workItem.labels = req.labels;
  if (req.currentState !== undefined) workItem.currentState = req.currentState;
  if (req.context !== undefined) workItem.context = req.context;
  if (req.assignedPersonaId !== undefined) workItem.assignedPersonaId = req.assignedPersonaId;
  workItem.updatedAt = new Date().toISOString();
  return workItem;
}

export async function deleteWorkItem(id: WorkItemId): Promise<boolean> {
  await delay();
  const idx = store.workItems.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  store.workItems.splice(idx, 1);
  // Also remove children recursively
  const childIds = store.workItems.filter((w) => w.parentId === id).map((w) => w.id);
  for (const childId of childIds) {
    await deleteWorkItem(childId);
  }
  return true;
}

export async function retryWorkItem(_id: WorkItemId): Promise<void> {
  await delay();
  // Mock: no-op — in real mode this re-dispatches the persona
}

// ── Work Item Edges ──────────────────────────────────────────────

export async function getWorkItemEdges(workItemId?: WorkItemId): Promise<WorkItemEdge[]> {
  await delay();
  if (workItemId) return store.workItemEdges.filter((e) => e.fromId === workItemId || e.toId === workItemId);
  return store.workItemEdges;
}

export async function createWorkItemEdge(req: CreateWorkItemEdgeRequest): Promise<WorkItemEdge> {
  await delay();
  const edge: WorkItemEdge = {
    id: createId.workItemEdge(),
    fromId: req.fromId,
    toId: req.toId,
    type: req.type,
  };
  store.workItemEdges.push(edge);
  return edge;
}

export async function deleteWorkItemEdge(id: WorkItemEdgeId): Promise<boolean> {
  await delay();
  const idx = store.workItemEdges.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  store.workItemEdges.splice(idx, 1);
  return true;
}

// ── Persona Assignments ──────────────────────────────────────────

export async function getPersonaAssignments(projectId: ProjectId): Promise<PersonaAssignment[]> {
  await delay();
  return store.personaAssignments.filter((pa) => pa.projectId === projectId);
}

export async function updatePersonaAssignment(
  req: UpsertPersonaAssignmentRequest,
): Promise<PersonaAssignment> {
  await delay();
  const existing = store.personaAssignments.find(
    (pa) => pa.projectId === req.projectId && pa.stateName === req.stateName,
  );
  if (existing) {
    existing.personaId = req.personaId;
    return existing;
  }
  const assignment: PersonaAssignment = {
    projectId: req.projectId,
    stateName: req.stateName,
    personaId: req.personaId,
  };
  store.personaAssignments.push(assignment);
  return assignment;
}

// ── Personas ──────────────────────────────────────────────────────

export async function getPersonas(): Promise<Persona[]> {
  await delay();
  return store.personas;
}

export async function getPersona(id: PersonaId): Promise<Persona | null> {
  await delay();
  return store.personas.find((p) => p.id === id) ?? null;
}

export async function createPersona(req: CreatePersonaRequest): Promise<Persona> {
  await delay();
  const persona: Persona = {
    id: createId.persona(),
    name: req.name,
    description: req.description ?? "",
    avatar: req.avatar ?? { color: "#6b7280", icon: "bot" },
    systemPrompt: req.systemPrompt,
    model: req.model,
    allowedTools: req.allowedTools ?? [],
    mcpTools: req.mcpTools ?? [],
    maxBudgetPerRun: req.maxBudgetPerRun ?? 1.0,
    settings: {},
  };
  store.personas.push(persona);
  return persona;
}

export async function updatePersona(
  id: PersonaId,
  req: UpdatePersonaRequest,
): Promise<Persona | null> {
  await delay();
  const persona = store.personas.find((p) => p.id === id);
  if (!persona) return null;
  if (req.name !== undefined) persona.name = req.name;
  if (req.description !== undefined) persona.description = req.description;
  if (req.avatar !== undefined) persona.avatar = req.avatar;
  if (req.systemPrompt !== undefined) persona.systemPrompt = req.systemPrompt;
  if (req.model !== undefined) persona.model = req.model;
  if (req.allowedTools !== undefined) persona.allowedTools = req.allowedTools;
  if (req.mcpTools !== undefined) persona.mcpTools = req.mcpTools;
  if (req.maxBudgetPerRun !== undefined) persona.maxBudgetPerRun = req.maxBudgetPerRun;
  return persona;
}

export async function deletePersona(id: PersonaId): Promise<boolean> {
  await delay();
  const idx = store.personas.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  store.personas.splice(idx, 1);
  return true;
}

// ── Executions ────────────────────────────────────────────────────

export async function getExecutions(workItemId?: WorkItemId): Promise<Execution[]> {
  await delay();
  if (workItemId) return store.executions.filter((e) => e.workItemId === workItemId);
  return store.executions;
}

export async function getExecution(id: ExecutionId): Promise<Execution | null> {
  await delay();
  return store.executions.find((e) => e.id === id) ?? null;
}

// ── Comments ──────────────────────────────────────────────────────

export async function getComments(workItemId: WorkItemId): Promise<Comment[]> {
  await delay();
  return store.comments.filter((c) => c.workItemId === workItemId);
}

export async function getRecentComments(): Promise<Comment[]> {
  await delay();
  return [...store.comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createComment(req: CreateCommentRequest): Promise<Comment> {
  await delay();
  const comment: Comment = {
    id: createId.comment(),
    workItemId: req.workItemId,
    authorType: req.authorType,
    authorId: req.authorId ?? null,
    authorName: req.authorName,
    content: req.content,
    metadata: req.metadata ?? {},
    createdAt: new Date().toISOString(),
  };
  store.comments.push(comment);
  return comment;
}

// ── Proposals ─────────────────────────────────────────────────────

export async function getProposals(workItemId?: WorkItemId): Promise<Proposal[]> {
  await delay();
  if (workItemId) return store.proposals.filter((p) => p.workItemId === workItemId);
  return store.proposals;
}

export async function getProposal(id: ProposalId): Promise<Proposal | null> {
  await delay();
  return store.proposals.find((p) => p.id === id) ?? null;
}

export async function updateProposal(
  id: ProposalId,
  req: UpdateProposalRequest,
): Promise<Proposal | null> {
  await delay();
  const proposal = store.proposals.find((p) => p.id === id);
  if (!proposal) return null;
  proposal.status = req.status;
  return proposal;
}

// ── Project Memory ────────────────────────────────────────────────

export async function getProjectMemories(projectId: ProjectId): Promise<ProjectMemory[]> {
  await delay();
  return store.projectMemories.filter((m) => m.projectId === projectId);
}

// ── Aggregate queries ─────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay();
  const activeAgents = store.executions.filter((e) => e.status === "running").length;
  const pendingProposals = store.proposals.filter((p) => p.status === "pending").length;
  const blockedItems = store.workItems.filter((w) => w.currentState === "Blocked").length;
  const needsAttention = blockedItems + pendingProposals;
  const today = new Date().toISOString().slice(0, 10);
  const todayCostUsd = store.executions
    .filter((e) => e.startedAt.startsWith(today))
    .reduce((sum, e) => sum + e.costUsd, 0);
  return { activeAgents, pendingProposals, needsAttention, todayCostUsd };
}

export async function getCostSummary(): Promise<CostSummary> {
  await delay();
  const now = new Date();
  const dailySpend: CostSummary["dailySpend"] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const costUsd = store.executions
      .filter((e) => e.startedAt.startsWith(dateStr))
      .reduce((sum, e) => sum + e.costUsd, 0);
    dailySpend.push({ date: dateStr, costUsd });
  }
  const monthStart = now.toISOString().slice(0, 7);
  const monthTotal = store.executions
    .filter((e) => e.startedAt.startsWith(monthStart))
    .reduce((sum, e) => sum + e.costUsd, 0);
  const project = store.projects[0];
  const monthCap = (project?.settings?.monthCap as number) ?? 50;
  return { dailySpend, monthTotal, monthCap };
}

export async function getExecutionStats(): Promise<ExecutionStats> {
  await delay();
  const completed = store.executions.filter((e) => e.status === "completed");
  const totalRuns = completed.length;
  const totalCostUsd = completed.reduce((sum, e) => sum + e.costUsd, 0);
  const successes = completed.filter((e) => e.outcome === "success").length;
  const successRate = totalRuns > 0 ? successes / totalRuns : 0;
  const averageDurationMs =
    totalRuns > 0 ? completed.reduce((sum, e) => sum + e.durationMs, 0) / totalRuns : 0;
  return { totalRuns, totalCostUsd, successRate, averageDurationMs };
}

export async function getReadyWork(): Promise<ReadyWorkItem[]> {
  await delay();
  const readyItems = store.workItems.filter((w) => w.currentState === "Ready");
  return readyItems.slice(0, 5).map((workItem) => ({
    workItem,
    persona: workItem.assignedPersonaId
      ? (store.personas.find((p) => p.id === workItem.assignedPersonaId) ?? null)
      : null,
  }));
}

// ── Bundled mock API ──────────────────────────────────────────────

export const mockApi = {
  // Projects
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  // Work Items
  getWorkItems,
  getWorkItem,
  createWorkItem,
  updateWorkItem,
  deleteWorkItem,
  retryWorkItem,
  // Work Item Edges
  getWorkItemEdges,
  createWorkItemEdge,
  deleteWorkItemEdge,
  // Persona Assignments
  getPersonaAssignments,
  updatePersonaAssignment,
  // Personas
  getPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
  // Executions
  getExecutions,
  getExecution,
  // Comments
  getComments,
  getRecentComments,
  createComment,
  // Proposals
  getProposals,
  getProposal,
  updateProposal,
  // Project Memory
  getProjectMemories,
  // Aggregates
  getDashboardStats,
  getCostSummary,
  getExecutionStats,
  getReadyWork,
  // Utility
  resetStore,
};
