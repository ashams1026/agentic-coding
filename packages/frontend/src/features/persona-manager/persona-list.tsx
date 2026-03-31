import { useState } from "react";
import {
  ClipboardList,
  Code,
  Copy,
  Eye,
  GitBranch,
  Plus,
  TestTube,
  Trash2,
  Bot,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { usePersonas, useCreatePersona, useDeletePersona } from "@/hooks";
import { cn } from "@/lib/utils";
import type { Persona, PersonaId, PersonaModel } from "@agentops/shared";

// ── Icon map ────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  "clipboard-list": ClipboardList,
  "git-branch": GitBranch,
  code: Code,
  eye: Eye,
  "test-tube": TestTube,
  bot: Bot,
};

function getPersonaIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? Bot;
}

// ── Model badge config ──────────────────────────────────────────

const MODEL_CONFIG: Record<PersonaModel, { label: string; className: string }> = {
  opus: {
    label: "Opus",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  sonnet: {
    label: "Sonnet",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  haiku: {
    label: "Haiku",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
};

// ── Built-in persona IDs ────────────────────────────────────────

const BUILT_IN_IDS = new Set<string>([
  "ps-pm00001",
  "ps-tl00001",
  "ps-en00001",
  "ps-rv00001",
  "ps-qa00001",
]);

// ── Props ───────────────────────────────────────────────────────

interface PersonaListProps {
  selectedId: PersonaId | null;
  onSelect: (id: PersonaId) => void;
}

// ── Persona card ────────────────────────────────────────────────

interface PersonaCardProps {
  persona: Persona;
  isBuiltIn: boolean;
  isAssistant: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function PersonaCard({ persona, isBuiltIn, isAssistant, isSelected, onSelect, onDuplicate, onDelete }: PersonaCardProps) {
  const Icon = getPersonaIcon(persona.avatar.icon);
  const model = MODEL_CONFIG[persona.model];
  const toolCount = persona.allowedTools.length + persona.mcpTools.length;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative rounded-lg border border-border bg-card transition-all duration-200 cursor-pointer",
        "hover:shadow-md hover:border-border/80",
        isSelected && "shadow-md border-primary/50 ring-1 ring-primary/20",
      )}
    >
      <div className="p-4">
        {/* Hover actions — hidden for assistant personas */}
        {!isAssistant && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              title="Duplicate"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Avatar */}
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center mb-3"
          style={{ backgroundColor: persona.avatar.color + "20" }}
        >
          <Icon className="h-5 w-5" style={{ color: persona.avatar.color }} />
        </div>

        {/* Name + badges */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold truncate">{persona.name}</h3>
          {isBuiltIn && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
              Built-in
            </Badge>
          )}
        </div>

        {/* Model badge */}
        <Badge
          variant="outline"
          className={cn("text-xs px-1.5 py-0 border-0 mb-2", model.className)}
        >
          {model.label}
        </Badge>

        {/* Description — 2 lines */}
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
          {persona.description}
        </p>

        {/* Tool count pill */}
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {toolCount} tool{toolCount !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ── Create card ─────────────────────────────────────────────────

interface CreateCardProps {
  onClick: () => void;
  isPending: boolean;
}

function CreateCard({ onClick, isPending }: CreateCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className={cn(
        "rounded-lg border-2 border-dashed border-border bg-card/50 p-4",
        "flex flex-col items-center justify-center gap-2 min-h-[180px]",
        "transition-colors hover:border-primary/50 hover:bg-accent/30",
        "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Plus className="h-5 w-5 text-muted-foreground" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">
        Create new persona
      </span>
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────

export function PersonaList({ selectedId, onSelect }: PersonaListProps) {
  const { data: personas } = usePersonas();
  const createMutation = useCreatePersona();
  const deleteMutation = useDeletePersona();
  const [deleteTarget, setDeleteTarget] = useState<Persona | null>(null);

  const handleCreate = () => {
    createMutation.mutate(
      {
        name: "New Persona",
        systemPrompt: "You are a helpful assistant.",
        model: "sonnet",
        allowedTools: ["Read", "Glob", "Grep"],
        mcpTools: [],
      },
      {
        onSuccess: (p) => {
          onSelect(p.id);
        },
      },
    );
  };

  const handleDuplicate = (persona: Persona) => {
    createMutation.mutate(
      {
        name: `${persona.name} (copy)`,
        description: persona.description,
        avatar: { ...persona.avatar },
        systemPrompt: persona.systemPrompt,
        model: persona.model,
        allowedTools: [...persona.allowedTools],
        mcpTools: [...persona.mcpTools],
        maxBudgetPerRun: persona.maxBudgetPerRun,
      },
      {
        onSuccess: (p) => {
          onSelect(p.id);
        },
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
      },
    });
  };

  if (!personas) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-muted-foreground">Loading personas...</p>
      </div>
    );
  }

  if (personas.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <div>
            <p className="text-sm font-medium">No personas yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Set up your team of AI agents.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5" />
            Create your first persona
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((p) => (
          <PersonaCard
            key={p.id as string}
            persona={p}
            isBuiltIn={BUILT_IN_IDS.has(p.id as string)}
            isAssistant={p.settings?.isAssistant === true}
            isSelected={selectedId === p.id}
            onSelect={() => onSelect(p.id)}
            onDuplicate={() => handleDuplicate(p)}
            onDelete={() => setDeleteTarget(p)}
          />
        ))}
        <CreateCard onClick={handleCreate} isPending={createMutation.isPending} />
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete persona</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
              {deleteTarget && BUILT_IN_IDS.has(deleteTarget.id as string) && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                  Warning: This is a built-in persona. You can recreate it from defaults later.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
