import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { buildServer } from "./server.js";
import { runMigrations } from "./db/migrate.js";
import { db } from "./db/connection.js";
import { sqlite } from "./db/connection.js";
import { executions } from "./db/schema.js";
import { clearAll as clearConcurrency, getActiveCount } from "./agent/concurrency.js";
import { clearTransitionLog } from "./agent/execution-manager.js";
import { closeAllClients } from "./ws.js";

const SHUTDOWN_TIMEOUT_MS = 30_000;

/**
 * Clean up orphaned state from a previous crash.
 * Any executions stuck in "running" are reset to "failed".
 * In-memory trackers (concurrency, transition log) are cleared.
 */
async function cleanupOrphanedState(): Promise<number> {
  const now = new Date();

  const orphaned = await db
    .select({ id: executions.id })
    .from(executions)
    .where(eq(executions.status, "running"));

  if (orphaned.length > 0) {
    await db
      .update(executions)
      .set({
        status: "failed",
        completedAt: now,
        summary: "Interrupted by server restart",
        outcome: "failure",
      })
      .where(eq(executions.status, "running"));
  }

  clearConcurrency();
  clearTransitionLog();

  return orphaned.length;
}

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

export interface StartOptions {
  port?: number;
  host?: string;
}

/**
 * Start the AgentOps server: run migrations, clean up orphaned state,
 * build and listen on the given port. Registers graceful shutdown handlers.
 */
export async function startServer(options: StartOptions = {}): Promise<void> {
  const port = options.port ?? Number(process.env["PORT"] ?? 3001);
  const host = options.host ?? process.env["HOST"] ?? "0.0.0.0";

  runMigrations();

  const cleanedUp = await cleanupOrphanedState();
  if (cleanedUp > 0) {
    console.log(
      `Startup cleanup: reset ${cleanedUp} orphaned execution(s) to failed`,
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
