import Fastify from "fastify";
import cors from "@fastify/cors";
import { workItemRoutes } from "./routes/work-items.js";
import { personaAssignmentRoutes } from "./routes/persona-assignments.js";
import { workItemEdgeRoutes } from "./routes/work-item-edges.js";
import { commentRoutes } from "./routes/comments.js";

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
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });

  // Health check
  server.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // API routes
  await workItemRoutes(server);
  await personaAssignmentRoutes(server);
  await workItemEdgeRoutes(server);
  await commentRoutes(server);

  return server;
}
