import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Story, WorkflowState } from "@agentops/shared";

// ── Column header ────────────────────────────────────────────────

interface ColumnHeaderProps {
  state: WorkflowState;
  count: number;
}

function ColumnHeader({ state, count }: ColumnHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-1 pb-3">
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: state.color }}
      />
      <span className="text-sm font-medium">{state.name}</span>
      <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
        {count}
      </Badge>
    </div>
  );
}

// ── Placeholder story card (compact, until T2.2.2 builds the real one) ──

interface StoryCardPlaceholderProps {
  story: Story;
}

function StoryCardPlaceholder({ story }: StoryCardPlaceholderProps) {
  return (
    <Link to={`/stories/${story.id}`}>
      <Card className="cursor-pointer transition-colors hover:bg-accent/50">
        <CardContent className="px-3 py-2.5">
          <p className="text-sm font-medium leading-snug line-clamp-2">
            {story.title}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 uppercase"
            >
              {story.priority}
            </Badge>
            {story.labels.slice(0, 2).map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Column component ─────────────────────────���───────────────────

interface KanbanColumnProps {
  state: WorkflowState;
  stories: Story[];
}

export function KanbanColumn({ state, stories }: KanbanColumnProps) {
  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      <ColumnHeader state={state} count={stories.length} />
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-2 px-0.5 pb-2">
          {stories.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed py-8">
              <p className="text-xs text-muted-foreground">No stories</p>
            </div>
          ) : (
            stories.map((story) => (
              <StoryCardPlaceholder key={story.id} story={story} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
