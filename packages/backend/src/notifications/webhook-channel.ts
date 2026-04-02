/**
 * Webhook Channel — bridges the notification system to outbound webhooks.
 *
 * When a notification is broadcast via WebSocket, this channel also emits
 * a corresponding `notification.*` event on the event bus. The existing
 * webhook bridge (event-bus -> webhook-delivery) then picks up these events
 * and creates delivery records for any subscriptions listening to
 * `notification.agent_completed`, `notification.agent_errored`, or
 * `notification.budget_threshold`.
 *
 * This module wraps `broadcastNotification` so that every notification
 * automatically flows to webhook subscribers without callers needing to
 * change their code.
 */

import type {
  NotificationEventType,
  NotificationPriority,
  Notification,
  ProjectId,
  WorkItemId,
  ExecutionId,
  AgentId,
} from "@agentops/shared";
import { eventBus } from "../events/event-bus.js";
import type { AppEvent } from "../events/event-bus.js";
import { logger } from "../logger.js";

// ── Notification-to-event mapping ─────────────────────────────────

/** Map from WS notification types to event bus event types. */
const NOTIFICATION_EVENT_MAP: Record<string, AppEvent["type"] | null> = {
  agent_completed: "notification.agent_completed",
  agent_errored: "notification.agent_errored",
  budget_threshold: "notification.budget_threshold",
  // proposal_needs_approval does not have a corresponding webhook event (yet)
  proposal_needs_approval: null,
};

export interface NotificationOpts {
  type: NotificationEventType;
  priority: NotificationPriority;
  title: string;
  description?: string;
  projectId?: string;
  workItemId?: string;
  executionId?: string;
  metadata?: Record<string, string>;
}

/**
 * Emit a `notification.*` event on the event bus for the given notification.
 * Only emits for notification types that have a mapping in the event catalog.
 *
 * @param notification The notification object (already created by broadcastNotification)
 * @param opts The original options passed to broadcastNotification
 */
export function emitNotificationEvent(
  notification: Notification,
  opts: NotificationOpts,
): void {
  const eventType = NOTIFICATION_EVENT_MAP[opts.type];
  if (!eventType) return; // No webhook event for this notification type

  try {
    switch (eventType) {
      case "notification.agent_completed":
        eventBus.emit({
          type: "notification.agent_completed",
          notificationId: notification.id,
          executionId: (opts.executionId ?? "") as ExecutionId,
          agentId: (opts.metadata?.["agentId"] ?? "") as unknown as AgentId,
          projectId: (opts.projectId ?? null) as ProjectId | null,
          workItemId: (opts.workItemId ?? null) as WorkItemId | null,
          priority: opts.priority,
          title: opts.title,
          description: opts.description,
          timestamp: notification.createdAt,
        });
        break;

      case "notification.agent_errored":
        eventBus.emit({
          type: "notification.agent_errored",
          notificationId: notification.id,
          executionId: (opts.executionId ?? "") as ExecutionId,
          agentId: (opts.metadata?.["agentId"] ?? "") as unknown as AgentId,
          projectId: (opts.projectId ?? null) as ProjectId | null,
          workItemId: (opts.workItemId ?? null) as WorkItemId | null,
          priority: opts.priority,
          title: opts.title,
          description: opts.description,
          timestamp: notification.createdAt,
        });
        break;

      case "notification.budget_threshold":
        eventBus.emit({
          type: "notification.budget_threshold",
          notificationId: notification.id,
          projectId: (opts.projectId ?? null) as ProjectId | null,
          priority: opts.priority,
          title: opts.title,
          description: opts.description,
          metadata: opts.metadata,
          timestamp: notification.createdAt,
        });
        break;
    }

    logger.debug(
      { eventType, notificationId: notification.id },
      "Notification event emitted to event bus",
    );
  } catch (err) {
    logger.error(
      { err, eventType, notificationId: notification.id },
      "Failed to emit notification event to event bus",
    );
  }
}

/**
 * Initialize the webhook notification channel.
 * Call once at server startup — this is a no-op registration log since the
 * actual integration is done by calling `emitNotificationEvent` from
 * `broadcastNotification` in ws.ts.
 */
export function initWebhookNotificationChannel(): void {
  logger.info(
    "Webhook notification channel initialized — notification.* events will flow to webhook bridge",
  );
}
