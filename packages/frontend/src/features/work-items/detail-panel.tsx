import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { X, ChevronRight, Plus, GitBranch, Bot, Archive, ArchiveRestore, Trash2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useWorkItem, useWorkItems, useProposals, useAgents, useAgentAssignments, useCreateWorkItem, useUpdateWorkItem, useArchiveWorkItem, useUnarchiveWorkItem, useDeleteWorkItem, useSelectedProject } from "@/hooks";
import { useWorkItemsStore } from "@/stores/work-items-store";
import { useToastStore } from "@/stores/toast-store";
import { CommentStream } from "@/features/common/comment-stream";
import { ExecutionTimeline } from "@/features/common/execution-timeline";
import { useWorkflowStates, useWorkflowTransitions } from "@/hooks/use-workflows";
import type { WorkItem, WorkItemId, Priority, Agent } from "@agentops/shared";

// ── Editable title ──────────────────────────────────────────────

function EditableTitle({
  value,
  onSave,
}: {
  value: string;
  onSave: (newTitle: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Sync draft when item changes externally
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const handleSave = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setEditing(false);
  }, [draft, value, onSave]);

  const handleCancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel],
  );

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-lg font-semibold leading-tight w-full bg-transparent border-b border-primary/40 outline-none py-0.5"
      />
    );
  }

  return (
    <h2
      className="text-lg font-semibold leading-tight cursor-pointer hover:text-primary/80 transition-colors"
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value}
    </h2>
  );
}

// ── Editable description ────────────────────────────────────────

function EditableDescription({
  value,
  onSave,
}: {
  value: string;
  onSave: (newDescription: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const handleSave = useCallback(() => {
    if (draft !== value) {
      onSave(draft);
    }
    setEditing(false);
    setTab("write");
  }, [draft, value, onSave]);

  const handleCancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
    setTab("write");
  }, [value]);

  if (!editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium">Description</h3>
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        </div>
        {value ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No description. Click Edit to add one.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-1">Description</h3>
      {/* Write / Preview tabs */}
      <div className="flex gap-1 mb-2 border-b">
        <button
          className={cn(
            "text-xs px-2 py-1 -mb-px border-b-2 transition-colors",
            tab === "write"
              ? "border-primary text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setTab("write")}
        >
          Write
        </button>
        <button
          className={cn(
            "text-xs px-2 py-1 -mb-px border-b-2 transition-colors",
            tab === "preview"
              ? "border-primary text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setTab("preview")}
        >
          Preview
        </button>
      </div>

      {tab === "write" ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full min-h-[120px] rounded-md border bg-transparent px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Add a description..."
          autoFocus
        />
      ) : (
        <div className="min-h-[120px] rounded-md border px-3 py-2">
          {draft ? (
            <p className="text-sm whitespace-pre-wrap">{draft}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nothing to preview.</p>
          )}
        </div>
      )}

      {/* Save / Cancel */}
      <div className="flex gap-2 mt-2">
        <Button size="sm" onClick={handleSave}>
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Priority config ─────────────────────────────────────────────

const priorityOptions: {
  value: Priority;
  label: string;
  shortLabel: string;
  className: string;
  dotColor: string;
}[] = [
  { value: "p0", label: "P0 — Critical", shortLabel: "P0", className: "border-red-500 text-red-600 dark:text-red-400", dotColor: "#dc2626" },
  { value: "p1", label: "P1 — High", shortLabel: "P1", className: "border-amber-500 text-amber-600 dark:text-amber-400", dotColor: "#d97706" },
  { value: "p2", label: "P2 — Medium", shortLabel: "P2", className: "border-blue-500 text-blue-600 dark:text-blue-400", dotColor: "#2563eb" },
  { value: "p3", label: "P3 — Low", shortLabel: "P3", className: "border-slate-400 text-slate-500 dark:text-slate-400", dotColor: "#94a3b8" },
];

const priorityConfig: Record<Priority, (typeof priorityOptions)[number]> = Object.fromEntries(
  priorityOptions.map((o) => [o.value, o]),
) as Record<Priority, (typeof priorityOptions)[number]>;

// ── Priority selector ───────────────────────────────────────────

function PrioritySelector({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Priority)}>
      <SelectTrigger className="h-7 w-auto gap-1.5 border text-xs font-semibold px-2 py-0.5">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: priorityConfig[value].dotColor }} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {priorityOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: opt.dotColor }} />
              {opt.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Label editor ────────────────────────────────────────────────

function LabelEditor({
  labels,
  onAdd,
  onRemove,
}: {
  labels: string[];
  onAdd: (label: string) => void;
  onRemove: (label: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [adding]);

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (trimmed && !labels.includes(trimmed)) {
      onAdd(trimmed);
    }
    setDraft("");
    setAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDraft("");
      setAdding(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {labels.map((label) => (
        <Badge key={label} variant="secondary" className="text-xs px-1.5 py-0 gap-1 group">
          {label}
          <button
            onClick={() => onRemove(label)}
            className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      {adding ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className="h-5 w-20 text-xs bg-transparent border-b border-primary/40 outline-none px-1"
          placeholder="label..."
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60"
        >
          + label
        </button>
      )}
    </div>
  );
}

// ── Transition prompt modal ─────────────────────────────────────

interface TransitionPromptData {
  itemTitle: string;
  fromState: string;
  toState: string;
  agent: Agent;
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
            style={{ backgroundColor: data.agent.avatar.color + "20" }}
          >
            <Bot className="h-5 w-5" style={{ color: data.agent.avatar.color }} />
          </div>
          <div>
            <p className="text-sm font-medium">{data.agent.name}</p>
            <p className="text-xs text-muted-foreground">{data.agent.description}</p>
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

// ── State transition control ───────────────────────────────────

function StateTransitionControl({
  item,
  assignmentMap,
  onTransition,
  workflowStates,
  workflowTransitions,
}: {
  item: WorkItem;
  assignmentMap: Map<string, Agent>;
  onTransition: (toState: string) => void;
  workflowStates?: Array<{ name: string; color: string }>;
  workflowTransitions?: Array<{ fromStateName: string; toStateName: string }>;
}) {
  // Compute valid target states from transitions
  const validStates = (workflowTransitions ?? [])
    .filter((t) => t.fromStateName === item.currentState)
    .map((t) => t.toStateName);

  if (validStates.length === 0) return null;

  const stateColorMap = new Map((workflowStates ?? []).map((s: { name: string; color: string }) => [s.name, s.color]));

  return (
    <Select onValueChange={onTransition}>
      <SelectTrigger className="h-7 w-auto gap-1.5 text-xs px-2 py-0.5">
        <SelectValue placeholder="Move to…" />
      </SelectTrigger>
      <SelectContent>
        {validStates.map((state) => {
          const stateColor = stateColorMap.get(state) ?? "#6b7280";
          const assignedAgent = assignmentMap.get(state);
          return (
            <SelectItem key={state} value={state}>
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: stateColor ?? "#888" }}
                />
                {state}
                {assignedAgent && (
                  <span className="text-muted-foreground ml-1">
                    → {assignedAgent.name}
                  </span>
                )}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// ── Parent breadcrumb ───────────────────────────────────────────

function ParentBreadcrumb({
  item,
  allItems,
  onNavigate,
}: {
  item: WorkItem;
  allItems: WorkItem[];
  onNavigate: (id: WorkItemId) => void;
}) {
  const chain: WorkItem[] = [];
  let current: WorkItem | undefined = item.parentId
    ? allItems.find((w) => w.id === item.parentId)
    : undefined;
  while (current) {
    chain.unshift(current);
    current = current.parentId ? allItems.find((w) => w.id === current!.parentId) : undefined;
  }

  if (chain.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2 flex-wrap">
      {chain.map((ancestor, i) => (
        <span key={ancestor.id} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          <button
            onClick={() => onNavigate(ancestor.id)}
            className="hover:text-foreground transition-colors truncate max-w-[150px]"
          >
            {ancestor.title}
          </button>
        </span>
      ))}
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground font-medium truncate max-w-[200px]">{item.title}</span>
    </div>
  );
}

// ── Children list ───────────────────────────────────────────────

function ChildrenList({
  children,
  onNavigate,
  stateColorMap,
}: {
  children: WorkItem[];
  onNavigate: (id: WorkItemId) => void;
  stateColorMap: Map<string, string>;
}) {
  if (children.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Children</h3>
        <p className="text-xs text-muted-foreground py-2">No children. Click &apos;Add child&apos; or &apos;Decompose&apos;.</p>
      </div>
    );
  }

  const done = children.filter((c) => c.currentState === "Done").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Children</h3>
        <span className="text-xs text-muted-foreground">
          {done}/{children.length} done
        </span>
      </div>
      <div className="space-y-1">
        {children.map((child) => {
          const childStateColor = stateColorMap.get(child.currentState) ?? "#6b7280";
          return (
            <button
              key={child.id}
              onClick={() => onNavigate(child.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0 shrink-0 font-medium"
                style={{
                  backgroundColor: `${childStateColor}20`,
                  color: childStateColor,
                }}
              >
                {child.currentState}
              </Badge>
              <span className="flex-1 truncate text-sm">{child.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Proposals section ───────────────────────────────────────────

function ProposalsSection({ workItemId }: { workItemId: WorkItemId }) {
  const { data: proposals = [] } = useProposals(workItemId);
  const pending = proposals.filter((p) => p.status === "pending");

  if (pending.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Pending Proposals</h3>
      <div className="space-y-2">
        {pending.map((proposal) => (
          <div key={proposal.id} className="rounded-lg border p-3 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs px-1.5 py-0 border-amber-500 text-amber-600">
                {proposal.type.replace(/_/g, " ")}
              </Badge>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
              {JSON.stringify(proposal.payload, null, 2).slice(0, 200)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Execution context viewer ────────────────────────────────────

function ExecutionContextSection({ item }: { item: WorkItem }) {
  if (item.executionContext.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Execution Context</h3>
      <div className="space-y-2">
        {item.executionContext.map((entry, i) => (
          <div
            key={i}
            className={cn(
              "rounded-md border p-2 text-xs",
              entry.outcome === "success" && "border-emerald-200 dark:border-emerald-800",
              entry.outcome === "rejected" && "border-red-200 dark:border-red-800",
              entry.outcome === "failure" && "border-red-200 dark:border-red-800",
            )}
          >
            <p className="font-medium">{entry.summary}</p>
            {entry.rejectionPayload && (
              <div className="mt-1 text-muted-foreground">
                <p>Reason: {entry.rejectionPayload.reason}</p>
                <p>Hint: {entry.rejectionPayload.hint}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Metadata section ────────────────────────────────────────────

function MetadataSection({ item }: { item: WorkItem }) {
  return (
    <div className="space-y-1 text-xs text-muted-foreground">
      <div className="flex justify-between">
        <span>ID</span>
        <span className="font-mono">{item.id}</span>
      </div>
      <div className="flex justify-between">
        <span>Created</span>
        <span>{new Date(item.createdAt).toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span>Updated</span>
        <span>{new Date(item.updatedAt).toLocaleString()}</span>
      </div>
    </div>
  );
}

// ── Main detail panel ───────────────────────────────────────────

export function DetailPanel() {
  const { projectId, project } = useSelectedProject();
  const { selectedItemId, setSelectedItemId } = useWorkItemsStore();
  const { data: item } = useWorkItem(selectedItemId!);
  const { data: allItems = [] } = useWorkItems(undefined, projectId ?? undefined);
  const { data: agents = [] } = useAgents();
  const { data: assignments = [] } = useAgentAssignments(projectId);
  const { data: workflowStatesData } = useWorkflowStates(project?.workflowId ?? null);
  const { data: workflowTransitionsData } = useWorkflowTransitions(project?.workflowId ?? null);
  const createWorkItem = useCreateWorkItem();
  const updateWorkItem = useUpdateWorkItem();
  const archiveWorkItem = useArchiveWorkItem();
  const unarchiveWorkItem = useUnarchiveWorkItem();
  const deleteWorkItem = useDeleteWorkItem();
  const addToast = useToastStore((s) => s.addToast);

  const [promptData, setPromptData] = useState<TransitionPromptData | null>(null);
  const [pendingState, setPendingState] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const children = useMemo(
    () => allItems.filter((w) => w.parentId === selectedItemId),
    [allItems, selectedItemId],
  );

  const agent = useMemo(() => {
    if (!item?.assignedAgentId) return null;
    return agents.find((p) => p.id === item.assignedAgentId) ?? null;
  }, [item, agents]);

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    agents.forEach((p) => map.set(p.id, p));
    return map;
  }, [agents]);

  const assignmentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    assignments.forEach((a) => {
      const p = agentMap.get(a.agentId);
      if (p) map.set(a.stateName, p);
    });
    return map;
  }, [assignments, agentMap]);

  if (!selectedItemId) return null;

  if (!item) {
    return (
      <div className="h-full border-l border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-7 w-7 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded bg-muted animate-pulse" />
          <div className="h-5 w-12 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-20 rounded bg-muted animate-pulse" />
        <div className="h-32 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  // Dynamic state color lookup
  const stateColorMap = new Map((workflowStatesData ?? []).map((s: { name: string; color: string }) => [s.name, s.color]));
  const getColor = (name: string) => stateColorMap.get(name) ?? "#6b7280";
  const stateInfo = { color: getColor(item.currentState) };

  const handleClose = () => setSelectedItemId(null);
  const handleNavigate = (id: WorkItemId) => setSelectedItemId(id);
  const handleAddChild = () => {
    createWorkItem.mutate({
      projectId: item.projectId,
      parentId: item.id,
      title: "New child item",
    });
  };

  const handleTransition = (toState: string) => {
    const assignedAgent = assignmentMap.get(toState);
    if (assignedAgent) {
      setPromptData({
        itemTitle: item.title,
        fromState: item.currentState,
        toState,
        agent: assignedAgent,
      });
      setPendingState(toState);
    } else {
      updateWorkItem.mutate({ id: item.id, currentState: toState });
    }
  };

  const handlePromptRun = () => {
    if (pendingState) {
      updateWorkItem.mutate({ id: item.id, currentState: pendingState });
    }
    setPromptData(null);
    setPendingState(null);
  };

  const handlePromptSkip = () => {
    if (pendingState) {
      updateWorkItem.mutate({ id: item.id, currentState: pendingState });
    }
    setPromptData(null);
    setPendingState(null);
  };

  const handlePromptCancel = () => {
    setPromptData(null);
    setPendingState(null);
  };

  return (
    <div className="h-full border-l bg-background flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-4 border-b">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <ParentBreadcrumb item={item} allItems={allItems} onNavigate={handleNavigate} />
            <EditableTitle
              value={item.title}
              onSave={(newTitle) => updateWorkItem.mutate({ id: item.id, title: newTitle })}
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Archive / Unarchive button */}
            {item.archivedAt ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => unarchiveWorkItem.mutate(item.id)}
                  >
                    <ArchiveRestore className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Unarchive</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      archiveWorkItem.mutate({ id: item.id }, {
                        onSuccess: () => {
                          addToast({
                            type: "success",
                            title: `"${item.title}" archived`,
                            action: {
                              label: "Undo",
                              onClick: () => unarchiveWorkItem.mutate(item.id),
                            },
                          });
                        },
                      });
                    }}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Archive</TooltipContent>
              </Tooltip>
            )}

            {/* Overflow menu with Delete */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close panel</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge
            variant="secondary"
            className="text-xs px-2 py-0.5 font-medium"
            style={{
              backgroundColor: stateInfo ? `${stateInfo.color}20` : undefined,
              color: stateInfo?.color,
              borderColor: stateInfo ? `${stateInfo.color}40` : undefined,
            }}
          >
            {item.currentState}
          </Badge>
          <StateTransitionControl
            item={item}
            assignmentMap={assignmentMap}
            onTransition={handleTransition}
            workflowStates={workflowStatesData}
            workflowTransitions={workflowTransitionsData?.map((t) => ({
              fromStateName: workflowStatesData?.find((s) => s.id === t.fromStateId)?.name ?? "",
              toStateName: workflowStatesData?.find((s) => s.id === t.toStateId)?.name ?? "",
            }))}
          />
          <PrioritySelector
            value={item.priority}
            onChange={(p) => updateWorkItem.mutate({ id: item.id, priority: p })}
          />
          {agent && (
            <div className="flex items-center gap-1 ml-auto">
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: agent.avatar.color }}
              >
                {agent.name.charAt(0)}
              </div>
              <span className="text-xs text-muted-foreground">{agent.name}</span>
            </div>
          )}
        </div>

        {/* Labels */}
        <div className="mt-2">
          <LabelEditor
            labels={item.labels}
            onAdd={(label) =>
              updateWorkItem.mutate({ id: item.id, labels: [...item.labels, label] })
            }
            onRemove={(label) =>
              updateWorkItem.mutate({ id: item.id, labels: item.labels.filter((l) => l !== label) })
            }
          />
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Description */}
          <EditableDescription
            value={item.description}
            onSave={(desc) => updateWorkItem.mutate({ id: item.id, description: desc })}
          />

          {/* Children */}
          <div>
            <ChildrenList children={children} onNavigate={handleNavigate} stateColorMap={stateColorMap} />
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={handleAddChild}>
                <Plus className="h-3 w-3" />
                Add child
              </Button>
              {children.length === 0 && (
                <Button variant="outline" size="sm" className="gap-1">
                  <GitBranch className="h-3 w-3" />
                  Decompose
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Proposals */}
          <ProposalsSection workItemId={item.id} />

          {/* Execution Context */}
          <ExecutionContextSection item={item} />

          <Separator />

          {/* Comments */}
          <div>
            <h3 className="text-sm font-medium mb-2">Comments</h3>
            <CommentStream workItemId={item.id} />
          </div>

          <Separator />

          {/* Execution Timeline */}
          <div>
            <h3 className="text-sm font-medium mb-2">Execution History</h3>
            <ExecutionTimeline workItemId={item.id} />
          </div>

          <Separator />

          {/* Metadata */}
          <MetadataSection item={item} />
        </div>
      </ScrollArea>

      <TransitionPrompt
        open={promptData !== null}
        data={promptData}
        onRun={handlePromptRun}
        onSkip={handlePromptSkip}
        onCancel={handlePromptCancel}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete work item?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{item.title}&rdquo; and all its related data will be soft-deleted. You can restore it within 30 days from Settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteWorkItem.mutate(item.id, {
                  onSuccess: () => {
                    setSelectedItemId(null);
                    setShowDeleteDialog(false);
                  },
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
