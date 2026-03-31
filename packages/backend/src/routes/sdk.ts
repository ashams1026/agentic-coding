import type { FastifyInstance } from "fastify";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type {
  SlashCommand,
  AgentInfo,
  ModelInfo,
} from "@anthropic-ai/claude-agent-sdk";
import { loadConfig } from "../config.js";
import { logger } from "../logger.js";

// ── Capabilities cache ──────────────────────────────────────────

export interface SdkCapabilities {
  commands: SlashCommand[];
  agents: AgentInfo[];
  models: ModelInfo[];
  cachedAt: string;
}

let cache: SdkCapabilities | null = null;

/**
 * Spin up a lightweight query, call a control method, then tear down.
 * The query subprocess must be running for control requests to work,
 * so we read the first message before invoking the callback.
 */
async function withDiscoveryQuery<T>(
  fn: (q: ReturnType<typeof query>) => Promise<T>,
): Promise<T> {
  const config = loadConfig();
  if (!config.anthropicApiKey) {
    throw new Error("Anthropic API key not configured");
  }

  process.env["ANTHROPIC_API_KEY"] = config.anthropicApiKey;

  const q = query({
    prompt: "Respond with exactly: OK",
    options: {
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      maxTurns: 1,
    },
  });

  try {
    // Ensure subprocess is running by reading the first message
    await q.next();

    // Call the control method
    const result = await fn(q);

    // Tear down
    await q.interrupt();
    // Drain remaining messages
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of q) {
      /* drain */
    }

    return result;
  } catch (err) {
    // Ensure cleanup even on error
    try {
      await q.interrupt();
      for await (const _ of q) {
        /* drain */
      }
    } catch {
      // Subprocess may already be dead
    }
    throw err;
  }
}

async function fetchCapabilities(): Promise<SdkCapabilities> {
  const initResult = await withDiscoveryQuery((q) =>
    q.initializationResult(),
  );

  const capabilities: SdkCapabilities = {
    commands: initResult.commands,
    agents: initResult.agents,
    models: initResult.models,
    cachedAt: new Date().toISOString(),
  };

  cache = capabilities;
  logger.info(
    {
      commands: capabilities.commands.length,
      agents: capabilities.agents.length,
      models: capabilities.models.length,
    },
    "SDK capabilities cached",
  );

  return capabilities;
}

// ── Routes ──────────────────────────────────────────────────────

export async function sdkRoutes(app: FastifyInstance) {
  // GET /api/sdk/capabilities — return cached SDK capabilities (lazy-fetch on first call)
  app.get("/api/sdk/capabilities", async (_request, reply) => {
    try {
      if (cache) {
        return { data: cache };
      }

      const capabilities = await fetchCapabilities();
      return { data: capabilities };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message }, "Failed to fetch SDK capabilities");
      return reply
        .status(503)
        .send({ error: `SDK capabilities unavailable: ${message}` });
    }
  });

  // POST /api/sdk/reload — reload plugins and refresh the capabilities cache
  app.post("/api/sdk/reload", async (_request, reply) => {
    try {
      const reloadResult = await withDiscoveryQuery((q) =>
        q.reloadPlugins(),
      );

      cache = {
        commands: reloadResult.commands,
        agents: reloadResult.agents,
        models: cache?.models ?? [],
        cachedAt: new Date().toISOString(),
      };

      // reloadPlugins doesn't return models, so re-fetch if cache was empty
      if (cache.models.length === 0) {
        const initResult = await withDiscoveryQuery((q) =>
          q.initializationResult(),
        );
        cache.models = initResult.models;
      }

      logger.info(
        {
          commands: cache.commands.length,
          agents: cache.agents.length,
          errorCount: reloadResult.error_count,
        },
        "SDK plugins reloaded",
      );

      return {
        data: cache,
        reloadErrors: reloadResult.error_count,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message }, "Failed to reload SDK plugins");
      return reply
        .status(503)
        .send({ error: `SDK reload failed: ${message}` });
    }
  });
}
