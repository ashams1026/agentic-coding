# Proposal: Data Model Changes for Global Agents

**Task:** RES.GLOBAL.DATA
**Date:** 2026-04-02

## Problem

All agents currently operate within a project context. Global agents (e.g., cross-project oversight, general-purpose assistants, system maintenance agents) need to operate outside of or across project boundaries. This requires data model and runtime changes.

## Investigation

### 1. Tables with `projectId` FK — Nullable Analysis

| Table | `projectId` | Currently | Global Agent Impact |
|---|---|---|---|
| **workItems** | `NOT NULL` | Every work item belongs to one project | Keep NOT NULL — global agents don't create work items. If they need to, they target a specific project. |
| **personaAssignments** | `NOT NULL` (composite PK) | Maps persona to workflow state per project | Keep NOT NULL — global agents aren't assigned to workflow states. They're invoked directly, not routed. |
| **projectMemories** | `NOT NULL` | Memories are per-project summaries | Keep NOT NULL — global agents would have separate memory (see below). |
| **chatSessions** | `NOT NULL` | Every Pico chat tied to a project | **Make nullable** — global chat sessions have no project context. |
| **executions** | No FK (via `workItemId`) | Project scope inherited from work item | **Add optional `projectId`** — global agent executions have no work item. |
| **personas** | No FK | Already global! | No change needed. |
| **comments** | No FK (via `workItemId`) | Scoped to work item | No change — global agents post comments on specific work items (always project-scoped). |
| **proposals** | No FK (via `executionId`) | Scoped to execution | No change — inherits from execution. |

**Summary of schema changes:**

```sql
-- chatSessions: make projectId nullable
ALTER TABLE chat_sessions ALTER COLUMN project_id DROP NOT NULL;

-- executions: add optional projectId for global executions
ALTER TABLE executions ADD COLUMN project_id TEXT REFERENCES projects(id);
-- Backfill: UPDATE executions SET project_id = (SELECT project_id FROM work_items WHERE id = executions.work_item_id);
```

**New table for global agent memory:**

```sql
CREATE TABLE global_memories (
  id TEXT PRIMARY KEY,
  persona_id TEXT NOT NULL REFERENCES personas(id),
  summary TEXT NOT NULL,
  key_decisions TEXT NOT NULL DEFAULT '[]',  -- JSON array
  created_at DATETIME NOT NULL,
  consolidated_into TEXT REFERENCES global_memories(id)
);
```

### 2. System Prompt Assembly — Project Context Injection

**`claude-executor.ts`** (lines 38-75) injects project context:
- `Working directory: ${project.path}` — injected into system prompt
- `project.path` used for `cwd` option, sandbox filesystem paths, allowed write paths
- `PROJECT_ID` passed as env var to MCP server
- Sandbox hook uses `project.path` for bash command validation

**`chat.ts`** (lines 286-299) injects project context for Pico:
- `Project: ${project.name}` + `Working directory: ${project.path}` in system prompt
- `cwd: project?.path ?? process.cwd()` for query execution
- MCP server env: `PROJECT_ID: session.projectId`

**What changes for global agents:**

| Feature | Project Agent | Global Agent |
|---|---|---|
| `cwd` | `project.path` | User's home dir or a configurable global workspace (e.g., `~/.agentops/workspace/`) |
| System prompt | Includes project name, path, description | Omits project context. Includes list of available projects for cross-project queries. |
| MCP server env | `PROJECT_ID: project.id` | `PROJECT_ID: ""` or omit — MCP tools that require projectId would be unavailable or prompt for one |
| Sandbox | Scoped to project.path | Scoped to global workspace or disabled |
| Memory | `getRecentMemories(projectId)` | `getGlobalMemories(personaId)` — new function |

**Implementation approach:** Add a `scope` field to execution/session config:

```typescript
type AgentScope = 
  | { type: 'project'; projectId: string; path: string }
  | { type: 'global'; workspacePath: string };
```

The executor and chat route check `scope.type` and conditionally inject project context.

### 3. Execution History — Unified vs Separate

**Current state:** Executions are implicitly project-scoped via `workItemId`. The Agent Monitor queries `executions` filtered by `projectId` (via work item join).

**Options for global executions:**

**Option A: Unified table with optional `projectId`** (Recommended)
- Add `projectId` column to `executions` (nullable, backfilled from work item)
- Global executions: `projectId = NULL`, `workItemId = NULL`
- Agent Monitor filters: `WHERE projectId = ? OR projectId IS NULL`
- History view can show scope badge ("Project: AgentOps" vs "Global")

**Option B: Separate `global_executions` table**
- Clean separation but duplicates schema
- Agent Monitor needs to query two tables and merge results
- Not worth the complexity

**Verdict:** Option A — unified table. A single execution table with optional project scope is simpler and allows mixed views.

### 4. Pico Chat — Global vs Per-Project

**Current state:** `createChatSession(projectId)` requires a project. Sessions are listed per-project. Pico's system prompt includes project context.

**For global Pico:**

1. **Session creation:** `POST /api/chat/sessions` accepts `{ projectId?: string }`. If omitted, creates a global session (`projectId = NULL`).

2. **Session listing:** 
   - `GET /api/chat/sessions?projectId=xxx` — project sessions (existing)
   - `GET /api/chat/sessions?scope=global` — global sessions
   - `GET /api/chat/sessions` — all sessions (for cross-project views)

3. **System prompt changes:** Global Pico omits project-specific context but includes:
   - List of all projects (name, path, description)
   - "You are not in a specific project context. If the user asks about a project, use the project list to identify it."

4. **MCP tools availability:** Global Pico would have limited MCP tools (no `route_to_state`, `create_tasks` without a project). Could have a `set_project_context` MCP tool that dynamically scopes subsequent operations to a project.

5. **UI changes:** Pico panel currently uses `selectedProjectId` from the store. For global mode:
   - Add a scope toggle in Pico panel header: "Project: AgentOps" / "Global"
   - Or: Pico automatically enters global mode when no project is selected (e.g., on a "Home" or "All Projects" view)

## Recommended Migration Path

### Phase 1: Schema Changes (Low risk)
1. Make `chatSessions.projectId` nullable (migration)
2. Add `projectId` column to `executions` (nullable, backfill from work item)
3. Create `global_memories` table
4. Update indexes for nullable projectId queries

### Phase 2: Runtime Changes
5. Add `AgentScope` type to shared package
6. Update `claude-executor.ts` to handle global scope (skip project context injection)
7. Update `chat.ts` to handle global Pico (nullable projectId, adjusted system prompt)
8. Update MCP server to handle missing PROJECT_ID

### Phase 3: API Changes
9. Update chat session endpoints to support `scope=global`
10. Update execution queries to include global executions
11. Add `getGlobalMemories` function to memory module

### Phase 4: UI Changes (separate research — RES.GLOBAL.NAV/UX)
12. Pico scope toggle
13. Agent Monitor global execution view
14. Navigation restructure (per RES.GLOBAL.NAV)

## Files to Change

**Schema:**
- `packages/backend/src/db/schema.ts` — nullable projectId on chatSessions, add projectId to executions, new globalMemories table
- `packages/backend/src/db/migrations/` — migration files

**Runtime:**
- `packages/shared/src/types.ts` — add AgentScope type
- `packages/backend/src/agent/claude-executor.ts` — conditional project context
- `packages/backend/src/routes/chat.ts` — nullable projectId support
- `packages/backend/src/agent/mcp-server.ts` — handle missing PROJECT_ID
- `packages/backend/src/agent/memory.ts` — add global memory functions

**API:**
- `packages/backend/src/routes/chat.ts` — scope query parameter
- `packages/backend/src/routes/executions.ts` — include global executions
