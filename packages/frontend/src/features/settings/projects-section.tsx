import { useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  Folder,
  Check,
  AlertCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks";
import { browseDirectory } from "@/api/client";
import type { BrowseDirectoryResult } from "@/api/client";
import type { Project, ProjectId } from "@agentops/shared";

// ── Folder Browser Modal ──────────────────────────────────────────

interface FolderBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  initialPath?: string;
}

function FolderBrowser({ open, onClose, onSelect, initialPath }: FolderBrowserProps) {
  const [currentPath, setCurrentPath] = useState(initialPath || "");
  const [entries, setEntries] = useState<BrowseDirectoryResult["entries"]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const browse = useCallback(async (path?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await browseDirectory(path);
      setCurrentPath(result.currentPath);
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to browse directory");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial directory when dialog opens
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        browse(initialPath || undefined);
      } else {
        onClose();
      }
    },
    [browse, initialPath, onClose],
  );

  // Navigate to parent
  const goUp = () => {
    const parent = currentPath.split("/").slice(0, -1).join("/") || "/";
    browse(parent);
  };

  // Breadcrumb segments
  const pathSegments = currentPath.split("/").filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Browse Folders</DialogTitle>
        </DialogHeader>

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

        {/* Directory listing */}
        <ScrollArea className="h-[300px] rounded border">
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
              {/* Go up entry */}
              {currentPath !== "/" && (
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
                  No subdirectories
                </p>
              )}
              {entries.map((entry) => (
                <button
                  key={entry.path}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                  onClick={() => browse(entry.path)}
                >
                  <Folder className="h-4 w-4 text-blue-500" />
                  <span className="truncate">{entry.name}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Current selection */}
        <div className="text-xs text-muted-foreground truncate">
          Selected: <span className="font-medium text-foreground">{currentPath}</span>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSelect(currentPath);
              onClose();
            }}
          >
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add / Edit form ────────────────────────────────────────────────

interface ProjectFormProps {
  initial?: { name: string; path: string };
  onSubmit: (data: { name: string; path: string }) => void;
  onCancel: () => void;
  submitLabel: string;
}

function ProjectForm({ initial, onSubmit, onCancel, submitLabel }: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [path, setPath] = useState(initial?.path ?? "");
  const [showBrowser, setShowBrowser] = useState(false);

  // Simple path validation — non-empty and starts with /
  const pathValid = path.length > 0 && path.startsWith("/");
  const canSubmit = name.trim().length > 0 && path.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), path });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="project-name">Project name</label>
          <Input
            id="project-name"
            placeholder="My Project"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="project-path">Project path</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FolderOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="project-path"
                className="pl-9"
                placeholder="/Users/you/projects/my-project"
                value={path}
                onChange={(e) => setPath(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setShowBrowser(true)}
            >
              Browse...
            </Button>
          </div>
          {path.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              {pathValid ? (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Valid path format</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">Path should be absolute (start with /)</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button type="submit" size="sm" disabled={!canSubmit}>
            {submitLabel}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>

      <FolderBrowser
        open={showBrowser}
        onClose={() => setShowBrowser(false)}
        onSelect={(selectedPath) => setPath(selectedPath)}
        initialPath={path || undefined}
      />
    </>
  );
}

// ── Project row ────────────────────────────────────────────────────

interface ProjectRowProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}

function ProjectRow({ project, onEdit, onDelete }: ProjectRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3 group">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{project.name}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{project.path}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon-sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function ProjectsSection() {
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<ProjectId | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = (data: { name: string; path: string }) => {
    setFormError(null);
    createProject.mutate(
      { name: data.name, path: data.path },
      {
        onSuccess: () => setShowAddForm(false),
        onError: (err) => setFormError(err instanceof Error ? err.message : "Failed to create project"),
      },
    );
  };

  const handleUpdate = (id: ProjectId, data: { name: string; path: string }) => {
    setFormError(null);
    updateProject.mutate(
      { id, name: data.name, path: data.path },
      {
        onSuccess: () => setEditingId(null),
        onError: (err) => setFormError(err instanceof Error ? err.message : "Failed to update project"),
      },
    );
  };

  const handleDelete = (id: ProjectId) => {
    deleteProject.mutate(id);
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading projects...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Registered projects that agents can work on.
        </p>
        {!showAddForm && (
          <Button size="sm" className="gap-1.5" onClick={() => setShowAddForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add project
          </Button>
        )}
      </div>

      {showAddForm && (
        <>
          <ProjectForm
            onSubmit={handleCreate}
            onCancel={() => { setShowAddForm(false); setFormError(null); }}
            submitLabel="Add project"
          />
          {formError && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" />
              {formError}
            </p>
          )}
          <Separator />
        </>
      )}

      {projects.length === 0 && !showAddForm ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground/60">
          <FolderOpen className="h-8 w-8" />
          <p className="text-sm">No projects registered yet.</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 mt-1"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add your first project
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) =>
            editingId === project.id ? (
              <div key={project.id} className="space-y-2">
                <ProjectForm
                  initial={{
                    name: project.name,
                    path: project.path,
                  }}
                  onSubmit={(data) => handleUpdate(project.id, data)}
                  onCancel={() => { setEditingId(null); setFormError(null); }}
                  submitLabel="Save changes"
                />
                {formError && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3" />
                    {formError}
                  </p>
                )}
              </div>
            ) : (
              <ProjectRow
                key={project.id}
                project={project}
                onEdit={() => setEditingId(project.id)}
                onDelete={() => handleDelete(project.id)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
