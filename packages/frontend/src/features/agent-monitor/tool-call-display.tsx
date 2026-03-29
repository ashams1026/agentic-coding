import { useState } from "react";
import {
  FileText,
  PenLine,
  FilePlus2,
  Search,
  FolderSearch,
  TerminalSquare,
  Globe,
  Wrench,
  Check,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────

export interface ToolCallData {
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown> | string;
  summary: string;
}

export interface ToolResultData {
  toolCallId: string;
  toolName: string;
  status: "success" | "error";
  output: string;
  summary: string;
  isDiff?: boolean;
}

export function parseToolJson(
  content: string,
): (ToolCallData | ToolResultData) | null {
  try {
    return JSON.parse(content) as ToolCallData | ToolResultData;
  } catch {
    return null;
  }
}

// ── Tool icon mapping ─────────────────────────────────────────────

const toolIconMap: Record<string, typeof FileText> = {
  Read: FileText,
  Edit: PenLine,
  Write: FilePlus2,
  Grep: Search,
  Glob: FolderSearch,
  Bash: TerminalSquare,
  WebFetch: Globe,
  WebSearch: Globe,
};

function getToolIcon(toolName: string) {
  return toolIconMap[toolName] ?? Wrench;
}

// ── Status indicator ──────────────────────────────────────────────

function StatusIndicator({
  status,
}: {
  status: "running" | "success" | "error";
}) {
  switch (status) {
    case "running":
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />;
    case "success":
      return <Check className="h-3.5 w-3.5 text-emerald-400" />;
    case "error":
      return <X className="h-3.5 w-3.5 text-red-400" />;
  }
}

// ── Mini diff view ────────────────────────────────────────────────

function DiffView({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-900 overflow-x-auto text-xs font-mono">
      {lines.map((line, i) => {
        let lineClass = "text-zinc-400 px-3 py-0.5";
        if (line.startsWith("+")) {
          lineClass = "text-emerald-400 bg-emerald-950/40 px-3 py-0.5";
        } else if (line.startsWith("-")) {
          lineClass = "text-red-400 bg-red-950/40 px-3 py-0.5";
        } else if (line.startsWith("@@")) {
          lineClass = "text-blue-400 bg-blue-950/30 px-3 py-0.5";
        }
        return (
          <div key={i} className={lineClass}>
            <pre className="whitespace-pre">{line}</pre>
          </div>
        );
      })}
    </div>
  );
}

// ── Formatted JSON ────────────────────────────────────────────────

function FormattedInput({ input }: { input: Record<string, unknown> | string }) {
  const text =
    typeof input === "string" ? input : JSON.stringify(input, null, 2);
  return (
    <pre className="text-xs text-zinc-400 whitespace-pre-wrap break-words">
      {text}
    </pre>
  );
}

// ── Formatted output ──────────────────────────────────────────────

function FormattedOutput({
  output,
  isDiff,
}: {
  output: string;
  isDiff?: boolean;
}) {
  if (isDiff) {
    return <DiffView content={output} />;
  }
  return (
    <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
      {output}
    </pre>
  );
}

// ── Main component ────────────────────────────────────────────────

interface ToolCallSectionProps {
  callData: ToolCallData | null;
  resultData: ToolResultData | null;
}

export function ToolCallSection({ callData, resultData }: ToolCallSectionProps) {
  const [open, setOpen] = useState(false);

  const toolName =
    callData?.toolName ?? resultData?.toolName ?? "Unknown Tool";
  const status: "running" | "success" | "error" = resultData
    ? resultData.status
    : "running";
  const summary = resultData?.summary ?? callData?.summary ?? toolName;

  const Icon = getToolIcon(toolName);

  return (
    <div className="my-1.5 rounded-md border border-zinc-700 bg-zinc-900/80 overflow-hidden">
      {/* Header — always visible, click to toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors",
          "hover:bg-zinc-800/60",
          status === "error" && "bg-red-950/20",
        )}
      >
        <Icon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-medium text-zinc-200">{toolName}</span>
        <StatusIndicator status={status} />
        <span className="flex-1 text-xs text-zinc-500 truncate">{summary}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-zinc-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-zinc-700 px-3 py-2 space-y-2">
          {/* Tool input */}
          {callData?.input && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Input
              </p>
              <FormattedInput input={callData.input} />
            </div>
          )}

          {/* Tool output */}
          {resultData?.output && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Output
              </p>
              <FormattedOutput
                output={resultData.output}
                isDiff={resultData.isDiff}
              />
            </div>
          )}

          {/* Running state — no result yet */}
          {!resultData && (
            <p className="text-xs text-zinc-500 italic">
              Waiting for result...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
