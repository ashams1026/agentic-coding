import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestDb, seedTestDb, type TestDatabase } from "../../test/setup.js";

const mockDb = { db: null as unknown };
vi.mock("../../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

import { dashboardRoutes } from "../dashboard.js";

let testDb: TestDatabase;
let app: FastifyInstance;

describe("dashboard routes", () => {
  afterEach(async () => {
    await app.close();
    testDb.cleanup();
  });

  // ── Empty DB tests ───────────────────────────────────────────────

  describe("with empty database", () => {
    beforeEach(async () => {
      testDb = createTestDb();
      mockDb.db = testDb.db;
      // No seeding — empty DB
      app = Fastify({ logger: false });
      await dashboardRoutes(app);
    });

    it("stats returns all zeros", async () => {
      const res = await app.inject({ method: "GET", url: "/api/dashboard/stats" });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.activeAgents).toBe(0);
      expect(data.pendingProposals).toBe(0);
      expect(data.needsAttention).toBe(0);
      expect(data.todayCostUsd).toBe(0);
    });

    it("execution-stats returns all zeros", async () => {
      const res = await app.inject({ method: "GET", url: "/api/dashboard/execution-stats" });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.totalRuns).toBe(0);
      expect(data.totalCostUsd).toBe(0);
      expect(data.successRate).toBe(0);
      expect(data.averageDurationMs).toBe(0);
    });

    it("ready-work returns empty", async () => {
      const res = await app.inject({ method: "GET", url: "/api/dashboard/ready-work" });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
      expect(res.json().total).toBe(0);
    });
  });

  // ── Seeded DB tests ──────────────────────────────────────────────

  describe("with seeded database", () => {
    beforeEach(async () => {
      testDb = createTestDb();
      mockDb.db = testDb.db;
      await seedTestDb(testDb.db);
      app = Fastify({ logger: false });
      await dashboardRoutes(app);
    });

    describe("GET /api/dashboard/stats", () => {
      it("returns correct aggregate counts", async () => {
        const res = await app.inject({ method: "GET", url: "/api/dashboard/stats" });

        expect(res.statusCode).toBe(200);
        const data = res.json();
        // Seed: 1 running execution (EXEC_3)
        expect(data.activeAgents).toBe(1);
        // Seed: 1 proposal with status "approved" → 0 pending
        expect(data.pendingProposals).toBe(0);
        // No blocked items in seed
        expect(data.needsAttention).toBe(0);
        // Seeded executions are from March 25-28, not today → 0
        expect(data.todayCostUsd).toBe(0);
      });
    });

    describe("GET /api/dashboard/cost-summary", () => {
      it("returns 7-day daily spend and month total", async () => {
        const res = await app.inject({ method: "GET", url: "/api/dashboard/cost-summary" });

        expect(res.statusCode).toBe(200);
        const data = res.json();
        expect(data.dailySpend).toHaveLength(7);
        for (const day of data.dailySpend) {
          expect(day).toHaveProperty("date");
          expect(day).toHaveProperty("costUsd");
          expect(typeof day.date).toBe("string");
          expect(typeof day.costUsd).toBe("number");
        }
        expect(typeof data.monthTotal).toBe("number");
        expect(typeof data.monthCap).toBe("number");
      });
    });

    describe("GET /api/dashboard/execution-stats", () => {
      it("returns correct execution statistics", async () => {
        const res = await app.inject({ method: "GET", url: "/api/dashboard/execution-stats" });

        expect(res.statusCode).toBe(200);
        const data = res.json();
        // Seed: 3 completed executions (EXEC_1, EXEC_2, EXEC_4)
        expect(data.totalRuns).toBe(3);
        // Cost: 42 + 18 + 85 = 145
        expect(data.totalCostUsd).toBe(145);
        // All 3 completed with outcome "success"
        expect(data.successRate).toBe(1);
        expect(data.averageDurationMs).toBeGreaterThan(0);
      });
    });

    describe("GET /api/dashboard/ready-work", () => {
      it("returns work items in Ready state", async () => {
        const res = await app.inject({ method: "GET", url: "/api/dashboard/ready-work" });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        // Seed: WI_CHILD_1C is in "Ready" state
        expect(body.data.length).toBeGreaterThan(0);
        for (const item of body.data) {
          expect(item.workItem.currentState).toBe("Ready");
          expect(item).toHaveProperty("persona");
        }
      });
    });
  });
});
