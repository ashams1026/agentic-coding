# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-01 07:35 PDT — SDK.SB.3: Permission callback for sensitive operations

**Done:** Added `buildCanUseTool()` factory that creates a `canUseTool` callback. Checks Bash commands against 9 destructive patterns (rm -rf, git push --force, git reset --hard, DROP TABLE, etc.) — returns `{ behavior: "deny" }` with reason. Checks WebFetch URLs against project's allowed domains list (hostname match with subdomain support). All deny decisions logged to audit trail. Wired into `query()` options as defense-in-depth on top of SDK sandbox and PreToolUse hook.
**Files:** `packages/backend/src/agent/claude-executor.ts`

---

## 2026-04-01 07:20 PDT — Review: SDK.SB.2 (approved)

**Reviewed:** Sandbox config in shared types, executor, and settings UI.
- `SandboxConfig` + `ProjectSettings` types replace `Record<string, unknown>` — backward compatible with index signature
- Executor reads sandbox config with `??` fallback defaults — clean
- Security section: enable checkbox, editable domain/path badge lists with add/remove, Enter key support
- Settings spread on save preserves existing project settings
- Defaults match SDK.SB.1 values
- Build passes
- **Verdict: approved.** 10 [x] tasks — CLEANUP next.

---

## 2026-04-01 07:15 PDT — SDK.SB.2: Sandbox configuration in project settings

**Done:** Added `SandboxConfig` and `ProjectSettings` types to shared entities (replaces `Record<string, unknown>`). Executor reads sandbox config from `project.settings.sandbox` with fallback defaults. Created `SecuritySection` component: enable/disable checkbox, editable allowed domains list (badge + add/remove), editable deny write paths list. Wired into settings layout as new "Security" section with Shield icon. Project path always allowed for writes.
**Files:** `packages/shared/src/entities.ts`, `packages/backend/src/agent/claude-executor.ts`, `packages/frontend/src/features/settings/security-section.tsx` (new), `packages/frontend/src/features/settings/settings-layout.tsx`

---

## 2026-04-01 07:00 PDT — Review: SDK.SB.1 (approved)

**Reviewed:** SDK native sandbox in `claude-executor.ts`.
- `sandbox.enabled: true` with `autoAllowBashIfSandboxed` — correct for non-interactive execution
- Filesystem: allowWrite=[projectPath], denyWrite=[/, /etc, /usr, /var] — comprehensive
- Network: 4 allowed domains (Anthropic API, npm, GitHub) — reasonable defaults
- PreToolUse hook preserved as defense-in-depth — good layering
- Project-specific config deferred to SDK.SB.2 (correct scoping)
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 06:55 PDT — SDK.SB.1: Migrate to SDK native sandbox

**Done:** Added SDK `sandbox` option to `query()`: `enabled: true`, `autoAllowBashIfSandboxed: true`, filesystem allows writes only to project path (denies /, /etc, /usr, /var), network allows api.anthropic.com, npmjs, github. Kept the existing `PreToolUse` hook as a defense-in-depth fallback (application-level validation on top of OS-level sandbox). `sandbox.ts` module preserved for non-sandboxed environments.
**Files:** `packages/backend/src/agent/claude-executor.ts`

---

## 2026-04-01 06:45 PDT — Review: SDK.ST.8 (approved)

**Reviewed:** Streaming & observability documentation in `docs/frontend.md`.
- All 5 task requirements covered: partial messages, progress summaries, rate limit, context usage, WS events
- WS event table cleanly documents 5 event types with sources and purposes
- Technical details accurate to implementation (rAF batching, 500ms cursor, 60s polling, color thresholds)
- Placed logically after Detail Panel section
- **Verdict: approved.** Completes Part 1 (Real-Time Streaming) of Sprint 20.

---

## 2026-04-01 06:40 PDT — SDK.ST.8: Update frontend docs with streaming features

**Done:** Added "Agent Monitor — Streaming & Observability" section to `docs/frontend.md`. Documents: live token streaming (rAF batching, cursor), progress summary bar, rate limit display, context usage bar, and WebSocket event types table (5 events). All 5 task requirements covered.
**Files:** `docs/frontend.md`

---

## 2026-04-01 06:30 PDT — Review: SDK.ST.7 (approved)

**Reviewed:** Streaming & observability e2e test results at `tests/e2e/results/agent-monitor-streaming.md`.
- 2/14 PASS, 0 FAIL, 12 SKIP — justified: all streaming features need live agent, empty DB
- Live tab and History tab absence tests pass
- Re-testing notes with component cross-references (ST.1-ST.5)
- **Verdict: approved.**

---

## 2026-04-01 06:25 PDT — SDK.ST.7: Run streaming & observability e2e test

**Done:** Executed SDK.ST.6 test plan. 2/14 PASS, 0 FAIL, 12 SKIP. No active agents — all streaming features require live WS events. Verified: Live tab loads correctly, History tab has no context bar (correct absence). 2 screenshots. Re-testing notes reference all 5 component implementations (ST.1-ST.5).
**Files:** `tests/e2e/results/agent-monitor-streaming.md`, `tests/e2e/results/ams-01-live-empty.png`, `tests/e2e/results/ams-02-history-empty.png`

---

## 2026-04-01 06:15 PDT — Review: SDK.ST.6 (approved)

**Reviewed:** E2E test plan at `tests/e2e/plans/agent-monitor-streaming.md`.
- 14 steps across 5 parts covering all streaming/observability features
- Real-time dependency honestly documented with SKIP guidance
- Rate limit steps pragmatically marked SKIP (can't trigger in test)
- Step 12 tests absence of context bar for completed executions
- Failure criteria specific to each feature
- **Verdict: approved.**

---

## 2026-04-01 06:10 PDT — SDK.ST.6: E2E test plan for streaming & observability

**Done:** Created `tests/e2e/plans/agent-monitor-streaming.md` — 14 steps across 5 parts: live token streaming (4), progress summary bar (3), rate limit banner (2), context usage bar (3), visual quality (2). Notes real-time dependency for most steps. Rate limit steps marked SKIP by default (can't reliably trigger).
**Files:** `tests/e2e/plans/agent-monitor-streaming.md`

---

## 2026-04-01 06:00 PDT — Review: SDK.ST.5 (approved)

**Reviewed:** Context usage display across executor, shared types, frontend.
- 60s interval calls `getContextUsage()` on query object with error catch (handles ended queries)
- `context_usage` WS event with percentage, tokens, categories
- Fill bar: 16px rounded, color-coded (green/amber/red), percentage label, token tooltip
- Inner try/finally ensures interval cleanup even on error
- All shared types updated (event type, interface, union, map, ws-client)
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 05:55 PDT — SDK.ST.5: Context usage display in agent monitor

**Done:** Periodic `getContextUsage()` polling every 60s during active executions via `setInterval` on the query object. Broadcasts `context_usage` WS event with percentage, totalTokens, maxTokens, categories. Frontend: context usage bar in terminal toolbar — 16px fill bar with color coding (green <60%, amber 60-80%, red >80%), percentage label, token count tooltip. New `ContextUsageEvent` in shared ws-events. Interval cleaned up in `finally` block.
**Files:** `packages/backend/src/agent/claude-executor.ts`, `packages/shared/src/ws-events.ts`, `packages/frontend/src/api/ws-client.ts`, `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`

---

## 2026-04-01 05:40 PDT — Review: SDK.ST.4 (approved)

**Reviewed:** Rate limit event handling in executor, types, execution manager.
- Handles `SDKAPIRetryMessage` (api_retry subtype) — correct extraction of attempt, retry_delay_ms, max_retries
- `RateLimitEvent` added to AgentEvent union with all fields
- Inline text banner with retry countdown — pragmatic approach (vs live countdown timer which would add complexity for a rare event)
- Not logged to execution logs, broadcast as agent_output_chunk
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 05:35 PDT — SDK.ST.4: Handle rate limit events in agent monitor

**Done:** Handles `SDKAPIRetryMessage` (type: "system", subtype: "api_retry") in `mapMessage()` — emits `RateLimitEvent` with retryDelayMs, attempt, maxRetries, errorStatus. In execution manager: broadcasts as `agent_output_chunk` with formatted text "Rate limited — retrying in Xs (attempt N/M)". Not logged to execution logs. Added `RateLimitEvent` to `AgentEvent` union.
**Files:** `packages/backend/src/agent/types.ts`, `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/agent/execution-manager.ts`

---

## 2026-04-01 05:25 PDT — Review: SDK.ST.3 (approved)

**Reviewed:** Agent progress summaries across 6 files.
- `agentProgressSummaries: true` enables SDK task progress messages
- `SDKTaskProgressMessage` handling: extracts description, summary, usage stats
- Dedicated `agent_progress` WS event (not mixed with output chunks) — clean separation
- Progress bar: emerald with pulsing dot, truncated text, dark mode support
- Clears on execution completion, not logged to execution logs
- All shared types updated (event type, interface, union, map, ws-client)
- **Verdict: approved.**

---

## 2026-04-01 05:20 PDT — SDK.ST.3: Agent progress summaries

**Done:** Added `agentProgressSummaries: true` to `query()` options. Handles `SDKTaskProgressMessage` (type: "system", subtype: "task_progress") in `mapMessage()` — emits `ProgressEvent` with description, summary, usage stats. New `agent_progress` WS event type for dedicated progress broadcasting. Frontend: `progressSummary` state in terminal renderer, subscribes to `agent_progress` events, shows emerald progress bar below toolbar with pulsing dot and truncated summary text. Clears on execution completion.
**Files:** `packages/backend/src/agent/types.ts`, `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/shared/src/ws-events.ts`, `packages/frontend/src/api/ws-client.ts`, `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`

---

## 2026-04-01 05:05 PDT — Review: SDK.ST.2 (approved)

**Reviewed:** Live token streaming UI in `terminal-renderer.tsx`.
- rAF batching: tokens accumulate in ref, flush once per frame — no excessive re-renders
- Streaming chunks append to last `stream-*` chunk or create new — smooth typing effect
- `<50 chars` heuristic cleanly separates partial tokens from complete text chunks
- Non-partial chunks flush buffer first — correct ordering
- Blinking emerald cursor via `isStreaming` state with 500ms timeout
- Cleanup cancels rAF + timeout on unmount
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 05:00 PDT — SDK.ST.2: Live token streaming UI in agent monitor

**Done:** Updated terminal renderer to batch partial streaming tokens using `requestAnimationFrame`. Small text chunks (<50 chars) accumulate in `streamBuffer` ref, flushed via rAF into the last streaming chunk (appended, not new bubble). Non-partial chunks flush the buffer first. Added `isStreaming` state with 500ms timeout — shows emerald blinking cursor (`animate-pulse`) at the bottom of output while streaming. Cleanup on unmount cancels rAF + timeout.
**Files:** `packages/frontend/src/features/agent-monitor/terminal-renderer.tsx`

---

## 2026-04-01 04:45 PDT — Review: SDK.ST.1 (approved)

**Reviewed:** Partial message streaming in executor, types, and execution manager.
- `includePartialMessages: true` in query options — enables SDK partial events
- `stream_event` handling extracts `content_block_delta` → `text_delta` content correctly
- Partial events broadcast via WS as `agent_output_chunk` but NOT logged to execution `logs` — correct separation
- `PartialEvent` added to `AgentEvent` union with content + index fields
- Double-cast via `unknown` for `BetaRawContentBlockDelta` — acceptable for runtime duck-typing
- Build passes
- **Verdict: approved.**

---

## 2026-04-01 04:40 PDT — SDK.ST.1: Enable partial message streaming

**Done:** Added `includePartialMessages: true` to `query()` options. Handles `stream_event` type in `mapMessage()`: extracts `content_block_delta` events with `text_delta` type, emits as `PartialEvent { type: "partial", content, index }`. In execution manager: partial events are broadcast via WS as `agent_output_chunk` (chunkType: "text") but NOT logged to execution `logs` field (too granular). Added `PartialEvent` to `AgentEvent` union type.
**Files:** `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/agent/types.ts`, `packages/backend/src/agent/execution-manager.ts`

---
