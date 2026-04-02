import { useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWorkItems, useAgents, useExecutions, useSelectedProject, useAgentAssignments } from "@/hooks";
import { useWorkflowStates } from "@/hooks/use-workflows";
import { useWorkItemsStore } from "@/stores/work-items-store";
import type { WorkItem, Agent, WorkItemId, Priority } from "@agentops/shared";

// ── Priority config ─────────────────────────────────────────────

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  p0: { label: "P0", color: "text-red-600 dark:text-red-400" },
  p1: { label: "P1", color: "text-amber-600 dark:text-amber-400" },
  p2: { label: "P2", color: "text-blue-600 dark:text-blue-400" },
  p3: { label: "P3", color: "text-slate-500 dark:text-slate-400" },
};

// ── Avatar stack ────────────────────────────────────────────────

function AvatarStack({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) return null;
  return (
    <div className="flex -space-x-1.5">
      {agents.slice(0, 3).map((p) => (
        <div
          key={p.id}
          className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-white ring-1 ring-background"
          style={{ backgroundColor: p.avatar.color }}
          title={p.name}
        >
          {p.name.charAt(0)}
        </div>
      ))}
      {agents.length > 3 && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-1 ring-background">
          +{agents.length - 3}
        </div>
      )}
    </div>
  );
}

// ── Progress bar ────────────────────────────────────────────────

function ProgressBar({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
        <span>{done}/{total} items</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: pct === 100 ? "#16a34a" : "#2563eb",
          }}
        />
      </div>
    </div>
  );
}

// ── State node data ─────────────────────────────────────────────

interface StateNodeData {
  items: WorkItem[];
  activeAgentCount: number;
  activeAgentProfiles: Agent[];
  assignedAgents: Agent[];
  childrenDone: number;
  childrenTotal: number;
}

// ── Router pill (between states) ────────────────────────────────

function RouterPill() {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="flex h-6 items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 text-indigo-600 dark:text-indigo-400">
        <svg viewBox="0 0 8 8" className="h-2 w-2 fill-current">
          <polygon points="4,0 8,4 4,8 0,4" />
        </svg>
        <span className="text-[10px] font-medium">Router</span>
      </div>
    </div>
  );
}

// ── Down arrow connector ────────────────────────────────────────

function DownArrow() {
  return (
    <div className="flex justify-center">
      <div className="flex flex-col items-center">
        <div className="h-3 w-px bg-border" />
        <svg viewBox="0 0 8 6" className="h-1.5 w-2 text-border fill-current">
          <polygon points="0,0 8,0 4,6" />
        </svg>
      </div>
    </div>
  );
}

// ── State node card ─────────────────────────────────────────────

function StateNodeCard({
  stateName,
  stateColor,
  data,
  isSelected,
  onClick,
}: {
  stateName: string;
  stateColor: string;
  data: StateNodeData;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full max-w-xs rounded-lg border bg-card text-left transition-all hover:shadow-md hover:border-primary/30 overflow-hidden",
        isSelected && "ring-2 ring-primary border-primary shadow-md",
      )}
    >
      {/* Colored header */}
      <div
        className="px-3 py-1.5 flex items-center justify-between"
        style={{ backgroundColor: stateColor + "20" }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: stateColor }}
          />
          <span className="text-xs font-semibold truncate">{stateName}</span>
        </div>
        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 shrink-0">
          {data.items.length}
        </Badge>
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-2">
        {/* Active agents row */}
        <div className="flex items-center justify-between min-h-[20px]">
          <div className="flex items-center gap-1.5">
            {data.activeAgentCount > 0 ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {data.activeAgentCount} active
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">idle</span>
            )}
          </div>
          <AvatarStack agents={data.assignedAgents.length > 0 ? data.assignedAgents : data.activeAgentProfiles} />
        </div>

        {/* Progress bar */}
        <ProgressBar done={data.childrenDone} total={data.childrenTotal} />
      </div>
    </button>
  );
}

// ── Filtered items list ─────────────────────────────────────────

function FilteredItemsList({
  items,
  agentMap,
  selectedItemId,
  onSelect,
}: {
  items: WorkItem[];
  agentMap: Map<string, Agent>;
  selectedItemId: WorkItemId | null;
  onSelect: (id: WorkItemId) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic py-2">
        No items in this state.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const agent = item.assignedAgentId
          ? agentMap.get(item.assignedAgentId)
          : null;
        const pCfg = priorityConfig[item.priority];
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/50",
              selectedItemId === item.id && "bg-accent",
            )}
          >
            <span className={cn("text-xs font-semibold shrink-0", pCfg.color)}>
              {pCfg.label}
            </span>
            <span className="text-sm truncate flex-1">{item.title}</span>
            {agent && (
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: agent.avatar.color }}
              >
                {agent.name.charAt(0)}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Main flow view ──────────────────────────────────────────────

export function FlowView() {
  const { projectId, project } = useSelectedProject();
  const workflowId = project?.workflowId ?? null;
  const { data: workflowStatesData } = useWorkflowStates(workflowId);
  const { data: allItems, isLoading } = useWorkItems(undefined, projectId ?? undefined);
  const { data: agents } = useAgents();
  const { data: executions } = useExecutions(undefined, projectId ?? undefined);
  const { data: assignments } = useAgentAssignments(projectId);
  const { filterState, setFilterState, selectedItemId, setSelectedItemId } =
    useWorkItemsStore();

  // Dynamic workflow states (from DB or fallback)
  const mainStates = useMemo(() => {
    if (!workflowStatesData) return [];
    return workflowStatesData.filter((s) => s.name.toLowerCase() !== "blocked");
  }, [workflowStatesData]);

  const blockedState = useMemo(() => {
    return workflowStatesData?.find((s) => s.name.toLowerCase() === "blocked") ?? null;
  }, [workflowStatesData]);

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    agents?.forEach((p) => map.set(p.id, p));
    return map;
  }, [agents]);

  // Map state → assigned agents (from agent assignments)
  const stateAgentMap = useMemo(() => {
    const map = new Map<string, Agent[]>();
    if (!assignments) return map;
    for (const a of assignments) {
      const agent = agentMap.get(a.agentId);
      if (agent) {
        const list = map.get(a.stateName) ?? [];
        list.push(agent);
        map.set(a.stateName, list);
      }
    }
    return map;
  }, [assignments, agentMap]);

  // Compute per-state data
  const stateData = useMemo(() => {
    const map = new Map<string, StateNodeData>();

    for (const state of (workflowStatesData ?? [])) {
      map.set(state.name, {
        items: [],
        activeAgentCount: 0,
        activeAgentProfiles: [],
        assignedAgents: stateAgentMap.get(state.name) ?? [],
        childrenDone: 0,
        childrenTotal: 0,
      });
    }

    if (!allItems) return map;

    // Group items by state
    for (const item of allItems) {
      const data = map.get(item.currentState);
      if (data) data.items.push(item);
    }

    // Active agents from running executions
    if (executions) {
      const itemStateMap = new Map<string, string>();
      allItems.forEach((i) => itemStateMap.set(i.id, i.currentState));

      const activeByState = new Map<string, Set<string>>();
      for (const exec of executions) {
        if (exec.status === "running") {
          const state = exec.workItemId ? itemStateMap.get(exec.workItemId) : undefined;
          if (state) {
            const set = activeByState.get(state) ?? new Set();
            set.add(exec.agentId);
            activeByState.set(state, set);
          }
        }
      }

      for (const [state, agentIds] of activeByState) {
        const data = map.get(state);
        if (data) {
          data.activeAgentCount = agentIds.size;
          data.activeAgentProfiles = [...agentIds]
            .map((pid) => agentMap.get(pid))
            .filter((p): p is Agent => !!p);
        }
      }
    }

    // Child progress
    const childStats = new Map<string, { done: number; total: number }>();
    for (const item of allItems) {
      if (!item.parentId) continue;
      const stats = childStats.get(item.parentId) ?? { done: 0, total: 0 };
      stats.total++;
      if (item.currentState === "Done") stats.done++;
      childStats.set(item.parentId, stats);
    }

    for (const [, data] of map) {
      let done = 0;
      let total = 0;
      for (const item of data.items) {
        const stats = childStats.get(item.id);
        if (stats) {
          done += stats.done;
          total += stats.total;
        }
      }
      data.childrenDone = done;
      data.childrenTotal = total;
    }

    return map;
  }, [allItems, executions, agentMap, stateAgentMap, workflowStatesData]);

  const handleNodeClick = useCallback(
    (stateName: string) => {
      setFilterState(filterState === stateName ? null : stateName);
    },
    [filterState, setFilterState],
  );

  // Items in the filtered state
  const filteredItems = useMemo(() => {
    if (!filterState) return [];
    return stateData.get(filterState)?.items ?? [];
  }, [filterState, stateData]);

  // Index of "Blocked" branching point (roughly mid-pipeline)
  const blockedBranchIndex: number = useMemo(() => {
    // Place the blocked branch approximately in the middle of the pipeline
    return Math.max(1, Math.floor(mainStates.length / 2));
  }, [mainStates]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          {mainStates.slice(0, 4).map((s) => (
            <div
              key={s.name}
              className="rounded-lg bg-muted/30 animate-pulse"
              style={{ width: 280, height: 72 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-y-auto">
      {/* Main vertical pipeline */}
      <div className="flex-1 flex flex-col items-center py-4 min-w-0">
        <div className="flex">
          {/* Main column */}
          <div className="flex flex-col items-center" style={{ width: 280 }}>
            {mainStates.map((state, i) => {
              const data = stateData.get(state.name);
              if (!data) return null;
              return (
                <div key={state.name} className="flex flex-col items-center w-full">
                  <StateNodeCard
                    stateName={state.name}
                    stateColor={state.color}
                    data={data}
                    isSelected={filterState === state.name}
                    onClick={() => handleNodeClick(state.name)}
                  />
                  {/* Arrow + Router between states */}
                  {i < mainStates.length - 1 && (
                    <div className="flex flex-col items-center">
                      <DownArrow />
                      <RouterPill />
                      <DownArrow />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Blocked branch — positioned to the right */}
          <div className="relative" style={{ width: 180 }}>
            {/* Dashed horizontal connector from main column to Blocked */}
            <div
              className="absolute left-0"
              style={{
                // Position at the branching point: after the Nth state node + connectors
                // Each state node is ~72px, each connector section is ~48px
                top: blockedBranchIndex * (72 + 48) + 36, // center of the source state
              }}
            >
              <div className="flex items-center">
                <div className="w-8 border-t-2 border-dashed border-red-400/40" />
                <svg viewBox="0 0 6 8" className="h-2 w-1.5 text-red-400/40 fill-current -ml-px">
                  <polygon points="0,0 6,4 0,8" />
                </svg>
              </div>
            </div>

            {/* Blocked state card */}
            <div
              className="absolute left-10"
              style={{
                top: blockedBranchIndex * (72 + 48) + 12,
                width: 160,
              }}
            >
              {(() => {
                if (!blockedState) return null;
                const data = stateData.get(blockedState.name);
                if (!data) return null;
                return (
                  <button
                    onClick={() => handleNodeClick(blockedState.name)}
                    className={cn(
                      "w-full rounded-lg border border-dashed border-red-300 dark:border-red-800 bg-card text-left transition-all hover:shadow-md hover:border-red-400 overflow-hidden",
                      filterState === blockedState.name && "ring-2 ring-red-500 border-red-500 shadow-md",
                    )}
                  >
                    <div
                      className="px-3 py-1.5 flex items-center justify-between"
                      style={{ backgroundColor: blockedState.color + "15" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: blockedState.color }}
                        />
                        <span className="text-xs font-semibold">Blocked</span>
                      </div>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                        {data.items.length}
                      </Badge>
                    </div>
                    <div className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        {data.items.length > 0 ? (
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                            {data.items.length} blocked
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">none</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Filtered items panel (shown when a state is selected) */}
      {filterState && (
        <div className="border-l pl-4 pr-2 w-64 shrink-0 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2 pt-4">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: workflowStatesData?.find(
                  (s) => s.name === filterState,
                )?.color ?? "#6b7280",
              }}
            />
            <span className="text-sm font-medium">{filterState}</span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {filteredItems.length}
            </Badge>
          </div>
          <FilteredItemsList
            items={filteredItems}
            agentMap={agentMap}
            selectedItemId={selectedItemId}
            onSelect={setSelectedItemId}
          />
        </div>
      )}
    </div>
  );
}
