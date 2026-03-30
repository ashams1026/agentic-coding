import { useCallback } from "react";
import { Bot, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStats, useSelectedProject } from "@/hooks";
import { useUIStore, type ApiMode } from "@/stores/ui-store";
import { useToastStore } from "@/stores/toast-store";
import { API_BASE_URL } from "@/api/client";
import { initWsConnection } from "@/api/ws";

export function StatusBar() {
  const { projectId } = useSelectedProject();
  const { data: stats } = useDashboardStats(projectId ?? undefined);
  const apiMode = useUIStore((s) => s.apiMode);
  const setApiMode = useUIStore((s) => s.setApiMode);
  const addToast = useToastStore((s) => s.addToast);

  const activeAgents = stats?.activeAgents ?? 0;
  const todayCost = stats?.todayCostUsd ?? 0;
  const isHealthy = true; // mock: always healthy for now

  const handleToggleMode = useCallback(async () => {
    const next: ApiMode = apiMode === "mock" ? "api" : "mock";

    if (next === "api") {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
      } catch {
        addToast({
          type: "error",
          title: "Backend not running",
          description: "Start it with `pnpm --filter backend dev`",
        });
        return;
      }
    }

    setApiMode(next);
    initWsConnection();
  }, [apiMode, setApiMode, addToast]);

  return (
    <footer className="flex h-8 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="font-medium">AgentOps</span>
      </div>
      <div className="flex items-center gap-4">
        {/* API mode toggle */}
        <button
          onClick={handleToggleMode}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              apiMode === "api"
                ? "bg-emerald-500"
                : "bg-amber-500",
            )}
          />
          {apiMode === "api" ? "Live" : "Mock"}
        </button>

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
