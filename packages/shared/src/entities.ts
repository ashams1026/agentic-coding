import type {
  ProjectId,
  WorkItemId,
  WorkItemEdgeId,
  PersonaId,
  ExecutionId,
  CommentId,
  ProjectMemoryId,
  ProposalId,
  ChatSessionId,
  ChatMessageId,
} from "./ids.js";

// ── Enums ──────────────────────────────────────────────────────────

export type Priority = "p0" | "p1" | "p2" | "p3";

export type PersonaModel = "opus" | "sonnet" | "haiku";

export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export type ExecutionOutcome = "success" | "failure" | "rejected";

export type CommentAuthorType = "agent" | "user" | "system";

export type ProposalType = "task_creation" | "state_transition" | "review_request";

export type ProposalStatus = "pending" | "approved" | "rejected" | "expired";

export type WorkItemEdgeType = "blocks" | "depends_on" | "related_to";

// ── Entities ───────────────────────────────────────────────────────

export interface Project {
  id: ProjectId;
  name: string;
  path: string;
  settings: Record<string, unknown>;
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
  priority: Priority;
  labels: string[];
  assignedPersonaId: PersonaId | null;
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

export interface WorkItemEdge {
  id: WorkItemEdgeId;
  fromId: WorkItemId;
  toId: WorkItemId;
  type: WorkItemEdgeType;
}

export interface PersonaAssignment {
  projectId: ProjectId;
  stateName: string;
  personaId: PersonaId;
}

export interface PersonaSettings {
  isSystem?: boolean;
  isAssistant?: boolean;
  [key: string]: unknown;
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
  skills: string[];
  subagents: string[];
  maxBudgetPerRun: number;
  settings: PersonaSettings;
}

export interface Execution {
  id: ExecutionId;
  workItemId: WorkItemId;
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
  checkpointMessageId: string | null;
}

export interface Comment {
  id: CommentId;
  workItemId: WorkItemId;
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
  projectId: ProjectId;
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
