import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects, useUpdateProject, usePersonas, usePersonaAssignments, useUpdatePersonaAssignment, useSelectedProject } from "@/hooks";
import { WORKFLOW } from "@agentops/shared";
import type { PersonaId, Persona } from "@agentops/shared";

// ── Auto-routing toggle ─────────────────────────────────────────

function AutoRoutingToggle() {
  const { data: projectsList } = useProjects();
  const updateProject = useUpdateProject();

  const project = projectsList?.[0];
  const settings = project?.settings as Record<string, unknown> | undefined;
  const autoRouting = settings?.autoRouting !== false; // default ON

  const handleToggle = () => {
    if (!project) return;
    updateProject.mutate({
      id: project.id,
      settings: { ...project.settings, autoRouting: !autoRouting },
    });
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium">Auto-routing</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {autoRouting
            ? "Auto-routing: ON \u2014 Router agent will automatically transition work items"
            : "Auto-routing: OFF \u2014 Manual transitions only"}
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={!project}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
          autoRouting ? "bg-emerald-500" : "bg-muted-foreground/30"
        }`}
        role="switch"
        aria-checked={autoRouting}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            autoRouting ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
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

// ── Persona-per-state table ─────────────────────────────────────

function PersonaStateTable() {
  const { projectId } = useSelectedProject();
  const { data: personas = [] } = usePersonas();
  const { data: assignments = [] } = usePersonaAssignments(projectId);
  const updateAssignment = useUpdatePersonaAssignment();

  const assignmentMap = useMemo(() => {
    const map = new Map<string, PersonaId>();
    assignments.forEach((a) => map.set(a.stateName, a.personaId));
    return map;
  }, [assignments]);

  const personaMap = useMemo(() => {
    const map = new Map<string, Persona>();
    personas.forEach((p) => map.set(p.id, p));
    return map;
  }, [personas]);

  const handleChange = (stateName: string, personaId: string) => {
    if (personaId === "none") return;
    if (!projectId) return;
    updateAssignment.mutate({
      projectId,
      stateName,
      personaId: personaId as PersonaId,
    });
  };

  // States that can have personas (not Backlog, Done, or Blocked per PLANNING.md)
  const configurableStates = WORKFLOW.states.filter(
    (s) => s.name !== "Backlog" && s.name !== "Done" && s.name !== "Blocked",
  );

  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-0">
        {/* Header */}
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
          State
        </div>
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
          Persona
        </div>
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
          Model
        </div>

        {/* Rows */}
        {configurableStates.map((state, i) => {
          const assignedPersonaId = assignmentMap.get(state.name);
          const assignedPersona = assignedPersonaId ? personaMap.get(assignedPersonaId) : null;
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
                  value={assignedPersonaId ?? "none"}
                  onValueChange={(v) => handleChange(state.name, v)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Not assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not assigned</SelectItem>
                    {personas.map((p) => (
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
                {assignedPersona ? (
                  <ModelBadge model={assignedPersona.model} />
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
        Backlog, Done, and Blocked have no assigned personas — they are manual or auto-triggered states.
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

export function WorkflowConfigSection() {
  return (
    <div className="space-y-6">
      <AutoRoutingToggle />

      <div>
        <h3 className="text-sm font-medium mb-2">Persona Assignments</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Assign a persona to each workflow state. When a work item enters a state, the assigned persona is triggered automatically.
        </p>
        <PersonaStateTable />
      </div>
    </div>
  );
}
