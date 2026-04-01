/**
 * Composition root for executor wiring.
 *
 * This is the ONLY file that imports concrete executor implementations.
 * To use a custom executor, register it in the registry below.
 *
 * Exports a lazily-initialized ExecutionManager singleton via Proxy,
 * deferring construction until first method call (required for test mocks).
 */

import { ClaudeExecutor } from "./claude-executor.js";
import { MockExecutor } from "./mock-executor.js";
import { ExecutionManager } from "./execution-manager.js";
import type { DbHandle, BroadcastFn } from "./execution-manager.js";
import { ExecutorRegistry } from "@agentops/core";
import { db } from "../db/connection.js";
import { broadcast } from "../ws.js";
import { logger } from "../logger.js";

/**
 * Create the default executor registry with built-in executors.
 * Custom projects can add their own executors:
 *   const registry = createDefaultRegistry();
 *   registry.register("my-executor", () => new MyExecutor());
 */
export function createDefaultRegistry(): ExecutorRegistry {
  const registry = new ExecutorRegistry();
  registry.register("claude", () => new ClaudeExecutor());
  registry.register("mock", () => {
    logger.info("Using MockExecutor (simulated agent runs)");
    return new MockExecutor();
  });
  return registry;
}

/**
 * Create an ExecutionManager with the given registry, db, and broadcast.
 * Useful for custom projects that want to provide their own executors.
 */
export function createExecutionManager(
  registry: ExecutorRegistry = createDefaultRegistry(),
  dbHandle: DbHandle = db as unknown as DbHandle,
  broadcastFn: BroadcastFn = broadcast,
): ExecutionManager {
  return new ExecutionManager(registry, dbHandle, broadcastFn);
}

// ── Default singleton (lazy via Proxy) ──────────────────────────

let _defaultInstance: ExecutionManager | null = null;

/** Reset the default instance. Used in tests where the db mock changes between runs. */
export function _resetExecutionManager(): void {
  _defaultInstance = null;
}

/**
 * Default ExecutionManager singleton, lazily initialized on first access.
 * The Proxy defers construction until a method is actually called, allowing
 * test mocks for db/broadcast to be configured before the instance is created.
 */
export const executionManager = new Proxy({} as ExecutionManager, {
  get(_target, prop) {
    if (prop === "_resetExecutionManager") return _resetExecutionManager;
    if (!_defaultInstance) {
      _defaultInstance = createExecutionManager();
    }
    const value = (_defaultInstance as any)[prop];
    if (typeof value === "function") {
      return value.bind(_defaultInstance);
    }
    return value;
  },
});
