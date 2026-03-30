// ── Workflow State Type ─────────────────────────────────────────────

export interface WorkflowState {
  name: string;
  color: string;
}

// ── Hardcoded Workflow ──────────────────────────────────────────────

export const WORKFLOW = {
  states: [
    { name: "Backlog", color: "#6b7280" },
    { name: "Planning", color: "#7c3aed" },
    { name: "Decomposition", color: "#4f46e5" },
    { name: "Ready", color: "#2563eb" },
    { name: "In Progress", color: "#d97706" },
    { name: "In Review", color: "#ea580c" },
    { name: "Done", color: "#16a34a" },
    { name: "Blocked", color: "#dc2626" },
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
