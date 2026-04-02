import { useState } from "react";
import { DollarSign, Zap, CheckCircle2, Clock } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useProjectFromUrl, useExecutionStats, useCostSummary } from "@/hooks";
import { useAnalyticsCostByAgent, useAnalyticsTokensOverTime } from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";

// ── Summary card ────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: color + "15" }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ── Range selector ──────────────────────────────────────────────

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

// ── Agent colors ──────────────────────────────────────────────

const AGENT_COLORS = [
  "#7c3aed", "#2563eb", "#16a34a", "#d97706", "#ea580c",
  "#dc2626", "#059669", "#0891b2", "#db2777", "#4f46e5",
];

// ── Component ───────────────────────────────────────────────────

export function OverviewTab() {
  const [range, setRange] = useState("7d");
  const { projectId, isGlobal } = useProjectFromUrl();
  const effectiveProjectId = isGlobal ? undefined : (projectId ?? undefined);

  const { data: execStats } = useExecutionStats(effectiveProjectId);
  const { data: costSummary } = useCostSummary(effectiveProjectId);
  const { data: costByAgent = [] } = useAnalyticsCostByAgent(effectiveProjectId, range);
  const { data: tokensOverTime = [] } = useAnalyticsTokensOverTime(effectiveProjectId, range);

  const formatDuration = (ms: number) => {
    if (ms === 0) return "0s";
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Cost"
          value={`$${(costSummary?.monthTotal ?? 0).toFixed(2)}`}
          icon={DollarSign}
          color="#2563eb"
        />
        <StatCard
          label="Total Executions"
          value={String(execStats?.totalRuns ?? 0)}
          icon={Zap}
          color="#7c3aed"
        />
        <StatCard
          label="Success Rate"
          value={`${Math.round((execStats?.successRate ?? 0) * 100)}%`}
          icon={CheckCircle2}
          color="#16a34a"
        />
        <StatCard
          label="Avg Duration"
          value={formatDuration(execStats?.averageDurationMs ?? 0)}
          icon={Clock}
          color="#d97706"
        />
      </div>

      {/* Range selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Time range:</span>
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              range === r.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Cost trend line chart */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium mb-4">Cost Trend</h3>
        {tokensOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tokensOverTime}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, "Cost"]}
              />
              <Line
                type="monotone"
                dataKey="costUsd"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex flex-col items-center justify-center text-center">
            <DollarSign className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No cost data</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Run some agents to see cost trends here.</p>
          </div>
        )}
      </div>

      {/* Cost by agent horizontal bar chart */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium mb-4">Cost by Agent</h3>
        {costByAgent.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, costByAgent.length * 40)}>
            <BarChart data={costByAgent} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="agentName" tick={{ fontSize: 11 }} width={100} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, "Cost"]}
              />
              <Bar dataKey="costUsd" radius={[0, 4, 4, 0]}>
                {costByAgent.map((_, i) => (
                  <Cell key={i} fill={AGENT_COLORS[i % AGENT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-center">
            <Zap className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No agent data</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Agent cost breakdown will appear after executions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
