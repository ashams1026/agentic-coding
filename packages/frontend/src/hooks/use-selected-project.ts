import type { ProjectId } from "@agentops/shared";
import { useUIStore } from "@/stores/ui-store";
import { useProject } from "./use-projects";

export function useSelectedProject() {
  const selectedProjectId = useUIStore((s) => s.selectedProjectId) as ProjectId | null;
  const { data: project, isLoading } = useProject(selectedProjectId);

  return {
    project: project ?? null,
    projectId: selectedProjectId,
    isLoading,
  };
}
