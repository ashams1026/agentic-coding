import { useParams } from "react-router";
import type { ProjectId, Project } from "@agentops/shared";
import { useProject } from "./use-projects";

const GLOBAL_PROJECT_ID = "pj-global" as ProjectId;

/**
 * Reads projectId from the URL (/p/:projectId/...) and returns
 * the project context. Used inside ProjectLayout and its children.
 *
 * When no projectId is in the URL (Dashboard, App Settings), returns
 * projectId: null and project: null.
 */
export function useProjectFromUrl() {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();

  const effectiveId = urlProjectId ? (urlProjectId as ProjectId) : null;
  const { data: project, isLoading } = useProject(effectiveId);

  // If no projectId in URL, we're on a non-project page
  if (!effectiveId) {
    return {
      projectId: null as ProjectId | null,
      project: null as Project | null,
      isGlobal: false,
      isLoading: false,
    };
  }

  return {
    projectId: effectiveId,
    project: (project ?? null) as Project | null,
    isGlobal: project?.isGlobal ?? effectiveId === GLOBAL_PROJECT_ID,
    isLoading,
  };
}
