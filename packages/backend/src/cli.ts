#!/usr/bin/env node

import { resolve, dirname } from "node:path";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  unlinkSync,
} from "node:fs";
import { homedir } from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// ── Paths ───────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, "..");

const AGENTOPS_DIR = resolve(homedir(), ".agentops");
const PID_FILE = resolve(AGENTOPS_DIR, "agentops.pid");
const DEFAULT_PORT = Number(process.env["PORT"] ?? 3001);

// ── PID file helpers ────────────────────────────────────────────

function ensureDir(): void {
  if (!existsSync(AGENTOPS_DIR)) {
    mkdirSync(AGENTOPS_DIR, { recursive: true });
  }
}

function writePid(pid: number): void {
  ensureDir();
  writeFileSync(PID_FILE, String(pid));
}

function readPid(): number | null {
  if (!existsSync(PID_FILE)) return null;
  const pid = parseInt(readFileSync(PID_FILE, "utf-8").trim(), 10);
  return isNaN(pid) ? null : pid;
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function removePid(): void {
  if (existsSync(PID_FILE)) {
    unlinkSync(PID_FILE);
  }
}

// ── Commands ────────────────────────────────────────────────────

async function startCommand(): Promise<void> {
  const pid = readPid();
  if (pid && isProcessRunning(pid)) {
    console.log(`AgentOps is already running (PID ${pid})`);
    process.exit(1);
  }
  removePid();

  // Write PID and register cleanup
  writePid(process.pid);
  const cleanup = () => removePid();
  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });

  console.log(`Starting AgentOps on port ${DEFAULT_PORT}...`);
  const { startServer } = await import("./start.js");
  await startServer({ port: DEFAULT_PORT });
}

function stopCommand(): void {
  const pid = readPid();
  if (!pid || !isProcessRunning(pid)) {
    console.log("AgentOps is not running.");
    removePid();
    return;
  }

  console.log(`Stopping AgentOps (PID ${pid})...`);
  process.kill(pid, "SIGTERM");
  removePid();
  console.log("Stopped.");
}

async function statusCommand(): Promise<void> {
  const pid = readPid();
  const running = pid !== null && isProcessRunning(pid);

  if (!running) {
    console.log("AgentOps: stopped");
    if (pid) removePid();
    return;
  }

  console.log(`AgentOps: running (PID ${pid})`);
  console.log(`Port: ${DEFAULT_PORT}`);

  // Try to fetch live stats from the health endpoint
  try {
    const res = await fetch(`http://localhost:${DEFAULT_PORT}/health`);
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      if (data["uptime"] !== undefined) console.log(`Uptime: ${data["uptime"]}s`);
      if (data["activeExecutions"] !== undefined)
        console.log(`Active agents: ${data["activeExecutions"]}`);
      if (data["version"]) console.log(`Version: ${data["version"]}`);
    }
  } catch {
    console.log("(could not reach server for live stats)");
  }

  // Try dashboard stats for cost
  try {
    const res = await fetch(
      `http://localhost:${DEFAULT_PORT}/api/dashboard/stats`,
    );
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      const todayCost = data["todayCostUsd"];
      if (typeof todayCost === "number") {
        console.log(`Today's cost: $${todayCost.toFixed(2)}`);
      }
    }
  } catch {
    // Dashboard endpoint may not be reachable
  }
}

function devCommand(): void {
  const srcIndex = resolve(PACKAGE_ROOT, "src", "index.ts");

  console.log("Starting AgentOps in development mode (watch)...");
  const child = spawn("npx", ["tsx", "watch", srcIndex], {
    stdio: "inherit",
    cwd: PACKAGE_ROOT,
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

function printUsage(): void {
  console.log(
    `
AgentOps — AI agent orchestration platform

Usage: agentops <command>

Commands:
  start    Start the server (foreground)
  stop     Stop the running server
  status   Show server status
  dev      Start in development mode (with watch)

Options:
  --help   Show this help message
`.trim(),
  );
}

// ── Main ────────────────────────────────────────────────────────

const command = process.argv[2];

switch (command) {
  case "start":
    await startCommand();
    break;
  case "stop":
    stopCommand();
    break;
  case "status":
    await statusCommand();
    break;
  case "dev":
    devCommand();
    break;
  case "--help":
  case "-h":
  case undefined:
    printUsage();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
