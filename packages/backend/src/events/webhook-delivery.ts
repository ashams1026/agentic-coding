/**
 * Webhook Delivery Worker — polls for pending deliveries and sends HTTP POST
 * with HMAC-signed payloads. Implements exponential backoff retry and
 * auto-disable for consistently failing subscriptions.
 */

import { createHmac } from "node:crypto";
import { eq, and, lte, or } from "drizzle-orm";
import { db } from "../db/connection.js";
import { webhookDeliveries, webhookSubscriptions } from "../db/schema.js";
import { logger } from "../logger.js";

// ── Constants ───────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2000;
const HTTP_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 5;
const MAX_CONSECUTIVE_FAILURES = 10;

/** Exponential backoff delays: 30s, 2min, 8min, 30min */
const RETRY_DELAYS_MS = [
  30_000,
  120_000,
  480_000,
  1_800_000,
];

// ── HMAC Signing ────────────────────────────────────────────────

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

// ── Delivery Logic ──────────────────────────────────────────────

async function deliverWebhook(deliveryId: string): Promise<void> {
  const [delivery] = await db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.id, deliveryId));

  if (!delivery) return;

  const [subscription] = await db
    .select()
    .from(webhookSubscriptions)
    .where(eq(webhookSubscriptions.id, delivery.subscriptionId));

  if (!subscription || !subscription.isActive) {
    await db.update(webhookDeliveries)
      .set({ status: "failed" })
      .where(eq(webhookDeliveries.id, deliveryId));
    return;
  }

  const payloadJson = JSON.stringify(delivery.payload);
  const signature = signPayload(payloadJson, subscription.secret);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

    const response = await fetch(subscription.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Event": delivery.event,
        "X-Webhook-Delivery": deliveryId,
      },
      body: payloadJson,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      // Success — mark delivered, reset failure count
      await db.update(webhookDeliveries)
        .set({ status: "delivered", statusCode: response.status, latencyMs, attempt: delivery.attempt + 1 })
        .where(eq(webhookDeliveries.id, deliveryId));

      await db.update(webhookSubscriptions)
        .set({ failureCount: 0, updatedAt: new Date() })
        .where(eq(webhookSubscriptions.id, subscription.id));

      logger.debug({ deliveryId, statusCode: response.status, latencyMs }, "Webhook delivered");
    } else {
      await handleFailure(deliveryId, delivery, subscription, response.status, Date.now() - startTime);
    }
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    await handleFailure(deliveryId, delivery, subscription, 0, latencyMs);
    logger.warn({ deliveryId, err: (err as Error).message }, "Webhook delivery error");
  }
}

async function handleFailure(
  deliveryId: string,
  delivery: typeof webhookDeliveries.$inferSelect,
  subscription: typeof webhookSubscriptions.$inferSelect,
  statusCode: number,
  latencyMs: number,
): Promise<void> {
  const newAttempt = delivery.attempt + 1;
  const newFailureCount = subscription.failureCount + 1;

  if (newAttempt >= MAX_ATTEMPTS) {
    // Max retries exhausted — mark as failed
    await db.update(webhookDeliveries)
      .set({ status: "failed", statusCode, latencyMs, attempt: newAttempt })
      .where(eq(webhookDeliveries.id, deliveryId));
  } else {
    // Schedule retry with exponential backoff
    const delayMs = RETRY_DELAYS_MS[Math.min(newAttempt - 1, RETRY_DELAYS_MS.length - 1)]!;
    const nextRetryAt = new Date(Date.now() + delayMs);

    await db.update(webhookDeliveries)
      .set({ status: "pending", statusCode, latencyMs, attempt: newAttempt, nextRetryAt })
      .where(eq(webhookDeliveries.id, deliveryId));
  }

  // Update subscription failure count + auto-disable
  if (newFailureCount >= MAX_CONSECUTIVE_FAILURES) {
    await db.update(webhookSubscriptions)
      .set({ failureCount: newFailureCount, isActive: false, updatedAt: new Date() })
      .where(eq(webhookSubscriptions.id, subscription.id));
    logger.warn({ subscriptionId: subscription.id, failureCount: newFailureCount }, "Webhook subscription auto-disabled");
  } else {
    await db.update(webhookSubscriptions)
      .set({ failureCount: newFailureCount, updatedAt: new Date() })
      .where(eq(webhookSubscriptions.id, subscription.id));
  }
}

// ── Polling Worker ──────────────────────────────────────────────

let pollTimer: ReturnType<typeof setInterval> | null = null;

async function pollPendingDeliveries(): Promise<void> {
  try {
    const now = new Date();
    const pending = await db
      .select({ id: webhookDeliveries.id })
      .from(webhookDeliveries)
      .where(
        and(
          eq(webhookDeliveries.status, "pending"),
          or(
            lte(webhookDeliveries.nextRetryAt, now),
            eq(webhookDeliveries.attempt, 0), // first attempt (no nextRetryAt)
          ),
        ),
      )
      .limit(10);

    for (const row of pending) {
      await deliverWebhook(row.id);
    }
  } catch (err) {
    logger.error({ err }, "Webhook delivery poll error");
  }
}

export function startWebhookWorker(): void {
  if (pollTimer) return;
  logger.info("Starting webhook delivery worker (2s poll)");
  pollTimer = setInterval(pollPendingDeliveries, POLL_INTERVAL_MS);
}

export function stopWebhookWorker(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    logger.info("Webhook delivery worker stopped");
  }
}
