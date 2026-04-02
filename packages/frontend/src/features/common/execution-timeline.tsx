import { useState, useMemo } from "react";
import {
  Bot,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Clock,
  Loader2,
  RotateCcw,
  FileText,
  GitBranch,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useExecutions, useAgents } from "@/hooks";
import { retryWorkItem } from "@/api";
import { useToastStore } from "@/stores/toast-store";
import { RewindButton } from "./rewind-button";
import type {
  Execution,
  Agent,
  WorkItemId,
} from "@agentops/shared";

// ── Duration formatting ─────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms === 0) return "running...";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

// ── Outcome badge ───────────────────────────────────────────────

function OutcomeBadge({ outcome, status }: { outcome: Execution["outcome"]; status: Execution["status"] }) {
  if (status === "running") {
    return (
      <Badge variant="outline" className="text-xs border-emerald-400 text-emerald-600 dark:text-emerald-400">
        <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />
        running
      </Badge>
    );
  }

  if (outcome === "success") {
    return (
      <Badge variant="outline" className="text-xs border-green-400 text-green-600 dark:text-green-400">
        <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
        success
      </Badge>
    );
  }

  if (outcome === "failure") {
    return (
      <Badge variant="outline" className="text-xs border-red-400 text-red-600 dark:text-red-400">
        <XCircle className="mr-1 h-2.5 w-2.5" />
        failure
      </Badge>
    );
  }

  if (outcome === "rejected") {
    return (
      <Badge variant="outline" className="text-xs border-amber-400 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="mr-1 h-2.5 w-2.5" />
        rejected
      </Badge>
    );
  }

  return null;
}

// ── Timeline entry ──────────────────────────────────────────────

interface TimelineEntryProps {
  execution: Execution;
  agent: Agent | undefined;
  isLast: boolean;
  onRetry?: () => void;
}

function TimelineEntry({ execution, agent, isLast, onRetry }: TimelineEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const avatarColor = agent?.avatar.color ?? "#6b7280";
  const agentName = agent?.name ?? "Agent";

  return (
    <div className="flex gap-3">
      {/* Timeline track */}
      <div className="flex flex-col items-center">
        {/* Avatar dot */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: avatarColor + "20" }}
            >
              <Bot className="h-4 w-4" style={{ color: avatarColor }} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {agentName}
          </TooltipContent>
        </Tooltip>
        {/* Vertical line connector */}
        {!isLast && (
          <div className="w-px flex-1 bg-border mt-1" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isLast ? "" : "pb-5"}`}>
        {/* Summary row */}
        <button
          className="flex items-start gap-2 w-full text-left group"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{agentName}</span>
              {" ran for "}
              <span className="font-mono text-xs">
                {formatDuration(execution.durationMs)}
              </span>
            </p>
            {execution.summary && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 group-hover:text-foreground/70 transition-colors">
                {execution.summary}
              </p>
            )}
          </div>
        </button>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-1.5 ml-6">
          <OutcomeBadge outcome={execution.outcome} status={execution.status} />
          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
            <DollarSign className="h-2.5 w-2.5" />
            {formatCost(execution.costUsd)}
          </span>
          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {new Date(execution.startedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          {execution.status !== "running" && execution.checkpointMessageId && (
            <RewindButton execution={execution} />
          )}
        </div>

        {/* Retry button for failed executions */}
        {execution.outcome === "failure" && onRetry && (
          <div className="mt-2 ml-6">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={onRetry}
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </Button>
          </div>
        )}

        {/* Expanded: handoff notes */}
        {expanded && execution.handoffNotes && (
          <div className="mt-3 ml-6 rounded-md border bg-card p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              Handoff Notes
              <span className="text-[10px] font-normal">
                ({execution.handoffNotes.fromState} → {execution.handoffNotes.targetState})
              </span>
            </div>
            <p className="text-xs text-foreground/80">{execution.handoffNotes.summary}</p>
            {execution.handoffNotes.decisions.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground mb-1">
                  <Lightbulb className="h-2.5 w-2.5" />
                  Decisions
                </div>
                <ul className="text-xs text-foreground/70 space-y-0.5 ml-4 list-disc">
                  {execution.handoffNotes.decisions.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
            {execution.handoffNotes.filesChanged.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground mb-1">
                  <FileText className="h-2.5 w-2.5" />
                  Files Changed ({execution.handoffNotes.filesChanged.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {execution.handoffNotes.filesChanged.map((f, i) => (
                    <span key={i} className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {execution.handoffNotes.openQuestions.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 mb-1">
                  <HelpCircle className="h-2.5 w-2.5" />
                  Open Questions
                </div>
                <ul className="text-xs text-amber-600/80 dark:text-amber-400/80 space-y-0.5 ml-4 list-disc">
                  {execution.handoffNotes.openQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Expanded: logs */}
        {expanded && execution.logs && (
          <div className="mt-3 ml-6 rounded-md border bg-muted/30 p-3 overflow-x-auto">
            <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {execution.logs}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

interface ExecutionTimelineProps {
  workItemId: WorkItemId;
}

export function ExecutionTimeline({ workItemId }: ExecutionTimelineProps) {
  const { data: executions = [] } = useExecutions(workItemId);
  const { data: agents = [] } = useAgents();
  const addToast = useToastStore((s) => s.addToast);

  const agentMap = useMemo(
    () => new Map(agents.map((p) => [p.id as string, p])),
    [agents],
  );

  // Sort by startedAt descending (most recent first)
  const sorted = useMemo(
    () =>
      [...executions].sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      ),
    [executions],
  );

  const handleRetry = () => {
    retryWorkItem(workItemId).then(() => {
      addToast({ type: "info", title: "Retry dispatched", description: "A new execution has been queued." });
    }).catch(() => {
      addToast({ type: "error", title: "Retry failed", description: "Could not dispatch retry." });
    });
  };

  if (sorted.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-3">
        Execution History
        <span className="ml-1 text-xs">({sorted.length})</span>
      </p>

      <div className="space-y-0">
        {sorted.map((execution, i) => (
          <TimelineEntry
            key={execution.id}
            execution={execution}
            agent={agentMap.get(execution.agentId as string)}
            isLast={i === sorted.length - 1}
            onRetry={execution.outcome === "failure" ? handleRetry : undefined}
          />
        ))}
      </div>
    </div>
  );
}
