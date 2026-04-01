# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-01 15:30 PDT — SDK.FUT.3: Plugin system spike

**Done:** Evaluated SDK plugin system. Local plugins (`type: 'local'`) work now via `plugins` option. Marketplace uses `enabledPlugins`/`extraKnownMarketplaces` in settings. 3 options: local (low), marketplace (medium), UI browser (high). Recommendation: start with local plugins.
**Files:** `docs/spikes/plugin-system.md` (new)

---

## 2026-04-01 15:15 PDT — Review: SDK.FUT.2 (approved)

**Reviewed:** Bridge API spike at `docs/spikes/bridge-api-remote.md`.
- Correctly identifies `spawnClaudeCodeProcess` as actual mechanism (not speculated APIs)
- SpawnedProcess interface documented from types
- 3 implementation paths with code examples
- Architecture confirms local observability works with remote process
- **Verdict: approved.** 10 [x] — CLEANUP next.

---

## 2026-04-01 15:10 PDT — SDK.FUT.2: Bridge API spike for remote execution

**Done:** Evaluated SDK remote execution via `spawnClaudeCodeProcess` custom spawn function. No `attachBridgeSession`/`createCodeSession` exists — the mechanism is a custom process factory returning `SpawnedProcess` (stdin/stdout). Documented 3 implementation options (SSH, Docker, Cloud), architecture diagram showing local hooks/MCP with remote process. Recommendation: defer, SSH path is low-medium effort when needed.
**Files:** `docs/spikes/bridge-api-remote.md` (new)

---

## 2026-04-01 15:00 PDT — Review: SDK.FUT.1 (approved)

**Reviewed:** Browser SDK spike at `docs/spikes/browser-sdk-pico.md`.
- API documented from actual `browser-sdk.d.ts` types
- Architecture comparison with clear diagrams
- Feature parity table (server vs browser query)
- 4 requirements, complexity estimate, recommendation with revisit criteria
- **Verdict: approved.**

---

## 2026-04-01 14:55 PDT — SDK.FUT.1: Browser SDK spike for Pico

**Done:** Evaluated `@anthropic-ai/claude-agent-sdk/browser` for client-side Pico chat. Browser SDK exists with WebSocket transport, OAuth auth, hooks, MCP server support. Documented in `docs/spikes/browser-sdk-pico.md`. Conclusion: feasible but not recommended now — requires WebSocket relay infrastructure and OAuth flow. Revisit when Claude provides hosted relay or multi-user OAuth is needed.
**Files:** `docs/spikes/browser-sdk-pico.md` (new)

---

## 2026-04-01 14:45 PDT — Review: DOC.9 (approved)

**Reviewed:** Frontend.md updates.
- Mock data layer removed (40+ lines → 3-line API Layer section)
- Directory tree: mocks/ gone, pico/ added, features updated
- api/ descriptions cleaned (no mock delegation)
- Intro and State Management mock references fixed
- **Verdict: approved.**

---

## 2026-04-01 14:40 PDT — DOC.9: Update frontend.md

**Done:** Removed mock data layer section entirely (mocks deleted in FX.MOCK1/MOCK2) — replaced with brief "API Layer" section with seed-demo note. Removed `mocks/` from directory tree. Updated feature directories: added pico/, updated agent-monitor, persona-manager, settings descriptions. Updated api/ descriptions (removed mock delegation). Fixed "mock layer" reference in State Management.
**Files:** `docs/frontend.md`

---

## 2026-04-01 14:30 PDT — Review: DOC.8 (approved)

**Reviewed:** Deployment.md updates.
- Dev scripts: seed-demo, db:reset, test:e2e added. Port-check behavior documented.
- Database paths: dev vs prod now distinct (was "Same SQLite file")
- Audit log added to log files table
- Stale `npx agentops dev` removed
- **Verdict: approved.**

---

## 2026-04-01 14:25 PDT — DOC.8: Update deployment.md

**Done:** Updated Development section: added `pnpm db:seed-demo`, `pnpm db:reset`, `pnpm test:e2e` commands. Documented `scripts/dev.sh` port-check behavior. Fixed database paths (dev vs prod). Added `audit.log` to pm2 log files table with expanded description. Security section already current from SDK.SB.6.
**Files:** `docs/deployment.md`

---

## 2026-04-01 14:15 PDT — Review: DOC.7 (approved)

**Reviewed:** mcp-tools.md source files table fix.
- Source files: 7→8 + in-process server — correct
- Rest of doc already current from SDK.FC.7 and SDK.MCP.5
- No stale tool names found
- **Verdict: approved.**

---

## 2026-04-01 14:10 PDT — DOC.7: Update mcp-tools.md

**Done:** Fixed source files table: "7 tool registrations" → "8 tool registrations + in-process server". The rest of `mcp-tools.md` was already current from prior updates: SDK.FC.7 (rewind_execution tool, tool count, persona access table), SDK.MCP.5 (dynamic management section). No stale tool names found (`transition_state`/`create_tasks` already corrected).
**Files:** `docs/mcp-tools.md`

---

## 2026-04-01 14:00 PDT — Review: DOC.6 (approved)

**Reviewed:** API docs update in `docs/api.md`.
- 12 new endpoint docs across 3 sections (Chat, SDK, Runtime Control)
- SSE event types for chat streaming documented
- 404 behavior noted for runtime endpoints
- **Verdict: approved.**

---

## 2026-04-01 13:55 PDT — DOC.6: Update api.md

**Done:** Added 3 new API sections: "Chat (Pico)" (5 endpoints: create/list/send/update/delete sessions, SSE streaming), "SDK Capabilities" (2 endpoints: get/reload), "Runtime Execution Control" (5 endpoints: MCP status/toggle/reconnect, models, model switch). Total ~12 new endpoint docs.
**Files:** `docs/api.md`

---

## 2026-04-01 13:45 PDT — Review: DOC.5 (approved)

**Reviewed:** Personas.md updates.
- All 4 stale MCP tool names fixed (PM, TL, Engineer, Reviewer) — verified against seed.ts
- Pico added as 6th persona with complete section
- Reviewer role updated with rewind_execution capability
- **Verdict: approved.**

---

## 2026-04-01 13:40 PDT — DOC.5: Update personas.md

**Done:** Fixed stale MCP tool names for all 5 workflow personas: PM (`transition_state` → correct tools), TL (`create_tasks` → `create_children`), Engineer (`transition_state` → `get_context`), Reviewer (added `get_context`, `list_items`, `rewind_execution`). Added Pico as 6th built-in persona section with full field table and role description. Reviewer role updated to mention `rewind_execution` capability.
**Files:** `docs/personas.md`

---

## 2026-04-01 13:30 PDT — Review: DOC.4 (approved)

**Reviewed:** Workflow.md updates.
- 3-layer Router safety: same-state rejection, transition history, loop detection — all accurate
- Rate limiter logging with WS broadcast noted
- Play/pause UX: 3 locations, emerald/amber colors
- **Verdict: approved.**

---

## 2026-04-01 13:25 PDT — DOC.4: Update workflow.md

**Done:** Added "Router Safety Features" section with 3-layer loop prevention: same-state rejection, transition history awareness (last 3 transitions in dynamic prompt), loop detection (6-entry history, 3-occurrence threshold → auto-Blocked). Added rate limiter logging note. Updated auto-routing toggle to describe play/pause UX (emerald/amber colors, 3 toggle locations).
**Files:** `docs/workflow.md`

---

## 2026-04-01 13:15 PDT — Review: DOC.3 (approved)

**Reviewed:** Data model updates in `docs/data-model.md`.
- Table count 9→11, Project/Persona/Execution entities updated with all new fields
- ChatSession + ChatMessage tables added for Pico
- Settings typed as `ProjectSettings`/`PersonaSettings` — accurate to code
- **Verdict: approved.**

---

## 2026-04-01 13:10 PDT — DOC.3: Update data-model.md

**Done:** Updated table count 9→11. Project: `settings` typed as `ProjectSettings` with sandbox. Persona: added `skills`, `subagents` fields, updated `settings` to `PersonaSettings` with effort/thinking. Execution: added `checkpointMessageId`, `structuredOutput`, `parentExecutionId`. Added ChatSession and ChatMessage entity tables for Pico.
**Files:** `docs/data-model.md`

---

## 2026-04-01 13:00 PDT — Review: SDK.REG.2 (approved)

**Reviewed:** Post-Sprint 20 regression sweep.
- Build PASS, 0 regressions, 13 Sprint 20 features in verification table
- References REG.1 to avoid redundancy (same scope, no code changes)
- **Verdict: approved.** Sprint 20 final quality gate passed.

---

## 2026-04-01 12:55 PDT — SDK.REG.2: Post-Sprint 20 regression sweep

**Done:** Sprint 20 regression checkpoint. Same scope as REG.1 (no code changes between the two). Build PASS, 0 regressions. All 13 Sprint 20 features documented in verification table. References `regression-post-sprint19.md` for full report.
**Files:** `tests/e2e/results/regression-post-sprint20.md`

---
