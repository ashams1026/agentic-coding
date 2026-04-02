import { useState, useMemo } from "react";
import { ChevronRight, Bot, Plus, ListTodo, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useWorkItems, usePersonas, useExecutions, useSelectedProject, useCreateWorkItem } from "@/hooks";
import { useWorkItemsStore } from "@/stores/work-items-store";
import { WORKFLOW, getStateByName } from "@agentops/shared";
import type { WorkItem, WorkItemId, Priority, Persona, ProjectId } from "@agentops/shared";

// ── Text highlight ─────────────────────────────────────────────

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/60 text-inherit rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

// ── Priority config ─────────────────────────────────────────────

const priorityConfig: Record<Priority, { label: string; fullName: string; className: string }> = {
  p0: { label: "P0", fullName: "Critical", className: "border-red-500 text-red-600 dark:text-red-400" },
  p1: { label: "P1", fullName: "High", className: "border-amber-500 text-amber-600 dark:text-amber-400" },
  p2: { label: "P2", fullName: "Medium", className: "border-blue-500 text-blue-600 dark:text-blue-400" },
  p3: { label: "P3", fullName: "Low", className: "border-slate-400 text-slate-500 dark:text-slate-400" },
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
      <span className="text-xs text-muted-foreground whitespace-nowrap">
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
      className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-white"
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
      className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronRight
        className={cn("h-3.5 w-3.5 transition-transform", !collapsed && "rotate-90")}
      />
      {color && (
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      )}
      <span>{label}</span>
      <span className="text-xs text-muted-foreground/60">({count})</span>
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
  isArchived: boolean;
  searchQuery: string;
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
  isArchived,
  searchQuery,
  onToggleExpand,
  onSelect,
}: ListRowProps) {
  const pCfg = priorityConfig[item.priority];
  const stateInfo = getStateByName(item.currentState);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected ? "bg-accent text-accent-foreground ring-2 ring-primary/50" : "hover:bg-muted/50",
        isArchived && "opacity-50",
      )}
      style={{ paddingLeft: `${12 + depth * 20}px` }}
    >
      {/* Expand/collapse chevron */}
      {hasChildren ? (
        <span
          role="button"
          tabIndex={0}
          className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className="text-xs px-1.5 py-0 shrink-0 font-medium"
            style={{
              backgroundColor: stateInfo ? `${stateInfo.color}20` : undefined,
              color: stateInfo?.color,
              borderColor: stateInfo ? `${stateInfo.color}40` : undefined,
            }}
          >
            {item.currentState}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>State: {item.currentState}</TooltipContent>
      </Tooltip>

      {/* Priority */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn("text-xs px-1.5 py-0 font-semibold shrink-0", pCfg.className)}
          >
            {pCfg.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>Priority: {pCfg.fullName}</TooltipContent>
      </Tooltip>

      {/* Title */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex-1 truncate text-sm">
            <HighlightedText text={item.title} query={searchQuery} />
          </span>
        </TooltipTrigger>
        <TooltipContent>{item.title}</TooltipContent>
      </Tooltip>

      {/* Archived badge */}
      {isArchived && (
        <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0 text-muted-foreground border-muted-foreground/40 gap-1">
          <Archive className="h-3 w-3" />
          Archived
        </Badge>
      )}

      {/* Progress (if has children) */}
      {childrenTotal > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="shrink-0">
              <MiniProgress done={childrenDone} total={childrenTotal} />
            </div>
          </TooltipTrigger>
          <TooltipContent>{childrenDone} of {childrenTotal} children done</TooltipContent>
        </Tooltip>
      )}

      {/* Persona avatar */}
      {persona && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="shrink-0">
              <PersonaAvatar persona={persona} />
            </div>
          </TooltipTrigger>
          <TooltipContent>{persona.name} ({persona.model})</TooltipContent>
        </Tooltip>
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

// ── Empty state for new projects ────────────────────────────────

function EmptyWorkItemsState({ projectId }: { projectId: string | null }) {
  const createWorkItem = useCreateWorkItem();

  const handleCreate = () => {
    if (!projectId) return;
    createWorkItem.mutate({ projectId: projectId as ProjectId, title: "New work item" });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-12 gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <ListTodo className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">No work items yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create your first work item to get started. Work items track features, bugs, and tasks for your project.
        </p>
      </div>
      <Button onClick={handleCreate} className="gap-1.5 mt-2">
        <Plus className="h-4 w-4" />
        Create work item
      </Button>
    </div>
  );
}

// ── Main list view ──────────────────────────────────────────────

export function ListView() {
  const { projectId } = useSelectedProject();
  const { searchQuery, groupBy, sortBy, sortDir, filterState, filterPriority, filterPersonas, filterLabels, showArchived, selectedItemId, setSelectedItemId, clearFilters, setFilterState } =
    useWorkItemsStore();
  const { data: allItems, isLoading } = useWorkItems(undefined, projectId ?? undefined, showArchived || undefined);
  const { data: personas } = usePersonas();
  const { data: executions } = useExecutions(undefined, projectId ?? undefined);

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
    if (filterPersonas.length > 0) {
      items = items.filter((w) => w.assignedPersonaId && filterPersonas.includes(w.assignedPersonaId));
    }
    if (filterLabels.length > 0) {
      items = items.filter((w) => filterLabels.some((label) => w.labels.includes(label)));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (w) => w.title.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q),
      );
    }
    return items;
  }, [allItems, filterState, filterPriority, filterPersonas, filterLabels, searchQuery]);

  // Sort function with direction and secondary sort
  const sortItems = (items: WorkItem[]): WorkItem[] => {
    const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3 };
    const dir = sortDir === "asc" ? 1 : -1;
    return [...items].sort((a, b) => {
      let primary = 0;
      if (sortBy === "priority") primary = priorityOrder[a.priority] - priorityOrder[b.priority];
      else if (sortBy === "created") primary = a.createdAt.localeCompare(b.createdAt);
      else if (sortBy === "updated") primary = a.updatedAt.localeCompare(b.updatedAt);

      if (primary !== 0) return primary * dir;

      // Secondary sort: priority → created, date sorts → priority
      if (sortBy === "priority") return a.createdAt.localeCompare(b.createdAt) * dir;
      return (priorityOrder[a.priority] - priorityOrder[b.priority]) * dir;
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
          isArchived={item.archivedAt !== null}
          searchQuery={searchQuery}
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
      <div className="space-y-1 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2">
            <div className="h-5 w-16 rounded bg-muted animate-pulse" />
            <div className="h-5 w-8 rounded bg-muted animate-pulse" />
            <div className="h-5 flex-1 rounded bg-muted animate-pulse" />
            <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Empty states
  if (filteredItems.length === 0 && !isLoading) {
    const hasFilters = searchQuery || filterState || filterPriority || filterPersonas.length > 0 || filterLabels.length > 0;
    if (hasFilters) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-3">
          <p className="text-sm text-muted-foreground">No items match your filters.</p>
          <Button variant="outline" size="sm" onClick={() => { clearFilters(); setFilterState(null); }}>
            Clear filters
          </Button>
        </div>
      );
    }
    return (
      <EmptyWorkItemsState projectId={projectId} />
    );
  }

  // Grouped rendering
  if (groupBy !== "none") {
    const groups = new Map<string, WorkItem[]>();
    const topLevel = filteredItems.filter((w) => w.parentId === null);

    if (topLevel.length === 0) {
      const hasFilters = searchQuery || filterState || filterPriority || filterPersonas.length > 0 || filterLabels.length > 0;
      if (hasFilters) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-3">
            <p className="text-sm text-muted-foreground">No items match your filters.</p>
            <Button variant="outline" size="sm" onClick={() => { clearFilters(); setFilterState(null); }}>
              Clear filters
            </Button>
          </div>
        );
      }
    }

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
                          isArchived={item.archivedAt !== null}
                          searchQuery={searchQuery}
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
