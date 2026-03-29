import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useWorkflows,
} from "@/hooks";
import { cn } from "@/lib/utils";
import type { Project, ProjectId, WorkflowId } from "@agentops/shared";

// ── Add / Edit form ────────────────────────────────────────────────

interface ProjectFormProps {
  initial?: { name: string; path: string; workflowId: string };
  onSubmit: (data: { name: string; path: string; workflowId: string }) => void;
  onCancel: () => void;
  submitLabel: string;
}

function ProjectForm({ initial, onSubmit, onCancel, submitLabel }: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [path, setPath] = useState(initial?.path ?? "");
  const [workflowId, setWorkflowId] = useState(initial?.workflowId ?? "");
  const { data: workflows = [] } = useWorkflows();

  const storyWorkflows = workflows.filter((w) => w.type === "story");

  // Simple path validation — non-empty and starts with /
  const pathValid = path.length > 0 && path.startsWith("/");
  const canSubmit = name.trim().length > 0 && path.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), path, workflowId });
  };

  return (
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
        <div className="relative">
          <FolderOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="project-path"
            className="pl-9"
            placeholder="/Users/you/projects/my-project"
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
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

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="project-workflow">Default workflow</label>
        <select
          id="project-workflow"
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
            "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          )}
          value={workflowId}
          onChange={(e) => setWorkflowId(e.target.value)}
        >
          <option value="">None</option>
          {storyWorkflows.map((wf) => (
            <option key={wf.id} value={wf.id}>
              {wf.name}
            </option>
          ))}
        </select>
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
  );
}

// ── Project row ────────────────────────────────────────────────────

interface ProjectRowProps {
  project: Project;
  workflowName: string | null;
  onEdit: () => void;
  onDelete: () => void;
}

function ProjectRow({ project, workflowName, onEdit, onDelete }: ProjectRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3 group">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{project.name}</span>
          {workflowName && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {workflowName}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{project.path}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function ProjectsSection() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: workflows = [] } = useWorkflows();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<ProjectId | null>(null);

  const workflowNameMap = new Map(workflows.map((w) => [w.id, w.name]));

  const handleCreate = (data: { name: string; path: string; workflowId: string }) => {
    createProject.mutate({
      name: data.name,
      path: data.path,
      defaultWorkflowId: data.workflowId ? (data.workflowId as WorkflowId) : undefined,
    });
    setShowAddForm(false);
  };

  const handleUpdate = (id: ProjectId, data: { name: string; path: string; workflowId: string }) => {
    updateProject.mutate({
      id,
      name: data.name,
      path: data.path,
      defaultWorkflowId: data.workflowId ? (data.workflowId as WorkflowId) : null,
    });
    setEditingId(null);
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
            onCancel={() => setShowAddForm(false)}
            submitLabel="Add project"
          />
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
              <ProjectForm
                key={project.id}
                initial={{
                  name: project.name,
                  path: project.path,
                  workflowId: project.defaultWorkflowId ?? "",
                }}
                onSubmit={(data) => handleUpdate(project.id, data)}
                onCancel={() => setEditingId(null)}
                submitLabel="Save changes"
              />
            ) : (
              <ProjectRow
                key={project.id}
                project={project}
                workflowName={project.defaultWorkflowId ? (workflowNameMap.get(project.defaultWorkflowId) ?? null) : null}
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
