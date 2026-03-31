import { useRef, useEffect, useState } from "react";
import {
  Dog,
  X,
  Plus,
  Send,
  AlertCircle,
  RotateCcw,
  Loader2,
  ChevronDown,
  MessageSquare,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePicoStore } from "./pico-store";
import { ChatMessage } from "./chat-message";
import { usePicoChat } from "@/hooks/use-pico-chat";
import type { ChatSessionId } from "@agentops/shared";

// ── Component ─────────────────────────────────────────────────────

export function ChatPanel() {
  const { isOpen, setOpen } = usePicoStore();
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
  const panelRef = useRef<HTMLDivElement>(null);

  // Editable title state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

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
      // Don't close if clicking a dropdown menu
      if (target.closest("[data-slot='dropdown-menu-content']")) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, setOpen]);

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

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

  const handleTitleClick = () => {
    if (!currentSession) return;
    setEditTitle(currentSession.title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (!currentSession || !editTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    renameSession(currentSession.id as ChatSessionId, editTitle.trim());
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSave();
    }
    if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  const sessionTitle = currentSession?.title ?? "New conversation";
  const recentSessions = sessions.slice(0, 10);

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
          {isEditingTitle ? (
            <span className="ml-2 inline-flex items-center gap-1">
              <input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleTitleSave}
                className="w-32 rounded border border-input bg-transparent px-1 py-0.5 text-xs outline-none focus-visible:border-ring"
                maxLength={100}
              />
              <button
                type="button"
                onClick={handleTitleSave}
                className="rounded p-0.5 hover:bg-muted"
              >
                <Check className="h-3 w-3 text-muted-foreground" />
              </button>
            </span>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="ml-2 inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors max-w-[180px]"
                >
                  <span className="truncate">{sessionTitle}</span>
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-64"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {recentSessions.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No conversations yet
                  </div>
                )}
                {recentSessions.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => switchSession(s.id as ChatSessionId)}
                    className={cn(
                      "flex items-center gap-2 text-xs",
                      s.id === currentSession?.id && "bg-accent",
                    )}
                  >
                    <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{s.title}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatSessionDate(s.updatedAt)}
                    </span>
                  </DropdownMenuItem>
                ))}
                {recentSessions.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleTitleClick}
                      className="text-xs"
                      disabled={!currentSession}
                    >
                      Rename current chat
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={clearAllSessions}
                      className="text-xs text-red-400 focus:text-red-400"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear all sessions
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => newSession()}
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
        <div className="flex flex-col p-4">
          {isLoadingHistory && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full mb-3"
                style={{ backgroundColor: "#f59e0b" }}
              >
                <Dog className="h-7 w-7 text-white" />
              </div>
              <p className="text-sm font-medium">Woof! I'm Pico</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-[280px]">
                Your project assistant. Ask me anything about the project, or
                let me help you manage work items.
              </p>
            </div>
          )}
          {messages.map((msg, i) => {
            const prev = i > 0 ? messages[i - 1] : null;
            const showAvatar = !prev || prev.role !== msg.role;
            return (
              <div
                key={msg.id}
                className={i === 0 ? "" : showAvatar ? "mt-3" : "mt-1"}
              >
                <ChatMessage message={msg} showAvatar={showAvatar} />
              </div>
            );
          })}
          {isStreaming && messages[messages.length - 1]?.content.length === 0 && (
            <div className="mt-1">
              <TypingIndicator />
            </div>
          )}
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-400">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-6 px-2 text-xs text-red-400 hover:text-red-300"
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

// ── Helpers ───────────────────────────────────────────────────────

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
