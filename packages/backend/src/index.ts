import { buildServer } from "./server.js";
import { runMigrations } from "./db/migrate.js";

const PORT = Number(process.env["PORT"] ?? 3001);
const HOST = process.env["HOST"] ?? "0.0.0.0";

async function main() {
  // Apply pending migrations before starting
  runMigrations();

  const server = await buildServer();

  try {
    await server.listen({ port: PORT, host: HOST });
    server.log.info(`AgentOps backend listening on ${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
