import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { personas } from "../db/schema.js";
import { createId } from "@agentops/shared";
import type {
  PersonaId,
  CreatePersonaRequest,
  UpdatePersonaRequest,
} from "@agentops/shared";

function serializePersona(row: typeof personas.$inferSelect) {
  return {
    id: row.id as PersonaId,
    name: row.name,
    description: row.description,
    avatar: row.avatar,
    systemPrompt: row.systemPrompt,
    model: row.model,
    allowedTools: row.allowedTools,
    mcpTools: row.mcpTools,
    maxBudgetPerRun: row.maxBudgetPerRun,
    settings: row.settings,
  };
}

export async function personaRoutes(app: FastifyInstance) {
  // GET /api/personas — list all personas
  app.get("/api/personas", async () => {
    const rows = await db.select().from(personas);
    return { data: rows.map(serializePersona), total: rows.length };
  });

  // GET /api/personas/:id
  app.get<{
    Params: { id: string };
  }>("/api/personas/:id", async (request, reply) => {
    const { id } = request.params;

    const [row] = await db
      .select()
      .from(personas)
      .where(eq(personas.id, id));

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Persona ${id} not found` } });
    }

    return { data: serializePersona(row) };
  });

  // POST /api/personas
  app.post<{
    Body: CreatePersonaRequest;
  }>("/api/personas", async (request, reply) => {
    const body = request.body;
    const id = createId.persona();

    const [row] = await db
      .insert(personas)
      .values({
        id,
        name: body.name,
        description: body.description ?? "",
        avatar: body.avatar ?? { color: "#6b7280", icon: "user" },
        systemPrompt: body.systemPrompt,
        model: body.model,
        allowedTools: body.allowedTools ?? [],
        mcpTools: body.mcpTools ?? [],
        maxBudgetPerRun: body.maxBudgetPerRun ?? 0,
        settings: {},
      })
      .returning();

    return reply.status(201).send({ data: serializePersona(row!) });
  });

  // PATCH /api/personas/:id
  app.patch<{
    Params: { id: string };
    Body: UpdatePersonaRequest;
  }>("/api/personas/:id", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates["name"] = body.name;
    if (body.description !== undefined) updates["description"] = body.description;
    if (body.avatar !== undefined) updates["avatar"] = body.avatar;
    if (body.systemPrompt !== undefined) updates["systemPrompt"] = body.systemPrompt;
    if (body.model !== undefined) updates["model"] = body.model;
    if (body.allowedTools !== undefined) updates["allowedTools"] = body.allowedTools;
    if (body.mcpTools !== undefined) updates["mcpTools"] = body.mcpTools;
    if (body.maxBudgetPerRun !== undefined) updates["maxBudgetPerRun"] = body.maxBudgetPerRun;

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: { code: "BAD_REQUEST", message: "No fields to update" } });
    }

    const [row] = await db
      .update(personas)
      .set(updates)
      .where(eq(personas.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Persona ${id} not found` } });
    }

    return { data: serializePersona(row) };
  });

  // DELETE /api/personas/:id
  app.delete<{
    Params: { id: string };
  }>("/api/personas/:id", async (request, reply) => {
    const [row] = await db
      .delete(personas)
      .where(eq(personas.id, request.params.id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Persona ${request.params.id} not found` } });
    }

    return reply.status(204).send();
  });
}
