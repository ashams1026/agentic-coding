/**
 * Global structured logger for the AgentOps backend.
 *
 * - Dev mode (NODE_ENV !== 'production'): pino-pretty to stdout
 * - Production: daily-rotated file at ~/.agentops/logs/agentops.log (7-day retention) + stdout
 *
 * Exports:
 * - `logger` — standalone pino instance for application code (agent, startup, etc.)
 * - `loggerConfig` — Fastify-compatible logger config object (keeps Fastify's default typing)
 */

import pino from "pino";
import type { FastifyServerOptions } from "fastify";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { mkdirSync } from "node:fs";

const isDev = process.env["NODE_ENV"] !== "production";
const LOG_DIR = resolve(homedir(), ".agentops", "logs");
const LOG_FILE = resolve(LOG_DIR, "agentops.log");

// Ensure log directory exists
mkdirSync(LOG_DIR, { recursive: true });

const devTransport: pino.TransportSingleOptions = {
  target: "pino-pretty",
  options: { colorize: true },
};

const prodTransport: pino.TransportMultiOptions = {
  targets: [
    {
      target: "pino-roll",
      options: {
        file: LOG_FILE,
        frequency: "daily",
        limit: { count: 7 },
      },
      level: "info",
    },
    {
      target: "pino/file",
      options: { destination: 1 },
      level: "info",
    },
  ],
};

/** Fastify-compatible logger config. Pass to Fastify({ logger: loggerConfig }). */
export const loggerConfig: FastifyServerOptions["logger"] = {
  level: "info",
  transport: isDev ? devTransport : prodTransport,
};

/** Standalone pino logger for non-Fastify application code. */
export const logger = pino({
  level: "info",
  transport: isDev ? devTransport : prodTransport,
});
