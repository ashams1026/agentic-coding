import { useMemo } from "react";
import {
  Calendar,
  FolderOpen,
  GitBranch,
  Bot,
  RefreshCw,
  Clock,
  ChevronDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useProjects,
  useWorkflows,
  useTriggers,
  usePersonas,
  useExecutions,
} from "@/hooks";
import type { Story } from "@agentops/shared";

// ── Date formatting ─────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Metadata row ────────────────────────────────────────────────

interface MetaRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function MetaRow({ icon, label, value }: MetaRowProps) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="shrink-0 mt-0.5 text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

interface StoryMetadataProps {
  story: Story;
}

export function StoryMetadata({ story }: StoryMetadataProps) {
  const { data: projects = [] } = useProjects();
  const { data: workflows = [] } = useWorkflows();
  const { data: triggers = [] } = useTriggers();
  const { data: personas = [] } = usePersonas();
  const { data: executions = [] } = useExecutions(story.id);

  const project = useMemo(
    () => projects.find((p) => p.id === story.projectId),
    [projects, story.projectId],
  );

  const workflow = useMemo(
    () => workflows.find((w) => w.id === story.workflowId),
    [workflows, story.workflowId],
  );

  // Find the next trigger: what agent is expected to act on this story's current state
  const nextTrigger = useMemo(() => {
    return triggers.find(
      (t) =>
        t.workflowId === story.workflowId && t.fromState === story.currentState,
    );
  }, [triggers, story.workflowId, story.currentState]);

  const triggerPersona = useMemo(() => {
    if (!nextTrigger) return undefined;
    return personas.find((p) => p.id === nextTrigger.personaId);
  }, [nextTrigger, personas]);

  // Check for rejection loop — look for recent rejected executions
  const rejectionCount = useMemo(() => {
    return executions.filter((e) => e.outcome === "rejected").length;
  }, [executions]);

  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group py-1">
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
        <p className="text-sm font-medium text-muted-foreground">
          Story Info
        </p>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 rounded-lg border bg-muted/20 px-4 py-3 space-y-1">
          <MetaRow
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Created"
            value={formatDate(story.createdAt)}
          />

          <MetaRow
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Updated"
            value={formatDate(story.updatedAt)}
          />

          {project && (
            <MetaRow
              icon={<FolderOpen className="h-3.5 w-3.5" />}
              label="Project"
              value={project.name}
            />
          )}

          {workflow && (
            <MetaRow
              icon={<GitBranch className="h-3.5 w-3.5" />}
              label="Workflow"
              value={
                <span>
                  {workflow.name}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({workflow.type})
                  </span>
                </span>
              }
            />
          )}

          <MetaRow
            icon={<Bot className="h-3.5 w-3.5" />}
            label="Trigger Status"
            value={
              nextTrigger && triggerPersona ? (
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: triggerPersona.avatar.color }}
                  />
                  Waiting for {triggerPersona.name}
                </span>
              ) : (
                <span className="text-muted-foreground">No trigger configured</span>
              )
            }
          />

          {rejectionCount > 0 && (
            <MetaRow
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              label="Rejection Loop"
              value={
                <span className="text-amber-600 dark:text-amber-400">
                  {rejectionCount} rejection{rejectionCount !== 1 ? "s" : ""}
                </span>
              }
            />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
