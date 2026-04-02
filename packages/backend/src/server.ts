import Fastify from "fastify";
import cors from "@fastify/cors";
import { projectRoutes } from "./routes/projects.js";
import { workItemRoutes } from "./routes/work-items.js";
import { personaAssignmentRoutes } from "./routes/persona-assignments.js";
import { workItemEdgeRoutes } from "./routes/work-item-edges.js";
import { commentRoutes } from "./routes/comments.js";
import { personaRoutes } from "./routes/personas.js";
import { executionRoutes } from "./routes/executions.js";
import { proposalRoutes } from "./routes/proposals.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { auditRoutes } from "./routes/audit.js";
import { settingsRoutes } from "./routes/settings.js";
import { chatRoutes } from "./routes/chat.js";
import { sdkRoutes } from "./routes/sdk.js";
import { workflowRoutes } from "./routes/workflows.js";
import { registerWebSocket } from "./ws.js";
import { getActiveCount } from "./agent/concurrency.js";
import { executionManager } from "./agent/setup.js";
import { loggerConfig } from "./logger.js";

export async function buildServer() {
  const server = Fastify({
    logger: loggerConfig,
  });

  // CORS — allow frontend dev server
  await server.register(cors, {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:4173"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });

  // Health check — enhanced with uptime, active executions, version
  server.get("/api/health", async () => {
    return {
      status: "ok",
      uptime: Math.floor(process.uptime()),
      activeExecutions: getActiveCount(),
      executor: executionManager.getExecutorMode(),
      version: "0.0.1",
    };
  });

  // Legacy health check (keep for backwards compat)
  server.get("/health", async () => {
    return {
      status: "ok",
      uptime: Math.floor(process.uptime()),
      activeExecutions: getActiveCount(),
      version: "0.0.1",
    };
  });

  // WebSocket
  await registerWebSocket(server);

  // API routes
  await projectRoutes(server);
  await workItemRoutes(server);
  await personaAssignmentRoutes(server);
  await workItemEdgeRoutes(server);
  await commentRoutes(server);
  await personaRoutes(server);
  await executionRoutes(server);
  await proposalRoutes(server);
  await dashboardRoutes(server);
  await auditRoutes(server);
  await settingsRoutes(server);
  await chatRoutes(server);
  await sdkRoutes(server);
  await workflowRoutes(server);

  return server;
}
