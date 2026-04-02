import type { FastifyInstance } from "fastify";
import { eq, or, isNull } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workflows, workflowStates, workflowTransitions, workItems } from "../db/schema.js";
import { createId } from "@agentops/shared";
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

  // ── Builder CRUD Endpoints ──────────────────────────────────

  // POST /api/workflows — create new draft workflow
  app.post<{
    Body: { name: string; description?: string; scope?: string; projectId?: string };
  }>("/api/workflows", async (request, reply) => {
    const { name, description, scope, projectId } = request.body;
    const now = new Date();
    const id = createId.workflow();

    const [row] = await db.insert(workflows).values({
      id,
      name: name.trim(),
      description: description ?? "",
      scope: scope ?? "global",
      projectId: projectId ?? null,
      version: 1,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return reply.status(201).send({ data: serializeWorkflow(row!) });
  });

  // PATCH /api/workflows/:id — update workflow (states/transitions replaced in bulk)
  app.patch<{
    Params: { id: string };
    Body: {
      name?: string;
      description?: string;
      states?: Array<{ id?: string; name: string; type: string; color: string; personaId?: string; sortOrder: number }>;
      transitions?: Array<{ id?: string; fromStateId: string; toStateId: string; label?: string; sortOrder: number }>;
    };
  }>("/api/workflows/:id", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    const [existing] = await db.select().from(workflows).where(eq(workflows.id, id));
    if (!existing) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Workflow ${id} not found` } });
    }

    const now = new Date();
    const updates: Record<string, unknown> = { updatedAt: now };
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description;

    await db.update(workflows).set(updates).where(eq(workflows.id, id));

    // Replace states if provided
    if (body.states) {
      await db.delete(workflowStates).where(eq(workflowStates.workflowId, id));
      for (const s of body.states) {
        await db.insert(workflowStates).values({
          id: s.id ?? createId.workflowState(),
          workflowId: id,
          name: s.name,
          type: s.type,
          color: s.color,
          personaId: s.personaId ?? null,
          sortOrder: s.sortOrder,
        });
      }
    }

    // Replace transitions if provided
    if (body.transitions) {
      await db.delete(workflowTransitions).where(eq(workflowTransitions.workflowId, id));
      for (const t of body.transitions) {
        await db.insert(workflowTransitions).values({
          id: t.id ?? createId.workflowTransition(),
          workflowId: id,
          fromStateId: t.fromStateId,
          toStateId: t.toStateId,
          label: t.label ?? "",
          sortOrder: t.sortOrder,
        });
      }
    }

    // Re-fetch full workflow
    const [updated] = await db.select().from(workflows).where(eq(workflows.id, id));
    return { data: serializeWorkflow(updated!) };
  });

  // POST /api/workflows/:id/publish — mark workflow as published
  app.post<{
    Params: { id: string };
  }>("/api/workflows/:id/publish", async (request, reply) => {
    const { id } = request.params;

    const [row] = await db
      .update(workflows)
      .set({ isPublished: true, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Workflow ${id} not found` } });
    }

    return { data: serializeWorkflow(row) };
  });

  // DELETE /api/workflows/:id — archive workflow (only if no work items use it)
  app.delete<{
    Params: { id: string };
  }>("/api/workflows/:id", async (request, reply) => {
    const { id } = request.params;

    // Check if any work items use this workflow
    const items = await db
      .select({ id: workItems.id })
      .from(workItems)
      .where(eq(workItems.workflowId, id))
      .limit(1);

    if (items.length > 0) {
      return reply.status(409).send({
        error: { code: "CONFLICT", message: "Cannot delete workflow with active work items" },
      });
    }

    // Delete transitions, states, then workflow
    await db.delete(workflowTransitions).where(eq(workflowTransitions.workflowId, id));
    await db.delete(workflowStates).where(eq(workflowStates.workflowId, id));
    const [deleted] = await db.delete(workflows).where(eq(workflows.id, id)).returning();

    if (!deleted) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Workflow ${id} not found` } });
    }

    return reply.status(204).send();
  });

  // POST /api/workflows/:id/clone — deep copy workflow
  app.post<{
    Params: { id: string };
    Body: { name?: string };
  }>("/api/workflows/:id/clone", async (request, reply) => {
    const { id } = request.params;
    const { name } = request.body ?? {};

    const [source] = await db.select().from(workflows).where(eq(workflows.id, id));
    if (!source) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Workflow ${id} not found` } });
    }

    const now = new Date();
    const newId = createId.workflow();

    // Clone workflow
    await db.insert(workflows).values({
      id: newId,
      name: name ?? `${source.name} (copy)`,
      description: source.description,
      scope: source.scope,
      projectId: source.projectId,
      version: 1,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    });

    // Clone states with ID mapping
    const sourceStates = await db.select().from(workflowStates).where(eq(workflowStates.workflowId, id));
    const stateIdMap = new Map<string, string>();
    for (const s of sourceStates) {
      const newStateId = createId.workflowState();
      stateIdMap.set(s.id, newStateId);
      await db.insert(workflowStates).values({
        id: newStateId,
        workflowId: newId,
        name: s.name,
        type: s.type,
        color: s.color,
        personaId: s.personaId,
        sortOrder: s.sortOrder,
      });
    }

    // Clone transitions with remapped state IDs
    const sourceTransitions = await db.select().from(workflowTransitions).where(eq(workflowTransitions.workflowId, id));
    for (const t of sourceTransitions) {
      await db.insert(workflowTransitions).values({
        id: createId.workflowTransition(),
        workflowId: newId,
        fromStateId: stateIdMap.get(t.fromStateId) ?? t.fromStateId,
        toStateId: stateIdMap.get(t.toStateId) ?? t.toStateId,
        label: t.label,
        sortOrder: t.sortOrder,
      });
    }

    const [cloned] = await db.select().from(workflows).where(eq(workflows.id, newId));
    return reply.status(201).send({ data: serializeWorkflow(cloned!) });
  });

  // POST /api/workflows/:id/validate — check for unreachable states, missing initial/terminal
  app.post<{
    Params: { id: string };
  }>("/api/workflows/:id/validate", async (request, reply) => {
    const { id } = request.params;

    const states = await db.select().from(workflowStates).where(eq(workflowStates.workflowId, id));
    const transitions = await db.select().from(workflowTransitions).where(eq(workflowTransitions.workflowId, id));

    if (states.length === 0) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Workflow ${id} not found or has no states` } });
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for initial state
    const initialStates = states.filter((s) => s.type === "initial");
    if (initialStates.length === 0) errors.push("No initial state defined");
    if (initialStates.length > 1) warnings.push(`Multiple initial states: ${initialStates.map((s) => s.name).join(", ")}`);

    // Check for terminal state
    const terminalStates = states.filter((s) => s.type === "terminal");
    if (terminalStates.length === 0) errors.push("No terminal state defined");

    // Check for unreachable states (no incoming transitions except initial)
    const statesWithIncoming = new Set(transitions.map((t) => t.toStateId));
    for (const s of states) {
      if (s.type !== "initial" && !statesWithIncoming.has(s.id)) {
        warnings.push(`State "${s.name}" is unreachable (no incoming transitions)`);
      }
    }

    // Check for dead-end states (no outgoing transitions except terminal)
    const statesWithOutgoing = new Set(transitions.map((t) => t.fromStateId));
    for (const s of states) {
      if (s.type !== "terminal" && !statesWithOutgoing.has(s.id)) {
        warnings.push(`State "${s.name}" is a dead-end (no outgoing transitions)`);
      }
    }

    return {
      data: {
        valid: errors.length === 0,
        errors,
        warnings,
        stateCount: states.length,
        transitionCount: transitions.length,
      },
    };
  });
}
