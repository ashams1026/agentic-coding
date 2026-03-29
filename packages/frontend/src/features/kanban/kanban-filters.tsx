import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Filter, ArrowUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useStories, usePersonas } from "@/hooks";
import type { Priority } from "@agentops/shared";

// ── Filter state from URL params ─────────────────────────────────

export interface KanbanFilters {
  labels: string[];
  priorities: Priority[];
  personas: string[];
  hasProposals: boolean;
  sortBy: "priority" | "created" | "updated";
}

const SORT_OPTIONS = [
  { value: "priority" as const, label: "Priority" },
  { value: "created" as const, label: "Created date" },
  { value: "updated" as const, label: "Updated date" },
];

export function useKanbanFilters(): [KanbanFilters, (f: Partial<KanbanFilters>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: KanbanFilters = useMemo(() => ({
    labels: searchParams.get("labels")?.split(",").filter(Boolean) ?? [],
    priorities: (searchParams.get("priorities")?.split(",").filter(Boolean) ?? []) as Priority[],
    personas: searchParams.get("personas")?.split(",").filter(Boolean) ?? [],
    hasProposals: searchParams.get("hasProposals") === "true",
    sortBy: (searchParams.get("sortBy") as KanbanFilters["sortBy"]) ?? "priority",
  }), [searchParams]);

  const setFilters = useCallback(
    (update: Partial<KanbanFilters>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (update.labels !== undefined) {
          if (update.labels.length > 0) next.set("labels", update.labels.join(","));
          else next.delete("labels");
        }
        if (update.priorities !== undefined) {
          if (update.priorities.length > 0) next.set("priorities", update.priorities.join(","));
          else next.delete("priorities");
        }
        if (update.personas !== undefined) {
          if (update.personas.length > 0) next.set("personas", update.personas.join(","));
          else next.delete("personas");
        }
        if (update.hasProposals !== undefined) {
          if (update.hasProposals) next.set("hasProposals", "true");
          else next.delete("hasProposals");
        }
        if (update.sortBy !== undefined) {
          if (update.sortBy !== "priority") next.set("sortBy", update.sortBy);
          else next.delete("sortBy");
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  return [filters, setFilters];
}

// ── Multi-select toggle helper ───────────────────────────────────

function toggleInArray<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

// ── Component ────────────────────────────────────────────────────

export function KanbanFilterBar() {
  const [filters, setFilters] = useKanbanFilters();
  const { data: stories } = useStories();
  const { data: personas } = usePersonas();

  // Derive unique labels from stories
  const allLabels = useMemo(() => {
    const set = new Set<string>();
    for (const s of stories ?? []) {
      for (const l of s.labels) set.add(l);
    }
    return Array.from(set).sort();
  }, [stories]);

  const allPriorities: Priority[] = ["p0", "p1", "p2", "p3"];

  const activeFilterCount =
    filters.labels.length +
    filters.priorities.length +
    filters.personas.length +
    (filters.hasProposals ? 1 : 0);

  const clearAll = () => {
    setFilters({ labels: [], priorities: [], personas: [], hasProposals: false, sortBy: "priority" });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Label filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Filter className="mr-1.5 h-3 w-3" />
            Labels
            {filters.labels.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0">
                {filters.labels.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="text-xs">Filter by label</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {allLabels.map((label) => (
            <DropdownMenuCheckboxItem
              key={label}
              checked={filters.labels.includes(label)}
              onCheckedChange={() =>
                setFilters({ labels: toggleInArray(filters.labels, label) })
              }
            >
              {label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Priority filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Filter className="mr-1.5 h-3 w-3" />
            Priority
            {filters.priorities.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0">
                {filters.priorities.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="text-xs">Filter by priority</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {allPriorities.map((p) => (
            <DropdownMenuCheckboxItem
              key={p}
              checked={filters.priorities.includes(p)}
              onCheckedChange={() =>
                setFilters({ priorities: toggleInArray(filters.priorities, p) })
              }
            >
              {p.toUpperCase()}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Persona filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Filter className="mr-1.5 h-3 w-3" />
            Persona
            {filters.personas.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0">
                {filters.personas.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="text-xs">Filter by persona</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(personas ?? []).map((persona) => (
            <DropdownMenuCheckboxItem
              key={persona.id}
              checked={filters.personas.includes(persona.id)}
              onCheckedChange={() =>
                setFilters({ personas: toggleInArray(filters.personas, persona.id) })
              }
            >
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: persona.avatar.color }}
              />
              {persona.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Has proposals toggle */}
      <Button
        variant={filters.hasProposals ? "default" : "outline"}
        size="sm"
        className="h-8 text-xs"
        onClick={() => setFilters({ hasProposals: !filters.hasProposals })}
      >
        Has proposals
      </Button>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <ArrowUpDown className="mr-1.5 h-3 w-3" />
            Sort: {SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="text-xs">Sort stories by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SORT_OPTIONS.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={filters.sortBy === opt.value}
              onCheckedChange={() => setFilters({ sortBy: opt.value })}
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear all */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground"
          onClick={clearAll}
        >
          <X className="mr-1 h-3 w-3" />
          Clear ({activeFilterCount})
        </Button>
      )}
    </div>
  );
}
