import type {
  WsEvent,
  WsEventType,
  WsEventMap,
  WsEventHandler,
  StateChangeEvent,
  CommentCreatedEvent,
  AgentOutputChunkEvent,
  AgentStartedEvent,
  AgentCompletedEvent,
  ProposalCreatedEvent,
  ProposalUpdatedEvent,
  CostUpdateEvent,
  ExecutionUpdateEvent,
  PersonaId,
  StoryId,
  TaskId,
  ExecutionId,
} from "@agentops/shared";

// ── Types ─────────────────────────────────────────────────────────

type Unsubscribe = () => void;

type Listeners = {
  [K in WsEventType]: Set<WsEventHandler<WsEventMap[K]>>;
} & {
  "*": Set<WsEventHandler<WsEvent>>;
};

// ── Mock WebSocket Client ─────────────────────────────────────────

class MockWsClient {
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
    "*": new Set(),
  };

  private activeTimers: ReturnType<typeof setTimeout>[] = [];
  private activeIntervals: ReturnType<typeof setInterval>[] = [];

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

  /** Emit an event to all matching subscribers. */
  emit<K extends WsEventType>(event: WsEventMap[K]): void {
    const typed = this.listeners[event.type as K] as Set<WsEventHandler<WsEventMap[K]>>;
    typed.forEach((handler) => handler(event));
    this.listeners["*"].forEach((handler) => handler(event));
  }

  /** Schedule a delayed emit. Returns a cancel function. */
  emitAfter(event: WsEvent, delayMs: number): () => void {
    const timer = setTimeout(() => {
      this.emit(event);
      const idx = this.activeTimers.indexOf(timer);
      if (idx !== -1) this.activeTimers.splice(idx, 1);
    }, delayMs);
    this.activeTimers.push(timer);
    return () => clearTimeout(timer);
  }

  /** Clear all pending timers and intervals (for cleanup/reset). */
  clearAll(): void {
    this.activeTimers.forEach(clearTimeout);
    this.activeIntervals.forEach(clearInterval);
    this.activeTimers = [];
    this.activeIntervals = [];
  }

  /** Remove all subscribers. */
  removeAllListeners(): void {
    for (const key of Object.keys(this.listeners)) {
      (this.listeners[key as keyof Listeners] as Set<unknown>).clear();
    }
  }

  // ── Simulation helpers ────────────────────────────────────────────

  /**
   * Simulate agent output streaming. Emits text chunks at intervals.
   * Returns a cancel function.
   */
  simulateAgentOutput(opts: {
    executionId: ExecutionId;
    personaId: PersonaId;
    chunks: string[];
    intervalMs?: number;
  }): () => void {
    const { executionId, personaId, chunks, intervalMs = 200 } = opts;
    let index = 0;
    const interval = setInterval(() => {
      if (index >= chunks.length) {
        clearInterval(interval);
        const idx = this.activeIntervals.indexOf(interval);
        if (idx !== -1) this.activeIntervals.splice(idx, 1);
        return;
      }
      const event: AgentOutputChunkEvent = {
        type: "agent_output_chunk",
        executionId,
        personaId,
        chunk: chunks[index]!,
        chunkType: "text",
        timestamp: new Date().toISOString(),
      };
      this.emit(event);
      index++;
    }, intervalMs);
    this.activeIntervals.push(interval);
    return () => clearInterval(interval);
  }

  /**
   * Simulate a cost ticker. Emits cost_update events at intervals.
   * Returns a cancel function.
   */
  simulateCostTicker(opts: {
    baseTodayCost?: number;
    baseMonthCost?: number;
    incrementPerTick?: number;
    intervalMs?: number;
  }): () => void {
    const {
      baseTodayCost = 2.83,
      baseMonthCost = 28.50,
      incrementPerTick = 0.01,
      intervalMs = 3000,
    } = opts;
    let todayCost = baseTodayCost;
    let monthCost = baseMonthCost;
    const interval = setInterval(() => {
      todayCost += incrementPerTick;
      monthCost += incrementPerTick;
      const event: CostUpdateEvent = {
        type: "cost_update",
        todayCostUsd: Math.round(todayCost * 100) / 100,
        monthCostUsd: Math.round(monthCost * 100) / 100,
        timestamp: new Date().toISOString(),
      };
      this.emit(event);
    }, intervalMs);
    this.activeIntervals.push(interval);
    return () => clearInterval(interval);
  }

  /**
   * Simulate a full agent lifecycle: started → output chunks → completed.
   * Returns a cancel function.
   */
  simulateAgentRun(opts: {
    executionId: ExecutionId;
    personaId: PersonaId;
    targetId: StoryId | TaskId;
    targetType: "story" | "task";
    taskTitle: string;
    chunks: string[];
    chunkIntervalMs?: number;
    costUsd?: number;
  }): () => void {
    const {
      executionId,
      personaId,
      targetId,
      targetType,
      taskTitle,
      chunks,
      chunkIntervalMs = 200,
      costUsd = 0.42,
    } = opts;

    const cancels: (() => void)[] = [];

    // Agent started
    this.emit<"agent_started">({
      type: "agent_started",
      executionId,
      personaId,
      targetId,
      targetType,
      taskTitle,
      timestamp: new Date().toISOString(),
    });

    // Execution update: running
    this.emit<"execution_update">({
      type: "execution_update",
      executionId,
      status: "running",
      timestamp: new Date().toISOString(),
    });

    // Stream output chunks
    const cancelOutput = this.simulateAgentOutput({
      executionId,
      personaId,
      chunks,
      intervalMs: chunkIntervalMs,
    });
    cancels.push(cancelOutput);

    // Agent completed after all chunks
    const totalDuration = chunks.length * chunkIntervalMs + 500;
    const cancelComplete = this.emitAfter(
      {
        type: "agent_completed",
        executionId,
        personaId,
        targetId,
        targetType,
        outcome: "success",
        durationMs: totalDuration,
        costUsd,
        timestamp: new Date(Date.now() + totalDuration).toISOString(),
      } satisfies AgentCompletedEvent,
      totalDuration,
    );
    cancels.push(cancelComplete);

    // Execution update: completed
    const cancelExecUpdate = this.emitAfter(
      {
        type: "execution_update",
        executionId,
        status: "completed",
        timestamp: new Date(Date.now() + totalDuration).toISOString(),
      } satisfies ExecutionUpdateEvent,
      totalDuration + 100,
    );
    cancels.push(cancelExecUpdate);

    return () => cancels.forEach((cancel) => cancel());
  }
}

// ── Singleton instance ────────────────────────────────────────────

export const mockWs = new MockWsClient();

// ── Event factory helpers ─────────────────────────────────────────

export function createStateChangeEvent(
  opts: Omit<StateChangeEvent, "type" | "timestamp">,
): StateChangeEvent {
  return { type: "state_change", ...opts, timestamp: new Date().toISOString() };
}

export function createCommentCreatedEvent(
  opts: Omit<CommentCreatedEvent, "type" | "timestamp">,
): CommentCreatedEvent {
  return { type: "comment_created", ...opts, timestamp: new Date().toISOString() };
}

export function createAgentStartedEvent(
  opts: Omit<AgentStartedEvent, "type" | "timestamp">,
): AgentStartedEvent {
  return { type: "agent_started", ...opts, timestamp: new Date().toISOString() };
}

export function createAgentCompletedEvent(
  opts: Omit<AgentCompletedEvent, "type" | "timestamp">,
): AgentCompletedEvent {
  return { type: "agent_completed", ...opts, timestamp: new Date().toISOString() };
}

export function createProposalCreatedEvent(
  opts: Omit<ProposalCreatedEvent, "type" | "timestamp">,
): ProposalCreatedEvent {
  return { type: "proposal_created", ...opts, timestamp: new Date().toISOString() };
}

export function createProposalUpdatedEvent(
  opts: Omit<ProposalUpdatedEvent, "type" | "timestamp">,
): ProposalUpdatedEvent {
  return { type: "proposal_updated", ...opts, timestamp: new Date().toISOString() };
}

export function createCostUpdateEvent(
  opts: Omit<CostUpdateEvent, "type" | "timestamp">,
): CostUpdateEvent {
  return { type: "cost_update", ...opts, timestamp: new Date().toISOString() };
}

export function createExecutionUpdateEvent(
  opts: Omit<ExecutionUpdateEvent, "type" | "timestamp">,
): ExecutionUpdateEvent {
  return { type: "execution_update", ...opts, timestamp: new Date().toISOString() };
}

// ── Re-export types for convenience ───────────────────────────────

export type { WsEvent, WsEventType, WsEventMap, WsEventHandler, Unsubscribe };
