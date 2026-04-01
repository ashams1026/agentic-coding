# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 21:05 PDT — RES.SCHED.INFRA: Research scheduling infrastructure

**Done:** Researched scheduling infrastructure and backend design. Doc covers all 5 investigation areas: (1) scheduler implementation — 7-option comparison table, recommended node-cron + SQLite persistence (zero external deps); Scheduler singleton module with initializeScheduler(), registerSchedule(), executeSchedule(), stopAllSchedules(); lifecycle integration with start.ts (init after migrations + crash recovery, stop on shutdown), (2) missed runs — detection via nextRunAt < now on startup; catch-up policy (run once, not N times) configurable per schedule; notification on missed runs; skip-and-advance alternative, (3) data model — `schedules` table with 14 columns (name, personaId, projectId, prompt, cronExpression, timezone, enabled, catchUpMissed, skipIfRunning, lastRunAt, lastRunOutcome, nextRunAt, consecutiveFailures, timestamps); `schedule_id` + `trigger_type` on executions; nextRunAt via cron-parser; auto-disable after 10 consecutive failures, (4) concurrency — shared pool with existing concurrency.ts (no separate limit); per-schedule overlap handling (skip vs queue, no parallel); p2 default priority; "all projects" fan-out creates one execution per project, (5) trigger interaction — schedules and triggers are separate concepts (different semantics); standalone executions bypass workflow; potential Phase 3 unification into triggers table. Also: 7 CRUD API endpoints, validation rules, 3-phase plan, 7 cross-references, 5 design decisions.
**Files:** `docs/proposals/scheduling/infrastructure.md` (new)

---

## 2026-04-02 20:40 PDT — Review: RES.SCHED.UX (approved)

**Reviewed:** Scheduling UX design research.
- All 5 areas covered: where schedules live (4-location analysis with pros/cons/recommendation; Persona Manager primary with wireframe, Settings > Automation secondary with table wireframe, /schedules Phase 3), schedule definition (2-tier presets→cron with 6 preset-to-cron mappings, cron-parser live preview with next-5-runs, timezone handling via IANA + browser detection), what gets scheduled (ScheduleDefinition interface, prompt vs system prompt distinction clearly drawn, 7 template variables, 3 project scope options with behavior per scope), schedule management (card UI with 5 data points + 4 controls, create/edit dialog wireframe, Run Now behavior — 5-step spec with cadence isolation), how scheduled runs appear (work-item vs standalone analysis, Model B recommended with rationale, scheduleId + trigger_type SQL extensions, Agent Monitor/Activity Feed/Dashboard wireframes, execution history view with 30-day stats)
- Current state claims verified: personaAssignments table at schema.ts:95-105, 7 sidebar nav items at sidebar.tsx:38-46, no Trigger table in schema
- Notification integration well-designed — silent success, high on failure, critical on auto-disable matches RES.NOTIFY.UX event catalog
- 3-phase implementation ordering logical (persona-scoped → project-scoped → dedicated page)
- 6 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-02 20:30 PDT — RES.SCHED.UX: Research scheduling UX

**Done:** Researched scheduling UX for recurring agent tasks. Doc covers all 5 investigation areas: (1) where schedules live — 4-location analysis, recommended Persona Manager "Schedules" tab as primary entry (per-persona), Settings > Automation as secondary (per-project overview), dedicated /schedules page as Phase 3; wireframes for both views, (2) schedule definition — 2-tier input (preset dropdown covering 90% use cases → custom cron with live preview/next-5-runs); 6 presets mapped to cron expressions; timezone handling (browser-detected default, per-schedule override, IANA storage), (3) what gets scheduled — ScheduleDefinition interface (persona + project scope + prompt + cron + timezone); prompt template variables ({{date}}, {{schedule.lastRunAt}}, etc.); 3 project scope options (specific/all/none), (4) schedule management — card UI with name, frequency, next/last run status, enable/disable toggle, Run Now button, edit/delete; create/edit dialog wireframe with all fields; Run Now doesn't affect cadence, (5) how scheduled runs appear — standalone execution model (no work item creation for Phase 1), scheduleId + trigger_type on executions, Agent Monitor badge (calendar icon), Activity Feed events, Dashboard "Upcoming Schedules" widget; per-schedule history view with 30-day summary stats. Also: notification integration (silent on success, high on failure, critical on auto-disable), 3-phase implementation plan, 6 cross-references, 5 design decisions.
**Files:** `docs/proposals/scheduling/ux-design.md` (new)

---

## 2026-04-02 20:15 PDT — Review: RES.COLLAB.COORD (approved)

**Reviewed:** Multi-agent coordination patterns research.
- All 5 areas covered: parallel execution (current behavior accurate — sequential per item, parallel across items up to maxConcurrent=3; merge conflict risk matrix; 3 strategies with advisory locking recommended), blocking dependencies (correctly identified edges exist but are NOT enforced — dispatch.ts has no workItemEdges import; proposed getUnresolvedBlockers() + onWorkItemDone() trigger + circular detection), human-in-the-loop (4 intervention points; create_proposal MCP tool design; manual workflow gate type; notification priority matrix), escalation (5 failure scenarios mapped to current vs proposed behavior; EscalationPolicy retry chain; request_help MCP tool; configurable settings), fan-out/fan-in (decompose→execute→aggregate pattern; CompletionGate with checkParentCompletionGate() trigger; 4 partial completion policies; child handoff note aggregation tying to RES.COLLAB.CONTEXT)
- Source code claims verified: MAX_REJECTIONS=3 (execution-manager.ts:75), MAX_TRANSITIONS_PER_HOUR=10 (:74), LOOP_HISTORY_SIZE=6 (:76), DEFAULT_MAX_CONCURRENT=3 (concurrency.ts:12), edge types at schema.ts:77, no proposal MCP tool in mcp-server.ts
- Dependency non-enforcement correctly identified as existing bug — edges are purely decorative today
- Phase ordering well-justified (dependencies first as bug fix, human-in-loop second for production safety, escalation third, fan-out/fan-in last as most complex)
- 8 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-02 20:05 PDT — RES.COLLAB.COORD: Research multi-agent coordination patterns

**Done:** Researched multi-agent coordination patterns. Doc covers all 5 investigation areas: (1) parallel execution — current behavior (sequential per work item, parallel across items up to maxConcurrent=3), merge conflict risk matrix, 3 mitigation strategies (file-level locking recommended for Phase 1, branch-per-agent for Phase 2, sequential fallback), (2) blocking dependencies — audited work_item_edges (blocks/depends_on/related_to types exist but NOT enforced by dispatch or router), proposed `getUnresolvedBlockers()` check in dispatchForState(), `onWorkItemDone()` trigger for unblocking dependents, circular dependency detection, (3) human-in-the-loop — 4 intervention points (proposals, manual workflow gates, quality review, escalation), `create_proposal` MCP tool design, manual transition type for workflow edges, notification integration matrix, (4) escalation — 5 failure scenarios with detection/current/proposed behavior, `EscalationPolicy` with retry chain (same→upgrade model→different persona→human), `request_help` MCP tool, configurable per persona/project, (5) fan-out/fan-in — decompose→parallel execute→aggregate pattern, completion gate with `checkParentCompletionGate()` trigger, 4 partial completion policies (all/majority/any/threshold), child handoff note aggregation. 4-phase implementation plan, 8 cross-references, 5 design decisions.
**Files:** `docs/proposals/agent-collaboration/coordination.md` (new)

---

## 2026-04-02 19:45 PDT — Review: RES.COLLAB.CONTEXT (approved)

**Reviewed:** Agent context passing and shared memory research.
- All 5 areas covered: current state (executionContext audit with 4 limitations, project_memories audit with 4 limitations, 7-row "what's lost" table), handoff notes (structured HandoffNote schema with FileChange/Decision sub-types, hybrid generation approach, write_handoff MCP tool, handoff_notes SQL table, before/after system prompt comparison), shared scratchpad (ScratchpadEntry schema, 4 use cases, 5-column comparison table vs comments/handoffs/memories, MCP tools, SQL table), context windowing (4-tier priority system with token budget, buildContextWindow implementation sketch, Haiku summarization for older handoffs, configurable per project/persona, on-demand get_context extension), agent-to-agent tagging (soft @persona_name refs, relevance boost function, 3-level resolution, UI filtering)
- Current state audit correctly references actual code: `executionContext` at entities.ts:70, schema.ts:33, `buildSystemPrompt()` at claude-executor.ts:78, `memory.ts` with `APPROX_CHARS_PER_TOKEN = 4` at line 23
- Handoff notes are correctly positioned as separate from comments (agent-to-agent vs human-facing) — good separation of concerns
- Hybrid generation (auto-extract files from tool calls + agent writes decisions) is pragmatic
- Context windowing reuses existing Haiku summarizer pattern from memory.ts
- Phase ordering is well-justified (handoff notes first as highest value, windowing second to prevent bloat, scratchpad third, tagging last as refinement)
- 7 cross-references are accurate and specific
- backward compatibility with executionContext addressed
- **Verdict: approved.**

---

## 2026-04-02 19:35 PDT — RES.COLLAB.CONTEXT: Research agent context passing and shared memory

**Done:** Researched context passing and shared memory between agents. Doc covers all 5 investigation areas: (1) current state — audited `executionContext` array (summary/outcome only, no files/decisions/questions) and `project_memories` module (project-scoped, only at Done, read-only during execution); identified 7 types of information lost between workflow steps, (2) explicit handoff notes — structured `HandoffNote` schema with summary, filesChanged, decisionsMade, openQuestions, warnings; hybrid generation (auto-extract files from tool calls, agent writes decisions/questions via `write_handoff` MCP tool); new `handoff_notes` table; injection into system prompt replaces flat summaries, (3) shared scratchpad — per-work-item scratch space with `ScratchpadEntry` schema; MCP tools for read/write; distinction from comments (human-facing) and handoff notes (end-of-execution); pinned entries survive context windowing; "Agent Notes" UI section, (4) context windowing — 4-tier priority system with configurable token budget; Priority 1 (always: title + recent handoff), Priority 2 (pinned notes, open questions), Priority 3 (summarized older handoffs, recent scratchpad), Priority 4 (omitted, available via MCP); Haiku summarization for older handoff notes; budget configurable per project and persona, (5) agent-to-agent tagging — `@persona_name` soft references in handoff notes and scratchpad; relevance boost in context window (tagged content promoted to Priority 1); substring matching for resolution; no validation at write time. 4-phase implementation plan, 7 cross-references, 5 design decisions.
**Files:** `docs/proposals/agent-collaboration/context-sharing.md` (new)

---

## 2026-04-02 19:15 PDT — Review: RES.NOTIFY.INTEGRATIONS (approved)

**Reviewed:** External notification channels and delivery infrastructure.
- All 5 areas covered: Slack (Block Kit, OAuth, interactive deferred to hosted), email (Resend recommended, digest mode, 4 services compared), webhooks (HMAC signing, 5-attempt retry, delivery log, auto-disable), backend architecture (NotificationService fan-out, rate limiting, burst detection), WS interaction (existing broadcast sufficient, no separate channel)
- Slack interactive buttons correctly deferred — local-first can't receive callbacks
- Webhook security thorough (HMAC, replay, TLS, rotation)
- Retry policy well-designed (exponential, 4xx skip, dead letter, auto-disable)
- NotificationChannel interface is clean and extensible
- Data model (integrations + delivery_log tables) supports all 3 channels
- 4-phase implementation order correct (webhooks simplest, Slack last)
- **Verdict: approved.**

---

## 2026-04-02 19:10 PDT — RES.NOTIFY.INTEGRATIONS: Research external notification channels

**Done:** Researched external notification channels and delivery infrastructure. Doc covers all 5 investigation areas: (1) Slack — Bot posting with Block Kit formatting, OAuth setup flow, interactive approve/reject buttons (Phase 2 for hosted), channel selection UI, complexity assessment, (2) email — Resend recommended for Phase 1, transactional alerts + daily digest mode, event filter, SMTP advanced option; compared SendGrid/SES/self-hosted, (3) webhooks — standardized JSON payload with `entity.action` type convention, HMAC-SHA256 signing + replay protection + TLS, 5-attempt exponential retry, delivery log with status/response, auto-disable on 10 consecutive failures, (4) backend architecture — in-process NotificationService with channel fan-out (InApp/Slack/Email/Webhook), NotificationChannel interface, rate limiting (5s dedup, per-channel throttle, burst detection), (5) WS interaction — existing broadcast() sufficient, no separate channel needed, WS over SSE for bidirectional. Also: integrations + delivery_log tables, 4-phase implementation plan, 5 cross-references.
**Files:** `docs/proposals/notifications/integrations.md` (new)

---

## 2026-04-02 18:55 PDT — Review: RES.NOTIFY.UX (approved)

**Reviewed:** Notifications UX design.
- All 5 areas covered: event catalog (10 events, 4 priority levels), notification center (bell icon + drawer wireframe with inline actions), preferences (per-event toggles, quiet hours, scope filter), toast vs persistent (decision matrix with rationale, critical no-auto-dismiss, 60s batching), Agent Monitor interaction (suppress duplicates, auto-mark-read, quick nav)
- Correctly builds on existing toast-store.ts and activity-store.ts
- Inline proposal approve/reject in notification drawer is a strong UX pattern
- Batching for rapid completions prevents notification storms
- Phase 1 in-memory → Phase 2 SQLite is pragmatic for local-first
- WS broadcast reuses existing infrastructure
- **Verdict: approved.**

---

## 2026-04-02 18:50 PDT — RES.NOTIFY.UX: Research notifications UX

**Done:** Researched and documented the notifications UX. Doc covers all 5 investigation areas: (1) event catalog — 10 notification events with priority levels (critical/high/low/info), default channels, and examples, (2) in-app notification center — bell icon in sidebar footer with unread badge, sliding drawer (320px) with grouped-by-date notifications, inline actions (approve/reject on proposals), mark-as-read; 6 notification types with icons/colors/actions, (3) preferences — Settings page with per-event in-app/sound toggles, quiet hours (suppress non-critical), project scope filter; stored in Zustand/localStorage for Phase 1, (4) toast vs persistent — decision matrix for all 10 events; critical toasts don't auto-dismiss; 60-second batching window for rapid completions; toast → persistent notification link, (5) Agent Monitor interaction — suppress toasts when user is watching execution, auto-mark-as-read on view, quick navigation from notifications. Also: lightweight data model (Zustand Phase 1, SQLite Phase 2), WS event emission, 4 design decisions, 5 cross-references.
**Files:** `docs/proposals/notifications/ux-design.md` (new)

---

## 2026-04-02 18:35 PDT — Review: RES.LIFECYCLE.DATA (approved)

**Reviewed:** Work item lifecycle data model research.
- All 5 areas covered: schema audit (8 FKs, orphan bug identified), soft delete (timestamp columns chosen over archive table), cascade rules (archive keeps all, hard delete cascades with execution orphaning), API design (POST archive/unarchive + DELETE soft + restore + bulk + background job), agent impact (canDispatch guard, 409 Conflict)
- Execution orphaning is the right call — preserves cost data for accounting
- SQLite ALTER COLUMN limitation acknowledged with pragmatic workaround
- Partial indexes for archived/deleted columns — good optimization
- 5-step migration plan correctly ordered
- Consistent with RES.LIFECYCLE.UX throughout
- **Verdict: approved.**

---

## 2026-04-02 18:30 PDT — RES.LIFECYCLE.DATA: Research work item lifecycle data model

**Done:** Researched data model and cascade behavior for work item deletion/archival. Doc covers all 5 investigation areas: (1) current schema — audited 7 tables with FKs to work_items, found none have onDelete cascade (orphan bug in existing DELETE endpoint), (2) soft delete — recommends `archived_at`/`deleted_at` timestamp columns over separate archive table or status column; default filter helper for all queries, (3) cascade rules — archive keeps all related records; hard delete cascades edges/comments/proposals/memories, orphans executions (preserves cost data); child cascade is user-configurable, (4) API design — `POST .../archive`/`unarchive` + bulk variants; DELETE sets `deleted_at` (soft); `POST .../restore` during grace period; background hard-delete job every 6h; list endpoint query params for includeArchived/deleted, (5) agent impact — canDispatch() check in dispatch.ts, router skips archived/deleted, 409 Conflict on delete with active execution. Includes 5-step migration plan and cascade summary table.
**Files:** `docs/proposals/work-item-lifecycle/data-model.md` (new)

---

## 2026-04-02 18:15 PDT — Review: RES.LIFECYCLE.UX (approved)

**Reviewed:** Work item delete & archive UX design.
- All 5 areas covered: semantics (archive primary/preserves, delete secondary/permanent), confirmation (3 tiers: toast, children dialog, always-confirm delete with wireframe), bulk operations (action bar, board multi-select, filter-aware select-all), undo (archive reversible + toast, delete 30-day soft delete with Settings recovery), archived appearance (hidden by default, "Show archived" toggle, muted style, read-only detail)
- Agent interaction edge cases handled: archive proceeds (execution finishes), delete blocked on active execution
- Parent-child cascading addressed for both archive and delete
- 7 entry points comprehensive, keyboard shortcuts included
- Design decisions well-reasoned (archive over delete, no trash view, soft delete, block delete on active)
- **Verdict: approved.**

---

## 2026-04-02 18:10 PDT — RES.LIFECYCLE.UX: Research work item delete & archive UX

**Done:** Researched and documented UX for deleting and archiving work items. Doc covers all 5 investigation areas: (1) delete vs archive semantics — archive hides but preserves data, delete is permanent; archive is primary/prominent action, delete is secondary; availability table per view, (2) confirmation UX — no confirmation for simple archive (undo toast), dialog for items with children/executions, always-confirm for delete with cascade options, blocked if active execution, (3) bulk operations — multi-select action bar in list/board views, select-all respects filters, drag-to-archive zone, (4) undo — archive fully reversible via unarchive button + 5-second undo toast; delete uses 30-day soft delete with Settings > Data recovery; background hard-delete job, (5) archived item appearance — hidden from default views, "Show archived" toggle in filter bar, muted/grayed in search, read-only detail panel, execution history preserved. Also covers agent interaction (§6), 7 entry points table (§7), and 4 design decisions (§8).
**Files:** `docs/proposals/work-item-lifecycle/ux-design.md` (new)

---

## 2026-04-02 17:55 PDT — Review: RES.CHAT.DATA (approved)

**Reviewed:** Chat data model and backend changes research.
- All 5 investigation areas covered: SDK events mapping (hybrid contentBlocks array), storage (personaId/workItemId/sdkSessionId, JSON metadata, no sub-tables), streaming (SSE + control endpoints, enhanced event format with toolCallId), execution relationship (separate with optional linking), V2 sessions (sdkSessionId readiness)
- SDK event types accurately documented against actual chat.ts streaming code
- Normalized sub-tables explicitly rejected with 5 compelling reasons
- SSE vs WebSocket comparison thorough (7 dimensions), SSE correctly chosen for Phase 1
- Separate-with-optional-linking for executions is the right balance
- V2 session migration strategy is pragmatic (new→V2, old→query())
- Schema summary, API endpoints, and 6-step migration plan all consistent
- Cross-references RES.CHAT.UX (persona binding) and RES.CHAT.RICH (contentBlocks)
- **Verdict: approved.**

---

## 2026-04-02 17:50 PDT — RES.CHAT.DATA: Research chat data model and backend

**Done:** Researched data model and backend changes for multi-persona agent chat. Doc covers all 5 investigation areas: (1) SDK events mapping — recommends hybrid (one message per turn with ordered contentBlocks array), formalizes ContentBlock union type replacing loose thinkingBlocks/toolCalls, (2) storage — adds personaId/workItemId/sdkSessionId to chat_sessions, keeps JSON metadata on messages (no normalized sub-tables), includes storage estimates and migration SQL, (3) streaming — stay with SSE (add cancel/approve control endpoints), enhanced event format with toolCallId linking and tool_status events, WebSocket deferred to Phase 2, (4) execution relationship — separate with optional linking (workItemId FK on sessions), cost tracking aggregation, (5) V2 sessions — sdkSessionId column for future SDK session binding, what V2 eliminates vs what we still need. Includes final schema summary and 6-step migration plan.
**Files:** `docs/proposals/agent-chat/data-model.md` (new)

---

## 2026-04-02 17:35 PDT — Review: RES.CHAT.RICH (approved)

**Reviewed:** Rich message rendering research for agent chat.
- All 8 content types covered with wireframes, design, interaction, degradation, and data source
- DiffBlock (Edit/Write), ToolCallCard (enhanced dispatch), TerminalBlock (ANSI), FileTreeSummary (2+ files), ProposalCard (approve/reject lifecycle), ThinkingBlock (enhanced), ImageBlock (responsive+lightbox), MultiStepProgress (SSE-derived)
- Component hierarchy diagram clearly shows rendering dispatch tree
- Expand/collapse rules well-designed: destructive tools expanded, reads collapsed
- Graceful degradation addressed for every component (missing data, errors, edge cases)
- Priority table P0-P3 is practical and incremental
- Consistent with existing codebase (references getToolDescription, PicoMarkdown, StatusLine)
- **Verdict: approved.**

---

## 2026-04-02 17:30 PDT — RES.CHAT.RICH: Research rich message rendering

**Done:** Researched and documented rich message rendering for all 8 content types. Each type includes: component design (ASCII wireframe), interaction behavior, expand/collapse rules, graceful degradation, and data source. Types covered: (1) code changes — DiffBlock with syntax highlighting + accept/reject, (2) tool calls — enhanced ToolCallCard with per-tool output dispatch, (3) terminal output — TerminalBlock with ANSI color + dark bg + scrollable, (4) file trees — FileTreeSummary aggregating 2+ file changes, (5) proposals — ProposalCard with approve/reject/edit actions + status lifecycle, (6) thinking — enhanced ThinkingBlock with left border accent, (7) images — ImageBlock with responsive display + lightbox + lazy loading, (8) progress — MultiStepProgress derived from SSE stream + streaming cursor. Includes component hierarchy diagram and 4-tier implementation priority table.
**Files:** `docs/proposals/agent-chat/rich-messages.md` (new)

---

## 2026-04-02 17:15 PDT — Review: RES.CHAT.UX (approved)

**Reviewed:** Dedicated agent chat page UX design.
- All 5 investigation areas covered: page structure (wireframe, sidebar, persona selector modal), Pico relationship (special case, 3-phase migration, comparison table), scoping (3 scenarios with UI indicators, Router hidden), session management (4 creation methods, naming, archive/delete), navigation (5 entry points, URL structure)
- Channel-based alternative explicitly rejected with rationale — good decision
- Empty states handled: no sessions, no messages, deleted persona
- Design decisions well-justified: session-based, immutable persona, Pico-only mini panel, global project scope
- Schema changes summarized with RES.CHAT.DATA cross-reference
- Consistent with UX.PICO.FULLPAGE (extends existing `/chat` page) and RES.GLOBAL.UX
- **Verdict: approved.**

---

## 2026-04-02 17:10 PDT — RES.CHAT.UX: Research dedicated agent chat page UX

**Done:** Researched and designed the full-page agent chat UX for conversing with any persona. Doc covers all 5 investigation areas: (1) page structure — sidebar (280px) with persona filter, date-grouped sessions, persona avatar per row + main chat area with persona header; persona selector modal for "New Chat"; rejected channel-based approach, (2) Pico relationship — Pico is a special case of agent chat; mini panel stays Pico-only; `/chat` shows all persona sessions; 3-phase migration, (3) scoping — project context from global sidebar selector; project badge in header; system message on project switch; Router persona hidden from picker, (4) session management — explicit (New Chat + persona selector) or implicit (empty state); auto-title from first message; archive/delete; session-based not channel-based, persona immutable per session, (5) navigation — 5 entry points (sidebar, mini expand, Cmd+K, persona manager, work item detail); URL with optional `?session=id`. Also: 3 empty states, schema changes summary, cross-references to RES.CHAT.RICH/DATA/WORKFLOW.EDGE/GLOBAL.UX.
**Files:** `docs/proposals/agent-chat/ux-design.md` (new)
