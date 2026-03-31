import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/connection.js";
import { chatSessions, chatMessages } from "../db/schema.js";
import { createId } from "@agentops/shared";
import type {
  ChatSessionId,
  ChatMessageId,
  ProjectId,
} from "@agentops/shared";

function toIso(d: Date): string {
  return d.toISOString();
}

function serializeSession(row: typeof chatSessions.$inferSelect) {
  return {
    id: row.id as ChatSessionId,
    projectId: row.projectId as ProjectId,
    title: row.title,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function serializeMessage(row: typeof chatMessages.$inferSelect) {
  return {
    id: row.id as ChatMessageId,
    sessionId: row.sessionId as ChatSessionId,
    role: row.role as "user" | "assistant",
    content: row.content,
    metadata: row.metadata,
    createdAt: toIso(row.createdAt),
  };
}

export async function chatRoutes(app: FastifyInstance) {
  // POST /api/chat/sessions — create a new chat session
  app.post<{
    Body: { projectId: string };
  }>("/api/chat/sessions", async (request, reply) => {
    const { projectId } = request.body;
    if (!projectId) {
      return reply.status(400).send({ error: "projectId is required" });
    }

    const now = new Date();
    const id = createId.chatSession() as string;

    await db.insert(chatSessions).values({
      id,
      projectId,
      title: "New chat",
      createdAt: now,
      updatedAt: now,
    });

    const [row] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id));

    return { data: serializeSession(row!) };
  });

  // GET /api/chat/sessions?projectId= — list sessions (most recent first)
  app.get<{
    Querystring: { projectId?: string };
  }>("/api/chat/sessions", async (request) => {
    const { projectId } = request.query;

    let rows;
    if (projectId) {
      rows = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.projectId, projectId))
        .orderBy(desc(chatSessions.updatedAt));
    } else {
      rows = await db
        .select()
        .from(chatSessions)
        .orderBy(desc(chatSessions.updatedAt));
    }

    return { data: rows.map(serializeSession), total: rows.length };
  });

  // GET /api/chat/sessions/:id/messages — get message history
  app.get<{
    Params: { id: string };
  }>("/api/chat/sessions/:id/messages", async (request, reply) => {
    const { id } = request.params;

    // Verify session exists
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id));

    if (!session) {
      return reply.status(404).send({ error: "Session not found" });
    }

    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, id))
      .orderBy(chatMessages.createdAt);

    return { data: rows.map(serializeMessage), total: rows.length };
  });

  // DELETE /api/chat/sessions/:id — delete session (cascades messages)
  app.delete<{
    Params: { id: string };
  }>("/api/chat/sessions/:id", async (request, reply) => {
    const { id } = request.params;

    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id));

    if (!session) {
      return reply.status(404).send({ error: "Session not found" });
    }

    // Delete messages first (cascade may not work in all SQLite configs)
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, id));
    await db.delete(chatSessions).where(eq(chatSessions.id, id));

    return { success: true };
  });
}
