import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../../test/setup.js";
import * as schema from "../../db/schema.js";

const { mockDb } = vi.hoisted(() => ({
  mockDb: { db: null as unknown },
}));
vi.mock("../../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

// Stub the executor spawn — we're testing dispatch decisions, not agent execution
const mockRunExecution = vi.fn().mockResolvedValue("ex-mock001");
vi.mock("../setup.js", () => ({
  executionManager: {
    runExecution: (...args: unknown[]) => mockRunExecution(...args),
  },
}));

// Mock broadcast
vi.mock("../../ws.js", () => ({
  broadcast: vi.fn(),
}));

import { dispatchForState } from "../dispatch.js";
import { trackExecution, onComplete, getActiveCount } from "../concurrency.js";
import { broadcast } from "../../ws.js";

const mockBroadcast = broadcast as ReturnType<typeof vi.fn>;

let testDb: TestDatabase;
let trackedIds: string[] = [];

describe("dispatch logic", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);
    mockRunExecution.mockClear();
    trackedIds = [];
  });

  afterEach(() => {
    // Clean up concurrency module state
    for (const id of trackedIds) {
      onComplete(id);
    }
    testDb.cleanup();
  });

  function track(id: string) {
    trackExecution(id);
    trackedIds.push(id);
  }

  // ── Spawns execution when persona is assigned ────────────────────

  it("spawns executor when persona is assigned to state", async () => {
    // Seed has Planning → PM persona assignment
    await dispatchForState(TEST_IDS.WI_TOP_1, "Planning");

    expect(mockRunExecution).toHaveBeenCalledOnce();
    expect(mockRunExecution).toHaveBeenCalledWith(
      TEST_IDS.WI_TOP_1,
      TEST_IDS.PERSONA_PM,
    );
  });

  // ── No-op when no persona assigned ───────────────────────────────

  it("does nothing for Backlog state (no persona assigned)", async () => {
    await dispatchForState(TEST_IDS.WI_TOP_3, "Backlog");
    expect(mockRunExecution).not.toHaveBeenCalled();
  });

  it("does nothing for Done state (no persona assigned)", async () => {
    await dispatchForState(TEST_IDS.WI_TOP_1, "Done");
    expect(mockRunExecution).not.toHaveBeenCalled();
  });

  it("does nothing for non-existent work item", async () => {
    await dispatchForState("wi-nonexistent", "Planning");
    expect(mockRunExecution).not.toHaveBeenCalled();
  });

  // ── Respects concurrency limit ───────────────────────────────────

  it("enqueues instead of spawning when at concurrency limit", async () => {
    // Seed project has maxConcurrent: 3. Fill to capacity.
    track("ex-fill-1");
    track("ex-fill-2");
    track("ex-fill-3");
    expect(getActiveCount()).toBe(3);

    // Dispatch should enqueue, not spawn
    await dispatchForState(TEST_IDS.WI_TOP_1, "Planning");
    expect(mockRunExecution).not.toHaveBeenCalled();
  });

  it("spawns when under concurrency limit", async () => {
    track("ex-fill-1");
    track("ex-fill-2");
    // 2 of 3 slots used — still room
    expect(getActiveCount()).toBe(2);

    await dispatchForState(TEST_IDS.WI_TOP_1, "Planning");
    expect(mockRunExecution).toHaveBeenCalledOnce();
  });

  // ── Respects monthly cost cap ─────────────────────────────────────

  it("blocks dispatch when monthly cost cap is exceeded", async () => {
    // Set monthCap very low ($0.01) so the existing execution costs ($1.76) exceed it
    await testDb.db
      .update(schema.projects)
      .set({ settings: { maxConcurrent: 3, monthCap: 0.01 } })
      .where(eq(schema.projects.id, TEST_IDS.PROJECT_ID));

    mockBroadcast.mockClear();
    await dispatchForState(TEST_IDS.WI_TOP_1, "Planning");

    // Should NOT have spawned an execution
    expect(mockRunExecution).not.toHaveBeenCalled();

    // Should have created a system comment about cost cap
    const comments = await testDb.db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.workItemId, TEST_IDS.WI_TOP_1));
    const costComment = comments.find((c) =>
      c.content.includes("Monthly cost cap exceeded"),
    );
    expect(costComment).toBeDefined();

    // Should have broadcast comment_created
    expect(mockBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "comment_created" }),
    );
  });

  it("allows dispatch when cost is under monthly cap", async () => {
    // monthCap: 50 (from seed) and total cost is ~$1.76 — well under
    await dispatchForState(TEST_IDS.WI_TOP_1, "Planning");
    expect(mockRunExecution).toHaveBeenCalledOnce();
  });
});
