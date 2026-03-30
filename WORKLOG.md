# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-30 — D.2: Write getting started guide

**Task:** Create `docs/getting-started.md` with step-by-step setup, first project, manual workflow, and auto-routing.

**Done:**
- **`docs/getting-started.md`** (new) — Getting started guide with 8 sections:
  1. Prerequisites (Node 22, pnpm 9 with verify commands)
  2. Installation (clone, pnpm install)
  3. First Run (pnpm dev, expected output, mock mode note)
  4. Configure API Key (UI path: Settings > API Keys + CLI path: npx agentops config)
  5. Create First Project (Settings > Projects form, curl example)
  6. Create a Work Item (Board view, inline form)
  7. Walk Through States Manually (detail panel transition dropdown, valid transitions diagram)
  8. Enable Auto-Routing (toggle, persona assignments table, 5 built-in personas, watch the pipeline)
  - "What's Next" links to other docs

**Files created:** `docs/getting-started.md` (also created `docs/` directory)

**Notes:** Build: 0 errors. All UI paths, CLI commands, and API endpoints verified against actual codebase. Mock mode note explains why data appears without a running backend.

---

## 2026-03-30 — Review: D.1 (approved)

**Reviewed:** Project README — overview, features, quick start, docs links.
- One-paragraph overview: clear, concise, covers local-first + workflow + autonomous pipeline ✓
- 8 key features with bold labels: workflow, personas, hierarchy, monitoring, MCP, cost, memory, local-first ✓
- Architecture: ASCII package tree with tech stacks per package ✓
- Quick start: prerequisites (Node 22, pnpm 9), dev + production sections with correct commands ✓
- Configuration: correct path (`~/.agentops/config.json`), CLI syntax matches `cli.ts` ✓
- Docs table: all 9 docs/* links matching D.2-D.10 filenames ✓
- Development commands: 5 standard scripts ✓
- Concise: 101 lines, no bloat ✓
- Verdict: **approved**

---

## 2026-03-30 — D.1: Write project README

**Task:** Create root README.md with project overview, key features, quick start, docs links.

**Done:**
- **`README.md`** (new) — Project README with:
  - One-paragraph overview (local-first, workflow-driven, autonomous pipeline)
  - 8 key features (workflow engine, personas, hierarchy, monitoring, MCP tools, cost management, project memory, local-first)
  - Architecture diagram (3 packages: frontend/backend/shared with tech stacks)
  - Quick start: prerequisites (Node 22, pnpm 9), install + dev, production pm2 commands
  - Configuration section (config.json path, API key via CLI)
  - Documentation table linking to all 9 docs/* files (D.2-D.10)
  - Development commands section

**Files created:** `README.md`

**Notes:** Build: 0 errors. Kept concise per task spec. Links to docs/ files that will be created by D.2-D.10. No docs/ directory created yet — each doc task will create its own file.

---

## 2026-03-30 — Review: W.8 (approved)

**Reviewed:** Data management settings — DB stats, execution cleanup, settings export/import.
- Backend: `GET /api/settings/db-stats` queries SQLite pragma page_count * page_size, returns sizeMB + entity counts ✓
- Backend: `DELETE /api/settings/executions` uses `lt(startedAt, cutoff)` for 30-day cleanup ✓
- Backend: `GET /api/settings/export` returns JSON of projects, personas, personaAssignments ✓
- Backend: `POST /api/settings/import` iterates arrays with `onConflictDoNothing()` — safe re-imports ✓
- Frontend: `DatabaseInfo` fetches stats on mount with loading skeleton ✓
- Frontend: Export downloads dated JSON file via blob URL ✓
- Frontend: Import uses file input for `.json` with result/error feedback ✓
- Frontend: Clear has 2-click confirmation with 5s auto-dismiss ✓
- API layer: client, mock, and unified wrapper all added consistently ✓
- Build: 0 errors
- Verdict: **approved**
- **Sprint 13 (Settings Wiring) complete** — all 8 tasks (W.1-W.8) approved.

---

## 2026-03-30 — W.8: Wire data management settings

**Task:** Wire the Settings Data section with real backend endpoints for DB stats, execution cleanup, settings export/import.

**Done:**
- **Backend `packages/backend/src/routes/settings.ts`** — Added 4 new endpoints:
  - `GET /api/settings/db-stats` — queries SQLite `page_count * page_size` for DB size, counts executions/projects/personas
  - `DELETE /api/settings/executions` — deletes executions older than 30 days using `lt(executions.startedAt, cutoff)`
  - `GET /api/settings/export` — returns JSON dump of projects, personas, persona-assignments
  - `POST /api/settings/import` — accepts same JSON format, inserts with `onConflictDoNothing()`
- **Frontend `packages/frontend/src/api/client.ts`** — Added `getDbStats()`, `clearExecutionHistory()`, `exportSettings()`, `importSettings()` with typed interfaces
- **Frontend `packages/frontend/src/mocks/api.ts`** — Added mock implementations for all 4 functions
- **Frontend `packages/frontend/src/api/index.ts`** — Added unified wrappers for all 4 functions
- **Frontend `packages/frontend/src/features/settings/appearance-section.tsx`** — Rewired `DataSection`:
  - `DatabaseInfo`: fetches real DB stats on mount, shows size + counts with loading skeleton
  - `DataActionsSection`: Export downloads JSON file via blob URL, Import uses file input for `.json` upload, Clear has 2-click confirmation dialog with 5s timeout
  - Import shows result message (success with counts or error)

**Files modified:** `settings.ts` (backend), `client.ts`, `mocks/api.ts`, `api/index.ts`, `appearance-section.tsx`, `TASKS.md`, `WORKLOG.md`

**Notes:** Build: 0 errors. Import uses `onConflictDoNothing()` so re-importing the same data is safe. Clear only deletes executions > 30 days old (not all). Confirmation dialog auto-dismisses after 5 seconds.

---

## 2026-03-30 — Review: W.7 (approved)

**Reviewed:** Density setting wiring — Zustand store, localStorage persistence, CSS overrides.
- `Density` type ("comfortable" | "compact") added to store with `setDensity` action ✓
- Persisted to localStorage via `partialize` ✓
- `data-density` attribute synced on `documentElement` via `useEffect` in `use-theme.ts` ✓
- CSS `[data-density="compact"]` overrides: page padding 1rem (p-4), card padding 0.75rem (p-3), font-size 0.75rem (text-xs), reduced space-y gaps, compact table rows ✓
- `DensitySection` wired to store (replaces local useState) ✓
- Theme toggle unchanged and still functional ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — W.7: Wire appearance settings

**Task:** Add density setting (comfortable/compact) to Zustand store, persist to localStorage, apply via `data-density` CSS attribute on root element with compact overrides.

**Done:**
- **`packages/frontend/src/stores/ui-store.ts`** — Added `density: Density` state ("comfortable" | "compact"), `setDensity` action, persisted to localStorage via `partialize`
- **`packages/frontend/src/hooks/use-theme.ts`** — Added density sync: `useEffect` sets `data-density` attribute on `document.documentElement` when density changes
- **`packages/frontend/src/index.css`** — Added `[data-density="compact"]` CSS overrides: reduced page padding (`1rem`), tighter card padding (`0.75rem`), smaller body text (`0.75rem`), reduced `space-y-6`/`space-y-4` gaps, compact table row padding
- **`packages/frontend/src/features/settings/appearance-section.tsx`** — Rewired `DensitySection`: reads/writes from Zustand store instead of local `useState`. Imported `Density` type from store.

**Files modified:** `ui-store.ts`, `use-theme.ts`, `index.css`, `appearance-section.tsx`, `TASKS.md`, `WORKLOG.md`

**Notes:** Build: 0 errors. Theme toggle already worked (unchanged). Density follows same pattern as theme: Zustand + localStorage + DOM sync hook. The `data-density` attribute approach allows CSS-only overrides without JS class toggling on individual components.

---

## 2026-03-30 — Review: W.6 (approved)

**Reviewed:** Auto-routing toggle wiring in workflow settings.
- Reads `autoRouting` from project settings, defaults ON (`!== false`) — matches backend `router.ts` line 64 ✓
- Toggle persists via `PATCH /api/projects/:id` with `settings.autoRouting` ✓
- Descriptive state text: ON message / OFF message per spec ✓
- Visual toggle: emerald-500 ON, muted OFF, knob translate-x, `aria-checked` ✓
- Disabled when no project configured ✓
- No backend changes needed — `router.ts` already checks this setting ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — W.6: Wire auto-routing toggle

**Task:** Wire the Settings Workflow auto-routing toggle to read/write `autoRouting` from project settings. Show current state clearly with descriptive text.

**Done:**
- **`packages/frontend/src/features/settings/workflow-config-section.tsx`** — Rewired `AutoRoutingToggle`:
  - Reads `autoRouting` from first project's settings via `useProjects()` (defaults to ON when not set, matching backend behavior in `router.ts` line 64: `if (autoRouting === false) return false`)
  - Toggle switch calls `useUpdateProject()` with `settings.autoRouting` — persists via `PATCH /api/projects/:id`
  - Descriptive text changes based on state: "Auto-routing: ON — Router agent will automatically transition work items" / "Auto-routing: OFF — Manual transitions only"
  - Toggle visually reflects state: emerald-500 when ON, muted when OFF, translate-x for knob position
  - Disabled state when no project configured
  - Added `useProjects`, `useUpdateProject` imports

**No backend changes needed** — `router.ts` already reads `autoRouting` from project settings and skips when `false`.

**Files modified:** `workflow-config-section.tsx`, `TASKS.md`, `WORKLOG.md`

**Notes:** Build: 0 errors. The toggle default is `true` (ON) to match the backend's behavior where `autoRouting` is only disabled when explicitly set to `false`.

---

## 2026-03-30 — Review: W.5 (approved)

**Reviewed:** Cost management settings wiring — monthCap, warningThreshold, dailyLimit, cost chart, progress bar.
- Reads `monthCap` (default 50), `warningThreshold` (default 80%), `dailyLimit` (default 0) from project settings ✓
- All three fields persist via `PATCH /api/projects/:id` through `useUpdateProject()` ✓
- Progress bar uses real `monthTotal` from `useCostSummary()` (→ `GET /api/dashboard/cost-summary`) ✓
- Warning threshold triggers amber alert when spend % exceeds it, danger at 95% ✓
- Daily limit enable/disable toggle (0 ↔ 10) with dollar input ✓
- Cost chart uses real 7-day `dailySpend` data, loading skeleton, empty state ✓
- Disabled inputs when no project configured ✓
- No backend changes needed — `settings` JSON column already supports arbitrary fields ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — W.5: Wire cost management settings

**Task:** Wire the Settings Costs section to read/write `monthCap`, `warningThreshold`, `dailyLimit` from project settings. Wire cost chart to real `GET /api/dashboard/cost-summary` data. Show real monthly spend vs cap progress bar.

**Done:**
- **`packages/frontend/src/features/settings/costs-section.tsx`** — Rewired completely:
  - `CostCapSection`: reads `monthCap` (default 50), `warningThreshold` (default 80%), `dailyLimit` (default 0) from first project's settings via `useProjects()`
  - All three fields update via `useUpdateProject()` with `PATCH /api/projects/:id` — immediate effect
  - Progress bar uses real `monthTotal` from `useCostSummary()` hook (backed by `GET /api/dashboard/cost-summary`)
  - Daily limit enable/disable toggles between 0 and 10
  - Disabled state when no project configured
  - `CostHistoryChart`: replaced 30-day mock `generate30DayData()` with real 7-day data from `useCostSummary()`
  - Loading skeleton while data fetches, empty state when no cost data
  - Removed all local `useState` for settings — all values are now derived from project settings API

**No backend changes needed** — `GET /api/dashboard/cost-summary` already reads `monthCap` from project settings. `warningThreshold` and `dailyLimit` are stored in the freeform `settings` JSON column (no schema migration required).

**Files modified:** `costs-section.tsx`, `TASKS.md`, `WORKLOG.md`

**Notes:** Build: 0 errors. The `useMemo` import and `generate30DayData` mock function were removed. Recharts chart now shows 7 days (matching backend's `cost-summary` response) instead of 30 days of fake data.

---

## 2026-03-30 — Review: W.4 (approved)

**Reviewed:** Concurrency settings wiring — backend endpoint, frontend slider, live stats polling.
- Backend: `GET /api/settings/concurrency` returns `{ active, queued }` from concurrency tracker ✓
- Frontend: `ConcurrencySection` reads `maxConcurrent` from project settings via `useProjects()` ✓
- Slider (1-10) updates via `PATCH /api/projects/:id` with `settings.maxConcurrent` ✓
- Change takes effect immediately — `canSpawn()` reads project settings on each call ✓
- Polls stats every 5s, displays "Active: N / Queued: N" below slider ✓
- Disabled state when no project configured ✓
- API client, mock, and unified wrapper all added consistently ✓
- Build: 0 errors
- Verdict: **approved**

---

## 2026-03-30 — W.4: Wire concurrency settings

**Task:** Wire the Settings Concurrency section to read/write `maxConcurrent` from project settings. Show active/queued counts.

**Done:**
- **`packages/backend/src/routes/settings.ts`** — Added `GET /api/settings/concurrency` returning `{ active, queued }` from in-memory concurrency tracker
- **`packages/frontend/src/api/client.ts`** — Added `getConcurrencyStats()` with `ConcurrencyStats` interface
- **`packages/frontend/src/mocks/api.ts`** — Added mock `getConcurrencyStats()` returning `{ active: 1, queued: 0 }`
- **`packages/frontend/src/api/index.ts`** — Added unified wrapper
- **`packages/frontend/src/features/settings/api-keys-section.tsx`** — Rewired `ConcurrencySection`:
  - Reads `maxConcurrent` from first project's settings via `useProjects()`
  - Slider change calls `useUpdateProject()` with `settings.maxConcurrent` — takes effect immediately (backend reads on each `canSpawn()`)
  - Polls `GET /api/settings/concurrency` every 5s for live active/queued counts
  - Shows "Active: N / Queued: N" below the slider
  - Disabled state when no project configured

**Files modified:** `settings.ts`, `client.ts`, `mocks/api.ts`, `api/index.ts`, `api-keys-section.tsx`

**Notes:** Build: 0 errors. Tests: 159/159. Backend concurrency limiter already reads `maxConcurrent` from project settings on each `canSpawn()` call — no backend changes needed for the setting to take effect.

---

## 2026-03-30 — Review: W.3 (approved)

**Reviewed:** Project CRUD routes, settings UI wiring, sidebar project switcher.
- Backend: 5 CRUD routes with proper serialization, error codes, 201/204/400/404 ✓
- POST/PATCH: `existsSync()` path validation, 400 with descriptive message ✓
- POST: validates name/path non-empty ✓
- Sidebar: `useProjects()` populates Select, collapsed tooltip, "No projects" fallback ✓
- Settings form: `formError` state, `onSuccess`/`onError` mutation callbacks, inline error with icon ✓
- Error cleared on cancel and new submission ✓
- Build: 0 errors, Tests: 159/159
- Verdict: **approved**

---

## 2026-03-30 — W.3: Wire project CRUD in settings

**Task:** Create backend project CRUD routes with path validation. Wire settings Projects section and sidebar project switcher to real API.

**Done:**
- **`packages/backend/src/routes/projects.ts`** (new) — 5 CRUD routes:
  - `GET /api/projects` — list all projects
  - `GET /api/projects/:id` — get single project
  - `POST /api/projects` — create with `fs.existsSync()` path validation, returns 400 on invalid path
  - `PATCH /api/projects/:id` — update with path validation if path field provided
  - `DELETE /api/projects/:id` — delete project
  - Serializer: dates to ISO, branded ProjectId cast
- **`packages/backend/src/server.ts`** — Registered `projectRoutes`
- **`packages/frontend/src/components/sidebar.tsx`** — Wired project switcher to real data:
  - Uses `useProjects()` hook to fetch project list
  - Select dropdown populated with real projects (name + id)
  - Collapsed tooltip shows first project name
  - Fallback to "No projects" when none exist
- **`packages/frontend/src/features/settings/projects-section.tsx`** — Added validation error display:
  - `formError` state captures mutation errors
  - Inline error message with AlertCircle icon shown below form on create/update failure
  - Error cleared on cancel or new submission
  - Mutations use `onSuccess`/`onError` callbacks instead of fire-and-forget

**Files created:** `packages/backend/src/routes/projects.ts`
**Files modified:** `server.ts`, `sidebar.tsx`, `projects-section.tsx`

**Notes:** Build: 0 errors. Tests: 159/159. Frontend API layer (client, mock, hooks, unified index) already had project functions — only needed backend routes. Path validation: backend checks `existsSync`, frontend checks starts-with-`/`.

---

## 2026-03-30 — Review: W.2 (approved)

**Reviewed:** API key wiring in `claude-executor.ts`.
- `loadConfig()` called fresh at start of every `spawn()` — not cached ✓
- Empty key guard: yields error event with "Anthropic API key not configured. Go to Settings → API Keys." and returns ✓
- Error code `"no_api_key"` — specific, identifiable ✓
- `process.env["ANTHROPIC_API_KEY"]` set before `query()` call ✓
- Error flows through existing pipeline: execution → failed → WS broadcast → toast ✓
- Minimal, focused change — import + 11 lines in spawn() ✓
- Build: 0 errors, Tests: 159/159
- Verdict: **approved**

---

## 2026-03-30 — W.2: Wire API key into agent executor

**Task:** Read API key from config on each execution. Reject with clear error if not configured.

**Done:**
- **`packages/backend/src/agent/claude-executor.ts`** — Added at the start of `spawn()`:
  1. `loadConfig()` call to read API key fresh on every execution (user might update between runs)
  2. If no key: yields `{ type: "error", message: "Anthropic API key not configured. Go to Settings → API Keys.", code: "no_api_key" }` and returns early
  3. Sets `process.env["ANTHROPIC_API_KEY"]` for the SDK before calling `query()`
- Error flows through existing pipeline: `runExecutionStream` catch → DB update to failed → WS broadcast `agent_completed(failure)` → frontend toast via `use-toast-events.ts`

**Files modified:** `packages/backend/src/agent/claude-executor.ts`

**Notes:** Build: 0 errors. Tests: 159/159. The error message includes a unicode arrow (→) pointing to Settings. Setting `process.env` is safe because all executions use the same configured key. The key is read fresh on each `spawn()` call, not cached.

---

## 2026-03-30 — Review: W.1 (approved)

**Reviewed:** API key storage, validation, and Settings UI wiring — `settings.ts`, `api-keys-section.tsx`, API layer.
- Backend: GET (status check), POST (validate via real Anthropic API + store), DELETE (clear) ✓
- `validateAnthropicKey()`: real POST to Anthropic, 401=invalid, else valid, network errors caught ✓
- `maskKey()`: first 12 chars + "...****", short key fallback ✓
- Frontend: fetches status on mount with loading skeleton ✓
- Configured: masked key + green checkmark + Remove button (X icon, destructive) ✓
- Unconfigured: password input + Test connection button ✓
- Test connection = validate + store in one round trip, transitions to configured view on success ✓
- Error messages from backend displayed ✓
- API layer: client + mock + unified index, all 3 functions, typed interfaces ✓
- Build: 0 errors, Tests: 159/159
- Verdict: **approved**
