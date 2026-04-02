# Blocked Tasks

> Tasks that are blocked on external dependencies or architectural decisions. These are tracked here until their blockers are resolved.

---

## SDK Limitations

### **FX.SDK3** — Replace hardcoded tool list with SDK discovery in persona editor

**Blocked on:** Claude Agent SDK does not expose a tool discovery API. `initializationResult()` returns commands (skills), agents, and models — but not built-in tool names/descriptions. The hardcoded `SDK_TOOLS` list in `tool-configuration.tsx` is actually correct since built-in tools are a fixed set.

**What it would do:** In the persona editor UI, replace freeform text input / hardcoded tool checkboxes for `allowedTools` with a multi-select populated from `GET /api/sdk/capabilities`. Group by category (File, Search, Execution, Web, Agent, Other). Same for `mcpTools`.

**Unblocks when:** The SDK adds a tool discovery API that returns built-in tool names and descriptions. May never happen since built-in tools are a fixed set — consider closing as "won't fix".

---

### **FX.SDK5** — Add startup tool validation

**Blocked on:** Same as FX.SDK3 — no tool discovery API in SDK. Can validate skills (commands) and agents from capabilities, but not built-in tools.

**What it would do:** On first dispatch or server start, fetch SDK capabilities and validate all persona `allowedTools` and `skills` against the actual available set. Log warnings for mismatches.

**Unblocks when:** Same as FX.SDK3.

---

### **SDK.V2.3** — Refactor Pico to use V2 sessions

**Blocked on:** `SDKSessionOptions` does not support `agent/agents`, `mcpServers`, `cwd`, `skills`, or `maxBudgetUsd` — only `query()` Options does. V2 sessions can't be configured as Pico (custom personality, MCP server, project cwd).

**What it would do:** Replace custom `chat_sessions`/`chat_messages` DB + manual conversation history assembly with the SDK's native session management (`unstable_v2_createSession()`, `session.send()`, `session.stream()`, `listSessions()`, `getSessionMessages()`). Eliminate our custom chat persistence layer entirely.

**Unblocks when:** Anthropic adds agent/agents, mcpServers, cwd, skills, and maxBudgetUsd fields to `SDKSessionOptions`.

---

## Superseded

### **PLUG.3c** — Move ExecutionManager to `@agentops/core` *(superseded by RES.SWAP.\*)*

**Originally blocked on:** ExecutionManager has 6+ non-DB dependencies (logger, audit, concurrency, runRouter, dispatchForState, drizzle eq). Moving to core requires abstracting all of these as interfaces.

**Superseded by:** The frontend/backend swappability research (RES.SWAP.ARCH, RES.SWAP.API) proposes formalizing the API contract at the HTTP boundary via OpenAPI. This makes internal module extraction into `@agentops/core` unnecessary — the API contract itself becomes the abstraction layer, and any conforming backend implementation can serve the frontend.

---

### **PLUG.3d** — Move MCP server definition to `@agentops/core` *(superseded by RES.SWAP.\*)*

**Originally blocked on:** Same as PLUG.3c — mcp-server.ts depends on SDK MCP factory, logger, audit, coordination, memory modules beyond just DB.

**Superseded by:** Same as PLUG.3c. The API contract approach from RES.SWAP.* replaces the need for a shared core package.
