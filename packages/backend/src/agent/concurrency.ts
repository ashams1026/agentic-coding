/**
 * Concurrency limiter — controls how many agent executions run simultaneously.
 *
 * Tracks active executions in memory. When at capacity, tasks are
 * enqueued in a priority-ordered FIFO queue and dequeued on completion.
 */

import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "../db/connection.js";
import { projects, workItems, executions } from "../db/schema.js";

const DEFAULT_MAX_CONCURRENT = 3;

// ── Active execution tracking ────────────────────────────────────

const activeExecutions = new Set<string>(); // executionId set

// ── Priority queue ───────────────────────────────────────────────

interface QueueEntry {
  workItemId: string;
  agentId: string;
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
  agentId: string,
): Promise<void> {
  // Look up work item priority
  const [item] = await db
    .select({ priority: workItems.priority })
    .from(workItems)
    .where(eq(workItems.id, workItemId));

  const priority = item?.priority ?? "p2";

  const entry: QueueEntry = {
    workItemId,
    agentId,
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

/**
 * Get the set of active execution IDs (shallow copy).
 */
export function getActiveExecutionIds(): string[] {
  return [...activeExecutions];
}

/**
 * Clear all active executions and the queue.
 * Used on server restart to reset in-memory state.
 */
export function clearAll(): void {
  activeExecutions.clear();
  queue.length = 0;
}

// ── Cost tracking ────────────────────────────────────────────────

/**
 * Check if the project's monthly cost cap has been exceeded.
 * Returns { allowed, monthCostUsd, monthCapUsd }.
 */
export async function checkMonthlyCost(
  projectId: string,
): Promise<{ allowed: boolean; monthCostUsd: number; monthCapUsd: number }> {
  const monthCapUsd = await getMonthCap(projectId);
  if (monthCapUsd <= 0) return { allowed: true, monthCostUsd: 0, monthCapUsd: 0 }; // No cap

  const monthCostUsd = await getProjectCostSince(projectId, startOfMonth());
  return {
    allowed: monthCostUsd < monthCapUsd,
    monthCostUsd,
    monthCapUsd,
  };
}

/**
 * Get aggregate cost for a project since a given date.
 * Returns cost in USD (converts from cents stored in DB).
 */
export async function getProjectCostSince(
  projectId: string,
  since: Date,
): Promise<number> {
  const result = await db
    .select({
      totalCents: sql<number>`coalesce(sum(${executions.costUsd}), 0)`,
    })
    .from(executions)
    .innerJoin(workItems, eq(executions.workItemId, workItems.id))
    .where(
      and(
        eq(workItems.projectId, projectId),
        gte(executions.startedAt, since),
      ),
    );

  const totalCents = result[0]?.totalCents ?? 0;
  return totalCents / 100; // cents → dollars
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfDay(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Get today's and this month's cost for a project (in USD).
 * Used for cost_update broadcasts.
 */
export async function getProjectCostSummary(
  projectId: string,
): Promise<{ todayCostUsd: number; monthCostUsd: number }> {
  const [todayCostUsd, monthCostUsd] = await Promise.all([
    getProjectCostSince(projectId, startOfDay()),
    getProjectCostSince(projectId, startOfMonth()),
  ]);
  return { todayCostUsd, monthCostUsd };
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

async function getMonthCap(projectId: string): Promise<number> {
  const [project] = await db
    .select({ settings: projects.settings })
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) return 0;

  const cap = project.settings.monthCap;
  return typeof cap === "number" && cap > 0 ? cap : 0; // 0 = no cap
}
