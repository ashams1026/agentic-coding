# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-30 — Review: FX.PM3 (approved)

**Reviewed:** Persona detail panel read-only mode fix.
- `editing` state defaults to `false` — panel opens read-only
- Read-only: description text, model colored badge, MarkdownPreview prompt (scrollable, max-h 400px, bordered), MCP tools as secondary badges, SDK tools as outline badges, skills as badge pills, budget with DollarSign
- Edit mode: name Input, description Textarea, avatar picker, model selector cards, SystemPromptEditor, ToolConfiguration, budget Input, Save + Cancel at bottom
- Edit button in header (Pencil + "Edit"), only shown when not editing
- Save: `updateMutation.mutate()` with `onSuccess: () => setEditing(false)`
- Cancel: `syncFromPersona()` then `setEditing(false)`
- `useEffect` keyed on `[persona?.id]` — correct, prevents clearing edits on TanStack Query refetch
- Dark mode, empty state handling, built-in badge all correct
- Build passes
- Verdict: **approved**

---

## 2026-03-30 — FX.PM3: Fix persona side panel read-only mode

**Task:** Panel opens in read-only mode by default, with explicit Edit button to switch to edit mode.

**Done:**
- Added `editing` state (default `false`), resets to `false` when `personaId` changes
- **Read-only mode**: Shows description as text, model as colored badge, system prompt rendered as markdown (scrollable, max-h 400px), MCP tools as secondary badges, SDK tools as outline badges, skills as badge pills, budget with dollar icon. All static display — no inputs.
- **Edit mode**: Name input, description textarea, avatar color/icon pickers, model selector cards, SystemPromptEditor (Write/Preview tabs), ToolConfiguration checkboxes, budget input. Save + Cancel buttons at bottom.
- **Header**: Shows "Edit" button in read-only mode. Save button removed from header (now at bottom of edit content). Close (X) always visible.
- **Save**: Calls `updateMutation.mutate()` with `onSuccess: () => setEditing(false)` — returns to read-only on save.
- **Cancel**: Calls `syncFromPersona()` to reset form state, then `setEditing(false)`.
- Added `MarkdownPreview` import for read-only system prompt rendering.
- Build passes

**Files modified:** `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`

**Notes:** The `useEffect` dependency changed from `[persona]` to `[persona?.id]` to prevent resetting form state on every TanStack Query refetch (which would clear in-progress edits).

---

## 2026-03-30 — Review: FX.P7 (approved)

**Reviewed:** Skills field added to persona schema.
- entities.ts: `skills: string[]` on Persona interface ✓
- api.ts: `skills?: string[]` on Create/Update requests ✓
- schema.ts: JSON text column with `default([])`, consistent with mcpTools pattern ✓
- personas.ts route: serialize, create, update all handle skills ✓
- execution-manager.ts + dashboard.ts: Persona construction includes skills ✓
- Default [] — no migration data issues ✓
- Build passes ✓
- Verdict: **approved**

---

## 2026-03-30 — FX.P7: Add skills field to persona schema

**Task:** Add `skills: string[]` to Persona entity, DB schema, and API contracts.

**Done:**
- **`packages/shared/src/entities.ts`**: Added `skills: string[]` to `Persona` interface (after `mcpTools`)
- **`packages/shared/src/api.ts`**: Added `skills?: string[]` to both `CreatePersonaRequest` and `UpdatePersonaRequest`
- **`packages/backend/src/db/schema.ts`**: Added `skills` column — `text("skills", { mode: "json" }).notNull().$type<string[]>().default([])`
- **`packages/backend/src/routes/personas.ts`**: Added `skills` to serialize, create, and update handlers
- **`packages/backend/src/agent/execution-manager.ts`**: Added `skills` to persona entity construction (line 282)
- **`packages/backend/src/routes/dashboard.ts`**: Added `skills` to serialized persona in active executions response
- **Migration**: Ran `pnpm --filter backend db:push` — schema changes applied
- Build passes (2 TS errors fixed — missing `skills` in Persona object literals)

**Files modified:** `packages/shared/src/entities.ts`, `packages/shared/src/api.ts`, `packages/backend/src/db/schema.ts`, `packages/backend/src/routes/personas.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/routes/dashboard.ts`

**Notes:** Default is `[]` so existing personas get empty skills arrays. No seed changes needed — skills are user-configured per-persona.

---

## 2026-03-30 — Review: FX.PM2 (approved)

**Reviewed:** Persona card expand → side detail panel.
- persona-list.tsx: expand/collapse fully removed, cards clickable with ring selection highlight ✓
- Hover actions use stopPropagation to prevent card selection ✓
- persona-detail-panel.tsx: full editing (identity, avatar, model, prompt, tools, budget), reuses SystemPromptEditor + ToolConfiguration ✓
- Built-in badge via `settings.isSystem`, panel stays open after save ✓
- persona-manager.tsx: split layout 45%/55%, animated transitions, PersonaEditor Sheet removed ✓
- Dark mode, responsive grid (lg:3 cols), proper overflow handling ✓
- Build passes, bundle slightly smaller ✓
- Verdict: **approved**

---

## 2026-03-30 — FX.PM2: Replace persona card expand with side panel

**Task:** Replace inline expand/collapse on persona cards with a click-to-open detail panel.

**Done:**
- **`persona-list.tsx`**: Removed expand/collapse (`isExpanded`, `onToggleExpand`, `expandedId`, `MarkdownPreview` import, `ChevronDown`, `DollarSign`, `Pencil` imports). Cards now clickable for selection (`isSelected` highlight with ring). Removed "View prompt" / "Collapse" button. Removed expanded prompt preview section (~60 lines). Added `selectedId` + `onSelect` props replacing `onEdit`. Cards show: avatar, name, built-in badge, model badge, description (2 lines), tool count. Hover actions: Duplicate + Delete (Edit removed — panel handles it).
- **`persona-detail-panel.tsx`** (new): Right-side panel showing all persona details with inline editing. Sections: Identity (name input, description textarea, avatar picker with color swatches + icon grid), Model (3 selectable cards), System Prompt (Write/Preview tabs via SystemPromptEditor), Tools (ToolConfiguration component), Budget (dollar input). Header: avatar, name, Built-in badge, Save + Close buttons. Scrollable content area with flex layout.
- **`persona-manager.tsx`** (page): Split layout — card grid on left (45% when panel open, 100% when closed), detail panel on right (55%) with border-l separator. Animated width transitions. Removed PersonaEditor Sheet import — panel replaces it entirely.
- Bundle size slightly decreased (1069KB vs 1076KB — unused Sheet/persona-editor no longer imported)
- Build passes

**Files created:** `packages/frontend/src/features/persona-manager/persona-detail-panel.tsx`
**Files modified:** `packages/frontend/src/features/persona-manager/persona-list.tsx`, `packages/frontend/src/pages/persona-manager.tsx`

**Notes:** The old `persona-editor.tsx` (Sheet) is still in the codebase but no longer imported by the page. It can be deleted in a cleanup pass. The detail panel reuses SystemPromptEditor and ToolConfiguration from the old editor.

---

## 2026-03-30 — Review: FX.P6 (approved)

**Reviewed:** SDK tool name verification and executor tool wiring fix.
- SDK expects short names (`'Bash'`, `'Read'`, `'Edit'`) — persona arrays already correct ✓
- Critical fix: `tools: []` → `persona.allowedTools` — agents now get SDK built-in tools ✓
- `ALLOWED_TOOLS` env: `options.tools` → `persona.mcpTools` — correct MCP tool names to MCP server ✓
- `router.ts` fallback: `allowedTools: []`, `mcpTools: ROUTER_MCP_TOOLS` with `post_comment` ✓
- SDK tool reference comment: 12 tools documented ✓
- `SpawnOptions.tools` comment clarified ✓
- Build passes ✓
- Verdict: **approved**

---

## 2026-03-30 — FX.P6: Verify SDK tool names and fix executor tool wiring

**Task:** Verify SDK tool name format, fix the executor to pass tools correctly, document available tools.

**Done:**
- **Verified SDK tool names**: The `@anthropic-ai/claude-agent-sdk` `tools` option expects short names (`['Bash', 'Read', 'Edit']`). Our persona `allowedTools` arrays already use the correct format. No renaming needed.
- **Critical bug fixed in `claude-executor.ts`**: SDK's `tools` was hardcoded to `[]` (disables ALL built-in tools). Changed to `persona.allowedTools` so agents actually have Read/Write/Bash/etc. available. This means agents were previously only able to use MCP tools, not SDK built-in tools like file editing.
- **Fixed MCP tools env var**: `ALLOWED_TOOLS` env passed to MCP server was `options.tools` (persona's SDK tool names) instead of `persona.mcpTools` (MCP tool names). Fixed to `persona.mcpTools.join(",")`.
- **Fixed `router.ts` fallback**: Same bug as seed.ts Router — MCP names in `allowedTools`, empty `mcpTools`. Fixed to `allowedTools: []`, `mcpTools: ["route_to_state", "list_items", "get_context", "post_comment"]`.
- **Added SDK tool reference comment**: Documented all available SDK tool names in `claude-executor.ts` (Read, Edit, Write, NotebookEdit, Glob, Grep, Bash, WebFetch, WebSearch, Agent, TodoWrite, AskUserQuestion).
- **Updated `SpawnOptions.tools` comment** to clarify it refers to SDK built-in tools.
- Build passes

**Files modified:** `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/agent/types.ts`, `packages/backend/src/agent/router.ts`

**Notes:** This was a significant functional bug — agents had zero built-in tools available due to `tools: []`. They could only use MCP server tools. Now personas get exactly the SDK tools listed in their `allowedTools` array.

---

## 2026-03-30 — Review: FX.P5 (approved)

**Reviewed:** Router persona audit and overhaul.
- allowedTools: `[]` correct — Router has no SDK tools ✓
- mcpTools: `["route_to_state", "list_items", "get_context", "post_comment"]` — all 4 valid MCP names, `post_comment` added ✓
- Critical bug fixed: allowedTools/mcpTools were swapped (MCP names in SDK field, empty MCP array) ✓
- systemPrompt: 5-step workflow, valid transitions map matching workflow.ts, per-state routing rules ✓
- Correctly deviated from task spec: follows real transition map (Planning → Ready, not Planning → Decomposition) ✓
- Anti-patterns: no code, no loops, no Done without approval ✓
- default-personas.ts updated in sync ✓
- Build passes ✓
- Verdict: **approved**

---

## 2026-03-30 — FX.P5: Audit and overhaul Router persona

**Task:** Fix allowedTools/mcpTools swap, overhaul systemPrompt for Router persona.

**Done:**
- **Critical bug: allowedTools/mcpTools were swapped.** Router had `allowedTools: ["list_items", "get_context", "route_to_state"]` (MCP names in SDK field) and `mcpTools: []` (empty). Fixed to `allowedTools: []` (Router needs no SDK tools) and `mcpTools: ["route_to_state", "list_items", "get_context", "post_comment"]`. Added `post_comment` so Router can explain its decisions.
- **systemPrompt**: Complete overhaul from ~18-line basic guidelines to comprehensive ~60-line prompt. Includes: full valid transitions map from workflow.ts, 5-step workflow (get_context → list_items if children → decide → post_comment → route_to_state), per-state routing rules based on actual transition map, critical rules (never same-state, never skip states, check execution outcome), anti-patterns (no code reading, no long comments, no loops).
- Key difference from task description: the task said "Planning → Decomposition" but the actual transition map has `Planning → [Ready, Blocked]` — Decomposition is reached from Ready. Prompt follows the real transition map.
- Updated both `seed.ts` and `default-personas.ts`
- Build passes

**Files modified:** `packages/backend/src/db/seed.ts`, `packages/backend/src/db/default-personas.ts`

**Notes:** The swapped allowedTools/mcpTools was likely a major contributor to the Router not functioning correctly — it had SDK tool filtering set to MCP tool names, and no MCP tools available at all.

---

## 2026-03-30 — Review: FX.P4 (approved)

**Reviewed:** Code Reviewer persona audit and overhaul.
- mcpTools: `route_to_state` removed, `get_context` + `list_items` added ✓
- allowedTools: `["Read", "Glob", "Grep", "Bash"]` verified valid SDK names ✓
- systemPrompt: 5-step workflow (gather context → read files → verify build → review checklist → post verdict) ✓
- Review checklist: 11 criteria (AC match, types, naming, dark mode, responsive, security, etc.) ✓
- Structured approve/reject formats with severity levels (HIGH/MEDIUM/LOW) ✓
- Anti-patterns: don't approve without reading, don't fix code yourself, don't use route_to_state ✓
- default-personas.ts updated in sync ✓
- Build passes ✓
- Verdict: **approved**

---

## 2026-03-30 — FX.P4: Audit and overhaul Code Reviewer persona

**Task:** Fix mcpTools, overhaul systemPrompt for Code Reviewer persona.

**Done:**
- **mcpTools**: Changed from `["post_comment", "request_review", "route_to_state"]` → `["post_comment", "get_context", "list_items", "request_review"]`. Removed `route_to_state` (Router's job), added `get_context` + `list_items`.
- **allowedTools**: Verified correct — `["Read", "Glob", "Grep", "Bash"]` are valid SDK names for a review role.
- **systemPrompt**: Complete overhaul from ~23-line basic checklist to comprehensive ~65-line prompt. 5-step workflow: gather context (get_context) → read every modified file → verify build (pnpm build) → review against detailed checklist (11 criteria including AC match, types, naming, dark mode, responsive, security) → post structured verdict. Includes: approve format (checklist + summary), reject format (severity-tagged issues with file:line + fix instructions), important rules (no state transitions, flag ambiguity via request_review), and anti-patterns (don't approve without reading files, don't reject for style not in conventions, don't fix code yourself).
- Updated both `seed.ts` and `default-personas.ts`
- Build passes

**Files modified:** `packages/backend/src/db/seed.ts`, `packages/backend/src/db/default-personas.ts`

**Notes:** Rejection format includes severity levels (HIGH/MEDIUM/LOW) so Engineers can prioritize fixes. Prompt explicitly states the Engineer has no memory — rejection feedback must be self-contained.

## 2026-03-30 — Review: FX.P3 (approved)

**Reviewed:** Engineer persona audit and overhaul.
- mcpTools: `route_to_state` removed, `get_context` added ✓
- allowedTools: Write + Edit both present, all 7 valid SDK names ✓
- systemPrompt: 4-step workflow (read → implement → verify build → post comment) ✓
- Rejection handling (address EVERY point), flag_blocked guidance, anti-patterns ✓
- Coding conventions embedded (TS strict, shadcn, Tailwind, dark mode, kebab-case) ✓
- default-personas.ts updated in sync ✓
- Build passes ✓
- Verdict: **approved**

---

## 2026-03-30 — FX.P3: Audit and overhaul Engineer persona

**Task:** Fix mcpTools, verify allowedTools, overhaul systemPrompt for Engineer persona.

**Done:**
- **mcpTools**: Changed from `["post_comment", "flag_blocked", "route_to_state"]` → `["post_comment", "flag_blocked", "get_context"]`. Removed `route_to_state` (Router's job), added `get_context`.
- **allowedTools**: Verified correct — `["Read", "Edit", "Write", "Glob", "Grep", "Bash", "WebFetch"]` with both Write and Edit present.
- **systemPrompt**: Complete overhaul to ~60-line prompt. 4-step workflow: read before writing (get_context, Glob/Grep, read files) → implement (TS strict, shadcn/ui, Tailwind, dark mode, named exports, kebab-case) → verify build (pnpm build mandatory) → post completion comment. Includes: rejection feedback handling (address EVERY point), when to use flag_blocked (dependency, unclear req, infra issue), anti-patterns (don't refactor, don't add features beyond scope, don't skip build).
- Updated both `seed.ts` and `default-personas.ts`
- Build passes

**Files modified:** `packages/backend/src/db/seed.ts`, `packages/backend/src/db/default-personas.ts`

**Notes:** Prompt mirrors the coding conventions from CLAUDE.md so the Engineer has them in-context even without reading the file. Rejection handling section ensures the review loop doesn't stall.

---

## 2026-03-30 — Review: FX.P2 (approved)

**Reviewed:** Tech Lead persona audit and overhaul.
- mcpTools: `request_review` removed, `get_context`/`list_items` added ✓
- allowedTools: verified valid SDK names ✓
- systemPrompt: 3-step workflow (read codebase → create_children → post rationale), granularity 2-8, skip-decomposition, anti-patterns ✓
- default-personas.ts updated in sync ✓
- Build passes ✓
- Verdict: **approved**

---

## 2026-03-30 — FX.P2: Audit and overhaul Tech Lead persona

**Task:** Fix mcpTools, overhaul systemPrompt for Tech Lead persona.

**Done:**
- **mcpTools**: Changed from `["create_children", "post_comment", "request_review"]` → `["create_children", "post_comment", "get_context", "list_items"]`. Removed `request_review` (not TL's job), added `get_context` + `list_items`.
- **allowedTools**: Verified correct — `["Read", "Glob", "Grep", "WebSearch", "Bash"]` are valid SDK names.
- **systemPrompt**: Complete overhaul from 18-line generic prompt to comprehensive ~55-line prompt. Covers: when TL runs (Decomposition state), 3-step workflow (read codebase → create_children → post architectural comment), granularity guidelines (2-8 children, one commit each, include file paths), when to skip decomposition, and explicit anti-patterns.
- Updated both `seed.ts` and `default-personas.ts`
- Build passes

**Files modified:** `packages/backend/src/db/seed.ts`, `packages/backend/src/db/default-personas.ts`

**Notes:** Prompt emphasizes reading the codebase BEFORE decomposing — this prevents the TL from guessing at file paths. The "skip decomposition" guidance handles small items that don't need breakdown.

---

## 2026-03-30 — Review: FX.P1 (approved)

**Reviewed:** Product Manager persona audit and overhaul.
- mcpTools: `route_to_state` removed, `list_items`/`get_context`/`request_review` added ✓
- allowedTools: `["Read", "Glob", "Grep", "WebSearch"]` valid SDK names ✓
- systemPrompt: comprehensive overhaul with workflow context, AC template, "done" criteria, anti-patterns ✓
- default-personas.ts updated in sync ✓
- Build passes ✓
- Verdict: **approved**

---

## 2026-03-30 — FX.P1: Audit and overhaul Product Manager persona

**Task:** Fix mcpTools, verify allowedTools, overhaul systemPrompt for PM persona.

**Done:**
- **mcpTools**: Changed from `["post_comment", "route_to_state"]` → `["post_comment", "list_items", "get_context", "request_review"]`. Removed `route_to_state` (Router's job), added `list_items` + `get_context` + `request_review` for PM's needs.
- **allowedTools**: Verified correct — `["Read", "Glob", "Grep", "WebSearch"]` are valid SDK tool names.
- **systemPrompt**: Complete overhaul from 17-line generic prompt to comprehensive ~50-line prompt covering: when PM runs (Planning state), what it receives, exact output format (acceptance criteria template with checkboxes, scope, priority, open questions), what "done" looks like, and explicit "what NOT to do" section (don't code, don't decompose, don't transition state, don't post multiple comments).
- Updated both `seed.ts` and `default-personas.ts`
- Build passes

**Files modified:** `packages/backend/src/db/seed.ts`, `packages/backend/src/db/default-personas.ts`

**Notes:** The prompt includes a concrete acceptance criteria template with markdown checkboxes. The "What NOT To Do" section explicitly addresses the routing loop issue — PM no longer has `route_to_state` and the prompt reinforces that transitions are the Router's job.

---

## 2026-03-30 — Review: FX.0 (approved)

**Reviewed:** MCP tool name mismatch fix in seed personas.
- seed.ts: PM, Engineer, Reviewer `transition_state` → `route_to_state`; TL `create_tasks` → `create_children` ✓
- default-personas.ts: Same 4 fixes ✓
- test/setup.ts: TL `create_tasks` → `create_children` ✓
- Zero remaining mismatches (grep verified) ✓
- MCP server audit: 7 tools confirmed in TOOL_NAMES ✓
- Build passes ✓
- Verdict: **approved**

---

## 2026-03-30 — FX.0: Fix MCP tool name mismatch in seed personas

**Task:** Fix `transition_state` → `route_to_state` and `create_tasks` → `create_children` mismatch.

**Done:**
- **seed.ts**: Fixed PM (`transition_state` → `route_to_state`), TL (`create_tasks` → `create_children`), Engineer (`transition_state` → `route_to_state`), Reviewer (`transition_state` → `route_to_state`)
- **default-personas.ts**: Same 4 fixes (PM, TL, Engineer, Reviewer)
- **test/setup.ts**: Fixed TL (`create_tasks` → `create_children`)
- **Audit of mcp-server.ts**: Confirmed 7 registered tools match `TOOL_NAMES` constant: `post_comment`, `create_children`, `route_to_state`, `list_items`, `get_context`, `flag_blocked`, `request_review`. The `allowedTools` field in `McpContext` is defined but not used for filtering within the MCP server itself — tools are gated by the `mcpTools` array on persona entities.
- Verified zero remaining `"transition_state"` or `"create_tasks"` references in backend
- Build passes

**Files modified:** `packages/backend/src/db/seed.ts`, `packages/backend/src/db/default-personas.ts`, `packages/backend/src/test/setup.ts`

**Notes:** The `seed-demo.ts` file already used the correct tool names. Router persona was also correct (uses `route_to_state` in `allowedTools` — slightly different pattern since Router uses SDK tools for MCP, but this is a separate concern for FX.P5).

---

## 2026-03-30 — Review: FX.PM1 (approved)

**Reviewed:** Inline system prompt preview on persona cards.
- "View prompt" button with chevron at card bottom ✓
- Expanded card spans full grid width (`col-span-full`), pushes cards below ✓
- System prompt rendered as markdown via exported `MarkdownPreview`, scrollable max-h 400px ✓
- MCP tools as secondary badges, SDK tools as outline badges, both font-mono ✓
- Model badge + budget with DollarSign icon in expanded view ✓
- Only one card expanded at a time (`expandedId` state) ✓
- Chevron rotates, text toggles "View prompt" / "Collapse" ✓
- `transition-all duration-200` on card and chevron ✓
- Skills list deferred to FX.P7 (field doesn't exist yet) ✓
- Build passes ✓
- Verdict: **approved**

---

## 2026-03-30 — FX.PM1: Add inline system prompt preview to persona cards

**Task:** Add expand/collapse interaction to persona cards showing system prompt and tool details.

**Done:**
- Exported `MarkdownPreview` from `system-prompt-editor.tsx` for reuse
- Added expand/collapse to `PersonaCard`: "View prompt" button with chevron at bottom of each card
- Expanded card spans full grid width (`col-span-full`), pushes cards below down
- Expanded view shows: system prompt rendered as markdown (scrollable, max-height 400px), MCP tools as secondary badges, SDK tools as outline badges, model badge, budget per run
- Only one card expanded at a time — expanding another collapses the current one (`expandedId` state)
- Chevron rotates 180deg when expanded, smooth `transition-all duration-200`
- Build passes

**Files modified:** `packages/frontend/src/features/persona-manager/persona-list.tsx`, `packages/frontend/src/features/persona-manager/system-prompt-editor.tsx`

**Notes:** Skills list not shown yet — `skills` field doesn't exist on Persona until FX.P7 adds it. Will be added when that task is done.

---

## 2026-03-30 — Review: FX.NAV1 (approved)

**Reviewed:** Sidebar nav layout and interaction states.
- Icon/label inline: `flex flex-row items-center`, icon `shrink-0 inline-flex`, label conditional render ✓
- Active state: `bg-accent/80 text-foreground font-semibold border-l-2 border-primary` — clearly distinguishable ✓
- Hover: `hover:bg-accent/80` visible background ✓
- `rounded-lg` softer corners ✓
- No layout shift: inactive items have `border-l-2 border-transparent` ✓
- Collapsed/expanded badges both work correctly ✓
- Build passes ✓
- Verdict: **approved**

---

## 2026-03-30 — FX.NAV1: Fix sidebar nav item layout and interaction states

**Task:** Fix icon/label stacking issue and improve hover/active states in sidebar.

**Done:**
- **Fixed icon/label stacking**: Replaced animated `w-0`/`w-auto` label wrapper (caused layout issues) with conditional render `{!sidebarCollapsed && ...}`. Added explicit `flex-row` and `shrink-0 inline-flex` on icon span.
- **Active state**: Added left border accent (`border-l-2 border-primary`), stronger background (`bg-accent/80`), `font-semibold`, `text-foreground` — active page clearly distinguishable at a glance
- **Hover state**: `hover:bg-accent/80` for visible hover background
- **Softer corners**: `rounded-lg` instead of `rounded-md`
- **No layout shift**: All items have `border-l-2 border-transparent` by default so the active border doesn't cause shift
- Build passes

**Files modified:** `packages/frontend/src/components/sidebar.tsx`

**Notes:** Root cause of stacking: the label wrapper used `w-0 opacity-0` / `w-auto opacity-100` with transition for collapse animation. This CSS approach allowed the label span to collapse to zero width while keeping it in the DOM, but it interfered with flex layout in some render states. Replaced with simple conditional rendering which is more robust.

---

## 2026-03-30 — Review: FX.FLOW1 (approved)

**Reviewed:** Flow view redesign as vertical state machine.
- Vertical column: 7 main states top-to-bottom with Router pills between each pair ✓
- State node cards: colored header, item count, active agents with pulse, persona avatars, progress bar ✓
- Blocked branches right with dashed connector and dashed red border ✓
- Old SVG `computeLayout`/`computeArrowPath` removed, replaced with pure flex CSS ✓
- Added `usePersonaAssignments` for assigned personas per state ✓
- Click state filters detail panel (existing behavior preserved) ✓
- Dark mode, centered, scrollable ✓
- Build passes ✓
- Verdict: **approved**

---

## 2026-03-30 — Review: FX.RST1 (approved)

**Reviewed:** Graceful restart flow with active agent modal.
- Backend `GET /api/service/status` returns active executions with persona name, work item title, elapsed time via join ✓
- Backend `POST /api/service/restart` with `?force=true` support, 409 on active agents, `process.exit(0)` for pm2 restart ✓
- Frontend checks status before restart, shows modal if agents active ✓
- Modal: agent list, 3s polling, auto-restart on completion, force restart with double-click confirm, cancel ✓
- API client exports correct, cleanup on unmount ✓
- Build passes ✓
- Verdict: **approved**

---

## 2026-03-30 — FX.FLOW1: Redesign Flow view as vertical state machine

**Task:** Replace horizontal BFS-layout SVG graph with clean vertical CSS layout.

**Done:**
- Replaced entire `flow-view.tsx` — removed `computeLayout`, `computeArrowPath`, SVG arrows, absolute positioning, ScrollArea horizontal scroll
- New vertical layout: state nodes flow top-to-bottom in workflow order (Backlog → Planning → Decomposition → Ready → In Progress → In Review → Done)
- **Router pills** between each state pair — small indigo pill with diamond icon + "Router" label
- **Down arrows** between nodes using CSS borders + SVG triangle
- **Blocked state** branches off to the right with dashed horizontal connector and dashed red border card
- Each state node card shows: colored header with state name + dot + item count badge, active agent count with pulse indicator, persona avatar stack (assigned personas from persona assignments, falls back to active), progress bar
- Added `usePersonaAssignments` hook to show who's assigned per state
- Filtered items panel moved to right sidebar (border-left separator) when state clicked
- Centered vertically scrollable layout, no horizontal scroll needed
- Build passes

**Files modified:** `packages/frontend/src/features/work-items/flow-view.tsx`

**Notes:** Removed ~140 lines of SVG arrow/layout computation. New layout is pure flex/grid CSS with Tailwind. Blocked branch position is computed from the middle of states that can transition to Blocked.

---

## 2026-03-30 — FX.RST1: Add graceful restart flow with active agent modal

**Task:** Add restart flow that checks for active agents before restarting the service.

**Done:**
- **Backend**: Added `getActiveExecutionIds()` to `concurrency.ts`, added `GET /api/service/status` route (returns active executions with persona name, work item title, elapsed time via join), added `POST /api/service/restart` with optional `?force=true` (returns 409 if agents active and not force, clears in-memory state, exits process for pm2 to restart)
- **Frontend API**: Added `getServiceStatus()` and `restartService(force?)` to `api/client.ts`, exported from `api/index.ts`
- **Frontend modal**: Rewrote `ServiceStatusSection` — "Restart Service" button now checks `/api/service/status` first. If agents active, opens Dialog with: agent list (persona name, work item title, elapsed time), auto-polling every 3s (auto-restarts when all finish), "Force Restart" button (red, requires double-click confirmation), "Cancel" button. If no agents: restarts immediately.
- Build passes

**Files modified:** `packages/backend/src/agent/concurrency.ts`, `packages/backend/src/routes/settings.ts`, `packages/frontend/src/api/client.ts`, `packages/frontend/src/api/index.ts`, `packages/frontend/src/features/settings/appearance-section.tsx`

**Notes:** Service status grid (uptime, memory, PID, etc.) is still mock data — will need pm2 integration later. The restart mechanism uses `process.exit(0)` with a 500ms delay for response flush, expecting pm2 to auto-restart.

---

## 2026-03-30 — Review: FX.SET3 (approved)

**Reviewed:** Play/pause button replacing auto-routing toggle across 3 locations.
- Settings → Workflow: large circular play/pause button with descriptive text + tooltip ✓
- Status bar: play/pause icon next to "AgentOps", toggles via PATCH mutation ✓
- Work Items header: pill badge "Auto"/"Manual" with tooltip ✓
- Consistent emerald (active) / amber (paused) color scheme across all 3 ✓
- All locations read from project settings, sync via TanStack Query ✓
- Dark mode variants present ✓
- Build passes ✓
- Verdict: **approved**

---

## 2026-03-30 — FX.SET3: Replace auto-routing toggle with play/pause button

**Task:** Replace ON/OFF toggle with play/pause metaphor across 3 locations.

**Done:**
- **Settings → Workflow:** Replaced toggle switch with large play/pause button (emerald/amber colors) + descriptive text + tooltip
- **Status bar:** Added play/pause icon button next to "AgentOps" with tooltip (Play green = active, Pause amber = paused). Clicking toggles autoRouting via PATCH
- **Work Items page header:** Added small pill badge next to "Work Items" title showing "Auto" (play, green) or "Manual" (pause, amber) with tooltip
- All 3 locations read autoRouting from project settings and stay in sync via TanStack Query
- Build passes

**Files modified:** `features/settings/workflow-config-section.tsx`, `components/status-bar.tsx`, `pages/work-items.tsx`

**Notes:** Play/pause metaphor: play = work flows automatically through pipeline, pause = manual control. All locations use consistent emerald (active) / amber (paused) color scheme. Tooltips explain the behavior.

---
