import { useState } from "react";
import { ArrowRight, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { WorkflowTransition } from "@agentops/shared";

// ── Props ────────────────────────────────────────────────────────

interface TransitionPropertiesPanelProps {
  transition: WorkflowTransition;
  onUpdate: (original: WorkflowTransition, updated: WorkflowTransition) => void;
  onDelete: (transition: WorkflowTransition) => void;
  onClose: () => void;
}

// ── Main component ───────────────────────────────────────────────

export function TransitionPropertiesPanel({
  transition,
  onUpdate,
  onDelete,
  onClose,
}: TransitionPropertiesPanelProps) {
  const [name, setName] = useState(transition.name);

  const handleNameBlur = () => {
    if (name.trim() && name.trim() !== transition.name) {
      onUpdate(transition, { ...transition, name: name.trim() });
    }
  };

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

        {/* Trigger placeholder */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Trigger</label>
          <p className="text-xs text-muted-foreground italic">
            Trigger configuration will be available in T2.8.5
          </p>
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
