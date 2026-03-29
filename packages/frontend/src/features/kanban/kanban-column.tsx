import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Story, StoryId, WorkflowState, ProjectId, WorkflowId } from "@agentops/shared";
import { DraggableStoryCard } from "./draggable-story-card";
import type { StoryCardData } from "./story-card";
import { InlineStoryForm } from "./inline-story-form";

// ── Column header ────────────────────────────────────────────────

interface ColumnHeaderProps {
  state: WorkflowState;
  count: number;
  showAddButton: boolean;
  onAddClick: () => void;
}

function ColumnHeader({ state, count, showAddButton, onAddClick }: ColumnHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-1 pb-3">
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: state.color }}
      />
      <span className="text-sm font-medium">{state.name}</span>
      <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
        {count}
      </Badge>
      {showAddButton && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onAddClick}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

// ── Column component ─────────────────────────────────────────────

interface KanbanColumnProps {
  state: WorkflowState;
  stories: Story[];
  cardDataMap: Map<StoryId, StoryCardData>;
  projectId?: ProjectId;
  workflowId?: WorkflowId;
}

export function KanbanColumn({
  state,
  stories,
  cardDataMap,
  projectId,
  workflowId,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${state.name}`,
    data: { stateName: state.name },
  });

  const [showForm, setShowForm] = useState(false);

  const defaultData: StoryCardData = {
    tasksDone: 0,
    tasksTotal: 0,
    pendingProposalCount: 0,
    activeAgent: null,
  };

  const canCreate = state.isInitial && projectId && workflowId;

  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      <ColumnHeader
        state={state}
        count={stories.length}
        showAddButton={!!canCreate}
        onAddClick={() => setShowForm(true)}
      />
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-0 rounded-lg transition-colors ${
          isOver ? "bg-accent/40 ring-2 ring-primary/30" : ""
        }`}
      >
        <ScrollArea className="h-full">
          <div className="space-y-2 px-0.5 pb-2">
            {showForm && projectId && workflowId && (
              <InlineStoryForm
                projectId={projectId}
                workflowId={workflowId}
                onClose={() => setShowForm(false)}
              />
            )}
            {stories.length === 0 && !showForm ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed py-8">
                <p className="text-xs text-muted-foreground">
                  {isOver ? "Drop here" : "No stories"}
                </p>
              </div>
            ) : (
              stories.map((story) => (
                <DraggableStoryCard
                  key={story.id}
                  story={story}
                  data={cardDataMap.get(story.id) ?? defaultData}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
