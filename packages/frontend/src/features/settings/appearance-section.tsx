import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUIStore, type ApiMode, type Density } from "@/stores/ui-store";
import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import { getDbStats, clearExecutionHistory, exportSettings, importSettings } from "@/api";
import { API_BASE_URL } from "@/api/client";
import { initWsConnection } from "@/api/ws";

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

function DensitySection() {
  const density = useUIStore((s) => s.density);
  const setDensity = useUIStore((s) => s.setDensity);

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

// ── API mode toggle ───────────────────────────────────────────────

function ApiModeSection() {
  const apiMode = useUIStore((s) => s.apiMode);
  const setApiMode = useUIStore((s) => s.setApiMode);
  const addToast = useToastStore((s) => s.addToast);

  const handleToggle = useCallback(async (mode: ApiMode) => {
    if (mode === apiMode) return;

    if (mode === "api") {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
      } catch {
        addToast({
          type: "error",
          title: "Backend not running",
          description: "Start it with `pnpm --filter backend dev`",
        });
        return;
      }
    }

    setApiMode(mode);
    initWsConnection();
  }, [apiMode, setApiMode, addToast]);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Data Source</p>
        <p className="text-xs text-muted-foreground mb-3">
          Mock mode uses demo data. Live mode connects to the backend API at localhost:3001.
        </p>
      </div>

      <div className="flex gap-2">
        {([
          { value: "mock" as const, label: "Mock", color: "bg-amber-500" },
          { value: "api" as const, label: "Live", color: "bg-emerald-500" },
        ]).map((opt) => {
          const isActive = apiMode === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleToggle(opt.value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
                isActive
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border hover:bg-accent/50",
              )}
            >
              <span className={cn("h-3 w-3 rounded-full", opt.color)} />
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Appearance section (exported) ──────────────────────────────────

export function AppearanceSection() {
  return (
    <div className="space-y-6">
      <ApiModeSection />
      <Separator />
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
  const [stats, setStats] = useState<{
    sizeMB: number;
    executionCount: number;
    projectCount: number;
    personaCount: number;
  } | null>(null);

  useEffect(() => {
    getDbStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Database</p>
        <p className="text-xs text-muted-foreground mb-3">
          SQLite storage for work items, executions, and project data.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
        <HardDrive className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">agentops.db</p>
          {stats ? (
            <p className="text-xs text-muted-foreground">
              {stats.sizeMB} MB · {stats.executionCount} executions · {stats.projectCount} projects · {stats.personaCount} personas
            </p>
          ) : (
            <div className="h-3 w-40 bg-muted animate-pulse rounded mt-1" />
          )}
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">SQLite</Badge>
      </div>
    </div>
  );
}

function DataActionsSection() {
  const [exported, setExported] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await exportSettings();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agentops-settings-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch {
      // Error toast handled by API layer
    }
  };

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 5000);
      return;
    }
    try {
      await clearExecutionHistory();
      setCleared(true);
      setConfirmClear(false);
      setTimeout(() => setCleared(false), 3000);
    } catch {
      // Error toast handled by API layer
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await importSettings(data);
      const counts = result.imported;
      setImportResult(
        `Imported: ${counts.projects} projects, ${counts.personas} personas, ${counts.personaAssignments} assignments`,
      );
      setTimeout(() => setImportResult(null), 5000);
    } catch {
      setImportResult("Import failed — check file format.");
      setTimeout(() => setImportResult(null), 5000);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Actions</p>
        <p className="text-xs text-muted-foreground mb-3">
          Export, import, or clear data from the application.
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
          className="gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          <Upload className="h-3.5 w-3.5" />
          {importing ? "Importing..." : "Import settings"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />

        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5",
            confirmClear
              ? "text-destructive border-destructive hover:text-destructive"
              : "text-destructive hover:text-destructive",
          )}
          onClick={handleClear}
          disabled={cleared}
        >
          {cleared ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          {cleared
            ? "Cleared!"
            : confirmClear
              ? "Click again to confirm"
              : "Clear execution history"}
        </Button>
      </div>

      {confirmClear && !cleared && (
        <p className="text-xs text-destructive">
          This will delete all execution records older than 30 days. Click the button again to confirm.
        </p>
      )}

      {importResult && (
        <p className={cn(
          "text-xs",
          importResult.startsWith("Import failed") ? "text-destructive" : "text-green-600 dark:text-green-400",
        )}>
          {importResult}
        </p>
      )}
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
