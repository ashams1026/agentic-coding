# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-22 complete and archived. Sprint 17 has blocked FX.SDK3/SDK5. All bug fixes, UX tasks, and research proposals archived. Research archived: RES.CHAT.UX/RICH/DATA, RES.LIFECYCLE.UX/DATA, RES.NOTIFY.UX/INTEGRATIONS, RES.COLLAB.CONTEXT/COORD, RES.SCHED.UX/INFRA, RES.ROLLBACK, RES.TEMPLATES, RES.ANALYTICS.METRICS/UX, RES.WEBHOOKS.INBOUND/OUTBOUND, RES.SWAP.ARCH/HOSTED/API.

---

## Sprint 17: Agent Pipeline Fixes & Monitor UX (remaining)

> Blocked and remaining tasks.

### SDK-Native Skills & Tool Discovery

- [blocked: SDK initializationResult() does not return built-in tool names/descriptions — only commands (skills), agents, and models. No tool discovery API exists in the SDK. The hardcoded SDK_TOOLS list in tool-configuration.tsx is actually correct since built-in tools are a fixed set.]  **FX.SDK3** — Replace hardcoded tool list with SDK discovery in persona editor. In the persona editor UI (`packages/frontend/src/features/persona-manager/`): replace any freeform text input or hardcoded tool checkboxes for `allowedTools` with a multi-select populated from `GET /api/sdk/capabilities`. Show each tool with its name and description. Group by category: File tools, Search tools, Execution, Web, Agent, Other. Same for `mcpTools` — show available MCP tools from the discovery response. Validate on save: warn if a selected tool isn't in the available set.

- [blocked: same as FX.SDK3 — no tool discovery API in SDK. Can validate skills (commands) and agents from capabilities, but not built-in tools.] **FX.SDK5** — Add startup tool validation. In `packages/backend/src/agent/execution-manager.ts`: on first dispatch (or server start), fetch the SDK capabilities and validate all persona `allowedTools` and `skills` against the actual available set. Log warnings for any mismatches: "Persona 'Engineer' references unknown tool 'FooBar' — will be ignored by SDK." This catches stale tool names early (like the `transition_state` vs `route_to_state` incident).

---

## Sprint 19: SDK Deep Integration — Core

> Leverage the full Claude Agent SDK surface. Priority-ordered: infrastructure first (unblocks everything), then agent quality, then safety.
> V2 Sessions unblock SDK discovery (FX.SDK1) and simplify Pico (Sprint 18).
> Each feature with UI changes includes a test plan update + visual verification task.

### Part 1: Infrastructure — V2 Persistent Sessions

- [blocked: SDKSessionOptions does not support agent/agents, mcpServers, cwd, skills, or maxBudgetUsd — only query() Options does. V2 sessions can't be configured as Pico (custom personality, MCP server, project cwd). Need SDK to add these fields to SDKSessionOptions first.] **SDK.V2.3** — Refactor Pico to use V2 sessions. Update PICO.2 and PICO.3 design: instead of a custom `chat_sessions`/`chat_messages` DB table + manual conversation history assembly, use the SDK's native session management. `POST /api/chat/sessions` → calls `unstable_v2_createSession()` and stores the SDK session ID. `POST /api/chat/sessions/:id/messages` → calls `session.send(message)` and streams from `session.stream()`. `GET /api/chat/sessions` → calls `listSessions()` from the SDK. `GET /api/chat/sessions/:id/messages` → calls `getSessionMessages(sessionId)`. This eliminates our custom chat persistence layer entirely — the SDK handles conversation history, context compaction, and session storage. Keep the `chat_sessions` table only as a lightweight index (sessionId, projectId, title, createdAt) for the UI list. Remove `chat_messages` table from the schema design.

---

## Backlog: Pluggable Executor Architecture (remaining)

> PLUG.1-10 archived (except PLUG.3c/3d blocked).

- [blocked: ExecutionManager has 6+ non-DB dependencies beyond repositories (logger, audit, concurrency, runRouter, dispatchForState, drizzle eq operator). Moving to core requires abstracting ALL of these as interfaces — much larger scope than DB repositories alone. Defer until a broader service abstraction layer is designed.] **PLUG.3c** — Move ExecutionManager, dispatch, router, coordination to `@agentops/core`. Refactor these modules to use the repository interfaces from PLUG.3b instead of direct Drizzle imports. Move them to `packages/core/src/`. Update backend to inject concrete repository implementations via the composition root.

- [blocked: same as PLUG.3c — mcp-server.ts depends on SDK MCP factory, logger, audit, coordination, memory modules beyond just DB. Requires broader service abstraction.] **PLUG.3d** — Move MCP server definition to `@agentops/core`. Refactor `mcp-server.ts` to use repository interfaces. The SDK MCP server factory (`createSdkMcpServer`) stays as a peer dependency since it's from the agent SDK.

---

## Sprint 22: Visual UX Audit

> Exploratory testing sprint. Each task: start dev servers (ports 3001 + 5173), open the page via chrome-devtools MCP, interact with every feature, screenshot each state, and file bugs as new `FX.UX.*` tasks in TASKS.md. Bugs should include: page, what's broken, expected behavior, and a screenshot path if possible.

### Work Items (`/items`)

- [blocked: Board view component exists (board-view.tsx) but is not exposed in the UI — WorkItemView type is "list" | "flow" only, viewOptions array has no board entry. Cannot audit what users can't access.] **UX.WORK.BOARD** — Audit Work Items board view. Switch to board/kanban view. Verify: columns render by workflow state, cards show title/status/assignee, drag-and-drop works (attempt to move a card between columns). Check empty columns display correctly. Screenshot. File bugs.

## Bug Fixes & UX

- [blocked: TestRunPanel component exists in persona-editor.tsx but PersonaManagerPage uses PersonaDetailPanel instead. The test-run feature is not accessible from the UI — no route or button leads to persona-editor.tsx. Cannot audit what users can't reach.] **FX.UX.PERSONA.4** — Wire TestRunPanel into Persona Manager UI. The `TestRunPanel` component (`packages/frontend/src/features/persona-manager/test-run-panel.tsx`) exists and is imported in `persona-editor.tsx`, but the page (`pages/persona-manager.tsx` line 38) uses `PersonaDetailPanel` which does not include it. Users cannot test-run a persona. Fix: either add a collapsible TestRunPanel to `PersonaDetailPanel` (at the bottom of the read-only view), or replace `PersonaDetailPanel` with `PersonaEditor` in the page layout.

---

## Research: Search

> Design research for full-text search across all entities. Output is design docs only — do NOT add implementation tasks to TASKS.md. All proposals go to `docs/proposals/search/`.

- [x] **RES.SEARCH** — Research search infrastructure and UX. *(completed 2026-04-01 17:30 PDT)* Investigate: (1) what's searchable — work items (title, description), executions (logs, tool calls), chat messages, activity events, personas (name, prompt), comments; which are highest priority, (2) search UX — where does search live: top-level search bar in the header, command palette integration (Cmd+K already exists), dedicated search page with filters; how results are displayed — grouped by entity type, ranked by relevance, with snippets showing the match context, (3) search implementation — SQLite FTS5 (full-text search extension) vs application-level search (in-memory index like Fuse.js/MiniSearch) vs external service (Meilisearch, Typesense); tradeoffs for a local-first app: FTS5 is zero-dependency and built into SQLite but limited in ranking; Fuse.js is simple but doesn't scale; Meilisearch is powerful but adds an external service, (4) indexing — what gets indexed at write time vs searched at query time; how to handle incremental indexing as new executions and chat messages stream in, (5) filtering and facets — filter by entity type, project, date range, status; can search be scoped to "within this project" by default with option to search globally, (6) performance — expected data volume (thousands of work items, tens of thousands of executions/messages); response time targets; pagination for large result sets. Write to `docs/proposals/search/design.md`. Commit the doc only.

---

## Research: Error Handling & Agent Recovery

> Design research for systematic error handling and graceful recovery. Output is design docs only — do NOT add implementation tasks to TASKS.md. All proposals go to `docs/proposals/error-recovery/`.

- [x] **RES.RECOVERY.AGENTS** — Research agent error handling and recovery patterns. *(completed 2026-04-01 18:00 PDT)* Investigate: (1) current failure modes — what happens today when an agent crashes mid-execution (SDK process dies, timeout, OOM, API rate limit); how does the execution manager detect and report it; what state is the work item left in, (2) automatic retry — should failed executions auto-retry with configurable policy (max retries, backoff, retry with different model/persona); which failure types are retryable (timeout, rate limit) vs terminal (invalid prompt, permission denied), (3) graceful shutdown — when the backend restarts or shuts down during active agent runs; how to detect orphaned executions on startup and mark them as failed/interrupted; how to resume if possible (relates to SDK checkpointing), (4) stuck execution detection — timeout thresholds per persona/workflow step; watchdog that detects executions with no events for N minutes and marks them as stuck; notification to user (ties into RES.NOTIFY.*), (5) partial results — when an agent fails partway through, what to do with files it already modified; auto-rollback (ties into RES.ROLLBACK), keep partial changes, or let the user decide, (6) error reporting — structured error categories in the UI (timeout, rate limit, SDK error, permission denied, budget exceeded); error details in execution history; aggregate error trends in analytics (ties into RES.ANALYTICS.*). Write to `docs/proposals/error-recovery/agent-recovery.md`. Commit the doc only.

- [x] **RES.RECOVERY.SYSTEM** — Research system-level resilience and data integrity. *(completed 2026-04-01 18:35 PDT)* Investigate: (1) WebSocket disconnection — what happens when the frontend loses WS connection to the backend; reconnection strategy, missed event replay, stale state detection; how does the Agent Monitor handle reconnection without losing streaming output, (2) concurrent write safety — SQLite write locking with multiple agents executing simultaneously; WAL mode configuration; what happens if two agents try to modify the same file (ties into RES.COLLAB.COORD), (3) database integrity — PRAGMA checks, backup before migrations, recovery from corrupted DB; how Drizzle migrations handle partial failures, (4) frontend resilience — React error boundaries per feature area (Agent Monitor crash shouldn't take down the whole app); offline detection and graceful degradation; stale cache handling when backend data changes. Write to `docs/proposals/error-recovery/system-resilience.md`. Commit the doc only.

---

## Research: Data Management & Backup

> Design research for data lifecycle, backup/restore, and growth strategy. Output is design docs only — do NOT add implementation tasks to TASKS.md. All proposals go to `docs/proposals/data-management/`.

- [x] **RES.DATA.BACKUP** — Research backup, restore, and data export. *(completed 2026-04-01 19:10 PDT)* Investigate: (1) backup strategy — automated SQLite backup (`.backup` command, file copy with WAL checkpoint); scheduled backups (daily, before migrations); where to store backups (local directory, configurable path), (2) restore — UI for restoring from a backup; what happens to in-flight executions; version compatibility between backup and current schema, (3) export/import — full project export as a portable archive (JSON + files); selective export (just work items, just personas, just workflows); import into a fresh instance or merge into existing data; how this relates to templates (RES.TEMPLATES), (4) data portability — can a user move their entire Woof instance to a new machine; what's in the DB vs what's on the filesystem (project paths, agent checkpoints, screenshots); migration guide, (5) disaster recovery — what's the worst case (DB deleted, corrupted); how fast can a user get back to working state; should we recommend external backup solutions (Time Machine, rsync). Write to `docs/proposals/data-management/backup-restore.md`. Commit the doc only.

- [x] **RES.DATA.GROWTH** — Research data growth and retention strategy. *(completed 2026-04-01 19:40 PDT)* Investigate: (1) what grows fast — execution event logs (every tool call, every text chunk), chat messages, activity feed events, e2e test screenshots; estimate storage per 100 agent executions, (2) retention policies — auto-archive or delete execution logs older than N days; configurable per project; keep summary/metadata but drop verbose logs; compress old data, (3) SQLite scaling — practical limits for a local-first app (DB size, query performance at 100K+ rows); when to consider SQLite → PostgreSQL migration path; read/write performance with WAL mode under concurrent agent load, (4) cleanup tools — UI in Settings for "Data Management": see DB size, per-table row counts, storage breakdown; one-click cleanup of old execution logs, orphaned screenshots, archived work items; "compact database" (VACUUM), (5) monitoring — surface DB health in the dashboard or settings; warn when DB exceeds size thresholds; log slow queries in dev mode. Write to `docs/proposals/data-management/growth-strategy.md`. Commit the doc only.

---

## Research: Token Usage & Cost Tracking

> Design research for per-execution token tracking and aggregated usage dashboards. Output is design docs only — do NOT add implementation tasks to TASKS.md. All proposals go to `docs/proposals/token-usage/`.

- [ ] **RES.TOKENS.TRACKING** — Research per-execution token usage collection and storage. Investigate: (1) what data to capture — input tokens, output tokens, cache read/write tokens, model used, cost in USD; where this data comes from (Claude Agent SDK `result` message fields: `total_cost_usd`, `duration_ms`, token counts); what's available today vs what we'd need to extract, (2) storage schema — dedicated `execution_token_usage` table or additional columns on the existing `executions` table; fields: execution_id, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_usd, timestamp; indexing strategy for time-range queries, (3) collection points — agent executor (`claude-executor.ts`) already receives `result` messages with cost data; Pico chat (`chat.ts`) also gets cost; MCP tool calls; ensure all SDK `query()` call sites capture and persist token data consistently, (4) per-turn granularity — should we track tokens per assistant turn within an execution (useful for understanding multi-turn cost) or just the execution total; trade-off: granularity vs storage overhead, (5) relationship to existing data — the `metadata` column on `chatMessages` already stores `costUsd` and `durationMs`; the execution events table may have partial data; audit what's already being captured and identify gaps. Write to `docs/proposals/token-usage/tracking.md`. Commit the doc only.

- [ ] **RES.TOKENS.DASHBOARD** — Research aggregated token usage dashboard UX. Investigate: (1) dashboard location — dedicated "Usage" page accessible from sidebar, or a tab/section within Settings, or widgets on the main Dashboard; relationship to RES.ANALYTICS.UX (analytics may be a superset that includes token usage as one view), (2) key views — usage over time (line chart: tokens/cost per day/week/month), breakdown by model (pie/bar chart: how much spend on Opus vs Sonnet vs Haiku), breakdown by persona (which agents cost the most), breakdown by project, top N most expensive executions (table with drill-down to execution detail), (3) time range controls — preset ranges (today, 7d, 30d, all time), custom date picker; comparison mode (this week vs last week), (4) summary cards — total tokens used, total cost, average cost per execution, number of executions; for the selected time range, (5) real-time vs batch — can the dashboard query aggregates on the fly from the token_usage table, or do we need a pre-computed summary table for performance; at what data volume does on-the-fly aggregation become too slow in SQLite, (6) export — download usage data as CSV for expense tracking or team reporting. Write to `docs/proposals/token-usage/dashboard-ux.md`. Commit the doc only.

