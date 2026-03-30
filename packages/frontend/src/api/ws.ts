/**
 * Unified WebSocket layer — delegates to mock or real WS client
 * based on the current apiMode setting.
 */

import type { WsEvent, WsEventType, WsEventMap, WsEventHandler } from "@agentops/shared";
import { useUIStore } from "@/stores/ui-store";
import { mockWs } from "@/mocks/ws";
import { realWs } from "@/api/ws-client";

type Unsubscribe = () => void;

function getClient() {
  return useUIStore.getState().apiMode === "api" ? realWs : mockWs;
}

/** Subscribe to a specific event type on the active WS client. */
export function subscribe<K extends WsEventType>(
  eventType: K,
  handler: WsEventHandler<WsEventMap[K]>,
): Unsubscribe {
  return getClient().subscribe(eventType, handler);
}

/** Subscribe to ALL events on the active WS client. */
export function subscribeAll(handler: WsEventHandler<WsEvent>): Unsubscribe {
  return getClient().subscribeAll(handler);
}

/** Register a callback that fires on WebSocket reconnection. */
export function onReconnect(callback: () => void): Unsubscribe {
  return realWs.onReconnect(callback);
}

/**
 * Initialize the WS connection when in API mode.
 * Call this once at app startup or when apiMode changes.
 */
export function initWsConnection(): void {
  const mode = useUIStore.getState().apiMode;
  if (mode === "api") {
    realWs.connect();
  } else {
    realWs.disconnect();
  }
}
