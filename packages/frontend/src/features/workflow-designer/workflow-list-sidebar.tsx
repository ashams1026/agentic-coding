import { useState } from "react";
import {
  Plus,
  Copy,
  Trash2,
  GitBranch,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import {
  useWorkflows,
  useCreateWorkflow,
  useDeleteWorkflow,
} from "@/hooks";
import { cn } from "@/lib/utils";
import type { Workflow, WorkflowId } from "@agentops/shared";

// ── Props ────────────────────────────────────────────────────────

interface WorkflowListSidebarProps {
  selectedId: WorkflowId | null;
  onSelect: (id: WorkflowId) => void;
}

// ── Type badge ───────────────────────────────────────────────────

const typeBadgeConfig = {
  story: { label: "Story", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  task: { label: "Task", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
} as const;

// ── Sidebar entry ────────────────────────────────────────────────

interface WorkflowEntryProps {
  workflow: Workflow;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function WorkflowEntry({ workflow, isSelected, onSelect, onDuplicate, onDelete }: WorkflowEntryProps) {
  const badge = typeBadgeConfig[workflow.type];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter") onSelect(); }}
      className={cn(
        "group flex flex-col gap-1.5 rounded-md px-3 py-2.5 cursor-pointer transition-colors",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium truncate flex-1">{workflow.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border-0", badge.className)}>
          {badge.label}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {workflow.states.length} states
        </span>
        {workflow.isDefault && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
            Default
          </Badge>
        )}

        {/* Actions — visible on hover */}
        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            title="Duplicate"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────

export function WorkflowListSidebar({ selectedId, onSelect }: WorkflowListSidebarProps) {
  const { data: workflows } = useWorkflows();
  const createMutation = useCreateWorkflow();
  const deleteMutation = useDeleteWorkflow();
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);

  const handleCreate = () => {
    createMutation.mutate({
      name: `New Workflow ${(workflows?.length ?? 0) + 1}`,
      type: "story",
      states: [
        { name: "Backlog", color: "#94a3b8", isInitial: true, isFinal: false },
        { name: "Done", color: "#22c55e", isInitial: false, isFinal: true },
      ],
      transitions: [
        { from: "Backlog", to: "Done", name: "Complete" },
      ],
    }, {
      onSuccess: (wf) => {
        onSelect(wf.id);
      },
    });
  };

  const handleDuplicate = (wf: Workflow) => {
    createMutation.mutate({
      name: `${wf.name} (copy)`,
      type: wf.type,
      states: wf.states.map((s) => ({ ...s })),
      transitions: wf.transitions.map((t) => ({ ...t })),
    }, {
      onSuccess: (newWf) => {
        onSelect(newWf.id);
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        if (selectedId === deleteTarget.id) {
          const remaining = workflows?.filter((w) => w.id !== deleteTarget.id);
          if (remaining && remaining.length > 0) {
            onSelect(remaining[0]!.id);
          }
        }
        setDeleteTarget(null);
      },
    });
  };

  if (!workflows) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <h2 className="text-sm font-semibold">Workflows</h2>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={handleCreate}
          disabled={createMutation.isPending}
        >
          <Plus className="h-3 w-3" />
          Create new
        </Button>
      </div>

      <Separator />

      {/* Workflow list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {workflows.length === 0 ? (
          <div className="text-center py-8">
            <GitBranch className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No workflows yet</p>
            <Button
              variant="link"
              size="sm"
              className="text-xs mt-1"
              onClick={handleCreate}
            >
              Create your first workflow
            </Button>
          </div>
        ) : (
          workflows.map((wf) => (
            <WorkflowEntry
              key={wf.id as string}
              workflow={wf}
              isSelected={selectedId === wf.id}
              onSelect={() => onSelect(wf.id)}
              onDuplicate={() => handleDuplicate(wf)}
              onDelete={() => setDeleteTarget(wf)}
            />
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
              {deleteTarget?.isDefault && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                  Warning: This is a default workflow.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
