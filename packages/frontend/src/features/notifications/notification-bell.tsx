import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useNotificationStore, selectUnreadCount } from "@/stores/notification-store";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const unreadCount = useNotificationStore(selectUnreadCount);
  const { drawerOpen, setDrawerOpen } = useNotificationStore();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 relative", drawerOpen && "bg-muted")}
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "Notifications"}
      </TooltipContent>
    </Tooltip>
  );
}
