/**
 * AgentOps MCP Server — provides tools for AI agent personas.
 *
 * Tools registered here are made available to agents via the Claude Agent SDK.
 * Each tool interacts with the database and broadcasts WS events.
 *
 * Usage:
 *   Programmatic: const server = createMcpServer(context);
 *   Standalone:   tsx packages/backend/src/agent/mcp-server.ts (stdio transport)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// ── Context passed to the MCP server ────────────────────────────

export interface McpContext {
  /** Persona name (used as comment author) */
  personaName: string;
  /** Persona ID */
  personaId: string;
  /** Project ID */
  projectId: string;
  /** Allowed tool names for this persona (empty = all tools) */
  allowedTools: string[];
}

// ── Tool names ──────────────────────────────────────────────────

export const TOOL_NAMES = [
  "post_comment",
  "create_children",
  "route_to_state",
  "list_items",
  "get_context",
  "flag_blocked",
  "request_review",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

// ── Stub result helper ──────────────────────────────────────────

function stub(toolName: string): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: `${toolName} not yet implemented` }),
      },
    ],
    isError: true,
  };
}

// ── Factory ─────────────────────────────────────────────────────

export function createMcpServer(_context: McpContext): McpServer {
  const server = new McpServer(
    { name: "agentops", version: "1.0.0" },
    { capabilities: { logging: {} } },
  );

  // ── post_comment ────────────────────────────────────────────
  server.registerTool(
    "post_comment",
    {
      description:
        "Post a comment to a work item's comment stream. Use this to communicate progress, decisions, or questions.",
      inputSchema: z.object({
        workItemId: z.string().describe("The work item ID to comment on"),
        content: z.string().describe("Comment text content"),
        metadata: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Optional metadata object"),
      }),
    },
    async () => stub("post_comment"),
  );

  // ── create_children ─────────────────────────────────────────
  server.registerTool(
    "create_children",
    {
      description:
        "Create child work items under a parent. Use this to decompose a work item into smaller tasks.",
      inputSchema: z.object({
        parentId: z.string().describe("Parent work item ID"),
        children: z
          .array(
            z.object({
              title: z.string().describe("Child work item title"),
              description: z
                .string()
                .optional()
                .describe("Child work item description"),
              dependsOn: z
                .array(z.string())
                .optional()
                .describe(
                  "IDs of sibling work items this child depends on (created in this batch by index reference or existing IDs)",
                ),
            }),
          )
          .describe("Array of children to create"),
      }),
    },
    async () => stub("create_children"),
  );

  // ── route_to_state ──────────────────────────────────────────
  server.registerTool(
    "route_to_state",
    {
      description:
        "Route a work item to a new workflow state. Only available to the Router agent. The target state must be a valid transition from the current state.",
      inputSchema: z.object({
        workItemId: z.string().describe("The work item ID to transition"),
        targetState: z
          .string()
          .describe(
            "Target workflow state (must be valid transition from current state)",
          ),
        reasoning: z
          .string()
          .describe(
            "Explanation for why this state transition was chosen",
          ),
      }),
    },
    async () => stub("route_to_state"),
  );

  // ── list_items ──────────────────────────────────────────────
  server.registerTool(
    "list_items",
    {
      description:
        "Query work items with optional filters. Use 'summary' verbosity for overviews, 'detail' for full context.",
      inputSchema: z.object({
        parentId: z
          .string()
          .optional()
          .describe("Filter by parent work item ID"),
        state: z
          .string()
          .optional()
          .describe("Filter by workflow state name"),
        verbosity: z
          .enum(["summary", "detail"])
          .default("summary")
          .describe(
            "summary: id+title+state only. detail: includes description and context.",
          ),
      }),
    },
    async () => stub("list_items"),
  );

  // ── get_context ─────────────────────────────────────────────
  server.registerTool(
    "get_context",
    {
      description:
        "Retrieve execution history and optional project memories for a work item. Use this to understand what has been done before.",
      inputSchema: z.object({
        workItemId: z.string().describe("The work item ID"),
        includeMemory: z
          .boolean()
          .default(false)
          .describe("Whether to include project-level memories"),
      }),
    },
    async () => stub("get_context"),
  );

  // ── flag_blocked ────────────────────────────────────────────
  server.registerTool(
    "flag_blocked",
    {
      description:
        "Mark a work item as Blocked with a reason. Posts a system comment explaining the blocker.",
      inputSchema: z.object({
        workItemId: z.string().describe("The work item ID to block"),
        reason: z.string().describe("Why this work item is blocked"),
      }),
    },
    async () => stub("flag_blocked"),
  );

  // ── request_review ──────────────────────────────────────────
  server.registerTool(
    "request_review",
    {
      description:
        "Request human attention on a work item. Posts a system comment flagging it for review.",
      inputSchema: z.object({
        workItemId: z.string().describe("The work item ID"),
        message: z
          .string()
          .describe("What the human should review or decide"),
      }),
    },
    async () => stub("request_review"),
  );

  return server;
}

// ── Standalone stdio entry point ────────────────────────────────

const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));

if (isMainModule) {
  const { StdioServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/stdio.js"
  );

  const context: McpContext = {
    personaName: process.env.PERSONA_NAME ?? "Agent",
    personaId: process.env.PERSONA_ID ?? "",
    projectId: process.env.PROJECT_ID ?? "",
    allowedTools: process.env.ALLOWED_TOOLS
      ? process.env.ALLOWED_TOOLS.split(",")
      : [],
  };

  const server = createMcpServer(context);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
