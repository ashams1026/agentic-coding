import { useMemo, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  useStories,
  useWorkflows,
  useTasks,
  useProposals,
  useExecutions,
  usePersonas,
  useUpdateStory,
} from "@/hooks";
import type {
  Story,
  StoryId,
  Workflow,
  WorkflowState,
  Task,
  Proposal,
  Execution,
  Persona,
} from "@agentops/shared";
import { KanbanColumn } from "./kanban-column";
import { StoryCard } from "./story-card";
import type { StoryCardData } from "./story-card";

// ── Find the story workflow ──────────────────────────────────────

function getStoryWorkflow(workflows: Workflow[]): Workflow | undefined {
  return workflows.find((w) => w.type === "story" && w.isDefault);
}

// ── Group stories by state ───────────────────────────────────────

function groupByState(
  stories: Story[],
  states: WorkflowState[],
): Map<string, Story[]> {
  const map = new Map<string, Story[]>();
  for (const state of states) {
    map.set(state.name, []);
  }
  for (const story of stories) {
    const bucket = map.get(story.currentState);
    if (bucket) {
      bucket.push(story);
    }
  }
  return map;
}

// ── Compute per-story card data ──────────────────────────────────

function buildCardDataMap(
  stories: Story[],
  tasks: Task[],
  proposals: Proposal[],
  executions: Execution[],
  personas: Persona[],
): Map<StoryId, StoryCardData> {
  const personaMap = new Map(personas.map((p) => [p.id, p]));
  const map = new Map<StoryId, StoryCardData>();

  for (const story of stories) {
    const storyTasks = tasks.filter((t) => t.storyId === story.id);
    const tasksDone = storyTasks.filter((t) => t.currentState === "Done").length;
    const tasksTotal = storyTasks.length;

    const pendingProposalCount = proposals.filter(
      (p) => p.parentId === story.id && p.status === "pending",
    ).length;

    const storyTaskIds: Set<string> = new Set(storyTasks.map((t) => t.id));
    const runningExec = executions.find(
      (e) =>
        e.status === "running" &&
        (e.targetId === story.id || storyTaskIds.has(e.targetId)),
    );
    const activeAgent = runningExec
      ? { persona: personaMap.get(runningExec.personaId)! }
      : null;

    map.set(story.id, {
      tasksDone,
      tasksTotal,
      pendingProposalCount,
      activeAgent: activeAgent?.persona ? activeAgent : null,
    });
  }

  return map;
}

// ── Board component ──────────────────────────────────────────────

export function KanbanBoard() {
  const { data: stories, isLoading: storiesLoading } = useStories();
  const { data: workflows, isLoading: workflowsLoading } = useWorkflows();
  const { data: tasks } = useTasks();
  const { data: proposals } = useProposals();
  const { data: executions } = useExecutions();
  const { data: personas } = usePersonas();
  const updateStory = useUpdateStory();

  const [activeStory, setActiveStory] = useState<Story | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const workflow = workflows ? getStoryWorkflow(workflows) : undefined;

  const grouped = useMemo(
    () => (workflow ? groupByState(stories ?? [], workflow.states) : new Map()),
    [stories, workflow],
  );

  const cardDataMap = useMemo(
    () =>
      buildCardDataMap(
        stories ?? [],
        tasks ?? [],
        proposals ?? [],
        executions ?? [],
        personas ?? [],
      ),
    [stories, tasks, proposals, executions, personas],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const story = (event.active.data.current as { story: Story })?.story;
      if (story) {
        setActiveStory(story);
      }
    },
    [],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveStory(null);

      const { active, over } = event;
      if (!over) return;

      const storyId = active.id as StoryId;
      const targetColumn = (over.data.current as { stateName?: string })
        ?.stateName;

      if (!targetColumn) return;

      // Find the story to check if it's actually moving
      const story = stories?.find((s) => s.id === storyId);
      if (!story || story.currentState === targetColumn) return;

      // Trigger state transition via mock API
      updateStory.mutate({ id: storyId, currentState: targetColumn });
    },
    [stories, updateStory],
  );

  const handleDragCancel = useCallback(() => {
    setActiveStory(null);
  }, []);

  if (storiesLoading || workflowsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading board...</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No story workflow configured.
        </p>
      </div>
    );
  }

  const defaultData: StoryCardData = {
    tasksDone: 0,
    tasksTotal: 0,
    pendingProposalCount: 0,
    activeAgent: null,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ScrollArea className="h-full w-full">
        <div className="flex h-full gap-4 px-1 pb-4">
          {workflow.states.map((state) => (
            <KanbanColumn
              key={state.name}
              state={state}
              stories={grouped.get(state.name) ?? []}
              cardDataMap={cardDataMap}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeStory ? (
          <div className="w-[268px] rotate-2 opacity-90">
            <StoryCard
              story={activeStory}
              data={cardDataMap.get(activeStory.id) ?? defaultData}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
