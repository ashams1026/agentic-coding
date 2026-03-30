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

vi.mock("../../ws.js", () => ({
  broadcast: vi.fn(),
}));

// Mock router and dispatch (fire-and-forget chains)
vi.mock("../router.js", () => ({
  runRouter: vi.fn().mockResolvedValue(false),
}));
vi.mock("../dispatch.js", () => ({
  dispatchForState: vi.fn().mockResolvedValue(undefined),
}));

// Use vi.hoisted so mocks are available inside vi.mock factories (which are hoisted)
const { mockSpawn, mockTrackExecution, mockOnComplete, mockGetProjectCostSummary } = vi.hoisted(() => ({
  mockSpawn: vi.fn(),
  mockTrackExecution: vi.fn(),
  mockOnComplete: vi.fn().mockReturnValue(null),
  mockGetProjectCostSummary: vi.fn().mockResolvedValue({ todayCostUsd: 0, monthCostUsd: 0 }),
}));
// Mock ClaudeExecutor — the one thing we stub
vi.mock("../claude-executor.js", () => ({
  ClaudeExecutor: class {
    spawn = mockSpawn;
  },
}));

// Mock concurrency — avoid shared state issues across test files
vi.mock("../concurrency.js", () => ({
  trackExecution: (...args: unknown[]) => mockTrackExecution(...args),
  onComplete: (...args: unknown[]) => mockOnComplete(...args),
  getProjectCostSummary: (...args: unknown[]) => mockGetProjectCostSummary(...args),
}));

import { runExecution, canTransition, handleRejection } from "../execution-manager.js";

let testDb: TestDatabase;

// Helper: create an async iterable from events
function createMockEvents(events: Array<{ type: string; [key: string]: unknown }>) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const event of events) {
        yield event;
      }
    },
  };
}

describe("execution manager", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);
    mockSpawn.mockReset();
    mockTrackExecution.mockClear();
    mockOnComplete.mockClear().mockReturnValue(null);
  });

  afterEach(() => {
    testDb.cleanup();
  });

  // ── runExecution creates DB record ───────────────────────────────

  describe("runExecution", () => {
    it("creates DB record with status running", async () => {
      // Mock executor that yields a simple result
      mockSpawn.mockReturnValue(
        createMockEvents([
          { type: "result", summary: "Done", outcome: "success", costUsd: 0.5, durationMs: 1000 },
        ]),
      );

      const executionId = await runExecution(TEST_IDS.WI_TOP_1, TEST_IDS.PERSONA_PM);

      expect(executionId).toMatch(/^ex-/);

      // The DB record should exist (created synchronously before background stream)
      const [record] = await testDb.db
        .select()
        .from(schema.executions)
        .where(eq(schema.executions.id, executionId));
      expect(record).toBeDefined();
      expect(record!.status).toBe("running");
      expect(record!.workItemId).toBe(TEST_IDS.WI_TOP_1);
      expect(record!.personaId).toBe(TEST_IDS.PERSONA_PM);

      // Verify trackExecution was called
      expect(mockTrackExecution).toHaveBeenCalledWith(executionId);
    });

    it("updates record to completed on executor success", async () => {
      mockSpawn.mockReturnValue(
        createMockEvents([
          { type: "text", content: "Working on it..." },
          { type: "result", summary: "Task completed", outcome: "success", costUsd: 1.5, durationMs: 3000 },
        ]),
      );

      const executionId = await runExecution(TEST_IDS.WI_TOP_1, TEST_IDS.PERSONA_PM);

      // Wait for background stream to complete
      await vi.waitFor(async () => {
        const [record] = await testDb.db
          .select()
          .from(schema.executions)
          .where(eq(schema.executions.id, executionId));
        expect(record!.status).toBe("completed");
      }, { timeout: 2000 });

      const [record] = await testDb.db
        .select()
        .from(schema.executions)
        .where(eq(schema.executions.id, executionId));
      expect(record!.outcome).toBe("success");
      expect(record!.summary).toBe("Task completed");
      expect(record!.costUsd).toBe(150); // 1.5 * 100 = 150 cents
      expect(record!.durationMs).toBe(3000);
    });

    it("updates record to failed on executor error", async () => {
      mockSpawn.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          throw new Error("Agent crashed");
        },
      });

      const executionId = await runExecution(TEST_IDS.WI_TOP_1, TEST_IDS.PERSONA_PM);

      // Wait for background stream to fail
      await vi.waitFor(async () => {
        const [record] = await testDb.db
          .select()
          .from(schema.executions)
          .where(eq(schema.executions.id, executionId));
        expect(record!.status).toBe("failed");
      }, { timeout: 2000 });

      const [record] = await testDb.db
        .select()
        .from(schema.executions)
        .where(eq(schema.executions.id, executionId));
      expect(record!.outcome).toBe("failure");
      expect(record!.summary).toContain("Agent crashed");
      expect(record!.logs).toContain("FATAL");
    });
  });

  // ── Transition rate limiting ─────────────────────────────────────

  describe("canTransition", () => {
    it("returns true for a work item with no recent transitions", () => {
      expect(canTransition("wi-fresh0001")).toBe(true);
    });

    it("tracks transitions via the rate limiter", () => {
      // canTransition checks the in-memory log. Without recordTransition
      // (which is private), canTransition should always return true for fresh IDs.
      // The rate limiter is tested indirectly through the full execution path.
      const id = "wi-ratelimit1";
      for (let i = 0; i < 10; i++) {
        expect(canTransition(id)).toBe(true);
      }
      // canTransition only reads, doesn't add — so it stays true
      // The actual rate limiting happens inside runExecutionStream via recordTransition
      expect(canTransition(id)).toBe(true);
    });
  });

  // ── Rejection and retry logic ────────────────────────────────────

  describe("handleRejection", () => {
    it("increments retry counter", async () => {
      const result = await handleRejection(TEST_IDS.WI_CHILD_1B, "Code quality issues");

      expect(result.retryCount).toBe(1);
      expect(result.blocked).toBe(false);
      expect(result.targetState).toBe("In Progress");

      // Verify executionContext updated in DB
      const [item] = await testDb.db
        .select({ executionContext: schema.workItems.executionContext })
        .from(schema.workItems)
        .where(eq(schema.workItems.id, TEST_IDS.WI_CHILD_1B));
      const ctx = item!.executionContext as Array<{ rejectionPayload: unknown }>;
      const rejections = ctx.filter((e) => e.rejectionPayload !== null);
      expect(rejections).toHaveLength(1);
    });

    it("triggers Blocked state after max retries", async () => {
      // Call handleRejection 3 times to hit MAX_REJECTIONS
      await handleRejection(TEST_IDS.WI_CHILD_1B, "Issue 1");
      await handleRejection(TEST_IDS.WI_CHILD_1B, "Issue 2");
      const result = await handleRejection(TEST_IDS.WI_CHILD_1B, "Issue 3");

      expect(result.retryCount).toBe(3);
      expect(result.blocked).toBe(true);
      expect(result.targetState).toBe("Blocked");
    });

    it("stores rejection payload with reason and severity", async () => {
      await handleRejection(TEST_IDS.WI_CHILD_1C, "Missing tests", "high", "Add unit tests");

      const [item] = await testDb.db
        .select({ executionContext: schema.workItems.executionContext })
        .from(schema.workItems)
        .where(eq(schema.workItems.id, TEST_IDS.WI_CHILD_1C));
      const ctx = item!.executionContext as Array<{ rejectionPayload: { reason: string; severity: string; hint: string } | null }>;
      const rejection = ctx.find((e) => e.rejectionPayload !== null);
      expect(rejection).toBeDefined();
      expect(rejection!.rejectionPayload!.reason).toBe("Missing tests");
      expect(rejection!.rejectionPayload!.severity).toBe("high");
      expect(rejection!.rejectionPayload!.hint).toBe("Add unit tests");
    });
  });
});
