import { useState } from "react";
import { Terminal, Copy, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseAnsi, stripAnsi } from "@/lib/ansi-parser";

// ── Types ─────────────────────────────────────────────────────────

interface TerminalBlockProps {
  command: string;
  output: string;
  exitCode?: number;
}

const LINE_TRUNCATION_LIMIT = 500;

// ── TerminalBlock ─────────────────────────────────────────────────

export function TerminalBlock({ command, output, exitCode }: TerminalBlockProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const lines = output.split("\n");
  const isTruncatable = lines.length > LINE_TRUNCATION_LIMIT;
  const displayOutput =
    isTruncatable && !expanded
      ? lines.slice(0, LINE_TRUNCATION_LIMIT).join("\n")
      : output;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(stripAnsi(output));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some contexts — silently ignore
    }
  };

  const isSuccess = exitCode === undefined || exitCode === 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60",
        "bg-zinc-900 overflow-hidden",
      )}
    >
      {/* Command header bar */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5",
          "bg-zinc-800/80 border-b border-border/40",
        )}
      >
        <Terminal className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        <span className="flex-1 min-w-0 truncate text-xs font-mono text-zinc-300">
          $ {command}
        </span>

        {/* Exit code */}
        {exitCode !== undefined && (
          <span
            className={cn(
              "text-[10px] font-mono shrink-0",
              isSuccess ? "text-green-400" : "text-red-400",
            )}
          >
            exit {exitCode}
          </span>
        )}

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "shrink-0 p-1 rounded",
            "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60",
            "transition-colors",
          )}
          aria-label="Copy output"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Output body */}
      {output && (
        <div className="max-h-[300px] overflow-y-auto px-3 py-2">
          <pre className="text-xs font-mono text-zinc-200 whitespace-pre-wrap break-words">
            {parseAnsi(displayOutput)}
          </pre>

          {/* Truncation expand/collapse */}
          {isTruncatable && !expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className={cn(
                "mt-2 flex items-center gap-1 text-xs font-medium",
                "text-blue-400 hover:text-blue-300",
                "hover:underline underline-offset-2",
              )}
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Show all {lines.length.toLocaleString()} lines
            </button>
          )}
          {isTruncatable && expanded && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className={cn(
                "mt-2 flex items-center gap-1 text-xs font-medium",
                "text-blue-400 hover:text-blue-300",
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
