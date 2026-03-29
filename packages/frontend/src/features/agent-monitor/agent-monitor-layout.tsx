import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Bot, Monitor, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useExecutions, usePersonas, useTasks, useStories } from "@/hooks";
import type { Execution, ExecutionId } from "@agentops/shared";

// ── Empty state ────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Monitor className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No agents running</p>
          <p className="text-xs text-muted-foreground mt-1">
            Agents start when stories move through workflow states.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/board">
            Go to Story Board
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ── Sidebar agent entry ────────────────────────────────────────

interface AgentEntryProps {
  personaName: string;
  personaColor: string;
  targetName: string;
  isSelected: boolean;
  onSelect: () => void;
}

function AgentEntry({
  personaName,
  personaColor,
  targetName,
  isSelected,
  onSelect,
}: AgentEntryProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50"
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Persona avatar */}
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: personaColor + "20" }}
        >
          <Bot className="h-3.5 w-3.5" style={{ color: personaColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{personaName}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {targetName}
          </p>
        </div>
        {/* Status dot */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
      </div>
    </button>
  );
}

// ── Selected agent placeholder ─────────────────────────────────

function SelectedAgentPlaceholder({ execution, personaName }: { execution: Execution; personaName: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium">{personaName}</p>
        <p className="text-xs text-muted-foreground">
          Agent output will stream here.
        </p>
        <p className="text-[10px] font-mono text-muted-foreground/70">
          {execution.id}
        </p>
      </div>
    </div>
  );
}

// ── Main layout ────────────────────────────────────────────────

export function AgentMonitorLayout() {
  const { data: executions = [] } = useExecutions();
  const { data: personas = [] } = usePersonas();
  const { data: tasks = [] } = useTasks();
  const { data: stories = [] } = useStories();

  const [selectedId, setSelectedId] = useState<ExecutionId | null>(null);

  // Active (running) executions
  const activeExecutions = useMemo(
    () =>
      executions
        .filter((e) => e.status === "running")
        .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()),
    [executions],
  );

  // Lookup maps
  const personaMap = useMemo(
    () => new Map(personas.map((p) => [p.id as string, p])),
    [personas],
  );

  const targetNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) map.set(t.id as string, t.title);
    for (const s of stories) map.set(s.id as string, s.title);
    return map;
  }, [tasks, stories]);

  // Auto-select first agent if none selected or selection no longer valid
  const effectiveSelectedId = useMemo(() => {
    if (selectedId && activeExecutions.some((e) => e.id === selectedId)) {
      return selectedId;
    }
    return activeExecutions.length > 0 ? activeExecutions[0]!.id : null;
  }, [selectedId, activeExecutions]);

  const selectedExecution = useMemo(
    () => activeExecutions.find((e) => e.id === effectiveSelectedId),
    [activeExecutions, effectiveSelectedId],
  );

  // No active agents — full empty state
  if (activeExecutions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex h-full">
      {/* Left sidebar — active agents list */}
      <div className="w-[250px] shrink-0 border-r flex flex-col">
        <div className="px-3 py-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Active Agents
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {activeExecutions.length} running
          </p>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {activeExecutions.map((exec) => {
              const persona = personaMap.get(exec.personaId as string);
              return (
                <AgentEntry
                  key={exec.id}
                  personaName={persona?.name ?? "Agent"}
                  personaColor={persona?.avatar.color ?? "#6b7280"}
                  targetName={targetNameMap.get(exec.targetId as string) ?? exec.targetId}
                  isSelected={exec.id === effectiveSelectedId}
                  onSelect={() => setSelectedId(exec.id)}
                />
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main area — selected agent output */}
      <div className="flex-1 min-w-0">
        {selectedExecution ? (
          <SelectedAgentPlaceholder
            execution={selectedExecution}
            personaName={
              personaMap.get(selectedExecution.personaId as string)?.name ?? "Agent"
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Select an agent from the sidebar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
