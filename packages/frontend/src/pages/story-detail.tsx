import { useParams, useNavigate } from "react-router";
import { Separator } from "@/components/ui/separator";
import { useStory } from "@/hooks";
import type { StoryId } from "@agentops/shared";
import { StoryDetailHeader } from "@/features/story-detail/story-detail-header";
import { StoryDescription } from "@/features/story-detail/story-description";

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
          <div className="rounded-lg border border-dashed p-6">
            <p className="text-sm text-muted-foreground">
              Child tasks section — T2.3.3
            </p>
          </div>
          <div className="rounded-lg border border-dashed p-6">
            <p className="text-sm text-muted-foreground">
              Proposals section — T2.3.4
            </p>
          </div>
          <div className="rounded-lg border border-dashed p-6">
            <p className="text-sm text-muted-foreground">
              Comment stream — T2.3.5
            </p>
          </div>
          <div className="rounded-lg border border-dashed p-6">
            <p className="text-sm text-muted-foreground">
              Execution history — T2.3.6
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
