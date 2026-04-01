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
  personas,
  comments,
  projects,
  personaAssignments,
  workItemEdges,
} from "./schema.js";
import type {
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
} from "@agentops/core";
import type { ExecutionContextEntry, Priority, PersonaModel, PersonaSettings } from "@agentops/shared";

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
    assignedPersonaId: row.assignedPersonaId,
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
    assignedPersonaId: string | null;
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
  async create(execution: Parameters<ExecutionRepository["create"]>[0]): Promise<void> {
    await db.insert(executions).values(execution);
  }

  async updateCompleted(id: string, data: Parameters<ExecutionRepository["updateCompleted"]>[1]): Promise<void> {
    await db.update(executions).set(data).where(eq(executions.id, id));
  }

  async updateFailed(id: string, data: Parameters<ExecutionRepository["updateFailed"]>[1]): Promise<void> {
    await db.update(executions).set(data).where(eq(executions.id, id));
  }
}

// ── Persona Repository ──────────────────────────────────────────

function toPersonaRow(row: typeof personas.$inferSelect): PersonaRow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    avatar: row.avatar,
    systemPrompt: row.systemPrompt,
    model: row.model as PersonaModel,
    allowedTools: row.allowedTools,
    mcpTools: row.mcpTools,
    skills: row.skills,
    subagents: row.subagents ?? [],
    maxBudgetPerRun: row.maxBudgetPerRun,
    settings: row.settings as PersonaSettings,
  };
}

export class DrizzlePersonaRepository implements PersonaRepository {
  async getById(id: string): Promise<PersonaRow | null> {
    const [row] = await db.select().from(personas).where(eq(personas.id, id));
    return row ? toPersonaRow(row) : null;
  }

  async getAll(): Promise<PersonaRow[]> {
    const rows = await db.select().from(personas);
    return rows.map(toPersonaRow);
  }

  async findByName(name: string): Promise<string | null> {
    const [row] = await db
      .select({ id: personas.id })
      .from(personas)
      .where(eq(personas.name, name));
    return row?.id ?? null;
  }

  async create(persona: Parameters<PersonaRepository["create"]>[0]): Promise<void> {
    await db.insert(personas).values(persona);
  }

  async updateSystemPrompt(id: string, systemPrompt: string): Promise<void> {
    await db.update(personas).set({ systemPrompt }).where(eq(personas.id, id));
  }

  async getAssignment(projectId: string, stateName: string): Promise<string | null> {
    const [row] = await db
      .select({ personaId: personaAssignments.personaId })
      .from(personaAssignments)
      .where(and(
        eq(personaAssignments.projectId, projectId),
        eq(personaAssignments.stateName, stateName),
      ));
    return row?.personaId ?? null;
  }
}

// ── Comment Repository ──────────────────────────────────────────

export class DrizzleCommentRepository implements CommentRepository {
  async create(comment: Parameters<CommentRepository["create"]>[0]): Promise<void> {
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
  async create(edge: Parameters<WorkItemEdgeRepository["create"]>[0]): Promise<void> {
    await db.insert(workItemEdges).values(edge);
  }
}

// ── Factory ─────────────────────────────────────────────────────

/** Create all Drizzle repository implementations. */
export function createDrizzleRepositories(): Repositories {
  return {
    workItems: new DrizzleWorkItemRepository(),
    executions: new DrizzleExecutionRepository(),
    personas: new DrizzlePersonaRepository(),
    comments: new DrizzleCommentRepository(),
    projects: new DrizzleProjectRepository(),
    workItemEdges: new DrizzleWorkItemEdgeRepository(),
  };
}
