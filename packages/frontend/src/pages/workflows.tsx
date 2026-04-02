import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Play,
  Pause,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Calendar,
  ChevronRight,
  GitBranch,
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
} from "lucide-react";
import { useWorkflow, useWorkflows, useUpdateWorkflow, usePublishWorkflow, useCreateWorkflow } from "@/hooks/use-workflows";
import { useAgents } from "@/hooks/use-agents";
import { useSelectedProject } from "@/hooks";
import { WorkflowBuilder } from "@/features/workflow-builder/workflow-builder";
import type { StateCardData } from "@/features/workflow-builder/state-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast-store";
import type { Workflow, WorkflowStateEntity } from "@agentops/shared";

// ── Schedule types ───────────────────────────────────────────────

interface Schedule {
  id: string;
  name: string;
  agentId: string;
  agentName: string | null;
  projectId: string | null;
  cronExpression: string;
  promptTemplate: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  consecutiveFailures: number;
  createdAt: string;
}

// ── Cron helpers ────────────────────────────────────────────────

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

function cronToHuman(cron: string): string {
  const preset = CRON_PRESETS.find((p) => p.value === cron);
  if (preset && preset.value !== "custom") return preset.label;

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron;
  const [min, hr, dom, , dow] = parts;

  if (min === "*" && hr === "*") return "Every minute";
  if (min?.startsWith("*/") && hr === "*") return `Every ${min.slice(2)} minutes`;
  if (min === "0" && hr?.startsWith("*/")) return `Every ${hr.slice(2)} hours`;
  if (min === "0" && hr === "0" && dom?.startsWith("*/")) return `Every ${dom.slice(2)} days`;
  if (min === "0" && hr === "0") return "Daily at midnight";
  if (min === "0" && hr && !hr.startsWith("*") && dow === "1-5") return `Weekdays at ${hr}:00`;
  if (min === "0" && hr && !hr.startsWith("*")) return `Daily at ${hr}:00`;

  return cron;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diffMs = target - now;
  const absMs = Math.abs(diffMs);

  const minutes = Math.floor(absMs / 60000);
  const hours = Math.floor(absMs / 3600000);
  const days = Math.floor(absMs / 86400000);

  const future = diffMs > 0;
  let label: string;

  if (absMs < 60000) label = "just now";
  else if (minutes < 60) label = `${minutes}m`;
  else if (hours < 24) label = `${hours}h`;
  else label = `${days}d`;

  if (absMs < 60000) return label;
  return future ? `in ${label}` : `${label} ago`;
}

const BASE_URL = "http://localhost:3001";

// ── Schedule API calls ──────────────────────────────────────────

async function fetchSchedules(projectId?: string): Promise<Schedule[]> {
  const q = projectId ? `?projectId=${projectId}` : "";
  const res = await fetch(`${BASE_URL}/api/schedules${q}`);
  if (!res.ok) throw new Error("Failed to fetch schedules");
  const data = await res.json();
  return data.data;
}

async function createScheduleApi(body: {
  name: string;
  agentId: string;
  cronExpression: string;
  promptTemplate?: string;
  projectId?: string;
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

async function toggleScheduleApi(id: string, isActive: boolean): Promise<Schedule> {
  const res = await fetch(`${BASE_URL}/api/schedules/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) throw new Error("Failed to toggle schedule");
  const data = await res.json();
  return data.data;
}

async function updateScheduleApi(id: string, body: Record<string, unknown>): Promise<Schedule> {
  const res = await fetch(`${BASE_URL}/api/schedules/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update schedule");
  const data = await res.json();
  return data.data;
}

async function deleteScheduleApi(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/schedules/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete schedule");
}

async function runNowApi(id: string): Promise<{ executionId: string }> {
  const res = await fetch(`${BASE_URL}/api/schedules/${id}/run-now`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to trigger schedule");
  const data = await res.json();
  return data.data;
}

// ── Workflow state pipeline ──────────────────────────────────────

const STATE_TYPE_COLORS: Record<string, string> = {
  initial: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  intermediate: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  terminal: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

interface WorkflowCardProps {
  workflow: Workflow;
  states: WorkflowStateEntity[];
  onEdit: () => void;
  onToggleAutoRouting?: (id: string, autoRouting: boolean) => void;
}

function WorkflowCard({ workflow, states, onEdit, onToggleAutoRouting }: WorkflowCardProps) {
  const sortedStates = [...states].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Card className="flex flex-col min-h-[180px]">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight">
            {workflow.name}
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onToggleAutoRouting?.(workflow.id, !workflow.autoRouting)}
              title={workflow.autoRouting ? "Auto-routing ON — click to disable" : "Auto-routing OFF — click to enable"}
              className={cn(
                "shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border transition-colors",
                workflow.autoRouting
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                  : "bg-muted text-muted-foreground border-border hover:bg-muted/80",
              )}
            >
              {workflow.autoRouting ? (
                <Play className="h-3 w-3 fill-current" />
              ) : (
                <Pause className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">{workflow.autoRouting ? "Auto" : "Paused"}</span>
            </button>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full border",
                workflow.isPublished
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-muted text-muted-foreground border-border",
              )}
            >
              {workflow.isPublished ? "Published" : "Draft"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {sortedStates.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-1.5 py-4 text-center">
            <GitBranch className="h-6 w-6 text-muted-foreground/40" />
            <p className="text-xs font-medium text-muted-foreground">No states configured</p>
            <p className="text-[11px] text-muted-foreground/60">Add states to define your workflow pipeline.</p>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 mt-1" onClick={onEdit}>
              <Plus className="h-3 w-3" />
              Configure States
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            {sortedStates.map((state, idx) => (
              <div key={state.id} className="flex items-center gap-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    STATE_TYPE_COLORS[state.type] ?? "bg-muted text-muted-foreground border-border",
                  )}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: state.color || "currentColor", opacity: 0.7 }}
                  />
                  {state.name}
                </span>
                {idx < sortedStates.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="gap-1.5 text-xs"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Workflow
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Schedule Card ────────────────────────────────────────────────

interface ScheduleCardProps {
  schedule: Schedule;
  agentAvatar: { color: string; icon: string } | null;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  onRunNow: (id: string) => void;
  runningId: string | null;
}

function ScheduleCard({ schedule, agentAvatar, onToggle, onEdit, onDelete, onRunNow, runningId }: ScheduleCardProps) {
  const lastRunStatus = schedule.consecutiveFailures > 0 ? "failed" : schedule.lastRunAt ? "success" : "pending";

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight">
            {schedule.name}
          </CardTitle>
          <button
            onClick={() => onToggle(schedule.id, !schedule.isActive)}
            title={schedule.isActive ? "Active — click to disable" : "Disabled — click to enable"}
            className={cn(
              "shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border transition-colors",
              schedule.isActive
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                : "bg-muted text-muted-foreground border-border hover:bg-muted/80",
            )}
          >
            {schedule.isActive ? (
              <Play className="h-3 w-3 fill-current" />
            ) : (
              <Pause className="h-3 w-3" />
            )}
            {schedule.isActive ? "Active" : "Paused"}
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* Agent */}
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: agentAvatar?.color ?? "#6b7280" }}
            title={schedule.agentName ?? schedule.agentId}
          >
            {agentAvatar?.icon ? (
              <span>{agentAvatar.icon}</span>
            ) : (
              <span className="text-white text-[10px]">
                {(schedule.agentName ?? "A").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-sm text-foreground truncate">
            {schedule.agentName ?? schedule.agentId}
          </span>
        </div>

        {/* Cron + next run */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{cronToHuman(schedule.cronExpression)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Next: {formatRelativeTime(schedule.nextRunAt)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
        {/* Last run status */}
        <div className="flex items-center gap-2">
          {lastRunStatus === "success" && (
            <Badge variant="outline" className="gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 className="h-3 w-3" />
              Last run OK
            </Badge>
          )}
          {lastRunStatus === "failed" && (
            <Badge variant="outline" className="gap-1 text-destructive border-destructive/30 bg-destructive/10">
              <XCircle className="h-3 w-3" />
              {schedule.consecutiveFailures} failure{schedule.consecutiveFailures > 1 ? "s" : ""}
            </Badge>
          )}
          {lastRunStatus === "pending" && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Circle className="h-3 w-3" />
              Never run
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRunNow(schedule.id)}
            disabled={runningId === schedule.id}
            title="Run Now"
            className="h-7 w-7 p-0"
          >
            {runningId === schedule.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(schedule)}
            title="Edit Schedule"
            className="h-7 w-7 p-0"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(schedule.id)}
            title="Delete Schedule"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// ── New Schedule Dialog ──────────────────────────────────────────

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | undefined;
  onSaved: () => void;
  editingSchedule?: Schedule;
}

function ScheduleDialog({ open, onOpenChange, projectId, onSaved, editingSchedule }: ScheduleDialogProps) {
  const { data: agents = [] } = useAgents();
  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [preset, setPreset] = useState("*/30 * * * *");
  const [customCron, setCustomCron] = useState("");
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const isEditing = !!editingSchedule;

  // Pre-fill form when editing or reset when creating
  useEffect(() => {
    if (editingSchedule) {
      setName(editingSchedule.name);
      setAgentId(editingSchedule.agentId);
      const matchingPreset = CRON_PRESETS.find((p) => p.value === editingSchedule.cronExpression);
      if (matchingPreset && matchingPreset.value !== "custom") {
        setPreset(editingSchedule.cronExpression);
        setCustomCron("");
      } else {
        setPreset("custom");
        setCustomCron(editingSchedule.cronExpression);
      }
      setPrompt(editingSchedule.promptTemplate);
    } else {
      setName("");
      setAgentId(agents[0]?.id ?? "");
      setPreset("*/30 * * * *");
      setCustomCron("");
      setPrompt("");
    }
  }, [editingSchedule, agents]);

  // Default agentId when agents load (only for create mode)
  useEffect(() => {
    if (!isEditing && agents.length > 0 && !agentId) {
      setAgentId(agents[0]!.id);
    }
  }, [agents, agentId, isEditing]);

  const cronExpression = preset === "custom" ? customCron : preset;

  async function handleSave() {
    const cron = preset === "custom" ? customCron.trim() : preset;
    if (!name.trim() || !agentId || !cron) {
      addToast({ type: "error", title: "Name, agent, and cron expression are required" });
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await updateScheduleApi(editingSchedule.id, {
          name: name.trim(),
          cronExpression: cron,
          promptTemplate: prompt.trim(),
        });
        addToast({ type: "success", title: "Schedule updated" });
      } else {
        await createScheduleApi({
          name: name.trim(),
          agentId,
          cronExpression: cron,
          promptTemplate: prompt.trim() || undefined,
          projectId: projectId ?? undefined,
        });
        addToast({ type: "success", title: "Schedule created" });
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      addToast({ type: "error", title: String(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Schedule" : "New Schedule"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily code review"
              className="mt-1"
              autoFocus
            />
          </div>
          {/* Agent selector — only shown on create; agent can't change after creation */}
          {!isEditing && (
            <div>
              <label className="text-sm font-medium">Agent</label>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Frequency</label>
            <Select value={preset} onValueChange={setPreset}>
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
          {preset === "custom" && (
            <div>
              <label className="text-sm font-medium">Cron Expression</label>
              <Input
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="*/15 * * * *"
                className="mt-1 font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: minute hour day-of-month month day-of-week
              </p>
            </div>
          )}
          {cronExpression && cronExpression !== "custom" && (
            <p className="text-xs text-muted-foreground">
              Runs: <span className="text-foreground font-medium">{cronToHuman(cronExpression)}</span>
            </p>
          )}
          <div>
            <label className="text-sm font-medium">Prompt Template <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Review open PRs and summarize findings"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isEditing ? "Save Changes" : "Create Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Automations overview (list page) ────────────────────────────

function AutomationsOverview() {
  const navigate = useNavigate();
  const { projectId } = useSelectedProject();
  const { data: workflows = [], isLoading: loadingWorkflows } = useWorkflows(projectId ?? undefined);
  const { data: agents = [] } = useAgents();
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>(undefined);
  const [runningScheduleId, setRunningScheduleId] = useState<string | null>(null);
  const [createWorkflowOpen, setCreateWorkflowOpen] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  function handleToggleAutoRouting(id: string, autoRouting: boolean) {
    updateWorkflow.mutate(
      { id, autoRouting },
      {
        onError: () => {
          addToast({ type: "error", title: "Failed to toggle auto-routing" });
        },
      },
    );
  }

  const loadSchedules = useCallback(async () => {
    try {
      const data = await fetchSchedules(projectId as string | undefined);
      setSchedules(data);
    } catch {
      // Schedules endpoint may not exist yet — silently show empty
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  async function handleToggleSchedule(id: string, isActive: boolean) {
    try {
      const updated = await toggleScheduleApi(id, isActive);
      setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {
      addToast({ type: "error", title: "Failed to toggle schedule" });
    }
  }

  function handleEditSchedule(schedule: Schedule) {
    setEditingSchedule(schedule);
    setScheduleDialogOpen(true);
  }

  async function handleDeleteSchedule(id: string) {
    try {
      await deleteScheduleApi(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      addToast({ type: "success", title: "Schedule deleted" });
    } catch {
      addToast({ type: "error", title: "Failed to delete schedule" });
    }
  }

  async function handleRunNowSchedule(id: string) {
    setRunningScheduleId(id);
    try {
      const result = await runNowApi(id);
      addToast({ type: "success", title: `Execution started: ${result.executionId}` });
      await loadSchedules();
    } catch (err) {
      addToast({ type: "error", title: String(err) });
    } finally {
      setRunningScheduleId(null);
    }
  }

  function handleCreateWorkflow(name: string) {
    createWorkflow.mutate(
      { name, projectId: projectId ?? undefined },
      { onSuccess: (wf) => navigate(`/automations/${wf.id}`) },
    );
  }

  // Build agent lookup map for schedule cards
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  const isLoading = loadingWorkflows || loadingSchedules;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Automations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automations and scheduled agent runs for this project.
          </p>
        </div>

        {/* New Automation dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              New Automation
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setCreateWorkflowOpen(true)} className="gap-2">
              <GitBranch className="h-4 w-4" />
              New Workflow
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingSchedule(undefined); setScheduleDialogOpen(true); }} className="gap-2">
              <Clock className="h-4 w-4" />
              New Schedule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading automations...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Workflows section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Automations
                </h2>
                <span className="ml-auto text-xs text-muted-foreground">{workflows.length}</span>
              </div>
              {workflows.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                  <GitBranch className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No workflows yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
                    Workflows define how work items move through states and which agents handle each step.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1.5"
                    onClick={() => setCreateWorkflowOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create Workflow
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workflows.map((wf) => (
                    <WorkflowCardLoader
                      key={wf.id}
                      workflow={wf}
                      onEdit={() => navigate(`/automations/${wf.id}`)}
                      onToggleAutoRouting={handleToggleAutoRouting}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Schedules section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Schedules
                </h2>
                <span className="ml-auto text-xs text-muted-foreground">{schedules.length}</span>
              </div>
              {schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No schedules configured</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
                    Schedules let you run agents automatically on a recurring basis.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1.5"
                    onClick={() => setScheduleDialogOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Schedule
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {schedules.map((schedule) => {
                    const agent = agentMap.get(schedule.agentId as `ps-${string}`);
                    return (
                      <ScheduleCard
                        key={schedule.id}
                        schedule={schedule}
                        agentAvatar={agent?.avatar ?? null}
                        onToggle={handleToggleSchedule}
                        onEdit={handleEditSchedule}
                        onDelete={handleDeleteSchedule}
                        onRunNow={handleRunNowSchedule}
                        runningId={runningScheduleId}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {/* Create Workflow — reuses the existing dialog but controlled externally */}
      <ControlledCreateWorkflowDialog
        open={createWorkflowOpen}
        onOpenChange={setCreateWorkflowOpen}
        onCreate={handleCreateWorkflow}
      />

      <ScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) setEditingSchedule(undefined);
        }}
        projectId={projectId as string | undefined}
        onSaved={loadSchedules}
        editingSchedule={editingSchedule}
      />
    </div>
  );
}

// ── Workflow card with lazy state loading ────────────────────────

function WorkflowCardLoader({ workflow, onEdit, onToggleAutoRouting }: { workflow: Workflow; onEdit: () => void; onToggleAutoRouting?: (id: string, autoRouting: boolean) => void }) {
  const { data: workflowDetail } = useWorkflow(workflow.id);

  const states: WorkflowStateEntity[] = workflowDetail?.states ?? [];

  return <WorkflowCard workflow={workflow} states={states} onEdit={onEdit} onToggleAutoRouting={onToggleAutoRouting} />;
}

// ── Controlled wrapper for CreateWorkflowDialog ──────────────────
// The original CreateWorkflowDialog uses DialogTrigger internally,
// so we replicate the dialog contents here for external open control.

interface ControlledCreateWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}

function ControlledCreateWorkflowDialog({ open, onOpenChange, onCreate }: ControlledCreateWorkflowDialogProps) {
  const [name, setName] = useState("");

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Workflow</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bug Triage, Feature Pipeline"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page component ──────────────────────────────────────────

export function WorkflowsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: workflowData } = useWorkflow(id ?? null);
  const updateWorkflow = useUpdateWorkflow();
  const publishWorkflow = usePublishWorkflow();

  const handleSave = (name: string, states: StateCardData[]) => {
    if (!id) return;
    const allTransitions = states.flatMap((s) =>
      s.transitions.map((t, i) => ({
        id: t.id,
        fromStateId: s.id,
        toStateId: t.toStateId,
        label: t.label,
        sortOrder: i,
      })),
    );
    updateWorkflow.mutate({
      id,
      name,
      states: states.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        color: s.color,
        agentId: s.agentId,
        sortOrder: s.sortOrder,
      })),
      transitions: allTransitions,
    });
  };

  const handlePublish = async (name: string, states: StateCardData[]) => {
    if (!id) return;
    const allTransitions = states.flatMap((s) =>
      s.transitions.map((t, i) => ({
        id: t.id,
        fromStateId: s.id,
        toStateId: t.toStateId,
        label: t.label,
        sortOrder: i,
      })),
    );
    await updateWorkflow.mutateAsync({
      id,
      name,
      states: states.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        color: s.color,
        agentId: s.agentId,
        sortOrder: s.sortOrder,
      })),
      transitions: allTransitions,
    });
    publishWorkflow.mutate(id);
  };

  // No ID — show the new Automations overview
  if (!id) {
    return <AutomationsOverview />;
  }

  // Loading state for builder
  if (!workflowData) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading workflow...</p>
      </div>
    );
  }

  // Convert API data to StateCardData[]
  const initialStates: StateCardData[] = workflowData.states.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type as "initial" | "intermediate" | "terminal",
    color: s.color,
    agentId: s.agentId ?? null,
    sortOrder: s.sortOrder,
    transitions: workflowData.transitions
      .filter((t) => t.fromStateId === s.id)
      .map((t) => ({ id: t.id, toStateId: t.toStateId, label: t.label })),
  }));

  const handleToggleAutoRouting = () => {
    if (!id) return;
    updateWorkflow.mutate({ id, autoRouting: !workflowData.workflow.autoRouting });
  };

  return (
    <WorkflowBuilder
      workflowId={id}
      workflowName={workflowData.workflow.name}
      isPublished={workflowData.workflow.isPublished}
      autoRouting={workflowData.workflow.autoRouting}
      initialStates={initialStates}
      onSave={handleSave}
      onPublish={handlePublish}
      onToggleAutoRouting={handleToggleAutoRouting}
    />
  );
}
