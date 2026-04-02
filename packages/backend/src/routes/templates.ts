import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/connection.js";
import { templates, workItems, projects } from "../db/schema.js";
import { createId } from "@agentops/shared";
import { getWorkflowInitialState } from "../agent/workflow-runtime.js";

// ── Routes ─────────────────────────────────────────────────────

export async function templateRoutes(app: FastifyInstance) {
  // GET /api/templates — list templates, optionally filter by type
  app.get<{
    Querystring: { type?: string };
  }>("/api/templates", async (request) => {
    const { type } = request.query;

    let rows;
    if (type) {
      rows = await db
        .select()
        .from(templates)
        .where(eq(templates.type, type))
        .orderBy(desc(templates.createdAt));
    } else {
      rows = await db
        .select()
        .from(templates)
        .orderBy(desc(templates.createdAt));
    }

    return {
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        description: r.description,
        content: r.content,
        isBuiltIn: r.isBuiltIn,
        createdAt: r.createdAt.toISOString(),
      })),
      total: rows.length,
    };
  });

  // POST /api/templates — create custom template
  app.post<{
    Body: {
      name: string;
      type: string;
      description?: string;
      content: Record<string, unknown>;
    };
  }>("/api/templates", async (request, reply) => {
    const { name, type, description, content } = request.body;

    if (!name || !type || !content) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "name, type, and content are required" },
      });
    }

    if (type !== "work_item" && type !== "persona") {
      return reply.status(400).send({
        error: { code: "INVALID_TYPE", message: "type must be 'work_item' or 'persona'" },
      });
    }

    const now = new Date();
    const id = createId.template();

    await db.insert(templates).values({
      id,
      name,
      type,
      description: description ?? "",
      content,
      isBuiltIn: false,
      createdAt: now,
    });

    return reply.status(201).send({
      data: {
        id,
        name,
        type,
        description: description ?? "",
        content,
        isBuiltIn: false,
        createdAt: now.toISOString(),
      },
    });
  });

  // PATCH /api/templates/:id — update template (guard built-in)
  app.patch<{
    Params: { id: string };
    Body: {
      name?: string;
      description?: string;
      content?: Record<string, unknown>;
    };
  }>("/api/templates/:id", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    const [existing] = await db.select().from(templates).where(eq(templates.id, id));
    if (!existing) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Template not found" } });
    }

    if (existing.isBuiltIn) {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Built-in templates cannot be modified" },
      });
    }

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.content !== undefined) updates.content = body.content;

    await db.update(templates).set(updates).where(eq(templates.id, id));

    const [updated] = await db.select().from(templates).where(eq(templates.id, id));

    return {
      data: {
        id: updated!.id,
        name: updated!.name,
        type: updated!.type,
        description: updated!.description,
        content: updated!.content,
        isBuiltIn: updated!.isBuiltIn,
        createdAt: updated!.createdAt.toISOString(),
      },
    };
  });

  // DELETE /api/templates/:id — delete template (guard built-in)
  app.delete<{ Params: { id: string } }>("/api/templates/:id", async (request, reply) => {
    const { id } = request.params;

    const [existing] = await db.select().from(templates).where(eq(templates.id, id));
    if (!existing) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Template not found" } });
    }

    if (existing.isBuiltIn) {
      return reply.status(403).send({
        error: { code: "FORBIDDEN", message: "Built-in templates cannot be deleted" },
      });
    }

    await db.delete(templates).where(eq(templates.id, id));
    return reply.status(204).send();
  });

  // POST /api/templates/:id/apply — create work item from template
  app.post<{
    Params: { id: string };
    Body: {
      projectId: string;
      parentId?: string;
      overrides?: {
        title?: string;
        description?: string;
        priority?: string;
        labels?: string[];
      };
    };
  }>("/api/templates/:id/apply", async (request, reply) => {
    const { id } = request.params;
    const { projectId, parentId, overrides } = request.body;

    if (!projectId) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "projectId is required" },
      });
    }

    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    if (!template) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Template not found" } });
    }

    if (template.type !== "work_item") {
      return reply.status(400).send({
        error: { code: "INVALID_TYPE", message: "Only work_item templates can be applied to create work items" },
      });
    }

    const content = template.content as {
      title?: string;
      description?: string;
      priority?: string;
      labels?: string[];
    };

    // Look up project's workflow to resolve initial state
    const [project] = await db.select({ workflowId: projects.workflowId }).from(projects).where(eq(projects.id, projectId));
    const projectWorkflowId = project?.workflowId ?? null;
    const initialState = await getWorkflowInitialState(projectWorkflowId);

    const now = new Date();
    const workItemId = createId.workItem();

    const [row] = await db
      .insert(workItems)
      .values({
        id: workItemId,
        parentId: parentId ?? null,
        projectId,
        title: overrides?.title ?? content.title ?? template.name,
        description: overrides?.description ?? content.description ?? "",
        context: {},
        currentState: initialState,
        workflowId: projectWorkflowId,
        priority: overrides?.priority ?? content.priority ?? "p2",
        labels: overrides?.labels ?? content.labels ?? [],
        assignedPersonaId: null,
        executionContext: [],
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return reply.status(201).send({
      data: {
        workItemId: row!.id,
        templateId: id,
        templateName: template.name,
      },
    });
  });
}
