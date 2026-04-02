import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import type BetterSqlite3 from "better-sqlite3";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { mkdirSync } from "node:fs";
import * as schema from "./schema.js";

function resolveDbPath(): string {
  // Explicit env var override — always wins
  if (process.env["AGENTOPS_DB_PATH"]) return process.env["AGENTOPS_DB_PATH"];
  if (process.env["DATABASE_URL"]) return process.env["DATABASE_URL"];

  const nodeEnv = process.env["NODE_ENV"] ?? "development";

  if (nodeEnv === "production") {
    const dir = resolve(homedir(), ".agentops", "data");
    mkdirSync(dir, { recursive: true });
    return resolve(dir, "agentops.db");
  }

  // Development (default): local to project directory
  return "agentops-dev.db";
}

export const DB_PATH = resolveDbPath();

const sqlite: BetterSqlite3.Database = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");
sqlite.pragma("synchronous = NORMAL");

export const db = drizzle({ client: sqlite, schema });
export { sqlite };
