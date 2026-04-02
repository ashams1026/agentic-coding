import { db } from "./connection.js";
import { templates } from "./schema.js";
import { createId } from "@agentops/shared";
import { logger } from "../logger.js";

// ── Built-in template definitions ───────────────────────────────

interface BuiltInTemplate {
  name: string;
  type: "work_item";
  description: string;
  content: {
    title: string;
    description: string;
    priority: string;
    labels: string[];
  };
}

const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  {
    name: "Bug Report",
    type: "work_item",
    description: "Report a bug with steps to reproduce, expected vs actual behavior.",
    content: {
      title: "Bug: [short description]",
      description:
        "## Steps to Reproduce\n1. \n2. \n3. \n\n## Expected Behavior\n\n\n## Actual Behavior\n\n\n## Environment\n- Browser/OS: \n- Version: ",
      priority: "high",
      labels: ["bug"],
    },
  },
  {
    name: "Feature Request",
    type: "work_item",
    description: "Propose a new feature with user story, acceptance criteria, and scope.",
    content: {
      title: "Feature: [short description]",
      description:
        "## User Story\nAs a [role], I want [capability] so that [benefit].\n\n## Acceptance Criteria\n- [ ] \n- [ ] \n- [ ] \n\n## Scope\n### In Scope\n- \n\n### Out of Scope\n- ",
      priority: "medium",
      labels: ["feature"],
    },
  },
  {
    name: "Spike",
    type: "work_item",
    description: "Time-boxed research task to investigate a technical question or approach.",
    content: {
      title: "Spike: [research question]",
      description:
        "## Question\nWhat is the best approach to [topic]?\n\n## Time Box\n[X] hours\n\n## Success Criteria\n- Document findings\n- Recommend approach with pros/cons\n- Identify risks and unknowns\n\n## Notes\n",
      priority: "medium",
      labels: ["spike", "research"],
    },
  },
];

// ── Seed function ───────────────────────────────────────────────

export async function seedBuiltInTemplates(): Promise<void> {
  const existing = await db.select({ id: templates.id }).from(templates);
  if (existing.length > 0) return; // Already seeded

  const now = new Date();
  for (const tpl of BUILT_IN_TEMPLATES) {
    await db.insert(templates).values({
      id: createId.template(),
      name: tpl.name,
      type: tpl.type,
      description: tpl.description,
      content: tpl.content,
      isBuiltIn: true,
      createdAt: now,
    });
  }

  logger.info({ count: BUILT_IN_TEMPLATES.length }, "Seeded built-in templates");
}
