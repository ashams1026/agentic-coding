# Frontend

The AgentOps frontend is a React single-page application built with Vite, Tailwind CSS v4, and shadcn/ui. It runs on port 5173 in development and communicates with the Fastify backend on port 3001.

## Directory Structure

```
packages/frontend/src/
  main.tsx              # Entry point — mounts React app
  app.tsx               # App root — providers (QueryClient, RouterProvider, TooltipProvider)
  router.tsx            # Route definitions — project-scoped routes under /p/:projectId
  index.css             # Tailwind config, theme tokens, typography scale, dark mode, density overrides
  api/                  # API layer
    index.ts            # Re-exports all API functions
    client.ts           # HTTP client (fetch wrapper with error handling)
    ws-client.ts        # WebSocket client connection + event listeners
    ws.ts               # WebSocket event subscription helpers
  features/             # Feature modules (collocated components)
    work-items/         # List view, flow view + detail panel + filter bar
    dashboard/          # Stats cards, cost chart, activity feed, upcoming work
    agent-monitor/      # Terminal renderer, split view, history, file changes, MCP status, model switcher
    agent-manager/      # Agent cards, editor, prompt preview, skill/subagent browser
    settings/           # Agent config, security, costs, workflow, appearance, data management
    activity-feed/      # Chronological event stream with Router decision cards
    pico/               # Floating chat bubble, chat panel, message components
    chat/               # Rich message rendering components
      thinking-block.tsx   # Collapsible thinking block with markdown
      tool-call-card.tsx   # Tool call display with status badges
      terminal-block.tsx   # Terminal output with ANSI color support
      diff-block.tsx       # Side-by-side diff viewer
      file-tree-summary.tsx # Changed-files tree summary
    common/             # Shared feature components (detail panels, etc.)
    command-palette/    # Global command palette (Cmd+K)
    toasts/             # Toast notification system
    demo/               # Demo mode controls
  pages/                # Route-level page components
    dashboard.tsx       # Dashboard page (/ route)
    work-items.tsx      # Work items page (/p/:projectId/items)
    agent-monitor.tsx   # Agent monitor page (/p/:projectId/monitor)
    activity-feed.tsx   # Activity feed page (/p/:projectId/activity)
    agent-builder.tsx   # Agent builder page (/p/:projectId/agents)
    app-settings.tsx    # App settings page (/app-settings) — API keys, appearance, service, data
    project-settings.tsx # Project settings page (/p/:projectId/settings) — security, costs, notifications, integrations
    workflows.tsx       # Workflows page (/p/:projectId/automations)
    analytics.tsx       # Analytics page (/p/:projectId/analytics)
    chat.tsx            # Chat page (/p/:projectId/chat)
  components/           # Shared UI components
    sidebar.tsx         # App sidebar with project tree navigation
    status-bar.tsx      # Bottom status bar (active agents, cost, WebSocket status)
    ui/                 # shadcn/ui primitives (18 components)
  hooks/                # TanStack Query hooks wrapping the API layer
    index.ts            # Barrel export
    query-keys.ts       # Query key factory
    use-projects.ts     # Project CRUD hooks
    use-work-items.ts   # Work item + edge CRUD hooks
    use-agents.ts       # Agent CRUD hooks
    use-agent-assignments.ts    # Assignment hooks
    use-comments.ts     # Comment hooks
    use-executions.ts   # Execution hooks
    use-proposals.ts    # Proposal hooks
    use-dashboard.ts    # Dashboard aggregate hooks
    use-project-from-url.ts # Project context from URL (/p/:projectId) — replaces useSelectedProject for page components
    use-selected-project.ts # Legacy: selected project from Zustand store (used by non-routed components)
    use-theme.ts        # Theme + density sync to DOM
    use-ws-sync.ts      # WebSocket → query cache invalidation
    use-demo.ts         # Demo mode hook
  stores/               # Zustand stores for UI state
    ui-store.ts         # Sidebar, theme, apiMode, density
    work-items-store.ts # View mode, filters, sort, selected item, panel width
    toast-store.ts      # Toast notification queue
    activity-store.ts   # Activity feed filter state
  layouts/
    root-layout.tsx     # Root layout with sidebar, mobile nav, status bar
    project-layout.tsx  # Project context wrapper (/p/:projectId) — loading spinner, 404 state
  lib/
    utils.ts            # cn() utility for class merging
    ansi-parser.tsx     # ANSI escape sequence → React elements
    diff-parser.ts      # Myers' diff algorithm for line-by-line diffs
```

## Routes

Routes use a project-scoped URL structure: `/p/:projectId/:page`. Top-level routes operate outside project context.

### Top-level routes (no project context)

| Path | Page | Description |
|---|---|---|
| `/` | Dashboard | Stats cards, cost chart, active agents, recent activity |
| `/app-settings` | App Settings | API keys, appearance, service, data management |

### Project-scoped routes (`/p/:projectId/...`)

| Path | Page | Description |
|---|---|---|
| `/p/:projectId/items` | Work Items | List view with detail panel |
| `/p/:projectId/automations` | Workflows | Workflow builder and management |
| `/p/:projectId/agents` | Agent Builder | Agent cards, editor, tool config |
| `/p/:projectId/monitor` | Agent Monitor | Live terminal output, split view, execution history |
| `/p/:projectId/activity` | Activity Feed | Chronological event stream |
| `/p/:projectId/analytics` | Analytics | Token usage, cost breakdowns |
| `/p/:projectId/chat` | Chat | Pico chat interface |
| `/p/:projectId/settings` | Project Settings | Security, costs, notifications, integrations |

### Legacy redirects

Old flat routes redirect to their project-scoped equivalents under `/p/pj-global/...`:

| Old Path | Redirects To |
|---|---|
| `/items` | `/p/pj-global/items` |
| `/agents` | `/p/pj-global/monitor` |
| `/activity` | `/p/pj-global/activity` |
| `/settings` | `/app-settings` |

### Layout hierarchy

All routes are wrapped in `RootLayout` which provides the sidebar, mobile navigation, and status bar. Project-scoped routes are additionally wrapped in `ProjectLayout` which reads the `:projectId` URL parameter and provides loading/404 states.

```
RootLayout (sidebar, status bar, command palette, toasts, Pico)
  ├── DashboardPage                     (/)
  ├── AppSettingsPage                   (/app-settings)
  └── ProjectLayout                     (/p/:projectId)
       ├── WorkItemsPage               (/p/:projectId/items)
       ├── WorkflowsPage               (/p/:projectId/automations)
       ├── AgentBuilderPage             (/p/:projectId/agents)
       ├── AgentMonitorPage             (/p/:projectId/monitor)
       ├── ActivityFeedPage             (/p/:projectId/activity)
       ├── AnalyticsPage                (/p/:projectId/analytics)
       ├── ChatPage                     (/p/:projectId/chat)
       └── ProjectSettingsPage          (/p/:projectId/settings)
```

## Sidebar Navigation

The sidebar uses a **project tree** model instead of a flat link list. It has three sections:

1. **Top-level links** — Dashboard (`/`) and App Settings (`/app-settings`), always visible.
2. **Projects section** — Each project is a collapsible tree node. Expanding a project reveals its child page links (Work Items, Automations, Agents, Monitor, Activity, Analytics, Chat, Project Settings). The Global Workspace (`pj-global`) is always listed first, followed by other projects alphabetically.
3. **Footer** — Theme toggle, notifications bell, sidebar collapse/expand.

The sidebar auto-expands the project matching the current URL. Expand/collapse state is persisted to localStorage. A "New Project" button and an "Expand/Collapse All" toggle are available in the projects section header.

In collapsed mode, the sidebar shows icon-only tooltips for Dashboard and App Settings, plus badge indicators for pending proposals, active agents, and unread activity.

## Project Context

Project-scoped pages get their project context from the URL, not from a global store.

**`useProjectFromUrl()`** — The primary hook for project context. Reads `:projectId` from the URL (`/p/:projectId/...`) and fetches the project. Returns `{ projectId, project, isGlobal, isLoading }`. When on a non-project page (Dashboard, App Settings), returns `null` values.

**`useSelectedProject()`** — Legacy hook that reads `selectedProjectId` from the Zustand store. Still used by some non-routed components (e.g., status bar, dashboard widgets). Defaults to the global project (`pj-global`) when nothing is selected.

**`ProjectLayout`** — Route wrapper at `/p/:projectId`. Renders a loading spinner while the project is being fetched, and a 404 state if the project ID doesn't exist. On success, renders child routes via `<Outlet />`.

### Settings Split

Settings are split into two separate pages:

| Page | Route | Sections |
|---|---|---|
| **App Settings** | `/app-settings` | API Keys & Executor Mode, Appearance, Service, Data Management |
| **Project Settings** | `/p/:projectId/settings` | Security, Costs & Limits, Notifications, Integrations |

App Settings controls global application configuration. Project Settings controls per-project configuration and requires a project context.

## Feature Directory Pattern

Each feature module in `features/` contains **collocated components and hooks** — everything needed for that feature lives together:

```
features/work-items/
  board-view.tsx      # Kanban board with drag-and-drop columns
  list-view.tsx       # Tabular list with sorting and inline editing
  flow-view.tsx       # Dependency graph visualization
  detail-panel.tsx    # Side panel showing full work item details
  filter-bar.tsx      # Search, agent filter, label filter, sort controls
```

```
features/agent-monitor/
  agent-monitor-layout.tsx  # Page layout with sidebar + content
  split-view.tsx            # Multi-agent split terminal view
  terminal-renderer.tsx     # Terminal-like output renderer
  active-agent-sidebar.tsx  # Sidebar listing active agent sessions
  agent-control-bar.tsx     # Play/pause/stop controls
  agent-history.tsx         # Past execution history
  tool-call-display.tsx     # Formatted tool call/result display
```

This pattern keeps imports short and features self-contained. Pages are thin wrappers that compose feature components.

## Views

### Work Items Page

The work items page (`/p/:projectId/items`) shows a single list view:

**List View** — Tabular layout with sortable columns (title, state, priority, agent, updated). Supports inline state transitions, search filtering, agent/label filtering, and click-to-select for the detail panel.

> **Note:** The flow/kanban board view for work items has been removed. The Work Items page now shows list view only.

The filter bar and detail panel are shared across all views. The selected item is persisted in the `work-items-store` Zustand store.

### Detail Panel

A resizable side panel that appears when a work item is selected. Shows:
- Work item title, state badge, priority
- Description (markdown)
- Child work items (expandable tree)
- Execution timeline (history of agent runs)
- Comment stream (agent, user, and system comments)
- Proposals (pending/approved/rejected)
- State transition dropdown (valid next states only)

The panel width is persisted in the work-items store.

### Agent Monitor — Streaming & Observability

The agent monitor (`/p/:projectId/monitor`) provides real-time visibility into agent executions via several streaming and observability features:

**Live Token Streaming** — When `includePartialMessages` is enabled, the terminal renderer receives individual tokens via `agent_output_chunk` WebSocket events. Small text chunks (<50 chars) are batched using `requestAnimationFrame` and appended to the current message bubble (not creating new bubbles per token). A blinking emerald cursor (`animate-pulse`) appears during active streaming and disappears after 500ms of inactivity.

**Progress Summary Bar** — AI-generated progress descriptions arrive via `agent_progress` WebSocket events (~every 30s for long-running agents). Displayed as an emerald bar below the toolbar with a pulsing dot: "Currently: analyzing test coverage..." Clears when execution completes.

**Rate Limit Display** — When the API returns a rate limit (`SDKAPIRetryMessage`), an inline text message appears in the terminal output: "Rate limited — retrying in Xs (attempt N/M)". Not persisted to execution logs.

**Context Usage Bar** — A color-coded fill bar in the toolbar showing context window usage percentage. Polled every 60s via `getContextUsage()` on the query object. Colors: green (<60%), amber (60-80%), red (>80%). Tooltip shows total/max token counts.

**WebSocket Event Types for Observability:**

| Event | Source | Purpose |
|---|---|---|
| `agent_output_chunk` | Partial tokens, complete chunks | Terminal renderer display |
| `agent_progress` | SDK task progress (~30s) | Progress summary bar |
| `context_usage` | 60s polling via `getContextUsage()` | Context usage bar |
| `file_changed` | FileChanged hook | File changes panel |
| `subagent_started` / `subagent_completed` | SubagentStart/Stop hooks | Nested subagent cards |

### Pico — Prompt Suggestions

When `promptSuggestions: true` is set in Pico's `query()` options, the SDK generates predicted follow-up prompts after each response. These arrive as `suggestion` SSE events from `POST /api/chat/sessions/:id/messages`.

The `usePicoChat` hook collects up to 3 suggestions in state (`setSuggestions`), cleared when a new message is sent. The chat panel renders them as rounded pill buttons between the ScrollArea and input area:
- Buttons use `rounded-full border-primary/30 text-primary` styling
- Click sends the suggestion text as the next message
- Hidden during streaming (`!isStreaming`)
- Truncated at 200px max width

### Chat — Rich Message Components

Sprint 31 added specialized rendering components for AI chat messages. These live in `features/chat/` and are consumed by the `ContentBlockRenderer` in `features/pico/chat-message.tsx`.

#### Content Block Dispatch

`ContentBlockRenderer` receives a content block and a `compact` flag (for the mini panel), then dispatches to the appropriate component:

| Block type | Full view component | Compact variant |
|---|---|---|
| `text` | `PicoMarkdown` | `PicoMarkdown` |
| `thinking` | `EnhancedThinkingBlock` (from `thinking-block.tsx`) | `CompactThinking` (inline label) |
| `tool_use` | `EnhancedToolCallCard` (from `tool-call-card.tsx`) | `CompactToolCall` (inline icon + name) |

When an assistant message contains 2+ Edit/Write tool calls, a `FileTreeSummary` is rendered at the top of the message before the individual content blocks.

#### Components

| Component | File | Description |
|---|---|---|
| `ThinkingBlock` | `features/chat/thinking-block.tsx` | Collapsible thinking block with purple left accent. Renders markdown (headings, code blocks, bold, inline code, links). Truncates at 2,000 characters with a "Show more" toggle. |
| `ToolCallCard` | `features/chat/tool-call-card.tsx` | Displays a tool call with an icon (mapped per tool name), auto-generated description (file basename or command preview), status badge (Running/Success/Error), and collapsible input/output sections. Edit, Write, and Bash tools expand by default. |
| `TerminalBlock` | `features/chat/terminal-block.tsx` | Dark terminal aesthetic (`bg-zinc-900`) for Bash command output. Shows the command in a header bar, renders ANSI color codes via `parseAnsi()`, provides copy-to-clipboard (stripped of ANSI), exit code indicator, and truncates at 500 lines with expand toggle. |
| `DiffBlock` | `features/chat/diff-block.tsx` | File diff viewer for Edit/Write results. Shows filename, +/- line count summary, and a table with old/new line numbers, colored add/remove/context rows. Uses `computeDiff()` from `diff-parser.ts`. Copy button exports unified diff text. |
| `FileTreeSummary` | `features/chat/file-tree-summary.tsx` | Collapsible directory tree of files changed by Edit/Write tool calls. Shows M (edit, amber) / A (write, emerald) indicators with +/- line stats. Collapses single-child directory chains (e.g., `src/features/chat`). Clicking a file scrolls to its `ToolCallCard`. Only renders when 2+ file-modifying tool calls exist. |

#### Utility Libraries

| Export | File | Description |
|---|---|---|
| `parseAnsi(text)` | `lib/ansi-parser.tsx` | Converts ANSI escape sequences (SGR codes) to React `<span>` elements with Tailwind color classes. Supports standard colors (30-37), bright colors (90-97), 256-color mode (`38;5;N`), bold, dim, and italic. Returns plain string when no codes are present. |
| `stripAnsi(text)` | `lib/ansi-parser.tsx` | Removes all ANSI escape sequences, returning plain text. Used for copy-to-clipboard. |
| `computeDiff(old, new)` | `lib/diff-parser.ts` | Pure TypeScript implementation of Myers' O(ND) diff algorithm. Returns `DiffResult` with typed lines (`add`/`remove`/`context`), line numbers, and aggregate counts. |
| `formatDiffText(result)` | `lib/diff-parser.ts` | Formats a `DiffResult` as a unified-diff-style string (`+ added`, `- removed`, `  context`) for clipboard export. |

### Agent Monitor — Model Switching

The `ModelSwitcher` component in the agent monitor header provides runtime model switching for long-running executions:

- **Running executions:** Shows a compact Select dropdown with available models from `GET /api/executions/:id/models`
- **Completed executions:** Falls back to a static Badge with the model name
- **Confirmation dialog:** AlertDialog asks "Switch from X to Y? This may increase costs." before calling `POST /api/executions/:id/model`
- **Badge updates** immediately after successful switch

### In-Process MCP Server

The agentops MCP server can run in-process using the SDK's `createSdkMcpServer()` function, eliminating child process overhead:

- **In-process (`agentops-inprocess`):** Tools registered via `tool()` helper, runs in same Node.js process. Lower latency, shared memory, easier debugging.
- **Child-process (`agentops`):** Original stdio transport. Full 8-tool set as fallback.

Both servers are configured in parallel in the `mcpServers` query option. Tools in the in-process server take priority; remaining tools fall back to the child process.

## API Layer

The frontend communicates with the backend via HTTP REST and WebSocket. All API functions are in `api/client.ts` and re-exported from `api/index.ts`. TanStack Query hooks in `hooks/` wrap these functions.

> **Note:** The mock data layer was removed in Sprint 17 (FX.MOCK1/MOCK2). The frontend always communicates with the real backend. Use `pnpm db:seed-demo` to populate demo data.

## State Management

### TanStack Query — Server State

All data from the backend is managed by TanStack Query. Hooks in `hooks/` wrap the API layer:

```typescript
// hooks/use-work-items.ts
export function useWorkItems(params?) {
  return useQuery({
    queryKey: queryKeys.workItems.list(params),
    queryFn: () => getWorkItems(params),
  });
}
```

**Key patterns:**
- **Query keys** defined in `hooks/query-keys.ts` as a hierarchical factory
- **Mutations** use `useMutation` with `onSuccess` callbacks that invalidate related queries
- **WebSocket sync**: `hooks/use-ws-sync.ts` listens for WS events and invalidates the relevant query keys, triggering automatic re-fetches

### Zustand — UI State

Client-only UI state is managed by Zustand stores, persisted to localStorage:

**`ui-store.ts`:**

| State | Type | Default | Description |
|---|---|---|---|
| `sidebarCollapsed` | `boolean` | `false` | Sidebar collapsed state |
| `mobileSidebarOpen` | `boolean` | `false` | Mobile sidebar drawer state |
| `selectedProjectId` | `string \| null` | `null` | Legacy — used by non-routed components. Page components use `useProjectFromUrl()` instead. |
| `theme` | `"light" \| "dark" \| "system"` | `"system"` | Color theme |
| `density` | `"comfortable" \| "compact"` | `"comfortable"` | UI density |

Persisted fields: `sidebarCollapsed`, `selectedProjectId`, `theme`, `density`.

**`work-items-store.ts`:** Search query, sort direction, filter agents, filter labels, selected item ID, detail panel width.

**`toast-store.ts`:** Toast notification queue with auto-dismiss.

**`activity-store.ts`:** Activity feed filter state.

## Design System

### Color Tokens

Defined in `index.css` via Tailwind v4 `@theme` blocks:

**Agent colors** (used for avatar backgrounds and badges):

| Token | Color | Agent |
|---|---|---|
| `--color-agent-pm` | `#7c3aed` (purple) | Product Manager |
| `--color-agent-tech-lead` | `#2563eb` (blue) | Tech Lead |
| `--color-agent-engineer` | `#059669` (green) | Engineer |
| `--color-agent-reviewer` | `#d97706` (amber) | Code Reviewer |
| `--color-agent-qa` | `#dc2626` (red) | QA |

**Status colors:**

| Token | Color | Status |
|---|---|---|
| `--color-status-pending` | `#94a3b8` (slate) | Pending |
| `--color-status-in-progress` | `#2563eb` (blue) | In Progress |
| `--color-status-running` | `#059669` (green) | Running |
| `--color-status-success` | `#16a34a` (green) | Success |
| `--color-status-failure` | `#dc2626` (red) | Failure |
| `--color-status-rejected` | `#d97706` (amber) | Rejected |
| `--color-status-blocked` | `#ea580c` (orange) | Blocked |

**Priority colors:**

| Token | Color | Priority |
|---|---|---|
| `--color-priority-p0` | `#dc2626` (red) | Critical |
| `--color-priority-p1` | `#ea580c` (orange) | High |
| `--color-priority-p2` | `#ca8a04` (yellow) | Medium |
| `--color-priority-p3` | `#94a3b8` (slate) | Low |

**shadcn/ui semantic colors:** `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring` — each with light and dark mode values.

### Typography Scale

Custom Tailwind utilities defined in `index.css`:

| Utility | Size | Weight | Usage |
|---|---|---|---|
| `text-page-title` | `text-2xl` (24px) | Bold (700) | Page headings |
| `text-section-title` | `text-lg` (18px) | Semibold (600) | Section headers, card titles |
| `text-body` | `text-sm` (14px) | Normal | Default body copy |
| `text-label` | `text-xs` (12px) | Medium (500) | Form labels, badges, metadata |
| `text-caption` | `text-xs` (12px) | Normal + muted | Timestamps, counts, secondary info |

Standard Tailwind sizes (`text-2xl`, `text-lg`, `text-sm`, `text-xs`) are used directly. Arbitrary pixel sizes (`text-[10px]`) are not allowed.

### Component Library

18 shadcn/ui components in `components/ui/`:

| Component | File |
|---|---|
| AlertDialog | `alert-dialog.tsx` |
| Badge | `badge.tsx` |
| Button | `button.tsx` |
| Card | `card.tsx` |
| Checkbox | `checkbox.tsx` |
| Collapsible | `collapsible.tsx` |
| Dialog | `dialog.tsx` |
| DropdownMenu | `dropdown-menu.tsx` |
| Input | `input.tsx` |
| ScrollArea | `scroll-area.tsx` |
| Select | `select.tsx` |
| Separator | `separator.tsx` |
| Sheet | `sheet.tsx` |
| Skeleton | `skeleton.tsx` |
| Table | `table.tsx` |
| Tabs | `tabs.tsx` |
| Textarea | `textarea.tsx` |
| Tooltip | `tooltip.tsx` |

All components are Tailwind-native (copy-paste from shadcn/ui, not a dependency). Dark mode is supported out of the box via the `.dark` class on `<html>`.

### Dark Mode

Theme is controlled by the `theme` field in `ui-store.ts`:
- `"light"` — forces light mode
- `"dark"` — forces dark mode (`.dark` class on `<html>`)
- `"system"` — follows OS preference via `prefers-color-scheme`

The `useThemeSync` hook in `use-theme.ts` syncs the theme and density settings to the DOM on every change.

### Density

Two density modes controlled by `data-density` attribute on `<html>`:
- **Comfortable** (default) — standard spacing
- **Compact** — reduced padding, smaller text, tighter gaps (CSS overrides in `index.css`)

## Source Files

| File | Purpose |
|---|---|
| `packages/frontend/src/router.tsx` | Route definitions — top-level + project-scoped (`/p/:projectId/...`) + legacy redirects |
| `packages/frontend/src/layouts/root-layout.tsx` | Root layout — sidebar, mobile nav, status bar, command palette, toasts, Pico |
| `packages/frontend/src/layouts/project-layout.tsx` | Project context wrapper — reads `:projectId` from URL, shows loading/404 |
| `packages/frontend/src/components/sidebar.tsx` | Sidebar with project tree — collapsible project sections with child page links |
| `packages/frontend/src/hooks/use-project-from-url.ts` | `useProjectFromUrl()` — reads projectId from URL, returns project context |
| `packages/frontend/src/hooks/use-selected-project.ts` | `useSelectedProject()` — legacy Zustand-based project selection |
| `packages/frontend/src/api/index.ts` | Unified API layer (real HTTP) |
| `packages/frontend/src/stores/ui-store.ts` | UI state (theme, density, sidebar) |
| `packages/frontend/src/stores/work-items-store.ts` | Work items view state (filters, sort, selection) |
| `packages/frontend/src/hooks/index.ts` | TanStack Query hook barrel export |
| `packages/frontend/src/hooks/use-ws-sync.ts` | WebSocket → query cache invalidation |
| `packages/frontend/src/features/chat/thinking-block.tsx` | Collapsible thinking block with markdown rendering |
| `packages/frontend/src/features/chat/tool-call-card.tsx` | Tool call card with icon, status badge, collapsible I/O |
| `packages/frontend/src/features/chat/terminal-block.tsx` | Terminal output renderer with ANSI color support |
| `packages/frontend/src/features/chat/diff-block.tsx` | File diff viewer with line numbers and colored rows |
| `packages/frontend/src/features/chat/file-tree-summary.tsx` | Changed-files directory tree with click-to-scroll |
| `packages/frontend/src/lib/ansi-parser.tsx` | ANSI escape sequence parser (React elements + strip) |
| `packages/frontend/src/lib/diff-parser.ts` | Myers' diff algorithm and unified diff formatter |
| `packages/frontend/src/index.css` | Theme tokens, typography, dark mode, density |
