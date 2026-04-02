import { useState } from "react";
import { Trash2, ChevronDown, ChevronRight, Plus, X, Tag } from "lucide-react";
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

export interface AgentOverride {
  labelMatch: string;
  agentId: string;
}

export interface StateCardData {
  id: string;
  name: string;
  type: "initial" | "intermediate" | "terminal";
  color: string;
  agentId: string | null;
  agentOverrides?: AgentOverride[];
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
  const nonAssistantAgents = agents.filter(
    (p) => !(p.settings as Record<string, unknown>)?.isAssistant,
  );

  // Normalise optional field — UXO.20 will make this required once workflows.tsx is updated
  const overrides: AgentOverride[] = state.agentOverrides ?? [];

  // Overrides section is expanded by default if there are existing overrides
  const [overridesExpanded, setOverridesExpanded] = useState(
    () => overrides.length > 0,
  );

  const updateField = <K extends keyof StateCardData>(key: K, value: StateCardData[K]) => {
    onChange({ ...state, [key]: value });
  };

  // ── Agent override helpers ──────────────────────────────────

  const addOverride = () => {
    onChange({
      ...state,
      agentOverrides: [...overrides, { labelMatch: "", agentId: "" }],
    });
    setOverridesExpanded(true);
  };

  const updateOverride = (index: number, patch: Partial<AgentOverride>) => {
    const updated = overrides.map((o, i) =>
      i === index ? { ...o, ...patch } : o,
    );
    onChange({ ...state, agentOverrides: updated });
  };

  const removeOverride = (index: number) => {
    onChange({
      ...state,
      agentOverrides: overrides.filter((_, i) => i !== index),
    });
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
              {nonAssistantAgents.map((p) => (
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

        {/* Agent Overrides */}
        <div className="space-y-1.5">
          {/* Collapsible header */}
          <button
            type="button"
            onClick={() => setOverridesExpanded((v) => !v)}
            className="flex items-center gap-1.5 w-full group"
          >
            {overridesExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground flex-1 text-left">Agent Overrides</span>
            {overrides.length > 0 && (
              <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono">
                {overrides.length}
              </span>
            )}
          </button>

          {/* Chips when collapsed */}
          {!overridesExpanded && overrides.length > 0 && (
            <div className="flex flex-wrap gap-1 pl-4">
              {overrides.map((o, i) => {
                const agent = nonAssistantAgents.find((a) => a.id === o.agentId);
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border"
                    style={{
                      backgroundColor: agent ? agent.avatar.color + "20" : undefined,
                      borderColor: agent ? agent.avatar.color + "60" : undefined,
                      color: agent ? agent.avatar.color : undefined,
                    }}
                  >
                    <Tag className="h-2.5 w-2.5 shrink-0" />
                    {o.labelMatch || "…"}
                    <span className="opacity-60">→</span>
                    {agent ? agent.name : "Unknown"}
                  </span>
                );
              })}
            </div>
          )}

          {/* Expanded rows */}
          {overridesExpanded && (
            <div className="space-y-1.5 pl-4">
              {overrides.map((o, i) => {
                const agent = nonAssistantAgents.find((a) => a.id === o.agentId);
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <Input
                      value={o.labelMatch}
                      onChange={(e) => updateOverride(i, { labelMatch: e.target.value })}
                      placeholder="e.g., bug, feature"
                      className="h-6 text-[10px] flex-1 min-w-0"
                    />
                    <Select
                      value={o.agentId || "none"}
                      onValueChange={(v) => updateOverride(i, { agentId: v === "none" ? "" : v })}
                    >
                      <SelectTrigger className="h-6 text-[10px] flex-1 min-w-0">
                        <SelectValue placeholder="Agent">
                          {agent ? (
                            <span className="flex items-center gap-1">
                              <span
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: agent.avatar.color }}
                              />
                              {agent.name}
                            </span>
                          ) : (
                            "Select agent"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select agent</SelectItem>
                        {nonAssistantAgents.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: p.avatar.color }}
                              />
                              {p.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeOverride(i)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-red-400" />
                    </Button>
                  </div>
                );
              })}

              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground"
                onClick={addOverride}
              >
                <Plus className="h-3 w-3" />
                Add override
              </Button>
            </div>
          )}

          {/* "Add override" shortcut when collapsed and no overrides */}
          {!overridesExpanded && overrides.length === 0 && (
            <div className="pl-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground"
                onClick={addOverride}
              >
                <Plus className="h-3 w-3" />
                Add override
              </Button>
            </div>
          )}
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
