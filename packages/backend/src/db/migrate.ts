import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { db, DB_PATH } from "./connection.js";
import { sqlite } from "./connection.js";
import { logger } from "../logger.js";

const BACKUP_PATTERN = /\.pre-migration-(\d+)\.bak$/;
const MAX_BACKUPS = 3;

export async function runMigrations() {
  // Pre-migration backup (skip if DB doesn't exist yet — first startup)
  if (existsSync(DB_PATH)) {
    const backupPath = `${DB_PATH}.pre-migration-${Date.now()}.bak`;
    try {
      await sqlite.backup(backupPath);
      logger.info({ backupPath }, "Pre-migration backup created");
    } catch (err) {
      logger.error({ err }, "Pre-migration backup failed — continuing with migration");
    }
  }

  migrate(db, { migrationsFolder: "./drizzle" });

  // Prune old backups, keeping only the 3 most recent
  pruneOldBackups();
}

function pruneOldBackups() {
  const dir = dirname(DB_PATH) || ".";
  const dbName = basename(DB_PATH);

  try {
    const files = readdirSync(dir);
    const backups = files
      .filter((f) => f.startsWith(dbName) && BACKUP_PATTERN.test(f))
      .map((f) => {
        const match = f.match(BACKUP_PATTERN)!;
        return { name: f, timestamp: Number(match[1]) };
      })
      .sort((a, b) => b.timestamp - a.timestamp); // newest first

    if (backups.length > MAX_BACKUPS) {
      for (const old of backups.slice(MAX_BACKUPS)) {
        unlinkSync(join(dir, old.name));
        logger.info({ file: old.name }, "Pruned old backup");
      }
    }
  } catch (err) {
    logger.error({ err }, "Failed to prune old backups");
  }
}

// Run directly via: tsx src/db/migrate.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().then(() => {
    console.log("Migrations applied.");
  });
}
