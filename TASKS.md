# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-25 complete and archived. Sprint 26 partial: Agent Collaboration P1 (COL.1-6), Search P1 (SRC.1-5), Analytics P1 (ANL.1-7), Testing (S26.TEST.1-2) archived. Blocked tasks in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 26: Intelligence & Discovery

> Agent Collaboration P1, Search P1, Analytics + Token Usage P1.

### Testing & Documentation (remaining)

- [ ] **S26.TEST.3** — Write e2e test plan for Analytics: `tests/e2e/plans/analytics-phase1.md`. Cover: analytics page tabs, summary cards, cost charts, token usage charts, time range selector, per-persona/model breakdowns.
- [ ] **S26.TEST.4** — Execute Agent Collaboration e2e tests. Run test plan via chrome-devtools MCP. Screenshot each case. Record to `tests/e2e/results/`. File bugs as `FX.*`.
- [ ] **S26.TEST.5** — Execute Search e2e tests. Run test plan via chrome-devtools MCP. Screenshot each case. Record to `tests/e2e/results/`. File bugs as `FX.*`.
- [ ] **S26.TEST.6** — Execute Analytics e2e tests. Run test plan via chrome-devtools MCP. Screenshot each case. Record to `tests/e2e/results/`. File bugs as `FX.*`.
- [ ] **S26.DOC.1** — Document Sprint 26 APIs. Update `docs/api.md` with: handoff notes schema + injection, dependency enforcement behavior, search endpoint + FTS5, analytics endpoints + token tracking. Update `docs/architecture.md` with context windowing design.
- [ ] **S26.TEST.7** — Regression checkpoint: re-run ALL existing e2e test plans against current build. Compare against Sprint 25 baseline (37 suites, 0 regressions). File bugs as `FX.REG.*`.

---

> **Future sprints (27+) and Tier 3 backlog are defined in `docs/roadmap.md`.** When Sprint 26 is complete, the Decomposer agent should read the roadmap and decompose Sprint 27 into tasks.
