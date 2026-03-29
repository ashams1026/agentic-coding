import { useState } from "react";
import { ArrowRight, Bot, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePersonas, useTriggers } from "@/hooks";
import { cn } from "@/lib/utils";
import type { WorkflowId, WorkflowTransition } from "@agentops/shared";
import type { DispatchMode, AdvancementMode } from "@agentops/shared";

// ── Props ────────────────────────────────────────────────────────

interface TransitionPropertiesPanelProps {
  transition: WorkflowTransition;
  workflowId: WorkflowId;
  onUpdate: (original: WorkflowTransition, updated: WorkflowTransition) => void;
  onDelete: (transition: WorkflowTransition) => void;
  onClose: () => void;
}

// ── Radio-like button group ──────────────────────────────────────

interface OptionGroupProps<T extends string> {
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

function OptionGroup<T extends string>({ value, options, onChange }: OptionGroupProps<T>) {
  return (
    <div className="flex rounded-md border border-border overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 px-2 py-1.5 text-[11px] font-medium transition-colors border-r border-border last:border-r-0",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-card hover:bg-accent text-muted-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Dispatch mode options ────────────────────────────────────────

const DISPATCH_OPTIONS: { value: DispatchMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "propose", label: "Propose" },
  { value: "gated", label: "Gated" },
];

const ADVANCEMENT_OPTIONS: { value: AdvancementMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "approval", label: "Approval" },
  { value: "agent", label: "Agent" },
];

// ── Main component ───────────────────────────────────────────────

export function TransitionPropertiesPanel({
  transition,
  workflowId,
  onUpdate,
  onDelete,
  onClose,
}: TransitionPropertiesPanelProps) {
  const [name, setName] = useState(transition.name);
  const { data: personas } = usePersonas();
  const { data: triggers } = useTriggers(workflowId);

  // Find existing trigger for this transition
  const existingTrigger = triggers?.find(
    (t) => t.fromState === transition.from && t.toState === transition.to,
  );

  // Local trigger state — initialized from existing trigger or defaults
  const [hasTrigger, setHasTrigger] = useState(!!existingTrigger);
  const [personaId, setPersonaId] = useState<string>(existingTrigger?.personaId as string ?? "");
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>(existingTrigger?.dispatchMode ?? "auto");
  const [advancementMode, setAdvancementMode] = useState<AdvancementMode>(existingTrigger?.advancementMode ?? "auto");
  const [maxRetries, setMaxRetries] = useState(existingTrigger?.maxRetries ?? 3);

  const handleNameBlur = () => {
    if (name.trim() && name.trim() !== transition.name) {
      onUpdate(transition, { ...transition, name: name.trim() });
    }
  };

  const selectedPersona = personas?.find((p) => (p.id as string) === personaId);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold">Transition Properties</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* From → To */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Direction</label>
          <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
            <span className="text-sm font-mono">{transition.from}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-mono">{transition.to}</span>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => { if (e.key === "Enter") handleNameBlur(); }}
            className="h-8 text-sm"
            placeholder="Transition name"
          />
        </div>

        <Separator />

        {/* Trigger configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold">Trigger</label>
            <Button
              variant={hasTrigger ? "outline" : "default"}
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => setHasTrigger(!hasTrigger)}
            >
              {hasTrigger ? "Remove trigger" : "Add trigger"}
            </Button>
          </div>

          {!hasTrigger ? (
            <p className="text-xs text-muted-foreground italic">
              No trigger — this transition is manual only.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Persona selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Persona</label>
                <Select value={personaId} onValueChange={setPersonaId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select persona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {personas?.map((p) => (
                      <SelectItem key={p.id as string} value={p.id as string}>
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: p.avatar.color }}
                          />
                          {p.name}
                          <Badge variant="outline" className="text-[8px] px-1 py-0 ml-1">
                            {p.model}
                          </Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPersona && (
                  <div className="flex items-center gap-2 mt-1 p-2 rounded-md bg-accent/50">
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: selectedPersona.avatar.color + "20" }}
                    >
                      <Bot className="h-3 w-3" style={{ color: selectedPersona.avatar.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{selectedPersona.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{selectedPersona.description}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dispatch mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Dispatch Mode</label>
                <OptionGroup
                  value={dispatchMode}
                  options={DISPATCH_OPTIONS}
                  onChange={setDispatchMode}
                />
                <p className="text-[10px] text-muted-foreground">
                  {dispatchMode === "auto" && "Agent runs automatically when transition fires."}
                  {dispatchMode === "propose" && "Agent proposes changes for human review."}
                  {dispatchMode === "gated" && "Requires explicit human approval before agent starts."}
                </p>
              </div>

              {/* Max retries */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Max Retries</label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(parseInt(e.target.value) || 0)}
                  className="h-8 text-sm w-20"
                />
              </div>

              {/* Advancement mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Advancement Mode</label>
                <OptionGroup
                  value={advancementMode}
                  options={ADVANCEMENT_OPTIONS}
                  onChange={setAdvancementMode}
                />
                <p className="text-[10px] text-muted-foreground">
                  {advancementMode === "auto" && "Advances to next state automatically on success."}
                  {advancementMode === "approval" && "Requires human approval to advance."}
                  {advancementMode === "agent" && "Another agent decides whether to advance."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer — delete */}
      <Separator />
      <div className="px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-destructive hover:text-destructive gap-1.5"
          onClick={() => onDelete(transition)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete transition
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          or press Delete key
        </p>
      </div>
    </div>
  );
}
