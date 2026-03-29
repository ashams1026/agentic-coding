import { useState } from "react";
import { PersonaList } from "@/features/persona-manager/persona-list";
import type { PersonaId } from "@agentops/shared";

export function PersonaManagerPage() {
  const [_editingId, setEditingId] = useState<PersonaId | null>(null);

  // For now, just the list view. Editor will be built in T2.9.2.
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Persona Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your AI agent team — prompts, tools, and models.
        </p>
      </div>
      <PersonaList onEdit={setEditingId} />
    </div>
  );
}
