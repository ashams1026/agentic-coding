import { useEffect } from "react";
import type { ProjectId } from "@agentops/shared";
import { useUIStore } from "@/stores/ui-store";
import { useProject, useProjects } from "./use-projects";

export function useSelectedProject() {
  const selectedProjectId = useUIStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useUIStore((s) => s.setSelectedProjectId);
  const isGlobalScope = selectedProjectId === "__all__";
  const { data: project, isLoading, isError } = useProject(isGlobalScope ? null : selectedProjectId as ProjectId | null);
  const { data: projects } = useProjects();

  // Fall back to first available project when stored ID is stale (404/error)
  // Skip when user has explicitly chosen "All Projects" (global scope)
  useEffect(() => {
    if (isGlobalScope) return;
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProjectId(projects[0]!.id);
      return;
    }
    if (selectedProjectId && isError && projects && projects.length > 0) {
      setSelectedProjectId(projects[0]!.id);
    }
  }, [isGlobalScope, selectedProjectId, isError, projects, setSelectedProjectId]);

  return {
    project: isGlobalScope ? null : (project ?? null),
    projectId: isGlobalScope ? null : (selectedProjectId as ProjectId | null),
    isLoading: isGlobalScope ? false : isLoading,
  };
}
