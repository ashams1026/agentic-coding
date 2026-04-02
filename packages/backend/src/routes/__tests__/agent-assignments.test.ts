import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../../test/setup.js";

const mockDb = { db: null as unknown };
vi.mock("../../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

import { agentAssignmentRoutes } from "../agent-assignments.js";

let testDb: TestDatabase;
let app: FastifyInstance;

describe("agent-assignment routes", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);
    app = Fastify({ logger: false });
    await agentAssignmentRoutes(app);
  });

  afterEach(async () => {
    await app.close();
    testDb.cleanup();
  });

  // ── GET /api/agent-assignments ─────────────────────────────────

  describe("GET /api/agent-assignments", () => {
    it("lists all assignments", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/agent-assignments",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(4); // 4 seeded assignments
      expect(body.total).toBe(4);
    });

    it("filters by projectId", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/agent-assignments?projectId=${TEST_IDS.PROJECT_ID}`,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(4);
      for (const a of body.data) {
        expect(a.projectId).toBe(TEST_IDS.PROJECT_ID);
      }
    });

    it("returns empty for non-existent projectId", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/agent-assignments?projectId=pj-nonexist",
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });
  });

  // ── PUT /api/agent-assignments (upsert) ────────────────────────

  describe("PUT /api/agent-assignments", () => {
    it("creates a new assignment", async () => {
      const res = await app.inject({
        method: "PUT",
        url: "/api/agent-assignments",
        payload: {
          projectId: TEST_IDS.PROJECT_ID,
          stateName: "Done",
          agentId: TEST_IDS.AGENT_QA,
        },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      expect(data.projectId).toBe(TEST_IDS.PROJECT_ID);
      expect(data.stateName).toBe("Done");
      expect(data.agentId).toBe(TEST_IDS.AGENT_QA);

      // Verify total increased
      const list = await app.inject({
        method: "GET",
        url: `/api/agent-assignments?projectId=${TEST_IDS.PROJECT_ID}`,
      });
      expect(list.json().total).toBe(5); // 4 seeded + 1 new
    });

    it("updates existing assignment (upsert on conflict)", async () => {
      // Seed has Planning → PM. Upsert Planning → Tech Lead.
      const res = await app.inject({
        method: "PUT",
        url: "/api/agent-assignments",
        payload: {
          projectId: TEST_IDS.PROJECT_ID,
          stateName: "Planning",
          agentId: TEST_IDS.AGENT_TECH_LEAD,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.agentId).toBe(TEST_IDS.AGENT_TECH_LEAD);

      // Verify total didn't change (upsert, not insert)
      const list = await app.inject({
        method: "GET",
        url: `/api/agent-assignments?projectId=${TEST_IDS.PROJECT_ID}`,
      });
      expect(list.json().total).toBe(4);
    });

    it("links a valid agent to a valid state", async () => {
      const res = await app.inject({
        method: "PUT",
        url: "/api/agent-assignments",
        payload: {
          projectId: TEST_IDS.PROJECT_ID,
          stateName: "Ready",
          agentId: TEST_IDS.AGENT_ENGINEER,
        },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      expect(data.stateName).toBe("Ready");
      expect(data.agentId).toBe(TEST_IDS.AGENT_ENGINEER);
    });
  });
});
