import { useMemo } from "react";
import { Link } from "react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTaskEdges, useTasks } from "@/hooks";
import type { Task } from "@agentops/shared";

// ── State badge config ──────────────────────────────────────────

function stateStyle(state: string): { color: string; icon: React.ReactNode } {
  switch (state) {
    case "Done":
      return {
        color: "text-green-600 dark:text-green-400",
        icon: <CheckCircle2 className="h-3 w-3 text-green-500" />,
      };
    case "Running":
      return {
        color: "text-emerald-600 dark:text-emerald-400",
        icon: <Loader2 className="h-3 w-3 text-emerald-500 animate-spin" />,
      };
    case "Review":
      return {
        color: "text-amber-600 dark:text-amber-400",
        icon: <Circle className="h-3 w-3 text-amber-500" />,
      };
    default:
      return {
        color: "text-slate-500",
        icon: <Circle className="h-3 w-3 text-slate-400" />,
      };
  }
}

// ── Dependency row ──────────────────────────────────────────────

interface DepRowProps {
  task: Task;
  isBlocking: boolean;
}

function DepRow({ task, isBlocking }: DepRowProps) {
  const style = stateStyle(task.currentState);

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="flex items-center gap-2.5 rounded-md px-3 py-2 hover:bg-accent/50 transition-colors"
    >
      {style.icon}
      <span className="flex-1 text-sm truncate">{task.title}</span>
      <Badge variant="outline" className={`text-[10px] shrink-0 ${style.color}`}>
        {task.currentState}
      </Badge>
      {isBlocking && task.currentState !== "Done" && (
        <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
      )}
    </Link>
  );
}

// ── Main component ──────────────────────────────────────────────

interface DependencyInfoProps {
  task: Task;
}

export function DependencyInfo({ task }: DependencyInfoProps) {
  const { data: edges = [] } = useTaskEdges(task.id);
  const { data: allTasks = [] } = useTasks(task.storyId);

  const taskMap = useMemo(
    () => new Map(allTasks.map((t) => [t.id as string, t])),
    [allTasks],
  );

  // "Depends on" — edges where this task is the target (toId)
  // meaning: fromId blocks/must complete before this task
  const dependsOn = useMemo(() => {
    return edges
      .filter((e) => e.toId === task.id)
      .map((e) => taskMap.get(e.fromId as string))
      .filter((t): t is Task => t !== undefined);
  }, [edges, task.id, taskMap]);

  // "Blocks" — edges where this task is the source (fromId)
  // meaning: this task must complete before toId can proceed
  const blocks = useMemo(() => {
    return edges
      .filter((e) => e.fromId === task.id)
      .map((e) => taskMap.get(e.toId as string))
      .filter((t): t is Task => t !== undefined);
  }, [edges, task.id, taskMap]);

  if (dependsOn.length === 0 && blocks.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Depends on */}
      {dependsOn.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowDownRight className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Depends on
            </p>
          </div>
          <div className="space-y-0.5">
            {dependsOn.map((t) => (
              <DepRow key={t.id} task={t} isBlocking={false} />
            ))}
          </div>
        </div>
      )}

      {/* Blocks */}
      {blocks.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Blocks
            </p>
          </div>
          <div className="space-y-0.5">
            {blocks.map((t) => (
              <DepRow key={t.id} task={t} isBlocking={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
