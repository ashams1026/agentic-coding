import type { FastifyInstance } from "fastify";
import { queryAuditLog } from "../audit.js";

export async function auditRoutes(app: FastifyInstance) {
  // GET /api/audit — query the audit trail
  app.get<{
    Querystring: { workItemId?: string; limit?: string };
  }>("/api/audit", async (request) => {
    const { workItemId, limit: limitStr } = request.query;
    const limit = limitStr ? parseInt(limitStr, 10) : 50;

    const entries = queryAuditLog({
      workItemId,
      limit: isNaN(limit) ? 50 : Math.min(limit, 500),
    });

    return { data: entries, total: entries.length };
  });
}
