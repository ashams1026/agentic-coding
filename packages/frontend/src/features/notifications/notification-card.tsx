import { useNavigate } from "react-router";
import {
  Lightbulb,
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/stores/notification-store";
import { cn } from "@/lib/utils";
import type { Notification, NotificationEventType } from "@agentops/shared";

// ── Type-specific icon + color config ───────────────────────────

interface TypeConfig {
  icon: LucideIcon;
  color: string;      // Tailwind text color
  bgColor: string;    // Tailwind bg color (light)
}

const TYPE_CONFIG: Record<NotificationEventType, TypeConfig> = {
  proposal_needs_approval: { icon: Lightbulb, color: "text-amber-500", bgColor: "bg-amber-500/15" },
  agent_errored: { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-500/15" },
  budget_threshold: { icon: AlertTriangle, color: "text-yellow-500", bgColor: "bg-yellow-500/15" },
  execution_stuck: { icon: Clock, color: "text-orange-500", bgColor: "bg-orange-500/15" },
  agent_completed: { icon: CheckCircle, color: "text-emerald-500", bgColor: "bg-emerald-500/15" },
};

// ── Relative time ───────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Component ───────────────────────────────────────────────────

interface NotificationCardProps {
  notification: Notification;
}

export function NotificationCard({ notification: n }: NotificationCardProps) {
  const navigate = useNavigate();
  const { markRead, setDrawerOpen } = useNotificationStore();
  const config = TYPE_CONFIG[n.type];
  const Icon = config.icon;

  const handleClick = () => {
    markRead(n.id);
  };

  const handleAction = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    markRead(n.id);
    setDrawerOpen(false);
    navigate(path);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors",
        !n.read && "bg-muted/30",
      )}
    >
      {/* Type icon */}
      <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", config.bgColor)}>
        <Icon className={cn("h-3.5 w-3.5", config.color)} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Title + time */}
        <div className="flex items-baseline gap-2">
          <span className={cn("text-xs truncate", !n.read ? "font-medium text-foreground" : "text-muted-foreground")}>
            {n.title}
          </span>
          <span className="text-[10px] text-muted-foreground/60 shrink-0 ml-auto">
            {relativeTime(n.createdAt)}
          </span>
        </div>

        {/* Description */}
        {n.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
            {n.description}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1 mt-1.5">
          {n.type === "proposal_needs_approval" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-5 px-2 text-[10px]"
                onClick={(e) => handleAction(e, "/items")}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-5 px-2 text-[10px] text-red-400 hover:text-red-300"
                onClick={(e) => handleAction(e, "/items")}
              >
                Reject
              </Button>
            </>
          )}
          {n.type === "agent_errored" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-[10px]"
              onClick={(e) => handleAction(e, "/agents")}
            >
              View execution
            </Button>
          )}
          {n.type === "agent_completed" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-[10px]"
              onClick={(e) => handleAction(e, "/agents")}
            >
              View result
            </Button>
          )}
          {n.type === "budget_threshold" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-[10px]"
              onClick={(e) => handleAction(e, "/settings")}
            >
              View settings
            </Button>
          )}
          {n.type === "execution_stuck" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-[10px]"
              onClick={(e) => handleAction(e, "/agents")}
            >
              View agent
            </Button>
          )}
        </div>
      </div>
    </button>
  );
}
