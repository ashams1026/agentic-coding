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

const TEST_WORKFLOW_ID = "wf-test001";

let testDb: TestDatabase;

describe("router auto-routing toggle", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);

    // Seed a workflow that work items can reference
    await testDb.db.insert(schema.workflows).values({
      id: TEST_WORKFLOW_ID,
      name: "Test Workflow",
      description: "",
      scope: "project",
      projectId: TEST_IDS.PROJECT_ID,
      version: 1,
      isPublished: true,
      autoRouting: true,
      createdAt: new Date("2026-03-20T10:00:00Z"),
      updatedAt: new Date("2026-03-20T10:00:00Z"),
    });

    // Assign the workflow to the test work item
    await testDb.db
      .update(schema.workItems)
      .set({ workflowId: TEST_WORKFLOW_ID })
      .where(eq(schema.workItems.id, TEST_IDS.WI_TOP_1));

    mockRunExecution.mockClear();
  });

  afterEach(() => {
    testDb.cleanup();
  });

  it("routes when workflow autoRouting is true", async () => {
    await testDb.db
      .update(schema.workflows)
      .set({ autoRouting: true })
      .where(eq(schema.workflows.id, TEST_WORKFLOW_ID));

    const result = await runRouter(TEST_IDS.WI_TOP_1);

    expect(result).toBe(true);
    expect(mockRunExecution).toHaveBeenCalledOnce();
  });

  it("skips routing when workflow autoRouting is false", async () => {
    await testDb.db
      .update(schema.workflows)
      .set({ autoRouting: false })
      .where(eq(schema.workflows.id, TEST_WORKFLOW_ID));

    const result = await runRouter(TEST_IDS.WI_TOP_1);

    expect(result).toBe(false);
    expect(mockRunExecution).not.toHaveBeenCalled();
  });

  it("routes by default when work item has no workflowId", async () => {
    // Unset workflowId — router should default to routing
    await testDb.db
      .update(schema.workItems)
      .set({ workflowId: null })
      .where(eq(schema.workItems.id, TEST_IDS.WI_TOP_1));

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
