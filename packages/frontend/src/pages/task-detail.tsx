import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, Bot, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTask, useStories, usePersonas } from "@/hooks";
import { CommentStream } from "@/features/story-detail/comment-stream";
import { ExecutionTimeline } from "@/features/story-detail/execution-timeline";
import { InheritedContext } from "@/features/task-detail/inherited-context";
import { DependencyInfo } from "@/features/task-detail/dependency-info";
import type { TaskId } from "@agentops/shared";
import { useMemo } from "react";

// ── State badge config ──────────────────────────────────────────

const stateColors: Record<string, string> = {
  Pending: "text-slate-500",
  Running: "text-emerald-600 dark:text-emerald-400",
  Review: "text-amber-600 dark:text-amber-400",
  Done: "text-green-600 dark:text-green-400",
};

// ── Page component ──────────────────────────────────────────────

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(id as TaskId);
  const { data: stories = [] } = useStories();
  const { data: personas = [] } = usePersonas();

  const story = useMemo(
    () => (task ? stories.find((s) => s.id === task.storyId) : undefined),
    [stories, task],
  );

  const persona = useMemo(() => {
    if (!task?.assignedPersonaId) return undefined;
    return personas.find((p) => p.id === task.assignedPersonaId);
  }, [task?.assignedPersonaId, personas]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading task...</p>
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
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6 space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back
        </Button>

        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">{task.title}</h1>

          <div className="flex flex-wrap items-center gap-3">
            {/* State badge */}
            <Badge variant="outline" className={`text-xs ${stateColor}`}>
              {task.currentState}
            </Badge>

            {/* Assigned persona */}
            {persona && (
              <span className="flex items-center gap-1.5 text-sm">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: persona.avatar.color + "20" }}
                >
                  <Bot
                    className="h-3 w-3"
                    style={{ color: persona.avatar.color }}
                  />
                </span>
                <span className="text-muted-foreground">{persona.name}</span>
              </span>
            )}

            {/* Parent story link */}
            {story && (
              <Link
                to={`/stories/${story.id}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {story.title}
              </Link>
            )}
          </div>
        </div>

        <Separator />

        {/* Content sections */}
        <div className="space-y-6">
          {/* Description */}
          {task.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Description
              </p>
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Inherited context */}
          <InheritedContext task={task} story={story} />
          <DependencyInfo task={task} />
          <div className="rounded-lg border border-dashed p-6">
            <p className="text-sm text-muted-foreground">
              Execution context — T2.4.4
            </p>
          </div>
          <div className="rounded-lg border border-dashed p-6">
            <p className="text-sm text-muted-foreground">
              Rejection history — T2.4.5
            </p>
          </div>

          {/* Reused components */}
          <CommentStream targetId={task.id} targetType="task" />
          <ExecutionTimeline targetId={task.id} />
        </div>
      </div>
    </div>
  );
}
