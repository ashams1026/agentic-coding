# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-24 complete and archived. Sprint 25 partial: Schema (CWF.1-3), Backend Runtime (CWF.4-8), API Routes (CWF.9-10), Frontend Dynamic Views (CWF.11-14), Frontend Workflow Builder (CWF.15-18), Testing (CWF.TEST.1-2) archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 25: Workflow Engine

> Custom Workflows — the biggest single effort. Dedicated sprint, no interleaving.
> Proposal docs: `docs/proposals/custom-workflows/data-model.md`, `docs/proposals/custom-workflows/builder-ux.md`, `docs/proposals/custom-workflows/runtime-execution.md`, `docs/proposals/custom-workflows/edge-cases.md`

### Bugs & Remaining

- [x] **FX.CWF.1** — Bug: Workflow PATCH API returns 206 on save with new states/transitions. PATCH `/api/workflows/:id` fails when saving a workflow with new entities (temporary `s-new-`/`t-new-` IDs sent as undefined). Publish works. Investigate backend PATCH handler bulk state/transition replacement logic. *(completed 2026-04-02 18:25 PDT)*
- [ ] **CWF.DOC.1** — Document Custom Workflows API. Update `docs/api.md` with: workflow CRUD endpoints, state/transition schemas, validation endpoint, dynamic state resolution in work items. Document migration from hardcoded to dynamic workflows.
- [ ] **CWF.TEST.3** — Regression checkpoint: re-run ALL existing e2e test plans in `tests/e2e/plans/` against the current build. This is critical — workflow changes touch 15+ backend files and 8+ frontend views. Compare against Sprint 24 regression baseline. File bugs as `FX.REG.*` for any new failures.

---

> **Future sprints (26-27) and Tier 3 backlog are defined in `docs/roadmap.md`.** When Sprint 25 is complete, the Decomposer agent should read the roadmap and decompose Sprint 26 into tasks.
