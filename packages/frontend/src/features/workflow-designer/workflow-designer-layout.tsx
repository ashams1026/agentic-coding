import { useState } from "react";
import { GitBranch } from "lucide-react";
import { WorkflowListSidebar } from "./workflow-list-sidebar";
import { useWorkflows } from "@/hooks";
import type { WorkflowId } from "@agentops/shared";

export function WorkflowDesignerLayout() {
  const { data: workflows } = useWorkflows();
  const [selectedId, setSelectedId] = useState<WorkflowId | null>(null);

  // Auto-select first workflow if none selected
  const effectiveId = selectedId ?? workflows?.[0]?.id ?? null;
  const selectedWorkflow = workflows?.find((w) => w.id === effectiveId) ?? null;

  return (
    <div className="flex h-full">
      {/* Left sidebar — workflow list */}
      <div className="w-[260px] shrink-0 border-r border-border bg-card">
        <WorkflowListSidebar
          selectedId={effectiveId}
          onSelect={setSelectedId}
        />
      </div>

      {/* Main area — canvas placeholder (T2.8.2 will replace this) */}
      <div className="flex-1 flex items-center justify-center bg-background">
        {selectedWorkflow ? (
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">{selectedWorkflow.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedWorkflow.states.length} states &middot; {selectedWorkflow.transitions.length} transitions
            </p>
            <p className="text-xs text-muted-foreground">
              Canvas editor will be built in T2.8.2
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <GitBranch className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm font-medium">No workflow selected</p>
            <p className="text-xs text-muted-foreground">
              Select a workflow from the sidebar or create a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
