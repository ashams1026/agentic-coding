/**
 * Integration tests for ExecutorRegistry + ExecutionManager.
 *
 * Uses REAL ExecutorRegistry and ExecutionManager — no mocking the
 * system under test. MockExecutor instances are used as concrete
 * executors since they don't require an API key.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExecutorRegistry } from "@agentops/core";
import type { AgentExecutor, AgentEvent, AgentTask, SpawnOptions } from "@agentops/core";
import type { Persona, Project } from "@agentops/shared";
import { ExecutionManager } from "../execution-manager.js";
import type { DbHandle, BroadcastFn } from "../execution-manager.js";

// ── Minimal test executor ────────────────────────────────────────

class TestExecutor implements AgentExecutor {
  readonly name: string;
  spawnCount = 0;

  constructor(name: string) {
    this.name = name;
  }

  async *spawn(
    _task: AgentTask,
    _persona: Persona,
    _project: Project,
    _options: SpawnOptions,
  ): AsyncIterable<AgentEvent> {
    this.spawnCount++;
    yield { type: "text", content: `Executed by ${this.name}` };
    yield { type: "result", summary: "Done", outcome: "success", costUsd: 0, durationMs: 1 };
  }
}

// ── Stub DB and broadcast (not under test) ───────────────────────

const stubDb = {} as DbHandle;
const stubBroadcast: BroadcastFn = vi.fn();

// ── Tests ────────────────────────────────────────────────────────

describe("ExecutorRegistry", () => {
  let registry: ExecutorRegistry;

  beforeEach(() => {
    registry = new ExecutorRegistry();
  });

  it("registers and retrieves executors by name", () => {
    registry.register("alpha", () => new TestExecutor("alpha"));
    registry.register("beta", () => new TestExecutor("beta"));

    const alpha = registry.get("alpha");
    expect(alpha).toBeInstanceOf(TestExecutor);
    expect((alpha as TestExecutor).name).toBe("alpha");

    const beta = registry.get("beta");
    expect((beta as TestExecutor).name).toBe("beta");
  });

  it("lists all registered executor names", () => {
    registry.register("a", () => new TestExecutor("a"));
    registry.register("b", () => new TestExecutor("b"));
    registry.register("c", () => new TestExecutor("c"));

    expect(registry.list()).toEqual(["a", "b", "c"]);
  });

  it("has() returns true for registered, false for unknown", () => {
    registry.register("mock", () => new TestExecutor("mock"));

    expect(registry.has("mock")).toBe(true);
    expect(registry.has("unknown")).toBe(false);
  });

  it("throws a clear error for unregistered executor name", () => {
    registry.register("mock", () => new TestExecutor("mock"));
    registry.register("claude", () => new TestExecutor("claude"));

    expect(() => registry.get("nonexistent")).toThrow(
      'Unknown executor "nonexistent". Available executors: mock, claude',
    );
  });

  it("throws with '(none)' when registry is empty", () => {
    expect(() => registry.get("anything")).toThrow(
      'Unknown executor "anything". Available executors: (none)',
    );
  });

  it("overwrites existing registration with same name", () => {
    registry.register("test", () => new TestExecutor("v1"));
    registry.register("test", () => new TestExecutor("v2"));

    const executor = registry.get("test") as TestExecutor;
    expect(executor.name).toBe("v2");
  });

  it("creates a new instance on each get() call", () => {
    registry.register("test", () => new TestExecutor("test"));

    const a = registry.get("test");
    const b = registry.get("test");
    expect(a).not.toBe(b); // different instances
  });
});

describe("ExecutionManager with ExecutorRegistry", () => {
  let registry: ExecutorRegistry;

  beforeEach(() => {
    registry = new ExecutorRegistry();
    registry.register("mock", () => new TestExecutor("mock"));
    registry.register("claude", () => new TestExecutor("claude"));
    registry.register("custom", () => new TestExecutor("custom"));
  });

  it("selects executor based on getExecutorMode()", () => {
    // In test env (NODE_ENV=test), getExecutorMode() returns "mock"
    const manager = new ExecutionManager(registry, stubDb, stubBroadcast);
    expect(manager.getExecutorMode()).toBe("mock");
  });

  it("lists available modes from registry", () => {
    const manager = new ExecutionManager(registry, stubDb, stubBroadcast);
    expect(manager.listExecutorModes()).toEqual(["mock", "claude", "custom"]);
  });

  it("exposes the registry via getRegistry()", () => {
    const manager = new ExecutionManager(registry, stubDb, stubBroadcast);
    expect(manager.getRegistry()).toBe(registry);
  });

  it("switches executor mode at runtime (dev mode)", () => {
    const originalEnv = process.env["NODE_ENV"];
    try {
      process.env["NODE_ENV"] = "development";
      const manager = new ExecutionManager(registry, stubDb, stubBroadcast);
      expect(manager.getExecutorMode()).toBe("claude"); // dev default

      manager.setExecutorMode("custom");
      expect(manager.getExecutorMode()).toBe("custom");

      manager.setExecutorMode("mock");
      expect(manager.getExecutorMode()).toBe("mock");
    } finally {
      process.env["NODE_ENV"] = originalEnv;
    }
  });

  it("throws when switching to unregistered mode", () => {
    const originalEnv = process.env["NODE_ENV"];
    try {
      process.env["NODE_ENV"] = "development";
      const manager = new ExecutionManager(registry, stubDb, stubBroadcast);

      expect(() => manager.setExecutorMode("nonexistent")).toThrow(
        'Unknown executor mode "nonexistent". Available: mock, claude, custom',
      );
    } finally {
      process.env["NODE_ENV"] = originalEnv;
    }
  });

  it("does not switch in production mode", () => {
    const originalEnv = process.env["NODE_ENV"];
    try {
      process.env["NODE_ENV"] = "production";
      const manager = new ExecutionManager(registry, stubDb, stubBroadcast);
      manager.setExecutorMode("custom"); // should be silently ignored
      expect(manager.getExecutorMode()).toBe("claude"); // production always claude
    } finally {
      process.env["NODE_ENV"] = originalEnv;
    }
  });

  it("returns 'mock' in test mode (NODE_ENV=test)", () => {
    // NODE_ENV is already "test" in vitest
    const manager = new ExecutionManager(registry, stubDb, stubBroadcast);
    expect(manager.getExecutorMode()).toBe("mock");
  });

  it("respects AGENTOPS_EXECUTOR env var in dev mode", () => {
    const originalNode = process.env["NODE_ENV"];
    const originalExecutor = process.env["AGENTOPS_EXECUTOR"];
    try {
      process.env["NODE_ENV"] = "development";
      process.env["AGENTOPS_EXECUTOR"] = "mock";
      const manager = new ExecutionManager(registry, stubDb, stubBroadcast);
      expect(manager.getExecutorMode()).toBe("mock");
    } finally {
      process.env["NODE_ENV"] = originalNode;
      if (originalExecutor !== undefined) {
        process.env["AGENTOPS_EXECUTOR"] = originalExecutor;
      } else {
        delete process.env["AGENTOPS_EXECUTOR"];
      }
    }
  });
});
