# Rollback UX & Implementation Design

> Research document for **RES.ROLLBACK**. Design only — no implementation tasks.

---

## 1. Current State Audit

### What Exists Today

The SDK provides two core primitives for file rollback:

1. **`enableFileCheckpointing: true`** (query option) — creates backups of files before they are modified during a session. Enabled in `claude-executor.ts:564` for every agent execution.

2. **`query.rewindFiles(userMessageId, { dryRun? })`** — reverts tracked files to their state at a specific user message. Returns `RewindFilesResult`:
   ```typescript
   {
     canRewind: boolean;
     error?: string;
     filesChanged?: string[];
     insertions?: number;
     deletions?: number;
   }
   ```

### How It's Wired In AgentOps

| Component | Location | What It Does |
|-----------|----------|-------------|
| Checkpoint capture | `claude-executor.ts:655-661` | Captures the first `assistant` message's `id` as the checkpoint messageId |
| Checkpoint storage | `execution-manager.ts:431,445,525` | Stores `checkpointMessageId` on the execution record |
| DB column | `schema.ts:156` | `checkpoint_message_id TEXT` on `executions` table |
| Rewind API | `executions.ts:167-322` | `POST /api/executions/:id/rewind` with dry-run support |
| Frontend API | `client.ts:280-283` | `rewindExecution(id, dryRun)` wrapper |
| Rewind button | `agent-history.tsx:275-395` | `RewindButton` component in execution history rows |
| MCP tool | `mcp-server.ts:628-671` | `rewind_execution` tool for Code Reviewer persona |

### Current Limitations

1. **Single checkpoint per execution** — only the first assistant message ID is captured (`checkpointEmitted` flag at executor.ts:655). This means rewind always goes back to the beginning of the execution. No intermediate checkpoints are available.

2. **All-or-nothing rewind** — `rewindFiles()` reverts ALL tracked files to the checkpoint state. No per-file selection.

3. **No conflict detection** — if files were modified after the execution (by another agent or manually), `rewindFiles()` will silently overwrite those changes.

4. **Rewind button only in Agent Monitor history** — not available from work item detail, execution detail panel, or activity feed.

5. **Disabled tooltip bug** — Radix `TooltipTrigger asChild` on a disabled button doesn't trigger the tooltip (BUG-1 from e2e tests, `tests/e2e/results/2026-03-31_21-43_file-checkpointing/file-checkpointing.md:47`).

6. **No git integration** — rewind modifies the working tree but doesn't create a revert commit.

7. **No undo-undo** — after rewinding, there's no way to "re-apply" the agent's changes.

---

## 2. Rollback Scope

### What the SDK Supports

The SDK's `rewindFiles(userMessageId)` operates at the **user message** level. The `userMessageId` is a UUID that identifies a specific point in the conversation. When called:
- Files are restored to their exact state as of that message
- The operation is atomic — either all files rewind or none do (canRewind: false)
- Dry-run mode previews without modifying files

### Scope Options

| Scope | SDK Support | Complexity | User Value |
|-------|------------|------------|------------|
| **Per-execution** (undo everything this run did) | Yes — current implementation | Low (already built) | High — most common need |
| **Per-message** (rewind to any assistant turn) | Partial — SDK accepts any userMessageId | Medium | Medium — useful for multi-turn executions |
| **Per-tool-call** (undo a specific file write) | No — SDK doesn't expose per-tool checkpoints | High (custom implementation) | Low — too granular for most users |

### Recommendation: Per-Execution as Primary, Per-Message as Phase 2

**Phase 1:** Keep per-execution rollback as the primary UX. This is what users expect — "undo what this agent run did." The current single-checkpoint approach is sufficient.

**Phase 2:** Expose intermediate checkpoints for multi-turn executions. This requires:
- Capturing ALL assistant message IDs during execution (not just the first)
- Storing them as a JSON array on the execution record (or a separate `execution_checkpoints` table)
- UI showing a timeline of agent turns with "rewind to here" action

**Not recommended:** Per-tool-call rollback. The SDK doesn't support this, and the complexity of tracking individual file writes outweighs the benefit. Users who need this level of control can use git.

---

## 3. UX — Where Rollback Lives

### Current: Agent Monitor Execution History

The rewind button sits in the execution history row (`agent-history.tsx`). This works for users actively monitoring agent runs but is not discoverable from other entry points.

### Proposed: Multi-Surface Rollback

| Surface | Location | Priority | Notes |
|---------|----------|----------|-------|
| **Agent Monitor — History** | Execution row action button | P0 (exists) | Current implementation. Keep as-is. |
| **Execution Detail Panel** | Header actions or "Files Changed" section | P1 | When expanding an execution, show a prominent "Revert Changes" button alongside the file diff summary |
| **Work Item Detail** | Execution timeline section | P2 | Each execution entry in the work item timeline could have a rewind icon — useful when reviewing a work item's history |
| **Activity Feed** | Execution completion events | P3 | Low priority — activity feed is read-only by design; adding actions creates UX complexity |

### Proposed Execution Detail Rollback UI

When the user expands an execution or views its detail panel:

```
┌─────────────────────────────────────────────────────┐
│ Execution: ex-a8k2f  ·  Engineer  ·  Completed      │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │  Files Changed (7)              [Revert Changes] │ │
│ │                                                  │ │
│ │  M  src/components/sidebar.tsx       +12  -3     │ │
│ │  M  src/features/dashboard/index.tsx +45  -8     │ │
│ │  A  src/features/dashboard/widget.tsx +78        │ │
│ │  M  src/api/client.ts                +5   -2     │ │
│ │  ...                                             │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ [View Full Output]  [View Audit Trail]               │
└─────────────────────────────────────────────────────┘
```

The "Revert Changes" button triggers the same dry-run → confirm flow that already exists in the RewindButton component.

### Confirmation Dialog Enhancements

The current confirmation dialog shows file paths and line counts. Enhance with:

1. **Diff preview per file** — expandable sections showing the actual content diff (before → after rewind). The `dryRun: true` response already includes `filesChanged`, but doesn't include diffs. This would require a separate endpoint or extending the API to include per-file diffs (see section 6 for SDK limitations).

2. **Warning for post-execution modifications** — if any of the files were modified after the execution completed (detected via mtime or git status), show a warning banner:
   ```
   ⚠ 2 files have been modified since this execution:
     src/api/client.ts — modified by execution ex-b9k3g (12 min ago)
     src/features/dashboard/index.tsx — modified manually (3 min ago)
   Reverting will overwrite these changes.
   ```

3. **Time elapsed indicator** — show how long ago the execution ran. Rewinding a 5-minute-old execution is very different from rewinding a 3-day-old one.

---

## 4. Partial Rollback — Cherry-Pick File Selection

### The Need

Sometimes an agent makes changes across multiple files, and only some are wrong. The user wants to keep `sidebar.tsx` but revert `dashboard/index.tsx`.

### SDK Limitation

`rewindFiles()` is all-or-nothing. It rewinds ALL tracked files to the checkpoint state. There is no per-file selection API in the SDK (v0.2.87).

### Custom Implementation Options

| Approach | Complexity | Reliability |
|----------|-----------|-------------|
| **A. Git-based selective revert** | Medium | High |
| **B. File snapshot comparison** | High | Medium |
| **C. SDK feature request** | Low (wait) | N/A |

#### Approach A: Git-Based Selective Revert (Recommended)

If the project uses git (and AgentOps projects are expected to be git repos):

1. After dry-run, show the file list with checkboxes (all selected by default)
2. User deselects files they want to keep
3. For the selected files only:
   - Run `git diff HEAD -- <file>` to capture current state
   - Perform full `rewindFiles()` (reverts everything)
   - For deselected files, restore their pre-rewind content from the captured diff

**Problem:** This creates a race condition — between the full rewind and the selective restore, files are in an inconsistent state. Also, if the project has uncommitted changes, `git diff` may not capture the right baseline.

#### Alternative: Pre-Rewind Snapshot

1. Before calling `rewindFiles()`:
   - Read the current content of all files in the `filesChanged` list
   - Store in memory as `Map<filePath, fileContent>`
2. Perform full `rewindFiles()`
3. For files the user wanted to KEEP (not revert):
   - Write back their pre-rewind content from the snapshot

This is simpler and doesn't depend on git, but requires reading potentially many files into memory.

#### Recommendation

**Phase 1:** No partial rollback. The current all-or-nothing rewind with a file list preview is sufficient. Users who need partial rollback can use git (`git checkout HEAD -- path/to/file`).

**Phase 2:** Implement the pre-rewind snapshot approach above. The UI shows checkboxes next to each file in the confirmation dialog. Unchecked files are restored after the full rewind.

**Phase 3:** If the SDK adds per-file rewind support, switch to the native API.

---

## 5. Safety — Conflict Detection

### The Problem

After an agent runs, other agents or the user may modify the same files. Rewinding blindly would overwrite those changes.

### Detection Strategies

| Strategy | What It Detects | Implementation |
|----------|----------------|----------------|
| **Git status** | Uncommitted changes | `git status --porcelain -- <file>` |
| **Mtime comparison** | Any file modification | Compare file mtime to execution's `completedAt` timestamp |
| **Content hash** | Any content change | Hash file content at execution time, compare at rewind time |
| **Execution history** | Changes by other agents | Query executions completed after this one that modified the same files (via `execution_events` or audit trail) |

### Recommended: Mtime + Execution History (Two-Tier)

**Tier 1 — Mtime check (cheap, fast):**
Before presenting the rewind confirmation, check each file's mtime against the execution's `completedAt`. If any file was modified after the execution:
- Show a warning banner in the confirmation dialog
- List affected files with when they were last modified
- Still allow rewind (user's choice), but make the risk clear

**Tier 2 — Execution history cross-reference (richer context):**
Query the `execution_events` or `audit_trail` table for subsequent executions that touched the same files:
- "src/api/client.ts was also modified by execution ex-b9k3g (Engineer, 12 minutes ago)"
- This tells the user *who* changed it, not just *that* it changed

### UX for Conflicts

```
┌────────────────────────────────────────────────────────────┐
│ Rewind file changes?                                       │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ⚠ Warning: Files modified since this execution        │ │
│ │                                                        │ │
│ │ src/api/client.ts                                      │ │
│ │   Modified by: execution ex-b9k3g (Engineer) — 12m ago │ │
│ │                                                        │ │
│ │ src/features/dashboard/index.tsx                        │ │
│ │   Modified manually — 3m ago                           │ │
│ │                                                        │ │
│ │ Reverting will overwrite these changes.                 │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ 7 files will be reverted (+145/-38 lines)                  │
│   src/components/sidebar.tsx                               │
│   src/features/dashboard/index.tsx  ⚠                      │
│   src/features/dashboard/widget.tsx                        │
│   src/api/client.ts  ⚠                                     │
│   ...                                                      │
│                                                            │
│               [Cancel]  [Revert Anyway]                    │
└────────────────────────────────────────────────────────────┘
```

### Blocking vs Warning

**Recommendation: Warning only, never block.** The user may intentionally want to overwrite post-execution changes (e.g., another agent made things worse). Blocking would be frustrating. But the warning must be prominent and specific enough that accidental overwrites are rare.

Exception: if the execution is currently running (status = "running"), block the rewind entirely. This is already implemented (`executions.ts:196-203`).

---

## 6. Git Integration

### Current State

Rewinding via `rewindFiles()` modifies the working tree directly. It does NOT create any git commits. The user is left with uncommitted file changes.

### Options

| Option | Behavior | Pros | Cons |
|--------|----------|------|------|
| **A. Working tree only** (current) | Rewind modifies files, no commit | Simple, user has full control | Easy to lose track of what was reverted; no audit trail in git |
| **B. Auto-commit revert** | Create a `git revert`-style commit after rewind | Clean git history, auditable | Automated commits may surprise users; commit message format |
| **C. Staged changes** | Stage the reverted files but don't commit | User can review diff before committing | Extra step, user might forget |
| **D. User choice** | Toggle in rewind dialog: "Create revert commit" | Maximum flexibility | UI complexity |

### Recommendation: Option D — User Choice with Default

Add a checkbox to the rewind confirmation dialog:

```
☑ Create a git commit for this revert
  Commit message: "revert: undo execution ex-a8k2f (Engineer)"
```

- **Checked by default** for projects with git initialized
- **Hidden** for projects without git
- Commit message is auto-generated but editable
- The commit includes all reverted files

Implementation:
1. After successful `rewindFiles()`, if the checkbox is checked:
2. Run `git add <file1> <file2> ...` for all `filesChanged`
3. Run `git commit -m "revert: undo execution {executionId} ({personaName})\n\nReverted {N} files to pre-execution state."`
4. Return the commit SHA in the API response

### Interaction with Agent Commits

Agents typically commit their work at the end of an execution. After rewind:
- The agent's commit still exists in git history
- The revert commit creates a clean undo
- `git log` shows the full story: agent did work → user reverted

This is cleaner than `git revert <sha>` because the agent may have made multiple commits, or the user may want a partial revert (Phase 2).

---

## 7. SDK Limitations & Custom Implementation Needs

### What the SDK Provides

| Feature | SDK Support | Notes |
|---------|------------|-------|
| Full execution rewind | Yes | `rewindFiles(messageId)` — rewinds all files |
| Dry-run preview | Yes | `{ dryRun: true }` returns file list + stats |
| File list | Yes | `filesChanged: string[]` in result |
| Line statistics | Yes | `insertions` and `deletions` counts |
| Per-file diffs | **No** | Only aggregate stats, no per-file diff content |
| Per-file selection | **No** | All-or-nothing rewind |
| Multiple checkpoints | **Partial** | Accepts any `userMessageId`, but the host must capture them |
| Conflict detection | **No** | SDK doesn't check if files were modified post-execution |
| Git integration | **No** | SDK modifies working tree only |

### What Needs Custom Implementation

1. **Conflict detection** — mtime comparison + execution history cross-reference (Section 5)
2. **Git commit creation** — `child_process` exec of git commands after rewind (Section 6)
3. **Per-file diffs in preview** — read files before dry-run, diff against post-rewind state (or use `git diff` if available)
4. **Multiple checkpoint capture** — modify `claude-executor.ts` to capture all assistant message IDs, not just the first
5. **Partial rollback** — pre-rewind snapshot + selective restore (Section 4)

### Checkpoint Retention & Storage Cost

The SDK's file checkpointing stores backups internally (in the Claude CLI's data directory, not in the project). Key considerations:

- **Retention**: Checkpoints persist until the CLI's session data is cleaned up. For long-running AgentOps instances, this could accumulate storage. The SDK does not expose a "delete checkpoint" API.
- **Storage per execution**: Proportional to the total size of modified files. A typical execution modifying 5 files of ~10KB each ≈ 50KB of checkpoint data. At 100 executions/day = ~5MB/day.
- **No expiration policy**: The SDK doesn't auto-expire checkpoints. AgentOps should document this and potentially add a Settings option to periodically clear old checkpoint data.
- **Cross-session validity**: A `checkpointMessageId` from one query session can be used in another (as the rewind API already does — it creates a temporary query session). This is a critical feature that makes the current architecture work.

---

## 8. Implementation Phases

### Phase 1: Enhance Current Rewind (Low Effort)

**Goal:** Fix bugs and improve the existing single-button rollback.

Tasks:
- Fix disabled tooltip bug (wrap disabled button in `<span>` for Radix compatibility)
- Add time-elapsed indicator to confirmation dialog ("This execution ran 2 hours ago")
- Add basic conflict detection (mtime comparison for files in `filesChanged`)
- Add conflict warning to confirmation dialog

### Phase 2: Multi-Surface Rollback + Git Integration (Medium Effort)

**Goal:** Make rollback accessible from more places and integrate with git.

Tasks:
- Add "Revert Changes" button to execution detail panel
- Add rewind action to work item execution timeline
- Implement git commit creation after rewind (with user toggle)
- Add per-file diff preview in confirmation dialog (via `git diff` or file content comparison)
- Enhance API response to include per-file diff data

### Phase 3: Partial Rollback + Multiple Checkpoints (Higher Effort)

**Goal:** Give users fine-grained control over what to revert.

Tasks:
- Capture all assistant message IDs during execution (not just the first)
- Store checkpoint timeline on execution record
- Build checkpoint timeline UI in execution detail
- Implement per-file selection in rewind dialog (checkbox per file)
- Implement pre-rewind snapshot + selective restore logic

---

## 9. Cross-References

| Document | Relationship |
|----------|-------------|
| `docs/proposals/agent-collaboration/context-sharing.md` | Handoff notes should survive rollback — if files are reverted, the decisions documented in handoff notes remain valid context |
| `docs/proposals/agent-collaboration/coordination.md` | Conflict detection for rollback parallels the concurrent write safety concerns in multi-agent coordination |
| `docs/proposals/error-recovery/agent-recovery.md` (future) | Partial results handling — auto-rollback on agent failure is a related feature |
| `docs/proposals/scheduling/infrastructure.md` | Scheduled execution failures may need auto-rollback; ties into the catch-up policy |
| `tests/e2e/plans/file-checkpointing.md` | Existing e2e test plan for the current rewind UX |
| `tests/e2e/results/2026-03-31_21-43_file-checkpointing/file-checkpointing.md` | Test results showing BUG-1 (disabled tooltip) and 10 skipped tests due to no checkpointed executions in seed data |

---

## 10. Design Decisions

1. **Per-execution rollback is sufficient for Phase 1.** The SDK's single-checkpoint model maps cleanly to "undo this entire agent run." Multi-turn checkpoints add complexity with limited user demand — defer to Phase 3.

2. **Warning-only for conflicts, never block.** Users may intentionally want to overwrite post-execution changes. Make the risk visible but don't prevent the action.

3. **Git commit creation should be opt-in (default on).** Users expect rewind to create an auditable undo in git. But some may prefer working tree changes only (e.g., during experimentation). Default to creating a commit but allow opting out.

4. **No per-file rewind without full-rewind-then-restore.** The SDK doesn't support per-file selection. The snapshot-and-restore approach is the only viable path, and it's reliable enough for Phase 3.

5. **Checkpoint storage is not a near-term concern.** At ~5MB/day for 100 executions, storage grows slowly. Add a cleanup tool in Settings (Phase 2+) but don't build retention policies for Phase 1.
