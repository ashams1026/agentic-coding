import { useState, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWorkItems } from "@/hooks";
import { useWorkItemsStore } from "@/stores/work-items-store";
import { getStateByName } from "@agentops/shared";
import type { WorkItem, WorkItemId, Priority } from "@agentops/shared";

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

// ── Tree node ───────────────────────────────────────────────────

interface TreeNodeProps {
  item: WorkItem;
  depth: number;
  isLast: boolean;
  parentGuides: boolean[];
  childrenDone: number;
  childrenTotal: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  renderChildren: () => React.ReactNode;
}

function TreeNode({
  item,
  depth,
  isLast,
  parentGuides,
  childrenDone,
  childrenTotal,
  hasChildren,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect,
  renderChildren,
}: TreeNodeProps) {
  const pCfg = priorityConfig[item.priority];
  const stateInfo = getStateByName(item.currentState);

  return (
    <div>
      <button
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
          isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
        )}
      >
        {/* Tree guide lines */}
        {parentGuides.map((showLine, i) => (
          <span
            key={i}
            className="inline-flex w-5 shrink-0 justify-center"
          >
            {showLine && (
              <span className="h-full w-px bg-border" />
            )}
          </span>
        ))}

        {/* Branch connector */}
        {depth > 0 && (
          <span className="inline-flex w-5 shrink-0 items-center justify-center">
            <span
              className={cn(
                "h-px w-3 bg-border",
                isLast ? "self-start mt-3" : "",
              )}
            />
          </span>
        )}

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
              className={cn(
                "h-3.5 w-3.5 transition-transform text-muted-foreground",
                isExpanded && "rotate-90",
              )}
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

        {/* Progress */}
        {childrenTotal > 0 && (
          <div className="shrink-0">
            <MiniProgress done={childrenDone} total={childrenTotal} />
          </div>
        )}
      </button>

      {/* Children */}
      {hasChildren && isExpanded && renderChildren()}
    </div>
  );
}

// ── Main tree view ──────────────────────────────────────────────

export function TreeView() {
  const { data: allItems, isLoading } = useWorkItems();
  const { selectedItemId, setSelectedItemId } = useWorkItemsStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: WorkItemId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build children map
  const childrenOf = useMemo(() => {
    if (!allItems) return new Map<string | null, WorkItem[]>();
    const map = new Map<string | null, WorkItem[]>();
    for (const item of allItems) {
      const parentKey = item.parentId ?? null;
      const arr = map.get(parentKey) ?? [];
      arr.push(item);
      map.set(parentKey, arr);
    }
    return map;
  }, [allItems]);

  // Child stats
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

  // Recursive tree renderer
  const renderTree = (
    parentId: WorkItemId | null,
    depth: number,
    parentGuides: boolean[],
  ): React.ReactNode => {
    const children = childrenOf.get(parentId);
    if (!children || children.length === 0) return null;

    return children.map((item, index) => {
      const isLast = index === children.length - 1;
      const stats = childStats.get(item.id) ?? { done: 0, total: 0 };
      const hasChildren = childrenOf.has(item.id);
      const isExpanded = expandedIds.has(item.id);

      // Guide lines for children: show a vertical line for all ancestors
      // that are NOT the last child in their level
      const nextGuides = [...parentGuides, !isLast];

      return (
        <TreeNode
          key={item.id}
          item={item}
          depth={depth}
          isLast={isLast}
          parentGuides={parentGuides}
          childrenDone={stats.done}
          childrenTotal={stats.total}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          isSelected={selectedItemId === item.id}
          onToggleExpand={() => toggleExpand(item.id)}
          onSelect={() => setSelectedItemId(item.id)}
          renderChildren={() => renderTree(item.id, depth + 1, nextGuides)}
        />
      );
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const roots = childrenOf.get(null);
  if (!roots || roots.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">No work items yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full space-y-0.5">
      {renderTree(null, 0, [])}
    </div>
  );
}
