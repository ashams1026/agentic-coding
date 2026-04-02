import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { agents } from "../db/schema.js";
import { createId } from "@agentops/shared";
import type {
  AgentId,
  CreateAgentRequest,
  UpdateAgentRequest,
} from "@agentops/shared";

function serializeAgent(row: typeof agents.$inferSelect) {
  return {
    id: row.id as AgentId,
    name: row.name,
    description: row.description,
    avatar: row.avatar,
    systemPrompt: row.systemPrompt,
    model: row.model,
    allowedTools: row.allowedTools,
    mcpTools: row.mcpTools,
    skills: row.skills,
    subagents: row.subagents,
    maxBudgetPerRun: row.maxBudgetPerRun,
    settings: row.settings,
  };
}

export async function agentRoutes(app: FastifyInstance) {
  // GET /api/agents — list all agents
  app.get("/api/agents", async () => {
    const rows = await db.select().from(agents);
    return { data: rows.map(serializeAgent), total: rows.length };
  });

  // GET /api/agents/:id
  app.get<{
    Params: { id: string };
  }>("/api/agents/:id", async (request, reply) => {
    const { id } = request.params;

    const [row] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, id));

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Agent ${id} not found` } });
    }

    return { data: serializeAgent(row) };
  });

  // POST /api/agents
  app.post<{
    Body: CreateAgentRequest;
  }>("/api/agents", async (request, reply) => {
    const body = request.body;
    const id = createId.agent();

    const [row] = await db
      .insert(agents)
      .values({
        id,
        name: body.name,
        description: body.description ?? "",
        avatar: body.avatar ?? { color: "#6b7280", icon: "user" },
        systemPrompt: body.systemPrompt,
        model: body.model,
        allowedTools: body.allowedTools ?? [],
        mcpTools: body.mcpTools ?? [],
        skills: body.skills ?? [],
        subagents: body.subagents ?? [],
        maxBudgetPerRun: body.maxBudgetPerRun ?? 0,
        settings: {},
      })
      .returning();

    return reply.status(201).send({ data: serializeAgent(row!) });
  });

  // PATCH /api/agents/:id
  app.patch<{
    Params: { id: string };
    Body: UpdateAgentRequest;
  }>("/api/agents/:id", async (request, reply) => {
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
    if (body.skills !== undefined) updates["skills"] = body.skills;
    if (body.subagents !== undefined) updates["subagents"] = body.subagents;
    if (body.maxBudgetPerRun !== undefined) updates["maxBudgetPerRun"] = body.maxBudgetPerRun;
    if (body.settings !== undefined) {
      // Merge with existing settings to preserve system flags
      const [existing] = await db.select({ settings: agents.settings }).from(agents).where(eq(agents.id, id));
      updates["settings"] = { ...(existing?.settings ?? {}), ...body.settings };
    }

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: { code: "BAD_REQUEST", message: "No fields to update" } });
    }

    const [row] = await db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Agent ${id} not found` } });
    }

    return { data: serializeAgent(row) };
  });

  // DELETE /api/agents/:id
  app.delete<{
    Params: { id: string };
  }>("/api/agents/:id", async (request, reply) => {
    const [row] = await db
      .delete(agents)
      .where(eq(agents.id, request.params.id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Agent ${request.params.id} not found` } });
    }

    return reply.status(204).send();
  });
}
