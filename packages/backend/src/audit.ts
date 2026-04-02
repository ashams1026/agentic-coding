/**
 * Execution audit trail — structured one-line log entries for every
 * state transition, agent dispatch, and cost event.
 *
 * Writes to ~/.agentops/logs/audit.log (separate from the main app log).
 * Queryable via GET /api/audit.
 */

import pino from "pino";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { readFileSync, existsSync, mkdirSync } from "node:fs";

const LOG_DIR = resolve(homedir(), ".agentops", "logs");
const AUDIT_FILE = resolve(LOG_DIR, "audit.log");

// Ensure log directory exists
mkdirSync(LOG_DIR, { recursive: true });

// Separate pino instance writing only to audit.log
const auditLogger = pino(
  { level: "info", base: null, timestamp: pino.stdTimeFunctions.isoTime },
  pino.destination({ dest: AUDIT_FILE, sync: false }),
);

// ── Audit event emitters ────────────────────────────────────────

export function auditStateTransition(opts: {
  workItemId: string;
  fromState: string;
  toState: string;
  actor: string;
  actorType: "agent" | "system" | "user";
}): void {
  auditLogger.info({
    workItemId: opts.workItemId,
    action: "state_transition",
    actor: opts.actor,
    actorType: opts.actorType,
    outcome: `${opts.fromState} → ${opts.toState}`,
    fromState: opts.fromState,
    toState: opts.toState,
  });
}

export function auditAgentDispatch(opts: {
  workItemId: string;
  executionId: string;
  agentId: string;
  agentName: string;
}): void {
  auditLogger.info({
    workItemId: opts.workItemId,
    action: "agent_dispatch",
    actor: opts.agentName,
    outcome: "started",
    executionId: opts.executionId,
    agentId: opts.agentId,
  });
}

export function auditAgentComplete(opts: {
  workItemId: string;
  executionId: string;
  agentName: string;
  outcome: string;
  costUsd: number;
  durationMs: number;
}): void {
  auditLogger.info({
    workItemId: opts.workItemId,
    action: "agent_complete",
    actor: opts.agentName,
    outcome: opts.outcome,
    executionId: opts.executionId,
    costUsd: opts.costUsd,
    durationMs: opts.durationMs,
  });
}

export function auditCostEvent(opts: {
  workItemId: string;
  executionId: string;
  costUsd: number;
  actor: string;
}): void {
  auditLogger.info({
    workItemId: opts.workItemId,
    action: "cost_event",
    actor: opts.actor,
    outcome: `$${opts.costUsd.toFixed(4)}`,
    executionId: opts.executionId,
    costUsd: opts.costUsd,
  });
}

export function auditToolUse(opts: {
  executionId: string;
  toolName: string;
  durationMs: number;
  success: boolean;
  command?: string;
}): void {
  auditLogger.info({
    action: "tool_use",
    executionId: opts.executionId,
    toolName: opts.toolName,
    durationMs: opts.durationMs,
    success: opts.success,
    ...(opts.command ? { command: opts.command } : {}),
  });
}

export function auditSessionStart(opts: {
  executionId: string;
  agentName: string;
  model: string;
  workItemId: string;
}): void {
  auditLogger.info({
    action: "session_start",
    executionId: opts.executionId,
    actor: opts.agentName,
    model: opts.model,
    workItemId: opts.workItemId,
  });
}

export function auditSessionEnd(opts: {
  executionId: string;
  reason: string;
  durationMs: number;
}): void {
  auditLogger.info({
    action: "session_end",
    executionId: opts.executionId,
    reason: opts.reason,
    durationMs: opts.durationMs,
  });
}

// ── Query audit log ─────────────────────────────────────────────

export interface AuditEntry {
  timestamp: string;
  workItemId: string;
  action: string;
  actor: string;
  outcome: string;
  [key: string]: unknown;
}

/**
 * Read and parse the audit log file.
 * Returns entries newest-first, optionally filtered by workItemId.
 */
export function queryAuditLog(opts: {
  workItemId?: string;
  limit?: number;
}): AuditEntry[] {
  const limit = opts.limit ?? 50;

  if (!existsSync(AUDIT_FILE)) return [];

  const content = readFileSync(AUDIT_FILE, "utf-8");
  const lines = content.split("\n").filter(Boolean);

  const entries: AuditEntry[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (opts.workItemId && parsed.workItemId !== opts.workItemId) continue;
      entries.push({
        timestamp: parsed.time ?? new Date(parsed.time).toISOString(),
        workItemId: parsed.workItemId,
        action: parsed.action,
        actor: parsed.actor,
        outcome: parsed.outcome,
        ...(parsed.executionId ? { executionId: parsed.executionId } : {}),
        ...(parsed.agentId ? { agentId: parsed.agentId } : {}),
        ...(parsed.fromState ? { fromState: parsed.fromState } : {}),
        ...(parsed.toState ? { toState: parsed.toState } : {}),
        ...(parsed.costUsd !== undefined ? { costUsd: parsed.costUsd } : {}),
        ...(parsed.durationMs !== undefined ? { durationMs: parsed.durationMs } : {}),
        ...(parsed.actorType ? { actorType: parsed.actorType } : {}),
      });
    } catch {
      // Skip malformed lines
    }
  }

  // Newest first
  return entries.reverse().slice(0, limit);
}
