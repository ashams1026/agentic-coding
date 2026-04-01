import { useState, useEffect, useRef } from "react";
import {
  Dog,
  ChevronDown,
  Check,
  Copy,
  Loader2,
  X as XIcon,
  Brain,
  Wrench,
  FileText,
  Search,
  TerminalSquare,
  Globe,
  FolderSearch,
  PenLine,
  FilePlus2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; text: string }
  | {
      type: "tool_use";
      toolCallId: string;
      toolName: string;
      input: Record<string, unknown>;
      summary: string;
      status: "running" | "success" | "error";
      output?: string;
    };

export interface PicoChatMessage {
  id: string;
  role: "user" | "assistant";
  timestamp: Date;
  content: ContentBlock[];
}

// ── Mock messages for UI development — PICO.8 replaces with real data ──

export const MOCK_MESSAGES: PicoChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    timestamp: new Date(Date.now() - 180_000),
    content: [
      {
        type: "text",
        text: "Woof! I'm Pico, your project assistant. I know everything about this project — the architecture, the workflow, all the agents. What can I help with?",
      },
    ],
  },
  {
    id: "2",
    role: "user",
    timestamp: new Date(Date.now() - 120_000),
    content: [{ type: "text", text: "What's the current project status?" }],
  },
  {
    id: "3",
    role: "assistant",
    timestamp: new Date(Date.now() - 60_000),
    content: [
      {
        type: "thinking",
        text: "Let me check the current sprint status, active agents, and build health...",
      },
      {
        type: "tool_use",
        toolCallId: "tc1",
        toolName: "Read",
        input: { file_path: "/Users/amin/workspaces/agentic_coding/TASKS.md" },
        summary: "Reading task backlog",
        status: "success",
        output:
          "## Sprint 18: Pico — Project Assistant\n- [x] PICO.5\n- [x] PICO.6\n- [ ] PICO.7...",
      },
      {
        type: "text",
        text: "Here's what I dug up!\n\n**Sprint 18** is active with 6 tasks:\n\n- 2 completed (PICO.5, PICO.6)\n- 4 remaining\n\nAll builds are **passing**. The current focus is the Pico chat interface — that's me!\n\nHere's a quick code snippet from the task list:\n\n```typescript\ninterface PicoChatMessage {\n  id: string;\n  role: \"user\" | \"assistant\";\n  content: ContentBlock[];\n}\n```",
      },
    ],
  },
];

// ── Main message component ────────────────────────────────────────

interface ChatMessageProps {
  message: PicoChatMessage;
  showAvatar: boolean; // false when grouped with previous same-role message
  compact?: boolean; // true in mini panel, false in full-page view
}

export function ChatMessage({ message, showAvatar, compact = true }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "group flex gap-2 overflow-hidden",
        isUser ? "flex-row-reverse" : "flex-row",
        !showAvatar && !isUser && "pl-9",
      )}
    >
      {/* Avatar — only for assistant, first in group */}
      {!isUser && showAvatar && (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5"
          style={{ backgroundColor: "#f59e0b" }}
        >
          <Dog className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[85%] min-w-0 rounded-lg px-3 py-2 text-sm overflow-hidden break-words",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {isUser ? (
          <span>
            {message.content[0]?.type === "text"
              ? message.content[0].text
              : ""}
          </span>
        ) : compact ? (
          <CompactMessageBody content={message.content} />
        ) : (
          <div className="space-y-2">
            {message.content.map((block, i) => (
              <ContentBlockRenderer key={i} block={block} compact={false} />
            ))}
          </div>
        )}
      </div>

      {/* Timestamp on hover */}
      <span
        className="self-end shrink-0 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        title={message.timestamp.toLocaleString()}
      >
        {message.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

// ── Content block renderer ────────────────────────────────────────

function ContentBlockRenderer({ block, compact }: { block: ContentBlock; compact?: boolean }) {
  switch (block.type) {
    case "text":
      return <PicoMarkdown text={block.text} />;
    case "thinking":
      return compact ? <CompactThinking /> : <ThinkingBlock text={block.text} />;
    case "tool_use":
      return compact ? (
        <CompactToolCall toolName={block.toolName} summary={block.summary} status={block.status} />
      ) : (
        <ToolCallCard {...block} />
      );
  }
}

// ── Thinking block (collapsible, collapsed by default) ────────────

function ThinkingBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border border-border/50 bg-background/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-2 py-1 text-left hover:bg-background/50 transition-colors"
      >
        <Brain className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground">
          Pico is thinking...
        </span>
        <ChevronDown
          className={cn(
            "ml-auto h-3 w-3 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-border/50 px-2 py-1.5">
          <p className="text-xs italic text-muted-foreground whitespace-pre-wrap">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Tool icon map (shared by compact and full variants) ──────────

const TOOL_ICONS: Record<string, typeof FileText> = {
  Read: FileText,
  Edit: PenLine,
  Write: FilePlus2,
  Grep: Search,
  Glob: FolderSearch,
  Bash: TerminalSquare,
  WebFetch: Globe,
  WebSearch: Globe,
};

// ── Compact variants (mini panel) ────────────────────────────────

function CompactThinking() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Brain className="h-3 w-3 shrink-0" />
      <span className="italic">Thinking...</span>
    </div>
  );
}

function CompactToolCall({
  toolName,
  summary,
  status,
}: {
  toolName: string;
  summary: string;
  status: "running" | "success" | "error";
}) {
  const Icon = TOOL_ICONS[toolName] ?? Wrench;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3 w-3 shrink-0" />
      {status === "running" && (
        <Loader2 className="h-3 w-3 animate-spin text-blue-400 shrink-0" />
      )}
      {status === "success" && (
        <Check className="h-3 w-3 text-emerald-400 shrink-0" />
      )}
      {status === "error" && <XIcon className="h-3 w-3 text-red-400 shrink-0" />}
      <span className="truncate">
        Used {toolName}{summary ? ` — ${summary}` : ""}
      </span>
    </div>
  );
}

// ── Compact message body (status line + text) ───────────────────

function CompactMessageBody({ content }: { content: ContentBlock[] }) {
  const statusBlocks = content.filter(
    (b): b is ContentBlock & { type: "thinking" | "tool_use" } =>
      b.type === "thinking" || b.type === "tool_use",
  );
  const textBlocks = content.filter(
    (b): b is ContentBlock & { type: "text" } => b.type === "text",
  );

  return (
    <div className="space-y-2">
      {statusBlocks.length > 0 && <StatusLine items={statusBlocks} />}
      {textBlocks.map((block, i) => (
        <PicoMarkdown key={i} text={block.text} />
      ))}
    </div>
  );
}

// ── Status line (animated, consolidated) ─────────────────────────

interface StatusItem {
  icon: LucideIcon;
  label: string;
  status?: "running" | "success" | "error";
}

function blockToStatusItem(block: ContentBlock): StatusItem {
  if (block.type === "thinking") {
    return { icon: Brain, label: "Thinking..." };
  }
  // tool_use
  if (block.type === "tool_use") {
    const Icon = TOOL_ICONS[block.toolName] ?? Wrench;
    return {
      icon: Icon,
      label: getToolDescription(block.toolName, block.input, block.summary),
      status: block.status,
    };
  }
  return { icon: Wrench, label: "Working..." };
}

function getToolDescription(
  toolName: string,
  input: Record<string, unknown>,
  summary: string,
): string {
  switch (toolName) {
    case "Read": {
      const fp = input.file_path as string | undefined;
      return fp ? `Reading ${pathBasename(fp)}` : summary || "Reading file";
    }
    case "Edit": {
      const fp = input.file_path as string | undefined;
      return fp ? `Editing ${pathBasename(fp)}` : summary || "Editing file";
    }
    case "Write": {
      const fp = input.file_path as string | undefined;
      return fp ? `Writing ${pathBasename(fp)}` : summary || "Writing file";
    }
    case "Bash": {
      const cmd = input.command as string | undefined;
      return cmd ? `Running: ${truncStr(cmd, 40)}` : summary || "Running command";
    }
    case "Grep": {
      const pattern = input.pattern as string | undefined;
      return pattern
        ? `Searching: ${truncStr(pattern, 30)}`
        : summary || "Searching";
    }
    case "Glob": {
      const pattern = input.pattern as string | undefined;
      return pattern ? `Finding: ${pattern}` : summary || "Finding files";
    }
    case "WebFetch": {
      const url = input.url as string | undefined;
      return url ? `Fetching ${truncStr(url, 40)}` : summary || "Fetching URL";
    }
    case "WebSearch": {
      const query = input.query as string | undefined;
      return query
        ? `Searching: ${truncStr(query, 30)}`
        : summary || "Web search";
    }
    case "Agent": {
      const desc =
        (input.description as string | undefined) ??
        (input.name as string | undefined);
      return desc
        ? `Agent — ${truncStr(desc, 35)}`
        : summary || "Running agent";
    }
    default:
      return summary ? `${toolName} — ${summary}` : `Using ${toolName}`;
  }
}

function pathBasename(p: string): string {
  return p.split("/").pop() || p;
}

function truncStr(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function StatusLine({ items }: { items: (ContentBlock & { type: "thinking" | "tool_use" })[] }) {
  const statusItems = items.map(blockToStatusItem);
  // Start at the last item on mount — history loads all items at once,
  // so no cycling needed. During streaming, mounts with 1 item (idx 0)
  // and the timer advances as new items arrive.
  const [visibleIdx, setVisibleIdx] = useState(() => Math.max(0, items.length - 1));
  const [expanded, setExpanded] = useState(false);
  const lastAdvanceRef = useRef(Date.now());

  // Auto-advance through items with 1.5s minimum display time
  useEffect(() => {
    if (visibleIdx >= statusItems.length - 1) return;

    const elapsed = Date.now() - lastAdvanceRef.current;
    const remaining = Math.max(0, 1500 - elapsed);

    const timer = setTimeout(() => {
      lastAdvanceRef.current = Date.now();
      setVisibleIdx((prev) => prev + 1);
    }, remaining);

    return () => clearTimeout(timer);
  }, [visibleIdx, statusItems.length]);

  const safeIdx = Math.min(visibleIdx, statusItems.length - 1);
  const current = statusItems[safeIdx];
  if (!current) return null;

  const StatusIcon = current.icon;

  return (
    <div>
      {/* Current status */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <StatusIcon className="h-3 w-3 shrink-0" />
        {current.status === "running" && (
          <Loader2 className="h-3 w-3 animate-spin text-blue-400 shrink-0" />
        )}
        {current.status === "success" && (
          <Check className="h-3 w-3 text-emerald-400 shrink-0" />
        )}
        {current.status === "error" && (
          <XIcon className="h-3 w-3 text-red-400 shrink-0" />
        )}
        <span className="truncate flex-1">{current.label}</span>
        {statusItems.length > 1 && (
          <>
            <span className="shrink-0 text-[10px] tabular-nums">
              {safeIdx + 1}/{statusItems.length}
            </span>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 rounded p-0.5 hover:bg-background/50 transition-colors"
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </button>
          </>
        )}
      </div>
      {/* Expanded list */}
      {expanded && (
        <div className="mt-1 space-y-0.5 pl-1 border-l-2 border-border/50">
          {statusItems.map((item, i) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  i === safeIdx
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <ItemIcon className="h-3 w-3 shrink-0" />
                {item.status === "running" && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-400 shrink-0" />
                )}
                {item.status === "success" && (
                  <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                )}
                {item.status === "error" && (
                  <XIcon className="h-3 w-3 text-red-400 shrink-0" />
                )}
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tool call card (full, expandable) ────────────────────────────

function ToolCallCard({
  toolName,
  summary,
  status,
  input,
  output,
}: {
  toolName: string;
  summary: string;
  status: "running" | "success" | "error";
  input: Record<string, unknown>;
  output?: string;
}) {
  const [open, setOpen] = useState(false);
  const Icon = TOOL_ICONS[toolName] ?? Wrench;

  return (
    <div className="rounded-md border border-border/50 bg-background/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-2 py-1 text-left hover:bg-background/50 transition-colors"
      >
        <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium">{toolName}</span>
        {status === "running" && (
          <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
        )}
        {status === "success" && (
          <Check className="h-3 w-3 text-emerald-400" />
        )}
        {status === "error" && <XIcon className="h-3 w-3 text-red-400" />}
        <span className="flex-1 text-xs text-muted-foreground truncate">
          {summary}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-border/50 px-2 py-1.5 space-y-1.5">
          {input && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Input</p>
              <pre className="text-xs text-foreground/70 whitespace-pre-wrap break-words">
                {typeof input === "string"
                  ? input
                  : JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
          {output && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Output</p>
              <pre className="text-xs text-foreground/70 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                {output}
              </pre>
            </div>
          )}
          {status === "running" && (
            <p className="text-xs italic text-muted-foreground">
              Waiting for result...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Markdown renderer (chat-optimized, extends MarkdownPreview patterns) ──

function PicoMarkdown({ text }: { text: string }) {
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
        <CodeBlock
          key={`code-${idx}`}
          code={codeLines.join("\n")}
          language={lang || undefined}
        />,
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
        <p key={idx} className="font-semibold mt-1.5">
          {renderInline(line.slice(3))}
        </p>,
      );
      idx++;
      continue;
    }

    // Bullet list
    if (line.match(/^[-*] /)) {
      elements.push(
        <li key={idx} className="ml-4 list-disc text-sm">
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
      <p key={idx} className="text-sm">
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
          className="rounded bg-background/50 px-1 py-0.5 text-xs font-mono"
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

// ── Code block with copy button ───────────────────────────────────

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-md border border-border/50 bg-background/50 overflow-hidden my-1">
      {language && (
        <div className="border-b border-border/50 px-2 py-0.5">
          <span className="text-xs text-muted-foreground">{language}</span>
        </div>
      )}
      <pre className="p-2 text-xs font-mono overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-1 right-1 rounded p-1 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
        title="Copy code"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-400" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}
