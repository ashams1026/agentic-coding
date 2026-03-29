import { useState, useCallback, useEffect } from "react";
import { GitBranch, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkflowListSidebar } from "./workflow-list-sidebar";
import { StateMachineCanvas, transitionKey } from "./state-machine-canvas";
import { StatePropertiesPanel } from "./state-properties-panel";
import { TransitionPropertiesPanel } from "./transition-properties-panel";
import { useWorkflows, useUpdateWorkflow } from "@/hooks";
import type { WorkflowId, WorkflowState, WorkflowTransition } from "@agentops/shared";

export function WorkflowDesignerLayout() {
  const { data: workflows } = useWorkflows();
  const updateWorkflow = useUpdateWorkflow();
  const [selectedId, setSelectedId] = useState<WorkflowId | null>(null);
  const [selectedStateName, setSelectedStateName] = useState<string | null>(null);
  const [selectedTransitionKey, setSelectedTransitionKey] = useState<string | null>(null);

  // Auto-select first workflow if none selected
  const effectiveId = selectedId ?? workflows?.[0]?.id ?? null;
  const selectedWorkflow = workflows?.find((w) => w.id === effectiveId) ?? null;
  const selectedState = selectedWorkflow?.states.find((s) => s.name === selectedStateName) ?? null;

  // Keep selectedTransition in sync with workflow data after mutations
  const resolvedTransition = selectedTransitionKey && selectedWorkflow
    ? selectedWorkflow.transitions.find((t) => transitionKey(t) === selectedTransitionKey) ?? null
    : null;

  // Clear state selection when switching workflows
  const handleSelectWorkflow = useCallback((id: WorkflowId) => {
    setSelectedId(id);
    setSelectedStateName(null);
    setSelectedTransitionKey(null);
  }, []);

  // ── Selection handlers ─────────────────────────────────────────

  const handleSelectState = useCallback((name: string | null) => {
    setSelectedStateName(name);
    if (name) {
      setSelectedTransitionKey(null);
      }
  }, []);

  const handleSelectTransition = useCallback((key: string | null, _transition: WorkflowTransition | null) => {
    setSelectedTransitionKey(key);
    if (key) {
      setSelectedStateName(null);
    }
  }, []);

  // ── State mutation helpers ──────────────────────────────────────

  const handleUpdateState = useCallback((oldName: string, updated: WorkflowState) => {
    if (!selectedWorkflow || !effectiveId) return;

    const newStates = selectedWorkflow.states.map((s) => {
      if (s.name === oldName) return updated;
      if (updated.isInitial && s.isInitial && s.name !== oldName) {
        return { ...s, isInitial: false };
      }
      return s;
    });

    const newTransitions = oldName !== updated.name
      ? selectedWorkflow.transitions.map((t) => ({
          ...t,
          from: t.from === oldName ? updated.name : t.from,
          to: t.to === oldName ? updated.name : t.to,
        }))
      : selectedWorkflow.transitions;

    updateWorkflow.mutate({ id: effectiveId, states: newStates, transitions: newTransitions });

    if (oldName !== updated.name) {
      setSelectedStateName(updated.name);
    }
  }, [selectedWorkflow, effectiveId, updateWorkflow]);

  const handleDeleteState = useCallback((name: string) => {
    if (!selectedWorkflow || !effectiveId) return;

    updateWorkflow.mutate({
      id: effectiveId,
      states: selectedWorkflow.states.filter((s) => s.name !== name),
      transitions: selectedWorkflow.transitions.filter((t) => t.from !== name && t.to !== name),
    });

    setSelectedStateName(null);
  }, [selectedWorkflow, effectiveId, updateWorkflow]);

  const handleAddState = useCallback((_position: { x: number; y: number }) => {
    if (!selectedWorkflow || !effectiveId) return;

    let idx = selectedWorkflow.states.length + 1;
    let name = `State ${idx}`;
    while (selectedWorkflow.states.some((s) => s.name === name)) {
      idx++;
      name = `State ${idx}`;
    }

    updateWorkflow.mutate({
      id: effectiveId,
      states: [...selectedWorkflow.states, { name, color: "#94a3b8", isInitial: false, isFinal: false }],
    });

    setSelectedStateName(name);
    setSelectedTransitionKey(null);
  }, [selectedWorkflow, effectiveId, updateWorkflow]);

  // ── Transition mutation helpers ─────────────────────────────────

  const handleCreateTransition = useCallback((from: string, to: string) => {
    if (!selectedWorkflow || !effectiveId) return;

    // Don't create duplicate
    if (selectedWorkflow.transitions.some((t) => t.from === from && t.to === to)) return;

    const newTransition: WorkflowTransition = { from, to, name: `${from} → ${to}` };
    updateWorkflow.mutate({
      id: effectiveId,
      transitions: [...selectedWorkflow.transitions, newTransition],
    });

    // Select the new transition
    setSelectedTransitionKey(transitionKey(newTransition));
    setSelectedStateName(null);
  }, [selectedWorkflow, effectiveId, updateWorkflow]);

  const handleUpdateTransition = useCallback((original: WorkflowTransition, updated: WorkflowTransition) => {
    if (!selectedWorkflow || !effectiveId) return;

    const origKey = transitionKey(original);
    const newTransitions = selectedWorkflow.transitions.map((t) =>
      transitionKey(t) === origKey ? updated : t,
    );

    updateWorkflow.mutate({ id: effectiveId, transitions: newTransitions });

    setSelectedTransitionKey(transitionKey(updated));
  }, [selectedWorkflow, effectiveId, updateWorkflow]);

  const handleDeleteTransition = useCallback((t: WorkflowTransition) => {
    if (!selectedWorkflow || !effectiveId) return;

    const tKey = transitionKey(t);
    updateWorkflow.mutate({
      id: effectiveId,
      transitions: selectedWorkflow.transitions.filter((tr) => transitionKey(tr) !== tKey),
    });

    setSelectedTransitionKey(null);
  }, [selectedWorkflow, effectiveId, updateWorkflow]);

  // ── Keyboard shortcut: Delete/Backspace ─────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        // Don't intercept if user is typing in an input
        if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;

        if (resolvedTransition) {
          e.preventDefault();
          handleDeleteTransition(resolvedTransition);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resolvedTransition, handleDeleteTransition]);

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
              selectedTransitionKey={selectedTransitionKey}
              onSelectState={handleSelectState}
              onSelectTransition={handleSelectTransition}
              onAddState={handleAddState}
              onCreateTransition={handleCreateTransition}
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

      {/* Right panel — transition properties */}
      {resolvedTransition && !selectedState && (
        <div className="w-[280px] shrink-0 border-l border-border bg-card">
          <TransitionPropertiesPanel
            key={selectedTransitionKey}
            transition={resolvedTransition}
            onUpdate={handleUpdateTransition}
            onDelete={handleDeleteTransition}
            onClose={() => setSelectedTransitionKey(null)}
          />
        </div>
      )}
    </div>
  );
}
