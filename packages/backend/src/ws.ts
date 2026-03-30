import type { FastifyInstance } from "fastify";
import websocket from "@fastify/websocket";
import type { WebSocket } from "ws";
import type { WsEvent } from "@agentops/shared";

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
 * Returns the number of currently connected WebSocket clients.
 */
export function getClientCount(): number {
  return clients.size;
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
