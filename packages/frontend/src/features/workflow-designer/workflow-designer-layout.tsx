import { useState } from "react";
import { GitBranch } from "lucide-react";
import { WorkflowListSidebar } from "./workflow-list-sidebar";
import { StateMachineCanvas } from "./state-machine-canvas";
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

      {/* Main area — state machine canvas */}
      <div className="flex-1 overflow-hidden">
        {selectedWorkflow ? (
          <StateMachineCanvas workflow={selectedWorkflow} />
        ) : (
          <div className="flex h-full items-center justify-center bg-background">
            <div className="text-center space-y-2">
              <GitBranch className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-medium">No workflow selected</p>
              <p className="text-xs text-muted-foreground">
                Select a workflow from the sidebar or create a new one.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
