import { useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  Download,
  Trash2,
  CheckCircle2,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

// ── Theme toggle ───────────────────────────────────────────────────

const THEME_OPTIONS = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor },
];

function ThemeSection() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Theme</p>
        <p className="text-xs text-muted-foreground mb-3">
          Choose the color scheme for the interface.
        </p>
      </div>

      <div className="flex gap-2">
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
                isActive
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border hover:bg-accent/50",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Density toggle ─────────────────────────────────────────────────

type Density = "comfortable" | "compact";

function DensitySection() {
  const [density, setDensity] = useState<Density>("comfortable");

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Density</p>
        <p className="text-xs text-muted-foreground mb-3">
          Adjust spacing and sizing of UI elements.
        </p>
      </div>

      <div className="flex gap-2">
        {(["comfortable", "compact"] as Density[]).map((opt) => (
          <button
            key={opt}
            onClick={() => setDensity(opt)}
            className={cn(
              "flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
              density === opt
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border hover:bg-accent/50",
            )}
          >
            {/* Mini preview bars */}
            <div className="flex flex-col gap-1 w-full max-w-[60px]">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded bg-muted-foreground/20",
                    opt === "compact" ? "h-1.5" : "h-2.5",
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-medium capitalize">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Appearance section (exported) ──────────────────────────────────

export function AppearanceSection() {
  return (
    <div className="space-y-6">
      <ThemeSection />
      <Separator />
      <DensitySection />
    </div>
  );
}

// ── Service status ─────────────────────────────────────────────────

function ServiceStatusSection() {
  const [restarting, setRestarting] = useState(false);

  const handleRestart = async () => {
    setRestarting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setRestarting(false);
  };

  // Mock pm2 data
  const serviceData = {
    status: "online" as const,
    uptime: "3d 14h 22m",
    memory: "128 MB",
    restarts: 2,
    pid: 48291,
    nodeVersion: "v22.4.0",
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">Service Status</p>
        <p className="text-xs text-muted-foreground mb-3">
          AgentOps background service managed by pm2.
        </p>
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-2 gap-px bg-border">
          {/* Status */}
          <div className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium capitalize">{serviceData.status}</span>
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Uptime</p>
            <p className="text-sm font-medium">{serviceData.uptime}</p>
          </div>

          {/* Memory */}
          <div className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Memory</p>
            <p className="text-sm font-medium">{serviceData.memory}</p>
          </div>

          {/* Restarts */}
          <div className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Restarts</p>
            <p className="text-sm font-medium">{serviceData.restarts}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>PID {serviceData.pid}</span>
        <span>·</span>
        <span>Node {serviceData.nodeVersion}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleRestart}
        disabled={restarting}
      >
        <RotateCcw className={cn("h-3.5 w-3.5", restarting && "animate-spin")} />
        {restarting ? "Restarting..." : "Restart Service"}
      </Button>
    </div>
  );
}

export function ServiceSection() {
  return <ServiceStatusSection />;
}

// ── Data section ───────────────────────────────────────────────────

function DatabaseInfo() {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Database</p>
        <p className="text-xs text-muted-foreground mb-3">
          SQLite storage for stories, tasks, executions, and project data.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
        <HardDrive className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">agentops.db</p>
          <p className="text-xs text-muted-foreground">24.3 MB · 1,847 rows</p>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">SQLite</Badge>
      </div>
    </div>
  );
}

function DataActionsSection() {
  const [exported, setExported] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleExport = async () => {
    // Mock export action
    await new Promise((r) => setTimeout(r, 800));
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const handleClear = async () => {
    // Mock clear action
    await new Promise((r) => setTimeout(r, 600));
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Actions</p>
        <p className="text-xs text-muted-foreground mb-3">
          Export or clear data from the application.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleExport}
          disabled={exported}
        >
          {exported ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {exported ? "Exported!" : "Export settings"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={handleClear}
          disabled={cleared}
        >
          {cleared ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          {cleared ? "Cleared!" : "Clear execution history"}
        </Button>
      </div>
    </div>
  );
}

export function DataSection() {
  return (
    <div className="space-y-6">
      <DatabaseInfo />
      <Separator />
      <DataActionsSection />
    </div>
  );
}
