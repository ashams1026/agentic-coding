import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import type BetterSqlite3 from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as schema from "../db/schema.js";

// Resolve migrations folder relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_FOLDER = resolve(__dirname, "../../drizzle");

type TestDb = typeof schema extends infer S ? ReturnType<typeof drizzle<S & typeof schema>> : never;

export interface TestDatabase {
  db: TestDb;
  cleanup: () => void;
}

/**
 * Creates a fresh in-memory SQLite database with all migrations applied.
 * Each call returns an isolated database — no shared state between tests.
 */
export function createTestDb(): TestDatabase {
  const sqlite: BetterSqlite3.Database = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle({ client: sqlite, schema });

  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

  return {
    db: db as TestDb,
    cleanup: () => sqlite.close(),
  };
}

// ── Fixed test IDs ──────────────────────────────────────────────────

const PROJECT_ID = "pj-test001";

const PERSONA_PM = "ps-testpm1";
const PERSONA_TECH_LEAD = "ps-testtl1";
const PERSONA_ENGINEER = "ps-testen1";
const PERSONA_REVIEWER = "ps-testrv1";
const PERSONA_QA = "ps-testqa1";

const WI_TOP_1 = "wi-top0001";
const WI_TOP_2 = "wi-top0002";
const WI_TOP_3 = "wi-top0003";

const WI_CHILD_1A = "wi-ch001a";
const WI_CHILD_1B = "wi-ch001b";
const WI_CHILD_1C = "wi-ch001c";

const WI_CHILD_2A = "wi-ch002a";
const WI_CHILD_2B = "wi-ch002b";

const WI_CHILD_3A = "wi-ch003a";

const EXEC_1 = "ex-test001";
const EXEC_2 = "ex-test002";
const EXEC_3 = "ex-test003";
const EXEC_4 = "ex-test004";

function d(iso: string): Date {
  return new Date(iso);
}

/** Exported IDs for use in test assertions */
export const TEST_IDS = {
  PROJECT_ID,
  PERSONA_PM,
  PERSONA_TECH_LEAD,
  PERSONA_ENGINEER,
  PERSONA_REVIEWER,
  PERSONA_QA,
  WI_TOP_1,
  WI_TOP_2,
  WI_TOP_3,
  WI_CHILD_1A,
  WI_CHILD_1B,
  WI_CHILD_1C,
  WI_CHILD_2A,
  WI_CHILD_2B,
  WI_CHILD_3A,
  EXEC_1,
  EXEC_2,
  EXEC_3,
  EXEC_4,
} as const;

/**
 * Seeds the database with a minimal but realistic dataset:
 * - 1 project
 * - 5 personas (PM, Tech Lead, Engineer, Reviewer, QA)
 * - 4 persona assignments
 * - 3 top-level work items with 6 children (9 total)
 * - 4 executions
 * - 5 comments
 * - 1 proposal
 * - 1 project memory
 * - 2 work item edges
 */
export async function seedTestDb(db: TestDb) {
  // ── Project ─────────────────────────────────────────────────────
  await db.insert(schema.projects).values({
    id: PROJECT_ID,
    name: "Test Project",
    path: "/tmp/test-project",
    settings: { maxConcurrent: 3, monthCap: 50 },
    createdAt: d("2026-03-20T10:00:00Z"),
  });

  // ── Personas ────────────────────────────────────────────────────
  await db.insert(schema.personas).values([
    {
      id: PERSONA_PM,
      name: "PM",
      description: "Product manager persona",
      avatar: { color: "#8b5cf6", icon: "clipboard-list" },
      systemPrompt: "You are a PM.",
      model: "sonnet",
      allowedTools: ["Read", "Glob"],
      mcpTools: ["post_comment"],
      maxBudgetPerRun: 50,
      settings: {},
    },
    {
      id: PERSONA_TECH_LEAD,
      name: "Tech Lead",
      description: "Technical lead persona",
      avatar: { color: "#3b82f6", icon: "git-branch" },
      systemPrompt: "You are a tech lead.",
      model: "opus",
      allowedTools: ["Read", "Glob", "Bash"],
      mcpTools: ["create_tasks", "post_comment"],
      maxBudgetPerRun: 100,
      settings: {},
    },
    {
      id: PERSONA_ENGINEER,
      name: "Engineer",
      description: "Software engineer persona",
      avatar: { color: "#10b981", icon: "code" },
      systemPrompt: "You are an engineer.",
      model: "sonnet",
      allowedTools: ["Read", "Edit", "Write", "Bash"],
      mcpTools: ["post_comment", "flag_blocked"],
      maxBudgetPerRun: 200,
      settings: {},
    },
    {
      id: PERSONA_REVIEWER,
      name: "Reviewer",
      description: "Code reviewer persona",
      avatar: { color: "#f59e0b", icon: "eye" },
      systemPrompt: "You are a reviewer.",
      model: "sonnet",
      allowedTools: ["Read", "Glob"],
      mcpTools: ["post_comment"],
      maxBudgetPerRun: 50,
      settings: {},
    },
    {
      id: PERSONA_QA,
      name: "QA",
      description: "QA tester persona",
      avatar: { color: "#ef4444", icon: "test-tube" },
      systemPrompt: "You are a QA tester.",
      model: "haiku",
      allowedTools: ["Read", "Bash"],
      mcpTools: ["post_comment"],
      maxBudgetPerRun: 30,
      settings: {},
    },
  ]);

  // ── Persona Assignments ─────────────────────────────────────────
  await db.insert(schema.personaAssignments).values([
    { projectId: PROJECT_ID, stateName: "Planning", personaId: PERSONA_PM },
    { projectId: PROJECT_ID, stateName: "Decomposition", personaId: PERSONA_TECH_LEAD },
    { projectId: PROJECT_ID, stateName: "In Progress", personaId: PERSONA_ENGINEER },
    { projectId: PROJECT_ID, stateName: "In Review", personaId: PERSONA_REVIEWER },
  ]);

  // ── Top-level Work Items ────────────────────────────────────────
  await db.insert(schema.workItems).values([
    {
      id: WI_TOP_1,
      parentId: null,
      projectId: PROJECT_ID,
      title: "Authentication system",
      description: "Implement user authentication with OAuth2.",
      context: { acceptanceCriteria: "OAuth works" },
      currentState: "In Progress",
      priority: "p0",
      labels: ["auth"],
      assignedPersonaId: null,
      executionContext: [],
      createdAt: d("2026-03-21T09:00:00Z"),
      updatedAt: d("2026-03-27T14:00:00Z"),
    },
    {
      id: WI_TOP_2,
      parentId: null,
      projectId: PROJECT_ID,
      title: "Dashboard widgets",
      description: "Build dashboard analytics widgets.",
      context: {},
      currentState: "Decomposition",
      priority: "p1",
      labels: ["dashboard"],
      assignedPersonaId: null,
      executionContext: [],
      createdAt: d("2026-03-22T11:00:00Z"),
      updatedAt: d("2026-03-26T16:00:00Z"),
    },
    {
      id: WI_TOP_3,
      parentId: null,
      projectId: PROJECT_ID,
      title: "Notification system",
      description: "Real-time notifications via WebSocket.",
      context: {},
      currentState: "Backlog",
      priority: "p2",
      labels: ["notifications"],
      assignedPersonaId: null,
      executionContext: [],
      createdAt: d("2026-03-23T08:00:00Z"),
      updatedAt: d("2026-03-23T08:00:00Z"),
    },
  ]);

  // ── Children of WI_TOP_1 ────────────────────────────────────────
  await db.insert(schema.workItems).values([
    {
      id: WI_CHILD_1A,
      parentId: WI_TOP_1,
      projectId: PROJECT_ID,
      title: "OAuth backend routes",
      description: "Create OAuth routes with passport.",
      context: {},
      currentState: "Done",
      priority: "p0",
      labels: ["auth"],
      assignedPersonaId: PERSONA_ENGINEER,
      executionContext: [],
      createdAt: d("2026-03-24T10:00:00Z"),
      updatedAt: d("2026-03-25T11:00:00Z"),
    },
    {
      id: WI_CHILD_1B,
      parentId: WI_TOP_1,
      projectId: PROJECT_ID,
      title: "Login UI component",
      description: "Login page with social buttons.",
      context: {},
      currentState: "In Progress",
      priority: "p0",
      labels: ["auth", "ui"],
      assignedPersonaId: PERSONA_ENGINEER,
      executionContext: [],
      createdAt: d("2026-03-24T10:05:00Z"),
      updatedAt: d("2026-03-27T14:00:00Z"),
    },
    {
      id: WI_CHILD_1C,
      parentId: WI_TOP_1,
      projectId: PROJECT_ID,
      title: "Session persistence",
      description: "Session storage and route guards.",
      context: {},
      currentState: "Ready",
      priority: "p0",
      labels: ["auth"],
      assignedPersonaId: PERSONA_ENGINEER,
      executionContext: [],
      createdAt: d("2026-03-24T10:10:00Z"),
      updatedAt: d("2026-03-24T10:10:00Z"),
    },
  ]);

  // ── Children of WI_TOP_2 ────────────────────────────────────────
  await db.insert(schema.workItems).values([
    {
      id: WI_CHILD_2A,
      parentId: WI_TOP_2,
      projectId: PROJECT_ID,
      title: "Cost tracking chart",
      description: "Recharts sparkline for cost data.",
      context: {},
      currentState: "Backlog",
      priority: "p1",
      labels: ["dashboard"],
      assignedPersonaId: null,
      executionContext: [],
      createdAt: d("2026-03-25T09:00:00Z"),
      updatedAt: d("2026-03-25T09:00:00Z"),
    },
    {
      id: WI_CHILD_2B,
      parentId: WI_TOP_2,
      projectId: PROJECT_ID,
      title: "Active agents strip",
      description: "Horizontal agent cards with status.",
      context: {},
      currentState: "Backlog",
      priority: "p1",
      labels: ["dashboard"],
      assignedPersonaId: null,
      executionContext: [],
      createdAt: d("2026-03-25T09:05:00Z"),
      updatedAt: d("2026-03-25T09:05:00Z"),
    },
  ]);

  // ── Children of WI_TOP_3 ────────────────────────────────────────
  await db.insert(schema.workItems).values([
    {
      id: WI_CHILD_3A,
      parentId: WI_TOP_3,
      projectId: PROJECT_ID,
      title: "Toast notification component",
      description: "Non-blocking toast notifications.",
      context: {},
      currentState: "Backlog",
      priority: "p2",
      labels: ["notifications"],
      assignedPersonaId: null,
      executionContext: [],
      createdAt: d("2026-03-26T08:00:00Z"),
      updatedAt: d("2026-03-26T08:00:00Z"),
    },
  ]);

  // ── Work Item Edges ─────────────────────────────────────────────
  await db.insert(schema.workItemEdges).values([
    { id: "we-test001", fromId: WI_CHILD_1A, toId: WI_CHILD_1B, type: "blocks" },
    { id: "we-test002", fromId: WI_CHILD_1B, toId: WI_CHILD_1C, type: "depends_on" },
  ]);

  // ── Executions ──────────────────────────────────────────────────
  await db.insert(schema.executions).values([
    {
      id: EXEC_1,
      workItemId: WI_CHILD_1A,
      personaId: PERSONA_ENGINEER,
      status: "completed",
      startedAt: d("2026-03-25T10:00:00Z"),
      completedAt: d("2026-03-25T10:04:00Z"),
      costUsd: 42,
      durationMs: 240000,
      summary: "Implemented OAuth routes.",
      outcome: "success",
      rejectionPayload: null,
      logs: "Creating auth routes...\nDone.",
    },
    {
      id: EXEC_2,
      workItemId: WI_TOP_1,
      personaId: PERSONA_PM,
      status: "completed",
      startedAt: d("2026-03-24T09:00:00Z"),
      completedAt: d("2026-03-24T09:03:00Z"),
      costUsd: 18,
      durationMs: 180000,
      summary: "Wrote acceptance criteria.",
      outcome: "success",
      rejectionPayload: null,
      logs: "Writing criteria...\nDone.",
    },
    {
      id: EXEC_3,
      workItemId: WI_CHILD_1B,
      personaId: PERSONA_ENGINEER,
      status: "running",
      startedAt: d("2026-03-27T14:00:00Z"),
      completedAt: null,
      costUsd: 31,
      durationMs: 0,
      summary: "",
      outcome: null,
      rejectionPayload: null,
      logs: "Building login page...",
    },
    {
      id: EXEC_4,
      workItemId: WI_TOP_2,
      personaId: PERSONA_TECH_LEAD,
      status: "completed",
      startedAt: d("2026-03-26T10:00:00Z"),
      completedAt: d("2026-03-26T10:06:00Z"),
      costUsd: 85,
      durationMs: 360000,
      summary: "Decomposed dashboard into children.",
      outcome: "success",
      rejectionPayload: null,
      logs: "Creating children...\nDone.",
    },
  ]);

  // ── Comments ────────────────────────────────────────────────────
  await db.insert(schema.comments).values([
    {
      id: "cm-test001",
      workItemId: WI_TOP_1,
      authorType: "user",
      authorId: null,
      authorName: "Amin",
      content: "Highest priority — need auth before user-facing features.",
      metadata: {},
      createdAt: d("2026-03-21T09:05:00Z"),
    },
    {
      id: "cm-test002",
      workItemId: WI_TOP_1,
      authorType: "agent",
      authorId: PERSONA_PM,
      authorName: "PM",
      content: "Acceptance criteria written for OAuth2.",
      metadata: {},
      createdAt: d("2026-03-24T09:03:00Z"),
    },
    {
      id: "cm-test003",
      workItemId: WI_CHILD_1A,
      authorType: "agent",
      authorId: PERSONA_ENGINEER,
      authorName: "Engineer",
      content: "OAuth routes implemented with passport.js.",
      metadata: { filesChanged: ["auth.ts"] },
      createdAt: d("2026-03-25T10:04:00Z"),
    },
    {
      id: "cm-test004",
      workItemId: WI_CHILD_1A,
      authorType: "system",
      authorId: null,
      authorName: "System",
      content: "Work item moved to Done",
      metadata: {},
      createdAt: d("2026-03-25T11:00:00Z"),
    },
    {
      id: "cm-test005",
      workItemId: WI_TOP_2,
      authorType: "user",
      authorId: null,
      authorName: "Amin",
      content: "Use recharts for charts.",
      metadata: {},
      createdAt: d("2026-03-25T09:30:00Z"),
    },
  ]);

  // ── Proposals ───────────────────────────────────────────────────
  await db.insert(schema.proposals).values([
    {
      id: "pp-test001",
      executionId: EXEC_4,
      workItemId: WI_TOP_2,
      type: "task_creation",
      payload: {
        children: [
          { title: "Cost tracking chart", description: "Recharts sparkline" },
          { title: "Active agents strip", description: "Agent cards" },
        ],
      },
      status: "approved",
      createdAt: d("2026-03-26T10:06:00Z"),
    },
  ]);

  // ── Project Memories ────────────────────────────────────────────
  await db.insert(schema.projectMemories).values([
    {
      id: "pm-test001",
      projectId: PROJECT_ID,
      workItemId: WI_TOP_1,
      summary: "OAuth2 authentication implemented with passport.js.",
      filesChanged: ["auth.ts", "session.ts"],
      keyDecisions: ["Used passport.js over custom OAuth"],
      createdAt: d("2026-03-25T11:30:00Z"),
      consolidatedInto: null,
    },
  ]);
}
