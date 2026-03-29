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
  useTriggers,
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
  Trigger,
} from "@agentops/shared";
import { KanbanColumn } from "./kanban-column";
import { StoryCard } from "./story-card";
import type { StoryCardData } from "./story-card";
import { TransitionPromptModal } from "./transition-prompt-modal";
import type { TransitionPromptData } from "./transition-prompt-modal";

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

// ── Find trigger for a transition ────────────────────────────────

function findTrigger(
  triggers: Trigger[],
  workflowId: string,
  fromState: string,
  toState: string,
): Trigger | undefined {
  return triggers.find(
    (t) =>
      t.workflowId === workflowId &&
      t.fromState === fromState &&
      (t.toState === toState || t.toState === null),
  );
}

// ── Pending drop state ───────────────────────────────────────────

interface PendingDrop {
  storyId: StoryId;
  targetState: string;
}

// ── Board component ──────────────────────────────────────────────

export function KanbanBoard() {
  const { data: stories, isLoading: storiesLoading } = useStories();
  const { data: workflows, isLoading: workflowsLoading } = useWorkflows();
  const { data: tasks } = useTasks();
  const { data: proposals } = useProposals();
  const { data: executions } = useExecutions();
  const { data: personas } = usePersonas();
  const { data: triggers } = useTriggers();
  const updateStory = useUpdateStory();

  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const [promptData, setPromptData] = useState<TransitionPromptData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const workflow = workflows ? getStoryWorkflow(workflows) : undefined;
  const personaMap = useMemo(
    () => new Map(personas?.map((p) => [p.id, p])),
    [personas],
  );

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
      const targetState = (over.data.current as { stateName?: string })
        ?.stateName;

      if (!targetState) return;

      const story = stories?.find((s) => s.id === storyId);
      if (!story || story.currentState === targetState) return;

      // Check for a trigger on this transition
      const trigger = workflow
        ? findTrigger(triggers ?? [], workflow.id, story.currentState, targetState)
        : undefined;

      if (trigger) {
        const persona = personaMap.get(trigger.personaId);
        if (persona) {
          // Show modal — don't transition yet
          setPendingDrop({ storyId, targetState });
          setPromptData({
            storyTitle: story.title,
            fromState: story.currentState,
            toState: targetState,
            persona,
          });
          return;
        }
      }

      // No trigger — transition silently
      updateStory.mutate({ id: storyId, currentState: targetState });
    },
    [stories, workflow, triggers, personaMap, updateStory],
  );

  const handleDragCancel = useCallback(() => {
    setActiveStory(null);
  }, []);

  const handleRunTrigger = useCallback(() => {
    if (pendingDrop) {
      updateStory.mutate({
        id: pendingDrop.storyId,
        currentState: pendingDrop.targetState,
      });
    }
    setPendingDrop(null);
    setPromptData(null);
  }, [pendingDrop, updateStory]);

  const handleSkipTrigger = useCallback(() => {
    if (pendingDrop) {
      updateStory.mutate({
        id: pendingDrop.storyId,
        currentState: pendingDrop.targetState,
      });
    }
    setPendingDrop(null);
    setPromptData(null);
  }, [pendingDrop, updateStory]);

  const handleCancelDrop = useCallback(() => {
    setPendingDrop(null);
    setPromptData(null);
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
    <>
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

      <TransitionPromptModal
        open={promptData !== null}
        data={promptData}
        onRunTrigger={handleRunTrigger}
        onSkipTrigger={handleSkipTrigger}
        onCancel={handleCancelDrop}
      />
    </>
  );
}
