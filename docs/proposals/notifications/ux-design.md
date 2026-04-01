# Notifications & Alerts — UX Design Research

Research into notifying users when agents need attention, including in-app notification center, preferences, and toast vs. persistent behavior.

**Current state:** The app has ephemeral toasts (`toast-store.ts` — max 3, 5-second auto-dismiss, action button support) and an activity feed unread counter (`activity-store.ts` — badge on sidebar nav). No persistent notification center, no bell icon, no per-event preferences, no external channels (email/Slack). The sidebar shows unread activity count but this is a generic counter, not event-type-aware.

---

## 1. Notification-Triggering Events

### Event catalog

| Event | Priority | Default channel | Example |
|-------|----------|----------------|---------|
| Agent needs approval (proposal) | **Critical** | Persistent + toast | "Engineer proposes refactoring auth module — [Review]" |
| Agent errored | **Critical** | Persistent + toast | "Code Reviewer failed on 'Fix auth bug' — TypeError" |
| Budget threshold reached (80%) | **High** | Persistent + toast | "Project 'tictactoe' has used 80% of daily budget ($4.00/$5.00)" |
| Budget exceeded | **Critical** | Persistent + toast | "Budget exceeded — all agents paused" |
| Execution stuck/timed out | **High** | Persistent | "Engineer stuck on 'Implement login' — no activity for 10 minutes" |
| Workflow step requires human input | **High** | Persistent + toast | "Work item 'Design API' needs manual transition from Planning" |
| Agent completed successfully | **Low** | Toast only | "Engineer completed 'Fix auth bug'" |
| Agent started | **Info** | Toast only (if watching) | "Code Reviewer started reviewing 'Fix auth bug'" |
| Work item state changed | **Info** | Activity feed only | "'Fix auth bug' moved from In Progress → In Review" |
| Multiple agents completed (batch) | **Low** | Single grouped toast | "3 agents completed work in the last 5 minutes" |

### Priority levels

| Priority | Behavior | Persistence |
|----------|----------|-------------|
| **Critical** | Toast + persistent notification + sound (optional) | Until acknowledged |
| **High** | Toast + persistent notification | Until acknowledged |
| **Low** | Toast only | Auto-dismisses (5 seconds) |
| **Info** | Activity feed only, no toast | N/A |

---

## 2. In-App Notification Center

### Bell icon with unread count

Add a bell icon to the **sidebar footer** (next to theme toggle and collapse button):

```
┌─ Sidebar footer ──────────────────┐
│  [☀️ Theme] [🔔 3] [◀ Collapse]  │
└────────────────────────────────────┘
```

- **Unread badge:** Red dot with count (like the existing activity feed badge)
- **Badge hidden** when count is 0
- **Click** opens the notification drawer

### Notification drawer

Sliding panel from the right (320px wide), overlaying content:

```
┌─ Notifications ───────── [Mark all read] [⚙️] ─┐
│                                                   │
│  ── Today ──                                      │
│                                                   │
│  🔴 Engineer failed on "Fix auth bug"            │
│     TypeError: Cannot read property...            │
│     2 minutes ago                [→ View]         │
│                                                   │
│  🟡 Budget at 80% ($4.00/$5.00)                  │
│     Project: tictactoe                            │
│     15 minutes ago               [→ Settings]     │
│                                                   │
│  💡 Proposal: Refactor auth middleware            │
│     From: Engineer                                │
│     1 hour ago         [✓ Approve] [✗ Reject]    │
│                                                   │
│  ✅ Code Reviewer completed "Review PR #42"       │
│     3 hours ago                                   │
│                                                   │
│  ── Yesterday ──                                  │
│  ...                                              │
└───────────────────────────────────────────────────┘
```

**Design details:**
- **Grouped by date** (Today, Yesterday, This Week, Older)
- **Each notification:** icon (color-coded by priority), title, description (1-2 lines), relative timestamp, action button
- **Inline actions:** Proposals show Approve/Reject directly in the notification. "View" navigates to the relevant page.
- **Mark as read:** Click a notification to mark it read (dimmed style). "Mark all read" button in header.
- **Settings gear** opens notification preferences (see §3)
- **Empty state:** "All caught up! No new notifications."

### Notification types and actions

| Event type | Icon | Color | Inline action |
|-----------|------|-------|--------------|
| Agent needs approval | 💡 | Amber | [Approve] [Reject] |
| Agent errored | 🔴 | Red | [View execution] |
| Budget threshold | 🟡 | Yellow | [View settings] |
| Execution stuck | ⏰ | Orange | [View agent] [Cancel] |
| Human input needed | 🔵 | Blue | [View work item] |
| Agent completed | ✅ | Green | [View result] |

---

## 3. Notification Preferences

### Settings > Notifications page

```
┌─ Notification Preferences ─────────────────────────────┐
│                                                         │
│  Event Type                In-App    Sound              │
│  ─────────────────────────────────────────────          │
│  Agent needs approval      [✓]       [✓]               │
│  Agent errored             [✓]       [✓]               │
│  Budget threshold          [✓]       [ ]               │
│  Execution stuck           [✓]       [ ]               │
│  Human input needed        [✓]       [ ]               │
│  Agent completed           [✓]       [ ]               │
│  Agent started             [ ]       [ ]               │
│                                                         │
│  ── Quiet Hours ──                                      │
│  Enable quiet hours        [✓]                          │
│  From: [22:00]  To: [08:00]                            │
│  During quiet hours: only critical notifications        │
│                                                         │
│  ── Scope ──                                            │
│  Receive notifications for:                             │
│  ○ All projects                                         │
│  ● Selected project only                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Design decisions:**
- **In-app toggle** per event type — all enabled by default except "Agent started"
- **Sound toggle** per event type — only critical events have sound enabled by default
- **No email/Slack in Phase 1** — those columns appear when external integrations are configured (see RES.NOTIFY.INTEGRATIONS)
- **Quiet hours** — suppresses all non-critical notifications during configured window. Critical events (errors, budget exceeded) still notify.
- **Scope** — filter notifications to current project or receive all. Useful when multiple projects run agents simultaneously.

### Storage

Preferences stored in the `projects.settings` JSON (project-scoped) or a new `user_preferences` table (global). Since the app is single-user, using `localStorage` with a Zustand store is simplest for Phase 1:

```typescript
interface NotificationPreferences {
  enabledEvents: Record<NotificationEventType, boolean>;
  soundEvents: Record<NotificationEventType, boolean>;
  quietHours: { enabled: boolean; from: string; to: string };
  scope: "all" | "current-project";
}
```

---

## 4. Toast vs. Persistent Notifications

### Decision matrix

| Event | Toast | Persistent | Rationale |
|-------|-------|-----------|-----------|
| Agent needs approval | Yes (with action) | Yes | User must act. Toast gets attention; persistent ensures it's not missed. |
| Agent errored | Yes | Yes | Needs investigation. Toast alerts; persistent keeps it visible. |
| Budget threshold (80%) | Yes | Yes | Time-sensitive warning. |
| Budget exceeded | Yes | Yes | Critical — agents are paused. |
| Execution stuck | No | Yes | Not urgent enough for toast. User checks at their pace. |
| Human input needed | Yes | Yes | Workflow is blocked. Toast alerts; persistent tracks it. |
| Agent completed | Yes | No | Informational. Toast confirms success. No action needed. |
| Agent started | No | No | Very low value. Activity feed only. |
| Work item state changed | No | No | Activity feed only. |
| Batch completions | Yes (grouped) | No | "3 agents completed" — single toast, not 3 toasts. |

### Toast behavior enhancements

The existing toast system (5-second auto-dismiss, max 3) works for low-priority events. For critical events, enhance:

- **Critical toasts don't auto-dismiss.** They stay until the user clicks the action button or dismisses manually.
- **Toast stacking:** If multiple critical events arrive, stack them (up to max 3). Show "+N more" if overflow.
- **Action buttons on toasts:** "View" navigates to the relevant page. "Approve"/"Reject" for proposals.
- **Toast → notification link:** Dismissing a critical toast does NOT mark the persistent notification as read. The notification stays in the bell drawer.

### Grouping / batching

When multiple agents complete in rapid succession (common during workflow execution):
- **Don't fire N individual toasts.** Instead, batch into one: "3 agents completed work in the last 5 minutes."
- **Batching window:** 60 seconds. Events within the window are grouped.
- **Grouped notification in drawer:** Expandable — shows individual events on click.

---

## 5. Interaction with Agent Monitor

### Suppress duplicates when user is watching

If the user has the Agent Monitor page open and is viewing a specific execution:
- **Suppress toasts** for events related to that execution (completed, errored)
- **Still add to persistent notifications** (user may navigate away before seeing the result)
- Detection: check if `window.location.pathname === "/agents"` and the execution ID is in the visible list

### Agent Monitor → notification sync

When a user views an execution in Agent Monitor that has an unread notification:
- **Auto-mark the notification as read** (the user has already seen the information)
- Reduces notification noise — the user doesn't need to dismiss the same event in two places

### Quick actions from notifications

Clicking a notification navigates to the relevant context:
- "Agent errored" → Agent Monitor, execution detail expanded
- "Proposal needs approval" → Work item detail panel with proposal card visible
- "Budget threshold" → Settings > Costs
- "Execution stuck" → Agent Monitor with the stuck execution highlighted

---

## 6. Notification Data Model (lightweight)

### Storage for persistent notifications

```typescript
interface Notification {
  id: string;
  type: NotificationEventType;
  priority: "critical" | "high" | "low" | "info";
  title: string;
  description?: string;
  projectId?: string;
  workItemId?: string;
  executionId?: string;
  read: boolean;
  actionTaken?: "approved" | "rejected" | "dismissed";
  createdAt: Date;
}
```

**Phase 1:** Store in Zustand (in-memory, lost on refresh). Sufficient for a local-first app where the user is typically present.

**Phase 2:** Persist to SQLite (`notifications` table) for history and cross-session persistence. Supports querying old notifications, audit trail.

### Event emission

Backend emits notification events via the existing WebSocket connection:

```typescript
// In execution-manager.ts, after execution completes
ws.broadcast({
  type: "notification",
  event: "execution.completed",
  data: { executionId, workItemId, personaName, outcome },
});
```

Frontend `useWsQuerySync` hook receives these and dispatches to notification store + toast store.

---

## 7. Design Decisions

### Bell icon in sidebar, not header

The sidebar is always visible (even on mobile via hamburger). Placing the bell there ensures consistent access. The header area is reserved for page-specific controls.

### In-memory notifications for Phase 1

Persisting notifications to SQLite adds a table, migration, and CRUD endpoints. For a single-user local-first app, in-memory is sufficient — the user is typically watching the app while agents work. Persistence becomes valuable when external channels (email/Slack) are added (Phase 2).

### No notification sound by default for non-critical events

Sound notifications are disruptive. Only "agent needs approval" and "agent errored" have sound enabled by default. Users can enable sound for other event types in preferences.

### Quiet hours suppress non-critical only

During quiet hours (e.g., overnight agent runs), the user doesn't want toast spam. But budget exceeded or agent errors are important enough to break through. Critical events always notify.

---

## 8. Relationship to Other Research

| Topic | Relationship |
|-------|-------------|
| RES.NOTIFY.INTEGRATIONS | External channels (Slack, email, webhooks) — this doc covers in-app only |
| RES.CHAT.UX | Proposal approval from chat page vs notification drawer — both are entry points |
| RES.LIFECYCLE.UX | Archive/delete confirmations are separate from notifications (they're synchronous user actions) |
| RES.ANALYTICS.UX | Notification history could feed into analytics (how often agents error, average response time to proposals) |
| RES.RECOVERY.AGENTS | Stuck execution detection triggers "Execution stuck" notification |
