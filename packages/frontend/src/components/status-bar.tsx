import { Bot, Circle } from "lucide-react";

export function StatusBar() {
  return (
    <footer className="flex h-8 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="font-medium">AgentOps</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Bot className="h-3 w-3" />
          0 agents
        </span>
        <span>$0.00 today</span>
        <span className="flex items-center gap-1.5">
          <Circle className="h-2 w-2 fill-status-success text-status-success" />
          Healthy
        </span>
      </div>
    </footer>
  );
}
