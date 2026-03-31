/**
 * Persistent SDK session manager.
 *
 * Maintains a long-lived V2 session for:
 * (a) SDK discovery — initializationResult, supportedCommands, supportedAgents, supportedModels
 * (b) Pico backbone — chat can use session.send() instead of spinning up a new query() per message
 *
 * The session is lazily created on first access and kept alive for the server's lifetime.
 * Handles reconnection with exponential backoff (max 3 retries).
 */

import {
  unstable_v2_createSession,
  unstable_v2_resumeSession,
} from "@anthropic-ai/claude-agent-sdk";
import type { SDKSession } from "@anthropic-ai/claude-agent-sdk";
import { loadConfig } from "../config.js";
import { logger } from "../logger.js";

// ── State ────────────────────────────────────────────────────────

let session: SDKSession | null = null;
let sessionId: string | null = null;
let initializing = false;
let initPromise: Promise<SDKSession | null> | null = null;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

// ── Public API ───────────────────────────────────────────────────

/**
 * Get the persistent SDK session. Creates it on first call.
 * Returns null if the API key is not configured or session creation fails.
 */
export async function getSdkSession(): Promise<SDKSession | null> {
  if (session) return session;

  // Deduplicate concurrent init calls
  if (initializing && initPromise) return initPromise;

  initializing = true;
  initPromise = initSession();
  const result = await initPromise;
  initializing = false;
  initPromise = null;
  return result;
}

/**
 * Get the current session ID (null if no session).
 */
export function getSdkSessionId(): string | null {
  return sessionId;
}

/**
 * Check if the SDK session is available without creating it.
 */
export function isSdkSessionReady(): boolean {
  return session !== null;
}

/**
 * Close the SDK session. Called during graceful shutdown.
 */
export function closeSdkSession(): void {
  if (session) {
    logger.info({ sessionId }, "Closing persistent SDK session");
    try {
      session.close();
    } catch (err) {
      logger.warn({ err }, "Error closing SDK session");
    }
    session = null;
    sessionId = null;
  }
}

/**
 * Reconnect the SDK session. Used when the session dies unexpectedly.
 * Tries to resume the existing session first, then falls back to creating a new one.
 */
export async function reconnectSdkSession(): Promise<SDKSession | null> {
  const oldSessionId = sessionId;
  closeSdkSession();

  if (oldSessionId) {
    // Try to resume the existing session
    try {
      const resumed = await createSessionWithRetry(oldSessionId);
      if (resumed) return resumed;
    } catch {
      logger.warn({ oldSessionId }, "Failed to resume SDK session, creating new one");
    }
  }

  return initSession();
}

// ── Internal ─────────────────────────────────────────────────────

async function initSession(): Promise<SDKSession | null> {
  const config = loadConfig();
  if (!config.anthropicApiKey) {
    logger.warn("No Anthropic API key configured — SDK session not created");
    return null;
  }

  try {
    const s = await createSessionWithRetry(null);
    return s;
  } catch (err) {
    logger.error({ err }, "Failed to create persistent SDK session after retries");
    return null;
  }
}

async function createSessionWithRetry(
  resumeId: string | null,
): Promise<SDKSession | null> {
  const config = loadConfig();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const opts = {
        model: "claude-sonnet-4-6",
        permissionMode: "bypassPermissions" as const,
        allowedTools: ["Read", "Glob", "Grep", "Bash", "WebSearch"],
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: config.anthropicApiKey,
        },
      };

      let s: SDKSession;
      if (resumeId) {
        logger.info({ sessionId: resumeId, attempt }, "Resuming SDK session");
        s = unstable_v2_resumeSession(resumeId, opts);
      } else {
        logger.info({ attempt }, "Creating new persistent SDK session");
        s = unstable_v2_createSession(opts);
      }

      // Read the first message to initialize the session and get the ID
      const stream = s.stream();
      const first = await stream.next();
      if (first.done) {
        throw new Error("Session stream ended immediately");
      }

      sessionId = s.sessionId;
      session = s;

      logger.info({ sessionId, attempt }, "Persistent SDK session ready");
      return s;
    } catch (err) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      logger.warn(
        { attempt, maxRetries: MAX_RETRIES, delayMs: delay, err },
        "SDK session creation failed, retrying",
      );

      if (attempt < MAX_RETRIES - 1) {
        await sleep(delay);
      }
    }
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
