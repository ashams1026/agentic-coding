import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../test/setup.js";
import * as schema from "../db/schema.js";

const mockDb = { db: null as unknown };
vi.mock("../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
  get sqlite() {
    return {};
  },
}));

// Mock broadcast (concurrency module imports ws indirectly)
vi.mock("../ws.js", () => ({
  broadcast: vi.fn(),
  closeAllClients: vi.fn(),
}));

// Mock dispatch (imported by coordination which might be pulled in)
vi.mock("../agent/dispatch.js", () => ({
  dispatchForState: vi.fn().mockResolvedValue(undefined),
}));

import { clearAll, getActiveCount, getQueueLength, trackExecution, enqueue } from "../agent/concurrency.js";
import { clearTransitionLog, recordTransition, canTransition } from "../agent/execution-manager.js";
import { recoverOrphanedState } from "../start.js";

let testDb: TestDatabase;

describe("startup crash recovery", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);
  });

  afterEach(() => {
    clearAll();
    clearTransitionLog();
    testDb.cleanup();
  });

  it("resets orphaned running executions to failed via recoverOrphanedState", async () => {
    // Seed has EXEC_3 with status "running"
    const [before] = await testDb.db
      .select({ status: schema.executions.status })
      .from(schema.executions)
      .where(eq(schema.executions.id, TEST_IDS.EXEC_3));
    expect(before!.status).toBe("running");

    const report = await recoverOrphanedState();

    expect(report.executionsReset).toBe(1);
    expect(report.affectedWorkItems).toContain(TEST_IDS.WI_CHILD_1B);
    expect(report.errors).toHaveLength(0);

    // Verify the execution is now failed
    const [after] = await testDb.db
      .select({ status: schema.executions.status, summary: schema.executions.summary })
      .from(schema.executions)
      .where(eq(schema.executions.id, TEST_IDS.EXEC_3));
    expect(after!.status).toBe("failed");
    expect(after!.summary).toBe("Interrupted by server restart");
  });

  it("also recovers pending executions", async () => {
    // Insert a pending execution (simulating crash between insert and start)
    await testDb.db.insert(schema.executions).values({
      id: "ex-pending1",
      workItemId: TEST_IDS.WI_TOP_1,
      personaId: TEST_IDS.PERSONA_PM,
      status: "pending",
      startedAt: new Date(),
      costUsd: 0,
      durationMs: 0,
      summary: "",
      outcome: null,
      rejectionPayload: null,
      logs: "",
    });

    const report = await recoverOrphanedState();

    // 1 running (EXEC_3) + 1 pending = 2 recovered
    expect(report.executionsReset).toBe(2);
    expect(report.affectedWorkItems).toContain(TEST_IDS.WI_CHILD_1B);
    expect(report.affectedWorkItems).toContain(TEST_IDS.WI_TOP_1);

    // Verify both are now failed
    const [pendingAfter] = await testDb.db
      .select({ status: schema.executions.status })
      .from(schema.executions)
      .where(eq(schema.executions.id, "ex-pending1"));
    expect(pendingAfter!.status).toBe("failed");
  });

  it("leaves work items in their current state", async () => {
    // Get work item state before recovery
    const [before] = await testDb.db
      .select({ currentState: schema.workItems.currentState })
      .from(schema.workItems)
      .where(eq(schema.workItems.id, TEST_IDS.WI_CHILD_1B));

    await recoverOrphanedState();

    // Work item state should be unchanged
    const [after] = await testDb.db
      .select({ currentState: schema.workItems.currentState })
      .from(schema.workItems)
      .where(eq(schema.workItems.id, TEST_IDS.WI_CHILD_1B));
    expect(after!.currentState).toBe(before!.currentState);
  });

  it("returns empty report when no orphans exist", async () => {
    // First recovery clears orphans
    await recoverOrphanedState();

    // Second recovery should find nothing
    const report = await recoverOrphanedState();
    expect(report.executionsReset).toBe(0);
    expect(report.affectedWorkItems).toHaveLength(0);
    expect(report.errors).toHaveLength(0);
  });

  it("clearAll resets concurrency tracker and queue", async () => {
    trackExecution("ex-1");
    trackExecution("ex-2");
    await enqueue(TEST_IDS.WI_TOP_1, TEST_IDS.PERSONA_PM);

    expect(getActiveCount()).toBe(2);
    expect(getQueueLength()).toBe(1);

    clearAll();

    expect(getActiveCount()).toBe(0);
    expect(getQueueLength()).toBe(0);
  });

  it("clearTransitionLog resets rate limiter", () => {
    const id = "wi-test0001";
    for (let i = 0; i < 10; i++) {
      recordTransition(id);
    }
    expect(canTransition(id)).toBe(false);

    clearTransitionLog();

    expect(canTransition(id)).toBe(true);
  });
});
