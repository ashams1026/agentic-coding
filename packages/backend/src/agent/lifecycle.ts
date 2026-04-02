import { lt, inArray } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workItems, workItemEdges, comments, proposals, projectMemories, executions } from "../db/schema.js";
import { logger } from "../logger.js";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/**
 * Hard-deletes work items where deleted_at is older than 30 days.
 * Cascades: edges, comments, proposals, memories, and orphan executions.
 */
export async function cleanupExpiredWorkItems(): Promise<{ deletedCount: number }> {
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);

  // Find all expired soft-deleted items
  const expired = await db
    .select({ id: workItems.id })
    .from(workItems)
    .where(
      lt(workItems.deletedAt, cutoff),
    );

  if (expired.length === 0) {
    logger.info("Lifecycle cleanup: no expired work items to purge");
    return { deletedCount: 0 };
  }

  const expiredIds = expired.map((r) => r.id);
  logger.info({ count: expiredIds.length }, "Lifecycle cleanup: purging expired work items");

  // Cascade-delete related data
  await db.delete(workItemEdges).where(inArray(workItemEdges.fromId, expiredIds));
  await db.delete(workItemEdges).where(inArray(workItemEdges.toId, expiredIds));
  await db.delete(comments).where(inArray(comments.workItemId, expiredIds));
  await db.delete(proposals).where(inArray(proposals.workItemId, expiredIds));
  await db.delete(projectMemories).where(inArray(projectMemories.workItemId, expiredIds));

  // Delete orphan executions tied to these work items
  await db.delete(executions).where(inArray(executions.workItemId, expiredIds));

  // Hard-delete the work items themselves
  await db.delete(workItems).where(inArray(workItems.id, expiredIds));

  logger.info({ deletedCount: expiredIds.length }, "Lifecycle cleanup: purge complete");
  return { deletedCount: expiredIds.length };
}

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Registers the cleanup job: runs once at boot and every 6 hours.
 * Returns the interval handle for cleanup on shutdown.
 */
export function startLifecycleCleanup(): void {
  // Run immediately at boot
  cleanupExpiredWorkItems().catch((err) => {
    logger.error({ err }, "Lifecycle cleanup failed on boot");
  });

  // Schedule recurring cleanup every 6 hours
  cleanupInterval = setInterval(() => {
    cleanupExpiredWorkItems().catch((err) => {
      logger.error({ err }, "Lifecycle cleanup failed (scheduled)");
    });
  }, SIX_HOURS_MS);
}

/**
 * Stops the recurring cleanup job.
 */
export function stopLifecycleCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
