import { db } from "./connection.js";
import { personas, personaAssignments } from "./schema.js";
import { createId } from "@agentops/shared";

// ── Built-in persona definitions ─────────────────────────────────

interface DefaultPersona {
  name: string;
  description: string;
  avatar: { color: string; icon: string };
  model: string;
  allowedTools: string[];
  mcpTools: string[];
  maxBudgetPerRun: number;
}

const BUILT_IN_PERSONAS: DefaultPersona[] = [
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
    mcpTools: ["post_comment", "request_review", "route_to_state"],
    maxBudgetPerRun: 50,
  },
  {
    name: "Router",
    description: "Routes work items between workflow states based on execution outcomes.",
    avatar: { color: "#6366f1", icon: "route" },
    model: "haiku",
    allowedTools: ["list_items", "get_context", "route_to_state"],
    mcpTools: [],
    maxBudgetPerRun: 10,
  },
];

// Default state → persona name mapping for new projects
const DEFAULT_STATE_ASSIGNMENTS: Record<string, string> = {
  Planning: "Product Manager",
  Decomposition: "Tech Lead",
  Ready: "Router",
  "In Progress": "Engineer",
  "In Review": "Code Reviewer",
};

// ── Seed function ────────────────────────────────────────────────

/**
 * If no personas exist in the DB, seed the 5 built-in personas.
 * Then create default persona assignments for the given project.
 */
export async function seedDefaultPersonasForProject(projectId: string): Promise<void> {
  // Check if any personas exist
  const existing = await db.select({ id: personas.id }).from(personas);

  let personaNameToId: Map<string, string>;

  if (existing.length === 0) {
    // Seed built-in personas
    const rows = BUILT_IN_PERSONAS.map((p) => ({
      id: createId.persona() as string,
      name: p.name,
      description: p.description,
      avatar: p.avatar,
      systemPrompt: "",
      model: p.model,
      allowedTools: p.allowedTools,
      mcpTools: p.mcpTools,
      maxBudgetPerRun: p.maxBudgetPerRun,
      settings: p.name === "Router" ? { isSystem: true } : {},
    }));

    await db.insert(personas).values(rows);

    personaNameToId = new Map(rows.map((r) => [r.name, r.id]));
  } else {
    // Personas already exist — build lookup from DB
    const allPersonas = await db
      .select({ id: personas.id, name: personas.name })
      .from(personas);
    personaNameToId = new Map(allPersonas.map((p) => [p.name, p.id]));
  }

  // Create default assignments for this project
  const assignments: { projectId: string; stateName: string; personaId: string }[] = [];

  for (const [stateName, personaName] of Object.entries(DEFAULT_STATE_ASSIGNMENTS)) {
    const personaId = personaNameToId.get(personaName);
    if (personaId) {
      assignments.push({ projectId, stateName, personaId });
    }
  }

  if (assignments.length > 0) {
    await db.insert(personaAssignments).values(assignments);
  }
}
