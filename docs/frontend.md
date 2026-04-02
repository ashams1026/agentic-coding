# Frontend

The AgentOps frontend is a React single-page application built with Vite, Tailwind CSS v4, and shadcn/ui. It runs on port 5173 in development and communicates with the Fastify backend on port 3001.

## Directory Structure

```
packages/frontend/src/
  main.tsx              # Entry point — mounts React app
  app.tsx               # App root — providers (QueryClient, RouterProvider, TooltipProvider)
  router.tsx            # Route definitions (6 routes)
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
    common/             # Shared feature components (detail panels, etc.)
    command-palette/    # Global command palette (Cmd+K)
    toasts/             # Toast notification system
    demo/               # Demo mode controls
  pages/                # Route-level page components
    dashboard.tsx       # Dashboard page (/ route)
    work-items.tsx      # Work items page (/items) — view switcher + detail panel
    agent-monitor.tsx   # Agent monitor page (/agents)
    activity-feed.tsx   # Activity feed page (/activity)
    agent-manager.tsx   # Agent manager page (/agents)
    settings.tsx        # Settings page (/settings)
  components/           # Shared UI components
    sidebar.tsx         # App sidebar with navigation and project switcher
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
    use-theme.ts        # Theme + density sync to DOM
    use-ws-sync.ts      # WebSocket → query cache invalidation
    use-demo.ts         # Demo mode hook
  stores/               # Zustand stores for UI state
    ui-store.ts         # Sidebar, theme, apiMode, density, selected project
    work-items-store.ts # View mode, filters, sort, selected item, panel width
    toast-store.ts      # Toast notification queue
    activity-store.ts   # Activity feed filter state
  layouts/
    root-layout.tsx     # Root layout with sidebar, mobile nav, status bar
  lib/
    utils.ts            # cn() utility for class merging
```

## Routes

| Path | Page | Description |
|---|---|---|
| `/` | Dashboard | Stats cards, cost chart, active agents, recent activity |
| `/items` | Work Items | Board/list/flow views with detail panel |
| `/agents` | Agent Monitor | Live terminal output, split view, execution history |
| `/activity` | Activity Feed | Chronological event stream |
| `/agents` | Agent Manager | Agent cards, editor, tool config |
| `/settings` | Settings | API keys, costs, workflow, appearance, data |

All routes are wrapped in `RootLayout` which provides the sidebar, mobile navigation, and status bar.

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

The work items page (`/items`) shows a single list view:

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

The agent monitor (`/agents`) provides real-time visibility into agent executions via several streaming and observability features:

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
| `selectedProjectId` | `string \| null` | `null` | Currently selected project |
| `theme` | `"light" \| "dark" \| "system"` | `"system"` | Color theme |
| `apiMode` | `"mock" \| "api"` | `"mock"` | Data source (mock or real backend) |
| `density` | `"comfortable" \| "compact"` | `"comfortable"` | UI density |

Persisted fields: `sidebarCollapsed`, `selectedProjectId`, `theme`, `apiMode`, `density`.

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
| `packages/frontend/src/router.tsx` | Route definitions (6 routes) |
| `packages/frontend/src/api/index.ts` | Unified API layer with mock/real delegation |
| `packages/frontend/src/mocks/fixtures.ts` | Seed data for mock mode |
| `packages/frontend/src/mocks/api.ts` | In-memory CRUD mock implementations |
| `packages/frontend/src/stores/ui-store.ts` | UI state (theme, apiMode, density, sidebar) |
| `packages/frontend/src/stores/work-items-store.ts` | Work items view state (filters, sort, selection) |
| `packages/frontend/src/hooks/index.ts` | TanStack Query hook barrel export |
| `packages/frontend/src/hooks/use-ws-sync.ts` | WebSocket → query cache invalidation |
| `packages/frontend/src/index.css` | Theme tokens, typography, dark mode, density |
