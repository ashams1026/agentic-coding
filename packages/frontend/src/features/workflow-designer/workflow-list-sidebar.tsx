import { useState } from "react";
import {
  Plus,
  Copy,
  Trash2,
  GitBranch,
  FileDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import type { Workflow, WorkflowId, WorkflowState, WorkflowTransition } from "@agentops/shared";

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

// ── Template definitions ─────────────────────────────────────────

interface WorkflowTemplate {
  name: string;
  type: "story" | "task";
  description: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

const TEMPLATES: WorkflowTemplate[] = [
  {
    name: "Default Story Workflow",
    type: "story",
    description: "7-state workflow: Backlog → Defining → Decomposing → In Progress → In Review → QA → Done",
    states: [
      { name: "Backlog", color: "#94a3b8", isInitial: true, isFinal: false },
      { name: "Defining", color: "#8b5cf6", isInitial: false, isFinal: false },
      { name: "Decomposing", color: "#3b82f6", isInitial: false, isFinal: false },
      { name: "In Progress", color: "#10b981", isInitial: false, isFinal: false },
      { name: "In Review", color: "#f59e0b", isInitial: false, isFinal: false },
      { name: "QA", color: "#ef4444", isInitial: false, isFinal: false },
      { name: "Done", color: "#22c55e", isInitial: false, isFinal: true },
    ],
    transitions: [
      { from: "Backlog", to: "Defining", name: "Start defining" },
      { from: "Defining", to: "Decomposing", name: "Define complete" },
      { from: "Decomposing", to: "In Progress", name: "Tasks approved" },
      { from: "In Progress", to: "In Review", name: "Submit for review" },
      { from: "In Review", to: "QA", name: "Review passed" },
      { from: "In Review", to: "In Progress", name: "Review rejected" },
      { from: "QA", to: "Done", name: "QA passed" },
      { from: "QA", to: "In Progress", name: "QA failed" },
    ],
  },
  {
    name: "Default Task Workflow",
    type: "task",
    description: "5-state workflow: Pending → Running → Review → Done / Failed",
    states: [
      { name: "Pending", color: "#94a3b8", isInitial: true, isFinal: false },
      { name: "Running", color: "#10b981", isInitial: false, isFinal: false },
      { name: "Review", color: "#f59e0b", isInitial: false, isFinal: false },
      { name: "Done", color: "#22c55e", isInitial: false, isFinal: true },
      { name: "Failed", color: "#ef4444", isInitial: false, isFinal: true },
    ],
    transitions: [
      { from: "Pending", to: "Running", name: "Start" },
      { from: "Running", to: "Review", name: "Complete" },
      { from: "Running", to: "Failed", name: "Fail" },
      { from: "Review", to: "Done", name: "Approve" },
      { from: "Review", to: "Pending", name: "Reject" },
    ],
  },
];

// ── Mini preview thumbnail ───────────────────────────────────────

function TemplatePreview({ template }: { template: WorkflowTemplate }) {
  const nodeW = 36;
  const nodeH = 12;
  const gap = 14;
  const padding = 8;

  // Simple horizontal layout
  const width = padding * 2 + template.states.length * (nodeW + gap) - gap;
  const height = padding * 2 + nodeH;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-8 rounded border border-border bg-background/50"
    >
      {/* Connecting lines */}
      {template.states.slice(0, -1).map((_, i) => (
        <line
          key={`line-${i}`}
          x1={padding + i * (nodeW + gap) + nodeW}
          y1={padding + nodeH / 2}
          x2={padding + (i + 1) * (nodeW + gap)}
          y2={padding + nodeH / 2}
          className="stroke-muted-foreground/30"
          strokeWidth={1}
        />
      ))}
      {/* State nodes */}
      {template.states.map((state, i) => (
        <rect
          key={state.name}
          x={padding + i * (nodeW + gap)}
          y={padding}
          width={nodeW}
          height={nodeH}
          rx={3}
          fill={state.color + "30"}
          stroke={state.color}
          strokeWidth={state.isFinal ? 1.5 : 0.75}
        />
      ))}
    </svg>
  );
}

// ── Template card ────────────────────────────────────────────────

interface TemplateCardProps {
  template: WorkflowTemplate;
  onUse: () => void;
  isPending: boolean;
}

function TemplateCard({ template, onUse, isPending }: TemplateCardProps) {
  const badge = typeBadgeConfig[template.type];

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <TemplatePreview template={template} />
      <div>
        <p className="text-sm font-medium">{template.name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{template.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border-0", badge.className)}>
          {badge.label}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {template.states.length} states
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2 ml-auto gap-1"
          onClick={onUse}
          disabled={isPending}
        >
          <FileDown className="h-3 w-3" />
          Use template
        </Button>
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

  const handleUseTemplate = (template: WorkflowTemplate) => {
    createMutation.mutate({
      name: template.name,
      type: template.type,
      states: template.states.map((s) => ({ ...s })),
      transitions: template.transitions.map((t) => ({ ...t })),
    }, {
      onSuccess: (wf) => {
        onSelect(wf.id);
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
      <Tabs defaultValue="workflows" className="flex flex-col h-full">
        {/* Tab headers */}
        <div className="px-3 pt-3 pb-1">
          <TabsList className="w-full h-8">
            <TabsTrigger value="workflows" className="flex-1 text-xs">
              Workflows
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex-1 text-xs">
              Templates
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Workflows tab */}
        <TabsContent value="workflows" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] text-muted-foreground">{workflows.length} workflow{workflows.length !== 1 ? "s" : ""}</span>
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
        </TabsContent>

        {/* Templates tab */}
        <TabsContent value="templates" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <div className="px-3 py-2">
            <span className="text-[10px] text-muted-foreground">Pre-built workflow templates</span>
          </div>

          <Separator />

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {TEMPLATES.map((template) => (
              <TemplateCard
                key={template.name}
                template={template}
                onUse={() => handleUseTemplate(template)}
                isPending={createMutation.isPending}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

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
