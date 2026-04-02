/**
 * Handoff Notes — structured context passed between agents as a work item
 * moves through workflow states. Each completed execution can produce a
 * handoff note that the next agent receives as injected context.
 */

import { eq, desc, and } from "drizzle-orm";
import { db } from "../db/connection.js";
import { executions } from "../db/schema.js";

export interface HandoffNote {
  fromState: string;
  targetState: string;
  summary: string;
  decisions: string[];
  filesChanged: string[];
  openQuestions: string[];
}

/**
 * Build a handoff note from execution context.
 * Extracts structured information from the execution summary and logs.
 */
export function buildHandoffNote(opts: {
  fromState: string;
  targetState: string;
  summary: string;
  logs: string;
}): HandoffNote {
  const { fromState, targetState, summary, logs } = opts;

  // Extract file paths from logs — look for common patterns like file writes/edits
  const filePatterns = /(?:wrote|edited|created|modified|deleted|read)\s+["`']?([^\s"`']+\.\w{1,10})["`']?/gi;
  const filesSet = new Set<string>();
  let match;
  while ((match = filePatterns.exec(logs)) !== null) {
    filesSet.add(match[1]!);
  }

  // Extract decisions — sentences containing "decided", "chose", "using", "switched to"
  const decisionPatterns = /[^.!?]*(?:decided|chose|chosen|using|switched to|opted for|selected)[^.!?]*[.!?]/gi;
  const decisions: string[] = [];
  while ((match = decisionPatterns.exec(summary)) !== null) {
    decisions.push(match[0].trim());
  }

  // Extract open questions — sentences containing "?", "TODO", "unclear", "needs"
  const questionPatterns = /[^.!?]*(?:\?|TODO|unclear|needs investigation|needs review|unresolved)[^.!?]*[.!?]?/gi;
  const openQuestions: string[] = [];
  while ((match = questionPatterns.exec(summary)) !== null) {
    openQuestions.push(match[0].trim());
  }

  return {
    fromState,
    targetState,
    summary: summary.slice(0, 500),
    decisions: decisions.slice(0, 10),
    filesChanged: Array.from(filesSet).slice(0, 20),
    openQuestions: openQuestions.slice(0, 5),
  };
}

/**
 * Query the most recent handoff note for a work item.
 * Returns null if no prior completed execution has handoff notes.
 */
export async function getLastHandoffNote(workItemId: string): Promise<HandoffNote | null> {
  const [row] = await db
    .select({ handoffNotes: executions.handoffNotes })
    .from(executions)
    .where(
      and(
        eq(executions.workItemId, workItemId),
        eq(executions.status, "completed"),
      ),
    )
    .orderBy(desc(executions.completedAt))
    .limit(1);

  return (row?.handoffNotes as HandoffNote | null) ?? null;
}

/**
 * Format a handoff note as a text section for system prompt injection.
 */
export function formatHandoffForPrompt(note: HandoffNote): string {
  const lines = [
    `## Previous Agent Context`,
    `Previous state: ${note.fromState} → ${note.targetState}`,
    `Summary: ${note.summary}`,
  ];

  if (note.decisions.length > 0) {
    lines.push(`Decisions made:\n${note.decisions.map((d) => `- ${d}`).join("\n")}`);
  }

  if (note.filesChanged.length > 0) {
    lines.push(`Files changed:\n${note.filesChanged.map((f) => `- ${f}`).join("\n")}`);
  }

  if (note.openQuestions.length > 0) {
    lines.push(`Open questions:\n${note.openQuestions.map((q) => `- ${q}`).join("\n")}`);
  }

  return lines.join("\n");
}

/**
 * Build accumulated context from all handoff notes for a work item.
 * Implements context windowing: most recent note is full, older notes
 * are compressed to one-line summaries to fit within a token budget.
 *
 * @param workItemId - The work item to collect context for
 * @param maxChars - Approximate character budget (~4 chars per token, default 8000 ≈ 2000 tokens)
 * @returns Formatted context string, or null if no handoff notes exist
 */
export async function buildAccumulatedContext(
  workItemId: string,
  maxChars = 8000,
): Promise<string | null> {
  const rows = await db
    .select({ handoffNotes: executions.handoffNotes, completedAt: executions.completedAt })
    .from(executions)
    .where(
      and(
        eq(executions.workItemId, workItemId),
        eq(executions.status, "completed"),
      ),
    )
    .orderBy(desc(executions.completedAt));

  const notes = rows
    .map((r) => r.handoffNotes as HandoffNote | null)
    .filter((n): n is HandoffNote => n !== null);

  if (notes.length === 0) return null;

  const sections: string[] = [];
  let charCount = 0;

  // Most recent note gets full formatting
  const latest = notes[0]!;
  const fullSection = formatHandoffForPrompt(latest);
  sections.push(fullSection);
  charCount += fullSection.length;

  // Older notes get compressed to one-line summaries
  if (notes.length > 1) {
    const olderLines: string[] = ["### Earlier Context (summarized)"];
    for (let i = 1; i < notes.length; i++) {
      const note = notes[i]!;
      const line = `- [${note.fromState} → ${note.targetState}] ${note.summary.slice(0, 120)}`;
      if (charCount + line.length + 2 > maxChars) break; // Stop if budget exceeded
      olderLines.push(line);
      charCount += line.length + 1;
    }
    if (olderLines.length > 1) {
      sections.push(olderLines.join("\n"));
    }
  }

  return sections.join("\n\n");
}
