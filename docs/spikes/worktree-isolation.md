# Spike: Worktree Isolation for Agent Executions

**Date:** 2026-04-01
**Task:** SDK.FUT.5
**Status:** Evaluated — SDK supports worktree isolation natively via tools, agent definitions, and settings

## Summary

The Claude Agent SDK supports git worktree isolation through three mechanisms: the `EnterWorktree`/`ExitWorktree` tools, the `isolation: "worktree"` parameter on Agent (subagent) definitions, and the `worktree` settings configuration. This enables concurrent agent executions to work on separate file systems without interfering with each other.

## Problem

When multiple agents run concurrently (e.g., two Engineers working on sibling tasks), they currently share the same working directory. This causes:
- File write conflicts (two agents editing the same file)
- Git conflicts (competing commits on the same branch)
- Partial state observation (agent A reads agent B's half-written file)

Currently AgentOps has no file locking or isolation mechanism.

## SDK Worktree API

### 1. Settings Configuration

The `worktree` key in settings configures how worktrees are created:

```json
{
  "worktree": {
    "symlinkDirectories": ["node_modules", ".cache"],
    "sparsePaths": ["packages/"]
  }
}
```

| Field | Type | Description |
|---|---|---|
| `symlinkDirectories` | `string[]` | Directories symlinked from main repo to avoid disk bloat. No defaults — must be explicit. |
| `sparsePaths` | `string[]` | Directories for git sparse-checkout (cone mode). Only these paths are written to disk. Faster for monorepos. |

### 2. EnterWorktree / ExitWorktree Tools

Agents can programmatically create and destroy worktrees:

```typescript
// EnterWorktree — creates a worktree, changes cwd into it
interface EnterWorktreeInput {
  name?: string; // optional, random if omitted. Alphanumeric + dots/dashes, max 64 chars
}
interface EnterWorktreeOutput {
  worktreePath: string;   // absolute path to created worktree
  worktreeBranch?: string;
  message: string;
}

// ExitWorktree — leaves and optionally removes the worktree
interface ExitWorktreeInput {
  action: "keep" | "remove";
  discard_changes?: boolean; // required true when removing with uncommitted/unmerged changes
}
interface ExitWorktreeOutput {
  action: "keep" | "remove";
  originalCwd: string;
  worktreePath: string;
  worktreeBranch?: string;
  discardedFiles?: number;
  discardedCommits?: number;
  message: string;
}
```

### 3. Agent Tool Isolation

Subagents can be launched with worktree isolation:

```typescript
// In AgentDefinition or Agent tool invocation
{
  isolation: "worktree"  // agent runs in a temporary git worktree
}
```

When `isolation: "worktree"` is set, the SDK automatically:
1. Creates a worktree before the agent starts
2. Runs the agent in the worktree directory
3. If agent made changes: keeps the worktree, returns path and branch
4. If agent made no changes: cleans up the worktree automatically

### 4. Worktree Hooks

Hook events for worktree lifecycle:

```typescript
type WorktreeCreateHookInput = BaseHookInput & {
  hook_event_name: 'WorktreeCreate';
  name: string;
};

type WorktreeCreateHookSpecificOutput = {
  hookEventName: 'WorktreeCreate';
  worktreePath: string; // hook can override/customize the path
};

type WorktreeRemoveHookInput = BaseHookInput & {
  hook_event_name: 'WorktreeRemove';
  worktree_path: string;
};
```

### 5. Session Worktree Support

Sessions can list across worktrees:

```typescript
type ListSessionsOptions = {
  dir?: string;
  includeWorktrees?: boolean; // default: true — includes sessions from all worktree paths
};
```

## Integration Options for AgentOps

### Option A: Subagent Isolation (Recommended)

Since AgentOps already registers all personas as `AgentDefinition` entries in the `agents` option, add `isolation: "worktree"` to concurrent execution subagents.

```typescript
// In claude-executor.ts, when building agent definitions:
const agentDefs: Record<string, AgentDefinition> = {};
for (const persona of allPersonas) {
  agentDefs[persona.name] = {
    description: persona.roleDefinition,
    prompt: persona.systemPrompt,
    model: persona.model,
    isolation: "worktree", // each subagent gets its own worktree
  };
}
```

**Pros:** Automatic lifecycle management — SDK creates and cleans up worktrees. No changes to the main execution flow. Each agent naturally works on its own branch.
**Cons:** `isolation` is on the Agent tool, not AgentDefinition — the parent agent or Router would need to specify it when spawning. May need SDK confirmation that AgentDefinition supports this field.

### Option B: Execution-Level Worktree via Tools

Add `EnterWorktree`/`ExitWorktree` to each agent's allowed tools. Instruct agents via system prompt to create a worktree at the start of their work and merge back when done.

```typescript
// In system prompt addition:
const worktreeInstructions = `
Before starting work, create a worktree: use the EnterWorktree tool.
When done, commit your changes, then use ExitWorktree with action "keep".
The orchestrator will merge your branch back to main.
`;
```

**Pros:** Explicit control — agents can name worktrees, decide when to create/destroy.
**Cons:** Relies on agent compliance. Requires merge orchestration in AgentOps. More complex prompt engineering.

### Option C: Settings-Based Configuration

Configure worktree settings in the project settings, then enable worktree mode for all executions:

```json
{
  "worktree": {
    "symlinkDirectories": ["node_modules", ".vite"],
    "sparsePaths": ["packages/"]
  }
}
```

Add a project-level toggle: `execution.worktreeIsolation: true`. When enabled, the executor creates a worktree for each execution and merges back on completion.

**Pros:** Global configuration, no per-agent setup.
**Cons:** Need custom merge-back logic. Settings configure worktree shape but don't auto-create them.

## Merge-Back Strategy

Regardless of the isolation approach, worktree branches need to be merged back to main. Options:

1. **Auto-merge on completion**: After agent commits, auto `git merge --no-ff` to main. Fail if conflicts.
2. **PR-based merge**: Agent pushes worktree branch, creates a PR for review. Reviewer persona merges.
3. **Rebase-merge**: Agent rebases onto latest main before completing. Reduces conflicts.

For AgentOps, Option 1 (auto-merge) with conflict detection is the simplest start. If a merge conflicts, mark the execution as needing manual resolution.

## Does This Replace Custom File Locking?

**Yes, for most cases.** Worktree isolation is a stronger guarantee than file locking:
- File locking prevents concurrent writes to the same file but allows reading stale state
- Worktree isolation gives each agent a complete, independent file system snapshot
- No deadlock risk (unlike mutex-based file locks)
- Git handles the merge — conflict detection is built in

**Exception:** Shared resources outside git (database writes, external APIs, shared state files in `.gitignore`) still need application-level coordination. AgentOps already handles this via the workflow state machine and MCP tool-based coordination.

## Recommendation

**Start with Option A when concurrent execution is implemented.** The `isolation: "worktree"` parameter on subagent spawning is the cleanest integration — the SDK manages the full worktree lifecycle. Configure `worktree.symlinkDirectories: ["node_modules"]` in project settings to avoid disk bloat.

**Not needed yet.** AgentOps currently runs one agent at a time per work item (sequential workflow). Worktree isolation becomes critical only when:
- Parallel agent execution is enabled (multiple Engineers working simultaneously)
- The Decomposition persona spawns parallel subtask agents
- Users request concurrent pipeline runs on the same project

**Revisit when:** Parallel execution support is added to the execution manager.

## Complexity Estimate

| Component | Effort |
|---|---|
| Settings configuration (`symlinkDirectories`) | Low — add to project settings |
| Option A: Subagent isolation | Low-Medium — add `isolation` when spawning agents |
| Option B: Tool-based worktrees | Medium — prompt engineering + merge orchestration |
| Option C: Execution-level worktrees | Medium-High — custom worktree management + merge logic |
| Merge-back automation | Medium — git merge + conflict handling |
