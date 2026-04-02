import { cn } from "@/lib/utils";
import { useSelectedProject } from "@/hooks/use-selected-project";

export function ScopeIndicator({ collapsed }: { collapsed: boolean }) {
  const { project, isGlobal } = useSelectedProject();

  const dotColor = isGlobal ? "bg-violet-500" : "bg-emerald-500";

  if (collapsed) {
    // Thin colored accent strip on the left edge
    return (
      <div className="relative h-6 w-full">
        <div className={cn("absolute left-0 top-1 bottom-1 w-[3px] rounded-r", dotColor)} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
      <div className={cn("h-2 w-2 shrink-0 rounded-full", dotColor)} />
      <span className="truncate">
        {project?.name ?? "Loading..."}
      </span>
    </div>
  );
}
