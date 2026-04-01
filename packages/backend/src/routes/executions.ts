import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { RewindFilesResult } from "@anthropic-ai/claude-agent-sdk";
import { db } from "../db/connection.js";
import { executions, workItems, comments, projects } from "../db/schema.js";
import { createId } from "@agentops/shared";
import type {
  ExecutionId,
  WorkItemId,
  PersonaId,
  CreateExecutionRequest,
  UpdateExecutionRequest,
} from "@agentops/shared";
import { loadConfig } from "../config.js";
import { logger } from "../logger.js";
import { auditStateTransition } from "../audit.js";

function toIso(d: Date): string {
  return d.toISOString();
}

function serializeExecution(row: typeof executions.$inferSelect) {
  return {
    id: row.id as ExecutionId,
    workItemId: row.workItemId as WorkItemId,
    personaId: row.personaId as PersonaId,
    status: row.status,
    startedAt: toIso(row.startedAt),
    completedAt: row.completedAt ? toIso(row.completedAt) : null,
    costUsd: row.costUsd / 100, // cents → dollars
    durationMs: row.durationMs,
    summary: row.summary,
    outcome: row.outcome,
    rejectionPayload: row.rejectionPayload ?? null,
    logs: row.logs,
    checkpointMessageId: row.checkpointMessageId ?? null,
    structuredOutput: row.structuredOutput ?? null,
    parentExecutionId: row.parentExecutionId ?? null,
  };
}

export async function executionRoutes(app: FastifyInstance) {
  // GET /api/executions — list with optional workItemId or projectId filter
  app.get<{
    Querystring: { workItemId?: string; projectId?: string };
  }>("/api/executions", async (request) => {
    const { workItemId, projectId } = request.query;

    let rows;
    if (workItemId) {
      rows = await db
        .select()
        .from(executions)
        .where(eq(executions.workItemId, workItemId));
    } else {
      rows = await db.select().from(executions);
    }

    if (projectId && !workItemId) {
      const projectWorkItems = await db.select().from(workItems).where(eq(workItems.projectId, projectId));
      const workItemIds = new Set(projectWorkItems.map((w) => w.id));
      rows = rows.filter((r) => workItemIds.has(r.workItemId));
    }

    return { data: rows.map(serializeExecution), total: rows.length };
  });

  // GET /api/executions/:id
  app.get<{
    Params: { id: string };
  }>("/api/executions/:id", async (request, reply) => {
    const { id } = request.params;

    const [row] = await db
      .select()
      .from(executions)
      .where(eq(executions.id, id));

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Execution ${id} not found` } });
    }

    return { data: serializeExecution(row) };
  });

  // POST /api/executions
  app.post<{
    Body: CreateExecutionRequest;
  }>("/api/executions", async (request, reply) => {
    const body = request.body;
    const id = createId.execution();

    const [row] = await db
      .insert(executions)
      .values({
        id,
        workItemId: body.workItemId,
        personaId: body.personaId,
        status: "pending",
        startedAt: new Date(),
        completedAt: null,
        costUsd: 0,
        durationMs: 0,
        summary: "",
        outcome: null,
        rejectionPayload: null,
        logs: "",
      })
      .returning();

    return reply.status(201).send({ data: serializeExecution(row!) });
  });

  // PATCH /api/executions/:id
  app.patch<{
    Params: { id: string };
    Body: UpdateExecutionRequest;
  }>("/api/executions/:id", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) updates["status"] = body.status;
    if (body.completedAt !== undefined) updates["completedAt"] = body.completedAt ? new Date(body.completedAt) : null;
    if (body.costUsd !== undefined) updates["costUsd"] = body.costUsd;
    if (body.durationMs !== undefined) updates["durationMs"] = body.durationMs;
    if (body.summary !== undefined) updates["summary"] = body.summary;
    if (body.outcome !== undefined) updates["outcome"] = body.outcome;
    if (body.rejectionPayload !== undefined) updates["rejectionPayload"] = body.rejectionPayload;
    if (body.logs !== undefined) updates["logs"] = body.logs;

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: { code: "BAD_REQUEST", message: "No fields to update" } });
    }

    const [row] = await db
      .update(executions)
      .set(updates)
      .where(eq(executions.id, id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Execution ${id} not found` } });
    }

    return { data: serializeExecution(row) };
  });

  // DELETE /api/executions/:id
  app.delete<{
    Params: { id: string };
  }>("/api/executions/:id", async (request, reply) => {
    const [row] = await db
      .delete(executions)
      .where(eq(executions.id, request.params.id))
      .returning();

    if (!row) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: `Execution ${request.params.id} not found` } });
    }

    return reply.status(204).send();
  });

  // POST /api/executions/:id/rewind — rewind file changes to pre-execution state
  app.post<{
    Params: { id: string };
    Body: { dryRun?: boolean };
  }>("/api/executions/:id/rewind", async (request, reply) => {
    const { id } = request.params;
    const dryRun = request.body?.dryRun ?? false;

    // Look up execution
    const [execution] = await db
      .select()
      .from(executions)
      .where(eq(executions.id, id));

    if (!execution) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: `Execution ${id} not found` },
      });
    }

    if (!execution.checkpointMessageId) {
      return reply.status(400).send({
        error: {
          code: "NO_CHECKPOINT",
          message: "This execution does not have a file checkpoint (legacy execution or checkpointing was not enabled)",
        },
      });
    }

    if (execution.status === "running") {
      return reply.status(409).send({
        error: {
          code: "EXECUTION_RUNNING",
          message: "Cannot rewind a running execution",
        },
      });
    }

    // Look up the project path for cwd
    const [workItem] = await db
      .select({ projectId: workItems.projectId })
      .from(workItems)
      .where(eq(workItems.id, execution.workItemId));

    if (!workItem) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Work item not found" },
      });
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, workItem.projectId));

    if (!project) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
    }

    // Ensure API key is available
    const config = loadConfig();
    if (!config.anthropicApiKey) {
      return reply.status(503).send({
        error: { code: "NO_API_KEY", message: "Anthropic API key not configured" },
      });
    }
    process.env["ANTHROPIC_API_KEY"] = config.anthropicApiKey;

    // Create a temporary query session to call rewindFiles
    const q = query({
      prompt: "Respond with exactly: OK",
      options: {
        cwd: project.path,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        enableFileCheckpointing: true,
        maxTurns: 1,
      },
    });

    let result: RewindFilesResult;
    try {
      // Ensure subprocess is running
      await q.next();

      // Call rewindFiles
      result = await q.rewindFiles(execution.checkpointMessageId, { dryRun });

      // Tear down
      await q.interrupt();
      for await (const _ of q) { /* drain */ }
    } catch (err) {
      // Ensure cleanup
      try {
        await q.interrupt();
        for await (const _ of q) { /* drain */ }
      } catch { /* subprocess may already be dead */ }

      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message, executionId: id }, "Rewind failed");
      return reply.status(500).send({
        error: { code: "REWIND_FAILED", message: `File rewind failed: ${message}` },
      });
    }

    if (!result.canRewind) {
      return reply.status(400).send({
        error: {
          code: "CANNOT_REWIND",
          message: result.error ?? "Cannot rewind files for this execution",
        },
      });
    }

    // If not a dry run, post a system comment and audit
    if (!dryRun) {
      const now = new Date();
      const commentId = createId.comment();
      const filesCount = result.filesChanged?.length ?? 0;

      await db.insert(comments).values({
        id: commentId,
        workItemId: execution.workItemId,
        authorType: "system",
        authorId: null,
        authorName: "System",
        content: `Files reverted to pre-execution state (${filesCount} files changed, +${result.insertions ?? 0}/-${result.deletions ?? 0} lines). Execution: ${id}`,
        metadata: { rewind: true, executionId: id, filesChanged: result.filesChanged },
        createdAt: now,
      });

      auditStateTransition({
        workItemId: execution.workItemId,
        fromState: "rewind",
        toState: "reverted",
        actor: "user",
        actorType: "user",
      });

      logger.info(
        { executionId: id, filesChanged: filesCount },
        "Files rewound to pre-execution state",
      );
    }

    return {
      data: {
        canRewind: result.canRewind,
        filesChanged: result.filesChanged ?? [],
        insertions: result.insertions ?? 0,
        deletions: result.deletions ?? 0,
        dryRun,
      },
    };
  });
}
