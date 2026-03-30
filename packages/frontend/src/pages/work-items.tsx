import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { List, Columns3, GitBranch, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FilterBar } from "@/features/work-items/filter-bar";
import { ListView } from "@/features/work-items/list-view";
import { BoardView } from "@/features/work-items/board-view";
import { useWorkItemsStore, type WorkItemView } from "@/stores/work-items-store";
import { useCreateWorkItem } from "@/hooks";
import type { ProjectId } from "@agentops/shared";

const viewOptions: { value: WorkItemView; label: string; icon: typeof List }[] = [
  { value: "list", label: "List", icon: List },
  { value: "board", label: "Board", icon: Columns3 },
  { value: "tree", label: "Tree", icon: GitBranch },
];

export function WorkItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { view, setView } = useWorkItemsStore();
  const createWorkItem = useCreateWorkItem();

  // Sync view from URL params on mount
  useEffect(() => {
    const urlView = searchParams.get("view");
    if (urlView && (urlView === "list" || urlView === "board" || urlView === "tree")) {
      setView(urlView);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync URL params when view changes
  const handleViewChange = (newView: WorkItemView) => {
    setView(newView);
    setSearchParams({ view: newView }, { replace: true });
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
        <div className="flex items-center justify-between mb-4">
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
            <Button size="sm" className="h-7 gap-1.5" onClick={handleQuickAdd}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar />
      </div>

      {/* View content */}
      <div className="flex-1 overflow-hidden p-6">
        {view === "list" && <ListView />}
        {view === "board" && <BoardView />}
        {view === "tree" && <WorkItemsTreePlaceholder />}
      </div>
    </div>
  );
}

// Placeholder — will be replaced by O.10
function WorkItemsTreePlaceholder() {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <div className="text-center">
        <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">Tree view — coming in O.10</p>
      </div>
    </div>
  );
}
