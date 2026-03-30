import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { executions, workItems } from "../db/schema.js";
import { createId } from "@agentops/shared";
import type {
  ExecutionId,
  WorkItemId,
  PersonaId,
  CreateExecutionRequest,
  UpdateExecutionRequest,
} from "@agentops/shared";

function toIso(d: Date): string {
  return d.toISOString();
}

function serializeExecution(row: typeof executions.$inferSelect) {
  return {
    id: row.id as ExecutionId,
    workItemId: row.workItemId as WorkItemId,
    personaId: row.personaId as PersonaId,
    status: row.status,
    startedAt: toIso(row.startedAt),
    completedAt: row.completedAt ? toIso(row.completedAt) : null,
    costUsd: row.costUsd,
    durationMs: row.durationMs,
    summary: row.summary,
    outcome: row.outcome,
    rejectionPayload: row.rejectionPayload ?? null,
    logs: row.logs,
  };
}

export async function executionRoutes(app: FastifyInstance) {
  // GET /api/executions — list with optional workItemId or projectId filter
  app.get<{
    Querystring: { workItemId?: string; projectId?: string };
  }>("/api/executions", async (request) => {
    const { workItemId, projectId } = request.query;

    let rows;
    if (workItemId) {
      rows = await db
        .select()
        .from(executions)
        .where(eq(executions.workItemId, workItemId));
    } else {
      rows = await db.select().from(executions);
    }

    if (projectId && !workItemId) {
      const projectWorkItems = await db.select().from(workItems).where(eq(workItems.projectId, projectId));
      const workItemIds = new Set(projectWorkItems.map((w) => w.id));
      rows = rows.filter((r) => workItemIds.has(r.workItemId));
    }

    return { data: rows.map(serializeExecution), total: rows.length };
  });

  // GET /api/executions/:id
  app.get<{
    Params: { id: string };
  }>("/api/executions/:id", async (request, reply) => {
    const { id } = request.params;

    const [row] = await db
      .select()
      .from(executions)
      .where(eq(executions.id, id));

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Execution ${id} not found` } });
    }

    return { data: serializeExecution(row) };
  });

  // POST /api/executions
  app.post<{
    Body: CreateExecutionRequest;
  }>("/api/executions", async (request, reply) => {
    const body = request.body;
    const id = createId.execution();

    const [row] = await db
      .insert(executions)
      .values({
        id,
        workItemId: body.workItemId,
        personaId: body.personaId,
        status: "pending",
        startedAt: new Date(),
        completedAt: null,
        costUsd: 0,
        durationMs: 0,
        summary: "",
        outcome: null,
        rejectionPayload: null,
        logs: "",
      })
      .returning();

    return reply.status(201).send({ data: serializeExecution(row!) });
  });

  // PATCH /api/executions/:id
  app.patch<{
    Params: { id: string };
    Body: UpdateExecutionRequest;
  }>("/api/executions/:id", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) updates["status"] = body.status;
    if (body.completedAt !== undefined) updates["completedAt"] = body.completedAt ? new Date(body.completedAt) : null;
    if (body.costUsd !== undefined) updates["costUsd"] = body.costUsd;
    if (body.durationMs !== undefined) updates["durationMs"] = body.durationMs;
    if (body.summary !== undefined) updates["summary"] = body.summary;
    if (body.outcome !== undefined) updates["outcome"] = body.outcome;
    if (body.rejectionPayload !== undefined) updates["rejectionPayload"] = body.rejectionPayload;
    if (body.logs !== undefined) updates["logs"] = body.logs;

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: { code: "BAD_REQUEST", message: "No fields to update" } });
    }

    const [row] = await db
      .update(executions)
      .set(updates)
      .where(eq(executions.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Execution ${id} not found` } });
    }

    return { data: serializeExecution(row) };
  });

  // DELETE /api/executions/:id
  app.delete<{
    Params: { id: string };
  }>("/api/executions/:id", async (request, reply) => {
    const [row] = await db
      .delete(executions)
      .where(eq(executions.id, request.params.id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Execution ${request.params.id} not found` } });
    }

    return reply.status(204).send();
  });
}
