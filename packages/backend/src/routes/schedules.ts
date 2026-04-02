import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/connection.js";
import { schedules, agents } from "../db/schema.js";
import { createId } from "@agentops/shared";
import { getNextRunTime } from "../scheduling/scheduler.js";
import { executionManager } from "../agent/setup.js";
import { logger } from "../logger.js";

// ── Cron validation ────────────────────────────────────────────

function isValidCron(expression: string): boolean {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const ranges = [
    { min: 0, max: 59 }, // minute
    { min: 0, max: 23 }, // hour
    { min: 1, max: 31 }, // day of month
    { min: 1, max: 12 }, // month
    { min: 0, max: 6 },  // day of week
  ];

  for (let i = 0; i < 5; i++) {
    const field = parts[i]!;
    const range = ranges[i]!;

    if (field === "*") continue;

    // Step: */N
    if (field.startsWith("*/")) {
      const step = parseInt(field.slice(2), 10);
      if (isNaN(step) || step < 1 || step > range.max) return false;
      continue;
    }

    // Comma-separated values
    const subParts = field.split(",");
    for (const sub of subParts) {
      if (sub.includes("-")) {
        const [startStr, endStr] = sub.split("-");
        const start = parseInt(startStr!, 10);
        const end = parseInt(endStr!, 10);
        if (isNaN(start) || isNaN(end) || start < range.min || end > range.max || start > end) return false;
      } else {
        const val = parseInt(sub, 10);
        if (isNaN(val) || val < range.min || val > range.max) return false;
      }
    }
  }

  return true;
}

// ── Routes ─────────────────────────────────────────────────────

export async function scheduleRoutes(app: FastifyInstance) {
  // GET /api/schedules — list all schedules with agent name
  app.get("/api/schedules", async () => {
    const rows = await db
      .select({
        id: schedules.id,
        name: schedules.name,
        agentId: schedules.agentId,
        agentName: agents.name,
        projectId: schedules.projectId,
        cronExpression: schedules.cronExpression,
        promptTemplate: schedules.promptTemplate,
        isActive: schedules.isActive,
        lastRunAt: schedules.lastRunAt,
        nextRunAt: schedules.nextRunAt,
        consecutiveFailures: schedules.consecutiveFailures,
        createdAt: schedules.createdAt,
      })
      .from(schedules)
      .leftJoin(agents, eq(schedules.agentId, agents.id))
      .orderBy(desc(schedules.createdAt));

    return {
      data: rows.map((r) => ({
        ...r,
        lastRunAt: r.lastRunAt?.toISOString() ?? null,
        nextRunAt: r.nextRunAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total: rows.length,
    };
  });

  // POST /api/schedules — create schedule
  app.post<{
    Body: {
      name: string;
      agentId: string;
      projectId?: string;
      cronExpression: string;
      promptTemplate?: string;
    };
  }>("/api/schedules", async (request, reply) => {
    const { name, agentId, projectId, cronExpression, promptTemplate } = request.body;

    if (!name || !agentId || !cronExpression) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "name, agentId, and cronExpression are required" },
      });
    }

    if (!isValidCron(cronExpression)) {
      return reply.status(400).send({
        error: { code: "INVALID_CRON", message: `Invalid cron expression: "${cronExpression}". Expected 5 fields: minute hour day-of-month month day-of-week.` },
      });
    }

    // Verify agent exists
    const [agent] = await db.select({ id: agents.id }).from(agents).where(eq(agents.id, agentId));
    if (!agent) {
      return reply.status(400).send({
        error: { code: "INVALID_AGENT", message: `Agent "${agentId}" not found` },
      });
    }

    const now = new Date();
    const id = createId.schedule();
    const nextRun = getNextRunTime(cronExpression, now);

    await db.insert(schedules).values({
      id,
      name,
      agentId,
      projectId: projectId ?? "pj-global",
      cronExpression,
      promptTemplate: promptTemplate ?? "",
      isActive: true,
      lastRunAt: null,
      nextRunAt: nextRun,
      consecutiveFailures: 0,
      createdAt: now,
    });

    return reply.status(201).send({
      data: {
        id,
        name,
        agentId,
        agentName: null,
        projectId: projectId ?? "pj-global",
        cronExpression,
        promptTemplate: promptTemplate ?? "",
        isActive: true,
        lastRunAt: null,
        nextRunAt: nextRun?.toISOString() ?? null,
        consecutiveFailures: 0,
        createdAt: now.toISOString(),
      },
    });
  });

  // PATCH /api/schedules/:id — update schedule
  app.patch<{
    Params: { id: string };
    Body: {
      name?: string;
      cronExpression?: string;
      promptTemplate?: string;
      isActive?: boolean;
      projectId?: string | null;
    };
  }>("/api/schedules/:id", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    const [existing] = await db.select().from(schedules).where(eq(schedules.id, id));
    if (!existing) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Schedule not found" } });
    }

    // Validate cron if being updated
    if (body.cronExpression !== undefined && !isValidCron(body.cronExpression)) {
      return reply.status(400).send({
        error: { code: "INVALID_CRON", message: `Invalid cron expression: "${body.cronExpression}"` },
      });
    }

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.cronExpression !== undefined) updates.cronExpression = body.cronExpression;
    if (body.promptTemplate !== undefined) updates.promptTemplate = body.promptTemplate;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.projectId !== undefined) updates.projectId = body.projectId ?? "pj-global";

    // Recompute nextRunAt if cron changed or schedule re-enabled
    if (body.cronExpression !== undefined || body.isActive === true) {
      const cron = body.cronExpression ?? existing.cronExpression;
      updates.nextRunAt = getNextRunTime(cron, new Date());
    }

    // Reset consecutive failures when re-enabling
    if (body.isActive === true && !existing.isActive) {
      updates.consecutiveFailures = 0;
    }

    await db.update(schedules).set(updates).where(eq(schedules.id, id));

    // Fetch updated record with agent name
    const [updated] = await db
      .select({
        id: schedules.id,
        name: schedules.name,
        agentId: schedules.agentId,
        agentName: agents.name,
        projectId: schedules.projectId,
        cronExpression: schedules.cronExpression,
        promptTemplate: schedules.promptTemplate,
        isActive: schedules.isActive,
        lastRunAt: schedules.lastRunAt,
        nextRunAt: schedules.nextRunAt,
        consecutiveFailures: schedules.consecutiveFailures,
        createdAt: schedules.createdAt,
      })
      .from(schedules)
      .leftJoin(agents, eq(schedules.agentId, agents.id))
      .where(eq(schedules.id, id));

    return {
      data: {
        ...updated,
        lastRunAt: updated!.lastRunAt?.toISOString() ?? null,
        nextRunAt: updated!.nextRunAt?.toISOString() ?? null,
        createdAt: updated!.createdAt.toISOString(),
      },
    };
  });

  // DELETE /api/schedules/:id
  app.delete<{ Params: { id: string } }>("/api/schedules/:id", async (request, reply) => {
    const { id } = request.params;

    const [existing] = await db.select({ id: schedules.id }).from(schedules).where(eq(schedules.id, id));
    if (!existing) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Schedule not found" } });
    }

    await db.delete(schedules).where(eq(schedules.id, id));
    return reply.status(204).send();
  });

  // POST /api/schedules/:id/run-now — manual trigger
  app.post<{ Params: { id: string } }>("/api/schedules/:id/run-now", async (request, reply) => {
    const { id } = request.params;

    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    if (!schedule) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Schedule not found" } });
    }

    try {
      const executionId = await executionManager.runExecution(
        null as any, // standalone schedule execution — no work item
        schedule.agentId,
      );

      // Update lastRunAt + compute nextRunAt
      const now = new Date();
      const nextRun = getNextRunTime(schedule.cronExpression, now);
      await db.update(schedules).set({
        lastRunAt: now,
        nextRunAt: nextRun,
      }).where(eq(schedules.id, id));

      logger.info({ scheduleId: id, executionId }, "Schedule manually triggered");

      return reply.status(201).send({
        data: {
          executionId,
          scheduleId: id,
          timestamp: now.toISOString(),
        },
      });
    } catch (err) {
      logger.error({ err, scheduleId: id }, "Manual schedule trigger failed");
      return reply.status(500).send({
        error: { code: "EXECUTION_FAILED", message: "Failed to spawn execution" },
      });
    }
  });
}
