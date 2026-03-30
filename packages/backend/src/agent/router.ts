/**
 * Router agent — decides the next workflow state after a persona
 * completes execution on a work item.
 *
 * Uses a haiku-model agent with read-only tools + route_to_state.
 * Skips if auto-routing is disabled in project settings.
 */

import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workItems, projects } from "../db/schema.js";
import { runExecution } from "./execution-manager.js";
import { createId } from "@agentops/shared";
import { personas } from "../db/schema.js";

/** Read-only tools the router can use, plus route_to_state */
const ROUTER_TOOLS = [
  "list_items",
  "get_context",
  "route_to_state",
];

const ROUTER_SYSTEM_PROMPT = `You are a routing agent for the AgentOps workflow system.

Your job is to decide the next workflow state for a work item after a persona has completed work on it.

Available states: Backlog, Planning, Decomposition, Ready, In Progress, In Review, Done, Blocked.

Use the get_context tool to understand the work item's current state and execution history.
Use the list_items tool to check the status of child work items if relevant.
Then use route_to_state to transition the work item to the appropriate next state.

Guidelines:
- After "In Progress" work completes, typically route to "In Review"
- After successful review, route to "Done"
- If review finds issues, route back to "In Progress" (rejection)
- If a work item is stuck or has unresolvable issues, route to "Blocked"
- Consider the execution outcome and summary when making your decision`;

/**
 * Run the router agent to decide the next state for a work item.
 * Called after a persona execution completes successfully.
 *
 * Returns true if routing was performed, false if skipped.
 */
export async function runRouter(workItemId: string): Promise<boolean> {
  // Look up work item to get projectId
  const [item] = await db
    .select({ projectId: workItems.projectId })
    .from(workItems)
    .where(eq(workItems.id, workItemId));

  if (!item) return false;

  // Check if auto-routing is enabled in project settings
  const [project] = await db
    .select({ settings: projects.settings })
    .from(projects)
    .where(eq(projects.id, item.projectId));

  if (!project) return false;

  const autoRouting = project.settings.autoRouting;
  if (autoRouting === false) return false; // Explicitly disabled

  // Find or create a router persona for this project
  const routerPersonaId = await getOrCreateRouterPersona();

  // Spawn the router execution
  await runExecution(workItemId, routerPersonaId);

  return true;
}

/**
 * Get or create the built-in Router persona.
 * The router uses haiku model for cost efficiency.
 */
async function getOrCreateRouterPersona(): Promise<string> {
  // Check if router persona already exists
  const [existing] = await db
    .select({ id: personas.id })
    .from(personas)
    .where(eq(personas.name, "__router__"));

  if (existing) return existing.id;

  // Create the router persona
  const id = createId.persona();
  await db.insert(personas).values({
    id,
    name: "__router__",
    description: "Built-in routing agent that decides workflow state transitions",
    avatar: { color: "#6366f1", icon: "route" },
    systemPrompt: ROUTER_SYSTEM_PROMPT,
    model: "haiku",
    allowedTools: ROUTER_TOOLS,
    mcpTools: [],
    maxBudgetPerRun: 0,
    settings: { isSystem: true },
  });

  return id;
}
