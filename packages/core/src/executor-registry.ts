/**
 * Executor registry — named registration of executor factories.
 *
 * Allows projects to register custom executors by name and switch
 * between them at runtime. The ExecutionManager uses the registry
 * instead of a simple factory function.
 */

import type { AgentExecutor } from "./types.js";

/** Factory function that creates an executor instance. */
export type ExecutorFactoryFn = () => AgentExecutor;

/**
 * Registry for named executor factories.
 *
 * Usage:
 *   const registry = new ExecutorRegistry();
 *   registry.register("claude", () => new ClaudeExecutor());
 *   registry.register("mock", () => new MockExecutor());
 *   registry.register("my-executor", () => new MyCustomExecutor());
 *
 *   const executor = registry.get("claude");
 *   const available = registry.list(); // ["claude", "mock", "my-executor"]
 */
export class ExecutorRegistry {
  private factories = new Map<string, ExecutorFactoryFn>();

  /**
   * Register an executor factory under the given name.
   * Overwrites any existing registration with the same name.
   */
  register(name: string, factory: ExecutorFactoryFn): void {
    this.factories.set(name, factory);
  }

  /**
   * Create an executor instance by name.
   * @throws Error if no executor is registered with the given name.
   */
  get(name: string): AgentExecutor {
    const factory = this.factories.get(name);
    if (!factory) {
      const available = this.list().join(", ");
      throw new Error(
        `Unknown executor "${name}". Available executors: ${available || "(none)"}`,
      );
    }
    return factory();
  }

  /**
   * Check if an executor is registered with the given name.
   */
  has(name: string): boolean {
    return this.factories.has(name);
  }

  /**
   * List all registered executor names.
   */
  list(): string[] {
    return [...this.factories.keys()];
  }
}
