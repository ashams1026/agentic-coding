/**
 * E2E test database seeder.
 *
 * Creates a temporary SQLite database at a configurable path,
 * runs migrations, and seeds it with E2E test fixtures (same data
 * as the main seed). Used by scripts/test-e2e.sh.
 *
 * Usage:
 *   DATABASE_URL=/tmp/agentops-e2e-test.db tsx src/db/seed-e2e.ts
 */

const DB_PATH = process.env["DATABASE_URL"] ?? "/tmp/agentops-e2e-test.db";

// Set env before any connection module loads
process.env["DATABASE_URL"] = DB_PATH;

async function main() {
  console.log(`E2E seed: using database at ${DB_PATH}`);

  // Dynamic import so DATABASE_URL is set before connection.ts evaluates
  const { seed } = await import("./seed.js");
  await seed();

  console.log(`E2E seed complete. Database: ${DB_PATH}`);
}

main().catch((err) => {
  console.error("E2E seed failed:", err);
  process.exit(1);
});
