# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-27, Sprint 29, Sprint 30 fully archived. Sprint 28 implementation archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

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
- [x] **S28.DOC.1** — Documented schedule CRUD (5 endpoints), templates (5 endpoints + built-in list), notification webhook channel (3 event types + flow). *(completed 2026-04-02 15:16 PDT)*
- [blocked: Chrome DevTools MCP disconnected — cannot take screenshots] **S28.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans against current build. Compare against Sprint 27 baseline (44 suites, 0 regressions). File bugs as `FX.REG.*`.

---

> **Remaining Tier 3 backlog defined in `docs/roadmap.md`:** Rollback Enhancements, Error Recovery P2, Analytics P2, Custom Workflows P2, Agent Collaboration P2, Frontend/Backend Swappability.

---

## Sprint 31: Agent Chat P2 — Rich Messages

> Enhance chat message rendering with specialized components for tool outputs. Replaces generic tool call cards with rich inline diffs, terminal blocks, file trees, and enhanced thinking blocks.
> Proposal: `docs/proposals/agent-chat/rich-messages.md`

### Phase 1: Utilities

- [x] **RICH.1** — Frontend: Create ANSI color parser utility at `packages/frontend/src/lib/ansi-parser.ts`. Regex-based parser converting ANSI escape sequences (bold, red/green/yellow/blue/cyan/magenta/white, reset) into React spans with Tailwind classes. Export `parseAnsi(text: string): ReactNode`. No external dependencies. *(completed 2026-04-02 15:25 PDT)*
- [x] **RICH.2** — Frontend: Create diff parser utility at `packages/frontend/src/lib/diff-parser.ts`. Takes `oldString` and `newString`, produces an array of diff lines `{ type: "add"|"remove"|"context", content: string, lineNumber: number }`. Handle: new file (all adds), deletion (all removes), mixed changes. No external dependencies — simple line-by-line comparison. *(completed 2026-04-02 15:22 PDT)*

### Phase 2: Core Components (P0)

- [x] **RICH.3** — Frontend: Enhanced ThinkingBlock component. *(completed 2026-04-02 15:23 PDT)* Create `packages/frontend/src/features/chat/thinking-block.tsx`. Purple/gray left border accent, expand/collapse toggle with ChevronDown icon, muted text color (`text-muted-foreground/70`), markdown rendering via existing PicoMarkdown. Truncate at 2000 chars with "Show more" link. Multiple thinking blocks get a "Show all thinking" toggle. Props: `{ text: string; defaultExpanded?: boolean }`.
- [x] **RICH.4** — Frontend: Enhanced ToolCallCard component. *(completed 2026-04-02 15:23 PDT)* Create `packages/frontend/src/features/chat/tool-call-card.tsx`. Header: tool icon + tool name + rich description + status badge (running/success/error) + duration. Collapsible input section (key-value pairs). Output dispatches by toolName to specialized renderers. Expand/collapse defaults: Edit/Write/Bash expanded, Read/Grep/Glob collapsed. Props: `{ block: ToolUseContentBlock }`.

### Phase 3: Specialized Output Renderers (P1)

- [ ] **RICH.5** — Frontend: TerminalBlock component at `features/chat/terminal-block.tsx`. Dark background (`bg-zinc-900`), monospace font, command header `$ {command}`, ANSI-colored output via `parseAnsi()`, max-height 300px with scroll, copy button (strips ANSI), exit code display in red if non-zero. Truncate >500 lines with "Show all N lines" expand. Props: `{ command: string; output: string; exitCode?: number }`.
- [ ] **RICH.6** — Frontend: DiffBlock component at `features/chat/diff-block.tsx`. File path header with file icon, diff body with red/green line highlighting and line numbers, monospace font. Handle: Edit (old_string→new_string diff), Write (all-green new file), minimal before/after when no line context. Copy button copies raw diff. Props: `{ filePath: string; oldString?: string; newString: string; isNewFile?: boolean }`.
- [ ] **RICH.7** — Frontend: FileTreeSummary component at `features/chat/file-tree-summary.tsx`. Aggregates Edit/Write tool calls in a message. Shows tree: directories as folders, files with ✏️ modified (amber) or ➕ added (green) indicators, line counts `(+N, -M)`. Only shows when 2+ files changed. Collapsed by default if >10 files. Clicking a file scrolls to its tool call card. Props: `{ toolCalls: ToolUseContentBlock[] }`.

### Phase 4: Integration

- [ ] **RICH.8** — Frontend: Update ContentBlockRenderer in `features/pico/chat-message.tsx` to dispatch to new components. ThinkingBlock replaces inline thinking. ToolCallCard replaces existing tool_use rendering. Add FileTreeSummary at top of message when 2+ Edit/Write calls. Keep existing PicoMarkdown for text blocks. Both Pico panel and full-page chat must use the new renderers.
- [ ] **RICH.9** — Frontend: Expand/collapse state management. Track which tool cards are expanded/collapsed per session using a `Map<string, boolean>` in component state. Default expand rules: Edit/Write/Bash expanded, Read/Grep/Glob collapsed. "Collapse all tools" / "Expand all tools" toggle at message level.

### Testing & Documentation

- [ ] **RICH.TEST.1** — Write e2e test plan: `tests/e2e/plans/rich-messages.md`. Cover: ThinkingBlock expand/collapse/truncation, ToolCallCard per tool type (Edit→diff, Bash→terminal, Grep→generic), TerminalBlock ANSI colors/scroll/copy, DiffBlock line highlighting, FileTreeSummary for multi-file changes, expand/collapse defaults.
- [ ] **RICH.DOC.1** — Update `docs/frontend.md` with rich message component hierarchy, rendering dispatch logic, and new component descriptions.
- [ ] **RICH.TEST.2** — Execute rich messages e2e tests. Screenshot each case. File bugs as `FX.RICH.*`.
- [ ] **RICH.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans. File bugs as `FX.REG.*`.
