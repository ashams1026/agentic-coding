import type { FastifyInstance } from "fastify";
import { eq, sql, and, gte } from "drizzle-orm";
import { db } from "../db/connection.js";
import { executions, personas } from "../db/schema.js";

// ── Helpers ──────────────────────────────────────────────────────

function getRangeStart(range: string): Date {
  const now = new Date();
  switch (range) {
    case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

// ── Routes ───────────────────────────────────────────────────────

export async function analyticsRoutes(app: FastifyInstance) {
  // GET /api/analytics/cost-by-persona — cost breakdown by persona
  app.get<{
    Querystring: { projectId?: string; range?: string };
  }>("/api/analytics/cost-by-persona", async (request) => {
    const { projectId, range } = request.query;
    const rangeStart = getRangeStart(range ?? "30d");

    const conditions = [
      gte(executions.startedAt, rangeStart),
      eq(executions.status, "completed"),
    ];
    if (projectId) conditions.push(eq(executions.projectId, projectId));

    const rows = await db
      .select({
        personaId: executions.personaId,
        personaName: personas.name,
        totalCostCents: sql<number>`SUM(${executions.costUsd})`,
        totalTokens: sql<number>`SUM(${executions.totalTokens})`,
        executionCount: sql<number>`COUNT(*)`,
      })
      .from(executions)
      .leftJoin(personas, eq(executions.personaId, personas.id))
      .where(and(...conditions))
      .groupBy(executions.personaId);

    return {
      data: rows.map((r) => ({
        personaId: r.personaId,
        personaName: r.personaName ?? "Unknown",
        costUsd: (r.totalCostCents ?? 0) / 100,
        totalTokens: r.totalTokens ?? 0,
        executionCount: r.executionCount ?? 0,
      })),
    };
  });

  // GET /api/analytics/cost-by-model — cost breakdown by model
  app.get<{
    Querystring: { projectId?: string; range?: string };
  }>("/api/analytics/cost-by-model", async (request) => {
    const { projectId, range } = request.query;
    const rangeStart = getRangeStart(range ?? "30d");

    const conditions = [
      gte(executions.startedAt, rangeStart),
      eq(executions.status, "completed"),
    ];
    if (projectId) conditions.push(eq(executions.projectId, projectId));

    const rows = await db
      .select({
        model: executions.model,
        totalCostCents: sql<number>`SUM(${executions.costUsd})`,
        totalTokens: sql<number>`SUM(${executions.totalTokens})`,
        executionCount: sql<number>`COUNT(*)`,
      })
      .from(executions)
      .where(and(...conditions))
      .groupBy(executions.model);

    return {
      data: rows.map((r) => ({
        model: r.model ?? "unknown",
        costUsd: (r.totalCostCents ?? 0) / 100,
        totalTokens: r.totalTokens ?? 0,
        executionCount: r.executionCount ?? 0,
      })),
    };
  });

  // GET /api/analytics/tokens-over-time — daily token totals
  app.get<{
    Querystring: { projectId?: string; range?: string };
  }>("/api/analytics/tokens-over-time", async (request) => {
    const { projectId, range } = request.query;
    const rangeStart = getRangeStart(range ?? "7d");

    const conditions = [
      gte(executions.startedAt, rangeStart),
      eq(executions.status, "completed"),
    ];
    if (projectId) conditions.push(eq(executions.projectId, projectId));

    const rows = await db
      .select({
        date: sql<string>`DATE(${executions.startedAt} / 1000, 'unixepoch')`,
        totalTokens: sql<number>`SUM(${executions.totalTokens})`,
        totalCostCents: sql<number>`SUM(${executions.costUsd})`,
        executionCount: sql<number>`COUNT(*)`,
      })
      .from(executions)
      .where(and(...conditions))
      .groupBy(sql`DATE(${executions.startedAt} / 1000, 'unixepoch')`)
      .orderBy(sql`DATE(${executions.startedAt} / 1000, 'unixepoch')`);

    return {
      data: rows.map((r) => ({
        date: r.date,
        totalTokens: r.totalTokens ?? 0,
        costUsd: (r.totalCostCents ?? 0) / 100,
        executionCount: r.executionCount ?? 0,
      })),
    };
  });

  // GET /api/analytics/top-executions — most expensive executions
  app.get<{
    Querystring: { projectId?: string; limit?: string; range?: string };
  }>("/api/analytics/top-executions", async (request) => {
    const { projectId, limit: limitStr, range } = request.query;
    const limit = Math.min(parseInt(limitStr ?? "10", 10) || 10, 50);
    const rangeStart = getRangeStart(range ?? "30d");

    const conditions = [
      gte(executions.startedAt, rangeStart),
      eq(executions.status, "completed"),
    ];
    if (projectId) conditions.push(eq(executions.projectId, projectId));

    const rows = await db
      .select({
        id: executions.id,
        personaId: executions.personaId,
        personaName: personas.name,
        model: executions.model,
        costCents: executions.costUsd,
        totalTokens: executions.totalTokens,
        toolUses: executions.toolUses,
        durationMs: executions.durationMs,
        startedAt: executions.startedAt,
      })
      .from(executions)
      .leftJoin(personas, eq(executions.personaId, personas.id))
      .where(and(...conditions))
      .orderBy(sql`${executions.costUsd} DESC`)
      .limit(limit);

    return {
      data: rows.map((r) => ({
        id: r.id,
        personaId: r.personaId,
        personaName: r.personaName ?? "Unknown",
        model: r.model ?? "unknown",
        costUsd: (r.costCents ?? 0) / 100,
        totalTokens: r.totalTokens ?? 0,
        toolUses: r.toolUses ?? 0,
        durationMs: r.durationMs,
        startedAt: r.startedAt?.toISOString() ?? null,
      })),
    };
  });
}
