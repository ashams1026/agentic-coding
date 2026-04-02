import { db } from "./connection.js";
import { agents, agentAssignments } from "./schema.js";
import { createId } from "@agentops/shared";

// ── Built-in agent definitions ──────────────────────────────────

interface DefaultAgent {
  name: string;
  description: string;
  avatar: { color: string; icon: string };
  model: string;
  allowedTools: string[];
  mcpTools: string[];
  maxBudgetPerRun: number;
}

const BUILT_IN_AGENTS: DefaultAgent[] = [
  {
    name: "Product Manager",
    description: "Writes acceptance criteria, defines scope, and prioritizes work items.",
    avatar: { color: "#7c3aed", icon: "clipboard-list" },
    model: "sonnet",
    allowedTools: ["Read", "Glob", "Grep", "WebSearch"],
    mcpTools: ["post_comment", "list_items", "get_context", "request_review"],
    maxBudgetPerRun: 50,
  },
  {
    name: "Tech Lead",
    description: "Decomposes work items into children with dependency graphs.",
    avatar: { color: "#2563eb", icon: "git-branch" },
    model: "opus",
    allowedTools: ["Read", "Glob", "Grep", "WebSearch", "Bash"],
    mcpTools: ["create_children", "post_comment", "get_context", "list_items"],
    maxBudgetPerRun: 100,
  },
  {
    name: "Engineer",
    description: "Implements work items by writing and modifying code.",
    avatar: { color: "#059669", icon: "code" },
    model: "sonnet",
    allowedTools: ["Read", "Edit", "Write", "Glob", "Grep", "Bash", "WebFetch"],
    mcpTools: ["post_comment", "flag_blocked", "get_context"],
    maxBudgetPerRun: 200,
  },
  {
    name: "Code Reviewer",
    description: "Reviews code changes for correctness, style, and completeness.",
    avatar: { color: "#d97706", icon: "eye" },
    model: "sonnet",
    allowedTools: ["Read", "Glob", "Grep", "Bash"],
    mcpTools: ["post_comment", "get_context", "list_items", "request_review", "rewind_execution"],
    maxBudgetPerRun: 50,
  },
  {
    name: "Router",
    description: "Routes work items between workflow states based on execution outcomes.",
    avatar: { color: "#6366f1", icon: "route" },
    model: "haiku",
    allowedTools: [],
    mcpTools: ["route_to_state", "list_items", "get_context", "post_comment"],
    maxBudgetPerRun: 10,
  },
  {
    name: "Pico",
    description: "Your friendly project assistant. Woof!",
    avatar: { color: "#f59e0b", icon: "dog" },
    model: "sonnet",
    allowedTools: ["Read", "Glob", "Grep", "WebSearch"],
    mcpTools: ["list_items", "get_context", "post_comment"],
    maxBudgetPerRun: 5,
  },
];

// Default state → agent name mapping for new projects
const DEFAULT_STATE_ASSIGNMENTS: Record<string, string> = {
  Planning: "Product Manager",
  Decomposition: "Tech Lead",
  Ready: "Router",
  "In Progress": "Engineer",
  "In Review": "Code Reviewer",
};

// ── Seed functions ───────────────────────────────────────────────

/**
 * Ensure all built-in agents exist in the DB.
 * Inserts any that are missing by name. Idempotent — safe to call on every startup.
 */
export async function ensureBuiltInAgents(): Promise<void> {
  const existing = await db
    .select({ id: agents.id, name: agents.name })
    .from(agents);
  const existingNames = new Set(existing.map((p) => p.name));

  const missing = BUILT_IN_AGENTS.filter((p) => !existingNames.has(p.name));
  if (missing.length === 0) return;

  const rows = missing.map((p) => ({
    id: createId.agent() as string,
    name: p.name,
    description: p.description,
    avatar: p.avatar,
    systemPrompt: "",
    model: p.model,
    allowedTools: p.allowedTools,
    mcpTools: p.mcpTools,
    maxBudgetPerRun: p.maxBudgetPerRun,
    settings: p.name === "Router" ? { isSystem: true, isRouter: true } : p.name === "Pico" ? { isSystem: true, isAssistant: true } : {},
  }));

  await db.insert(agents).values(rows);
}

/**
 * Ensure built-in agents exist, then create default agent assignments for a project.
 */
export async function seedDefaultAgentsForProject(projectId: string): Promise<void> {
  await ensureBuiltInAgents();

  // Build name→id lookup from DB
  const allAgents = await db
    .select({ id: agents.id, name: agents.name })
    .from(agents);
  const agentNameToId = new Map(allAgents.map((p) => [p.name, p.id]));

  // Create default assignments for this project
  const assignments: { projectId: string; stateName: string; agentId: string }[] = [];

  for (const [stateName, agentName] of Object.entries(DEFAULT_STATE_ASSIGNMENTS)) {
    const agentId = agentNameToId.get(agentName);
    if (agentId) {
      assignments.push({ projectId, stateName, agentId });
    }
  }

  if (assignments.length > 0) {
    await db.insert(agentAssignments).values(assignments);
  }
}
