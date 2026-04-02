/**
 * Real WebSocket client — connects to the backend /ws endpoint.
 * Implements the same subscribe/subscribeAll interface as MockWsClient
 * so consumers can switch transparently.
 */

import type {
  WsEvent,
  WsEventType,
  WsEventMap,
  WsEventHandler,
} from "@agentops/shared";
import { API_BASE_URL } from "./client";

export type WsConnectionStatus = "connected" | "reconnecting" | "disconnected";

type Unsubscribe = () => void;

type Listeners = {
  [K in WsEventType]: Set<WsEventHandler<WsEventMap[K]>>;
} & {
  "*": Set<WsEventHandler<WsEvent>>;
};

class RealWsClient {
  private listeners: Listeners = {
    state_change: new Set(),
    comment_created: new Set(),
    agent_output_chunk: new Set(),
    agent_started: new Set(),
    agent_completed: new Set(),
    proposal_created: new Set(),
    proposal_updated: new Set(),
    cost_update: new Set(),
    execution_update: new Set(),
    file_changed: new Set(),
    subagent_started: new Set(),
    subagent_completed: new Set(),
    agent_progress: new Set(),
    context_usage: new Set(),
    notification: new Set(),
    "*": new Set(),
  };

  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private reconnectAttempt = 0;
  private reconnectCallbacks = new Set<() => void>();
  private _status: WsConnectionStatus = "disconnected";
  private statusListeners = new Set<(status: WsConnectionStatus) => void>();

  /** Connect to the backend WebSocket server. */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return; // already connected or connecting
    }

    const wsUrl = API_BASE_URL.replace(/^http/, "ws") + "/ws";
    this.ws = new WebSocket(wsUrl);
    this.shouldReconnect = true;

    const isReconnect = this.shouldReconnect && this.reconnectTimer !== null || this.listeners["*"].size > 0;

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.setStatus("connected");
      if (isReconnect) {
        this.reconnectCallbacks.forEach((cb) => cb());
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>;
        const type = data.type as string;
        if (type && type !== "connected") {
          this.dispatch(data as unknown as WsEvent);
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (this.shouldReconnect) {
        this.setStatus("reconnecting");
        this.scheduleReconnect();
      } else {
        this.setStatus("disconnected");
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror, triggering reconnect
    };
  }

  /** Disconnect from the server. */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("disconnected");
  }

  /** Get current connection status. */
  getStatus(): WsConnectionStatus {
    return this._status;
  }

  /** Subscribe to connection status changes. */
  onStatusChange(callback: (status: WsConnectionStatus) => void): Unsubscribe {
    this.statusListeners.add(callback);
    return () => { this.statusListeners.delete(callback); };
  }

  private setStatus(status: WsConnectionStatus): void {
    if (this._status === status) return;
    this._status = status;
    this.statusListeners.forEach((cb) => cb(status));
  }

  /** Subscribe to a specific event type. Returns an unsubscribe function. */
  subscribe<K extends WsEventType>(
    eventType: K,
    handler: WsEventHandler<WsEventMap[K]>,
  ): Unsubscribe {
    const set = this.listeners[eventType] as Set<WsEventHandler<WsEventMap[K]>>;
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  }

  /** Subscribe to ALL events. Returns an unsubscribe function. */
  subscribeAll(handler: WsEventHandler<WsEvent>): Unsubscribe {
    this.listeners["*"].add(handler);
    return () => {
      this.listeners["*"].delete(handler);
    };
  }

  /** Register a callback that fires on WebSocket reconnection. */
  onReconnect(callback: () => void): Unsubscribe {
    this.reconnectCallbacks.add(callback);
    return () => {
      this.reconnectCallbacks.delete(callback);
    };
  }

  private dispatch(event: WsEvent): void {
    const typed = this.listeners[event.type] as Set<WsEventHandler<WsEventMap[typeof event.type]>>;
    typed.forEach((handler) => handler(event as never));
    this.listeners["*"].forEach((handler) => handler(event));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const base = Math.min(1000 * 2 ** this.reconnectAttempt, 30_000);
    const jitter = base * 0.2 * Math.random();
    const delay = base + jitter;
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

export const realWs = new RealWsClient();
