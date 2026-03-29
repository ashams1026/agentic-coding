import { Link } from "react-router";
import { Bot, ArrowRight, GitBranch, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useReadyWork, useTaskEdges } from "@/hooks";
import type { ReadyWorkItem, TaskEdge } from "@agentops/shared";

// ── Dependency status helper ─────────────────────────────────────

function getDependencyStatus(
  taskId: string,
  edges: TaskEdge[],
): "none" | "has_deps" {
  const incoming = edges.filter((e) => e.toId === taskId);
  if (incoming.length === 0) return "none";
  return "has_deps";
}

// ── Work item row ────────────────────────────────────────────────

interface WorkItemRowProps {
  item: ReadyWorkItem;
  edges: TaskEdge[];
}

function WorkItemRow({ item, edges }: WorkItemRowProps) {
  const depStatus = getDependencyStatus(item.task.id, edges);

  return (
    <Link
      to={`/tasks/${item.task.id}`}
      className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/50"
    >
      {/* Persona avatar or generic icon */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: item.persona
            ? item.persona.avatar.color + "20"
            : "hsl(var(--muted))",
        }}
      >
        <Bot
          className="h-3.5 w-3.5"
          style={{
            color: item.persona?.avatar.color ?? "hsl(var(--muted-foreground))",
          }}
        />
      </div>

      {/* Task info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{item.task.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.story.title}
        </p>
      </div>

      {/* Badges */}
      <div className="flex shrink-0 items-center gap-1.5">
        {item.persona && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {item.persona.name}
          </Badge>
        )}
        {depStatus === "has_deps" ? (
          <GitBranch className="h-3.5 w-3.5 text-amber-500" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        )}
      </div>
    </Link>
  );
}

// ── Component ────────────────────────────────────────────────────

export function UpcomingWork() {
  const { data: readyWork } = useReadyWork();
  const { data: edges } = useTaskEdges();

  const items = readyWork ?? [];
  const allEdges = edges ?? [];

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Upcoming Work
          </p>
          <Link
            to="/board"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View board
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {items.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-sm text-muted-foreground">
              No tasks ready for dispatch
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <WorkItemRow
                key={item.task.id}
                item={item}
                edges={allEdges}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
