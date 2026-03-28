import { useParams } from "react-router";

export function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Story Detail</h1>
      <p className="text-muted-foreground mt-2">Story {id} — description, child tasks, proposals, comments.</p>
    </div>
  );
}
