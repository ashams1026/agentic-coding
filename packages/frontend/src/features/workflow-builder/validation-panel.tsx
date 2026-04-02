import { useMemo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { StateCardData } from "./state-card";

interface ValidationError {
  type: "error" | "warning";
  message: string;
}

interface ValidationPanelProps {
  states: StateCardData[];
}

function validateWorkflow(states: StateCardData[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (states.length === 0) {
    errors.push({ type: "error", message: "Workflow has no states." });
    return errors;
  }

  // Must have exactly one initial state
  const initialStates = states.filter((s) => s.type === "initial");
  if (initialStates.length === 0) {
    errors.push({ type: "error", message: "Missing initial state. Every workflow needs one." });
  } else if (initialStates.length > 1) {
    errors.push({ type: "error", message: `Multiple initial states: ${initialStates.map((s) => s.name || "Untitled").join(", ")}. Only one allowed.` });
  }

  // Must have at least one terminal state
  const terminalStates = states.filter((s) => s.type === "terminal");
  if (terminalStates.length === 0) {
    errors.push({ type: "error", message: "Missing terminal state. Workflow needs at least one end state." });
  }

  // Check for unreachable states (no incoming transitions, except initial)
  const stateIds = new Set(states.map((s) => s.id));
  const hasIncoming = new Set<string>();
  for (const state of states) {
    for (const t of state.transitions) {
      if (stateIds.has(t.toStateId)) {
        hasIncoming.add(t.toStateId);
      }
    }
  }
  for (const state of states) {
    if (state.type !== "initial" && !hasIncoming.has(state.id)) {
      errors.push({ type: "warning", message: `"${state.name || "Untitled"}" is unreachable — no transitions lead to it.` });
    }
  }

  // Check for dead-ends (no outgoing transitions, except terminal)
  for (const state of states) {
    if (state.type !== "terminal" && state.transitions.length === 0) {
      errors.push({ type: "warning", message: `"${state.name || "Untitled"}" is a dead-end — no outgoing transitions.` });
    }
  }

  // Check for transitions pointing to non-existent states
  for (const state of states) {
    for (const t of state.transitions) {
      if (!stateIds.has(t.toStateId)) {
        errors.push({ type: "error", message: `"${state.name || "Untitled"}" has a transition to a deleted state.` });
      }
    }
  }

  return errors;
}

export { validateWorkflow };

export function ValidationPanel({ states }: ValidationPanelProps) {
  const errors = useMemo(() => validateWorkflow(states), [states]);

  if (errors.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        <span className="text-xs text-emerald-600 dark:text-emerald-400">Workflow is valid</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {errors.map((err, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 rounded-md px-3 py-1.5 text-xs ${
            err.type === "error"
              ? "bg-red-500/10 text-red-600 dark:text-red-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{err.message}</span>
        </div>
      ))}
    </div>
  );
}
