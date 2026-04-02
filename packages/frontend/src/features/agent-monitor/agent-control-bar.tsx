import { useEffect, useState } from "react";
import {
  Bot,
  ChevronRight,
  DollarSign,
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
import { useExecution, useAgents, useWorkItems, useProjectFromUrl } from "@/hooks";
import { RewindButton } from "@/features/common/rewind-button";
import type { ExecutionId, WorkItemId } from "@agentops/shared";

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
  opus: { label: "Opus", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  sonnet: { label: "Sonnet", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  haiku: { label: "Haiku", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

// ── Main component ────────────────────────────────────────────────

interface AgentControlBarProps {
  executionId: ExecutionId;
  onWorkItemClick?: (id: WorkItemId) => void;
}

export function AgentControlBar({ executionId, onWorkItemClick }: AgentControlBarProps) {
  const { projectId } = useProjectFromUrl();
  const { data: execution } = useExecution(executionId);
  const { data: agents = [] } = useAgents();
  const { data: allItems = [] } = useWorkItems(undefined, projectId ?? undefined);

  const [elapsed, setElapsed] = useState("");

  const agent = execution
    ? agents.find((p) => p.id === execution.agentId)
    : null;

  const workItem = execution
    ? allItems.find((item) => item.id === execution.workItemId)
    : null;

  const targetName = workItem?.title ?? execution?.workItemId ?? "";

  // Build breadcrumb chain: parent(s) → work item
  const parentItem = workItem?.parentId
    ? allItems.find((item) => item.id === workItem.parentId)
    : null;

  // Live elapsed timer
  useEffect(() => {
    if (!execution?.startedAt) return;
    setElapsed(formatElapsed(execution.startedAt));
    const interval = setInterval(() => {
      setElapsed(formatElapsed(execution.startedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [execution?.startedAt]);

  if (!execution || !agent) return null;

  const model = modelConfig[agent.model] ?? modelConfig.sonnet!;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30">
      {/* Agent avatar + name */}
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full shrink-0"
          style={{ backgroundColor: agent.avatar.color + "20" }}
        >
          <Bot className="h-3.5 w-3.5" style={{ color: agent.avatar.color }} />
        </div>
        <span className="text-sm font-medium truncate">{agent.name}</span>
      </div>

      {/* Model badge */}
      <Badge
        variant="outline"
        className={`text-xs shrink-0 ${model.color}`}
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

      {/* Breadcrumb: Parent > Work Item */}
      {(parentItem || workItem) && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
          {parentItem && (
            <>
              <button
                onClick={() => onWorkItemClick?.(parentItem.id)}
                className="hover:text-foreground transition-colors truncate max-w-[120px]"
              >
                {parentItem.title}
              </button>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </>
          )}
          {workItem && (
            <button
              onClick={() => onWorkItemClick?.(workItem.id)}
              className="text-foreground font-medium truncate max-w-[180px]"
            >
              {targetName}
            </button>
          )}
        </div>
      )}

      {/* Rewind button — for completed executions with checkpoint */}
      {execution.status !== "running" && execution.checkpointMessageId && (
        <RewindButton execution={execution} />
      )}

      {/* Stop button — graceful cancel */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <StopCircle className="h-3.5 w-3.5" />
            Stop
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This will gracefully cancel{" "}
              <span className="font-medium text-foreground">{agent.name}</span>{" "}
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
          <Button variant="destructive" size="sm" className="gap-1.5">
            <OctagonX className="h-3.5 w-3.5" />
            Force Stop
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force stop agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately terminate{" "}
              <span className="font-medium text-foreground">{agent.name}</span>.
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
