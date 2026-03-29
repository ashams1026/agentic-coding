import type { ProjectId, StoryId, TaskId, WorkflowId, PersonaId, ExecutionId, ProposalId } from "@agentops/shared";

export const queryKeys = {
  // Projects
  projects: ["projects"] as const,
  project: (id: ProjectId) => ["projects", id] as const,

  // Stories
  stories: (projectId?: ProjectId) => {
    if (projectId) return ["stories", { projectId }] as const;
    return ["stories"] as const;
  },
  story: (id: StoryId) => ["stories", id] as const,

  // Tasks
  tasks: (storyId?: StoryId) => {
    if (storyId) return ["tasks", { storyId }] as const;
    return ["tasks"] as const;
  },
  task: (id: TaskId) => ["tasks", id] as const,

  // Task Edges
  taskEdges: (taskId?: TaskId) => {
    if (taskId) return ["taskEdges", { taskId }] as const;
    return ["taskEdges"] as const;
  },

  // Workflows
  workflows: ["workflows"] as const,
  workflow: (id: WorkflowId) => ["workflows", id] as const,

  // Personas
  personas: ["personas"] as const,
  persona: (id: PersonaId) => ["personas", id] as const,

  // Triggers
  triggers: (workflowId?: WorkflowId) => {
    if (workflowId) return ["triggers", { workflowId }] as const;
    return ["triggers"] as const;
  },

  // Executions
  executions: (targetId?: StoryId | TaskId) => {
    if (targetId) return ["executions", { targetId }] as const;
    return ["executions"] as const;
  },
  execution: (id: ExecutionId) => ["executions", id] as const,

  // Comments
  comments: (targetId: StoryId | TaskId) => ["comments", { targetId }] as const,

  // Proposals
  proposals: (parentId?: StoryId | TaskId) => {
    if (parentId) return ["proposals", { parentId }] as const;
    return ["proposals"] as const;
  },
  proposal: (id: ProposalId) => ["proposals", id] as const,

  // Project Memory
  projectMemories: (projectId: ProjectId) => ["projectMemories", { projectId }] as const,

  // Aggregates
  dashboardStats: ["dashboardStats"] as const,
  costSummary: ["costSummary"] as const,
  executionStats: ["executionStats"] as const,
  readyWork: ["readyWork"] as const,
};
