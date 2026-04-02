import { useEffect } from "react";
import type { ProjectId } from "@agentops/shared";
import { useUIStore } from "@/stores/ui-store";
import { useProject, useProjects } from "./use-projects";

const GLOBAL_PROJECT_ID = "pj-global";

export function useSelectedProject() {
  const selectedProjectId = useUIStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useUIStore((s) => s.setSelectedProjectId);
  const { data: projects } = useProjects();

  // Default to global project when nothing selected or stored ID is stale
  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      const globalProject = projects.find((p) => p.isGlobal);
      setSelectedProjectId(globalProject?.id ?? projects[0]!.id);
      return;
    }
    if (selectedProjectId && projects && projects.length > 0) {
      const exists = projects.some((p) => p.id === selectedProjectId);
      if (!exists) {
        const globalProject = projects.find((p) => p.isGlobal);
        setSelectedProjectId(globalProject?.id ?? projects[0]!.id);
      }
    }
  }, [selectedProjectId, projects, setSelectedProjectId]);

  const effectiveId = selectedProjectId ?? GLOBAL_PROJECT_ID;
  const { data: project, isLoading } = useProject(effectiveId as ProjectId);

  return {
    project: project ?? null,
    projectId: effectiveId as ProjectId,
    isLoading,
    isGlobal: project?.isGlobal ?? (effectiveId === GLOBAL_PROJECT_ID),
  };
}
