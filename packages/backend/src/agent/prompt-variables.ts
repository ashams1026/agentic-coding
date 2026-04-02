// ── Variable resolution ─────────────────────────────────────────

const VAR_REGEX = /(?<!\\)\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}/g;

/**
 * Replace `{{variable.name}}` placeholders in a template string.
 * Undefined variables are left as literal text (not removed).
 */
export function resolveVariables(
  template: string,
  context: Record<string, string | undefined>,
): string {
  return template.replace(VAR_REGEX, (match, varName: string) => {
    const value = context[varName];
    return value !== undefined ? value : match;
  });
}

// ── Context builder ─────────────────────────────────────────────

// Minimal shapes — accepts both shared types and Drizzle row types
// without requiring unsafe double casts (e.g., `as unknown as Project`)
interface VariableContextOptions {
  project?: { name: string; path: string; settings: Record<string, unknown> } | null;
  agent?: { name: string; description: string; model: string } | null;
  workItem?: {
    id: string;
    title: string;
    state: string;
    description: string;
  } | null;
}

/**
 * Build the variable context map from available data.
 * All values are strings (or undefined if the source is missing).
 */
export function buildVariableContext(options: VariableContextOptions): Record<string, string | undefined> {
  const ctx: Record<string, string | undefined> = {};

  // project.* namespace
  if (options.project) {
    ctx["project.name"] = options.project.name;
    ctx["project.path"] = options.project.path;
    const settings = options.project.settings as Record<string, unknown> | undefined;
    ctx["project.description"] = settings?.description ? String(settings.description) : undefined;
  }

  // agent.* namespace
  if (options.agent) {
    ctx["agent.name"] = options.agent.name;
    ctx["agent.description"] = options.agent.description || undefined;
    ctx["agent.model"] = options.agent.model;
  }

  // date.* namespace
  const now = new Date();
  ctx["date.now"] = now.toISOString();
  ctx["date.today"] = now.toISOString().split("T")[0]!;
  ctx["date.dayOfWeek"] = now.toLocaleDateString("en-US", { weekday: "long" });

  // workItem.* namespace (only available in executor path, not chat)
  if (options.workItem) {
    ctx["workItem.id"] = options.workItem.id;
    ctx["workItem.title"] = options.workItem.title;
    ctx["workItem.state"] = options.workItem.state;
    ctx["workItem.description"] = options.workItem.description || undefined;
  }

  return ctx;
}
