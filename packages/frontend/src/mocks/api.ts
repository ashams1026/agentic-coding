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
  TaskEdgeId,
  WorkflowId,
  PersonaId,
  ExecutionId,
  ProposalId,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateStoryRequest,
  UpdateStoryRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateTaskEdgeRequest,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  CreatePersonaRequest,
  UpdatePersonaRequest,
  CreateCommentRequest,
  UpdateProposalRequest,
  DashboardStats,
  CostSummary,
  ExecutionStats,
  ReadyWorkItem,
} from "@agentops/shared";
import { createId } from "@agentops/shared";
import { fixtures } from "./fixtures";

// ── Simulated latency ─────────────────────────────────────────────

function delay(): Promise<void> {
  const ms = 50 + Math.random() * 100; // 50-150ms
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── In-memory store ───────────────────────────────────────────────

interface Store {
  projects: Project[];
  stories: Story[];
  tasks: Task[];
  taskEdges: TaskEdge[];
  workflows: Workflow[];
  personas: Persona[];
  triggers: Trigger[];
  executions: Execution[];
  comments: Comment[];
  projectMemories: ProjectMemory[];
  proposals: Proposal[];
}

const store: Store = {
  projects: [...fixtures.projects],
  stories: [...fixtures.stories],
  tasks: [...fixtures.tasks],
  taskEdges: [...fixtures.taskEdges],
  workflows: [...fixtures.workflows],
  personas: [...fixtures.personas],
  triggers: [...fixtures.triggers],
  executions: [...fixtures.executions],
  comments: [...fixtures.comments],
  projectMemories: [...fixtures.projectMemories],
  proposals: [...fixtures.proposals],
};

/** Reset store to initial fixture state (useful for tests / demo reset) */
export function resetStore(): void {
  store.projects = [...fixtures.projects];
  store.stories = [...fixtures.stories];
  store.tasks = [...fixtures.tasks];
  store.taskEdges = [...fixtures.taskEdges];
  store.workflows = [...fixtures.workflows];
  store.personas = [...fixtures.personas];
  store.triggers = [...fixtures.triggers];
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
    defaultWorkflowId: req.defaultWorkflowId ?? null,
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
  if (req.defaultWorkflowId !== undefined) project.defaultWorkflowId = req.defaultWorkflowId;
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

// ── Stories ───────────────────────────────────────────────────────

export async function getStories(projectId?: ProjectId): Promise<Story[]> {
  await delay();
  if (projectId) return store.stories.filter((s) => s.projectId === projectId);
  return store.stories;
}

export async function getStory(id: StoryId): Promise<Story | null> {
  await delay();
  return store.stories.find((s) => s.id === id) ?? null;
}

export async function createStory(req: CreateStoryRequest): Promise<Story> {
  await delay();
  const workflow = store.workflows.find((w) => w.id === req.workflowId);
  const story: Story = {
    id: createId.story(),
    projectId: req.projectId,
    title: req.title,
    description: req.description ?? "",
    workflowId: req.workflowId,
    currentState: workflow?.initialState ?? "Backlog",
    priority: req.priority ?? "p2",
    labels: req.labels ?? [],
    context: {
      acceptanceCriteria: req.context?.acceptanceCriteria ?? "",
      notes: req.context?.notes ?? "",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.stories.push(story);
  return story;
}

export async function updateStory(id: StoryId, req: UpdateStoryRequest): Promise<Story | null> {
  await delay();
  const story = store.stories.find((s) => s.id === id);
  if (!story) return null;
  if (req.title !== undefined) story.title = req.title;
  if (req.description !== undefined) story.description = req.description;
  if (req.priority !== undefined) story.priority = req.priority;
  if (req.labels !== undefined) story.labels = req.labels;
  if (req.currentState !== undefined) story.currentState = req.currentState;
  if (req.context !== undefined) {
    if (req.context.acceptanceCriteria !== undefined)
      story.context.acceptanceCriteria = req.context.acceptanceCriteria;
    if (req.context.notes !== undefined) story.context.notes = req.context.notes;
  }
  story.updatedAt = new Date().toISOString();
  return story;
}

export async function deleteStory(id: StoryId): Promise<boolean> {
  await delay();
  const idx = store.stories.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  store.stories.splice(idx, 1);
  return true;
}

// ── Tasks ─────────────────────────────────────────────────────────

export async function getTasks(storyId?: StoryId): Promise<Task[]> {
  await delay();
  if (storyId) return store.tasks.filter((t) => t.storyId === storyId);
  return store.tasks;
}

export async function getTask(id: TaskId): Promise<Task | null> {
  await delay();
  return store.tasks.find((t) => t.id === id) ?? null;
}

export async function createTask(req: CreateTaskRequest): Promise<Task> {
  await delay();
  const workflow = store.workflows.find((w) => w.id === req.workflowId);
  const story = store.stories.find((s) => s.id === req.storyId);
  const task: Task = {
    id: createId.task(),
    storyId: req.storyId,
    title: req.title,
    description: req.description ?? "",
    workflowId: req.workflowId,
    currentState: workflow?.initialState ?? "Pending",
    assignedPersonaId: req.assignedPersonaId ?? null,
    parentTaskId: req.parentTaskId ?? null,
    inheritedContext: story?.description ?? "",
    executionContext: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.tasks.push(task);
  return task;
}

export async function updateTask(id: TaskId, req: UpdateTaskRequest): Promise<Task | null> {
  await delay();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) return null;
  if (req.title !== undefined) task.title = req.title;
  if (req.description !== undefined) task.description = req.description;
  if (req.currentState !== undefined) task.currentState = req.currentState;
  if (req.assignedPersonaId !== undefined) task.assignedPersonaId = req.assignedPersonaId;
  task.updatedAt = new Date().toISOString();
  return task;
}

export async function deleteTask(id: TaskId): Promise<boolean> {
  await delay();
  const idx = store.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  store.tasks.splice(idx, 1);
  return true;
}

// ── Task Edges ────────────────────────────────────────────────────

export async function getTaskEdges(taskId?: TaskId): Promise<TaskEdge[]> {
  await delay();
  if (taskId) return store.taskEdges.filter((e) => e.fromId === taskId || e.toId === taskId);
  return store.taskEdges;
}

export async function createTaskEdge(req: CreateTaskEdgeRequest): Promise<TaskEdge> {
  await delay();
  const edge: TaskEdge = {
    id: createId.taskEdge(),
    fromId: req.fromId,
    toId: req.toId,
    type: req.type,
  };
  store.taskEdges.push(edge);
  return edge;
}

export async function deleteTaskEdge(id: TaskEdgeId): Promise<boolean> {
  await delay();
  const idx = store.taskEdges.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  store.taskEdges.splice(idx, 1);
  return true;
}

// ── Workflows ─────────────────────────────────────────────────────

export async function getWorkflows(): Promise<Workflow[]> {
  await delay();
  return store.workflows;
}

export async function getWorkflow(id: WorkflowId): Promise<Workflow | null> {
  await delay();
  return store.workflows.find((w) => w.id === id) ?? null;
}

export async function createWorkflow(req: CreateWorkflowRequest): Promise<Workflow> {
  await delay();
  const initial = req.states.find((s) => s.isInitial);
  const finals = req.states.filter((s) => s.isFinal).map((s) => s.name);
  const workflow: Workflow = {
    id: createId.workflow(),
    name: req.name,
    type: req.type,
    states: req.states,
    transitions: req.transitions,
    initialState: initial?.name ?? req.states[0]?.name ?? "",
    finalStates: finals,
    isDefault: req.isDefault ?? false,
  };
  store.workflows.push(workflow);
  return workflow;
}

export async function updateWorkflow(
  id: WorkflowId,
  req: UpdateWorkflowRequest,
): Promise<Workflow | null> {
  await delay();
  const workflow = store.workflows.find((w) => w.id === id);
  if (!workflow) return null;
  if (req.name !== undefined) workflow.name = req.name;
  if (req.states !== undefined) {
    workflow.states = req.states;
    const initial = req.states.find((s) => s.isInitial);
    if (initial) workflow.initialState = initial.name;
    workflow.finalStates = req.states.filter((s) => s.isFinal).map((s) => s.name);
  }
  if (req.transitions !== undefined) workflow.transitions = req.transitions;
  if (req.isDefault !== undefined) workflow.isDefault = req.isDefault;
  return workflow;
}

export async function deleteWorkflow(id: WorkflowId): Promise<boolean> {
  await delay();
  const idx = store.workflows.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  store.workflows.splice(idx, 1);
  return true;
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

// ── Triggers ──────────────────────────────────────────────────────

export async function getTriggers(workflowId?: WorkflowId): Promise<Trigger[]> {
  await delay();
  if (workflowId) return store.triggers.filter((t) => t.workflowId === workflowId);
  return store.triggers;
}

// ── Executions ────────────────────────────────────────────────────

export async function getExecutions(targetId?: StoryId | TaskId): Promise<Execution[]> {
  await delay();
  if (targetId) return store.executions.filter((e) => e.targetId === targetId);
  return store.executions;
}

export async function getExecution(id: ExecutionId): Promise<Execution | null> {
  await delay();
  return store.executions.find((e) => e.id === id) ?? null;
}

// ── Comments ──────────────────────────────────────────────────────

export async function getComments(targetId: StoryId | TaskId): Promise<Comment[]> {
  await delay();
  return store.comments.filter((c) => c.targetId === targetId);
}

export async function createComment(req: CreateCommentRequest): Promise<Comment> {
  await delay();
  const comment: Comment = {
    id: createId.comment(),
    targetId: req.targetId,
    targetType: req.targetType,
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

export async function getProposals(parentId?: StoryId | TaskId): Promise<Proposal[]> {
  await delay();
  if (parentId) return store.proposals.filter((p) => p.parentId === parentId);
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
  const needsAttention =
    store.tasks.filter((t) => t.currentState === "Failed").length + pendingProposals;
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
  const monthStart = now.toISOString().slice(0, 7); // "YYYY-MM"
  const monthTotal = store.executions
    .filter((e) => e.startedAt.startsWith(monthStart))
    .reduce((sum, e) => sum + e.costUsd, 0);
  const project = store.projects[0];
  const monthCap = (project?.settings?.monthlyCostCap as number) ?? 50;
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
  const pendingTasks = store.tasks.filter((t) => t.currentState === "Pending");
  return pendingTasks.slice(0, 5).map((task) => ({
    task,
    story: store.stories.find((s) => s.id === task.storyId)!,
    persona: task.assignedPersonaId
      ? (store.personas.find((p) => p.id === task.assignedPersonaId) ?? null)
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
  // Stories
  getStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
  // Tasks
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  // Task Edges
  getTaskEdges,
  createTaskEdge,
  deleteTaskEdge,
  // Workflows
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  // Personas
  getPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
  // Triggers
  getTriggers,
  // Executions
  getExecutions,
  getExecution,
  // Comments
  getComments,
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
