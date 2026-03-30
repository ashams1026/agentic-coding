# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

## Sprint 8: Agent Execution Engine (Phase 4 + 5)

> Core agent infrastructure. Implements Phase 4 (Workflow & Router) and Phase 5 (Agent Persona & Execution) from PLANNING.md.
> T4.1 (hardcoded workflow) already done in Sprint 6 (O.2). T4.6 (user intervention UI) partially done in Sprint 7 (U.7).
> Order: MCP tools → executor interface → SDK executor → dispatch → router → coordination → rejection → concurrency → memory.

### Workflow Dispatch & Router (T4.2 + T4.3)

- [x] **A.12** — Wire dispatch and routing into execution lifecycle. In `execution-manager.ts`: after successful execution completion, call `runRouter(workItemId)`. In `dispatch.ts`: after router changes state, call `dispatchForState()` for the new state. Add guard against infinite loops (max 10 transitions per work item per hour). Wire `dispatchForState` into the PATCH /api/work-items/:id route when currentState changes.

### State Coordination & Rejection (T4.4 + T4.5)

- [x] **A.13** — Implement parent-child state coordination. In `packages/backend/src/agent/coordination.ts`: after any child work item reaches Done, check if all siblings are also Done. If yes, auto-advance parent to "In Review" state (configurable). If any child enters Blocked, add a visual indicator on parent (flag field or comment). Wire into the state-change handler.

- [x] **A.14** — Implement rejection and retry logic. In execution-manager: when Router routes from "In Review" back to "In Progress" (rejection), increment a retry counter on the work item. Carry structured rejection payload: `{ decision, reason, severity, retry_hint }`. Append to executionContext. On max retries (default 3): auto-transition to Blocked, broadcast notification. Persona on next run receives rejection context.

### Concurrency & Cost (T5.4)

- [x] **A.15** — Implement concurrency limiter. Create `packages/backend/src/agent/concurrency.ts`. Track active executions in memory. `canSpawn()`: check against global max (default 3, from project settings). `enqueue(task)`: if at capacity, add to FIFO queue with priority ordering. `onComplete()`: dequeue next task. Wire into dispatch.ts.

- [x] **A.16** — Implement cost tracking and caps. In execution-manager: accumulate `costUsd` from executor events. In concurrency.ts: before spawning, check monthly cost against project's `monthCap` setting. If exceeded, reject spawn and post system comment. Broadcast `cost_update` WS event after each execution.

### Project Memory (T5.5)

- [x] **A.17** — Implement project memory creation. After a top-level work item reaches Done: generate a compressed summary (what was done, key decisions, files changed). Insert into `project_memories` table. Use a haiku-model one-shot call for summary generation.

- [x] **A.18** — Implement memory consolidation and retrieval. Periodic consolidation: when memory count exceeds threshold (e.g., 50), merge oldest entries into higher-level summaries. `get_context` MCP tool serves recent memories capped at ~1000 tokens. Add `getRecentMemories(projectId, tokenBudget)` to a new `packages/backend/src/agent/memory.ts` module.

---

## Sprint 9: Testing

> First testing sprint. Sets up Vitest, then covers the highest-value backend logic.
> Principle: never mock the core logic under test. Integration tests use real SQLite. Unit tests cover pure functions.
> Agent SDK calls are the one thing we stub — everything else is real.

### Test Infrastructure

- [x] **Q.1** — Set up Vitest in the monorepo. Install `vitest` as a root devDependency. Create `vitest.config.ts` at root (or per-package configs if needed) with TypeScript support, path aliases matching tsconfig. Add `"test"` script to root `package.json` (`vitest run`) and `"test:watch"` (`vitest`). Add `"test"` scripts to `packages/backend/package.json` and `packages/shared/package.json`. Verify `pnpm test` runs and finds zero tests.

- [ ] **Q.2** — Create test database helper. In `packages/backend/src/test/setup.ts`: helper that creates a fresh in-memory SQLite database (`:memory:`), runs Drizzle migrations, and optionally seeds with fixture data. Export `createTestDb()` that returns `{ db, cleanup }`. Export `seedTestDb(db)` that inserts a minimal but realistic dataset (1 project, 5 personas, persona assignments, 3 top-level work items with children, comments, executions). Each test file gets its own database — no shared state between tests.

### Shared Package Tests (Pure Logic)

- [ ] **Q.3** — Test workflow state machine. In `packages/shared/src/__tests__/workflow.test.ts`: test `getValidTransitions()` for every state (verify exact transition sets), test `isValidTransition()` for valid and invalid pairs, test `getStateByName()` for existing and non-existing states, verify initial state is Backlog, verify Done is a final state, verify Blocked can transition back, verify no state can transition to Backlog (except as defined).

### Backend API Integration Tests

- [ ] **Q.4** — Test work items CRUD routes. In `packages/backend/src/routes/__tests__/work-items.test.ts`: spin up Fastify with test DB via `app.inject()`. Test: create top-level item, create child item with parentId, get item by id, list items with `?parentId=` filter, list items with `?projectId=` filter, update item fields (title, description, priority), update `currentState` (valid transition), reject invalid state transition, delete item. Verify response shapes and status codes.

- [ ] **Q.5** — Test persona and persona-assignment routes. In `packages/backend/src/routes/__tests__/personas.test.ts`: test persona CRUD (create, get, list, update, delete). In `packages/backend/src/routes/__tests__/persona-assignments.test.ts`: test upsert assignment, get assignments by project, verify assignment links valid persona to valid state.

- [ ] **Q.6** — Test comments, executions, and proposals routes. In `packages/backend/src/routes/__tests__/comments.test.ts`: test create comment with different authorTypes (agent, user, system), list comments filtered by workItemId. In `packages/backend/src/routes/__tests__/executions.test.ts`: test create execution, update status/outcome, list by workItemId. In `packages/backend/src/routes/__tests__/proposals.test.ts`: test create proposal, update status (approve/reject), list by workItemId.

- [ ] **Q.7** — Test work-item-edges routes. In `packages/backend/src/routes/__tests__/work-item-edges.test.ts`: test create edge (depends_on, blocks, related_to), list edges for a work item, delete edge. Test cycle detection — creating A→B→C→A should fail.

- [ ] **Q.8** — Test dashboard aggregate routes. In `packages/backend/src/routes/__tests__/dashboard.test.ts`: test stats endpoint returns correct counts (active agents, pending proposals, blocked items, today's cost). Test with empty DB (all zeros). Test with seeded data (verify aggregation logic).

### Agent Logic Unit Tests

- [ ] **Q.9** — Test concurrency limiter. In `packages/backend/src/agent/__tests__/concurrency.test.ts`: test `canSpawn()` returns true when under limit, false when at limit. Test `enqueue()` adds to queue, `onComplete()` dequeues by priority (P0 before P3). Test queue ordering is FIFO within same priority. Test `getActiveCount()` and `getQueueLength()`. No DB needed — this is in-memory logic.

- [ ] **Q.10** — Test parent-child coordination. In `packages/backend/src/agent/__tests__/coordination.test.ts`: use test DB with a parent + 3 children. Test: when all children are Done, parent advances to "In Review". Test: when 2/3 children are Done, parent does NOT advance. Test: when a child enters Blocked, system comment is posted on parent. Test: manual parent state override is not blocked by children state.

- [ ] **Q.11** — Test dispatch logic. In `packages/backend/src/agent/__tests__/dispatch.test.ts`: use test DB with persona assignments. Test: `dispatchForState()` spawns executor when persona is assigned. Test: no-op when no persona assigned (Backlog, Done). Test: respects concurrency limit (enqueues instead of spawning). Stub the actual executor spawn — we're testing dispatch decisions, not agent execution.

- [ ] **Q.12** — Test MCP tool implementations. In `packages/backend/src/agent/__tests__/mcp-tools.test.ts`: use test DB. Test `post_comment` inserts a comment and returns success. Test `create_children` creates child work items with correct parentId and edges. Test `route_to_state` validates transition and updates state. Test `route_to_state` rejects invalid transition. Test `flag_blocked` sets state to Blocked. Test `list_items` returns filtered results. Test `get_context` returns work item with execution history.

- [ ] **Q.13** — Test execution manager lifecycle. In `packages/backend/src/agent/__tests__/execution-manager.test.ts`: use test DB, stub ClaudeExecutor. Test: `runExecution()` creates DB record with status "running". Test: on executor success, record updated to "completed" with cost/duration. Test: on executor failure, record updated to "failed". Test: transition rate limiting — more than 10 transitions per item per hour is blocked. Test: rejection increments retry counter, max retries triggers Blocked state.

---

## Sprint 10: UI Polish & UX Refinements

> Design-eyed polish pass. Standardize typography, tighten spacing, add micro-interactions, improve filtering, make the detail panel resizable.
> Reference the existing design tokens in `index.css` — extend them, don't fight them.

### Design System Tightening

- [ ] **P.1** — Standardize typography scale. In `packages/frontend/src/index.css`: define semantic text size tokens as CSS custom properties or Tailwind utilities — `--text-page-title` (text-2xl font-bold), `--text-section-title` (text-lg font-semibold), `--text-body` (text-sm), `--text-label` (text-xs font-medium), `--text-caption` (text-xs text-muted-foreground). Audit and replace all one-off sizes like `text-[10px]` and `text-[11px]` — use `text-caption` or `text-label` instead. Document the scale in a comment block at the top of `index.css`.

- [ ] **P.2** — Standardize button and badge sizing. Audit all button sizes across the app — converge on two sizes: `sm` (h-7 text-xs) for inline/compact actions and `default` (h-8 text-sm) for primary actions. Audit badge sizing — converge on two sizes: `sm` (px-1.5 py-0.5 text-xs) for inline badges and `default` (px-2 py-0.5 text-xs) for standalone badges. Remove all `text-[10px]` badge variants. Update `packages/frontend/src/components/ui/button.tsx` and `packages/frontend/src/components/ui/badge.tsx` if needed.

- [ ] **P.3** — Audit and fix spacing alignment. Consistent page padding: all pages use `p-6` for outer padding. Consistent section spacing: `space-y-6` between major sections, `space-y-3` within sections. Consistent card padding: `p-4` for all cards. Fix the filter bar gap (currently `gap-2`, should align with button height). Ensure header-to-content spacing is uniform across Dashboard, Work Items, Agent Monitor, Activity Feed, Personas, Settings pages.

- [ ] **P.4** — Refine color palette for modern feel. In `packages/frontend/src/index.css`: soften the primary accent — current hsl values may be too saturated for a modern look. Review the card/surface color layering: `background` → `card` → `muted` should have subtle but visible distinction (especially in dark mode). Ensure state badge colors have good contrast against both light and dark card backgrounds. Add a subtle `ring` color token for focus states. Test both light and dark modes for WCAG AA contrast compliance on all text/badge combinations.

### Filtering & Sorting Enhancements

- [ ] **P.5** — Add text search to work items. In `packages/frontend/src/features/work-items/filter-bar.tsx`: add a search input (left-most position, with Search icon) that filters work items by title and description text. Debounce input at 200ms. Highlight matching text in list view rows. Store search term in URL params (`?q=`). Clear search with X button or when "Clear filters" is clicked.

- [ ] **P.6** — Add persona and label filters. In filter-bar.tsx: add persona filter dropdown (shows persona avatars + names from mock data, multi-select). Add label filter dropdown (shows all unique labels across work items, multi-select with colored pills). Both filter additively (AND with other filters). Update URL params.

- [ ] **P.7** — Add sort direction toggle and secondary sort. In filter-bar.tsx: add ascending/descending toggle button next to the sort dropdown (ArrowUp/ArrowDown icon). Add a secondary sort option (e.g., sort by priority then by created date). Persist sort direction in URL params (`?sortDir=asc`).

### Detail Panel Improvements

- [ ] **P.8** — Make detail panel resizable. In `packages/frontend/src/pages/work-items.tsx`: replace the fixed `w-2/5` / `w-3/5` split with a draggable divider. Add a 4px vertical resize handle between the list and detail panel (cursor-col-resize, subtle border-l with hover highlight). Track panel width in Zustand (persist to localStorage). Clamp width between 30% and 70% of container. Smooth resize with no layout jank. Show a subtle visual grip indicator on the divider.

- [ ] **P.9** — Add visual divider and panel transition. Add a `border-l border-border` between the list pane and detail panel. Animate panel open/close with a slide-in transition (`transition-all duration-200`). When panel closes, list smoothly expands back to full width.

### Tooltips & Micro-Interactions

- [ ] **P.10** — Add tooltips across the app. Add tooltips to: truncated work item titles in list view (show full title), priority badges (show "Priority: Critical/High/Medium/Low"), state badges (show "State: [name]"), persona avatars (show persona name + model), progress bars (show "X of Y children done"), view toggle buttons (show "List view" / "Flow view"), all icon-only buttons (quick add, close panel, filter clear). Use consistent tooltip styling: `sideOffset={4}`, delay 300ms.

- [ ] **P.11** — Add loading and empty states. Add skeleton loading states to: work items list (5 shimmer rows), detail panel (header + content skeleton), flow view (node placeholders), dashboard cards (number placeholder shimmer). Add empty states with helpful messaging to: work items list when no items exist ("No work items yet. Click + to create one."), filtered list with no matches ("No items match your filters."), detail panel children section ("No children. Click 'Add child' or 'Decompose'."), comment stream when empty ("No comments yet.").

- [ ] **P.12** — Polish hover states and transitions. Audit all interactive elements for hover feedback. List view rows: subtle `bg-muted/50` hover with `transition-colors duration-150`. Cards: slight scale or shadow lift on hover. Buttons: ensure all variants have visible hover state change. Badges that are clickable (priority, state in detail panel): add `cursor-pointer` and subtle hover. Active/selected states: use `ring-2 ring-primary/50` consistently. Focus-visible: ensure all interactive elements show focus ring for keyboard navigation.
