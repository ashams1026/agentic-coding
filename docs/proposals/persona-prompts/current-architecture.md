# Persona Prompt System — Current Architecture

Reference doc for how persona prompts are stored, assembled, and delivered to the Claude Agent SDK.

---

## 1. Storage — Persona DB Schema

**File:** `packages/backend/src/db/schema.ts` (lines 120-133)

The `personas` table stores the user-controlled system prompt as a TEXT column:

```
systemPrompt: text("system_prompt").notNull().default("")
```

Other relevant persona fields that affect prompt assembly:
- `name`, `description` — used for agent identity
- `model` — which Claude model to use (sonnet, opus, haiku)
- `allowedTools` — JSON array of tool names the agent can use
- `mcpTools` — JSON array of MCP tool names
- `skills` — JSON array of skill/command names
- `subagents` — JSON array of agent IDs this persona can delegate to
- `maxBudgetPerRun` — cost cap per execution

The `systemPrompt` field is freeform text. No structured fields, no template variables, no validation beyond non-empty defaults.

---

## 2. Prompt Editor UI

**File:** `packages/frontend/src/features/persona-manager/system-prompt-editor.tsx`

**Component:** `SystemPromptEditor({ value, onChange })`

A single textarea with:
- Monospace font with line numbers
- Edit / Preview toggle (preview renders Markdown)
- Character count, estimated token count (~4 chars/token), line count
- Placeholder text suggesting a structure: Role definition, Guidelines, Context/Tools, Output Format

No structured fields — all formatting is up to the user. No autocomplete, no variable insertion, no template support.

---

## 3. Prompt Assembly — Task Execution Path

**File:** `packages/backend/src/agent/claude-executor.ts` (lines 25-97)

**Function:** `buildSystemPrompt(persona, task, project) => string`

Assembles sections into an array, then joins with `"\n\n"`:

### Assembly order:

| # | Section | Source | Conditional? |
|---|---------|--------|-------------|
| 1 | **User's system_prompt** | `persona.systemPrompt` | Yes — only if non-empty |
| 2 | **Project context** | `project.name`, `project.path`, `project.settings.description`, `project.settings.patterns` | Always included; description and patterns are optional sub-fields |
| 3 | **Work item context** | `task.context.title`, `.id`, `.state`, `.description`, parent chain, inherited context | Always included |
| 4 | **Sandbox rules** | `buildSandboxPrompt(project.path)` from `@agentops/core` | Always included |
| 5 | **Execution history** | `task.executionHistory` — past outcomes + summaries, rejection details | Only if history exists |

### Section format details:

**Project context** (section 2):
```
## Project: {project.name}
Working directory: {project.path}
Description: {project.settings.description}     // if exists
Key patterns: {project.settings.patterns}        // if exists
```

**Work item context** (section 3):
```
## Work Item: {task.context.title}
ID: {task.context.id}
State: {task.context.state}
Description: {task.context.description}
Parent: {parentTitle} (ID: {parentId})           // if has parent
Inherited context: {inherited}                   // if exists
```

**Sandbox rules** (section 4) — from `packages/core/src/sandbox.ts` line 163:
```
## Sandbox Rules
You are working inside the project directory: {projectRoot}
You MUST NOT:
- Read/write files outside {projectRoot}
- Run destructive system commands
...
```

**Execution history** (section 5):
```
## Previous Executions
Attempt 1: {outcome} — {summary}
Attempt 2 (rejected): {rejectionDetails} — {summary}
...
```

**Final join:** `sections.join("\n\n")`

---

## 4. Prompt Assembly — Pico Chat Path

**File:** `packages/backend/src/routes/chat.ts` (lines 274-313)

Pico's prompt is assembled differently from task execution:

### Assembly order:

| # | Section | Source | Conditional? |
|---|---------|--------|-------------|
| 1 | **Pico's system_prompt** | `pico.systemPrompt` | Yes — only if non-empty |
| 2 | **Skill file** | `packages/backend/src/agent/pico-skill.md` (loaded at module startup) | Yes — only if file exists |
| 3 | **Project context** | Project name, path, description | Yes — only if a project is selected |
| 4 | **Chat personality** | Hardcoded instructions in chat.ts | Always included |

**Skill file** (`pico-skill.md`): Contains project knowledge — workflow states, persona roles, architecture overview, key files. Loaded once at server startup via `fs.readFileSync`.

**Chat personality instructions** (hardcoded):
```
## Chat Instructions
You are Pico, the user's friendly project assistant...
```

### Key differences from executor path:
- **No work item context** — chat is not tied to a specific task
- **No sandbox rules** — Pico doesn't execute code directly
- **No execution history** — no prior attempts to reference
- **Has skill file** — static project knowledge document
- **Has personality instructions** — tone/behavior guidance

### Conversation history handling:
Chat history is passed as the `prompt` parameter (not part of the system prompt):
```typescript
const conversationLines = history.map(
  (msg) => `${msg.role === "user" ? "User" : "Pico"}: ${msg.content}`,
);
const prompt = conversationLines.join("\n\n");
```

---

## 5. SDK Delivery — AgentDefinition.prompt

**File:** `packages/backend/src/agent/claude-executor.ts` (lines 515-535)

The assembled system prompt becomes `AgentDefinition.prompt`:

```typescript
agents[agentId] = {
  description: persona.description,
  prompt: isPrimary
    ? buildSystemPrompt(persona, task, project)   // full assembly
    : (persona.systemPrompt || persona.description), // subagents: raw prompt only
  tools: persona.allowedTools,
  model: resolveModel(persona.model),
  maxTurns: isPrimary ? 30 : 15,
  skills: persona.skills,  // if any
};
```

This is passed to the SDK's `query()` call:
```typescript
const q = query({
  prompt,   // <- work item description / user message
  options: {
    agents,   // <- { agentId: { prompt, tools, model, ... } }
    agent: agentId,
  },
});
```

**Note:** Primary agents get the fully assembled prompt (all 5 sections). Subagents only get their raw `systemPrompt` or `description` — no project/task/sandbox/history injection.

For Pico chat, a similar pattern:
```typescript
const agentDef = {
  description: pico.description,
  prompt: systemSections.join("\n\n"),
  tools: pico.allowedTools,
  model: MODEL_MAP[pico.model],
  maxTurns: 15,
};
query({ prompt, options: { agent: "pico", agents: { pico: agentDef } } });
```

---

## 6. User Control vs. System Injection

| Component | User controls? | Source | Injected into |
|-----------|---------------|--------|---------------|
| `systemPrompt` (persona editor textarea) | **Yes** | Persona DB record | Both paths |
| Project name / path / description | No | Project settings | Both paths |
| Project patterns | No | Project settings | Executor only |
| Work item title / description / state | No | Work item record | Executor only |
| Parent chain / inherited context | No | Work item hierarchy | Executor only |
| Sandbox rules | No | `buildSandboxPrompt()` in `@agentops/core` | Executor only |
| Execution history | No | Previous execution records | Executor only (if exists) |
| Pico skill file | No | `pico-skill.md` on disk | Pico chat only |
| Chat personality instructions | No | Hardcoded in `chat.ts` | Pico chat only |
| Project memories | No | `projectMemories` DB table | **Neither** — on-demand via MCP tool |

---

## 7. Project Memories — On-Demand Only

**File:** `packages/backend/src/agent/memory.ts`

Memories are NOT injected into the initial system prompt. They are:
- Generated when top-level work items transition to "Done"
- Stored in `projectMemories` table (summary, filesChanged, keyDecisions)
- Consolidated when >50 memories exist
- Retrieved on-demand via `getRecentMemories(projectId, tokenBudget)`
- Accessed via the `get_context` MCP tool with `includeMemory: true` flag

Agents must explicitly call `get_context` to retrieve memories. This is a deliberate design — keeps the initial prompt lean and lets agents pull context only when needed.

---

## Architecture Diagram

```
User edits prompt                    System injects context
        |                                    |
        v                                    v
  +-----------+    +---------------------------------------------------+
  | Persona   |    | buildSystemPrompt()                               |
  | Editor    |--->| 1. persona.systemPrompt    (user's text)          |
  | (textarea)|    | 2. Project context         (name, path, desc)     |
  +-----------+    | 3. Work item context        (title, state, desc)   |
                   | 4. Sandbox rules            (filesystem limits)    |
                   | 5. Execution history        (if retrying)          |
                   +---------------------------------------------------+
                                     |
                                     v
                            AgentDefinition.prompt
                                     |
                                     v
                            SDK query({ prompt, options: { agents } })
```

```
                   +---------------------------------------------------+
                   | Pico Chat assembly                                 |
  Pico persona --->| 1. pico.systemPrompt       (user's text)          |
                   | 2. pico-skill.md            (project knowledge)    |
                   | 3. Project context          (name, path, desc)     |
                   | 4. Chat instructions        (personality/tone)     |
                   +---------------------------------------------------+
                                     |
                                     v
                            AgentDefinition.prompt
                                     |
                         conversation history as `prompt`
                                     |
                                     v
                            SDK query({ prompt, options: { agents } })
```
