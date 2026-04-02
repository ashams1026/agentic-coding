import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  Dog,
  Plus,
  Send,
  AlertCircle,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Trash2,
  Check,
  BarChart3,
  GitBranch,
  Activity,
  PenLine,
  Maximize2,
  Bot,
  ClipboardList,
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
  Globe,
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
import { usePicoStore } from "./pico-store";
import { ChatMessage } from "./chat-message";
import { usePicoChat } from "@/hooks/use-pico-chat";
import { useAgents, useProjects, useProjectFromUrl } from "@/hooks";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChatSessionId } from "@agentops/shared";
import type { ChatSessionWithAgent } from "@/api";

// ── Icon map ──────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  "clipboard-list": ClipboardList, "git-branch": GitBranch, code: Code, eye: Eye,
  "test-tube": TestTube, bot: Bot, shield: Shield, zap: Zap, sparkles: Sparkles,
  heart: Heart, star: Star, flame: Flame, target: Target, lightbulb: Lightbulb, dog: Dog,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Bot;
}

// ── Agent grouping ────────────────────────────────────────────────

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

  for (const group of groupMap.values()) {
    group.sessions.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  return Array.from(groupMap.values()).sort(
    (a, b) =>
      new Date(b.sessions[0]!.updatedAt).getTime() -
      new Date(a.sessions[0]!.updatedAt).getTime(),
  );
}

// ── Component ─────────────────────────────────────────────────────

export function ChatPanel() {
  const { isOpen, setOpen, panelWidth, panelHeight, setPanelSize, scopeOverride, setScopeOverride, selectedAgentId, setSelectedAgentId } = usePicoStore();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const { data: agents = [] } = useAgents();
  const { data: projectsList = [] } = useProjects();
  const { projectId: urlProjectId, project: urlProject } = useProjectFromUrl();
  const selectedProjectId = urlProjectId ?? "pj-global";
  const selectedProject = urlProject ?? projectsList.find((p) => p.id === selectedProjectId) ?? null;
  const {
    messages,
    sessions,
    currentSession,
    isStreaming,
    isLoadingHistory,
    error,
    suggestions,
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
  const panelRef = useRef<HTMLDivElement>(null);

  // Resolve selected agent for dynamic empty state
  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) return null;
    return agents.find((a) => a.id === selectedAgentId) ?? null;
  }, [agents, selectedAgentId]);
  const isPico = !selectedAgent || selectedAgent.name === "Pico";

  // ── Resize logic ───────────────────────────────────────────────
  const MIN_W = 320;
  const MAX_W = 600;
  const MIN_H = 400;
  const maxH = typeof window !== "undefined" ? window.innerHeight * 0.8 : 600;
  const [isResizing, setIsResizing] = useState(false);

  const handleResizeStart = useCallback(
    (edge: "top" | "left" | "top-left") => (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = panelWidth;
      const startH = panelHeight;
      setIsResizing(true);

      const onMove = (ev: MouseEvent) => {
        let newW = startW;
        let newH = startH;
        if (edge === "left" || edge === "top-left") {
          // Dragging left edge leftward → panel grows wider
          newW = Math.min(MAX_W, Math.max(MIN_W, startW + (startX - ev.clientX)));
        }
        if (edge === "top" || edge === "top-left") {
          // Dragging top edge upward → panel grows taller
          newH = Math.min(maxH, Math.max(MIN_H, startH + (startY - ev.clientY)));
        }
        setPanelSize(newW, newH);
      };

      const onUp = () => {
        setIsResizing(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [panelWidth, panelHeight, setPanelSize, maxH],
  );

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

  // Agent-grouped sessions for the session dropdown
  const groupedSessions = useMemo(() => groupSessionsByAgent(sessions), [sessions]);

  // Collapse state for agent groups inside the dropdown (default: all expanded)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Resolve empty-state avatar
  const emptyStateIcon = isPico ? Dog : getIcon(selectedAgent!.avatar.icon);
  const emptyStateColor = isPico ? "#f59e0b" : selectedAgent!.avatar.color;
  const emptyStateName = isPico ? "Woof! I'm Pico" : selectedAgent!.name;
  const emptyStateDesc = isPico
    ? "Your project assistant. I know everything about this project \u2014 the architecture, the workflow, all the agents. Ask me anything, or I can help you manage work items."
    : selectedAgent!.description;

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed bottom-24 right-6 z-50 flex flex-col",
        "max-w-[calc(100vw-3rem)]",
        "rounded-xl border border-border bg-card shadow-lg",
        !isResizing && "animate-pico-panel-in",
      )}
      style={{
        width: `${panelWidth}px`,
        height: `min(${panelHeight}px, calc(100vh - 8rem))`,
      }}
    >
      {/* Resize handles */}
      <div
        className="absolute -top-1 left-3 right-3 h-2 cursor-ns-resize z-10"
        onMouseDown={handleResizeStart("top")}
      />
      <div
        className="absolute -left-1 top-3 bottom-3 w-2 cursor-ew-resize z-10"
        onMouseDown={handleResizeStart("left")}
      />
      <div
        className="absolute -top-1 -left-1 h-4 w-4 cursor-nwse-resize z-20"
        onMouseDown={handleResizeStart("top-left")}
      />
      {/* Header */}
      {(() => {
        const agentAvatar = selectedAgent?.avatar ?? null;
        const agentColor = agentAvatar?.color ?? "#f59e0b";
        const PanelIcon = agentAvatar?.icon ? getIcon(agentAvatar.icon) : Dog;
        const agentName = selectedAgent?.name ?? "Pico";

        // Resolve the project name shown in the header based on scopeOverride
        const resolvedProjectName = (() => {
          if (scopeOverride === "__global__") return "Global";
          if (scopeOverride && scopeOverride !== "__follow__") {
            return projectsList.find((p) => p.id === scopeOverride)?.name ?? scopeOverride;
          }
          // Follows sidebar
          return selectedProject?.name ?? null;
        })();
        const isGlobalScope = scopeOverride === "__global__" || (!scopeOverride && selectedProject?.isGlobal);

        return (
          <div
            className="flex items-center gap-2 border-b border-border px-3 py-2.5 shrink-0"
            style={{ borderBottomColor: agentColor + "40" }}
          >
            {/* Agent avatar — reflects actual selected agent */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: agentColor + "22",
                boxShadow: `0 0 0 2px ${agentColor}33`,
              }}
            >
              <PanelIcon className="h-4 w-4" style={{ color: agentColor }} />
            </div>

            {/* Agent name + project name + editable session title */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-tight text-foreground truncate">
                {agentName}
              </div>
              {resolvedProjectName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground leading-tight mt-0.5">
                  {isGlobalScope && <Globe className="h-2.5 w-2.5 shrink-0" />}
                  <span className="truncate">{resolvedProjectName}</span>
                </div>
              )}
              {isEditingTitle ? (
                <span className="inline-flex items-center gap-1 mt-0.5">
                  <input
                    ref={titleInputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleTitleSave}
                    className="w-28 rounded border border-input bg-transparent px-1 py-0 text-[11px] outline-none focus-visible:border-ring"
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
                <button
                  type="button"
                  onClick={handleTitleClick}
                  disabled={!currentSession}
                  className="group flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none max-w-full"
                  title="Click to rename"
                >
                  <span className="truncate max-w-[140px]">{sessionTitle}</span>
                  <PenLine className="h-2.5 w-2.5 shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors" />
                </button>
              )}
            </div>

            {/* Actions */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => newSession()}
              title="New session"
            >
              <Plus className="h-4 w-4" />
            </Button>

            {/* Session dropdown — history + manage */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  title="Session history"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {sessions.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No conversations yet
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
                    <div key={groupKey}>
                      {/* Agent group header */}
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupKey)}
                        className="flex items-center gap-1.5 w-full rounded-sm px-2 py-1 hover:bg-accent transition-colors"
                      >
                        <div
                          className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: groupColor + "25" }}
                        >
                          <GroupIcon className="h-2.5 w-2.5" style={{ color: groupColor }} />
                        </div>
                        <span className="flex-1 text-left text-xs font-medium text-foreground truncate">
                          {group.agentName}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {group.sessions.length}
                        </span>
                        {isCollapsed ? (
                          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                      </button>

                      {/* Sessions under this group */}
                      {!isCollapsed && group.sessions.map((s) => (
                        <DropdownMenuItem
                          key={s.id}
                          onClick={() => switchSession(s.id as ChatSessionId)}
                          className={cn(
                            "flex items-center gap-2 text-xs pl-6",
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
                    </div>
                  );
                })}
                {sessions.length > 0 && (
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
                      onClick={() => currentSession && deleteSession(currentSession.id as ChatSessionId)}
                      className="text-xs text-red-400 focus:text-red-400"
                      disabled={!currentSession}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete session
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => { setOpen(false); navigate("/chat"); }}
              title="Expand to full page"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setOpen(false)}
              title="Minimize"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        );
      })()}

      {/* Scope & Agent bar */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 bg-muted/30">
        <Select
          value={scopeOverride ?? "__follow__"}
          onValueChange={(v) => {
            const newScope = v === "__follow__" ? null : v;
            setScopeOverride(newScope);
            newSession();
          }}
        >
          <SelectTrigger className="h-6 w-[120px] text-[11px] border-none bg-transparent shadow-none px-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__follow__">Follows sidebar</SelectItem>
            <SelectItem value="__global__">Global</SelectItem>
            {projectsList.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedAgentId ?? "__pico__"}
          onValueChange={(v) => {
            const newAgent = v === "__pico__" ? null : v;
            setSelectedAgentId(newAgent);
            newSession();
          }}
        >
          <SelectTrigger className="h-6 w-[100px] text-[11px] border-none bg-transparent shadow-none px-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__pico__">Pico</SelectItem>
            {agents.filter((p) => p.name !== "Pico").map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(scopeOverride || selectedAgentId) && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal ml-auto">
            {scopeOverride === "__global__" ? "Global" : scopeOverride ? "Project" : ""}
            {scopeOverride && selectedAgentId ? " · " : ""}
            {selectedAgentId ? agents.find((p) => p.id === selectedAgentId)?.name ?? "" : ""}
          </Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col p-4 w-0 min-w-full overflow-hidden">
          {isLoadingHistory && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoadingHistory && messages.length === 0 && (() => {
            const EmptyIcon = emptyStateIcon;
            return (
              <div className="flex flex-col items-center py-6 text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full mb-3"
                  style={{ backgroundColor: emptyStateColor }}
                >
                  <EmptyIcon className="h-7 w-7 text-white" />
                </div>
                <p className="text-sm font-medium">{emptyStateName}</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-[300px]">
                  {emptyStateDesc}
                </p>
                <div className="mt-4 flex flex-col gap-2 w-full max-w-[300px]">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => sendMessage(action.label)}
                      disabled={isStreaming}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-left text-xs",
                        "hover:bg-muted hover:border-muted-foreground/30 transition-colors",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                      )}
                    >
                      <action.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
          {messages.map((msg, i) => {
            // Skip rendering the last message if it has no content yet (streaming)
            // — the TypingIndicator below will show instead
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
                className={i === 0 ? "" : showAvatar ? "mt-3" : "mt-1"}
              >
                <ChatMessage message={msg} showAvatar={showAvatar} />
              </div>
            );
          })}
          {isStreaming && messages[messages.length - 1]?.content.length === 0 && (
            <div className="mt-3">
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

      {/* Prompt suggestions */}
      {suggestions.length > 0 && !isStreaming && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-border">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                sendMessage(s);
                setInput("");
              }}
              className="text-xs px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors truncate max-w-[200px]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
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

// ── Quick actions for empty state ──────────────────────────────────

const QUICK_ACTIONS = [
  { label: "What's the project status?", icon: BarChart3 },
  { label: "Explain the workflow", icon: GitBranch },
  { label: "Show recent activity", icon: Activity },
  { label: "Help me create a work item", icon: PenLine },
];

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
