import { useState, useMemo } from "react";
import { Bot, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExecutions, usePersonas, useWorkItems } from "@/hooks";
import { TerminalRenderer } from "./terminal-renderer";
import type { ExecutionId } from "@agentops/shared";

// ── Agent selector dropdown ───────────────────────────────────────

interface AgentSelectorProps {
  selectedId: ExecutionId | null;
  onSelect: (id: ExecutionId) => void;
}

function AgentSelector({ selectedId, onSelect }: AgentSelectorProps) {
  const { data: executions = [] } = useExecutions();
  const { data: personas = [] } = usePersonas();
  const { data: allItems = [] } = useWorkItems();

  const activeExecutions = useMemo(
    () => executions.filter((e) => e.status === "running"),
    [executions],
  );

  const personaMap = useMemo(
    () => new Map(personas.map((p) => [p.id as string, p])),
    [personas],
  );

  const workItemNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of allItems) map.set(item.id as string, item.title);
    return map;
  }, [allItems]);

  const selected = activeExecutions.find((e) => e.id === selectedId);
  const selectedPersona = selected
    ? personaMap.get(selected.personaId as string)
    : null;
  const selectedTarget = selected
    ? workItemNameMap.get(selected.workItemId as string) ?? selected.workItemId
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 max-w-[240px]"
        >
          {selectedPersona ? (
            <>
              <div
                className="flex h-4 w-4 items-center justify-center rounded-full shrink-0"
                style={{ backgroundColor: selectedPersona.avatar.color + "20" }}
              >
                <Bot
                  className="h-2.5 w-2.5"
                  style={{ color: selectedPersona.avatar.color }}
                />
              </div>
              <span className="truncate">
                {selectedPersona.name}: {selectedTarget}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Select agent</span>
          )}
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[260px]">
        {activeExecutions.map((exec) => {
          const persona = personaMap.get(exec.personaId as string);
          const target =
            workItemNameMap.get(exec.workItemId as string) ?? exec.workItemId;
          return (
            <DropdownMenuItem
              key={exec.id}
              onClick={() => onSelect(exec.id)}
              className="gap-2"
            >
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full shrink-0"
                style={{
                  backgroundColor: (persona?.avatar.color ?? "#6b7280") + "20",
                }}
              >
                <Bot
                  className="h-3 w-3"
                  style={{ color: persona?.avatar.color ?? "#6b7280" }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">
                  {persona?.name ?? "Agent"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {target}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}
        {activeExecutions.length === 0 && (
          <DropdownMenuItem disabled>No agents running</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Single pane ───────────────────────────────────────────────────

interface PaneProps {
  defaultExecutionId: ExecutionId | null;
}

function Pane({ defaultExecutionId }: PaneProps) {
  const [selectedId, setSelectedId] = useState<ExecutionId | null>(
    defaultExecutionId,
  );

  // If default changes and current selection is null, pick the new default
  const effectiveId = selectedId ?? defaultExecutionId;

  return (
    <div className="flex flex-col min-w-0 min-h-0 border-r last:border-r-0">
      {/* Pane header with agent selector */}
      <div className="flex items-center px-2 py-1.5 border-b bg-muted/30">
        <AgentSelector
          selectedId={effectiveId}
          onSelect={setSelectedId}
        />
      </div>

      {/* Terminal output */}
      <div className="flex-1 min-h-0">
        {effectiveId ? (
          <TerminalRenderer executionId={effectiveId} />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted/10">
            <p className="text-xs text-muted-foreground">Select an agent above</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main split view ───────────────────────────────────────────────

interface SplitViewProps {
  activeExecutionIds: ExecutionId[];
}

export function SplitView({ activeExecutionIds }: SplitViewProps) {
  // Default: assign first N executions to panes
  const paneCount = Math.min(activeExecutionIds.length, 3);
  // Always show at least 2 panes in split view
  const effectivePaneCount = Math.max(paneCount, 2);

  return (
    <div
      className="flex h-full split-view-grid"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${effectivePaneCount}, 1fr)`,
      }}
    >
      {Array.from({ length: effectivePaneCount }, (_, i) => (
        <Pane
          key={i}
          defaultExecutionId={activeExecutionIds[i] ?? null}
        />
      ))}
    </div>
  );
}
