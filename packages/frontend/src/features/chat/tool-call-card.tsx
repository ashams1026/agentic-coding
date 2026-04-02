import { useState } from "react";
import {
  FileText,
  Pencil,
  FilePlus,
  Terminal,
  Search,
  FolderSearch,
  Bot,
  Globe,
  Download,
  Wrench,
  ChevronDown,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────

export interface ToolUseBlock {
  type: "tool_use";
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
  summary?: string;
  status: "running" | "success" | "error";
  output?: string;
}

export interface ToolCallCardProps {
  block: ToolUseBlock;
  defaultExpanded?: boolean;
}

// ── Tool icon map ─────────────────────────────────────────────────

const TOOL_ICON_MAP: Record<string, LucideIcon> = {
  Read: FileText,
  Edit: Pencil,
  Write: FilePlus,
  Bash: Terminal,
  Grep: Search,
  Glob: FolderSearch,
  Agent: Bot,
  WebSearch: Globe,
  WebFetch: Download,
};

// Tools that modify state should be expanded by default
const EXPANDED_BY_DEFAULT = new Set(["Edit", "Write", "Bash"]);

// ── Description helpers ───────────────────────────────────────────

function pathBasename(p: string): string {
  return p.split("/").pop() || p;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
}

function getAutoDescription(
  toolName: string,
  input: Record<string, unknown>,
): string | null {
  switch (toolName) {
    case "Read": {
      const fp = input.file_path as string | undefined;
      return fp ? pathBasename(fp) : null;
    }
    case "Edit": {
      const fp = input.file_path as string | undefined;
      return fp ? pathBasename(fp) : null;
    }
    case "Write": {
      const fp = input.file_path as string | undefined;
      return fp ? pathBasename(fp) : null;
    }
    case "Bash": {
      const cmd = input.command as string | undefined;
      return cmd ? truncate(cmd, 60) : null;
    }
    case "Grep": {
      const pattern = input.pattern as string | undefined;
      return pattern ? truncate(pattern, 60) : null;
    }
    case "Glob": {
      const pattern = input.pattern as string | undefined;
      return pattern ? truncate(pattern, 60) : null;
    }
    default:
      return null;
  }
}

function formatInputValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return String(value);
  return JSON.stringify(value, null, 2);
}

// ── Status badge ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: "running" | "success" | "error" }) {
  switch (status) {
    case "running":
      return (
        <Badge
          size="sm"
          className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] gap-1"
        >
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          Running
        </Badge>
      );
    case "success":
      return (
        <Badge
          size="sm"
          className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]"
        >
          Success
        </Badge>
      );
    case "error":
      return (
        <Badge
          size="sm"
          className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]"
        >
          Error
        </Badge>
      );
  }
}

// ── Output renderer (placeholder — RICH.5-7 will add specialized renderers) ──

function OutputRenderer({
  toolName: _toolName,
  output,
  status,
}: {
  toolName: string;
  output?: string;
  status: "running" | "success" | "error";
}) {
  if (status === "running" && !output) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
        <span className="text-xs italic text-muted-foreground">Running...</span>
      </div>
    );
  }

  if (status === "error" && !output) {
    return (
      <div className="px-3 py-2">
        <span className="text-xs text-red-400">Error (no output)</span>
      </div>
    );
  }

  if (!output) return null;

  return (
    <div className="px-3 py-2">
      <pre
        className={cn(
          "text-xs font-mono whitespace-pre-wrap break-words rounded-md bg-muted/50 p-2 max-h-64 overflow-y-auto",
          status === "error" && "text-red-400",
        )}
      >
        {output}
      </pre>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export function ToolCallCard({ block, defaultExpanded }: ToolCallCardProps) {
  const shouldExpandByDefault =
    defaultExpanded ?? EXPANDED_BY_DEFAULT.has(block.toolName);
  const [expanded, setExpanded] = useState(shouldExpandByDefault);

  const Icon = TOOL_ICON_MAP[block.toolName] ?? Wrench;
  const description =
    block.summary || getAutoDescription(block.toolName, block.input);

  const inputEntries = Object.entries(block.input);

  return (
    <div id={block.toolCallId} className="rounded-lg border border-border/60 bg-card/50 overflow-hidden">
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 text-left",
          "hover:bg-muted/40 transition-colors",
        )}
      >
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold shrink-0">{block.toolName}</span>
        {description && (
          <span className="text-xs text-muted-foreground truncate min-w-0">
            {description}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <StatusBadge status={block.status} />
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* Collapsible body */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          {/* Input section */}
          {inputEntries.length > 0 && (
            <div className="border-t border-border/40 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                Input
              </p>
              <div className="space-y-1">
                {inputEntries.map(([key, value]) => {
                  const formatted = formatInputValue(value);
                  const truncated =
                    formatted.length > 100
                      ? formatted.slice(0, 100) + "\u2026"
                      : formatted;
                  return (
                    <div key={key} className="flex gap-2 text-xs">
                      <span className="text-muted-foreground shrink-0 font-medium">
                        {key}:
                      </span>
                      <span
                        className="font-mono text-foreground/80 truncate"
                        title={formatted.length > 100 ? formatted : undefined}
                      >
                        {truncated}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Output section */}
          <div className="border-t border-border/40">
            <OutputRenderer
              toolName={block.toolName}
              output={block.output}
              status={block.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
