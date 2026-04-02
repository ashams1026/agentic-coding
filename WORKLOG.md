# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> When entries exceed 20, the oldest are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-04-02 08:50 PDT — Review: NTF.5 (approved)

**Reviewed:** NotificationDrawer in notification-drawer.tsx + root-layout integration.
- 320px panel (w-80), fixed right, z-50, backdrop overlay ✓
- Header: "Notifications" + "Mark all read" (conditional) + close ✓
- Date grouping (Today/Yesterday/This Week/Older) ✓
- Notification items: priority dot, title (bold if unread), description (2-line), relative time ✓
- Click marks as read, empty state with bell icon ✓
- Dismisses on Escape + click outside (delayed handler) ✓
- Rendered in root-layout.tsx ✓
- Build passes ✓
- **Verdict: approved.** NTF.6 will extract NotificationCard into standalone component with type-specific icons and actions.

---

## 2026-04-02 08:45 PDT — NTF.5: NotificationDrawer component

**Done:** Created `packages/frontend/src/features/notifications/notification-drawer.tsx` — 320px sliding panel from right with backdrop overlay (z-50). Header: "Notifications" title + "Mark all read" button (only shown when unread exist) + close button. Notifications grouped by date (Today/Yesterday/This Week/Older). Each notification shows priority dot (color-coded), title (bold if unread), description (2-line clamp), relative time. Click marks as read. Empty state: Bell icon + "All caught up!". Dismisses on click outside (delayed to avoid bell re-trigger) or Escape key. Rendered in root-layout.tsx alongside other global components.
**Files:** `packages/frontend/src/features/notifications/notification-drawer.tsx` (new), `packages/frontend/src/layouts/root-layout.tsx`

---

## 2026-04-02 08:30 PDT — Review: NTF.4 (approved)

**Reviewed:** NotificationBell component + sidebar integration.
- Bell icon with red unread badge ("9+" overflow) ✓
- Placed between theme toggle and collapse button in sidebar footer ✓
- Click toggles drawerOpen in notification store ✓
- Wired to selectUnreadCount selector ✓
- Tooltip with count or "Notifications" ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 08:25 PDT — NTF.4: NotificationBell component in sidebar

**Done:** Created `packages/frontend/src/features/notifications/notification-bell.tsx` — Bell icon button with red unread count badge (shows "9+" for >9). Wired to notification store's `selectUnreadCount` selector. Click toggles `drawerOpen` in store. Active state highlights with `bg-muted`. Tooltip shows unread count or "Notifications". Placed in sidebar footer between theme toggle and collapse toggle via import in `sidebar.tsx`.
**Files:** `packages/frontend/src/features/notifications/notification-bell.tsx` (new), `packages/frontend/src/components/sidebar.tsx`

---

## 2026-04-02 08:15 PDT — Review: NTF.3 (approved)

**Reviewed:** Zustand notification store in notification-store.ts.
- State: notifications[], preferences (enabledEvents/soundEvents/quietHours/scope), drawerOpen ✓
- All 6 actions: addNotification, markRead, markAllRead, removeNotification, updatePreferences, setDrawerOpen ✓
- localStorage persistence via zustand/middleware persist, partializes correctly ✓
- 60-second batching: first added immediately, subsequent suppressed, batch flushed at window end ✓
- Quiet hours with overnight range handling, critical bypasses ✓
- Max 100 cap, selectUnreadCount selector ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 08:10 PDT — NTF.3: Zustand notification store

**Done:** Created `packages/frontend/src/stores/notification-store.ts` with Zustand + persist middleware. State: `notifications[]`, `preferences` (enabledEvents/soundEvents maps, quietHours, scope), `drawerOpen`. Actions: addNotification (checks enabled, quiet hours, batching), markRead, markAllRead, removeNotification, updatePreferences, setDrawerOpen. Persists notifications + preferences to localStorage under `"woof-notifications"`. 60-second batching for `agent_completed` — first in window added immediately, subsequent suppressed, batch summary flushed at window end. Quiet hours support with overnight range handling. Max 100 notifications cap. `selectUnreadCount` derived selector exported.
**Files:** `packages/frontend/src/stores/notification-store.ts` (new)

---

## 2026-04-02 08:00 PDT — Review: NTF.2 (approved)

**Reviewed:** Backend notification emission across 3 files.
- broadcastNotification() helper: crypto ID, Notification wrapping, broadcast() delegation ✓
- Agent completed (low): persona name + summary, 4 call sites total ✓
- Agent errored (critical): persona name + error message ✓
- Proposal review_request (critical): work item reference ✓
- Budget 80% threshold (high): dollar amounts + percentage ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 07:55 PDT — NTF.2: Backend notification emission

**Done:** Added `broadcastNotification()` helper to `ws.ts` — creates a `Notification` object with crypto-generated ID and broadcasts as `NotificationEvent`. Added 4 emission points: (1) execution-manager agent completed (low priority, persona name + summary), (2) execution-manager agent error (critical, persona name + error message), (3) proposals route on `review_request` creation (critical), (4) execution-manager cost summary at 80% monthly budget threshold (high, dollar amounts). Imported `broadcastNotification` in execution-manager.ts and proposals.ts.
**Files:** `packages/backend/src/ws.ts`, `packages/backend/src/agent/execution-manager.ts`, `packages/backend/src/routes/proposals.ts`

---

## 2026-04-02 07:40 PDT — Review: NTF.1 (approved)

**Reviewed:** Notification shared types in ws-events.ts + ws-client.ts.
- NotificationEventType: 5 types ✓
- NotificationPriority: critical/high/low/info ✓
- Notification interface: all required fields (id, type, priority, title, read, createdAt, optional desc/project/workItem/execution) ✓
- NotificationEvent in WsEventType, WsEvent union, WsEventMap ✓
- Frontend WS client listener map updated ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 07:35 PDT — NTF.1: Shared notification types

**Done:** Added `NotificationEventType` (5 types: proposal_needs_approval, agent_errored, budget_threshold, execution_stuck, agent_completed), `NotificationPriority` (critical/high/low/info), and `Notification` interface to `packages/shared/src/ws-events.ts`. Added `NotificationEvent` WS event with `notification` payload + timestamp. Added `"notification"` to `WsEventType` union, `NotificationEvent` to `WsEvent` union and `WsEventMap`. Fixed downstream: added `notification: new Set()` to frontend WS client listener map.
**Files:** `packages/shared/src/ws-events.ts`, `packages/frontend/src/api/ws-client.ts`

---

## 2026-04-02 07:25 PDT — Review: PPR.4 (approved)

**Reviewed:** Variables reference panel and resolved preview in system-prompt-editor.tsx.
- Collapsible panel with ChevronDown/Right, Variable icon, 13 variables grouped by namespace ✓
- Current values shown as green `= value` from previewContext ✓
- Preview mode renders ResolvedPreview: green for resolved, amber for unresolved ✓
- Persona editor passes useSelectedProject() + form state as previewContext ✓
- Build passes ✓
- **Verdict: approved.** Persona Prompts Phase 1 (PPR.1-4) complete.

---

## 2026-04-02 07:20 PDT — PPR.4: Variables reference panel and resolved preview

**Done:** Added collapsible "Available Variables" reference panel below the system prompt editor. Shows all 13 variables grouped by namespace with descriptions and current values (green `= value` indicators from project/persona context). Added `ResolvedPreview` component that replaces the plain MarkdownPreview in preview mode — resolves `{{variables}}` with context data, highlights resolved values in green and unresolved in amber. Added `previewContext` prop to `SystemPromptEditor` with project + persona data. Updated persona editor to pass `useSelectedProject()` data and current persona form state as preview context.
**Files:** `packages/frontend/src/features/persona-manager/system-prompt-editor.tsx`, `packages/frontend/src/features/persona-manager/persona-editor.tsx`

---

## 2026-04-02 07:05 PDT — Review: PPR.3 (approved)

**Reviewed:** Autocomplete popup in system-prompt-editor.tsx.
- Trigger on `{{` via lastIndexOf comparison ✓
- 4 groups (Project/Persona/Date/Work Item), 13 variables with descriptions ✓
- Type-ahead filtering as user types inside `{{...` ✓
- Keyboard: ArrowUp/Down, Enter/Tab to insert, Escape to dismiss ✓
- Click outside dismissal via mousedown listener ✓
- Insertion replaces from trigger position, restores cursor ✓
- Popover positioned at cursor (line/column approximation) ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 07:00 PDT — PPR.3: Autocomplete popup for template variables

**Done:** Added autocomplete popup to `system-prompt-editor.tsx`. Triggers on typing `{{` — detects open braces via `lastIndexOf("{{")` vs `lastIndexOf("}}")` comparison. Shows grouped dropdown (Project, Persona, Date, Work Item) with 13 variables, each showing `{{name}}` + description. Positioned relative to cursor in textarea (calculated from line/column). Type-ahead filtering narrows results. Keyboard navigation: ArrowUp/Down, Enter/Tab to insert, Escape to dismiss. Click outside dismisses. On selection, replaces from `{{` trigger position through cursor with `{{variable.name}}` and restores focus.
**Files:** `packages/frontend/src/features/persona-manager/system-prompt-editor.tsx`

---

## 2026-04-02 06:45 PDT — Review: PPR.2 (approved)

**Reviewed:** resolveVariables integration in claude-executor.ts and chat.ts.
- Executor: resolves persona.systemPrompt with project+persona+date+workItem context before sections ✓
- Chat: resolves chatAgent.systemPrompt with project+persona+date context (no workItem) ✓
- Imports in both files ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 06:40 PDT — PPR.2: Integrate resolveVariables into executor and chat paths

**Done:** Integrated `resolveVariables()` + `buildVariableContext()` into both prompt-building paths. Executor path (`claude-executor.ts`): resolve variables in persona.systemPrompt before adding to sections, passing project + persona + date + workItem context (id, title, state, description). Chat path (`chat.ts`): resolve variables in chatAgent.systemPrompt before adding to sections, passing project + persona + date context (no workItem in chat). Added imports in both files. Fixed type mismatch for DB row types vs shared entity types with cast.
**Files:** `packages/backend/src/agent/claude-executor.ts`, `packages/backend/src/routes/chat.ts`

---

## 2026-04-02 06:30 PDT — Review: PPR.1 (approved)

**Reviewed:** prompt-variables.ts in `packages/backend/src/agent/`.
- resolveVariables: regex with negative lookbehind for escaped \{{, whitespace-tolerant, undefined → literal ✓
- buildVariableContext: project.* (3), persona.* (3), date.* (3), workItem.* (4) — all string|undefined ✓
- Both functions exported, clean types ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 06:25 PDT — PPR.1: resolveVariables and buildVariableContext

**Done:** Created `packages/backend/src/agent/prompt-variables.ts` with two exported functions. `resolveVariables(template, context)` uses regex to substitute `{{variable.name}}` placeholders — undefined variables left as literal text, escaped `\{{` not matched. `buildVariableContext(options)` assembles the built-in variable map from optional project, persona, and workItem data: `project.*` (name, path, description), `persona.*` (name, description, model), `date.*` (now ISO, today YYYY-MM-DD, dayOfWeek), `workItem.*` (id, title, state, description).
**Files:** `packages/backend/src/agent/prompt-variables.ts` (new)

---

## 2026-04-02 06:15 PDT — Review: ACH.7 (approved)

**Reviewed:** Session management context menu in `packages/frontend/src/pages/chat.tsx`.
- Right-click context menu with Rename + Delete on sidebar session items ✓
- Context menu positioned at cursor, dismisses on click/right-click outside ✓
- Delete opens confirmation dialog with warning text ✓
- Confirm delete calls deleteSession() which handles API + auto-session-switching ✓
- Build passes ✓
- **Verdict: approved.** Agent Chat Phase 1 (ACH.1-7) complete.

---

## 2026-04-02 06:10 PDT — ACH.7: Session management context menu and delete confirmation

**Done:** Added right-click context menu to sidebar session items with Rename and Delete options. Rename triggers the existing inline edit flow. Delete opens a confirmation dialog with "Delete session?" title, warning text, Cancel/Delete buttons. Delete wired to `deleteSession()` which calls API, removes from local state, and auto-selects most recent remaining session (or shows empty state). Context menu positioned at cursor coordinates, dismisses on click outside.
**Files:** `packages/frontend/src/pages/chat.tsx`

---

## 2026-04-02 05:55 PDT — Review: ACH.6 (approved)

**Reviewed:** Chat header bar in `packages/frontend/src/pages/chat.tsx`.
- Persona avatar (color+icon) + name with Pico fallback ✓
- Project badge (projectId or Globe + "Global") ✓
- Editable title: double-click → input, Enter/Escape/blur handling ✓
- Three-dot context menu: Rename + Delete (red) actions ✓
- deleteSession() in hook: API call, local state cleanup, auto-session-switching ✓
- Build passes ✓
- **Verdict: approved.**

---

## 2026-04-02 05:50 PDT — ACH.6: Chat header bar with persona info and context menu

**Done:** Added chat header bar to `/chat` page between sidebar and messages. Shows persona avatar (color+icon), persona name, project badge (projectId or "Global" with globe icon), and editable session title (double-click to rename). Three-dot context menu with Rename and Delete actions. Added `deleteSession()` function to `usePicoChat` hook — deletes session via API, removes from local state, auto-selects most recent remaining session. Imported MoreVertical, Globe, Pencil icons.
**Files:** `packages/frontend/src/pages/chat.tsx`, `packages/frontend/src/hooks/use-pico-chat.ts`


