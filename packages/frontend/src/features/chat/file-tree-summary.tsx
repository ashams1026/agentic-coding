import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Pencil,
  Plus,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolUseBlock } from "./tool-call-card";

// ── Types ─────────────────────────────────────────────────────────

interface FileTreeSummaryProps {
  toolCalls: ToolUseBlock[];
}

interface FileEntry {
  basename: string;
  filePath: string;
  toolCallId: string;
  kind: "edit" | "write";
  adds: number;
  removes: number;
}

interface TreeNode {
  name: string;
  /** Full directory path for this node (empty string for root) */
  children: Map<string, TreeNode>;
  files: FileEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────

const FILE_TOOLS = new Set(["Edit", "Write"]);

function countLines(s: unknown): number {
  if (typeof s !== "string" || s.length === 0) return 0;
  return s.split("\n").length;
}

function computeLineStats(
  toolName: string,
  input: Record<string, unknown>,
): { adds: number; removes: number } {
  if (toolName === "Write") {
    return { adds: countLines(input.content), removes: 0 };
  }
  // Edit
  const oldLines = countLines(input.old_string);
  const newLines = countLines(input.new_string);
  return { adds: newLines, removes: oldLines };
}

function buildTree(entries: FileEntry[]): TreeNode {
  const root: TreeNode = { name: "", children: new Map(), files: [] };

  for (const entry of entries) {
    const segments = entry.filePath.split("/");
    const fileName = segments.pop()!;
    let current = root;

    for (const seg of segments) {
      if (!seg) continue; // skip leading empty segment from absolute paths
      if (!current.children.has(seg)) {
        current.children.set(seg, {
          name: seg,
          children: new Map(),
          files: [],
        });
      }
      current = current.children.get(seg)!;
    }

    current.files.push({ ...entry, basename: fileName });
  }

  return collapseTree(root);
}

/**
 * Collapse single-child directory chains into combined names.
 * e.g. `src` -> `components` -> `ui` becomes `src/components/ui`
 */
function collapseTree(node: TreeNode): TreeNode {
  // First, recursively collapse children
  const collapsedChildren = new Map<string, TreeNode>();
  for (const [key, child] of node.children) {
    collapsedChildren.set(key, collapseTree(child));
  }
  node.children = collapsedChildren;

  // If this node has exactly one child directory and no files, merge them
  if (node.children.size === 1 && node.files.length === 0) {
    const [, onlyChild] = [...node.children.entries()][0]!;
    const mergedName = node.name
      ? `${node.name}/${onlyChild.name}`
      : onlyChild.name;
    return {
      name: mergedName,
      children: onlyChild.children,
      files: onlyChild.files,
    };
  }

  return node;
}

// ── Sub-components ────────────────────────────────────────────────

function FileRow({ entry }: { entry: FileEntry }) {
  const handleClick = () => {
    document
      .getElementById(entry.toolCallId)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1.5 py-0.5 w-full text-left group",
        "hover:bg-muted/40 rounded px-1 -mx-1 transition-colors",
      )}
    >
      {entry.kind === "edit" ? (
        <Pencil className="h-3 w-3 text-amber-400 shrink-0" />
      ) : (
        <Plus className="h-3 w-3 text-emerald-400 shrink-0" />
      )}
      <FileCode className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-xs text-foreground/90 truncate group-hover:underline underline-offset-2">
        {entry.basename}
      </span>
      <span className="ml-auto text-[10px] font-mono text-muted-foreground shrink-0">
        {entry.adds > 0 && (
          <span className="text-emerald-400">+{entry.adds}</span>
        )}
        {entry.adds > 0 && entry.removes > 0 && (
          <span className="text-muted-foreground">, </span>
        )}
        {entry.removes > 0 && (
          <span className="text-red-400">-{entry.removes}</span>
        )}
      </span>
    </button>
  );
}

function DirectoryNode({
  node,
  depth,
}: {
  node: TreeNode;
  depth: number;
}) {
  // Sort children alphabetically, files alphabetically
  const sortedDirs = [...node.children.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const sortedFiles = [...node.files].sort((a, b) =>
    a.basename.localeCompare(b.basename),
  );

  return (
    <div style={{ paddingLeft: depth > 0 ? 12 : 0 }}>
      {/* Directory label (skip for root) */}
      {node.name && (
        <div className="flex items-center gap-1.5 py-0.5">
          <Folder className="h-3 w-3 text-blue-400 dark:text-blue-300 shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">
            {node.name}
          </span>
        </div>
      )}

      {/* Child directories */}
      {sortedDirs.map((child) => (
        <DirectoryNode key={child.name} node={child} depth={depth + 1} />
      ))}

      {/* Files at this level */}
      <div style={{ paddingLeft: node.name ? 12 : 0 }}>
        {sortedFiles.map((file) => (
          <FileRow key={file.toolCallId} entry={file} />
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export function FileTreeSummary({ toolCalls }: FileTreeSummaryProps) {
  const fileEntries = useMemo(() => {
    const entries: FileEntry[] = [];
    for (const tc of toolCalls) {
      if (!FILE_TOOLS.has(tc.toolName)) continue;
      const filePath = tc.input.file_path as string | undefined;
      if (!filePath) continue;

      const { adds, removes } = computeLineStats(tc.toolName, tc.input);
      entries.push({
        basename: filePath.split("/").pop() || filePath,
        filePath,
        toolCallId: tc.toolCallId,
        kind: tc.toolName === "Edit" ? "edit" : "write",
        adds,
        removes,
      });
    }
    return entries;
  }, [toolCalls]);

  const tree = useMemo(() => buildTree(fileEntries), [fileEntries]);

  const [expanded, setExpanded] = useState(fileEntries.length <= 10);

  // Only render when 2+ file-changing tool calls
  if (fileEntries.length < 2) return null;

  const totalAdds = fileEntries.reduce((sum, e) => sum + e.adds, 0);
  const totalRemoves = fileEntries.reduce((sum, e) => sum + e.removes, 0);

  return (
    <div
      className={cn(
        "rounded-md border border-border/50",
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
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {fileEntries.length} files changed
        </span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground shrink-0">
          {totalAdds > 0 && (
            <span className="text-emerald-400">+{totalAdds}</span>
          )}
          {totalAdds > 0 && totalRemoves > 0 && (
            <span className="text-muted-foreground"> / </span>
          )}
          {totalRemoves > 0 && (
            <span className="text-red-400">-{totalRemoves}</span>
          )}
        </span>
      </button>

      {/* Body — collapsible tree */}
      {expanded && (
        <div className="border-t border-border/50 px-3 py-2">
          <DirectoryNode node={tree} depth={0} />
        </div>
      )}
    </div>
  );
}
