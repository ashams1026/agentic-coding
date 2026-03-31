import { useEffect, useCallback, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { List, GitBranch, Plus, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { FilterBar } from "@/features/work-items/filter-bar";
import { ListView } from "@/features/work-items/list-view";
import { FlowView } from "@/features/work-items/flow-view";
import { DetailPanel } from "@/features/work-items/detail-panel";
import { useWorkItemsStore, type WorkItemView } from "@/stores/work-items-store";
import { useCreateWorkItem, useSelectedProject, useProjects } from "@/hooks";

const viewOptions: { value: WorkItemView; label: string; icon: typeof List }[] = [
  { value: "list", label: "List", icon: List },
  { value: "flow", label: "Flow", icon: GitBranch },
];

export function WorkItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useWorkItemsStore();
  const { view, setView, searchQuery, setSearchQuery, sortDir, setSortDir, filterPersonas, filterLabels, selectedItemId, detailPanelWidth, setDetailPanelWidth } = store;
  const { projectId } = useSelectedProject();
  const createWorkItem = useCreateWorkItem();
  const { data: projectsList } = useProjects();
  const projectSettings = projectsList?.[0]?.settings as Record<string, unknown> | undefined;
  const autoRouting = projectSettings?.autoRouting !== false;

  // Sync URL params → store on mount
  useEffect(() => {
    const urlView = searchParams.get("view");
    if (urlView && (urlView === "list" || urlView === "flow")) {
      setView(urlView);
    }
    const urlQuery = searchParams.get("q");
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
    const urlPersonas = searchParams.get("personas");
    if (urlPersonas) {
      for (const id of urlPersonas.split(",")) {
        if (id && !store.filterPersonas.includes(id)) store.toggleFilterPersona(id);
      }
    }
    const urlLabels = searchParams.get("labels");
    if (urlLabels) {
      for (const label of urlLabels.split(",")) {
        if (label && !store.filterLabels.includes(label)) store.toggleFilterLabel(label);
      }
    }
    const urlSortDir = searchParams.get("sortDir");
    if (urlSortDir && (urlSortDir === "asc" || urlSortDir === "desc")) {
      setSortDir(urlSortDir);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync store → URL params
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    // search query
    if (searchQuery) next.set("q", searchQuery); else next.delete("q");
    // personas
    if (filterPersonas.length > 0) next.set("personas", filterPersonas.join(",")); else next.delete("personas");
    // labels
    if (filterLabels.length > 0) next.set("labels", filterLabels.join(",")); else next.delete("labels");
    // sort direction
    if (sortDir !== "asc") next.set("sortDir", sortDir); else next.delete("sortDir");
    setSearchParams(next, { replace: true });
  }, [searchQuery, filterPersonas, filterLabels, sortDir]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync URL params when view changes
  const handleViewChange = (newView: WorkItemView) => {
    setView(newView);
    const next = new URLSearchParams(searchParams);
    next.set("view", newView);
    setSearchParams(next, { replace: true });
  };

  // Resize handle logic
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((rect.right - e.clientX) / rect.width) * 100;
      setDetailPanelWidth(pct);
    };

    const handleMouseUp = () => setIsResizing(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setDetailPanelWidth]);

  const handleQuickAdd = () => {
    if (!projectId) return;
    createWorkItem.mutate({
      projectId,
      title: "New work item",
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Work Items</h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    autoRouting
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                  )}>
                    {autoRouting ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                    {autoRouting ? "Auto" : "Manual"}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {autoRouting
                    ? "Auto-routing active — agents transition work items automatically"
                    : "Auto-routing paused — manual transitions only"}
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-muted-foreground mt-1">
              Manage and track all work across your project.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border bg-muted p-0.5">
              {viewOptions.map(({ value, label, icon: Icon }) => (
                <Tooltip key={value}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-7 px-3 text-xs gap-1.5 rounded-md",
                        view === value && "bg-background shadow-sm text-foreground",
                        view !== value && "text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() => handleViewChange(value)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{label} view</TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Quick add */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" className="gap-1.5" onClick={handleQuickAdd}>
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create new work item</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar />
      </div>

      {/* Content: view + detail panel */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        <div
          className={cn(
            "overflow-hidden p-6",
            !isResizing && "transition-all duration-200",
          )}
          style={{ width: selectedItemId ? `${100 - detailPanelWidth}%` : "100%" }}
        >
          {view === "list" && <ListView />}
          {view === "flow" && <FlowView />}
        </div>

        {/* Resize handle — always rendered when panel is open */}
        <div
          className={cn(
            "shrink-0 cursor-col-resize border-l border-border hover:border-primary/50 hover:bg-primary/10 relative group transition-all duration-200",
            isResizing && "border-primary/50 bg-primary/10",
            selectedItemId ? "w-1 opacity-100" : "w-0 opacity-0 border-l-0",
          )}
          onMouseDown={handleMouseDown}
        >
          {/* Grip indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="block h-0.5 w-0.5 rounded-full bg-muted-foreground" />
            <span className="block h-0.5 w-0.5 rounded-full bg-muted-foreground" />
            <span className="block h-0.5 w-0.5 rounded-full bg-muted-foreground" />
          </div>
        </div>

        {/* Detail panel — always rendered, animated width */}
        <div
          className={cn(
            "shrink-0 overflow-hidden",
            !isResizing && "transition-all duration-200",
          )}
          style={{ width: selectedItemId ? `${detailPanelWidth}%` : "0%" }}
        >
          {selectedItemId && <DetailPanel />}
        </div>
      </div>
    </div>
  );
}
