import { Link } from "react-router";
import { Bot, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Story, Persona, Priority } from "@agentops/shared";

// ── Priority colors ──────────────────────────────────────────────

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  p0: { label: "P0", className: "border-red-500 text-red-600 dark:text-red-400" },
  p1: { label: "P1", className: "border-amber-500 text-amber-600 dark:text-amber-400" },
  p2: { label: "P2", className: "border-blue-500 text-blue-600 dark:text-blue-400" },
  p3: { label: "P3", className: "border-slate-400 text-slate-500 dark:text-slate-400" },
};

// ── Task progress bar ────────────────────────────────────────────

function TaskProgressBar({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-[10px] text-muted-foreground">
        {done}/{total}
      </span>
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────

export interface StoryCardData {
  tasksDone: number;
  tasksTotal: number;
  pendingProposalCount: number;
  activeAgent: { persona: Persona } | null;
}

// ── Component ────────────────────────────────────────────────────

interface StoryCardProps {
  story: Story;
  data: StoryCardData;
}

export function StoryCard({ story, data }: StoryCardProps) {
  const pCfg = priorityConfig[story.priority];

  return (
    <Link to={`/stories/${story.id}`}>
      <Card className="cursor-pointer transition-colors hover:bg-accent/50">
        <CardContent className="px-3 py-2.5">
          {/* Title */}
          <p className="text-sm font-medium leading-snug line-clamp-2">
            {story.title}
          </p>

          {/* Badges row: priority + labels */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-semibold ${pCfg.className}`}
            >
              {pCfg.label}
            </Badge>
            {story.labels.slice(0, 2).map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {label}
              </Badge>
            ))}
          </div>

          {/* Task progress */}
          {data.tasksTotal > 0 && (
            <div className="mt-2">
              <TaskProgressBar done={data.tasksDone} total={data.tasksTotal} />
            </div>
          )}

          {/* Bottom row: proposal badge + active agent */}
          {(data.pendingProposalCount > 0 || data.activeAgent) && (
            <div className="mt-2 flex items-center gap-2">
              {data.pendingProposalCount > 0 && (
                <div className="flex items-center gap-1 text-amber-500">
                  <FileCheck className="h-3 w-3" />
                  <span className="text-[10px] font-medium">
                    {data.pendingProposalCount}
                  </span>
                </div>
              )}
              {data.activeAgent && (
                <div className="ml-auto flex items-center gap-1">
                  <div
                    className="relative flex h-5 w-5 items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        data.activeAgent.persona.avatar.color + "20",
                    }}
                  >
                    <Bot
                      className="h-3 w-3"
                      style={{
                        color: data.activeAgent.persona.avatar.color,
                      }}
                    />
                    <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {data.activeAgent.persona.name}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
