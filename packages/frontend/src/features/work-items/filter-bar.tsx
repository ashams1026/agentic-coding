import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Bot, ArrowUp, ArrowDown, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { WORKFLOW } from "@agentops/shared";
import { usePersonas, useWorkItems, useSelectedProject } from "@/hooks";
import {
  useWorkItemsStore,
  type GroupBy,
  type SortBy,
} from "@/stores/work-items-store";

const priorities = [
  { value: "p0", label: "P0 — Critical" },
  { value: "p1", label: "P1 — High" },
  { value: "p2", label: "P2 — Medium" },
  { value: "p3", label: "P3 — Low" },
];

// ── Label color mapping (deterministic based on label string) ──

const LABEL_COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed",
  "#0891b2", "#ea580c", "#059669", "#db2777", "#4f46e5",
];

function getLabelColor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = ((hash << 5) - hash + label.charCodeAt(i)) | 0;
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length]!;
}

export function FilterBar() {
  const {
    searchQuery,
    groupBy,
    sortBy,
    sortDir,
    filterState,
    filterPriority,
    filterPersonas,
    filterLabels,
    showArchived,
    setSearchQuery,
    setGroupBy,
    setSortBy,
    toggleSortDir,
    setFilterState,
    setFilterPriority,
    toggleFilterPersona,
    toggleFilterLabel,
    setShowArchived,
    clearFilters,
  } = useWorkItemsStore();

  const { projectId } = useSelectedProject();
  const { data: personas } = usePersonas();
  const { data: allItems } = useWorkItems(undefined, projectId ?? undefined);

  // Local input state for debounce
  const [inputValue, setInputValue] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync store → local when store changes externally (e.g. clearFilters)
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Debounce local → store at 200ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 200);
    return () => clearTimeout(timer);
  }, [inputValue, setSearchQuery]);

  // Collect unique labels from all work items
  const allLabels = useMemo(() => {
    if (!allItems) return [];
    const labelSet = new Set<string>();
    for (const item of allItems) {
      for (const label of item.labels) {
        labelSet.add(label);
      }
    }
    return [...labelSet].sort();
  }, [allItems]);

  const hasFilters =
    searchQuery !== "" ||
    filterState !== null ||
    filterPriority !== null ||
    filterPersonas.length > 0 ||
    filterLabels.length > 0 ||
    showArchived;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Text search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search items..."
          className="h-8 w-[200px] pl-8 pr-8 text-xs"
        />
        {inputValue && (
          <button
            onClick={() => {
              setInputValue("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter by state */}
      <Select
        value={filterState ?? "all"}
        onValueChange={(v) => setFilterState(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[150px] h-8 text-xs">
          <SelectValue placeholder="State" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All states</SelectItem>
          {WORKFLOW.states.map((s) => (
            <SelectItem key={s.name} value={s.name}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filter by priority */}
      <Select
        value={filterPriority ?? "all"}
        onValueChange={(v) => setFilterPriority(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {priorities.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filter by persona (multi-select) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            Persona
            {filterPersonas.length > 0 && (
              <Badge variant="secondary" size="sm" className="ml-0.5">
                {filterPersonas.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[180px]">
          <DropdownMenuLabel className="text-xs">Filter by persona</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {personas?.map((p) => (
            <DropdownMenuCheckboxItem
              key={p.id as string}
              checked={filterPersonas.includes(p.id as string)}
              onCheckedChange={() => toggleFilterPersona(p.id as string)}
              className="text-xs"
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.avatar.color }}
                />
                {p.name}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filter by label (multi-select) */}
      {allLabels.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              Labels
              {filterLabels.length > 0 && (
                <Badge variant="secondary" size="sm" className="ml-0.5">
                  {filterLabels.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[180px]">
            <DropdownMenuLabel className="text-xs">Filter by label</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allLabels.map((label) => (
              <DropdownMenuCheckboxItem
                key={label}
                checked={filterLabels.includes(label)}
                onCheckedChange={() => toggleFilterLabel(label)}
                className="text-xs"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: getLabelColor(label) }}
                  />
                  {label}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Show archived toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-3.5 w-3.5" />
            Archived
          </Button>
        </TooltipTrigger>
        <TooltipContent>{showArchived ? "Hide archived items" : "Show archived items"}</TooltipContent>
      </Tooltip>

      {/* Group by */}
      <Select
        value={groupBy}
        onValueChange={(v) => setGroupBy(v as GroupBy)}
      >
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue placeholder="Group by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No grouping</SelectItem>
          <SelectItem value="state">Group by state</SelectItem>
          <SelectItem value="parent">Group by parent</SelectItem>
          <SelectItem value="priority">Group by priority</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort by */}
      <div className="flex items-center gap-0.5">
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as SortBy)}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Sort by priority</SelectItem>
            <SelectItem value="created">Sort by created</SelectItem>
            <SelectItem value="updated">Sort by updated</SelectItem>
          </SelectContent>
        </Select>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={toggleSortDir}
            >
              {sortDir === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{sortDir === "asc" ? "Ascending" : "Descending"}</TooltipContent>
        </Tooltip>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={clearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear all filters</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
