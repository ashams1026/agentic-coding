# Proposal: V2 Session Configuration for Pico

**Task:** RES.V2.SESSIONS
**Unblocks:** SDK.V2.3 (refactor Pico to use V2 sessions)
**Date:** 2026-04-02

## Problem

Pico currently uses `query()` for each message, rebuilding the full conversation history from a custom DB table (`chat_sessions`/`chat_messages`). The blocked task SDK.V2.3 wants to use V2 sessions (`unstable_v2_createSession`) for native conversation persistence. However, `SDKSessionOptions` is much more limited than `query()` Options.

## Investigation

### 1. SDKSessionOptions vs query() Options (SDK v0.2.87)

| Feature | `SDKSessionOptions` | `query() Options` |
|---|---|---|
| `model` | Yes | Yes |
| `pathToClaudeCodeExecutable` | Yes | Yes |
| `allowedTools` | Yes | Yes |
| `disallowedTools` | Yes | Yes |
| `canUseTool` | Yes | Yes |
| `hooks` | Yes | Yes |
| `permissionMode` | Yes | Yes (+ `bypassPermissions`) |
| `env` | Yes | Yes |
| **`agent` / `agents`** | **No** | Yes |
| **`mcpServers`** | **No** | Yes |
| **`cwd`** | **No** | Yes |
| **`systemPrompt`** | **No** | Yes |
| **`maxTurns`** | **No** | Yes |
| **`maxBudgetUsd`** | **No** | Yes |
| **`tools` (restrict set)** | **No** | Yes |
| **`thinking` / `effort`** | **No** | Yes |
| **`enableFileCheckpointing`** | **No** | Yes |
| **`sandbox`** | **No** | Yes |
| **`outputFormat`** | **No** | Yes |
| **`plugins`** | **No** | Yes |

**The gap is massive.** V2 sessions are missing 12+ configuration fields that Pico currently uses via `query()`.

### 2. `session.send()` Per-Message Options

`SDKSession.send(message: string | SDKUserMessage)` — the `SDKUserMessage` type only contains:
- `type: 'user'`
- `message: MessageParam`
- `parent_tool_use_id: string | null`
- `isSynthetic?: boolean`
- `tool_use_result?: unknown`
- `priority?: 'now' | 'next' | 'later'`

**No per-message configuration options.** Cannot set `agent`, `mcpServers`, `systemPrompt`, etc. at send time.

### 3. V2 Session Lifecycle

```typescript
// Create
const session = unstable_v2_createSession({ model: 'claude-sonnet-4-6' });

// Stream responses
const stream = session.stream();

// Send messages
await session.send("Hello");
// ... iterate stream for response ...

await session.send("What files are here?");
// ... iterate stream for response ...

// Resume later
const resumed = unstable_v2_resumeSession(session.sessionId, { model: '...' });
```

V2 sessions handle conversation history, context compaction, and session storage natively. This is exactly what Pico needs — but only if the session can be configured as Pico (custom personality, MCP server, project cwd).

### 4. SDK Changelog/Issues

The V2 API is marked `@alpha` / `unstable`. The function name prefix `unstable_v2_` indicates it's likely to change. No changelog entries or GitHub issues found indicating planned expansion of `SDKSessionOptions`.

## Options Evaluated

### Option A: Wait for SDK (Not Recommended)

Wait for the SDK to add the missing fields to `SDKSessionOptions`. No timeline, could be months.

**Verdict:** Not actionable.

### Option B: Hybrid Approach (Recommended)

Use V2 sessions for **conversation persistence only**, but configure the session's behavior through CLAUDE.md files, MCP server environment, and the limited options that ARE available.

**How it works:**

1. **System prompt** → Write to a temporary `.claude/CLAUDE.md` file in the project directory before creating the session. The SDK will load it automatically as instructions.

2. **MCP servers** → Cannot be configured via `SDKSessionOptions`. Two workarounds:
   - (a) Set up the MCP server config in `.claude/settings.json` before creating the session
   - (b) Use `env` to pass configuration that the MCP server reads at startup

3. **cwd** → Set `env.PWD` or change `process.cwd()` before creating the session (fragile). Alternatively, use the `executable` and `executableArgs` to pass `--cwd` as a CLI argument via `extraArgs` (not available in SDKSessionOptions either).

4. **agent/agents** → Cannot be configured. The session would need to use the system prompt to define Pico's personality directly.

5. **maxBudgetUsd** → Not available. Would need external monitoring.

**Verdict:** Too many workarounds. The result would be fragile and hard to maintain.

### Option C: query() with Resume (Recommended)

Keep using `query()` for each message but leverage its `resume` option to continue conversations:

```typescript
// First message
const q1 = query({
  prompt: "Hello",
  options: {
    agent: "pico",
    agents: { pico: picoAgentDef },
    mcpServers: { agentops: mcpConfig },
    cwd: project.path,
    systemPrompt: picoSystemPrompt,
    maxBudgetUsd: 1.0,
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    persistSession: true, // ← Save to SDK session store
  },
});
// ... collect response, get sessionId from result ...

// Second message — resume the session
const q2 = query({
  prompt: "What files are here?",
  options: {
    resume: sessionId,    // ← Continue previous conversation
    agent: "pico",
    agents: { pico: picoAgentDef },
    mcpServers: { agentops: mcpConfig },
    cwd: project.path,
    // ... same config ...
  },
});
```

**Benefits:**
- Full `query()` options available (agent, mcpServers, cwd, budget, etc.)
- SDK handles conversation history via `resume`
- No custom `chat_messages` table needed — SDK stores messages
- Context compaction handled by SDK
- `listSessions()` and `getSessionInfo()` work for listing

**Tradeoffs:**
- Each `query()` call spawns a new Claude Code process (vs. V2's persistent process)
- Slightly more latency per message
- Must re-specify all options on each call

### Option D: V2 Session + query() Fallback

Use V2 session for simple chat. When advanced features are needed (MCP tools, specific cwd), fall back to `query()` with `resume`.

**Verdict:** Overly complex. Two code paths for the same feature.

## Recommendation

**Go with Option C: `query()` with `resume`.** This gives us:
1. Full configuration control (agent, mcpServers, cwd, budget, systemPrompt)
2. SDK-managed conversation history (no custom `chat_messages` table)
3. Works with current SDK version (no waiting)
4. Clean migration path — if/when V2 sessions gain these options, swap to V2

### Migration Plan

1. On first Pico message: call `query()` with `persistSession: true`, capture `session_id` from the result message
2. Store `session_id` in the `chat_sessions` table (alongside projectId, title, createdAt)
3. On subsequent messages: call `query()` with `resume: session_id`
4. Drop `chat_messages` table — SDK handles message history
5. For session listing: use `listSessions()` or our lightweight `chat_sessions` index
6. For message history: use `getSessionMessages()` (if available) or reconstruct from SDK session files

### Files to Change

- `packages/backend/src/routes/chat.ts` — Add `resume` option, capture `session_id`
- `packages/backend/src/db/schema.ts` — Add `sdkSessionId` column to `chat_sessions`, eventually drop `chat_messages`
- `packages/backend/src/db/migrations/` — Migration for schema changes
- `packages/frontend/` — No changes needed (API stays the same)
