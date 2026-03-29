import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useStories, useWorkflows } from "@/hooks";
import type { Story, Workflow, WorkflowState } from "@agentops/shared";
import { KanbanColumn } from "./kanban-column";

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

// ── Board component ──────────────────────────────────────────────

export function KanbanBoard() {
  const { data: stories, isLoading: storiesLoading } = useStories();
  const { data: workflows, isLoading: workflowsLoading } = useWorkflows();

  if (storiesLoading || workflowsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading board...</p>
      </div>
    );
  }

  const workflow = workflows ? getStoryWorkflow(workflows) : undefined;

  if (!workflow) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No story workflow configured.
        </p>
      </div>
    );
  }

  const grouped = groupByState(stories ?? [], workflow.states);

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex h-full gap-4 px-1 pb-4">
        {workflow.states.map((state) => (
          <KanbanColumn
            key={state.name}
            state={state}
            stories={grouped.get(state.name) ?? []}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
