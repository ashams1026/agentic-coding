import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getAvailableModels, switchModel } from "@/api/client";
import type { ModelOption } from "@/api/client";
import type { ExecutionId } from "@agentops/shared";

interface ModelSwitcherProps {
  executionId: ExecutionId;
  currentModel: string;
  isRunning: boolean;
}

export function ModelSwitcher({ executionId, currentModel, isRunning }: ModelSwitcherProps) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [activeModel, setActiveModel] = useState(currentModel);
  const [pendingModel, setPendingModel] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  const fetchModels = useCallback(async () => {
    try {
      const available = await getAvailableModels(executionId);
      setModels(available);
    } catch {
      // Not running or error
    }
  }, [executionId]);

  useEffect(() => {
    if (!isRunning) return;
    fetchModels();
  }, [isRunning, fetchModels]);

  const handleConfirmSwitch = async () => {
    if (!pendingModel) return;
    setSwitching(true);
    try {
      await switchModel(executionId, pendingModel);
      setActiveModel(pendingModel);
    } catch {
      // Error handled silently
    } finally {
      setSwitching(false);
      setPendingModel(null);
    }
  };

  if (!isRunning || models.length === 0) {
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
        {currentModel}
      </Badge>
    );
  }

  const currentDisplay = models.find((m) => m.value === activeModel)?.displayName ?? activeModel;

  return (
    <>
      <Select
        value={activeModel}
        onValueChange={(v) => {
          if (v !== activeModel) {
            setPendingModel(v);
          }
        }}
      >
        <SelectTrigger className="h-6 w-auto text-[10px] px-2 py-0 gap-1 border-0 bg-secondary/50">
          <SelectValue>{currentDisplay}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {models.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs">
              {m.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={pendingModel !== null} onOpenChange={(open) => !open && setPendingModel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch model?</AlertDialogTitle>
            <AlertDialogDescription>
              Switch from {currentDisplay} to {models.find((m) => m.value === pendingModel)?.displayName ?? pendingModel}? This may increase costs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch} disabled={switching}>
              {switching ? "Switching..." : "Switch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
