import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, seedTestDb, TEST_IDS, type TestDatabase } from "./setup.js";
import * as schema from "../db/schema.js";

describe("createTestDb", () => {
  let testDb: TestDatabase;

  afterEach(() => {
    testDb?.cleanup();
  });

  it("creates an in-memory database with schema", () => {
    testDb = createTestDb();
    expect(testDb.db).toBeDefined();
    expect(testDb.cleanup).toBeInstanceOf(Function);
  });

  it("each call returns an isolated database", async () => {
    testDb = createTestDb();
    const testDb2 = createTestDb();

    await testDb.db.insert(schema.projects).values({
      id: "pj-iso0001",
      name: "Isolated",
      path: "/tmp/iso",
      settings: {},
      createdAt: new Date(),
    });

    const inDb1 = await testDb.db.select().from(schema.projects);
    const inDb2 = await testDb2.db.select().from(schema.projects);

    expect(inDb1).toHaveLength(1);
    expect(inDb2).toHaveLength(0);

    testDb2.cleanup();
  });
});

describe("seedTestDb", () => {
  let testDb: TestDatabase;

  afterEach(() => {
    testDb?.cleanup();
  });

  it("seeds all expected data", async () => {
    testDb = createTestDb();
    await seedTestDb(testDb.db);

    const projects = await testDb.db.select().from(schema.projects);
    expect(projects).toHaveLength(1);
    expect(projects[0]!.id).toBe(TEST_IDS.PROJECT_ID);

    const agents = await testDb.db.select().from(schema.agents);
    expect(agents).toHaveLength(5);

    const assignments = await testDb.db.select().from(schema.agentAssignments);
    expect(assignments).toHaveLength(4);

    const workItems = await testDb.db.select().from(schema.workItems);
    expect(workItems).toHaveLength(9); // 3 top-level + 3 + 2 + 1 children

    const topLevel = workItems.filter((wi) => wi.parentId === null);
    expect(topLevel).toHaveLength(3);

    const children = workItems.filter((wi) => wi.parentId !== null);
    expect(children).toHaveLength(6);

    const edges = await testDb.db.select().from(schema.workItemEdges);
    expect(edges).toHaveLength(2);

    const executions = await testDb.db.select().from(schema.executions);
    expect(executions).toHaveLength(4);

    const comments = await testDb.db.select().from(schema.comments);
    expect(comments).toHaveLength(5);

    const proposals = await testDb.db.select().from(schema.proposals);
    expect(proposals).toHaveLength(1);

    const memories = await testDb.db.select().from(schema.projectMemories);
    expect(memories).toHaveLength(1);
  });

  it("seeds work items with correct parent-child relationships", async () => {
    testDb = createTestDb();
    await seedTestDb(testDb.db);

    const childrenOfTop1 = await testDb.db
      .select()
      .from(schema.workItems)
      .where(eq(schema.workItems.parentId, TEST_IDS.WI_TOP_1));
    expect(childrenOfTop1).toHaveLength(3);

    const childrenOfTop2 = await testDb.db
      .select()
      .from(schema.workItems)
      .where(eq(schema.workItems.parentId, TEST_IDS.WI_TOP_2));
    expect(childrenOfTop2).toHaveLength(2);

    const childrenOfTop3 = await testDb.db
      .select()
      .from(schema.workItems)
      .where(eq(schema.workItems.parentId, TEST_IDS.WI_TOP_3));
    expect(childrenOfTop3).toHaveLength(1);
  });
});
