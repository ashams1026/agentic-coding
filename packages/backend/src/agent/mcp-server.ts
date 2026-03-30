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
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db/connection.js";
import { comments, workItems, workItemEdges, projectMemories } from "../db/schema.js";
import { createId, WORKFLOW, isValidTransition } from "@agentops/shared";
import type { CommentId, WorkItemId, PersonaId } from "@agentops/shared";
import { broadcast } from "../ws.js";

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

// ── Factory ─────────────────────────────────────────────────────

export function createMcpServer(context: McpContext): McpServer {
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
    async ({ workItemId, content, metadata }) => {
      try {
        const id = createId.comment();
        const now = new Date();

        await db.insert(comments).values({
          id,
          workItemId,
          authorType: "agent",
          authorId: context.personaId || null,
          authorName: context.personaName,
          content,
          metadata: metadata ?? {},
          createdAt: now,
        });

        broadcast({
          type: "comment_created",
          commentId: id as CommentId,
          workItemId: workItemId as WorkItemId,
          authorName: context.personaName,
          contentPreview: content.slice(0, 100),
          timestamp: now.toISOString(),
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                id,
                workItemId,
                authorName: context.personaName,
                createdAt: now.toISOString(),
              }),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: `Failed to post comment: ${err instanceof Error ? err.message : String(err)}`,
              }),
            },
          ],
          isError: true,
        };
      }
    },
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
    async ({ parentId, children }) => {
      try {
        // Look up parent to get projectId
        const [parent] = await db
          .select({ projectId: workItems.projectId })
          .from(workItems)
          .where(eq(workItems.id, parentId));

        if (!parent) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: `Parent work item ${parentId} not found` }) }],
            isError: true,
          };
        }

        const now = new Date();
        const createdIds: string[] = [];

        // Create each child work item
        for (const child of children) {
          const id = createId.workItem();
          createdIds.push(id);

          await db.insert(workItems).values({
            id,
            parentId,
            projectId: parent.projectId,
            title: child.title,
            description: child.description ?? "",
            context: {},
            currentState: WORKFLOW.initialState,
            priority: "p2",
            labels: [],
            assignedPersonaId: null,
            executionContext: [],
            createdAt: now,
            updatedAt: now,
          });

          broadcast({
            type: "state_change",
            workItemId: id as WorkItemId,
            fromState: "",
            toState: WORKFLOW.initialState,
            triggeredBy: (context.personaId as PersonaId) || "system",
            timestamp: now.toISOString(),
          });
        }

        // Create work_item_edges for dependsOn references
        for (let i = 0; i < children.length; i++) {
          const deps = children[i]!.dependsOn;
          if (!deps || deps.length === 0) continue;

          for (const dep of deps) {
            // dep can be an index (e.g., "0", "1") referring to a sibling in this batch, or an existing ID
            const fromId = /^\d+$/.test(dep) ? createdIds[parseInt(dep, 10)] : dep;
            if (!fromId) continue;

            const edgeId = createId.workItemEdge();
            await db.insert(workItemEdges).values({
              id: edgeId,
              fromId,
              toId: createdIds[i]!,
              type: "depends_on",
            });
          }
        }

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ createdIds, parentId }) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: `Failed to create children: ${err instanceof Error ? err.message : String(err)}` }) }],
          isError: true,
        };
      }
    },
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
    async ({ workItemId, targetState, reasoning }) => {
      try {
        // Look up current state
        const [item] = await db
          .select({ currentState: workItems.currentState })
          .from(workItems)
          .where(eq(workItems.id, workItemId));

        if (!item) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: `Work item ${workItemId} not found` }) }],
            isError: true,
          };
        }

        // Validate transition
        if (!isValidTransition(item.currentState, targetState)) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: `Invalid transition from "${item.currentState}" to "${targetState}"` }) }],
            isError: true,
          };
        }

        const now = new Date();
        const fromState = item.currentState;

        // Update work item state
        await db
          .update(workItems)
          .set({ currentState: targetState, updatedAt: now })
          .where(eq(workItems.id, workItemId));

        // Post reasoning as a system comment
        const commentId = createId.comment();
        await db.insert(comments).values({
          id: commentId,
          workItemId,
          authorType: "system",
          authorId: context.personaId || null,
          authorName: "Router",
          content: `State transition: ${fromState} → ${targetState}\n\n${reasoning}`,
          metadata: { fromState, toState: targetState, reasoning },
          createdAt: now,
        });

        // Broadcast state_change event
        broadcast({
          type: "state_change",
          workItemId: workItemId as WorkItemId,
          fromState,
          toState: targetState,
          triggeredBy: (context.personaId as PersonaId) || "system",
          timestamp: now.toISOString(),
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ workItemId, fromState, toState: targetState }) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: `Failed to route: ${err instanceof Error ? err.message : String(err)}` }) }],
          isError: true,
        };
      }
    },
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
    async ({ parentId, state, verbosity }) => {
      try {
        const conditions = [eq(workItems.projectId, context.projectId)];
        if (parentId) conditions.push(eq(workItems.parentId, parentId));
        if (state) conditions.push(eq(workItems.currentState, state));

        const rows = await db
          .select()
          .from(workItems)
          .where(conditions.length === 1 ? conditions[0]! : and(...conditions));

        const items = rows.map((row) =>
          verbosity === "detail"
            ? { id: row.id, title: row.title, state: row.currentState, description: row.description, context: row.context, priority: row.priority, labels: row.labels, parentId: row.parentId }
            : { id: row.id, title: row.title, state: row.currentState },
        );

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ items, total: items.length }) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: `Failed to list items: ${err instanceof Error ? err.message : String(err)}` }) }],
          isError: true,
        };
      }
    },
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
    async ({ workItemId, includeMemory }) => {
      try {
        const [item] = await db
          .select({
            id: workItems.id,
            title: workItems.title,
            description: workItems.description,
            currentState: workItems.currentState,
            executionContext: workItems.executionContext,
            context: workItems.context,
            parentId: workItems.parentId,
            projectId: workItems.projectId,
          })
          .from(workItems)
          .where(eq(workItems.id, workItemId));

        if (!item) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: `Work item ${workItemId} not found` }) }],
            isError: true,
          };
        }

        const result: Record<string, unknown> = {
          workItem: item,
          executionContext: item.executionContext,
        };

        if (includeMemory) {
          const memories = await db
            .select({ summary: projectMemories.summary, createdAt: projectMemories.createdAt })
            .from(projectMemories)
            .where(and(
              eq(projectMemories.projectId, item.projectId),
              isNull(projectMemories.consolidatedInto),
            ))
            .limit(10);

          result.memories = memories.map((m) => ({
            summary: m.summary,
            createdAt: m.createdAt.toISOString(),
          }));
        }

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: `Failed to get context: ${err instanceof Error ? err.message : String(err)}` }) }],
          isError: true,
        };
      }
    },
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
    async ({ workItemId, reason }) => {
      try {
        // Get current state for the broadcast
        const [item] = await db
          .select({ currentState: workItems.currentState })
          .from(workItems)
          .where(eq(workItems.id, workItemId));

        if (!item) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: `Work item ${workItemId} not found` }) }],
            isError: true,
          };
        }

        const now = new Date();
        const fromState = item.currentState;

        // Update state to Blocked
        await db
          .update(workItems)
          .set({ currentState: "Blocked", updatedAt: now })
          .where(eq(workItems.id, workItemId));

        // Post reason as system comment
        const commentId = createId.comment();
        await db.insert(comments).values({
          id: commentId,
          workItemId,
          authorType: "system",
          authorId: context.personaId || null,
          authorName: context.personaName,
          content: `Blocked: ${reason}`,
          metadata: { reason, previousState: fromState },
          createdAt: now,
        });

        // Broadcast state change
        broadcast({
          type: "state_change",
          workItemId: workItemId as WorkItemId,
          fromState,
          toState: "Blocked",
          triggeredBy: (context.personaId as PersonaId) || "system",
          timestamp: now.toISOString(),
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ workItemId, fromState, toState: "Blocked" }) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: `Failed to flag blocked: ${err instanceof Error ? err.message : String(err)}` }) }],
          isError: true,
        };
      }
    },
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
    async ({ workItemId, message }) => {
      try {
        const now = new Date();
        const commentId = createId.comment();

        await db.insert(comments).values({
          id: commentId,
          workItemId,
          authorType: "system",
          authorId: context.personaId || null,
          authorName: context.personaName,
          content: `🔍 Review requested: ${message}`,
          metadata: { type: "review_request", message },
          createdAt: now,
        });

        broadcast({
          type: "comment_created",
          commentId: commentId as CommentId,
          workItemId: workItemId as WorkItemId,
          authorName: context.personaName,
          contentPreview: `Review requested: ${message.slice(0, 80)}`,
          timestamp: now.toISOString(),
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ workItemId, commentId, message: "Review requested" }) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: `Failed to request review: ${err instanceof Error ? err.message : String(err)}` }) }],
          isError: true,
        };
      }
    },
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
