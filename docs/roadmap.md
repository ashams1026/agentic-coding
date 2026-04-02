# Woof — Implementation Roadmap

> Generated from analysis of 39 research proposal docs across 17 feature areas.
> This roadmap defines **what** to build and **in what order**. Detailed task decomposition happens just-in-time when each sprint is picked up by the Decomposer agent, so plans are fresh against the current codebase.

---

## User Priorities

- **Most interested in:** Global Agents, Agent Chat, Custom Workflows, Agent Collaboration, Scheduling
- **Implementation preference:** Frontend-first where possible
- **Capacity:** Same agent throughput as current (no scaling up)

## Dependency Graph

```
Error Recovery P1 ──┐
                    ├──→ Analytics + Token Usage
Work Item Lifecycle ─┤
                    ├──→ Search (needs archived_at filters)
                    │
Global Agents P1 ───┤
                    ├──→ Agent Chat P1
                    ├──→ Scheduling (Tier 3)
                    └──→ Agent Collaboration
                              │
Custom Workflows ─────────────┤
                              ├──→ Templates (Tier 3)
                              └──→ Webhooks Inbound (trigger → workflow)

Notifications UX ──→ Outbound Webhooks (shared event bus) ──→ Notification Integrations (Tier 3)
                              │
Agent Collaboration ──────────┘ (human-in-the-loop needs notifications)

Agent Prompts P1 ──→ (standalone, no hard dependencies)
```

---

## Sprint 23: Foundations

> Reliability fixes + data hygiene + the keystone feature that unblocks the user's top priorities.

### Error Recovery Phase 1

**Proposal docs:** `docs/proposals/error-recovery/agent-recovery.md`, `docs/proposals/error-recovery/system-resilience.md`

**What to build:**
- Add `busy_timeout = 5000` PRAGMA to `connection.ts` — prevents `SQLITE_BUSY` crashes under concurrent agent load. One line, highest-ROI fix in the entire roadmap.
- Add React error boundaries per feature area (Agent Monitor, Work Items, Dashboard, Pico, Agent Manager) — currently zero exist. A crash in one feature shouldn't take down the whole app.
- WS reconnection with exponential backoff + jitter — replace the fixed 3-second reconnect in `ws-client.ts` with proper backoff. Add connection state indicator in the UI.
- Structured error categories on executions — replace generic "failed" status with specific categories (timeout, rate_limit, sdk_error, permission_denied, budget_exceeded). Update execution manager and frontend error display.
- Orphan execution detection on startup — detect executions stuck in "running" state when the backend starts, mark them as "interrupted".

**Key decisions from proposals:**
- Keep partial agent changes by default (don't auto-rollback on failure) — let users decide
- Pre-migration backup (proposed in both error-recovery and data-management docs) — implement here, deduplicate later
- Retry policies are Phase 2 — don't build yet, just classify errors as retryable vs terminal

**Why first:** The `busy_timeout` fix is a prerequisite for reliable concurrent agent writes that feed analytics and every other feature. Error boundaries prevent cascading UI crashes. These are must-have reliability foundations.

---

### Work Item Lifecycle

**Proposal docs:** `docs/proposals/work-item-lifecycle/ux-design.md`, `docs/proposals/work-item-lifecycle/data-model.md`

**What to build:**
- Schema migration: add `archived_at` and `deleted_at` nullable timestamp columns to `work_items` table
- Fix existing DELETE bug: current `DELETE /api/work-items/:id` orphans edges, comments, proposals, and memories — add proper cascade
- Archive/unarchive API endpoints: `POST /api/work-items/:id/archive`, `POST /api/work-items/:id/unarchive`
- Soft delete with 30-day grace period: DELETE sets `deleted_at`, background job hard-deletes after 30 days
- Bulk operations API: bulk archive/delete for multi-select
- Frontend: action bar on multi-select, "Show archived" toggle in list view, archive/delete in context menus and detail panel
- Settings > Data Management: "Recently deleted" recovery view

**Key decisions from proposals:**
- Archive is the primary action (reversible, preserves data). Delete is secondary (soft delete, 30-day grace).
- Archiving a parent does NOT auto-archive children — user chooses
- Deleting an item with active executions is blocked (409 Conflict)
- Executions are orphaned on delete (not cascaded) — preserves cost data for analytics
- SQLite `ALTER COLUMN` limitation for `executions.workItemId` nullable: accept the workaround, handle in application code

**Why first:** Fixes a real existing bug (orphaned records on delete). Establishes archive/delete semantics that Search, Analytics, and Data Management all depend on. Low complexity.

---

### Global Agents Phase 1

**Proposal docs:** `docs/proposals/global-agents/data-model.md`, `docs/proposals/global-agents/navigation-redesign.md`, `docs/proposals/global-agents/ux-design.md`

**What to build:**
- Schema migration: make `chat_sessions.projectId` nullable, add optional `projectId` to executions, create `global_memories` table
- Navigation: add "All Projects" option to the existing project selector (Option A from proposal — minimal change, no URL restructure). Dashboard and Agent Monitor become scope-aware.
- Pico scope toggle: in the Pico chat panel, toggle between project-scoped and global context. When global, no project context is injected into the system prompt.
- Agent Monitor "New Run" button: launch a standalone execution with agent + prompt, no work item required. Uses `POST /api/executions/run` endpoint.
- Scope badges and filter pills: visual indicators showing whether an execution/chat is project-scoped or global
- `AgentScope` discriminated union type in shared package

**Key decisions from proposals:**
- URLs now use project-scoped structure: `/p/:projectId/:page` (e.g., `/p/pj-global/items`). Legacy flat routes redirect.
- Sidebar uses a project tree model (collapsible project sections with child links), replacing the old flat link list + project dropdown
- Global agents use `~/.agentops/workspace/runs/<execution>/` for artifacts — new filesystem concern outside project sandbox
- `set_project_context` MCP tool for mid-conversation context switching is Phase 2 — don't build yet
- Full-page `/chat` route is Phase 2 (covered by Agent Chat sprint)

**Why first:** This is the user's top priority. It has the highest strategic value (5/5), unblocks Agent Chat and Scheduling (also top priorities), and Phase 1 is well-scoped. Data model changes are additive and low-risk.

**Open question for decomposer:** The proposals note that sandbox rules (`buildSandboxPrompt()`) need updating for global scope — specify how before implementation.

---

## Sprint 24: Core UX

> The features users interact with daily. Frontend-first per user preference.

### Agent Chat Page Phase 1

**Proposal docs:** `docs/proposals/agent-chat/ux-design.md`, `docs/proposals/agent-chat/rich-messages.md`, `docs/proposals/agent-chat/data-model.md`

**What to build:**
- Schema changes: add `agentId`, `workItemId`, `sdkSessionId` columns to `chat_sessions`. Formalize `contentBlocks` array in message metadata.
- Agent picker: select which agent to chat with when starting a new session (global or project-scoped based on Global Agents work)
- Session sidebar: conversation list with search, agent avatar, last message preview
- Project scoping rules: project-scoped agents inherit project context, global agents don't (unless user provides it)
- Page layout: sidebar + main chat area, separate from the existing Pico mini-panel
- Conversation rendering: extends current Pico chat rendering with session management

**Key decisions from proposals:**
- Pico remains the quick-access panel for the default assistant. Agent Chat is the full-page experience for any agent.
- Rich message rendering (DiffBlock, TerminalBlock, FileTreeSummary, ProposalCard) is Phase 2 — don't build in this sprint
- ProposalCard (approve/reject mid-stream) requires backend design work not covered in these proposals — defer
- WebSocket for bidirectional communication is Phase 2 — SSE is sufficient for Phase 1
- Session management: starting new, resuming previous, renaming, archiving old sessions

**Depends on:** Global Agents Phase 1 (for global-scoped sessions)

---

### Agent Prompts Phase 1

**Proposal docs:** `docs/proposals/persona-prompts/current-architecture.md`, `docs/proposals/persona-prompts/template-variables.md`

**What to build:**
- `resolveVariables()` function: Mustache-style `{{variable.name}}` substitution, injected into `buildSystemPrompt()` before SDK delivery
- Built-in variable namespaces: `project.*` (name, path, description), `agent.*` (name, model), `date.*` (today, now, dayOfWeek)
- Integration into both `buildSystemPrompt()` in `claude-executor.ts` and the Pico chat route in `chat.ts`
- Basic autocomplete UI in agent editor: trigger on `{{`, show available variables
- Preview mode: show the fully-hydrated prompt with variables resolved

**Key decisions from proposals:**
- Variables are resolved at prompt-build time, not at runtime
- Undefined variables are left as literal text `{{unknown_var}}` — the right default but add a warning indicator
- User-defined variables (`project_variables` table, `vars.*` namespace) are Phase 2 — don't build yet
- Subagent prompts: clarify whether `resolveVariables()` applies to subagent prompts too (proposal doesn't specify)

**Why this sprint:** Cheap (2/5 complexity), makes the agent editor meaningfully more powerful, and benefits Agent Chat (agents need good system prompts to be useful in chat).

---

### Notifications UX (In-App Only)

**Proposal docs:** `docs/proposals/notifications/ux-design.md`

**What to build:**
- Bell icon in sidebar footer with unread badge count
- Notification drawer (320px sliding panel): grouped by date, notification cards with icons/colors per type
- Enhanced toasts: critical events (agent error, proposal needs approval) don't auto-dismiss. Include inline action buttons.
- Inline proposal approve/reject in notification drawer — high value for core workflow
- Notification preferences: per-event-type toggles in Settings, quiet hours (suppress non-critical)
- WS notification event type: backend emits `notification` events over existing WebSocket connection
- Zustand store for notification state (in-memory Phase 1 — SQLite persistence is Phase 2)
- 60-second batching window for rapid completions (prevents notification storms)

**Key decisions from proposals:**
- Phase 1 is in-memory (Zustand + localStorage) — notifications are lost on backend restart. Acceptable for Phase 1.
- SQLite persistence is Phase 2 (important for overnight agent runs but not blocking)
- External channels (Slack, email, webhooks) are NOT in this sprint — they come after Outbound Webhooks builds the shared event bus
- Suppress duplicate notifications when user is watching the Agent Monitor

**Why this sprint:** Low complexity (2/5), high daily-use impact, and directly enables the proposal approval workflow. Also a prerequisite for Agent Collaboration's human-in-the-loop features.

---

## Sprint 25: Workflow Engine

> The biggest single effort in the roadmap. Dedicated sprint, no interleaving.

### Custom Workflows

**Proposal docs:** `docs/proposals/custom-workflows/data-model.md`, `docs/proposals/custom-workflows/builder-ux.md`, `docs/proposals/custom-workflows/runtime-execution.md`, `docs/proposals/custom-workflows/edge-cases.md`

**What to build:**
- Data model: three new tables (`workflows`, `workflow_states`, `workflow_transitions`) with soft versioning and in-flight pinning
- Migration: seed the default workflow from the hardcoded `WORKFLOW_STATES` constant. Dual-read backwards compatibility during migration.
- Builder UI: hybrid form-list for states and transitions + read-only visual preview (no interactive graph editor in Phase 1)
- Runtime replacement: systematically replace every hardcoded workflow reference across 15+ backend files and 8+ frontend views
- State-aware components: work item status displays, filter dropdowns, kanban columns, and execution dispatch all become dynamic based on the project's workflow
- Edge cases: workflow deletion/archival (only if no active work items use it), cloning, import/export
- Cleanup: remove the hardcoded `WORKFLOW_STATES` constant after migration is verified

**Key decisions from proposals:**
- Each published workflow version is a separate DB row with its own states/transitions — immutable once in use
- In-flight work items are pinned to the workflow version they started with
- "Blocked" state is a naming convention, not a type flag — the `flag_blocked` function looks for convention. Fragile but pragmatic.
- Interactive graph editor (react-flow) is Phase 2 — form-list is sufficient for Phase 1
- This sprint should NOT be interleaved with other features due to the breadth of changes

**Risk mitigation:** The migration path (dual-read → full dynamic → cleanup) is the critical sequence. If any step breaks, the execution pipeline breaks. Plan for a verification task after the runtime replacement that runs the full existing e2e suite.

**Depends on:** Nothing strictly, but Sprint 23's error recovery (error boundaries, orphan detection) provides safety nets for this risky work.

---

## Sprint 26: Intelligence & Discovery

> Agents get smarter, users find things faster.

### Agent Collaboration Phase 1

**Proposal docs:** `docs/proposals/agent-collaboration/context-sharing.md`, `docs/proposals/agent-collaboration/coordination.md`

**What to build:**
- Structured handoff notes: when an agent finishes a workflow step, it writes a structured summary (decisions made, files changed, open questions) that the next agent receives as injected context. Replaces the current one-line summary.
- Dependency enforcement: task edges already exist in the schema but are currently unenforced. Add enforcement in the execution dispatch path — block dispatch if upstream dependencies aren't complete.
- Context windowing: as work items pass through many steps, accumulated context grows. Implement token-budget-based summarization of earlier steps so later agents aren't overwhelmed.

**What to defer:**
- Per-work-item scratchpad (Phase 2)
- Agent-to-agent tagging `@agent` (Phase 2)
- Human-in-the-loop via `create_proposal` MCP tool (Phase 2 — needs Notifications to be more mature)
- Fan-out/fan-in completion gating (Phase 2 — race condition concerns in SQLite)
- Escalation with retry chains (Phase 2 — overlaps with Error Recovery Phase 2)

**Key decisions from proposals:**
- Handoff notes reference `fromState`/`targetState` from the workflow — depends on Custom Workflows being complete
- Fan-out/fan-in has an unresolved SQLite race condition (no row-level locking when children complete simultaneously) — defer until designed

**Depends on:** Custom Workflows (handoff notes reference workflow states), Notifications UX (human-in-the-loop needs notification delivery)

---

### Search Phase 1

**Proposal docs:** `docs/proposals/search/design.md`

**What to build:**
- FTS5 virtual tables with triggers for automatic sync: work items (title, description), agents (name, system prompt), comments, chat messages
- Server-backed Command Palette: upgrade the existing Cmd+K from client-side filtering to server-backed FTS5 search via `GET /api/search`
- Work Items filter bar enhancement: full-text search within the existing filter bar
- Unified search API: `GET /api/search?q=...&type=...&projectId=...` with BM25 ranking and snippet extraction
- Respect `archived_at`/`deleted_at` filters from Work Item Lifecycle

**What to defer:**
- Dedicated `/search` page (Phase 2)
- Execution log indexing (Phase 2 — high volume, needs careful design)
- Search suggestions and shortcuts (Phase 3)

**Key decisions from proposals:**
- SQLite FTS5 — zero external dependencies, production-proven, built into SQLite
- Rowid bridging needed (FTS5 requires integer rowid, Woof uses text IDs) — use an integer-keyed JOIN
- Write triggers for automatic FTS sync are negligible overhead on agent execution writes

**Depends on:** Work Item Lifecycle (search needs to respect archived/deleted filters)

---

### Analytics + Token Usage Phase 1

**Proposal docs:** `docs/proposals/analytics/metrics.md`, `docs/proposals/analytics/ux-design.md`, `docs/proposals/token-usage/tracking.md`, `docs/proposals/token-usage/dashboard-ux.md`

**What to build:**
- Schema: add `model`, `total_tokens`, `tool_uses` columns to executions table. Fix cents/USD unit inconsistency between executions and chat messages.
- Persist token data: capture token counts and model from SDK `result` messages in execution manager and Pico chat route — currently broadcast over WS but never stored.
- Analytics page (`/analytics`): new sidebar nav item between Activity Feed and Chat
- Charts (using existing Recharts): cost trend line, execution outcomes stacked bar, cost-by-agent horizontal bar, agent leaderboard table, summary cards with deltas
- Token Usage tab within Analytics page: usage over time (dual-axis), breakdown by model (pie), by agent, top N expensive executions table
- Time range selector: presets (24h, 7d, 30d) with URL query params for shareability

**What to defer:**
- Comparison mode / this week vs last week (Phase 2)
- Activity heatmap (Phase 2)
- Workflow bottleneck chart (Phase 2 — needs audit log migration)
- Drill-down modals (Phase 2)
- CSV/JSON export (Phase 2)
- Per-turn token granularity (Phase 3 — probably never needed)

**Key decisions from proposals:**
- Token Usage lives as a tab inside Analytics (not a separate nav item)
- On-the-fly SQL aggregation is fine for Phase 1 — pre-computed summary tables only needed at high data volumes
- The unit inconsistency (cents vs USD) is a real bug — fix regardless of whether full dashboard ships

**Depends on:** Error Recovery Phase 1 (`busy_timeout` for reliable concurrent writes)

---

## Sprint 27: Integration & Maintenance

> External connections + data health.

### Outbound Webhooks Phase 1

**Proposal docs:** `docs/proposals/webhooks/outbound-events.md`

**What to build:**
- Shared event bus: `TypedEventEmitter` that both webhooks and (later) notification integrations use — this is the canonical delivery infrastructure
- Delivery queue: SQLite-backed with 2-second polling worker
- Webhook subscriptions: CRUD API + Settings > Integrations UI
- HMAC signing (`X-Webhook-Signature`), exponential backoff retry (5 attempts, 30s-30min), 10s HTTP timeout
- Auto-disable after 10 consecutive failures, with delivery log showing status/latency/retry history
- Event catalog (Phase 1): `execution.started`, `execution.completed`, `execution.failed`, `work_item.state_changed`

**What to defer:**
- `proposal.created`/`proposal.updated` events (WS emissions don't exist yet — prerequisite gap)
- `budget.threshold` event (needs token tracking from Analytics)
- Test/ping button (Phase 2)
- Event wildcard subscriptions (Phase 2)

**Key decisions from proposals:**
- This MUST be built before Notification Integrations — the delivery queue, retry logic, and HMAC signing built here become the shared infrastructure. Do NOT build a parallel delivery system in Notifications.
- `proposal_created`/`proposal_updated` WS event types exist in `ws-events.ts` but are never broadcast — this is a prerequisite gap that must be tracked

**Why this sprint:** Builds the foundational event infrastructure that Notification Integrations (Tier 3) will wrap.

---

### Inbound Webhooks Phase 1

**Proposal docs:** `docs/proposals/webhooks/inbound-triggers.md`

**What to build:**
- Generic webhook receiver: `POST /api/webhooks/:triggerId` endpoint
- Webhook trigger configuration: CRUD in Settings > Integrations (shares nav with outbound)
- HMAC secret validation per trigger (timingSafeEqual)
- Handlebars-style prompt templates: `{{payload.pull_request.title}}` extracted from incoming JSON
- Delivery log for inbound triggers (success/failure, payload size, execution ID created)
- `trigger_type` and `trigger_id` columns on executions table — distinguishes manual vs triggered runs

**What to defer:**
- GitHub App integration (Phase 2 — requires public URL / tunnel infrastructure)
- Slack App integration (Phase 3 — same public URL problem, plus OAuth complexity)
- IP allowlisting (Phase 2)
- Rate limiting tiers (Phase 2 — basic rate limiting only in Phase 1)

**Key decisions from proposals:**
- Generic receiver is the core value — CI/CD and custom integrations work without any OAuth setup
- GitHub and Slack integrations are local-first hostile without a tunnel subsystem — defer until that's designed
- Shares the `trigger_type` column approach with Scheduling (future)

---

### Data Management Phase 1

**Proposal docs:** `docs/proposals/data-management/backup-restore.md`, `docs/proposals/data-management/growth-strategy.md`

**What to build:**
- Pre-migration backup: use SQLite `backup()` API (only safe approach for live WAL-mode DB) before every Drizzle migration
- Manual backup/restore: `POST /api/settings/backup`, `POST /api/settings/restore` endpoints + Settings UI button
- Backup storage: `~/.agentops/backups/` with 7-daily + 4-weekly retention
- Log truncation: truncate `executions.logs` after 30 days (UPDATE, not DELETE — preserves all metadata for analytics). This saves ~95% of storage.
- Per-table storage stats: `dbstat` virtual table for size breakdown in Settings > Data Management
- Fix existing cleanup endpoint cascade bug: `DELETE /api/settings/executions` doesn't cascade to proposals/comments

**What to defer:**
- Scheduled daily auto-backup (Phase 2 — needs Scheduling infrastructure)
- Full project export/import as JSON archive (Phase 2)
- VACUUM as manual action in Settings (Phase 2)
- Integrity checks and recovery (Phase 3)

**Key decisions from proposals:**
- `backup()` API is the only safe backup method — file copy with WAL mode can produce corrupt backups
- "Truncate logs, don't delete executions" is a key insight — saves 95% storage while preserving all analytics metrics
- Pre-migration backup is also proposed in Error Recovery's system resilience doc — deduplicate, implement here
- Growth projections: 1.5-3.5 GB after one year at 20 executions/day, driven by execution logs

---

## Tier 3: Future

> Prioritize after Tier 2 based on user feedback and what feels most needed. Listed in suggested order.

### Scheduling
**Docs:** `docs/proposals/scheduling/ux-design.md`, `docs/proposals/scheduling/infrastructure.md`
**Summary:** Cron-like recurring agent runs using `node-cron` with SQLite persistence. Schedules tab in Agent Manager, missed-run catch-up, auto-disable on failures. Low complexity (2/5). Depends on Global Agents (done by Sprint 23).
**Suggested first pick for Tier 3** — low complexity, high user interest.

### Templates Phase 1
**Docs:** `docs/proposals/templates/design.md`
**Summary:** Work item templates (bug report, feature request, spike) and expanded agent presets. One new `templates` table. Phase 2 (workflow + project templates) blocked on Custom Workflows.
**Build after:** Custom Workflows (Sprint 25).

### Agent Chat Phase 2 — Rich Messages
**Docs:** `docs/proposals/agent-chat/rich-messages.md`
**Summary:** DiffBlock with syntax highlighting, TerminalBlock with ANSI colors, FileTreeSummary, collapsible ThinkingBlock enhancements. Additive to the Phase 1 chat page.
**Build after:** Agent Chat Phase 1 (Sprint 24).

### Rollback Enhancements
**Docs:** `docs/proposals/rollback/design.md`
**Summary:** Phase 2 adds rollback button to more surfaces + git commit creation after rewind. Phase 3 adds per-file cherry-pick (fragile SDK workaround). Phase 1 bug fixes (tooltip) should be pulled into any current sprint as a standalone fix.

### Notification External Channels
**Docs:** `docs/proposals/notifications/integrations.md`
**Summary:** Webhook channel wraps Outbound Webhooks infrastructure (do NOT build a parallel delivery system). Email via Resend is Phase 2 (single API key). Slack is Phase 3 (local-first hostile, needs public URL).
**Build after:** Outbound Webhooks (Sprint 27) — use the shared event bus and delivery queue.

### Error Recovery Phase 2
**Docs:** `docs/proposals/error-recovery/agent-recovery.md`
**Summary:** Configurable retry policies per agent, watchdog for stuck execution detection, event replay for WS reconnection. Builds on Phase 1's structured error categories.

### Analytics Phase 2
**Docs:** `docs/proposals/analytics/ux-design.md`
**Summary:** Drill-down modals, comparison mode, activity heatmap, workflow bottleneck chart (needs audit log migration), JSON export.

### Custom Workflows Phase 2
**Docs:** `docs/proposals/custom-workflows/builder-ux.md`
**Summary:** Interactive graph editor using react-flow. Replaces the form-list builder with a visual drag-and-drop state machine editor.

### Agent Collaboration Phase 2
**Docs:** `docs/proposals/agent-collaboration/context-sharing.md`, `docs/proposals/agent-collaboration/coordination.md`
**Summary:** Per-work-item scratchpad, agent-to-agent tagging, human-in-the-loop via `create_proposal` MCP tool, fan-out/fan-in with completion gating, escalation chains.

### Frontend/Backend Swappability
**Docs:** `docs/proposals/frontend-backend-swappability/architecture.md`, `docs/proposals/frontend-backend-swappability/hosted-frontend.md`, `docs/proposals/frontend-backend-swappability/api-contract.md`
**Summary:** Phase 1 connection store refactor (~40 lines) is worth doing as a cleanup task anytime. The full hosted SPA + OpenAPI annotation of ~70 routes is several sprints with uncertain ROI — defer until there's evidence of users wanting remote connections or third-party backends.

---

## Notes for Decomposer Agent

When decomposing each sprint into tasks:

1. **Read the proposal docs listed for that sprint** — they contain detailed investigation of current code, specific file paths, and design decisions.
2. **Read the current source code** — proposals reference specific files and line numbers, but the code has likely changed since the proposals were written. Verify before planning.
3. **Frontend-first**: where a feature has both frontend and backend work, prefer starting with the frontend (possibly with mock data) and wiring up the backend after.
4. **One task = one commit.** Keep tasks atomic — each should be completable in a single agent session.
5. **Deduplicate cross-sprint concerns**: pre-migration backup appears in both Error Recovery and Data Management proposals. Assign to one sprint only.
6. **~20-25 tasks per sprint** is the target size at current capacity (~80% implementation, ~10% testing, ~10% docs).

### Mandatory Testing & Documentation Tasks

Every sprint MUST include the following. This is not optional — see `CLAUDE.md` Autonomous Agent Work Protocol.

**For each feature area with UI changes:**
- An **e2e test plan** task: write `tests/e2e/plans/<feature>.md` with numbered test cases (preconditions, steps, expected result)
- An **e2e test execution** task: run the plan via chrome-devtools MCP, screenshot each state, record results to `tests/e2e/results/`, file bugs as `FX.*` tasks for failures

**For each feature area that changes backend APIs, schemas, or architecture:**
- A **doc update** task: document new/changed endpoints, request/response shapes, schema additions, and behavioral rules in `docs/`

**At the end of every sprint:**
- A **regression checkpoint** task: re-run ALL existing e2e test plans in `tests/e2e/plans/` against the current build, compare against prior results, file bugs as `FX.REG.*` tasks for new regressions

**Naming convention:** `<PREFIX>.TEST.N` for test tasks, `<PREFIX>.DOC.N` for doc tasks (e.g., `FND.TEST.1`, `CWF.DOC.1`).

**Ordering:** Test plans should be written after the feature is implemented. Test execution follows the plan. Regression checkpoint is always the last task in the sprint.
