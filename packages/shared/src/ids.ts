import { nanoid } from "nanoid";

export type ProjectId = `pj-${string}`;
export type WorkItemId = `wi-${string}`;
export type WorkItemEdgeId = `we-${string}`;
export type AgentId = `ps-${string}`;
export type ExecutionId = `ex-${string}`;
export type CommentId = `cm-${string}`;
export type ProjectMemoryId = `pm-${string}`;
export type ProposalId = `pp-${string}`;
export type ChatSessionId = `cs-${string}`;
export type ChatMessageId = `msg-${string}`;
export type ScheduleId = `sch-${string}`;
export type TemplateId = `tpl-${string}`;

export type EntityId =
  | ProjectId
  | WorkItemId
  | WorkItemEdgeId
  | AgentId
  | ExecutionId
  | CommentId
  | ProjectMemoryId
  | ProposalId
  | ChatSessionId
  | ChatMessageId
  | ScheduleId
  | TemplateId;

const ID_LENGTH = 7;

function makeId<T extends string>(prefix: string): T {
  return `${prefix}-${nanoid(ID_LENGTH)}` as T;
}

export const createId = {
  project: () => makeId<ProjectId>("pj"),
  workItem: () => makeId<WorkItemId>("wi"),
  workItemEdge: () => makeId<WorkItemEdgeId>("we"),
  agent: () => makeId<AgentId>("ps"),
  execution: () => makeId<ExecutionId>("ex"),
  comment: () => makeId<CommentId>("cm"),
  projectMemory: () => makeId<ProjectMemoryId>("pm"),
  proposal: () => makeId<ProposalId>("pp"),
  chatSession: () => makeId<ChatSessionId>("cs"),
  chatMessage: () => makeId<ChatMessageId>("msg"),
  schedule: () => makeId<ScheduleId>("sch"),
  template: () => makeId<TemplateId>("tpl"),
  workflow: () => makeId<string>("wf"),
  workflowState: () => makeId<string>("ws"),
  workflowTransition: () => makeId<string>("wt"),
};
