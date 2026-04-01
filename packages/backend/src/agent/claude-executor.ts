/**
 * Claude Agent SDK executor — implements AgentExecutor using the
 * @anthropic-ai/claude-agent-sdk to spawn Claude Code subprocesses.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage, AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import type {
  AgentExecutor,
  AgentTask,
  AgentEvent,
  SpawnOptions,
} from "./types.js";
import type { Persona, Project } from "@agentops/shared";
import { loadConfig } from "../config.js";
import { validateCommand, buildSandboxPrompt } from "./sandbox.js";

// ── System prompt assembly ────────────────────────────────────────

export function buildSystemPrompt(
  persona: Persona,
  task: AgentTask,
  project: Project,
): string {
  const sections: string[] = [];

  // (1) Persona identity
  if (persona.systemPrompt) {
    sections.push(persona.systemPrompt);
  }

  // (2) Project context
  sections.push(
    [
      `## Project: ${project.name}`,
      `Working directory: ${project.path}`,
      project.settings.description
        ? `Description: ${project.settings.description}`
        : null,
      project.settings.patterns
        ? `Key patterns: ${project.settings.patterns}`
        : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  // (3) Work item context
  const workItemLines = [
    `## Work Item: ${task.context.title}`,
    `ID: ${task.workItemId}`,
    `State: ${task.context.currentState}`,
  ];
  if (task.context.description) {
    workItemLines.push(`Description: ${task.context.description}`);
  }
  if (task.context.parentChain.length > 0) {
    workItemLines.push(
      `Parent chain: ${task.context.parentChain.map((p) => `${p.title} (${p.id})`).join(" → ")}`,
    );
  }
  if (Object.keys(task.context.inheritedContext).length > 0) {
    workItemLines.push(
      `Inherited context: ${JSON.stringify(task.context.inheritedContext)}`,
    );
  }
  sections.push(workItemLines.join("\n"));

  // (4) Sandbox rules
  sections.push(buildSandboxPrompt(project.path));

  // (5) Execution history
  if (task.executionHistory.length > 0) {
    const historyLines = ["## Previous Executions"];
    for (const entry of task.executionHistory) {
      historyLines.push(
        `- [${entry.outcome}] ${entry.summary}`,
      );
      if (entry.rejectionPayload) {
        historyLines.push(
          `  Rejection: ${entry.rejectionPayload.reason} (severity: ${entry.rejectionPayload.severity})`,
        );
        if (entry.rejectionPayload.hint) {
          historyLines.push(`  Hint: ${entry.rejectionPayload.hint}`);
        }
      }
    }
    sections.push(historyLines.join("\n"));
  }

  return sections.join("\n\n");
}

// ── Available SDK built-in tool names ─────────────────────────────
// These are the short names the Claude Agent SDK expects in the
// `tools` option of query(). Passing [] disables all built-in tools.
// Persona `allowedTools` arrays should use these exact names.
//
// File tools:    Read, Edit, Write, NotebookEdit
// Search tools:  Glob, Grep
// Execution:     Bash
// Web tools:     WebFetch, WebSearch
// Agent tools:   Agent
// Other:         TodoWrite, AskUserQuestion

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
    // Read API key from config on each execution (user might update it)
    const config = loadConfig();
    if (!config.anthropicApiKey) {
      yield {
        type: "error",
        message: "Anthropic API key not configured. Go to Settings \u2192 API Keys.",
        code: "no_api_key",
      };
      return;
    }

    // Set env var for the SDK (reads ANTHROPIC_API_KEY)
    process.env["ANTHROPIC_API_KEY"] = config.anthropicApiKey;

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
      // Define persona as a named agent so the SDK handles skills natively.
      // Skills are SDK skill names (e.g., "commit", "review-pr") — the SDK
      // loads, tokenizes, and manages their context automatically.
      const agentId = persona.id;
      const agentDef: AgentDefinition = {
        description: persona.description,
        prompt: buildSystemPrompt(persona, task, project),
        tools: persona.allowedTools.length > 0 ? persona.allowedTools : [],
        model: resolveModel(options.model),
        maxTurns: 30,
        ...(persona.skills.length > 0 ? { skills: persona.skills } : {}),
      };

      const q = query({
        prompt,
        options: {
          abortController,
          cwd: project.path,
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
          enableFileCheckpointing: true,
          maxBudgetUsd: options.maxBudget > 0 ? options.maxBudget : undefined,
          agent: agentId,
          agents: { [agentId]: agentDef },
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
                // MCP tools: pass persona's mcpTools for server-side filtering
                ALLOWED_TOOLS: persona.mcpTools.join(","),
              },
            },
          },
        },
      });

      let checkpointEmitted = false;
      for await (const msg of q) {
        // Emit a checkpoint event for the first assistant message
        if (!checkpointEmitted && msg.type === "assistant" && msg.message.id) {
          checkpointEmitted = true;
          yield { type: "checkpoint" as const, messageId: msg.message.id };
        }
        const events = mapMessage(msg);
        for (const event of events) {
          // Sandbox: validate Bash commands before they execute
          if (
            event.type === "tool_use" &&
            event.toolName === "Bash" &&
            typeof event.input.command === "string"
          ) {
            const result = validateCommand(event.input.command, project.path);
            if (!result.allowed) {
              yield {
                type: "error",
                message: `[SANDBOX] Blocked command: ${result.reason}`,
                code: "sandbox_blocked",
              };
              abortController.abort();
              return;
            }
          }
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
