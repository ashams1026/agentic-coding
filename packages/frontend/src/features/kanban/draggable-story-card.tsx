import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Story } from "@agentops/shared";
import { StoryCard } from "./story-card";
import type { StoryCardData } from "./story-card";

interface DraggableStoryCardProps {
  story: Story;
  data: StoryCardData;
}

export function DraggableStoryCard({ story, data }: DraggableStoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: story.id,
      data: { story },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : undefined,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <StoryCard story={story} data={data} />
    </div>
  );
}
