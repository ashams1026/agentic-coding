import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { WorkflowState, WorkflowTransition } from "@agentops/shared";

// ── Color presets ────────────────────────────────────────────────

const COLOR_PRESETS = [
  "#94a3b8", "#8b5cf6", "#3b82f6", "#10b981",
  "#22c55e", "#f59e0b", "#ef4444", "#f97316",
  "#ec4899", "#6366f1", "#14b8a6", "#84cc16",
];

// ── Props ────────────────────────────────────────────────────────

interface StatePropertiesPanelProps {
  state: WorkflowState;
  transitions: WorkflowTransition[];
  onUpdate: (oldName: string, updated: WorkflowState) => void;
  onDelete: (name: string) => void;
  onClose: () => void;
}

// ── Main component ───────────────────────────────────────────────

export function StatePropertiesPanel({
  state,
  transitions,
  onUpdate,
  onDelete,
  onClose,
}: StatePropertiesPanelProps) {
  const [name, setName] = useState(state.name);
  const [color, setColor] = useState(state.color);
  const [isInitial, setIsInitial] = useState(state.isInitial);
  const [isFinal, setIsFinal] = useState(state.isFinal);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Count transitions involving this state
  const relatedTransitions = transitions.filter(
    (t) => t.from === state.name || t.to === state.name,
  );

  const handleSave = () => {
    onUpdate(state.name, {
      name: name.trim() || state.name,
      color,
      isInitial,
      isFinal,
    });
  };

  const handleNameBlur = () => {
    if (name.trim() && name.trim() !== state.name) {
      handleSave();
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    onUpdate(state.name, {
      name: name.trim() || state.name,
      color: newColor,
      isInitial,
      isFinal,
    });
  };

  const handleInitialChange = (checked: boolean) => {
    setIsInitial(checked);
    onUpdate(state.name, {
      name: name.trim() || state.name,
      color,
      isInitial: checked,
      isFinal: checked ? false : isFinal,
    });
    if (checked) setIsFinal(false);
  };

  const handleFinalChange = (checked: boolean) => {
    setIsFinal(checked);
    onUpdate(state.name, {
      name: name.trim() || state.name,
      color,
      isInitial: checked ? false : isInitial,
      isFinal: checked,
    });
    if (checked) setIsInitial(false);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold">State Properties</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => { if (e.key === "Enter") handleNameBlur(); }}
            className="h-8 text-sm"
          />
        </div>

        {/* Color */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Color</label>
          <div className="grid grid-cols-6 gap-1.5">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => handleColorChange(c)}
                className="h-7 w-7 rounded-md border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: c === color ? "var(--color-foreground)" : "transparent",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Input
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-7 text-xs font-mono flex-1"
              placeholder="#hex"
            />
            <div
              className="h-7 w-7 rounded-md border border-border shrink-0"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>

        {/* Type flags */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={isInitial}
              onCheckedChange={(checked) => handleInitialChange(checked === true)}
            />
            <span className="text-sm">Initial state</span>
            {isInitial && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 ml-auto">
                entry point
              </Badge>
            )}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={isFinal}
              onCheckedChange={(checked) => handleFinalChange(checked === true)}
            />
            <span className="text-sm">Final state</span>
            {isFinal && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 ml-auto">
                exit point
              </Badge>
            )}
          </label>
        </div>

        {/* Transitions info */}
        {relatedTransitions.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Transitions ({relatedTransitions.length})
            </label>
            <div className="space-y-1">
              {relatedTransitions.map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-mono">{t.from}</span>
                  <span>→</span>
                  <span className="font-mono">{t.to}</span>
                  <span className="text-[10px] ml-auto truncate max-w-[80px]">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer — delete */}
      <Separator />
      <div className="px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-destructive hover:text-destructive gap-1.5"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete state
        </Button>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete state &quot;{state.name}&quot;</AlertDialogTitle>
            <AlertDialogDescription>
              {relatedTransitions.length > 0 ? (
                <>
                  This state has {relatedTransitions.length} transition{relatedTransitions.length !== 1 ? "s" : ""} connected to it.
                  Deleting it will also remove those transitions.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete(state.name); setShowDeleteConfirm(false); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
