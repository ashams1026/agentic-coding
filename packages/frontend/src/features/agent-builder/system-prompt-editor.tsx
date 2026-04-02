import { useState, useRef, useCallback, useEffect } from "react";
import { Eye, Pencil, ChevronDown, ChevronRight, Variable } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Variable definitions for autocomplete ──────────────────────

interface VariableGroup {
  namespace: string;
  label: string;
  variables: { name: string; description: string }[];
}

const VARIABLE_GROUPS: VariableGroup[] = [
  {
    namespace: "project",
    label: "Project",
    variables: [
      { name: "project.name", description: "Project display name" },
      { name: "project.path", description: "Project working directory" },
      { name: "project.description", description: "Project description" },
    ],
  },
  {
    namespace: "agent",
    label: "Agent",
    variables: [
      { name: "agent.name", description: "Current agent name" },
      { name: "agent.description", description: "Agent description" },
      { name: "agent.model", description: "Model (opus/sonnet/haiku)" },
    ],
  },
  {
    namespace: "date",
    label: "Date",
    variables: [
      { name: "date.now", description: "Current ISO timestamp" },
      { name: "date.today", description: "Today (YYYY-MM-DD)" },
      { name: "date.dayOfWeek", description: "Day name (e.g. Monday)" },
    ],
  },
  {
    namespace: "workItem",
    label: "Work Item (executor only)",
    variables: [
      { name: "workItem.id", description: "Work item ID" },
      { name: "workItem.title", description: "Work item title" },
      { name: "workItem.state", description: "Current workflow state" },
      { name: "workItem.description", description: "Work item description" },
    ],
  },
];

const ALL_VARIABLES = VARIABLE_GROUPS.flatMap((g) => g.variables);

// ── Token estimate ──────────────────────────────────────────────

function estimateTokens(text: string): number {
  // Rough heuristic: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

// ── Placeholder prompts ─────────────────────────────────────────

const PLACEHOLDER = `You are a [role]. Your job is to [primary responsibility].

## Guidelines
- Be concise and focused on the task at hand
- Follow the project's coding conventions
- Ask clarifying questions when requirements are ambiguous

## Context
You have access to the following tools: [list tools].
Use them to accomplish your assigned tasks efficiently.

## Output Format
- Provide clear explanations of your decisions
- Include relevant code snippets when appropriate`;

// ── Markdown preview ────────────────────────────────────────────

export function MarkdownPreview({ text }: { text: string }) {
  // Minimal markdown rendering: paragraphs, headers, bold, inline code, bullet lists, code blocks
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    // Code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith("```")) {
        codeLines.push(lines[i]!);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={`code-${i}`} className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto my-2">
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(<h4 key={i} className="text-xs font-semibold mt-3 mb-1">{renderInline(line.slice(4))}</h4>);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={i} className="text-sm font-semibold mt-3 mb-1">{renderInline(line.slice(3))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(<h2 key={i} className="text-base font-bold mt-3 mb-1">{renderInline(line.slice(2))}</h2>);
      i++;
      continue;
    }

    // Bullet list
    if (line.match(/^[-*] /)) {
      elements.push(
        <li key={i} className="text-xs text-muted-foreground ml-4 list-disc">
          {renderInline(line.slice(2))}
        </li>,
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={i} className="text-xs text-muted-foreground">
        {renderInline(line)}
      </p>,
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function renderInline(text: string): React.ReactNode[] {
  // Bold: **text**, inline code: `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ── Line numbers gutter ─────────────────────────────────────────

function LineNumbers({ count, scrollTop }: { count: number; scrollTop: number }) {
  return (
    <div
      className="select-none text-right pr-2 text-xs text-muted-foreground/50 font-mono leading-[1.65rem] pt-[9px]"
      style={{ transform: `translateY(-${scrollTop}px)` }}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  );
}

// ── Props ───────────────────────────────────────────────────────

interface SystemPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Optional context for variable preview — project and agent data */
  previewContext?: {
    projectName?: string;
    projectPath?: string;
    projectDescription?: string;
    agentName?: string;
    agentDescription?: string;
    agentModel?: string;
  };
}

// ── Main component ──────────────────────────────────────────────

// ── Frontend-side variable resolution for preview ──────────────

type PreviewCtx = SystemPromptEditorProps["previewContext"];

function buildPreviewContext(ctx?: PreviewCtx): Record<string, string> {
  const map: Record<string, string> = {};
  if (ctx?.projectName) map["project.name"] = ctx.projectName;
  if (ctx?.projectPath) map["project.path"] = ctx.projectPath;
  if (ctx?.projectDescription) map["project.description"] = ctx.projectDescription;
  if (ctx?.agentName) map["agent.name"] = ctx.agentName;
  if (ctx?.agentDescription) map["agent.description"] = ctx.agentDescription;
  if (ctx?.agentModel) map["agent.model"] = ctx.agentModel;
  const now = new Date();
  map["date.now"] = now.toISOString();
  map["date.today"] = now.toISOString().split("T")[0]!;
  map["date.dayOfWeek"] = now.toLocaleDateString("en-US", { weekday: "long" });
  // workItem.* not available in editor preview
  return map;
}

function getPreviewValue(varName: string, ctx?: PreviewCtx): string | null {
  const map = buildPreviewContext(ctx);
  return map[varName] ?? null;
}

function ResolvedPreview({ text, context }: { text: string; context?: PreviewCtx }) {
  const ctx = buildPreviewContext(context);

  // Split text on variable patterns, rendering resolved values with highlight
  const parts = text.split(/((?<!\\)\{\{\s*[a-zA-Z_][a-zA-Z0-9_.]*\s*\}\})/g);

  return (
    <div className="font-mono text-xs leading-[1.65rem] whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        const varMatch = part.match(/^\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}$/);
        if (varMatch) {
          const varName = varMatch[1]!;
          const resolved = ctx[varName];
          if (resolved) {
            return (
              <span key={i} className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded px-0.5" title={`{{${varName}}}`}>
                {resolved}
              </span>
            );
          }
          // Unresolved — show as-is with warning color
          return (
            <span key={i} className="bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded px-0.5" title="Unresolved variable">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

export function SystemPromptEditor({ value, onChange, previewContext }: SystemPromptEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [scrollTop, setScrollTop] = useState(0);
  const [showVarPanel, setShowVarPanel] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePos, setAutocompletePos] = useState({ top: 0, left: 0 });
  const [autocompleteFilter, setAutocompleteFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerStart, setTriggerStart] = useState(-1); // cursor position of `{{`

  const lineCount = Math.max(value.split("\n").length, 1);
  const tokenEstimate = estimateTokens(value);

  const handleScroll = useCallback(() => {
    if (textareaRef.current) {
      setScrollTop(textareaRef.current.scrollTop);
    }
  }, []);

  // Reset scroll when switching modes
  useEffect(() => {
    setScrollTop(0);
  }, [mode]);

  // Filtered variables for autocomplete
  const filteredVars = autocompleteFilter
    ? ALL_VARIABLES.filter((v) => v.name.toLowerCase().includes(autocompleteFilter.toLowerCase()))
    : ALL_VARIABLES;

  // Get grouped filtered variables
  const filteredGroups = VARIABLE_GROUPS.map((g) => ({
    ...g,
    variables: g.variables.filter((v) =>
      !autocompleteFilter || v.name.toLowerCase().includes(autocompleteFilter.toLowerCase()),
    ),
  })).filter((g) => g.variables.length > 0);

  // Close autocomplete on click outside
  useEffect(() => {
    if (!showAutocomplete) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAutocomplete]);

  // Detect `{{` typing and position the autocomplete
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      const cursorPos = e.target.selectionStart;
      const textBefore = newValue.slice(0, cursorPos);

      // Check if we just typed `{{` or are inside `{{...`
      const lastOpen = textBefore.lastIndexOf("{{");
      const lastClose = textBefore.lastIndexOf("}}");

      if (lastOpen >= 0 && lastOpen > lastClose) {
        // We're inside a `{{ ... ` — extract the partial variable name
        const partial = textBefore.slice(lastOpen + 2).trim();
        setAutocompleteFilter(partial);
        setTriggerStart(lastOpen);
        setSelectedIndex(0);

        // Position: approximate based on textarea and cursor
        const ta = textareaRef.current;
        if (ta) {
          const linesBefore = textBefore.split("\n");
          const currentLine = linesBefore.length - 1;
          const lineHeight = 26.4; // matches leading-[1.65rem] = 26.4px
          const charWidth = 7.2; // approximate monospace char width at text-xs
          const colInLine = (linesBefore[currentLine]?.length ?? 0);

          const taRect = ta.getBoundingClientRect();
          setAutocompletePos({
            top: (currentLine + 1) * lineHeight - ta.scrollTop + 8,
            left: Math.min(colInLine * charWidth + 48, taRect.width - 200), // 48px for line numbers gutter
          });
        }

        if (!showAutocomplete) setShowAutocomplete(true);
      } else {
        if (showAutocomplete) setShowAutocomplete(false);
      }
    },
    [onChange, showAutocomplete],
  );

  // Insert a variable at the trigger position
  const insertVariable = useCallback(
    (varName: string) => {
      const ta = textareaRef.current;
      if (!ta || triggerStart < 0) return;

      const cursorPos = ta.selectionStart;
      const before = value.slice(0, triggerStart);
      const after = value.slice(cursorPos);
      const inserted = `{{${varName}}}`;
      const newValue = before + inserted + after;
      onChange(newValue);

      setShowAutocomplete(false);

      // Restore cursor after the inserted variable
      requestAnimationFrame(() => {
        const newPos = triggerStart + inserted.length;
        ta.focus();
        ta.setSelectionRange(newPos, newPos);
      });
    },
    [value, onChange, triggerStart],
  );

  // Keyboard navigation in autocomplete
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showAutocomplete) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredVars.length - 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter" || e.key === "Tab") {
        if (filteredVars.length > 0) {
          e.preventDefault();
          insertVariable(filteredVars[selectedIndex]?.name ?? filteredVars[0]!.name);
        }
        return;
      }
    },
    [showAutocomplete, filteredVars, selectedIndex, insertVariable],
  );

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex items-center gap-1">
        <Button
          variant={mode === "edit" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => setMode("edit")}
        >
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
        <Button
          variant={mode === "preview" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => setMode("preview")}
        >
          <Eye className="h-3 w-3" />
          Preview
        </Button>
      </div>

      {/* Editor / Preview */}
      <div className="rounded-md border border-border overflow-hidden bg-background">
        {mode === "edit" ? (
          <div className="relative flex min-h-[200px] max-h-[400px]">
            {/* Line numbers */}
            <div className="w-10 shrink-0 border-r border-border bg-muted/30 overflow-hidden">
              <LineNumbers count={lineCount} scrollTop={scrollTop} />
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              placeholder={PLACEHOLDER}
              className={cn(
                "flex-1 resize-none bg-transparent p-2 font-mono text-xs",
                "leading-[1.65rem] outline-none",
                "placeholder:text-muted-foreground/40",
              )}
              spellCheck={false}
            />

            {/* Autocomplete popover */}
            {showAutocomplete && filteredGroups.length > 0 && (
              <div
                ref={popoverRef}
                className="absolute z-20 bg-popover border border-border rounded-md shadow-lg py-1 w-64 max-h-56 overflow-y-auto"
                style={{ top: autocompletePos.top, left: autocompletePos.left }}
              >
                {filteredGroups.map((group) => (
                  <div key={group.namespace}>
                    <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </div>
                    {group.variables.map((v) => {
                      const flatIndex = filteredVars.indexOf(v);
                      return (
                        <button
                          key={v.name}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault(); // prevent textarea blur
                            insertVariable(v.name);
                          }}
                          className={cn(
                            "flex flex-col w-full text-left px-3 py-1 text-xs hover:bg-muted",
                            flatIndex === selectedIndex && "bg-muted",
                          )}
                        >
                          <span className="font-mono text-foreground">{`{{${v.name}}}`}</span>
                          <span className="text-[10px] text-muted-foreground">{v.description}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-3">
            {value.trim() ? (
              <ResolvedPreview text={value} context={previewContext} />
            ) : (
              <p className="text-xs text-muted-foreground/50 italic">
                No system prompt content to preview.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{value.length} characters</span>
        <span className="text-muted-foreground/30">|</span>
        <span>~{tokenEstimate.toLocaleString()} tokens</span>
        <span className="text-muted-foreground/30">|</span>
        <span>{lineCount} line{lineCount !== 1 ? "s" : ""}</span>
      </div>

      {/* Collapsible Variables reference panel */}
      <div className="border border-border rounded-md overflow-hidden">
        <button
          type="button"
          onClick={() => setShowVarPanel(!showVarPanel)}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          {showVarPanel ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Variable className="h-3 w-3" />
          Available Variables
          <span className="ml-auto text-[10px] text-muted-foreground/60">{ALL_VARIABLES.length} variables</span>
        </button>
        {showVarPanel && (
          <div className="border-t border-border px-3 py-2 space-y-3 bg-muted/20">
            {VARIABLE_GROUPS.map((group) => (
              <div key={group.namespace}>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.variables.map((v) => {
                    const currentValue = getPreviewValue(v.name, previewContext);
                    return (
                      <div key={v.name} className="flex items-baseline gap-2 text-xs">
                        <code className="font-mono text-foreground shrink-0">{`{{${v.name}}}`}</code>
                        <span className="text-muted-foreground/60">—</span>
                        <span className="text-muted-foreground truncate">{v.description}</span>
                        {currentValue && (
                          <span className="ml-auto text-[10px] font-mono text-emerald-500 shrink-0 max-w-[120px] truncate" title={currentValue}>
                            = {currentValue}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
