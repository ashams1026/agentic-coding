import {
  ChevronDown,
  FileText,
  AlertTriangle,
  Brain,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useProjectMemories, useStories } from "@/hooks";
import type { Task, ExecutionContextEntry, ProjectMemory } from "@agentops/shared";
import { useMemo } from "react";

// ── Outcome badge ──────────────────────────────────────────────

function OutcomeBadge({ outcome }: { outcome: string }) {
  switch (outcome) {
    case "success":
      return (
        <Badge variant="outline" className="text-[10px] text-green-600 dark:text-green-400">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          success
        </Badge>
      );
    case "failure":
      return (
        <Badge variant="outline" className="text-[10px] text-red-600 dark:text-red-400">
          <XCircle className="mr-1 h-3 w-3" />
          failure
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400">
          <AlertCircle className="mr-1 h-3 w-3" />
          rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px]">
          {outcome}
        </Badge>
      );
  }
}

// ── Severity badge ─────────────────────────────────────────────

const severityColors: Record<string, string> = {
  low: "text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700",
  medium: "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700",
  high: "text-red-600 dark:text-red-400 border-red-300 dark:border-red-700",
};

// ── Run summary entry ──────────────────────────────────────────

function RunEntry({ entry, index }: { entry: ExecutionContextEntry; index: number }) {
  return (
    <div className="rounded-md border bg-muted/10 px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Run #{index + 1}
          <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/70">
            {entry.executionId}
          </span>
        </span>
        <OutcomeBadge outcome={entry.outcome} />
      </div>
      <p className="text-sm">{entry.summary}</p>

      {/* Rejection payload */}
      {entry.rejectionPayload && (
        <div className="mt-1.5 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Rejection
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] ${severityColors[entry.rejectionPayload.severity] ?? ""}`}
            >
              {entry.rejectionPayload.severity}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              Attempt {entry.rejectionPayload.retryCount}
            </span>
          </div>
          <p className="text-sm text-amber-900 dark:text-amber-100">
            {entry.rejectionPayload.reason}
          </p>
          {entry.rejectionPayload.hint && (
            <p className="text-xs text-muted-foreground italic">
              Hint: {entry.rejectionPayload.hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Project memory row ─────────────────────────────────────────

function MemoryRow({ memory }: { memory: ProjectMemory }) {
  return (
    <div className="rounded-md border bg-muted/10 px-3 py-2.5 space-y-1.5">
      <p className="text-sm">{memory.summary}</p>
      {memory.keyDecisions.length > 0 && (
        <ul className="space-y-0.5">
          {memory.keyDecisions.map((d, i) => (
            <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
              <span className="shrink-0">•</span>
              {d}
            </li>
          ))}
        </ul>
      )}
      {memory.filesChanged.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {memory.filesChanged.map((f) => (
            <Badge key={f} variant="secondary" className="text-[10px] font-mono">
              {f}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

interface ExecutionContextViewerProps {
  task: Task;
}

export function ExecutionContextViewer({ task }: ExecutionContextViewerProps) {
  const { data: stories = [] } = useStories();

  const story = useMemo(
    () => stories.find((s) => s.id === task.storyId),
    [stories, task.storyId],
  );

  const { data: memories = [] } = useProjectMemories(
    story?.projectId ?? ("" as never),
  );

  // Filter memories relevant to this task's story
  const storyMemories = useMemo(
    () => memories.filter((m) => m.storyId === task.storyId),
    [memories, task.storyId],
  );

  const hasRunSummaries = task.executionContext.length > 0;
  const hasRejections = task.executionContext.some((e) => e.rejectionPayload !== null);
  const hasMemories = storyMemories.length > 0;

  if (!hasRunSummaries && !hasMemories) return null;

  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group py-1">
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
        <p className="text-sm font-medium text-muted-foreground">
          Execution Context
        </p>
        {hasRejections && (
          <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400">
            has rejections
          </Badge>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 rounded-lg border bg-muted/20 px-4 py-3 space-y-5">
          {/* Previous run summaries */}
          {hasRunSummaries && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Previous Run Summaries
                </p>
              </div>
              <div className="space-y-2">
                {task.executionContext.map((entry, i) => (
                  <RunEntry key={entry.executionId} entry={entry} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Rejection payloads (filtered view) */}
          {hasRejections && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <p className="text-[11px] text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  Rejection Payloads
                </p>
              </div>
              <div className="space-y-2">
                {task.executionContext
                  .filter((e) => e.rejectionPayload !== null)
                  .map((entry) => (
                    <div
                      key={entry.executionId}
                      className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 px-3 py-2.5 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                          Run #{task.executionContext.indexOf(entry) + 1}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${severityColors[entry.rejectionPayload!.severity] ?? ""}`}
                        >
                          {entry.rejectionPayload!.severity}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          Attempt {entry.rejectionPayload!.retryCount} of 3
                        </span>
                      </div>
                      <p className="text-sm">{entry.rejectionPayload!.reason}</p>
                      {entry.rejectionPayload!.hint && (
                        <p className="text-xs text-muted-foreground italic">
                          Hint: {entry.rejectionPayload!.hint}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Project memory injected */}
          {hasMemories && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="h-3 w-3 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Project Memory Injected
                </p>
              </div>
              <div className="space-y-2">
                {storyMemories.map((m) => (
                  <MemoryRow key={m.id} memory={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
