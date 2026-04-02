import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../../test/setup.js";
import * as schema from "../../db/schema.js";

const mockDb = { db: null as unknown };
vi.mock("../../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

// Mock broadcast — coordination fires WS events but we don't need a real server
vi.mock("../../ws.js", () => ({
  broadcast: vi.fn(),
}));

// Mock dispatch — coordination should trigger agent dispatch after auto-advancing parent
const mockDispatchForState = vi.fn().mockResolvedValue(undefined);
vi.mock("../dispatch.js", () => ({
  dispatchForState: (...args: unknown[]) => mockDispatchForState(...args),
}));

import { checkParentCoordination } from "../coordination.js";

let testDb: TestDatabase;

describe("parent-child coordination", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);
    mockDispatchForState.mockClear();
  });

  afterEach(() => {
    testDb.cleanup();
  });

  // Helper: set a work item's currentState directly in the DB
  async function setState(id: string, state: string) {
    await testDb.db
      .update(schema.workItems)
      .set({ currentState: state, updatedAt: new Date() })
      .where(eq(schema.workItems.id, id));
  }

  // Helper: get a work item's currentState
  async function getState(id: string): Promise<string> {
    const [row] = await testDb.db
      .select({ currentState: schema.workItems.currentState })
      .from(schema.workItems)
      .where(eq(schema.workItems.id, id));
    return row!.currentState;
  }

  // Helper: get comments on a work item
  async function getComments(workItemId: string) {
    return testDb.db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.workItemId, workItemId));
  }

  // ── All children Done → parent advances ──────────────────────────

  it("advances parent to In Review when all children are Done", async () => {
    // Seed: TOP_1 has 3 children: CHILD_1A (Done), CHILD_1B (In Progress), CHILD_1C (Ready)
    // Set remaining children to Done
    await setState(TEST_IDS.WI_CHILD_1B, "Done");
    await setState(TEST_IDS.WI_CHILD_1C, "Done");

    // Trigger coordination as if CHILD_1C just changed to Done
    await checkParentCoordination(TEST_IDS.WI_CHILD_1C, "Done");

    // Parent should now be "In Review"
    const parentState = await getState(TEST_IDS.WI_TOP_1);
    expect(parentState).toBe("In Review");

    // Should dispatch agent for the parent's new state
    expect(mockDispatchForState).toHaveBeenCalledWith(
      TEST_IDS.WI_TOP_1,
      "In Review",
    );
  });

  // ── 2/3 children Done → parent does NOT advance ─────────────────

  it("does NOT advance parent when only some children are Done", async () => {
    // Seed: CHILD_1A is already Done. CHILD_1B is In Progress, CHILD_1C is Ready
    // Only 1 of 3 children is Done. Set one more to Done (2 of 3).
    await setState(TEST_IDS.WI_CHILD_1B, "Done");

    const parentStateBefore = await getState(TEST_IDS.WI_TOP_1);

    // Trigger coordination as if CHILD_1B just changed to Done
    await checkParentCoordination(TEST_IDS.WI_CHILD_1B, "Done");

    // Parent should NOT have changed
    const parentStateAfter = await getState(TEST_IDS.WI_TOP_1);
    expect(parentStateAfter).toBe(parentStateBefore);

    // Should NOT dispatch since parent didn't advance
    expect(mockDispatchForState).not.toHaveBeenCalled();
  });

  // ── Child Blocked → system comment on parent ────────────────────

  it("posts system comment on parent when child enters Blocked", async () => {
    const commentsBefore = await getComments(TEST_IDS.WI_TOP_1);
    const countBefore = commentsBefore.length;

    // Set child to Blocked and trigger coordination
    await setState(TEST_IDS.WI_CHILD_1B, "Blocked");
    await checkParentCoordination(TEST_IDS.WI_CHILD_1B, "Blocked");

    // Should have a new system comment on the parent
    const commentsAfter = await getComments(TEST_IDS.WI_TOP_1);
    expect(commentsAfter.length).toBe(countBefore + 1);

    const newComment = commentsAfter[commentsAfter.length - 1]!;
    expect(newComment.authorType).toBe("system");
    expect(newComment.content).toContain("Blocked");
    expect(newComment.content).toContain(TEST_IDS.WI_CHILD_1B);
    expect(newComment.metadata).toHaveProperty("coordination", "child_blocked");
  });

  // ── Parent already in target state → no double-advance ───────────

  it("does not advance parent already in In Review", async () => {
    // Manually set parent to "In Review" first
    await setState(TEST_IDS.WI_TOP_1, "In Review");

    // Set all children to Done
    await setState(TEST_IDS.WI_CHILD_1A, "Done");
    await setState(TEST_IDS.WI_CHILD_1B, "Done");
    await setState(TEST_IDS.WI_CHILD_1C, "Done");

    const commentsBefore = await getComments(TEST_IDS.WI_TOP_1);

    await checkParentCoordination(TEST_IDS.WI_CHILD_1C, "Done");

    // Parent should still be "In Review" (not changed again)
    expect(await getState(TEST_IDS.WI_TOP_1)).toBe("In Review");

    // No new system comment about auto-advance
    const commentsAfter = await getComments(TEST_IDS.WI_TOP_1);
    expect(commentsAfter.length).toBe(commentsBefore.length);

    // No dispatch since parent was already in target state
    expect(mockDispatchForState).not.toHaveBeenCalled();
  });

  // ── Top-level items are no-ops ───────────────────────────────────

  it("does nothing for top-level items (no parent)", async () => {
    // TOP_1 has no parent — should be a no-op
    const stateBefore = await getState(TEST_IDS.WI_TOP_1);
    await checkParentCoordination(TEST_IDS.WI_TOP_1, "Done");
    expect(await getState(TEST_IDS.WI_TOP_1)).toBe(stateBefore);
  });
});
