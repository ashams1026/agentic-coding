/**
 * Parent-child state coordination.
 *
 * After a child work item changes state, this module checks whether
 * the parent should be auto-advanced or flagged:
 *
 * - All children Done → parent auto-advances to "In Review"
 * - Any child Blocked → system comment on parent
 */

import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workItems, comments } from "../db/schema.js";
import { createId } from "@agentops/shared";
import type { WorkItemId, CommentId } from "@agentops/shared";
import { broadcast } from "../ws.js";
import { dispatchForState } from "./dispatch.js";

/** The state to advance parent to when all children complete. */
const PARENT_ADVANCE_STATE = "In Review";

/**
 * Check if a child's state change should trigger parent coordination.
 * Call this after any work item state change.
 *
 * - If child enters "Done" and all siblings are also "Done",
 *   auto-advance parent to "In Review" (if parent is not already Done/In Review).
 * - If child enters "Blocked", post a system comment on parent.
 */
export async function checkParentCoordination(
  workItemId: string,
  newState: string,
): Promise<void> {
  // Look up the work item's parentId
  const [item] = await db
    .select({ parentId: workItems.parentId })
    .from(workItems)
    .where(eq(workItems.id, workItemId));

  if (!item?.parentId) return; // Top-level item, nothing to coordinate

  const parentId = item.parentId;

  if (newState === "Done") {
    await handleChildDone(parentId);
  } else if (newState === "Blocked") {
    await handleChildBlocked(workItemId, parentId);
  }
}

/**
 * When a child reaches Done: check if ALL siblings are also Done.
 * If yes, auto-advance parent to "In Review".
 */
async function handleChildDone(parentId: string): Promise<void> {
  // Get all children of the parent
  const children = await db
    .select({ id: workItems.id, currentState: workItems.currentState })
    .from(workItems)
    .where(eq(workItems.parentId, parentId));

  if (children.length === 0) return;

  const allDone = children.every((c) => c.currentState === "Done");
  if (!allDone) return;

  // Check parent's current state — don't advance if already Done or In Review
  const [parent] = await db
    .select({ currentState: workItems.currentState, title: workItems.title })
    .from(workItems)
    .where(eq(workItems.id, parentId));

  if (!parent) return;
  if (parent.currentState === "Done" || parent.currentState === PARENT_ADVANCE_STATE) return;

  const now = new Date();
  const fromState = parent.currentState;

  // Auto-advance parent to "In Review"
  await db
    .update(workItems)
    .set({ currentState: PARENT_ADVANCE_STATE, updatedAt: now })
    .where(eq(workItems.id, parentId));

  // Post system comment explaining the auto-advance
  const commentId = createId.comment();
  await db.insert(comments).values({
    id: commentId,
    workItemId: parentId,
    authorType: "system",
    authorId: null,
    authorName: "System",
    content: `All ${children.length} child work items are Done. Auto-advancing to ${PARENT_ADVANCE_STATE}.`,
    metadata: { coordination: "all_children_done", childCount: children.length, fromState },
    createdAt: now,
  });

  // Broadcast state change
  broadcast({
    type: "state_change",
    workItemId: parentId as WorkItemId,
    fromState,
    toState: PARENT_ADVANCE_STATE,
    triggeredBy: "system",
    timestamp: now.toISOString(),
  });

  // Broadcast comment
  broadcast({
    type: "comment_created",
    commentId: commentId as CommentId,
    workItemId: parentId as WorkItemId,
    authorName: "System",
    contentPreview: `All ${children.length} child work items are Done.`,
    timestamp: now.toISOString(),
  });

  // Dispatch persona for the parent's new state (e.g., reviewer for "In Review")
  dispatchForState(parentId, PARENT_ADVANCE_STATE).catch((err) => {
    console.error(`Dispatch after parent coordination failed for ${parentId}:`, err);
  });
}

/**
 * When a child enters Blocked: post a system comment on the parent
 * to flag the issue.
 */
async function handleChildBlocked(
  childId: string,
  parentId: string,
): Promise<void> {
  // Get the child's title for the comment
  const [child] = await db
    .select({ title: workItems.title })
    .from(workItems)
    .where(eq(workItems.id, childId));

  const childTitle = child?.title ?? childId;
  const now = new Date();

  const commentId = createId.comment();
  await db.insert(comments).values({
    id: commentId,
    workItemId: parentId,
    authorType: "system",
    authorId: null,
    authorName: "System",
    content: `Child work item "${childTitle}" (${childId}) is now Blocked.`,
    metadata: { coordination: "child_blocked", childId, childTitle },
    createdAt: now,
  });

  broadcast({
    type: "comment_created",
    commentId: commentId as CommentId,
    workItemId: parentId as WorkItemId,
    authorName: "System",
    contentPreview: `Child "${childTitle}" is Blocked.`,
    timestamp: now.toISOString(),
  });
}
