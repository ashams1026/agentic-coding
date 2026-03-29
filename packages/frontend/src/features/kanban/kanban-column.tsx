import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Story, StoryId, WorkflowState } from "@agentops/shared";
import { DraggableStoryCard } from "./draggable-story-card";
import type { StoryCardData } from "./story-card";

// ── Column header ────────────────────────────────────────────────

interface ColumnHeaderProps {
  state: WorkflowState;
  count: number;
}

function ColumnHeader({ state, count }: ColumnHeaderProps) {
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
    </div>
  );
}

// ── Column component ─────────────────────────────────────────────

interface KanbanColumnProps {
  state: WorkflowState;
  stories: Story[];
  cardDataMap: Map<StoryId, StoryCardData>;
}

export function KanbanColumn({ state, stories, cardDataMap }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${state.name}`,
    data: { stateName: state.name },
  });

  const defaultData: StoryCardData = {
    tasksDone: 0,
    tasksTotal: 0,
    pendingProposalCount: 0,
    activeAgent: null,
  };

  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      <ColumnHeader state={state} count={stories.length} />
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-0 rounded-lg transition-colors ${
          isOver ? "bg-accent/40 ring-2 ring-primary/30" : ""
        }`}
      >
        <ScrollArea className="h-full">
          <div className="space-y-2 px-0.5 pb-2">
            {stories.length === 0 ? (
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
