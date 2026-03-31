import type {
  ProjectId,
  WorkItemId,
  WorkItemEdgeId,
  PersonaId,
  ExecutionId,
  CommentId,
  ProposalId,
} from "./ids.js";
import type {
  Project,
  WorkItem,
  WorkItemEdge,
  Persona,
  PersonaAssignment,
  Execution,
  Comment,
  Proposal,
  Priority,
  WorkItemEdgeType,
  CommentAuthorType,
  ProposalType,
  ProposalStatus,
  ExecutionStatus,
  ExecutionOutcome,
  RejectionPayload,
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
  settings?: Record<string, unknown>;
}

export interface UpdateProjectRequest {
  name?: string;
  path?: string;
  settings?: Record<string, unknown>;
}

export type ProjectResponse = ApiResponse<Project>;
export type ProjectListResponse = ApiListResponse<Project>;

// ── WorkItem endpoints ─────────────────────────────────────────────

export interface CreateWorkItemRequest {
  projectId: ProjectId;
  parentId?: WorkItemId;
  title: string;
  description?: string;
  priority?: Priority;
  labels?: string[];
  context?: Record<string, unknown>;
}

export interface UpdateWorkItemRequest {
  title?: string;
  description?: string;
  priority?: Priority;
  labels?: string[];
  currentState?: string;
  context?: Record<string, unknown>;
  assignedPersonaId?: PersonaId | null;
}

export type WorkItemResponse = ApiResponse<WorkItem>;
export type WorkItemListResponse = ApiListResponse<WorkItem>;

// ── WorkItemEdge endpoints ─────────────────────────────────────────

export interface CreateWorkItemEdgeRequest {
  fromId: WorkItemId;
  toId: WorkItemId;
  type: WorkItemEdgeType;
}

export type WorkItemEdgeResponse = ApiResponse<WorkItemEdge>;
export type WorkItemEdgeListResponse = ApiListResponse<WorkItemEdge>;

// ── PersonaAssignment endpoints ────────────────────────────────────

export interface UpsertPersonaAssignmentRequest {
  projectId: ProjectId;
  stateName: string;
  personaId: PersonaId;
}

export type PersonaAssignmentResponse = ApiResponse<PersonaAssignment>;
export type PersonaAssignmentListResponse = ApiListResponse<PersonaAssignment>;

// ── Persona endpoints ──────────────────────────────────────────────

export interface CreatePersonaRequest {
  name: string;
  description?: string;
  avatar?: { color: string; icon: string };
  systemPrompt: string;
  model: "opus" | "sonnet" | "haiku";
  allowedTools?: string[];
  mcpTools?: string[];
  skills?: string[];
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
  skills?: string[];
  maxBudgetPerRun?: number;
}

export type PersonaResponse = ApiResponse<Persona>;
export type PersonaListResponse = ApiListResponse<Persona>;

// ── Execution endpoints ────────────────────────────────────────────

export interface CreateExecutionRequest {
  workItemId: WorkItemId;
  personaId: PersonaId;
}

export interface UpdateExecutionRequest {
  status?: ExecutionStatus;
  completedAt?: string;
  costUsd?: number;
  durationMs?: number;
  summary?: string;
  outcome?: ExecutionOutcome | null;
  rejectionPayload?: RejectionPayload | null;
  logs?: string;
}

export type ExecutionResponse = ApiResponse<Execution>;
export type ExecutionListResponse = ApiListResponse<Execution>;

// ── Comment endpoints ──────────────────────────────────────────────

export interface CreateCommentRequest {
  workItemId: WorkItemId;
  authorType: CommentAuthorType;
  authorId?: PersonaId;
  authorName: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export type CommentResponse = ApiResponse<Comment>;
export type CommentListResponse = ApiListResponse<Comment>;

// ── Proposal endpoints ─────────────────────────────────────────────

export interface CreateProposalRequest {
  executionId: ExecutionId;
  workItemId: WorkItemId;
  type: ProposalType;
  payload?: Record<string, unknown>;
}

export interface UpdateProposalRequest {
  status: ProposalStatus;
  feedback?: string;
}

export type ProposalResponse = ApiResponse<Proposal>;
export type ProposalListResponse = ApiListResponse<Proposal>;

// ── Ready work query ───────────────────────────────────────────────

export interface ReadyWorkItem {
  workItem: WorkItem;
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

export interface WorkItemParams {
  workItemId: WorkItemId;
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

export interface WorkItemEdgeParams {
  edgeId: WorkItemEdgeId;
}
