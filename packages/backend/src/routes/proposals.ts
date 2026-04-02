import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { proposals, workItems } from "../db/schema.js";
import { broadcastNotification } from "../ws.js";
import { createId } from "@agentops/shared";
import type {
  ProposalId,
  ExecutionId,
  WorkItemId,
  CreateProposalRequest,
  UpdateProposalRequest,
} from "@agentops/shared";

function toIso(d: Date): string {
  return d.toISOString();
}

function serializeProposal(row: typeof proposals.$inferSelect) {
  return {
    id: row.id as ProposalId,
    executionId: row.executionId as ExecutionId,
    workItemId: row.workItemId as WorkItemId,
    type: row.type,
    payload: row.payload,
    status: row.status,
    createdAt: toIso(row.createdAt),
  };
}

export async function proposalRoutes(app: FastifyInstance) {
  // GET /api/proposals — list with optional workItemId or projectId filter
  app.get<{
    Querystring: { workItemId?: string; projectId?: string };
  }>("/api/proposals", async (request) => {
    const { workItemId, projectId } = request.query;

    let rows;
    if (workItemId) {
      rows = await db
        .select()
        .from(proposals)
        .where(eq(proposals.workItemId, workItemId));
    } else {
      rows = await db.select().from(proposals);
    }

    if (projectId && !workItemId) {
      const projectWorkItems = await db.select().from(workItems).where(eq(workItems.projectId, projectId));
      const workItemIds = new Set(projectWorkItems.map((w) => w.id));
      rows = rows.filter((r) => workItemIds.has(r.workItemId));
    }

    return { data: rows.map(serializeProposal), total: rows.length };
  });

  // GET /api/proposals/:id
  app.get<{
    Params: { id: string };
  }>("/api/proposals/:id", async (request, reply) => {
    const { id } = request.params;

    const [row] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, id));

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Proposal ${id} not found` } });
    }

    return { data: serializeProposal(row) };
  });

  // POST /api/proposals
  app.post<{
    Body: CreateProposalRequest;
  }>("/api/proposals", async (request, reply) => {
    const body = request.body;
    const id = createId.proposal();

    const [row] = await db
      .insert(proposals)
      .values({
        id,
        executionId: body.executionId,
        workItemId: body.workItemId,
        type: body.type,
        payload: body.payload ?? {},
        status: "pending",
        createdAt: new Date(),
      })
      .returning();

    // Emit notification for review_request proposals
    if (body.type === "review_request") {
      broadcastNotification({
        type: "proposal_needs_approval",
        priority: "critical",
        title: "Proposal needs approval",
        description: `Review request for work item ${body.workItemId}`,
        workItemId: body.workItemId,
        executionId: body.executionId,
      });
    }

    return reply.status(201).send({ data: serializeProposal(row!) });
  });

  // PATCH /api/proposals/:id
  app.patch<{
    Params: { id: string };
    Body: UpdateProposalRequest;
  }>("/api/proposals/:id", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) updates["status"] = body.status;

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: { code: "BAD_REQUEST", message: "No fields to update" } });
    }

    const [row] = await db
      .update(proposals)
      .set(updates)
      .where(eq(proposals.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Proposal ${id} not found` } });
    }

    return { data: serializeProposal(row) };
  });

  // DELETE /api/proposals/:id
  app.delete<{
    Params: { id: string };
  }>("/api/proposals/:id", async (request, reply) => {
    const [row] = await db
      .delete(proposals)
      .where(eq(proposals.id, request.params.id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Proposal ${request.params.id} not found` } });
    }

    return reply.status(204).send();
  });
}
