import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ChevronDown, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { subscribe } from "@/api/ws";
import { useExecution, usePersona, useWorkItem } from "@/hooks";
import type { PersonaId, WorkItemId } from "@agentops/shared";
import {
  ToolCallSection,
  parseToolJson,
  type ToolCallData,
  type ToolResultData,
} from "./tool-call-display";
import type { ExecutionId, AgentOutputChunkEvent } from "@agentops/shared";

// ── Chunk types ────────────────────────────────────────────────

interface OutputChunk {
  id: string;
  content: string;
  chunkType: AgentOutputChunkEvent["chunkType"];
  timestamp: string;
}

// ── Known SDK + MCP tool names for historical log detection ────

const KNOWN_TOOLS = new Set([
  "Read", "Edit", "Write", "Glob", "Grep", "Bash",
  "WebFetch", "WebSearch", "Agent", "NotebookEdit",
  "TodoWrite", "AskUserQuestion", "MultiEdit",
  "route_to_state", "list_items", "get_context", "post_comment",
  "get_work_item", "update_work_item", "create_work_item",
]);

// Regex: ToolName(anything) — tool call format from eventToChunk
const TOOL_CALL_RE = /^([A-Za-z_]\w*)\((.+)\)$/s;

function parseLogLine(
  line: string,
  id: string,
  timestamp: string,
): OutputChunk {
  // 1. JSON line with embedded chunkType
  if (line.startsWith("{")) {
    try {
      const obj = JSON.parse(line);
      if (obj.chunkType && typeof obj.content === "string") {
        return { id, content: obj.content, chunkType: obj.chunkType, timestamp };
      }
      // ToolCallData / ToolResultData shape
      if (obj.toolCallId && obj.toolName) {
        const type = "status" in obj ? "tool_result" as const : "tool_call" as const;
        return { id, content: line, chunkType: type, timestamp };
      }
    } catch { /* not JSON */ }
  }

  // 2. Tool call pattern: ToolName({...})
  const toolMatch = line.match(TOOL_CALL_RE);
  if (toolMatch && toolMatch[1] && toolMatch[2]) {
    const toolName = toolMatch[1];
    const rawInput = toolMatch[2];
    if (KNOWN_TOOLS.has(toolName)) {
      let input: Record<string, unknown> | string;
      try {
        input = JSON.parse(rawInput);
      } catch {
        input = rawInput;
      }
      const data: ToolCallData = {
        toolCallId: id,
        toolName,
        input: typeof input === "object" && input !== null
          ? (input as Record<string, unknown>)
          : rawInput,
        summary: toolName,
      };
      return { id, content: JSON.stringify(data), chunkType: "tool_call", timestamp };
    }
  }

  // 3. Thinking: <thinking> tags
  if (line.startsWith("<thinking>") || line.endsWith("</thinking>")) {
    const content = line.replace(/<\/?thinking>/g, "").trim();
    if (content) {
      return { id, content, chunkType: "thinking", timestamp };
    }
  }

  // 4. Default: text
  return { id, content: line, chunkType: "text", timestamp };
}

// ── Message groups (chat thread model) ─────────────────────────

type MessageGroup =
  | { kind: "agent-text"; id: string; chunks: OutputChunk[]; timestamp: string }
  | { kind: "thinking"; id: string; content: string; timestamp: string }
  | {
      kind: "tool";
      id: string;
      callData: ToolCallData | null;
      resultData: ToolResultData | null;
      timestamp: string;
    };

function groupIntoMessages(chunks: OutputChunk[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  const callIndexMap = new Map<string, number>();

  let textGroup: OutputChunk[] | null = null;
  let textGroupId: string | null = null;
  let textGroupTimestamp: string | null = null;

  function flushTextGroup() {
    if (textGroup && textGroup.length > 0) {
      groups.push({
        kind: "agent-text",
        id: textGroupId!,
        chunks: [...textGroup],
        timestamp: textGroupTimestamp!,
      });
      textGroup = null;
      textGroupId = null;
      textGroupTimestamp = null;
    }
  }

  for (const chunk of chunks) {
    if (chunk.chunkType === "text" || chunk.chunkType === "code") {
      if (!textGroup) {
        textGroup = [];
        textGroupId = chunk.id;
        textGroupTimestamp = chunk.timestamp;
      }
      textGroup.push(chunk);
    } else if (chunk.chunkType === "thinking") {
      flushTextGroup();
      groups.push({
        kind: "thinking",
        id: chunk.id,
        content: chunk.content,
        timestamp: chunk.timestamp,
      });
    } else if (chunk.chunkType === "tool_call") {
      flushTextGroup();
      const data = parseToolJson(chunk.content) as ToolCallData | null;
      const idx = groups.length;
      groups.push({
        kind: "tool",
        id: chunk.id,
        callData: data,
        resultData: null,
        timestamp: chunk.timestamp,
      });
      if (data?.toolCallId) {
        callIndexMap.set(data.toolCallId, idx);
      }
    } else if (chunk.chunkType === "tool_result") {
      const data = parseToolJson(chunk.content) as ToolResultData | null;
      if (data?.toolCallId && callIndexMap.has(data.toolCallId)) {
        const idx = callIndexMap.get(data.toolCallId)!;
        const existing = groups[idx] as MessageGroup & { kind: "tool" };
        groups[idx] = { ...existing, resultData: data };
      } else {
        flushTextGroup();
        groups.push({
          kind: "tool",
          id: chunk.id,
          callData: null,
          resultData: data,
          timestamp: chunk.timestamp,
        });
      }
    } else {
      // Unknown type — treat as text
      if (!textGroup) {
        textGroup = [];
        textGroupId = chunk.id;
        textGroupTimestamp = chunk.timestamp;
      }
      textGroup.push(chunk);
    }
  }

  flushTextGroup();
  return groups;
}

// ── Timestamp ──────────────────────────────────────────────────

function MessageTimestamp({ timestamp }: { timestamp: string }) {
  const time = new Date(timestamp);
  const label = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return <span className="text-[10px] text-zinc-600 select-none">{label}</span>;
}

// ── Code block ─────────────────────────────────────────────────

function CodeBlock({ content }: { content: string }) {
  const highlighted = content.replace(
    /\b(function|const|let|var|return|if|else|for|while|import|export|from|class|interface|type|async|await|try|catch|throw|new|this|null|undefined|true|false)\b/g,
    '<span class="text-purple-400">$1</span>',
  );

  return (
    <div className="my-1.5 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 overflow-x-auto">
      <pre
        className="text-xs text-emerald-300"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  );
}

// ── Agent text message bubble ──────────────────────────────────

function AgentTextBubble({
  chunks,
  timestamp,
}: {
  chunks: OutputChunk[];
  timestamp: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 px-4 py-3">
        {chunks.map((chunk) =>
          chunk.chunkType === "code" ? (
            <CodeBlock key={chunk.id} content={chunk.content} />
          ) : (
            <pre
              key={chunk.id}
              className="text-sm whitespace-pre-wrap break-words text-zinc-200"
            >
              {chunk.content}
            </pre>
          ),
        )}
      </div>
      <MessageTimestamp timestamp={timestamp} />
    </div>
  );
}

// ── Thinking accordion ─────────────────────────────────────────

function ThinkingAccordion({
  content,
  timestamp,
}: {
  content: string;
  timestamp: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-fit"
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            open && "rotate-180",
          )}
        />
        <span className="italic">Thinking...</span>
      </button>
      {open && (
        <div className="ml-5 px-3 py-1.5 border-l-2 border-zinc-700">
          <p className="text-xs italic text-zinc-500 whitespace-pre-wrap">
            {content}
          </p>
        </div>
      )}
      <MessageTimestamp timestamp={timestamp} />
    </div>
  );
}

// ── Tool message with timestamp ────────────────────────────────

function ToolMessage({
  callData,
  resultData,
  timestamp,
}: {
  callData: ToolCallData | null;
  resultData: ToolResultData | null;
  timestamp: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <ToolCallSection callData={callData} resultData={resultData} />
      <MessageTimestamp timestamp={timestamp} />
    </div>
  );
}

// ── Message group renderer ─────────────────────────────────────

function MessageGroupRenderer({ group }: { group: MessageGroup }) {
  switch (group.kind) {
    case "agent-text":
      return (
        <AgentTextBubble chunks={group.chunks} timestamp={group.timestamp} />
      );
    case "thinking":
      return (
        <ThinkingAccordion
          content={group.content}
          timestamp={group.timestamp}
        />
      );
    case "tool":
      return (
        <ToolMessage
          callData={group.callData}
          resultData={group.resultData}
          timestamp={group.timestamp}
        />
      );
  }
}

// ── Main component ─────────────────────────────────────────────

const MODEL_LABELS: Record<string, string> = {
  opus: "Opus",
  sonnet: "Sonnet",
  haiku: "Haiku",
};

interface TerminalRendererProps {
  executionId: ExecutionId;
}

export function TerminalRenderer({ executionId }: TerminalRendererProps) {
  const { data: execution } = useExecution(executionId);
  const { data: persona } = usePersona(execution?.personaId as PersonaId);
  const { data: workItem } = useWorkItem(execution?.workItemId as WorkItemId);
  const [chunks, setChunks] = useState<OutputChunk[]>([]);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [hasNewOutput, setHasNewOutput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chunkCounter = useRef(0);

  // Load initial logs from execution data
  useEffect(() => {
    if (!execution?.logs) return;

    const initialChunks: OutputChunk[] = execution.logs
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) =>
        parseLogLine(line, `init-${chunkCounter.current++}`, execution.startedAt),
      );

    setChunks(initialChunks);
  }, [execution?.logs, execution?.startedAt]);

  // Subscribe to live chunks from WebSocket
  useEffect(() => {
    const unsubscribe = subscribe("agent_output_chunk", (event) => {
      if (event.executionId !== executionId) return;

      const newChunk: OutputChunk = {
        id: `ws-${chunkCounter.current++}`,
        content: event.chunk,
        chunkType: event.chunkType,
        timestamp: event.timestamp,
      };

      setChunks((prev) => [...prev, newChunk]);

      if (scrollLocked) {
        setHasNewOutput(true);
      }
    });

    return unsubscribe;
  }, [executionId, scrollLocked]);

  // Auto-scroll to bottom when new chunks arrive (if not locked)
  useEffect(() => {
    if (!scrollLocked && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chunks.length, scrollLocked]);

  // Detect user scroll to auto-enable scroll lock
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (isAtBottom && scrollLocked) {
      setScrollLocked(false);
      setHasNewOutput(false);
    } else if (!isAtBottom && !scrollLocked) {
      setScrollLocked(true);
    }
  }, [scrollLocked]);

  // Scroll to bottom action
  const scrollToBottom = useCallback(() => {
    setScrollLocked(false);
    setHasNewOutput(false);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Group chunks into chat message groups
  const messageGroups = useMemo(() => groupIntoMessages(chunks), [chunks]);

  return (
    <div className="flex flex-col h-full">
      {/* Persona identity header */}
      {persona && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/50">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
            style={{ backgroundColor: persona.avatar.color }}
          >
            {persona.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">
                {persona.name}
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {MODEL_LABELS[persona.model] ?? persona.model}
              </Badge>
            </div>
            {workItem && (
              <p className="text-xs text-muted-foreground truncate">
                working on {workItem.title}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            {executionId}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {chunks.length} chunks
          </span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="gap-1"
          onClick={() => {
            setScrollLocked(!scrollLocked);
            if (scrollLocked) {
              setHasNewOutput(false);
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          {scrollLocked ? (
            <>
              <Lock className="h-3 w-3" />
              Scroll locked
            </>
          ) : (
            <>
              <Unlock className="h-3 w-3" />
              Auto-scroll
            </>
          )}
        </Button>
      </div>

      {/* Chat thread output */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-zinc-950 dark:bg-zinc-950 px-4 py-3 font-mono space-y-3"
      >
        {messageGroups.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">
            Waiting for agent output...
          </p>
        ) : (
          messageGroups.map((group) => (
            <MessageGroupRenderer key={group.id} group={group} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* New output indicator */}
      {hasNewOutput && scrollLocked && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <Button
            size="sm"
            className="h-7 text-xs gap-1 shadow-lg"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-3 w-3" />
            New output below
          </Button>
        </div>
      )}
    </div>
  );
}
