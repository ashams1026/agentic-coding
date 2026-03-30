import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../../test/setup.js";

const mockDb = { db: null as unknown };
vi.mock("../../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

import { proposalRoutes } from "../proposals.js";

let testDb: TestDatabase;
let app: FastifyInstance;

describe("proposal routes", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);
    app = Fastify({ logger: false });
    await proposalRoutes(app);
  });

  afterEach(async () => {
    await app.close();
    testDb.cleanup();
  });

  // ── GET /api/proposals ───────────────────────────────────────────

  describe("GET /api/proposals", () => {
    it("lists all proposals", async () => {
      const res = await app.inject({ method: "GET", url: "/api/proposals" });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(1); // 1 seeded
      expect(res.json().total).toBe(1);
    });

    it("filters by workItemId", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/proposals?workItemId=${TEST_IDS.WI_TOP_2}`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.length).toBeGreaterThan(0);
      for (const p of res.json().data) {
        expect(p.workItemId).toBe(TEST_IDS.WI_TOP_2);
      }
    });

    it("returns empty for workItemId with no proposals", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/proposals?workItemId=${TEST_IDS.WI_TOP_3}`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });
  });

  // ── POST /api/proposals ──────────────────────────────────────────

  describe("POST /api/proposals", () => {
    it("creates a proposal", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/proposals",
        payload: {
          executionId: TEST_IDS.EXEC_1,
          workItemId: TEST_IDS.WI_CHILD_1A,
          type: "task_creation",
          payload: { children: [{ title: "Sub-task A" }] },
        },
      });

      expect(res.statusCode).toBe(201);
      const data = res.json().data;
      expect(data.id).toMatch(/^pp-/);
      expect(data.executionId).toBe(TEST_IDS.EXEC_1);
      expect(data.workItemId).toBe(TEST_IDS.WI_CHILD_1A);
      expect(data.type).toBe("task_creation");
      expect(data.status).toBe("pending");
      expect(data.payload).toEqual({ children: [{ title: "Sub-task A" }] });
      expect(data.createdAt).toBeDefined();
    });
  });

  // ── PATCH /api/proposals/:id ─────────────────────────────────────

  describe("PATCH /api/proposals/:id", () => {
    it("approves a proposal", async () => {
      // First create a pending proposal
      const create = await app.inject({
        method: "POST",
        url: "/api/proposals",
        payload: {
          executionId: TEST_IDS.EXEC_2,
          workItemId: TEST_IDS.WI_TOP_1,
          type: "task_creation",
        },
      });
      const proposalId = create.json().data.id;

      const res = await app.inject({
        method: "PATCH",
        url: `/api/proposals/${proposalId}`,
        payload: { status: "approved" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.status).toBe("approved");
    });

    it("rejects a proposal", async () => {
      const create = await app.inject({
        method: "POST",
        url: "/api/proposals",
        payload: {
          executionId: TEST_IDS.EXEC_2,
          workItemId: TEST_IDS.WI_TOP_1,
          type: "task_creation",
        },
      });
      const proposalId = create.json().data.id;

      const res = await app.inject({
        method: "PATCH",
        url: `/api/proposals/${proposalId}`,
        payload: { status: "rejected" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.status).toBe("rejected");
    });

    it("returns 404 for non-existent id", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/proposals/pp-nonexistent",
        payload: { status: "approved" },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
