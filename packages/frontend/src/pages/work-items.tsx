import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { List, GitBranch, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FilterBar } from "@/features/work-items/filter-bar";
import { ListView } from "@/features/work-items/list-view";
import { FlowView } from "@/features/work-items/flow-view";
import { DetailPanel } from "@/features/work-items/detail-panel";
import { useWorkItemsStore, type WorkItemView } from "@/stores/work-items-store";
import { useCreateWorkItem } from "@/hooks";
import type { ProjectId } from "@agentops/shared";

const viewOptions: { value: WorkItemView; label: string; icon: typeof List }[] = [
  { value: "list", label: "List", icon: List },
  { value: "flow", label: "Flow", icon: GitBranch },
];

export function WorkItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useWorkItemsStore();
  const { view, setView, searchQuery, setSearchQuery, sortDir, setSortDir, filterPersonas, filterLabels, selectedItemId } = store;
  const createWorkItem = useCreateWorkItem();

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

  const handleQuickAdd = () => {
    createWorkItem.mutate({
      projectId: "pj-agntops" as ProjectId,
      title: "New work item",
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Work Items</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all work across your project.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border bg-muted p-0.5">
              {viewOptions.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
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
              ))}
            </div>

            {/* Quick add */}
            <Button size="sm" className="gap-1.5" onClick={handleQuickAdd}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar />
      </div>

      {/* Content: view + detail panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className={cn("flex-1 overflow-hidden p-6", selectedItemId && "w-2/5")}>
          {view === "list" && <ListView />}
          {view === "flow" && <FlowView />}
        </div>

        {selectedItemId && (
          <div className="w-3/5 shrink-0">
            <DetailPanel />
          </div>
        )}
      </div>
    </div>
  );
}
