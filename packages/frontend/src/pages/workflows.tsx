import { useParams, useNavigate } from "react-router";
import { useWorkflow, useWorkflows, useUpdateWorkflow, usePublishWorkflow, useCreateWorkflow } from "@/hooks/use-workflows";
import { useSelectedProject } from "@/hooks";
import { WorkflowBuilder } from "@/features/workflow-builder/workflow-builder";
import { CreateWorkflowDialog } from "@/features/workflow-builder/create-workflow-dialog";
import type { StateCardData } from "@/features/workflow-builder/state-card";

export function WorkflowsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projectId } = useSelectedProject();
  const { data: workflows = [] } = useWorkflows(projectId ?? undefined);
  const { data: workflowData } = useWorkflow(id ?? null);
  const updateWorkflow = useUpdateWorkflow();
  const publishWorkflow = usePublishWorkflow();
  const createWorkflow = useCreateWorkflow();

  const handleCreate = (name: string) => {
    createWorkflow.mutate({ name, projectId: projectId ?? undefined }, {
      onSuccess: (wf) => navigate(`/workflows/${wf.id}`),
    });
  };

  const handleSave = (name: string, states: StateCardData[]) => {
    if (!id) return;
    // Send client-side IDs as-is (including temporary s-new-*/t-new-* IDs)
    // Backend handles mapping temporary IDs to real IDs
    const allTransitions = states.flatMap((s) =>
      s.transitions.map((t) => ({
        id: t.id,
        fromStateId: s.id,
        toStateId: t.toStateId,
        label: t.label,
      })),
    );
    updateWorkflow.mutate({
      id,
      name,
      states: states.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        color: s.color,
        personaId: s.personaId,
        sortOrder: s.sortOrder,
      })),
      transitions: allTransitions,
    });
  };

  const handlePublish = (name: string, states: StateCardData[]) => {
    if (!id) return;
    // Save first, then publish
    handleSave(name, states);
    publishWorkflow.mutate(id);
  };

  // If no workflow ID, show list/picker
  if (!id) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-4 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workflows</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Design custom state machines for your work items.
            </p>
          </div>
          <CreateWorkflowDialog onCreate={handleCreate} />
        </div>
        <div className="px-6 pb-6 flex-1 overflow-y-auto">
          {workflows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">No workflows yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((wf) => (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => navigate(`/workflows/${wf.id}`)}
                  className="rounded-lg border bg-card p-4 text-left hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">{wf.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${wf.isPublished ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                      {wf.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {wf.description || "No description"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (!workflowData) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading workflow...</p>
      </div>
    );
  }

  // Convert API data to StateCardData[]
  const initialStates: StateCardData[] = workflowData.states.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type as "initial" | "intermediate" | "terminal",
    color: s.color,
    personaId: s.personaId ?? null,
    sortOrder: s.sortOrder,
    transitions: workflowData.transitions
      .filter((t) => t.fromStateId === s.id)
      .map((t) => ({ id: t.id, toStateId: t.toStateId, label: t.label })),
  }));

  return (
    <WorkflowBuilder
      workflowId={id}
      workflowName={workflowData.workflow.name}
      isPublished={workflowData.workflow.isPublished}
      initialStates={initialStates}
      onSave={handleSave}
      onPublish={handlePublish}
    />
  );
}
