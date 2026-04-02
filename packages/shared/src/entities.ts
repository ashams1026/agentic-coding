import type {
  ProjectId,
  WorkItemId,
  WorkItemEdgeId,
  AgentId,
  ExecutionId,
  CommentId,
  ProjectMemoryId,
  ProposalId,
  ChatSessionId,
  ChatMessageId,
} from "./ids.js";

// ── Enums ──────────────────────────────────────────────────────────

export type Priority = "p0" | "p1" | "p2" | "p3";

export type AgentModel = "opus" | "sonnet" | "haiku";

export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | "interrupted";

export type ExecutionOutcome = "success" | "failure" | "rejected";

export type CommentAuthorType = "agent" | "user" | "system";

export type ProposalType = "task_creation" | "state_transition" | "review_request";

export type ProposalStatus = "pending" | "approved" | "rejected" | "expired";

export type WorkItemEdgeType = "blocks" | "depends_on" | "related_to";

// ── Scope ─────────────────────────────────────────────────────────

export type AgentScope =
  | { type: "project"; projectId: ProjectId; path: string }
  | { type: "global"; workspacePath: string };

// ── Entities ───────────────────────────────────────────────────────

export interface SandboxConfig {
  enabled?: boolean;
  allowedDomains?: string[];
  allowedWritePaths?: string[];
  denyWritePaths?: string[];
}

export interface ProjectSettings {
  maxConcurrent?: number;
  monthCap?: number;
  autoRouting?: boolean;
  description?: string;
  patterns?: string;
  sandbox?: SandboxConfig;
  [key: string]: unknown;
}

export interface Project {
  id: ProjectId;
  name: string;
  path: string;
  isGlobal: boolean;
  settings: ProjectSettings;
  workflowId: string | null;
  createdAt: string;
}

export interface WorkItem {
  id: WorkItemId;
  parentId: WorkItemId | null;
  projectId: ProjectId;
  title: string;
  description: string;
  context: Record<string, unknown>;
  currentState: string;
  workflowId: string | null;
  priority: Priority;
  labels: string[];
  assignedAgentId: AgentId | null;
  executionContext: ExecutionContextEntry[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
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

export interface WorkItemEdge {
  id: WorkItemEdgeId;
  fromId: WorkItemId;
  toId: WorkItemId;
  type: WorkItemEdgeType;
}

export interface AgentAssignment {
  projectId: ProjectId;
  stateName: string;
  agentId: AgentId;
}

export type EffortLevel = "low" | "medium" | "high" | "max";
export type ThinkingMode = "adaptive" | "enabled" | "disabled";

export interface AgentSettings {
  isSystem?: boolean;
  isAssistant?: boolean;
  isRouter?: boolean;
  effort?: EffortLevel;
  thinking?: ThinkingMode;
  thinkingBudgetTokens?: number;
  [key: string]: unknown;
}

export interface Agent {
  id: AgentId;
  name: string;
  description: string;
  avatar: {
    color: string;
    icon: string;
  };
  systemPrompt: string;
  model: AgentModel;
  allowedTools: string[];
  mcpTools: string[];
  skills: string[];
  subagents: string[];
  maxBudgetPerRun: number;
  settings: AgentSettings;
  scope: "global" | "project";
  projectId: string | null;
}

export interface Execution {
  id: ExecutionId;
  workItemId: WorkItemId | null;
  agentId: AgentId;
  status: ExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  costUsd: number;              // stored as cents in DB, divided by 100 for display
  durationMs: number;
  summary: string;
  outcome: ExecutionOutcome | null;
  rejectionPayload: RejectionPayload | null;
  logs: string;
  checkpointMessageId: string | null;
  structuredOutput: Record<string, unknown> | null;
  parentExecutionId: string | null;
  workflowId: string | null;
  workflowStateName: string | null;
  handoffNotes: HandoffNote | null;
  model: string | null;        // agent model used (opus/sonnet/haiku)
  totalTokens: number | null;  // cumulative tokens used
  toolUses: number | null;     // count of tool calls made
}

export interface HandoffNote {
  fromState: string;
  targetState: string;
  summary: string;
  decisions: string[];
  filesChanged: string[];
  openQuestions: string[];
}

export interface Comment {
  id: CommentId;
  workItemId: WorkItemId;
  authorType: CommentAuthorType;
  authorId: AgentId | null;
  authorName: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ProjectMemory {
  id: ProjectMemoryId;
  projectId: ProjectId;
  workItemId: WorkItemId;
  summary: string;
  filesChanged: string[];
  keyDecisions: string[];
  createdAt: string;
  consolidatedInto: ProjectMemoryId | null;
}

export interface Proposal {
  id: ProposalId;
  executionId: ExecutionId;
  workItemId: WorkItemId;
  type: ProposalType;
  payload: Record<string, unknown>;
  status: ProposalStatus;
  createdAt: string;
}

// ── Chat ──────────────────────────────────────────────────────────

export type ChatMessageRole = "user" | "assistant";

export interface ChatSession {
  id: ChatSessionId;
  projectId: ProjectId | null;
  agentId: AgentId | null;
  workItemId: WorkItemId | null;
  sdkSessionId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: ChatMessageId;
  sessionId: ChatSessionId;
  role: ChatMessageRole;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ── Workflows ───────────────────────────────────────────────────

export interface Workflow {
  id: string;
  name: string;
  description: string;
  scope: "global" | "project";
  projectId: ProjectId | null;
  version: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStateEntity {
  id: string;
  workflowId: string;
  name: string;
  type: "initial" | "intermediate" | "terminal";
  color: string;
  agentId: AgentId | null;
  sortOrder: number;
}

export interface WorkflowTransitionEntity {
  id: string;
  workflowId: string;
  fromStateId: string;
  toStateId: string;
  label: string;
  sortOrder: number;
}
