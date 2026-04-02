import { useMemo } from "react";
import { Play, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAgents, useAgentAssignments, useUpdateAgentAssignment, useUpdateProject, useSelectedProject } from "@/hooks";
import { useWorkflowStates, useWorkflows, useUpdateWorkflow } from "@/hooks/use-workflows";
import type { AgentId, Agent } from "@agentops/shared";
import { cn } from "@/lib/utils";

// ── Auto-routing play/pause ─────────────────────────────────────

function AutoRoutingToggle() {
  const { projectId, project } = useSelectedProject();
  const { data: workflows = [] } = useWorkflows(projectId ?? undefined);
  const updateWorkflow = useUpdateWorkflow();

  // Find the active workflow for this project
  const activeWorkflow = workflows.find((w) => w.id === project?.workflowId) ?? workflows[0];
  const autoRouting = activeWorkflow?.autoRouting ?? false;

  const handleToggle = () => {
    if (!activeWorkflow) return;
    updateWorkflow.mutate({ id: activeWorkflow.id, autoRouting: !autoRouting });
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleToggle}
            disabled={!activeWorkflow}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-colors disabled:opacity-50",
              autoRouting
                ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400",
            )}
          >
            {autoRouting ? <Play className="h-5 w-5 ml-0.5" /> : <Pause className="h-5 w-5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {autoRouting
            ? "Auto-routing: active — agents automatically transition work items"
            : "Auto-routing: paused — manual transitions only"}
        </TooltipContent>
      </Tooltip>
      <div className="flex-1">
        <p className="text-sm font-medium">
          Auto-routing: {autoRouting ? "Active" : "Paused"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {autoRouting
            ? "Work flows automatically through the pipeline. Agents transition items between states."
            : "Pipeline is paused. You control all state transitions manually."}
        </p>
      </div>
    </div>
  );
}

// ── Model badge ─────────────────────────────────────────────────

function ModelBadge({ model }: { model: string }) {
  const colors: Record<string, string> = {
    opus: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    sonnet: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    haiku: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };
  return (
    <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${colors[model] ?? ""}`}>
      {model}
    </Badge>
  );
}

// ── Agent-per-state table ─────────────────────────────────────

function AgentStateTable() {
  const { projectId, project } = useSelectedProject();
  const { data: agents = [] } = useAgents();
  const { data: assignments = [] } = useAgentAssignments(projectId);
  const updateAssignment = useUpdateAgentAssignment();
  const { data: workflowStatesData } = useWorkflowStates(project?.workflowId ?? null);

  const assignmentMap = useMemo(() => {
    const map = new Map<string, AgentId>();
    assignments.forEach((a) => map.set(a.stateName, a.agentId));
    return map;
  }, [assignments]);

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    agents.forEach((p) => map.set(p.id, p));
    return map;
  }, [agents]);

  const handleChange = (stateName: string, agentId: string) => {
    if (agentId === "none") return;
    if (!projectId) return;
    updateAssignment.mutate({
      projectId,
      stateName,
      agentId: agentId as AgentId,
    });
  };

  // States that can have agents (exclude initial and terminal types)
  const configurableStates = useMemo(() => {
    if (!workflowStatesData) return [];
    return workflowStatesData.filter(
      (s) => s.type === "intermediate",
    );
  }, [workflowStatesData]);

  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-0">
        {/* Header */}
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
          State
        </div>
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
          Agent
        </div>
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
          Model
        </div>

        {/* Rows */}
        {configurableStates.map((state, i) => {
          const assignedAgentId = assignmentMap.get(state.name);
          const assignedAgent = assignedAgentId ? agentMap.get(assignedAgentId) : null;
          const isLast = i === configurableStates.length - 1;

          return (
            <div key={state.name} className="contents">
              <div className={`flex items-center gap-2 px-3 py-2.5 ${!isLast ? "border-b" : ""}`}>
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: state.color }}
                />
                <span className="text-sm">{state.name}</span>
              </div>
              <div className={`flex items-center px-3 py-2.5 ${!isLast ? "border-b" : ""}`}>
                <Select
                  value={assignedAgentId ?? "none"}
                  onValueChange={(v) => handleChange(state.name, v)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Not assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not assigned</SelectItem>
                    {agents.filter((p) => !p.settings?.isAssistant).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: p.avatar.color }}
                          />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={`flex items-center px-3 py-2.5 ${!isLast ? "border-b" : ""}`}>
                {assignedAgent ? (
                  <ModelBadge model={assignedAgent.model} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Non-configurable states note */}
      <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/20 border-t">
        Initial and terminal states have no assigned agents — they are manual or auto-triggered states.
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

function WorkflowSelector() {
  const { projectId, project } = useSelectedProject();
  const { data: workflows = [] } = useWorkflows(projectId ?? undefined);
  const updateProject = useUpdateProject();

  if (workflows.length <= 1) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Active Workflow</h3>
      <Select
        value={project?.workflowId ?? ""}
        onValueChange={(v) => {
          if (project) {
            updateProject.mutate({ id: project.id, settings: { ...project.settings }, workflowId: v } as any);
          }
        }}
      >
        <SelectTrigger className="w-[200px] h-8 text-xs">
          <SelectValue placeholder="Select workflow" />
        </SelectTrigger>
        <SelectContent>
          {workflows.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.name} {w.isPublished ? "" : "(draft)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function WorkflowConfigSection() {
  return (
    <div className="space-y-6">
      <AutoRoutingToggle />
      <WorkflowSelector />

      <div>
        <h3 className="text-sm font-medium mb-2">Agent Assignments</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Assign a agent to each workflow state. When a work item enters a state, the assigned agent is triggered automatically.
        </p>
        <AgentStateTable />
      </div>
    </div>
  );
}
