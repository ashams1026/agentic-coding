import { useMemo } from "react";
import { X, ExternalLink, ChevronRight, Bot } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTask, useStories, usePersonas } from "@/hooks";
import { CommentStream } from "@/features/common/comment-stream";
import { ExecutionTimeline } from "@/features/common/execution-timeline";
import { InheritedContext } from "@/features/task-detail/inherited-context";
import { DependencyInfo } from "@/features/task-detail/dependency-info";
import { ExecutionContextViewer } from "@/features/task-detail/execution-context";
import { RejectionHistory } from "@/features/task-detail/rejection-history";
import type { TaskId, StoryId } from "@agentops/shared";

// ── State colors ────────────────────────────────────────────────

const stateColors: Record<string, string> = {
  Pending: "text-slate-500",
  Running: "text-emerald-600 dark:text-emerald-400",
  Review: "text-amber-600 dark:text-amber-400",
  Done: "text-green-600 dark:text-green-400",
};

// ── Component ───────────────────────────────────────────────────

interface TaskDetailSidePanelProps {
  taskId: TaskId;
  parentStoryId: StoryId;
  onBack: () => void;
  onClose: () => void;
}

export function TaskDetailSidePanel({ taskId, parentStoryId, onBack, onClose }: TaskDetailSidePanelProps) {
  const { data: task, isLoading } = useTask(taskId);
  const { data: stories = [] } = useStories();
  const { data: personas = [] } = usePersonas();

  const story = useMemo(
    () => stories.find((s) => s.id === parentStoryId),
    [stories, parentStoryId],
  );

  const persona = useMemo(() => {
    if (!task?.assignedPersonaId) return undefined;
    return personas.find((p) => p.id === task.assignedPersonaId);
  }, [task?.assignedPersonaId, personas]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Task not found.</p>
      </div>
    );
  }

  const stateColor = stateColors[task.currentState] ?? "text-slate-500";

  return (
    <div className="flex h-full flex-col">
      {/* Panel header with breadcrumb */}
      <div className="border-b px-4 py-2.5 shrink-0 space-y-1.5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <button
            onClick={onBack}
            className="hover:text-foreground transition-colors truncate max-w-[200px]"
          >
            {story?.title ?? "Story"}
          </button>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate font-medium text-foreground">{task.title}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold truncate">{task.title}</span>
          <div className="flex items-center gap-1 shrink-0">
            <Link to={`/tasks/${task.id}`}>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Task header info */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className={`text-xs ${stateColor}`}>
              {task.currentState}
            </Badge>
            {persona && (
              <span className="flex items-center gap-1.5 text-sm">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: persona.avatar.color + "20" }}
                >
                  <Bot className="h-3 w-3" style={{ color: persona.avatar.color }} />
                </span>
                <span className="text-muted-foreground">{persona.name}</span>
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <Separator />

          {/* Task detail components */}
          <InheritedContext task={task} story={story} />
          <DependencyInfo task={task} />
          <ExecutionContextViewer task={task} />
          <RejectionHistory task={task} />
          <CommentStream targetId={task.id} targetType="task" />
          <ExecutionTimeline targetId={task.id} />
        </div>
      </ScrollArea>
    </div>
  );
}
