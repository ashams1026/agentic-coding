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

- [x] **RB.1** — Frontend: Add time-elapsed indicator to rewind confirmation dialog in `features/agent-monitor/agent-history.tsx`. Show "This execution ran X minutes/hours/days ago" in the AlertDialog body, computed from `execution.completedAt`. Use relative time formatting (e.g., "2 hours ago", "3 days ago"). Helps users gauge risk of rewinding old executions. *(completed 2026-04-02 16:10 PDT)*
- [x] **RB.2** — Backend: Add file conflict detection to `POST /api/executions/:id/rewind` dry-run response. For each file in `filesChanged`, compare file mtime against `execution.completedAt`. Return a `conflicts` array: `{ filePath: string, modifiedAt: string, modifiedBy?: string }[]`. Query recent executions that also modified overlapping files for the `modifiedBy` field. Add `ConflictInfo` type to shared package. *(completed 2026-04-02 16:10 PDT)*
- [ ] **RB.3** — Frontend: Show conflict warning banner in rewind confirmation dialog. When `conflicts` array is non-empty, render a yellow warning box listing conflicted files with when/by whom they were modified. "Reverting will overwrite these changes." Mark conflicted files with a warning icon in the file list. Keep "Rewind Files" button enabled (warning only, never block).

### Phase 2: Multi-Surface Rollback

- [ ] **RB.4** — Frontend: Extract `RewindButton` + rewind dialog into a shared component at `features/common/rewind-button.tsx`. Currently embedded in `agent-history.tsx` (lines 272-392). Extract with clean props: `{ execution: Execution }`. Import back into agent-history.tsx. This enables reuse in execution-timeline and other surfaces.
- [ ] **RB.5** — Frontend: Add "Revert Changes" button to execution timeline entries in `features/common/execution-timeline.tsx`. For completed executions with a `checkpointMessageId`, show the shared RewindButton component. Position as an action button in the execution row alongside existing retry button.
- [ ] **RB.6** — Frontend: Add rewind action to Agent Monitor split-view execution detail. When viewing an expanded execution in `features/agent-monitor/agent-monitor-layout.tsx` or its sub-components, add a "Revert Changes" button in the execution header/toolbar area. Uses the shared RewindButton.

### Phase 3: Git Integration

- [ ] **RB.7** — Backend: Add optional git commit creation after successful rewind. Extend `POST /api/executions/:id/rewind` to accept `{ dryRun?: boolean, createCommit?: boolean }`. When `createCommit` is true and rewind succeeds: run `git add` for all `filesChanged`, then `git commit -m "revert: undo execution {id} ({agentName})"`. Return `{ ...existingResult, commitSha?: string }`. Detect if project is a git repo first (`git rev-parse --is-inside-work-tree`). Add `commitSha` to `RewindResult` type in shared.
- [ ] **RB.8** — Frontend: Add "Create revert commit" checkbox to rewind confirmation dialog. Checked by default. When checked, pass `createCommit: true` to the rewind API. After success, show commit SHA in the success toast. Hide checkbox if project is not a git repo (detect from execution metadata or a new endpoint). Update RewindButton component and the shared `rewindExecution()` API function.

### Phase 4: Enhanced Preview

- [ ] **RB.9** — Backend: Add per-file diff data to dry-run rewind response. Before calling `rewindFiles(dryRun: true)`, read current content of each tracked file. After dry-run, read the "would-be-reverted" content (since dry-run doesn't change files, compute expected diffs by comparing current content against the checkpoint). Return `fileDiffs: { filePath: string, additions: number, deletions: number, hunks: string }[]` in the response. If git is available, use `git diff` on the files for accurate hunks.
- [ ] **RB.10** — Frontend: Show per-file expandable diffs in rewind confirmation dialog. Replace the flat file list with collapsible rows: file path + `+N/-M` summary, clicking expands to show the diff hunk. Use the existing `DiffBlock` component from `features/chat/diff-block.tsx` or a simplified version. Scroll area with max-height for large file lists.

### Testing & Documentation

- [x] **RB.TEST.1** — Write e2e test plan: `tests/e2e/plans/rollback-enhancements.md`. Cover: time elapsed indicator, conflict warning with post-execution modified files, rewind from execution timeline, rewind from agent monitor detail, git commit creation toggle + SHA display, per-file diff preview, expand/collapse diffs. *(completed 2026-04-02 16:10 PDT)*
- [ ] **RB.DOC.1** — Update `docs/api.md` with enhanced rewind endpoint (conflict detection fields, createCommit option, fileDiffs response), update `docs/frontend.md` with shared RewindButton component.
- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **RB.TEST.2** — Execute rollback enhancement e2e tests. Screenshot each case. File bugs as `FX.RB.*`.
- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **RB.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans. File bugs as `FX.REG.*`.
