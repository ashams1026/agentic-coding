/**
 * Project memory — generates compressed summaries when top-level
 * work items reach Done. Stored in project_memories for future context.
 *
 * Uses a haiku-model one-shot call for summary generation.
 */

import { eq, and, isNull, asc, inArray } from "drizzle-orm";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { db } from "../db/connection.js";
import {
  workItems,
  executions,
  comments,
  projectMemories,
} from "../db/schema.js";
import { createId } from "@agentops/shared";

const CONSOLIDATION_THRESHOLD = 50;
const DEFAULT_TOKEN_BUDGET = 1000;
const APPROX_CHARS_PER_TOKEN = 4;

// ── Public API ───────────────────────────────────────────────────

/**
 * If a work item just reached Done and is top-level (no parent),
 * generate a project memory summarizing the work.
 *
 * No-op for child items or non-Done states.
 */
export async function checkMemoryGeneration(
  workItemId: string,
  newState: string,
): Promise<void> {
  if (newState !== "Done") return;

  const [item] = await db
    .select({
      parentId: workItems.parentId,
      projectId: workItems.projectId,
      title: workItems.title,
      description: workItems.description,
    })
    .from(workItems)
    .where(eq(workItems.id, workItemId));

  if (!item) return;
  if (item.parentId) return; // Only top-level items generate memories

  // Generate in background — don't block the state transition
  generateMemory(workItemId, item.projectId, item.title, item.description).catch(
    (err) => {
      console.error(`Memory generation failed for ${workItemId}:`, err);
    },
  );
}

// ── Memory generation ────────────────────────────────────────────

async function generateMemory(
  workItemId: string,
  projectId: string,
  title: string,
  description: string,
): Promise<void> {
  // Gather context from executions
  const itemExecutions = await db
    .select({
      summary: executions.summary,
      outcome: executions.outcome,
      costUsd: executions.costUsd,
    })
    .from(executions)
    .where(eq(executions.workItemId, workItemId));

  // Gather child work items
  const children = await db
    .select({
      title: workItems.title,
      currentState: workItems.currentState,
    })
    .from(workItems)
    .where(eq(workItems.parentId, workItemId));

  // Gather key comments (system comments with metadata)
  const itemComments = await db
    .select({
      content: comments.content,
      authorType: comments.authorType,
    })
    .from(comments)
    .where(eq(comments.workItemId, workItemId));

  // Build context for the summarizer
  const contextParts: string[] = [
    `# Work Item: ${title}`,
    description ? `Description: ${description}` : "",
  ];

  if (children.length > 0) {
    contextParts.push(
      `\n## Child Items (${children.length}):`,
      ...children.map((c) => `- ${c.title} [${c.currentState}]`),
    );
  }

  if (itemExecutions.length > 0) {
    contextParts.push(
      `\n## Executions (${itemExecutions.length}):`,
      ...itemExecutions
        .filter((e) => e.summary)
        .map((e) => `- [${e.outcome}] ${e.summary}`),
    );
  }

  if (itemComments.length > 0) {
    const systemComments = itemComments.filter((c) => c.authorType === "system");
    if (systemComments.length > 0) {
      contextParts.push(
        `\n## System Notes:`,
        ...systemComments.slice(-5).map((c) => `- ${c.content.slice(0, 200)}`),
      );
    }
  }

  const context = contextParts.filter(Boolean).join("\n");

  // Call haiku for summary generation
  const summaryResult = await callHaikuSummarizer(context);

  // Insert into project_memories
  await db.insert(projectMemories).values({
    id: createId.projectMemory(),
    projectId,
    workItemId,
    summary: summaryResult.summary,
    filesChanged: summaryResult.filesChanged,
    keyDecisions: summaryResult.keyDecisions,
    createdAt: new Date(),
    consolidatedInto: null,
  });

  // Check if consolidation is needed
  consolidateIfNeeded(projectId).catch((err) => {
    console.error(`Memory consolidation failed for project ${projectId}:`, err);
  });
}

// ── Haiku summarizer ─────────────────────────────────────────────

const SUMMARIZER_PROMPT = `You are a project memory summarizer. Given context about a completed work item, produce a structured JSON summary.

Output ONLY valid JSON with this shape:
{
  "summary": "1-3 sentence summary of what was accomplished",
  "filesChanged": ["file1.ts", "file2.ts"],
  "keyDecisions": ["decision 1", "decision 2"]
}

Rules:
- summary: concise, factual, past tense
- filesChanged: extract any file paths mentioned, empty array if none found
- keyDecisions: important choices made during the work, empty array if none`;

interface SummaryResult {
  summary: string;
  filesChanged: string[];
  keyDecisions: string[];
}

async function callHaikuSummarizer(context: string): Promise<SummaryResult> {
  const fallback: SummaryResult = {
    summary: "Work item completed.",
    filesChanged: [],
    keyDecisions: [],
  };

  try {
    const abortController = new AbortController();
    let resultText = "";

    const q = query({
      prompt: context,
      options: {
        abortController,
        model: "claude-haiku-4-5-20251001",
        systemPrompt: SUMMARIZER_PROMPT,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        maxTurns: 1,
        tools: [],
      },
    });

    for await (const msg of q) {
      if (msg.type === "assistant") {
        for (const block of msg.message.content) {
          if (block.type === "text") {
            resultText += block.text;
          }
        }
      }
    }

    // Parse JSON from response
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : fallback.summary,
      filesChanged: Array.isArray(parsed.filesChanged) ? parsed.filesChanged : [],
      keyDecisions: Array.isArray(parsed.keyDecisions) ? parsed.keyDecisions : [],
    };
  } catch (err) {
    console.error("Haiku summarizer failed:", err);
    return fallback;
  }
}

// ── Memory retrieval ─────────────────────────────────────────────

/**
 * Get recent non-consolidated memories for a project, capped at
 * approximately `tokenBudget` tokens (~4 chars per token).
 *
 * Returns newest memories first, truncating when budget is exceeded.
 */
export async function getRecentMemories(
  projectId: string,
  tokenBudget: number = DEFAULT_TOKEN_BUDGET,
): Promise<Array<{ summary: string; createdAt: string }>> {
  const charBudget = tokenBudget * APPROX_CHARS_PER_TOKEN;

  // Fetch non-consolidated memories, newest first
  const memories = await db
    .select({
      summary: projectMemories.summary,
      createdAt: projectMemories.createdAt,
    })
    .from(projectMemories)
    .where(
      and(
        eq(projectMemories.projectId, projectId),
        isNull(projectMemories.consolidatedInto),
      ),
    )
    .orderBy(asc(projectMemories.createdAt));

  // Accumulate until budget is exceeded
  const result: Array<{ summary: string; createdAt: string }> = [];
  let charsUsed = 0;

  for (const m of memories) {
    const entryChars = m.summary.length;
    if (charsUsed + entryChars > charBudget && result.length > 0) break;
    result.push({ summary: m.summary, createdAt: m.createdAt.toISOString() });
    charsUsed += entryChars;
  }

  return result;
}

// ── Memory consolidation ─────────────────────────────────────────

const CONSOLIDATION_PROMPT = `You are a project memory consolidator. Given a list of individual project memories, merge them into a single higher-level summary.

Output ONLY valid JSON with this shape:
{
  "summary": "Consolidated summary covering all the input memories (3-5 sentences)",
  "filesChanged": ["all unique file paths from the inputs"],
  "keyDecisions": ["most important decisions across all inputs"]
}

Rules:
- Preserve key information but reduce redundancy
- Keep the most important decisions and file changes
- summary should cover the overall arc, not list each item`;

/**
 * If the project has more than CONSOLIDATION_THRESHOLD non-consolidated
 * memories, merge the oldest half into a single consolidated entry.
 */
async function consolidateIfNeeded(projectId: string): Promise<void> {
  const allMemories = await db
    .select({
      id: projectMemories.id,
      summary: projectMemories.summary,
      filesChanged: projectMemories.filesChanged,
      keyDecisions: projectMemories.keyDecisions,
    })
    .from(projectMemories)
    .where(
      and(
        eq(projectMemories.projectId, projectId),
        isNull(projectMemories.consolidatedInto),
      ),
    )
    .orderBy(asc(projectMemories.createdAt));

  if (allMemories.length < CONSOLIDATION_THRESHOLD) return;

  // Take the oldest half for consolidation
  const toConsolidate = allMemories.slice(0, Math.floor(allMemories.length / 2));

  // Build context for the consolidation prompt
  const contextLines = toConsolidate.map((m, i) =>
    `Memory ${i + 1}: ${m.summary}${m.filesChanged.length > 0 ? ` (files: ${m.filesChanged.join(", ")})` : ""}${m.keyDecisions.length > 0 ? ` (decisions: ${m.keyDecisions.join("; ")})` : ""}`,
  );

  const consolidationResult = await callConsolidator(contextLines.join("\n\n"));

  // Create the consolidated memory entry
  const consolidatedId = createId.projectMemory();
  await db.insert(projectMemories).values({
    id: consolidatedId,
    projectId,
    workItemId: toConsolidate[0]!.id, // reference first work item as representative
    summary: consolidationResult.summary,
    filesChanged: consolidationResult.filesChanged,
    keyDecisions: consolidationResult.keyDecisions,
    createdAt: new Date(),
    consolidatedInto: null,
  });

  // Mark the old entries as consolidated
  const idsToMark = toConsolidate.map((m) => m.id);
  await db
    .update(projectMemories)
    .set({ consolidatedInto: consolidatedId })
    .where(inArray(projectMemories.id, idsToMark));
}

async function callConsolidator(context: string): Promise<SummaryResult> {
  const fallback: SummaryResult = {
    summary: "Consolidated project work.",
    filesChanged: [],
    keyDecisions: [],
  };

  try {
    const abortController = new AbortController();
    let resultText = "";

    const q = query({
      prompt: context,
      options: {
        abortController,
        model: "claude-haiku-4-5-20251001",
        systemPrompt: CONSOLIDATION_PROMPT,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        maxTurns: 1,
        tools: [],
      },
    });

    for await (const msg of q) {
      if (msg.type === "assistant") {
        for (const block of msg.message.content) {
          if (block.type === "text") {
            resultText += block.text;
          }
        }
      }
    }

    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : fallback.summary,
      filesChanged: Array.isArray(parsed.filesChanged) ? parsed.filesChanged : [],
      keyDecisions: Array.isArray(parsed.keyDecisions) ? parsed.keyDecisions : [],
    };
  } catch (err) {
    console.error("Consolidation summarizer failed:", err);
    return fallback;
  }
}
