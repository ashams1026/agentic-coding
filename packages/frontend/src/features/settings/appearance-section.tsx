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
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUIStore, type Density } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { getDbStats, clearExecutionHistory, exportSettings, importSettings, getServiceStatus, restartService } from "@/api";
import type { ActiveExecutionInfo } from "@/api/client";

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

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function ServiceStatusSection() {
  const [restarting, setRestarting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeAgents, setActiveAgents] = useState<ActiveExecutionInfo[]>([]);
  const [polling, setPolling] = useState(false);
  const [confirmForce, setConfirmForce] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  }, []);

  const pollStatus = useCallback(async () => {
    try {
      const status = await getServiceStatus();
      setActiveAgents(status.activeExecutions);
      if (status.activeExecutions.length === 0) {
        // All agents finished — restart now
        stopPolling();
        setRestarting(true);
        try {
          await restartService(false);
        } catch {
          // Backend will disconnect on restart
        }
      }
    } catch {
      // Service may be restarting
    }
  }, [stopPolling]);

  const handleRestart = async () => {
    try {
      const status = await getServiceStatus();
      if (status.activeExecutions.length === 0) {
        // No active agents — restart immediately
        setRestarting(true);
        try {
          await restartService(false);
        } catch {
          // Backend will disconnect on restart
        }
        return;
      }
      // Active agents found — show modal
      setActiveAgents(status.activeExecutions);
      setModalOpen(true);
      setConfirmForce(false);
      // Start polling every 3 seconds
      setPolling(true);
      pollRef.current = setInterval(pollStatus, 3000);
    } catch {
      // Fallback: try restart directly
      setRestarting(true);
      try {
        await restartService(false);
      } catch {
        // Backend will disconnect on restart
      }
    }
  };

  const handleForceRestart = async () => {
    if (!confirmForce) {
      setConfirmForce(true);
      return;
    }
    stopPolling();
    setRestarting(true);
    setModalOpen(false);
    try {
      await restartService(true);
    } catch {
      // Backend will disconnect on restart
    }
  };

  const handleCancel = () => {
    stopPolling();
    setModalOpen(false);
    setConfirmForce(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Mock pm2 data (service info still mock until pm2 integration)
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
          Woof background service managed by pm2.
        </p>
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-2 gap-px bg-border">
          <div className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium capitalize">{serviceData.status}</span>
            </div>
          </div>
          <div className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Uptime</p>
            <p className="text-sm font-medium">{serviceData.uptime}</p>
          </div>
          <div className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Memory</p>
            <p className="text-sm font-medium">{serviceData.memory}</p>
          </div>
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

      {/* Graceful restart modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {polling && <Loader2 className="h-4 w-4 animate-spin text-amber-500" />}
              Waiting for {activeAgents.length} agent{activeAgents.length !== 1 ? "s" : ""} to finish...
            </DialogTitle>
            <DialogDescription>
              The service will restart automatically once all agents complete their work.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {activeAgents.map((agent) => (
              <div
                key={agent.executionId}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{agent.personaName}</p>
                  <p className="text-xs text-muted-foreground truncate">{agent.workItemTitle}</p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                  {formatElapsed(agent.elapsedMs)}
                </Badge>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={handleForceRestart}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {confirmForce
                ? `Kill ${activeAgents.length} agent${activeAgents.length !== 1 ? "s" : ""} and restart`
                : "Force Restart"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
