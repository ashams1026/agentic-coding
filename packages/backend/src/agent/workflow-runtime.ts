/**
 * Dynamic workflow runtime — queries workflow states and transitions from the DB.
 * Falls back to the hardcoded WORKFLOW constant when workflowId is null.
 */

import { eq, and } from "drizzle-orm";
import { db } from "../db/connection.js";
import { workflowStates, workflowTransitions, personaAssignments } from "../db/schema.js";
import { WORKFLOW, isValidTransition as isValidTransitionSync, getValidTransitions } from "@agentops/shared";
import type { PersonaId } from "@agentops/shared";

// ── Types ───────────────────────────────────────────────────────

export interface DynamicWorkflowState {
  id: string;
  name: string;
  type: "initial" | "intermediate" | "terminal";
  color: string;
  personaId: string | null;
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
      personaId: null,
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
    personaId: r.personaId,
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

// ── Persona resolution ──────────────────────────────────────────

export async function resolvePersonaForState(
  projectId: string,
  workflowId: string | null,
  stateName: string,
): Promise<PersonaId | null> {
  // Priority 1: Check workflow state's default persona
  if (workflowId) {
    const states = await getWorkflowStates(workflowId);
    const state = states.find((s) => s.name === stateName);
    if (state?.personaId) {
      return state.personaId as PersonaId;
    }
  }

  // Priority 2: Check persona_assignments table (existing behavior)
  const [assignment] = await db
    .select({ personaId: personaAssignments.personaId })
    .from(personaAssignments)
    .where(
      and(
        eq(personaAssignments.projectId, projectId),
        eq(personaAssignments.stateName, stateName),
      ),
    );

  return (assignment?.personaId as PersonaId) ?? null;
}

// ── Dynamic router prompt builder ───────────────────────────────

export async function buildDynamicRouterPrompt(
  workflowId: string | null,
  currentState: string,
): Promise<string> {
  if (!workflowId) {
    // Fallback: list valid transitions from hardcoded
    const validTargets = getValidTransitions(currentState);
    return `Current state: "${currentState}". Valid target states: ${validTargets.map((s) => `"${s}"`).join(", ")}.`;
  }

  const transitions = await getWorkflowTransitions(workflowId);
  const validTargets = transitions
    .filter((t) => t.fromStateName === currentState)
    .map((t) => t.toStateName);

  return `Current state: "${currentState}". Valid target states: ${validTargets.map((s) => `"${s}"`).join(", ")}.`;
}
