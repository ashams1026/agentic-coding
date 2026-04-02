import { useRef, useEffect, useState } from "react";
import {
  Dog,
  Plus,
  Send,
  AlertCircle,
  RotateCcw,
  Loader2,
  MessageSquare,
  Trash2,
  Minimize2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { usePicoStore } from "@/features/pico/pico-store";
import { ChatMessage } from "@/features/pico/chat-message";
import { usePicoChat } from "@/hooks/use-pico-chat";
import { PersonaSelector } from "@/features/pico/persona-selector";
import type { ChatSessionId } from "@agentops/shared";

export function ChatPage() {
  const navigate = useNavigate();
  const { setOpen } = usePicoStore();
  const [input, setInput] = useState("");
  const {
    messages,
    sessions,
    currentSession,
    isStreaming,
    isLoadingHistory,
    error,
    sendMessage,
    newSession,
    switchSession,
    renameSession,
    clearAllSessions,
    retry,
  } = usePicoChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persona selector modal
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);

  // Editable title
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMinimize = () => {
    setOpen(true);
    navigate(-1);
  };

  const startRename = (sessionId: string, title: string) => {
    setEditingSessionId(sessionId);
    setEditTitle(title);
  };

  const saveRename = () => {
    if (editingSessionId && editTitle.trim()) {
      renameSession(editingSessionId as ChatSessionId, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  return (
    <div className="flex h-full">
      {/* Session sidebar */}
      <div className="w-64 border-r border-border flex flex-col bg-card shrink-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "#f59e0b" }}
            >
              <Dog className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Pico Chat</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowPersonaSelector(true)}
              title="New chat with persona"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleMinimize}
              title="Minimize to overlay"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-0.5 p-2">
            {sessions.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground text-center">
                No conversations yet
              </p>
            )}
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => switchSession(s.id as ChatSessionId)}
                onDoubleClick={() => startRename(s.id, s.title)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors w-full",
                  "hover:bg-muted",
                  s.id === currentSession?.id
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                {editingSessionId === s.id ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={saveRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); saveRename(); }
                      if (e.key === "Escape") setEditingSessionId(null);
                    }}
                    autoFocus
                    className="flex-1 min-w-0 rounded border border-input bg-transparent px-1 py-0.5 text-xs outline-none focus-visible:border-ring"
                    maxLength={100}
                  />
                ) : (
                  <span className="flex-1 truncate text-xs">{s.title}</span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        {sessions.length > 0 && (
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={clearAllSessions}
              className="flex items-center gap-1.5 w-full rounded-md px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Clear all sessions
            </button>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="max-w-3xl mx-auto px-6 py-4">
            {isLoadingHistory && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoadingHistory && messages.length === 0 && (
              <div className="flex flex-col items-center py-16 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full mb-4"
                  style={{ backgroundColor: "#f59e0b" }}
                >
                  <Dog className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-lg font-semibold">Woof! I'm Pico</h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  Your project assistant. I know everything about this project
                  — the architecture, the workflow, all the agents. Ask me
                  anything, or I can help you manage work items.
                </p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isEmptyStreaming =
                isStreaming &&
                i === messages.length - 1 &&
                msg.content.length === 0;
              if (isEmptyStreaming) return null;

              const prev = i > 0 ? messages[i - 1] : null;
              const showAvatar = !prev || prev.role !== msg.role;
              return (
                <div
                  key={msg.id}
                  className={i === 0 ? "" : showAvatar ? "mt-4" : "mt-1.5"}
                >
                  <ChatMessage
                    message={msg}
                    showAvatar={showAvatar}
                    compact={false}
                  />
                </div>
              );
            })}
            {isStreaming && messages[messages.length - 1]?.content.length === 0 && (
              <div className="mt-4">
                <TypingIndicator />
              </div>
            )}
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-red-400">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-7 px-2 text-xs text-red-400 hover:text-red-300"
                    onClick={retry}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto flex items-end gap-3">
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
                "px-4 py-3 text-sm outline-none",
                "placeholder:text-muted-foreground",
                "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:opacity-50",
              )}
            />
            <Button
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground text-center">
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

      {/* Persona selector modal */}
      {showPersonaSelector && (
        <PersonaSelector
          onSelect={(personaId) => {
            setShowPersonaSelector(false);
            newSession(personaId);
          }}
          onClose={() => setShowPersonaSelector(false)}
        />
      )}
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────

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
