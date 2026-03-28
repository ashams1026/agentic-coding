import { useParams } from "react-router";

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Task Detail</h1>
      <p className="text-muted-foreground mt-2">Task {id} — context, dependencies, execution, rejection history.</p>
    </div>
  );
}
