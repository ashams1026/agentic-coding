import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  ArrowRight,
  Rocket,
  X,
  PartyPopper,
  CheckCircle2,
  Globe,
  FolderOpen,
  ClipboardList,
  MessageSquare,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProjects, useWorkItems, useExecutions, useDashboardStats } from "@/hooks";
import { getApiKeyStatus } from "@/api/client";
import { cn } from "@/lib/utils";
import type { Project } from "@agentops/shared";

// ── Relative time formatting ───────────────────────────────────

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diffMs = now - target;

  if (diffMs < 60000) return "just now";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diffMs / 86400000);
  return `${days}d ago`;
}

// ── Onboarding Checklist ────────────────────────────────────────

const ONBOARDING_DISMISSED_KEY = "agentops-onboarding-dismissed";

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  route: string;
  done: boolean;
}

function GettingStartedChecklist() {
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const { data: apiKeyStatus } = useQuery({
    queryKey: ["apiKeyStatus"],
    queryFn: getApiKeyStatus,
    retry: false,
  });
  const { data: workItems } = useWorkItems();
  const { data: executions } = useExecutions();

  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [autoHidden, setAutoHidden] = useState(false);

  const hasProject = (projects ?? []).some((p) => !p.isGlobal);
  const hasApiKey = apiKeyStatus?.configured ?? false;
  const hasWorkItem = (workItems ?? []).length > 0;
  const hasExecution = (executions ?? []).some(
    (e) => e.status === "completed" || e.status === "failed",
  );

  const steps: ChecklistStep[] = [
    {
      id: "project",
      title: "Register a project",
      description: "Create your first project in Settings \u2192 Projects",
      route: "/app-settings",
      done: hasProject,
    },
    {
      id: "apikey",
      title: "Configure API key",
      description: "Add your Claude API key in Settings \u2192 Agent Configuration",
      route: "/app-settings",
      done: hasApiKey,
    },
    {
      id: "workitem",
      title: "Create a work item",
      description: "Add a work item to start tracking work",
      route: "/p/pj-global/items",
      done: hasWorkItem,
    },
    {
      id: "execution",
      title: "Watch an agent run",
      description: "Trigger an agent execution and watch it in Agent Monitor",
      route: "/p/pj-global/monitor",
      done: hasExecution,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  // Auto-hide 4 seconds after all steps are completed
  useEffect(() => {
    if (!allDone) return;
    const timer = setTimeout(() => setAutoHidden(true), 4000);
    return () => clearTimeout(timer);
  }, [allDone]);

  if (dismissed || autoHidden) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Getting Started</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={dismiss}
            aria-label="Dismiss getting started guide"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {allDone
            ? "You\u2019re all set! AgentOps is ready to go."
            : `Welcome to AgentOps! Complete these steps to get up and running. (${completedCount}/${steps.length})`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {allDone ? (
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <PartyPopper className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              All steps completed! Your workspace is ready for action.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => navigate(step.route)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                  "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  step.done && "opacity-60",
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/40 text-xs font-semibold text-muted-foreground">
                    {idx + 1}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.done && "line-through text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {!step.done && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Project Card ────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
  const { data: stats, isLoading: statsLoading } = useDashboardStats(project.id);
  const { data: workItems } = useWorkItems(undefined, project.id);

  const activeAgents = stats?.activeAgents ?? 0;
  const workItemCount = workItems?.length ?? 0;

  // Compute last activity from the most recent work item update
  const lastActivity = workItems?.reduce<string | null>((latest, item) => {
    if (!latest || item.updatedAt > latest) return item.updatedAt;
    return latest;
  }, null);

  return (
    <Card
      className={cn(
        "flex flex-col transition-colors hover:bg-accent/30",
        project.isGlobal && "border-violet-400/40 dark:border-violet-500/30",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {project.isGlobal ? (
            <Globe className="h-5 w-5 text-violet-500 dark:text-violet-400 shrink-0" />
          ) : (
            <FolderOpen className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          <CardTitle className="text-base font-semibold truncate">
            {project.name}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ClipboardList className="h-3.5 w-3.5" />
            <span>
              {statsLoading ? (
                <span className="inline-block h-4 w-6 rounded bg-muted animate-pulse align-middle" />
              ) : (
                <span className="font-medium text-foreground">{workItemCount}</span>
              )}
              {" "}items
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Bot className="h-3.5 w-3.5" />
            <span>
              {statsLoading ? (
                <span className="inline-block h-4 w-6 rounded bg-muted animate-pulse align-middle" />
              ) : (
                <span className={cn("font-medium", activeAgents > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                  {activeAgents}
                </span>
              )}
              {" "}active
            </span>
          </div>
        </div>

        {/* Last activity */}
        <div className="text-xs text-muted-foreground">
          {lastActivity ? (
            <>Last activity: {formatRelativeTime(lastActivity)}</>
          ) : (
            "No activity yet"
          )}
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
            <Link to={`/p/${project.id}/items`}>
              <ClipboardList className="h-3 w-3" />
              Work Items
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
            <Link to={`/p/${project.id}/monitor`}>
              <Activity className="h-3 w-3" />
              Agents
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
            <Link to={`/p/${project.id}/chat`}>
              <MessageSquare className="h-3 w-3" />
              Chat
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Dashboard Page ──────────────────────────────────────────────

export function DashboardPage() {
  const { data: projects, isLoading: projectsLoading } = useProjects();

  // Sort: Global Workspace first, then alphabetically
  const sortedProjects = [...(projects ?? [])].sort((a, b) => {
    if (a.isGlobal && !b.isGlobal) return -1;
    if (!a.isGlobal && b.isGlobal) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of all projects
        </p>
      </div>

      <GettingStartedChecklist />

      {projectsLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48 animate-pulse">
              <CardContent className="flex items-center justify-center h-full">
                <div className="h-6 w-32 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No projects yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
              Create a project in Settings to start orchestrating your AI agents.
            </p>
            <Button variant="outline" size="sm" className="mt-4 gap-1.5" asChild>
              <Link to="/app-settings">
                <ArrowRight className="h-3.5 w-3.5" />
                Go to Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
