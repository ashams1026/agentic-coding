import { nanoid } from "nanoid";

export type ProjectId = `pj-${string}`;
export type StoryId = `st-${string}`;
export type TaskId = `tk-${string}`;
export type TaskEdgeId = `te-${string}`;
export type WorkflowId = `wf-${string}`;
export type PersonaId = `ps-${string}`;
export type TriggerId = `tr-${string}`;
export type ExecutionId = `ex-${string}`;
export type CommentId = `cm-${string}`;
export type ProjectMemoryId = `pm-${string}`;
export type ProposalId = `pp-${string}`;

export type EntityId =
  | ProjectId
  | StoryId
  | TaskId
  | TaskEdgeId
  | WorkflowId
  | PersonaId
  | TriggerId
  | ExecutionId
  | CommentId
  | ProjectMemoryId
  | ProposalId;

const ID_LENGTH = 7;

function makeId<T extends string>(prefix: string): T {
  return `${prefix}-${nanoid(ID_LENGTH)}` as T;
}

export const createId = {
  project: () => makeId<ProjectId>("pj"),
  story: () => makeId<StoryId>("st"),
  task: () => makeId<TaskId>("tk"),
  taskEdge: () => makeId<TaskEdgeId>("te"),
  workflow: () => makeId<WorkflowId>("wf"),
  persona: () => makeId<PersonaId>("ps"),
  trigger: () => makeId<TriggerId>("tr"),
  execution: () => makeId<ExecutionId>("ex"),
  comment: () => makeId<CommentId>("cm"),
  projectMemory: () => makeId<ProjectMemoryId>("pm"),
  proposal: () => makeId<ProposalId>("pp"),
};
