import { useState, useMemo } from "react";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Clock,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useExecutions, usePersonas, useTasks, useStories } from "@/hooks";
import { TerminalRenderer } from "./terminal-renderer";
import type { Execution, ExecutionId } from "@agentops/shared";

// ── Helpers ───────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

const outcomeBadge: Record<string, { label: string; className: string }> = {
  success: {
    label: "Success",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  failure: {
    label: "Failed",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
};

// ── Sort types ────────────────────────────────────────────────────

type SortField = "startedAt" | "durationMs" | "costUsd";
type SortDir = "asc" | "desc";

function SortIcon({ field, activeField, dir }: { field: SortField; activeField: SortField; dir: SortDir }) {
  if (field !== activeField) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? (
    <ChevronUp className="h-3 w-3" />
  ) : (
    <ChevronDown className="h-3 w-3" />
  );
}

// ── Expandable history row ────────────────────────────────────────

interface HistoryRowProps {
  execution: Execution;
  personaName: string;
  personaColor: string;
  targetName: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function HistoryRow({
  execution,
  personaName,
  personaColor,
  targetName,
  isExpanded,
  onToggle,
}: HistoryRowProps) {
  const outcome = execution.outcome
    ? outcomeBadge[execution.outcome]
    : null;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <TableRow className="cursor-pointer hover:bg-accent/50">
          <TableCell>
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full shrink-0"
                style={{ backgroundColor: personaColor + "20" }}
              >
                <Bot className="h-3.5 w-3.5" style={{ color: personaColor }} />
              </div>
              <span className="text-sm font-medium truncate max-w-[120px]">
                {personaName}
              </span>
            </div>
          </TableCell>
          <TableCell>
            <span className="text-sm truncate max-w-[200px] block">
              {targetName}
            </span>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDate(execution.startedAt)}
            </div>
          </TableCell>
          <TableCell>
            <span className="text-xs tabular-nums">
              {formatDuration(execution.durationMs)}
            </span>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-0.5 text-xs tabular-nums">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              {execution.costUsd.toFixed(2)}
            </div>
          </TableCell>
          <TableCell>
            {outcome ? (
              <Badge variant="outline" className={`text-[10px] ${outcome.className}`}>
                {outcome.label}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </TableCell>
          <TableCell className="w-8">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </TableCell>
        </TableRow>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <tr>
          <td colSpan={7} className="p-0">
            <div className="h-[300px] border-b">
              <TerminalRenderer executionId={execution.id} />
            </div>
          </td>
        </tr>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Main component ────────────────────────────────────────────────

export function AgentHistory() {
  const { data: executions = [] } = useExecutions();
  const { data: personas = [] } = usePersonas();
  const { data: tasks = [] } = useTasks();
  const { data: stories = [] } = useStories();

  const [sortField, setSortField] = useState<SortField>("startedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<ExecutionId | null>(null);

  // Past executions (not running)
  const historyExecutions = useMemo(
    () => executions.filter((e) => e.status !== "running"),
    [executions],
  );

  // Sorted
  const sorted = useMemo(() => {
    const copy = [...historyExecutions];
    copy.sort((a, b) => {
      let aVal: number;
      let bVal: number;
      switch (sortField) {
        case "startedAt":
          aVal = new Date(a.startedAt).getTime();
          bVal = new Date(b.startedAt).getTime();
          break;
        case "durationMs":
          aVal = a.durationMs;
          bVal = b.durationMs;
          break;
        case "costUsd":
          aVal = a.costUsd;
          bVal = b.costUsd;
          break;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return copy;
  }, [historyExecutions, sortField, sortDir]);

  // Lookup maps
  const personaMap = useMemo(
    () => new Map(personas.map((p) => [p.id as string, p])),
    [personas],
  );

  const targetNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) map.set(t.id as string, t.title);
    for (const s of stories) map.set(s.id as string, s.title);
    return map;
  }, [tasks, stories]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  if (historyExecutions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">No execution history</p>
          <p className="text-xs text-muted-foreground">
            Past agent runs will appear here once completed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[160px]">Agent</TableHead>
            <TableHead>Target</TableHead>
            <TableHead
              className="w-[150px] cursor-pointer select-none"
              onClick={() => toggleSort("startedAt")}
            >
              <div className="flex items-center gap-1">
                Started
                <SortIcon field="startedAt" activeField={sortField} dir={sortDir} />
              </div>
            </TableHead>
            <TableHead
              className="w-[100px] cursor-pointer select-none"
              onClick={() => toggleSort("durationMs")}
            >
              <div className="flex items-center gap-1">
                Duration
                <SortIcon field="durationMs" activeField={sortField} dir={sortDir} />
              </div>
            </TableHead>
            <TableHead
              className="w-[90px] cursor-pointer select-none"
              onClick={() => toggleSort("costUsd")}
            >
              <div className="flex items-center gap-1">
                Cost
                <SortIcon field="costUsd" activeField={sortField} dir={sortDir} />
              </div>
            </TableHead>
            <TableHead className="w-[100px]">Outcome</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((exec) => {
            const persona = personaMap.get(exec.personaId as string);
            return (
              <HistoryRow
                key={exec.id}
                execution={exec}
                personaName={persona?.name ?? "Agent"}
                personaColor={persona?.avatar.color ?? "#6b7280"}
                targetName={
                  targetNameMap.get(exec.targetId as string) ?? exec.targetId
                }
                isExpanded={expandedId === exec.id}
                onToggle={() =>
                  setExpandedId(expandedId === exec.id ? null : exec.id)
                }
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
