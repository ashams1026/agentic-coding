import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  LayoutDashboard,
  ListTodo,
  Bot,
  Activity,
  Users,
  Settings,
  FileText,
  CheckSquare,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useWorkItems, useSelectedProject } from "@/hooks";
import { useWorkItemsStore } from "@/stores/work-items-store";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  category: "navigation" | "work-items" | "actions";
  icon: React.ReactNode;
  onSelect: () => void;
}

// ── Navigation items ───────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Work Items", path: "/items", icon: ListTodo },
  { label: "Agent Monitor", path: "/agents", icon: Bot },
  { label: "Activity Feed", path: "/activity", icon: Activity },
  { label: "Persona Manager", path: "/personas", icon: Users },
  { label: "Settings", path: "/settings", icon: Settings },
];

const ACTION_ITEMS = [
  { id: "action-create-item", label: "Create work item", path: "/items", icon: Plus },
  { id: "action-view-agents", label: "View active agents", path: "/agents", icon: ArrowRight },
];

// ── Category labels ────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  navigation: "Navigation",
  "work-items": "Work Items",
  actions: "Quick Actions",
};

// ── Component ──────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { projectId } = useSelectedProject();
  const { data: workItems = [] } = useWorkItems(undefined, projectId ?? undefined);
  const setSelectedItemId = useWorkItemsStore((s) => s.setSelectedItemId);

  // ── Keyboard shortcut to open ────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Reset on open ────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // ── Build items ──────────────────────────────────────────────
  const allItems = useMemo((): CommandItem[] => {
    const items: CommandItem[] = [];

    // Navigation
    for (const nav of NAV_ITEMS) {
      const Icon = nav.icon;
      items.push({
        id: `nav-${nav.path}`,
        label: nav.label,
        category: "navigation",
        icon: <Icon className="h-4 w-4" />,
        onSelect: () => {
          navigate(nav.path);
          setOpen(false);
        },
      });
    }

    // Work Items
    for (const wi of workItems) {
      items.push({
        id: `work-item-${wi.id}`,
        label: wi.title,
        category: "work-items",
        icon: wi.parentId ? <CheckSquare className="h-4 w-4" /> : <FileText className="h-4 w-4" />,
        onSelect: () => {
          setSelectedItemId(wi.id);
          navigate("/items");
          setOpen(false);
        },
      });
    }

    // Actions
    for (const action of ACTION_ITEMS) {
      const Icon = action.icon;
      items.push({
        id: action.id,
        label: action.label,
        category: "actions",
        icon: <Icon className="h-4 w-4" />,
        onSelect: () => {
          navigate(action.path);
          setOpen(false);
        },
      });
    }

    return items;
  }, [workItems, navigate, setSelectedItemId]);

  // ── Filter ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [query, allItems]);

  // ── Group by category ────────────────────────────────────────
  const grouped = useMemo(() => {
    const groups: { category: string; items: CommandItem[] }[] = [];
    const categoryOrder = ["navigation", "actions", "work-items"];

    for (const cat of categoryOrder) {
      const items = filtered.filter((i) => i.category === cat);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    }
    return groups;
  }, [filtered]);

  // ── Flat list for keyboard nav ───────────────────────────────
  const flatItems = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // ── Clamp selected index ─────────────────────────────────────
  useEffect(() => {
    if (selectedIndex >= flatItems.length) {
      setSelectedIndex(Math.max(0, flatItems.length - 1));
    }
  }, [flatItems.length, selectedIndex]);

  // ── Scroll selected into view ────────────────────────────────
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // ── Keyboard handler ─────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % Math.max(1, flatItems.length));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + flatItems.length) % Math.max(1, flatItems.length));
          break;
        case "Enter":
          e.preventDefault();
          flatItems[selectedIndex]?.onSelect();
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [flatItems, selectedIndex],
  );

  let flatIndex = 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden [&>button:last-child]:hidden">
        {/* Search input */}
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 text-xs font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto py-1">
          {flatItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.category}>
                <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {CATEGORY_LABELS[group.category] ?? group.category}
                </p>
                {group.items.map((item) => {
                  const idx = flatIndex++;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={() => item.onSelect()}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent/50",
                      )}
                    >
                      <span className="text-muted-foreground shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                      {isSelected && (
                        <kbd className="ml-auto hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-xs text-muted-foreground">
                          Enter
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 py-0.5">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 py-0.5">↵</kbd> select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 py-0.5">esc</kbd> close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
