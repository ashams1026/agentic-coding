import { KanbanBoard } from "@/features/kanban/kanban-board";

export function StoryBoardPage() {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold">Story Board</h1>
        <p className="text-muted-foreground mt-1">
          Drag stories between workflow states.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <KanbanBoard />
      </div>
    </div>
  );
}
