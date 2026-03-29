import { useParams, useNavigate } from "react-router";
import { Separator } from "@/components/ui/separator";
import { useStory } from "@/hooks";
import type { StoryId } from "@agentops/shared";
import { StoryDetailHeader } from "@/features/story-detail/story-detail-header";
import { StoryDescription } from "@/features/story-detail/story-description";
import { ChildTasksSection } from "@/features/story-detail/child-tasks-section";
import { ProposalsSection } from "@/features/story-detail/proposals-section";
import { CommentStream } from "@/features/story-detail/comment-stream";
import { ExecutionTimeline } from "@/features/story-detail/execution-timeline";

export function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: story, isLoading } = useStory(id as StoryId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading story...</p>
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
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6 space-y-6">
        <StoryDetailHeader
          story={story}
          onClose={() => navigate("/board")}
        />
        <Separator />

        {/* Content sections */}
        <div className="space-y-6">
          <StoryDescription story={story} />
          <ProposalsSection story={story} />
          <ChildTasksSection story={story} />
          <CommentStream targetId={story.id} targetType="story" />
          <ExecutionTimeline targetId={story.id} />
        </div>
      </div>
    </div>
  );
}
