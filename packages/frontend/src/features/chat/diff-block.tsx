import { useState, useMemo } from "react";
import { FileText, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeDiff, formatDiffText } from "@/lib/diff-parser";

// ── Types ─────────────────────────────────────────────────────────

interface DiffBlockProps {
  filePath: string;
  oldString?: string;
  newString: string;
  isNewFile?: boolean;
}

// ── DiffBlock ─────────────────────────────────────────────────────

export function DiffBlock({ filePath, oldString, newString, isNewFile }: DiffBlockProps) {
  const [copied, setCopied] = useState(false);

  const basename = filePath.split("/").pop() ?? filePath;

  const diff = useMemo(() => {
    const old = isNewFile || !oldString ? "" : oldString;
    return computeDiff(old, newString ?? "");
  }, [oldString, newString, isNewFile]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatDiffText(diff));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write can fail in insecure contexts — silently ignore
    }
  };

  // Nothing to render for empty diffs
  if (diff.lines.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-border/50 overflow-hidden",
        "bg-background/30",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2",
          "border-b border-border/50",
          "bg-muted/30",
        )}
      >
        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-foreground truncate">
          {basename}
        </span>

        {/* Line count summary */}
        <span className="ml-auto flex items-center gap-2 text-xs font-mono shrink-0">
          {diff.addCount > 0 && (
            <span className="text-green-600 dark:text-green-400">+{diff.addCount}</span>
          )}
          {diff.removeCount > 0 && (
            <span className="text-red-600 dark:text-red-400">-{diff.removeCount}</span>
          )}
        </span>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "p-1 rounded hover:bg-muted/50 transition-colors shrink-0",
            "text-muted-foreground hover:text-foreground",
          )}
          title="Copy diff"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Diff body */}
      <div className="max-h-[400px] overflow-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <tbody>
            {diff.lines.map((line, i) => (
              <tr
                key={i}
                className={cn(
                  line.type === "add" && "bg-green-500/10",
                  line.type === "remove" && "bg-red-500/10",
                )}
              >
                {/* Old line number */}
                <td
                  className={cn(
                    "select-none text-right px-2 py-0 w-[1%] whitespace-nowrap",
                    "border-r border-border/30",
                    line.type === "add" && "text-green-600/50 dark:text-green-400/50",
                    line.type === "remove" && "text-red-600/50 dark:text-red-400/50",
                    line.type === "context" && "text-muted-foreground/40",
                  )}
                >
                  {line.oldLineNumber ?? ""}
                </td>

                {/* New line number */}
                <td
                  className={cn(
                    "select-none text-right px-2 py-0 w-[1%] whitespace-nowrap",
                    "border-r border-border/30",
                    line.type === "add" && "text-green-600/50 dark:text-green-400/50",
                    line.type === "remove" && "text-red-600/50 dark:text-red-400/50",
                    line.type === "context" && "text-muted-foreground/40",
                  )}
                >
                  {line.newLineNumber ?? ""}
                </td>

                {/* Prefix (+/-/space) */}
                <td
                  className={cn(
                    "select-none px-1 py-0 w-[1%] whitespace-nowrap",
                    line.type === "add" && "text-green-600 dark:text-green-400",
                    line.type === "remove" && "text-red-600 dark:text-red-400",
                    line.type === "context" && "text-muted-foreground/40",
                  )}
                >
                  {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
                </td>

                {/* Content */}
                <td
                  className={cn(
                    "py-0 pr-3 whitespace-pre",
                    line.type === "add" && "text-green-900 dark:text-green-200",
                    line.type === "remove" && "text-red-900 dark:text-red-200",
                    line.type === "context" && "text-foreground/80",
                  )}
                >
                  {line.content}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
