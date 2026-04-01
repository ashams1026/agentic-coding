/**
 * Example custom executor — echoes back the task description.
 *
 * This is the simplest possible AgentExecutor implementation.
 * It demonstrates the interface contract without calling any AI API.
 */

import type {
  AgentExecutor,
  AgentTask,
  AgentEvent,
  SpawnOptions,
} from "@agentops/core";
import type { Persona, Project } from "@agentops/shared";

export class EchoExecutor implements AgentExecutor {
  async *spawn(
    task: AgentTask,
    persona: Persona,
    _project: Project,
    _options: SpawnOptions,
  ): AsyncIterable<AgentEvent> {
    // 1. Emit a thinking event
    yield {
      type: "thinking",
      content: `${persona.name} is processing: "${task.context.title}"`,
    };

    // 2. Emit the task description as text
    yield {
      type: "text",
      content: [
        `# Echo: ${task.context.title}`,
        "",
        `**Work Item:** ${task.workItemId}`,
        `**State:** ${task.context.currentState}`,
        `**Persona:** ${persona.name} (${persona.model})`,
        "",
        "## Description",
        "",
        task.context.description || "(no description)",
        "",
        "---",
        `*Echoed by EchoExecutor at ${new Date().toISOString()}*`,
      ].join("\n"),
    };

    // 3. Emit a successful result
    yield {
      type: "result",
      summary: `Echoed task "${task.context.title}" (${task.context.description.length} chars)`,
      outcome: "success",
      costUsd: 0,
      durationMs: 10,
    };
  }
}
