import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "../../test/setup.js";
import * as schema from "../../db/schema.js";

const mockDb = { db: null as unknown };
vi.mock("../../db/connection.js", () => ({
  get db() {
    return mockDb.db;
  },
}));

vi.mock("../../ws.js", () => ({
  broadcast: vi.fn(),
}));

// Mock coordination and memory (non-blocking side effects)
vi.mock("../coordination.js", () => ({
  checkParentCoordination: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../memory.js", () => ({
  checkMemoryGeneration: vi.fn().mockResolvedValue(undefined),
  getRecentMemories: vi.fn().mockResolvedValue([]),
}));
vi.mock("../execution-manager.js", () => ({
  handleRejection: vi.fn().mockResolvedValue({ targetState: "In Progress", retryCount: 1, blocked: false }),
}));

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer, type McpContext } from "../mcp-server.js";

let testDb: TestDatabase;
let client: Client;

const TEST_CONTEXT: McpContext = {
  personaName: "Test Agent",
  personaId: TEST_IDS.PERSONA_ENGINEER,
  projectId: TEST_IDS.PROJECT_ID,
  allowedTools: [],
};

async function callTool(name: string, args: Record<string, unknown>) {
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content as Array<{ type: string; text: string }>)[0]!.text;
  return { parsed: JSON.parse(text), isError: result.isError ?? false };
}

describe("MCP tool implementations", () => {
  beforeEach(async () => {
    testDb = createTestDb();
    mockDb.db = testDb.db;
    await seedTestDb(testDb.db);

    const server = createMcpServer(TEST_CONTEXT);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    testDb.cleanup();
  });

  // ── post_comment ─────────────────────────────────────────────────

  describe("post_comment", () => {
    it("inserts a comment and returns success", async () => {
      const { parsed, isError } = await callTool("post_comment", {
        workItemId: TEST_IDS.WI_TOP_1,
        content: "Agent progress update",
      });

      expect(isError).toBe(false);
      expect(parsed.id).toMatch(/^cm-/);
      expect(parsed.workItemId).toBe(TEST_IDS.WI_TOP_1);
      expect(parsed.authorName).toBe("Test Agent");

      // Verify in DB
      const rows = await testDb.db
        .select()
        .from(schema.comments)
        .where(eq(schema.comments.id, parsed.id));
      expect(rows).toHaveLength(1);
      expect(rows[0]!.content).toBe("Agent progress update");
      expect(rows[0]!.authorType).toBe("agent");
    });
  });

  // ── create_children ──────────────────────────────────────────────

  describe("create_children", () => {
    it("creates child work items with correct parentId", async () => {
      const { parsed, isError } = await callTool("create_children", {
        parentId: TEST_IDS.WI_TOP_3,
        children: [
          { title: "Child A", description: "First child" },
          { title: "Child B" },
        ],
      });

      expect(isError).toBe(false);
      expect(parsed.createdIds).toHaveLength(2);
      expect(parsed.parentId).toBe(TEST_IDS.WI_TOP_3);

      // Verify in DB
      for (const id of parsed.createdIds) {
        const [item] = await testDb.db
          .select()
          .from(schema.workItems)
          .where(eq(schema.workItems.id, id));
        expect(item!.parentId).toBe(TEST_IDS.WI_TOP_3);
        expect(item!.projectId).toBe(TEST_IDS.PROJECT_ID);
        expect(item!.currentState).toBe("Backlog");
      }
    });

    it("creates edges for dependsOn references", async () => {
      const { parsed } = await callTool("create_children", {
        parentId: TEST_IDS.WI_TOP_3,
        children: [
          { title: "Step 1" },
          { title: "Step 2", dependsOn: ["0"] }, // depends on Step 1 (index 0)
        ],
      });

      // Verify edge exists
      const edges = await testDb.db
        .select()
        .from(schema.workItemEdges)
        .where(eq(schema.workItemEdges.toId, parsed.createdIds[1]));
      expect(edges).toHaveLength(1);
      expect(edges[0]!.fromId).toBe(parsed.createdIds[0]);
      expect(edges[0]!.type).toBe("depends_on");
    });
  });

  // ── route_to_state ───────────────────────────────────────────────

  describe("route_to_state", () => {
    it("validates transition and updates state", async () => {
      // WI_TOP_3 is in "Backlog" → valid transition to "Planning"
      const { parsed, isError } = await callTool("route_to_state", {
        workItemId: TEST_IDS.WI_TOP_3,
        targetState: "Planning",
        reasoning: "Ready for planning phase",
      });

      expect(isError).toBe(false);
      expect(parsed.fromState).toBe("Backlog");
      expect(parsed.toState).toBe("Planning");

      // Verify DB state changed
      const [item] = await testDb.db
        .select({ currentState: schema.workItems.currentState })
        .from(schema.workItems)
        .where(eq(schema.workItems.id, TEST_IDS.WI_TOP_3));
      expect(item!.currentState).toBe("Planning");
    });

    it("rejects invalid transition", async () => {
      // WI_TOP_3 is in "Backlog" → invalid transition to "Done"
      const { parsed, isError } = await callTool("route_to_state", {
        workItemId: TEST_IDS.WI_TOP_3,
        targetState: "Done",
        reasoning: "Skip to done",
      });

      expect(isError).toBe(true);
      expect(parsed.error).toContain("Invalid transition");

      // Verify DB state unchanged
      const [item] = await testDb.db
        .select({ currentState: schema.workItems.currentState })
        .from(schema.workItems)
        .where(eq(schema.workItems.id, TEST_IDS.WI_TOP_3));
      expect(item!.currentState).toBe("Backlog");
    });
  });

  // ── flag_blocked ─────────────────────────────────────────────────

  describe("flag_blocked", () => {
    it("sets state to Blocked", async () => {
      const { parsed, isError } = await callTool("flag_blocked", {
        workItemId: TEST_IDS.WI_CHILD_1C, // "Ready" state
        reason: "Missing API credentials",
      });

      expect(isError).toBe(false);
      expect(parsed.toState).toBe("Blocked");

      // Verify DB
      const [item] = await testDb.db
        .select({ currentState: schema.workItems.currentState })
        .from(schema.workItems)
        .where(eq(schema.workItems.id, TEST_IDS.WI_CHILD_1C));
      expect(item!.currentState).toBe("Blocked");

      // Verify system comment posted
      const cmts = await testDb.db
        .select()
        .from(schema.comments)
        .where(eq(schema.comments.workItemId, TEST_IDS.WI_CHILD_1C));
      const blockedComment = cmts.find((c) => c.content.includes("Blocked"));
      expect(blockedComment).toBeDefined();
      expect(blockedComment!.content).toContain("Missing API credentials");
    });
  });

  // ── list_items ───────────────────────────────────────────────────

  describe("list_items", () => {
    it("returns filtered results", async () => {
      const { parsed, isError } = await callTool("list_items", {
        state: "Backlog",
      });

      expect(isError).toBe(false);
      expect(parsed.total).toBeGreaterThan(0);
      for (const item of parsed.items) {
        expect(item.state).toBe("Backlog");
        expect(item.id).toBeDefined();
        expect(item.title).toBeDefined();
      }
    });

    it("returns summary format by default", async () => {
      const { parsed } = await callTool("list_items", {});

      expect(parsed.items.length).toBeGreaterThan(0);
      const item = parsed.items[0];
      // Summary: id, title, state — no description
      expect(item.id).toBeDefined();
      expect(item.title).toBeDefined();
      expect(item.state).toBeDefined();
      expect(item.description).toBeUndefined();
    });
  });

  // ── get_context ──────────────────────────────────────────────────

  describe("get_context", () => {
    it("returns work item with execution history", async () => {
      const { parsed, isError } = await callTool("get_context", {
        workItemId: TEST_IDS.WI_CHILD_1A, // has executions in seed
      });

      expect(isError).toBe(false);
      expect(parsed.workItem).toBeDefined();
      expect(parsed.workItem.id).toBe(TEST_IDS.WI_CHILD_1A);
      expect(parsed.executionContext).toBeDefined();
    });

    it("returns error for non-existent work item", async () => {
      const { isError } = await callTool("get_context", {
        workItemId: "wi-nonexistent",
      });

      expect(isError).toBe(true);
    });
  });
});
