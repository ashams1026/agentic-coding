/**
 * Webhook Bridge — connects the EventBus to webhook delivery.
 *
 * Listens for all events on the event bus. For each event, queries matching
 * active webhook subscriptions and creates delivery records for the worker
 * to pick up.
 */

import { eq, and } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "../db/connection.js";
import { webhookSubscriptions, webhookDeliveries } from "../db/schema.js";
import { eventBus } from "./event-bus.js";
import type { AppEvent } from "./event-bus.js";
import { logger } from "../logger.js";

function generateDeliveryId(): string {
  return `whd-${randomBytes(6).toString("base64url")}`;
}

async function onEvent(event: AppEvent): Promise<void> {
  try {
    // Find all active subscriptions that include this event type
    const subs = await db
      .select({ id: webhookSubscriptions.id, events: webhookSubscriptions.events })
      .from(webhookSubscriptions)
      .where(
        and(
          eq(webhookSubscriptions.isActive, true),
        ),
      );

    // Filter subscriptions whose events array includes this event type
    const matching = subs.filter((s) => {
      const events = s.events as string[];
      return events.includes(event.type);
    });

    if (matching.length === 0) return;

    const now = new Date();

    // Create delivery records for each matching subscription
    for (const sub of matching) {
      const deliveryId = generateDeliveryId();
      await db.insert(webhookDeliveries).values({
        id: deliveryId,
        subscriptionId: sub.id,
        event: event.type,
        payload: event as unknown as Record<string, unknown>,
        status: "pending",
        attempt: 0,
        createdAt: now,
      });
    }

    logger.debug(
      { eventType: event.type, subscriptions: matching.length },
      "Webhook deliveries created",
    );
  } catch (err) {
    logger.error({ err, eventType: event.type }, "Failed to create webhook deliveries");
  }
}

/**
 * Initialize the webhook bridge — subscribes to all events on the event bus.
 * Call once at server startup after event bus and schema are ready.
 */
export function initWebhookBridge(): void {
  eventBus.onAny(onEvent);
  logger.info("Webhook bridge initialized — listening for events");
}
