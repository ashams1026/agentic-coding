import { eq } from "drizzle-orm";
import { db } from "./connection.js";
import { projects } from "./schema.js";

const GLOBAL_PROJECT_ID = "pj-global";

/**
 * Ensure the global project exists. Idempotent — safe to call on every startup.
 * Must run before any seed that references pj-global (workflows, agents, etc.).
 */
export async function ensureGlobalProject(): Promise<void> {
  const existing = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, GLOBAL_PROJECT_ID));

  if (existing.length > 0) return;

  await db.insert(projects).values({
    id: GLOBAL_PROJECT_ID,
    name: "All Projects",
    path: "",
    isGlobal: true,
    settings: {},
    createdAt: new Date(),
  });
}
