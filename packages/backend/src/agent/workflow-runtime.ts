/**
 * Dynamic workflow runtime — queries workflow states and transitions from the DB.
 * Falls back to the hardcoded WORKFLOW constant when workflowId is null.
 */

import { eq, and } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workflowStates, workflowTransitions, agentAssignments, agents } from "../db/schema.js";
import { WORKFLOW, isValidTransition as isValidTransitionSync, getValidTransitions } from "@agentops/shared";
import type { AgentId } from "@agentops/shared";

// ── Types ───────────────────────────────────────────────────────

export interface DynamicWorkflowState {
  id: string;
  name: string;
  type: "initial" | "intermediate" | "terminal";
  color: string;
  agentId: string | null;
  agentOverrides: Array<{ labelMatch: string; agentId: string }>;
  sortOrder: number;
}

export interface DynamicWorkflowTransition {
  id: string;
  fromStateId: string;
  fromStateName: string;
  toStateId: string;
  toStateName: string;
  label: string;
}

// ── State queries ───────────────────────────────────────────────

export async function getWorkflowStates(workflowId: string | null): Promise<DynamicWorkflowState[]> {
  if (!workflowId) {
    // Fallback to hardcoded
    return WORKFLOW.states.map((s, i) => ({
      id: `fallback-${s.name}`,
      name: s.name,
      type: s.name === WORKFLOW.initialState ? "initial" : WORKFLOW.finalStates.includes(s.name as any) ? "terminal" : "intermediate",
      color: s.color,
      agentId: null,
      agentOverrides: [],
      sortOrder: i,
    }));
  }

  const rows = await db
    .select()
    .from(workflowStates)
    .where(eq(workflowStates.workflowId, workflowId))
    .orderBy(workflowStates.sortOrder);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type as "initial" | "intermediate" | "terminal",
    color: r.color,
    agentId: r.agentId,
    agentOverrides: (r.agentOverrides ?? []) as Array<{ labelMatch: string; agentId: string }>,
    sortOrder: r.sortOrder,
  }));
}

// ── Transition queries ──────────────────────────────────────────

export async function getWorkflowTransitions(workflowId: string | null): Promise<DynamicWorkflowTransition[]> {
  if (!workflowId) {
    // Fallback to hardcoded
    const transitions: DynamicWorkflowTransition[] = [];
    let idx = 0;
    for (const [fromName, toNames] of Object.entries(WORKFLOW.transitions)) {
      for (const toName of toNames) {
        transitions.push({
          id: `fallback-t-${idx++}`,
          fromStateId: `fallback-${fromName}`,
          fromStateName: fromName,
          toStateId: `fallback-${toName}`,
          toStateName: toName,
          label: "",
        });
      }
    }
    return transitions;
  }

  // Join to get state names
  const rows = await db
    .select({
      id: workflowTransitions.id,
      fromStateId: workflowTransitions.fromStateId,
      toStateId: workflowTransitions.toStateId,
      label: workflowTransitions.label,
    })
    .from(workflowTransitions)
    .where(eq(workflowTransitions.workflowId, workflowId))
    .orderBy(workflowTransitions.sortOrder);

  // Resolve state names
  const states = await getWorkflowStates(workflowId);
  const stateMap = new Map(states.map((s) => [s.id, s.name]));

  return rows.map((r) => ({
    id: r.id,
    fromStateId: r.fromStateId,
    fromStateName: stateMap.get(r.fromStateId) ?? r.fromStateId,
    toStateId: r.toStateId,
    toStateName: stateMap.get(r.toStateId) ?? r.toStateId,
    label: r.label,
  }));
}

// ── Validation ──────────────────────────────────────────────────

export async function isValidTransitionDynamic(
  workflowId: string | null,
  fromState: string,
  toState: string,
): Promise<boolean> {
  if (!workflowId) {
    return isValidTransitionSync(fromState, toState);
  }

  const transitions = await getWorkflowTransitions(workflowId);
  return transitions.some((t) => t.fromStateName === fromState && t.toStateName === toState);
}

// ── Initial state ───────────────────────────────────────────────

export async function getWorkflowInitialState(workflowId: string | null): Promise<string> {
  if (!workflowId) {
    return WORKFLOW.initialState;
  }

  const states = await getWorkflowStates(workflowId);
  const initial = states.find((s) => s.type === "initial");
  return initial?.name ?? WORKFLOW.initialState;
}

// ── Agent resolution ──────────────────────────────────────────

export async function resolveAgentForState(
  projectId: string,
  workflowId: string | null,
  stateName: string,
  workItemLabels: string[] = [],
): Promise<AgentId | null> {
  if (workflowId) {
    const states = await getWorkflowStates(workflowId);
    const state = states.find((s) => s.name === stateName);

    if (state) {
      // Priority 1: Label-based override — first matching override wins
      if (state.agentOverrides.length > 0 && workItemLabels.length > 0) {
        for (const override of state.agentOverrides) {
          const matched = workItemLabels.some(
            (l) => l.toLowerCase() === override.labelMatch.toLowerCase(),
          );
          if (matched) {
            return override.agentId as AgentId;
          }
        }
      }

      // Priority 2: State default agent
      if (state.agentId) {
        return state.agentId as AgentId;
      }
    }
  }

  // Priority 3: Check agent_assignments table (existing fallback behavior)
  const [assignment] = await db
    .select({ agentId: agentAssignments.agentId })
    .from(agentAssignments)
    .where(
      and(
        eq(agentAssignments.projectId, projectId),
        eq(agentAssignments.stateName, stateName),
      ),
    );

  return (assignment?.agentId as AgentId) ?? null;
}

// ── Dynamic router prompt builder ───────────────────────────────

/**
 * Builds a rich system prompt section describing the workflow's state machine.
 * Includes all states with their types and assigned agents, the full transition
 * map, and focused guidance on valid next states from the current state.
 * Used by the Router agent to make informed routing decisions.
 */
export async function buildDynamicRouterPrompt(
  workflowId: string | null,
  currentState: string,
): Promise<string> {
  if (!workflowId) {
    // Fallback: use hardcoded workflow constant
    const validTargets = getValidTransitions(currentState);
    const lines: string[] = [
      `The work item is currently in state: **${currentState}**`,
      "",
      "Valid next states from here:",
      ...validTargets.map((s) => `  - ${s}`),
      "",
      "Choose the most appropriate next state based on the work item's content and execution outcome.",
      "Use the route_to_state tool to perform the transition.",
    ];
    return lines.join("\n");
  }

  // Query all states and transitions for this workflow
  const stateRows = await getWorkflowStates(workflowId);
  const allTransitions = await getWorkflowTransitions(workflowId);

  // Resolve agent names for states that have an assigned agent
  const agentIds = [...new Set(
    stateRows.map((s) => s.agentId).filter((id): id is string => id !== null),
  )];
  const agentNameMap = new Map<string, string>();
  if (agentIds.length > 0) {
    const agentRows = await Promise.all(
      agentIds.map((id) =>
        db
          .select({ id: agents.id, name: agents.name })
          .from(agents)
          .where(eq(agents.id, id))
          .then((rows) => rows[0] ?? null),
      ),
    );
    for (const row of agentRows) {
      if (row) agentNameMap.set(row.id, row.name);
    }
  }

  // Identify outgoing transitions from the current state
  const outgoingTransitions = allTransitions.filter((t) => t.fromStateName === currentState);

  const lines: string[] = [];

  // Section 1: Full state catalog with types and agent assignments
  lines.push("### Workflow States");
  lines.push("");
  for (const state of stateRows) {
    const agentName = state.agentId
      ? (agentNameMap.get(state.agentId) ?? "unknown")
      : "unassigned";
    const typeLabel =
      state.type === "initial"
        ? " [initial]"
        : state.type === "terminal"
          ? " [terminal]"
          : "";
    lines.push(`  - **${state.name}**${typeLabel} — agent: ${agentName}`);
  }
  lines.push("");

  // Section 2: Full transition map (state machine overview)
  if (allTransitions.length > 0) {
    lines.push("### Valid Transitions");
    lines.push("");
    for (const t of allTransitions) {
      const labelSuffix = t.label ? ` (${t.label})` : "";
      lines.push(`  - ${t.fromStateName} → ${t.toStateName}${labelSuffix}`);
    }
    lines.push("");
  }

  // Section 3: Focused guidance on valid next states from current state
  lines.push(`### Current State: **${currentState}**`);
  lines.push("");

  if (outgoingTransitions.length === 0) {
    lines.push(
      `"${currentState}" has no outgoing transitions — it is a terminal state. Do not attempt to route this work item further.`,
    );
  } else {
    lines.push("You may route this work item to one of the following states:");
    lines.push("");
    for (const t of outgoingTransitions) {
      const targetState = stateRows.find((s) => s.name === t.toStateName);
      const agentName = targetState?.agentId
        ? (agentNameMap.get(targetState.agentId) ?? "unknown")
        : "unassigned";
      const labelNote = t.label ? ` — transition label: "${t.label}"` : "";
      lines.push(`  - **${t.toStateName}** (agent: ${agentName})${labelNote}`);
    }
    lines.push("");
    lines.push(
      "Evaluate the work item's execution outcome, summary, and content to select the best next state. " +
        "Then call route_to_state with your chosen state name.",
    );
  }

  return lines.join("\n");
}
