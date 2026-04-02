import type { FastifyInstance } from "fastify";
import websocket from "@fastify/websocket";
import type { WebSocket } from "ws";
import type { WsEvent, Notification, NotificationEventType, NotificationPriority, ProjectId, WorkItemId, ExecutionId } from "@agentops/shared";
import crypto from "node:crypto";

const clients = new Set<WebSocket>();

/**
 * Broadcast a WsEvent to all connected WebSocket clients.
 * Safe to call even if no clients are connected.
 */
export function broadcast(event: WsEvent): void {
  const message = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

/**
 * Broadcast a notification event to all connected clients.
 * Creates a Notification object and wraps it in a NotificationEvent.
 */
export function broadcastNotification(opts: {
  type: NotificationEventType;
  priority: NotificationPriority;
  title: string;
  description?: string;
  projectId?: string;
  workItemId?: string;
  executionId?: string;
}): void {
  const notification: Notification = {
    id: `ntf-${crypto.randomBytes(6).toString("hex")}`,
    type: opts.type,
    priority: opts.priority,
    title: opts.title,
    description: opts.description,
    projectId: opts.projectId as ProjectId | undefined,
    workItemId: opts.workItemId as WorkItemId | undefined,
    executionId: opts.executionId as ExecutionId | undefined,
    read: false,
    createdAt: new Date().toISOString(),
  };
  broadcast({
    type: "notification",
    notification,
    timestamp: notification.createdAt,
  });
}

/**
 * Returns the number of currently connected WebSocket clients.
 */
export function getClientCount(): number {
  return clients.size;
}

/**
 * Close all connected WebSocket clients with code 1001 (Going Away).
 * Used during graceful shutdown.
 */
export function closeAllClients(): void {
  for (const client of clients) {
    try {
      client.close(1001, "Server shutting down");
    } catch {
      // Client may already be closed
    }
  }
  clients.clear();
}

/**
 * Register the WebSocket plugin and /ws route on the Fastify instance.
 */
export async function registerWebSocket(app: FastifyInstance): Promise<void> {
  await app.register(websocket);

  app.get("/ws", { websocket: true }, (socket, _request) => {
    clients.add(socket);
    app.log.info(`WebSocket client connected (total: ${clients.size})`);

    socket.on("close", () => {
      clients.delete(socket);
      app.log.info(`WebSocket client disconnected (total: ${clients.size})`);
    });

    socket.on("error", (err: Error) => {
      app.log.error({ err }, "WebSocket client error");
      clients.delete(socket);
    });

    // Send a welcome message so the client knows it's connected
    socket.send(JSON.stringify({ type: "connected", timestamp: new Date().toISOString() }));
  });
}
