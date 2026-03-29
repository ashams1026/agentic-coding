import { useMemo } from "react";
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  ShieldAlert,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useExecutions, usePersonas } from "@/hooks";
import type { Task, Execution, Persona } from "@agentops/shared";

// ── Severity config ────────────────────────────────────────────

const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
  low: {
    color: "text-yellow-700 dark:text-yellow-300",
    bg: "bg-yellow-50/50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  medium: {
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50/50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
  high: {
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-50/50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
  },
};

const defaultSeverity = severityConfig.medium!;

// ── Rejection event ────────────────────────────────────────────

interface RejectionEventProps {
  execution: Execution;
  persona: Persona | undefined;
  attemptNumber: number;
  totalRejections: number;
  isCurrent: boolean;
}

function RejectionEvent({ execution, persona, attemptNumber, totalRejections, isCurrent }: RejectionEventProps) {
  const payload = execution.rejectionPayload!;
  const severity = severityConfig[payload.severity] ?? defaultSeverity;

  return (
    <div className="relative flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        {/* Persona avatar */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isCurrent ? "ring-2 ring-amber-400 dark:ring-amber-500" : ""}`}
          style={{ backgroundColor: (persona?.avatar.color ?? "#6b7280") + "20" }}
        >
          <Bot
            className="h-4 w-4"
            style={{ color: persona?.avatar.color ?? "#6b7280" }}
          />
        </div>
        {/* Vertical line (except last) */}
        {attemptNumber < totalRejections && (
          <div className="w-px flex-1 bg-border mt-1" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 rounded-lg border px-4 py-3 space-y-2 mb-3 ${isCurrent ? severity.border + " " + severity.bg : ""}`}>
        {/* Header row */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-sm font-medium">
            {persona?.name ?? "Reviewer"}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] ${severity.color}`}
          >
            {payload.severity}
          </Badge>
          <Badge
            variant={isCurrent ? "default" : "secondary"}
            className="text-[10px]"
          >
            Attempt {payload.retryCount} of 3
          </Badge>
          {isCurrent && (
            <Badge className="text-[10px] bg-amber-500 hover:bg-amber-500 text-white">
              current
            </Badge>
          )}
          {execution.completedAt && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {new Date(execution.completedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Reason */}
        <p className="text-sm">{payload.reason}</p>

        {/* Hint */}
        {payload.hint && (
          <div className="flex gap-1.5 items-start">
            <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground italic">
              {payload.hint}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

interface RejectionHistoryProps {
  task: Task;
}

export function RejectionHistory({ task }: RejectionHistoryProps) {
  const { data: executions = [] } = useExecutions(task.id);
  const { data: personas = [] } = usePersonas();

  const personaMap = useMemo(
    () => new Map(personas.map((p) => [p.id as string, p])),
    [personas],
  );

  // Filter to rejected executions, sorted by startedAt ascending (oldest first)
  const rejections = useMemo(() => {
    return executions
      .filter((e) => e.outcome === "rejected" && e.rejectionPayload !== null)
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  }, [executions]);

  if (rejections.length === 0) return null;

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group py-1">
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
          Rejection History
        </p>
        <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400">
          {rejections.length} rejection{rejections.length !== 1 ? "s" : ""}
        </Badge>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 pl-1">
          {rejections.map((exec, i) => (
            <RejectionEvent
              key={exec.id}
              execution={exec}
              persona={personaMap.get(exec.personaId as string)}
              attemptNumber={i + 1}
              totalRejections={rejections.length}
              isCurrent={i === rejections.length - 1}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
