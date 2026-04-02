/**
 * Persona dispatch — triggers agent execution when a work item
 * enters a state that has an assigned persona.
 *
 * Respects concurrency limits: if at capacity, the task is enqueued.
 */

import { eq, and, inArray } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workItems, workItemEdges, comments } from "../db/schema.js";
import { resolvePersonaForState, getWorkflowStates } from "./workflow-runtime.js";
import { executionManager } from "./setup.js";
import { canSpawn, enqueue, checkMonthlyCost } from "./concurrency.js";
import { createId } from "@agentops/shared";
import type { CommentId, WorkItemId } from "@agentops/shared";
import { broadcast } from "../ws.js";

/**
 * Check if the given state has an assigned persona for the work item's project,
 * and if so, spawn an execution (or enqueue if at capacity).
 *
 * No-op for states without assigned personas (e.g., Backlog, Done).
 */
export async function dispatchForState(
  workItemId: string,
  stateName: string,
): Promise<void> {
  // Look up the work item's project and workflow
  const [item] = await db
    .select({ projectId: workItems.projectId, workflowId: workItems.workflowId })
    .from(workItems)
    .where(eq(workItems.id, workItemId));

  if (!item) return;

  // Resolve persona for this state via workflow runtime (with persona_assignments fallback)
  const personaId = await resolvePersonaForState(item.projectId, item.workflowId ?? null, stateName);

  if (!personaId) return; // No persona assigned to this state

  // Check dependency enforcement — block if upstream items aren't complete
  const dependencies = await db
    .select({ fromId: workItemEdges.fromId })
    .from(workItemEdges)
    .where(and(eq(workItemEdges.toId, workItemId), eq(workItemEdges.type, "depends_on")));

  if (dependencies.length > 0) {
    // Get terminal state names for this workflow
    const workflowStates = await getWorkflowStates(item.workflowId ?? null);
    const terminalStateNames = new Set(
      workflowStates.filter((s) => s.type === "terminal").map((s) => s.name),
    );

    // Check all upstream items' current states in a single query
    const depIds = dependencies.map((d) => d.fromId);
    const upstreamItems = await db
      .select({ id: workItems.id, title: workItems.title, currentState: workItems.currentState })
      .from(workItems)
      .where(inArray(workItems.id, depIds));
    const pendingDeps = upstreamItems.filter(
      (u) => !terminalStateNames.has(u.currentState),
    );

    if (pendingDeps.length > 0) {
      const now = new Date();
      const commentId = createId.comment();
      const depList = pendingDeps.map((d) => `"${d.title}" (${d.currentState})`).join(", ");
      await db.insert(comments).values({
        id: commentId,
        workItemId,
        authorType: "system",
        authorId: null,
        authorName: "System",
        content: `Dispatch blocked: ${pendingDeps.length} upstream ${pendingDeps.length === 1 ? "dependency" : "dependencies"} not complete — ${depList}`,
        metadata: { dependencyBlock: true, pendingDeps: pendingDeps.map((d) => d.id) },
        createdAt: now,
      });
      broadcast({
        type: "comment_created",
        commentId: commentId as CommentId,
        workItemId: workItemId as WorkItemId,
        authorName: "System",
        contentPreview: `Dispatch blocked: upstream dependencies not complete.`,
        timestamp: now.toISOString(),
      });
      return;
    }
  }

  const assignment = { personaId };

  // Check monthly cost cap before spawning
  const costCheck = await checkMonthlyCost(item.projectId);
  if (!costCheck.allowed) {
    const now = new Date();
    const commentId = createId.comment();
    await db.insert(comments).values({
      id: commentId,
      workItemId,
      authorType: "system",
      authorId: null,
      authorName: "System",
      content: `Monthly cost cap exceeded ($${costCheck.monthCostUsd.toFixed(2)} / $${costCheck.monthCapUsd.toFixed(2)}). Execution blocked.`,
      metadata: { costBlock: true, monthCostUsd: costCheck.monthCostUsd, monthCapUsd: costCheck.monthCapUsd },
      createdAt: now,
    });
    broadcast({
      type: "comment_created",
      commentId: commentId as CommentId,
      workItemId: workItemId as WorkItemId,
      authorName: "System",
      contentPreview: `Monthly cost cap exceeded. Execution blocked.`,
      timestamp: now.toISOString(),
    });
    return;
  }

  // Check concurrency before spawning
  const allowed = await canSpawn(item.projectId);
  if (!allowed) {
    await enqueue(workItemId, assignment.personaId);
    return;
  }

  // Spawn execution
  await executionManager.runExecution(workItemId, assignment.personaId);
}
