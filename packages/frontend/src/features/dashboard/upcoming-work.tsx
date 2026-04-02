import { Link } from "react-router";
import { Bot, ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useReadyWork, useSelectedProject } from "@/hooks";
import type { ReadyWorkItem } from "@agentops/shared";

// ── Work item row ────────────────────────────────────────────────

interface WorkItemRowProps {
  item: ReadyWorkItem;
}

function WorkItemRow({ item }: WorkItemRowProps) {
  return (
    <Link
      to="/items"
      className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/50"
    >
      {/* Agent avatar or generic icon */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: item.agent
            ? item.agent.avatar.color + "20"
            : "hsl(var(--muted))",
        }}
      >
        <Bot
          className="h-3.5 w-3.5"
          style={{
            color: item.agent?.avatar.color ?? "hsl(var(--muted-foreground))",
          }}
        />
      </div>

      {/* Item info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{item.workItem.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.workItem.currentState}
        </p>
      </div>

      {/* Badges */}
      <div className="flex shrink-0 items-center gap-1.5">
        {item.agent && (
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {item.agent.name}
          </Badge>
        )}
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      </div>
    </Link>
  );
}

// ── Component ────────────────────────────────────────────────────

export function UpcomingWork() {
  const { projectId } = useSelectedProject();
  const { data: readyWork } = useReadyWork(projectId ?? undefined);

  const items = readyWork ?? [];

  return (
    <Card>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Upcoming Work
          </p>
          <Link
            to="/items"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View items
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">All caught up</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
              No work items are ready for dispatch right now.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <WorkItemRow
                key={item.workItem.id}
                item={item}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
