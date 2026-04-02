/**
 * Cron Scheduler — polls for due schedules every 60 seconds and spawns executions.
 *
 * Uses a simple cron expression matcher (no external dependency).
 * Supports: minute, hour, day-of-month, month, day-of-week fields.
 * Supports: asterisk, step (asterisk/N), exact (N), range (N-M).
 */

import { eq, and, lte, or, isNull } from "drizzle-orm";
import { db } from "../db/connection.js";
import { schedules } from "../db/schema.js";
import { executionManager } from "../agent/setup.js";
import { logger } from "../logger.js";

// ── Constants ───────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000; // 1 minute
const MAX_CONSECUTIVE_FAILURES = 5;

// ── Cron Matching ───────────────────────────────────────────────

function matchesCronField(field: string, value: number, _max: number): boolean {
  if (field === "*") return true;

  // */N step
  if (field.startsWith("*/")) {
    const step = parseInt(field.slice(2), 10);
    return step > 0 && value % step === 0;
  }

  // Comma-separated values
  const parts = field.split(",");
  for (const part of parts) {
    // Range N-M
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (value >= start! && value <= end!) return true;
    } else {
      if (parseInt(part, 10) === value) return true;
    }
  }

  return false;
}

export function matchesCron(expression: string, date: Date): boolean {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const d = date;

  return (
    matchesCronField(minute!, d.getMinutes(), 59) &&
    matchesCronField(hour!, d.getHours(), 23) &&
    matchesCronField(dayOfMonth!, d.getDate(), 31) &&
    matchesCronField(month!, d.getMonth() + 1, 12) &&
    matchesCronField(dayOfWeek!, d.getDay(), 6)
  );
}

/**
 * Compute the next run time for a cron expression (approximate — checks next 1440 minutes).
 */
export function getNextRunTime(expression: string, after: Date = new Date()): Date | null {
  const check = new Date(after);
  check.setSeconds(0, 0);
  check.setMinutes(check.getMinutes() + 1); // start from next minute

  for (let i = 0; i < 1440; i++) { // check up to 24 hours
    if (matchesCron(expression, check)) return new Date(check);
    check.setMinutes(check.getMinutes() + 1);
  }
  return null;
}

// ── Scheduler ───────────────────────────────────────────────────

let pollTimer: ReturnType<typeof setInterval> | null = null;

async function pollSchedules(): Promise<void> {
  try {
    const now = new Date();

    // Find active schedules that are due (nextRunAt <= now or nextRunAt is null)
    const dueSchedules = await db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.isActive, true),
          or(
            lte(schedules.nextRunAt, now),
            isNull(schedules.nextRunAt),
          ),
        ),
      );

    for (const schedule of dueSchedules) {
      // Verify cron matches current time (double-check)
      if (!matchesCron(schedule.cronExpression, now) && schedule.nextRunAt !== null) {
        continue;
      }

      try {
        // Spawn execution (standalone — no work item)
        await executionManager.runExecution(
          null as any, // no work item
          schedule.personaId,
        );

        // Update lastRunAt + compute nextRunAt + reset failures
        const nextRun = getNextRunTime(schedule.cronExpression, now);
        await db.update(schedules)
          .set({
            lastRunAt: now,
            nextRunAt: nextRun,
            consecutiveFailures: 0,
          })
          .where(eq(schedules.id, schedule.id));

        logger.info({ scheduleId: schedule.id, name: schedule.name }, "Scheduled execution triggered");
      } catch (err) {
        const newFailures = schedule.consecutiveFailures + 1;
        const shouldDisable = newFailures >= MAX_CONSECUTIVE_FAILURES;

        const nextRun = getNextRunTime(schedule.cronExpression, now);
        await db.update(schedules)
          .set({
            lastRunAt: now,
            nextRunAt: nextRun,
            consecutiveFailures: newFailures,
            isActive: shouldDisable ? false : schedule.isActive,
          })
          .where(eq(schedules.id, schedule.id));

        if (shouldDisable) {
          logger.warn({ scheduleId: schedule.id, failures: newFailures }, "Schedule auto-disabled after consecutive failures");
        } else {
          logger.error({ err, scheduleId: schedule.id }, "Scheduled execution failed");
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "Schedule poll error");
  }
}

/**
 * Catch up on missed runs — for schedules that should have run while server was down.
 */
async function catchUpMissedRuns(): Promise<void> {
  const now = new Date();
  const overdue = await db
    .select()
    .from(schedules)
    .where(
      and(
        eq(schedules.isActive, true),
        lte(schedules.nextRunAt, now),
      ),
    );

  if (overdue.length > 0) {
    logger.info({ count: overdue.length }, "Catching up missed scheduled runs");
    await pollSchedules();
  }
}

export async function startScheduler(): Promise<void> {
  if (pollTimer) return;
  logger.info("Starting cron scheduler (60s poll)");

  // Catch up missed runs from downtime
  await catchUpMissedRuns();

  pollTimer = setInterval(pollSchedules, POLL_INTERVAL_MS);
}

export function stopScheduler(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    logger.info("Cron scheduler stopped");
  }
}
