# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-01 02:20 PDT — Review: SDK.SA.3 (approved)

**Reviewed:** Nested subagent view in `subagent-card.tsx` and `agent-history.tsx`.
- `SubagentCard`: collapsible with avatar, name, outcome badge, duration, cost, 200px TerminalRenderer — collapsed by default
- Tree connector via `ml-6 border-l-2 border-muted` — clean indentation
- `childExecutionMap` groups by `parentExecutionId`, passed to HistoryRow
- Top-level history filters out children (`!e.parentExecutionId`) — no duplicate display
- "Subagents (N)" section header in expanded view
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 02:15 PDT — SDK.SA.3: Nested subagent view in agent monitor

**Done:** Created `SubagentCard` component — collapsible card with persona avatar, name, "subagent" badge, outcome badge, duration, cost. Expands to show 200px TerminalRenderer. Styled with `ml-6 border-l-2` tree connector. Integrated into `HistoryRow` expanded section: `childExecutionMap` groups executions by `parentExecutionId`, children rendered after terminal renderer. Top-level history list filters out child executions (`!e.parentExecutionId`) so they only appear nested. Subagent count shown in section header.
**Files:** `packages/frontend/src/features/agent-monitor/subagent-card.tsx` (new), `packages/frontend/src/features/agent-monitor/agent-history.tsx`

---

## 2026-04-01 02:00 PDT — Review: SDK.SA.2 (approved)

**Reviewed:** Subagent invocation tracking across schema, shared types, executor, and WS client.
- `parentExecutionId` column added with migration 0006, serialized in API — ready for child record linking
- SubagentStart/SubagentStop hooks broadcast WS events with parent execution ID and resolved agent name
- WS event types (`subagent_started`/`subagent_completed`) added to all 4 shared locations + frontend listener
- Persona map uses `p.id as string` to resolve agent names from IDs — handles branded type correctly
- DB record creation deferred (pragmatic — hooks are fire-and-forget, no error handling context)
- UI integration correctly scoped to SDK.SA.3
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 01:55 PDT — SDK.SA.2: Subagent invocation tracking

**Done:** Added SubagentStart/SubagentStop hooks for tracking when agents spawn subagents. Backend: `parentExecutionId` column on executions table (migration 0006), added to shared `Execution` entity and API serializer. New WS event types `subagent_started`/`subagent_completed` in shared ws-events (interfaces, union, map). Frontend: WS client listeners initialized. `buildSubagentHooks()` factory in executor broadcasts WS events with parent execution ID and agent name (resolved from persona map). Hooks wired into query() options.
**Files:** `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0006_groovy_red_wolf.sql`, `packages/shared/src/entities.ts`, `packages/shared/src/ws-events.ts`, `packages/backend/src/routes/executions.ts`, `packages/backend/src/agent/claude-executor.ts`, `packages/frontend/src/api/ws-client.ts`

---

## 2026-04-01 01:35 PDT — Review: SDK.SA.1 (approved)

**Reviewed:** Personas as SDK subagents across `types.ts`, `execution-manager.ts`, `claude-executor.ts`.
- All personas mapped to `AgentDefinition` entries in `agents` option — primary gets `buildSystemPrompt` (30 turns), subagents get their own `systemPrompt` (15 turns)
- Tools/skills mapped per-persona — each subagent has its own tool access
- Fallback for empty `allPersonas` ensures primary persona always defined
- MCP servers correctly not per-subagent (process-level, shared)
- Execution manager queries all personas and serializes cleanly
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 01:30 PDT — SDK.SA.1: Define personas as SDK subagents

**Done:** All project personas are now passed as `AgentDefinition` entries in the `agents` option of `query()`. Primary persona gets full system prompt (via `buildSystemPrompt`), 30 max turns. Other personas get their own system prompt, 15 max turns, and are available as subagents via the `Agent` tool. Added `allPersonas: Persona[]` to `SpawnOptions`. Execution manager queries all personas, serializes them, and passes through `runExecutionStream` to the executor. Fallback ensures primary persona is always present even if `allPersonas` is empty.
**Files:** `packages/backend/src/agent/types.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/agent/claude-executor.ts`

---

## 2026-04-01 01:20 PDT — Review: SDK.SO.5 (approved)

**Reviewed:** Structured Router output documentation in `docs/workflow.md` and `docs/personas.md`.
- workflow.md: new "Structured Output" subsection with JSON example, field table, storage/UI explanation
- personas.md: Router description updated with `isRouter` flag, comparison table gains "Output format" row
- All three task requirements covered: JSON schema, parsing mechanism, confidence field meaning
- Accurate to implementation (ROUTER_OUTPUT_SCHEMA, isRouter flag)
- **Verdict: approved.**

---

## 2026-04-01 01:15 PDT — SDK.SO.5: Update docs with structured Router output

**Done:** Updated `docs/workflow.md`: added "Structured Output" subsection under Router with JSON schema example, field descriptions table, storage/UI notes. Updated `isRouter` in Router Configuration settings. Updated `docs/personas.md`: expanded Router description with `isRouter` flag and structured output details, added "Output format" row to Router comparison table.
**Files:** `docs/workflow.md`, `docs/personas.md`

---

## 2026-04-01 01:05 PDT — Review: SDK.SO.4 (approved)

**Reviewed:** Router structured output e2e test results at `tests/e2e/results/router-structured-output.md`.
- 5/13 PASS, 0 FAIL, 8 SKIP — SKIPs justified: seeded Router executions have null structuredOutput
- Fallback behavior verified: Router executions display as standard agent_completed (no card)
- Step 10 comparison test confirms conditional rendering — non-Router events have no card styling
- 5 screenshots captured, re-testing notes actionable
- **Verdict: approved.**

---

## 2026-04-01 01:00 PDT — SDK.SO.4: Run Router structured output e2e test

**Done:** Executed SDK.SO.3 test plan. 5/13 PASS, 0 FAIL, 8 SKIP. All SKIPs because seeded Router executions have `structuredOutput: null` (predate SDK.SO.1). Verified: Router rows appear in history, expand correctly (no card for null data), activity feed shows Router executions as standard `agent_completed`, non-Router events have no decision card styling. 5 screenshots captured.
**Files:** `tests/e2e/results/router-structured-output.md`, `tests/e2e/results/rso-01-agents-page.png`, `tests/e2e/results/rso-02-history-router-rows.png`, `tests/e2e/results/rso-03-router-expanded-no-card.png`, `tests/e2e/results/rso-04-activity-feed.png`, `tests/e2e/results/rso-05-full-page.png`

---

## 2026-04-01 00:50 PDT — Review: SDK.SO.3 (approved)

**Reviewed:** E2E test plan at `tests/e2e/plans/router-structured-output.md`.
- 13 steps across 3 parts covering agent monitor card, activity feed events, visual quality
- Follows template format with visual inspection protocol and screenshot checkpoints
- Handles data dependency with SKIP guidance for seeded data without structuredOutput
- Step 10 comparison test verifies conditional rendering (non-Router events don't show cards)
- **Verdict: approved.**

---

## 2026-04-01 00:45 PDT — SDK.SO.3: E2E test plan for Router structured output

**Done:** Created `tests/e2e/plans/router-structured-output.md` — 13 steps across 3 parts: agent monitor history card (5), activity feed events (5), visual quality (3). Covers state badge coloring, confidence dot, reasoning text, compact vs full variants, fallback for null structuredOutput. Notes data dependency — seeded executions predate the feature.
**Files:** `tests/e2e/plans/router-structured-output.md`

---

## 2026-04-01 00:35 PDT — Review: SDK.SO.2 (approved)

**Reviewed:** Structured Router decision display across backend storage, component, and two integration points.
- `RouterDecisionCard`: full (card) + compact (inline) variants with color-coded state badge from WORKFLOW.states, confidence dot (emerald/amber/red)
- `isRouterDecision()` type guard validates all 3 fields before rendering — safe against malformed data
- Backend: `structured_output` column + migration, stored from ResultEvent, serialized in API
- Agent history: full card shown above terminal renderer for Router executions
- Activity feed: Router executions with structured output render as `router_decision` with compact card + reasoning
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 00:25 PDT — SDK.SO.2: Display structured Router decisions in UI

**Done:** Full-stack structured output display. Backend: added `structured_output` column to executions schema (migration 0005), stored from `ResultEvent.structuredOutput` in execution-manager, included in API serializer. Shared: added `structuredOutput` to `Execution` entity. Frontend: created `RouterDecisionCard` component with full (card with state badge, reasoning, confidence dot) and compact (inline badge+dot) variants. Integrated into agent-history expanded view (shows above terminal renderer for Router executions). Activity feed: Router executions with structured output render as `router_decision` events with compact card instead of generic `agent_completed`.
**Files:** `packages/backend/src/db/schema.ts`, `packages/backend/drizzle/0005_futuristic_chamber.sql`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/routes/executions.ts`, `packages/shared/src/entities.ts`, `packages/frontend/src/features/agent-monitor/router-decision-card.tsx` (new), `packages/frontend/src/features/agent-monitor/agent-history.tsx`, `packages/frontend/src/features/activity-feed/activity-feed.tsx`

---

## 2026-04-01 00:10 PDT — Review: SDK.SO.1 (approved)

**Reviewed:** Structured output for Router persona across 7 files.
- `isRouter` flag on `PersonaSettings` — clean addition to shared types
- `ROUTER_OUTPUT_SCHEMA` — correct JSON schema with required fields + confidence enum
- `outputFormat` conditionally passed via spread — no impact on non-Router personas
- `structured_output` captured from SDK result into `ResultEvent.structuredOutput`
- All 4 Router persona creation sites updated with `isRouter: true`
- Router still uses `route_to_state` MCP tool — structured output is additive for UI display (SDK.SO.2)
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 00:00 PDT — SDK.SO.1: Structured output for Router persona

**Done:** Added `isRouter?: boolean` to `PersonaSettings` in shared entities. Added `ROUTER_OUTPUT_SCHEMA` (nextState, reasoning, confidence) to `claude-executor.ts`. When persona has `isRouter: true`, passes `outputFormat: { type: "json_schema", schema }` to `query()`. Captures `structured_output` from SDK result messages into `ResultEvent.structuredOutput`. Updated Router persona settings in all 4 locations: `router.ts`, `seed.ts`, `seed-demo.ts`, `default-personas.ts`.
**Files:** `packages/shared/src/entities.ts`, `packages/backend/src/agent/types.ts`, `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/agent/router.ts`, `packages/backend/src/db/seed.ts`, `packages/backend/src/db/seed-demo.ts`, `packages/backend/src/db/default-personas.ts`

---

## 2026-03-31 23:55 PDT — Review: SDK.HK.8 (approved)

**Reviewed:** SDK Hooks section added to `docs/architecture.md`.
- All 7 hooks documented in table with matchers, purpose, and what they replace — matches implementation exactly (lines 399-407)
- Architecture diagram accurately shows factory functions → query() wiring
- Audit trail integration table covers all 3 functions with correct fields
- Sanitization note included for Bash commands
- Placed logically between Agent Execution Engine and File Checkpointing
- **Verdict: approved.**

---

## 2026-03-31 23:50 PDT — SDK.HK.8: Update architecture docs with hooks

**Done:** Added "SDK Hooks" section to `docs/architecture.md` before File Checkpointing. Documents: registered hooks table (7 hooks across 6 event types with matchers, purpose, and what they replace), hook architecture diagram showing factory functions and query() wiring, audit trail integration table (3 audit functions with fields), Bash command sanitization note.
**Files:** `docs/architecture.md`

---

## 2026-03-31 23:40 PDT — Review: SDK.HK.7 (approved)

**Reviewed:** File changes panel e2e test results at `tests/e2e/results/agent-monitor-files.md`.
- 4/16 PASS, 0 FAIL, 12 SKIP — SKIPs justified: real-time WS panel requires live agent, no active executions
- Auto-hide behavior verified (PASS): panel correctly absent when no file_changed events
- 4 screenshots captured covering live empty state, history table, full page
- Re-testing notes are actionable with clear 4-step instructions for live testing
- **Verdict: approved.**

---

## 2026-03-31 23:35 PDT — SDK.HK.7: Run agent monitor file tracking e2e test

**Done:** Executed the SDK.HK.6 test plan. 4/16 PASS, 0 FAIL, 12 SKIP. All SKIPs due to no active agent executions — the file changes panel requires real-time `file_changed` WS events which only fire during live agent runs with the FileChanged hook. Verified: panel auto-hides when empty (PASS), agent monitor layout clean (PASS), history tab shows 11 legacy executions. 4 screenshots captured.
**Files:** `tests/e2e/results/agent-monitor-files.md`, `tests/e2e/results/amf-01-live-empty.png`, `tests/e2e/results/amf-02-history-table.png`, `tests/e2e/results/amf-03-live-no-agents.png`, `tests/e2e/results/amf-04-full-page.png`
**Notes:** Parts 2-4 need re-testing with a live agent execution.

---

## 2026-03-31 23:25 PDT — Review: SDK.HK.6 (approved)

**Reviewed:** E2E test plan at `tests/e2e/plans/agent-monitor-files.md`.
- 16 steps across 5 parts covering all task requirements: file display, badge count, file paths, visual verification
- Follows template format exactly with visual inspection protocol and screenshot checkpoints
- Properly handles real-time WS dependency with SKIP guidance for steps needing active agents
- Covers edge cases: auto-hide, deduplication, execution switching state cleanup, collapse/expand
- **Verdict: approved.**

---

## 2026-03-31 23:20 PDT — SDK.HK.6: E2E test plan for file changes panel

**Done:** Created `tests/e2e/plans/agent-monitor-files.md` — 16 steps across 5 parts: panel visibility/auto-hide (4), content/file entries (5), collapse/expand (3), execution switching (2), visual quality (2). Notes real-time WS dependency — panel only appears during active executions with FileChanged hook. Covers deduplication, badge count, icon coloring, dark theme.
**Files:** `tests/e2e/plans/agent-monitor-files.md`

---

## 2026-03-31 23:10 PDT — Review: FX.PROJ1 (approved)

**Reviewed:** Stale project ID fallback in `use-selected-project.ts` and `use-projects.ts`.
- `retry: false` on `useProject` — fails fast on 404 instead of 3 retries
- `useEffect` detects `isError` + auto-selects first available project — no infinite loop risk
- Also handles null `selectedProjectId` (first-load with empty store) — auto-selects
- Zustand `setSelectedProjectId` persists fix to localStorage — durable across reloads
- Build passes
- **Verdict: approved.**

---

## 2026-03-31 23:05 PDT — FX.PROJ1: Fix stale project ID fallback

**Done:** Updated `use-selected-project.ts` to detect stale project IDs and auto-fallback. Added `useProjects()` to get available projects and `useEffect` that resets to first available project when: (a) no project selected and projects exist, or (b) selected project returns error (404) and projects exist. Added `retry: false` to `useProject` query in `use-projects.ts` so stale IDs fail fast instead of retrying 3 times.
**Files:** `packages/frontend/src/hooks/use-selected-project.ts`, `packages/frontend/src/hooks/use-projects.ts`

---

## 2026-03-31 22:50 PDT — Review: SDK.HK.5 (approved)

**Reviewed:** File changes panel UI in `file-changes-panel.tsx` and integration in `terminal-renderer.tsx`.
- Collapsible section with badge count, auto-hides when empty, clears state on execution switch
- Each entry: icon (FilePlus/FileText/FileX), file path (monospace, truncated), change type label (color-coded), timestamp
- Real-time via `file_changed` WS subscription with deduplication by path
- Follows conventions: named export, shadcn Badge, cn(), lucide-react icons, dark theme
- Build passes
- **Verdict: approved.**

---
