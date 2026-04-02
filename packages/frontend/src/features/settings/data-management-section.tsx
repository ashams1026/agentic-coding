import { useState } from "react";
import { Download, RotateCcw, Trash2, HardDrive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToastStore } from "@/stores/toast-store";

const BASE_URL = "http://localhost:3001";

// ── Types ───────────────────────────────────────────────────────

interface BackupInfo {
  filename: string;
  path: string;
  sizeBytes: number;
  sizeMb: number;
  createdAt: string;
}

interface StorageStats {
  tables: { name: string; rowCount: number }[];
  totalSizeBytes: number;
  totalSizeMb: number;
}

// ── Component ───────────────────────────────────────────────────

export function DataManagementSection() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [truncating, setTruncating] = useState(false);
  const [truncateDays, setTruncateDays] = useState(30);
  const addToast = useToastStore((s) => s.addToast);

  if (!loaded) {
    setLoaded(true);
    fetch(`${BASE_URL}/api/settings/backups`).then((r) => r.json()).then((d) => setBackups(d.data)).catch(() => {});
    fetch(`${BASE_URL}/api/settings/storage-stats`).then((r) => r.json()).then((d) => setStorageStats(d.data)).catch(() => {});
  }

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${BASE_URL}/api/settings/backup`, { method: "POST" });
      const { data } = await res.json();
      addToast({ type: "success", title: "Backup created", description: data.path });
      // Refresh backup list
      const listRes = await fetch(`${BASE_URL}/api/settings/backups`);
      const listData = await listRes.json();
      setBackups(listData.data);
    } catch {
      addToast({ type: "error", title: "Backup failed" });
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (path: string, filename: string) => {
    if (!confirm(`Restore from "${filename}"? This will overwrite the current database. The server must be restarted after restore.`)) return;
    try {
      const res = await fetch(`${BASE_URL}/api/settings/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (res.ok) {
        addToast({ type: "success", title: "Database restored", description: "Restart the server to apply changes." });
      } else {
        const err = await res.json();
        addToast({ type: "error", title: "Restore failed", description: err.error?.message });
      }
    } catch {
      addToast({ type: "error", title: "Restore failed" });
    }
  };

  const handleTruncateLogs = async () => {
    if (!confirm(`Truncate execution logs older than ${truncateDays} days? This cannot be undone.`)) return;
    setTruncating(true);
    try {
      const res = await fetch(`${BASE_URL}/api/settings/truncate-logs?olderThanDays=${truncateDays}`, { method: "POST" });
      const { data } = await res.json();
      addToast({ type: "success", title: "Logs truncated", description: `${data.truncated} execution logs cleared.` });
    } catch {
      addToast({ type: "error", title: "Truncation failed" });
    } finally {
      setTruncating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Backups */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium">Database Backups</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Safe WAL-mode backups stored in ~/.agentops/backups/</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCreateBackup} disabled={creating}>
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Create Backup
          </Button>
        </div>

        {backups.length > 0 ? (
          <div className="rounded-lg border divide-y">
            {backups.map((b) => (
              <div key={b.filename} className="flex items-center gap-3 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono truncate">{b.filename}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(b.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    {" · "}{b.sizeMb} MB
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleRestore(b.path, b.filename)}>
                  <RotateCcw className="h-3 w-3" />
                  Restore
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4 border rounded-lg">No backups yet. Create one to get started.</p>
        )}
      </div>

      {/* Log Truncation */}
      <div>
        <h3 className="text-sm font-medium mb-1">Log Truncation</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Clear execution logs older than a specified number of days. Preserves all metadata (cost, duration, outcome) — only clears raw log text to save storage.
        </p>
        <div className="flex items-center gap-3">
          <select
            value={truncateDays}
            onChange={(e) => setTruncateDays(Number(e.target.value))}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleTruncateLogs} disabled={truncating}>
            {truncating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Truncate Old Logs
          </Button>
        </div>
      </div>

      {/* Storage Stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Storage</h3>
          {storageStats && (
            <Badge variant="secondary" className="text-[10px]">{storageStats.totalSizeMb} MB</Badge>
          )}
        </div>

        {storageStats ? (
          <div className="rounded-lg border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left px-3 py-2 font-medium">Table</th>
                  <th className="text-right px-3 py-2 font-medium">Rows</th>
                </tr>
              </thead>
              <tbody>
                {storageStats.tables.map((t) => (
                  <tr key={t.name} className="border-b last:border-0">
                    <td className="px-3 py-1.5 font-mono text-[11px]">{t.name}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{t.rowCount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">Loading storage stats...</p>
        )}
      </div>
    </div>
  );
}
