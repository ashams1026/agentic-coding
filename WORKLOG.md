# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

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

---

## 2026-04-02 16:55 PDT — Review: RES.WORKFLOW.EDGE (approved)

**Reviewed:** Custom workflow edge cases and lifecycle management research.
- All 6 investigation areas covered plus bonus chat interaction section (7 total)
- Deletion: archive-only + migration wizard, active execution blocking — thorough
- Cloning: 5 starter templates, clone mechanics, UI flow — practical
- Import/export: JSON with versioning, validation checklist, .woof-workflow.json — well-designed
- Permissions: Draft/Published toggle as primary safety — right call for single-user
- Global agents: require project context — correctly identifies sandbox/memory dependencies
- Testing: phased approach (validator → test project → dry-run) — incremental and practical
- Chat interaction: 3 scenarios with current/future behavior — addresses the RES.CHAT.* cross-reference
- Priority-ranked summary table at the end — useful for planning
- **Verdict: approved.**

---

## 2026-04-02 16:50 PDT — RES.WORKFLOW.EDGE: Research custom workflow edge cases

**Done:** Researched and documented edge cases for custom workflows. Doc covers all 6 investigation areas plus a 7th on chat interaction: (1) deletion — recommends archive-only with optional migration wizard, block if active executions, (2) cloning — clone button + 5 built-in starter templates (Simple Kanban, Code Review Pipeline, etc.), (3) import/export — JSON format with versioning, validation on import, excludes persona assignments, (4) permissions — Draft/Published toggle as primary safety mechanism (no RBAC for single-user), (5) global agents — require project context (current design is correct), (6) testing — static validator (unreachable/dead-end states) + test project approach, (7) chat interaction — keep execution and chat separate, use proposals for decisions. Includes priority-ranked summary table.
**Files:** `docs/proposals/custom-workflows/edge-cases.md` (new)

---

## 2026-04-02 16:40 PDT — Review: RES.PROMPTS.VARS (approved)

**Reviewed:** Template variable research doc for persona prompts.
- All 5 investigation areas covered: syntax ({{var}} with comparison table), built-in vars (15 total, split by availability), user-defined vars (vars.* namespace, schema, UI), resolution (when/where/undefined behavior), UI support (autocomplete, reference panel, preview)
- Design decisions well-reasoned: substitution-only (no template language), namespace separation, one-time resolution at prompt-build time
- resolveVariables() regex correct (negative lookbehind for escaping, whitespace trimming)
- Architecture integration point accurately identified (between DB read and sections push)
- 4-phase implementation plan is practical and incremental
- Written to correct output path
- **Verdict: approved.**

---

## 2026-04-02 16:35 PDT — RES.PROMPTS.VARS: Research template variables for prompts

**Done:** Researched and documented template variable support for persona prompts. Doc covers all 5 investigation areas: (1) syntax — recommends `{{variable.name}}` (Mustache-style), with comparison table vs `${var}`, `{var}`, etc., (2) built-in variables — 10 prompt-time vars (project.*, persona.*, date.*) + 5 execution-time vars (workItem.*, workflow.*), with table of what's NOT available as variables and why, (3) user-defined variables — `vars.*` namespace, `project_variables` table schema, Settings UI location, (4) resolution — `resolveVariables()` in `buildSystemPrompt()`, undefined vars left as-is with warning, no logic/conditionals, (5) UI — autocomplete on `{{`, variable reference panel, enhanced preview with resolved values. Includes 4-phase implementation plan and architecture relationship.
**Files:** `docs/proposals/persona-prompts/template-variables.md` (new)

---

## 2026-04-02 16:25 PDT — Review: RES.PROMPTS.DOC (approved)

**Reviewed:** Persona prompt pipeline documentation.
- All 5 task requirements covered (storage, assembly, Pico path, SDK delivery, user vs system control)
- Verified `buildSystemPrompt()` assembly order against source (lines 25-97) — exact match
- Verified Pico chat assembly against `chat.ts` (lines 274-313) — exact match
- Verified SDK delivery and subagent prompt fallback (line 517) — accurate
- Architecture diagrams, section format details, and comparison tables all correct
- Written to correct output path `docs/proposals/persona-prompts/current-architecture.md`
- **Verdict: approved.**

---

## 2026-04-02 16:20 PDT — RES.PROMPTS.DOC: Document persona prompt pipeline

**Done:** Traced and documented the full persona prompt storage and assembly pipeline. Doc covers: (1) persona DB schema (`systemPrompt` TEXT field), (2) editor UI (textarea, no structured fields), (3) `buildSystemPrompt()` in claude-executor.ts — 5-section assembly with `\n\n` separators (user prompt → project context → work item → sandbox → history), (4) Pico chat assembly — 4-section variant (user prompt → skill file → project context → personality), (5) SDK delivery via `AgentDefinition.prompt` in `query()`, (6) user-controlled vs system-injected table, (7) project memories are on-demand via MCP tool only. Includes architecture diagrams.
**Files:** `docs/proposals/persona-prompts/current-architecture.md` (new)
**Notes:** Key finding: subagents only get raw `systemPrompt` or `description` — no project/task/sandbox injection. Memories are never auto-injected.

---

## 2026-04-02 16:10 PDT — Review: UX.BRAND.WOOF (approved)

**Reviewed:** Rebrand all user-visible "AgentOps" references to "Woof".
- Page title "Woof" in index.html with favicon.svg link tag
- SVG paw-print favicon (amber bg, white paw, 3 toes + main pad) — well-formed
- Sidebar brand: Dog icon + "Woof" text above project switcher, collapses to icon only
- Status bar, mobile header, settings, tool-config all say "Woof"
- Only remaining "AgentOps" in frontend is a CSS comment (developer-facing) — correct per spec
- Build passes, visual check on dashboard, chat, and settings pages confirms correct layout
- **Verdict: approved.**

---

## 2026-04-02 16:05 PDT — UX.BRAND.WOOF: Rebrand app as Woof

**Done:** Rebranded all user-visible "AgentOps" references to "Woof". Changes: (1) page title in index.html → "Woof", (2) new SVG paw-print favicon (amber background, white paw) in `public/favicon.svg` with link tag in index.html, (3) sidebar header — added Woof brand row with amber Dog icon + "Woof" text above the project switcher, (4) status bar "AgentOps" → "Woof", (5) mobile top bar "AgentOps" → "Woof", (6) settings appearance "AgentOps background service" → "Woof background service", (7) tool-configuration "AgentOps Tools" → "Woof Tools". Pico's avatar already uses Dog icon with amber theme — no changes needed. No login/splash screen exists. Code/package names and developer-facing docs left as "AgentOps".
**Files:** `packages/frontend/index.html`, `packages/frontend/public/favicon.svg` (new), `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/components/status-bar.tsx`, `packages/frontend/src/layouts/root-layout.tsx`, `packages/frontend/src/features/settings/appearance-section.tsx`, `packages/frontend/src/features/persona-manager/tool-configuration.tsx`

---

## 2026-04-02 15:45 PDT — Review: UX.PICO.COLLAPSE (approved)

**Reviewed:** Replace X icon with ChevronDown on mini chat panel.
- ChevronDown icon at line 330 replaces X ✓
- Tooltip says "Minimize" (not "Close") ✓
- Unused X import removed from lucide-react ✓
- Build passes, visual check confirms chevron visible in header ✓
- **Verdict: approved.**

---

## 2026-04-02 15:40 PDT — UX.PICO.COLLAPSE: Replace X with collapse chevron

**Done:** Replaced the close (X) button in the Pico mini chat panel header with a downward ChevronDown icon to indicate minimize/collapse behavior instead of close/end. Tooltip already said "Minimize" from prior work. Removed unused `X` import from lucide-react. `ChevronDown` was already imported.
**Files:** `packages/frontend/src/features/pico/chat-panel.tsx`

---

## 2026-04-02 15:30 PDT — Review: UX.PICO.FULLPAGE (approved)

**Reviewed:** Full-page chat view with session sidebar and verbose rendering.
- New `/chat` page with session sidebar, click-to-switch, double-click-to-rename ✓
- `compact={false}` renders expandable thinking blocks, full tool call cards with chevrons ✓
- Centered max-w-3xl layout, spacious typography ✓
- Maximize2 expand button in mini panel header navigates to `/chat` ✓
- MessageSquare "Chat" nav item in sidebar ✓
- Mini panel + bubble hidden on `/chat` via useLocation check ✓
- Minimize button returns to previous page and reopens mini panel ✓
- Build passes, visual check on both `/chat` and dashboard confirms correct behavior ✓
- **Verdict: approved.**

---

## 2026-04-02 15:20 PDT — UX.PICO.FULLPAGE: Full-page chat view

**Done:** Created `/chat` full-page view with session sidebar and verbose message rendering. New `pages/chat.tsx` with: (1) session sidebar (256px) showing all conversations with click-to-switch, double-click-to-rename, clear all; (2) main chat area using `ChatMessage` with `compact={false}` — expandable thinking blocks, full tool call cards with chevrons, rich markdown; (3) centered max-w-3xl layout with spacious typography. Added `Maximize2` expand button to mini panel header (navigates to `/chat`, closes overlay). Added `MessageSquare` "Chat" nav item in sidebar. Hid mini panel and chat bubble on `/chat` route via `useLocation` check in `root-layout.tsx`. Minimize button in full-page view navigates back and reopens mini panel.
**Files:** `packages/frontend/src/pages/chat.tsx` (new), `packages/frontend/src/router.tsx`, `packages/frontend/src/components/sidebar.tsx`, `packages/frontend/src/features/pico/chat-panel.tsx`, `packages/frontend/src/layouts/root-layout.tsx`

---

## 2026-04-02 15:05 PDT — Review: UX.PICO.STATUSBAR (approved)

**Reviewed:** Consolidated status line for thinking/tool calls in compact mode.
- Single StatusLine replaces separate one-liners — timer-based cycling with 1.5s min display ✓
- Counter + expandable chevron with border-left styled list ✓
- Rich labels via getToolDescription (file paths, commands, patterns, queries) ✓
- History fix: useState lazy init skips to last item on mount — no cycling for loaded history ✓
- CompactMessageBody separates status/text blocks cleanly ✓
- Full non-compact rendering unchanged ✓
- Build passes, visual check confirms layout, expand, and history behavior ✓
- **Verdict: approved.** Includes post-review history fix (no-delay for non-streaming).

---

## 2026-04-02 14:55 PDT — UX.PICO.STATUSBAR: Consolidated status line for thinking/tool calls

**Done:** Replaced separate compact thinking/tool_use one-liners with a single animated `StatusLine` component. In compact mode, all thinking and tool_use blocks are collected into status items and rendered as one updating line that auto-advances through items with 1.5s minimum display time. Shows a counter (e.g. "3/3") and an expand chevron to reveal the full list with left-border styling. Added `getToolDescription()` for rich labels — extracts file paths from Read/Edit/Write (`pathBasename`), commands from Bash (`truncStr`), patterns from Grep/Glob, queries from WebSearch, descriptions from Agent tool. `CompactMessageBody` separates status blocks from text blocks, rendering StatusLine + PicoMarkdown. Updated mock data to use Read tool for better demo labels. Full (non-compact) rendering unchanged.
**Files:** `packages/frontend/src/features/pico/chat-message.tsx`
**Notes:** The `CompactThinking` and `CompactToolCall` components are still present for potential reuse in the expanded list but are currently unused — StatusLine renders its own inline items.

---

## 2026-04-02 14:40 PDT — Review: UX.PICO.RESIZE (approved)

**Reviewed:** Drag-to-resize on Pico chat panel — top, left, and corner handles.
- Resize handles correctly positioned with appropriate cursors (ns, ew, nwse) ✓
- Min/max constraints enforced: 320x400 min, 600x80vh max, CSS `min()` safety net ✓
- Delta calculation correct: dragging left/up grows panel (anchored bottom-right) ✓
- Event listeners cleaned up on mouseup, preventDefault blocks text selection ✓
- Animation suppressed during resize, content reflows responsively ✓
- Size persisted in Zustand store with localStorage persistence ✓
- Build passes, visual check confirms no layout issues ✓
- **Verdict: approved.**

---

## 2026-04-02 14:25 PDT — UX.PICO.RESIZE: Drag-to-resize on Pico chat panel

**Done:** Added drag-to-resize on top edge (ns-resize), left edge (ew-resize), and top-left corner (nwse-resize) of the Pico chat panel. Constraints: min 320x400, max 600x80vh. Dimensions persisted via Zustand `persist` middleware in `pico-store.ts` (`panelWidth`, `panelHeight`, `setPanelSize`). Panel style uses dynamic `width`/`height` from store instead of hardcoded `w-[400px]`. Resize handles are invisible 2px-wide zones on edges with appropriate cursors. Animation class suppressed during resize to prevent jank. Content reflows responsively — wider panel means longer message lines. Verified: drag left edge → panel widens, size persists across reload.
**Files:** `packages/frontend/src/features/pico/chat-panel.tsx`, `packages/frontend/src/features/pico/pico-store.ts`

---

## 2026-04-02 14:10 PDT — Review: UX.PICO.MINI.CONTENT (approved)

**Reviewed:** Compact thinking and tool call rendering in mini chat panel.
- Thinking: single italic "Thinking..." line with brain icon, not expandable ✓
- Tool calls: "Used Bash — summary..." one-liners with icon + status, no card/expand ✓
- Markdown text rendering unchanged — paragraphs, bullets, bold, code all correct ✓
- `compact` prop (default true) flows ChatMessage → ContentBlockRenderer → compact/full variants ✓
- Full verbose rendering preserved for `compact={false}` (future UX.PICO.FULLPAGE) ✓
- TOOL_ICONS correctly moved above compact components to avoid reference-before-definition ✓
- Build passes, visual verification confirms all three requirements met ✓
- **Verdict: approved.**

---

## 2026-04-02 14:00 PDT — UX.PICO.MINI.CONTENT: Compact thinking and tool calls in mini panel

**Done:** Added `compact` prop (default `true`) to `ChatMessage` and `ContentBlockRenderer`. In compact mode: (1) thinking blocks render as a single italic "Thinking..." line with Brain icon — no expandable card, no border, (2) tool calls render as "Used Bash — summary..." one-liners with tool icon + status indicator — no expandable card, no input/output details. Full verbose rendering (expandable `ThinkingBlock` and `ToolCallCard`) is preserved for `compact={false}` (future full-page view). Moved `TOOL_ICONS` map above compact components to avoid reference-before-definition. Verified visually: thinking block is now a single line, tool calls are compact one-liners, markdown text rendering unchanged.
**Files:** `packages/frontend/src/features/pico/chat-message.tsx`

---

## 2026-04-02 13:45 PDT — Review: FX.PICO.EMPTY.BUBBLE (approved)

**Reviewed:** Fix for empty chat bubble appearing before streaming content.
- `isEmptyStreaming` guard correctly checks 3 conditions (isStreaming, last message, empty content) — won't affect non-streaming or populated messages ✓
- TypingIndicator guard condition unchanged, still shows only when content is empty ✓
- Margin changed from `mt-1` to `mt-3` compensates for removed empty bubble spacing ✓
- Single file change, minimal and focused ✓
- Build passes, visual verification confirms no regressions ✓
- **Verdict: approved.**

---

## 2026-04-02 13:35 PDT — FX.PICO.EMPTY.BUBBLE: Hide empty bubble during streaming

**Done:** When Pico starts streaming, a message with empty `content: []` was added to the messages array. `ChatMessage` rendered this as an empty bubble (avatar + muted background + padding, no text) before the TypingIndicator below it. Fix: in `chat-panel.tsx`, skip rendering the last message during streaming if its content array is empty (`return null` from the map). The TypingIndicator already handles this state — changed its margin from `mt-1` to `mt-3` to provide proper spacing since the empty bubble no longer precedes it. Verified: panel renders correctly with existing messages, no regressions.
**Files:** `packages/frontend/src/features/pico/chat-panel.tsx`
