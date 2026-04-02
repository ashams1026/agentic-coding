# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

> Sprints 1-23 complete and archived. Sprint 24 partial: Agent Chat (ACH.1-7), Persona Prompts (PPR.1-4), Notifications (NTF.1-8), Testing (CUX.TEST.1-4), Docs (CUX.DOC.1-2) archived. Only CUX.TEST.5 (regression) remains. Blocked tasks (FX.SDK3, FX.SDK5, SDK.V2.3) in `BLOCKED_TASKS.md`. Roadmap in `docs/roadmap.md`.

---

## Sprint 24: Core UX

> Agent Chat, Persona Prompts, Notifications. Frontend-first per user preference.
> Proposal docs: `docs/proposals/agent-chat/`, `docs/proposals/persona-prompts/`, `docs/proposals/notifications/`

### Testing & Documentation

- [review] **CUX.TEST.5** — Regression checkpoint: re-run all existing e2e test suites in `tests/e2e/plans/` against the current build. Record results to `tests/e2e/results/`. Compare against Sprint 23 regression baseline. File bugs as `FX.REG.*` tasks for any new failures.

---

> **Future sprints (25-27) and Tier 3 backlog are defined in `docs/roadmap.md`.** When Sprint 24 is complete, the Decomposer agent should read the roadmap and decompose Sprint 25 into tasks.
