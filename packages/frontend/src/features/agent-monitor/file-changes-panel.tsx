import { useEffect, useState } from "react";
import { FileText, FilePlus, FileX, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { subscribe } from "@/api/ws";
import type { ExecutionId } from "@agentops/shared";

interface FileChange {
  filePath: string;
  changeType: "created" | "modified" | "deleted";
  timestamp: string;
}

const CHANGE_ICONS = {
  created: FilePlus,
  modified: FileText,
  deleted: FileX,
} as const;

const CHANGE_COLORS = {
  created: "text-emerald-400",
  modified: "text-amber-400",
  deleted: "text-red-400",
} as const;

const CHANGE_LABELS = {
  created: "Created",
  modified: "Modified",
  deleted: "Deleted",
} as const;

interface FileChangesPanelProps {
  executionId: ExecutionId;
}

export function FileChangesPanel({ executionId }: FileChangesPanelProps) {
  const [files, setFiles] = useState<FileChange[]>([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setFiles([]);
  }, [executionId]);

  useEffect(() => {
    const unsubscribe = subscribe("file_changed", (event) => {
      if (event.executionId !== executionId) return;

      setFiles((prev) => {
        const existing = prev.findIndex((f) => f.filePath === event.filePath);
        const entry: FileChange = {
          filePath: event.filePath,
          changeType: event.changeType,
          timestamp: event.timestamp,
        };
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = entry;
          return updated;
        }
        return [...prev, entry];
      });
    });

    return unsubscribe;
  }, [executionId]);

  if (files.length === 0) return null;

  return (
    <div className="border-t border-zinc-800">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-2 text-xs hover:bg-zinc-900/50 transition-colors"
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 text-zinc-500 transition-transform",
            !expanded && "-rotate-90",
          )}
        />
        <span className="font-medium text-zinc-300">Files</span>
        <Badge
          variant="secondary"
          className="h-4 min-w-4 px-1 text-[10px] font-bold"
        >
          {files.length}
        </Badge>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-0.5">
          {files.map((file) => {
            const Icon = CHANGE_ICONS[file.changeType];
            const color = CHANGE_COLORS[file.changeType];
            const label = CHANGE_LABELS[file.changeType];
            const time = new Date(file.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            return (
              <div
                key={file.filePath}
                className="flex items-center gap-2 py-1 text-xs font-mono"
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
                <span className="truncate text-zinc-300 flex-1">
                  {file.filePath}
                </span>
                <span className={cn("shrink-0 text-[10px]", color)}>
                  {label}
                </span>
                <span className="shrink-0 text-zinc-600 text-[10px]">
                  {time}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
