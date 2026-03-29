import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockWs } from "@/mocks/ws";
import { useExecution } from "@/hooks";
import type { ExecutionId, AgentOutputChunkEvent } from "@agentops/shared";

// ── Chunk types ────────────────────────────────────────────────

interface OutputChunk {
  id: string;
  content: string;
  chunkType: AgentOutputChunkEvent["chunkType"];
  timestamp: string;
}

// ── Syntax-highlighted code block ──────────────────────────────

function CodeBlock({ content }: { content: string }) {
  // Lightweight keyword highlighting for common languages
  const highlighted = content.replace(
    /\b(function|const|let|var|return|if|else|for|while|import|export|from|class|interface|type|async|await|try|catch|throw|new|this|null|undefined|true|false)\b/g,
    '<span class="text-purple-400">$1</span>',
  );

  return (
    <div className="my-1.5 rounded-md border bg-zinc-950 dark:bg-zinc-900 px-3 py-2 overflow-x-auto">
      <pre
        className="text-xs text-emerald-300 dark:text-emerald-400"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  );
}

// ── Thinking block ─────────────────────────────────────────────

function ThinkingBlock({ content }: { content: string }) {
  return (
    <div className="my-1 px-3 py-1 border-l-2 border-muted-foreground/30">
      <p className="text-xs italic text-muted-foreground whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}

// ── Text block ─────────────────────────────────────────────────

function TextBlock({ content }: { content: string }) {
  return (
    <pre className="text-sm whitespace-pre-wrap break-words">
      {content}
    </pre>
  );
}

// ── Chunk renderer ─────────────────────────────────────────────

function ChunkRenderer({ chunk }: { chunk: OutputChunk }) {
  switch (chunk.chunkType) {
    case "code":
      return <CodeBlock content={chunk.content} />;
    case "thinking":
      return <ThinkingBlock content={chunk.content} />;
    case "tool_call":
    case "tool_result":
      // T2.5.4 will build proper tool call display — render as code for now
      return <CodeBlock content={chunk.content} />;
    case "text":
    default:
      return <TextBlock content={chunk.content} />;
  }
}

// ── Main component ─────────────────────────────────────────────

interface TerminalRendererProps {
  executionId: ExecutionId;
}

export function TerminalRenderer({ executionId }: TerminalRendererProps) {
  const { data: execution } = useExecution(executionId);
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
      .map((line) => ({
        id: `init-${chunkCounter.current++}`,
        content: line,
        chunkType: "text" as const,
        timestamp: execution.startedAt,
      }));

    setChunks(initialChunks);
  }, [execution?.logs, execution?.startedAt]);

  // Subscribe to live chunks from WebSocket
  useEffect(() => {
    const unsubscribe = mockWs.subscribe("agent_output_chunk", (event) => {
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

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono">
            {executionId}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {chunks.length} chunks
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] gap-1"
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

      {/* Terminal output */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-zinc-950 dark:bg-zinc-950 px-4 py-3 font-mono text-zinc-200"
      >
        {chunks.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">
            Waiting for agent output...
          </p>
        ) : (
          chunks.map((chunk) => (
            <ChunkRenderer key={chunk.id} chunk={chunk} />
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
