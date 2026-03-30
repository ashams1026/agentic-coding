import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../../test/setup.js";

// Mock the db connection — redirect to test db
const mockDb = { db: null as unknown };
vi.mock("../../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

// Mock agent side-effects (these call the SDK — the one thing we stub)
vi.mock("../../agent/dispatch.js", () => ({
  dispatchForState: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../agent/coordination.js", () => ({
  checkParentCoordination: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../agent/memory.js", () => ({
  checkMemoryGeneration: vi.fn().mockResolvedValue(undefined),
}));

import { workItemRoutes } from "../work-items.js";

let testDb: TestDatabase;
let app: FastifyInstance;

async function buildTestApp(): Promise<FastifyInstance> {
  const server = Fastify({ logger: false });
  await workItemRoutes(server);
  return server;
}

describe("work-items routes", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);
    app = await buildTestApp();
  });

  afterEach(async () => {
    await app.close();
    testDb.cleanup();
  });

  // ── POST /api/work-items ─────────────────────────────────────────

  describe("POST /api/work-items", () => {
    it("creates a top-level work item", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/work-items",
        payload: {
          projectId: TEST_IDS.PROJECT_ID,
          title: "New feature",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.data.title).toBe("New feature");
      expect(body.data.projectId).toBe(TEST_IDS.PROJECT_ID);
      expect(body.data.parentId).toBeNull();
      expect(body.data.currentState).toBe("Backlog");
      expect(body.data.priority).toBe("p2");
      expect(body.data.labels).toEqual([]);
      expect(body.data.id).toMatch(/^wi-/);
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.updatedAt).toBeDefined();
    });

    it("creates a child work item with parentId", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/work-items",
        payload: {
          projectId: TEST_IDS.PROJECT_ID,
          parentId: TEST_IDS.WI_TOP_1,
          title: "Child task",
          description: "A subtask",
          priority: "p1",
          labels: ["backend"],
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.data.parentId).toBe(TEST_IDS.WI_TOP_1);
      expect(body.data.description).toBe("A subtask");
      expect(body.data.priority).toBe("p1");
      expect(body.data.labels).toEqual(["backend"]);
    });
  });

  // ── GET /api/work-items/:id ──────────────────────────────────────

  describe("GET /api/work-items/:id", () => {
    it("returns a work item by id", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/work-items/${TEST_IDS.WI_TOP_1}`,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.id).toBe(TEST_IDS.WI_TOP_1);
      expect(body.data.title).toBeDefined();
      expect(body.data.projectId).toBe(TEST_IDS.PROJECT_ID);
    });

    it("returns 404 for non-existent id", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/work-items/wi-nonexistent",
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  // ── GET /api/work-items (list) ───────────────────────────────────

  describe("GET /api/work-items", () => {
    it("returns all work items without filters", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/work-items",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.length).toBe(9); // 3 top-level + 6 children from seed
      expect(body.total).toBe(9);
    });

    it("filters by projectId", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/work-items?projectId=${TEST_IDS.PROJECT_ID}`,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.length).toBe(9);
      for (const item of body.data) {
        expect(item.projectId).toBe(TEST_IDS.PROJECT_ID);
      }
    });

    it("filters by parentId", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/work-items?parentId=${TEST_IDS.WI_TOP_1}`,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.length).toBe(3); // 3 children of TOP_1
      for (const item of body.data) {
        expect(item.parentId).toBe(TEST_IDS.WI_TOP_1);
      }
    });

    it("returns empty for non-existent projectId", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/work-items?projectId=pj-nonexist",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  // ── PATCH /api/work-items/:id ────────────────────────────────────

  describe("PATCH /api/work-items/:id", () => {
    it("updates title and description", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/work-items/${TEST_IDS.WI_TOP_3}`,
        payload: {
          title: "Updated title",
          description: "Updated desc",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.title).toBe("Updated title");
      expect(body.data.description).toBe("Updated desc");
    });

    it("updates priority", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/work-items/${TEST_IDS.WI_TOP_3}`,
        payload: { priority: "p0" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.priority).toBe("p0");
    });

    it("updates labels", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/work-items/${TEST_IDS.WI_TOP_3}`,
        payload: { labels: ["urgent", "frontend"] },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.labels).toEqual(["urgent", "frontend"]);
    });

    it("updates currentState (valid transition)", async () => {
      // WI_TOP_3 is in "Backlog", valid transition → "Planning"
      const res = await app.inject({
        method: "PATCH",
        url: `/api/work-items/${TEST_IDS.WI_TOP_3}`,
        payload: { currentState: "Planning" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.currentState).toBe("Planning");
    });

    it("rejects invalid state transition", async () => {
      // WI_TOP_3 is in "Backlog" — transition to "Done" is not valid per workflow.
      const res = await app.inject({
        method: "PATCH",
        url: `/api/work-items/${TEST_IDS.WI_TOP_3}`,
        payload: { currentState: "Done" },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe("INVALID_TRANSITION");
    });

    it("returns 404 for non-existent id", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/work-items/wi-nonexistent",
        payload: { title: "nope" },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe("NOT_FOUND");
    });
  });

  // ── DELETE /api/work-items/:id ───────────────────────────────────

  describe("DELETE /api/work-items/:id", () => {
    it("deletes a leaf work item", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/work-items/${TEST_IDS.WI_CHILD_3A}`,
      });

      expect(res.statusCode).toBe(204);

      // Verify it's gone
      const get = await app.inject({
        method: "GET",
        url: `/api/work-items/${TEST_IDS.WI_CHILD_3A}`,
      });
      expect(get.statusCode).toBe(404);
    });

    it("recursively deletes parent and all children", async () => {
      // Use TOP_3 (1 child, no FK-linked executions/comments/edges)
      const res = await app.inject({
        method: "DELETE",
        url: `/api/work-items/${TEST_IDS.WI_TOP_3}`,
      });

      expect(res.statusCode).toBe(204);

      // Parent should be gone
      const getParent = await app.inject({
        method: "GET",
        url: `/api/work-items/${TEST_IDS.WI_TOP_3}`,
      });
      expect(getParent.statusCode).toBe(404);

      // Child should also be gone
      const getChild = await app.inject({
        method: "GET",
        url: `/api/work-items/${TEST_IDS.WI_CHILD_3A}`,
      });
      expect(getChild.statusCode).toBe(404);

      // Other items still exist
      const remaining = await app.inject({
        method: "GET",
        url: "/api/work-items",
      });
      expect(remaining.json().total).toBe(7); // 9 - 2 (parent + 1 child)
    });

    it("returns 204 even for non-existent id", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: "/api/work-items/wi-nonexistent",
      });

      expect(res.statusCode).toBe(204);
    });
  });

  // ── POST /api/work-items/:id/retry ────────────────────────────────

  describe("POST /api/work-items/:id/retry", () => {
    it("dispatches retry for existing work item", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/work-items/${TEST_IDS.WI_TOP_1}/retry`,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.workItemId).toBe(TEST_IDS.WI_TOP_1);
      expect(body.data.dispatched).toBe(true);
    });

    it("returns 404 for non-existent id", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/work-items/wi-nonexistent/retry",
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe("NOT_FOUND");
    });
  });

  // ── Response shape verification ──────────────────────────────────

  describe("response shapes", () => {
    it("serializes dates as ISO strings", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/work-items/${TEST_IDS.WI_TOP_1}`,
      });

      const item = res.json().data;
      expect(typeof item.createdAt).toBe("string");
      expect(typeof item.updatedAt).toBe("string");
      // Verify ISO format
      expect(new Date(item.createdAt).toISOString()).toBe(item.createdAt);
    });

    it("list response includes data array and total count", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/work-items",
      });

      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.total).toBe("number");
      expect(body.total).toBe(body.data.length);
    });
  });
});
