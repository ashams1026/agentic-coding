/**
 * Execution manager — orchestrates agent execution lifecycle.
 *
 * Creates execution records, spawns the executor, streams events
 * to WebSocket clients, and updates the execution on completion.
 */

import { eq } from "drizzle-orm";
import { executions, workItems, personas, projects, comments } from "../db/schema.js";
import { createId } from "@agentops/shared";
import type {
  ExecutionId,
  WorkItemId,
  PersonaId,
  ProjectId,
  CommentId,
  ExecutionOutcome,
  ExecutionContextEntry,
  WsEvent,
} from "@agentops/shared";
import type { AgentExecutor, AgentTask, AgentEvent } from "./types.js";
import type { ExecutorRegistry } from "@agentops/core";
import { logger } from "../logger.js";
import { auditAgentDispatch, auditAgentComplete, auditCostEvent } from "../audit.js";
import { trackExecution, onComplete, getProjectCostSummary } from "./concurrency.js";
import { runRouter } from "./router.js";
import { dispatchForState } from "./dispatch.js";

// ── Types ────────────────────────────────────────────────────────

/** Factory function that creates an executor for the given mode. */
export type ExecutorFactory = (mode: string) => AgentExecutor;

/** Type for the database handle (Drizzle instance). */
export type DbHandle = {
  select: (...args: unknown[]) => unknown;
  insert: (...args: unknown[]) => unknown;
  update: (...args: unknown[]) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

/** Type for the broadcast function. */
export type BroadcastFn = (event: WsEvent) => void;

// ── Pure helpers ─────────────────────────────────────────────────

function toChunkType(event: AgentEvent): "text" | "code" | "thinking" | "tool_call" | "tool_result" {
  switch (event.type) {
    case "thinking": return "thinking";
    case "tool_use": return "tool_call";
    case "tool_result": return "tool_result";
    default: return "text";
  }
}

function eventToChunk(event: AgentEvent): string {
  switch (event.type) {
    case "text": return event.content;
    case "thinking": return event.content;
    case "tool_use": return `${event.toolName}(${JSON.stringify(event.input)})`;
    case "tool_result": return event.output;
    case "error": return `Error: ${event.message}`;
    case "result": return event.summary;
    case "partial": return "";
    case "progress": return "";
    case "rate_limit": return "";
    case "checkpoint": return "";
  }
}

// ── ExecutionManager class ───────────────────────────────────────

const MAX_TRANSITIONS_PER_HOUR = 10;
const MAX_REJECTIONS = 3;
const LOOP_HISTORY_SIZE = 6;

export class ExecutionManager {
  private executor: AgentExecutor;
  private runtimeOverride: string | null = null;
  private transitionLog = new Map<string, number[]>();
  private stateHistory = new Map<string, string[]>();
  private registry: ExecutorRegistry;
  private db: DbHandle;
  private broadcastFn: BroadcastFn;

  constructor(registry: ExecutorRegistry, dbHandle: DbHandle, broadcastFn: BroadcastFn) {
    this.registry = registry;
    this.db = dbHandle;
    this.broadcastFn = broadcastFn;
    this.executor = registry.get(this.getExecutorMode());
  }

  /** Get the executor registry (for listing available modes). */
  getRegistry(): ExecutorRegistry {
    return this.registry;
  }

  // ── Executor selection ──────────────────────────────────────

  /** Resolve executor mode: name of the registered executor to use. */
  getExecutorMode(): string {
    const nodeEnv = process.env["NODE_ENV"] ?? "development";
    if (nodeEnv === "test") return "mock";
    if (nodeEnv === "production") return "claude";
    if (this.runtimeOverride) return this.runtimeOverride;
    const envOverride = process.env["AGENTOPS_EXECUTOR"];
    if (envOverride === "mock") return "mock";
    return "claude";
  }

  /** Set executor mode at runtime (dev only). Recreates the executor from registry. */
  setExecutorMode(mode: string): void {
    const nodeEnv = process.env["NODE_ENV"] ?? "development";
    if (nodeEnv === "production") return;
    if (!this.registry.has(mode)) {
      throw new Error(`Unknown executor mode "${mode}". Available: ${this.registry.list().join(", ")}`);
    }
    this.runtimeOverride = mode;
    this.executor = this.registry.get(mode);
    logger.info({ mode }, "Executor mode changed at runtime");
  }

  /** List available executor modes from the registry. */
  listExecutorModes(): string[] {
    return this.registry.list();
  }

  // ── Transition rate limiter ─────────────────────────────────

  canTransition(workItemId: string): boolean {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const timestamps = this.transitionLog.get(workItemId) ?? [];
    const recent = timestamps.filter((t) => t > oneHourAgo);
    this.transitionLog.set(workItemId, recent);
    return recent.length < MAX_TRANSITIONS_PER_HOUR;
  }

  recordTransition(workItemId: string): void {
    const timestamps = this.transitionLog.get(workItemId) ?? [];
    timestamps.push(Date.now());
    this.transitionLog.set(workItemId, timestamps);
  }

  getTransitionCount(workItemId: string): number {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const timestamps = this.transitionLog.get(workItemId) ?? [];
    return timestamps.filter((t) => t > oneHourAgo).length;
  }

  clearTransitionLog(): void {
    this.transitionLog.clear();
  }

  // ── Transition loop detection ───────────────────────────────

  recordStateForLoop(workItemId: string, state: string): void {
    const history = this.stateHistory.get(workItemId) ?? [];
    history.push(state);
    if (history.length > LOOP_HISTORY_SIZE) {
      history.splice(0, history.length - LOOP_HISTORY_SIZE);
    }
    this.stateHistory.set(workItemId, history);
  }

  detectLoop(workItemId: string): boolean {
    const history = this.stateHistory.get(workItemId) ?? [];
    if (history.length < 3) return false;

    const counts = new Map<string, number>();
    for (const state of history) {
      const count = (counts.get(state) ?? 0) + 1;
      if (count >= 3) return true;
      counts.set(state, count);
    }
    return false;
  }

  clearStateHistory(): void {
    this.stateHistory.clear();
  }

  /** Get loop detection state history for a work item. */
  getStateHistory(workItemId: string): string[] {
    return this.stateHistory.get(workItemId) ?? [];
  }

  // ── Execution context helpers ───────────────────────────────

  async appendExecutionContext(
    workItemId: string,
    entry: ExecutionContextEntry,
  ): Promise<void> {
    const [item] = await (this.db as any)
      .select({ executionContext: workItems.executionContext })
      .from(workItems)
      .where(eq(workItems.id, workItemId));

    if (!item) return;

    const ctx = (item.executionContext as ExecutionContextEntry[]) ?? [];
    ctx.push(entry);

    await (this.db as any)
      .update(workItems)
      .set({ executionContext: ctx, updatedAt: new Date() })
      .where(eq(workItems.id, workItemId));
  }

  async handleRejection(
    workItemId: string,
    reason: string,
    severity: "low" | "medium" | "high" = "medium",
    hint: string = "",
  ): Promise<{ targetState: string; retryCount: number; blocked: boolean }> {
    const [item] = await (this.db as any)
      .select({ executionContext: workItems.executionContext })
      .from(workItems)
      .where(eq(workItems.id, workItemId));

    if (!item) return { targetState: "In Progress", retryCount: 0, blocked: false };

    const ctx = (item.executionContext as ExecutionContextEntry[]) ?? [];
    const retryCount = ctx.filter((e: ExecutionContextEntry) => e.rejectionPayload !== null).length + 1;
    const blocked = retryCount >= MAX_REJECTIONS;
    const targetState = blocked ? "Blocked" : "In Progress";

    const rejectionEntry: ExecutionContextEntry = {
      executionId: `rejection-${retryCount}` as ExecutionId,
      summary: reason,
      outcome: "rejected",
      rejectionPayload: {
        reason,
        severity,
        hint,
        retryCount,
      },
    };

    ctx.push(rejectionEntry);

    await (this.db as any)
      .update(workItems)
      .set({ executionContext: ctx, updatedAt: new Date() })
      .where(eq(workItems.id, workItemId));

    return { targetState, retryCount, blocked };
  }

  // ── Build AgentTask from DB ─────────────────────────────────

  private async buildAgentTask(workItemId: string): Promise<AgentTask | null> {
    const [item] = await (this.db as any)
      .select()
      .from(workItems)
      .where(eq(workItems.id, workItemId));

    if (!item) return null;

    const parentChain: Array<{ id: WorkItemId; title: string }> = [];
    let currentParentId = item.parentId;
    while (currentParentId) {
      const [parent] = await (this.db as any)
        .select({ id: workItems.id, title: workItems.title, parentId: workItems.parentId })
        .from(workItems)
        .where(eq(workItems.id, currentParentId));
      if (!parent) break;
      parentChain.unshift({ id: parent.id as WorkItemId, title: parent.title });
      currentParentId = parent.parentId;
    }

    return {
      workItemId: item.id as WorkItemId,
      context: {
        title: item.title,
        description: item.description,
        currentState: item.currentState,
        parentChain,
        inheritedContext: item.context,
      },
      executionHistory: item.executionContext as ExecutionContextEntry[],
    };
  }

  // ── Run execution ───────────────────────────────────────────

  async runExecution(
    workItemId: string,
    personaId: string,
  ): Promise<ExecutionId> {
    const now = new Date();
    const executionId = createId.execution();

    const [persona] = await (this.db as any)
      .select()
      .from(personas)
      .where(eq(personas.id, personaId));

    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    const [item] = await (this.db as any)
      .select({ projectId: workItems.projectId, title: workItems.title })
      .from(workItems)
      .where(eq(workItems.id, workItemId));

    if (!item) {
      throw new Error(`Work item ${workItemId} not found`);
    }

    const [project] = await (this.db as any)
      .select()
      .from(projects)
      .where(eq(projects.id, item.projectId));

    if (!project) {
      throw new Error(`Project ${item.projectId} not found`);
    }

    const allPersonaRows = await (this.db as any).select().from(personas);

    await (this.db as any).insert(executions).values({
      id: executionId,
      workItemId,
      personaId,
      status: "running",
      startedAt: now,
      costUsd: 0,
      durationMs: 0,
      summary: "",
      outcome: null,
      rejectionPayload: null,
      logs: "",
    });

    trackExecution(executionId);

    this.broadcastFn({
      type: "agent_started",
      executionId: executionId as ExecutionId,
      personaId: personaId as PersonaId,
      workItemId: workItemId as WorkItemId,
      workItemTitle: item.title,
      timestamp: now.toISOString(),
    });

    auditAgentDispatch({
      workItemId,
      executionId,
      personaId,
      personaName: persona.name,
    });

    const task = await this.buildAgentTask(workItemId);
    if (!task) {
      await (this.db as any)
        .update(executions)
        .set({ status: "failed", summary: "Work item not found", completedAt: new Date() })
        .where(eq(executions.id, executionId));
      return executionId as ExecutionId;
    }

    const personaEntity = {
      id: persona.id as PersonaId,
      name: persona.name,
      description: persona.description,
      avatar: persona.avatar,
      systemPrompt: persona.systemPrompt,
      model: persona.model as "opus" | "sonnet" | "haiku",
      allowedTools: persona.allowedTools,
      mcpTools: persona.mcpTools,
      skills: persona.skills,
      subagents: persona.subagents ?? [],
      maxBudgetPerRun: persona.maxBudgetPerRun,
      settings: persona.settings,
    };

    const projectEntity = {
      id: project.id as ProjectId,
      name: project.name,
      path: project.path,
      settings: project.settings,
      createdAt: project.createdAt.toISOString(),
    };

    const allPersonaEntities = allPersonaRows.map((p: typeof persona) => ({
      id: p.id as PersonaId,
      name: p.name,
      description: p.description,
      avatar: p.avatar,
      systemPrompt: p.systemPrompt,
      model: p.model as "opus" | "sonnet" | "haiku",
      allowedTools: p.allowedTools,
      mcpTools: p.mcpTools,
      skills: p.skills,
      subagents: p.subagents ?? [],
      maxBudgetPerRun: p.maxBudgetPerRun,
      settings: p.settings,
    }));

    this.runExecutionStream(
      executionId,
      task,
      personaEntity,
      projectEntity,
      allPersonaEntities,
    ).catch((err) => {
      logger.error({ err, executionId }, "Execution failed");
    });

    return executionId as ExecutionId;
  }

  // ── Stream execution events ─────────────────────────────────

  private async runExecutionStream(
    executionId: string,
    task: AgentTask,
    persona: Parameters<AgentExecutor["spawn"]>[1],
    project: Parameters<AgentExecutor["spawn"]>[2],
    allPersonas: Parameters<AgentExecutor["spawn"]>[1][],
  ): Promise<void> {
    let logs = "";
    let finalOutcome: ExecutionOutcome = "failure";
    let finalSummary = "";
    let finalCostUsd = 0;
    let finalDurationMs = 0;
    let checkpointMessageId: string | null = null;
    let structuredOutput: Record<string, unknown> | null = null;

    try {
      const events = this.executor.spawn(task, persona, project, {
        executionId,
        model: persona.model,
        maxBudget: persona.maxBudgetPerRun,
        tools: persona.allowedTools.length > 0 ? persona.allowedTools : [],
        allPersonas,
      });

      for await (const event of events) {
        if (event.type === "checkpoint") {
          checkpointMessageId = event.messageId;
          continue;
        }

        if (event.type === "partial") {
          this.broadcastFn({
            type: "agent_output_chunk",
            executionId: executionId as ExecutionId,
            personaId: persona.id as PersonaId,
            chunk: event.content,
            chunkType: "text",
            timestamp: new Date().toISOString(),
          });
          continue;
        }

        if (event.type === "rate_limit") {
          const retrySeconds = Math.ceil(event.retryDelayMs / 1000);
          this.broadcastFn({
            type: "agent_output_chunk",
            executionId: executionId as ExecutionId,
            personaId: persona.id as PersonaId,
            chunk: `⏳ Rate limited — retrying in ${retrySeconds}s (attempt ${event.attempt}/${event.maxRetries})`,
            chunkType: "text",
            timestamp: new Date().toISOString(),
          });
          continue;
        }

        if (event.type === "progress") {
          this.broadcastFn({
            type: "agent_progress",
            executionId: executionId as ExecutionId,
            description: event.description,
            summary: event.summary,
            totalTokens: event.totalTokens,
            toolUses: event.toolUses,
            durationMs: event.durationMs,
            timestamp: new Date().toISOString(),
          });
          continue;
        }

        const chunk = eventToChunk(event);
        logs += chunk + "\n";

        this.broadcastFn({
          type: "agent_output_chunk",
          executionId: executionId as ExecutionId,
          personaId: persona.id as PersonaId,
          chunk,
          chunkType: toChunkType(event),
          timestamp: new Date().toISOString(),
        });

        if (event.type === "result") {
          finalOutcome = event.outcome;
          finalSummary = event.summary;
          finalCostUsd = event.costUsd;
          finalDurationMs = event.durationMs;
          if (event.structuredOutput && typeof event.structuredOutput === "object") {
            structuredOutput = event.structuredOutput as Record<string, unknown>;
          }
        }

        if (event.type === "error") {
          finalSummary = event.message;
        }
      }

      await (this.db as any)
        .update(executions)
        .set({
          status: "completed",
          completedAt: new Date(),
          costUsd: Math.round(finalCostUsd * 100),
          durationMs: finalDurationMs,
          summary: finalSummary,
          outcome: finalOutcome,
          logs,
          checkpointMessageId,
          structuredOutput,
        })
        .where(eq(executions.id, executionId));

      if (persona.name !== "Router") {
        await this.appendExecutionContext(task.workItemId, {
          executionId: executionId as ExecutionId,
          summary: finalSummary,
          outcome: finalOutcome,
          rejectionPayload: null,
        });
      }

      this.broadcastFn({
        type: "agent_completed",
        executionId: executionId as ExecutionId,
        personaId: persona.id as PersonaId,
        workItemId: task.workItemId,
        outcome: finalOutcome,
        durationMs: finalDurationMs,
        costUsd: finalCostUsd,
        timestamp: new Date().toISOString(),
      });

      auditAgentComplete({
        workItemId: task.workItemId,
        executionId,
        personaName: persona.name,
        outcome: finalOutcome,
        costUsd: finalCostUsd,
        durationMs: finalDurationMs,
      });

      if (finalCostUsd > 0) {
        auditCostEvent({
          workItemId: task.workItemId,
          executionId,
          costUsd: finalCostUsd,
          actor: persona.name,
        });
      }

      getProjectCostSummary(project.id as string).then((costSummary) => {
        this.broadcastFn({
          type: "cost_update",
          todayCostUsd: costSummary.todayCostUsd,
          monthCostUsd: costSummary.monthCostUsd,
          timestamp: new Date().toISOString(),
        });
      }).catch((err) => {
        logger.error({ err }, "Cost summary broadcast failed");
      });

      const nextTask = onComplete(executionId);
      if (nextTask) {
        this.runExecution(nextTask.workItemId, nextTask.personaId).catch((err) => {
          logger.error({ err, workItemId: nextTask.workItemId }, "Dequeued execution failed");
        });
      }

      if (finalOutcome === "success" && this.canTransition(task.workItemId)) {
        this.recordTransition(task.workItemId);

        if (persona.name === "Router") {
          const [updated] = await (this.db as any)
            .select({ currentState: workItems.currentState })
            .from(workItems)
            .where(eq(workItems.id, task.workItemId));
          if (updated) {
            this.recordStateForLoop(task.workItemId, updated.currentState);

            if (this.detectLoop(task.workItemId)) {
              logger.warn(
                { workItemId: task.workItemId, currentState: updated.currentState },
                "Detected routing loop — halting automatic transitions",
              );

              const now = new Date();
              await (this.db as any)
                .update(workItems)
                .set({ currentState: "Blocked", updatedAt: now })
                .where(eq(workItems.id, task.workItemId));

              const loopCommentId = createId.comment();
              await (this.db as any).insert(comments).values({
                id: loopCommentId,
                workItemId: task.workItemId,
                authorType: "system",
                authorId: null,
                authorName: "System",
                content: "Detected routing loop — halting automatic transitions. Manual intervention required.",
                metadata: { coordination: "loop_detected", history: this.getStateHistory(task.workItemId) },
                createdAt: now,
              });

              this.broadcastFn({
                type: "state_change",
                workItemId: task.workItemId as WorkItemId,
                fromState: updated.currentState,
                toState: "Blocked",
                triggeredBy: "system",
                timestamp: now.toISOString(),
              });

              this.broadcastFn({
                type: "comment_created",
                commentId: loopCommentId as CommentId,
                workItemId: task.workItemId as WorkItemId,
                authorName: "System",
                contentPreview: "Detected routing loop — halting automatic transitions.",
                timestamp: now.toISOString(),
              });
            } else {
              dispatchForState(task.workItemId, updated.currentState).catch((err) => {
                logger.error({ err, workItemId: task.workItemId }, "Dispatch after routing failed");
              });
            }
          }
        } else {
          runRouter(task.workItemId).catch((err) => {
            logger.error({ err, workItemId: task.workItemId }, "Router failed");
          });
        }
      } else if (finalOutcome === "success") {
        const count = this.getTransitionCount(task.workItemId);
        logger.warn(
          { workItemId: task.workItemId, transitionCount: count, max: MAX_TRANSITIONS_PER_HOUR },
          "Rate limiter triggered — max transitions per hour reached",
        );

        const now = new Date();
        const commentId = createId.comment();
        await (this.db as any).insert(comments).values({
          id: commentId,
          workItemId: task.workItemId,
          authorType: "system",
          authorId: null,
          authorName: "System",
          content: `Rate limiter triggered — ${count} transitions in the last hour (max ${MAX_TRANSITIONS_PER_HOUR}). Automatic chaining paused. Resume manually or wait for the cooldown.`,
          metadata: { coordination: "rate_limit", transitionCount: count, max: MAX_TRANSITIONS_PER_HOUR },
          createdAt: now,
        });

        this.broadcastFn({
          type: "comment_created",
          commentId: commentId as CommentId,
          workItemId: task.workItemId as WorkItemId,
          authorName: "System",
          contentPreview: "Rate limiter triggered — automatic chaining paused.",
          timestamp: now.toISOString(),
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logs += `\nFATAL: ${errorMsg}\n`;

      await (this.db as any)
        .update(executions)
        .set({
          status: "failed",
          completedAt: new Date(),
          summary: `Execution failed: ${errorMsg}`,
          outcome: "failure",
          logs,
        })
        .where(eq(executions.id, executionId));

      this.broadcastFn({
        type: "agent_completed",
        executionId: executionId as ExecutionId,
        personaId: persona.id as PersonaId,
        workItemId: task.workItemId,
        outcome: "failure",
        durationMs: 0,
        costUsd: 0,
        timestamp: new Date().toISOString(),
      });

      const nextTask = onComplete(executionId);
      if (nextTask) {
        this.runExecution(nextTask.workItemId, nextTask.personaId).catch((e) => {
          logger.error({ err: e, workItemId: nextTask.workItemId }, "Dequeued execution failed");
        });
      }
    }
  }
}

