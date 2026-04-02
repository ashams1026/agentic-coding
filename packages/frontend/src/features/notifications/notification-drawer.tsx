import { useEffect, useRef } from "react";
import { X, CheckCheck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationStore } from "@/stores/notification-store";
import { NotificationCard } from "./notification-card";
import type { Notification } from "@agentops/shared";

// ── Date grouping ───────────────────────────────────────────────

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= weekAgo) return "This Week";
  return "Older";
}

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const groups: Record<string, Notification[]> = {};
  const order = ["Today", "Yesterday", "This Week", "Older"];

  for (const n of notifications) {
    const group = getDateGroup(n.createdAt);
    (groups[group] ??= []).push(n);
  }

  return order.filter((label) => groups[label]?.length).map((label) => ({ label, items: groups[label]! }));
}

// ── Component ───────────────────────────────────────────────────

export function NotificationDrawer() {
  const { notifications, drawerOpen, setDrawerOpen, markAllRead } = useNotificationStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    // Delay to avoid closing from the bell click that opened it
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [drawerOpen, setDrawerOpen]);

  // Close on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [drawerOpen, setDrawerOpen]);

  if (!drawerOpen) return null;

  const grouped = groupByDate(notifications);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-card border-l border-border shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold">Notifications</h2>
          <div className="flex items-center gap-1">
            {hasUnread && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllRead}>
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDrawerOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notifications list */}
        <ScrollArea className="flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground/60 mt-1">No notifications yet</p>
            </div>
          ) : (
            <div className="py-1">
              {grouped.map((group) => (
                <div key={group.label}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </p>
                  {group.items.map((n) => (
                    <NotificationCard key={n.id} notification={n} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
}
