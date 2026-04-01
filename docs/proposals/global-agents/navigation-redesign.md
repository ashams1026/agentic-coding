# Proposal: Navigation Restructure for Project vs Global Scope

**Task:** RES.GLOBAL.NAV
**Date:** 2026-04-02
**Depends on:** RES.GLOBAL.DATA (data model proposal — approved)

## Problem

The current sidebar is a flat list of 6 links (Dashboard, Work Items, Agent Monitor, Activity Feed, Personas, Settings) with a project selector dropdown at the top. Every page implicitly operates under `selectedProjectId`. When global agents are introduced (agents that operate outside project context), the navigation needs to distinguish between project-scoped and global views without adding unnecessary complexity.

## Current State

### Sidebar Structure (`components/sidebar.tsx`)
```
[Project Selector dropdown]  ← Select from project list
─────────────────────────
Dashboard           ← filtered by selectedProjectId
Work Items          ← filtered by selectedProjectId
Agent Monitor       ← filtered by selectedProjectId
Activity Feed       ← filtered by selectedProjectId
Personas            ← already global (no projectId FK)
Settings            ← already global
─────────────────────────
[Theme] [Collapse]
```

- **Project selector** is a `<Select>` in the sidebar header. Auto-selects first project on load.
- **`selectedProjectId`** stored in Zustand (`ui-store.ts`), used by `useExecutions`, `useDashboardStats`, and all data hooks.
- **Routes** are flat: `/`, `/items`, `/agents`, `/activity`, `/personas`, `/settings`.
- **Command palette** mirrors the same 6 navigation items.
- **Pico chat** is a floating panel, sessions tied to `selectedProjectId`.

### What's Already Global
- **Personas** — no `projectId` FK in schema, page is `/personas`
- **Settings** — no project context needed
- **Pico** — floating panel, currently project-scoped but will support global sessions (per RES.GLOBAL.DATA)

### What's Currently Project-Scoped
- **Dashboard** — stats, cost summary, active agents for one project
- **Work Items** — kanban/list of items for one project
- **Agent Monitor** — executions for one project
- **Activity Feed** — events for one project

## Investigation

### 1. How Similar Tools Handle Project Scoping

**Linear** (closest analog — project management with automation)
- Workspace-level sidebar with collapsible teams
- Each team has: Issues, Cycles, Projects, Views
- "My Issues" and "Inbox" are global (cross-team)
- Switching teams doesn't change the URL scheme — uses filters
- **Pattern:** Global views at top, team/project sections are collapsible groups

**Jira** (enterprise project management)
- Project selector in header, flat nav per project
- "Your Work" and "Filters" are global/cross-project
- Dashboard is customizable — widgets can show cross-project data
- **Pattern:** Header-level project picker + global views alongside project views

**Notion** (workspace + pages)
- Sidebar shows all pages/databases in a tree
- Workspaces are top-level, pages are nested
- No strict project/global distinction — everything is a page
- **Pattern:** Single tree, no separate scoping mechanism

**VS Code** (multi-root workspaces)
- Explorer panel shows all workspace folders
- Each folder is a collapsible root
- Search, debugging, extensions are global
- **Pattern:** Some panels are per-folder, others span all folders

**GitHub** (repository-scoped with org-level views)
- Navigation changes completely between repo context and org/user context
- Repo: Code, Issues, PRs, Actions, Settings
- User/Org: Dashboard (cross-repo feed), Repositories list, Projects (cross-repo boards)
- **Pattern:** Separate navigation contexts with breadcrumb-level context switching

### Summary of Patterns

| Pattern | Tools | Pros | Cons |
|---|---|---|---|
| **A: Collapsible project sections in sidebar** | Linear, VS Code | Clear hierarchy, multiple projects visible | Complex with many projects, deep nesting |
| **B: Header project picker + global top-level** | Jira, current AgentOps | Simple, familiar | Global views feel disconnected from projects |
| **C: Separate navigation contexts** | GitHub | Clean separation | Disorienting context switch |
| **D: Flat nav with scope filter** | Linear (filters) | Minimal UI change | Scope is implicit, easy to forget |

### 2. Dashboard and Activity Feed — Per-Project, Global, or Both?

**Dashboard:**
- Currently shows: active agents count, pending proposals, cost summary, recent activity — all for one project.
- With global agents: a global dashboard should show cross-project stats (total cost, total active agents) plus global agent activity.
- **Recommendation:** Dashboard becomes scope-aware.
  - When a project is selected: shows that project's stats (current behavior).
  - When "All Projects" / global scope: shows aggregated stats + global agent executions.
  - The project selector gains an "All Projects" option — this is the simplest change.

**Activity Feed:**
- Currently shows events for `selectedProjectId`.
- With global agents: needs a scope filter.
- **Recommendation:** Activity Feed gains a filter pill bar: "All" | "Project: X" | "Global Only".
  - Default is "All" when in global scope, "Project: X" when project is selected.
  - Each event shows a scope badge ("Project: AgentOps" or "Global").

### 3. How the Project Selector Interacts with Navigation

**Current:** The `<Select>` dropdown in the sidebar header controls `selectedProjectId`, which implicitly filters all views.

**Options:**

**Option A: Keep selector, add "All Projects" option** (Recommended)
- Add an "All Projects" item to the `<Select>` dropdown (sets `selectedProjectId = null`).
- When "All Projects" is selected, project-scoped pages show aggregated data.
- The 6 navigation links stay the same — their content adapts based on scope.
- Minimal UI change, no new navigation structure needed.

**Option B: Replace selector with collapsible project sections**
- Sidebar becomes a tree: Global section at top, then each project as a collapsible group.
- Each project group has: Work Items, Agents, Activity sub-links.
- Global section has: Dashboard (aggregated), Personas, Settings.
- **Problem:** With 5+ projects, the sidebar becomes very tall. Collapsed state (icon-only) can't show tree structure. Requires significant redesign of sidebar, routing, and URL scheme.

**Option C: Two-level navigation**
- First level: "Global" or a specific project (like a workspace switcher).
- Second level: the 6 page links, contextualized to the selection.
- Similar to Jira's model but with a more explicit scope indicator.
- **Problem:** Still functionally identical to Option A but with more UI complexity.

**Verdict: Option A** — it requires the least change, maintains the familiar sidebar, and scales well. The project selector dropdown already exists; we just add "All Projects" and handle `null` in the data hooks.

### 4. UX for "No Projects Yet" and Single-Project Users

**No projects yet (new user):**
- Project selector shows "No projects" (already handled).
- All pages show empty states with "Create your first project" CTA.
- Global features (Personas, Settings, Pico in global mode) are fully functional.
- Dashboard shows a welcome/setup wizard.
- **No change needed for navigation** — the empty state UX is per-page, not per-sidebar.

**Single-project user:**
- Project is auto-selected (already happens in sidebar: `useEffect` auto-selects first project).
- The "All Projects" option in the dropdown is available but not promoted.
- The experience is identical to today — flat nav, one project, everything works.
- **No unnecessary hierarchy imposed.** The sidebar doesn't change shape based on project count.

**Multi-project user:**
- Project selector becomes the primary way to switch context.
- "All Projects" option enables cross-project views.
- Dashboard in "All Projects" mode shows summary cards per project + global agents.
- **Optional enhancement:** Recently used projects pinned at top of selector.

## Recommended Navigation Tree

### Phase 1: Minimal Changes (with Global Agents)

```
[Project Selector]            ← Dropdown: "All Projects" | "Project A" | "Project B" | ...
  ↳ Shows "(Global)" or "Project: X" badge below
──────────────────────────
Dashboard                     ← Scope-aware: aggregated or per-project
Work Items                    ← Hidden when scope is "All Projects" (items are always project-scoped)
Agent Monitor                 ← Shows all executions when global, filtered when project-scoped
Activity Feed                 ← Filter pills: All | Project | Global Only
Personas                      ← Always global (no change)
Settings                      ← Always global (no change)
──────────────────────────
[Theme] [Collapse]
```

**Key behavior changes:**

1. **Project selector gains "All Projects" option** — sets `selectedProjectId = null`
2. **Work Items link** hides or shows "Select a project" prompt when `selectedProjectId = null` (work items are always project-scoped per RES.GLOBAL.DATA)
3. **Agent Monitor** in global scope shows all executions (project + global) with scope badges
4. **Dashboard** in global scope shows aggregated stats + per-project summary cards
5. **Activity Feed** in global scope defaults to "All" events with scope filter pills

### Phase 2: Enhanced Navigation (Optional Future)

If project count grows beyond ~5, consider:

```
[Scope Switcher]              ← Replaces simple dropdown
  ↳ Search box for projects
  ↳ Pinned/favorited projects
  ↳ "All Projects" always at top
  ↳ "Create Project" at bottom
──────────────────────────
Dashboard
Work Items                    ← (when project selected)
Agent Monitor
Activity Feed
──────────────────────────
Chat                          ← Full-page agent chat (see RES.CHAT.UX)
Personas
Schedules                     ← (see RES.SCHED.UX)
──────────────────────────
Settings
──────────────────────────
[Theme] [Collapse]
```

This adds new top-level links as features ship (Chat, Schedules) but doesn't fundamentally change the navigation model.

## Wireframe Descriptions

### Wireframe A: Global Scope Selected (Dashboard)

```
┌──────────────────────────────────────────────────────────┐
│ [📁 All Projects  ▼]                                     │
│ ──────────────────                                       │
│ ● Dashboard         ← active                            │
│   Work Items        ← dimmed (no project context)        │
│   Agent Monitor                                          │
│   Activity Feed                                          │
│   Personas                                               │
│   Settings                                               │
│ ──────────────────                                       │
│ [☀] [◀]                                                 │
│                                                          │
│         ┌─────────────────────────────────────┐          │
│         │  Dashboard — All Projects           │          │
│         │                                     │          │
│         │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │          │
│         │  │ 12  │ │ 3   │ │$4.2 │ │ 2   │  │          │
│         │  │total│ │activ│ │cost │ │glob │  │          │
│         │  │agent│ │now  │ │today│ │agent│  │          │
│         │  └─────┘ └─────┘ └─────┘ └─────┘  │          │
│         │                                     │          │
│         │  Per-Project Summary                │          │
│         │  ┌──────────────────────────────┐   │          │
│         │  │ AgentOps  │ 5 items │ $2.10  │   │          │
│         │  │ WebApp    │ 3 items │ $1.40  │   │          │
│         │  │ DataPipe  │ 4 items │ $0.70  │   │          │
│         │  └──────────────────────────────┘   │          │
│         │                                     │          │
│         │  Global Agent Activity              │          │
│         │  ┌──────────────────────────────┐   │          │
│         │  │ ● Nightly Reviewer  running  │   │          │
│         │  │ ✓ System Auditor   done 2m   │   │          │
│         │  └──────────────────────────────┘   │          │
│         └─────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────┘
```

### Wireframe B: Project Selected (Work Items)

```
┌──────────────────────────────────────────────────────────┐
│ [📁 AgentOps  ▼]                                         │
│ ──────────────────                                       │
│   Dashboard                                              │
│ ● Work Items        ← active                            │
│   Agent Monitor                                          │
│   Activity Feed                                          │
│   Personas                                               │
│   Settings                                               │
│ ──────────────────                                       │
│ [☀] [◀]                                                 │
│                                                          │
│         ┌─────────────────────────────────────┐          │
│         │  Work Items — AgentOps              │          │
│         │  [List ▼] [+ New Item]              │          │
│         │                                     │          │
│         │  (normal work items view)           │          │
│         └─────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────┘
```

### Wireframe C: Work Items in Global Scope

```
┌──────────────────────────────────────────────────────────┐
│ [📁 All Projects  ▼]                                     │
│ ──────────────────                                       │
│   Dashboard                                              │
│ ● Work Items        ← active, shows context prompt       │
│   Agent Monitor                                          │
│   ...                                                    │
│                                                          │
│         ┌─────────────────────────────────────┐          │
│         │  Work Items                         │          │
│         │                                     │          │
│         │    ┌─────────────────────────┐      │          │
│         │    │ Select a project to     │      │          │
│         │    │ view its work items.    │      │          │
│         │    │                         │      │          │
│         │    │ [AgentOps] [WebApp]     │      │          │
│         │    │ [DataPipe]              │      │          │
│         │    └─────────────────────────┘      │          │
│         └─────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────┘
```

### Wireframe D: Agent Monitor in Global Scope

```
┌──────────────────────────────────────────────────────────┐
│ [📁 All Projects  ▼]                                     │
│ ──────────────────                                       │
│   Dashboard                                              │
│   Work Items                                             │
│ ● Agent Monitor     ← active                            │
│   ...                                                    │
│                                                          │
│         ┌─────────────────────────────────────┐          │
│         │  Agent Monitor — All                │          │
│         │  [All ▼] scope filter               │          │
│         │                                     │          │
│         │  ┌──────────────────────────────┐   │          │
│         │  │ ● Engineer    AgentOps  run  │   │          │
│         │  │ ● Reviewer    WebApp    run  │   │          │
│         │  │ ● Auditor     Global    run  │   │          │
│         │  │ ✓ PM          AgentOps  done │   │          │
│         │  └──────────────────────────────┘   │          │
│         │                                     │          │
│         │  Each row shows scope badge:        │          │
│         │  "AgentOps" or "Global"             │          │
│         └─────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────┘
```

## Implementation Impact

### Files to Change

**Sidebar:**
- `packages/frontend/src/components/sidebar.tsx` — Add "All Projects" option to project selector. Dim/annotate Work Items link when no project selected. Add scope indicator text below selector.

**UI Store:**
- `packages/frontend/src/stores/ui-store.ts` — `selectedProjectId: null` now explicitly means "global/all projects" rather than "no selection".

**Data Hooks:**
- `packages/frontend/src/hooks/*.ts` — All hooks that take `projectId` parameter need to handle `null` (fetch all / global). Most already accept `undefined` — need to distinguish between "no selection" (undefined) and "all projects" (null/explicit).

**Pages:**
- `packages/frontend/src/pages/dashboard.tsx` — Add aggregated view when no project selected.
- `packages/frontend/src/pages/work-items.tsx` — Show "select a project" prompt when global scope.
- `packages/frontend/src/pages/agent-monitor.tsx` — Show scope badges, pass no filter when global.
- `packages/frontend/src/pages/activity-feed.tsx` — Add scope filter pills.

**Command Palette:**
- `packages/frontend/src/features/command-palette/command-palette.tsx` — Add project switching commands ("Switch to AgentOps", "Switch to All Projects").

**Pico:**
- `packages/frontend/src/features/pico/chat-panel.tsx` — Sessions adapt to current scope. When global, creates global sessions. When project-scoped, creates project sessions. Show scope indicator in chat header.

### URL Scheme

No changes needed. Routes stay flat (`/`, `/items`, `/agents`, `/activity`, `/personas`, `/settings`). The project scope is controlled by UI state (Zustand store), not URL parameters. This keeps URLs simple and avoids breaking changes.

**Alternative considered:** URL-based scoping (`/projects/:id/items` vs `/global/agents`). Rejected because:
- Requires router restructure with nested routes
- Breaks all existing bookmarks
- Over-engineering for a local-first app where the user is the only one with URLs
- Zustand + query parameter approach is simpler and already working

### Migration Path

1. **Phase 1:** Add "All Projects" to selector. Dashboard and Agent Monitor handle null projectId (aggregated view). Work Items shows prompt. Activity Feed gets filter pills.
2. **Phase 2:** Pico scope toggle. Global agent executions appear in Agent Monitor with badges. Command palette gains scope-switching commands.
3. **Phase 3 (with RES.GLOBAL.UX):** Full global agent chat, scheduling UI, global workflows visible in navigation.

## Decision Summary

| Decision | Choice | Rationale |
|---|---|---|
| Navigation model | Option A: Keep flat nav + enhanced selector | Least disruption, scales to 10+ projects, familiar UX |
| Dashboard scope | Scope-aware (aggregated vs per-project) | Users need both cross-project overview and per-project detail |
| Work Items scope | Project-only (prompt when global) | Work items are inherently project-scoped (per data model) |
| Agent Monitor scope | Scope-aware with badges | Global agents appear here; users need to see all activity |
| Activity Feed scope | Filter pills (All / Project / Global) | Most flexible; users can narrow or broaden as needed |
| URL scheme | No change (state-based scoping) | Simple, no breaking changes, appropriate for local-first app |
| Single-project UX | Unchanged (auto-select, no hierarchy) | Don't add complexity for the common case |
