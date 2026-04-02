import type { FastifyInstance } from "fastify";
import { eq, inArray } from "drizzle-orm";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { RewindFilesResult } from "@anthropic-ai/claude-agent-sdk";
import { db } from "../db/connection.js";
import { executions, workItems, comments, projects, agents } from "../db/schema.js";
import { getRunningQuery } from "../agent/claude-executor.js";
import { createId } from "@agentops/shared";
import type {
  ExecutionId,
  WorkItemId,
  AgentId,
  CreateExecutionRequest,
  UpdateExecutionRequest,
} from "@agentops/shared";
import { loadConfig } from "../config.js";
import { logger } from "../logger.js";
import { auditStateTransition } from "../audit.js";
import {
  getQueueEntries,
  getActiveCount,
  getQueueLength,
  getMaxConcurrentForProject,
} from "../agent/concurrency.js";

function toIso(d: Date): string {
  return d.toISOString();
}

function serializeExecution(row: typeof executions.$inferSelect) {
  return {
    id: row.id as ExecutionId,
    workItemId: row.workItemId as WorkItemId,
    agentId: row.agentId as AgentId,
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
    workflowId: row.workflowId ?? null,
    workflowStateName: row.workflowStateName ?? null,
    handoffNotes: row.handoffNotes ?? null,
    model: row.model ?? null,
    totalTokens: row.totalTokens ?? null,
    toolUses: row.toolUses ?? null,
  };
}

export async function executionRoutes(app: FastifyInstance) {
  // GET /api/executions/queue — expose the in-memory concurrency queue
  app.get<{
    Querystring: { projectId?: string };
  }>("/api/executions/queue", async (request) => {
    const { projectId } = request.query;

    const entries = getQueueEntries();

    // Batch-resolve display names from DB
    const workItemIds = [...new Set(entries.map((e) => e.workItemId))];
    const agentIds = [...new Set(entries.map((e) => e.agentId))];

    const [itemRows, agentRows] = await Promise.all([
      workItemIds.length > 0
        ? db
            .select({ id: workItems.id, title: workItems.title })
            .from(workItems)
            .where(inArray(workItems.id, workItemIds))
        : Promise.resolve([]),
      agentIds.length > 0
        ? db
            .select({ id: agents.id, name: agents.name })
            .from(agents)
            .where(inArray(agents.id, agentIds))
        : Promise.resolve([]),
    ]);

    const workItemTitleMap = new Map(itemRows.map((r) => [r.id, r.title]));
    const agentNameMap = new Map(agentRows.map((r) => [r.id, r.name]));

    const queueData = entries.map((entry, idx) => ({
      workItemId: entry.workItemId,
      workItemTitle: workItemTitleMap.get(entry.workItemId) ?? "Unknown",
      agentId: entry.agentId,
      agentName: agentNameMap.get(entry.agentId) ?? "Unknown",
      priority: entry.priority,
      enqueuedAt: entry.enqueuedAt,
      position: idx + 1,
    }));

    const maxConcurrent = projectId
      ? await getMaxConcurrentForProject(projectId)
      : 3;

    return {
      data: {
        queue: queueData,
        activeCount: getActiveCount(),
        maxConcurrent,
        queueLength: getQueueLength(),
      },
    };
  });

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
      const workItemIdSet = new Set(projectWorkItems.map((w) => w.id));
      rows = rows.filter((r) => r.workItemId && workItemIdSet.has(r.workItemId));
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

    // Look up the work item to get its projectId
    const [workItem] = await db
      .select({ projectId: workItems.projectId })
      .from(workItems)
      .where(eq(workItems.id, body.workItemId));

    const [row] = await db
      .insert(executions)
      .values({
        id,
        workItemId: body.workItemId,
        agentId: body.agentId,
        projectId: workItem?.projectId ?? "pj-global",
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

  // POST /api/executions/run — standalone execution (no work item)
  app.post<{
    Body: { agentId: string; prompt: string; projectId?: string; budgetUsd?: number };
  }>("/api/executions/run", async (request, reply) => {
    const { agentId, prompt, projectId, budgetUsd } = request.body;

    if (!agentId || !prompt) {
      return reply.status(400).send({
        error: { code: "BAD_REQUEST", message: "agentId and prompt are required" },
      });
    }

    // Validate agent exists
    const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
    if (!agent) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: `Agent ${agentId} not found` },
      });
    }

    // Validate project if provided
    if (projectId) {
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!project) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: `Project ${projectId} not found` },
        });
      }
    }

    const id = createId.execution();
    const [row] = await db
      .insert(executions)
      .values({
        id,
        workItemId: null,
        agentId,
        projectId: projectId ?? "pj-global",
        status: "pending",
        startedAt: new Date(),
        completedAt: null,
        costUsd: budgetUsd ? Math.round(budgetUsd * 100) : 0,
        durationMs: 0,
        summary: prompt,
        outcome: null,
        rejectionPayload: null,
        logs: "",
      })
      .returning();

    return reply.status(201).send({ id: row!.id });
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
    if (!execution.workItemId) {
      return reply.status(400).send({
        error: { code: "NO_WORK_ITEM", message: "Cannot rewind a standalone execution (no work item)" },
      });
    }

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
        workItemId: execution.workItemId!, // guarded above
        authorType: "system",
        authorId: null,
        authorName: "System",
        content: `Files reverted to pre-execution state (${filesCount} files changed, +${result.insertions ?? 0}/-${result.deletions ?? 0} lines). Execution: ${id}`,
        metadata: { rewind: true, executionId: id, filesChanged: result.filesChanged },
        createdAt: now,
      });

      auditStateTransition({
        workItemId: execution.workItemId!,
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

  // POST /api/executions/:id/mcp/toggle — enable/disable an MCP server mid-execution
  app.post<{
    Params: { id: string };
    Body: { serverName: string; enabled: boolean };
  }>("/api/executions/:id/mcp/toggle", async (request, reply) => {
    const q = getRunningQuery(request.params.id);
    if (!q) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "No running execution with this ID" } });
    }
    try {
      await q.toggleMcpServer(request.body.serverName, request.body.enabled);
      return { data: { ok: true } };
    } catch (err) {
      return reply.status(500).send({ error: { code: "MCP_ERROR", message: err instanceof Error ? err.message : String(err) } });
    }
  });

  // POST /api/executions/:id/mcp/reconnect — reconnect a failed MCP server
  app.post<{
    Params: { id: string };
    Body: { serverName: string };
  }>("/api/executions/:id/mcp/reconnect", async (request, reply) => {
    const q = getRunningQuery(request.params.id);
    if (!q) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "No running execution with this ID" } });
    }
    try {
      await q.reconnectMcpServer(request.body.serverName);
      return { data: { ok: true } };
    } catch (err) {
      return reply.status(500).send({ error: { code: "MCP_ERROR", message: err instanceof Error ? err.message : String(err) } });
    }
  });

  // GET /api/executions/:id/mcp/status — get MCP server status for a running execution
  app.get<{
    Params: { id: string };
  }>("/api/executions/:id/mcp/status", async (request, reply) => {
    const q = getRunningQuery(request.params.id);
    if (!q) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "No running execution with this ID" } });
    }
    try {
      const status = await q.mcpServerStatus();
      return { data: status };
    } catch (err) {
      return reply.status(500).send({ error: { code: "MCP_ERROR", message: err instanceof Error ? err.message : String(err) } });
    }
  });

  // GET /api/executions/:id/models — get available models for a running execution
  app.get<{
    Params: { id: string };
  }>("/api/executions/:id/models", async (request, reply) => {
    const q = getRunningQuery(request.params.id);
    if (!q) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "No running execution with this ID" } });
    }
    try {
      const models = await q.supportedModels();
      return { data: models.map((m) => ({ value: m.value, displayName: m.displayName, description: m.description })) };
    } catch (err) {
      return reply.status(500).send({ error: { code: "MODEL_ERROR", message: err instanceof Error ? err.message : String(err) } });
    }
  });

  // POST /api/executions/:id/model — switch model for a running execution
  app.post<{
    Params: { id: string };
    Body: { model: string };
  }>("/api/executions/:id/model", async (request, reply) => {
    const q = getRunningQuery(request.params.id);
    if (!q) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "No running execution with this ID" } });
    }
    try {
      await q.setModel(request.body.model);
      return { data: { ok: true, model: request.body.model } };
    } catch (err) {
      return reply.status(500).send({ error: { code: "MODEL_ERROR", message: err instanceof Error ? err.message : String(err) } });
    }
  });
}
