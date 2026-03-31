import { Play, Pause, Bot, Circle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDashboardStats, useSelectedProject, useProjects, useUpdateProject } from "@/hooks";

export function StatusBar() {
  const { projectId } = useSelectedProject();
  const { data: stats } = useDashboardStats(projectId ?? undefined);
  const { data: projectsList } = useProjects();
  const updateProject = useUpdateProject();

  const project = projectsList?.[0];
  const settings = project?.settings as Record<string, unknown> | undefined;
  const autoRouting = settings?.autoRouting !== false;

  const activeAgents = stats?.activeAgents ?? 0;
  const todayCost = stats?.todayCostUsd ?? 0;
  const isHealthy = true; // TODO: wire to real health check

  const handleToggleRouting = () => {
    if (!project) return;
    updateProject.mutate({
      id: project.id,
      settings: { ...project.settings, autoRouting: !autoRouting },
    });
  };

  return (
    <footer className="flex h-8 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="font-medium">AgentOps</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleToggleRouting}
              disabled={!project}
              className={cn(
                "flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors disabled:opacity-50",
                autoRouting
                  ? "text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400"
                  : "text-amber-600 hover:bg-amber-500/15 dark:text-amber-400",
              )}
            >
              {autoRouting ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {autoRouting
              ? "Auto-routing: active — agents automatically transition work items"
              : "Auto-routing: paused — manual transitions only"}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {activeAgents > 0 && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <Bot className={cn(
              "relative h-3 w-3",
              activeAgents > 0 ? "text-emerald-500" : "text-muted-foreground",
            )} />
          </span>
          {activeAgents} agent{activeAgents !== 1 ? "s" : ""}
        </span>
        <span>${todayCost.toFixed(2)} today</span>
        <span className="flex items-center gap-1.5">
          <Circle
            className={cn(
              "h-2 w-2",
              isHealthy
                ? "fill-status-success text-status-success"
                : "fill-status-error text-status-error",
            )}
          />
          {isHealthy ? "Healthy" : "Unhealthy"}
        </span>
      </div>
    </footer>
  );
}
