/**
 * Command sandbox — re-exported from @agentops/core.
 *
 * Backend code should import from this file (or directly from @agentops/core).
 * The canonical definitions live in packages/core/src/sandbox.ts.
 */

export { validateCommand, buildSandboxPrompt } from "@agentops/core";
export type { ValidationResult } from "@agentops/core";
