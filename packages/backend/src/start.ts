import { eq } from "drizzle-orm";
import { buildServer } from "./server.js";
import { runMigrations } from "./db/migrate.js";
import { db } from "./db/connection.js";
import { executions } from "./db/schema.js";
import { clearAll as clearConcurrency } from "./agent/concurrency.js";
import { clearTransitionLog } from "./agent/execution-manager.js";

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

export interface StartOptions {
  port?: number;
  host?: string;
}

/**
 * Start the AgentOps server: run migrations, clean up orphaned state,
 * build and listen on the given port.
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

  try {
    await server.listen({ port, host });
    server.log.info(`AgentOps backend listening on ${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
