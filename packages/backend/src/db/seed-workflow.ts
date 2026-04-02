/**
 * Seed the default workflow from the hardcoded WORKFLOW constant.
 * Idempotent — skips if the default workflow already exists.
 * Also backfills projects.workflowId and work_items.workflowId.
 */

import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "./connection.js";
import { workflows, workflowStates, workflowTransitions, projects, workItems } from "./schema.js";
import { WORKFLOW } from "@agentops/shared";
import { logger } from "../logger.js";

const DEFAULT_WORKFLOW_ID = "wf-default";

// State type classification
const STATE_TYPES: Record<string, "initial" | "intermediate" | "terminal"> = {
  Backlog: "initial",
  Done: "terminal",
};

export async function seedDefaultWorkflow(): Promise<void> {
  // Check if already seeded
  const [existing] = await db
    .select({ id: workflows.id })
    .from(workflows)
    .where(eq(workflows.id, DEFAULT_WORKFLOW_ID));

  if (existing) {
    // Already seeded — just backfill any missing references
    await backfillWorkflowReferences();
    return;
  }

  const now = new Date();

  // 1. Create the default workflow
  await db.insert(workflows).values({
    id: DEFAULT_WORKFLOW_ID,
    name: "Default",
    description: "The built-in 8-state workflow: Backlog → Planning → Ready → In Progress → In Review → Done",
    scope: "global",
    projectId: "pj-global",
    version: 1,
    isPublished: true,
    createdAt: now,
    updatedAt: now,
  });

  // 2. Create workflow states with deterministic IDs
  const stateIds: Record<string, string> = {};
  for (let i = 0; i < WORKFLOW.states.length; i++) {
    const s = WORKFLOW.states[i]!;
    const stateId = `ws-default-${s.name.toLowerCase().replace(/\s+/g, "-")}`;
    stateIds[s.name] = stateId;

    await db.insert(workflowStates).values({
      id: stateId,
      workflowId: DEFAULT_WORKFLOW_ID,
      name: s.name,
      type: STATE_TYPES[s.name] ?? "intermediate",
      color: s.color,
      agentId: null,
      sortOrder: i,
    });
  }

  // 3. Create workflow transitions
  let transitionIdx = 0;
  for (const [fromName, toNames] of Object.entries(WORKFLOW.transitions)) {
    const fromId = stateIds[fromName];
    if (!fromId) continue;

    for (const toName of toNames) {
      const toId = stateIds[toName];
      if (!toId) continue;

      await db.insert(workflowTransitions).values({
        id: `wt-default-${transitionIdx++}`,
        workflowId: DEFAULT_WORKFLOW_ID,
        fromStateId: fromId,
        toStateId: toId,
        label: "",
        sortOrder: transitionIdx,
      });
    }
  }

  logger.info(
    { workflowId: DEFAULT_WORKFLOW_ID, states: WORKFLOW.states.length, transitions: transitionIdx },
    "Seeded default workflow",
  );

  // 4. Backfill references
  await backfillWorkflowReferences();
}

async function backfillWorkflowReferences(): Promise<void> {
  // Set workflowId on all non-global projects that don't have one.
  // Skip global projects (e.g. pj-global) so their workflowId (wf-global) is not overwritten.
  await db
    .update(projects)
    .set({ workflowId: DEFAULT_WORKFLOW_ID })
    .where(and(isNull(projects.workflowId), ne(projects.isGlobal, true)));

  // Set workflowId on all work items that don't have one
  await db
    .update(workItems)
    .set({ workflowId: DEFAULT_WORKFLOW_ID })
    .where(isNull(workItems.workflowId));
}
