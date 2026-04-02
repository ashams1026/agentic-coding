import type { FastifyInstance } from "fastify";
import { sqlite } from "../db/connection.js";

// ── Types ────────────────────────────────────────────────────────

interface SearchResult {
  type: "work_item" | "persona" | "comment" | "chat_message";
  id: string;
  title: string;
  snippet: string;
  score: number;
  projectId: string | null;
}

// ── Routes ───────────────────────────────────────────────────────

export async function searchRoutes(app: FastifyInstance) {
  /**
   * GET /api/search — unified full-text search across all entities
   *
   * Query params:
   *   q: search query (required)
   *   type: filter by entity type (optional, comma-separated)
   *   projectId: filter by project (optional)
   *   limit: max results (optional, default 50)
   */
  app.get<{
    Querystring: { q?: string; type?: string; projectId?: string; limit?: string };
  }>("/api/search", async (request, reply) => {
    const { q, type, projectId, limit: limitStr } = request.query;

    if (!q || q.trim().length === 0) {
      return reply.status(400).send({ error: { code: "BAD_REQUEST", message: "Query parameter 'q' is required" } });
    }

    const query = q.trim();
    const limit = Math.min(parseInt(limitStr ?? "50", 10) || 50, 200);
    const typeFilter = type ? new Set(type.split(",").map((t) => t.trim())) : null;

    const results: SearchResult[] = [];

    // Search work items
    if (!typeFilter || typeFilter.has("work_item")) {
      const workItemRows = sqlite.prepare(`
        SELECT
          b.entity_id as id,
          snippet(work_items_fts, 0, '<b>', '</b>', '...', 32) as title_snippet,
          snippet(work_items_fts, 1, '<b>', '</b>', '...', 32) as desc_snippet,
          bm25(work_items_fts) as score,
          wi.project_id as projectId,
          wi.title as title,
          wi.archived_at,
          wi.deleted_at
        FROM work_items_fts
        JOIN fts_work_items_bridge b ON b.rowid = work_items_fts.rowid
        JOIN work_items wi ON wi.id = b.entity_id
        WHERE work_items_fts MATCH ?
          AND wi.deleted_at IS NULL
          AND wi.archived_at IS NULL
          ${projectId ? "AND wi.project_id = ?" : ""}
        ORDER BY score
        LIMIT ?
      `).all(...(projectId ? [query, projectId, limit] : [query, limit])) as Array<{
        id: string; title_snippet: string; desc_snippet: string; score: number;
        projectId: string | null; title: string;
      }>;

      for (const row of workItemRows) {
        results.push({
          type: "work_item",
          id: row.id,
          title: row.title,
          snippet: row.desc_snippet || row.title_snippet,
          score: Math.abs(row.score),
          projectId: row.projectId,
        });
      }
    }

    // Search personas
    if (!typeFilter || typeFilter.has("persona")) {
      const personaRows = sqlite.prepare(`
        SELECT
          b.entity_id as id,
          snippet(personas_fts, 0, '<b>', '</b>', '...', 32) as name_snippet,
          snippet(personas_fts, 1, '<b>', '</b>', '...', 32) as prompt_snippet,
          bm25(personas_fts) as score,
          p.name as title
        FROM personas_fts
        JOIN fts_personas_bridge b ON b.rowid = personas_fts.rowid
        JOIN personas p ON p.id = b.entity_id
        WHERE personas_fts MATCH ?
        ORDER BY score
        LIMIT ?
      `).all(query, limit) as Array<{
        id: string; name_snippet: string; prompt_snippet: string; score: number; title: string;
      }>;

      for (const row of personaRows) {
        results.push({
          type: "persona",
          id: row.id,
          title: row.title,
          snippet: row.prompt_snippet || row.name_snippet,
          score: Math.abs(row.score),
          projectId: null,
        });
      }
    }

    // Search comments
    if (!typeFilter || typeFilter.has("comment")) {
      const commentRows = sqlite.prepare(`
        SELECT
          b.entity_id as id,
          snippet(comments_fts, 0, '<b>', '</b>', '...', 32) as body_snippet,
          bm25(comments_fts) as score,
          c.work_item_id as workItemId,
          wi.project_id as projectId,
          wi.deleted_at
        FROM comments_fts
        JOIN fts_comments_bridge b ON b.rowid = comments_fts.rowid
        JOIN comments c ON c.id = b.entity_id
        JOIN work_items wi ON wi.id = c.work_item_id
        WHERE comments_fts MATCH ?
          AND wi.deleted_at IS NULL
          ${projectId ? "AND wi.project_id = ?" : ""}
        ORDER BY score
        LIMIT ?
      `).all(...(projectId ? [query, projectId, limit] : [query, limit])) as Array<{
        id: string; body_snippet: string; score: number; workItemId: string; projectId: string | null;
      }>;

      for (const row of commentRows) {
        results.push({
          type: "comment",
          id: row.id,
          title: `Comment on ${row.workItemId}`,
          snippet: row.body_snippet,
          score: Math.abs(row.score),
          projectId: row.projectId,
        });
      }
    }

    // Search chat messages
    if (!typeFilter || typeFilter.has("chat_message")) {
      const messageRows = sqlite.prepare(`
        SELECT
          b.entity_id as id,
          snippet(chat_messages_fts, 0, '<b>', '</b>', '...', 32) as content_snippet,
          bm25(chat_messages_fts) as score,
          cs.project_id as projectId
        FROM chat_messages_fts
        JOIN fts_chat_messages_bridge b ON b.rowid = chat_messages_fts.rowid
        JOIN chat_messages m ON m.id = b.entity_id
        JOIN chat_sessions cs ON cs.id = m.session_id
        WHERE chat_messages_fts MATCH ?
          ${projectId ? "AND cs.project_id = ?" : ""}
        ORDER BY score
        LIMIT ?
      `).all(...(projectId ? [query, projectId, limit] : [query, limit])) as Array<{
        id: string; content_snippet: string; score: number; projectId: string | null;
      }>;

      for (const row of messageRows) {
        results.push({
          type: "chat_message",
          id: row.id,
          title: "Chat message",
          snippet: row.content_snippet,
          score: Math.abs(row.score),
          projectId: row.projectId,
        });
      }
    }

    // Sort all results by score (lower BM25 = better match)
    results.sort((a, b) => a.score - b.score);

    return { data: results.slice(0, limit), total: results.length };
  });
}
