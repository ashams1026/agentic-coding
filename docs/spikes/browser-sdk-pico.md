# Spike: Browser SDK for Client-Side Pico

**Date:** 2026-04-01
**Task:** SDK.FUT.1
**Status:** Evaluated — feasible but requires WebSocket relay infrastructure

## Summary

The Claude Agent SDK ships a browser export (`@anthropic-ai/claude-agent-sdk/browser`) that enables running Claude Code queries directly from the browser via WebSocket. This could replace the current server-side SSE proxy for Pico chat, reducing latency and server load.

## Current Architecture (Server-Side)

```
Browser → POST /api/chat/sessions/:id/messages → Backend → SDK query() → SSE stream → Browser
```

- Backend acts as proxy: receives user message, assembles history, calls SDK `query()`, streams SSE events
- Pico state managed server-side (chat_sessions, chat_messages tables)
- Conversation history assembled manually from DB before each query

## Proposed Architecture (Browser SDK)

```
Browser → WebSocket → Claude Code relay server → Claude API
```

- Browser imports `query` from `@anthropic-ai/claude-agent-sdk/browser`
- Queries stream directly via WebSocket — no SSE proxy
- Conversation history managed by the SDK natively

## Browser SDK API

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk/browser'

const messages = query({
  prompt: messageStream,          // AsyncIterable<SDKUserMessage>
  websocket: {
    url: 'wss://api.example.com/claude',
    authMessage: { type: 'oauth', credential: { type: 'oauth', token: '...' } },
  },
  canUseTool: myPermissionCallback,
  hooks: { PreToolUse: [...] },
  mcpServers: { agentops: sdkMcpServerConfig },
})

for await (const message of messages) {
  // Same SDKMessage types as server-side
}
```

### Key Differences from Server `query()`

| Feature | Server `query()` | Browser `query()` |
|---|---|---|
| Transport | stdio (spawns subprocess) | WebSocket |
| Auth | `ANTHROPIC_API_KEY` env var | OAuth token in WebSocket auth message |
| MCP servers | Can run in-process or as child process | Can use SDK MCP servers (in-process only) |
| Hooks | Full hook support | `canUseTool` + `hooks` supported |
| Output format | `outputFormat` option | `jsonSchema` option (same purpose) |

### Supported Features

- `canUseTool` permission callback ✓
- `hooks` (PreToolUse, PostToolUse, etc.) ✓
- `mcpServers` (SDK MCP servers only) ✓
- `abortController` for cancellation ✓
- Same `SDKMessage` types for streaming ✓

## Requirements for Implementation

1. **WebSocket relay server** — Claude Code needs a WebSocket endpoint to connect through. Options:
   - Self-hosted relay (significant infrastructure)
   - Claude.ai WebSocket endpoint (if available for API customers)
   - Third-party relay service

2. **OAuth token management** — Browser SDK uses OAuth, not API keys. Need:
   - OAuth flow for user authentication
   - Token refresh logic
   - Secure token storage (httpOnly cookies or similar)

3. **CORS configuration** — WebSocket connections from the browser need proper CORS headers on the relay.

4. **MCP server adaptation** — The in-process MCP server (`createSdkMcpServer`) works in browser, but DB-dependent tools (post_comment, route_to_state) would need to call the backend API instead of accessing SQLite directly.

## Recommendation

**Not recommended for immediate implementation.** The WebSocket relay infrastructure and OAuth requirements add significant complexity for marginal latency improvement. The current SSE approach works well and is simpler to maintain.

**Revisit when:**
- Claude provides a hosted WebSocket relay for API customers
- OAuth is a requirement for multi-user deployment
- Pico needs to run without a backend (offline/standalone mode)

## Complexity Estimate

| Component | Effort |
|---|---|
| WebSocket relay server | High — new infrastructure |
| OAuth flow | Medium — standard but new |
| MCP tool adaptation | Medium — API calls instead of DB |
| Frontend integration | Low — same message types |
| **Total** | **High** |
