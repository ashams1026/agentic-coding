/**
 * Typed Event Bus — canonical event source for webhooks and notifications.
 *
 * Events are emitted from execution lifecycle and work item state changes.
 * Listeners (webhook delivery, future notification channels) subscribe here.
 */

import { EventEmitter } from "node:events";
import type { ExecutionId, WorkItemId, AgentId, ProjectId } from "@agentops/shared";
import { logger } from "../logger.js";

// ── Event Catalog ───────────────────────────────────────────────

export interface ExecutionStartedEvent {
  type: "execution.started";
  executionId: ExecutionId;
  workItemId: WorkItemId | null;
  agentId: AgentId;
  projectId: ProjectId | null;
  timestamp: string;
}

export interface ExecutionCompletedEvent {
  type: "execution.completed";
  executionId: ExecutionId;
  workItemId: WorkItemId | null;
  agentId: AgentId;
  projectId: ProjectId | null;
  outcome: string;
  costUsd: number;
  durationMs: number;
  summary: string;
  timestamp: string;
}

export interface ExecutionFailedEvent {
  type: "execution.failed";
  executionId: ExecutionId;
  workItemId: WorkItemId | null;
  agentId: AgentId;
  projectId: ProjectId | null;
  error: string;
  timestamp: string;
}

export interface WorkItemStateChangedEvent {
  type: "work_item.state_changed";
  workItemId: WorkItemId;
  projectId: ProjectId;
  fromState: string;
  toState: string;
  timestamp: string;
}

export type AppEvent =
  | ExecutionStartedEvent
  | ExecutionCompletedEvent
  | ExecutionFailedEvent
  | WorkItemStateChangedEvent;

export type AppEventType = AppEvent["type"];

// ── Event Bus ───────────────────────────────────────────────────

type EventHandler = (event: AppEvent) => void;

class TypedEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  emit(event: AppEvent): void {
    logger.debug({ eventType: event.type }, "EventBus emit");
    this.emitter.emit(event.type, event);
    this.emitter.emit("*", event); // wildcard for listeners that want all events
  }

  on(eventType: AppEventType | "*", handler: EventHandler): void {
    this.emitter.on(eventType, handler);
  }

  off(eventType: AppEventType | "*", handler: EventHandler): void {
    this.emitter.off(eventType, handler);
  }

  onAny(handler: EventHandler): void {
    this.emitter.on("*", handler);
  }
}

// Singleton instance
export const eventBus = new TypedEventBus();
