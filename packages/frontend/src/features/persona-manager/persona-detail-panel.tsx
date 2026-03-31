import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Code,
  Eye,
  GitBranch,
  TestTube,
  Bot,
  Shield,
  Zap,
  Sparkles,
  Heart,
  Star,
  Flame,
  Target,
  Lightbulb,
  DollarSign,
  Save,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { usePersona, useUpdatePersona } from "@/hooks";
import { cn } from "@/lib/utils";
import { SystemPromptEditor } from "./system-prompt-editor";
import { ToolConfiguration } from "./tool-configuration";
import type { PersonaId, PersonaModel } from "@agentops/shared";

// ── Icon options ────────────────────────────────────────────────

interface IconOption {
  name: string;
  icon: LucideIcon;
}

const ICON_OPTIONS: IconOption[] = [
  { name: "clipboard-list", icon: ClipboardList },
  { name: "git-branch", icon: GitBranch },
  { name: "code", icon: Code },
  { name: "eye", icon: Eye },
  { name: "test-tube", icon: TestTube },
  { name: "bot", icon: Bot },
  { name: "shield", icon: Shield },
  { name: "zap", icon: Zap },
  { name: "sparkles", icon: Sparkles },
  { name: "heart", icon: Heart },
  { name: "star", icon: Star },
  { name: "flame", icon: Flame },
  { name: "target", icon: Target },
  { name: "lightbulb", icon: Lightbulb },
];

const COLOR_OPTIONS = [
  "#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626",
  "#db2777", "#0891b2", "#65a30d", "#ea580c", "#4f46e5",
  "#14b8a6", "#a855f7",
];

function getIcon(name: string): LucideIcon {
  return ICON_OPTIONS.find((o) => o.name === name)?.icon ?? Bot;
}

// ── Model config ────────────────────────────────────────────────

interface ModelOption {
  value: PersonaModel;
  label: string;
  description: string;
  costLabel: string;
  className: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    value: "opus",
    label: "Opus",
    description: "Most capable — complex reasoning, planning",
    costLabel: "$$$",
    className: "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20",
  },
  {
    value: "sonnet",
    label: "Sonnet",
    description: "Balanced — fast, capable, cost-effective",
    costLabel: "$$",
    className: "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20",
  },
  {
    value: "haiku",
    label: "Haiku",
    description: "Fastest — lightweight tasks, lowest cost",
    costLabel: "$",
    className: "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20",
  },
];

// ── Props ───────────────────────────────────────────────────────

interface PersonaDetailPanelProps {
  personaId: PersonaId;
  onClose: () => void;
}

// ── Main component ──────────────────────────────────────────────

export function PersonaDetailPanel({ personaId, onClose }: PersonaDetailPanelProps) {
  const { data: persona } = usePersona(personaId);
  const updateMutation = useUpdatePersona();

  // ── Local form state ──────────────────────────────────────────
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarColor, setAvatarColor] = useState(COLOR_OPTIONS[0]!);
  const [avatarIcon, setAvatarIcon] = useState("bot");
  const [model, setModel] = useState<PersonaModel>("sonnet");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [mcpTools, setMcpTools] = useState<string[]>([]);
  const [maxBudget, setMaxBudget] = useState("1.00");

  // Sync form state when persona data loads or changes
  useEffect(() => {
    if (!persona) return;
    setName(persona.name);
    setDescription(persona.description);
    setAvatarColor(persona.avatar.color);
    setAvatarIcon(persona.avatar.icon);
    setModel(persona.model);
    setSystemPrompt(persona.systemPrompt);
    setAllowedTools([...persona.allowedTools]);
    setMcpTools([...persona.mcpTools]);
    setMaxBudget(persona.maxBudgetPerRun.toFixed(2));
  }, [persona]);

  const handleSave = useCallback(() => {
    if (!persona) return;
    const budget = parseFloat(maxBudget);
    updateMutation.mutate({
      id: personaId,
      name,
      description,
      avatar: { color: avatarColor, icon: avatarIcon },
      model,
      systemPrompt,
      allowedTools,
      mcpTools,
      maxBudgetPerRun: isNaN(budget) ? 1.0 : budget,
    });
  }, [persona, personaId, name, description, avatarColor, avatarIcon, model, systemPrompt, allowedTools, mcpTools, maxBudget, updateMutation]);

  const AvatarIcon = getIcon(avatarIcon);
  const isBuiltIn = persona?.settings?.isSystem === true;

  if (!persona) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: avatarColor + "20" }}
          >
            <AvatarIcon className="h-4.5 w-4.5" style={{ color: avatarColor }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate">{name || "Untitled"}</h2>
            <p className="text-xs text-muted-foreground truncate">
              {isBuiltIn ? "Built-in persona" : "Custom persona"}
            </p>
          </div>
          {isBuiltIn && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
              Built-in
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={handleSave}
            disabled={updateMutation.isPending || !name.trim()}
          >
            <Save className="h-3 w-3" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* ── Identity ─────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identity</h3>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Persona name"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this persona's role"
              className="min-h-[50px] resize-none text-sm"
              rows={2}
            />
          </div>

          {/* Avatar picker */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Avatar</label>
            <div className="flex items-start gap-3">
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 border-2"
                style={{
                  backgroundColor: avatarColor + "20",
                  borderColor: avatarColor + "40",
                }}
              >
                <AvatarIcon className="h-6 w-6" style={{ color: avatarColor }} />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setAvatarColor(color)}
                      className={cn(
                        "h-5 w-5 rounded-full transition-all",
                        avatarColor === color
                          ? "ring-2 ring-offset-1 ring-offset-background"
                          : "hover:scale-110",
                      )}
                      style={{
                        backgroundColor: color,
                        ...(avatarColor === color ? { ringColor: color } : {}),
                      }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {ICON_OPTIONS.map((opt) => {
                    const Ic = opt.icon;
                    return (
                      <button
                        key={opt.name}
                        onClick={() => setAvatarIcon(opt.name)}
                        className={cn(
                          "h-6 w-6 rounded-md flex items-center justify-center transition-colors",
                          avatarIcon === opt.name
                            ? "bg-accent text-accent-foreground ring-1 ring-ring"
                            : "hover:bg-accent/50 text-muted-foreground",
                        )}
                      >
                        <Ic className="h-3 w-3" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Model ────────────────────────────────────────── */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Model</h3>
          <div className="grid grid-cols-3 gap-2">
            {MODEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setModel(opt.value)}
                className={cn(
                  "rounded-lg border-2 p-2.5 text-left transition-colors",
                  model === opt.value ? opt.className : "border-border hover:border-border/80",
                )}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {opt.costLabel}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {opt.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── System Prompt ────────────────────────────────── */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">System Prompt</h3>
          <SystemPromptEditor value={systemPrompt} onChange={setSystemPrompt} />
        </section>

        <Separator />

        {/* ── Tools ────────────────────────────────────────── */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tools</h3>
          <ToolConfiguration
            allowedTools={allowedTools}
            mcpTools={mcpTools}
            onAllowedToolsChange={setAllowedTools}
            onMcpToolsChange={setMcpTools}
          />
        </section>

        <Separator />

        {/* ── Budget ───────────────────────────────────────── */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Budget</h3>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="number"
              min="0"
              step="0.10"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="h-8 w-28 text-sm"
            />
            <span className="text-xs text-muted-foreground">per run</span>
          </div>
        </section>
      </div>
    </div>
  );
}
