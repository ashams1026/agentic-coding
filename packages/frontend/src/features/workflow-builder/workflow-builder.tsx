import { useState, useCallback } from "react";
import { Save, Upload, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StateCard } from "./state-card";
import { WorkflowPreview } from "./workflow-preview";
import { ValidationPanel, validateWorkflow } from "./validation-panel";
import type { StateCardData } from "./state-card";

// ── Types ───────────────────────────────────────────────────────

interface WorkflowBuilderProps {
  workflowId: string | null;
  workflowName: string;
  isPublished: boolean;
  initialStates: StateCardData[];
  onSave?: (name: string, states: StateCardData[]) => void;
  onPublish?: (name: string, states: StateCardData[]) => void;
}

// ── Color palette for new states ────────────────────────────────

const DEFAULT_COLORS = [
  "#6b7280", "#7c3aed", "#4f46e5", "#2563eb", "#d97706",
  "#ea580c", "#16a34a", "#dc2626", "#059669", "#0891b2",
];

// ── Component ───────────────────────────────────────────────────

export function WorkflowBuilder({
  workflowName: initialName,
  isPublished,
  initialStates,
  onSave,
  onPublish,
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
