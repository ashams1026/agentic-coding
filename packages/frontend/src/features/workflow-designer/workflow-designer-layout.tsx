import { useState, useCallback } from "react";
import { GitBranch, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkflowListSidebar } from "./workflow-list-sidebar";
import { StateMachineCanvas } from "./state-machine-canvas";
import { StatePropertiesPanel } from "./state-properties-panel";
import { useWorkflows, useUpdateWorkflow } from "@/hooks";
import type { WorkflowId, WorkflowState } from "@agentops/shared";

export function WorkflowDesignerLayout() {
  const { data: workflows } = useWorkflows();
  const updateWorkflow = useUpdateWorkflow();
  const [selectedId, setSelectedId] = useState<WorkflowId | null>(null);
  const [selectedStateName, setSelectedStateName] = useState<string | null>(null);

  // Auto-select first workflow if none selected
  const effectiveId = selectedId ?? workflows?.[0]?.id ?? null;
  const selectedWorkflow = workflows?.find((w) => w.id === effectiveId) ?? null;
  const selectedState = selectedWorkflow?.states.find((s) => s.name === selectedStateName) ?? null;

  // Clear state selection when switching workflows
  const handleSelectWorkflow = useCallback((id: WorkflowId) => {
    setSelectedId(id);
    setSelectedStateName(null);
  }, []);

  // ── State mutation helpers ──────────────────────────────────────

  const handleUpdateState = useCallback((oldName: string, updated: WorkflowState) => {
    if (!selectedWorkflow || !effectiveId) return;

    const newStates = selectedWorkflow.states.map((s) => {
      if (s.name === oldName) {
        // If setting as initial, unset other initial states
        if (updated.isInitial && !s.isInitial) {
          return updated;
        }
        return updated;
      }
      // If the updated state is being set as initial, unset this one
      if (updated.isInitial && s.isInitial && s.name !== oldName) {
        return { ...s, isInitial: false };
      }
      return s;
    });

    // Update transition references if name changed
    const newTransitions = oldName !== updated.name
      ? selectedWorkflow.transitions.map((t) => ({
          ...t,
          from: t.from === oldName ? updated.name : t.from,
          to: t.to === oldName ? updated.name : t.to,
        }))
      : selectedWorkflow.transitions;

    updateWorkflow.mutate({
      id: effectiveId,
      states: newStates,
      transitions: newTransitions,
    });

    // Update selection to new name
    if (oldName !== updated.name) {
      setSelectedStateName(updated.name);
    }
  }, [selectedWorkflow, effectiveId, updateWorkflow]);

  const handleDeleteState = useCallback((name: string) => {
    if (!selectedWorkflow || !effectiveId) return;

    const newStates = selectedWorkflow.states.filter((s) => s.name !== name);
    const newTransitions = selectedWorkflow.transitions.filter(
      (t) => t.from !== name && t.to !== name,
    );

    updateWorkflow.mutate({
      id: effectiveId,
      states: newStates,
      transitions: newTransitions,
    });

    setSelectedStateName(null);
  }, [selectedWorkflow, effectiveId, updateWorkflow]);

  const handleAddState = useCallback((_position: { x: number; y: number }) => {
    if (!selectedWorkflow || !effectiveId) return;

    // Generate unique name
    let idx = selectedWorkflow.states.length + 1;
    let name = `State ${idx}`;
    while (selectedWorkflow.states.some((s) => s.name === name)) {
      idx++;
      name = `State ${idx}`;
    }

    const newState: WorkflowState = {
      name,
      color: "#94a3b8",
      isInitial: false,
      isFinal: false,
    };

    updateWorkflow.mutate({
      id: effectiveId,
      states: [...selectedWorkflow.states, newState],
    });

    setSelectedStateName(name);
  }, [selectedWorkflow, effectiveId, updateWorkflow]);

  return (
    <div className="flex h-full">
      {/* Left sidebar — workflow list */}
      <div className="w-[260px] shrink-0 border-r border-border bg-card">
        <WorkflowListSidebar
          selectedId={effectiveId}
          onSelect={handleSelectWorkflow}
        />
      </div>

      {/* Main area — state machine canvas */}
      <div className="relative flex-1 overflow-hidden">
        {selectedWorkflow ? (
          <>
            <StateMachineCanvas
              workflow={selectedWorkflow}
              selectedState={selectedStateName}
              onSelectState={setSelectedStateName}
              onAddState={handleAddState}
            />

            {/* Add state button — floating top-left */}
            <div className="absolute top-3 left-3 z-10">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 bg-card/90 backdrop-blur-sm shadow-sm"
                onClick={() => handleAddState({ x: 200, y: 200 })}
              >
                <Plus className="h-3.5 w-3.5" />
                Add state
              </Button>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-background">
            <div className="text-center space-y-2">
              <GitBranch className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-medium">No workflow selected</p>
              <p className="text-xs text-muted-foreground">
                Select a workflow from the sidebar or create a new one.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right panel — state properties */}
      {selectedState && selectedWorkflow && (
        <div className="w-[280px] shrink-0 border-l border-border bg-card">
          <StatePropertiesPanel
            key={selectedStateName}
            state={selectedState}
            transitions={selectedWorkflow.transitions}
            onUpdate={handleUpdateState}
            onDelete={handleDeleteState}
            onClose={() => setSelectedStateName(null)}
          />
        </div>
      )}
    </div>
  );
}
