import { eq } from "drizzle-orm";
import { buildServer } from "./server.js";
import { runMigrations } from "./db/migrate.js";
import { db } from "./db/connection.js";
import { executions } from "./db/schema.js";
import { clearAll as clearConcurrency } from "./agent/concurrency.js";
import { clearTransitionLog } from "./agent/execution-manager.js";

const PORT = Number(process.env["PORT"] ?? 3001);
const HOST = process.env["HOST"] ?? "0.0.0.0";

/**
 * Clean up orphaned state from a previous crash.
 * Any executions stuck in "running" are reset to "failed".
 * In-memory trackers (concurrency, transition log) are cleared.
 */
async function cleanupOrphanedState(): Promise<number> {
  const now = new Date();

  // Find all running executions — these are orphaned from a previous crash
  const orphaned = await db
    .select({ id: executions.id })
    .from(executions)
    .where(eq(executions.status, "running"));

  if (orphaned.length > 0) {
    // Mark them all as failed
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

  // Clear in-memory state
  clearConcurrency();
  clearTransitionLog();

  return orphaned.length;
}

async function main() {
  // Apply pending migrations before starting
  runMigrations();

  // Clean up orphaned executions from previous crash
  const cleanedUp = await cleanupOrphanedState();
  if (cleanedUp > 0) {
    console.log(`Startup cleanup: reset ${cleanedUp} orphaned execution(s) to failed`);
  }

  const server = await buildServer();

  try {
    await server.listen({ port: PORT, host: HOST });
    server.log.info(`AgentOps backend listening on ${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
