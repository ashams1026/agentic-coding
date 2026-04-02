import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Trash2, Clock, Globe, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToastStore } from "@/stores/toast-store";
import { getDeletedWorkItems, restoreWorkItem } from "@/api";
import { useSelectedProject } from "@/hooks/use-selected-project";
import type { WorkItem } from "@agentops/shared";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function formatDeletedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function daysRemaining(deletedAt: string): number {
  const deleted = new Date(deletedAt).getTime();
  const expiry = deleted + THIRTY_DAYS_MS;
  const remaining = expiry - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

export function RecentlyDeleted() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringIds, setRestoringIds] = useState<Set<string>>(new Set());
  const addToast = useToastStore((s) => s.addToast);
  const { projectId, project, isGlobal } = useSelectedProject();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDeletedWorkItems(isGlobal ? undefined : projectId ?? undefined);
      setItems(data);
    } catch {
      // Error toast handled by API layer
    } finally {
      setLoading(false);
    }
  }, [projectId, isGlobal]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRestore = async (item: WorkItem) => {
    setRestoringIds((prev) => new Set(prev).add(item.id));
    try {
      await restoreWorkItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      addToast({ type: "success", title: `"${item.title}" restored` });
    } catch {
      // Error toast handled by API layer (410 = expired, etc.)
    } finally {
      setRestoringIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const scopeLabel = isGlobal ? "Global Workspace" : (project?.name ?? "Current Project");

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium">Recently Deleted</p>
          <Badge variant="outline" className="text-xs px-1.5 py-0 gap-1 text-muted-foreground">
            {isGlobal ? (
              <Globe className="h-3 w-3" />
            ) : (
              <FolderOpen className="h-3 w-3" />
            )}
            {scopeLabel}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Soft-deleted work items are kept for 30 days before permanent removal.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border px-4 py-3">
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
              <div className="ml-auto h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Trash2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No recently deleted items.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const days = item.deletedAt ? daysRemaining(item.deletedAt) : 0;
            const expired = days === 0;
            const isRestoring = restoringIds.has(item.id);

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-md border px-4 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      Deleted {item.deletedAt ? formatDeletedDate(item.deletedAt) : "unknown"}
                    </span>
                    {!expired && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {days}d left
                      </Badge>
                    )}
                  </div>
                </div>

                {expired ? (
                  <Badge variant="secondary" className="text-xs shrink-0 text-muted-foreground">
                    Permanently deleted
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => handleRestore(item)}
                    disabled={isRestoring}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {isRestoring ? "Restoring..." : "Restore"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
