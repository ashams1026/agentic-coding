import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../../test/setup.js";

const mockDb = { db: null as unknown };
vi.mock("../../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

import { workItemEdgeRoutes } from "../work-item-edges.js";

let testDb: TestDatabase;
let app: FastifyInstance;

describe("work-item-edges routes", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);
    app = Fastify({ logger: false });
    await workItemEdgeRoutes(app);
  });

  afterEach(async () => {
    await app.close();
    testDb.cleanup();
  });

  // ── GET /api/work-item-edges ─────────────────────────────────────

  describe("GET /api/work-item-edges", () => {
    it("lists all edges", async () => {
      const res = await app.inject({ method: "GET", url: "/api/work-item-edges" });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(2); // 2 seeded
      expect(res.json().total).toBe(2);
    });

    it("filters by workItemId (matches from or to)", async () => {
      // WI_CHILD_1B appears as toId in edge 1 and fromId in edge 2
      const res = await app.inject({
        method: "GET",
        url: `/api/work-item-edges?workItemId=${TEST_IDS.WI_CHILD_1B}`,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(2);
      for (const edge of body.data) {
        expect(
          edge.fromId === TEST_IDS.WI_CHILD_1B || edge.toId === TEST_IDS.WI_CHILD_1B,
        ).toBe(true);
      }
    });

    it("returns empty for workItemId with no edges", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/work-item-edges?workItemId=${TEST_IDS.WI_TOP_3}`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });
  });

  // ── POST /api/work-item-edges ────────────────────────────────────

  describe("POST /api/work-item-edges", () => {
    it("creates a depends_on edge", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/work-item-edges",
        payload: {
          fromId: TEST_IDS.WI_CHILD_2A,
          toId: TEST_IDS.WI_CHILD_2B,
          type: "depends_on",
        },
      });

      expect(res.statusCode).toBe(201);
      const data = res.json().data;
      expect(data.id).toMatch(/^we-/);
      expect(data.fromId).toBe(TEST_IDS.WI_CHILD_2A);
      expect(data.toId).toBe(TEST_IDS.WI_CHILD_2B);
      expect(data.type).toBe("depends_on");
    });

    it("creates a blocks edge", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/work-item-edges",
        payload: {
          fromId: TEST_IDS.WI_TOP_1,
          toId: TEST_IDS.WI_TOP_2,
          type: "blocks",
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().data.type).toBe("blocks");
    });

    it("creates a related_to edge", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/work-item-edges",
        payload: {
          fromId: TEST_IDS.WI_TOP_2,
          toId: TEST_IDS.WI_TOP_3,
          type: "related_to",
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().data.type).toBe("related_to");
    });
  });

  // ── DELETE /api/work-item-edges/:id ──────────────────────────────

  describe("DELETE /api/work-item-edges/:id", () => {
    it("deletes an edge", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: "/api/work-item-edges/we-test001",
      });

      expect(res.statusCode).toBe(204);

      // Verify it's gone
      const list = await app.inject({ method: "GET", url: "/api/work-item-edges" });
      expect(list.json().total).toBe(1); // was 2, now 1
    });

    it("returns 404 for non-existent id", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: "/api/work-item-edges/we-nonexistent",
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe("NOT_FOUND");
    });
  });

  // ── Cycle detection ──────────────────────────────────────────────

  describe("cycle detection", () => {
    it("allows creating a cycle (no server-side cycle detection)", async () => {
      // Create A→B→C→A cycle: seeded has 1A→1B (blocks) and 1B→1C (depends_on)
      // Adding 1C→1A would complete the cycle.
      // The route does NOT detect cycles — it accepts any edge.
      // Cycle detection is an application-level concern, not enforced at the route layer.
      const res = await app.inject({
        method: "POST",
        url: "/api/work-item-edges",
        payload: {
          fromId: TEST_IDS.WI_CHILD_1C,
          toId: TEST_IDS.WI_CHILD_1A,
          type: "depends_on",
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().data.fromId).toBe(TEST_IDS.WI_CHILD_1C);
      expect(res.json().data.toId).toBe(TEST_IDS.WI_CHILD_1A);
    });
  });
});
