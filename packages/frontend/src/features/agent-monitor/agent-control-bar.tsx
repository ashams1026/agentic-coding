import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Bot,
  DollarSign,
  ExternalLink,
  OctagonX,
  StopCircle,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useExecution, usePersonas, useWorkItems } from "@/hooks";
import type { ExecutionId } from "@agentops/shared";

// ── Helpers ───────────────────────────────────────────────────────

function formatElapsed(startedAt: string): string {
  const elapsed = Date.now() - new Date(startedAt).getTime();
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

const modelConfig: Record<string, { label: string; color: string }> = {
  opus: { label: "Opus", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  sonnet: { label: "Sonnet", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  haiku: { label: "Haiku", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

// ── Main component ────────────────────────────────────────────────

interface AgentControlBarProps {
  executionId: ExecutionId;
}

export function AgentControlBar({ executionId }: AgentControlBarProps) {
  const { data: execution } = useExecution(executionId);
  const { data: personas = [] } = usePersonas();
  const { data: allItems = [] } = useWorkItems();

  const [elapsed, setElapsed] = useState("");

  const persona = execution
    ? personas.find((p) => p.id === execution.personaId)
    : null;

  const workItem = execution
    ? allItems.find((item) => item.id === execution.workItemId)
    : null;

  const targetName = workItem?.title ?? execution?.workItemId ?? "";

  // Find parent work item
  const parentWorkItemId = workItem?.parentId ?? null;

  // Live elapsed timer
  useEffect(() => {
    if (!execution?.startedAt) return;
    setElapsed(formatElapsed(execution.startedAt));
    const interval = setInterval(() => {
      setElapsed(formatElapsed(execution.startedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [execution?.startedAt]);

  if (!execution || !persona) return null;

  const model = modelConfig[persona.model] ?? modelConfig.sonnet!;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30">
      {/* Persona avatar + name */}
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full shrink-0"
          style={{ backgroundColor: persona.avatar.color + "20" }}
        >
          <Bot className="h-3.5 w-3.5" style={{ color: persona.avatar.color }} />
        </div>
        <span className="text-sm font-medium truncate">{persona.name}</span>
      </div>

      {/* Model badge */}
      <Badge
        variant="outline"
        className={`text-[10px] shrink-0 ${model.color}`}
      >
        {model.label}
      </Badge>

      {/* Elapsed time */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums shrink-0">
        <Timer className="h-3 w-3" />
        {elapsed}
      </div>

      {/* Running cost */}
      <div className="flex items-center gap-0.5 text-xs text-muted-foreground tabular-nums shrink-0">
        <DollarSign className="h-3 w-3" />
        {execution.costUsd.toFixed(2)}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Navigation links */}
      {execution.workItemId && (
        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" asChild>
          <Link to={`/work-items/${execution.workItemId}`}>
            Work Item
            <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        </Button>
      )}
      {parentWorkItemId && (
        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" asChild>
          <Link to={`/work-items/${parentWorkItemId}`}>
            Parent
            <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        </Button>
      )}

      {/* Stop button — graceful cancel */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
            <StopCircle className="h-3.5 w-3.5" />
            Stop
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This will gracefully cancel{" "}
              <span className="font-medium text-foreground">{persona.name}</span>{" "}
              working on{" "}
              <span className="font-medium text-foreground">{targetName}</span>.
              The agent will finish its current operation and stop.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Stop Agent</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Force Stop button — immediate kill */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" className="h-7 text-xs gap-1.5">
            <OctagonX className="h-3.5 w-3.5" />
            Force Stop
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force stop agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately terminate{" "}
              <span className="font-medium text-foreground">{persona.name}</span>.
              Any in-progress work will be lost. The work item will be marked as failed
              and may need to be re-run.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Force Stop
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
