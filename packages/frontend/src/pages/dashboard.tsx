import { useNavigate } from "react-router";
import { Bot, FileCheck, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardStats, useSelectedProject } from "@/hooks";
import { ActiveAgentsStrip } from "@/features/dashboard/active-agents-strip";
import { RecentActivity } from "@/features/dashboard/recent-activity";
import { UpcomingWork } from "@/features/dashboard/upcoming-work";
import { CostSummary } from "@/features/dashboard/cost-summary";


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
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={onClick}
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

export function DashboardPage() {
  const navigate = useNavigate();
  const { projectId } = useSelectedProject();
  const { data: stats, isLoading } = useDashboardStats(projectId ?? undefined);

  const activeAgents = stats?.activeAgents ?? 0;
  const pendingProposals = stats?.pendingProposals ?? 0;
  const needsAttention = stats?.needsAttention ?? 0;
  const todayCost = stats?.todayCostUsd ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            At-a-glance status for your project.
          </p>
        </div>
      </div>

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

      <ActiveAgentsStrip />

      {/* Dashboard widgets */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RecentActivity />
        <UpcomingWork />
        <CostSummary />
      </div>
    </div>
  );
}
