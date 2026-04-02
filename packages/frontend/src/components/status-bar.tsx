import { Bot, Circle, FolderOpen } from "lucide-react";
import { useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useDashboardStats, useProjectFromUrl, useHealth, useWsStatus } from "@/hooks";

export function StatusBar() {
  const { projectId, project } = useProjectFromUrl();
  const { data: stats } = useDashboardStats(projectId ?? undefined);

  const { data: health } = useHealth();
  const wsStatus = useWsStatus();
  const location = useLocation();

  const activeAgents = stats?.activeAgents ?? 0;
  const todayCost = stats?.todayCostUsd ?? 0;
  const executorMode = health?.executor;

  // Derive page label for non-project pages
  const pageLabel = projectId
    ? project?.name ?? "Loading..."
    : location.pathname.startsWith("/settings")
      ? "App Settings"
      : "Dashboard";

  return (
    <footer className="flex h-9 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        {projectId ? (
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <FolderOpen className="h-3 w-3 text-muted-foreground" />
            {pageLabel}
          </span>
        ) : (
          <span className="font-medium">{pageLabel}</span>
        )}
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
