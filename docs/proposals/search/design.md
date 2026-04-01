# Search Infrastructure and UX Design

> Research proposal for full-text search across all entities in Woof.

---

## 1. What's Searchable

### Current State Audit

The app has **zero server-side search**. All filtering is client-side:

| Surface | Mechanism | Scope |
|---------|-----------|-------|
| Command Palette (`command-palette.tsx`) | `label.toLowerCase().includes(q)` on 3 categories: nav items, work items (title only), quick actions | Current project's work items, loaded via `useWorkItems()` |
| Work Items filter bar (`filter-bar.tsx`) | `searchQuery` in Zustand store, debounced 300ms, `title.toLowerCase().includes(q)` + description match | Current project, client-side only |
| No backend search endpoints | N/A — all route files return full result sets, no `?q=` parameter | N/A |

### Searchable Entities (Priority-Ordered)

| Priority | Entity | Table | Key Text Fields | Typical Volume |
|----------|--------|-------|-----------------|----------------|
| **P0** | Work Items | `work_items` | `title`, `description` | 100s per project |
| **P0** | Personas | `personas` | `name`, `description`, `systemPrompt` | 5-20 total |
| **P1** | Comments | `comments` | `content`, `authorName` | 10s per work item |
| **P1** | Chat Messages | `chat_messages` | `content` | 100s per session |
| **P2** | Executions | `executions` | `summary`, `logs` | 1000s over time |
| **P2** | Project Memories | `project_memories` | `summary`, `keyDecisions` (JSON array) | 10s per project |
| **P3** | Proposals | `proposals` | `payload` (JSON — contains description/diff) | 10s per work item |
| **P3** | Activity Events | (in-memory/WS) | Event descriptions | Ephemeral — not in DB |

**P0 entities** should be searchable from day one. They're already loaded client-side in Command Palette and filter bar — the question is whether to keep them client-side or move to server.

**Execution logs** (P2) are the most challenging: the `logs` column stores full terminal output that can be 100KB+ per execution. Full-text indexing these is high-value but storage-intensive.

---

## 2. Search UX

### Where Search Lives

Three access points, unified by a shared search API:

#### 2a. Command Palette (Enhanced — P0)

The existing Cmd+K palette (`command-palette.tsx`, 287 lines) already searches work items client-side. Enhancement:

- **Add entity categories:** Navigation, Work Items, Personas, Chat Messages, Recent Executions, Quick Actions
- **Server-side search:** Replace `allItems.filter(...)` with a `GET /api/search?q=...&limit=8` call (debounced 200ms)
- **Result format:** Icon + entity type badge + title/snippet + keyboard shortcut hint
- **Behavior:** First keystroke filters local nav/actions immediately; after 2+ chars, fires server search for entities
- **Preserved:** Arrow key nav, Enter to select, Esc to close, category grouping

```
┌─────────────────────────────────────────┐
│ 🔍 [search query here...]          ESC │
├─────────────────────────────────────────┤
│ NAVIGATION                              │
│   📊 Dashboard                          │
│   📋 Work Items                         │
│                                         │
│ WORK ITEMS                              │
│ ▸ 📄 Implement OAuth2 login       wi-   │
│   📄 Add rate limiting to API      wi-   │
│                                         │
│ PERSONAS                                │
│   🤖 Engineer — Full-stack...      ps-   │
│                                         │
│ CHAT                                    │
│   💬 "...OAuth flow needs..."     cm-   │
├─────────────────────────────────────────┤
│ ↑↓ navigate   ↵ select   esc close     │
└─────────────────────────────────────────┘
```

#### 2b. Work Items Filter Bar (Enhanced — P0)

The existing filter bar (`filter-bar.tsx`) already has a search input. Enhancement:

- **Server-side search:** When query length >= 2, replace client-side `includes()` with `GET /api/work-items?q=...&projectId=...`
- **Highlight matches:** The existing `HighlightedText` component (`list-view.tsx:232`) already highlights; extend to description snippets
- **Search scope:** Searches title + description (currently title only in some paths)

#### 2c. Dedicated Search Page (P1 — Phase 2)

A `/search` page for deep, filtered search across all entities:

- **Route:** `/search?q=...&type=...&project=...&from=...&to=...`
- **Sidebar nav:** Add "Search" item with magnifying glass icon between Activity Feed and Persona Manager
- **Layout:** Search bar at top, filter sidebar (entity type checkboxes, project selector, date range), results grouped by entity type
- **Result cards:** Entity-specific rendering — work item card shows status/priority, execution card shows persona/outcome/cost, chat message shows session context
- **Pagination:** Load 20 results per entity type, "Show more" button per group

### How Results Are Displayed

Each result includes:
- **Entity type badge** (colored: blue for work items, purple for personas, green for chat, orange for executions)
- **Title or primary text** (bold, truncated to 1 line)
- **Match snippet** (2-3 lines of context around the match, with query terms highlighted)
- **Metadata line** (project name, date, status/state as applicable)
- **Click action** (navigate to entity detail: `/items` with selection, `/personas` with selection, `/agents` for execution, `/chat?session=id` for chat)

---

## 3. Search Implementation

### Option Comparison

| Criteria | SQLite FTS5 | Fuse.js / MiniSearch | Meilisearch / Typesense |
|----------|-------------|----------------------|-------------------------|
| **Dependencies** | Zero — built into better-sqlite3 | npm package (~10KB) | External service (Docker/binary) |
| **Setup complexity** | Medium — virtual tables, triggers | Low — import and configure | High — separate process, sync pipeline |
| **Local-first fit** | Excellent — same DB file | Good — in-memory at startup | Poor — extra service to manage |
| **Ranking quality** | Good — BM25 built-in, custom ranking | Good — fuzzy + weighted fields | Excellent — typo tolerance, facets, relevance tuning |
| **Fuzzy matching** | Limited — prefix matching only, no typo tolerance | Good — configurable threshold | Excellent — built-in typo tolerance |
| **Performance at 100K rows** | Excellent — designed for this | Degraded — in-memory limits | Excellent — optimized engine |
| **Incremental indexing** | Automatic via triggers | Manual — rebuild on change | Automatic via sync |
| **Storage overhead** | ~30-50% of indexed text size | In-memory only | Separate data directory |
| **Query features** | Boolean operators, phrase matching, column weights, prefix search | Weighted fields, fuzzy threshold | Filters, facets, geo, sort, stop words |

### Recommendation: SQLite FTS5 (Phase 1) + Fuse.js Fallback for Tiny Datasets

**Primary: FTS5** for all server-side search. Rationale:
1. **Zero external dependencies** — critical for a local-first app. Users install Woof and it works; no "also install Meilisearch" step.
2. **better-sqlite3 ships with FTS5 enabled** by default (compiled with `-DSQLITE_ENABLE_FTS5`). No build flag needed.
3. **Transactional consistency** — search index updates atomically with the data write. No sync lag.
4. **BM25 ranking** — built-in relevance scoring is sufficient for the entity volumes we're dealing with.
5. **Performance** — FTS5 can handle millions of rows; our projected volumes (100K executions, 10K work items) are well within range.

**Fallback: Fuse.js** only for the Command Palette's local categories (navigation items, quick actions) which are small static lists. These don't need a server roundtrip.

**Deferred: Meilisearch/Typesense** — if users report that FTS5's lack of typo tolerance is a pain point, or if we add a hosted/multi-tenant deployment model, we can add an optional Meilisearch adapter behind the same search API. The API contract is designed to be engine-agnostic.

### FTS5 Implementation Design

#### Virtual Tables

Create one FTS5 virtual table per searchable entity group:

```sql
-- Work Items search index
CREATE VIRTUAL TABLE work_items_fts USING fts5(
  title,
  description,
  content='work_items',
  content_rowid='rowid',
  tokenize='porter unicode61'
);

-- Personas search index
CREATE VIRTUAL TABLE personas_fts USING fts5(
  name,
  description,
  system_prompt,
  content='personas',
  content_rowid='rowid',
  tokenize='porter unicode61'
);

-- Comments search index
CREATE VIRTUAL TABLE comments_fts USING fts5(
  content,
  author_name,
  content='comments',
  content_rowid='rowid',
  tokenize='porter unicode61'
);

-- Chat messages search index
CREATE VIRTUAL TABLE chat_messages_fts USING fts5(
  content,
  content='chat_messages',
  content_rowid='rowid',
  tokenize='porter unicode61'
);

-- Executions search index (summary only — logs deferred to Phase 2)
CREATE VIRTUAL TABLE executions_fts USING fts5(
  summary,
  content='executions',
  content_rowid='rowid',
  tokenize='porter unicode61'
);
```

**Tokenizer:** `porter unicode61` — Porter stemming (English: "running" matches "run") + Unicode normalization (handles accented characters). Good default for code-adjacent text.

**Content sync:** FTS5 `content=` tables are "contentless external content" — they don't duplicate data, they reference the original table's rowid. Sync via triggers:

```sql
-- Auto-sync triggers for work_items_fts
CREATE TRIGGER work_items_ai AFTER INSERT ON work_items BEGIN
  INSERT INTO work_items_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
END;

CREATE TRIGGER work_items_ad AFTER DELETE ON work_items BEGIN
  INSERT INTO work_items_fts(work_items_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
END;

CREATE TRIGGER work_items_au AFTER UPDATE ON work_items BEGIN
  INSERT INTO work_items_fts(work_items_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
  INSERT INTO work_items_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
END;
```

Repeat for each FTS table. Total: 15 triggers (5 entities x 3 operations).

**Note on rowid:** SQLite FTS5 requires integer rowid. Woof uses text IDs (`wi-x7k2m`). Solution: FTS5 content tables use SQLite's implicit rowid (auto-assigned integer). The search query joins FTS results back to the source table via rowid to get the text ID.

**Drizzle integration:** Drizzle ORM doesn't have native FTS5 support. Use `db.run(sql\`...\`)` for creating virtual tables and triggers in a migration, and `db.all(sql\`...\`)` for search queries. This is the standard approach — FTS5 is DDL that runs alongside the ORM.

#### Query API

```sql
-- Search work items with BM25 ranking
SELECT w.id, w.title, w.description, w.current_state, w.priority,
       snippet(work_items_fts, 1, '<mark>', '</mark>', '...', 32) as snippet,
       bm25(work_items_fts, 5.0, 1.0) as rank
FROM work_items_fts
JOIN work_items w ON w.rowid = work_items_fts.rowid
WHERE work_items_fts MATCH ?
  AND w.project_id = ?
ORDER BY rank
LIMIT 20;
```

**Column weights:** `bm25(table, w1, w2, ...)` — title matches weighted 5x higher than description matches. Persona name weighted 5x higher than system prompt.

**Snippet generation:** FTS5's built-in `snippet()` function extracts context around matches with configurable `<mark>` tags. No application-level snippet extraction needed.

**Prefix matching:** FTS5 supports `query*` syntax for prefix search (typing "auth" matches "authentication", "authorize"). Enable by appending `*` to the last query term.

---

## 4. Indexing Strategy

### Write-Time Indexing

FTS5 triggers fire on every INSERT/UPDATE/DELETE, so the index is always current. No background indexing job needed.

**Performance impact:** FTS5 trigger overhead is ~5-10% per write operation. For Woof's write volume (a few writes per second during active agent execution), this is negligible.

### Initial Index Build

For existing databases (upgrade path), run a one-time rebuild:

```sql
INSERT INTO work_items_fts(work_items_fts) VALUES('rebuild');
```

This scans the content table and rebuilds the FTS index. For 10K work items, takes ~100ms. Run as a post-migration step.

### Streaming Data

New executions and chat messages stream in via SDK events. The existing write paths (`INSERT INTO executions/chat_messages`) will automatically fire FTS triggers. No additional code needed beyond creating the triggers.

**Execution logs (Phase 2):** The `logs` column can be very large (100KB+). Options:
1. **Index summary only** (Phase 1) — the `summary` column is a concise 1-2 sentence description. Good enough for most searches.
2. **Index logs with chunk splitting** (Phase 2) — split logs into 4KB chunks, index each chunk as a separate FTS row with a foreign key back to the execution. This prevents a single long document from dominating BM25 ranking.
3. **Deferred indexing** (Phase 2) — index logs in a background task after execution completes, not in the hot path.

---

## 5. Filtering and Facets

### Scope

Search is **project-scoped by default** — the current project from the sidebar selector. This matches the existing UX pattern (work items, executions, chat are all project-scoped).

**Global search:** An optional toggle/checkbox: "Search all projects." When enabled, results include a project badge on each result. Command Palette defaults to global (matches current behavior where nav items are project-independent).

### Filters

Available alongside the search query (in the dedicated search page and as URL params):

| Filter | Values | Implementation |
|--------|--------|---------------|
| Entity type | work-items, personas, comments, chat, executions | Separate FTS queries per type, merge results |
| Project | Current project / All / Specific project ID | `WHERE w.project_id = ?` join condition |
| Date range | From/to timestamps | `WHERE w.created_at BETWEEN ? AND ?` join condition |
| Status (work items) | Workflow states: Backlog, InProgress, Done, etc. | `WHERE w.current_state = ?` join condition |
| Priority (work items) | p0, p1, p2, p3 | `WHERE w.priority = ?` join condition |
| Author (comments/chat) | Persona ID or "user" | `WHERE c.author_id = ?` join condition |

### Faceted Counts

For the dedicated search page, show result counts per entity type as badges:

```
Work Items (12)  Personas (2)  Comments (8)  Chat (34)  Executions (5)
```

Implementation: Run a `COUNT(*)` variant of each FTS query. These are fast (~1ms each on FTS5) because they don't need snippet extraction or joins.

---

## 6. Performance

### Expected Data Volumes

| Entity | Per Project (1 year) | Total (5 projects) | FTS Index Size |
|--------|---------------------|---------------------|---------------|
| Work Items | ~500 | ~2,500 | ~500 KB |
| Personas | ~15 | ~15 (shared) | ~50 KB |
| Comments | ~2,000 | ~10,000 | ~2 MB |
| Chat Messages | ~5,000 | ~25,000 | ~5 MB |
| Executions (summary) | ~3,000 | ~15,000 | ~3 MB |
| **Total** | | ~52,500 rows | **~10.5 MB** |

FTS5 index overhead is modest — ~10 MB for a year of moderate usage. Even at 10x this volume, SQLite FTS5 handles it comfortably.

### Response Time Targets

| Operation | Target | Expected |
|-----------|--------|----------|
| Command Palette search | < 50ms | ~5-10ms (FTS5 on <100K rows) |
| Work Items filter | < 100ms | ~5-20ms |
| Dedicated search page (all types) | < 200ms | ~20-50ms (5 parallel FTS queries) |
| Faceted counts | < 50ms | ~5ms per type |

FTS5 on better-sqlite3 (synchronous, in-process) avoids network overhead. These targets are easily achievable.

### Pagination

- **Command Palette:** Fixed limit of 5 results per entity type (no pagination — it's a quick-jump UI)
- **Work Items filter:** Client-side pagination of server results (load 100, paginate in UI). For large result sets, add `OFFSET/LIMIT` to the FTS query
- **Dedicated search page:** 20 results per entity type, "Load more" button sends `offset` parameter

---

## 7. API Design

### Unified Search Endpoint

```
GET /api/search?q=<query>&types=work-items,personas,comments&projectId=<id>&limit=20&offset=0
```

**Response:**

```typescript
interface SearchResponse {
  query: string;
  totalByType: Record<string, number>; // faceted counts
  results: SearchResult[];
}

interface SearchResult {
  entityType: "work-item" | "persona" | "comment" | "chat-message" | "execution";
  entityId: string; // e.g., "wi-x7k2m"
  title: string; // primary text (title for work items, name for personas, first line for comments)
  snippet: string; // match context with <mark> tags
  metadata: Record<string, unknown>; // entity-specific: status, priority, personaName, etc.
  score: number; // BM25 relevance score
  createdAt: string; // ISO timestamp
}
```

### Entity-Specific Search (Optional)

For the work items filter bar, a simpler scoped endpoint:

```
GET /api/work-items?q=<query>&projectId=<id>&state=<state>&priority=<priority>&limit=100
```

This extends the existing `GET /api/work-items` endpoint (currently in `routes/work-items.ts`) with an optional `q` parameter. When present, uses FTS5 instead of returning all items.

---

## 8. Implementation Approach

### Phase 1: FTS5 + Command Palette + Work Items Filter (3-4 tasks)

1. **Migration:** Create 5 FTS5 virtual tables + 15 triggers + initial rebuild
2. **Backend:** Add `GET /api/search` endpoint with FTS5 queries
3. **Command Palette:** Wire to `/api/search` with debounced fetch, keep local nav/actions as Fuse.js
4. **Work Items:** Add `q` parameter to existing `GET /api/work-items` route, wire filter bar

### Phase 2: Dedicated Search Page + Execution Logs (3-4 tasks)

5. **Search page:** New `/search` route with filter sidebar, entity-type tabs, paginated results
6. **Execution log indexing:** Chunk-based FTS for the `logs` column
7. **URL state:** Search query and filters persisted in URL params for sharing/bookmarking

### Phase 3: Enhancements (2-3 tasks)

8. **Search suggestions:** "Recent searches" dropdown, popular queries
9. **Keyboard shortcuts:** `/` to focus search in any page, Cmd+Shift+F for dedicated search
10. **Search analytics:** Track what users search for to improve ranking weights

---

## 9. Cross-References

- **RES.ANALYTICS.UX** (`docs/proposals/analytics/ux-design.md`) — Analytics page drill-down may link to search results (e.g., "show all failed executions" = search with status filter)
- **RES.SWAP.API** (`docs/proposals/frontend-backend-swappability/api-contract.md`) — Search endpoint must be included in the OpenAPI spec; search types go in `@agentops/shared`
- **RES.DATA.GROWTH** (pending) — FTS5 index size is part of the storage growth story; retention policies should also clean FTS indexes
- **RES.TOKENS.DASHBOARD** (pending) — Token usage search (find expensive executions) overlaps with execution search + cost filter
- **Command Palette** (`packages/frontend/src/features/command-palette/command-palette.tsx`) — Primary consumer of Phase 1 search API
- **Filter Bar** (`packages/frontend/src/features/work-items/filter-bar.tsx`) — Work item search consumer; `searchQuery` in `work-items-store.ts`

---

## 10. Design Decisions

1. **FTS5 over Meilisearch/Typesense.** Local-first architecture means zero external dependencies. FTS5 is built into better-sqlite3, provides BM25 ranking, handles our projected volumes easily, and updates atomically with writes. The only gap is typo tolerance — mitigated by prefix matching (`query*`) which covers the most common case (incomplete typing).

2. **Contentless external content FTS tables.** Using `content='table_name'` avoids duplicating data in the FTS index. The trade-off is that we need triggers for sync and can't use FTS5's `highlight()` on contentless tables — but `snippet()` works fine, and we can highlight in the frontend using the query terms.

3. **Server-side search for all entities, client-side only for static lists.** The Command Palette currently loads all work items client-side. This works for <100 items but degrades as projects grow. Moving to server-side search with debounced fetch keeps the UI responsive at any scale while reducing initial data load.

4. **Project-scoped by default with global opt-in.** Matches the existing project-selector UX pattern. Most searches are contextual ("find that auth work item in my current project"), but global search is available for cross-project discovery.

5. **Index execution summaries immediately, logs deferred.** Execution summaries are short and high-signal. Logs are large and low-signal-per-byte. Deferring log indexing to Phase 2 keeps the initial implementation simple and storage lean.

6. **Unified `/api/search` endpoint, not per-entity search routes.** A single search endpoint simplifies the frontend (one API call returns all entity types) and enables cross-entity ranking. Entity-specific search (like `?q=` on work items) is a convenience alias, not a separate system.
