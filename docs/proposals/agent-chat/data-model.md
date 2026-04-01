# Agent Chat — Data Model & Backend Research

Research into data model changes and backend architecture for supporting multi-persona agent chat with rich content.

**Current state:** `chat_sessions` table has `id`, `projectId`, `title`, timestamps. `chat_messages` has `id`, `sessionId`, `role`, `content` (plain text), `metadata` (JSON blob with `thinkingBlocks[]`, `toolCalls[]`, `costUsd`, `durationMs`). Backend streams SSE events (`text`, `thinking`, `tool_use`, `tool_result`, `suggestion`, `error`, `done`). Sessions are Pico-only — no `personaId` FK.

---

## 1. Chat Messages ↔ SDK Events Mapping

### How the SDK produces events

A single agent "turn" produces a sequence of messages via the `query()` async iterator:

```
msg.type === "assistant" → contains content blocks:
  - { type: "text", text: "..." }          → text output
  - { type: "thinking", thinking: "..." }  → chain of thought
  - { type: "tool_use", id, name, input }  → tool invocation

msg.type === "user" → tool_use_result:
  - The SDK auto-generates these as tool results

msg.type === "prompt_suggestion" → suggestion text

msg.type === "result" → final summary (cost, duration)
```

A typical turn might produce: thinking → tool_use → tool_result → thinking → tool_use → tool_result → text. This is **one assistant turn**, not multiple messages.

### Recommendation: One composite message per turn

| Option | Description | Tradeoff |
|--------|-------------|----------|
| **One message per event** | Each thinking/tool_use/text block becomes its own DB row | Many rows per turn (5-20). Complex reassembly on load. Ordering matters. |
| **One message per turn** | All content blocks from one assistant response stored as a single message | Simpler queries. Metadata is a single JSON blob. Matches the current approach. |
| **Hybrid: one message with sub-events** | One parent message row, with a JSON array of ordered content blocks | **Recommended.** Best of both: single row per turn, but preserves block ordering and types. |

**Chosen: Hybrid (one message per turn with structured content blocks)**

This matches the current design — the `metadata` JSON already stores `thinkingBlocks` and `toolCalls`. The change is formalizing the structure:

```typescript
// Current metadata (loosely typed)
metadata: {
  thinkingBlocks: string[],
  toolCalls: { id, name, input }[],
  costUsd?: number,
  durationMs?: number,
}

// Proposed: ordered content blocks (typed)
metadata: {
  contentBlocks: ContentBlock[],  // ordered sequence preserving interleaving
  costUsd?: number,
  durationMs?: number,
}
```

Where `ContentBlock` is:
```typescript
type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; text: string }
  | { type: "tool_use"; toolCallId: string; toolName: string; input: Record<string, unknown> }
  | { type: "tool_result"; toolCallId: string; output: string; isError?: boolean }
```

This preserves the exact sequence (thinking → tool_use → tool_result → text) so the UI can render them in order.

### User messages

User messages are simple: one row per user input, `content` is the text, `metadata` is empty or minimal.

---

## 2. Storage — Schema Changes

### Modified tables

**chat_sessions — add personaId:**

```sql
ALTER TABLE chat_sessions ADD COLUMN persona_id TEXT REFERENCES personas(id);
```

- **Nullable** for backwards compatibility (NULL = Pico, the default assistant)
- FK to `personas` table, no cascade on delete (preserve sessions if persona is deleted; see RES.CHAT.UX §6 for deleted-persona handling)

**chat_messages — formalize metadata structure:**

No schema change needed — `metadata` is already a JSON column. The change is in the application layer: write and read `contentBlocks` array instead of separate `thinkingBlocks`/`toolCalls` arrays.

### Migration

```sql
-- Add personaId to sessions
ALTER TABLE chat_sessions ADD COLUMN persona_id TEXT REFERENCES personas(id);

-- Backfill existing sessions with Pico's persona ID
UPDATE chat_sessions SET persona_id = (
  SELECT id FROM personas WHERE json_extract(settings, '$.isAssistant') = 1 LIMIT 1
);
```

For existing messages, the old `metadata` format (`thinkingBlocks` + `toolCalls`) remains readable. New messages use `contentBlocks`. The frontend handles both formats during the transition.

### Why NOT normalized sub-tables

An alternative design puts each content block in its own table:

```sql
-- NOT recommended
CREATE TABLE chat_content_blocks (
  id TEXT PRIMARY KEY,
  message_id TEXT REFERENCES chat_messages(id),
  block_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  content TEXT NOT NULL,  -- JSON
);
```

**Rejected because:**
- Adds complexity without clear benefit for a local-first app
- Loading a message requires a JOIN or N+1 query for blocks
- The JSON blob approach is fast in SQLite and keeps messages atomic
- Tool call outputs can be large (file contents, terminal output) — storing them inline in JSON is fine for SQLite's 1GB blob limit
- The frontend already parses JSON metadata — no change needed

### Storage estimates

| Data | Size per message | Notes |
|------|-----------------|-------|
| User message | ~200 bytes | Short text content |
| Assistant message (text only) | ~2-5 KB | Markdown response |
| Assistant message (with tool calls) | ~10-50 KB | Tool inputs/outputs in metadata JSON |
| Assistant message (with screenshots) | ~50-500 KB | Base64 image data in tool result |
| Session (avg 20 messages) | ~100-500 KB | Typical conversation |

At 1000 sessions, total chat storage is ~100-500 MB. Well within SQLite's practical limits.

---

## 3. Streaming — SSE vs WebSocket

### Current approach: Server-Sent Events (SSE)

The backend streams events via `reply.raw.write()` with `Content-Type: text/event-stream`. Events are newline-delimited JSON.

### Do we need WebSocket?

| Feature | SSE (current) | WebSocket |
|---------|--------------|-----------|
| Server → client streaming | Yes | Yes |
| Client → server mid-stream | **No** — requires separate HTTP request | Yes — bidirectional |
| User cancels mid-stream | New DELETE/POST endpoint to abort | Send cancel message on same connection |
| User approves proposal mid-stream | New POST endpoint, agent polls or waits | Send approval on same connection |
| Reconnection | Built-in `EventSource` auto-reconnect | Manual reconnect logic needed |
| Browser support | Universal | Universal |
| Complexity | Low — one-way pipe | Medium — connection management, heartbeats |

### Recommendation: Stay with SSE, add control endpoints

For Phase 1, SSE is sufficient. The bidirectional features (cancel, approve) can be handled by separate HTTP endpoints:

```
POST /api/chat/sessions/:id/messages     → send message, start SSE stream
POST /api/chat/sessions/:id/cancel       → abort current streaming response
POST /api/chat/sessions/:id/approve      → approve a pending proposal
```

The agent's `query()` call can be aborted via an `AbortController`. The cancel endpoint signals the controller.

**Phase 2 migration to WebSocket** is justified when:
- Real-time proposal approval during streaming becomes critical
- Multiple simultaneous streams per session are needed
- The WebSocket infrastructure is already in place (currently used for query cache invalidation, not chat)

### SSE event format enhancement

Current events carry minimal structure. For rich rendering, enhance the SSE protocol:

```typescript
// Current
{ type: "tool_use", content: JSON.stringify({ id, name, input }) }

// Enhanced
{ type: "tool_use", toolCallId: "tc_123", toolName: "Edit", input: { file_path: "...", old_string: "...", new_string: "..." } }
{ type: "tool_result", toolCallId: "tc_123", output: "File edited successfully", isError: false, durationMs: 150 }
{ type: "tool_use", toolCallId: "tc_124", toolName: "Bash", input: { command: "pnpm build" } }
{ type: "tool_status", toolCallId: "tc_124", status: "running" }  // NEW: progress update
{ type: "tool_result", toolCallId: "tc_124", output: "...", isError: false, durationMs: 3200 }
```

Key changes:
- `tool_use` and `tool_result` are linked by `toolCallId`
- `tool_status` event for in-progress updates (enables progress indicators)
- Structured fields instead of JSON-stringified `content`
- `durationMs` per tool call (frontend can display timing)

---

## 4. Relationship to Executions

### Are chat interactions also executions?

Currently, chat and executions are completely separate:
- **Executions** are triggered by workflow state transitions. They have a `workItemId`, `personaId`, `status`, `outcome`, `summary`. They are tracked in Agent Monitor.
- **Chat** is conversational. No work item binding. No status lifecycle. Not visible in Agent Monitor.

### Recommendation: Keep them separate with optional linking

| Approach | Description | Tradeoff |
|----------|-------------|----------|
| **Unified** | Every chat message that triggers agent work creates an execution record | Pollutes Agent Monitor with chat interactions. Conflates conversation with task work. |
| **Separate** | Chat and executions remain independent tables | Clean separation. But no way to trace "this chat led to that code change." |
| **Linked** | Chat sessions can optionally reference a work item. Tool calls within chat can spawn executions. | **Best of both.** Chat is lightweight by default; linking is opt-in when the agent does real work. |

**Chosen: Separate with optional linking**

Schema addition:
```sql
ALTER TABLE chat_sessions ADD COLUMN work_item_id TEXT REFERENCES work_items(id);
```

- **NULL by default** — most chat sessions are standalone conversations
- **Non-null when created from a work item context** (e.g., "Discuss this task with Engineer")
- When a chat agent executes a tool that modifies files, the system can optionally create an execution record linked to both the chat session and the work item

This means:
- Agent Monitor shows workflow executions (as today)
- Chat page shows conversations (as designed in RES.CHAT.UX)
- A work item detail page can show both its executions AND any related chat sessions

### Cost tracking

Chat interactions have cost (tokens used). Currently stored in message `metadata.costUsd`. This should be:
- Aggregated per session (sum of all assistant message costs)
- Displayed in the chat header or session list
- Included in the dashboard cost summary (currently only counts workflow executions)

---

## 5. Interaction with V2 Sessions (SDK.V2.3)

### Current blocker

SDK.V2.3 is blocked because `SDKSessionOptions` doesn't support `agents`, `mcpServers`, `cwd`, `skills`, or `maxBudgetUsd`. These are only available on `query()` Options.

### How chat would use V2 sessions if unblocked

If the SDK adds full configuration to `SDKSessionOptions`:

```typescript
// Create a V2 session
const sdkSession = await unstable_v2_createSession({
  agent: persona.id,
  agents: { [persona.id]: agentDef },
  mcpServers: { agentops: { ... } },
  cwd: project.path,
  maxBudgetUsd: persona.maxBudgetPerRun,
});

// Store SDK session ID alongside our chat session
await db.update(chatSessions)
  .set({ sdkSessionId: sdkSession.id })
  .where(eq(chatSessions.id, ourSessionId));

// Send messages to existing session
const stream = sdkSession.send(userMessage);
for await (const msg of stream) { ... }
```

### What V2 sessions would eliminate

| Current responsibility | With V2 sessions |
|----------------------|-----------------|
| Manual conversation history assembly | SDK handles context window management |
| Context compaction | SDK handles compaction natively |
| Storing all messages in our DB | Optional — SDK stores its own history, we keep a lightweight index |
| Re-sending full history on each request | SDK resumes from session state |

### What we'd still need

- Our `chat_sessions` table as a lightweight index (sessionId → sdkSessionId mapping, persona, project, title)
- Our `chat_messages` table for structured content blocks (SDK messages don't include our UI-specific rendering data)
- SSE streaming layer (SDK's streaming API still needs to be wrapped for the frontend)
- Cost tracking per session

### Schema addition for V2 readiness

```sql
ALTER TABLE chat_sessions ADD COLUMN sdk_session_id TEXT;
```

- NULL when using the current `query()` approach (each message is a fresh query with full history)
- Non-null when using V2 sessions (SDK manages the conversation state)
- Migration: when V2 becomes available, new sessions use V2; old sessions continue with `query()` until naturally archived

---

## 6. Schema Summary

### Final chat_sessions table

```sql
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  persona_id TEXT REFERENCES personas(id),           -- NEW: NULL = Pico
  work_item_id TEXT REFERENCES work_items(id),       -- NEW: optional link
  sdk_session_id TEXT,                                -- NEW: V2 readiness
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Final chat_messages table (unchanged schema, enhanced metadata)

```sql
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,          -- "user" | "assistant"
  content TEXT NOT NULL,       -- plain text (for search, display)
  metadata TEXT NOT NULL DEFAULT '{}',  -- JSON: { contentBlocks[], costUsd?, durationMs? }
  created_at INTEGER NOT NULL
);
```

### New API endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/chat/sessions` | Create session — now accepts `personaId`, `workItemId` |
| `GET /api/chat/sessions` | List sessions — now includes persona name/avatar in response |
| `POST /api/chat/sessions/:id/cancel` | Abort active streaming response |
| `GET /api/chat/sessions/:id/cost` | Aggregated token usage for session |

### Migration steps

1. Add `persona_id`, `work_item_id`, `sdk_session_id` columns to `chat_sessions`
2. Backfill existing sessions with Pico's persona ID
3. Update chat route to read persona from session record instead of hardcoding Pico
4. Update SSE event format to include `toolCallId` linking and `tool_status` events
5. Update frontend to write/read `contentBlocks` in metadata (handle both old and new format)
6. Add cancel endpoint with `AbortController` integration
