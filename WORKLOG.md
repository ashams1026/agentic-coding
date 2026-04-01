# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-01 22:25 PDT — FX.UX.DASH.3: Activity items link to specific work item

**Done:** Replaced generic `targetPath: "/items"` with `workItemId` on all `ActivityEvent` objects in `recent-activity.tsx`. Data sources: executions (`exec.workItemId`), comments (`comment.workItemId`), proposals (`proposal.workItemId`), WS events (`e.workItemId`). Changed `ActivityRow` from `<Link to="/items">` to a `<div role="button">` with onClick that calls `setSelectedItemId(workItemId)` then `navigate("/items")` — matching the command palette pattern. Added a11y: `role="button"`, `tabIndex`, `onKeyDown`, `focus-visible` ring. Verified: clicking an activity row navigates to `/items` and opens the correct work item detail panel.
**Files:** `packages/frontend/src/features/dashboard/recent-activity.tsx`

---

## 2026-04-01 22:10 PDT — Review: FX.UX.DASH.2 (approved)

**Reviewed:** A11y fix for dashboard stat cards and agent cards.
- `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space), `focus-visible` ring added to both `StatCard` and `AgentCard`
- A11y tree verified: all 6 cards now appear as `button` elements (previously plain StaticText)
- Keyboard navigation tested: Enter on "Active Agents" card correctly navigates to `/agents`
- `e.preventDefault()` on Space prevents page scroll — correct
- Build passes clean, layout unchanged
- **Verdict: approved.**

---

## 2026-04-01 22:05 PDT — FX.UX.DASH.2: Fix card accessibility

**Done:** Added `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space), and `focus-visible` ring styles to `StatCard` in `dashboard.tsx` and `AgentCard` in `active-agents-strip.tsx`. All 6 interactive cards now expose as `button` in the a11y tree, are keyboard-tabbable, and show a focus ring on focus-visible. Verified via a11y snapshot — cards previously appeared as plain StaticText, now appear as button elements.
**Files:** `packages/frontend/src/pages/dashboard.tsx`, `packages/frontend/src/features/dashboard/active-agents-strip.tsx`

---

## 2026-04-01 21:55 PDT — Review: FX.UX.DASH.1 (approved)

**Reviewed:** Dashboard widget grid fix — `lg:grid-cols-2` → `md:grid-cols-2 lg:grid-cols-3`.
- Single-line CSS class change in `dashboard.tsx:99`
- Verified live at 1440x900: all 3 widgets (Recent Activity, Upcoming Work, Cost Summary) in one row, no scrolling needed
- 1024px: 3 columns still readable; 768px: degrades to 2-col gracefully
- Dark mode: no contrast or layout issues
- Build passes clean
- **Verdict: approved.**

---

## 2026-04-01 21:50 PDT — FX.UX.DASH.1: Fix Cost Summary below fold

**Done:** Changed dashboard widget grid from `lg:grid-cols-2` to `md:grid-cols-2 lg:grid-cols-3` so all three widgets (Recent Activity, Upcoming Work, Cost Summary) display in a single row at 1024px+. At 768px, falls back to 2 columns with CostSummary wrapping to row 2. Verified at 1440x900, 1024x768, 768x900, and dark mode — all widgets visible without scrolling at default viewport.
**Files:** `packages/frontend/src/pages/dashboard.tsx`

---

## 2026-04-01 21:35 PDT — Review: UX.DASH (approved)

**Reviewed:** Dashboard UX audit — 7 screenshots, 3 bug filings.
- All task requirements met: initial screenshot, active agents strip, cost summary, recent activity, upcoming work, interactive clicks, 1024px, 768px, dark mode
- 3 bugs well-described with specific file paths, measurements, and fix suggestions
- Screenshots valid across all viewport sizes and dark/light modes
- **Verdict: approved.**

---

## 2026-04-01 21:25 PDT — UX.DASH: Audit Dashboard page

**Done:** Audited Dashboard (`/`) at default viewport (1440x900), 1024px, and 768px, plus dark mode. All 4 stat cards render with correct data and icons. Active agents strip shows 2 running agents with green pulse indicators. Recent Activity populates 10 events with correct icons/colors and live WS support. Upcoming Work shows 1 ready item. Cost Summary renders sparkline chart and monthly progress bar. Dark mode has good contrast throughout. All navigation links verified (stat cards → /agents, /items, /activity, /settings; View all → /activity; activity rows → /items; View items → /items; Settings → /settings). Filed 3 bugs: FX.UX.DASH.1 (Cost Summary below fold), FX.UX.DASH.2 (stat/agent cards not accessible), FX.UX.DASH.3 (activity items link to generic /items).
**Files:** `tests/e2e/results/ux-dash-initial.png`, `tests/e2e/results/ux-dash-fullpage.png`, `tests/e2e/results/ux-dash-scrolled-cost.png`, `tests/e2e/results/ux-dash-1024.png`, `tests/e2e/results/ux-dash-768.png`, `tests/e2e/results/ux-dash-dark.png`, `tests/e2e/results/ux-dash-dark-cost.png`

---

## 2026-04-01 20:45 PDT — Review: AW.2 (approved)

**Reviewed:** Visual check addition to REVIEW state in AGENT_PROMPT.md.
- Checklist item added verbatim: "If UI was changed: does it look correct visually?"
- Conditional block: if WORKLOG lists frontend files → 4-step visual verification
- Integrates cleanly within [INSPECT WORK] before [DECIDE]
- **Verdict: approved.** Agent Workflow Improvements backlog complete (AW.1-2 done).

---

## 2026-04-01 20:40 PDT — AW.2: Add visual check to REVIEW state

**Done:** Updated AGENT_PROMPT.md REVIEW state's `[INSPECT WORK]` step. Added review checklist item: "If UI was changed: does it look correct visually? No broken layout, clipping, or styling issues?" Added conditional visual verification block: if worker's WORKLOG lists frontend files, open affected pages via chrome-devtools MCP, screenshot, and check for broken layout/clipping/misalignment/invisible text/wrong colors.
**Files:** `AGENT_PROMPT.md`

---

## 2026-04-01 20:30 PDT — Review: AW.1 (approved)

**Reviewed:** Visual UI check addition to AGENT_PROMPT.md WORK state.
- [VISUAL CHECK] step placed correctly between [IMPLEMENT] and [VERIFY]
- Conditional: `git diff --name-only` → skip if no frontend changes
- 4-step procedure: dev server check, chrome-devtools screenshot, inspect, fix loop
- All 7 file path → page URL mappings present
- Mandatory rule added to Worker Rules
- **Verdict: approved.**

---

## 2026-04-01 20:25 PDT — AW.1: Add visual UI check to WORK state

**Done:** Added `[VISUAL CHECK]` step to AGENT_PROMPT.md between `[IMPLEMENT]` and `[VERIFY]`. Conditional on frontend changes: runs `git diff --name-only`, skips if no `packages/frontend/` files changed. Includes: dev server check, chrome-devtools MCP screenshot, visual inspection, fix loop. File path → page URL mapping for 7 feature directories. Added mandatory rule to Worker Rules section.
**Files:** `AGENT_PROMPT.md`

---

## 2026-04-01 20:15 PDT — Review: PLUG.10 (approved)

**Reviewed:** E2E test execution results at `tests/e2e/results/executor-switching.md`.
- 12/14 PASS, 0 FAIL, 2 SKIP — all core functionality verified
- Toggle switches modes, API reflects, badge appears/disappears, invalid mode rejected
- 7 screenshots confirm visual quality (aligned toggles, distinct states, readable badge)
- SKIPs justified: endpoint naming correction + poll timing (cosmetic)
- **Verdict: approved.** Pluggable Executor Architecture backlog complete (PLUG.6-10 done, PLUG.3c/3d blocked).

---

## 2026-04-01 20:10 PDT — PLUG.10: Execute executor switching e2e test

**Done:** Ran PLUG.9 test plan against live dev servers. 12/14 PASS, 0 FAIL, 2 SKIP. All core functionality verified: toggle switches modes, API reflects changes, status bar badge appears/disappears, invalid mode rejected with 400. Two notes: test plan referenced `/health` but `executor` field is on `/api/health`; status bar "Simulated" badge requires health poll cycle (cosmetic delay). 7 screenshots captured.
**Files:** `tests/e2e/results/executor-switching.md` (new), 7 screenshots in `tests/e2e/results/`

---

## 2026-04-01 19:55 PDT — Review: PLUG.9 (approved)

**Reviewed:** E2E test plan at `tests/e2e/plans/executor-switching.md`.
- 14 steps across 5 parts: baseline → toggle → mock verify → claude verify → error handling
- UI button labels verified against actual code ("Claude API (real)" / "Simulated (no API calls)")
- Status bar "Simulated" badge check matches `executorMode === "mock"` code
- Production hide check (`isProduction → return null`) noted in prerequisites
- Template format followed: screenshot checkpoints, visual quality, failure criteria
- **Verdict: approved.**

---

## 2026-04-01 19:50 PDT — PLUG.9: E2E test plan for executor switching

**Done:** Created `tests/e2e/plans/executor-switching.md` with 14 steps across 5 parts: health endpoint baseline (2 API checks), Settings toggle location (3 UI steps), switch to mock mode (4 steps — UI + API + status bar badge), switch back to claude (3 steps — UI + badge disappears + API), API validation (invalid mode → 400 error). Visual quality and failure criteria included.
**Files:** `tests/e2e/plans/executor-switching.md` (new)

---

## 2026-04-01 19:40 PDT — Review: PLUG.8 (approved)

**Reviewed:** Integration tests for executor registry.
- 15 tests: 7 for ExecutorRegistry, 8 for ExecutionManager+Registry integration
- Real classes with TestExecutor stubs — no mocking system under test
- Covers: register/get/list/has, overwrite, instance-per-call, mode switching, env vars, production lock, error messages
- Environment variables properly isolated with try/finally
- 171/174 pass (3 pre-existing)
- **Verdict: approved.**

---

## 2026-04-01 19:35 PDT — PLUG.8: Integration tests for executor registry

**Done:** Created 15 integration tests in `executor-registry.test.ts`. ExecutorRegistry tests (7): register/get, list, has, unknown name error, empty registry error, overwrite, new instance per get. ExecutionManager+Registry tests (8): mode selection in test/dev/prod, listExecutorModes, getRegistry, runtime switching (dev mode), unknown mode throw, production lock, AGENTOPS_EXECUTOR env var. Uses real classes with TestExecutor stubs — no mocking the system under test. Tests: 171/174 pass (3 pre-existing failures).
**Files:** `packages/backend/src/agent/__tests__/executor-registry.test.ts` (new)

---

## 2026-04-01 19:25 PDT — Review: PLUG.7 (approved)

**Reviewed:** Pluggable executor architecture documentation in `docs/architecture.md`.
- 3-package dependency diagram (shared → core → backend) — accurate
- Executor interface, registry API, composition root — all documented with code examples
- REST API table for mode switching, "Building on AgentOps" 3-step guide
- File table updated with setup.ts, mock-executor, core re-export notes
- **Verdict: approved.**

---

## 2026-04-01 19:20 PDT — PLUG.7: Architecture docs for pluggable executors

**Done:** Added "Pluggable Executor Architecture" section to `docs/architecture.md`: 3-package dependency diagram (shared → core → backend), executor interface contract, ExecutorRegistry API, composition root pattern, REST API for mode switching, "Building on AgentOps" 3-step guide. Updated agent file table with setup.ts, mock-executor.ts, and core re-export notes.
**Files:** `docs/architecture.md`

---

## 2026-04-01 19:10 PDT — Review: PLUG.6 (approved)

**Reviewed:** Example custom executor at `examples/custom-executor/`.
- EchoExecutor implements full AgentExecutor contract (thinking → text → result)
- setup.ts shows registry.register pattern
- README: 4-step guide, code snippets, event types table, runtime switching
- Imports from @agentops/core and @agentops/shared — correct
- **Verdict: approved.**

---

## 2026-04-01 19:05 PDT — PLUG.6: Example custom executor template

**Done:** Created `examples/custom-executor/` with 3 files: `echo-executor.ts` (trivial AgentExecutor that echoes task description as text events), `setup.ts` (example composition root showing registry.register), `README.md` (step-by-step guide: implement interface, register, wire, select at runtime, event types table).
**Files:** `examples/custom-executor/echo-executor.ts`, `examples/custom-executor/setup.ts`, `examples/custom-executor/README.md` (all new)
