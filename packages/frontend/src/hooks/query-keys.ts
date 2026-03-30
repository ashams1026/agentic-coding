import type { ProjectId, WorkItemId, PersonaId, ExecutionId, ProposalId } from "@agentops/shared";

export const queryKeys = {
  // Projects
  projects: ["projects"] as const,
  project: (id: ProjectId) => ["projects", id] as const,

  // Work Items
  workItems: (parentId?: WorkItemId | null, projectId?: ProjectId) => {
    if (parentId !== undefined || projectId) return ["workItems", { parentId, projectId }] as const;
    return ["workItems"] as const;
  },
  workItem: (id: WorkItemId) => ["workItems", id] as const,

  // Work Item Edges
  workItemEdges: (workItemId?: WorkItemId) => {
    if (workItemId) return ["workItemEdges", { workItemId }] as const;
    return ["workItemEdges"] as const;
  },

  // Persona Assignments
  personaAssignments: (projectId: ProjectId) => ["personaAssignments", { projectId }] as const,

  // Personas
  personas: ["personas"] as const,
  persona: (id: PersonaId) => ["personas", id] as const,

  // Executions
  executions: (workItemId?: WorkItemId, projectId?: string) => {
    if (workItemId || projectId) return ["executions", { workItemId, projectId }] as const;
    return ["executions"] as const;
  },
  execution: (id: ExecutionId) => ["executions", id] as const,

  // Comments
  comments: (workItemId: WorkItemId) => ["comments", { workItemId }] as const,
  recentComments: (projectId?: string) => projectId ? ["comments", "recent", { projectId }] as const : ["comments", "recent"] as const,

  // Proposals
  proposals: (workItemId?: WorkItemId, projectId?: string) => {
    if (workItemId || projectId) return ["proposals", { workItemId, projectId }] as const;
    return ["proposals"] as const;
  },
  proposal: (id: ProposalId) => ["proposals", id] as const,

  // Project Memory
  projectMemories: (projectId: ProjectId) => ["projectMemories", { projectId }] as const,

  // Aggregates
  dashboardStats: (projectId?: string) => projectId ? ["dashboardStats", { projectId }] as const : ["dashboardStats"] as const,
  costSummary: (projectId?: string) => projectId ? ["costSummary", { projectId }] as const : ["costSummary"] as const,
  executionStats: (projectId?: string) => projectId ? ["executionStats", { projectId }] as const : ["executionStats"] as const,
  readyWork: (projectId?: string) => projectId ? ["readyWork", { projectId }] as const : ["readyWork"] as const,
};
