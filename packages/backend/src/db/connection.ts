import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import type BetterSqlite3 from "better-sqlite3";
import * as schema from "./schema.js";

const DB_PATH = process.env["DATABASE_URL"] ?? "agentops.db";

const sqlite: BetterSqlite3.Database = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle({ client: sqlite, schema });
export { sqlite };
