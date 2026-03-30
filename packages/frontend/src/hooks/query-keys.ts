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
  executions: (workItemId?: WorkItemId) => {
    if (workItemId) return ["executions", { workItemId }] as const;
    return ["executions"] as const;
  },
  execution: (id: ExecutionId) => ["executions", id] as const,

  // Comments
  comments: (workItemId: WorkItemId) => ["comments", { workItemId }] as const,

  // Proposals
  proposals: (workItemId?: WorkItemId) => {
    if (workItemId) return ["proposals", { workItemId }] as const;
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
