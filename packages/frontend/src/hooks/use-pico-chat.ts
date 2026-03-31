import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatSessionId, ChatSession } from "@agentops/shared";
import {
  getChatSessions,
  createChatSession,
  updateChatSessionTitle,
  deleteChatSession,
  getChatMessages,
  sendChatMessageSSE,
} from "@/api";
import { usePicoStore } from "@/features/pico/pico-store";
import { useUIStore } from "@/stores/ui-store";
import type { PicoChatMessage, ContentBlock } from "@/features/pico/chat-message";

// ── SSE event types (mirrors backend sendSSE calls) ──────────────

interface SSETextEvent {
  type: "text";
  content: string;
}
interface SSEThinkingEvent {
  type: "thinking";
  content: string;
}
interface SSEToolUseEvent {
  type: "tool_use";
  content: string; // JSON-encoded { id, name, input }
}
interface SSEToolResultEvent {
  type: "tool_result";
  content: string; // JSON-encoded { output }
}
interface SSEErrorEvent {
  type: "error";
  content: string;
}
interface SSEDoneEvent {
  type: "done";
  messageId: string;
}

type SSEEvent =
  | SSETextEvent
  | SSEThinkingEvent
  | SSEToolUseEvent
  | SSEToolResultEvent
  | SSEErrorEvent
  | SSEDoneEvent;

// ── Parse SSE stream ─────────────────────────────────────────────

async function* parseSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<SSEEvent> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          yield JSON.parse(line.slice(6)) as SSEEvent;
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  }

  // Process any remaining buffer
  if (buffer.startsWith("data: ")) {
    try {
      yield JSON.parse(buffer.slice(6)) as SSEEvent;
    } catch {
      // Skip
    }
  }
}

// ── Convert DB ChatMessage to PicoChatMessage ────────────────────

function dbMessageToPico(msg: {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}): PicoChatMessage {
  const blocks: ContentBlock[] = [];

  if (msg.role === "user") {
    blocks.push({ type: "text", text: msg.content });
  } else {
    // Reconstruct content blocks from metadata
    const meta = msg.metadata ?? {};
    const thinkingBlocks = (meta.thinkingBlocks as string[]) ?? [];
    const toolCalls = (meta.toolCalls as Array<{ id: string; name: string; input: Record<string, unknown> }>) ?? [];

    // Thinking blocks come first
    for (const t of thinkingBlocks) {
      blocks.push({ type: "thinking", text: t });
    }

    // Tool calls
    for (const tc of toolCalls) {
      blocks.push({
        type: "tool_use",
        toolCallId: tc.id,
        toolName: tc.name,
        input: tc.input,
        summary: summarizeTool(tc.name, tc.input),
        status: "success",
      });
    }

    // Main text content
    if (msg.content) {
      blocks.push({ type: "text", text: msg.content });
    }
  }

  return {
    id: msg.id,
    role: msg.role,
    timestamp: new Date(msg.createdAt),
    content: blocks.length > 0 ? blocks : [{ type: "text", text: "" }],
  };
}

function summarizeTool(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "Read":
      return String(input.file_path ?? input.filePath ?? "file");
    case "Bash":
      return String(input.command ?? "command").slice(0, 60);
    case "Grep":
      return `/${input.pattern ?? ""}/ in ${input.path ?? "."}`;
    case "Glob":
      return String(input.pattern ?? "");
    case "Edit":
      return String(input.file_path ?? input.filePath ?? "file");
    case "Write":
      return String(input.file_path ?? input.filePath ?? "file");
    default:
      return name;
  }
}

// ── Hook ─────────────────────────────────────────────────────────

export function usePicoChat() {
  const { currentSessionId, setCurrentSessionId, isOpen, setHasUnread } =
    usePicoStore();
  const selectedProjectId = useUIStore((s) => s.selectedProjectId);

  const [messages, setMessages] = useState<PicoChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);

  // Load history when session changes
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setIsLoadingHistory(true);

    getChatMessages(currentSessionId)
      .then((dbMessages) => {
        if (cancelled) return;
        setMessages(dbMessages.map(dbMessageToPico));
      })
      .catch(() => {
        if (cancelled) return;
        // Session may have been deleted — clear it
        setCurrentSessionId(null);
        setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentSessionId, setCurrentSessionId]);

  // Refresh session list
  const refreshSessions = useCallback(async () => {
    if (!selectedProjectId) return;
    const list = await getChatSessions(selectedProjectId);
    setSessions(list);
    return list;
  }, [selectedProjectId]);

  // Auto-create or restore session when panel opens
  useEffect(() => {
    if (!isOpen || !selectedProjectId) return;

    let cancelled = false;
    refreshSessions().then((list) => {
      if (cancelled || !list) return;
      if (!currentSessionId && list.length > 0) {
        setCurrentSessionId(list[0]!.id as ChatSessionId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedProjectId, currentSessionId, setCurrentSessionId, refreshSessions]);

  // Ensure a session exists, creating one if needed
  const ensureSession = useCallback(async (): Promise<ChatSessionId> => {
    if (currentSessionId) return currentSessionId;

    if (!selectedProjectId) {
      throw new Error("No project selected");
    }

    const session = await createChatSession(selectedProjectId);
    const id = session.id as ChatSessionId;
    setCurrentSessionId(id);
    return id;
  }, [currentSessionId, selectedProjectId, setCurrentSessionId]);

  // Send a message and stream the response
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;
      setError(null);

      try {
        const sessionId = await ensureSession();

        // Add user message optimistically
        const userMsg: PicoChatMessage = {
          id: `temp-user-${Date.now()}`,
          role: "user",
          timestamp: new Date(),
          content: [{ type: "text", text: content.trim() }],
        };
        setMessages((prev) => [...prev, userMsg]);

        // Create placeholder assistant message
        const assistantMsgId = `temp-assistant-${Date.now()}`;
        const assistantMsg: PicoChatMessage = {
          id: assistantMsgId,
          role: "assistant",
          timestamp: new Date(),
          content: [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsStreaming(true);

        // Start SSE stream
        const { response, abort } = sendChatMessageSSE(sessionId, content.trim());
        abortRef.current = abort;

        const res = await response;
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        let textAccum = "";
        let currentBlocks: ContentBlock[] = [];
        // Track which tool calls we've seen by ID for result pairing
        const toolCallMap = new Map<string, number>(); // toolCallId → block index
        let lastToolCallIndex = -1;

        for await (const event of parseSSE(reader)) {
          switch (event.type) {
            case "text": {
              textAccum += event.content;
              // Find or create the text block at the end
              const lastBlock = currentBlocks[currentBlocks.length - 1];
              if (lastBlock?.type === "text") {
                lastBlock.text = textAccum;
              } else {
                currentBlocks.push({ type: "text", text: textAccum });
              }
              break;
            }
            case "thinking": {
              currentBlocks.push({ type: "thinking", text: event.content });
              // Reset text accumulator — new text will start a new block
              textAccum = "";
              break;
            }
            case "tool_use": {
              textAccum = "";
              const tc = JSON.parse(event.content) as {
                id: string;
                name: string;
                input: Record<string, unknown>;
              };
              const blockIndex = currentBlocks.length;
              toolCallMap.set(tc.id, blockIndex);
              lastToolCallIndex = blockIndex;
              currentBlocks.push({
                type: "tool_use",
                toolCallId: tc.id,
                toolName: tc.name,
                input: tc.input,
                summary: summarizeTool(tc.name, tc.input),
                status: "running",
              });
              break;
            }
            case "tool_result": {
              const result = JSON.parse(event.content) as { output: string };
              // Pair with the most recent tool call
              if (lastToolCallIndex >= 0) {
                const block = currentBlocks[lastToolCallIndex];
                if (block?.type === "tool_use") {
                  block.status = "success";
                  block.output = result.output;
                }
              }
              break;
            }
            case "error": {
              setError(event.content);
              break;
            }
            case "done": {
              // Update the assistant message with the real ID
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, id: event.messageId } : m,
                ),
              );
              break;
            }
          }

          // Update the assistant message in state
          const updatedBlocks = [...currentBlocks];
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: updatedBlocks.length > 0 ? updatedBlocks : [{ type: "text" as const, text: "" }] }
                : m,
            ),
          );
        }

        // Notify if panel is closed
        if (!usePicoStore.getState().isOpen) {
          setHasUnread(true);
        }

        // Refresh sessions to pick up auto-generated title
        refreshSessions();
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, ensureSession, setHasUnread, refreshSessions],
  );

  // Create a new session (for "new chat" button)
  const newSession = useCallback(async () => {
    if (!selectedProjectId) return;
    const session = await createChatSession(selectedProjectId);
    setCurrentSessionId(session.id as ChatSessionId);
    setMessages([]);
    setError(null);
    await refreshSessions();
  }, [selectedProjectId, setCurrentSessionId, refreshSessions]);

  // Switch to an existing session
  const switchSession = useCallback(
    (sessionId: ChatSessionId) => {
      if (sessionId === currentSessionId) return;
      setCurrentSessionId(sessionId);
      setError(null);
    },
    [currentSessionId, setCurrentSessionId],
  );

  // Rename a session
  const renameSession = useCallback(
    async (sessionId: ChatSessionId, title: string) => {
      await updateChatSessionTitle(sessionId, title);
      setSessions((prev) =>
        prev.map((s) =>
          (s.id as ChatSessionId) === sessionId ? { ...s, title } : s,
        ),
      );
    },
    [],
  );

  // Delete all sessions
  const clearAllSessions = useCallback(async () => {
    for (const s of sessions) {
      await deleteChatSession(s.id as ChatSessionId);
    }
    setSessions([]);
    setCurrentSessionId(null);
    setMessages([]);
    setError(null);
  }, [sessions, setCurrentSessionId]);

  // Retry after error — resend the last user message
  const retry = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;
    const text =
      lastUserMsg.content[0]?.type === "text"
        ? lastUserMsg.content[0].text
        : "";
    if (!text) return;

    // Remove the failed assistant message (last message if it's from assistant)
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") return prev.slice(0, -1);
      return prev;
    });
    // Remove the user message too — sendMessage will re-add it
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "user") return prev.slice(0, -1);
      return prev;
    });
    setError(null);
    sendMessage(text);
  }, [messages, sendMessage]);

  // Find current session metadata
  const currentSession = sessions.find(
    (s) => (s.id as ChatSessionId) === currentSessionId,
  ) ?? null;

  return {
    messages,
    sessions,
    currentSession,
    currentSessionId,
    isStreaming,
    isLoadingHistory,
    error,
    sendMessage,
    newSession,
    switchSession,
    renameSession,
    clearAllSessions,
    retry,
  };
}
