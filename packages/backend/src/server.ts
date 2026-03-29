import Fastify from "fastify";
import cors from "@fastify/cors";

export async function buildServer() {
  const server = Fastify({
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    },
  });

  // CORS — allow frontend dev server
  await server.register(cors, {
    origin: ["http://localhost:5173", "http://localhost:4173"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  // Health check
  server.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  return server;
}
