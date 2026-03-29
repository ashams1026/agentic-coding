import { Bot, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStats } from "@/hooks";

export function StatusBar() {
  const { data: stats } = useDashboardStats();

  const activeAgents = stats?.activeAgents ?? 0;
  const todayCost = stats?.todayCostUsd ?? 0;
  const isHealthy = true; // mock: always healthy for now

  return (
    <footer className="flex h-8 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="font-medium">AgentOps</span>
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
