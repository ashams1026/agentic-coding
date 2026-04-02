import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  LayoutDashboard,
  ListTodo,
  Bot,
  Activity,
  BarChart3,
  MessageSquare,
  Users,
  GitBranch,
  Settings,
  FileText,
  User,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSelectedProject } from "@/hooks";
import { useWorkItemsStore } from "@/stores/work-items-store";
import { searchApi } from "@/api/client";
import type { SearchResult } from "@/api/client";
import type { WorkItemId } from "@agentops/shared";
import { cn } from "@/lib/utils";

// ── HTML sanitization ─────────────────────────────────────────────

/**
 * Sanitize FTS snippet HTML — only allow <b> and </b> tags (used by FTS5
 * for match highlighting). All other HTML is escaped to prevent XSS.
 */
function sanitizeSnippet(html: string): string {
  // Temporarily replace allowed <b> and </b> with placeholders
  const safe = html
    .replace(/<b>/gi, "\x00B_OPEN\x00")
    .replace(/<\/b>/gi, "\x00B_CLOSE\x00");

  // Escape all remaining HTML
  const escaped = safe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // Restore allowed tags
  return escaped
    .replace(/\x00B_OPEN\x00/g, "<b>")
    .replace(/\x00B_CLOSE\x00/g, "</b>");
}

// ── Types ──────────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  snippet?: string;
  category: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

// ── Navigation items ───────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Work Items", path: "/items", icon: ListTodo },
  { label: "Agent Monitor", path: "/agents", icon: Bot },
  { label: "Activity Feed", path: "/activity", icon: Activity },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Chat", path: "/chat", icon: MessageSquare },
  { label: "Personas", path: "/personas", icon: Users },
  { label: "Workflows", path: "/workflows", icon: GitBranch },
  { label: "Settings", path: "/settings", icon: Settings },
];

const ACTION_ITEMS = [
  { id: "action-create-item", label: "Create work item", path: "/items", icon: Plus },
  { id: "action-view-agents", label: "View active agents", path: "/agents", icon: ArrowRight },
];

// ── Category labels ────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  navigation: "Navigation",
  actions: "Quick Actions",
  work_item: "Work Items",
  persona: "Personas",
  comment: "Comments",
  chat_message: "Chat Messages",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  work_item: <FileText className="h-4 w-4" />,
  persona: <User className="h-4 w-4" />,
  comment: <MessageSquare className="h-4 w-4" />,
  chat_message: <MessageSquare className="h-4 w-4" />,
};

// ── Component ──────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const navigate = useNavigate();

  const { projectId } = useSelectedProject();
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
      setSearchResults([]);
      setSearching(false);
    }
  }, [open]);

  // ── Debounced server search ──────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchApi(query.trim(), {
          projectId: projectId ?? undefined,
          limit: 20,
        });
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, projectId]);

  // ── Build static items (nav + actions) ──────────────────────
  const staticItems = useMemo((): CommandItem[] => {
    const items: CommandItem[] = [];
    const q = query.toLowerCase();

    for (const nav of NAV_ITEMS) {
      if (q && !nav.label.toLowerCase().includes(q)) continue;
      const Icon = nav.icon;
      items.push({
        id: `nav-${nav.path}`,
        label: nav.label,
        category: "navigation",
        icon: <Icon className="h-4 w-4" />,
        onSelect: () => { navigate(nav.path); setOpen(false); },
      });
    }

    for (const action of ACTION_ITEMS) {
      if (q && !action.label.toLowerCase().includes(q)) continue;
      const Icon = action.icon;
      items.push({
        id: action.id,
        label: action.label,
        category: "actions",
        icon: <Icon className="h-4 w-4" />,
        onSelect: () => { navigate(action.path); setOpen(false); },
      });
    }

    return items;
  }, [query, navigate]);

  // ── Convert search results to CommandItems ───────────────────
  const searchItems = useMemo((): CommandItem[] => {
    return searchResults.map((r) => ({
      id: `search-${r.type}-${r.id}`,
      label: r.title,
      snippet: r.snippet,
      category: r.type,
      icon: TYPE_ICONS[r.type] ?? <FileText className="h-4 w-4" />,
      onSelect: () => {
        if (r.type === "work_item") {
          setSelectedItemId(r.id as WorkItemId);
          navigate("/items");
        } else if (r.type === "persona") {
          navigate("/personas");
        } else if (r.type === "comment") {
          navigate("/items");
        } else if (r.type === "chat_message") {
          navigate("/chat");
        }
        setOpen(false);
      },
    }));
  }, [searchResults, navigate, setSelectedItemId]);

  // ── Group all items ──────────────────────────────────────────
  const grouped = useMemo(() => {
    const allItems = [...staticItems, ...searchItems];
    const groups: { category: string; items: CommandItem[] }[] = [];
    const categoryOrder = ["navigation", "actions", "work_item", "persona", "comment", "chat_message"];

    for (const cat of categoryOrder) {
      const items = allItems.filter((i) => i.category === cat);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    }
    return groups;
  }, [staticItems, searchItems]);

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
          {searching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 text-xs font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto py-1">
          {flatItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searching ? "Searching..." : query.trim().length >= 2 ? "No results found." : "Type to search..."}
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
                      <div className="flex-1 min-w-0">
                        <span className="truncate block">{item.label}</span>
                        {item.snippet && (
                          <span
                            className="text-xs text-muted-foreground truncate block mt-0.5"
                            dangerouslySetInnerHTML={{ __html: sanitizeSnippet(item.snippet) }}
                          />
                        )}
                      </div>
                      {isSelected && (
                        <kbd className="ml-auto hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-xs text-muted-foreground shrink-0">
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
