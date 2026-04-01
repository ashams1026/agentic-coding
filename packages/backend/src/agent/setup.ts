/**
 * Composition root for executor wiring.
 *
 * This is the ONLY file that imports concrete executor implementations.
 * To use a custom executor, replace the factory function or this entire file.
 *
 * Exports a lazily-initialized ExecutionManager singleton via Proxy,
 * deferring construction until first method call (required for test mocks).
 */

import { ClaudeExecutor } from "./claude-executor.js";
import { MockExecutor } from "./mock-executor.js";
import { ExecutionManager } from "./execution-manager.js";
import type { DbHandle, BroadcastFn, ExecutorFactory } from "./execution-manager.js";
import type { AgentExecutor } from "./types.js";
import { db } from "../db/connection.js";
import { broadcast } from "../ws.js";
import { logger } from "../logger.js";

/**
 * Default executor factory — creates ClaudeExecutor or MockExecutor
 * based on the resolved mode. This is the single point where concrete
 * executor implementations are selected.
 *
 * To swap in a custom executor, replace this function:
 *   const myFactory: ExecutorFactory = (mode) => new MyExecutor();
 *   export const executionManager = createExecutionManager(myFactory);
 */
function defaultExecutorFactory(mode: string): AgentExecutor {
  if (mode === "mock") {
    logger.info("Using MockExecutor (simulated agent runs)");
    return new MockExecutor();
  }
  return new ClaudeExecutor();
}

/**
 * Create an ExecutionManager with the given factory, db, and broadcast.
 * Useful for custom projects that want to provide their own executor.
 */
export function createExecutionManager(
  factory: ExecutorFactory = defaultExecutorFactory,
  dbHandle: DbHandle = db as unknown as DbHandle,
  broadcastFn: BroadcastFn = broadcast,
): ExecutionManager {
  return new ExecutionManager(factory, dbHandle, broadcastFn);
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
