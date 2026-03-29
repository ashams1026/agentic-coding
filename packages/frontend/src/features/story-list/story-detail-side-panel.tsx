import { X, ExternalLink } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStory } from "@/hooks";
import { StoryDetailHeader } from "@/features/story-detail/story-detail-header";
import { StoryDescription } from "@/features/story-detail/story-description";
import { ChildTasksSection } from "@/features/story-detail/child-tasks-section";
import { ProposalsSection } from "@/features/story-detail/proposals-section";
import { CommentStream } from "@/features/common/comment-stream";
import { ExecutionTimeline } from "@/features/common/execution-timeline";
import { StoryMetadata } from "@/features/story-detail/story-metadata";
import type { StoryId } from "@agentops/shared";

// ── Component ───────────────────────────────────────────────────

interface StoryDetailSidePanelProps {
  storyId: StoryId;
  onClose: () => void;
}

export function StoryDetailSidePanel({ storyId, onClose }: StoryDetailSidePanelProps) {
  const { data: story, isLoading } = useStory(storyId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Story not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold truncate">{story.title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link to={`/stories/${story.id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          <StoryDetailHeader story={story} onClose={onClose} />
          <Separator />
          <StoryDescription story={story} />
          <ProposalsSection story={story} />
          <ChildTasksSection story={story} />
          <CommentStream targetId={story.id} targetType="story" />
          <ExecutionTimeline targetId={story.id} />
          <StoryMetadata story={story} />
        </div>
      </ScrollArea>
    </div>
  );
}
