import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAgents } from "@/hooks";
import { TransitionRow } from "./transition-row";

// ── Color options ───────────────────────────────────────────────

const COLOR_OPTIONS = [
  "#6b7280", "#7c3aed", "#4f46e5", "#2563eb", "#d97706",
  "#ea580c", "#16a34a", "#dc2626", "#059669", "#0891b2",
  "#db2777", "#a855f7",
];

// ── Types ───────────────────────────────────────────────────────

export interface StateCardData {
  id: string;
  name: string;
  type: "initial" | "intermediate" | "terminal";
  color: string;
  agentId: string | null;
  sortOrder: number;
  transitions: { id: string; toStateId: string; label: string }[];
}

interface StateCardProps {
  state: StateCardData;
  allStates: StateCardData[];
  onChange: (updated: StateCardData) => void;
  onDelete: () => void;
}

// ── Component ───────────────────────────────────────────────────

export function StateCard({ state, allStates, onChange, onDelete }: StateCardProps) {
  const { data: agents = [] } = useAgents();

  const updateField = <K extends keyof StateCardData>(key: K, value: StateCardData[K]) => {
    onChange({ ...state, [key]: value });
  };

  const addTransition = () => {
    const otherStates = allStates.filter((s) => s.id !== state.id);
    if (otherStates.length === 0) return;
    onChange({
      ...state,
      transitions: [
        ...state.transitions,
        { id: `t-new-${Date.now()}`, toStateId: otherStates[0]!.id, label: "" },
      ],
    });
  };

  const updateTransition = (index: number, updated: { toStateId: string; label: string }) => {
    const newTransitions = [...state.transitions];
    newTransitions[index] = { ...newTransitions[index]!, ...updated };
    onChange({ ...state, transitions: newTransitions });
  };

  const removeTransition = (index: number) => {
    onChange({
      ...state,
      transitions: state.transitions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Color header */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ backgroundColor: state.color + "20" }}
      >
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: state.color }}
        />
        <span className="text-xs font-semibold flex-1 truncate">{state.name || "Untitled"}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onDelete}>
          <Trash2 className="h-3 w-3 text-red-400" />
        </Button>
      </div>

      <div className="p-3 space-y-3">
        {/* Name */}
        <Input
          value={state.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="State name"
          className="h-7 text-xs"
        />

        {/* Type */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10 shrink-0">Type</span>
          <Select value={state.type} onValueChange={(v) => updateField("type", v as StateCardData["type"])}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="initial">Initial</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="terminal">Terminal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Color */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10 shrink-0">Color</span>
          <div className="flex flex-wrap gap-1">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateField("color", c)}
                className={cn(
                  "h-5 w-5 rounded-full border-2 transition-all",
                  state.color === c ? "border-foreground scale-110" : "border-transparent hover:scale-110",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Agent */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10 shrink-0">Agent</span>
          <Select
            value={state.agentId ?? "none"}
            onValueChange={(v) => updateField("agentId", v === "none" ? null : v)}
          >
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue placeholder="No default agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No default agent</SelectItem>
              {agents.filter((p) => !(p.settings as Record<string, unknown>)?.isAssistant).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.avatar.color }} />
                    {p.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transitions */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Transitions</span>
            <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px]" onClick={addTransition}>
              + Add
            </Button>
          </div>
          {state.transitions.map((t, i) => (
            <TransitionRow
              key={t.id}
              toStateId={t.toStateId}
              label={t.label}
              allStates={allStates.filter((s) => s.id !== state.id)}
              onChange={(updated) => updateTransition(i, updated)}
              onDelete={() => removeTransition(i)}
            />
          ))}
          {state.transitions.length === 0 && (
            <p className="text-[10px] text-muted-foreground italic">No transitions</p>
          )}
        </div>
      </div>
    </div>
  );
}
