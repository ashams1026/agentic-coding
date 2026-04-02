import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { Readable } from "node:stream";
import { db } from "../db/connection.js";
import { webhookTriggers, personas } from "../db/schema.js";
import { executionManager } from "../agent/setup.js";
import { logger } from "../logger.js";

declare module "fastify" {
  interface FastifyRequest {
    rawBody?: string;
  }
}

// ── Helpers ─────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(6).toString("base64url")}`;
}

function generateSecret(): string {
  return `whtsec_${randomBytes(24).toString("base64url")}`;
}

function verifyHmac(payload: string, secret: string, signature: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const expectedPrefixed = `sha256=${expected}`;
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedPrefixed));
  } catch {
    return false;
  }
}

function resolveTemplate(template: string, payload: Record<string, unknown>): string {
  return template.replace(/\{\{payload\.([^}]+)\}\}/g, (_match, path: string) => {
    const parts = path.split(".");
    let value: unknown = payload;
    for (const part of parts) {
      if (value && typeof value === "object") {
        value = (value as Record<string, unknown>)[part];
      } else {
        return `{{payload.${path}}}`;
      }
    }
    return value !== undefined && value !== null ? String(value) : `{{payload.${path}}}`;
  });
}

// ── Routes ──────────────────────────────────────────────────────

export async function webhookTriggerRoutes(app: FastifyInstance) {
  // ── Generic receiver ──────────────────────────────────────────

  app.post<{
    Params: { triggerId: string };
    Body: Record<string, unknown>;
  }>("/api/webhooks/trigger/:triggerId", {
    preParsing: async (request, _reply, payload) => {
      const chunks: Buffer[] = [];
      for await (const chunk of payload) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk as Buffer);
      }
      const rawBuffer = Buffer.concat(chunks);
      request.rawBody = rawBuffer.toString("utf8");
      return Readable.from(rawBuffer);
    },
  }, async (request, reply) => {
    const { triggerId } = request.params;

    const [trigger] = await db
      .select()
      .from(webhookTriggers)
      .where(eq(webhookTriggers.id, triggerId));

    if (!trigger || !trigger.isActive) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Trigger not found or inactive" } });
    }

    // Validate HMAC signature
    const signature = request.headers["x-webhook-signature"] as string | undefined;
    if (!signature) {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Missing X-Webhook-Signature header" } });
    }

    if (!verifyHmac(request.rawBody!, trigger.secret, signature)) {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Invalid signature" } });
    }

    // Resolve prompt template with payload
    const prompt = resolveTemplate(trigger.promptTemplate, request.body);

    // Spawn execution with resolved prompt
    try {
      const executionId = await executionManager.runExecution(
        null as any, // no work item — standalone trigger
        trigger.personaId,
        prompt,
      );

      logger.info({ triggerId, executionId, personaId: trigger.personaId }, "Webhook trigger fired");

      return reply.status(201).send({
        data: {
          executionId,
          triggerId,
          prompt,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      logger.error({ err, triggerId }, "Webhook trigger execution failed");
      return reply.status(500).send({ error: { code: "EXECUTION_FAILED", message: "Failed to spawn execution" } });
    }
  });

  // ── CRUD ──────────────────────────────────────────────────────

  // GET /api/webhook-triggers — list triggers
  app.get("/api/webhook-triggers", async () => {
    const rows = await db
      .select({
        id: webhookTriggers.id,
        name: webhookTriggers.name,
        personaId: webhookTriggers.personaId,
        personaName: personas.name,
        projectId: webhookTriggers.projectId,
        promptTemplate: webhookTriggers.promptTemplate,
        isActive: webhookTriggers.isActive,
        createdAt: webhookTriggers.createdAt,
      })
      .from(webhookTriggers)
      .leftJoin(personas, eq(webhookTriggers.personaId, personas.id))
      .orderBy(desc(webhookTriggers.createdAt));

    return {
      data: rows.map((r) => ({
        ...r,
        personaName: r.personaName ?? "Unknown",
        createdAt: r.createdAt?.toISOString() ?? null,
      })),
      total: rows.length,
    };
  });

  // POST /api/webhook-triggers — create trigger
  app.post<{
    Body: { name: string; personaId: string; projectId?: string; promptTemplate?: string };
  }>("/api/webhook-triggers", async (_request, reply) => {
    const { name, personaId, projectId, promptTemplate } = _request.body;
    const now = new Date();
    const id = generateId("wht");
    const secret = generateSecret();

    await db.insert(webhookTriggers).values({
      id,
      name,
      secret,
      personaId,
      projectId: projectId ?? null,
      promptTemplate: promptTemplate ?? "",
      isActive: true,
      createdAt: now,
    });

    return reply.status(201).send({
      data: {
        id,
        name,
        secret,
        personaId,
        projectId: projectId ?? null,
        promptTemplate: promptTemplate ?? "",
        isActive: true,
        createdAt: now.toISOString(),
        // Include the trigger URL for convenience
        triggerUrl: `/api/webhooks/trigger/${id}`,
      },
    });
  });

  // PATCH /api/webhook-triggers/:id — update trigger
  app.patch<{
    Params: { id: string };
    Body: { name?: string; personaId?: string; projectId?: string; promptTemplate?: string; isActive?: boolean };
  }>("/api/webhook-triggers/:id", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.personaId !== undefined) updates.personaId = body.personaId;
    if (body.projectId !== undefined) updates.projectId = body.projectId;
    if (body.promptTemplate !== undefined) updates.promptTemplate = body.promptTemplate;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: { code: "BAD_REQUEST", message: "No fields to update" } });
    }

    const [row] = await db
      .update(webhookTriggers)
      .set(updates)
      .where(eq(webhookTriggers.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Trigger ${id} not found` } });
    }

    return { data: { ...row, createdAt: row.createdAt.toISOString() } };
  });

  // DELETE /api/webhook-triggers/:id
  app.delete<{
    Params: { id: string };
  }>("/api/webhook-triggers/:id", async (request, reply) => {
    const { id } = request.params;

    const [deleted] = await db
      .delete(webhookTriggers)
      .where(eq(webhookTriggers.id, id))
      .returning();

    if (!deleted) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Trigger ${id} not found` } });
    }

    return reply.status(204).send();
  });
}
