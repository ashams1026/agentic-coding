import type {
  StoryId,
  TaskId,
  PersonaId,
  ExecutionId,
  CommentId,
  ProposalId,
} from "./ids.js";
import type {
  ExecutionOutcome,
  ProposalStatus,
  ProposalType,
} from "./entities.js";

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
  | "execution_update";

// ── Event payloads ─────────────────────────────────────────────────

export interface StateChangeEvent {
  type: "state_change";
  targetId: StoryId | TaskId;
  targetType: "story" | "task";
  fromState: string;
  toState: string;
  triggeredBy: PersonaId | "user" | "system";
  timestamp: string;
}

export interface CommentCreatedEvent {
  type: "comment_created";
  commentId: CommentId;
  targetId: StoryId | TaskId;
  targetType: "story" | "task";
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
  targetId: StoryId | TaskId;
  targetType: "story" | "task";
  taskTitle: string;
  timestamp: string;
}

export interface AgentCompletedEvent {
  type: "agent_completed";
  executionId: ExecutionId;
  personaId: PersonaId;
  targetId: StoryId | TaskId;
  targetType: "story" | "task";
  outcome: ExecutionOutcome;
  durationMs: number;
  costUsd: number;
  timestamp: string;
}

export interface ProposalCreatedEvent {
  type: "proposal_created";
  proposalId: ProposalId;
  executionId: ExecutionId;
  parentId: StoryId | TaskId;
  parentType: "story" | "task";
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
  | ExecutionUpdateEvent;

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
};
