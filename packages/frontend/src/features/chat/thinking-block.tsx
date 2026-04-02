import { useState } from "react";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────

interface ThinkingBlockProps {
  text: string;
  defaultExpanded?: boolean;
}

const TRUNCATION_LIMIT = 2000;

// ── ThinkingBlock ─────────────────────────────────────────────────

export function ThinkingBlock({ text, defaultExpanded = true }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showFull, setShowFull] = useState(false);

  // Don't render if text is empty or whitespace-only
  if (!text || text.trim().length === 0) return null;

  const isTruncatable = text.length > TRUNCATION_LIMIT;
  const displayText = isTruncatable && !showFull ? text.slice(0, TRUNCATION_LIMIT) : text;

  return (
    <div
      className={cn(
        "rounded-md border border-border/50 border-l-4",
        "border-l-purple-400/50 dark:border-l-purple-500/30",
        "bg-background/30 overflow-hidden",
      )}
    >
      {/* Header — clickable toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-1.5 w-full px-3 py-2 text-left",
          "hover:bg-background/50 transition-colors",
        )}
      >
        <Brain className="h-3.5 w-3.5 text-purple-400 dark:text-purple-500 shrink-0" />
        <span className="text-xs font-medium text-muted-foreground">
          Thinking
        </span>
        {expanded ? (
          <ChevronDown className="ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform" />
        ) : (
          <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform" />
        )}
      </button>

      {/* Body — collapsible */}
      {expanded && (
        <div className="border-t border-border/50 px-3 py-2">
          <div className="text-muted-foreground/70 text-xs">
            <ThinkingMarkdown text={displayText} />
          </div>
          {isTruncatable && !showFull && (
            <button
              type="button"
              onClick={() => setShowFull(true)}
              className={cn(
                "mt-1.5 text-xs font-medium",
                "text-purple-500 dark:text-purple-400",
                "hover:underline underline-offset-2",
              )}
            >
              Show more ({(text.length - TRUNCATION_LIMIT).toLocaleString()} more chars)
            </button>
          )}
          {isTruncatable && showFull && (
            <button
              type="button"
              onClick={() => setShowFull(false)}
              className={cn(
                "mt-1.5 text-xs font-medium",
                "text-purple-500 dark:text-purple-400",
                "hover:underline underline-offset-2",
              )}
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Lightweight markdown renderer for thinking text ───────────────
// Mirrors the PicoMarkdown pattern from features/pico/chat-message.tsx
// but renders in muted style appropriate for thinking blocks.

function ThinkingMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let idx = 0;

  while (idx < lines.length) {
    const line = lines[idx]!;

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      idx++;
      while (idx < lines.length && !lines[idx]!.startsWith("```")) {
        codeLines.push(lines[idx]!);
        idx++;
      }
      idx++; // skip closing ```
      elements.push(
        <pre
          key={`code-${idx}`}
          className="rounded bg-background/50 border border-border/30 p-2 text-xs font-mono overflow-x-auto my-1"
        >
          {lang && (
            <span className="block text-[10px] text-muted-foreground/50 mb-1">
              {lang}
            </span>
          )}
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <p key={idx} className="font-semibold text-xs mt-1.5">
          {renderInline(line.slice(4))}
        </p>,
      );
      idx++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <p key={idx} className="font-semibold text-xs mt-1.5">
          {renderInline(line.slice(3))}
        </p>,
      );
      idx++;
      continue;
    }

    // Bullet list
    if (line.match(/^[-*] /)) {
      elements.push(
        <li key={idx} className="ml-4 list-disc text-xs">
          {renderInline(line.slice(2))}
        </li>,
      );
      idx++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={idx} className="h-1" />);
      idx++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={idx} className="text-xs">
        {renderInline(line)}
      </p>,
    );
    idx++;
  }

  return <div className="space-y-0.5 overflow-hidden">{elements}</div>;
}

// ── Inline markdown (bold, code, links) ───────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-background/50 px-1 py-0.5 text-[11px] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}
