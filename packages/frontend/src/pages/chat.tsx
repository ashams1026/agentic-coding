import { useRef, useEffect, useState, useMemo } from "react";
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
  Bot,
  ClipboardList,
  GitBranch,
  Code,
  Eye,
  TestTube,
  Shield,
  Zap,
  Sparkles,
  Heart,
  Star,
  Flame,
  Target,
  Lightbulb,
  Filter,
  MoreVertical,
  Globe,
  Pencil,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { usePicoStore } from "@/features/pico/pico-store";
import { ChatMessage } from "@/features/pico/chat-message";
import { usePicoChat } from "@/hooks/use-pico-chat";
import { PersonaSelector } from "@/features/pico/persona-selector";
import type { ChatSessionId } from "@agentops/shared";
import type { ChatSessionWithPersona } from "@/api";

// ── Icon map (shared with persona-selector) ─────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  "clipboard-list": ClipboardList, "git-branch": GitBranch, code: Code, eye: Eye,
  "test-tube": TestTube, bot: Bot, shield: Shield, zap: Zap, sparkles: Sparkles,
  heart: Heart, star: Star, flame: Flame, target: Target, lightbulb: Lightbulb, dog: Dog,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Bot;
}

// ── Date grouping ───────────────────────────────────────────────

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= weekAgo) return "This Week";
  return "Older";
}

function groupSessionsByDate(sessions: ChatSessionWithPersona[]): { label: string; sessions: ChatSessionWithPersona[] }[] {
  const groups: Record<string, ChatSessionWithPersona[]> = {};
  const order = ["Today", "Yesterday", "This Week", "Older"];

  for (const s of sessions) {
    const group = getDateGroup(s.updatedAt);
    (groups[group] ??= []).push(s);
  }

  return order.filter((label) => groups[label]?.length).map((label) => ({ label, sessions: groups[label]! }));
}

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
    deleteSession,
    clearAllSessions,
    retry,
  } = usePicoChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persona selector modal
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);

  // Persona filter for sidebar
  const [personaFilter, setPersonaFilter] = useState<string | null>(null);
  const [showPersonaFilter, setShowPersonaFilter] = useState(false);

  // Filtered and grouped sessions
  const filteredSessions = useMemo(() => {
    if (!personaFilter) return sessions;
    return sessions.filter((s) => s.personaId === personaFilter);
  }, [sessions, personaFilter]);

  const groupedSessions = useMemo(() => groupSessionsByDate(filteredSessions), [filteredSessions]);

  // Unique persona names for the filter dropdown
  const personaNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sessions) {
      if (s.personaId && s.persona?.name) {
        map.set(s.personaId, s.persona.name);
      }
    }
    return Array.from(map.entries()); // [personaId, name][]
  }, [sessions]);

  // Header context menu
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // Editable title (used in both sidebar and header)
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
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Chat</span>
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

        {/* Persona filter */}
        {personaNames.length > 1 && (
          <div className="px-2 py-1.5 border-b border-border">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPersonaFilter(!showPersonaFilter)}
                className={cn(
                  "flex items-center gap-1.5 w-full rounded-md px-2 py-1 text-xs transition-colors",
                  personaFilter ? "text-foreground bg-muted" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Filter className="h-3 w-3" />
                {personaFilter ? personaNames.find(([id]) => id === personaFilter)?.[1] ?? "Filter" : "All personas"}
              </button>
              {showPersonaFilter && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-10 py-1">
                  <button
                    type="button"
                    onClick={() => { setPersonaFilter(null); setShowPersonaFilter(false); }}
                    className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-muted", !personaFilter && "font-medium")}
                  >
                    All personas
                  </button>
                  {personaNames.map(([id, name]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setPersonaFilter(id); setShowPersonaFilter(false); }}
                      className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-muted", personaFilter === id && "font-medium")}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-0.5 p-2">
            {filteredSessions.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground text-center">
                {personaFilter ? "No conversations with this persona" : "No conversations yet"}
              </p>
            )}
            {groupedSessions.map((group) => (
              <div key={group.label}>
                <p className="px-2 pt-2 pb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </p>
                {group.sessions.map((s) => {
                  const avatar = s.persona?.avatar;
                  const color = avatar?.color ?? "#6b7280";
                  const Icon = getIcon(avatar?.icon ?? "bot");

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => switchSession(s.id as ChatSessionId)}
                      onDoubleClick={() => startRename(s.id, s.title)}
                      className={cn(
                        "flex items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors w-full",
                        "hover:bg-muted",
                        s.id === currentSession?.id
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {/* Persona avatar */}
                      <div
                        className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: color + "20" }}
                      >
                        <Icon className="h-3 w-3" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
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
                            className="w-full rounded border border-input bg-transparent px-1 py-0.5 text-xs outline-none focus-visible:border-ring"
                            maxLength={100}
                          />
                        ) : (
                          <>
                            <span className={cn("block truncate text-xs", s.id === currentSession?.id && "font-medium")}>
                              {s.title}
                            </span>
                            {s.lastMessagePreview && (
                              <span className="block truncate text-[10px] text-muted-foreground mt-0.5">
                                {s.lastMessagePreview}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
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
        {/* Chat header bar */}
        {currentSession && (() => {
          const cs = currentSession;
          const avatar = cs.persona?.avatar;
          const color = avatar?.color ?? "#6b7280";
          const HeaderIcon = getIcon(avatar?.icon ?? "bot");
          const isEditingHeader = editingSessionId === cs.id;

          return (
            <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 bg-card shrink-0">
              {/* Persona avatar + name */}
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: color + "20" }}
              >
                <HeaderIcon className="h-4 w-4" style={{ color }} />
              </div>
              <span className="text-sm font-medium text-muted-foreground shrink-0">
                {cs.persona?.name ?? "Pico"}
              </span>

              {/* Divider */}
              <div className="h-4 w-px bg-border shrink-0" />

              {/* Project badge */}
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 flex items-center gap-1">
                {cs.projectId ? (
                  <>{cs.projectId}</>
                ) : (
                  <><Globe className="h-3 w-3" /> Global</>
                )}
              </span>

              {/* Editable session title */}
              <div className="flex-1 min-w-0">
                {isEditingHeader ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={saveRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); saveRename(); }
                      if (e.key === "Escape") setEditingSessionId(null);
                    }}
                    autoFocus
                    className="w-full rounded border border-input bg-transparent px-2 py-0.5 text-sm outline-none focus-visible:border-ring"
                    maxLength={100}
                  />
                ) : (
                  <span
                    className="block truncate text-sm cursor-pointer hover:text-foreground text-muted-foreground"
                    onDoubleClick={() => startRename(cs.id, cs.title)}
                    title="Double-click to rename"
                  >
                    {cs.title}
                  </span>
                )}
              </div>

              {/* Context menu */}
              <div className="relative shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                {showHeaderMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg z-10 py-1 w-36">
                    <button
                      type="button"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        startRename(cs.id, cs.title);
                      }}
                      className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      <Pencil className="h-3 w-3" />
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        deleteSession(cs.id as ChatSessionId);
                      }}
                      className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete session
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

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
