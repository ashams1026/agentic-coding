import type { FastifyInstance } from "fastify";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workItems } from "../db/schema.js";
import { createId } from "@agentops/shared";
import { WORKFLOW } from "@agentops/shared";
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

    const conditions = [];
    if (projectId) conditions.push(eq(workItems.projectId, projectId));
    if (parentId) {
      conditions.push(eq(workItems.parentId, parentId));
    } else if (parentId === undefined && !projectId) {
      // Default: return top-level items (no parent)
    }

    let rows;
    if (conditions.length > 0) {
      rows = await db
        .select()
        .from(workItems)
        .where(conditions.length === 1 ? conditions[0]! : and(...conditions));
    } else {
      rows = await db.select().from(workItems);
    }

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

    // Build update object with only provided fields
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) updates["title"] = body.title;
    if (body.description !== undefined) updates["description"] = body.description;
    if (body.priority !== undefined) updates["priority"] = body.priority;
    if (body.labels !== undefined) updates["labels"] = JSON.stringify(body.labels);
    if (body.currentState !== undefined) updates["currentState"] = body.currentState;
    if (body.context !== undefined) updates["context"] = JSON.stringify(body.context);
    if (body.assignedPersonaId !== undefined) updates["assignedPersonaId"] = body.assignedPersonaId;

    const [row] = await db
      .update(workItems)
      .set(updates)
      .where(eq(workItems.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Work item ${id} not found` } });
    }

    return { data: serializeWorkItem(row) };
  });

  // DELETE /api/work-items/:id (recursive — deletes children too)
  app.delete<{
    Params: { id: string };
  }>("/api/work-items/:id", async (request, reply) => {
    const { id } = request.params;

    // Collect all descendant IDs recursively
    const idsToDelete: string[] = [id];
    let frontier = [id];

    while (frontier.length > 0) {
      const children = await db
        .select({ id: workItems.id })
        .from(workItems)
        .where(inArray(workItems.parentId, frontier));

      const childIds = children.map((c) => c.id);
      idsToDelete.push(...childIds);
      frontier = childIds;
    }

    // Delete in reverse order (deepest first)
    for (const deleteId of idsToDelete.reverse()) {
      await db.delete(workItems).where(eq(workItems.id, deleteId));
    }

    return reply.status(204).send();
  });
}
