import { useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useWorkItems, usePersonas, useExecutions, useSelectedProject } from "@/hooks";
import { useWorkItemsStore } from "@/stores/work-items-store";
import { WORKFLOW } from "@agentops/shared";
import type { WorkItem, Persona, WorkItemId, Priority } from "@agentops/shared";

// ── Layout constants ─────────────────────────────────────────────

const NODE_W = 168;
const NODE_H = 130;
const GAP_X = 40;
const GAP_Y = 64;
const PAD = 24;

// ── Static layout (computed once at module level) ────────────────

const mainStates = WORKFLOW.states.filter((s) => s.name !== "Blocked");
const TOTAL_MAIN_W =
  mainStates.length * NODE_W + (mainStates.length - 1) * GAP_X;

const positions = new Map<string, { x: number; y: number }>();
mainStates.forEach((s, i) => {
  positions.set(s.name, { x: PAD + i * (NODE_W + GAP_X), y: PAD });
});
positions.set("Blocked", {
  x: PAD + TOTAL_MAIN_W / 2 - NODE_W / 2,
  y: PAD + NODE_H + GAP_Y,
});

const CANVAS_W = PAD * 2 + TOTAL_MAIN_W;
const CANVAS_H = PAD * 2 + NODE_H * 2 + GAP_Y;

// ── Arrow path computation ───────────────────────────────────────

function computeArrowPath(from: string, to: string): string | null {
  const fp = positions.get(from);
  const tp = positions.get(to);
  if (!fp || !tp) return null;

  const sameRow = fp.y === tp.y;

  if (sameRow) {
    const isForward = tp.x > fp.x;
    if (isForward) {
      // Forward: right edge → left edge, curve up slightly for non-adjacent
      const x1 = fp.x + NODE_W;
      const y1 = fp.y + NODE_H / 2;
      const x2 = tp.x;
      const y2 = tp.y + NODE_H / 2;
      const dist = x2 - x1;
      const cpY = dist > GAP_X + 10 ? -16 : 0;
      return `M ${x1} ${y1} C ${x1 + 20} ${y1 + cpY}, ${x2 - 20} ${y2 + cpY}, ${x2} ${y2}`;
    }
    // Backward: smooth arc below the main row
    const x1 = fp.x + NODE_W / 2;
    const y1 = fp.y + NODE_H;
    const x2 = tp.x + NODE_W / 2;
    const y2 = tp.y + NODE_H;
    const arcY = y1 + 30;
    return `M ${x1} ${y1} C ${x1} ${arcY}, ${x2} ${arcY}, ${x2} ${y2}`;
  }

  if (tp.y > fp.y) {
    // Down to Blocked
    const x1 = fp.x + NODE_W / 2;
    const y1 = fp.y + NODE_H;
    const x2 = tp.x + NODE_W / 2;
    const y2 = tp.y;
    return `M ${x1} ${y1} C ${x1} ${y1 + 25}, ${x2} ${y2 - 25}, ${x2} ${y2}`;
  }

  // Up from Blocked
  const x1 = fp.x + NODE_W / 2;
  const y1 = fp.y;
  const x2 = tp.x + NODE_W / 2;
  const y2 = tp.y + NODE_H;
  return `M ${x1} ${y1} C ${x1} ${y1 - 25}, ${x2} ${y2 + 25}, ${x2} ${y2}`;
}

// Precompute all arrows
const arrows: { key: string; d: string }[] = [];
for (const [from, tos] of Object.entries(WORKFLOW.transitions)) {
  for (const to of tos) {
    const d = computeArrowPath(from, to);
    if (d) arrows.push({ key: `${from}-${to}`, d });
  }
}

// ── Priority config ──────────────────────────────────────────────

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  p0: { label: "P0", color: "text-red-600 dark:text-red-400" },
  p1: { label: "P1", color: "text-amber-600 dark:text-amber-400" },
  p2: { label: "P2", color: "text-blue-600 dark:text-blue-400" },
  p3: { label: "P3", color: "text-slate-500 dark:text-slate-400" },
};

// ── Avatar stack ─────────────────────────────────────────────────

function AvatarStack({ personas }: { personas: Persona[] }) {
  if (personas.length === 0) return null;
  return (
    <div className="flex -space-x-1.5">
      {personas.slice(0, 3).map((p) => (
        <div
          key={p.id}
          className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-white ring-1 ring-background"
          style={{ backgroundColor: p.avatar.color }}
          title={p.name}
        >
          {p.name.charAt(0)}
        </div>
      ))}
      {personas.length > 3 && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-1 ring-background">
          +{personas.length - 3}
        </div>
      )}
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────

function ProgressBar({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
        <span>
          {done}/{total} items
        </span>
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

// ── State node data ──────────────────────────────────────────────

interface StateNodeData {
  items: WorkItem[];
  activeAgents: number;
  activePersonas: Persona[];
  childrenDone: number;
  childrenTotal: number;
}

// ── State node component ─────────────────────────────────────────

function StateNode({
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
  const pos = positions.get(stateName);
  if (!pos) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute rounded-lg border bg-card text-left transition-all hover:shadow-md hover:border-primary/30 overflow-hidden",
        isSelected && "ring-2 ring-primary border-primary shadow-md",
      )}
      style={{ width: NODE_W, left: pos.x, top: pos.y }}
    >
      {/* Colored header */}
      <div
        className="px-3 py-1.5 flex items-center justify-between"
        style={{ backgroundColor: stateColor + "20" }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="h-2 w-2 rounded-full shrink-0"
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
            {data.activeAgents > 0 ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {data.activeAgents} active
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">idle</span>
            )}
          </div>
          <AvatarStack personas={data.activePersonas} />
        </div>

        {/* Progress bar */}
        <ProgressBar done={data.childrenDone} total={data.childrenTotal} />
      </div>
    </button>
  );
}

// ── Filtered items list ──────────────────────────────────────────

function FilteredItemsList({
  items,
  personaMap,
  selectedItemId,
  onSelect,
}: {
  items: WorkItem[];
  personaMap: Map<string, Persona>;
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
        const persona = item.assignedPersonaId
          ? personaMap.get(item.assignedPersonaId)
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
            {persona && (
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: persona.avatar.color }}
              >
                {persona.name.charAt(0)}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Main flow view ───────────────────────────────────────────────

export function FlowView() {
  const { projectId } = useSelectedProject();
  const { data: allItems, isLoading } = useWorkItems(undefined, projectId ?? undefined);
  const { data: personas } = usePersonas();
  const { data: executions } = useExecutions(undefined, projectId ?? undefined);
  const { filterState, setFilterState, selectedItemId, setSelectedItemId } =
    useWorkItemsStore();

  const personaMap = useMemo(() => {
    const map = new Map<string, Persona>();
    personas?.forEach((p) => map.set(p.id, p));
    return map;
  }, [personas]);

  // Compute per-state data
  const stateData = useMemo(() => {
    const map = new Map<string, StateNodeData>();

    for (const state of WORKFLOW.states) {
      map.set(state.name, {
        items: [],
        activeAgents: 0,
        activePersonas: [],
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
          const state = itemStateMap.get(exec.workItemId);
          if (state) {
            const set = activeByState.get(state) ?? new Set();
            set.add(exec.personaId);
            activeByState.set(state, set);
          }
        }
      }

      for (const [state, personaIds] of activeByState) {
        const data = map.get(state);
        if (data) {
          data.activeAgents = personaIds.size;
          data.activePersonas = [...personaIds]
            .map((pid) => personaMap.get(pid))
            .filter((p): p is Persona => !!p);
        }
      }
    }

    // Child progress: aggregate children done/total for items in each state
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
  }, [allItems, executions, personaMap]);

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

  if (isLoading) {
    return (
      <div className="flex gap-4 p-4">
        {mainStates.map((s) => (
          <div
            key={s.name}
            className="shrink-0 rounded-lg bg-muted/30 animate-pulse"
            style={{ width: NODE_W, height: NODE_H }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* State machine graph */}
      <ScrollArea className="shrink-0">
        <div
          className="relative"
          style={{ width: CANVAS_W, height: CANVAS_H, minWidth: CANVAS_W }}
        >
          {/* SVG arrows */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={CANVAS_W}
            height={CANVAS_H}
          >
            <defs>
              <marker
                id="flow-arrow"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  className="fill-muted-foreground/40"
                />
              </marker>
            </defs>
            {arrows.map(({ key, d }) => (
              <path
                key={key}
                d={d}
                fill="none"
                className="stroke-muted-foreground/25"
                strokeWidth="1.5"
                markerEnd="url(#flow-arrow)"
              />
            ))}
          </svg>

          {/* State nodes */}
          {WORKFLOW.states.map((state) => {
            const data = stateData.get(state.name);
            if (!data) return null;
            return (
              <StateNode
                key={state.name}
                stateName={state.name}
                stateColor={state.color}
                data={data}
                isSelected={filterState === state.name}
                onClick={() => handleNodeClick(state.name)}
              />
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Filtered items panel (shown when a state is selected) */}
      {filterState && (
        <div className="border-t pt-3 px-1 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: WORKFLOW.states.find(
                  (s) => s.name === filterState,
                )?.color,
              }}
            />
            <span className="text-sm font-medium">{filterState}</span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {filteredItems.length}
            </Badge>
          </div>
          <FilteredItemsList
            items={filteredItems}
            personaMap={personaMap}
            selectedItemId={selectedItemId}
            onSelect={setSelectedItemId}
          />
        </div>
      )}
    </div>
  );
}
