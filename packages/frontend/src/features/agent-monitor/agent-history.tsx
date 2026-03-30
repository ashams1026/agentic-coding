import { useState, useMemo } from "react";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Clock,
  DollarSign,
  Filter,
  Timer,
  TrendingUp,
  Hash,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useExecutions, usePersonas, useWorkItems, useSelectedProject } from "@/hooks";
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
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  failure: {
    label: "Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  rejected: {
    label: "Rejected",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
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

// ── Filter types ──────────────────────────────────────────────────

interface Filters {
  personaId: string; // "all" or PersonaId
  outcome: string; // "all" | "success" | "failure" | "rejected"
  costMin: string; // empty or number string
  costMax: string; // empty or number string
}

const defaultFilters: Filters = {
  personaId: "all",
  outcome: "all",
  costMin: "",
  costMax: "",
};

// ── Stats bar ─────────────────────────────────────────────────────

interface StatsBarProps {
  executions: Execution[];
}

function StatsBar({ executions }: StatsBarProps) {
  const stats = useMemo(() => {
    const total = executions.length;
    const totalCost = executions.reduce((sum, e) => sum + e.costUsd, 0);
    const successCount = executions.filter((e) => e.outcome === "success").length;
    const successRate = total > 0 ? (successCount / total) * 100 : 0;
    const totalDuration = executions.reduce((sum, e) => sum + e.durationMs, 0);
    const avgDuration = total > 0 ? totalDuration / total : 0;
    return { total, totalCost, successRate, avgDuration };
  }, [executions]);

  return (
    <div className="flex items-center gap-6 px-4 py-2.5 border-b bg-muted/20">
      <div className="flex items-center gap-1.5">
        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Runs</span>
        <span className="text-sm font-semibold tabular-nums">{stats.total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Total Cost</span>
        <span className="text-sm font-semibold tabular-nums">
          ${stats.totalCost.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Success</span>
        <span className="text-sm font-semibold tabular-nums">
          {stats.successRate.toFixed(0)}%
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Timer className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Avg Duration</span>
        <span className="text-sm font-semibold tabular-nums">
          {formatDuration(stats.avgDuration)}
        </span>
      </div>
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  personas: { id: string; name: string }[];
  hasActiveFilters: boolean;
}

function FilterBar({ filters, onChange, personas, hasActiveFilters }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/10">
      <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

      {/* Persona filter */}
      <Select
        value={filters.personaId}
        onValueChange={(v) => onChange({ ...filters, personaId: v })}
      >
        <SelectTrigger className="h-7 w-[140px] text-xs">
          <SelectValue placeholder="All agents" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All agents</SelectItem>
          {personas.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Outcome filter */}
      <Select
        value={filters.outcome}
        onValueChange={(v) => onChange({ ...filters, outcome: v })}
      >
        <SelectTrigger className="h-7 w-[120px] text-xs">
          <SelectValue placeholder="All outcomes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All outcomes</SelectItem>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="failure">Failed</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      {/* Cost range */}
      <div className="flex items-center gap-1">
        <DollarSign className="h-3 w-3 text-muted-foreground" />
        <Input
          type="number"
          placeholder="Min"
          value={filters.costMin}
          onChange={(e) => onChange({ ...filters, costMin: e.target.value })}
          className="h-7 w-[70px] text-xs"
          step="0.01"
          min="0"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="number"
          placeholder="Max"
          value={filters.costMax}
          onChange={(e) => onChange({ ...filters, costMax: e.target.value })}
          className="h-7 w-[70px] text-xs"
          step="0.01"
          min="0"
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => onChange(defaultFilters)}
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
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
              <Badge variant="outline" className={`text-xs ${outcome.className}`}>
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
  const { projectId } = useSelectedProject();
  const { data: executions = [] } = useExecutions(undefined, projectId ?? undefined);
  const { data: personas = [] } = usePersonas();
  const { data: allItems = [] } = useWorkItems(undefined, projectId ?? undefined);

  const [sortField, setSortField] = useState<SortField>("startedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<ExecutionId | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  // Past executions (not running)
  const historyExecutions = useMemo(
    () => executions.filter((e) => e.status !== "running"),
    [executions],
  );

  // Check if any filters are active
  const hasActiveFilters =
    filters.personaId !== "all" ||
    filters.outcome !== "all" ||
    filters.costMin !== "" ||
    filters.costMax !== "";

  // Apply filters
  const filtered = useMemo(() => {
    return historyExecutions.filter((e) => {
      if (filters.personaId !== "all" && e.personaId !== filters.personaId) return false;
      if (filters.outcome !== "all" && e.outcome !== filters.outcome) return false;
      if (filters.costMin !== "") {
        const min = parseFloat(filters.costMin);
        if (!isNaN(min) && e.costUsd < min) return false;
      }
      if (filters.costMax !== "") {
        const max = parseFloat(filters.costMax);
        if (!isNaN(max) && e.costUsd > max) return false;
      }
      return true;
    });
  }, [historyExecutions, filters]);

  // Sorted
  const sorted = useMemo(() => {
    const copy = [...filtered];
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
  }, [filtered, sortField, sortDir]);

  // Lookup maps
  const personaMap = useMemo(
    () => new Map(personas.map((p) => [p.id as string, p])),
    [personas],
  );

  const workItemNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of allItems) map.set(item.id as string, item.title);
    return map;
  }, [allItems]);

  // Unique personas that appear in history (for filter dropdown)
  const historyPersonas = useMemo(() => {
    const ids = new Set(historyExecutions.map((e) => e.personaId as string));
    return personas
      .filter((p) => ids.has(p.id as string))
      .map((p) => ({ id: p.id as string, name: p.name }));
  }, [historyExecutions, personas]);

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
    <div className="flex flex-col h-full">
      {/* Stats bar — computed from filtered results */}
      <StatsBar executions={filtered} />

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        personas={historyPersonas}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Table */}
      <div className="flex-1 overflow-auto">
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
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No executions match the current filters.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((exec) => {
                const persona = personaMap.get(exec.personaId as string);
                return (
                  <HistoryRow
                    key={exec.id}
                    execution={exec}
                    personaName={persona?.name ?? "Agent"}
                    personaColor={persona?.avatar.color ?? "#6b7280"}
                    targetName={
                      workItemNameMap.get(exec.workItemId as string) ?? exec.workItemId
                    }
                    isExpanded={expandedId === exec.id}
                    onToggle={() =>
                      setExpandedId(expandedId === exec.id ? null : exec.id)
                    }
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
