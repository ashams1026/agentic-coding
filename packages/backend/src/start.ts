import { eq, or } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { buildServer } from "./server.js";
import { runMigrations } from "./db/migrate.js";
import { db } from "./db/connection.js";
import { sqlite } from "./db/connection.js";
import { executions, workItems } from "./db/schema.js";
import { clearAll as clearConcurrency, getActiveCount } from "./agent/concurrency.js";
import { clearTransitionLog } from "./agent/execution-manager.js";
import { closeAllClients } from "./ws.js";

const SHUTDOWN_TIMEOUT_MS = 30_000;

// ── Crash recovery ──────────────────────────────────────────────

export interface RecoveryReport {
  executionsReset: number;
  affectedWorkItems: string[];
  errors: string[];
}

/**
 * Production-grade crash recovery.
 *
 * Runs after migrations and before the server accepts connections:
 * 1. Find all orphaned executions (status "running" or "pending" from a previous crash)
 * 2. Reset them to "failed" with a descriptive summary
 * 3. Log each recovered execution with details
 * 4. Clear in-memory state (concurrency tracker, transition rate limiter)
 * 5. Report what was recovered
 *
 * Work items are intentionally left in their current state —
 * the user or auto-routing can re-trigger dispatch.
 */
export async function recoverOrphanedState(): Promise<RecoveryReport> {
  const report: RecoveryReport = {
    executionsReset: 0,
    affectedWorkItems: [],
    errors: [],
  };

  try {
    const now = new Date();

    // Find all orphaned executions — "running" or "pending" from a previous crash
    const orphaned = await db
      .select({
        id: executions.id,
        workItemId: executions.workItemId,
        personaId: executions.personaId,
        status: executions.status,
        startedAt: executions.startedAt,
      })
      .from(executions)
      .where(
        or(
          eq(executions.status, "running"),
          eq(executions.status, "pending"),
        ),
      );

    if (orphaned.length > 0) {
      // Log each orphaned execution
      for (const exec of orphaned) {
        console.log(
          `  Recovery: resetting execution ${exec.id} (${exec.status}) ` +
          `for work item ${exec.workItemId}, persona ${exec.personaId}`,
        );
      }

      // Bulk update all orphaned executions to failed
      await db
        .update(executions)
        .set({
          status: "failed",
          completedAt: now,
          summary: "Interrupted by server restart",
          outcome: "failure",
        })
        .where(
          or(
            eq(executions.status, "running"),
            eq(executions.status, "pending"),
          ),
        );

      report.executionsReset = orphaned.length;

      // Collect affected work item IDs (deduplicated)
      const workItemIds = [...new Set(orphaned.map((e) => e.workItemId))];
      report.affectedWorkItems = workItemIds;

      // Log affected work items and their current states (informational only)
      if (workItemIds.length > 0) {
        const items = await db
          .select({
            id: workItems.id,
            title: workItems.title,
            currentState: workItems.currentState,
          })
          .from(workItems)
          .where(
            or(...workItemIds.map((id) => eq(workItems.id, id))),
          );

        for (const item of items) {
          console.log(
            `  Recovery: work item ${item.id} "${item.title}" ` +
            `remains in state "${item.currentState}" (no change)`,
          );
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    report.errors.push(message);
    console.error(`Recovery error: ${message}`);
  }

  // Always clear in-memory state, even if DB recovery failed
  clearConcurrency();
  clearTransitionLog();

  return report;
}

// ── Graceful shutdown ───────────────────────────────────────────

/**
 * Wait for active agent executions to drain, up to a timeout.
 * Returns true if all executions completed, false if timed out.
 */
function waitForExecutions(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (getActiveCount() === 0) {
      resolve(true);
      return;
    }

    const deadline = Date.now() + timeoutMs;
    const interval = setInterval(() => {
      if (getActiveCount() === 0 || Date.now() >= deadline) {
        clearInterval(interval);
        resolve(getActiveCount() === 0);
      }
    }, 500);
  });
}

/**
 * Perform graceful shutdown: close connections, wait for executions, close DB.
 */
async function gracefulShutdown(
  server: FastifyInstance,
  signal: string,
): Promise<void> {
  const shutdownStart = Date.now();
  server.log.info(`Received ${signal} — starting graceful shutdown`);

  // Stop accepting new connections
  await server.close();

  // Close all WebSocket connections with 1001
  closeAllClients();

  // Wait for active agent executions (30s timeout)
  const active = getActiveCount();
  if (active > 0) {
    server.log.info(
      `Waiting for ${active} active execution(s) to complete (${SHUTDOWN_TIMEOUT_MS / 1000}s timeout)...`,
    );
    const drained = await waitForExecutions(SHUTDOWN_TIMEOUT_MS);
    if (!drained) {
      server.log.warn(
        `Shutdown timeout: ${getActiveCount()} execution(s) still active — force-killing`,
      );
    }
  }

  // Close database connection
  try {
    sqlite.close();
  } catch {
    // DB may already be closed
  }

  const duration = ((Date.now() - shutdownStart) / 1000).toFixed(1);
  server.log.info(`Shutdown complete in ${duration}s (reason: ${signal})`);

  process.exit(0);
}

// ── Server startup ──────────────────────────────────────────────

export interface StartOptions {
  port?: number;
  host?: string;
}

/**
 * Start the AgentOps server: run migrations, recover orphaned state,
 * build and listen on the given port. Registers graceful shutdown handlers.
 */
export async function startServer(options: StartOptions = {}): Promise<void> {
  const port = options.port ?? Number(process.env["PORT"] ?? 3001);
  const host = options.host ?? process.env["HOST"] ?? "0.0.0.0";

  runMigrations();

  // Production-grade crash recovery
  const recovery = await recoverOrphanedState();
  if (recovery.executionsReset > 0) {
    console.log(
      `Startup recovery: reset ${recovery.executionsReset} orphaned execution(s), ` +
      `${recovery.affectedWorkItems.length} work item(s) affected`,
    );
  }
  if (recovery.errors.length > 0) {
    console.error(
      `Startup recovery completed with ${recovery.errors.length} error(s)`,
    );
  }

  const server = await buildServer();

  // Register graceful shutdown handlers
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return; // Prevent double shutdown
    shuttingDown = true;
    gracefulShutdown(server, signal).catch((err) => {
      server.log.error(err, "Error during shutdown");
      process.exit(1);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  try {
    await server.listen({ port, host });
    server.log.info(`AgentOps backend listening on ${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
