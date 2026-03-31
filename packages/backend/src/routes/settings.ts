import type { FastifyInstance } from "fastify";
import { lt } from "drizzle-orm";
import { readdirSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { loadConfig, setConfigValue } from "../config.js";
import { logger } from "../logger.js";
import { getActiveCount, getQueueLength, getActiveExecutionIds, clearAll } from "../agent/concurrency.js";
import { db, sqlite } from "../db/connection.js";
import { projects, personas, personaAssignments, executions, workItems } from "../db/schema.js";
import { eq, inArray } from "drizzle-orm";

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
    const allPersonas = await db.select().from(personas);

    return {
      sizeBytes,
      sizeMB: +(sizeBytes / (1024 * 1024)).toFixed(1),
      executionCount: allExecutions.length,
      projectCount: allProjects.length,
      personaCount: allPersonas.length,
    };
  });

  // DELETE /api/settings/executions — clear executions older than 30 days
  app.delete("/api/settings/executions", async () => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await db
      .delete(executions)
      .where(lt(executions.startedAt, cutoff));

    logger.info({ cutoff: cutoff.toISOString() }, "Cleared old execution history");
    return { deleted: result.changes };
  });

  // GET /api/settings/export — export projects, personas, persona-assignments
  app.get("/api/settings/export", async () => {
    const allProjects = await db.select().from(projects);
    const allPersonas = await db.select().from(personas);
    const allAssignments = await db.select().from(personaAssignments);

    return {
      exportedAt: new Date().toISOString(),
      projects: allProjects,
      personas: allPersonas,
      personaAssignments: allAssignments,
    };
  });

  // POST /api/settings/browse-directory — list directories for folder picker
  app.post<{
    Body: { startPath?: string };
  }>("/api/settings/browse-directory", async (request, reply) => {
    const startPath = request.body?.startPath || homedir();
    const dirPath = resolve(startPath);

    try {
      const entries = readdirSync(dirPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
        .map((entry) => ({
          name: entry.name,
          path: resolve(dirPath, entry.name),
          isDirectory: true,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return { currentPath: dirPath, entries };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(400).send({
        error: { code: "BROWSE_ERROR", message: `Cannot read directory: ${message}` },
      });
    }
  });

  // POST /api/settings/import — import projects, personas, persona-assignments
  app.post<{
    Body: {
      projects?: unknown[];
      personas?: unknown[];
      personaAssignments?: unknown[];
    };
  }>("/api/settings/import", async (request, reply) => {
    const body = request.body;
    if (!body || typeof body !== "object") {
      return reply.status(400).send({ error: "Invalid import payload" });
    }

    let imported = { projects: 0, personas: 0, personaAssignments: 0 };

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

      if (Array.isArray(body.personas)) {
        for (const p of body.personas) {
          const per = p as Record<string, unknown>;
          await db.insert(personas).values({
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
          imported.personas++;
        }
      }

      if (Array.isArray(body.personaAssignments)) {
        for (const a of body.personaAssignments) {
          const assign = a as Record<string, unknown>;
          await db.insert(personaAssignments).values({
            projectId: assign.projectId as string,
            stateName: assign.stateName as string,
            personaId: assign.personaId as string,
          }).onConflictDoNothing();
          imported.personaAssignments++;
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

    // Join executions with personas and work items to get names
    const rows = await db
      .select({
        executionId: executions.id,
        personaName: personas.name,
        workItemTitle: workItems.title,
        startedAt: executions.startedAt,
      })
      .from(executions)
      .innerJoin(personas, eq(executions.personaId, personas.id))
      .innerJoin(workItems, eq(executions.workItemId, workItems.id))
      .where(inArray(executions.id, activeIds));

    const now = Date.now();
    return {
      activeExecutions: rows.map((r) => ({
        executionId: r.executionId,
        personaName: r.personaName,
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
}
