import { useState, useCallback } from "react";
import { AlertTriangle, Clock, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { rewindExecution } from "@/api";
import type { RewindResult } from "@/api/client";
import { useToastStore } from "@/stores/toast-store";
import type { Execution } from "@agentops/shared";

// ── Helpers ───────────────────────────────────────────────────────

export function formatTimeAgo(date: Date | string): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
}

// ── Rewind button ────────────────────────────────────────────────

interface RewindButtonProps {
  execution: Execution;
}

export function RewindButton({ execution }: RewindButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<RewindResult | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  const hasCheckpoint = !!execution.checkpointMessageId;
  const isCompleted = execution.status !== "running";

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't toggle row expansion
    if (!hasCheckpoint || !isCompleted) return;
    setLoading(true);
    try {
      const result = await rewindExecution(execution.id, true);
      setPreview(result);
      setDialogOpen(true);
    } catch (err) {
      addToast({
        type: "error",
        title: "Rewind preview failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, [execution.id, hasCheckpoint, isCompleted, addToast]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      const result = await rewindExecution(execution.id, false);
      setDialogOpen(false);
      setPreview(null);
      addToast({
        type: "success",
        title: "Files rewound",
        description: `${result.filesChanged.length} files reverted (+${result.insertions}/-${result.deletions} lines)`,
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Rewind failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, [execution.id, addToast]);

  if (!isCompleted) return null;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={!hasCheckpoint || loading}
                onClick={handleClick}
              >
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {hasCheckpoint
              ? "Revert all file changes made by this agent run"
              : "No file checkpoint available (legacy execution)"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rewind file changes?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will revert all file changes made by this agent execution
                  to their pre-execution state.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>
                    {execution.completedAt
                      ? `This execution completed ${formatTimeAgo(execution.completedAt)}`
                      : "Execution completion time unknown"}
                  </span>
                </div>
                {preview?.conflicts && preview.conflicts.length > 0 && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>{preview.conflicts.length} file{preview.conflicts.length !== 1 ? "s" : ""} modified since this execution</span>
                    </div>
                    <ul className="text-xs text-amber-300/80 space-y-1">
                      {preview.conflicts.map((c) => (
                        <li key={c.filePath} className="flex items-start gap-1.5">
                          <span className="font-mono truncate flex-1">{c.filePath.split("/").pop()}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {c.modifiedBy ? `by ${c.modifiedBy}` : formatTimeAgo(c.modifiedAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-amber-400/70 mt-2">
                      Reverting will overwrite these changes.
                    </p>
                  </div>
                )}
                {preview && preview.filesChanged.length > 0 && (
                  <div className="rounded-md border bg-muted/50 p-3">
                    <p className="text-xs font-medium mb-2">
                      {preview.filesChanged.length} file{preview.filesChanged.length !== 1 ? "s" : ""} will be reverted
                      <span className="text-muted-foreground ml-1">
                        (+{preview.insertions}/-{preview.deletions} lines)
                      </span>
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-0.5 max-h-[200px] overflow-auto">
                      {preview.filesChanged.map((f) => {
                        const isConflicted = preview.conflicts?.some((c) => c.filePath === f);
                        return (
                          <li key={f} className="font-mono truncate flex items-center gap-1">
                            {isConflicted && <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />}
                            {f}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {preview && preview.filesChanged.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No files were changed by this execution.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? "Rewinding..." : "Rewind Files"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
