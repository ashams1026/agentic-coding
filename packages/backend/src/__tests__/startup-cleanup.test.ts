import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../test/setup.js";
import * as schema from "../db/schema.js";

const mockDb = { db: null as unknown };
vi.mock("../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

// Mock broadcast (concurrency module imports ws indirectly)
vi.mock("../ws.js", () => ({
  broadcast: vi.fn(),
}));

// Mock dispatch (imported by coordination which might be pulled in)
vi.mock("../agent/dispatch.js", () => ({
  dispatchForState: vi.fn().mockResolvedValue(undefined),
}));

import { clearAll, getActiveCount, getQueueLength, trackExecution, enqueue } from "../agent/concurrency.js";
import { clearTransitionLog, recordTransition, canTransition } from "../agent/execution-manager.js";

let testDb: TestDatabase;

describe("startup cleanup", () => {
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

  it("resets orphaned running executions to failed", async () => {
    // Seed has EXEC_3 with status "running" (from test setup)
    const [before] = await testDb.db
      .select({ status: schema.executions.status })
      .from(schema.executions)
      .where(eq(schema.executions.id, TEST_IDS.EXEC_3));
    expect(before!.status).toBe("running");

    // Simulate the cleanup logic from index.ts
    const now = new Date();
    const orphaned = await testDb.db
      .select({ id: schema.executions.id })
      .from(schema.executions)
      .where(eq(schema.executions.status, "running"));

    expect(orphaned.length).toBe(1);

    await testDb.db
      .update(schema.executions)
      .set({
        status: "failed",
        completedAt: now,
        summary: "Interrupted by server restart",
        outcome: "failure",
      })
      .where(eq(schema.executions.status, "running"));

    // Verify it's now failed
    const [after] = await testDb.db
      .select({ status: schema.executions.status, summary: schema.executions.summary })
      .from(schema.executions)
      .where(eq(schema.executions.id, TEST_IDS.EXEC_3));
    expect(after!.status).toBe("failed");
    expect(after!.summary).toBe("Interrupted by server restart");
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
