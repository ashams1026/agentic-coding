import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { comments, workItems } from "../db/schema.js";
import { createId } from "@agentops/shared";
import type {
  CommentId,
  WorkItemId,
  PersonaId,
  CreateCommentRequest,
} from "@agentops/shared";

function toIso(d: Date): string {
  return d.toISOString();
}

function serializeComment(row: typeof comments.$inferSelect) {
  return {
    id: row.id as CommentId,
    workItemId: row.workItemId as WorkItemId,
    authorType: row.authorType,
    authorId: (row.authorId as PersonaId) ?? null,
    authorName: row.authorName,
    content: row.content,
    metadata: row.metadata,
    createdAt: toIso(row.createdAt),
  };
}

export async function commentRoutes(app: FastifyInstance) {
  // GET /api/comments?workItemId= — list comments for a work item
  app.get<{
    Querystring: { workItemId?: string; projectId?: string };
  }>("/api/comments", async (request) => {
    const { workItemId, projectId } = request.query;

    let rows;
    if (workItemId) {
      rows = await db
        .select()
        .from(comments)
        .where(eq(comments.workItemId, workItemId));
    } else {
      rows = await db.select().from(comments);
    }

    if (projectId && !workItemId) {
      const projectWorkItems = await db.select().from(workItems).where(eq(workItems.projectId, projectId));
      const workItemIds = new Set(projectWorkItems.map((w) => w.id));
      rows = rows.filter((r) => workItemIds.has(r.workItemId));
    }

    return { data: rows.map(serializeComment), total: rows.length };
  });

  // GET /api/comments/:id
  app.get<{
    Params: { id: string };
  }>("/api/comments/:id", async (request, reply) => {
    const { id } = request.params;

    const [row] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id));

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Comment ${id} not found` } });
    }

    return { data: serializeComment(row) };
  });

  // POST /api/comments
  app.post<{
    Body: CreateCommentRequest;
  }>("/api/comments", async (request, reply) => {
    const body = request.body;
    const id = createId.comment();

    const [row] = await db
      .insert(comments)
      .values({
        id,
        workItemId: body.workItemId,
        authorType: body.authorType,
        authorId: body.authorId ?? null,
        authorName: body.authorName,
        content: body.content,
        metadata: body.metadata ?? {},
        createdAt: new Date(),
      })
      .returning();

    return reply.status(201).send({ data: serializeComment(row!) });
  });

  // DELETE /api/comments/:id
  app.delete<{
    Params: { id: string };
  }>("/api/comments/:id", async (request, reply) => {
    const [row] = await db
      .delete(comments)
      .where(eq(comments.id, request.params.id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Comment ${request.params.id} not found` } });
    }

    return reply.status(204).send();
  });
}
