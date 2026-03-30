/**
 * Concurrency limiter — controls how many agent executions run simultaneously.
 *
 * Tracks active executions in memory. When at capacity, tasks are
 * enqueued in a priority-ordered FIFO queue and dequeued on completion.
 */

import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { projects, workItems } from "../db/schema.js";

const DEFAULT_MAX_CONCURRENT = 3;

// ── Active execution tracking ────────────────────────────────────

const activeExecutions = new Set<string>(); // executionId set

// ── Priority queue ───────────────────────────────────────────────

interface QueueEntry {
  workItemId: string;
  personaId: string;
  priority: string; // p0 > p1 > p2 > p3
  enqueuedAt: number;
}

const queue: QueueEntry[] = [];

const PRIORITY_ORDER: Record<string, number> = {
  p0: 0,
  p1: 1,
  p2: 2,
  p3: 3,
};

function priorityRank(p: string): number {
  return PRIORITY_ORDER[p] ?? 99;
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Check if a new execution can be spawned, based on the project's
 * maxConcurrent setting (default 3).
 */
export async function canSpawn(projectId: string): Promise<boolean> {
  const max = await getMaxConcurrent(projectId);
  return activeExecutions.size < max;
}

/**
 * Register an execution as active. Call when an execution starts.
 */
export function trackExecution(executionId: string): void {
  activeExecutions.add(executionId);
}

/**
 * Mark an execution as complete and dequeue the next task if any.
 * Returns the next queued task to spawn, or null if queue is empty.
 */
export function onComplete(executionId: string): QueueEntry | null {
  activeExecutions.delete(executionId);

  if (queue.length === 0) return null;

  // Dequeue highest-priority (lowest rank) entry
  return queue.shift()!;
}

/**
 * Add a task to the queue when at capacity.
 * Queue is maintained in priority order (p0 first, then p1, etc).
 * Within same priority, FIFO (earlier enqueued first).
 */
export async function enqueue(
  workItemId: string,
  personaId: string,
): Promise<void> {
  // Look up work item priority
  const [item] = await db
    .select({ priority: workItems.priority })
    .from(workItems)
    .where(eq(workItems.id, workItemId));

  const priority = item?.priority ?? "p2";

  const entry: QueueEntry = {
    workItemId,
    personaId,
    priority,
    enqueuedAt: Date.now(),
  };

  // Insert in sorted position (stable sort by priority rank, FIFO within same)
  const rank = priorityRank(priority);
  let insertIdx = queue.length;
  for (let i = 0; i < queue.length; i++) {
    if (priorityRank(queue[i]!.priority) > rank) {
      insertIdx = i;
      break;
    }
  }
  queue.splice(insertIdx, 0, entry);
}

/**
 * Get the current number of active executions.
 */
export function getActiveCount(): number {
  return activeExecutions.size;
}

/**
 * Get the current queue length.
 */
export function getQueueLength(): number {
  return queue.length;
}

// ── Helpers ──────────────────────────────────────────────────────

async function getMaxConcurrent(projectId: string): Promise<number> {
  const [project] = await db
    .select({ settings: projects.settings })
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) return DEFAULT_MAX_CONCURRENT;

  const max = project.settings.maxConcurrent;
  return typeof max === "number" && max > 0 ? max : DEFAULT_MAX_CONCURRENT;
}
