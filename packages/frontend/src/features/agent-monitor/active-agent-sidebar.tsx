import { useEffect, useState, useMemo } from "react";
import { Bot, DollarSign } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useExecutions, useAgents, useWorkItems, useProjectFromUrl } from "@/hooks";
import type { Execution, ExecutionId } from "@agentops/shared";

// ── Helpers ────────────────────────────────────────────────────

function formatElapsed(startedAt: string): string {
  const elapsed = Date.now() - new Date(startedAt).getTime();
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

// ── Agent entry with live counters ─────────────────────────────

interface AgentEntryProps {
  execution: Execution;
  agentName: string;
  agentColor: string;
  targetName: string;
  isSelected: boolean;
  onSelect: () => void;
}

function AgentEntry({
  execution,
  agentName,
  agentColor,
  targetName,
  isSelected,
  onSelect,
}: AgentEntryProps) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(execution.startedAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(execution.startedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [execution.startedAt]);

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Agent avatar with status dot */}
        <div className="relative shrink-0 mt-0.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: agentColor + "20" }}
          >
            <Bot className="h-4 w-4" style={{ color: agentColor }} />
          </div>
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{agentName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {targetName}
          </p>
          {/* Live counters */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground tabular-nums">
              {elapsed}
            </span>
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground tabular-nums">
              <DollarSign className="h-2.5 w-2.5" />
              {formatCost(execution.costUsd)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Main sidebar component ─────────────────────────────────────

interface ActiveAgentSidebarProps {
  selectedId: ExecutionId | null;
  onSelect: (id: ExecutionId) => void;
}

export function ActiveAgentSidebar({ selectedId, onSelect }: ActiveAgentSidebarProps) {
  const { projectId } = useProjectFromUrl();
  const { data: executions = [] } = useExecutions(undefined, projectId ?? undefined);
  const { data: agents = [] } = useAgents();
  const { data: allItems = [] } = useWorkItems(undefined, projectId ?? undefined);

  // Active (running) executions, sorted by start time
  const activeExecutions = useMemo(
    () =>
      executions
        .filter((e) => e.status === "running")
        .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()),
    [executions],
  );

  // Lookup maps
  const agentMap = useMemo(
    () => new Map(agents.map((p) => [p.id as string, p])),
    [agents],
  );

  const workItemNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of allItems) map.set(item.id as string, item.title);
    return map;
  }, [allItems]);

  return (
    <div className="w-[250px] shrink-0 border-r flex flex-col">
      <div className="px-3 py-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Active Agents
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {activeExecutions.length} running
        </p>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {activeExecutions.map((exec) => {
            const agent = agentMap.get(exec.agentId as string);
            return (
              <AgentEntry
                key={exec.id}
                execution={exec}
                agentName={agent?.name ?? "Agent"}
                agentColor={agent?.avatar.color ?? "#6b7280"}
                targetName={exec.workItemId ? (workItemNameMap.get(exec.workItemId as string) ?? exec.workItemId) : "Standalone"}
                isSelected={exec.id === selectedId}
                onSelect={() => onSelect(exec.id)}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
