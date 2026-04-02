import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import { db } from "../db/connection.js";
import { chatSessions, chatMessages, personas, projects } from "../db/schema.js";
import { createId } from "@agentops/shared";
import { getClaudeCodeExecutablePath } from "../config.js";
import type {
  ChatSessionId,
  ChatMessageId,
  ProjectId,
} from "@agentops/shared";
import { readFileSync } from "node:fs";
import { loadConfig } from "../config.js";
import { logger } from "../logger.js";

// Load Pico's project knowledge skill once at module level
const PICO_SKILL_PATH = new URL("../agent/pico-skill.md", import.meta.url).pathname;
let picoSkillContent = "";
try {
  picoSkillContent = readFileSync(PICO_SKILL_PATH, "utf-8");
} catch {
  // Skill file not available — Pico will work without it
}

function toIso(d: Date): string {
  return d.toISOString();
}

function serializeSession(row: typeof chatSessions.$inferSelect) {
  return {
    id: row.id as ChatSessionId,
    projectId: (row.projectId as ProjectId) ?? null,
    title: row.title,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function serializeMessage(row: typeof chatMessages.$inferSelect) {
  return {
    id: row.id as ChatMessageId,
    sessionId: row.sessionId as ChatSessionId,
    role: row.role as "user" | "assistant",
    content: row.content,
    metadata: row.metadata,
    createdAt: toIso(row.createdAt),
  };
}

export async function chatRoutes(app: FastifyInstance) {
  // POST /api/chat/sessions — create a new chat session
  app.post<{
    Body: { projectId?: string; personaId?: string };
  }>("/api/chat/sessions", async (request, reply) => {
    const { projectId, personaId } = request.body ?? {};

    // Validate project if provided
    if (projectId) {
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!project) {
        return reply.status(404).send({ error: `Project ${projectId} not found` });
      }
    }

    // Validate persona if provided
    if (personaId) {
      const [persona] = await db.select().from(personas).where(eq(personas.id, personaId));
      if (!persona) {
        return reply.status(404).send({ error: `Persona ${personaId} not found` });
      }
    }

    const now = new Date();
    const id = createId.chatSession() as string;

    await db.insert(chatSessions).values({
      id,
      projectId: projectId ?? null,
      title: "New chat",
      createdAt: now,
      updatedAt: now,
    });

    const [row] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id));

    return reply.status(201).send({ data: serializeSession(row!) });
  });

  // GET /api/chat/sessions?projectId= — list sessions (most recent first)
  app.get<{
    Querystring: { projectId?: string };
  }>("/api/chat/sessions", async (request) => {
    const { projectId } = request.query;

    let rows;
    if (projectId) {
      rows = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.projectId, projectId))
        .orderBy(desc(chatSessions.updatedAt));
    } else {
      rows = await db
        .select()
        .from(chatSessions)
        .orderBy(desc(chatSessions.updatedAt));
    }

    return { data: rows.map(serializeSession), total: rows.length };
  });

  // GET /api/chat/sessions/:id/messages — get message history
  app.get<{
    Params: { id: string };
  }>("/api/chat/sessions/:id/messages", async (request, reply) => {
    const { id } = request.params;

    // Verify session exists
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id));

    if (!session) {
      return reply.status(404).send({ error: "Session not found" });
    }

    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, id))
      .orderBy(chatMessages.createdAt);

    return { data: rows.map(serializeMessage), total: rows.length };
  });

  // PATCH /api/chat/sessions/:id — update session (title)
  app.patch<{
    Params: { id: string };
    Body: { title?: string };
  }>("/api/chat/sessions/:id", async (request, reply) => {
    const { id } = request.params;
    const { title } = request.body;

    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id));

    if (!session) {
      return reply.status(404).send({ error: "Session not found" });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title.trim().slice(0, 100);

    await db.update(chatSessions).set(updates).where(eq(chatSessions.id, id));

    const [updated] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id));

    return { data: serializeSession(updated!) };
  });

  // DELETE /api/chat/sessions/:id — delete session (cascades messages)
  app.delete<{
    Params: { id: string };
  }>("/api/chat/sessions/:id", async (request, reply) => {
    const { id } = request.params;

    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id));

    if (!session) {
      return reply.status(404).send({ error: "Session not found" });
    }

    // Delete messages first (cascade may not work in all SQLite configs)
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, id));
    await db.delete(chatSessions).where(eq(chatSessions.id, id));

    return { success: true };
  });

  // POST /api/chat/sessions/:id/messages — send a message and stream Pico's response via SSE
  app.post<{
    Params: { id: string };
    Body: { content: string; personaId?: string };
  }>("/api/chat/sessions/:id/messages", async (request, reply) => {
    const { id } = request.params;
    const { content, personaId: overridePersonaId } = request.body;

    if (!content?.trim()) {
      return reply.status(400).send({ error: "content is required" });
    }

    // Verify session exists and get projectId
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id));

    if (!session) {
      return reply.status(404).send({ error: "Session not found" });
    }

    // Check API key
    const config = loadConfig();
    if (!config.anthropicApiKey) {
      return reply
        .status(503)
        .send({ error: "Anthropic API key not configured" });
    }

    // Save the user message
    const userMsgId = createId.chatMessage() as string;
    const now = new Date();
    await db.insert(chatMessages).values({
      id: userMsgId,
      sessionId: id,
      role: "user",
      content: content.trim(),
      metadata: {},
      createdAt: now,
    });

    // Auto-generate session title from first user message
    const existingMessages = await db
      .select({ id: chatMessages.id })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, id));

    if (existingMessages.length === 1) {
      // This is the first message — update session title
      const title = content.trim().slice(0, 40) + (content.trim().length > 40 ? "..." : "");
      await db
        .update(chatSessions)
        .set({ title, updatedAt: now })
        .where(eq(chatSessions.id, id));
    } else {
      await db
        .update(chatSessions)
        .set({ updatedAt: now })
        .where(eq(chatSessions.id, id));
    }

    // Load chat persona (override or default Pico)
    let chatPersona;
    if (overridePersonaId) {
      const [persona] = await db.select().from(personas).where(eq(personas.id, overridePersonaId));
      if (!persona) {
        return reply.status(404).send({ error: `Persona ${overridePersonaId} not found` });
      }
      chatPersona = persona;
    } else {
      const allPersonas = await db.select().from(personas);
      chatPersona = allPersonas.find(
        (p) => (p.settings as Record<string, unknown>)?.isAssistant === true,
      );
    }

    if (!chatPersona) {
      return reply.status(503).send({ error: "Pico persona not found" });
    }

    const pico = chatPersona;

    // Load project for context (may be null for global sessions)
    const project = session.projectId
      ? (await db.select().from(projects).where(eq(projects.id, session.projectId)))[0]
      : undefined;

    // Load full conversation history
    const history = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, id))
      .orderBy(chatMessages.createdAt);

    // Build the conversation prompt from history
    const conversationLines = history.map(
      (msg) => `${msg.role === "user" ? "User" : "Pico"}: ${msg.content}`,
    );

    const prompt = conversationLines.join("\n\n");

    // Build Pico's system prompt with project context
    const systemSections: string[] = [];

    if (pico.systemPrompt) {
      systemSections.push(pico.systemPrompt);
    }

    // Inject project knowledge skill
    if (picoSkillContent) {
      systemSections.push(picoSkillContent);
    }

    if (project) {
      systemSections.push(
        [
          `## Project Context`,
          `Project: ${project.name}`,
          `Working directory: ${project.path}`,
          (project.settings as Record<string, unknown>)?.description
            ? `Description: ${(project.settings as Record<string, unknown>).description}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }

    systemSections.push(
      [
        `## Chat Instructions`,
        `You are Pico, the user's friendly project assistant. You are chatting in a conversational interface.`,
        ``,
        `**Personality:**`,
        `- Enthusiastic but not annoying. Warm and approachable.`,
        `- Technically accurate — back up your answers with real data from the project.`,
        `- Occasionally use dog puns and metaphors: "let me dig into that", "I'll fetch that for you", "sniffing through the codebase", "good boy status: all tests passing". Don't overdo it — once or twice per response at most.`,
        `- Keep responses concise. Use markdown formatting for code, lists, and emphasis.`,
        `- If you don't know something, say so honestly rather than guessing.`,
      ].join("\n"),
    );

    // Set SSE headers via Fastify so CORS plugin headers are preserved
    reply.header("Content-Type", "text/event-stream");
    reply.header("Cache-Control", "no-cache");
    reply.header("Connection", "keep-alive");
    reply.header("X-Accel-Buffering", "no");
    // Flush all accumulated headers (including CORS from @fastify/cors plugin)
    reply.raw.writeHead(200, reply.getHeaders() as Record<string, string>);

    const sendSSE = (data: Record<string, unknown>) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Set API key for SDK
    process.env["ANTHROPIC_API_KEY"] = config.anthropicApiKey;

    const MODEL_MAP: Record<string, string> = {
      opus: "claude-opus-4-6",
      sonnet: "claude-sonnet-4-6",
      haiku: "claude-haiku-4-5-20251001",
    };

    const assistantMsgId = createId.chatMessage() as string;
    let fullContent = "";
    const metadata: Record<string, unknown> = {
      thinkingBlocks: [] as string[],
      toolCalls: [] as Record<string, unknown>[],
    };

    try {
      const agentDef: AgentDefinition = {
        description: pico.description,
        prompt: systemSections.join("\n\n"),
        tools: (pico.allowedTools as string[]).length > 0 ? (pico.allowedTools as string[]) : [],
        model: MODEL_MAP[pico.model] ?? pico.model,
        maxTurns: 15,
      };

      const q = query({
        prompt,
        options: {
          pathToClaudeCodeExecutable: getClaudeCodeExecutablePath(),
          cwd: project?.path ?? process.cwd(),
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
          maxBudgetUsd: pico.maxBudgetPerRun > 0 ? pico.maxBudgetPerRun : undefined,
          promptSuggestions: true,
          agent: "pico",
          agents: { pico: agentDef },
          mcpServers: {
            agentops: {
              command: "node",
              args: [
                "--import",
                "tsx",
                new URL("../agent/mcp-server.ts", import.meta.url).pathname,
              ],
              env: {
                PERSONA_NAME: pico.name,
                PERSONA_ID: pico.id,
                ...(session.projectId ? { PROJECT_ID: session.projectId } : {}),
                ALLOWED_TOOLS: (pico.mcpTools as string[]).join(","),
              },
            },
          },
        },
      });

      for await (const msg of q) {
        if (msg.type === "assistant") {
          for (const block of msg.message.content) {
            if (block.type === "text") {
              fullContent += block.text;
              sendSSE({ type: "text", content: block.text });
            } else if (block.type === "thinking") {
              (metadata.thinkingBlocks as string[]).push(block.thinking);
              sendSSE({ type: "thinking", content: block.thinking });
            } else if (block.type === "tool_use") {
              const toolCall = {
                id: block.id,
                name: block.name,
                input: block.input,
              };
              (metadata.toolCalls as Record<string, unknown>[]).push(toolCall);
              sendSSE({
                type: "tool_use",
                content: JSON.stringify(toolCall),
              });
            }
          }
        } else if (msg.type === "user" && msg.tool_use_result != null) {
          sendSSE({
            type: "tool_result",
            content: JSON.stringify({
              output:
                typeof msg.tool_use_result === "string"
                  ? msg.tool_use_result
                  : JSON.stringify(msg.tool_use_result),
            }),
          });
        } else if (msg.type === "prompt_suggestion") {
          sendSSE({ type: "suggestion", content: msg.suggestion });
        } else if (msg.type === "result") {
          if (msg.subtype === "success") {
            metadata.costUsd = msg.total_cost_usd;
            metadata.durationMs = msg.duration_ms;
          }
        }
      }
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : String(err);
      logger.error({ err, sessionId: id }, "Pico chat error");
      sendSSE({ type: "error", content: errMsg });
    }

    // Save assistant message to DB
    if (fullContent) {
      await db.insert(chatMessages).values({
        id: assistantMsgId,
        sessionId: id,
        role: "assistant",
        content: fullContent,
        metadata,
        createdAt: new Date(),
      });
    }

    // Send done event with message ID
    sendSSE({ type: "done", messageId: assistantMsgId });
    reply.raw.end();
  });
}
