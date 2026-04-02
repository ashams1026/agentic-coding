import { useState, useCallback, useMemo } from "react";
import { Save, Upload, Plus, GripVertical, Play, Pause, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAgents, useAgentAssignments, useUpdateAgentAssignment, useProjectFromUrl } from "@/hooks";
import type { AgentId, Agent } from "@agentops/shared";
import { StateCard } from "./state-card";
import { WorkflowPreview } from "./workflow-preview";
import { ValidationPanel, validateWorkflow } from "./validation-panel";
import type { StateCardData } from "./state-card";

// ── Types ───────────────────────────────────────────────────────

interface WorkflowBuilderProps {
  workflowId: string | null;
  workflowName: string;
  isPublished: boolean;
  autoRouting: boolean;
  initialStates: StateCardData[];
  onSave?: (name: string, states: StateCardData[]) => void;
  onPublish?: (name: string, states: StateCardData[]) => void;
  onToggleAutoRouting?: () => void;
}

// ── Color palette for new states ────────────────────────────────

const DEFAULT_COLORS = [
  "#6b7280", "#7c3aed", "#4f46e5", "#2563eb", "#d97706",
  "#ea580c", "#16a34a", "#dc2626", "#059669", "#0891b2",
];

// ── Model badge ────────────────────────────────────────────────

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

// ── Agent Assignments Section ──────────────────────────────────

function AgentAssignmentsSection({ states }: { states: StateCardData[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const { projectId } = useProjectFromUrl();
  const { data: agents = [] } = useAgents();
  const { data: assignments = [] } = useAgentAssignments(projectId);
  const updateAssignment = useUpdateAgentAssignment();

  const assignmentMap = useMemo(() => {
    const map = new Map<string, AgentId>();
    assignments.forEach((a) => map.set(a.stateName, a.agentId));
    return map;
  }, [assignments]);

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    agents.forEach((a) => map.set(a.id, a));
    return map;
  }, [agents]);

  const intermediateStates = useMemo(
    () => states.filter((s) => s.type === "intermediate"),
    [states],
  );

  const handleChange = (stateName: string, agentId: string) => {
    if (agentId === "none") return;
    if (!projectId) return;
    updateAssignment.mutate({
      projectId,
      stateName,
      agentId: agentId as AgentId,
    });
  };

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Agent Assignments
      </button>

      {!collapsed && (
        <>
          {intermediateStates.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Add intermediate states to assign agents.
            </p>
          ) : (
            <div className="rounded-lg border">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-0">
                {/* Header */}
                <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground border-b bg-muted/30">
                  State
                </div>
                <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground border-b bg-muted/30">
                  Agent
                </div>
                <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground border-b bg-muted/30">
                  Model
                </div>

                {/* Rows */}
                {intermediateStates.map((state, i) => {
                  const assignedAgentId = assignmentMap.get(state.name);
                  const assignedAgent = assignedAgentId ? agentMap.get(assignedAgentId) : null;
                  const isLast = i === intermediateStates.length - 1;

                  return (
                    <div key={state.id} className="contents">
                      <div className={cn("flex items-center gap-1.5 px-2 py-2", !isLast && "border-b")}>
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: state.color }}
                        />
                        <span className="text-xs truncate">{state.name || "Unnamed"}</span>
                      </div>
                      <div className={cn("flex items-center px-2 py-2", !isLast && "border-b")}>
                        <Select
                          value={assignedAgentId ?? "none"}
                          onValueChange={(v) => handleChange(state.name, v)}
                          disabled={!state.name}
                        >
                          <SelectTrigger className="h-6 text-xs">
                            <SelectValue placeholder="Not assigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not assigned</SelectItem>
                            {agents
                              .filter((a) => !a.settings?.isAssistant)
                              .map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  <span className="flex items-center gap-1.5">
                                    <span
                                      className="inline-block h-2 w-2 rounded-full"
                                      style={{ backgroundColor: a.avatar.color }}
                                    />
                                    {a.name}
                                  </span>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className={cn("flex items-center px-2 py-2", !isLast && "border-b")}>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────

export function WorkflowBuilder({
  workflowName: initialName,
  isPublished,
  autoRouting,
  initialStates,
  onSave,
  onPublish,
  onToggleAutoRouting,
}: WorkflowBuilderProps) {
  const [name, setName] = useState(initialName);
  const [states, setStates] = useState<StateCardData[]>(initialStates);

  const validationErrors = validateWorkflow(states);
  const hasErrors = validationErrors.some((e) => e.type === "error");

  // ── State CRUD ──────────────────────────────────────────────

  const addState = useCallback(() => {
    const id = `s-new-${Date.now()}`;
    const colorIndex = states.length % DEFAULT_COLORS.length;
    const newState: StateCardData = {
      id,
      name: "",
      type: "intermediate",
      color: DEFAULT_COLORS[colorIndex]!,
      agentId: null,
      agentOverrides: [],
      sortOrder: states.length,
      transitions: [],
    };
    setStates((prev) => [...prev, newState]);
  }, [states.length]);

  const updateState = useCallback((index: number, updated: StateCardData) => {
    setStates((prev) => prev.map((s, i) => (i === index ? updated : s)));
  }, []);

  const deleteState = useCallback((index: number) => {
    setStates((prev) => {
      const deletedId = prev[index]!.id;
      return prev
        .filter((_, i) => i !== index)
        .map((s) => ({
          ...s,
          transitions: s.transitions.filter((t) => t.toStateId !== deletedId),
        }));
    });
  }, []);

  const moveState = useCallback((index: number, direction: "up" | "down") => {
    setStates((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!];
      return next.map((s, i) => ({ ...s, sortOrder: i }));
    });
  }, []);

  // ── Actions ─────────────────────────────────────────────────

  const handleSave = () => onSave?.(name, states);
  const handlePublish = () => onPublish?.(name, states);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workflow name"
          className="h-8 max-w-xs text-sm font-medium"
        />
        <Badge variant={isPublished ? "default" : "secondary"} className="text-xs">
          {isPublished ? "Published" : "Draft"}
        </Badge>
        <button
          onClick={onToggleAutoRouting}
          title={autoRouting ? "Auto-routing ON — click to disable" : "Auto-routing OFF — click to enable"}
          className={cn(
            "shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors",
            autoRouting
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
              : "bg-muted text-muted-foreground border-border hover:bg-muted/80",
          )}
        >
          {autoRouting ? (
            <Play className="h-3 w-3 fill-current" />
          ) : (
            <Pause className="h-3 w-3" />
          )}
          {autoRouting ? "Auto-routing ON" : "Auto-routing OFF"}
        </button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSave}>
          <Save className="h-3.5 w-3.5" />
          Save
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={handlePublish}
          disabled={hasErrors}
          title={hasErrors ? "Fix validation errors before publishing" : "Publish workflow"}
        >
          <Upload className="h-3.5 w-3.5" />
          Publish
        </Button>
      </div>

      {/* Body: left panel + right preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — state list */}
        <div className="w-80 shrink-0 border-r overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              States ({states.length})
            </h3>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addState}>
              <Plus className="h-3 w-3" />
              Add State
            </Button>
          </div>

          {states.map((state, i) => (
            <div key={state.id} className="group relative">
              {/* Reorder grip */}
              <div className="absolute -left-1 top-2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-60 transition-opacity">
                <button
                  type="button"
                  onClick={() => moveState(i, "up")}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Move up"
                >
                  <GripVertical className="h-3 w-3" />
                </button>
              </div>
              <StateCard
                state={state}
                allStates={states}
                onChange={(updated) => updateState(i, updated)}
                onDelete={() => deleteState(i)}
              />
            </div>
          ))}

          {states.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-xs text-muted-foreground">No states yet. Click "Add State" to begin.</p>
            </div>
          )}

          {/* Agent Assignments */}
          <AgentAssignmentsSection states={states} />

          {/* Validation */}
          <div className="pt-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Validation
            </h3>
            <ValidationPanel states={states} />
          </div>
        </div>

        {/* Right panel — preview */}
        <div className="flex-1 overflow-auto p-4 bg-muted/10">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Preview
          </h3>
          <WorkflowPreview states={states} className="min-h-[200px]" />
        </div>
      </div>
    </div>
  );
}
