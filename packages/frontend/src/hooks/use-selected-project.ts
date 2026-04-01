import { useEffect } from "react";
import type { ProjectId } from "@agentops/shared";
import { useUIStore } from "@/stores/ui-store";
import { useProject, useProjects } from "./use-projects";

export function useSelectedProject() {
  const selectedProjectId = useUIStore((s) => s.selectedProjectId) as ProjectId | null;
  const setSelectedProjectId = useUIStore((s) => s.setSelectedProjectId);
  const { data: project, isLoading, isError } = useProject(selectedProjectId);
  const { data: projects } = useProjects();

  // Fall back to first available project when stored ID is stale (404/error)
  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProjectId(projects[0]!.id);
      return;
    }
    if (selectedProjectId && isError && projects && projects.length > 0) {
      setSelectedProjectId(projects[0]!.id);
    }
  }, [selectedProjectId, isError, projects, setSelectedProjectId]);

  return {
    project: project ?? null,
    projectId: selectedProjectId,
    isLoading,
  };
}
