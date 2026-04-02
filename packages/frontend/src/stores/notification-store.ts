import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Notification, NotificationEventType } from "@agentops/shared";

// ── Preferences types ───────────────────────────────────────────

export interface NotificationPreferences {
  enabledEvents: Record<NotificationEventType, boolean>;
  soundEvents: Record<NotificationEventType, boolean>;
  quietHours: { enabled: boolean; from: string; to: string };
  scope: "all" | "current-project";
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabledEvents: {
    proposal_needs_approval: true,
    agent_errored: true,
    budget_threshold: true,
    agent_completed: true,
  },
  soundEvents: {
    proposal_needs_approval: true,
    agent_errored: true,
    budget_threshold: false,
    agent_completed: false,
  },
  quietHours: { enabled: false, from: "22:00", to: "08:00" },
  scope: "all",
};

// ── Batching ────────────────────────────────────────────────────

const BATCH_WINDOW_MS = 60_000; // 60 seconds

interface BatchState {
  count: number;
  timer: ReturnType<typeof setTimeout> | null;
  firstAt: number;
}

// ── Store interface ─────────────────────────────────────────────

interface NotificationState {
  notifications: Notification[];
  preferences: NotificationPreferences;
  drawerOpen: boolean;

  addNotification: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  setDrawerOpen: (open: boolean) => void;
}

// ── Batching state (not persisted) ──────────────────────────────

const batchState: BatchState = { count: 0, timer: null, firstAt: 0 };

function flushBatch(set: (fn: (state: NotificationState) => Partial<NotificationState>) => void) {
  if (batchState.count <= 1) {
    batchState.count = 0;
    batchState.timer = null;
    return;
  }

  const batchedNotification: Notification = {
    id: `ntf-batch-${Date.now()}`,
    type: "agent_completed",
    priority: "low",
    title: `${batchState.count} agents completed`,
    description: `${batchState.count} agents completed in the last minute`,
    read: false,
    createdAt: new Date().toISOString(),
  };

  set((state) => ({
    notifications: [batchedNotification, ...state.notifications],
  }));

  batchState.count = 0;
  batchState.timer = null;
}

// ── Store ───────────────────────────────────────────────────────

const MAX_NOTIFICATIONS = 100;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      preferences: DEFAULT_PREFERENCES,
      drawerOpen: false,

      addNotification: (notification) => {
        const prefs = get().preferences;

        // Check if event type is enabled
        if (!prefs.enabledEvents[notification.type]) return;

        // Check quiet hours
        if (prefs.quietHours.enabled && notification.priority !== "critical") {
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
          const { from, to } = prefs.quietHours;
          // Handle overnight ranges (e.g., 22:00 to 08:00)
          const inQuiet = from <= to
            ? timeStr >= from && timeStr < to
            : timeStr >= from || timeStr < to;
          if (inQuiet) return;
        }

        // Batch agent_completed notifications
        if (notification.type === "agent_completed") {
          batchState.count++;
          if (batchState.count === 1) {
            // First in window — add immediately and start timer
            batchState.firstAt = Date.now();
            set((state) => ({
              notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
            }));
            batchState.timer = setTimeout(() => flushBatch(set), BATCH_WINDOW_MS);
          }
          // Subsequent in window — skip individual notification (batch will flush)
          return;
        }

        // Non-batched: add immediately
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
        }));
      },

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      setDrawerOpen: (open) => set({ drawerOpen: open }),
    }),
    {
      name: "woof-notifications",
      partialize: (state) => ({
        notifications: state.notifications,
        preferences: state.preferences,
      }),
    },
  ),
);

// ── Derived selectors ───────────────────────────────────────────

export const selectUnreadCount = (state: NotificationState) =>
  state.notifications.filter((n) => !n.read).length;
