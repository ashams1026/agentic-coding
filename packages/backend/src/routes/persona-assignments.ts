import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { personaAssignments } from "../db/schema.js";
import type {
  ProjectId,
  PersonaId,
  UpsertPersonaAssignmentRequest,
} from "@agentops/shared";

function serializeAssignment(row: typeof personaAssignments.$inferSelect) {
  return {
    projectId: row.projectId as ProjectId,
    stateName: row.stateName,
    personaId: row.personaId as PersonaId,
  };
}

export async function personaAssignmentRoutes(app: FastifyInstance) {
  // GET /api/persona-assignments?projectId=
  app.get<{
    Querystring: { projectId?: string };
  }>("/api/persona-assignments", async (request) => {
    const { projectId } = request.query;

    let rows;
    if (projectId) {
      rows = await db
        .select()
        .from(personaAssignments)
        .where(eq(personaAssignments.projectId, projectId));
    } else {
      rows = await db.select().from(personaAssignments);
    }

    return { data: rows.map(serializeAssignment), total: rows.length };
  });

  // PUT /api/persona-assignments — upsert
  app.put<{
    Body: UpsertPersonaAssignmentRequest;
  }>("/api/persona-assignments", async (request) => {
    const { projectId, stateName, personaId } = request.body;

    const [row] = await db
      .insert(personaAssignments)
      .values({ projectId, stateName, personaId })
      .onConflictDoUpdate({
        target: [personaAssignments.projectId, personaAssignments.stateName],
        set: { personaId },
      })
      .returning();

    return { data: serializeAssignment(row!) };
  });
}
