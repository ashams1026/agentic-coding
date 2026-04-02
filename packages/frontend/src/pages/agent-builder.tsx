import { useState } from "react";
import { AgentList } from "@/features/agent-builder/agent-list";
import { AgentDetailPanel } from "@/features/agent-builder/agent-detail-panel";
import { cn } from "@/lib/utils";
import type { AgentId } from "@agentops/shared";

export function AgentBuilderPage() {
  const [selectedId, setSelectedId] = useState<AgentId | null>(null);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className="text-2xl font-bold">Agent Builder</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your AI agent team — prompts, tools, and models.
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Card grid */}
        <div
          className={cn(
            "overflow-y-auto px-6 pb-6 transition-all duration-200",
            selectedId ? "w-[45%]" : "w-full",
          )}
        >
          <AgentList selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        {/* Detail panel */}
        <div
          className={cn(
            "border-l border-border overflow-hidden transition-all duration-200",
            selectedId ? "w-[55%]" : "w-0 border-l-0",
          )}
        >
          {selectedId && (
            <AgentDetailPanel
              agentId={selectedId}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
