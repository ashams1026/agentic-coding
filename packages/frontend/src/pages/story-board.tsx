import { useState } from "react";
import { Kanban, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/features/kanban/kanban-board";
import { KanbanFilterBar, useKanbanFilters } from "@/features/kanban/kanban-filters";
import { StoryListPanel } from "@/features/story-list/story-list-panel";
import { StoryDetailSidePanel } from "@/features/story-list/story-detail-side-panel";
import { TaskDetailSidePanel } from "@/features/story-list/task-detail-side-panel";
import type { StoryId, TaskId } from "@agentops/shared";

type ViewMode = "kanban" | "list";

export function StoryBoardPage() {
  const [filters] = useKanbanFilters();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedStoryId, setSelectedStoryId] = useState<StoryId | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<TaskId | null>(null);

  const handleSelectStory = (id: StoryId) => {
    setSelectedStoryId(id);
    setSelectedTaskId(null);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId as TaskId);
  };

  const handleBackToStory = () => {
    setSelectedTaskId(null);
  };

  const handleClosePanel = () => {
    setSelectedStoryId(null);
    setSelectedTaskId(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Story Board</h1>
            <p className="text-muted-foreground mt-1">
              {viewMode === "kanban"
                ? "Drag stories between workflow states."
                : "Browse and filter stories."}
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-md border p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 gap-1.5 px-2.5 text-xs",
                viewMode === "kanban" && "bg-accent text-accent-foreground",
              )}
              onClick={() => setViewMode("kanban")}
            >
              <Kanban className="h-3.5 w-3.5" />
              Board
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 gap-1.5 px-2.5 text-xs",
                viewMode === "list" && "bg-accent text-accent-foreground",
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
              List
            </Button>
          </div>
        </div>

        {viewMode === "kanban" && (
          <div className="mb-4">
            <KanbanFilterBar />
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === "kanban" ? (
        <div className="min-h-0 flex-1 px-6 pb-6">
          <KanbanBoard filters={filters} />
        </div>
      ) : (
        <div className="min-h-0 flex-1 flex">
          {/* Left: story list */}
          <div
            className={cn(
              "border-r transition-all duration-300 ease-in-out",
              selectedStoryId ? "w-2/5" : "w-full",
            )}
          >
            <StoryListPanel
              selectedStoryId={selectedStoryId}
              onSelectStory={handleSelectStory}
            />
          </div>

          {/* Right: detail side panel — story or task */}
          {selectedStoryId && (
            <div className="flex-1 min-w-0">
              {selectedTaskId ? (
                <TaskDetailSidePanel
                  taskId={selectedTaskId}
                  parentStoryId={selectedStoryId}
                  onBack={handleBackToStory}
                  onClose={handleClosePanel}
                />
              ) : (
                <StoryDetailSidePanel
                  storyId={selectedStoryId}
                  onClose={handleClosePanel}
                  onTaskClick={handleTaskClick}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
