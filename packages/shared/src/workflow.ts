// ── Workflow State Type ─────────────────────────────────────────────

export interface WorkflowState {
  name: string;
  color: string;
}

// ── Hardcoded Workflow ──────────────────────────────────────────────

export const WORKFLOW = {
  states: [
    { name: "Backlog", color: "#6b7280" },
    { name: "Planning", color: "#8b5cf6" },
    { name: "Decomposition", color: "#6366f1" },
    { name: "Ready", color: "#3b82f6" },
    { name: "In Progress", color: "#f59e0b" },
    { name: "In Review", color: "#f97316" },
    { name: "Done", color: "#22c55e" },
    { name: "Blocked", color: "#ef4444" },
  ] as const satisfies readonly WorkflowState[],

  transitions: {
    "Backlog": ["Planning"],
    "Planning": ["Ready", "Blocked"],
    "Decomposition": ["In Progress", "Blocked"],
    "Ready": ["In Progress", "Decomposition", "Blocked"],
    "In Progress": ["In Review", "Blocked"],
    "In Review": ["Done", "In Progress"],
    "Blocked": ["Planning", "Decomposition", "Ready", "In Progress"],
    "Done": [],
  } as const satisfies Record<string, readonly string[]>,

  initialState: "Backlog" as const,
  finalStates: ["Done"] as const,
} as const;

// ── Derived types ──────────────────────────────────────────────────

export type WorkflowStateName = (typeof WORKFLOW.states)[number]["name"];

// ── Helper functions ───────────────────────────────────────────────

export function getValidTransitions(state: string): readonly string[] {
  return WORKFLOW.transitions[state as keyof typeof WORKFLOW.transitions] ?? [];
}

export function isValidTransition(from: string, to: string): boolean {
  return getValidTransitions(from).includes(to);
}

export function getStateByName(name: string): WorkflowState | undefined {
  return WORKFLOW.states.find((s) => s.name === name);
}
