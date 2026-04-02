import type { FastifyInstance } from "fastify";
import { lt, inArray, eq } from "drizzle-orm";
import { readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { loadConfig, setConfigValue } from "../config.js";
import { logger } from "../logger.js";
import { getActiveCount, getQueueLength, getActiveExecutionIds, clearAll } from "../agent/concurrency.js";
import { executionManager } from "../agent/setup.js";
import { db, sqlite } from "../db/connection.js";
import { createBackup, listBackups, restoreBackup } from "../db/backup.js";
import { projects, agents, agentAssignments, executions, workItems, proposals } from "../db/schema.js";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Mask an API key for display: show prefix and last 4 chars.
 * e.g. "sk-ant-api03-abc...****"
 */
function maskKey(key: string): string {
  if (key.length <= 12) return key.slice(0, 4) + "****";
  return key.slice(0, 12) + "...****";
}

/**
 * Validate an Anthropic API key by making a minimal API call.
 * Returns true if the key is accepted (2xx or 4xx other than 401).
 * Returns false on 401 (unauthorized) or network errors.
 */
async function validateAnthropicKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
    });

    if (res.status === 401) {
      return { valid: false, error: "Invalid API key" };
    }

    // Any non-401 response means the key is recognized
    return { valid: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Anthropic API key validation failed");
    return { valid: false, error: `Connection failed: ${message}` };
  }
}

export async function settingsRoutes(app: FastifyInstance) {
  // GET /api/settings/api-key — check if API key is configured
  app.get("/api/settings/api-key", async () => {
    const config = loadConfig();
    const key = config.anthropicApiKey;

    if (!key) {
      return { configured: false, maskedKey: null };
    }

    return { configured: true, maskedKey: maskKey(key) };
  });

  // POST /api/settings/api-key — validate and store API key
  app.post<{
    Body: { key: string };
  }>("/api/settings/api-key", async (request, reply) => {
    const { key } = request.body;

    if (!key || typeof key !== "string" || key.trim().length === 0) {
      return reply.status(400).send({ error: "API key is required" });
    }

    // Validate by making a test call
    const result = await validateAnthropicKey(key.trim());

    if (!result.valid) {
      return reply.status(400).send({
        error: result.error ?? "Invalid API key",
        valid: false,
      });
    }

    // Store the key
    setConfigValue("anthropicApiKey", key.trim());

    return {
      valid: true,
      configured: true,
      maskedKey: maskKey(key.trim()),
    };
  });

  // DELETE /api/settings/api-key — remove API key
  app.delete("/api/settings/api-key", async () => {
    setConfigValue("anthropicApiKey", "");
    return { configured: false, maskedKey: null };
  });

  // GET /api/settings/concurrency — current active/queued counts
  app.get("/api/settings/concurrency", async () => {
    return {
      active: getActiveCount(),
      queued: getQueueLength(),
    };
  });

  // GET /api/settings/db-stats — database size info
  app.get("/api/settings/db-stats", async () => {
    const row = sqlite.pragma("page_count") as { page_count: number }[];
    const row2 = sqlite.pragma("page_size") as { page_size: number }[];
    const pageCount = row[0]?.page_count ?? 0;
    const pageSize = row2[0]?.page_size ?? 4096;
    const sizeBytes = pageCount * pageSize;

    const allExecutions = await db.select().from(executions);
    const allProjects = await db.select().from(projects);
    const allAgents = await db.select().from(agents);

    return {
      sizeBytes,
      sizeMB: +(sizeBytes / (1024 * 1024)).toFixed(1),
      executionCount: allExecutions.length,
      projectCount: allProjects.length,
      agentCount: allAgents.length,
    };
  });

  // DELETE /api/settings/executions — clear executions older than 30 days (with cascade)
  app.delete("/api/settings/executions", async () => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get IDs of executions to delete (for cascade)
    const toDelete = await db
      .select({ id: executions.id })
      .from(executions)
      .where(lt(executions.startedAt, cutoff));

    if (toDelete.length === 0) {
      return { deleted: 0 };
    }

    const ids = toDelete.map((r) => r.id);

    // Cascade: delete proposals linked to these executions
    await db.delete(proposals).where(inArray(proposals.executionId, ids));

    // Delete the executions themselves
    await db.delete(executions).where(lt(executions.startedAt, cutoff));

    logger.info({ cutoff: cutoff.toISOString(), deleted: toDelete.length }, "Cleared old execution history with cascade");
    return { deleted: toDelete.length };
  });

  // GET /api/settings/export — export projects, agents, agent-assignments
  app.get("/api/settings/export", async () => {
    const allProjects = await db.select().from(projects);
    const allAgents = await db.select().from(agents);
    const allAssignments = await db.select().from(agentAssignments);

    return {
      exportedAt: new Date().toISOString(),
      projects: allProjects,
      agents: allAgents,
      agentAssignments: allAssignments,
    };
  });

  // POST /api/settings/browse-directory — list directories (and optionally files) for picker
  app.post<{
    Body: { startPath?: string; includeFiles?: boolean; fileFilter?: string };
  }>("/api/settings/browse-directory", async (request, reply) => {
    const startPath = request.body?.startPath || homedir();
    const includeFiles = request.body?.includeFiles ?? false;
    const fileFilter = request.body?.fileFilter; // e.g. ".md"
    const dirPath = resolve(startPath);

    try {
      const raw = readdirSync(dirPath, { withFileTypes: true })
        .filter((entry) => !entry.name.startsWith("."));

      const dirs = raw
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({
          name: entry.name,
          path: resolve(dirPath, entry.name),
          isDirectory: true,
        }));

      const files = includeFiles
        ? raw
            .filter((entry) => entry.isFile() && (!fileFilter || entry.name.endsWith(fileFilter)))
            .map((entry) => ({
              name: entry.name,
              path: resolve(dirPath, entry.name),
              isDirectory: false,
            }))
        : [];

      const entries = [
        ...dirs.sort((a, b) => a.name.localeCompare(b.name)),
        ...files.sort((a, b) => a.name.localeCompare(b.name)),
      ];

      return { currentPath: dirPath, entries };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(400).send({
        error: { code: "BROWSE_ERROR", message: `Cannot read directory: ${message}` },
      });
    }
  });

  // POST /api/settings/read-file — read first N lines of a file for preview
  app.post<{
    Body: { filePath: string; maxLines?: number };
  }>("/api/settings/read-file", async (request, reply) => {
    const { filePath, maxLines = 20 } = request.body ?? {};
    if (!filePath) {
      return reply.status(400).send({ error: { code: "MISSING_PATH", message: "filePath is required" } });
    }

    try {
      const resolved = resolve(filePath);
      const content = readFileSync(resolved, "utf-8");
      const lines = content.split("\n").slice(0, maxLines);
      return { filePath: resolved, content: lines.join("\n"), totalLines: content.split("\n").length };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(400).send({
        error: { code: "READ_ERROR", message: `Cannot read file: ${message}` },
      });
    }
  });

  // POST /api/settings/import — import projects, agents, agent-assignments
  app.post<{
    Body: {
      projects?: unknown[];
      agents?: unknown[];
      agentAssignments?: unknown[];
    };
  }>("/api/settings/import", async (request, reply) => {
    const body = request.body;
    if (!body || typeof body !== "object") {
      return reply.status(400).send({ error: "Invalid import payload" });
    }

    let imported = { projects: 0, agents: 0, agentAssignments: 0 };

    try {
      if (Array.isArray(body.projects)) {
        for (const p of body.projects) {
          const proj = p as Record<string, unknown>;
          await db.insert(projects).values({
            id: proj.id as string,
            name: proj.name as string,
            path: proj.path as string,
            settings: (proj.settings ?? {}) as Record<string, unknown>,
            createdAt: new Date(proj.createdAt as string),
          }).onConflictDoNothing();
          imported.projects++;
        }
      }

      if (Array.isArray(body.agents)) {
        for (const p of body.agents) {
          const per = p as Record<string, unknown>;
          await db.insert(agents).values({
            id: per.id as string,
            name: per.name as string,
            description: per.description as string,
            avatar: per.avatar as { color: string; icon: string },
            systemPrompt: per.systemPrompt as string,
            model: per.model as string,
            allowedTools: (per.allowedTools ?? []) as string[],
            mcpTools: (per.mcpTools ?? []) as string[],
            maxBudgetPerRun: (per.maxBudgetPerRun ?? 0) as number,
            settings: (per.settings ?? {}) as Record<string, unknown>,
          }).onConflictDoNothing();
          imported.agents++;
        }
      }

      if (Array.isArray(body.agentAssignments)) {
        for (const a of body.agentAssignments) {
          const assign = a as Record<string, unknown>;
          await db.insert(agentAssignments).values({
            projectId: assign.projectId as string,
            stateName: assign.stateName as string,
            agentId: assign.agentId as string,
          }).onConflictDoNothing();
          imported.agentAssignments++;
        }
      }

      logger.info({ imported }, "Settings imported");
      return { imported };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err }, "Settings import failed");
      return reply.status(400).send({ error: `Import failed: ${message}` });
    }
  });

  // GET /api/service/status — active executions with details
  app.get("/api/service/status", async () => {
    const activeIds = getActiveExecutionIds();

    if (activeIds.length === 0) {
      return { activeExecutions: [] };
    }

    // Join executions with agents and work items to get names
    const rows = await db
      .select({
        executionId: executions.id,
        agentName: agents.name,
        workItemTitle: workItems.title,
        startedAt: executions.startedAt,
      })
      .from(executions)
      .innerJoin(agents, eq(executions.agentId, agents.id))
      .innerJoin(workItems, eq(executions.workItemId, workItems.id))
      .where(inArray(executions.id, activeIds));

    const now = Date.now();
    return {
      activeExecutions: rows.map((r) => ({
        executionId: r.executionId,
        agentName: r.agentName,
        workItemTitle: r.workItemTitle,
        elapsedMs: now - (r.startedAt?.getTime() ?? now),
      })),
    };
  });

  // POST /api/service/restart — restart the backend process
  app.post<{
    Querystring: { force?: string };
  }>("/api/service/restart", async (request, reply) => {
    const force = request.query.force === "true";
    const activeIds = getActiveExecutionIds();

    if (!force && activeIds.length > 0) {
      return reply.status(409).send({
        error: "Active executions running",
        activeCount: activeIds.length,
      });
    }

    // Clear in-memory state
    clearAll();

    logger.info({ force, activeCount: activeIds.length }, "Service restart requested");

    // Send response before exiting
    reply.send({ restarting: true, force });

    // Give time for the response to flush, then exit.
    // pm2 (or the process supervisor) will restart the process.
    setTimeout(() => {
      process.exit(0);
    }, 500);
  });

  // GET /api/settings/executor-mode
  app.get("/api/settings/executor-mode", async () => {
    const nodeEnv = process.env["NODE_ENV"] ?? "development";
    return {
      mode: executionManager.getExecutorMode(),
      available: executionManager.listExecutorModes(),
      isProduction: nodeEnv === "production",
    };
  });

  // PUT /api/settings/executor-mode
  app.put<{
    Body: { mode: string };
  }>("/api/settings/executor-mode", async (request, reply) => {
    const nodeEnv = process.env["NODE_ENV"] ?? "development";
    if (nodeEnv === "production") {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Cannot change executor mode in production" } });
    }
    const { mode } = request.body;
    const available = executionManager.listExecutorModes();
    if (!available.includes(mode)) {
      return reply.status(400).send({ error: { code: "BAD_REQUEST", message: `Unknown executor mode "${mode}". Available: ${available.join(", ")}` } });
    }
    executionManager.setExecutorMode(mode);
    return { mode: executionManager.getExecutorMode() };
  });

  // ── Backup & Restore ────────────────────────────────────────

  // POST /api/settings/backup — create manual backup
  app.post("/api/settings/backup", async () => {
    const backupPath = createBackup();
    return { data: { path: backupPath, createdAt: new Date().toISOString() } };
  });

  // GET /api/settings/backups — list available backups
  app.get("/api/settings/backups", async () => {
    const backups = listBackups();
    return {
      data: backups.map((b) => ({
        filename: b.filename,
        path: b.path,
        sizeBytes: b.sizeBytes,
        sizeMb: +(b.sizeBytes / (1024 * 1024)).toFixed(2),
        createdAt: b.createdAt,
      })),
      total: backups.length,
    };
  });

  // POST /api/settings/restore — restore from backup
  app.post<{
    Body: { path: string };
  }>("/api/settings/restore", async (request, reply) => {
    const { path } = request.body;
    try {
      restoreBackup(path);
      return { data: { restored: true, path, message: "Database restored. Restart the server to apply changes." } };
    } catch (err) {
      return reply.status(400).send({ error: { code: "RESTORE_FAILED", message: (err as Error).message } });
    }
  });

  // ── Log Truncation ──────────────────────────────────────────

  // POST /api/settings/truncate-logs — truncate old execution logs
  app.post<{
    Querystring: { olderThanDays?: string };
  }>("/api/settings/truncate-logs", async (request) => {
    const days = parseInt(request.query.olderThanDays ?? "30", 10) || 30;
    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = sqlite.prepare(
      `UPDATE executions SET logs = '' WHERE completed_at IS NOT NULL AND completed_at < ? AND logs != ''`,
    ).run(threshold.getTime());

    logger.info({ days, truncated: result.changes }, "Execution logs truncated");
    return { data: { truncated: result.changes, olderThanDays: days } };
  });

  // ── Storage Stats ───────────────────────────────────────────

  // GET /api/settings/storage-stats — per-table size breakdown
  app.get("/api/settings/storage-stats", async () => {
    const rows = sqlite.prepare(`
      SELECT
        name,
        (SELECT COUNT(*) FROM pragma_table_info(name)) as columnCount
      FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_drizzle%' AND name NOT LIKE '%_fts%' AND name NOT LIKE 'fts_%'
      ORDER BY name
    `).all() as Array<{ name: string; columnCount: number }>;

    const tables = rows.map((r) => {
      const countResult = sqlite.prepare(`SELECT COUNT(*) as cnt FROM "${r.name}"`).get() as { cnt: number };
      // Estimate size using page_count * page_size for the whole DB, proportional to row count
      return {
        name: r.name,
        rowCount: countResult.cnt,
      };
    });

    // Get total DB file size
    const pageSize = (sqlite.prepare("PRAGMA page_size").get() as { page_size: number }).page_size;
    const pageCount = (sqlite.prepare("PRAGMA page_count").get() as { page_count: number }).page_count;
    const totalSizeBytes = pageSize * pageCount;

    return {
      data: {
        tables,
        totalSizeBytes,
        totalSizeMb: +(totalSizeBytes / (1024 * 1024)).toFixed(2),
      },
    };
  });
}
