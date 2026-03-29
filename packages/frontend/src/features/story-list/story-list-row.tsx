import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Story, Priority } from "@agentops/shared";

// ── Priority config ─────────────────────────────────────────────

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  p0: { label: "P0", className: "border-red-500 text-red-600 dark:text-red-400" },
  p1: { label: "P1", className: "border-amber-500 text-amber-600 dark:text-amber-400" },
  p2: { label: "P2", className: "border-blue-500 text-blue-600 dark:text-blue-400" },
  p3: { label: "P3", className: "border-slate-400 text-slate-500 dark:text-slate-400" },
};

// ── State badge colors ──────────────────────────────────────────

const stateColors: Record<string, string> = {
  Backlog: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "PM Review": "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  Decomposition: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "Pending Approval": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  "In Progress": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  "Code Review": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  QA: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  Done: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

function getStateColor(state: string): string {
  return stateColors[state] ?? "bg-muted text-muted-foreground";
}

// ── Task progress ───────────────────────────────────────────────

function MiniProgress({ done, total }: { done: number; total: number }) {
  if (total === 0) return <span className="text-[10px] text-muted-foreground">No tasks</span>;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {done}/{total}
      </span>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────

interface StoryListRowProps {
  story: Story;
  tasksDone: number;
  tasksTotal: number;
  isSelected: boolean;
  onClick: () => void;
}

export function StoryListRow({ story, tasksDone, tasksTotal, isSelected, onClick }: StoryListRowProps) {
  const pCfg = priorityConfig[story.priority];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50",
      )}
    >
      {/* State badge */}
      <Badge
        variant="secondary"
        className={cn("text-[10px] px-1.5 py-0 shrink-0 font-medium", getStateColor(story.currentState))}
      >
        {story.currentState}
      </Badge>

      {/* Priority */}
      <Badge
        variant="outline"
        className={cn("text-[10px] px-1.5 py-0 font-semibold shrink-0", pCfg.className)}
      >
        {pCfg.label}
      </Badge>

      {/* Title */}
      <span className="flex-1 truncate text-sm">{story.title}</span>

      {/* Task progress */}
      <div className="shrink-0">
        <MiniProgress done={tasksDone} total={tasksTotal} />
      </div>
    </button>
  );
}
