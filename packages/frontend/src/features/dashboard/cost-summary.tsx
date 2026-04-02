import { Link } from "react-router";
import { DollarSign } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { useCostSummary, useSelectedProject } from "@/hooks";

// ── Sparkline tooltip ────────────────────────────────────────────

interface SparklineTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function SparklineTooltip({ active, payload, label }: SparklineTooltipProps) {
  const entry = payload?.[0];
  if (!active || !entry) return null;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">${entry.value.toFixed(2)}</p>
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────

function CostProgressBar({
  current,
  cap,
}: {
  current: number;
  cap: number;
}) {
  const pct = cap > 0 ? Math.min((current / cap) * 100, 100) : 0;
  const isWarning = pct >= 80;
  const isDanger = pct >= 95;

  const barColor = isDanger
    ? "bg-red-500"
    : isWarning
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Monthly: <span className="font-medium text-foreground">${current.toFixed(2)}</span>
        </span>
        <span className="text-muted-foreground">
          Cap: ${cap.toFixed(2)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Format date for X axis ───────────────────────────────────────

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

// ── Component ────────────────────────────────────────────────────

export function CostSummary() {
  const { projectId } = useSelectedProject();
  const { data: costData } = useCostSummary(projectId ?? undefined);

  const dailySpend = costData?.dailySpend ?? [];
  const monthTotal = costData?.monthTotal ?? 0;
  const monthCap = costData?.monthCap ?? 50;

  const lastDay = dailySpend[dailySpend.length - 1];
  const todaySpend = lastDay?.costUsd ?? 0;

  const chartData = dailySpend.map((d) => ({
    name: formatDay(d.date),
    cost: d.costUsd,
  }));

  return (
    <Card>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Cost Summary
          </p>
          <Link
            to="/settings"
            className="text-xs text-primary hover:underline"
          >
            Settings
          </Link>
        </div>

        {/* Today's spend */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">
              ${todaySpend.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">today</p>
          </div>
        </div>

        {/* Sparkline chart — last 7 days */}
        <div className="mb-4 h-[80px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  dy={4}
                />
                <YAxis hide />
                <Tooltip content={<SparklineTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={1.5}
                  fill="url(#costGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col h-full items-center justify-center text-center">
              <DollarSign className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No spend data yet</p>
            </div>
          )}
        </div>

        {/* Month progress */}
        <CostProgressBar current={monthTotal} cap={monthCap} />
      </CardContent>
    </Card>
  );
}
