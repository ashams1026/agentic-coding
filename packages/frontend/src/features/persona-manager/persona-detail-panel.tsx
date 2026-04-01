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
  Pencil,
  Slash,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { usePersona, useUpdatePersona } from "@/hooks";
import { cn } from "@/lib/utils";
import { MarkdownPreview } from "./system-prompt-editor";
import { SystemPromptEditor } from "./system-prompt-editor";
import { ToolConfiguration } from "./tool-configuration";
import { SkillBrowser } from "./skill-browser";
import { SubagentBrowser } from "./subagent-browser";
import { BUILT_IN_IDS } from "./persona-list";
import type { PersonaId, PersonaModel, EffortLevel, ThinkingMode } from "@agentops/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const MODEL_BADGE_CONFIG: Record<PersonaModel, { label: string; className: string }> = {
  opus: {
    label: "Opus",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  sonnet: {
    label: "Sonnet",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  haiku: {
    label: "Haiku",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
};

// ── Props ───────────────────────────────────────────────────────

interface PersonaDetailPanelProps {
  personaId: PersonaId;
  onClose: () => void;
}

// ── Main component ──────────────────────────────────────────────

export function PersonaDetailPanel({ personaId, onClose }: PersonaDetailPanelProps) {
  const { data: persona } = usePersona(personaId);
  const updateMutation = useUpdatePersona();
  const [editing, setEditing] = useState(false);
  const [skillBrowserOpen, setSkillBrowserOpen] = useState(false);
  const [subagentBrowserOpen, setSubagentBrowserOpen] = useState(false);

  // ── Local form state ──────────────────────────────────────────
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarColor, setAvatarColor] = useState(COLOR_OPTIONS[0]!);
  const [avatarIcon, setAvatarIcon] = useState("bot");
  const [model, setModel] = useState<PersonaModel>("sonnet");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [mcpTools, setMcpTools] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [subagents, setSubagents] = useState<string[]>([]);
  const [maxBudget, setMaxBudget] = useState("1.00");
  const [effort, setEffort] = useState<EffortLevel>("high");
  const [thinking, setThinking] = useState<ThinkingMode>("adaptive");

  // Sync form state when persona data loads or personaId changes
  useEffect(() => {
    if (!persona) return;
    syncFromPersona();
    setEditing(false);
  }, [persona?.id]);

  function syncFromPersona() {
    if (!persona) return;
    setName(persona.name);
    setDescription(persona.description);
    setAvatarColor(persona.avatar.color);
    setAvatarIcon(persona.avatar.icon);
    setModel(persona.model);
    setSystemPrompt(persona.systemPrompt);
    setAllowedTools([...persona.allowedTools]);
    setMcpTools([...persona.mcpTools]);
    setSkills([...persona.skills]);
    setSubagents([...(persona.subagents ?? [])]);
    setMaxBudget(persona.maxBudgetPerRun.toFixed(2));
    setEffort((persona.settings?.effort as EffortLevel) ?? "high");
    setThinking((persona.settings?.thinking as ThinkingMode) ?? "adaptive");
  }

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
      skills,
      subagents,
      maxBudgetPerRun: isNaN(budget) ? 1.0 : budget,
      settings: { effort, thinking },
    }, {
      onSuccess: () => setEditing(false),
    });
  }, [persona, personaId, name, description, avatarColor, avatarIcon, model, systemPrompt, allowedTools, mcpTools, skills, subagents, maxBudget, effort, thinking, updateMutation]);

  const handleCancel = () => {
    syncFromPersona();
    setEditing(false);
  };

  const AvatarIcon = getIcon(editing ? avatarIcon : (persona?.avatar.icon ?? "bot"));
  const displayColor = editing ? avatarColor : (persona?.avatar.color ?? "#6b7280");
  const isBuiltIn = persona ? BUILT_IN_IDS.has(persona.id as string) : false;
  const isAssistant = persona?.settings?.isAssistant === true;

  if (!persona) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const modelBadge = MODEL_BADGE_CONFIG[persona.model];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: displayColor + "20" }}
          >
            <AvatarIcon className="h-4.5 w-4.5" style={{ color: displayColor }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate">{editing ? (name || "Untitled") : persona.name}</h2>
            <p className="text-xs text-muted-foreground truncate">
              {isAssistant ? "Built-in assistant" : isBuiltIn ? "Built-in persona" : "Custom persona"}
            </p>
          </div>
          {isAssistant ? (
            <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0 border-amber-500/50 text-amber-600 dark:text-amber-400">
              Assistant
            </Badge>
          ) : isBuiltIn ? (
            <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
              Built-in
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!editing && !isAssistant && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          )}
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
        {editing ? (
          /* ═══════════════ EDIT MODE ═══════════════ */
          <>
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

            {/* ── Skills ──────────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Skills</h3>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="text-xs px-2 py-0.5 font-mono gap-1 group/pill"
                    >
                      {skill}
                      <button
                        onClick={() => setSkills(skills.filter((s) => s !== skill))}
                        className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setSkillBrowserOpen(true)}
              >
                <Slash className="h-3.5 w-3.5" />
                Browse skills...
              </Button>
              <SkillBrowser
                open={skillBrowserOpen}
                onClose={() => setSkillBrowserOpen(false)}
                onAdd={(name) => {
                  if (!skills.includes(name)) {
                    setSkills([...skills, name]);
                  }
                }}
                existingSkills={skills}
              />
            </section>

            <Separator />

            {/* ── Subagents ──────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Subagents</h3>
              {subagents.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {subagents.map((agent) => (
                    <Badge
                      key={agent}
                      variant="secondary"
                      className="text-xs px-2 py-0.5 gap-1 group/pill"
                    >
                      {agent}
                      <button
                        onClick={() => setSubagents(subagents.filter((a) => a !== agent))}
                        className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setSubagentBrowserOpen(true)}
              >
                <Users className="h-3.5 w-3.5" />
                Browse subagents...
              </Button>
              <SubagentBrowser
                open={subagentBrowserOpen}
                onClose={() => setSubagentBrowserOpen(false)}
                onAdd={(name) => {
                  if (!subagents.includes(name)) {
                    setSubagents([...subagents, name]);
                  }
                }}
                existingSubagents={subagents}
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

            <Separator />

            {/* ── Effort & Thinking ──────────────────────────────── */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Effort & Thinking</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Effort Level</label>
                  <Select value={effort} onValueChange={(v) => setEffort(v as EffortLevel)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low — Fast, minimal reasoning</SelectItem>
                      <SelectItem value="medium">Medium — Balanced</SelectItem>
                      <SelectItem value="high">High — Thorough</SelectItem>
                      <SelectItem value="max">Max — Maximum depth, highest cost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Thinking Mode</label>
                  <Select value={thinking} onValueChange={(v) => setThinking(v as ThinkingMode)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adaptive">Adaptive — Claude decides when to think deeply</SelectItem>
                      <SelectItem value="enabled">Enabled — Always show reasoning chain</SelectItem>
                      <SelectItem value="disabled">Disabled — No extended thinking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* ── Save / Cancel ─────────────────────────────────── */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                className="gap-1"
                onClick={handleSave}
                disabled={updateMutation.isPending || !name.trim()}
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          /* ═══════════════ READ-ONLY MODE ═══════════════ */
          <>
            {/* ── Description ──────────────────────────────── */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h3>
              <p className="text-sm text-foreground">
                {persona.description || <span className="italic text-muted-foreground">No description.</span>}
              </p>
            </section>

            <Separator />

            {/* ── Model + Budget ────────────────────────────── */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Model & Budget</h3>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn("text-xs px-2 py-0.5 border-0", modelBadge.className)}
                >
                  {modelBadge.label}
                </Badge>
                {persona.maxBudgetPerRun > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    <span>${persona.maxBudgetPerRun.toFixed(2)}/run</span>
                  </div>
                )}
              </div>
            </section>

            {(persona.settings?.effort || persona.settings?.thinking) && (
              <>
                <Separator />
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Effort & Thinking</h3>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs px-2 py-0.5 capitalize">
                      {persona.settings?.effort ?? "high"} effort
                    </Badge>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 capitalize">
                      {persona.settings?.thinking ?? "adaptive"} thinking
                    </Badge>
                  </div>
                </section>
              </>
            )}

            <Separator />

            {/* ── System Prompt ─────────────────────────────── */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">System Prompt</h3>
              <div className="max-h-[400px] overflow-y-auto rounded-md border border-border bg-muted/20 p-3">
                {persona.systemPrompt.trim() ? (
                  <MarkdownPreview text={persona.systemPrompt} />
                ) : (
                  <p className="text-xs text-muted-foreground italic">No system prompt.</p>
                )}
              </div>
            </section>

            <Separator />

            {/* ── Tools ────────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tools</h3>
              {persona.mcpTools.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">MCP Tools</p>
                  <div className="flex flex-wrap gap-1.5">
                    {persona.mcpTools.map((tool) => (
                      <Badge key={tool} variant="secondary" className="text-xs px-2 py-0.5 font-mono">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {persona.allowedTools.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">SDK Tools</p>
                  <div className="flex flex-wrap gap-1.5">
                    {persona.allowedTools.map((tool) => (
                      <Badge key={tool} variant="outline" className="text-xs px-2 py-0.5 font-mono">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {persona.mcpTools.length === 0 && persona.allowedTools.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No tools configured.</p>
              )}
            </section>

            {/* ── Skills ───────────────────────────────────── */}
            {persona.skills.length > 0 && (
              <>
                <Separator />
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {persona.skills.map((skill) => {
                      const isSlashCommand = !skill.includes("/") && !skill.includes(".");
                      return (
                        <Badge key={skill} variant="secondary" className="text-xs px-2 py-0.5 font-mono">
                          {isSlashCommand ? `/${skill}` : skill}
                        </Badge>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            {/* ── Subagents ──────────────────────────────────── */}
            {(persona.subagents ?? []).length > 0 && (
              <>
                <Separator />
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Subagents</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(persona.subagents ?? []).map((agent) => (
                      <Badge key={agent} variant="outline" className="text-xs px-2 py-0.5">
                        {agent}
                      </Badge>
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
