/**
 * Router agent — decides the next workflow state after a persona
 * completes execution on a work item.
 *
 * Uses a haiku-model agent with read-only tools + route_to_state.
 * Skips if auto-routing is disabled in project settings.
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workItems, projects, comments } from "../db/schema.js";
import { runExecution } from "./execution-manager.js";
import { createId } from "@agentops/shared";
import { personas } from "../db/schema.js";

/** MCP tools the router can use */
const ROUTER_MCP_TOOLS = [
  "route_to_state",
  "list_items",
  "get_context",
  "post_comment",
];

const ROUTER_BASE_PROMPT = `You are a routing agent for the AgentOps workflow system.

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

// ── Transition history helpers ──────────────────────────────────

interface TransitionRecord {
  from: string;
  to: string;
}

/**
 * Query the last N state transitions for a work item from Router comments.
 * Router posts a comment with { fromState, toState } metadata on each transition.
 */
async function getRecentTransitions(
  workItemId: string,
  limit = 3,
): Promise<TransitionRecord[]> {
  const rows = await db
    .select({ metadata: comments.metadata, createdAt: comments.createdAt })
    .from(comments)
    .where(
      and(
        eq(comments.workItemId, workItemId),
        eq(comments.authorName, "Router"),
      ),
    )
    .orderBy(desc(comments.createdAt))
    .limit(limit);

  return rows
    .filter(
      (r) =>
        r.metadata &&
        typeof r.metadata === "object" &&
        "fromState" in r.metadata &&
        "toState" in r.metadata,
    )
    .map((r) => ({
      from: (r.metadata as Record<string, unknown>).fromState as string,
      to: (r.metadata as Record<string, unknown>).toState as string,
    }));
}

/**
 * Build a Router system prompt with transition history context.
 */
function buildRouterSystemPrompt(transitions: TransitionRecord[]): string {
  const parts = [ROUTER_BASE_PROMPT];

  if (transitions.length > 0) {
    const lines = transitions.map((t) => `- ${t.from} → ${t.to}`);
    parts.push(
      `## Recent State Transitions for This Work Item\n\n${lines.join("\n")}`,
    );
  }

  parts.push(
    "IMPORTANT: Do NOT route to a state this item was just in. " +
      "If the persona's work appears incomplete, route to Blocked with a reason " +
      "rather than re-triggering the same persona.",
  );

  return parts.join("\n\n");
}

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

  // Query recent transitions and build dynamic system prompt
  const transitions = await getRecentTransitions(workItemId);
  const dynamicPrompt = buildRouterSystemPrompt(transitions);

  // Update the Router persona's systemPrompt with transition context
  await db
    .update(personas)
    .set({ systemPrompt: dynamicPrompt })
    .where(eq(personas.id, routerPersonaId));

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
    .where(eq(personas.name, "Router"));

  if (existing) return existing.id;

  // Create the router persona
  const id = createId.persona();
  await db.insert(personas).values({
    id,
    name: "Router",
    description: "Built-in routing agent that decides workflow state transitions",
    avatar: { color: "#6366f1", icon: "route" },
    systemPrompt: buildRouterSystemPrompt([]),
    model: "haiku",
    allowedTools: [],
    mcpTools: ROUTER_MCP_TOOLS,
    maxBudgetPerRun: 0,
    settings: { isSystem: true, isRouter: true },
  });

  return id;
}
