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
  MoreVertical,
  Globe,
  Pencil,
  ChevronDown,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
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
import { usePicoStore } from "@/features/pico/pico-store";
import { ChatMessage } from "@/features/pico/chat-message";
import { usePicoChat } from "@/hooks/use-pico-chat";
import { useAgents, useProjects } from "@/hooks";
import { useUIStore } from "@/stores/ui-store";
import { AgentSelector } from "@/features/pico/agent-selector";
import type { ChatSessionId } from "@agentops/shared";
import type { ChatSessionWithAgent } from "@/api";

// ── Icon map (shared with agent-selector) ─────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  "clipboard-list": ClipboardList, "git-branch": GitBranch, code: Code, eye: Eye,
  "test-tube": TestTube, bot: Bot, shield: Shield, zap: Zap, sparkles: Sparkles,
  heart: Heart, star: Star, flame: Flame, target: Target, lightbulb: Lightbulb, dog: Dog,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Bot;
}

// ── Agent grouping ───────────────────────────────────────────────

interface AgentGroup {
  agentId: string | null;
  agentName: string;
  agentAvatar: { color: string; icon: string } | null;
  sessions: ChatSessionWithAgent[];
}

function groupSessionsByAgent(sessions: ChatSessionWithAgent[]): AgentGroup[] {
  const groupMap = new Map<string, AgentGroup>();

  for (const s of sessions) {
    const key = s.agentId ?? "__pico__";
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        agentId: s.agentId ?? null,
        agentName: s.agent?.name ?? "Pico",
        agentAvatar: s.agent?.avatar ?? null,
        sessions: [],
      });
    }
    groupMap.get(key)!.sessions.push(s);
  }

  // Sort sessions within each group by recency (most recent first)
  for (const group of groupMap.values()) {
    group.sessions.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  // Sort groups by the most recent session in each group
  return Array.from(groupMap.values()).sort(
    (a, b) =>
      new Date(b.sessions[0]!.updatedAt).getTime() -
      new Date(a.sessions[0]!.updatedAt).getTime(),
  );
}

export function ChatPage() {
  const navigate = useNavigate();
  const selectedProjectId = useUIStore((s) => s.selectedProjectId);
  const { setOpen, selectedAgentId } = usePicoStore();
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

  // Agent selector modal
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  // Agents list for dynamic empty state
  const { data: agents = [] } = useAgents();
  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) return null;
    return agents.find((a) => a.id === selectedAgentId) ?? null;
  }, [agents, selectedAgentId]);
  const isPico = !selectedAgent || selectedAgent.name === "Pico";

  // Project name lookup
  const { data: projects = [] } = useProjects();
  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) map.set(p.id, p.name);
    return map;
  }, [projects]);

  // Agent-based grouped sessions
  const groupedSessions = useMemo(() => groupSessionsByAgent(sessions), [sessions]);

  // Collapse state: set of agentId keys that are collapsed (default: all expanded)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Sidebar right-click context menu
  const [contextMenu, setContextMenu] = useState<{ sessionId: string; title: string; x: number; y: number } | null>(null);

  // Delete confirmation dialog
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  // Resolve empty-state avatar
  const emptyStateIcon = isPico ? Dog : getIcon(selectedAgent!.avatar.icon);
  const emptyStateColor = isPico ? "#f59e0b" : selectedAgent!.avatar.color;
  const emptyStateName = isPico ? "Woof! I'm Pico" : selectedAgent!.name;
  const emptyStateDesc = isPico
    ? "Your project assistant. I know everything about this project \u2014 the architecture, the workflow, all the agents. Ask me anything, or I can help you manage work items."
    : selectedAgent!.description;

  // Guard: no project selected yet
  if (!selectedProjectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No project selected</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
            Select a project from the sidebar to start chatting with your agents.
          </p>
          <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => navigate("/settings")}>
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Session sidebar */}
      <div className="w-60 border-r border-border flex flex-col bg-card shrink-0">
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
              onClick={() => setShowAgentSelector(true)}
              title="New chat with agent"
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
          <div className="flex flex-col p-2">
            {sessions.length === 0 && (
              <div className="flex flex-col items-center py-6 text-center px-2">
                <MessageSquare className="h-7 w-7 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium text-muted-foreground">No conversations yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Start a new chat to get going.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1 text-xs h-7"
                  onClick={() => setShowAgentSelector(true)}
                >
                  <Plus className="h-3 w-3" />
                  New Chat
                </Button>
              </div>
            )}
            {groupedSessions.map((group) => {
              const groupKey = group.agentId ?? "__pico__";
              const isCollapsed = collapsedGroups.has(groupKey);
              const groupColor = group.agentAvatar?.color ?? "#f59e0b";
              const GroupIcon = group.agentAvatar?.icon
                ? getIcon(group.agentAvatar.icon)
                : Dog;

              return (
                <div key={groupKey} className="mb-1">
                  {/* Group header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupKey)}
                    className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 hover:bg-muted transition-colors group"
                  >
                    {/* Agent avatar */}
                    <div
                      className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: groupColor + "25" }}
                    >
                      <GroupIcon className="h-3 w-3" style={{ color: groupColor }} />
                    </div>
                    {/* Agent name */}
                    <span className="flex-1 text-left text-xs font-medium text-foreground truncate">
                      {group.agentName}
                    </span>
                    {/* Session count badge */}
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {group.sessions.length}
                    </span>
                    {/* Collapse caret */}
                    {isCollapsed ? (
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {/* Sessions list */}
                  {!isCollapsed && (
                    <div className="flex flex-col gap-0.5 mt-0.5 pl-2">
                      {group.sessions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => switchSession(s.id as ChatSessionId)}
                          onDoubleClick={() => startRename(s.id, s.title)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ sessionId: s.id, title: s.title, x: e.clientX, y: e.clientY });
                          }}
                          className={cn(
                            "flex items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors w-full",
                            "hover:bg-muted",
                            s.id === currentSession?.id
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          <MessageSquare className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground/60" />
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
                                <span className={cn("block truncate text-xs", s.id === currentSession?.id && "font-medium text-foreground")}>
                                  {s.title}
                                </span>
                                {s.lastMessagePreview && (
                                  <span className="block truncate text-[10px] text-muted-foreground/70 mt-0.5">
                                    {s.lastMessagePreview}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
          const avatar = cs.agent?.avatar;
          const color = avatar?.color ?? "#6b7280";
          const HeaderIcon = getIcon(avatar?.icon ?? "bot");
          const isEditingHeader = editingSessionId === cs.id;
          const agentName = cs.agent?.name ?? "Pico";
          const projectName = cs.projectId
            ? (projectNameMap.get(cs.projectId) ?? cs.projectId)
            : "Global";

          return (
            <div
              className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card shrink-0"
              style={{ borderBottomColor: color + "40" }}
            >
              {/* Agent identity block — dominant left element */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Avatar — larger, colored background */}
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: color + "22", boxShadow: `0 0 0 2px ${color}33` }}
                >
                  <HeaderIcon className="h-5 w-5" style={{ color }} />
                </div>
                {/* Agent name + project */}
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-semibold leading-tight text-foreground">
                    {agentName}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    {(!cs.projectId || cs.projectId === "pj-global") ? <Globe className="h-3 w-3 shrink-0" /> : null}
                    {projectName}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-border shrink-0" />

              {/* Editable session title — center region */}
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
                    className="w-full rounded border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
                    maxLength={100}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startRename(cs.id, cs.title)}
                    className="flex items-center gap-1.5 group text-left w-full min-w-0"
                    title="Click to rename"
                  >
                    <span className="block truncate text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {cs.title}
                    </span>
                    <Pencil className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                  </button>
                )}
              </div>

              {/* Context menu */}
              <div className="shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() => startRename(cs.id, cs.title)}
                      className="text-xs gap-2"
                    >
                      <Pencil className="h-3 w-3" />
                      Rename session
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteConfirmId(cs.id)}
                      className="text-xs gap-2 text-red-400 focus:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
            {!isLoadingHistory && messages.length === 0 && (() => {
              const EmptyIcon = emptyStateIcon;
              return (
                <div className="flex flex-col items-center py-16 text-center">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full mb-4"
                    style={{ backgroundColor: emptyStateColor }}
                  >
                    <EmptyIcon className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold">{emptyStateName}</h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md">
                    {emptyStateDesc}
                  </p>
                </div>
              );
            })()}
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
              placeholder={isPico ? "Ask Pico anything..." : `Ask ${selectedAgent!.name} anything...`}
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

      {/* Sidebar right-click context menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
        >
          <div
            className="absolute bg-popover border border-border rounded-md shadow-lg py-1 w-36"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                startRename(contextMenu.sessionId, contextMenu.title);
                setContextMenu(null);
              }}
              className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs hover:bg-muted"
            >
              <Pencil className="h-3 w-3" />
              Rename
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmId(contextMenu.sessionId);
                setContextMenu(null);
              }}
              className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-card border border-border rounded-lg shadow-xl p-5 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold">Delete session?</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  deleteSession(deleteConfirmId as ChatSessionId);
                  setDeleteConfirmId(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Agent selector modal */}
      {showAgentSelector && (
        <AgentSelector
          onSelect={(agentId) => {
            setShowAgentSelector(false);
            newSession(agentId);
          }}
          onClose={() => setShowAgentSelector(false)}
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
