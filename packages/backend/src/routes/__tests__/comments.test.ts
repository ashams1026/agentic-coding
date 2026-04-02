import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../../test/setup.js";

const mockDb = { db: null as unknown };
vi.mock("../../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

import { commentRoutes } from "../comments.js";

let testDb: TestDatabase;
let app: FastifyInstance;

describe("comment routes", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);
    app = Fastify({ logger: false });
    await commentRoutes(app);
  });

  afterEach(async () => {
    await app.close();
    testDb.cleanup();
  });

  // ── GET /api/comments ────────────────────────────────────────────

  describe("GET /api/comments", () => {
    it("lists all comments", async () => {
      const res = await app.inject({ method: "GET", url: "/api/comments" });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(5);
      expect(res.json().total).toBe(5);
    });

    it("filters by workItemId", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/comments?workItemId=${TEST_IDS.WI_TOP_1}`,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      for (const c of body.data) {
        expect(c.workItemId).toBe(TEST_IDS.WI_TOP_1);
      }
      expect(body.data.length).toBeGreaterThan(0);
    });

    it("returns empty for workItemId with no comments", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/comments?workItemId=${TEST_IDS.WI_CHILD_3A}`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });
  });

  // ── POST /api/comments ───────────────────────────────────────────

  describe("POST /api/comments", () => {
    it("creates a user comment", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/comments",
        payload: {
          workItemId: TEST_IDS.WI_TOP_1,
          authorType: "user",
          authorName: "Test User",
          content: "A user comment",
        },
      });

      expect(res.statusCode).toBe(201);
      const data = res.json().data;
      expect(data.id).toMatch(/^cm-/);
      expect(data.authorType).toBe("user");
      expect(data.authorName).toBe("Test User");
      expect(data.content).toBe("A user comment");
      expect(data.authorId).toBeNull();
      expect(data.createdAt).toBeDefined();
    });

    it("creates an agent comment with authorId", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/comments",
        payload: {
          workItemId: TEST_IDS.WI_TOP_2,
          authorType: "agent",
          authorId: TEST_IDS.AGENT_ENGINEER,
          authorName: "Engineer",
          content: "Agent analysis complete.",
        },
      });

      expect(res.statusCode).toBe(201);
      const data = res.json().data;
      expect(data.authorType).toBe("agent");
      expect(data.authorId).toBe(TEST_IDS.AGENT_ENGINEER);
    });

    it("creates a system comment", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/comments",
        payload: {
          workItemId: TEST_IDS.WI_TOP_1,
          authorType: "system",
          authorName: "System",
          content: "State changed to Done",
          metadata: { fromState: "In Review", toState: "Done" },
        },
      });

      expect(res.statusCode).toBe(201);
      const data = res.json().data;
      expect(data.authorType).toBe("system");
      expect(data.metadata).toEqual({ fromState: "In Review", toState: "Done" });
    });
  });
});
