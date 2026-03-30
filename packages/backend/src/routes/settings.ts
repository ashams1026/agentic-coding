import type { FastifyInstance } from "fastify";
import { loadConfig, setConfigValue } from "../config.js";
import { logger } from "../logger.js";
import { getActiveCount, getQueueLength } from "../agent/concurrency.js";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Mask an API key for display: show prefix and last 4 chars.
 * e.g. "sk-ant-api03-abc...****"
 */
function maskKey(key: string): string {
  if (key.length <= 12) return key.slice(0, 4) + "****";
  return key.slice(0, 12) + "...****";
}

/**
 * Validate an Anthropic API key by making a minimal API call.
 * Returns true if the key is accepted (2xx or 4xx other than 401).
 * Returns false on 401 (unauthorized) or network errors.
 */
async function validateAnthropicKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
    });

    if (res.status === 401) {
      return { valid: false, error: "Invalid API key" };
    }

    // Any non-401 response means the key is recognized
    return { valid: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Anthropic API key validation failed");
    return { valid: false, error: `Connection failed: ${message}` };
  }
}

export async function settingsRoutes(app: FastifyInstance) {
  // GET /api/settings/api-key — check if API key is configured
  app.get("/api/settings/api-key", async () => {
    const config = loadConfig();
    const key = config.anthropicApiKey;

    if (!key) {
      return { configured: false, maskedKey: null };
    }

    return { configured: true, maskedKey: maskKey(key) };
  });

  // POST /api/settings/api-key — validate and store API key
  app.post<{
    Body: { key: string };
  }>("/api/settings/api-key", async (request, reply) => {
    const { key } = request.body;

    if (!key || typeof key !== "string" || key.trim().length === 0) {
      return reply.status(400).send({ error: "API key is required" });
    }

    // Validate by making a test call
    const result = await validateAnthropicKey(key.trim());

    if (!result.valid) {
      return reply.status(400).send({
        error: result.error ?? "Invalid API key",
        valid: false,
      });
    }

    // Store the key
    setConfigValue("anthropicApiKey", key.trim());

    return {
      valid: true,
      configured: true,
      maskedKey: maskKey(key.trim()),
    };
  });

  // DELETE /api/settings/api-key — remove API key
  app.delete("/api/settings/api-key", async () => {
    setConfigValue("anthropicApiKey", "");
    return { configured: false, maskedKey: null };
  });

  // GET /api/settings/concurrency — current active/queued counts
  app.get("/api/settings/concurrency", async () => {
    return {
      active: getActiveCount(),
      queued: getQueueLength(),
    };
  });
}
