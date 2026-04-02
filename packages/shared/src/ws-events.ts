import type {
  WorkItemId,
  PersonaId,
  ExecutionId,
  CommentId,
  ProposalId,
  ProjectId,
} from "./ids.js";
import type {
  ExecutionOutcome,
  ProposalStatus,
  ProposalType,
} from "./entities.js";

// ── Notification types ────────────────────────────────────────────

export type NotificationEventType =
  | "proposal_needs_approval"
  | "agent_errored"
  | "budget_threshold"
  | "agent_completed";

export type NotificationPriority = "critical" | "high" | "low" | "info";

export interface Notification {
  id: string;
  type: NotificationEventType;
  priority: NotificationPriority;
  title: string;
  description?: string;
  projectId?: ProjectId;
  workItemId?: WorkItemId;
  executionId?: ExecutionId;
  read: boolean;
  createdAt: string; // ISO 8601
}

// ── Event types ────────────────────────────────────────────────────

export type WsEventType =
  | "state_change"
  | "comment_created"
  | "agent_output_chunk"
  | "agent_started"
  | "agent_completed"
  | "proposal_created"
  | "proposal_updated"
  | "cost_update"
  | "execution_update"
  | "file_changed"
  | "subagent_started"
  | "subagent_completed"
  | "agent_progress"
  | "context_usage"
  | "notification";

// ── Event payloads ─────────────────────────────────────────────────

export interface StateChangeEvent {
  type: "state_change";
  workItemId: WorkItemId;
  fromState: string;
  toState: string;
  triggeredBy: PersonaId | "user" | "system";
  timestamp: string;
}

export interface CommentCreatedEvent {
  type: "comment_created";
  commentId: CommentId;
  workItemId: WorkItemId;
  authorName: string;
  contentPreview: string;
  timestamp: string;
}

export interface AgentOutputChunkEvent {
  type: "agent_output_chunk";
  executionId: ExecutionId;
  personaId: PersonaId;
  chunk: string;
  chunkType: "text" | "code" | "thinking" | "tool_call" | "tool_result";
  timestamp: string;
}

export interface AgentStartedEvent {
  type: "agent_started";
  executionId: ExecutionId;
  personaId: PersonaId;
  workItemId: WorkItemId;
  workItemTitle: string;
  timestamp: string;
}

export interface AgentCompletedEvent {
  type: "agent_completed";
  executionId: ExecutionId;
  personaId: PersonaId;
  workItemId: WorkItemId;
  outcome: ExecutionOutcome;
  durationMs: number;
  costUsd: number;
  timestamp: string;
}

export interface ProposalCreatedEvent {
  type: "proposal_created";
  proposalId: ProposalId;
  executionId: ExecutionId;
  workItemId: WorkItemId;
  proposalType: ProposalType;
  timestamp: string;
}

export interface ProposalUpdatedEvent {
  type: "proposal_updated";
  proposalId: ProposalId;
  status: ProposalStatus;
  timestamp: string;
}

export interface CostUpdateEvent {
  type: "cost_update";
  todayCostUsd: number;
  monthCostUsd: number;
  timestamp: string;
}

export interface ExecutionUpdateEvent {
  type: "execution_update";
  executionId: ExecutionId;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  timestamp: string;
}

export interface FileChangedEvent {
  type: "file_changed";
  executionId: ExecutionId;
  filePath: string;
  changeType: "created" | "modified" | "deleted";
  timestamp: string;
}

export interface SubagentStartedEvent {
  type: "subagent_started";
  executionId: ExecutionId;
  parentExecutionId: ExecutionId;
  agentId: string;
  agentName: string;
  timestamp: string;
}

export interface SubagentCompletedEvent {
  type: "subagent_completed";
  executionId: ExecutionId;
  parentExecutionId: ExecutionId;
  agentId: string;
  agentName: string;
  timestamp: string;
}

export interface AgentProgressEvent {
  type: "agent_progress";
  executionId: ExecutionId;
  description: string;
  summary?: string;
  totalTokens: number;
  toolUses: number;
  durationMs: number;
  timestamp: string;
}

export interface ContextUsageEvent {
  type: "context_usage";
  executionId: ExecutionId;
  percentage: number;
  totalTokens: number;
  maxTokens: number;
  categories: Array<{ name: string; tokens: number }>;
  timestamp: string;
}

export interface NotificationEvent {
  type: "notification";
  notification: Notification;
  timestamp: string;
}

// ── Union type ─────────────────────────────────────────────────────

export type WsEvent =
  | StateChangeEvent
  | CommentCreatedEvent
  | AgentOutputChunkEvent
  | AgentStartedEvent
  | AgentCompletedEvent
  | ProposalCreatedEvent
  | ProposalUpdatedEvent
  | CostUpdateEvent
  | ExecutionUpdateEvent
  | FileChangedEvent
  | SubagentStartedEvent
  | SubagentCompletedEvent
  | AgentProgressEvent
  | ContextUsageEvent
  | NotificationEvent;

// ── Subscriber API ─────────────────────────────────────────────────

export type WsEventHandler<T extends WsEvent = WsEvent> = (event: T) => void;

export type WsEventMap = {
  state_change: StateChangeEvent;
  comment_created: CommentCreatedEvent;
  agent_output_chunk: AgentOutputChunkEvent;
  agent_started: AgentStartedEvent;
  agent_completed: AgentCompletedEvent;
  proposal_created: ProposalCreatedEvent;
  proposal_updated: ProposalUpdatedEvent;
  cost_update: CostUpdateEvent;
  execution_update: ExecutionUpdateEvent;
  file_changed: FileChangedEvent;
  subagent_started: SubagentStartedEvent;
  subagent_completed: SubagentCompletedEvent;
  agent_progress: AgentProgressEvent;
  context_usage: ContextUsageEvent;
  notification: NotificationEvent;
};
