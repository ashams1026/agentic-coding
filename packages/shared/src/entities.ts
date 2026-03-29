import type {
  ProjectId,
  StoryId,
  TaskId,
  TaskEdgeId,
  WorkflowId,
  PersonaId,
  TriggerId,
  ExecutionId,
  CommentId,
  ProjectMemoryId,
  ProposalId,
} from "./ids.js";

// ── Enums ──────────────────────────────────────────────────────────

export type Priority = "p0" | "p1" | "p2" | "p3";

export type StoryState = string; // Dynamic — defined by workflow

export type TaskState = string; // Dynamic — defined by workflow

export type WorkflowType = "story" | "task";

export type PersonaModel = "opus" | "sonnet" | "haiku";

export type DispatchMode = "auto" | "propose" | "gated" | "evaluate";

export type AdvancementMode = "auto" | "approval" | "agent";

export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export type ExecutionOutcome = "success" | "failure" | "rejected";

export type CommentTargetType = "story" | "task";

export type CommentAuthorType = "agent" | "user" | "system";

export type ProposalType = "task_creation" | "state_transition" | "review_request";

export type ProposalStatus = "pending" | "approved" | "rejected" | "expired";

export type TaskEdgeType = "blocks" | "depends_on" | "related_to";

// ── Entities ───────────────────────────────────────────────────────

export interface Project {
  id: ProjectId;
  name: string;
  path: string;
  defaultWorkflowId: WorkflowId | null;
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface Story {
  id: StoryId;
  projectId: ProjectId;
  title: string;
  description: string;
  workflowId: WorkflowId;
  currentState: StoryState;
  priority: Priority;
  labels: string[];
  context: {
    acceptanceCriteria: string;
    notes: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: TaskId;
  storyId: StoryId;
  title: string;
  description: string;
  workflowId: WorkflowId;
  currentState: TaskState;
  assignedPersonaId: PersonaId | null;
  parentTaskId: TaskId | null;
  inheritedContext: string;
  executionContext: ExecutionContextEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionContextEntry {
  executionId: ExecutionId;
  summary: string;
  outcome: ExecutionOutcome;
  rejectionPayload: RejectionPayload | null;
}

export interface RejectionPayload {
  reason: string;
  severity: "low" | "medium" | "high";
  hint: string;
  retryCount: number;
}

export interface TaskEdge {
  id: TaskEdgeId;
  fromId: TaskId;
  toId: TaskId;
  type: TaskEdgeType;
}

export interface WorkflowState {
  name: string;
  color: string;
  isInitial: boolean;
  isFinal: boolean;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  name: string;
}

export interface Workflow {
  id: WorkflowId;
  name: string;
  type: WorkflowType;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  initialState: string;
  finalStates: string[];
  isDefault: boolean;
}

export interface Persona {
  id: PersonaId;
  name: string;
  description: string;
  avatar: {
    color: string;
    icon: string;
  };
  systemPrompt: string;
  model: PersonaModel;
  allowedTools: string[];
  mcpTools: string[];
  maxBudgetPerRun: number;
  settings: Record<string, unknown>;
}

export interface Trigger {
  id: TriggerId;
  workflowId: WorkflowId;
  fromState: string;
  toState: string | null;
  personaId: PersonaId;
  dispatchMode: DispatchMode;
  advancementMode: AdvancementMode;
  possibleTargets: string[];
  maxRetries: number;
  config: Record<string, unknown>;
}

export interface Execution {
  id: ExecutionId;
  targetId: StoryId | TaskId;
  targetType: "story" | "task";
  personaId: PersonaId;
  status: ExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  costUsd: number;
  durationMs: number;
  summary: string;
  outcome: ExecutionOutcome | null;
  rejectionPayload: RejectionPayload | null;
  logs: string;
}

export interface Comment {
  id: CommentId;
  targetId: StoryId | TaskId;
  targetType: CommentTargetType;
  authorType: CommentAuthorType;
  authorId: PersonaId | null;
  authorName: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ProjectMemory {
  id: ProjectMemoryId;
  projectId: ProjectId;
  storyId: StoryId;
  summary: string;
  filesChanged: string[];
  keyDecisions: string[];
  createdAt: string;
  consolidatedInto: ProjectMemoryId | null;
}

export interface Proposal {
  id: ProposalId;
  executionId: ExecutionId;
  parentId: StoryId | TaskId;
  parentType: "story" | "task";
  type: ProposalType;
  payload: Record<string, unknown>;
  status: ProposalStatus;
  createdAt: string;
}
