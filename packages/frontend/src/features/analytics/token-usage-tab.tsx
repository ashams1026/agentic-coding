import { useState } from "react";
import { BarChart3, DollarSign, PieChart as PieChartIcon } from "lucide-react";
import {
  ComposedChart, Line, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useSelectedProject } from "@/hooks";
import {
  useAnalyticsTokensOverTime,
  useAnalyticsCostByModel,
  useAnalyticsTopExecutions,
} from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";

// ── Constants ───────────────────────────────────────────────────

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const MODEL_COLORS: Record<string, string> = {
  opus: "#7c3aed",
  sonnet: "#2563eb",
  haiku: "#16a34a",
  unknown: "#6b7280",
};

function getModelColor(model: string): string {
  return MODEL_COLORS[model] ?? "#6b7280";
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(ms: number): string {
  if (ms === 0) return "0s";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

// ── Component ───────────────────────────────────────────────────

export function TokenUsageTab() {
  const [range, setRange] = useState("7d");
  const { projectId, isGlobal } = useSelectedProject();
  const effectiveProjectId = isGlobal ? undefined : (projectId ?? undefined);

  const { data: tokensOverTime = [] } = useAnalyticsTokensOverTime(effectiveProjectId, range);
  const { data: costByModel = [] } = useAnalyticsCostByModel(effectiveProjectId, range);
  const { data: topExecutions = [] } = useAnalyticsTopExecutions(effectiveProjectId, 10);

  return (
    <div className="space-y-6">
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

      {/* Token usage over time — dual axis */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium mb-4">Token Usage Over Time</h3>
        {tokensOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={tokensOverTime}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis yAxisId="tokens" tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={formatTokens} />
              <YAxis yAxisId="cost" orientation="right" tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={(value, name) => [name === "costUsd" ? `$${Number(value).toFixed(2)}` : formatTokens(Number(value)), name === "costUsd" ? "Cost" : "Tokens"]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="tokens" dataKey="totalTokens" name="Tokens" fill="#7c3aed" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
              <Line yAxisId="cost" type="monotone" dataKey="costUsd" name="Cost" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No token data</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Token usage will appear after agent executions.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model breakdown pie chart */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium mb-4">Breakdown by Model</h3>
          {costByModel.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={costByModel}
                  dataKey="totalTokens"
                  nameKey="model"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }: any) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {costByModel.map((entry) => (
                    <Cell key={entry.model} fill={getModelColor(entry.model)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(value) => [formatTokens(Number(value)), "Tokens"]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex flex-col items-center justify-center text-center">
              <PieChartIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No model data</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Model breakdown will appear after executions.</p>
            </div>
          )}
          {/* Model legend */}
          {costByModel.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {costByModel.map((m) => (
                <div key={m.model} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getModelColor(m.model) }} />
                  <span className="text-muted-foreground">{m.model}</span>
                  <span className="font-medium">${m.costUsd.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top executions table */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium mb-4">Most Expensive Executions</h3>
          {topExecutions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-3 font-medium">Date</th>
                    <th className="text-left py-2 pr-3 font-medium">Agent</th>
                    <th className="text-left py-2 pr-3 font-medium">Model</th>
                    <th className="text-right py-2 pr-3 font-medium">Tokens</th>
                    <th className="text-right py-2 pr-3 font-medium">Cost</th>
                    <th className="text-right py-2 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {topExecutions.map((e) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 text-muted-foreground">
                        {e.startedAt ? new Date(e.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </td>
                      <td className="py-2 pr-3">{e.agentName}</td>
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getModelColor(e.model) }} />
                          {e.model}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right font-mono">{formatTokens(e.totalTokens)}</td>
                      <td className="py-2 pr-3 text-right font-mono">${e.costUsd.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono">{formatDuration(e.durationMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[250px] flex flex-col items-center justify-center text-center">
              <DollarSign className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No executions yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">The most expensive executions will be listed here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
