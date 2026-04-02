/**
 * Router agent — decides the next workflow state after a agent
 * completes execution on a work item.
 *
 * Uses a haiku-model agent with read-only tools + route_to_state.
 * Skips if auto-routing is disabled in project settings.
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workItems, workflows, comments } from "../db/schema.js";
import { executionManager } from "./setup.js";
import { createId } from "@agentops/shared";
import { agents } from "../db/schema.js";
import { buildDynamicRouterPrompt } from "./workflow-runtime.js";

/** MCP tools the router can use */
const ROUTER_MCP_TOOLS = [
  "route_to_state",
  "list_items",
  "get_context",
  "post_comment",
];

const ROUTER_BASE_PROMPT = `You are a routing agent for the AgentOps workflow system.

Your job is to decide the next workflow state for a work item after a agent has completed work on it.

Use the get_context tool to understand the work item's current state and execution history.
Use the list_items tool to check the status of child work items if relevant.
Then use route_to_state to transition the work item to the appropriate next state.

Guidelines:
- Consider the execution outcome and summary when making your decision
- If a work item is stuck or has unresolvable issues, route to a blocked/terminal state
- Do not route to a state this item was just in unless there's a clear reason`;

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
 * Build a Router system prompt with dynamic workflow context and transition history.
 */
async function buildRouterSystemPrompt(
  workflowId: string | null,
  currentState: string,
  transitions: TransitionRecord[],
): Promise<string> {
  const parts = [ROUTER_BASE_PROMPT];

  // Add dynamic workflow context (valid target states from current state)
  const workflowContext = await buildDynamicRouterPrompt(workflowId, currentState);
  parts.push(`## Workflow Context\n\n${workflowContext}`);

  if (transitions.length > 0) {
    const lines = transitions.map((t) => `- ${t.from} → ${t.to}`);
    parts.push(
      `## Recent State Transitions for This Work Item\n\n${lines.join("\n")}`,
    );
  }

  parts.push(
    "IMPORTANT: Do NOT route to a state this item was just in. " +
      "If the agent's work appears incomplete, route to Blocked with a reason " +
      "rather than re-triggering the same agent.",
  );

  return parts.join("\n\n");
}

/**
 * Run the router agent to decide the next state for a work item.
 * Called after a agent execution completes successfully.
 *
 * Returns true if routing was performed, false if skipped.
 */
export async function runRouter(workItemId: string): Promise<boolean> {
  // Look up work item to get projectId, workflowId, and currentState
  const [item] = await db
    .select({ projectId: workItems.projectId, workflowId: workItems.workflowId, currentState: workItems.currentState })
    .from(workItems)
    .where(eq(workItems.id, workItemId));

  if (!item) return false;

  // Work items without a linked workflow default to no routing
  if (!item.workflowId) return false;

  // Check if auto-routing is enabled on the workflow
  if (item.workflowId) {
    const [workflow] = await db
      .select({ autoRouting: workflows.autoRouting })
      .from(workflows)
      .where(eq(workflows.id, item.workflowId));

    if (workflow && !workflow.autoRouting) return false; // Explicitly disabled on workflow
  }

  // Find or create a router agent for this project
  const routerAgentId = await getOrCreateRouterAgent();

  // Query recent transitions and build dynamic system prompt with workflow context
  const transitions = await getRecentTransitions(workItemId);
  const dynamicPrompt = await buildRouterSystemPrompt(item.workflowId ?? null, item.currentState, transitions);

  // Update the Router agent's systemPrompt with transition context
  await db
    .update(agents)
    .set({ systemPrompt: dynamicPrompt })
    .where(eq(agents.id, routerAgentId));

  // Spawn the router execution
  await executionManager.runExecution(workItemId, routerAgentId);

  return true;
}

/**
 * Get or create the built-in Router agent.
 * The router uses haiku model for cost efficiency.
 */
async function getOrCreateRouterAgent(): Promise<string> {
  // Check if router agent already exists
  const [existing] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.name, "Router"));

  if (existing) return existing.id;

  // Create the router agent
  const id = createId.agent();
  await db.insert(agents).values({
    id,
    name: "Router",
    description: "Built-in routing agent that decides workflow state transitions",
    avatar: { color: "#6366f1", icon: "route" },
    systemPrompt: ROUTER_BASE_PROMPT,
    model: "haiku",
    allowedTools: [],
    mcpTools: ROUTER_MCP_TOOLS,
    maxBudgetPerRun: 0,
    settings: { isSystem: true, isRouter: true, effort: "low", thinking: "disabled" },
  });

  return id;
}
