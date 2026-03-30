import { useMemo, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Bot, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useWorkItems, usePersonas, useUpdateWorkItem, usePersonaAssignments } from "@/hooks";
import { useWorkItemsStore } from "@/stores/work-items-store";
import { WORKFLOW } from "@agentops/shared";
import type { WorkItem, WorkItemId, Priority, Persona, ProjectId } from "@agentops/shared";

// ── Priority config ─────────────────────────────────────────────

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  p0: { label: "P0", className: "border-red-500 text-red-600 dark:text-red-400" },
  p1: { label: "P1", className: "border-amber-500 text-amber-600 dark:text-amber-400" },
  p2: { label: "P2", className: "border-blue-500 text-blue-600 dark:text-blue-400" },
  p3: { label: "P3", className: "border-slate-400 text-slate-500 dark:text-slate-400" },
};

// ── Progress pill ───────────────────────────────────────────────

function ProgressPill({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  return (
    <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
      {done}/{total}
    </span>
  );
}

// ── Persona avatar ──────────────────────────────────────────────

function PersonaAvatar({ persona }: { persona: Persona }) {
  return (
    <div
      className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: persona.avatar.color }}
      title={persona.name}
    >
      {persona.name.charAt(0)}
    </div>
  );
}

// ── Work Item Card ──────────────────────────────────────────────

interface WorkItemCardProps {
  item: WorkItem;
  childrenDone: number;
  childrenTotal: number;
  persona: Persona | null;
  isSelected: boolean;
  onClick: () => void;
}

function WorkItemCard({ item, childrenDone, childrenTotal, persona, isSelected, onClick }: WorkItemCardProps) {
  const pCfg = priorityConfig[item.priority];

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:border-primary/30",
        isSelected && "border-primary ring-1 ring-primary/20",
      )}
      onClick={onClick}
    >
      <CardContent className="space-y-2">
        <p className="text-sm font-medium leading-tight line-clamp-2">{item.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className={cn("text-xs px-1.5 py-0 font-semibold", pCfg.className)}
          >
            {pCfg.label}
          </Badge>
          <ProgressPill done={childrenDone} total={childrenTotal} />
          {persona && (
            <div className="ml-auto">
              <PersonaAvatar persona={persona} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Draggable wrapper ───────────────────────────────────────────

function DraggableCard({ item, ...rest }: WorkItemCardProps & { item: WorkItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <WorkItemCard item={item} {...rest} />
    </div>
  );
}

// ── Droppable column ────────────────────────────────────────────

interface BoardColumnProps {
  stateName: string;
  stateColor: string;
  items: WorkItem[];
  childStats: Map<string, { done: number; total: number }>;
  personaMap: Map<string, Persona>;
  selectedItemId: WorkItemId | null;
  onSelect: (id: WorkItemId) => void;
}

function BoardColumn({ stateName, stateColor, items, childStats, personaMap, selectedItemId, onSelect }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stateName });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-[280px] shrink-0 flex-col rounded-lg border bg-muted/30 p-2",
        isOver && "ring-2 ring-primary/40 bg-primary/5",
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 pb-3">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: stateColor }} />
        <span className="text-sm font-medium">{stateName}</span>
        <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
          {items.length}
        </Badge>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pb-2">
          {items.map((item) => {
            const stats = childStats.get(item.id) ?? { done: 0, total: 0 };
            const persona = item.assignedPersonaId ? personaMap.get(item.assignedPersonaId) ?? null : null;
            return (
              <DraggableCard
                key={item.id}
                item={item}
                childrenDone={stats.done}
                childrenTotal={stats.total}
                persona={persona}
                isSelected={selectedItemId === item.id}
                onClick={() => onSelect(item.id)}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Transition prompt modal ─────────────────────────────────────

interface TransitionPromptData {
  itemTitle: string;
  fromState: string;
  toState: string;
  persona: Persona;
}

function TransitionPrompt({
  open,
  data,
  onRun,
  onSkip,
  onCancel,
}: {
  open: boolean;
  data: TransitionPromptData | null;
  onRun: () => void;
  onSkip: () => void;
  onCancel: () => void;
}) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trigger Agent</DialogTitle>
          <DialogDescription>
            Moving &ldquo;{data.itemTitle}&rdquo; to{" "}
            <span className="font-medium text-foreground">{data.toState}</span>{" "}
            will trigger an agent.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: data.persona.avatar.color + "20" }}
          >
            <Bot className="h-5 w-5" style={{ color: data.persona.avatar.color }} />
          </div>
          <div>
            <p className="text-sm font-medium">{data.persona.name}</p>
            <p className="text-xs text-muted-foreground">{data.persona.description}</p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="secondary" onClick={onSkip}>Skip</Button>
          <Button onClick={onRun}>Run</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Scope selector breadcrumb ───────────────────────────────────

function ScopeSelector({
  scopeParent,
  allItems,
  onScopeChange,
}: {
  scopeParent: WorkItemId | null;
  allItems: WorkItem[];
  onScopeChange: (parentId: WorkItemId | null) => void;
}) {
  const breadcrumb: { id: WorkItemId | null; title: string }[] = [
    { id: null, title: "Top-level items" },
  ];

  if (scopeParent) {
    let current: WorkItem | undefined = allItems.find((w) => w.id === scopeParent);
    const chain: { id: WorkItemId; title: string }[] = [];
    while (current) {
      chain.unshift({ id: current.id, title: current.title });
      current = current.parentId ? allItems.find((w) => w.id === current!.parentId) : undefined;
    }
    breadcrumb.push(...chain);
  }

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
      {breadcrumb.map((crumb, i) => (
        <span key={crumb.id ?? "root"} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          <button
            onClick={() => onScopeChange(crumb.id)}
            className={cn(
              "hover:text-foreground transition-colors",
              i === breadcrumb.length - 1 ? "text-foreground font-medium" : "",
            )}
          >
            {crumb.title}
          </button>
        </span>
      ))}
    </div>
  );
}

// ── Main board view ─────────────────────────────────────────────

export function BoardView() {
  const { data: allItems, isLoading } = useWorkItems();
  const { data: personas } = usePersonas();
  const { data: assignments } = usePersonaAssignments("pj-agntops" as ProjectId);
  const updateWorkItem = useUpdateWorkItem();
  const { selectedItemId, setSelectedItemId } = useWorkItemsStore();

  const [scopeParent, setScopeParent] = useState<WorkItemId | null>(null);
  const [draggedItem, setDraggedItem] = useState<WorkItem | null>(null);
  const [promptData, setPromptData] = useState<TransitionPromptData | null>(null);
  const [pendingDrop, setPendingDrop] = useState<{ itemId: WorkItemId; toState: string } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const personaMap = useMemo(() => {
    const map = new Map<string, Persona>();
    personas?.forEach((p) => map.set(p.id, p));
    return map;
  }, [personas]);

  const assignmentMap = useMemo(() => {
    const map = new Map<string, Persona>();
    assignments?.forEach((a) => {
      const persona = personaMap.get(a.personaId);
      if (persona) map.set(a.stateName, persona);
    });
    return map;
  }, [assignments, personaMap]);

  // Items scoped to the current parent
  const scopedItems = useMemo(() => {
    if (!allItems) return [];
    return allItems.filter((w) => w.parentId === scopeParent);
  }, [allItems, scopeParent]);

  // Group by state
  const columnData = useMemo(() => {
    const map = new Map<string, WorkItem[]>();
    for (const state of WORKFLOW.states) {
      map.set(state.name, []);
    }
    for (const item of scopedItems) {
      const bucket = map.get(item.currentState);
      if (bucket) bucket.push(item);
    }
    return map;
  }, [scopedItems]);

  // Child stats for progress pills
  const childStats = useMemo(() => {
    if (!allItems) return new Map<string, { done: number; total: number }>();
    const map = new Map<string, { done: number; total: number }>();
    for (const item of allItems) {
      if (!item.parentId) continue;
      const stats = map.get(item.parentId) ?? { done: 0, total: 0 };
      stats.total++;
      if (item.currentState === "Done") stats.done++;
      map.set(item.parentId, stats);
    }
    return map;
  }, [allItems]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const item = (event.active.data.current as { item: WorkItem } | undefined)?.item;
    if (item) setDraggedItem(item);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggedItem(null);
      const { active, over } = event;
      if (!over) return;

      const itemId = active.id as WorkItemId;
      const toState = over.id as string;
      const item = allItems?.find((w) => w.id === itemId);
      if (!item || item.currentState === toState) return;

      // Check if target state has an assigned persona
      const assignedPersona = assignmentMap.get(toState);
      if (assignedPersona) {
        setPromptData({
          itemTitle: item.title,
          fromState: item.currentState,
          toState,
          persona: assignedPersona,
        });
        setPendingDrop({ itemId, toState });
        return;
      }

      // No persona — just move
      updateWorkItem.mutate({ id: itemId, currentState: toState });
    },
    [allItems, assignmentMap, updateWorkItem],
  );

  const handlePromptRun = () => {
    if (pendingDrop) {
      updateWorkItem.mutate({ id: pendingDrop.itemId, currentState: pendingDrop.toState });
    }
    setPromptData(null);
    setPendingDrop(null);
  };

  const handlePromptSkip = () => {
    if (pendingDrop) {
      updateWorkItem.mutate({ id: pendingDrop.itemId, currentState: pendingDrop.toState });
    }
    setPromptData(null);
    setPendingDrop(null);
  };

  const handlePromptCancel = () => {
    setPromptData(null);
    setPendingDrop(null);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 h-full overflow-x-auto p-2">
        {WORKFLOW.states.map((s) => (
          <div key={s.name} className="w-[280px] shrink-0 rounded-lg bg-muted/30 animate-pulse h-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScopeSelector
        scopeParent={scopeParent}
        allItems={allItems ?? []}
        onScopeChange={setScopeParent}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="flex-1">
          <div className="flex gap-4 h-full pb-4">
            {WORKFLOW.states.map((state) => (
              <BoardColumn
                key={state.name}
                stateName={state.name}
                stateColor={state.color}
                items={columnData.get(state.name) ?? []}
                childStats={childStats}
                personaMap={personaMap}
                selectedItemId={selectedItemId}
                onSelect={setSelectedItemId}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay>
          {draggedItem && (
            <div className="w-[260px]">
              <WorkItemCard
                item={draggedItem}
                childrenDone={childStats.get(draggedItem.id)?.done ?? 0}
                childrenTotal={childStats.get(draggedItem.id)?.total ?? 0}
                persona={draggedItem.assignedPersonaId ? personaMap.get(draggedItem.assignedPersonaId) ?? null : null}
                isSelected={false}
                onClick={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TransitionPrompt
        open={promptData !== null}
        data={promptData}
        onRun={handlePromptRun}
        onSkip={handlePromptSkip}
        onCancel={handlePromptCancel}
      />
    </div>
  );
}
