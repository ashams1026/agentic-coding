import { useState } from "react";
import {
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
  Dog,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgents } from "@/hooks/use-agents";

// ── Icon lookup (matches agent-editor.tsx) ────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  "clipboard-list": ClipboardList,
  "git-branch": GitBranch,
  code: Code,
  eye: Eye,
  "test-tube": TestTube,
  bot: Bot,
  shield: Shield,
  zap: Zap,
  sparkles: Sparkles,
  heart: Heart,
  star: Star,
  flame: Flame,
  target: Target,
  lightbulb: Lightbulb,
  dog: Dog,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Bot;
}

const MODEL_LABELS: Record<string, string> = {
  opus: "Opus",
  sonnet: "Sonnet",
  haiku: "Haiku",
};

// ── Component ───────────────────────────────────────────────────

interface AgentSelectorProps {
  onSelect: (agentId: string) => void;
  onClose: () => void;
}

export function AgentSelector({ onSelect, onClose }: AgentSelectorProps) {
  const { data: agents = [] } = useAgents();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Sort: Pico (isAssistant) first, then alphabetically
  const sorted = [...agents].sort((a, b) => {
    const aIsAssistant = (a.settings as Record<string, unknown>)?.isAssistant === true;
    const bIsAssistant = (b.settings as Record<string, unknown>)?.isAssistant === true;
    if (aIsAssistant && !bIsAssistant) return -1;
    if (!aIsAssistant && bIsAssistant) return 1;
    return a.name.localeCompare(b.name);
  });

  // Filter out system-only agents (Router)
  const visible = sorted.filter((p) => {
    const settings = p.settings as Record<string, unknown> | undefined;
    return !(settings?.isSystem === true && settings?.isAssistant !== true);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Choose a agent to chat with</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {visible.map((agent) => {
              const avatar = agent.avatar as { color: string; icon: string } | null;
              const color = avatar?.color ?? "#6b7280";
              const Icon = getIcon(avatar?.icon ?? "bot");
              const isAssistant = (agent.settings as Record<string, unknown>)?.isAssistant === true;

              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => onSelect(agent.id)}
                  onMouseEnter={() => setHoveredId(agent.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all",
                    "hover:border-ring hover:shadow-sm",
                    isAssistant && "ring-2 ring-amber-500/30",
                    hoveredId === agent.id ? "border-ring bg-muted/50" : "border-border",
                  )}
                >
                  {/* Avatar */}
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color + "20" }}
                  >
                    <Icon className="h-6 w-6" style={{ color }} />
                  </div>

                  {/* Name */}
                  <span className="text-sm font-medium truncate w-full">
                    {agent.name}
                    {isAssistant && (
                      <span className="ml-1 text-[10px] text-amber-500 font-normal">default</span>
                    )}
                  </span>

                  {/* Description */}
                  <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {agent.description || "No description"}
                  </span>

                  {/* Model badge */}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {MODEL_LABELS[agent.model] ?? agent.model}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
