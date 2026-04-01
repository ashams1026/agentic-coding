# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-01 16:20 PDT — Review: RES.SWAP.HOSTED (approved)

**Reviewed:** Hosted frontend deployment model research doc.
- All 6 areas covered: onboarding flow (3-step wireframe, friction mitigation, returning user flow), local backend discovery (browser mixed content matrix for Chrome/Firefox/Safari/Edge — localhost is special-cased in all modern browsers, silent probe approach with tradeoffs), tunnel/remote access (3 tools compared: ngrok/Cloudflare/Tailscale with free tier/auth/persistence comparison, security implications of tunnel exposure, CORS analysis), multi-backend management (localStorage model, workspace switcher wireframe, independent instances, cross-device export/import + URL params), hosted infrastructure (actual build output analyzed — 1.1MB JS + 92KB CSS, 5 CDN platforms compared, Cloudflare Pages recommended, CI/CD pipeline, versioning/compatibility matrix), business model (free CDN ~$0 cost, value in backend+execution, 3-tier future model, local-first always fully functional, Apache-2.0 compatible)
- Source code claims verified: bin.agentops at package.json:7-9 (content correct, doc says 8-10 — minor), CORS at server.ts:27-30, health at server.ts:33-41 with version "0.0.1" and executor field, listen 0.0.0.0 at start.ts:212
- Cross-references checked: architecture.md exists, inbound-triggers.md exists, future docs correctly noted
- Implementation approach correctly depends on RES.SWAP.ARCH phases 1-2, 3-phase plan logically ordered
- 6 design decisions well-reasoned and consistent with local-first principles
- **Verdict: approved.**

---

## 2026-04-01 16:15 PDT — RES.SWAP.HOSTED: Research hosted frontend deployment model

**Done:** Researched hosted frontend deployment model. Doc covers all 6 investigation areas: (1) onboarding flow — step-by-step first visit experience with install/start/connect instructions, auto-polling "Test Connection" button, returning user reconnection banner; (2) local backend discovery — mixed content analysis confirms all modern browsers allow HTTP localhost from HTTPS origins, silent localhost:3001 probe for auto-detection, documented what doesn't work (LAN IPs, mDNS from HTTPS); (3) tunnel/remote access — compared ngrok, Cloudflare Tunnel, Tailscale for user-managed tunnels with free tier/auth/URL persistence comparison, security implications (mandatory auth, rate limiting), CORS requirements for tunnel URLs, deferred built-in tunnel; (4) multi-backend management — localStorage-based connection storage, workspace switcher dropdown in sidebar, independent backend instances (no data merging), online/offline status polling, cross-device via export/import + URL params; (5) hosted frontend infrastructure — current build output analysis (1.2MB/300KB gzipped), CDN platform comparison (5 options), recommended Cloudflare Pages (unlimited free bandwidth), CI/CD pipeline via GitHub Actions, versioning/compatibility matrix with apiVersion check, cache busting, canary deployments; (6) business model — free frontend on CDN (~$0 cost), value in backend+agent execution, 3-tier future model (free local/team managed/enterprise), local-first always fully functional, open source compatible. Also: 3-phase implementation approach with prerequisites, 7 cross-references, 6 design decisions.
**Files:** `docs/proposals/frontend-backend-swappability/hosted-frontend.md` (new)

---

## 2026-04-03 01:45 PDT — Review: RES.SWAP.ARCH (approved)

**Reviewed:** Frontend/backend decoupling architecture research doc.
- All 7 areas covered: current state audit (API_BASE_URL at client.ts:48, 5 helpers + 6 inline fetch at specific lines, WS at ws-client.ts:53, CORS at server.ts:27-30, health at :33-41), backend selector UX (3 access points, connection model, list/add wireframes, sidebar indicator), connection validation (health check flow with 4 error paths, enhanced response with apiVersion + capabilities, 30s polling), auth (bearer token scheme, header injection, localStorage, security note), WebSocket reconnection (5-step switch flow, handler survival, Agent Monitor stream clearing), offline/disconnected (3 detection signals, 4-tier degradation table, TanStack Query cache, polling backoff), deployment models (5 models with architecture diagrams, enabled vs additional work table)
- Source code claims verified: client.ts:48-49 (API_BASE_URL/BASE_URL), ws-client.ts:23/53/77-81/90/122-128/136 (class/URL/onclose/disconnect/onReconnect/scheduleReconnect), server.ts:27-28 (CORS origins), server.ts:33/39 (health/version)
- Implementation approach pragmatic: Zustand connection store, Phase 1 single-file change
- 6 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-03 01:30 PDT — RES.SWAP.ARCH: Research frontend/backend decoupling architecture

**Done:** Researched frontend/backend decoupling architecture. Doc covers all 7 investigation areas: (1) current state audit — hardcoded `API_BASE_URL = "http://localhost:3001"` at client.ts:48, 30+ API functions using `BASE_URL` through 5 helpers + 6 inline fetch calls, WebSocket URL derived from same constant at ws-client.ts:53, CORS hardcoded to localhost ports at server.ts:27-30, health endpoint at server.ts:33-41 with version; (2) backend selector UX — Settings > Connection page, connection list with status indicators, add/edit dialog with test, sidebar footer status indicator, first-run screen if no connection; (3) connection validation — health check flow with version comparison, enhanced health response with apiVersion + capabilities, periodic 30s health polling with 3-strike disconnect detection; (4) auth — bearer token (API key) scheme, header injection per connection, localStorage storage with security note, OAuth/SSO deferred; (5) WebSocket reconnection — 5-step switch flow (disconnect → update store → connect new → invalidate cache → refetch), handler survival across reconnects, Agent Monitor stream clearing; (6) offline/disconnected — 3 detection signals, 4-tier degradation (connected/recent/extended/no-backend), TanStack Query stale cache serving, reconnection polling with backoff; (7) deployment models — 5 models enabled (local, SPA+local, SPA+tunnel, team server, desktop app), what's enabled vs what needs additional work. Also: implementation approach (Zustand connection store replacing constant), 3-phase migration, backend CORS change, 6 cross-references, 5 design decisions.
**Files:** `docs/proposals/frontend-backend-swappability/architecture.md` (new)

---

## 2026-04-03 01:00 PDT — Review: RES.WEBHOOKS.OUTBOUND (approved after rework)

**Reviewed:** Outbound event webhooks research doc — rework review.
- All 7 feedback points addressed: agent_started at execution-manager.ts:341 ✓, agent_completed at :539 ✓, agent_completed (failure) at :693 ✓, state_change at work-items.ts:166 / mcp-server.ts:197 ✓, proposal_created/proposal_updated correctly noted as unused types (defined in ws-events.ts:22-23 but never broadcast in backend), comment_created at mcp-server.ts:704 ✓, file list updated to 6 files with execution-manager.ts ✓
- Implementation gap note for proposal events clearly states Phase 2 prerequisite
- Core design unchanged and remains solid: delivery infrastructure, payload format, retry, event bus, auto-disable
- **Verdict: approved.**

---

## 2026-04-03 00:50 PDT — RES.WEBHOOKS.OUTBOUND (rework): Fix event source references

**Done:** Addressed all 7 feedback points from review. Fixed event catalog table in section 2: (1) agent_started source → execution-manager.ts:341, (2) agent_completed source → execution-manager.ts:539, (3) agent_completed failure source → execution-manager.ts:693, (4) state_change source → work-items.ts:166 / mcp-server.ts:197. For proposal_created and proposal_updated: explicitly noted these types exist in ws-events.ts but are NOT currently broadcast anywhere — added implementation gap note explaining broadcast calls need to be added as a Phase 2 prerequisite. Updated section 1 file list from 5 to 6 files, adding execution-manager.ts as primary broadcast site for agent lifecycle events.
**Files:** `docs/proposals/webhooks/outbound-events.md` (modified)

---

## 2026-04-03 00:30 PDT — Review: RES.WEBHOOKS.OUTBOUND (rejected)

**Reviewed:** Outbound event webhooks research doc.
- Core design is solid: delivery infrastructure (SQLite queue + polling), payload format (JSON envelope), retry strategy (exponential backoff, 5 attempts), shared event bus, auto-disable, delivery log, HMAC signing, notification relationship analysis — all well-designed.
- **Issue: Event catalog source references are wrong.** 6 of 8 events in section 2 table reference incorrect files/lines: agent_started is at execution-manager.ts:341 (not dispatch.ts:63), agent_completed at execution-manager.ts:539/:693 (not claude-executor.ts:304/:343), state_change at mcp-server.ts:198 (not :93). proposal_created and proposal_updated types exist in ws-events.ts but are never actually broadcast anywhere — doc claims they fire from mcp-server.ts:313/:344 (those lines broadcast comment_created and state_change respectively).
- Section 1 file list misses execution-manager.ts which is a major broadcast site.
- **Verdict: rejected.** Feedback added to TASKS.md with specific corrections needed.

---

## 2026-04-03 00:15 PDT — RES.WEBHOOKS.OUTBOUND: Research outbound event webhooks

**Done:** Researched outbound event webhooks. Doc covers all 5 investigation areas: (1) subscribable events — 8-event catalog mapped from internal WsEvent types (14) and audit events (7) to curated outbound subset: execution.started/completed/failed, work_item.state_changed, proposal.created/resolved, budget.threshold, comment.created; dotted naming for wildcard support; (2) webhook configuration — WebhookSubscription interface (12 fields), event type checkboxes, per-project or global scope, test/ping button, subscription list + create/edit wireframes in Settings > Integrations > Outbound Webhooks; (3) payload format — standardized JSON envelope (event, webhookId, deliveryId, timestamp, data), 8 event-specific payloads with full field specs, security exclusions (no API keys, full logs, prompts, file content); (4) delivery — async dispatch via SQLite queue + in-process polling worker (2s interval), exponential backoff retry (5 attempts, 30s-30min), 10s HTTP timeout, HMAC signing (X-Webhook-Signature), auto-disable after 10 consecutive failures, delivery log with status/latency/retry history, 30-day retention; (5) relationship to notifications — compared audiences/channels/content/filtering, shared event bus architecture (TypedEventEmitter) with separate webhook + notification dispatchers, recommendation to keep separate but share event source. Also: delivery queue table schema, 3-phase plan, 6 cross-references, 5 design decisions.
**Files:** `docs/proposals/webhooks/outbound-events.md` (new)

---

## 2026-04-02 23:45 PDT — Review: RES.WEBHOOKS.INBOUND (approved)

**Reviewed:** Inbound triggers from external systems research doc.
- All 5 areas covered: GitHub integration (5 events, App approach, HMAC, payload mapping, setup wireframe, tunnel challenge), generic webhook receiver (POST /api/webhooks/:triggerId, WebhookTrigger interface, Handlebars templates, CI example), Slack triggers (slash commands, bot mentions, 3-sec async, thread-aware, channel scoping), trigger config UX (Settings > Integrations, list/create/edit wireframes, test panel), security (HMAC timingSafeEqual, 3-tier rate limiting, IP allowlisting, replay protection, malformed handling)
- Source code claims verified: dispatchForState() at dispatch.ts:23, canSpawn() at concurrency.ts:46, enqueue() at concurrency.ts:76, no trigger/webhook tables in schema.ts, no webhook routes exist
- Cross-reference to scheduling infrastructure doc (docs/proposals/scheduling/infrastructure.md) confirmed to exist
- Data model well-designed: webhook_triggers + webhook_deliveries tables with trigger_id/trigger_type on executions aligning with scheduling proposal
- 3-phase plan correctly ordered (generic → GitHub → Slack), 6 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-02 23:30 PDT — RES.WEBHOOKS.INBOUND: Research inbound triggers

**Done:** Researched inbound triggers from external systems. Doc covers all 5 investigation areas: (1) GitHub integration — 5 event use cases (PR opened, issue created, CI failed, review requested, push), GitHub App vs raw webhooks (App preferred for permissions + per-repo install), webhook receiver at POST /api/webhooks/github with X-Hub-Signature-256, 4 event types with extracted variable mappings, setup flow wireframe, local-first tunnel challenge noted; (2) generic webhook receiver — POST /api/webhooks/:triggerId endpoint, WebhookTrigger interface (12 fields), Handlebars-style prompt template with {{payload.*}} variables, custom CI integration example; (3) Slack triggers — slash commands (/woof) + bot mentions + reactions, Slack App with signature verification, 3-second response requirement (async dispatch + later posting), thread-aware responses, channel scoping, setup flow wireframe; (4) trigger configuration UX — Settings > Integrations section (GitHub/Slack/Custom Webhooks), trigger list view wireframe, create/edit dialog wireframe with endpoint URL, secret, event filter, prompt template editor, "Test with Sample Payload" preview panel; (5) security — HMAC verification (timingSafeEqual), 3-tier rate limiting (10/min burst, 60/hr sustained, 100/min global), optional IP allowlisting with GitHub published ranges, replay protection (timestamp + delivery ID dedup), malformed payload handling (4 cases). Also: data model (webhook_triggers + webhook_deliveries tables, trigger_id/trigger_type on executions), 3-phase plan, 6 cross-references, 5 design decisions.
**Files:** `docs/proposals/webhooks/inbound-triggers.md` (new)

---

## 2026-04-02 23:15 PDT — Review: RES.ANALYTICS.UX (approved)

**Reviewed:** Analytics dashboard UX design research.
- All 5 areas covered: where analytics live (4 options compared, hybrid recommended — dedicated /analytics page + dashboard link; nav item between Activity Feed and Chat; dashboard enhancement wireframe), time range controls (5 presets with default 7d, comparison mode with dashed overlay, URL query params for shareability), visualizations (7 chart types: summary cards with deltas, cost LineChart, outcomes stacked BarChart, cost-by-persona horizontal BarChart, persona leaderboard Table, activity heatmap via CSS Grid, workflow bottlenecks; full-page wireframe; each chart with specific Recharts component and API endpoint), drill-down (7 click targets → actions mapped, execution list modal wireframe with "View Detail" link to Agent Monitor, filter chips for persona/state), export (CSV with 11-column spec, JSON alternative, dashboard snapshot deferred)
- Source code claims verified: dashboard.tsx stat cards grid at :68, cost-summary.tsx Recharts AreaChart at :4/:129, agent-history.tsx stats at :141-167, costs-section.tsx BarChart at :3/:236, sidebar.tsx 7 nav items at :38-46 with correct insertion point
- Responsive design well-considered (3 breakpoints, ResponsiveContainer pattern from cost-summary.tsx)
- 3-phase plan correctly defers workflow bottlenecks to Phase 2 (audit log dependency)
- 6 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-02 23:00 PDT — RES.ANALYTICS.UX: Research analytics dashboard UX

**Done:** Researched analytics dashboard UX design. Doc covers all 5 investigation areas: (1) where analytics live — 4 options compared (dedicated page/embedded/settings tab/hybrid), audited 4 existing surfaces (dashboard stat cards at dashboard.tsx:68-97, cost widget with Recharts AreaChart in cost-summary.tsx, agent-history stats bar at :143-172, settings costs with BarChart in costs-section.tsx), recommended hybrid — dedicated /analytics page + dashboard link, new nav item between Activity Feed and Chat; (2) time range controls — 5 presets (24h/7d/30d/90d/custom), comparison mode (vs previous period with dashed overlay), URL query params for shareability, backend endpoint extension needed; (3) visualizations — 7 chart types (summary cards with deltas, cost line chart, outcomes stacked bar, cost-by-persona horizontal bar, persona leaderboard table, activity heatmap via CSS Grid, workflow bottlenecks bar), full-page wireframe, each chart with data source API endpoint, Recharts for all except custom heatmap; (4) drill-down — click targets mapped to actions (7 interactions), execution list modal design, filter chips for persona/state, "View Detail" to Agent Monitor; (5) export — CSV with column spec, JSON alternative, dashboard snapshot deferred to Phase 3. Also: responsive breakpoints (3 tiers), 3-phase implementation plan, 6 cross-references, 5 design decisions.
**Files:** `docs/proposals/analytics/ux-design.md` (new)

---

## 2026-04-02 22:45 PDT — Review: RES.ANALYTICS.METRICS (approved)

**Reviewed:** Agent analytics metrics collection and storage research.
- All 5 areas covered: per-execution (10 existing columns audited, 8 missing metrics identified with priority P0-P2, SDK result fields mapped — costUsd/durationMs captured at executor:180-181, token fields on msg.usage not captured; 8 ALTER TABLE columns proposed), per-persona (7 derived metrics via SQL GROUP BY, persona leaderboard table design), per-project (5 metrics via workItems join, burn-down deferred to Phase 2), per-workflow (step timing via paired audit state_transitions, bottleneck identification, workflow_state column on executions for per-state analytics), collection strategy (3 options compared with pros/cons; SQLite perf at 1K/10K/50K/100K rows; typical instance 3.6K-18K executions/year; hybrid recommended)
- Source code claims verified: executions table at schema.ts:142-159 (all 10 columns match), audit.ts:14-15 (LOG_DIR + AUDIT_FILE paths), executor costUsd/durationMs at claude-executor.ts:180-181, FileChanged hook at :603, retry extraction at :170-173, dashboard.ts 3 endpoints with in-memory aggregation, chat.ts:418 metadata.costUsd
- SDK types verified: SDKResultSuccess has usage:NonNullableUsage (→BetaUsage with input_tokens/output_tokens/cache fields) and num_turns. Note: doc's code block shows token fields as direct properties of result message — actually nested under msg.usage. Minor presentation simplification; core claim (fields exist, not captured) is correct.
- Audit log DB migration plan well-designed (audit_events table with 3 indexes)
- 5 SQL indexes for common query patterns appropriate
- 3-phase plan correctly ordered, 6 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-02 22:30 PDT — RES.ANALYTICS.METRICS: Research metrics collection

**Done:** Researched agent analytics metrics collection and storage. Doc covers all 5 investigation areas: (1) per-execution metrics — audited executions table (10 existing columns), identified 8 missing metrics (input/output/cache tokens, model, num_turns, tool_call_count, files_modified_count, workflow_state), mapped SDK result message fields showing 4 token fields not captured at claude-executor.ts:180-181, recommended extending executions table with 8 new columns; (2) per-persona metrics — 7 derived metrics via SQL GROUP BY personaId, persona leaderboard table design (runs, success rate, avg cost, avg duration, total cost); (3) per-project metrics — 5 metrics via join through workItems.projectId, backlog burn-down deferred to Phase 2 (requires snapshots or event replay); (4) per-workflow metrics — workflow step timing via paired state_transition audit entries, bottleneck identification with rejection rate per step, recommended adding `workflow_state` column to executions for per-state analytics; (5) collection strategy — 3 options compared (query-time/rollup tables/hybrid), SQLite performance analysis (<10ms at 1K rows, ~500ms at 100K), estimated 3.6K-18K executions/year for typical instance, recommended hybrid (Phase 1 query-time, Phase 2 rollup). Also: audit log DB migration plan, 7 SQL indexes for common query patterns, 3-phase implementation plan.
**Files:** `docs/proposals/analytics/metrics.md` (new)

---

## 2026-04-02 22:15 PDT — Review: RES.TEMPLATES (approved)

**Reviewed:** Templates and presets system research.
- All 5 areas covered: work item templates (WorkItemTemplate interface, 5 built-in templates with pre-filled fields, "New from Template" dropdown + command palette, custom templates via "Save as Template", storage in `work_item_templates` table), workflow templates (WorkflowTemplate with states + transitions + persona mapping, 5 built-in workflows, template selector in project creation, export/import as JSON), project templates (ProjectTemplate bundles workflow + personas + starter items, 4 built-in project templates, "Create from Template" dialog wireframe with "Customize" expansion), persona presets (current state audit — 6 built-ins with empty systemPrompt, duplicate button exists; 6 additional presets with model/tools/budget, "Browse Presets" library wireframe, "Reset to Default"), storage and sharing (4 options compared; hybrid DB + JSON export recommended; single `templates` table with type discriminator; `.woof.json` format; community gallery deferred to Phase 3+)
- Source code claims verified: BUILT_IN_PERSONAS at default-personas.ts:17, DEFAULT_STATE_ASSIGNMENTS at :75-81, systemPrompt:"" at :103, Duplicate button at persona-list.tsx:118-121, handleDuplicate at :231, currentState text at schema.ts:29, workflow-config-section.tsx exists, seedDefaultPersonasForProject at projects.ts:85
- Settings integration well-designed with per-type primary/secondary locations
- 3-phase plan correctly ordered (work items + personas first, workflows + projects second, sharing third)
- 6 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-02 22:00 PDT — RES.TEMPLATES: Research templates and presets system

**Done:** Researched templates and presets system design. Doc covers all 5 investigation areas: (1) work item templates — WorkItemTemplate interface, 5 built-in templates (Bug Report, Feature Request, Spike, Documentation, Refactor) with pre-filled fields, "New from Template" dropdown UX + command palette integration, custom templates via "Save as Template" on existing items, (2) workflow templates — WorkflowTemplate/WorkflowStateTemplate/WorkflowTransitionTemplate interfaces, 5 built-in workflow templates (Default Linear, Simple Kanban, Code Review Pipeline, Documentation Pipeline, Bug Triage), template selector in project creation dialog, export/import via JSON, (3) project templates — ProjectTemplate bundles workflow + personas + optional starter items, 4 built-in project templates (Standard, Lightweight, Code Review Focused, Documentation Project), "Create Project from Template" dialog wireframe with "Customize" inline expansion, (4) persona presets — audited current state (6 built-ins with empty systemPrompt in default-personas.ts:103, duplicate button at persona-list.tsx:231), 6 additional presets (Bug Triager, Documentation Writer, Test Engineer, Security Reviewer, Dependency Updater, Release Manager), "Browse Presets" library UI wireframe, "Reset to Default" for built-ins, (5) storage and sharing — 4 options compared (DB/JSON files in project/JSON in app data/hybrid), recommended hybrid DB + JSON export with `.woof.json` format, single `templates` table with type discriminator, community gallery as Phase 3+. 3-phase implementation plan, 6 cross-references, 5 design decisions.
**Files:** `docs/proposals/templates/design.md` (new)

---

## 2026-04-02 21:45 PDT — Review: RES.ROLLBACK (approved)

**Reviewed:** Rollback UX and implementation research.
- All 6 areas covered: rollback scope (3-scope comparison table — per-execution/per-message/per-tool-call with SDK support, complexity, user value; per-execution as Phase 1, per-message Phase 2, per-tool-call not recommended), UX (4-surface analysis with priority — Agent Monitor P0 exists, execution detail panel P1 with wireframe, work item timeline P2, activity feed P3; 3 confirmation dialog enhancements: diff preview, conflict warning, time-elapsed), partial rollback (SDK is all-or-nothing; 3 approaches: git-based selective revert with race condition identified, pre-rewind snapshot recommended for Phase 3, SDK feature request; honest tradeoff analysis), safety (4 detection strategies compared; 2-tier recommendation: mtime + execution history; conflict UI wireframe; warning-only approach with running-execution exception), git integration (4 options: working tree/auto-commit/staged/user choice; recommended Option D user choice with default-on commit; auto-generated message with editable text), SDK limitations (9-feature audit table; 5 custom implementations needed; checkpoint retention analysis ~5MB/day; cross-session validity confirmed as critical architectural enabler)
- Source code claims verified: enableFileCheckpointing at claude-executor.ts:564, checkpointEmitted at :655-661, checkpointMessageId at execution-manager.ts:431/445/525, schema.ts:156, rewind API at executions.ts:167-322, client.ts:280-283, RewindButton at agent-history.tsx:275-395, rewind_execution MCP tool at mcp-server.ts:628-671, running block at executions.ts:196-203
- BUG-1 reference verified at e2e results :47
- SDK RewindFilesResult type matches exactly (canRewind/error/filesChanged/insertions/deletions)
- 3-phase plan correctly ordered by effort and value
- 6 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

---

## 2026-04-02 21:30 PDT — RES.ROLLBACK: Research rollback UX and implementation

**Done:** Researched rollback UX and implementation design. Doc covers all 6 investigation areas: (1) rollback scope — per-execution (current, sufficient for Phase 1), per-message (Phase 2, requires capturing all assistant message IDs), per-tool-call (not recommended — SDK doesn't support, git is better); (2) UX — 4-surface analysis (Agent Monitor history P0 exists, execution detail panel P1, work item timeline P2, activity feed P3); enhanced confirmation dialog with time-elapsed indicator + conflict warnings + per-file diffs; (3) partial rollback — SDK is all-or-nothing; 3 approaches compared (git-based selective revert, pre-rewind snapshot recommended for Phase 3, SDK feature request); checkbox per file in dialog; (4) safety — 2-tier conflict detection (mtime comparison + execution history cross-reference); warning-only approach (never block); conflict UI wireframe showing which files modified and by whom; (5) git integration — 4 options compared (working tree only, auto-commit, staged changes, user choice); recommended: opt-in git commit creation (default on) with auto-generated message; (6) SDK limitations — 9-feature audit table; 5 custom implementations needed (conflict detection, git commits, per-file diffs, multiple checkpoints, partial rollback); checkpoint storage analysis (~5MB/day at 100 executions, not a near-term concern). 3-phase implementation plan, 6 cross-references, 5 design decisions.
**Files:** `docs/proposals/rollback/design.md` (new)

---

## 2026-04-02 21:15 PDT — Review: RES.SCHED.INFRA (approved)

**Reviewed:** Scheduling infrastructure and backend design research.
- All 5 areas covered: scheduler implementation (7-option comparison table with clear tradeoffs; node-cron + SQLite persistence recommended — zero external deps; Scheduler singleton with 4 lifecycle functions; startup integration at correct position in start.ts boot sequence after migrations + recovery), missed runs (nextRunAt detection on startup; catch-up policy per-schedule with "run once not N" rationale; skip-and-advance alternative; notification integration), data model (schedules table with 14 columns matching RES.SCHED.UX ScheduleDefinition; schedule_id + trigger_type extensions on executions; nextRunAt via cron-parser; auto-disable at 10 consecutive failures with cron unregister + notification), concurrency (shared pool with existing canSpawn/enqueue — no separate limit; 3 overlap policies with queue as default; p2 priority; "all projects" fan-out), trigger interaction (schedules vs triggers vs workflow dispatch clearly distinguished in 3-concept table; standalone executions bypass workflow; Phase 3 unified triggers table deferred until RES.WEBHOOKS.INBOUND)
- Source code claims verified: recoverOrphanedState() at start.ts:38, SHUTDOWN_TIMEOUT_MS=30000 at :15, canSpawn() at concurrency.ts:46, enqueue() at :76, DEFAULT_MAX_CONCURRENT=3 at :12, dispatchForState() at dispatch.ts:23
- 7 CRUD API endpoints well-designed with side effects documented (cron register/unregister)
- 3-phase plan correctly ordered (core→overlap+multi-project→unified triggers)
- 7 cross-references accurate, 5 design decisions well-reasoned
- **Verdict: approved.**

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
