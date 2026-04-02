/**
 * Repository interfaces — abstract database access for agent modules.
 *
 * These interfaces define the data operations used by ExecutionManager,
 * dispatch, router, coordination, and mcp-server. Implementations live
 * in @agentops/backend (using Drizzle ORM).
 *
 * Design principles:
 * - Methods match actual usage patterns in agent modules
 * - Return shared entity types from @agentops/shared
 * - No ORM-specific types leak through the interface
 */

import type {
  ExecutionContextEntry,
  ExecutionOutcome,
  RejectionPayload,
  Priority,
  PersonaModel,
  PersonaSettings,
} from "@agentops/shared";

// ── WorkItem Repository ─────────────────────────────────────────

export interface WorkItemRow {
  id: string;
  parentId: string | null;
  projectId: string;
  title: string;
  description: string;
  context: Record<string, unknown>;
  currentState: string;
  priority: Priority;
  labels: string[];
  assignedPersonaId: string | null;
  executionContext: ExecutionContextEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkItemRepository {
  /** Get a work item by ID. Returns null if not found. */
  getById(id: string): Promise<WorkItemRow | null>;

  /** Get just the projectId and title for a work item. */
  getProjectAndTitle(id: string): Promise<{ projectId: string; title: string } | null>;

  /** Get the current state of a work item. */
  getCurrentState(id: string): Promise<string | null>;

  /** Get the parent ID of a work item. */
  getParentId(id: string): Promise<string | null>;

  /** Get state and title for a work item (used by coordination). */
  getStateAndTitle(id: string): Promise<{ currentState: string; title: string } | null>;

  /** Get direct children of a work item with their current state. */
  getChildrenStates(parentId: string): Promise<Array<{ id: string; currentState: string }>>;

  /** Update the current state of a work item. */
  updateState(id: string, state: string): Promise<void>;

  /** Update the execution context array. */
  updateExecutionContext(id: string, context: ExecutionContextEntry[]): Promise<void>;

  /** Create a new work item. */
  create(item: {
    id: string;
    parentId: string | null;
    projectId: string;
    title: string;
    description: string;
    context: Record<string, unknown>;
    currentState: string;
    priority: Priority;
    labels: string[];
    assignedPersonaId: string | null;
    executionContext: ExecutionContextEntry[];
  }): Promise<void>;

  /** List work items by project, optionally filtered by state. */
  listByProject(projectId: string, state?: string): Promise<WorkItemRow[]>;
}

// ── Execution Repository ────────────────────────────────────────

export interface ExecutionRepository {
  /** Create a new execution record. */
  create(execution: {
    id: string;
    workItemId: string;
    personaId: string;
    projectId: string;
    status: string;
    startedAt: Date;
    costUsd: number;
    durationMs: number;
    summary: string;
    outcome: ExecutionOutcome | null;
    rejectionPayload: RejectionPayload | null;
    logs: string;
  }): Promise<void>;

  /** Update execution on successful completion. */
  updateCompleted(id: string, data: {
    status: string;
    completedAt: Date;
    costUsd: number;
    durationMs: number;
    summary: string;
    outcome: ExecutionOutcome;
    logs: string;
    checkpointMessageId: string | null;
    structuredOutput: Record<string, unknown> | null;
  }): Promise<void>;

  /** Update execution on failure. */
  updateFailed(id: string, data: {
    status: string;
    completedAt: Date;
    summary: string;
    outcome: ExecutionOutcome;
    logs: string;
  }): Promise<void>;
}

// ── Persona Repository ──────────────────────────────────────────

export interface PersonaRow {
  id: string;
  name: string;
  description: string;
  avatar: { color: string; icon: string };
  systemPrompt: string;
  model: PersonaModel;
  allowedTools: string[];
  mcpTools: string[];
  skills: string[];
  subagents: string[];
  maxBudgetPerRun: number;
  settings: PersonaSettings;
}

export interface PersonaRepository {
  /** Get a persona by ID. */
  getById(id: string): Promise<PersonaRow | null>;

  /** Get all personas. */
  getAll(): Promise<PersonaRow[]>;

  /** Find a persona by name. Returns ID if found, null otherwise. */
  findByName(name: string): Promise<string | null>;

  /** Create a new persona. */
  create(persona: {
    id: string;
    name: string;
    description: string;
    avatar: { color: string; icon: string };
    systemPrompt: string;
    model: string;
    allowedTools: string[];
    mcpTools: string[];
    maxBudgetPerRun: number;
    settings: Record<string, unknown>;
  }): Promise<void>;

  /** Update a persona's system prompt. */
  updateSystemPrompt(id: string, systemPrompt: string): Promise<void>;

  /** Get the persona assignment for a project + state. Returns personaId or null. */
  getAssignment(projectId: string, stateName: string): Promise<string | null>;
}

// ── Comment Repository ──────────────────────────────────────────

export interface CommentRepository {
  /** Create a new comment. */
  create(comment: {
    id: string;
    workItemId: string;
    authorType: string;
    authorId: string | null;
    authorName: string;
    content: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
  }): Promise<void>;

  /** Get recent Router comments for a work item (for transition history). */
  getRecentRouterComments(
    workItemId: string,
    limit: number,
  ): Promise<Array<{ metadata: Record<string, unknown>; createdAt: Date }>>;
}

// ── Project Repository ──────────────────────────────────────────

export interface ProjectRow {
  id: string;
  name: string;
  path: string;
  settings: Record<string, unknown>;
  createdAt: Date;
}

export interface ProjectRepository {
  /** Get a project by ID. */
  getById(id: string): Promise<ProjectRow | null>;

  /** Get just the settings for a project. */
  getSettings(id: string): Promise<Record<string, unknown> | null>;
}

// ── WorkItemEdge Repository ─────────────────────────────────────

export interface WorkItemEdgeRepository {
  /** Create a dependency edge between work items. */
  create(edge: {
    id: string;
    fromId: string;
    toId: string;
    type: string;
  }): Promise<void>;
}

// ── Combined Repositories ───────────────────────────────────────

/**
 * All repositories needed by the agent execution engine.
 * Passed to ExecutionManager and agent modules via dependency injection.
 */
export interface Repositories {
  workItems: WorkItemRepository;
  executions: ExecutionRepository;
  personas: PersonaRepository;
  comments: CommentRepository;
  projects: ProjectRepository;
  workItemEdges: WorkItemEdgeRepository;
}
