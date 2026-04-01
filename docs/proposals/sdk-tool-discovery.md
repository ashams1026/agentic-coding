# Proposal: SDK Tool Discovery Alternatives

**Task:** RES.SDK.TOOLS
**Unblocks:** FX.SDK3 (replace hardcoded tool list in persona editor), FX.SDK5 (startup tool validation)
**Date:** 2026-04-02

## Problem

The persona editor's tool configuration (`packages/frontend/src/features/persona-manager/tool-configuration.tsx`) uses a hardcoded `SDK_TOOLS` array of 8 tools. The blocked tasks (FX.SDK3/FX.SDK5) wanted to replace this with a dynamic discovery mechanism. However, the SDK's `initializationResult()` returns `commands`, `agents`, and `models` — but no `tools` field.

## Investigation

### 1. SDK `initializationResult()` (v0.2.87)

`SDKControlInitializeResponse` contains:
- `commands: SlashCommand[]` — skills/slash commands
- `agents: AgentInfo[]` — registered subagents
- `models: ModelInfo[]` — available models
- `account: AccountInfo` — logged-in user info

**No `tools` field.** This is confirmed by the TypeScript types in `sdk.d.ts:1994`.

### 2. `sdk-tools.d.ts` — The Authoritative Tool Manifest

The SDK ships `sdk-tools.d.ts` (auto-generated from JSON Schema). It exports `ToolInputSchemas` and `ToolOutputSchemas` type unions that enumerate **every built-in tool**:

**Input types (= tool names):**
- `AgentInput` → Agent (spawn subagent)
- `BashInput` → Bash
- `TaskOutputInput` → TaskOutput
- `ExitPlanModeInput` → ExitPlanMode
- `FileEditInput` → Edit (aka FileEdit)
- `FileReadInput` → Read (aka FileRead)
- `FileWriteInput` → Write (aka FileWrite)
- `GlobInput` → Glob
- `GrepInput` → Grep
- `TaskStopInput` → TaskStop
- `ListMcpResourcesInput` → ListMcpResources
- `McpInput` → Mcp
- `NotebookEditInput` → NotebookEdit
- `ReadMcpResourceInput` → ReadMcpResource
- `TodoWriteInput` → TodoWrite
- `WebFetchInput` → WebFetch
- `WebSearchInput` → WebSearch
- `AskUserQuestionInput` → AskUserQuestion
- `ConfigInput` → Config
- `EnterWorktreeInput` → EnterWorktree
- `ExitWorktreeInput` → ExitWorktree

That's **21 tools** vs. the 8 currently hardcoded. Many are internal/system tools (Config, EnterWorktree, ExitWorktree, ExitPlanMode) that shouldn't be exposed in the persona editor, but the full list is valuable for validation.

### 3. `canUseTool` Callback

The SDK provides a `CanUseTool` callback (`sdk.d.ts:130`) that fires before each tool execution. It receives `toolName` and `input`. This could theoretically be used to *discover* tools by logging all tool names that are attempted, but this is reactive (only works after execution starts) and impractical for upfront discovery.

### 4. `PreToolUse` Hook

Similar to `canUseTool` but via the hooks system. `PreToolUseHookInput` receives the tool name before execution. Same limitation — reactive, not suitable for upfront listing.

### 5. `tools` Option in `AgentDefinition` and `QueryOptions`

The `AgentDefinition.tools` field (`sdk.d.ts:46`) accepts `string[]` of tool names to allow. The `QueryOptions.tools` field accepts `Array<SdkMcpToolDefinition>` for custom MCP-style tools. Neither provides discovery — they're for restriction/extension, not enumeration.

## Recommended Approach

### Option A: Version-Pinned Tool Manifest (Recommended)

Maintain a `packages/shared/src/sdk-tools.ts` file that exports the known SDK tools list. This is already effectively what `tool-configuration.tsx` does, but:

1. **Move to shared package** — both frontend and backend can import it
2. **Expand to the full set** — categorize all 21 tools into user-facing vs. internal
3. **Add a version assertion** — on backend startup, compare the manifest against `sdk-tools.d.ts` type names (parsed at build time or via a simple test) to detect drift when the SDK is upgraded

```typescript
// packages/shared/src/sdk-tools.ts
export const SDK_TOOLS = {
  // User-facing tools (show in persona editor)
  userFacing: [
    { name: "Read", description: "Read file contents" },
    { name: "Edit", description: "Edit files with search/replace" },
    { name: "Write", description: "Write new files" },
    { name: "Glob", description: "Find files by pattern" },
    { name: "Grep", description: "Search file contents" },
    { name: "Bash", description: "Execute shell commands" },
    { name: "WebFetch", description: "Fetch web pages" },
    { name: "WebSearch", description: "Search the web" },
    { name: "NotebookEdit", description: "Edit Jupyter notebooks" },
    { name: "Agent", description: "Spawn a subagent" },
    { name: "TodoWrite", description: "Manage todo items" },
    { name: "AskUserQuestion", description: "Ask the user a question" },
  ],
  // Internal tools (don't show in editor, but valid for validation)
  internal: [
    "TaskOutput", "TaskStop", "ExitPlanMode",
    "ListMcpResources", "ReadMcpResource", "Mcp",
    "Config", "EnterWorktree", "ExitWorktree",
  ],
} as const;

export const ALL_SDK_TOOL_NAMES = [
  ...SDK_TOOLS.userFacing.map(t => t.name),
  ...SDK_TOOLS.internal,
];

// Expected SDK version this manifest was verified against
export const SDK_TOOLS_VERIFIED_VERSION = "0.2.87";
```

4. **Add a CI/build-time check** — a test that imports `sdk-tools.d.ts` types and verifies all `ToolInputSchemas` union members are accounted for in the manifest.

### Option B: Parse `sdk-tools.d.ts` at Build Time

Write a build script that reads `sdk-tools.d.ts`, extracts the `ToolInputSchemas` union members, strips the `Input` suffix, and generates a JSON manifest. This is fully automatic but fragile if the SDK changes its type naming convention.

### Option C: Wait for SDK API

The SDK may add a `tools` field to `initializationResult()` in a future version. This would be ideal but has no timeline.

## Recommendation

**Go with Option A.** It's simple, type-safe, and the version assertion catches drift. The hardcoded list is actually the correct approach for a fixed set of built-in tools — the only improvement needed is:
1. Moving it to shared
2. Expanding to the full set with user-facing/internal categorization
3. Adding version tracking

**FX.SDK3** can be unblocked by updating `tool-configuration.tsx` to import from the shared manifest instead of defining its own list, and adding the missing tools (Agent, NotebookEdit, TodoWrite, AskUserQuestion).

**FX.SDK5** can be unblocked by importing `ALL_SDK_TOOL_NAMES` in the backend and validating persona `allowedTools` against it on startup, logging warnings for unknown tool names.

## Files to Change

- `packages/shared/src/sdk-tools.ts` — new file with the manifest
- `packages/shared/src/index.ts` — re-export
- `packages/frontend/src/features/persona-manager/tool-configuration.tsx` — import from shared
- `packages/backend/src/agent/execution-manager.ts` — startup validation
- `tests/` — add a test that verifies manifest vs. SDK types
