import { Link } from "react-router";
import { ChevronDown, ExternalLink, FileText } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Task, Story } from "@agentops/shared";

// ── Component ───────────────────────────────────────────────────

interface InheritedContextProps {
  task: Task;
  story: Story | undefined;
}

export function InheritedContext({ task, story }: InheritedContextProps) {
  const hasContent =
    task.inheritedContext || story?.description || story?.context.acceptanceCriteria;

  if (!hasContent) return null;

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group py-1">
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
        <p className="text-sm font-medium text-muted-foreground">
          Inherited from{" "}
          {story ? (
            <Link
              to={`/stories/${story.id}`}
              className="text-foreground hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {story.title}
            </Link>
          ) : (
            <span className="text-foreground">Parent Story</span>
          )}
        </p>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 rounded-lg border bg-muted/20 px-4 py-3 space-y-4">
          {/* Inherited context (from Tech Lead notes / task creation) */}
          {task.inheritedContext && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Context
                </p>
              </div>
              <p className="text-sm whitespace-pre-wrap">
                {task.inheritedContext}
              </p>
            </div>
          )}

          {/* Story description excerpt */}
          {story?.description && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Story Description
                </p>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                {story.description}
              </p>
            </div>
          )}

          {/* Acceptance criteria */}
          {story?.context.acceptanceCriteria && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Acceptance Criteria
                </p>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                {story.context.acceptanceCriteria}
              </p>
            </div>
          )}

          {/* Link to full story */}
          {story && (
            <Link
              to={`/stories/${story.id}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              <ExternalLink className="h-3 w-3" />
              View full story
            </Link>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
