import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../../test/setup.js";

const mockDb = { db: null as unknown };
vi.mock("../../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

// Import after mock setup
import {
  canSpawn,
  trackExecution,
  onComplete,
  enqueue,
  getActiveCount,
  getQueueLength,
} from "../concurrency.js";

let testDb: TestDatabase;

// Track what we register so we can clean up between tests
let trackedIds: string[] = [];

describe("concurrency limiter", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);
    trackedIds = [];
  });

  afterEach(() => {
    // Clean up all tracked executions to reset module state
    for (const id of trackedIds) {
      onComplete(id);
    }
    // Drain the queue
    while (getQueueLength() > 0) {
      onComplete("__drain__");
    }
    testDb.cleanup();
  });

  function track(id: string) {
    trackExecution(id);
    trackedIds.push(id);
  }

  // ── canSpawn ─────────────────────────────────────────────────────

  describe("canSpawn", () => {
    it("returns true when under limit", async () => {
      // Seed project has maxConcurrent: 3, no active executions
      expect(await canSpawn(TEST_IDS.PROJECT_ID)).toBe(true);
    });

    it("returns true when at limit minus one", async () => {
      track("ex-a");
      track("ex-b");
      // 2 active, limit 3
      expect(await canSpawn(TEST_IDS.PROJECT_ID)).toBe(true);
    });

    it("returns false when at limit", async () => {
      track("ex-a");
      track("ex-b");
      track("ex-c");
      // 3 active, limit 3
      expect(await canSpawn(TEST_IDS.PROJECT_ID)).toBe(false);
    });

    it("returns true again after onComplete frees a slot", async () => {
      track("ex-a");
      track("ex-b");
      track("ex-c");
      expect(await canSpawn(TEST_IDS.PROJECT_ID)).toBe(false);

      onComplete("ex-a");
      trackedIds = trackedIds.filter((id) => id !== "ex-a");
      expect(await canSpawn(TEST_IDS.PROJECT_ID)).toBe(true);
    });
  });

  // ── trackExecution / getActiveCount ──────────────────────────────

  describe("trackExecution / getActiveCount", () => {
    it("starts at zero", () => {
      expect(getActiveCount()).toBe(0);
    });

    it("increments on track", () => {
      track("ex-1");
      expect(getActiveCount()).toBe(1);
      track("ex-2");
      expect(getActiveCount()).toBe(2);
    });

    it("decrements on complete", () => {
      track("ex-1");
      track("ex-2");
      expect(getActiveCount()).toBe(2);

      onComplete("ex-1");
      trackedIds = trackedIds.filter((id) => id !== "ex-1");
      expect(getActiveCount()).toBe(1);
    });
  });

  // ── enqueue / getQueueLength ─────────────────────────────────────

  describe("enqueue / getQueueLength", () => {
    it("starts with empty queue", () => {
      expect(getQueueLength()).toBe(0);
    });

    it("enqueue adds to queue", async () => {
      await enqueue(TEST_IDS.WI_TOP_1, TEST_IDS.PERSONA_PM);
      expect(getQueueLength()).toBe(1);
    });

    it("multiple enqueues increase length", async () => {
      await enqueue(TEST_IDS.WI_TOP_1, TEST_IDS.PERSONA_PM);
      await enqueue(TEST_IDS.WI_TOP_2, TEST_IDS.PERSONA_TECH_LEAD);
      expect(getQueueLength()).toBe(2);
    });
  });

  // ── onComplete dequeues ──────────────────────────────────────────

  describe("onComplete dequeues", () => {
    it("returns null when queue is empty", () => {
      track("ex-1");
      const next = onComplete("ex-1");
      trackedIds = trackedIds.filter((id) => id !== "ex-1");
      expect(next).toBeNull();
    });

    it("dequeues next entry from queue", async () => {
      await enqueue(TEST_IDS.WI_TOP_1, TEST_IDS.PERSONA_PM);
      track("ex-1");

      const next = onComplete("ex-1");
      trackedIds = trackedIds.filter((id) => id !== "ex-1");
      expect(next).not.toBeNull();
      expect(next!.workItemId).toBe(TEST_IDS.WI_TOP_1);
      expect(next!.personaId).toBe(TEST_IDS.PERSONA_PM);
    });

    it("dequeues by priority (P0 before P3)", async () => {
      // WI_TOP_3 is in Backlog with default priority p2
      // WI_CHILD_1A has priority p1 in seed
      // Enqueue low priority first, then high priority
      await enqueue(TEST_IDS.WI_TOP_3, TEST_IDS.PERSONA_PM); // p2
      await enqueue(TEST_IDS.WI_CHILD_1A, TEST_IDS.PERSONA_ENGINEER); // p1

      track("ex-done");
      const first = onComplete("ex-done");
      trackedIds = trackedIds.filter((id) => id !== "ex-done");

      // p1 should come out before p2
      expect(first).not.toBeNull();
      expect(first!.workItemId).toBe(TEST_IDS.WI_CHILD_1A);
    });

    it("FIFO within same priority", async () => {
      // Both WI_TOP_2 and WI_TOP_3 have p2 priority
      await enqueue(TEST_IDS.WI_TOP_2, TEST_IDS.PERSONA_PM); // first p2
      await enqueue(TEST_IDS.WI_TOP_3, TEST_IDS.PERSONA_TECH_LEAD); // second p2

      track("ex-done1");
      const first = onComplete("ex-done1");
      trackedIds = trackedIds.filter((id) => id !== "ex-done1");
      expect(first!.workItemId).toBe(TEST_IDS.WI_TOP_2); // enqueued first

      track("ex-done2");
      const second = onComplete("ex-done2");
      trackedIds = trackedIds.filter((id) => id !== "ex-done2");
      expect(second!.workItemId).toBe(TEST_IDS.WI_TOP_3); // enqueued second
    });
  });
});
