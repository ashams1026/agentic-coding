import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Circle,
  Flag,
  Unlink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Workflow } from "@agentops/shared";

// ── Validation issue types ───────────────────────────────────────

export type IssueSeverity = "error" | "warning";

export interface ValidationIssue {
  id: string;
  severity: IssueSeverity;
  message: string;
  stateName?: string;
}

// ── Validation logic ─────────────────────────────────────────────

export function validateWorkflow(workflow: Workflow): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { states, transitions } = workflow;

  if (states.length === 0) return issues;

  // 1. Missing initial state
  const initialStates = states.filter((s) => s.isInitial);
  if (initialStates.length === 0) {
    issues.push({
      id: "no-initial",
      severity: "error",
      message: "No initial state defined. Every workflow needs exactly one initial state.",
    });
  } else if (initialStates.length > 1) {
    issues.push({
      id: "multi-initial",
      severity: "error",
      message: `Multiple initial states: ${initialStates.map((s) => s.name).join(", ")}. Only one is allowed.`,
    });
  }

  // 2. No final states
  const finalStates = states.filter((s) => s.isFinal);
  if (finalStates.length === 0) {
    issues.push({
      id: "no-final",
      severity: "warning",
      message: "No final states defined. Workflows should have at least one final state.",
    });
  }

  // 3. Orphan states — no incoming transitions (except initial state)
  const statesWithIncoming = new Set<string>();
  for (const t of transitions) {
    statesWithIncoming.add(t.to);
  }

  for (const state of states) {
    if (state.isInitial) continue;
    if (!statesWithIncoming.has(state.name)) {
      issues.push({
        id: `orphan-${state.name}`,
        severity: "warning",
        message: `"${state.name}" has no incoming transitions — it can never be reached.`,
        stateName: state.name,
      });
    }
  }

  // 4. Unreachable final states — BFS from initial to see if finals are reachable
  if (initialStates.length === 1) {
    const adj = new Map<string, string[]>();
    for (const s of states) adj.set(s.name, []);
    for (const t of transitions) adj.get(t.from)?.push(t.to);

    const reachable = new Set<string>();
    const queue = [initialStates[0]!.name];
    reachable.add(queue[0]!);
    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const next of adj.get(cur) ?? []) {
        if (!reachable.has(next)) {
          reachable.add(next);
          queue.push(next);
        }
      }
    }

    for (const fs of finalStates) {
      if (!reachable.has(fs.name)) {
        issues.push({
          id: `unreachable-final-${fs.name}`,
          severity: "warning",
          message: `Final state "${fs.name}" is unreachable from the initial state.`,
          stateName: fs.name,
        });
      }
    }
  }

  // 5. States with no outgoing transitions (non-final)
  const statesWithOutgoing = new Set<string>();
  for (const t of transitions) {
    statesWithOutgoing.add(t.from);
  }
  for (const state of states) {
    if (state.isFinal) continue;
    if (!statesWithOutgoing.has(state.name)) {
      issues.push({
        id: `dead-end-${state.name}`,
        severity: "warning",
        message: `"${state.name}" has no outgoing transitions — workflow cannot progress from here.`,
        stateName: state.name,
      });
    }
  }

  return issues;
}

// ── Hook ─────────────────────────────────────────────────────────

export function useWorkflowValidation(workflow: Workflow | null) {
  return useMemo(() => {
    if (!workflow) return { issues: [], errorCount: 0, warningCount: 0, stateWarnings: new Map<string, string[]>() };

    const issues = validateWorkflow(workflow);
    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;

    // Build map of state name → warning messages for canvas badges
    const stateWarnings = new Map<string, string[]>();
    for (const issue of issues) {
      if (issue.stateName) {
        const existing = stateWarnings.get(issue.stateName) ?? [];
        existing.push(issue.message);
        stateWarnings.set(issue.stateName, existing);
      }
    }

    return { issues, errorCount, warningCount, stateWarnings };
  }, [workflow]);
}

// ── Validation panel component ───────────────────────────────────

interface ValidationPanelProps {
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
}

export function ValidationPanel({ issues, errorCount, warningCount }: ValidationPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (issues.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-card border-t border-border shadow-lg">
      {/* Summary bar — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-4 py-2 text-xs hover:bg-accent/50 transition-colors"
      >
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <span className="flex-1 text-left">
          {errorCount > 0 && (
            <span className="text-red-500 font-medium mr-2">
              {errorCount} error{errorCount !== 1 ? "s" : ""}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-amber-500 font-medium">
              {warningCount} warning{warningCount !== 1 ? "s" : ""}
            </span>
          )}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      {/* Expanded issue list */}
      {expanded && (
        <div className="max-h-[180px] overflow-y-auto border-t border-border">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="flex items-start gap-2.5 px-4 py-2 text-xs border-b border-border last:border-b-0"
            >
              {issue.severity === "error" ? (
                <Circle className="h-3 w-3 mt-0.5 shrink-0 fill-red-500 text-red-500" />
              ) : issue.stateName ? (
                <Unlink className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
              ) : (
                <Flag className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
              )}
              <span className={issue.severity === "error" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}>
                {issue.message}
              </span>
              {issue.stateName && (
                <Badge variant="outline" className="text-[8px] px-1 py-0 ml-auto shrink-0">
                  {issue.stateName}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
