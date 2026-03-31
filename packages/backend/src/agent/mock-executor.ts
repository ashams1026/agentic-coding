/**
 * Mock executor — simulates agent runs for test and dev environments.
 * Produces realistic AgentEvents without calling the Claude API.
 */

import type {
  AgentExecutor,
  AgentTask,
  AgentEvent,
  SpawnOptions,
} from "./types.js";
import type { Persona, Project } from "@agentops/shared";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface MockExecutorOptions {
  delayMs?: number;
}

export class MockExecutor implements AgentExecutor {
  private delayMs: number;

  constructor(options: MockExecutorOptions = {}) {
    this.delayMs = options.delayMs ?? 2000;
  }

  async *spawn(
    task: AgentTask,
    _persona: Persona,
    _project: Project,
    _options: SpawnOptions,
  ): AsyncIterable<AgentEvent> {
    const startTime = Date.now();
    const stepDelay = Math.max(200, Math.floor(this.delayMs / 5));

    // 1. Thinking
    await sleep(stepDelay);
    yield {
      type: "thinking",
      content: `Analyzing work item "${task.context.title}" in state "${task.context.currentState}". Let me figure out the best approach for this task.`,
    };

    // 2. Text response
    await sleep(stepDelay);
    yield {
      type: "text",
      content: `I'll work on "${task.context.title}". Based on the current state (${task.context.currentState}) and the description provided, I'll proceed with the implementation.`,
    };

    // 3. Tool use — post_comment
    const toolCallId = `mock-tc-${Date.now()}`;
    await sleep(stepDelay);
    yield {
      type: "tool_use",
      toolName: "post_comment",
      input: {
        workItemId: task.workItemId,
        content: `[Simulated] Completed work on "${task.context.title}".`,
      },
      toolCallId,
    };

    // 4. Tool result
    await sleep(stepDelay);
    yield {
      type: "tool_result",
      toolCallId,
      output: JSON.stringify({ success: true, commentId: `cm-mock-${Date.now()}` }),
      isError: false,
    };

    // 5. Final text
    await sleep(stepDelay);
    yield {
      type: "text",
      content: `Work on "${task.context.title}" is complete. Posted a summary comment on the work item.`,
    };

    // 6. Result
    const durationMs = Date.now() - startTime;
    yield {
      type: "result",
      summary: `[Simulated] Completed work on "${task.context.title}"`,
      outcome: "success",
      costUsd: 0,
      durationMs,
    };
  }
}
