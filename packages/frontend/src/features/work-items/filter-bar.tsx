import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORKFLOW } from "@agentops/shared";
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

export function FilterBar() {
  const {
    searchQuery,
    groupBy,
    sortBy,
    filterState,
    filterPriority,
    setSearchQuery,
    setGroupBy,
    setSortBy,
    setFilterState,
    setFilterPriority,
    clearFilters,
  } = useWorkItemsStore();

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

  const hasFilters = searchQuery !== "" || filterState !== null || filterPriority !== null;

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

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={clearFilters}
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
