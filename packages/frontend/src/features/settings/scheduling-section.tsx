import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Play,
  Clock,
  AlertTriangle,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToastStore } from "@/stores/toast-store";

// ── Types ───────────────────────────────────────────────────────

interface Schedule {
  id: string;
  name: string;
  personaId: string;
  personaName: string | null;
  projectId: string | null;
  cronExpression: string;
  promptTemplate: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  consecutiveFailures: number;
  createdAt: string;
}

interface PersonaOption {
  id: string;
  name: string;
}

// ── Cron presets ────────────────────────────────────────────────

const CRON_PRESETS = [
  { label: "Every 30 minutes", value: "*/30 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 2 hours", value: "0 */2 * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Daily at 9am", value: "0 9 * * *" },
  { label: "Weekdays at 9am", value: "0 9 * * 1-5" },
  { label: "Custom", value: "custom" },
] as const;

// ── Helpers ─────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3001";

function cronToHuman(cron: string): string {
  const preset = CRON_PRESETS.find((p) => p.value === cron);
  if (preset && preset.value !== "custom") return preset.label;

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron;
  const [min, hr, dom, mon, dow] = parts;

  if (min === "*" && hr === "*") return "Every minute";
  if (min?.startsWith("*/") && hr === "*") return `Every ${min.slice(2)} minutes`;
  if (min === "0" && hr?.startsWith("*/")) return `Every ${hr.slice(2)} hours`;
  if (min === "0" && hr === "0" && dom?.startsWith("*/")) return `Every ${dom.slice(2)} days`;
  if (min === "0" && hr === "0" && dom === "*" && mon === "*" && dow === "*") return "Daily at midnight";
  if (min === "0" && hr && !hr.startsWith("*") && dow === "1-5") return `Weekdays at ${hr}:00`;
  if (min === "0" && hr && !hr.startsWith("*")) return `Daily at ${hr}:00`;

  return cron;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNextRunsPreview(cronExpression: string, count = 3): string[] {
  // Simple preview: compute next N runs from now using the cron pattern
  const runs: string[] = [];
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return runs;

  const now = new Date();
  const check = new Date(now);
  check.setSeconds(0, 0);
  check.setMinutes(check.getMinutes() + 1);

  for (let i = 0; i < 1440 * 7 && runs.length < count; i++) {
    if (matchesCronSimple(parts, check)) {
      runs.push(
        check.toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }
    check.setMinutes(check.getMinutes() + 1);
  }
  return runs;
}

function matchesCronSimple(parts: string[], date: Date): boolean {
  const values = [
    date.getMinutes(),
    date.getHours(),
    date.getDate(),
    date.getMonth() + 1,
    date.getDay(),
  ];

  for (let i = 0; i < 5; i++) {
    const field = parts[i]!;
    const val = values[i]!;
    if (field === "*") continue;
    if (field.startsWith("*/")) {
      const step = parseInt(field.slice(2), 10);
      if (step > 0 && val % step !== 0) return false;
      continue;
    }
    const subs = field.split(",");
    let matched = false;
    for (const sub of subs) {
      if (sub.includes("-")) {
        const [a, b] = sub.split("-").map(Number);
        if (val >= a! && val <= b!) { matched = true; break; }
      } else {
        if (parseInt(sub, 10) === val) { matched = true; break; }
      }
    }
    if (!matched) return false;
  }
  return true;
}

// ── API ─────────────────────────────────────────────────────────

async function fetchSchedules(): Promise<Schedule[]> {
  const res = await fetch(`${BASE_URL}/api/schedules`);
  const data = await res.json();
  return data.data;
}

async function fetchPersonas(): Promise<PersonaOption[]> {
  const res = await fetch(`${BASE_URL}/api/personas`);
  const data = await res.json();
  return data.data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }));
}

async function createSchedule(body: {
  name: string;
  personaId: string;
  cronExpression: string;
  promptTemplate?: string;
}): Promise<Schedule> {
  const res = await fetch(`${BASE_URL}/api/schedules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to create schedule");
  }
  const data = await res.json();
  return data.data;
}

async function updateSchedule(
  id: string,
  body: Record<string, unknown>,
): Promise<Schedule> {
  const res = await fetch(`${BASE_URL}/api/schedules/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to update schedule");
  }
  const data = await res.json();
  return data.data;
}

async function deleteSchedule(id: string): Promise<void> {
  await fetch(`${BASE_URL}/api/schedules/${id}`, { method: "DELETE" });
}

async function runNow(id: string): Promise<{ executionId: string }> {
  const res = await fetch(`${BASE_URL}/api/schedules/${id}/run-now`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to trigger schedule");
  }
  const data = await res.json();
  return data.data;
}

// ── Component ───────────────────────────────────────────────────

export function SchedulingSection() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPersonaId, setFormPersonaId] = useState("");
  const [formPreset, setFormPreset] = useState("*/30 * * * *");
  const [formCustomCron, setFormCustomCron] = useState("");
  const [formPrompt, setFormPrompt] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([fetchSchedules(), fetchPersonas()]);
      setSchedules(s);
      setPersonas(p);
    } catch {
      addToast({ type: "error", title: "Failed to load schedules" });
    } finally {
      setLoaded(true);
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const cronExpression = formPreset === "custom" ? formCustomCron : formPreset;
  const nextRuns = cronExpression ? getNextRunsPreview(cronExpression) : [];

  function openCreateDialog() {
    setEditingId(null);
    setFormName("");
    setFormPersonaId(personas[0]?.id ?? "");
    setFormPreset("*/30 * * * *");
    setFormCustomCron("");
    setFormPrompt("");
    setDialogOpen(true);
  }

  function openEditDialog(schedule: Schedule) {
    setEditingId(schedule.id);
    setFormName(schedule.name);
    setFormPersonaId(schedule.personaId);
    const matchingPreset = CRON_PRESETS.find((p) => p.value === schedule.cronExpression);
    if (matchingPreset && matchingPreset.value !== "custom") {
      setFormPreset(schedule.cronExpression);
      setFormCustomCron("");
    } else {
      setFormPreset("custom");
      setFormCustomCron(schedule.cronExpression);
    }
    setFormPrompt(schedule.promptTemplate);
    setDialogOpen(true);
  }

  async function handleSave() {
    const cron = formPreset === "custom" ? formCustomCron.trim() : formPreset;
    if (!formName.trim() || !formPersonaId || !cron) {
      addToast({ type: "error", title: "Name, persona, and cron expression are required" });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateSchedule(editingId, {
          name: formName.trim(),
          cronExpression: cron,
          promptTemplate: formPrompt.trim(),
        });
        addToast({ type: "success", title: "Schedule updated" });
      } else {
        await createSchedule({
          name: formName.trim(),
          personaId: formPersonaId,
          cronExpression: cron,
          promptTemplate: formPrompt.trim() || undefined,
        });
        addToast({ type: "success", title: "Schedule created" });
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      addToast({ type: "error", title: String(err) });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(schedule: Schedule) {
    try {
      await updateSchedule(schedule.id, { isActive: !schedule.isActive });
      await load();
    } catch {
      addToast({ type: "error", title: "Failed to toggle schedule" });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      addToast({ type: "success", title: "Schedule deleted" });
    } catch {
      addToast({ type: "error", title: "Failed to delete schedule" });
    }
  }

  async function handleRunNow(id: string) {
    setRunningId(id);
    try {
      const result = await runNow(id);
      addToast({ type: "success", title: `Execution started: ${result.executionId}` });
      await load();
    } catch (err) {
      addToast({ type: "error", title: String(err) });
    } finally {
      setRunningId(null);
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading schedules...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Scheduled agent runs. Agents execute automatically on the configured cron schedule.
        </p>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-1" />
          Add Schedule
        </Button>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground/60">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No schedules configured</p>
          <p className="text-xs mt-1">Create a schedule to run agents automatically.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3 bg-card"
            >
              {/* Toggle active */}
              <button
                onClick={() => handleToggle(schedule)}
                className={`shrink-0 h-5 w-9 rounded-full transition-colors relative ${
                  schedule.isActive ? "bg-green-500" : "bg-muted-foreground/30"
                }`}
                title={schedule.isActive ? "Active — click to disable" : "Disabled — click to enable"}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white shadow transition-transform absolute top-0.5 ${
                    schedule.isActive ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{schedule.name}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {schedule.personaName ?? schedule.personaId}
                  </Badge>
                  {schedule.consecutiveFailures > 0 && (
                    <Badge variant="destructive" className="text-xs shrink-0">
                      <AlertTriangle className="h-3 w-3 mr-0.5" />
                      {schedule.consecutiveFailures} fail{schedule.consecutiveFailures > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>{cronToHuman(schedule.cronExpression)}</span>
                  <span>Next: {formatDate(schedule.nextRunAt)}</span>
                  {schedule.lastRunAt && <span>Last: {formatDate(schedule.lastRunAt)}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRunNow(schedule.id)}
                  disabled={runningId === schedule.id}
                  title="Run Now"
                >
                  {runningId === schedule.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditDialog(schedule)}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(schedule.id)}
                  title="Delete"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Schedule" : "Create Schedule"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Daily code review"
                className="mt-1"
              />
            </div>

            {/* Persona (only on create) */}
            {!editingId && (
              <div>
                <label className="text-sm font-medium">Persona</label>
                <Select value={formPersonaId} onValueChange={setFormPersonaId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {personas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Cron preset */}
            <div>
              <label className="text-sm font-medium">Frequency</label>
              <Select value={formPreset} onValueChange={setFormPreset}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRON_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom cron input */}
            {formPreset === "custom" && (
              <div>
                <label className="text-sm font-medium">Cron Expression</label>
                <Input
                  value={formCustomCron}
                  onChange={(e) => setFormCustomCron(e.target.value)}
                  placeholder="*/15 * * * *"
                  className="mt-1 font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: minute hour day-of-month month day-of-week
                </p>
              </div>
            )}

            {/* Next runs preview */}
            {nextRuns.length > 0 && (
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Next runs:</p>
                {nextRuns.map((run, i) => (
                  <p key={i} className="text-xs text-foreground">
                    {run}
                  </p>
                ))}
              </div>
            )}

            {/* Prompt template */}
            <div>
              <label className="text-sm font-medium">Prompt Template (optional)</label>
              <Input
                value={formPrompt}
                onChange={(e) => setFormPrompt(e.target.value)}
                placeholder="e.g. Review open PRs and summarize findings"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingId ? "Save Changes" : "Create Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
