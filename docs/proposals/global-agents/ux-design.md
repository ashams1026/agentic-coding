# Proposal: Global Agent Chat and Scheduling UX

**Task:** RES.GLOBAL.UX
**Date:** 2026-04-02
**Depends on:** RES.GLOBAL.DATA (data model — approved), RES.GLOBAL.NAV (navigation — approved)
**Related:** RES.WORKFLOW.* (custom workflows), RES.SCHED.* (scheduling), RES.CHAT.* (agent chat)

## Problem

Global agents operate outside project context. The current UI has no mechanism to start, schedule, or interact with agents that aren't tied to a project's workflow. This proposal designs the UX flows for: (1) starting conversations with global agents, (2) scheduling/triggering global agent runs, (3) displaying global executions in the Agent Monitor, (4) mid-conversation project context switching, and (5) global agent artifact storage.

## Current State

- **Pico chat panel** — floating panel (bottom-right), sessions tied to `selectedProjectId`. System prompt includes project context (name, path, cwd). No scope toggle.
- **Agent Monitor** — shows executions filtered by `selectedProjectId`. Each execution is tied to a work item, which is always project-scoped.
- **Dispatch** — `dispatchForState()` in `dispatch.ts` requires a `workItemId` to find the project and persona assignment. No concept of standalone/global dispatch.
- **Triggers** — not yet implemented in the schema. Referenced in PLANNING.md but no tables or backend routes exist.
- **Command palette** — 6 navigation items + work item search + quick actions. No agent-related commands.

## Investigation

### 1. Where Does a User Start a Conversation with a Global Agent?

**Options evaluated:**

**Option A: Pico panel with scope toggle** (Recommended for Phase 1)
- Pico already exists as a floating chat panel. Add a scope indicator in the panel header.
- When `selectedProjectId = null` (per RES.GLOBAL.NAV "All Projects" mode), Pico automatically enters global mode.
- When a project is selected, Pico is project-scoped (current behavior).
- User can override: a toggle or dropdown in the Pico header lets them switch scope without changing the sidebar project selector.
- **Persona selection:** Pico currently uses a built-in assistant persona. For global mode, add a persona picker in the panel header (dropdown showing all personas). This lets the user chat with any persona in global context — not just the default assistant.

**Option B: Dedicated full-page agent chat** (Phase 2, per RES.CHAT.UX)
- A full-page `/chat` route with conversation list sidebar, persona picker, and rich message rendering.
- Global personas appear in the conversation sidebar's "Global" section.
- Project-scoped personas appear under their respective project.
- This is the long-term vision but requires significant new UI (RES.CHAT.UX covers this separately).

**Option C: Command palette action**
- `Cmd+K` → "Chat with [Persona Name]" → opens Pico panel pre-configured with that persona.
- Good as a supplemental entry point, not a primary one.
- **Recommendation:** Add this as a quick action alongside Option A.

**Verdict:** Phase 1 uses **Option A** (Pico with scope toggle + persona picker) + **Option C** (command palette quick actions). Phase 2 introduces **Option B** (full-page chat, designed separately in RES.CHAT.UX).

### Pico Panel Header — Proposed Layout

```
┌──────────────────────────────────────┐
│ 🐕 Pico   [Global ▼]  [Engineer ▼]  │  ← scope + persona selectors
│────────────────────────────────────  │
│                                      │
│  (chat messages)                     │
│                                      │
│────────────────────────────────────  │
│  [Type a message...]        [Send]   │
└──────────────────────────────────────┘

Scope selector options:
  • "Global" (when selectedProjectId = null)
  • "Project: AgentOps"
  • "Project: WebApp"
  
Persona selector options:
  • "Pico (Assistant)" — default
  • "Engineer"
  • "Code Reviewer"
  • "PM"
  • (all available personas)
```

When the user picks a persona, Pico's system prompt changes to that persona's configured prompt. When the user picks a scope, the chat session's projectId changes accordingly.

### 2. How Does Scheduling/Triggering a Global Agent Work?

**Current state:** No trigger/schedule system exists in the codebase. The `dispatch.ts` module is purely state-transition-driven (work item enters a state → persona assigned to that state runs).

**For global agent scheduling, two approaches:**

**Approach A: Standalone execution dispatch** (Recommended)
- A new backend endpoint: `POST /api/executions/run` that accepts `{ personaId, prompt, projectId? }`.
- If `projectId` is provided → project-scoped execution (agent gets project context).
- If `projectId` is omitted → global execution (agent runs without project context, uses global workspace path per RES.GLOBAL.DATA).
- No work item required. The execution record has `workItemId = null`, `projectId = null`.
- This is the foundation for both ad-hoc global runs and scheduled runs.

**Approach B: Schedule records** (Built on top of Approach A)
- A `schedules` table (not yet designed — covered in RES.SCHED.INFRA): `{ id, name, personaId, projectId?, prompt, cronExpression, enabled, lastRunAt, nextRunAt }`.
- A scheduler service checks `nextRunAt` and calls the `POST /api/executions/run` endpoint internally.
- Global schedules have `projectId = null`.
- **UI:** Schedule management is scoped to Settings (global schedules) or project settings (project schedules). Covered in detail by RES.SCHED.UX.

**For this proposal (UX only):** The user triggers a global agent run from:

1. **Pico panel** — chatting with a global persona creates an interactive session (conversational, streaming).
2. **Command palette** — "Run [Persona] on [prompt]" creates a standalone execution (fire-and-forget, visible in Agent Monitor).
3. **Agent Monitor** — "New Run" button with persona picker, prompt input, and optional project scope. This is the primary entry point for ad-hoc non-conversational runs.
4. **Schedules page** (future, per RES.SCHED.UX) — configured recurring runs.

### Agent Monitor — "New Run" Flow

```
┌─────────────────────────────────────────────────────┐
│  Agent Monitor                    [+ New Run]       │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  (When "New Run" is clicked, a modal/drawer opens:) │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Start Agent Run                            │    │
│  │                                             │    │
│  │  Persona:  [Code Reviewer ▼]                │    │
│  │  Scope:    [○ Global  ● Project: AgentOps]  │    │
│  │  Prompt:                                    │    │
│  │  ┌───────────────────────────────────────┐  │    │
│  │  │ Review all files changed in the last  │  │    │
│  │  │ 24 hours for security issues.         │  │    │
│  │  └───────────────────────────────────────┘  │    │
│  │                                             │    │
│  │  Budget limit: [$1.00    ]                  │    │
│  │                                             │    │
│  │              [Cancel]  [Run Agent]           │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 3. How Does the Agent Monitor Display Global vs Project-Scoped Executions?

Per RES.GLOBAL.NAV, the Agent Monitor is scope-aware:
- When a project is selected → shows that project's executions (current behavior).
- When "All Projects" is selected → shows all executions with scope badges.

**Scope badge design:**

```
┌──────────────────────────────────────────────────────┐
│  Active Agents                                       │
│                                                      │
│  ● Engineer     [AgentOps]   Implementing feature..  │
│  ● Reviewer     [WebApp]     Reviewing PR #42...     │
│  ● Auditor      [Global]     Scanning for vulns...   │
│  ✓ PM           [AgentOps]   Completed 2m ago        │
│                                                      │
│  ─────────────────────────────────────────────────   │
│  Filter: [All ▼]  ← dropdown: All / Project / Global │
└──────────────────────────────────────────────────────┘
```

**Badge styling:**
- Project badges: muted background with project name (e.g., `bg-muted text-muted-foreground`)
- Global badge: distinct color (e.g., `bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300`) to visually distinguish from project-scoped runs

**Filter options:**
- **All** — all executions (default in global scope)
- **[Project Name]** — only that project's executions (one option per project)
- **Global Only** — only global executions

**Interaction:**
- Clicking a scope badge in an execution row switches the project selector to that project (for project-scoped) or "All Projects" (for global). This lets users quickly navigate to the context of a specific execution.
- The selected execution in the left sidebar shows full details in the right panel, regardless of scope.

### 4. Can a Global Agent Be "Invited Into" a Project Context Mid-Conversation?

**Yes, with explicit context injection.** This is a key interaction pattern for global agents.

**How it works:**

**Option A: MCP tool — `set_project_context`** (Recommended)
- Per RES.GLOBAL.DATA, global Pico receives a list of all projects in its system prompt.
- An MCP tool `set_project_context(projectId)` is available to global agents.
- When the user says "now look at project AgentOps", the agent calls `set_project_context("proj_agentops")`.
- This injects project-specific context into subsequent messages: cwd changes to `project.path`, project-scoped MCP tools become available (`route_to_state`, `create_tasks`), memory retrieval includes that project's memories.
- The Pico panel header shows an updated scope indicator: `Global → AgentOps` or a breadcrumb like `Global > AgentOps`.
- The context switch is **per-session, not global** — other panels and pages still reflect the sidebar's project selector.

**Option B: User-initiated scope switch in panel header**
- User clicks the scope dropdown in Pico header and switches from "Global" to "Project: AgentOps".
- This changes the session's projectId and injects project context into the next message.
- Simpler but less conversational — the user has to use UI controls instead of natural language.

**Verdict:** Both options should be available. The MCP tool (Option A) enables natural-language context switching. The UI dropdown (Option B) provides an explicit fallback. They achieve the same result — updating the session's project context.

**Edge cases:**
- **Switching projects mid-conversation:** The agent retains conversation history but context shifts. A system message is injected: "Context switched to project: AgentOps."
- **Switching back to global:** `set_project_context(null)` or user selects "Global" in the dropdown. Project-scoped tools become unavailable again.
- **Multiple project references:** The agent can call `set_project_context` multiple times in one session. Each call updates the active context. The conversation history contains messages from multiple project contexts — the system messages serve as markers.

### Flow Diagram: Mid-Conversation Project Switch

```
User: "What projects do I have?"
Agent: "You have 3 projects: AgentOps, WebApp, DataPipe."

User: "Look at AgentOps and tell me what needs attention."
Agent: [calls set_project_context("proj_agentops")]
       [system injects: project context for AgentOps]
Agent: "AgentOps has 4 items in review, 2 agents running, 
        and 1 failed execution from 30min ago..."

User: "Now check WebApp's cost for the week."
Agent: [calls set_project_context("proj_webapp")]
       [system injects: project context for WebApp]
Agent: "WebApp spent $3.42 this week across 12 executions..."

User: "Go back to global view."
Agent: [calls set_project_context(null)]
Agent: "Back to global context. Total cost across all projects: $8.15..."
```

### 5. How Do Global Agent Results/Artifacts Get Stored?

**Problem:** Project-scoped agents write to `project.path` on disk and reference files relative to that directory. Global agents have no project directory.

**Approach:**

**Global workspace directory:**
- Per RES.GLOBAL.DATA, global agents use a configurable workspace path (e.g., `~/.agentops/workspace/`).
- This is their `cwd` and sandbox root.
- Any files the agent creates (reports, scripts, analysis results) go here.

**What goes in the global workspace:**
- Agent-generated reports and documents
- Temporary analysis files
- Exported data or summaries

**What doesn't need a directory:**
- Conversational results (stored in chat session history)
- Execution metadata (stored in `executions` table)
- Global memories (stored in `global_memories` table per RES.GLOBAL.DATA)

**Organization within the global workspace:**
```
~/.agentops/workspace/
  runs/
    2026-04-02_0930_code-reviewer/    ← per-execution directory
      report.md
      findings.json
    2026-04-02_1000_auditor/
      security-scan.md
  shared/
    templates/                         ← agent-maintained templates
    data/                              ← persistent agent data
```

Each execution gets a timestamped directory under `runs/`. The agent's `cwd` is set to its execution-specific directory. A `shared/` directory persists across runs for global agents that need to maintain state.

**UI display:**
- In the Agent Monitor execution detail view, show the execution's workspace path.
- File changes and artifacts link to the global workspace rather than a project directory.
- If the agent created files, show them in a "Files" tab on the execution detail panel (same UI as project execution file changes, just different base path).

## Interaction with Custom Workflows (RES.WORKFLOW.*)

Global agents and custom workflows intersect in three ways:

1. **Global workflow execution:** A global agent could run a workflow without a project. Work items would need to be created in a temporary or designated context. **Recommendation:** Defer this complexity. For Phase 1, workflows remain project-scoped. Global agents can be invited into a project context mid-conversation to interact with workflows (via `set_project_context`).

2. **Workflow-triggered global agents:** A custom workflow step could invoke a global persona (e.g., a "Security Audit" step that uses a global auditor persona with access to all projects). The persona assignment would reference a global persona, and the execution would inherit the work item's project context even though the persona is global. **This already works** — personas have no projectId FK, so any persona can be assigned to any project's workflow state.

3. **Global scheduling of workflow runs:** A schedule could trigger an entire workflow for a specific project (e.g., "run the Code Review Pipeline on project X every night"). This is a scheduled dispatch, not a global agent — the execution is project-scoped. Covered by RES.SCHED.UX.

## Summary of Entry Points

| Entry Point | Type | Scope | Phase |
|---|---|---|---|
| Pico panel (scope toggle) | Conversational | Global or project | 1 |
| Pico panel (persona picker) | Conversational | Follows scope | 1 |
| Command palette ("Chat with...") | Conversational | Opens Pico with persona | 1 |
| Agent Monitor "New Run" button | Fire-and-forget | Global or project | 1 |
| Command palette ("Run agent...") | Fire-and-forget | Global or project | 1 |
| Full-page agent chat (`/chat`) | Conversational | Global or project | 2 |
| Schedules page | Recurring | Global or project | 2 |
| Persona Manager "Chat" button | Conversational | Opens Pico with persona | 1 |

## Files to Change

**Pico panel:**
- `packages/frontend/src/features/pico/chat-panel.tsx` — Add scope dropdown and persona picker to header. Pass scope to session creation.
- `packages/frontend/src/features/pico/pico-store.ts` — Add `selectedPersonaId` and `scopeOverride` state.
- `packages/frontend/src/hooks/use-pico-chat.ts` — Pass scope and persona to backend API.

**Backend — new endpoint:**
- `packages/backend/src/routes/executions.ts` — Add `POST /api/executions/run` for ad-hoc execution dispatch.

**Backend — MCP tool:**
- `packages/backend/src/agent/mcp-server.ts` — Add `set_project_context` tool for global agents.

**Agent Monitor:**
- `packages/frontend/src/features/agent-monitor/active-agent-sidebar.tsx` — Add scope badges to execution entries.
- `packages/frontend/src/features/agent-monitor/agent-monitor-layout.tsx` — Add "New Run" button and modal. Add scope filter dropdown.

**Command palette:**
- `packages/frontend/src/features/command-palette/command-palette.tsx` — Add "Chat with [Persona]" and "Run [Persona]" quick actions.

**Backend — chat route:**
- `packages/backend/src/routes/chat.ts` — Accept `personaId` in session creation. Pass persona system prompt when not using default Pico persona.

## Decision Summary

| Decision | Choice | Rationale |
|---|---|---|
| Primary global chat entry | Pico panel with scope toggle + persona picker | Minimal new UI, leverages existing chat infrastructure |
| Ad-hoc global run entry | Agent Monitor "New Run" button | Natural location — users go here to see and manage runs |
| Agent Monitor display | Mixed view with scope badges + filter | Consistent with RES.GLOBAL.NAV recommendation |
| Mid-conversation context switch | MCP tool + UI dropdown (both) | Natural language via tool, explicit fallback via UI |
| Global artifact storage | `~/.agentops/workspace/runs/<execution>/` | Clean per-execution isolation, configurable base path |
| Workflow interaction | Global agents use `set_project_context` to interact with project workflows | Avoids premature complexity of project-less workflows |
| Scheduling | Built on `POST /api/executions/run` + schedule records | Clean separation; scheduling UX deferred to RES.SCHED.UX |
