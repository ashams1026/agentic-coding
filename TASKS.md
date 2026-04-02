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
