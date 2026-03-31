import { useRef, useEffect, useState } from "react";
import { Dog, X, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { usePicoStore } from "./pico-store";

// ── Mock messages for UI development — PICO.8 will wire real data ──

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Woof! I'm Pico, your project assistant. I know everything about this project — the architecture, the workflow, all the agents. What can I help with?",
    timestamp: new Date(Date.now() - 120_000),
  },
  {
    id: "2",
    role: "user",
    content: "What's the current project status?",
    timestamp: new Date(Date.now() - 60_000),
  },
  {
    id: "3",
    role: "assistant",
    content:
      "Let me dig into that! The project has 5 active work items, 2 agents running, and all builds are passing. The current sprint is focused on the Pico chat interface — that's me!",
    timestamp: new Date(Date.now() - 30_000),
  },
];

// ── Component ─────────────────────────────────────────────────────

export function ChatPanel() {
  const { isOpen, setOpen } = usePicoStore();
  const [input, setInput] = useState("");
  const [isStreaming] = useState(false); // PICO.8 will control this
  const [messages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Click outside to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking the chat bubble (it has its own toggle)
      if (target.closest("[aria-label*='Pico']")) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, setOpen]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    // PICO.8 will wire this to the streaming API
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed bottom-24 right-6 z-50 flex flex-col",
        "w-[400px] max-w-[calc(100vw-3rem)]",
        "rounded-xl border border-border bg-card shadow-lg",
        "animate-pico-panel-in",
      )}
      style={{ height: "min(500px, calc(100vh - 8rem))" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "#f59e0b" }}
        >
          <Dog className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold">Pico</span>
          <span className="ml-2 text-xs text-muted-foreground truncate">
            New conversation
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => {
            /* PICO.9 will implement new session */
          }}
          title="New session"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setOpen(false)}
          title="Minimize"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                msg.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto bg-muted text-foreground",
              )}
            >
              {msg.content}
            </div>
          ))}
          {isStreaming && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Pico anything..."
            disabled={isStreaming}
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-lg border border-input bg-transparent",
              "px-3 py-2 text-sm outline-none",
              "placeholder:text-muted-foreground",
              "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:opacity-50",
            )}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          <kbd className="rounded border bg-muted px-1 py-0.5 text-xs">
            ⌘
          </kbd>
          <kbd className="ml-0.5 rounded border bg-muted px-1 py-0.5 text-xs">
            ↵
          </kbd>
          <span className="ml-1">to send</span>
        </p>
      </div>
    </div>
  );
}

// ── Typing indicator (three bouncing dots) ────────────────────────

function TypingIndicator() {
  return (
    <div className="mr-auto flex items-center gap-1 rounded-lg bg-muted px-3 py-2">
      <span
        className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pico-dot"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pico-dot"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pico-dot"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}
