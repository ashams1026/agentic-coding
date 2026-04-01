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

// Mock execution-manager to prevent actual agent spawning
const mockRunExecution = vi.fn().mockResolvedValue("ex-mock001");
vi.mock("../setup.js", () => ({
  executionManager: {
    runExecution: (...args: unknown[]) => mockRunExecution(...args),
  },
}));

import { runRouter } from "../router.js";

let testDb: TestDatabase;

describe("router auto-routing toggle", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);
    mockRunExecution.mockClear();
  });

  afterEach(() => {
    testDb.cleanup();
  });

  it("routes when autoRouting is true", async () => {
    // Set autoRouting: true on the project
    await testDb.db
      .update(schema.projects)
      .set({ settings: { maxConcurrent: 3, monthCap: 50, autoRouting: true } })
      .where(eq(schema.projects.id, TEST_IDS.PROJECT_ID));

    // Seed a Router persona (runRouter will getOrCreate one)
    const result = await runRouter(TEST_IDS.WI_TOP_1);

    expect(result).toBe(true);
    expect(mockRunExecution).toHaveBeenCalledOnce();
  });

  it("skips routing when autoRouting is false", async () => {
    // Explicitly disable auto-routing
    await testDb.db
      .update(schema.projects)
      .set({ settings: { maxConcurrent: 3, monthCap: 50, autoRouting: false } })
      .where(eq(schema.projects.id, TEST_IDS.PROJECT_ID));

    const result = await runRouter(TEST_IDS.WI_TOP_1);

    expect(result).toBe(false);
    expect(mockRunExecution).not.toHaveBeenCalled();
  });

  it("routes by default when autoRouting is not set", async () => {
    // Settings without autoRouting field — should default to routing
    await testDb.db
      .update(schema.projects)
      .set({ settings: { maxConcurrent: 3, monthCap: 50 } })
      .where(eq(schema.projects.id, TEST_IDS.PROJECT_ID));

    const result = await runRouter(TEST_IDS.WI_TOP_1);

    expect(result).toBe(true);
    expect(mockRunExecution).toHaveBeenCalledOnce();
  });

  it("returns false for non-existent work item", async () => {
    const result = await runRouter("wi-nonexistent");

    expect(result).toBe(false);
    expect(mockRunExecution).not.toHaveBeenCalled();
  });
});
