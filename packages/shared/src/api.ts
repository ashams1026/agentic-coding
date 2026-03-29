import type {
  ProjectId,
  StoryId,
  TaskId,
  TaskEdgeId,
  WorkflowId,
  PersonaId,
  ExecutionId,
  CommentId,
  ProposalId,
} from "./ids.js";
import type {
  Project,
  Story,
  Task,
  TaskEdge,
  Workflow,
  Persona,
  Execution,
  Comment,
  Proposal,
  Priority,
  TaskEdgeType,
  CommentAuthorType,
  ProposalStatus,
} from "./entities.js";

// ── Generic response wrappers ──────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  total: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

// ── Project endpoints ──────────────────────────────────────────────

export interface CreateProjectRequest {
  name: string;
  path: string;
  defaultWorkflowId?: WorkflowId;
  settings?: Record<string, unknown>;
}

export interface UpdateProjectRequest {
  name?: string;
  path?: string;
  defaultWorkflowId?: WorkflowId | null;
  settings?: Record<string, unknown>;
}

export type ProjectResponse = ApiResponse<Project>;
export type ProjectListResponse = ApiListResponse<Project>;

// ── Story endpoints ────────────────────────────────────────────────

export interface CreateStoryRequest {
  projectId: ProjectId;
  title: string;
  description?: string;
  workflowId: WorkflowId;
  priority?: Priority;
  labels?: string[];
  context?: {
    acceptanceCriteria?: string;
    notes?: string;
  };
}

export interface UpdateStoryRequest {
  title?: string;
  description?: string;
  priority?: Priority;
  labels?: string[];
  currentState?: string;
  context?: {
    acceptanceCriteria?: string;
    notes?: string;
  };
}

export type StoryResponse = ApiResponse<Story>;
export type StoryListResponse = ApiListResponse<Story>;

// ── Task endpoints ─────────────────────────────────────────────────

export interface CreateTaskRequest {
  storyId: StoryId;
  title: string;
  description?: string;
  workflowId: WorkflowId;
  assignedPersonaId?: PersonaId;
  parentTaskId?: TaskId;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  currentState?: string;
  assignedPersonaId?: PersonaId | null;
}

export type TaskResponse = ApiResponse<Task>;
export type TaskListResponse = ApiListResponse<Task>;

// ── TaskEdge endpoints ─────────────────────────────────────────────

export interface CreateTaskEdgeRequest {
  fromId: TaskId;
  toId: TaskId;
  type: TaskEdgeType;
}

export type TaskEdgeResponse = ApiResponse<TaskEdge>;
export type TaskEdgeListResponse = ApiListResponse<TaskEdge>;

// ── Workflow endpoints ─────────────────────────────────────────────

export interface CreateWorkflowRequest {
  name: string;
  type: "story" | "task";
  states: { name: string; color: string; isInitial: boolean; isFinal: boolean }[];
  transitions: { from: string; to: string; name: string }[];
  isDefault?: boolean;
}

export interface UpdateWorkflowRequest {
  name?: string;
  states?: { name: string; color: string; isInitial: boolean; isFinal: boolean }[];
  transitions?: { from: string; to: string; name: string }[];
  isDefault?: boolean;
}

export type WorkflowResponse = ApiResponse<Workflow>;
export type WorkflowListResponse = ApiListResponse<Workflow>;

// ── Persona endpoints ──────────────────────────────────────────────

export interface CreatePersonaRequest {
  name: string;
  description?: string;
  avatar?: { color: string; icon: string };
  systemPrompt: string;
  model: "opus" | "sonnet" | "haiku";
  allowedTools?: string[];
  mcpTools?: string[];
  maxBudgetPerRun?: number;
}

export interface UpdatePersonaRequest {
  name?: string;
  description?: string;
  avatar?: { color: string; icon: string };
  systemPrompt?: string;
  model?: "opus" | "sonnet" | "haiku";
  allowedTools?: string[];
  mcpTools?: string[];
  maxBudgetPerRun?: number;
}

export type PersonaResponse = ApiResponse<Persona>;
export type PersonaListResponse = ApiListResponse<Persona>;

// ── Execution endpoints ────────────────────────────────────────────

export type ExecutionResponse = ApiResponse<Execution>;
export type ExecutionListResponse = ApiListResponse<Execution>;

// ── Comment endpoints ──────────────────────────────────────────────

export interface CreateCommentRequest {
  targetId: StoryId | TaskId;
  targetType: "story" | "task";
  authorType: CommentAuthorType;
  authorId?: PersonaId;
  authorName: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export type CommentResponse = ApiResponse<Comment>;
export type CommentListResponse = ApiListResponse<Comment>;

// ── Proposal endpoints ─────────────────────────────────────────────

export interface UpdateProposalRequest {
  status: ProposalStatus;
  feedback?: string;
}

export type ProposalResponse = ApiResponse<Proposal>;
export type ProposalListResponse = ApiListResponse<Proposal>;

// ── Ready work query ───────────────────────────────────────────────

export interface ReadyWorkItem {
  task: Task;
  story: Story;
  persona: Persona | null;
}

export type ReadyWorkResponse = ApiListResponse<ReadyWorkItem>;

// ── Aggregate stats ────────────────────────────────────────────────

export interface DashboardStats {
  activeAgents: number;
  pendingProposals: number;
  needsAttention: number;
  todayCostUsd: number;
}

export interface CostSummary {
  dailySpend: { date: string; costUsd: number }[];
  monthTotal: number;
  monthCap: number;
}

export interface ExecutionStats {
  totalRuns: number;
  totalCostUsd: number;
  successRate: number;
  averageDurationMs: number;
}

// ── Route param types ──────────────────────────────────────────────

export interface ProjectParams {
  projectId: ProjectId;
}

export interface StoryParams {
  storyId: StoryId;
}

export interface TaskParams {
  taskId: TaskId;
}

export interface ExecutionParams {
  executionId: ExecutionId;
}

export interface CommentParams {
  commentId: CommentId;
}

export interface ProposalParams {
  proposalId: ProposalId;
}

export interface TaskEdgeParams {
  edgeId: TaskEdgeId;
}
