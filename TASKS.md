# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

## Sprint 5 (remaining): Backend API Completion

> Resume from T3.1.3 onwards, but with the corrected WorkItem-based schema from Sprint 6.
> These tasks only make sense AFTER Sprint 6 is complete.

- [x] **T3.1.3** — Set up Drizzle migrations and seed script (using new WorkItem schema from O.18/O.19)
- [x] **T3.2.5** — Implement comment API routes (updated for workItemId)
- [x] **T3.2.7** — Implement persona API routes
- [x] **T3.2.8** — Implement execution API routes (updated for workItemId)
- [x] **T3.2.9** — Implement proposal API routes (updated for parentWorkItemId)
- [x] **T3.2.10** — Implement aggregate/dashboard API routes (updated for work items)
- [ ] **T3.3.1** — Implement real WebSocket server
- [ ] **T3.3.2** — Create API client for frontend (updated for work item endpoints)
- [ ] **T3.3.3** — Add API mode toggle to frontend
- [ ] **T3.3.4** — Connect WebSocket client to real server

---

## Sprint 7: UI Refinements & Flow View

> Post-backend sprint. Addresses UX feedback from manual review of the Sprint 6 UI refactor.

### View Overhaul

- [ ] **U.1** — Remove tree view. Delete `packages/frontend/src/features/work-items/tree-view.tsx`. Remove "Tree" option from the view toggle in `packages/frontend/src/pages/work-items.tsx`. Update URL param handling to remove `?view=tree`. Only List and Flow views should remain.

- [ ] **U.2** — Build Flow view. Replace the board view (`board-view.tsx`) with a new `packages/frontend/src/features/work-items/flow-view.tsx`. Render the hardcoded workflow as a state machine graph (reuse layout concepts from the workflow designer's `computeLayout` and `computeArrowPath`). Each state node is a live container showing: state name, colored header from `WORKFLOW`, item count badge, active agent count with pulsing indicator, mini avatar stack of assigned personas currently working, progress bar (items done / total in that state). Directed arrows between states per `WORKFLOW.transitions`. Click a state node to expand it inline or filter the detail panel to items in that state. The view should feel alive — pulsing dots for active agents, counts updating reactively.

- [ ] **U.3** — Update view toggle. In `packages/frontend/src/pages/work-items.tsx`: rename toggle options from `[List] [Board] [Tree]` to `[List] [Flow]`. Update icons — List keeps list icon, Flow gets a workflow/git-branch icon. Update URL param values (`?view=list`, `?view=flow`). Default view remains List.

### Detail Panel Editability

- [ ] **U.4** — Add inline title editing to detail panel. In `packages/frontend/src/features/work-items/detail-panel.tsx`: make the title click-to-edit (input field on click, Enter to save, Escape to cancel). Wire to `useUpdateWorkItem` mutation.

- [ ] **U.5** — Add description editing to detail panel. Below the title: add Write/Preview tabs for the description field. Write tab shows a textarea, Preview tab renders markdown. Save/Cancel buttons. Wire to `useUpdateWorkItem` mutation. Reuse the `EditableSection` pattern from the old story-detail if applicable.

- [ ] **U.6** — Add priority and label editing to detail panel. Priority: replace static badge with a dropdown selector (P0-P3 with colors). Labels: add an inline pill editor (click to add/remove labels). Both wire to `useUpdateWorkItem` mutation.

- [ ] **U.7** — Add state transition control to detail panel. Below the state badge: add a dropdown showing valid next states from `getValidTransitions(currentState)`. Selecting a state triggers the transition (with persona prompt if auto-routing is on). Reuse transition prompt modal from the old board view.

### Agent Monitor Polish

- [ ] **U.8** — Soften agent monitor page chrome. In `packages/frontend/src/features/agent-monitor/`: keep the terminal-style rendering (`bg-zinc-950`, `font-mono`, emerald code text) for the output stream pane only. Soften the surrounding chrome (sidebar list, tab bar, control bar, history table) to use standard app styling (`bg-background`, `text-foreground`, normal font). The output pane should feel like an embedded terminal, not the whole page.

### Layout Fix

- [ ] **U.9** — Fix bottom padding for status bar. In `packages/frontend/src/layouts/root-layout.tsx`: add `pb-8` (or equivalent 32px bottom padding) to the `<main>` element so page content doesn't get clipped behind the StatusBar.
