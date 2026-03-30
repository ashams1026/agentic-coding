/**
 * Persona dispatch — triggers agent execution when a work item
 * enters a state that has an assigned persona.
 */

import { eq, and } from "drizzle-orm";
import { db } from "../db/connection.js";
import { personaAssignments, workItems } from "../db/schema.js";
import { runExecution } from "./execution-manager.js";

/**
 * Check if the given state has an assigned persona for the work item's project,
 * and if so, spawn an execution.
 *
 * No-op for states without assigned personas (e.g., Backlog, Done).
 */
export async function dispatchForState(
  workItemId: string,
  stateName: string,
): Promise<void> {
  // Look up the work item's project
  const [item] = await db
    .select({ projectId: workItems.projectId })
    .from(workItems)
    .where(eq(workItems.id, workItemId));

  if (!item) return;

  // Look up persona assignment for this project + state
  const [assignment] = await db
    .select({ personaId: personaAssignments.personaId })
    .from(personaAssignments)
    .where(
      and(
        eq(personaAssignments.projectId, item.projectId),
        eq(personaAssignments.stateName, stateName),
      ),
    );

  if (!assignment) return; // No persona assigned to this state

  // Spawn execution
  await runExecution(workItemId, assignment.personaId);
}
