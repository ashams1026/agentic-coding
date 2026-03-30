/**
 * Configuration loader for AgentOps.
 *
 * Loads from ~/.agentops/config.json with env var overrides.
 * Env vars take precedence over config file values.
 */

import { resolve } from "node:path";
import { homedir } from "node:os";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const AGENTOPS_DIR = resolve(homedir(), ".agentops");
const CONFIG_FILE = resolve(AGENTOPS_DIR, "config.json");

// ── Config schema ───────────────────────────────────────────────

export interface AgentOpsConfig {
  port: number;
  dbPath: string;
  logLevel: string;
  anthropicApiKey: string;
}

const DEFAULTS: AgentOpsConfig = {
  port: 3001,
  dbPath: resolve(AGENTOPS_DIR, "data", "agentops.db"),
  logLevel: "info",
  anthropicApiKey: "",
};

// ── File I/O ────────────────────────────────────────────────────

function readConfigFile(): Partial<AgentOpsConfig> {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as Partial<AgentOpsConfig>;
  } catch {
    return {};
  }
}

function writeConfigFile(data: Partial<AgentOpsConfig>): void {
  mkdirSync(AGENTOPS_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2) + "\n");
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Load resolved config: defaults ← config file ← env vars.
 * Env vars always win.
 */
export function loadConfig(): AgentOpsConfig {
  const file = readConfigFile();

  return {
    port:
      env("PORT", "number") ??
      file.port ??
      DEFAULTS.port,
    dbPath:
      process.env["AGENTOPS_DB_PATH"] ??
      process.env["DATABASE_URL"] ??
      file.dbPath ??
      DEFAULTS.dbPath,
    logLevel:
      process.env["LOG_LEVEL"] ??
      file.logLevel ??
      DEFAULTS.logLevel,
    anthropicApiKey:
      process.env["ANTHROPIC_API_KEY"] ??
      file.anthropicApiKey ??
      DEFAULTS.anthropicApiKey,
  };
}

/**
 * Set a single config key in the config file.
 * Does not affect env vars — only persists to ~/.agentops/config.json.
 */
export function setConfigValue(key: string, value: string): void {
  const validKeys: Record<string, (v: string) => unknown> = {
    port: (v) => {
      const n = parseInt(v, 10);
      if (isNaN(n) || n < 1 || n > 65535) throw new Error("port must be 1-65535");
      return n;
    },
    dbPath: (v) => v,
    logLevel: (v) => {
      if (!["trace", "debug", "info", "warn", "error", "fatal"].includes(v)) {
        throw new Error("logLevel must be one of: trace, debug, info, warn, error, fatal");
      }
      return v;
    },
    anthropicApiKey: (v) => v,
  };

  const parser = validKeys[key];
  if (!parser) {
    throw new Error(`Unknown config key: ${key}. Valid keys: ${Object.keys(validKeys).join(", ")}`);
  }

  const parsed = parser(value);
  const current = readConfigFile();
  (current as Record<string, unknown>)[key] = parsed;
  writeConfigFile(current);
}

/**
 * Get the path to the config file.
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

// ── Helpers ─────────────────────────────────────────────────────

function env(name: string, type: "number"): number | undefined;
function env(name: string, type?: "string"): string | undefined;
function env(name: string, type?: string): unknown {
  const val = process.env[name];
  if (val === undefined) return undefined;
  if (type === "number") {
    const n = parseInt(val, 10);
    return isNaN(n) ? undefined : n;
  }
  return val;
}
