import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Bot, Clock, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getExecutionQueue } from "@/api";
import { useSelectedProject } from "@/hooks";

// ── Priority badge config ──────────────────────────────────────

const priorityConfig: Record<string, { label: string; className: string }> = {
  p0: {
    label: "P0",
    className: "bg-red-500/15 text-red-600 dark:text-red-400 border-transparent",
  },
  p1: {
    label: "P1",
    className: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-transparent",
  },
  p2: {
    label: "P2",
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-transparent",
  },
  p3: {
    label: "P3",
    className: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-transparent",
  },
};

// ── Relative time helper ───────────────────────────────────────

function formatTimeWaiting(enqueuedAtMs: number): string {
  const now = Date.now();
  const diffMs = now - enqueuedAtMs;
  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Empty state ────────────────────────────────────────────────

function QueueEmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No queued agents</p>
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
          When agent concurrency is maxed out, new executions will queue here.
        </p>
        <Button variant="outline" size="sm" className="mt-4 gap-1.5" asChild>
          <Link to="/items">
            Go to Work Items
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ── Queue row ──────────────────────────────────────────────────

interface QueueRowProps {
  position: number;
  agentName: string;
  workItemTitle: string;
  priority: string;
  enqueuedAt: number;
}

function QueueRow({ position, agentName, workItemTitle, priority, enqueuedAt }: QueueRowProps) {
  const defaultPriority = { label: "P3", className: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-transparent" };
  const pConfig = priorityConfig[priority] ?? defaultPriority;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b hover:bg-accent/30 transition-colors">
      {/* Position number */}
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-bold tabular-nums shrink-0">
        {position}
      </div>

      {/* Agent avatar + name */}
      <div className="flex items-center gap-2 min-w-[120px] shrink-0">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium truncate max-w-[100px]">
          {agentName}
        </span>
      </div>

      {/* Work item title */}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{workItemTitle}</p>
      </div>

      {/* Priority badge */}
      <Badge
        variant="outline"
        size="sm"
        className={cn("text-[10px] font-bold shrink-0", pConfig.className)}
      >
        {pConfig.label}
      </Badge>

      {/* Time waiting */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 min-w-[70px] justify-end">
        <Clock className="h-3 w-3" />
        <span className="tabular-nums">{formatTimeWaiting(enqueuedAt)}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export function QueueView() {
  const { projectId } = useSelectedProject();

  const { data, isLoading } = useQuery({
    queryKey: ["executionQueue", projectId],
    queryFn: () => getExecutionQueue(projectId ?? undefined),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading queue...</p>
      </div>
    );
  }

  const queue = data?.queue ?? [];
  const activeCount = data?.activeCount ?? 0;
  const maxConcurrent = data?.maxConcurrent ?? 0;

  if (queue.length === 0) {
    return <QueueEmptyState />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b bg-muted/20">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Active</span>
          <span className="text-sm font-semibold tabular-nums">
            {activeCount}/{maxConcurrent}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Queued</span>
          <span className="text-sm font-semibold tabular-nums">{queue.length}</span>
        </div>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-auto">
        {queue.map((entry) => (
          <QueueRow
            key={entry.workItemId}
            position={entry.position}
            agentName={entry.agentName}
            workItemTitle={entry.workItemTitle}
            priority={entry.priority}
            enqueuedAt={entry.enqueuedAt}
          />
        ))}
      </div>
    </div>
  );
}
