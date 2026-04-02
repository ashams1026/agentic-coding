import { useState } from "react";
import { Bot, ChevronDown, DollarSign, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Execution } from "@agentops/shared";
import { TerminalRenderer } from "./terminal-renderer";

const outcomeBadge: Record<string, { label: string; className: string }> = {
  success: { label: "Success", className: "border-emerald-500 text-emerald-500" },
  failure: { label: "Failed", className: "border-red-500 text-red-500" },
  rejected: { label: "Rejected", className: "border-amber-500 text-amber-500" },
};

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

interface SubagentCardProps {
  execution: Execution;
  agentName: string;
  agentColor: string;
}

export function SubagentCard({ execution, agentName, agentColor }: SubagentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const outcome = execution.outcome ? outcomeBadge[execution.outcome] : null;

  return (
    <div className="ml-6 border-l-2 border-muted pl-4 py-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors"
      >
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: agentColor + "20" }}
        >
          <Bot className="h-3.5 w-3.5" style={{ color: agentColor }} />
        </div>
        <span className="text-sm font-medium truncate">{agentName}</span>
        <span className="text-xs text-muted-foreground">subagent</span>
        {outcome && (
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", outcome.className)}>
            {outcome.label}
          </Badge>
        )}
        <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5 tabular-nums">
            <Clock className="h-3 w-3" />
            {formatDuration(execution.durationMs)}
          </span>
          <span className="flex items-center gap-0.5 tabular-nums">
            <DollarSign className="h-3 w-3" />
            {execution.costUsd.toFixed(2)}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
            expanded && "rotate-180",
          )}
        />
      </button>
      {expanded && (
        <div className="mt-2 h-[200px] rounded-md border overflow-hidden">
          <TerminalRenderer executionId={execution.id} />
        </div>
      )}
    </div>
  );
}
