import { useState } from "react";
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
        toolName: "Bash",
        input: { command: "cat TASKS.md | head -20" },
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
}

export function ChatMessage({ message, showAvatar }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "group flex gap-2",
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
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
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
        ) : (
          <div className="space-y-2">
            {message.content.map((block, i) => (
              <ContentBlockRenderer key={i} block={block} />
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

function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text":
      return <PicoMarkdown text={block.text} />;
    case "thinking":
      return <ThinkingBlock text={block.text} />;
    case "tool_use":
      return <ToolCallCard {...block} />;
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

// ── Tool call card (compact, chat-optimized) ──────────────────────

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

  return <div className="space-y-0.5">{elements}</div>;
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
