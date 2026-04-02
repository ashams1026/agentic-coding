import type { FastifyInstance } from "fastify";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workItems, workItemEdges, comments, proposals, projectMemories, executions } from "../db/schema.js";
import { createId } from "@agentops/shared";
import { dispatchForState } from "../agent/dispatch.js";
import { checkParentCoordination } from "../agent/coordination.js";
import { checkMemoryGeneration } from "../agent/memory.js";
import { WORKFLOW, isValidTransition } from "@agentops/shared";
import { broadcast } from "../ws.js";
import { auditStateTransition } from "../audit.js";
import type {
  WorkItemId,
  ProjectId,
  PersonaId,
  CreateWorkItemRequest,
  UpdateWorkItemRequest,
} from "@agentops/shared";

function toIso(d: Date): string {
  return d.toISOString();
}

function serializeWorkItem(row: typeof workItems.$inferSelect) {
  return {
    ...row,
    id: row.id as WorkItemId,
    parentId: (row.parentId as WorkItemId) ?? null,
    projectId: row.projectId as ProjectId,
    assignedPersonaId: (row.assignedPersonaId as PersonaId) ?? null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export async function workItemRoutes(app: FastifyInstance) {
  // GET /api/work-items — list with optional filters
  app.get<{
    Querystring: { parentId?: string; projectId?: string };
  }>("/api/work-items", async (request) => {
    const { parentId, projectId } = request.query;

    const conditions = [
      isNull(workItems.deletedAt),
      isNull(workItems.archivedAt),
    ];
    if (projectId) conditions.push(eq(workItems.projectId, projectId));
    if (parentId) {
      conditions.push(eq(workItems.parentId, parentId));
    }

    const rows = await db
      .select()
      .from(workItems)
      .where(and(...conditions));

    return { data: rows.map(serializeWorkItem), total: rows.length };
  });

  // GET /api/work-items/:id
  app.get<{
    Params: { id: string };
  }>("/api/work-items/:id", async (request, reply) => {
    const { id } = request.params;

    const [row] = await db
      .select()
      .from(workItems)
      .where(eq(workItems.id, id));

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Work item ${id} not found` } });
    }

    return { data: serializeWorkItem(row) };
  });

  // POST /api/work-items
  app.post<{
    Body: CreateWorkItemRequest;
  }>("/api/work-items", async (request, reply) => {
    const body = request.body;
    const now = new Date();
    const id = createId.workItem();

    const [row] = await db
      .insert(workItems)
      .values({
        id,
        parentId: body.parentId ?? null,
        projectId: body.projectId,
        title: body.title,
        description: body.description ?? "",
        context: body.context ?? {},
        currentState: WORKFLOW.initialState,
        priority: body.priority ?? "p2",
        labels: body.labels ?? [],
        assignedPersonaId: null,
        executionContext: [],
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return reply.status(201).send({ data: serializeWorkItem(row!) });
  });

  // PATCH /api/work-items/:id
  app.patch<{
    Params: { id: string };
    Body: UpdateWorkItemRequest;
  }>("/api/work-items/:id", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    // Validate state transition if currentState is being changed
    let previousState: string | undefined;
    if (body.currentState !== undefined) {
      const [existing] = await db
        .select({ currentState: workItems.currentState })
        .from(workItems)
        .where(eq(workItems.id, id));

      if (!existing) {
        return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Work item ${id} not found` } });
      }

      if (!isValidTransition(existing.currentState, body.currentState)) {
        return reply.status(400).send({
          error: {
            code: "INVALID_TRANSITION",
            message: `Cannot transition from "${existing.currentState}" to "${body.currentState}"`,
          },
        });
      }

      previousState = existing.currentState;
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) updates["title"] = body.title;
    if (body.description !== undefined) updates["description"] = body.description;
    if (body.priority !== undefined) updates["priority"] = body.priority;
    if (body.labels !== undefined) updates["labels"] = body.labels;
    if (body.currentState !== undefined) updates["currentState"] = body.currentState;
    if (body.context !== undefined) updates["context"] = body.context;
    if (body.assignedPersonaId !== undefined) updates["assignedPersonaId"] = body.assignedPersonaId;

    const [row] = await db
      .update(workItems)
      .set(updates)
      .where(eq(workItems.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Work item ${id} not found` } });
    }

    // Dispatch persona execution if state changed
    if (body.currentState !== undefined && previousState !== undefined) {
      broadcast({
        type: "state_change",
        workItemId: id as WorkItemId,
        fromState: previousState,
        toState: body.currentState,
        triggeredBy: "user",
        timestamp: new Date().toISOString(),
      });

      // Audit: user-driven state transition
      auditStateTransition({
        workItemId: id,
        fromState: previousState,
        toState: body.currentState,
        actor: "user",
        actorType: "user",
      });

      dispatchForState(id, body.currentState).catch((err) => {
        app.log.error({ err, workItemId: id, state: body.currentState }, "Dispatch failed");
      });
      checkParentCoordination(id, body.currentState).catch((err) => {
        app.log.error({ err, workItemId: id, state: body.currentState }, "Coordination failed");
      });
      checkMemoryGeneration(id, body.currentState).catch((err) => {
        app.log.error({ err, workItemId: id, state: body.currentState }, "Memory generation failed");
      });
    }

    return { data: serializeWorkItem(row) };
  });

  // POST /api/work-items/:id/retry — re-dispatch persona for current state
  app.post<{
    Params: { id: string };
  }>("/api/work-items/:id/retry", async (request, reply) => {
    const { id } = request.params;

    const [item] = await db
      .select({ id: workItems.id, currentState: workItems.currentState })
      .from(workItems)
      .where(eq(workItems.id, id));

    if (!item) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Work item ${id} not found` } });
    }

    // Fire-and-forget dispatch for current state
    dispatchForState(id, item.currentState).catch((err) => {
      app.log.error({ err, workItemId: id, state: item.currentState }, "Retry dispatch failed");
    });

    return { data: { workItemId: id, state: item.currentState, dispatched: true } };
  });

  // DELETE /api/work-items/:id (soft delete — sets deleted_at, cascades related data)
  app.delete<{
    Params: { id: string };
  }>("/api/work-items/:id", async (request, reply) => {
    const { id } = request.params;

    // Collect all descendant IDs recursively (BFS)
    const allIds: string[] = [id];
    let frontier = [id];

    while (frontier.length > 0) {
      const children = await db
        .select({ id: workItems.id })
        .from(workItems)
        .where(inArray(workItems.parentId, frontier));

      const childIds = children.map((c) => c.id);
      allIds.push(...childIds);
      frontier = childIds;
    }

    // 409 guard: block if any execution is currently running for these items
    const runningExecs = await db
      .select({ id: executions.id })
      .from(executions)
      .where(
        and(
          inArray(executions.workItemId, allIds),
          eq(executions.status, "running"),
        ),
      );

    if (runningExecs.length > 0) {
      return reply.status(409).send({
        error: {
          code: "CONFLICT",
          message: "Cannot delete work item with active executions",
          activeExecutions: runningExecs.length,
        },
      });
    }

    // Cascade-delete related data for all descendants
    await db.delete(workItemEdges).where(inArray(workItemEdges.fromId, allIds));
    await db.delete(workItemEdges).where(inArray(workItemEdges.toId, allIds));
    await db.delete(comments).where(inArray(comments.workItemId, allIds));
    await db.delete(proposals).where(inArray(proposals.workItemId, allIds));
    await db.delete(projectMemories).where(inArray(projectMemories.workItemId, allIds));

    // Soft delete: set deleted_at instead of hard-deleting
    const now = new Date();
    await db
      .update(workItems)
      .set({ deletedAt: now })
      .where(inArray(workItems.id, allIds));

    return reply.status(204).send();
  });
}
