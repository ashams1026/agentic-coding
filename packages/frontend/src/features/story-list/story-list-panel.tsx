import { useState, useMemo } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStories, useTasks } from "@/hooks";
import { StoryListRow } from "./story-list-row";
import type { Story, StoryId, Task } from "@agentops/shared";

// ── Sort options ────────────────────────────────────────────────

type SortKey = "priority" | "updated" | "title" | "state";

const sortLabels: Record<SortKey, string> = {
  priority: "Priority",
  updated: "Last Updated",
  title: "Title",
  state: "State",
};

const priorityOrder: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };

function sortStories(stories: Story[], key: SortKey): Story[] {
  return [...stories].sort((a, b) => {
    switch (key) {
      case "priority":
        return (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
      case "updated":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "title":
        return a.title.localeCompare(b.title);
      case "state":
        return a.currentState.localeCompare(b.currentState);
      default:
        return 0;
    }
  });
}

// ── Task progress helper ────────────────────────────────────────

function buildTaskProgress(tasks: Task[]): Map<StoryId, { done: number; total: number }> {
  const map = new Map<StoryId, { done: number; total: number }>();
  for (const task of tasks) {
    const entry = map.get(task.storyId) ?? { done: 0, total: 0 };
    entry.total++;
    if (task.currentState === "Done") entry.done++;
    map.set(task.storyId, entry);
  }
  return map;
}

// ── Component ───────────────────────────────────────────────────

interface StoryListPanelProps {
  selectedStoryId: StoryId | null;
  onSelectStory: (id: StoryId) => void;
}

export function StoryListPanel({ selectedStoryId, onSelectStory }: StoryListPanelProps) {
  const { data: stories = [] } = useStories();
  const { data: tasks = [] } = useTasks();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("priority");

  const taskProgress = useMemo(() => buildTaskProgress(tasks), [tasks]);

  const filtered = useMemo(() => {
    let result = stories;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.currentState.toLowerCase().includes(q) ||
          s.labels.some((l) => l.toLowerCase().includes(q)),
      );
    }
    return sortStories(result, sortKey);
  }, [stories, search, sortKey]);

  return (
    <div className="flex h-full flex-col">
      {/* Search + sort bar */}
      <div className="flex items-center gap-2 p-3 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories..."
            className="h-8 pl-8 text-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs shrink-0">
              <ArrowUpDown className="h-3 w-3" />
              {sortLabels[sortKey]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(sortLabels) as SortKey[]).map((key) => (
              <DropdownMenuItem key={key} onClick={() => setSortKey(key)}>
                {sortLabels[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Story list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {search ? "No stories match your search." : "No stories yet."}
          </p>
        ) : (
          filtered.map((story) => {
            const progress = taskProgress.get(story.id) ?? { done: 0, total: 0 };
            return (
              <StoryListRow
                key={story.id}
                story={story}
                tasksDone={progress.done}
                tasksTotal={progress.total}
                isSelected={selectedStoryId === story.id}
                onClick={() => onSelectStory(story.id)}
              />
            );
          })
        )}
      </div>

      {/* Count */}
      <div className="border-t px-3 py-1.5">
        <span className="text-[10px] text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "story" : "stories"}
        </span>
      </div>
    </div>
  );
}
