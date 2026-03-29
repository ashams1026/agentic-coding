import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Plus,
  GitBranch,
  Bot,
  CheckCircle2,
  Circle,
  Loader2,
  Search,
  X,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useTasks,
  useTaskEdges,
  usePersonas,
  useWorkflows,
  useCreateTask,
  useUpdateTask,
} from "@/hooks";
import type {
  Story,
  Task,
  TaskEdge,
  Persona,
  WorkflowId,
} from "@agentops/shared";

// ── State badge config ──────────────────────────────────────────

interface StateConfig {
  color: string;
  icon: React.ReactNode;
}

const defaultStateConfig: StateConfig = {
  color: "text-slate-500",
  icon: <Circle className="h-3 w-3 text-slate-400" />,
};

const stateConfig: Record<string, StateConfig> = {
  Pending: defaultStateConfig,
  Running: {
    color: "text-emerald-600 dark:text-emerald-400",
    icon: <Loader2 className="h-3 w-3 text-emerald-500 animate-spin" />,
  },
  Review: {
    color: "text-amber-600 dark:text-amber-400",
    icon: <Search className="h-3 w-3 text-amber-500" />,
  },
  Done: {
    color: "text-green-600 dark:text-green-400",
    icon: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  },
};

function getStateConfig(state: string): StateConfig {
  return stateConfig[state] ?? defaultStateConfig;
}

// ── Task row ────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  persona: Persona | undefined;
  hasDeps: boolean;
  onToggleDone: (task: Task) => void;
}

function TaskRow({ task, persona, hasDeps, onToggleDone }: TaskRowProps) {
  const cfg = getStateConfig(task.currentState);
  const isDone = task.currentState === "Done";

  return (
    <div className="group flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent/50 transition-colors">
      {/* Checkbox — toggles Done/Pending */}
      <Checkbox
        checked={isDone}
        onCheckedChange={() => onToggleDone(task)}
        className="shrink-0"
      />

      {/* State icon */}
      <span className="shrink-0">{cfg.icon}</span>

      {/* Title — link to task detail */}
      <Link
        to={`/tasks/${task.id}`}
        className={`flex-1 text-sm truncate hover:underline ${isDone ? "line-through text-muted-foreground" : ""}`}
      >
        {task.title}
      </Link>

      {/* State badge */}
      <Badge variant="outline" className={`text-xs shrink-0 ${cfg.color}`}>
        {task.currentState}
      </Badge>

      {/* Persona avatar */}
      {persona && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: persona.avatar.color + "20" }}
            >
              <Bot
                className="h-3 w-3"
                style={{ color: persona.avatar.color }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {persona.name}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Dependency indicator */}
      {hasDeps && (
        <Tooltip>
          <TooltipTrigger asChild>
            <GitBranch className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Has dependencies
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// ── Inline add task form ────────────��───────────────────────────

interface AddTaskFormProps {
  storyId: Story["id"];
  workflowId: WorkflowId;
  onClose: () => void;
}

function AddTaskForm({ storyId, workflowId, onClose }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const createTask = useCreateTask();

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    createTask.mutate(
      { storyId, title: trimmed, workflowId },
      {
        onSuccess: () => {
          setTitle("");
          onClose();
        },
      },
    );
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="h-8 text-sm flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onClose();
        }}
      />
      <Button
        size="sm"
        className="h-8 text-xs"
        onClick={handleSubmit}
        disabled={!title.trim() || createTask.isPending}
      >
        <Check className="h-3 w-3 mr-1" />
        Add
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onClose}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ── Mini dependency graph ──────���────────────────────────────────

interface MiniDepGraphProps {
  tasks: Task[];
  edges: TaskEdge[];
}

const NODE_W = 120;
const NODE_H = 32;
const GAP_X = 40;
const GAP_Y = 16;
const PAD = 16;

function MiniDepGraph({ tasks, edges }: MiniDepGraphProps) {
  // Only show if there are edges
  if (edges.length === 0) return null;

  // Build adjacency: task -> tasks it blocks (outgoing)
  const taskIds: Set<string> = new Set(tasks.map((t) => t.id));
  const relevantEdges = edges.filter(
    (e) => taskIds.has(e.fromId) && taskIds.has(e.toId),
  );

  if (relevantEdges.length === 0) return null;

  // Topological layout: assign layers
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();
  const involvedIds = new Set<string>();

  for (const e of relevantEdges) {
    involvedIds.add(e.fromId);
    involvedIds.add(e.toId);
    adjList.set(e.fromId, [...(adjList.get(e.fromId) ?? []), e.toId]);
    inDegree.set(e.toId, (inDegree.get(e.toId) ?? 0) + 1);
    if (!inDegree.has(e.fromId)) inDegree.set(e.fromId, 0);
  }

  // BFS layering
  const layers: string[][] = [];
  let queue = [...involvedIds].filter((id) => (inDegree.get(id) ?? 0) === 0);
  const visited = new Set<string>();

  while (queue.length > 0) {
    layers.push(queue);
    const next: string[] = [];
    for (const id of queue) {
      visited.add(id);
      for (const child of adjList.get(id) ?? []) {
        const remaining = (inDegree.get(child) ?? 1) - 1;
        inDegree.set(child, remaining);
        if (remaining === 0 && !visited.has(child)) {
          next.push(child);
        }
      }
    }
    queue = next;
  }

  // Position nodes
  const taskMap = new Map(tasks.map((t) => [t.id as string, t]));
  const positions = new Map<string, { x: number; y: number }>();
  let maxX = 0;
  let maxY = 0;

  for (let col = 0; col < layers.length; col++) {
    const layer = layers[col];
    if (!layer) continue;
    for (let row = 0; row < layer.length; row++) {
      const nodeId = layer[row];
      if (!nodeId) continue;
      const x = PAD + col * (NODE_W + GAP_X);
      const y = PAD + row * (NODE_H + GAP_Y);
      positions.set(nodeId, { x, y });
      maxX = Math.max(maxX, x + NODE_W);
      maxY = Math.max(maxY, y + NODE_H);
    }
  }

  const svgW = maxX + PAD;
  const svgH = maxY + PAD;

  return (
    <div className="mt-3 rounded-md border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Dependency Graph
      </p>
      <div className="overflow-x-auto">
        <svg width={svgW} height={svgH} className="block">
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted-foreground/60" />
            </marker>
          </defs>

          {/* Edges */}
          {relevantEdges.map((e) => {
            const from = positions.get(e.fromId);
            const to = positions.get(e.toId);
            if (!from || !to) return null;
            return (
              <line
                key={e.id}
                x1={from.x + NODE_W}
                y1={from.y + NODE_H / 2}
                x2={to.x}
                y2={to.y + NODE_H / 2}
                className="stroke-muted-foreground/40"
                strokeWidth={1.5}
                markerEnd="url(#arrow)"
              />
            );
          })}

          {/* Nodes */}
          {[...positions.entries()].map(([id, pos]) => {
            const task = taskMap.get(id);
            if (!task) return null;
            const stateColor =
              task.currentState === "Done"
                ? "#22c55e"
                : task.currentState === "Running"
                  ? "#10b981"
                  : task.currentState === "Review"
                    ? "#f59e0b"
                    : "#94a3b8";
            return (
              <g key={id}>
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  className="fill-background stroke-border"
                  strokeWidth={1}
                />
                {/* Color indicator line at left */}
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={3}
                  height={NODE_H}
                  rx={1}
                  fill={stateColor}
                />
                <foreignObject
                  x={pos.x + 6}
                  y={pos.y + 2}
                  width={NODE_W - 12}
                  height={NODE_H - 4}
                >
                  <div className="flex items-center h-full">
                    <span className="text-[10px] leading-tight truncate text-foreground">
                      {task.title}
                    </span>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

interface ChildTasksSectionProps {
  story: Story;
}

export function ChildTasksSection({ story }: ChildTasksSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const { data: tasks = [] } = useTasks(story.id);
  const { data: allEdges = [] } = useTaskEdges();
  const { data: personas = [] } = usePersonas();
  const { data: workflows = [] } = useWorkflows();
  const updateTask = useUpdateTask();

  const personaMap = useMemo(
    () => new Map(personas.map((p) => [p.id as string, p])),
    [personas],
  );

  // Find the task workflow ID
  const taskWorkflowId = useMemo(() => {
    const tw = workflows.find((w) => w.type === "task");
    return tw?.id ?? ("" as WorkflowId);
  }, [workflows]);

  // Build set of task IDs that have incoming dependencies
  const tasksWithDeps = useMemo(() => {
    const taskIdSet = new Set(tasks.map((t) => t.id as string));
    const withDeps = new Set<string>();
    for (const edge of allEdges) {
      // toId has a dependency on fromId
      if (taskIdSet.has(edge.toId) && taskIdSet.has(edge.fromId)) {
        withDeps.add(edge.toId);
      }
    }
    return withDeps;
  }, [tasks, allEdges]);

  // Filter edges to only those within this story's tasks
  const storyEdges = useMemo(() => {
    const taskIdSet = new Set(tasks.map((t) => t.id as string));
    return allEdges.filter(
      (e) => taskIdSet.has(e.fromId) && taskIdSet.has(e.toId),
    );
  }, [tasks, allEdges]);

  const handleToggleDone = (task: Task) => {
    const newState = task.currentState === "Done" ? "Pending" : "Done";
    updateTask.mutate({ id: task.id, currentState: newState });
  };

  const doneCount = tasks.filter((t) => t.currentState === "Done").length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">Tasks</p>
          {tasks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {doneCount}/{tasks.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add task
        </Button>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="mb-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${(doneCount / tasks.length) * 100}%` }}
          />
        </div>
      )}

      {/* Inline form */}
      {showForm && taskWorkflowId && (
        <AddTaskForm
          storyId={story.id}
          workflowId={taskWorkflowId}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Task list */}
      {tasks.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground italic px-3 py-4">
          No tasks yet. Click "Add task" to create one.
        </p>
      ) : (
        <div className="space-y-0.5">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              persona={
                task.assignedPersonaId
                  ? personaMap.get(task.assignedPersonaId as string)
                  : undefined
              }
              hasDeps={tasksWithDeps.has(task.id as string)}
              onToggleDone={handleToggleDone}
            />
          ))}
        </div>
      )}

      {/* Mini dependency graph */}
      <MiniDepGraph tasks={tasks} edges={storyEdges} />
    </div>
  );
}
