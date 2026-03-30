import type { FastifyInstance } from "fastify";
import { eq, or } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workItemEdges } from "../db/schema.js";
import { createId } from "@agentops/shared";
import type {
  WorkItemId,
  WorkItemEdgeId,
  CreateWorkItemEdgeRequest,
} from "@agentops/shared";

function serializeEdge(row: typeof workItemEdges.$inferSelect) {
  return {
    id: row.id as WorkItemEdgeId,
    fromId: row.fromId as WorkItemId,
    toId: row.toId as WorkItemId,
    type: row.type,
  };
}

export async function workItemEdgeRoutes(app: FastifyInstance) {
  // GET /api/work-item-edges?workItemId= — list edges for a work item
  app.get<{
    Querystring: { workItemId?: string };
  }>("/api/work-item-edges", async (request) => {
    const { workItemId } = request.query;

    let rows;
    if (workItemId) {
      rows = await db
        .select()
        .from(workItemEdges)
        .where(
          or(
            eq(workItemEdges.fromId, workItemId),
            eq(workItemEdges.toId, workItemId),
          ),
        );
    } else {
      rows = await db.select().from(workItemEdges);
    }

    return { data: rows.map(serializeEdge), total: rows.length };
  });

  // POST /api/work-item-edges
  app.post<{
    Body: CreateWorkItemEdgeRequest;
  }>("/api/work-item-edges", async (request, reply) => {
    const { fromId, toId, type } = request.body;
    const id = createId.workItemEdge();

    const [row] = await db
      .insert(workItemEdges)
      .values({ id, fromId, toId, type })
      .returning();

    return reply.status(201).send({ data: serializeEdge(row!) });
  });

  // DELETE /api/work-item-edges/:id
  app.delete<{
    Params: { id: string };
  }>("/api/work-item-edges/:id", async (request, reply) => {
    const { id } = request.params;

    const [row] = await db
      .delete(workItemEdges)
      .where(eq(workItemEdges.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Edge ${id} not found` } });
    }

    return reply.status(204).send();
  });
}
