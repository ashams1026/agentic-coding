import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../../test/setup.js";

const mockDb = { db: null as unknown };
vi.mock("../../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

import { agentRoutes } from "../agents.js";

let testDb: TestDatabase;
let app: FastifyInstance;

describe("agent routes", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);
    app = Fastify({ logger: false });
    await agentRoutes(app);
  });

  afterEach(async () => {
    await app.close();
    testDb.cleanup();
  });

  // ── GET /api/agents ────────────────────────────────────────────

  describe("GET /api/agents", () => {
    it("lists all agents", async () => {
      const res = await app.inject({ method: "GET", url: "/api/agents" });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(5); // 5 seeded agents
      expect(body.total).toBe(5);
    });
  });

  // ── GET /api/agents/:id ────────────────────────────────────────

  describe("GET /api/agents/:id", () => {
    it("returns a agent by id", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/agents/${TEST_IDS.AGENT_PM}`,
      });

      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      expect(data.id).toBe(TEST_IDS.AGENT_PM);
      expect(data.name).toBe("PM");
      expect(data.model).toBe("sonnet");
      expect(data.systemPrompt).toBeDefined();
    });

    it("returns 404 for non-existent id", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/agents/ps-nonexistent",
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe("NOT_FOUND");
    });
  });

  // ── POST /api/agents ───────────────────────────────────────────

  describe("POST /api/agents", () => {
    it("creates a agent with required fields", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/agents",
        payload: {
          name: "Tester",
          systemPrompt: "You are a tester.",
          model: "haiku",
        },
      });

      expect(res.statusCode).toBe(201);
      const data = res.json().data;
      expect(data.name).toBe("Tester");
      expect(data.systemPrompt).toBe("You are a tester.");
      expect(data.model).toBe("haiku");
      expect(data.id).toMatch(/^ps-/);
      expect(data.allowedTools).toEqual([]);
      expect(data.mcpTools).toEqual([]);
      expect(data.maxBudgetPerRun).toBe(0);
    });

    it("creates a agent with all optional fields", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/agents",
        payload: {
          name: "Full Agent",
          description: "A fully configured agent",
          avatar: { color: "#ff0000", icon: "star" },
          systemPrompt: "You are everything.",
          model: "opus",
          allowedTools: ["Read", "Bash"],
          mcpTools: ["post_comment", "route_to_state"],
          maxBudgetPerRun: 100,
        },
      });

      expect(res.statusCode).toBe(201);
      const data = res.json().data;
      expect(data.description).toBe("A fully configured agent");
      expect(data.avatar).toEqual({ color: "#ff0000", icon: "star" });
      expect(data.allowedTools).toEqual(["Read", "Bash"]);
      expect(data.mcpTools).toEqual(["post_comment", "route_to_state"]);
      expect(data.maxBudgetPerRun).toBe(100);
    });
  });

  // ── PATCH /api/agents/:id ──────────────────────────────────────

  describe("PATCH /api/agents/:id", () => {
    it("updates name and model", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/agents/${TEST_IDS.AGENT_PM}`,
        payload: { name: "Senior PM", model: "opus" },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      expect(data.name).toBe("Senior PM");
      expect(data.model).toBe("opus");
    });

    it("updates allowedTools", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/agents/${TEST_IDS.AGENT_ENGINEER}`,
        payload: { allowedTools: ["Read", "Write", "Bash", "Grep"] },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.allowedTools).toEqual(["Read", "Write", "Bash", "Grep"]);
    });

    it("returns 404 for non-existent id", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/agents/ps-nonexistent",
        payload: { name: "nope" },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe("NOT_FOUND");
    });

    it("returns 400 for empty update body", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/agents/${TEST_IDS.AGENT_PM}`,
        payload: {},
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe("BAD_REQUEST");
    });
  });

  // ── DELETE /api/agents/:id ─────────────────────────────────────

  describe("DELETE /api/agents/:id", () => {
    it("deletes an agent", async () => {
      // Use QA agent — not referenced by agent assignments in seed
      const res = await app.inject({
        method: "DELETE",
        url: `/api/agents/${TEST_IDS.AGENT_QA}`,
      });

      expect(res.statusCode).toBe(204);

      // Verify it's gone
      const get = await app.inject({
        method: "GET",
        url: `/api/agents/${TEST_IDS.AGENT_QA}`,
      });
      expect(get.statusCode).toBe(404);
    });

    it("returns 404 for non-existent id", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: "/api/agents/ps-nonexistent",
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe("NOT_FOUND");
    });
  });
});
