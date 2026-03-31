import { useState, useCallback, useEffect } from "react";
import { FileText, Folder, ChevronRight, Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { browseDirectory, readFilePreview } from "@/api/client";
import type { BrowseDirectoryResult, FilePreview } from "@/api/client";
import { cn } from "@/lib/utils";
import { relative } from "@/lib/path-utils";

// ── Props ────────────────────────────────────────────────────────

interface SkillBrowserProps {
  open: boolean;
  onClose: () => void;
  onAdd: (relativePath: string) => void;
  projectPath: string;
  existingSkills: string[];
}

// ── Component ────────────────────────────────────────────────────

export function SkillBrowser({
  open,
  onClose,
  onAdd,
  projectPath,
  existingSkills,
}: SkillBrowserProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<BrowseDirectoryResult["entries"]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [manualPath, setManualPath] = useState("");

  const browse = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const result = await browseDirectory(path, {
        includeFiles: true,
        fileFilter: ".md",
      });
      setCurrentPath(result.currentPath);
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to browse directory");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPreview = useCallback(async (filePath: string) => {
    setPreviewLoading(true);
    try {
      const result = await readFilePreview(filePath, 20);
      setPreview(result);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Load project directory when dialog opens
  useEffect(() => {
    if (open && projectPath) {
      browse(projectPath);
    }
  }, [open, projectPath, browse]);

  const goUp = () => {
    const parent = currentPath.split("/").slice(0, -1).join("/") || "/";
    browse(parent);
  };

  const getRelativePath = (absolutePath: string): string => {
    return relative(projectPath, absolutePath);
  };

  const isAlreadyAdded = (absolutePath: string): boolean => {
    const rel = getRelativePath(absolutePath);
    return existingSkills.includes(rel);
  };

  const handleAddFile = (absolutePath: string) => {
    const rel = getRelativePath(absolutePath);
    onAdd(rel);
  };

  const handleAddManual = () => {
    const trimmed = manualPath.trim();
    if (!trimmed) return;
    if (!existingSkills.includes(trimmed)) {
      onAdd(trimmed);
    }
    setManualPath("");
  };

  // Breadcrumb segments relative to project path
  const pathSegments = currentPath.split("/").filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Browse Skills</DialogTitle>
        </DialogHeader>

        {/* Manual path input */}
        <div className="flex gap-2">
          <Input
            placeholder="Or type a relative path (e.g., skills/review.md)"
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
            className="text-sm h-8"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 shrink-0"
            onClick={handleAddManual}
            disabled={!manualPath.trim()}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Breadcrumb path bar */}
        <div className="flex items-center gap-0.5 text-xs text-muted-foreground overflow-x-auto py-1 px-1 rounded bg-muted/50">
          <button
            className="shrink-0 px-1 py-0.5 rounded hover:bg-accent hover:text-foreground transition-colors"
            onClick={() => browse("/")}
          >
            /
          </button>
          {pathSegments.map((segment, i) => {
            const fullPath = "/" + pathSegments.slice(0, i + 1).join("/");
            return (
              <span key={fullPath} className="flex items-center gap-0.5">
                <ChevronRight className="h-3 w-3 shrink-0" />
                <button
                  className="px-1 py-0.5 rounded hover:bg-accent hover:text-foreground transition-colors truncate max-w-[120px]"
                  onClick={() => browse(fullPath)}
                >
                  {segment}
                </button>
              </span>
            );
          })}
        </div>

        {/* File/directory listing */}
        <ScrollArea className="h-[280px] rounded border">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-sm text-destructive p-4 text-center">
              {error}
            </div>
          ) : (
            <div className="p-1">
              {/* Go up */}
              {currentPath !== "/" && currentPath !== projectPath && (
                <button
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                  onClick={goUp}
                >
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">..</span>
                </button>
              )}
              {entries.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No .md files or subdirectories
                </p>
              )}
              {entries.map((entry) => {
                const added = !entry.isDirectory && isAlreadyAdded(entry.path);
                return (
                  <div
                    key={entry.path}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors group",
                      entry.isDirectory
                        ? "hover:bg-accent cursor-pointer"
                        : preview?.filePath === entry.path
                          ? "bg-accent/50"
                          : "hover:bg-accent/50",
                    )}
                  >
                    <button
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      onClick={() => {
                        if (entry.isDirectory) {
                          browse(entry.path);
                        } else {
                          loadPreview(entry.path);
                        }
                      }}
                    >
                      {entry.isDirectory ? (
                        <Folder className="h-4 w-4 text-blue-500 shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="truncate">{entry.name}</span>
                    </button>
                    {!entry.isDirectory && (
                      added ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                          Added
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0"
                          onClick={() => handleAddFile(entry.path)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* File preview */}
        {(preview || previewLoading) && (
          <div className="rounded border bg-muted/20 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/40">
              <span className="text-xs font-mono text-muted-foreground truncate">
                {preview?.filePath.split("/").pop() ?? "Loading..."}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {preview && (
                  <span className="text-[10px] text-muted-foreground">
                    {preview.totalLines} lines
                  </span>
                )}
                <button
                  onClick={() => setPreview(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
            <ScrollArea className="max-h-[150px]">
              {previewLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : preview ? (
                <pre className="p-3 text-xs font-mono whitespace-pre-wrap text-foreground/80">
                  {preview.content}
                </pre>
              ) : null}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
