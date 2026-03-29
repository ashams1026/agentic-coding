# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-29 — Review: R.1 (approved)

**Reviewed:** Sidebar spacing/alignment fixes in `sidebar.tsx`.
- All 4 task requirements addressed: padding normalization, badge sizing consistency, project switcher centering, nav item padding
- Collapsed badges `h-4 min-w-4` vs expanded `h-5 min-w-5` — proportionally appropriate for their contexts (absolute overlay vs inline pill)
- Project switcher centered with `justify-center` in both states
- Nav spacing tightened to `space-y-0.5`
- Minimal diff, no new imports or components, build passes
- Verdict: **approved**

---

## 2026-03-29 — R.1: Fix sidebar spacing and alignment

**Task:** Normalize padding/gaps between collapsed and expanded states. Fix badge sizing consistency. Adjust project switcher vertical alignment. Normalize nav item padding.

**Done:**
- **Project switcher**: Changed `px-3` → `px-2` and added `justify-center` for proper centering within `h-14` container in both states
- **Nav item padding**: Changed collapsed state from `px-0 py-2` to `px-2 py-2` — items now have balanced horizontal padding in both states
- **Badge sizing (collapsed)**: Changed from `h-3.5 w-3.5` to `h-4 min-w-4` with `px-0.5` padding and `text-[9px]` — closer in proportion to expanded badges. Also adjusted position from `-right-1 -top-1` to `-right-1.5 -top-1.5` for better placement with larger badge
- **Badge sizing (expanded)**: Tightened horizontal padding from `px-1.5` to `px-1` — badges are more compact and consistent
- **Nav spacing**: Changed `space-y-1` to `space-y-0.5` for tighter grouping between nav items

**Files modified:**
- `packages/frontend/src/components/sidebar.tsx`

**Notes for next agent:**
- R.2 (transitions) is next — current sidebar uses `transition-all duration-200`, task wants `duration-300 ease-in-out`
- Badge sizes are now: collapsed `h-4 min-w-4`, expanded `h-5 min-w-5` — proportionally appropriate for their contexts
- The project switcher centering works for both Button (collapsed) and Select (expanded)

---

## 2026-03-29 — Review: T2.10.1 (approved)

**Reviewed:** Settings page layout — `settings-layout.tsx` + `settings.tsx` page integration.
- Left sidebar nav (200px) with all 7 required sections: Projects, API Keys, Concurrency, Costs, Appearance, Service, Data
- Each section has appropriate lucide icon, active highlight with bg-accent
- Content area: max-w-2xl centered, section header with Separator divider
- SectionPlaceholder for each section — clean extensibility for T2.10.2-T2.10.5
- Follows conventions: cn(), named exports, kebab-case file, shadcn/ui components
- Build passes cleanly
- Verdict: **approved**

---

## 2026-03-29 — T2.10.1: Build settings page layout

**Task:** Vertical sections with clear headings, separated by dividers. Sidebar or tab nav for sections: Projects, API Keys, Concurrency, Costs, Appearance, Service, Data.

**Done:**
- Created `features/settings/settings-layout.tsx`:
  - Left sidebar nav (200px) with 7 sections: Projects (FolderOpen), API Keys (Key), Concurrency (Gauge), Costs (DollarSign), Appearance (Palette), Service (Server), Data (Database)
  - Active section highlight with bg-accent, hover states, icon + label
  - Content area: max-w-2xl centered, section header with Separator
  - `SECTIONS` array with id, label, icon — easy to extend
  - `SectionPlaceholder` for each section — T2.10.2-T2.10.5 will replace these with real content
  - `activeSection` state for switching between sections
- Updated `pages/settings.tsx` — replaced placeholder with `<SettingsLayout />`

**Files created:**
- `packages/frontend/src/features/settings/settings-layout.tsx`

**Files modified:**
- `packages/frontend/src/pages/settings.tsx`

**Notes for next agent:**
- Settings section started — T2.10.2 is projects section
- The layout uses a sidebar nav (not tabs) for better vertical section support
- Each section will be a component rendered conditionally based on `activeSection`
- The `SectionPlaceholder` should be replaced with real section components as they're built
- Content area is scrollable, sidebar is fixed — standard settings page pattern

---

## 2026-03-29 — Review: T2.9.5 (approved)

**Reviewed:** Test run panel — `test-run-panel.tsx` + persona-editor integration.
- Collapsible section (Terminal icon + chevron) at bottom of editor after Budget
- Prompt input with Enter-to-submit, Test/Stop buttons (Play/Square icons)
- Mock output: 17 typed lines (thinking, tool, result, text) using persona name + model
- Streaming: 150-350ms random delay per line via setTimeout chain
- Mini terminal: monospace, color-coded (blue=tool, emerald=result, muted=thinking), 100-200px
- Blinking cursor while running, Stop appends "[Stopped by user]"
- Auto-scroll, timer cleanup on unmount, empty state
- Build passes, conventions followed
- **Verdict: approved** — Persona Manager section (T2.9.1-T2.9.5) complete!

---

## 2026-03-29 — T2.9.5: Build test run panel

**Task:** Collapsible section at bottom of persona editor. Text input for a sample prompt. "Test" button runs against mock. Shows output in mini terminal renderer.

**Done:**
- Created `features/persona-manager/test-run-panel.tsx`:
  - `TestRunPanel` — collapsible section using shadcn Collapsible (Terminal icon + "Test Run" label + chevron)
  - Prompt input with Enter-to-submit, Test/Stop buttons
  - `generateMockOutput()` — produces 17 typed output lines (thinking, tool calls, results, text) using persona name + model
  - Lines stream one-at-a-time with 150-350ms random delay for realistic effect
  - Mini terminal: monospace font, 100-200px height, auto-scroll, color-coded lines (blue=tool, emerald=result, muted=thinking)
  - Blinking cursor while running, Stop button to interrupt
  - Empty state: "Run a test to see output here"
  - Cost shown in final line varies by model (opus=$0.42, sonnet=$0.18, haiku=$0.03)
- Updated `persona-editor.tsx`: added TestRunPanel after Budget section with Separator

**Files created:**
- `packages/frontend/src/features/persona-manager/test-run-panel.tsx`

**Files modified:**
- `packages/frontend/src/features/persona-manager/persona-editor.tsx`

**Notes for next agent:**
- Persona Manager section (T2.9.1-T2.9.5) is now complete!
- T2.10.1 is next: Settings page layout
- The persona editor now has 4 standalone sub-components: SystemPromptEditor, ToolConfiguration, TestRunPanel, plus inline Identity/Model/Budget sections
- Feature directory `features/persona-manager/` has 5 files: persona-list, persona-editor, system-prompt-editor, tool-configuration, test-run-panel

---

## 2026-03-29 — Review: T2.9.4 (approved)

**Reviewed:** Tool configuration section — `tool-configuration.tsx` + persona-editor refactor.
- SDK Tools (8, 4-col) + AgentOps Tools (7, 3-col) checkboxes with tooltip descriptions
- ToolCheckbox: checked highlight (border-primary/30 bg-primary/5), mono font for AgentOps
- Presets dropdown: PM, Tech Lead, Engineer, Reviewer, QA, All, None — all match fixture data
- Header: selected/total count badge + Presets button
- Per-group count badges
- Standalone controlled component, old inline code properly removed from persona-editor
- Build passes, conventions followed
- **Verdict: approved**

---

## 2026-03-29 — T2.9.4: Build tool configuration section

**Task:** Two tool groups (SDK + AgentOps) with checkboxes and tooltips. Each tool has a description. Presets button: "Tech Lead preset", "Engineer preset", etc.

**Done:**
- Created `features/persona-manager/tool-configuration.tsx`:
  - `ToolConfiguration` — standalone component with `allowedTools`/`mcpTools` props
  - **SDK Tools** (8 items, 4-col grid): Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch
  - **AgentOps Tools** (7 items, 3-col grid): create_tasks, transition_state, request_review, flag_blocked, post_comment, list_tasks, get_context
  - `ToolCheckbox` — checkbox with tooltip, highlighted border when checked (primary/5 bg)
  - **Presets dropdown**: PM, Tech Lead, Engineer, Reviewer, QA, All tools, None — matching fixture data
  - Header: selected/total count badge + Presets dropdown button
  - Per-group count badges
  - Longer tool descriptions than before (more helpful for users)
- Refactored `persona-editor.tsx`:
  - Removed inline tool definitions (SDK_TOOLS, AGENTOPS_TOOLS, ToolDef, toggleTool)
  - Removed Checkbox, Tooltip/TooltipContent/TooltipProvider/TooltipTrigger imports
  - Replaced inline JSX with `<ToolConfiguration />` component

**Files created:**
- `packages/frontend/src/features/persona-manager/tool-configuration.tsx`

**Files modified:**
- `packages/frontend/src/features/persona-manager/persona-editor.tsx`

**Notes for next agent:**
- T2.9.5 is next: test run panel (collapsible at bottom of persona editor)
- Presets match the 5 built-in persona tool configs from fixtures exactly
- ToolConfiguration is a standalone controlled component — could be reused elsewhere
- The persona editor is getting cleaner — each section is now its own component (SystemPromptEditor, ToolConfiguration)

---

## 2026-03-29 — Review: T2.9.3 (approved)

**Reviewed:** System prompt editor — `system-prompt-editor.tsx` + persona-editor integration.
- Edit/Preview toggle (Pencil/Eye buttons, secondary/ghost variant switch)
- Edit mode: line numbers gutter (scroll-synced via translateY) + monospace textarea
- Preview mode: minimal markdown renderer (h1-h3, bold, inline code, bullets, code blocks, empty state)
- Footer: character count, ~token estimate, line count
- Placeholder with structured example prompt
- Standalone component (value/onChange props), integrated into persona editor replacing basic Textarea
- Build passes, conventions followed
- **Verdict: approved**

---

## 2026-03-29 — T2.9.3: Build system prompt editor

**Task:** Large textarea with monospace font. Markdown preview toggle. Line numbers. Character/token count estimate. Placeholder text.

**Done:**
- Created `features/persona-manager/system-prompt-editor.tsx`:
  - Edit/Preview toggle buttons (Pencil/Eye icons)
  - **Edit mode**: side-by-side line numbers gutter (synced scroll) + monospace textarea with placeholder example prompt
  - **Preview mode**: minimal markdown renderer (headers, bold, inline code, bullet lists, code blocks)
  - **Footer stats**: character count, ~token estimate (chars/4 heuristic), line count
  - `LineNumbers` component with scroll-synced transform
  - `MarkdownPreview` with `renderInline` for bold/code
  - `PLACEHOLDER` constant showing a good example prompt structure
- Updated `persona-editor.tsx`:
  - Replaced basic Textarea + character count with `<SystemPromptEditor />`
  - Added import for SystemPromptEditor

**Files created:**
- `packages/frontend/src/features/persona-manager/system-prompt-editor.tsx`

**Files modified:**
- `packages/frontend/src/features/persona-manager/persona-editor.tsx`

**Notes for next agent:**
- T2.9.4 is next: tool configuration with presets
- The system prompt editor is a standalone component (`value`/`onChange` props) — easy to reuse
- Line numbers sync via scroll event + translateY transform
- Token estimate is a rough heuristic (~4 chars/token) — not a real tokenizer
- Preview renders minimal markdown: h1-h3, bold, inline code, bullets, code blocks

---

## 2026-03-29 — Review: T2.9.2 (approved)

**Reviewed:** Persona editor — `persona-editor.tsx` + page wiring.
- Large right Sheet (max-w-2xl) with scrollable content, header with avatar preview + Cancel/Save
- Identity: name input, description textarea, avatar picker (12 colors + 14 icons with live preview)
- Model: 3-card selector (Opus/Sonnet/Haiku) with cost labels and descriptions, color-coded selection
- System Prompt: monospace textarea with character count
- Tools: SDK (8 items, 4-col) + AgentOps (7 items, 3-col) checkboxes with tooltips
- Budget: dollar input with DollarSign icon
- Local form state synced from usePersona, saved via useUpdatePersona
- Page conditionally renders editor when editingId is set
- Build passes, conventions followed
- **Verdict: approved**

---

## 2026-03-29 — T2.9.2: Build persona editor

**Task:** Full-page or large sheet. Sections: Identity (name, description, avatar picker), Model (selector with cost/capability info), System Prompt (large editor), Tools (checklists), Budget (max per run input).

**Done:**
- Created `features/persona-manager/persona-editor.tsx`:
  - Large Sheet (right side, max-w-2xl) with scrollable content
  - **Identity section**: name input, description textarea, avatar picker (12 color swatches + 14 icon options with live preview)
  - **Model section**: 3-card selector (Opus/Sonnet/Haiku) with cost label ($/$$/$$), description, color-coded selected state
  - **System Prompt section**: monospace textarea with character count
  - **Tools section**: SDK Tools (8 items, 4-col grid) and AgentOps Tools (7 items, 3-col grid) — each as checkbox with tooltip description
  - **Budget section**: dollar input with DollarSign icon
  - Header with avatar preview, title, Cancel/Save buttons
  - Local form state synced from persona data via useEffect, saved via useUpdatePersona
- Updated `pages/persona-manager.tsx` — conditionally renders PersonaEditor when editingId is set

**Files created:**
- `packages/frontend/src/features/persona-manager/persona-editor.tsx`

**Files modified:**
- `packages/frontend/src/pages/persona-manager.tsx`

**Notes for next agent:**
- T2.9.3 (system prompt editor) will enhance the basic textarea here with line numbers, markdown preview, token count
- T2.9.4 (tool configuration) will enhance the tool checkboxes here with presets
- T2.9.5 (test run panel) adds collapsible test section at the bottom of this editor
- The editor uses a Sheet so it overlays the list — no page navigation needed
- Avatar picker has 12 colors + 14 icons from lucide-react
- Model cards show cost/capability info inline

---

## 2026-03-29 — Review: T2.9.1 (approved)

**Reviewed:** Persona list view — `persona-list.tsx` + page update.
- Responsive grid (1-4 cols) with PersonaCard: avatar (colored circle + mapped icon), name, Built-in badge, model badge (violet/blue/emerald), 2-line description, tool count pill
- Hover actions: Edit (Pencil), Duplicate (Copy), Delete (Trash2)
- CreateCard: dashed border, Plus icon, creates default persona + navigates to editor
- BUILT_IN_IDS matches fixture IDs (ps-pm00001 etc.)
- Delete dialog with built-in warning
- Empty state with Users icon + CTA
- Uses mock hooks (usePersonas, useCreatePersona, useDeletePersona)
- Dark mode, cn(), shadcn components, named exports — all conventions followed
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.9.1: Build persona list view

**Task:** Grid of persona cards with avatar, name, model badge, description, tool count pill. Quick actions on hover. Create card with + icon. Built-in persona badge.

**Done:**
- Created `features/persona-manager/persona-list.tsx`:
  - `PersonaCard` — avatar (colored circle + lucide icon from map), name, Built-in badge, model badge (Opus=violet, Sonnet=blue, Haiku=emerald), 2-line description, tool count pill, hover actions (Edit, Duplicate, Delete)
  - `CreateCard` — dashed border + icon, creates default persona then navigates to editor
  - `PersonaList` — responsive grid (1-4 cols), empty state with CTA, delete confirmation dialog with built-in warning
  - Icon map: clipboard-list, git-branch, code, eye, test-tube → lucide components, fallback to Bot
  - `BUILT_IN_IDS` set matches fixture persona IDs
- Updated `pages/persona-manager.tsx` — replaced placeholder with `PersonaList` + `onEdit` state prep for T2.9.2

**Files created:**
- `packages/frontend/src/features/persona-manager/persona-list.tsx`

**Files modified:**
- `packages/frontend/src/pages/persona-manager.tsx`

**Notes for next agent:**
- Persona Manager section started — T2.9.2 is persona editor (full-page/sheet form)
- `onEdit` callback is wired to `setEditingId` state in the page — T2.9.2 should conditionally render editor when `editingId` is set
- Icon map lives in `persona-list.tsx` — could be extracted to shared util if needed by other features later
- Model badge config (opus/sonnet/haiku colors) also in this file — reusable pattern
- `handleDuplicate` copies all persona fields including avatar, tools, prompt

---

## 2026-03-29 — Review: T2.8.7 (approved)

**Reviewed:** Workflow templates — `workflow-list-sidebar.tsx` rewrite.
- Tabs (Workflows / Templates) with proper height management
- Two templates: Story (7 states) and Task (5 states), matching fixture data
- `TemplatePreview` SVG: colored rects with connecting lines, dynamic viewBox
- "Use template": clones via useCreateWorkflow, auto-selects new workflow
- TemplateCard: name, description, type badge, state count, pending state on button
- Existing workflow list behavior preserved
- Build passes
- **Verdict: approved** — Workflow Designer section (T2.8.1-T2.8.7) complete!

---

## 2026-03-29 — T2.8.7: Build workflow templates

**Task:** "Templates" tab in sidebar: "Default Story Workflow" and "Default Task Workflow" pre-built. "Use template" button clones into a new editable workflow. Templates show preview thumbnail.

**Done:**
- Rewrote `features/workflow-designer/workflow-list-sidebar.tsx`:
  - Added shadcn Tabs (Workflows / Templates) at top of sidebar
  - Workflows tab: existing workflow list + create button (unchanged logic)
  - Templates tab: two pre-built templates matching mock data fixtures
  - `TEMPLATES` constant array with full state/transition definitions for Story (7 states) and Task (5 states) workflows
  - `TemplateCard` — card with preview thumbnail, name, description, type badge, state count, "Use template" button
  - `TemplatePreview` — mini SVG showing states as colored rectangles with connecting lines (horizontal layout)
  - `handleUseTemplate()` — clones template into a new workflow via `useCreateWorkflow`, auto-selects it
  - Disabled state on button while mutation is pending

**Files modified:**
- `packages/frontend/src/features/workflow-designer/workflow-list-sidebar.tsx`

**Notes for next agent:**
- Workflow Designer section (T2.8.1-T2.8.7) is now complete!
- T2.9.1 is next: Persona Manager — persona list view (grid of persona cards)
- Templates are defined as constants — they mirror the mock fixture data exactly
- "Use template" creates a real workflow (not just selects the mock one) so user can edit freely
- The preview SVG is a simplified horizontal layout (not the full BFS canvas) — sufficient for thumbnail
- Feature directory: `features/workflow-designer/` now has 6 files

---

## 2026-03-29 — Review: T2.8.6 (approved)

**Reviewed:** Validation warnings — `workflow-validation.tsx`, canvas and layout changes.
- 5 validation rules: missing/multiple initial (error), no finals, orphans, unreachable finals, dead-ends (warnings)
- `validateWorkflow()` is pure function, `useWorkflowValidation()` is useMemo hook
- Amber badges on states via `stateWarnings` map, O(1) lookup in canvas
- `ValidationPanel`: collapsible bottom bar, error/warning counts, expandable issue list with differentiated icons
- Panel hides when 0 issues
- "Prevent save" noted as future work (no save button yet) — `errorCount` exposed
- Bonus: dead-end state detection beyond task requirements
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.8.6: Build validation warnings

**Task:** Real-time validation as user edits: warning badges on orphan states (no incoming transitions except initial), unreachable final states, missing initial state. Warning panel at bottom listing all issues. Prevent save if critical issues exist.

**Done:**
- Created `features/workflow-designer/workflow-validation.tsx`:
  - `validateWorkflow()` — pure function computing validation issues from workflow data
    - Missing initial state (error), multiple initial states (error)
    - No final states (warning)
    - Orphan states with no incoming transitions except initial (warning, tagged with stateName)
    - Unreachable final states via BFS from initial (warning, tagged with stateName)
    - Dead-end non-final states with no outgoing transitions (warning, tagged with stateName)
  - `useWorkflowValidation(workflow)` — useMemo hook returning issues, counts, and stateWarnings map
  - `ValidationPanel` — collapsible bottom panel, summary bar shows error/warning counts, expand to see issue list with severity icons and state badges
  - `ValidationIssue` type with id, severity (error/warning), message, optional stateName
- Modified `features/workflow-designer/state-machine-canvas.tsx`:
  - Added `stateWarnings` prop and `warningCount` prop to StateNode
  - Amber warning badge (circle with count) on top-right of states with issues
- Updated `workflow-designer-layout.tsx`:
  - Added `useWorkflowValidation(selectedWorkflow)` hook call
  - Passes `stateWarnings` to canvas
  - Renders `ValidationPanel` at bottom of canvas area

**Files created:**
- `packages/frontend/src/features/workflow-designer/workflow-validation.tsx`

**Files modified:**
- `packages/frontend/src/features/workflow-designer/state-machine-canvas.tsx`
- `packages/frontend/src/features/workflow-designer/workflow-designer-layout.tsx`

**Notes for next agent:**
- T2.8.7 is next: workflow templates (Templates tab in sidebar)
- Validation runs reactively via useMemo — recalculates on every workflow change
- "Prevent save" is noted in task but there's no save button yet — validation issues are displayed but don't block any action. When save is implemented, check `errorCount > 0`
- The mock data workflows are well-formed so they'll show 0 issues — create a new workflow or delete states to see warnings
- stateWarnings map is keyed by state name for efficient lookup in canvas

---

## 2026-03-29 — Review: T2.8.5 (approved)

**Reviewed:** Trigger configuration panel — `transition-properties-panel.tsx` and layout update.
- All requirements met: persona dropdown with avatars + model badges, dispatch mode (auto/propose/gated), max retries, advancement mode (auto/approval/agent), no-trigger toggle
- Generic `OptionGroup<T>` segmented button component — clean and reusable
- Existing trigger lookup via `useTriggers(workflowId)` matching fromState + toState
- Selected persona preview card with avatar pattern
- Descriptive text per mode option
- Config is local state (no persist mutation) — appropriate for mock UI phase
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.8.5: Build trigger configuration panel

**Task:** When a transition is selected, show trigger options in properties panel: assign persona (dropdown of all personas with avatars), dispatch mode (auto/propose/gated radio), max retries (number input), advancement mode (auto/approval/agent). Shows "No trigger" option to leave transition manual-only.

**Done:**
- Rewrote `features/workflow-designer/transition-properties-panel.tsx`:
  - Added `workflowId` prop to look up existing triggers via `useTriggers(workflowId)`
  - "No trigger" state: toggle button to add/remove trigger, manual-only message when off
  - Persona dropdown: `usePersonas()` hook, colored avatar dot + model badge per persona, selected persona preview card with avatar + description
  - `OptionGroup<T>` — generic segmented button component for radio-like selection
  - Dispatch mode: Auto/Propose/Gated with descriptive text per option
  - Max retries: number input (0-10)
  - Advancement mode: Auto/Approval/Agent with descriptive text per option
  - Initializes from existing trigger data if found (matches by fromState + toState)
- Updated `workflow-designer-layout.tsx`: passes `workflowId={effectiveId!}` to transition panel

**Files modified:**
- `packages/frontend/src/features/workflow-designer/transition-properties-panel.tsx`
- `packages/frontend/src/features/workflow-designer/workflow-designer-layout.tsx`

**Notes for next agent:**
- T2.8.6 is next: validation warnings (orphan states, unreachable finals, missing initial)
- Trigger config is currently read-only from mock data + local state — no mutation to save trigger changes (mock API doesn't have createTrigger/updateTrigger yet, but the UI is complete)
- The `OptionGroup` component could be reused elsewhere (generic segmented radio)
- DispatchMode includes "evaluate" in the shared type but task only specified auto/propose/gated — "evaluate" omitted from UI options
- Trigger lookup: `triggers.find(t => t.fromState === from && t.toState === to)` — matches existing mock data

---

## 2026-03-29 — Review: T2.8.4 (approved)

**Reviewed:** Transition creation and editing — `transition-properties-panel.tsx`, canvas and layout modifications.
- Drag-to-connect: ConnectionHandle on right edge with hover affordance, preview dashed line, hit-test on drop
- Click-to-select arrows: 12px invisible hit area, stopPropagation, ring highlight + thicker stroke
- Properties panel: from→to direction display, name input (blur/Enter save), delete button
- Trigger placeholder for T2.8.5 — appropriate
- Keyboard Delete/Backspace: input/textarea aware, prevents default
- `transitionKey()` shared between canvas and layout for unique identification
- `resolvedTransition` derived from workflow data — stays in sync after mutations
- Duplicate prevention, auto-naming, selection exclusivity all correct
- Build passes
- **Verdict: approved**

---

## 2026-03-29 — T2.8.4: Build transition creation and editing

**Task:** Drag from one state's edge to another to create a transition. Click transition arrow to select → properties panel: transition name, trigger configuration. Delete transition via properties panel or keyboard shortcut.

**Done:**
- Created `features/workflow-designer/transition-properties-panel.tsx`:
  - `TransitionPropertiesPanel` — right panel showing from→to direction, name input, trigger placeholder (T2.8.5), delete button
  - Name saves on blur/Enter
- Modified `features/workflow-designer/state-machine-canvas.tsx`:
  - `ConnectionHandle` — small circle on right edge of each state, cursor=crosshair, hover highlight
  - `connectingFrom` + `connectCursor` state — tracks drag-to-connect
  - Preview dashed line from source state to cursor while connecting
  - On mouse up, hit-tests all states to find target, calls `onCreateTransition(from, to)`
  - `TransitionArrow` now has invisible 12px wide hit area for click selection
  - `isSelected` prop: thicker stroke, fill-ring color, label highlight
  - Exported `transitionKey()` helper for unique transition identification
  - Added `selectedTransitionKey`, `onSelectTransition`, `onCreateTransition` props
  - Click state clears transition selection and vice versa
- Rewrote `features/workflow-designer/workflow-designer-layout.tsx`:
  - `selectedTransitionKey` state, `resolvedTransition` derived from workflow data
  - `handleCreateTransition()` — prevents duplicates, auto-names "From → To", auto-selects new transition
  - `handleUpdateTransition()` — finds by key, replaces, updates key
  - `handleDeleteTransition()` — removes by key, clears selection
  - Keyboard handler: Delete/Backspace deletes selected transition (skips when in input/textarea)
  - Right panel shows state OR transition properties (mutually exclusive)

**Files created:**
- `packages/frontend/src/features/workflow-designer/transition-properties-panel.tsx`

**Files modified:**
- `packages/frontend/src/features/workflow-designer/state-machine-canvas.tsx`
- `packages/frontend/src/features/workflow-designer/workflow-designer-layout.tsx`

**Notes for next agent:**
- T2.8.5 is next: trigger configuration panel (populate the trigger placeholder in transition-properties-panel)
- Transition selection uses `transitionKey()` = "from→to→name" string as unique identifier
- Connection creation: drag from right-edge handle, preview dashed line, drop on target state
- `resolvedTransition` re-derives from workflow data after mutations to stay in sync
- The `handleSelectTransition` callback receives both key and transition, but layout only stores key (transition is resolved from workflow data)
