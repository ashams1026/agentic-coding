import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "../db/connection.js";
import { webhookSubscriptions, webhookDeliveries } from "../db/schema.js";

function generateSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(6).toString("base64url")}`;
}

export async function webhookRoutes(app: FastifyInstance) {
  // GET /api/webhooks — list subscriptions
  app.get("/api/webhooks", async () => {
    const rows = await db.select().from(webhookSubscriptions).orderBy(desc(webhookSubscriptions.createdAt));
    return {
      data: rows.map((r) => ({
        id: r.id,
        url: r.url,
        events: r.events,
        isActive: r.isActive,
        failureCount: r.failureCount,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total: rows.length,
    };
  });

  // POST /api/webhooks — create subscription
  app.post<{
    Body: { url: string; events: string[] };
  }>("/api/webhooks", async (_request, reply) => {
    const { url, events } = _request.body;
    const now = new Date();
    const id = generateId("wh");
    const secret = generateSecret();

    await db.insert(webhookSubscriptions).values({
      id,
      url,
      secret,
      events,
      isActive: true,
      failureCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return reply.status(201).send({
      data: { id, url, secret, events, isActive: true, failureCount: 0, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    });
  });

  // PATCH /api/webhooks/:id — update subscription
  app.patch<{
    Params: { id: string };
    Body: { url?: string; events?: string[]; isActive?: boolean };
  }>("/api/webhooks/:id", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;
    const now = new Date();

    const updates: Record<string, unknown> = { updatedAt: now };
    if (body.url !== undefined) updates.url = body.url;
    if (body.events !== undefined) updates.events = body.events;
    if (body.isActive !== undefined) {
      updates.isActive = body.isActive;
      if (body.isActive) updates.failureCount = 0; // reset on re-enable
    }

    const [row] = await db
      .update(webhookSubscriptions)
      .set(updates)
      .where(eq(webhookSubscriptions.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Webhook ${id} not found` } });
    }

    return {
      data: {
        id: row.id,
        url: row.url,
        events: row.events,
        isActive: row.isActive,
        failureCount: row.failureCount,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    };
  });

  // DELETE /api/webhooks/:id — delete subscription (cascades deliveries)
  app.delete<{
    Params: { id: string };
  }>("/api/webhooks/:id", async (request, reply) => {
    const { id } = request.params;

    const [deleted] = await db
      .delete(webhookSubscriptions)
      .where(eq(webhookSubscriptions.id, id))
      .returning();

    if (!deleted) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Webhook ${id} not found` } });
    }

    return reply.status(204).send();
  });

  // GET /api/webhooks/:id/deliveries — delivery log
  app.get<{
    Params: { id: string };
    Querystring: { limit?: string };
  }>("/api/webhooks/:id/deliveries", async (request, reply) => {
    const { id } = request.params;
    const limit = Math.min(parseInt(request.query.limit ?? "50", 10) || 50, 200);

    // Verify subscription exists
    const [sub] = await db.select({ id: webhookSubscriptions.id }).from(webhookSubscriptions).where(eq(webhookSubscriptions.id, id));
    if (!sub) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Webhook ${id} not found` } });
    }

    const rows = await db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.subscriptionId, id))
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(limit);

    return {
      data: rows.map((r) => ({
        id: r.id,
        event: r.event,
        status: r.status,
        statusCode: r.statusCode,
        latencyMs: r.latencyMs,
        attempt: r.attempt,
        createdAt: r.createdAt.toISOString(),
      })),
      total: rows.length,
    };
  });
}
