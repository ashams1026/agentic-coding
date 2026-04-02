/**
 * Agent executor types — defines the interface for spawning and
 * communicating with AI agents.
 */

import type {
  WorkItemId,
  PersonaModel,
  ExecutionOutcome,
  ExecutionContextEntry,
  Persona,
  Project,
} from "@agentops/shared";

// ── Agent Events ──────────────────────────────────────────────────

export interface ThinkingEvent {
  type: "thinking";
  content: string;
}

export interface ToolUseEvent {
  type: "tool_use";
  toolName: string;
  input: Record<string, unknown>;
  toolCallId: string;
}

export interface ToolResultEvent {
  type: "tool_result";
  toolCallId: string;
  output: string;
  isError: boolean;
}

export interface TextEvent {
  type: "text";
  content: string;
}

export interface ErrorEvent {
  type: "error";
  message: string;
  code?: string;
}

export interface ResultEvent {
  type: "result";
  summary: string;
  outcome: ExecutionOutcome;
  costUsd: number;
  durationMs: number;
  structuredOutput?: unknown;
}

export interface PartialEvent {
  type: "partial";
  content: string;
  index: number;
}

export interface ProgressEvent {
  type: "progress";
  description: string;
  summary?: string;
  totalTokens: number;
  toolUses: number;
  durationMs: number;
}

export interface RateLimitEvent {
  type: "rate_limit";
  retryDelayMs: number;
  attempt: number;
  maxRetries: number;
  errorStatus: number | null;
}

export interface CheckpointEvent {
  type: "checkpoint";
  messageId: string;
}

export type AgentEvent =
  | ThinkingEvent
  | ToolUseEvent
  | ToolResultEvent
  | TextEvent
  | ErrorEvent
  | ResultEvent
  | PartialEvent
  | ProgressEvent
  | RateLimitEvent
  | CheckpointEvent;

// ── Agent Task ────────────────────────────────────────────────────

export interface AgentTask {
  /** Work item being worked on */
  workItemId: WorkItemId;
  /** Contextual information for the agent */
  context: {
    title: string;
    description: string;
    currentState: string;
    parentChain: Array<{ id: WorkItemId; title: string }>;
    inheritedContext: Record<string, unknown>;
  };
  /** Previous execution history for this work item */
  executionHistory: ExecutionContextEntry[];
}

// ── Spawn Options ─────────────────────────────────────────────────

export interface SpawnOptions {
  /** Execution ID for audit trail logging */
  executionId: string;
  /** Model to use for this execution */
  model: PersonaModel;
  /** Maximum cost in USD for this execution (0 = unlimited) */
  maxBudget: number;
  /** SDK built-in tool names this persona is allowed to use (e.g., 'Read', 'Bash') */
  tools: string[];
  /** All project personas available as subagents */
  allPersonas: Persona[];
  /** Formatted handoff context from previous agent (injected into system prompt) */
  handoffContext?: string;
}

// ── Agent Executor Interface ──────────────────────────────────────

export interface AgentExecutor {
  /**
   * Spawn an agent to work on a task.
   * Returns an async iterable that yields AgentEvents as the agent works.
   */
  spawn(
    task: AgentTask,
    persona: Persona,
    project: Project,
    options: SpawnOptions,
  ): AsyncIterable<AgentEvent>;
}
