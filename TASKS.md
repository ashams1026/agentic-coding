# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-27, Sprint 29, Sprint 30 fully archived. Sprint 28 implementation archived. Sprint 31 implementation archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 29: UX Overhaul (Priority)

> Major UX rework based on user feedback. **Prioritized ahead of remaining Sprint 28 and future roadmap work.** Themes: global-as-project foundation, persona→agent rename, chat UX fixes, workflow rework with label triggers, scope clarity.
> Bug Fixes (Sprints 24-27), Phases 1-6, 9 complete and archived. Phases 4, 8 partially complete.

### Remaining Sprint 29

- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **UXO.TEST.2** — Execute UX Overhaul e2e tests. Screenshot each case. Record results. File bugs as `FX.*`.
- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **UXO.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans. File bugs as `FX.REG.*`.

---

## Sprint 30: Project-Scoped Navigation (Priority)

> **Fundamental navigation rewrite.** Replace the global project dropdown with a sidebar tree where each project has its own nested pages. Eliminates scope confusion at the root. Supersedes GW.*, UXO.28-29, DES.2/15, scope badges/breadcrumbs.
>
> **Target sidebar structure:**
> ```
> ─── Woof ─────────────────
> Dashboard                  ← cross-project overview
> App Settings               ← API keys, appearance, service, data
>
> ─── Projects ─────────────
> ▼ Global Workspace    🌐
>     Work Items
>     Automations
>     Agents
>     Agent Monitor
>     Activity Feed
>     Analytics
>     Chat
>     Project Settings
>
> ▼ my-react-app        📁
>     (same pages)
>
> ▶ another-project     📁  ← collapsed
> ```

### Testing (blocked)

- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **NAV.TEST.2** — Execute project navigation e2e tests. Screenshot each case. File bugs as `FX.NAV.*`.
- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **NAV.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans. File bugs as `FX.REG.*`.

---

## Sprint 28: Scheduling, Templates & Notification Channels (Deprioritized)

> Tier 3 features: Scheduling (cron agent runs), Templates P1 (work item templates), Notification External Channels (webhook channel wrapping outbound infra).
> Proposal docs: `docs/proposals/scheduling/ux-design.md`, `docs/proposals/scheduling/infrastructure.md`, `docs/proposals/templates/design.md`, `docs/proposals/notifications/integrations.md`

### Remaining

- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **S28.TEST.2** — Execute Scheduling + Templates e2e tests. Screenshot each case. Record results. File bugs as `FX.*`.
- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **S28.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans against current build. Compare against Sprint 27 baseline (44 suites, 0 regressions). File bugs as `FX.REG.*`.

---

> **Remaining Tier 3 backlog defined in `docs/roadmap.md`:** Rollback Enhancements, Error Recovery P2, Analytics P2, Custom Workflows P2, Agent Collaboration P2, Frontend/Backend Swappability.

---

## Sprint 31: Agent Chat P2 — Rich Messages

> Enhance chat message rendering with specialized components for tool outputs. Replaces generic tool call cards with rich inline diffs, terminal blocks, file trees, and enhanced thinking blocks.
> Proposal: `docs/proposals/agent-chat/rich-messages.md`
> Phases 1-3, most of Phase 4, and testing/docs complete and archived.

### Remaining

- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **RICH.TEST.2** — Execute rich messages e2e tests. Screenshot each case. File bugs as `FX.RICH.*`.
- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **RICH.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans. File bugs as `FX.REG.*`.

---

## Sprint 32: Rollback Enhancements

> Improve the existing file rollback UX with conflict detection, multi-surface access, git integration, and richer previews. Based on `docs/proposals/rollback/design.md` Phases 1-2.
> Current state: RewindButton exists in agent-history.tsx only. Single-checkpoint per execution. No conflict detection. No git integration.

### Phase 1: Improve Current Rewind

- [x] **RB.1** — Frontend: Add time-elapsed indicator to rewind confirmation dialog. *(completed 2026-04-02 16:10 PDT)*

### Phase 2: Multi-Surface Rollback

- [x] **RB.4** — Frontend: Extract `RewindButton` + rewind dialog into a shared component at `features/common/rewind-button.tsx`. Currently embedded in `agent-history.tsx`. Extract with clean props: `{ execution: Execution }`. Import back into agent-history.tsx. This enables reuse in execution-timeline and other surfaces. *(completed 2026-04-02 16:30 PDT)*
- [x] **RB.5** — Frontend: Add "Revert Changes" button to execution timeline entries in `features/common/execution-timeline.tsx`. For completed executions with a `checkpointMessageId`, show the shared RewindButton component. *(completed 2026-04-02 16:40 PDT)*
- [x] **RB.6** — Frontend: Add rewind action to Agent Monitor split-view execution detail. Add a "Revert Changes" button in the execution header/toolbar area. Uses the shared RewindButton. *(completed 2026-04-02 16:40 PDT)*

### Testing & Documentation

- [x] **RB.TEST.1** — Write e2e test plan: `tests/e2e/plans/rollback-enhancements.md`. *(completed 2026-04-02 16:10 PDT)*
- [x] **RB.DOC.1** — Update `docs/api.md` with rewind endpoint changes, update `docs/frontend.md` with shared RewindButton component. *(completed 2026-04-02 16:40 PDT)*
- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **RB.TEST.2** — Execute rollback enhancement e2e tests. Screenshot each case. File bugs as `FX.RB.*`.
- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **RB.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans. File bugs as `FX.REG.*`.

---

## Sprint 33: Error Recovery Phase 2

> Retry policies, stuck execution watchdog, structured error classification, and improved error UX. Based on `docs/proposals/error-recovery/agent-recovery.md` Phases 1-2.
> Phase 1 (Sprint 23) built: busy_timeout, error boundaries, WS backoff, orphan recovery, structured error categories. This sprint adds application-level retry and watchdog on top.

### Phase 1: Schema + Error Classification

- [x] **ER.1** — Shared: Add `ErrorCategory` type and `ExecutionError` interface to `packages/shared/src/entities.ts`. Categories: `timeout`, `rate_limit`, `sdk_error`, `permission_denied`, `budget_exceeded`, `configuration_error`, `rejection_limit`, `loop_detected`, `interrupted`, `unknown`. Add `RetryPolicy` interface: `{ maxRetries: number, retryableErrors: ErrorCategory[], backoffMs: number, notifyOnRetry: boolean }`.
- [ ] **ER.2** — Backend: Schema migration adding `error` (TEXT/JSON) and `retryCount` (INTEGER default 0) columns to executions table. Update Drizzle schema in `packages/backend/src/db/schema.ts`. Add `error` and `retryCount` fields to the shared `Execution` entity type.
- [ ] **ER.3** — Backend: Classify errors in `ExecutionManager` catch block (`execution-manager.ts`). Parse SDK errors into `ErrorCategory`. Populate the `error` column with structured `ExecutionError` JSON on failure. Distinguish timeout vs process crash vs permission denied vs configuration error.

### Phase 2: Retry Logic

- [ ] **ER.4** — Backend: Add `retryPolicy` JSON field to agents table (schema migration). Default: `{ maxRetries: 1, retryableErrors: ["timeout", "process_crash", "transient_error"], backoffMs: 5000, notifyOnRetry: true }`. Add to shared `Agent` entity type.
- [ ] **ER.5** — Backend: Implement retry logic in `ExecutionManager.onComplete()`. After a failed execution: check error category against agent's retryPolicy, check retryCount < maxRetries, schedule retry after backoffMs delay using `setTimeout`. Increment retryCount. Link retry execution to original via `parentExecutionId`. Broadcast `execution_retry` WS event.
- [ ] **ER.6** — Backend: Enhance `recoverOrphanedState()` in `start.ts`. Distinguish `interrupted` (clean shutdown) vs `failed` (crash) based on whether the execution had recent activity. Create system notification for recovered orphans. Auto-schedule retry for interrupted executions whose agent has retry enabled.

### Phase 3: Watchdog

- [ ] **ER.7** — Backend: Implement stuck execution watchdog in `ExecutionManager`. `setInterval` (60s) checks all running executions. If no WS events for > 5 minutes (default threshold), broadcast `execution_stuck` WS event with execution ID. Add `lastActivityAt` tracking — update on every WS event broadcast. Per-agent threshold stored in retryPolicy.
- [ ] **ER.8** — Frontend: Stuck execution warning banner in Agent Monitor terminal renderer. When `execution_stuck` WS event received, show an amber banner: "No activity for X minutes. [Force stop] [Keep waiting]". Force stop calls existing execution cancel endpoint.

### Phase 4: Error UX

- [ ] **ER.9** — Frontend: Error category badge + details in execution history (`agent-history.tsx`). Parse `execution.error` JSON. Show color-coded category badge (red for terminal, amber for retryable). Expandable error details section with message, SDK error, tool name. "Retry" button for retryable errors (calls existing retry endpoint or triggers new execution).
- [ ] **ER.10** — Frontend: Retry policy configuration in agent editor (`features/agent-manager/`). Add collapsible "Error Recovery" section: max retries slider (0-3), retryable error checkboxes, backoff delay input, notify on retry toggle. Saves to agent's `retryPolicy` field.

### Testing & Documentation

- [x] **ER.TEST.1** — Write e2e test plan: `tests/e2e/plans/error-recovery-p2.md`. Cover: error category badges, retry button, stuck execution warning, retry policy configuration, orphan recovery notifications.
- [ ] **ER.DOC.1** — Update `docs/api.md` with error/retryCount fields, retry policy schema. Update `docs/architecture.md` with retry flow and watchdog. Update `docs/frontend.md` with error display components.
- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **ER.TEST.2** — Execute error recovery e2e tests. Screenshot each case. File bugs as `FX.ER.*`.
- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **ER.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans. File bugs as `FX.REG.*`.
