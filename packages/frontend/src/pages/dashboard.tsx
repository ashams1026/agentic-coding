import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  FileCheck,
  AlertTriangle,
  DollarSign,
  Layers,
  CheckCircle2,
  ArrowRight,
  Rocket,
  X,
  PartyPopper,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardStats, useSelectedProject, useProjects, useWorkItems, useExecutions } from "@/hooks";
import { getApiKeyStatus } from "@/api/client";
import { ActiveAgentsStrip } from "@/features/dashboard/active-agents-strip";
import { RecentActivity } from "@/features/dashboard/recent-activity";
import { UpcomingWork } from "@/features/dashboard/upcoming-work";
import { CostSummary } from "@/features/dashboard/cost-summary";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBgClass: string;
  onClick: () => void;
}

function StatCard({ title, value, icon, iconBgClass, onClick }: StatCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      className="cursor-pointer transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
    >
      <CardContent className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          {value === "—" ? (
            <div className="h-8 w-12 rounded bg-muted animate-pulse" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AllProjectsSummary() {
  const { data: projectsList } = useProjects();

  if (!projectsList || projectsList.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Layers className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No projects yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
            Create a project in Settings to start orchestrating your AI agents.
          </p>
          <Button variant="outline" size="sm" className="mt-4 gap-1.5" asChild>
            <Link to="/settings">
              <ArrowRight className="h-3.5 w-3.5" />
              Go to Settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Projects Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead className="text-right">Path</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectsList.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-right text-muted-foreground text-xs font-mono truncate max-w-[200px]">
                  {p.path}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {new Date(p.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
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
      route: "/settings",
      done: hasProject,
    },
    {
      id: "apikey",
      title: "Configure API key",
      description: "Add your Claude API key in Settings \u2192 Agent Configuration",
      route: "/settings",
      done: hasApiKey,
    },
    {
      id: "workitem",
      title: "Create a work item",
      description: "Add a work item to start tracking work",
      route: "/items",
      done: hasWorkItem,
    },
    {
      id: "execution",
      title: "Watch an agent run",
      description: "Trigger an agent execution and watch it in Agent Monitor",
      route: "/agents",
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

export function DashboardPage() {
  const navigate = useNavigate();
  const { projectId, isGlobal } = useSelectedProject();
  const { data: stats, isLoading } = useDashboardStats(projectId ?? undefined);

  const activeAgents = stats?.activeAgents ?? 0;
  const pendingProposals = stats?.pendingProposals ?? 0;
  const needsAttention = stats?.needsAttention ?? 0;
  const todayCost = stats?.todayCostUsd ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {isGlobal ? (
              <>
                All Projects
                <Badge variant="secondary" className="text-xs font-normal">Global</Badge>
              </>
            ) : (
              "Dashboard"
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isGlobal
              ? "Aggregated status across all projects."
              : "At-a-glance status for your project."}
          </p>
        </div>
      </div>

      <GettingStartedChecklist />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Agents"
          value={isLoading ? "—" : String(activeAgents)}
          icon={<Bot className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
          iconBgClass="bg-emerald-100 dark:bg-emerald-900/30"
          onClick={() => navigate("/agents")}
        />
        <StatCard
          title="Pending Proposals"
          value={isLoading ? "—" : String(pendingProposals)}
          icon={<FileCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
          iconBgClass="bg-amber-100 dark:bg-amber-900/30"
          onClick={() => navigate("/items")}
        />
        <StatCard
          title="Needs Attention"
          value={isLoading ? "—" : String(needsAttention)}
          icon={<AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />}
          iconBgClass="bg-red-100 dark:bg-red-900/30"
          onClick={() => navigate("/activity")}
        />
        <StatCard
          title="Today's Cost"
          value={isLoading ? "—" : `$${todayCost.toFixed(2)}`}
          icon={<DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
          iconBgClass="bg-blue-100 dark:bg-blue-900/30"
          onClick={() => navigate("/settings")}
        />
      </div>

      {isGlobal ? (
        <AllProjectsSummary />
      ) : (
        <>
          <ActiveAgentsStrip />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <RecentActivity />
            <UpcomingWork />
            <CostSummary />
          </div>
        </>
      )}
    </div>
  );
}
