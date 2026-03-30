import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { usePersonas, usePersonaAssignments, useUpdatePersonaAssignment } from "@/hooks";
import { WORKFLOW } from "@agentops/shared";
import type { ProjectId, PersonaId, Persona } from "@agentops/shared";

const PROJECT_ID = "pj-agntops" as ProjectId;

// ── Auto-routing toggle ─────────────────────────────────────────

function AutoRoutingToggle() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">Auto-routing</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Router agent automatically transitions work items between states after each persona completes.
        </p>
      </div>
      <button
        className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-500 transition-colors"
        role="switch"
        aria-checked="true"
      >
        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
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
  const { data: personas = [] } = usePersonas();
  const { data: assignments = [] } = usePersonaAssignments(PROJECT_ID);
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
    updateAssignment.mutate({
      projectId: PROJECT_ID,
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

// ── State machine diagram (read-only SVG) ───────────────────────

function WorkflowDiagram() {
  const states = WORKFLOW.states;
  const transitions = WORKFLOW.transitions;

  // Layout: horizontal flow with Blocked below
  const mainStates = states.filter((s) => s.name !== "Blocked");
  const blockedState = states.find((s) => s.name === "Blocked");

  const nodeWidth = 100;
  const nodeHeight = 32;
  const gap = 20;
  const startX = 10;
  const startY = 30;
  const svgWidth = mainStates.length * (nodeWidth + gap) + startX;
  const svgHeight = blockedState ? 140 : 80;

  const statePositions = new Map<string, { x: number; y: number }>();
  mainStates.forEach((s, i) => {
    statePositions.set(s.name, { x: startX + i * (nodeWidth + gap), y: startY });
  });
  if (blockedState) {
    statePositions.set("Blocked", { x: svgWidth / 2 - nodeWidth / 2, y: startY + 70 });
  }

  return (
    <div className="rounded-lg border p-4 bg-muted/10">
      <p className="text-xs font-medium text-muted-foreground mb-3">Workflow State Machine</p>
      <div className="overflow-x-auto">
        <svg
          width={svgWidth + 10}
          height={svgHeight}
          className="text-foreground"
          style={{ minWidth: svgWidth + 10 }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 8 3, 0 6"
                className="fill-muted-foreground/50"
              />
            </marker>
          </defs>

          {/* Transition arrows */}
          {Object.entries(transitions).map(([from, tos]) =>
            tos.map((to) => {
              const fromPos = statePositions.get(from);
              const toPos = statePositions.get(to as string);
              if (!fromPos || !toPos) return null;

              const fromCx = fromPos.x + nodeWidth / 2;
              const fromCy = fromPos.y + nodeHeight / 2;
              const toCx = toPos.x + nodeWidth / 2;
              const toCy = toPos.y + nodeHeight / 2;

              // Determine edge connection points
              let x1: number, y1: number, x2: number, y2: number;
              if (fromCy === toCy) {
                // Same row — horizontal
                x1 = fromPos.x + nodeWidth;
                y1 = fromCy;
                x2 = toPos.x;
                y2 = toCy;
              } else if (toCy > fromCy) {
                // Going down (to Blocked)
                x1 = fromCx;
                y1 = fromPos.y + nodeHeight;
                x2 = toCx;
                y2 = toPos.y;
              } else {
                // Going up (from Blocked)
                x1 = fromCx;
                y1 = fromPos.y;
                x2 = toCx;
                y2 = toPos.y + nodeHeight;
              }

              return (
                <line
                  key={`${from}-${to}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className="stroke-muted-foreground/30"
                  strokeWidth="1.5"
                  markerEnd="url(#arrowhead)"
                />
              );
            }),
          )}

          {/* State nodes */}
          {states.map((state) => {
            const pos = statePositions.get(state.name);
            if (!pos) return null;

            return (
              <g key={state.name}>
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={6}
                  ry={6}
                  fill={`${state.color}20`}
                  stroke={state.color}
                  strokeWidth={1.5}
                />
                <text
                  x={pos.x + nodeWidth / 2}
                  y={pos.y + nodeHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-foreground"
                  fontSize={10}
                  fontWeight={500}
                >
                  {state.name}
                </text>
              </g>
            );
          })}
        </svg>
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

      <Separator />

      <WorkflowDiagram />
    </div>
  );
}
