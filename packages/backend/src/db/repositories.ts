/**
 * Drizzle ORM implementations of @agentops/core repository interfaces.
 *
 * Each repository wraps the Drizzle query builder for a specific table.
 * These are injected into the ExecutionManager via the composition root (setup.ts).
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "./connection.js";
import {
  workItems,
  executions,
  agents,
  comments,
  projects,
  agentAssignments,
  workItemEdges,
} from "./schema.js";
import type {
  WorkItemRepository,
  WorkItemRow,
  ExecutionRepository,
  AgentRepository,
  AgentRow,
  CommentRepository,
  ProjectRepository,
  ProjectRow,
  WorkItemEdgeRepository,
  Repositories,
} from "@agentops/core";
import type { ExecutionContextEntry, ExecutionOutcome, RejectionPayload, Priority, AgentModel, AgentSettings } from "@agentops/shared";

// ── WorkItem Repository ─────────────────────────────────────────

function toWorkItemRow(row: typeof workItems.$inferSelect): WorkItemRow {
  return {
    id: row.id,
    parentId: row.parentId,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    context: row.context,
    currentState: row.currentState,
    priority: row.priority as Priority,
    labels: row.labels,
    assignedAgentId: row.assignedAgentId,
    executionContext: row.executionContext as ExecutionContextEntry[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleWorkItemRepository implements WorkItemRepository {
  async getById(id: string): Promise<WorkItemRow | null> {
    const [row] = await db.select().from(workItems).where(eq(workItems.id, id));
    return row ? toWorkItemRow(row) : null;
  }

  async getProjectAndTitle(id: string): Promise<{ projectId: string; title: string } | null> {
    const [row] = await db
      .select({ projectId: workItems.projectId, title: workItems.title })
      .from(workItems)
      .where(eq(workItems.id, id));
    return row ?? null;
  }

  async getCurrentState(id: string): Promise<string | null> {
    const [row] = await db
      .select({ currentState: workItems.currentState })
      .from(workItems)
      .where(eq(workItems.id, id));
    return row?.currentState ?? null;
  }

  async getParentId(id: string): Promise<string | null> {
    const [row] = await db
      .select({ parentId: workItems.parentId })
      .from(workItems)
      .where(eq(workItems.id, id));
    return row?.parentId ?? null;
  }

  async getStateAndTitle(id: string): Promise<{ currentState: string; title: string } | null> {
    const [row] = await db
      .select({ currentState: workItems.currentState, title: workItems.title })
      .from(workItems)
      .where(eq(workItems.id, id));
    return row ?? null;
  }

  async getChildrenStates(parentId: string): Promise<Array<{ id: string; currentState: string }>> {
    return db
      .select({ id: workItems.id, currentState: workItems.currentState })
      .from(workItems)
      .where(eq(workItems.parentId, parentId));
  }

  async updateState(id: string, state: string): Promise<void> {
    await db
      .update(workItems)
      .set({ currentState: state, updatedAt: new Date() })
      .where(eq(workItems.id, id));
  }

  async updateExecutionContext(id: string, context: ExecutionContextEntry[]): Promise<void> {
    await db
      .update(workItems)
      .set({ executionContext: context, updatedAt: new Date() })
      .where(eq(workItems.id, id));
  }

  async create(item: {
    id: string;
    parentId: string | null;
    projectId: string;
    title: string;
    description: string;
    context: Record<string, unknown>;
    currentState: string;
    priority: Priority;
    labels: string[];
    assignedAgentId: string | null;
    executionContext: ExecutionContextEntry[];
  }): Promise<void> {
    const now = new Date();
    await db.insert(workItems).values({
      ...item,
      createdAt: now,
      updatedAt: now,
    });
  }

  async listByProject(projectId: string, state?: string): Promise<WorkItemRow[]> {
    const conditions = [eq(workItems.projectId, projectId)];
    if (state) conditions.push(eq(workItems.currentState, state));
    const rows = await db.select().from(workItems).where(and(...conditions));
    return rows.map(toWorkItemRow);
  }
}

// ── Execution Repository ────────────────────────────────────────

export class DrizzleExecutionRepository implements ExecutionRepository {
  async create(execution: {
    id: string;
    workItemId: string;
    agentId: string;
    projectId: string;
    status: string;
    startedAt: Date;
    costUsd: number;
    durationMs: number;
    summary: string;
    outcome: ExecutionOutcome | null;
    rejectionPayload: RejectionPayload | null;
    logs: string;
  }): Promise<void> {
    await db.insert(executions).values(execution);
  }

  async updateCompleted(id: string, data: {
    status: string;
    completedAt: Date;
    costUsd: number;
    durationMs: number;
    summary: string;
    outcome: ExecutionOutcome;
    logs: string;
    checkpointMessageId: string | null;
    structuredOutput: Record<string, unknown> | null;
  }): Promise<void> {
    await db.update(executions).set(data).where(eq(executions.id, id));
  }

  async updateFailed(id: string, data: {
    status: string;
    completedAt: Date;
    summary: string;
    outcome: ExecutionOutcome;
    logs: string;
  }): Promise<void> {
    await db.update(executions).set(data).where(eq(executions.id, id));
  }
}

// ── Agent Repository ──────────────────────────────────────────

function toAgentRow(row: typeof agents.$inferSelect): AgentRow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    avatar: row.avatar,
    systemPrompt: row.systemPrompt,
    model: row.model as AgentModel,
    allowedTools: row.allowedTools,
    mcpTools: row.mcpTools,
    skills: row.skills,
    subagents: row.subagents ?? [],
    maxBudgetPerRun: row.maxBudgetPerRun,
    settings: row.settings as AgentSettings,
    scope: row.scope as "global" | "project",
    projectId: row.projectId,
  };
}

export class DrizzleAgentRepository implements AgentRepository {
  async getById(id: string): Promise<AgentRow | null> {
    const [row] = await db.select().from(agents).where(eq(agents.id, id));
    return row ? toAgentRow(row) : null;
  }

  async getAll(): Promise<AgentRow[]> {
    const rows = await db.select().from(agents);
    return rows.map(toAgentRow);
  }

  async findByName(name: string): Promise<string | null> {
    const [row] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.name, name));
    return row?.id ?? null;
  }

  async create(agent: {
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
  }): Promise<void> {
    await db.insert(agents).values(agent);
  }

  async updateSystemPrompt(id: string, systemPrompt: string): Promise<void> {
    await db.update(agents).set({ systemPrompt }).where(eq(agents.id, id));
  }

  async getAssignment(projectId: string, stateName: string): Promise<string | null> {
    const [row] = await db
      .select({ agentId: agentAssignments.agentId })
      .from(agentAssignments)
      .where(and(
        eq(agentAssignments.projectId, projectId),
        eq(agentAssignments.stateName, stateName),
      ));
    return row?.agentId ?? null;
  }
}

// ── Comment Repository ──────────────────────────────────────────

export class DrizzleCommentRepository implements CommentRepository {
  async create(comment: {
    id: string;
    workItemId: string;
    authorType: string;
    authorId: string | null;
    authorName: string;
    content: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
  }): Promise<void> {
    await db.insert(comments).values(comment);
  }

  async getRecentRouterComments(
    workItemId: string,
    limit: number,
  ): Promise<Array<{ metadata: Record<string, unknown>; createdAt: Date }>> {
    return db
      .select({ metadata: comments.metadata, createdAt: comments.createdAt })
      .from(comments)
      .where(and(
        eq(comments.workItemId, workItemId),
        eq(comments.authorName, "Router"),
      ))
      .orderBy(desc(comments.createdAt))
      .limit(limit);
  }
}

// ── Project Repository ──────────────────────────────────────────

export class DrizzleProjectRepository implements ProjectRepository {
  async getById(id: string): Promise<ProjectRow | null> {
    const [row] = await db.select().from(projects).where(eq(projects.id, id));
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      settings: row.settings,
      createdAt: row.createdAt,
    };
  }

  async getSettings(id: string): Promise<Record<string, unknown> | null> {
    const [row] = await db
      .select({ settings: projects.settings })
      .from(projects)
      .where(eq(projects.id, id));
    return row?.settings ?? null;
  }
}

// ── WorkItemEdge Repository ─────────────────────────────────────

export class DrizzleWorkItemEdgeRepository implements WorkItemEdgeRepository {
  async create(edge: {
    id: string;
    fromId: string;
    toId: string;
    type: string;
  }): Promise<void> {
    await db.insert(workItemEdges).values(edge);
  }
}

// ── Factory ─────────────────────────────────────────────────────

/** Create all Drizzle repository implementations. */
export function createDrizzleRepositories(): Repositories {
  return {
    workItems: new DrizzleWorkItemRepository(),
    executions: new DrizzleExecutionRepository(),
    agents: new DrizzleAgentRepository(),
    comments: new DrizzleCommentRepository(),
    projects: new DrizzleProjectRepository(),
    workItemEdges: new DrizzleWorkItemEdgeRepository(),
  };
}
