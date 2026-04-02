/**
 * Persona dispatch — triggers agent execution when a work item
 * enters a state that has an assigned persona.
 *
 * Respects concurrency limits: if at capacity, the task is enqueued.
 */

import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workItems, comments } from "../db/schema.js";
import { resolvePersonaForState } from "./workflow-runtime.js";
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
