# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-22 complete and archived. Sprint 23: Error Recovery (FND.ERR.1-7), Work Item Lifecycle (FND.WIL.1-8), Global Agents (FND.GA.1-10), Testing partial (FND.TEST.1-4) archived. All research proposals (RES.*) complete and archived. Blocked tasks (FX.SDK3, FX.SDK5, SDK.V2.3) moved to `BLOCKED_TASKS.md`. Full roadmap for Sprints 24-27 and Tier 3 backlog in `docs/roadmap.md`.

---

## Sprint 23: Foundations

> Reliability fixes + data hygiene + the keystone feature (Global Agents). See `docs/roadmap.md` for full context.
> Proposal docs: `docs/proposals/error-recovery/`, `docs/proposals/work-item-lifecycle/`, `docs/proposals/global-agents/`

### Testing & Documentation

- [ ] **FND.TEST.5** — Execute Global Agents Phase 1 e2e tests. Run the test plan from `tests/e2e/plans/global-agents-phase1.md` via chrome-devtools MCP. Screenshot each test case. Record results to `tests/e2e/results/`. File bugs as `FX.*` tasks for any failures.
- [ ] **FND.TEST.6** — Regression checkpoint: re-run all existing e2e test suites. Run every test plan in `tests/e2e/plans/` against the current build. Record results to `tests/e2e/results/`. Compare against previous results to identify regressions. File bugs as `FX.REG.*` tasks for any new failures not present in prior runs.
- [ ] **FND.DOC.1** — Document new Work Item Lifecycle API endpoints. Update `docs/` with the new endpoints: `POST /api/work-items/:id/archive`, `POST /api/work-items/:id/unarchive`, `POST /api/work-items/:id/restore`, `POST /api/work-items/bulk/archive`, `POST /api/work-items/bulk/unarchive`, `DELETE /api/work-items/bulk`. Include request/response shapes, 409 guard behavior, 30-day grace period, and cascade rules. Also document the `archived_at`/`deleted_at` schema additions.
- [ ] **FND.DOC.2** — Document Global Agents data model and API changes. Update `docs/` with: nullable `projectId` on chat sessions and executions, `global_memories` table schema, `AgentScope` type, `POST /api/executions/run` standalone execution endpoint (request/response shape, validation rules). Document the "All Projects" navigation behavior and scope-awareness rules for Dashboard and Agent Monitor.

---

> **Future sprints (24-27) and Tier 3 backlog are defined in `docs/roadmap.md`.** When Sprint 23 is complete, the Decomposer agent should read the roadmap and decompose Sprint 24 into tasks.
