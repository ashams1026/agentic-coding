/**
 * Custom composition root — registers the EchoExecutor alongside built-in executors.
 *
 * This file replaces the default setup.ts to add a custom executor.
 * Copy this pattern into your own project to swap in any executor.
 */

import { ExecutorRegistry } from "@agentops/core";
import { EchoExecutor } from "./echo-executor.js";

// In a real project, you'd also import the built-in executors:
//   import { ClaudeExecutor } from "@agentops/backend/agent/claude-executor";
//   import { MockExecutor } from "@agentops/backend/agent/mock-executor";

/**
 * Create a registry with the custom executor registered.
 *
 * Usage:
 *   1. Register your executor(s)
 *   2. Pass the registry to createExecutionManager(registry)
 *   3. Set AGENTOPS_EXECUTOR=echo (or switch via the Settings UI)
 */
export function createCustomRegistry(): ExecutorRegistry {
  const registry = new ExecutorRegistry();

  // Register the custom executor
  registry.register("echo", () => new EchoExecutor());

  // In a full setup, also register the built-in executors:
  // registry.register("claude", () => new ClaudeExecutor());
  // registry.register("mock", () => new MockExecutor());

  return registry;
}

// Quick test: create the registry and verify it works
const registry = createCustomRegistry();
console.log("Registered executors:", registry.list());
console.log("Echo executor created:", registry.get("echo").constructor.name);
