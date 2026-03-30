/**
 * Execution manager — orchestrates agent execution lifecycle.
 *
 * Creates execution records, spawns the executor, streams events
 * to WebSocket clients, and updates the execution on completion.
 */

import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { executions, workItems, personas, projects } from "../db/schema.js";
import { createId } from "@agentops/shared";
import type {
  ExecutionId,
  WorkItemId,
  PersonaId,
  ProjectId,
  ExecutionOutcome,
  ExecutionContextEntry,
} from "@agentops/shared";
import { broadcast } from "../ws.js";
import { ClaudeExecutor } from "./claude-executor.js";
import { runRouter } from "./router.js";
import { dispatchForState } from "./dispatch.js";
import type { AgentTask, AgentEvent } from "./types.js";

// ── Singleton executor ────────────────────────────────────────────

// ── Transition rate limiter ───────────────────────────────────────

const MAX_TRANSITIONS_PER_HOUR = 10;
const transitionLog = new Map<string, number[]>(); // workItemId → timestamps

export function canTransition(workItemId: string): boolean {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const timestamps = transitionLog.get(workItemId) ?? [];
  const recent = timestamps.filter((t) => t > oneHourAgo);
  transitionLog.set(workItemId, recent);
  return recent.length < MAX_TRANSITIONS_PER_HOUR;
}

function recordTransition(workItemId: string): void {
  const timestamps = transitionLog.get(workItemId) ?? [];
  timestamps.push(Date.now());
  transitionLog.set(workItemId, timestamps);
}

const executor = new ClaudeExecutor();

// ── Execution context helpers ────────────────────────────────────

const MAX_REJECTIONS = 3;

/**
 * Append an entry to a work item's executionContext array.
 */
export async function appendExecutionContext(
  workItemId: string,
  entry: ExecutionContextEntry,
): Promise<void> {
  const [item] = await db
    .select({ executionContext: workItems.executionContext })
    .from(workItems)
    .where(eq(workItems.id, workItemId));

  if (!item) return;

  const ctx = (item.executionContext as ExecutionContextEntry[]) ?? [];
  ctx.push(entry);

  await db
    .update(workItems)
    .set({ executionContext: ctx, updatedAt: new Date() })
    .where(eq(workItems.id, workItemId));
}

/**
 * Handle rejection: "In Review" → "In Progress" transition.
 * Increments retry counter, appends rejection to executionContext.
 * Returns "Blocked" if max retries exceeded, otherwise returns "In Progress".
 */
export async function handleRejection(
  workItemId: string,
  reason: string,
  severity: "low" | "medium" | "high" = "medium",
  hint: string = "",
): Promise<{ targetState: string; retryCount: number; blocked: boolean }> {
  const [item] = await db
    .select({ executionContext: workItems.executionContext })
    .from(workItems)
    .where(eq(workItems.id, workItemId));

  if (!item) return { targetState: "In Progress", retryCount: 0, blocked: false };

  const ctx = (item.executionContext as ExecutionContextEntry[]) ?? [];

  // Count existing rejections
  const retryCount = ctx.filter((e) => e.rejectionPayload !== null).length + 1;
  const blocked = retryCount >= MAX_REJECTIONS;
  const targetState = blocked ? "Blocked" : "In Progress";

  // Append rejection entry
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

  await db
    .update(workItems)
    .set({ executionContext: ctx, updatedAt: new Date() })
    .where(eq(workItems.id, workItemId));

  return { targetState, retryCount, blocked };
}

// ── Helper: build AgentTask from DB ───────────────────────────────

async function buildAgentTask(workItemId: string): Promise<AgentTask | null> {
  const [item] = await db
    .select()
    .from(workItems)
    .where(eq(workItems.id, workItemId));

  if (!item) return null;

  // Build parent chain by walking up parentId
  const parentChain: Array<{ id: WorkItemId; title: string }> = [];
  let currentParentId = item.parentId;
  while (currentParentId) {
    const [parent] = await db
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

// ── Map AgentEvent to WS chunk type ───────────────────────────────

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
  }
}

// ── Run execution ─────────────────────────────────────────────────

export async function runExecution(
  workItemId: string,
  personaId: string,
): Promise<ExecutionId> {
  const now = new Date();
  const executionId = createId.execution();

  // Look up persona and project
  const [persona] = await db
    .select()
    .from(personas)
    .where(eq(personas.id, personaId));

  if (!persona) {
    throw new Error(`Persona ${personaId} not found`);
  }

  const [item] = await db
    .select({ projectId: workItems.projectId, title: workItems.title })
    .from(workItems)
    .where(eq(workItems.id, workItemId));

  if (!item) {
    throw new Error(`Work item ${workItemId} not found`);
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, item.projectId));

  if (!project) {
    throw new Error(`Project ${item.projectId} not found`);
  }

  // Create execution record
  await db.insert(executions).values({
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

  // Broadcast agent_started
  broadcast({
    type: "agent_started",
    executionId: executionId as ExecutionId,
    personaId: personaId as PersonaId,
    workItemId: workItemId as WorkItemId,
    workItemTitle: item.title,
    timestamp: now.toISOString(),
  });

  // Build task and spawn executor (async — don't await completion)
  const task = await buildAgentTask(workItemId);
  if (!task) {
    await db
      .update(executions)
      .set({ status: "failed", summary: "Work item not found", completedAt: new Date() })
      .where(eq(executions.id, executionId));
    return executionId as ExecutionId;
  }

  // Serialize persona for the executor
  const personaEntity = {
    id: persona.id as PersonaId,
    name: persona.name,
    description: persona.description,
    avatar: persona.avatar,
    systemPrompt: persona.systemPrompt,
    model: persona.model as "opus" | "sonnet" | "haiku",
    allowedTools: persona.allowedTools,
    mcpTools: persona.mcpTools,
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

  // Run execution in background
  runExecutionStream(
    executionId,
    task,
    personaEntity,
    projectEntity,
  ).catch((err) => {
    console.error(`Execution ${executionId} failed:`, err);
  });

  return executionId as ExecutionId;
}

// ── Stream execution events ───────────────────────────────────────

async function runExecutionStream(
  executionId: string,
  task: AgentTask,
  persona: Parameters<typeof executor.spawn>[1],
  project: Parameters<typeof executor.spawn>[2],
): Promise<void> {
  let logs = "";
  let finalOutcome: ExecutionOutcome = "failure";
  let finalSummary = "";
  let finalCostUsd = 0;
  let finalDurationMs = 0;

  try {
    const events = executor.spawn(task, persona, project, {
      model: persona.model,
      maxBudget: persona.maxBudgetPerRun,
      tools: persona.allowedTools.length > 0 ? persona.allowedTools : [],
    });

    for await (const event of events) {
      const chunk = eventToChunk(event);
      logs += chunk + "\n";

      // Broadcast to WebSocket
      broadcast({
        type: "agent_output_chunk",
        executionId: executionId as ExecutionId,
        personaId: persona.id as PersonaId,
        chunk,
        chunkType: toChunkType(event),
        timestamp: new Date().toISOString(),
      });

      // Capture final result
      if (event.type === "result") {
        finalOutcome = event.outcome;
        finalSummary = event.summary;
        finalCostUsd = event.costUsd;
        finalDurationMs = event.durationMs;
      }

      if (event.type === "error") {
        finalSummary = event.message;
      }
    }

    // Update execution record on completion
    await db
      .update(executions)
      .set({
        status: "completed",
        completedAt: new Date(),
        costUsd: Math.round(finalCostUsd * 100), // store as cents
        durationMs: finalDurationMs,
        summary: finalSummary,
        outcome: finalOutcome,
        logs,
      })
      .where(eq(executions.id, executionId));

    // Append to work item's executionContext (skip for router)
    if (persona.name !== "__router__") {
      await appendExecutionContext(task.workItemId, {
        executionId: executionId as ExecutionId,
        summary: finalSummary,
        outcome: finalOutcome,
        rejectionPayload: null,
      });
    }

    // Broadcast agent_completed
    broadcast({
      type: "agent_completed",
      executionId: executionId as ExecutionId,
      personaId: persona.id as PersonaId,
      workItemId: task.workItemId,
      outcome: finalOutcome,
      durationMs: finalDurationMs,
      costUsd: finalCostUsd,
      timestamp: new Date().toISOString(),
    });

    // After successful completion, chain the next step
    if (finalOutcome === "success" && canTransition(task.workItemId)) {
      recordTransition(task.workItemId);

      if (persona.name === "__router__") {
        // Router just completed — dispatch for the (potentially changed) state
        const [updated] = await db
          .select({ currentState: workItems.currentState })
          .from(workItems)
          .where(eq(workItems.id, task.workItemId));
        if (updated) {
          dispatchForState(task.workItemId, updated.currentState).catch((err) => {
            console.error(`Dispatch after routing failed for ${task.workItemId}:`, err);
          });
        }
      } else {
        // Regular persona completed — run the router to decide next state
        runRouter(task.workItemId).catch((err) => {
          console.error(`Router failed for ${task.workItemId}:`, err);
        });
      }
    }
  } catch (err) {
    // On error: set status failed, preserve partial logs
    const errorMsg = err instanceof Error ? err.message : String(err);
    logs += `\nFATAL: ${errorMsg}\n`;

    await db
      .update(executions)
      .set({
        status: "failed",
        completedAt: new Date(),
        summary: `Execution failed: ${errorMsg}`,
        outcome: "failure",
        logs,
      })
      .where(eq(executions.id, executionId));

    broadcast({
      type: "agent_completed",
      executionId: executionId as ExecutionId,
      personaId: persona.id as PersonaId,
      workItemId: task.workItemId,
      outcome: "failure",
      durationMs: 0,
      costUsd: 0,
      timestamp: new Date().toISOString(),
    });
  }
}
