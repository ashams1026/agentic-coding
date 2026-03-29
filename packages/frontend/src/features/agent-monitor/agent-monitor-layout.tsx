import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Monitor, ArrowRight, Columns2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExecutions } from "@/hooks";
import { ActiveAgentSidebar } from "./active-agent-sidebar";
import { TerminalRenderer } from "./terminal-renderer";
import { SplitView } from "./split-view";
import type { ExecutionId } from "@agentops/shared";

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

// ── Main layout ────────────────────────────────────────────────

export function AgentMonitorLayout() {
  const { data: executions = [] } = useExecutions();

  const [selectedId, setSelectedId] = useState<ExecutionId | null>(null);
  const [splitMode, setSplitMode] = useState(false);

  // Active (running) executions
  const activeExecutions = useMemo(
    () => executions.filter((e) => e.status === "running"),
    [executions],
  );

  const activeExecutionIds = useMemo(
    () => activeExecutions.map((e) => e.id),
    [activeExecutions],
  );

  // Auto-select first agent if none selected or selection no longer valid
  const effectiveSelectedId = useMemo(() => {
    if (selectedId && activeExecutions.some((e) => e.id === selectedId)) {
      return selectedId;
    }
    return activeExecutions.length > 0 ? activeExecutions[0]!.id : null;
  }, [selectedId, activeExecutions]);

  // No active agents — full empty state
  if (activeExecutions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex h-full">
      {/* Left sidebar — active agents list (hidden in split mode) */}
      {!splitMode && (
        <ActiveAgentSidebar
          selectedId={effectiveSelectedId}
          onSelect={setSelectedId}
        />
      )}

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col relative">
        {/* View toggle bar */}
        <div className="flex items-center justify-end px-3 py-1.5 border-b bg-muted/20">
          <Button
            variant={splitMode ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setSplitMode(!splitMode)}
          >
            {splitMode ? (
              <>
                <Square className="h-3.5 w-3.5" />
                Single view
              </>
            ) : (
              <>
                <Columns2 className="h-3.5 w-3.5" />
                Split view
              </>
            )}
          </Button>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0">
          {splitMode ? (
            <SplitView activeExecutionIds={activeExecutionIds} />
          ) : effectiveSelectedId ? (
            <TerminalRenderer executionId={effectiveSelectedId} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Select an agent from the sidebar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
