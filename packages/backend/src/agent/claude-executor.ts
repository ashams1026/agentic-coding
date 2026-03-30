/**
 * Claude Agent SDK executor — implements AgentExecutor using the
 * @anthropic-ai/claude-agent-sdk to spawn Claude Code subprocesses.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type {
  AgentExecutor,
  AgentTask,
  AgentEvent,
  SpawnOptions,
} from "./types.js";
import type { Persona, Project } from "@agentops/shared";

// ── Model mapping ─────────────────────────────────────────────────

const MODEL_MAP: Record<string, string> = {
  opus: "claude-opus-4-6",
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5-20251001",
};

function resolveModel(model: string): string {
  return MODEL_MAP[model] ?? model;
}

// ── SDKMessage → AgentEvent mapping ───────────────────────────────

function mapMessage(msg: SDKMessage): AgentEvent[] {
  const events: AgentEvent[] = [];

  if (msg.type === "assistant") {
    // Extract content blocks from the BetaMessage
    for (const block of msg.message.content) {
      if (block.type === "text") {
        events.push({ type: "text", content: block.text });
      } else if (block.type === "tool_use") {
        events.push({
          type: "tool_use",
          toolName: block.name,
          input: (block.input as Record<string, unknown>) ?? {},
          toolCallId: block.id,
        });
      } else if (block.type === "thinking") {
        events.push({ type: "thinking", content: block.thinking });
      }
    }
  } else if (msg.type === "result") {
    if (msg.subtype === "success") {
      events.push({
        type: "result",
        summary: msg.result,
        outcome: "success",
        costUsd: msg.total_cost_usd,
        durationMs: msg.duration_ms,
      });
    } else {
      // error result
      events.push({
        type: "error",
        message: "error" in msg ? String(msg.error) : "Query failed",
        code: "subtype" in msg ? msg.subtype : undefined,
      });
    }
  }

  return events;
}

// ── Executor ──────────────────────────────────────────────────────

export class ClaudeExecutor implements AgentExecutor {
  async *spawn(
    task: AgentTask,
    persona: Persona,
    project: Project,
    options: SpawnOptions,
  ): AsyncIterable<AgentEvent> {
    // Build the prompt from work item context
    const prompt = [
      `Work item: ${task.context.title}`,
      task.context.description
        ? `Description: ${task.context.description}`
        : null,
      `Current state: ${task.context.currentState}`,
      task.context.parentChain.length > 0
        ? `Parent chain: ${task.context.parentChain.map((p) => p.title).join(" → ")}`
        : null,
      task.executionHistory.length > 0
        ? `Previous executions: ${task.executionHistory.length}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const abortController = new AbortController();

    try {
      const q = query({
        prompt,
        options: {
          abortController,
          cwd: project.path,
          model: resolveModel(options.model),
          systemPrompt: persona.systemPrompt,
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
          maxTurns: 30,
          maxBudgetUsd: options.maxBudget > 0 ? options.maxBudget : undefined,
          tools: [],
          mcpServers: {
            agentops: {
              command: "node",
              args: [
                "--import",
                "tsx",
                new URL("./mcp-server.ts", import.meta.url).pathname,
              ],
              env: {
                PERSONA_NAME: persona.name,
                PERSONA_ID: persona.id,
                PROJECT_ID: project.id,
                ALLOWED_TOOLS: options.tools.join(","),
              },
            },
          },
        },
      });

      for await (const msg of q) {
        const events = mapMessage(msg);
        for (const event of events) {
          yield event;
        }
      }
    } catch (err) {
      yield {
        type: "error",
        message: err instanceof Error ? err.message : String(err),
        code: "executor_error",
      };
    }
  }
}
