import type { FastifyInstance } from "fastify";
import { eq, or, isNull } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workflows, workflowStates, workflowTransitions } from "../db/schema.js";
import type { ProjectId, PersonaId } from "@agentops/shared";

// ── Serialization ───────────────────────────────────────────────

function toIso(d: Date): string {
  return d.toISOString();
}

function serializeWorkflow(row: typeof workflows.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    scope: row.scope as "global" | "project",
    projectId: (row.projectId as ProjectId) ?? null,
    version: row.version,
    isPublished: row.isPublished,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function serializeState(row: typeof workflowStates.$inferSelect) {
  return {
    id: row.id,
    workflowId: row.workflowId,
    name: row.name,
    type: row.type as "initial" | "intermediate" | "terminal",
    color: row.color,
    personaId: (row.personaId as PersonaId) ?? null,
    sortOrder: row.sortOrder,
  };
}

function serializeTransition(row: typeof workflowTransitions.$inferSelect) {
  return {
    id: row.id,
    workflowId: row.workflowId,
    fromStateId: row.fromStateId,
    toStateId: row.toStateId,
    label: row.label,
    sortOrder: row.sortOrder,
  };
}

// ── Routes ──────────────────────────────────────────────────────

export async function workflowRoutes(app: FastifyInstance) {
  // GET /api/workflows — list workflows (global + project-scoped)
  app.get<{
    Querystring: { projectId?: string; scope?: string };
  }>("/api/workflows", async (request) => {
    const { projectId, scope } = request.query;

    let rows;
    if (projectId) {
      // Return global workflows + workflows scoped to this project
      rows = await db
        .select()
        .from(workflows)
        .where(or(isNull(workflows.projectId), eq(workflows.projectId, projectId)));
    } else if (scope === "global") {
      rows = await db
        .select()
        .from(workflows)
        .where(isNull(workflows.projectId));
    } else {
      rows = await db.select().from(workflows);
    }

    return { data: rows.map(serializeWorkflow), total: rows.length };
  });

  // GET /api/workflows/:id — get workflow with states + transitions
  app.get<{
    Params: { id: string };
  }>("/api/workflows/:id", async (request, reply) => {
    const { id } = request.params;

    const [row] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, id));

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Workflow ${id} not found` } });
    }

    const states = await db
      .select()
      .from(workflowStates)
      .where(eq(workflowStates.workflowId, id))
      .orderBy(workflowStates.sortOrder);

    const transitions = await db
      .select()
      .from(workflowTransitions)
      .where(eq(workflowTransitions.workflowId, id))
      .orderBy(workflowTransitions.sortOrder);

    return {
      data: {
        ...serializeWorkflow(row),
        states: states.map(serializeState),
        transitions: transitions.map(serializeTransition),
      },
    };
  });

  // GET /api/workflows/:id/states — list workflow states
  app.get<{
    Params: { id: string };
  }>("/api/workflows/:id/states", async (request, reply) => {
    const { id } = request.params;

    const [wf] = await db.select({ id: workflows.id }).from(workflows).where(eq(workflows.id, id));
    if (!wf) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Workflow ${id} not found` } });
    }

    const rows = await db
      .select()
      .from(workflowStates)
      .where(eq(workflowStates.workflowId, id))
      .orderBy(workflowStates.sortOrder);

    return { data: rows.map(serializeState), total: rows.length };
  });

  // GET /api/workflows/:id/transitions — list workflow transitions
  app.get<{
    Params: { id: string };
  }>("/api/workflows/:id/transitions", async (request, reply) => {
    const { id } = request.params;

    const [wf] = await db.select({ id: workflows.id }).from(workflows).where(eq(workflows.id, id));
    if (!wf) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Workflow ${id} not found` } });
    }

    const rows = await db
      .select()
      .from(workflowTransitions)
      .where(eq(workflowTransitions.workflowId, id))
      .orderBy(workflowTransitions.sortOrder);

    return { data: rows.map(serializeTransition), total: rows.length };
  });
}
