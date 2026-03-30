import { useState, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Mock 30-day cost data ──────────────────────────────────────────

function generate30DayData(): { date: string; day: string; cost: number }[] {
  const now = new Date();
  const data: { date: string; day: string; cost: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    // Pseudo-random cost based on date for stable mock
    const seed = d.getDate() + d.getMonth() * 31;
    const cost = i === 0 ? 1.23 : +(((seed * 17 + 7) % 500) / 100).toFixed(2);
    data.push({ date: dateStr, day: dayLabel, cost });
  }
  return data;
}

// ── Chart tooltip ──────────────────────────────────────────────────

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  const entry = payload?.[0];
  if (!active || !entry) return null;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">${entry.value.toFixed(2)}</p>
    </div>
  );
}

// ── Cost cap section ───────────────────────────────────────────────

function CostCapSection() {
  const [monthlyCap, setMonthlyCap] = useState(50);
  const [warningThreshold, setWarningThreshold] = useState(80);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [dailyEnabled, setDailyEnabled] = useState(false);

  // Mock current spend
  const currentMonthSpend = 32.47;
  const pct = monthlyCap > 0 ? Math.min((currentMonthSpend / monthlyCap) * 100, 100) : 0;
  const isWarning = pct >= warningThreshold;
  const isDanger = pct >= 95;

  const barColor = isDanger
    ? "bg-red-500"
    : isWarning
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="space-y-5">
      {/* Monthly cost cap */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium mb-1">Monthly Cost Cap</p>
          <p className="text-xs text-muted-foreground mb-3">
            Maximum monthly spend across all agents. Agents will pause when the cap is reached.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-[140px]">
            <span className="absolute left-3 top-2 text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              min={0}
              value={monthlyCap}
              onChange={(e) => setMonthlyCap(Number(e.target.value))}
              className="pl-7 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground">per month</span>
        </div>

        {/* Progress bar */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Current: <span className="font-medium text-foreground">${currentMonthSpend.toFixed(2)}</span>
            </span>
            <span className="text-muted-foreground">
              {pct.toFixed(0)}% of ${monthlyCap.toFixed(2)}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-300", barColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
          {isWarning && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              <span>Approaching cost cap ({pct.toFixed(0)}% used)</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Warning threshold */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium mb-1">Warning Threshold</p>
          <p className="text-xs text-muted-foreground mb-3">
            Show a warning when spend reaches this percentage of the monthly cap.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            max={100}
            value={warningThreshold}
            onChange={(e) => setWarningThreshold(Math.min(100, Math.max(0, Number(e.target.value))))}
            className="w-[100px] text-sm"
          />
          <span className="text-xs text-muted-foreground">% of monthly cap</span>
        </div>
      </div>

      <Separator />

      {/* Daily spend limit */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium mb-1">Daily Spend Limit</p>
            <p className="text-xs text-muted-foreground">
              Optional. Cap daily spend independently from the monthly limit.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDailyEnabled(!dailyEnabled);
              if (!dailyEnabled) setDailyLimit(10);
            }}
          >
            {dailyEnabled ? "Disable" : "Enable"}
          </Button>
        </div>

        {dailyEnabled && (
          <div className="flex items-center gap-3">
            <div className="relative w-[140px]">
              <span className="absolute left-3 top-2 text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                min={0}
                value={dailyLimit ?? ""}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="pl-7 text-sm"
              />
            </div>
            <span className="text-xs text-muted-foreground">per day</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cost history chart ─────────────────────────────────────────────

function CostHistoryChart() {
  const data = useMemo(() => generate30DayData(), []);

  const totalSpend = data.reduce((sum, d) => sum + d.cost, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium mb-1">Cost History</p>
          <p className="text-xs text-muted-foreground">
            Daily spend over the last 30 days.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">${totalSpend.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">30-day total</p>
        </div>
      </div>

      <div className="h-[180px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              interval={4}
              dy={4}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) => `$${v}`}
              width={36}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--accent))", opacity: 0.5 }} />
            <Bar
              dataKey="cost"
              radius={[2, 2, 0, 0]}
              fill="hsl(217, 91%, 60%)"
              maxBarSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function CostsSection() {
  return (
    <div className="space-y-6">
      <CostCapSection />
      <Separator />
      <CostHistoryChart />
    </div>
  );
}
