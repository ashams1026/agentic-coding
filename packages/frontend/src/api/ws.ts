/**
 * Unified WebSocket layer — delegates to the real WS client.
 */

import type { WsEvent, WsEventType, WsEventMap, WsEventHandler } from "@agentops/shared";
import { realWs } from "@/api/ws-client";

type Unsubscribe = () => void;

/** Subscribe to a specific event type on the WS client. */
export function subscribe<K extends WsEventType>(
  eventType: K,
  handler: WsEventHandler<WsEventMap[K]>,
): Unsubscribe {
  return realWs.subscribe(eventType, handler);
}

/** Subscribe to ALL events on the WS client. */
export function subscribeAll(handler: WsEventHandler<WsEvent>): Unsubscribe {
  return realWs.subscribeAll(handler);
}

/** Register a callback that fires on WebSocket reconnection. */
export function onReconnect(callback: () => void): Unsubscribe {
  return realWs.onReconnect(callback);
}

/**
 * Initialize the WS connection.
 * Call this once at app startup.
 */
export function initWsConnection(): void {
  realWs.connect();
}
