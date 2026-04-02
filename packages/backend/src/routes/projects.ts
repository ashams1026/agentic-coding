import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { existsSync } from "node:fs";
import { db } from "../db/connection.js";
import { projects } from "../db/schema.js";
import { seedDefaultAgentsForProject } from "../db/default-agents.js";
import { createId } from "@agentops/shared";
import type {
  ProjectId,
  CreateProjectRequest,
  UpdateProjectRequest,
} from "@agentops/shared";

function toIso(d: Date): string {
  return d.toISOString();
}

function serializeProject(row: typeof projects.$inferSelect) {
  return {
    id: row.id as ProjectId,
    name: row.name,
    path: row.path,
    isGlobal: row.isGlobal,
    settings: row.settings,
    workflowId: row.workflowId ?? null,
    createdAt: toIso(row.createdAt),
  };
}

export async function projectRoutes(app: FastifyInstance) {
  // GET /api/projects
  app.get("/api/projects", async () => {
    const rows = await db.select().from(projects);
    return { data: rows.map(serializeProject), total: rows.length };
  });

  // GET /api/projects/:id
  app.get<{
    Params: { id: string };
  }>("/api/projects/:id", async (request, reply) => {
    const [row] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, request.params.id));

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Project ${request.params.id} not found` } });
    }

    return { data: serializeProject(row) };
  });

  // POST /api/projects
  app.post<{
    Body: CreateProjectRequest;
  }>("/api/projects", async (request, reply) => {
    const { name, path, settings } = request.body;

    if (!name || !name.trim()) {
      return reply.status(400).send({ error: { code: "VALIDATION", message: "Project name is required" } });
    }

    if (!path || !path.trim()) {
      return reply.status(400).send({ error: { code: "VALIDATION", message: "Project path is required" } });
    }

    // Validate path exists on disk
    if (!existsSync(path)) {
      return reply.status(400).send({ error: { code: "VALIDATION", message: `Path does not exist: ${path}` } });
    }

    const id = createId.project();
    const now = new Date();

    const [row] = await db
      .insert(projects)
      .values({
        id,
        name: name.trim(),
        path: path.trim(),
        settings: settings ?? {},
        createdAt: now,
      })
      .returning();

    // Seed default agents (if none exist) and create assignments for this project
    await seedDefaultAgentsForProject(id);

    return reply.status(201).send({ data: serializeProject(row!) });
  });

  // PATCH /api/projects/:id
  app.patch<{
    Params: { id: string };
    Body: UpdateProjectRequest;
  }>("/api/projects/:id", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    // Validate path if being updated
    if (body.path !== undefined && body.path.trim() && !existsSync(body.path)) {
      return reply.status(400).send({ error: { code: "VALIDATION", message: `Path does not exist: ${body.path}` } });
    }

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates["name"] = body.name.trim();
    if (body.path !== undefined) updates["path"] = body.path.trim();
    if (body.settings !== undefined) updates["settings"] = body.settings;

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: { code: "BAD_REQUEST", message: "No fields to update" } });
    }

    const [row] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Project ${id} not found` } });
    }

    return { data: serializeProject(row) };
  });

  // DELETE /api/projects/:id
  app.delete<{
    Params: { id: string };
  }>("/api/projects/:id", async (request, reply) => {
    // Guard: cannot delete the global project
    const [existing] = await db
      .select({ isGlobal: projects.isGlobal })
      .from(projects)
      .where(eq(projects.id, request.params.id));

    if (!existing) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Project ${request.params.id} not found` } });
    }

    if (existing.isGlobal) {
      return reply.status(409).send({ error: { code: "CONFLICT", message: "Cannot delete the global project" } });
    }

    await db.delete(projects).where(eq(projects.id, request.params.id));

    return reply.status(204).send();
  });
}
