/**
 * @agentops/core — Core agent execution types, interfaces, and utilities.
 *
 * This package contains framework-agnostic agent definitions that do not
 * depend on any database, HTTP framework, or SDK implementation.
 */

export type {
  AgentEvent,
  AgentExecutor,
  AgentTask,
  SpawnOptions,
  ThinkingEvent,
  ToolUseEvent,
  ToolResultEvent,
  TextEvent,
  ErrorEvent,
  ResultEvent,
  PartialEvent,
  ProgressEvent,
  RateLimitEvent,
  CheckpointEvent,
} from "./types.js";

export {
  validateCommand,
  buildSandboxPrompt,
} from "./sandbox.js";

export type { ValidationResult } from "./sandbox.js";

export type {
  WorkItemRepository,
  WorkItemRow,
  ExecutionRepository,
  PersonaRepository,
  PersonaRow,
  CommentRepository,
  ProjectRepository,
  ProjectRow,
  WorkItemEdgeRepository,
  Repositories,
} from "./repositories.js";

export { ExecutorRegistry } from "./executor-registry.js";
export type { ExecutorFactoryFn } from "./executor-registry.js";
