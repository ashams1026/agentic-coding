import { Bot, Circle, Zap } from "lucide-react";
import { Link } from "react-router";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDashboardStats, useSelectedProject, useHealth, useWsStatus, useWorkflows } from "@/hooks";

export function StatusBar() {
  const { projectId } = useSelectedProject();
  const { data: stats } = useDashboardStats(projectId ?? undefined);
  const { data: workflows } = useWorkflows(projectId ?? undefined);

  const { data: health } = useHealth();
  const wsStatus = useWsStatus();

  const activeAgents = stats?.activeAgents ?? 0;
  const todayCost = stats?.todayCostUsd ?? 0;
  const executorMode = health?.executor;

  const activeAutomations = (workflows ?? []).filter((w) => w.autoRouting).length;

  return (
    <footer className="flex h-9 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="font-medium">Woof</span>
      </div>
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/automations"
              className={cn(
                "flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Zap
                className={cn(
                  "h-3 w-3",
                  activeAutomations > 0 ? "text-emerald-500" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  activeAutomations > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                )}
              >
                {activeAutomations} active
              </span>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            {activeAutomations > 0
              ? `${activeAutomations} automation${activeAutomations !== 1 ? "s" : ""} running — click to manage`
              : "No automations active — click to manage"}
          </TooltipContent>
        </Tooltip>
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
        {executorMode === "mock" && (
          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-600 dark:text-amber-400 font-medium">
            Simulated
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {wsStatus === "reconnecting" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            )}
            <Circle
              className={cn(
                "relative h-2 w-2",
                wsStatus === "connected" && "fill-status-success text-status-success",
                wsStatus === "reconnecting" && "fill-amber-500 text-amber-500",
                wsStatus === "disconnected" && "fill-status-error text-status-error",
              )}
            />
          </span>
          {wsStatus === "connected" && "Connected"}
          {wsStatus === "reconnecting" && "Reconnecting"}
          {wsStatus === "disconnected" && "Disconnected"}
        </span>
      </div>
    </footer>
  );
}
