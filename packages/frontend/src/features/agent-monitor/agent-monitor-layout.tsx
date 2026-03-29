import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Monitor, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExecutions, usePersonas } from "@/hooks";
import { ActiveAgentSidebar } from "./active-agent-sidebar";
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

  const [selectedId, setSelectedId] = useState<ExecutionId | null>(null);

  // Active (running) executions
  const activeExecutions = useMemo(
    () => executions.filter((e) => e.status === "running"),
    [executions],
  );

  // Lookup maps
  const personaMap = useMemo(
    () => new Map(personas.map((p) => [p.id as string, p])),
    [personas],
  );

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
      <ActiveAgentSidebar
        selectedId={effectiveSelectedId}
        onSelect={setSelectedId}
      />

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
