import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../../test/setup.js";

const { mockDb } = vi.hoisted(() => ({
  mockDb: { db: null as unknown },
}));
vi.mock("../../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

import { executionRoutes } from "../executions.js";

let testDb: TestDatabase;
let app: FastifyInstance;

describe("execution routes", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);
    app = Fastify({ logger: false });
    await executionRoutes(app);
  });

  afterEach(async () => {
    await app.close();
    testDb.cleanup();
  });

  // ── GET /api/executions ──────────────────────────────────────────

  describe("GET /api/executions", () => {
    it("lists all executions", async () => {
      const res = await app.inject({ method: "GET", url: "/api/executions" });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(4); // 4 seeded
      expect(res.json().total).toBe(4);
    });

    it("filters by workItemId", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/executions?workItemId=${TEST_IDS.WI_CHILD_1A}`,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.length).toBeGreaterThan(0);
      for (const e of body.data) {
        expect(e.workItemId).toBe(TEST_IDS.WI_CHILD_1A);
      }
    });
  });

  // ── POST /api/executions ─────────────────────────────────────────

  describe("POST /api/executions", () => {
    it("creates an execution", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/executions",
        payload: {
          workItemId: TEST_IDS.WI_TOP_3,
          agentId: TEST_IDS.AGENT_PM,
        },
      });

      expect(res.statusCode).toBe(201);
      const data = res.json().data;
      expect(data.id).toMatch(/^ex-/);
      expect(data.workItemId).toBe(TEST_IDS.WI_TOP_3);
      expect(data.agentId).toBe(TEST_IDS.AGENT_PM);
      expect(data.status).toBe("pending");
      expect(data.costUsd).toBe(0);
      expect(data.durationMs).toBe(0);
      expect(data.summary).toBe("");
      expect(data.outcome).toBeNull();
      expect(data.startedAt).toBeDefined();
    });
  });

  // ── PATCH /api/executions/:id ────────────────────────────────────

  describe("PATCH /api/executions/:id", () => {
    it("updates status and outcome", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/executions/${TEST_IDS.EXEC_3}`, // running execution
        payload: {
          status: "completed",
          outcome: "success",
          summary: "Task done",
          costUsd: 25,
          durationMs: 45000,
        },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      expect(data.status).toBe("completed");
      expect(data.outcome).toBe("success");
      expect(data.summary).toBe("Task done");
      expect(data.costUsd).toBe(25);
      expect(data.durationMs).toBe(45000);
    });

    it("updates status to failed", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/executions/${TEST_IDS.EXEC_3}`,
        payload: {
          status: "failed",
          outcome: "error",
          summary: "Agent crashed",
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.status).toBe("failed");
      expect(res.json().data.outcome).toBe("error");
    });

    it("returns 404 for non-existent id", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/executions/ex-nonexistent",
        payload: { status: "completed" },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ── Response shape ───────────────────────────────────────────────

  describe("response shape", () => {
    it("serializes dates as ISO strings", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/executions/${TEST_IDS.EXEC_1}`,
      });

      const data = res.json().data;
      expect(typeof data.startedAt).toBe("string");
      expect(new Date(data.startedAt).toISOString()).toBe(data.startedAt);
    });
  });
});
