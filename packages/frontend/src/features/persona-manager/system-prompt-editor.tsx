import { useState, useRef, useCallback, useEffect } from "react";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function MarkdownPreview({ text }: { text: string }) {
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
}

// ── Main component ──────────────────────────────────────────────

export function SystemPromptEditor({ value, onChange }: SystemPromptEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [scrollTop, setScrollTop] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          <div className="flex min-h-[200px] max-h-[400px]">
            {/* Line numbers */}
            <div className="w-10 shrink-0 border-r border-border bg-muted/30 overflow-hidden">
              <LineNumbers count={lineCount} scrollTop={scrollTop} />
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onScroll={handleScroll}
              placeholder={PLACEHOLDER}
              className={cn(
                "flex-1 resize-none bg-transparent p-2 font-mono text-xs",
                "leading-[1.65rem] outline-none",
                "placeholder:text-muted-foreground/40",
              )}
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-3">
            {value.trim() ? (
              <MarkdownPreview text={value} />
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
    </div>
  );
}
