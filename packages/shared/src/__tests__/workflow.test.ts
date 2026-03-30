import { describe, it, expect } from "vitest";
import {
  WORKFLOW,
  getValidTransitions,
  isValidTransition,
  getStateByName,
} from "../workflow.js";

describe("WORKFLOW constants", () => {
  it("initial state is Backlog", () => {
    expect(WORKFLOW.initialState).toBe("Backlog");
  });

  it("Done is the only final state", () => {
    expect(WORKFLOW.finalStates).toEqual(["Done"]);
  });

  it("every state has a transitions entry", () => {
    for (const state of WORKFLOW.states) {
      expect(WORKFLOW.transitions).toHaveProperty(state.name);
    }
  });

  it("every transition target is a valid state name", () => {
    const stateNames = WORKFLOW.states.map((s) => s.name);
    for (const [, targets] of Object.entries(WORKFLOW.transitions)) {
      for (const target of targets) {
        expect(stateNames).toContain(target);
      }
    }
  });
});

describe("getValidTransitions", () => {
  it("Backlog → [Planning]", () => {
    expect(getValidTransitions("Backlog")).toEqual(["Planning"]);
  });

  it("Planning → [Ready, Blocked]", () => {
    expect(getValidTransitions("Planning")).toEqual(["Ready", "Blocked"]);
  });

  it("Decomposition → [In Progress, Blocked]", () => {
    expect(getValidTransitions("Decomposition")).toEqual([
      "In Progress",
      "Blocked",
    ]);
  });

  it("Ready → [In Progress, Decomposition, Blocked]", () => {
    expect(getValidTransitions("Ready")).toEqual([
      "In Progress",
      "Decomposition",
      "Blocked",
    ]);
  });

  it("In Progress → [In Review, Blocked]", () => {
    expect(getValidTransitions("In Progress")).toEqual([
      "In Review",
      "Blocked",
    ]);
  });

  it("In Review → [Done, In Progress]", () => {
    expect(getValidTransitions("In Review")).toEqual(["Done", "In Progress"]);
  });

  it("Done → [] (no transitions)", () => {
    expect(getValidTransitions("Done")).toEqual([]);
  });

  it("Blocked → [Planning, Decomposition, Ready, In Progress]", () => {
    expect(getValidTransitions("Blocked")).toEqual([
      "Planning",
      "Decomposition",
      "Ready",
      "In Progress",
    ]);
  });

  it("returns empty array for unknown state", () => {
    expect(getValidTransitions("NonExistent")).toEqual([]);
  });
});

describe("isValidTransition", () => {
  it("returns true for valid transitions", () => {
    expect(isValidTransition("Backlog", "Planning")).toBe(true);
    expect(isValidTransition("Planning", "Ready")).toBe(true);
    expect(isValidTransition("In Progress", "In Review")).toBe(true);
    expect(isValidTransition("In Review", "Done")).toBe(true);
    expect(isValidTransition("In Review", "In Progress")).toBe(true);
    expect(isValidTransition("Blocked", "Ready")).toBe(true);
  });

  it("returns false for invalid transitions", () => {
    expect(isValidTransition("Backlog", "Done")).toBe(false);
    expect(isValidTransition("Done", "Backlog")).toBe(false);
    expect(isValidTransition("In Progress", "Planning")).toBe(false);
    expect(isValidTransition("Ready", "Done")).toBe(false);
  });

  it("returns false for unknown states", () => {
    expect(isValidTransition("Fake", "Backlog")).toBe(false);
    expect(isValidTransition("Backlog", "Fake")).toBe(false);
  });

  it("returns false for self-transitions", () => {
    for (const state of WORKFLOW.states) {
      expect(isValidTransition(state.name, state.name)).toBe(false);
    }
  });
});

describe("getStateByName", () => {
  it("returns state object for existing state", () => {
    const state = getStateByName("Backlog");
    expect(state).toEqual({ name: "Backlog", color: "#6b7280" });
  });

  it("returns correct state for each defined state", () => {
    for (const expected of WORKFLOW.states) {
      const state = getStateByName(expected.name);
      expect(state).toEqual(expected);
    }
  });

  it("returns undefined for non-existing state", () => {
    expect(getStateByName("NonExistent")).toBeUndefined();
  });
});

describe("Blocked state transitions", () => {
  it("Blocked can transition back to multiple active states", () => {
    const transitions = getValidTransitions("Blocked");
    expect(transitions).toContain("Planning");
    expect(transitions).toContain("Decomposition");
    expect(transitions).toContain("Ready");
    expect(transitions).toContain("In Progress");
  });

  it("Planning, Decomposition, Ready, In Progress can transition to Blocked", () => {
    const canBlock = ["Planning", "Decomposition", "Ready", "In Progress"];
    for (const name of canBlock) {
      expect(isValidTransition(name, "Blocked")).toBe(true);
    }
  });

  it("Backlog, In Review, Done cannot transition to Blocked", () => {
    const cannotBlock = ["Backlog", "In Review", "Done"];
    for (const name of cannotBlock) {
      expect(isValidTransition(name, "Blocked")).toBe(false);
    }
  });
});

describe("no state can transition to Backlog", () => {
  it("Backlog is never a transition target", () => {
    for (const state of WORKFLOW.states) {
      expect(isValidTransition(state.name, "Backlog")).toBe(false);
    }
  });
});
