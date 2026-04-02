import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { agentAssignments } from "../db/schema.js";
import type {
  ProjectId,
  AgentId,
  UpsertAgentAssignmentRequest,
} from "@agentops/shared";

function serializeAssignment(row: typeof agentAssignments.$inferSelect) {
  return {
    projectId: row.projectId as ProjectId,
    stateName: row.stateName,
    agentId: row.agentId as AgentId,
  };
}

export async function agentAssignmentRoutes(app: FastifyInstance) {
  // GET /api/agent-assignments?projectId=
  app.get<{
    Querystring: { projectId?: string };
  }>("/api/agent-assignments", async (request) => {
    const { projectId } = request.query;

    let rows;
    if (projectId) {
      rows = await db
        .select()
        .from(agentAssignments)
        .where(eq(agentAssignments.projectId, projectId));
    } else {
      rows = await db.select().from(agentAssignments);
    }

    return { data: rows.map(serializeAssignment), total: rows.length };
  });

  // PUT /api/agent-assignments — upsert
  app.put<{
    Body: UpsertAgentAssignmentRequest;
  }>("/api/agent-assignments", async (request) => {
    const { projectId, stateName, agentId } = request.body;

    const [row] = await db
      .insert(agentAssignments)
      .values({ projectId, stateName, agentId })
      .onConflictDoUpdate({
        target: [agentAssignments.projectId, agentAssignments.stateName],
        set: { agentId },
      })
      .returning();

    return { data: serializeAssignment(row!) };
  });
}
