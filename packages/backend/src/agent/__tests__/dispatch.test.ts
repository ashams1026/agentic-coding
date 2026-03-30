import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../../test/setup.js";

const mockDb = { db: null as unknown };
vi.mock("../../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

// Stub the executor spawn — we're testing dispatch decisions, not agent execution
const mockRunExecution = vi.fn().mockResolvedValue("ex-mock001");
vi.mock("../execution-manager.js", () => ({
  runExecution: (...args: unknown[]) => mockRunExecution(...args),
}));

// Mock broadcast
vi.mock("../../ws.js", () => ({
  broadcast: vi.fn(),
}));

import { dispatchForState } from "../dispatch.js";
import { trackExecution, onComplete, getActiveCount } from "../concurrency.js";

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
});
