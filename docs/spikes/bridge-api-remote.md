# Spike: Bridge API for Remote Agent Execution

**Date:** 2026-04-01
**Task:** SDK.FUT.2
**Status:** Evaluated — feasible via `spawnClaudeCodeProcess` custom spawn

## Summary

The Claude Agent SDK supports running Claude Code on remote machines via the `spawnClaudeCodeProcess` option in `query()`. This custom spawn function replaces the default local process spawn, allowing execution in VMs, containers, or remote environments.

## SDK API

The `Options` type includes:

```typescript
spawnClaudeCodeProcess?: (options: SpawnOptions) => SpawnedProcess;
```

Where `SpawnedProcess` must provide:
- `stdin: Writable` — send data to the process
- `stdout: Readable` — receive data from the process
- `killed: boolean` — process state
- `exitCode: number | null` — exit status
- `kill(signal): boolean` — terminate the process
- `on('exit', listener): void` — exit event

### How It Works

Instead of spawning a local `claude-code` subprocess, the SDK calls your custom function. You return an object that looks like a Node.js `ChildProcess` but can connect to any remote process via SSH, Docker exec, WebSocket, or cloud API.

## Implementation Options

### Option A: SSH Tunnel

```typescript
spawnClaudeCodeProcess: (options) => {
  const ssh = new SSHConnection(remoteHost);
  const process = ssh.exec('claude-code', options.args);
  return { stdin: process.stdin, stdout: process.stdout, ... };
}
```

**Pros:** Simple, uses existing SSH infrastructure.
**Cons:** Requires SSH access, firewall rules, Claude Code installed on remote.

### Option B: Docker Remote API

```typescript
spawnClaudeCodeProcess: (options) => {
  const container = docker.createContainer({ image: 'claude-code' });
  const exec = container.exec({ cmd: ['claude-code', ...options.args] });
  return { stdin: exec.stdin, stdout: exec.stdout, ... };
}
```

**Pros:** Isolated, reproducible environment.
**Cons:** Docker infrastructure needed, image management.

### Option C: Cloud Function / VM API

Custom integration with cloud providers (AWS Lambda, GCP Cloud Run, etc.) — spawn the process in a cloud environment and proxy stdin/stdout.

## Use Case for AgentOps

The primary use case is offloading heavy Engineer executions to machines with more compute:

1. User selects a persona with `remote: true` in settings
2. `ClaudeExecutor.spawn()` detects the remote flag
3. Passes custom `spawnClaudeCodeProcess` that connects to the remote machine
4. All SDK features work normally (hooks, MCP, streaming, checkpointing) — they operate on the local side
5. Only the Claude Code subprocess runs remotely

### Architecture

```
AgentOps Backend (local)
    │
    ├── SDK query() with custom spawn
    │     │
    │     ├── spawnClaudeCodeProcess() → SSH/Docker/Cloud
    │     │     └── Remote Claude Code process
    │     │           ├── Runs in remote directory (clone)
    │     │           └── stdin/stdout piped back to local SDK
    │     │
    │     ├── Hooks run locally ✓
    │     ├── MCP server runs locally ✓
    │     └── WS broadcast runs locally ✓
    │
    └── All observability features work ✓
```

## Recommendation

**Defer to when remote execution is needed.** The `spawnClaudeCodeProcess` API is clean and well-designed for this purpose. Implementation is straightforward once the infrastructure choice (SSH/Docker/Cloud) is made.

**Key finding:** No `attachBridgeSession` or `createCodeSession` APIs exist. The remote execution mechanism is `spawnClaudeCodeProcess` — a custom process factory.

### Prerequisites

1. Claude Code installed on the remote machine
2. Project files accessible remotely (git clone, shared volume, or rsync)
3. Network path between local SDK and remote process (stdin/stdout proxy)

## Complexity Estimate

| Component | Effort |
|---|---|
| SSH spawn implementation | Low — straightforward streams proxy |
| Docker spawn implementation | Medium — container lifecycle management |
| Cloud spawn implementation | High — cloud API integration, cold start handling |
| AgentOps integration | Low — just pass `spawnClaudeCodeProcess` in options |
| **Total (SSH path)** | **Low-Medium** |
