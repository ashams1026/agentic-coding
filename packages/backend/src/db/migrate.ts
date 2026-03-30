import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./connection.js";

export function runMigrations() {
  migrate(db, { migrationsFolder: "./drizzle" });
}

// Run directly via: tsx src/db/migrate.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
  console.log("Migrations applied.");
}
