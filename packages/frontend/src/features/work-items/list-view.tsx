import { useState, useMemo } from "react";
import { ChevronRight, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWorkItems, usePersonas, useExecutions } from "@/hooks";
import { useWorkItemsStore } from "@/stores/work-items-store";
import { WORKFLOW, getStateByName } from "@agentops/shared";
import type { WorkItem, WorkItemId, Priority, Persona } from "@agentops/shared";

// ── Priority config ─────────────────────────────────────────────

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  p0: { label: "P0", className: "border-red-500 text-red-600 dark:text-red-400" },
  p1: { label: "P1", className: "border-amber-500 text-amber-600 dark:text-amber-400" },
  p2: { label: "P2", className: "border-blue-500 text-blue-600 dark:text-blue-400" },
  p3: { label: "P3", className: "border-slate-400 text-slate-500 dark:text-slate-400" },
};

// ── Progress bar ────────────────────────────────────────────────

function MiniProgress({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {done}/{total}
      </span>
    </div>
  );
}

// ── Active agent indicator ──────────────────────────────────────

function ActiveAgentDot({ persona }: { persona: Persona }) {
  return (
    <div className="flex items-center gap-1">
      <span className="relative flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{ backgroundColor: persona.avatar.color }}
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: persona.avatar.color }}
        />
      </span>
      <Bot className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}

// ── Persona avatar ──────────────────────────────────────────────

function PersonaAvatar({ persona }: { persona: Persona }) {
  return (
    <div
      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
      style={{ backgroundColor: persona.avatar.color }}
      title={persona.name}
    >
      {persona.name.charAt(0)}
    </div>
  );
}

// ── Group header ────────────────────────────────────────────────

function GroupHeader({
  label,
  count,
  color,
  collapsed,
  onToggle,
}: {
  label: string;
  count: number;
  color?: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      <ChevronRight
        className={cn("h-3.5 w-3.5 transition-transform", !collapsed && "rotate-90")}
      />
      {color && (
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      )}
      <span>{label}</span>
      <span className="text-[10px] text-muted-foreground/60">({count})</span>
    </button>
  );
}

// ── Single row ──────────────────────────────────────────────────

interface ListRowProps {
  item: WorkItem;
  depth: number;
  childrenDone: number;
  childrenTotal: number;
  persona: Persona | null;
  hasRunningAgent: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
}

function ListRow({
  item,
  depth,
  childrenDone,
  childrenTotal,
  persona,
  hasRunningAgent,
  isExpanded,
  hasChildren,
  isSelected,
  onToggleExpand,
  onSelect,
}: ListRowProps) {
  const pCfg = priorityConfig[item.priority];
  const stateInfo = getStateByName(item.currentState);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors",
        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
      )}
      style={{ paddingLeft: `${12 + depth * 20}px` }}
    >
      {/* Expand/collapse chevron */}
      {hasChildren ? (
        <span
          role="button"
          tabIndex={0}
          className="shrink-0 p-0.5 rounded hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              onToggleExpand();
            }
          }}
        >
          <ChevronRight
            className={cn("h-3.5 w-3.5 transition-transform text-muted-foreground", isExpanded && "rotate-90")}
          />
        </span>
      ) : (
        <span className="w-[18px] shrink-0" />
      )}

      {/* State badge */}
      <Badge
        variant="secondary"
        className="text-[10px] px-1.5 py-0 shrink-0 font-medium"
        style={{
          backgroundColor: stateInfo ? `${stateInfo.color}20` : undefined,
          color: stateInfo?.color,
          borderColor: stateInfo ? `${stateInfo.color}40` : undefined,
        }}
      >
        {item.currentState}
      </Badge>

      {/* Priority */}
      <Badge
        variant="outline"
        className={cn("text-[10px] px-1.5 py-0 font-semibold shrink-0", pCfg.className)}
      >
        {pCfg.label}
      </Badge>

      {/* Title */}
      <span className="flex-1 truncate text-sm">{item.title}</span>

      {/* Progress (if has children) */}
      {childrenTotal > 0 && (
        <div className="shrink-0">
          <MiniProgress done={childrenDone} total={childrenTotal} />
        </div>
      )}

      {/* Persona avatar */}
      {persona && (
        <div className="shrink-0">
          <PersonaAvatar persona={persona} />
        </div>
      )}

      {/* Active agent indicator */}
      {hasRunningAgent && persona && (
        <div className="shrink-0">
          <ActiveAgentDot persona={persona} />
        </div>
      )}
    </button>
  );
}

// ── Main list view ──────────────────────────────────────────────

export function ListView() {
  const { data: allItems, isLoading } = useWorkItems();
  const { data: personas } = usePersonas();
  const { data: executions } = useExecutions();
  const { groupBy, sortBy, filterState, filterPriority, selectedItemId, setSelectedItemId } =
    useWorkItemsStore();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(["Done"]),
  );

  const toggleExpand = (id: WorkItemId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Build lookup maps
  const personaMap = useMemo(() => {
    const map = new Map<string, Persona>();
    personas?.forEach((p) => map.set(p.id, p));
    return map;
  }, [personas]);

  const runningItemIds = useMemo(() => {
    const ids = new Set<string>();
    executions?.filter((e) => e.status === "running").forEach((e) => ids.add(e.workItemId));
    return ids;
  }, [executions]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    if (!allItems) return [];
    let items = [...allItems];
    if (filterState) items = items.filter((w) => w.currentState === filterState);
    if (filterPriority) items = items.filter((w) => w.priority === filterPriority);
    return items;
  }, [allItems, filterState, filterPriority]);

  // Sort function
  const sortItems = (items: WorkItem[]): WorkItem[] => {
    const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3 };
    return [...items].sort((a, b) => {
      if (sortBy === "priority") return priorityOrder[a.priority] - priorityOrder[b.priority];
      if (sortBy === "created") return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === "updated") return b.updatedAt.localeCompare(a.updatedAt);
      return 0;
    });
  };

  // Count children stats
  const childStats = useMemo(() => {
    if (!allItems) return new Map<string, { done: number; total: number }>();
    const map = new Map<string, { done: number; total: number }>();
    for (const item of allItems) {
      if (!item.parentId) continue;
      const stats = map.get(item.parentId) ?? { done: 0, total: 0 };
      stats.total++;
      if (item.currentState === "Done") stats.done++;
      map.set(item.parentId, stats);
    }
    return map;
  }, [allItems]);

  // Build tree for hierarchy rendering
  const childrenOf = useMemo(() => {
    const map = new Map<string | null, WorkItem[]>();
    filteredItems.forEach((item) => {
      const parentKey = item.parentId ?? null;
      const arr = map.get(parentKey) ?? [];
      arr.push(item);
      map.set(parentKey, arr);
    });
    return map;
  }, [filteredItems]);

  // Render tree recursively
  const renderTree = (parentId: WorkItemId | null, depth: number): React.ReactNode[] => {
    const children = childrenOf.get(parentId);
    if (!children) return [];
    const sorted = sortItems(children);
    return sorted.flatMap((item) => {
      const stats = childStats.get(item.id) ?? { done: 0, total: 0 };
      const persona = item.assignedPersonaId ? personaMap.get(item.assignedPersonaId) ?? null : null;
      const hasChildren = childrenOf.has(item.id);
      const isExpanded = expandedIds.has(item.id);

      const row = (
        <ListRow
          key={item.id}
          item={item}
          depth={depth}
          childrenDone={stats.done}
          childrenTotal={stats.total}
          persona={persona}
          hasRunningAgent={runningItemIds.has(item.id)}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          isSelected={selectedItemId === item.id}
          onToggleExpand={() => toggleExpand(item.id)}
          onSelect={() => setSelectedItemId(item.id)}
        />
      );

      if (hasChildren && isExpanded) {
        return [row, ...renderTree(item.id, depth + 1)];
      }
      return [row];
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  // Grouped rendering
  if (groupBy !== "none") {
    const groups = new Map<string, WorkItem[]>();
    const topLevel = filteredItems.filter((w) => w.parentId === null);
    const sorted = sortItems(topLevel);

    for (const item of sorted) {
      let key: string;
      if (groupBy === "state") key = item.currentState;
      else if (groupBy === "priority") key = item.priority;
      else key = item.parentId ?? "Root";
      const arr = groups.get(key) ?? [];
      arr.push(item);
      groups.set(key, arr);
    }

    // Order groups: for state grouping, follow WORKFLOW order
    let orderedKeys: string[];
    if (groupBy === "state") {
      orderedKeys = WORKFLOW.states.map((s) => s.name).filter((name) => groups.has(name));
    } else {
      orderedKeys = [...groups.keys()];
    }

    return (
      <div className="space-y-1 overflow-y-auto h-full">
        {orderedKeys.map((key) => {
          const items = groups.get(key)!;
          const isCollapsed = collapsedGroups.has(key);
          const stateInfo = groupBy === "state" ? getStateByName(key) : undefined;

          return (
            <div key={key}>
              <GroupHeader
                label={key}
                count={items.length}
                color={stateInfo?.color}
                collapsed={isCollapsed}
                onToggle={() => toggleGroup(key)}
              />
              {!isCollapsed && (
                <div className="ml-1">
                  {items.map((item) => {
                    const stats = childStats.get(item.id) ?? { done: 0, total: 0 };
                    const persona = item.assignedPersonaId
                      ? personaMap.get(item.assignedPersonaId) ?? null
                      : null;
                    const hasChildren = childrenOf.has(item.id);
                    const isExpanded = expandedIds.has(item.id);

                    return (
                      <div key={item.id}>
                        <ListRow
                          item={item}
                          depth={0}
                          childrenDone={stats.done}
                          childrenTotal={stats.total}
                          persona={persona}
                          hasRunningAgent={runningItemIds.has(item.id)}
                          isExpanded={isExpanded}
                          hasChildren={hasChildren}
                          isSelected={selectedItemId === item.id}
                          onToggleExpand={() => toggleExpand(item.id)}
                          onSelect={() => setSelectedItemId(item.id)}
                        />
                        {hasChildren && isExpanded && renderTree(item.id, 1)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Flat tree rendering (no grouping)
  return (
    <div className="space-y-0.5 overflow-y-auto h-full">
      {renderTree(null, 0)}
    </div>
  );
}
