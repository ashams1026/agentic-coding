/**
 * Claude Agent SDK executor — implements AgentExecutor using the
 * @anthropic-ai/claude-agent-sdk to spawn Claude Code subprocesses.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage, AgentDefinition, HookCallback, PreToolUseHookInput, PostToolUseHookInput, PostToolUseFailureHookInput, SessionStartHookInput, SessionEndHookInput, FileChangedHookInput, SubagentStartHookInput, SubagentStopHookInput } from "@anthropic-ai/claude-agent-sdk";
import type {
  AgentExecutor,
  AgentTask,
  AgentEvent,
  SpawnOptions,
} from "./types.js";
import type { Persona, Project } from "@agentops/shared";
import { loadConfig } from "../config.js";
import { validateCommand, buildSandboxPrompt } from "./sandbox.js";
import { auditToolUse, auditSessionStart, auditSessionEnd } from "../audit.js";
import { broadcast } from "../ws.js";
import type { ExecutionId } from "@agentops/shared";

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
  } else if (msg.type === "stream_event") {
    // Partial streaming — extract text deltas from content_block_delta events
    const evt = msg.event;
    if (evt.type === "content_block_delta" && "delta" in evt) {
      const delta = evt.delta as unknown as Record<string, unknown>;
      if (delta.type === "text_delta" && typeof delta.text === "string") {
        events.push({ type: "partial", content: delta.text, index: evt.index });
      }
    }
  } else if (msg.type === "system" && "subtype" in msg && msg.subtype === "task_progress") {
    // Agent progress summary — AI-generated description of current work
    const progressMsg = msg as { description: string; summary?: string; usage: { total_tokens: number; tool_uses: number; duration_ms: number } };
    events.push({
      type: "progress",
      description: progressMsg.description,
      summary: progressMsg.summary,
      totalTokens: progressMsg.usage.total_tokens,
      toolUses: progressMsg.usage.tool_uses,
      durationMs: progressMsg.usage.duration_ms,
    });
  } else if (msg.type === "result") {
    if (msg.subtype === "success") {
      events.push({
        type: "result",
        summary: msg.result,
        outcome: "success",
        costUsd: msg.total_cost_usd,
        durationMs: msg.duration_ms,
        structuredOutput: msg.structured_output ?? undefined,
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

// ── Sandbox hook ─────────────────────────────────────────────────

function buildSandboxHook(projectPath: string): HookCallback {
  return async (input, _toolUseID, _options) => {
    const preInput = input as PreToolUseHookInput;
    const toolInput = preInput.tool_input as Record<string, unknown>;
    const command = toolInput?.command as string;

    if (typeof command === "string") {
      const result = validateCommand(command, projectPath);
      if (!result.allowed) {
        return {
          hookSpecificOutput: {
            hookEventName: "PreToolUse" as const,
            permissionDecision: "deny" as const,
            permissionDecisionReason: `[SANDBOX] Blocked: ${result.reason}`,
          },
        };
      }
    }

    return {};
  };
}

// ── Audit hook ───────────────────────────────────────────────────

const SENSITIVE_PATTERNS = /(?:ANTHROPIC_API_KEY|API_KEY|SECRET|TOKEN|PASSWORD)=[^\s]*/gi;

function sanitizeCommand(command: string): string {
  return command.replace(SENSITIVE_PATTERNS, (match) => {
    const key = match.split("=")[0];
    return `${key}=***`;
  });
}

function buildAuditHooks(executionId: string): {
  preToolUse: HookCallback;
  postToolUse: HookCallback;
  postToolUseFailure: HookCallback;
} {
  const startTimes = new Map<string, number>();

  const preToolUse: HookCallback = async (input, _toolUseID, _options) => {
    const preInput = input as PreToolUseHookInput;
    startTimes.set(preInput.tool_use_id, Date.now());
    return {};
  };

  const postToolUse: HookCallback = async (input, _toolUseID, _options) => {
    const postInput = input as PostToolUseHookInput;
    const startTime = startTimes.get(postInput.tool_use_id);
    const durationMs = startTime ? Date.now() - startTime : 0;
    startTimes.delete(postInput.tool_use_id);

    const toolInput = postInput.tool_input as Record<string, unknown>;
    const command = postInput.tool_name === "Bash" && typeof toolInput?.command === "string"
      ? sanitizeCommand(toolInput.command)
      : undefined;

    auditToolUse({ executionId, toolName: postInput.tool_name, durationMs, success: true, command });
    return {};
  };

  const postToolUseFailure: HookCallback = async (input, _toolUseID, _options) => {
    const failInput = input as PostToolUseFailureHookInput;
    const startTime = startTimes.get(failInput.tool_use_id);
    const durationMs = startTime ? Date.now() - startTime : 0;
    startTimes.delete(failInput.tool_use_id);

    const toolInput = failInput.tool_input as Record<string, unknown>;
    const command = failInput.tool_name === "Bash" && typeof toolInput?.command === "string"
      ? sanitizeCommand(toolInput.command)
      : undefined;

    auditToolUse({ executionId, toolName: failInput.tool_name, durationMs, success: false, command });
    return {};
  };

  return { preToolUse, postToolUse, postToolUseFailure };
}

// ── Session lifecycle hooks ──────────────────────────────────────

function buildSessionHooks(ctx: {
  executionId: string;
  personaName: string;
  personaId: string;
  model: string;
  workItemId: string;
}): {
  sessionStart: HookCallback;
  sessionEnd: HookCallback;
} {
  let sessionStartTime = 0;

  const sessionStart: HookCallback = async (input, _toolUseID, _options) => {
    sessionStartTime = Date.now();
    const startInput = input as SessionStartHookInput;

    auditSessionStart({
      executionId: ctx.executionId,
      personaName: ctx.personaName,
      model: startInput.model ?? ctx.model,
      workItemId: ctx.workItemId,
    });

    broadcast({
      type: "execution_update",
      executionId: ctx.executionId as ExecutionId,
      status: "running",
      timestamp: new Date().toISOString(),
    });

    return {};
  };

  const sessionEnd: HookCallback = async (input, _toolUseID, _options) => {
    const endInput = input as SessionEndHookInput;
    const durationMs = sessionStartTime > 0 ? Date.now() - sessionStartTime : 0;

    auditSessionEnd({
      executionId: ctx.executionId,
      reason: endInput.reason,
      durationMs,
    });

    return {};
  };

  return { sessionStart, sessionEnd };
}

// ── File change hook ─────────────────────────────────────────────

const FILE_EVENT_MAP: Record<string, "created" | "modified" | "deleted"> = {
  add: "created",
  change: "modified",
  unlink: "deleted",
};

function buildFileChangedHook(executionId: string): HookCallback {
  return async (input, _toolUseID, _options) => {
    const fileInput = input as FileChangedHookInput;
    const changeType = FILE_EVENT_MAP[fileInput.event] ?? "modified";

    broadcast({
      type: "file_changed",
      executionId: executionId as ExecutionId,
      filePath: fileInput.file_path,
      changeType,
      timestamp: new Date().toISOString(),
    });

    return {};
  };
}

// ── Subagent tracking hooks ──────────────────────────────────────

function buildSubagentHooks(
  parentExecutionId: string,
  allPersonas: Persona[],
): { subagentStart: HookCallback; subagentStop: HookCallback } {
  const personaMap = new Map(allPersonas.map((p) => [p.id as string, p]));

  const subagentStart: HookCallback = async (input, _toolUseID, _options) => {
    const startInput = input as SubagentStartHookInput;
    const persona = personaMap.get(startInput.agent_id);
    const agentName = persona?.name ?? startInput.agent_type ?? startInput.agent_id;

    broadcast({
      type: "subagent_started",
      executionId: startInput.agent_id as ExecutionId,
      parentExecutionId: parentExecutionId as ExecutionId,
      agentId: startInput.agent_id,
      agentName,
      timestamp: new Date().toISOString(),
    });

    return {};
  };

  const subagentStop: HookCallback = async (input, _toolUseID, _options) => {
    const stopInput = input as SubagentStopHookInput;
    const persona = personaMap.get(stopInput.agent_id);
    const agentName = persona?.name ?? stopInput.agent_type ?? stopInput.agent_id;

    broadcast({
      type: "subagent_completed",
      executionId: stopInput.agent_id as ExecutionId,
      parentExecutionId: parentExecutionId as ExecutionId,
      agentId: stopInput.agent_id,
      agentName,
      timestamp: new Date().toISOString(),
    });

    return {};
  };

  return { subagentStart, subagentStop };
}

// ── Router structured output schema ──────────────────────────────

const ROUTER_OUTPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    nextState: { type: "string" as const },
    reasoning: { type: "string" as const },
    confidence: { type: "string" as const, enum: ["high", "medium", "low"] },
  },
  required: ["nextState", "reasoning", "confidence"],
};

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
      // Build agent definitions for all personas — the primary persona runs
      // the execution, and all others are available as subagents via the Agent tool.
      const agentId = persona.id;
      const agents: Record<string, AgentDefinition> = {};

      for (const p of options.allPersonas) {
        const isPrimary = p.id === persona.id;
        agents[p.id] = {
          description: p.description,
          prompt: isPrimary ? buildSystemPrompt(persona, task, project) : (p.systemPrompt || p.description),
          tools: p.allowedTools.length > 0 ? p.allowedTools : [],
          model: resolveModel(p.model),
          maxTurns: isPrimary ? 30 : 15,
          ...(p.skills.length > 0 ? { skills: p.skills } : {}),
        };
      }

      // Ensure the primary persona is always present (even if allPersonas is empty)
      if (!agents[agentId]) {
        agents[agentId] = {
          description: persona.description,
          prompt: buildSystemPrompt(persona, task, project),
          tools: persona.allowedTools.length > 0 ? persona.allowedTools : [],
          model: resolveModel(options.model),
          maxTurns: 30,
          ...(persona.skills.length > 0 ? { skills: persona.skills } : {}),
        };
      }

      const auditHooks = buildAuditHooks(options.executionId);
      const sessionHooks = buildSessionHooks({
        executionId: options.executionId,
        personaName: persona.name,
        personaId: persona.id,
        model: resolveModel(options.model),
        workItemId: task.workItemId,
      });

      const subagentHooks = buildSubagentHooks(options.executionId, options.allPersonas);
      const isRouter = persona.settings?.isRouter === true;

      // Build effort and thinking config from persona settings
      const effort = persona.settings?.effort ?? "high";
      const thinkingMode = persona.settings?.thinking ?? "adaptive";
      const thinking = thinkingMode === "enabled"
        ? { type: "enabled" as const, budgetTokens: persona.settings?.thinkingBudgetTokens ?? 10000 }
        : { type: thinkingMode as "adaptive" | "disabled" };

      const q = query({
        prompt,
        options: {
          abortController,
          cwd: project.path,
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
          enableFileCheckpointing: true,
          includePartialMessages: true,
          agentProgressSummaries: true,
          maxBudgetUsd: options.maxBudget > 0 ? options.maxBudget : undefined,
          effort,
          thinking,
          agent: agentId,
          agents,
          ...(isRouter ? { outputFormat: { type: "json_schema" as const, schema: ROUTER_OUTPUT_SCHEMA } } : {}),
          hooks: {
            PreToolUse: [
              { matcher: "Bash", hooks: [buildSandboxHook(project.path)] },
              { hooks: [auditHooks.preToolUse] },
            ],
            PostToolUse: [{ hooks: [auditHooks.postToolUse] }],
            PostToolUseFailure: [{ hooks: [auditHooks.postToolUseFailure] }],
            SessionStart: [{ hooks: [sessionHooks.sessionStart] }],
            SessionEnd: [{ hooks: [sessionHooks.sessionEnd] }],
            FileChanged: [{ hooks: [buildFileChangedHook(options.executionId)] }],
            SubagentStart: [{ hooks: [subagentHooks.subagentStart] }],
            SubagentStop: [{ hooks: [subagentHooks.subagentStop] }],
          },
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
