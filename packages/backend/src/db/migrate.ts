import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { existsSync } from "node:fs";
import { db, DB_PATH } from "./connection.js";
import { createBackup } from "./backup.js";
import { logger } from "../logger.js";

export async function runMigrations() {
  // Pre-migration backup using centralized backup system
  // Skip if DB doesn't exist yet (first startup)
  if (existsSync(DB_PATH)) {
    try {
      const backupPath = createBackup();
      logger.info({ backupPath }, "Pre-migration backup created");
    } catch (err) {
      logger.error({ err }, "Pre-migration backup failed — continuing with migration");
    }
  }

  migrate(db, { migrationsFolder: "./drizzle" });
}

// Run directly via: tsx src/db/migrate.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().then(() => {
    console.log("Migrations applied.");
  });
}
